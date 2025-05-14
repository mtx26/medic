from flask import request
from auth import verify_firebase_token
from datetime import datetime, timezone, timedelta
from . import api
from supabase_client import supabase
from function import verify_calendar_share
from response import success_response, error_response, warning_response


# Obtenir les médicaments d’un calendrier
@api.route("/api/calendars/<calendar_id>/medicines", methods=["GET"])
def get_medicines(calendar_id):
    try:
        uid, token = verify_firebase_token()
        uid = user["uid"]

        response = supabase.table("calendars").select("owner_uid").eq("id", calendar_id).single().execute()
        if not response.data or response.data["owner_uid"] != uid:
            return warning_response("Accès non autorisé", code="MED_FETCH_UNAUTHORIZED", status_code=403, uid=uid, origin="MED_FETCH")

        data = supabase.table("medicines").select("*").eq("calendar_id", calendar_id).execute().data

        return success_response(
            message="Médicaments récupérés avec succès",
            code="MED_FETCH_SUCCESS",
            uid=uid,
            origin="MED_FETCH",
            data={"medicines": data},
            log_extra={"calendar_id": calendar_id}
        )
    except Exception as e:
        return error_response("Erreur lors de la récupération des médicaments.", code="MED_FETCH_ERROR", status_code=500, uid=uid, origin="MED_FETCH", error=str(e))


# Mettre à jour les médicaments d’un calendrier
@api.route("/api/calendars/<calendar_id>/medicines", methods=["PUT"])
def update_medicines(calendar_id):
    try:
        uid, token = verify_firebase_token()
        uid = user["uid"]
        medicines = request.json.get("medicines")

        if not isinstance(medicines, list):
            return warning_response("Format invalide", code="INVALID_MEDICINE_FORMAT", status_code=400, uid=uid, origin="MED_UPDATE")

        owner_check = supabase.table("calendars").select("owner_uid").eq("id", calendar_id).single().execute()
        if not owner_check.data or owner_check.data["owner_uid"] != uid:
            return warning_response("Accès interdit", code="MED_UPDATE_UNAUTHORIZED", status_code=403, uid=uid, origin="MED_UPDATE")

        # Supprimer les anciens
        existing = supabase.table("medicines").select("id").eq("calendar_id", calendar_id).execute().data
        for med in existing:
            supabase.table("medicines").delete().eq("id", med["id"]).execute()

        for med in medicines:
            supabase.table("medicines").insert(med).execute()

        return success_response("Médicaments mis à jour", code="MED_UPDATE_SUCCESS", uid=uid, origin="MED_UPDATE", data={"medicines": medicines})
    except Exception as e:
        return error_response("Erreur mise à jour", code="MED_UPDATE_ERROR", status_code=500, uid=uid, origin="MED_UPDATE", error=str(e))


# Compter les médicaments d'un calendrier personnel
@api.route("/api/medicines/count", methods=["GET"])
def count_medicines():
    try:
        uid, token = verify_firebase_token()
        uid = user["uid"]
        calendar_id = request.args.get("calendarId")

        cal_check = supabase.table("calendars").select("owner_uid").eq("id", calendar_id).single().execute()
        if not cal_check.data or cal_check.data["owner_uid"] != uid:
            return warning_response("Accès interdit", code="MED_COUNT_UNAUTHORIZED", status_code=403, uid=uid, origin="MED_COUNT")

        count = supabase.table("medicines").select("id", count="exact").eq("calendar_id", calendar_id).execute().count
        return success_response("Comptage réussi", code="MED_COUNT_SUCCESS", uid=uid, origin="MED_COUNT", data={"count": count})
    except Exception as e:
        return error_response("Erreur de comptage", code="MED_COUNT_ERROR", status_code=500, uid=uid, origin="MED_COUNT", error=str(e))


# Compter les médicaments d'un calendrier partagé
@api.route("/api/medicines/shared/count", methods=["GET"])
def count_shared_medicines():
    try:
        uid, token = verify_firebase_token()
        uid = user["uid"]
        calendar_id = request.args.get("calendarId")
        owner_uid = request.args.get("ownerUid")

        if not verify_calendar_share(calendar_id, owner_uid, uid):
            return warning_response("Accès non autorisé", code="UNAUTHORIZED_ACCESS", status_code=403, uid=uid, origin="MED_SHARED_COUNT")

        count = supabase.table("medicines").select("id", count="exact").eq("calendar_id", calendar_id).execute().count
        return success_response("Comptage réussi", code="MED_SHARED_COUNT_SUCCESS", uid=uid, origin="MED_SHARED_COUNT", data={"count": count})
    except Exception as e:
        return error_response("Erreur comptage partagé", code="MED_SHARED_COUNT_ERROR", status_code=500, uid=uid, origin="MED_SHARED_COUNT", error=str(e))