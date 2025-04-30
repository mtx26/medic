from flask import jsonify, request
from logger import backend_logger as logger
from auth import verify_firebase_token
from datetime import datetime, timezone
from . import api
from firebase_admin import firestore
from function import verify_calendar_share

db = firestore.client()

# Route pour récupérer les calendriers partagés
@api.route("/api/shared/calendars", methods=["GET"])
def handle_shared_calendars():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        shared_calendars_ref = db.collection("users").document(uid).collection("shared_calendars")
        shared_docs = list(shared_calendars_ref.stream())

        if not shared_docs:
            logger.warning(f"[CALENDARS_SHARED_LOAD] Aucun calendrier partagé trouvé pour {uid}.")
            return jsonify({"error": "Aucun calendrier partagé trouvé."}), 404

        calendars_list = []
        for doc in shared_docs:
            data = doc.to_dict()
            calendar_owner_uid = data.get("calendar_owner_uid")
            calendar_owner_email = data.get("calendar_owner_email")
            calendar_name = data.get("calendar_name")
            access = data.get("access", "read")

            if not verify_calendar_share(calendar_name, calendar_owner_uid, uid):
                continue

            # Ajoute les infos à la réponse
            calendars_list.append({
                "calendar_name": calendar_name,
                "calendar_owner_uid": calendar_owner_uid,
                "calendar_owner_email": calendar_owner_email,
                "access": access
            })

        logger.info(f"[CALENDARS_SHARED_LOAD] {len(calendars_list)} calendrier(s) récupéré(s) pour {uid}.")
        return jsonify({"calendars": calendars_list}), 200

    except Exception as e:
        logger.exception("[CALENDARS_SHARED_ERROR] Erreur lors de la récupération des calendriers partagés.")
        return jsonify({"error": "Erreur interne lors de la récupération des calendriers partagés."}), 500


# Route pour supprimer un calendrier partagé
@api.route("/api/shared/calendars/<calendar_name>", methods=["DELETE"])
def handle_delete_shared_calendar(calendar_name):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        shared_calendars = db.collection("users").document(uid).collection("shared_calendars").document(calendar_name).get()
        if not shared_calendars.exists:
            logger.warning(f"[CALENDARS_SHARED_DELETE] Calendrier partagé introuvable : {calendar_name} pour {uid}.")
            return jsonify({"error": "Calendrier partagé introuvable"}), 404

        calendar_owner_uid = shared_calendars.to_dict().get("calendar_owner_uid")

        if not verify_calendar_share(calendar_name, calendar_owner_uid, uid):
            logger.warning(f"[CALENDARS_SHARED_DELETE] Accès non autorisé à {calendar_name} partagé par {calendar_owner_uid}")
            return jsonify({"error": "Accès non autorisé"}), 403
        
        shared_calendars.delete()
        db.collection("users").document(calendar_owner_uid).collection("calendars").document(calendar_name).collection("shared_with").document(uid).delete()

        return jsonify({"message": "Calendrier partagé supprimé avec succès"}), 200

    except Exception as e:
        logger.exception("[CALENDARS_SHARED_DELETE_ERROR] Erreur lors de la suppression du calendrier partagé.")
        return jsonify({"error": "Erreur interne lors de la suppression du calendrier partagé."}), 500


