from app.db.connection import get_connection
from app.utils.logo_upload import upload_logo

def fetch_user(uid):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE id = %s", (uid,))
            return cursor.fetchone()

def update_existing_user(uid, user_db, display_name, email, photo_url):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            updates = {}

            if display_name and display_name != user_db["display_name"]:
                updates["display_name"] = display_name
            if email and email != user_db["email"]:
                updates["email"] = email
            if photo_url and not user_db["photo_url"]:
                photo_url_uploaded = upload_logo(photo_url)
                updates["photo_url"] = photo_url_uploaded

            if updates:
                set_clause = ", ".join(f"{k} = %s" for k in updates)
                values = list(updates.values()) + [uid]
                cursor.execute(f"UPDATE users SET {set_clause} WHERE id = %s", values)
                conn.commit()

            return fetch_user(uid)

def insert_new_user(uid, display_name, email, photo_url):
    if photo_url:
        photo_url = upload_logo(photo_url)

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (id, display_name, email, photo_url)
                VALUES (%s, %s, %s, %s)
                """,
                (uid, display_name, email, photo_url)
            )
            conn.commit()

            return fetch_user(uid)