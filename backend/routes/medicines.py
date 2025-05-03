from flask import jsonify, request
from logger import log_backend as logger
from auth import verify_firebase_token
from datetime import datetime, timezone, timedelta
from . import api
from firebase_admin import firestore
from function import verify_calendar_share

db = firestore.client()


# Obtenir les médicaments d’un calendrier
@api.route("/api/calendars/<calendar_id>/medicines", methods=["GET"])
def get_medicines(calendar_id):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        doc = db.collection("users").document(uid).collection("calendars").document(calendar_id)
        if not doc.get().exists:
            logger.warning("Calendrier introuvable.", {
                "origin": "MED_FETCH_ERROR",
                "uid": uid,
                "calendar_id": calendar_id
            })
            return jsonify({"error": "Calendrier introuvable", "code": "CALENDAR_NOT_FOUND"}), 404

        medicines = doc.get().to_dict().get("medicines", [])

        logger.info("Médicaments récupérés avec succès.", {
            "origin": "MED_FETCH_SUCCESS",
            "uid": uid,
            "calendar_id": calendar_id
        })
        return jsonify({"medicines": medicines, "message": "Médicaments récupérés avec succès", "code": "MED_FETCH_SUCCESS"}), 200

    except Exception as e:
        logger.exception(f"Erreur dans GET /api/calendars/{calendar_id}/medicines", {
            "origin": "MED_FETCH_ERROR",
            "uid": uid,
            "calendar_id": calendar_id,
            "error": str(e)
        })
        return jsonify({"error": "Erreur lors de la récupération des médicaments.", "code": "MED_FETCH_ERROR"}), 500


# Mettre à jour les médicaments d’un calendrier
@api.route("/api/calendars/<calendar_id>/medicines", methods=["PUT"])
def update_medicines(calendar_id):
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        medicines = request.json.get("medicines")

        if not isinstance(medicines, list):
            logger.warning("Format de médicaments invalide reçu.", {
                "origin": "MED_UPDATE_ERROR",
                "uid": uid,
                "calendar_id": calendar_id
            })
            return jsonify({"error": "Le format des médicaments est invalide.", "code": "INVALID_MEDICINE_FORMAT"}), 400


        db.collection("users").document(uid).collection("calendars").document(calendar_id).set({
            "medicines": medicines,
            "last_updated": firestore.SERVER_TIMESTAMP
        }, merge=True)

        logger.info("Médicaments mis à jour avec succès.", {
            "origin": "MED_UPDATE_SUCCESS",
            "uid": uid,
            "calendar_id": calendar_id
        })
        return jsonify({"message": "Médicaments mis à jour avec succès", "code": "MED_UPDATE_SUCCESS"}), 200

    except Exception as e:
        logger.exception(f"Erreur dans POST /api/calendars/{calendar_id}/medicines", {
            "origin": "MED_UPDATE_ERROR",
            "uid": uid,
            "calendar_id": calendar_id,
            "error": str(e)
        })
        return jsonify({"error": "Erreur lors de la mise à jour des médicaments.", "code": "MED_UPDATE_ERROR"}), 500


# Route pour compter les médicaments
@api.route("/api/medicines/count", methods=["GET"])
def count_medicines():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        calendar_id = request.args.get("calendarId")

        doc = db.collection("users").document(uid).collection("calendars").document(calendar_id).get()
        if not doc.exists:
            logger.warning("Calendrier introuvable.", {
                "origin": "MED_COUNT_ERROR",
                "uid": uid,
                "calendar_id": calendar_id
            })
            return jsonify({"error": "Calendrier introuvable", "code": "CALENDAR_NOT_FOUND"}), 404

        data = doc.to_dict()
        medicines = data.get("medicines", [])
        count = len(medicines)
        logger.info("Médicaments récupérés avec succès.", {
            "origin": "MED_COUNT_SUCCESS",
            "uid": uid,
            "calendar_id": calendar_id,
            "count": count
        })
        return jsonify({"count": count, "message": "Médicaments récupérés avec succès", "code": "MED_COUNT_SUCCESS"}), 200

    except Exception as e:
        logger.exception("Erreur dans /api/medicines/count", {
            "origin": "MED_COUNT_ERROR",
            "uid": uid,
            "calendar_id": calendar_id,
            "error": str(e)
        })
        return jsonify({"error": "Erreur lors du comptage des médicaments.", "code": "MED_COUNT_ERROR"}), 500
 

# Route pour compter les médicaments d'un calendrier partagé
@api.route("/api/medicines/shared/count", methods=["GET"])
def count_shared_medicines():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        calendar_id = request.args.get("calendarId")
        owner_uid = request.args.get("ownerUid")

        doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).get()
        if not doc.exists:
            logger.warning("Calendrier introuvable.", {
                "origin": "MED_SHARED_COUNT_ERROR",
                "uid": uid,
                "calendar_id": calendar_id
            })
            return jsonify({"error": "Calendrier introuvable", "code": "CALENDAR_NOT_FOUND"}), 404


        if not verify_calendar_share(calendar_id, owner_uid, uid):
            logger.warning("Accès non autorisé.", {
                "origin": "MED_SHARED_COUNT_ERROR",
                "uid": uid,
                "calendar_id": calendar_id,
                "owner_uid": owner_uid
            })
            return jsonify({"error": "Accès non autorisé", "code": "UNAUTHORIZED_ACCESS"}), 403

        data = doc.to_dict()
        medicines = data.get("medicines", [])
        count = len(medicines)
        logger.info("Médicaments récupérés avec succès.", {
            "origin": "MED_SHARED_COUNT_SUCCESS",
            "uid": uid,
            "calendar_id": calendar_id,
            "count": count,
            "owner_uid": owner_uid
        })
        return jsonify({"count": count, "message": "Médicaments récupérés avec succès", "code": "MED_SHARED_COUNT_SUCCESS"}), 200

    except Exception as e:
        logger.exception("Erreur dans /api/medicines/shared/count", {
            "origin": "MED_SHARED_COUNT_ERROR",
            "uid": uid,
            "calendar_id": calendar_id,
            "error": str(e)
        })
        return jsonify({"error": "Erreur lors du comptage des médicaments.", "code": "MED_SHARED_COUNT_ERROR"}), 500
