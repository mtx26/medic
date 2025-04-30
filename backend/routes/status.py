from flask import request, jsonify
from . import api
from logger import backend_logger as logger

@api.route('/api/status', methods=['GET', 'HEAD'])
def status():
    if request.method == 'HEAD':
        logger.info("[STATUS] Requête HEAD reçue sur /api/status")
        return '', 200
    logger.info("[STATUS] Requête GET reçue sur /api/status")
    return jsonify({"status": "ok"}), 200
