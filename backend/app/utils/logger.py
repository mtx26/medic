import logging
import os
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv

# Crée le dossier des logs s'il n'existe pas
os.makedirs("logs", exist_ok=True)

# Charge les variables d'environnement depuis .env
load_dotenv()
env = os.environ.get("ENV", "production")


# 🔍 Détection de Railway
def is_railway():
    return "RAILWAY_STATIC_URL" in os.environ or "RAILWAY_ENVIRONMENT" in os.environ


# === Logger Contextualisé ===
class ContextualAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        source = self.extra.get("source", "UNKNOWN")
        extra = kwargs.pop("extra", {}) or {}

        origin = extra.pop("origin", "UNKNOWN").upper()
        context = extra
        error = context.pop("error", None)
        stack = context.pop("stack", None)
        code = context.pop("code", None)

        # Construction du message formaté
        final_msg = f"[{source}] [{origin}] {msg}"
        if code:
            final_msg += f" | Code: {code}"
        if context:
            final_msg += f" | Context: {context}"
        if error:
            final_msg += f" | Error: {error}"
        if stack:
            final_msg += f" | Stack: {stack}"

        return final_msg, kwargs


# === Formatter avec couleurs ===
class ColoredFileFormatter(logging.Formatter):
    def format(self, record):
        raw = super().format(record)

        msg_lower = record.getMessage().lower()
        source = None
        if "[backend]" in msg_lower:
            source = "BACKEND"
        elif "[frontend]" in msg_lower:
            source = "FRONTEND"

        return color_line(raw, source=source, level=record.levelname)


# === Fonction de coloration terminal ===
def color_line(text, source=None, level=None):
    if is_railway():
        return text  # 🚫 Pas de couleur sur Railway

    colors = {
        "BACKEND": "\x1b[94m",   # Bleu
        "FRONTEND": "\x1b[93m",  # Jaune
        "ERROR": "\x1b[91m",     # Rouge
        "WARNING": "\x1b[95m",   # Magenta
        "DEBUG": "\x1b[90m",     # Gris clair
        "RESET": "\x1b[0m"
    }

    color = ""
    if level and level.upper() in colors:
        color = colors[level.upper()]
    elif source and source.upper() in colors:
        color = colors[source.upper()]

    return f"{color}{text}{colors['RESET']}"


# === Logger principal ===
base_logger = logging.getLogger("medic_logger")
base_logger.setLevel(logging.DEBUG)

file_handler = RotatingFileHandler("logs/app.log", maxBytes=1_000_000, backupCount=5, delay=True)
file_formatter = ColoredFileFormatter("%(asctime)s [%(levelname)s] %(message)s", "%Y-%m-%d %H:%M:%S")
file_handler.setFormatter(file_formatter)

console_handler = logging.StreamHandler()
console_formatter = ColoredFileFormatter("%(asctime)s [%(levelname)s] %(message)s", "%H:%M:%S")
console_handler.setFormatter(console_formatter)

if env == "development":
    base_logger.addHandler(file_handler)

base_logger.addHandler(console_handler)


# === Loggers contextualisés ===
backend_logger = ContextualAdapter(base_logger, {"source": "BACKEND"})
frontend_logger = ContextualAdapter(base_logger, {"source": "FRONTEND"})


# === Wrapper dynamique de log ===
class DynamicLogWrapper:
    def __init__(self, base_logger):
        self.base_logger = base_logger

    def __getattr__(self, level):
        def log_method(message, context=None, *, error=None, stack=None):
            full_context = context.copy() if context else {}
            if error:
                full_context["error"] = error
            if stack:
                full_context["stack"] = stack
            logger_func = getattr(self.base_logger, level, self.base_logger.info)
            logger_func(message, extra=full_context)
        return log_method


# === Loggers dynamiques exportés ===
log_backend = DynamicLogWrapper(backend_logger)
log_frontend = DynamicLogWrapper(frontend_logger)
