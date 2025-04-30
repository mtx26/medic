import firebase_admin_init 
from firebase_admin import auth
from flask import request, abort
from logger import backend_logger as logger

def verify_firebase_token():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        logger.warning("[AUTH] Token manquant ou mal formaté")
        abort(401, "Token manquant ou mal formaté")

    id_token = auth_header.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception:
        logger.warning("[AUTH] Token invalide ou expiré")
        abort(401, "Token invalide ou expiré")
