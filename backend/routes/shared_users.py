from flask import request
from auth import verify_firebase_token
from datetime import datetime, timezone
from . import api
from firebase_admin import firestore, auth
from function import verify_calendar_share, generate_schedule, generate_table
import secrets
from response import success_response, error_response, warning_response

db = firestore.client()

# Route pour récupérer les calendriers partagés
@api.route("/api/shared/users/calendars", methods=["GET"])
def handle_shared_calendars():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        shared_with_doc = db.collection("users").document(uid).collection("shared_calendars")
        shared_users_docs = list(shared_with_doc.stream())

        if not shared_users_docs:
            return success_response(
                message="Aucun calendrier partagé", 
                code="SHARED_CALENDARS_LOAD_EMPTY", 
                uid=uid, 
                origin="SHARED_CALENDARS_LOAD",
                data={"calendars": []}
            )


        calendars_list = []
        for user_doc in shared_users_docs:
            data = user_doc.to_dict()

            owner_uid = data.get("owner_uid")
            calendar_id = data.get("calendar_id")
            access = data.get("access", "read")

            # Récupère le calendrier nom du calendrier et le nom de l'owner
            calendar_doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).get()
            if not calendar_doc.exists:
                return warning_response(
                    message="Calendrier partagé introuvable",
                    code="SHARED_CALENDARS_LOAD_ERROR",
                    status_code=404,
                    uid=uid,
                    origin="SHARED_CALENDARS_LOAD"
                )
            calendar_name = calendar_doc.to_dict().get("calendar_name")

            owner_doc = db.collection("users").document(owner_uid).get()
            if not owner_doc.exists:
                return warning_response(
                    message="Propriétaire du calendrier introuvable",
                    code="SHARED_CALENDARS_LOAD_ERROR",
                    status_code=404,
                    uid=uid,
                    origin="SHARED_CALENDARS_LOAD"
                )
            owner_name = owner_doc.to_dict().get("display_name")
            owner_email = owner_doc.to_dict().get("email")
            owner_photo_url = owner_doc.to_dict().get("photo_url")
            if not owner_photo_url:
                owner_photo_url = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg"

            if not verify_calendar_share(calendar_id, owner_uid, uid):
                continue

            # Ajoute les infos à la réponse
            calendars_list.append({
                "calendar_id": calendar_id,
                "calendar_name": calendar_name,
                "owner_uid": owner_uid,
                "owner_name": owner_name,
                "owner_photo_url": owner_photo_url,
                "owner_email": owner_email,
                "access": access
            })

        return success_response(
            message="Calendriers partagés récupérés avec succès", 
            code="SHARED_CALENDARS_LOAD_SUCCESS", 
            uid=uid, 
            origin="SHARED_CALENDARS_LOAD",
            data={"calendars": calendars_list}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération des calendriers partagés.", 
            code="SHARED_CALENDARS_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="SHARED_CALENDARS_LOAD",
            error=str(e)
        )

# Route pour récupérer les informations d'un calendrier partagé
@api.route("/api/shared/users/calendars/<calendar_id>", methods=["GET"])
def handle_user_shared_calendar(calendar_id):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        shared_with_doc = db.collection("users").document(receiver_uid).collection("shared_calendars").document(calendar_id)
        if not shared_with_doc.get().exists:
            return warning_response(
                message="Calendrier partagé introuvable.", 
                code="SHARED_CALENDARS_LOAD_ERROR", 
                status_code=404, 
                uid=receiver_uid,
                origin="SHARED_CALENDARS_LOAD",
                log_extra={"calendar_id": calendar_id}
            )

        data = shared_with_doc.get().to_dict()
        owner_uid = data.get("owner_uid")
        access = data.get("access", "read")

        if not verify_calendar_share(calendar_id, owner_uid, receiver_uid):
            return warning_response(
                message="Accès non autorisé.",
                code="SHARED_CALENDARS_LOAD_ERROR",
                status_code=403,
                uid=receiver_uid,
                origin="SHARED_CALENDARS_LOAD",
                log_extra={"calendar_id": calendar_id}
            )

        calendar_doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).get()
        if not calendar_doc.exists:
            return warning_response(
                message="Calendrier partagé introuvable",
                code="SHARED_CALENDARS_LOAD_ERROR",
                status_code=404,
                uid=receiver_uid,
                origin="SHARED_CALENDARS_LOAD",
                log_extra={"calendar_id": calendar_id}
            )
        
        calendar_name = calendar_doc.to_dict().get("calendar_name")

        return success_response(
            message="Calendrier partagé récupéré avec succès",
            code="SHARED_CALENDARS_LOAD_SUCCESS",
            uid=receiver_uid,
            origin="SHARED_CALENDARS_LOAD",
            data={"calendar_id": calendar_id, "calendar_name": calendar_name, "access": access, "owner_uid": owner_uid},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération des informations du calendrier partagé.",
            code="SHARED_CALENDARS_ERROR",
            status_code=500,
            uid=receiver_uid,
            origin="SHARED_CALENDARS_LOAD",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

# Route pour générer un calendrier partagé
@api.route("/api/shared/users/calendars/<calendar_id>/schedule", methods=["GET"])
def handle_user_shared_calendar_schedule(calendar_id):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        start_date = request.args.get("startTime")
        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        doc = db.collection("users").document(uid).collection("shared_calendars").document(calendar_id)
        if not doc.get().exists:
            return warning_response(
                message="Calendrier partagé introuvable.", 
                code="SHARED_CALENDARS_LOAD_ERROR", 
                status_code=404, 
                uid=uid, 
                origin="SHARED_CALENDARS_LOAD",
                log_extra={"calendar_id": calendar_id}
            )

        owner_uid = doc.get().to_dict().get("owner_uid")

        doc_1 = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id)
        if not doc_1.get().exists:
            return warning_response(
                message="Calendrier partagé introuvable.", 
                code="SHARED_CALENDARS_LOAD_ERROR", 
                status_code=404, 
                uid=uid, 
                origin="SHARED_CALENDARS_LOAD",
                log_extra={"calendar_id": calendar_id}
            )

        calendar_name = doc_1.get().to_dict().get("calendar_name")

        if not verify_calendar_share(calendar_id, owner_uid, uid):
            return warning_response(
                message="Accès non autorisé.", 
                code="SHARED_CALENDARS_LOAD_ERROR", 
                status_code=403, 
                uid=uid, 
                origin="SHARED_CALENDARS_LOAD",
                log_extra={"calendar_id": calendar_id}
            )

        doc_2 = doc_1.collection("medicines")
        if not doc_2.get():
            return success_response(
                message="Aucun médicament dans le calendrier partagé", 
                code="SHARED_CALENDARS_LOAD_SUCCESS", 
                uid=uid, 
                origin="SHARED_CALENDARS_LOAD",
                data={"medicines": 0, "schedule": [], "calendar_name": calendar_name, "table": {}}
            )

        medicines = [med.to_dict() for med in doc_2.get()]

        schedule = generate_schedule(start_date, medicines)
        table = generate_table(start_date, medicines)
    
        return success_response(
            message="Calendrier partagé récupéré avec succès", 
            code="SHARED_CALENDARS_LOAD_SUCCESS", 
            uid=uid, 
            origin="SHARED_CALENDARS_LOAD",
            data={"medicines": len(medicines), "schedule": schedule, "calendar_name": calendar_name, "table": table},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération du calendrier partagé.", 
            code="SHARED_CALENDARS_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="SHARED_CALENDARS_LOAD",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour supprimer un calendrier partagé pour le receiver
@api.route("/api/shared/users/calendars/<calendar_id>", methods=["DELETE"])
def handle_delete_user_shared_calendar(calendar_id):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        received_calendar_doc = db.collection("users").document(receiver_uid).collection("shared_calendars").document(calendar_id)
        if not received_calendar_doc.get().exists:
            return warning_response(
                message="Calendrier partagé introuvable", 
                code="SHARED_CALENDARS_DELETE_ERROR", 
                status_code=404, 
                uid=receiver_uid, 
                origin="SHARED_CALENDARS_DELETE",
                log_extra={"calendar_id": calendar_id}
            )

        owner_uid = received_calendar_doc.get().to_dict().get("owner_uid")

        if not verify_calendar_share(calendar_id, owner_uid, receiver_uid):
            return warning_response(
                message="Accès non autorisé.", 
                code="SHARED_CALENDARS_DELETE_ERROR", 
                status_code=403, 
                uid=receiver_uid, 
                origin="SHARED_CALENDARS_DELETE",
                log_extra={"calendar_id": calendar_id}
            )
        

        shared_with_doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).collection("shared_with").document(receiver_uid)
        if not shared_with_doc.get().exists:
            return warning_response(
                message="Utilisateur partagé introuvable.", 
                code="SHARED_CALENDARS_DELETE_ERROR", 
                status_code=404, 
                uid=receiver_uid, 
                origin="SHARED_CALENDARS_DELETE",
                log_extra={"calendar_id": calendar_id}
            )
            
        received_calendar_doc.delete()
        shared_with_doc.delete()

        notification_id = secrets.token_hex(16)

        # Notification à l'utilisateur qui a partagé le calendrier
        notification_doc = db.collection("users").document(owner_uid).collection("notifications").document(notification_id)
        notification_doc.set({
            "type": "calendar_shared_deleted_by_receiver",
            "calendar_id": calendar_id,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "owner_uid": owner_uid,
            "receiver_uid": receiver_uid,
            "notification_id": notification_id,
            "read": False
        })

        return success_response(
            message="Calendrier partagé supprimé avec succès", 
            code="SHARED_CALENDARS_DELETE_SUCCESS", 
            uid=receiver_uid, 
            origin="SHARED_CALENDARS_DELETE",
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la suppression du calendrier partagé.", 
            code="SHARED_CALENDARS_DELETE_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="SHARED_CALENDARS_DELETE",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour supprimer un utilisateur partagé pour le owner
@api.route("/api/shared/users/<calendar_id>/<receiver_uid>", methods=["DELETE"])
def handle_delete_user_shared_user(calendar_id, receiver_uid):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        receiver_doc = db.collection("users").document(receiver_uid)
        if not receiver_doc.get().exists:
            return warning_response(
                message="Utilisateur partagé introuvable.", 
                code="SHARED_USERS_DELETE_ERROR", 
                status_code=404, 
                uid=owner_uid, 
                origin="SHARED_USERS_DELETE",
                log_extra={"calendar_id": calendar_id, "receiver_uid": receiver_uid}
            )

        if owner_uid == receiver_uid:
            return warning_response(
                message="Impossible de supprimer l'utilisateur partagé lui-même.", 
                code="SHARED_USERS_DELETE_ERROR", 
                status_code=400, 
                uid=owner_uid, 
                origin="SHARED_USERS_DELETE",
                log_extra={"calendar_id": calendar_id, "receiver_uid": receiver_uid}
            )

        shared_with_doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).collection("shared_with").document(receiver_uid)
        if not shared_with_doc.get().exists:
            return warning_response(
                message="Utilisateur partagé introuvable.", 
                code="SHARED_USERS_DELETE_ERROR", 
                status_code=404, 
                uid=owner_uid, 
                origin="SHARED_USERS_DELETE",
                log_extra={"calendar_id": calendar_id, "receiver_uid": receiver_uid}
            )


        received_calendar_doc = db.collection("users").document(receiver_uid).collection("shared_calendars").document(calendar_id)
        if received_calendar_doc.get().exists:
            received_calendar_doc.delete()

        shared_with_doc.delete()


        # Supprimer les notif pour rejoindre le calendrier
        notification_docs = db.collection("users").document(receiver_uid).collection("notifications").get()
        invitation_deleted = False

        for doc in notification_docs:
            data = doc.to_dict()
            if (
                data.get("type") == "calendar_invitation"
                and data.get("calendar_id") == calendar_id
                and data.get("owner_uid") == owner_uid
            ):
                if not data.get("read", False):
                    doc.reference.delete()
                    invitation_deleted = True

        # Si aucune invitation supprimée, envoyer une notification de suppression
        if not invitation_deleted:
            notification_id = secrets.token_hex(16)
            notification_doc = db.collection("users").document(receiver_uid).collection("notifications").document(notification_id)
            notification_doc.set({
                "type": "calendar_shared_deleted_by_owner",
                "calendar_id": calendar_id,
                "timestamp": firestore.SERVER_TIMESTAMP,
                "owner_uid": owner_uid,
                "receiver_uid": receiver_uid,
                "notification_id": notification_id,
                "read": False
            })


        return success_response(
            message="Utilisateur partagé supprimé avec succès.", 
            code="SHARED_USERS_DELETE_SUCCESS", 
            uid=receiver_uid, 
            origin="SHARED_USERS_DELETE",
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la suppression de l'utilisateur partagé.", 
            code="SHARED_USERS_DELETE_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="SHARED_USERS_DELETE",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour récupérer les utilisateurs ayant accès à un calendrier
@api.route("/api/shared/users/users/<calendar_id>", methods=["GET"])
def handle_shared_users(calendar_id):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        shared_with_doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).collection("shared_with")
        shared_users_docs = list(shared_with_doc.stream())


        shared_users_list = []
        for doc in shared_users_docs:

            data = doc.to_dict()

            receiver_uid = data.get("receiver_uid")
            access = data.get("access", "read")
            accepted = data.get("accepted", False)
            receiver_doc = db.collection("users").document(receiver_uid).get()
            if not receiver_doc.exists:
                return warning_response(
                    message="Utilisateur partagé introuvable",
                    code="SHARED_USERS_LOAD_ERROR",
                    status_code=404,
                    uid=owner_uid,
                    origin="SHARED_USERS_LOAD"
                )
            receiver_photo_url = receiver_doc.to_dict().get("photo_url")
            receiver_name = receiver_doc.to_dict().get("display_name")
            receiver_email = receiver_doc.to_dict().get("email")

            if not receiver_photo_url:
                receiver_photo_url = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg"

            if not verify_calendar_share(calendar_id, owner_uid, receiver_uid):
                continue

            shared_users_list.append({
                "receiver_uid": receiver_uid,
                "access": access,
                "accepted": accepted,
                "receiver_photo_url": receiver_photo_url,
                "receiver_name": receiver_name,
                "receiver_email": receiver_email
            })

        return success_response(
            message="Utilisateurs partagés récupérés avec succès.", 
            code="SHARED_USERS_LOAD_SUCCESS", 
            uid=owner_uid, 
            origin="SHARED_USERS_LOAD",
            data={"users": shared_users_list}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération des utilisateurs partagés.", 
            code="SHARED_USERS_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="SHARED_USERS_LOAD",
            error=str(e)
        )


# Route pour récupérer les médicaments d'un calendrier partagé
@api.route("/api/shared/users/calendars/<calendar_id>/medicines", methods=["GET"])
def handle_shared_user_calendar_medicines(calendar_id):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        doc_1_ref = db.collection("users").document(receiver_uid).collection("shared_calendars").document(calendar_id)
        if not doc_1_ref.get().exists:
            return warning_response(
                message="Calendrier partagé introuvable.", 
                code="SHARED_USER_CALENDAR_MEDICINES_LOAD_ERROR", 
                status_code=404, 
                uid=receiver_uid, 
                origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
                log_extra={"calendar_id": calendar_id}
            )

        owner_uid = doc_1_ref.get().to_dict().get("owner_uid")

        if not verify_calendar_share(calendar_id, owner_uid, receiver_uid):
            return warning_response(
                message="Accès non autorisé.", 
                code="SHARED_USER_CALENDAR_MEDICINES_LOAD_ERROR", 
                status_code=403, 
                uid=receiver_uid, 
                origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
                log_extra={"calendar_id": calendar_id}
            )

        doc_2_ref = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id)
        if not doc_2_ref.get().exists:
            return warning_response(
                message="Calendrier introuvable.", 
                code="SHARED_USER_CALENDAR_MEDICINES_LOAD_ERROR", 
                status_code=404, 
                uid=owner_uid, 
                origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
                log_extra={"calendar_id": calendar_id}
            )

        doc_3_ref = doc_2_ref.collection("medicines")
        if not doc_3_ref.get():
            return success_response(
                message="Aucun médicament dans le calendrier partagé", 
                code="SHARED_USER_CALENDAR_MEDICINES_LOAD_SUCCESS", 
                uid=receiver_uid, 
                origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
                data={"medicines": []}
            )

        medicines = [med.to_dict() for med in doc_3_ref.get()]

        return success_response(
            message="Médicaments récupérés avec succès", 
            code="SHARED_USER_CALENDAR_MEDICINES_LOAD_SUCCESS", 
            uid=receiver_uid, 
            origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
            data={"medicines": medicines}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération des médicaments du calendrier partagé.", 
            code="SHARED_USER_CALENDAR_MEDICINES_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour mettre à jour les médicaments d'un calendrier partagé
@api.route("/api/shared/users/calendars/<calendar_id>/medicines", methods=["PUT"])
def handle_update_shared_user_calendar_medicines(calendar_id):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        medicines = request.json.get("medicines", [])

        doc_1_ref = db.collection("users").document(receiver_uid).collection("shared_calendars").document(calendar_id)
        if not doc_1_ref.get().exists:
            return warning_response(
                message="Calendrier partagé introuvable.", 
                code="SHARED_USER_CALENDAR_MEDICINES_UPDATE_ERROR", 
                status_code=404, 
                uid=receiver_uid, 
                origin="SHARED_USER_CALENDAR_MEDICINES_UPDATE",
                log_extra={"calendar_id": calendar_id}
            )

        owner_uid = doc_1_ref.get().to_dict().get("owner_uid")

        if not verify_calendar_share(calendar_id, owner_uid, receiver_uid):
            return warning_response(
                message="Accès non autorisé.", 
                code="SHARED_USER_CALENDAR_MEDICINES_UPDATE_ERROR", 
                status_code=403, 
                uid=receiver_uid, 
                origin="SHARED_USER_CALENDAR_MEDICINES_UPDATE",
                log_extra={"calendar_id": calendar_id}
            )

        doc_2_ref = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).collection("medicines")
            
        for med_doc in doc_2_ref.stream():
            med_doc.reference.delete()

        for med in medicines:
            doc_2_ref.document(med["id"]).set(med)

        return success_response(
            message="Médicaments mis à jour avec succès", 
            code="SHARED_USER_CALENDAR_MEDICINES_UPDATE_SUCCESS", 
            uid=receiver_uid, 
            origin="SHARED_USER_CALENDAR_MEDICINES_UPDATE",
            data={"medicines": medicines},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la mise à jour des médicaments du calendrier partagé.", 
            code="SHARED_USER_CALENDAR_MEDICINES_UPDATE_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="SHARED_USER_CALENDAR_MEDICINES_UPDATE",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


