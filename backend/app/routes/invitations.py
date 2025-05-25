from flask import request
from app.utils.response import success_response, error_response, warning_response
from app.utils.validators import verify_firebase_token
from app.db.connection import get_connection
from app.services.calendar_service import verify_calendar
from app.services.user import fetch_user
from app.services.notifications import notify_and_record
from firebase_admin import auth
import time
from . import api
import json
from app.utils.messages import (
    SUCCESS_INVITATION_SENT,
    SUCCESS_INVITATION_ACCEPTED,
    SUCCESS_INVITATION_REJECTED,
    ERROR_INVITATION_SEND,
    ERROR_INVITATION_ACCEPT,
    ERROR_INVITATION_REJECT,
    WARNING_CALENDAR_NOT_FOUND,
    WARNING_USER_NOT_FOUND,
    WARNING_NOTIFICATION_NOT_FOUND,
    WARNING_INVALID_NOTIFICATION,
    WARNING_SELF_INVITATION,
    WARNING_ALREADY_INVITED
)

NOTIFICATION_INSERT = "INSERT INTO notifications (user_id, type, content, sender_uid) VALUES (%s, %s, %s, %s)"


# Route pour envoyer une invitation à un utilisateur pour un partage de calendrier
@api.route("/invitations/send/<calendar_id>", methods=["POST"])
def handle_send_invitation(calendar_id):
    try:
        t_0 = time.time()
        owner_user = verify_firebase_token()
        owner_uid = owner_user["uid"]

        receiver_email = request.get_json(force=True).get("email")
        receiver_user = auth.get_user_by_email(receiver_email)
        receiver_uid = receiver_user.uid

        if not verify_calendar(calendar_id, owner_uid):
            return warning_response(
                message=WARNING_CALENDAR_NOT_FOUND, 
                code="CALENDAR_NOT_FOUND", 
                status_code=404, 
                uid=owner_uid, 
                origin="INVITATION_SEND",
                log_extra={"calendar_id": calendar_id}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:        
                # Verif si soit même
                if owner_uid == receiver_uid:
                    return warning_response(
                        message=WARNING_SELF_INVITATION, 
                        code="SELF_INVITATION_ERROR", 
                        status_code=400, 
                        uid=owner_uid, 
                        origin="INVITATION_SEND",
                        log_extra={"calendar_id": calendar_id}
                    )

                # Vérifier si l'utilisateur existe 
                user = fetch_user(receiver_uid)

                if not user:
                    return warning_response(
                        message=WARNING_USER_NOT_FOUND, 
                        code="USER_NOT_FOUND", 
                        status_code=404, 
                        uid=owner_uid, 
                        origin="INVITATION_SEND",
                        log_extra={"calendar_id": calendar_id}
                    )

                # Vérifier si l'utilisateur a déjà été invité
                cursor.execute("SELECT * FROM shared_calendars WHERE receiver_uid = %s AND calendar_id = %s", (receiver_uid, calendar_id))
                shared_calendar = cursor.fetchone()
                if shared_calendar:
                    return warning_response(
                        message=WARNING_ALREADY_INVITED,
                        code="ALREADY_INVITED",
                        status_code=400,
                        uid=owner_uid,
                        origin="INVITATION_SEND",
                        log_extra={"calendar_id": calendar_id}
                    )
        
                # Créer une notif pour l'utilisateur receveur
                notify_and_record(
                    uid=receiver_uid,
                    title="📬 Nouvelle invitation à un calendrier",
                    body="Tu as été invité à rejoindre un calendrier partagé.",
                    notif_type="calendar_invitation",
                    sender_uid=owner_uid,
                    calendar_id=calendar_id
                )



                # Sauvegarder l'invitation dans la collection "shared_calendars" dans le calendrier de l'utilisateur owner
                cursor.execute(
                    """
                    INSERT INTO shared_calendars (receiver_uid, calendar_id, accepted, access)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (receiver_uid, calendar_id, False, "edit")
                )

                t_1 = time.time()

        return success_response(
            message=SUCCESS_INVITATION_SENT, 
            code="INVITATION_SEND_SUCCESS", 
            uid=owner_uid, 
            origin="INVITATION_SEND",
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message=ERROR_INVITATION_SEND, 
            code="INVITATION_SEND_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="INVITATION_SEND",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour accepter une invitation pour un partage de calendrier
@api.route("/invitations/accept/<notification_id>", methods=["POST"])
def handle_accept_invitation(notification_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM notifications WHERE id = %s AND user_id = %s", (notification_id, receiver_uid))
                notification = cursor.fetchone()
                if notification is None:
                    return warning_response(
                        message=WARNING_NOTIFICATION_NOT_FOUND, 
                        code="NOTIFICATION_NOT_FOUND", 
                        status_code=404, 
                        uid=receiver_uid, 
                        origin="INVITATION_ACCEPT",
                        log_extra={"notification_id": notification_id}
                    )
        
                # Vérifier si la notification est une invitation
                if notification.get("type") != "calendar_invitation":
                    return warning_response(
                        message=WARNING_INVALID_NOTIFICATION, 
                        code="INVALID_NOTIFICATION", 
                        status_code=400, 
                        uid=receiver_uid, 
                        origin="INVITATION_ACCEPT",
                        log_extra={"notification_id": notification_id}
                    )
                
                calendar_id = notification.get("content").get("calendar_id")
                sender_uid = notification.get("sender_uid")

                # Dire que l'utilisateur receveur a accepté l'invitation
                cursor.execute(
                    """
                    UPDATE shared_calendars SET accepted = TRUE WHERE receiver_uid = %s AND calendar_id = %s
                    """,
                    (receiver_uid, calendar_id)
                )
                
                # Dire que la notif a été lue
                cursor.execute(
                    """
                    UPDATE notifications SET read = TRUE WHERE id = %s AND user_id = %s
                    """,
                    (notification_id, receiver_uid)
                )

                # Créer une notif pour l'utilisateur expéditeur
                notify_and_record(
                    uid=sender_uid,
                    title="✅ Invitation acceptée",
                    body="Ton invitation a été acceptée.",
                    notif_type="calendar_invitation_accepted",
                    sender_uid=receiver_uid,
                    calendar_id=calendar_id
                )

                t_1 = time.time()

        return success_response(
            message=SUCCESS_INVITATION_ACCEPTED, 
            code="INVITATION_ACCEPT_SUCCESS", 
            uid=receiver_uid, 
            origin="INVITATION_ACCEPT",
            log_extra={"notification_id": notification_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message=ERROR_INVITATION_ACCEPT, 
            code="INVITATION_ACCEPT_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="INVITATION_ACCEPT",
            error=str(e),
            log_extra={"notification_id": notification_id}
        )


# Route pour rejeter une invitation pour un partage de calendrier
@api.route("/invitations/reject/<notification_id>", methods=["POST"])
def handle_reject_invitation(notification_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM notifications WHERE id = %s AND user_id = %s", (notification_id, receiver_uid))
                notification = cursor.fetchone()
                if not notification:
                    return warning_response(
                        message=WARNING_NOTIFICATION_NOT_FOUND, 
                        code="NOTIFICATION_NOT_FOUND", 
                        status_code=404, 
                        uid=receiver_uid, 
                        origin="INVITATION_REJECT",
                        log_extra={"notification_id": notification_id}
                    )

                # Vérifier si la notification est une invitation
                if notification.get("type") != "calendar_invitation":
                    return warning_response(
                        message=WARNING_INVALID_NOTIFICATION, 
                        code="INVALID_NOTIFICATION", 
                        status_code=400, 
                        uid=receiver_uid, 
                        origin="INVITATION_REJECT",
                        log_extra={"notification_id": notification_id}
                    )

                calendar_id = notification.get("content").get("calendar_id")
                owner_uid = notification.get("sender_uid")

                # Supprimer la notif
                cursor.execute(
                    """
                    DELETE FROM notifications WHERE id = %s AND user_id = %s
                    """,
                    (notification_id, receiver_uid)
                )
                # Créer une notif pour l'utilisateur expéditeur
                notify_and_record(
                    uid=owner_uid,
                    title="❌ Invitation refusée",
                    body="Ton invitation a été refusée.",
                    notif_type="calendar_invitation_rejected",
                    sender_uid=receiver_uid,
                    calendar_id=calendar_id
                )


                # Supprimer la notif dans la collection "shared_calendars" dans le calendrier de l'utilisateur owner
                cursor.execute(
                    """
                    DELETE FROM shared_calendars WHERE receiver_uid = %s AND calendar_id = %s
                    """,
                    (receiver_uid, calendar_id)
                )

                t_1 = time.time()

        return success_response(
            message=SUCCESS_INVITATION_REJECTED, 
            code="INVITATION_REJECT_SUCCESS", 
            uid=receiver_uid, 
            origin="INVITATION_REJECT",
            log_extra={"notification_id": notification_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message=ERROR_INVITATION_REJECT, 
            code="INVITATION_REJECT_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="INVITATION_REJECT",
            error=str(e),
            log_extra={"notification_id": notification_id}
        )

