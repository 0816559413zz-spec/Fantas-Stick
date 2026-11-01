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

# (Aqua Cage moved to tools/water-cage-gen.py: round 3 with the user refs)

# (Abyssal Beam moved to tools/water-beam-gen.py: round 3 with the user ref)
BY = 1.6

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
