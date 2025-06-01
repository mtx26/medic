from flask import request
from app.utils.validators import verify_firebase_token
from . import api
from app.utils.response import success_response, error_response, warning_response
from app.db.connection import get_connection
from app.services.calendar_service import verify_calendar_share
from app.services.medicines import update_medicines, get_boxes, update_box, create_box, delete_box
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

# Route pour récupérer les boites de médicaments d'un calendrier
@api.route("/shared/users/calendars/<calendar_id>/boxes", methods=["GET"])
def handle_shared_boxes(calendar_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        receiver_uid = user["uid"]

        if not verify_calendar_share(calendar_id, receiver_uid):
            return warning_response(
                message=ERROR_CALENDAR_NOT_FOUND,
                code="SHARED_USER_CALENDAR_BOXES_LOAD_ERROR",
                status_code=404,
                uid=receiver_uid,
                origin="SHARED_USER_CALENDAR_BOXES_LOAD",
                log_extra={"calendar_id": calendar_id}
            )

        boxes = get_boxes(calendar_id)
        t_1 = time.time()

        return success_response(
            message="boites de médicaments récupérées",
            code="MEDICINE_BOXES_FETCHED",
            uid=receiver_uid,
            origin="GET_MEDICINE_BOXES",
            data={"boxes": boxes},
            log_extra={"time": t_1 - t_0, "calendar_id": calendar_id, "boxes_count": len(boxes)}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des boites de médicaments",
            code="GET_MEDICINE_BOXES_ERROR",
            status_code=500,
            uid=receiver_uid,
            origin="GET_MEDICINE_BOXES",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour modifier une boite de médicaments
@api.route("/shared/users/calendars/<calendar_id>/boxes/<box_id>", methods=["PUT"])
def handle_update_shared_box(calendar_id, box_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]
        data = request.get_json()

        if not data or not verify_calendar_share(calendar_id, uid):
            return warning_response(
                message="champs requis manquants",
                code="MISSING_REQUIRED_FIELDS",
                status_code=400,
                uid=uid,
                origin="UPDATE_MEDICINE_BOX",
                log_extra={"calendar_id": calendar_id, "box_id": box_id}
            )

        update_box(box_id, calendar_id, data)

        t_1 = time.time()
        return success_response(
            message="boite de médicaments modifiée",
            code="MEDICINE_BOX_UPDATED",
            uid=uid,
            origin="UPDATE_MEDICINE_BOX",
            log_extra={"time": t_1 - t_0, "calendar_id": calendar_id, "box_id": box_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la modification de la boite de médicaments",
            code="UPDATE_MEDICINE_BOX_ERROR",
            status_code=500,
            uid=uid,
            origin="UPDATE_MEDICINE_BOX",
            error=str(e),
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )

# Route pour créer une boite de médicaments
@api.route("/shared/users/calendars/<calendar_id>/boxes", methods=["POST"])
def handle_create_shared_box(calendar_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]

        data = request.get_json()

        if not data or not verify_calendar_share(calendar_id, uid):
            return warning_response(
                message="champs requis manquants",
                code="MISSING_REQUIRED_FIELDS",
                status_code=400,
                uid=uid,
                origin="CREATE_MEDICINE_BOX",
                log_extra={"calendar_id": calendar_id}
            )

        box_id = create_box(calendar_id, data)
        t_1 = time.time()

        return success_response(
            message="boite de médicaments créée",
            code="MEDICINE_BOX_CREATED",
            uid=uid,
            origin="CREATE_MEDICINE_BOX",
            data={"box_id": box_id},
            log_extra={"time": t_1 - t_0, "calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la création de la boite de médicaments",
            code="CREATE_MEDICINE_BOX_ERROR",
            status_code=500,
            uid=uid,
            origin="CREATE_MEDICINE_BOX",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

# Route pour supprimer une boite de médicaments
@api.route("/shared/users/calendars/<calendar_id>/boxes/<box_id>", methods=["DELETE"])
def handle_delete_shared_box(calendar_id, box_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]

        delete_box(box_id, calendar_id)
        t_1 = time.time()

        return success_response(
            message="boite de médicaments supprimée",
            code="MEDICINE_BOX_DELETED",
            uid=uid,
            origin="DELETE_MEDICINE_BOX",
            log_extra={"time": t_1 - t_0, "calendar_id": calendar_id, "box_id": box_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la suppression de la boite de médicaments",
            code="DELETE_MEDICINE_BOX_ERROR",
            status_code=500,
            uid=uid,
            origin="DELETE_MEDICINE_BOX",
            error=str(e),
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )
