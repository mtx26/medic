# app/cron/tasks/stock.py
from app.db.connection import get_connection
from app.services.notifications import notify_and_record
from app.utils.logger import log_backend
from app.config.config import Config

def check_low_stock_and_notify():
    log_backend.info("🔍 Vérification des stocks faibles", {"origin": "CRON", "code": "STOCK_CHECK_INIT"})

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT m.id, m.name, m.stock_quantity, m.stock_alert_threshold, c.owner_uid, m.calendar_id
            FROM medicines m
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
            try:
                notify_and_record(
                    uid=owner_uid,
                    title=title,
                    body=body,
                    notif_type="low_stock",
                    sender_uid=Config.SYSTEM_UID,
                    calendar_id=calendar_id
                )
                print(f"✅ Notification de stock faible envoyée à {owner_uid}")
            except Exception as e:
                print(f"❌ Erreur pour la notif d'un stock faible à {owner_uid}: {e}")

        conn.close()
        print("✅ Fin de la vérification des stocks")

    except Exception as e:
        print(f"❌ Erreur globale tâche stock: {e}")