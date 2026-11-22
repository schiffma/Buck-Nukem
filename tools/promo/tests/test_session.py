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


if __name__ == "__main__":
    unittest.main()
