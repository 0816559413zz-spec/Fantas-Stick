# Water path VFX (user 2026-10-31): style = designs/water_ref/style_toon_orb.png "almost 100%" —
# toon water in hard-edged blue bands (deep / mid / light / pale) + white glints, flat whirl disk at the base,
# thin glowing white swirl lines, white sparkles. "play with water wave around skill alot … white effect too".
# Run: python tools/water-tex.py (textures) then python tools/water-vfx-gen.py, node tools/fx-check.js
# Every file lands in assets/fx/water/ — the game plays them from js/68-water-view.js.
import json, math, random
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'assets/fx/water'; OUT.mkdir(exist_ok=True)
C = dict(deep='#1236b8', mid='#1f78ff', light='#46c6ff', pale='#b4f1ff', white='#ffffff', neon='#7ff6ff', foam='#e9fbff')
T = lambda n: 'tex/' + n
rnd = random.Random(11)
FILES = []

def save(name, layers, desc, tags, dur=None, loop=False, att=None):
    for l in layers:   # particle size units: 8 ≈ 1 m — scale the small numbers used above to readable sizes
        if l.get('t') == 'emit' and isinstance(l.get('size'), list) and not l.get('_sz'):
            k = {'glow': 2.5, 'spark': 4, 'ring': 2.5, 'streak': 1.5}.get(l.get('look'), 1); l['size'] = [round(v * k, 2) for v in l['size']]
    if att:   # fx that ride a projectile / hit point at height h: anchor 'point' ('feet' without a followed player = ground)
        for l in layers: l['att'] = att
    if loop:
        for l in layers:
            if not l.get('end'): l['loop'] = True
    d = dur or round(max(l.get('at', 0) + l.get('life', .4) for l in layers) + .05, 2)
    (OUT / f'{name}.fx.json').write_text(json.dumps({'v': 1, 'desc': desc, 'tags': ['water'] + tags, 'pal': 'ice', 'dur': d, 'seed': 11, 'layers': layers}, ensure_ascii=False, indent=1), encoding='utf-8')
    FILES.append(name); print('water/' + name, len(layers), 'layers dur', d)

# ---------- building blocks ----------
def ball(L, pre, at, life, pos, r, spin=1, op=None, scroll=.18, curve=None):
    """toon water ball: banded texture sphere, scroll = water flowing round it"""
    L.append({'id': pre + 'ball', 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'sphere', 'mat': 'tex', 'tex': T('water_toon_ball'), 'col': '#ffffff', 'col2': C['pale'], 'rim': 0,
              'uvTile': [1, 1], 'uvScroll': [scroll * spin, 0], 'pos': pos, 'scale': curve or r, 'op': op or 1, 'fade': .15})

def bands(L, pre, at, life, pos, r, n=3, spin=1, op=.95, tilt=35, thick=.5, cols=None):
    """brush ribbons wrapped round a ball at crossed tilts (the swirled stripes of the reference)"""
    cols = cols or [C['white'], C['pale'], C['light']]
    for j in range(n):
        L.append({'id': f'{pre}band{j}', 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'model', 'model': f'wind_pieces{j % 3}', 'mat': 'tex', 'tex': T('water_toon_band'),
                  'col': cols[j % len(cols)], 'col2': '#000000', 'rim': 0, 'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': pos,
                  'rot': [round(rnd.uniform(-tilt, tilt), 1), j * 120 / n * 3, round(rnd.uniform(-tilt, tilt), 1)], 'spin': spin * rnd.choice([560, 620, 700]) * (1 if j % 2 == 0 else -1),
                  'scale': {'0': [r * .5, thick * .5, r * .5], '0.12': [r, thick, r], '0.88': [r, thick, r], '1': [r * .6, thick * .5, r * .6]}, 'op': {'0': 0, '0.1': op, '0.9': op, '1': 0}, 'fade': 0})

def disk(L, pre, at, life, pos, r, spin=220, tex='water_toon_swirl', op=1, tilt=0):
    L.append({'id': pre + 'disk', 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'plane', 'mat': 'tex', 'tex': T(tex), 'col': '#ffffff', 'col2': '#000000', 'rim': 0,
              'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': pos, 'rot': [90, 0, tilt], 'spin': spin,
              'scale': {'0': r * .3, '0.1': r, '0.9': r, '1': r * 1.15, 'ease': 'out'}, 'op': {'0': 0, '0.1': op, '0.85': op, '1': 0}, 'fade': 0})

def arcs(L, pre, at, life, pos, r, spin=300, tilt=0, op=1, n=2):
    """thin glowing white swirl lines (outer rings of the reference)"""
    for j in range(n):
        L.append({'id': f'{pre}arcs{j}', 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'plane', 'mat': 'tex', 'tex': T('water_white_arcs'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0,
                  'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': pos, 'rot': [90 + (tilt if j == 0 else -tilt * .6), j * 50, (tilt * .5 if j else 0)], 'spin': spin * (1 if j == 0 else -.8), 'int': 1.4,
                  'scale': {'0': r * (.6 + .25 * j), '0.15': r * (1 + .3 * j), '0.85': r * (1.05 + .3 * j), '1': r * (1.2 + .3 * j), 'ease': 'out'}, 'op': {'0': 0, '0.12': op, '0.85': op, '1': 0}, 'fade': 0})

def sparkles(L, pre, at, life, pos, r, rate=14, burst=0):
    L.append({'id': pre + 'stars', 't': 'emit', 'at': at, 'life': life if not burst else .04, 'att': 'feet', 'pos': pos, 'rate': rate, 'burst': burst, 'from': 'sphere', 'fr': r, 'dir': 'tangent' if not burst else 'out',
              'speed': [1, 3] if not burst else [3, 7], 'plife': [.25, .5], 'look': 'spark', 'size': [.5, 1.1], 'col': C['white'], 'c2': C['pale'], 'gravity': 0, 'drag': 1})
    L.append({'id': pre + 'streak', 't': 'emit', 'at': at, 'life': life if not burst else .04, 'att': 'feet', 'pos': pos, 'rate': rate * 3, 'burst': burst * 2, 'from': 'ring', 'fr': r * 1.1, 'dir': 'tangent' if not burst else 'out',
              'speed': [6, 10], 'plife': [.15, .3], 'look': 'streak', 'size': [1, 1.8], 'col': C['white'], 'c2': C['light'], 'gravity': 0, 'drag': 0, 'curl': False})

def drops(L, pre, at, pos, n=20, sp=(4, 8), up=1.5, r=.4, col=None, life=.04):
    L.append({'id': pre + 'drops', 't': 'emit', 'at': at, 'life': life, 'att': 'feet', 'pos': pos, 'burst': n, 'rate': 0, 'from': 'sphere', 'fr': r, 'dir': 'out', 'up': [up * .5, up],
              'speed': list(sp), 'plife': [.35, .7], 'look': 'glow', 'size': [.35, .7], 'col': col or C['pale'], 'c2': C['mid'], 'gravity': 9, 'drag': .5})

def splash(L, pre, at, pos, r=1.5, n=5, h=1.2, life=.45, cols=None):
    """splash crown: ribbons curling up and out from a point (hard-edged toon water)"""
    cols = cols or [C['light'], C['pale'], C['mid'], C['white'], C['light']]
    for j in range(n):
        a = j / n * 2 * math.pi + rnd.uniform(-.3, .3)
        path = [[0, 0, 0], [math.cos(a) * r * .45, h * .8, math.sin(a) * r * .45], [math.cos(a) * r, h * .55, math.sin(a) * r]]
        L.append({'id': f'{pre}crown{j}', 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'ribbon', 'path': path, 'wk': .35, 'mat': 'tex', 'tex': T('water_toon_band'),
                  'col': cols[j % len(cols)], 'col2': '#000000', 'rim': 0, 'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': pos,
                  'scale': {'0': .2, '0.35': 1, '1': 1.2, 'ease': 'out'}, 'op': {'0': 1, '0.6': 1, '1': 0}, 'fade': 0})

def ripple(L, pre, at, pos, r=2.5, life=.5):
    L.append({'id': pre + 'ripple', 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'plane', 'mat': 'tex', 'tex': T('water_white_arcs'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0,
              'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': pos, 'rot': [90, rnd.uniform(0, 360), 0], 'spin': 200, 'int': 1.3, 'scale': {'0': r * .3, '1': r, 'ease': 'out'}, 'op': {'0': 1, '1': 0}, 'fade': 0})

# =================== style study: the reference orb ===================
L = []
Y = 1.6
ball(L, '', 0, 3, [0, Y, 0], 1.0, curve={'0': .2, '0.08': 1.0, '0.92': 1.0, '1': .2})
bands(L, 'in_', 0, 3, [0, Y, 0], 1.08, n=2, tilt=30, thick=.3, op=.85, cols=[C['light'], C['mid']])
bands(L, 'out_', .05, 2.9, [0, Y, 0], 1.4, n=2, tilt=18, thick=.16, cols=[C['white'], C['pale']])
disk(L, '', 0, 3, [0, Y - .55, 0], 4.2, spin=200)
arcs(L, '', 0, 3, [0, Y - .5, 0], 6.2, spin=260, tilt=6)
arcs(L, 'hi_', .05, 2.9, [0, Y + .25, 0], 4.2, spin=-340, tilt=14, n=1)
sparkles(L, '', 0, 3, [0, Y, 0], 1.7, rate=16)
save('style_toon', L, 'สไตล์น้ำ (ตามรูป style_toon_orb ผู้ใช้): ลูกน้ำแถบสีคม 4 เฉด + เส้นขาว • แถบพู่กันพันรอบ • จานน้ำวนฐาน • เส้นขาววนรอบ • ประกายขาว', ['style'])

def flat(L):
    """loop pieces: freeze curves at their steady value"""
    for l in L:
        sc = l.get('scale')
        if isinstance(sc, dict): l['scale'] = sc.get('0.12', sc.get('0.15', sc.get('0.1', sc.get('0.08', 1))))
        op = l.get('op')
        if isinstance(op, dict): l['op'] = max(v for k, v in op.items() if k[0].isdigit())

# =================== dragon head model (ult) — head only, body = water stream (designs/water_ref/dragon.png) ===================
tube = lambda pid, pos, path, r0, r1=0, mir=False: {'id': pid, 'k': 'tube', 'path': path, 'r0': r0, 'r1': r1, 'sides': 10, 'seg': 24, 'pos': pos, 'mir': mir}
HEAD = {'v': 1, 'desc': 'หัวมังกรน้ำ (อัลติสายน้ำ): กะโหลก ปากยาว ขากรรไกร เขาโค้งไปหลัง แผงคอน้ำพลิ้ว หนวดยาว ครีบแก้ม — หัวหัน +z', 'mat': 'solid', 'pal': 'ice', 'tags': ['water', 'dragon', 'head'],
        'parts': [
            {'id': 'skull', 'k': 'sphere', 'r': .5, 'seg': 20, 'pos': [0, 0, 0], 'scale': [1, .85, 1.25]},
            {'id': 'snout', 'k': 'sphere', 'r': .36, 'seg': 18, 'pos': [0, -.06, .62], 'scale': [1, .72, 1.65]},
            {'id': 'jaw', 'k': 'sphere', 'r': .3, 'seg': 16, 'pos': [0, -.34, .45], 'scale': [1, .38, 1.55], 'rot': [12, 0, 0]},
            tube('brow', [.2, .26, .3], [[0, 0, 0], [.05, .1, -.25], [.08, .12, -.45]], .09, 0, True),
            tube('horn', [.2, .3, -.15], [[0, 0, 0], [.05, .38, -.35], [.08, .55, -.9], [.05, .48, -1.45]], .11, 0, True),
            tube('mane0', [0, .25, -.4], [[0, 0, 0], [0, .3, -.55], [0, .12, -1.15], [0, .3, -1.6]], .16, 0),
            tube('mane1', [.3, .05, -.35], [[0, 0, 0], [.25, .2, -.55], [.4, -.05, -1.05], [.55, .12, -1.45]], .13, 0, True),
            tube('mane2', [.25, -.2, -.3], [[0, 0, 0], [.3, -.2, -.45], [.45, -.45, -.95]], .1, 0, True),
            tube('whisker', [.24, -.16, .9], [[0, 0, 0], [.3, -.12, -.3], [.62, .02, -.9], [.72, .32, -1.5]], .05, 0, True),
            tube('fin', [.32, -.32, .12], [[0, 0, 0], [.35, -.15, -.4], [.45, -.05, -.7]], .08, 0, True),
        ]}
(ROOT / 'assets/fx/mesh/water_dragon_head.mesh.json').write_text(json.dumps(HEAD, ensure_ascii=False, indent=1), encoding='utf-8')
print('mesh water_dragon_head')

def head(L, pre, at, life, pos, rot, s=1.0, op=1):
    L.append({'id': pre + 'head', 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'model', 'model': 'water_dragon_head', 'mat': 'tex', 'tex': T('water_toon_ball'),
              'col': '#ffffff', 'col2': C['pale'], 'rim': .4, 'uvTile': [2, 2], 'uvScroll': [.4, 0], 'pos': pos, 'rot': rot, 'scale': s, 'op': op, 'fade': .1})

def body(L, pre, at, life, pos, w=.55, tl=.5):
    """water body following the head: wide toon trail + pale + white lines"""
    for j, (c, c2, ww, tt) in enumerate([(C['mid'], C['deep'], w, tl), (C['light'], C['mid'], w * .6, tl * .9), (C['white'], C['pale'], w * .18, tl * .7)]):
        L.append({'id': f'{pre}body{j}', 't': 'trail', 'at': at, 'life': life, 'att': 'feet', 'pos': pos, 'col': c, 'col2': c2, 'w': ww, 'tlife': tt, 'k': 1.0})

# =================== BA: wand slash → water line → 3 bullets ===================
L = []
arc = [[1.0, 2.5, .5], [.5, 2.15, 1.05], [-.1, 1.7, 1.25], [-.65, 1.2, 1.05], [-.95, .9, .55]]
L.append({'id': 'line', 't': 'mesh', 'at': 0, 'life': .72, 'att': 'feet', 'shape': 'ribbon', 'path': arc, 'wk': .42, 'mat': 'tex', 'tex': T('water_toon_ball'), 'col': '#ffffff', 'col2': C['pale'], 'rim': 0,
          'uvTile': [3, 1], 'uvScroll': [-1.2, 0], 'pos': [0, 0, 0], 'scale': {'0': .2, '0.12': 1, '0.85': 1, '1': .6, 'ease': 'out'}, 'op': {'0': 1, '0.8': 1, '1': 0}, 'fade': 0})
L.append({'id': 'lineW', 't': 'mesh', 'at': 0, 'life': .72, 'att': 'feet', 'shape': 'ribbon', 'path': arc, 'wk': .1, 'mat': 'tex', 'tex': T('water_toon_band'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0,
          'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': [0, .03, .02], 'scale': {'0': .2, '0.12': 1, '1': 1}, 'op': {'0': 1, '0.8': 1, '1': 0}, 'fade': 0})
L.append({'id': 'swish', 't': 'emit', 'at': 0, 'life': .12, 'att': 'feet', 'pos': [0, 1.7, .8], 'rate': 120, 'from': 'ring', 'fr': .7, 'dir': 'tangent', 'speed': [5, 8], 'plife': [.15, .3], 'look': 'streak', 'size': [1, 1.6], 'col': C['white'], 'c2': C['light'], 'gravity': 0, 'drag': 0, 'curl': False})
for i, t0 in enumerate([.25, .45, .65]):   # a little splash on the line as each bullet leaves
    p = arc[1 + i]
    drops(L, f'b{i}_', t0, p, n=6, sp=(2, 4), up=1, r=.1)
    L.append({'id': f'b{i}_flash', 't': 'flash', 'at': t0, 'life': .07, 'att': 'feet', 'pos': p, 'col': C['pale'], 'size0': .2, 'size': .7, 'k': .35})
sparkles(L, '', 0, .7, [0, 1.7, .7], .8, rate=10)
arc2 = [[p[0] * 1.15, p[1] + .25, p[2] * 1.2] for p in arc]   # second water stream curling round the first
L.append({'id': 'line2', 't': 'mesh', 'at': .03, 'life': .6, 'att': 'feet', 'shape': 'ribbon', 'path': arc2, 'wk': .22, 'mat': 'tex', 'tex': T('water_toon_ball'), 'col': '#ffffff', 'col2': C['pale'], 'rim': 0,
          'uvTile': [3, 1], 'uvScroll': [-1.6, 0], 'pos': [0, 0, 0], 'scale': {'0': .2, '0.15': 1, '1': 1.1, 'ease': 'out'}, 'op': {'0': 1, '0.7': .9, '1': 0}, 'fade': 0})
arcs(L, 'a_', 0, .6, [0, 1.6, .2], 3.2, spin=-500, tilt=25, n=1)
disk(L, 'f_', 0, .7, [0, .05, 0], 2.2, spin=260, op=.75)
save('ba_slash', L, 'BA สายน้ำ: ตวัดไม้เป็นเส้นน้ำการ์ตูน (แถบน้ำไหล + เส้นขาว) ค้าง 0.7 วิ • น้ำกระเซ็นตอนกระสุนออก 3 จังหวะ (0.25/0.45/0.65) — ตามตัวผู้เล่น', ['ba', 'ingame'])

L = []
ball(L, '', 0, 1, [0, 0, 0], .17, scroll=.6)
L.append({'id': 'wrap', 't': 'mesh', 'at': 0, 'life': 1, 'att': 'feet', 'shape': 'model', 'model': 'wind_pieces0', 'mat': 'tex', 'tex': T('water_toon_band'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0, 'uvTile': [1, 1], 'uvScroll': [0, 0],
          'pos': [0, 0, 0], 'rot': [80, 0, 0], 'spin': 720, 'scale': [.3, .12, .3], 'op': 1, 'fade': 0})
L.append({'id': 'spray', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, 0, 0], 'rate': 70, 'from': 'sphere', 'fr': .12, 'dir': 'aim', 'yaw': 180, 'spread': .25, 'speed': [2, 4], 'plife': [.12, .25], 'look': 'streak', 'size': [.8, 1.4], 'col': C['pale'], 'c2': C['mid'], 'gravity': 0, 'drag': 2, 'curl': False})
L.append({'id': 'drip', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, 0, 0], 'rate': 25, 'from': 'sphere', 'fr': .12, 'dir': 'random', 'speed': [.3, 1], 'plife': [.2, .35], 'look': 'glow', 'size': [.3, .5], 'col': C['light'], 'c2': C['mid'], 'gravity': 3, 'drag': 1})
save('ba_fly', L, 'BA สายน้ำ: กระสุนน้ำการ์ตูน (ลูกแถบน้ำ + แถบขาวหมุน + ละอองหาง) — ตามกระสุน', ['ba', 'ingame'], loop=True, dur=1, att='point')
L = []
splash(L, '', 0, [0, -.3, 0], r=.6, n=4, h=.6, life=.35)
drops(L, '', 0, [0, 0, 0], n=10, sp=(2, 5), up=2, r=.1)
L.append({'id': 'flash', 't': 'flash', 'at': 0, 'life': .08, 'att': 'feet', 'pos': [0, 0, 0], 'col': C['pale'], 'size0': .3, 'size': .9, 'k': .4})
save('ba_hit', L, 'BA สายน้ำ: โดน = น้ำสาดมงกุฎเล็ก + หยดน้ำ', ['ba', 'ingame'], att='point')

# =================== shield: toon water bubble (loop) + healing ===================
L = []
ball(L, '', 0, 1, [0, 1.15, 0], 1.35, op=.42, scroll=.12)
bands(L, '', 0, 1, [0, 1.15, 0], 1.42, n=3, tilt=40, thick=.22, op=.9, cols=[C['white'], C['pale'], C['light']])
disk(L, '', 0, 1, [0, .05, 0], 3.2, spin=160, op=.85)
arcs(L, '', 0, 1, [0, .1, 0], 4.2, spin=240, n=1)
sparkles(L, '', 0, 1, [0, 1.2, 0], 1.4, rate=8)
flat(L)
save('shield_bubble', L, 'โล่สายน้ำ: ฟองน้ำการ์ตูนใส (ลายแถบน้ำ 42%) + แถบน้ำ/ขาวพันรอบ + จานน้ำวนที่เท้า (วนตลอดที่ยกโล่)', ['shield', 'ingame'], loop=True, dur=1)
L = []
L.append({'id': 'rise', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, .2, 0], 'rate': 22, 'from': 'ring', 'fr': .7, 'dir': 'up', 'spread': .1, 'speed': [1.5, 2.5], 'plife': [.5, .8], 'look': 'glow', 'size': [1, 1.6], 'col': C['light'], 'c2': C['mid'], 'gravity': -.5, 'drag': .5})
L.append({'id': 'plus', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, 1, 0], 'rate': 6, 'from': 'sphere', 'fr': .8, 'dir': 'up', 'speed': [.8, 1.4], 'plife': [.5, .8], 'look': 'spark', 'size': [1.4, 2], 'col': C['white'], 'c2': C['light'], 'gravity': -.5, 'drag': .5})
L.append({'id': 'swirl', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, .3, 0], 'rate': 40, 'from': 'ring', 'fr': 1.0, 'dir': 'tangent', 'up': [1.5, 2.5], 'speed': [3, 4], 'plife': [.4, .6], 'look': 'streak', 'size': [1.2, 2], 'col': C['white'], 'c2': C['light'], 'gravity': 0, 'drag': 0, 'curl': False})
save('shield_heal', L, 'โล่สายน้ำ: กำลังฮีล = หยดน้ำเรืองลอยขึ้น + ประกายขาว (วน)', ['shield', 'ingame'], loop=True, dur=1)

# =================== dash: sink / pop out / clone ===================
L = []
disk(L, '', 0, .4, [0, .05, 0], 2.6, spin=-420)
L.append({'id': 'down', 't': 'emit', 'at': 0, 'life': .3, 'att': 'feet', 'pos': [0, 2, 0], 'rate': 90, 'from': 'ring', 'fr': .6, 'dir': 'down', 'spread': .2, 'speed': [5, 8], 'plife': [.15, .3], 'look': 'streak', 'size': [1, 1.6], 'col': C['pale'], 'c2': C['mid'], 'gravity': 0, 'drag': 0, 'curl': False})
splash(L, '', 0, [0, 0, 0], r=1.0, n=6, h=1.0, life=.35)
ripple(L, '', 0, [0, .06, 0], r=3, life=.45)
save('dash_sink', L, 'Dash สายน้ำ: จมลงพื้น — จานน้ำวนหมุนกลับ + น้ำไหลลง + มงกุฎน้ำ + วงขาว', ['dash', 'ingame'])
L = []
splash(L, '', 0, [0, 0, 0], r=2.2, n=8, h=2.4, life=.5, cols=[C['light'], C['pale'], C['white'], C['mid']])
ripple(L, '', 0, [0, .06, 0], r=6.5, life=.55)
disk(L, '', 0, .5, [0, .05, 0], 4.5, spin=420)
drops(L, '', 0, [0, .5, 0], n=34, sp=(5, 10), up=4, r=.5)
sparkles(L, '', 0, .4, [0, 1, 0], 1.5, burst=12)
L.append({'id': 'shake', 't': 'screen', 'at': 0, 'life': .15, 'shake': 2, 'own': True})
save('dash_pop', L, 'Dash สายน้ำ: โผล่ขึ้นมา — มงกุฎน้ำใหญ่ 8 แฉก + วงขาวกว้าง (ผลักรอบตัว) + หยดน้ำกระจาย', ['dash', 'ingame'])
L = []
L.append({'id': 'body', 't': 'mesh', 'at': 0, 'life': 1, 'att': 'feet', 'shape': 'cylinder', 'mat': 'tex', 'tex': T('water_toon_ball'), 'col': '#ffffff', 'col2': C['pale'], 'rim': .5,
          'uvTile': [2, 1], 'uvScroll': [.3, -.4], 'pos': [0, .85, 0], 'scale': [.38, 1.3, .38], 'op': .8, 'fade': 0})
L.append({'id': 'headb', 't': 'mesh', 'at': 0, 'life': 1, 'att': 'feet', 'shape': 'sphere', 'mat': 'tex', 'tex': T('water_toon_ball'), 'col': '#ffffff', 'col2': C['pale'], 'rim': .5,
          'uvTile': [1, 1], 'uvScroll': [.4, 0], 'pos': [0, 1.85, 0], 'scale': .32, 'op': .85, 'fade': 0})
bands(L, 'cl_', 0, 1, [0, 1.0, 0], .6, n=2, tilt=25, thick=.2, op=.9)
disk(L, '', 0, 1, [0, .05, 0], 1.8, spin=180, op=.9)
L.append({'id': 'drip', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, 1.2, 0], 'rate': 14, 'from': 'sphere', 'fr': .4, 'dir': 'down', 'speed': [.5, 1], 'plife': [.3, .5], 'look': 'glow', 'size': [.3, .5], 'col': C['light'], 'c2': C['mid'], 'gravity': 6, 'drag': .5})
flat(L)
save('clone', L, 'Dash สายน้ำ: ร่างโคลนน้ำ (ตัว+หัวลายน้ำไหล แถบน้ำพัน จานวนที่เท้า หยดน้ำ) — วนจนกว่าจะกลับ/หมดเวลา', ['dash', 'ingame'], loop=True, dur=1)

# =================== Riptide: giant toon wave runs 20 m in 0.8 s ===================
L = []
LEN, TT = 20.0, .8
mv = lambda y=0, dz=0, x=0: {'0': [x, y, 1 + dz], '1': [x, y, 1 + LEN + dz]}
prof = [[0, 0, -1.6], [0, 1.0, -1.0], [0, 2.4, -.35], [0, 3.6, .3], [0, 4.2, 1.1], [0, 3.9, 1.8], [0, 3.1, 2.1]]
L.append({'id': 'wall', 't': 'mesh', 'at': 0, 'life': TT + .15, 'att': 'feet', 'shape': 'ribbon', 'path': prof, 'wk': 10, 'mat': 'tex', 'tex': T('water_wave_sheet'), 'col': '#ffffff', 'col2': C['pale'], 'rim': 0,
          'uvTile': [1, 1], 'uvScroll': [0, .25], 'pos': mv(), 'scale': {'0': [1, .2, 1], '0.18': [1, 1, 1], '0.85': [1, 1, 1], '1': [1.05, .3, 1], 'ease': 'out'}, 'op': {'0': 1, '0.88': 1, '1': 0}, 'fade': 0})
L.append({'id': 'back', 't': 'mesh', 'at': 0, 'life': TT + .15, 'att': 'feet', 'shape': 'ribbon', 'path': [[0, 0, -2.6], [0, 1.6, -1.8], [0, 3.0, -.8], [0, 3.8, .2]], 'wk': 9.4, 'mat': 'tex', 'tex': T('water_wave_sheet'), 'col': '#ffffff', 'col2': C['pale'], 'rim': 0,
          'uvTile': [1, 1], 'uvScroll': [0, -.2], 'pos': mv(), 'scale': {'0': [1, .2, 1], '0.18': [1, 1, 1], '0.85': [1, 1, 1], '1': [1, .3, 1]}, 'op': {'0': 1, '0.88': 1, '1': 0}, 'fade': 0})
for j, (y, dz, c, wk) in enumerate([(4.25, 1.15, C['white'], .55), (3.95, 1.85, C['pale'], .45), (3.0, 2.15, C['white'], .3)]):   # foam crest lines across the lip
    L.append({'id': f'crest{j}', 't': 'mesh', 'at': 0, 'life': TT + .15, 'att': 'feet', 'shape': 'ribbon', 'path': [[-5.2, 0, 0], [-2.5, .15, .1], [0, 0, 0], [2.5, .15, .1], [5.2, 0, 0]], 'wk': wk, 'mat': 'tex', 'tex': T('water_toon_band'),
              'col': c, 'col2': '#000000', 'rim': 0, 'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': mv(y, dz), 'scale': {'0': [1, .2, 1], '0.18': 1, '1': 1}, 'op': {'0': 1, '0.88': 1, '1': 0}, 'fade': 0})
L.append({'id': 'spray', 't': 'emit', 'at': 0, 'life': TT, 'att': 'feet', 'pos': mv(4.2, 1.4), 'rate': 160, 'from': 'box', 'fr': 5, 'fh': .2, 'dir': 'up', 'spread': .8, 'speed': [3, 7], 'up': [1, 3], 'plife': [.3, .6], 'look': 'glow', 'size': [.4, .8], 'col': C['white'], 'c2': C['pale'], 'gravity': 7, 'drag': 1})
L.append({'id': 'foot', 't': 'emit', 'at': 0, 'life': TT, 'att': 'feet', 'pos': mv(.2, 2), 'rate': 120, 'from': 'box', 'fr': 5, 'fh': .2, 'dir': 'aim', 'spread': .7, 'speed': [4, 8], 'plife': [.2, .4], 'look': 'streak', 'size': [1.2, 2], 'col': C['white'], 'c2': C['light'], 'gravity': 0, 'drag': 2, 'curl': False})
L.append({'id': 'trailw', 't': 'emit', 'at': 0, 'life': TT, 'att': 'feet', 'pos': mv(.08, -1.5), 'rate': 70, 'from': 'box', 'fr': 5, 'fh': .2, 'dir': 'flat', 'speed': [.5, 1.5], 'plife': [.4, .7], 'look': 'glow', 'size': [1.5, 2.5], 'col': C['pale'], 'c2': C['light'], 'gravity': 0, 'drag': 1})
L.append({'id': 'stars', 't': 'emit', 'at': 0, 'life': TT, 'att': 'feet', 'pos': mv(3.5, 1), 'rate': 30, 'from': 'box', 'fr': 5, 'fh': .5, 'dir': 'random', 'speed': [1, 3], 'plife': [.25, .45], 'look': 'spark', 'size': [.6, 1.1], 'col': C['white'], 'c2': C['pale'], 'gravity': 0, 'drag': 1})
splash(L, 'end_', TT, [0, 0, 1 + LEN], r=3, n=8, h=3, life=.5)
drops(L, 'end_', TT, [0, 2, 1 + LEN], n=40, sp=(5, 9), up=3, r=2)
ripple(L, 'cast_', 0, [0, .06, 1], r=5, life=.5)
L.append({'id': 'shake', 't': 'screen', 'at': 0, 'life': .2, 'shake': 2.5, 'own': True})
save('riptide', L, 'Riptide: คลื่นยักษ์การ์ตูนสูง ~4 ม. กว้าง 10 ม. วิ่ง 20 ม. ใน 0.8 วิ — ผิวคลื่นแถบน้ำไหล ยอดฟองขาว 3 เส้น ละอองพุ่ง ฟองน้ำหลังคลื่น สุดทางแตกสาด', ['riptide', 'ingame'])

# =================== Tidecaller Orb: helper orb at the shoulder ===================
L = []
ball(L, '', 0, 1, [0, 0, 0], .3, scroll=.3)
bands(L, '', 0, 1, [0, 0, 0], .38, n=2, tilt=35, thick=.12, op=.95)
arcs(L, '', 0, 1, [0, -.05, 0], 1.3, spin=380, tilt=20, n=1)
sparkles(L, '', 0, 1, [0, 0, 0], .45, rate=10)
L.append({'id': 'glow', 't': 'flash', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, 0, 0], 'col': C['neon'], 'size0': .9, 'size': .9, 'k': .25})
flat(L)
save('fam_orb', L, 'Tidecaller Orb: ลูกน้ำผู้ช่วย (ลูกน้ำการ์ตูนเล็ก + แถบพัน + เส้นขาววน + เรืองฟ้า ให้เห็นชัด) — ที่ไหล่ วนตลอด 10 วิ', ['tidecaller', 'ingame'], loop=True, dur=1, att='point')
L = []
ball(L, '', 0, 1, [0, 0, 0], .13, scroll=.8)
L.append({'id': 'tail', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, 0, 0], 'rate': 90, 'from': 'sphere', 'fr': .08, 'dir': 'random', 'speed': [.2, .6], 'plife': [.15, .25], 'look': 'glow', 'size': [.3, .5], 'col': C['neon'], 'c2': C['light'], 'gravity': 0, 'drag': 2})
save('fam_shot', L, 'Tidecaller Orb: ลูกยิงตามล็อกเป้า (ลูกน้ำเล็ก + หางเรือง)', ['tidecaller', 'ingame'], loop=True, dur=1, att='point')
L = []
drops(L, '', 0, [0, 0, 0], n=8, sp=(2, 4), up=1.5, r=.1, col=C['neon'])
L.append({'id': 'flash', 't': 'flash', 'at': 0, 'life': .08, 'att': 'feet', 'pos': [0, 0, 0], 'col': C['neon'], 'size0': .2, 'size': .7, 'k': .35})
save('fam_hit', L, 'Tidecaller Orb: ลูกยิงตามโดน', ['tidecaller', 'ingame'], att='point')

# =================== Aqua Cage ===================
L = []
ball(L, '', 0, 1, [0, 0, 0], .32, op=.75, scroll=.5)
bands(L, '', 0, 1, [0, 0, 0], .42, n=2, tilt=40, thick=.13, op=1, cols=[C['white'], C['pale']])
L.append({'id': 'bub', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, 0, 0], 'rate': 30, 'from': 'sphere', 'fr': .3, 'dir': 'random', 'speed': [.3, .8], 'plife': [.25, .4], 'look': 'ring', 'size': [1.2, 2], 'col': C['white'], 'c2': C['pale'], 'gravity': 0, 'drag': 2})
flat(L)
save('cage_fly', L, 'Aqua Cage: ฟองน้ำพุ่ง (ใสกว่า BA มีฟองเล็กรอบ แถบขาวพัน) — ตามกระสุน', ['aquacage', 'ingame'], loop=True, dur=1, att='point')
L = []
CT = 2.0
ball(L, '', 0, CT, [0, 1.1, 0], 1.3, op=.4, scroll=.08, curve={'0': .3, '0.06': 1.35, '0.12': 1.25, '0.95': 1.28, '1': 1.5})
bands(L, '', 0, CT, [0, 1.1, 0], 1.38, n=3, tilt=50, thick=.18, op=.95, cols=[C['white'], C['pale'], C['white']])
arcs(L, '', 0, CT, [0, .2, 0], 3.4, spin=200, tilt=8, n=1)
L.append({'id': 'bubbles', 't': 'emit', 'at': 0, 'life': CT, 'att': 'feet', 'pos': [0, .6, 0], 'rate': 18, 'from': 'disc', 'fr': .8, 'dir': 'up', 'spread': .2, 'speed': [.6, 1.2], 'plife': [.6, 1], 'look': 'ring', 'size': [1.2, 2.2], 'col': C['white'], 'c2': C['pale'], 'gravity': -.3, 'drag': .5})
sparkles(L, '', 0, CT, [0, 1.1, 0], 1.3, rate=8)
splash(L, 'pop_', CT - .05, [0, .4, 0], r=1.4, n=6, h=1.3, life=.4)
drops(L, 'pop_', CT - .05, [0, 1.1, 0], n=30, sp=(3, 7), up=2, r=1.2)
L.append({'id': 'in', 't': 'flash', 'at': 0, 'life': .1, 'att': 'feet', 'pos': [0, 1.1, 0], 'col': C['pale'], 'size0': .4, 'size': 1.6, 'k': .45})
save('cage_bubble', L, 'Aqua Cage: ฟองขังรอบตัวศัตรู 2 วิ — ฟองน้ำการ์ตูนใส (40%) แถบขาวพัน ฟองเล็กลอยขึ้น จบ = แตกสาด', ['aquacage', 'ingame'])

# =================== Abyssal Beam (3 s, 35 m) ===================
def beam(L, pre, at, life, w, BL, white=.4, crown=1.0):
    for j, ro in enumerate([0, 90]):
        L.append({'id': f'{pre}core{j}', 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'ribbon', 'path': [[0, 0, 0], [0, 0, BL * .5], [0, 0, BL]], 'wk': w, 'mat': 'tex', 'tex': T('water_toon_ball'),
                  'col': '#ffffff', 'col2': C['pale'], 'rim': 0, 'uvTile': [6, 1], 'uvScroll': [-5, .3 * (1 if j else -1)], 'pos': [0, 1.6, .7], 'rot': [0, 0, ro], 'scale': 1, 'op': 1, 'fade': 0})
    for j, ro in enumerate([0, 90]):
        L.append({'id': f'{pre}white{j}', 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'ribbon', 'path': [[0, 0, 0], [0, 0, BL]], 'wk': white, 'mat': 'tex', 'tex': T('water_toon_band'),
                  'col': '#ffffff', 'col2': '#000000', 'rim': 0, 'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': [0, 1.6, .75], 'rot': [0, 0, ro + 45], 'scale': 1, 'op': 1, 'fade': 0})
    # splash crown round the mouth (reference: big circular splash facing forward) + white swirl ring
    L.append({'id': pre + 'mouth', 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'plane', 'mat': 'tex', 'tex': T('water_toon_swirl'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0,
              'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': [0, 1.6, .8], 'rot': [0, 0, 0], 'spin': 500, 'scale': 2.6 * crown, 'op': .95, 'fade': 0})
    L.append({'id': pre + 'ring', 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'plane', 'mat': 'tex', 'tex': T('water_white_arcs'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0,
              'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': [0, 1.6, 1.0], 'rot': [0, 0, 0], 'spin': -650, 'int': 1.4, 'scale': 4.2 * crown, 'op': 1, 'fade': 0})
    L.append({'id': pre + 'spray', 't': 'emit', 'at': at, 'life': life, 'att': 'feet', 'pos': [0, 1.6, 1], 'rate': 160, 'from': 'sphere', 'fr': .5, 'dir': 'aim', 'spread': .35, 'speed': [14, 24], 'plife': [.25, .5], 'look': 'streak', 'size': [1.4, 2.4], 'col': C['white'], 'c2': C['light'], 'gravity': 0, 'drag': 1, 'curl': False})
    L.append({'id': pre + 'side', 't': 'emit', 'at': at, 'life': life, 'att': 'feet', 'pos': [0, 1.6, 1], 'rate': 60, 'from': 'ring', 'fr': .8, 'dir': 'out', 'spread': .3, 'speed': [3, 6], 'plife': [.3, .5], 'look': 'glow', 'size': [.4, .8], 'col': C['pale'], 'c2': C['mid'], 'gravity': 4, 'drag': 1})
    L.append({'id': pre + 'bubs', 't': 'emit', 'at': at, 'life': life, 'att': 'feet', 'pos': {'0': [0, 1.6, 3], '1': [0, 1.6, BL - 2]}, 'rate': 60, 'from': 'sphere', 'fr': 1.2, 'dir': 'random', 'speed': [.5, 1.5], 'plife': [.3, .6], 'look': 'ring', 'size': [1.2, 2.4], 'col': C['white'], 'c2': C['pale'], 'gravity': 0, 'drag': 1})
L = []
L.append({'id': 'gather', 't': 'emit', 'at': 0, 'life': .5, 'att': 'wand', 'pos': [0, 0, 0], 'rate': 160, 'from': 'sphere', 'fr': 1.6, 'dir': 'in', 'speed': [5, 8], 'plife': [.15, .25], 'look': 'streak', 'size': [1, 1.6], 'col': C['pale'], 'c2': C['mid'], 'gravity': 0, 'drag': 0, 'curl': False})
ball(L, 'g_', 0, .55, [0, 1.6, .7], .3, curve={'0': .05, '1': .45}, scroll=.8)
arcs(L, 'g_', 0, .55, [0, .1, 0], 3.2, spin=-400, n=1)
disk(L, 'g_', 0, .55, [0, .06, 0], 2.6, spin=-300)
save('beam_cast', L, 'Abyssal Beam: ร่าย 0.5 วิ — น้ำถูกดูดเข้าปลายไม้ ลูกน้ำโตขึ้น วงขาว/จานน้ำวนใต้เท้า (ตามตัว)', ['abyssal', 'ingame'])
L = []
beam(L, '', 0, 1, 2.2, 35.0, white=.6)
L.append({'id': 'feet', 't': 'mesh', 'at': 0, 'life': 1, 'att': 'feet', 'shape': 'plane', 'mat': 'tex', 'tex': T('water_toon_swirl'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0, 'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': [0, .05, 0], 'rot': [90, 0, 0], 'spin': 260, 'scale': 2.6, 'op': .9, 'fade': 0})
L.append({'id': 'shake', 't': 'screen', 'at': 0, 'life': 1, 'shake': .6, 'own': True})
save('beam_loop', L, 'Abyssal Beam: ลำน้ำ 35 ม. (แถบน้ำไหลไขว้ 2 แผ่น + แกนขาว) ปากลำมีจานน้ำวน + วงขาวหมุนแบบรูปอ้างอิง ละอองพุ่งตามลำ — วน 3 วิ ตามตัว', ['abyssal', 'ingame'], loop=True, dur=1)

# =================== Moonwater Arts ===================
L = []
disk(L, '', 0, 1, [0, .05, 0], 2.4, spin=140, op=.8)
arcs(L, '', 0, 1, [0, .08, 0], 3.2, spin=-220, n=1)
L.append({'id': 'moon', 't': 'mesh', 'at': 0, 'life': 1, 'att': 'feet', 'shape': 'crescent', 'wk': .3, 'mat': 'glow', 'col': C['light'], 'col2': C['mid'], 'rim': 0,
          'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': [0, 2.7, -.45], 'rot': [0, 0, 30], 'scale': .6, 'op': 1, 'fade': 0})
L.append({'id': 'mist', 't': 'emit', 'at': 0, 'life': 1, 'att': 'wand', 'pos': [0, 0, 0], 'rate': 30, 'from': 'sphere', 'fr': .12, 'dir': 'random', 'speed': [.2, .6], 'plife': [.3, .5], 'look': 'glow', 'size': [.4, .7], 'col': C['white'], 'c2': C['pale'], 'gravity': -.3, 'drag': 1})
sparkles(L, '', 0, 1, [0, 1.2, 0], 1.1, rate=8)
flat(L)
save('moon_aura', L, 'Moonwater Arts: 8 วิ — จานน้ำวน + วงขาวที่เท้า พระจันทร์เสี้ยวน้ำหลังหัว ปลายไม้มีละอองขาว (วน ตามตัว)', ['moonwater', 'ingame'], loop=True, dur=1)
L = []
beam(L, '', 0, .6, .9, 45.0, white=.3, crown=.7)
for l in L:
    if l['t'] == 'mesh': l['op'] = {'0': 1, '0.65': 1, '1': 0}
    if l['id'].startswith('core') or l['id'].startswith('white'): l['scale'] = {'0': [1, 1, .2], '0.12': 1, '0.7': 1, '1': [.2, .2, 1]}
L.append({'id': 'kick', 't': 'flash', 'at': 0, 'life': .1, 'att': 'feet', 'pos': [0, 1.6, .9], 'col': C['white'], 'size0': .4, 'size': 1.6, 'k': .5})
save('moon_beam', L, 'Moonwater Arts: ลำน้ำยิงแล้วหาย 45 ม. 0.6 วิ (ลำน้ำบาง + แกนขาว + วงขาวที่ปาก)', ['moonwater', 'ingame'])

# =================== Dragon of the Deep (ult) ===================
L = []
P, R = {}, {}
for k in range(21):   # intro: head circles the caster, then rises above the right shoulder
    u = k / 20; ph = u * 2 * math.pi * 1.25; rr = 2.4 - .6 * u
    if u < .8:
        x, y, z = rr * math.sin(ph), 1.2 + 1.6 * u + .4 * math.sin(ph * 2), rr * math.cos(ph); yaw = math.degrees(math.atan2(math.cos(ph), -math.sin(ph)))
    else:
        w = (u - .8) / .2; x, y, z = 1.5 * w + rr * math.sin(ph) * (1 - w), 3.3 * w + (1.2 + 1.6 * u) * (1 - w), -.3 * w + rr * math.cos(ph) * (1 - w); yaw = 0
    P[str(round(u, 3))] = [round(x, 3), round(y, 3), round(z, 3)]; R[str(round(u, 3))] = [10, round(yaw, 1), -15]
head(L, '', 0, 1.0, P, R, s={'0': .4, '0.15': 2.0, '1': 2.0})
body(L, '', 0, 1.0, P, w=1.3, tl=.7)
splash(L, 'up_', 0, [0, 0, 1.5], r=1.4, n=6, h=2, life=.45)
L.append({'id': 'drops', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': P, 'rate': 60, 'from': 'sphere', 'fr': .4, 'dir': 'random', 'speed': [1, 3], 'plife': [.3, .5], 'look': 'glow', 'size': [.4, .7], 'col': C['pale'], 'c2': C['mid'], 'gravity': 5, 'drag': .5})
sparkles(L, '', 0, 1, [0, 1.6, 0], 2.2, rate=14)
save('dragon_intro', L, 'Dragon of the Deep: มังกรน้ำโผล่ (หัว + ตัวเป็นสายน้ำ) เลื้อยวนรอบตัว 1 วิ แล้วขึ้นไปอยู่เหนือหัวขวา (ตามตัว)', ['dragon', 'ult', 'ingame'])
L = []
HP = {str(round(k / 8, 3)): [round(2.2 + .25 * math.sin(k / 8 * 2 * math.pi), 3), round(4.0 + .2 * math.sin(k / 8 * 4 * math.pi), 3), round(-.3 + .2 * math.cos(k / 8 * 2 * math.pi), 3)] for k in range(9)}
head(L, '', 0, 2, HP, [10, -20, -10], s=2.0)
CP = {str(round(k / 16, 3)): [round(2.2 + 1.2 * math.sin(k / 16 * 4 * math.pi), 3), round(3.0 - 1.4 * k / 16 + .3 * math.sin(k / 16 * 6 * math.pi), 3), round(-1.2 + .9 * math.cos(k / 16 * 4 * math.pi), 3)] for k in range(17)}
body(L, '', 0, 2, CP, w=1.1, tl=.8)
L.append({'id': 'drops', 't': 'emit', 'at': 0, 'life': 2, 'att': 'feet', 'pos': [1.5, 2.8, -.5], 'rate': 25, 'from': 'sphere', 'fr': .8, 'dir': 'down', 'speed': [.5, 1.5], 'plife': [.3, .5], 'look': 'glow', 'size': [.4, .7], 'col': C['pale'], 'c2': C['mid'], 'gravity': 6, 'drag': .5})
save('dragon_hover', L, 'Dragon of the Deep: มังกรลอยเหนือหัวขวา ตัวน้ำขดวนข้างล่าง (วน ระหว่างเลือกจุด 4 วิ)', ['dragon', 'ult', 'ingame'], loop=True, dur=2)
L = []
disk(L, '', 0, 1, [0, .06, 0], 22, spin=90, op=.45)
arcs(L, '', 0, 1, [0, .1, 0], 22.5, spin=-120, n=1)
flat(L)
save('dragon_aim', L, 'Dragon of the Deep: วงเล็งรัศมี 11 ม. (จานน้ำวน + เส้นขาว) วนตลอดที่เลือกจุด', ['dragon', 'ult', 'ingame'], loop=True, dur=1)
L = []
RISE, DIVE, POUR = .4, .3, 2.0
top = [6, 14, -8]
DP = {'0': [3, 9, -4], str(round(RISE / (RISE + DIVE + .3), 3)): top, str(round((RISE + DIVE) / (RISE + DIVE + .3), 3)): [0, 0, 0], '1': [0, -3, 0]}
head(L, 'd_', 0, RISE + DIVE + .3, DP, {'0': [-20, 30, 0], '0.5': [60, 140, 0], '0.72': [80, 145, 0], '1': [90, 145, 0]}, s=3.2)
body(L, 'd_', 0, RISE + DIVE + .3, DP, w=2.4, tl=1.0)
T0 = RISE + DIVE
for j, ro in enumerate([0, 90]):   # the stream keeps pouring into the ground for the whole hit window
    L.append({'id': f'pour{j}', 't': 'mesh', 'at': T0 - .05, 'life': POUR, 'att': 'feet', 'shape': 'ribbon', 'path': [top, [4, 9, -5], [1.5, 3.5, -1.8], [0, -.5, 0]], 'wk': 3.4, 'mat': 'tex', 'tex': T('water_toon_ball'),
              'col': '#ffffff', 'col2': C['pale'], 'rim': 0, 'uvTile': [4, 1], 'uvScroll': [-4, .2], 'pos': [0, 0, 0], 'rot': [0, 0, ro], 'scale': {'0': [1, 1, 1], '0.85': [1, 1, 1], '1': [.2, 1, .2]}, 'op': {'0': 1, '0.9': 1, '1': 0}, 'fade': 0})
for i in range(10):   # one splash crown per damage tick (every 0.2 s), scattered inside the 11 m area
    t = round(T0 + i * .2, 3); a = rnd.uniform(0, 2 * math.pi); r = 0 if i == 0 else rnd.uniform(0, 7)
    p = [round(math.cos(a) * r, 2), 0, round(math.sin(a) * r, 2)]
    splash(L, f'h{i}_', t, p, r=2.6 if i == 0 else rnd.uniform(1.4, 2.2), n=7, h=3 if i == 0 else 2.2, life=.5)
    drops(L, f'h{i}_', t, [p[0], .5, p[2]], n=18, sp=(4, 9), up=4, r=.6)
    ripple(L, f'h{i}_', t, [p[0], .07, p[2]], r=rnd.uniform(4, 7), life=.5)
L.append({'id': 'area', 't': 'mesh', 'at': T0, 'life': POUR + .3, 'att': 'feet', 'shape': 'plane', 'mat': 'tex', 'tex': T('water_toon_swirl'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0, 'uvTile': [1, 1], 'uvScroll': [0, 0],
          'pos': [0, .05, 0], 'rot': [90, 0, 0], 'spin': 160, 'scale': {'0': 4, '0.1': 22, '0.9': 22, '1': 24}, 'op': {'0': 0, '0.08': .85, '0.85': .8, '1': 0}, 'fade': 0})
arcs(L, 'a_', T0, POUR + .3, [0, .1, 0], 24, spin=-200, n=2)
L.append({'id': 'mist', 't': 'emit', 'at': T0, 'life': POUR, 'att': 'feet', 'pos': [0, .3, 0], 'rate': 120, 'from': 'disc', 'fr': 10, 'dir': 'up', 'spread': .5, 'speed': [2, 6], 'up': [1, 4], 'plife': [.3, .6], 'look': 'glow', 'size': [.5, 1], 'col': C['white'], 'c2': C['pale'], 'gravity': 6, 'drag': .5, 'x': True})
L.append({'id': 'flash', 't': 'flash', 'at': T0, 'life': .2, 'att': 'feet', 'pos': [0, 1, 0], 'col': C['pale'], 'size0': 1, 'size': 5, 'k': .7})
L.append({'id': 'shake', 't': 'screen', 'at': T0, 'life': .4, 'shake': 6, 'own': True})
L.append({'id': 'rumble', 't': 'screen', 'at': T0 + .3, 'life': POUR - .3, 'shake': 1.5, 'own': True})
save('dragon_dive', L, 'Dragon of the Deep: มังกรขึ้นสูง แล้วพุ่งลงจุด — สายน้ำตัวมังกรยังไหลลงพื้นต่อ 2 วิ น้ำสาดมงกุฎ 10 ครั้ง (ทุก 0.2 วิ ตรงกับดาเมจ) จานน้ำวน 11 ม. วงขาว ละอองพุ่ง', ['dragon', 'ult', 'ingame'])

print(len(FILES), 'files')
