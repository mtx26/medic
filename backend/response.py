from flask import jsonify
from logger import log_backend as logger

def success_response(message, code, uid=None, origin=None, data=None, log_extra=None):
    payload = {"message": message, "code": code}
    if data:
        payload.update(data)

    if code and uid:
        logger.info(message, {
            "origin": code,
            "uid": uid,
            **(log_extra or {})
        })

    return jsonify(payload), 200


def error_response(message, code, status_code=500, uid=None, origin=None, error=None, log_extra=None):
    payload = {"error": message, "code": code}

    if code and uid:
        logger.error(message, {
            "origin": code,
            "uid": uid,
            "error": str(error),
            **(log_extra or {})
        })

    return jsonify(payload), status_code


def warning_response(message, code, status_code=400, uid=None, origin=None, log_extra=None):
    payload = {"error": message, "code": code}

    if code and uid:
        logger.warning(message, {
            "origin": code,
            "uid": uid,
            **(log_extra or {})
        })

    return jsonify(payload), status_code
