# logger.py
import logging
import os
from logging.handlers import RotatingFileHandler

os.makedirs("logs", exist_ok=True)

class ContextualAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        return f"[{self.extra.get('source', 'UNKNOWN')}] {msg}", kwargs

# Logger de base
base_logger = logging.getLogger("medic_logger")
base_logger.setLevel(logging.DEBUG)

handler = RotatingFileHandler("logs/app.log", maxBytes=1_000_000, backupCount=5)
formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
handler.setFormatter(formatter)
base_logger.addHandler(handler)

# Adapters
backend_logger = ContextualAdapter(base_logger, {"source": "BACKEND"})
frontend_logger = ContextualAdapter(base_logger, {"source": "FRONTEND"})
