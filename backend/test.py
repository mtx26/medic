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
    schedule = {}
    year = start_date.year
    month = start_date.month
    _, days_in_month = calendar.monthrange(year, month)

    for day in range(1, days_in_month + 1):
        date = datetime(year, month, day).date()
        schedule[date] = {"morning": [], "evening": []}
        for med in medications:
            if is_medication_due(med, date):
                med_data = f"{med['name']} ({med['tablet_count']})"
                for moment in med["time"]:
                    schedule[date][moment].append(med_data)
    return schedule

def split_dates_by_weeks(start_date, schedule):
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

def draw_calendar_page(c, weeks, schedule, title):
    width, height = landscape(A4)
    cell_width = width / 7
    cell_height = (height - 60) / len(weeks)

    # Titre
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width / 2, height - 30, title)

    # En-têtes
    days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
    c.setFont("Helvetica-Bold", 11)
    for i, day in enumerate(days):
        c.drawCentredString(i * cell_width + cell_width / 2, height - 50, day)

    # Cases
    c.setFont("Helvetica", 7)
    for row, week in enumerate(weeks):
        for col, date in enumerate(week):
            x = col * cell_width
            y = height - 60 - row * cell_height

            c.rect(x, y - cell_height, cell_width, cell_height)

            if date is None:
                continue

            # Date
            c.setFont("Helvetica-Bold", 8)
            c.drawString(x + 2, y - 10, f"{date.day} {calendar.day_name[date.weekday()]}")

            # Ligne de séparation matin/soir
            c.line(x, y - cell_height / 2, x + cell_width, y - cell_height / 2)

            # Médicaments matin
            y_text = y - 20
            c.setFont("Helvetica", 7)
            for med in schedule[date]["morning"]:
                if y_text > y - cell_height / 2 + 5:
                    c.drawString(x + 2, y_text, f"- {med}")
                    y_text -= 8

            # Médicaments soir
            y_text = y - cell_height / 2 - 10
            for med in schedule[date]["evening"]:
                if y_text > y - cell_height + 5:
                    c.drawString(x + 2, y_text, f"- {med}")
                    y_text -= 8

def create_calendar_pdf(start_date, schedule, output_path):
    c = canvas.Canvas(output_path, pagesize=landscape(A4))
    weeks1, weeks2 = split_dates_by_weeks(start_date, schedule)

    draw_calendar_page(c, weeks1, schedule, f"Calendrier Médicaments - {start_date.strftime('%B %Y')} (1/2)")
    c.showPage()
    draw_calendar_page(c, weeks2, schedule, f"Calendrier Médicaments - {start_date.strftime('%B %Y')} (2/2)")
    c.save()
    return output_path

# Lancer la génération
start_date = datetime(2025, 6, 1).date()
schedule = generate_schedule(start_date)
output_path = f"calendrier_medicaments_{start_date.strftime('%B_%Y')}.pdf"
create_calendar_pdf(start_date, schedule, output_path)
