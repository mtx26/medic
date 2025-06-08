from flask import request, g
from app.utils.response import success_response, error_response, warning_response
from app.utils.validators import require_auth
from app.db.connection import get_connection
from app.services.verifications import verify_calendar
from app.services.user import fetch_user
from app.services.notifications import notify_and_record
from firebase_admin import auth
import time
from . import api
from urllib.parse import urljoin
from app.config.config import Config
import json



# Route pour envoyer une invitation à un utilisateur pour un partage de calendrier
@api.route("/invitations/send/<calendar_id>", methods=["POST"])
@require_auth
def handle_send_invitation(calendar_id):
    try:
        t_0 = time.time()
        owner_uid = g.uid

        receiver_email = request.get_json(force=True).get("email")
        receiver_user = auth.get_user_by_email(receiver_email)
        receiver_uid = receiver_user.uid

        if not verify_calendar(calendar_id, owner_uid):
            return warning_response(
                message="calendrier non trouvé", 
                code="CALENDAR_NOT_FOUND", 
                status_code=404, 
                uid=owner_uid, 
                origin="INVITATION_SEND",
                log_extra={"calendar_id": calendar_id}
            )      
        # Verif si soit même
        if owner_uid == receiver_uid:
            return warning_response(
                message="invitation à soi-même", 
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
                message="utilisateur non trouvé", 
                code="USER_NOT_FOUND", 
                status_code=404, 
                uid=owner_uid, 
                origin="INVITATION_SEND",
                log_extra={"calendar_id": calendar_id}
            )
        with get_connection() as conn:
            with conn.cursor() as cursor:  
                # Vérifier si l'utilisateur a déjà été invité
                cursor.execute("SELECT * FROM shared_calendars WHERE receiver_uid = %s AND calendar_id = %s", (receiver_uid, calendar_id))
                shared_calendar = cursor.fetchone()
                if shared_calendar:
                    return warning_response(
                        message="utilisateur déjà invité",
                        code="ALREADY_INVITED",
                        status_code=400,
                        uid=owner_uid,
                        origin="INVITATION_SEND",
                        log_extra={"calendar_id": calendar_id}
                    )
                
                link = urljoin(Config.FRONTEND_URL, "/shared-calendars")

                # Créer une notif pour l'utilisateur receveur
                notify_and_record(
                    uid=receiver_uid,
                    title="📬 Nouvelle invitation à un calendrier",
                    link=link,
                    body="Tu as été invité à rejoindre un calendrier partagé.",
                    notif_type="calendar_invitation",
                    sender_uid=owner_uid,
                    calendar_id=calendar_id,
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
            message="invitation envoyée", 
            code="INVITATION_SEND_SUCCESS", 
            uid=owner_uid, 
            origin="INVITATION_SEND",
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de l'envoi de l'invitation", 
            code="INVITATION_SEND_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="INVITATION_SEND",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour accepter une invitation pour un partage de calendrier
@api.route("/invitations/accept/<notification_id>", methods=["POST"])
@require_auth
def handle_accept_invitation(notification_id):
    try:
        t_0 = time.time()
        receiver_uid = g.uid

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM notifications WHERE id = %s AND user_id = %s", (notification_id, receiver_uid))
                notification = cursor.fetchone()
                if notification is None:
                    return warning_response(
                        message="notification non trouvée", 
                        code="NOTIFICATION_NOT_FOUND", 
                        status_code=404, 
                        uid=receiver_uid, 
                        origin="INVITATION_ACCEPT",
                        log_extra={"notification_id": notification_id}
                    )
        
                # Vérifier si la notification est une invitation
                if notification.get("type") != "calendar_invitation":
                    return warning_response(
                        message="notification invalide", 
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
                    UPDATE shared_calendars SET accepted = TRUE, accepted_at = NOW() WHERE receiver_uid = %s AND calendar_id = %s
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
                    link=None,
                    body="Ton invitation a été acceptée.",
                    notif_type="calendar_invitation_accepted",
                    sender_uid=receiver_uid,
                    calendar_id=calendar_id
                )

                t_1 = time.time()

        return success_response(
            message="invitation acceptée", 
            code="INVITATION_ACCEPT_SUCCESS", 
            uid=receiver_uid, 
            origin="INVITATION_ACCEPT",
            log_extra={"notification_id": notification_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de l'acceptation de l'invitation", 
            code="INVITATION_ACCEPT_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="INVITATION_ACCEPT",
            error=str(e),
            log_extra={"notification_id": notification_id}
        )


# Route pour rejeter une invitation pour un partage de calendrier
@api.route("/invitations/reject/<notification_id>", methods=["POST"])
@require_auth
def handle_reject_invitation(notification_id):
    try:
        t_0 = time.time()
        receiver_uid = g.uid

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM notifications WHERE id = %s AND user_id = %s", (notification_id, receiver_uid))
                notification = cursor.fetchone()
                if not notification:
                    return warning_response(
                        message="notification non trouvée", 
                        code="NOTIFICATION_NOT_FOUND", 
                        status_code=404, 
                        uid=receiver_uid, 
                        origin="INVITATION_REJECT",
                        log_extra={"notification_id": notification_id}
                    )

                # Vérifier si la notification est une invitation
                if notification.get("type") != "calendar_invitation":
                    return warning_response(
                        message="notification invalide", 
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
                    link=None,
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
            message="invitation rejetée", 
            code="INVITATION_REJECT_SUCCESS", 
            uid=receiver_uid, 
            origin="INVITATION_REJECT",
            log_extra={"notification_id": notification_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors du rejet de l'invitation", 
            code="INVITATION_REJECT_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="INVITATION_REJECT",
            error=str(e),
            log_extra={"notification_id": notification_id}
        )

