from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from datetime import datetime
from routes import api
from function import generate_schedule
import os
import json

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)
app.register_blueprint(api)

# Charger les médicaments
with open("pils.json", encoding="utf-8") as f:
    medications = json.load(f)

# Route pour React
@app.route("/calendar", methods=["GET"])
def get_calendar():
    # Charger les médicaments
    with open("pils.json", encoding="utf-8") as f:
        medications = json.load(f)

    start_str = request.args.get("startTime", default=datetime.today().strftime("%Y-%m-%d"))
    start_str = datetime.strptime(start_str, "%Y-%m-%d").date()

    schedule = generate_schedule(start_str, medications)
    return jsonify(schedule)

@app.route("/get_pils", methods=["GET"])
def get_pils():
    # Charger les médicaments
    with open("pils.json", encoding="utf-8") as f:
        medications = json.load(f)
    return jsonify(medications)

@app.route("/update_pils", methods=["POST"])
def update_pils():
    update_pils = request.json
    with open("pils.json", "w", encoding="utf-8") as f:
        json.dump(update_pils, f, ensure_ascii=False, indent=4)
    return jsonify({"message": "Médicaments mis à jour", "status": "ok"})

# Lancement en mode Render
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Render définit automatiquement la variable PORT
    app.run(host="0.0.0.0", port=port)
