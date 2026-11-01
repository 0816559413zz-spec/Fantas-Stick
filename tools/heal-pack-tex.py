# Health pack (user 2026-11-01, picture in chat): cracked dark-green orb at the foot of a mint S-shaped flame with cut-out holes,
# thin dark outlines, soft glow and bright shards. Billboard sprite used by makeItem in js/36-modes-view.js.
#   python tools/heal-pack-tex.py  -> assets/fx/tex/heal_pack.png
import math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'tex', 'heal_pack.png')
W, H = 1240, 1536
rng = np.random.default_rng(5)
def bez(P, n=240):
    P = np.array(P, float); t = np.linspace(0, 1, n)[:, None]
    return (1 - t) ** 3 * P[0] + 3 * (1 - t) ** 2 * t * P[1] + 3 * (1 - t) * t ** 2 * P[2] + t ** 3 * P[3]
spine = np.vstack([bez([(640, 40), (650, 180), (330, 300), (340, 500)]), bez([(340, 500), (350, 690), (800, 640), (800, 920)]), bez([(800, 920), (800, 1200), (520, 1330), (360, 1240)])])
n = len(spine); u = np.linspace(0, 1, n)
wid = 4 + 150 * np.clip(u / .45, 0, 1) ** 1.1 + 70 * np.clip((u - .45) / .3, 0, 1) - 40 * np.clip((u - .85) / .15, 0, 1)
m = Image.new('L', (W, H), 0); dr = ImageDraw.Draw(m)
for (px, py), r in zip(spine, wid): dr.ellipse([px - r, py - r, px + r, py + r], fill=255)
for P, w0 in [([(150, 1240), (120, 1040), (280, 1000), (440, 720)], 70), ([(250, 1300), (460, 1460), (690, 1400), (830, 1330)], 80)]:   # second tongue + the base curl
    c = bez(P)
    for i, (px, py) in enumerate(c):
        r = 4 + w0 * math.sin(i / len(c) * math.pi) ** .7
        dr.ellipse([px - r, py - r, px + r, py + r], fill=255)
dr.ellipse([210, 960, 760, 1420], fill=255)
holes = Image.new('L', (W, H), 0); hd = ImageDraw.Draw(holes)
def leaf(cx, cy, a, b, rot):
    pts = []
    for i in range(48):
        t = i / 48 * 6.283; x = a * math.cos(t) * (1 + .35 * math.cos(t)); y = b * math.sin(t)
        pts.append((cx + x * math.cos(rot) - y * math.sin(rot), cy + x * math.sin(rot) + y * math.cos(rot)))
    hd.polygon(pts, fill=255)
for h in [(300, 370, 80, 16, -1.3), (530, 640, 130, 34, .55), (850, 960, 90, 42, -1.2), (760, 1140, 86, 28, -.95), (260, 1090, 70, 24, -1.1), (540, 1370, 110, 16, .1), (470, 860, 120, 60, -.9)]: leaf(*h)
mask = np.asarray(m.filter(ImageFilter.GaussianBlur(5)), float) / 255; mask = (mask > .5).astype(float)
hole = np.asarray(holes.filter(ImageFilter.GaussianBlur(3)), float) / 255; shape_ = mask * (1 - (hole > .5))
sm = Image.fromarray((shape_ * 255).astype(np.uint8))
er = np.asarray(sm.filter(ImageFilter.MinFilter(9)), float) / 255
yy, xx = np.mgrid[0:H, 0:W]; v = yy / H
pale, mint, teal, ink = np.array([.84, 1, .95]), np.array([.46, .90, .76]), np.array([.14, .60, .52]), np.array([.02, .16, .15])
t = np.clip((v - .15) / .65, 0, 1)[..., None]; col = teal + (pale - teal) * t ** 1.3
b = Image.new('L', (W, H), 0); bd = ImageDraw.Draw(b)   # darker bands that follow the flame
for i in range(0, n - 8, 2):
    if .15 < u[i] < .92:
        px, py = spine[i]; r = wid[i] * .10; ox = 0.42 * wid[i]
        bd.ellipse([px - ox - r, py + ox * .3 - r, px - ox + r, py + ox * .3 + r], fill=255)
band = np.asarray(b.filter(ImageFilter.GaussianBlur(3)), float) / 255
col += (mint * .72 - col) * band[..., None] * .75
outline = ((shape_ > .5) & (er < .5)).astype(float)
col += (ink - col) * outline[..., None]
cx, cy, R = 520, 1150, 170   # orb
d = np.hypot(xx - cx, yy - cy) / R; orb = np.clip((1 - d) * 60, 0, 1)
nz = np.sqrt(np.clip(1 - d ** 2, 0, 1)); light = np.clip(((xx - cx) * -.3 + (yy - cy) * -.5) / R * .9 + nz * .62, 0, 1)
dark = np.array([.03, .17, .17])
oc = dark + (np.array([.16, .62, .56]) - dark) * (light ** 1.5)[..., None]
cr = Image.new('L', (W, H), 0); cd = ImageDraw.Draw(cr)
def crack(x, y, a, L, w):
    while L > 0:
        s = rng.uniform(22, 48); nx, ny = x + s * math.cos(a), y + s * math.sin(a); cd.line([x, y, nx, ny], fill=255, width=int(max(3, w))); x, y = nx, ny; a += rng.uniform(-.7, .7); L -= s; w *= .96
        if rng.random() < .24: crack(x, y, a + rng.choice([-1, 1]) * rng.uniform(.8, 1.3), L * .55, w * .6)
for a0 in (1.1, 2.2, 3.5, 5.3, .1): crack(cx + 40 * math.cos(a0 + 2), cy - 110 + 30 * math.sin(a0), a0, 330, 11)
crk = np.asarray(cr, float) / 255 * (d < .98)
oc += (np.array([.45, 1, .86]) - oc) * crk[..., None]
col = col * (1 - orb[..., None]) + oc * orb[..., None]
solid = np.maximum(shape_, orb)
sh = Image.new('L', (W, H), 0); sd = ImageDraw.Draw(sh)   # bright shards
for k in range(30):
    sx = rng.choice([rng.uniform(120, 300), rng.uniform(700, 900)]); sy = rng.uniform(140, 1000) if sx > 500 else rng.uniform(760, 1120); q = rng.uniform(5, 22); a = rng.uniform(0, 6.28)
    sd.polygon([(sx + q * 1.8 * math.cos(a), sy + q * 1.8 * math.sin(a)), (sx - q * math.sin(a) * .5, sy + q * math.cos(a) * .5), (sx - q * math.cos(a), sy - q * math.sin(a)), (sx + q * math.sin(a) * .5, sy - q * math.cos(a) * .5)], fill=255)
sha = np.asarray(sh, float) / 255
glowsrc = np.maximum(solid, sha)
glow = np.asarray(Image.fromarray((glowsrc * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(26)), float) / 255
a = np.maximum(np.maximum(solid, sha), np.clip(glow * .85, 0, 1))
gc = np.array([.45, 1, .82]); out = gc + (col - gc) * solid[..., None]
out += (np.array([.6, 1, .9]) - out) * sha[..., None] * (1 - solid[..., None])
img = (np.clip(np.dstack([out, a]), 0, 1) * 255).astype(np.uint8)
Image.fromarray(img, 'RGBA').resize((413, 512), Image.LANCZOS).save(OUT)
