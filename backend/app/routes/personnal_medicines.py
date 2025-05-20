from flask import request
from app.utils.validators import verify_firebase_token
from datetime import datetime, timezone, timedelta
from . import api
from app.db.connection import get_connection
from app.services.calendar_service import verify_calendar
from app.utils.response import success_response, error_response, warning_response
from app.utils.messages import (
    SUCCESS_MEDICINES_FETCHED,
    SUCCESS_MEDICINES_UPDATED,
    ERROR_MEDICINES_FETCH,
    ERROR_MEDICINES_UPDATE,
    WARNING_INVALID_MEDICINE_FORMAT,
    WARNING_CALENDAR_NOT_FOUND,
)

# Obtenir les médicaments d’un calendrier
@api.route("/calendars/<calendar_id>/medicines", methods=["GET"])
def get_medicines(calendar_id):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        if not verify_calendar(calendar_id, uid):
            return warning_response(
                message=WARNING_CALENDAR_NOT_FOUND,
                code="CALENDAR_NOT_FOUND",
                status_code=404,
                uid=uid,
                origin="MED_FETCH",
                log_extra={"calendar_id": calendar_id}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM medicines WHERE calendar_id = %s", (calendar_id,))
                medicines = cursor.fetchall()
                if not medicines:
                    return success_response(
                        message=SUCCESS_MEDICINES_FETCHED, 
                        code="MED_FETCH_SUCCESS", 
                        uid=uid, 
                        origin="MED_FETCH",
                        data={"medicines": []},
                        log_extra={"calendar_id": calendar_id}
                    )

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

        if not isinstance(medicines, list):
            return warning_response(
                message=WARNING_INVALID_MEDICINE_FORMAT, 
                code="INVALID_MEDICINE_FORMAT", 
                status_code=400, 
                uid=uid, 
                origin="MED_UPDATE",
                log_extra={"calendar_id": calendar_id}
            )        

        if not verify_calendar(calendar_id, uid):
            return warning_response(
                message=WARNING_CALENDAR_NOT_FOUND,
                code="CALENDAR_NOT_FOUND",
                status_code=404,
                uid=uid,
                origin="MED_UPDATE",
                log_extra={"calendar_id": calendar_id}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM medicines WHERE calendar_id = %s", (calendar_id,))

                for med in medicines:
                    name = med["name"]
                    tablet_count = med["tablet_count"]
                    time_of_day = med["time_of_day"]
                    interval_days = med["interval_days"]
                    start_date = med["start_date"]
                    dose = med.get("dose", None)

                    cursor.execute(
                        """
                        INSERT INTO medicines (calendar_id, name, tablet_count, time_of_day, interval_days, start_date, dose) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """,
                        (calendar_id, name, tablet_count, time_of_day, interval_days, start_date, dose)
                    )

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