from flask import Blueprint, jsonify, request
from logger import frontend_logger
from logger import backend_logger as logger
import firebase_admin_init
from auth import verify_firebase_token
from firebase_admin import firestore
from datetime import datetime
from function import generate_schedule

api = Blueprint('api', __name__)
db = firestore.client()


"""db.collection("users").document("oR75yI71MoUmYzwgwJ4WX1Birtm1").collection("calendars").document("Andrée").set({
    "medicines": [
    {
        "interval_days": 1,
        "name": "Asaflow",
        "tablet_count": 1,
        "time": [
            "morning"
        ]
    },
    {
        "interval_days": 2,
        "name": "Clopidogrel",
        "start_date": "2025-04-05",
        "tablet_count": 1,
        "time": [
            "morning"
        ]
    },
    {
        "interval_days": 1,
        "name": "Pantomed",
        "tablet_count": 1,
        "time": [
            "morning"
        ]
    },
    {
        "interval_days": 2,
        "name": "Burinex",
        "start_date": "2025-03-30",
        "tablet_count": 1,
        "time": [
            "morning"
        ]
    },
    {
        "interval_days": 2,
        "name": "Burinex",
        "start_date": "2025-03-31",
        "tablet_count": 0.5,
        "time": [
            "morning"
        ]
    },
    {
        "interval_days": 1,
        "name": "Medrol",
        "tablet_count": 0.25,
        "time": [
            "morning"
        ]
    },
    {
        "interval_days": 14,
        "name": "D-Cure",
        "start_date": "2025-03-29",
        "tablet_count": 1,
        "time": [
            "morning"
        ]
    },
    {
        "interval_days": 3,
        "name": "Colchicine",
        "start_date": "2025-03-30",
        "tablet_count": 0.5,
        "time": [
            "morning"
        ]
    },
    {
        "interval_days": 1,
        "name": "Lipitor",
        "tablet_count": 1,
        "time": [
            "evening"
        ]
    },
    {
        "interval_days": 1,
        "name": "Nobiten",
        "tablet_count": 1,
        "time": [
            "evening"
        ]
    },
    {
        "interval_days": 1,
        "name": "Entresto",
        "tablet_count": 1,
        "time": [
            "evening"
        ]
    },
    {
        "interval_days": 3,
        "name": "Colchicine",
        "start_date": "2025-03-30",
        "tablet_count": 0.5,
        "time": [
            "evening"
        ]
    },
    {
        "interval_days": 1,
        "name": "Zyloric",
        "start_date": "",
        "tablet_count": 0.5,
        "time": [
            "morning"
        ]
    }
]
})
"""

@api.route('/api/status', methods=['GET', 'HEAD'])
def status():
    if request.method == 'HEAD':
        logger.info("[STATUS] Requête HEAD reçue sur /api/status")
        return '', 200
    logger.info("[STATUS] Requête GET reçue sur /api/status")
    return jsonify({"status": "ok"}), 200

@api.route("/api/do-something")
def do_something():
    logger.info("[DO_SOMETHING] Requête reçue sur /api/do-something")
    try:
        # Ton traitement ici
        pass
    except Exception as e:
        logger.exception("[DO_SOMETHING] Erreur lors du traitement de /api/do-something")
        return {"error": str(e)}, 500

@api.route("/api/log", methods=["POST"])
def log_frontend_error():
    data = request.get_json()

    msg = data.get("message", "Message vide")
    error = data.get("error")
    stack = data.get("stack")
    context = data.get("context", {})
    log_type = data.get("type", "info").lower()

    parts = [msg]
    if context:
        parts.append(f"Context: {context}")
    if error:
        parts.append(f"Error: {error}")
    if stack:
        parts.append(f"Stack: {stack}")

    full_msg = " | ".join(parts)

    log_func = {
        "info": frontend_logger.info,
        "warning": frontend_logger.warning,
        "error": frontend_logger.error
    }.get(log_type, frontend_logger.debug)

    log_func(full_msg)
    return "", 204





@api.route("/api/calendars", methods=["GET", "POST", "DELETE", "PUT"])
def handle_calendars():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        if request.method == "GET":
            calendars_ref = db.collection("users").document(uid).collection("calendars")
            calendars = [doc.id for doc in calendars_ref.stream()]
            logger.info(f"[CALENDAR_GET] {len(calendars)} calendriers récupérés pour {uid}.")
            return jsonify({"calendars": calendars}), 200

        elif request.method == "POST":
            calendar_name = request.json.get("calendarName")
            db.collection("users").document(uid).collection("calendars").document(calendar_name.lower()).set({
                "medicines": "",
                "last_updated": datetime.now(datetime.timezone.utc).isoformat()
            }, merge=True)
            logger.info(f"[CALENDAR_CREATE] Calendrier '{calendar_name}' créé pour {uid}.")
            return jsonify({"message": "Calendrier mis à jour", "status": "ok"})

        elif request.method == "DELETE":
            calendar_name = request.json.get("calendarName")
            db.collection("users").document(uid).collection("calendars").document(calendar_name).delete()
            logger.info(f"[CALENDAR_DELETE] Calendrier '{calendar_name}' supprimé pour {uid}.")
            return jsonify({"message": "Calendrier supprimé", "status": "ok"})

        elif request.method == "PUT":
            data = request.get_json(force=True)
            old_calendar_name = data.get("oldCalendarName")
            new_calendar_name = data.get("newCalendarName")

            if not old_calendar_name or not new_calendar_name:
                logger.warning(f"[CALENDAR_RENAME] Noms invalides reçus pour {uid}.")
                return jsonify({"error": "Nom de calendrier invalide"}), 400

            if old_calendar_name == new_calendar_name:
                logger.warning(f"[CALENDAR_RENAME] Nom inchangé pour {uid} : {old_calendar_name}.")
                return jsonify({"error": "Le nom du calendrier n'a pas changé"}), 400

            doc_ref = db.collection("users").document(uid).collection("calendars").document(old_calendar_name).get()

            if doc_ref.exists:
                db.collection("users").document(uid).collection("calendars").document(new_calendar_name).set(doc_ref.to_dict())
                db.collection("users").document(uid).collection("calendars").document(old_calendar_name).delete()
                logger.info(f"[CALENDAR_RENAME] Renommé {old_calendar_name} -> {new_calendar_name} pour {uid}.")
                return jsonify({"message": "Calendrier renommé avec succès"}), 200
            else:
                logger.warning(f"[CALENDAR_RENAME] Calendrier '{old_calendar_name}' introuvable pour {uid}.")
                return jsonify({"error": "Calendrier introuvable"}), 404

    except Exception as e:
        logger.exception("[CALENDAR_ERROR] Erreur dans /api/calendars")
        return jsonify({"error": "Erreur interne"}), 500
    



@api.route("/api/countmedicines", methods=["GET"])
def count_medicines():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        name_calendar = request.args.get("calendarName")

        doc = db.collection("users").document(uid).collection("calendars").document(name_calendar).get()
        if doc.exists:
            data = doc.to_dict()
            medicines = data.get("medicines", [])
            count = len(medicines)
            logger.info(f"[MED_COUNT] {count} médicaments récupérés pour {uid}.")
            return jsonify({"count": count}), 200
        else:
            logger.warning(f"[MED_COUNT] Document introuvable pour l'utilisateur {uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404

    except Exception as e:
        logger.exception("[MED_COUNT_ERROR] Erreur dans /api/countmedicines")
        return jsonify({"error": "Erreur lors du comptage des médicaments."}), 500
    


@api.route("/api/calendars/<calendar_name>/calendar", methods=["GET"])
def get_calendar(calendar_name):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        doc = db.collection("users").document(uid).collection("calendars").document(calendar_name).get()
        if doc.exists:
            data = doc.to_dict()
            medicines = data.get("medicines", [])
            logger.info(f"[CALENDAR_LOAD] Médicaments récupérés pour {uid}.")
        else:
            logger.warning(f"[CALENDAR_LOAD] Document introuvable pour l'utilisateur {uid}.")
            return jsonify({"medicines": []}), 200
        
        start_str = request.args.get("startTime")
        if not start_str:
            start_date = datetime.now(datetime.timezone.utc).date()
        else:
            start_date = datetime.strptime(start_str, "%Y-%m-%d").date()

        schedule = generate_schedule(start_date, medicines)
        logger.info("[CALENDAR_GENERATE] Calendrier généré avec succès.")
        return jsonify(schedule)

    except Exception as e:
        logger.exception(f"[CALENDAR_GENERATE_ERROR] Erreur dans /api/calendars/${calendar_name}/calendar")
        return jsonify({"error": "Erreur lors de la génération du calendrier."}), 500
    

@api.route("/api/calendars/<calendar_name>/medicines", methods=["GET", "POST"])
def handle_medicines(calendar_name):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        if request.method == "POST":
            medicines = request.json.get("medicines")
            if not isinstance(medicines, list):
                logger.warning(f"[MED_UPDATE] Format de médicaments invalide reçu de {uid}.")
                return jsonify({"error": "Le format des médicaments est invalide."}), 400

            db.collection("users").document(uid).collection("calendars").document(calendar_name).set({
                "medicines": medicines,
                "last_updated": datetime.now(datetime.timezone.utc).isoformat()
            }, merge=True)

            logger.info(f"[MED_UPDATE] Médicaments mis à jour pour {uid}.")
            return jsonify({"message": "Médicaments mis à jour", "status": "ok"})

        elif request.method == "GET":
            doc = db.collection("users").document(uid).collection("calendars").document(calendar_name).get()
            if doc.exists:
                data = doc.to_dict()
                medicines = data.get("medicines", [])
                logger.info(f"[MED_FETCH] Médicaments récupérés pour {uid}.")
                return jsonify({"medicines": medicines}), 200
            else:
                logger.warning(f"[MED_FETCH] Aucun document trouvé pour l'utilisateur {uid}.")
                return jsonify({"medicines": []}), 200

    except Exception as e:
        logger.exception(f"[MED_ERROR] Erreur dans /api/calendars/${calendar_name}/medicines")
        return jsonify({"error": "Erreur interne"}), 500
