from flask import jsonify, request
from logger import backend_logger as logger
from auth import verify_firebase_token
from datetime import datetime
import secrets
from . import api
from firebase_admin import firestore

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
                if doc.to_dict().get("calendar_owner_uid") == uid:
                    tokens.append(doc.to_dict())
            logger.info(f"[TOKENS_FETCH] {len(tokens)} tokens récupérés pour {uid}.")
            return jsonify({"tokens": tokens}), 200
        
    except Exception as e:
        logger.exception("[TOKENS_ERROR] Erreur dans /api/tokens")
        return jsonify({"error": "Erreur lors de la récupération des tokens."}), 500


# Route pour créer un lien de partage avec un token
@api.route("/api/set-shared/<calendar_name>", methods=["POST"])
def handle_shared_create(calendar_name):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        data = request.get_json(force=True)

        expires_at = data.get("expiresAt")
        permissions = data.get("permissions")
        if not expires_at:
            expires_at = "never"
        else:
            expires_at = datetime.strptime(expires_at, "%Y-%m-%dT%H:%M")

        
        if not permissions:
            permissions = ["read"]

        # Verifier si le calendrier existe
        doc = db.collection("users").document(uid).collection("calendars").document(calendar_name).get()
        if not doc.exists:
            logger.warning(f"[CALENDAR_SHARED_CREATE] Calendrier introuvable : {calendar_name} pour {uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404

        # Verifier si le calendrier est déjà partagé
        doc_2 = db.collection("shared_tokens").get()
        for doc in doc_2:
            if doc.to_dict().get("calendar_name") == calendar_name:
                logger.warning(f"[CALENDAR_SHARED_CREATE] Calendrier déjà partagé : {calendar_name} pour {uid}.")
                return jsonify({"error": "Calendrier déjà partagé"}), 400
        
        # Créer un nouveau lien de partage
        token = secrets.token_hex(16)
        db.collection("shared_tokens").document(token).set({
            "token": token,
            "calendar_name": calendar_name,
            "calendar_owner_uid": uid,
            "expires_at": expires_at,
            "permissions": permissions,
            "revoked": False
        })

        logger.info(f"[CALENDAR_SHARED_CREATE] Calendrier partagé : {calendar_name} pour {uid}.")
        return jsonify({"message": "Calendrier partagé avec succès", "token": token}), 200

    except Exception as e:
        logger.exception(f"[CALENDAR_SHARED_CREATE_ERROR] Erreur dans /api/shared/{calendar_name}")
        return jsonify({"error": "Erreur lors de la création du lien de partage."}), 500


# Route pour révoquer un token
@api.route("/api/revoke-token/<token>", methods=["POST"])
def handle_revoke_token(token):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        doc = db.collection("shared_tokens").document(token).get()
        if not doc.exists:
            logger.warning(f"[TOKEN_REVOKE] Token introuvable : {token}.")
            return jsonify({"error": "Token introuvable"}), 404

        if doc.to_dict().get("calendar_owner_uid") != uid:
            logger.warning(f"[TOKEN_REVOKE] Token non autorisé : {token}.")
            return jsonify({"error": "Token non autorisé"}), 403

        db.collection("shared_tokens").document(token).update({
            "revoked": not doc.to_dict().get("revoked")
        })

        logger.info(f"[TOKEN_REVOKE] Token révoqué : {token}.")
        return jsonify({"message": "Token révoqué avec succès"}), 200

    except Exception as e:
        logger.exception(f"[TOKEN_REVOKE_ERROR] Erreur dans /api/revoke-token/{token}")
        return jsonify({"error": "Erreur lors de la révoquation du token."}), 500


# Route pour mettre à jour l'expiration d'un token
@api.route("/api/update-token-expiration/<token>", methods=["POST"])
def handle_update_token_expiration(token):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        data = request.get_json(force=True)

        doc = db.collection("shared_tokens").document(token).get()
        if not doc.exists:
            logger.warning(f"[TOKEN_UPDATE_EXPIRATION] Token introuvable : {token}.")
            return jsonify({"error": "Token introuvable"}), 404

        if doc.to_dict().get("calendar_owner_uid") != uid:
            logger.warning(f"[TOKEN_UPDATE_EXPIRATION] Token non autorisé : {token}.")
            return jsonify({"error": "Token non autorisé"}), 403

        expires_at = data.get("expiresAt")
        if expires_at == "never":
            db.collection("shared_tokens").document(token).update({
                "expires_at": "never"
            })
        else:
            db.collection("shared_tokens").document(token).update({
                "expires_at": datetime.strptime(expires_at, "%Y-%m-%dT%H:%M")
            })

        logger.info(f"[TOKEN_UPDATE_EXPIRATION] Expiration du token mise à jour : {token}.")
        return jsonify({"message": "Expiration du token mise à jour avec succès"}), 200

    except Exception as e:
        logger.exception(f"[TOKEN_UPDATE_EXPIRATION_ERROR] Erreur dans /api/update-token-expiration/{token}")
        return jsonify({"error": "Erreur lors de la mise à jour de l'expiration du token."}), 500


# Route pour mettre à jour les permissions d'un token
@api.route("/api/update-token-permissions/<token>", methods=["POST"])
def handle_update_token_permissions(token):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        data = request.get_json(force=True)

        doc = db.collection("shared_tokens").document(token).get()
        if not doc.exists:
            logger.warning(f"[TOKEN_UPDATE_PERMISSIONS] Token introuvable : {token}.")
            return jsonify({"error": "Token introuvable"}), 404

        if doc.to_dict().get("calendar_owner_uid") != uid:
            logger.warning(f"[TOKEN_UPDATE_PERMISSIONS] Token non autorisé : {token}.")
            return jsonify({"error": "Token non autorisé"}), 403

        permissions = data.get("permissions")
        db.collection("shared_tokens").document(token).update({
            "permissions": permissions
        })

        logger.info(f"[TOKEN_UPDATE_PERMISSIONS] Permissions du token mises à jour : {token}.")
        return jsonify({"message": "Permissions du token mises à jour avec succès"}), 200

    except Exception as e:
        logger.exception(f"[TOKEN_UPDATE_PERMISSIONS_ERROR] Erreur dans /api/update-token-permissions/{token}")
        return jsonify({"error": "Erreur lors de la mise à jour des permissions du token."}), 500
