# Water Tidecaller VFX (agreed with the user 2026-11-01, ref designs/water_ref/tidecaller_serpent_ref.png): a small, long water
# serpent wrapped once round the caster from the hip to the right shoulder, dragon-like head with a swept-back water mane,
# glowing pale eye; all water, aqua-teal like the ref. Follows the caster and turns with them (js/68 plays it with follow).
# Model: assets/src/water_meshes_build.py §10 (head points forward, no rot). Run: python tools/water-serpent-gen.py && node tools/fx-check.js
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'assets/fx/water'
C = dict(col='#9ff4ff', col2='#36b8f5', pale='#e6ffff', tint='#7fe8ff')   # round 2 (user: not see-through, bright blue with white)
HEAD = [.45, 2.0, .55]         # Blender head (~.52, -.42, 1.85) → fx (x, z, -y)

def save(name, L, desc, dur=1):
    (OUT / f'{name}.fx.json').write_text(json.dumps({'v': 1, 'desc': desc, 'tags': ['water', 'tidecaller', 'ingame'], 'pal': 'ice', 'dur': dur, 'seed': 45, 'layers': L}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('water/' + name, len(L), 'layers')

INTRO = 1.3   # summon (round 3, user: 'a lot more slow … see it coming up, head slithering up to the shoulder'): water bursts at the feet and the serpent rises out of it from the ground up; held layers start after
L = []
SB = dict(t='mesh', att='feet', shape='glb', glb='mesh_water_serpent', mat='toonwater', col=C['col'], col2=C['col2'], rim=.8, scroll=2.4, heat=.6, zw=True, pos=[0, 0, 0], fade=0)
# round 2 (user: 'อยากให้งูพันเกลียวขึ้นมา'): a water stream with a glowing head spirals up the serpent's own path from the ground
# to the shoulder, then the serpent shows (fades in as the stream arrives)
PATH = [[.35, -.1, .2], [.4, .2, 0], [.52, .62, -.3], [.3, 1.0, -.55], [-.12, 1.3, -.55], [-.45, 1.62, -.35], [-.55, 1.9, -.02], [-.5, 1.98, .3], [-.45, 1.9, .55]]   # Blender CP (x, y, z) → fx (-x, z, -y)
def pcurve(P, ease=None):
    d = {str(round(k / (len(P) - 1), 3)): p for k, p in enumerate(P)}
    if ease: d['ease'] = ease
    return d
# the body growing up the path piece by piece (fx mesh tubes so 'grow' can draw them in order, tail → head)
import math
def cat(p0, p1, p2, p3, t):
    return [.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t ** 3) for k in range(3)]
DP = []
for i_ in range(len(PATH) - 1):
    p0, p1, p2, p3 = PATH[max(0, i_ - 1)], PATH[i_], PATH[i_ + 1], PATH[min(len(PATH) - 1, i_ + 2)]
    for k in range(6): DP.append([round(v, 3) for v in cat(p0, p1, p2, p3, k / 6)])
DP.append(PATH[-1])
parts = []; NPc = 8; per = (len(DP) - 1) // NPc
for q in range(NPc):
    seg = DP[q * per:(q + 1) * per + 1] if q < NPc - 1 else DP[q * per:]
    o = seg[0]; r0 = .03 + .1 * min(1, q / NPc * 2.2); r1 = .03 + .1 * min(1, (q + 1) / NPc * 2.2)
    parts.append({'id': f'b{q}', 'k': 'tube', 'path': [[round(p[0] - o[0], 3), round(p[1] - o[1], 3), round(p[2] - o[2], 3)] for p in seg], 'r0': r0, 'r1': r1, 'curve': .5, 'sides': 14, 'seg': 40, 'pos': o})
(ROOT / 'assets/fx/mesh/water_serpent_rise.mesh.json').write_text(json.dumps({'v': 1, 'desc': 'Tidecaller ตอนเรียก: ตัวงูเป็นท่อน 8 ท่อนตามทางจากพื้นอ้อมหลังขึ้นไหล่ (ให้ grow วาดจากหางไปหัว)', 'mat': 'solid', 'pal': 'ice', 'tags': ['water'], 'parts': parts}, ensure_ascii=False, indent=1), encoding='utf-8')
L.append({'id': 'rise_body', 't': 'mesh', 'at': 0, 'life': INTRO, 'att': 'feet', 'shape': 'model', 'model': 'water_serpent_rise', 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': .8, 'scroll': 2.4, 'zw': True,
          'pos': [0, 0, 0], 'scale': 1, 'grow': {'0': 0, '1': 1}, 'stagger': .9, 'growBy': 'order', 'op': {'0': 1, '0.9': 1, '1': 0}, 'fade': 0, 'loop': False})
L.append({'id': 'rise_head', 't': 'mesh', 'at': 0, 'life': INTRO, 'att': 'feet', 'shape': 'sphere', 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': .8, 'scroll': 2.4, 'zw': True,
          'pos': pcurve(PATH), 'scale': {'0': .08, '0.15': .14, '1': .15}, 'op': {'0': 1, '0.9': 1, '1': 0}, 'fade': 0, 'loop': False})
for j, sx in enumerate([-1, 1]):   # eyes on the climbing head
    L.append({'id': f'rise_eye{j}', 't': 'mesh', 'at': 0, 'life': INTRO, 'att': 'feet', 'shape': 'sphere', 'mat': 'glow', 'col': '#ffffff', 'pos': {k: [v[0] + sx * .1, v[1] + .1, v[2]] for k, v in pcurve(PATH).items()}, 'scale': .03, 'op': {'0': 1, '0.9': 1, '1': 0}, 'fade': 0, 'loop': False})
L.append({'id': 'rise_drops', 't': 'emit', 'at': 0, 'life': INTRO, 'att': 'feet', 'pos': pcurve(PATH), 'rate': 30, 'from': 'sphere', 'fr': .12, 'dir': 'down', 'speed': [.2, .6], 'plife': [.3, .5], 'loop': False,
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.03, .06], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 9, 'drag': 0, 'bounce': 0})
L.append(dict(SB, id='rise', at=INTRO * .82, life=INTRO * .18 + .02, loop=False, scale=1, op={'0': 0, '1': 1}))
L.append({'id': 'rise_splash', 't': 'emit', 'at': 0, 'life': .05, 'att': 'feet', 'pos': [0, .1, 0], 'burst': 24, 'rate': 0, 'from': 'ring', 'fr': .6, 'dir': 'up', 'spread': .5, 'speed': [2.5, 4.5], 'plife': [.4, .6], 'loop': False,
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.05, .1], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 9, 'drag': 0, 'bounce': 0})
L.append({'id': 'rise_wave', 't': 'mesh', 'at': 0, 'life': .45, 'att': 'feet', 'shape': 'glb', 'glb': 'mesh_water_ringwave_low', 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': .5, 'scroll': 1.6,
          'pos': [0, -.02, 0], 'scale': {'0': .3, '1': 1.4, 'ease': 'out'}, 'op': {'0': 1, '0.7': 1, '1': 0}, 'spin': 300, 'fade': 0, 'loop': False})
# time up: the serpent sinks back into the ground and splashes, the puddle spreads and fades (end layers play after fxStop)
L.append(dict(SB, id='sink', at=0, life=.15, end=True, scale=1, op={'0': 1, '1': 0}))   # round 2: fades as the stream runs back down
for k, (w, c1, c2, kk) in enumerate([(.32, '#9ff4ff', '#36b8f5', 1.3), (.12, '#ffffff', '#c8fbff', 1.6)]):
    L.append({'id': f'sink_stream{k}', 't': 'trail', 'at': 0, 'life': .32, 'att': 'feet', 'pos': pcurve(PATH[::-1], 'in'), 'col': c1, 'col2': c2, 'w': w, 'tlife': .25, 'k': kk, 'end': True})
L.append({'id': 'sink_splash', 't': 'emit', 'at': .2, 'life': .05, 'att': 'feet', 'pos': [0, .1, 0], 'burst': 20, 'rate': 0, 'from': 'ring', 'fr': .7, 'dir': 'up', 'spread': .5, 'speed': [1.5, 3], 'plife': [.35, .5], 'end': True,
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.05, .09], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 9, 'drag': 0, 'bounce': 0})
L.append({'id': 'sink_puddle', 't': 'mesh', 'at': .15, 'life': .5, 'att': 'feet', 'shape': 'disc', 'mat': 'water', 'col': '#9ff4ff', 'col2': '#36b8f5', 'rim': 1, 'scroll': 1.4, 'int': 1.15, 'disp': 0, 'end': True,
          'pos': [0, .03, 0], 'scale': {'0': 1.1, '1': 1.6, 'ease': 'out'}, 'op': {'0': .8, '1': 0}, 'fade': 0})
L.append({'id': 'body', 't': 'mesh', 'at': INTRO, 'life': 2.4, 'att': 'feet', 'shape': 'glb', 'glb': 'mesh_water_serpent', 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': .8, 'scroll': 2.4, 'heat': .6, 'zw': True,
          'disp': .9,   # keeps moving (user 2026-11-01): a wave runs along the body (toonwater disp) + the whole serpent sways and bobs
          'pos': {'0': [0, 0, 0], '0.25': [0, .02, 0], '0.5': [0, 0, 0], '0.75': [0, -.02, 0], '1': [0, 0, 0]},
          'scale': 1, 'op': 1, 'fade': 0, 'loop': True})
for j, e in enumerate([[-.564, 1.941, .66], [-.324, 1.941, .646]]):   # glowing eyes: Blender print 'eyes' (x, y, z) → fx (-x, z, -y) (model +X shows on fx -x — measured)
    L.append({'id': f'eye{j}', 't': 'mesh', 'at': INTRO, 'life': 1, 'att': 'feet', 'shape': 'sphere', 'mat': 'glow', 'col': '#ffffff', 'pos': e, 'scale': .03, 'op': .9, 'fade': 0, 'loop': True})
L.append({'id': 'spray', 't': 'emit', 'at': INTRO, 'life': 1, 'att': 'feet', 'pos': [HEAD[0], HEAD[1] + .12, HEAD[2] - .2], 'rate': 14, 'from': 'sphere', 'fr': .12, 'dir': 'up', 'spread': .5, 'speed': [.3, .8], 'plife': [.25, .4], 'loop': True,
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.02, .04], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 4, 'drag': .3, 'bounce': 0})
L.append({'id': 'drips', 't': 'emit', 'at': INTRO, 'life': 1, 'att': 'feet', 'pos': [0, 1.1, 0], 'rate': 6, 'from': 'ring', 'fr': .6, 'dir': 'down', 'spread': .1, 'speed': [.1, .3], 'plife': [.4, .6], 'loop': True,
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.025, .045], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 9, 'drag': 0, 'bounce': 0})
L.append({'id': 'glints', 't': 'emit', 'at': INTRO, 'life': 1, 'att': 'feet', 'pos': [0, 1.2, 0], 'rate': 5, 'from': 'ring', 'fr': .5, 'dir': 'up', 'speed': [.2, .5], 'plife': [.4, .6], 'loop': True,
          'look': 'spark', 'size': [2.5, 4], 'col': '#ffffff', 'c2': '#c8fbff', 'gravity': 0, 'drag': .5})
# feet (user 2026-11-01: 'more effect at feet'): water pooling under the caster where the tail rises — puddle, two low ring
# waves spinning opposite ways, a foam ring, white swish lines circling, splashes hopping up round the tail
L.append({'id': 'puddle', 't': 'mesh', 'at': INTRO, 'life': 1, 'att': 'feet', 'shape': 'disc', 'mat': 'water', 'col': '#9ff4ff', 'col2': '#36b8f5', 'rim': 1, 'scroll': 1.4, 'int': 1.15, 'disp': 0,
          'pos': [0, .03, 0], 'scale': 1.1, 'op': .8, 'fade': 0, 'loop': True})
for j, (sc, sp) in enumerate([(.75, 200), (.95, -150)]):
    L.append({'id': f'footwave{j}', 't': 'mesh', 'at': INTRO, 'life': 1, 'att': 'feet', 'shape': 'glb', 'glb': 'mesh_water_ringwave_low', 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': .5, 'scroll': 1.6,
              'pos': [0, -.02, 0], 'scale': sc, 'rot': [0, j * 60, 0], 'spin': sp, 'op': 1, 'fade': 0, 'loop': True})
L.append({'id': 'footfoam', 't': 'mesh', 'at': INTRO, 'life': 1, 'att': 'feet', 'shape': 'model', 'model': 'water_dome_foam', 'mat': 'toon', 'zw': True, 'col': '#ffffff', 'col2': '#d8fbff', 'rim': 1,
          'pos': [0, 0, 0], 'scale': .45, 'spin': 70, 'op': 1, 'fade': 0, 'loop': True})
L.append({'id': 'footswish', 't': 'emit', 'at': INTRO, 'life': 1, 'att': 'feet', 'pos': [0, .25, 0], 'rate': 18, 'from': 'ring', 'fr': .9, 'dir': 'tangent', 'speed': [4, 6], 'plife': [.2, .3], 'loop': True,
          'look': 'streak', 'size': [1.5, 2.5], 'col': '#ffffff', 'c2': '#c8fbff', 'gravity': 0, 'drag': 0, 'curl': False})
L.append({'id': 'footsplash', 't': 'emit', 'at': INTRO, 'life': 1, 'att': 'feet', 'pos': [0, .08, 0], 'rate': 14, 'from': 'ring', 'fr': .7, 'dir': 'up', 'spread': .4, 'speed': [1.2, 2.4], 'plife': [.35, .5], 'loop': True,
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.04, .08], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 9, 'drag': 0, 'bounce': 0})
save('fam_serpent', L, 'Tidecaller งูทะเลน้ำ (ตกลงกับผู้ใช้ 2026-11-01, รูป tidecaller_serpent_ref.png): ตัวยาวบาง พันตัวเรา 1 รอบจากสะโพกถึงไหล่ขวา หัวมังกรครีบน้ำปัดหลัง ตาเรืองฟ้าอ่อน น้ำทั้งตัว สีฟ้าอมเขียว + ละอองที่ครีบ หยดน้ำ ประกาย — ตามตัว หันตามตัว วนตลอด 10 วิ')

# =================== shot round 3 (user ref designs/water_ref/serpent_beam_ref.png: tiny, bright, pew and gone, no frayed end) ===================
# js/68 draws the beam (white additive core) mouth → shot head; host shot is near-instant (WT_FM.spd 4000)
L = [{'id': 'head', 't': 'mesh', 'at': 0, 'life': 1, 'att': 'point', 'shape': 'sphere', 'mat': 'glow', 'col': '#e6ffff', 'pos': [0, 0, 0], 'scale': .07, 'op': 1, 'fade': 0, 'loop': True}]
save('fam_shot', L, 'Tidecaller ลำน้ำ รอบ 3: หัวลำน้ำจุดขาวเล็กสว่าง — js/68 วาดเส้นขาวเรืองจากปากงูถึงจุดนี้', 1)
# muzzle (faces the beam: a = shot direction): small spiky water ring round the mouth like the ref + a few bubbles + flash
L = [{'id': 'ring', 't': 'mesh', 'at': 0, 'life': .22, 'att': 'point', 'shape': 'glb', 'glb': 'mesh_water_crown', 'mat': 'toonwater', 'col': '#e6ffff', 'col2': '#5fd8ff', 'rim': 1, 'scroll': 3,
      'pos': [0, 0, .05], 'rot': [90, 0, 0], 'scale': {'0': [.1, .05, .1], '0.35': [.32, .14, .32], '1': [.42, .04, .42], 'ease': 'out'}, 'op': {'0': 1, '0.6': 1, '1': 0}, 'fade': 0, 'spin': 400},
     {'id': 'flash', 't': 'mesh', 'at': 0, 'life': .12, 'att': 'point', 'shape': 'sphere', 'mat': 'glow', 'col': '#ffffff', 'pos': [0, 0, 0], 'scale': {'0': .05, '0.4': .16, '1': .02}, 'op': 1, 'fade': 0},
     {'id': 'bub', 't': 'emit', 'at': 0, 'life': .04, 'att': 'point', 'pos': [0, 0, 0], 'burst': 8, 'rate': 0, 'from': 'sphere', 'fr': .05, 'dir': 'random', 'speed': [.6, 1.4], 'plife': [.25, .4],
      'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.02, .04], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 2, 'drag': .5, 'bounce': 0}]
save('fam_muzzle', L, 'Tidecaller รอบ 3: วงน้ำแฉกเล็กรอบปากงูหันตามลำน้ำ + แสงวาบ + ฟองเล็ก', .3)
L = [{'id': 'flash', 't': 'mesh', 'at': 0, 'life': .12, 'att': 'point', 'shape': 'sphere', 'mat': 'glow', 'col': '#e6ffff', 'pos': [0, 0, 0], 'scale': {'0': .06, '0.4': .2, '1': .03}, 'op': 1, 'fade': 0},
     {'id': 'glint', 't': 'emit', 'at': 0, 'life': .04, 'att': 'point', 'pos': [0, 0, 0], 'burst': 6, 'rate': 0, 'from': 'sphere', 'fr': .05, 'dir': 'random', 'speed': [.6, 1.4], 'plife': [.15, .25],
      'look': 'spark', 'size': [2.5, 4], 'col': '#ffffff', 'c2': '#c8fbff', 'gravity': 0, 'drag': .5}]
save('fam_hit', L, 'Tidecaller รอบ 3: โดนเป้า = แสงวาบเล็ก + ประกาย (ไม่สาด ไม่แตกปลาย)', .3)

# =================== jaw (separate model so it can open) + magic circle shot (user 2026-11-01, ref designs/water_ref/serpent_circle_ref.png) ===================
HINGE = [-.447, 1.816, .599]   # Blender 'jaw hinge' (x, y, z) → fx (-x, z, -y)
JAW = dict(t='mesh', att='feet', shape='glb', glb='mesh_water_serpent_jaw', mat='toonwater', col=C['col'], col2=C['col2'], rim=.8, scroll=2.4, heat=.6, zw=True, pos=HINGE, scale=1, fade=0)
save('fam_jaw', [dict(JAW, id='jaw', at=0, life=1, op=1, loop=True)], 'Tidecaller: ขากรรไกรงู (แยกชิ้น ให้อ้าได้) — วนตลอด js/68 หยุดตอนอ้าปาก', 1)
save('fam_jawopen', [dict(JAW, id='jaw', at=0, life=.45, rot={'0': [0, 0, 0], '0.22': [30, 0, 0], '0.7': [30, 0, 0], '1': [0, 0, 0]}, op=1)], 'Tidecaller: งูอ้าปากตอนยิง 0.45 วิ', .45)
# cast: a glowing magic circle opens in front of the mouth (faces the target), a smaller one further out, the beam fires from them
CIR = dict(t='mesh', att='point', shape='plane', mat='tex', tex='tex/water_magic_circle', col='#ffffff', col2='#000000', rim=0, uvTile=[1, 1], uvScroll=[0, 0], fade=0)
L = [dict(CIR, id='c1', at=0, life=.42, pos=[0, 0, .18], scale={'0': .03, '0.18': .3, '0.75': .3, '1': .36, 'ease': 'out'}, rot={'0': [0, 0, 0], '1': [0, 0, 120]}, op={'0': 1, '0.75': 1, '1': 0}, int=1.6),
     dict(CIR, id='c2', at=.04, life=.38, pos=[0, 0, .34], scale={'0': .02, '0.2': .2, '0.75': .2, '1': .25, 'ease': 'out'}, rot={'0': [0, 0, 0], '1': [0, 0, -160]}, op={'0': 1, '0.75': 1, '1': 0}, int=1.6),
     {'id': 'flash', 't': 'mesh', 'at': .06, 'life': .14, 'att': 'point', 'shape': 'sphere', 'mat': 'glow', 'col': '#ffffff', 'pos': [0, 0, .18], 'scale': {'0': .03, '0.4': .1, '1': .02}, 'op': 1, 'fade': 0},
     {'id': 'motes', 't': 'emit', 'at': 0, 'life': .3, 'att': 'point', 'pos': [0, 0, .18], 'rate': 40, 'from': 'ring', 'fr': .16, 'dir': 'tangent', 'speed': [1, 2], 'plife': [.2, .35],
      'look': 'spark', 'size': [2.5, 4], 'col': '#ffffff', 'c2': '#9fe8ff', 'gravity': 0, 'drag': .5}]
save('fam_muzzle', L, 'Tidecaller ยิง (รอบ 4): วงเวทน้ำเล็ก ๆ ขนาดปากงู 2 วง (รอบ 5: เล็กลงมาก) (หันหาเป้า หมุนสวนกัน) + แสงวาบ + ประกายวน — ลำน้ำยิงออกจากวงเวท', .45)
