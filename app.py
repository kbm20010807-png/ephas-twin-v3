from flask import Flask, render_template

app = Flask(__name__)

PROFILE = {
    "name": "Khalid",
    "job": "Founder & Builder",
    "city": "Doha, Qatar",
    "level": 7,
    "level_title": "Discipline Seeker",
    "xp": 2450,
    "xp_needed": 3000,
    "progress_pct": 72,
    "streak": 12,
    "total_checkins": 38,
}

DEMO_STATS = {
    "avg_sleep": 7.2,
    "avg_energy": 7.8,
    "avg_mood": 8.1,
    "total_checkins": 38,
    "best_streak": 14,
    "habits": [
        {"name": "Morning Prayer", "count": 30},
        {"name": "Cold Shower", "count": 24},
        {"name": "Reading", "count": 19},
        {"name": "Gym", "count": 16},
        {"name": "Journaling", "count": 12},
    ]
}

@app.route("/")
@app.route("/home")
def home():
    return render_template("home.html", profile=PROFILE)

@app.route("/analytics")
def analytics():
    return render_template("analytics.html", profile=PROFILE, stats=DEMO_STATS)

@app.route("/grow")
def grow():
    return render_template("grow.html", profile=PROFILE)

@app.route("/profile")
def profile():
    return render_template("profile.html", profile=PROFILE)

@app.route("/messages")
def messages():
    return render_template("messages.html", profile=PROFILE)

@app.route("/checkin")
def checkin():
    return render_template("checkin.html", profile=PROFILE)

if __name__ == "__main__":
    app.run(port=5001, debug=True)
