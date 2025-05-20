from flask import request
from app.utils.validators import verify_firebase_token
from datetime import datetime, timezone, timedelta
from . import api
from firebase_admin import firestore
from app.services.calendar_service import verify_calendar_share
from app.utils.response import success_response, error_response, warning_response
from app.utils.messages import (
    WARNING_TOKEN_INVALID,
    WARNING_TOKEN_EXPIRED,
    WARNING_TOKEN_REVOKED,
    WARNING_TOKEN_NO_READ_PERMISSION,
    WARNING_CALENDAR_NOT_FOUND,
)

def get_db():
    from firebase_admin import firestore
    return firestore.client()

# Route pour obtenir les médicaments d’un token public
@api.route("/tokens/<token>/medicines", methods=["GET"])
def handle_token_medicines(token):
    try:
        db = get_db()

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
