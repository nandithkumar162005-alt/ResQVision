"""
ResQVision one-click launcher.

Double-click RUN_DEMO.bat (or the ResQVision.exe built from this file) and it will:
  1. create a Python environment and install everything (first run only)
  2. install the dashboard packages (first run only)
  3. start Stream 3 (8003), Stream 2 (8002) and the dashboard (5173)
  4. fire one demo earthquake + one demo flood from Stream 1
  5. open the dashboard and the NDRF verification page in your browser

Press Enter (or close the window) to stop everything.
Flags:  --no-browser   don't open browser tabs
        --check        run once, verify the whole chain works, then exit (used for testing)
"""
import json, os, shutil, signal, subprocess, sys, time, urllib.request, webbrowser
from pathlib import Path

FROZEN = getattr(sys, "frozen", False)
ROOT = Path(sys.executable).resolve().parent if FROZEN else Path(__file__).resolve().parent
WIN = os.name == "nt"
VENV = ROOT / ".venv"
VPY = VENV / ("Scripts/python.exe" if WIN else "bin/python")
LOGS = ROOT / "logs"
S1, S2, S3, S4 = (ROOT / n for n in ("stream1-data-ingestion", "stream2-ml-inference",
                                      "stream3-dispatch-backend", "stream4-dashboard"))
PROCS = []


def say(msg):
    print(msg, flush=True)


def find_python():
    if not FROZEN:
        return sys.executable
    for name in ("python", "python3", "py"):
        p = shutil.which(name)
        if p:
            return p
    say("ERROR: Python was not found. Install Python 3.10+ (tick 'Add Python to PATH') and run again.")
    sys.exit(1)


def run(cmd, cwd=None, **kw):
    return subprocess.run(cmd, cwd=cwd, shell=isinstance(cmd, str), **kw)


def ensure_python_env():
    marker = VENV / ".resqvision_installed"
    if marker.exists():
        return
    say("First run: setting up Python environment (3-5 minutes, only once)...")
    if not VPY.exists():
        run([find_python(), "-m", "venv", str(VENV)], check=True)
    pip = [str(VPY), "-m", "pip", "install", "-q", "--disable-pip-version-check"]
    run(pip + ["--upgrade", "pip"])
    run(pip + ["fastapi", "uvicorn", "pydantic", "pydantic-settings", "python-dotenv", "httpx",
               "tenacity", "numpy", "scipy", "scikit-learn", "loguru", "shapely"], check=True)
    run(pip + ["-r", str(S1 / "requirements.txt"), "-r", str(S3 / "requirements.txt")], check=True)
    marker.write_text("ok")


def ensure_node_env():
    if (S4 / "node_modules").exists():
        return
    if not shutil.which("npm"):
        say("ERROR: Node.js was not found. Install Node 18+ from nodejs.org and run again.")
        sys.exit(1)
    say("First run: installing dashboard packages (1-3 minutes, only once)...")
    run("npm install --no-audit --no-fund", cwd=S4, check=True)


def start(name, cmd, cwd, extra_env=None):
    LOGS.mkdir(exist_ok=True)
    env = dict(os.environ, **(extra_env or {}))
    log = open(LOGS / f"{name}.log", "w")
    kw = {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP} if WIN else {"start_new_session": True}
    p = subprocess.Popen(cmd, cwd=cwd, env=env, stdout=log, stderr=subprocess.STDOUT,
                         shell=isinstance(cmd, str), **kw)
    PROCS.append(p)
    return p


def stop_all():
    for p in PROCS:
        try:
            if WIN:
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], capture_output=True)
            else:
                os.killpg(os.getpgid(p.pid), signal.SIGTERM)
        except Exception:
            pass


def wait_http(url, timeout=120):
    end = time.time() + timeout
    while time.time() < end:
        try:
            with urllib.request.urlopen(url, timeout=3) as r:
                if r.status < 500:
                    return True
        except Exception:
            time.sleep(1)
    return False


def get_json(url):
    with urllib.request.urlopen(url, timeout=5) as r:
        return json.load(r)


def main():
    args = set(sys.argv[1:])
    say("=== ResQVision demo launcher ===")
    ensure_python_env()
    ensure_node_env()

    for db in S3.glob("*.db"):  # fresh demo database each launch
        try:
            db.unlink()
        except Exception:
            pass

    s3_env = {"PORT": "8003"}
    s2_env = {"MOCK_INFERENCE": "true", "STREAM3_ASSESSMENT_URL": "http://localhost:8003/api/assessments"}
    uv = [str(VPY), "-m", "uvicorn", "app.main:app"]
    say("Starting Stream 3 (dispatch backend) on :8003 ...")
    start("stream3", uv + ["--port", "8003"], S3, s3_env)
    if not wait_http("http://127.0.0.1:8003/health"):
        say("Stream 3 did not start. See logs/stream3.log"); stop_all(); sys.exit(1)
    say("Starting Stream 2 (ML / satellite, mock mode) on :8002 ...")
    start("stream2", uv + ["--port", "8002"], S2, s2_env)
    if not wait_http("http://127.0.0.1:8002/health"):
        say("Stream 2 did not start. See logs/stream2.log"); stop_all(); sys.exit(1)
    say("Starting dashboard on :5173 ...")
    start("stream4", "npm run dev -- --port 5173 --host 127.0.0.1", S4)
    if not wait_http("http://127.0.0.1:5173/"):
        say("Dashboard did not start. See logs/stream4.log"); stop_all(); sys.exit(1)

    say("Firing demo earthquake + flood from Stream 1 ...")
    r = run([str(VPY), "fire_test_event.py"], cwd=S1, capture_output=True, text=True)
    sent_ok = "'failed': 0" in (r.stdout or "")
    say("  -> events sent" if sent_ok else "  -> FAILED, see below\n" + (r.stdout or "") + (r.stderr or ""))

    time.sleep(3)
    data = get_json("http://127.0.0.1:8003/api/active-disasters").get("data", [])
    say(f"Stream 3 now holds {len(data)} event(s): " + ", ".join(
        f"{(e.get('disaster_type') or '?')}/{e['dispatch_status']}" for e in data))

    if "--check" in args:
        ok = sent_ok and len(data) >= 2
        if data:
            ev = data[0]["event_id"]
            v = urllib.request.Request(f"http://127.0.0.1:8003/api/assessments/{ev}/verify",
                                       data=json.dumps({"confirmed": True}).encode(),
                                       headers={"Content-Type": "application/json"}, method="POST")
            urllib.request.urlopen(v, timeout=10).read()
            logs = get_json(f"http://127.0.0.1:8003/api/assessments/{ev}/dispatch-log")["data"]
            say(f"After NDRF confirm: {len(logs)} dispatch waves: " + ", ".join(l["team_name"] for l in logs))
            ok = ok and len(logs) == 5
        say("CHECK " + ("PASSED" if ok else "FAILED"))
        stop_all()
        sys.exit(0 if ok else 1)

    if "--no-browser" not in args:
        webbrowser.open("http://localhost:5173")
        time.sleep(1)
        webbrowser.open("http://localhost:8003/demo")

    say("\nEverything is running.")
    say("  Dashboard : http://localhost:5173   (demo login: pick any role, Rescue = dispatch view)")
    say("  NDRF page : http://localhost:8003/demo   (click Confirm -> waves 2-5 go out)")
    say("  More events: run FIRE_DEMO_EVENT.bat any time")
    say("\nPress Enter here (or close this window) to stop everything.")
    try:
        input()
    except (EOFError, KeyboardInterrupt):
        pass
    finally:
        stop_all()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        stop_all()
    except Exception as e:
        stop_all()
        say(f"ERROR: {e}")
        if WIN:
            input("Press Enter to close...")
        sys.exit(1)
