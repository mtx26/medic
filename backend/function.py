from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas
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
                # forma pour fullcalendar
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

"""def split_dates_by_weeks(start_date, schedule):
    all_dates = sorted(schedule.keys())
    first_day = start_date.replace(day=1)
    first_weekday = first_day.weekday()  # lundi = 0

    weeks = []
    current_week = [None] * first_weekday
    for date in all_dates:
        current_week.append(date)
        if len(current_week) == 7:
            weeks.append(current_week)
            current_week = []

    if current_week:
        while len(current_week) < 7:
            current_week.append(None)
        weeks.append(current_week)

    midpoint = (len(weeks) + 1) // 2
    return weeks[:midpoint], weeks[midpoint:]
    c = canvas.Canvas(output_path, pagesize=landscape(A4))
    weeks1, weeks2 = split_dates_by_weeks(start_date, schedule)

    draw_calendar_page(c, weeks1, schedule, f"Calendrier Médicaments - {start_date.strftime('%B %Y')} (1/2)")
    c.showPage()
    draw_calendar_page(c, weeks2, schedule, f"Calendrier Médicaments - {start_date.strftime('%B %Y')} (2/2)")
    c.save()
    return output_path"""
