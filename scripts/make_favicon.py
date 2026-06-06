"""Render the Signal Seal favicon (from the brand kit) to PNG sizes.

Concentric detection rings (signal degrading outward) + lime survived-core +
red attack node. Sheds rings as it shrinks, per the brand spec. Supersampled
4x then downscaled for clean anti-aliasing. Pure Pillow.

Run: python scripts/make_favicon.py  ->  public/favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png
"""
import math
from PIL import Image, ImageDraw

INK = (13, 15, 19)
PAPER = (243, 239, 230)
SIGNAL = (203, 242, 76)
ATTACK = (255, 74, 46)
FAINT = tuple(round(p * 0.45 + i * 0.55) for p, i in zip(PAPER, INK))  # paper @45% over ink

def dashed_ring(d, cx, cy, r, width, color, dashes, gap):
    seg = 360 / dashes
    dash = seg * (1 - gap)
    for i in range(dashes):
        s = i * seg
        d.arc([cx - r, cy - r, cx + r, cy + r], s, s + dash, fill=color, width=width)

def render(px, shed):
    SS = 4
    C = px * SS
    img = Image.new("RGBA", (C, C), INK + (255,))
    d = ImageDraw.Draw(img)
    cx = cy = C / 2
    Rout = C * 0.30
    sc = Rout / 48
    r_in = Rout * (20 / 48)
    r_mid = Rout * (34 / 48)

    if shed == "full":
        d.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in], outline=PAPER, width=max(2, round(5 * sc)))
        dashed_ring(d, cx, cy, r_mid, max(2, round(5 * sc)), PAPER, 7, 0.32)
        dashed_ring(d, cx, cy, Rout, max(1, round(4 * sc)), FAINT, 11, 0.55)
        nr = 4.5 * sc
        nx = cx + r_mid * math.cos(math.radians(-45))
        ny = cy + r_mid * math.sin(math.radians(-45))
        d.ellipse([nx - nr, ny - nr, nx + nr, ny + nr], fill=ATTACK)
        core = r_in * 0.40
    elif shed == "mid":
        d.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in], outline=PAPER, width=max(3, round(6 * sc)))
        dashed_ring(d, cx, cy, r_mid, max(3, round(6 * sc)), PAPER, 6, 0.35)
        core = r_in * 0.42
    else:  # min
        d.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in], outline=PAPER, width=max(4, round(9 * sc)))
        core = r_in * 0.48

    d.ellipse([cx - core, cy - core, cx + core, cy + core], fill=SIGNAL)
    return img.resize((px, px), Image.LANCZOS).convert("RGB")

OUT = [
    ("public/favicon-32.png", 32, "mid"),
    ("public/apple-touch-icon.png", 180, "full"),
    ("public/icon-192.png", 192, "full"),
    ("public/icon-512.png", 512, "full"),
]
for path, px, shed in OUT:
    render(px, shed).save(path, "PNG", optimize=True)
    print("wrote", path, f"({px}px, {shed})")
