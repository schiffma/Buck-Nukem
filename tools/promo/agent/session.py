"""Playwright session: runs the unmodified built game plus the thin bridge in Chrome or Edge.

The page is an in-memory copy of dist/buck_nukem.html with
  - a seeding prelude before the game script (deterministic Math.random from the first line),
  - tools/promo/bridge.js injected in place
    of the final boot() call, inside the game's script scope.
Playwright launches and drives the browser (every game step is a Playwright call). The page
and the frame/audio uploads go through a tiny local HTTP server on 127.0.0.1: serving them
through page.route() was measured at 26 captured frames/s (a full run would take ~9 min just
to capture) versus ~170 frames/s through a local server. Nothing is written to disk.
"""
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import atexit
from pathlib import Path

from playwright.sync_api import sync_playwright

_PW = None


def playwright():
    """One Playwright driver per process (the sync API can only be started once per thread)."""
    global _PW
    if _PW is None:
        _PW = sync_playwright().start()
        atexit.register(_PW.stop)
    return _PW

PROMO = Path(__file__).resolve().parents[1]
ROOT = PROMO.parents[1]
GAME = ROOT / "dist" / "buck_nukem.html"
CHANNELS = {"chrome": "chrome", "edge": "msedge"}
FRAME_BYTES = 320 * 240 * 4

SEED_PRELUDE = """<link rel="icon" href="data:,">
<script>(function () {
  var a = %d >>> 0 || 1;
  Math.random = function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();</script>
"""


def page_html(seed):
    html = GAME.read_text(encoding="utf-8")
    marker = "\nboot();\n"
    i = html.rfind(marker)
    if i < 0:
        raise RuntimeError("injection point 'boot();' not found in dist/buck_nukem.html")
    inject = "\n"
    inject += (PROMO / "bridge.js").read_text(encoding="utf-8") + "\n"
    html = html[:i] + inject + html[i + len(marker):]
    j = html.find("<script")
    return html[:j] + (SEED_PRELUDE % seed) + html[j:]


class Session:
    def __init__(self, browser="chrome", seed=1977, headless=True,
                 on_frame=None, on_audio=None, log=print):
        self.browser_name, self.seed = browser, seed
        self.headless, self.on_frame, self.on_audio, self.log = headless, on_frame, on_audio, log
        self.errors = []
        self._browser = self.page = self._server = None
        self.origin = None

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, *exc):
        self.close()

    def start(self):
        html = page_html(self.seed)
        self._browser = playwright().chromium.launch(channel=CHANNELS[self.browser_name], headless=self.headless,
                                                 args=["--autoplay-policy=no-user-gesture-required"])
        self.page = self._browser.new_page(viewport={"width": 640, "height": 480})
        self.page.on("pageerror", lambda e: (self.errors.append(str(e)), self.log("PAGE ERROR: %s" % e)))
        self.page.on("console", lambda m: m.type == "error" and self.log("console error: %s" % m.text))
        body = html.encode("utf-8")
        sess, lock = self, threading.Lock()

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def do_GET(self):
                if self.path.split("?")[0] in ("/", "/index.html"):
                    self.send_response(200)
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                else:
                    self.send_response(204)
                    self.end_headers()

            def do_POST(self):
                data = self.rfile.read(int(self.headers.get("Content-Length", 0)))
                path = self.path.split("?")[0]
                with lock:
                    if path == "/frame" and sess.on_frame:      # a batch of raw 320x240 RGBA frames
                        first, size = int(self.path.split("i=")[1]), FRAME_BYTES
                        for k in range(len(data) // size):
                            sess.on_frame(first + k, data[k * size:(k + 1) * size])
                    elif path == "/audio" and sess.on_audio:
                        sess.on_audio(data)
                self.send_response(204)
                self.end_headers()

        self._server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=self._server.serve_forever, daemon=True).start()
        self.origin = "http://127.0.0.1:%d" % self._server.server_address[1]
        self.page.goto(self.origin + "/")
        self.page.evaluate("() => PromoBridge.boot()")
        return self.snapshot(True)

    def close(self):
        if self._browser:
            self._browser.close()
        if self._server:
            self._server.shutdown()
            self._server.server_close()
        self._browser = self._server = None

    # ---- bridge calls (one evaluate each) ----
    def snapshot(self, full=False):
        return self.page.evaluate("(f) => PromoBridge.snapshot(f)", full)

    def step(self, seq, full=False):
        """seq: list of per-step input dicts, e.g. [{"right": 1, "why": "route"}, {}]."""
        return self.page.evaluate("([seq, f]) => PromoBridge.step(seq, f)", [seq, full])

    def simulate_jumps(self, cands, max_frames=150):
        return self.page.evaluate("([c, m]) => PromoBridge.simulateJumps(c, m)", [cands, max_frames])

    def take_rows(self):
        return self.page.evaluate("() => PromoBridge.takeRows()")

    def start_recording(self, fps):
        return self.page.evaluate("(o) => PromoBridge.startRecording(o)", {"fps": fps, "sink": self.origin})

    def flush(self):
        return self.page.evaluate("() => PromoBridge.flush()")

    def finish_recording(self, with_audio=True):
        return self.page.evaluate("(a) => PromoBridge.finishRecording(a)", with_audio)
