from flask import request
from app.utils.validators import verify_firebase_token
from datetime import datetime, timezone, timedelta
from . import api
from app.db.connection import get_connection
from app.services.calendar_service import verify_token
from app.utils.response import success_response, error_response, warning_response
from app.utils.messages import (
    WARNING_TOKEN_INVALID,
    WARNING_TOKEN_EXPIRED,
    WARNING_TOKEN_REVOKED,
    WARNING_TOKEN_NO_READ_PERMISSION,
    WARNING_CALENDAR_NOT_FOUND,
    SUCCESS_MEDICINES_FETCHED,
    ERROR_MEDICINES_FETCH,
)

# Route pour obtenir les médicaments d’un token public
@api.route("/tokens/<token>/medicines", methods=["GET"])
def handle_token_medicines(token):
    try:
        calendar_id = verify_token(token)
        if not calendar_id:
            return warning_response(
                message=WARNING_TOKEN_INVALID,
                code="TOKEN_INVALID",
                status_code=404,
                uid="unknown",
                origin="TOKEN_MEDICINES_LOAD",
                log_extra={"token": token}
            )
            

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM medicines WHERE calendar_id = %s", (calendar_id,))
                medicines = cursor.fetchall()

        return success_response(
            message=SUCCESS_MEDICINES_FETCHED,
            code="MEDICINES_SHARED_LOADED",
            origin="TOKEN_MEDICINES_LOAD",
            data={"medicines": medicines},
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message=ERROR_MEDICINES_FETCH,
            code="MEDICINES_SHARED_ERROR",
            status_code=500,
            error=str(e),
            origin="TOKEN_MEDICINES_LOAD",
            log_extra={"token": token}
        )
