#!/usr/bin/env python3
"""Verify external URLs and site paths referenced in published content."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "src" / "content"
PUBLIC = ROOT / "public"
DATA = ROOT / "src" / "data"

QUOTED_URL_RE = re.compile(r"""["'](https?://[^"']+)["']""")
MD_LINK_RE = re.compile(r"\]\(([^)]+)\)")
INTERNAL_PATH_RE = re.compile(
    r"^/(?:findings|experiments|data|about|cite|verification|interactive|mathematicians)(?:/[^\s\)\]\"'`]+)?/?$"
)


def collect_markdown_paths() -> list[Path]:
    return sorted(CONTENT.rglob("*.md"))


def slug_map() -> set[str]:
    slugs: set[str] = set()
    for kind in ("findings", "experiments"):
        for path in (CONTENT / kind).glob("*.md"):
            text = path.read_text(encoding="utf-8")
            m = re.search(r"^slug:\s*(\S+)\s*$", text, re.MULTILINE)
            if m:
                slug = m.group(1)
                slugs.add(f"/{kind}/{slug}/")
                slugs.add(f"/{kind}/{slug}")
    return slugs


def clean_target(raw: str) -> str:
    return raw.strip().strip("`").strip('"').strip("'").rstrip(".,;")


def extract_external_urls(text: str) -> set[str]:
    urls: set[str] = set(QUOTED_URL_RE.findall(text))
    for m in MD_LINK_RE.finditer(text):
        target = clean_target(m.group(1))
        if target.startswith("http"):
            urls.add(target)
    return urls


def extract_internal_paths(text: str) -> set[str]:
    paths: set[str] = set()
    for m in MD_LINK_RE.finditer(text):
        target = clean_target(m.group(1))
        if target.startswith("/") and not target.startswith("//"):
            paths.add(target.split("#")[0])
    for m in re.finditer(r"(?<![(\w])/(?:findings|experiments|data)/[^\s\)\]\"'`]+", text):
        paths.add(clean_target(m.group(0).split("#")[0]))
    for m in re.finditer(r"^\s*(?:dir|data|finding|related_experiment):\s*(/\S+)\s*$", text, re.MULTILINE):
        paths.add(clean_target(m.group(1)))
    return {p for p in paths if INTERNAL_PATH_RE.match(p)}


def data_dir_ok(path: str) -> bool | str:
    rel = path.removeprefix("/data/").strip("/")
    if not rel:
        return "empty data path"
    base = PUBLIC / "data" / rel
    if base.is_file():
        return True
    if (base / "metadata.json").is_file():
        return True
    if base.is_dir() and any(base.iterdir()):
        return True
    return f"missing public data: {base}"


def resolve_internal(path: str, known_routes: set[str]) -> bool | str:
    if path.startswith("/data/"):
        return data_dir_ok(path)

    normalized = path if path.endswith("/") else path + "/"
    alt = path.rstrip("/")
    if normalized in known_routes or alt in known_routes or f"{alt}/" in known_routes:
        return True
    return f"unknown route: {path}"


def normalize_url(url: str) -> str:
    return url.strip().rstrip(".,;")


def fetch_ok(url: str, timeout: float) -> tuple[bool, str]:
    url = normalize_url(url)
    if "wikipedia.org" in url:
        try:
            proc = subprocess.run(
                ["curl", "-sL", "-o", "/dev/null", "-w", "%{http_code}", url],
                capture_output=True,
                text=True,
                timeout=timeout + 5,
                check=False,
            )
            code = int((proc.stdout or "0").strip() or "0")
            if 200 <= code < 400:
                return True, str(code)
            return False, f"HTTP {code}"
        except Exception as e:
            return False, str(e)

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; bigcompute-link-check/1.0; +https://bigcompute.science)",
        "Accept-Language": "en-US,en;q=0.9",
    }
    req = urllib.request.Request(url, method="GET", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if 200 <= resp.status < 400:
                return True, str(resp.status)
            return False, f"HTTP {resp.status}"
    except urllib.error.HTTPError as e:
        if e.code == 401 and "huggingface.co" in url:
            return False, "HTTP 401 (private or gated — do not publish)"
        return False, f"HTTP {e.code}"
    except Exception as e:
        return False, str(e)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="https://bigcompute.science")
    parser.add_argument("--timeout", type=float, default=25.0)
    parser.add_argument("--skip-external", action="store_true")
    parser.add_argument("--only", nargs="*", help="Limit to URLs/paths containing substring")
    args = parser.parse_args()

    known = slug_map()
    external: set[str] = set()
    internal: set[str] = set()

    for path in collect_markdown_paths():
        text = path.read_text(encoding="utf-8")
        external |= extract_external_urls(text)
        internal |= extract_internal_paths(text)

    for path in DATA.glob("*.json"):
        external |= extract_external_urls(path.read_text(encoding="utf-8"))

    meta = PUBLIC / "meta.json"
    if meta.exists():
        external |= extract_external_urls(meta.read_text(encoding="utf-8"))

    if args.only:
        external = {u for u in external if any(f in u for f in args.only)}
        internal = {p for p in internal if any(f in p for f in args.only)}

    failures: list[str] = []
    base = args.base_url.rstrip("/")

    for p in sorted(internal):
        ok = resolve_internal(p, known)
        if ok is not True:
            live = base + p
            live_ok, detail = fetch_ok(live, args.timeout)
            if not live_ok:
                # Directory data paths: try metadata.json on live site
                if p.startswith("/data/") and not p.endswith(".json"):
                    meta_url = base + p.rstrip("/") + "/metadata.json"
                    meta_ok, meta_detail = fetch_ok(meta_url, args.timeout)
                    if meta_ok:
                        continue
                    detail = f"{detail}; metadata: {meta_detail}"
                failures.append(f"INTERNAL {p} ({ok}); live {live}: {detail}")

    if not args.skip_external:
        externals = sorted(external, key=lambda u: (1 if "wikipedia.org" in u else 0, u))
        for url in externals:
            if url.endswith("/findings/_project-level/"):
                continue
            if "mcp.bigcompute.science/mcp" in url:
                continue
            if "wikipedia.org" in url:
                time.sleep(1.0)
            ok, detail = fetch_ok(url, args.timeout)
            if not ok:
                failures.append(f"EXTERNAL {url}: {detail}")
            elif "wikipedia.org" not in url:
                time.sleep(0.1)

    if failures:
        print(f"Link check FAILED ({len(failures)} issues):", file=sys.stderr)
        for line in failures:
            print(f"  - {line}", file=sys.stderr)
        return 1

    print(
        f"Link check OK — {len(internal)} internal paths, {len(external)} external URLs"
        + (" (external checked)" if not args.skip_external else " (external skipped)")
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
