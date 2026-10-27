# Cartoon smoke flipbook for the battlefield style test (designs/battlefield.md ขั้น 0)
# assets/fx/tex/smoke_toon.png (6x6 frames, over the particle's life): a puff made of round blobs with a hard edge,
# 3 flat tones (light top-left, mid, shadow bottom-right) — grows, then erodes into holes and shrinks away.
# Grey-scale so the fx layer's col/c2 tints it. Needs numpy + Pillow. Run: python tools/bf-tex-gen.py
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'tex')
PX, COLS, ROWS = 128, 6, 6


def noise(rng, n, px):
    a = Image.fromarray((rng.random((n, n)) * 255).astype(np.uint8)).resize((px, px), Image.BICUBIC)
    return np.asarray(a, np.float32) / 255.0


def puff_sheet(name, seed, blobs, desc):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:PX, 0:PX].astype(np.float32)
    x = x / PX - 0.5
    y = y / PX - 0.5
    C = [(rng.uniform(-0.2, 0.2), rng.uniform(-0.12, 0.17), rng.uniform(0.11, 0.19)) for _ in range(blobs)]
    C[0] = (0.0, 0.0, 0.22)
    nz = 0.6 * noise(rng, 6, PX) + 0.4 * noise(rng, 14, PX)

    def sdf(px_, py_, s):
        d = np.full(px_.shape, -9.0, np.float32)
        for cx, cy, r in C:
            d = np.maximum(d, r * s - np.hypot(px_ - cx * s, py_ - cy * s))
        return d

    sheet = Image.new('RGBA', (PX * COLS, PX * ROWS))
    N = COLS * ROWS
    for i in range(N):
        t = i / (N - 1)
        s = 0.62 + 0.5 * (1 - (1 - min(1, t / 0.35)) ** 2)        # grow fast, then hold
        ero = max(0.0, t - 0.35) / 0.65                               # erode in the second part
        off = 0.12 * s
        base = sdf(x, y, s)
        cut = ero ** 1.3 * 0.22 + (nz - 0.5) * 0.09 * (0.3 + ero)
        d = base - cut
        a = np.clip(d * PX / 1.6 + 0.5, 0, 1)                         # hard edge, ~1.5 px anti-alias
        shadow = (sdf(x + off * 0.45, y + off, s) - cut) <= 0         # near the bottom(-right) edge
        light = (sdf(x - off * 0.12, y - off * 0.22, s) - cut) <= 0   # near the top(-left) edge
        v = np.full(a.shape, 0.86, np.float32)
        v[shadow] = 0.58
        v[light & ~shadow] = 1.0
        rgb = (v * 255).astype(np.uint8)
        img = np.dstack([rgb, rgb, rgb, (a * 255).astype(np.uint8)])
        sheet.paste(Image.fromarray(img, 'RGBA'), ((i % COLS) * PX, (i // COLS) * PX))
    sheet.save(os.path.join(ROOT, name + '.png'), optimize=True)
    meta = {"v": 1, "desc": desc, "gen": "image", "seed": seed, "px": PX, "cols": COLS, "rows": ROWS, "kind": "life", "fps": 24,
            "ramp": "white", "add": False, "rot": 0, "p": {}}
    with open(os.path.join(ROOT, name + '.tex.json'), 'w', encoding='utf8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    print('wrote', name)


puff_sheet('smoke_toon', 11, 9, 'ควันการ์ตูน: ก้อนกลมขอบคม 3 เฉด (สว่างซ้ายบน/เงาขวาล่าง) โตแล้วแหว่งเป็นรูจนหาย (ตามอายุเม็ด) • สีเทา ให้ col ย้อมสี — designs/battlefield.md')
