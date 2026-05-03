"""SQLite store. One row per report; full payload kept as JSON for flexibility,
indexed columns let us filter by user and surface listing data without parsing."""
import asyncio
import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from app.models import DiagnoseReport

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "aeo.db"
DB_PATH.parent.mkdir(exist_ok=True)


def _init_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                user_email TEXT,
                brand TEXT NOT NULL,
                category TEXT NOT NULL,
                aeo_score INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                payload TEXT NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_email, created_at DESC)")


_init_db()


@contextmanager
def _conn():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    try:
        yield c
        c.commit()
    finally:
        c.close()


def _save_sync(report: DiagnoseReport, user_email: str | None) -> None:
    payload = report.model_dump_json()
    with _conn() as c:
        c.execute(
            """
            INSERT OR REPLACE INTO reports (id, user_email, brand, category, aeo_score, created_at, payload)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (report.id, user_email, report.brand, report.category, report.aeo_score, report.created_at, payload),
        )


async def save_report(report: DiagnoseReport, user_email: str | None = None) -> None:
    await asyncio.to_thread(_save_sync, report, user_email)


def _load_sync(report_id: str) -> DiagnoseReport | None:
    with _conn() as c:
        row = c.execute("SELECT payload FROM reports WHERE id = ?", (report_id,)).fetchone()
    return DiagnoseReport.model_validate_json(row["payload"]) if row else None


async def load_report(report_id: str) -> DiagnoseReport | None:
    return await asyncio.to_thread(_load_sync, report_id)


def _list_sync(user_email: str | None, limit: int) -> list[dict]:
    with _conn() as c:
        if user_email:
            rows = c.execute(
                "SELECT id, brand, category, aeo_score, created_at FROM reports "
                "WHERE user_email = ? ORDER BY created_at DESC LIMIT ?",
                (user_email, limit),
            ).fetchall()
        else:
            rows = c.execute(
                "SELECT id, brand, category, aeo_score, created_at FROM reports "
                "ORDER BY created_at DESC LIMIT ?",
                (limit,),
            ).fetchall()
    return [dict(r) for r in rows]


async def list_reports(user_email: str | None = None, limit: int = 50) -> list[dict]:
    return await asyncio.to_thread(_list_sync, user_email, limit)


def _delete_sync(report_id: str, user_email: str | None) -> bool:
    with _conn() as c:
        if user_email:
            cur = c.execute(
                "DELETE FROM reports WHERE id = ? AND user_email = ?",
                (report_id, user_email),
            )
        else:
            cur = c.execute("DELETE FROM reports WHERE id = ?", (report_id,))
        return cur.rowcount > 0


async def delete_report(report_id: str, user_email: str | None = None) -> bool:
    return await asyncio.to_thread(_delete_sync, report_id, user_email)
