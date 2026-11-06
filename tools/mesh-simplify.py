"""Reduce triangles of a one-primitive GLB without changing its look.

python tools/mesh-simplify.py assets/vfx/water_crown.glb 0.33            -> overwrite the file
python tools/mesh-simplify.py in.glb 0.33 out.glb                        -> write a copy

Half-edge collapse (surviving vertices keep their exact position, normal and UV), cost = quadric
error. Open edges and UV seams stay locked so the shape outline and textures do not crack. Needs numpy only.
"""
import heapq
import json
import struct
import sys
from pathlib import Path

import numpy as np

CT = {5126: (np.float32, 4), 5123: (np.uint16, 2), 5125: (np.uint32, 4), 5121: (np.uint8, 1)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def read_glb(path):
    b = Path(path).read_bytes()
    n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + n])
    return j, b[20 + n + 8:]


def accessor(j, data, i):
    a = j['accessors'][i]
    v = j['bufferViews'][a['bufferView']]
    dt, _ = CT[a['componentType']]
    c = NC[a['type']]
    arr = np.frombuffer(data, dt, a['count'] * c, v.get('byteOffset', 0) + a.get('byteOffset', 0))
    return arr.reshape(-1, c) if c > 1 else arr.copy()


def simplify(P, N, UV, T, ratio):
    nv = len(P)
    tris = [list(map(int, t)) for t in T]
    alive = [True] * len(tris)
    vt = [set() for _ in range(nv)]
    for i, t in enumerate(tris):
        for v in t:
            vt[v].add(i)
    edges = {}
    for t in tris:
        for a, b in ((t[0], t[1]), (t[1], t[2]), (t[2], t[0])):
            k = (a, b) if a < b else (b, a)
            edges[k] = edges.get(k, 0) + 1
    locked = np.zeros(nv, bool)
    for (a, b), c in edges.items():
        if c != 2:
            locked[a] = locked[b] = True
    Q = np.zeros((nv, 4, 4))
    for t in tris:
        p = P[t]
        n = np.cross(p[1] - p[0], p[2] - p[0])
        area = np.linalg.norm(n)
        if area < 1e-12:
            continue
        n = n / area
        pl = np.append(n, -n.dot(p[0]))
        K = np.outer(pl, pl) * area
        for v in t:
            Q[v] += K
    ver = [0] * nv
    extent = np.ptp(P, axis=0).max()

    def cost(a, b):            # move a onto b
        h = np.append(P[b], 1.0)
        return float(h @ (Q[a] + Q[b]) @ h) / (extent * extent) + np.sum((P[a] - P[b]) ** 2) / (extent * extent) * 1e-3

    heap = []

    def push(a, b):
        if not locked[a]:
            heapq.heappush(heap, (cost(a, b), ver[a], ver[b], a, b))

    for a, b in edges:
        push(a, b)
        push(b, a)
    live = len(tris)
    target = int(len(tris) * ratio)

    def ok(a, b):
        if N[a].dot(N[b]) < 0.8:
            return False
        na = {v for t in vt[a] for v in tris[t]}
        nb = {v for t in vt[b] for v in tris[t]}
        shared = vt[a] & vt[b]
        if len(shared) != 2 or len((na & nb) - {a, b}) != 2:
            return False
        for t in vt[a] - shared:
            q = tris[t]
            o = P[q]
            n0 = np.cross(o[1] - o[0], o[2] - o[0])
            r = [b if v == a else v for v in q]
            o = P[r]
            n1 = np.cross(o[1] - o[0], o[2] - o[0])
            if n0.dot(n1) <= 0.25 * np.sqrt(n0.dot(n0) * n1.dot(n1)) or n1.dot(n1) < 1e-14:
                return False
            u = UV[q]
            s0 = (u[1, 0] - u[0, 0]) * (u[2, 1] - u[0, 1]) - (u[2, 0] - u[0, 0]) * (u[1, 1] - u[0, 1])
            u = UV[r]
            s1 = (u[1, 0] - u[0, 0]) * (u[2, 1] - u[0, 1]) - (u[2, 0] - u[0, 0]) * (u[1, 1] - u[0, 1])
            if s0 * s1 <= 0:
                return False
        return True

    dead = [False] * nv
    while heap and live > target:
        _, va, vb, a, b = heapq.heappop(heap)
        if dead[a] or dead[b] or va != ver[a] or vb != ver[b] or not ok(a, b):
            continue
        for t in vt[a] & vt[b]:
            alive[t] = False
            live -= 1
            for v in tris[t]:
                vt[v].discard(t)
        for t in list(vt[a]):
            tris[t] = [b if v == a else v for v in tris[t]]
            vt[b].add(t)
        vt[a].clear()
        dead[a] = True
        Q[b] += Q[a]
        ver[b] += 1
        nb = {v for t in vt[b] for v in tris[t]} - {b}
        for v in nb:
            ver[v] += 1
        for v in nb:
            push(b, v)
            push(v, b)
    out = np.array([t for t, k in zip(tris, alive) if k], np.uint32)
    used, inv = np.unique(out, return_inverse=True)
    return used, inv.reshape(-1, 3)


def write_glb(j, path, pr, P, N, UV, T):
    blobs, views = [], []
    off = 0
    for arr, target in ((P, 34962), (N, 34962), (UV, 34962), (T.astype(np.uint32).ravel(), 34963)):
        d = arr.tobytes()
        views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(d), 'target': target})
        d += b'\0' * (-len(d) % 4)
        blobs.append(d)
        off += len(d)
    j['bufferViews'] = views
    a = pr['attributes']
    acc = []
    for i, (arr, typ, ct) in enumerate(((P, 'VEC3', 5126), (N, 'VEC3', 5126), (UV, 'VEC2', 5126))):
        e = {'bufferView': i, 'componentType': ct, 'count': len(arr), 'type': typ}
        if i == 0:
            e['min'] = arr.min(0).tolist()
            e['max'] = arr.max(0).tolist()
        acc.append(e)
    acc.append({'bufferView': 3, 'componentType': 5125, 'count': T.size, 'type': 'SCALAR'})
    j['accessors'] = acc
    pr['attributes'] = {'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2}
    pr['indices'] = 3
    j['buffers'] = [{'byteLength': off}]
    js = json.dumps(j, separators=(',', ':')).encode()
    js += b' ' * (-len(js) % 4)
    body = b''.join(blobs)
    total = 12 + 8 + len(js) + 8 + len(body)
    Path(path).write_bytes(struct.pack('<III', 0x46546C67, 2, total) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(body), 0x004E4942) + body)


def main():
    src, ratio = sys.argv[1], float(sys.argv[2])
    dst = sys.argv[3] if len(sys.argv) > 3 else src
    j, data = read_glb(src)
    prs = [p for m in j['meshes'] for p in m['primitives']]
    if len(prs) != 1 or set(prs[0]['attributes']) != {'POSITION', 'NORMAL', 'TEXCOORD_0'}:
        sys.exit('only one primitive with POSITION, NORMAL, TEXCOORD_0 is supported: ' + src)
    pr = prs[0]
    a = pr['attributes']
    P, N, UV = accessor(j, data, a['POSITION']), accessor(j, data, a['NORMAL']), accessor(j, data, a['TEXCOORD_0'])
    T = accessor(j, data, pr['indices']).reshape(-1, 3)
    used, nt = simplify(P, N, UV, T, ratio)
    write_glb(j, dst, pr, P[used], N[used], UV[used], nt)
    print(Path(src).name, len(T), '->', len(nt), 'tris', len(P), '->', len(used), 'verts')


main()
