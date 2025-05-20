from flask import request
from app.utils.validators import verify_firebase_token
from . import api
from app.utils.response import success_response, error_response, warning_response
from app.services.calendar_service import verify_calendar_share
from app.utils.messages import (
    SUCCESS_SHARED_MEDICINES_FETCHED,
    SUCCESS_SHARED_MEDICINES_UPDATED,
    WARNING_SHARED_CALENDAR_NOT_FOUND,
    WARNING_UNAUTHORIZED_ACCESS,
    ERROR_SHARED_MEDICINES_UPDATE,
    ERROR_SHARED_MEDICINES_FETCH,
)

def get_db():
    from firebase_admin import firestore
    return firestore.client()

# Route pour récupérer les médicaments d'un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>/medicines", methods=["GET"])
def handle_shared_user_calendar_medicines(calendar_id):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        db = get_db()

        doc_1_ref = db.collection("users").document(receiver_uid).collection("shared_calendars").document(calendar_id)
        if not doc_1_ref.get().exists:
            return warning_response(
                message=WARNING_SHARED_CALENDAR_NOT_FOUND, 
                code="SHARED_USER_CALENDAR_MEDICINES_LOAD_ERROR", 
                status_code=404, 
                uid=receiver_uid, 
                origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
                log_extra={"calendar_id": calendar_id}
            )

        owner_uid = doc_1_ref.get().to_dict().get("owner_uid")

        if not verify_calendar_share(calendar_id, owner_uid, receiver_uid):
            return warning_response(
                message=WARNING_UNAUTHORIZED_ACCESS, 
                code="SHARED_USER_CALENDAR_MEDICINES_LOAD_ERROR", 
                status_code=403, 
                uid=receiver_uid, 
                origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
                log_extra={"calendar_id": calendar_id}
            )

        doc_2_ref = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id)
        if not doc_2_ref.get().exists:
            return warning_response(
                message=WARNING_SHARED_CALENDAR_NOT_FOUND, 
                code="SHARED_USER_CALENDAR_MEDICINES_LOAD_ERROR", 
                status_code=404, 
                uid=owner_uid, 
                origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
                log_extra={"calendar_id": calendar_id}
            )

        doc_3_ref = doc_2_ref.collection("medicines")
        if not doc_3_ref.get():
            return success_response(
                message=SUCCESS_SHARED_MEDICINES_FETCHED, 
                code="SHARED_USER_CALENDAR_MEDICINES_LOAD_SUCCESS", 
                uid=receiver_uid, 
                origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
                data={"medicines": []}
            )

        medicines = [med.to_dict() for med in doc_3_ref.get()]

        return success_response(
            message=SUCCESS_SHARED_MEDICINES_FETCHED, 
            code="SHARED_USER_CALENDAR_MEDICINES_LOAD_SUCCESS", 
            uid=receiver_uid, 
            origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
            data={"medicines": medicines}
        )

    except Exception as e:
        return error_response(
            message=ERROR_SHARED_MEDICINES_FETCH,
            code="SHARED_USER_CALENDAR_MEDICINES_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour mettre à jour les médicaments d'un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>/medicines", methods=["PUT"])
def handle_update_shared_user_calendar_medicines(calendar_id):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        db = get_db()

        medicines = request.json.get("medicines", [])

        doc_1_ref = db.collection("users").document(receiver_uid).collection("shared_calendars").document(calendar_id)
        if not doc_1_ref.get().exists:
            return warning_response(
                message=WARNING_SHARED_CALENDAR_NOT_FOUND, 
                code="SHARED_USER_CALENDAR_MEDICINES_UPDATE_ERROR", 
                status_code=404, 
                uid=receiver_uid, 
                origin="SHARED_USER_CALENDAR_MEDICINES_UPDATE",
                log_extra={"calendar_id": calendar_id}
            )

        owner_uid = doc_1_ref.get().to_dict().get("owner_uid")

        if not verify_calendar_share(calendar_id, owner_uid, receiver_uid):
            return warning_response(
                message=WARNING_UNAUTHORIZED_ACCESS, 
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
            message=SUCCESS_SHARED_MEDICINES_UPDATED, 
            code="SHARED_USER_CALENDAR_MEDICINES_UPDATE_SUCCESS", 
            uid=receiver_uid, 
            origin="SHARED_USER_CALENDAR_MEDICINES_UPDATE",
            data={"medicines": medicines},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message=ERROR_SHARED_MEDICINES_UPDATE,
            code="SHARED_USER_CALENDAR_MEDICINES_UPDATE_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="SHARED_USER_CALENDAR_MEDICINES_UPDATE",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


