"""Makes `agent` (tools/promo/agent) and the repo's tools importable from the tests."""
import sys
from pathlib import Path
PROMO = Path(__file__).resolve().parents[1]
ROOT = PROMO.parents[1]
for p in (str(PROMO), str(ROOT / "tools")):
    if p not in sys.path:
        sys.path.insert(0, p)
