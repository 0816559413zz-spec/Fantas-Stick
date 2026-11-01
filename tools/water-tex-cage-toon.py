# Aqua Cage toon bubble (user 2026-11-01, ref designs/water_ref/ref3d_bubble_prison.webp): see-through blue blob with a thick white
# outline, soft darker water shapes inside and small rim bubbles. Painted as one billboard so the caged player stays visible.
#   python tools/water-tex-cage-toon.py  -> assets/fx/tex/water_cage_toon.png + .tex.json
import json, math, os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'tex')
S = 1024
rng = np.random.default_rng(8)
y, x = np.mgrid[0:S, 0:S]; X = (x - S / 2) / (S / 2); Y = (y - S / 2) / (S / 2)
th = np.arctan2(Y, X); R = np.hypot(X, Y)
rim = .80 + .032 * np.sin(th * 2 + 1) + .022 * np.sin(th * 3 + 2.4) + .012 * np.sin(th * 5 + .6)
d = R - rim                                                     # <0 inside
inside = np.clip(-d * 90, 0, 1)
def shape(cx, cy, rx, ry, rot, wob):
    c, s = math.cos(rot), math.sin(rot); u = (X - cx) * c + (Y - cy) * s; v = -(X - cx) * s + (Y - cy) * c
    a = np.arctan2(v / ry, u / rx); q = np.hypot(u / rx, v / ry) - (1 + wob * np.sin(a * 3 + cx * 9))
    return np.clip(-q * 18, 0, 1)
base = np.array([.22, .62, .98]); lite = np.array([.46, .82, 1.0]); deep = np.array([.08, .38, .90])
col = np.ones((S, S, 3)) * base
for cx, cy, rx, ry, rot in [(-.28, .32, .40, .23, .5), (.34, .08, .30, .20, -.8), (-.02, -.44, .34, .13, .1)]:
    col += (deep - col) * shape(cx, cy, rx, ry, rot, .16)[..., None] * .75
for cx, cy, rx, ry, rot in [(-.34, -.42, .24, .085, -.5), (.30, -.52, .15, .06, .5), (.42, .46, .16, .07, -.6)]:
    col += (lite - col) * shape(cx, cy, rx, ry, rot, .1)[..., None] * .9
alpha = .46 + .34 * np.clip(R / rim, 0, 1) ** 4                 # clear in the middle, denser at the edge
line = np.clip(1 - np.abs(d + .03) / .036, 0, 1) ** .6         # thick white outline
ww = np.zeros((S, S))
for i in range(26):                                             # white rim bubbles sitting on the outline
    a = rng.uniform(0, 6.283); r = .78 + .03 * math.sin(a * 2 + 1) - rng.uniform(.02, .07); q = rng.uniform(.012, .034)
    ww = np.maximum(ww, np.clip(1 - np.abs(np.hypot(X - r * math.cos(a), Y - r * math.sin(a)) - q) / .009, 0, 1))
for cx, cy, q in [(-.46, -.5, .05), (.1, -.58, .03)]:
    ww = np.maximum(ww, np.clip((q - np.hypot(X - cx, Y - cy)) * 120, 0, 1))
line = np.maximum(line, ww * (inside > 0))
col = col + (1 - col) * line[..., None]
a = np.maximum(inside * alpha, line)
glow = np.asarray(Image.fromarray((np.clip(line, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(16)), float) / 255
a = np.maximum(a, glow * .55)
solid = np.maximum(inside, line)
col = col * solid[..., None] + np.array([.45, .85, 1.0]) * (1 - solid)[..., None]
img = (np.clip(np.dstack([col, a]), 0, 1) * 255).astype(np.uint8)
Image.fromarray(img, 'RGBA').resize((512, 512), Image.LANCZOS).save(os.path.join(ROOT, 'water_cage_toon.png'))
json.dump({'v': 1, 'desc': 'ฟอง Aqua Cage ลายการ์ตูน ใส เห็นคนข้างใน ขอบขาวหนา (รูป ref3d_bubble_prison)', 'gen': 'image', 'seed': 8, 'px': 512, 'cols': 1, 'rows': 1,
           'kind': 'loop', 'fps': 24, 'ramp': 'white', 'add': False, 'p': {}}, open(os.path.join(ROOT, 'water_cage_toon.tex.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
