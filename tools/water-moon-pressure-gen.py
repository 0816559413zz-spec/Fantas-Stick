"""Moonwater enhanced BA: fast pressure-water jet from the wand.

Only writes moon_beam and its two Studio mesh recipes. Keeps the current
wand origin, magic circle and .62-second jet; does not edit host gameplay.
Supersedes the beam section of water-moon-gen.py (old crescent origin).
"""
import copy
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FX = ROOT / 'assets/fx'
DEST = FX / 'water/moon_beam.fx.json'
ORIGIN = [-.3, 1.35, 1.0]
LENGTH = 45.0

def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

# Editable Studio models with actual longitudinal subdivisions for water motion.
body_path = []
for i in range(49):
    u = i / 48
    envelope = math.sin(math.pi * u)
    body_path.append([round(.055 * math.sin(u * 36) * envelope, 5),
                      round(.045 * math.sin(u * 29 + .8) * envelope, 5), round(u * LENGTH, 5)])
write(FX / 'mesh/water_moon_pressure_jet.mesh.json', {
    'v': 1, 'desc': 'Moonwater: ลำน้ำแรงดันสูงต่อเนื่อง คงความกว้าง',
    'mat': 'solid', 'pal': 'ice', 'tags': ['water', 'moon'],
    'parts': [{'id': 'jet', 'k': 'tube', 'path': body_path,
               'r0': .18, 'r1': .18, 'sides': 12, 'seg': 96, 'noise': .018, 'nfreq': 2.4, 'seed': 53}]})

foam_parts = []
for j in range(2):
    path = []
    for i in range(97):
        u = i / 96
        angle = u * math.tau * 7 + j * math.pi
        radius = .205
        path.append([round(math.cos(angle) * radius, 5), round(math.sin(angle) * radius, 5), round(u * LENGTH, 5)])
    foam_parts.append({'id': f'foam_{j}', 'k': 'tube', 'path': path,
                       'r0': .009, 'r1': .0045, 'sides': 5, 'seg': 128})
write(FX / 'mesh/water_moon_pressure_foam.mesh.json', {
    'v': 1, 'desc': 'Moonwater: ริ้วฟองน้ำเส้นบางพันตามลำ',
    'mat': 'solid', 'pal': 'ice', 'tags': ['water', 'moon'], 'parts': foam_parts})

old = json.loads(DEST.read_text(encoding='utf-8'))
circle = next(copy.deepcopy(l) for l in old['layers'] if l['id'] == 'wandc')
circle['col'] = '#d4f7ff'
circle['int'] = 1.45
circle['life'] = .62
circle['scale'] = {'0': .3, '.08': 2.4, '1': 2.4, 'ease': 'out'}
circle['op'] = {'0': 0, '.06': 1, '.88': 1, '1': 0}

thickness = {'0': [1, 1, .05], '.10': [1, 1, 1], '.30': [.94, .94, 1],
             '.50': [1.04, 1.04, 1], '.68': [.96, .96, 1], '.82': [1, 1, 1],
             '1': [1, 1, 1]}
opacity = {'0': .85, '.08': 1, '.88': 1, '1': 0}
layers = [{
    'id': 'pressure_body', 't': 'mesh', 'at': 0, 'life': .62,
    'att': 'feet', 'shape': 'model', 'model': 'water_moon_pressure_jet',
    'mat': 'toonwater', 'col': '#88eaff', 'col2': '#269edc', 'rim': .12,
    'scroll': 6, 'heat': .8, 'disp': .85, 'int': .8, 'pos': ORIGIN,
    'endFrom': 33, 'endTo': LENGTH,
    'rot': {'0': [0, 0, 0], '1': [0, 0, 150]},
    'scale': thickness, 'op': opacity, 'fade': 0,
}, {
    'id': 'surface_foam', 't': 'mesh', 'at': 0, 'life': .62,
    'att': 'feet', 'shape': 'model', 'model': 'water_moon_pressure_foam',
    'mat': 'toonwater', 'col': '#dcfbff', 'col2': '#51cfe7',
    'rim': .08, 'scroll': 6, 'int': .72, 'pos': ORIGIN,
    'endFrom': 33, 'endTo': LENGTH,
    'rot': {'0': [0, 0, 0], '1': [0, 0, 240]},
    'scale': thickness, 'op': {'0': .3, '.1': .8, '.85': .7, '1': 0}, 'fade': 0,
}, {
    'id': 'nozzle_water', 't': 'mesh', 'at': 0, 'life': .16,
    'att': 'feet', 'shape': 'sphere', 'mat': 'toonwater',
    'col': '#82e8ff', 'col2': '#1687d6', 'rim': .2, 'scroll': 6,
    'pos': ORIGIN, 'scale': {'0': [.06, .06, .08], '.22': [.22, .22, .45], '1': [.09, .09, .15]},
    'op': {'0': 1, '.6': .85, '1': 0}, 'int': .85, 'fade': 0,
}, {
    'id': 'nozzle_spray', 't': 'emit', 'at': 0, 'life': .15,
    'att': 'feet', 'pos': ORIGIN, 'burst': 18, 'rate': 50,
    'from': 'ring', 'fr': .15, 'dir': 'aim', 'spread': .13,
    'speed': [25, 40], 'plife': [.09, .18], 'look': 'streak', 'size': [.7, 1.4],
    'col': '#c1f7ff', 'c2': '#4bcce8', 'gravity': 3, 'drag': .2,
}]

# Spray along the actual beam, not a fake impact at the maximum range.
for i in range(3):
    layers.append({
        'id': f'jet_spray_{i}', 't': 'emit', 'at': round(.02 + i * .015, 3), 'life': .48,
        'att': 'feet', 'pos': [ORIGIN[0], ORIGIN[1], ORIGIN[2] + i * 15],
        'from': 'line', 'fh': 15, 'fr': .25, 'rate': 42,
        'dir': 'aim', 'spread': .22, 'speed': [18, 32], 'plife': [.12, .24],
        'look': 'streak', 'size': [.8, 1.5], 'col': '#ddfaff', 'c2': '#55cde4',
        'gravity': 4.5, 'drag': .3,
    })
    layers.append({
        'id': f'falling_drops_{i}', 't': 'emit', 'at': .06, 'life': .52,
        'att': 'feet', 'pos': [ORIGIN[0], ORIGIN[1], ORIGIN[2] + i * 15],
        'from': 'line', 'fh': 15, 'fr': .25, 'rate': 18,
        'dir': 'aim', 'spread': .35, 'speed': [3, 7], 'plife': [.2, .32],
        'look': 'spark', 'size': [.75, 1.35], 'col': '#97e8ff', 'c2': '#299acb',
        'gravity': 9, 'drag': .25,
    })
for i in range(6):
    angle = i * 2.4
    z = 1 + i * 5.7
    layers.append({
        'id': f'pressure_foam_streak_{i}', 't': 'mesh', 'at': round(i * .008, 3), 'life': .49,
        'att': 'feet', 'shape': 'beam', 'mat': 'glow', 'col': '#d4faff',
        'pos': {'0': [ORIGIN[0] + math.cos(angle) * .19, ORIGIN[1] + math.sin(angle) * .19, ORIGIN[2] + z],
                '.5': [ORIGIN[0] + math.cos(angle + 1.0) * .21, ORIGIN[1] + math.sin(angle + 1.0) * .21, ORIGIN[2] + z + 4.5],
                '1': [ORIGIN[0] + math.cos(angle + 2) * .18, ORIGIN[1] + math.sin(angle + 2) * .18, ORIGIN[2] + z + 9]},
        'scale': {'0': [.009, .009, .15], '.12': [.013, .013, 1.4], '.8': [.01, .01, 1.8], '1': [.003, .003, .4]},
        'op': {'0': 0, '.1': .75, '.8': .7, '1': 0}, 'int': .8, 'fade': 0,
    })
for i in range(6):
    # Short water filaments peel away from the jet, then run forward and fall.
    path = {}
    for j in range(9):
        u = j / 8
        angle = i * 2.1 + u * 2.4
        radius = .2 + .55 * math.sin(u * math.pi)
        path[f'{u:.3f}'] = [round(ORIGIN[0] + math.cos(angle) * radius, 4),
                             round(ORIGIN[1] + math.sin(angle) * radius - u * u * .3, 4),
                             round(ORIGIN[2] + 2 + i * 6.1 + u * 4.2, 4)]
    layers.append({'id': f'water_flick_{i}', 't': 'trail', 'att': 'feet',
                   'at': round(.015 + (i % 3) * .025, 3), 'life': .46,
                   'pos': path, 'w': .065, 'tlife': .13, 'k': .75,
                   'col': '#cbf8ff', 'col2': '#35b5e4'})
layers.append(circle)
layers.append({'id': 'wand_circle_edge', 't': 'mesh', 'att': 'feet',
               'at': 0, 'life': .62, 'shape': 'torus', 'inner': .97,
               'mat': 'glow', 'col': '#75dcff', 'int': 1.1,
               'pos': [-.3, 1.35, 1.14], 'rot': [90, 0, 0],
               'scale': {'0': .15, '.08': 1.2, '1': 1.2, 'ease': 'out'},
               'op': {'0': 0, '.06': .75, '.88': .75, '1': 0}, 'fade': 0})
write(DEST, dict(v=1, desc='Moonwater ยิงจากไม้: ลำน้ำต่อเนื่องคงความกว้าง จางปลายอย่างนุ่ม คลื่นน้ำและริ้วฟองไหลเร็ว คงจังหวะโจมตีเดิม',
                 tags=['water', 'moon', 'ingame'], pal='ice', dur=.65, seed=53, layers=layers))
print('water/moon_beam:', len(layers), 'layers; 2 editable Studio models')
