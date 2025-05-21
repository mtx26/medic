from app.utils.validators import verify_firebase_token
from datetime import datetime, timezone
from . import api
from firebase_admin import firestore, auth
from app.services.calendar_service import verify_calendar_share, generate_schedule, generate_table
import secrets
from flask import request
from app.utils.response import success_response, error_response, warning_response
from app.db.connection import get_connection
import json
from app.utils.messages import (
    SUCCESS_SHARED_CALENDARS_FETCHED,
    SUCCESS_SHARED_CALENDAR_FETCHED,
    SUCCESS_SHARED_CALENDAR_DELETED,
    SUCCESS_SHARED_USER_DELETED,
    SUCCESS_SHARED_USERS_FETCHED,
    WARNING_SHARED_CALENDAR_NOT_FOUND,
    WARNING_SHARED_USER_NOT_FOUND,
    WARNING_UNAUTHORIZED_ACCESS,
    WARNING_CANNOT_REMOVE_SELF,
    ERROR_SHARED_CALENDAR_FETCH,
    ERROR_SHARED_CALENDAR_DELETE,
    ERROR_SHARED_USER_DELETE,
    ERROR_SHARED_USERS_FETCH,
    ERROR_SHARED_CALENDARS_FETCH
)

# Route pour récupérer les calendriers partagés
@api.route("/shared/users/calendars", methods=["GET"])
def handle_shared_calendars():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_calendars WHERE receiver_uid = %s AND accepted = true", (uid,))
                shared_users = cursor.fetchall()

                if not shared_users:
                    return success_response(
                        message=SUCCESS_SHARED_CALENDARS_FETCHED,
                        code="SHARED_CALENDARS_LOAD_EMPTY",
                        uid=uid,
                        origin="SHARED_CALENDARS_LOAD",
                        data={"calendars": []}
                    )

                calendars_list = []
                for shared_user in shared_users:

                    owner_uid = shared_user.get("owner_uid")
                    calendar_id = shared_user.get("calendar_id")
                    access = shared_user.get("access", "read")

                    # Récupère le calendrier nom du calendrier et le nom de l'owner
                    cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
                    calendar = cursor.fetchone()
                    if not calendar:
                        return warning_response(
                            message=WARNING_SHARED_CALENDAR_NOT_FOUND,
                            code="SHARED_CALENDARS_LOAD_ERROR",
                            status_code=404,
                            uid=uid,
                            origin="SHARED_CALENDARS_LOAD",
                            log_extra={"calendar_id": calendar_id}
                        )
                    calendar_name = calendar.get("name")

                    cursor.execute("SELECT * FROM users WHERE id = %s", (uid,))
                    owner = cursor.fetchone()
                    if owner is None:
                        print(f"Owner not found for calendar {calendar_id}")
                        return warning_response(
                            message=WARNING_SHARED_USER_NOT_FOUND,
                            code="SHARED_CALENDARS_LOAD_ERROR",
                            status_code=404,
                            uid=uid,
                            origin="SHARED_CALENDARS_LOAD",
                            log_extra={"calendar_id": calendar_id, "calendar_name": calendar_name}
                        )
                    owner_name = owner.get("display_name")
                    owner_email = owner.get("email")
                    owner_photo_url = owner.get("photo_url")
                    if not owner_photo_url:
                        owner_photo_url = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg"

                    if not verify_calendar_share(calendar_id, uid):
                        continue

                    # Ajoute les infos à la réponse
                    calendars_list.append({
                        "id": calendar_id,
                        "name": calendar_name,
                        "owner_uid": owner_uid,
                        "owner_name": owner_name,
                        "owner_photo_url": owner_photo_url,
                        "owner_email": owner_email,
                        "access": access
                    })

        return success_response(
            message=SUCCESS_SHARED_CALENDARS_FETCHED, 
            code="SHARED_CALENDARS_LOAD_SUCCESS", 
            uid=uid, 
            origin="SHARED_CALENDARS_LOAD",
            data={"calendars": calendars_list}
        )

    except Exception as e:
        return error_response(
            message=ERROR_SHARED_CALENDARS_FETCH, 
            code="SHARED_CALENDARS_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="SHARED_CALENDARS_LOAD",
            error=str(e)
        )

# Route pour récupérer les informations d'un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>", methods=["GET"])
def handle_user_shared_calendar(calendar_id):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        if not verify_calendar_share(calendar_id, receiver_uid):
            return warning_response(
                message=WARNING_UNAUTHORIZED_ACCESS,
                code="SHARED_CALENDARS_LOAD_ERROR",
                status_code=403,
                uid=receiver_uid,
                origin="SHARED_CALENDARS_LOAD",
                log_extra={"calendar_id": calendar_id}
            )
        
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
                calendar = cursor.fetchone()
                if not calendar:
                    return warning_response(
                        message=WARNING_SHARED_CALENDAR_NOT_FOUND,
                        code="SHARED_CALENDARS_LOAD_ERROR",
                        status_code=404,
                        uid=receiver_uid,
                        origin="SHARED_CALENDARS_LOAD",
                        log_extra={"calendar_id": calendar_id}
                    )
                calendar_name = calendar.get("name")
                owner_uid = calendar.get("owner_uid")

                cursor.execute("SELECT * FROM shared_calendars WHERE calendar_id = %s", (calendar_id,))
                shared_user = cursor.fetchone()
                if not shared_user:
                    return warning_response(
                        message=WARNING_SHARED_CALENDAR_NOT_FOUND,
                        code="SHARED_CALENDARS_LOAD_ERROR",
                        status_code=404,
                        uid=receiver_uid,
                        origin="SHARED_CALENDARS_LOAD",
                        log_extra={"calendar_id": calendar_id}
                    )
                access = shared_user.get("access", "read")

        return success_response(
            message=SUCCESS_SHARED_CALENDAR_FETCHED,
            code="SHARED_CALENDARS_LOAD_SUCCESS",
            uid=receiver_uid,
            origin="SHARED_CALENDARS_LOAD",
            data={"calendar_id": calendar_id, "calendar_name": calendar_name, "access": access, "owner_uid": owner_uid},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message=ERROR_SHARED_CALENDAR_FETCH,
            code="SHARED_CALENDARS_ERROR",
            status_code=500,
            uid=receiver_uid,
            origin="SHARED_CALENDARS_LOAD",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

# Route pour générer un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>/schedule", methods=["GET"])
def handle_user_shared_calendar_schedule(calendar_id):
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        if not verify_calendar_share(calendar_id, uid):
            return warning_response(
                message=WARNING_UNAUTHORIZED_ACCESS,
                code="SHARED_CALENDARS_LOAD_ERROR",
                status_code=403,
                uid=uid,
                origin="SHARED_CALENDARS_LOAD",
                log_extra={"calendar_id": calendar_id}
            )

        start_date = request.args.get("startTime")
        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
                calendar = cursor.fetchone()
                if not calendar:
                    return warning_response(
                        message=WARNING_SHARED_CALENDAR_NOT_FOUND,
                        code="SHARED_CALENDARS_LOAD_ERROR",
                        status_code=404,
                        uid=uid,
                        origin="SHARED_CALENDARS_LOAD",
                        log_extra={"calendar_id": calendar_id}
                    )
                calendar_name = calendar.get("name")

                cursor.execute("SELECT * FROM medicines WHERE calendar_id = %s", (calendar_id,))
                medicines = cursor.fetchall()
                if not medicines:
                    return success_response(
                        message=SUCCESS_SHARED_CALENDAR_FETCHED, 
                        code="SHARED_CALENDARS_LOAD_SUCCESS", 
                        uid=uid, 
                        origin="SHARED_CALENDARS_LOAD",
                        data={"medicines": 0, "schedule": [], "calendar_name": calendar_name, "table": {}}
                    )

        schedule = generate_schedule(start_date, medicines)
        table = generate_table(start_date, medicines)
    
        return success_response(
            message=SUCCESS_SHARED_CALENDAR_FETCHED, 
            code="SHARED_CALENDARS_LOAD_SUCCESS", 
            uid=uid, 
            origin="SHARED_CALENDARS_LOAD",
            data={"medicines": len(medicines), "schedule": schedule, "calendar_name": calendar_name, "table": table},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message=ERROR_SHARED_CALENDAR_FETCH,
            code="SHARED_CALENDARS_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="SHARED_CALENDARS_LOAD",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour supprimer un calendrier partagé pour le receiver
@api.route("/shared/users/calendars/<calendar_id>", methods=["DELETE"])
def handle_delete_user_shared_calendar(calendar_id):
    try:
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        if not verify_calendar_share(calendar_id, receiver_uid):
            return warning_response(
                message=WARNING_UNAUTHORIZED_ACCESS, 
                code="SHARED_CALENDARS_DELETE_ERROR", 
                status_code=403, 
                uid=receiver_uid, 
                origin="SHARED_CALENDARS_DELETE",
                log_extra={"calendar_id": calendar_id}
            )
        

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
                calendar = cursor.fetchone()
                if not calendar:
                    return warning_response(
                        message=WARNING_SHARED_CALENDAR_NOT_FOUND,
                        code="SHARED_CALENDARS_DELETE_ERROR",
                        status_code=404,
                        uid=receiver_uid,
                        origin="SHARED_CALENDARS_DELETE",
                        log_extra={"calendar_id": calendar_id}
                    )

                owner_uid = calendar.get("owner_uid")
                cursor.execute("DELETE FROM shared_calendars WHERE receiver_uid = %s AND calendar_id = %s", (receiver_uid, calendar_id))
            
                cursor.execute(
                    """
                    INSERT INTO notifications (type, user_id, content, sender_uid) 
                    VALUES (%s, %s, %s::jsonb, %s)
                    """,
                    ("calendar_shared_deleted_by_receiver", owner_uid, json.dumps({"calendar_id": calendar_id}), receiver_uid )
                )

        return success_response(
            message=SUCCESS_SHARED_CALENDAR_DELETED, 
            code="SHARED_CALENDARS_DELETE_SUCCESS", 
            uid=receiver_uid, 
            origin="SHARED_CALENDARS_DELETE",
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message=ERROR_SHARED_CALENDAR_DELETE,
            code="SHARED_CALENDARS_DELETE_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="SHARED_CALENDARS_DELETE",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour supprimer un utilisateur partagé pour le owner
@api.route("/shared/users/<calendar_id>/<receiver_uid>", methods=["DELETE"])
def handle_delete_user_shared_user(calendar_id, receiver_uid):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        if owner_uid == receiver_uid:
            return warning_response(
                message=WARNING_CANNOT_REMOVE_SELF, 
                code="SHARED_USERS_DELETE_ERROR", 
                status_code=400, 
                uid=owner_uid, 
                origin="SHARED_USERS_DELETE",
                log_extra={"calendar_id": calendar_id, "receiver_uid": receiver_uid}
            )

        if not verify_calendar_share(calendar_id, receiver_uid):
            return warning_response(
                message=WARNING_UNAUTHORIZED_ACCESS,
                code="SHARED_USERS_DELETE_ERROR",
                status_code=403,
                uid=owner_uid,
                origin="SHARED_USERS_DELETE",
                log_extra={"calendar_id": calendar_id, "receiver_uid": receiver_uid}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:

                cursor.execute("DELETE FROM shared_calendars WHERE receiver_uid = %s AND calendar_id = %s", (receiver_uid, calendar_id))
                row = cursor.rowcount
                if row == 0:
                    return warning_response(
                        message=WARNING_SHARED_CALENDAR_NOT_FOUND,
                        code="SHARED_USERS_DELETE_ERROR",
                        status_code=404,
                        uid=owner_uid,
                        origin="SHARED_USERS_DELETE",
                        log_extra={"calendar_id": calendar_id, "receiver_uid": receiver_uid}
                    )

                cursor.execute(
                    "DELETE FROM notifications WHERE user_id = %s AND type = %s AND content = %s::jsonb AND sender_uid = %s",
                    (
                        receiver_uid,
                        "calendar_invitation",
                        json.dumps({"calendar_id": calendar_id}),
                        owner_uid
                    )
                )                
                cursor.execute(
                    """
                    INSERT INTO notifications (type, user_id, content, sender_uid) 
                    VALUES (%s, %s, %s::jsonb, %s)
                    """,
                    (
                        "calendar_shared_deleted_by_owner",
                        owner_uid,
                        json.dumps({"calendar_id": calendar_id}), 
                        receiver_uid
                    )
                )

        return success_response(
            message=SUCCESS_SHARED_USER_DELETED, 
            code="SHARED_USERS_DELETE_SUCCESS", 
            uid=receiver_uid, 
            origin="SHARED_USERS_DELETE",
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message=ERROR_SHARED_USER_DELETE,
            code="SHARED_USERS_DELETE_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="SHARED_USERS_DELETE",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour récupérer les utilisateurs ayant accès à un calendrier
@api.route("/shared/users/users/<calendar_id>", methods=["GET"])
def handle_shared_users(calendar_id):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s AND owner_uid = %s", (calendar_id, owner_uid))
                calendar = cursor.fetchone()
                if not calendar:
                    return warning_response(
                        message=WARNING_SHARED_CALENDAR_NOT_FOUND,
                        code="SHARED_USERS_LOAD_ERROR",
                        status_code=404,
                        uid=owner_uid,
                        origin="SHARED_USERS_LOAD"
                    )

                cursor.execute("SELECT * FROM shared_calendars WHERE calendar_id = %s", (calendar_id,))
                shared_users = cursor.fetchall()
                if not shared_users:
                    return success_response(
                        message=SUCCESS_SHARED_USERS_FETCHED,
                        code="SHARED_USERS_LOAD_SUCCESS",
                        uid=owner_uid,
                        origin="SHARED_USERS_LOAD",
                        data={"users": []}
                    )

                shared_users_list = []
                for shared_user in shared_users:

                    receiver_uid = shared_user.get("receiver_uid")
                    access = shared_user.get("access", "read")
                    accepted = shared_user.get("accepted", False)

                    cursor.execute("SELECT * FROM users WHERE id = %s", (receiver_uid,))
                    receiver = cursor.fetchone()
                    if not receiver:
                        return warning_response(
                            message=WARNING_SHARED_USER_NOT_FOUND,
                            code="SHARED_USERS_LOAD_ERROR",
                            status_code=404,
                            uid=owner_uid,
                            origin="SHARED_USERS_LOAD"
                        )
                    receiver_photo_url = receiver.get("photo_url")
                    receiver_name = receiver.get("display_name")
                    receiver_email = receiver.get("email")

                    if not receiver_photo_url:
                        receiver_photo_url = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg"

                    if not verify_calendar_share(calendar_id, receiver_uid):
                        continue

                    shared_users_list.append({
                        "receiver_uid": receiver_uid,
                        "access": access,
                        "accepted": accepted,
                        "receiver_photo_url": receiver_photo_url,
                        "receiver_name": receiver_name,
                        "receiver_email": receiver_email
                    })

        return success_response(
            message=SUCCESS_SHARED_USERS_FETCHED, 
            code="SHARED_USERS_LOAD_SUCCESS", 
            uid=owner_uid, 
            origin="SHARED_USERS_LOAD",
            data={"users": shared_users_list}
        )

    except Exception as e:
        return error_response(
            message=ERROR_SHARED_USERS_FETCH,
            code="SHARED_USERS_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="SHARED_USERS_LOAD",
            error=str(e)
        )