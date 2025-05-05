from datetime import datetime, timedelta, date
import calendar
from logger import log_backend as logger
from firebase_admin import firestore

db = firestore.client()

def verify_calendar_share(calendar_id : str, owner_uid : str, receiver_uid : str) -> bool:
    try:
        shared_with_ref = db.collection("users").document(owner_uid) \
            .collection("calendars").document(calendar_id) \
            .collection("shared_with").document(receiver_uid)
        
        shared_with_doc = shared_with_ref.get()
        if not shared_with_doc.exists:
            logger.warning("Accès refusé", {
                "origin": "SHARED_VERIFY",
                "uid": receiver_uid,
                "calendar_id": calendar_id,
                "owner_uid": owner_uid
            })
            return False
        
        shared_data = shared_with_doc.to_dict()
        return shared_data.get("receiver_uid") == receiver_uid

    except Exception as e:
        logger.exception("Erreur lors de la vérification du partage", {
            "origin": "SHARED_VERIFY_ERROR",
            "uid": receiver_uid,
            "calendar_id": calendar_id, 
            "owner_uid": owner_uid
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

    Total_day = 45 # Nombre de jours à afficher (5 semaines)

    """
    # Dernier jour du mois
    last_day_of_month = date(start_date.year, start_date.month, calendar.monthrange(start_date.year, start_date.month)[1])

    # Nombre de jours entre le lundi et la fin du mois
    delta = (last_day_of_month - monday).days + 1  # +1 pour inclure le dernier jour

    # Nombre de semaines complètes (multiples de 7)
    total_full_weeks = delta // 7 + 1  # +1 pour inclure la semaine partielle
    # Nombre de jours restants après les semaines complètes
    Total_day = total_full_weeks * 7

    if Total_day == 0:
        Total_day = 7
    """
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
                        "start" : current_date.strftime("%Y-%m-%dT08:00:00"),
                        "color" : "#f87171" # rouge clair
                    }
                elif med["time"] == ["noon"]:
                    pils_data = {
                        "title" : name,
                        "start" : current_date.strftime("%Y-%m-%dT12:00:00"),
                        "color" : "#34d399" # vert clair
                    }
                elif med["time"] == ["evening"]:
                    pils_data = {
                        "title" : name,
                        "start" : current_date.strftime("%Y-%m-%dT18:00:00"),
                        "color" : "#60a5fa" # bleu clair
                    }
                schedule.append(pils_data)

    return schedule
