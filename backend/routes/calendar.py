from . import api
from logger import backend_logger as logger
from auth import verify_firebase_token
from datetime import datetime, timezone
from flask import jsonify, request
from firebase_admin import firestore
from function import generate_schedule

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
            calendars = [doc.id for doc in calendars_ref.stream()]
            logger.info(f"[CALENDAR_GET] {len(calendars)} calendriers récupérés pour {uid}.")
            return jsonify({"calendars": calendars}), 200

        # Route pour créer un calendrier
        elif request.method == "POST":
            calendar_name = request.json.get("calendarName")
            if not calendar_name:
                logger.warning(f"[CALENDAR_CREATE] Nom de calendrier manquant pour {uid}.")
                return jsonify({"error": "Nom de calendrier manquant"}), 400
            calendar_id = calendar_name.lower()
            doc = db.collection("users").document(uid).collection("calendars").document(calendar_id).get()

            if doc.exists:
                logger.warning(f"[CALENDAR_EXISTS] Tentative de création d'un calendrier déjà existant : '{calendar_name}' pour {uid}.")
                return jsonify({"message": "Ce calendrier existe déjà", "status": "error"}), 409
            

            db.collection("users").document(uid).collection("calendars").document(calendar_id).set({
                "medicines": "",
                "last_updated": datetime.now(timezone.utc).isoformat()
            }, merge=True)
            
            logger.info(f"[CALENDAR_CREATE] Calendrier '{calendar_name}' créé pour {uid}.")
            return jsonify({"message": "Calendrier mis à jour", "status": "ok"})

        # Route pour supprimer un calendrier
        elif request.method == "DELETE":
            calendar_name = request.json.get("calendarName")
            db.collection("users").document(uid).collection("calendars").document(calendar_name).delete()
            logger.info(f"[CALENDAR_DELETE] Calendrier '{calendar_name}' supprimé pour {uid}.")
            # pour le calendrier partagé
            shared_tokens_ref = db.collection("shared_tokens").get()
            for doc in shared_tokens_ref:
                if doc.to_dict().get("calendar_owner_uid") == uid:
                    if doc.to_dict().get("calendar_name") == calendar_name:
                        db.collection("shared_tokens").document(doc.id).delete()
            return jsonify({"message": "Calendrier supprimé", "status": "ok"})
            

        # Route pour renommer un calendrier
        elif request.method == "PUT":
            # pour le calendrier personnel
            data = request.get_json(force=True)
            old_calendar_name = data.get("oldCalendarName")
            new_calendar_name = data.get("newCalendarName")
            new_calendar_name = new_calendar_name.lower()

            if not old_calendar_name or not new_calendar_name:
                logger.warning(f"[CALENDAR_RENAME] Noms invalides reçus pour {uid}.")
                return jsonify({"error": "Nom de calendrier invalide"}), 400

            if old_calendar_name == new_calendar_name:
                logger.warning(f"[CALENDAR_RENAME] Nom inchangé pour {uid} : {old_calendar_name}.")
                return jsonify({"error": "Le nom du calendrier n'a pas changé"}), 400
            
            # pour le calendrier partagé
            shared_tokens_ref = db.collection("shared_tokens").get()
            for doc in shared_tokens_ref:
                if doc.to_dict().get("calendar_owner_uid") == uid:
                    if doc.to_dict().get("calendar_name") == old_calendar_name:
                        db.collection("shared_tokens").document(doc.id).update({
                            "calendar_name": new_calendar_name
                        })

            doc_ref = db.collection("users").document(uid).collection("calendars").document(old_calendar_name).get()

            if doc_ref.exists:
                db.collection("users").document(uid).collection("calendars").document(new_calendar_name).set(doc_ref.to_dict())
                db.collection("users").document(uid).collection("calendars").document(old_calendar_name).delete()
                logger.info(f"[CALENDAR_RENAME] Renommé {old_calendar_name} -> {new_calendar_name} pour {uid}.")
                return jsonify({"message": "Calendrier renommé avec succès"}), 200
            else:
                logger.warning(f"[CALENDAR_RENAME] Calendrier '{old_calendar_name}' introuvable pour {uid}.")
                return jsonify({"error": "Calendrier introuvable"}), 404
            
            


    except Exception as e:
        logger.exception("[CALENDAR_ERROR] Erreur dans /api/calendars")
        return jsonify({"error": "Erreur lors de la gestion des calendriers."}), 500
   

# Route pour générer le calendrier 
@api.route("/api/calendars/<calendar_name>/calendar", methods=["GET"])
def get_calendar(calendar_name):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        doc = db.collection("users").document(uid).collection("calendars").document(calendar_name).get()
        if doc.exists:
            data = doc.to_dict()
            medicines = data.get("medicines", [])
            logger.info(f"[CALENDAR_LOAD] Médicaments récupérés pour {uid}.")
        else:
            logger.warning(f"[CALENDAR_LOAD] Document introuvable pour l'utilisateur {uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404
        
        start_str = request.args.get("startTime")
        if not start_str:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_str, "%Y-%m-%d").date()

        schedule = generate_schedule(start_date, medicines)
        logger.info("[CALENDAR_GENERATE] Calendrier généré avec succès.")
        return jsonify(schedule)

    except Exception as e:
        logger.exception(f"[CALENDAR_GENERATE_ERROR] Erreur dans /api/calendars/${calendar_name}/calendar")
        return jsonify({"error": "Erreur lors de la génération du calendrier."}), 500
