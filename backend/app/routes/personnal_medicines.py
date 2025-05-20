from flask import request
from app.utils.validators import verify_firebase_token
from datetime import datetime, timezone, timedelta
from . import api
from firebase_admin import firestore
from app.utils.response import success_response, error_response, warning_response
from app.utils.messages import (
    SUCCESS_MEDICINES_FETCHED,
    SUCCESS_MEDICINES_UPDATED,
    ERROR_MEDICINES_FETCH,
    ERROR_MEDICINES_UPDATE,
    WARNING_INVALID_MEDICINE_FORMAT,
    WARNING_CALENDAR_NOT_FOUND,
)

def get_db():
    from firebase_admin import firestore
    return firestore.client()

# Obtenir les médicaments d’un calendrier
@api.route("/calendars/<calendar_id>/medicines", methods=["GET"])
def get_medicines(calendar_id):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        db = get_db()

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
@api.route("/calendars/<calendar_id>/medicines", methods=["PUT"])
def update_medicines(calendar_id):
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        medicines = request.json.get("medicines")

        db = get_db()

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