"""Optimize Raw Base Canvas presets: square center-crop -> 512px -> optimized JPG.

Drop the three Higgsfield exports into public/presets/ named portrait.*,
cityscape.*, gradient.* (any image extension), then run this.

Run: python scripts/optimize_presets.py
"""
import glob, os
from PIL import Image

SIZE = 512
BASE = "public/presets"
NAMES = ["portrait", "cityscape", "gradient"]
EXTS = (".png", ".jpg", ".jpeg", ".webp")

for n in NAMES:
    srcs = [s for s in glob.glob(f"{BASE}/{n}.*") if os.path.splitext(s)[1].lower() in EXTS]
    if not srcs:
        print("MISSING source for", n)
        continue
    src = srcs[0]
    im = Image.open(src).convert("RGB")
    w, h = im.size
    m = min(w, h)
    im = im.crop(((w - m) // 2, (h - m) // 2, (w - m) // 2 + m, (h - m) // 2 + m)).resize((SIZE, SIZE), Image.LANCZOS)
    out = f"{BASE}/{n}.jpg"
    im.save(out, "JPEG", quality=82, optimize=True)
    print("wrote", out, os.path.getsize(out), "bytes")
    if os.path.abspath(src).lower() != os.path.abspath(out).lower():
        os.remove(src)
