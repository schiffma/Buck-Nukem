"""Fair play and reproducibility (task 2.2): the bridge only writes input state, and the same
seed plus the same inputs reproduce the same game exactly."""
import os
import re
import unittest

from tests import _path  # noqa: F401
from agent.session import PROMO, Session

BROWSER = os.environ.get("PROMO_BROWSER", "chrome")
# writes the bridge is allowed to make: input, headless stepping, seeding, recording-only hooks
ALLOWED = {"Game.headless", "Math.random", "FILM.grain", "FILM.scratchChance", "Sound.onPlay", "Sound.setTempo",
           "Sound.setTrack", "Sound.onEngines", "Boss.hitByShot", "damageEnemy", "window.PromoBridge"}


def game_writes(src):
    """Assignments to game objects (Player/Game/Boss/Camera/Level/Input/Sound/FILM/...) in the bridge."""
    hits = set()
    for m in re.finditer(r"\b(Player|Game|Boss|Camera|Level|Input|Sound|FILM|Film|FX|Math|window)\.([\w.]+)\s*=(?!=)", src):
        hits.add(m.group(1) + "." + m.group(2))
    for m in re.finditer(r"^\s*(damageEnemy)\s*=", src, re.M):
        hits.add(m.group(1))
    return hits


class FairPlayTest(unittest.TestCase):
    def test_bridge_writes_only_input(self):
        src = (PROMO / "bridge.js").read_text(encoding="utf-8")
        # renderAudio rebuilds Sound's nodes on an offline context after the run; that is "S." not "Sound."
        bad = sorted(game_writes(src) - ALLOWED)
        self.assertEqual(bad, [], "bridge writes game state: %s" % bad)
        self.assertIn("Input.simulate", src)
        self.assertNotIn("godMode", src)

    def test_step_matches_the_games_own_update(self):
        with Session(browser=BROWSER, seed=7, log=lambda *a: None) as a, Session(browser=BROWSER, seed=7, log=lambda *a: None) as b:
            seq = [{"enter": 1}] + [{}] * 399 + [{"right": 1}] * 200 + [{}] * 100
            sa = a.step(seq)
            # b: the same inputs, but applied and updated by the game's own loop functions directly
            b.page.evaluate("(seq) => PromoBridge.rawUpdate(seq)", seq)
            sb = b.snapshot()
            for k in ("state", "levelIndex", "score"):
                self.assertEqual(sa[k], sb[k], k)
            self.assertEqual(sa["hero"], sb["hero"])
            self.assertEqual(sa["enemies"], sb["enemies"])

    def test_ride_step_matches_the_games_own_update(self):
        with Session(browser=BROWSER, seed=7, log=lambda *a: None, first_reel=1) as a,                 Session(browser=BROWSER, seed=7, log=lambda *a: None, first_reel=1) as b:
            seq = [{"enter": 1}] + [{}] * 399 + [{"right": 1, "fire": 1}] * 300 + [{"right": 1, "jump": 1}] + [{"right": 1}] * 99
            sa = a.step(seq)
            a.simulate_hop()                           # queries leave no trace
            sa2 = a.snapshot()
            b.page.evaluate("(seq) => PromoBridge.rawUpdate(seq)", seq)
            sb = b.snapshot()
            self.assertEqual(sa["level"]["name"], "THE ROAD TO WOLLERAU")
            for k in ("hero", "enemies", "enemyShots", "score"):
                self.assertEqual(sa[k], sb[k], k)
                self.assertEqual(sa2[k], sb[k], k)

    def test_same_seed_same_game(self):
        seq = [{"enter": 1}] + [{}] * 399 + [{"right": 1, "fire": 1}] * 150 + [{"jump": 1, "right": 1}] * 50
        snaps = []
        for _ in range(2):
            with Session(browser=BROWSER, seed=7, log=lambda *a: None) as s:
                snaps.append(s.step(seq))
        a, b = snaps
        self.assertEqual(a["steps"], 600)
        for k in ("hero", "enemies", "enemyShots", "pickups", "score", "kills", "shots", "time"):
            self.assertEqual(a[k], b[k], k)


if __name__ == "__main__":
    unittest.main()
