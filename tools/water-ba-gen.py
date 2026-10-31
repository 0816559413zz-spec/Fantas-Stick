# Water BA (agreed with the user 2026-10-31, designs/water.md "VFX รอบใหม่"): one stream of controlled water drawn by the wand,
# hangs in the air, then squeezes into 3 drops that shoot off (drops stretch while flying). Clear water + white rim (fx mat 'water').
# Hit = drop bursts into droplets that fall and leave a faint wet mark on the ground.
# Run: python tools/water-ba-gen.py && node tools/fx-check.js   (-> water/ba_slash, ba_fly, ba_hit + models water_ba_stream0..2)
import json, math, random
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'assets/fx/water'; MESH = ROOT / 'assets/fx/mesh'
# palette from the user's ref (designs/water_ref/palette_teal_glow.png): glowing teal-cyan water, deep teal body, white foam
C = dict(tint='#5ef0ff', thick='#1fc3e6', pale='#d2fcff', glow='#18d8ff')   # no dark blue (user): bright cyan inside, lighter aqua-cyan edge   # round 4 (user ref crop): glowing cyan, deeper cyan-blue edge   # round 3: "more colorful" — bright cyan inside, deep blue-teal edge, pale wave bands   # round 2: "more colorful … too teal too realistic" → neon cyan glow, painted (mostly opaque)
T = lambda n: 'tex/' + n

def save(name, L, desc, dur=None, loop=False, att=None):
    for l in L:
        if loop: l['loop'] = True
        if att and not l.get('att0'): l['att'] = att
        l.pop('att0', None)
    d = dur or round(max(l.get('at', 0) + l.get('life', .4) for l in L) + .05, 2)
    (OUT / f'{name}.fx.json').write_text(json.dumps({'v': 1, 'desc': desc, 'tags': ['water', 'ba', 'ingame'], 'pal': 'ice', 'dur': d, 'seed': 31, 'layers': L}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('water/' + name, len(L), 'layers dur', d)

def water(id, at, life, shape, pos, scale, rot=None, model=None, rim=1, flow=1, op=1, extra=None, col=None, col2=None):
    l = {'id': id, 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': shape, 'mat': 'water', 'col': col or C['tint'], 'col2': col2 or C['thick'], 'rim': rim, 'scroll': flow, 'int': 1.25, 'disp': .6,
         'pos': pos, 'scale': scale, 'op': op, 'fade': 0}
    if model: l['model'] = model
    if rot is not None: l['rot'] = rot
    if extra: l.update(extra)
    return l

# ---- the wand's swing path (upper right behind the shoulder → lower left in front) ----
K = [[1.15, 2.5, -.05], [1.05, 2.3, .6], [.6, 1.95, 1.15], [0, 1.65, 1.4], [-.6, 1.4, 1.2], [-1.05, 1.15, .75], [-1.2, 1.0, .3]]   # round 5: longer sweep
def cat(p0, p1, p2, p3, t):
    return [0.5 * ((2 * p1[i]) + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t * t + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t ** 3) for i in range(3)]
PTS = []
for i in range(len(K) - 1):
    p0, p1, p2, p3 = K[max(0, i - 1)], K[i], K[i + 1], K[min(len(K) - 1, i + 2)]
    for k in range(6): PTS.append([round(v, 3) for v in cat(p0, p1, p2, p3, k / 6)])
PTS.append(K[-1])
PTS = [[p[0], round(p[1] + .04 * math.sin(i * .6), 3), p[2]] for i, p in enumerate(PTS)]   # gentle S-curve only (round 3: one continuous stream, the waves move inside it)
# three thirds of the stream (each pinches off into one drop); every third = short tube pieces so 'grow' draws it in order
n = len(PTS); cuts = [0, n // 3, 2 * n // 3, n - 1]
for j in range(3):
    seg = PTS[cuts[j]:cuts[j + 1] + 1]
    # one smooth tube per third (short 2-point pieces gave broken normals → invisible), round water caps at both ends
    # one continuous stream across the three thirds: same radius at the joins, tapered tips only at the two ends
    o = seg[0]; RR = [.12, .095, .065, .02]   # radius at the start of each third → thin tail (ref: fat head, thin tail)
    r0, r1 = RR[j], RR[j + 1]
    parts = ([{'id': 'head', 'k': 'sphere', 'r': .12, 'seg': 24, 'pos': o}] if j == 0 else []) + [{'id': 'body', 'k': 'tube', 'path': [[round(p[0] - o[0], 3), round(p[1] - o[1], 3), round(p[2] - o[2], 3)] for p in seg], 'r0': r0, 'r1': r1, 'curve': .5, 'sides': 20, 'seg': 64, 'pos': o}]
    (MESH / f'water_ba_stream{j}.mesh.json').write_text(json.dumps({'v': 1, 'desc': f'BA สายน้ำ ท่อนที่ {j + 1}/3 ตามแนวตวัดไม้ (ท่อสั้นต่อกัน ให้ grow วาดตามลำดับ)', 'mat': 'solid', 'pal': 'ice', 'tags': ['water', 'ba'], 'parts': parts}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('mesh water_ba_stream%d' % j, len(parts))

# =================== ba_slash ===================
L = []
DRAW = .2                       # stream drawn behind the wand in 0.2 s
FIRE = [.25, .45, .65]          # host fires the 3 drops at these times (js/09-water.js WT_BA)
for j in range(3):
    t0 = round(j * DRAW / 3, 3); tf = FIRE[j]; END = .92; life = round(END - t0, 3)
    k = lambda t: round((t - t0) / life, 3)
    # draw in (grow pieces in order) → hang and breathe → squeeze to the pinch point and vanish as the drop leaves
    L.append(water(f'stream{j}', t0, life, 'model', {'0': [0, 0, 0], str(k(END - .2)): [0, 0, 0], '1': [0, -1.3, 0]}, {'0': .3, str(k(t0 + DRAW / 3 + .03)): 1, str(k(END - .2)): 1, '1': [.9, .6, .9]}, model=f'water_ba_stream{j}',
                   flow=1.6))
    mid = PTS[(cuts[j] + cuts[j + 1]) // 2]
    L.append({'id': f'foam{j}', 't': 'emit', 'at': t0 + .03, 'life': END - t0 - .1, 'att': 'feet', 'pos': mid, 'rate': 8, 'from': 'sphere', 'fr': .25, 'dir': 'random', 'speed': [.1, .4], 'plife': [.25, .4],
              'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.03, .06], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 0, 'drag': 2, 'bounce': 0})
    # the pinch: a drop swells at the middle of this third just before it shoots
    L.append(water(f'pinch{j}', round(tf - .12, 3), .14, 'sphere', mid, {'0': .05, '0.75': .2, '1': .12}, rim=1, flow=2))
    L.append({'id': f'drip{j}', 't': 'emit', 'at': t0 + .05, 'life': tf - t0, 'att': 'feet', 'pos': mid, 'rate': 10, 'from': 'sphere', 'fr': .3, 'dir': 'down', 'speed': [.2, .6], 'plife': [.4, .6],
              'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.035, .07], 'col': C['tint'], 'c2': C['thick'], 'mspin': 0, 'gravity': 10, 'drag': .2, 'bounce': .25})
# light swish streaks behind the wand tip while drawing (white, thin, short)
L.append({'id': 'swish', 't': 'emit', 'at': 0, 'life': DRAW, 'att': 'wand', 'pos': [0, 0, 0], 'rate': 25, 'from': 'sphere', 'fr': .05, 'dir': 'random', 'speed': [.3, 1], 'plife': [.15, .25],
          'look': 'glow', 'size': [.8, 1.4], 'col': '#ffffff', 'c2': C['pale'], 'gravity': 0, 'drag': 2})
# the whole line drops to the ground together at the end → splash ring under it
L.append({'id': 'land', 't': 'emit', 'at': END - .05, 'life': .04, 'att': 'feet', 'pos': [0, .1, .8], 'burst': 22, 'rate': 0, 'from': 'disc', 'fr': 1.1, 'dir': 'up', 'spread': .6, 'up': [1, 2.5], 'speed': [1, 2.5], 'plife': [.3, .5],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.03, .07], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 10, 'drag': .3, 'bounce': .2})
save('ba_slash', L, 'BA สายน้ำ (ตกลงกับผู้ใช้): ไม้ลากสายน้ำใสเส้นเดียวตามแนวตวัด 0.2 วิ ค้างกลางอากาศ แล้วบีบเป็นหยด 3 หยด (0.25/0.45/0.65) ตามจังหวะกระสุน • น้ำใสขอบขาว ไฮไลต์ไหล หยดน้ำเล็กร่วง — ตามตัวผู้เล่น')

# =================== ba_fly: a stretched water drop ===================
L = []
L.append(water('drop', 0, 1, 'sphere', [0, 0, 0], [.15, .15, .34], flow=3))
L.append(water('core', 0, 1, 'sphere', [0, 0, .05], [.08, .08, .18], col=C['pale'], col2=C['tint'], rim=0, flow=3, op=.8))
L.append({'id': 'tail', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, 0, -.25], 'rate': 45, 'from': 'sphere', 'fr': .06, 'dir': 'random', 'speed': [.2, .8], 'plife': [.25, .45],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.025, .05], 'col': C['tint'], 'c2': C['thick'], 'mspin': 0, 'gravity': 8, 'drag': .5, 'bounce': .2})
L.append({'id': 'glint', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, 0, -.2], 'rate': 30, 'from': 'sphere', 'fr': .05, 'dir': 'aim', 'yaw': 180, 'spread': .15, 'speed': [1, 2], 'plife': [.08, .14],
          'look': 'streak', 'size': [1.4, 2.2], 'col': '#ffffff', 'c2': C['pale'], 'gravity': 0, 'drag': 2, 'curl': False})
save('ba_fly', L, 'BA สายน้ำ: หยดน้ำใสยืดตัวตอนพุ่ง (ขอบขาว ไฮไลต์ไหล แกนฟ้าอ่อน) หยดเล็กร่วงตามทาง — ตามกระสุน', loop=True, dur=1, att='point')

# =================== ba_hit: burst + wet ===================
L = []
L.append(water('burst', 0, .18, 'sphere', [0, 0, 0], {'0': [.2, .2, .2], '1': [.5, .35, .5]}, op={'0': 1, '1': 0}, flow=2))
L.append({'id': 'drops', 't': 'emit', 'at': 0, 'life': .04, 'att': 'feet', 'pos': [0, 0, 0], 'burst': 18, 'rate': 0, 'from': 'sphere', 'fr': .15, 'dir': 'out', 'up': [1, 3], 'speed': [2.5, 5.5],
          'plife': [.45, .8], 'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.04, .1], 'col': C['tint'], 'c2': C['thick'], 'mspin': 0, 'gravity': 11, 'drag': .3, 'bounce': .25})
L.append({'id': 'mist', 't': 'emit', 'at': 0, 'life': .04, 'att': 'feet', 'pos': [0, 0, 0], 'burst': 14, 'rate': 0, 'from': 'sphere', 'fr': .1, 'dir': 'out', 'speed': [1.5, 3], 'plife': [.15, .3],
          'look': 'glow', 'size': [2, 3.5], 'col': '#ffffff', 'c2': C['pale'], 'gravity': 2, 'drag': 3})
L.append({'id': 'wet', 'att0': 1, 't': 'mesh', 'at': .25, 'life': 1.4, 'att': 'ground', 'shape': 'plane', 'mat': 'tex', 'tex': T('water_puddle'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0,
          'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': [0, .03, 0], 'rot': [90, 37, 0], 'scale': {'0': .3, '0.15': 1.1, '1': 1.2, 'ease': 'out'}, 'op': {'0': 0, '0.1': .35, '0.6': .3, '1': 0}, 'fade': 0})
save('ba_hit', L, 'BA สายน้ำ: โดน = หยดน้ำแตกกระจาย หยดเล็กกระเด็นตกพื้น + รอยเปียกจางๆ บนพื้น 1.4 วิ', att='point')
