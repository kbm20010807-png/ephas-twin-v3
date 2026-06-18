import os
from datetime import datetime
from flask import Flask, render_template, redirect, session, request
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'TWIN-EPHAS-V3-DEV-ONLY')

# --- Database: Railway Postgres in production, local SQLite for dev ---
db_url = os.environ.get('DATABASE_URL') or os.environ.get('DATABASE_PUBLIC_URL') or ''
if db_url.startswith('postgres://'):
    db_url = db_url.replace('postgres://', 'postgresql://', 1)  # SQLAlchemy needs postgresql://
if not db_url:
    db_url = 'sqlite:///twin_local.db'
app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(60), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(120), nullable=False, default='')
    bio = db.Column(db.String(300), default='')
    city = db.Column(db.String(120), default='')
    job = db.Column(db.String(120), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, pw):
        self.password_hash = generate_password_hash(pw)

    def check_password(self, pw):
        return check_password_hash(self.password_hash, pw)


with app.app_context():
    db.create_all()

DEMO_USER = {
    "name": "You",
    "first": "You",
    "job": "",
    "city": "",
    "bio": "",
    "level": 1,
    "level_title": "Newcomer",
    "xp": 0,
    "xp_needed": 100,
    "progress_pct": 0,
    "streak": 0,
    "best_streak": 0,
    "total_checkins": 0,
    "email": "",
    "member_since": "Just now",
    "followers": 0,
    "following": 0,
    "subscribed": 0,
}

DEMO_STATS = {
    "avg_sleep": 0,
    "avg_energy": 0,
    "avg_mood": 0,
    "avg_productivity": 0,
    "total_checkins": 0,
    "best_streak": 0,
    "habits": [],
    "domains": [
        {"name": "Mind",      "pct": 0, "trend": "+0"},
        {"name": "Body",      "pct": 0, "trend": "+0"},
        {"name": "Wealth",    "pct": 0, "trend": "+0"},
        {"name": "Purpose",   "pct": 0, "trend": "+0"},
        {"name": "Social",    "pct": 0, "trend": "+0"},
        {"name": "Wellbeing", "pct": 0, "trend": "+0"},
    ],
    "weekly": [0, 0, 0, 0, 0, 0, 0],
    "days":   ["M","T","W","T","F","S","S"],
    "checked": [False, False, False, False, False, False, False],
}

DEMO_ZONES = [
    {"name":"Mindset",        "icon":"brain",       "members":"12.4K","posts":847,  "color":"#6C63FF","tag":"mindset"},
    {"name":"Fitness",        "icon":"dumbbell",    "members":"18.2K","posts":1204, "color":"#22C55E","tag":"fitness"},
    {"name":"Wealth",         "icon":"trending-up", "members":"9.8K", "posts":623,  "color":"#D4AA35","tag":"wealth"},
    {"name":"Sales",          "icon":"bar-chart-2", "members":"5.3K", "posts":412,  "color":"#F97316","tag":"sales"},
    {"name":"Entrepreneurship","icon":"briefcase",  "members":"8.1K", "posts":534,  "color":"#EC4899","tag":"business"},
    {"name":"Nutrition",      "icon":"apple",       "members":"7.4K", "posts":389,  "color":"#14B8A6","tag":"nutrition"},
    {"name":"Marathon",       "icon":"activity",    "members":"3.9K", "posts":267,  "color":"#EF4444","tag":"marathon"},
    {"name":"Coaching",       "icon":"users",       "members":"4.2K", "posts":198,  "color":"#8B5CF6","tag":"coaching"},
    {"name":"Spirituality",   "icon":"sun",         "members":"6.1K", "posts":445,  "color":"#F59E0B","tag":"spirituality"},
    {"name":"Productivity",   "icon":"zap",         "members":"11.3K","posts":789,  "color":"#3B82F6","tag":"productivity"},
]

DEMO_QUESTS = {
    "daily": [
        {"id":"d1","title":"Check In Today","desc":"Complete your daily morning check-in","xp":50,"icon":"check-circle","progress":0,"done":False,"cat":"Habit"},
        {"id":"d2","title":"Post to the Community","desc":"Share a thought, update, or reflection","xp":30,"icon":"edit-3","progress":0,"done":False,"cat":"Social"},
        {"id":"d3","title":"Read One Thread","desc":"Open and read a full thread in Grow","xp":20,"icon":"book-open","progress":0,"done":False,"cat":"Growth"},
    ],
    "weekly": [
        {"id":"w1","title":"7-Day Streak","desc":"Check in every day this week","xp":200,"icon":"flame","progress":0,"done":False,"cat":"Streak"},
        {"id":"w2","title":"Engage 5 Posts","desc":"Like or comment on 5 community posts","xp":80,"icon":"heart","progress":0,"done":False,"cat":"Social"},
        {"id":"w3","title":"Explore the Community","desc":"Discover and follow someone new","xp":100,"icon":"compass","progress":0,"done":False,"cat":"Community"},
        {"id":"w4","title":"Raise a Domain +5%","desc":"Improve any life domain by 5% this week","xp":150,"icon":"trending-up","progress":0,"done":False,"cat":"Growth"},
        {"id":"w5","title":"Complete a Course Module","desc":"Finish at least one module in any course","xp":120,"icon":"graduation-cap","progress":0,"done":False,"cat":"Learning"},
    ],
    "monthly": [
        {"id":"m1","title":"30-Day Streak","desc":"Check in every day for a full month","xp":1000,"icon":"calendar","progress":0,"done":False,"cat":"Streak"},
        {"id":"m2","title":"Publish a Course","desc":"Create and publish your first course as a Professional","xp":500,"icon":"graduation-cap","progress":0,"done":False,"cat":"Creator"},
        {"id":"m3","title":"Hit Level 10","desc":"Reach Level 10 through XP and check-ins","xp":750,"icon":"star","progress":0,"done":False,"cat":"Growth"},
    ],
    "seasonal": [
        {"id":"s1","title":"90-Day Discipline Challenge","desc":"Check in daily for 90 consecutive days. No breaks. No excuses. This is where legends are made.","xp":5000,"icon":"award","progress":0,"done":False,"cat":"Legendary","days":90,"current":0},
    ],
}

DEMO_NOTIFICATIONS = []

DEMO_FEED = []

DEMO_THREADS = []

def current_user():
    uid = session.get('user_id')
    return db.session.get(User, uid) if uid else None

def auth():
    return current_user() is not None

def user_ctx():
    """Template context: real logged-in user merged over demo defaults so pages never break."""
    u = dict(DEMO_USER)
    cu = current_user()
    if cu:
        full = cu.name or cu.username
        u.update({
            'name': full,
            'first': full.split(' ')[0],
            'username': cu.username,
            'email': cu.email,
            'bio': cu.bio or u['bio'],
            'city': cu.city or u['city'],
            'job': cu.job or u['job'],
            'member_since': cu.created_at.strftime('%b %Y') if cu.created_at else u['member_since'],
        })
    return u

@app.route('/')
def index():
    return redirect('/home' if auth() else '/login')

@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        identifier = (request.form.get('email') or '').strip().lower()
        pw = request.form.get('password') or ''
        user = User.query.filter((User.email == identifier) | (User.username == identifier)).first()
        if user and user.check_password(pw):
            session.clear()
            session['user_id'] = user.id
            return redirect('/home')
        return render_template('login.html', auth_page=True, error='Invalid email or password.')
    if auth():
        return redirect('/home')
    return render_template('login.html', auth_page=True)

@app.route('/signup', methods=['GET','POST'])
def signup():
    if request.method == 'POST':
        name = (request.form.get('name') or '').strip()
        email = (request.form.get('email') or '').strip().lower()
        pw = request.form.get('password') or ''
        username = (request.form.get('username') or email.split('@')[0]).strip().lower()
        err = None
        if not email or '@' not in email:
            err = 'Enter a valid email address.'
        elif len(pw) < 8:
            err = 'Password must be at least 8 characters.'
        elif User.query.filter_by(email=email).first():
            err = 'An account with this email already exists.'
        if err:
            return render_template('signup.html', auth_page=True, error=err)
        base = ''.join(c for c in (username or 'user') if c.isalnum() or c in '_.') or 'user'
        username = base
        i = 1
        while User.query.filter_by(username=username).first():
            i += 1
            username = f"{base}{i}"
        user = User(email=email, username=username, name=name or base)
        user.set_password(pw)
        db.session.add(user)
        db.session.commit()
        session.clear()
        session['user_id'] = user.id
        return redirect('/home')
    if auth():
        return redirect('/home')
    return render_template('signup.html', auth_page=True)

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')

@app.route('/home')
def home():
    if not auth(): return redirect('/login')
    return render_template('home.html', u=user_ctx(), stats=DEMO_STATS, active='home')

@app.route('/checkin')
def checkin():
    if not auth(): return redirect('/login')
    return render_template('checkin.html', u=user_ctx(), active='checkin')

@app.route('/checkout')
def checkout():
    if not auth(): return redirect('/login')
    return render_template('checkout.html', u=user_ctx(), active='checkout')

@app.route('/analytics')
def analytics():
    if not auth(): return redirect('/login')
    return render_template('analytics.html', u=user_ctx(), stats=DEMO_STATS, active='analytics')

@app.route('/grow')
def grow():
    if not auth(): return redirect('/login')
    return render_template('grow.html', u=user_ctx(), feed=DEMO_FEED, zones=DEMO_ZONES, active='grow')

@app.route('/profile')
def profile():
    if not auth(): return redirect('/login')
    return render_template('profile.html', u=user_ctx(), stats=DEMO_STATS, active='profile')

@app.route('/messages')
def messages():
    if not auth(): return redirect('/login')
    return render_template('messages.html', u=user_ctx(), threads=DEMO_THREADS, active='messages')

@app.route('/settings')
def settings():
    if not auth(): return redirect('/login')
    return render_template('settings.html', u=user_ctx(), active='settings')

@app.route('/calendar')
def calendar():
    if not auth(): return redirect('/login')
    return render_template('calendar.html', u=user_ctx(), stats=DEMO_STATS, active='analytics')

@app.route('/create')
def create():
    if not auth(): return redirect('/login')
    return render_template('create.html', u=user_ctx(), active='grow')

@app.route('/axon-settings')
def axon_settings():
    if not auth(): return redirect('/login')
    return render_template('axon_settings.html', u=user_ctx(), active='settings')

@app.route('/apply-pro')
def apply_pro():
    if not auth(): return redirect('/login')
    return render_template('apply_pro.html', u=user_ctx(), active='settings')

@app.route('/edit-profile')
def edit_profile():
    if not auth(): return redirect('/login')
    return render_template('edit_profile.html', u=user_ctx(), active='profile')

@app.route('/twin-pro')
def twin_pro():
    if not auth(): return redirect('/login')
    return render_template('twin_pro.html', u=user_ctx(), active='settings')

@app.route('/quests')
def quests():
    if not auth(): return redirect('/login')
    return render_template('quests.html', u=user_ctx(), quests=DEMO_QUESTS, active='home')

@app.route('/notifications')
def notifications():
    if not auth(): return redirect('/login')
    return render_template('notifications.html', u=user_ctx(), notifs=DEMO_NOTIFICATIONS, active='home')

if __name__ == '__main__':
    app.run(port=5001, debug=True)
