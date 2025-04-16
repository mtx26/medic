# logger.py
import logging
import os
from logging.handlers import RotatingFileHandler

# Crée le dossier de logs si nécessaire
os.makedirs("logs", exist_ok=True)

# Classe pour ajouter le "source" dans chaque log
class ContextualAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        return f"[{self.extra.get('source', 'UNKNOWN')}] {msg}", kwargs

# Logger de base
base_logger = logging.getLogger("medic_logger")
base_logger.setLevel(logging.DEBUG)

# Handler FICHIER avec rotation
file_handler = RotatingFileHandler("logs/app.log", maxBytes=1_000_000, backupCount=5)
file_formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", "%Y-%m-%d %H:%M:%S")
file_handler.setFormatter(file_formatter)

# Handler CONSOLE propre
console_handler = logging.StreamHandler()
console_formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", "%H:%M:%S")
console_handler.setFormatter(console_formatter)

# Ajoute les handlers
base_logger.addHandler(file_handler)
base_logger.addHandler(console_handler)

# Loggers spécifiques
backend_logger = ContextualAdapter(base_logger, {"source": "BACKEND"})
frontend_logger = ContextualAdapter(base_logger, {"source": "FRONTEND"})
