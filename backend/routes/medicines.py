from flask import jsonify, request
from logger import backend_logger as logger
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
            logger.warning(f"[MED_FETCH] Calendrier introuvable : {calendar_id} pour {uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404

        medicines = doc.get().to_dict().get("medicines", [])

        logger.info(f"[MED_FETCH] {len(medicines)} médicament(s) récupéré(s) pour {calendar_id}.")
        return jsonify({"medicines": medicines}), 200

    except Exception:
        logger.exception(f"[MED_ERROR] Erreur dans GET /api/calendars/{calendar_id}/medicines")
        return jsonify({"error": "Erreur interne"}), 500


# Mettre à jour les médicaments d’un calendrier
@api.route("/api/calendars/<calendar_id>/medicines", methods=["PUT"])
def update_medicines(calendar_id):
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        medicines = request.json.get("medicines")

        if not isinstance(medicines, list):
            logger.warning(f"[MED_UPDATE] Format de médicaments invalide reçu de {uid}.")
            return jsonify({"error": "Le format des médicaments est invalide."}), 400

        db.collection("users").document(uid).collection("calendars").document(calendar_id).set({
            "medicines": medicines,
            "last_updated": firestore.SERVER_TIMESTAMP
        }, merge=True)

        logger.info(f"[MED_UPDATE] Médicaments mis à jour pour {uid}.")
        return jsonify({"message": "Médicaments mis à jour", "status": "ok"})

    except Exception:
        logger.exception(f"[MED_ERROR] Erreur dans POST /api/calendars/{calendar_id}/medicines")
        return jsonify({"error": "Erreur interne"}), 500


# Route pour compter les médicaments
@api.route("/api/medicines/count", methods=["GET"])
def count_medicines():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        calendar_id = request.args.get("calendarId")

        doc = db.collection("users").document(uid).collection("calendars").document(calendar_id).get()
        if not doc.exists:
            logger.warning(f"[MED_COUNT] Calendrier introuvable : {calendar_id} pour {uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404

        data = doc.to_dict()
        medicines = data.get("medicines", [])
        count = len(medicines)
        logger.info(f"[MED_COUNT] {count} médicaments récupérés de {calendar_id} pour {uid}.")
        return jsonify({"count": count}), 200

    except Exception as e:
        logger.exception("[MED_COUNT_ERROR] Erreur dans /api/medicines/count")
        return jsonify({"error": "Erreur lors du comptage des médicaments."}), 500
 

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
            logger.warning(f"[MED_COUNT] Calendrier introuvable : {calendar_id} pour {uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404


        if not verify_calendar_share(calendar_id, owner_uid, uid):
            logger.warning(f"[MED_COUNT] Accès non autorisé à {calendar_id} partagé par {owner_uid}")
            return jsonify({"error": "Accès non autorisé"}), 403

        data = doc.to_dict()
        medicines = data.get("medicines", [])
        count = len(medicines)
        logger.info(f"[MED_COUNT] {count} médicaments récupérés de {calendar_id} pour {uid}.")
        return jsonify({"count": count}), 200

    except Exception as e:
        logger.exception("[MED_COUNT_ERROR] Erreur dans /api/medicines/shared/count")
        return jsonify({"error": "Erreur lors du comptage des médicaments."}), 500
