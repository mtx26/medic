from flask import Blueprint, jsonify
from flask import request
from logger import frontend_logger
from logger import backend_logger as logger
import firebase_admin_init
from auth import verify_firebase_token
from firebase_admin import firestore
from datetime import datetime
from function import generate_schedule

api = Blueprint('api', __name__)
db = firestore.client()

@api.route('/api/status', methods=['GET', 'HEAD'])
def status():
    if request.method == 'HEAD':
        logger.info("Requête uptimerobot reçue sur /api/status")
        return '', 200
    logger.info("Requête reçue sur /api/status")
    return jsonify({"status": "ok"}), 200

@api.route("/api/do-something")
def do_something():
    logger.info("Requête reçue sur /api/do-something")
    try:
        # Ton traitement ici
        pass
    except Exception as e:
        logger.exception("Erreur dans /api/do-something")
        return {"error": str(e)}, 500

@api.route("/api/log", methods=["POST"])
def log_frontend_error():
    data = request.get_json()
    msg = data.get("message", "Message vide")
    error = data.get("error")
    log_type = data.get("type", "info").lower()

    # Choisir la bonne fonction de log
    log_func = {
        "info": frontend_logger.info,
        "warning": frontend_logger.warning,
        "error": frontend_logger.error
    }.get(log_type, frontend_logger.debug)

    # Formatage du message
    full_msg = f"{msg} - {error}" if error else msg
    log_func(full_msg)

    return "", 204


# 📅 Route pour générer le calendrier
@api.route("/api/calendar", methods=["GET"])
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
        logger.exception("Erreur dans /api/calendar")
        return jsonify({"error": "Erreur lors de la génération du calendrier."}), 500


# 💊 Route pour récupérer ou mettre à jour les médicaments
@api.route("/api/medicines", methods=["GET", "POST"])
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


