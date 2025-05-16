from flask import request
from auth import verify_firebase_token
from datetime import datetime, timezone, timedelta
from . import api
from firebase_admin import firestore
from function import verify_calendar_share
from response import success_response, error_response, warning_response
from messages import (
    SUCCESS_MEDICINES_FETCHED,
    SUCCESS_MEDICINES_UPDATED,
    SUCCESS_MEDICINES_COUNTED,
    ERROR_MEDICINES_FETCH,
    ERROR_MEDICINES_UPDATE,
    ERROR_MEDICINES_COUNT,
    WARNING_INVALID_MEDICINE_FORMAT,
    WARNING_UNAUTHORIZED_ACCESS,
    WARNING_CALENDAR_NOT_FOUND,
)

db = firestore.client()


# Obtenir les médicaments d’un calendrier
@api.route("/api/calendars/<calendar_id>/medicines", methods=["GET"])
def get_medicines(calendar_id):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        doc = db.collection("users").document(uid).collection("calendars").document(calendar_id)
        if not doc.get().exists:
            return warning_response(
                message=WARNING_CALENDAR_NOT_FOUND,
                code="CALENDAR_NOT_FOUND",
                status_code=404,
                uid=uid,
                origin="MED_FETCH"
            )

        medicines_ref = doc.collection("medicines").get()
        if not medicines_ref:
            return success_response(
                message=SUCCESS_MEDICINES_FETCHED, 
                code="MED_FETCH_SUCCESS", 
                uid=uid, 
                origin="MED_FETCH",
                data={"medicines": []},
            )
        medicines = [med.to_dict() for med in medicines_ref]

        return success_response(
            message=SUCCESS_MEDICINES_FETCHED, 
            code="MED_FETCH_SUCCESS", 
            uid=uid, 
            origin="MED_FETCH",
            data={"medicines": medicines},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message=ERROR_MEDICINES_FETCH, 
            code="MED_FETCH_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="MED_FETCH",
            error=str(e)
        )


# Mettre à jour les médicaments d’un calendrier
@api.route("/api/calendars/<calendar_id>/medicines", methods=["PUT"])
def update_medicines(calendar_id):
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        medicines = request.json.get("medicines")

        if not isinstance(medicines, list):
            return warning_response(
                message=WARNING_INVALID_MEDICINE_FORMAT, 
                code="INVALID_MEDICINE_FORMAT", 
                status_code=400, 
                uid=uid, 
                origin="MED_UPDATE",
                log_extra={"calendar_id": calendar_id}
            )        


        doc = db.collection("users").document(uid).collection("calendars").document(calendar_id).collection("medicines")
            
        for med in doc.stream():
            med.reference.delete()

        for med in medicines:
            doc.document(med["id"]).set(med)

        return success_response(
            message=SUCCESS_MEDICINES_UPDATED, 
            code="MED_UPDATE_SUCCESS", 
            uid=uid, 
            origin="MED_UPDATE",
            data={"medicines": medicines},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message=ERROR_MEDICINES_UPDATE, 
            code="MED_UPDATE_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="MED_UPDATE",
            error=str(e)
        )


# Route pour compter les médicaments
@api.route("/api/medicines/count", methods=["GET"])
def count_medicines():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        calendar_id = request.args.get("calendarId")

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
@api.route("/api/medicines/shared/count", methods=["GET"])
def count_shared_medicines():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        calendar_id = request.args.get("calendarId")
        owner_uid = request.args.get("ownerUid")

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
