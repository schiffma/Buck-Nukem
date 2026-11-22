"""Whole-level route planning: in which order to collect every pickup, then reach the exit.

The tour is planned in key stages: with the keys held, everything reachable is ordered as a
tour (nearest neighbour, then 2-opt and or-opt on the real travel times from the nav graph);
key cards picked up in that stage open doors, and the next stage plans what became reachable.
So a key always comes before its door, and the hero never wanders back and forth between goals.
An item is collected by standing on its cell (or the one below) or, for items floating in a
shaft, by dropping through it along a specific move ("via" edge).
The plan is only recomputed on events (death, a door opened, a stuck move), never per frame.
"""
import itertools

from .nav import Nav, TILE, pickup_nodes

KEY_TYPES = {"r": "r", "u": "u", "g": "g"}

# What a stop is worth, in seconds of the level-end time bonus (10 points per second left):
# a detour is only made when it pays. Keys, the Mega Blaster and extra lives are always taken;
# L/M are kill stops (lawyer 200, punk 500 points, minus the time the fight takes).
INF = float("inf")
VALUE_S = {"o": 5.0, "t": 100.0, "h": 20.0, "s": 30.0, "+": INF, "w": INF,
           "r": INF, "u": INF, "g": INF, "L": 16.0, "M": 44.0}


def item_value(it):
    return VALUE_S.get(it.kind, INF)


class Item:
    def __init__(self, iid, kind, x, y, w, h):
        self.id, self.kind, self.box = iid, kind, (x, y, w, h)
        tx, ty = int((x + w / 2) // TILE), int((y + h / 2) // TILE)
        self.cells = {(tx, ty), (tx, ty + 1)}

    def __repr__(self):
        return "Item(%s %s@%s)" % (self.id, self.kind, sorted(self.cells)[0])


def targets(nav, item, reach):
    """Ways to collect an item: [(approach node, via move or None, node afterwards, extra cost)]."""
    out = []
    for n in pickup_nodes(*item.box):
        if n in reach:
            out.append((n, None, n, 0.0))
    if out:
        return out
    for n in reach:                       # floating in a shaft: drop through it
        for e in nav.neighbours(*n):
            if e["type"] in ("drop", "walk") and item.cells & set(e.get("cells", [])) and e["to"] in reach:
                out.append((n, dict(e, **{"from": n}), e["to"], Nav.cost(n, e)))
    return out


class Planner:
    def __init__(self, rows, keys=()):
        self.rows = rows
        self.navs = {}
        self.base_keys = frozenset(k.lower() for k in keys)

    def nav(self, keys):
        k = frozenset(keys)
        if k not in self.navs:
            self.navs[k] = Nav(self.rows, k)
        return self.navs[k]

    def plan(self, start, items, exit_nodes=None, value=None):
        """Returns the tour: list of dicts {item, node, via, end, keys, cost}; the exit last (item None).
        With value (item -> seconds), stops whose detour costs more time than they are worth are
        dropped (prize-collecting: remove the worst stop, repeat), then the rest is re-ordered."""
        self.skipped = []
        tour = self._plan(start, items, exit_nodes)
        if value is None or not exit_nodes:
            return tour
        items = list(items)
        while True:
            worst, worst_net = None, 0.0
            for i, st in enumerate(tour):
                if st["item"] is None:
                    continue
                v = sum(value(it) for it in st["items"])
                if v == INF:
                    continue
                prev = tour[i - 1]["end"] if i else start
                nxt = tour[i + 1] if i + 1 < len(tour) else None
                saved = st["cost"] + (nxt["cost"] if nxt else 0.0)
                if nxt:
                    saved -= self.leg_cost(prev, dict(nxt, keys=st["keys"] | nxt["keys"]))
                if saved - v > worst_net:
                    worst, worst_net = st, saved - v
            if worst is None:
                break
            self.skipped += worst["items"]
            items = [it for it in items if it not in worst["items"]]
            tour = self._plan(start, items, exit_nodes)
        return tour

    def _plan(self, start, items, exit_nodes=None):
        keys = set(self.base_keys)
        pos, todo, tour = start, list(items), []
        while True:
            nav = self.nav(keys)
            reach = nav.reachable(pos)
            stage, by_drop = [], {}
            for it in todo:
                t = targets(nav, it, reach)
                if not t:
                    continue
                if all(x[1] for x in t):            # only collectable by dropping through: one stop per drop
                    key = tuple(sorted((x[0], x[2]) for x in t))
                    if key in by_drop:
                        by_drop[key][0].append(it)
                        continue
                    by_drop[key] = ([it], t)
                    stage.append(by_drop[key])
                else:
                    stage.append(([it], t))
            if not stage:
                break
            order = self.order(nav, pos, stage)
            done = set()
            for group, (node, via, end, extra) in order:
                tour.append({"item": group[0], "items": group, "node": node, "via": via, "end": end, "keys": frozenset(keys)})
                pos = end
                for it in group:
                    done.add(it)
                    if it.kind in KEY_TYPES:
                        keys.add(KEY_TYPES[it.kind])
            todo = [it for it in todo if it not in done]
            if not any(it.kind in KEY_TYPES for it in done):
                break                      # no new key: nothing new can become reachable
        if exit_nodes:
            nav = self.nav(keys)
            d = nav.distances(pos)
            best = min((d.get(n, float("inf")), n) for n in exit_nodes)
            if best[0] < float("inf"):
                tour.append({"item": None, "items": [], "node": best[1], "via": None, "end": best[1], "keys": frozenset(keys)})
        self.unreached = todo
        for i, step in enumerate(tour):
            step["cost"] = self.leg_cost(tour[i - 1]["end"] if i else start, step)
        return tour

    def leg_cost(self, frm, step):
        nav = self.nav(step["keys"])
        c = nav.distances(frm).get(step["node"], float("inf"))
        if step["via"]:
            c += Nav.cost(step["node"], step["via"])
        return c

    # ---- tour optimisation for one key stage ----
    def order(self, nav, start, stage):
        """stage: [([items], [targets])]. Picks the best target per stop and an order minimising travel time."""
        n = len(stage)

        def dist(a, b):
            return nav.distances(a).get(b, float("inf"))

        # cost of going from a position to item j (best target), and where you end up
        def leg(frm, j):
            best = None
            for t in stage[j][1]:
                c = dist(frm, t[0]) + t[3]
                if best is None or c < best[0]:
                    best = (c, t)
            return best

        def tour_cost(order):
            pos, total = start, 0.0
            for j in order:
                c, t = leg(pos, j)
                total += c
                pos = t[2]
            return total

        # nearest neighbour
        left, pos, order = set(range(n)), start, []
        while left:
            j = min(left, key=lambda k: leg(pos, k)[0])
            order.append(j)
            left.discard(j)
            pos = leg(pos, j)[1][2]
        best = tour_cost(order)
        improved = True
        while improved:
            improved = False
            for i in range(n - 1):                       # 2-opt (reverse a segment)
                for k in range(i + 1, n):
                    cand = order[:i] + order[i:k + 1][::-1] + order[k + 1:]
                    c = tour_cost(cand)
                    if c < best - 1e-9:
                        order, best, improved = cand, c, True
            for seg in (1, 2, 3):                        # or-opt (move a short segment)
                for i in range(n - seg + 1):
                    part, rest = order[i:i + seg], order[:i] + order[i + seg:]
                    for k in range(len(rest) + 1):
                        cand = rest[:k] + part + rest[k:]
                        c = tour_cost(cand)
                        if c < best - 1e-9:
                            order, best, improved = cand, c, True
        out, pos = [], start
        for j in order:
            c, t = leg(pos, j)
            out.append((stage[j][0], t))
            pos = t[2]
        return out


def brute_force(nav, start, stage):
    """Optimal order for tiny stages (tests)."""
    def dist(a, b):
        return nav.distances(a).get(b, float("inf"))
    best = float("inf")
    for perm in itertools.permutations(range(len(stage))):
        pos, total = start, 0.0
        for j in perm:
            c, t = min(((dist(pos, t[0]) + t[3], t) for t in stage[j][1]), key=lambda v: v[0])
            total += c
            pos = t[2]
        best = min(best, total)
    return best
