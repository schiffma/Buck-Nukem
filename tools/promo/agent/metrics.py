"""Play-quality metrics from the bridge's per-step log (same rules for every autopilot).

Row: [level, t, dir, why, jumpStart, onGround, x, y, shot, hittable, threat, pickupsLeft, climbing, hits]
  - reversals: the held horizontal direction flips (left <-> right); "quick" when it flips back
    less than 1 s after the previous direction started, unless the new direction's reason is a dodge
  - unneeded jumps: take-off and landing on the same floor row, every floor tile between them is
    walkable (floor below, no wall, no water), no threat nearby and no pickup collected meanwhile
  - shots without a target: a shot fired while no hittable target was in line (the band
    around the gun row: chest height standing, knee height kneeling, where a crayfish on the
    ground is hittable too)
  - hit rate: hero shot hits (enemies + boss face) / shots
"""
DT = 1 / 60
HERO_W, HERO_H, TILE = 10, 28, 16
SOLID, PLATFORM = set("#BRUGDd"), set("=aAT")      # D/d: cover crates
R_LEVEL, R_T, R_DIR, R_WHY, R_JUMP, R_GROUND, R_X, R_Y, R_SHOT, R_HIT, R_THREAT, R_PICK, R_CLIMB, R_HITS = range(14)


class Grid:
    def __init__(self, rows):
        self.rows, self.h, self.w = rows, len(rows), len(rows[0]) if rows else 0

    def at(self, x, y):
        if x < 0 or x >= self.w:
            return "#"
        if y < 0 or y >= self.h:
            return "."
        return self.rows[y][x]

    def solid(self, x, y):
        return self.at(x, y) in SOLID

    def floor(self, x, y):
        c = self.at(x, y)
        return c in SOLID or c in PLATFORM or (c == "H" and self.at(x, y - 1) != "H")


def level_metrics(rows, grid):
    t = len(rows) * DT
    m = {"time": round(t, 1), "reversals": 0, "quick_reversals": 0, "jumps": 0, "unneeded_jumps": 0,
         "shots": 0, "shots_no_target": 0, "hits": 0}
    if not rows:
        return m
    m["hits"] = rows[-1][R_HITS] - rows[0][R_HITS]
    last_dir, last_start = 0, -10 ** 9
    jump = None
    for i, r in enumerate(rows):
        d = r[R_DIR]
        if d:
            if last_dir and d != last_dir:
                m["reversals"] += 1
                if i - last_start < 60 and r[R_WHY] != "dodge":
                    m["quick_reversals"] += 1
            if d != last_dir:
                last_start = i
            last_dir = d
        if r[R_SHOT]:
            m["shots"] += 1
            if not r[R_HIT]:
                m["shots_no_target"] += 1
        if r[R_JUMP]:
            m["jumps"] += 1
            # take-off position: the row before (the jump row is logged after the first rising step)
            prev = rows[i - 1] if i > 0 else r
            jump = (i, r, prev)
        elif jump and r[R_GROUND] and i - jump[0] > 3:
            j0, p0 = jump[1], jump[2]
            same_row = abs(r[R_Y] - p0[R_Y]) < 2
            flat = True
            if grid:
                fy = int((p0[R_Y] + HERO_H) // TILE)
                a = int((min(p0[R_X], r[R_X]) + HERO_W / 2) // TILE)
                b = int((max(p0[R_X], r[R_X]) + HERO_W / 2) // TILE)
                for tx in range(a, b + 1):
                    if not grid.floor(tx, fy) or grid.at(tx, fy - 1) == "~" or grid.solid(tx, fy - 1):
                        flat = False
            if same_row and flat and not j0[R_THREAT] and r[R_PICK] == p0[R_PICK]:
                m["unneeded_jumps"] += 1
            jump = None
    minutes = t / 60
    m["reversals_per_min"] = round(m["reversals"] / minutes, 1) if minutes else 0
    m["quick_reversals_per_min"] = round(m["quick_reversals"] / minutes, 1) if minutes else 0
    m["unneeded_jump_pct"] = round(100 * m["unneeded_jumps"] / m["jumps"], 1) if m["jumps"] else 0.0
    m["no_target_pct"] = round(100 * m["shots_no_target"] / m["shots"], 1) if m["shots"] else 0.0
    m["hit_rate_pct"] = round(100 * m["hits"] / m["shots"], 1) if m["shots"] else 0.0
    return m


def run_metrics(rows, grids):
    """rows: all logged rows; grids: {level index: [row strings]}. Returns {level: metrics, 'total': metrics}."""
    by_level = {}
    for r in rows:
        by_level.setdefault(r[R_LEVEL], []).append(r)
    out = {lv: level_metrics(rs, Grid(grids[lv]) if lv in grids else None) for lv, rs in sorted(by_level.items())}
    # totals: sum counts, recompute rates
    tot = {"time": 0, "reversals": 0, "quick_reversals": 0, "jumps": 0, "unneeded_jumps": 0, "shots": 0, "shots_no_target": 0, "hits": 0}
    for m in out.values():
        for k in tot:
            tot[k] += m[k]
    minutes = tot["time"] / 60
    tot["time"] = round(tot["time"], 1)
    tot["reversals_per_min"] = round(tot["reversals"] / minutes, 1) if minutes else 0
    tot["quick_reversals_per_min"] = round(tot["quick_reversals"] / minutes, 1) if minutes else 0
    tot["unneeded_jump_pct"] = round(100 * tot["unneeded_jumps"] / tot["jumps"], 1) if tot["jumps"] else 0.0
    tot["no_target_pct"] = round(100 * tot["shots_no_target"] / tot["shots"], 1) if tot["shots"] else 0.0
    tot["hit_rate_pct"] = round(100 * tot["hits"] / tot["shots"], 1) if tot["shots"] else 0.0
    out["total"] = tot
    return out


LIMITS = {"reversals_per_min": 20, "quick_reversals_per_min": 3, "unneeded_jump_pct": 2, "no_target_pct": 2}


def failures(total):
    """Spec limits ('Purposeful actions', 'Human-like control') missed by a run's totals."""
    return ["%s %.1f > %s" % (k, total[k], v) for k, v in LIMITS.items() if total[k] > v]


def format_table(res, names=None):
    lines = []
    for lv, m in res.items():
        name = "TOTAL" if lv == "total" else "L%d" % (lv + 1) + (" " + names[lv] if names and lv in names else "")
        lines.append("%-30s %6.1fs  reversals %5.1f/min (quick %4.1f/min)  jumps %3d unneeded %4.1f%%  shots %3d no-target %4.1f%% hit %5.1f%%" % (
            name[:30], m["time"], m["reversals_per_min"], m["quick_reversals_per_min"], m["jumps"], m["unneeded_jump_pct"],
            m["shots"], m["no_target_pct"], m["hit_rate_pct"]))
    return "\n".join(lines)
