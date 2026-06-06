"""Generate the brand social set (Signal Seal + Space Grotesk/Mono + brand palette)
with OUR copy. og-cover -> public/ (deployed); the rest -> marketing/social/.

Run: python scripts/make_socials.py
"""
import math, os
from PIL import Image, ImageDraw, ImageFont

INK = (13, 15, 19)
PAPER = (243, 239, 230)
SIGNAL = (0, 229, 255)
SIGNAL_DEEP = (6, 125, 151)
ATTACK = (255, 74, 46)
MUTE = (138, 143, 153)
FAINT = tuple(round(p * 0.45 + i * 0.55) for p, i in zip(PAPER, INK))
FD = ".fonts"

def grotesk(sz, weight=700):
    f = ImageFont.truetype(f"{FD}/SpaceGrotesk.ttf", sz)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f

def mono(sz, bold=True):
    return ImageFont.truetype(f"{FD}/SpaceMono-{'Bold' if bold else 'Regular'}.ttf", sz)

def tw(d, t, f):
    return d.textlength(t, font=f)

def dashed(d, cx, cy, r, w, color, dashes, gap):
    seg = 360 / dashes
    for i in range(dashes):
        s = i * seg
        d.arc([cx - r, cy - r, cx + r, cy + r], s, s + seg * (1 - gap), fill=color, width=w)

def seal(px, node=True):
    SS = 3
    C = px * SS
    im = Image.new("RGBA", (C, C), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = cy = C / 2
    Rout = C * 0.42
    sc = Rout / 48
    r_in, r_mid = Rout * 20 / 48, Rout * 34 / 48
    d.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in], outline=PAPER, width=max(2, round(5 * sc)))
    dashed(d, cx, cy, r_mid, max(2, round(5 * sc)), PAPER, 7, 0.32)
    dashed(d, cx, cy, Rout, max(1, round(4 * sc)), FAINT, 11, 0.55)
    if node:
        nr = 4.5 * sc
        nx = cx + r_mid * math.cos(math.radians(-45))
        ny = cy + r_mid * math.sin(math.radians(-45))
        d.ellipse([nx - nr, ny - nr, nx + nr, ny + nr], fill=ATTACK)
    cr = 7.5 * sc
    d.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=SIGNAL)
    return im.resize((px, px), Image.LANCZOS)

def glow(img, cx, cy, r, color, a=70):
    d = ImageDraw.Draw(img, "RGBA")
    for i in range(r, 0, -3):
        alpha = int(a * (i / r) ** 2)
        d.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(*color, max(0, 7 - alpha // 26)))

def base(w, h):
    img = Image.new("RGB", (w, h), INK)
    glow(img, int(w * 0.08), int(h * 0.1), int(h * 0.7), (88, 28, 135))
    glow(img, int(w * 0.95), int(h * 0.95), int(h * 0.7), (30, 58, 138))
    return img

OUT_PUB = "public"
OUT_SOC = "marketing/social"
os.makedirs(OUT_SOC, exist_ok=True)

# ---- OG / link preview 1200x630 (deployed) ----
def og():
    W, H = 1200, 630
    img = base(W, H)
    d = ImageDraw.Draw(img, "RGBA")
    img.paste(seal(300), (W - 300 - 70, (H - 300) // 2), seal(300))
    PAD = 72
    eb = mono(20)
    d.text((PAD, 84), "INTERACTIVE LAB · CONTENT PROVENANCE", font=eb, fill=SIGNAL)
    t = grotesk(80)
    d.text((PAD, 150), "Watermark", font=t, fill=PAPER)
    d.text((PAD, 240), "Stress Test", font=t, fill=SIGNAL)
    s = grotesk(30, 500)
    d.text((PAD, 360), "Why AI content watermarks are fragile —", font=s, fill=MUTE)
    d.text((PAD, 400), "and the case for cryptographic provenance (C2PA).", font=s, fill=MUTE)
    # pills
    pf = mono(18)
    x, y = PAD, 470
    for label, col in [("image · text · audio", SIGNAL), ("sign vs. watermark", ATTACK), ("PSNR · SSIM · curves", PAPER)]:
        w = tw(d, label, pf) + 30
        d.rounded_rectangle([x, y, x + w, y + 38], radius=19, outline=(*col, 150), width=1)
        d.text((x + 15, y + 9), label, font=pf, fill=col)
        x += w + 13
    d.line([PAD, 548, W - PAD, 548], fill=(255, 255, 255, 26), width=1)
    ff = mono(22)
    d.text((PAD, 568), "Kinetic Gain", font=ff, fill=PAPER)
    url = "provenance-lab.kineticgain.com"
    d.text((W - PAD - tw(d, url, mono(22, False)), 568), url, font=mono(22, False), fill=SIGNAL)
    img.save(f"{OUT_PUB}/og-cover.png", "PNG")
    print("og-cover.png")

# ---- avatar 400x400 ----
def avatar():
    img = base(400, 400)
    img.paste(seal(248), (76, 76), seal(248))
    img.save(f"{OUT_SOC}/social-avatar.png", "PNG")
    print("social-avatar.png")

# ---- X header 1500x500 ----
def xheader():
    W, H = 1500, 500
    img = base(W, H)
    d = ImageDraw.Draw(img, "RGBA")
    img.paste(seal(270), (W - 270 - 110, (H - 270) // 2), seal(270))
    d.text((90, 150), "CONTENT PROVENANCE · EDUCATIONAL", font=mono(18), fill=SIGNAL)
    d.text((90, 188), "WATERMARK", font=grotesk(72), fill=PAPER)
    t2 = grotesk(72)
    d.text((90, 268), "STRESS TEST", font=t2, fill=SIGNAL)
    d.text((90, 360), "Why AI watermarks are fragile — and what proves origin.", font=mono(20, False), fill=MUTE)
    img.save(f"{OUT_SOC}/social-x-header.png", "PNG")
    print("social-x-header.png")

# ---- LinkedIn banner 1584x396 ----
def linkedin():
    W, H = 1584, 396
    img = base(W, H)
    d = ImageDraw.Draw(img, "RGBA")
    img.paste(seal(230), (W - 230 - 120, (H - 230) // 2), seal(230))
    d.text((100, 96), "// CONTENT PROVENANCE, MEASURED", font=mono(18), fill=ATTACK)
    d.text((100, 138), "Watermark Stress Test", font=grotesk(64), fill=PAPER)
    d.text((100, 232), "Hidden AI watermarks break. C2PA is the fix.", font=mono(19, False), fill=MUTE)
    img.save(f"{OUT_SOC}/social-linkedin-banner.png", "PNG")
    print("social-linkedin-banner.png")

# ---- GitHub social 1280x640 ----
def github():
    W, H = 1280, 640
    img = base(W, H)
    d = ImageDraw.Draw(img, "RGBA")
    sp = seal(92)
    img.paste(sp, (96, 92), sp)
    d.text((96 + 116, 116), "mizcausevic-dev / watermark-stress-test", font=mono(24), fill=MUTE)
    d.text((96, 250), "Watermark", font=grotesk(92), fill=PAPER)
    d.text((96, 350), "Stress Test", font=grotesk(92), fill=SIGNAL)
    d.text((96, 510), "Interactive lab on watermark fragility — and the case for C2PA.", font=mono(24, False), fill=MUTE)
    img.save(f"{OUT_SOC}/social-github.png", "PNG")
    print("social-github.png")

og(); avatar(); xheader(); linkedin(); github()
print("done")
