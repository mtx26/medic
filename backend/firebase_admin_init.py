import firebase_admin
from firebase_admin import credentials
import os
# Set the environment variable for the Firebase service account key

service_account_info = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
cred = credentials.Certificate(service_account_info)
firebase_admin.initialize_app(cred)
