"""Navigation graph over the hero's standing cells, built with networkx.

A node (x, y) is a cell the hero can stand in: his feet are in tile row y, his body in rows
y-1..y. Edges follow the rules of tools/check_levels.py (and the old JS autopilot):
  walk   one tile sideways on the same floor
  drop   one tile sideways, then fall to the floor below
  climb  one tile up/down a ladder
  jump   take off and land elsewhere (rise h = 0..3 tiles, up to MAX_DX[h] tiles sideways)
Doors are solid until their key is held. Edge weights are travel times in seconds, so the
shortest path is the fastest one; when two moves connect the same cells, the cheaper one is
kept (a walk always beats a jump: no hopping along flat floor).
"""
import networkx as nx

TILE = 16
RUN, CLIMB = 96.0, 64.0                     # px/s (src/config.js runSpeed, climbSpeed)
MAX_DX = {0: 4, 1: 3, 2: 3, 3: 2}
SOLID = set("#B")
DOORS = {"R": "r", "U": "u", "G": "g"}
ONE_WAY = set("=aAT")
OFF_LADDER_PENALTY = 3.0                    # leaving a ladder sideways mid-climb is awkward; avoid it


class Nav:
    def __init__(self, rows, keys=()):
        self.rows = rows
        self.H, self.W = len(rows), len(rows[0])
        self.keys = set(k.lower() for k in keys)
        self._graph = None
        self._dist = {}

    # ---- tiles ----
    def at(self, x, y):
        if x < 0 or x >= self.W:
            return "#"
        if y < 0 or y >= self.H:
            return "."
        return self.rows[y][x]

    def solid(self, x, y):
        c = self.at(x, y)
        return c in SOLID or (c in DOORS and DOORS[c] not in self.keys)

    def ladder(self, x, y):
        return self.at(x, y) == "H"

    def floor(self, x, y):
        return self.solid(x, y) or self.at(x, y) in ONE_WAY or (self.ladder(x, y) and not self.ladder(x, y - 1))

    def free(self, x, y):
        return not self.solid(x, y) and not self.solid(x, y - 1)

    def fall(self, x, y, cells=None):
        while y < self.H + 2:
            if cells is not None:
                cells.append((x, y))
            if self.at(x, y) == "~":
                return None
            # a falling or jumping hero passes through ladders (grabbing one needs Up), so only
            # real floor ends a fall (the level checker is more lenient here)
            if self.floor(x, y + 1) or self.solid(x, y + 1):
                return (x, y)
            y += 1
        return None

    def standing(self, x, y):
        return self.free(x, y) and (self.floor(x, y + 1) or self.ladder(x, y) or self.ladder(x, y - 1))

    # ---- moves ----
    def neighbours(self, x, y):
        out = []
        on_ladder = self.ladder(x, y) or self.ladder(x, y - 1)
        grounded = self.floor(x, y + 1)

        def add(p, **e):
            if p and 0 <= p[0] < self.W and -2 <= p[1] < self.H and p != (x, y):
                e["to"] = p
                out.append(e)

        for dx in (-1, 1):
            if self.free(x + dx, y):
                cells = []
                p = self.fall(x + dx, y, cells)
                if p:
                    add(p, type="walk" if p[1] == y else "drop", dir=dx, h=0, dx=1, cells=cells,
                        off_ladder=on_ladder and not grounded)
        if on_ladder:
            if (self.ladder(x, y - 1) or self.ladder(x, y)) and (self.free(x, y - 1) or self.ladder(x, y - 1)):
                add((x, y - 1), type="climb", dir=-1, h=0, dx=0)
            if (self.ladder(x, y + 1) or self.ladder(x, y)) and not self.solid(x, y + 1):
                add((x, y + 1), type="climb", dir=1, h=0, dx=0)
        if self.ladder(x, y + 1):
            add((x, y + 1), type="climb", dir=1, h=0, dx=0)
        if grounded or on_ladder:
            for h in range(4):
                if not all(self.free(x, y - k) for k in range(h + 1)):
                    break
                ay = y - h
                if h > 0:
                    p = self.fall(x, ay)
                    if p:
                        add(p, type="jump", dir=0, h=h, dx=0, off_ladder=on_ladder and not grounded)
                for d in (-1, 1):
                    for dx in range(1, MAX_DX[h] + 1):
                        tx = x + d * dx
                        if not self.free(tx, ay):
                            break
                        p = self.fall(tx, ay)
                        if p:
                            add(p, type="jump", dir=d, h=h, dx=dx, off_ladder=on_ladder and not grounded)
        return out

    @staticmethod
    def cost(frm, e):
        """Travel time in seconds."""
        if e["type"] == "walk":
            c = TILE / RUN
        elif e["type"] == "drop":
            c = TILE / RUN + 0.12 * max(0, e["to"][1] - frm[1]) ** 0.5
        elif e["type"] == "climb":
            c = TILE / CLIMB
        else:
            c = 0.25 + 0.12 * e["h"] + e["dx"] * TILE / RUN * 0.9
        if e.get("off_ladder"):
            c += OFF_LADDER_PENALTY
        return c

    # ---- graph ----
    def graph(self):
        """All standing cells and moves between them (built once per key set)."""
        if self._graph is not None:
            return self._graph
        g = nx.DiGraph()
        seen = set()
        for y in range(self.H):
            for x in range(self.W):
                if self.standing(x, y):
                    seen.add((x, y))
        stack = list(seen)
        while stack:
            n = stack.pop()
            for e in self.neighbours(*n):
                c = self.cost(n, e)
                to = e["to"]
                if g.has_edge(n, to) and g[n][to]["weight"] <= c:
                    continue
                g.add_edge(n, to, weight=c, move=e)
                if to not in seen:
                    seen.add(to)
                    stack.append(to)
        self._graph = g
        return g

    def distances(self, src):
        """Shortest travel times from src to every reachable node (cached)."""
        if src not in self._dist:
            g = self.graph()
            self._dist[src] = nx.single_source_dijkstra_path_length(g, src, weight="weight") if src in g else {src: 0.0}
        return self._dist[src]

    def path(self, src, goals, banned=()):
        """Fastest path from src to the nearest node in goals: (cost, [move dicts with from/to]) or None."""
        g = self.graph()
        if src not in g:
            return None
        goals = set(goals)
        if src in goals:
            return 0.0, []
        view = g
        if banned:
            banned = set(banned)
            view = nx.subgraph_view(g, filter_edge=lambda a, b: (a, b) not in banned)
        try:
            cost, nodes = nx.multi_source_dijkstra(view.reverse(copy=False), goals, target=src, weight="weight")
        except nx.NetworkXNoPath:
            return None
        nodes = list(reversed(nodes))
        moves = []
        for a, b in zip(nodes, nodes[1:]):
            m = dict(g[a][b]["move"])
            m["from"] = a
            moves.append(m)
        return cost, moves

    def reachable(self, src):
        g = self.graph()
        return set(nx.descendants(g, src)) | {src} if src in g else {src}


def pickup_nodes(px, py, pw, ph):
    """Standing cells from which the hero touches a pickup whose box is (px, py, pw, ph)."""
    tx, ty = int((px + pw / 2) // TILE), int((py + ph + 1) // TILE)
    return {(tx, ty), (tx, ty + 1)}


def hero_node(x, y, w=10, h=28):
    return int((x + w / 2) // TILE), int((y + h - 1) // TILE)
