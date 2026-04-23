import os
import re
import sqlite3
from datetime import datetime, timezone

import jwt
from jwt.exceptions import InvalidTokenError
from werkzeug.security import check_password_hash, generate_password_hash

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-change-jwt-secret-in-production")
JWT_ALG = "HS256"
JWT_EXP_SECONDS = int(os.environ.get("JWT_EXP_SECONDS", str(7 * 24 * 3600)))

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")
MAX_EMAIL_LEN = 254
MAX_PASSWORD_LEN = 72

# Lockout settings
MAX_ATTEMPTS = 5
LOCKOUT_SECONDS = 5 * 60  # 15 minutes


def _db_path() -> str:
    data_dir = os.environ.get(
        "LUMINARA_DATA_DIR", os.path.join(os.path.dirname(__file__), "data")
    )
    os.makedirs(data_dir, exist_ok=True)
    return os.path.join(data_dir, "luminara.db")


def init_db() -> None:
    path = _db_path()
    conn = sqlite3.connect(path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS login_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL COLLATE NOCASE,
                attempted_at TEXT NOT NULL,
                success INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def _is_locked_out(cur, email: str) -> bool:
    """Return True if this email has too many recent failed attempts."""
    cutoff = datetime.now(timezone.utc).timestamp() - LOCKOUT_SECONDS
    cutoff_iso = datetime.fromtimestamp(cutoff, tz=timezone.utc).isoformat()
    cur.execute(
        """
        SELECT COUNT(*) FROM login_attempts
        WHERE email = ? COLLATE NOCASE
          AND success = 0
          AND attempted_at > ?
        """,
        (email, cutoff_iso),
    )
    count = cur.fetchone()[0]
    return count >= MAX_ATTEMPTS


def _record_attempt(cur, email: str, success: bool) -> None:
    cur.execute(
        "INSERT INTO login_attempts (email, attempted_at, success) VALUES (?, ?, ?)",
        (email, datetime.now(timezone.utc).isoformat(), 1 if success else 0),
    )


def register_user(email: str, password: str):
    email = (email or "").strip().lower()

    if not email or len(email) > MAX_EMAIL_LEN or not EMAIL_RE.match(email):
        return None, "Invalid email"
    if not password or len(password) < 8:
        return None, "Password must be at least 8 characters"
    if len(password) > MAX_PASSWORD_LEN:
        return None, f"Password must be {MAX_PASSWORD_LEN} characters or fewer"

    password_hash = generate_password_hash(password)
    created = datetime.now(timezone.utc).isoformat()
    conn = sqlite3.connect(_db_path())
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
            (email, password_hash, created),
        )
        conn.commit()
        uid = cur.lastrowid
        return {"id": uid, "email": email}, None
    except sqlite3.IntegrityError:
        return None, "An account with this email already exists"
    finally:
        conn.close()


def login_user(email: str, password: str):
    email = (email or "").strip().lower()

    if not email or not password:
        return None, "Email and password are required"
    if len(email) > MAX_EMAIL_LEN or len(password) > MAX_PASSWORD_LEN:
        return None, "Invalid email or password"

    conn = sqlite3.connect(_db_path())
    try:
        cur = conn.cursor()

        if _is_locked_out(cur, email):
            return None, "Too many failed attempts. Try again in 15 minutes."

        cur.execute(
            "SELECT id, email, password_hash FROM users WHERE email = ? COLLATE NOCASE",
            (email,),
        )
        row = cur.fetchone()
        if not row:
            _record_attempt(cur, email, success=False)
            conn.commit()
            return None, "Invalid email or password"

        uid, db_email, password_hash = row
        if not check_password_hash(password_hash, password):
            _record_attempt(cur, email, success=False)
            conn.commit()
            return None, "Invalid email or password"

        _record_attempt(cur, email, success=True)
        conn.commit()
        return {"id": uid, "email": db_email}, None
    finally:
        conn.close()


def create_token(user_id: int, email: str) -> str:
    now = datetime.now(timezone.utc).timestamp()
    payload = {
        "sub": email,
        "uid": user_id,
        "exp": now + JWT_EXP_SECONDS,
        "iat": now,
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)
    if isinstance(token, bytes):
        return token.decode("utf-8")
    return token


def verify_token_string(token: str):
    if not token or not isinstance(token, str):
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        email = payload.get("sub")
        uid = payload.get("uid")
        if not email or uid is None:
            return None
        return {"email": email, "id": int(uid)}
    except InvalidTokenError:
        return None
