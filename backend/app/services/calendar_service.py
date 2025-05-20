from datetime import datetime, timedelta, date
import calendar
from app.utils.logger import log_backend as logger
from app.db.connection import get_connection
from app.utils.messages import (
    WARNING_UNAUTHORIZED_ACCESS,
    ERROR_SHARED_VERIFICATION
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

def is_medication_due(med, current_date):
    start_raw = med.get("start_date", "")

    # 🛠️ Accept both date and string formats
    if isinstance(start_raw, date):
        start = start_raw
    else:
        start = current_date  # fallback si aucune date valide

    print(start)

    delta_days = (current_date - start).days
    print(delta_days)

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

    return schedule

"""
[
    {
        "title": "Doliprane",
        "cells": {
            "Matin": {
                "Lun": "1",
                "Mer": "2"
            }
        }
    },
    ...
]
"""
def generate_table(start_date, medications):
    monday = start_date - timedelta(days=start_date.weekday())
    total_day = 7
    calendar_table = []

    for med in medications:
        med_table = build_medication_table(med, monday, total_day)
        if not med_table:
            continue
        merge_or_append(calendar_table, med.get("name"), med_table, med.get("dose", None))

    return calendar_table


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


def merge_or_append(calendar_table, name, med_table, dose):
    for entry in calendar_table:
        if entry["title"] != name:
            continue

        for moment, days in med_table.items():
            if moment not in entry["cells"]:
                entry["cells"][moment] = {}

            for day, value in days.items():
                entry["cells"][moment][day] = entry["cells"][moment].get(day, 0) + value

        return

    calendar_table.append({
        "title": name,
        "cells": med_table,
        "dose": dose
    })