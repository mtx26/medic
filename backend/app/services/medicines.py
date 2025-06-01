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



def get_boxes(calendar_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
            SELECT mb.id, mb.name, mb.box_capacity, mb.stock_quantity, mb.stock_alert_threshold, mb.calendar_id, c.name AS calendar_name
            FROM medicine_boxes mb
            JOIN calendars c ON mb.calendar_id = c.id
            WHERE c.id = %s
            """, (calendar_id,))
            boxes = cursor.fetchall()
            for box in boxes:
                cursor.execute("SELECT * FROM medicine_box_conditions WHERE box_id = %s", (box.get("id"),))
                conditions = cursor.fetchall()
                box["conditions"] = conditions
    if not boxes:
        return []
    return boxes

def update_box(box_id, calendar_id, data):
    name = data.get("name")
    box_capacity = data.get("box_capacity")
    stock_alert_threshold = data.get("stock_alert_threshold")
    stock_quantity = data.get("stock_quantity")
    conditions = data.get("conditions", [])
    
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE medicine_boxes 
                SET name = %s, box_capacity = %s, stock_alert_threshold = %s, stock_quantity = %s 
                WHERE id = %s AND calendar_id = %s
            """, (name, box_capacity, stock_alert_threshold, stock_quantity, box_id, calendar_id))
            cursor.execute("DELETE FROM medicine_box_conditions WHERE box_id = %s", (box_id,))
            if conditions:
                for condition in conditions:
                    cursor.execute("""
                        INSERT INTO medicine_box_conditions 
                        (id, box_id, tablet_count, interval_days, start_date, time_of_day)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (condition.get("id"), box_id, condition.get("tablet_count"), condition.get("interval_days"), condition.get("start_date"), condition.get("time_of_day")))
            conn.commit()

def create_box(calendar_id, data):
    name = data.get("name", "nouvelle boite")
    box_capacity = data.get("box_capacity", 0)
    stock_alert_threshold = data.get("stock_alert_threshold", 10)
    stock_quantity = data.get("stock_quantity", 0)

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO medicine_boxes (calendar_id, name, box_capacity, stock_alert_threshold, stock_quantity) 
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (calendar_id, name, box_capacity, stock_alert_threshold, stock_quantity))
            box = cursor.fetchone()
            box_id = box.get("id")
            conn.commit()

    return box_id

def delete_box(box_id, calendar_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM medicine_boxes WHERE id = %s AND calendar_id = %s", (box_id, calendar_id))
            cursor.execute("DELETE FROM medicine_box_conditions WHERE box_id = %s", (box_id,))
            conn.commit()