from app.utils.validators import require_auth
from datetime import datetime, timezone
from . import api
from app.services.verifications import verify_calendar_share
from app.services.calendar_service import generate_calendar_schedule
from flask import request, g
import time
from app.services.user import fetch_user
from app.utils.response import success_response, error_response, warning_response
from app.db.connection import get_connection
from app.services.notifications import notify_and_record
import json
from app.config import Config
from urllib.parse import urljoin

ERROR_CALENDAR_NOT_FOUND = "calendrier non trouvé"
ERROR_UNAUTHORIZED_ACCESS = "accès refusé"
SUCCESS_SHARED_CALENDARS_LOAD = "calendriers partagés récupérés"

SELECT_SHARED_CALENDAR = "SELECT * FROM calendars WHERE id = %s"

# Route pour récupérer les calendriers partagés
@api.route("/shared/users/calendars", methods=["GET"])
@require_auth
def handle_shared_calendars():
    try:
        t_0 = time.time()
        uid = g.uid

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_calendars WHERE receiver_uid = %s AND accepted = true", (uid,))
                shared_users = cursor.fetchall()
                t_1 = time.time()

                if not shared_users:
                    return success_response(
                        message=SUCCESS_SHARED_CALENDARS_LOAD,
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
                            message=ERROR_CALENDAR_NOT_FOUND,
                            code="SHARED_CALENDARS_LOAD_ERROR",
                            status_code=404,
                            uid=uid,
                            origin="SHARED_CALENDARS_LOAD",
                            log_extra={"calendar_id": calendar_id}
                        )
                    owner_uid = calendar.get("owner_uid")

                    # Récupère le nombre de médicaments
                    cursor.execute("SELECT COUNT(*) FROM medicine_boxes WHERE calendar_id = %s", (calendar_id,))
                    boxes_count = cursor.fetchone()
                    boxes_count = boxes_count.get("count", 0) if boxes_count else 0

                    calendar_name = calendar.get("name")

                    # Récupère les infos de l'owner
                    owner = fetch_user(owner_uid)
                    if owner is None:
                        return warning_response(
                            message="utilisateur partagé non trouvé",
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
                        "boxes_count": boxes_count
                    })

                t_2 = time.time()

                return success_response(
                    message=SUCCESS_SHARED_CALENDARS_LOAD, 
                    code="SHARED_CALENDARS_LOAD_SUCCESS", 
                    uid=uid, 
                    origin="SHARED_CALENDARS_LOAD",
                    data={"calendars": calendars_list},
                    log_extra={"time": t_2 - t_0}
                )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des calendriers partagés", 
            code="SHARED_CALENDARS_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="SHARED_CALENDARS_LOAD",
            error=str(e)
        )

# Route pour récupérer les informations d'un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>", methods=["GET"])
@require_auth
def handle_user_shared_calendar(calendar_id):
    try:
        t_0 = time.time()
        receiver_uid = g.uid

        if not verify_calendar_share(calendar_id, receiver_uid):
            return warning_response(
                message=ERROR_UNAUTHORIZED_ACCESS,
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
                        message=ERROR_CALENDAR_NOT_FOUND,
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
                        message=ERROR_CALENDAR_NOT_FOUND,
                        code="SHARED_CALENDARS_LOAD_ERROR",
                        status_code=404,
                        uid=receiver_uid,
                        origin="SHARED_CALENDARS_LOAD",
                        log_extra={"calendar_id": calendar_id}
                    )
                access = shared_user.get("access", "read")
                t_2 = time.time()

        return success_response(
            message=SUCCESS_SHARED_CALENDARS_LOAD,
            code="SHARED_CALENDARS_LOAD_SUCCESS",
            uid=receiver_uid,
            origin="SHARED_CALENDARS_LOAD",
            data={"calendar_id": calendar_id, "calendar_name": calendar_name, "access": access, "owner_uid": owner_uid},
            log_extra={"calendar_id": calendar_id, "time": t_2 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération du calendrier partagé",
            code="SHARED_CALENDARS_ERROR",
            status_code=500,
            uid=receiver_uid,
            origin="SHARED_CALENDARS_LOAD",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

# Route pour générer un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>/schedule", methods=["GET"])
@require_auth
def handle_user_shared_calendar_schedule(calendar_id):
    try:
        t_0 = time.time()
        uid = g.uid

        if not verify_calendar_share(calendar_id, uid):
            return warning_response(
                message=ERROR_UNAUTHORIZED_ACCESS,
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

        schedule, table, calendar_name = generate_calendar_schedule(calendar_id, start_date)

        t_1 = time.time()
            
        return success_response(
            message=SUCCESS_SHARED_CALENDARS_LOAD, 
            code="SHARED_CALENDARS_LOAD_SUCCESS", 
            uid=uid, 
            origin="SHARED_CALENDARS_LOAD",
            data={"schedule": schedule, "table": table, "calendar_name": calendar_name},
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération du calendrier partagé",
            code="SHARED_CALENDARS_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="SHARED_CALENDARS_LOAD",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour supprimer un calendrier partagé pour le receiver
@api.route("/shared/users/calendars/<calendar_id>", methods=["DELETE"])
@require_auth
def handle_delete_user_shared_calendar(calendar_id):
    try:
        t_0 = time.time()
        receiver_uid = g.uid

        if not verify_calendar_share(calendar_id, receiver_uid):
            return warning_response(
                message=ERROR_UNAUTHORIZED_ACCESS, 
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
                        message=ERROR_CALENDAR_NOT_FOUND,
                        code="SHARED_CALENDARS_DELETE_ERROR",
                        status_code=404,
                        uid=receiver_uid,
                        origin="SHARED_CALENDARS_DELETE",
                        log_extra={"calendar_id": calendar_id}
                    )

                owner_uid = calendar.get("owner_uid")
                cursor.execute("DELETE FROM shared_calendars WHERE receiver_uid = %s AND calendar_id = %s", (receiver_uid, calendar_id))
                link = urljoin(Config.FRONTEND_URL or "", "/calendars")

                notify_and_record(
                    uid=owner_uid,
                    json_body={
                        "link": link,
                        "calendar_id": calendar_id,
                        "sender_uid": receiver_uid
                    },
                    notif_type="calendar_shared_deleted_by_receiver",
                )
                t_1 = time.time()

        return success_response(
            message="calendrier partagé supprimé", 
            code="SHARED_CALENDARS_DELETE_SUCCESS", 
            uid=receiver_uid, 
            origin="SHARED_CALENDARS_DELETE",
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la suppression du calendrier partagé",
            code="SHARED_CALENDARS_DELETE_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="SHARED_CALENDARS_DELETE",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour supprimer un utilisateur partagé pour le owner
@api.route("/shared/users/<calendar_id>/<receiver_uid>", methods=["DELETE"])
@require_auth
def handle_delete_user_shared_user(calendar_id, receiver_uid):
    try:
        t_0 = time.time()
        owner_uid = g.uid

        if owner_uid == receiver_uid:
            return warning_response(
                message="impossible de supprimer soi-même", 
                code="SHARED_USERS_DELETE_ERROR", 
                status_code=400, 
                uid=owner_uid, 
                origin="SHARED_USERS_DELETE",
                log_extra={"calendar_id": calendar_id, "receiver_uid": receiver_uid}
            )

        if not verify_calendar_share(calendar_id, receiver_uid):
            return warning_response(
                message=ERROR_UNAUTHORIZED_ACCESS,
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
                        message=ERROR_CALENDAR_NOT_FOUND,
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
                link = urljoin(Config.FRONTEND_URL or "", f"/calendar/{calendar_id}")

                notify_and_record(
                    uid=receiver_uid,
                    json_body={
                        "link": link,
                        "calendar_id": calendar_id,
                        "sender_uid": owner_uid
                    },
                    notif_type="calendar_shared_deleted_by_owner",
                )
                t_1 = time.time()

        return success_response(
            message="utilisateur partagé supprimé", 
            code="SHARED_USERS_DELETE_SUCCESS", 
            uid=receiver_uid, 
            origin="SHARED_USERS_DELETE",
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la suppression de l'utilisateur partagé",
            code="SHARED_USERS_DELETE_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="SHARED_USERS_DELETE",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour récupérer les utilisateurs ayant accès à un calendrier
@api.route("/shared/users/users/<calendar_id>", methods=["GET"])
@require_auth
def handle_shared_users(calendar_id):
    try:
        t_0 = time.time()
        owner_uid = g.uid

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(SELECT_SHARED_CALENDAR, (calendar_id,))
                calendar = cursor.fetchone()
                if not calendar:
                    return warning_response(
                        message=ERROR_CALENDAR_NOT_FOUND,
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
                        message="utilisateurs partagés récupérés",
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
                            message="utilisateur partagé non trouvé",
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
            message="utilisateurs partagés récupérés", 
            code="SHARED_USERS_LOAD_SUCCESS", 
            uid=owner_uid, 
            origin="SHARED_USERS_LOAD",
            data={"users": shared_users_list},
            log_extra={"calendar_id": calendar_id, "time": t_2 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des utilisateurs partagés",
            code="SHARED_USERS_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="SHARED_USERS_LOAD",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )
