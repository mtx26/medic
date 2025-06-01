# app/services/notifications.py
import json
from app.auth.fcm import send_fcm_notification
from app.db.connection import get_connection
from app.utils.logger import log_backend

def notify_and_record(uid, title, link, body, notif_type, sender_uid, calendar_id=None):
    try:
        # 1. Chercher le token FCM
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT token FROM fcm_tokens WHERE uid = %s", (uid,))
                results = cursor.fetchall()
                tokens = [result.get("token") for result in results] if results else None

                # 2. Envoyer la notif (si token trouvé)
                if tokens:
                    send_fcm_notification(tokens, title, body, link)

                cursor.execute("""
                    INSERT INTO notifications (user_id, type, read, timestamp, sender_uid, content)
                    VALUES (%s, %s, %s, NOW(), %s, %s)
                """, (
                    uid,
                    notif_type,
                    False,
                    sender_uid,
                    json.dumps({
                        "calendar_id": calendar_id,
                        "title": title,
                        "body": body,
                        "link": link
                    })
                ))
                conn.commit()

    except Exception as e:
        log_backend.error(f"Erreur notify_and_record : {e}", {"origin": "NOTIFICATIONS", "code": "NOTIFICATION_ERROR", "error": str(e)})
