# Progress API operations

This directory is a Python 3.10-compatible private API, separate from the static
GitHub Pages frontend. The only public validation data shipped with it are the
2,000 vocabulary IDs and their 6,000 sentence IDs. There are no user credentials,
database files, signing keys, or live learning records in this source tree.

Run commands from the directory **containing** `backend/`, for example
`/opt/sententia-api`. The ASGI entry point is `backend.app:app`.

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
.venv/bin/python -m uvicorn backend.app:app \
  --host 127.0.0.1 --port 8787 --workers 1 \
  --no-proxy-headers --no-access-log --no-server-header --limit-concurrency 32
```

Use an unprivileged dedicated service account. Put an HTTPS reverse proxy in
front of the loopback listener; do not expose SQLite as a network service.
The proxy must overwrite `X-Real-IP` with its observed client IP, enforce a
10 MiB body limit, and avoid logging Authorization headers or request bodies.
Uvicorn proxy-header processing is disabled so the app can determine whether
`X-Real-IP` actually came from its trusted loopback proxy. Public callers do not
get to supply a trusted client address.

## Server environment

Set these in a service-owned configuration file outside the checkout. A systemd
`EnvironmentFile=/etc/sententia/api.env` with mode `0600` is suitable.

| Name | Meaning |
| --- | --- |
| `SENTENTIA_DB_PATH` | Absolute SQLite file path, default `/var/lib/sententia/progress.sqlite3` on Linux. Keep outside any web root, repository, or Pages artifact. |
| `SENTENTIA_ALLOWED_ORIGINS` | Comma-separated origins, or a JSON list. Exact `scheme://host[:port]` values only, with no paths, trailing slash, or wildcards. Default is the two local port-3000 origins. |
| `SENTENTIA_REGISTRATION_MODE` | `open` allows anyone to register; `disabled` rejects registration. Default `disabled`. The requested public-registration installation should explicitly set `open`. |
| `SENTENTIA_SESSION_DAYS` | Opaque token lifetime, 1–90 days, default 30. |

`https://ACCOUNT.github.io/REPOSITORY/` has origin
`https://ACCOUNT.github.io`; the repository path is not part of an origin.
CORS is an additional browser boundary, not the authentication mechanism.
Every request for progress still needs a per-user bearer token. API URLs are
public configuration; database access and passwords never belong in a
`NEXT_PUBLIC_*` variable or a built frontend artifact.

The service creates its own directory with mode `0700` when new, and its SQLite
file with mode `0600`. Pre-create `/var/lib/sententia` owned by the dedicated
service account with mode `0700` when deploying as root. The service startup
sets umask `077` so journal/WAL files are private too. Do not relocate databases
under `out/`, `public/`, `backend/`, or a Git repository.

## Account lifecycle

There is no shared browser API password. Public registration creates a user
with a salted scrypt password hash and an initial independent login session in
one transaction. Usernames are case-insensitive, stored lowercase, and match
`^[A-Za-z0-9][A-Za-z0-9_.-]{2,39}$`. Passwords contain 12–128 Unicode characters;
they are not printed, reversibly encrypted, or stored in plaintext.

Administration remains available without putting a password on the command
line or in process listings:

```sh
.venv/bin/python -m backend.manage init
.venv/bin/python -m backend.manage create-user david
.venv/bin/python -m backend.manage reset-password david
```

Those interactive commands prompt twice without echo. Automation may use
`--password-file /root/private-password.txt` (a regular file with mode `0600`)
or `--password-stdin`. Do not store that input file inside the checkout or a
GitHub Actions artifact. A reset revokes every existing session for that user;
a login that raced the reset cannot create a session from the old hash.

Session tokens are 32 random bytes encoded as 43 URL-safe characters. The raw
token is returned only on registration/login, and only its SHA-256 digest is
kept in SQLite. Logging out revokes that particular session. Expiration is
checked on every protected request. The browser must keep the returned token
private to that user's device and send it only over HTTPS.

Login and registration are rate limited in SQLite, so restarting the service
does not reset the limit: registration allows 5 requests per IP per hour;
login allows 30 requests per IP and 8 per account per 15 minutes. A successful
login clears its account-specific failure counter. At most two password KDFs
run simultaneously. The scrypt profile is `N=32768, r=8, p=3` (32 MiB memory),
one of the [OWASP password-storage profiles](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## HTTP contract

All paths start with `/api/v1`. Authenticated responses use `Cache-Control:
no-store`; cookies are not used, so the API does not need third-party-cookie
access from a GitHub Pages domain.

| Method/path | Request | Response |
| --- | --- | --- |
| `GET /health` | None | `{status:"ok"}` |
| `GET /auth/config` | None | `{registrationMode:"open"\|"disabled"}` |
| `POST /auth/register` | `{username,password}` | `201` with `{token,expiresAt,user:{id,username}}`; `403` if disabled; `409` if username taken. |
| `POST /auth/login` | `{username,password}` | `{token,expiresAt,user:{id,username}}`; generic `401` for invalid credentials. |
| `GET /auth/me` | Bearer token | `{user:{id,username}}` |
| `POST /auth/logout` | Bearer token | `204`, revokes session |
| `GET /state` | Bearer token | `{revision,data,updatedAt}`; initial state is `{revision:0,data:null,updatedAt:null}` |
| `PUT /state` | Bearer token, `{expectedRevision,data}` | Saved `{revision,data,updatedAt}` with revision incremented; `409` if stale. |

All times are UTC ISO strings with millisecond precision. User IDs are 32
character UUID hex strings. A revision conflict returns
`{detail:"…",revision:currentRevision}` without echoing the user's snapshot.
The caller must fetch and compare before explicitly choosing what to keep;
it must not retry an old upload using the new revision automatically.

The server validates the full version-1 `AppData` structure and known word and
sentence references independently of the browser. It accepts historical
`archive-…-WORD` sentence references even after the personal sentence was
deleted, preserving the current browser backup format. Unknown fields,
non-finite numbers, duplicate JSON keys, inconsistent quiz ratings, invalid
dates and prototype-like unknown vocabulary IDs are rejected. Login/register
requests are capped at 8 KiB; other request bodies are capped at 10 MiB while
streaming, even without Content-Length. Validation errors do not echo passwords
or submitted bodies. There is no registration admin flag, arbitrary user-ID
selection, SQL interface, database-download route, or static database serving.

## Consistent backups and tests

```sh
.venv/bin/python -m backend.manage backup /var/backups/sententia/2026-11-14.sqlite3
.venv/bin/python -m backend.manage prune
.venv/bin/python -m pip install -r backend/requirements-test.txt
.venv/bin/python -m unittest discover -s backend/tests -v
```

The backup command uses SQLite's online backup API, includes committed WAL
state, creates a private file, and refuses to overwrite an existing path.
`prune` removes only expired sessions and old rate-limit counters; it does not
delete users or learning history. Schedule backups outside the checkout and
keep them out of GitHub. Tests use temporary databases and do not contact any
production server.

After a deliberate vocabulary ID change, regenerate the public validation
manifest with `npx tsx backend/build-manifest.mts` and deploy the matching API
and frontend together. Do not regenerate or migrate personal learning data
from that manifest; it contains identifiers only.
