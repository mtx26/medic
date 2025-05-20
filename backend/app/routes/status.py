from flask import request, jsonify
from . import api
from app.utils.logger import log_backend as logger

@api.route('/status', methods=['GET', 'HEAD'])
def status():
    if request.method == 'HEAD':
        logger.info("Requête HEAD reçue sur /api/status", {
            "origin": "STATUS",
        })
        return '', 200
    logger.info("Requête GET reçue sur /api/status", {
        "origin": "STATUS",
    })
    return jsonify({"status": "ok"}), 200
