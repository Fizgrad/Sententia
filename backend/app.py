"""ASGI entry point: python -m uvicorn backend.app:app --host 127.0.0.1."""
from __future__ import annotations

import ipaddress
import json
import os
import sqlite3
import threading
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from starlette.responses import JSONResponse

from .database import Database, DuplicateUsername, RateLimited, RevisionConflict, iso_time
from .security import DUMMY_HASH, TOKEN_PATTERN, hash_password, new_token, normalise_username, token_digest, validate_password, verify_password
from .validation import InvalidSnapshot, SnapshotValidator, number, obj


MAX_BODY = 10 * 1024 * 1024


@dataclass(frozen=True)
class Settings:
    db_path: Path
    allowed_origins: tuple[str, ...]
    session_days: int = 30
    registration_mode: str = "disabled"
    login_ip_limit: int = 30
    login_account_limit: int = 8
    registration_ip_limit: int = 5

    @classmethod
    def from_env(cls) -> "Settings":
        raw_origins = os.environ.get("SENTENTIA_ALLOWED_ORIGINS", "http://127.0.0.1:3000,http://localhost:3000")
        origins = json.loads(raw_origins) if raw_origins.lstrip().startswith("[") else raw_origins.split(",")
        if not isinstance(origins, list):
            raise ValueError("SENTENTIA_ALLOWED_ORIGINS must be a comma-separated list or JSON list.")
        clean = []
        for origin in origins:
            if not isinstance(origin, str):
                raise ValueError("Allowed origins must be exact HTTP(S) origins.")
            origin = origin.strip()
            parsed = urlsplit(origin)
            if parsed.scheme not in ("http", "https") or not parsed.netloc or parsed.username or parsed.password or parsed.path or parsed.query or parsed.fragment or "*" in origin:
                raise ValueError("Allowed origins must be exact HTTP(S) origins without paths or wildcards.")
            clean.append(origin)
        mode = os.environ.get("SENTENTIA_REGISTRATION_MODE", "disabled")
        days = int(os.environ.get("SENTENTIA_SESSION_DAYS", "30"))
        if mode not in ("open", "disabled") or not 1 <= days <= 90:
            raise ValueError("Invalid registration mode or session lifetime.")
        default_db = str(Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "Sententia" / "progress.sqlite3") if os.name == "nt" else "/var/lib/sententia/progress.sqlite3"
        return cls(Path(os.environ.get("SENTENTIA_DB_PATH", default_db)), tuple(dict.fromkeys(clean)), days, mode)


class BodyTooLarge(Exception):
    pass


class RequestBoundary:
    """Enforce streaming size limits without buffering unauthenticated uploads."""
    def __init__(self, app, allowed_origins: tuple[str, ...]):
        self.app = app
        self.allowed_origins = set(allowed_origins)

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        headers = {key.lower(): value for key, value in scope.get("headers", [])}
        origin = headers.get(b"origin")
        if origin and origin.decode("latin-1") not in self.allowed_origins:
            return await JSONResponse({"detail": "此网站来源未获授权。"}, status_code=403)(scope, receive, send)
        maximum = 8192 if scope.get("path") in ("/api/v1/auth/login", "/api/v1/auth/register") else MAX_BODY
        length = headers.get(b"content-length")
        if length is not None:
            try:
                size = int(length)
                if size < 0:
                    raise ValueError()
            except ValueError:
                return await JSONResponse({"detail": "无效的请求长度。"}, status_code=400)(scope, receive, send)
            if size > maximum:
                return await JSONResponse({"detail": "请求内容超过大小限制。"}, status_code=413)(scope, receive, send)
        received, started = 0, False

        async def limited_receive():
            nonlocal received
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > maximum:
                    raise BodyTooLarge()
            return message

        async def guarded_send(message):
            nonlocal started
            if message["type"] == "http.response.start":
                started = True
                message["headers"] = list(message.get("headers", [])) + [(b"cache-control", b"no-store"), (b"x-content-type-options", b"nosniff"), (b"referrer-policy", b"no-referrer")]
            await send(message)

        try:
            await self.app(scope, limited_receive, guarded_send)
        except BodyTooLarge:
            if started:
                raise
            await JSONResponse({"detail": "请求内容超过大小限制。"}, status_code=413)(scope, receive, guarded_send)


def _client_ip(request: Request) -> str:
    peer = request.client.host if request.client else "unknown"
    # The proxy overwrites X-Real-IP. Never trust that header from a public peer.
    if peer in ("127.0.0.1", "::1") and request.headers.get("x-real-ip"):
        try:
            return str(ipaddress.ip_address(request.headers["x-real-ip"]))
        except ValueError:
            return peer
    return peer


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON key")
        result[key] = value
    return result


def _invalid_constant(_value):
    raise ValueError("Non-finite JSON number")


async def _json(request: Request) -> dict:
    if request.headers.get("content-type", "").split(";", 1)[0].strip().lower() != "application/json":
        raise HTTPException(415, "请使用 JSON 格式提交数据。")
    if request.headers.get("content-encoding", "identity").lower() != "identity":
        raise HTTPException(415, "不支持压缩请求内容。")
    try:
        value = json.loads((await request.body()).decode("utf-8"), object_pairs_hook=_unique_object, parse_constant=_invalid_constant)
    except (ValueError, UnicodeError, RecursionError):
        raise HTTPException(400, "请求内容不是有效的 JSON。") from None
    if not isinstance(value, dict):
        raise HTTPException(422, "请求内容必须是 JSON 对象。")
    return value


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    database = Database(settings.db_path)
    validator = SnapshotValidator()
    kdf_slots = threading.BoundedSemaphore(2)

    @asynccontextmanager
    async def lifespan(_app):
        if os.name != "nt":
            os.umask(0o077)
        await run_in_threadpool(database.initialize)
        yield

    api = FastAPI(title="Sententia progress API", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
    api.state.database = database
    api.state.settings = settings
    api.add_middleware(RequestBoundary, allowed_origins=settings.allowed_origins)
    api.add_middleware(CORSMiddleware, allow_origins=list(settings.allowed_origins), allow_credentials=False, allow_methods=["GET", "PUT", "POST", "OPTIONS"], allow_headers=["Authorization", "Content-Type"], max_age=600)

    @api.exception_handler(InvalidSnapshot)
    async def invalid_snapshot(_request, error):
        return JSONResponse({"detail": str(error)}, status_code=422)

    @api.exception_handler(RateLimited)
    async def rate_limited(_request, error):
        return JSONResponse({"detail": "尝试次数过多，请稍后重试。"}, status_code=429, headers={"Retry-After": str(error.retry_after)})

    @api.exception_handler(RevisionConflict)
    async def conflict(_request, error):
        return JSONResponse({"detail": "云端进度已更新，请先重新读取并比较。", "revision": error.revision}, status_code=409)

    @api.exception_handler(sqlite3.Error)
    async def database_error(_request, _error):
        return JSONResponse({"detail": "服务器暂时无法读取或保存进度，请稍后重试。"}, status_code=503)

    async def authenticate(request: Request) -> tuple[dict, str]:
        parts = request.headers.get("authorization", "").split()
        if len(parts) != 2 or parts[0].lower() != "bearer" or not TOKEN_PATTERN.fullmatch(parts[1]):
            raise HTTPException(401, "请先登录。", headers={"WWW-Authenticate": "Bearer"})
        digest = token_digest(parts[1])
        user = await run_in_threadpool(database.authenticate, digest)
        if not user:
            raise HTTPException(401, "登录已失效，请重新登录。", headers={"WWW-Authenticate": "Bearer"})
        return user, digest

    def limited_kdf(operation):
        if not kdf_slots.acquire(blocking=False):
            raise RateLimited(2)
        try:
            return operation()
        finally:
            kdf_slots.release()

    @api.get("/api/v1/health")
    async def health():
        return {"status": "ok"}

    @api.get("/api/v1/auth/config")
    async def auth_config():
        return {"registrationMode": settings.registration_mode}

    @api.post("/api/v1/auth/register", status_code=201)
    async def register(request: Request):
        if settings.registration_mode != "open":
            raise HTTPException(403, "当前服务未开放注册。")
        await run_in_threadpool(database.consume_limits, [("register-ip:" + _client_ip(request), settings.registration_ip_limit, 3600)])
        body = obj(await _json(request), "registration", {"username", "password"})
        try:
            username = normalise_username(body["username"])
            password = validate_password(body["password"])
        except ValueError as error:
            raise HTTPException(422, str(error)) from None
        if await run_in_threadpool(database.find_user, username):
            raise HTTPException(409, "该账号已被使用，请换一个账号名称。")
        password_hash = await run_in_threadpool(limited_kdf, lambda: hash_password(password))
        raw, digest = new_token()
        expiry = time.time() + settings.session_days * 86400
        try:
            user = await run_in_threadpool(database.create_user, username, password_hash, (digest, expiry))
        except DuplicateUsername:
            raise HTTPException(409, "该账号已被使用，请换一个账号名称。") from None
        return {"token": raw, "expiresAt": iso_time(expiry), "user": user}

    @api.post("/api/v1/auth/login")
    async def login(request: Request):
        body = obj(await _json(request), "login", {"username", "password"})
        try:
            username = normalise_username(body["username"])
            password = validate_password(body["password"])
        except ValueError:
            raise HTTPException(401, "账号或密码不正确。") from None
        await run_in_threadpool(database.consume_limits, [("login-ip:" + _client_ip(request), settings.login_ip_limit, 900), ("login-account:" + username, settings.login_account_limit, 900)])
        row = await run_in_threadpool(database.find_user, username)
        valid = await run_in_threadpool(limited_kdf, lambda: verify_password(password, row["password_hash"] if row else DUMMY_HASH))
        if not row or not valid:
            raise HTTPException(401, "账号或密码不正确。")
        raw, digest = new_token()
        expiry = time.time() + settings.session_days * 86400
        created = await run_in_threadpool(database.verified_session, row["id"], row["password_hash"], digest, expiry)
        if not created:
            raise HTTPException(401, "账号或密码不正确。")
        await run_in_threadpool(database.clear_account_limit, username)
        return {"token": raw, "expiresAt": iso_time(expiry), "user": {"id": row["id"], "username": row["username"]}}

    @api.get("/api/v1/auth/me")
    async def me(request: Request):
        user, _digest = await authenticate(request)
        return {"user": user}

    @api.post("/api/v1/auth/logout", status_code=204)
    async def logout(request: Request):
        _user, digest = await authenticate(request)
        await run_in_threadpool(database.revoke, digest)
        return Response(status_code=204)

    @api.get("/api/v1/state")
    async def read_state(request: Request):
        user, _digest = await authenticate(request)
        return await run_in_threadpool(database.state, user["id"])

    @api.put("/api/v1/state")
    async def save_state(request: Request):
        user, _digest = await authenticate(request)
        body = obj(await _json(request), "upload", {"expectedRevision", "data"})
        revision = number(body["expectedRevision"], "expectedRevision", 0, 2**53 - 1, True)
        data = await run_in_threadpool(validator.validate, body["data"])
        return await run_in_threadpool(database.save_state, user["id"], revision, data)

    return api


app = create_app()
