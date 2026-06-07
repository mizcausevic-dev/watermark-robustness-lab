"""Generate the brand social set in Claude Design's v1 layouts, with the CORRECT
wordmark ("Watermark Stress Test" / short code "WST" — NOT the retired
"Watermark Robustness Lab" / "WRL", which collides with the academic WRT toolbox).

Signal Seal + Space Grotesk/Mono + brand palette (aqua #00E5FF).
og-cover -> public/ (deployed). The rest -> marketing/social/.

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


def fit(d, text, maxw, start, weight=700, minsz=40):
    """Largest grotesk size whose rendered width <= maxw."""
    sz = start
    while sz > minsz:
        f = grotesk(sz, weight)
        if d.textlength(text, font=f) <= maxw:
            return f, sz
        sz -= 2
    return grotesk(minsz, weight), minsz


def tracked(d, xy, text, font, fill, track=0):
    """Draw text with extra per-character spacing (poor-man letter-spacing)."""
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + track
    return x


def runs(d, xy, segments, font):
    """Draw [(text, color), ...] inline, advancing x."""
    x, y = xy
    for t, c in segments:
        d.text((x, y), t, font=font, fill=c)
        x += d.textlength(t, font=font)
    return x


def dashed(d, cx, cy, r, w, color, dashes, gap):
    seg = 360 / dashes
    for i in range(dashes):
        s = i * seg
        d.arc([cx - r, cy - r, cx + r, cy + r], s, s + seg * (1 - gap), fill=color, width=w)


def seal(px, node=True, ring=PAPER, faint=FAINT, core=SIGNAL, nodecol=ATTACK):
    """The Signal Seal mark. Colors are themeable so it reads on ink OR on cyan."""
    SS = 3
    C = px * SS
    im = Image.new("RGBA", (C, C), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = cy = C / 2
    Rout = C * 0.42
    sc = Rout / 48
    r_in, r_mid = Rout * 20 / 48, Rout * 34 / 48
    d.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in], outline=ring, width=max(2, round(5 * sc)))
    dashed(d, cx, cy, r_mid, max(2, round(5 * sc)), ring, 7, 0.32)
    dashed(d, cx, cy, Rout, max(1, round(4 * sc)), faint, 11, 0.55)
    if node:
        nr = 4.5 * sc
        nx = cx + r_mid * math.cos(math.radians(-45))
        ny = cy + r_mid * math.sin(math.radians(-45))
        d.ellipse([nx - nr, ny - nr, nx + nr, ny + nr], fill=nodecol)
    cr = 7.5 * sc
    d.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=core)
    return im.resize((px, px), Image.LANCZOS)


def glow(img, cx, cy, r, color, a=70):
    d = ImageDraw.Draw(img, "RGBA")
    for i in range(r, 0, -3):
        alpha = int(a * (i / r) ** 2)
        d.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(*color, max(0, 7 - alpha // 26)))


def ink_base(w, h):
    img = Image.new("RGB", (w, h), INK)
    glow(img, int(w * 0.08), int(h * 0.1), int(h * 0.7), (88, 28, 135))
    glow(img, int(w * 0.95), int(h * 0.95), int(h * 0.7), (30, 58, 138))
    return img


def sine(d, x0, x1, cy, amp, color, w, periods=1.0, steps=64):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        x = x0 + (x1 - x0) * t
        y = cy + amp * math.sin(t * periods * 2 * math.pi)
        pts.append((x, y))
    d.line(pts, fill=color, width=w, joint="curve")


def audio_glyph(d, cx, cy, scale=1.0):
    """∿ |||| ∿  — teal sine waves flanking equalizer bars; one bar is attack-red."""
    s = scale
    sine(d, cx - 170 * s, cx - 95 * s, cy, 20 * s, SIGNAL_DEEP, max(4, round(6 * s)), periods=1.0)
    heights = [44, 78, 104, 66, 40]
    redidx = 2
    bw = max(5, round(8 * s))
    gap = 18 * s
    total = len(heights) * gap
    x = cx - total / 2 + gap / 2
    for i, h in enumerate(heights):
        hh = h * s
        col = ATTACK if i == redidx else INK
        d.rounded_rectangle([x - bw / 2, cy - hh / 2, x + bw / 2, cy + hh / 2], radius=bw / 2, fill=col)
        x += gap
    sine(d, cx + 95 * s, cx + 170 * s, cy, 20 * s, SIGNAL_DEEP, max(4, round(6 * s)), periods=1.0)


OUT_PUB = "public"
OUT_SOC = "marketing/social"
os.makedirs(OUT_SOC, exist_ok=True)


# ---- #1 Cyan OG / share card 1200x630 (deployed) ----
def og():
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), SIGNAL)
    d = ImageDraw.Draw(img, "RGBA")
    PAD = 92
    lbl = mono(24)
    tracked(d, (PAD, 96), "WATERMARK_STRESS_TEST", lbl, INK, track=2)
    v = "v1.0"
    d.text((W - PAD - tw(d, v, lbl), 96), v, font=lbl, fill=(*INK, 150))
    # headline (two lines, fixed size for breathing room)
    f1 = grotesk(116)
    d.text((PAD, 172), "Does the", font=f1, fill=INK)
    d.text((PAD, 172 + 128), "mark survive?", font=f1, fill=INK)
    # tagline
    tag = mono(26)
    d.text((PAD, 486), "Hidden watermarks break. C2PA holds.", font=tag, fill=(*INK, 175))
    # dark seal bottom-right
    dk = seal(146, ring=INK, faint=(*INK, 120), core=INK, nodecol=ATTACK)
    img.paste(dk, (W - 146 - 78, H - 146 - 70), dk)
    img.save(f"{OUT_PUB}/og-cover.png", "PNG")
    print("public/og-cover.png  (cyan share card)")


# ---- #2 GitHub social 1280x640 ----
def github():
    W, H = 1280, 640
    img = ink_base(W, H)
    # faint WST diagonal tiling
    wm = Image.new("RGBA", (int(W * 1.5), int(H * 1.5)), (0, 0, 0, 0))
    wd = ImageDraw.Draw(wm)
    wf = mono(34)
    for row, yy in enumerate(range(0, wm.height, 150)):
        xoff = -120 if row % 2 else 0
        for xx in range(xoff, wm.width, 230):
            tracked(wd, (xx, yy), "WST · ", wf, (*PAPER, 12), track=4)
    wm = wm.rotate(18, expand=False, resample=Image.BICUBIC)
    img.paste(wm.crop((int(W * 0.25), int(H * 0.25), int(W * 0.25) + W, int(H * 0.25) + H)), (0, 0), wm.crop((int(W * 0.25), int(H * 0.25), int(W * 0.25) + W, int(H * 0.25) + H)))
    d = ImageDraw.Draw(img, "RGBA")
    sp = seal(92)
    img.paste(sp, (96, 92), sp)
    runs(d, (96 + 116, 116), [("provenance-lab", MUTE), (" / ", FAINT), ("watermark-stress-test", PAPER)], mono(26))
    d.text((96, 252), "Watermark", font=grotesk(94), fill=PAPER)
    d.text((96, 352), "Stress Test", font=grotesk(94), fill=PAPER)
    runs(d, (96, 516),
         [("Proof that hidden watermarks ", PAPER), ("break", ATTACK), (" — and ", PAPER), ("C2PA", SIGNAL), (" doesn't.", PAPER)],
         mono(26, False))
    img.save(f"{OUT_SOC}/social-github.png", "PNG")
    print("marketing/social/social-github.png")


# ---- #3 Light banner / LinkedIn 1584x396 ----
def linkedin():
    W, H = 1584, 396
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img, "RGBA")
    tracked(d, (100, 120), "// RED-TEAMING THE INVISIBLE", mono(22), ATTACK, track=4)
    d.text((100, 158), "Watermark Stress Test", font=grotesk(78), fill=INK)
    d.text((100, 256), "Hidden AI watermarks break. C2PA is the fix.", font=mono(24, False), fill=(90, 92, 98))
    audio_glyph(d, W - 230, H // 2, scale=1.15)
    img.save(f"{OUT_SOC}/social-linkedin-banner.png", "PNG")
    print("marketing/social/social-linkedin-banner.png")


# ---- #4 X / Twitter header 1500x500 ----
def xheader():
    W, H = 1500, 500
    img = ink_base(W, H)
    d = ImageDraw.Draw(img, "RGBA")
    big = seal(290, ring=PAPER, faint=MUTE)
    img.paste(big, (W - 290 - 130, (H - 290) // 2), big)
    tracked(d, (90, 138), "ADVERSARIAL WATERMARK EVALUATION", mono(20), SIGNAL, track=6)
    t = grotesk(82)
    d.text((90, 186), "WATERMARK", font=t, fill=PAPER)
    x2 = d.text((90, 268), "STRESS ", font=t, fill=PAPER)
    sw = tw(d, "STRESS ", t)
    d.text((90 + sw, 268), "TEST", font=t, fill=SIGNAL)
    runs(d, (90, 372), [("Does the mark survive?", MUTE), ("   ·   ", FAINT), ("@provenance_lab", MUTE)], mono(22, False))
    img.save(f"{OUT_SOC}/social-x-header.png", "PNG")
    print("marketing/social/social-x-header.png")


# ---- #5 Logo / avatar 400x400 ----
def avatar():
    img = ink_base(400, 400)
    s = seal(252)
    img.paste(s, ((400 - 252) // 2, (400 - 252) // 2), s)
    img.save(f"{OUT_SOC}/social-avatar.png", "PNG")
    print("marketing/social/social-avatar.png")


og(); github(); linkedin(); xheader(); avatar()
print("done")
