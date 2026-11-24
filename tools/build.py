#!/usr/bin/env python3
"""Build Buck Nukem into one self-contained HTML file.

Usage:
    python tools/build.py            # writes dist/buck_nukem.html
    python tools/build.py --debug    # also writes dist/debug_*.png previews

Steps: process the photos in assets/img (crop, resize, colour-reduce),
embed them as base64 PNG data URIs, embed the level maps from
src/levels/*.txt, concatenate src/*.js in a fixed order and inline
everything into src/index.template.html.
"""
import base64
import hashlib
import io
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
IMG = ROOT / "assets" / "img"
DIST = ROOT / "dist"
OUT = DIST / "buck_nukem.html"
MAX_BYTES = 2 * 1024 * 1024

# Concatenation order matters: later files use names defined earlier.
JS_ORDER = [
    "config.js", "assets.js", "render.js", "film.js", "input.js", "touch.js", "font.js",
    "sprites.js", "fx.js", "audio.js", "level.js", "props.js", "player.js", "ride.js",
    "enemies.js", "cars.js", "boss.js", "fans.js", "bar.js", "hud.js", "screens.js", "main.js", "test.js",
]

REQUIRED_IMAGES = [
    "buck_nukem.jpg", "tc_wollerau.jpg", "tc_wollerau_02.jpg",
    "krebsbach_02.jpg", "krebsbach_05.jpg", "krebsbach_06.jpg", "sachs-mofa.jpg",
]

# The mofa's colours (src/ride.js), sampled from the reference photo of the red Sachs mofa:
# name -> box (l, t, r, b) in sachs-mofa.jpg (1024 x 796); the median colour of the box.
MOFA_BOXES = {
    "frame": (560, 420, 760, 460),     # red lower frame panel
    "chrome": (420, 250, 520, 300),    # chrome tank
    "seat": (650, 205, 800, 240),      # black seat
    "engine": (470, 480, 580, 540),    # aluminium engine cover
}

# Backgrounds: name -> (file, crop box (l, t, r, b) or None, size, colours, brightness[, extra saturation])
BACKGROUNDS = {
    "bg_court": ("tc_wollerau.jpg", (0, 180, 1020, 690), (480, 240), 32, 1.0),
    # the ride's four stretches, 640 wide: each pans once across its stretch, unmirrored (hazy aerial photo: more colour)
    "bg_lake": ("tc_wollerau_02.jpg", (0, 0, 640, 240), (640, 240), 32, 1.0, 1.25),        # sky, Lake Zurich and the far shore
    "bg_village": ("tc_wollerau_02.jpg", (130, 60, 640, 251), (640, 240), 32, 1.0, 1.25),  # Wollerau village roofs
    "bg_climb": ("tc_wollerau_02.jpg", (0, 70, 400, 220), (640, 240), 32, 1.0, 1.25),       # hillside fields and farmhouses above the lake
    "bg_club": ("tc_wollerau.jpg", (60, 180, 1020, 540), (640, 240), 32, 1.0),             # the club: courts, dome and hall on the hill
    "bg_creek": ("krebsbach_02.jpg", (0, 120, 1920, 1080), (480, 240), 32, 1.0),
    "bg_hall": ("krebsbach_06.jpg", (0, 0, 1920, 960), (480, 240), 32, 1.0),
    "bg_title": ("tc_wollerau_02.jpg", (0, 0, 640, 480), (320, 240), 32, 1.0),
    "bg_complete": ("krebsbach_05.jpg", (0, 80, 1920, 1520 - 80), (320, 240), 32, 1.0),
}

# Hero head: a hand-made 10x9 pixel template (facing right, three-quarter view) plus
# 3 rows of long hair falling onto the shoulders (10x12 canvas). Every key is coloured
# from a region of buck_nukem.jpg (SAMPLE_BOXES) or a fixed feature colour.
#  H/h hair light/dark  s/S skin light/shadow  g shades frame  l lens  L glint
#  m moustache  d stubble  k mouth  c/C cigar  o ember  . transparent
HEAD_TEMPLATE = [
    "..HHHHHH..",
    ".HHhHHhHH.",
    ".HhhssssSh",
    ".HhgllgLlg",
    ".HhsllslsS",
    ".Hhsmmmmsh",
    ".Hhdmkdmco",
    ".HHdmddm..",
    ".HH.dSSd..",
    ".HH....hH.",
    ".Hh....hH.",
    "..h.....h.",
]
HEAD_ROWS = 9                        # rows 0-8 are the head; 9-11 shoulder hair
# Photo regions (l, t, r, b) and sampling mode: median, or median of the lightest /
# darkest quarter of the pixels (for thin features mixed with other colours).
SAMPLE_BOXES = {
    "hair_light": ((560, 232, 620, 270), "median"),
    "hair_dark": ((735, 420, 770, 520), "median"),
    "skin_light": ((630, 440, 680, 490), "median"),
    "skin_shadow": ((600, 570, 660, 620), "median"),
    "lens": ((470, 345, 520, 385), "median"),
    "moustache": ((605, 480, 625, 530), "light"),
    "jacket": ((390, 650, 450, 720), "median"),
    "shirt": ((520, 700, 600, 750), "median"),
}
FIXED_COLOURS = {"g": (176, 158, 112), "L": (200, 216, 255), "k": (64, 24, 24),
                 "c": (122, 74, 36), "C": (90, 50, 26), "o": (255, 96, 24)}
PORTRAIT_CROP = (330, 170, 930, 770)
PORTRAIT_SIZE = (96, 96)

BAYER4 = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0 - 0.5


def fail(msg):
    print(f"BUILD FAILED: {msg}", file=sys.stderr)
    sys.exit(1)


def ordered_quantize(img, colours, strength=24):
    """Bayer-ordered dither, then reduce to a fixed palette size (VGA look)."""
    arr = np.asarray(img.convert("RGB"), dtype=np.float32)
    h, w, _ = arr.shape
    tile = np.tile(BAYER4, (h // 4 + 1, w // 4 + 1))[:h, :w]
    arr = np.clip(arr + tile[..., None] * strength, 0, 255).astype(np.uint8)
    q = Image.fromarray(arr, "RGB").quantize(colors=colours, method=Image.Quantize.MEDIANCUT,
                                             dither=Image.Dither.NONE)
    return q


def png_bytes(img):
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def data_uri(raw):
    return "data:image/png;base64," + base64.b64encode(raw).decode("ascii")


def load(name):
    path = IMG / name
    return Image.open(path).convert("RGB")


# Grindhouse grade for the photo backdrops: a lurid 70s colour print - boosted
# saturation, warm cast, mild contrast, lifted midtones, brightness close to the
# photo. The runtime film filter adds grain/scratches/vignette on top.
GRADE = {"color": 1.45, "sepia": 0.0, "contrast": 1.1, "warm": (1.07, 1.0, 0.90), "gamma": 0.85}
SEPIA = np.array([[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]])


def source_crop(spec):
    file, crop, size = spec[:3]
    img = load(file)
    if crop:
        img = img.crop(crop)
    return img.resize(size, Image.Resampling.LANCZOS)


def grade(img, bright, color=1.0):
    """color: extra saturation for a pale source photo (multiplies GRADE["color"])."""
    img = ImageEnhance.Color(img).enhance(GRADE["color"] * color)
    arr = np.asarray(img, dtype=np.float32)
    sep = np.clip(arr @ SEPIA.T, 0, 255)
    arr = arr * (1 - GRADE["sepia"]) + sep * GRADE["sepia"]
    arr = np.clip(arr * np.array(GRADE["warm"], dtype=np.float32), 0, 255)
    arr = 255 * (arr / 255) ** GRADE["gamma"]                     # lift the midtones
    img = Image.fromarray(arr.astype(np.uint8), "RGB")
    img = ImageEnhance.Contrast(img).enhance(GRADE["contrast"])
    return ImageEnhance.Brightness(img).enhance(bright)


def image_stats(img):
    """Mean saturation as chroma (max-min)/255, mean brightness (0-255) and mean
    red-minus-blue. Chroma is used instead of HSV saturation, which inflates for
    dark pixels."""
    arr = np.asarray(img.convert("RGB"), dtype=np.float32)
    sat = ((arr.max(axis=2) - arr.min(axis=2)) / 255).mean()
    return float(sat), float(arr.mean()), float((arr[..., 0] - arr[..., 2]).mean())


def make_background(name, spec):
    src = source_crop(spec)
    out = ordered_quantize(grade(src, spec[4], spec[5] if len(spec) > 5 else 1.0), spec[3])
    s0, s1 = image_stats(src), image_stats(out)
    print(f"  grade {name:12s} sat {s0[0]:.2f}->{s1[0]:.2f}  bright {s0[1]:5.1f}->{s1[1]:5.1f}  "
          f"red-blue {s0[2]:+5.1f}->{s1[2]:+5.1f}")
    if not (s1[0] > s0[0] and s1[1] >= 0.9 * s0[1] and s1[2] > s0[2]):
        fail(f"{name}: colour-print grade must raise saturation, keep brightness >= 90% and shift toward warm")
    return out


def sample_mofa(photo):
    """Mofa colours from sachs-mofa.jpg (MOFA_BOXES), as hex, checked for plausibility."""
    pal = {}
    for name, box in MOFA_BOXES.items():
        a = np.asarray(photo.crop(box), dtype=np.float32).reshape(-1, 3)
        pal[name] = tuple(int(v) for v in np.median(a, axis=0))
    fr, ch, se = pal["frame"], pal["chrome"], pal["seat"]
    if not (fr[0] > fr[1] + 60 and fr[0] > fr[2] + 60):
        fail(f"sachs-mofa.jpg: the frame sample {fr} is not red (check MOFA_BOXES)")
    if not (sum(ch) / 3 > 170 and sum(se) / 3 < 90):
        fail(f"sachs-mofa.jpg: chrome {ch} must be bright and the seat {se} dark (check MOFA_BOXES)")
    return {k: "#%02x%02x%02x" % v for k, v in pal.items()}


def sample_palette(photo):
    """Hero colours sampled from the photo (see SAMPLE_BOXES)."""
    pal = {}
    for name, (box, mode) in SAMPLE_BOXES.items():
        a = np.asarray(photo.crop(box), dtype=np.float32).reshape(-1, 3)
        if mode != "median":
            lum = a.mean(axis=1)
            q = np.percentile(lum, 75 if mode == "light" else 25)
            a = a[lum >= q] if mode == "light" else a[lum <= q]
        pal[name] = tuple(int(v) for v in np.median(a, axis=0))
    # the moustache is white-grey in the photo: pull the sample halfway to neutral
    m = pal["moustache"]; g = sum(m) // 3
    pal["moustache"] = tuple((c + g) // 2 for c in m)
    pal["stubble"] = tuple((a + b) // 2 for a, b in zip(pal["skin_shadow"], pal["hair_dark"]))

    def lum(c): return sum(c) / 3
    checks = [
        (lum(pal["hair_light"]) > lum(pal["jacket"]) + 40, "hair must be lighter than the jacket"),
        (pal["skin_light"][0] - pal["skin_light"][2] > pal["lens"][0] - pal["lens"][2] + 30, "skin must be warmer than the lens"),
        (lum(pal["moustache"]) > lum(pal["skin_light"]), "moustache must be lighter than the skin"),
    ]
    for ok, msg in checks:
        if not ok:
            fail(f"hero palette sanity check: {msg} ({pal})")
    return pal


def make_head(pal):
    """10x12 hero head from HEAD_TEMPLATE, coloured with the sampled palette."""
    keymap = {"H": pal["hair_light"], "h": pal["hair_dark"], "s": pal["skin_light"], "S": pal["skin_shadow"],
              "l": pal["lens"], "m": pal["moustache"], "d": pal["stubble"]}
    keymap.update(FIXED_COLOURS)
    w, h = len(HEAD_TEMPLATE[0]), len(HEAD_TEMPLATE)
    head = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = head.load()
    for y, row in enumerate(HEAD_TEMPLATE):
        if len(row) != w:
            fail(f"HEAD_TEMPLATE row {y} has width {len(row)}, expected {w}")
        for x, ch in enumerate(row):
            if ch == ".":
                continue
            if ch not in keymap:
                fail(f"HEAD_TEMPLATE row {y}: unknown key {ch!r}")
            px[x, y] = keymap[ch] + (255,)
    return head


def make_hero_compare(photo, head, pal):
    """Debug image: photo face crop | head at 8x | palette swatches."""
    face = photo.crop((440, 190, 800, 620)).resize((180, 215), Image.Resampling.LANCZOS)
    big = head.resize((head.width * 8, head.height * 8), Image.Resampling.NEAREST)
    out = Image.new("RGB", (180 + 20 + big.width + 20 + 60, max(215, big.height)), (40, 40, 60))
    out.paste(face, (0, 0))
    out.paste(big, (200, 0), big)
    d = ImageDraw.Draw(out)
    for i, (name, c) in enumerate(pal.items()):
        d.rectangle([200 + big.width + 20, i * 22, 200 + big.width + 70, i * 22 + 18], fill=c)
    return out


def make_portrait():
    src = load("buck_nukem.jpg").crop(PORTRAIT_CROP)
    src = ImageEnhance.Contrast(src).enhance(1.2)
    src = ImageEnhance.Color(src).enhance(1.2)
    small = src.resize(PORTRAIT_SIZE, Image.Resampling.LANCZOS)
    return ordered_quantize(small, 16, strength=16)


def parse_level(path):
    """Level file: 'key: value' header lines, then map segments separated by '---'.
    Segments are joined side by side; every segment must have the same row count."""
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    parts = text.split("\n---\n")
    header, segs = parts[0], parts[1:]
    meta = {}
    for line in header.strip().split("\n"):
        if ":" in line and not line.startswith(";"):
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    if not segs:
        fail(f"{path.name}: no map segments")
    rows = None
    for i, seg in enumerate(segs):
        lines = [l for l in seg.strip("\n").split("\n") if l.strip() != "" and not l.startswith(";")]
        width = len(lines[0])
        for j, l in enumerate(lines):
            if len(l) != width:
                fail(f"{path.name}: segment {i + 1} row {j + 1} has width {len(l)}, expected {width}")
        if rows is None:
            rows = lines
        else:
            if len(lines) != len(rows):
                fail(f"{path.name}: segment {i + 1} has {len(lines)} rows, expected {len(rows)}")
            rows = [a + b for a, b in zip(rows, lines)]
    meta["map"] = rows
    return meta


# Multi-tile clubhouse props (width, height in tiles), anchored at their top-left cell.
# Must match PROP_DEFS in src/props.js.
PROP_SIZES = {"N": (2, 1), "Z": (2, 2), "m": (6, 2), "k": (3, 2), "y": (1, 2), "Y": (4, 2),
              "Q": (2, 3), "@": (2, 1), "V": (2, 1), "z": (2, 1), "[": (5, 2), "J": (2, 1), "&": (1, 2), "^": (2, 2),
              "I": (4, 1)}


def prop_overlaps(meta, name="level"):
    """Warnings for multi-tile props whose footprint covers a non-empty cell."""
    rows = meta["map"]
    warnings = []
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch not in PROP_SIZES:
                continue
            w, h = PROP_SIZES[ch]
            for dy in range(h):
                for dx in range(w):
                    if dx == 0 and dy == 0:
                        continue
                    yy, xx = y + dy, x + dx
                    if yy >= len(rows) or xx >= len(row):
                        warnings.append(f"{name}: prop '{ch}' at {x},{y} extends outside the map")
                    elif rows[yy][xx] != ".":
                        warnings.append(f"{name}: prop '{ch}' at {x},{y} overlaps '{rows[yy][xx]}' at {xx},{yy}")
    # cheering fans (F; ride: e activists, ] rockers) must stand on solid ground or a one-way platform
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in "Fe]" and (y + 1 >= len(rows) or rows[y + 1][x] not in "#B=aAT"):
                warnings.append(f"{name}: fan 'F' at {x},{y} has no floor below")
    return warnings


MUSIC_TRACKS = {"valkyries", "biker", "funk", "clarinetpolka"}   # SONGS in src/audio.js a level may name ("title" is the title screen's)


def music_errors(meta, name="level"):
    """Errors for a level's music header: the track must exist."""
    m = meta.get("music")
    if m is not None and m not in MUSIC_TRACKS:
        return [f"{name}: unknown music track {m!r} (known: {', '.join(sorted(MUSIC_TRACKS))})"]
    return []


# Buck's quote packs (src/quotes/<pack>.txt): [start], [kill], [kill:<enemy type>] sections,
# one quote per line, at most QUOTE_MAX characters, drawable with the game font.
ENEMY_TYPES = {"lawyer", "cray", "punk", "suv", "tesla", "ferrari", "limo"}   # ENEMY_TYPES in src/enemies.js and src/cars.js
QUOTE_MAX = 20


def font_chars():
    """The characters the game font can draw (the keys of GLYPHS in src/font.js)."""
    src = (SRC / "font.js").read_text(encoding="utf-8")
    body = src[src.index("const GLYPHS = {"):src.index("};", src.index("const GLYPHS = {"))]
    keys = set(re.findall(r'"(.)"\s*:', body)) | set(re.findall(r"(?<![\w\"])([A-Z0-9])\s*:", body))
    return keys


def parse_quote_pack(path, chars):
    """-> ({section: [lines]}, [errors as "file:line: reason"])"""
    pack, errors, section = {}, [], None
    for n, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith(";"):
            continue
        where = f"{path.name}:{n}"
        m = re.fullmatch(r"\[(\w+)(?::(\w+))?\]", line)
        if m:
            kind, enemy = m.group(1), m.group(2)
            if kind == "start" and enemy is None:
                section = "start"
            elif kind == "kill" and (enemy is None or enemy in ENEMY_TYPES):
                section = "kill" if enemy is None else "kill:" + enemy
            else:
                errors.append(f"{where}: unknown section {line} (known: [start], [kill], [kill:<{'|'.join(sorted(ENEMY_TYPES))}>])")
                section = None
                continue
            pack.setdefault(section, [])
            continue
        if section is None:
            errors.append(f"{where}: quote outside a section: {line!r}")
            continue
        q = line.upper()
        if len(q) > QUOTE_MAX:
            errors.append(f"{where}: quote longer than {QUOTE_MAX} characters: {line!r}")
        bad = sorted({c for c in q if c not in chars})
        if bad:
            errors.append(f"{where}: the game font cannot draw {''.join(bad)!r} in {line!r}")
        if q in pack[section]:
            errors.append(f"{where}: duplicate quote in [{section}]: {line!r}")
        pack[section].append(q)
    return pack, errors


def load_quote_packs():
    chars, packs, errors = font_chars(), {}, []
    for f in sorted((SRC / "quotes").glob("*.txt")):
        pack, errs = parse_quote_pack(f, chars)
        packs[f.stem] = pack
        errors += errs
    if errors:
        fail("quote packs: " + "; ".join(errors))
    return packs


def quote_header_errors(meta, packs, name="level"):
    q = meta.get("quotes")
    if q is not None and q not in packs:
        return [f"{name}: unknown quote pack {q!r} (src/quotes/{q}.txt is missing)"]
    return []


def ride_map_errors(meta, name="level"):
    """Errors for a ride map: no weapon pickups (the mofa has its gun) and no Rivella/Cervelat
    (its health pickup is the WD-40 can '{')."""
    if meta.get("ride") != "1":
        return []
    errors = []
    for ch, why in (("w", "weapon pickups ('w'): the mofa has its machine gun"),
                    ("h", "Rivella ('h'): the ride's health pickup is the WD-40 can '{'"),
                    ("s", "Cervelat ('s'): the ride's health pickup is the WD-40 can '{'")):
        if any(ch in row for row in meta["map"]):
            errors.append(f"{name}: a ride level must not contain {why}")
    return errors


def load_levels(packs=None):
    files = sorted((SRC / "levels").glob("*.txt"))
    if not files:
        fail("no level files in src/levels")
    levels = []
    for f in files:
        meta = parse_level(f)
        errors = ride_map_errors(meta, f.name) + music_errors(meta, f.name) + quote_header_errors(meta, packs or {}, f.name)
        if errors:
            fail("; ".join(errors))
        for w in prop_overlaps(meta, f.name):
            print("WARNING: " + w)
        levels.append(meta)
    return levels


def build_version():
    """Version text for the title screen, git-describe style, ignoring dist/ (the build output
    itself): "v1.0.2" on the tagged release (also after committing the rebuilt dist/ on top),
    "v1.0.2-3-gab12cd3" for later commits, "-dirty" for uncommitted changes outside dist/.
    Falls back to "v" + VERSION when git or the tags are not available."""
    fallback = "v" + (ROOT / "VERSION").read_text(encoding="utf-8").strip()

    def git(*args):
        return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True,
                              check=True, timeout=20).stdout.strip()
    try:
        tag = git("describe", "--tags", "--match", "v*", "--abbrev=0")
        outside = [".", ":(exclude)dist"]
        n = int(git("rev-list", "--count", f"{tag}..HEAD", "--", *outside))
        dirty = git("status", "--porcelain", "--", *outside) != ""
    except (OSError, subprocess.SubprocessError, ValueError):
        print(f"Version: git not available, using VERSION ({fallback})")
        return fallback
    base = tag if n == 0 else f"{tag}-{n}-g{git('rev-parse', '--short=7', 'HEAD')}"
    return base + ("-dirty" if dirty else "")


def main():
    debug = "--debug" in sys.argv
    missing = [n for n in REQUIRED_IMAGES if not (IMG / n).is_file()]
    if missing:
        fail("missing required image(s): " + ", ".join(str(IMG / m) for m in missing))
    missing_js = [n for n in JS_ORDER if not (SRC / n).is_file()]
    if missing_js:
        fail("missing source file(s): " + ", ".join(missing_js))

    DIST.mkdir(exist_ok=True)
    assets = {}
    sizes = []

    def add(name, img):
        raw = png_bytes(img)
        assets[name] = data_uri(raw)
        sizes.append((name, img.size, len(raw)))
        if debug:
            scale = 8 if img.size[0] <= 16 else (3 if img.size[0] <= 96 else 2)
            img.convert("RGBA").resize((img.size[0] * scale, img.size[1] * scale),
                                       Image.Resampling.NEAREST).save(DIST / f"debug_{name}.png")

    print("Background grade (source -> processed):")
    for name, spec in BACKGROUNDS.items():
        add(name, make_background(name, spec))
    photo = load("buck_nukem.jpg")
    hero_pal = sample_palette(photo)
    head = make_head(hero_pal)
    add("head", head)
    if debug:
        make_hero_compare(photo, head, hero_pal).save(DIST / "debug_hero_compare.png")
    print("Hero palette: " + ", ".join(f"{k}={v}" for k, v in hero_pal.items()))
    add("portrait", make_portrait())
    mofa_pal = sample_mofa(load("sachs-mofa.jpg"))
    print("Mofa palette: " + ", ".join(f"{k}={v}" for k, v in mofa_pal.items()))

    packs = load_quote_packs()
    levels = load_levels(packs)
    print(f"Quote packs: {', '.join(f'{k} ({sum(len(v) for v in p.values())})' for k, p in packs.items()) or '-'}")
    version = build_version()
    print(f"Version: {version}")
    script = "\n".join(f"// ---- {n} ----\n" + (SRC / n).read_text(encoding="utf-8") for n in JS_ORDER)
    template = (SRC / "index.template.html").read_text(encoding="utf-8")
    html = (template
            .replace("{{ASSETS}}", json.dumps(assets, indent=0))
            .replace("{{LEVELS}}", json.dumps(levels, indent=0))
            .replace("{{QUOTES}}", json.dumps(packs, indent=0))
            .replace("{{META}}", json.dumps({"heroPalette": hero_pal, "heroHeadRows": HEAD_ROWS, "heroFixed": FIXED_COLOURS,
                                             "mofaPalette": mofa_pal, "version": version}))
            .replace("{{SCRIPT}}", script))
    data = html.encode("utf-8")
    OUT.write_bytes(data)

    print("Assets:")
    for name, (w, h), n in sizes:
        print(f"  {name:12s} {w:4d}x{h:<4d} {n / 1024:7.1f} KB")
    print(f"Levels: {len(levels)} ({', '.join(l.get('name', '?') for l in levels)})")
    print(f"Output: {OUT}  {len(data) / 1024:.1f} KB  sha256={hashlib.sha256(data).hexdigest()[:16]}")
    if len(data) > MAX_BYTES:
        fail(f"output is {len(data)} bytes, limit is {MAX_BYTES} bytes (2 MB)")


if __name__ == "__main__":
    main()
