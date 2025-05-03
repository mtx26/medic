import logging
import os
from logging.handlers import RotatingFileHandler

os.makedirs("logs", exist_ok=True)

# === Logger Contextual ===
class ContextualAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        source = self.extra.get("source", "UNKNOWN")
        extra = kwargs.pop("extra", {}) or {}

        origin = extra.pop("origin", "UNKNOWN").upper()
        context = extra
        error = kwargs.pop("error", None)
        stack = kwargs.pop("stack", None)

        # Construction du message formaté
        final_msg = f"[{source}] [{origin}] {msg}"
        if context:
            final_msg += f" | Context: {context}"
        if error:
            final_msg += f" | Error: {error}"
        if stack:
            final_msg += f" | Stack: {stack}"

        return final_msg, kwargs

class ColoredFileFormatter(logging.Formatter):
    def format(self, record):
        raw = super().format(record)

        # On récupère le message sans les codes déjà injectés
        msg_lower = record.getMessage().lower()

        # Source détectée à partir du message, ou du nom du logger
        source = None
        if "[backend]" in msg_lower:
            source = "BACKEND"
        elif "[frontend]" in msg_lower:
            source = "FRONTEND"

        # Utilise le level et la source si dispo
        return color_line(raw, source=source, level=record.levelname)




# === Logger de base ===
base_logger = logging.getLogger("medic_logger")
base_logger.setLevel(logging.DEBUG)

file_handler = RotatingFileHandler("logs/app.log", maxBytes=1_000_000, backupCount=5)
file_formatter = ColoredFileFormatter("%(asctime)s [%(levelname)s] %(message)s", "%Y-%m-%d %H:%M:%S")
file_handler.setFormatter(file_formatter)

console_handler = logging.StreamHandler()
console_formatter = ColoredFileFormatter("%(asctime)s [%(levelname)s] %(message)s", "%H:%M:%S")
console_handler.setFormatter(console_formatter)

base_logger.addHandler(file_handler)
base_logger.addHandler(console_handler)

# === Loggers contextualisés ===
backend_logger = ContextualAdapter(base_logger, {"source": "BACKEND"})
frontend_logger = ContextualAdapter(base_logger, {"source": "FRONTEND"})

# === Loggers dynamiques ===
class DynamicLogWrapper:
    def __init__(self, base_logger):
        self.base_logger = base_logger

    def __getattr__(self, level):
        def log_method(message, context=None, *, error=None, stack=None):
            logger_func = getattr(self.base_logger, level, self.base_logger.info)
            logger_func(message, extra=context or {}, error=error, stack=stack)
        return log_method

log_backend = DynamicLogWrapper(backend_logger)

def color_line(text, source=None, level=None):
    colors = {
        "BACKEND": "\x1b[94m",   # Bleu
        "FRONTEND": "\x1b[93m",  # Jaune
        "ERROR": "\x1b[91m",     # Rouge
        "WARNING": "\x1b[95m",   # Magenta
        "DEBUG": "\x1b[90m",     # Gris clair
        "RESET": "\x1b[0m"
    }

    # Priorité : niveau > source
    color = ""
    if level and level.upper() in colors:
        color = colors[level.upper()]
    elif source and source.upper() in colors:
        color = colors[source.upper()]

    return f"{color}{text}{colors['RESET']}"

