from flask import request
from app.utils.validators import verify_firebase_token
from datetime import datetime, timezone, timedelta
from . import api
import time
from app.db.connection import get_connection
from app.services.calendar_service import verify_token
from app.utils.response import success_response, error_response, warning_response
from app.utils.messages import (
    WARNING_TOKEN_INVALID,
    SUCCESS_MEDICINES_FETCHED,
    ERROR_MEDICINES_FETCH,
)


# Route pour obtenir les médicaments d’un token public
@api.route("/tokens/<token>/medicines", methods=["GET"])
def handle_token_medicines(token):
    try:
        t_0 = time.time()
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
                t_1 = time.time()

        return success_response(
            message=SUCCESS_MEDICINES_FETCHED,
            code="MEDICINES_SHARED_LOADED",
            origin="TOKEN_MEDICINES_LOAD",
            data={"medicines": medicines},
            log_extra={"token": token, "time": t_1 - t_0}
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
