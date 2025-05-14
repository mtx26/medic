from . import api
from auth import verify_firebase_token
from datetime import datetime, timezone
from flask import request
from function import generate_schedule, generate_table
from response import success_response, error_response, warning_response
from supabase_client import supabase, supabase_with_token
import secrets
from firebase_admin import firestore, auth


# Route pour récupérer les calendriers de l'utilisateur
@api.route("/api/calendars", methods=["GET"])
def handle_calendars():
    try:
        user, token = verify_firebase_token()
        uid = user["uid"]

        response = supabase_with_token(token).table("calendars").select("id, name").execute()
        calendars = response.data or []

        return success_response(
            message="Calendriers récupérés avec succès" if calendars else "Aucun calendrier trouvé",
            code="CALENDAR_FETCH_SUCCESS" if calendars else "CALENDAR_FETCH_EMPTY",
            uid=uid,
            origin="CALENDAR_FETCH",
            data={"calendars": calendars}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération des calendriers.",
            code="CALENDAR_FETCH_ERROR",
            status_code=500,
            uid=uid,
            origin="CALENDAR_FETCH",
            error=str(e)
        )


# Route pour créer un calendrier
@api.route("/api/calendars", methods=["POST"])
def handle_create_calendar():
    try:
        user, token = verify_firebase_token()
        uid = user["uid"]
        calendar_name = request.json.get("calendarName")

        if not calendar_name:
            return warning_response(
                message="Nom de calendrier manquant.",
                code="CALENDAR_CREATE_ERROR",
                status_code=400,
                uid=uid,
                origin="CALENDAR_CREATE",
                log_extra={"calendar_name": calendar_name}
            )

        response = supabase.table("calendars").insert({
            "owner_uid": uid,
            "name": calendar_name,
        }).execute()

        return success_response(
            message="Calendrier créé avec succès",
            code="CALENDAR_CREATE",
            uid=uid,
            origin="CALENDAR_CREATE",
            log_extra={"calendar_name": calendar_name}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la création du calendrier.",
            code="CALENDAR_CREATE_ERROR",
            status_code=500,
            uid=uid,
            origin="CALENDAR_CREATE",
            error=str(e)
        )


# Route pour supprimer un calendrier
@api.route("/api/calendars", methods=["DELETE"])
def handle_delete_calendar():
    try:
        user, token = verify_firebase_token()
        uid = user["uid"]
        calendar_id = request.json.get("calendarId")

        if not calendar_id:
            return warning_response(
                message="Identifiant de calendrier manquant.",
                code="CALENDAR_DELETE_ERROR",
                status_code=400,
                uid=uid,
                origin="CALENDAR_DELETE",
                log_extra={"calendar_id": calendar_id}
            )

        # Supprimer le calendrier
        supabase.table("calendars").delete().eq("id", calendar_id).eq("owner_uid", uid).execute()

        # Supprimer aussi les tokens associés
        supabase.table("shared_tokens").delete().eq("calendar_id", calendar_id).execute()

        return success_response(
            message="Calendrier supprimé avec succès",
            code="CALENDAR_DELETE_SUCCESS",
            uid=uid,
            origin="CALENDAR_DELETE",
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la suppression du calendrier.",
            code="CALENDAR_DELETE_ERROR",
            status_code=500,
            uid=uid,
            origin="CALENDAR_DELETE",
            error=str(e)
        )


# Route pour renommer un calendrier
@api.route("/api/calendars", methods=["PUT"])
def handle_rename_calendar():
    try:
        user, token = verify_firebase_token()
        uid = user["uid"]
        data = request.get_json(force=True)
        calendar_id = data.get("calendarId")
        new_calendar_name = data.get("newCalendarName")

        if not calendar_id or not new_calendar_name:
            return warning_response(
                message="ID ou nom manquant.",
                code="CALENDAR_RENAME_ERROR",
                status_code=400,
                uid=uid,
                origin="CALENDAR_RENAME"
            )

        # Récupérer l'ancien nom
        response = supabase.table("calendars").select("name").eq("id", calendar_id).eq("owner_uid", uid).execute()
        if not response.data:
            return warning_response(
                message="Calendrier introuvable",
                code="CALENDAR_RENAME_ERROR",
                status_code=404,
                uid=uid,
                origin="CALENDAR_RENAME",
                log_extra={"calendar_id": calendar_id}
            )

        old_calendar_name = response.data[0]["name"]
        if old_calendar_name == new_calendar_name:
            return warning_response(
                message="Nom inchangé.",
                code="CALENDAR_RENAME_ERROR",
                status_code=400,
                uid=uid,
                origin="CALENDAR_RENAME"
            )

        supabase.table("calendars").update({
            "name": new_calendar_name,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "owner_uid": uid
        }).eq("id", calendar_id).eq("owner_uid", uid).execute()


        return success_response(
            message="Calendrier renommé avec succès",
            code="CALENDAR_RENAME_SUCCESS",
            uid=uid,
            origin="CALENDAR_RENAME",
            log_extra={"calendar_id": calendar_id, "old_calendar_name": old_calendar_name, "new_calendar_name": new_calendar_name}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors du renommage du calendrier.",
            code="CALENDAR_RENAME_ERROR",
            status_code=500,
            uid=uid,
            origin="CALENDAR_RENAME",
            error=str(e)
        )

  

# Route pour générer le calendrier 
@api.route("/api/calendars/<calendar_id>/schedule", methods=["GET"])
def handle_calendar_schedule(calendar_id):
    try:
        user, token = verify_firebase_token()
        owner_uid = user["uid"]

        start_date = request.args.get("startTime")
        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        
        doc_1 = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id)
        if not doc_1.get().exists:
            return warning_response(
                message="Calendrier introuvable", 
                code="CALENDAR_GENERATE_ERROR", 
                status_code=404, 
                uid=owner_uid, 
                origin="CALENDAR_GENERATE", 
                log_extra={"calendar_id": calendar_id}
                )

        calendar_name = doc_1.get().to_dict().get("calendar_name")

        doc_2 = doc_1.collection("medicines")
        if not doc_2.get():
            return success_response(
                message="Calendrier généré avec succès", 
                code="CALENDAR_GENERATE_SUCCESS", 
                uid=owner_uid, 
                origin="CALENDAR_GENERATE", 
                data={"medicines": 0, "schedule": [], "calendar_name": calendar_name, "table": {}},
                log_extra={"calendar_id": calendar_id}
            )
        
        medicines = [med.to_dict() for med in doc_2.get()]

        schedule = generate_schedule(start_date, medicines)
        table = generate_table(start_date, medicines)

        return success_response(
            message="Calendrier généré avec succès", 
            code="CALENDAR_GENERATE_SUCCESS", 
            uid=owner_uid, 
            origin="CALENDAR_GENERATE", 
            data={"medicines": len(medicines), "schedule": schedule, "calendar_name": calendar_name, "table": table},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la génération du calendrier.", 
            code="CALENDAR_GENERATE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="CALENDAR_GENERATE", 
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

