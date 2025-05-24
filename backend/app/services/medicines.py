from app.db.connection import get_connection


def update_medicines(calendar_id, changes):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            for change in changes:
                med_id = change.get("id")
                    
                if med_id:

                    fields = []
                    values = []
                    cursor.execute("SELECT * FROM medicines WHERE id = %s", (med_id,))
                    med = cursor.fetchone()
                    if not med:
                        cursor.execute(
                            "INSERT INTO medicines (id, calendar_id, name, tablet_count, time_of_day, interval_days, start_date, dose) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", 
                            (med_id, calendar_id, change.get("name"), change.get("tablet_count"), change.get("time_of_day"), change.get("interval_days"), change.get("start_date"), change.get("dose"))
                        )
                    
                    else:
                        for field in ["name", "tablet_count", "time_of_day", "interval_days", "start_date", "dose"]:
                            if field in change:
                                fields.append(f"{field} = %s")
                                values.append(change[field])
                        if fields:
                            query = f"UPDATE medicines SET {', '.join(fields)} WHERE id = %s"
                            cursor.execute(query, (*values, med_id))

            cursor.execute("SELECT * FROM medicines WHERE calendar_id = %s", (calendar_id,))
            medicines = cursor.fetchall()

    return medicines