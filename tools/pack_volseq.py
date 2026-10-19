# Pack a baked fire volume sequence (assets/src/fire_volseq_build.py) into one looping 3D texture file.
#   python tools/pack_volseq.py <dumpdir> <out.bin> [frames=48] [xfade=12] [scale=1] [step=1]
#   xfade 0 = one-shot (plays once) • scale < 1 shrinks the grid (smaller file) • step 2 = every 2nd sim frame (play at fps/2)
# Layout: frames side by side along X -> texture (W = nx*frames, H = ny, D = nz), uint8, x fastest then y then z (z = up).
# A .json next to the .bin holds {nx,ny,nz,frames}.
import sys, os, json
import numpy as np
d, out = sys.argv[1], sys.argv[2]
N = int(sys.argv[3]) if len(sys.argv) > 3 else 48
XF = int(sys.argv[4]) if len(sys.argv) > 4 else 12
SC = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
ST = int(sys.argv[6]) if len(sys.argv) > 6 else 1
m = json.load(open(os.path.join(d, 'seq.json')))
nx, ny, nz = m['res']; f0 = m['first']
load = lambda i: np.fromfile(os.path.join(d, 'f%04d.f32' % (f0 + i * ST)), dtype=np.float32).reshape(nz, ny, nx)
F = [load(XF + k) for k in range(N)]
for k in range(N - XF, N):          # loop: the last frames fade into the ones just before the first
    w = (k - (N - XF) + 1) / (XF + 1)
    F[k] = F[k] * (1 - w) + load(k - (N - XF)) * w
A = np.stack(F)                     # f, z, y, x
if SC < 1:                          # trilinear shrink of z, y, x
    for ax in (1, 2, 3):
        m0 = A.shape[ax]; n = max(2, round(m0 * SC)); t = np.linspace(0, m0 - 1, n); i0 = np.floor(t).astype(int); i1 = np.minimum(i0 + 1, m0 - 1)
        w = (t - i0).reshape([n if i == ax else 1 for i in range(4)])
        A = np.take(A, i0, axis=ax) * (1 - w) + np.take(A, i1, axis=ax) * w
    nz, ny, nx = A.shape[1:]
A = A / (np.percentile(A, 99.6) + 1e-9)
T = np.transpose(A, (1, 2, 0, 3)).reshape(nz, ny, N * nx)   # z, y, (f,x)
(np.clip(T, 0, 1) * 255 + 0.5).astype(np.uint8).tofile(out)
json.dump({'nx': nx, 'ny': ny, 'nz': nz, 'frames': N}, open(out[:-4] + '.json', 'w'))
print('volseq', out, T.shape, T.size, 'bytes')
