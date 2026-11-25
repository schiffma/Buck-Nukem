"""Bridge + Playwright session: boots the real game, steps it, reports state (tasks 2.1, 2.2)."""
import os
import unittest

from tests import _path  # noqa: F401
from agent.session import Session

BROWSER = os.environ.get("PROMO_BROWSER", "chrome")


class SessionTest(unittest.TestCase):
    def test_boots_steps_and_snapshots(self):
        with Session(browser=BROWSER, log=lambda *a: None) as s:
            snap = s.snapshot(True)
            self.assertEqual(snap["state"], "TITLE")
            for _ in range(120):                         # 120 video frames = 240 game steps, no inputs
                snap = s.step([{}, {}])
            self.assertEqual(snap["state"], "TITLE")
            self.assertEqual(snap["steps"], 240)
            self.assertIn("hero", snap)
            snap = s.step([{"enter": 1}] + [{}] * 5)
            self.assertEqual(snap["state"], "LEVEL_INTRO")
            self.assertEqual(s.errors, [])

    def test_level_snapshot_has_world(self):
        with Session(browser=BROWSER, log=lambda *a: None) as s:
            s.step([{"enter": 1}] + [{}] * 400)        # past the reel intro
            snap = s.snapshot(True)
            self.assertEqual(snap["state"], "PLAY")
            self.assertTrue(snap["grid"] and snap["pickups"] and snap["enemies"] is not None and snap["exit"])
            self.assertEqual(len(snap["grid"]), snap["level"]["h"])


    def test_hop_mirror_matches_the_game(self):
        """simulateHop predicts the mofa's real flight (within 2 px, landing within 2 steps): a hop on
        the flat road, a ramp launch and a hop on the climb. A car hit in mid-air (knockback) ends
        the comparison there."""
        def fly(s, snap):
            path = []
            while not snap["hero"]["onGround"] and len(path) < 160:
                snap = s.step([{"right": 1, "fire": 1}])
                h = snap["hero"]
                if h["hurtT"] > 0 or h["dead"]:
                    return path, False, snap
                path.append((h["x"], h["y"]))
            return path, True, snap

        def compare(path, landed, sim):
            self.assertGreaterEqual(len(path), 15, "flight too short to compare")
            for p, q in zip(path, sim):
                self.assertLessEqual(abs(p[0] - q[1]), 2.0, (p, q))
                self.assertLessEqual(abs(p[1] - q[2]), 2.0, (p, q))
            if landed:
                self.assertLessEqual(abs(len(path) - len(sim)), 2, (len(path), len(sim)))

        with Session(browser=BROWSER, log=lambda *a: None, first_reel=1) as s:
            snap = s.step([{"enter": 1}] + [{}] * 400, True)
            ramps = snap["ramps"]
            snap = s.step([{"right": 1}] * 90)
            self.assertTrue(snap["level"]["name"].startswith("THE ROAD"))
            sim = s.simulate_hop()                                          # a hop on the flat
            snap = s.step([{"right": 1, "jump": 1}])
            path, landed, snap2 = fly(s, snap)
            compare([(snap["hero"]["x"], snap["hero"]["y"])] + path, landed, sim)
            snap = snap2
            done = False
            for ramp in ramps[:3]:                                          # a ramp launch (the first clean one)
                while not (snap["hero"]["vy"] < -300 and not snap["hero"]["onGround"]) and snap["hero"]["x"] < ramp["x"] + 200:
                    snap = s.step([{"right": 1, "fire": 1}])
                if snap["hero"]["x"] >= ramp["x"] + 200:
                    continue
                sim = s.simulate_hop(snap["hero"]["vy"], 0.5, 160)
                path, landed, snap = fly(s, snap)
                if len(path) >= 15:
                    compare(path, landed, sim)
                    done = True
                    break
            self.assertTrue(done, "no clean ramp flight")
            # on the climb (columns 420-570), guns going: hop once the wheels are on the slope
            for _ in range(3000):
                snap = s.step([{"right": 1, "fire": 1}])
                h = snap["hero"]
                if h["x"] > 450 * 16 and h["onGround"] and h["hurtT"] <= 0 and not h["dead"] and h["vx"] > 60:
                    break
            self.assertTrue(snap["hero"]["x"] > 450 * 16 and not snap["hero"]["dead"], "the climb was not reached")
            sim = s.simulate_hop()
            snap = s.step([{"right": 1, "jump": 1}])
            path, landed, _ = fly(s, snap)
            compare([(snap["hero"]["x"], snap["hero"]["y"])] + path, landed, sim)
            self.assertEqual(s.errors, [])

if __name__ == "__main__":
    unittest.main()
