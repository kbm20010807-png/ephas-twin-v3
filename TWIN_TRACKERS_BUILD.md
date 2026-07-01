# TWIN TRACKERS — The Build & Device Master Spec

*A concrete, buildable engineering spec for a solo founder + AI. Every tracker answered in three parts: (1) compatibility matrix + best strategy, (2) exactly how to build it, (3) honest accuracy ceiling + how to message it. Ends with a buy-list and the Capacitor wrapping plan.*

---

## 0. The One Architectural Law That Governs Everything

Wearable/sensitive data splits into **two structurally different lanes**. Mixing them up is the #1 planning mistake, so TWIN is built with both from day one:

- **Lane A — On-device (no server API exists):** Apple HealthKit (iOS), Google Health Connect (Android). Data lives on the phone. The only way it reaches your backend is: *your app reads it on-device → POSTs deltas to Flask*. There is no server-side fetch. Ever.
- **Lane B — Cloud OAuth REST:** Garmin, Fitbit/Google Health, Oura, Whoop, Polar, Withings, Huawei. Normal 3rd-party OAuth + webhooks from your backend.

**Design consequence:** wrap both lanes behind ONE internal Flask interface — `HealthProvider` — with a canonical schema. Swapping an aggregator or adding a direct integration later is a config change, not a rewrite.

```
Canonical sample: { user_id, source, metric, ts_utc, tz_offset, value, unit,
                    sampling_interval, source_record_id, confidence_tier, raw_ref }
```

Every tracker below writes into this same schema, and AXON reads a *resolved* layer on top of it (never raw samples).

---

## 1. HEALTH / ACTIVITY TRACKER (steps, HR, HRV, sleep, workouts, SpO2)

### 1.1 Compatibility matrix — does it work on ALL watches + both OSes?

**Yes, near-total coverage — but via THREE legs, not one integration.**

| Brand | Best path | Lane |
|---|---|---|
| Apple Watch | HealthKit (iOS only) | A (device) |
| Wear OS / Pixel Watch | Health Connect (Android) | A (device) |
| Samsung Galaxy Watch | Health Connect | A (device) |
| Xiaomi / Mi Band | Health Connect **or** aggregator — no direct API | A / B |
| Amazfit / Zepp | Health Connect **or** aggregator — no direct API | A / B |
| Fitbit | Health Connect (Android) — sidesteps migration | A / B |
| Garmin | Aggregator (avoid $5k direct early) | B |
| Oura / Whoop / Polar / Withings / Huawei | Aggregator (or direct later) | B |

**THE 3-LEGGED STRATEGY (implement exactly these):**
1. **HealthKit reader in iOS app** → Apple Watch + anything on Apple Health. *Free (dev time only).*
2. **Health Connect reader in Android app** → Samsung / Pixel / Wear OS / Xiaomi / Amazfit / Fitbit + the entire no-API long tail. *Free — highest single-integration leverage on the planet.*
3. **ONE aggregator** for the cloud-OAuth premium brands (Garmin / Oura / Whoop / Polar / Withings / Huawei). *~$399/mo tier.*

Three integrations ≈ ~99% of the consumer wearable market. This *is* how every serious all-in-one app (Welltory, MacroFactor, Exist) does it — a hybrid of all three layers, never one.

> **Do NOT:** build per-vendor OAuth early (Garmin's $5k fee, Whoop's rotating-refresh-token trap, Polar's mandatory per-user registration, Fitbit's forced Sep-2026 re-consent). The aggregator absorbs all of it. Do NOT touch reverse-engineered Xiaomi/Huami endpoints in production.

### 1.2 How to build it

**Ingestion:**
- **Legs 1 & 2 (device):** Start with `@capgo/capacitor-health` (unified HealthKit + Health Connect: steps, HR, distance, calories, weight). Fork/extend a thin native plugin (Swift + Kotlin, a few hundred lines) for the gaps: **sleep, HRV, background delivery / observer queries**. Read on foreground + hourly background wake → POST deltas.
- **Leg 3 (cloud):** Use an aggregator's SDK (Terra) so their mobile SDK *also* covers Apple/Google device capture if you prefer not to hand-roll.

**Sync model (hybrid, not either/or):**
- **Webhooks = live data.** Stateless receiver: verify signature → ACK in <2s → drop raw payload on a queue. A worker normalizes + upserts. Never normalize inline in the handler.
- **Polling = backfill/baseline only.** On device-connect, run a one-time history pull (async-to-webhook for >28 days; chunks tied by `terra-reference` header).
- **Nightly reconciliation poll** to catch missed webhooks.

**Dedup & merge (the thing that breaks everything):**
- Natural upsert key: `(user_id, source, event_type, unique_id)`, Postgres `INSERT … ON CONFLICT DO UPDATE`. Aggregator contract: each update is a **superset** → last-write-wins is correct; never field-merge.
- **Multi-device:** assign a **priority source per metric per time-window**, gap-fill from lower priority. Default priorities: **ring > watch for sleep/HRV; watch > phone for workouts/daytime HR; dedicated tracker > phone for steps.** Let user override "primary device." Emit a provenance tag (which source won). **NEVER sum overlapping step streams** — pick the winner.

**Storage (reuse existing Postgres):**
- `raw_samples` (per-source facts, TimescaleDB hypertable) → `canonical_metrics` (resolved winner per metric/window with `confidence_tier`) → `daily_twin` / `session_twin` rollups.
- For AXON: generate a compact NL "twin digest" from rollups, embed in **pgvector**, feed *structured rollups* (not raw samples) to the model.

**Backfill reality (set expectations per source):** Garmin 5yr, Oura long, Coros 3mo, Polar 30d, Health Connect 30d. Store an actual `data_start_date` per (user, source) and surface it to AXON so it never implies trends the data can't support.

### 1.3 Accuracy ceiling + messaging

**Confidence is PER-METRIC, not per-device. This is a hard product + legal rule.**

- **TIER-A (state as absolute value):** resting/steady HR, steps, sleep total-time, SpO2 spot readings. → *"You walked 8,200 steps."*
- **TIER-B (trend/direction only, band the number):** HRV, active/total calories (15–40% error), sleep-stage breakdown (~73–88% precision, deep sleep under-read ~40min), stress/readiness scores. → *"Your deep sleep trended lower this week"* — NOT *"you got 42 min of deep sleep."*

Store `confidence_tier` as a column AXON reads. Never cross-compare vendor composite scores (Whoop Strain ≠ Oura Readiness ≠ Body Battery — different formulas). Either pick one canonical device for readiness or **compute your own Twin Score from raw signals** so it's device-agnostic — and steal Bevel's move: publish the inputs, weights, per-source confidence, and formula. Transparency is a trust feature.

---

## 2. FINANCE TRACKER (global banks + notification parsing)

### 2.1 Compatibility matrix — does it work everywhere + both OSes?

**Auto-sync works in ~60–70 countries; a working tracker works EVERYWHERE via a 3-tier fallback.** No single API covers the world — use a **region-router keyed on country at connect time.**

| Region | Provider |
|---|---|
| US/CA/UK | Plaid |
| EU/EEA | **GoCardless (free AIS tier)** first; Tink/TrueLayer alt |
| Global catch-all | **Salt Edge** (5,000+ institutions, 50+ countries) |
| Gulf (home market) | **Lean Technologies** (KSA/UAE/Egypt); Tarabut alt |
| Qatar | ⚠️ No national framework — QNB-direct or **fallback only** |
| LatAm | Belvo |
| Africa | Mono (broadest) / Okra / Stitch |
| India | Setu AA / FinBox (RBI Account Aggregator — *not* PSD2) |

**The universal fallback is NOT SMS parsing** — Google banned `READ_SMS` for finance apps (enforced May 2025) and bans deriving it by other means. A finance tracker will not get an exception.

- **Android fallback:** `NotificationListenerService` — reads bank/card push + SMS-shown notification *text* on-device without `READ_SMS`. Works in any country with bank alerts.
- **iOS fallback:** **impossible** — no SMS inbox, no 3rd-party notification-content API. iOS users get aggregator OR manual/Share-Sheet entry.

**Three tiers so every country works on day one:**
- **Tier A (auto):** country has an aggregator → OAuth read-only sync.
- **Tier B (semi-auto):** no aggregator, Android + bank push → NotificationListenerService.
- **Tier C (manual):** iOS-no-aggregator or no notifications → fast manual/Share-Sheet entry with smart defaults.

Detect tier by (country × platform) at onboarding.

### 2.2 How to build it

**Architecture:** `ProviderRouter(countryCode) → aggregatorAdapter`, normalized schema `transaction{amount, currency, date, merchant, raw, type}`. Adapter order per country: (1) region-native premium → (2) Salt Edge catch-all → (3) on-device notification fallback.

**Security (non-negotiable):** OAuth redirect flow — user authenticates *at their bank*, you get a **scoped read-only token** (transactions + balances only; skip payments/identity). **Token lives server-side, KMS-encrypted, never on the mobile client. Never store bank credentials.** Model consent explicitly: `{provider, institutionId, scopes, consentGrantedAt, consentExpiresAt}`.

**Reconnection is a first-class feature, not an edge case.** PSD2 consent expires ~90 days (up to 180 in some EU). Consume the pre-expiry webhook (`PENDING_DISCONNECT` / `PENDING_EXPIRATION`) → push user into "Link update mode" *before* hard failure. Persistent "Reconnect [Bank]" banner. While stale, keep the fallback + manual entry logging so the tracker never goes dark.

**Notification parsing (on-device):** per-bank regex template registry, OTA-updatable JSON so you add banks without an app release:
```
BankTemplate { senderPatterns, amountRegex, typeKeywords, merchantRegex, balanceRegex, currency }
```
Pipeline: match sender → apply template → else generic extractor (currency+number+debit/credit keyword) → confidence score → low-confidence surfaces as a one-tap "review" card (confirmation = training data). Seed from open-source parsers (`transaction-sms-parser`, `Pavel401/transaction_sms_parser`). De-dupe notification vs aggregator by `(amount, date-window, last-4/merchant)`. **All parsing/storage on-device (SQLite/Room); never ship raw notification text to a server.**

**Categorization (rules-first, AI second):** (1) map aggregator category → your canonical taxonomy; (2) else local merchant→category ruleset (OTA-updatable); (3) else optional on-device AI. Every manual re-category writes a user-scoped rule → self-improving.

### 2.3 Accuracy ceiling + messaging

Aggregator data is bank-accurate. Notification parsing is the fuzzy part — always show parsed transactions as **editable drafts with a confidence badge**, and let low-confidence ones sit in a review queue. Message honestly: *"Auto-captured from your bank alert — tap to confirm."* Never silently log a mis-parsed amount.

---

## 3. VOICE-EMOTION TRACKER (acoustic biomarkers — NOT recording words)

### 3.1 Compatibility matrix — both OSes?

**Yes on both, but with one hard constraint that defines the whole feature.** Real-time mic capture + DSP runs cross-platform in the WebView. But:

- **iOS hard-blocks covert/background listening** — persistent orange mic indicator (non-suppressible), and background mic is muted unless you declare `UIBackgroundModes: audio` (strictly reviewed). Apple explicitly designs this to kill always-on listening.
- **Android** is more permissive but still needs a persistent notification and can't start mic from background on 14+.

**Verdict: build voice as EXPLICIT, user-initiated check-ins (tap → 30–90s voice journal). NEVER passive/ambient always-listening** — it fails App Review and lights the orange dot. This matches the "wellness-only differentiator" thesis.

### 3.2 How to build it

**Capture:**
- **Web path (primary, works in browser PWA + Android WebView):** `getUserMedia` → `AudioContext` → **AudioWorkletNode** (NOT AnalyserNode — you need raw Float32 128-sample frames for autocorrelation F0 and per-cycle jitter/shimmer). **Disable AGC, noise-suppression, echo-cancellation** at capture — they destroy jitter/shimmer/intensity data. Mono @ 16kHz.
- **Native fallback (iOS reliability):** `cordova-plugin-audioinput` (Capacitor-compatible, streams low-latency PCM).

**Feature set — copy Sonde Health's validated 8-feature MFVB** (litigation-safe reference), implement easy→hard, all in-browser JS/WASM (Meyda / Essentia.js to avoid hand-rolling):
1. RMS/dB (trivial) → 2. speaking rate + pause duration (energy VAD) → 3. F0 + pitch variability (autocorrelation/YIN over 20–40ms frames) → 4. jitter + shimmer (from consecutive F0 periods/amplitudes) → 5. spectral centroid/HF energy → 6. vowel space via LPC formants (**v2, optional**).

**Pipeline:** capture → per-window features → **signup baseline calibration** (user reads 3–5 fixed sentences → store per-feature personal mean+SD; fixed text controls phonetic content) → live scoring = z-score each feature vs baseline → combine into an **arousal score + composite strain index** → **discard the audio buffer** (ring buffer, never written to disk).

**Privacy = the moat AND the legal shield:** only 7–8 float scores + timestamp ever persist. Derived scalars are **not a voiceprint** — can't re-identify or reconstruct the speaker → structurally clear of BIPA / GDPR Art.9 biometric-ID regimes (you never do speaker ID, never store waveform, never transcribe). Put it in-app as a feature, not fine print: *"Audio is processed on your device and immediately discarded. We store only numeric wellness scores. We do not create a voiceprint or identify you."*

**v1 ship:** RMS/dB + F0 + pitch-variability + speaking-rate + pause-ratio + signup calibration. Add jitter/shimmer in v1.1 (noise-sensitive — gate on voiced-frame confidence). Feed the raw 7-float vector to AXON for fusion.

### 3.3 Accuracy ceiling + messaging — THE most important honesty rule

**Arousal/energy is measurable (~55–70% 3-class). VALENCE (happy vs sad) is NOT reliably measurable from acoustics (~55–60%, near chance) — it lives in the WORDS, not the sound. DO NOT ship a happy/sad classifier.** Lab datasets (RAVDESS ~80–90%) collapse on real spontaneous speech.

**Ship ONLY within-person deviation scores** (like Sonde: calibrate personal baseline, flag deviations from the user's own norm), never absolute emotion labels, never cross-user comparison. UI: *"Your voice sounds lower-energy than your baseline this week"* + explicit *"wellness indicator, not a diagnosis"* disclaimer. It degrades gracefully because it's relative to self.

---

## 4. FOOD / DIET TRACKER (photo→macros + manual + barcode)

### 4.1 Compatibility matrix — both OSes?

**Yes, fully cross-platform** — this is camera + API work, no OS-locked sensors. Identical on iOS and Android.

### 4.2 How to build it

**Stack (do NOT buy a per-user recognition SDK for v1 — a vision LLM beats them and is 10–20x cheaper):**
- **Photo path:** **Gemini 2.5 Flash vision** (primary, ~$0.30/M in, $2.50/M out, <$0.005/photo, top 2025 vision accuracy 0.548 > GPT-4o 0.522). **GPT-4o as low-confidence fallback only.**
- **Barcode path:** **Open Food Facts** v3 API (free, no key, 3M+ products).
- **Manual search:** **USDA FoodData Central** (free, CC0, whole foods) + Open Food Facts (branded).

**Photo→macros prompt (chain-of-thought, structured):** Don't ask "how many calories?". Ask the model to (1) list items → (2) estimate each portion in grams/ml → (3) apply density → (4) **explicitly add invisible oils/fats/sugar** → (5) compute macros per item → (6) emit 0–1 confidence per item. Enforce strict JSON schema (Gemini `responseSchema`, validated with zod). Include a reference-object hint (*"assume a standard dinner plate is 27cm"*). Optional Gemini-style **second verification pass** for high-calorie meals. Cache by perceptual image hash + `(food_name → macros)`.
```
items:[{ name, grams, calories, protein_g, carbs_g, fat_g, confidence, assumptions[] }]
```
Route `confidence < 0.6` items to a "confirm portion" UI.

**Editable estimates = the #1 retention lever (Cal AI's top complaint is you can't correct it).** Every AI number is a **tappable draft**. Model macros as `base_macros_per_100g × grams` so editing grams or swapping the food **re-derives instantly with no API call**. A portion slider (0.5×/1×/2×) live-recalculates. Save every correction as a personalization signal.

**Barcode rules (or you get blocked):** custom User-Agent `TWIN/1.0 (email)`; 15 req/min/IP → **call OFF directly from the client** (spreads rate limit across user IPs); ODbL data / CC-BY-SA images → add attribution in About screen; cache scans locally. On miss → USDA branded → manual.

**Manual entry:** typeahead over a local index of USDA FDC + OFF, with a "create custom food" escape hatch. (USDA free key = 1,000 req/hr — never ship `DEMO_KEY`.)

**Feed the twin:** log a normalized **per-item event stream**, not just daily totals: `{timestamp, source: photo|barcode|manual, items:[...], meal_type, user_edited, original_ai_value}`. Postgres `nutrition_events` (JSONB items) + materialized daily rollups. The original-vs-edited delta becomes a per-user portion-prior dataset. Keep raw photos local-first.

### 4.3 Accuracy ceiling + messaging

Cal AI (the market leader, a thin LLM wrapper) hits ~90% user-reported accuracy with the same failure modes any LLM has: **portion size, hidden oils, opaque/mixed dishes**. Message it as an estimate: show a fast optimistic result, confidence badge, and *"tap any number to adjust."* Perceived speed + editability beat a slower high-accuracy model. Budget <$0.01/user/day even for heavy loggers.

---

## 5. WORKOUT FORM-CHECK (live-video, on-device pose)

### 5.1 Compatibility matrix — both OSes?

**Yes, fully cross-platform and 100% on-device** — runs in the browser via TensorFlow.js, no OS-locked APIs, no server. WebGPU backend is the 2026 default (Chrome/Edge/Firefox/Safari), WASM fallback.

### 5.2 How to build it

**Model: BlazePose (MediaPipe Pose) GHUM — NOT MoveNet.** Form check needs **33 3D keypoints** (depth = z). MoveNet gives only 17 2D points and structurally *cannot* see knee valgus, trunk lean, or squat depth. Default to BlazePose **'full'**; auto-downgrade to 'lite' if measured FPS < 24. Load via `@tensorflow-models/pose-detection` (mediapipe runtime). Backend priority: **WebGPU → WebGL → WASM**.

**Capture:** `getUserMedia` → `requestAnimationFrame` → `estimatePoses`. **Never attach MediaRecorder, never upload the stream.** After weights load once, **zero outbound requests.** Put a visible *"Processing on your device — video never leaves your phone"* badge (true + marketing asset).

**Rep counting = a per-exercise finite state machine on joint angles (NOT ML — deterministic, debuggable):** compute driving joint angle (knee for squats, elbow for bench/push-ups) each frame; 2-state machine (up/down) with **hysteresis** (e.g. enter-bottom knee<100°, enter-top knee>160°) + `minRepDuration` (~400ms) to reject twitches. Smooth angles with a one-euro filter. Ship a JSON rule table: `{drivingJoints, bottomThreshold, topThreshold, minRepDuration}` — new exercises = new rows.

**Form-error rules (evaluated at rep bottom → 0–100 score + cues):**
- Squat depth by knee flexion: ~90° = parallel (target).
- Knee valgus: knee-x inside the ankle-x/hip-x line → *"knees caving out."*
- Trunk angle: excessive forward lean >~45–60° / any lumbar rounding on deadlift.
- Elbow flare (bench/push-up): shoulder-elbow angle too wide.
Store per-exercise `rules[] {name, measure, goodRange, cue}`; each violation deducts weighted points.

**"Tell it or auto-detect":** **v1 = manual picker** (100% reliable, loads the exact rule set). **v2 = BiLSTM classifier** over 30-frame windows (33 keypoints + 12 angles, ~99% clean / 88% off-angle) that *pre-selects* and the user confirms — gated by confidence, never silently picks the wrong rule set.

**Feedback loop:** live skeleton overlay every frame; rep count on state transition; **one spoken/haptic cue only when a rep scores below threshold** (Web Speech API, on-device TTS, rate-limited to 1 cue/rep). Cue at rep boundaries, not mid-frame. Run inference in a Web Worker if UI stutters. Live per-rep feedback is the differentiator (CueForm only gives it after the set).

**AXON integration = trivial + the whole privacy story.** Only a tiny JSON leaves the device per set:
```
FormCheckResult { exercise, reps, sets, avgFormScore, perRepScores[], topCues[], durationSec, ts }
```
A few hundred bytes vs megabytes of video. No frames, no keypoints, ever transmitted → no biometric-video retention → far lighter legal review.

### 5.3 Accuracy ceiling + messaging

Clean home conditions: ~99% rep accuracy; bad gym angles ~88%. 3D pose hits <10° RMS on shin/knee/hip/trunk angles — accurate enough for coaching cues, not clinical PT. Message as coaching, not medical: *"Form cue: go deeper — hit parallel."* Let thresholds be user-tunable later (mobility differs).

---

## 6. BEHAVIOR / MOOD / SCREEN-TIME / LOCATION

### 6.1 Compatibility matrix — the asymmetric OS lock

**This is NOT symmetric. Android is your full-signal platform; iOS is deliberately crippled on screen-time. Design around it — do not build a cross-platform screen-time tracker.**

| Signal | Android | iOS |
|---|---|---|
| **Per-app screen time** | ✅ `UsageStatsManager` (user grants `PACKAGE_USAGE_STATS` in Settings) | ❌ **DEAD END** — Screen Time API computes only inside a sealed extension: no network, no App Group, no return-to-app. Data never reaches your backend. Also only authorizes for a *child* account. |
| Motion/activity | ✅ Activity Recognition API | ✅ CoreMotion (CMMotionActivity + pedometer) |
| Location | ✅ FusedLocation + geofence | ✅ CoreLocation Visits / significant-change |
| Sleep | HealthKit/Health Connect or screen-on proxy | HealthKit or screen-on proxy |
| Calendar | Calendar Provider | EventKit |

**Verdict:** ship screen-time/app-usage as an **Android-only feature**. On iOS, drop the per-app-usage feature entirely (at most an on-device DeviceActivityReport widget whose numbers can't feed the twin) — and make the mood model tolerant of that missing feature.

### 6.2 How to build it — the single most important decision

**Idiographic (per-user) models are the whole game. Population models basically don't work for mood.** In the largest study: personalized models R²=37–66%; one-model-for-everyone R²<5% (near useless). The SAME signal points in *opposite* directions per person (a phone-interaction burst = "anxious spiraling" for one user, "social/connected" for another). **Do NOT ship a global classifier.**

**Architecture — per-user baseline + z-score deviations + learned weights:**
- For each signal, maintain a rolling personal distribution (14–30 day mean+SD, by day-of-week). Express today as a **z-score vs the user's own history.**
- Mood read = weighted sum of z-scores, **weights LEARNED per user** by correlating past z-scores against that user's check-in mood.
- First ~2 weeks = cold-start: show raw signals, ask more check-ins, don't claim a mood read yet.

**The five signals that actually predict mood (not raw totals — rhythm features):**
1. **Sleep proxies** — bedtime/wake from first/last screen event (free, no wearable) or HealthKit.
2. **Location stability** — home-ratio + location entropy (store DERIVED features only, never raw GPS traces).
3. **Social variability** — variation in unique contacts / messaging-app minutes over ~30 days.
4. **Activity** — steps/active minutes.
5. **Routine disruption** — variance of the above vs personal norm (irregularity is itself a strong signal).

Screen-time *timing* (late-night use, morning latency) >> screen-time *total*.

**Graceful degradation (never a brittle single number):** mood = weighted mean of *available* contributions; if a signal is missing, **renormalize over present signals — don't impute zero.** Widen the confidence band as fewer signals are present or time-since-check-in grows. Minimum viable read: ≥2 of {sleep, activity, location, check-in}, else show *"not enough signal today — quick check-in?"* Always surface confidence visually (solid vs dashed). Same codebase → full-signal Android, reduced-signal iOS.

**Check-ins (EMA) = ground-truth labels AND a signal — but compliance decays fast.** Use **ONE lightweight adaptive daily check-in** (1-tap emoji/slider + optional tags), timed to an event (arriving home / evening) — NOT 3 random pings (research uses 3/day but 64% find frequent prompts excessive; response decays 86%→76% after 2 weeks). Back off automatically on non-response.

**Daily Twin Drop = read + ONE nudge, generated by a transparent rules-over-model layer:** (1) pick the top 1–2 signals with the largest personal z-score deviation that are **actionable** (sleep timing, activity, going outside, social); (2) render an honest, hedged, "for you" read (*"your sleep drifted 90 min later and your world got smaller this week — that usually precedes a low stretch for you"*); (3) attach ONE concrete nudge (*"wind down 30 min earlier tonight"*). One card, one nudge. Log which nudges the user acts on → nudge-selection itself becomes idiographic.

### 6.3 Accuracy ceiling + messaging

Best-case behavior-trait R²~0.5–0.66; day-to-day mood correlation ~0.59. **Present trends + confidence, never precise or clinical claims.** Never *"you are 72% sad"* → always *"trending," "usually," "for you."* Hard safety rail: wellness/self-awareness, not clinical — avoid diagnostic language, add crisis-resource fallbacks if signals suggest severe decline.

---

## 7. COMBINED BUY-LIST (what a solo founder actually pays for)

| Tool | Buy? | Cost | Why |
|---|---|---|---|
| **Terra API** (wearable aggregator) | ✅ **Primary** | Free tier (incl. Apple Health) → ~$399/mo/100k credits | Broadest (~99%), transparent pricing, Capacitor SDK, absorbs Garmin $5k / Whoop tokens / Fitbit migration. Wrap behind your own `HealthProvider`. |
| **Rook** | Alt | Usage-based | International/LatAm, cost-flexible fallback to Terra. |
| **Junction (Vital)** | Later | $0.50/user, $300 min | Only if you add lab testing. |
| **GoCardless Bank Account Data** | ✅ **EU first** | **Free AIS** | All EEA, free — ideal bootstrap. |
| **Salt Edge** | ✅ Global catch-all | Paid | 5,000+ institutions, 50+ countries. |
| **Lean Technologies** | ✅ Gulf/home | Paid | KSA/UAE/Egypt. |
| **Plaid** | When US/paid users | Paid | US/CA/UK premium. |
| **Gemini 2.5 Flash** (food vision) | ✅ | <$0.005/photo | Primary photo→macros. |
| **GPT-4o** | Fallback only | Pricier | Low-confidence food meals. |
| **Open Food Facts** | ✅ | Free | Barcode (respect UA + rate limit + attribution). |
| **USDA FoodData Central** | ✅ | Free (CC0) | Manual food search. |
| **BlazePose / TFJS** | ✅ | Free | On-device form check. |
| **Sonde MFVB feature set** | ✅ (copy, not buy) | Free | Voice biomarker reference + legal framing. |
| **Meyda / Essentia.js** | ✅ | Free | In-browser audio DSP. |
| Passio / LogMeal / Nutritionix | ❌ Defer | — | LLM beats them; Nutritionix has no free tier ($1,850/mo). |
| Direct Garmin/Fitbit/Oura OAuth | ❌ Until ~10–20k users | — | Aggregator until the build+maintain cost crossover. |

**Rule of thumb:** aggregator until ~10,000–20,000 active users (direct integrations cost 2–4 weeks + $3.8–7.7k each + 20–40%/yr maintenance; aggregators are 3–5x cheaper below that crossover). Never DIY rate-limit/backoff handling.

---

## 8. CROSS-PLATFORM APPROACH (Capacitor + plugins)

**Keep the Flask/JS web codebase; wrap it as native iOS + Android via Capacitor. You do NOT need a native rewrite — just thin native glue plugins.**

**You MUST ship both a native iOS app AND a native Android app** — there is no server-only shortcut for HealthKit / Health Connect / screen-time / motion. The WebView handles UI + web-native features; plugins handle OS-locked sensors.

**Plugin map:**
| Need | Plugin | Notes |
|---|---|---|
| Health (steps/HR/workouts) | `@capgo/capacitor-health` | Unified HealthKit + Health Connect. Fork/extend for **sleep, HRV, background delivery** (few hundred lines Swift + Kotlin). |
| Android app-usage | `Cap-go/capacitor-android-usagestatsmanager` | Only path to real screen-time. Android-only. |
| Voice capture | `getUserMedia` + **AudioWorklet** (web) | Add `cordova-plugin-audioinput` for iOS reliability. |
| Food photo/barcode | Web camera + `BarcodeScanner` plugin | Pure web + API. |
| Form check | TFJS + `getUserMedia` in WebView | 100% web, no native needed. |
| Finance fallback | `NotificationListenerService` (Android native) | No iOS equivalent. |
| Push | `@capacitor-firebase/messaging` | One FCM token both OSes. Add native `FirebaseMessagingService` on Android so killed-app pushes fire. |

**Background execution reality (design around it):**
- Neither OS reliably lets you "wake and run." **Drive the Daily Twin Drop / streaks with SERVER-scheduled visible push** (guaranteed-ish), + local notifications for offline. Silent push = best-effort sync hint only, never the sole data-collection trigger.
- HealthKit background delivery is capped ~hourly and unstable on watchOS 26 (15–20+ min gaps when sedentary). **Promise "updated within the hour," never live continuous vitals.** For MVP: manual sync-on-open + hourly background.
- Android background health read needs `READ_HEALTH_DATA_IN_BACKGROUND` + WorkManager (Android 15 time-bounds dataSync foreground services). Warn users about aggressive OEM (Samsung/Xiaomi) battery optimization.
- iOS has no general foreground service; use significant-location-change + Visits (not continuous GPS) to survive suspension + App Review.

**Permission UX defensively:** iOS won't tell you if a HealthKit read was granted or denied (no-data == denied). Android limits re-prompts then forces manual grant in the Health Connect / Settings app. Gate special permissions (`PACKAGE_USAGE_STATS`, background location, Notification access) behind a clear "why" screen and instrument the drop-off.

**Build order for a solo founder:** (1) Capacitor wrap of the existing web app → (2) HealthKit + Health Connect readers via `@capgo/capacitor-health` on Terra free tier (validate end-to-end) → (3) Food (pure web + Gemini) and Form-check (pure web TFJS) — both cheap wins with no native complexity → (4) Voice check-in (AudioWorklet) → (5) Finance (aggregator + Android notification fallback) → (6) Behavior/mood idiographic engine last (needs the other signals + 2-week cold-start to be meaningful). Then wire every tracker's canonical events into AXON's fused snapshot and the social layer.

---

### The through-line

Ingestion is a commodity (aggregator + on-device SDKs). **The moat is fusion, correlation, and honest presentation** — exactly what AXON is. Steal Exist's cross-day correlation, Welltory's HRV-anchored insight engine, Bevel's radical score transparency. Everything sensitive stays local-first, only derived numbers cross the boundary, and every AI estimate is an editable draft with a visible confidence tier. That combination — universal device coverage, local-first privacy, and hedged-but-actionable AXON insight — is the whole product.