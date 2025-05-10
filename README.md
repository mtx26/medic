# MediTime

![Backend CI](https://github.com/mtx26/medic/actions/workflows/backend-ci.yml/badge.svg)
![Frontend CI](https://github.com/mtx26/medic/actions/workflows/frontend-ci.yml/badge.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mtx26_medic&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mtx26_medic)

**MediTime** est une application de gestion des calendriers de prise de médicaments, construite avec React (frontend), Flask (backend) et Firebase (authentification et stockage).

## 🚀 Fonctionnalités

- Authentification Firebase (Google/email)
- Création de calendriers personnels ou partagés
- Gestion des médicaments (horaire, dose, alternance)
- Génération automatique de plannings mensuels PDF
- Système de partage par lien public ou utilisateur Firebase
- Notifications, journalisation, et interface mobile-friendly

## 📁 Structure du projet

```
MediTime/
├── frontend/         # Application React (interface)
├── backend/          # API Flask avec Firebase et Firestore
├── launch.bat        # Script de démarrage local (Windows)
└── .github/          # Workflows GitHub et fichiers de contribution
```

## 🛠️ Installation rapide

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Frontend
cd frontend
npm install
npm start
```

## 🧠 Technologies utilisées

- React + Bootstrap
- Flask + Firebase Admin SDK + Firestore
- Firebase Authentication
- GitHub Actions (CI)
- ReportLab, FullCalendar, RSuite

## 📄 Licence

Ce projet est privé. Voir le fichier [LICENSE](./LICENSE) pour plus d’informations.
```

💡 J’ai remplacé `<utilisateur>/<repo>` par `mtx26/medic` dans les badges.

Souhaites-tu aussi que je t’ajoute une section `📸 Captures d’écran` ou `📬 Contact` ?
