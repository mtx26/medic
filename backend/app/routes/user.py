from . import api
from flask import request
from app.utils.validators import verify_firebase_token
from app.utils.response import success_response, error_response
from app.utils.messages import SUCCESS_USER_INFO_FETCHED, ERROR_USER_NOT_FOUND
from app.services.user import fetch_user, update_existing_user, insert_new_user
import time

@api.route("/user/sync", methods=["POST"])
def handle_user_sync():
    uid = None
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        uid = user["uid"]


        try:
            user_data = request.get_json()
        except Exception:
            return error_response(
                message=ERROR_USER_NOT_FOUND,
                code="USER_SYNC_ERROR",
                status_code=400,
                uid=uid,
                origin="USER_SYNC",
                error="Invalid JSON body"
            )

        if not user_data:
            return error_response(
                message=ERROR_USER_NOT_FOUND,
                code="USER_SYNC_ERROR",
                status_code=400,
                uid=uid,
                origin="USER_SYNC"
            )

        display_name = user_data.get("display_name")
        email = user_data.get("email")
        photo_url = user_data.get("photo_url") or None

        user_db = fetch_user(uid)
        t_1 = time.time()
        
        if user_db:
            updated_user = update_existing_user(uid, user_db, display_name, email, photo_url)
        else:
            updated_user = insert_new_user(uid, display_name, email, photo_url)
        
        t_2 = time.time()

        return success_response(
            message=SUCCESS_USER_INFO_FETCHED,
            code="USER_SYNC_SUCCESS",
            uid=uid,
            origin="USER_SYNC",
            data={"uid": uid, **updated_user, "time": t_2 - t_0, "time_update": t_2 - t_1}
        )

    except Exception as e:
        return error_response(
            message=ERROR_USER_NOT_FOUND,
            code="USER_SYNC_ERROR",
            status_code=500,
            uid=uid,
            origin="USER_SYNC",
            error=str(e),
        )
