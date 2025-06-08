import smtplib
from email.message import EmailMessage
from app.utils.logger import log_backend
from app.config import Config

def send_email(to, subject, html, plain=None):
    try:
        print("here 3")
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = Config.NOTIFICATION_EMAIL_ADDRESS
        msg["To"] = to
        msg.set_content(plain or "Ce message contient du HTML.")
        msg.add_alternative(html, subtype="html")

        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
            server.starttls()
            server.login(Config.NOTIFICATION_EMAIL_ADDRESS, Config.NOTIFICATION_EMAIL_PASSWORD)
            server.send_message(msg)
        log_backend.info(f"Email sent to {to} with subject '{subject}'", {"origin": "EMAIL", "code": "EMAIL_SENT"})
    except Exception as e:
        log_backend.error(f"Error sending email: {e}", {"origin": "EMAIL", "code": "EMAIL_ERROR", "error": str(e)})