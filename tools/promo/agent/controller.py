"""Motion control: turns the tactics' intent into per-step game inputs, like a careful human.

Rules (spec "Human-like control", "Purposeful actions"):
  - every horizontal input, jump and shot carries a reason; the bridge logs it per step
  - a new horizontal direction is held for at least 200 ms (12 steps) unless the reason is a dodge
  - jumps are only executed as complete plans: a route jump (planned with the game's own
    physics via the bridge), a dodge hop, a vault over a crayfish, a jump for a pickup
  - fire comes in bursts of 3-6 shots, only while a hittable target is in line
  - route following steers through consecutive walk moves without stopping at every tile
"""
from .nav import TILE, Nav

HOLD_STEPS = 12                 # 200 ms at 60 steps/s
SETTLE_STEPS = 60               # no turning back within 1 s of starting a direction (stand instead)
DODGE_STEPS = 21                # a back-off is kept for at least 350 ms (no flickering in and out)
STEPS_PER_DECISION = 2          # one decision per video frame (30 fps)

# jump search space (same as the proven JS planner): pre-run steps, direction, jump hold,
# horizontal start delay, horizontal release
HOLDS = [40, 22, 16, 12, 8, 5, 2]
DELAYS = [0, 3, 6, 10, 14]
RELEASES = [999, 30, 22, 16, 10]


def plan_steps(params, why):
    """Expands jump parameters [pre, dir, J, D, R] into per-step inputs (until landing + 1 step)."""
    pre, d, J, D, R, frames = params
    steps = []
    for f in range(frames):
        t = f - pre
        inp = {"jump": 1 if 0 <= t < J else 0, "why": why}
        if f < pre or D <= t < R:
            if d > 0:
                inp["right"] = 1
            elif d < 0:
                inp["left"] = 1
        steps.append(inp)
    steps.append({"why": why})
    return steps


class Controller:
    def __init__(self, session, rng):
        self.session, self.rng = session, rng
        self.plan = []            # queued per-step inputs (jump plans), executed exactly
        self.plan_why = ""
        self.dir, self.dir_why, self.dir_steps = 0, "", 0
        self.burst_left, self.pause_steps = 0, 0
        self.actions = []         # (game time, action, reason) for the run report
        self.t = 0.0

    # ---- plans ----
    def busy(self):
        return bool(self.plan)

    def start_plan(self, steps, why):
        self.plan = list(steps)
        self.plan_why = why
        self.actions.append((self.t, "jump", why))

    def find_jump(self, move, world, max_frames=150):
        """Input plan that carries the hero along a jump move, or None (one bridge call)."""
        tgt, d = move["to"], move["dir"]
        pres = [0, 4, 8] if d else [0]
        dirs = [d] if d else [0, -1, 1]
        cands = []
        for pre in pres:
            for dd in dirs:
                for J in HOLDS:
                    for D in DELAYS:
                        for R in RELEASES:
                            if not dd and (D or R != 999):
                                continue
                            cands.append([pre, dd, J, D, R])
        res = self.session.simulate_jumps(cands, max_frames)
        for c, r in zip(cands, res):
            if r and not r[4] and r[0] == tgt[0] and r[1] == tgt[1] and abs(r[2]) < 7:
                return plan_steps(c + [r[3]], "route-jump")
        return None

    def hop_steps(self, why="dodge"):
        return [{"jump": 1 if i < 28 else 0, "why": why} for i in range(48)]

    def vault(self, d, world):
        """A full jump forward (over a crayfish): accepted if it lands dry, at most 3 tiles lower."""
        res = self.session.simulate_jumps([[0, d, 30, 0, 999]], 90)[0]
        if not res or res[4]:
            return None
        if (res[1] - world.node()[1]) > 3:
            return None
        return plan_steps([0, d, 30, 0, 999, res[3]], "vault")

    # ---- per decision ----
    def emit(self, want, world):
        """want: {dir, why, up, down, fire, fire_why}. Returns the inputs for the next two steps."""
        self.t = world.s["time"]
        out = []
        for _ in range(STEPS_PER_DECISION):
            if self.plan:
                inp = dict(self.plan.pop(0))
                d = (1 if inp.get("right") else 0) - (1 if inp.get("left") else 0)
                self.note_dir(d, inp.get("why", self.plan_why), force=True)
            else:
                inp = self.steer(want)
            d = (1 if inp.get("right") else 0) - (1 if inp.get("left") else 0)
            turning = d and d != world.hero["face"]          # the shot would leave the other way
            if want.get("fire") and not turning and self.fire_ok():
                inp["fire"] = 1
                inp["fire_why"] = want.get("fire_why", "target")
            out.append(inp)
        return out

    def steer(self, want):
        d, why = want.get("dir", 0), want.get("why", "")
        # commitment: don't flip a fresh direction unless dodging; finish a started back-off
        if self.dir and self.dir_why == "dodge" and self.dir_steps < DODGE_STEPS and why != "dodge":
            d, why = self.dir, self.dir_why
        elif d and self.dir and d != self.dir and self.dir_steps < HOLD_STEPS and why != "dodge":
            d, why = self.dir, self.dir_why
        elif why != "dodge" and not self.can_turn(d):
            d, why = 0, "settle"          # changed its mind: stop and settle, then turn
        self.note_dir(d, why)
        inp = {"why": why}
        if d > 0:
            inp["right"] = 1
        elif d < 0:
            inp["left"] = 1
        if want.get("up"):
            inp["up"] = 1
        if want.get("down"):
            inp["down"] = 1
        if want.get("jump"):              # single-step jump presses (leaving a ladder sideways)
            inp["jump"] = 1
        return inp

    def can_turn(self, d):
        """True unless d reverses a direction started less than 1 s ago."""
        return not d or not self.dir or d == self.dir or self.dir_steps >= SETTLE_STEPS

    def note_dir(self, d, why, force=False):
        if d and d != self.dir:
            if self.dir:
                self.actions.append((self.t, "turn", why))
            self.dir, self.dir_why, self.dir_steps = d, why, 0
        elif d:
            self.dir_steps += 1
        else:
            self.dir_steps += 1

    def fire_ok(self):
        """Bursts of 3-6 shots with short pauses."""
        if self.pause_steps > 0:
            self.pause_steps -= 1
            return False
        if self.burst_left <= 0:
            self.burst_left = self.rng.randint(3, 6) * 12          # ~ shots at 5/s -> 12 steps each
        self.burst_left -= 1
        if self.burst_left <= 0:
            self.pause_steps = self.rng.randint(12, 24)
        return True


class Follower:
    """Executes a route (list of nav moves) closed-loop; jumps via planned input sequences."""

    def __init__(self):
        self.moves, self.move, self.t = [], None, 0.0

    def set_route(self, moves):
        self.moves, self.move, self.t = list(moves), None, 0.0

    def done(self):
        return not self.move and not self.moves

    def current(self):
        return self.move

    def want(self, world, ctrl):
        """Returns a want dict for the controller (or starts a jump plan)."""
        h = world.hero
        if not self.move:
            if not self.moves:
                return {"dir": 0, "why": "route"}
            self.move, self.t = self.moves.pop(0), 0.0
            if self.move["type"] == "climb":     # merge consecutive climbs in the same direction
                while self.moves and self.moves[0]["type"] == "climb" and self.moves[0]["dir"] == self.move["dir"] \
                        and self.moves[0]["from"][0] == self.move["from"][0]:
                    self.move = dict(self.move, to=self.moves.pop(0)["to"])
        m = self.move
        self.t += 1 / 30
        if self.t > 5:
            self.move = None
            return {"dir": 0, "why": "route", "timeout": True}
        cx, node = world.cx(), world.node()
        tx = m["to"][0] * TILE + 8
        if m["type"] in ("walk", "drop"):
            if m.get("off_ladder") and h["climbing"]:
                return {"dir": m["dir"], "why": "route", "jump": True}
            nxt = self.moves[0] if self.moves else None
            through = nxt and nxt["type"] in ("walk", "drop") and nxt["dir"] == m["dir"]
            dx = tx - cx
            # arrived: on the target cell and near its centre, or just past it (no turning back
            # to correct a few pixels of overshoot)
            if h["onGround"] and node == m["to"] and (through or abs(dx) <= 6 or (dx > 0) != (m["dir"] > 0)):
                self.move = None
                return self.want(world, ctrl) if through else {"dir": 0, "why": "route"}
            if abs(dx) <= 2 and h["onGround"]:
                return {"dir": 0, "why": "route"}
            return {"dir": 1 if dx > 0 else -1, "why": "route"}
        if m["type"] == "climb":
            lx = m["from"][0] * TILE + 8
            if not h["climbing"] and h["onGround"] and node == m["to"] and self.t > 0.05:
                self.move = None
                return {"dir": 0, "why": "route"}
            if not h["climbing"] and abs(cx - lx) > 6:      # the game snaps him onto the ladder column
                return {"dir": 1 if cx < lx else -1, "why": "route"}
            if h["climbing"] and node[1] == m["to"][1] and abs(h["y"] + h["h"] - (m["to"][1] + 1) * TILE) < 3:
                self.move = None
                return {"dir": 0, "why": "route"}
            return {"dir": 0, "why": "route", "up": m["dir"] < 0, "down": m["dir"] > 0}
        if m["type"] == "jump":
            fx = m["from"][0] * TILE + 8
            if not h["climbing"]:
                if not h["onGround"]:
                    return {"dir": 0, "why": "route"}
                if abs(cx - fx) <= 8 and not ctrl.can_turn(m["dir"]):
                    return {"dir": 0, "why": "route"}      # settle before jumping back the other way
                # the physics check starts from Buck's real position and speed, so first try to
                # jump from where he is (no walking back to the exact take-off pixel)
                if abs(cx - fx) <= 8 and not m.get("aligned_try"):
                    steps = ctrl.find_jump(m, world)
                    if steps:
                        self.move = None
                        ctrl.start_plan(steps, "route-jump")
                        return {"dir": 0, "why": "route-jump"}
                    m["aligned_try"] = True
                if abs(cx - fx) > 2:
                    return {"dir": 1 if cx < fx else -1, "why": "route"}
                if abs(h["vx"]) > 1:
                    return {"dir": 0, "why": "route"}
            steps = ctrl.find_jump(m, world)
            self.move = None
            if steps is None:
                return {"dir": 0, "why": "route", "failed": m}
            ctrl.start_plan(steps, "route-jump")
            return {"dir": 0, "why": "route-jump"}
        self.move = None
        return {"dir": 0, "why": "route"}


def edge_key(m):
    return (m["from"], m["to"])


__all__ = ["Controller", "Follower", "plan_steps", "edge_key", "Nav"]
