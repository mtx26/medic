import firebase_admin_init 
from firebase_admin import auth
from flask import request, abort
from logger import backend_logger as logger


def verify_firebase_token():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        logger.warning("[AUTH] Token manquant ou mal formaté")
        abort(401, description="Token manquant ou mal formaté")

    id_token = auth_header.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(id_token)
        logger.info(f"[AUTH] Authentification réussie pour uid={decoded_token['uid']}")
        return decoded_token
    except Exception as e:
        logger.warning(f"[AUTH] Token invalide : {str(e)}")
        abort(401, description="Token invalide ou expiré")

