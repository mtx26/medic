from flask import request
from app.utils.validators import verify_firebase_token
from . import api
from firebase_admin import firestore
from app.services.calendar_service import verify_calendar_share
from app.utils.response import success_response, error_response, warning_response
from app.utils.messages import (
    SUCCESS_MEDICINES_FETCHED,
    SUCCESS_MEDICINES_COUNTED,
    ERROR_MEDICINES_COUNT,
    WARNING_UNAUTHORIZED_ACCESS,
)

def get_db():
    from firebase_admin import firestore
    return firestore.client()


# Route pour compter les médicaments
@api.route("/medicines/count", methods=["GET"])
def count_medicines():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        calendar_id = request.args.get("calendarId")

        db = get_db()

        doc = db.collection("users").document(uid).collection("calendars").document(calendar_id).collection("medicines").get()
        if not doc:
            return success_response(
                message=SUCCESS_MEDICINES_COUNTED, 
                code="MED_COUNT_SUCCESS", 
                uid=uid, 
                origin="MED_COUNT",
                data={"count": 0},
                log_extra={"calendar_id": calendar_id}
            )
        medicines = [med.to_dict() for med in doc]
        count = len(medicines)

        return success_response(
            message=SUCCESS_MEDICINES_FETCHED, 
            code="MED_COUNT_SUCCESS", 
            uid=uid, 
            origin="MED_COUNT",
            data={"count": count},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message=ERROR_MEDICINES_COUNT, 
            code="MED_COUNT_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="MED_COUNT",
            error=str(e)
        )

# Route pour compter les médicaments d'un calendrier partagé
@api.route("/medicines/shared/count", methods=["GET"])
def count_shared_medicines():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        calendar_id = request.args.get("calendarId")
        owner_uid = request.args.get("ownerUid")

        db = get_db()

        doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).collection("medicines").get()
        if not doc:
            return success_response(
                message=SUCCESS_MEDICINES_COUNTED, 
                code="MED_SHARED_COUNT_SUCCESS", 
                uid=uid, 
                origin="MED_SHARED_COUNT",
                data={"count": 0},
                log_extra={"calendar_id": calendar_id}
            )
        if not verify_calendar_share(calendar_id, owner_uid, uid):
            return warning_response(
                message=WARNING_UNAUTHORIZED_ACCESS, 
                code="UNAUTHORIZED_ACCESS", 
                status_code=403, 
                uid=uid, 
                origin="MED_SHARED_COUNT",
                log_extra={"calendar_id": calendar_id}
            )

        medicines = [med.to_dict() for med in doc]
        count = len(medicines)

        return success_response(
            message=SUCCESS_MEDICINES_COUNTED, 
            code="MED_SHARED_COUNT_SUCCESS", 
            uid=uid, 
            origin="MED_SHARED_COUNT",
            data={"count": count},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message=ERROR_MEDICINES_COUNT, 
            code="MED_SHARED_COUNT_ERROR", 
            status_code=500, 
            uid=uid,
            origin="MED_SHARED_COUNT",
            error=str(e)
        )
