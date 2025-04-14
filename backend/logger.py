import logging
import os
from logging.handlers import RotatingFileHandler

# Crée le dossier si besoin
os.makedirs("logs", exist_ok=True)

logger = logging.getLogger("my_app_logger")
logger.setLevel(logging.DEBUG)

# Fichier avec rotation (1 Mo max, 5 backups)
handler = RotatingFileHandler("logs/backend.log", maxBytes=1_000_000, backupCount=5)
formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] [%(name)s] [%(filename)s:%(lineno)d] - %(message)s"
)
handler.setFormatter(formatter)
logger.addHandler(handler)
