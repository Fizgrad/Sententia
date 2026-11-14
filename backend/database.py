"""Private SQLite storage with transactional per-user revision checks."""
from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path


def iso_time(timestamp: float | None = None) -> str:
    return datetime.fromtimestamp(time.time() if timestamp is None else timestamp, timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class DuplicateUsername(Exception):
    pass


class RevisionConflict(Exception):
    def __init__(self, revision: int):
        self.revision = revision


class RateLimited(Exception):
    def __init__(self, retry_after: int):
        self.retry_after = max(1, retry_after)


class Database:
    def __init__(self, path: Path):
        if not path.is_absolute():
            raise ValueError("SENTENTIA_DB_PATH must be an absolute path outside the published site.")
        self.path = path

    @contextmanager
    def connection(self):
        con = sqlite3.connect(str(self.path), timeout=10, isolation_level=None)
        con.row_factory = sqlite3.Row
        con.execute("PRAGMA foreign_keys=ON")
        con.execute("PRAGMA busy_timeout=10000")
        try:
            yield con
        finally:
            con.close()

    def initialize(self) -> None:
        self.path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        if self.path.is_symlink():
            raise ValueError("Database file must not be a symbolic link.")
        with self.connection() as con:
            con.execute("PRAGMA journal_mode=WAL")
            con.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    token_hash TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TEXT NOT NULL,
                    expires_at REAL NOT NULL
                );
                CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
                CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
                CREATE TABLE IF NOT EXISTS snapshots (
                    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    revision INTEGER NOT NULL CHECK(revision >= 1),
                    data TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS rate_limits (
                    scope_hash TEXT PRIMARY KEY,
                    window_start REAL NOT NULL,
                    attempts INTEGER NOT NULL
                );
            """)
        if os.name != "nt":
            os.chmod(self.path, 0o600)

    def find_user(self, username: str):
        with self.connection() as con:
            row = con.execute("SELECT id, username, password_hash FROM users WHERE username=?", (username,)).fetchone()
            return dict(row) if row else None

    def create_user(self, username: str, password_hash: str, session: tuple[str, float] | None = None) -> dict:
        user = {"id": uuid.uuid4().hex, "username": username}
        with self.connection() as con:
            con.execute("BEGIN IMMEDIATE")
            try:
                now = iso_time()
                con.execute("INSERT INTO users(id,username,password_hash,created_at) VALUES(?,?,?,?)", (user["id"], username, password_hash, now))
                if session:
                    con.execute("INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)", (session[0], user["id"], now, session[1]))
                con.commit()
            except sqlite3.IntegrityError:
                con.rollback()
                raise DuplicateUsername() from None
            except Exception:
                con.rollback()
                raise
        return user

    def new_session(self, user_id: str, token_hash: str, expires_at: float) -> None:
        with self.connection() as con:
            con.execute("INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)", (token_hash, user_id, iso_time(), expires_at))

    def verified_session(self, user_id: str, verified_hash: str, token_hash: str, expires_at: float) -> bool:
        # A simultaneous password reset must not be bypassed by a login whose
        # expensive verification started before that reset revoked sessions.
        with self.connection() as con:
            written = con.execute("INSERT INTO sessions(token_hash,user_id,created_at,expires_at) SELECT ?,id,?,? FROM users WHERE id=? AND password_hash=?", (token_hash, iso_time(), expires_at, user_id, verified_hash)).rowcount
            return written == 1

    def authenticate(self, token_hash: str):
        with self.connection() as con:
            row = con.execute("SELECT u.id, u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?", (token_hash, time.time())).fetchone()
            return dict(row) if row else None

    def revoke(self, token_hash: str) -> None:
        with self.connection() as con:
            con.execute("DELETE FROM sessions WHERE token_hash=?", (token_hash,))

    def reset_password(self, username: str, password_hash: str) -> None:
        with self.connection() as con:
            con.execute("BEGIN IMMEDIATE")
            try:
                user = con.execute("SELECT id FROM users WHERE username=?", (username,)).fetchone()
                if not user:
                    raise ValueError("Account does not exist.")
                con.execute("UPDATE users SET password_hash=? WHERE id=?", (password_hash, user["id"]))
                con.execute("DELETE FROM sessions WHERE user_id=?", (user["id"],))
                con.commit()
            except Exception:
                con.rollback()
                raise

    def state(self, user_id: str) -> dict:
        with self.connection() as con:
            row = con.execute("SELECT revision,data,updated_at FROM snapshots WHERE user_id=?", (user_id,)).fetchone()
        if not row:
            return {"revision": 0, "data": None, "updatedAt": None}
        return {"revision": row["revision"], "data": json.loads(row["data"]), "updatedAt": row["updated_at"]}

    def save_state(self, user_id: str, expected_revision: int, data: dict) -> dict:
        # Read and write under the same write transaction: two clients with the
        # same base revision cannot both succeed, including the first upload.
        serialized = json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
        with self.connection() as con:
            con.execute("BEGIN IMMEDIATE")
            try:
                row = con.execute("SELECT revision FROM snapshots WHERE user_id=?", (user_id,)).fetchone()
                revision = row["revision"] if row else 0
                if revision != expected_revision:
                    raise RevisionConflict(revision)
                updated = iso_time()
                con.execute("INSERT INTO snapshots(user_id,revision,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET revision=excluded.revision,data=excluded.data,updated_at=excluded.updated_at", (user_id, revision + 1, serialized, updated))
                con.commit()
            except Exception:
                con.rollback()
                raise
        return {"revision": revision + 1, "data": data, "updatedAt": updated}

    def consume_limits(self, limits: list[tuple[str, int, int]]) -> None:
        now = time.time()
        with self.connection() as con:
            con.execute("BEGIN IMMEDIATE")
            try:
                con.execute("DELETE FROM rate_limits WHERE window_start<?", (now - 86400,))
                rows = []
                for scope, maximum, window in limits:
                    key = hashlib.sha256(scope.encode("utf-8")).hexdigest()
                    row = con.execute("SELECT window_start,attempts FROM rate_limits WHERE scope_hash=?", (key,)).fetchone()
                    start, count = (row["window_start"], row["attempts"]) if row and now - row["window_start"] < window else (now, 0)
                    if count >= maximum:
                        raise RateLimited(int(window - (now - start)) + 1)
                    rows.append((key, start, count + 1))
                for row in rows:
                    con.execute("INSERT INTO rate_limits(scope_hash,window_start,attempts) VALUES(?,?,?) ON CONFLICT(scope_hash) DO UPDATE SET window_start=excluded.window_start,attempts=excluded.attempts", row)
                con.commit()
            except Exception:
                con.rollback()
                raise

    def clear_account_limit(self, username: str) -> None:
        key = hashlib.sha256(("login-account:" + username).encode()).hexdigest()
        with self.connection() as con:
            con.execute("DELETE FROM rate_limits WHERE scope_hash=?", (key,))

    def prune(self) -> dict:
        with self.connection() as con:
            sessions = con.execute("DELETE FROM sessions WHERE expires_at<=?", (time.time(),)).rowcount
            limits = con.execute("DELETE FROM rate_limits WHERE window_start<?", (time.time() - 86400,)).rowcount
        return {"expiredSessionsRemoved": sessions, "oldRateLimitsRemoved": limits}

    def backup(self, destination: Path) -> None:
        if destination.exists() or destination.is_symlink():
            raise ValueError("Backup destination already exists; use a new private filename.")
        destination.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        fd = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        os.close(fd)
        try:
            with self.connection() as source, sqlite3.connect(str(destination)) as target:
                source.backup(target)
        except Exception:
            destination.unlink(missing_ok=True)
            raise
