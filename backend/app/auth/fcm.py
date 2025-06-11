import json
import traceback
import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account
from urllib.parse import urljoin
from app.config import Config
from app.utils.logger import log_backend

SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"]

def get_fcm_access_token():
    try:
        service_account_info = json.loads(Config.FIREBASE_CREDENTIALS)
        credentials_obj = service_account.Credentials.from_service_account_info(
            service_account_info, scopes=SCOPES
        )
        credentials_obj.refresh(Request())
        return credentials_obj.token, credentials_obj.project_id
    except Exception as e:
        log_backend.error(
            f"Erreur get_fcm_access_token : {e}", 
            {
                "origin": "FCM", 
                "code": "FCM_ACCESS_TOKEN_ERROR", 
                "error": traceback.format_exc()
            }
        )

def send_fcm_notification(tokens, title, body, json_body):
    access_token, project_id = get_fcm_access_token()
    url = f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; UTF-8",
    }

    errors = []
    for token in tokens:
        payload = {
            "message": {
                "token": token,
                "notification": {
                    "title": title,
                    "body": body,
                    "image": urljoin(Config.FRONTEND_URL, "/icons/icon-192.png")
                },
                "webpush": {
                    "fcm_options": {
                        "link": json_body.get("link") if json_body.get("link") else urljoin(Config.FRONTEND_URL, "/notifications")
                    }
                }
            }
        }

        response = requests.post(url, headers=headers, json=payload)
        log_backend.info(
            f"send_fcm_notification : {response.status_code}", 
            {
                "origin": "FCM", 
                "code": "FCM_SEND_NOTIFICATION", 
                "status_code": response.status_code,
                "token": token,
                "title": title,
                "body": body
            }
        )
        try:
            data = response.json()
        except Exception as e:
            log_backend.error(
                f"Erreur send_fcm_notification : {e}", 
                {
                    "origin": "FCM", 
                    "code": "FCM_ERROR", 
                    "error": traceback.format_exc()
                }
            )
            data = response.text

        if response.status_code != 200:
            errors.append({
                "token": token,
                "status_code": response.status_code,
                "response": data
            })

    return errors
