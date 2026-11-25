"""The ride agent: Buck on the mofa, reel 1 ("THE ROAD TO WOLLERAU").

The road is one long lane, so the ride needs no nav graph or tour: a small priority list runs
once per decision (one video frame = 2 game steps) and answers with the normal inputs only
(Right = gas, Left = brake, Jump = hop, Fire = the twin guns, Up = front gun angled up):

  1. the limo finale: hands off (no Fire or Jump, so the scene plays out in the video)
  2. thrown items and corks that will hit: shoot them down, else hop, else brake/gas away
  3. cars: Ferraris (heard before they show up): slow down, shoot, hop if they would still hit;
     Teslas from behind: the rear gun; X7 ahead: keep a gap and shoot; the limo: stop short, shoot
  4. ramps with an item above: arrive at full speed, no hop or brake on the approach
  5. otherwise gas toward the gate

Fire is held only while a target is in a gun's line (a car on screen, or a shootable item on
screen in the front gun's path) and not already covered by the shots in flight. Every new threat
or target is answered after a reaction delay of 150-300 ms (seeded); the throttle state is held
at least 200 ms and not flipped back (gas <-> brake) within 1 s except to dodge.
"""
import random

DT = 1 / 60
W = 320                      # screen width (px)
TILE = 16
CARS = ("suv", "tesla", "ferrari", "limo")
HOLD_S, FLIP_S = 0.2, 1.0
LIMO_STOP = (85, 130)        # stop this far before the limo (px, gap from the mofa's front)
X7_GAP = (60, 95)            # brake below, coast below, gas above
RAMP_ZONE = 140              # px before a ramp start: full speed, no hop/brake (unless forced)


def overlap(a, b):
    return a[0] < b[0] + b[2] and a[0] + a[2] > b[0] and a[1] < b[1] + b[3] and a[1] + a[3] > b[1]


class RideBrain:
    """Decisions from snapshots. sim_hop(vy0=None, gk=1) -> [[t, x, y], ...] (the bridge's mirror)."""

    def __init__(self, rng=None, sim_hop=None):
        self.rng = rng or random.Random(1977)
        self.sim_hop = sim_hop
        self.seen, self.delays = {}, {}
        self.throttle, self.throttle_t, self.last_dir, self.last_dir_t = 0, -10.0, 0, -10.0
        self.ramps, self.road, self.grid = [], [], None
        self.ramp_speed = {}         # ramp x -> approach speed whose flight collects its item(s)
        self.gravity, self.maxFall = 1000, 420      # updated from the snapshot (CONFIG)
        self.reason = ""

    # ---------------- helpers ----------------
    def reacted(self, key, t, delay=None):
        if key not in self.seen:
            self.seen[key] = t
            self.delays[key] = delay if delay is not None else self.rng.uniform(0.15, 0.30)
        return t - self.seen[key] >= self.delays[key]

    def forget(self, alive):
        for k in [k for k in self.seen if k not in alive]:
            self.seen.pop(k, None)
            self.delays.pop(k, None)

    @staticmethod
    def on_screen(o, cam):
        return o["x"] + o["w"] > cam and o["x"] < cam + W

    def road_top(self, x):
        if not self.road:
            return None
        i = int(x // TILE)
        return self.road[max(0, min(len(self.road) - 1, i))]

    # ---------------- predictions ----------------
    def hero_path(self, h, n, dv=0.0):
        """Hero boxes for the next n steps (on the road: constant speed + dv; airborne: ballistic)."""
        out, x, y, vy = [], h["x"], h["y"], h["vy"]
        vx = h["vx"] + dv
        for _ in range(n):
            if not h["onGround"]:
                vy = min(self.maxFall, vy + self.gravity * DT)
                y += vy * DT
                rt = self.road_top(x + h["w"] / 2)
                if rt is not None and vy >= 0 and y + h["h"] >= rt:
                    y = rt - h["h"]
            x += vx * DT
            out.append((x, y, h["w"], h["h"]))
        return out

    @staticmethod
    def shot_path(b, n):
        out, x, y, vy = [], b["x"], b["y"], b["vy"]
        for _ in range(n):
            vy += b["grav"] * DT
            x += b["vx"] * DT
            y += vy * DT
            out.append((x, y, b["w"], b["h"]))
        return out

    def hit_time(self, b, hero_boxes):
        for i, (sb, hb) in enumerate(zip(self.shot_path(b, len(hero_boxes)), hero_boxes)):
            if overlap(sb, hb):
                return (i + 1) * DT
        return None

    def intercept(self, b, h, R, t_hit, cam):
        """Can the guns shoot item b down before t_hit? -> (True, up) or (False, None).
        Volleys every 1/rate from now (fireCd), front level or up, rear level."""
        rate, v, ang = R["rate"], R["shot"]["v"], R["shot"]["aim"] * 3.14159265 / 180
        cos, sin = __import__("math").cos(ang), __import__("math").sin(ang)
        path = self.shot_path(b, int(t_hit / DT))
        best = None
        for up in (False, True):
            for k in range(int(t_hit * rate) + 1):
                t0 = max(0.0, h.get("fireCd", 0)) + k / rate
                if t0 >= t_hit:
                    break
                for gun in ("front", "rear"):
                    if gun == "rear" and up:
                        continue
                    mx, my = h["x"] + h["vx"] * t0 + R[gun]["dx"], h["y"] + R[gun]["dy"]
                    vx = (v * cos if up else v) * (1 if gun == "front" else -1)
                    vy = -v * sin if up else 0.0
                    for i in range(int(t0 / DT), len(path)):
                        dt = (i + 1) * DT - t0
                        sx, sy = mx + vx * dt, my + vy * dt
                        if sx < cam - 4 or sx > cam + W + 4:
                            break
                        if overlap((sx, sy, R["shot"]["w"], R["shot"]["h"]), path[i]):
                            tt = (i + 1) * DT
                            if tt < t_hit - 0.04 and (best is None or tt < best[0]):
                                best = (tt, up)
                            break
                if best and best[1] == up:
                    break
        return (True, best[1]) if best else (False, None)

    def covered(self, e, snap, gun_dir):
        """Hero shots in flight that will hit car e (same direction, in its rows, not past it)."""
        n = 0
        for s in snap.get("heroShots", []):
            if (s["vx"] > 0) != (gun_dir > 0) or abs(s.get("vy", 0)) > 1:
                continue                 # other way, or angled up (at a thrown item): it misses the car
            if s["y"] + s["h"] < e["y"] or s["y"] > e["y"] + e["h"]:
                continue
            if gun_dir > 0 and s["x"] < e["x"] + e["w"] or gun_dir < 0 and s["x"] + s["w"] > e["x"]:
                n += s.get("dmg", 1)
        return n

    def car_in_line(self, e, h, R, cam):
        if not self.on_screen(e, cam):
            return 0
        fy, ry = h["y"] + R["front"]["dy"], h["y"] + R["rear"]["dy"]
        if e["x"] + e["w"] > h["x"] + R["front"]["dx"] and e["y"] < fy + 4 and e["y"] + e["h"] > fy - 4:
            return 1
        if e["x"] < h["x"] + R["rear"]["dx"] and e["y"] < ry + 4 and e["y"] + e["h"] > ry - 4:
            return -1
        return 0

    def hop_clears(self, h, threats, cars, n_after=24):
        """Does a hop now clear the threats (items) and cars (moving at their vx)? Uses the bridge
        mirror for the flight, then the road at constant speed for a few more steps."""
        if not self.sim_hop or not h["onGround"]:
            return False
        flight = self.sim_hop()
        if not flight:
            return False
        boxes = [(p[1], p[2], h["w"], h["h"]) for p in flight]
        lx, ly = boxes[-1][0], boxes[-1][1]
        boxes += [(lx + h["vx"] * DT * (i + 1), ly, h["w"], h["h"]) for i in range(n_after)]
        for b in threats:
            if any(overlap(sb, hb) for sb, hb in zip(self.shot_path(b, len(boxes)), boxes)):
                return False
        for e in cars:
            for i, hb in enumerate(boxes):
                t = (i + 1) * DT
                if overlap((e["x"] + e["vx"] * t, e["y"], e["w"], e["h"]), hb):
                    return False
        return True

    def contact_time(self, e, h):
        """Seconds until car e touches the mofa at current speeds (None: never)."""
        if e["x"] >= h["x"] + h["w"]:
            gap, rel = e["x"] - (h["x"] + h["w"]), h["vx"] - e["vx"]
        elif e["x"] + e["w"] <= h["x"]:
            gap, rel = h["x"] - (e["x"] + e["w"]), e["vx"] - h["vx"]
        else:
            return 0.0
        return gap / rel if rel > 1 else None

    def kill_time(self, e, h, R, dirn, snap):
        need = max(0, e["hp"] - self.covered(e, snap, dirn))
        if need == 0:
            return 0.0
        gap = max(0.0, (e["x"] - (h["x"] + R["front"]["dx"])) if dirn > 0 else (h["x"] + R["rear"]["dx"] - (e["x"] + e["w"])))
        closing = R["shot"]["v"] + (-e["vx"] if dirn > 0 else e["vx"]) - (h["vx"] if dirn > 0 else -h["vx"])
        return max(0.0, h.get("fireCd", 0)) + (need - 1) / R["rate"] + gap / max(60.0, closing)

    # ---------------- the decision ----------------
    def decide(self, snap):
        """-> dict: throttle (1 gas, 0 coast, -1 brake), hop, fire, up, why."""
        t, h, R, cam = snap["time"], snap["hero"], snap["ride"], snap["camera"]["x"]
        if snap.get("grid") is not None:
            self.grid = snap["grid"]
        if snap.get("road"):
            self.road = snap["road"]
        if snap.get("ramps") is not None:
            self.ramps = snap["ramps"]
        self.gravity, self.maxFall = R.get("gravity", self.gravity), R.get("maxFall", self.maxFall)
        out = {"throttle": 1, "hop": False, "fire": False, "up": False, "why": "route", "hop_why": "", "fire_why": ""}
        if R["finale"] or h["dead"]:
            self.forget(set())
            return dict(out, throttle=0, why="finale" if R["finale"] else "dead")
        cars = [e for e in snap["enemies"] if e["type"] in CARS]
        alive_keys = set()
        hx2 = h["x"] + h["w"]
        ramp_ahead = next((r for r in self.ramps if 0 <= r["x"] - hx2 < RAMP_ZONE and self.ramp_has_item(r, snap)), None)

        # ---- 2. thrown items / corks that will hit
        boxes = self.hero_path(h, 75)
        threats = []
        for b in snap.get("enemyShots", []):
            th = self.hit_time(b, boxes)
            if th is not None:
                threats.append((th, b))
        threats.sort(key=lambda p: p[0])
        dodge = None
        for th, b in threats:
            key = "s%d" % b["id"]
            alive_keys.add(key)
            if not self.reacted(key, t, self.rng.uniform(0.15, 0.22)):
                continue
            ok, up = self.intercept(b, h, R, th, cam) if b.get("shootable") else (False, None)
            if ok:
                out["fire"], out["fire_why"] = True, b["kind"]
                out["up"] = out["up"] or up
                continue
            dodge = (th, b)
            break

        # ---- 3. cars
        fire_cars = []
        for e in cars:
            key = "c%d" % e["id"]
            line = self.car_in_line(e, h, R, cam)
            if line:
                alive_keys.add(key)
                # a Ferrari was heard coming (its roar): no new reaction when it shows up;
                # cars ramming from behind are contact threats: the short end of the delay
                ready = (e["type"] == "ferrari" and ("f%d" % e["id"]) in self.seen and self.reacted("f%d" % e["id"], t)) or                     self.reacted(key, t, 0.15 if line < 0 else None)
                if ready and self.covered(e, snap, line) < e["hp"]:
                    fire_cars.append((e, line))
        if fire_cars:
            out["fire"] = True
            out["fire_why"] = out["fire_why"] or fire_cars[0][0]["type"]
            if out["up"] and any(line > 0 for _, line in fire_cars) and not any(
                    b.get("shootable") and th < 0.7 for th, b in threats):
                out["up"] = False        # no item close: the front gun levels at the car

        throttle, why = 1, "route"
        ferrari = sorted([e for e in cars if e["type"] == "ferrari" and e["x"] + e["w"] > h["x"]], key=lambda e: e["x"])
        for k, e in enumerate(ferrari):  # heard ~1 s before it shows: stop and shoot it head-on
            alive_keys.add("f%d" % e["id"])
            if not self.reacted("f%d" % e["id"], t):
                continue
            # stop, and back up a little inside the camera's dead zone (it shows up sooner on screen)
            sx = h["x"] + h["w"] / 2 - cam
            throttle, why = (-1 if h["vx"] > 15 or sx > 90 else 0), "ferrari"
            if k > 0:
                continue                 # the next one of a pair is handled once the first is gone
            tc = self.contact_time(e, h)
            if tc is not None and tc < 0.5 and h["onGround"]:
                line = self.car_in_line(e, h, R, cam)
                if not (line > 0 and self.kill_time(e, h, R, 1, snap) < tc - 0.04):
                    if self.hop_clears(h, [b for _, b in threats], ferrari):
                        out["hop"], out["hop_why"] = True, "ferrari"
        for e in cars:
            if e["type"] == "suv" and e["x"] > hx2 - 4:
                gap = e["x"] - hx2
                if gap < X7_GAP[0]:
                    throttle, why = min(throttle, -1), "x7-gap"
                elif gap < X7_GAP[1] and throttle > 0:
                    throttle, why = 0, "x7-gap"
            elif e["type"] == "limo" and e["x"] > hx2 - 4:
                gap = e["x"] - hx2
                if gap < LIMO_STOP[1] and h["vx"] > 5 or gap < LIMO_STOP[0]:
                    throttle, why = -1, "limo"
                elif gap < LIMO_STOP[1] + 90:
                    throttle, why = min(throttle, 0), "limo"
            elif e["type"] == "tesla" and e["x"] + e["w"] <= h["x"] + 4:
                tc = self.contact_time(e, h)
                if tc is not None and tc < 1.2 and throttle > 0:
                    why = "tesla"         # full speed: as much time as possible to shoot it

        # ---- 4. ramps with an item above: arrive at the speed whose flight collects it, no hop
        if ramp_ahead is not None and why not in ("ferrari", "limo") and not any(
                e["type"] == "suv" and e["x"] > hx2 and e["x"] - hx2 < X7_GAP[0] * 0.6 for e in cars):
            v = self.approach_speed(ramp_ahead, h, R, snap)
            if h["vx"] < v - 4:
                throttle, why = 1, "ramp"
            elif h["vx"] > v + 20:
                throttle, why = -1, "ramp"
            elif h["vx"] > v + 3:
                throttle, why = 0, "ramp"
            else:
                throttle, why = (1 if v >= R["top"] - 1 else 0), "ramp"

        # ---- the dodge (items that can't be shot down)
        if dodge is not None and not out["hop"]:
            th, b = dodge
            if h["onGround"] and ramp_ahead is None and self.hop_clears(h, [b] + [bb for _, bb in threats if bb is not b],
                                                                          [e for e in cars if self.contact_time(e, h) is not None and self.contact_time(e, h) < 1.0]):
                out["hop"], out["hop_why"] = True, b["kind"]
            else:
                for dv, thr in ((-60.0, -1), (60.0, 1)):
                    if self.hit_time(b, self.hero_path(h, 75, dv)) is None:
                        throttle, why = thr, "dodge"
                        break
        if out["hop"] and ramp_ahead is not None and out["hop_why"] != "ferrari":
            out["hop"] = False
        self.forget(alive_keys | {k for k in self.seen if k.startswith("f")} if ferrari else alive_keys)
        out["throttle"], out["why"] = self.hold(throttle, why, t), why
        out["hop"] = bool(out["hop"] and h["onGround"])
        return out

    def ramp_items(self, r, snap):
        return [p for p in snap.get("pickups", [])
                if r["x"] + r["w"] <= p["x"] <= r["x"] + r["w"] + 12 * TILE and p["y"] < r["y"] - 2 * TILE]

    def approach_speed(self, r, h, R, snap):
        """The launch speed (px/s) whose ramp flight collects the most of the items above it (the
        middle of the best band; top speed when it is in that band), by the bridge's flight mirror."""
        key = r["x"]
        if key in self.ramp_speed:
            return self.ramp_speed[key]
        items = self.ramp_items(r, snap)
        best, band = -1, []
        if self.sim_hop and items:
            for v in range(int(R["top"]), 55, -5):
                start = {"x": r["x"] + r["w"] - h["w"] / 2 + v * DT, "y": r["y"] - h["h"], "vx": v}
                path = self.sim_hop(R["rampVel"] * v / R["top"], R["rampGrav"], start)
                n = sum(1 for p in items if any(overlap((q[1], q[2], h["w"], h["h"]), (p["x"], p["y"], p["w"], p["h"])) for q in path))
                if n > best:
                    best, band = n, [v]
                elif n == best and n > 0:
                    band.append(v)
        v = R["top"] if not band or best <= 0 else (R["top"] if R["top"] in band else band[len(band) // 2])
        self.ramp_speed[key] = v
        return v

    def ramp_has_item(self, r, snap):
        """A pickup above the ramp's flight (within 12 tiles after it, above the road)."""
        for p in snap.get("pickups", []):
            if r["x"] + r["w"] <= p["x"] <= r["x"] + r["w"] + 12 * TILE and p["y"] < r["y"] - 2 * TILE:
                return True
        return False

    def hold(self, want, why, t):
        """Throttle hold: a state is kept at least HOLD_S; no gas <-> brake flip back within FLIP_S
        (except to dodge or for a Ferrari)."""
        urgent = why in ("dodge", "ferrari", "limo", "x7-gap")
        if want == self.throttle:
            return want
        if t - self.throttle_t < HOLD_S and not urgent:
            return self.throttle
        if want != 0 and self.last_dir and want != self.last_dir and t - self.last_dir_t < FLIP_S and not urgent:
            return 0 if self.throttle != 0 else self.throttle
        self.throttle, self.throttle_t = want, t
        if want != 0 and want != self.last_dir:
            self.last_dir, self.last_dir_t = want, t
        return want


def inputs(d):
    """A decision -> the two game steps' input sets."""
    base = {}
    if d["throttle"] > 0:
        base["right"] = 1
    elif d["throttle"] < 0:
        base["left"] = 1
    if d["fire"]:
        base["fire"] = 1
    if d["up"]:
        base["up"] = 1
    base["why"] = d["why"]
    first = dict(base)
    if d["hop"]:
        first["jump"] = 1
    return [first, dict(base)]


class RideAgent:
    """Plays reel 1 from the title poster to the ride's tally (then outro_s more seconds)."""

    def __init__(self, session, seed=1977, log=print):
        self.s, self.log = session, log
        self.rng = random.Random(seed)
        self.brain = RideBrain(self.rng, sim_hop=lambda vy0=None, gk=1, start=None: session.simulate_hop(vy0, gk, 150 if start else 90, start))
        self.report = {"levels": [], "victory": False, "game_over": False, "deaths": 0, "stuck": 0, "ride": True}
        self.lv = None
        self.rows, self.grids, self.names = [], {}, {}
        self.was_dead = False
        self.best_x, self.best_t = 0.0, 0.0
        self.hops = {}
        self.trace = None

    def begin(self, snap):
        idx = snap["levelIndex"]
        self.grids[idx], self.names[idx] = self.brain.grid, snap["level"]["name"]
        self.initial_pickups = {p["id"] for p in snap["pickups"]}
        self.lv = {"level": idx + 1, "name": snap["level"]["name"], "pickups": len(snap["pickups"]), "collected": 0,
                   "enemy_ids": set(), "cars": {}, "killed": 0, "deaths": 0, "time0": snap["time"], "time": 0.0,
                   "stuck": 0, "completed": False, "index": idx}
        self.best_x, self.best_t = snap["hero"]["x"], snap["time"]

    def track(self, snap):
        lv = self.lv
        if snap.get("enemies") is not None:
            for e in snap["enemies"]:
                if e["type"] in CARS and e["id"] not in lv["enemy_ids"]:
                    lv["enemy_ids"].add(e["id"])
                    lv["cars"][e["type"]] = lv["cars"].get(e["type"], 0) + 1
            left = {p["id"] for p in snap["pickups"]}
            lv["collected"] = len(self.initial_pickups - left)
            lv["alive"] = sorted("%s#%d@%d" % (e["type"], e["id"], e["x"] // TILE) for e in snap["enemies"])
        lv["killed"] = snap["kills"]
        lv["time"] = round(snap["time"] - lv["time0"], 1)
        lv["score"] = snap["score"]

    def finish(self, snap, completed):
        if self.lv and not self.lv.get("done"):
            self.track(snap)
            self.lv["completed"], self.lv["done"] = completed, True
            self.report["levels"].append(self.lv)

    def stall_check(self, snap, d):
        h = snap["hero"]
        if h["x"] > self.best_x + 8:
            self.best_x, self.best_t = h["x"], snap["time"]
            return
        waiting = d["why"] in ("limo", "finale", "ferrari", "dead") or snap["ride"]["finale"] or any(
            e["type"] == "limo" for e in snap["enemies"])
        if waiting:
            self.best_t = snap["time"]
        elif snap["time"] - self.best_t > 8.0:
            self.lv["stuck"] += 1
            self.report["stuck"] += 1
            self.log("  stuck at x %.0f (%s)" % (h["x"], d["why"]))
            self.best_t = snap["time"]

    def decide(self, snap):
        st = snap["state"]
        if snap.get("grid") is not None:          # the map, road and ramps come once (in the reel intro)
            self.brain.grid = snap["grid"]
            self.brain.road = snap.get("road") or self.brain.road
            self.brain.ramps = snap.get("ramps") if snap.get("ramps") is not None else self.brain.ramps
        if st == "TITLE":
            return [{"enter": 1}, {}] if snap["stateT"] > 3 else [{}, {}]
        if st == "LEVEL_COMPLETE":
            if self.lv and not self.lv.get("done"):
                self.finish(snap, True)
            return [{}, {}]
        if st != "PLAY":
            return [{}, {}]
        if self.lv is None:
            self.begin(snap)
        self.track(snap)
        h = snap["hero"]
        if h["dead"]:
            if not self.was_dead:
                self.was_dead = True
                self.lv["deaths"] += 1
                self.report["deaths"] += 1
            return [{}, {}]
        self.was_dead = False
        d = self.brain.decide(snap)
        self.stall_check(snap, d)
        if d["hop"]:
            self.hops[d["hop_why"]] = self.hops.get(d["hop_why"], 0) + 1
        if self.trace is not None:
            self.trace.append((round(snap["time"], 2), round(h["x"]), round(h["vx"]), h["hp"], d["throttle"], d["why"],
                               d["hop"] and d["hop_why"], d["fire"] and d["fire_why"], d["up"]))
        return inputs(d)

    def run(self, max_minutes=6, outro_s=2.5, on_progress=None):
        snap = self.s.snapshot(True)
        end_at, frames = None, 0
        while snap["time"] < max_minutes * 60 or snap["state"] == "TITLE":
            seq = self.decide(snap)
            snap = self.s.step(seq)
            frames += 1
            if on_progress and frames % 900 == 0:
                on_progress(frames, snap, self)
            if snap["state"] == "LEVEL_COMPLETE":
                if self.lv and not self.lv.get("done"):
                    self.finish(snap, True)
                if snap["tallyDone"] and end_at is None:
                    end_at = snap["time"] + outro_s
            if snap["state"] == "GAME_OVER" and end_at is None:
                end_at = snap["time"] + outro_s
                self.report["game_over"] = True
            if end_at is not None and snap["time"] >= end_at:
                break
            if frames % 300 == 0:
                self.rows += self.s.take_rows()
        self.rows += self.s.take_rows()
        if self.lv and not self.lv.get("done"):
            self.finish(snap, False)
        self.report["victory"] = bool(self.report["levels"] and self.report["levels"][-1]["completed"])
        self.report["frames"] = frames
        self.report["hops"] = dict(self.hops)
        return self.report


def dry_run_ride(browser="chrome", seed=1977, log=print, max_minutes=6, trace=False):
    from .metrics import run_metrics
    from .session import Session, RIDE_REEL
    with Session(browser=browser, seed=seed, log=log, first_reel=RIDE_REEL) as s:
        agent = RideAgent(s, seed=seed, log=log)
        if trace:
            agent.trace = []
        rep = agent.run(max_minutes=max_minutes, outro_s=0,
                        on_progress=lambda f, snap, a: log("  %4.0fs %s x %d hp %d score %d" % (
                            snap["time"], snap["state"], snap["hero"]["x"], snap["hero"]["hp"], snap["score"])))
        res = run_metrics(agent.rows, agent.grids)
        return {"report": rep, "rows": agent.rows, "grids": agent.grids, "names": agent.names,
                "victory": rep["victory"], "errors": s.errors, "metrics": res, "trace": agent.trace}
