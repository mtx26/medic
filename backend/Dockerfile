FROM python:3.10

WORKDIR /app

# Copier uniquement le fichier requirements pour profiter du cache Docker
COPY requirements.txt /app/

RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste des fichiers
COPY . /app

EXPOSE 5000

CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "app.main:app"]
