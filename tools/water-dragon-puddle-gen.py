# Dragon of the Deep puddle (user 2026-11-01): uneven water edge with foam instead of a flat round disc, plus the red enemy warning ring.
#   python tools/water-dragon-puddle-gen.py  -> assets/fx/tex/water_puddle.png + patches water/dragon_dive, makes water/dragon_warn_foe
import json, math, os
import numpy as np
from PIL import Image, ImageFilter
ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx')
S = 1024
y, x = np.mgrid[0:S, 0:S]; X = (x - S / 2) / (S / 2); Y = (y - S / 2) / (S / 2); th = np.arctan2(Y, X); R = np.hypot(X, Y)
rim = .86 + .04 * np.sin(th * 3 + .7) + .03 * np.sin(th * 5 + 2) + .018 * np.sin(th * 9 + 1) + .01 * np.sin(th * 17)
d = R - rim
inside = np.clip(-d * 70, 0, 1)
blob = np.zeros((S, S)); rng = np.random.default_rng(3)
for i in range(16):
    a = rng.uniform(0, 6.283); r = rng.uniform(.9, 1.0); q = rng.uniform(.012, .035)
    blob = np.maximum(blob, np.clip((q - np.hypot(X - r * np.cos(a), Y - r * np.sin(a))) * 90, 0, 1))
base = np.array([.36, .74, .98]); lite = np.array([.62, .90, 1.0])
band = (np.sin(R * 22 + 1.6 * np.sin(th * 3)) > .72) * .55
col = base + (lite - base) * band[..., None]
foam = np.clip(1 - np.abs(d + .03) / .03, 0, 1) ** .7
col = col + (1 - col) * foam[..., None]
a = np.maximum(inside * (.5 + .22 * (R / .9) ** 3), np.maximum(foam, blob))
img = (np.clip(np.dstack([col + (1 - col) * blob[..., None], a]), 0, 1) * 255).astype(np.uint8)
Image.fromarray(img, 'RGBA').resize((512, 512), Image.LANCZOS).save(os.path.join(ROOT, 'tex', 'water_puddle.png'))
json.dump({'v': 1, 'desc': 'แอ่งน้ำขอบหยัก ระลอกวง โฟมขาวที่ขอบ (อัลติมังกร)', 'gen': 'image', 'seed': 3, 'px': 512, 'cols': 1, 'rows': 1, 'kind': 'loop', 'fps': 24, 'ramp': 'white', 'add': False, 'p': {}},
          open(os.path.join(ROOT, 'tex', 'water_puddle.tex.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
FX = os.path.join(ROOT, 'water')
P = os.path.join(FX, 'dragon_dive.fx.json'); D = json.load(open(P, encoding='utf-8'))
for i, l in enumerate(D['layers']):
    if l['id'] == 'puddle':
        D['layers'][i] = dict(id='puddle', t='mesh', at=l['at'], life=l['life'], att='ground', shape='plane', mat='tex', tex='tex/water_puddle', col='#ffffff', col2='#000000', rim=0, uvTile=[1, 1], uvScroll=[0, 0],
                              int=1, fade=0, pos=[0, .04, 0], rot=[-90, 0, 0], scale={"0": 5, "0.08": 40, "1": 40, "ease": "out"}, op=l['op'])
json.dump(D, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
W = json.load(open(os.path.join(FX, 'dragon_warn.fx.json'), encoding='utf-8'))
for l in W['layers']:
    if l['id'] == 'disc': l.update(col='#ff9a9a', col2='#ff2a3a')
    else: l.update(col='#ffd0d0', col2='#ff2a3a')
W['desc'] = 'Dragon of the Deep วงเตือนฝั่งศัตรู: สีแดง ขนาดและจังหวะเดียวกับ water/dragon_warn'
json.dump(W, open(os.path.join(FX, 'dragon_warn_foe.fx.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
