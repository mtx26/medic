# Guide de contribution – MediTime

Merci de contribuer à MediTime, une application de gestion de calendriers médicaux.

## Prérequis

- **Backend** : Python 3.10+ avec un environnement virtuel (`.venv`)
- **Frontend** : Node.js v18+
- **Firebase CLI** (si tu fais des tests avec Firestore localement)

## Lancement local

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
```

Ou exécute simplement : `launch.bat` à la racine.

## Convention de code

- **Frontend :** `SourceTypeAction` (ex: `TokenCalendarFetch`)
- **Backend :** logs formatés `[LEVEL] [SOURCE] [MODULE]` avec `success_response` / `error_response`
- Respect des noms de modules et des séparations React/Flask

## Règles de commit

- ✅ `feat:` nouvelle fonctionnalité
- 🐛 `fix:` correction de bug
- 🧼 `refactor:` nettoyage ou amélioration
