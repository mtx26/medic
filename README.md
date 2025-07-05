![Backend CI](https://github.com/mtx26/medic/actions/workflows/backend-ci.yml/badge.svg)
![Frontend CI](https://github.com/mtx26/medic/actions/workflows/frontend-ci.yml/badge.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mtx26_medic&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mtx26_medic)
[![Backend Uptime](https://img.shields.io/uptimerobot/status/m800604412-b3dfcffa4d1ddbcda5043748?label=Backend%20Uptime)](https://stats.uptimerobot.com/grkagF4D8K)
[![Frontend Uptime](https://img.shields.io/uptimerobot/status/m800604510-1a3da771d8926ec5f29f31c3?label=Frontend%20Uptime)](https://stats.uptimerobot.com/grkagF4D8K)



**MediTime** is a modern web application for managing medication schedules, built with **React** and **Flask**. Data is stored in **Supabase** and authentication relies on Supabase JWT tokens.

---

## 🚀 Key Features

* 🔐 Supabase Authentication (Google / Email)
* 📅 Create and manage personal or shared calendars
* 💊 Medication tracking: time, dose, frequency, alternation
* 🔗 Share calendars via public links or with other authenticated users
* 🔔 Notifications, invitations, access management
* 🧾 Detailed logging (frontend and backend)
* 🔄 Real-time data updates via Supabase Realtime
* 🌍 Multilingual interface powered by i18next
* ⏰ Automatic stock checks via daily cron tasks
* ☁️ Cloudinary uploads and Twilio/SMTP notifications
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

* **Frontend**: React, Bootstrap, RSuite, FullCalendar, i18next
* **Backend**: Flask with Supabase (PostgreSQL via psycopg2)
* **Auth**: Supabase JWT (Firebase only for FCM push messages)
* **Storage**: Cloudinary for uploads
* **Messaging**: Twilio SMS, SMTP email, Firebase Cloud Messaging
* **Scheduling**: `schedule` library for cron tasks
* **Internationalization**: Google Cloud Translate script
* **CI/CD**: GitHub Actions, SonarCloud, UptimeRobot
* **Env Management**: python-dotenv / dotenv

---

## 🌐 External Services & Integrations

* **Supabase** – primary database and authentication provider.
* **Firebase Cloud Messaging** – push notifications for web and mobile.
* **Google Cloud Translate** – automatic generation of translation files.
* **Cloudinary** – storage of uploaded images.
* **Twilio** – sending SMS notifications.
* **SMTP** – outgoing email notifications.
* **UptimeRobot** – monitoring backend and frontend availability.
* **schedule** – cron-style background tasks for stock management.

The frontend currently supports the following languages: English, French, Spanish, German, Italian, Japanese, Chinese, Portuguese and Russian.

---

## 📄 License

This project is **private**. See the [LICENSE](./LICENSE) file for more information.
