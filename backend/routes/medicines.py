from flask import jsonify, request
from logger import backend_logger as logger
from auth import verify_firebase_token
from datetime import datetime, timezone, timedelta
from . import api
from firebase_admin import firestore
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
