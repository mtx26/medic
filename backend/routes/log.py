from flask import request
from . import api
from logger import frontend_logger

@api.route("/api/log", methods=["POST"])
def log_frontend_error():
    data = request.get_json()
    msg = data.get("message", "Message vide")
    error = data.get("error")
    stack = data.get("stack")
    context = data.get("context", {})
    log_type = data.get("type", "info").lower()

    parts = [msg]
    if context: parts.append(f"Context: {context}")
    if error: parts.append(f"Error: {error}")
    if stack: parts.append(f"Stack: {stack}")

    full_msg = " | ".join(parts)
    getattr(frontend_logger, log_type, frontend_logger.debug)(full_msg)
    return "", 204
