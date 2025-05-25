# Contribution Guide – MediTime

Thank you for contributing to MediTime, a medical calendar management application.

## Prerequisites

- **Backend**: Python 3.10+ with a virtual environment (`.venv`)
- **Frontend**: Node.js v18+
- **Firebase CLI** (if you're testing Firestore locally)

## Local Setup

```bat
:: Backend
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
python app.py

:: Frontend
cd frontend
npm install
npm start
````

Or simply run: `launch.bat` from the root directory.

## Code Conventions

* **Frontend**: `SourceTypeAction` (e.g., `TokenCalendarFetch`)
* **Backend**: formatted logs `[LEVEL] [SOURCE] [MODULE]` with `success_response` / `error_response`
* Consistent naming and clear separation between React and Flask modules

## Commit Rules

* ✅ `feat:` new feature
* 🐛 `fix:` bug fix
* 🧼 `refactor:` cleanup or improvement
