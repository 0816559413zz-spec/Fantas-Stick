# Water Dash VFX (agreed with the user 2026-11-01, designs/water.md): sink into a round puddle (ripples, water swirling round
# the legs, one drop hops up at the end) → a water copy of the character stays behind (js/68 bakes the pose; this fx = the
# puddle, ripples and drips under it) → pop out of a water column with a spiky splash at its foot and a low wave that
# spreads to the knockback radius (6 m). Refs: designs/water_ref/painted_water_sheet.webp (puddle + drop, dripping orb,
# column), ref3d_splash_sheet.png (spiky splash). toonwater shading + Blender shapes (assets/src/water_meshes_build.py).
# Run: python tools/water-dash-gen.py && node tools/fx-check.js   (-> water/dash_sink, water/clone, water/dash_pop)
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'assets/fx/water'
C = dict(tint='#5ff0dc', pale='#d4fff6', col='#6cf2e0', col2='#14a89a')   # teal, softer than the other skills (user 2026-11-01: 'less colorful … maybe teal')

def save(name, L, desc, dur):
    (OUT / f'{name}.fx.json').write_text(json.dumps({'v': 1, 'desc': desc, 'tags': ['water', 'dash', 'ingame'], 'pal': 'ice', 'dur': dur, 'seed': 43, 'layers': L}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('water/' + name, len(L), 'layers')

def tw(id, glb, at, life, pos, scale, op=1, spin=0, rim=1, **kw):   # toonwater Blender shape
    l = {'id': id, 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'glb', 'glb': glb, 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': rim, 'scroll': 1.4, 'dis': .6,
         'pos': pos, 'scale': scale, 'op': op, 'fade': 0}
    if spin: l['spin'] = spin
    l.update(kw); return l

def puddle(id, at, life, scale, op):   # clear flat water disc (mat 'water': light flowing lines)
    return {'id': id, 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'disc', 'mat': 'water', 'col': '#7ff5e4', 'col2': '#1cb0a0', 'rim': 1, 'scroll': 1.2, 'int': 1.15, 'disp': 0,
            'pos': [0, .03, 0], 'scale': scale, 'op': op, 'fade': 0}

def streaks(id, at, life, y, fr, rate, speed=(6, 9), dirn='tangent', burst=0, **kw):   # thin white swish lines round the effect
    l = {'id': id, 't': 'emit', 'at': at, 'life': life, 'att': 'feet', 'pos': [0, y, 0], 'rate': rate, 'from': 'ring', 'fr': fr, 'dir': dirn, 'speed': list(speed), 'plife': [.18, .3],
         'look': 'streak', 'size': [1.6, 2.8], 'col': '#ffffff', 'c2': '#c8fff4', 'gravity': 0, 'drag': 0, 'curl': False}
    if burst: l['burst'] = burst
    l.update(kw); return l

def sparks(id, at, life, y, fr, rate, **kw):
    l = {'id': id, 't': 'emit', 'at': at, 'life': life, 'att': 'feet', 'pos': [0, y, 0], 'rate': rate, 'from': 'sphere', 'fr': fr, 'dir': 'up', 'speed': [.4, 1.2], 'plife': [.35, .6],
         'look': 'spark', 'size': [3, 6], 'col': '#ffffff', 'c2': '#c8fff4', 'gravity': -.2, 'drag': .5}
    l.update(kw); return l

def foam(id, at, life, scale, op, spin=60, **kw):   # ring of white foam blobs (shield foam model, ring r 2.1 at scale 1)
    l = {'id': id, 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'model', 'model': 'water_dome_foam', 'mat': 'toon', 'zw': True, 'col': '#ffffff', 'col2': '#c8fff4', 'rim': 1,
         'pos': [0, 0, 0], 'scale': scale, 'spin': spin, 'op': op, 'fade': 0}
    l.update(kw); return l

def drops(id, at, n, pos, fr, speed, size=(.05, .1), frm='ring', dirn='up', spread=.4, **kw):
    l = {'id': id, 't': 'emit', 'at': at, 'life': .04, 'att': 'feet', 'pos': pos, 'burst': n, 'rate': 0, 'from': frm, 'fr': fr, 'dir': dirn, 'spread': spread, 'speed': list(speed), 'plife': [.35, .55],
         'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': list(size), 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 10, 'drag': 0, 'bounce': 0}
    l.update(kw); return l

# =================== dash_sink — 0.35 s into the ground (js/68 lowers the body 2.4 m meanwhile) ===================
L = []
L.append(puddle('puddle', 0, .75, {'0': .2, '0.2': 1.3, '1': 1.45, 'ease': 'out'}, {'0': .85, '0.6': .8, '1': 0}))
for j, at in enumerate([0, .14]):   # ripples: low ring waves spreading out of the puddle
    L.append(tw(f'ripple{j}', 'mesh_water_ringwave_low', at, .5, [0, -.02, 0], {'0': [.35, .6, .35], '1': [1.7, .25, 1.7], 'ease': 'out'}, op={'0': 1, '0.6': .8, '1': 0}, spin=120 - j * 240))
for j in range(2):                  # water swirling round the legs and pulling down
    L.append(tw(f'swirl{j}', 'mesh_water_crescent', 0, .38, {'0': [0, .9 - j * .3, 0], '1': [0, 0, 0], 'ease': 'in'}, {'0': .75 - j * .15, '1': .35, 'ease': 'in'}, rot=[0, j * 180, 0], spin=720, op={'0': 1, '0.8': 1, '1': 0}))
L.append(drops('splash', 0, 12, [0, .1, 0], .5, (1.5, 3)))
# more round it (user): 3 streams spiralling DOWN into the puddle, white swish lines circling, foam ring closing in, sparkles
L.append(tw('suck', None, 0, .38, [0, 0, 0], {'0': .62, '1': .25, 'ease': 'in'}, spin=-540, op={'0': 1, '0.75': 1, '1': 0}, shape='model', model='water_shield_rise'))
L[-1].pop('glb')
L.append(streaks('swish', 0, .35, .5, 1.3, 70))
L.append(foam('foam', 0, .5, {'0': .62, '0.7': .4, '1': .3}, {'0': 1, '0.7': 1, '1': 0}, spin=-200))
L.append(sparks('sparks', 0, .35, .8, .9, 20))
# the drop that hops up in the middle once the body is under (ref: puddle + drop)
L.append(tw('hop', 'mesh_water_jet', .33, .4, [0, -.05, 0], {'0': [.12, 0, .12], '0.35': [.14, .45, .14], '1': [.1, 0, .1], 'ease': 'out'}, rim=1))
L.append(drops('hopdrop', .45, 1, [0, 1.0, 0], .01, (1, 1.2), size=(.11, .11), frm='sphere', spread=0))
save('dash_sink', L, 'Dash จมลงพื้น (ตกลงกับผู้ใช้ 2026-11-01): แอ่งน้ำวงกลมแผ่ออก + คลื่นระลอกเตี้ย 2 วง + น้ำวนรอบขาดูดลง + หยดน้ำสาดเล็กๆ • จมหมด (0.35 วิ) มีหยดน้ำเด้งขึ้นกลางวง', .9)

# =================== clone — loop under the water copy of the character (6 s) ===================
L = []
L.append(dict(puddle('puddle', 0, 1, .75, .75), loop=True))
L.append(tw('ripple', 'mesh_water_ringwave_low', 0, 1.2, [0, -.02, 0], {'0': [.3, .4, .3], '1': [1.0, .2, 1.0], 'ease': 'out'}, op={'0': 0, '0.15': 1, '1': 0}, spin=90, loop=True))
L.append({'id': 'drips', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, 1.1, 0], 'rate': 7, 'from': 'ring', 'fr': .32, 'dir': 'down', 'spread': .1, 'speed': [.1, .3], 'plife': [.45, .6], 'loop': True,
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.04, .07], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 9, 'drag': 0, 'bounce': 0})
for j, (y, sc, sp) in enumerate([(.25, .85, 130), (1.15, .6, -170)]):   # water wisps orbiting the clone (user: more round it)
    L.append(tw(f'wisp{j}', 'mesh_water_crescent', 0, 1, [0, y, 0], sc, spin=sp, op=.85, rot=[0, j * 90, 0], loop=True))
L.append(foam('foam', 0, 1, .4, 1, spin=40, loop=True))
L.append(streaks('swish', 0, 1, .9, .8, 10, speed=(3, 5), loop=True))
L.append({'id': 'motes', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, 1, 0], 'rate': 4, 'from': 'sphere', 'fr': .6, 'dir': 'up', 'speed': [.2, .5], 'plife': [.5, .8], 'loop': True,
          'look': 'spark', 'size': [3, 5], 'col': '#ffffff', 'c2': '#d6f6ff', 'gravity': 0, 'drag': .5})
# clone gone (time up / recalled): the body melts (js/68) into a puddle that spreads and fades
L.append(dict(puddle('melt', 0, .6, {'0': .75, '1': 1.3, 'ease': 'out'}, {'0': .8, '1': 0}), end=True))
L.append(dict(drops('meltdrop', .05, 8, [0, .1, 0], .4, (1, 2)), end=True))
save('clone', L, 'Dash ร่างโคลน (ตกลงกับผู้ใช้ 2026-11-01): ใต้ร่างน้ำของตัวละคร (js/68 อบท่าตัวละครเป็นน้ำการ์ตูน) — แอ่งน้ำที่เท้า + ระลอกเบาๆ + น้ำหยดย้อยจากตัว + ประกาย • ตอนหาย: แอ่งแผ่ออกแล้วจาง', 1)

# =================== dash_pop — burst out of a water column (js/68 raises the body 0.25 s) ===================
L = []
L.append(tw('column', 'mesh_water_jet', 0, .6, [0, -.05, 0], {'0': [.55, 0, .55], '0.25': [.85, 1.35, .85], '0.6': [.75, 1.15, .75], '1': [.45, 0, .45], 'ease': 'out'}, spin=240, op={'0': 1, '0.8': 1, '1': 0}))
L.append(tw('spikes', 'mesh_water_crown', 0, .5, [0, -.05, 0], {'0': [.4, .3, .4], '0.3': [1.05, 1.15, 1.05], '1': [1.4, .5, 1.4], 'ease': 'out'}, spin=-120, op={'0': 1, '0.6': 1, '1': 0}))
# knockback: low wave spreading to the push radius (WT_DS.r 120 ≈ 6 m)
L.append(tw('shove', 'mesh_water_ringwave_low', .02, .5, [0, -.03, 0], {'0': [.6, 1.4, .6], '1': [6.0, 2.2, 6.0], 'ease': 'out'}, op={'0': 1, '0.65': .85, '1': 0}, spin=160))   # flat-ish: wide but only ~0.5 m tall
L.append(puddle('puddle', 0, .8, {'0': .4, '0.25': 1.6, '1': 2.0, 'ease': 'out'}, {'0': .8, '0.6': .7, '1': 0}))
L.append(drops('burst', .08, 30, [0, 2.2, 0], .5, (3, 6), size=(.06, .13), frm='sphere', dirn='out', spread=.6))
L.append(drops('rim', .02, 16, [0, .1, 0], 1.0, (2, 3.5)))
# more round it (user): streams spiralling up the column, white swish lines flung out, foam ring riding the wave, sparkles
L.append(tw('spiral', None, 0, .5, [0, 0, 0], .6, spin=480, op={'0': 1, '0.7': 1, '1': 0}, shape='model', model='water_shield_rise', grow={'0': 0, '0.5': 1}, stagger=.8, growBy='height'))
L[-1].pop('glb')
L.append(streaks('fling', .03, .05, .6, .8, 0, speed=(9, 14), dirn='out', burst=36))
L.append(foam('foam', .02, .4, {'0': .3, '1': 1.1, 'ease': 'out'}, {'0': 1, '0.6': 1, '1': 0}, spin=90))   # small: the blobs grow with the scale
L.append(sparks('sparks', .05, .3, 1.5, 1.2, 40))
save('dash_pop', L, 'Dash โผล่ (ตกลงกับผู้ใช้ 2026-11-01): เสาน้ำพุ่งขึ้น ตัวละครโผล่จากในเสา + แฉกน้ำสาดที่ฐาน + คลื่นเตี้ยแผ่ถึงระยะผลัก 6 ม. + แอ่งน้ำ + หยดน้ำกระเด็น — ใช้ทั้งโผล่ใหม่และกลับไปที่โคลน', 1)
