from . import api
from logger import log_backend as logger
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
        logger.info("Calendriers récupérés avec succès", {
            "origin": "CALENDAR_FETCH_SUCCESS",
            "uid": uid,
            "count": len(calendars)
        })
        return jsonify({"calendars": calendars, "message": "Calendriers récupérés avec succès"}), 200

    except Exception as e:
        logger.exception("Erreur lors de la récupération des calendriers.", {
            "origin": "CALENDAR_FETCH_ERROR",
            "error": str(e),
            "uid": uid
        })
        return jsonify({"error": "Erreur lors de la récupération des calendriers.", "code": "CALENDAR_ERROR"}), 500


# Route pour créer un calendrier
@api.route("/api/calendars", methods=["POST"])
def handle_create_calendar():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        calendar_name = request.json.get("calendarName")

        if not calendar_name:
            logger.warning("Nom de calendrier manquant.", {
                "origin": "CALENDAR_CREATE_ERROR",
                "uid": uid,
                "calendar_name": calendar_name
            })
            return jsonify({"error": "Nom de calendrier manquant", "code": "MISSING_CALENDAR_NAME"}), 400

        calendar_id = secrets.token_hex(16)
        doc = db.collection("users").document(uid).collection("calendars").document(calendar_id).get()

        if doc.exists:
            logger.warning("Tentative de création d'un calendrier déjà existant.", {
                "origin": "CALENDAR_CREATE_ERROR",
                "uid": uid,
                "calendar_name": calendar_name
            })
            return jsonify({"error": "Ce calendrier existe déjà", "code": "CALENDAR_ALREADY_EXISTS"}), 409

        db.collection("users").document(uid).collection("calendars").document(calendar_id).set({
            "calendar_id": calendar_id,
            "calendar_name": calendar_name,
            "medicines": "",
            "last_updated": firestore.SERVER_TIMESTAMP
        }, merge=True)

        logger.info("Calendrier créé.", {
            "origin": "CALENDAR_CREATE_SUCCESS",
            "uid": uid,
            "calendar_name": calendar_name
        })
        return jsonify({"message": "Calendrier créé avec succès", "code": "CALENDAR_CREATED_SUCCESS"}), 200

    except Exception as e:
        logger.exception("Erreur dans POST /api/calendars", {
            "origin": "CALENDAR_CREATE_ERROR",
            "uid": uid,
            "calendar_name": calendar_name,
            "error": str(e)
        })
        return jsonify({"error": "Erreur lors de la création du calendrier.", "code": "CALENDAR_CREATE_ERROR"}), 500


# Route pour supprimer un calendrier
@api.route("/api/calendars", methods=["DELETE"])
def handle_delete_calendar():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        calendar_id = request.json.get("calendarId")

        if not calendar_id:
            logger.warning("Identifiant de calendrier manquant.", {
                "origin": "CALENDAR_DELETE_ERROR",
                "uid": uid,
                "calendar_id": calendar_id
            })
            return jsonify({"error": "Identifiant de calendrier manquant", "code": "MISSING_CALENDAR_ID"}), 400


        doc_ref = db.collection("users").document(uid).collection("calendars").document(calendar_id)
        if not doc_ref.get().exists:
            logger.warning("Calendrier introuvable.", {
                "origin": "CALENDAR_DELETE_ERROR",
                "uid": uid,
                "calendar_id": calendar_id
            })
            return jsonify({"error": "Calendrier introuvable", "code": "CALENDAR_NOT_FOUND"}), 404

        doc_ref.delete()

        for doc in db.collection("shared_tokens").get():
            token_data = doc.to_dict()
            if token_data.get("owner_uid") == uid and token_data.get("calendar_id") == calendar_id:
                db.collection("shared_tokens").document(doc.id).delete()

        logger.info("Calendrier supprimé.", {
            "origin": "CALENDAR_DELETE_SUCCESS",
            "uid": uid,
            "calendar_id": calendar_id
        })
        return jsonify({"message": "Calendrier supprimé avec succès", "code": "CALENDAR_DELETED_SUCCESS"}), 200

    except Exception as e:
        logger.exception("Erreur dans DELETE /api/calendars", {
            "origin": "CALENDAR_DELETE_ERROR",
            "uid": uid,
            "calendar_id": calendar_id,
            "error": str(e)
        })
        return jsonify({"error": "Erreur lors de la suppression du calendrier.", "code": "CALENDAR_DELETE_ERROR"}), 500


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
            logger.warning("Calendrier introuvable | Error: Calendrier introuvable.", {
                "origin": "CALENDAR_RENAME_ERROR",
                "uid": uid,
                "calendar_id": calendar_id,
                "new_calendar_name": new_calendar_name
            })
            return jsonify({"error": "Calendrier introuvable", "code": "CALENDAR_NOT_FOUND"}), 404

        old_calendar_name = doc_ref.get().to_dict().get("calendar_name")
        if not old_calendar_name or not new_calendar_name:
            logger.warning("Noms invalides reçus.", {
                "origin": "CALENDAR_RENAME_ERROR",
                "uid": uid,
                "calendar_id": calendar_id,
                "old_calendar_name": old_calendar_name,
                "new_calendar_name": new_calendar_name
            })
            return jsonify({"error": "Nom de calendrier invalide", "code": "INVALID_CALENDAR_NAME"}), 400

        if old_calendar_name == new_calendar_name:
            logger.warning("Nom inchangé.", {
                "origin": "CALENDAR_RENAME_ERROR",
                "uid": uid,
                "calendar_id": calendar_id,
                "old_calendar_name": old_calendar_name,
                "new_calendar_name": new_calendar_name
            })
            return jsonify({"error": "Le nom du calendrier n'a pas changé", "code": "UNCHANGED_CALENDAR_NAME"}), 400

        doc_ref.update({"calendar_name": new_calendar_name})

        for doc in db.collection("shared_tokens").get():
            token_data = doc.to_dict()
            if token_data.get("owner_uid") == uid and token_data.get("calendar_name") == old_calendar_name:
                db.collection("shared_tokens").document(doc.id).update({"calendar_name": new_calendar_name})

        logger.info("Calendrier renommé.", {
            "origin": "CALENDAR_RENAME_SUCCESS",
            "uid": uid,
            "calendar_id": calendar_id,
            "old_calendar_name": old_calendar_name,
            "new_calendar_name": new_calendar_name
        })
        return jsonify({"message": "Calendrier renommé avec succès", "code": "CALENDAR_RENAMED_SUCCESS"}), 200

    except Exception as e:
        logger.exception("Erreur dans PUT /api/calendars", {
            "origin": "CALENDAR_RENAME_ERROR",
            "uid": uid,
            "calendar_id": calendar_id,
            "old_calendar_name": old_calendar_name,
            "new_calendar_name": new_calendar_name,
            "error": str(e)
        })
        return jsonify({"error": "Erreur lors du renommage du calendrier.", "code": "CALENDAR_RENAME_ERROR"}), 500
  

# Route pour générer le calendrier 
@api.route("/api/calendars/<calendar_id>/calendar", methods=["GET"])
def handle_calendar(calendar_id):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id)
        if not doc.get().exists:
            logger.warning("Document introuvable.", {
                "origin": "CALENDAR_LOAD_ERROR",
                "uid": owner_uid,
                "calendar_id": calendar_id
            })
            return jsonify({"error": "Calendrier introuvable", "code": "CALENDAR_NOT_FOUND"}), 404
        
        medicines = doc.get().to_dict().get("medicines", [])
        
        start_str = request.args.get("startTime")
        if not start_str:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_str, "%Y-%m-%d").date()

        schedule = generate_schedule(start_date, medicines)
        logger.info("Calendrier généré avec succès.", {
            "origin": "CALENDAR_GENERATE_SUCCESS",
            "uid": owner_uid,
            "calendar_id": calendar_id,
            "medicines": len(medicines)
        })
        return jsonify({"schedule": schedule, "message": "Calendrier généré avec succès", "code": "CALENDAR_GENERATED_SUCCESS"}), 200

    except Exception as e:
        logger.exception(f"Erreur dans /api/calendars/{calendar_id}/calendar", {
            "origin": "CALENDAR_GENERATE_ERROR",
            "uid": owner_uid,
            "calendar_id": calendar_id,
            "medicines": len(medicines),
            "error": str(e)
        })
        return jsonify({"error": "Erreur lors de la génération du calendrier.", "code": "CALENDAR_GENERATE_ERROR"}), 500
