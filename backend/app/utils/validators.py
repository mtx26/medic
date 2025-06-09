from functools import wraps
from flask import request, jsonify, g
import jwt
from app.config.config import Config
from app.utils.logger import log_backend as logger


def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        try:
            auth_header = request.headers.get("Authorization", "")
            token = auth_header.split(" ")[1] if " " in auth_header else auth_header

            decoded = jwt.decode(
                token,
                Config.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )

            # Stocke l'utilisateur dans le contexte `g` de Flask
            g.user = decoded
            g.uid = decoded.get("sub")

            return f(*args, **kwargs)

        except jwt.ExpiredSignatureError:
            logger.warning("Token expiré", {"origin": "TOKEN_ERROR", "uid": "unknown"})
            return jsonify({"error": "Token expiré", "code": "TOKEN_EXPIRED"}), 401

        except jwt.InvalidTokenError:
            logger.warning("Token invalide", {"origin": "TOKEN_ERROR", "uid": "unknown"})
            return jsonify({"error": "Token invalide", "code": "TOKEN_INVALID"}), 401

        except Exception as e:
            logger.warning("Erreur lors de la vérification du token", {
                "origin": "TOKEN_ERROR",
                "uid": "unknown",
                "error": str(e)
            })
            return jsonify({"error": "Token invalide", "code": "TOKEN_ERROR"}), 401

    return decorated_function
