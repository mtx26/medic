from . import api
from auth import verify_firebase_token
from response import success_response, error_response, warning_response
from logger import log_backend as logger
from supabase_client import supabase

# Route pour récupérer les notifications d'un utilisateur
@api.route("/api/notifications", methods=["GET"])
def handle_notifications():
    try:
        uid, token = verify_firebase_token()
        uid = user["uid"]

        response = supabase.table("notifications").select("*",
            "calendar_id:calendar_id (id, name, owner_uid)",
            "receiver:receiver_uid (id, display_name, email, photo_url)",
            "owner:owner_uid (id, display_name, email, photo_url)")\
            .eq("user_id", uid).order("timestamp", desc=True).execute()

        if not response.data:
            return success_response(
                message="Aucune notification trouvée",
                code="NOTIFICATIONS_FETCH_EMPTY",
                uid=uid,
                origin="NOTIFICATIONS_FETCH",
                data={"notifications": []}
            )

        notifications = []
        for notif in response.data:
            owner = notif.get("owner", {})
            receiver = notif.get("receiver", {})
            calendar = notif.get("calendar_id", {})

            notif.update({
                "owner_name": owner.get("display_name"),
                "owner_photo_url": owner.get("photo_url") or "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg",
                "owner_email": owner.get("email"),
                "receiver_name": receiver.get("display_name"),
                "receiver_photo_url": receiver.get("photo_url") or "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg",
                "receiver_email": receiver.get("email"),
                "calendar_name": calendar.get("name")
            })

            notifications.append(notif)

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
        uid, token = verify_firebase_token()
        uid = user["uid"]

        notif = supabase.table("notifications").select("*").eq("id", notification_id).eq("user_id", uid).single().execute()
        if not notif.data:
            return warning_response(
                message="Notification introuvable",
                code="NOTIFICATION_READ_ERROR",
                status_code=404,
                uid=uid,
                origin="NOTIFICATION_READ",
                log_extra={"notification_id": notification_id}
            )

        supabase.table("notifications").update({"read": True}).eq("id", notification_id).execute()

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
