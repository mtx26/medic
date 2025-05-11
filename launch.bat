@echo off

:: === Backend (Python) ===
start "Backend" cmd /k "cd /d C:\Users\mtx_2\Documents\Code\Medic\Medic\backend && .venv\Scripts\activate && pip install -r requirements.txt && python app.py"

:: === Frontend (React) ===
start "Frontend" cmd /k "cd /d C:\Users\mtx_2\Documents\Code\Medic\Medic\frontend && powershell -Command \"Set-ExecutionPolicy Unrestricted -Scope Process\" && npm run dev"