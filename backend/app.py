from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from datetime import datetime, timedelta
from routes import api
import json
from function import generate_schedule 


app = Flask(__name__)
CORS(app)  # Autorise les requêtes du frontend
app.config.from_object(Config)
app.register_blueprint(api)

# Lancer la génération
start_date = datetime(2025, 4, 1).date()
schedule = generate_schedule(start_date)



# Route pour React
@app.route("/calendar", methods=["GET"])
def get_calendar():
    start_str = request.args.get("startTime", default=datetime.today().strftime("%Y-%m-%d"))
    start_str = datetime.strptime(start_str, "%Y-%m-%d").date()

    schedule = generate_schedule(start_str)
    return jsonify(schedule)


if __name__ == '__main__':
    app.run(debug=True)
