# app/services/notifications.py
import json
from app.auth.fcm import send_fcm_notification
from app.db.connection import get_connection

def notify_and_record(uid, title, link, body, notif_type, sender_uid, calendar_id=None):
    try:
        # 1. Chercher le token FCM
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT token FROM fcm_tokens WHERE uid = %s", (uid,))
                result = cursor.fetchone()
                token = result.get("token") if result else None

        # 2. Envoyer la notif (si token trouvé)
        if token:
            send_fcm_notification(token, title, body, link)

        # 3. Enregistrer la notification dans Supabase
        with get_connection() as conn:
            with conn.cursor() as cursor:
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
        print("Erreur notify_and_record :", e)
