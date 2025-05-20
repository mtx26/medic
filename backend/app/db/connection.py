# db.py
import psycopg2
from psycopg2.extras import RealDictCursor
import os

# 🔒 Optionnel : charge les variables depuis .env
from dotenv import load_dotenv
load_dotenv()

def get_connection():
    return psycopg2.connect(
        host=os.getenv("PG_HOST"),
        dbname=os.getenv("PG_DATABASE"),
        user=os.getenv("PG_USER"),
        password=os.getenv("PG_PASSWORD"),
        port=os.getenv("PG_PORT", 5432),
        sslmode="require",
        cursor_factory=RealDictCursor
    )
