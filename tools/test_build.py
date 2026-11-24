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


class MusicHeader(unittest.TestCase):
    def test_known_tracks(self):
        for m in ("valkyries", "biker", "funk", "clarinetpolka"):
            self.assertEqual(build.music_errors({"music": m}), [], m)
        self.assertEqual(build.music_errors({}), [])

    def test_unknown_track_fails(self):
        errs = build.music_errors({"music": "disco"}, "2_courts.txt")
        self.assertEqual(len(errs), 1)
        self.assertIn("disco", errs[0])

    def test_tracks_exist_in_audio_js(self):
        src = (build.SRC / "audio.js").read_text(encoding="utf-8")
        line = next(l for l in src.splitlines() if l.startswith("const SONGS = {"))
        for m in build.MUSIC_TRACKS:
            self.assertIn(m + ":", line, m)


if __name__ == "__main__":
    unittest.main()
