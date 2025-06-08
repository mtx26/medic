# app/services/notifications.py
import json
from app.auth.fcm import send_fcm_notification
from app.db.connection import get_connection
from app.utils.logger import log_backend
from app.services.user import fetch_user
from app.email.send_email import send_email
from app.config.config import Config
import traceback

def send_push_notification(uid, title, body, link, notif_type, sender_uid, calendar_id=None):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            # 1. Chercher le token FCM
            cursor.execute("SELECT token FROM fcm_tokens WHERE uid = %s", (uid,))
            results = cursor.fetchall()
            tokens = [result.get("token") for result in results] if results else None

            # 2. Envoyer la notif (si token trouvé)
            if tokens:
                send_fcm_notification(tokens, title, body, link)

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

def send_email_notification(uid, notif_type, sender_uid, calendar_id=None):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            user_settings = fetch_user(uid)
            email = user_settings.get("email")

            sender = fetch_user(sender_uid)  # Pour avoir son nom
            sender_name = sender.get("display_name", "un utilisateur")

            calendar_name = None
            if calendar_id:
                cursor.execute("SELECT name FROM calendars WHERE id = %s", (calendar_id,))
                row = cursor.fetchone()
                if row:
                    calendar_name = row.get("name")

            subject, plain_body, html_body = generate_email_content(notif_type, sender_name, calendar_name)

            if email:
                send_email(
                    to=email,
                    subject=subject,
                    html=html_body,
                    plain=plain_body
                )


def generate_email_content(notif_type, sender_name, calendar_name=None):
    base_link = f"{Config.FRONTEND_URL}/notifications"
    logo_url = f"{Config.FRONTEND_URL}/icons/logo.png"

    match notif_type:
        case "calendar_invitation":
            subject = "Nouvelle invitation à un calendrier"
            body = f"{sender_name} vous invite à rejoindre le calendrier « {calendar_name } »."
        case "calendar_invitation_accepted":
            subject = "Invitation acceptée"
            body = f"{sender_name} a accepté votre invitation pour rejoindre le calendrier « {calendar_name } »."
        case "calendar_invitation_rejected":
            subject = "Invitation refusée"
            body = f"{sender_name} a refusé votre invitation pour rejoindre le calendrier « {calendar_name } »."
        case "calendar_shared_deleted_by_owner":
            subject = "Partage annulé"
            body = f"{sender_name} a arrêté de partager le calendrier « {calendar_name } » avec vous."
        case "calendar_shared_deleted_by_receiver":
            subject = "Partage retiré"
            body = f"{sender_name} a retiré le calendrier « {calendar_name } »."
        case _:
            subject = "Nouvelle notification"
            body = "Vous avez reçu une nouvelle notification dans MediTime."

    html = f"""
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div style="background-color: #007bff; padding: 16px;">
          <img src="{logo_url}" alt="MediTime Logo" style="height: 40px;" />
        </div>
        <div style="padding: 24px;">
          <h2 style="color: #333;">{subject}</h2>
          <p style="font-size: 16px; color: #555;">{body}</p>
          <div style="margin: 32px 0;">
            <a href="{base_link}" style="background-color: #007bff; color: white; text-decoration: none; padding: 12px 20px; border-radius: 4px; display: inline-block;">
              Voir mes notifications
            </a>
          </div>
          <p style="font-size: 13px; color: #999;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
            <a href="{base_link}" style="color: #007bff;">{base_link}</a>
          </p>
        </div>
      </div>
    </div>
    """

    return f"MediTime - {subject}", body, html




def notify_and_record(uid, title, link, body, notif_type, sender_uid, calendar_id=None):
    try:
        user_settings = fetch_user(uid)
        email_enabled = user_settings.get("email_enabled")
        push_enabled = user_settings.get("push_enabled")

        if push_enabled:
            send_push_notification(uid, title, body, link, notif_type, sender_uid, calendar_id)
        if email_enabled:
            send_email_notification(uid, notif_type, sender_uid, calendar_id)

    except Exception as e:
        log_backend.error(f"Erreur notify_and_record : {e}", {"origin": "NOTIFICATIONS", "code": "NOTIFICATION_ERROR", "error": traceback.format_exc()})
