from flask import jsonify, request
from logger import backend_logger as logger
from auth import verify_firebase_token
from datetime import datetime, timezone
from . import api
from firebase_admin import firestore, auth
from function import verify_calendar_share
import secrets

db = firestore.client()

# Route pour récupérer les calendriers partagés
@api.route("/api/shared/calendars", methods=["GET"])
def handle_shared_calendars():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        shared_with_doc = db.collection("users").document(uid).collection("shared_calendars")
        shared_users_docs = list(shared_with_doc.stream())

        if not shared_users_docs:
            logger.info(f"[CALENDARS_SHARED_LOAD] Aucun calendrier partagé pour {uid}.")
            return jsonify({"calendars": []}), 200

        calendars_list = []
        for user_doc in shared_users_docs:
            data = user_doc.to_dict()

            owner_uid = data.get("owner_uid")
            owner_email = data.get("owner_email")
            calendar_name = data.get("calendar_name")
            access = data.get("access", "read")

            if not verify_calendar_share(calendar_name, owner_uid, uid):
                continue

            # Ajoute les infos à la réponse
            calendars_list.append({
                "calendar_name": calendar_name,
                "owner_uid": owner_uid,
                "owner_email": owner_email,
                "access": access
            })

        logger.info(f"[CALENDARS_SHARED_LOAD] {len(calendars_list)} calendrier(s) récupéré(s) pour {uid}.")
        return jsonify({"calendars": calendars_list}), 200

    except Exception as e:
        logger.exception("[CALENDARS_SHARED_ERROR] Erreur lors de la récupération des calendriers partagés.")
        return jsonify({"error": "Erreur interne lors de la récupération des calendriers partagés."}), 500


# Route pour supprimer un calendrier partagé
@api.route("/api/shared/calendars/<calendar_name>", methods=["DELETE"])
def handle_delete_shared_calendar(calendar_name):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]
        receiver_email = user["email"]

        received_calendar_doc = db.collection("users").document(receiver_uid).collection("shared_calendars").document(calendar_name)
        if not received_calendar_doc.get().exists:
            logger.warning(f"[CALENDARS_SHARED_DELETE] Calendrier partagé introuvable : {calendar_name} pour {receiver_uid}.")
            return jsonify({"error": "Calendrier partagé introuvable"}), 404

        owner_uid = received_calendar_doc.get().to_dict().get("owner_uid")

        if not verify_calendar_share(calendar_name, owner_uid, receiver_uid):
            logger.warning(f"[CALENDARS_SHARED_DELETE] Accès non autorisé à {calendar_name} partagé par {owner_uid}")
            return jsonify({"error": "Accès non autorisé"}), 403
        

        shared_with_doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_name).collection("shared_with").document(receiver_uid)
        if not shared_with_doc.get().exists:
            logger.warning(f"[CALENDARS_SHARED_DELETE] Utilisateur partagé introuvable : {receiver_uid} pour {owner_uid}.")
            return jsonify({"error": "Utilisateur partagé introuvable"}), 404
            
        received_calendar_doc.delete()
        shared_with_doc.delete()

        notification_token = secrets.token_hex(16)

        # Notification à l'utilisateur qui a partagé le calendrier
        notification_doc = db.collection("users").document(owner_uid).collection("notifications").document(notification_token)
        notification_doc.set({
            "type": "calendar_shared_deleted_by_receiver",
            "calendar_name": calendar_name,
            "timestamp": datetime.now(),
            "owner_email": owner_email,
            "owner_uid": owner_uid,
            "receiver_email": receiver_email,
            "receiver_uid": receiver_uid,
            "notification_token": notification_token,
            "read": False
        })

        return jsonify({"message": "Calendrier partagé supprimé avec succès"}), 200

    except Exception as e:
        logger.exception("[CALENDARS_SHARED_DELETE_ERROR] Erreur lors de la suppression du calendrier partagé.")
        return jsonify({"error": "Erreur interne lors de la suppression du calendrier partagé."}), 500


# Route pour récupérer les utilisateurs ayant accès à un calendrier
@api.route("/api/shared/users/<calendar_name>", methods=["GET"])
def handle_shared_users(calendar_name):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        shared_with_doc = db.collection("users").document(receiver_uid).collection("calendars").document(calendar_name).collection("shared_with")
        shared_users_docs = list(shared_with_doc.stream())


        shared_users_list = []
        for doc in shared_users_docs:
            data = doc.to_dict()
            shared_users_list.append({
                "receiver_uid": data.get("receiver_uid"),
                "receiver_email": data.get("receiver_email"),
                "access": data.get("access", "read"),
                "accepted": data.get("accepted", False)
            })

        logger.info(f"[SHARED_USERS_LOAD] {len(shared_users_list)} utilisateur(s) récupéré(s) pour {calendar_name}.")
        return jsonify({"users": shared_users_list}), 200

    except Exception as e:
        logger.exception("[SHARED_USERS_ERROR] Erreur lors de la récupération des utilisateurs partagés.")
        return jsonify({"error": "Erreur interne lors de la récupération des utilisateurs partagés."}), 500


# Route pour supprimer un utilisateur partagé
@api.route("/api/shared/users/<calendar_name>/<receiver_uid>", methods=["DELETE"])
def handle_delete_shared_user(calendar_name, receiver_uid):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]
        owner_email = user["email"]
        try:
            receiver_email = db.collection("users").document(receiver_uid).get().to_dict().get("email")
        except:
            logger.warning(f"[SHARED_USERS_DELETE] Utilisateur partagé introuvable : {receiver_uid} pour {owner_uid}.")
            receiver_email = "user_not_found"

        if owner_uid == receiver_uid:
            logger.warning(f"[SHARED_USERS_DELETE] Tentative de suppression de l'utilisateur partagé {receiver_uid} pour lui-même.")
            return jsonify({"error": "Impossible de supprimer l'utilisateur partagé lui-même."}), 400

        shared_with_doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_name).collection("shared_with").document(receiver_uid)
        if not shared_with_doc.get().exists:
            logger.warning(f"[SHARED_USERS_DELETE] Utilisateur partagé introuvable : {receiver_uid} pour {owner_uid}.")
            return jsonify({"error": "Utilisateur partagé introuvable"}), 404

        received_calendar_doc = db.collection("users").document(receiver_uid).collection("shared_calendars").document(calendar_name)
        if received_calendar_doc.get().exists:
            received_calendar_doc.delete()

        shared_with_doc.delete()

        notification_token = secrets.token_hex(16)

        # Notification à l'utilisateur qui a partagé le calendrier
        notification_doc = db.collection("users").document(receiver_uid).collection("notifications").document(notification_token)
        notification_doc.set({
            "type": "calendar_shared_deleted_by_owner",
            "calendar_name": calendar_name,
            "timestamp": datetime.now(),
            "owner_email": owner_email,
            "owner_uid": owner_uid,
            "receiver_email": receiver_email,
            "receiver_uid": receiver_uid,
            "notification_token": notification_token,
            "read": False
        })

        logger.info(f"[SHARED_USERS_DELETE] Utilisateur partagé supprimé avec succès : {receiver_uid} pour {owner_uid}.")
        return jsonify({"message": "Utilisateur partagé supprimé avec succès"}), 200

    except Exception as e:
        logger.exception("[SHARED_USERS_DELETE_ERROR] Erreur lors de la suppression de l'utilisateur partagé.")
        return jsonify({"error": "Erreur interne lors de la suppression de l'utilisateur partagé."}), 500

