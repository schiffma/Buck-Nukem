#!/usr/bin/env python3
"""Static completability check for the level maps in src/levels/*.txt.

Breadth-first search over the hero's standing positions using conservative jump
limits derived from the physics in src/config.js (jump height ~54 px = 3 tiles,
horizontal reach ~63 px = 4 tiles on a flat jump). Doors only open once the
matching key is reachable. Reports, per level: whether the exit (or the boss)
can be reached, which keys were collected, and pickups that cannot be reached.
Ride levels (ride: 1, the mofa) are checked differently: a continuous road to the
exit, every group of hazards clearable with one mofa hop, pickups within hop
height or a ramp's flight, a checkpoint and 8-10 fans (see analyse_ride).
Exit code 1 if any level cannot be completed.
"""
import re
import sys
from collections import deque
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build import SRC, parse_level  # noqa: E402

SOLID = set("#BDd")                  # crates count as solid (breakable ones may never be broken)
DOORS = {"R": "r", "U": "u", "G": "g"}       # door -> key
MAX_DX = {0: 4, 1: 3, 2: 3, 3: 2}            # max horizontal tiles for a jump rising h tiles
ONE_WAY = set("=aAT")                         # one-way platforms (shelves, bar counter, tables)
PICKUPS = set("ot hs+wrug{".replace(" ", ""))


def analyse(meta):
    rows = [list(r) for r in meta["map"]]
    H, W = len(rows), len(rows[0])
    items = {}
    start = exit_ = boss = None
    for y in range(H):
        for x in range(W):
            c = rows[y][x]
            if c == "P":
                start = (x, y)
            elif c == "E":
                exit_ = (x, y)
            elif c == "X":
                boss = (x, y)
            if c in PICKUPS:
                items[(x, y)] = c
            if c in "PLKMXortuhsg+wCE":
                l = rows[y][x - 1] if x > 0 else "#"
                r = rows[y][x + 1] if x + 1 < W else "#"
                rows[y][x] = "~" if c == "K" and "~" in (l, r) else "."

    def at(x, y):
        if x < 0 or x >= W:
            return "#"
        if y < 0 or y >= H:
            return "."
        return rows[y][x]

    def solid(x, y, keys):
        c = at(x, y)
        return c in SOLID or (c in DOORS and DOORS[c] not in keys)

    def ladder(x, y):
        return at(x, y) == "H"

    def floor(x, y, keys):  # can stand on top of tile (x, y)
        return solid(x, y, keys) or at(x, y) in ONE_WAY or (ladder(x, y) and not ladder(x, y - 1))

    def free(x, y, keys):   # hero body (rows y-1, y) fits in column x
        return not solid(x, y, keys) and not solid(x, y - 1, keys)

    passed = set()   # cells crossed mid-air (pickups there are collected on the way)

    def fall(x, y, keys):
        """Drop from feet row y until landing; None if into water or out of the map."""
        while y < H + 2:
            passed.add((x, y))
            if at(x, y) == "~":
                return None
            if floor(x, y + 1, keys):
                return (x, y)
            if ladder(x, y):
                return (x, y)
            if solid(x, y + 1, keys):
                return (x, y)
            y += 1
        return None

    def neighbours(pos, keys):
        x, y = pos
        out = []
        on_ladder = ladder(x, y) or ladder(x, y - 1)
        # walk / step off ledges
        for dx in (-1, 1):
            if free(x + dx, y, keys):
                p = fall(x + dx, y, keys)
                if p:
                    out.append(p)
        # ladders
        if on_ladder:
            if ladder(x, y - 1) or ladder(x, y):
                if free(x, y - 1, keys) or ladder(x, y - 1):
                    out.append((x, y - 1))
            if ladder(x, y + 1) or ladder(x, y):
                if not solid(x, y + 1, keys):
                    out.append((x, y + 1))
        if ladder(x, y + 1):          # standing on a ladder top: climb down
            out.append((x, y + 1))
        # jumps (only from solid footing or a ladder)
        if floor(x, y + 1, keys) or on_ladder:
            for h in range(0, 4):
                clear = all(free(x, y - k, keys) for k in range(0, h + 1))
                if not clear:
                    break
                ay = y - h               # apex feet row
                if h > 0:                # straight up, e.g. through a one-way platform
                    p = fall(x, ay, keys)
                    if p and p != (x, y):
                        out.append(p)
                for d in (-1, 1):
                    for dx in range(1, MAX_DX[h] + 1):
                        tx = x + d * dx
                        if not free(tx, ay, keys):
                            break
                        p = fall(tx, ay, keys)
                        if p:
                            out.append(p)
        return out

    def search(keys):
        seen = set()
        q = deque([start])
        seen.add(start)
        while q:
            p = q.popleft()
            for n in neighbours(p, keys):
                if n not in seen and 0 <= n[0] < W and -2 <= n[1] < H:
                    seen.add(n)
                    q.append(n)
        return seen

    def touched(seen):
        got = set()
        for (x, y) in seen:
            for yy in (y, y - 1):
                if (x, yy) in items:
                    got.add((x, yy))
        return got

    keys = frozenset()
    while True:
        seen = search(keys)
        got = touched(seen | passed)
        new_keys = keys | {items[g] for g in got if items[g] in "rug"}
        if new_keys == keys:
            break
        keys = frozenset(new_keys)
    goal = exit_ or boss
    reached = any((x == goal[0] and y in (goal[1], goal[1] + 1)) for (x, y) in seen) if goal else False
    missing = sorted((p, items[p]) for p in items if p not in got)
    return reached, sorted(keys), missing, len(seen), (W, H)


# ---------------- the mofa ride (ride: 1) ----------------
# The mofa never leaves the road: it hops (fixed hop) and flies off ramps. The road has no
# obstacles of its own; the constants come from src/config.js, so the check follows the game's tuning.
TILE = 16


def ride_physics():
    import re
    cfg = (SRC / "config.js").read_text(encoding="utf-8")

    def num(name):
        m = re.search(r"\b" + name + r":\s*(-?[\d.]+)", cfg)
        if not m:
            raise SystemExit(f"check_levels: {name} not found in src/config.js")
        return float(m.group(1))
    g, top, hop = num("gravity"), num("mofaTop"), -num("mofaHopVel")
    ramp, rg, mw, mh = -num("mofaRampVel"), num("mofaRampGrav"), num("mofaW"), num("mofaH")
    hop_t = 2 * hop / g
    ramp_g = g * rg
    ramp_t = (ramp + (ramp * ramp + 2 * ramp_g * 12) ** 0.5) / ramp_g       # from the 12 px ramp top down to the road
    return {"hop_h": hop * hop / (2 * g), "hop_reach": top * hop_t, "ramp_h": ramp * ramp / (2 * ramp_g) + 12,
            "ramp_reach": top * ramp_t, "mofa_w": mw, "mofa_h": mh}


def road_profile(meta, rows):
    """The ride's road: per-column top row of the floor, and road_top(x px) as the game computes it
    (src/level.js roadTop: the stepped floor, smooth on the `climb: x0-x1 r0-r1` header's columns)."""
    H, W = len(rows), len(rows[0])
    col_top = []
    for x in range(W):
        top = H
        for y in range(H):
            if rows[y][x] in SOLID:
                top = y
                break
        col_top.append(top)
    m = re.match(r"^(\d+)-(\d+)\s+(\d+)-(\d+)$", (meta.get("climb") or "").strip())
    climb = (int(m[1]) * TILE, (int(m[2]) + 1) * TILE, int(m[3]) * TILE, int(m[4]) * TILE) if m else None

    def road_top(xp):
        if climb and climb[0] <= xp <= climb[1]:
            t = (xp - climb[0]) / (climb[1] - climb[0])
            return climb[2] + (climb[3] - climb[2]) * t * t * (3 - 2 * t)
        return col_top[min(W - 1, max(0, int(xp // TILE)))] * TILE
    return col_top, climb, road_top


def analyse_ride(meta):
    """Returns (ok, problems, info, unreachable) for a ride level."""
    P = ride_physics()
    rows = [list(r) for r in meta["map"]]
    H, W = len(rows), len(rows[0])
    problems = []
    find = lambda ch: [(x, y) for y in range(H) for x in range(W) if rows[y][x] == ch]
    start, exits = find("P"), find("E")
    if not start or not exits:
        return False, ["no start P or exit E"], "", []
    (sx, sy), (ex, ey) = start[0], exits[0]
    col_top, climb, road_top = road_profile(meta, rows)
    for name, (x, y) in (("start P", (sx, sy)), ("exit E", (ex, ey))):
        if y != col_top[x] - 1:
            problems.append(f"{name} at {x},{y} is not in the cell above the road (road top row {col_top[x]})")
    # a continuous road: no holes, no steps outside the climb; on the climb the stepped floor stays
    # within one tile below the smooth road (the drawing fills the wedge)
    for x in range(sx, ex + 1):
        if col_top[x] >= H:
            problems.append(f"road hole at column {x}")
            continue
        xp0, xp1 = x * TILE, (x + 1) * TILE
        on_climb = climb and climb[0] - TILE < xp1 and xp0 < climb[1] + TILE
        if on_climb:
            line = min(road_top(xp0), road_top(xp1 - 1))
            if not (line <= col_top[x] * TILE < line + TILE):
                problems.append(f"climb column {x}: floor row {col_top[x]} not within a tile below the road ({line:.0f} px)")
        elif x > sx and col_top[x] != col_top[x - 1]:
            problems.append(f"road step at column {x} outside the climb")
    rise = 0
    if climb:
        rise = (climb[2] - climb[3]) / TILE
        if rise < 6:
            problems.append(f"the climb rises only {rise:.1f} tiles (6 wanted)")
        if climb[0] < W * TILE * 2 / 3 - 8 * TILE:
            problems.append("the climb starts before the last third")
    # pickups: within hop height above the local road, or in a ramp's flight window
    ramps = [x * TILE + 2 * TILE for x in range(W) if col_top[x] < H and rows[col_top[x] - 1][x] == "/"]
    unreachable = []
    for y in range(H):
        for x in range(W):
            c = rows[y][x]
            if c not in PICKUPS:
                continue
            cx = x * TILE + TILE / 2
            shift = road_top(cx) - col_top[x] * TILE               # the game puts pickups on the smooth road
            need = road_top(cx) - ((y + 1) * TILE - 2 + shift) - P["mofa_h"]   # how high the mofa's box must rise
            if need <= P["hop_h"]:
                continue
            if any(r <= cx <= r + P["ramp_reach"] for r in ramps) and need <= P["ramp_h"]:
                continue
            unreachable.append(((x, y), c))
    nc = len(find("C"))
    if nc < 2:
        problems.append(f"{nc} checkpoints (at least 2 wanted)")
    nf = len(find("F")) + len(find("e")) + len(find("]"))
    if not 8 <= nf <= 10:
        problems.append(f"{nf} fans (8-10 wanted)")
    info = (f"hop {P['hop_h']:.0f} px high / {P['hop_reach']:.0f} px far, ramp {P['ramp_h']:.0f} / {P['ramp_reach']:.0f} px, "
            f"climb {rise:.0f} tiles, {nc} checkpoints, {len(ramps)} ramps")
    return not problems, problems, info, unreachable


def main():
    ok = True
    for f in sorted((SRC / "levels").glob("*.txt")):
        meta = parse_level(f)
        if meta.get("ride") == "1":
            good, problems, info, missing = analyse_ride(meta)
            ok &= good
            print(f"{'OK  ' if good else 'FAIL'} {f.name:18s} {len(meta['map'][0])}x{len(meta['map'])}  ride: {info}")
            for pr in problems:
                print("      " + pr)
            if missing:
                print("      unreachable pickups: " + ", ".join(f"{c}@{x},{y}" for (x, y), c in missing))
            continue
        reached, keys, missing, n, size = analyse(meta)
        goal = "boss" if meta.get("boss") == "1" else "exit"
        status = "OK  " if reached else "FAIL"
        ok &= reached
        print(f"{status} {f.name:18s} {size[0]}x{size[1]}  {goal} reachable={reached}  keys={''.join(keys) or '-'}  "
              f"positions={n}")
        if missing:
            print("      unreachable pickups: " + ", ".join(f"{c}@{x},{y}" for (x, y), c in missing))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
