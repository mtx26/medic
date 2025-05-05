from . import api
from auth import verify_firebase_token
from firebase_admin import firestore
from response import success_response, error_response, warning_response
from logger import log_backend as logger

db = firestore.client()

# Route pour récupérer les notifications d'un utilisateur
@api.route("/api/notifications", methods=["GET"])
def handle_notifications():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        notifications_ref = db.collection("users").document(uid).collection("notifications").get()
        notifications = []

        for doc in notifications_ref:
            notif_data = doc.to_dict().copy()

            owner_uid = notif_data.get("owner_uid")
            receiver_uid = notif_data.get("receiver_uid")
            calendar_id = notif_data.get("calendar_id")

            if calendar_id:
                calendar_doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).get()
                if calendar_doc.exists:
                    calendar_data = calendar_doc.to_dict()
                    notif_data.update({
                        "calendar_name": calendar_data.get("calendar_name")
                    })

            notification_id = notif_data.get("notification_id")
            owner_doc = db.collection("users").document(owner_uid).get()
            receiver_doc = db.collection("users").document(receiver_uid).get()

            if not owner_doc.exists:
                db.collection("users").document(uid).collection("notifications").document(notification_id).delete()
                logger.warning("Propriétaire de la notification introuvable, notification supprimée", {
                    "origin": "NOTIFICATIONS_FETCH",
                    "uid": uid,
                    "notification_id": notification_id
                })
                continue
            if not receiver_doc.exists:
                db.collection("users").document(uid).collection("notifications").document(notification_id).delete()
                logger.warning("Destinataire de la notification introuvable, notification supprimée", {
                    "origin": "NOTIFICATIONS_FETCH",
                    "uid": uid,
                    "notification_id": notification_id
                })
                continue

            owner_data = owner_doc.to_dict()
            receiver_data = receiver_doc.to_dict()

            notif_data.update({
                "owner_name": owner_data.get("display_name"),
                "owner_photo_url": owner_data.get("photo_url"),
                "owner_email": owner_data.get("email"),
                "receiver_name": receiver_data.get("display_name"),
                "receiver_photo_url": receiver_data.get("photo_url"),
                "receiver_email": receiver_data.get("email")

            })

            notifications.append(notif_data)
        

        return success_response(
            message="Notifications récupérées avec succès", 
            code="NOTIFICATIONS_FETCH_SUCCESS", 
            uid=uid, 
            origin="NOTIFICATIONS_FETCH",
            data={"notifications": notifications}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération des notifications.", 
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
                message="Notification introuvable", 
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
            message="Notification marquée comme lue avec succès", 
            code="NOTIFICATION_READ_SUCCESS", 
            uid=uid, 
            origin="NOTIFICATION_READ",
            log_extra={"notification_id": notification_id}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la lecture de la notification.", 
            code="NOTIFICATION_READ_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="NOTIFICATION_READ",
            error=str(e)
        )
