from . import api
from auth import verify_firebase_token
from datetime import datetime, timezone
from flask import request
from firebase_admin import firestore
from function import generate_schedule
import secrets
from response import success_response, error_response, warning_response

db = firestore.client()

# Route pour récupérer les calendriers de l'utilisateur
@api.route("/api/calendars", methods=["GET"])
def handle_calendars():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        calendars_ref = db.collection("users").document(uid).collection("calendars")
        calendars = [calendar.to_dict() for calendar in calendars_ref.stream()]
        return success_response(
            message="Calendriers récupérés avec succès", 
            code="CALENDAR_FETCH_SUCCESS", 
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
        user = verify_firebase_token()
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

        calendar_id = secrets.token_hex(16)
        doc = db.collection("users").document(uid).collection("calendars").document(calendar_id).get()

        if doc.exists:
            return warning_response(
                message="Tentative de création d'un calendrier déjà existant.", 
                code="CALENDAR_CREATE_ERROR", 
                status_code=409, 
                uid=uid, 
                origin="CALENDAR_CREATE", 
                log_extra={"calendar_name": calendar_name}
            )

        db.collection("users").document(uid).collection("calendars").document(calendar_id).set({
            "calendar_id": calendar_id,
            "calendar_name": calendar_name,
            "medicines": "",
            "last_updated": firestore.SERVER_TIMESTAMP
        }, merge=True)

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
        user = verify_firebase_token()
        uid = user["uid"]
        calendar_id = request.json.get("calendarId")

        if not calendar_id:
            return warning_response(
                message="Identifiant de calendrier manquant.", 
                code="CALENDAR_DELETE_ERROR", 
                status_code=400, 
                uid=uid, 
                origin="CALENDAR_DELETE_ERROR", 
                log_extra={"calendar_id": calendar_id}
            )

        doc_ref = db.collection("users").document(uid).collection("calendars").document(calendar_id)
        if not doc_ref.get().exists:
            return warning_response(
                message="Calendrier introuvable.", 
                code="CALENDAR_DELETE_ERROR", 
                status_code=404, 
                uid=uid, 
                origin="CALENDAR_DELETE_ERROR", 
                log_extra={"calendar_id": calendar_id}
            )

        doc_ref.delete()

        for doc in db.collection("shared_tokens").get():
            token_data = doc.to_dict()
            if token_data.get("owner_uid") == uid and token_data.get("calendar_id") == calendar_id:
                db.collection("shared_tokens").document(doc.id).delete()

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
        user = verify_firebase_token()
        uid = user["uid"]
        data = request.get_json(force=True)
        calendar_id = data.get("calendarId")
        new_calendar_name = data.get("newCalendarName")

        doc_ref = db.collection("users").document(uid).collection("calendars").document(calendar_id)
        if not doc_ref.get().exists:
            return warning_response(
                message="Calendrier introuvable", 
                code="CALENDAR_RENAME_ERROR", 
                status_code=404, 
                uid=uid, 
                origin="CALENDAR_RENAME", 
                log_extra={"calendar_id": calendar_id, "new_calendar_name": new_calendar_name})

        old_calendar_name = doc_ref.get().to_dict().get("calendar_name")
        if not old_calendar_name or not new_calendar_name:
            return warning_response(
                message="Noms invalides reçus.", 
                code="CALENDAR_RENAME_ERROR", 
                status_code=400, 
                uid=uid, 
                origin="CALENDAR_RENAME", 
                log_extra={"calendar_id": calendar_id, "old_calendar_name": old_calendar_name, "new_calendar_name": new_calendar_name}
            )

        if old_calendar_name == new_calendar_name:
            return warning_response(
                message="Nom inchangé.", 
                code="CALENDAR_RENAME_ERROR", 
                status_code=400, 
                uid=uid, 
                origin="CALENDAR_RENAME", 
                log_extra={"calendar_id": calendar_id, "old_calendar_name": old_calendar_name, "new_calendar_name": new_calendar_name})

        doc_ref.update({"calendar_name": new_calendar_name})

        for doc in db.collection("shared_tokens").get():
            token_data = doc.to_dict()
            if token_data.get("owner_uid") == uid and token_data.get("calendar_name") == old_calendar_name:
                db.collection("shared_tokens").document(doc.id).update({"calendar_name": new_calendar_name})

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
            error=str(e))
  

# Route pour générer le calendrier 
@api.route("/api/calendars/<calendar_id>/calendar", methods=["GET"])
def handle_calendar(calendar_id):
    try:
        user = verify_firebase_token()
        owner_uid = user["uid"]

        doc = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).collection("medicines")
        if not doc.get():
            return success_response(
                message="Calendrier généré avec succès", 
                code="CALENDAR_GENERATE_SUCCESS", 
                uid=owner_uid, 
                origin="CALENDAR_GENERATE", 
                data={"medicines": 0, "schedule": []},
                log_extra={"calendar_id": calendar_id}
            )
        
        medicines = [med.to_dict() for med in doc.get()]
        
        start_str = request.args.get("startTime")
        if not start_str:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_str, "%Y-%m-%d").date()

        schedule = generate_schedule(start_date, medicines)

        calendar_name = db.collection("users").document(owner_uid).collection("calendars").document(calendar_id).get().to_dict().get("calendar_name")

        return success_response(
            message="Calendrier généré avec succès", 
            code="CALENDAR_GENERATE_SUCCESS", 
            uid=owner_uid, 
            origin="CALENDAR_GENERATE", 
            data={"medicines": len(medicines), "schedule": schedule, "calendar_name": calendar_name},
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

