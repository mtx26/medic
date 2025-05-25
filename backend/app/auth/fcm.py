def send_fcm_notification(token, title, body):
    print("send_fcm_notification")
    access_token, project_id = get_fcm_access_token()

    url = f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; UTF-8",
    }

    payload = {
        "message": {
            "token": token,
            "data": {
                "title": title,
                "body": body,
                "icon": "/favicon.png",
                "link": "https://meditime-app.com"
            },
            "webpush": {
                "fcm_options": {
                    "link": "https://meditime-app.com"
                }
            }
        }
    }

    response = requests.post(url, headers=headers, json=payload)
    print(response.json())
    try:
        return response.status_code, response.json()
    except Exception:
        return response.status_code, response.text
