from . import api
from auth import verify_firebase_token
from firebase_admin import firestore
from response import success_response, error_response, warning_response

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
            notifications.append(doc.to_dict())

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
