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


class QuotePacks(unittest.TestCase):
    def parse(self, text):
        import tempfile
        d = Path(tempfile.mkdtemp())
        f = d / "test.txt"
        f.write_text(text, encoding="utf-8")
        return build.parse_quote_pack(f, build.font_chars())

    def test_sections_and_comments(self):
        pack, errs = self.parse("; a comment\n[start]\nHOPP!\n\n[kill]\nSO, FERTIG.\n[kill:suv]\nGÄLL.\n")
        self.assertEqual(errs, [])
        self.assertEqual(pack, {"start": ["HOPP!"], "kill": ["SO, FERTIG."], "kill:suv": ["GÄLL."]})

    def test_lower_case_is_upper_cased(self):
        pack, errs = self.parse("[kill]\nso, fertig.\n")
        self.assertEqual(errs, [])
        self.assertEqual(pack["kill"], ["SO, FERTIG."])

    def test_errors(self):
        cases = {
            "OUTSIDE\n": "outside a section",
            "[hurt]\nX\n": "unknown section",
            "[kill:dragon]\nX\n": "unknown section",
            "[kill]\nTHIS LINE IS FAR TOO LONG\n": "longer than 20",
            "[kill]\nNO ~ TILDE\n": "cannot draw",
            "[kill]\nSO.\nSO.\n": "duplicate",
        }
        for text, why in cases.items():
            _, errs = self.parse(text)
            self.assertTrue(errs and why in errs[0] and "test.txt:" in errs[0], (text, errs))

    def test_font_has_umlauts(self):
        self.assertTrue({"Ä", "Ö", "Ü", "A", "0", "!", "?"} <= build.font_chars())

    def test_level_header(self):
        self.assertEqual(build.quote_header_errors({"quotes": "ride"}, {"ride": {}}), [])
        self.assertEqual(build.quote_header_errors({}, {}), [])
        errs = build.quote_header_errors({"quotes": "nope"}, {"ride": {}}, "2_courts.txt")
        self.assertTrue(errs and "nope" in errs[0])

    def test_enemy_types_match_the_game(self):
        import re
        src = (build.SRC / "enemies.js").read_text(encoding="utf-8")
        body = src[src.index("const ENEMY_TYPES = {"):]
        on_foot = set(re.findall(r"^  (\w+): \{$", body[:body.index("\n};")], re.M))
        cars = set(re.findall(r'"(\w+)"', re.search(r"\[([^\]]*)\]\.forEach\(function \(k\) \{\s*ENEMY_TYPES\[k\]", (build.SRC / "cars.js").read_text(encoding="utf-8")).group(1)))
        self.assertEqual(build.ENEMY_TYPES, on_foot | cars)

    def test_shipped_packs_pass(self):
        packs = build.load_quote_packs()
        self.assertIn("ride", packs)
        self.assertGreaterEqual(len(packs["ride"]["kill"]), 12)


if __name__ == "__main__":
    unittest.main()
