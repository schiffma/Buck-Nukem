"""Tactics as a py_trees behaviour tree, ticked once per decision (each video frame).

    root (Sequence, no memory)
      Fire                      always succeeds; sets the fire intent (hittable target in line)
      Move (Selector, no memory)  first leaf that wants something wins:
        Boss          the boss arena: pickups first, then hold the firing spot, dodge slams/bubbles
        Dodge         a projectile on a collision course -> hop (after a 150-300 ms reaction)
        Mower         a revving/charging punk facing Buck -> back off (or hop)
        Cray          a crayfish leaping at Buck -> back off
        Spacing       an enemy right on top of Buck -> step back
        Vault         a crayfish on the ground blocking the route -> jump over it
        Hold          the route leads straight into a nearby enemy -> stand, face it and shoot
        Hunt          a lawyer/punk on Buck's floor ahead (or closing in from behind) -> get in range, face, fire
        Route         follow the planned route
Leaves read the agent (snapshot world, route, timers) and write `agent.want`.
"""
import py_trees
from py_trees.common import Status

TILE = 16


class Leaf(py_trees.behaviour.Behaviour):
    def __init__(self, name, fn, agent):
        super().__init__(name)
        self.fn, self.agent = fn, agent

    def update(self):
        want = self.fn(self.agent)
        if want is None:
            return Status.FAILURE
        self.agent.want = want
        self.agent.leaf = self.name
        return Status.SUCCESS


class FireLeaf(py_trees.behaviour.Behaviour):
    def __init__(self, agent):
        super().__init__("Fire")
        self.agent = agent

    def update(self):
        self.agent.fire = fire(self.agent)
        return Status.SUCCESS


def build_tree(agent):
    move = py_trees.composites.Selector("Move", memory=False, children=[
        Leaf("Boss", boss, agent), Leaf("Dodge", dodge, agent), Leaf("Mower", mower, agent),
        Leaf("Cray", cray, agent), Leaf("Spacing", spacing, agent), Leaf("Vault", vault, agent),
        Leaf("Hold", hold, agent), Leaf("Hunt", hunt, agent), Leaf("Route", route, agent)])
    root = py_trees.composites.Sequence("root", memory=False, children=[FireLeaf(agent), move])
    return py_trees.trees.BehaviourTree(root)


# ---------------- fire ----------------
def fire(a):
    w = a.world
    if w.hero["dead"]:
        return None
    tgt = w.target_in_line()
    if not tgt:
        a.target_seen = None
        return None
    if a.target_seen is None or a.target_seen[0] != tgt:
        a.target_seen = (tgt, w.s["time"])
    if w.s["time"] - a.target_seen[1] < a.react_delay:        # human reaction before the first shot
        return None
    return "target"


# ---------------- survive ----------------
def dodge(a):
    w = a.world
    h = w.hero
    if a.ctrl.busy() or not h["onGround"] or h["climbing"]:
        return None
    for b in w.s.get("enemyShots") or []:
        if b["kind"] in ("shockwave", "bubble"):
            continue
        if w.will_hit(b, 30) and a.reacted(("shot", b["kind"])) and w.can_hop():
            a.ctrl.start_plan(a.ctrl.hop_steps("dodge"), "dodge")
            return {"dir": 0, "why": "dodge"}
    return None


def mower(a):
    w = a.world
    h = w.hero
    if a.ctrl.busy() or h["climbing"]:
        return None
    for e in w.enemies():
        if e["type"] != "punk" or e["state"] not in ("rev", "charge"):
            continue
        dx = w.cx() - (e["x"] + e["w"] / 2)
        if abs(dx) < 150 and abs(w.cy() - (e["y"] + e["h"] / 2)) < 24 and (dx > 0) == (e["face"] > 0) and a.reacted(("mower", e["id"])):
            d = 1 if dx > 0 else -1
            if w.ground_ahead(d):
                return {"dir": d, "why": "dodge"}
            if h["onGround"] and w.can_hop():
                a.ctrl.start_plan(a.ctrl.hop_steps("dodge"), "dodge")
                return {"dir": 0, "why": "dodge"}
    return None


def cray(a):
    w = a.world
    h = w.hero
    if a.ctrl.busy() or h["climbing"]:
        return None
    for e in w.enemies():
        if e["type"] != "cray" or not e["leaping"]:
            continue
        dx = w.cx() - (e["x"] + e["w"] / 2)
        if abs(dx) < 90 and (e["vx"] > 0) == (dx > 0) and a.reacted(("cray", e["id"])):
            d = 1 if dx > 0 else -1
            if h["face"] == -d and w.hittable(e) and abs(dx) > 40:
                return None                   # facing it and it's in the air: shoot it instead of backing off
            if w.ground_ahead(d):
                return {"dir": d, "why": "dodge"}
    return None


def spacing(a):
    w = a.world
    h = w.hero
    if a.ctrl.busy() or h["climbing"] or not h["onGround"]:
        return None
    for e in w.enemies():
        dx = w.cx() - (e["x"] + e["w"] / 2)
        if e["type"] == "cray" and not e["leaping"]:
            approaching = (e["vx"] > 0) == (dx > 0) and abs(e["vx"]) > 1
            if not approaching or (a.route_dir() and (dx < 0) == (a.route_dir() > 0)):
                continue                      # on the route ahead: Vault deals with it
        if abs(dx) < 26 and abs(w.cy() - (e["y"] + e["h"] / 2)) < 26:
            d = 1 if dx >= 0 else -1
            if w.ground_ahead(d):
                return {"dir": d, "why": "dodge"}
    return None


def vault(a):
    w = a.world
    h = w.hero
    if a.ctrl.busy() or not h["onGround"] or h["climbing"]:
        return None
    d = a.route_dir()
    if not d:
        return None
    for e in w.enemies():
        if e["type"] != "cray" or e["leaping"]:
            continue
        dx = (e["x"] + e["w"] / 2) - w.cx()
        if (dx > 0) == (d > 0) and abs(dx) < 44 and w.same_floor(e, 6):
            if not a.ctrl.can_turn(d) and w.ground_ahead(-d):
                return {"dir": -d, "why": "dodge"}     # just backed off: keep backing off, then vault
            steps = a.ctrl.vault(d, w)
            if steps:
                a.ctrl.start_plan(steps, "vault")
                a.follower.set_route([])           # re-route from wherever the vault lands
                return {"dir": 0, "why": "vault"}
    return None


# ---------------- fight ----------------
def hold(a):
    """Don't walk into an enemy the route leads to: stand (facing it) and let Fire do the work."""
    w = a.world
    h = w.hero
    if a.ctrl.busy() or h["climbing"] or not h["onGround"] or a.boss_level:
        return None
    d = a.route_dir()
    if not d:
        return None
    for e in w.enemies():
        if e["type"] == "cray" and not e["leaping"]:
            continue                                  # Vault deals with those
        dx = (e["x"] + e["w"] / 2) - w.cx()
        if (dx > 0) == (d > 0) and abs(dx) < 64 and w.same_floor(e, 12):
            if h["face"] != d:
                return {"dir": d, "why": "hunt"}      # turn to face it once
            return {"dir": 0, "why": "hold"}
    return None


def hunt(a):
    """Lawyers and punks on Buck's floor near the route: approach to firing range, face, shoot."""
    w = a.world
    h = w.hero
    if a.ctrl.busy() or h["climbing"] or not h["onGround"] or a.boss_level:
        return None
    best = None
    for e in w.enemies():
        if e["type"] not in ("lawyer", "punk") or not e["active"]:
            continue
        if not w.same_floor(e, 10):
            continue
        dx = (e["x"] + e["w"] / 2) - w.cx()
        if abs(dx) > 11 * TILE or not w.line_clear(w.cx(), e["x"] + e["w"] / 2, int((h["y"] + 14) // TILE)):
            continue
        if not w.floor_between(w.cx(), e["x"] + e["w"] / 2, int((h["y"] + h["h"]) // TILE)):
            continue
        if a.hunt_budget(e["id"], e["type"]) <= 0:
            continue
        rd = a.route_dir()
        behind = rd and (dx > 0) != (rd > 0)
        closing = (e["vx"] > 0) == (dx < 0) and abs(e["vx"]) > 1
        engaged = a.hunting == e["id"]
        if behind and not engaged and not (abs(dx) < 5 * TILE and closing):
            continue                                  # not worth turning back for
        if behind and engaged and abs(dx) > 7 * TILE:
            continue                                  # an engaged target is kept until it is out of range
        if best is None or abs(dx) < abs(best[1]):
            best = (e, dx)
    if not best:
        a.hunting = None
        return None
    e, dx = best
    a.hunting = e["id"]
    d = 1 if dx > 0 else -1
    dist = abs(dx)
    if dist > 7 * TILE:
        return {"dir": d, "why": "hunt"}              # get in range
    if h["face"] != d:
        return {"dir": d, "why": "hunt"}              # turn to face (a one-step tap)
    return {"dir": 0, "why": "hunt"}                  # in range and facing: stand and shoot


# ---------------- boss ----------------
def boss(a):
    w = a.world
    b = w.s.get("boss")
    if not a.boss_level or not b or b["state"] == "dying":
        return None
    h = w.hero
    if a.ctrl.busy():
        return {"dir": 0, "why": "dodge"}
    for s in w.s.get("enemyShots") or []:
        if s["kind"] == "shockwave" and h["onGround"] and s["x"] > h["x"] - 10 and s["x"] - (h["x"] + h["w"]) < 42 and a.reacted(("wave", 0), 0.1):
            a.ctrl.start_plan(a.ctrl.hop_steps("dodge"), "dodge")
            return {"dir": 0, "why": "dodge"}
        if s["kind"] == "bubble" and h["onGround"] and w.will_hit(s, 24) and a.reacted(("bubble", 0), 0.15):
            land = bubble_land_x(s, b["floor"])
            return {"dir": -1 if land > w.cx() else 1, "why": "dodge"}
    for e in w.enemies():                       # minions leaping at Buck: step back
        dx = w.cx() - (e["x"] + e["w"] / 2)
        if e["leaping"] and abs(dx) < 80 and (e["vx"] > 0) == (dx > 0) and w.ground_ahead(1 if dx > 0 else -1):
            return {"dir": 1 if dx > 0 else -1, "why": "dodge"}
    if a.tour_left():                           # the arena's Rivellas first, then fight
        return None
    floor_row = int((b["floor"] - 1) // TILE)
    if h["onGround"] and w.node()[1] != floor_row:
        return None                             # Route brings him down (a.boss_floor_route)
    want_x = min(max(b["claws"]["x"] - 70, 20), 200)
    if h["onGround"] and abs(w.cx() - want_x) > 8:
        return {"dir": 1 if w.cx() < want_x else -1, "why": "position"}
    if h["face"] < 0:
        return {"dir": 1, "why": "position"}
    return {"dir": 0, "why": "position"}


def bubble_land_x(s, floor):
    x, y, vy = s["x"], s["y"], s["vy"]
    for _ in range(120):
        if y >= floor:
            break
        vy += s["grav"] / 60
        x += s["vx"] / 60
        y += vy / 60
    return x


# ---------------- route ----------------
def route(a):
    return a.route_want()
