from app.db.connection import get_connection
from app.utils.logger import log_backend as logger
from datetime import datetime, timezone

def verify_calendar_share(calendar_id : str, receiver_uid : str) -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
                calendar = cursor.fetchone()
                if not calendar:
                    return False
                
                cursor.execute("SELECT * FROM shared_calendars WHERE calendar_id = %s AND receiver_uid = %s", (calendar_id, receiver_uid,))
                shared_calendar = cursor.fetchone()
                if not shared_calendar:
                    logger.warning("accès refusé", {
                        "origin": "SHARED_VERIFY",
                        "uid": receiver_uid,
                        "calendar_id": calendar_id,
                    })
                    return False
                
                return True

    except Exception as e:
        logger.error("erreur lors de la vérification de l'accès au calendrier partagé", {
            "origin": "SHARED_VERIFY_ERROR",
            "uid": receiver_uid,
            "calendar_id": calendar_id, 
            "error": str(e)
        })
        return False

def verify_calendar(calendar_id : str, uid : str) -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s AND owner_uid = %s", (calendar_id, uid,))
                calendar = cursor.fetchone()
                if not calendar:
                    return False
                
                return True

    except Exception as e:
        logger.error("erreur lors de la vérification de l'accès au calendrier", {
            "origin": "CALENDAR_VERIFY_ERROR",
            "uid": uid,
            "calendar_id": calendar_id,
            "error": str(e)
        })
        return False

def verify_token(token : str) -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_tokens WHERE id = %s", (token,))
                token_data = cursor.fetchone()
                if not token_data:
                    return False

                calendar_id = token_data.get("calendar_id")
                owner_uid = token_data.get("owner_uid")
                expires_at = token_data.get("expires_at")
                revoked = token_data.get("revoked")
                permissions = token_data.get("permissions")

                if not verify_calendar(calendar_id, owner_uid):
                    return False

                now = datetime.now(timezone.utc).date()
                
                if expires_at and now > expires_at.date():
                    return False

                if revoked:
                    return False

                if "read" not in permissions:
                    return False

                return calendar_id

    except Exception as e:
        logger.error("erreur lors de la vérification du token", {
            "origin": "TOKEN_VERIFY_ERROR",
            "token": token,
            "error": str(e)
        })
        return False

def verify_token_owner(token : str, uid : str) -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_tokens WHERE id = %s", (token,))
                token_data = cursor.fetchone()
                if not token_data:
                    return False

                if token_data.get("owner_uid") != uid:
                    return False

                return True

    except Exception as e:
        logger.error("erreur lors de la vérification de la propriété du token", {
            "origin": "TOKEN_OWNER_VERIFY_ERROR",
            "token": token,
            "uid": uid,
            "error": str(e)
        })
        return False