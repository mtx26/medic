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
    error = data.get("error", "Erreur inconnue")
    type = data.get("type", "info")
    
    if type == "error":
        frontend_logger.error(f"{msg} - {error}")
    elif type == "warning":
        frontend_logger.warning(f"{msg} - {error}")
    elif type == "info":
        frontend_logger.info(f"{msg} - {error}")
    else:
        frontend_logger.debug(f"(type inconnu) {msg} - {error}")
    
    return "", 204

