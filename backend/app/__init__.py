# app/__init__.py

from flask import Flask
from app.config.config import Config
from app.routes import register_routes
from app.auth.firebase import init_firebase
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    register_routes(app)     # Enregistre toutes les routes Flask
    init_firebase()         # Initialise Firebase
    CORS(app)

    return app
