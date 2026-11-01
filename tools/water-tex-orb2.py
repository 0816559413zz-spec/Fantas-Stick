# Aqua Cage orb skin (user 2026-11-01, refs designs/water_ref/cage_orb_ref.jpg + ref3d_bubble_prison.webp): opaque bright blue
# water ball — deep blue → cyan, a lighter caustic network, white highlight streaks and sparkle flecks (not see-through).
#   python tools/water-tex-orb2.py  -> assets/fx/tex/water_cage_orb.png + .tex.json   (u = round the sphere, tiles; v = top → bottom)
import json, math, os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'tex')
W, H = 512, 256
rng = np.random.default_rng(21)
def vnoise(n, oct_=4):
    out = np.zeros((H, W)); amp = 1.0; tot = 0
    for o in range(oct_):
        g = n * 2 ** o; grid = rng.random((g + 1, g * 2 + 1)); grid[:, -1] = grid[:, 0]   # tiles across u
        img = Image.fromarray((grid * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
        out += np.asarray(img, float) / 255 * amp; tot += amp; amp *= .5
    return out / tot
y, x = np.mgrid[0:H, 0:W]; v = y / H
rgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float) / 255
deep, mid, light = rgb('#1554d8'), rgb('#2f9cf2'), rgb('#7fe4ff')
n1 = vnoise(3); n2 = vnoise(6, 3)
t = np.clip(.35 + (n1 - .5) * 1.1 + (1 - v) * .25, 0, 1)[..., None]
col = np.where(t < .5, deep + (mid - deep) * (t / .5), mid + (light - mid) * ((t - .5) / .5))
caus = np.abs(np.sin(n2 * 18.0)); caus = np.clip(1 - caus * 3.2, 0, 1)                    # thin bright net (caustics)
col = col + (np.array([.75, .95, 1.0]) - col) * (caus[..., None] * .55)
streak = np.clip(1 - np.abs(np.sin((x / W * 6 + v * 2.5 + n1 * 1.5) * math.pi)) * 6, 0, 1) * (v < .55)   # white highlight streaks, upper half
col = col + (1 - col) * (streak[..., None] * .5)
fl = (rng.random((H, W)) > .9975).astype(float); fl = np.asarray(Image.fromarray((fl * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.8)), float) / 255 * 3
col = np.clip(col + fl[..., None], 0, 1)
img = np.dstack([col ** 1.6, np.ones((H, W))])                                            # pre-darken a little (shader shows textures brighter)
Image.fromarray((img * 255).astype(np.uint8), 'RGBA').save(os.path.join(ROOT, 'water_cage_orb.png'))
json.dump({'v': 1, 'desc': 'ผิวลูกน้ำ Aqua Cage (รูป cage_orb_ref): ฟ้าเข้ม→ฟ้าสด ทึบ มีลายแสงใต้น้ำ เส้นไฮไลต์ขาว ประกาย — u รอบลูก (ต่อกันได้), v บน→ล่าง', 'gen': 'image', 'seed': 21, 'px': W,
           'cols': 1, 'rows': 1, 'kind': 'loop', 'fps': 24, 'ramp': 'white', 'add': False, 'p': {}}, open(os.path.join(ROOT, 'water_cage_orb.tex.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('tex/water_cage_orb')
