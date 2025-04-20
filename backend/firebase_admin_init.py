import os
import json
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials

# Charge le .env
env_loaded = load_dotenv()

if not env_loaded:
    print("⚠️ Aucun fichier .env trouvé")

service_account_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
print("DEBUG: FIREBASE_SERVICE_ACCOUNT = ", service_account_str[:50], "...")

if not service_account_str:
    raise ValueError("❌ FIREBASE_SERVICE_ACCOUNT is missing")

# JSON parsing
try:
    service_account_info = json.loads(service_account_str)
except json.JSONDecodeError as e:
    raise ValueError(f"❌ Erreur de JSON : {e}")

cred = credentials.Certificate(service_account_info)
firebase_admin.initialize_app(cred)
print("✅ Firebase initialized")
