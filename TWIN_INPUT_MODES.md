# TWIN — The 3-Mode Input Doctrine

**The rule: every piece of data in TWIN can enter three ways. No feature ships without all three planned.**

1. **✋ Manual** — tap, type, slide. Always available, zero permissions.
2. **🎙️ Voice** — speak it. On-device dictation today (`twinDictate`), full AXON voice-logging later ("AXON, I spent 40 riyal on lunch"). Voice is also our accessibility-first mode.
3. **⚡ Automatic** — connected trackers, apps & machines (HealthKit / Health Connect / Terra wearables, camera AI, bank aggregators, phone sensors). Phase 3+.

| Feature | ✋ Manual | 🎙️ Voice | ⚡ Automatic |
|---|---|---|---|
| **Check-in / Check-out** | ✅ sliders + text steps | ✅ dictation on text steps · *(later: full voice conversation mode)* | 🔜 pre-filled from sleep/wearable data ("slept 7.2h — confirm?") |
| **Habits** | ✅ add/toggle | ✅ mic on habit name · *(later: "AXON, mark gym done")* | 🔜 auto-detect from trackers (gym visit via motion/GPS, reading via screen time) |
| **Posts / Threads** | ✅ type + photo | ✅ mic on caption & thread | 🔜 auto-generated Twin Card / milestone posts you approve |
| **Stories (Drops)** | ✅ camera / gallery | ✅ caption dictation *(mic on drop caption — add)* | 🔜 auto "growth drop" from achievements |
| **DMs** | ✅ type | ✅ mic in the input bar | — (messages stay human) |
| **AXON chat** | ✅ type | ✅ voice mode + TTS replies | ✅ AXON already reads your check-in data |
| **Workout (camera)** | ✅ manual +1 rep | *(later: "count my pushups")* | ✅ AI camera counts reps live |
| **Goals** | ✅ set/edit | ✅ dictation | 🔜 progress inferred from tracker data |
| **Money** *(P3)* | manual expense/income entry | "AXON, log 40 on lunch" | bank aggregator (Plaid/Lean), read-only |
| **Run & Sports** *(P3)* | log a session | "start a run" | GPS/motion auto-track, watch-style start |
| **Diet** *(P3)* | type a meal | say the meal | photo → AXON estimates macros |
| **Sleep** *(P3)* | hours slider (exists in check-in) | say it | wearable/phone sleep data |
| **Mood & Emotion** *(P3)* | mood slider (exists) | voice note → tone/pattern analysis (wellness-only, never store voiceprint) | wearable HRV/stress signals |
| **Health** *(P3)* | manual reports: blood, pressure, sugar, height, weight, vitamins | dictate readings | photo of lab report → parsed; future: government health-record connect |
| **Social Circle** *(P3)* | add friends + private notes | tell AXON about a friend, it remembers | in-app streaks/interactions auto-tracked |

**Automatic-entry backbone (Phase 3):** one `observations` table; every source (manual, voice-parsed, Terra webhook, HealthKit, camera AI, photo-OCR) writes the same shape. The UI never cares where data came from — only the `source` tag differs.

**Accessibility commitments (Settings → Accessibility):**
- ✅ Reduce Motion (kills all animations) · ✅ High Contrast · ✅ Vibration toggle · ✅ Voice entry everywhere · ✅ aria-labels on icon-only nav
- 🔜 Larger text (needs px→rem refactor) · 🔜 full screen-reader audit · 🔜 voice-only navigation ("open my habits")
