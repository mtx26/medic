import os
import json
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials
from logger import log_backend as logger

# Charge le .env
env_loaded = load_dotenv()

if not env_loaded:
    logger.warning("Impossible de charger le fichier .env", {
        "origin": "FIREBASE_INIT",
    })

service_account_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT")

if not service_account_str:
    logger.error("Aucune clé de service Firebase trouvée dans le fichier .env", {
        "origin": "FIREBASE_INIT",
    })
    raise RuntimeError("FIREBASE_SERVICE_ACCOUNT manquant")
else:
    logger.info("Clé de service Firebase trouvée", {
        "origin": "FIREBASE_INIT",
    })

# JSON parsing
try:
    service_account_info = json.loads(service_account_str)
except json.JSONDecodeError as e:
    logger.error("Erreur lors de l'analyse de la clé de service Firebase", {
        "origin": "FIREBASE_INIT",
        "error": str(e)
    })
    raise RuntimeError("Clé Firebase invalide (erreur JSON)")

# Initialisation Firebase
cred = credentials.Certificate(service_account_info)
firebase_admin.initialize_app(cred)
logger.info("Initialisation de l'application Firebase terminée", {
    "origin": "FIREBASE_INIT",
})
