import os
import json
import firebase_admin
from firebase_admin import credentials
from app.utils.logger import log_backend as logger
from app.config.config import Config

def init_firebase():
    if not firebase_admin._apps:
        service_account_raw = Config.FIREBASE_CREDENTIALS

        if not service_account_raw:
            logger.error("Aucune clé de service Firebase trouvée dans .env", {
                "origin": "FIREBASE_INIT"
            })
            raise RuntimeError("FIREBASE_CREDENTIALS manquant")

        try:
            service_account_dict = json.loads(service_account_raw)
        except json.JSONDecodeError as e:
            logger.error("Erreur JSON dans FIREBASE_CREDENTIALS", {
                "origin": "FIREBASE_INIT",
                "error": str(e)
            })
            raise RuntimeError("FIREBASE_CREDENTIALS invalide")

        cred = credentials.Certificate(service_account_dict)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase initialisé avec JSON depuis .env", {
            "origin": "FIREBASE_INIT"
        })
