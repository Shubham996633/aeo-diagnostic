#!/usr/bin/env python3
"""Keep the Render backend warm by pinging /health on a fixed interval.

Two modes:

  python scripts/keepalive.py
      Long-running loop. Pings every INTERVAL seconds and prints results.
      Use under tmux / nohup / systemd / Docker for 24/7 coverage.

  python scripts/keepalive.py --once
      Single ping then exit. Use from cron or any external scheduler:

          */5 * * * * cd /path/to/repo && python3 scripts/keepalive.py --once \\
              >> /tmp/aeo-keepalive.log 2>&1

Env vars:
  AEO_BACKEND_URL   Base URL of the backend (no trailing slash).
                    Defaults to the deployed Render URL.
  AEO_PING_INTERVAL Seconds between pings (loop mode only). Default 300.
  AEO_PING_TIMEOUT  Per-request timeout in seconds. Default 60.

Stdlib only — no pip install needed.
"""
import argparse
import os
import signal
import sys
import time
import urllib.request
from datetime import datetime, timezone
from urllib.error import URLError, HTTPError

DEFAULT_URL = os.getenv(
    "AEO_BACKEND_URL", "https://aeo-diagnostic-backend.onrender.com"
).rstrip("/")
INTERVAL = int(os.getenv("AEO_PING_INTERVAL", "300"))
TIMEOUT = int(os.getenv("AEO_PING_TIMEOUT", "60"))


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def ping(url: str) -> bool:
    target = f"{url}/health"
    started = time.perf_counter()
    try:
        req = urllib.request.Request(target, headers={"User-Agent": "aeo-keepalive/1.0"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            body = resp.read().decode("utf-8", errors="replace").strip()[:120]
            elapsed = int((time.perf_counter() - started) * 1000)
            print(f"[{_now()}] {resp.status} {elapsed}ms  {body}", flush=True)
            return 200 <= resp.status < 300
    except HTTPError as e:
        elapsed = int((time.perf_counter() - started) * 1000)
        print(f"[{_now()}] FAIL {elapsed}ms  http {e.code}  {e.reason}", flush=True)
    except URLError as e:
        elapsed = int((time.perf_counter() - started) * 1000)
        print(f"[{_now()}] FAIL {elapsed}ms  {e.reason}", flush=True)
    except Exception as e:  # network hiccup, DNS, etc.
        elapsed = int((time.perf_counter() - started) * 1000)
        print(f"[{_now()}] FAIL {elapsed}ms  {type(e).__name__}: {e}", flush=True)
    return False


def loop_forever(url: str) -> None:
    print(f"[{_now()}] keepalive loop starting → {url}/health every {INTERVAL}s", flush=True)
    stop = {"requested": False}

    def _on_signal(signum, _frame):
        print(f"[{_now()}] caught signal {signum}, exiting", flush=True)
        stop["requested"] = True

    signal.signal(signal.SIGINT, _on_signal)
    signal.signal(signal.SIGTERM, _on_signal)

    while not stop["requested"]:
        ping(url)
        # Sleep in 1s slices so signals are responsive.
        for _ in range(INTERVAL):
            if stop["requested"]:
                break
            time.sleep(1)


def main() -> int:
    p = argparse.ArgumentParser(description="Ping the AEO backend health endpoint.")
    p.add_argument("--once", action="store_true", help="ping once and exit")
    p.add_argument("--url", default=DEFAULT_URL, help=f"backend base URL (default: {DEFAULT_URL})")
    args = p.parse_args()

    if args.once:
        return 0 if ping(args.url) else 1
    loop_forever(args.url)
    return 0


if __name__ == "__main__":
    sys.exit(main())
