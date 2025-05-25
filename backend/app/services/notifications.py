from app.auth.fcm import send_fcm_notification
from app.db.connection import get_connection
from app.utils.response import success_response, error_response
import json
import time

def notify_and_record(uid, title, body, sender_uid="system", calendar_id=None):
    try:
        # 1. Récupérer le token FCM depuis la DB
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT token FROM fcm_tokens WHERE uid = %s", (uid,))
                result = cur.fetchone()
                if not result:
                    return error_response(
                        message="Aucun token FCM trouvé",
                        code="NO_TOKEN",
                        status_code=404,
                        uid=uid,
                        origin="NOTIFY_AND_RECORD"
                    )
                token = result.get("token")

        # 2. Envoyer la notification via FCM v1
        status_code, result_data = send_fcm_notification(token, title, body)
        if status_code != 200:
            return error_response(
                message="Erreur lors de l'envoi FCM",
                code="FCM_V1_ERROR",
                status_code=status_code,
                uid=uid,
                origin="NOTIFY_AND_RECORD",
                error=result_data
            )

        # 3. Enregistrer la notification dans Supabase (table `notifications`)
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO notifications (user_id, type, read, timestamp, sender_uid, content)
                    VALUES (%s, %s, %s, NOW(), %s, %s)
                """, (
                    uid,
                    "push",
                    False,
                    sender_uid,
                    json.dumps({
                        "calendar_id": calendar_id,
                        "title": title,
                        "body": body
                    })
                ))
                conn.commit()

        # 4. Retourner succès
        return success_response(
            message="Notification envoyée et enregistrée",
            code="NOTIFY_SUCCESS",
            uid=uid,
            origin="NOTIFY_AND_RECORD",
            log_extra={"fcm_response": result_data}
        )

    except Exception as e:
        return error_response(
            message="Erreur interne",
            code="NOTIFY_ERROR",
            status_code=500,
            uid=uid,
            origin="NOTIFY_AND_RECORD",
            error=str(e)
        )
