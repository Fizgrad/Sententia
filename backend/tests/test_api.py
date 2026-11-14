from __future__ import annotations

import copy
import json
import os
import sqlite3
import tempfile
import time
import unittest
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from pathlib import Path
from threading import Barrier

from fastapi.testclient import TestClient

from backend.app import MAX_BODY, Settings, create_app
from backend.database import Database, RevisionConflict
from backend.security import hash_password, token_digest, verify_password
from backend.validation import InvalidSnapshot, SnapshotValidator


PASSWORD = "A private testing password 2026!"
NOW = "2026-11-14T03:00:00.000Z"


def empty_state(name="Reader"):
    return {"schemaVersion": 1, "records": {}, "archive": [], "logs": [], "preferences": {"dailyGoal": 10, "retention": .9, "autoSpeak": False, "name": name}}


def studied_state():
    data = empty_state()
    data["records"]["mitigate"] = {
        "id": "mitigate", "learnedAt": NOW, "lastSentenceId": "mitigate-0", "seenSentenceIds": ["mitigate-0"],
        "card": {"due": NOW, "stability": 2.3, "difficulty": 5.1, "elapsed_days": 0, "scheduled_days": 4, "learning_steps": 0, "reps": 1, "lapses": 0, "state": 2, "last_review": NOW},
    }
    data["archive"] = [{"id": "saved-1", "text": "Cities can mitigate the risks that arise from rapid growth.", "topic": "Environment", "source": "Personal reading", "wordIds": ["mitigate"], "createdAt": NOW, "sentenceId": "mitigate-0"}]
    data["logs"] = [{"id": "log-1", "wordId": "mitigate", "sentenceId": "mitigate-0", "rating": 3, "mode": "learn", "at": NOW, "guess": {"choiceId": "mitigate", "correct": True}}]
    return data


class APITest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password_hash = hash_password(PASSWORD)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.settings = Settings(Path(self.temp.name) / "progress.sqlite3", ("https://reader.github.io", "http://127.0.0.1:3000"), registration_mode="open", registration_ip_limit=50)
        self.app = create_app(self.settings)
        self.context = TestClient(self.app)
        self.client = self.context.__enter__()
        self.db: Database = self.app.state.database
        self.user = self.db.create_user("reader", self.password_hash)
        self.other = self.db.create_user("another", self.password_hash)

    def tearDown(self):
        self.context.__exit__(None, None, None)
        self.temp.cleanup()

    def login(self, username="reader"):
        response = self.client.post("/api/v1/auth/login", json={"username": username, "password": PASSWORD})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def auth(self, username="reader"):
        return {"Authorization": "Bearer " + self.login(username)["token"]}

    def put(self, data, revision=0, headers=None):
        return self.client.put("/api/v1/state", json={"expectedRevision": revision, "data": data}, headers=headers or self.auth())

    def test_private_endpoints_require_authentication_and_never_return_db_details(self):
        for method, path in (("GET", "/api/v1/state"), ("GET", "/api/v1/auth/me"), ("POST", "/api/v1/auth/logout"), ("PUT", "/api/v1/state")):
            response = self.client.request(method, path)
            self.assertEqual(response.status_code, 401)
            self.assertNotIn("sqlite", response.text)
            self.assertEqual(response.headers["cache-control"], "no-store")
        self.assertEqual(self.client.get("/api/v1/health").json(), {"status": "ok"})
        self.assertEqual(self.client.get("/openapi.json").status_code, 404)

    def test_login_has_opaque_token_and_only_token_hash_is_persisted(self):
        result = self.login()
        self.assertEqual(set(result), {"token", "expiresAt", "user"})
        self.assertRegex(result["token"], r"^[A-Za-z0-9_-]{43}$")
        self.assertEqual(result["user"], self.user)
        self.assertEqual(self.client.get("/api/v1/auth/me", headers={"Authorization": "Bearer " + result["token"]}).json(), {"user": self.user})
        with self.db.connection() as connection:
            stored = dict(connection.execute("SELECT * FROM sessions").fetchone())
            encoded = connection.execute("SELECT password_hash FROM users WHERE id=?", (self.user["id"],)).fetchone()[0]
        self.assertEqual(stored["token_hash"], token_digest(result["token"]))
        self.assertNotIn(result["token"], json.dumps(stored))
        self.assertNotIn(PASSWORD, encoded)
        self.assertTrue(verify_password(PASSWORD, encoded))

    def test_registration_returns_a_logged_in_isolated_account(self):
        self.assertEqual(self.client.get("/api/v1/auth/config").json(), {"registrationMode": "open"})
        response = self.client.post("/api/v1/auth/register", json={"username": "New.Reader", "password": PASSWORD})
        self.assertEqual(response.status_code, 201, response.text)
        result = response.json()
        self.assertEqual(result["user"]["username"], "new.reader")
        headers = {"Authorization": "Bearer " + result["token"]}
        self.assertEqual(self.client.get("/api/v1/auth/me", headers=headers).json(), {"user": result["user"]})
        self.assertEqual(self.client.get("/api/v1/state", headers=headers).json(), {"revision": 0, "data": None, "updatedAt": None})
        self.assertEqual(self.put(studied_state(), headers=headers).status_code, 200)
        self.assertIsNone(self.client.get("/api/v1/state", headers=self.auth("reader")).json()["data"])

    def test_registration_rejects_weak_password_duplicate_username_and_extra_fields(self):
        for username, password, expected in (("validname", "short", 422), ("invalid name", PASSWORD, 422), ("r" * 41, PASSWORD, 422), ("reader", PASSWORD, 409), ("READER", PASSWORD, 409)):
            response = self.client.post("/api/v1/auth/register", json={"username": username, "password": password})
            self.assertEqual(response.status_code, expected, response.text)
            self.assertNotIn(password, response.text)
        response = self.client.post("/api/v1/auth/register", json={"username": "newuser", "password": PASSWORD, "admin": True})
        self.assertEqual(response.status_code, 422)
        self.assertIsNone(self.db.find_user("newuser"))

    def test_registration_mode_disabled(self):
        app = create_app(replace(self.settings, registration_mode="disabled"))
        with TestClient(app) as client:
            self.assertEqual(client.get("/api/v1/auth/config").json(), {"registrationMode": "disabled"})
            self.assertEqual(client.post("/api/v1/auth/register", json={"username": "newuser", "password": PASSWORD}).status_code, 403)

    def test_registration_ip_limit_persists_and_no_partial_account_is_created(self):
        app = create_app(replace(self.settings, registration_ip_limit=1))
        with TestClient(app) as client:
            first = client.post("/api/v1/auth/register", json={"username": "publicone", "password": PASSWORD})
            self.assertEqual(first.status_code, 201)
            blocked = client.post("/api/v1/auth/register", json={"username": "publictwo", "password": PASSWORD})
            self.assertEqual(blocked.status_code, 429)
            self.assertGreater(int(blocked.headers["retry-after"]), 0)
        self.assertIsNone(self.db.find_user("publictwo"))
        with self.db.connection() as connection:
            total = connection.execute("SELECT COUNT(*) FROM sessions WHERE user_id=(SELECT id FROM users WHERE username='publicone')").fetchone()[0]
        self.assertEqual(total, 1)

    def test_two_users_cannot_read_or_overwrite_each_others_progress(self):
        first, second = self.auth(), self.auth("another")
        data = studied_state()
        saved = self.put(data, headers=first)
        self.assertEqual(saved.status_code, 200, saved.text)
        self.assertEqual(saved.json()["revision"], 1)
        self.assertEqual(saved.json()["data"], data)
        self.assertIsNone(self.client.get("/api/v1/state", headers=second).json()["data"])
        self.assertEqual(self.put(empty_state("Another"), headers=second).status_code, 200)
        self.assertEqual(self.client.get("/api/v1/state", headers=first).json()["data"], data)

    def test_revision_conflict_preserves_the_previous_snapshot(self):
        headers = self.auth()
        self.assertEqual(self.put(studied_state(), headers=headers).status_code, 200)
        result = self.put(empty_state("Stale write"), revision=0, headers=headers)
        self.assertEqual(result.status_code, 409)
        self.assertEqual(result.json()["revision"], 1)
        self.assertNotIn("data", result.json())
        self.assertEqual(self.client.get("/api/v1/state", headers=headers).json()["data"], studied_state())
        self.assertEqual(self.put(empty_state("Explicit new write"), revision=1, headers=headers).json()["revision"], 2)

    def test_initial_revision_check_is_atomic_under_simultaneous_writes(self):
        barrier = Barrier(2)

        def write(name):
            barrier.wait()
            try:
                return self.db.save_state(self.user["id"], 0, empty_state(name))["revision"]
            except RevisionConflict as error:
                return ("conflict", error.revision)

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(write, ["First", "Second"]))
        self.assertEqual(results.count(1), 1)
        self.assertEqual(results.count(("conflict", 1)), 1)
        self.assertEqual(self.db.state(self.user["id"])["revision"], 1)

    def test_logout_expiry_and_password_reset_revoke_access(self):
        headers = self.auth()
        self.assertEqual(self.client.post("/api/v1/auth/logout", headers=headers).status_code, 204)
        self.assertEqual(self.client.get("/api/v1/state", headers=headers).status_code, 401)
        headers = self.auth()
        with self.db.connection() as connection:
            connection.execute("UPDATE sessions SET expires_at=?", (time.time() - 1,))
        self.assertEqual(self.client.get("/api/v1/state", headers=headers).status_code, 401)
        headers = self.auth()
        self.db.reset_password("reader", self.password_hash)
        self.assertEqual(self.client.get("/api/v1/state", headers=headers).status_code, 401)

    def test_login_throttle_and_unknown_users_have_generic_error(self):
        app = create_app(replace(self.settings, login_account_limit=2))
        with TestClient(app) as client:
            for username in ("reader", "missing"):
                response = client.post("/api/v1/auth/login", json={"username": username, "password": "A wrong password of enough length"})
                self.assertEqual(response.status_code, 401)
                self.assertEqual(response.json(), {"detail": "账号或密码不正确。"})
            client.post("/api/v1/auth/login", json={"username": "reader", "password": "A wrong password of enough length"})
            result = client.post("/api/v1/auth/login", json={"username": "reader", "password": PASSWORD})
            self.assertEqual(result.status_code, 429)
            self.assertGreater(int(result.headers["retry-after"]), 0)

    def test_cors_only_allows_exact_configured_origins(self):
        allowed = "https://reader.github.io"
        preflight = self.client.options("/api/v1/state", headers={"Origin": allowed, "Access-Control-Request-Method": "PUT", "Access-Control-Request-Headers": "Authorization,Content-Type"})
        self.assertEqual(preflight.status_code, 200)
        self.assertEqual(preflight.headers["access-control-allow-origin"], allowed)
        self.assertNotIn("access-control-allow-credentials", preflight.headers)
        bad = self.client.get("/api/v1/state", headers={**self.auth(), "Origin": "https://attacker.example"})
        self.assertEqual(bad.status_code, 403)
        self.assertNotIn("access-control-allow-origin", bad.headers)

    def test_invalid_json_size_and_schema_fail_without_saving(self):
        headers = self.auth()
        huge = self.client.put("/api/v1/state", content=b"{}", headers={**headers, "content-type": "application/json", "content-length": str(MAX_BODY + 1)})
        self.assertEqual(huge.status_code, 413)
        for malformed in ('{"expectedRevision":0,"expectedRevision":1,"data":{}}', '{"expectedRevision":NaN,"data":{}}', '{"broken":'):
            result = self.client.put("/api/v1/state", content=malformed, headers={**headers, "content-type": "application/json"})
            self.assertEqual(result.status_code, 400)
        invalid = studied_state()
        invalid["records"]["constructor"] = invalid["records"].pop("mitigate")
        self.assertEqual(self.put(invalid, headers=headers).status_code, 422)
        self.assertIsNone(self.client.get("/api/v1/state", headers=headers).json()["data"])

    def test_streamed_upload_limit_does_not_depend_on_content_length(self):
        headers = self.auth()

        def chunks():
            yield b'{"padding":"'
            for _ in range(11):
                yield b"a" * (1024 * 1024)
            yield b'"}'

        response = self.client.put("/api/v1/state", content=chunks(), headers={**headers, "content-type": "application/json"})
        self.assertEqual(response.status_code, 413, response.text[:200])

    def test_backup_is_consistent_private_and_will_not_overwrite_a_file(self):
        self.db.save_state(self.user["id"], 0, studied_state())
        destination = Path(self.temp.name) / "backup" / "private.sqlite3"
        self.db.backup(destination)
        with sqlite3.connect(destination) as connection:
            self.assertEqual(connection.execute("SELECT revision FROM snapshots").fetchone()[0], 1)
        if os.name != "nt":
            self.assertEqual(destination.stat().st_mode & 0o077, 0)
        with self.assertRaises(ValueError):
            self.db.backup(destination)


class SnapshotValidationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.validator = SnapshotValidator()

    def test_real_card_guess_and_deleted_personal_sentence_references_are_accepted(self):
        data = studied_state()
        data["records"]["mitigate"]["lastSentenceId"] = "archive-deleted-sentence-mitigate"
        self.assertEqual(self.validator.validate(data), data)
        self.assertEqual(len(self.validator.words), 2000)
        self.assertEqual(len(self.validator.sentences), 6000)

    def test_invalid_fields_numbers_dates_topics_and_guesses_are_rejected(self):
        mutations = [
            lambda data: data.update(schemaVersion=True),
            lambda data: data.update(unexpected="not allowed"),
            lambda data: data["preferences"].update(dailyGoal=True),
            lambda data: data["preferences"].update(retention=float("nan")),
            lambda data: data["preferences"].update(dailyGoal=10**400),
            lambda data: data["preferences"].update(name="x" * 41),
            lambda data: data["archive"][0].update(topic=[]),
            lambda data: data["archive"][0].update(createdAt="2026-02-30T03:00:00.000Z"),
            lambda data: data["records"]["mitigate"].update(lastSentenceId="foster-0"),
            lambda data: data["records"]["mitigate"]["card"].update(lapses=2),
            lambda data: data["records"]["mitigate"]["card"].pop("last_review"),
            lambda data: data["logs"][0]["guess"].update(correct=False),
            lambda data: data["logs"].append(copy.deepcopy(data["logs"][0])),
        ]
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                data = studied_state()
                mutation(data)
                with self.assertRaises(InvalidSnapshot):
                    self.validator.validate(data)


if __name__ == "__main__":
    unittest.main()
