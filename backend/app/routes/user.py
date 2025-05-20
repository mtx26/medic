from . import api
from flask import request
from app.utils.validators import verify_firebase_token
from app.utils.response import success_response, error_response
from app.db.connection import get_connection
from app.utils.logo_upload import upload_logo
from app.utils.messages import (
    SUCCESS_USER_INFO_FETCHED,
    ERROR_USER_INFO_FETCH,
    ERROR_USER_NOT_FOUND
)

# Route pour synchroniser les infos utilisateur avec la base de données
@api.route("/user/sync", methods=["POST"])
def handle_user_sync():
    uid = None
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        try:
            data = request.get_json()
        except Exception:
            return error_response(
                message=ERROR_USER_INFO_FETCH,
                code="USER_SYNC_ERROR",
                status_code=400,
                uid=uid,
                origin="USER_SYNC",
                error="Invalid JSON body"
            )

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
        photo_url = data.get("photo_url") or None

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE id = %s", (uid,))
                user_db = cursor.fetchone()

                if user_db:
                    updates = {}

                    if display_name and display_name != user_db["display_name"]:
                        updates["display_name"] = display_name

                    if email and email != user_db["email"]:
                        updates["email"] = email

                    if photo_url and not user_db["photo_url"]:
                        photo_url = upload_logo(photo_url, uid)
                        updates["photo_url"] = photo_url

                    if updates:
                        set_clause = ", ".join(f"{k} = %s" for k in updates)
                        values = list(updates.values()) + [uid]
                        cursor.execute(
                            f"UPDATE users SET {set_clause} WHERE id = %s",
                            values
                        )
                        conn.commit()

                    # Relecture de l'utilisateur
                    cursor.execute("SELECT * FROM users WHERE id = %s", (uid,))
                    user_db = cursor.fetchone()

                else:
                    # Upload si fourni à la création
                    if photo_url:
                        photo_url = upload_logo(photo_url, uid)

                    cursor.execute("""
                        INSERT INTO users (id, display_name, email, photo_url)
                        VALUES (%s, %s, %s, %s)
                    """, (uid, display_name, email, photo_url))
                    conn.commit()

                    cursor.execute("SELECT * FROM users WHERE id = %s", (uid,))
                    user_db = cursor.fetchone()

                return success_response(
                    message=SUCCESS_USER_INFO_FETCHED,
                    code="USER_SYNC_SUCCESS",
                    uid=uid,
                    origin="USER_SYNC",
                    data={
                        "uid": uid,
                        "display_name": user_db["display_name"],
                        "email": user_db["email"],
                        "photo_url": user_db["photo_url"]
                    }
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

