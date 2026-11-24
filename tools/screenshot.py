#!/usr/bin/env python3
"""Render game states to PNG with headless Chrome (visual checks).

Usage: python tools/screenshot.py [--touch [WxH]] OUT.png SPEC [SPEC ...]
SPEC is the #shot= value, e.g. "title", "play,1,40,13,30", "boss,4,5,12,400" (level = 0-based index: 0 ride, 1 courts, ... 4 boss).
Several specs are tiled into one image (2 columns), each at 2x scale.
--touch renders in touch mode (#shot=...&touch) and keeps the whole window (picture plus the
on-screen control bars), default size 844x390 (a phone in landscape; 390x844 shows portrait).
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from run_tests import HTML, find_browser  # noqa: E402


def shoot(spec, out, touch=None):
    exe = find_browser("chrome") or find_browser("edge")
    url = HTML.resolve().as_uri() + "#shot=" + spec + ("&touch" if touch else "")
    size = touch.replace("x", ",") if touch else "660,500"
    with tempfile.TemporaryDirectory() as profile:
        subprocess.run([exe, "--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--hide-scrollbars", f"--user-data-dir={profile}",
                        f"--window-size={size}", "--virtual-time-budget=5000", f"--screenshot={out}", url],
                       capture_output=True, timeout=120)
    img = Image.open(out).convert("RGB")
    if touch:
        return img
    # crop the centred 640x480 (2x) canvas
    w, h = img.size
    x0, y0 = (w - 640) // 2, (h - 480) // 2
    return img.crop((x0, y0, x0 + 640, y0 + 480))


def main():
    args, touch = sys.argv[1:], None
    if args and args[0] == "--touch":
        args = args[1:]
        touch = "844x390"
        if args and "x" in args[0] and not args[0].lower().endswith(".png"):
            touch, args = args[0], args[1:]
    out, specs = args[0], args[1:]
    tiles = []
    with tempfile.TemporaryDirectory() as tmp:
        for i, s in enumerate(specs):
            tiles.append(shoot(s, str(Path(tmp) / f"s{i}.png"), touch))
    tw = max(t.size[0] for t in tiles)
    th = max(t.size[1] for t in tiles)
    cols = 1 if len(tiles) == 1 else 2
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * th), (40, 0, 40))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * tw, (i // cols) * th))
    sheet.save(out)
    print(out)


if __name__ == "__main__":
    main()
