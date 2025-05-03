from . import api
from logger import backend_logger as logger
from auth import verify_firebase_token
from datetime import datetime, timezone
from flask import jsonify, request
from firebase_admin import firestore
from function import generate_schedule
import secrets

db = firestore.client()

# Route pour récupérer les calendriers de l'utilisateur
@api.route("/api/calendars", methods=["GET"])
def handle_calendars():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        calendars_ref = db.collection("users").document(uid).collection("calendars")
        calendars = [calendar.to_dict() for calendar in calendars_ref.stream()]
        logger.info(f"[CALENDAR_GET] {len(calendars)} calendriers récupérés pour {uid}.")
        return jsonify({"calendars": calendars}), 200

    except Exception:
        logger.exception("[CALENDAR_ERROR] Erreur dans GET /api/calendars")
        return jsonify({"error": "Erreur lors de la récupération des calendriers."}), 500


# Route pour créer un calendrier
@api.route("/api/calendars", methods=["POST"])
def handle_create_calendar():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        calendar_name = request.json.get("calendarName")

        if not calendar_name:
            logger.warning(f"[CALENDAR_CREATE] Nom de calendrier manquant pour {uid}.")
            return jsonify({"error": "Nom de calendrier manquant", "code": "MISSING_CALENDAR_NAME"}), 400

        calendar_id = secrets.token_hex(16)
        doc = db.collection("users").document(uid).collection("calendars").document(calendar_id).get()

        if doc.exists:
            logger.warning(f"[CALENDAR_EXISTS] Tentative de création d'un calendrier déjà existant : '{calendar_name}' pour {uid}.")
            return jsonify({"error": "Ce calendrier existe déjà", "code": "CALENDAR_ALREADY_EXISTS"}), 409

        db.collection("users").document(uid).collection("calendars").document(calendar_id).set({
            "calendar_id": calendar_id,
            "calendar_name": calendar_name,
            "medicines": "",
            "last_updated": firestore.SERVER_TIMESTAMP
        }, merge=True)

        logger.info(f"[CALENDAR_CREATE] Calendrier '{calendar_name}' créé pour {uid}.")
        return jsonify({"message": "Calendrier créé avec succès", "code": "CALENDAR_CREATED_SUCCESS"}), 200

    except Exception:
        logger.exception("[CALENDAR_CREATE_ERROR] Erreur dans POST /api/calendars")
        return jsonify({"error": "Erreur lors de la création du calendrier.", "code": "CALENDAR_CREATE_ERROR"}), 500


# Route pour supprimer un calendrier
@api.route("/api/calendars", methods=["DELETE"])
def handle_delete_calendar():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        calendar_id = request.json.get("calendarId")

        doc_ref = db.collection("users").document(uid).collection("calendars").document(calendar_id)
        if not doc_ref.get().exists:
            logger.warning(f"[CALENDAR_DELETE] Calendrier '{calendar_id}' introuvable pour {uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404

        doc_ref.delete()

        for doc in db.collection("shared_tokens").get():
            token_data = doc.to_dict()
            if token_data.get("owner_uid") == uid and token_data.get("calendar_id") == calendar_id:
                db.collection("shared_tokens").document(doc.id).delete()

        logger.info(f"[CALENDAR_DELETE] Calendrier '{calendar_id}' supprimé pour {uid}.")
        return jsonify({"message": "Calendrier supprimé avec succès"}), 200

    except Exception:
        logger.exception("[CALENDAR_DELETE_ERROR] Erreur dans DELETE /api/calendars")
        return jsonify({"error": "Erreur lors de la suppression du calendrier."}), 500


# Route pour renommer un calendrier
@api.route("/api/calendars", methods=["PUT"])
def handle_rename_calendar():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        data = request.get_json(force=True)
        calendar_id = data.get("calendarId")
        new_calendar_name = data.get("newCalendarName")

        doc_ref = db.collection("users").document(uid).collection("calendars").document(calendar_id)
        if not doc_ref.get().exists:
            logger.warning(f"[CALENDAR_RENAME] Calendrier '{calendar_id}' introuvable pour {uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404

        old_calendar_name = doc_ref.get().to_dict().get("calendar_name")
        if not old_calendar_name or not new_calendar_name:
            logger.warning(f"[CALENDAR_RENAME] Noms invalides reçus pour {uid}.")
            return jsonify({"error": "Nom de calendrier invalide", "code": "INVALID_CALENDAR_NAME"}), 400

        if old_calendar_name == new_calendar_name:
            logger.warning(f"[CALENDAR_RENAME] Nom inchangé pour {uid} : {old_calendar_name}.")
            return jsonify({"error": "Le nom du calendrier n'a pas changé", "code": "UNCHANGED_CALENDAR_NAME"}), 400

        doc_ref.update({"calendar_name": new_calendar_name})

        for doc in db.collection("shared_tokens").get():
            token_data = doc.to_dict()
            if token_data.get("owner_uid") == uid and token_data.get("calendar_name") == old_calendar_name:
                db.collection("shared_tokens").document(doc.id).update({"calendar_name": new_calendar_name})

        logger.info(f"[CALENDAR_RENAME] Calendrier '{old_calendar_name}' renommé en '{new_calendar_name}' pour {uid}.")
        return jsonify({"message": "Calendrier renommé avec succès", "code": "CALENDAR_RENAMED_SUCCESS"}), 200

    except Exception:
        logger.exception("[CALENDAR_RENAME_ERROR] Erreur dans PUT /api/calendars")
        return jsonify({"error": "Erreur lors du renommage du calendrier.", "code": "CALENDAR_RENAME_ERROR"}), 500
  

# Route pour générer le calendrier 
@api.route("/api/calendars/<calendar_id>/calendar", methods=["GET"])
def handle_calendar(calendar_id):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id)
        if not doc.get().exists:
            logger.warning(f"[CALENDAR_LOAD] Document introuvable pour l'utilisateur {owner_uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404
        
        medicines = doc.get().to_dict().get("medicines", [])
        logger.info(f"[CALENDAR_LOAD] Médicaments récupérés pour {owner_uid}.")
        
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
