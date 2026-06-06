"""Generate the Open Graph cover (1200x630) for the Watermark Stress Test.

Brand-consistent with the app: near-black background, cyan->blue accent, a faint
concentric-ring 'carrier' motif with a notch (the fragility), and a capability
strip advertising the interactive labs. Pure Pillow, deterministic, no network.

Run: python scripts/make_og.py  ->  public/og-cover.png
"""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG = (5, 5, 8)
CYAN = (34, 211, 238)
VIOLET = (167, 139, 250)
EMERALD = (52, 211, 153)
WHITE = (255, 255, 255)
MUTE = (148, 163, 184)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img, "RGBA")

def glow(cx, cy, r, color, a):
    for i in range(r, 0, -2):
        alpha = int(a * (i / r) ** 2)
        d.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(*color, max(0, 8 - alpha // 30)))

glow(120, 90, 360, (88, 28, 135), 60)       # purple top-left
glow(1090, 560, 380, (30, 58, 138), 60)     # blue bottom-right

# concentric carrier rings on the right + a notch wedge (fragility)
rcx, rcy = 1000, 300
for k in range(6, 76, 6):
    alpha = max(10, 66 - k)
    d.ellipse([rcx - k * 4, rcy - k * 4, rcx + k * 4, rcy + k * 4],
              outline=(34, 211, 238, alpha), width=2)
d.pieslice([rcx - 320, rcy - 320, rcx + 320, rcy + 320], -16, 16, fill=(5, 5, 8, 235))

def font(sz, bold=True):
    for c in (
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
    ):
        try:
            return ImageFont.truetype(c, sz)
        except Exception:
            continue
    return ImageFont.load_default()

PAD = 72

# eyebrow / badge
badge = "INTERACTIVE LAB · CONTENT PROVENANCE"
bf = font(21)
d.rounded_rectangle([PAD, 72, PAD + d.textlength(badge, font=bf) + 40, 72 + 40],
                    radius=10, fill=(34, 211, 238, 28), outline=(34, 211, 238, 120), width=1)
d.text((PAD + 20, 81), badge, font=bf, fill=CYAN)

# title (two lines)
tf = font(74)
d.text((PAD, 142), "Watermark", font=tf, fill=WHITE)
d.text((PAD, 222), "Stress Test", font=tf, fill=CYAN)

# subtitle
sf = font(28, bold=False)
d.text((PAD, 322), "See why AI content watermarks are fragile —", font=sf, fill=MUTE)
d.text((PAD, 358), "and why durable provenance needs C2PA.", font=sf, fill=MUTE)

# capability pills
pf = font(19)
pills = [
    ("Image · Text · Audio labs", CYAN),
    ("Sign vs. watermark (C2PA)", EMERALD),
    ("PSNR · SSIM · robustness", VIOLET),
]
x, y, ph = PAD, 430, 40
for label, col in pills:
    w = d.textlength(label, font=pf) + 34
    if x + w > W - PAD - 220:   # keep clear of the rings on the right
        x = PAD; y += ph + 12
    d.rounded_rectangle([x, y, x + w, y + ph], radius=ph // 2,
                        fill=(col[0], col[1], col[2], 26), outline=(col[0], col[1], col[2], 130), width=1)
    d.text((x + 17, y + 9), label, font=pf, fill=col)
    x += w + 14

# footer
d.line([PAD, 524, W - PAD, 524], fill=(255, 255, 255, 24), width=1)
ff = font(24)
d.text((PAD, 544), "Kinetic Gain", font=ff, fill=WHITE)
uf = font(24, bold=False)
url = "provenance-lab.kineticgain.com"
d.text((W - PAD - d.textlength(url, font=uf), 544), url, font=uf, fill=CYAN)

os.makedirs("public", exist_ok=True)
img.save("public/og-cover.png", "PNG")
print("wrote public/og-cover.png", img.size)
