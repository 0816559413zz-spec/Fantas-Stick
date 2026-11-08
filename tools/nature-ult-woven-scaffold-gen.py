"""Fine woven-energy model following the frozen, reviewed tall scaffold.

Model-only look development. No gameplay, grow animation or world-size binding.
The immutable scaffold controls silhouette; fibres follow transported frames.
"""
import hashlib
import importlib.util
import json
import math
import random
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/fx/mesh/nature_ult_tree_scaffold_v1.mesh.json'
spec = importlib.util.spec_from_file_location('tree_base', ROOT / 'tools/nature-ult-tree-gen.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
tree = base.Tree('d')
rng = random.Random(72311)
TAU = math.tau
source = json.loads(SOURCE.read_text(encoding='utf-8'))
branch_study = '--branches' in sys.argv

# Colour lives in the strands, not a bark texture or a separate glowing gem.
palette = [('#010b06', 0), ('#02170c', 0), ('#032617', .01),
           ('#064025', .05), ('#09552a', .12), ('#13712e', .25),
           ('#1c8e30', .28), ('#25aa35', .38), ('#4dc942', .52),
           ('#07952c', .58), ('#20c83a', .82)]
anatomy = []


def centreline(part):
    sides = 16 if part['id'] == 'trunk' else 8
    rings = np.asarray(part['v'], dtype=float).reshape(-1, sides+1, 3)[:, :sides]
    centres = rings.mean(axis=1)
    radii = np.linalg.norm(rings-centres[:, None, :], axis=2).mean(axis=1)
    return np.column_stack((centres, radii))


def resample(path, count):
    distance = np.r_[0, np.cumsum(np.linalg.norm(np.diff(path[:, :3], axis=0), axis=1))]
    samples = np.linspace(0, distance[-1], count)
    return np.column_stack([np.interp(samples, distance, path[:, i]) for i in range(4)])


def flowing_branch_base(name, path):
    """Grow main boughs out of the upper body, rather than from a shared rim.

    Keep the original path above the first collar, including all fork anchors.
    A tangent-matched curved prefix starts embedded lower down the trunk.
    """
    lateral = name.startswith('bough_')
    leader = name.startswith('leader_') and not any(s in name for s in ['fork', 'twig'])
    if not (lateral or leader):
        return path
    if lateral:
        cut = next(i for i, p in enumerate(path) if math.hypot(p[0], p[2]) >= 2.4)
        end = path[cut, :3]
        a = math.atan2(end[2], end[0])
        start = np.array([math.cos(a)*.20, 10.1, math.sin(a)*.20])
        handle = start+np.array([math.cos(a)*.55, 2.45, math.sin(a)*.55])
    else:
        cut = next(i for i, p in enumerate(path) if p[1] >= 16.6)
        end = path[cut, :3]
        a = math.atan2(end[2], end[0])
        start = np.array([math.cos(a)*.10, 11.3, math.sin(a)*.10])
        handle = start+np.array([math.cos(a)*.1, 2.5, math.sin(a)*.1])
    tangent = base.unit(path[cut+1, :3]-path[cut-1, :3])
    control = end-tangent*(1.25 if lateral else 1.6)
    prefix = []
    for u in np.linspace(0, 1, 19):
        p = (1-u)**3*start+3*(1-u)**2*u*handle+3*(1-u)*u*u*control+u**3*end
        radius = .18*(1-u)+path[cut, 3]*u
        prefix.append([*p, radius])
    return np.vstack((prefix, path[cut+1:]))


def frames(path):
    pos = path[:, :3]
    tangent = np.gradient(pos, axis=0)
    tangent /= np.maximum(np.linalg.norm(tangent, axis=1)[:, None], 1e-9)
    normals, binormals = [], []
    n = base.unit(np.cross(tangent[0], [0, 1, .01]))
    for t in tangent:
        n = base.unit(n-t*np.dot(n, t))
        normals.append(n.copy())
        binormals.append(base.unit(np.cross(t, n)))
    return np.asarray(normals), np.asarray(binormals)


def sweep(name, path, colour_index, sides=4):
    col, emit = palette[colour_index]
    tree.sweep(name, path.tolist(), col=col, sides=sides, steps=1,
               ribs=.015, surface=True, emit=emit)


crown_paths = {}
for p in source['parts']:
    name = p['id']
    if name.startswith('bough_') or (name.startswith('leader_') and not any(s in name for s in ['fork', 'twig'])):
        path = resample(flowing_branch_base(name, centreline(p)), 64)
        crown_paths[name] = (path, *frames(path))


def flow_into_crown(points, radii, number):
    """Carry surface fibres across the collar into a real parent bough."""
    cut = next(i for i, point in enumerate(points) if point[1] >= 11.6)
    start = points[cut]
    angle = math.atan2(start[2], start[0])
    if number % 4 == 0:
        key = f'leader_{(number//4)%3}'
    else:
        keys = [name for name in crown_paths if name.startswith('bough_')]
        def angle_error(name):
            end = crown_paths[name][0][-1]
            a = math.atan2(end[2], end[0])-angle
            return abs(math.atan2(math.sin(a), math.cos(a)))
        key = min(keys, key=angle_error)
    path, n, b = crown_paths[key]
    if key.startswith('bough_'):
        join = next(i for i, p in enumerate(path) if math.hypot(p[0], p[2]) >= 3.2)
    else:
        join = next(i for i, p in enumerate(path) if p[1] >= 18.2)
    phase = number*2.399+np.linspace(0, .8, len(path))
    offset = n*np.cos(phase)[:, None]+b*np.sin(phase)[:, None]
    tail = path[:, :3]+offset*(path[:, 3]*.92)[:, None]
    end = tail[join]
    a = start+base.unit(points[cut]-points[cut-1])*1.7
    b_control = end-base.unit(tail[join+1]-tail[join-1])*1.4
    thickness = radii[cut]/max(.1, math.hypot(start[0], start[2]))
    end_radius = path[join, 3]*thickness
    curve, widths = [], []
    for u in np.linspace(0, 1, 20)[1:]:
        curve.append((1-u)**3*start+3*(1-u)**2*u*a+3*(1-u)*u*u*b_control+u**3*end)
        widths.append(radii[cut]*(1-u)+end_radius*u)
    return (np.vstack((points[:cut+1], curve, tail[join+1:])),
            np.r_[radii[:cut+1], widths, np.maximum(.001, path[join+1:, 3]*thickness)])


for part in source['parts']:
    name = part['id']
    is_trunk = name == 'trunk'
    is_root = name.startswith('root_')
    main = name.startswith(('bough_', 'leader_')) and not any(t in name for t in ['fork', 'twig'])
    path = flowing_branch_base(name, centreline(part))
    length = np.linalg.norm(np.diff(path[:, :3], axis=0), axis=1).sum()
    count = 76 if is_trunk else max(9, min(36, round(length*2.2)))
    path = resample(path, count)
    n, b = frames(path)
    u = np.linspace(0, 1, count)
    edge = np.minimum(1, u/.065)*np.minimum(1, (1-u)/.045)
    edge = edge*edge*(3-2*edge)
    inset = .6+.4*edge
    group = 'body' if is_trunk else 'roots' if is_root else 'crown'
    anatomy.append((name, group, path, n, b))

    # A recessed, near-black fibrous heart fills the bundle without reading as
    # a smooth wooden cylinder between the individual outer strands.
    core = resample(path, max(8, count//2))
    # Keep the crown/root interiors dense. The trunk heart is narrower so its
    # deeper neon bundle can shine through gaps in the dark outer weave.
    core[:, 3] *= .30 if is_trunk else .86
    if is_trunk:
        # Once the fibres enter the boughs, retire the old central cone inside
        # that junction rather than exposing a bare shaft between the leaders.
        core = core[core[:, 1] < 14.2]
        tip = np.array([0., 14.2, 0., .005])
        core = np.vstack((core, tip))
        taper = np.clip((core[:, 1]-11.7)/2.5, 0, 1)
        core[:, 3] *= 1-taper*taper*(3-2*taper)
        core[-1, 3] = .005
    sweep(group+'_heart_'+name, core, 0, sides=7)

    strands = 96 if is_trunk else 24 if (is_root and 'fork' not in name) else 18 if main else 7
    for k in range(strands):
        phase = TAU*(k+.3*rng.random())/strands
        # Unequal turns, nested bundles, and depth changes prevent a regular
        # cage or equally spaced cable spirals. Roots wind much less strongly.
        turns = 1.23 if is_trunk else .42
        if is_root:
            turns *= .33
        direction = 1
        angle = phase+direction*TAU*turns*u + .38*np.sin(u*8+phase*2)
        angle += .13*np.sin(u*17+phase*3)
        depth = .91 + .055*np.sin(u*9+phase*3) + .025*np.sin(u*23+phase*2)
        offset = n*np.cos(angle)[:, None] + b*np.sin(angle)[:, None]
        points = path[:, :3]+offset*(path[:, 3]*depth*inset)[:, None]
        scale = rng.uniform(.026, .046) if is_trunk else rng.uniform(.055, .095) if (main or is_root) else rng.uniform(.08, .13)
        radius = np.maximum(.0025, path[:, 3]*scale*(.88+.12*np.sin(u*14+k)))
        # Sparse neon strands among many black/dark-green fibres.
        ci = [0, 1, 2, 3, 2, 1, 4, 3, 4, 1, 5, 5][k%12]
        if k%23 == 9:
            ci = 7
            radius *= .42
        radius *= np.minimum(1, .22+u*12)*np.minimum(1, .16+(1-u)*18)
        if is_trunk:
            points, radius = flow_into_crown(points, radius, k)
        sweep(group+'_fibre_'+name+'_'+str(k), np.column_stack((points, radius)), ci, sides=3)

    # Fine longitudinal traces follow the anatomy all the way to its tips.
    for k in range(9 if is_trunk else 2 if main else 1):
        angle = k*2.399+u*(TAU*.82 if is_trunk else 1.4)+.12*np.sin(u*15+k)
        offset = n*np.cos(angle)[:, None]+b*np.sin(angle)[:, None]
        points = path[:, :3]+offset*(path[:, 3]*.965*inset)[:, None]
        radius = path[:, 3]*(.009 if is_trunk else .019)+.0015
        radius *= np.minimum(1, .05+u*12)*np.minimum(1, .1+(1-u)*18)
        if is_trunk:
            points, radius = flow_into_crown(points, radius, k+13)
        sweep(group+'_trace_'+name+'_'+str(k), np.column_stack((points, radius)), 7 if k%3 else 8, sides=3)

# Small light veins inside the body give depth; they are neither an empty
# central opening nor a separate crystal. The brighter current keeps climbing.
body = next(item for item in anatomy if item[0] == 'trunk')
_, _, path, n, b = body

# Loki-reference inner energy: a dense neon braid lives behind the dark-green
# surface fibres. It is strongest through the lower/middle body, then selected
# currents continue into the crown. This is not a separate gem or surface trim.
body_u = np.linspace(0, 1, len(path))
body_y = path[:, 1]
lower_taper = np.clip((body_y-2.15)/1.35, 0, 1)
upper_taper = np.clip((14.25-body_y)/2.2, 0, 1)
neon_profile = lower_taper*upper_taper*(.58+.42*np.exp(-((body_y-7.0)/3.7)**2))
for k in range(9):
    phase = k*TAU/9+.15*math.sin(k*2.7)
    angle = phase+body_u*TAU*(.48+.06*math.sin(k*1.9))
    angle += .18*np.sin(body_u*9+phase*1.6)
    offset = n*np.cos(angle)[:, None]+b*np.sin(angle)[:, None]
    depth = .29+.085*np.sin(body_u*7+phase*2)
    points = path[:, :3]+offset*(path[:, 3]*depth)[:, None]
    radius = path[:, 3]*(.060+.025*neon_profile)
    radius *= (.91+.09*np.sin(body_u*11+k))*np.maximum(.05, neon_profile)
    if k % 4 == 0:
        points, radius = flow_into_crown(points, radius, k+121)
    sweep('body_neon_mass_'+str(k), np.column_stack((points, radius)),
          10 if k == 4 else 9, sides=5)

for k in range(14):
    phase = k*TAU/14+.18*math.sin(k*2.7)
    angle = phase+body_u*TAU*(.72+.09*math.sin(k*1.9))
    angle += .30*np.sin(body_u*10+phase*1.6)
    offset = n*np.cos(angle)[:, None]+b*np.sin(angle)[:, None]
    depth = .53+.10*np.sin(body_u*8+phase*2)+.025*np.sin(body_u*21+k)
    points = path[:, :3]+offset*(path[:, 3]*depth)[:, None]
    radius = path[:, 3]*(.022+.022*neon_profile)
    radius *= (.86+.14*np.sin(body_u*13+k))*np.maximum(.04, neon_profile)
    if k % 3 == 0:
        points, radius = flow_into_crown(points, radius, k+101)
    sweep('body_neon_braid_'+str(k), np.column_stack((points, radius)),
          10 if k % 7 == 2 else 9, sides=4)

for k in range(11):
    u = np.linspace(0, 1, len(path))
    angle = k*TAU/11 + u*TAU*1.25 + .22*np.sin(u*12+k)
    offset = n*np.cos(angle)[:, None]+b*np.sin(angle)[:, None]
    points = path[:, :3]+offset*(path[:, 3]*(.65+.12*np.sin(u*9+k)))[:, None]
    radius = .018+.012*np.sin(u*math.pi)
    points, radius = flow_into_crown(points, radius, k+71)
    sweep('body_inner_current_'+str(k), np.column_stack((points, radius)), 7, sides=3)

# A finer second weave slips across and into the dominant bundles. Its much
# smaller radius avoids turning the body back into an exposed diamond cage.
for k in range(38):
    u = np.linspace(0, 1, len(path))
    phase = k*TAU/38
    angle = phase-u*TAU*.7+.26*np.sin(u*11+phase*2)
    offset = n*np.cos(angle)[:, None]+b*np.sin(angle)[:, None]
    depth = .965+.045*np.sin(u*13+phase*3)
    edge = np.minimum(1, u/.065)*np.minimum(1, (1-u)/.045)
    edge = edge*edge*(3-2*edge)
    points = path[:, :3]+offset*(path[:, 3]*depth*(.6+.4*edge))[:, None]
    radius = path[:, 3]*.008*np.minimum(1, .1+u*8)*np.minimum(1, .1+(1-u)*8)
    points, radius = flow_into_crown(points, radius, k+29)
    sweep('body_crossweft_'+str(k), np.column_stack((points, radius)), 6 if k%9==0 else 3, sides=3)

if branch_study:
    # Recessed currents along parent boughs taper before their endpoints.
    for j, (name, group, branch, bn, bb) in enumerate(anatomy):
        if group != 'crown':
            continue
        main_branch = name in crown_paths
        if main_branch:
            for k in range(3):
                t = np.linspace(0, 1, len(branch))
                angle = k*TAU/3+t*2.8
                offset = bn*np.cos(angle)[:, None]+bb*np.sin(angle)[:, None]
                pts = branch[:, :3]+offset*(branch[:, 3]*.72)[:, None]
                widths = np.maximum(.001, branch[:, 3]*.038*(1-t)**1.5)
                sweep('crown_current_'+name+'_'+str(k), np.column_stack((pts, widths)), 9, sides=3)
        if not any(word in name for word in ['twig', 'fork']):
            continue
        # Sparse clusters leave the branching skeleton legible.
        if j % 3 != 1:
            continue
        anchor = branch[-3, :3]
        tangent = base.unit(branch[-1, :3]-branch[-4, :3])
        side = bn[-3]
        depth = bb[-3]
        for k in range(3):
            spread = (k-1)*.65
            direction = base.unit(tangent*.6+side*spread+np.array([0,.6,0]))
            length = 1.0+.35*math.sin(j+k*1.8)
            t = np.linspace(0, 1, 17)
            stem = anchor+t[:, None]*direction*length
            stem += (np.sin(t*math.pi)*.20)[:, None]*depth
            sweep('crown_spray_'+str(j)+'_'+str(k), np.column_stack((stem, .035*(1-t)+.002)), 4, sides=3)
            # A leaf is a small three-dimensional nest of curved fibres.
            start = stem[7]
            leaf_length = .85+.18*math.sin(j+k)
            for strand in range(7):
                phase = strand*TAU/7
                u = np.linspace(0, 1, 19)
                width = np.sin(u*math.pi)*.23
                pts = start+u[:, None]*direction*leaf_length
                pts += side*(width*math.cos(phase))[:, None]
                pts += depth*(width*.48*math.sin(phase)+.14*np.sin(u*math.pi))[:, None]
                radii = .012+.014*np.sin(u*math.pi)
                sweep('crown_leaf_'+str(j)+'_'+str(k)+'_'+str(strand), np.column_stack((pts, radii)), 7 if strand == 1 else 3 if strand%2 else 4, sides=3)

# Modest shoulder/base flare requested after the first material review.
# Deform the entire local bundle together so fibres, heart, roots and boughs
# stay aligned. The waist (y=6.7..9) and distant branch/root silhouette stay put.
def smoothstep(a, b, value):
    t = min(1., max(0., (value-a)/(b-a)))
    return t*t*(3-2*t)


for part in tree.parts:
    ground_root = branch_study and part['id'].startswith('roots_')
    trunk = branch_study and part['id'].startswith('body_')
    for vertex in part['v']:
        x, y, z = vertex
        local = 1-smoothstep(2.1, 5.0, math.hypot(x, z))
        base_flare = .20*(1-smoothstep(3.5, 6.7, y))
        crown_flare = .18*smoothstep(9.0, 13.2, y)*(1-smoothstep(14.5, 17., y))
        scale = 1+local*(base_flare+crown_flare)
        vertex[0] = round(x*scale, 5)
        vertex[2] = round(z*scale, 5)
        if ground_root or trunk:
            # Seat the trunk and its root joints together.
            seated_y = y - 2.24*(1-smoothstep(2.1, 5.8, y))
        if ground_root:
            radius = math.hypot(vertex[0], vertex[2])
            angle = math.atan2(z, x)
            spread = smoothstep(1.9, 4.1, radius)
            ridge = .10*math.cos(1.8*radius + 2*angle)
            buried_tip = .25*smoothstep(7.2, 10.2, radius)
            ground_y = .10 + .16*y + ridge - buried_tip
            vertex[1] = round(seated_y*(1-spread) + ground_y*spread, 5)
        elif trunk:
            vertex[1] = round(seated_y, 5)

# Combine strands by anatomy/material. This keeps the recipe manageable in
# Studio while preserving distinct roots/body/crown material groups.
merged = {}
for part in tree.parts:
    group = part['id'].split('_')[0]
    key = (group, part['col'], part.get('emit', 0))
    if key not in merged:
        merged[key] = dict(id=f'{group}_woven_{len(merged)}', k='poly', v=[], f=[], uv=[],
                           sub=0, flat=False, seamNormals=True, col=part['col'])
        if part.get('emit'):
            merged[key]['emit'] = part['emit']
    dest = merged[key]
    shift = len(dest['v'])
    dest['v'].extend(part['v'])
    dest['uv'].extend(part['uv'])
    dest['f'].extend([[i+shift for i in face] for face in part['f']])

data = dict(v=1, desc='Woven black-green energy tree following frozen tall scaffold v1, with a recessed neon inner braid, modest trunk flare, unchanged waist and flowing trunk-to-bough transitions. Static visual review; not gameplay bound.',
            pal='nature', mat='solid', smooth=True, bark=False, parts=list(merged.values()))
target = ROOT / ('assets/fx/mesh/nature_ult_tree_branches_v1.mesh.json' if branch_study else 'assets/fx/mesh/nature_ult_tree_woven_v1.mesh.json')
target.write_text(json.dumps(data, separators=(',', ':'))+'\n', encoding='utf-8')
triangles = sum(sum(len(f)-2 for f in p['f']) for p in data['parts'])
print(f'{target.name}: {len(data["parts"])} material groups, {triangles:,} triangles')
print('Scaffold SHA256:', hashlib.sha256(SOURCE.read_bytes().replace(b'\r\n', b'\n')).hexdigest())
