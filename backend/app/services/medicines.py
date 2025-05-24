from app.db.connection import get_connection


def update_medicines(calendar_id, changes):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            for change in changes:
                process_medicine_change(cursor, calendar_id, change)

            cursor.execute("SELECT * FROM medicines WHERE calendar_id = %s", (calendar_id,))
            return cursor.fetchall()


def process_medicine_change(cursor, calendar_id, change):
    med_id = change.get("id")
    if not med_id:
        return

    cursor.execute("SELECT * FROM medicines WHERE id = %s", (med_id,))
    existing = cursor.fetchone()

    if not existing:
        insert_medicine(cursor, calendar_id, med_id, change)
    else:
        update_medicine(cursor, med_id, change)


def insert_medicine(cursor, calendar_id, med_id, change):
    cursor.execute(
        """
        INSERT INTO medicines (
            id, calendar_id, name, tablet_count, time_of_day, interval_days, start_date, dose
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            med_id,
            calendar_id,
            change.get("name"),
            change.get("tablet_count"),
            change.get("time_of_day"),
            change.get("interval_days"),
            change.get("start_date"),
            change.get("dose"),
        )
    )


def update_medicine(cursor, med_id, change):
    fields = []
    values = []
    for field in ["name", "tablet_count", "time_of_day", "interval_days", "start_date", "dose"]:
        if field in change:
            fields.append(f"{field} = %s")
            values.append(change[field])

    if fields:
        query = f"UPDATE medicines SET {', '.join(fields)} WHERE id = %s"
        cursor.execute(query, (*values, med_id))
