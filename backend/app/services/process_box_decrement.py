from datetime import timedelta
import re
from this import d

from psycopg2.sql import NULL
from app.services.calendar_service import is_medication_due

def process_box_decrement(cursor, id_box, qty, start_date):
    """
    Calcule et applique la diminution du stock pour une boîte donnée sur une semaine.
    """
    cursor.execute("""
        SELECT tablet_count, start_date, interval_days
        FROM medicine_box_conditions
        WHERE box_id = %s
    """, (id_box,))
    conditions = cursor.fetchall()

    total_tablets_week = 0
    if not start_date:
        return
        
    for i in range(7):
        day = start_date + timedelta(days=i)

        total_tablets_day = sum(
            condition.get("tablet_count") for condition in conditions
            if is_medication_due(condition, day) and condition.get("tablet_count") is not None
        )

        total_tablets_week += total_tablets_day

    if total_tablets_week > 0:
        new_qty = max(0, qty - total_tablets_week)
        cursor.execute(
            "UPDATE medicine_boxes SET stock_quantity = %s WHERE id = %s",
            (new_qty, id_box)
        )
