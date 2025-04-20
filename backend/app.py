# app.py
from flask import Flask
from flask_cors import CORS
from config import Config
from routes import api
from logger import backend_logger as logger
import os

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)
app.register_blueprint(api)


# 🚀 Lancement en local ou sur Render
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
    logger.info("[FLASK] Lancement de l'application Flask en local sur le port %d", port)