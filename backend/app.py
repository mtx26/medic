from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from datetime import datetime
from routes import api
from function import generate_schedule
import os
import json
from logger import backend_logger as logger

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)
app.register_blueprint(api)

# Route pour React
@app.route("/calendar", methods=["GET"])
def get_calendar():
    try:
        with open("pils.json", encoding="utf-8") as f:
            medications = json.load(f)
            logger.info("pils.json chargé.")

        start_str = request.args.get("startTime", default=datetime.today().strftime("%Y-%m-%d"))
        start_date = datetime.strptime(start_str, "%Y-%m-%d").date()

        schedule = generate_schedule(start_date, medications)
        logger.info("Calendrier généré avec succès.")
        return jsonify(schedule)
    except Exception as e:
        logger.exception("Erreur dans /calendar")
        return jsonify({"error": "Erreur lors de la génération du calendrier."}), 500

@app.route("/get_pils", methods=["GET"])
def get_pils():
    try:
        with open("pils.json", encoding="utf-8") as f:
            medications = json.load(f)
        logger.info("pils.json chargé.")
        return jsonify(medications)
    except Exception as e:
        logger.exception("Erreur dans /get_pils")
        return jsonify({"error": "Erreur lors de la récupération des médicaments."}), 500

@app.route("/update_pils", methods=["POST"])
def update_pils():
    try:
        update_pils = request.json
        with open("pils.json", "w", encoding="utf-8") as f:
            json.dump(update_pils, f, ensure_ascii=False, indent=4)
        logger.info("Médicaments mis à jour avec succès.")
        return jsonify({"message": "Médicaments mis à jour", "status": "ok"})
    except Exception as e:
        logger.exception("Erreur dans /update_pils")
        return jsonify({"error": "Erreur lors de la mise à jour des médicaments."}), 500

# Lancement en mode Render
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Render définit automatiquement la variable PORT
    app.run(host="0.0.0.0", port=port)
