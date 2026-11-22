#!/usr/bin/env python3
"""Render game states to PNG with headless Chrome (visual checks).

Usage: python tools/screenshot.py OUT.png SPEC [SPEC ...]
SPEC is the #shot= value, e.g. "title", "play,0,40,13,30", "boss,3,5,12,400".
Several specs are tiled into one image (2 columns), each at 2x scale.
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from run_tests import HTML, find_browser  # noqa: E402


def shoot(spec, out):
    exe = find_browser("chrome") or find_browser("edge")
    url = HTML.resolve().as_uri() + "#shot=" + spec
    with tempfile.TemporaryDirectory() as profile:
        subprocess.run([exe, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={profile}",
                        "--window-size=660,500", "--virtual-time-budget=5000", f"--screenshot={out}", url],
                       capture_output=True, timeout=120)
    img = Image.open(out).convert("RGB")
    # crop the centred 640x480 (2x) canvas
    w, h = img.size
    x0, y0 = (w - 640) // 2, (h - 480) // 2
    return img.crop((x0, y0, x0 + 640, y0 + 480))


def main():
    out, specs = sys.argv[1], sys.argv[2:]
    tiles = []
    with tempfile.TemporaryDirectory() as tmp:
        for i, s in enumerate(specs):
            tiles.append(shoot(s, str(Path(tmp) / f"s{i}.png")))
    cols = 1 if len(tiles) == 1 else 2
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 640, rows * 480), (40, 0, 40))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * 640, (i // cols) * 480))
    sheet.save(out)
    print(out)


if __name__ == "__main__":
    main()
