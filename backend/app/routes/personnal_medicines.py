from flask import request
from app.utils.validators import verify_firebase_token
from datetime import datetime, timezone, timedelta
import time
from . import api
from app.db.connection import get_connection
from app.services.calendar_service import verify_calendar
from app.services.medicines import update_medicines
from app.utils.response import success_response, error_response, warning_response

ERROR_UNAUTHORIZED_ACCESS = "accès refusé"

    
MEDICINES_SELECT = "SELECT * FROM medicines WHERE calendar_id = %s"

# Obtenir les médicaments d’un calendrier
@api.route("/calendars/<calendar_id>/medicines", methods=["GET"])
def handle_get_medicines(calendar_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]

        if not verify_calendar(calendar_id, uid):
            return warning_response(
                message=ERROR_UNAUTHORIZED_ACCESS,
                code="UNAUTHORIZED_ACCESS",
                status_code=404,
                uid=uid,
                origin="MED_FETCH",
                log_extra={"calendar_id": calendar_id}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(MEDICINES_SELECT, (calendar_id,))
                medicines = cursor.fetchall()
                t_1 = time.time()
                if not medicines:
                    return success_response(
                        message="médicaments récupérés", 
                        code="MED_FETCH_SUCCESS", 
                        uid=uid, 
                        origin="MED_FETCH",
                        data={"medicines": []},
                        log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
                    )

        return success_response(
            message="médicaments récupérés", 
            code="MED_FETCH_SUCCESS", 
            uid=uid, 
            origin="MED_FETCH",
            data={"medicines": medicines},
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des médicaments", 
            code="MED_FETCH_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="MED_FETCH",
            error=str(e)
        )


# Mettre à jour les médicaments d’un calendrier
@api.route("/calendars/<calendar_id>/medicines", methods=["PUT"])
def handle_update_medicines(calendar_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]
        changes = request.json.get("changes")    

        if not verify_calendar(calendar_id, uid):
            return warning_response(
                message=ERROR_UNAUTHORIZED_ACCESS,
                code="UNAUTHORIZED_ACCESS",
                status_code=404,
                uid=uid,
                origin="MED_UPDATE",
                log_extra={"calendar_id": calendar_id}
            )

        medicines = update_medicines(calendar_id, changes)
        t_1 = time.time()
        return success_response(
            message="médicaments modifiés",
            code="MED_UPDATE_SUCCESS",
            uid=uid,
            origin="MED_UPDATE",
            data={"medicines": medicines},
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la modification des médicaments", 
            code="MED_UPDATE_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="MED_UPDATE",
            error=str(e)
        )


# Supprimer les médicaments d’un calendrier
@api.route("/calendars/<calendar_id>/medicines", methods=["DELETE"])
def handle_delete_medicines(calendar_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]

        if not verify_calendar(calendar_id, uid):
            return warning_response(
                message=ERROR_UNAUTHORIZED_ACCESS,
                code="UNAUTHORIZED_ACCESS",
                status_code=404,
                uid=uid,
                origin="MED_DELETE",
                log_extra={"calendar_id": calendar_id}
            )

        checked = request.json.get("checked")

        if not isinstance(checked, list):
            return warning_response(
                message="format de médicament invalide",
                code="INVALID_MEDICINE_FORMAT",
                status_code=400,
                uid=uid,
                origin="MED_DELETE",
                log_extra={"calendar_id": calendar_id}
            )
        
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM medicines WHERE id IN %s", (tuple(checked),))
                conn.commit()
                cursor.execute(MEDICINES_SELECT, (calendar_id,))
                medicines = cursor.fetchall()
                t_1 = time.time()
                if not medicines:
                    return success_response(
                        message="médicaments supprimés",
                        code="MED_DELETE_SUCCESS",
                        uid=uid,
                        origin="MED_DELETE",
                        data={"medicines": []},
                        log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
                    )

                return success_response(
                    message="médicaments supprimés",
                    code="MED_DELETE_SUCCESS",
                    uid=uid,
                    origin="MED_DELETE",
                    data={"medicines": medicines},
                    log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
                )

    except Exception as e:
        return error_response(
            message="erreur lors de la suppression des médicaments",
            code="MED_DELETE_ERROR",
            status_code=500,
            uid=uid,
            origin="MED_DELETE",
            error=str(e)
        )


