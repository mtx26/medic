from . import api
from app.utils.validators import verify_firebase_token
from app.utils.response import success_response, error_response, warning_response
from app.services.user import fetch_user
from app.db.connection import get_connection
from flask import request
import time
from app.auth.fcm import send_fcm_notification


DEFAULT_PHOTO = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg"

def safely_get_calendar_name(calendar_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
            calendar = cursor.fetchone()
            if calendar:
                return calendar.get("name")
            else:
                return None
    return None

def get_user_info(uid):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            user = fetch_user(uid)
            return user.get("display_name"), user.get("email"), user.get("photo_url")

# Route pour récupérer toutes les notifications
@api.route("/notifications", methods=["GET"])
def handle_notifications():
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM notifications WHERE user_id = %s", (uid,))
                notifications_data = cursor.fetchall()

                if notifications_data is None:
                    return success_response(
                        message="aucune notification trouvée",
                        code="NOTIFICATIONS_FETCH_SUCCESS",
                        uid=uid,
                        origin="NOTIFICATIONS_FETCH",
                        data={"notifications": []}
                    )

                calendar_name_cache = {}
                sender_info_cache = {}
                notifications = []
                t_1 = time.time()

                for notif in notifications_data:
                    content = notif.get("content") or {}
                    sender_uid = notif.get("sender_uid")
                    calendar_id = content.get("calendar_id")
                    notification_id = notif.get("id")

                    if not calendar_id:
                        continue

                    # Cache calendar name
                    if calendar_id not in calendar_name_cache:
                        calendar_name_cache[calendar_id] = safely_get_calendar_name(calendar_id)
                    calendar_name = calendar_name_cache[calendar_id]

                    # Cache sender info
                    if sender_uid not in sender_info_cache:
                        sender_info_cache[sender_uid] = get_user_info(sender_uid)
                    sender_name, sender_email, sender_photo_url = sender_info_cache[sender_uid]

                    notifications.append({
                        "notification_id": notif.get("id"),
                        "notification_type": notif.get("type"),
                        "read": notif.get("read"),
                        "timestamp": notif.get("timestamp"),
                        "calendar_id": calendar_id,
                        "calendar_name": calendar_name,
                        "sender_name": sender_name,
                        "sender_email": sender_email,
                        "sender_photo_url": sender_photo_url or DEFAULT_PHOTO,
                    })
                t_2 = time.time()

        return success_response(
            message="notifications récupérées",
            code="NOTIFICATIONS_FETCH_SUCCESS",
            uid=uid,
            origin="NOTIFICATIONS_FETCH",
            data={"notifications": notifications},
            log_extra={"time": t_2 - t_0, "time_append": t_2 - t_1}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des notifications",
            code="NOTIFICATIONS_FETCH_ERROR",
            status_code=500,
            uid=uid,
            origin="NOTIFICATIONS_FETCH",
            error=str(e)
        )

# Route pour marquer une notification comme lue
@api.route("/notifications/<notification_id>", methods=["POST"])
def handle_read_notification(notification_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM notifications WHERE id = %s AND user_id = %s", (notification_id, uid))
                notif = cursor.fetchone()
                if not notif:
                    return warning_response(
                        message="notification non trouvée", 
                        code="NOTIFICATION_READ_ERROR", 
                        status_code=404, 
                        uid=uid, 
                        origin="NOTIFICATION_READ",
                        log_extra={"notification_id": notification_id}
                    )

                cursor.execute("UPDATE notifications SET read = TRUE WHERE id = %s AND user_id = %s", (notification_id, uid))
                conn.commit()
                t_1 = time.time()

        return success_response(
            message="notification marquée comme lue", 
            code="NOTIFICATION_READ_SUCCESS", 
            uid=uid, 
            origin="NOTIFICATION_READ",
            log_extra={"notification_id": notification_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la marque de la notification comme lue", 
            code="NOTIFICATION_READ_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="NOTIFICATION_READ",
            error=str(e)
        )

# Route pour enregistrer un token FCM
@api.route("/notifications/register-token", methods=["POST"])
def register_token():
    data = request.json
    token = data.get("token")
    uid = data.get("uid")

    if not token or not uid:
        return error_response(
            message="données manquantes", 
            code="MISSING_DATA",
            status_code=400,
            origin="FCM_REGISTER"
        )

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO fcm_tokens (uid, token)
                    VALUES (%s, %s)
                    ON CONFLICT (token) DO NOTHING;
                """, (uid, token))
                conn.commit()

        return success_response(
            message="token enregistré", 
            code="FCM_REGISTERED",
            uid=uid,
            origin="FCM_REGISTER",
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de l'enregistrement du token", 
            code="FCM_REGISTER_ERROR",
            status_code=500,
            origin="FCM_REGISTER",
            error=str(e)
        )

@api.route("/notifications/send", methods=["POST"])
def send_notification():
    data = request.json
    uid = data.get("uid")
    title = data.get("title")
    body = data.get("body")

    if not uid or not title or not body:
        return error_response(
            message="données manquantes", 
            code="MISSING_DATA", 
            status_code=400, 
            origin="FCM_SEND"
        )

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT token FROM fcm_tokens WHERE uid = %s", (uid,))
                results = cursor.fetchall()
                if not results:
                    return error_response(
                        message="aucun token trouvé", 
                        code="NO_TOKEN", 
                        status_code=404, 
                        uid=uid, 
                        origin="FCM_SEND"
                    )
                tokens = [result.get("token") for result in results]
                status_code, result_data = send_fcm_notification(tokens=tokens, title=title, body=body, link=None)


        if status_code == 200:
            return success_response(
                message="notification envoyée", 
                code="NOTIFICATION_SENT", 
                uid=uid, 
                origin="FCM_SEND",
                log_extra={"response": result_data}
            )
        else:
            return error_response(
                message="erreur lors de l'envoi de la notification", 
                code="FCM_V1_ERROR", 
                status_code=status_code, 
                uid=uid, 
                origin="FCM_SEND",
                error=result_data
            )

    except Exception as e:
        return error_response(
            message="erreur lors de l'envoi de la notification", 
            code="SEND_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="FCM_SEND", 
            error=str(e)
        )