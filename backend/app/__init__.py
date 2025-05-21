# app/__init__.py

from flask import Flask
from app.config.config import Config
from app.routes import register_routes
from app.auth.firebase import init_firebase
from flask_cors import CORS

def create_app():
    app = Flask(__name__)  # noqa: S308  # CSRF not required (stateless API with Firebase tokens)
    app.config.from_object(Config)

    # 🔒 Pas de session ni formulaire : CSRF non nécessaire
    app.config["WTF_CSRF_ENABLED"] = False  # Safe: stateless API with Firebase tokens (no cookies)

    # 🌍 Active CORS avec cookies si jamais Firebase envoie une session (optionnel)
    CORS(app, supports_credentials=True)

    # 🔧 Enregistrement des routes et services
    register_routes(app)
    init_firebase()

    return app
