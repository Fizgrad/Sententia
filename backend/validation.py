"""Validate the same version-1 snapshot that the browser accepts.

There is no trust in browser validation: every upload is bounded and checked
again before SQLite is touched. This module has no framework dependencies.
"""
from __future__ import annotations

import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class InvalidSnapshot(ValueError):
    pass


def fail(path: str) -> None:
    raise InvalidSnapshot(f"进度数据格式不正确：{path}。")


def obj(value: Any, path: str, required: set[str], optional: set[str] | None = None) -> dict:
    if not isinstance(value, dict) or not required.issubset(value) or set(value) - required - (optional or set()):
        fail(path)
    return value


def text(value: Any, path: str, maximum: int = 10_000, empty: bool = False) -> str:
    if not isinstance(value, str) or (not empty and not value.strip()):
        fail(path)
    try:
        length = len(value.encode("utf-16-le")) // 2  # Match JavaScript string.length.
    except UnicodeError:
        fail(path)
    if length > maximum:
        fail(path)
    return value


def number(value: Any, path: str, low: float, high: float, integer: bool = False) -> int | float:
    if type(value) not in (int, float) or value < low or value > high or (type(value) is float and not math.isfinite(value)):
        fail(path)
    if integer and int(value) != value:
        fail(path)
    return int(value) if integer else value


def date(value: Any, path: str) -> str:
    value = text(value, path, 50)
    if not re.match(r"^\d{4}-\d{2}-\d{2}T", value):
        fail(path)
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            fail(path)
        return parsed.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    except (ValueError, OverflowError):
        fail(path)


def array(value: Any, path: str, maximum: int) -> list:
    if not isinstance(value, list) or len(value) > maximum:
        fail(path)
    return value


def identifier(value: Any, path: str) -> str:
    value = text(value, path, 150)
    if not re.fullmatch(r"[a-zA-Z0-9_-]+", value):
        fail(path)
    return value


class SnapshotValidator:
    def __init__(self, manifest_path: Path | None = None):
        manifest_path = manifest_path or Path(__file__).with_name("vocabulary-manifest.json")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest.get("schemaVersion") != 1 or not isinstance(manifest.get("words"), dict):
            raise ValueError("Invalid vocabulary validation manifest")
        self.words: dict[str, list[str]] = manifest["words"]
        self.sentences = {sid: wid for wid, sentences in self.words.items() for sid in sentences}
        self.topics = set(manifest["topics"])

    def word(self, value: Any, path: str) -> str:
        value = text(value, path, 60)
        if value not in self.words:
            fail(path)
        return value

    def sentence(self, value: Any, wid: str, path: str, empty: bool = False) -> str:
        value = text(value, path, 250, empty)
        if not value and empty:
            return value
        if self.sentences.get(value) == wid:
            return value
        if re.fullmatch(r"archive-[a-zA-Z0-9_-]+", value) and value.endswith(f"-{wid}"):
            return value
        fail(path)

    def card(self, value: Any, path: str) -> dict:
        required = {"due", "stability", "difficulty", "elapsed_days", "scheduled_days", "learning_steps", "reps", "lapses", "state"}
        value = obj(value, path, required, {"last_review"})
        state = number(value["state"], path + ".state", 0, 3, True)
        reps = number(value["reps"], path + ".reps", 0, 1_000_000, True)
        result = {
            "due": date(value["due"], path + ".due"),
            "stability": number(value["stability"], path + ".stability", 0 if state == 0 else .00001, 1_000_000),
            "difficulty": number(value["difficulty"], path + ".difficulty", 0 if state == 0 else 1, 10),
            "elapsed_days": number(value["elapsed_days"], path + ".elapsed_days", 0, 1_000_000),
            "scheduled_days": number(value["scheduled_days"], path + ".scheduled_days", 0, 1_000_000),
            "learning_steps": number(value["learning_steps"], path + ".learning_steps", 0, 10_000, True),
            "reps": reps,
            "lapses": number(value["lapses"], path + ".lapses", 0, reps, True),
            "state": state,
        }
        if "last_review" in value:
            result["last_review"] = date(value["last_review"], path + ".last_review")
        if (reps > 0 and "last_review" not in result) or (state == 0 and reps != 0):
            fail(path)
        return result

    def validate(self, raw: Any) -> dict:
        raw = obj(raw, "snapshot", {"schemaVersion", "records", "archive", "logs", "preferences"})
        if type(raw["schemaVersion"]) is not int or raw["schemaVersion"] != 1:
            fail("schemaVersion")
        if not isinstance(raw["records"], dict) or len(raw["records"]) > len(self.words):
            fail("records")
        records = {}
        for key, raw_record in raw["records"].items():
            wid = self.word(key, "records.id")
            record = obj(raw_record, "record", {"id", "card", "learnedAt", "lastSentenceId", "seenSentenceIds"})
            if record["id"] != wid:
                fail("record.id")
            seen = [self.sentence(s, wid, "record.seenSentenceIds") for s in array(record["seenSentenceIds"], "record.seenSentenceIds", 5000)]
            records[wid] = {
                "id": wid,
                "card": self.card(record["card"], "record.card"),
                "learnedAt": date(record["learnedAt"], "record.learnedAt"),
                "lastSentenceId": self.sentence(record["lastSentenceId"], wid, "record.lastSentenceId", True),
                "seenSentenceIds": list(dict.fromkeys(seen)),
            }
        archive, archive_ids = [], set()
        for entry in array(raw["archive"], "archive", 5000):
            entry = obj(entry, "archive.entry", {"id", "text", "topic", "source", "wordIds", "createdAt"}, {"sentenceId"})
            aid = identifier(entry["id"], "archive.id")
            topic = text(entry["topic"], "archive.topic", 30)
            if aid in archive_ids or topic not in self.topics:
                fail("archive.id/topic")
            archive_ids.add(aid)
            result = {
                "id": aid,
                "text": text(entry["text"], "archive.text"),
                "topic": topic,
                "source": text(entry["source"], "archive.source", 300, True),
                "wordIds": list(dict.fromkeys(self.word(w, "archive.wordIds") for w in array(entry["wordIds"], "archive.wordIds", len(self.words)))),
                "createdAt": date(entry["createdAt"], "archive.createdAt"),
            }
            if "sentenceId" in entry:
                sid = text(entry["sentenceId"], "archive.sentenceId", 100)
                if sid not in self.sentences:
                    fail("archive.sentenceId")
                result["sentenceId"] = sid
            archive.append(result)
        logs, log_ids = [], set()
        for log in array(raw["logs"], "logs", 100_000):
            log = obj(log, "log", {"id", "wordId", "sentenceId", "rating", "mode", "at"}, {"guess"})
            lid = identifier(log["id"], "log.id")
            wid = self.word(log["wordId"], "log.wordId")
            if lid in log_ids or log["mode"] not in ("learn", "review"):
                fail("log.id/mode")
            log_ids.add(lid)
            result = {"id": lid, "wordId": wid, "sentenceId": self.sentence(log["sentenceId"], wid, "log.sentenceId"), "rating": number(log["rating"], "log.rating", 1, 4, True), "mode": log["mode"], "at": date(log["at"], "log.at")}
            if "guess" in log:
                guess = obj(log["guess"], "log.guess", {"choiceId", "correct"})
                choice = guess["choiceId"]
                if choice is not None:
                    choice = text(choice, "log.guess.choiceId", 100)
                    if choice not in self.words and not re.fullmatch(r"fallback-(v|n|adj|adv)\.-\d+", choice):
                        fail("log.guess.choiceId")
                if log["mode"] != "learn" or type(guess["correct"]) is not bool or guess["correct"] != (choice == wid) or result["rating"] != (3 if guess["correct"] else 1):
                    fail("log.guess")
                result["guess"] = {"choiceId": choice, "correct": guess["correct"]}
            logs.append(result)
        prefs = obj(raw["preferences"], "preferences", {"dailyGoal", "retention", "autoSpeak", "name"})
        if type(prefs["autoSpeak"]) is not bool:
            fail("preferences.autoSpeak")
        preferences = {"dailyGoal": number(prefs["dailyGoal"], "preferences.dailyGoal", 1, 100, True), "retention": number(prefs["retention"], "preferences.retention", .7, .99), "autoSpeak": prefs["autoSpeak"], "name": text(prefs["name"], "preferences.name", 40)}
        return {"schemaVersion": 1, "records": records, "archive": archive, "logs": logs, "preferences": preferences}
