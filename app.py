from flask import Flask, render_template, redirect, session, request

app = Flask(__name__)
app.secret_key = 'TWIN-EPHAS-V3-PROD'

DEMO_USER = {
    "name": "Alex",
    "first": "Alex",
    "job": "Product Builder",
    "city": "Dubai, UAE",
    "bio": "Building things that actually matter. Focused on discipline, depth, and long-term growth.",
    "level": 7,
    "level_title": "Discipline Seeker",
    "xp": 2450,
    "xp_needed": 3000,
    "progress_pct": 72,
    "streak": 12,
    "best_streak": 14,
    "total_checkins": 38,
    "email": "alex@ephas.com",
    "member_since": "Jan 2024",
}

DEMO_STATS = {
    "avg_sleep": 7.2,
    "avg_energy": 7.8,
    "avg_mood": 8.1,
    "avg_productivity": 7.5,
    "total_checkins": 38,
    "best_streak": 14,
    "habits": [
        {"name": "Morning Workout", "count": 30, "pct": 79},
        {"name": "Cold Shower",     "count": 24, "pct": 63},
        {"name": "Deep Reading",    "count": 19, "pct": 50},
        {"name": "Journaling",      "count": 16, "pct": 42},
        {"name": "Meditation",      "count": 12, "pct": 32},
    ],
    "domains": [
        {"name": "Mind",      "pct": 82, "trend": "+4"},
        {"name": "Body",      "pct": 68, "trend": "+2"},
        {"name": "Wealth",    "pct": 55, "trend": "+8"},
        {"name": "Purpose",   "pct": 79, "trend": "+1"},
        {"name": "Social",    "pct": 61, "trend": "-2"},
        {"name": "Wellbeing", "pct": 73, "trend": "+5"},
    ],
    "weekly": [7.0, 7.5, 8.0, 7.8, 8.2, 7.5, 8.1],
    "days":   ["M","T","W","T","F","S","S"],
    "checked": [True, True, True, True, True, False, False],
}

DEMO_FEED = [
    {"user":"Marcus R.","init":"M","time":"2h ago",
     "text":"12-day streak broken. No excuses. Back at 5AM tomorrow.","likes":47,"comments":12},
    {"user":"Jordan L.","init":"J","time":"5h ago",
     "text":"4-hour deep work session. Phone off, notifications off. This is what locked-in looks like.","likes":93,"comments":8},
    {"user":"Priya K.","init":"P","time":"Yesterday",
     "text":"Reading 30 min daily for 3 weeks straight. The compounding is real. Mind domain at 82%.","likes":124,"comments":19},
    {"user":"Sam T.","init":"S","time":"2d ago",
     "text":"Cold showers every day for 30 days. Not easy. Worth it.","likes":211,"comments":31},
]

DEMO_THREADS = [
    {"user":"Marcus R.","init":"M","preview":"Bro that discipline post hit different","time":"2m","unread":2},
    {"user":"Jordan L.","init":"J","preview":"You available for an accountability call?","time":"1h","unread":0},
    {"user":"Priya K.","init":"P","preview":"Just hit my 30-day reading streak!","time":"Yesterday","unread":0},
    {"user":"Sam T.","init":"S","preview":"What's your morning routine looking like?","time":"2d","unread":0},
]

def auth():
    return session.get('logged_in', False)

@app.route('/')
def index():
    return redirect('/home' if auth() else '/login')

@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        session['logged_in'] = True
        return redirect('/home')
    return render_template('login.html', auth_page=True)

@app.route('/signup', methods=['GET','POST'])
def signup():
    if request.method == 'POST':
        session['logged_in'] = True
        return redirect('/home')
    return render_template('signup.html', auth_page=True)

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')

@app.route('/home')
def home():
    if not auth(): return redirect('/login')
    return render_template('home.html', u=DEMO_USER, stats=DEMO_STATS, active='home')

@app.route('/checkin')
def checkin():
    if not auth(): return redirect('/login')
    return render_template('checkin.html', u=DEMO_USER, active='checkin')

@app.route('/checkout')
def checkout():
    if not auth(): return redirect('/login')
    return render_template('checkout.html', u=DEMO_USER, active='checkout')

@app.route('/analytics')
def analytics():
    if not auth(): return redirect('/login')
    return render_template('analytics.html', u=DEMO_USER, stats=DEMO_STATS, active='analytics')

@app.route('/grow')
def grow():
    if not auth(): return redirect('/login')
    return render_template('grow.html', u=DEMO_USER, feed=DEMO_FEED, active='grow')

@app.route('/profile')
def profile():
    if not auth(): return redirect('/login')
    return render_template('profile.html', u=DEMO_USER, stats=DEMO_STATS, active='profile')

@app.route('/messages')
def messages():
    if not auth(): return redirect('/login')
    return render_template('messages.html', u=DEMO_USER, threads=DEMO_THREADS, active='messages')

@app.route('/settings')
def settings():
    if not auth(): return redirect('/login')
    return render_template('settings.html', u=DEMO_USER, active='settings')

@app.route('/calendar')
def calendar():
    if not auth(): return redirect('/login')
    return render_template('calendar.html', u=DEMO_USER, stats=DEMO_STATS, active='analytics')

@app.route('/create')
def create():
    if not auth(): return redirect('/login')
    return render_template('create.html', u=DEMO_USER, active='grow')

@app.route('/axon-settings')
def axon_settings():
    if not auth(): return redirect('/login')
    return render_template('axon_settings.html', u=DEMO_USER, active='settings')

@app.route('/apply-pro')
def apply_pro():
    if not auth(): return redirect('/login')
    return render_template('apply_pro.html', u=DEMO_USER, active='settings')

if __name__ == '__main__':
    app.run(port=5001, debug=True)
