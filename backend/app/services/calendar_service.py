from datetime import datetime, timedelta, date, timezone
import calendar
from app.utils.logger import log_backend as logger
from app.db.connection import get_connection
from app.utils.messages import (
    WARNING_UNAUTHORIZED_ACCESS,
    ERROR_SHARED_VERIFICATION,
    ERROR_CALENDAR_VERIFY,
    ERROR_TOKEN_VERIFY,
    ERROR_TOKEN_OWNER_VERIFY,
)

def verify_calendar_share(calendar_id : str, receiver_uid : str) -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
                calendar = cursor.fetchone()
                if not calendar:
                    return False
                
                cursor.execute("SELECT * FROM shared_calendars WHERE calendar_id = %s AND receiver_uid = %s", (calendar_id, receiver_uid,))
                shared_calendar = cursor.fetchone()
                if not shared_calendar:
                    logger.warning(WARNING_UNAUTHORIZED_ACCESS, {
                        "origin": "SHARED_VERIFY",
                        "uid": receiver_uid,
                        "calendar_id": calendar_id,
                    })
                    return False
                
                return True

    except Exception as e:
        logger.error(ERROR_SHARED_VERIFICATION, {
            "origin": "SHARED_VERIFY_ERROR",
            "uid": receiver_uid,
            "calendar_id": calendar_id, 
            "error": str(e)
        })
        return False

def verify_calendar(calendar_id : str, uid : str) -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s AND owner_uid = %s", (calendar_id, uid,))
                calendar = cursor.fetchone()
                if not calendar:
                    return False
                
                return True

    except Exception as e:
        logger.error(ERROR_CALENDAR_VERIFY, {
            "origin": "CALENDAR_VERIFY_ERROR",
            "uid": uid,
            "calendar_id": calendar_id,
            "error": str(e)
        })
        return False

def verify_token(token : str) -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_tokens WHERE id = %s", (token,))
                token_data = cursor.fetchone()
                if not token_data:
                    return False

                calendar_id = token_data.get("calendar_id")
                owner_uid = token_data.get("owner_uid")
                expires_at = token_data.get("expires_at")
                revoked = token_data.get("revoked")
                permissions = token_data.get("permissions")

                if not verify_calendar(calendar_id, owner_uid):
                    return False

                now = datetime.now(timezone.utc).date()
                
                if expires_at and now > expires_at.date():
                    return False

                if revoked:
                    return False

                if "read" not in permissions:
                    return False

                return calendar_id

    except Exception as e:
        logger.error(ERROR_TOKEN_VERIFY, {
            "origin": "TOKEN_VERIFY_ERROR",
            "token": token,
            "error": str(e)
        })
        return False

def verify_token_owner(token : str, uid : str) -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_tokens WHERE id = %s", (token,))
                token_data = cursor.fetchone()
                if not token_data:
                    return False

                if token_data.get("owner_uid") != uid:
                    return False

                return True

    except Exception as e:
        logger.error(ERROR_TOKEN_OWNER_VERIFY, {
            "origin": "TOKEN_OWNER_VERIFY_ERROR",
            "token": token,
            "error": str(e)
        })
        return False


def is_medication_due(med, current_date):
    start_raw = med.get("start_date", "")

    # 🛠️ Accept both date and string formats
    if isinstance(start_raw, date):
        start = start_raw
    else:
        start = current_date  # fallback si aucune date valide

    delta_days = (current_date - start).days


    if delta_days < 0:
        return False

    return delta_days % med["interval_days"] == 0


def generate_schedule(start_date, medications):
    monday = start_date - timedelta(days=start_date.weekday())

    total_day = 7 # Nombre de jours à afficher (1 semaine)
    schedule = []

    for i in range(total_day):
        current_date = monday + timedelta(days=i)
        for med in medications:
            if is_medication_due(med, current_date):
                # format pour fullcalendar

                name = med.get('name')
                tablet_count = med.get('tablet_count')
                dose = med.get('dose', None)

                if med["time_of_day"] == "morning":
                    pils_data = {
                        "title" : name,
                        "start" : current_date.strftime("%Y-%m-%dT08:00:00"),
                        "color" : "#f87171", # rouge clair
                        "tablet_count" : tablet_count,
                        "dose" : dose
                    }
                elif med["time_of_day"] == "noon":
                    pils_data = {
                        "title" : name,
                        "start" : current_date.strftime("%Y-%m-%dT12:00:00"),
                        "color" : "#34d399", # vert clair
                        "tablet_count" : tablet_count,
                        "dose" : dose
                    }
                elif med["time_of_day"] == "evening":
                    pils_data = {
                        "title" : name,
                        "start" : current_date.strftime("%Y-%m-%dT18:00:00"),
                        "color" : "#60a5fa", # bleu clair
                        "tablet_count" : tablet_count,
                        "dose" : dose
                    }
                schedule.append(pils_data)
                
    # trier les événements par date et par alphabet
    schedule.sort(key=lambda x: (x["start"], x["title"]))
    return schedule

"""
{
  "morning": [
    {
      "title": "Doliprane",
      "cells": {
        "Mon": 1,
        "Tue": 2
      },
      "dose": "500mg"
    },
    ...
  ],
  "evening": [ ... ]
}


"""
def generate_table(start_date, medications):
    monday = start_date - timedelta(days=start_date.weekday())
    total_day = 7
    table_by_moment = {
        "morning": [],
        "noon": [],
        "evening": []
    }

    for med in medications:
        med_table = build_medication_table(med, monday, total_day)
        if not med_table:
            continue

        moment = med.get("time_of_day")
        if moment not in table_by_moment:
            continue
        merge_or_append_by_moment(table_by_moment[moment], med.get("name"), med_table.get(moment, {}), med.get("dose", None))

    for moment in table_by_moment:
        table_by_moment[moment].sort(key=lambda x: x["title"].lower())
    
    print(table_by_moment)
    return table_by_moment


def build_medication_table(med, monday, total_day):
    table = {}

    for i in range(total_day):
        current_date = monday + timedelta(days=i)
        if not is_medication_due(med, current_date):
            continue

        day = current_date.strftime("%a")
        moment = med["time_of_day"]
        if moment not in table:
            table[moment] = {}
        table[moment][day] = med["tablet_count"]

    return table


def merge_or_append_by_moment(moment_list, name, cells, dose):
    for entry in moment_list:
        if entry["title"] != name:
            continue

        if entry["dose"] != dose:
            continue

        for day, value in cells.items():
            entry["cells"][day] = entry["cells"].get(day, 0) + value

        return

    # Sinon, on ajoute une nouvelle entrée
    moment_list.append({
        "title": name,
        "cells": cells,
        "dose": dose
    })
