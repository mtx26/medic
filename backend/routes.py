from flask import Blueprint, jsonify, request
from logger import frontend_logger
from logger import backend_logger as logger
import firebase_admin_init
from auth import verify_firebase_token
from firebase_admin import firestore
from datetime import datetime, timezone, timedelta
import secrets
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

# Route pour gérer les erreurs du frontend
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




# Route pour gérer les calendriers
@api.route("/api/calendars", methods=["GET", "POST", "DELETE", "PUT"])
def handle_calendars():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        # Route pour récupérer tous les calendriers
        if request.method == "GET":
            calendars_ref = db.collection("users").document(uid).collection("calendars")
            calendars = [doc.id for doc in calendars_ref.stream()]
            logger.info(f"[CALENDAR_GET] {len(calendars)} calendriers récupérés pour {uid}.")
            return jsonify({"calendars": calendars}), 200

        # Route pour créer un calendrier
        elif request.method == "POST":
            calendar_name = request.json.get("calendarName")
            if not calendar_name:
                logger.warning(f"[CALENDAR_CREATE] Nom de calendrier manquant pour {uid}.")
                return jsonify({"error": "Nom de calendrier manquant"}), 400
            calendar_id = calendar_name.lower()
            doc = db.collection("users").document(uid).collection("calendars").document(calendar_id).get()

            if doc.exists:
                logger.warning(f"[CALENDAR_EXISTS] Tentative de création d'un calendrier déjà existant : '{calendar_name}' pour {uid}.")
                return jsonify({"message": "Ce calendrier existe déjà", "status": "error"}), 409
            

            db.collection("users").document(uid).collection("calendars").document(calendar_id).set({
                "medicines": "",
                "last_updated": datetime.now(timezone.utc).isoformat()
            }, merge=True)
            
            logger.info(f"[CALENDAR_CREATE] Calendrier '{calendar_name}' créé pour {uid}.")
            return jsonify({"message": "Calendrier mis à jour", "status": "ok"})

        # Route pour supprimer un calendrier
        elif request.method == "DELETE":
            calendar_name = request.json.get("calendarName")
            db.collection("users").document(uid).collection("calendars").document(calendar_name).delete()
            logger.info(f"[CALENDAR_DELETE] Calendrier '{calendar_name}' supprimé pour {uid}.")
            # pour le calendrier partagé
            shared_tokens_ref = db.collection("shared_tokens").get()
            for doc in shared_tokens_ref:
                if doc.to_dict().get("calendar_owner_uid") == uid:
                    if doc.to_dict().get("calendar_name") == calendar_name:
                        db.collection("shared_tokens").document(doc.id).delete()
            return jsonify({"message": "Calendrier supprimé", "status": "ok"})
            

        # Route pour renommer un calendrier
        elif request.method == "PUT":
            # pour le calendrier personnel
            data = request.get_json(force=True)
            old_calendar_name = data.get("oldCalendarName")
            new_calendar_name = data.get("newCalendarName")
            new_calendar_name = new_calendar_name.lower()

            if not old_calendar_name or not new_calendar_name:
                logger.warning(f"[CALENDAR_RENAME] Noms invalides reçus pour {uid}.")
                return jsonify({"error": "Nom de calendrier invalide"}), 400

            if old_calendar_name == new_calendar_name:
                logger.warning(f"[CALENDAR_RENAME] Nom inchangé pour {uid} : {old_calendar_name}.")
                return jsonify({"error": "Le nom du calendrier n'a pas changé"}), 400
            
            # pour le calendrier partagé
            shared_tokens_ref = db.collection("shared_tokens").get()
            for doc in shared_tokens_ref:
                if doc.to_dict().get("calendar_owner_uid") == uid:
                    if doc.to_dict().get("calendar_name") == old_calendar_name:
                        db.collection("shared_tokens").document(doc.id).update({
                            "calendar_name": new_calendar_name
                        })

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
        return jsonify({"error": "Erreur lors de la gestion des calendriers."}), 500
    


# Route pour compter les médicaments
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
            logger.info(f"[MED_COUNT] {count} médicaments récupérés de {name_calendar} pour {uid}.")
            return jsonify({"count": count}), 200
        else:
            logger.warning(f"[MED_COUNT] médicaments introuvables de {name_calendar} pour {uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404

    except Exception as e:
        logger.exception("[MED_COUNT_ERROR] Erreur dans /api/countmedicines")
        return jsonify({"error": "Erreur lors du comptage des médicaments."}), 500
    

# Route pour générer le calendrier 
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
            return jsonify({"error": "Calendrier introuvable"}), 404
        
        start_str = request.args.get("startTime")
        if not start_str:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_str, "%Y-%m-%d").date()

        schedule = generate_schedule(start_date, medicines)
        logger.info("[CALENDAR_GENERATE] Calendrier généré avec succès.")
        return jsonify(schedule)

    except Exception as e:
        logger.exception(f"[CALENDAR_GENERATE_ERROR] Erreur dans /api/calendars/${calendar_name}/calendar")
        return jsonify({"error": "Erreur lors de la génération du calendrier."}), 500
    

# Route pour gérer les médicaments d'un calendrier spécifique
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
                "last_updated": datetime.now(timezone.utc).isoformat()
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

# Route pour accéder au calendrier d'un utilisateur via un lien de partage sécurisé (token)
@api.route("/api/shared/<token>", methods=["GET", "DELETE"])
def handle_shared(token):
    try:
        # Récupérer les informations du lien de partage
        if request.method == "GET":
            doc = db.collection("shared_tokens").document(token).get()
            data = doc.to_dict()
            calendar_name = data.get("calendar_name")
            uid = data.get("calendar_owner_uid")
            expires_at = data.get("expires_at")
            revoked = data.get("revoked")
            permissions = data.get("permissions")
            # Verifier si le token est valide
            if doc.exists:
                doc_2 = db.collection("users").document(uid).collection("calendars").document(calendar_name).get()
            else:
                logger.warning(f"[CALENDAR_SHARED_LOAD] Token invalide : {token}.")
                return jsonify({"error": "Token invalide"}), 404
            
            # Recuperer les médicaments
            if doc_2.exists:
                data_2 = doc_2.to_dict()
                medicines = data_2.get("medicines", [])
                logger.info(f"[CALENDAR_SHARED_LOAD] Médicaments  récupérés de {calendar_name} chez {uid} pour le token {token}.")
            else:
                logger.warning(f"[CALENDAR_SHARED_LOAD] Médicaments introuvable de {calendar_name} chez {uid} pour le token {token}.")
                return jsonify({"error": "Calendrier introuvable"}), 404


            # Verifier si le token est expiré ou si = a never
            if expires_at != "never":
                now_utc = datetime.now(timezone.utc).date()
                if now_utc > expires_at:
                    logger.warning(f"[MEDECINES_SHARED_LOAD] Token expiré : {token}.")
                    return jsonify({"error": "Token expiré"}), 404

            # Verifier si le token est revoké
            if revoked:
                logger.warning(f"[CALENDAR_SHARED_LOAD] Token revoké : {token}.")
                return jsonify({"error": "Token revoké"}), 404

            # Verifier si le token a les permissions appropriées
            if "read" not in permissions:
                logger.warning(f"[CALENDAR_SHARED_LOAD] Token sans permission de lecture : {token}.")
                return jsonify({"error": "Token sans permission de lecture"}), 403

            start_str = request.args.get("startTime")
            if not start_str:
                start_date = datetime.now(timezone.utc).date()
            else:
                start_date = datetime.strptime(start_str, "%Y-%m-%d").date()

            schedule = generate_schedule(start_date, medicines)
            logger.info("[CALENDAR_GENERATE] Calendrier généré avec succès.")
            return jsonify(schedule), 200

        # Supprimer un lien de partage
        if request.method == "DELETE":
            user = verify_firebase_token()
            uid = user["uid"]
            doc = db.collection("shared_tokens").document(token).get()

            if not doc.exists:
                logger.warning(f"[CALENDAR_SHARED_DELETE] Lien de partage introuvable : {token}.")
                return jsonify({"error": "Lien de partage introuvable"}), 404

            uid_token = doc.to_dict().get("calendar_owner_uid")
            if uid != uid_token:
                logger.warning(f"[CALENDAR_SHARED_DELETE] Lien de partage non autorisé : {token}.")
                return jsonify({"error": "Lien de partage non autorisé"}), 403

            db.collection("shared_tokens").document(token).delete()
            logger.info(f"[CALENDAR_SHARED_DELETE] Lien de partage supprimé : {token}.")
            return jsonify({"message": "Lien de partage supprimé avec succès"}), 200
    except Exception as e:
        logger.exception(f"[CALENDAR_GENERATE_ERROR] Erreur dans /api/shared/${token}")
        return jsonify({"error": "Erreur lors de la génération du calendrier."}), 500
    
# Route pour récupérer uniquement la liste des médicaments d'un calendrier partagé
@api.route("/api/shared/<token>/medecines", methods=["GET"])
def handle_shared_medecines(token):
    try:
        if request.method == "GET":
            doc = db.collection("shared_tokens").document(token).get()
            data = doc.to_dict()
            calendar_name = data.get("calendar_name")
            uid = data.get("calendar_owner_uid")
            expires_at = data.get("expires_at")
            revoked = data.get("revoked")
            permissions = data.get("permissions")

            # Verifier si le token est valide
            if doc.exists:
                doc_2 = db.collection("users").document(uid).collection("calendars").document(calendar_name).get()
            else:
                logger.warning(f"[MEDECINES_SHARED_LOAD] Token invalide : {token}.")
                return jsonify({"error": "Token invalide"}), 404
            
            # Recuperer les médicaments
            if doc_2.exists:
                data_2 = doc_2.to_dict()
                medicines = data_2.get("medicines", [])
                logger.info(f"[MEDECINES_SHARED_LOAD] Médicaments  récupérés de {calendar_name} chez {uid} pour le token {token}.")
            else:
                logger.warning(f"[MEDECINES_SHARED_LOAD] Médicaments introuvable de {calendar_name} chez {uid} pour le token {token}.")
                return jsonify({"error": "Calendrier introuvable"}), 404

            # Verifier si le token est expiré ou si = a never
            if expires_at != "never":
                now_utc = datetime.now(timezone.utc).date()
                if now_utc > expires_at:
                    logger.warning(f"[MEDECINES_SHARED_LOAD] Token expiré : {token}.")
                    return jsonify({"error": "Token expiré"}), 404

            # Verifier si le token est revoké
            if revoked:
                logger.warning(f"[MEDECINES_SHARED_LOAD] Token revoké : {token}.")
                return jsonify({"error": "Token revoké"}), 404

            # Verifier si le token a les permissions appropriées
            if "read" not in permissions:
                logger.warning(f"[MEDECINES_SHARED_LOAD] Token sans permission de lecture : {token}.")
                return jsonify({"error": "Token sans permission de lecture"}), 403

            return jsonify({"medicines": medicines}), 200
    except Exception as e:
        logger.exception(f"[MEDECINES_SHARED_ERROR] Erreur dans /api/shared/${token}/medecines")
        return jsonify({"error": "Erreur lors de la récupération des médicaments."}), 500

# Route pour récupérer tous les tokens et les informations associées
@api.route("/api/tokens", methods=["GET"])
def handle_tokens():
    try:
        if request.method == "GET":
            user = verify_firebase_token()
            uid = user["uid"]

            tokens_ref = db.collection("shared_tokens").get()
            tokens = []
            for doc in tokens_ref:
                if doc.to_dict().get("calendar_owner_uid") == uid:
                    tokens.append(doc.to_dict())
            logger.info(f"[TOKENS_FETCH] {len(tokens)} tokens récupérés pour {uid}.")
            return jsonify({"tokens": tokens}), 200
        
    except Exception as e:
        logger.exception("[TOKENS_ERROR] Erreur dans /api/tokens")
        return jsonify({"error": "Erreur lors de la récupération des tokens."}), 500


# Route pour créer un lien de partage
@api.route("/api/set-shared/<calendar_name>", methods=["POST"])
def handle_shared_create(calendar_name):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        data = request.get_json(force=True)

        expires_at = data.get("expiresAt")
        permissions = data.get("permissions")
        if not expires_at:
            expires_at = "never"
        else:
            expires_at = datetime.strptime(expires_at, "%Y-%m-%dT%H:%M")

        
        if not permissions:
            permissions = ["read"]

        # Verifier si le calendrier existe
        doc = db.collection("users").document(uid).collection("calendars").document(calendar_name).get()
        if not doc.exists:
            logger.warning(f"[CALENDAR_SHARED_CREATE] Calendrier introuvable : {calendar_name} pour {uid}.")
            return jsonify({"error": "Calendrier introuvable"}), 404

        # Verifier si le calendrier est déjà partagé
        doc_2 = db.collection("shared_tokens").get()
        for doc in doc_2:
            if doc.to_dict().get("calendar_name") == calendar_name:
                logger.warning(f"[CALENDAR_SHARED_CREATE] Calendrier déjà partagé : {calendar_name} pour {uid}.")
                return jsonify({"error": "Calendrier déjà partagé"}), 400
        
        # Créer un nouveau lien de partage
        token = secrets.token_hex(16)
        db.collection("shared_tokens").document(token).set({
            "token": token,
            "calendar_name": calendar_name,
            "calendar_owner_uid": uid,
            "expires_at": expires_at,
            "permissions": permissions,
            "revoked": False
        })

        logger.info(f"[CALENDAR_SHARED_CREATE] Calendrier partagé : {calendar_name} pour {uid}.")
        return jsonify({"message": "Calendrier partagé avec succès", "token": token}), 200

    except Exception as e:
        logger.exception(f"[CALENDAR_SHARED_CREATE_ERROR] Erreur dans /api/shared/{calendar_name}")
        return jsonify({"error": "Erreur lors de la création du lien de partage."}), 500


# Route pour révoquer un token
@api.route("/api/revoke-token/<token>", methods=["POST"])
def handle_revoke_token(token):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        doc = db.collection("shared_tokens").document(token).get()
        if not doc.exists:
            logger.warning(f"[TOKEN_REVOKE] Token introuvable : {token}.")
            return jsonify({"error": "Token introuvable"}), 404

        if doc.to_dict().get("calendar_owner_uid") != uid:
            logger.warning(f"[TOKEN_REVOKE] Token non autorisé : {token}.")
            return jsonify({"error": "Token non autorisé"}), 403

        db.collection("shared_tokens").document(token).update({
            "revoked": not doc.to_dict().get("revoked")
        })

        logger.info(f"[TOKEN_REVOKE] Token révoqué : {token}.")
        return jsonify({"message": "Token révoqué avec succès"}), 200

    except Exception as e:
        logger.exception(f"[TOKEN_REVOKE_ERROR] Erreur dans /api/revoke-token/{token}")
        return jsonify({"error": "Erreur lors de la révoquation du token."}), 500

# Route pour mettre à jour l'expiration d'un token
@api.route("/api/update-token-expiration/<token>", methods=["POST"])
def handle_update_token_expiration(token):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        data = request.get_json(force=True)

        doc = db.collection("shared_tokens").document(token).get()
        if not doc.exists:
            logger.warning(f"[TOKEN_UPDATE_EXPIRATION] Token introuvable : {token}.")
            return jsonify({"error": "Token introuvable"}), 404

        if doc.to_dict().get("calendar_owner_uid") != uid:
            logger.warning(f"[TOKEN_UPDATE_EXPIRATION] Token non autorisé : {token}.")
            return jsonify({"error": "Token non autorisé"}), 403

        expires_at = data.get("expiresAt")
        if expires_at == "never":
            db.collection("shared_tokens").document(token).update({
                "expires_at": "never"
            })
        else:
            db.collection("shared_tokens").document(token).update({
                "expires_at": datetime.strptime(expires_at, "%Y-%m-%dT%H:%M")
            })

        logger.info(f"[TOKEN_UPDATE_EXPIRATION] Expiration du token mise à jour : {token}.")
        return jsonify({"message": "Expiration du token mise à jour avec succès"}), 200

    except Exception as e:
        logger.exception(f"[TOKEN_UPDATE_EXPIRATION_ERROR] Erreur dans /api/update-token-expiration/{token}")
        return jsonify({"error": "Erreur lors de la mise à jour de l'expiration du token."}), 500

# Route pour mettre à jour les permissions d'un token
@api.route("/api/update-token-permissions/<token>", methods=["POST"])
def handle_update_token_permissions(token):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        data = request.get_json(force=True)

        doc = db.collection("shared_tokens").document(token).get()
        if not doc.exists:
            logger.warning(f"[TOKEN_UPDATE_PERMISSIONS] Token introuvable : {token}.")
            return jsonify({"error": "Token introuvable"}), 404

        if doc.to_dict().get("calendar_owner_uid") != uid:
            logger.warning(f"[TOKEN_UPDATE_PERMISSIONS] Token non autorisé : {token}.")
            return jsonify({"error": "Token non autorisé"}), 403

        permissions = data.get("permissions")
        db.collection("shared_tokens").document(token).update({
            "permissions": permissions
        })

        logger.info(f"[TOKEN_UPDATE_PERMISSIONS] Permissions du token mises à jour : {token}.")
        return jsonify({"message": "Permissions du token mises à jour avec succès"}), 200

    except Exception as e:
        logger.exception(f"[TOKEN_UPDATE_PERMISSIONS_ERROR] Erreur dans /api/update-token-permissions/{token}")
        return jsonify({"error": "Erreur lors de la mise à jour des permissions du token."}), 500


