from datetime import timedelta, date
from app.utils.logger import log_backend as logger
from app.db.connection import get_connection

def generate_calendar_schedule(calendar_id, start_date):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
                calendar = cursor.fetchone()
                if calendar is None:
                    return None, None, None

                cursor.execute("""
                    SELECT 
                        cond.*,
                        box.name,
                        box.dose
                    FROM medicine_box_conditions cond
                    JOIN medicine_boxes box ON cond.box_id = box.id
                    WHERE box.calendar_id = %s
                """, (calendar_id,))

                medicines = cursor.fetchall()
                if medicines:
                    schedule = generate_schedule(start_date, medicines)
                    table = generate_table(start_date, medicines)
                    return schedule, table, calendar.get("name")
                else:
                    return [], [], None

    except Exception as e:
        logger.error("erreur lors de la génération du calendrier", {
            "origin": "CALENDAR_GENERATE_ERROR",
            "error": str(e)
        })
        return None, None, None


def is_medication_due(med, current_date):
    try:
        start_date = med.get("start_date", "")
        if isinstance(start_date, date):
            sd = start_date
        else:
            sd = current_date


        delta_days = (current_date - sd).days

        if delta_days < 0:
            return False

        return delta_days % med["interval_days"] == 0
    except Exception as e:
        logger.error(f"erreur lors de la vérification de la date de prise du médicament: {e}", {
            "origin": "MEDICATION_DUE_ERROR",
            "error": str(e)
        })
        return False


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

def fetch_calendar(calendar_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
            calendar = cursor.fetchone() or {}
            return calendar

def fetch_medicine_name(medication_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT name FROM medicine_boxes WHERE id = %s", (medication_id,))
            result = cursor.fetchone() or {}
            return result.get("name", "unknown")
    
