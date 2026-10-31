# Water style textures (user 2026-10-31: "do like this pic almost 100%" — designs/water_ref/style_toon_orb.png).
#   python tools/water-tex.py  -> assets/fx/tex/water_toon_ball|water_toon_band|water_toon_swirl|water_white_arcs .png + .tex.json
# Toon water: hard-edged bands in 4 blues (deep / mid / light / pale) + thin white glints. No soft gradients.
import json, math, os
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'tex')
C = dict(deep='#3b5bdb', mid='#1e9bf0', light='#38d0f5', pale='#8ef3ff', white='#ffffff')   # researched bright palette (round 3) — was navy-heavy
rgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float) / 255

def vnoise(rng, n, w, h, oct_=3):
    out = np.zeros((h, w)); amp = 1.0; tot = 0.0
    for o in range(oct_):
        g = n * (2 ** o)
        grid = rng.random((g + 1, g + 1))
        img = Image.fromarray((grid * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        out += np.asarray(img, float) / 255 * amp; tot += amp; amp *= 0.5
    return out / tot

def bands(v, stops):
    """v in [0,1) -> hard colour bands: stops = [(edge, colour), ...] sorted"""
    out = np.zeros(v.shape + (3,))
    for e, c in reversed(stops):
        out[v < e] = rgb(c)
    return out

def save(name, img, desc, px):
    img = img.copy(); img[..., :3] = np.clip(img[..., :3], 0, 1) ** 2.0   # the fx shader shows textures brighter than painted (no sRGB decode) — pre-darken so the blues stay rich
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), 'RGBA').save(os.path.join(ROOT, name + '.png'))
    meta = {'v': 1, 'desc': desc, 'gen': 'image', 'seed': 1, 'px': px, 'cols': 1, 'rows': 1, 'kind': 'loop', 'fps': 24, 'ramp': 'white', 'add': False, 'p': {}}
    with open(os.path.join(ROOT, name + '.tex.json'), 'w', encoding='utf-8') as f: json.dump(meta, f, ensure_ascii=False, indent=1)
    print('tex/' + name)

rng = np.random.default_rng(7)
# ---- ball: wraps a sphere (u = around, v = top->bottom); diagonal swirling stripes like wind-blown water ----
W, H = 512, 256
y, x = np.mgrid[0:H, 0:W]; u = x / W; v = y / H
n = vnoise(rng, 3, W, H); n2 = vnoise(rng, 6, W, H, 2)
s = (u * 3 + v * 1.6 + np.sin(v * math.pi * 2 + u * math.pi * 6) * 0.12 + (n - 0.5) * 0.55) % 1.0
img = bands(s, [(0.22, C['deep']), (0.52, C['mid']), (0.78, C['light']), (0.93, C['pale']), (1.01, C['white'])])
glint = ((u * 7 + v * 3.2 + (n2 - 0.5) * 0.9) % 1.0 < 0.035) & (n2 > 0.52)   # thin white strokes
img[glint] = 1.0
save('water_toon_ball', np.dstack([img, np.ones((H, W))]), 'น้ำการ์ตูน: แถบน้ำวนเฉียงขอบคม 4 เฉด (น้ำเงินเข้ม/ฟ้า/ฟ้าอ่อน/ฟ้าซีด) + เส้นขาวบาง — พันรอบลูกทรงกลม (สไตล์ style_toon_orb)', W)

# ---- band: brush stroke for ribbon models (u along, v across) — light/pale/white with tapered ends ----
W, H = 512, 64
y, x = np.mgrid[0:H, 0:W]; u = x / W; v = y / H
n = vnoise(rng, 5, W, H, 2)
taper = np.clip(np.minimum(u / 0.18, (1 - u) / 0.35), 0, 1) ** 0.7
half = 0.5 * taper * (0.75 + 0.25 * np.sin(u * 9 + n * 3))
d = np.abs(v - 0.5)
alpha = (d < half).astype(float)
k = np.where(half > 0, d / np.maximum(half, 1e-3), 1)
img = bands(k + (n - 0.5) * 0.25, [(0.35, C['white']), (0.65, C['pale']), (1.01, C['light'])])
save('water_toon_band', np.dstack([img, alpha]), 'น้ำการ์ตูน: แถบพู่กันน้ำ ขาวกลาง ฟ้าซีด ขอบฟ้าอ่อน หัวท้ายเรียว — ใช้กับโมเดลวง wind_pieces', W)

# ---- swirl disk: flat water whirl at the base (spiral arms, hard bands, transparent gaps) ----
PX = 512
y, x = np.mgrid[0:PX, 0:PX]; a = (x + 0.5) / PX * 2 - 1; b = (y + 0.5) / PX * 2 - 1
r = np.hypot(a, b); th = np.arctan2(b, a); n = vnoise(rng, 5, PX, PX)
phi = (th / (2 * math.pi) * 3 + np.log(np.maximum(r, 0.03)) * 0.9 + (n - 0.5) * 0.35) % 1.0
arm = phi < 0.55 + 0.25 * r
env = (r > 0.18) & (r < 0.96 - (n - 0.5) * 0.1)
alpha = (arm & env).astype(float)
img = bands(((r - 0.18) / 0.8 + (n - 0.5) * 0.15).clip(0, 0.999), [(0.25, C['pale']), (0.5, C['light']), (0.78, C['mid']), (1.01, C['deep'])])
rim = arm & env & (phi < 0.05)   # white leading edge of every arm
img[rim] = 1.0
save('water_toon_swirl', np.dstack([img, alpha]), 'น้ำการ์ตูน: จานน้ำวนแบนรอบฐาน แขนเกลียว 3 แขนขอบคม ด้านในฟ้าซีด ด้านนอกน้ำเงินเข้ม ขอบนำสีขาว — หมุนด้วย spin', PX)

# ---- white arcs: thin glowing white swirl lines (outer rings of the reference) ----
alpha = np.zeros((PX, PX))
for i in range(9):
    rr = 0.45 + i * 0.06 + rng.uniform(-0.02, 0.02); t0 = rng.uniform(0, 2 * math.pi); ln = rng.uniform(1.2, 3.4); w = rng.uniform(0.004, 0.01)
    dth = (th - t0) % (2 * math.pi)
    along = dth / ln
    on = (along < 1) & (np.abs(r - rr - along * 0.03) < w * np.sin(np.clip(along, 0, 1) * math.pi) + 0.0015)
    alpha = np.maximum(alpha, on.astype(float))
img = np.ones((PX, PX, 3)); img[..., 0] = 0.92
save('water_white_arcs', np.dstack([img, alpha]), 'น้ำการ์ตูน: เส้นโค้งขาวบางวนรอบ 9 เส้น (เรียวหัวท้าย) — วงนอกแบบรูปอ้างอิง หมุนด้วย spin', PX)

# ---- wave sheet for ribbon walls: x = along the wave profile (bottom -> lip), y = across the width ----
# bands get lighter towards the lip, white foam scallops on top, ragged/tapered left-right ends (never a plain rectangle)
W, H = 512, 256
y, x = np.mgrid[0:H, 0:W]; u = x / W; v = y / H
n = vnoise(rng, 6, W, H, 3); n2 = vnoise(rng, 14, W, H, 2)
lip = 0.86 + 0.08 * np.sin(v * math.pi * 9 + n * 4) + (n2 - 0.5) * 0.08          # wavy top edge (foam scallops)
side = np.minimum(v, 1 - v) / 0.16 + (n - 0.5) * 0.6                                 # ragged ends
alpha = ((u < lip) & (side > 0.25)).astype(float)
s = (u + np.sin(v * math.pi * 6 + u * 5) * 0.05 + (n - 0.5) * 0.12)
img = bands(s, [(0.28, C['deep']), (0.5, C['mid']), (0.68, C['light']), (0.8, C['pale']), (1.5, C['white'])])
streak = ((v * 11 + u * 2.5 + n2 * .8) % 1.0 < 0.05) & (u > .3) & (u < lip - .1)   # white flow lines up the face
img[streak] = rgb(C['pale'])
foam = (u > lip - 0.07) & (u < lip)
img[foam] = 1.0
save('water_wave_sheet', np.dstack([img, alpha]), 'น้ำการ์ตูน: ผิวคลื่น (แกน x = ล่าง→ยอดคลื่น, y = ตามความกว้าง) แถบน้ำเข้ม→อ่อน ยอดฟองขาวหยัก ปลายสองข้างเรียวขรุขระ — ใช้กับ ribbon กว้างๆ', W)

# ---- puddle: water left on the ground (dark blue blob, lighter rings, white rim, light caustic spots) ----
PX = 512
y, x = np.mgrid[0:PX, 0:PX]; a = (x + 0.5) / PX * 2 - 1; b = (y + 0.5) / PX * 2 - 1
r = np.hypot(a, b); th = np.arctan2(b, a); n = vnoise(rng, 5, PX, PX); n2 = vnoise(rng, 12, PX, PX, 2)
edge = 0.82 + 0.1 * np.sin(th * 5 + n * 3) + (n - 0.5) * 0.12
alpha = (r < edge).astype(float)
k = r / np.maximum(edge, 1e-3)
img = bands(k + (n2 - .5) * .1, [(0.45, C['deep']), (0.72, C['mid']), (0.9, C['light']), (1.01, C['white'])])
spots = (n2 > 0.66) & (k < 0.8)
img[spots] = rgb(C['light'])
save('water_puddle', np.dstack([img, alpha]), 'น้ำการ์ตูน: แอ่งน้ำบนพื้น (กลางน้ำเงินเข้ม วงฟ้า ขอบขาว จุดแสงฟ้า) ขอบหยักนิดๆ', PX)

# ---- shield orb swirl (user 2026-10-31 round 3, ref designs/water_ref/shield_orb_ref2.webp) ----
# coherent bands that all flow the same diagonal way; value order dark → mid → light → white → light → mid → dark (no jumps),
# dark only thin (≈12%), mid + light most of it, thin white crests (user: "สีเข้มจะน้อย สีปกติกับสว่างจะมากกว่า")
W, H = 512, 256
y, x = np.mgrid[0:H, 0:W]; u = x / W; v = y / H
n = vnoise(rng, 3, W, H, 2)
n3 = vnoise(rng, 9, W, H, 2)
s = (u * 3 + v * 1.3 + np.sin(v * math.pi * 2 + u * math.pi * 6) * .05 + (n - .5) * .35 + (n3 - .5) * .12) % 1.0   # organic brush-like edges
tri = np.abs(s * 2 - 1)              # 1 at band edges, 0 in the middle → symmetric ramp, no hard white→dark jump
OC = dict(dark='#2f6fe0', mid='#4aa8f2', light='#97dcff', white='#ffffff')
img = bands(1 - tri, [(0.12, OC['dark']), (0.5, OC['mid']), (0.9, OC['light']), (1.01, OC['white'])])
save('water_orb_swirl', np.dstack([img, np.ones((H, W))]), 'โล่น้ำ: ลายน้ำวนเฉียงทางเดียวกัน เข้มน้อย (12%) ฟ้ากลาง+ฟ้าอ่อนเยอะ ยอดขาวบาง ไล่สีไม่กระโดด (รูป shield_orb_ref2)', W)
