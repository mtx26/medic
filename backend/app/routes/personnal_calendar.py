from . import api
from app.utils.validators import verify_firebase_token
from datetime import datetime, timezone
from flask import request
from app.db.connection import get_connection
from app.services.calendar_service import generate_schedule, generate_table
import time
from app.utils.response import success_response, error_response, warning_response
from app.utils.messages import *

# Route pour récupérer les calendriers de l'utilisateur
@api.route("/calendars", methods=["GET"])
def handle_calendars():
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM calendars WHERE owner_uid = %s", (uid,))
                calendars = cur.fetchall()

                if calendars is None:
                    return warning_response(
                        message=WARNING_CALENDAR_NOT_FOUND, 
                        code="CALENDAR_FETCH_ERROR", 
                        status_code=404, 
                        uid=uid, 
                        origin="CALENDAR_FETCH", 
                    )
                for calendar in calendars:
                    medicines_count = cur.execute("SELECT COUNT(*) FROM medicines WHERE calendar_id = %s", (calendar["id"],))
                    medicines_count = cur.fetchone()
                    calendar["medicines_count"] = medicines_count.get("count", 0)
        t_1 = time.time()
        return success_response(
            message=SUCCESS_CALENDARS_FETCHED, 
            code="CALENDAR_FETCH_SUCCESS", 
            uid=uid, 
            origin="CALENDAR_FETCH", 
            data={"calendars": calendars},
            log_extra={"time": t_1 - t_0}
        )
    except Exception as e:
        return error_response(
            message=ERROR_CALENDARS_FETCH, 
            code="CALENDAR_FETCH_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="CALENDAR_FETCH", 
            error=str(e)
        )


# Route pour créer un calendrier
@api.route("/calendars", methods=["POST"])
def handle_create_calendar():
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]
        calendar_name = request.json.get("calendarName")

        if not calendar_name:
            return warning_response(
                message=ERROR_CALENDAR_NAME_MISSING, 
                code="CALENDAR_CREATE_ERROR", 
                status_code=400, 
                uid=uid, 
                origin="CALENDAR_CREATE", 
                log_extra={"calendar_name": calendar_name}
            )

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO calendars (owner_uid, name) VALUES (%s, %s)", (uid, calendar_name))
                conn.commit()
        t_1 = time.time()
        return success_response(
            message=SUCCESS_CALENDAR_CREATED, 
            code="CALENDAR_CREATE", 
            uid=uid, 
            origin="CALENDAR_CREATE", 
            log_extra={"calendar_name": calendar_name, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message=ERROR_CALENDAR_CREATE, 
            code="CALENDAR_CREATE_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="CALENDAR_CREATE", 
            error=str(e)
        )


# Route pour supprimer un calendrier
@api.route("/calendars", methods=["DELETE"])
def handle_delete_calendar():
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]
        calendar_id = request.json.get("calendarId")

        if not calendar_id:
            return warning_response(
                message=WARNING_CALENDAR_INVALID_ID, 
                code="CALENDAR_DELETE_ERROR", 
                status_code=400, 
                uid=uid, 
                origin="CALENDAR_DELETE_ERROR", 
                log_extra={"calendar_id": calendar_id}
            )

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM calendars WHERE id = %s AND owner_uid = %s", (calendar_id, uid))
                calendar = cur.fetchone()
                t_1 = time.time()
                if calendar is None:
                    return warning_response(
                        message=WARNING_CALENDAR_NOT_FOUND, 
                        code="CALENDAR_DELETE_ERROR", 
                        status_code=404, 
                        uid=uid, 
                        origin="CALENDAR_DELETE_ERROR", 
                        log_extra={"calendar_id": calendar_id}
                    )

                cur.execute("DELETE FROM calendars WHERE id = %s AND owner_uid = %s", (calendar_id, uid))
                conn.commit()
        t_2 = time.time()
        return success_response(
            message=SUCCESS_CALENDAR_DELETED, 
            code="CALENDAR_DELETE_SUCCESS", 
            uid=uid, 
            origin="CALENDAR_DELETE", 
            log_extra={"calendar_id": calendar_id, "time": t_2 - t_0}
        )

    except Exception as e:
        return error_response(
            message=ERROR_CALENDAR_DELETE, 
            code="CALENDAR_DELETE_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="CALENDAR_DELETE", 
            error=str(e)
        )


# Route pour renommer un calendrier
@api.route("/calendars", methods=["PUT"])
def handle_rename_calendar():
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]
        data = request.get_json(force=True)
        calendar_id = data.get("calendarId")
        new_calendar_name = data.get("newCalendarName")

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT name FROM calendars WHERE id = %s AND owner_uid = %s", (calendar_id, uid))
                result = cur.fetchone()

                if result is None:
                    return warning_response(
                        message=WARNING_CALENDAR_NOT_FOUND, 
                        code="CALENDAR_RENAME_ERROR", 
                        status_code=404, 
                        uid=uid, 
                        origin="CALENDAR_RENAME", 
                        log_extra={"calendar_id": calendar_id, "new_calendar_name": new_calendar_name})

                old_name = result['name']

                if new_calendar_name != old_name:
                    cur.execute(
                        "UPDATE calendars SET name = %s WHERE id = %s AND owner_uid = %s",
                        (new_calendar_name, calendar_id, uid)
                    )
                    conn.commit()
        t_1 = time.time()
        return success_response(
            message=SUCCESS_CALENDAR_RENAMED, 
            code="CALENDAR_RENAME_SUCCESS", 
            uid=uid, 
            origin="CALENDAR_RENAME", 
            log_extra={"calendar_id": calendar_id, "old_calendar_name": old_name, "new_calendar_name": new_calendar_name, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message=ERROR_CALENDAR_RENAME, 
            code="CALENDAR_RENAME_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="CALENDAR_RENAME", 
            error=str(e))
  

# Route pour générer le calendrier 
@api.route("/calendars/<calendar_id>/schedule", methods=["GET"])
def handle_calendar_schedule(calendar_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        owner_uid = user["uid"]

        start_date = request.args.get("startTime")
        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM calendars WHERE id = %s AND owner_uid = %s", (calendar_id, owner_uid))
                calendar = cur.fetchone()
                if calendar is None:
                    return warning_response(
                        message=WARNING_CALENDAR_NOT_FOUND, 
                        code="CALENDAR_GENERATE_ERROR", 
                        status_code=404, 
                        uid=owner_uid, 
                        origin="CALENDAR_GENERATE", 
                        log_extra={"calendar_id": calendar_id}
                    )

                calendar_name = calendar.get("name")

                cur.execute("SELECT * FROM medicines WHERE calendar_id = %s", (calendar_id,))
                medicines = cur.fetchall()
                t_1 = time.time()
                if medicines is None:
                    return success_response(
                        message=SUCCESS_CALENDAR_GENERATED, 
                        code="CALENDAR_GENERATE_SUCCESS", 
                        uid=owner_uid, 
                        origin="CALENDAR_GENERATE", 
                        data={"medicines": 0, "schedule": [], "calendar_name": calendar_name, "table": {}},
                        log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
                    )
        t_2 = time.time()
        schedule = generate_schedule(start_date, medicines)
        t_3 = time.time()
        table = generate_table(start_date, medicines)
        t_4 = time.time()

        return success_response(
            message=SUCCESS_CALENDAR_GENERATED, 
            code="CALENDAR_GENERATE_SUCCESS", 
            uid=owner_uid, 
            origin="CALENDAR_GENERATE", 
            data={"medicines": len(medicines), "schedule": schedule, "calendar_name": calendar_name, "table": table},
            log_extra={"calendar_id": calendar_id, "time": t_4 - t_0, "time_schedule": t_3 - t_2, "time_table": t_4 - t_3}
        )

    except Exception as e:
        return error_response(
            message=ERROR_CALENDAR_GENERATE, 
            code="CALENDAR_GENERATE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="CALENDAR_GENERATE", 
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

