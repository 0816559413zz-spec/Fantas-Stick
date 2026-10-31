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
    for l in L:
        if 'loop' not in l and not l.get('end'): l['loop'] = True   # held layers loop; intro (loop False) / end layers play once
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
DOME_R, DOME_H = 2.1, 3.0   # round 4: taller orb (user: 'orb make it more height')   # round 2 (user ref designs/water_ref/shield_dome_ref.png): bigger orb
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

# =================== shield_bubble — round 4 (user 2026-10-31: refs shield_orb_ref2.webp + ref3d_dome_steps.webp, new toonwater system) ===================
# held state: toonwater orb (mostly light/mid, few dark, neon white lines, swirl bands) + flat whirl disk + 2 white rings
# (waist + over the head, counter-spinning) + white streaks/stars + 3D drips falling off the orb
INTRO = .35   # raise: ground wave bursts out, 3 streams spiral up the dome, the orb rises and closes, then the held loop starts
# rise streams (ref3d_dome_steps): 3 tubes from the ground at the dome foot spiralling up to the top; each = 4 short tubes so 'grow' draws them bottom-up
parts = []
for j in range(3):
    ph = j * 2 * math.pi / 3; pts = []
    for i in range(25):
        u = i / 24; a = ph + u * 1.1 * 2 * math.pi; th = u * (math.pi / 2) * .93
        pts.append([round(DOME_R * 1.04 * math.cos(th) * math.cos(a), 3), round(DOME_H * 1.02 * math.sin(th) - .15, 3), round(DOME_R * 1.04 * math.cos(th) * math.sin(a), 3)])
    for q in range(4):
        seg = pts[q * 6:q * 6 + 7]; o = seg[0]; r0 = .16 - q * .03; r1 = .16 - (q + 1) * .03
        parts.append({'id': f's{j}_{q}', 'k': 'tube', 'path': [[round(p[0] - o[0], 3), round(p[1] - o[1], 3), round(p[2] - o[2], 3)] for p in seg], 'r0': r0, 'r1': r1, 'curve': .5, 'sides': 14, 'seg': 40, 'pos': o})
(MESH / 'water_shield_rise.mesh.json').write_text(json.dumps({'v': 1, 'desc': 'โล่น้ำ (ยกโล่): สายน้ำ 3 สายพันเกลียวจากพื้นขึ้นยอดโดม (4 ท่อนต่อสาย ให้ grow วาดจากล่างขึ้นบน)', 'mat': 'solid', 'pal': 'ice', 'tags': ['water'], 'parts': parts}, ensure_ascii=False, indent=1), encoding='utf-8')
print('mesh water_shield_rise')
L = []
TWI = dict(mat='toonwater', col='#55eeff', col2='#14a8f0', rim=1, scroll=1.6, dis=.6, fade=0, loop=False)
L.append(dict({'id': 'up_wave', 't': 'mesh', 'at': 0, 'life': .4, 'att': 'feet', 'shape': 'glb', 'glb': 'mesh_water_ringwave_low', 'pos': [0, -.03, 0], 'rot': [0, 30, 0], 'spin': 300,
               'scale': {'0': [.4, 1.6, .4], '0.6': [DOME_R * 1.25, 1.3, DOME_R * 1.25], '1': [DOME_R * 1.1, 1, DOME_R * 1.1], 'ease': 'out'}, 'op': {'0': 1, '0.8': 1, '1': 0}}, **TWI))
L.append({'id': 'up_splash', 't': 'emit', 'at': 0, 'life': .05, 'att': 'feet', 'pos': [0, .1, 0], 'burst': 30, 'rate': 0, 'from': 'ring', 'fr': .6, 'dir': 'up', 'spread': .5, 'speed': [3, 5.5], 'plife': [.4, .6], 'loop': False,
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.06, .12], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 9, 'drag': 0, 'bounce': 0})
L.append(dict({'id': 'up_rise', 't': 'mesh', 'at': .03, 'life': .45, 'att': 'feet', 'shape': 'model', 'model': 'water_shield_rise', 'pos': [0, 0, 0], 'scale': 1, 'spin': 220,
               'grow': {'0': 0, '0.6': 1}, 'stagger': .8, 'growBy': 'height', 'op': {'0': 1, '0.75': 1, '1': 0}}, **TWI))
L.append(dict({'id': 'up_orb', 't': 'mesh', 'at': .12, 'life': INTRO - .12, 'att': 'feet', 'shape': 'dome', 'pos': [0, -.15, 0], 'heat': .5,
               'scale': {'0': [DOME_R * .9, .15, DOME_R * .9], '1': [DOME_R, DOME_H, DOME_R], 'ease': 'out'}, 'op': .85}, **TWI))
L.append({'id': 'orb', 't': 'mesh', 'at': INTRO, 'life': 1, 'att': 'feet', 'shape': 'dome', 'mat': 'toonwater', 'col': '#55eeff', 'col2': '#14a8f0', 'rim': 1, 'scroll': .8, 'heat': .5, 'dis': .6,
          'pos': [0, -.15, 0], 'scale': [DOME_R, DOME_H, DOME_R], 'op': .85, 'fade': 0})
L.append(dict(water('disk', 'disc', [0, .03, 0], DOME_R * 1.15, op=.6, flow=1.4, intensity=1.15, spin=140, disp=0, col='#6ef0ff', col2='#1cb8f0'), at=INTRO))   # thin whirl under everything
# base (user: 'more effect, not just a puddle'): 2 ring walls of curling water (Blender) spinning opposite ways round the foot + foam + splashing drops
TW = lambda id, glb, pos, scale, rot=None, spin=0, op=1, at=None, life=1, **kw: dict({'id': id, 't': 'mesh', 'at': INTRO if at is None else at, 'life': life, 'att': 'feet', 'shape': 'glb', 'glb': glb, 'mat': 'toonwater', 'col': '#4fe8ff', 'col2': '#109ef0',
    'rim': .3, 'scroll': 1.4, 'dis': .6, 'pos': pos, 'scale': scale, 'op': op, 'fade': 0}, **({'rot': rot} if rot else {}), **({'spin': spin} if spin else {}), **kw)
L.append(TW('wave0', 'mesh_water_ringwave_low', [0, -.03, 0], DOME_R * 1.0, spin=230))   # low, hugging the ground (user)
L.append(TW('wave1', 'mesh_water_ringwave_low', [0, -.03, 0], DOME_R * 1.13, rot=[0, 60, 0], spin=-170, op=.9))
L.append({'id': 'foam', 't': 'mesh', 'at': INTRO, 'life': 1, 'att': 'feet', 'shape': 'model', 'model': 'water_dome_foam', 'mat': 'toon', 'zw': True, 'col': '#ffffff', 'col2': '#c8f6ff', 'rim': 1, 'pos': [0, 0, 0], 'scale': 1.05, 'spin': 50, 'op': 1, 'fade': 0})
L.append({'id': 'splash', 't': 'emit', 'at': INTRO, 'life': 1, 'att': 'feet', 'pos': [0, .15, 0], 'rate': 22, 'from': 'ring', 'fr': DOME_R * 1.2, 'dir': 'up', 'spread': .35, 'speed': [2.5, 4], 'plife': [.45, .7],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.06, .11], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 9, 'drag': 0, 'bounce': 0})
for j, (y, sc, tilt, sp) in enumerate([(1.0, 2.6, 8, 240), (DOME_H + .25, 1.3, -10, -300)]):   # waist ring + halo over the head
    L.append({'id': f'ring{j}', 't': 'mesh', 'at': INTRO, 'life': 1, 'att': 'feet', 'shape': 'plane', 'mat': 'tex', 'tex': T('water_white_arcs'), 'col': '#ffffff', 'col2': '#000000', 'rim': 0,
              'uvTile': [1, 1], 'uvScroll': [0, 0], 'pos': [0, y, 0], 'rot': [90 + tilt, j * 50, tilt * .5], 'spin': sp, 'int': 3, 'scale': DOME_R * sc, 'op': 1, 'fade': 0})
L.append({'id': 'streaks', 't': 'emit', 'at': INTRO, 'life': 1, 'att': 'feet', 'pos': [0, DOME_H * .55, 0], 'rate': 30, 'from': 'ring', 'fr': DOME_R * 1.1, 'dir': 'tangent', 'speed': [8, 12], 'plife': [.2, .35],
          'look': 'streak', 'size': [2, 3.5], 'col': '#ffffff', 'c2': '#bff4ff', 'gravity': 0, 'drag': 0, 'curl': False})
L.append({'id': 'stars', 't': 'emit', 'at': INTRO, 'life': 1, 'att': 'feet', 'pos': [0, DOME_H * .6, 0], 'rate': 6, 'from': 'ring', 'fr': DOME_R * 1.25, 'dir': 'tangent', 'speed': [5, 8], 'plife': [.3, .5],
          'look': 'spark', 'size': [5, 8], 'col': '#ffffff', 'c2': '#d6f6ff', 'gravity': 0, 'drag': .5})
L.append({'id': 'drips', 't': 'emit', 'at': INTRO, 'life': 1, 'att': 'feet', 'pos': [0, .9, 0], 'rate': 8, 'from': 'ring', 'fr': DOME_R * .97, 'dir': 'down', 'spread': .1, 'speed': [.2, .5], 'plife': [.5, .7],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.07, .12], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 9, 'drag': 0, 'bounce': 0})
# drop shield (end layers, start when the shield is released; user: no splash burst, the water just goes down, a little splash after)
# orb sinks into the ground (0.3 s) -> at the bottom: low wave ring spreads, a few small drops hop up, puddle fades
END = dict(end=True, at=0); LAND = .26
L.append({'id': 'down_orb', 't': 'mesh', 'life': .3, 'att': 'feet', 'shape': 'dome', 'pos': [0, -.15, 0], 'heat': .5,
          'scale': {'0': [DOME_R, DOME_H, DOME_R], '1': [DOME_R * 1.08, .05, DOME_R * 1.08], 'ease': 'in'}, 'op': {'0': .85, '0.8': .8, '1': .2}, **{k: v for k, v in TWI.items() if k != 'loop'}, **END})
L.append(TW('down_wave', 'mesh_water_ringwave_low', [0, -.03, 0], {'0': DOME_R * .95, '1': DOME_R * 1.4, 'ease': 'out'}, life=.45, op={'0': 1, '0.6': .9, '1': 0}, spin=200, **dict(END, at=LAND - .04)))
L.append({'id': 'down_drops', 't': 'emit', 'life': .05, 'att': 'feet', 'pos': [0, .1, 0], 'burst': 16, 'rate': 0, 'from': 'ring', 'fr': DOME_R * .95, 'dir': 'up', 'spread': .5, 'speed': [1.2, 2.4], 'plife': [.35, .5],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.05, .1], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': 10, 'drag': 0, 'bounce': 0, **dict(END, at=LAND)})
L.append(dict(water('down_puddle', 'disc', [0, .03, 0], {'0': DOME_R * 1.05, '1': DOME_R * 1.3, 'ease': 'out'}, op={'0': .7, '1': 0}, flow=1.4, intensity=1.15, disp=0, col='#6ef0ff', col2='#1cb8f0'), life=.6, **dict(END, at=LAND - .06)))
save('shield_bubble', L, 'โล่สายน้ำ รอบ 6: ยกโล่ 0.35 วิ (คลื่นพื้นแผ่ + สายน้ำ 3 สายพันขึ้น + โดมโตขึ้น) → ถือ (วน) → ปล่อยโล่ (น้ำยุบลงพื้น แล้วสาดเบาๆ คลื่นแผ่ แอ่งจาง) (รูป shield_orb_ref2 + ref3d_dome_steps, ระบบ toonwater): ลูกน้ำแรเงาการ์ตูน (ฟ้าอ่อน+ฟ้าเยอะ เข้มน้อย เส้นขาวนีออน ลายวน) โปร่ง 78% + จานน้ำวนฐาน + วงเส้นขาว 2 ชั้น (เอว+เหนือหัว หมุนสวน) + เส้นลมขาว + ประกาย + หยดน้ำ — วนตลอดที่ยกโล่')

# =================== shield_heal (extra, while the heal gauge is healing) — round 2 with the toonwater system (user 2026-10-31 'ทำตอนฮีลต่อ') ===================
# brighter green-tinted breathing glow on the orb + 3 toon water streams spiralling round the outside + a ring wave that climbs the orb
# and shrinks (heal pulse, 1/s) + glowing bubbles + pale-green sparkles. Starts after the shield's raise (INTRO).
L = []
L.append(dict(water('glow', 'dome', [0, -.15, 0], [DOME_R * 1.01, DOME_H * 1.01, DOME_R * 1.01], op={'0': .08, '0.5': .22, '1': .08}, flow=1.6, intensity=1.3, rim=1, spin=-40, disp=.5, col='#7dffd0', col2='#4ff0e0'), at=INTRO))
# streams wrap OUTSIDE the orb (inside they hid behind it): the raise streams again, pale green-cyan, spinning round the orb
L.append(dict(TW('spiral', None, [0, 0, 0], 1.05, spin=170, at=INTRO), shape='model', model='water_shield_rise', col='#b8fff0', col2='#22d8e0', rim=1, scroll=2.2))
L[-1].pop('glb')
# heal pulse: a low ring wave climbs the outside of the orb and shrinks with it (once per second)
PK = {str(u): [0, round(DOME_H * .85 * u - .15, 3), 0] for u in (0, .25, .5, .75, 1)}
SK = {str(u): round(DOME_R * 1.04 * math.sqrt(max(.02, 1 - (.85 * u) ** 2)), 3) for u in (0, .25, .5, .75, 1)}
L.append(TW('pulse', 'mesh_water_ringwave_low', PK, SK, op={'0': 0, '0.1': 1, '0.75': .9, '1': 0}, spin=260, at=INTRO, col='#c8fff0', col2='#22d8e0', rim=1))
L.append({'id': 'bubbles', 't': 'emit', 'at': INTRO, 'life': 1, 'att': 'feet', 'pos': [0, .2, 0], 'rate': 26, 'from': 'disc', 'fr': 1.1, 'dir': 'up', 'spread': .15, 'speed': [.9, 1.8], 'plife': [.9, 1.3],
          'look': 'model', 'model': 'water_blob', 'mmat': 'ice', 'msize': [.06, .12], 'col': C['pale'], 'c2': C['tint'], 'mspin': 0, 'gravity': -1, 'drag': .3, 'bounce': 0})
L.append({'id': 'sparkle', 't': 'emit', 'at': INTRO, 'life': 1, 'att': 'feet', 'pos': [0, 1.3, 0], 'rate': 22, 'from': 'sphere', 'fr': DOME_R * 1.1, 'dir': 'up', 'speed': [.5, 1.1], 'plife': [.5, .8],
          'look': 'spark', 'size': [4, 7], 'col': C['heal'], 'c2': '#ffffff', 'gravity': -.3, 'drag': .5})
L.append({'id': 'motes', 't': 'emit', 'at': INTRO, 'life': 1, 'att': 'feet', 'pos': [0, .3, 0], 'rate': 18, 'from': 'ring', 'fr': DOME_R * 1.15, 'dir': 'up', 'speed': [1, 1.8], 'plife': [.8, 1.1],
          'look': 'glow', 'size': [1.2, 2], 'col': C['heal'], 'c2': C['pale'], 'gravity': -.2, 'drag': .3})
save('shield_heal', L, 'โล่สายน้ำ ตอนฮีล รอบ 2 (ระบบ toonwater): โดมเรืองเขียวอ่อนหายใจ + สายน้ำ 3 สายพันรอบนอกโดม + วงคลื่นไต่ขึ้นโดมแล้วหดหาย (จังหวะฮีล 1 ครั้ง/วิ) + ฟองน้ำลอยขึ้น + ประกายเขียวอ่อน — เริ่มหลังยกโล่เสร็จ วนตลอดที่ยังฮีล')
