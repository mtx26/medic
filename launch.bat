@echo off

:: === Backend (Python) ===
start "Backend" cmd /k "cd /d C:\Users\mtx_2\Documents\Code\Medic\MediTime\backend && .venv\Scripts\activate && pip install -r requirements.txt && python -m app.main"

:: === Frontend (React) ===
start "Frontend" cmd /k "cd /d C:\Users\mtx_2\Documents\Code\Medic\MediTime\frontend && powershell -Command \"Set-ExecutionPolicy Unrestricted -Scope Process\" && npm install && npm run dev"