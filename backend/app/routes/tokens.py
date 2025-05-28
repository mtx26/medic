from app.utils.response import success_response, error_response, warning_response
from app.utils.validators import verify_firebase_token
from datetime import datetime, timezone
import secrets
from . import api
import time
from flask import request
from app.db.connection import get_connection
from app.services.calendar_service import generate_schedule, generate_table, verify_calendar, verify_token_owner, verify_token
from app.utils.messages import *

# Route pour récupérer tous les tokens et les informations associées
@api.route("/tokens", methods=["GET"])
def handle_tokens():
    try:
        t_0 = time.time()
        if request.method == "GET":
            user = verify_firebase_token()
            uid = user["uid"]

            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM shared_tokens WHERE owner_uid = %s", (uid,))
                    tokens_list = cursor.fetchall()
                    t_1 = time.time()

            return success_response(
                message=SUCCESS_TOKENS_FETCHED, 
                code="TOKENS_FETCH", 
                uid=uid, 
                origin="TOKENS_FETCH", 
                data={"tokens": tokens_list},
                log_extra={"time": t_1 - t_0}
            )
        
    except Exception as e:
        return error_response(
            message=ERROR_TOKENS_FETCH,
            code="TOKENS_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="TOKENS_FETCH", 
            error=str(e)
        )


# Route pour créer un lien de partage avec un token
@api.route("/tokens/<calendar_id>", methods=["POST"])
def handle_create_token(calendar_id):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        owner_uid = user["uid"]

        data = request.get_json(force=True)

        expires_at = data.get("expiresAt")
        if not expires_at:
            expires_at = None
            
        permissions = data.get("permissions")
        
        if not permissions:
            permissions = ["read"]

        verify_calendar(calendar_id, owner_uid)


        # Verifier si le calendrier est déjà partagé
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_tokens WHERE calendar_id = %s AND owner_uid = %s", (calendar_id, owner_uid))
                token = cursor.fetchone()
                if token:
                    return warning_response(
                        message=WARNING_TOKEN_ALREADY_SHARED, 
                        code="TOKEN_ALREADY_SHARED", 
                        status_code=400, 
                        uid=owner_uid, 
                        origin="TOKEN_ALREADY_SHARED", 
                        log_extra={"calendar_id": calendar_id}
                    )
                
        
                cursor.execute(
                    """
                    INSERT INTO shared_tokens (calendar_id, expires_at, permissions, revoked, owner_uid) VALUES (%s, %s, %s, %s, %s)
                    """,
                    (calendar_id, expires_at, permissions, False, owner_uid)
                )
                t_1 = time.time()

                return success_response(
                    message=SUCCESS_TOKEN_CREATED, 
                    code="TOKEN_CREATED", 
                    uid=owner_uid, 
                    origin="TOKEN_CREATE",
                    log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
                )

    except Exception as e:
        return error_response(
            message=ERROR_TOKEN_CREATE,
            code="TOKEN_CREATE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_CREATE", 
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour révoquer un token
@api.route("/tokens/revoke/<token>", methods=["POST"])
def handle_update_revoke_token(token):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        owner_uid = user["uid"]

        if not verify_token_owner(token, owner_uid):
            return warning_response(
                message=WARNING_TOKEN_NOT_AUTHORIZED, 
                code="TOKEN_NOT_AUTHORIZED", 
                status_code=403, 
                uid=owner_uid, 
                origin="TOKEN_REVOKE", 
                log_extra={"token": token}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE shared_tokens SET revoked = not revoked WHERE id = %s AND owner_uid = %s", (token, owner_uid))

                cursor.execute("SELECT revoked FROM shared_tokens WHERE id = %s AND owner_uid = %s", (token, owner_uid))
                revoked = cursor.fetchone()
                revoked = revoked.get("revoked")

                t_1 = time.time()

                return success_response(
                    message=SUCCESS_TOKEN_REVOKED if revoked else SUCCESS_TOKEN_REACTIVATED, 
                    code="TOKEN_REVOKE_SUCCESS" if revoked else "TOKEN_REACTIVATED_SUCCESS", 
                    uid=owner_uid, 
                    origin="TOKEN_REVOKE", 
                    log_extra={"token": token, "time": t_1 - t_0}
                )

    except Exception as e:
        return error_response(
            message=ERROR_TOKEN_REVOKE,
            code="TOKEN_REVOKE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_REVOKE", 
            error=str(e),
            log_extra={"token": token}
        )


# Route pour mettre à jour l'expiration d'un token
@api.route("/tokens/expiration/<token>", methods=["POST"])
def handle_update_token_expiration(token):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        owner_uid = user["uid"]

        data = request.get_json(force=True)
        expires_at = data.get("expiresAt")
        if not expires_at:
            expires_at = None

        if expires_at:
            expires_at = datetime.strptime(expires_at, "%Y-%m-%d").date()

        if not verify_token_owner(token, owner_uid):
            return warning_response(
                message=WARNING_TOKEN_NOT_AUTHORIZED, 
                code="TOKEN_NOT_AUTHORIZED", 
                status_code=403, 
                uid=owner_uid, 
                origin="TOKEN_EXPIRATION_UPDATE", 
                log_extra={"token": token}
            )
        
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE shared_tokens SET expires_at = %s WHERE id = %s AND owner_uid = %s", (expires_at, token, owner_uid))

                t_1 = time.time()

                return success_response(
                    message=SUCCESS_TOKEN_EXPIRATION_UPDATED, 
                    code="TOKEN_EXPIRATION_UPDATED", 
                    uid=owner_uid, 
                    origin="TOKEN_EXPIRATION_UPDATE", 
                    log_extra={"token": token, "time": t_1 - t_0}
                )

    except Exception as e:
        return error_response(
            message=ERROR_TOKEN_EXPIRATION_UPDATE,
            code="TOKEN_EXPIRATION_UPDATE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_EXPIRATION_UPDATE", 
            error=str(e),
            log_extra={"token": token}
        )


# Route pour mettre à jour les permissions d'un token
@api.route("/tokens/permissions/<token>", methods=["POST"])
def handle_update_token_permissions(token):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        owner_uid = user["uid"]

        data = request.get_json(force=True)

        if not verify_token_owner(token, owner_uid):
            return warning_response(
                message=WARNING_TOKEN_NOT_AUTHORIZED, 
                code="TOKEN_NOT_AUTHORIZED", 
                status_code=403, 
                uid=owner_uid, 
                origin="TOKEN_PERMISSIONS_UPDATE", 
                log_extra={"token": token}
            )
        
        permissions = data.get("permissions")

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE shared_tokens SET permissions = %s WHERE id = %s AND owner_uid = %s", (permissions, token, owner_uid))

                t_1 = time.time()

                return success_response(
                    message=SUCCESS_TOKEN_PERMISSIONS_UPDATED, 
                    code="TOKEN_PERMISSIONS_UPDATED", 
                    uid=owner_uid, 
                    origin="TOKEN_PERMISSIONS_UPDATE", 
                    log_extra={"token": token, "time": t_1 - t_0}
                )

    except Exception as e:
        return error_response(
            message=ERROR_TOKEN_PERMISSIONS_UPDATE,
            code="TOKEN_PERMISSIONS_UPDATE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_PERMISSIONS_UPDATE", 
            error=str(e),
            log_extra={"token": token}
        )


# Route pour générer un calendrier partagé pour un token
@api.route("/tokens/<token>/schedule", methods=["GET"])
def handle_generate_token_schedule(token):
    try:
        t_0 = time.time()

        start_date = request.args.get("startTime")
        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        calendar_id = verify_token(token)
        if not calendar_id:
            return warning_response(
                message=WARNING_TOKEN_INVALID, 
                code="TOKEN_INVALID", 
                status_code=404, 
                uid="unknown", 
                origin="TOKEN_GENERATE_SCHEDULE", 
                log_extra={"token": token}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
                calendar = cursor.fetchone()
                if not calendar:
                    return warning_response(
                        message=WARNING_CALENDAR_NOT_FOUND, 
                        code="CALENDAR_NOT_FOUND", 
                        status_code=404, 
                        uid="unknown", 
                        origin="TOKEN_GENERATE_SCHEDULE", 
                        log_extra={"token": token}
                    )
                calendar_name = calendar.get("name")

                cursor.execute("SELECT * FROM medicines WHERE calendar_id = %s", (calendar_id,))
                medicines = cursor.fetchall()
                t_1 = time.time()
                if not medicines:
                    return success_response(
                        message=SUCCESS_CALENDAR_GENERATED, 
                        code="CALENDAR_GENERATED_SUCCESS", 
                        uid="unknown", 
                        origin="TOKEN_GENERATE_SCHEDULE", 
                        data={"medicines": 0, "schedule": [], "calendar_name": calendar_name, "table": {}},
                        log_extra={"token": token, "time": t_1 - t_0}
                    )

                t_2 = time.time()
                schedule = generate_schedule(start_date, medicines)
                t_3 = time.time()
                table = generate_table(start_date, medicines)
                t_4 = time.time()

                return success_response(
                    message=SUCCESS_CALENDAR_GENERATED, 
                    code="CALENDAR_GENERATED_SUCCESS", 
                    uid="unknown",
                    origin="TOKEN_GENERATE_SCHEDULE", 
                    data={"medicines": len(medicines), "schedule": schedule, "calendar_name": calendar_name, "table": table},
                    log_extra={"token": token, "time": t_4 - t_0, "time_medicines": t_2 - t_0, "time_schedule": t_3 - t_2, "time_table": t_4 - t_3}
                )

    except Exception as e:
        return error_response(
            message=ERROR_TOKEN_GENERATE,
            code="CALENDAR_TOKEN_GENERATE_ERROR", 
            status_code=500, 
            uid="unknown", 
            origin="TOKEN_GENERATE_SCHEDULE", 
            error=str(e),
            log_extra={"token": token}
        )

# Route pour obtenir les métadonnées d’un token public
@api.route("/tokens/<token>", methods=["GET"])
def get_token_metadata(token):
    try:
        t_0 = time.time()
        if not verify_token(token):
            return warning_response(
                message=WARNING_TOKEN_INVALID,
                code="TOKEN_INVALID",
                status_code=404,
                uid="unknown",
                origin="TOKEN_METADATA_LOAD",
                log_extra={"token": token}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_tokens WHERE id = %s", (token,))
                token_data = cursor.fetchone()
                if not token_data:
                    return warning_response(
                        message=WARNING_TOKEN_NOT_FOUND, 
                        code="TOKEN_NOT_FOUND", 
                        status_code=404, 
                        uid="unknown", 
                        origin="TOKEN_METADATA_LOAD", 
                        log_extra={"token": token}
                    )

                calendar_id = token_data.get("calendar_id")
                owner_uid = token_data.get("owner_uid")

                t_1 = time.time()

                return success_response(
                    message=SUCCESS_TOKEN_METADATA_FETCHED,
                    code="TOKEN_METADATA_SUCCESS",
                    origin="TOKEN_METADATA_FETCH",
                    uid="unknown",
                    data={"calendar_id": calendar_id, "owner_uid": owner_uid, "time": t_1 - t_0},
                    log_extra={"token": token, "time": t_1 - t_0}
                )

    except Exception as e:
        return error_response(
            message=ERROR_TOKEN_METADATA_FETCH,
            code="TOKEN_METADATA_ERROR",
            status_code=500,
            error=str(e),
            origin="TOKEN_METADATA_FETCH",
            uid="unknown",
            log_extra={"token": token}
        )


# Route pour supprimer un token
@api.route("/tokens/<token>", methods=["DELETE"])
def handle_delete_token(token):
    try:
        t_0 = time.time()
        user = verify_firebase_token()
        owner_uid = user["uid"]

        if not verify_token_owner(token, owner_uid):
            return warning_response(
                message=WARNING_TOKEN_NOT_FOUND, 
                code="TOKEN_NOT_FOUND", 
                status_code=404, 
                uid=owner_uid, 
                origin="TOKEN_DELETE", 
                log_extra={"token": token}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM shared_tokens WHERE id = %s", (token,))
                t_1 = time.time()   

                return success_response(
                    message=SUCCESS_TOKEN_DELETED, 
                    code="TOKEN_DELETE_SUCCESS", 
                    uid=owner_uid, 
                    origin="TOKEN_DELETE", 
                    log_extra={"token": token, "time": t_1 - t_0}
                )

    except Exception as e:
        return error_response(
            message=ERROR_TOKEN_DELETE,
            code="TOKEN_DELETE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_DELETE", 
            error=str(e),
            log_extra={"token": token}
        )