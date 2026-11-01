# Water Abyssal Beam VFX round 3 (user 2026-11-01, ref designs/water_ref/abyssal_beam_ref.png): a big water magic circle in front of
# the caster, then (floating, can't move) a tapered beam fires from its centre — thick at the circle, thin far out — constantly
# wobbling and pulsing, bright cyan / blue / white swapping; a faint energy funnel + rings running along the start; sparkles at the
# tip. Hits splash on each person (beam goes through them: js/09 emits wtabhit per target).
# Run: python tools/water-beam-gen.py && node tools/fx-check.js   (-> water/beam_cast, water/beam_loop, water/beam_hit)
import json, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'assets/fx/water'
C = dict(col='#9ff4ff', col2='#36b8f5', pale='#e6ffff', tint='#7fe8ff')
LEN, BY, Z0 = 35.0, 1.2, .9          # BY 1.2 + host lift 1.2 = beam ~2.4 m up, tilted down TILT so it reaches chest height further out
TILT = 3          # beam length (host WT_AB.len 700 = 35 m), height, start in front of the caster

def save(name, L, desc, dur):
    (OUT / f'{name}.fx.json').write_text(json.dumps({'v': 1, 'desc': desc, 'tags': ['water', 'beam', 'ingame'], 'pal': 'ice', 'dur': dur, 'seed': 51, 'layers': L}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('water/' + name, len(L), 'layers')
CIR = dict(t='mesh', att='feet', shape='plane', mat='tex', tex='tex/water_magic_circle', col='#4fa8ff',   # blue circle (user)
           col2='#000000', rim=0, uvTile=[1, 1], uvScroll=[0, 0], fade=0)
def glowcone(id, at, life, r, col, op, wob, ph, loop=True):
    # tapered beam: cone base at the circle, tip LEN away (cone axis y → rot x 90 = forward); wobble = small sway + thickness pulse
    rot = {str(round(k / 6, 3)): [-90 + TILT + wob * math.sin(k / 6 * 6.283 + ph), wob * .8 * math.cos(k / 6 * 6.283 + ph), 0] for k in range(7)}
    sc = {str(round(k / 6, 3)): [round(r * (1 + .18 * math.sin(k / 6 * 12.566 + ph)), 3), LEN, round(r * (1 + .18 * math.sin(k / 6 * 12.566 + ph)), 3)] for k in range(7)}
    l = {'id': id, 't': 'mesh', 'at': at, 'life': life, 'att': 'feet', 'shape': 'cone', 'mat': 'glow', 'col': col, 'pos': [0, BY, Z0], 'rot': rot, 'scale': sc, 'op': op, 'fade': 0}
    if loop: l['loop'] = True
    return l

# =================== cast 0.5 s: the circle opens in front of the caster ===================
L = [dict(CIR, id='circle', at=0, life=.6, pos=[0, BY, Z0 - .1], scale={'0': .1, '0.6': 2.2, '1': 2.3, 'ease': 'out'}, rot={'0': [0, 0, 0], '1': [0, 0, 160]}, op={'0': 0, '0.2': 1, '1': 1}, int=1.6),
     dict(CIR, id='circle2', at=.1, life=.5, pos=[0, BY, Z0 + .5], scale={'0': .1, '0.7': 1.2, '1': 1.25, 'ease': 'out'}, rot={'0': [0, 0, 0], '1': [0, 0, -200]}, op={'0': 0, '0.3': 1, '1': 1}, int=1.6),
     {'id': 'gather', 't': 'emit', 'at': 0, 'life': .5, 'att': 'feet', 'pos': [0, BY, Z0], 'rate': 70, 'from': 'ring', 'fr': 1.4, 'dir': 'in', 'speed': [2, 4], 'plife': [.25, .4],
      'look': 'spark', 'size': [3, 5], 'col': '#ffffff', 'c2': '#9fe8ff', 'gravity': 0, 'drag': 0}]
save('beam_cast', L, 'Abyssal Beam ร่าย (รอบ 3): วงเวทน้ำใหญ่ตั้งหน้าตัว หมุน+ขยาย + วงเล็กข้างหน้า + ประกายดูดเข้ากลาง', .65)

# =================== loop (3 s, follows + turns with the caster) ===================
L = [dict(CIR, id='circle', at=0, life=1.2, pos=[0, BY, Z0 - .1], scale=2.3, rot={'0': [0, 0, 0], '1': [0, 0, 120]}, op=1, int=1.6, loop=True),
     dict(CIR, id='circle2', at=0, life=1, pos=[0, BY, Z0 + .5], scale=1.25, rot={'0': [0, 0, 0], '1': [0, 0, -160]}, op=1, int=1.6, loop=True),
     # faint energy funnel opening from the circle (ref), slowly spinning
     {'id': 'funnel', 't': 'mesh', 'at': 0, 'life': 1, 'att': 'feet', 'shape': 'cone', 'mat': 'glow', 'col': '#3f8cff', 'pos': [0, BY, Z0 + 2.2], 'rot': [90, 0, 0], 'scale': {'0': [1.1, 2.0, 1.1], '0.5': [1.2, 2.0, 1.2], '1': [1.1, 2.0, 1.1]}, 'spin': 90, 'op': .12, 'fade': 0, 'loop': True},
     # tapered beam: blue outer / cyan mid / white core, each wobbling out of phase; blue + cyan cross-fade so the colours swap
     glowcone('outer', 0, .5, .65, '#1f4fff', {'0': .42, '0.5': .22, '1': .42}, 1.2, 0),
     glowcone('mid', 0, .37, .36, '#1fc0ff', {'0': .3, '0.5': .6, '1': .3}, 1.0, 1.7),
     glowcone('core', 0, .21, .11, '#ffffff', {'0': .8, '0.5': .55, '1': .8}, .6, 3.1)]
for j in range(3):   # rings running forward along the start of the beam (ref)
    L.append({'id': f'ring{j}', 't': 'mesh', 'at': round(j * .14, 2), 'life': .42, 'att': 'feet', 'shape': 'torus', 'inner': .9, 'mat': 'glow', 'col': '#bfeaff', 'pos': {'0': [0, BY, Z0 + .6], '1': [0, BY, Z0 + 5]},
              'rot': [90, 0, 0], 'scale': {'0': .5, '1': .3}, 'op': {'0': 0, '0.2': .8, '1': 0}, 'fade': 0, 'loop': True})
L += [{'id': 'tip', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, BY, Z0 + LEN], 'rate': 60, 'from': 'sphere', 'fr': .4, 'dir': 'random', 'speed': [2, 5], 'plife': [.15, .3],
       'look': 'spark', 'size': [3, 6], 'col': '#ffffff', 'c2': '#9fe8ff', 'gravity': 0, 'drag': .5, 'loop': True},
      {'id': 'glints', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, BY, Z0 + 1.5], 'rate': 40, 'from': 'ring', 'fr': 1.1, 'dir': 'random', 'speed': [.4, 1.2], 'plife': [.2, .4],
       'look': 'spark', 'size': [2.5, 4], 'col': '#ffffff', 'c2': '#bfeaff', 'gravity': 0, 'drag': .5, 'loop': True}]
save('beam_loop', L, 'Abyssal Beam ยิง (รอบ 3, ตามรูปผู้ใช้): วงเวท 2 วง + กรวยแสงจาง + ลำแสงเรียว (ต้นใหญ่ปลายเล็ก) ส่าย/หนาบางตลอด สลับสี น้ำเงิน-ฟ้า-ขาว + วงแหวนวิ่งตามลำ + ประกายที่ปลาย', 1)

# =================== hit splash on each person (beam goes through) ===================
L = [{'id': 'splash', 't': 'emit', 'at': 0, 'life': .04, 'att': 'point', 'pos': [0, 0, 0], 'burst': 16, 'rate': 0, 'from': 'sphere', 'fr': .15, 'dir': 'random', 'speed': [2, 4], 'plife': [.3, .45],
      'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.05, .1], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 9, 'drag': 0, 'bounce': 0},
     {'id': 'flash', 't': 'mesh', 'at': 0, 'life': .15, 'att': 'point', 'shape': 'sphere', 'mat': 'glow', 'col': '#bfeaff', 'pos': [0, 0, 0], 'scale': {'0': .1, '0.4': .45, '1': .05}, 'op': 1, 'fade': 0},
     {'id': 'crown', 't': 'mesh', 'at': 0, 'life': .3, 'att': 'point', 'shape': 'glb', 'glb': 'mesh_water_crown', 'mat': 'toonwater', 'col': C['col'], 'col2': C['col2'], 'rim': .6, 'scroll': 2,
      'pos': [0, -.2, 0], 'rot': [90, 0, 0], 'scale': {'0': .2, '0.4': .55, '1': .7, 'ease': 'out'}, 'op': {'0': 1, '0.6': 1, '1': 0}, 'fade': 0}]
save('beam_hit', L, 'Abyssal Beam โดน (รอบ 3): น้ำสาดที่ตัวคนโดน + แสงวาบ + มงกุฎน้ำเล็ก (ลำแสงทะลุไปต่อ)', .4)
