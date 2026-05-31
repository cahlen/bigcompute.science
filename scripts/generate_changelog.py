#!/usr/bin/env python3
"""Regenerate src/data/changelog.json from recent git commits."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src" / "data" / "changelog.json"
LIMIT = 10


def generate(limit: int = LIMIT) -> list[dict[str, str]]:
    proc = subprocess.run(
        [
            "git",
            "log",
            f"-{limit}",
            "--format={\"hash\":\"%h\",\"date\":\"%ad\",\"message\":\"%s\"}",
            "--date=format:%b %d",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "git log failed")

    entries: list[dict[str, str]] = []
    for line in proc.stdout.strip().splitlines():
        if not line:
            continue
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return entries


def main() -> int:
    try:
        entries = generate()
    except RuntimeError as e:
        print(f"generate_changelog: {e}", file=sys.stderr)
        return 1

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(entries, indent=2) + "\n")
    print(f"Changelog written: {OUTPUT} ({len(entries)} entries)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
