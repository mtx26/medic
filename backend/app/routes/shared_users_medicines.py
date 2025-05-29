from flask import request
from app.utils.validators import verify_firebase_token
from . import api
from app.utils.response import success_response, error_response, warning_response
from app.db.connection import get_connection
from app.services.calendar_service import verify_calendar_share
from app.services.medicines import update_medicines
import time

ERROR_CALENDAR_NOT_FOUND = "calendrier non trouvé"


SELECT_SHARED_MEDICINES = "SELECT * FROM medicines WHERE calendar_id = %s"

# Route pour récupérer les médicaments d'un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>/medicines", methods=["GET"])
def handle_shared_user_calendar_medicines(calendar_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        receiver_uid = user["uid"]
        
        if not verify_calendar_share(calendar_id, receiver_uid):
            return warning_response(
                message="accès refusé", 
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
                t_1 = time.time()
            if not medicines:
                return success_response(
                    message="médicaments récupérés", 
                    code="SHARED_USER_CALENDAR_MEDICINES_LOAD_SUCCESS", 
                    uid=receiver_uid, 
                    origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
                    data={"medicines": []},
                    log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
                )

        return success_response(
            message="médicaments récupérés", 
            code="SHARED_USER_CALENDAR_MEDICINES_LOAD_SUCCESS", 
            uid=receiver_uid, 
            origin="SHARED_USER_CALENDAR_MEDICINES_LOAD",
            data={"medicines": medicines},
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des médicaments",
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
        t_0 = time.time()
        user = verify_firebase_token()
        receiver_uid = user["uid"]
        medicines = []
        
        changes = request.json.get("changes", [])

        if not verify_calendar_share(calendar_id, receiver_uid):
            return warning_response(
                message=ERROR_CALENDAR_NOT_FOUND, 
                code="SHARED_USER_CALENDAR_MEDICINES_UPDATE_ERROR", 
                status_code=404, 
                uid=receiver_uid, 
                origin="SHARED_USER_CALENDAR_MEDICINES_UPDATE",
                log_extra={"calendar_id": calendar_id}
            )

        medicines = update_medicines(calendar_id, changes)
        t_1 = time.time()
        return success_response(
            message="médicaments modifiés",
            code="SHARED_USER_CALENDAR_MEDICINES_UPDATE_SUCCESS",
            uid=receiver_uid,
            origin="SHARED_USER_CALENDAR_MEDICINES_UPDATE",
            data={"medicines": medicines},
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la modification des médicaments",
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
        t_0 = time.time()
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        if not verify_calendar_share(calendar_id, receiver_uid):
            return warning_response(
                message=ERROR_CALENDAR_NOT_FOUND,
                code="SHARED_USER_CALENDAR_MEDICINES_DELETE_ERROR",
                status_code=404,
                uid=receiver_uid,
                origin="SHARED_USER_CALENDAR_MEDICINES_DELETE",
                log_extra={"calendar_id": calendar_id}
            )

        checked = request.json.get("checked")

        if not isinstance(checked, list):
            return warning_response(
                message="format de médicament invalide",
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
                t_1 = time.time()
                if not medicines:
                    return success_response(
                        message="médicaments supprimés",
                        code="SHARED_USER_CALENDAR_MEDICINES_DELETE_SUCCESS",
                        uid=receiver_uid,
                        origin="SHARED_USER_CALENDAR_MEDICINES_DELETE",
                        data={"medicines": []},
                        log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
                    )

                return success_response(
                    message="médicaments supprimés",
                    code="SHARED_USER_CALENDAR_MEDICINES_DELETE_SUCCESS",
                    uid=receiver_uid,
                    origin="SHARED_USER_CALENDAR_MEDICINES_DELETE",
                    data={"medicines": medicines},
                    log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
                )

    except Exception as e:
        return error_response(
            message="erreur lors de la suppression des médicaments",
            code="SHARED_USER_CALENDAR_MEDICINES_DELETE_ERROR",
            status_code=500,
            uid=receiver_uid,
            origin="SHARED_USER_CALENDAR_MEDICINES_DELETE",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )