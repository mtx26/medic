from functools import wraps
from flask import request, jsonify, g
import jwt
from app.config.config import Config
from app.utils.logger import log_backend as logger


def decode_token(token):
    """Décode un token JWT Supabase et retourne l'utilisateur (payload) ou None."""
    if not token:
        return None

    try:
        return jwt.decode(
            token,
            Config.SUPABASE_JWT_SECRET or "",
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
    except jwt.ExpiredSignatureError:
        logger.warning("Token expiré", {"origin": "TOKEN_ERROR", "uid": "unknown"})
    except jwt.InvalidTokenError:
        logger.warning("Token invalide", {"origin": "TOKEN_ERROR", "uid": "unknown"})
    except Exception as e:
        logger.warning("Erreur lors de la vérification du token", {
            "origin": "TOKEN_ERROR",
            "uid": "unknown",
            "error": str(e)
        })
    return None


def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.split(" ")[1] if " " in auth_header else auth_header

        user = decode_token(token)
        if not user:
            return jsonify({"error": "Token invalide", "code": "TOKEN_INVALID"}), 401

        g.user = user
        g.uid = user.get("sub")
        return f(*args, **kwargs)

    return decorated_function
