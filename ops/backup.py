"""Consistent private daily backups, with a fourteen-backup retention window."""
import os
from datetime import datetime, timezone
from pathlib import Path

from backend.database import Database


def main():
    os.umask(0o077)
    source = Path(os.environ["SENTENTIA_DB_PATH"])
    if not source.is_file():
        raise RuntimeError("The live progress database does not exist.")
    directory = source.parent / "backups"
    directory.mkdir(mode=0o700, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    Database(source).backup(directory / f"progress-{stamp}.sqlite3")
    for old in sorted(directory.glob("progress-*.sqlite3"), reverse=True)[14:]:
        old.unlink()
    print("Private database backup completed.")


if __name__ == "__main__":
    main()
