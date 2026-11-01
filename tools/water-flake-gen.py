# Beam splash pieces (user 2026-11-01): separate toon water pieces that really fly out and fall, instead of one spinning picture.
#   python tools/water-flake-gen.py  -> assets/fx/tex/water_flake_cells.png + patches water/beam_tip, water/beam_hit (run after water-beam3-gen.py and water-fam-rise-gen.py)
import json, math, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx')
C, COLS, ROWS = 256, 4, 2
random.seed(9)
sheet = Image.new('L', (C * COLS, C * ROWS), 0); dr = ImageDraw.Draw(sheet)
for k in range(COLS * ROWS):
    ox, oy = (k % COLS) * C + C / 2, (k // COLS) * C + C / 2
    ang = random.uniform(0, 6.28); bend = random.choice([-1, 1]) * random.uniform(.8, 2.1); L = random.uniform(150, 195); w0 = random.uniform(22, 36)
    n = 60; x, y, a = ox - L / 2 * math.cos(ang), oy - L / 2 * math.sin(ang), ang
    for i in range(n):
        u = i / (n - 1); q = 2 + w0 * math.sin(u * math.pi) ** .6 * (1 - .55 * u); dr.ellipse([x - q, y - q, x + q, y + q], fill=255)
        x += L / n * math.cos(a); y += L / n * math.sin(a); a += bend / n
    if k % 2:   # หางแตกเป็นหยดเล็ก
        for j in range(3):
            q = 7 - j * 2; x += 15 * math.cos(a); y += 15 * math.sin(a); dr.ellipse([x - q, y - q, x + q, y + q], fill=255)
m = np.asarray(sheet.filter(ImageFilter.GaussianBlur(2)), float) / 255; m = np.clip((m - .4) * 9, 0, 1)
core = np.asarray(sheet.filter(ImageFilter.MinFilter(15)).filter(ImageFilter.GaussianBlur(3)), float) / 255
c0, c1 = np.array([.30, .78, 1.0]), np.array([.96, 1, 1.0])
col = c0 + (c1 - c0) * core[..., None]
img = (np.clip(np.dstack([col, m]), 0, 1) * 255).astype(np.uint8)
Image.fromarray(img, 'RGBA').save(os.path.join(ROOT, 'tex', 'water_flake_cells.png'))
json.dump({'v': 1, 'desc': 'ชิ้นน้ำการ์ตูน 8 แบบ ใช้เป็นเม็ดน้ำแตก (สุ่มแบบ)', 'gen': 'image', 'seed': 9, 'px': 256, 'cols': COLS, 'rows': ROWS, 'kind': 'loop', 'fps': 0, 'ramp': 'white', 'add': False, 'rand': True, 'rot': 3.14, 'spin': 2, 'size': 1, 'p': {}},
          open(os.path.join(ROOT, 'tex', 'water_flake_cells.tex.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
FX = os.path.join(ROOT, 'water')
def fl(id_, burst, rate, sp, sz, life, life0=1, loop=False):
    d = dict(id=id_, t='emit', at=0, life=life0, att='feet' if loop else 'point', pos=[0, 0, 0], rate=rate, **{'from': 'sphere'}, fr=.3, dir='out', speed=sp, plife=life, look='flake', fb='tex/water_flake_cells', size=sz, grow=.8, spin=5, col='#6fd4ff', c2='#1f6dff', gravity=7, drag=2.2, curl=False, fin=30)
    if burst: d['burst'] = burst
    if loop: d['loop'] = True
    return d
P = os.path.join(FX, 'beam_tip.fx.json'); D = json.load(open(P, encoding='utf-8'))
L = [l for l in D['layers'] if not l['id'].startswith('fl') and l['id'] not in ('wave', 'crown', 'lines', 'fp', 'fan', 'mist')]
L.append(fl('fp', 0, 45, [7, 14], [16, 30], [.25, .42], 1, True))
L.append(dict(fl('fan', 0, 90, [13, 24], [16, 34], [.16, .32], 1, True), dir='aim', yaw=180, spread=1.05, gravity=4))   # น้ำสาดย้อนกลับหาคนยิงเป็นพัด
L.append(dict(id='mist', t='emit', at=0, life=1, att='feet', pos=[0, 0, 0], rate=60, **{'from': 'sphere'}, fr=.25, dir='aim', yaw=180, spread=1.3, speed=[9, 18], plife=[.14, .26], look='streak', size=[2.5, 4], col='#ffffff', c2='#6fd8ff', gravity=2, drag=0, loop=True))
D['layers'] = L; json.dump(D, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
P = os.path.join(FX, 'beam_hit.fx.json'); D = json.load(open(P, encoding='utf-8'))
L = [l for l in D['layers'] if not l['id'].startswith('flakes') and l['id'] != 'fp']
L.append(fl('fp', 20, 0, [8, 16], [18, 36], [.28, .45], .04))
D['layers'] = L; json.dump(D, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
