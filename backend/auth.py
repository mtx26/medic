import firebase_admin_init 
from firebase_admin import auth
from flask import request, abort
from logger import log_backend as logger


def verify_firebase_token():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        logger.warning("Token manquant ou mal formaté", {
            "origin": "TOKEN_ERROR",
            "uid": uid
        })
        abort(401, description="Token manquant ou mal formaté")

    id_token = auth_header.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(id_token)
        logger.info("Authentification réussie", {
            "origin": "TOKEN_SUCCESS",
            "uid": decoded_token["uid"]
        })
        return decoded_token
    except Exception as e:
        logger.warning("Token invalide", {
            "origin": "TOKEN_ERROR",
            "uid": uid
        })
        abort(401, description="Token invalide ou expiré")

