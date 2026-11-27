# shibuya_prep.py — real Shibuya (scramble crossing) layout from OpenStreetMap → assets/src/shibuya_data.json
# Data © OpenStreetMap contributors (ODbL 1.0, https://www.openstreetmap.org/copyright).
# Run: python assets/src/shibuya_prep.py <overpass.json>   (Overpass query: buildings + highways + railways in bbox 35.6575,139.6978,35.6615,139.7035)
# Output coords: metres, x east, z south, origin = map corner (map x = local x + OX, map z = local z + OZ; local origin = crossing centre)
import json, math, sys, random, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = sys.argv[1]
d = json.load(open(src, encoding='utf8'))
N = {e['id']: (e['lat'], e['lon']) for e in d['elements'] if e['type'] == 'node' and 'lat' in e}
LAT0, LON0 = 35.659482, 139.700565
OX, OZ, W, H = 165.0, 140.0, 320.0, 265.0          # map = 320 x 265 m, crossing at (165, 140)
kx = 111320 * math.cos(math.radians(LAT0)); ky = 110574
def xy(n): la, lo = N[n]; return ((lo - LON0) * kx + OX, -(la - LAT0) * ky + OZ)
def area(p): return abs(sum(p[i][0] * p[i - 1][1] - p[i - 1][0] * p[i][1] for i in range(len(p)))) / 2
def num(v):
    try: return float(str(v).split(';')[0].replace('m', '').strip())
    except Exception: return None
inside = lambda x, z, m=0: -m <= x <= W + m and -m <= z <= H + m
B, R, X = [], [], []
for e in d['elements']:
    if e['type'] != 'way': continue
    t = e.get('tags', {}); ids = [n for n in e['nodes'] if n in N]
    if len(ids) < 2: continue
    pts = [xy(n) for n in ids]
    cx = sum(p[0] for p in pts) / len(pts); cz = sum(p[1] for p in pts) / len(pts)
    if 'building' in t and t.get('building') not in ('bridge',):
        if ids[0] == ids[-1]: pts = pts[:-1]
        if len(pts) < 3 or not inside(cx, cz, 10): continue
        A = area(pts)
        if A < 6: continue
        rnd = random.Random(e['id']); lv = num(t.get('building:levels')); h = num(t.get('height'))
        kind = t.get('building')
        if kind == 'roof': h = h or 4.5
        elif h is None:
            if lv is None: lv = 1 if A < 25 else rnd.randint(3, 5) if A < 90 else rnd.randint(4, 8) if A < 300 else rnd.randint(6, 9)
            h = 4.4 + (lv - 1) * 3.5
        B.append({'id': e['id'], 'k': kind, 'name': t.get('name', ''), 'h': round(h, 2), 'lv': lv, 'a': round(A, 1), 'p': [[round(a, 2), round(b, 2)] for a, b in pts]})
    elif 'highway' in t or 'railway' in t:
        if t.get('tunnel') in ('yes', 'building_passage') or t.get('layer', '0').startswith('-') or t.get('location') == 'underground' or t.get('level', '0').startswith('-'): continue
        if not any(inside(x, z, 20) for x, z in pts): continue
        hw = t.get('highway', ''); rw = t.get('railway', '')
        if hw == 'footway' and t.get('footway') == 'crossing': X.append({'id': e['id'], 'p': [[round(a, 2), round(b, 2)] for a, b in pts]}); continue
        if hw in ('footway', 'steps', 'elevator', 'path', 'corridor', 'construction', 'proposed', 'platform'): continue
        lanes = num(t.get('lanes')); wd = num(t.get('width'))
        dw = {'motorway': 16, 'trunk': 20, 'trunk_link': 8, 'primary': 16, 'secondary': 12, 'tertiary': 10, 'tertiary_link': 7, 'unclassified': 7, 'residential': 6, 'service': 4.5, 'pedestrian': 6, 'living_street': 6}.get(hw)
        if rw: dw = 4
        if dw is None: continue
        w = wd or (lanes * 3.2 + 1.5 if lanes else dw)
        R.append({'id': e['id'], 'k': hw or ('rail_' + rw), 'name': t.get('name', ''), 'w': round(w, 1), 'br': 1 if t.get('bridge') else 0, 'layer': t.get('layer', ''), 'p': [[round(a, 2), round(b, 2)] for a, b in pts]})
out = {'_about': 'Shibuya scramble crossing area from OpenStreetMap (ODbL, © OpenStreetMap contributors). Metres, x east, z south, map corner origin. Built by shibuya_prep.py',
       'W': W, 'H': H, 'cross': [OX, OZ], 'B': B, 'R': R, 'X': X}
json.dump(out, open(os.path.join(HERE, 'shibuya_data.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
from collections import Counter
print(len(B), 'buildings', len(R), 'roads', len(X), 'crossings', Counter(r['k'] for r in R).most_common())
print('tallest', sorted([(b['h'], b['name']) for b in B], reverse=True)[:8])
