# TWIN — DESIGN & BEHAVIOR BLUEPRINT (v2)
*Synthesized from deep research: 29 agents, ~25 sources, color psychology + dopamine/behavior science + teardowns of TikTok, Instagram, Snapchat, Duolingo, BeReal, Finch, Apple Fitness, Strava. Red-teamed and revised.*

> Evidence tags: **[directional]** = a design hypothesis to validate on TWIN's own users. **[vendor-claim]** = a number from an interested party (marketing, not proof). Nothing here is "definitive" — it's a buildable bet with a measurement plan.

---

## 1. CORE IDENTITY & EMOTIONAL PROMISE

**The single sentence TWIN is:**
> TWIN is a calm daily mirror: a one-minute ritual where you record where you are, and watch a private model of yourself take shape over time.

**The one emotion every open must deliver: *quiet recognition.*** Not hype, not a leaderboard rush — the low-arousal feeling of *"I checked in with myself, and I can see a truer picture forming."* (Self-Determination Theory's **Competence** need, rendered low-arousal-positive.)

**The hard fork:** TWIN is **a calm, you-vs-you ritual, not an engagement machine.** You can't be both "the ethical opposite of the slot machine" AND a variable-reward engine with suspense delays, loss-framed pushes, and competitive leagues. Picking calm means: likely **lower DAU than a Duolingo-grade product** — the correct trade for this thesis.

Mechanics **cut or reworked** by this choice:
- 800ms suspense reveal → **cut** (rewards resolve immediately)
- ~50% surprise multiplier / variable-ratio bonus → **cut** (rewards predictable)
- Loss-framed copy ("don't lose your streak") → **reworked** to record-framing ("you're keeping a 14-day record")
- 10PM streak-saver push → **opt-in only**, off by default
- Competitive leagues / demotion → **cut**, replaced with opt-in cooperative pods
- Near-miss / gambling framing → **cut entirely**

**The test every mechanic must pass:** *Would the user endorse this mechanic if we explained exactly how and why it works on them?* If explaining it would make them feel manipulated, it's out. "Luxury" = **restraint and behavior** (latency, silence, fewer notifications), not gold gradients.

---

## 2. DESIGN SYSTEM

**Identity:** a **quiet instrument** — closer to a high-end watch face / journaling app than a mobile game. No confetti, no bouncy springs, no collectible-gem arcade. Restraint *is* the aesthetic.

### 2.1 Color tokens (dark — never pure #000000, it causes halation)

| Token | Hex | Use |
|---|---|---|
| `bg/canvas` | `#101114` | App background |
| `bg/surface-1` | `#16171B` | Cards (canvas + ~5% white) |
| `bg/surface-2` | `#1C1E23` | Sheets / check-in modal (+8%) |
| `bg/surface-3` | `#23262C` | Popovers / toasts (+12%) |
| `bg/surface-4` | `#2A2E35` | AXON coach panel (+16%) |

Elevation = **lighter surface overlays, NOT drop-shadows** (shadows are invisible on dark; brightness = height). 1px hairline strokes between adjacent surfaces.

**Accent — hard cap of THREE hues:**

| Token | Hex | Notes |
|---|---|---|
| `gold/matte` | `#C9A24B` | Default accent / primary CTAs. Flat matte, not gradient gold-foil. |
| `gold/specular` | `#FBE7B0` | Warm highlight inside the ONE metallic surface (the twin avatar). |
| `platinum` | `#D7DCE3` | Cool neutral for mastery-tier labels. |

Everything else = neutral dark ramp + dimmed white text. Surfaces/text tiers are structural neutrals, not "accents."

**Text (never #FFFFFF for body):** Primary `rgba(255,255,255,0.87)` · Secondary `0.60` · Disabled `0.38`.

**Semantic (rare, desaturated ~20–30% for dark):** success `#5FA873` · warn `#D9A441` · danger `#C96B5E`.

**Warm→cool tier ramp:** early tiers warm (champagne gold) → mastery tiers cool (platinum). A *learnable convention* ("cooler = further along"), not innate psychology.

### 2.2 Type scale (one serif display + one neutral sans; ~1.25 ratio)

| Token | px / weight | Use |
|---|---|---|
| `display` | 40 / 600 | Streak number, tier-up |
| `h1` | 32 / 600 | Screen titles |
| `h2` | 24 / 600 | Section heads |
| `body-lg` | 18 / 400 | Coach text, reflections |
| `body` | 16 / 400 | Default |
| `caption` | 13 / 500 | Labels, metadata |
| `micro` | 11 / 600 | Tier labels (uppercase, letter-spaced) |

### 2.3 Spacing & material
- **Spacing:** 4pt grid (4/8/12/16/24/32/48/64), generous.
- **Radii:** cards 20px, modals 28px, pills 999px. **Tap targets ≥44×44.**
- **Glass:** ONLY on bottom nav + check-in sheet, over backgrounds we render — **never over user photos.** 60–70% dark scrim + 18–20px blur, maintain WCAG AA. Ship a **"Reduce Transparency"** toggle day one.
- **Grain:** static baked 3–5% PNG over the one hero gradient. Never live feTurbulence.
- **One metallic surface:** only the twin avatar, one baked warm-specular highlight. No system-wide sheen. No neumorphism.

### 2.4 Motion (animate on MEANING, not on input) + performance budget
- **Quiet & instant for repetition** (feed/nav/taps): ~120ms ease-out, no signature motion.
- **Signature motion reserved for once-daily ritual completion + tier-ups only.**
- Respect `prefers-reduced-motion`.
- **No continuous tilt/scroll-reactive sheen** (vestibular + battery hazard). The avatar gets ONE sheen sweep on check-in completion, then rests.

| Token | Spec | Used on |
|---|---|---|
| `ease/quiet` | `cubic-bezier(0.4,0,0.2,1)` 120ms | nav, feed, taps |
| `ease/enter` | `cubic-bezier(0.16,1,0.3,1)` 260ms | modals, sheets in |
| `ease/reward` | `cubic-bezier(0.22,1,0.36,1)` 320ms | XP/streak count-up |
| `sheen/sweep` | 900ms linear, ONE pass | twin avatar on completion only |

- **Number count-ups** decelerate into final value, resolve immediately (no suspense delay).
- **Haptics:** single light tap on completion. No confetti-burst.
- **Perf gate: 60fps on a ~$250 3-year-old Android.** At most ONE GPU-expensive effect per frame (glass blur and avatar sheen never composite simultaneously). Degradation ladder: drop sheen → drop glass → drop grain.

---

## 3. THE LOOP (Trigger → Action → Reward → Investment, built calm)

### 3.A Check-in / check-out RITUAL
- **Trigger:** curiosity/closure ("I want to see today reflected in my twin"), NOT engineered dread. Anchored prompt ("After I pour my coffee, I check in"). ONE notification/day default.
- **Action (B=M·A·P):** core check-in **~30–45s, 4–5 lightweight signals** (mood 1 tap, energy 1 slider, one context tag, optional one-line note) — fast but rich enough to actually feed insight. (A single slider can't build a real "mirror.")
- **Reward:** closure ("You've completed today") + streak tick + XP count-up to a named level + the twin updates + AXON returns one insight — **immediate and predictable every time**, framed as self-knowledge/competence. No surprise multiplier, no suspense.
- **Investment:** each check-in deposits durable value (the growing twin, trend graphs, AXON's memory). Optional intention for tomorrow with a **non-punitive** follow-up. Finite loop with a hard **"you're done for today"** stop.

### 3.B Social — cooperative, opt-in, NOT competitive
- **Accountability pods** (3–6 people), see each other's *completion* not contents, send encouragements. **No leaderboards, leagues, demotion, or follower counts.** Reactions arrive as a **once-daily digest.** Off by default; TWIN is fully valuable solo.

### 3.C Streaks / freezes / celebration
- **Streak = a record you keep,** not a thing you'll lose. Record-framed copy only.
- **Day 7 = activation goal.** Front-load week-one encouragement.
- **Streak Freeze ("Twin Shield"), day one:** 2 free, max 2 held; earned recovery (check-in + short reflection), never guilt.
- **No near-win mechanics.** Neutral progress only ("3 of 7 days").
- **Celebration deliberately quiet:** soft glow + one light haptic daily; milestones get a fuller version of the *same calm* reveal (avatar sheen + gold accent), never confetti.
- **"Perfect" record:** platinum flame for never using a freeze (voluntary, self-referential).

### 3.D Counter-scaled rewards (anti-overjustification)
Reward NEW habits more, established habits less. Early check-ins = more visible XP; as the habit sets, XP quietly tapers and tone shifts from "points" to "reflection/identity."

### 3.E Ethical guardrails (binding)
Endorsement test on every mechanic · declared persuasive intent ("How TWIN is designed" page) · honest exits (pause-streak, weekly-digest mode, turn off notifications, daily hard stop) · no manufactured anxiety. Explicitly removed and never re-added: suspense reveal, variable multiplier, loss copy, near-miss, leagues/demotion, default-on late pushes.

---

## 4. SCREEN-BY-SCREEN
- **HOME (still center):** canvas + baked grain. **Streak record is the hero** (large gold flame + number, calm). One daily ring (partially pre-filled). One matte-gold "Check in" CTA. Neutral weekly progress line. Optional home/lock widget.
- **CHECK-IN/OUT (ritual):** opens as glass sheet. 4–5 signals, ≤5 taps. On submit → sheet dismisses → immediate XP count-up + streak tick + insight + the single avatar sheen sweep. Hard "done for today" stop.
- **PROFILE (the digital twin):** an **abstract generative geometric form** (accreting constellation/orb), NOT a humanoid. Drivers: **density←total check-ins**, **symmetry/smoothness←consistency**, **warm↔cool tint←tier**, subtle hues←dominant trends. #3 = sparse; #30 = coherent; #300 = dense, intricate, *yours* (the honest switching cost). Sparse-data "forming" fallback before ~7 check-ins. Below it: trend graphs + tier ladder + earned milestone marks (calm metallic, locked = quiet silhouettes).
- **FEED (optional):** only if opted into pods. No glass over user content. Pods foregrounded; no leaderboards. Daily digest.
- **AXON (coach panel):** top elevation, text-forward, calm. Honest tiered insight (below). Memory is the moat. Voice = competence-affirming, never punitive.

---

## 5. ONBOARDING + THE AXON INSIGHT SPEC

**Onboarding (first 60s → a guaranteed HONEST Day-1 win):** cold-open splash (dark, one gold mark, grain) → pick a real anchor → choose life areas + notification timing (autonomy) → **first check-in = guaranteed honest win** unlocking first milestone + AXON's first response (an honest reflection, NOT fabricated analytics) → endowed setup progress + 2 free Twin Shields.

**AXON tiered insight (the key de-risk):**

| Tier | Threshold | Delivers | Example |
|---|---|---|---|
| **T0 Reflection** | Day 1, 1 entry | Honest reframe of what they just said + 1 question | "You logged low energy but good mood — that contrast is worth noticing." |
| **T1 Early signal** | ~3–6 entries | Tentative, hedged, low-confidence | "Early hint: your better-mood days have a 'slept well' tag. Too soon to be sure." |
| **T2 Real pattern** | ≥7 entries AND ≥3 signals with a relationship | Data-backed pattern, evidence shown | "Across 12 check-ins, energy averages higher on 'worked out' days (7/8). That's a real pattern now." |

**Hard rule:** AXON never claims a pattern it can't support. Confidence always visible. Implementable day one (T0/T1 = templated reflection + simple tag stats; T2 = per-user correlation, no exotic ML).

**Retention:** D1 honest reflection + first milestone · **D7 = activation milestone** · staged messaging (novelty→identity), no loss-aversion guilt · **ONE notification/day** default, optional same-day reminder opt-in, weekly-digest as a first-class exit.

---

## 6. PRIORITIZED EXECUTION LIST (each ships with the metric that earns it)

1. **The check-in/out ritual** — 4–5 signals, ≤5 taps, ~30–45s, finite loop, hard "done." *(% completing <60s; D1→D2 return)*
2. **AXON tiered insight (T0→T2) + memory** — the aha + the moat + riskiest pillar, de-risk early. *(% rating insight "felt true")*
3. **Streak system (record-framed) + ONE anchored notification + endowed setup progress.** *(D7 activation; notif opt-out rate)*
4. **Twin Shield freeze (2 free) + earned recovery.** *(streak survival w/ vs w/o freeze)*
5. **Day-1 guaranteed honest win** in onboarding. *(D1 retention vs control)*
6. **Design-system foundation** — surface-overlay elevation, matte-gold (3-hue cap), dimmed-white text, 4pt grid, baked grain, Reduce-Transparency + Reduce-Motion, **perf budget gate.** *(60fps on reference Android; AA contrast)*
7. **Quiet reward motion** — immediate count-ups, single avatar sheen. No suspense, no multiplier. *("satisfying but not manipulative")*
8. **Profile / digital-twin form** — parametric model + sparse-data fallback. *(% returning to Profile; "feels like mine")*
9. **Counter-scaled XP.** *(retention holds as XP tapers)*
10. **Privacy & data architecture** — local-first encrypted, granular consent, one-tap export, real deletion. *(100% exportable + deletable)*
11. **Social LAST + bounded** — opt-in cooperative pods, daily digest, no leagues. *(solo retention holds without social)*
12. **Ethics + measurement pass before launch** — endorsement test on every mechanic; "How TWIN is designed" page; confirm no dark pattern crept back.

**North-star is NOT DAU.** It's *sustained, voluntary, low-pressure return* + *insight-felt-true rate* — engagement the user would endorse.

---

**The one-line truth:** TWIN is a deliberate bet that a *calm, honest, you-vs-you* ritual — one minute a day, an AXON that only claims what it can actually see, a private twin that grows more truly yours over time — can build a habit worth keeping **without** the slot-machine mechanics it would be easy to bolt on.
