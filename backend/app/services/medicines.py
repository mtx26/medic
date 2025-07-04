from app.db.connection import get_connection

def get_boxes(calendar_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
            SELECT mb.id, mb.name, mb.box_capacity, mb.stock_quantity, mb.stock_alert_threshold, mb.calendar_id, c.name AS calendar_name, mb.dose
            FROM medicine_boxes mb
            LEFT JOIN calendars c ON mb.calendar_id = c.id
            WHERE c.id = %s
            """, (calendar_id,))
            boxes = cursor.fetchall()
            for box in boxes:
                cursor.execute("SELECT * FROM medicine_box_conditions WHERE box_id = %s", (box.get("id"),))
                conditions = cursor.fetchall()
                box["conditions"] = conditions
                cursor.execute("SELECT url_notice_fr FROM medicaments_afmps WHERE name ilike %s", (box.get("name"),))
                url_notice_fr = cursor.fetchone()
                if url_notice_fr:
                    box["url_notice_fr"] = url_notice_fr.get("url_notice_fr")
                else:
                    box["url_notice_fr"] = None
    if not boxes:
        return []
    return boxes

def update_box(box_id, calendar_id, data):
    name = data.get("name")
    dose = data.get("dose")
    box_capacity = data.get("box_capacity")
    stock_alert_threshold = data.get("stock_alert_threshold")
    stock_quantity = data.get("stock_quantity")
    conditions = data.get("conditions", [])

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE medicine_boxes 
                SET name = %s, dose = %s, box_capacity = %s, stock_alert_threshold = %s, stock_quantity = %s 
                WHERE id = %s AND calendar_id = %s
            """, (name, dose, box_capacity, stock_alert_threshold, stock_quantity, box_id, calendar_id))
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
    dose = data.get("dose", 0)

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO medicine_boxes (calendar_id, name, dose, box_capacity, stock_alert_threshold, stock_quantity) 
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (calendar_id, name, dose, box_capacity, stock_alert_threshold, stock_quantity))
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

def get_medicines_for_calendar(calendar_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    mb.name,
                    mb.dose,
                    c.tablet_count,
                    c.time_of_day,
                    c.interval_days,
                    c.start_date
                FROM medicine_boxes mb
                LEFT JOIN medicine_box_conditions c ON mb.id = c.box_id
                WHERE mb.calendar_id = %s
                ORDER BY mb.name, c.start_date NULLS LAST
            """, (calendar_id,))
            medicines = cursor.fetchall()

            grouped = {}
            for med in medicines:
                name = med["name"]
                dose = med["dose"]

                # Extraire les conditions uniquement
                condition = {
                    "tablet_count": med["tablet_count"],
                    "time_of_day": med["time_of_day"],
                    "interval_days": med["interval_days"],
                    "start_date": med["start_date"],
                }

                if name not in grouped:
                    grouped[name] = {
                        "dose": dose,
                        "conditions": []
                    }
                grouped[name]["conditions"].append(condition)

            return grouped
