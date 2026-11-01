# Abyssal Beam impact (user 2026-11-01, Jason Keyser water FX ref): a pale jagged toon burst with cracks and loose shards, drawn as a
# 4-frame flipbook, replaces the blue flying pieces. Run after water-beam3-gen.py and water-fam-rise-gen.py (they rewrite the same fx).
#   python tools/water-burst-gen.py  -> assets/fx/tex/water_beam_burst.png + patches water/beam_tip, water/beam_hit
import json, math, os
import numpy as np
from PIL import Image, ImageDraw
ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx')
C = 512
rng = np.random.default_rng(12)
sheet = np.zeros((C, C * 4, 4), np.uint8)
y, x = np.mgrid[0:C, 0:C]; X = (x - C / 2) / (C / 2); Y = (y - C / 2) / (C / 2); TH = np.arctan2(Y, X); R = np.hypot(X, Y)
for f in range(4):
    ph = rng.uniform(0, 6.28, 8)
    edge = .5 + .05 * f + .09 * np.sin(TH * 3 + ph[0]) + .06 * np.sin(TH * 5 + ph[1])
    for k, n in enumerate((9, 14, 23)):
        edge += (.11 - k * .03) * np.abs(np.sin(TH * n / 2 + ph[2 + k])) ** 3 * (1 + .5 * np.sin(TH * 2 + ph[5]))
    body = (R < edge).astype(float)
    hole = (R < .1 + .05 * f + .03 * np.sin(TH * 7 + ph[6])) * (f > 1)
    col = np.ones((C, C, 3)) * np.array([.80, .95, 1.0])
    crk = np.abs(np.sin(TH * 6 + ph[7] + 2.2 * R)) < .07 + .0 * R
    ring = np.abs(np.sin(R * 11 + 1.3 * np.sin(TH * 4 + ph[3]))) < .13
    col[(crk | ring) & (R > .16)] = np.array([.42, .76, 1.0])
    deep = (np.sin(TH * 4 + ph[4]) > .55) & (R > .28) & (R < edge - .12)
    col[deep] = np.array([.18, .5, .96])
    col[R < .2 + .03 * f] = np.array([1, 1, 1])
    a = body * (1 - hole)
    img = Image.fromarray((np.dstack([col, a]) * 255).astype(np.uint8), 'RGBA'); dr = ImageDraw.Draw(img)
    for i in range(16):
        ang = rng.uniform(0, 6.283); r = (rng.uniform(.62, .92) + f * .03) * C / 2; s = rng.uniform(6, 22)
        px, py = C / 2 + r * math.cos(ang), C / 2 + r * math.sin(ang)
        dr.polygon([(px + s * 1.7 * math.cos(ang), py + s * 1.7 * math.sin(ang)), (px - s * .7 * math.sin(ang), py + s * .7 * math.cos(ang)), (px - s * math.cos(ang), py - s * math.sin(ang)), (px + s * .7 * math.sin(ang), py - s * .7 * math.cos(ang))], fill=(205, 242, 255, 255))
    sheet[:, f * C:(f + 1) * C] = np.asarray(img)
Image.fromarray(sheet, 'RGBA').resize((1024, 256), Image.LANCZOS).save(os.path.join(ROOT, 'tex', 'water_beam_burst.png'))
json.dump({'v': 1, 'desc': 'น้ำแตกการ์ตูนสีอ่อน ขอบหยัก มีรอยแตกและเศษ 4 เฟรม ปลาย Abyssal Beam', 'gen': 'image', 'seed': 12, 'px': 256, 'cols': 4, 'rows': 1, 'kind': 'loop', 'fps': 16, 'ramp': 'white', 'add': False, 'p': {}},
          open(os.path.join(ROOT, 'tex', 'water_beam_burst.tex.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
FX = os.path.join(ROOT, 'water')
B = dict(t='mesh', shape='plane', mat='tex', tex='tex/water_beam_burst', col='#ffffff', col2='#000000', rim=0, uvTile=[1, 1], uvScroll=[0, 0], bill=True, nodepth=True, fade=0, pos=[0, 0, 0], int=1)
GONE = ('fp', 'fan', 'hot', 'burst')
P = os.path.join(FX, 'beam_tip.fx.json'); D = json.load(open(P, encoding='utf-8'))
D['layers'] = [l for l in D['layers'] if l['id'] not in GONE and not l['id'].startswith('fl')] + [dict(B, id='burst', at=0, life=1, att='point', scale={"0": 4.6, "0.5": 5.2, "1": 4.6}, op=1, loop=True)]
json.dump(D, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for l in D['layers']: l['att'] = 'point'   # ทุกชั้นติดปลายลำจริง ไม่ใช่พื้น
json.dump(D, open(os.path.join(FX, 'beam_tip.fx.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
P = os.path.join(FX, 'beam_hit.fx.json'); D = json.load(open(P, encoding='utf-8'))
D['layers'] = [l for l in D['layers'] if l['id'] not in GONE and l['id'] != 'flash' and not l['id'].startswith('flakes')] + [dict(B, id='burst', at=0, life=.3, att='point', scale={"0": 1.4, "1": 3.8, "ease": "out"}, op={"0": 1, "0.7": 1, "1": 0})]
json.dump(D, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
