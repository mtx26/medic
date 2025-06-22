from . import api
from app.utils.validators import require_auth
from datetime import datetime, timezone
from flask import request, g, Response
from app.db.connection import get_connection
from app.services.calendar_service import generate_calendar_schedule
from app.services.verifications import verify_calendar
import time
from app.utils.response import success_response, error_response, warning_response
from app.utils.logger import log_backend
from app.services.pdf import generate_medicine_conditions_pdf
from app.utils.validators import decode_token
import base64

ERROR_CALENDAR_NOT_FOUND = "calendrier non trouvé"

# Route pour récupérer les calendriers de l'utilisateur
@api.route("/calendars", methods=["GET"])
@require_auth
def handle_calendars():
    try:
        t_0 = time.time()
        uid = g.uid
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE owner_uid = %s", (uid,))
                calendars = cursor.fetchall()

                if calendars is None:
                    return warning_response(
                        message=ERROR_CALENDAR_NOT_FOUND, 
                        code="CALENDAR_FETCH_ERROR", 
                        status_code=404, 
                        uid=uid, 
                        origin="CALENDAR_FETCH", 
                    )
                for calendar in calendars:
                    cursor.execute("SELECT COUNT(*) FROM medicine_boxes WHERE calendar_id = %s", (calendar["id"],))
                    boxes_count = cursor.fetchone()
                    calendar["boxes_count"] = boxes_count.get("count", 0) if boxes_count else 0


        t_1 = time.time()
        return success_response(
            message="calendriers récupérés", 
            code="CALENDAR_FETCH_SUCCESS", 
            uid=uid, 
            origin="CALENDAR_FETCH", 
            data={"calendars": calendars},
            log_extra={"time": t_1 - t_0}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des calendriers", 
            code="CALENDAR_FETCH_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="CALENDAR_FETCH", 
            error=str(e)
        )


# Route pour créer un calendrier
@api.route("/calendars", methods=["POST"])
@require_auth
def handle_create_calendar():
    try:
        t_0 = time.time()
        uid = g.uid
        print(uid)
        calendar_name = request.json.get("calendarName")

        if not calendar_name:
            return warning_response(
                message="nom de calendrier manquant", 
                code="CALENDAR_CREATE_ERROR", 
                status_code=400, 
                uid=uid, 
                origin="CALENDAR_CREATE", 
                log_extra={"calendar_name": calendar_name}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("INSERT INTO calendars (owner_uid, name) VALUES (%s, %s)", (uid, calendar_name))
                conn.commit()
        t_1 = time.time()
        return success_response(
            message="calendrier créé", 
            code="CALENDAR_CREATE", 
            uid=uid, 
            origin="CALENDAR_CREATE", 
            log_extra={"calendar_name": calendar_name, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la création du calendrier", 
            code="CALENDAR_CREATE_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="CALENDAR_CREATE", 
            error=str(e)
        )


# Route pour supprimer un calendrier
@api.route("/calendars", methods=["DELETE"])
@require_auth
def handle_delete_calendar():
    try:
        t_0 = time.time()
        uid = g.uid
        calendar_id = request.json.get("calendarId")

        if not calendar_id or not verify_calendar(calendar_id, uid):
            return warning_response(
                message="identifiant de calendrier invalide", 
                code="CALENDAR_DELETE_ERROR", 
                status_code=400, 
                uid=uid, 
                origin="CALENDAR_DELETE_ERROR", 
                log_extra={"calendar_id": calendar_id}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
                calendar = cursor.fetchone()
                t_1 = time.time()
                if calendar is None:
                    return warning_response(
                        message=ERROR_CALENDAR_NOT_FOUND, 
                        code="CALENDAR_DELETE_ERROR", 
                        status_code=404, 
                        uid=uid, 
                        origin="CALENDAR_DELETE_ERROR", 
                        log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
                    )

                cursor.execute("DELETE FROM calendars WHERE id = %s", (calendar_id,))
                conn.commit()
        t_2 = time.time()
        return success_response(
            message="calendrier supprimé", 
            code="CALENDAR_DELETE_SUCCESS", 
            uid=uid, 
            origin="CALENDAR_DELETE", 
            log_extra={"calendar_id": calendar_id, "time": t_2 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la suppression du calendrier", 
            code="CALENDAR_DELETE_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="CALENDAR_DELETE", 
            error=str(e)
        )


# Route pour renommer un calendrier
@api.route("/calendars", methods=["PUT"])
@require_auth
def handle_rename_calendar():
    try:
        t_0 = time.time()
        uid = g.uid
        data = request.get_json(force=True)
        calendar_id = data.get("calendarId")
        new_calendar_name = data.get("newCalendarName")

        if not verify_calendar(calendar_id, uid):
            return warning_response(
                message="accès refusé", 
                code="ACCESS_DENIED", 
                status_code=400, 
                uid=uid, 
                origin="CALENDAR_RENAME", 
                log_extra={"calendar_id": calendar_id, "new_calendar_name": new_calendar_name}
            )

        if not new_calendar_name:
            return warning_response(
                message="nom de calendrier manquant", 
                code="CALENDAR_RENAME_ERROR", 
                status_code=400, 
                uid=uid, 
                origin="CALENDAR_RENAME", 
                log_extra={"calendar_id": calendar_id, "new_calendar_name": new_calendar_name}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT name FROM calendars WHERE id = %s", (calendar_id,))
                result = cursor.fetchone()

                if result is None:
                    return warning_response(
                        message=ERROR_CALENDAR_NOT_FOUND, 
                        code="CALENDAR_RENAME_ERROR", 
                        status_code=404, 
                        uid=uid, 
                        origin="CALENDAR_RENAME", 
                        log_extra={"calendar_id": calendar_id, "new_calendar_name": new_calendar_name})

                old_name = result['name']

                if new_calendar_name == old_name:
                    return warning_response(
                        message="le nom de calendrier est déjà le même", 
                        code="CALENDAR_RENAME_ERROR", 
                        status_code=400, 
                        uid=uid, 
                        origin="CALENDAR_RENAME", 
                        log_extra={"calendar_id": calendar_id, "old_calendar_name": old_name, "new_calendar_name": new_calendar_name}
                    )
                cursor.execute(
                    "UPDATE calendars SET name = %s WHERE id = %s",
                    (new_calendar_name, calendar_id)
                )
                conn.commit()

        t_1 = time.time()
        return success_response(
            message="calendrier renommé", 
            code="CALENDAR_RENAME_SUCCESS", 
            uid=uid, 
            origin="CALENDAR_RENAME", 
            log_extra={"calendar_id": calendar_id, "old_calendar_name": old_name, "new_calendar_name": new_calendar_name, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la renommation du calendrier", 
            code="CALENDAR_RENAME_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="CALENDAR_RENAME", 
            error=str(e))
  

# Route pour générer le calendrier 
@api.route("/calendars/<calendar_id>/schedule", methods=["GET"])
@require_auth
def handle_calendar_schedule(calendar_id):
    try:
        t_0 = time.time()
        owner_uid = g.uid

        start_date = request.args.get("startTime")
        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        if not verify_calendar(calendar_id, owner_uid):
            return warning_response(
                message="accès refusé", 
                code="ACCESS_DENIED", 
                status_code=400, 
                uid=owner_uid, 
                origin="CALENDAR_GENERATE", 
                log_extra={"calendar_id": calendar_id}
            )

        schedule, table, calendar_name = generate_calendar_schedule(calendar_id, start_date)

        t_1 = time.time()

        return success_response(
            message="calendrier généré", 
            code="CALENDAR_GENERATE_SUCCESS", 
            uid=owner_uid, 
            origin="CALENDAR_GENERATE", 
            data={"schedule": schedule, "table": table, "calendar_name": calendar_name},
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la génération du calendrier", 
            code="CALENDAR_GENERATE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="CALENDAR_GENERATE", 
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

@api.route("/calendars/<calendar_id>/pdf", methods=["GET"])
def download_pdf_calendar(calendar_id):
    try:
        t_0 = time.time()
        token = request.args.get("token")
        if not token:
            return error_response(
                message="token manquant",
                code="MISSING_TOKEN",
                status_code=400,
                origin="PDF_DOWNLOAD"
            )

        user = decode_token(token)
        if not user:
            return warning_response(
                message="accès refusé", 
                code="ACCESS_DENIED", 
                status_code=400, 
                origin="PDF_DOWNLOAD", 
                log_extra={"calendar_id": calendar_id}
            )
        uid = user.get("sub")
        if not verify_calendar(calendar_id, uid):
            return warning_response(
                message="accès refusé", 
                code="ACCESS_DENIED", 
                status_code=400, 
                origin="PDF_DOWNLOAD", 
                log_extra={"calendar_id": calendar_id}
            )

        if not calendar_id:
            return error_response(
                message="calendar_id manquant",
                code="MISSING_CALENDAR_ID",
                status_code=400,
                origin="PDF_DOWNLOAD"
            )

        # Génère le PDF en mémoire
        pdf_buffer = generate_medicine_conditions_pdf(calendar_id)
        t_1 = time.time()

        # Log facultatif
        log_backend.info("PDF généré avec succès", {
            "origin": "PDF_DOWNLOAD",
            "uid": uid,
            "code": "PDF_DOWNLOAD_SUCCESS",
            "time": round(t_1 - t_0, 3),
        })

        return Response(
            pdf_buffer.getvalue(),
            mimetype="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=calendrier_{calendar_id[:8]}.pdf",
                "Content-Type": "application/pdf"
            }
        )
    except Exception as e:
        return error_response(
            message="Erreur lors du téléchargement du PDF",
            code="PDF_DOWNLOAD_ERROR_CALENDAR",
            status_code=500,
            origin="PDF_DOWNLOAD",
            error=str(e)
        )
