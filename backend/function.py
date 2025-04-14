from datetime import datetime, timedelta
import calendar
import json


# Charger les médicaments
with open("pils.json", encoding="utf-8") as f:
    medications = json.load(f)

def is_medication_due(med, date):
    if "start_date" in med:
        start = datetime.strptime(med["start_date"], "%Y-%m-%d").date()
    else:
        start = date
    delta_days = (date - start).days
    if delta_days < 0:
        return False
    return delta_days % med["interval_days"] == 0

def generate_schedule(start_date):
    monday = start_date - timedelta(days=start_date.weekday())

    schedule = {}
    year = start_date.year
    month = start_date.month
    _, days_in_month = calendar.monthrange(year, month)
    schedule = []

    for i in range(7):
        date = monday + timedelta(days=i)
        for med in medications:
            if is_medication_due(med, date):
                # format pour fullcalendar
                pils_data = {}

                name = f"{med['name']} ({med['tablet_count']})"

                if med["time"] == ["morning"]:
                    pils_data = {
                        "title" : name,
                        "date" : date.strftime("%Y-%m-%dT08:00:00"),
                        "color" : "#f87171" # rouge clair
                    }
                elif med["time"] == ["evening"]:
                    pils_data = {
                        "title" : name,
                        "date" : date.strftime("%Y-%m-%dT18:00:00"),
                        "color" : "#60a5fa" # bleu clair
                    }
                schedule.append(pils_data) 
    return schedule
