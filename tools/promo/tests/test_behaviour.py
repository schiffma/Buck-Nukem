"""Tactics with fake snapshots (no browser): the Kneel leaf and the kneeling shot rules."""
import unittest

from tests import _path  # noqa: F401
from agent import behaviour
from agent.world import World

FLOOR = 10 * 16                      # feet row of the test map
GRID = ["." * 40] * 10 + ["#" * 40] * 2


def snap(enemies, kneeling=False, face=1):
    h = 16 if kneeling else 28
    return {"time": 10.0, "hero": {"x": 100.0, "y": FLOOR - h, "w": 10, "h": h, "vx": 0, "vy": 0, "onGround": True,
                                    "climbing": False, "face": face, "weapon": "blaster", "kneeling": kneeling, "dead": False},
            "enemies": enemies, "enemyShots": []}


def cray(x, leaping=False, y=None, vx=-40):
    return {"id": 7, "type": "cray", "x": x, "y": FLOOR - 10 if y is None else y, "w": 20, "h": 10, "vx": vx, "vy": 0,
            "face": -1, "state": "", "leaping": leaping, "hidden": False, "active": True}


class FakeCtrl:
    def busy(self):
        return False


class FakeAgent:
    def __init__(self, s, route_dir=1):
        self.world = World(s, GRID)
        self.ctrl = FakeCtrl()
        self.boss_level = False
        self._rd = route_dir

    def route_dir(self):
        return self._rd


class KneelLeaf(unittest.TestCase):
    def test_ground_crayfish_ahead(self):
        a = FakeAgent(snap([cray(100 + 5 + 80 - 10)]))          # centre 80 px ahead
        want = behaviour.kneel(a)
        self.assertIsNotNone(want)
        self.assertTrue(want["down"])
        self.assertEqual(want["why"], "kneel")
        self.assertEqual(want["dir"], 0)                         # already facing it

    def test_turns_to_face_it(self):
        a = FakeAgent(snap([cray(100 + 5 - 80 - 10, vx=40)], face=1), route_dir=-1)
        want = behaviour.kneel(a)
        self.assertEqual(want["dir"], -1)
        self.assertTrue(want["down"])

    def test_other_floor_or_leaping_or_too_close(self):
        self.assertIsNone(behaviour.kneel(FakeAgent(snap([cray(175, y=FLOOR - 10 - 64)]))))   # 4 tiles up
        self.assertIsNone(behaviour.kneel(FakeAgent(snap([cray(175, leaping=True)]))))       # Cray leaf's job
        self.assertIsNone(behaviour.kneel(FakeAgent(snap([cray(110)]))))                      # < 28 px: Vault/Spacing
        self.assertIsNone(behaviour.kneel(FakeAgent(snap([cray(20, vx=40)]))))                # behind (route goes right)

    def test_budget(self):
        a = FakeAgent(snap([cray(175)]))
        a.kneel_time = {7: behaviour.KNEEL_BUDGET}
        self.assertIsNone(behaviour.kneel(a))


class KneelingShot(unittest.TestCase):
    def test_ground_crayfish_hittable_only_kneeling(self):
        e = cray(175)
        self.assertFalse(World(snap([e]), GRID).hittable(e))
        self.assertTrue(World(snap([e], kneeling=True), GRID).hittable(e))


if __name__ == "__main__":
    unittest.main()
