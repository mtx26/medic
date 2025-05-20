from flask import request
from app.utils.validators import verify_firebase_token
from . import api
from app.db.connection import get_connection
from app.services.calendar_service import verify_calendar_share
from app.utils.response import success_response, error_response, warning_response
from app.utils.messages import (
    SUCCESS_MEDICINES_FETCHED,
    SUCCESS_MEDICINES_COUNTED,
    ERROR_MEDICINES_COUNT,
    WARNING_UNAUTHORIZED_ACCESS,
)

# Route pour compter les médicaments
@api.route("/medicines/count", methods=["GET"])
def count_medicines():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        calendar_id = request.args.get("calendarId")

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s AND owner_uid = %s", (calendar_id, uid,))
                calendar = cursor.fetchone()
                if not calendar:
                    return warning_response(
                        message=WARNING_CALENDAR_NOT_FOUND,
                        code="CALENDAR_NOT_FOUND",
                        status_code=404,
                        uid=uid,
                        origin="MED_COUNT",
                        log_extra={"calendar_id": calendar_id}
                    )

                cursor.execute("SELECT * FROM medicines WHERE calendar_id = %s", (calendar_id,))
                medicines = cursor.fetchall()
                if not medicines:
                    return success_response(
                        message=SUCCESS_MEDICINES_COUNTED, 
                        code="MED_COUNT_SUCCESS", 
                        uid=uid, 
                        origin="MED_COUNT",
                        data={"count": 0},
                        log_extra={"calendar_id": calendar_id}
                    )
    
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

        if not verify_calendar_share(calendar_id, owner_uid, uid):
            return warning_response(
                message=WARNING_UNAUTHORIZED_ACCESS, 
                code="UNAUTHORIZED_ACCESS", 
                status_code=403, 
                uid=uid, 
                origin="MED_SHARED_COUNT",
                log_extra={"calendar_id": calendar_id}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM medicines WHERE calendar_id = %s", (calendar_id,))
                medicines = cursor.fetchall()
                if not medicines:
                    return success_response(
                        message=SUCCESS_MEDICINES_COUNTED, 
                        code="MED_SHARED_COUNT_SUCCESS", 
                        uid=uid, 
                        origin="MED_SHARED_COUNT",
                        data={"count": 0},
                        log_extra={"calendar_id": calendar_id}
                    )

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
