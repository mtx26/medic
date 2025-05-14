from . import api
from auth import verify_firebase_token
from supabase_client import supabase
from response import success_response, error_response
from flask import request

@api.route("/api/userinfo", methods=["GET"])
def get_user_info():
    try:
        uid, token = verify_firebase_token()
        uid = user["uid"]

        # Requête vers Supabase pour récupérer l'utilisateur
        response = supabase.table("users").select("*").eq("id", uid).single().execute()
        data = response.data or {}

        return success_response(
            message="Infos utilisateur récupérées",
            code="USERINFO_SUCCESS",
            uid=uid,
            origin="USERINFO_FETCH",
            data={"user": data}
        )
    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération des infos utilisateur.",
            code="USERINFO_ERROR",
            status_code=500,
            error=str(e)
        )


@api.route("/api/user/sync", methods=["POST"])
def sync_user():
    try:
        uid, token = verify_firebase_token()
        uid = user["uid"]

        data = request.get_json(force=True)
        display_name = data.get("displayName")
        email = data.get("email")
        photo_url = data.get("photoURL")

        # Vérifie si l'utilisateur existe déjà
        existing = supabase.table("users").select("id").eq("id", uid).execute()
        if existing.data:
            # Mise à jour si déjà présent
            supabase.table("users").update({
                "display_name": display_name,
                "email": email,
                "photo_url": photo_url,
            }).eq("id", uid).execute()
        else:
            # Création sinon
            supabase.table("users").insert({
                "id": uid,
                "display_name": display_name,
                "email": email,
                "photo_url": photo_url,
                "role": "user"
            }).execute()

        return success_response(
            message="Utilisateur synchronisé avec succès",
            code="USER_SYNC_SUCCESS",
            uid=uid,
            origin="USER_SYNC",
            data={"user": data}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la synchronisation utilisateur.",
            code="USER_SYNC_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"received": request.get_json(force=True)}
        )

