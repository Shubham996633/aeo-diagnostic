"""Email/password auth backed by SQLite + bcrypt.

No JWT or session tokens — once authenticated, the frontend stores the user's
email locally and passes it on every diagnose call. This keeps the surface
small for the demo while still validating credentials properly on signup/login.
"""
import asyncio
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

import bcrypt

from app.storage import DB_PATH


def _init_users_table() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )


_init_users_table()


@contextmanager
def _conn():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    try:
        yield c
        c.commit()
    finally:
        c.close()


class AuthError(Exception):
    """Raised on any authentication failure. Message is safe to show to the user."""


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def _register_sync(email: str, password: str, name: str) -> dict:
    if len(password) < 6:
        raise AuthError("Password must be at least 6 characters")
    with _conn() as c:
        existing = c.execute("SELECT email FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            raise AuthError("An account with this email already exists")
        c.execute(
            "INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (email, name, _hash(password), datetime.now(timezone.utc).isoformat()),
        )
    return {"email": email, "name": name}


def _login_sync(email: str, password: str) -> dict:
    with _conn() as c:
        row = c.execute(
            "SELECT email, name, password_hash FROM users WHERE email = ?", (email,)
        ).fetchone()
    if not row or not _verify(password, row["password_hash"]):
        raise AuthError("Invalid email or password")
    return {"email": row["email"], "name": row["name"]}


def _email_exists_sync(email: str) -> bool:
    with _conn() as c:
        row = c.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone()
    return row is not None


async def register(email: str, password: str, name: str) -> dict:
    return await asyncio.to_thread(_register_sync, email.strip().lower(), password, name.strip())


async def login(email: str, password: str) -> dict:
    return await asyncio.to_thread(_login_sync, email.strip().lower(), password)


async def email_exists(email: str) -> bool:
    return await asyncio.to_thread(_email_exists_sync, email.strip().lower())
