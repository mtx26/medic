# app.py
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes import api
from logger import log_backend as logger
import os
from db import get_connection

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)
app.register_blueprint(api)

@app.route("/test-db")
def test_db():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM users")
                result = cur.fetchall()
        return jsonify({"ok": True, "user": result})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)})

# 🚀 Lancement en local ou sur Render
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    import sys
    if "--check" in sys.argv:
        print("✔ Flask ready to run")
    else:
        app.run(host="0.0.0.0", port=port)
        logger.info("Lancement de l'application Flask en local", {
            "origin": "FLASK_START",
            "port": port
        })