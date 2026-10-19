# Pack rendered frames into one flipbook atlas (VFX.md §5.1).
#   python tools/pack_flipbook.py <framedir> <prefix> <first> <out.png> <cellW> <cellH> [mode] [cols] [rows] [xfade] [keep]
#   keep = fraction of the frame height kept from the bottom (crop empty sky above short flames), default 1
#   hfade = soft fade at the left/right ends as a fraction of the width (fire-line segments overlap without seams), default 0
#   mode fire  = frames rendered on black: alpha from brightness, colour un-premultiplied (game draws it additive/premultiplied)
#   mode smoke = frames rendered with transparent film: keep alpha, colour to grey (game tints it)
#   xfade = loop crossfade length in frames (0 = one-shot sheet, e.g. a puff that plays once per particle life)
# Frames are read as <prefix>####.png starting at <first>; the atlas is filled left->right, top->bottom.
import sys, os
from PIL import Image, ImageFilter
import numpy as np

d, prefix, first, out = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
cw, ch = int(sys.argv[5]), int(sys.argv[6])
mode = sys.argv[7] if len(sys.argv) > 7 else 'fire'
cols = int(sys.argv[8]) if len(sys.argv) > 8 else 8
rows = int(sys.argv[9]) if len(sys.argv) > 9 else 8
xf = int(sys.argv[10]) if len(sys.argv) > 10 else (16 if mode == 'fire' else 0)
keep = float(sys.argv[11]) if len(sys.argv) > 11 else 1.0
hfade = float(sys.argv[12]) if len(sys.argv) > 12 else 0.0
N = cols * rows

def load(i):
    im = Image.open(os.path.join(d, '%s%04d.png' % (prefix, i))).convert('RGBA')
    if keep < 1: im = im.crop((0, int(im.height * (1 - keep)), im.width, im.height))
    im = im.resize((cw, ch), Image.LANCZOS)
    return np.asarray(im).astype(np.float32) / 255.0

# frames first .. first+N-1 ; for a loop, the last xf frames fade into the xf frames just before `first`
F = [load(first + k) for k in range(N)]
if xf:
    for k in range(N - xf, N):
        w = (k - (N - xf) + 1) / (xf + 1)
        F[k] = F[k] * (1 - w) + load(first - (N - k)) * w

# soft edge mask so nothing ever touches the cell border (no square edges in game)
yy, xx = np.mgrid[0:ch, 0:cw]
ex = np.minimum(xx, cw - 1 - xx) / 6.0
ey = np.minimum(yy, ch - 1 - yy) / 6.0
edge = np.clip(np.minimum(ex, ey), 0, 1)
if hfade > 0:
    u = np.minimum(xx, cw - 1 - xx) / (cw * hfade)
    u = np.clip(u, 0, 1)
    edge = edge * u * u * (3 - 2 * u)  # smoothstep end fade

atlas = np.zeros((rows * ch, cols * cw, 4), np.float32)
for k, f in enumerate(F):
    rgb = f[..., :3]
    if mode == 'fire':
        a = np.clip(rgb.max(axis=2) * 1.35, 0, 1)
        col = np.where(a[..., None] > 1e-3, rgb / np.maximum(a[..., None], 1e-3), 0)
        col = np.clip(col, 0, 1) ** np.array([1.0, 1.35, 2.0], np.float32)   # warmer: keeps red, pulls green/blue down (no pale cream cores)
        a = a ** 1.15
    else:
        a = f[..., 3]
        l = rgb.mean(axis=2)
        col = np.repeat(np.clip(l / max(1e-3, float(np.percentile(l[a > 0.05], 95)) if (a > 0.05).any() else 1), 0, 1)[..., None], 3, axis=2)
    a = a * edge
    r, c = divmod(k, cols)
    atlas[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw, :3] = col
    atlas[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw, 3] = a
Image.fromarray((np.clip(atlas, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA').save(out, optimize=True)
print('packed', out, atlas.shape[1], 'x', atlas.shape[0], N, 'frames')
