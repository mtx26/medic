from flask import request
from app.utils.validators import verify_firebase_token
from . import api
from app.utils.response import success_response, error_response, warning_response
from app.db.connection import get_connection
from app.services.calendar_service import verify_calendar_share
from app.services.medicines import update_medicines
from app.utils.messages import (
    SUCCESS_SHARED_MEDICINES_FETCHED,
    SUCCESS_SHARED_MEDICINES_UPDATED,
    WARNING_SHARED_CALENDAR_NOT_FOUND,
    WARNING_UNAUTHORIZED_ACCESS,
    ERROR_SHARED_MEDICINES_UPDATE,
    ERROR_SHARED_MEDICINES_FETCH,
    SUCCESS_MEDICINES_DELETED,
    ERROR_SHARED_MEDICINES_DELETE,
    WARNING_INVALID_MEDICINE_FORMAT,
)

SELECT_SHARED_MEDICINES = "SELECT * FROM medicines WHERE calendar_id = %s"

# Route pour récupérer les médicaments d'un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>/medicines", methods=["GET"])
def handle_shared_user_calendar_medicines(calendar_id):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]
        
        if not verify_calendar_share(calendar_id, receiver_uid):
            return warning_response(
                message=WARNING_UNAUTHORIZED_ACCESS, 
                code="SHARED_USER_CALENDAR_MEDICINES_LOAD_ERROR", 
                status_code=403, 
                uid=receiver_uid, 
                origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
                log_extra={"calendar_id": calendar_id}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(SELECT_SHARED_MEDICINES, (calendar_id,))
                medicines = cursor.fetchall()

            if not medicines:
                return success_response(
                    message=SUCCESS_SHARED_MEDICINES_FETCHED, 
                    code="SHARED_USER_CALENDAR_MEDICINES_LOAD_SUCCESS", 
                    uid=receiver_uid, 
                    origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
                    data={"medicines": []}
                )

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
        medicines = []
        
        changes = request.json.get("changes", [])

        if not verify_calendar_share(calendar_id, receiver_uid):
            return warning_response(
                message=WARNING_SHARED_CALENDAR_NOT_FOUND, 
                code="SHARED_USER_CALENDAR_MEDICINES_UPDATE_ERROR", 
                status_code=404, 
                uid=receiver_uid, 
                origin="SHARED_USER_CALENDAR_MEDICINES_UPDATE",
                log_extra={"calendar_id": calendar_id}
            )

        medicines = update_medicines(calendar_id, changes)

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


# Route pour supprimer les médicaments d'un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>/medicines", methods=["DELETE"])
def handle_delete_shared_user_calendar_medicines(calendar_id):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        if not verify_calendar_share(calendar_id, receiver_uid):
            return warning_response(
                message=WARNING_SHARED_CALENDAR_NOT_FOUND,
                code="SHARED_USER_CALENDAR_MEDICINES_DELETE_ERROR",
                status_code=404,
                uid=receiver_uid,
                origin="SHARED_USER_CALENDAR_MEDICINES_DELETE",
                log_extra={"calendar_id": calendar_id}
            )

        checked = request.json.get("checked")

        if not isinstance(checked, list):
            return warning_response(
                message=WARNING_INVALID_MEDICINE_FORMAT,
                code="SHARED_USER_CALENDAR_MEDICINES_DELETE_ERROR",
                status_code=400,
                uid=receiver_uid,
                origin="SHARED_USER_CALENDAR_MEDICINES_DELETE",
                log_extra={"calendar_id": calendar_id}
            )
        
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM medicines WHERE id IN %s", (tuple(checked),))
                conn.commit()
                cursor.execute(SELECT_SHARED_MEDICINES, (calendar_id,))
                medicines = cursor.fetchall()
                if not medicines:
                    return success_response(
                        message=SUCCESS_MEDICINES_DELETED,
                        code="SHARED_USER_CALENDAR_MEDICINES_DELETE_SUCCESS",
                        uid=receiver_uid,
                        origin="SHARED_USER_CALENDAR_MEDICINES_DELETE",
                        data={"medicines": []},
                        log_extra={"calendar_id": calendar_id}
                    )

                return success_response(
                    message=SUCCESS_MEDICINES_DELETED,
                    code="SHARED_USER_CALENDAR_MEDICINES_DELETE_SUCCESS",
                    uid=receiver_uid,
                    origin="SHARED_USER_CALENDAR_MEDICINES_DELETE",
                    data={"medicines": medicines},
                    log_extra={"calendar_id": calendar_id}
                )

    except Exception as e:
        return error_response(
            message=ERROR_SHARED_MEDICINES_DELETE,
            code="SHARED_USER_CALENDAR_MEDICINES_DELETE_ERROR",
            status_code=500,
            uid=receiver_uid,
            origin="SHARED_USER_CALENDAR_MEDICINES_DELETE",
            error=str(e)
        )