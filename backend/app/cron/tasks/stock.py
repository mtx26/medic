# app/cron/tasks/stock.py
from app.db.connection import get_connection
from app.services.notifications import notify_and_record
from app.utils.logger import log_backend
from app.config.config import Config
from urllib.parse import urljoin


# Vérifie les stocks faibles et envoie des notifications
def check_low_stock_and_notify():
    log_backend.info("🔍 Vérification des stocks faibles", {"origin": "CRON", "code": "STOCK_CHECK_INIT"})

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT m.id, m.name, m.stock_quantity, m.stock_alert_threshold, c.owner_uid, m.calendar_id
            FROM medicine_boxes m
            JOIN calendars c ON m.calendar_id = c.id
            WHERE m.stock_quantity <= m.stock_alert_threshold AND m.stock_quantity > 0 AND m.stock_alert_threshold > 0
        """)

        results = cur.fetchall()

        for result in results:
            id = result.get("id")
            calendar_id = result.get("calendar_id")
            name = result.get("name")
            qty = result.get("stock_quantity")
            threshold = result.get("stock_alert_threshold")
            owner_uid = result.get("owner_uid")

            title = "Stock faible"
            body = f"Le médicament '{name}' est presque épuisé ({qty} restants)."
            link = urljoin(Config.FRONTEND_URL, f"/medication/{id}")
            print(link)
            try:
                notify_and_record(
                    uid=owner_uid,
                    title=title,
                    link=link,
                    body=body,
                    notif_type="low_stock",
                    sender_uid=Config.SYSTEM_UID,
                    calendar_id=calendar_id
                )
                log_backend.info(f"✅ Notification de stock faible envoyée à {owner_uid} pour le médicament {id}", {"origin": "CRON", "code": "STOCK_CHECK_SUCCESS"})
            except Exception as e:
                log_backend.error(f"Erreur lors de l'envoi de la notification de stock faible à {owner_uid}: {e}", {"origin": "CRON", "code": "STOCK_CHECK_ERROR", "error": str(e)})

        conn.close()
        log_backend.info("✅ Fin de la vérification des stocks", {"origin": "CRON", "code": "STOCK_CHECK_SUCCESS"})

    except Exception as e:
        log_backend.error(f"Erreur lors de la vérification des stocks: {e}", {"origin": "CRON", "code": "STOCK_CHECK_ERROR", "error": str(e)})

