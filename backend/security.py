"""Password hashing and opaque session token primitives, without signing secrets."""
from __future__ import annotations

import base64
import hashlib
import hmac
import re
import secrets


# OWASP's scrypt profile: 32 MiB memory with p=3. Keep the KDF concurrent limit
# in the API as well, so a small machine cannot be exhausted by parallel logins.
SCRYPT_N, SCRYPT_R, SCRYPT_P = 2**15, 8, 3
TOKEN_PATTERN = re.compile(r"^[A-Za-z0-9_-]{43}$")
USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,39}$")


def normalise_username(value: object) -> str:
    if not isinstance(value, str) or not USERNAME_PATTERN.fullmatch(value):
        raise ValueError("账号须为 3–40 位英文字母、数字、下划线、点或短横线，且以字母或数字开头。")
    return value.lower()


def validate_password(value: object) -> str:
    if not isinstance(value, str) or not 12 <= len(value) <= 128:
        raise ValueError("密码长度须为 12–128 个字符。")
    try:
        value.encode("utf-8")
    except UnicodeError:
        raise ValueError("密码包含无效字符。") from None
    return value


def _derive(password: str, salt: bytes) -> bytes:
    return hashlib.scrypt(password.encode("utf-8"), salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P, maxmem=128 * 1024 * 1024, dklen=32)


def hash_password(password: str) -> str:
    validate_password(password)
    salt = secrets.token_bytes(16)
    digest = _derive(password, salt)
    return "$".join(("scrypt", str(SCRYPT_N), str(SCRYPT_R), str(SCRYPT_P), base64.b64encode(salt).decode("ascii"), base64.b64encode(digest).decode("ascii")))


DUMMY_HASH = "$".join(("scrypt", str(SCRYPT_N), str(SCRYPT_R), str(SCRYPT_P), base64.b64encode(bytes(16)).decode("ascii"), base64.b64encode(bytes(32)).decode("ascii")))


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, n, r, p, salt, digest = encoded.split("$")
        if (algorithm, n, r, p) != ("scrypt", str(SCRYPT_N), str(SCRYPT_R), str(SCRYPT_P)):
            return False
        salt_bytes, expected = base64.b64decode(salt, validate=True), base64.b64decode(digest, validate=True)
        if len(salt_bytes) != 16 or len(expected) != 32:
            return False
        return hmac.compare_digest(_derive(password, salt_bytes), expected)
    except (ValueError, TypeError, UnicodeError):
        return False


def new_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    return raw, token_digest(raw)


def token_digest(raw: str) -> str:
    return hashlib.sha256(raw.encode("ascii")).hexdigest()
