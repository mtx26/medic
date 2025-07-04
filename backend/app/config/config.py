# app/config/config.py

import os
from dotenv import load_dotenv

load_dotenv()  # Charge les variables du fichier .env

class Config:
    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    DEBUG = os.getenv("DEBUG", "True") == "True"

    # Supabase (utilisé avec psycopg2)
    SUPABASE_DB_HOST = os.getenv("PG_HOST")
    SUPABASE_DB_NAME = os.getenv("PG_DATABASE")
    SUPABASE_DB_USER = os.getenv("PG_USER")
    SUPABASE_DB_PASSWORD = os.getenv("PG_PASSWORD")
    SUPABASE_DB_PORT = os.getenv("PG_PORT", 5432)
    SUPABASE_PROJECT_URL = os.getenv("SUPABASE_PROJECT_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
    # Firebase
    FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS")

    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    # Autres options
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    SYSTEM_UID = os.getenv("SYSTEM_UID")

    # Frontend URL
    FRONTEND_URL = os.getenv("FRONTEND_URL")

    # Email
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = os.getenv("SMTP_PORT")
    NOTIFICATION_EMAIL_ADDRESS = os.getenv("NOTIFICATION_EMAIL_ADDRESS")
    NOTIFICATION_EMAIL_PASSWORD = os.getenv("NOTIFICATION_EMAIL_PASSWORD")

    # SMS
    TWILIO_API_KEY_SID = os.getenv("TWILIO_API_KEY_SID")
    TWILIO_API_KEY_SECRET = os.getenv("TWILIO_API_KEY_SECRET")
    TWILIO_MESSAGING_SERVICE_SID = os.getenv("TWILIO_MESSAGING_SERVICE_SID")