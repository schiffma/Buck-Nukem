"""Read-only facts about the game world, computed from a bridge snapshot (no game access).

Geometry mirrors the game: hero box 10x28, shots leave at hero.y + 14 (blaster) or span
hero.y + 12 .. + 26 (disc cutter), TILE = 16, fixed step DT = 1/60.
"""
from .nav import TILE, hero_node

DT = 1 / 60
SOLID, PLATFORM = set("#BRUG"), set("=aAT")


class World:
    def __init__(self, snap, grid):
        self.s, self.grid = snap, grid
        self.hero = snap["hero"]

    # ---- grid ----
    def at(self, x, y):
        g = self.grid
        if x < 0 or x >= len(g[0]):
            return "#"
        if y < 0 or y >= len(g):
            return "."
        return g[y][x]

    def solid(self, x, y):
        return self.at(x, y) in SOLID

    def floor(self, x, y):
        c = self.at(x, y)
        return c in SOLID or c in PLATFORM or (c == "H" and self.at(x, y - 1) != "H")

    def water(self, x, y):
        return self.at(x, y) == "~"

    # ---- hero ----
    def node(self):
        h = self.hero
        return hero_node(h["x"], h["y"], h["w"], h["h"])

    def cx(self):
        return self.hero["x"] + self.hero["w"] / 2

    def cy(self):
        return self.hero["y"] + self.hero["h"] / 2

    def ground_ahead(self, d):
        """Walkable floor right in front (direction d), no wall, no water."""
        h = self.hero
        tx = int((h["x"] + h["w"] + 6) // TILE) if d > 0 else int((h["x"] - 6) // TILE)
        ty = int((h["y"] + h["h"] + 2) // TILE)
        return self.floor(tx, ty) and not self.solid(tx, ty - 1) and not self.water(tx, ty - 1)

    def floor_between(self, x0, x1, floor_row):
        """Walkable floor (floor tile, no wall, no water) on every tile between two x positions."""
        a, b = sorted((int(x0 // TILE), int(x1 // TILE)))
        return all(self.floor(x, floor_row) and not self.solid(x, floor_row - 1) and not self.water(x, floor_row - 1)
                   for x in range(a, b + 1))

    def can_hop(self):
        x, y = self.node()
        return not any(self.solid(x, y - k) for k in (1, 2, 3))

    # ---- enemies and targets ----
    def enemies(self):
        return [e for e in self.s.get("enemies") or [] if not e["hidden"]]

    def same_floor(self, e, tol=8):
        return abs((e["y"] + e["h"]) - (self.hero["y"] + self.hero["h"])) < tol

    def line_clear(self, x0, x1, y):
        a, b = sorted((int(x0 // TILE), int(x1 // TILE)))
        return not any(self.solid(x, y) for x in range(a + 1, b))

    def hittable(self, e, face=None, margin=3):
        """Would a shot fired now (facing `face`) hit this enemy? Same rules as the metrics'
        'hittable', with a safety margin so the target is still in line a couple of steps later."""
        h, f = self.hero, face or self.hero["face"]
        cutter = h["weapon"] == "cutter"
        if e["type"] == "cray" and not e["leaping"] and not cutter:
            return False                     # blaster shots fly over a crayfish on the ground
        y0, y1 = h["y"] + 8 + margin, h["y"] + 22 + (6 if cutter else 0) - margin
        dx = (e["x"] + e["w"] / 2 - self.cx()) * f
        if not (-4 < dx < 13 * TILE and e["y"] < y1 and e["y"] + e["h"] > y0):
            return False
        return self.line_clear(self.cx(), e["x"] + e["w"] / 2, int((h["y"] + 14) // TILE))

    def boss_face_hittable(self, face=None):
        b = self.s.get("boss")
        if not b or not b["raised"] or b["claw"] <= 0.5:
            return False
        h, f = self.hero, face or self.hero["face"]
        fb = b["face"]
        y0, y1 = h["y"] + 11, h["y"] + 19
        return (fb["x"] + fb["w"] / 2 - self.cx()) * f > 0 and fb["y"] < y1 and fb["y"] + fb["h"] > y0

    def doomed(self, e):
        """Shots already in flight will finish this enemy: more shots would only miss."""
        dmg = 0
        for s in self.s.get("heroShots") or []:
            ahead = (e["x"] + e["w"] / 2 - (s["x"] + s["w"] / 2)) * s["vx"] > 0
            if ahead and s["y"] < e["y"] + e["h"] and s["y"] + s["h"] > e["y"]:
                dmg += s["dmg"]
        return dmg >= e["hp"]

    def target_in_line(self, face=None):
        """A hittable target ahead (not already doomed by shots in flight): (kind, id) or None."""
        for e in self.enemies():
            if e["active"] and self.hittable(e, face) and not self.doomed(e):
                return ("enemy", e["id"])
        if self.boss_face_hittable(face):
            return ("boss", 0)
        return None

    # ---- projectiles ----
    def will_hit(self, b, frames=30, margin=2):
        h = self.hero
        x, y, vx, vy = b["x"], b["y"], b["vx"], b["vy"]
        for _ in range(frames):
            vy += b["grav"] * DT
            x += vx * DT
            y += vy * DT
            if x < h["x"] + h["w"] + margin and x + b["w"] > h["x"] - margin and y < h["y"] + h["h"] and y + b["h"] > h["y"]:
                return True
        return False
