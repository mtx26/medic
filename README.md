![Backend CI](https://github.com/mtx26/medic/actions/workflows/backend-ci.yml/badge.svg)
![Frontend CI](https://github.com/mtx26/medic/actions/workflows/frontend-ci.yml/badge.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mtx26_medic&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mtx26_medic)
[![Backend Uptime](https://img.shields.io/uptimerobot/status/m800604412-b3dfcffa4d1ddbcda5043748?label=Backend%20Uptime)](https://stats.uptimerobot.com/grkagF4D8K)
[![Frontend Uptime](https://img.shields.io/uptimerobot/status/m800604510-1a3da771d8926ec5f29f31c3?label=Frontend%20Uptime)](https://stats.uptimerobot.com/grkagF4D8K)



**MediTime** is a modern web application for managing medication schedules, built with **React**, **Flask**, and **Firebase** for authentication. Data is stored in **Supabase**.

---

## 🚀 Key Features

* 🔐 Supabase Authentication (Google / Email)
* 📅 Create and manage personal or shared calendars
* 💊 Medication tracking: time, dose, frequency, alternation
* 🔗 Share calendars via public links or with other Firebase users
* 🔔 Notifications, invitations, access management
* 🧾 Detailed logging (frontend and backend)
* 🔄 Real-time data updates via Supabase Realtime
* 📱 Responsive interface, mobile-optimized

---

## 📁 Project Structure

```
MediTime/
├── frontend/         # React app (user interface)
├── backend/          # Flask API (auth, logic, Supabase access)
├── .github/          # GitHub Actions workflows (CI/CD)
├── launch.bat        # Local launch script (Windows)
└── README.md         # This file
```

---

## ⚙️ Quick Setup

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate         # or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
python -m app.main

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🧠 Technologies Used

* **Frontend**: React, Bootstrap, RSuite, FullCalendar
* **Backend**: Flask, Supabase (PostgreSQL via psycopg2)
* **Auth**: Firebase Authentication
* **CI/CD**: GitHub Actions, SonarCloud

---

## 📄 License

This project is **private**. See the [LICENSE](./LICENSE) file for more information.
