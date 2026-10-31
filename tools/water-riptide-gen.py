# Water Riptide VFX (agreed with the user 2026-11-01, ref designs/water_ref/riptide_ref.png — a wide glowing water slab
# racing forward, a flowing water carpet behind it, ornamental white lines down both sides; colours = the shield's blue).
# Host (js/09-water.js WT_RP): wave runs 400 (20 m) in 0.8 s, half-width 100 (10 m wide), ~4 m tall.
# Run: python tools/water-riptide-gen.py && node tools/fx-check.js   (-> water/riptide)
import json, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'assets/fx/water'
C = dict(tint='#5ef0ff', pale='#d2fcff', col='#55eeff', col2='#14a8f0')
RUN, LEN, W = .8, 20.0, 10.0

def tw(id, glb, at, life, pos, scale, op=1, spin=0, rim=1, **kw):   # toonwater Blender shape
    l = {'id': id, 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'glb', 'glb': glb, 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': rim, 'scroll': 1.6, 'dis': .6,
         'pos': pos, 'scale': scale, 'op': op, 'fade': 0}
    if spin: l['spin'] = spin
    l.update(kw); return l

def front(u):   # distance of the wave front at fraction u of the run (fast start, keeps going)
    return round(LEN * (1 - (1 - u) ** 1.6), 3)

KU = [0, .1, .25, .5, .75, 1]
L = []
# 1. start: a sheet of water bursts up in front of the wand + short splash
L.append({'id': 'burst', 't': 'emit', 'at': 0, 'life': .05, 'att': 'feet', 'pos': [0, .3, 1.5], 'burst': 30, 'rate': 0, 'from': 'box', 'fr': 2, 'dir': 'up', 'spread': .5, 'speed': [3, 6], 'plife': [.4, .6],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.07, .13], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 10, 'drag': 0, 'bounce': 0})   # (round 7: the crown arch at the start read as a hollow facing the caster → drops only)
# 2. the wave front: Blender curling wave (5 m wide, 1.55 m tall at scale 1) → 10 m wide, ~4 m tall, rises fast, runs 20 m
WS = {'0': [5, 0, 1.8], '0.12': [6, 5.5, 2.4], '0.85': [6.1, 5.5, 2.5], '1': [6.2, 4.6, 2.7]}   # bigger (user): 12 m wide, 5.5 m tall   # water_slab: ±1 wide, 1 tall, ~2.3 deep at scale 1 → 10 m wide, 4 m tall
# round 4 (user: slab 'really bad', ref riptide_ref2.png): one thin curling sheet, curls over forward, one end taller;
# soft painted skin (tex water_curl_sheet: teal base → pale crest, soft white fibres flowing up) instead of hard toon lines
CW = {'0': [5, 0, 1.2], '0.12': [6, 2.3, 1.6], '0.85': [6.1, 2.3, 1.7], '1': [6.2, 1.9, 1.8]}   # ~2.4 tall, ~2.6 deep at scale 1 → 12 m wide, ~5.5 m tall   # barrel profile ~1.9 tall, ~3.2 deep at scale 1 → ~5.5 m tall   # water_curl ±1 wide, ~1.3 tall → 12 m wide, ~5.5 m at the high end
CURLL = dict(t='mesh', att='feet', shape='glb', glb='mesh_water_curl', rot=[0, 180, 0],   # Blender +Y (the lip) exports backward → turn it so the lip throws FORWARD (user: 'the front of the wave is the curve side')
             mat='tex', tex='tex/water_curl_sheet', col='#ffffff', col2='#bff8ff', rim=.6, uvTile=[2, 1], fade=0)
L.append(dict(CURLL, id='wall', at=0, life=RUN, pos={str(u): [0, 0, front(u)] for u in KU}, scale=CW, uvScroll=[.15, -.6], op=1))
# (round 7: the smaller copy behind it showed its hollow to the caster → removed)
L.append({'id': 'body', 't': 'mesh', 'att': 'feet', 'shape': 'glb', 'glb': 'mesh_water_curl_body', 'mat': 'water', 'col': '#5fd6e6', 'col2': '#bff8ff', 'rim': .8, 'scroll': 1.5, 'int': 1.1, 'disp': 0, 'fade': 0,
          'at': 0, 'life': RUN, 'pos': {str(u): [0, 0, front(u)] for u in KU}, 'scale': CW, 'op': .8, 'rot': [0, 180, 0]})   # solid hump behind the lip (user: hollow must not face the caster)
# 3. tapering water tail behind the wave (user: flat carpet 'look bad' → 'หางน้ำเรียว'): Blender wake strip, narrow at the
# caster, full width at the wave; clear 'water' material, light lines flowing forward; fades after the wave passes
WK = {str(u): [W / 2 * 1.1, 1, max(.01, front(u) - 2.1)] for u in KU}   # starts 1.5 m ahead of the caster (not under them)
WAKE = dict(t='mesh', att='feet', shape='glb', glb='mesh_water_wake', rot=[0, 180, 0], mat='water', col='#9af8ff', col2='#0f8fe0', rim=1, scroll=3, int=1.4, disp=.8, fade=0)
L.append(dict(WAKE, id='wake', at=0, life=RUN, pos=[0, .04, 1.5], scale=WK, op={'0': .9, '0.8': .85, '1': .8}))
# second, brighter narrower layer on top, flowing faster → two-tone streaky tail (user ref: 'not just 1 color')
WK2 = {k: [v[0] * .55, 1.3, v[2]] for k, v in WK.items()}
L.append(dict(WAKE, id='wake2', at=0, life=RUN, pos=[0, .1, 1.5], scale=WK2, col='#7fe8ff', col2='#1a9ee8', scroll=4.5, op={'0': .5, '1': .45}))
# white flowing lines inside the tail (ref): trails riding behind the wave at a few offsets, wiggling
for j, ox in enumerate([-3.2, -1.6, 0, 1.6, 3.2]):
    P = {}
    for i in range(13):
        u = i / 12
        P[str(round(u, 3))] = [round(ox * (.4 + .6 * u) + .5 * math.sin(u * 11 + j * 1.7), 3), .3, round(max(1.8, front(u) - 1.5 - (j % 2) * .8), 3)]
    L.append({'id': f'flow{j}', 't': 'trail', 'at': .05, 'life': RUN - .05, 'att': 'feet', 'pos': P, 'col': '#ffffff', 'col2': '#5fd8ff', 'w': .09, 'tlife': .4, 'k': 1.2})
L.append(dict(WAKE, id='wake_end', at=RUN, life=.5, pos=[0, .04, 1.5], scale={'0': [W / 2 * 1.1, 1, LEN - 2.1], '1': [W / 2 * .6, 1, LEN - 2.1]}, op={'0': .8, '1': 0}))
# 4. ornamental white lines down both sides (ref): trails riding the wave's edges with a gentle swirl
for j, sx in enumerate([-1, 1]):
    for k in range(2):
        P = {}
        for i in range(13):
            u = i / 12; z = front(u) - .4 - k * .8
            P[str(round(u, 3))] = [round(sx * (W / 2 + .3 + k * .35 + .35 * math.sin(u * 9 + k * 2)), 3), round(.15 + k * .25 + .2 * math.sin(u * 7 + j), 3), round(max(0, z), 3)]
        L.append({'id': f'edge{j}{k}', 't': 'trail', 'at': 0, 'life': RUN, 'att': 'feet', 'pos': P, 'col': '#ffffff', 'col2': '#9ff6ff', 'w': .14 - k * .04, 'tlife': .55, 'k': 2})
# 5. spray off the crest + sparkles + mist riding with the wave
WP = {str(u): [0, 5, front(u) + .4] for u in KU}
L.append({'id': 'spray', 't': 'emit', 'at': .08, 'life': RUN - .08, 'att': 'feet', 'pos': WP, 'rate': 70, 'from': 'box', 'fr': W / 2, 'dir': 'up', 'spread': .6, 'speed': [2, 4], 'plife': [.4, .6],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.06, .13], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 9, 'drag': 0, 'bounce': 0})
L.append({'id': 'sparks', 't': 'emit', 'at': .05, 'life': RUN, 'att': 'feet', 'pos': {k: [0, 1.8, v[2] - 1.5] for k, v in WP.items()}, 'rate': 60, 'from': 'box', 'fr': W / 2, 'dir': 'up', 'speed': [.5, 1.5], 'plife': [.4, .7],
          'look': 'spark', 'size': [3, 6], 'col': '#ffffff', 'c2': '#bff4ff', 'gravity': -.3, 'drag': .5})
L.append({'id': 'mist', 't': 'emit', 'at': .15, 'life': RUN, 'att': 'feet', 'pos': {k: [0, .3, v[2] - .5] for k, v in WP.items()}, 'rate': 40, 'from': 'box', 'fr': W / 2, 'dir': 'up', 'speed': [.3, .8], 'plife': [.4, .6],
          'look': 'glow', 'size': [2, 3.5], 'col': '#d2fcff', 'c2': '#5ef0ff', 'gravity': 0, 'drag': .5})
# wave face life (user: 'ดูเป็นก้อนวุ้น'): white streaks racing up the face + a foamy crest along the top
L.append({'id': 'facelines', 't': 'emit', 'at': .06, 'life': RUN - .06, 'att': 'feet', 'pos': {k: [0, 1.2, v[2] + 1.6] for k, v in WP.items()}, 'rate': 90, 'from': 'box', 'fr': W / 2, 'dir': 'up', 'speed': [6, 10], 'plife': [.2, .35],
          'look': 'streak', 'size': [2, 3.5], 'col': '#ffffff', 'c2': '#bff4ff', 'gravity': 0, 'drag': 0, 'curl': False})
L.append({'id': 'crest', 't': 'emit', 'at': .08, 'life': RUN - .08, 'att': 'feet', 'pos': {k: [0, 5.3, v[2] + .6] for k, v in WP.items()}, 'rate': 220, 'from': 'box', 'fr': W / 2 + 1, 'dir': 'up', 'spread': .5, 'speed': [.5, 1.5], 'plife': [.25, .4],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.12, .22], 'col': '#ffffff', 'c2': C['pale'], 'mspin': 0, 'gravity': 3, 'drag': .5, 'bounce': 0})
# white foam streaming off the crest (reads as a breaking wave from behind): wide white trails riding the crest line
for j, xw in enumerate([-.7, -.35, 0, .35, .7]):
    end = max(0.0, 1 - abs(xw) ** 6) ** .5; hi = (1 - .3 * xw * xw)
    P = {str(u): [round(-xw * 6, 2), round(2.3 * 2.3 * hi * end - .2, 2), round(front(u) + (.25 + .12 * 2.3 * hi * end + .7 * xw * xw) * 1.6, 2)] for u in KU}
    L.append({'id': f'crestfoam{j}', 't': 'trail', 'at': .1, 'life': RUN - .1, 'att': 'feet', 'pos': P, 'col': '#ffffff', 'col2': '#d8fcff', 'w': .45, 'tlife': .3, 'k': 1.5})
# more round the wave (user 2026-11-01: 'make more effect around'): water wisps spinning at both wings, white swish lines over
# the back, foam churning along the foot, drops kicked out sideways at the ends, extra glints
for j, sx in enumerate([-1, 1]):
    for k in range(2):
        L.append(tw(f'wisp{j}{k}', 'mesh_water_crescent', .06 + k * .05, RUN - .06 - k * .05, {str(u): [sx * (6.2 - k * .8), 1.2 + k * 1.6, front(u) + .5] for u in KU}, 1.3 - k * .3,
                    spin=(420 - k * 120) * sx, op={'0': 0, '0.15': 1, '0.85': 1, '1': 0}, rot=[60 * sx, 0, 0]))
L.append({'id': 'backswish', 't': 'emit', 'at': .08, 'life': RUN - .08, 'att': 'feet', 'pos': {k: [0, 3, v[2] - 3] for k, v in WP.items()}, 'rate': 70, 'from': 'box', 'fr': W / 2, 'dir': 'up', 'speed': [5, 8], 'plife': [.2, .35],
          'look': 'streak', 'size': [2, 3.5], 'col': '#ffffff', 'c2': '#bff4ff', 'gravity': 0, 'drag': 0, 'curl': False})
L.append({'id': 'footfoam', 't': 'emit', 'at': .06, 'life': RUN - .06, 'att': 'feet', 'pos': {k: [0, .2, v[2] - 2] for k, v in WP.items()}, 'rate': 160, 'from': 'box', 'fr': W / 2 + .5, 'dir': 'up', 'spread': .6, 'speed': [.5, 1.6], 'plife': [.3, .5],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.1, .2], 'col': '#ffffff', 'c2': C['pale'], 'mspin': 0, 'gravity': 4, 'drag': .4, 'bounce': 0})
for j, sx in enumerate([-1, 1]):
    L.append({'id': f'kick{j}', 't': 'emit', 'at': .06, 'life': RUN - .06, 'att': 'feet', 'pos': {k: [sx * 6.3, .6, v[2] - .5] for k, v in WP.items()}, 'rate': 40, 'from': 'sphere', 'fr': .6, 'dir': 'out', 'spread': .5, 'speed': [3, 6], 'plife': [.35, .55],
              'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.07, .14], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 10, 'drag': 0, 'bounce': 0})
L.append({'id': 'glints', 't': 'emit', 'at': .05, 'life': RUN, 'att': 'feet', 'pos': {k: [0, 3, v[2] - 1] for k, v in WP.items()}, 'rate': 50, 'from': 'box', 'fr': W / 2 + 1, 'dir': 'up', 'speed': [.3, 1], 'plife': [.4, .7],
          'look': 'spark', 'size': [4, 7], 'col': '#ffffff', 'c2': '#c8fbff', 'gravity': -.2, 'drag': .5})
# 6. end: the wall crashes forward into a spiky splash + a low wave spreading, then fades
L.append(tw('crash', 'mesh_water_crown', RUN - .05, .5, [0, -.05, LEN + .5], {'0': [3.5, 1.6, 1.4], '0.35': [4.5, 1.9, 1.9], '1': [5.2, .4, 2.3], 'ease': 'out'}, op={'0': 1, '0.6': 1, '1': 0}))
L.append(tw('spread', 'mesh_water_ringwave_low', RUN - .02, .5, [0, -.03, LEN + .5], {'0': [3, 1.6, 1.2], '1': [6.5, 2, 3], 'ease': 'out'}, op={'0': 1, '0.6': .8, '1': 0}, spin=60))
L.append({'id': 'crashdrops', 't': 'emit', 'at': RUN - .02, 'life': .05, 'att': 'feet', 'pos': [0, 1.5, LEN + .5], 'burst': 50, 'rate': 0, 'from': 'box', 'fr': W / 2, 'dir': 'up', 'spread': .7, 'speed': [3, 6], 'plife': [.4, .7],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.07, .14], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 10, 'drag': 0, 'bounce': 0})
(OUT / 'riptide.fx.json').write_text(json.dumps({'v': 1, 'desc': 'Riptide (ตกลงกับผู้ใช้ 2026-11-01, รูป riptide_ref.png): กำแพงคลื่นน้ำกว้าง 10 ม. สูง ~4 ม. วิ่งไป 20 ม. ใน 0.8 วิ + พรมน้ำไหลตามหลัง + ลายเส้นขาวสองข้าง + ละอองยอดคลื่น ประกาย • สุดทาง: คลื่นพังเป็นแฉกสาด + คลื่นเตี้ยแผ่ • สีฟ้าแบบโล่',
    'tags': ['water', 'riptide', 'ingame'], 'pal': 'ice', 'dur': 1.4, 'seed': 44, 'layers': L}, ensure_ascii=False, indent=1), encoding='utf-8')
print('water/riptide', len(L), 'layers')
