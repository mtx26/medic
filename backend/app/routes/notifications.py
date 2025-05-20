from . import api
from app.utils.validators import verify_firebase_token
from app.utils.response import success_response, error_response, warning_response
from app.utils.logger import log_backend as logger
from app.db.connection import get_connection
from app.utils.messages import (
    SUCCESS_NOTIFICATIONS_FETCHED,
    SUCCESS_NOTIFICATION_READ,
    ERROR_NOTIFICATIONS_FETCH,
    ERROR_NOTIFICATION_READ,
    WARNING_NOTIFICATION_NOT_FOUND
)


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
            cursor.execute("SELECT * FROM users WHERE id = %s", (uid,))
            user = cursor.fetchone()
            return user.get("display_name"), user.get("email"), user.get("photo_url")

@api.route("/notifications", methods=["GET"])
def handle_notifications():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM notifications WHERE user_id = %s", (uid,))
                notifications_data = cursor.fetchall()

                if notifications_data is None:
                    return success_response(
                        message=SUCCESS_NOTIFICATIONS_FETCHED,
                        code="NOTIFICATIONS_FETCH_SUCCESS",
                        uid=uid,
                        origin="NOTIFICATIONS_FETCH",
                        data={"notifications": []}
                    )

                calendar_name_cache = {}
                sender_info_cache = {}
                notifications = []

                for notif in notifications_data:
                    content = notif.get("content") or {}
                    calendar_id = content.get("calendar_id")
                    sender_uid = content.get("sender_uid")

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

        return success_response(
            message=SUCCESS_NOTIFICATIONS_FETCHED,
            code="NOTIFICATIONS_FETCH_SUCCESS",
            uid=uid,
            origin="NOTIFICATIONS_FETCH",
            data={"notifications": notifications}
        )

    except Exception as e:
        return error_response(
            message=ERROR_NOTIFICATIONS_FETCH,
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
        user = verify_firebase_token()
        uid = user["uid"]

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM notifications WHERE id = %s AND user_id = %s", (notification_id, uid))
                notif = cursor.fetchone()
                if not notif:
                    return warning_response(
                        message=WARNING_NOTIFICATION_NOT_FOUND, 
                        code="NOTIFICATION_READ_ERROR", 
                        status_code=404, 
                        uid=uid, 
                        origin="NOTIFICATION_READ",
                        log_extra={"notification_id": notification_id}
                    )
        
                cursor.execute("UPDATE notifications SET read = TRUE WHERE id = %s AND user_id = %s", (notification_id, uid))

        return success_response(
            message=SUCCESS_NOTIFICATION_READ, 
            code="NOTIFICATION_READ_SUCCESS", 
            uid=uid, 
            origin="NOTIFICATION_READ",
            log_extra={"notification_id": notification_id}
        )

    except Exception as e:
        return error_response(
            message=ERROR_NOTIFICATION_READ, 
            code="NOTIFICATION_READ_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="NOTIFICATION_READ",
            error=str(e)
        )
