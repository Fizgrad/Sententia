"""Administrative commands run on the server, never in the static browser build."""
from __future__ import annotations

import argparse
import getpass
import json
import os
import stat
import sys
from pathlib import Path

from .app import Settings
from .database import Database, DuplicateUsername
from .security import hash_password, normalise_username


def read_password(args) -> str:
    if args.password_file:
        path = Path(args.password_file)
        info = path.stat()
        if not stat.S_ISREG(info.st_mode) or path.is_symlink():
            raise ValueError("Password source must be a regular private file.")
        if os.name != "nt" and info.st_mode & 0o077:
            raise ValueError("Password file must have permissions 0600 or stricter.")
        return path.read_text(encoding="utf-8").rstrip("\r\n")
    if args.password_stdin:
        return sys.stdin.readline().rstrip("\r\n")
    first = getpass.getpass("Password (12–128 characters): ")
    if first != getpass.getpass("Repeat password: "):
        raise ValueError("Passwords do not match.")
    return first


def main() -> int:
    parser = argparse.ArgumentParser(description="Manage Sententia accounts and SQLite backups without printing secrets.")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("init")
    commands.add_parser("prune")
    backup = commands.add_parser("backup")
    backup.add_argument("destination", type=Path)
    for name in ("create-user", "reset-password"):
        command = commands.add_parser(name)
        command.add_argument("username")
        password_source = command.add_mutually_exclusive_group()
        password_source.add_argument("--password-file", type=Path)
        password_source.add_argument("--password-stdin", action="store_true")
    args = parser.parse_args()
    if os.name != "nt":
        os.umask(0o077)
    settings = Settings.from_env()
    db = Database(settings.db_path)
    try:
        db.initialize()
        if args.command == "init":
            print("Database initialized.")
        elif args.command == "prune":
            print(json.dumps(db.prune()))
        elif args.command == "backup":
            if not args.destination.is_absolute():
                raise ValueError("Use an absolute private backup path outside the published files.")
            db.backup(args.destination)
            print("Consistent private database backup created.")
        else:
            username = normalise_username(args.username)
            encoded = hash_password(read_password(args))
            if args.command == "create-user":
                db.create_user(username, encoded)
                print(f"Account {username} created.")
            else:
                db.reset_password(username, encoded)
                print(f"Password updated for {username}; existing sessions revoked.")
    except DuplicateUsername:
        print("Account already exists.", file=sys.stderr)
        return 1
    except (ValueError, OSError) as error:
        print(f"Operation failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
