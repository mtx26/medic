from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from datetime import datetime
from routes import api
from function import generate_schedule
import os

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)
app.register_blueprint(api)

# Route pour React
@app.route("/calendar", methods=["GET"])
def get_calendar():
    start_str = request.args.get("startTime", default=datetime.today().strftime("%Y-%m-%d"))
    start_str = datetime.strptime(start_str, "%Y-%m-%d").date()

    schedule = generate_schedule(start_str)
    return jsonify(schedule)

# Lancement en mode Render
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Render définit automatiquement la variable PORT
    app.run(host="0.0.0.0", port=port)
