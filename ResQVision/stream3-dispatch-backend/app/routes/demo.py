"""Interactive Demo & Field Verification Console for viva presentation."""

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["Interactive Viva Demo Portal"])


@router.get("/demo", response_class=HTMLResponse, summary="Interactive NDRF Field Verification Portal")
def demo_portal():
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ResQVision — Stream 3 Live Dispatch Engine</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card: #111827;
      --card-border: #1f2937;
      --accent: #f59e0b;
      --accent-hover: #d97706;
      --success: #10b981;
      --danger: #ef4444;
      --info: #3b82f6;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --code-bg: #030712;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      padding: 24px;
      line-height: 1.5;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 28px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .badge-amber { background: rgba(245, 158, 11, 0.2); color: var(--accent); border: 1px solid rgba(245, 158, 11, 0.4); }
    .badge-green { background: rgba(16, 185, 129, 0.2); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.4); }
    .badge-red { background: rgba(239, 68, 68, 0.2); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.4); }
    .badge-blue { background: rgba(59, 130, 246, 0.2); color: var(--info); border: 1px solid rgba(59, 130, 246, 0.4); }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }

    .card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; font-weight: 600; }
    input, select, textarea {
      width: 100%;
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      color: var(--text);
      padding: 10px 14px;
      font-family: inherit;
      font-size: 0.9rem;
      margin-bottom: 14px;
    }
    input:focus, textarea:focus { outline: none; border-color: var(--accent); }
    button {
      cursor: pointer;
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      padding: 10px 18px;
      border-radius: 8px;
      border: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-primary { background: var(--accent); color: #000; }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-success { background: var(--success); color: #fff; }
    .btn-success:hover { background: #059669; }
    .btn-danger { background: var(--danger); color: #fff; }
    .btn-danger:hover { background: #dc2626; }
    .btn-secondary { background: #374151; color: #fff; }
    .btn-secondary:hover { background: #4b5563; }

    .console-box {
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      max-height: 280px;
      overflow-y: auto;
      white-space: pre-wrap;
      color: #a7f3d0;
    }
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 10px;
    }
    .timeline-item {
      padding: 12px;
      border-radius: 8px;
      background: rgba(255,255,255,0.03);
      border-left: 4px solid var(--accent);
      font-size: 0.85rem;
    }
    .pipeline-steps {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin: 16px 0;
      text-align: center;
    }
    .step-box {
      padding: 10px 6px;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      font-size: 0.75rem;
    }
    .step-active { border-color: var(--accent); background: rgba(245, 158, 11, 0.1); color: var(--accent); font-weight: 700; }
    .step-done { border-color: var(--success); background: rgba(16, 185, 129, 0.1); color: var(--success); font-weight: 700; }
    .step-denied { border-color: var(--danger); background: rgba(239, 68, 68, 0.1); color: var(--danger); font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1 style="font-size: 1.6rem; font-weight: 800; display: flex; align-items: center; gap: 10px;">
          ResQVision <span class="badge badge-amber">Stream 3</span>
        </h1>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Dispatch Backend, State Machine & Multi-Agency Communications Engine</p>
      </div>
      <div>
        <a href="/docs" target="_blank" style="color: var(--accent); text-decoration: none; font-size: 0.85rem; margin-right: 14px;">Interactive API Docs (Swagger) &rarr;</a>
        <button class="btn-secondary" onclick="loadActiveEvents()" style="padding: 6px 12px; font-size: 0.8rem;">Refresh Data</button>
      </div>
    </header>

    <!-- Pipeline Architecture Explainer Banner -->
    <div class="card" style="margin-bottom: 24px; border-color: #2e384d;">
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">
        Human-in-the-Loop Multi-Wave Dispatch Architecture
      </div>
      <div class="pipeline-steps" id="pipelineIndicators">
        <div class="step-box" id="step-stream2">1. Stream 2 Ingestion<br><span style="color:var(--text-muted);">POST /api/assessments</span></div>
        <div class="step-box" id="step-wave1">2. Wave 1: NDRF<br><span style="color:var(--text-muted);">Ground Verification</span></div>
        <div class="step-box" id="step-gate">3. Human Gate<br><span style="color:var(--text-muted);">POST /verify</span></div>
        <div class="step-box" id="step-waves">4. Waves 2-5<br><span style="color:var(--text-muted);">Medical, Police, Fire, SitRep</span></div>
        <div class="step-box" id="step-stream4">5. Stream 4 Poll<br><span style="color:var(--text-muted);">GET /api/active-disasters</span></div>
      </div>
    </div>

    <div class="grid">
      <!-- Left Column: Simulation & Field Verification -->
      <div class="card">
        <div class="card-title">
          <span>Simulation: Stream 2 &rarr; Stream 3 Ingestion</span>
          <span class="badge badge-blue">Input Contract</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
          Send a realistic damage assessment payload as if forwarded by Stream 2 AI inference.
        </p>

        <label>Disaster Event ID (UUID):</label>
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <input type="text" id="eventIdInput" placeholder="Auto-generated UUID">
          <button class="btn-secondary" onclick="generateNewUUID()" style="white-space: nowrap; padding: 6px 12px;">New UUID</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label>Damage Score (0-100):</label>
            <input type="number" id="damageScoreInput" value="74" min="0" max="100">
          </div>
          <div>
            <label>Affected Population:</label>
            <input type="number" id="affectedPopInput" value="8450" min="0">
          </div>
        </div>

        <label>Disaster Type:</label>
        <input type="text" id="disasterTypeInput" value="Urban Earthquake">

        <button class="btn-primary" onclick="simulateStream2Post()" style="width: 100%; margin-bottom: 20px;">
          Submit Stream 2 Assessment &rarr; Trigger Wave 1 (NDRF)
        </button>

        <div style="border-top: 1px solid var(--card-border); padding-top: 20px; margin-top: 20px;">
          <div class="card-title">
            <span>NDRF Verification Checkpoint</span>
            <span class="badge badge-amber">Gate</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
            Simulate the NDRF field commander's response. Confirming unlocks Waves 2-5; Denying halts pipeline.
          </p>

          <label>Selected Target Event:</label>
          <input type="text" id="verifyTargetEventId" readonly style="color: var(--accent); font-weight: 600;">

          <label>Adjust Severity (Optional, Ground-truth refinement):</label>
          <input type="number" id="adjustSeverityInput" placeholder="Leave empty to keep AI score" min="0" max="100">

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <button class="btn-success" onclick="verifyEvent(true)">
              CONFIRM GROUND TRUTH<br><small>(Trigger Waves 2-5)</small>
            </button>
            <button class="btn-danger" onclick="verifyEvent(false)">
              DENY (FALSE ALARM)<br><small>(Halt Pipeline)</small>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column: Live Status & Dispatch Timeline -->
      <div class="card">
        <div class="card-title">
          <span>System State & Dispatch Log</span>
          <span class="badge badge-green">Stream 4 Contract</span>
        </div>

        <label>Active Events in Database:</label>
        <select id="eventsDropdown" onchange="onEventSelected(this.value)">
          <option value="">Loading events...</option>
        </select>

        <div id="selectedEventDetails" style="margin-bottom: 16px; font-size: 0.85rem;">
          <span style="color: var(--text-muted);">Select an event above to inspect live state.</span>
        </div>

        <label>Dispatch Timeline (Audit Log):</label>
        <div class="timeline" id="dispatchTimeline">
          <div class="timeline-item" style="color: var(--text-muted);">No dispatch records loaded.</div>
        </div>

        <div style="margin-top: 20px;">
          <label>Live API Response Log:</label>
          <div class="console-box" id="consoleOutput">Console ready. Awaiting user interaction...</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    function log(msg) {
      const box = document.getElementById("consoleOutput");
      const ts = new Date().toLocaleTimeString();
      box.textContent = `[${ts}] ${msg}\\n` + box.textContent;
    }

    function generateNewUUID() {
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      document.getElementById("eventIdInput").value = uuid;
      document.getElementById("verifyTargetEventId").value = uuid;
    }

    async function loadActiveEvents() {
      try {
        const resp = await fetch("/api/active-disasters");
        const res = await resp.json();
        const dd = document.getElementById("eventsDropdown");
        dd.innerHTML = "";

        if (!res.data || res.data.length === 0) {
          dd.innerHTML = '<option value="">No events found</option>';
          return;
        }

        res.data.forEach((ev, idx) => {
          const opt = document.createElement("option");
          opt.value = ev.event_id;
          opt.textContent = `${ev.event_id.slice(0, 8)}... | ${ev.dispatch_status.toUpperCase()} | Score: ${ev.damage_score_out_of_100}`;
          if (idx === 0) opt.selected = true;
          dd.appendChild(opt);
        });

        if (res.data[0]) {
          onEventSelected(res.data[0].event_id);
        }
      } catch (err) {
        log("Error loading active events: " + err);
      }
    }

    async function onEventSelected(eventId) {
      if (!eventId) return;
      document.getElementById("verifyTargetEventId").value = eventId;
      try {
        const resp = await fetch(`/api/assessments/${eventId}`);
        const data = await resp.json();
        const ev = data.data;

        document.getElementById("selectedEventDetails").innerHTML = `
          <strong>Event:</strong> <code>${ev.event_id}</code><br>
          <strong>Status:</strong> <span class="badge ${getStatusBadgeClass(ev.dispatch_status)}">${ev.dispatch_status}</span><br>
          <strong>Damage Score:</strong> ${ev.damage_score_out_of_100}/100 | <strong>Population:</strong> ${ev.affected_population_estimate.toLocaleString()}<br>
          <strong>Critical Zones:</strong> ${ev.critical_zones.length} zones monitored
        `;

        updatePipelineVisual(ev.dispatch_status);
        loadDispatchLog(eventId);
      } catch (e) {
        log("Error fetching event details: " + e);
      }
    }

    function getStatusBadgeClass(status) {
      if (status === 'fully_dispatched') return 'badge-green';
      if (status === 'ndrf_denied') return 'badge-red';
      if (status === 'ndrf_notified') return 'badge-amber';
      return 'badge-blue';
    }

    function updatePipelineVisual(status) {
      const sStream2 = document.getElementById("step-stream2");
      const sWave1 = document.getElementById("step-wave1");
      const sGate = document.getElementById("step-gate");
      const sWaves = document.getElementById("step-waves");
      const sStream4 = document.getElementById("step-stream4");

      [sStream2, sWave1, sGate, sWaves, sStream4].forEach(el => el.className = "step-box");

      sStream2.className = "step-box step-done";
      sStream4.className = "step-box step-active";

      if (status === 'received') {
        sWave1.className = "step-box step-active";
      } else if (status === 'ndrf_notified') {
        sWave1.className = "step-box step-done";
        sGate.className = "step-box step-active";
      } else if (status === 'ndrf_confirmed' || status === 'fully_dispatched') {
        sWave1.className = "step-box step-done";
        sGate.className = "step-box step-done";
        sWaves.className = "step-box step-done";
      } else if (status === 'ndrf_denied') {
        sWave1.className = "step-box step-done";
        sGate.className = "step-box step-denied";
        sWaves.className = "step-box";
      }
    }

    async function loadDispatchLog(eventId) {
      try {
        const resp = await fetch(`/api/assessments/${eventId}/dispatch-log`);
        const json = await resp.json();
        const container = document.getElementById("dispatchTimeline");
        container.innerHTML = "";

        if (!json.data || json.data.length === 0) {
          container.innerHTML = '<div class="timeline-item">No dispatch logs yet.</div>';
          return;
        }

        json.data.forEach(logEntry => {
          const item = document.createElement("div");
          item.className = "timeline-item";
          const time = new Date(logEntry.sent_at).toLocaleTimeString();
          item.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <strong>Wave ${logEntry.wave_number}: ${logEntry.team_name}</strong>
              <span class="badge ${logEntry.status === 'sent' ? 'badge-green' : 'badge-amber'}">${logEntry.status.toUpperCase()}</span>
            </div>
            <div style="color:var(--text-muted); font-size:0.75rem; margin-bottom:6px;">Timestamp: ${time}</div>
            <div style="font-family:'JetBrains Mono', monospace; font-size:0.75rem; white-space:pre-wrap; background:rgba(0,0,0,0.3); padding:8px; border-radius:6px;">${escapeHtml(logEntry.message_content)}</div>
          `;
          container.appendChild(item);
        });
      } catch (e) {
        log("Error loading dispatch logs: " + e);
      }
    }

    function escapeHtml(text) {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    async function simulateStream2Post() {
      const eventId = document.getElementById("eventIdInput").value.trim();
      const damageScore = parseInt(document.getElementById("damageScoreInput").value, 10);
      const affectedPop = parseInt(document.getElementById("affectedPopInput").value, 10);
      const disasterType = document.getElementById("disasterTypeInput").value.trim();

      const payload = {
        event_id: eventId,
        damage_score_out_of_100: damageScore,
        affected_population_estimate: affectedPop,
        disaster_type: disasterType,
        critical_zones: [
          { lat: 19.0761, lng: 72.8780, damage_classification: "destroyed" },
          { lat: 19.0790, lng: 72.8750, damage_classification: "major_damage" }
        ]
      };

      log(`[POST /api/assessments] Sending payload: ${JSON.stringify(payload)}`);

      try {
        const resp = await fetch("/api/assessments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const res = await resp.json();
        log(`[POST /api/assessments] Response (${resp.status}): ${JSON.stringify(res, null, 2)}`);
        await loadActiveEvents();
      } catch (err) {
        log(`[POST /api/assessments] Error: ${err}`);
      }
    }

    async function verifyEvent(confirmed) {
      const eventId = document.getElementById("verifyTargetEventId").value.trim();
      if (!eventId) {
        alert("Please select or specify an event_id to verify.");
        return;
      }

      const adjSevStr = document.getElementById("adjustSeverityInput").value.trim();
      const adjustedSeverity = adjSevStr ? parseInt(adjSevStr, 10) : null;

      const payload = {
        confirmed: confirmed,
        adjusted_severity: adjustedSeverity
      };

      log(`[POST /api/assessments/${eventId}/verify] Sending: ${JSON.stringify(payload)}`);

      try {
        const resp = await fetch(`/api/assessments/${eventId}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const res = await resp.json();
        log(`[POST /api/assessments/${eventId}/verify] Response (${resp.status}): ${JSON.stringify(res, null, 2)}`);
        await loadActiveEvents();
      } catch (err) {
        log(`[POST /api/assessments/${eventId}/verify] Error: ${err}`);
      }
    }

    // Auto-generate UUID and load events on startup
    window.addEventListener("DOMContentLoaded", () => {
      generateNewUUID();
      loadActiveEvents();
    });
  </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content)
