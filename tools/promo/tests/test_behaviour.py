"""Tactics with fake snapshots (no browser): the Kneel leaf, the kneeling shot rules and the
boss-arena tactics (crates block the line, ducking under bubbles on the firing ledge)."""
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



def boss_snap(bubbles=(), raised=True, t=1.0):
    s = snap([])
    s["boss"] = {"state": "bubbles", "phase": "spit", "hp": 50, "maxHp": 50, "raised": raised, "claw": 1.0 if raised else 0.0,
                 "ox": 300, "homeX": 300, "floor": FLOOR + 32, "t": t,
                 "face": {"x": 300, "y": FLOOR - 40, "w": 26, "h": 62}, "shell": {}, "claws": {"x": 270, "y": 0, "w": 36, "h": 46}}
    s["enemyShots"] = list(bubbles)
    s["hero"]["weapon"] = "cutter"
    return s


def bubble(x, y, vx, vy, grav=0.0):
    return {"kind": "bubble", "x": x, "y": y, "w": 8, "h": 8, "vx": vx, "vy": vy, "grav": grav}


class BossAgent(FakeAgent):
    def __init__(self, s, grid=GRID):
        super().__init__(s)
        self.world = World(s, grid)
        self.boss_level = True

    def reacted(self, key, delay=None):
        return True

    def tour_left(self):
        return False

    def at_perch(self):
        return True


class CoverAndDucking(unittest.TestCase):
    def test_crate_blocks_the_line_to_the_face(self):
        s = boss_snap()
        self.assertTrue(World(s, GRID).boss_face_hittable())
        gy = int((FLOOR - 28 + 14) // 16)                  # gun row standing
        g = list(GRID)
        g[gy] = g[gy][:12] + "D" + g[gy][13:]
        self.assertFalse(World(s, g).boss_face_hittable())

    def test_no_shot_as_the_claws_drop(self):
        s = boss_snap(t=0.05)
        s["boss"]["state"], s["boss"]["phase"] = "slam", "raise"
        self.assertFalse(World(s, GRID).boss_face_hittable())

    def test_kneeling_ducks_a_head_high_bubble(self):
        b = bubble(140, FLOOR - 26, -120, 0)              # flying level at head height, toward Buck
        w = World(boss_snap([b]), GRID)
        self.assertTrue(w.will_hit(b, 24, kneeling=False))
        self.assertFalse(w.will_hit(b, 24, kneeling=True))

    def test_boss_leaf_ducks_instead_of_stepping(self):
        b = bubble(140, FLOOR - 26, -120, 0)
        want = behaviour.boss(BossAgent(boss_snap([b])))
        self.assertEqual((want["dir"], want.get("down"), want["why"]), (0, True, "dodge"))

    def test_boss_leaf_steps_aside_from_a_low_bubble(self):
        b = bubble(140, FLOOR - 8, -120, 0)               # at knee height: ducking won't help
        want = behaviour.boss(BossAgent(boss_snap([b])))
        self.assertEqual(want["why"], "sidestep")   # soft: the 1 s settle rule applies
        self.assertNotEqual(want["dir"], 0)
        self.assertFalse(want.get("down"))


if __name__ == "__main__":
    unittest.main()
