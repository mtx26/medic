![Backend CI](https://github.com/mtx26/medic/actions/workflows/backend-ci.yml/badge.svg)
![Frontend CI](https://github.com/mtx26/medic/actions/workflows/frontend-ci.yml/badge.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mtx26_medic&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mtx26_medic)

**MediTime** est une application web moderne de gestion des prises de médicaments, conçue avec **React**, **Flask** et **Firebase** pour l’authentification. Les données sont stockées dans **Supabase**.

---

## 🚀 Fonctionnalités principales

- 🔐 Authentification Firebase (Google / email)
- 📅 Création et gestion de calendriers personnels ou partagés
- 💊 Suivi des médicaments : horaire, dose, fréquence, alternance
- 🔗 Partage de calendriers par lien public ou avec d’autres utilisateurs Firebase
- 🔔 Notifications, invitations, gestion des accès
- 🧾 Journalisation détaillée (frontend et backend)
- 🔄 Mise à jour en temps réel des données via Supabase Realtime
- 📱 Interface responsive, optimisée pour mobile

---

## 📁 Structure du projet

```
MediTime/
├── frontend/         # Application React (interface utilisateur)
├── backend/          # API Flask (auth, logique, accès à Supabase)
├── .github/          # Workflows GitHub Actions (CI/CD)
├── launch.bat        # Script de lancement local (Windows)
└── README.md         # Ce fichier
```

---

## ⚙️ Installation rapide

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate         # ou source .venv/bin/activate sur macOS/Linux
pip install -r requirements.txt
python app.py

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🧠 Technologies utilisées

- **Frontend** : React, Bootstrap, RSuite, FullCalendar, html2pdf.js
- **Backend** : Flask, Supabase (PostgreSQL via psycopg2)
- **Auth** : Firebase Authentication
- **CI/CD** : GitHub Actions, SonarCloud

---

## 📄 Licence

Ce projet est **privé**. Voir le fichier [LICENSE](./LICENSE) pour plus d’informations.
