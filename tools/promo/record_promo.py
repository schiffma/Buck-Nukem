#!/usr/bin/env python3
"""Record a promo video of Buck Nukem played by the Python agent.

    python tools/promo/record_promo.py                 # full run -> recordings/buck_nukem_promo_<date>.mp4
    python tools/promo/record_promo.py --dry all       # no video: just play and print the run report
    python tools/promo/record_promo.py --dry 1         # dry run of one level (0-based index, diagnostics)
    python tools/promo/record_promo.py --seed 7        # another (reproducible) run

How it works: Playwright runs the unmodified built game (dist/buck_nukem.html) in Chrome or
Edge with a thin bridge (tools/promo/bridge.js). The Python agent (tools/promo/agent/) reads a
snapshot of the game each video frame and answers with keyboard inputs only: networkx route
planning over the level, py_trees tactics, human-like motion control. While recording, the
page renders deterministic 320x240 frames (30 fps) that are piped into ffmpeg, and the game
audio is rendered offline in the page and muxed in. The final H.264/AAC encode is two-pass with
a bitrate computed from the run length so the file stays within --max-mb (default 16 MB).
"""
import argparse
import datetime
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))

from agent.metrics import LIMITS, failures, format_table, run_metrics   # noqa: E402
from agent.runner import Agent, dry_run                                  # noqa: E402
from agent.session import Session                                        # noqa: E402

LEVEL_LIMIT_S, TOTAL_LIMIT_S, STUCK_LIMIT = 150, 450, 2


def fail(msg):
    print("ERROR: " + msg, file=sys.stderr)
    sys.exit(2)


def ffmpeg_exe():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        exe = shutil.which("ffmpeg")
        if exe:
            return exe
        fail("ffmpeg not found: pip install -r tools/promo/requirements.txt")


def print_report(rep, metrics, names):
    print("Run report:")
    for lv in rep.get("levels", []):
        skipped = sorted(lv.get("skipped", []))
        print("  L%d %-34s score %6d  items %2d/%-2d  kills %2d/%-2d  deaths %d  stuck %d  %6.1fs  %s" % (
            lv["level"], lv["name"][:34], lv.get("score", 0), lv["collected"], lv["pickups"], lv["killed"],
            len(lv["enemy_ids"]) + (1 if lv["name"].startswith("THE CREEK") else 0), lv["deaths"], lv["stuck"],
            lv["time"], "COMPLETED" if lv["completed"] else "not completed"))
        if skipped:
            print("      skipped (not worth the detour): " + ", ".join(skipped))
        if lv.get("alive"):
            print("      alive at the exit: " + " ".join(lv["alive"]))
    print("  victory: %s  game over: %s  deaths: %d  stuck events: %d" % (
        rep.get("victory"), rep.get("game_over"), rep.get("deaths", 0), rep.get("stuck", 0)))
    print(format_table(metrics, names))


def check(rep, metrics, full):
    """Spec limits missed by a run (empty list = pass)."""
    out = []
    if not rep.get("victory"):
        out.append("no victory")
    for lv in rep.get("levels", []):
        if lv["level"] <= 3 and lv["time"] > LEVEL_LIMIT_S:
            out.append("L%d took %.0f s > %d s" % (lv["level"], lv["time"], LEVEL_LIMIT_S))
        required = [s for s in lv.get("skipped", []) if any(" %s@" % k in s for k in ("r", "u", "g", "w", "+"))]
        if required:
            out.append("L%d skipped required items: %s" % (lv["level"], ", ".join(required)))
    if full:
        total = sum(lv["time"] for lv in rep.get("levels", []))
        if total > TOTAL_LIMIT_S:
            out.append("run took %.0f s > %d s" % (total, TOTAL_LIMIT_S))
        if rep.get("stuck", 0) > STUCK_LIMIT:
            out.append("%d stuck events > %d" % (rep["stuck"], STUCK_LIMIT))
        if "total" in metrics:
            out += failures(metrics["total"])
    return out


def encode(ff, inter, audio, out, kbps, tmp, fps):
    log = str(Path(tmp) / "x264pass")
    base = [ff, "-y", "-loglevel", "error", "-i", str(inter)]
    v = ["-c:v", "libx264", "-b:v", f"{kbps}k", "-preset", "slow", "-tune", "animation", "-pix_fmt", "yuv420p",
         "-r", str(fps), "-passlogfile", log]
    subprocess.run(base + v + ["-pass", "1", "-an", "-f", "mp4", os.devnull], check=True)
    cmd = list(base)
    if audio:
        cmd += ["-i", str(audio)]
    cmd += v + ["-pass", "2"]
    cmd += (["-c:a", "aac", "-b:a", "64k", "-ac", "1", "-shortest"] if audio else ["-an"])
    cmd += ["-movflags", "+faststart", str(out)]
    subprocess.run(cmd, check=True)


class FrameSink:
    """Writes frames to ffmpeg in index order (batches may arrive out of order)."""

    def __init__(self, proc):
        self.proc, self.next, self.wait, self.count = proc, 0, {}, 0

    def __call__(self, i, data):
        self.wait[i] = data
        while self.next in self.wait:
            self.proc.stdin.write(self.wait.pop(self.next))
            self.next += 1
            self.count += 1


def record(args):
    ff = ffmpeg_exe()
    tmp = tempfile.mkdtemp(prefix="buckpromo_")
    inter, wav = Path(tmp) / "intermediate.mp4", Path(tmp) / "audio.wav"
    proc = subprocess.Popen([ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", "320x240",
                             "-r", str(args.fps), "-i", "-", "-vf", "scale=640:480:flags=neighbor",
                             "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", "-pix_fmt", "yuv420p", str(inter)],
                            stdin=subprocess.PIPE)
    sink = FrameSink(proc)
    audio = {}
    t0 = time.time()
    with Session(browser=args.browser, seed=args.seed, on_frame=sink, on_audio=lambda d: audio.setdefault("wav", d)) as s:
        agent = Agent(s, seed=args.seed)
        s.start_recording(args.fps)
        last = [time.time()]

        def progress(f, snap, a):
            if time.time() - last[0] > 15:
                last[0] = time.time()
                print("  %4.0fs game time  %s L%d  score %d" % (snap["time"], snap["state"], snap["levelIndex"] + 1, snap["score"]))
            if f % 300 == 0:
                s.flush()

        rep = agent.run(max_minutes=args.timeout, outro_s=5.0, on_progress=progress)
        res = s.finish_recording(not args.no_audio)
        errors = list(s.errors)
    proc.stdin.close()
    proc.wait()
    if "wav" in audio:
        wav.write_bytes(audio["wav"])
    metrics = run_metrics(agent.rows, agent.grids)
    print_report(rep, metrics, agent.names)
    if errors:
        print("PAGE ERRORS: " + "; ".join(errors[:5]))
    frames, dur = res["frames"], res["duration"]
    print(f"Captured {sink.count}/{frames} frames ({dur:.1f} s of video) in {time.time() - t0:.0f} s")
    out = Path(args.out) if args.out else ROOT / "recordings" / f"buck_nukem_promo_{datetime.date.today().isoformat()}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    limit = int(args.max_mb * 1024 * 1024)
    audio_k = 64 if wav.exists() else 0
    kbps = int(limit * 8 * 0.95 / dur / 1000) - audio_k
    for _ in range(4):
        kbps = max(kbps, 60)
        print(f"Encoding at {kbps} kbit/s video" + (f" + {audio_k} kbit/s audio" if audio_k else ""))
        encode(ff, inter, wav if audio_k else None, out, kbps, tmp, args.fps)
        size = out.stat().st_size
        print(f"  -> {size / 1048576:.2f} MB")
        if size <= limit:
            break
        kbps = int(kbps * 0.85)
    else:
        fail(f"could not get the file under {args.max_mb} MB")
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"Promo video: {out}  ({out.stat().st_size / 1048576:.2f} MB, {dur:.0f} s)")
    return rep, metrics, errors


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--out", default=None)
    ap.add_argument("--max-mb", type=float, default=16.0)
    ap.add_argument("--fps", type=int, default=30, choices=[30])
    ap.add_argument("--browser", default="chrome", choices=["chrome", "edge"])
    ap.add_argument("--seed", type=int, default=1977, help="random seed (game and agent): same seed, same run")
    ap.add_argument("--no-audio", action="store_true")
    ap.add_argument("--dry", default=None, help="no video: 'all' or a level index (0-3)")
    ap.add_argument("--timeout", type=float, default=15, help="game minutes before giving up")
    args = ap.parse_args()

    if args.dry is not None:
        out = dry_run(browser=args.browser, seed=args.seed, which=args.dry, max_minutes=args.timeout,
                      log=lambda *a: None)
        rep, metrics, errors = out["report"], out["metrics"], out["errors"]
        print_report(rep, metrics, out["names"])
    else:
        rep, metrics, errors = record(args)
    missed = check(rep, metrics, args.dry in (None, "all"))
    if errors:
        missed.append("page errors")
    print("Spec limits: " + ("all met" if not missed else "MISSED: " + "; ".join(missed)))
    print("  (limits: level <= %d s, run <= %d s, stuck <= %d, %s)" % (
        LEVEL_LIMIT_S, TOTAL_LIMIT_S, STUCK_LIMIT, ", ".join("%s <= %s" % kv for kv in LIMITS.items())))
    return 0 if not missed else 1


if __name__ == "__main__":
    sys.exit(main())
