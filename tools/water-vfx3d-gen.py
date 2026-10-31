# Water VFX v2 — 3D toon water (user 2026-10-31 round 2: "why ts look 2d … we do in 3d bro not 2d … add more water splash …
# is water still with us?"; refs designs/water_ref/ref3d_*). Real volumes shaded like the refs: lit side light blue,
# shadow side deep blue, white rim (fx mat 'toon'), sharp-tipped crescents, spiky splash crowns, water that stays:
# puddles + ripples on the ground, droplets that fall and splash.
# Run: python tools/water-tex.py && python tools/water-vfx3d-gen.py && node tools/fx-check.js
import json, math, random
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'assets/fx/water'; MESH = ROOT / 'assets/fx/mesh'
# palette sampled from the user's refs (round 3: "more color … kinda bright not that dark"): bright azure body, royal-blue shadow (no navy), cyan glints
# research (subagent 2026-10-31, Genshin hydro / Nami / stylized-water notes): hue-shift instead of darkening — shadow = royal blue leaning violet,
# body azure, lit sky-cyan, rim pale aqua, foam cool white; never navy/black. Ground is light grey → colour does the contrast.
C = dict(deep='#2d63ff', mid='#0aa8ff', light='#12d6ff', pale='#7ff7ff', white='#f4fdff', neon='#00f0e0', navy='#2d63ff', cyan='#0cfcfc')   # round 4: "สีจืดไป" → more saturated
import os
PAL = {'a': None,   # main (above)
       'b': dict(deep='#2563c9', mid='#12a8c8', light='#2ee0d0', pale='#a6fff0', white='#f2fffc', neon='#4dffd8', navy='#2563c9', cyan='#4dffd8'),   # teal, Nami-like
       'c': dict(deep='#5b4fd9', mid='#3f8cf2', light='#3edcf2', pale='#b5f7ff', white='#ffffff', neon='#c49bff', navy='#5b4fd9', cyan='#3edcf2')}   # turquoise + violet shadow
VAR = os.environ.get('WPAL', '')
if PAL.get(VAR): C.update(PAL[VAR])
T = lambda n: 'tex/' + n
# toon/glow shaders output the linear colour without converting back, so a hex shows darker than painted — lift it
lift = lambda h: '#' + ''.join('%02x' % round(255 * (int(h[i:i + 2], 16) / 255) ** (1 / 1.15)) for i in (1, 3, 5))
rnd = random.Random(23)

def mesh(name, parts, desc):
    (MESH / f'{name}.mesh.json').write_text(json.dumps({'v': 1, 'desc': desc, 'mat': 'solid', 'pal': 'ice', 'tags': ['water', '3d'], 'parts': parts}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('mesh', name)

def save(name, L, desc, tags, dur=None, loop=False, att=None):
    for l in L:
        if loop and not l.get('end'): l['loop'] = True
        if att: l['att'] = att
        if l.get('t') == 'emit' and isinstance(l.get('size'), list):
            k = {'glow': 2.5, 'spark': 4, 'ring': 2.5, 'streak': 1.5}.get(l.get('look'), 1); l['size'] = [round(v * k, 2) for v in l['size']]
    d = dur or round(max(l.get('at', 0) + l.get('life', .4) for l in L) + .05, 2)
    (OUT / f'{name}.fx.json').write_text(json.dumps({'v': 1, 'desc': desc, 'tags': ['water', '3d'] + tags, 'pal': 'ice', 'dur': d, 'seed': 23, 'layers': L}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('water/' + name, len(L), 'layers dur', d)

# ---------------- 3D water pieces (models) ----------------
def arc_pts(r, a0, a1, n=9, rise=0.0, wob=0.0):
    return [[round(r * math.sin(a0 + (a1 - a0) * i / (n - 1)), 3), round(rise * math.sin(math.pi * i / (n - 1)) + wob * math.sin(i * 1.7), 3), round(r * math.cos(a0 + (a1 - a0) * i / (n - 1)), 3)] for i in range(n)]
tube = lambda pid, path, r0, r1=0, pos=(0, 0, 0), sides=18: {'id': pid, 'k': 'tube', 'path': path, 'r0': r0, 'r1': r1, 'curve': 1.2, 'sides': sides, 'seg': 72, 'pos': list(pos)}
# crescent slash: thick in the middle, sharp tips (two tubes from the middle out) + a thinner leading wave lip
SL = []
for side, (a0, a1) in enumerate([(0, 1.25), (0, -1.25)]):
    SL.append(tube(f'half{side}', arc_pts(1.0, a0, a1, 10, rise=.05), .32, 0))
    SL.append(tube(f'lip{side}', [[p[0] * 1.1, p[1] + .18, p[2] * 1.1] for p in arc_pts(1.0, a0, a1 * .85, 8)], .13, 0))
mesh('water_slash', SL, 'น้ำ 3D: เสี้ยวน้ำ หนากลาง ปลายแหลม 2 ข้าง + ขอบคลื่นบางด้านหน้า (รัศมี 1 ม. ในระนาบ x-z หันหน้า +z)')
# splash crown: ring of tapered water spikes leaning out (refs: spiky splash)
mesh('water_crown', [{'id': 'outer', 'k': 'crown', 'n': 9, 'r': .45, 'h': [.5, 1.2], 'w': .2, 'tilt': 32, 'sides': 7, 'tip': 0, 'mid': .3, 'jit': .6, 'rings': 2, 'flat': False, 'seed': 3, 'sides': 10}],
     'น้ำ 3D: มงกุฎน้ำสาด แฉกน้ำแหลมเอียงออก 2 วง (รัศมี 0.45 สูง 0.5–1.2)')
mesh('water_blob', [{'id': 'b', 'k': 'sphere', 'r': .5, 'seg': 32, 'noise': .02, 'nfreq': 1.5, 'seed': 5}], 'น้ำ 3D: ก้อนน้ำกลมบิดเบี้ยวนิดๆ')
# stream: 3 water tubes spiralling round an axis (+z), tapering at both ends
ST = []
for j in range(3):
    ph = j * 2 * math.pi / 3
    path = [[round(.32 * math.cos(ph + i * .7), 3), round(.32 * math.sin(ph + i * .7), 3), round(i * .25, 3)] for i in range(14)]
    ST.append(tube(f's{j}', path, .11, .02, sides=14))
mesh('water_stream', ST, 'น้ำ 3D: สายน้ำ 3 สายพันเกลียวรอบแกน +z ยาว 3.25 ม.')

# ---------------- building blocks ----------------
def toon(id, at, life, shape, pos, scale, rot=None, dis=None, col=None, col2=None, rim=.55, op=1, model=None, extra=None):
    l = {'id': id, 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': shape, 'mat': 'toon', 'col': lift(col or C['light']), 'col2': lift(col2 or C['deep']), 'rim': rim,
         'pos': pos, 'scale': scale, 'op': op, 'fade': 0}
    l['zw'] = True   # solid volume: no back faces showing through as stripes
    if model: l['model'] = model
    if rot is not None: l['rot'] = rot
    if dis is not None: l['dis'] = dis   # (not used: noise dissolve cut the water into random lines — user round 4)
    if extra: l.update(extra)
    return l

def crown(L, pre, at, pos, s=1.0, life=.55, h=1.0):
    """3D splash crown: spikes shoot up from the base, then break apart (dissolve)"""
    L.append(toon(pre + 'crown', at, life, 'model', pos, {'0': [s * .7, .1, s * .7], '0.25': [s, h, s], '0.6': [s * 1.15, h * .8, s * 1.15], '1': [s * 1.3, .02, s * 1.3]}, model='water_crown',
                  rot=[0, rnd.uniform(0, 360), 0]))

def puddle(L, pre, at, pos, r=1.6, life=1.6):
    """water that stays: a puddle on the ground + rings rippling out of it"""
    L.append({'id': pre + 'puddle', 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'plane', 'mat': 'tex', 'tex': T('water_puddle'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0,
              'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': pos, 'rot': [90, rnd.uniform(0, 360), 0], 'spin': 8,
              'scale': {'0': r * .3, '0.12': r, '0.8': r * 1.05, '1': r * .9, 'ease': 'out'}, 'op': {'0': 1, '0.75': 1, '1': 0}, 'fade': 0})
    for k in range(2):   # ripples (flat — water lying on the ground)
        L.append({'id': f'{pre}rip{k}', 't': 'mesh', 'at': at + .1 + k * .35, 'life': .8, 'att': 'feet', 'shape': 'plane', 'mat': 'tex', 'tex': T('water_white_arcs'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0,
                  'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': [pos[0], pos[1] + .02, pos[2]], 'rot': [90, rnd.uniform(0, 360), 0], 'spin': 40, 'int': 1.2,
                  'scale': {'0': r * .5, '1': r * 2.2, 'ease': 'out'}, 'op': {'0': 1, '1': 0}, 'fade': 0})

def droplets(L, pre, at, pos, n=14, sp=(3, 7), up=(2, 5), r=.3, life=.04, rate=0):
    """3D water droplets that arc and fall to the ground"""
    L.append({'id': pre + 'drops', 't': 'emit', 'at': at, 'life': life, 'att': 'feet', 'pos': pos, 'burst': n if not rate else 0, 'rate': rate, 'from': 'sphere', 'fr': r, 'dir': 'out', 'up': list(up),
              'speed': list(sp), 'plife': [.5, .9], 'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.07, .17], 'col': C['light'], 'c2': C['deep'], 'mspin': 0, 'gravity': 12, 'drag': .4, 'bounce': .2})

def spray(L, pre, at, life, pos, rate=60, fr=.5, d='out', sp=(3, 6)):
    L.append({'id': pre + 'spray', 't': 'emit', 'at': at, 'life': life, 'att': 'feet', 'pos': pos, 'rate': rate, 'from': 'sphere', 'fr': fr, 'dir': d, 'speed': list(sp), 'plife': [.25, .45],
              'look': 'glow', 'size': [.6, 1.2], 'col': C['white'], 'c2': C['pale'], 'gravity': 6, 'drag': 1})

# ================= style study (3D) =================
L = []
Y = 1.4
L.append(toon('core', 0, 2.6, 'model', [0, Y, 0], {'0': .2, '0.1': 1.5, '0.9': 1.55, '1': .2}, model='water_blob', col=C['mid'], col2=C['deep'], extra={'spin': 40}))
for j in range(3):
    L.append(toon(f'stream{j}', 0, 2.6, 'model', [0, Y - .1, 0], {'0': .2, '0.12': [1.05 + j * .12, 1.05 + j * .12, .9], '0.9': [1.1 + j * .12, 1.1 + j * .12, .9], '1': .2},
                  model='water_slash', rot=[rnd.uniform(-35, 35), j * 120, rnd.uniform(-30, 30)], col=[C['light'], C['mid'], C['light']][j], extra={'spin': [260, -300, 340][j]}))
crown(L, 'c0_', .05, [0, 0, 0], s=1.4, h=1.1, life=.6)
crown(L, 'c1_', 1.2, [0, 0, 0], s=1.7, h=.9, life=.6)
puddle(L, 'p_', 0, [0, .03, 0], r=3.2, life=2.6)
droplets(L, 'd_', .05, [0, Y, 0], n=0, rate=18, r=1.1, life=2.4)
droplets(L, 'b_', .05, [0, .4, 0], n=20, r=.5)
spray(L, 's_', 0, 2.4, [0, Y, 0], rate=30, fr=1.2, d='tangent', sp=(3, 5))
save('style3d' + ('_' + VAR if VAR else ''), L, 'สไตล์น้ำ 3D (รอบ 2 ผู้ใช้): ก้อนน้ำ + เสี้ยวน้ำ 3 วงพันรอบ (แรเงาการ์ตูน ขอบขาว) • มงกุฎน้ำสาดแฉกแหลม • แอ่งน้ำค้างบนพื้น + วงกระเพื่อม • หยดน้ำ 3D ตกพื้น', ['style'])

# ================= BA (round 2, 3D): wand slash → thick water crescent → 3 water blobs fly off it =================
L = []
SW = .72
L.append(toon('slash', 0, SW, 'model', [0, 1.55, .8], {'0': [.45, .6, .45], '0.15': [1.5, 2.0, 1.5], '0.8': [1.55, 2.0, 1.55], '1': [1.65, .5, 1.65], 'ease': 'out'}, model='water_slash',
              rot={'0': [-20, 0, -75], '0.2': [-15, 0, -50], '1': [-12, 0, -38]}, col=C['light'], col2=C['deep']))
L.append(toon('slash2', .04, SW - .04, 'model', [0, 1.6, .7], {'0': [.4, .5, .4], '0.18': [1.2, 1.6, 1.2], '1': [1.3, .5, 1.3], 'ease': 'out'}, model='water_slash',
              rot={'0': [-25, 15, -95], '1': [-15, 15, -55]}, col=C['mid'], col2=C['navy']))
L.append(toon('wrap', 0, SW, 'model', [0, 1.5, -.2], {'0': .2, '0.2': [.9, .9, .35], '1': [1, 1, .3]}, model='water_stream', rot=[0, 90, 0],
              col=C['light'], col2=C['deep'], extra={'spin': 420}))
for i, t0 in enumerate([.25, .45, .65]):   # each bullet tears a little splash out of the crescent
    p = [[.8, 2.2, 1.6], [0, 1.7, 2.0], [-.8, 1.2, 1.6]][i]
    crown(L, f'b{i}_', t0, p, s=.45, h=.6, life=.35)
    droplets(L, f'b{i}_', t0, p, n=6, sp=(2, 4), up=(1, 3), r=.1)
puddle(L, 'p_', 0, [0, .03, .4], r=1.6, life=1.3)
droplets(L, 'drip_', .05, [0, 1.5, .6], n=0, rate=20, r=.6, life=.6, sp=(.5, 1.5), up=(0, 1))
save('ba3d_slash', L, 'BA สายน้ำ (3D รอบ 2): ตวัดไม้ = เสี้ยวน้ำ 3D หนา 2 ชั้น + สายน้ำพันเกลียว แรเงาการ์ตูนขอบขาว • ทุกนัดที่ยิงออกมีน้ำสาดแฉกเล็ก + หยดน้ำ • แอ่งน้ำค้างที่พื้น + หยดน้ำตก — ตามตัวผู้เล่น', ['ba', 'ingame'])
L = []
L.append(toon('blob', 0, 1, 'model', [0, 0, 0], [.32, .28, .42], model='water_blob', col=C['light'], col2=C['deep'], extra={'spin': 300}))
L.append(toon('tail', 0, 1, 'cone', [0, 0, -.35], [.22, .6, .22], rot=[-90, 0, 0], col=C['mid'], col2=C['navy'], rim=.6))
L.append({'id': 'drip', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, 0, -.2], 'rate': 40, 'from': 'sphere', 'fr': .12, 'dir': 'random', 'speed': [.5, 1.5], 'plife': [.3, .5],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.04, .09], 'col': C['light'], 'c2': C['deep'], 'mspin': 0, 'gravity': 9, 'drag': .5, 'bounce': .2})
spray(L, 'm_', 0, 1, [0, 0, -.1], rate=50, fr=.15, d='random', sp=(.5, 1.5))
save('ba3d_fly', L, 'BA สายน้ำ (3D): กระสุนก้อนน้ำ 3D หางน้ำรูปกรวย หยดน้ำ 3D ร่วงตามทาง — ตามกระสุน', ['ba', 'ingame'], loop=True, dur=1, att='point')
L = []
crown(L, 'h_', 0, [0, -.4, 0], s=.8, h=.8, life=.45)
droplets(L, 'h_', 0, [0, 0, 0], n=14, sp=(3, 6), up=(2, 4), r=.15)
spray(L, 'h_', 0, .08, [0, 0, 0], rate=300, fr=.2, sp=(3, 6))
save('ba3d_hit', L, 'BA สายน้ำ (3D): โดน = น้ำสาดแฉก 3D + หยดน้ำกระเด็น', ['ba', 'ingame'], att='point')
