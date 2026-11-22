#!/usr/bin/env python3
"""Static completability check for the level maps in src/levels/*.txt.

Breadth-first search over the hero's standing positions using conservative jump
limits derived from the physics in src/config.js (jump height ~54 px = 3 tiles,
horizontal reach ~63 px = 4 tiles on a flat jump). Doors only open once the
matching key is reachable. Reports, per level: whether the exit (or the boss)
can be reached, which keys were collected, and pickups that cannot be reached.
Exit code 1 if any level cannot be completed.
"""
import sys
from collections import deque
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build import SRC, parse_level  # noqa: E402

SOLID = set("#BDd")                  # crates count as solid (breakable ones may never be broken)
DOORS = {"R": "r", "U": "u", "G": "g"}       # door -> key
MAX_DX = {0: 4, 1: 3, 2: 3, 3: 2}            # max horizontal tiles for a jump rising h tiles
ONE_WAY = set("=aAT")                         # one-way platforms (shelves, bar counter, tables)
PICKUPS = set("ot hs+wrug".replace(" ", ""))


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


def main():
    ok = True
    for f in sorted((SRC / "levels").glob("*.txt")):
        meta = parse_level(f)
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
