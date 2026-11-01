# Water VFX round 2 for the remaining skills (user 2026-11-01, overnight: "design like this as gif all skill") — same system as the
# approved BA / shield / dash / riptide / serpent: toonwater + 'water' materials, Blender shapes (assets/src/water_meshes_build.py),
# bright blue + white, drops and foam. Claude designed these without a per-skill ref round (user asleep) → GIFs for review.
# Run: python tools/water-skills2-gen.py && node tools/fx-check.js
#   water/cage_fly, cage_bubble (Aqua Cage) • beam_cast, beam_loop (Abyssal Beam) • moon_aura, moon_beam (Moonwater Arts)
#   dragon_intro, dragon_hover, dragon_aim, dragon_dive (Dragon of the Deep — the Tidecaller serpent model, scaled up)
import json, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'assets/fx/water'; MESH = ROOT / 'assets/fx/mesh'
C = dict(col='#9ff4ff', col2='#36b8f5', pale='#e6ffff', tint='#7fe8ff', moon='#dff6ff')

def save(name, L, desc, dur, tags=()):
    (OUT / f'{name}.fx.json').write_text(json.dumps({'v': 1, 'desc': desc, 'tags': ['water', 'ingame', *tags], 'pal': 'ice', 'dur': dur, 'seed': 47, 'layers': L}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('water/' + name, len(L), 'layers')
def tw(id, glb, at, life, pos, scale, att='feet', **kw):
    l = {'id': id, 't': 'mesh', 'at': at, 'life': life, 'att': att, 'shape': 'glb', 'glb': glb, 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': .6, 'scroll': 1.8,
         'pos': pos, 'scale': scale, 'op': 1, 'fade': 0}
    l.update(kw); return l
def wat(id, shape, at, life, pos, scale, att='feet', col=None, col2=None, **kw):   # clear glowing water ('water' mat)
    l = {'id': id, 't': 'mesh', 'at': at, 'life': life, 'att': att, 'shape': shape, 'mat': 'water', 'col': col or '#e6ffff', 'col2': col2 or C['col2'], 'rim': 1, 'scroll': 2.5, 'int': 1.2, 'disp': 0,
         'pos': pos, 'scale': scale, 'op': 1, 'fade': 0}
    l.update(kw); return l
def drops(id, at, n, pos, fr, speed, att='feet', size=(.05, .1), frm='sphere', dirn='random', rate=0, life=.04, grav=9, **kw):
    l = {'id': id, 't': 'emit', 'at': at, 'life': life, 'att': att, 'pos': pos, 'rate': rate, 'from': frm, 'fr': fr, 'dir': dirn, 'speed': list(speed), 'plife': [.35, .55],
         'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': list(size), 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': grav, 'drag': 0, 'bounce': 0}
    if n: l['burst'] = n
    l.update(kw); return l
def sparks(id, at, life, pos, fr, rate, att='feet', **kw):
    l = {'id': id, 't': 'emit', 'at': at, 'life': life, 'att': att, 'pos': pos, 'rate': rate, 'from': 'sphere', 'fr': fr, 'dir': 'random', 'speed': [.3, 1], 'plife': [.3, .55],
         'look': 'spark', 'size': [3, 6], 'col': '#ffffff', 'c2': '#c8fbff', 'gravity': -.2, 'drag': .5}
    l.update(kw); return l
def streaks(id, at, life, pos, fr, rate, att='feet', dirn='tangent', speed=(5, 8), **kw):
    l = {'id': id, 't': 'emit', 'at': at, 'life': life, 'att': att, 'pos': pos, 'rate': rate, 'from': 'ring', 'fr': fr, 'dir': dirn, 'speed': list(speed), 'plife': [.18, .3],
         'look': 'streak', 'size': [1.6, 2.8], 'col': '#ffffff', 'c2': '#c8fbff', 'gravity': 0, 'drag': 0, 'curl': False}
    l.update(kw); return l
LOOP = dict(loop=True)

# =================== Aqua Cage ===================
# fly: a swirling water orb (different from the BA drop) wrapped by two spinning water crescents, foam spray behind
L = [tw('orb', 'mesh_water_ringwave_low', 0, 1, [0, 0, 0], .35, att='point', spin=500, **LOOP),
     wat('core', 'sphere', 0, 1, [0, 0, 0], .32, att='point', **LOOP),
     tw('wrapA', 'mesh_water_crescent', 0, 1, [0, 0, 0], .42, att='point', spin=720, rot=[90, 0, 0], **LOOP),
     tw('wrapB', 'mesh_water_crescent', 0, 1, [0, 0, 0], .38, att='point', spin=-600, rot=[0, 0, 90], **LOOP),
     drops('spray', 0, 0, [0, 0, 0], .25, (.3, 1), att='point', rate=40, life=1, size=(.03, .06), grav=4, **LOOP),
     sparks('glint', 0, 1, [0, 0, 0], .3, 20, att='point', **LOOP)]
save('cage_fly', L, 'Aqua Cage (รอบ 2): ลูกน้ำวน มีเสี้ยวน้ำ 2 อันหมุนพันรอบ + ละอองน้ำ + ประกาย — ต่างจากหยดน้ำ BA', 1, ('cage',))
# bubble: a big clear bubble round the target (they float inside) with water bands swirling over it, bubbles rising, foam at the
# bottom; pops into a splash at the end
B = 1.35; L = []
L.append(wat('ball', 'sphere', 0, 2.4, [0, 1.15, 0], {'0': .3, '0.06': B * 1.08, '0.12': B, '0.94': B * 1.02, '1': B * 1.3}, op={'0': .5, '0.94': .5, '1': 0}, col='#c8f6ff', col2='#36b8f5'))
for j, (rot, sp, sc) in enumerate([([0, 0, 0], 260, 1.0), ([70, 0, 0], -220, .95), ([0, 0, 70], 300, .9)]):
    L.append(tw(f'band{j}', 'mesh_water_crescent', .1, 2.2, [0, 1.15, 0], {'0': .3, '0.08': B * sc, '0.95': B * sc, '1': B * 1.4}, rot=rot, spin=sp, op={'0': 0, '0.06': 1, '0.95': 1, '1': 0}))
L.append(tw('foot', 'mesh_water_ringwave_low', 0, 2.4, [0, -.05, 0], {'0': .2, '0.1': .9, '0.95': .9, '1': 1.5}, spin=200, op={'0': 1, '0.95': 1, '1': 0}))
L.append({'id': 'bubbles', 't': 'emit', 'at': .1, 'life': 2.2, 'att': 'feet', 'pos': [0, .5, 0], 'rate': 18, 'from': 'disc', 'fr': .8, 'dir': 'up', 'spread': .2, 'speed': [.6, 1.2], 'plife': [.8, 1.2],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.04, .09], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': -1, 'drag': .3, 'bounce': 0})
L.append(streaks('swirl', .1, 2.2, [0, 1.15, 0], B * 1.05, 24))
L.append(sparks('glint', .1, 2.2, [0, 1.15, 0], B, 10))
L.append(drops('pop', 2.3, 40, [0, 1.15, 0], B * .9, (2.5, 5), size=(.06, .12)))
L.append(tw('popcrown', 'mesh_water_crown', 2.3, .45, [0, 0, 0], {'0': [1, .4, 1], '0.4': [1.4, 1.1, 1.4], '1': [1.7, .4, 1.7], 'ease': 'out'}, op={'0': 1, '0.6': 1, '1': 0}))
save('cage_bubble', L, 'Aqua Cage ฟองขัง (รอบ 2): ฟองน้ำใสใหญ่ครอบตัวเป้า + แถบน้ำ 3 เส้นหมุนรอบ + ฟองลอยขึ้น + เส้นขาววน + คลื่นวงที่เท้า • จบ: ฟองแตกสาด', 2.6, ('cage',))

# =================== Abyssal Beam ===================
# helix ribbons along the beam (fx mesh tubes; the beam runs along +z from the wand height)
LEN = 35.0
def helix_z(name, n, r, turns, rad, desc):
    parts = []
    for j in range(n):
        ph = j * 2 * math.pi / n; pts = []
        for i in range(61):
            u = i / 60; a = ph + u * turns * 2 * math.pi
            pts.append([round(r * math.cos(a), 3), round(r * math.sin(a), 3), round(LEN * u, 3)])
        parts.append({'id': f'h{j}', 'k': 'tube', 'path': pts, 'r0': rad, 'r1': rad * .6, 'curve': 1, 'sides': 8, 'seg': 240, 'pos': [0, 0, 0]})
    (MESH / f'{name}.mesh.json').write_text(json.dumps({'v': 1, 'desc': desc, 'mat': 'solid', 'pal': 'ice', 'tags': ['water'], 'parts': parts}, ensure_ascii=False, indent=1), encoding='utf-8')
helix_z('water_beam_helix', 2, .95, 9, .07, 'Abyssal Beam: เส้นน้ำขาว 2 เส้นพันเกลียวรอบลำน้ำ ยาว 35 ม. (ตามแนว +z)')
BY = 1.6
L = []
L.append(wat('core', 'beam', 0, 1, [0, BY, .7], [.55, .55, LEN], col='#ffffff', col2='#5fd8ff', scroll=6, **LOOP))
L.append(tw('outer', 'mesh_water_crescent', 0, 1, [0, BY, .9], 1.1, rot=[90, 0, 0], spin=900, **LOOP))   # spinning water collar at the wand
L.append({'id': 'shell', 't': 'mesh', 'at': 0, 'life': 1, 'att': 'feet', 'shape': 'beam', 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': .8, 'scroll': 5, 'heat': .8,
          'pos': [0, BY, .7], 'scale': [1.0, 1.0, LEN], 'op': .75, 'fade': 0, **LOOP})
L.append({'id': 'helix', 't': 'mesh', 'at': 0, 'life': 1, 'att': 'feet', 'shape': 'model', 'model': 'water_beam_helix', 'mat': 'toon', 'zw': True, 'col': '#ffffff', 'col2': '#c8fbff', 'rim': 1,
          'pos': [0, BY, .7], 'scale': 1, 'op': 1, 'fade': 0, 'spin': 0, **LOOP})
L.append(tw('muzzle', 'mesh_water_ringwave_low', 0, 1, [0, BY, 1.0], .9, rot=[90, 0, 0], spin=600, **LOOP))
L.append(drops('mspray', 0, 0, [0, BY, 1.2], .4, (2, 4), rate=40, life=1, grav=6, **LOOP))
L.append(tw('end', 'mesh_water_crown', 0, 1, [0, 0, LEN], 1.6, spin=300, **LOOP))
L.append(drops('endspray', 0, 0, [0, .5, LEN], 1, (3, 6), rate=60, life=1, size=(.07, .14), dirn='up', **LOOP))
L.append(streaks('lines', 0, 1, [0, BY, 8], .9, 60, dirn='out', speed=(10, 16), **LOOP))
L.append(sparks('glint', 0, 1, [0, BY, 10], 1.2, 30, **LOOP))
save('beam_loop', L, 'Abyssal Beam ลำน้ำ (รอบ 2): แกนน้ำขาวเรือง + เปลือกน้ำการ์ตูน + เส้นขาวพันเกลียว 2 เส้น + วงน้ำหมุนที่ไม้ + ปลายลำน้ำสาดเป็นมงกุฎ — ยาว 35 ม. ตามตัว', 1, ('beam',))
L = [tw('gather', 'mesh_water_ringwave_low', 0, .55, [0, -.03, 0], {'0': 1.6, '1': .4, 'ease': 'in'}, spin=-400, op={'0': 0, '0.2': 1, '1': .4}),
     {'id': 'spiral', 't': 'mesh', 'at': 0, 'life': .55, 'att': 'feet', 'shape': 'model', 'model': 'water_shield_rise', 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': .6, 'scroll': 2,
      'pos': [0, 0, 0], 'scale': {'0': .7, '1': .35}, 'grow': {'0': 0, '0.7': 1}, 'stagger': .8, 'growBy': 'height', 'spin': 400, 'op': {'0': 1, '0.8': 1, '1': 0}, 'fade': 0},
     wat('ball', 'sphere', .1, .45, [0, BY, .9], {'0': .05, '1': .45, 'ease': 'in'}),
     drops('suck', 0, 0, [0, 1, 0], 1.5, (.5, 1), rate=40, life=.45, dirn='in', grav=0),
     sparks('glint', 0, .5, [0, BY, .9], .4, 30)]
save('beam_cast', L, 'Abyssal Beam ร่าย 0.5 วิ (รอบ 2): น้ำวนเข้าหาตัว + สายน้ำพันขึ้น + ลูกน้ำโตที่ไม้', .6, ('beam',))

# =================== Moonwater Arts ===================
L = [wat('moon', 'sphere', 0, 1, [0, 2.7, -.35], [.42, .42, .08], col='#ffffff', col2='#bfeaff', **LOOP),
     tw('crescent', 'mesh_water_crescent', 0, 1, [0, 2.7, -.3], .55, rot=[90, 0, 0], col='#e6ffff', col2='#7fd8ff', spin=40, **LOOP),
     tw('halo', 'mesh_water_ringwave_low', 0, 1, [0, -.03, 0], .8, spin=120, col='#e6ffff', col2='#7fd8ff', **LOOP),
     sparks('stars', 0, 1, [0, 2.2, 0], .9, 14, **LOOP),
     {'id': 'motes', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, .3, 0], 'rate': 10, 'from': 'ring', 'fr': .8, 'dir': 'up', 'speed': [.6, 1.2], 'plife': [.8, 1.2],
      'look': 'glow', 'size': [1.2, 2], 'col': C['moon'], 'c2': '#9fe8ff', 'gravity': -.2, 'drag': .3, **LOOP}]
save('moon_aura', L, 'Moonwater Arts ออร่า 8 วิ (รอบ 2): พระจันทร์น้ำสีขาวฟ้าเหนือหัว + เสี้ยวน้ำ + วงน้ำที่เท้า + ดาวระยิบ + แสงลอยขึ้น', 1, ('moon',))
ML = 45.0
SC = {'0': [1, 1, .05], '0.15': [1, 1, 1], '0.75': [1, 1, 1], '1': [.15, .15, 1]}
L = [wat('core', 'beam', 0, .65, [0, BY, .7], {k: [v[0] * .3, v[1] * .3, v[2] * ML] for k, v in SC.items()}, col='#ffffff', col2='#bfeaff', scroll=8),
     {'id': 'shell', 't': 'mesh', 'at': 0, 'life': .65, 'att': 'feet', 'shape': 'beam', 'mat': 'toonwater', 'col': C['moon'], 'col2': '#7fd8ff', 'rim': .8, 'scroll': 6,
      'pos': [0, BY, .7], 'scale': {k: [v[0] * .55, v[1] * .55, v[2] * ML] for k, v in SC.items()}, 'op': .7, 'fade': 0},
     tw('flash', 'mesh_water_crescent', 0, .3, [0, BY, 1.0], {'0': .3, '0.3': 1.0, '1': 1.3}, rot=[90, 0, 0], col='#ffffff', col2='#bfeaff', spin=900, op={'0': 1, '1': 0}),
     streaks('lines', 0, .5, [0, BY, 10], .4, 80, dirn='out', speed=(14, 20)),
     sparks('stars', 0, .6, [0, BY, 15], 1, 60),
     drops('endsplash', .05, 24, [0, BY, ML], .5, (2, 4), size=(.05, .1))]
save('moon_beam', L, 'Moonwater Arts ลำน้ำจันทร์ (รอบ 2): ลำแสงน้ำเรียวยาว 45 ม. แกนขาว เปลือกฟ้าซีด + วงเสี้ยวที่ไม้ + เส้นวิ่ง + ดาว + น้ำสาดปลายทาง (0.6 วิ)', .65, ('moon',))

# =================== Dragon of the Deep ===================
# the Tidecaller serpent (model water_serpent, head forward along +z, model x mirrored) scaled up as the dragon
DS = 2.6
SER = dict(t='mesh', att='feet', shape='glb', glb='mesh_water_serpent', mat='toonwater', col=C['col'], col2=C['col2'], rim=.8, scroll=2.4, heat=.6, zw=True, fade=0)
L = [dict(SER, id='rise', at=0, life=1, pos={'0': [0, -6, 0], '0.6': [0, .5, 0], '1': [0, 1.5, 0], 'ease': 'out'}, scale=DS, spin=360, op={'0': 1, '0.85': 1, '1': 0}),
     tw('wave', 'mesh_water_ringwave', 0, .8, [0, -.05, 0], {'0': .5, '1': 3.2, 'ease': 'out'}, spin=300, op={'0': 1, '0.6': 1, '1': 0}),
     tw('jet', 'mesh_water_jet', 0, .9, [0, -.05, 0], {'0': [1.5, 0, 1.5], '0.3': [2, 3.5, 2], '1': [1.2, 0, 1.2], 'ease': 'out'}, spin=300),
     drops('burst', .05, 60, [0, 2, 0], 1.5, (4, 8), size=(.07, .15)),
     streaks('swirl', 0, .9, [0, 2.5, 0], 3, 60)]
save('dragon_intro', L, 'Dragon of the Deep เรียก (รอบ 2): มังกรน้ำ (งูทะเลขยาย 2.6 เท่า) พุ่งขึ้นจากเสาน้ำ หมุนตัว + คลื่นวงใหญ่ + น้ำสาด', 1.05, ('dragon',))
HOV = {str(round(k / 8, 3)): [round(1.2 + .3 * math.sin(k / 8 * 6.283), 2), round(1.2 + .35 * math.sin(k / 8 * 12.566), 2), round(-.8 + .2 * math.cos(k / 8 * 6.283), 2)] for k in range(9)}
L = [dict(SER, id='dragon', at=0, life=2, pos=HOV, scale=DS, op=1, loop=True),
     drops('drips', 0, 0, [1.5, 4, -.8], 1.5, (.2, .5), rate=10, life=1, dirn='down', loop=True),
     sparks('glint', 0, 1, [1.5, 4, -.8], 1.8, 12, loop=True),
     tw('pool', 'mesh_water_ringwave_low', 0, 1, [0, -.03, 0], 1.3, spin=150, loop=True)]
save('dragon_hover', L, 'Dragon of the Deep รอ (รอบ 2): มังกรน้ำลอยวนเหนือไหล่ขวา ตัวขยับขึ้นลง + หยดน้ำ + ประกาย + วงน้ำที่เท้า', 2, ('dragon',))
R = 11.0
L = [wat('disc', 'disc', 0, 1, [0, .04, 0], R, op=.28, col='#bff2ff', col2='#36b8f5', loop=True),
     tw('rim', 'mesh_water_ringwave_low', 0, 1, [0, -.03, 0], [R * .95, 1.4, R * .95], spin=60, loop=True),
     tw('rim2', 'mesh_water_ringwave_low', 0, 1, [0, -.03, 0], [R * .6, 1.1, R * .6], spin=-90, rot=[0, 60, 0], loop=True),
     streaks('ring', 0, 1, [0, .3, 0], R, 40, loop=True)]
save('dragon_aim', L, 'Dragon of the Deep เล็ง (รอบ 2): วงน้ำบนพื้นรัศมี 11 ม. ขอบเป็นคลื่นเตี้ยหมุน 2 ชั้น + เส้นขาววิ่งรอบ', 1, ('dragon',))
# dive: rises a little, then plunges head-first into the target and keeps hammering (10 hits in 2 s)
DIVE = {'0': [3, 9, -4], '0.15': [5, 13, -7], '0.33': [0, 1, 0], '1': [0, -4, 0]}
L = [dict(SER, id='dragon', at=0, life=1.4, pos=DIVE, scale=DS * 1.2, rot={'0': [-20, 0, 0], '0.15': [-30, 0, 0], '0.33': [70, 0, 0], '1': [80, 0, 0]}, op={'0': 1, '0.85': 1, '1': 0})]
for k in range(10):
    t0 = round(.45 + k * .2, 2); a = k * 2.4
    off = [round(math.cos(a) * 3.5 * (k % 3) / 2, 2), 0, round(math.sin(a) * 3.5 * (k % 3) / 2, 2)]
    L.append(tw(f'crown{k}', 'mesh_water_crown', t0, .45, off, {'0': [1.2, .5, 1.2], '0.35': [2.4, 2.2, 2.4], '1': [3, .6, 3], 'ease': 'out'}, spin=200, op={'0': 1, '0.6': 1, '1': 0}))
    L.append(drops(f'hit{k}', t0, 18, [off[0], .5, off[2]], 1.5, (4, 8), size=(.07, .15), dirn='up'))
L.append(tw('wave', 'mesh_water_ringwave', .45, 2.2, [0, -.05, 0], {'0': 2, '1': R * .9, 'ease': 'out'}, spin=200, op={'0': 1, '0.8': .9, '1': 0}))
L.append(tw('jet', 'mesh_water_jet', .45, 2.1, [0, -.05, 0], {'0': [2, 0, 2], '0.15': [3, 4, 3], '0.85': [2.6, 3.2, 2.6], '1': [1.5, 0, 1.5]}, spin=400))
L.append(streaks('swirl', .45, 2, [0, 1, 0], R * .6, 60, dirn='out', speed=(8, 14)))
L.append(sparks('glint', .45, 2, [0, 2, 0], 5, 40))
save('dragon_dive', L, 'Dragon of the Deep พุ่งลง (รอบ 2): มังกรน้ำยกตัวแล้วพุ่งหัวทิ่มลงจุดเล็ง • น้ำสาดเป็นมงกุฎ 10 ครั้งใน 2 วิ + เสาน้ำ + คลื่นวงแผ่ทั่ววง 11 ม. + เส้นขาว + ประกาย', 3.05, ('dragon',))
