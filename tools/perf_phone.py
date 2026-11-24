#!/usr/bin/env python3
"""Phone performance check: frame cost of dist/buck_nukem.html in phone emulation.

Usage:  python tools/perf_phone.py [--browser chrome|edge] [--headed] [--frames 300]

Emulates a phone in landscape (987x444 CSS px, device pixel ratio 2.75, touch), slows the CPU
down through the DevTools protocol (1x and 4x) and plays the clay-court level (reel 2) with the hero running and
firing, once with the GPU film grade and once with the CPU grade (#film=cpu), and the mofa
ride (reel 1) on the GPU grade. Prints the CPU
time per drawn frame and stage, plus the WebGL renderer, and checks the budgets of the spec
"Film filter on the GPU":
  - GPU path at most 60% of the CPU path's time per frame (4x)
  - GPU path under 5 ms per frame at 4x
Exit code 0 when both are met, 1 when not, 2 when the check can't run.
Needs Playwright (pip install -r tools/promo/requirements.txt) and Chrome or Edge.
"""
import argparse
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "dist" / "buck_nukem.html"
VIEWPORT = {"width": 987, "height": 444}
DPR = 2.75
BUDGET_MS, RATIO = 5.0, 0.6

# Times update, drawing (render), film filter and scaling to the screen per frame.
MEASURE = """(args) => {
  const n = args[0], level = args[1];
  const G = window.__perf;
  G.Player.resetForGame(); G.Game.loadLevel(level); G.Game.setState(G.STATE.PLAY); G.Game.godMode = true;
  G.Input.simulate('right', true); G.Input.simulate('fire', true);
  for (let i = 0; i < 30; i++) { G.Game.update(1 / 60); G.Input.endStep(); G.Game.render(); G.present(); }   // warm up
  const t = { update: 0, render: 0, film: 0, present: 0 };
  const realApply = G.Film.apply;
  G.Film.apply = function () { const a = performance.now(); realApply.call(G.Film); t.film += performance.now() - a; };
  try {
    for (let i = 0; i < n; i++) {
      let a = performance.now(); G.Game.update(1 / 60); G.Input.endStep(); t.update += performance.now() - a;
      a = performance.now(); G.Game.render(); t.render += performance.now() - a;
      a = performance.now(); G.present(); t.present += performance.now() - a;
    }
  } finally { G.Film.apply = realApply; }
  t.present -= t.film;
  const out = { mode: G.Film.mode, renderer: G.renderer() };
  for (const k in t) out[k] = t[k] / n;
  out.total = t.update / n + t.render / n + t.film / n + t.present / n;
  return out;
}"""


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--browser", default="chrome", choices=["chrome", "edge"])
    ap.add_argument("--headed", action="store_true", help="show the browser window (some systems only use the GPU then)")
    ap.add_argument("--frames", type=int, default=300)
    args = ap.parse_args()
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright missing: pip install -r tools/promo/requirements.txt", file=sys.stderr)
        return 2
    if not HTML.is_file():
        print("dist/buck_nukem.html not found: run python tools/build.py", file=sys.stderr)
        return 2
    src = HTML.read_text(encoding="utf-8")
    marker = "\nboot();\n"
    if marker not in src:
        print("injection point 'boot();' not found in dist/buck_nukem.html", file=sys.stderr)
        return 2
    src = src.replace(marker, "\nwindow.__perf = { Game, Film, present, Player, STATE, Input, renderer: filmGLRenderer };" + marker, 1)
    results = {}
    with tempfile.TemporaryDirectory() as tmp, sync_playwright() as p:
        page_file = Path(tmp) / "buck_nukem.html"
        page_file.write_text(src, encoding="utf-8")
        browser = p.chromium.launch(channel="msedge" if args.browser == "edge" else "chrome", headless=not args.headed)
        # the clay courts (reel 2) on both paths and CPU rates; the mofa ride (reel 1) on the GPU path
        for scene, level, path, hash_, rate in [("courts", 1, "gpu", "", 1), ("courts", 1, "gpu", "", 4), ("courts", 1, "cpu", "#film=cpu", 1),
                                               ("courts", 1, "cpu", "#film=cpu", 4), ("ride", 0, "gpu", "", 1), ("ride", 0, "gpu", "", 4)]:
            if True:
                ctx = browser.new_context(viewport=VIEWPORT, device_scale_factor=DPR, is_mobile=True, has_touch=True)
                page = ctx.new_page()
                errors = []
                page.on("pageerror", lambda e: errors.append(str(e)))
                ctx.new_cdp_session(page).send("Emulation.setCPUThrottlingRate", {"rate": rate})
                page.goto(page_file.as_uri() + hash_)
                page.wait_for_function("() => window.__perf && window.__perf.Game", timeout=30000)
                page.wait_for_timeout(500)
                r = page.evaluate(MEASURE, [args.frames, level])
                ctx.close()
                if errors:
                    print("PAGE ERROR: " + " | ".join(errors), file=sys.stderr)
                    return 2
                results[(scene, path, rate)] = r
        browser.close()

    print(f"Phone emulation {VIEWPORT['width']}x{VIEWPORT['height']} @{DPR}, {args.frames} frames of the clay courts and the mofa ride, "
          f"CPU ms per drawn frame")
    print(f"WebGL renderer: {results[('courts', 'gpu', 1)]['renderer'] or '(none)'}")
    print(f"{'scene':<7} {'path':<5} {'cpu':>4} {'update':>7} {'render':>7} {'film':>7} {'screen':>7} {'total':>7}")
    for (scene, path, rate), r in results.items():
        print(f"{scene:<7} {path + ('' if r['mode'] == ('gl' if path == 'gpu' else 'cpu') else '!'):<5} {rate:>3}x "
              f"{r['update']:7.2f} {r['render']:7.2f} {r['film']:7.2f} {r['present']:7.2f} {r['total']:7.2f}")
    gpu, cpu, ride = results[("courts", "gpu", 4)], results[("courts", "cpu", 4)], results[("ride", "gpu", 4)]
    problems = []
    if gpu["mode"] != "gl":
        problems.append("the GPU film path was not used (no WebGL?)")
    if "swiftshader" in (gpu["renderer"] or "").lower():
        problems.append("WebGL is software (SwiftShader): try --headed for hardware graphics")
    ratio = gpu["total"] / cpu["total"] if cpu["total"] else 1
    ok_ratio, ok_budget = ratio <= RATIO, gpu["total"] < BUDGET_MS and ride["total"] < BUDGET_MS
    print(f"GPU path at 4x: courts {gpu['total']:.2f} ms, mofa ride {ride['total']:.2f} ms per frame (budget < {BUDGET_MS} ms); "
          f"courts = {ratio * 100:.0f}% of the CPU path (budget <= {RATIO * 100:.0f}%)")
    for pr in problems:
        print("NOTE: " + pr)
    met = ok_ratio and ok_budget and not problems
    print("Phone budgets: " + ("all met" if met else "MISSED"))
    return 0 if met else 1


if __name__ == "__main__":
    sys.exit(main())
