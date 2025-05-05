from flask import jsonify
from logger import log_backend as logger

#exemple de log_extra : {'calendar_id': '98fb17305b9a8005b603b51f4820f30d', 'uid': '98fb17305b9a8005b603b51f4820f30d'}

def success_response(message, code, uid=None, origin=None, data=None, log_extra=None):
    log_extra = log_extra or {}

    payload = {"message": message, "code": code}
    
    if data:
        payload.update(data)

    if log_extra:
        log_extra["code"] = code
    else:
        log_extra = {"code": code} 

    if origin and uid:
        logger.info(message, {
            "origin": origin,
            "uid": uid,
            **log_extra
        })

    return jsonify(payload), 200


def error_response(message, code, status_code=500, uid=None, origin=None, error=None, log_extra=None):
    log_extra = log_extra or {}

    payload = {"error": message, "code": code}

    if log_extra:
        log_extra["code"] = code
    else:
        log_extra = {"code": code} 
    if origin and uid:
        logger.error(message, {
            "origin": origin,
            "uid": uid,
            "error": str(error),
            **log_extra
        })

    return jsonify(payload), status_code


def warning_response(message, code, status_code=400, uid=None, origin=None, log_extra=None):
    log_extra = log_extra or {}

    payload = {"error": message, "code": code}

    if log_extra:
        log_extra["code"] = code
    else:
        log_extra = {"code": code} 
    if origin and uid:
        logger.warning(message, {
            "origin": origin,
            "uid": uid,
            **log_extra
        })

    return jsonify(payload), status_code
