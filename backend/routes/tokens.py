from flask import request
from response import success_response, error_response, warning_response
from auth import verify_firebase_token
from datetime import datetime, timezone
import secrets
from . import api
from firebase_admin import firestore
from function import generate_schedule, generate_table
from messages import (
    SUCCESS_TOKENS_FETCHED,
    SUCCESS_TOKEN_CREATED,
    SUCCESS_TOKEN_REVOKED,
    SUCCESS_TOKEN_REACTIVATED,
    SUCCESS_TOKEN_EXPIRATION_UPDATED,
    SUCCESS_TOKEN_PERMISSIONS_UPDATED,
    SUCCESS_TOKEN_METADATA_FETCHED,
    SUCCESS_TOKEN_DELETED,
    SUCCESS_CALENDAR_GENERATED,
    SUCCESS_MEDICINES_FETCHED,
    WARNING_TOKEN_NOT_FOUND,
    WARNING_TOKEN_INVALID,
    WARNING_TOKEN_EXPIRED,
    WARNING_TOKEN_REVOKED,
    WARNING_TOKEN_NOT_AUTHORIZED,
    WARNING_TOKEN_NO_READ_PERMISSION,
    WARNING_CALENDAR_NOT_FOUND,
    WARNING_LINK_NOT_FOUND,
    WARNING_NO_MEDICINES_FOUND,
    WARNING_ACCESS_DENIED,
    ERROR_TOKENS_FETCH,
    ERROR_TOKEN_CREATE,
    ERROR_TOKEN_REVOKE,
    ERROR_TOKEN_EXPIRATION_UPDATE,
    ERROR_TOKEN_PERMISSIONS_UPDATE,
    ERROR_CALENDAR_TOKEN_GENERATE,
    ERROR_TOKEN_METADATA_FETCH,
    ERROR_TOKEN_DELETE,
    ERROR_MEDICINES_FETCH
)


db = firestore.client()

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
                if doc.to_dict().get("owner_uid") == uid:
                    tokens.append(doc.to_dict())
            return success_response(
                message=SUCCESS_TOKENS_FETCHED, 
                code="TOKENS_FETCH", 
                uid=uid, 
                origin="TOKENS_FETCH", 
                data={"tokens": tokens}
            )
        
    except Exception as e:
        return error_response(
            message=ERROR_TOKENS_FETCH,
            code="TOKENS_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="TOKENS_FETCH", 
            error=str(e)
        )


# Route pour créer un lien de partage avec un token
@api.route("/api/tokens/<calendar_id>", methods=["POST"])
def handle_create_token(calendar_id):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        data = request.get_json(force=True)

        expires_at = data.get("expiresAt")
        if not expires_at:
            expires_at = None
            
        permissions = data.get("permissions")

        
        if not permissions:
            permissions = ["read"]

        # Verifier si le calendrier existe
        doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).get()
        if not doc.exists:
            return warning_response(
                message=WARNING_CALENDAR_NOT_FOUND, 
                code="CALENDAR_NOT_FOUND", 
                status_code=404, 
                uid=owner_uid, 
                origin="CALENDAR_NOT_FOUND", 
                log_extra={"calendar_id": calendar_id}
            )


        # Verifier si le calendrier est déjà partagé
        doc_2 = db.collection("shared_tokens").get()
        for doc in doc_2:
            if doc.to_dict().get("owner_uid") == owner_uid:
                if doc.to_dict().get("calendar_id") == calendar_id:
                    return warning_response(
                        message=WARNING_CALENDAR_ALREADY_SHARED, 
                        code="CALENDAR_ALREADY_SHARED", 
                        status_code=400, 
                        uid=owner_uid, 
                        origin="CALENDAR_ALREADY_SHARED", 
                        log_extra={"calendar_id": calendar_id}
                    )
        
        # Créer un nouveau lien de partage
        token = secrets.token_hex(16)
        db.collection("shared_tokens").document(token).set({
            "token": token,
            "calendar_id": calendar_id,
            "owner_uid": owner_uid,
            "expires_at": expires_at,
            "permissions": permissions,
            "revoked": False
        })

        return success_response(
            message=SUCCESS_TOKEN_CREATED, 
            code="TOKEN_CREATED", 
            uid=owner_uid, 
            origin="TOKEN_CREATE",
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message=ERROR_TOKEN_CREATE,
            code="TOKEN_CREATE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_CREATE", 
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour révoquer un token
@api.route("/api/tokens/revoke/<token>", methods=["POST"])
def handle_update_revoke_token(token):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]


        doc = db.collection("shared_tokens").document(token).get()

        if not doc.exists:
            return warning_response(
                message=WARNING_TOKEN_NOT_FOUND, 
                code="TOKEN_NOT_FOUND", 
                status_code=404, 
                uid=owner_uid, 
                origin="TOKEN_REVOKE", 
                log_extra={"token": token}
            )
        
        if doc.to_dict().get("owner_uid") != owner_uid:
            return warning_response(
                message=WARNING_TOKEN_NOT_AUTHORIZED, 
                code="TOKEN_NOT_AUTHORIZED", 
                status_code=403, 
                uid=owner_uid, 
                origin="TOKEN_REVOKE", 
                log_extra={"token": token}
            )

        db.collection("shared_tokens").document(token).update({
            "revoked": not doc.to_dict().get("revoked")
        })
        if db.collection("shared_tokens").document(token).get().to_dict().get("revoked"):
            return success_response(
                message=SUCCESS_TOKEN_REVOKED, 
                code="TOKEN_REVOKED", 
                uid=owner_uid, 
                origin="TOKEN_REVOKE", 
                log_extra={"token": token}
            )
        else:
            return success_response(
                message=SUCCESS_TOKEN_REACTIVATED, 
                code="TOKEN_REACTIVATED", 
                uid=owner_uid, 
                origin="TOKEN_REVOKE", 
                log_extra={"token": token}
            )

    except Exception as e:
        return error_response(
            message=ERROR_TOKEN_REVOKE,
            code="TOKEN_REVOKE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_REVOKE", 
            error=str(e),
            log_extra={"token": token}
        )


# Route pour mettre à jour l'expiration d'un token
@api.route("/api/tokens/expiration/<token>", methods=["POST"])
def handle_update_token_expiration(token):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        data = request.get_json(force=True)

        doc = db.collection("shared_tokens").document(token).get()

        if not doc.exists:
            return warning_response(
                message=WARNING_TOKEN_NOT_FOUND, 
                code="TOKEN_NOT_FOUND", 
                status_code=404, 
                uid=owner_uid, 
                origin="TOKEN_EXPIRATION_UPDATE", 
                log_extra={"token": token}
            )
        
        if doc.to_dict().get("owner_uid") != owner_uid:
            return warning_response(
                message=WARNING_TOKEN_NOT_AUTHORIZED, 
                code="TOKEN_NOT_AUTHORIZED", 
                status_code=403, 
                uid=owner_uid, 
                origin="TOKEN_EXPIRATION_UPDATE", 
                log_extra={"token": token}
            )
        expires_at = data.get("expiresAt")
        if not expires_at:
            db.collection("shared_tokens").document(token).update({
                "expires_at": None
            })
        else:
            db.collection("shared_tokens").document(token).update({
                "expires_at": datetime.strptime(expires_at, "%Y-%m-%d")
            })

        return success_response(
            message=SUCCESS_TOKEN_EXPIRATION_UPDATED, 
            code="TOKEN_EXPIRATION_UPDATED", 
            uid=owner_uid, 
            origin="TOKEN_EXPIRATION_UPDATE", 
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message=ERROR_TOKEN_EXPIRATION_UPDATE,
            code="TOKEN_EXPIRATION_UPDATE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_EXPIRATION_UPDATE", 
            error=str(e),
            log_extra={"token": token}
        )


# Route pour mettre à jour les permissions d'un token
@api.route("/api/tokens/permissions/<token>", methods=["POST"])
def handle_update_token_permissions(token):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        data = request.get_json(force=True)

        doc = db.collection("shared_tokens").document(token).get()

        if not doc.exists:
            return warning_response(
                message=WARNING_TOKEN_NOT_FOUND, 
                code="TOKEN_NOT_FOUND", 
                status_code=404, 
                uid=owner_uid, 
                origin="TOKEN_NOT_FOUND", 
                log_extra={"token": token}
            )
        
        if doc.to_dict().get("owner_uid") != owner_uid:
            return warning_response(
                message=WARNING_TOKEN_NOT_AUTHORIZED, 
                code="TOKEN_NOT_AUTHORIZED", 
                status_code=403, 
                uid=owner_uid, 
                origin="TOKEN_NOT_AUTHORIZED", 
                log_extra={"token": token}
            )

        permissions = data.get("permissions")
        db.collection("shared_tokens").document(token).update({
            "permissions": permissions
        })

        return success_response(
            message=SUCCESS_TOKEN_PERMISSIONS_UPDATED, 
            code="TOKEN_PERMISSIONS_UPDATED", 
            uid=owner_uid, 
            origin="TOKEN_PERMISSIONS_UPDATE", 
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message=ERROR_TOKEN_PERMISSIONS_UPDATE,
            code="TOKEN_PERMISSIONS_UPDATE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_PERMISSIONS_UPDATE", 
            error=str(e),
            log_extra={"token": token}
        )


# Route pour générer un calendrier partagé pour un token
@api.route("/api/tokens/<token>/schedule", methods=["GET"])
def handle_generate_token_schedule(token):
    try:
        start_date = request.args.get("startTime")
        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        doc = db.collection("shared_tokens").document(token).get()
        if not doc.exists:
            return warning_response(
                message=WARNING_TOKEN_INVALID, 
                code="TOKEN_INVALID", 
                status_code=404, 
                uid="unknown", 
                origin="TOKEN_GENERATE_SCHEDULE", 
                log_extra={"token": token}
            )

        data = doc.to_dict()

        calendar_id = data.get("calendar_id")
        owner_uid = data.get("owner_uid")
        expires_at = data.get("expires_at")
        permissions = data.get("permissions")
        revoked = data.get("revoked")

        now = datetime.now(timezone.utc).date()
        if expires_at and now > expires_at.date():
            return warning_response(
                message=WARNING_TOKEN_EXPIRED, 
                code="TOKEN_EXPIRED", 
                status_code=404, 
                uid="unknown", 
                origin="TOKEN_GENERATE_SCHEDULE", 
                log_extra={"token": token}
            )

        if revoked:
            return warning_response(
                message=WARNING_TOKEN_REVOKED, 
                code="TOKEN_REVOKED", 
                status_code=404, 
                uid="unknown", 
                origin="TOKEN_GENERATE_SCHEDULE", 
                log_extra={"token": token}
            )

        if "read" not in permissions:
            return warning_response(
                message=WARNING_TOKEN_NO_READ_PERMISSION, 
                code="TOKEN_NO_READ_PERMISSION", 
                status_code=403, 
                uid="unknown", 
                origin="TOKEN_GENERATE_SCHEDULE", 
                log_extra={"token": token}
            )

        doc_1 = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id)
        if not doc_1.get().exists:
            return warning_response(
                message=WARNING_CALENDAR_NOT_FOUND, 
                code="CALENDAR_NOT_FOUND", 
                status_code=404, 
                uid="unknown", 
                origin="TOKEN_GENERATE_SCHEDULE", 
                log_extra={"token": token}
            )

        calendar_name = doc_1.get().to_dict().get("calendar_name")

        doc_2 = doc_1.collection("medicines")
        if not doc_2.get():
            return success_response(
                message=SUCCESS_SHARED_CALENDARS_LOAD, 
                code="SHARED_CALENDARS_LOAD_SUCCESS", 
                uid=uid, 
                origin="TOKEN_GENERATE_SCHEDULE",
                data={"medicines": 0, "schedule": [], "calendar_name": calendar_name, "table": {}}
            )

        medicines = [med.to_dict() for med in doc_2.get()]

        schedule = generate_schedule(start_date, medicines)
        table = generate_table(start_date, medicines)


        return success_response(
            message=SUCCESS_CALENDAR_GENERATED, 
            code="CALENDAR_GENERATED_SUCCESS", 
            uid=owner_uid, 
            origin="TOKEN_GENERATE_SCHEDULE", 
            data={"medicines": len(medicines), "schedule": schedule, "calendar_name": calendar_name, "table": table},
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message=ERROR_CALENDAR_TOKEN_GENERATE,
            code="CALENDAR_TOKEN_GENERATE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_GENERATE_SCHEDULE", 
            error=str(e),
            log_extra={"token": token}
        )

# Route pour obtenir les métadonnées d’un token public
@api.route("/api/tokens/<token>", methods=["GET"])
def get_token_metadata(token):
    try:
        doc = db.collection("shared_tokens").document(token).get()
        if not doc.exists:
            return warning_response(
                message=WARNING_TOKEN_INVALID,
                code="TOKEN_INVALID",
                status_code=404,
                uid="unknown",
                origin="TOKEN_METADATA_LOAD",
                log_extra={"token": token}
            )

        data = doc.to_dict()
        calendar_id = data.get("calendar_id")
        owner_uid = data.get("owner_uid")
        expires_at = data.get("expires_at")
        revoked = data.get("revoked")
        permissions = data.get("permissions")

        # Vérification simple
        now = datetime.now(timezone.utc).date()
        if expires_at and now > expires_at.date():
            return warning_response(
                message=WARNING_TOKEN_EXPIRED,
                code="TOKEN_EXPIRED",
                status_code=403,
                uid="unknown",
                origin="TOKEN_METADATA_LOAD",
                log_extra={"token": token}
            )

        if revoked:
            return warning_response(
                message=WARNING_TOKEN_REVOKED,
                code="TOKEN_REVOKED",
                status_code=403,
                uid="unknown",
                origin="TOKEN_METADATA_LOAD",
                log_extra={"token": token}
            )
        
        if "read" not in permissions:
            return warning_response(
                message=WARNING_TOKEN_NO_READ_PERMISSION,
                code="TOKEN_NO_READ_PERMISSION",
                status_code=403,
                uid="unknown",
                origin="TOKEN_METADATA_LOAD",
                log_extra={"token": token}
            )
        

        return success_response(
            message=SUCCESS_TOKEN_METADATA_FETCHED,
            code="TOKEN_METADATA_SUCCESS",
            origin="TOKEN_METADATA_FETCH",
            uid="unknown",
            data={
                "calendar_id": calendar_id,
                "owner_uid": owner_uid,
            },
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message=ERROR_TOKEN_METADATA_FETCH,
            code="TOKEN_METADATA_ERROR",
            status_code=500,
            error=str(e),
            origin="TOKEN_METADATA_FETCH",
            uid="unknown",
            log_extra={"token": token}
        )


# Route pour supprimer un token
@api.route("/api/tokens/<token>", methods=["DELETE"])
def handle_delete_token(token):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        doc = db.collection("shared_tokens").document(token).get()

        if not doc.exists:
            return warning_response(
                message=WARNING_TOKEN_NOT_FOUND, 
                code="TOKEN_NOT_FOUND", 
                status_code=404, 
                uid=owner_uid, 
                origin="TOKEN_DELETE", 
                log_extra={"token": token}
            )

        if doc.to_dict().get("owner_uid") != owner_uid:
            return warning_response(
                message=WARNING_TOKEN_NOT_AUTHORIZED, 
                code="TOKEN_NOT_AUTHORIZED", 
                status_code=403, 
                uid=owner_uid, 
                origin="TOKEN_DELETE", 
                log_extra={"token": token}
            )

        db.collection("shared_tokens").document(token).delete()
        return success_response(
            message=SUCCESS_TOKEN_DELETED, 
            code="TOKEN_DELETE_SUCCESS", 
            uid=owner_uid, 
            origin="TOKEN_DELETE", 
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message=ERROR_TOKEN_DELETE,
            code="TOKEN_DELETE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_DELETE", 
            error=str(e),
            log_extra={"token": token}
        )


# Route pour obtenir les médicaments d’un token public
@api.route("/api/tokens/<token>/medicines", methods=["GET"])
def handle_token_medicines(token):
    try:
        doc = db.collection("shared_tokens").document(token).get()
        if not doc.exists:
            return warning_response(
                message=WARNING_TOKEN_INVALID, 
                code="TOKEN_INVALID", 
                status_code=404, 
                origin="TOKEN_MEDICINES_LOAD", 
                log_extra={"token": token}
            )

        data = doc.to_dict()
        calendar_id = data.get("calendar_id")
        owner_uid = data.get("owner_uid")
        expires_at = data.get("expires_at")
        revoked = data.get("revoked")
        permissions = data.get("permissions")

        now = datetime.now(timezone.utc).date()
        
        if expires_at and now > expires_at.date():
            return warning_response(
                message=WARNING_TOKEN_EXPIRED,
                code="TOKEN_EXPIRED",
                status_code=403,
                origin="TOKEN_MEDICINES_LOAD",
                log_extra={"token": token}
            )

        if revoked:
            return warning_response(
                message=WARNING_TOKEN_REVOKED,
                code="TOKEN_REVOKED",
                status_code=403,
                origin="TOKEN_MEDICINES_LOAD",
                log_extra={"token": token}
            )

        if "read" not in permissions:
            return warning_response(
                message=WARNING_TOKEN_NO_READ_PERMISSION,
                code="TOKEN_NO_READ_PERMISSION",
                status_code=403,
                origin="TOKEN_MEDICINES_LOAD",
                log_extra={"token": token}
            )

        cal_ref = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id)
        if not cal_ref.get().exists:
            return warning_response(
                message=WARNING_CALENDAR_NOT_FOUND,
                code="CALENDAR_NOT_FOUND",
                status_code=404,
                origin="TOKEN_MEDICINES_LOAD",
                log_extra={"token": token}
            )

        medicines = [doc.to_dict() for doc in cal_ref.collection("medicines").get()]

        return success_response(
            message=SUCCESS_MEDICINES_FETCHED,
            code="MEDICINES_SHARED_LOADED",
            origin="TOKEN_MEDICINES_LOAD",
            data={"medicines": medicines},
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message=ERROR_MEDICINES_FETCH,
            code="MEDICINES_SHARED_ERROR",
            status_code=500,
            error=str(e),
            origin="TOKEN_MEDICINES_LOAD",
            log_extra={"token": token}
        )
