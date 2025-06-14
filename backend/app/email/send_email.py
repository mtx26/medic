import smtplib
from email.message import EmailMessage
from email.utils import formataddr
from app.utils.logger import log_backend
from app.config import Config

def send_email(to, subject, html_content, plain=None):
    try:
        html = f"""
            <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 24px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <div style="background-color: #007bff; padding: 16px; text-align: center;">
                        <img src="https://meditime-app.com/icons/logo_white.png" alt="MediTime Logo" style="height: 100px;" />
                    </div>
                    <div style="padding: 24px;">
                        <h2 style="color: #333;">{subject}</h2>
                        {html_content}
                    </div>
                </div>
            </div>
            """
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = formataddr(("MediTime", Config.NOTIFICATION_EMAIL_ADDRESS))
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