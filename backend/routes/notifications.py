from . import api
from logger import log_backend as logger
from auth import verify_firebase_token
from flask import jsonify
from firebase_admin import firestore

db = firestore.client()

# Route pour récupérer les notifications d'un utilisateur
@api.route("/api/notifications", methods=["GET"])
def handle_notifications():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        notifications_ref = db.collection("users").document(uid).collection("notifications").get()
        notifications = []
        for doc in notifications_ref:
            notifications.append(doc.to_dict())

        logger.info("Notifications récupérées pour {uid}.", {
            "origin": "NOTIFICATIONS_FETCH",
            "uid": uid
        })
        return jsonify({"notifications": notifications}), 200

    except Exception as e:
        logger.exception("Erreur dans /api/notifications", {
            "origin": "NOTIFICATIONS_ERROR",
            "uid": uid
        })
        return jsonify({"error": "Erreur lors de la récupération des notifications."}), 500


# Route pour marquer une notification comme lue
@api.route("/api/notifications/<notification_id>", methods=["POST"])
def handle_read_notification(notification_id):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        doc = db.collection("users").document(uid).collection("notifications").document(notification_id)
        if not doc.get().exists:
            logger.warning("Notification introuvable : {notification_id}.", {
                "origin": "NOTIFICATION_READ",
                "uid": uid
            })
            return jsonify({"error": "Notification introuvable"}), 404
        
        doc.update({
            "read": True
        })

        logger.info("Notification marquée comme lue : {notification_id}.", {
            "origin": "NOTIFICATION_READ",
            "uid": uid
        })
        return jsonify({"message": "Notification marquée comme lue avec succès"}), 200

    except Exception as e:
        logger.exception("Erreur dans /api/read-notification/{notification_id}", {
            "origin": "NOTIFICATION_READ_ERROR",
            "uid": uid
        })
        return jsonify({"error": "Erreur lors de la lecture de la notification."}), 500
