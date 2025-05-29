from firebase_admin import auth
from flask import request, abort
from app.utils.logger import log_backend as logger

def verify_firebase_token():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        logger.warning("token manquant ou mal formaté", {
            "origin": "TOKEN_ERROR",
            "uid": "unknown"
        })
        abort(401, description="Token manquant ou mal formaté")

    id_token = auth_header.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception:
        logger.warning("token invalide ou expiré", {
            "origin": "TOKEN_ERROR",
            "uid": "unknown"
        })
        abort(401, description="Token invalide ou expiré")