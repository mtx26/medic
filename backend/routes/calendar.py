from . import api
from logger import backend_logger as logger
from auth import verify_firebase_token
from datetime import datetime, timezone
from flask import jsonify, request
from firebase_admin import firestore
from function import generate_schedule
import secrets

db = firestore.client()

# Route pour gérer les calendriers
@api.route("/api/calendars", methods=["GET", "POST", "DELETE", "PUT"])
def handle_calendars():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        # Route pour récupérer tous les calendriers
        if request.method == "GET":
            calendars_ref = db.collection("users").document(uid).collection("calendars")
            calendars = []
            for calendar in calendars_ref.stream():
                calendar_data = calendar.to_dict()
                calendars.append(calendar_data)
            logger.info(f"[CALENDAR_GET] {len(calendars)} calendriers récupérés pour {uid}.")
            return jsonify({"calendars": calendars}), 200

        # Route pour créer un calendrier
        elif request.method == "POST":
            calendar_name = request.json.get("calendarName")
            if not calendar_name:
                logger.warning(f"[CALENDAR_CREATE] Nom de calendrier manquant pour {uid}.")
                return jsonify({"error": "Nom de calendrier manquant"}), 400

            calendar_id = secrets.token_hex(16)

            doc = db.collection("users").document(uid).collection("calendars").document(calendar_id).get()

            if doc.exists:
                logger.warning(f"[CALENDAR_EXISTS] Tentative de création d'un calendrier déjà existant : '{calendar_name}' pour {uid}.")
                return jsonify({"message": "Ce calendrier existe déjà", "status": "error"}), 409
            

            db.collection("users").document(uid).collection("calendars").document(calendar_id).set({
                "calendar_id": calendar_id,
                "calendar_name": calendar_name,
                "medicines": "",
                "last_updated": datetime.now(timezone.utc).isoformat()
            }, merge=True)
            
            logger.info(f"[CALENDAR_CREATE] Calendrier '{calendar_name}' créé pour {uid}.")
            return jsonify({"message": "Calendrier mis à jour", "status": "ok"})

        # Route pour supprimer un calendrier
        elif request.method == "DELETE":
            calendar_id = request.json.get("calendarId")

            doc_ref = db.collection("users").document(uid).collection("calendars").document(calendar_id)
            if not doc_ref.get().exists:
                logger.warning(f"[CALENDAR_DELETE] Calendrier '{calendar_id}' introuvable pour {uid}.")
                return jsonify({"error": "Calendrier introuvable"}), 404

            doc_ref.delete()
            # pour le calendrier partagé
            shared_tokens_ref = db.collection("shared_tokens").get()

            for doc in shared_tokens_ref:
                if doc.to_dict().get("owner_uid") == uid:
                    if doc.to_dict().get("calendar_id") == calendar_id:
                        db.collection("shared_tokens").document(doc.id).delete()

            logger.info(f"[CALENDAR_DELETE] Calendrier '{calendar_id}' supprimé pour {uid}.")
            return jsonify({"message": "Calendrier supprimé", "status": "ok"})
            

        # Route pour renommer un calendrier
        elif request.method == "PUT":
            # pour le calendrier personnel
            data = request.get_json(force=True)
            calendar_id = data.get("calendarId")

            
            doc_ref = db.collection("users").document(uid).collection("calendars").document(calendar_id)

            if not doc_ref.get().exists:
                logger.warning(f"[CALENDAR_RENAME] Calendrier '{calendar_id}' introuvable pour {uid}.")
                return jsonify({"error": "Calendrier introuvable"}), 404

            old_calendar_name = doc_ref.get().to_dict().get("calendar_name")
            new_calendar_name = data.get("newCalendarName")

            if not old_calendar_name or not new_calendar_name:
                logger.warning(f"[CALENDAR_RENAME] Noms invalides reçus pour {uid}.")
                return jsonify({"error": "Nom de calendrier invalide"}), 400

            if old_calendar_name == new_calendar_name:
                logger.warning(f"[CALENDAR_RENAME] Nom inchangé pour {uid} : {old_calendar_name}.")
                return jsonify({"error": "Le nom du calendrier n'a pas changé"}), 400

            doc_ref.update({
                "calendar_name": new_calendar_name
            })
            

            # pour le calendrier partagé
            shared_tokens_ref = db.collection("shared_tokens").get()
            for doc in shared_tokens_ref:
                if doc.to_dict().get("owner_uid") == uid:
                    if doc.to_dict().get("calendar_name") == old_calendar_name:
                        db.collection("shared_tokens").document(doc.id).update({
                            "calendar_name": new_calendar_name
                        })   

            logger.info(f"[CALENDAR_RENAME] Calendrier '{old_calendar_name}' renommé en '{new_calendar_name}' pour {uid}.")
            return jsonify({"message": "Calendrier renommé avec succès"}), 200


    except Exception as e:
        logger.exception("[CALENDAR_ERROR] Erreur dans /api/calendars")
        return jsonify({"error": "Erreur lors de la gestion des calendriers."}), 500
   

# Route pour générer le calendrier 
@api.route("/api/calendars/<calendar_id>/calendar", methods=["GET"])
def get_calendar(calendar_id):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).get()
        if doc.exists:
            data = doc.to_dict()
            medicines = data.get("medicines", [])
            logger.info(f"[CALENDAR_LOAD] Médicaments récupérés pour {owner_uid}.")
        else:
            logger.warning(f"[CALENDAR_LOAD] Document introuvable pour l'utilisateur {owner_uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404
        
        start_str = request.args.get("startTime")
        if not start_str:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_str, "%Y-%m-%d").date()

        schedule = generate_schedule(start_date, medicines)
        logger.info(f"[CALENDAR_GENERATE] Calendrier généré avec succès pour {owner_uid}.")
        return jsonify({"schedule": schedule, "message": "Calendrier généré avec succès"}), 200

    except Exception as e:
        logger.exception(f"[CALENDAR_GENERATE_ERROR] Erreur dans /api/calendars/${calendar_name}/calendar")
        return jsonify({"error": "Erreur lors de la génération du calendrier."}), 500
