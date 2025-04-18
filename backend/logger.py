# logger.py
import logging
import os
from logging.handlers import RotatingFileHandler

os.makedirs("logs", exist_ok=True)

class ContextualAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        return f"[{self.extra.get('source', 'UNKNOWN')}] {msg}", kwargs

base_logger = logging.getLogger("medic_logger")
base_logger.setLevel(logging.DEBUG)

file_handler = RotatingFileHandler("./logs/app.log", maxBytes=1_000_000, backupCount=5)
file_formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", "%Y-%m-%d %H:%M:%S")
file_handler.setFormatter(file_formatter)

console_handler = logging.StreamHandler()
console_formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", "%H:%M:%S")
console_handler.setFormatter(console_formatter)

base_logger.addHandler(file_handler)
base_logger.addHandler(console_handler)

backend_logger = ContextualAdapter(base_logger, {"source": "BACKEND"})
frontend_logger = ContextualAdapter(base_logger, {"source": "FRONTEND"})
