from flask import Blueprint, jsonify
from flask import request

api = Blueprint('api', __name__)

@api.route('/api/status', methods=['GET', 'HEAD'])
def status():
    if request.method == 'HEAD':
        return '', 200
    return jsonify({"status": "ok"}), 200