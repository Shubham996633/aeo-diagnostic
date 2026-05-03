# AEO Diagnostic

> When shoppers ask AI for product recommendations, does your brand get the answer?

**SEO is for Google. AEO is for ChatGPT and Gemini.** This tool runs buyer-intent
questions through GPT-4o-mini and Gemini 2.0 in parallel, extracts every brand
mentioned, and grades how often **your** brand surfaces vs your competitors.

A Gemini agent drives the smart parts: brainstorming the questions, fuzzy-matching
brand mentions across alias variations, and writing strategic recommendations
from the aggregated results.

---

## Demo flow

1. Sign up with email / password
2. Enter a brand + category (or pick a preset: Athletic Greens, Liquid Death, Allbirds)
3. Watch a **live agent activity feed** stream 5 phase blocks as the diagnostic runs
   1. Generate buyer-intent questions
   2. Query LLM engines in parallel (with per-engine progress bars)
   3. Extract brand mentions
   4. Score visibility & share-of-voice
   5. Write strategic recommendations
4. Land on a report card with:
   - **AEO Score** (0–100, composite of visibility / position / sentiment)
   - Per-engine visibility breakdown
   - Share-of-voice donut vs competitors
   - 3 actionable recommendations from the agent
   - Expandable per-question results with rendered markdown answers

---

## APIs & tools used

| | |
|---|---|
| **OpenAI API** | GPT-4o-mini answers buyer questions as one of the engines under test |
| **Google Gemini API** | Both an engine under test (Gemini 2.0 Flash) **and** the agent orchestrator (question generation, mention extraction, recommendations — all using structured-output JSON schemas) |
| **bcrypt** | Password hashing for user accounts |
| **SQLite** | Persistent store for users + reports |

---

## Architecture

```
Next.js  ──►  FastAPI  ──►  Gemini agent (structured output)
                  │           ├─ generate_buyer_questions()
                  │           ├─ extract_brand_mentions()
                  │           └─ write_recommendations()
                  │
                  └────►  Engines under test (parallel)
                           ├─ OpenAI GPT-4o-mini
                           └─ Gemini 2.0 Flash

Server-Sent Events stream every agent step live to the browser.
```

### Backend (`backend/`)
- **FastAPI** with Server-Sent Events for streaming pipeline progress
- **Pipeline** fans out questions across both LLMs in parallel, extracts mentions,
  scores share-of-voice, generates recommendations
- **Auth** with bcrypt-hashed passwords and SQLite
- **Storage** in SQLite — reports + users, JSON payload per report

### Frontend (`frontend/`)
- **Next.js 15** App Router with Tailwind 3 + Recharts
- **Real-time phase blocks** consume SSE events and render numbered phase cards
- **Markdown** rendering on engine answers (proper `**bold**`, lists, headers)
- **Auth UX** — sign in / sign up tabs, show/hide password, remember-me toggle
  (localStorage vs sessionStorage), avatar dropdown with initials
- **History** sidebar with hover-to-delete

---

## Getting started

### Prerequisites
- Python 3.11+ with [Poetry](https://python-poetry.org/)
- Node 18+
- An OpenAI API key
- A Google Gemini API key (from [AI Studio](https://aistudio.google.com/apikey) — auto-enables the API)

### Backend
```bash
cd backend
cp .env.example .env
# edit .env with your OPENAI_API_KEY and GEMINI_API_KEY
poetry install
poetry run uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

---

## API reference

```
POST /auth/register      { email, password, name }    → { email, name }
POST /auth/login         { email, password }          → { email, name }
GET  /auth/exists?email=...                           → { exists: bool }

POST /diagnose           DiagnoseRequest              → DiagnoseReport (sync)
POST /diagnose/stream    DiagnoseRequest              → text/event-stream
GET  /reports?user_email=...                          → ReportSummary[]
GET  /reports/{id}                                    → DiagnoseReport
DELETE /reports/{id}?user_email=...                   → { deleted: true }
```

---

## Tech stack

**Backend:** Python 3.11 · FastAPI · Poetry · SQLite · bcrypt · `google-genai` · `openai`

**Frontend:** Next.js 15 · TypeScript · Tailwind CSS · Recharts · react-markdown · lucide-react

---

## Keeping the Render free tier warm

Render free dynos sleep after 15 minutes of idle traffic, with a 30–60s cold start
on the next hit. Three layered defenders keep this from biting reviewers:

1. **GitHub Actions cron** — `.github/workflows/keepalive.yml` pings every 5 min.
   Set the repo variable `BACKEND_URL` to your Render URL to activate.
2. **External uptime monitor** (recommended) — UptimeRobot free tier pings every
   5 min from external infra. Reliable through GitHub peak-load windows.
3. **Self-hosted Python pinger** — `scripts/keepalive.py` (stdlib only, no deps).
   Three ways to run it:

   ```bash
   # one-shot from any cron scheduler
   */5 * * * * python3 /path/to/repo/scripts/keepalive.py --once \
       >> /tmp/aeo-keepalive.log 2>&1

   # long-running loop (tmux / nohup / Docker)
   python3 scripts/keepalive.py

   # systemd service (Linux) — see scripts/aeo-keepalive.service for setup
   ```

   Configurable via env vars: `AEO_BACKEND_URL`, `AEO_PING_INTERVAL`, `AEO_PING_TIMEOUT`.

## What's next

- Per-engine recommendations (e.g., "GPT ranks you #2, Gemini #4 — focus on Gemini optimization")
- Citation tracking — extract URLs the LLMs cite
- Weekly cron job to re-run and chart score over time
- PDF export of report card
- Integration with Anthropic Claude as a third engine

---

## License

MIT
