# SUPERCHARGE CLAUDE CODE — the install list

A founder's setup guide for building TWIN (Flask + Postgres) in VS Code. Every item here makes **Claude Code itself** more capable — not AI features inside your app. Windows paths assumed (`C:\Users\Admin\`).

---

## PART 1 — MCP Servers (give Claude new hands)

MCP servers add tools Claude can call. Two rules before you install anything:

1. **Only install first-party / widely-vetted servers.** Tool poisoning is the #1 MCP risk in 2026 — a malicious server hides instructions in its tool descriptions and poisons *every* session that loads it. Curate aggressively.
2. **Every server you add loads its tool names + instructions into every session's context.** Unused servers waste your context window. Keep the active set small.

### Where config gets written (so you always know)
- **Default (`local`)** → `C:\Users\Admin\.claude.json` under the current project. Only you, only this project.
- **`--scope user`** → `C:\Users\Admin\.claude.json` top-level `mcpServers`. Only you, all projects. Use for always-on personal tools.
- **`--scope project`** → `.mcp.json` in the repo root. Committed to git, reproducible, teammates get an approval prompt. Use for project-specific tools.

### TIER 1 — add now (free, no secrets, highest leverage)

These are user-scope (always-on). Run each in a terminal:

```bash
claude mcp add -s user context7 -- npx -y @upstash/context7-mcp@latest
claude mcp add -s user playwright -- npx -y @playwright/mcp@latest
claude mcp add -s user sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
```

| Server | What it unlocks for TWIN |
|---|---|
| **Context7** (Upstash) | Injects up-to-date, version-specific docs for Flask, SQLAlchemy, psycopg, Stripe SDK into the prompt so Claude stops hallucinating old APIs. Zero-risk, zero-cost. |
| **Playwright** (Microsoft) | Drives a real Chrome via the accessibility tree (faster/more reliable than screenshots) to click through and verify TWIN's UI — AI-driven visual + end-to-end testing of your local dev server. Preferred over Puppeteer (that server is archived). |
| **Sequential Thinking** (official reference) | Structured multi-step reasoning for hard debugging and architecture decisions. One of the 7 still-maintained reference servers. Cheap insurance. |

> First `npx` run may show "Failed to connect" while it downloads. Just re-run `claude mcp list`. For slow starts, raise the `MCP_TIMEOUT` env var (milliseconds).

### TIER 2 — add this phase (Postgres work + Git automation)

**Postgres MCP Pro** — the right Postgres server. **Do NOT use** the archived `@modelcontextprotocol/server-postgres` that blog tutorials still reference; it's unmaintained and tied to SQL-injection-class risk. Use `crystaldba/postgres-mcp` instead — it adds index tuning, EXPLAIN plans, schema intelligence, and DB health checks, genuinely useful while building TWIN's schema.

Add it **project-scoped** pointing at a **LOCAL dev DB**, in restricted/read-only mode. Never point at production, never use a superuser DSN. Requires `uv`/`uvx` (Python) — install with `pip install uv` if you don't have it.

```bash
claude mcp add -s project postgres -e DATABASE_URI=postgresql://user:pw@localhost:5432/twin_dev -- uvx postgres-mcp --access-mode=restricted
```

This writes to a committed `.mcp.json`. The entry looks like:

```json
{
  "mcpServers": {
    "postgres": {
      "type": "stdio",
      "command": "uvx",
      "args": ["postgres-mcp", "--access-mode=restricted"],
      "env": { "DATABASE_URI": "postgresql://user:pw@localhost:5432/twin_dev" }
    }
  }
}
```

> Since TWIN runs on **Railway Postgres, not Supabase**, skip the Supabase MCP entirely.

**GitHub MCP** (optional, nice-to-have). Use GitHub's *official* server via the remote HTTP endpoint — no Docker needed. Use a **fine-grained PAT scoped to the TWIN repo only** (no org-wide/admin scopes):

```bash
claude mcp add -s user --transport http github https://api.githubcopilot.com/mcp -H "Authorization: Bearer YOUR_FINE_GRAINED_PAT"
```

Manages issues, PRs, Actions, code search. Partly redundant with the `gh` CLI in Bash, so treat it as optional.

### TIER 3 — add later by milestone (remote + OAuth = no secrets in config)

```bash
# When TWIN is deployed and you want AI triage of production errors:
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
# then run /mcp -> select sentry -> Authenticate (browser sign-in)

# When you wire payments/subscriptions (per roadmap, post-launch):
claude mcp add --transport http stripe https://mcp.stripe.com
# then /mcp -> Authenticate
```

- **Sentry**: pulls live errors/stack traces + Seer root-cause analysis. Add post-deploy.
- **Stripe**: Stripe API tools + knowledge-base search for checkout/subscriptions. Add when monetizing.

### SKIP these (and why)
- **Memory / knowledge-graph MCP** — redundant with your existing ruflo memory + Claude Code auto-memory; adds context overhead.
- **Brave Search MCP** — archived AND lost its free tier. Use built-in WebSearch/WebFetch; add Tavily/Exa MCP only if you do heavy doc/competitor research.
- **Filesystem MCP** — Claude Code already reads your project dir natively. Only needed for files *outside* the repo.
- **Fetch MCP** — built-in WebFetch covers it.
- **Railway MCP** (`jason-tan-swe`) — community-built, and its API token grants **full account access**. Tempting since TWIN hosts on Railway, but the dashboard/CLI is safer. Add only if you truly want chat-driven deploys; store the token in env, never commit.
- **Figma Dev Mode MCP** — only pays off if you maintain TWIN's UI in Figma. Your Phase-1 UI is already built in Flask templates.

---

## PART 2 — Claude Code Power Setup (config that changes behavior)

### 2.1 CLAUDE.md — your single highest-leverage config

CLAUDE.md is auto-loaded at the start of *every* session. It's a **behavioral contract, not documentation.** The #1 failure pattern: a bloated CLAUDE.md so long that Claude loses your real rules in the noise and ignores them.

**The test for every line:** "Would removing this cause Claude to make a mistake?" If no, delete it.

> **Direct warning for your setup:** your current global `~/.claude/CLAUDE.md` (the ruflo/claude-flow file) is hundreds of lines of swarm/MCP instructions. This is exactly the bloat the official docs warn against and it likely degrades adherence to the rules that matter. Strongly consider trimming the *global* one to under ~50 lines of rules that actually change behavior, and moving the rest into on-demand **skills** (see 2.4).

**Three layers, all additive:**
- `C:\Users\Admin\.claude\CLAUDE.md` — global, all projects. Keep **under ~50 lines**.
- `<repo>\CLAUDE.md` — project, commit to git. Keep **under ~200 lines**.
- `<repo>\CLAUDE.local.md` — personal, **gitignore it** (and it survives compaction).

**Include:** bash commands Claude can't guess, code-style rules that differ from defaults, the test runner + how to run a single test, branch/PR conventions, env-var quirks, non-obvious gotchas.
**Exclude:** anything Claude can read from code, standard conventions, long tutorials, API docs (link with `@path` imports instead, e.g. `See @docs/git-instructions.md`).

Run `/init` in the TWIN repo to auto-generate a starter, then prune.

### 2.2 The core workflow: Plan Mode + Verification

**Plan Mode** prevents Claude from confidently solving the wrong problem. Press **Shift+Tab** to cycle into plan mode — Claude can read and answer but touches nothing until you approve.

The 4-phase loop: **Explore → Plan → Implement → Commit.**
1. Explore in plan mode: "read `/src/auth`, understand session handling."
2. Plan: "add Google OAuth — what files change? create a plan." (**Ctrl+G** opens the plan in your editor to edit directly.)
3. Switch out of plan mode and implement against the plan.
4. Commit + PR.

Make Shift+Tab a reflex for any non-trivial/multi-file/unfamiliar task. **Skip it** for one-sentence diffs (typos, log lines, renames). Or start a session in it: `claude --permission-mode plan`.

**Always give Claude a way to verify its own work** — this is what lets you walk away. Claude stops when work "looks done"; without a pass/fail signal, *you* are the verification loop. Include verification in the prompt ("run the tests after implementing"), use the bundled `/code-review` skill before calling anything done, and demand *evidence* (test output, screenshots) not assertions.

### 2.3 Subagents — the #1 context-preservation tool

A subagent is an isolated Claude with its own context window, system prompt, tool allowlist, and model. All the noisy intermediate file-reads stay in the subagent and never pollute your main conversation — it returns only a summary. A *fresh-context reviewer* also catches more bugs because it isn't biased toward code it just wrote.

Create them as Markdown + YAML frontmatter in `C:\Users\Admin\.claude\agents\` (user, all projects) or `<repo>\.claude\agents\` (project, committed).

**Starter agent — security reviewer** (`.claude/agents/security-reviewer.md`):

```markdown
---
name: security-reviewer
description: Reviews code for security issues in a fresh context. Use after implementing auth, DB, or input-handling changes.
tools: Read, Grep, Glob, Bash
model: opus
---
You are a security reviewer for a Flask + Postgres app. Check for: SQL injection,
missing input validation at system boundaries, secrets in code, unsafe deserialization,
auth/session bugs. Flag ONLY gaps that affect correctness or security — do not
over-engineer or suggest style changes. Report findings with file:line and a fix.
```

Make 2–3: this **security-reviewer**, a **test-runner**, and a **codebase-researcher**. Invoke explicitly: *"Use a subagent to review this for security issues."*

**Cost optimization:** set `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` so your main session runs Opus and subagents run cheaper Sonnet.

### 2.4 Hooks — deterministic guarantees (not advisory)

Unlike CLAUDE.md (advice Claude *may* follow), hooks are shell commands that fire on lifecycle events with **zero exceptions**. The power move is exit codes: a **PreToolUse hook exiting 2 BLOCKS** the tool; a **Stop hook exiting 2 FORCES** Claude to keep working.

Just ask Claude to write them: *"Write a hook that runs my tests on Stop and append it to .claude/settings.json."* Install these 3 in `<repo>\.claude\settings.json`:

1. **PostToolUse auto-format** — run your formatter (black/ruff for Python) on every Edit/Write.
2. **Stop hook test-runner** — runs your test command; blocks the turn from ending until it passes (Claude can override after 8 consecutive blocks).
3. **Desktop notification on Stop + PermissionRequest** — a Windows toast so you know when a background session finishes or needs input.

Example notification hook for Windows (PowerShell toast):

```json
{
  "hooks": {
    "Stop": [
      { "matcher": "", "hooks": [
        { "type": "command",
          "command": "powershell -NoProfile -Command \"[reflection.assembly]::loadwithpartialname('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('Claude finished a task')\"" }
      ]}
    ]
  }
}
```

> Known gotcha: hooks occasionally don't fire (GitHub issue #6305). Verify what's active with `/hooks`.

### 2.5 Skills — reusable workflows that load on demand

A skill is a named instruction bundle that Claude auto-invokes when relevant, or you call with `/skill-name`. **Key difference vs CLAUDE.md:** broad always-on rules go in CLAUDE.md, but domain knowledge and *sometimes-relevant* workflows go in skills so they don't consume context every session.

Create `<repo>\.claude\skills\<name>\SKILL.md`. Convert repeatable multi-step workflows (`fix-issue`, `write-pr`, `run-migration`) into skills. Use `disable-model-invocation: true` for side-effecting workflows you only want triggered manually, and `$ARGUMENTS` to capture input (e.g. `/fix-issue 1234`).

Bundled skills worth the habit: `/code-review`, `/security-review`, `/simplify`, `/verify`, and `/fewer-permission-prompts`.

### 2.6 Permissions — kill the endless approval prompts

Add to `<repo>\.claude\settings.json`. **Deny always wins.**

```json
{
  "permissions": {
    "allow": ["Bash(git status)", "Bash(npm run *)", "Bash(pytest *)", "Bash(ruff *)", "Bash(black *)"],
    "ask":   ["Bash(npm install *)", "Bash(pip install *)"],
    "deny":  ["Read(./.env*)", "Bash(rm -rf:*)"]
  }
}
```

Add the `.env` + `rm -rf` deny rules **immediately**. Then run the bundled **`/fewer-permission-prompts`** skill once — it scans your transcripts and auto-builds an allowlist from your real usage. For trusted directions, `claude --permission-mode auto` lets a classifier approve routine work and only stops for risky actions.

### 2.7 Session hygiene — the core performance constraint

Performance degrades as the context window fills; **never use the final ~20%** for complex multi-file work.

- **`/clear`** between unrelated tasks — the single biggest performance win (preserves CLAUDE.md). After 2 failed corrections, `/clear` and rewrite a better prompt instead of correcting again.
- **`/context`** — visualize token usage before big multi-file work.
- **`/compact <focus>`** — summarize to reclaim tokens. Customize survival via CLAUDE.md: "When compacting, always preserve modified files + test commands."
- **`/rewind`** (or Esc-Esc) — restore conversation/code to any checkpoint. Note: it tracks only Claude's edits — **not** a git replacement.
- **Esc** stops Claude mid-action while preserving context — redirect early instead of letting it run off-track.

### 2.8 Parallel + background agents (graduate to this last)

- **Background one agent:** press **Ctrl+B** *while* a long test/build runs (not after). Monitor with `/tasks`. Pair it with the notification hook from 2.4.
- **Parallel isolation via worktrees:** `claude --worktree feature-auth` creates an isolated git checkout at `.claude/worktrees/<name>/` on its own branch. Add `.claude/worktrees/` to `.gitignore`.
- **Discipline:** only parallelize tasks with **no shared files, no dependencies, and a one-sentence boundary** (e.g. UI / tests / backend / docs). The proven solo pattern is 2–3 worktrees, each owning a non-overlapping file domain, relying on notification hooks instead of polling.

Start simple: **one** background agent + a notification hook. Graduate to 2–3 worktrees only once you can describe each task in one sentence and they touch different files.

---

## PART 3 — VS Code Extensions + Local-Model Stack

### 3.1 Core agent: the hybrid surface
Install the **official Claude Code VS Code extension** (Anthropic, v2.0) as your primary surface — it adds inline/side-by-side diffs, plan review-and-edit, @-mentions tied to file+line, tabbed history, and checkpoints (Esc-Esc / `/rewind`). **But also keep the CLI running in the integrated terminal** — the CLI gets features first and has full slash-command support, `/add-dir` multi-repo, and flags the extension lacks. They share the same conversation history (`claude --resume` continues an extension session in the terminal). This hybrid is the standard power-user setup; no conflict.

### 3.2 The high-value, zero-conflict utility extensions
Install all of these — none overlap with each other or with Claude Code; they sharpen the feedback loop Claude operates in:

| Extension | Why |
|---|---|
| **Error Lens** | Surfaces diagnostics inline on the code line — huge for fast Claude edit→review loops. Free. |
| **Python + Pylance** (Microsoft) | Official Python language server. Essential for TWIN's Flask stack. Free. |
| **GitLens** (free tier) | Inline blame + commit history. Free tier is plenty; don't pay for Pro. |
| **Playwright Test** | In-editor run/debug/record of E2E tests — pairs with Claude writing them (and the Playwright MCP). Free. |
| **Bruno** *or* **REST Client (.http)** | API testing with collections stored as **plain files in your repo** (git-friendly). **Avoid Thunder Client** — it paywalled git-sync in 2025. |
| **One Postgres explorer** | For TWIN's Postgres phase: **Database Client (cweijan)** in-editor, or **DBeaver** standalone for heavier schema work. Install only **one** — multiple DB extensions conflict on connections. |

### 3.3 Don't stack a second agent
Do **not** run Cline / Kilo / Continue's agent alongside Claude Code on the same files — two agents cause redundant context, conflicting diffs, and wasted tokens. One agent is enough.
- **Roo Code** — archived (May 2026). Skip; Kilo Code is the successor.
- **Continue** — pivoted to AI-checks-in-CI; deprioritize as an IDE assistant.
- **Cline** — if you ever want a free BYOK fallback routing to a local Ollama model, install *this one* (best-maintained, clean approval gates) — but never run its agent and Claude's on the same file concurrently.
- **Aider** — optional terminal complement for strict atomic-commit-per-change Git discipline. Different surface, no conflict with the VS Code extension.

### 3.4 Local models on the RTX 4080 (16 GB VRAM) — cost-saving fallback, not a Claude replacement
- **Ollama** = primary local backend. Lightweight CLI daemon, OpenAI-compatible API at `localhost:11434` — wires cleanly into Cline/Aider/n8n. Matches your existing "use Ollama" preference.
- Pull **`qwen3-coder`** for coding tasks — top consumer-hardware coding model, beats `llama3.1:8b` for code, runs comfortably quantized on 16 GB.
- **LM Studio** — optional GUI for *browsing/benchmarking* models only. **Don't run it as a second backend** alongside Ollama (VRAM/port contention).

```bash
ollama pull qwen3-coder
```

---

## DO THIS TODAY — copy-paste checklist (ordered by impact)

```bash
# 1. CLAUDE.md (biggest lever) — generate a starter, then PRUNE ruthlessly.
#    Also trim your bloated global ~/.claude/CLAUDE.md to <50 lines.
claude   # then inside: /init

# 2. Tier-1 MCP servers (free, no secrets, always-on)
claude mcp add -s user context7 -- npx -y @upstash/context7-mcp@latest
claude mcp add -s user playwright -- npx -y @playwright/mcp@latest
claude mcp add -s user sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
claude mcp list   # verify (re-run if a server shows "Failed to connect" while npx downloads)

# 3. Safety rails — add deny rules to <repo>\.claude\settings.json:
#    "deny": ["Read(./.env*)", "Bash(rm -rf:*)"]
#    then run this skill once to auto-build an allowlist:
#    /fewer-permission-prompts

# 4. VS Code: install Claude Code extension + Error Lens + Python/Pylance
#    + GitLens (free) + Playwright Test + Bruno + one Postgres explorer.
#    Keep the CLI running in the integrated terminal (hybrid setup).

# 5. Postgres MCP Pro — DEV DB ONLY, read-only. (needs uv: pip install uv)
claude mcp add -s project postgres -e DATABASE_URI=postgresql://user:pw@localhost:5432/twin_dev -- uvx postgres-mcp --access-mode=restricted

# 6. Subagents — ask Claude: "Create a security-reviewer subagent (tools: Read,
#    Grep, Glob, Bash; model: opus) in .claude/agents/." Repeat for test-runner.

# 7. Hooks — ask Claude: "Write 3 hooks in .claude/settings.json: auto-format on
#    PostToolUse (ruff/black), run pytest on Stop, and a Windows toast on Stop."

# 8. Cost control for subagents
setx CLAUDE_CODE_SUBAGENT_MODEL sonnet   # new terminals will pick this up

# 9. Local fallback model (optional)
ollama pull qwen3-coder
```

**Then build the habits that matter more than any install:** Shift+Tab into Plan Mode for non-trivial tasks → make Claude verify with tests/`/code-review` → `/clear` between unrelated tasks → check `/context` before big multi-file work.

**Defer until their milestone:** Sentry MCP (on deploy), Stripe MCP (on monetization), Railway MCP (only if you want chat deploys, god-mode token), worktrees/parallel agents (once tasks are cleanly separable).