"""Prepare three rigid, clipped wing bones for the Studio-only Wind shield.

Reads the approved hinge-recentered angular wing models without changing them.
Each new recipe contains one span interval, rebased to its rest-axis pivot.
Import ``rest_pivots(side)`` and ``REST_CUTS`` when posing these bones.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MESH = ROOT / 'assets/fx/mesh'
REST_CUTS = (0.0, 0.88, 1.74, 2.6025)
REST_SLOPE_Y = 0.454
REST_SLOPE_Z = -0.124
MATERIAL_PARTS = ('body', 'flow', 'spines', 'cuts', 'feathers', 'accents')
EPSILON = 1e-10


def rest_pivots(side):
    """Return shoulder-local rest pivots; side is +1 (R) or -1 (L)."""
    return [[side*u, REST_SLOPE_Y*u, REST_SLOPE_Z*u]
            for u in REST_CUTS[:-1]]


def clip_polygon(vertices, side, plane, keep_above):
    """Clip a face at side*x=plane, preserving its winding."""
    if not vertices:
        return []
    output = []
    previous = vertices[-1]
    previous_d = side*previous[0]-plane
    previous_in = previous_d >= -EPSILON if keep_above else previous_d <= EPSILON
    for current in vertices:
        current_d = side*current[0]-plane
        current_in = current_d >= -EPSILON if keep_above else current_d <= EPSILON
        if current_in != previous_in:
            t = previous_d/(previous_d-current_d)
            intersection = [previous[a]+t*(current[a]-previous[a]) for a in range(3)]
            intersection[0] = side*plane
            output.append(intersection)
        if current_in:
            output.append(current[:])
        previous, previous_d, previous_in = current, current_d, current_in
    # A face corner exactly on a cutting plane can be added twice.
    clean = []
    for point in output:
        if not clean or sum((point[a]-clean[-1][a])**2 for a in range(3)) > EPSILON**2:
            clean.append(point)
    if len(clean)>1 and sum((clean[0][a]-clean[-1][a])**2 for a in range(3)) <= EPSILON**2:
        clean.pop()
    return clean


def area_squared(a, b, c):
    u = [b[i]-a[i] for i in range(3)]
    v = [c[i]-a[i] for i in range(3)]
    cross = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]]
    return sum(x*x for x in cross)


def clip_part(part, side, bone):
    """Triangulate source faces, clip, and rebase one rigid section."""
    if part.get('k') != 'poly':
        raise ValueError('Approved wing source must contain poly parts only')
    pivot = rest_pivots(side)[bone]
    points, faces, point_ids = [], [], {}

    def point_id(point):
        point = [round(point[a]-pivot[a], 10) for a in range(3)]
        key = tuple(point)
        if key not in point_ids:
            point_ids[key] = len(points)
            points.append(point)
        return point_ids[key]

    for face in part['f']:
        # Clip triangles so the cut never connects disconnected polygon regions.
        for j in range(1, len(face)-1):
            polygon = [part['v'][i][:] for i in (face[0], face[j], face[j+1])]
            if bone > 0:
                polygon = clip_polygon(polygon, side, REST_CUTS[bone], True)
            if bone < 2:
                polygon = clip_polygon(polygon, side, REST_CUTS[bone+1], False)
            for k in range(1, len(polygon)-1):
                triangle = [polygon[0], polygon[k], polygon[k+1]]
                if area_squared(*triangle) <= 1e-20:
                    continue
                indices = [point_id(point) for point in triangle]
                if len(set(indices)) == 3:
                    faces.append(indices)
    if not faces:
        return None
    return {'id': part['id']+'_bone_'+str(bone), 'k':'poly',
            'v':points, 'f':faces, 'flat':part.get('flat', True)}


def generate():
    outputs = []
    for side, label in ((1,'R'),(-1,'L')):
        suffix = '' if side > 0 else '_L'
        for name in MATERIAL_PARTS:
            source = json.loads((MESH/('wind_wing_angular_'+name+suffix+'.mesh.json')).read_text(encoding='utf-8'))
            for bone in range(3):
                parts = [clipped for part in source['parts']
                         if (clipped := clip_part(part, side, bone)) is not None]
                if not parts:
                    raise ValueError(f'Empty shield model: {label} {name} {bone}')
                model = f'wind_shield_{label}_{name}_{bone}'
                result = {'v':source['v'], 'desc':f'Wind shield {label} {name}, rigid section {bone}',
                          'mat':source['mat'], 'pal':source.get('pal','wind'),
                          'tags':['wind','wing','shield','studio','rigid-section'], 'parts':parts}
                path = MESH/(model+'.mesh.json')
                path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
                outputs.append(path.relative_to(ROOT).as_posix())
    return outputs


if __name__ == '__main__':
    paths = generate()
    print(json.dumps({'generated':len(paths), 'cuts':REST_CUTS,
                      'pivots_R':rest_pivots(1), 'pivots_L':rest_pivots(-1),
                      'axis_R':[1,REST_SLOPE_Y,REST_SLOPE_Z],
                      'axis_L':[-1,REST_SLOPE_Y,REST_SLOPE_Z],
                      'models':paths},indent=2))
