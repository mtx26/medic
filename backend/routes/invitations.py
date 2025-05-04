from flask import request
from response import success_response, error_response, warning_response
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
            return warning_response(
                message="Calendrier introuvable", 
                code="CALENDAR_NOT_FOUND", 
                status_code=404, 
                uid=owner_uid, 
                origin="INVITATION_SEND",
                log_extra={"calendar_id": calendar_id}
            )

        calendar_name = doc.to_dict().get("calendar_name")
        
        receiver_email = request.get_json(force=True).get("email")
        receiver_user = auth.get_user_by_email(receiver_email)
        receiver_uid = receiver_user.uid
        
        # Verif si soit même
        if owner_uid == receiver_uid:
            return warning_response(
                message="Tentative de partage avec soi-même", 
                code="SELF_INVITATION_ERROR", 
                status_code=400, 
                uid=owner_uid, 
                origin="INVITATION_SEND",
                log_extra={"calendar_id": calendar_id}
            )

        # Vérifier si l'utilisateur existe  
        doc = db.collection("users").document(receiver_uid).get()
        if not doc.exists:
            return warning_response(
                message="Utilisateur non trouvé", 
                code="USER_NOT_FOUND", 
                status_code=404, 
                uid=owner_uid, 
                origin="INVITATION_SEND",
                log_extra={"calendar_id": calendar_id}
            )
        
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

        return success_response(
            message="Invitation envoyée avec succès", 
            code="INVITATION_SEND_SUCCESS", 
            uid=owner_uid, 
            origin="INVITATION_SEND",
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de l'envoi de l'invitation.", 
            code="INVITATION_SEND_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="INVITATION_SEND",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour accepter une invitation pour un partage de calendrier
@api.route("/api/invitations/accept/<notification_id>", methods=["POST"])
def handle_accept_invitation(notification_id):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        doc = db.collection("users").document(receiver_uid).collection("notifications").document(notification_id).get()
        if not doc.exists:
            return warning_response(
                message="Notification non trouvée.", 
                code="NOTIFICATION_NOT_FOUND", 
                status_code=404, 
                uid=receiver_uid, 
                origin="INVITATION_ACCEPT",
                log_extra={"notification_id": notification_id}
            )
        
        # Vérifier si la notification est une invitation
        if doc.to_dict().get("type") != "calendar_invitation":
            return warning_response(
                message="Notification non valide.", 
                code="INVALID_NOTIFICATION", 
                status_code=400, 
                uid=receiver_uid, 
                origin="INVITATION_ACCEPT",
                log_extra={"notification_id": notification_id}
            )
        
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

        return success_response(
            message="Invitation acceptée avec succès.", 
            code="INVITATION_ACCEPT_SUCCESS", 
            uid=receiver_uid, 
            origin="INVITATION_ACCEPT",
            log_extra={"notification_id": notification_id}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de l'acceptation de l'invitation.", 
            code="INVITATION_ACCEPT_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="INVITATION_ACCEPT",
            error=str(e),
            log_extra={"notification_id": notification_id}
        )


# Route pour rejeter une invitation pour un partage de calendrier
@api.route("/api/invitations/reject/<notification_id>", methods=["POST"])
def handle_reject_invitation(notification_id):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        doc = db.collection("users").document(receiver_uid).collection("notifications").document(notification_id).get()
        if not doc.exists:
            return warning_response(
                message="Notification non trouvée.", 
                code="NOTIFICATION_NOT_FOUND", 
                status_code=404, 
                uid=receiver_uid, 
                origin="INVITATION_REJECT",
                log_extra={"notification_id": notification_id}
            )

        # Vérifier si la notification est une invitation
        if doc.to_dict().get("type") != "calendar_invitation":
            return warning_response(
                message="Notification non valide.", 
                code="INVALID_NOTIFICATION", 
                status_code=400, 
                uid=receiver_uid, 
                origin="INVITATION_REJECT",
                log_extra={"notification_id": notification_id}
            )

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

        return success_response(
            message="Invitation rejetée avec succès.", 
            code="INVITATION_REJECT_SUCCESS", 
            uid=receiver_uid, 
            origin="INVITATION_REJECT",
            log_extra={"notification_id": notification_id}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la réjection de l'invitation.", 
            code="INVITATION_REJECT_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="INVITATION_REJECT",
            error=str(e),
            log_extra={"notification_id": notification_id}
        )

