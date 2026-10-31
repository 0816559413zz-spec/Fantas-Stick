# Curling wave skin (Riptide, user 2026-11-01 ref designs/water_ref/riptide_ref2.png): soft see-through cyan, teal at the
# base → pale at the crest, with soft white fibre streaks running up the face (not hard toon lines).
#   python tools/water-tex-curl.py  -> assets/fx/tex/water_curl_sheet.png + .tex.json   (u = across the wave, tiles; v = base → crest)
import json, math, os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'tex')
W, H = 512, 512
rng = np.random.default_rng(11)
y, x = np.mgrid[0:H, 0:W]; u = x / W; v = 1 - y / H          # image row 0 = crest (uv v = 1)
rgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float) / 255
base, mid, top = rgb('#1596b0'), rgb('#3fd2e4'), rgb('#bff8ff')
t = np.clip(v, 0, 1)[..., None]
col = np.where(t < .55, base + (mid - base) * (t / .55), mid + (top - mid) * ((t - .55) / .45))
# soft white fibres: thin wavy lines running up the face, blurred, tiling across u
fib = Image.new('L', (W, H), 0)
from PIL import ImageDraw
d = ImageDraw.Draw(fib)
for i in range(70):
    x0 = rng.uniform(0, W); amp = rng.uniform(4, 22); fr = rng.uniform(1, 3); ph = rng.uniform(0, 6.3); w = int(rng.integers(1, 4))
    y0, y1 = int(rng.uniform(H * .05, H * .6)), int(rng.uniform(H * .6, H))
    pts = [((x0 + amp * math.sin(fr * yy / H * 6.283 + ph) + (yy - y0) * rng.uniform(-.05, .05)) % W, yy) for yy in range(y0, y1, 6)]
    lv = int(rng.uniform(90, 230))
    for (a, b), (c, e) in zip(pts, pts[1:]):
        if abs(a - c) < W / 2: d.line([(a, b), (c, e)], fill=lv, width=w)
fib = np.asarray(fib.filter(ImageFilter.GaussianBlur(1.6)), float) / 255
glow = np.asarray(Image.fromarray((fib * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)), float) / 255
f = np.clip(fib * .85 + glow * .5, 0, 1)[..., None] * (.35 + .65 * t)   # fibres stronger toward the crest
col = col + (1 - col) * f
a = np.clip(.62 + .3 * v + .25 * f[..., 0], 0, 1)
img = np.dstack([np.clip(col, 0, 1) ** 2.0, a])                      # pre-darken like tools/water-tex.py (shader shows textures brighter)
Image.fromarray((img * 255).astype(np.uint8), 'RGBA').save(os.path.join(ROOT, 'water_curl_sheet.png'))
meta = {'v': 1, 'desc': 'ผิวคลื่นม้วน (Riptide, รูป riptide_ref2): ฟ้าใสนุ่ม ฐานเขียวอมฟ้า → ยอดฟ้าซีด + เส้นใยขาวนุ่มวิ่งขึ้นหน้าคลื่น (ไม่ใช่เส้นแข็ง) • u = ตามความกว้าง (ต่อกันได้), v = ฐาน → ยอด',
        'gen': 'image', 'seed': 11, 'px': W, 'cols': 1, 'rows': 1, 'kind': 'loop', 'fps': 24, 'ramp': 'white', 'add': False, 'p': {}}
with open(os.path.join(ROOT, 'water_curl_sheet.tex.json'), 'w', encoding='utf-8') as fp: json.dump(meta, fp, ensure_ascii=False, indent=1)
print('tex/water_curl_sheet')
