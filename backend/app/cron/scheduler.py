import schedule
import time
from threading import Thread
from app.cron.tasks.stock import decrease_stock
from app.utils.logger import log_backend

def run_scheduler():
    # toute les semaines le lundi a 00:00
    schedule.every().monday.at("00:00").do(decrease_stock)
    # toute les jours a 00:00
    #schedule.every(1).day.at("00:00").do(decrease_stock)
    # toute les 10 secondes
    #schedule.every(10).seconds.do(decrease_stock)

    log_backend.info("⏳ [CRON] Test : cron toutes les jours initialisé")

    while True:
        schedule.run_pending()
        time.sleep(1)


def start_cron():
    t = Thread(target=run_scheduler)
    t.daemon = True
    t.start()
