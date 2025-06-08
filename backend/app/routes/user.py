from . import api
from flask import request, g
from app.utils.validators import require_auth
from app.utils.response import success_response, error_response
from app.services.user import fetch_user, update_existing_user, insert_new_user
import time
from app.utils.logo_upload import upload_logo
from app.db.connection import get_connection

@api.route("/user/sync", methods=["POST"])
@require_auth
def handle_user_sync():
    uid = None
    try:
        t_0 = time.time()
        uid = g.uid

        try:
            user_data = request.get_json()
        except Exception:
            return error_response(
                message="erreur lors de la récupération des données de l'utilisateur",
                code="USER_SYNC_ERROR",
                status_code=400,
                uid=uid,
                origin="USER_SYNC",
                error="Invalid JSON body"
            )

        if not user_data:
            return error_response(
                message="erreur lors de la récupération des données de l'utilisateur",
                code="USER_SYNC_ERROR",
                status_code=400,
                uid=uid,
                origin="USER_SYNC"
            )

        display_name = user_data.get("display_name")
        email = user_data.get("email")
        photo_url = user_data.get("photo_url") or None
        email_enabled = user_data.get("email_enabled")
        push_enabled = user_data.get("push_enabled")

        user_db = fetch_user(uid)
        t_1 = time.time()
        
        if user_db:
            updated_user = update_existing_user(uid, user_db, display_name, email, photo_url, email_enabled, push_enabled)
        else:
            updated_user = insert_new_user(uid, display_name, email, photo_url, email_enabled, push_enabled)
        
        t_2 = time.time()

        return success_response(
            message="données de l'utilisateur mises à jour",
            code="USER_SYNC_SUCCESS",
            uid=uid,
            origin="USER_SYNC",
            data={"uid": uid, **updated_user, "time": t_2 - t_0, "time_update": t_2 - t_1}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la mise à jour des données de l'utilisateur",
            code="USER_SYNC_ERROR",
            status_code=500,
            uid=uid,
            origin="USER_SYNC",
            error=str(e),
        )

@api.route("/user/photo", methods=["POST"])
@require_auth
def handle_user_photo():
    uid = None
    try:
        t_0 = time.time()
        uid = g.uid

        photo = request.files.get("photo")
        if not photo:
            return error_response(
                message="erreur lors de la récupération de la photo de l'utilisateur",
                code="USER_PHOTO_ERROR",
                status_code=400,
                uid=uid,
                origin="USER_PHOTO"
            )

        photo_url = upload_logo(photo)
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE users SET photo_url = %s WHERE id = %s",
                    (photo_url, uid)
                )
                conn.commit()

        return success_response(
            message="photo de l'utilisateur mise à jour",
            code="USER_PHOTO_SUCCESS",
            uid=uid,
            origin="USER_PHOTO",
            data={"uid": uid, "photo_url": photo_url, "time": time.time() - t_0}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la mise à jour de la photo de l'utilisateur",
            code="USER_PHOTO_ERROR",
            status_code=500,
            uid=uid,
            origin="USER_PHOTO",
            error=str(e),
        )