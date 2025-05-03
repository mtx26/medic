from flask import request, jsonify
from . import api
from logger import log_backend as logger

@api.route('/api/status', methods=['GET', 'HEAD'])
def status():
    if request.method == 'HEAD':
        logger.info("Requête HEAD reçue sur /api/status", {
            "origin": "STATUS",
            "uid": uid
        })
        return '', 200
    logger.info("Requête GET reçue sur /api/status", {
        "origin": "STATUS",
        "uid": uid
    })
    return jsonify({"status": "ok"}), 200
