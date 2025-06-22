from twilio.rest import Client
from app.config import Config
from app.utils.logger import log_backend


def send_sms(to_number, message_body):
    try:
        client = Client(Config.TWILIO_API_KEY_SID, Config.TWILIO_API_KEY_SECRET)
        message = client.messages.create(
            to=to_number,
            messaging_service_sid=Config.TWILIO_MESSAGING_SERVICE_SID,
            body=message_body
        )
        log_backend.info(f"SMS sent to {to_number} with message '{message_body}'", {"origin": "SMS", "code": "SMS_SENT"})
    except Exception as e:
        log_backend.error(f"Error sending SMS to {to_number}: {e}", {"origin": "SMS", "code": "SMS_ERROR"})
        return {"success": False, "error": str(e)}
    return {"success": True, "sid": message.sid, "status": message.status}
