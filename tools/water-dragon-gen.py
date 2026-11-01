# Water Dragon of the Deep VFX round 6 (user 2026-11-01, refs designs/water_ref/dragon_ref2.jpg, dragon_ref3.webp, dragon_ref4.png): a big painted
# water dragon (Blender water_dragon / water_dragon_dive, tex water_dragon_skin — laid once along the body: deep-blue striped tail →
# white wave crest mid-body → pale cyan head with foam spray; stripes swirl; red eyes).
#   dragon_intro — whirlpool + geyser at the caster's right, the long dragon spirals up out of it, overshoots, settles
#   dragon_hover — waiting (aim up to 4 s): long wavy body floating at the caster's right, neck arched, head forward, bobbing
#   dragon_aim   — the 11 m water circle on the ground at the aim point
#   dragon_dive  — rises a little then dives head-first very fast and slides into the ground; the head hit = one huge impact,
#                  then strong splashes burst round the area every 0.2 s for 2 s
# Model notes: head points along +z fx; model +X shows on fx -x (eyes: Blender (x, y, z) → fx (-x, z, -y)).
# Curve keys are per layer life (0..1), so eye/trail layers that follow only the start of the dive remap their keys.
# Run: python tools/water-tex-dragon.py && python tools/water-dragon-gen.py && node tools/fx-check.js
import json, math, random
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'assets/fx/water'
C = dict(col='#9ff4ff', col2='#36b8f5', pale='#e6ffff', tint='#7fe8ff')
HOVER = [2.0, 0, -.3]          # wait-pose anchor (model = very long thick body, tail far back right, head ~6.5 m up, forward)
EYES = [(.528, -1.929, 6.592), (-.528, -1.929, 6.592)]          # printed by water_meshes_build.py §11 (wait model)
DEYES = [(.528, -.462, .264), (-.528, -.462, .264)]
rng = random.Random(57)

def save(name, L, desc, dur):
    (OUT / f'{name}.fx.json').write_text(json.dumps({'v': 1, 'desc': desc, 'tags': ['water', 'dragon', 'ingame'], 'pal': 'ice', 'dur': dur, 'seed': 57, 'layers': L}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('water/' + name, len(L), 'layers')
SKIN = dict(t='mesh', att='feet', mat='tex', tex='tex/water_dragon_skin', col='#ffffff', col2='#bfeaff', rim=.3, uvTile=[1, 1], uvScroll=[.12, 0], fade=0)
def eye(id, at, life, pos, **kw):
    l = {'id': id, 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'sphere', 'mat': 'glow', 'col': '#ff3a3a', 'pos': pos, 'scale': .07, 'op': 1, 'fade': 0}
    l.update(kw); return l
def add(a, b): return [round(a[0] + b[0], 3), round(a[1] + b[1], 3), round(a[2] + b[2], 3)]
fxe = lambda e: (-e[0], e[2], -e[1])
def drops(id, at, life, pos, fr, rate=0, burst=0, speed=(.2, .6), size=(.06, .12), grav=9, dirn='random', att='feet', **kw):
    l = {'id': id, 't': 'emit', 'at': at, 'life': life, 'att': att, 'pos': pos, 'rate': rate, 'from': 'sphere', 'fr': fr, 'dir': dirn, 'speed': list(speed), 'plife': [.4, .7],
         'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': list(size), 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': grav, 'drag': 0, 'bounce': 0}
    if burst: l['burst'] = burst
    l.update(kw); return l
def tw(id, glb, at, life, pos, scale, **kw):
    l = {'id': id, 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'glb', 'glb': glb, 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': .5, 'scroll': 2,
         'pos': pos, 'scale': scale, 'op': 1, 'fade': 0}
    l.update(kw); return l

# =================== hover ===================
BOB = {str(round(k / 8, 3)): [HOVER[0], HOVER[1] + round(.18 * math.sin(k / 8 * 6.283), 3), HOVER[2]] for k in range(9)}
L = [dict(SKIN, id='dragon', at=0, life=2.4, shape='glb', glb='mesh_water_dragon', pos=BOB, scale=1, op=1, loop=True)]
for j, e in enumerate(EYES):
    L.append(eye(f'eye{j}', 0, 2.4, {k: add(v, fxe(e)) for k, v in BOB.items()}, scale=.1, loop=True))
L += [drops('drips', 0, 1, [HOVER[0] + 2.5, 3, HOVER[2] - 5], 4, rate=24, speed=(.1, .3), dirn='down', loop=True),
      {'id': 'glints', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [HOVER[0] + 2.5, 3.5, HOVER[2] - 4], 'rate': 24, 'from': 'sphere', 'fr': 5, 'dir': 'random', 'speed': [.2, .6], 'plife': [.3, .6],
       'look': 'spark', 'size': [3, 6], 'col': '#ffffff', 'c2': '#c8fbff', 'gravity': 0, 'drag': .5, 'loop': True}]
save('dragon_hover', L, 'Dragon of the Deep รอ (รอบ 6): มังกรน้ำตัวยาวลอยข้างขวา ลำตัวเป็นคลื่น คอโค้ง หัวชี้ไปข้างหน้าพร้อมพุ่ง • ผิวน้ำไหลตามตัว + ตาแดง + โยกขึ้นลง + หยดน้ำ + ประกาย', 2.4)

# =================== intro (1.3 s; host intro 1 s, then the hover loop takes over) ===================
G = [HOVER[0] + 2, 0, HOVER[2] - 4]   # whirlpool under the body
UP = {'0': [HOVER[0], -16, HOVER[2]], '0.42': [HOVER[0], .9, HOVER[2]], '0.56': [HOVER[0], -.45, HOVER[2]], '0.68': [HOVER[0], .2, HOVER[2]], '0.78': HOVER, '1': HOVER, 'ease': 'out'}
L = [dict(SKIN, id='dragon', at=0, life=1.3, shape='glb', glb='mesh_water_dragon', pos=UP, rot={'0': [0, -420, 0], '0.45': [0, -60, 0], '0.7': [0, 0, 0], '1': [0, 0, 0]}, scale={'0': .8, '0.45': 1, '1': 1}, op=1),
     tw('whirl', 'mesh_water_ringwave_low', 0, 1.1, [G[0], -.03, G[2]], {'0': .5, '0.3': 3.4, '0.8': 3.6, '1': 2}, spin=-500, op={'0': 1, '0.75': 1, '1': 0}),
     tw('whirl2', 'mesh_water_ringwave_low', .1, 1, [G[0], -.03, G[2]], {'0': .3, '0.4': 2.2, '1': 1.2}, spin=-700, op={'0': 1, '0.7': 1, '1': 0}),
     tw('geyser', 'mesh_water_jet', 0, .9, [G[0], -.05, G[2]], {'0': [1.4, 0, 1.4], '0.25': [1.8, 2.2, 1.8], '0.7': [1.6, 1.6, 1.6], '1': [1, 0, 1]}, spin=500),
     tw('feet', 'mesh_water_ringwave_low', 0, .7, [0, -.03, 0], {'0': .4, '1': 1.6, 'ease': 'out'}, spin=300, op={'0': 1, '0.6': 1, '1': 0}),
     drops('splash', .05, .05, [G[0], .5, G[2]], 1.5, burst=60, speed=(4, 8), size=(.08, .16), dirn='up'),
     drops('spray', 0, .6, [G[0], 1.5, G[2]], 2.5, rate=90, speed=(1, 3), size=(.06, .12)),
     {'id': 'swirl', 't': 'emit', 'at': 0, 'life': .8, 'att': 'feet', 'pos': [G[0], .3, G[2]], 'rate': 60, 'from': 'ring', 'fr': 3, 'dir': 'up', 'speed': [3, 6], 'plife': [.3, .5],
      'look': 'streak', 'size': [2, 3.5], 'col': '#ffffff', 'c2': '#c8fbff', 'gravity': 0, 'drag': 0}]
for j, e in enumerate(EYES):
    L.append(eye(f'eye{j}', 1.0, .3, add(HOVER, fxe(e)), scale=.1))
save('dragon_intro', L, 'Dragon of the Deep เรียก (รอบ 6): น้ำวน + เสาน้ำข้างขวา → มังกรตัวยาวหมุนวนพุ่งขึ้นจากน้ำวน เด้งลงนิด แล้วนิ่งในท่ารอ', 1.35)

# =================== aim ===================
R = 11.0
L = [{'id': 'disc', 't': 'mesh', 'at': 0, 'life': 1, 'att': 'feet', 'shape': 'disc', 'mat': 'water', 'col': '#bff2ff', 'col2': '#36b8f5', 'rim': 1, 'scroll': 1.4, 'int': 1.1, 'disp': 0,
      'pos': [0, .04, 0], 'scale': R, 'op': .25, 'fade': 0, 'loop': True},
     tw('rim', 'mesh_water_ringwave_low', 0, 1, [0, -.03, 0], [R * .97, 1.2, R * .97], spin=50, loop=True),
     tw('rim2', 'mesh_water_ringwave_low', 0, 1, [0, -.03, 0], {'0': [R * .2, .8, R * .2], '1': [R * .9, .8, R * .9]}, op={'0': 0, '0.2': 1, '1': 0}, spin=-80, loop=True)]
save('dragon_aim', L, 'Dragon of the Deep เล็ง (รอบ 6): วงน้ำบนพื้น 11 ม. + ขอบคลื่นเตี้ย + ระลอกวิ่งจากกลางออกขอบ', 1)

# =================== dive (played at the target, a = caster → target) ===================
DL = 1.6   # dragon layer life; ground hit at 0.22 × 1.6 ≈ 0.35 s, then the long body slides into the ground
DS = 1   # dive model is built at size (~22 m)
DIVE = {'0': [0, 24, -18], '0.08': [0, 28, -19], '0.22': [0, .5, -.3], '0.5': [0, -9, 1], '1': [0, -32, 2]}
DROT = {'0': 20, '0.08': -15, '0.22': 62, '0.5': 75, '1': 82}
L = [dict(SKIN, id='dragon', at=0, life=DL, shape='glb', glb='mesh_water_dragon_dive', pos=DIVE, rot={k: [v, 0, 0] for k, v in DROT.items()}, scale=DS, op=1)]
def pitch(v, a):   # rot x positive tilts +z down
    c, n = math.cos(math.radians(a)), math.sin(math.radians(a)); return [v[0], v[1] * c - v[2] * n, v[1] * n + v[2] * c]
HK = ['0', '0.08', '0.22']
for j, e in enumerate(DEYES):
    L.append(eye(f'eye{j}', 0, round(.22 * DL, 3), {str(round(float(k) / .22, 3)): add(DIVE[k], pitch([q * DS for q in fxe(e)], DROT[k])) for k in HK}, scale=.1))
L.append(drops('trail', 0, round(.22 * DL, 3), {str(round(float(k) / .22, 3)): DIVE[k] for k in HK}, 1, rate=160, speed=(.3, .9), size=(.08, .16)))
T0 = .35
# --- the head hit: one huge impact
L += [tw('boom', 'mesh_water_crown', T0, .8, [0, -.05, 0], {'0': [2, .6, 2], '0.3': [6, 5, 6], '1': [7, 1, 7], 'ease': 'out'}, spin=150, op={'0': 1, '0.6': 1, '1': 0}),
      tw('shock', 'mesh_water_ringwave_low', T0, .6, [0, -.03, 0], {'0': [1, 2.5, 1], '1': [R * 1.2, 1, R * 1.2], 'ease': 'out'}, spin=200, op={'0': 1, '0.6': 1, '1': 0}),
      tw('shock2', 'mesh_water_ringwave', T0, .7, [0, -.05, 0], {'0': [1, 1.4, 1], '1': [8, 1, 8], 'ease': 'out'}, spin=-150, op={'0': 1, '0.5': 1, '1': 0}),
      tw('geyser', 'mesh_water_jet', T0, 1.1, [0, -.05, 0], {'0': [3, 0, 3], '0.15': [5, 7, 5], '0.6': [4.5, 6, 4.5], '1': [2, 0, 2]}, spin=400),
      tw('column', 'mesh_water_jet', T0 + .3, 1.9, [0, -.05, 0], {'0': [2, 2, 2], '0.1': [3, 3.5, 3], '0.9': [2.8, 3.2, 2.8], '1': [1.5, 0, 1.5]}, spin=-500),
      drops('boomdrops', T0, .05, [0, 1, 0], 2, burst=80, speed=(8, 14), size=(.12, .24), dirn='up'),
      {'id': 'flash', 't': 'mesh', 'at': T0, 'life': .2, 'att': 'feet', 'shape': 'sphere', 'mat': 'glow', 'col': '#bfeaff', 'pos': [0, .8, 0], 'scale': {'0': .5, '0.3': 2.4, '1': .3}, 'op': .5, 'fade': 0},
      {'id': 'lines', 't': 'emit', 'at': T0, 'life': .1, 'att': 'feet', 'pos': [0, .6, 0], 'burst': 60, 'rate': 0, 'from': 'ring', 'fr': 2, 'dir': 'out', 'speed': [16, 24], 'plife': [.25, .4],
       'look': 'streak', 'size': [3, 5], 'col': '#ffffff', 'c2': '#c8fbff', 'gravity': 0, 'drag': 0}]
# --- then strong splashes round the area every 0.2 s
for k in range(1, 10):
    t0 = round(T0 + k * .2, 2)
    for m in range(3):
        a = rng.uniform(0, 6.283); r = rng.uniform(2.5, 9); x, z = round(r * math.cos(a), 2), round(r * math.sin(a), 2); sc = round(rng.uniform(2.4, 3.6), 2)
        L.append(tw(f'cr{k}_{m}', 'mesh_water_crown', round(t0 + m * .05, 2), .5, [x, -.05, z], {'0': [sc * .5, .4, sc * .5], '0.35': [sc, sc * .9, sc], '1': [sc * 1.2, .4, sc * 1.2], 'ease': 'out'}, spin=200, op={'0': 1, '0.6': 1, '1': 0}))
        L.append(tw(f'jt{k}_{m}', 'mesh_water_jet', round(t0 + m * .05, 2), .45, [x, -.05, z], {'0': [1.2, 0, 1.2], '0.3': [1.6, 2.4, 1.6], '1': [1, 0, 1]}, spin=300))
    L.append(tw(f'ring{k}', 'mesh_water_ringwave_low', t0, .6, [0, -.03, 0], {'0': [1.5, 1.8, 1.5], '1': [R, 1, R], 'ease': 'out'}, spin=150, op={'0': 1, '0.6': .9, '1': 0}))
    L.append(drops(f'sp{k}', t0, .04, [0, .4, 0], 7, burst=40, speed=(4, 8), size=(.1, .18), dirn='up', **{'from': 'ring'}))
save('dragon_dive', L, 'Dragon of the Deep พุ่ง (รอบ 6): มังกรตัวยาวยกตัวนิดแล้วดิ่งลงเร็ว มุดลงพื้นทั้งตัว • หัวชนพื้น = กระแทกใหญ่ (มงกุฎน้ำยักษ์ + คลื่นช็อก 2 ชั้น + เสาน้ำ + น้ำสาด + เส้นพุ่งออก) • จากนั้นน้ำสาดแรง ๆ รอบพื้นที่ทุก 0.2 วิ (มงกุฎ + เสาน้ำ 3 จุดสุ่ม + คลื่นวงจากกลาง)', 2.8)
