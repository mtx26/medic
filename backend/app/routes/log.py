from flask import request
from . import api
from app.utils.logger import frontend_logger

@api.route("/log", methods=["POST"])
def log_handler():
    data = request.json
    msg = data.get("message", "")
    level = data.get("type", "info").lower()
    context = data.get("context", {}) or {}
    error = data.get("error")
    stack = data.get("stack")

    logger_func = getattr(frontend_logger, level, frontend_logger.info)
    logger_func(msg, extra=context, error=error, stack=stack)

    return {"status": "ok"}


