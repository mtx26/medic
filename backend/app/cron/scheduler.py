import schedule
import time
from threading import Thread
from app.cron.tasks.stock import check_low_stock_and_notify
from app.utils.logger import log_backend
import datetime

def run_scheduler():
    schedule.every(10).seconds.do(check_low_stock_and_notify)

    print("⏳ [CRON] Test : cron toutes les 30 secondes initialisé")

    while True:
        schedule.run_pending()
        time.sleep(1)


def start_cron():
    t = Thread(target=run_scheduler)
    t.daemon = True
    t.start()
