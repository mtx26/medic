import os
import json
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials
from logger import backend_logger as logger

# Charge le .env
env_loaded = load_dotenv()

if not env_loaded:
    logger.warning("[FIREBASE] Impossible de charger le fichier .env")

service_account_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT")

if not service_account_str:
    logger.error("[FIREBASE] Aucune clé de service Firebase trouvée dans le fichier .env")
else:
    logger.info("[FIREBASE] Clé de service Firebase trouvée")

# JSON parsing
try:
    service_account_info = json.loads(service_account_str)
except json.JSONDecodeError as e:
    logger.error(f"[FIREBASE] Erreur lors de l'analyse de la clé de service Firebase : {e}")

cred = credentials.Certificate(service_account_info)
firebase_admin.initialize_app(cred)
logger.info("[FIREBASE] Initialisation de l'application Firebase terminée")
