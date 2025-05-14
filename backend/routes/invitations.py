from flask import request
from auth import verify_firebase_token
from supabase_client import supabase
from response import success_response, error_response, warning_response
from . import api
import secrets
from datetime import datetime

# 📤 Envoyer une invitation
@api.route("/api/invitations/send/<calendar_id>", methods=["POST"])
def handle_send_invitation(calendar_id):
    try:
        uid, token = verify_firebase_token()
        owner_uid = user["uid"]

        calendar = supabase.table("calendars").select("id").eq("id", calendar_id).eq("owner_uid", owner_uid).single().execute()
        if not calendar.data:
            return warning_response("Calendrier introuvable", code="CALENDAR_NOT_FOUND", status_code=404, uid=owner_uid, origin="INVITATION_SEND")

        receiver_email = request.get_json(force=True).get("email")
        receiver_user = supabase.table("users").select("id").eq("email", receiver_email).single().execute()
        if not receiver_user.data:
            return warning_response("Utilisateur non trouvé", code="USER_NOT_FOUND", status_code=404, uid=owner_uid, origin="INVITATION_SEND")

        receiver_uid = receiver_user.data["id"]
        if receiver_uid == owner_uid:
            return warning_response("Partage avec soi-même interdit", code="SELF_INVITATION", status_code=400, uid=owner_uid, origin="INVITATION_SEND")

        invitation_id = secrets.token_hex(16)

        # Notification pour receiver
        supabase.table("notifications").insert({
            "id": invitation_id,
            "user_id": receiver_uid,
            "type": "calendar_invitation",
            "content": {
                "calendar_id": calendar_id,
                "owner_uid": owner_uid,
            }
        }).execute()

        # Enregistrement dans calendar_shared_users
        supabase.table("calendar_shared_users").insert({
            "calendar_id": calendar_id,
            "receiver_uid": receiver_uid,
            "access": "edit",
            "accepted": False
        }).execute()

        return success_response("Invitation envoyée", code="INVITATION_SEND_SUCCESS", uid=owner_uid, origin="INVITATION_SEND")

    except Exception as e:
        return error_response("Erreur lors de l'envoi", code="INVITATION_SEND_ERROR", uid=owner_uid, origin="INVITATION_SEND", error=str(e))

# ✅ Accepter une invitation
@api.route("/api/invitations/accept/<notification_id>", methods=["POST"])
def handle_accept_invitation(notification_id):
    try:
        uid, token = verify_firebase_token()
        receiver_uid = user["uid"]

        notif = supabase.table("notifications").select("*").eq("id", notification_id).eq("user_id", receiver_uid).single().execute()
        if not notif.data or notif.data["type"] != "calendar_invitation":
            return warning_response("Invitation non valide", code="INVITE_INVALID", uid=receiver_uid, origin="INVITATION_ACCEPT")

        content = notif.data["content"]
        calendar_id = content["calendar_id"]
        owner_uid = content["owner_uid"]

        # Mise à jour du partage
        supabase.table("calendar_shared_users").update({
            "accepted": True,
            "accepted_at": datetime.utcnow().isoformat()
        }).eq("calendar_id", calendar_id).eq("receiver_uid", receiver_uid).execute()

        # Notification pour l’owner
        supabase.table("notifications").insert({
            "user_id": owner_uid,
            "type": "calendar_invitation_accepted",
            "content": {
                "calendar_id": calendar_id,
                "receiver_uid": receiver_uid,
            }
        }).execute()

        # Mettre la notif en lue
        supabase.table("notifications").update({
            "read": True,
            "accepted": True
        }).eq("id", notification_id).execute()

        return success_response("Invitation acceptée", code="INVITATION_ACCEPT_SUCCESS", uid=receiver_uid, origin="INVITATION_ACCEPT")

    except Exception as e:
        return error_response("Erreur lors de l'acceptation", code="INVITATION_ACCEPT_ERROR", uid=receiver_uid, origin="INVITATION_ACCEPT", error=str(e))


# ❌ Refuser une invitation
@api.route("/api/invitations/reject/<notification_id>", methods=["POST"])
def handle_reject_invitation(notification_id):
    try:
        uid, token = verify_firebase_token()
        receiver_uid = user["uid"]

        notif = supabase.table("notifications").select("*").eq("id", notification_id).eq("user_id", receiver_uid).single().execute()
        if not notif.data or notif.data["type"] != "calendar_invitation":
            return warning_response("Invitation non valide", code="INVITE_INVALID", uid=receiver_uid, origin="INVITATION_REJECT")

        content = notif.data["content"]
        calendar_id = content["calendar_id"]
        owner_uid = content["owner_uid"]

        # Supprimer la notif
        supabase.table("notifications").delete().eq("id", notification_id).execute()

        # Créer une nouvelle notif pour owner
        supabase.table("notifications").insert({
            "user_id": owner_uid,
            "type": "calendar_invitation_rejected",
            "content": {
                "calendar_id": calendar_id,
                "receiver_uid": receiver_uid,
            }
        }).execute()

        return success_response("Invitation rejetée", code="INVITATION_REJECT_SUCCESS", uid=receiver_uid, origin="INVITATION_REJECT")

    except Exception as e:
        return error_response("Erreur lors du rejet", code="INVITATION_REJECT_ERROR", uid=receiver_uid, origin="INVITATION_REJECT", error=str(e))
