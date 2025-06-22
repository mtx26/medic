# app/services/notifications.py
import json
from app.auth.fcm import send_fcm_notification
from app.db.connection import get_connection
from app.services.calendar_service import fetch_calendar, fetch_medicine_name
from app.utils.logger import log_backend
from app.services.user import fetch_user
from app.services.messaging import send_email, send_sms
from app.config import Config
import traceback

def fetch_user_name(uid):
    user = fetch_user(uid)
    return user.get("display_name") if user else "un utilisateur"

def fetch_calendar_name(calendar_id):
    calendar = fetch_calendar(calendar_id)
    return calendar.get("name") if calendar else "unknown"

def send_push_notification(uid, json_body, notif_type):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            # 1. Chercher le token FCM
            cursor.execute("SELECT token FROM fcm_tokens WHERE uid = %s", (uid,))
            tokens = [r["token"] for r in cursor.fetchall()]

            match notif_type:
                case "calendar_invitation":
                    title = "Nouvelle invitation à un calendrier"
                    body = f"{json_body.get('sender_name')} vous invite à rejoindre le calendrier « {json_body.get('calendar_name') } »."
                case "calendar_invitation_accepted":
                    title = "Invitation acceptée"
                    body = f"{json_body.get('sender_name')} a accepté votre invitation pour rejoindre le calendrier « {json_body.get('calendar_name') } »."
                case "calendar_invitation_rejected":
                    title = "Invitation refusée"
                    body = f"{json_body.get('sender_name')} a refusé votre invitation pour rejoindre le calendrier « {json_body.get('calendar_name') } »."
                case "calendar_shared_deleted_by_owner":
                    title = "Partage annulé"
                    body = f"{json_body.get('sender_name')} a arrêté de partager le calendrier « {json_body.get('calendar_name') } » avec vous."
                case "calendar_shared_deleted_by_receiver":
                    title = "Partage retiré"
                    body = f"{json_body.get('sender_name')} a retiré le calendrier « {json_body.get('calendar_name') } »."
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

def send_email_notification(uid, json_body, notif_type):
    user = fetch_user(uid)
    email = user.get("email") if user else None

    subject, plain_body, html_content = generate_email_content(notif_type, json_body)

    if email:
        send_email(
            to=email,
            subject=subject,
            html_content=html_content,
            plain=plain_body    
        )

def send_sms_notification(uid, json_body, notif_type):
    user = fetch_user(uid)
    phone = user.get("phone") if user else None

    subject, plain_body, html_content = generate_email_content(notif_type, json_body)

    if phone:
        send_sms(phone, plain_body)
    else:
        log_backend.warning(
            f"Aucun numéro de téléphone trouvé pour l'utilisateur {uid}", 
            {
                "origin": "NOTIFICATIONS", 
                "code": "NO_PHONE_NUMBER", 
                "uid": uid,
            }
        )   

def generate_email_content(notif_type, json_body):
    base_link = f"https://{Config.FRONTEND_URL}/notifications"

    match notif_type:
        case "calendar_invitation":
            subject = "Nouvelle invitation à un calendrier"
            body = f"{json_body.get('sender_name')} vous invite à rejoindre le calendrier « {json_body.get('calendar_name') } »."
        case "calendar_invitation_accepted":
            subject = "Invitation acceptée"
            body = f"{json_body.get('sender_name')} a accepté votre invitation pour rejoindre le calendrier « {json_body.get('calendar_name') } »."
        case "calendar_invitation_rejected":
            subject = "Invitation refusée"
            body = f"{json_body.get('sender_name')} a refusé votre invitation pour rejoindre le calendrier « {json_body.get('calendar_name') } »."
        case "calendar_shared_deleted_by_owner":
            subject = "Partage annulé"
            body = f"{json_body.get('sender_name')} a arrêté de partager le calendrier « {json_body.get('calendar_name') } » avec vous."
        case "calendar_shared_deleted_by_receiver":
            subject = "Partage retiré"
            body = f"{json_body.get('sender_name')} a retiré le calendrier « {json_body.get('calendar_name') } »."
        case "low_stock":
            name = fetch_medicine_name(json_body.get("medication_id"))
            qty = json_body.get("medication_qty") or 0
            subject = "Stock faible"
            body = f"Le médicament « {name} » est presque épuisé ({qty} restants)."
        case _:
            subject = "Nouvelle notification"
            body = "Vous avez reçu une nouvelle notification dans MediTime."

    html_content = f"""
        <p style="font-size: 16px; color: #555;">{body}</p>
        <div style="margin: 32px 0;">
            <a href="{base_link}" style="background-color: #007bff; color: white; text-decoration: none; padding: 12px 20px; border-radius: 4px; display: inline-block;">
            Voir mes notifications
            </a>
        </div>
        <p style="font-size: 13px; color: #999;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
            <a href="{base_link}" style="color: #007bff;">{base_link}</a>
        </p>
    """

    return f"MediTime - {subject}", body, html_content




def notify_and_record(uid, json_body, notif_type):
    try:
        user_settings = fetch_user(uid)
        email_enabled = user_settings.get("email_enabled")
        push_enabled = user_settings.get("push_enabled")
        sms_enabled = user_settings.get("sms_enabled")
        
        calendar_id = json_body.get("calendar_id")
        sender_uid = json_body.get("sender_uid")
        
        if calendar_id:
            calendar_name = fetch_calendar_name(calendar_id)
        else:
            calendar_name = None
        json_body["calendar_name"] = calendar_name

    
        sender_name = fetch_user_name(sender_uid)
        json_body["sender_name"] = sender_name

        if push_enabled:
            send_push_notification(uid, json_body, notif_type)
        if email_enabled:
            send_email_notification(uid, json_body, notif_type)
        if sms_enabled:
            send_sms_notification(uid, json_body, notif_type)
        
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