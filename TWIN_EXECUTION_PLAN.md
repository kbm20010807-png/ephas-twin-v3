# TWIN — The Real Build & Business Plan (execution-grade)

## ⚡ THE ONE DECISION THAT CHANGES EVERYTHING

Your trackers **cannot** run on your current web app. Here's the hard truth, simply:
- **Apple Health & Google Health Connect only talk to a MOBILE app on the phone** — a website can't read them.
- **On-device voice processing** (the legal-safe way) needs to run *on the phone*, not your server.
- **Push notifications** (the Daily Twin Drop — your #1 retention loop) barely work on web, fully work on mobile.

**So to make the trackers real, TWIN must become a phone app.** Good news: you don't throw away your work — the design, the AXON logic, the database, the social features all carry over. We rebuild the *shell* as a mobile app (one codebase for iPhone + Android using **React Native**, which I build with you), and keep your Flask/Postgres as the **backend brain** it talks to.

> **This is the single biggest piece of work to "make it real." Everything below assumes we're building the React Native app on top of your existing backend.**

---

## 1. WHO DOES WHAT (the 3 roles)

| 🟢 I build with you (code) | 🟡 You do manually (accounts/legal/decisions) | 💳 You pay for (services) |
|---|---|---|
| The React Native mobile app | Apple Developer + Google Play accounts | Apple Dev $99/yr, Google $25 once |
| Wearable sync (Terra/Health Connect) | Sign up for Terra, Plaid/Lean, Hume | Aggregator + AI usage (see cost table) |
| Finance ingestion (read-only) | Hire a privacy/fintech lawyer (one-time review) | Lawyer ~$500–2,000 one-time |
| On-device voice → mood (delete audio) | Approve consent screens & privacy policy wording | Hosting (Railway) ~$20–50/mo |
| AXON coaching + Twin Score fusion | Commission badge art / brand assets | RevenueCat (free under $2.5k/mo) |
| Subscription paywall + Stripe/IAP | Provide API keys (paste into Railway, never code) | Domain + email (~$15/yr + free tier) |
| Push notifications + all UI | Test on your own phone + recruit EPHAS testers | — |

**Rule we never break:** you never touch code or paste secrets into code. You paste keys into Railway's dashboard; I write the code that reads them.

---

## 2. WHAT TO BUILD FOR EACH TRACKER (final-grade, not basic)

### 💰 Finance tracker
- **You pay/sign up:** **Plaid** (US/Canada/Europe) and/or **Lean** (Gulf/Qatar). Read-only access.
- **I build:** the connect flow, transaction pull, auto-categorization, and the "spending vs your baseline" insight feeding AXON. Plus the **on-device bank-SMS parser** as the global fallback where no bank API exists (this covers Qatar *now*).
- **Manual/legal:** lawyer confirms read-only + consent wording. Never store bank logins (that's the $58M Plaid-lawsuit mistake).
- **Honest ceiling:** ~90% (connections break; you design "reconnect" nudges). Make it a **Pro** feature so the per-connection fee is covered.

### ⌚ Wearable / health tracker — **USE OTHER PEOPLE'S WATCHES, don't build one**
- **You pay/sign up:** **Terra API** (one integration = Apple Watch, Oura, Whoop, Fitbit, Garmin, Google — all of them). Free dev tier, then per-active-user.
- **I build:** the Terra connection + pulling sleep/HR/steps/HRV into the twin, with **accuracy-weighted** display (trust heart-rate & sleep-wake; show calories/sleep-stages as "trends," never hard numbers).
- **Honest ceiling:** as good as the user's device (~70–90%). You message it the Apple way — directional, improving, never "100%."

### 🎙️ Voice tracker
- **You pay/sign up:** **Hume AI** (emotion from voice) — pay-per-minute, OR run it fully on-device for max privacy.
- **I build:** voice check-in → extract mood/energy on the phone → **delete the raw audio** → store only the derived score. Never a "voiceprint."
- **Legal:** wellness wording only ("track your mood/energy" — never "detect depression"). This is the BIPA lawsuit line; the lawyer reviews it.

### 🧠 Behavior / mood tracker
- **You pay:** nothing extra (uses signals you already get).
- **I build:** fuse check-ins + wearable + (Android) screen-time + location-pattern into AXON's daily read. iOS per-app screen-time is blocked by Apple — we self-report it instead, no false promises.

---

## 3. WHAT IT COSTS — real numbers (you said you'll pay; here's the honest bill)

### One-time
| Item | Cost |
|---|---|
| Apple Developer account | **$99/yr** |
| Google Play account | **$25 once** |
| Privacy/fintech lawyer (consent + policy review) | **$500–2,000** |
| Domain | ~$12/yr |
| **Total to be "legit & launchable"** | **≈ $700–2,200** |

### Monthly (tiny until you have real users — most are free at beta)
| Service | Beta cost | Why |
|---|---|---|
| Railway (backend hosting) | $5–20 | Already using it |
| Terra (wearables) | Free dev tier → ~$ per active user | The fused-health layer |
| Plaid/Lean (finance) | Free dev (≈100 connections) → ~$0.30–1.50/connection | Read-only banking |
| Hume (voice) | Pay-as-you-go $0.064/min | Only when users record |
| LLM (AXON) | Pennies/user (Gemini Flash) | Cheap at this scale |
| RevenueCat (subscriptions) | **Free** under $2.5k/mo revenue | Handles Apple/Google billing |
| Email (Resend), Analytics (PostHog), Push (OneSignal) | **Free tiers** | Cover beta fully |

**👉 Bottom line: ~$700–2,200 one-time + ~$30–80/month gets you to a real, legal, tracker-enabled beta.** Costs only grow *after* you have paying users (and they pay for it).

---

## 4. DO YOU NEED A TEAM, OR SOLO?

**Solo + AI (me) for the build — yes, genuinely.** But pay for *narrow specialists at specific gates*, never a full-time team (a payroll is the #1 startup killer — "ran out of cash").

| Role | Hire? | When |
|---|---|---|
| **Software build** | **You + me.** No dev hire. | Now |
| **Privacy/fintech lawyer** | **Yes — essential, one-time** ($500–2k) | Before beta with real bank/health data |
| **Designer / badge artist** | Optional, commission per-asset | When you want polish |
| **Mobile contractor** | Maybe, hourly, only for a tricky native bug | If/when we hit a wall |
| **Community/marketing help** | Later, from EPHAS | At public launch |

**Verdict: you stay solo, lean on me for code, and pay a lawyer once. That's it until you have traction.**

---

## 5. PHYSICAL WATCH — the answer

**Use other people's watches. Do NOT build your own — not now, maybe never.**
- Hardware is a **cash-flow death trap**: Jawbone, Pebble, Microsoft Band, Amazon Halo, Humane Pin — **all dead.**
- The survivors (Oura, Whoop) are **subscription software companies** that happen to sell a device.
- **Your move:** plug into every watch via Terra (free to you, instant access to millions of devices). If you're ever huge and want hardware, do a **white-label partner ring** years from now — never from scratch.

---

## 6. THE BUSINESS PLAN (one page, easy to follow)

**What it is:** A private AI life-coach that fuses your real data (body, money, voice, habits) into a "digital twin" that makes you better — with a social layer for accountability.

**Who first (beachhead):** Your **EPHAS community** — don't launch to "everyone."

**How it makes money:** **Subscription (TWIN Pro)** — the daily score is free; deep insights, voice coaching, finance + form-check are paid. (Pricing decided at launch, not now.)

**The moat (why it lasts):** (1) it fuses data no rival can see together, (2) the longer you use it the more it knows you (impossible to leave), (3) "your data never leaves your phone" — a promise Meta/Google *can't* make.

**The 4 stages:**
1. **Build** (now) — React Native app + trackers on your backend.
2. **Self-test** — you run your whole life through it, fix everything.
3. **Beta** — 50–100 EPHAS people; watch if they come back daily.
4. **Launch** — App Store + Google Play, turn on Pro, then grow.

**The one number that decides it all:** *Do beta users come back on day 30?* If yes → scale. If no → fix the product first.

---

## 7. THE EXECUTION ROADMAP (in order — just follow it)

1. **Decide the mobile build** → I scaffold a React Native app wired to your Flask backend. *(I do.)*
2. **Get the accounts** → Apple Developer, Google Play, Terra, Plaid/Lean, Hume. *(You do — paste keys into Railway.)*
3. **Build the core loop first** → check-in → Twin Score → AXON insight → push notification. *(I do.)*
4. **Add trackers one at a time** → wearables (Terra) → finance → voice → behavior. *(I do; you sign up.)*
5. **Architect local-first + consent screens** → on-device processing, per-category opt-in, delete raw audio. *(I do.)*
6. **Lawyer reviews** consent + privacy policy + the voice/finance wording. *(You hire, once.)*
7. **Wire the subscription** (RevenueCat + Stripe/IAP). *(I do; you create the products.)*
8. **Self-test for weeks**, fix everything. *(You live in it; I fix.)*
9. **Closed beta in EPHAS** (TestFlight + Play internal). *(You recruit; I ship builds.)*
10. **Watch day-30 retention** → decide to scale or fix. *(Together.)*

---

*The short version: become a mobile app, plug into existing watches + banks + voice through paid connectors (cheap until you have users), keep everything on-device for legal safety, stay solo + me + a one-time lawyer, and never build hardware. ~$700–2,200 and a few months of building makes it real.*
