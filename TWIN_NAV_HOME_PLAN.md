# TWIN Design Decision: Bottom Nav + Alive Home

## 1. THE BOTTOM NAV (decision)

**Keep 5 tabs. Keep the social tab. Do NOT ship a Search tab. Do NOT pour social into Home.**

```
[ Home ]   [ Grow ]   [ ⊕ Check-in ]   [ Twin ]   [ Profile ]
  feed      social      center action     hub        you
```

| Slot | Tab | What it is |
|------|-----|-----------|
| 1 | **Home** | Your alive, customizable landing (see §2) — stories, your twin tiles, then feed |
| 2 | **Grow** | The social/community destination (posts/reels/threads/courses) with search + discovery as a TOP bar inside it |
| 3 | **⊕ Check-in** | Elevated center ACTION button → quick-create sheet, defaults to Check-in |
| 4 | **Twin** | The personal data hub — full trackers, AXON, analytics, the "dashboard" |
| 5 | **Profile** | You, badges, settings (settings lives here, never in the bar) |

### Why this, and why NOT the alternatives

**Why not Search-as-a-tab:** A dedicated Search/Explore tab is a *scale* feature, not a launch feature. Every app that has one (Instagram, Reddit, TikTok) added it AFTER they had enough people and content to fill a browse grid. At TWIN's stage a Search tab is an **empty room** — thin results hurt trust more than a missing tab. The rule: you only earn a bottom Search tab when Home is NOT doing discovery AND you have supply density. You'll never satisfy the second condition yet. So search rides as a **top bar inside Grow** (the compressed Instagram-Explore recipe) and costs zero nav slots.

**Why not social-into-Home:** This is the single biggest trap in the founder's idea. Merging general social content into Home is the TikTok move — and it **betrays TWIN's own thesis** ("life-delta not time," "the wedge is the data graph, not the feed"). You cannot out-feed TikTok. If Home becomes an open social scroll, the twin identity dissolves and TWIN becomes a me-too. Home must stay *yours*.

**The resolution of the founder's tension:** The founder is right that Home feels dead because it's "a mix of everything," and right that it needs stories + widgets + scroll energy. But the fix is NOT to make Home a generic social feed — it's to make Home a **social-feeling view of YOUR twin**, with a *rationed* social feed underneath. The twin stays the hero; social is the dopamine texture around it.

**The tab-bar rules behind this:** 3–5 tabs (never 6, no hamburger/"More"). Every tab is a NOUN/destination you return to, not a verb. The one verb (Check-in/create) is the elevated center button, not a tab. Settings lives inside Profile. Order locked forever for muscle memory.

**Strongest alternative (name it honestly):** Drop to **4 tabs** — `Home | Grow | ⊕ | Profile` and fold "Twin" into Home's tile zone. Cleaner and more confident (4 is the sweet spot). I don't pick it because your trackers/AXON/analytics are rich enough to deserve a real home, and cramming them into Home's scroll re-creates the "mix of everything" deadness you're trying to escape. Keep Twin as its own tab; let Home *preview* it.

---

## 2. THE REDESIGNED HOME (top-to-bottom)

The order matters: **people → you → the world.** Each zone earns the scroll to the next.

```
┌─────────────────────────────────────┐
│ HEADER: TWIN logo · 🔔(red dot) · ✉️(2) │  ← unread dots = aliveness
├─────────────────────────────────────┤
│ ◉+  ◉  ◉  ◉  ◉  ◉ →   TWIN DROPS      │  ← stories/status row (people NOW)
│  you  friends w/ colored rings       │
├─────────────────────────────────────┤
│  YOUR TWIN TODAY  ·  updated 2m ago  │
│  ┌───────┐ ┌───────┐                 │  ← customizable TILE zone
│  │ Smart │ │ Streak│   (drag/pin)    │     hero = today's twin state
│  │ tile  │ │  🔥12 │                 │     or Daily Twin Drop
│  ├───────┤ ├───────┤                 │
│  │ Money │ │ Sleep │                 │
│  └───────┘ └───────┘                 │
│         [ + add a tile ]             │
├─────────────────────────────────────┤
│  ── Following ─ For You ─ EPHAS ──   │  ← segmented control over live feed
│  ┌─────────────────────────────────┐ │
│  │ freshest post / reel (peeking)  │ │  ← blended infinite feed
│  │ …next card top intrudes ~12%    │ │     posts/reels/threads/courses
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
        ⊕ center create always reachable
```

**Zone A — Header (thin):** wordmark left; notifications bell + DMs right, each with a **red unread dot / count**. Those dots are the cheapest aliveness signal that exists — they promise "something changed since you left."

**Zone B — TWIN Drops row (the liveness bar):** Horizontal circular avatars. **Slot 1 = your own avatar with a "+"** (you're a participant, not a spectator). Then people you follow, **ordered newest-first**, each with a **gradient ring when they have an unseen Drop today**, grey when seen. Map this to real daily check-ins so the ring genuinely changes every open — the screen is never identical twice. **Never render it empty:** on first launch, seed with suggested EPHAS members / an onboarding prompt.

**Zone C — Your Twin Today (the customizable tile zone):** A short, curated grid (2 columns) that is *yours*.
- **Hero position** = today's twin state or your **Daily Twin Drop** prompt — and it must **move**: number counts up on load, timestamped "updated 2m ago," a pulsing live dot.
- Then 2–4 tiles the user chose.
- A subtle **[ + add a tile ]** at the bottom of the grid.
- This is what makes Home *TWIN* and not Instagram. Keep it TIGHT — 3–5 tiles, not a wall of dashboards.

**Zone D — The rationed social feed:** A thin **segmented control** (Following / For You / EPHAS) layered *over already-live content* — switching feels like re-tuning a live channel, not loading a new page. Below it, ONE blended infinite vertical feed interleaving posts, reels, threads, and the occasional course card **inline** (courses are never a co-equal tab — they break the scroll rhythm; surface them as periodic "recommended" cards). Pull-to-refresh at top; skeleton loaders while fetching (never a blank screen).

### What actually makes it feel ALIVE (not layout — micro-signals)

Ship these and you get ~80% of the "alive" feeling for the least engineering:
1. **Colored story rings** that change daily (pre-attentive "is anything new?").
2. **Red unread dots** on bell + DMs.
3. **A peeking hero + peeking next card** — never let content end cleanly at the fold; let the next item intrude ~12% so the eye is pulled down.
4. **One moving thing above the fold** — count-up number, autoplay reel, or pulsing live dot.
5. **Freshness timestamps** — "now," "2m," "just posted."
6. **Skeleton loaders, never a spinner or blank** (blank = broken = dead).
7. **One "live now" cue** — "3 friends checked in today" / countdown to the daily Drop.

**The BeReal lever (your secret weapon):** Gate the TWIN Drops row behind posting your own — *you can't see today's Drops until you drop yours.* Reciprocity + FOMO + a daily countdown. This is on-thesis (it generates twin data) and it kills the "lobby" feeling instantly.

**Anti-patterns that would keep it dead:** a static grid of unchanging totals, no faces anywhere, no unread state, everything ending at the fold, a spinner-only load, no create affordance in the first view. Audit against these.

---

## 3. THE "+" TILE PICKER & HOW TILES WORK

**Two DIFFERENT "+" buttons with two different jobs — don't confuse them:**
- The **[ + add a tile ]** in the grid = *customize what I see*.
- The **center ⊕** in the nav = *create/log something now* (§4).

**The tile picker** (opens as a bottom sheet): search field + **category chips**, every item a **real-data preview card** with an "Add" button.

| Category | Tiles |
|----------|-------|
| **Trackers** | Money · Fitness · Diet · Sleep · Mind · Custom (mini-chart or today's number) |
| **AXON** | Pinned AXON chat · "Ask your twin" · latest insight |
| **Check-in** | Today's mood/state prompt |
| **Social** | EPHAS feed snippet · Post shortcut |
| **Insights** | **Smart Tile** — AXON rotates the most relevant card daily (streak at risk, a nudge). This is your iOS-Smart-Stack + Daily-Drop hook. |

**How tiles behave (steal the Android Quick-Settings model — it's more discoverable than iOS jiggle mode):**
- **Three separate modes:** *add* (picker) · *arrange* (drag) · *configure* (per-tile settings). Never blend them.
- **Reorder only in an explicit Edit mode** (pencil toggle) so normal scroll never drags a tile — this is the #1 tile-grid bug.
- In Edit: drag handles, tile lifts with shadow + **haptic**, others reflow, **×-to-remove** badge, **pin/star** to keep at top.
- **2–3 tile sizes max.** Keep the grid clean.
- **"Reset to default layout"** escape hatch (prevents users stranding themselves).
- **Persist layout to Postgres** per user so it syncs.
- **Empty-state guard:** always keep the [ + ] present so a user who removes everything can recover.

**Philosophy:** Ship a **strong curated default** first (Apple Fitness approach — smart defaults beat decision fatigue). Deep customization is *progressive* / a Pro delight, not a day-one requirement.

---

## 4. THE CENTER BUTTON

**A visually elevated, TWIN-accent ⊕ that opens a quick-create sheet — defaulting to Check-in.** It is NOT a nav tab (it opens a modal and returns you where you were; it never highlights as "active").

Because TWIN has multiple creation verbs, the sheet offers up to 4, biggest/default first:
1. **Check-in** ← default, the highest-frequency habit-forming, data-generating act that feeds the twin
2. **Log a tracker**
3. **Post to feed**
4. **Ask AXON**

Keep it to ~4 options — don't overload it into a giant menu. Check-in is the default because it's the one action that both builds the daily ritual and generates the twin data that IS the product.

---

## 5. PHASED BUILD PLAN (solo founder, existing Flask app)

**Phase 1 — Make Home feel alive (mostly front-end, biggest ROI):**
- Add the **TWIN Drops story row** (self-"+" first, colored rings from today's check-ins). Seed it so it's never empty.
- Add **unread red dots** on bell + DMs, **freshness timestamps**, **skeleton loaders**, **pull-to-refresh**, one **count-up/pulse** motion element, and the **peeking hero + next-card**.
- Reorder Home's existing content into the **people → your twin → feed** stack. Curated static tiles, tap-through only (no customization yet).
- *This alone fixes the "dead first impression."* Validate before building customization.

**Phase 2 — Center create + light customization:**
- Ship the **center ⊕ quick-create sheet** (Check-in default).
- Add **reorder/hide** in an explicit Edit mode (drag handles + haptics + Reset-to-default). Persist layout to Postgres.
- Move search + a light discovery strip (trending challenges, suggested people, category chips, leaderboard/badge-holders) into the **top of the Grow tab**.

**Phase 3 — Full tile system + hooks:**
- Full **[ + ] tile picker** (category chips, real-data previews, animate-into-place).
- **AXON Smart Tile** (daily rotation) — the retention hook.
- **BeReal-style Daily Twin Drop gate** (see others only after you drop).
- Pin/favorite tiles; Pro-tier layouts.

**Graduation trigger for a real Search tab (later, only if both clear a threshold):** (1) discovery results get engaged with, and (2) UGC/challenge supply is dense enough to fill a browse grid. Until then, search stays a top bar in Grow.

---

**Bottom line:** 5 tabs — `Home · Grow · ⊕Check-in · Twin · Profile`. Keep social as its own tab; do not add a Search tab yet; do not merge social into Home. Redesign Home as *a social-feeling view of your twin* (people → your tiles → rationed feed) carried by cheap aliveness micro-signals. Two distinct "+"s: grid-"+" customizes, center-⊕ creates. Ship the story row + unread dots + peeking hero first — that is the "dead → alive" fix, in a weekend.