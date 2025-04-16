from flask import Blueprint, jsonify
from flask import request
from logger import logger

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
    from logger import logger
    data = request.get_json()
    msg = data.get("message", "Message vide")
    error = data.get("error", "Erreur inconnue")
    type = data.get("type", "info")
    if type == "error":
        logger.error(f"Erreur du frontend : {msg} - {error}")
    elif type == "warning":
        logger.warning(f"Avertissement du frontend : {msg} - {error}")
    elif type == "info":
        logger.info(f"Info du frontend : {msg} - {error}")
    return "", 204

