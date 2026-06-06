"""Generate the Open Graph cover (1200x630) for the Watermark Robustness Lab.

Brand-consistent with the app: near-black background, cyan->blue accent,
a faint concentric-ring 'carrier' motif (the thing the lab is about), and a
clear, honest title. Pure Pillow, deterministic, no network.

Run: python scripts/make_og.py  ->  public/og-cover.png
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG = (5, 5, 8)
CYAN = (34, 211, 238)
WHITE = (255, 255, 255)
MUTE = (148, 163, 184)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img, "RGBA")

# --- soft radial glow blobs (matches the app's mesh background) ---
def glow(cx, cy, r, color, a):
    for i in range(r, 0, -2):
        alpha = int(a * (i / r) ** 2)
        d.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(*color, max(0, 8 - alpha // 30)))

glow(120, 90, 360, (88, 28, 135), 60)      # purple top-left
glow(1090, 560, 380, (30, 58, 138), 60)    # blue bottom-right

# --- concentric carrier rings on the right (the 'watermark' motif) ---
rcx, rcy = 980, 315
for k in range(6, 78, 6):
    alpha = max(10, 70 - k)
    d.ellipse([rcx - k * 4, rcy - k * 4, rcx + k * 4, rcy + k * 4],
              outline=(34, 211, 238, alpha), width=2)
# a 'notch' wedge cut through the rings -> signals fragility
d.pieslice([rcx - 320, rcy - 320, rcx + 320, rcy + 320], -18, 18, fill=(5, 5, 8, 235))

def font(sz, bold=True):
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
    ]
    for c in candidates:
        try:
            return ImageFont.truetype(c, sz)
        except Exception:
            continue
    return ImageFont.load_default()

PAD = 72

# --- eyebrow / badge ---
badge = "EDUCATIONAL · PROVENANCE ROBUSTNESS"
bf = font(22)
d.rounded_rectangle([PAD, 84, PAD + d.textlength(badge, font=bf) + 40, 84 + 42],
                    radius=10, fill=(34, 211, 238, 28), outline=(34, 211, 238, 120), width=1)
d.text((PAD + 20, 94), badge, font=bf, fill=CYAN)

# --- title (two lines) ---
tf = font(76)
d.text((PAD, 168), "Watermark", font=tf, fill=WHITE)
d.text((PAD + d.textlength("Watermark ", font=tf), 168), "Robustness", font=tf, fill=CYAN)
d.text((PAD, 256), "Lab", font=tf, fill=WHITE)

# --- subtitle ---
sf = font(31, bold=False)
sub1 = "Why AI content watermarks are fragile —"
sub2 = "and the case for cryptographic provenance (C2PA)."
d.text((PAD, 372), sub1, font=sf, fill=MUTE)
d.text((PAD, 414), sub2, font=sf, fill=MUTE)

# --- footer line ---
ff = font(24)
d.text((PAD, 520), "Kinetic Gain", font=ff, fill=WHITE)
uf = font(24, bold=False)
url = "provenance-lab.kineticgain.com"
d.text((W - PAD - d.textlength(url, font=uf), 520), url, font=uf, fill=CYAN)
d.line([PAD, 506, W - PAD, 506], fill=(255, 255, 255, 24), width=1)

os.makedirs("public", exist_ok=True)
img.save("public/og-cover.png", "PNG")
print("wrote public/og-cover.png", img.size)
