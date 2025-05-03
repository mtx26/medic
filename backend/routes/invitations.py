from flask import jsonify, request
from logger import log_backend as logger
from auth import verify_firebase_token
from firebase_admin import firestore, auth
import secrets
from . import api

db = firestore.client()

# Route pour envoyer une invitation à un utilisateur pour un partage de calendrier
@api.route("/api/invitations/send/<calendar_id>", methods=["POST"])
def handle_send_invitation(calendar_id):
    try:
        owner_user = verify_firebase_token()
        owner_uid = owner_user["uid"]
        owner_email = owner_user["email"]

        doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).get()
        if not doc.exists:
            logger.warning("Calendrier introuvable : {calendar_id}.", {
                "origin": "INVITATION_SEND",
                "uid": owner_uid
            })
            return jsonify({"error": "Calendrier introuvable"}), 404

        calendar_name = doc.to_dict().get("calendar_name")
        
        receiver_email = request.get_json(force=True).get("email")
        receiver_user = auth.get_user_by_email(receiver_email)
        receiver_uid = receiver_user.uid
        
        # Verif si soit même
        if owner_uid == receiver_uid:
            logger.warning("Tentative de partage avec soi-même : {receiver_email}.", {
                "origin": "INVITATION_SEND",
                "uid": owner_uid
            })
            return jsonify({"error": "Impossible de partager avec soi-même."}), 400

        # Vérifier si l'utilisateur existe  
        doc = db.collection("users").document(receiver_uid).get()
        if not doc.exists:
            logger.warning("Utilisateur introuvable : {receiver_email}.", {
                "origin": "INVITATION_SEND",
                "uid": owner_uid
            })
            return jsonify({"error": "Utilisateur introuvable"}), 404
        
        # Créer un token unique pour la notification
        notification_id = secrets.token_hex(16)

        # Créer une notif pour l'utilisateur receveur
        db.collection("users").document(receiver_uid).collection("notifications").document(notification_id).set({
            "calendar_name": calendar_name,
            "owner_uid": owner_uid,
            "owner_email": owner_email,
            "calendar_id": calendar_id,
            "type": "calendar_invitation",
            "timestamp": firestore.SERVER_TIMESTAMP,
            "read": False,
            "notification_id": notification_id
        })

        # Sauvegarder l'invitation dans la collection "shared_calendars" dans le calendrier de l'utilisateur expéditeur
        db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).collection("shared_with").document(receiver_uid).set({
            "receiver_uid": receiver_uid,
            "receiver_email": receiver_email,
            "accepted": False,
            "access": "edit"
        })

        logger.info("Invitation envoyée à {receiver_email} pour le calendrier {calendar_name}.", {
            "origin": "INVITATION_SEND",
            "uid": owner_uid
        })
        return jsonify({"message": "Invitation envoyée avec succès"}), 200

    except Exception as e:
        logger.exception("Erreur dans /api/invitations/send/{calendar_id}", {
            "origin": "INVITATION_SEND",
            "uid": owner_uid
        })
        return jsonify({"error": "Erreur lors de l'envoi de l'invitation."}), 500


# Route pour accepter une invitation pour un partage de calendrier
@api.route("/api/invitations/accept/<notification_id>", methods=["POST"])
def handle_accept_invitation(notification_id):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        doc = db.collection("users").document(receiver_uid).collection("notifications").document(notification_id).get()
        if not doc.exists:
            logger.warning("Notification introuvable : {notification_id}.", {
                "origin": "INVITATION_ACCEPT",
                "uid": receiver_uid
            })
            return jsonify({"error": "Notification introuvable"}), 404
        
        # Vérifier si la notification est une invitation
        if doc.to_dict().get("type") != "calendar_invitation":
            logger.warning("Notification non valide : {notification_id}.", {
                "origin": "INVITATION_ACCEPT",
                "uid": receiver_uid
            })
            return jsonify({"error": "Notification non valide"}), 400
        
        calendar_id = doc.to_dict().get("calendar_id")
        calendar_name = doc.to_dict().get("calendar_name")
        owner_uid = doc.to_dict().get("owner_uid")
        owner_email = doc.to_dict().get("owner_email")

        # Créer une entrée dans sa collection "shared_calendars" pour le calendrier partagé
        db.collection("users").document(receiver_uid).collection("shared_calendars").document(calendar_id).set({
            "calendar_id": calendar_id,
            "calendar_name": calendar_name,
            "owner_uid": owner_uid,
            "owner_email": owner_email,
            "access": "edit"
        })

        # Dire que l'utilisateur receveur a accepté l'invitation
        db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).collection("shared_with").document(receiver_uid).set({
            "accepted": True,
            "accepted_at": firestore.SERVER_TIMESTAMP
        }, merge=True)

        # Dire que la notif a été lue
        db.collection("users").document(receiver_uid).collection("notifications").document(notification_id).update({
            "read": True,
        })

        # Créer une notif pour l'utilisateur expéditeur
        db.collection("users").document(owner_uid).collection("notifications").document(notification_id).set({
            "receiver_uid": receiver_uid,
            "receiver_email": user["email"],
            "calendar_name": calendar_name,
            "calendar_id": calendar_id,
            "type": "calendar_invitation_accepted",
            "timestamp": firestore.SERVER_TIMESTAMP,
            "read": False,
            "notification_id": notification_id
        })

        logger.info("Invitation acceptée : {notification_id}.", {
            "origin": "INVITATION_ACCEPT",
            "uid": receiver_uid
        })
        return jsonify({"message": "Invitation acceptée avec succès"}), 200

    except Exception as e:
        logger.exception("Erreur dans /api/invitations/accept/{notification_id}", {
            "origin": "INVITATION_ACCEPT",
            "uid": receiver_uid
        })
        return jsonify({"error": "Erreur lors de l'acceptation de l'invitation."}), 500


# Route pour rejeter une invitation pour un partage de calendrier
@api.route("/api/invitations/reject/<notification_id>", methods=["POST"])
def handle_reject_invitation(notification_id):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        doc = db.collection("users").document(receiver_uid).collection("notifications").document(notification_id).get()
        if not doc.exists:
            logger.warning("Notification introuvable : {notification_id}.", {
                "origin": "INVITATION_REJECT",
                "uid": receiver_uid
            })
            return jsonify({"error": "Notification introuvable"}), 404

        # Vérifier si la notification est une invitation
        if doc.to_dict().get("type") != "calendar_invitation":
            logger.warning("Notification non valide : {notification_id}.", {
                "origin": "INVITATION_REJECT",
                "uid": receiver_uid
            })
            return jsonify({"error": "Notification non valide"}), 400

        calendar_id = doc.to_dict().get("calendar_id")
        calendar_name = doc.to_dict().get("calendar_name")
        owner_uid = doc.to_dict().get("owner_uid")

        # Supprimer la notif
        db.collection("users").document(receiver_uid).collection("notifications").document(notification_id).delete()

        # Créer une notif pour l'utilisateur expéditeur
        db.collection("users").document(owner_uid).collection("notifications").document(notification_id).set({
            "receiver_uid": receiver_uid,
            "receiver_email": user["email"],
            "calendar_name": calendar_name,
            "calendar_id": calendar_id,
            "type": "calendar_invitation_rejected",
            "timestamp": firestore.SERVER_TIMESTAMP,
            "read": False,
            "notification_id": notification_id
        })

        logger.info("Invitation rejetée : {notification_id}.", {
            "origin": "INVITATION_REJECT",
            "uid": receiver_uid
        })
        return jsonify({"message": "Invitation rejetée avec succès"}), 200

    except Exception as e:
        logger.exception("Erreur dans /api/invitations/reject/{notification_id}", {
            "origin": "INVITATION_REJECT",
            "uid": receiver_uid
        })
        return jsonify({"error": "Erreur lors de la réjection de l'invitation."}), 500
