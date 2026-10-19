# Turn a Mantaflow grid dump (assets/src/fire_noise3d_build.py) into the fire detail 3D texture for fireVol.
#   python tools/pack_noise3d.py <dumpdir> assets/vfx/fire3d.bin [unused] [field=density]   (output size = half the grid, e.g. 112 -> 56^3)
# Steps: keep only the detail (field minus its blur = curls/strands), soft-clip around 0.5,
# make it seamless (crossfade the two halves of the grid), write raw uint8 bytes (x fastest, then y, then z = up).
import sys, json, os
import numpy as np

d, out = sys.argv[1], sys.argv[2]
S = int(sys.argv[3]) if len(sys.argv) > 3 else 64
field = sys.argv[4] if len(sys.argv) > 4 else 'density'
r = json.load(open(os.path.join(d, 'grid.json')))['res']
a = np.fromfile(os.path.join(d, field + '.f32'), dtype=np.float32).reshape(r[2], r[1], r[0])  # z, y, x
a = a / (np.percentile(a, 99.7) + 1e-9)

# 1) detail only: field minus its blur (curls, strands, tongues), soft-clipped; empty space -> neutral 0.5
def blur(x, k):
    for ax in range(3):
        c = np.cumsum(np.pad(x, [(k, k) if i == ax else (0, 0) for i in range(3)], mode='wrap'), axis=ax)
        sl1 = [slice(None)] * 3; sl0 = [slice(None)] * 3
        sl1[ax] = slice(2 * k, None); sl0[ax] = slice(0, -2 * k)
        x = (c[tuple(sl1)] - c[tuple(sl0)]) / (2 * k)
    return x
f = blur(a, 1)                                    # remove voxel speckle
det = f - blur(f, 6)
det = det / (np.std(det[np.abs(det) > 1e-4]) + 1e-9)
g = 0.5 + 0.5 * np.tanh(det * 0.9)

# 2) seamless at native resolution: out(x) = f(x+S)*(1-t) + f(x)*t, t = x/S, S = half the grid
#    -> out(S) == out(0), so it wraps without a seam and without repeating itself
for ax in range(3):
    n = g.shape[ax] // 2
    t = (np.arange(n) / n).reshape([n if i == ax else 1 for i in range(3)])
    lo = np.take(g, np.arange(n), axis=ax); hi = np.take(g, np.arange(n) + n, axis=ax)
    g = hi * (1 - t) + lo * t
S = g.shape[0]
g = np.clip((g - g.mean()) / (g.std() + 1e-9) * 0.2 + 0.5, 0, 1)

(g * 255 + 0.5).astype(np.uint8).tofile(out)
print('fire3d', out, S, 'bytes', S ** 3)
