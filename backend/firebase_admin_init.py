from dotenv import load_dotenv
import os
import json
import firebase_admin
from firebase_admin import credentials

load_dotenv()

service_account_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
if not service_account_str:
    raise ValueError("FIREBASE_SERVICE_ACCOUNT is missing")

service_account_info = json.loads(service_account_str)
cred = credentials.Certificate(service_account_info)
firebase_admin.initialize_app(cred)
