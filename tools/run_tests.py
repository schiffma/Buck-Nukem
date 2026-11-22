#!/usr/bin/env python3
"""Run the in-game scenario tests (src/test.js) in headless Chrome or Edge.

Usage:  python tools/run_tests.py [--browser chrome|edge] [--size 1280,1000]
Opens dist/buck_nukem.html#test, waits for the tests to finish and prints the report.
Exit code 0 when every test passes.
"""
import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "dist" / "buck_nukem.html"

BROWSERS = {
    "chrome": [r"C:\Program Files\Google\Chrome\Application\chrome.exe",
               r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
               "google-chrome", "chromium", "chrome"],
    "edge": [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
             r"C:\Program Files\Microsoft\Edge\Application\msedge.exe", "microsoft-edge", "msedge"],
}


def find_browser(name):
    for cand in BROWSERS[name]:
        if os.path.isfile(cand):
            return cand
        found = shutil.which(cand)
        if found:
            return found
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--browser", default="chrome", choices=sorted(BROWSERS))
    ap.add_argument("--size", default="1280,1000", help="window size WIDTH,HEIGHT")
    ap.add_argument("--html", default=str(HTML))
    args = ap.parse_args()
    exe = find_browser(args.browser)
    if not exe:
        print(f"{args.browser} not found", file=sys.stderr)
        return 2
    url = Path(args.html).resolve().as_uri() + "#test"
    with tempfile.TemporaryDirectory() as profile:
        cmd = [exe, "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
               f"--user-data-dir={profile}", f"--window-size={args.size}",
               "--autoplay-policy=no-user-gesture-required",
               "--virtual-time-budget=30000", "--dump-dom", url]
        # Edge on Windows only writes --dump-dom output to a real file handle, not a pipe.
        dump = Path(profile) / "dom.html"
        if args.browser == "edge" and os.name == "nt":
            # msedge.exe hands off to a child process; Start-Process -Wait waits for it.
            arglist = ",".join("'" + a.replace("'", "''") + "'" for a in cmd[1:])
            ps = (f"Start-Process -FilePath '{exe}' -ArgumentList @({arglist}) "
                  f"-RedirectStandardOutput '{dump}' -Wait -NoNewWindow")
            proc = subprocess.run(["powershell", "-NoProfile", "-Command", ps], capture_output=True, text=True, timeout=180)
        else:
            with open(dump, "w", encoding="utf-8") as fh:
                proc = subprocess.run(cmd, stdout=fh, stderr=subprocess.PIPE, text=True, timeout=180)
        stdout = dump.read_text(encoding="utf-8", errors="replace") if dump.exists() else ""
    m = re.search(r'<pre id="test-out"[^>]*>(.*?)</pre>', stdout, re.S)
    if not m or not m.group(1).strip():
        print("No test output found. Browser stderr:\n" + (proc.stderr or "")[-3000:], file=sys.stderr)
        return 2
    report = (m.group(1).replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
              .replace("&quot;", '"').replace("&#39;", "'"))
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")     # test output may contain the heart glyph
    print(f"[{args.browser} {args.size}]")
    print(report)
    return 0 if "TESTS PASS" in report else 1


if __name__ == "__main__":
    sys.exit(main())
