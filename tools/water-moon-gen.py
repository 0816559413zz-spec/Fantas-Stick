# Water Moonwater Arts VFX round 3 (agreed with the user 2026-11-01, ref designs/water_ref/moon_mark_ref.jpg):
#   moon_mark — on activation: the mark (long 4-point star + orbits + small moons, tex water_moon_mark) flashes at the caster
#   moon_aura — 8 s: a silver-white half moon (tex water_moon_crescent) floats behind the head + cool moonlight, glints, motes
#   moon_beam — every shot: a thin sharp silver-white water beam fires from the half moon, glittering water scales along it
# Run: python tools/water-tex-moon.py && python tools/water-moon-gen.py && node tools/fx-check.js
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'assets/fx/water'
MOON = [0, 2.45, -.4]          # half moon behind the head (fx local: x right, y up, z forward)
ML = 45.0                      # beam length (host WT_MW.len 900 = 45 m)

def save(name, L, desc, dur):
    (OUT / f'{name}.fx.json').write_text(json.dumps({'v': 1, 'desc': desc, 'tags': ['water', 'moon', 'ingame'], 'pal': 'ice', 'dur': dur, 'seed': 53, 'layers': L}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('water/' + name, len(L), 'layers')
TEX = lambda tex: dict(t='mesh', att='feet', shape='plane', mat='tex', tex='tex/' + tex, col='#ffffff', col2='#000000', rim=0, uvTile=[1, 1], uvScroll=[0, 0], bill=True, fade=0)
def sparks(id, at, life, pos, fr, rate, col='#ffffff', c2='#cfe6ff', burst=0, speed=(.2, .8), **kw):
    l = {'id': id, 't': 'emit', 'at': at, 'life': life, 'att': 'feet', 'pos': pos, 'rate': rate, 'from': 'sphere', 'fr': fr, 'dir': 'random', 'speed': list(speed), 'plife': [.3, .6],
         'look': 'spark', 'size': [3, 6], 'col': col, 'c2': c2, 'gravity': 0, 'drag': .5}
    if burst: l['burst'] = burst
    l.update(kw); return l

# =================== mark (activation) ===================
L = [dict(TEX('water_moon_mark'), id='mark', at=0, life=.9, pos=[0, 1.6, .5], scale={'0': .2, '0.15': 2.9, '0.3': 2.5, '0.75': 2.6, '1': 3.2, 'ease': 'out'}, rot={'0': [0, 0, -20], '1': [0, 0, 25]},
         op={'0': 1, '0.7': 1, '1': 0}, int=1.4),
     {'id': 'flash', 't': 'mesh', 'at': 0, 'life': .25, 'att': 'feet', 'shape': 'sphere', 'mat': 'glow', 'col': '#dff0ff', 'pos': [0, 1.6, .5], 'scale': {'0': .1, '0.3': .45, '1': .05}, 'op': .8, 'fade': 0},
     sparks('burst', 0, .05, [0, 1.6, .5], .4, 0, burst=40, speed=(2, 5)),
     {'id': 'ring', 't': 'mesh', 'at': 0, 'life': .6, 'att': 'feet', 'shape': 'glb', 'glb': 'mesh_water_ringwave_low', 'mat': 'toonwater', 'col': '#e6f4ff', 'col2': '#6fa8f0', 'rim': .6, 'scroll': 2,
      'pos': [0, -.03, 0], 'scale': {'0': .3, '1': 2.2, 'ease': 'out'}, 'spin': 200, 'op': {'0': 1, '0.6': 1, '1': 0}, 'fade': 0}]
save('moon_mark', L, 'Moonwater ตอนเปิด (รอบ 3, รูป moon_mark_ref): ตราดาว 4 แฉก + วงโคจร + จันทร์เล็ก โผล่ใหญ่หน้าตัวแล้วจาง + แสงวาบ + ประกาย + คลื่นวงที่เท้า', 1)

# =================== aura (8 s) ===================
BOB = {'0': MOON, '0.5': [MOON[0], MOON[1] + .08, MOON[2]], '1': MOON}
L = [dict(TEX('water_moon_crescent'), id='moon', at=0, life=2, pos=BOB, scale=1.1, rot={'0': [0, 0, -12], '0.5': [0, 0, -6], '1': [0, 0, -12]}, op=.97, int=1.15, loop=True),
     {'id': 'light', 't': 'mesh', 'at': 0, 'life': 2, 'att': 'feet', 'shape': 'sphere', 'mat': 'glow', 'col': '#9fc8ff', 'pos': MOON, 'scale': {'0': .38, '0.5': .46, '1': .38}, 'op': .07, 'fade': 0, 'loop': True},
     sparks('glints', 0, 1, [0, 2.3, -.3], .7, 10, loop=True),
     {'id': 'motes', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, 2.6, -.3], 'rate': 8, 'from': 'sphere', 'fr': .6, 'dir': 'down', 'speed': [.2, .5], 'plife': [1, 1.4], 'loop': True,
      'look': 'glow', 'size': [1, 1.8], 'col': '#e6f2ff', 'c2': '#9fc8ff', 'gravity': .3, 'drag': .4}]
save('moon_aura', L, 'Moonwater ระหว่าง 8 วิ (รอบ 3): จันทร์เสี้ยวน้ำสีเงินขาวลอยหลังหัว โยกนิด ๆ + แสงจันทร์เย็น + ประกาย + แสงลอยร่วงช้า ๆ', 2)

# =================== beam (every shot, 0.6 s) ===================
SC = {'0': [1, 1, .05], '0.1': [1, 1, 1], '0.75': [1, 1, 1], '1': [.1, .1, 1]}
def bm(id, r, col, op):
    return {'id': id, 't': 'mesh', 'at': 0, 'life': .62, 'att': 'feet', 'shape': 'beam', 'mat': 'glow', 'col': col, 'pos': MOON, 'rot': [1.6, 0, 0],
            'scale': {k: [v[0] * r, v[1] * r, v[2] * ML] for k, v in SC.items()}, 'op': op, 'fade': 0}
L = [bm('outer', .2, '#5f9cff', .3), bm('mid', .1, '#cfe4ff', .75), bm('core', .04, '#ffffff', 1),
     {'id': 'flash', 't': 'mesh', 'at': 0, 'life': .2, 'att': 'feet', 'shape': 'sphere', 'mat': 'glow', 'col': '#ffffff', 'pos': MOON, 'scale': {'0': .1, '0.3': .35, '1': .05}, 'op': .9, 'fade': 0}]
for k, z in enumerate([6, 14, 22, 30, 38]):   # glittering water scales along the beam
    L.append(sparks(f'scales{k}', .02, .45, [0, MOON[1] - z * .028, MOON[2] + z], .35, 50, col='#ffffff', c2='#bfe0ff', speed=(.3, 1.2), plife=[.15, .35]))
L.append({'id': 'drops', 't': 'emit', 'at': .02, 'life': .4, 'att': 'feet', 'pos': [0, MOON[1] - .25, MOON[2] + 8], 'rate': 40, 'from': 'box', 'fr': 4, 'dir': 'down', 'speed': [.3, .8], 'plife': [.3, .5],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.03, .06], 'col': '#eef6ff', 'c2': '#bfe0ff', 'mspin': 0, 'gravity': 8, 'drag': 0, 'bounce': 0})
save('moon_beam', L, 'Moonwater ลำน้ำ (รอบ 3): ลำน้ำสีเงินขาวเรียวคม ยาว 45 ม. พุ่งจากจันทร์เสี้ยวหลังหัว ก้มลงนิด + แสงวาบที่จันทร์ + เกล็ดน้ำแวววาวตลอดลำ + หยดน้ำ', .65)
