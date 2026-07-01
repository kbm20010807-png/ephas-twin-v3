# TWIN — the ONE-APP architecture: AXON fusion, database, global-legal, and social

A buildable technical spec for a solo founder. One Flask + Railway Postgres app today, wrapped as a Capacitor native app tomorrow. Everything fuses into AXON; everything obeys the same design laws (manual-OR-auto, local-first for sensitive data, editable estimates, per-category consent, wellness-not-diagnosis).

---

## 0. The one mental model

Three layers, one database, one AI, one social projection:

```
[ CONNECTORS ]  watches · banks/SMS · voice · food photos · pose · behavior · manual "+"
      │  each has a per-source Mapper → canonical shape
      ▼
[ VAULT ]  observations (raw, tall) → features (baselines/z) → insights (correlations) → memories (NL + embeddings)
      │  RLS + per-user key + consent gate on every read/write
      ▼
[ AXON ]  context = state block + pgvector memory retrieval + rolling summary  →  tiered LLM  →  proactive triggers
      │  Projection service: signed, minimized, spoiler-safe artifacts ONLY
      ▼
[ SOCIAL ]  pods/leagues on verified DELTAS · Twin Card · share to IG/TikTok/X (image, never data)
```

The entire novelty ("center cell" = health+finance+voice fused) lives in the Vault's canonical model. Get that right and everything above it is plumbing.

---

## PART 1 — Fusion: how all trackers become one twin AXON can reason over

### 1.1 The fusion floor: one append-only `observations` table

Never build a table per source. Every stream — a Whoop HRV point, a bank transaction, a voice valence score, a photographed meal's macros, a workout rep count, a screen-time tally, a manual mood tap — becomes one row of the same shape:

```sql
-- TimescaleDB hypertable, partitioned by ts
observations(
  event_id     bigint,
  user_id      uuid,            -- RLS + partition secondary key
  ts           timestamptz,     -- UTC
  local_ts     timestamp,       -- for circadian reasoning
  tz           text,
  source       text,            -- whoop|garmin|applehealth|plaid|sms|voice|photo|pose|manual
  domain       text,            -- health|finance|voice|diet|fitness|behavior
  metric       text,            -- hrv_rmssd|txn_amount|valence|kcal|reps|screen_min|mood
  value_num    double precision,
  value_text   text,
  unit         text,
  confidence   real,            -- 0..1 (AI estimates land here, editable ones too)
  source_kind  text,            -- 'auto' | 'manual'  (encodes manual-OR-auto)
  raw_json     jsonb,           -- normalized payload for reprocessing; NEVER raw audio/bank PDF
  edited_by_user bool default false,  -- editable-AI-estimates law
  ingested_at  timestamptz
)
```

**Why tall/EAV-over-time (HealthKit HKSample / OpenTelemetry pattern):** adding Amazfit or a new tracker = one new `source` value + one Mapper. Zero migration. Keeping `raw_json` lets you re-derive metrics when your logic improves. `confidence` + `edited_by_user` bake in your "editable AI estimates" law: a photo→macros row lands at confidence 0.6, and a user edit overwrites `value_num`, sets `edited_by_user=true`, `confidence=1.0`.

**Per-source Mapper contract** — every connector implements one function:
```
map(raw_payload) -> [{domain, metric, value_num, unit, confidence, source_kind}]
```
Terra/Vital already normalize 500+ watches into one JSON schema, so your health Mapper is thin. Plaid/SMS-parse both emit `finance/txn_amount`. Voice emits `voice/valence` + `voice/arousal` (never words). Pose emits `fitness/reps`, `fitness/form_score`. This is what makes "all watches, both OSes" tractable — the app never knows or cares which watch; it only sees canonical metrics.

### 1.2 The derived layer AXON actually reads (raw is too noisy for an LLM)

Two scheduled/derived stores sit above `observations`:

**`features`** (nightly job, keyed `user_id, metric, date`): per-user **rolling baselines and deltas**. Compute with **EWMA** (exponentially weighted moving average) so gaps in wearable data don't break the baseline:
```
baseline_28d, stddev, today_value,
z_score = (today - baseline)/stddev,
pct_change, trend_slope_7d, trend_slope_28d, percentile_vs_self
```
Baselines are **per-user** — HRV 45 is normal for one person, alarming for another. Never use population thresholds for personal signals.

**`memories`** (daily + event-triggered): human-readable twin memories with a pgvector embedding:
> *"Jun 28: sleep 5.2h, HRV −30% vs baseline, voice valence low, spent 340 QAR on takeout."*

AXON reasons over **features (numbers) + retrieved memories (narrative)** — never over millions of raw rows.

### 1.3 Cross-signal correlation = stats layer, NOT the LLM

To discover "poor sleep today → overspend tomorrow," build a per-user **daily feature matrix** and run scheduled **Pearson/Spearman + lag-1** correlation. Populate an `insights` table with significant pairs. **Gate: ≥14 paired days AND |r|>0.4.** The LLM's job is to *narrate* a discovered insight, never to compute it (LLMs are unreliable at numeric correlation over many points).

**The system-wide division of labor — memorize this:**
| Layer | Owns |
|---|---|
| **Rules** | Known/safety thresholds (HRV z<−2 AND low sleep → flag) |
| **Stats/ML** | Baselines (EWMA) + discovering unknown cross-signal patterns |
| **LLM (AXON)** | Synthesis, explanation, conversation, tone, personalization |

### 1.4 AXON's context = personal-RAG (3 parts)

Assemble each turn from:
- **(A) State block** — deterministic snapshot: today's key features + z-scores, active insights, streaks, goals, last check-in. Cheap, always fresh, no retrieval.
- **(B) Retrieved memories** — embed the user's message (or current state), pgvector **HNSW** ANN search (`m=16, ef_construction=64`) over `memories`, top 5–10. **ALWAYS metadata-filter by `user_id`** so twins never leak across users.
- **(C) Rolling summaries** — hierarchical map-reduce: daily → weekly → monthly, each an LLM paragraph stored as a memory. The weekly summarizes 7 *daily summaries*, not 7 days of raw events, keeping context bounded.

Given your RTX 4080 + local-first stance: **run embeddings locally** (BGE-small / nomic-embed via Ollama) — free, private. Keep the embedding model **fixed** once you index (changing it forces re-embedding every memory).

### 1.5 Tiered model routing (cadence × stakes × context-size)

| Tier | Model | Work |
|---|---|---|
| **1 (free, local)** | Ollama llama3.1:8b | Daily summaries, state-block→sentence, trivial chat, trigger triage |
| **2 (hosted)** | Sonnet/Opus | Weekly/monthly synthesis, cross-signal story-finding, empathetic proactive outreach |

This keeps ~95% of generations free (your standing Ollama preference) and pays only for rare high-value synthesis and delicate outreach.

### 1.6 Proactive triggers (event-driven rules → gate → LLM compose → push)

Proactivity is **not** the LLM polling. It's a declarative engine:
```sql
triggers(name, condition_expr, cooldown_h, severity, domain, enabled)
-- e.g. "recovery_risk": hrv_z < -1.5 AND voice_valence_z < -1 AND sleep_hours < baseline*0.8
```
Flow: new features land (or cron) → **rule evaluator** → candidate queue → **anti-spam gate** (debounce same trigger 48h, quiet hours, max N/day, per-domain opt-in) → **Tier-2 LLM** "is this worth sending + compose" personalized from retrieved memories → **push**.

Ship this trigger first: *HRV z<−1.5 + low voice-valence + short sleep → AXON recovery check-in.* **Wellness-only, non-diagnostic language** on all health/mood triggers (route sustained-low-valence to supportive language + resources, never diagnosis).

---

## PART 2 — Database: local-first + Postgres/pgvector/Timescale

### 2.1 Resolve the core contradiction first

TWIN **cannot be zero-knowledge** — AXON must read data server-side. FHE (ML on ciphertext) is real but impractical for a solo founder in 2026. Do **not** market "zero-knowledge." Market **"local-first + on-device preprocessing + crypto-shredded."** Classify by sensitivity:

| Tier | Data | Handling |
|---|---|---|
| **A** | Raw voice audio, raw bank PDFs/SMS text, raw HealthKit reads | Process on-device or in an **ephemeral** worker; **never persisted raw**; emit derived rows, discard source |
| **B** | Derived signals (mood scores, spend categories, HRV, sleep, embeddings) | Stored server-side (AXON needs it) under **per-user encryption + RLS** |
| **C** | Social/public (posts, badges, streaks) | Normal Postgres |

Tier A implements your voice law and the BIPA verdict: extract prosody features on-device, discard audio, never store a voiceprint.

### 2.2 Backend spine: ONE Railway Postgres 16

Do not split databases. Enable **pgvector** (AXON memory) + **TimescaleDB** (sensor firehose) on the single instance. Railway runs Postgres in a container so any extension installs freely.

- **Timescale hypertables** auto-partition time-series into chunks, give auto-retention + 90%+ compression + continuous aggregates with no custom cron, stay fast to ~10B rows (vanilla Postgres degrades past ~100M). Your sensor data is append-only and not transactionally coupled → textbook hypertable fit.
- Add **pgvectorscale (DiskANN)** *later*, only when `memories` crosses ~1M vectors and HNSW recall/latency degrade.

### 2.3 Core schema

```
users
oauth_connections        -- per provider, tokens ENCRYPTED
consents / consent_events -- append-only (see 2.5)
raw_ingest_log           -- idempotency: upsert on (source, provider_event_id)
observations             -- HYPERTABLE, the firehose (§1.1)
metric_source_priority   -- fusion rule: sleep→Oura, strain→Whoop, workouts→AppleWatch
twin_daily               -- CONTINUOUS AGGREGATE: de-duped best-source value/metric/day (AXON reads this)
features / insights / memories  -- derived layer (§1.2-1.3)
triggers                 -- declarative proactive rules (§1.6)
keys                     -- per-user DEK, stored SEPARATE from data (§2.6)
data_recipients          -- registry of every 3rd party you sent data to (for erasure fan-out)
```

**Multi-source fusion:** 2–3 overlapping watches resolve via `metric_source_priority` → `twin_daily` continuous aggregate emits one clean truth per metric per day. AXON reads `twin_daily`, never the noisy raw.

### 2.4 Per-user isolation: Row-Level Security

Add `user_id` to every user-scoped table, **index it**, enable RLS with "user sees only own rows." In Flask/SQLAlchemy set `SET LOCAL app.user_id = ...` per request; policies read `current_setting('app.user_id')`. Keep an explicit `WHERE user_id=...` too (lets the planner use the index). This is the structural guarantee behind "your data is yours" — a code bug can't leak one twin to another. (Enabling RLS with no policy breaks the table — always ship a policy.)

### 2.5 Consent = append-only versioned record, not a boolean

Legal requirement given health+bank+voice. A `users.consented` flag is worthless.
```sql
consent_events(user_id, domain, action, policy_version, purpose, method, ip, ts)
-- domain ∈ health|finance|voice|diet|fitness|behavior|social
-- action ∈ grant|revoke ; revoke = new row, never an update
current_consent = view over latest event per (user, domain)
```
**Ship every domain OFF by default.** Enforce at **two choke points**: (1) the ingestion webhook drops data for revoked domains at the door; (2) AXON's read layer excludes revoked-domain signals from context. `policy_version` change re-triggers consent. This table is also your audit/plaintiff-defense trail.

### 2.6 Deletion + export: crypto-shredding

Soft-delete is **not** valid erasure. Give each user a **DEK**; encrypt Tier-B columns with it; **erasure = destroy the key** → ciphertext (including inside backups you can't selectively edit) becomes noise. AXON still reads plaintext at runtime (server decrypts transiently). Accepted by several DPAs where row-level backup deletion is disproportionate (the solo-founder case).

**Deletion API (event-driven, ≤1 calendar month):** (1) mark request → (2) destroy DEK (instant logical erasure of sensitive data + backups) → (3) fan-out delete events to every entry in `data_recipients` (Terra/Vital, PostHog, OneSignal, Stripe, embeddings) → (4) hard-delete non-encrypted relational rows.
**Export API (GDPR Art 20 + CCPA):** one function per table, `user_id`-scoped → single downloadable JSON/CSV archive. Build both as **one pipeline from day one.**

### 2.7 On-device vs synced

- **MVP (web app today):** skip a sync engine. Postgres is source of truth; phone is a thin client.
- **Native app (Capacitor, needed for HealthKit/Health Connect anyway):** local **encrypted SQLite (SQLCipher)** holds raw HealthKit reads + on-device-derived features; push **only derived rows** over authenticated REST/webhook. HealthKit requires a native app and is device-only — the phone MUST read → derive → push.
- **Rule:** raw sensor/audio/bank stays in device SQLite or ephemeral; **derived signals sync up.**
- Adopt **PowerSync** *only if* users later demand full offline read/write of the twin. TWIN's append-only model does **not** need CRDT/CR-SQLite (that's for multi-device offline *editing*, which you likely never hit).

### 2.8 Migrations & workers

Replace the hand-rolled ALTER-in-`app.py` with **Alembic** — it won't survive hypertables + RLS + encryption. Add a **second Railway service** (queue table or Redis) as a background worker for: Terra/Vital webhook processing (keep webhooks fast), embedding generation, nightly features/insights jobs, and erasure fan-out. Don't add Kafka/microservices/separate vector DB/FHE — complexity is the #1 risk (founder burnout).

---

## PART 3 — Legal in EVERY country: strictest-common-denominator + region gates

### 3.1 The strategy

There is no single "legal everywhere" license. **Satisfy the strictest common denominator, then region-gate the outliers.** Meet **GDPR Art 9 + Illinois BIPA + Washington MHMDA + China PIPL** and you clear UK GDPR, LGPD, Quebec Law 25, APPI, PIPA, Saudi/Qatar/UAE, India DPDP automatically. Build **one strict flow**, not fifteen.

### 3.2 On-device is your single biggest legal lever

Data that never leaves the device isn't "transferred" or "processed by the controller" in the regulated sense (ICO treats on-device as gold-standard privacy-by-default, GDPR Art 25). Raw health/voice/bank/location stays encrypted on the phone; AXON fusion prefers on-device; only **derived, non-identifying summaries** sync (and even that behind its own opt-in). This neutralizes most localization + cross-border-transfer law. **The moment you sync raw sensitive data, you re-enter the full regime.**

### 3.3 Per-category, off-by-default, explicit consent (§2.5 is the mechanism)

Each tracker = independent OFF-by-default toggle with its own plain-language purpose statement and its own consent record (timestamp, version, scope). This one stance simultaneously:
- Satisfies **GDPR Art 9** explicit-consent (double basis: Art 6 + Art 9(2) explicit consent — the only realistic condition for a consumer app).
- Defuses **Washington MHMDA** (the biggest sleeper: "consumer health data" is defined so broadly it catches almost any wellness inference; private right of action; a signed 1-yr authorization to *sell* is so onerous it effectively bans data sales/ad-SDKs). Your stance: **NO data sale, NO ad SDKs, NO third-party analytics on sensitive data.**
- Meets purpose-specific-consent everywhere (LGPD, PIPA, Law 25).
- Add a **global geofencing ban around health facilities** in code (MHMDA).

### 3.4 Voice = highest-litigation-risk category, engineer it to NOT be a biometric

BIPA lists "voiceprint" as a biometric ($1k/$5k statutory damages, private right of action). Design so voice is **never** a voiceprint:
- Process acoustics **on-device only**; extract non-identifying prosody (pace/energy/pitch/valence); **immediately discard raw audio**; **never store or match a voice template for identity.**
- GDPR Art 9's biometric prong only bites when data is used to *uniquely identify* — non-identifying acoustics stay outside it.
- **Separate explicit opt-in** just for voice + a published retention/deletion policy (BIPA).
- Frame as **wellness/mood insight**; add the **EU AI Act Art 50(3)** notice ("you are interacting with an emotion-inference feature," from 2 Aug 2026); keep it strictly consumer (never workplace/education → that triggers the AI Act outright ban).
- If unsure, ship voice **OFF by default in Illinois/Texas/Washington.**

### 3.5 Finance = read-only via a licensed aggregator

Never scrape or store bank credentials. Use a regulated aggregator per region (**Plaid/MX** US, **Tink/TrueLayer** EU/UK, regional in Gulf/India). Request the **narrowest scopes**, **read-only** (balances/transactions, no payment initiation → avoids PSD2/PISP + money-transmission licensing). This inherits the aggregator's licensing; TWIN stays a downstream "authorized third party" under CFPB §1033. Present the §1033-style disclosure at connect; honor a hard **12-month re-consent** cycle. Never use finance data for credit/eligibility decisions (avoids FCRA). **Your SMS-parsing path must run on-device** (Tier A) and emit only derived `finance/txn_amount` rows — raw SMS text never persists server-side.

### 3.6 Wellness, never diagnosis

The medical-device line (EU MDR / FDA SaMD / UK MHRA) turns on **intended purpose**. General wellness = exempt; "diagnose/treat/monitor/predict a disease" = regulated device (clinical evidence, certification, post-market surveillance). Write **all** copy/UI/store listings in wellness language ("insights," "trends," "self-awareness"), add a clear "not a medical device / not medical advice" disclaimer, keep AXON outputs as reflections/nudges. (Wellness framing avoids the device regime but does **not** remove GDPR Art 9 consent duties.)

### 3.7 Paperwork that is legally mandatory (not best practice)

- **One master DPIA/PIA** covering all six tracker categories + AXON fusion + per-region transfer assessments where cloud sync occurs (required by GDPR, Law 25, PIPL, LGPD, Saudi PDPL, India DPDP).
- Appoint a **DPO/privacy lead**; maintain **RoPA**, a written **biometric retention+deletion policy** (BIPA), versioned consent logs.
- Budget a lawyer to review **claims** before EU/US/UK launch (masterplan: $500–2k).

### 3.8 The three genuine region gates on-device alone can't solve

Make each market's data-residency a **config flag, not a rewrite**:
| Gate | Requirement | Action |
|---|---|---|
| **China (PIPL)** | Separate sensitive consent + PIPIA + CAC transfer mechanism (Security Assessment / Certification eff. Jan 2026 / SCC filing); >10k-individual thresholds; fines to RMB50M/5% | **Geo-block** OR fully localize in-China with a local entity + CAC path — never serve from a Western backend |
| **Gulf (Saudi PDPL / Qatar PDPPL / UAE)** | Store sensitive/PII **in-region**; SDAIA/authority registration; risk assessment | Host sensitive data in KSA/UAE data centers; use **DIFC-ADGM-QFC mutual adequacy** for intra-Gulf movement (relevant to your EPHAS/Qatar base) |
| **Any market where you sync raw sensitive data** | Full transfer regime re-applies | Keep raw on-device everywhere else so localization never triggers |

---

## PART 4 — Connecting to social, safely + external sharing

### 4.1 The Strava lesson → two hard-separated layers

Strava leaked military bases because raw activity+GPS was public-by-default and social read directly from the raw store. TWIN's data is far more sensitive. Enforce a **data boundary**:
- **Sensitive Tracker Vault** (Parts 1–2) — raw + derived signals, local-first, RLS.
- **Social Projection layer** — stores **only user-promoted derived artifacts**.

Build a **one-way Projection service**: the Vault emits **signed, minimized artifacts** (`{metric:'body', delta:'+2', period:'week'}`); the social DB stores **only** those — **no absolute values, no GPS, no precise timestamps, no bank amounts.** Enforce at the **schema level** so a social-layer bug can't leak a raw field it doesn't even store. (Analytics/"Twin" hub = private Vault read; feed/profile = the Projection.)

### 4.2 Opt-in per item, spoiler-safe, no global "make public" switch

Strava's failure was pre-checked consent + buried opt-outs. TWIN: **no global visibility toggle.** Every share is a discrete action on a specific artifact → **live preview of exactly what others see** → choose audience (default = private/pod, **never public**) → confirm. Each domain has independent share permission (money can be permanently un-shareable while fitness is pod-shareable). Every share is a **revocable, auditable event** with one-tap "revoke everything I've shared."

### 4.3 Pods/leagues compete on VERIFIED DELTAS, never raw stats/location

This is the moat *and* the safety mechanism. Leagues rank by **normalized delta / consistency / adherence % / streak length** — never absolute weight/income/pace or any geo. Ship a **"Verified" badge**: a **server-signed attestation** over Vault-verified events proves "this +2 came from a connected watch" / "12-day streak is real" **without exposing the source data** (selective-disclosure pattern — you do *not* need zk-SNARKs for a social app now; keep true zk as a future option for brand-funded challenges). This is your anti-slop / proof-of-human moat.

### 4.4 External sharing: layered, export an IMAGE not data

Render the Twin Card / verified-proof card as an **image** (server-side or on-canvas), then:
- **Universal default (works in the web app today):** `navigator.canShare({files})` → `navigator.share()` → OS share sheet. Covers IG/TikTok/X/WhatsApp with **zero per-platform cost or approval.** Mobile-first; feature-detect first.
- **Native app (Capacitor):** first-class buttons — **Instagram Stories** deep-link `instagram-stories://share?source_application=APP_ID` (no follower/verification gate in 2026; iOS needs `LSApplicationQueriesSchemes = instagram-stories`); **TikTok OpenSDK Share Kit** (iOS SwiftPM/CocoaPods, Android Maven; shares a Twin Card image in one tap).
- **X:** **AVOID the write API** (free tier gone; $0.015/post, $0.20 with a link; likes/follows/quotes Enterprise-only since Apr 2026). Use the free **web intent** (`twitter.com/intent`) or the OS sheet — never a runtime dependency.

**Every exported image must contain zero raw sensitive numbers** — once it leaves TWIN you lose all control (Strava lesson applied to exports). Each image carries a link back → drives the Twin Card K-factor loop.

### 4.5 Auth: Apple + Google primary; social = "connect to share," not login

- **Primary login:** Sign in with Apple + Google (OIDC over OAuth2) + your own email/password for the EPHAS cohort. Apple is effectively mandatory on the App Store if you offer any third-party login.
- **Instagram Basic Display API is DEAD** (shut down Dec 4 2024) — never use IG as primary auth. Its successor needs Business/Creator accounts.
- Keep social connections as **separate, purpose-scoped "connect to share/import"** actions with the **narrowest scopes**; **never** request social-graph/DM read. Isolate any creator-audience import from the tracker Vault.

### 4.6 Close the loop safely

Make the **most shareable object also the safest**: reward streaks/deltas/adherence/verified badges (inherently spoiler-safe). **Never reward sharing absolute sensitive values.** Add extra friction + "this stays private" defaults specifically at **money** and **voice-emotion** domains. Instrument K-factor/D7/D30/life-delta before opening any public gate — **launch pod/friends-only first**, prove it's safe and sticky, then consider broader visibility. Ship a plain-language **"What TWIN never shares"** page as a trust artifact (turn the Strava anti-pattern into marketing).

---

## PART 5 — Concrete build order for a solo founder

Fits your roadmap (auth → Postgres → wire buttons) and ships the differentiating health+finance "center cell" first.

**Phase 2 — foundation (on top of existing Flask + Railway Postgres):**
1. Adopt **Alembic**; add `pgvector` + **TimescaleDB** to the single Postgres instance.
2. Auth: **Sign in with Apple + Google (OIDC)** + email/password.
3. **RLS** on every user-scoped table; set `app.user_id` per request in Flask.
4. `consent_events` (append-only) + `current_consent` view; every domain **OFF by default**; enforce at ingestion webhook + AXON read layer.
5. Per-user **DEK** (`keys` table) + `data_recipients` registry; build the **delete (crypto-shred + fan-out) and export** pipeline together **now**.
6. `observations` hypertable + Mapper contract; wire **2–3 connectors first: finance (aggregator, read-only) + health (Terra/Vital)** — the center cell. Idempotent upsert on `(source, provider_event_id)`.
7. `metric_source_priority` + `twin_daily` continuous aggregate.

**Phase 3 — the twin & AXON:**
8. Nightly **`features`** job (EWMA baselines + z-scores).
9. **`memories`** + pgvector HNSW; **local embeddings** (BGE/nomic via Ollama); daily rollup via **local Ollama**.
10. **AXON context assembler** (state block + user-filtered pgvector retrieval + latest rollup).
11. **Weekly synthesis** on hosted Sonnet/Opus.
12. `insights` correlation job (Pearson + lag-1, ≥14 days, |r|>0.4).
13. Declarative **trigger engine** → gate → compose → push. First trigger: recovery check-in.
14. Universal **"+" logger** (manual-OR-auto law) feeding `observations`; Analytics→**"Twin"** hub reading `features`/`insights`.

**Phase 3.5 — remaining trackers (each: manual-OR-auto, editable, on-device where sensitive):**
15. **Voice** (Tier A: on-device prosody, discard audio, separate opt-in, AI Act Art 50 notice, off-by-default in IL/TX/WA).
16. **Food photo→macros** (editable estimates, confidence<1) + manual.
17. **Live-video form-check** (on-device pose/MediaPipe, real-time reps/form, nothing raw leaves device).
18. **Behavior/mood/screen-time/location** via "+" logger + on-device reads.

**Phase 4 — native + social:**
19. **Capacitor wrap** (keep web codebase) + native plugins: HealthKit/Health Connect, SQLCipher local store (raw on-device → push derived), IG Stories deep-link, TikTok Share Kit.
20. **Projection service** (one-way, signed, minimized, schema-enforced spoiler-safe artifacts).
21. **Pods/leagues on verified deltas** + signed "Verified" attestations; per-item opt-in share with live preview; "revoke all shared."
22. **Twin Card** image export via Web Share API → OS sheet; "What TWIN never shares" page.

**Legal, in parallel from Phase 2:** master DPIA/PIA (all six categories + fusion); appoint DPO/privacy lead; RoPA + BIPA retention policy + versioned consent logs; wellness-only copy audit + "not a medical device" disclaimer; global health-facility geofence ban; region-residency **config flag** (China geo-block, Gulf in-region residency) ready before serving those markets.

**Deliberately deferred (complexity = burnout risk):** FHE, microservices/Kafka, separate vector DB, PowerSync/CRDT, pgvectorscale, X write API, IG as login, read replicas. Add each only when real Day-30 retention (>15–20%) proves it earns its keep.

---

### Relevant existing files
- `C:\Users\Admin\Documents\EPHAS-Twin-AI\app.py` — current Flask + flask-sqlalchemy + psycopg2 app, Railway Postgres/SQLite, in-app ALTER migrations (replace with Alembic before this build).
- `C:\Users\Admin\Documents\EPHAS-Twin-AI\requirements.txt` — current dependency set to extend (pgvector, timescale client, Alembic, aggregator SDKs).