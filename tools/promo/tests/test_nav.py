"""Navigation graph (task 3.1): matches the level checker on the real levels; shortest paths."""
import unittest

from tests import _path  # noqa: F401
from agent.nav import Nav
from build import SRC, parse_level
import check_levels

ENTITY = "PLKMXortuhsg+wCEF"


def clean(rows):
    """The game clears entity cells (a crayfish next to water becomes water)."""
    out = []
    for y, r in enumerate(rows):
        row = list(r)
        for x, c in enumerate(r):
            if c in ENTITY:
                lw = r[x - 1] if x > 0 else "#"
                rw = r[x + 1] if x + 1 < len(r) else "#"
                row[x] = "~" if c == "K" and "~" in (lw, rw) else "."
        out.append("".join(row))
    return out


def find(rows, chars):
    return [(x, y) for y, r in enumerate(rows) for x, c in enumerate(r) if c in chars]


class NavTest(unittest.TestCase):
    def test_real_levels_match_the_level_checker(self):
        for f in sorted((SRC / "levels").glob("*.txt")):
            meta = parse_level(f)
            if meta.get("ride") == "1":         # the mofa ride: not played by the agent (promo starts at reel 2)
                continue
            raw = meta["map"]
            reached, keys, missing, _, _ = check_levels.analyse(meta)
            self.assertTrue(reached, f.name)
            start = find(raw, "P")[0]
            nav = Nav(clean(raw), keys=keys)
            reach = nav.reachable(start)
            goal = (find(raw, "E") or find(raw, "X"))[0]
            self.assertTrue(goal in reach or (goal[0], goal[1] + 1) in reach, "%s: goal %s" % (f.name, goal))
            # every pickup: standing on its cell or the cell below it, or crossed by a fall
            passed = set()
            for n in reach:
                for e in nav.neighbours(*n):
                    passed.update(e.get("cells", []))
            for p in find(raw, "ortuhsg+w"):
                ok = any(q in reach or q in passed for q in (p, (p[0], p[1] + 1)))
                self.assertTrue(ok, "%s: pickup %s at %s unreachable" % (f.name, raw[p[1]][p[0]], p))

    def test_shortest_path_prefers_walking(self):
        rows = ["........",
                "........",
                "........",
                "########"]
        nav = Nav(rows)
        cost, moves = nav.path((0, 2), {(5, 2)})
        self.assertEqual([m["type"] for m in moves], ["walk"] * 5)
        self.assertAlmostEqual(cost, 5 * 16 / 96, places=3)

    def test_jump_over_gap(self):
        rows = ["..........",
                "..........",
                "..........",
                "####.#####"]                    # a hole at x 4: walking falls out of the map
        _, moves = Nav(rows).path((0, 2), {(9, 2)})
        self.assertIn("jump", [m["type"] for m in moves])

    def test_ladder_up(self):
        rows = ["..........",
                "..........",
                "####H#####",
                "....H.....",
                "....H.....",
                "##########"]
        nav = Nav(rows)
        self.assertIn("climb", [e["type"] for e in nav.neighbours(4, 4)])   # the ladder is a move
        self.assertIsNotNone(nav.path((0, 4), {(0, 1)}))                    # (jumping up the shaft is faster here)

    def test_doors_need_keys(self):
        rows = ["######",
                "...R..",
                "...R..",
                "######"]                        # door from floor to ceiling (above the map is open sky)
        self.assertIsNone(Nav(rows).path((0, 2), {(5, 2)}))
        self.assertIsNotNone(Nav(rows, keys={"r"}).path((0, 2), {(5, 2)}))


if __name__ == "__main__":
    unittest.main()
