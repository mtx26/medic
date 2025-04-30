from flask import jsonify, request
from logger import backend_logger as logger
from auth import verify_firebase_token
from datetime import datetime, timezone, timedelta
from . import api
from firebase_admin import firestore
from function import verify_calendar_share

db = firestore.client()


# Route pour gérer les médicaments d'un calendrier spécifique
@api.route("/api/calendars/<calendar_name>/medicines", methods=["GET", "POST"])
def handle_medicines(calendar_name):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        if request.method == "POST":
            medicines = request.json.get("medicines")
            if not isinstance(medicines, list):
                logger.warning(f"[MED_UPDATE] Format de médicaments invalide reçu de {uid}.")
                return jsonify({"error": "Le format des médicaments est invalide."}), 400

            db.collection("users").document(uid).collection("calendars").document(calendar_name).set({
                "medicines": medicines,
                "last_updated": datetime.now(timezone.utc).isoformat()
            }, merge=True)

            logger.info(f"[MED_UPDATE] Médicaments mis à jour pour {uid}.")
            return jsonify({"message": "Médicaments mis à jour", "status": "ok"})

        elif request.method == "GET":
            doc = db.collection("users").document(uid).collection("calendars").document(calendar_name).get()
            if doc.exists:
                data = doc.to_dict()
                medicines = data.get("medicines", [])
                logger.info(f"[MED_FETCH] Médicaments récupérés pour {uid}.")
                return jsonify({"medicines": medicines}), 200
            else:
                logger.warning(f"[MED_FETCH] Aucun document trouvé pour l'utilisateur {uid}.")
                return jsonify({"medicines": []}), 200

    except Exception as e:
        logger.exception(f"[MED_ERROR] Erreur dans /api/calendars/${calendar_name}/medicines")
        return jsonify({"error": "Erreur interne"}), 500


# Route pour compter les médicaments
@api.route("/api/countmedicines", methods=["GET"])
def count_medicines():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        name_calendar = request.args.get("calendarName")

        doc = db.collection("users").document(uid).collection("calendars").document(name_calendar).get()
        if not doc.exists:
            logger.warning(f"[MED_COUNT] Calendrier introuvable : {name_calendar} pour {uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404

        data = doc.to_dict()
        medicines = data.get("medicines", [])
        count = len(medicines)
        logger.info(f"[MED_COUNT] {count} médicaments récupérés de {name_calendar} pour {uid}.")
        return jsonify({"count": count}), 200

    except Exception as e:
        logger.exception("[MED_COUNT_ERROR] Erreur dans /api/countmedicines")
        return jsonify({"error": "Erreur lors du comptage des médicaments."}), 500
 

# Route pour compter les médicaments d'un calendrier partagé
@api.route("/api/shared/countmedicines", methods=["GET"])
def count_shared_medicines():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        calendar_name = request.args.get("calendarName")
        calendar_owner_uid = request.args.get("calendarOwnerUid")

        doc = db.collection("users").document(calendar_owner_uid).collection("calendars").document(calendar_name).get()
        if not doc.exists:
            logger.warning(f"[MED_COUNT] Calendrier introuvable : {calendar_name} pour {uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404


        if not verify_calendar_share(calendar_name, calendar_owner_uid, uid):
            logger.warning(f"[MED_COUNT] Accès non autorisé à {calendar_name} partagé par {calendar_owner_uid}")
            return jsonify({"error": "Accès non autorisé"}), 403

        data = doc.to_dict()
        medicines = data.get("medicines", [])
        count = len(medicines)
        logger.info(f"[MED_COUNT] {count} médicaments récupérés de {calendar_name} pour {uid}.")
        return jsonify({"count": count}), 200

    except Exception as e:
        logger.exception("[MED_COUNT_ERROR] Erreur dans /api/shared/countmedicines")
        return jsonify({"error": "Erreur lors du comptage des médicaments."}), 500
