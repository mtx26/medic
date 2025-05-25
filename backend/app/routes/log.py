from flask import request
from . import api
from app.utils.logger import frontend_logger

@api.route("/log", methods=["POST"])
def log_handler():
    data = request.json
    msg = data.get("message", "")
    level = data.get("type", "info").lower()
    context = data.get("context", {}) or {}

    # Ajoute error et stack dans le contexte si présents
    if "error" in data:
        context["error"] = data["error"]
    if "stack" in data:
        context["stack"] = data["stack"]

    # Récupère la bonne méthode (info, warning, error, etc.)
    logger_func = getattr(frontend_logger, level, frontend_logger.info)
    logger_func(msg, extra=context)

    return {"status": "ok"}
