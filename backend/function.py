from datetime import datetime, timedelta, date
import calendar
from logger import logger



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

    # Dernier jour du mois
    last_day_of_month = date(start_date.year, start_date.month, calendar.monthrange(start_date.year, start_date.month)[1])

    # Nombre de jours entre le lundi et la fin du mois
    delta = (last_day_of_month - monday).days + 1  # +1 pour inclure le dernier jour

    # Nombre de semaines complètes (multiples de 7)
    total_full_weeks = delta // 7
    # Nombre de jours restants après les semaines complètes
    Total_day = total_full_weeks * 7

    if Total_day == 0:
        Total_day = 7
    
    logger.debug(f"Nombre de jours à traiter : {Total_day}")
    logger.debug(f"Date de début : {start_date}")
    logger.debug(f"Date de fin : {last_day_of_month}")
    logger.debug(f"Lundi de début : {monday}")

    schedule = []

    for i in range(Total_day):
        current_date = monday + timedelta(days=i)
        for med in medications:
            if is_medication_due(med, current_date):
                # format pour fullcalendar
                pils_data = {}

                name = f"{med['name']} ({med['tablet_count']})"

                if med["time"] == ["morning"]:
                    pils_data = {
                        "title" : name,
                        "date" : current_date.strftime("%Y-%m-%dT08:00:00"),
                        "color" : "#f87171" # rouge clair
                    }
                elif med["time"] == ["evening"]:
                    pils_data = {
                        "title" : name,
                        "date" : current_date.strftime("%Y-%m-%dT18:00:00"),
                        "color" : "#60a5fa" # bleu clair
                    }
                schedule.append(pils_data)
                schedule.sort(key=lambda ev: datetime.strptime(ev["date"], "%Y-%m-%dT%H:%M:%S"))

    return schedule
