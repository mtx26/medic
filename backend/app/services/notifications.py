# app/services/notifications.py
import json
from app.auth.fcm import send_fcm_notification
from app.db.connection import get_connection
from app.services.calendar_service import fetch_calendar, fetch_medicine_name
from app.utils.logger import log_backend
from app.services.user import fetch_user
from app.email.send_email import send_email
from app.config import Config
import traceback

def fetch_sender_name(sender_uid):
    sender = fetch_user(sender_uid)
    return sender.get("display_name") if sender else "un utilisateur"

def fetch_calendar_name(calendar_id):
    calendar = fetch_calendar(calendar_id)
    return calendar.get("name") if calendar else "unknown"

def send_push_notification(uid, json_body, notif_type, sender_name, calendar_name):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            # 1. Chercher le token FCM
            cursor.execute("SELECT token FROM fcm_tokens WHERE uid = %s", (uid,))
            tokens = [r["token"] for r in cursor.fetchall()]

            match notif_type:
                case "calendar_invitation":
                    title = "Nouvelle invitation à un calendrier"
                    body = f"{sender_name} vous invite à rejoindre le calendrier « {calendar_name } »."
                case "calendar_invitation_accepted":
                    title = "Invitation acceptée"
                    body = f"{sender_name} a accepté votre invitation pour rejoindre le calendrier « {calendar_name } »."
                case "calendar_invitation_rejected":
                    title = "Invitation refusée"
                    body = f"{sender_name} a refusé votre invitation pour rejoindre le calendrier « {calendar_name } »."
                case "calendar_shared_deleted_by_owner":
                    title = "Partage annulé"
                    body = f"{sender_name} a arrêté de partager le calendrier « {calendar_name } » avec vous."
                case "calendar_shared_deleted_by_receiver":
                    title = "Partage retiré"
                    body = f"{sender_name} a retiré le calendrier « {calendar_name } »."
                case "low_stock":
                    name = fetch_medicine_name(json_body.get("medication_id"))
                    qty = json_body.get("medication_qty") or 0
                    title = "Stock faible"
                    body = f"Le médicament « {name} » est presque épuisé ({qty} restants)."
                case _:
                    title = "Nouvelle notification"
                    body = "Vous avez reçu une nouvelle notification dans MediTime."

            # 2. Envoyer la notif (si token trouvé)
            if tokens:
                send_fcm_notification(tokens, title, body, json_body)
            else:
                log_backend.warning(
                    f"Aucun token FCM trouvé pour l'utilisateur {uid}", 
                    {
                        "origin": "NOTIFICATIONS", 
                        "code": "NO_FCM_TOKEN", 
                        "uid": uid,
                    }
                )

def send_email_notification(uid, json_body, notif_type, sender_name, calendar_name):
    user = fetch_user(uid)
    email = user.get("email") if user else None

    subject, plain_body, html_body = generate_email_content(notif_type, sender_name, calendar_name, json_body)

    if email:
        send_email(
            to=email,
            subject=subject,
            html=html_body,
            plain=plain_body    
        )


def generate_email_content(notif_type, sender_name, calendar_name, json_body):
    base_link = f"https://{Config.FRONTEND_URL}/notifications"
    logo_url = f"https://{Config.FRONTEND_URL}/icons/logo.png"

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
        case "low_stock":
            name = fetch_medicine_name(json_body.get("medication_id"))
            qty = json_body.get("medication_qty") or 0
            subject = "Stock faible"
            body = f"Le médicament « {name} » est presque épuisé ({qty} restants)."
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




def notify_and_record(uid, json_body, notif_type, sender_uid):
    try:
        user_settings = fetch_user(uid)
        email_enabled = user_settings.get("email_enabled")
        push_enabled = user_settings.get("push_enabled")

        sender_name = fetch_sender_name(sender_uid)
        calendar_name = fetch_calendar_name(json_body.get("calendar_id"))

        if push_enabled:
            send_push_notification(uid, json_body, notif_type, sender_name, calendar_name)
        if email_enabled:
            send_email_notification(uid, json_body, notif_type, sender_name, calendar_name)
        
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO notifications (user_id, type, read, timestamp, sender_uid, content)
                    VALUES (%s, %s, %s, NOW(), %s, %s::jsonb)
                """, (uid, notif_type, False, sender_uid, json.dumps(json_body)))
                conn.commit()

    except Exception as e:
        log_backend.error(
            f"Erreur notify_and_record : {e}", 
            {
                "origin": "NOTIFICATIONS", 
                "code": "NOTIFICATION_ERROR", 
                "error": str(e),
                "trace": traceback.format_exc()
            }
        )
