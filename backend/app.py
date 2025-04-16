# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from datetime import datetime
from routes import api
from function import generate_schedule
from logger import backend_logger as logger
import firebase_admin_init
from auth import verify_firebase_token
from firebase_admin import firestore
import os
import json

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)
app.register_blueprint(api)

db = firestore.client()


# 📅 Route pour générer le calendrier
@app.route("/calendar", methods=["GET"])
def get_calendar():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        doc = db.collection("users").document(uid).get()
        if doc.exists:
            data = doc.to_dict()
            medicines = data.get("medicines", [])
            logger.info(f"Médicaments récupérés pour {uid}.")
        else:
            logger.warning(f"Document introuvable pour l'utilisateur {uid}.")
            return jsonify({"medicines": []}), 200

        start_str = request.args.get("startTime", default=datetime.today().strftime("%Y-%m-%d"))
        start_date = datetime.strptime(start_str, "%Y-%m-%d").date()

        schedule = generate_schedule(start_date, medicines)
        logger.info("Calendrier généré avec succès.")
        return jsonify(schedule)

    except Exception as e:
        logger.exception("Erreur dans /calendar")
        return jsonify({"error": "Erreur lors de la génération du calendrier."}), 500


# 💊 Route pour récupérer ou mettre à jour les médicaments
@app.route("/api/medicines", methods=["GET", "POST"])
def handle_medicines():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        if request.method == "POST":
            medicines = request.json.get("medicines")
            if not isinstance(medicines, list):
                return jsonify({"error": "Le format des médicaments est invalide."}), 400

            db.collection("users").document(uid).set({
                "medicines": medicines,
                "last_updated": datetime.utcnow().isoformat()
            }, merge=True)

            logger.info(f"Médicaments mis à jour pour {uid}.")
            return jsonify({"message": "Médicaments mis à jour", "status": "ok"})

        elif request.method == "GET":
            doc = db.collection("users").document(uid).get()
            if doc.exists:
                data = doc.to_dict()
                medicines = data.get("medicines", [])
                logger.info(f"Médicaments récupérés pour {uid}.")
                return jsonify({"medicines": medicines}), 200
            else:
                logger.warning(f"Aucun document trouvé pour l'utilisateur {uid}.")
                return jsonify({"medicines": []}), 200

    except Exception as e:
        logger.exception("Erreur dans /api/medicines")
        return jsonify({"error": "Erreur interne"}), 500


# 🚀 Lancement en local ou sur Render
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
    logger.info(f"Application démarrée sur le port {port}.")