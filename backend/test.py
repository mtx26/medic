from flask import Flask, jsonify, request
from datetime import datetime, timedelta
import json

# Charger les médicaments
with open("pils.json", encoding="utf-8") as f:
    medications = json.load(f)

# Détermine si un médicament doit être pris à une date donnée
def is_medication_due(med, date):
    if "start_date" in med:
        start = datetime.strptime(med["start_date"], "%Y-%m-%d").date()
    else:
        start = date  # toujours actif si pas de date de début

    delta_days = (date - start).days
    if delta_days < 0:
        return False
    return delta_days % med["interval_days"] == 0

# Génère un planning de 30 jours à partir de la date donnée
def generate_schedule(start_date):
    schedule = []

    # Calculer la fin du mois de start_date
    year = start_date.year
    month = start_date.month

    # Sauter au mois suivant, puis revenir d'un jour en arrière
    if month == 12:
        next_month = datetime(year + 1, 1, 1)
    else:
        next_month = datetime(year, month + 1, 1)

    end_date = (next_month - timedelta(days=1)).date()

    # Génération du planning jusqu'à la fin du mois
    day = start_date
    while day <= end_date:
        day_entry = {
            "date": day.isoformat(),
            "day": day.strftime("%A"),
            "morning": [],
            "evening": []
        }

        for med in medications:
            if is_medication_due(med, day):
                med_data = {
                    "name": med["name"],
                    "tablet_count": med["tablet_count"]
                }
                for time in med["time"]:
                    day_entry[time].append(med_data)

        schedule.append(day_entry)
        day += timedelta(days=1)

    return schedule



# Exemple d'utilisation
start_date = datetime(2025, 5, 1).date()
schedule = generate_schedule(start_date)
open("schedule.json", "w", encoding="utf-8").write(json.dumps(schedule, ensure_ascii=False, indent=4))