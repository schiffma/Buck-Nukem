"""The ride agent's decisions on synthetic snapshots (no browser): finale hands-off, fire only
with a target in line, reaction delays, Ferraris, the X7 gap, the limo, thrown items, ramps and
the throttle hold rules."""
import random
import unittest

from tests import _path  # noqa: F401
from agent.ride import DT, RideBrain, inputs

ROAD = 304.0                 # road surface (px)
RIDE = {"finale": False, "finaleT": 0, "gateLocked": True, "up": False,
        "front": {"dx": 32, "dy": 12}, "rear": {"dx": -21, "dy": 15},
        "shot": {"w": 8, "h": 4, "v": 300, "aim": 30}, "rate": 8, "top": 150, "hopVel": -330,
        "rampVel": -360, "rampGrav": 0.5, "gravity": 1000, "maxFall": 420, "ladies": 0, "wrecks": 0}


def hero(x=1000.0, vx=150.0, **kw):
    h = {"x": x, "y": ROAD - 30, "w": 22, "h": 30, "vx": vx, "vy": 0, "onGround": True, "hp": 8, "dead": False,
         "fireCd": 0, "hurtT": 0}
    h.update(kw)
    return h


def car(eid, kind, x, vx, hp, w=None, h=None, **kw):
    sizes = {"suv": (129, 45), "tesla": (118, 36), "ferrari": (114, 30), "limo": (300, 56)}
    cw, ch = sizes[kind]
    e = {"id": eid, "type": kind, "x": x, "y": ROAD - (h or ch), "w": w or cw, "h": h or ch, "vx": vx, "hp": hp, "state": ""}
    e.update(kw)
    return e


def snap(t, h, enemies=(), shots=(), hero_shots=(), pickups=(), cam=None, **ride):
    r = dict(RIDE)
    r.update(ride)
    return {"time": t, "state": "PLAY", "hero": h, "ride": r, "camera": {"x": h["x"] + 11 - 108 if cam is None else cam},
            "enemies": list(enemies), "enemyShots": list(shots), "heroShots": list(hero_shots), "pickups": list(pickups),
            "road": [ROAD] * 700}


def stub_sim(h_ref):
    """A Python stand-in for the bridge's hop mirror (same equations), from the hero or a start."""
    def sim(vy0=None, gk=1, start=None):
        s = start or h_ref[0]
        x, y, vy, vx = s["x"], s["y"], (-330 if vy0 is None else vy0), s["vx"]
        out = []
        for i in range(1, 151):
            vy = min(420, vy + 1000 * gk * DT)
            x += vx * DT
            y += vy * DT
            if vy >= 0 and y + 30 >= ROAD:
                out.append([i * DT, x, ROAD - 30])
                break
            out.append([i * DT, x, y])
        return out
    return sim


def brain(h_ref=None):
    return RideBrain(random.Random(1), sim_hop=stub_sim(h_ref) if h_ref else None)


def run(b, frames, make):
    """Decisions over frames (each 2 steps); make(t) -> snapshot. Returns the decisions."""
    out = []
    for i in range(frames):
        out.append(b.decide(make(i * 2 * DT)))
    return out


class RideBrainTest(unittest.TestCase):
    def test_finale_hands_off(self):
        b = brain()
        d = b.decide(snap(1.0, hero(), [car(1, "tesla", 900, 260, 6)], finale=True))
        self.assertEqual((d["throttle"], d["fire"], d["hop"]), (0, False, False))
        self.assertEqual(inputs(d), [{"why": "finale"}, {"why": "finale"}])

    def test_fire_only_with_a_target_in_line_after_a_reaction_delay(self):
        b = brain()
        h = hero()
        self.assertFalse(b.decide(snap(0.0, h))["fire"], "nothing in line: no fire")
        x7 = car(2, "suv", h["x"] + 22 + 120, 90, 10)
        ds = run(b, 20, lambda t: snap(1.0 + t, h, [x7]))
        first = next(i for i, d in enumerate(ds) if d["fire"])
        self.assertTrue(4 <= first <= 10, "fires after 150-300 ms, not at once (frame %d)" % first)
        self.assertTrue(all(d["fire"] for d in ds[first:]))
        # covered: ten shots in flight in its rows will already destroy it
        flight = [{"x": h["x"] + 40 + 8 * i, "y": ROAD - 20, "w": 8, "h": 4, "vx": 300, "dmg": 1} for i in range(10)]
        self.assertFalse(b.decide(snap(2.0, h, [x7], hero_shots=flight))["fire"])
        # off screen (ahead of the view): no target
        far = car(3, "suv", h["x"] + 400, 90, 10)
        b2 = brain()
        self.assertFalse(any(d["fire"] for d in run(b2, 20, lambda t: snap(t, h, [far]))))

    def test_x7_gap(self):
        b = brain()
        h = hero(vx=120)
        d = b.decide(snap(5.0, h, [car(1, "suv", h["x"] + 22 + 40, 90, 10)]))
        self.assertEqual((d["throttle"], d["why"]), (-1, "x7-gap"))
        b = brain()
        d = b.decide(snap(5.0, h, [car(1, "suv", h["x"] + 22 + 80, 90, 10)]))
        self.assertEqual(d["throttle"], 0)
        b = brain()
        d = b.decide(snap(5.0, h, [car(1, "suv", h["x"] + 22 + 140, 90, 10)]))
        self.assertEqual(d["throttle"], 1)

    def test_limo_stop_short(self):
        b = brain()
        h = hero(vx=100)
        limo = car(9, "limo", h["x"] + 22 + 110, 0, 24)
        d = b.decide(snap(5.0, h, [limo]))
        self.assertEqual((d["throttle"], d["why"]), (-1, "limo"))
        b = brain()
        d = b.decide(snap(5.0, hero(vx=0), [car(9, "limo", h["x"] + 22 + 110, 0, 24)]))
        self.assertEqual(d["throttle"], 0, "stopped at the distance: no gas into the limo")

    def test_ferrari_slow_down_then_hop_when_it_would_still_hit(self):
        h_ref = [hero(vx=0)]
        b = brain(h_ref)
        h = h_ref[0]
        # heard (off screen): slow down / stop, no fire yet
        f = car(4, "ferrari", h["x"] + 400, -340, 5)
        ds = run(b, 12, lambda t: snap(10.0 + t, h, [f]))
        self.assertTrue(all(d["why"] == "ferrari" for d in ds[10:]))
        self.assertFalse(any(d["fire"] for d in ds))
        # about to touch and far from destroyed: a hop at the right moment (the flight clears it)
        hops = []
        for k in range(30):
            gap = 170 - 340 * k * 2 * DT
            if gap < -10:
                break
            e = car(4, "ferrari", h["x"] + 22 + gap, -340, 5)
            d = b.decide(snap(10.5 + k * 2 * DT, h, [e]))
            if d["hop"]:
                hops.append(gap)
                break
        self.assertTrue(hops, "no hop over the Ferrari")
        self.assertTrue(20 <= hops[0] <= 90, "hop when it is close (gap %.0f px)" % hops[0])

    def test_lobbed_cup_is_dodged(self):
        """A cup lobbed over the X7 stays above the guns' reach until it is on the mofa: dodge it."""
        h_ref = [hero(vx=0)]         # held up behind the X7: the throw is aimed right at him
        b = brain(h_ref)
        h = h_ref[0]
        sx, sy, g = h["x"] + 160, ROAD - 49, 420
        tx, ty = h["x"] + 11, h["y"] + 6
        cup = {"id": 7, "kind": "latte", "x": sx, "y": sy, "w": 6, "h": 8, "vx": (tx - sx) + h["vx"] * 0.5,
               "vy": (ty - sy - 0.5 * g), "grav": g, "shootable": True}
        self.assertIsNotNone(b.hit_time(cup, b.hero_path(h, 75)))
        ds = run(b, 8, lambda t: snap(3.0 + t, h, shots=[cup]))
        acts = [d for d in ds if d["why"] == "dodge" or d["hop"]]
        self.assertTrue(acts, "dodged (gas/brake away or a hop)")
        self.assertGreaterEqual(ds.index(acts[0]), 4, "after a reaction delay")

    def test_item_at_gun_height_is_shot_down(self):
        b = brain()
        h = hero(vx=0)
        ball = {"id": 8, "kind": "golfball", "x": h["x"] + 200, "y": h["y"] + 11, "w": 5, "h": 5, "vx": -150, "vy": 0, "grav": 0, "shootable": True}
        ds = []
        for i in range(12):
            c = dict(ball, x=ball["x"] + ball["vx"] * i * 2 * DT)
            ds.append(b.decide(snap(3.0 + i * 2 * DT, h, shots=[c])))
        fired = [i for i, d in enumerate(ds) if d["fire"]]
        self.assertTrue(fired and fired[0] >= 4, fired)
        self.assertFalse(any(ds[i]["up"] for i in fired), "level: it comes in at gun height")
        self.assertFalse(any(d["hop"] for d in ds))

    def test_ramp_speed_collects_the_item(self):
        h_ref = [hero(x=1200, vx=150)]
        b = brain(h_ref)
        ramp = {"x": 1280, "y": ROAD - 12, "w": 32, "h": 12}
        trophy = {"id": 3, "type": "t", "x": 86 * 16, "y": 13 * 16, "w": 12, "h": 12}
        v = b.approach_speed(ramp, h_ref[0], RIDE, {"pickups": [trophy]})
        self.assertTrue(70 <= v < 150, v)
        b.ramps = [ramp]
        d = b.decide(snap(2.0, h_ref[0], pickups=[trophy]))
        self.assertEqual(d["why"], "ramp")
        self.assertLessEqual(d["throttle"], 0, "slows down for the ramp")

    def test_throttle_hold_and_no_quick_flip_back(self):
        b = brain()
        self.assertEqual(b.hold(1, "route", 0.0), 1)
        self.assertEqual(b.hold(0, "route", 0.1), 1, "held at least 200 ms")
        self.assertEqual(b.hold(0, "route", 0.25), 0)
        self.assertEqual(b.hold(-1, "route", 0.5), 0, "no brake within 1 s of starting to gas: coast")
        self.assertEqual(b.hold(-1, "route", 1.1), -1)
        self.assertEqual(b.hold(1, "route", 1.5), 0, "no flip back to gas within 1 s: coast")
        self.assertEqual(b.hold(1, "dodge", 1.6), 1, "except to dodge")
        self.assertEqual(b.hold(-1, "ferrari", 1.7), -1, "or for a Ferrari")

    def test_inputs(self):
        d = {"throttle": 1, "hop": True, "fire": True, "up": False, "why": "ferrari"}
        a, b = inputs(d)
        self.assertEqual(a, {"right": 1, "fire": 1, "why": "ferrari", "jump": 1})
        self.assertEqual(b, {"right": 1, "fire": 1, "why": "ferrari"})


if __name__ == "__main__":
    unittest.main()
