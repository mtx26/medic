from flask import request, g
from app.utils.validators import require_auth
from . import api
from app.utils.response import success_response, error_response, warning_response
from app.services.verifications import verify_calendar_share
from app.services.medicines import get_boxes, update_box, create_box, delete_box
import time
from app.services.pillulier import use_pillulier

ERROR_CALENDAR_NOT_FOUND = "calendrier non trouvé"

# Route pour récupérer les boites de médicaments d'un calendrier
@api.route("/shared/users/calendars/<calendar_id>/boxes", methods=["GET"])
@require_auth
def handle_shared_boxes(calendar_id):
    try:
        t_0 = time.time()
        receiver_uid = g.uid

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
@require_auth
def handle_update_shared_box(calendar_id, box_id):
    try:
        t_0 = time.time()
        uid = g.uid
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
@require_auth
def handle_create_shared_box(calendar_id):
    try:
        t_0 = time.time()
        uid = g.uid

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
@require_auth
def handle_delete_shared_box(calendar_id, box_id):
    try:
        t_0 = time.time()
        uid = g.uid

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

@api.route("/shared/users/calendars/<calendarId>/pilluliers/used", methods=["POST"])
@require_auth
def handle_use_shared_users_pillulier(calendarId):
    try:   
        t_0 = time.time()
        uid = g.uid
        if not verify_calendar_share(calendarId, uid):
            return warning_response(
                message="calendrier non trouvé",
                code="SHARED_USER_CALENDAR_NOT_FOUND",
                status_code=404,
                uid=uid,
                origin="SHARED_USER_USE_PILLULIER",
                log_extra={"calendar_id": calendarId}
            )
        
        result = use_pillulier(calendarId)
        if not result:
            return warning_response(
                message="erreur lors de l'utilisation du pilulier",
                code="USE_PILLULIER_ERROR",
                status_code=500,
                uid=uid,
                origin="SHARED_USER_USE_PILLULIER",
                log_extra={"calendar_id": calendarId}
            )
        t_1 = time.time()
        return success_response(
            message="pilulier utilisé avec succès",
            code="PILLULIER_USED",
            uid=uid,
            origin="SHARED_USER_USE_PILLULIER",
            log_extra={"time": t_1 - t_0, "calendar_id": calendarId}
        )
    except Exception as e:  
        return error_response(
            message="erreur lors de l'utilisation du pilulier",
            code="USE_PILLULIER_ERROR",
            status_code=500,
            uid=uid,
            origin="SHARED_USER_USE_PILLULIER",
            error=str(e),
            log_extra={"calendar_id": calendarId}
        )
        


