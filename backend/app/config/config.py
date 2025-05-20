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
    SUPABASE_DB_PORT = int(os.getenv("PG_PORT", 5432))

    # Firebase
    FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS")

    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    # Autres options
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
