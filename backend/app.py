from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from datetime import datetime, timedelta
from routes import api
import json


app = Flask(__name__)
CORS(app)  # Autorise les requêtes du frontend
app.config.from_object(Config)
app.register_blueprint(api)

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
def generate_month_schedule(start_date):
    schedule = []

    for i in range(30):
        day = start_date + timedelta(days=i)
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
                    "tablet_count": med["tablet_count"],
                }
                for time in med["time"]:
                    if time == "morning":
                        day_entry["morning"].append(med_data)
                    elif time == "evening":
                        day_entry["evening"].append(med_data)

        schedule.append(day_entry)

    return schedule

# Route pour React
@app.route("/calendar")
def get_calendar():
    start_str = request.args.get("start", datetime.today().date().isoformat())
    start_date = datetime.strptime(start_str, "%Y-%m-%d").date()
    planning = generate_month_schedule(start_date)
    return jsonify(planning)


if __name__ == '__main__':
    app.run(debug=True)
