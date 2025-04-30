from . import api
from logger import backend_logger as logger
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
        logger.info(f"[NOTIFICATIONS_FETCH] {len(notifications)} notifications récupérées pour {uid}.")
        print(notifications)
        return jsonify({"notifications": notifications}), 200

    except Exception as e:
        logger.exception("[NOTIFICATIONS_ERROR] Erreur dans /api/notifications")
        return jsonify({"error": "Erreur lors de la récupération des notifications."}), 500


# Route pour marquer une notification comme lue
@api.route("/api/read-notification/<notification_token>", methods=["POST"])
def handle_read_notification(notification_token):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        db.collection("users").document(uid).collection("notifications").document(notification_token).update({
            "read": True
        })

        logger.info(f"[NOTIFICATION_READ] Notification marquée comme lue : {notification_token}.")
        return jsonify({"message": "Notification marquée comme lue avec succès"}), 200

    except Exception as e:
        logger.exception(f"[NOTIFICATION_READ_ERROR] Erreur dans /api/read-notification/{notification_token}")
        return jsonify({"error": "Erreur lors de la lecture de la notification."}), 500
