from flask import jsonify, request
from logger import backend_logger as logger
from auth import verify_firebase_token
from datetime import datetime, timezone
from . import api
from firebase_admin import firestore

db = firestore.client()

# Route pour accéder au calendrier d'un utilisateur via un lien de partage sécurisé (token)
@api.route("/api/shared/<token>", methods=["GET", "DELETE"])
def handle_shared(token):
    try:
        # Récupérer les informations du lien de partage
        if request.method == "GET":
            doc = db.collection("shared_tokens").document(token).get()
            data = doc.to_dict()
            calendar_name = data.get("calendar_name")
            uid = data.get("calendar_owner_uid")
            expires_at = data.get("expires_at")
            revoked = data.get("revoked")
            permissions = data.get("permissions")
            # Verifier si le token est valide
            if doc.exists:
                doc_2 = db.collection("users").document(uid).collection("calendars").document(calendar_name).get()
            else:
                logger.warning(f"[CALENDAR_SHARED_LOAD] Token invalide : {token}.")
                return jsonify({"error": "Token invalide"}), 404
            
            # Recuperer les médicaments
            if doc_2.exists:
                data_2 = doc_2.to_dict()
                medicines = data_2.get("medicines", [])
                logger.info(f"[CALENDAR_SHARED_LOAD] Médicaments  récupérés de {calendar_name} chez {uid} pour le token {token}.")
            else:
                logger.warning(f"[CALENDAR_SHARED_LOAD] Médicaments introuvable de {calendar_name} chez {uid} pour le token {token}.")
                return jsonify({"error": "Calendrier introuvable"}), 404


            # Verifier si le token est expiré ou si = a never
            if expires_at != "never":
                now_utc = datetime.now(timezone.utc).date()
                if now_utc > expires_at:
                    logger.warning(f"[MEDECINES_SHARED_LOAD] Token expiré : {token}.")
                    return jsonify({"error": "Token expiré"}), 404

            # Verifier si le token est revoké
            if revoked:
                logger.warning(f"[CALENDAR_SHARED_LOAD] Token revoké : {token}.")
                return jsonify({"error": "Token revoké"}), 404

            # Verifier si le token a les permissions appropriées
            if "read" not in permissions:
                logger.warning(f"[CALENDAR_SHARED_LOAD] Token sans permission de lecture : {token}.")
                return jsonify({"error": "Token sans permission de lecture"}), 403

            start_str = request.args.get("startTime")
            if not start_str:
                start_date = datetime.now(timezone.utc).date()
            else:
                start_date = datetime.strptime(start_str, "%Y-%m-%d").date()

            schedule = generate_schedule(start_date, medicines)
            logger.info("[CALENDAR_GENERATE] Calendrier généré avec succès.")
            return jsonify(schedule), 200

        # Supprimer un lien de partage
        if request.method == "DELETE":
            user = verify_firebase_token()
            uid = user["uid"]
            doc = db.collection("shared_tokens").document(token).get()

            if not doc.exists:
                logger.warning(f"[CALENDAR_SHARED_DELETE] Lien de partage introuvable : {token}.")
                return jsonify({"error": "Lien de partage introuvable"}), 404

            uid_token = doc.to_dict().get("calendar_owner_uid")
            if uid != uid_token:
                logger.warning(f"[CALENDAR_SHARED_DELETE] Lien de partage non autorisé : {token}.")
                return jsonify({"error": "Lien de partage non autorisé"}), 403

            db.collection("shared_tokens").document(token).delete()
            logger.info(f"[CALENDAR_SHARED_DELETE] Lien de partage supprimé : {token}.")
            return jsonify({"message": "Lien de partage supprimé avec succès"}), 200
    except Exception as e:
        logger.exception(f"[CALENDAR_GENERATE_ERROR] Erreur dans /api/shared/${token}")
        return jsonify({"error": "Erreur lors de la génération du calendrier."}), 500
    

# Route pour récupérer uniquement la liste des médicaments d'un calendrier partagé
@api.route("/api/shared/<token>/medecines", methods=["GET"])
def handle_shared_medecines(token):
    try:
        if request.method == "GET":
            doc = db.collection("shared_tokens").document(token).get()
            data = doc.to_dict()
            calendar_name = data.get("calendar_name")
            uid = data.get("calendar_owner_uid")
            expires_at = data.get("expires_at")
            revoked = data.get("revoked")
            permissions = data.get("permissions")

            # Verifier si le token est valide
            if doc.exists:
                doc_2 = db.collection("users").document(uid).collection("calendars").document(calendar_name).get()
            else:
                logger.warning(f"[MEDECINES_SHARED_LOAD] Token invalide : {token}.")
                return jsonify({"error": "Token invalide"}), 404
            
            # Recuperer les médicaments
            if doc_2.exists:
                data_2 = doc_2.to_dict()
                medicines = data_2.get("medicines", [])
                logger.info(f"[MEDECINES_SHARED_LOAD] Médicaments  récupérés de {calendar_name} chez {uid} pour le token {token}.")
            else:
                logger.warning(f"[MEDECINES_SHARED_LOAD] Médicaments introuvable de {calendar_name} chez {uid} pour le token {token}.")
                return jsonify({"error": "Calendrier introuvable"}), 404

            # Verifier si le token est expiré ou si = a never
            if expires_at != "never":
                now_utc = datetime.now(timezone.utc).date()
                if now_utc > expires_at:
                    logger.warning(f"[MEDECINES_SHARED_LOAD] Token expiré : {token}.")
                    return jsonify({"error": "Token expiré"}), 404

            # Verifier si le token est revoké
            if revoked:
                logger.warning(f"[MEDECINES_SHARED_LOAD] Token revoké : {token}.")
                return jsonify({"error": "Token revoké"}), 404

            # Verifier si le token a les permissions appropriées
            if "read" not in permissions:
                logger.warning(f"[MEDECINES_SHARED_LOAD] Token sans permission de lecture : {token}.")
                return jsonify({"error": "Token sans permission de lecture"}), 403

            return jsonify({"medicines": medicines}), 200
    except Exception as e:
        logger.exception(f"[MEDECINES_SHARED_ERROR] Erreur dans /api/shared/${token}/medecines")
        return jsonify({"error": "Erreur lors de la récupération des médicaments."}), 500
