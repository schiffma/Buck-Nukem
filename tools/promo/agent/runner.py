"""The promo agent: drives a Session through the whole game (or one level for diagnostics).

Per decision (one video frame = 2 game steps): snapshot -> World -> behaviour tree (tactics) ->
Controller (inputs) -> bridge.step(). Level bookkeeping, the whole-level tour, route
management, the stall detector and the run report live here.
"""
import random

from .behaviour import build_tree
from .controller import Controller, Follower, edge_key
from .metrics import run_metrics
from .nav import Nav, TILE
from .planner import Item, Planner, item_value
from .world import World

STALL_S = 5.0
KILL_STOPS = {"lawyer": "L", "punk": "M"}       # enemies worth a detour (planner kinds)
HUNT_BUDGET = {"lawyer": 12.0, "punk": 20.0}    # seconds of fighting one enemy is worth
WAIT_LEAVES = {"Boss", "Dodge", "Mower", "Cray", "Spacing", "Hunt", "Kneel", "Vault"}   # deliberate waits for the stall detector


class Agent:
    def __init__(self, session, seed=1977, log=print):
        self.s, self.log = session, log
        self.rng = random.Random(seed)
        self.ctrl = Controller(session, self.rng)
        self.follower = Follower()
        self.tree = build_tree(self)
        self.want, self.fire, self.leaf = {}, None, ""
        self.react_delay = 0.2
        self.seen, self.delays = {}, {}
        self.target_seen = None
        self.report = {"levels": [], "victory": False, "game_over": False, "deaths": 0, "stuck": 0}
        self.lv = None
        self.grids, self.names = {}, {}
        self.rows = []
        self.world = None
        self.boss_level = False
        self.hunting = None
        self.trace = None          # set to [] to record a per-decision debug trace

    # ---------------- reaction delays ----------------
    def reacted(self, key, delay=None):
        """True once a threat has been seen for its reaction delay (150-300 ms, seeded)."""
        t = self.world.s["time"]
        if key not in self.seen:
            self.seen[key] = t
            self.delays[key] = delay if delay is not None else self.rng.uniform(0.15, 0.30)
        self.touched.add(key)
        return t - self.seen[key] >= self.delays[key]

    # ---------------- level bookkeeping ----------------
    def begin_level(self, snap):
        idx = snap["levelIndex"]
        self.grids[idx], self.names[idx] = self.grid, snap["level"]["name"]
        self.boss_level = snap["level"]["isBoss"]
        self.lv = {"level": idx + 1, "name": snap["level"]["name"], "pickups": len(snap["pickups"]),
                   "collected": 0, "enemy_ids": {e["id"] for e in snap["enemies"]}, "killed": 0, "deaths": 0,
                   "time0": snap["time"], "time": 0.0, "stuck": 0, "completed": False, "index": idx}
        self.initial_pickups = {p["id"] for p in snap["pickups"]}
        self.was_dead = False
        self.banned = set()
        self.hunt_time = {}
        self.kneel_time = {}
        self.replan(snap)

    def finish_level(self, snap, completed):
        if not self.lv or self.lv.get("done"):
            return
        self.track(snap)
        self.lv["completed"], self.lv["done"] = completed, True
        self.report["levels"].append(self.lv)

    def track(self, snap):
        lv = self.lv
        if snap.get("enemies") is not None:
            lv["enemy_ids"] |= {e["id"] for e in snap["enemies"]}
            lv["alive"] = sorted("%s#%d@%d,%d" % (e["type"], e["id"], e["x"] // TILE, e["y"] // TILE) for e in snap["enemies"])
            left = {p["id"] for p in snap["pickups"]}
            lv["collected"] = len(self.initial_pickups - left)
        lv["killed"] = snap["kills"] + (1 if self.boss_level and snap.get("boss") is None and snap["state"] != "BOSS" else 0)
        lv["time"] = round(snap["time"] - lv["time0"], 1)
        lv["score"] = snap["score"]

    def keys(self):
        k = self.world.hero["keys"]
        return {c.lower() for c in ("R", "U", "G") if k[c]}

    def replan(self, snap):
        """Whole-level tour from the hero's position over the remaining pickups, then the exit."""
        w = World(snap, self.grid)
        self.planner = Planner(self.grid, {c.lower() for c in ("R", "U", "G") if snap["hero"]["keys"][c]})
        items = [Item(p["id"], p["type"], p["x"], p["y"], p["w"], p["h"]) for p in snap["pickups"]]
        if not self.boss_level:                 # kill stops: lawyers and punks are worth points
            for e in snap["enemies"]:
                if e["type"] in KILL_STOPS:
                    items.append(Item(("e", e["id"]), KILL_STOPS[e["type"]], e["x"], e["y"] + e["h"] - 12, e["w"], 8))
        exit_nodes = None
        if snap.get("exit"):
            e = snap["exit"]
            exit_nodes = {(int((e["x"] + 8) // TILE), int((e["y"] + e["h"] - 1) // TILE))}
        self.tour = self.planner.plan(w.node(), items, exit_nodes, value=item_value)
        if self.lv is not None:
            self.lv.setdefault("skipped", set()).update(repr(it) for it in self.planner.skipped if it.kind not in ("L", "M"))
        if self.planner.skipped:
            self.log("  skipping (not worth the detour): %s" % ", ".join(repr(it) for it in self.planner.skipped))
        self.stop = 0
        self._perch = None
        self.follower.set_route([])
        self.best, self.best_t = None, snap["time"]

    def nav(self):
        return self.planner.nav(self.keys())

    # ---------------- route ----------------
    def current_stop(self):
        snap = self.world.s
        left = self.left_ids(snap)
        while self.stop < len(self.tour):
            st = self.tour[self.stop]
            if st["item"] is None or any(it.id in left for it in st["items"]):
                return st
            self.stop += 1                      # collected (maybe on the way): next stop
            self.follower.set_route([])
            self.best = None
        return None

    @staticmethod
    def left_ids(snap):
        left = {p["id"] for p in snap["pickups"]}
        left |= {("e", e["id"]) for e in snap.get("enemies") or []}
        return left

    def tour_left(self):
        snap = self.world.s
        left = self.left_ids(snap)
        return any(it.id in left for st in self.tour[self.stop:] for it in st["items"])

    def route_dir(self):
        m = self.follower.current() or (self.follower.moves[0] if self.follower.moves else None)
        if not m:
            return 0
        cx = self.world.cx()
        if m["type"] in ("jump", "climb"):
            # the follower first goes to the take-off / ladder column, then the move's own direction
            d = m["from"][0] * TILE + 8 - cx
            if abs(d) > 8:
                return 1 if d > 0 else -1
            return m["dir"] if m["type"] == "jump" else 0
        d = m["to"][0] * TILE + 8 - cx
        return 0 if abs(d) < 4 else (1 if d > 0 else -1)

    def route_want(self):
        w = self.world
        h = w.hero
        if self.ctrl.busy():
            return {"dir": 0, "why": "route"}
        st = self.current_stop()
        if st is None:
            if self.boss_level:
                b = w.s.get("boss")
                if b:
                    perch = self.boss_perch()
                    if perch and self.follower.done() and h["onGround"] and not self.at_perch():
                        p = self.nav().path(w.node(), {perch}, self.banned)
                        if p:
                            self.follower.set_route(p[1])
                    if not self.follower.done():
                        want = self.follower.want(w, self.ctrl)
                        if want.get("failed"):
                            self.banned.add(edge_key(want["failed"]))
                            self.follower.set_route([])
                        return want
            return {"dir": 0, "why": "route"}
        if st["item"] is not None and st["item"].kind in KILL_STOPS.values() and self.track_kill_stop(st):
            return {"dir": 0, "why": "route"}
        if self.follower.done():
            if not h["onGround"] and not h["climbing"]:
                return {"dir": 0, "why": "route"}
            node = w.node()
            if node == st["end"] and st["via"] is None and st["item"] is not None:
                # standing on the item's cell but it is still there: try the other cell next time
                self.stop += 1
                return {"dir": 0, "why": "route"}
            p = self.nav().path(node, {st["node"]}, self.banned)
            if p is None:
                self.log("  no path to stop %s from %s: skipping it" % (st["node"], node))
                self.tour.append(self.tour.pop(self.stop))
                return {"dir": 0, "why": "route"}
            moves = p[1] + ([st["via"]] if st["via"] else [])
            self.follower.set_route(moves)
        want = self.follower.want(w, self.ctrl)
        if want.get("failed"):
            self.banned.add(edge_key(want["failed"]))
            self.follower.set_route([])
        if want.get("timeout"):
            self.stuck("move timeout")
        return want

    def boss_perch(self):
        """The boss-fight firing spot: a stand node whose gun line meets the boss's face with no
        solid tile (crate) in between, in front of the claws; platforms first (the claw-slam
        shockwave runs along the floor), then the one nearest the boss."""
        if getattr(self, "_perch", None) is not None:
            return self._perch
        w = self.world
        b = w.s.get("boss")
        if not b:
            return None
        self._perch_span = set()
        face = b["face"]
        floor_row = int((b["floor"] - 1) // TILE)
        reach_x = b["homeX"] - 36 - 2 * TILE                  # stay clear of the claws' reach
        best, ok = None, set()
        for (x, y) in self.nav().graph().nodes:
            gy = (y + 1) * TILE - 14                          # gun height standing on that node
            if not (face["y"] + 2 < gy < face["y"] + face["h"] - 6) or (x + 1) * TILE > reach_x:
                continue
            if w.at(x, y + 1) == "d":                         # a breakable crate won't last as a perch
                continue
            if not w.line_clear(x * TILE + 8, face["x"] + 4, int(gy // TILE)):
                continue
            ok.add((x, y))
            key = (y != floor_row, x)
            if best is None or key > best[0]:
                best = (key, (x, y))
        self._perch = best[1] if best else None
        if self._perch:                                       # the perch's stretch of the same row: any of it will do
            px, py = self._perch
            x = px
            while (x, py) in ok:                              # the whole ledge: dodges stay where they land
                self._perch_span.add((x, py)); x -= 1
        self.log("  boss perch %s" % (self._perch,))
        return self._perch

    def at_perch(self):
        perch = self.boss_perch()
        return perch is None or self.world.node() in self._perch_span

    def track_kill_stop(self, st):
        """A kill stop follows its enemy (they walk). Returns True when the stop was dropped."""
        eid = st["item"].id[1]
        e = next((e for e in self.world.s["enemies"] if e["id"] == eid), None)
        if e is None or self.hunt_budget(eid, e["type"]) <= 0:
            self.stop += 1                       # dead (or fought long enough): next stop
            self.follower.set_route([])
            self.best = None
            return True
        node = (int((e["x"] + e["w"] / 2) // TILE), int((e["y"] + e["h"] - 1) // TILE))
        if abs(node[0] - st["node"][0]) + abs(node[1] - st["node"][1]) >= 3 and node in self.nav().graph():
            st["node"] = st["end"] = node
            self.follower.set_route([])          # re-route to where it is now
            self.best = None
        return False

    def stuck(self, why):
        m = self.follower.current() or (self.follower.moves[0] if self.follower.moves else None)
        if m:
            self.banned.add(edge_key(m))
        self.follower.set_route([])
        self.lv["stuck"] += 1
        self.report["stuck"] += 1
        self.best, self.best_t = None, self.world.s["time"]
        self.log("  stuck (%s) at %s, level %d" % (why, self.world.node(), self.lv["level"]))

    def stall_check(self):
        """No progress toward the current stop for 5 s outside deliberate waits -> stuck event."""
        w = self.world
        t = w.s["time"]
        st = self.current_stop()
        if self.leaf in WAIT_LEAVES or self.ctrl.busy() or st is None or w.hero["dead"]:
            self.best, self.best_t = None, t
            return
        if not w.hero["onGround"]:
            return
        d = self.nav().distances(w.node()).get(st["node"])
        if d is None:
            return
        if self.best is None or d < self.best - 0.05:
            self.best, self.best_t = d, t
        elif t - self.best_t > STALL_S:
            self.stuck("no progress")

    def hunt_budget(self, eid, kind="lawyer"):
        return HUNT_BUDGET.get(kind, 8.0) - self.hunt_time.get(eid, 0.0)

    # ---------------- per decision ----------------
    def decide(self, snap):
        st = snap["state"]
        if snap.get("grid") is not None:          # the bridge sends the map only when it changes
            if snap["grid"] != self.grid and self.lv and not self.lv.get("done") and self.lv["index"] == snap["levelIndex"]                     and st in ("PLAY", "BOSS"):
                self.door_opened = True
            self.grid = snap["grid"]
        if st == "TITLE":
            return [{"enter": 1}, {}] if snap["stateT"] > 3 else [{}, {}]
        if st == "LEVEL_COMPLETE":
            if self.lv and not self.lv.get("done"):
                self.finish_level(snap, True)
            return [{"enter": 1}, {}] if snap["tallyDone"] and snap["stateT"] > 3.5 else [{}, {}]
        if st not in ("PLAY", "BOSS") or snap.get("reveal"):     # boss reveal pan: hands off
            return [{}, {}]
        if self.lv is None or self.lv.get("done") or self.lv["index"] != snap["levelIndex"]:
            self.begin_level(snap)
        if getattr(self, "door_opened", False):    # a door opened: plan again with the new map
            self.door_opened = False
            self.replan(snap)
        self.world = w = World(snap, self.grid)
        self.track(snap)
        h = w.hero
        if h["dead"]:
            if not self.was_dead:
                self.was_dead = True
                self.lv["deaths"] += 1
                self.report["deaths"] += 1
            return [{}, {}]
        if self.was_dead:                       # respawned at a checkpoint: plan again from here
            self.was_dead = False
            self.ctrl.plan = []
            self.replan(snap)
        if h["hp"] <= 3:
            self.prefer_health()
        self.touched = set()
        self.want, self.fire, self.leaf = {}, None, ""
        self.tree.tick()
        for k in [k for k in self.seen if k not in self.touched]:      # threats gone: forget them
            self.seen.pop(k)
        if self.leaf == "Hunt" and self.hunting:
            self.hunt_time[self.hunting] = self.hunt_time.get(self.hunting, 0) + 1 / 30
        self.stall_check()
        want = dict(self.want)
        if self.trace is not None:
            m = self.follower.current()
            self.trace.append((round(snap["time"], 2), self.lv["level"], w.node(), round(w.cx(), 1), self.leaf, want.get("dir"), want.get("why"),
                               m and (m["type"], m["from"], m["to"]), h["climbing"], h["onGround"],
                               self.target_seen and self.target_seen[0], bool(self.fire)))
        if self.fire:
            want["fire"], want["fire_why"] = True, self.fire
        return self.ctrl.emit(want, w)

    def prefer_health(self):
        """Low health: the nearest remaining Rivella/Cervelat becomes the next stop."""
        snap = self.world.s if self.world else None
        if not snap:
            return
        left = {p["id"] for p in snap["pickups"]}
        cur = self.tour[self.stop] if self.stop < len(self.tour) else None
        if cur is not None and cur["item"] is not None and cur["item"].kind in ("h", "s"):
            return                                      # already heading for one
        if not self.world.hero["onGround"]:
            return
        dist = self.nav().distances(self.world.node())
        best, best_c = None, 10.0                       # only a detour of at most ~10 s
        for i in range(self.stop, len(self.tour)):
            st = self.tour[i]
            if st["item"] is not None and st["item"].kind in ("h", "s") and st["item"].id in left:
                c = dist.get(st["node"], 1e9)
                if c < best_c:
                    best, best_c = i, c
        if best is not None and best != self.stop:
            self.tour.insert(self.stop, self.tour.pop(best))
            self.follower.set_route([])
            self.best = None

    # ---------------- run ----------------
    def run(self, max_minutes=30, outro_s=5.0, on_progress=None):
        snap = self.s.snapshot(True)
        self.grid = snap.get("grid")
        end_at = None
        frames = 0
        while snap["time"] < max_minutes * 60 or snap["state"] == "TITLE":
            seq = self.decide(snap)
            snap = self.s.step(seq)
            frames += 1
            if on_progress and frames % 900 == 0:
                on_progress(frames, snap, self)
            if snap["state"] in ("VICTORY", "GAME_OVER") and end_at is None:
                if self.lv and not self.lv.get("done"):
                    self.finish_level(snap, snap["state"] == "VICTORY")
                self.report["victory"] = snap["state"] == "VICTORY"
                self.report["game_over"] = snap["state"] == "GAME_OVER"
                end_at = snap["time"] + outro_s
            if end_at is not None and snap["time"] >= end_at:
                break
            if frames % 300 == 0:
                self.rows += self.s.take_rows()
        self.rows += self.s.take_rows()
        if self.lv and not self.lv.get("done"):
            self.finish_level(snap, False)
        self.report["frames"] = frames
        return self.report


def dry_run(browser="chrome", seed=1977, which="all", log=print, max_minutes=30, trace=False):
    """Plays without video. which: 'all' or the index of one of the agent's levels, 0 = clay courts ...
    3 = boss arena (diagnostics: starts that level directly; the ride, reel 1, is skipped)."""
    from .session import Session, PROMO_FIRST_REEL
    with Session(browser=browser, seed=seed, log=log) as s:
        agent = Agent(s, seed=seed, log=log)
        if trace:
            agent.trace = []
        if which != "all":
            s.page.evaluate("(i) => PromoBridge.devStartLevel(i)", int(which) + PROMO_FIRST_REEL - 1)
        rep = agent.run(max_minutes=max_minutes, outro_s=0 if which == "all" else 0,
                        on_progress=lambda f, snap, a: log("  %4.0fs %s L%d node %s hp %d stop %d/%d %s" % (
                            snap["time"], snap["state"], snap["levelIndex"] + 1, a.world.node() if a.world else "-",
                            snap["hero"]["hp"], a.stop if a.lv else 0, len(a.tour) if a.lv else 0, a.leaf)))
        if which != "all" and rep["levels"]:
            rep["victory"] = rep["levels"][-1]["completed"]
        res = run_metrics(agent.rows, agent.grids)
        return {"report": rep, "rows": agent.rows, "grids": agent.grids, "names": agent.names,
                "victory": rep["victory"], "errors": s.errors, "metrics": res, "actions": agent.ctrl.actions,
                "trace": agent.trace}
