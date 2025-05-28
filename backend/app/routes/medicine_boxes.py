from app.db.connection import get_connection
from app.utils.response import success_response, warning_response, error_response
from app.utils.validators import verify_firebase_token
from app.utils.messages import *
from flask import request
import time
from . import api

# Route pour récupérer les boites de médicaments d'un calendrier
@api.route("/medicine_boxes", methods=["GET"])
def get_medicine_boxes():
    try:
        t_0 = time.time()
        uid = verify_firebase_token()

        data = request.get_json()
        calendar_id = data.get("calendar_id")

        if not calendar_id:
            return error_response(
                message=ERROR_MEDICINE_BOXES_FETCH,
                code="MEDICINE_BOXES_FETCH_ERROR",
                status_code=400,
                uid=uid,
                origin="GET_MEDICINE_BOXES",
            )
        
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM medicine_boxes WHERE calendar_id = %s", (calendar_id,))
                medicine_boxes = cur.fetchall()
                t_1 = time.time()

        return success_response(
            message=SUCCESS_MEDICINE_BOXES_FETCHED,
            code="MEDICINE_BOXES_FETCHED",
            uid=uid,
            origin="GET_MEDICINE_BOXES",
            data={"medicine_boxes": medicine_boxes},
            log_extra={"time": t_1 - t_0, "calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message=ERROR_MEDICINE_BOXES_FETCH,
            code="GET_MEDICINE_BOXES_ERROR",
            status_code=500,
            uid=uid,
            origin="GET_MEDICINE_BOXES",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

# Route pour créer une boite de médicaments
@api.route("/medicine_boxes", methods=["POST"])
def create_medicine_box():
    try:
        t_0 = time.time()
        uid = verify_firebase_token()

        data = request.get_json()
        calendar_id = data.get("calendar_id")
        name = data.get("name")
        stock_quantity = data.get("stock_quantity")

        if not calendar_id or not name or not stock_quantity:
            return error_response(
                message=ERROR_MEDICINE_BOX_CREATE,
                code="MISSING_REQUIRED_FIELDS",
                status_code=400,
                uid=uid,
                origin="CREATE_MEDICINE_BOX",
            )

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO medicine_boxes (calendar_id, name, stock_quantity) VALUES (%s, %s, %s)", (calendar_id, name, stock_quantity))
                conn.commit()
                t_1 = time.time()
        return success_response(
            message=SUCCESS_MEDICINE_BOX_CREATED,
            code="MEDICINE_BOX_CREATED",
            uid=uid,
            origin="CREATE_MEDICINE_BOX",
            log_extra={"time": t_1 - t_0, "calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message=ERROR_MEDICINE_BOX_CREATE,
            code="CREATE_MEDICINE_BOX_ERROR",
            status_code=500,
            uid=uid,
            origin="CREATE_MEDICINE_BOX",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

