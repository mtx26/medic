from app.db.connection import get_connection
from app.services.process_box_decrement import process_box_decrement

def use_pillulier(calendar_id, start_date):
    """
    Diminue le stock de tous les médicaments du calendrier spécifié
    si le mode de décompte est manuel.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT stock_decrement_mode FROM calendars WHERE id = %s", (calendar_id,))
                row = cursor.fetchone()

                if not row:
                    return False

                mode = row.get("stock_decrement_mode")

                if mode != "manual":
                    return True

                cursor.execute("""
                    SELECT id, stock_quantity FROM medicine_boxes
                    WHERE calendar_id = %s AND box_capacity > 0
                """, (calendar_id,))
                results = cursor.fetchall()

                if not results:
                    return True

                for result in results:
                    id_box = result.get("id")
                    qty = result.get("stock_quantity")

                    process_box_decrement(cursor, id_box, qty, start_date)

                conn.commit()

        return True

    except Exception as e:
        return False
