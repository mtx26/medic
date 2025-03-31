from flask import Blueprint, jsonify

api = Blueprint('api', __name__)

@api.route('/api/status', methods=['GET'])
def status():
    return jsonify({"message": "API NameApp en ligne 🚀"})