"""In-process self-pinger.

Render's free tier sleeps after ~15 min of no incoming HTTP traffic to the
public URL. This task runs inside the FastAPI process and pings the deployed
service's own public /health endpoint on a fixed interval. Each ping leaves
the container, hits Render's load balancer, and comes back — which Render
counts as external traffic, keeping the idle timer reset.

Caveats:
  - If the dyno has already been put to sleep, this task is also asleep, so
    it can't wake the service back up. It only KEEPS warm; it doesn't WAKE.
  - Render's idle-detection rules are not formally documented, so this is
    best-effort. Pair with an external pinger for guaranteed coverage.

Activate by setting AEO_SELF_PING_URL to the public Render URL in the
service environment (e.g. https://aeo-diagnostic-backend.onrender.com).
"""
import asyncio
import logging
import os

import httpx

logger = logging.getLogger("aeo.keepalive")

DEFAULT_INTERVAL = int(os.getenv("AEO_SELF_PING_INTERVAL", "300"))
TIMEOUT = float(os.getenv("AEO_SELF_PING_TIMEOUT", "30"))


async def _loop(public_url: str, interval: int) -> None:
    target = f"{public_url.rstrip('/')}/health"
    logger.info("self-ping loop starting → %s every %ds", target, interval)
    # Stagger first ping by 30s so the service is fully booted.
    await asyncio.sleep(30)
    async with httpx.AsyncClient(
        timeout=TIMEOUT,
        headers={"User-Agent": "aeo-self-pinger/1.0"},
    ) as client:
        while True:
            try:
                resp = await client.get(target)
                logger.info("self-ping %s in %dms", resp.status_code, int(resp.elapsed.total_seconds() * 1000))
            except asyncio.CancelledError:
                logger.info("self-ping loop cancelled")
                raise
            except Exception as exc:  # network blip — log and continue
                logger.warning("self-ping failed: %s", exc)
            try:
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                raise


def start(public_url: str | None = None, interval: int | None = None) -> asyncio.Task | None:
    """Spawn the self-ping task. Returns None if no public URL is configured."""
    url = public_url or os.getenv("AEO_SELF_PING_URL", "").strip()
    if not url:
        logger.info("self-ping disabled (AEO_SELF_PING_URL not set)")
        return None
    return asyncio.create_task(_loop(url, interval or DEFAULT_INTERVAL))
