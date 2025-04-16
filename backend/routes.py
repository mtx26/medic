from flask import Blueprint, jsonify
from flask import request
from logger import frontend_logger
from logger import backend_logger as logger

api = Blueprint('api', __name__)

@api.route('/api/status', methods=['GET', 'HEAD'])
def status():
    if request.method == 'HEAD':
        logger.info("Requête uptimerobot reçue sur /api/status")
        return '', 200
    logger.info("Requête reçue sur /api/status")
    return jsonify({"status": "ok"}), 200

@api.route("/api/do-something")
def do_something():
    logger.info("Requête reçue sur /api/do-something")
    try:
        # Ton traitement ici
        pass
    except Exception as e:
        logger.exception("Erreur dans /api/do-something")
        return {"error": str(e)}, 500

@api.route("/api/log", methods=["POST"])
def log_frontend_error():
    data = request.get_json()
    msg = data.get("message", "Message vide")
    error = data.get("error")
    log_type = data.get("type", "info").lower()

    # Choisir la bonne fonction de log
    log_func = {
        "info": frontend_logger.info,
        "warning": frontend_logger.warning,
        "error": frontend_logger.error
    }.get(log_type, frontend_logger.debug)

    # Formatage du message
    full_msg = f"{msg} - {error}" if error else msg
    log_func(full_msg)

    return "", 204


