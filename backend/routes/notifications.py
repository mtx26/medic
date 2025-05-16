from . import api
from auth import verify_firebase_token
from firebase_admin import firestore
from response import success_response, error_response, warning_response
from logger import log_backend as logger
from messages import (
    SUCCESS_NOTIFICATIONS_FETCHED,
    SUCCESS_NOTIFICATION_READ,
    ERROR_NOTIFICATIONS_FETCH,
    ERROR_NOTIFICATION_READ,
    WARNING_NOTIFICATION_NOT_FOUND
)


db = firestore.client()
DEFAULT_PHOTO = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg"

def get_user(uid):
    doc = db.collection("users").document(uid).get()
    return doc.to_dict() if doc.exists else None

def safely_get_calendar_name(owner_uid, calendar_id):
    calendar_doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).get()
    if calendar_doc.exists:
        return calendar_doc.to_dict().get("calendar_name")
    return None

def delete_notification(uid, notification_id):
    db.collection("users").document(uid).collection("notifications").document(notification_id).delete()
    logger.warning(WARNING_NOTIFICATION_NOT_FOUND, {
        "origin": "NOTIFICATIONS_FETCH",
        "notification_id": notification_id
    })

@api.route("/api/notifications", methods=["GET"])
def handle_notifications():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        notifications_docs = db.collection("users").document(uid).collection("notifications").get()

        if not notifications_docs:
            return success_response(
                message=SUCCESS_NOTIFICATIONS_FETCHED,
                code="NOTIFICATIONS_FETCH_SUCCESS",
                uid=uid,
                origin="NOTIFICATIONS_FETCH",
                data={"notifications": []}
            )

        notifications = []
        for doc in notifications_docs:
            notif = doc.to_dict().copy()
            notif_id = notif.get("notification_id")

            owner = get_user(notif.get("owner_uid"))
            receiver = get_user(notif.get("receiver_uid"))
            if not owner or not receiver:
                delete_notification(uid, notif_id)
                continue

            calendar_id = notif.get("calendar_id")
            if calendar_id:
                calendar_name = safely_get_calendar_name(notif["owner_uid"], calendar_id)
                if calendar_name:
                    notif["calendar_name"] = calendar_name

            notif.update({
                "owner_name": owner.get("display_name"),
                "owner_email": owner.get("email"),
                "owner_photo_url": owner.get("photo_url") or DEFAULT_PHOTO,
                "receiver_name": receiver.get("display_name"),
                "receiver_email": receiver.get("email"),
                "receiver_photo_url": receiver.get("photo_url") or DEFAULT_PHOTO
            })

            notifications.append(notif)

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
@api.route("/api/notifications/<notification_id>", methods=["POST"])
def handle_read_notification(notification_id):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        doc = db.collection("users").document(uid).collection("notifications").document(notification_id)
        if not doc.get().exists:
            return warning_response(
                message=WARNING_NOTIFICATION_NOT_FOUND, 
                code="NOTIFICATION_READ_ERROR", 
                status_code=404, 
                uid=uid, 
                origin="NOTIFICATION_READ",
                log_extra={"notification_id": notification_id}
            )
        
        doc.update({
            "read": True
        })

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
