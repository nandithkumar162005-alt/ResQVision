# ResQVision — Stream 3: Dispatch Backend & Communications Engine

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00.svg?style=flat&logo=python)](https://www.sqlalchemy.org/)
[![Pydantic](https://img.shields.io/badge/Pydantic-2.0+-E92063.svg?style=flat&logo=pydantic)](https://docs.pydantic.dev/)
[![Telegram](https://img.shields.io/badge/Telegram_Bot_API-Live-0088cc.svg?style=flat&logo=telegram)](https://core.telegram.org/bots/api)

> **Central State Manager & Emergency Dispatch Orchestration Engine for the ResQVision Disaster Response System.**  
> Built for the 4-stream semester capstone project connecting **Stream 2 (AI Damage Inference)** to **Stream 4 (Command Dashboard)** through a **human-in-the-loop verification gate**.

---

## 1. System Architecture & The "Why"

In real-world incident command systems (ICS), **fully automated alert systems that mobilize multi-agency emergency forces based purely on AI detection are an acknowledged hazard**. An unverified false positive diverts critical medical, fire, and police resources from real emergencies, triggers civilian panic, and destroys institutional trust.

ResQVision Stream 3 implements a **staged, verification-gated, wave-based dispatch pipeline**:

```
[STREAM 2: AI Inference]
         │  POST /api/assessments (Damage score, zones, population)
         ▼
[STREAM 3: State Machine & Central DB]
         │
         ├──► WAVE 1: NDRF Ground Unit (Telegram Alert + Verification CTA)
         │
         ▼
[HUMAN-IN-THE-LOOP VERIFICATION GATE]
   POST /api/assessments/:event_id/verify
         │
         ├─────────────────────────────────────────┐
         ▼                                         ▼
   [IF CONFIRMED]                            [IF DENIED]
   • dispatch_status = "fully_dispatched"    • dispatch_status = "ndrf_denied"
   • Concurrently fires:                     • Pipeline STOPS immediately.
     - WAVE 2: Medical Corps (Triage)        • False alarm averted & logged.
     - WAVE 3: Police (Cordon & Evacuation)  • Waves 2–5 are NOT triggered.
     - WAVE 4: Fire & Rescue (Hazmat/Search)
     - WAVE 5: Command Authority (SITREP)
         │
         ▼
[STREAM 4: Command Dashboard]
   Polls GET /api/active-disasters & GET /api/assessments/:id/dispatch-log
```

---

## 2. API Contracts (Ground Truth Interfaces)

### Input Contract: Stream 2 &rarr; Stream 3
- **Endpoint:** `POST /api/assessments`
- **Payload Shape:**
```json
{
  "event_id": "a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab",
  "damage_score_out_of_100": 72,
  "affected_population_estimate": 8300,
  "critical_zones": [
    {
      "lat": 19.0761,
      "lng": 72.8780,
      "damage_classification": "destroyed"
    },
    {
      "lat": 19.0790,
      "lng": 72.8750,
      "damage_classification": "major_damage"
    }
  ]
}
```
*Validated strictly using Pydantic. Malformed payloads return a clean `422 Unprocessable Entity`.*

### Output Contract: Stream 3 &rarr; Stream 4
- **Endpoint:** `GET /api/active-disasters`
- **Response Shape:**
```json
{
  "status": "success",
  "data": [
    {
      "event_id": "a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab",
      "dispatch_status": "fully_dispatched",
      "damage_score_out_of_100": 72,
      "affected_population_estimate": 8300,
      "critical_zones": [
        {
          "lat": 19.0761,
          "lng": 72.8780,
          "damage_classification": "destroyed"
        }
      ]
    }
  ]
}
```

### Verification Endpoint (NDRF Ground Response)
- **Endpoint:** `POST /api/assessments/{event_id}/verify`
- **Payload:**
```json
{
  "confirmed": true,
  "adjusted_severity": 85
}
```
*(Or `{"confirmed": false, "adjusted_severity": null}` to deny)*

### Dispatch Timeline Endpoint (Stream 4 Sidebar)
- **Endpoint:** `GET /api/assessments/{event_id}/dispatch-log`

---

## 3. Database Setup (Supabase / Neon / Local SQLite)

Stream 3 supports hosted PostgreSQL (Supabase / Neon) for cloud team integration or instant zero-setup SQLite for local testing.

### Option A: Cloud PostgreSQL with Supabase (Recommended for Team Demo)
1. Sign up for free at [supabase.com](https://supabase.com).
2. Click **New Project**, name it `resqvision`, set a secure database password, and select your nearest region.
3. Once provisioned, go to **Project Settings &rarr; Database**.
4. Under **Connection String**, copy the **URI** (Connection pooling mode or Direct):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
5. Paste this into your `.env` file as `DATABASE_URL`.

### Option B: Cloud PostgreSQL with Neon
1. Sign up at [neon.tech](https://neon.tech) and create a project called `resqvision`.
2. Copy the provided connection string:
   ```
   postgresql://[USER]:[PASSWORD]@[ENDPOINT].neon.tech/neondb?sslmode=require
   ```
3. Paste into `.env` as `DATABASE_URL`.

### Option C: Local SQLite (Zero-Setup Fallback)
If you don't have internet or want to test instantly offline without setting up a cloud DB, simply set:
```bash
DATABASE_URL=sqlite:///./disaster_dispatch.db
```
The server will automatically generate and initialize `disaster_dispatch.db` on startup!

---

## 4. Telegram Bot Setup Walkthrough

Stream 3 uses the official Telegram Bot API to dispatch live alerts to distinct agency channels:
- **NDRF:** `TELEGRAM_CHAT_ID_NDRF`
- **Medical Corps:** `TELEGRAM_CHAT_ID_MEDICAL`
- **Police / Law Enforcement:** `TELEGRAM_CHAT_ID_POLICE`
- **Fire & Rescue:** `TELEGRAM_CHAT_ID_FIRE`
- **Command Authority:** `TELEGRAM_CHAT_ID_COMMAND`

### Step 1: Create Your Bot
1. Open Telegram and search for `@BotFather`.
2. Send `/newbot`.
3. Give your bot a name (e.g. `ResQVision Dispatch Engine`) and a unique username ending in `bot` (e.g. `ResQVisionDispatch_bot`).
4. `@BotFather` will reply with your **HTTP API Token**:
   ```
   7123456789:AAH...example_token...
   ```
5. Save this token as `TELEGRAM_BOT_TOKEN` in your `.env`.

### Step 2: Create Agency Channels / Groups
1. In Telegram, create 5 groups (or 1 test group to simulate all 5):
   - `ResQVision - NDRF`
   - `ResQVision - Medical`
   - `ResQVision - Police`
   - `ResQVision - Fire`
   - `ResQVision - Command Authority`
2. Add your newly created bot to each group as an Administrator/Member.

### Step 3: Get Group Chat IDs
1. Add `@RawDataBot` temporarily to the group. It will immediately print a JSON message showing `"chat": { "id": -100xxxxxxxxxx }`.
2. Copy the negative number (e.g. `-1002345678901`).
3. Remove `@RawDataBot`.
4. Add the chat ID to `.env`:
   ```env
   TELEGRAM_CHAT_ID_NDRF=-1002345678901
   TELEGRAM_CHAT_ID_MEDICAL=-1002345678902
   TELEGRAM_CHAT_ID_POLICE=-1002345678903
   TELEGRAM_CHAT_ID_FIRE=-1002345678904
   TELEGRAM_CHAT_ID_COMMAND=-1002345678905
   ```

*(Note: If you leave tokens empty or set `TELEGRAM_BOT_TOKEN=mock`, the system runs in simulation mode, logging dispatches clearly to the console and database without failing!)*

---

## 5. Quickstart & Installation

```bash
# 1. Navigate to the backend directory
cd stream3-dispatch-backend

# 2. Copy the environment template
cp .env.example .env

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run database migrations (or let FastAPI auto-initialize tables on boot)
alembic upgrade head

# 5. Launch the backend server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Server endpoints will be live at:
- **Interactive Verification Demo Console:** [http://localhost:8000/demo](http://localhost:8000/demo)
- **Interactive API Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Active Disasters for Stream 4:** [http://localhost:8000/api/active-disasters](http://localhost:8000/api/active-disasters)

---

## 6. How to Demo During the Viva

We built an **interactive Web Verification Console at `/demo`** specifically for the semester evaluation!

### Demo Flow 1: The "Happy Path" (Confirmed Ground Truth)
1. Open [http://localhost:8000/demo](http://localhost:8000/demo) in your browser.
2. Click **"New UUID"** and then **"Submit Stream 2 Assessment &rarr; Trigger Wave 1 (NDRF)"**.
3. Point out to your examiners:
   - Status transitions to `ndrf_notified`.
   - Wave 1 Telegram alert was dispatched to the NDRF group.
   - Waves 2–5 have **NOT** been sent yet (the verification gate is holding).
4. In the verification section, enter an adjusted severity (e.g. `85`) and click **"CONFIRM GROUND TRUTH (Trigger Waves 2–5)"**.
5. Observe the state transition:
   - Status changes to `fully_dispatched`.
   - Waves 2 (Medical), 3 (Police), 4 (Fire), and 5 (Command Authority) fire concurrently.
   - The live dispatch timeline displays the complete role-specific audit trail.

### Demo Flow 2: The Safety Gate (False Alarm Prevention)
1. Submit another assessment.
2. Click **"DENY (FALSE ALARM)"**.
3. Point out to your examiners:
   - Status transitions to `ndrf_denied`.
   - The pipeline **STOPS**.
   - No medical, police, or fire resources are dispatched.
   - Explain how this matches real-world Incident Command Protocols to avert unnecessary multi-agency mobilization.

### Demo Flow 3: Idempotency Protection
1. Click **"CONFIRM GROUND TRUTH"** again on an already dispatched event.
2. Show that the backend returns an idempotent no-op response without firing duplicate Telegram messages or corrupting the dispatch log.

---

## 7. Running Automated Tests

Run unit tests covering message templates, state machine transitions, wave gating, idempotency, and 404 safety:

```bash
pytest -v
```

---

## 8. Viva Talking Points & Architectural Decisions

1. **Why Human-in-the-Loop?** AI models on satellite imagery have uncertainty bounds (cloud cover, resolution limits). Gating escalation behind on-ground NDRF verification prevents costly and dangerous false positive mobilizations.
2. **Why Role-Specific Templates?** NDRF needs coordinates and a verification action link; Medical needs casualty estimates and priority triage sectors; Police need cordon coordinates and evacuation routes; Fire needs structural damage scores and hazmat indicators. Generic broadcasts cause communication friction.
3. **Database Transactions:** Waves 2–5 status updates and dispatch log insertions are wrapped in an atomic database transaction (`db.begin_nested()`), guaranteeing no half-dispatched states.
4. **Idempotency Protection:** Double-clicks or webhook retries check current state and exit safely as a no-op if already resolved.
5. **Permissive CORS:** Configured with `*` allow-origin to ensure seamless integration with Stream 4's frontend polling on different ports.
