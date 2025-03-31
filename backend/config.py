import os

# Chemin absolu du dossier où se trouve ce fichier
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    # Configuration de la base de données SQLite
    # SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(basedir, 'database.db')}"
    # SQLALCHEMY_TRACK_MODIFICATIONS = False  # Désactiver les notifications de modifications (optimisation)

    # Configuration optionnelle pour la sécurité
    SECRET_KEY = os.environ.get("SECRET_KEY") or "supersecretkey"

    # Configuration du mode debug (désactiver en production)
    DEBUG = True
