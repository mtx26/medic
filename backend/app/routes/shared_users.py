from app.utils.validators import verify_firebase_token
from datetime import datetime, timezone
from . import api
from firebase_admin import firestore, auth
from app.services.calendar_service import verify_calendar_share, generate_schedule, generate_table
from flask import request
import time
from app.services.user import fetch_user
from app.utils.response import success_response, error_response, warning_response
from app.db.connection import get_connection
import json
from app.utils.messages import *

SELECT_SHARED_CALENDAR = "SELECT * FROM calendars WHERE id = %s"

# Route pour récupérer les calendriers partagés
@api.route("/shared/users/calendars", methods=["GET"])
def handle_shared_calendars():
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_calendars WHERE receiver_uid = %s AND accepted = true", (uid,))
                shared_users = cursor.fetchall()
                t_1 = time.time()

                if not shared_users:
                    return success_response(
                        message=SUCCESS_SHARED_CALENDARS_FETCHED,
                        code="SHARED_CALENDARS_LOAD_EMPTY",
                        uid=uid,
                        origin="SHARED_CALENDARS_LOAD",
                        data={"calendars": []},
                        log_extra={"time": t_1 - t_0}
                    )

                calendars_list = []
                for shared_user in shared_users:

                    calendar_id = shared_user.get("calendar_id")
                    access = shared_user.get("access", "read")

                    # Récupère le calendrier nom du calendrier et le nom de l'owner
                    cursor.execute(SELECT_SHARED_CALENDAR, (calendar_id,))
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
                    owner_uid = calendar.get("owner_uid")

                    # Récupère le nombre de médicaments
                    medicines_count = cursor.execute("SELECT COUNT(*) FROM medicines WHERE calendar_id = %s", (calendar_id,))
                    medicines_count = cursor.fetchone()
                    medicines_count = medicines_count.get("count", 0)

                    calendar_name = calendar.get("name")

                    # Récupère les infos de l'owner
                    owner = fetch_user(owner_uid)
                    if owner is None:
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
                        "access": access,
                        "medicines_count": medicines_count
                    })

                t_2 = time.time()

                return success_response(
                    message=SUCCESS_SHARED_CALENDARS_FETCHED, 
                    code="SHARED_CALENDARS_LOAD_SUCCESS", 
                    uid=uid, 
                    origin="SHARED_CALENDARS_LOAD",
                    data={"calendars": calendars_list},
                    log_extra={"time": t_2 - t_0}
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
        t_0 = time.time()
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
                cursor.execute(SELECT_SHARED_CALENDAR, (calendar_id,))
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
                t_2 = time.time()

        return success_response(
            message=SUCCESS_SHARED_CALENDAR_FETCHED,
            code="SHARED_CALENDARS_LOAD_SUCCESS",
            uid=receiver_uid,
            origin="SHARED_CALENDARS_LOAD",
            data={"calendar_id": calendar_id, "calendar_name": calendar_name, "access": access, "owner_uid": owner_uid},
            log_extra={"calendar_id": calendar_id, "time": t_2 - t_0}
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
        t_0 = time.time()
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
                cursor.execute(SELECT_SHARED_CALENDAR, (calendar_id,))
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
                t_1 = time.time()
                if not medicines:
                    return success_response(
                        message=SUCCESS_SHARED_CALENDAR_FETCHED, 
                        code="SHARED_CALENDARS_LOAD_SUCCESS", 
                        uid=uid, 
                        origin="SHARED_CALENDARS_LOAD",
                        data={"medicines": 0, "schedule": [], "calendar_name": calendar_name, "table": {}},
                        log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
                    )

                t_2 = time.time()
                schedule = generate_schedule(start_date, medicines)
                t_3 = time.time()
                table = generate_table(start_date, medicines)
                t_4 = time.time()
            
        return success_response(
            message=SUCCESS_SHARED_CALENDAR_FETCHED, 
            code="SHARED_CALENDARS_LOAD_SUCCESS", 
            uid=uid, 
            origin="SHARED_CALENDARS_LOAD",
            data={"medicines": len(medicines), "schedule": schedule, "calendar_name": calendar_name, "table": table},
            log_extra={"calendar_id": calendar_id, "time": t_4 - t_0, "schedule_time": t_3 - t_2, "table_time": t_4 - t_3}
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
        t_0 = time.time()
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
                cursor.execute(SELECT_SHARED_CALENDAR, (calendar_id,))
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
            
                notify_and_record(
                    uid=owner_uid,
                    title="📬 Calendrier partagé supprimé",
                    body="Un utilisateur a supprimé le calendrier partagé.",
                    notif_type="calendar_shared_deleted_by_receiver",
                    sender_uid=receiver_uid,
                    calendar_id=calendar_id
                )
                t_1 = time.time()

        return success_response(
            message=SUCCESS_SHARED_CALENDAR_DELETED, 
            code="SHARED_CALENDARS_DELETE_SUCCESS", 
            uid=receiver_uid, 
            origin="SHARED_CALENDARS_DELETE",
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
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
        t_0 = time.time()
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
                notify_and_record(
                    uid=receiver_uid,
                    title="📬 Calendrier partagé supprimé",
                    body="Le calendrier partagé a été supprimé par le propriétaire.",
                    notif_type="calendar_shared_deleted_by_owner",
                    sender_uid=owner_uid,
                    calendar_id=calendar_id
                )
                t_1 = time.time()

        return success_response(
            message=SUCCESS_SHARED_USER_DELETED, 
            code="SHARED_USERS_DELETE_SUCCESS", 
            uid=receiver_uid, 
            origin="SHARED_USERS_DELETE",
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
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
        t_0 = time.time()
        user = verify_firebase_token()
        owner_uid = user["uid"]

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(SELECT_SHARED_CALENDAR, (calendar_id,))
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
                t_1 = time.time()
                if not shared_users:
                    return success_response(
                        message=SUCCESS_SHARED_USERS_FETCHED,
                        code="SHARED_USERS_LOAD_SUCCESS",
                        uid=owner_uid,
                        origin="SHARED_USERS_LOAD",
                        data={"users": []},
                        log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
                    )

                shared_users_list = []
                for shared_user in shared_users:

                    receiver_uid = shared_user.get("receiver_uid")
                    access = shared_user.get("access", "read")
                    accepted = shared_user.get("accepted", False)

                    receiver = fetch_user(receiver_uid)
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

                t_2 = time.time()

        return success_response(
            message=SUCCESS_SHARED_USERS_FETCHED, 
            code="SHARED_USERS_LOAD_SUCCESS", 
            uid=owner_uid, 
            origin="SHARED_USERS_LOAD",
            data={"users": shared_users_list},
            log_extra={"calendar_id": calendar_id, "time": t_2 - t_0}
        )

    except Exception as e:
        return error_response(
            message=ERROR_SHARED_USERS_FETCH,
            code="SHARED_USERS_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="SHARED_USERS_LOAD",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour récupérer les boites de médicaments d'un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>/boxes", methods=["GET"])
def handle_shared_boxes(calendar_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]

        if not verify_calendar_share(calendar_id, uid):
            return warning_response(
                message=WARNING_UNAUTHORIZED_ACCESS,
                code="SHARED_BOXES_LOAD_ERROR",
                status_code=403,
                uid=uid,
                origin="SHARED_BOXES_LOAD"
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                SELECT mb.id, mb.name, mb.box_capacity, mb.stock_quantity, mb.stock_alert_threshold, mb.calendar_id, c.name AS calendar_name
                FROM medicine_boxes mb
                JOIN calendars c ON mb.calendar_id = c.id
                WHERE c.id = %s
                """, (calendar_id,))
                boxes = cursor.fetchall()
                t_1 = time.time()
                if not boxes:
                    return success_response(
                        message=SUCCESS_SHARED_BOXES_FETCHED,
                        code="SHARED_BOXES_LOAD_SUCCESS",
                        uid=uid,
                        origin="SHARED_BOXES_LOAD",
                        data={"boxes": []},
                        log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
                    )

                t_2 = time.time()

        return success_response(
            message=SUCCESS_SHARED_BOXES_FETCHED,
            code="SHARED_BOXES_LOAD_SUCCESS",
            uid=uid,
            origin="SHARED_BOXES_LOAD",
            data={"boxes": boxes},
            log_extra={"calendar_id": calendar_id, "time": t_2 - t_0}
        )

    except Exception as e:
        return error_response(
            message=ERROR_SHARED_BOXES_FETCH,
            code="SHARED_BOXES_ERROR",
            status_code=500,
            uid=uid,
            origin="SHARED_BOXES_LOAD",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

# Route pour modifier une boite de médicaments d'un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>/boxes/<box_id>", methods=["PUT"])
def handle_update_shared_box(calendar_id, box_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]
        data = request.get_json()
        name = data.get("name")
        box_capacity = data.get("box_capacity")
        stock_alert_threshold = data.get("stock_alert_threshold")
        stock_quantity = data.get("stock_quantity")


        if not verify_calendar_share(calendar_id, uid):
            return warning_response(
                message=WARNING_UNAUTHORIZED_ACCESS,
                code="SHARED_BOXES_UPDATE_ERROR",
                status_code=403,
                uid=uid,
                origin="SHARED_BOXES_UPDATE"
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE medicine_boxes 
                    SET name = %s, box_capacity = %s, stock_alert_threshold = %s, stock_quantity = %s 
                    WHERE id = %s AND calendar_id = %s
                """, (name, box_capacity, stock_alert_threshold, stock_quantity, box_id, calendar_id))
                conn.commit()
                t_1 = time.time()

        return success_response(
            message=SUCCESS_SHARED_BOX_UPDATED,
            code="SHARED_BOXES_UPDATE_SUCCESS",
            uid=uid,
            origin="SHARED_BOXES_UPDATE",
            log_extra={"calendar_id": calendar_id, "box_id": box_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message=ERROR_SHARED_BOX_UPDATE,
            code="SHARED_BOXES_UPDATE_ERROR",
            status_code=500,
            uid=uid,
            origin="SHARED_BOXES_UPDATE",
            error=str(e),
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )

# Route pour créer une boite de médicaments d'un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>/boxes", methods=["POST"])
def handle_create_shared_box(calendar_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]
        data = request.get_json()
        name = data.get("name")
        box_capacity = data.get("box_capacity", 0)
        stock_alert_threshold = data.get("stock_alert_threshold", 0)
        stock_quantity = data.get("stock_quantity", 0)

        if not verify_calendar_share(calendar_id, uid):
            return warning_response(
                message=WARNING_UNAUTHORIZED_ACCESS,
                code="SHARED_BOXES_CREATE_ERROR",
                status_code=403,
                uid=uid,
                origin="SHARED_BOXES_CREATE"
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO medicine_boxes (name, box_capacity, stock_alert_threshold, stock_quantity, calendar_id)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (name, box_capacity, stock_alert_threshold, stock_quantity, calendar_id))
                t_1 = time.time()
                box = cursor.fetchone()
                box_id = box.get("id")
                conn.commit()

        return success_response(
            message=SUCCESS_SHARED_BOX_CREATED,
            code="SHARED_BOXES_CREATE_SUCCESS",
            uid=uid,
            origin="SHARED_BOXES_CREATE",
            data={"box_id": box_id},
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message=ERROR_SHARED_BOX_CREATE,
            code="SHARED_BOXES_CREATE_ERROR",
            status_code=500,
            uid=uid,
            origin="SHARED_BOXES_CREATE",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )
