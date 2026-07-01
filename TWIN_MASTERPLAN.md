# TWIN MASTER PLAN
### Definitive strategy + technical build document — written by your chief strategist + CTO
*Deep research: 13 agents, 150+ sources. Read once end-to-end, then keep Section 9 open while you build. This is not flattery — TWIN has a real shot AND specific named ways it dies. Both are here.*

---

## 0. THE ONE-PARAGRAPH THESIS

TWIN wins or loses on **one thing: the fused data twin, distributed through EPHAS, with the daily voiced AXON moment as the wedge.** Everything else — trackers, feed, badges, courses — is depth users discover *after* the twin already feels alive. The app shell is a commodity (anyone can vibe-code it in a weekend). Your moat is the three things nobody can clone fast: (1) **multi-source data fusion** (body + money + voice + behavior under one twin — no competitor has permission to all three), (2) **EPHAS as built-in distribution + trust**, and (3) **local-first privacy** Meta/Google structurally cannot match. Protect those three. Everything else is replaceable.

---

## 1. BEST AI TOOLS — the recommended stack (route by tier; never one model for everything)

| Layer | Pick | Cost | Why |
|---|---|---|---|
| **Daily coach (90% of turns)** | **Gemini 3 Flash / Flash-Lite** | $0.50/$3 ; $0.10/$0.40 per 1M tok | 10–25× cheaper, fine for low-stakes chat |
| **Weekly Twin Review** | **Claude Opus 4.8** | $5/$25 per 1M | Best long-context life-data synthesis + coaching warmth |
| **Voice emotion (the differentiator)** | **Hume AI** (Expression Measurement + Octave TTS) | $0.064/min | "You said you're fine — your voice says otherwise." Most distinctive thing on this list |
| **Voice transcription** | **Deepgram Nova-3/Flux** | low | Words; pair with Hume for emotion |
| **Vector DB** | **pgvector** | Free | Lives inside the Postgres you already have |
| **Embeddings** | **Google text-embedding-005** | $0.006/1M | 1/30th OpenAI's price; truncate to 512 dims |
| **Form-check (Pro)** | **MediaPipe / BlazePose** | **Free, on-device** | Video never leaves device. Don't use a cloud vision API |
| **Moderation** | **OpenAI omni-moderation** | **Free** | Text+image. Don't build on Perspective (sunset 2026) |
| **Analytics** | **PostHog** | Free 1M events | A/B-test your hooks; self-host fits local-first |
| **Push** | **OneSignal** | **Free unlimited** | Powers your whole Daily-Drop/streak loop at $0 |
| **Recommendations (P3+)** | **Recombee / Shaped** | quote | **Set target = life-delta, NOT time-on-app** |

**Local (RTX 4080):** Ollama + Qwen 3 / Llama 3.3 8B for prompt dev, private twin processing (raw data never hits cloud = privacy + compliance win), nightly batch. *Not* good enough for the user-facing weekly synthesis — that's Opus.

---

## 2. BEST AI AGENT SWARMS TO BUILD THE APP

**Critical correction:** "swarm frameworks" (CrewAI/LangGraph/AutoGen) put AI *inside* your app — they do **not** build it. The thing that builds your app is an **agentic coder.** Confusing these two is the #1 mistake; as a non-expert you're exactly who'd lose weeks to it.

**The exact combo:**
```
PRIMARY:     Claude Code Pro ($20/mo) ← already running
FREE BACKUP: Aider + Ollama + Qwen2.5-Coder 14B (on your 4080, $0)
ALWAYS ON:   git from day one (undo button)
LET RUN:     ruflo/claude-flow passively underneath — don't try to pilot it
```
**Avoid:** Devin (billing), Copilot Workspace (discontinued), MetaGPT/ChatDev (unmaintainable), OpenAI Swarm (deprecated). **Total spend: $20/mo, or $0 fully local.** Start with ONE tool.

---

## 3. HOW TOP SOCIAL APPS WON + HOW TWIN BEATS THEM

**Universal pattern (every winner did this):** ① solved cold-start on ONE small dense network (not "for everyone") ② had single-player value BEFORE the network ③ obsessed over *retaining* best users (Duolingo: CURR had 5× the impact of anything else) ④ rode a borrowed distribution channel ⑤ had ONE uncopyable wedge.

| Giant | TWIN's edge |
|---|---|
| TikTok/Insta | They optimize watch-time; TWIN optimizes life-delta. They can't reposition without breaking their ad model |
| BeReal | Died for having **no solo value**; TWIN's twin is useful with zero friends |
| Strava | Sees only fitness; TWIN fuses body+money+voice+behavior = category-of-one |
| Whoop/Oura | Locked to their device; TWIN is the **neutral fusion layer** across all |
| Character.AI | Roleplay memory; AXON remembers your **real verified life** |
| Meta/Google clone | **Cannot** credibly promise local-first privacy — contradicts their ad business |

**Defensible trifecta: single-player value + data network effect + privacy trust.**

---

## 4. LAUNCH PLAN + HONEST TRACKER VERDICTS

**GTM:** waitlist (LaunchList + referral + Founder-badge) → ruthlessly-scoped MVP (6–8 wk) → closed beta in EPHAS (TestFlight link + Android closed test, 15–20 recruits, hand-onboard first ~100) → founder TikTok + warmed Reddit → Product Hunt spike → grind the month-4 plateau. **Honest timeline: ~6–12 wk to MVP, then 6–9 MONTHS to stable traction — not 90 days.** Register Android as an **organization account** to skip the 12-tester gate.

**Tracker feasibility (honest ceilings):**
- 💰 **Finance — WORKS 90–95%, region-dependent.** Rent Plaid (US) / Tink (EU) / **Lean** (Gulf), stay **read-only** (collapses legal burden). **Qatar open banking is sandbox-stage in 2026 — not reliably shippable yet.** Gulf workaround that fits local-first: **parse bank SMS alerts on-device** (free, private, available now). Never 100% (re-auth attrition, ~90% categorization). Make it Pro.
- 📱 **Behavior — PARTIAL, iOS≠Android.** iOS per-app screen-time = **dead end** (Apple firewalls it — don't promise it). Android works via UsageStats (manual permission). **Wearables = highest-yield** via **Terra/Vital** aggregator (HealthKit/Health Connect are device-only → you MUST ship a mobile SDK). Sleep *stages* only 50–86% accurate → sell directional ("vs your own baseline"), not clinical scores.
- 🫂 **Relationship — narrow slice real, most is hand-wavy.** Real: opt-in check-ins on the **UCLA Loneliness Scale**, conversation-prompt rituals (Paired's proven loop), recency nudges (Dex/Clay). **Do NOT ship:** a single "relationship score," AI judging friendships, content sentiment by default. Read **metadata not content.** Ship the reflective instrument, not the oracle ("optimize your friendships" apps are a graveyard).
- 🎙️ **Voice psychology — real as a WELLNESS SIGNAL only; as diagnosis it's a science + legal landmine.** Kintsugi (best-funded voice-depression co.) **shut down early 2026** failing FDA. Defensible: energy/mood **trends within-person**, one weak signal among many. **Ban the words detect/diagnose/screen/depression from all copy** ("track mood & energy" = exempt wellness; "detects depression" = FDA medical device). **Extract features on-device, derive mood, discard raw audio, never store a voiceprint** (Illinois BIPA = $1k–5k/violation, can bankrupt a solo founder). "Your voice never leaves your phone" = marketing weapon.

---

## 5. SUCCESS SCORE: **18 / 100** (pre-launch, today)

Real number, transparent math. ~99.5% of consumer apps never reach meaningful success; only ~7.3% survive 3 months; ~13.9% ever hit 1,000 users. A generic pre-launch app = 3–8/100. TWIN earns its way to 18 via **strong distribution (EPHAS) + real moat (fused twin + local-first) + low burn (solo+AI mitigates the #2 killer, running out of cash)**. **It CAN'T exceed ~25 pre-launch** because the two heaviest factors — *demand* and *retention* — are **0 until real users exist.** No roadmap optimism moves them.

**What raises it:**
- **Day-30 retention flattens >15–20%** → **+20 to +30** (the single biggest lever; the only honest PMF signal)
- **Sean Ellis >40%** at ~100 users → +10
- **A working cheap channel (LTV:CAC >3:1)** → +10
- **>3% MAU→Pro + $10K ARR** → +8
- **Surviving the month-4 plateau without burnout** → protects the whole score

**Re-score monthly against the retention curve, not the roadmap.**

---

## 6. WHAT TO ADD — attractive + addictive (prioritized)

**TIER 1 (first):**
1. **AXON Voiced Motivation as the LEAD wedge** — your real day → a 2–4 min personalized speech in a chosen voice. Your "Cal AI magic moment": instantly video-able (influencer fuel), un-fakeable. Lead ALL marketing here; gate premium voices to Pro.
2. **Persistent AXON memory + proactive recall** — the #1 retention mechanic of 2025–26 (monetized memory). Engineer the **"week 3 it feels alive" threshold.**
3. **Streaks + engagement-segmented leagues** — push every user past the **~10-day dropout cliff.**

**TIER 2 (ship early):** Verified Proof Cards (Twin Card/Wrapped — real deltas, viral + trust moat); Accountability Pods.
**TIER 3 (careful):** Progress Jackpot (reward verified deltas, **never time, never pay-to-spin; status/medals over cash** — cash-reward apps like StepN collapse); agentic AXON (acts without being asked).

---

## 7. WHY TWIN STANDS ALONE — the moat

**The code moat is dead** — any feature gets AI-cloned in weeks. Defensibility = a **stack of three moats**:
1. **Fused multi-source life-graph** (body+money+voice+behavior) — device makers see their ecosystem, Strava sees fitness, your bank sees money; **only TWIN sees the whole human.** Surface this earlier and louder.
2. **Switching cost via accumulated twin** — years of deltas + AXON's learned model of you can't be recreated elsewhere.
3. **EPHAS community + local-first trust** — Meta/Google *structurally cannot* promise "your bank & voice never leave your device." Permanent asymmetry.

**Every feature passes one test: is this still valuable if the user is completely alone?** If yes, you've escaped the cold-start trap that kills 95% of social challengers.

---

## 8. BONUS — opportunities, risks, legal must-dos

**Opportunities:** **Sell Pro via Stripe web checkout** (you're already web-first → keep ~97% vs 85%, +12–15 margin pts). **Course marketplace** (~15–20% take from vetted Pros) = strongest 2nd revenue engine. **Pricing:** annual **$89.99** ("$7.50/mo", retains 44% vs 17% monthly), monthly $12.99, **Founder Lifetime $199** (scarcity-capped, tied to Founder-badge cutoff). Model **3% MAU→Pro** (Strava floor 2%; Duolingo 9–22% is an outlier — don't plan on it): Yr1 ≈ $10–12K ARR, Yr2 ≈ $96K, Yr3 ≈ $340–425K. **Pitch investors the asset (twin + EPHAS), not hockey-stick Yr1 revenue.**

**Risks:** **Burnout is your #1 killer** (not capital) — sustainable pace + an accountability advisor. AI code has ~45% vuln rate → audit before real data. The month-4 plateau is where most quit.

**Legal MUST-DO before public launch:** ① never create/store voiceprints (BIPA = existential) ② granular per-domain consent, off by default ③ architect local-first (shrinks BIPA+GDPR+breach at once) ④ **NEVER send health/voice data to ad SDKs** (Meta Pixel etc — fined GoodRx/BetterHelp/Flo) ⑤ never claim HIPAA/diagnoses/financial-advice ⑥ stay read-only on money, never custody funds (no MTL needed) ⑦ age-gate 16+ ⑧ one GDPR+CCPA delete pipeline ⑨ DPA with every vendor ⑩ DPIA + breach runbook ⑪ **spend ~$500–2,000 on a privacy attorney** to review the policy + the BIPA voice decision. Cheapest insurance you'll buy.

---

## 9. THE 90-DAY ACTION LIST

**Days 1–7:** lock the single-player "wow" (**Daily Twin Drop from ONE source**) · Android org account · LaunchList waitlist in EPHAS · start aging a Reddit account · set up PostHog + RevenueCat/Adapty · Claude Code + Aider/Ollama backup, git always on.

**Days 8–56 (MVP):** single-user, email+pw, ONE insight/day (first-run insight in **<60 sec** or they churn) · build the **voiced AXON moment** (LLM + Hume/ElevenLabs TTS) · wire **Stripe web checkout** · local-first voice/health (features on-device, discard audio), granular consent · CUT: trackers-for-everything, badges, multi-source, courses, admin.

**Days 42–63 (beta):** TestFlight link in EPHAS + Android closed test (15–20) · hand-onboard first ~100 · instrument the **cohort retention curve** + run the **Sean Ellis 40% survey** at ~100 users.

**Days 56–90 (distribution):** founder TikTok daily → funnel to EPHAS · warmed Reddit posts · gift Pro to 10–30 micro health creators for UGC · **Product Hunt** (12:01am PST weekday, demo video, 30–50 EPHAS supporters in hour one) · **2–4 hrs with a privacy attorney.**

**The one metric above all: does the retention curve FLATTEN?** If yes, scale. If it bleeds to zero, fix the product before spending a dollar on acquisition.

---
*Build to Section 9, defend the trifecta in Section 7, stay honest with the score in Section 5. The default outcome for a consumer app is failure — TWIN's distribution, moat, and low burn are exactly the three things that move it off the default. Now go ship the Daily Twin Drop.*
