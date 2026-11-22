#!/usr/bin/env python3
"""Measure the play quality of the promo agent over a full dry run (no video).

    python tools/promo/quirks.py [--seed 1977]
    python tools/promo/quirks.py --json out.json

Reports per level: reversals and quick reversals per minute, unneeded jumps, shots without a
hittable target and the hit rate (rules in agent/metrics.py), and checks the spec limits.
Exit code 1 if a limit is missed. The old JS autopilot's baseline is recorded in
openspec/changes/python-promo-autopilot/tasks.md (task 0.1).
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from agent.metrics import failures, format_table, run_metrics  # noqa: E402
from agent.runner import dry_run  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--browser", default="chrome", choices=["chrome", "edge"])
    ap.add_argument("--seed", type=int, default=1977)
    ap.add_argument("--json", default=None)
    args = ap.parse_args()
    out = dry_run(browser=args.browser, seed=args.seed, which="all", log=lambda *a: None)
    rows, grids, names, victory, errors = out["rows"], out["grids"], out["names"], out["victory"], out["errors"]
    res = run_metrics(rows, grids)
    print("Python agent   victory: %s   page errors: %d" % (victory, len(errors)))
    print(format_table(res, names))
    fails = failures(res["total"])
    print("limits: " + ("all met" if not fails else "MISSED: " + "; ".join(fails)))
    if args.json:
        Path(args.json).write_text(json.dumps({"victory": victory, "metrics": {str(k): v for k, v in res.items()}}, indent=1))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
