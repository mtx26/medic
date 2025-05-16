from . import api
from auth import verify_firebase_token
from datetime import datetime, timezone
from flask import request
from firebase_admin import firestore
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

        calendars_ref = db.collection("users").document(uid).collection("calendars")
        calendars = [calendar.to_dict() for calendar in calendars_ref.stream()]
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
        doc = db.collection("users").document(uid).collection("calendars").document(calendar_id).get()

        if doc.exists:
            return warning_response(
                message=WARNING_CALENDAR_ALREADY_EXISTS, 
                code="CALENDAR_CREATE_ERROR", 
                status_code=409, 
                uid=uid, 
                origin="CALENDAR_CREATE", 
                log_extra={"calendar_name": calendar_name}
            )

        db.collection("users").document(uid).collection("calendars").document(calendar_id).set({
            "calendar_id": calendar_id,
            "calendar_name": calendar_name,
            "medicines": "",
            "last_updated": firestore.SERVER_TIMESTAMP
        }, merge=True)

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

        doc_ref = db.collection("users").document(uid).collection("calendars").document(calendar_id)
        if not doc_ref.get().exists:
            return warning_response(
                message=WARNING_CALENDAR_NOT_FOUND, 
                code="CALENDAR_DELETE_ERROR", 
                status_code=404, 
                uid=uid, 
                origin="CALENDAR_DELETE_ERROR", 
                log_extra={"calendar_id": calendar_id}
            )

        doc_ref.delete()

        for doc in db.collection("shared_tokens").get():
            token_data = doc.to_dict()
            if token_data.get("owner_uid") == uid and token_data.get("calendar_id") == calendar_id:
                db.collection("shared_tokens").document(doc.id).delete()

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

        doc_ref = db.collection("users").document(uid).collection("calendars").document(calendar_id)
        if not doc_ref.get().exists:
            return warning_response(
                message=WARNING_CALENDAR_NOT_FOUND, 
                code="CALENDAR_RENAME_ERROR", 
                status_code=404, 
                uid=uid, 
                origin="CALENDAR_RENAME", 
                log_extra={"calendar_id": calendar_id, "new_calendar_name": new_calendar_name})

        old_calendar_name = doc_ref.get().to_dict().get("calendar_name")
        if not old_calendar_name or not new_calendar_name:
            return warning_response(
                message=WARNING_CALENDAR_INVALID_NAME, 
                code="CALENDAR_RENAME_ERROR", 
                status_code=400, 
                uid=uid, 
                origin="CALENDAR_RENAME", 
                log_extra={"calendar_id": calendar_id, "old_calendar_name": old_calendar_name, "new_calendar_name": new_calendar_name}
            )

        if old_calendar_name == new_calendar_name:
            return warning_response(
                message=WARNING_CALENDAR_UNCHANGED, 
                code="CALENDAR_RENAME_ERROR", 
                status_code=400, 
                uid=uid, 
                origin="CALENDAR_RENAME", 
                log_extra={"calendar_id": calendar_id, "old_calendar_name": old_calendar_name, "new_calendar_name": new_calendar_name})

        doc_ref.update({"calendar_name": new_calendar_name})

        for doc in db.collection("shared_tokens").get():
            token_data = doc.to_dict()
            if token_data.get("owner_uid") == uid and token_data.get("calendar_name") == old_calendar_name:
                db.collection("shared_tokens").document(doc.id).update({"calendar_name": new_calendar_name})

        return success_response(
            message=SUCCESS_CALENDAR_RENAMED, 
            code="CALENDAR_RENAME_SUCCESS", 
            uid=uid, 
            origin="CALENDAR_RENAME", 
            log_extra={"calendar_id": calendar_id, "old_calendar_name": old_calendar_name, "new_calendar_name": new_calendar_name}
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
        
        doc_1 = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id)
        if not doc_1.get().exists:
            return warning_response(
                message=WARNING_CALENDAR_NOT_FOUND, 
                code="CALENDAR_GENERATE_ERROR", 
                status_code=404, 
                uid=owner_uid, 
                origin="CALENDAR_GENERATE", 
                log_extra={"calendar_id": calendar_id}
                )

        calendar_name = doc_1.get().to_dict().get("calendar_name")

        doc_2 = doc_1.collection("medicines")
        if not doc_2.get():
            return success_response(
                message=SUCCESS_CALENDAR_GENERATED, 
                code="CALENDAR_GENERATE_SUCCESS", 
                uid=owner_uid, 
                origin="CALENDAR_GENERATE", 
                data={"medicines": 0, "schedule": [], "calendar_name": calendar_name, "table": {}},
                log_extra={"calendar_id": calendar_id}
            )
        
        medicines = [med.to_dict() for med in doc_2.get()]

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

