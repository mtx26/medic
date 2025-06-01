import json
import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account
from urllib.parse import urljoin
from app.config.config import Config

SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"]

def get_fcm_access_token():
    service_account_info = json.loads(Config.FIREBASE_CREDENTIALS)
    credentials_obj = service_account.Credentials.from_service_account_info(
        service_account_info, scopes=SCOPES
    )
    credentials_obj.refresh(Request())
    return credentials_obj.token, credentials_obj.project_id

def send_fcm_notification(tokens, title, body, link):
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
                        "link": link if link else urljoin(Config.FRONTEND_URL, "/notifications")
                    }
                }
            }
        }

        response = requests.post(url, headers=headers, json=payload)
        try:
            data = response.json()
        except Exception:
            data = response.text

        if response.status_code != 200:
            errors.append({
                "token": token,
                "status_code": response.status_code,
                "response": data
            })

    return errors
