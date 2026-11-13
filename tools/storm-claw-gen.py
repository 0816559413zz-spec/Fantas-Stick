# Storm ult (god form) claw slashes in cyan, built from the approved special slash `storm/claw_sweep` (user 2026-11-10:
# "the special BA ult is very good, why isn't the normal BA") → every god-form swipe uses the same quality, all cyan.
#   storm/claw_sweep_c   special (n==3)  = claw_sweep recoloured cyan
#   storm/claw_slash_c0  swipe 1 (n==0)  = sweep right → left
#   storm/claw_slash_c1  swipe 2 (n==1)  = mirrored, left → right
#   storm/claw_slash_c2  swipe 3 (n==2)  = wider, stronger sweep (finisher)
# Run: python tools/storm-claw-gen.py then node tools/fx-check.js • bound in assets/fx/bind.json efx:sclaw
import json, copy, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SRC = json.loads((ROOT / 'assets/fx/storm/claw_sweep.fx.json').read_text(encoding='utf-8'))
CY = {'$main': '#2fd8ff', '$deep': '#0a5cff', '$hi': '#e6fcff', '$core': '#ffffff', '$light': '#5cd6ff',
      '#ffe27a': '#8ff0ff', '#ff8a00': '#1478ff', '#ffd000': '#4fd8ff', '#ffc400': '#2ad0ff', '#fff6c8': '#dcfaff'}

def recolor(v):
    if isinstance(v, str):
        return CY.get(v, v)
    if isinstance(v, list):
        return [recolor(x) for x in v]
    if isinstance(v, dict):
        return {k: recolor(x) for k, x in v.items()}
    return v

def neg(e):   # mirror an x expression / number
    if isinstance(e, (int, float)):
        return -e
    return '-(' + e + ')'

def mirror(L):
    L = copy.deepcopy(L)
    if L.get('sweep'):
        L['a0'], L['a1'] = -L['a0'], -L['a1']
    for k in ('pos', 'to'):
        if isinstance(L.get(k), list) and len(L[k]) == 3:
            L[k][0] = neg(L[k][0])
    return L

def narrow(layers, k):   # squeeze the arc sideways to match the hit cone (user 2026-11-10: slash too wide)
    out = []
    for L in layers:
        L = copy.deepcopy(L)
        if L.get('sweep'):
            L['a0'], L['a1'] = round(L['a0'] * k, 1), round(L['a1'] * k, 1)
        for kk in ('pos', 'to'):
            if isinstance(L.get(kk), list) and len(L[kk]) == 3:
                x = L[kk][0]
                L[kk][0] = round(x * k, 4) if isinstance(x, (int, float)) else f'({x})*{k}'
        out.append(L)
    return out

def calm(L):   # user 2026-11-10 (approved): a bit less effect
    L = copy.deepcopy(L)
    if L['t'] == 'bolt':
        L['w'] = round(L.get('w', .1) * .8, 3)
        if 'br' in L: L['br'] = max(0, L['br'] - 1)
    if L['t'] == 'emit':
        if 'burst' in L: L['burst'] = max(1, int(L['burst'] * .7))
        if isinstance(L.get('rate'), (int, float)): L['rate'] = round(L['rate'] * .7, 1)
    if L['t'] == 'trail' and 'k' in L: L['k'] = round(L['k'] * .85, 2)
    if L['t'] == 'light' and isinstance(L.get('int'), (int, float)): L['int'] = round(L['int'] * .8, 2)
    return L

def build(name, desc, layers, extra=None):
    layers = [calm(L) for L in layers]
    fx = copy.deepcopy(SRC)
    fx['desc'] = desc
    fx['tags'] = sorted(set(fx.get('tags', []) + ['storm', 'ult', 'claw', 'cyan']))
    fx['layers'] = layers
    if extra:
        fx.update(extra)
    (ROOT / f'assets/fx/storm/{name}.fx.json').write_text(json.dumps(fx, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'storm/{name}', len(layers), 'layers')

base = []
for L in SRC['layers']:
    L = recolor(copy.deepcopy(L))
    if L['t'] == 'bolt':
        L['acc'] = True          # game bolts: cyan look
    base.append(L)

build('claw_sweep_c', 'ร่างเทพสายฟ้า: กวาดกรงเล็บพิเศษ (สีฟ้าทั้งหมด) — จาก storm/claw_sweep', narrow(base, .79))   # hit cone ±69°
build('claw_slash_c0', 'ร่างเทพสายฟ้า: ฟันกรงเล็บจังหวะ 1 (ขวา→ซ้าย) สีฟ้า — คุณภาพเดียวกับท่าพิเศษ', narrow(base, .53))   # hit cone ±46°
build('claw_slash_c1', 'ร่างเทพสายฟ้า: ฟันกรงเล็บจังหวะ 2 (ซ้าย→ขวา กลับข้าง) สีฟ้า', narrow([mirror(L) for L in base], .53))
fin = []
for L in base:
    L = copy.deepcopy(L)
    if L.get('sweep'):
        L['a0'], L['a1'] = 110, -115
    if L['t'] == 'bolt':
        L['w'] = round(L.get('w', .1) * 1.3, 3)
        L['n'] = L.get('n', 1) + 1
    if L['t'] == 'emit' and 'burst' in L:
        L['burst'] = min(80, int(L['burst'] * 1.4))
    fin.append(L)
build('claw_slash_c2', 'ร่างเทพสายฟ้า: ฟันกรงเล็บจังหวะ 3 ปิดท้าย (กว้างกว่า แรงกว่า) สีฟ้า', narrow(fin, .5))
