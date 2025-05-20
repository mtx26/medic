from . import api
from flask import request
from app.utils.validators import verify_firebase_token
from firebase_admin import firestore
from app.utils.response import success_response, error_response
from app.db.connection import get_connection
from app.utils.messages import (
    SUCCESS_USER_INFO_FETCHED,
    ERROR_USER_INFO_FETCH,
    ERROR_USER_NOT_FOUND
)

# Route pour synchroniser les infos utilisateur avec la base de données
@api.route("/user/sync", methods=["POST"])
def handle_user_sync():
    try:
        user = verify_firebase_token()
        uid = user["uid"]
        data = request.get_json(force=True)

        if not data:
            return error_response(
                message=ERROR_USER_INFO_FETCH,
                code="USER_SYNC_ERROR",
                status_code=400,
                uid=uid,
                origin="USER_SYNC"
            )
        display_name = data.get("display_name")
        email = data.get("email")
        photo_url = data.get("photo_url") or ""

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO users (id, display_name, email, photo_url)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        display_name = EXCLUDED.display_name,
                        email = EXCLUDED.email,
                        photo_url = EXCLUDED.photo_url
                """, (uid, display_name, email, photo_url))

        return success_response(
            message=SUCCESS_USER_INFO_FETCHED,
            code="USER_SYNC_SUCCESS",
            uid=uid,
            origin="USER_SYNC"
        )


    except Exception as e:
        return error_response(
            message=ERROR_USER_INFO_FETCH,
            code="USER_SYNC_ERROR",
            status_code=500,
            uid=uid,
            origin="USER_SYNC",
            error=str(e),
        )

