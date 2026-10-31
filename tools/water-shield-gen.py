# Water shield (agreed with the user 2026-10-31, designs/water.md): a clear water dome with water flowing up its skin,
# a ring of splashing water at its base. While the heal gauge is healing: the dome glows brighter, small BA-style water
# streams spiral up around the body, glowing bubbles rise inside, faint pale-green sparkles. Bright cyan, never dark blue.
# Run: python tools/water-shield-gen.py && node tools/fx-check.js   (-> water/shield_bubble, water/shield_heal + 2 models)
import json, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'assets/fx/water'; MESH = ROOT / 'assets/fx/mesh'
C = dict(tint='#5ef0ff', edge='#1fc3e6', pale='#d2fcff', heal='#b8ffd8')
T = lambda n: 'tex/' + n

def save(name, L, desc, dur=1):
    for l in L: l['loop'] = True
    (OUT / f'{name}.fx.json').write_text(json.dumps({'v': 1, 'desc': desc, 'tags': ['water', 'shield', 'ingame'], 'pal': 'ice', 'dur': dur, 'seed': 41, 'layers': L}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('water/' + name, len(L), 'layers')

def water(id, shape, pos, scale, op=1, flow=1, intensity=1.0, rim=1, spin=0, model=None, rot=None, disp=.6, col=None, col2=None):
    l = {'id': id, 't': 'mesh', 'at': 0, 'life': 1, 'att': 'feet', 'shape': shape, 'mat': 'water', 'col': col or C['tint'], 'col2': col2 or C['edge'], 'rim': rim, 'scroll': flow, 'int': intensity, 'disp': disp,
         'pos': pos, 'scale': scale, 'op': op, 'fade': 0}
    if spin: l['spin'] = spin
    if model: l['model'] = model
    if rot is not None: l['rot'] = rot
    return l

def helix(name, n, r0, r1, h, turns, rad, desc, z0=0.0):
    parts = []
    for j in range(n):
        ph = j * 2 * math.pi / n
        pts = []
        for i in range(25):
            u = i / 24; a = ph + u * turns * 2 * math.pi; r = r0 + (r1 - r0) * u
            pts.append([round(r * math.cos(a), 3), round(z0 + h * u, 3), round(r * math.sin(a), 3)])
        parts.append({'id': f's{j}', 'k': 'tube', 'path': pts, 'r0': rad * .4, 'r1': rad, 'curve': .6, 'sides': 14, 'seg': 72, 'pos': [0, 0, 0]})
    (MESH / f'{name}.mesh.json').write_text(json.dumps({'v': 1, 'desc': desc, 'mat': 'solid', 'pal': 'ice', 'tags': ['water'], 'parts': parts}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('mesh', name)

# water flowing up the dome skin: 4 streams spiralling from the rim (r 1.5) to the top
DOME_R, DOME_H = 2.1, 2.35   # round 2 (user ref designs/water_ref/shield_dome_ref.png): bigger orb
parts = []
for j in range(4):
    ph = j * math.pi / 2; pts = []
    for i in range(25):
        u = i / 24; a = ph + u * 1.4 * math.pi; th = u * (math.pi / 2) * .92   # along the dome: angle from the rim up toward the top
        r = DOME_R * math.cos(th) * 1.02; y = DOME_H * math.sin(th) * 1.02
        pts.append([round(r * math.cos(a), 3), round(y, 3), round(r * math.sin(a), 3)])
    parts.append({'id': f'f{j}', 'k': 'tube', 'path': pts, 'r0': .09, 'r1': .02, 'curve': 1, 'sides': 12, 'seg': 72, 'pos': [0, 0, 0]})
(MESH / 'water_dome_flow.mesh.json').write_text(json.dumps({'v': 1, 'desc': 'โล่น้ำ: สายน้ำ 4 สายไหลวนขึ้นตามผิวโดม (รัศมี 1.55 สูง 2.1) จากขอบล่างถึงใกล้ยอด', 'mat': 'solid', 'pal': 'ice', 'tags': ['water'], 'parts': parts}, ensure_ascii=False, indent=1), encoding='utf-8')
print('mesh water_dome_flow')
(MESH / 'water_dome_rim.mesh.json').write_text(json.dumps({'v': 1, 'desc': 'โล่น้ำ: วงแฉกน้ำกระเซ็นเล็กๆ รอบขอบโดม (รัศมี 1.5 สูง 0.2–0.5)', 'mat': 'solid', 'pal': 'ice', 'tags': ['water'],
    'parts': [{'id': 'rim', 'k': 'crown', 'n': 22, 'r': 1.5, 'h': [.2, .5], 'w': .13, 'tilt': 28, 'sides': 8, 'tip': 0, 'mid': .3, 'jit': .7, 'rings': 2, 'flat': False, 'seed': 7}]}, ensure_ascii=False, indent=1), encoding='utf-8')
print('mesh water_dome_rim')
wav = []
for k, (hy, amp, ph) in enumerate([(.35, .06, 0), (.55, .08, 1.3), (.72, .05, 2.4), (.86, .04, .7)]):   # fraction of dome height
    th = math.asin(hy); r = DOME_R * math.cos(th) * 1.015; pts = []
    for i in range(41):
        a = i / 40 * 2 * math.pi
        pts.append([round(r * math.cos(a), 3), round(DOME_H * hy + amp * math.sin(a * 5 + ph), 3), round(r * math.sin(a), 3)])
    wav.append({'id': f'w{k}', 'k': 'tube', 'path': pts, 'r0': .028, 'r1': .028, 'sides': 8, 'seg': 160, 'pos': [0, 0, 0]})
(MESH / 'water_dome_waves.mesh.json').write_text(json.dumps({'v': 1, 'desc': 'โล่น้ำ: เส้นคลื่นขาวบาง 4 เส้นพาดรอบโดม (ตามรูปอ้างอิง)', 'mat': 'solid', 'pal': 'ice', 'tags': ['water'], 'parts': wav}, ensure_ascii=False, indent=1), encoding='utf-8')
print('mesh water_dome_waves')
(MESH / 'water_dome_foam.mesh.json').write_text(json.dumps({'v': 1, 'desc': 'โล่น้ำ: วงฟองน้ำขาวรอบฐานโดม (ก้อนกลมหลายขนาด 2 แถว)', 'mat': 'solid', 'pal': 'ice', 'tags': ['water'],
    'parts': [{'id': 'f0', 'k': 'sphere', 'r': .2, 'seg': 12, 'arr': 30, 'arrMode': 'ring', 'arrR': DOME_R, 'arrJit': .8, 'pos': [0, .12, 0], 'noise': .03},
              {'id': 'f1', 'k': 'sphere', 'r': .12, 'seg': 10, 'arr': 26, 'arrMode': 'ring', 'arrR': DOME_R + .22, 'arrJit': 1, 'pos': [0, .07, 0], 'noise': .02}]}, ensure_ascii=False, indent=1), encoding='utf-8')
print('mesh water_dome_foam')
helix('water_heal_spiral', 3, .85, .55, 2.3, 1.6, .07, 'โล่น้ำ (ฮีล): สายน้ำเล็ก 3 สายวนเกลียวขึ้นรอบตัว หางที่พื้น หัวที่ระดับหัว')

# =================== shield_bubble — round 3 (user ref designs/water_ref/shield_orb_ref2.webp) ===================
# swirled toon orb (coherent colours: few dark, mostly mid + light, thin white crests) + flat whirl disk + white swirl lines
L = []
L.append({'id': 'orb', 't': 'mesh', 'at': 0, 'life': 1, 'att': 'feet', 'shape': 'dome', 'mat': 'tex', 'tex': T('water_orb_swirl'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0,
          'uvTile': [1, 1], 'uvScroll': [.12, 0], 'pos': [0, -.15, 0], 'scale': [DOME_R, DOME_H, DOME_R], 'op': .82, 'fade': 0})
L.append({'id': 'disk', 't': 'mesh', 'at': 0, 'life': 1, 'att': 'feet', 'shape': 'plane', 'mat': 'tex', 'tex': T('water_toon_swirl'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0,
          'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': [0, .05, 0], 'rot': [90, 0, 0], 'spin': 140, 'scale': DOME_R * 2.7, 'op': .9, 'fade': 0})
for j, (y, sc, tilt, sp) in enumerate([(.1, 3.4, 0, 220), (.3, 2.9, 4, -260), (DOME_H * .62, 2.3, 10, 300)]):
    L.append({'id': f'arcs{j}', 't': 'mesh', 'at': 0, 'life': 1, 'att': 'feet', 'shape': 'plane', 'mat': 'tex', 'tex': T('water_white_arcs'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0,
              'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': [0, y, 0], 'rot': [90 + tilt, j * 50, tilt * .5], 'spin': sp, 'int': 1.3, 'scale': DOME_R * sc, 'op': 1, 'fade': 0})
L.append({'id': 'streaks', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, DOME_H * .55, 0], 'rate': 30, 'from': 'ring', 'fr': DOME_R * 1.1, 'dir': 'tangent', 'speed': [8, 12], 'plife': [.2, .35],
          'look': 'streak', 'size': [2, 3.5], 'col': '#ffffff', 'c2': '#bff4ff', 'gravity': 0, 'drag': 0, 'curl': False})
L.append({'id': 'stars', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, DOME_H * .6, 0], 'rate': 6, 'from': 'ring', 'fr': DOME_R * 1.25, 'dir': 'tangent', 'speed': [5, 8], 'plife': [.3, .5],
          'look': 'spark', 'size': [5, 8], 'col': '#ffffff', 'c2': '#d6f6ff', 'gravity': 0, 'drag': .5})
save('shield_bubble', L, 'โล่สายน้ำ รอบ 3 (รูป shield_orb_ref2): ลูกน้ำลายวนการ์ตูน (เข้มน้อย ฟ้ากลาง+ฟ้าอ่อนเยอะ ยอดขาว ลายไหลทางเดียว) โปร่ง 82% + จานน้ำวนฐาน + เส้นขาววน 3 ชั้น + เส้นลมขาว + ประกายดาว — วนตลอดที่ยกโล่')

# =================== shield_heal (extra, while the heal gauge is healing) ===================
L = []
L.append(water('glow', 'dome', [0, 0, 0], [DOME_R * 1.03, DOME_H * 1.03, DOME_R * 1.03], op=.22, flow=1.6, intensity=1.7, rim=1, spin=-40, disp=.5, col='#9ffbff', col2='#5ef0ff'))
L.append(water('spiral', 'model', [0, 0, 0], 1, op=.95, flow=2.2, intensity=1.2, spin=160, model='water_heal_spiral'))
L.append({'id': 'bubbles', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, .2, 0], 'rate': 22, 'from': 'disc', 'fr': .9, 'dir': 'up', 'spread': .15, 'speed': [.8, 1.6], 'plife': [.8, 1.2],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.05, .1], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': -1, 'drag': .3, 'bounce': 0})
L.append({'id': 'sparkle', 't': 'emit', 'at': 0, 'life': 1, 'att': 'feet', 'pos': [0, 1.1, 0], 'rate': 12, 'from': 'sphere', 'fr': 1.1, 'dir': 'up', 'speed': [.4, .9], 'plife': [.5, .8],
          'look': 'spark', 'size': [3, 5], 'col': C['heal'], 'c2': C['pale'], 'gravity': -.3, 'drag': .5})
save('shield_heal', L, 'โล่สายน้ำ ตอนฮีล (ตกลงกับผู้ใช้): โดมเรืองขึ้น + สายน้ำเล็ก 3 สายวนเกลียวขึ้นรอบตัว + ฟองน้ำเรืองลอยขึ้น + ประกายเขียวอ่อนจางๆ — วนตลอดที่ยังฮีล')
