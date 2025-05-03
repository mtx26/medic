from flask import jsonify, request
from logger import backend_logger as logger
from auth import verify_firebase_token
from datetime import datetime, timezone
import secrets
from . import api
from firebase_admin import firestore
from function import generate_schedule

db = firestore.client()

# Route pour récupérer tous les tokens et les informations associées
@api.route("/api/tokens", methods=["GET"])
def handle_tokens():
    try:
        if request.method == "GET":
            user = verify_firebase_token()
            uid = user["uid"]

            tokens_ref = db.collection("shared_tokens").get()
            tokens = []
            for doc in tokens_ref:
                if doc.to_dict().get("owner_uid") == uid:
                    tokens.append(doc.to_dict())
            logger.info(f"[TOKENS_FETCH] {len(tokens)} tokens récupérés pour {uid}.")
            return jsonify({"tokens": tokens}), 200
        
    except Exception as e:
        logger.exception("[TOKENS_ERROR] Erreur dans /api/tokens")
        return jsonify({"error": "Erreur lors de la récupération des tokens."}), 500


# Route pour créer un lien de partage avec un token
@api.route("/api/tokens/<calendar_id>", methods=["POST"])
def handle_create_token(calendar_id):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        data = request.get_json(force=True)

        expires_at = data.get("expiresAt")
        if not expires_at:
            expires_at = None
            
        permissions = data.get("permissions")

        
        if not permissions:
            permissions = ["read"]

        # Verifier si le calendrier existe
        doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).get()
        if not doc.exists:
            logger.warning(f"[CALENDAR_SHARED_CREATE] Calendrier introuvable : {calendar_id} pour {owner_uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404

        calendar_name = doc.to_dict().get("calendar_name")

        # Verifier si le calendrier est déjà partagé
        doc_2 = db.collection("shared_tokens").get()
        for doc in doc_2:
            if doc.to_dict().get("owner_uid") == owner_uid:
                if doc.to_dict().get("calendar_id") == calendar_id:
                    logger.warning(f"[CALENDAR_SHARED_CREATE] Calendrier déjà partagé : {calendar_id} pour {owner_uid}.")
                    return jsonify({"error": "Calendrier déjà partagé"}), 400
        
        # Créer un nouveau lien de partage
        token = secrets.token_hex(16)
        db.collection("shared_tokens").document(token).set({
            "token": token,
            "calendar_id": calendar_id,
            "calendar_name": calendar_name,
            "owner_uid": owner_uid,
            "expires_at": expires_at,
            "permissions": permissions,
            "revoked": False
        })

        logger.info(f"[CALENDAR_SHARED_CREATE] Calendrier partagé : {calendar_id} pour {owner_uid}.")
        return jsonify({"message": "Calendrier partagé avec succès", "token": token}), 200

    except Exception as e:
        logger.exception(f"[CALENDAR_SHARED_CREATE_ERROR] Erreur dans /api/tokens/{calendar_id}")
        return jsonify({"error": "Erreur lors de la création du lien de partage."}), 500


# Route pour révoquer un token
@api.route("/api/tokens/revoke/<token>", methods=["POST"])
def handle_update_revoke_token(token):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]


        doc = db.collection("shared_tokens").document(token).get()

        if doc.to_dict().get("owner_uid") != owner_uid:
            logger.warning(f"[TOKEN_REVOKE] Token non autorisé : {token}.")
            return jsonify({"error": "Token non autorisé"}), 403

        if not doc.exists:
            logger.warning(f"[TOKEN_REVOKE] Token introuvable : {token}.")
            return jsonify({"error": "Token introuvable"}), 404

        if doc.to_dict().get("owner_uid") != owner_uid:
            logger.warning(f"[TOKEN_REVOKE] Token non autorisé : {token}.")
            return jsonify({"error": "Token non autorisé"}), 403

        db.collection("shared_tokens").document(token).update({
            "revoked": not doc.to_dict().get("revoked")
        })

        logger.info(f"[TOKEN_REVOKE] Token révoqué : {token}.")
        return jsonify({"message": "Token révoqué avec succès"}), 200

    except Exception as e:
        logger.exception(f"[TOKEN_REVOKE_ERROR] Erreur dans /api/tokens/revoke/{token}")
        return jsonify({"error": "Erreur lors de la révoquation du token."}), 500


# Route pour mettre à jour l'expiration d'un token
@api.route("/api/tokens/expiration/<token>", methods=["POST"])
def handle_update_token_expiration(token):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        data = request.get_json(force=True)

        doc = db.collection("shared_tokens").document(token).get()

        if doc.to_dict().get("owner_uid") != owner_uid:
            logger.warning(f"[TOKEN_UPDATE_EXPIRATION] Token non autorisé : {token}.")
            return jsonify({"error": "Token non autorisé"}), 403

        if not doc.exists:
            logger.warning(f"[TOKEN_UPDATE_EXPIRATION] Token introuvable : {token}.")
            return jsonify({"error": "Token introuvable"}), 404

        if doc.to_dict().get("owner_uid") != owner_uid:
            logger.warning(f"[TOKEN_UPDATE_EXPIRATION] Token non autorisé : {token}.")
            return jsonify({"error": "Token non autorisé"}), 403

        expires_at = data.get("expiresAt")
        if not expires_at:
            db.collection("shared_tokens").document(token).update({
                "expires_at": None
            })
        else:
            db.collection("shared_tokens").document(token).update({
                "expires_at": datetime.strptime(expires_at, "%Y-%m-%dT%H:%M")
            })

        logger.info(f"[TOKEN_UPDATE_EXPIRATION] Expiration du token mise à jour : {token}.")
        return jsonify({"message": "Expiration du token mise à jour avec succès"}), 200

    except Exception as e:
        logger.exception(f"[TOKEN_UPDATE_EXPIRATION_ERROR] Erreur dans /api/tokens/expiration/{token}")
        return jsonify({"error": "Erreur lors de la mise à jour de l'expiration du token."}), 500


# Route pour mettre à jour les permissions d'un token
@api.route("/api/tokens/permissions/<token>", methods=["POST"])
def handle_update_token_permissions(token):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        data = request.get_json(force=True)

        doc = db.collection("shared_tokens").document(token).get()

        if doc.to_dict().get("owner_uid") != owner_uid:
            logger.warning(f"[TOKEN_UPDATE_PERMISSIONS] Token non autorisé : {token}.")
            return jsonify({"error": "Token non autorisé"}), 403

        if not doc.exists:
            logger.warning(f"[TOKEN_UPDATE_PERMISSIONS] Token introuvable : {token}.")
            return jsonify({"error": "Token introuvable"}), 404

        if doc.to_dict().get("owner_uid") != owner_uid:
            logger.warning(f"[TOKEN_UPDATE_PERMISSIONS] Token non autorisé : {token}.")
            return jsonify({"error": "Token non autorisé"}), 403

        permissions = data.get("permissions")
        db.collection("shared_tokens").document(token).update({
            "permissions": permissions
        })

        logger.info(f"[TOKEN_UPDATE_PERMISSIONS] Permissions du token mises à jour : {token}.")
        return jsonify({"message": "Permissions du token mises à jour avec succès"}), 200

    except Exception as e:
        logger.exception(f"[TOKEN_UPDATE_PERMISSIONS_ERROR] Erreur dans /api/tokens/permissions/{token}")
        return jsonify({"error": "Erreur lors de la mise à jour des permissions du token."}), 500


# Route pour générer un calendrier partagé pour un token
@api.route("/api/tokens/<token>/calendar", methods=["GET"])
def handle_read_token(token):
    try:
        doc = db.collection("shared_tokens").document(token).get()
        if not doc.exists():
            logger.warning(f"[CALENDAR_SHARED_LOAD] Token invalide : {token}.")
            return jsonify({"error": "Token invalide"}), 404

        data = doc.to_dict()
        calendar_id = data.get("calendar_id")
        owner_uid = data.get("owner_uid")
        expires_at = data.get("expires_at")
        permissions = data.get("permissions")
        revoked = data.get("revoked")

        if expires_at:
            if datetime.now(timezone.utc).date() > datetime.fromisoformat(expires_at).date():
                logger.warning(f"[CALENDAR_SHARED_LOAD] Token expiré : {token}.")
                return jsonify({"error": "Token expiré"}), 404

        if revoked:
            logger.warning(f"[CALENDAR_SHARED_LOAD] Token révoqué : {token}.")
            return jsonify({"error": "Token révoqué"}), 404

        if "read" not in permissions:
            logger.warning(f"[CALENDAR_SHARED_LOAD] Token sans permission de lecture : {token}.")
            return jsonify({"error": "Token sans permission de lecture"}), 403

        doc_2 = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).get()
        if not doc_2.exists:
            logger.warning(f"[CALENDAR_SHARED_LOAD] Calendrier introuvable : {calendar_id}.")
            return jsonify({"error": "Calendrier introuvable"}), 404

        medicines = doc_2.to_dict().get("medicines", [])
        start_str = request.args.get("startTime")
        start_date = datetime.strptime(start_str, "%Y-%m-%d").date() if start_str else datetime.now(timezone.utc).date()

        schedule = generate_schedule(start_date, medicines)
        logger.info(f"[CALENDAR_GENERATE] Calendrier généré avec succès pour token {token}.")
        return jsonify(schedule), 200

    except Exception:
        logger.exception(f"[CALENDAR_GENERATE_ERROR] Erreur dans GET /api/tokens/{token}")
        return jsonify({"error": "Erreur lors de la génération du calendrier."}), 500


# Route pour supprimer un token
@api.route("/api/tokens/<token>", methods=["DELETE"])
def handle_delete_token(token):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        doc = db.collection("shared_tokens").document(token).get()
        if not doc.exists():
            logger.warning(f"[CALENDAR_SHARED_DELETE] Token introuvable : {token}.")
            return jsonify({"error": "Lien de partage introuvable"}), 404

        if doc.to_dict().get("owner_uid") != owner_uid:
            logger.warning(f"[CALENDAR_SHARED_DELETE] Accès interdit pour token {token}.")
            return jsonify({"error": "Lien de partage non autorisé"}), 403

        db.collection("shared_tokens").document(token).delete()
        logger.info(f"[CALENDAR_SHARED_DELETE] Lien supprimé : {token}.")
        return jsonify({"message": "Lien de partage supprimé avec succès"}), 200

    except Exception:
        logger.exception(f"[CALENDAR_SHARED_DELETE_ERROR] Erreur dans DELETE /api/tokens/{token}")
        return jsonify({"error": "Erreur lors de la suppression du lien de partage."}), 500


# Route pour récupérer uniquement la liste des médicaments d'un calendrier partagé
@api.route("/api/tokens/<token>/medecines", methods=["GET"])
def handle_token_medecines(token):
    try:
        if request.method == "GET":
            doc = db.collection("shared_tokens").document(token).get()
            data = doc.to_dict()
            calendar_id = data.get("calendar_id")
            calendar_name = data.get("calendar_name")
            owner_uid = data.get("owner_uid")
            expires_at = data.get("expires_at")
            if expires_at != None:
                expires_at = datetime.fromisoformat(expires_at).date()
            revoked = data.get("revoked")
            permissions = data.get("permissions")

            # Verifier si le token est valide
            if doc.exists:
                doc_2 = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).get()
            else:
                logger.warning(f"[MEDECINES_SHARED_LOAD] Token invalide : {token}.")
                return jsonify({"error": "Token invalide"}), 404
            
            # Recuperer les médicaments
            if doc_2.exists:
                data_2 = doc_2.to_dict()
                medicines = data_2.get("medicines", [])
                logger.info(f"[MEDECINES_SHARED_LOAD] Médicaments  récupérés de {calendar_id} chez {owner_uid} pour le token {token}.")
            else:
                logger.warning(f"[MEDECINES_SHARED_LOAD] Médicaments introuvable de {calendar_id} chez {owner_uid} pour le token {token}.")
                return jsonify({"error": "Calendrier introuvable"}), 404

            # Verifier si le token est expiré ou si vide
            if expires_at != None:
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
        logger.exception(f"[MEDECINES_SHARED_ERROR] Erreur dans /api/tokens/{token}/medecines")
        return jsonify({"error": "Erreur lors de la récupération des médicaments."}), 500
