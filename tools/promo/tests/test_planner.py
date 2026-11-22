"""Route planner (task 3.2): keys before doors, near-optimal tours, real-level plan cost."""
import random
import unittest

from tests import _path  # noqa: F401
from tests.test_nav import clean, find
from agent.nav import Nav, TILE
from agent.planner import Item, Planner, brute_force, targets
from build import SRC, parse_level

PICK = "ortuhsg+w"


def items_of(raw):
    return [Item(i, raw[y][x], x * TILE + 4, y * TILE + 4, 8, 8) for i, (x, y) in enumerate(find(raw, PICK))]


def exit_nodes(raw):
    e = find(raw, "E")
    return {e[0], (e[0][0], e[0][1] + 1)} if e else None


class PlannerTest(unittest.TestCase):
    def test_key_before_its_door(self):
        rows = ["##########",
                "..r...R..o",
                "......R...",
                "##########"]
        raw = rows
        p = Planner(clean(raw))
        tour = p.plan((0, 2), items_of(raw))
        kinds = [s["item"].kind for s in tour]
        self.assertEqual(kinds, ["r", "o"])                     # the ball behind the red door comes after the key
        self.assertIn("r", tour[1]["keys"])

    def test_near_optimal_on_random_instances(self):
        rng = random.Random(3)
        for trial in range(12):
            w = 24
            rows = ["." * w] * 3 + ["#" * w]
            rows = [list(r) for r in rows]
            nav = Nav(["".join(r) for r in rows])
            cells = rng.sample(range(1, w - 1), 6)
            its = [Item(i, "o", x * TILE + 4, 2 * TILE + 4, 8, 8) for i, x in enumerate(cells)]
            start = (rng.randrange(w), 2)
            p = Planner(["".join(r) for r in rows])
            reach = nav.reachable(start)
            stage = [([it], targets(nav, it, reach)) for it in its]
            order = p.order(nav, start, stage)
            pos, cost = start, 0.0
            for it, t in order:
                cost += nav.distances(pos)[t[0]] + t[3]
                pos = t[2]
            opt = brute_force(nav, start, stage)
            self.assertLessEqual(cost, opt * 1.15 + 1e-9, "trial %d: %.2f vs optimum %.2f" % (trial, cost, opt))

    def test_real_levels_plan_everything_fast(self):
        prev_times = {"1_courts.txt": 165, "2_creek.txt": 53, "3_clubhouse.txt": 234}   # old JS autopilot, seconds
        for f in sorted((SRC / "levels").glob("*.txt")):
            raw = parse_level(f)["map"]
            its = items_of(raw)
            p = Planner(clean(raw))
            tour = p.plan(find(raw, "P")[0], its, exit_nodes(raw))
            self.assertEqual(p.unreached, [], f.name)
            got = {it.id for s in tour for it in s["items"]}
            self.assertTrue(all(s["cost"] < float("inf") for s in tour), f.name)
            self.assertEqual(got, {it.id for it in its}, f.name)
            total = sum(s["cost"] for s in tour)
            print("  %-16s %2d items, planned travel %.0f s" % (f.name, len(its), total))
            if f.name in prev_times:
                self.assertLess(total, prev_times[f.name], f.name)
                self.assertIsNone(tour[-1]["item"], "exit last")


if __name__ == "__main__":
    unittest.main()
