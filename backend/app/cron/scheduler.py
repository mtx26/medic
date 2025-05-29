import schedule
import time
from threading import Thread
from app.cron.tasks.stock import check_low_stock_and_notify, decrease_stock
from app.utils.logger import log_backend

def run_scheduler():
    schedule.every(1).day.at("00:00").do(check_low_stock_and_notify)
    schedule.every(1).day.at("00:00").do(decrease_stock)
    # schedule.every(10).seconds.do(check_low_stock_and_notify)
    # schedule.every(10).seconds.do(decrease_stock)

    log_backend.info("⏳ [CRON] Test : cron toutes les jours initialisé")

    while True:
        schedule.run_pending()
        time.sleep(1)


def start_cron():
    t = Thread(target=run_scheduler)
    t.daemon = True
    t.start()
