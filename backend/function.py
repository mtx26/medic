from datetime import datetime, timedelta, date
import calendar
from logger import log_backend as logger
from firebase_admin import firestore
from messages import (
    WARNING_UNAUTHORIZED_ACCESS,
    ERROR_SHARED_VERIFICATION
)

db = firestore.client()

def verify_calendar_share(calendar_id : str, owner_uid : str, receiver_uid : str) -> bool:
    try:
        shared_with_ref = db.collection("users").document(owner_uid) \
            .collection("calendars").document(calendar_id) \
            .collection("shared_with").document(receiver_uid)
        
        shared_with_doc = shared_with_ref.get()
        if not shared_with_doc.exists:
            logger.warning(WARNING_UNAUTHORIZED_ACCESS, {
                "origin": "SHARED_VERIFY",
                "uid": receiver_uid,
                "calendar_id": calendar_id,
                "owner_uid": owner_uid
            })
            return False
        
        shared_data = shared_with_doc.to_dict()
        return shared_data.get("receiver_uid") == receiver_uid

    except Exception as e:
        logger.error(ERROR_SHARED_VERIFICATION, {
            "origin": "SHARED_VERIFY_ERROR",
            "uid": receiver_uid,
            "calendar_id": calendar_id, 
            "owner_uid": owner_uid,
            "error": str(e)
        })
        return False

def is_medication_due(med, current_date):
    start_str = med.get("start_date", "").strip()

    if start_str:
        start = datetime.strptime(med["start_date"], "%Y-%m-%d").date()
    else:
        start = current_date
    delta_days = (current_date - start).days

    if delta_days < 0:
        return False
    

    return delta_days % med["interval_days"] == 0

def generate_schedule(start_date, medications):
    # Trouver le lundi de la semaine contenant start_date
    monday = start_date - timedelta(days=start_date.weekday())

    total_day = 35 # Nombre de jours à afficher (5 semaines)
    schedule = []

    for i in range(total_day):
        current_date = monday + timedelta(days=i)
        for med in medications:
            if is_medication_due(med, current_date):
                # format pour fullcalendar
                pils_data = {}

                name = med.get('name')
                tablet_count = med.get('tablet_count')
                dose = med.get('dose', None)

                if med["time"] == ["morning"]:
                    pils_data = {
                        "title" : name,
                        "start" : current_date.strftime("%Y-%m-%dT08:00:00"),
                        "color" : "#f87171", # rouge clair
                        "tablet_count" : tablet_count,
                        "dose" : dose
                    }
                elif med["time"] == ["noon"]:
                    pils_data = {
                        "title" : name,
                        "start" : current_date.strftime("%Y-%m-%dT12:00:00"),
                        "color" : "#34d399", # vert clair
                        "tablet_count" : tablet_count,
                        "dose" : dose
                    }
                elif med["time"] == ["evening"]:
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
        for moment in med["time"]:
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