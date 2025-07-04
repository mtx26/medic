# app/cron/tasks/stock.py
from app.db.connection import get_connection
from app.services.notifications import notify_and_record
from app.utils.logger import log_backend
from app.config import Config
from urllib.parse import urljoin
from app.services.process_box_decrement import process_box_decrement
from datetime import datetime, timezone

# Vérifie les stocks faibles et envoie des notifications
def check_low_stock_and_notify():
    log_backend.info("🔍 Vérification des stocks faibles", {"origin": "CRON", "code": "STOCK_CHECK_INIT"})

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT m.id, m.name, m.stock_quantity, m.stock_alert_threshold, c.owner_uid, m.calendar_id
            FROM medicine_boxes m
            JOIN calendars c ON m.calendar_id = c.id
            WHERE m.stock_quantity <= m.stock_alert_threshold AND m.stock_alert_threshold > 0
        """)

        results = cursor.fetchall()

        for result in results:
            id_box = result.get("id")
            calendar_id = result.get("calendar_id")
            qty = result.get("stock_quantity")
            threshold = result.get("stock_alert_threshold")
            owner_uid = result.get("owner_uid")

            # TODO: ajouter le lien pour ouvrir la boîte de médicament dans l'application
            link = urljoin(Config.FRONTEND_URL or "", f"/medication/{id_box}")

            if qty <= threshold:
                try:
                    notify_and_record(
                        uid=owner_uid,
                        json_body={
                            "link": link,
                            "medication_id": id_box,
                            "medication_qty": qty,
                            "calendar_id": calendar_id,
                            "sender_uid": Config.SYSTEM_UID
                        },
                        notif_type="low_stock",
                    )
                    log_backend.info(f"✅ Notification de stock faible envoyée à {owner_uid} pour le médicament {id_box}", {"origin": "CRON", "code": "STOCK_CHECK_SUCCESS"})
                except Exception as e:
                    log_backend.error(f"Erreur lors de l'envoi de la notification de stock faible à {owner_uid}: {e}", {"origin": "CRON", "code": "STOCK_CHECK_ERROR", "error": str(e)})

        conn.close()
        log_backend.info("✅ Fin de la vérification des stocks", {"origin": "CRON", "code": "STOCK_CHECK_SUCCESS"})

    except Exception as e:
        log_backend.error(f"Erreur lors de la vérification des stocks: {e}", {"origin": "CRON", "code": "STOCK_CHECK_ERROR", "error": str(e)})

# diminuer le stock de tous les médicaments
def decrease_stock():
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # recup les calendar avec stock_decrement_mode = auto
                cursor.execute("""
                    SELECT * FROM calendars
                    WHERE stock_decrement_mode = 'auto'
                """)
                calendars = cursor.fetchall()

                for calendar in calendars:
                    calendar_id = calendar.get("id")
                    cursor.execute("""
                        SELECT * FROM medicine_boxes
                        WHERE calendar_id = %s and stock_quantity > 0
                    """, (calendar_id,))
                    results = cursor.fetchall()

                    current_date = datetime.now(timezone.utc).date()

                    for result in results:
                        id_box = result.get("id")
                        qty = result.get("stock_quantity")
                        process_box_decrement(cursor, id_box, qty, current_date)

            conn.commit()
            
        check_low_stock_and_notify()
        log_backend.info("✅ Fin de la diminution des stocks", {"origin": "CRON", "code": "STOCK_DECREASE_SUCCESS"})

    except Exception as e:
        log_backend.error(f"Erreur lors de la diminution des stocks: {e}", {"origin": "CRON", "code": "STOCK_DECREASE_ERROR", "error": str(e)})

