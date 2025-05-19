from . import api
from auth import verify_firebase_token
from datetime import datetime, timezone
from flask import request
from firebase_admin import firestore
from db import get_connection
from function import generate_schedule, generate_table
import secrets
from response import success_response, error_response, warning_response
from messages import (
    SUCCESS_CALENDARS_FETCHED,
    SUCCESS_CALENDAR_CREATED,
    SUCCESS_CALENDAR_DELETED,
    SUCCESS_CALENDAR_RENAMED,
    SUCCESS_CALENDAR_GENERATED,
    ERROR_CALENDARS_FETCH,
    ERROR_CALENDAR_CREATE,
    ERROR_CALENDAR_DELETE,
    ERROR_CALENDAR_RENAME,
    ERROR_CALENDAR_GENERATE,
    WARNING_CALENDAR_NOT_FOUND,
    WARNING_CALENDAR_NAME_MISSING,
    WARNING_CALENDAR_ALREADY_EXISTS,
    WARNING_CALENDAR_UNCHANGED,
    WARNING_CALENDAR_INVALID_NAME,
    WARNING_CALENDAR_INVALID_ID
)
db = firestore.client()

# Route pour récupérer les calendriers de l'utilisateur
@api.route("/api/calendars", methods=["GET"])
def handle_calendars():
    try:
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
                        log_extra={"calendar_id": calendar_id}
                    )
        return success_response(
            message=SUCCESS_CALENDARS_FETCHED, 
            code="CALENDAR_FETCH_SUCCESS", 
            uid=uid, 
            origin="CALENDAR_FETCH", 
            data={"calendars": calendars}
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
@api.route("/api/calendars", methods=["POST"])
def handle_create_calendar():
    try:
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

        calendar_id = secrets.token_hex(16)
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO calendars (id, owner_uid, name) VALUES (%s, %s, %s)", (calendar_id, uid, calendar_name))
                conn.commit()

        return success_response(
            message=SUCCESS_CALENDAR_CREATED, 
            code="CALENDAR_CREATE", 
            uid=uid, 
            origin="CALENDAR_CREATE", 
            log_extra={"calendar_name": calendar_name}
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
@api.route("/api/calendars", methods=["DELETE"])
def handle_delete_calendar():
    try:
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


        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM shared_tokens WHERE calendar_id = %s AND owner_uid = %s", (calendar_id, uid))
                shared_tokens = cur.fetchall()
                for token in shared_tokens:
                    token_data = token.to_dict()
                    if token_data.get("owner_uid") == uid and token_data.get("calendar_id") == calendar_id:
                        cur.execute("DELETE FROM shared_tokens WHERE id = %s AND owner_uid = %s", (token.id, uid))
                        conn.commit()

        return success_response(
            message=SUCCESS_CALENDAR_DELETED, 
            code="CALENDAR_DELETE_SUCCESS", 
            uid=uid, 
            origin="CALENDAR_DELETE", 
            log_extra={"calendar_id": calendar_id}
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
@api.route("/api/calendars", methods=["PUT"])
def handle_rename_calendar():
    try:
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

        return success_response(
            message=SUCCESS_CALENDAR_RENAMED, 
            code="CALENDAR_RENAME_SUCCESS", 
            uid=uid, 
            origin="CALENDAR_RENAME", 
            log_extra={"calendar_id": calendar_id, "old_calendar_name": old_name, "new_calendar_name": new_calendar_name}
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
@api.route("/api/calendars/<calendar_id>/schedule", methods=["GET"])
def handle_calendar_schedule(calendar_id):
    try:
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
                if medicines is None:
                    return success_response(
                        message=SUCCESS_CALENDAR_GENERATED, 
                        code="CALENDAR_GENERATE_SUCCESS", 
                        uid=owner_uid, 
                        origin="CALENDAR_GENERATE", 
                        data={"medicines": 0, "schedule": [], "calendar_name": calendar_name, "table": {}},
                        log_extra={"calendar_id": calendar_id}
                    )
        schedule = generate_schedule(start_date, medicines)
        table = generate_table(start_date, medicines)

        return success_response(
            message=SUCCESS_CALENDAR_GENERATED, 
            code="CALENDAR_GENERATE_SUCCESS", 
            uid=owner_uid, 
            origin="CALENDAR_GENERATE", 
            data={"medicines": len(medicines), "schedule": schedule, "calendar_name": calendar_name, "table": table},
            log_extra={"calendar_id": calendar_id}
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

