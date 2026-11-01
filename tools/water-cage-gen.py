# Water Aqua Cage VFX round 3 (agreed with the user 2026-11-01, refs designs/water_ref/cage_orb_ref.jpg + ref3d_bubble_prison.webp):
# an OPAQUE bright blue water ball (no seeing inside; js/68 outlines the caged player in white instead), white curved water
# blades swirling round it at different tilts, clear bubbles and sparkles; forms from water rising under the target; bursts at the end.
# Run: python tools/water-tex-orb2.py && python tools/water-cage-gen.py && node tools/fx-check.js   (-> water/cage_fly, water/cage_bubble)
import json, math, random
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'assets/fx/water'
C = dict(col='#9ff4ff', col2='#36b8f5', pale='#e6ffff', tint='#7fe8ff', blade='#dfeeff', blade2='#8fa8e0')

def save(name, L, desc, dur):
    (OUT / f'{name}.fx.json').write_text(json.dumps({'v': 1, 'desc': desc, 'tags': ['water', 'cage', 'ingame'], 'pal': 'ice', 'dur': dur, 'seed': 49, 'layers': L}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('water/' + name, len(L), 'layers')
ORB = dict(t='mesh', shape='sphere', mat='tex', tex='tex/water_cage_orb', col='#ffffff', col2='#bff4ff', rim=.7, uvTile=[2, 1], uvScroll=[.06, 0], fade=0)
def blade(id, at, life, att, pos, sc, rot, spin, op=1, **kw):
    l = {'id': id, 't': 'mesh', 'at': at, 'life': life, 'att': att, 'shape': 'glb', 'glb': 'mesh_water_crescent', 'mat': 'toon', 'zw': True, 'col': C['blade'], 'col2': C['blade2'], 'rim': 1,
         'pos': pos, 'scale': sc, 'rot': rot, 'spin': spin, 'op': op, 'fade': 0}
    l.update(kw); return l
def blobs(id, at, life, att, pos, fr, rate=0, burst=0, speed=(.2, .6), size=(.08, .16), grav=-.3, dirn='random', plife=(.8, 1.3), **kw):
    l = {'id': id, 't': 'emit', 'at': at, 'life': life, 'att': att, 'pos': pos, 'rate': rate, 'from': 'sphere', 'fr': fr, 'dir': dirn, 'speed': list(speed), 'plife': list(plife),
         'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': list(size), 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': grav, 'drag': .4, 'bounce': 0}
    if burst: l['burst'] = burst
    l.update(kw); return l
def arc(id, at, life, center, R, normal, a0, sweep, w=.11, att='feet', loop=False, n=12):
    # a free-floating white streak sweeping round the orb on a tilted circle (trail following its own pos curve) — not attached to the orb
    nx, ny, nz = normal; L_ = math.sqrt(nx * nx + ny * ny + nz * nz); nx, ny, nz = nx / L_, ny / L_, nz / L_
    ux, uy, uz = (1, 0, 0) if abs(nx) < .9 else (0, 1, 0)
    ax, ay, az = uy * nz - uz * ny, uz * nx - ux * nz, ux * ny - uy * nx; la = math.sqrt(ax * ax + ay * ay + az * az); ax, ay, az = ax / la, ay / la, az / la
    bx, by, bz = ny * az - nz * ay, nz * ax - nx * az, nx * ay - ny * ax
    P = {}
    for k in range(n + 1):
        t = k / n; a = a0 + sweep * t
        P[str(round(t, 3))] = [round(center[0] + R * (math.cos(a) * ax + math.sin(a) * bx), 3), round(center[1] + R * (math.cos(a) * ay + math.sin(a) * by), 3), round(center[2] + R * (math.cos(a) * az + math.sin(a) * bz), 3)]
    l = {'id': id, 't': 'trail', 'at': at, 'life': life, 'att': att, 'pos': P, 'col': C['blade'], 'col2': '#b8c8ff', 'w': w, 'tlife': life * .7, 'k': 2.2}
    if loop: l['loop'] = True
    return l
def sparks(id, at, life, att, pos, fr, rate, **kw):
    l = {'id': id, 't': 'emit', 'at': at, 'life': life, 'att': att, 'pos': pos, 'rate': rate, 'from': 'sphere', 'fr': fr, 'dir': 'random', 'speed': [.2, .7], 'plife': [.3, .6],
         'look': 'spark', 'size': [3, 6], 'col': '#ffffff', 'c2': '#c8fbff', 'gravity': 0, 'drag': .5}
    l.update(kw); return l

# =================== fly: small opaque water ball, two white blades spinning round it, spray ===================
L = [{'id': 'core', 't': 'mesh', 'at': 0, 'life': 1, 'att': 'point', 'shape': 'sphere', 'mat': 'solid', 'col': '#1d66d8', 'col2': '#2a8ef0', 'pos': [0, 0, 0], 'scale': .28, 'op': 1, 'fade': 0, 'loop': True},
     dict(ORB, id='ball', at=0, life=1, att='point', pos=[0, 0, 0], scale=.3, spin=360, loop=True),
     arc('s1', 0, .35, [0, 0, 0], .42, (1, .3, .2), 0, 2 * math.pi, w=.06, att='point', loop=True),
     arc('s2', 0, .45, [0, 0, 0], .38, (-.3, 1, .5), 1, -2 * math.pi, w=.05, att='point', loop=True),
     blobs('spray', 0, 1, 'point', [0, 0, 0], .2, rate=30, speed=(.2, .7), size=(.03, .06), grav=3, plife=(.3, .5), loop=True),
     sparks('glint', 0, 1, 'point', [0, 0, 0], .3, 16, loop=True)]
save('cage_fly', L, 'Aqua Cage ลูกที่ยิง (รอบ 3, ตกลงกับผู้ใช้): ลูกน้ำทึบฟ้าสด + เส้นน้ำขาวโค้ง 2 เส้นหมุนพัน + ละออง + ประกาย', 1)

# =================== bubble: 2.4 s round the caged target (follows them; host lifts them 0.6 m) ===================
B = 1.45; Y = 1.05; T = 2.4   # round 5 (user: base looked weird): bigger + lower so the feet stay inside
FLOAT = {'0': [0, Y, 0], '0.15': [0, Y + .1, 0], '0.4': [0, Y + .16, 0], '0.65': [0, Y + .08, 0], '0.9': [0, Y + .16, 0], '1': [0, Y + .12, 0]}   # floats up a bit and bobs (user)
L = [{'id': 'rise', 't': 'mesh', 'at': 0, 'life': .3, 'att': 'feet', 'shape': 'glb', 'glb': 'mesh_water_jet', 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': .6, 'scroll': 3,
      'pos': [0, -.05, 0], 'scale': {'0': [.8, 0, .8], '0.5': [1, 1.2, 1], '1': [.6, .2, .6]}, 'spin': 400, 'op': {'0': 1, '0.8': 1, '1': 0}, 'fade': 0},
     {'id': 'backing', 't': 'mesh', 'at': .08, 'life': T - .08, 'att': 'feet', 'shape': 'sphere', 'mat': 'solid', 'col': '#1d66d8', 'col2': '#2a8ef0', 'pos': FLOAT,   # solid inner ball: can't see the target inside
      'scale': {'0': .18, '0.08': B * 1.03, '0.12': B * .97, '0.94': B * .97, '1': B * 1.2, 'ease': 'out'}, 'op': {'0': 1, '0.94': 1, '1': 0}, 'fade': 0},
     dict(ORB, id='orb', at=.08, life=T - .08, att='feet', pos=FLOAT, scale={'0': .2, '0.08': B * 1.07, '0.12': B, '0.94': B, '1': B * 1.25, 'ease': 'out'}, spin=30, op={'0': 1, '0.94': 1, '1': 0}),
     {'id': 'halo', 't': 'mesh', 'at': .1, 'life': T - .1, 'att': 'feet', 'shape': 'sphere', 'mat': 'glow', 'col': '#7fd8ff', 'pos': FLOAT, 'scale': B * 1.12, 'op': {'0': 0, '0.08': .16, '0.94': .16, '1': 0}, 'fade': 0}]
rnd = random.Random(7)
for j in range(14):   # floating streaks: random tilted circles round the orb, each sweeps ~200-300 deg then fades (user: lines float around, not stuck to the ball)
    nrm = (rnd.uniform(-1, 1), rnd.uniform(-.6, 1), rnd.uniform(-1, 1)); at = round(.12 + j * .155, 3)
    L.append(arc(f'streak{j}', at, .55, [0, Y + .12, 0], B * rnd.uniform(1.2, 1.6), nrm, rnd.uniform(0, 6.28), rnd.choice([-1, 1]) * rnd.uniform(3.4, 5.2), w=rnd.uniform(.14, .22)))
L += [{'id': 'pool', 't': 'mesh', 'at': .15, 'life': T - .2, 'att': 'ground', 'shape': 'glb', 'glb': 'mesh_water_ringwave_low', 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': .5, 'scroll': 1.6,
       'pos': [0, -.02, 0], 'scale': {'0': .3, '0.1': 1.05, '0.95': 1.05, '1': 1.4}, 'spin': 160, 'op': {'0': 0, '0.1': 1, '0.95': 1, '1': 0}, 'fade': 0},
      {'id': 'puddle', 't': 'mesh', 'at': .15, 'life': T - .2, 'att': 'ground', 'shape': 'disc', 'mat': 'water', 'col': '#bff2ff', 'col2': '#36b8f5', 'rim': 1, 'scroll': 1.4, 'int': 1.1, 'disp': 0,
       'pos': [0, .03, 0], 'scale': {'0': .3, '0.1': 1.1, '1': 1.2}, 'op': {'0': 0, '0.1': .7, '0.95': .7, '1': 0}, 'fade': 0},
      blobs('drips', .2, T - .3, 'feet', [0, Y - B * .85, 0], B * .45, rate=10, speed=(.1, .3), size=(.04, .08), grav=9, dirn='down', plife=(.3, .5)),
      blobs('bubbles', .15, T - .3, 'feet', [0, Y + .12, 0], B * 1.6, rate=7, size=(.1, .2)),
      sparks('glint', .15, T - .3, 'feet', [0, Y + .12, 0], B * 1.1, 18),
      blobs('burst', T - .06, .05, 'feet', [0, Y + .12, 0], B * .9, burst=90, speed=(4, 8), size=(.08, .16), grav=9, dirn='out', plife=(.4, .7)),   # breaks: splashes OUT hard (user)
      {'id': 'shell', 't': 'mesh', 'at': T - .06, 'life': .3, 'att': 'feet', 'shape': 'sphere', 'mat': 'water', 'col': '#e6ffff', 'col2': '#36b8f5', 'rim': 1, 'scroll': 3, 'int': 1.3, 'disp': 0, 'pos': [0, Y + .12, 0], 'scale': {'0': B, '1': B * 2.1, 'ease': 'out'}, 'op': {'0': .8, '1': 0}, 'fade': 0},
      blobs('burstbub', T - .06, .05, 'feet', [0, Y + .12, 0], B * .8, burst=14, speed=(.6, 1.4), size=(.1, .2), grav=-.4, plife=(.6, 1)),
      {'id': 'pop', 't': 'mesh', 'at': T - .06, 'life': .45, 'att': 'feet', 'shape': 'glb', 'glb': 'mesh_water_crown', 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': .6, 'scroll': 2,
       'pos': [0, 0, 0], 'scale': {'0': [1, .4, 1], '0.4': [1.5, 1.2, 1.5], '1': [1.8, .3, 1.8], 'ease': 'out'}, 'op': {'0': 1, '0.6': 1, '1': 0}, 'fade': 0}]
save('cage_bubble', L, 'Aqua Cage ฟองขัง (รอบ 3, ตกลงกับผู้ใช้): น้ำพุ่งห่อเป้า → ลูกน้ำทึบฟ้าสด 2.7 ม. (มองไม่เห็นข้างใน — js/68 ทำขอบขาวให้คนที่ถูกขัง) + เส้นน้ำขาวโค้ง 4 เส้นหมุนคนละองศา + ฟอง + ประกาย • จบ: แตกสาด', T + .5)
