from datetime import timedelta
from app.services.calendar_service import is_medication_due

def process_box_decrement(cursor, id_box, qty, start_time=None):
    """
    Calcule et applique la diminution du stock pour une boîte donnée sur une semaine.
    """
    cursor.execute("""
        SELECT tablet_count, start_date, interval_days
        FROM medicine_box_conditions
        WHERE box_id = %s
    """, (id_box,))
    conditions = cursor.fetchall()
    print(f"Processing box {id_box} with initial quantity {qty} and start time {start_time}")

    if not conditions or start_time is None:
        return

    total_tablets_week = 0

    for i in range(7):
        day = start_time + timedelta(days=i)


        total_tablets_day = sum(
            condition.get("tablet_count") for condition in conditions
            if is_medication_due(condition, day) and condition.get("tablet_count") is not None
        )

        total_tablets_week += total_tablets_day

    print(f"Total tablets to decrement for box {id_box}: {total_tablets_week}")

    if total_tablets_week > 0:
        new_qty = max(0, qty - total_tablets_week)
        cursor.execute(
            "UPDATE medicine_boxes SET stock_quantity = %s WHERE id = %s",
            (new_qty, id_box)
        )
