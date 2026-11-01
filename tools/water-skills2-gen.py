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

# (Moonwater moved to tools/water-moon-gen.py: round 3 with the user ref)

# (Dragon of the Deep moved to tools/water-dragon-gen.py: round 3 with the user ref)
