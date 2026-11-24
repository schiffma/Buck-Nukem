"""Unit tests for build rules: python -m unittest tools/test_build.py"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402


class RideMapRules(unittest.TestCase):
    def ride(self, *rows):
        return {"ride": "1", "map": list(rows)}

    def test_clean_ride_map(self):
        self.assertEqual(build.ride_map_errors(self.ride("..{..o..", "########")), [])

    def test_rivella_cervelat_and_weapons_fail(self):
        for ch in "hsw":
            errs = build.ride_map_errors(self.ride(".." + ch + ".....", "########"), "1_road.txt")
            self.assertEqual(len(errs), 1, ch)
            self.assertIn("'" + ch + "'", errs[0])

    def test_other_levels_may_have_them(self):
        self.assertEqual(build.ride_map_errors({"map": ["..h.s.w.", "########"]}), [])


if __name__ == "__main__":
    unittest.main()
