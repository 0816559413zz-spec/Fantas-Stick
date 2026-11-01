# Dragon of the Deep skin round 6 (user 2026-11-01, ref designs/water_ref/dragon_ref4.png: "whole body isnt same place texture"):
# the texture is laid ONCE along the whole body (v: 0 = tail at the image top → 1 = head at the bottom, glb UVs are not flipped), not repeated:
#   tail  — deep blue, strong long stripes running along the body
#   middle — mid blue, a white curling wave crest wraps across it, foam streaks
#   head end — light cyan going pale, white foam spray / splash blotches
# Stripes run along v and wave gently; everything tiles round the body (u) so there is no seam. The head, mane and spikes have
# their UVs pinned near v = 1 in water_meshes_build.py §11, so they take the pale head colours.
#   python tools/water-tex-dragon.py  -> assets/fx/tex/water_dragon_skin.png + .tex.json
import json, os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'tex')
N = 1024; T = 2 * np.pi; rng = np.random.default_rng(6)
yy, xx = np.mgrid[0:N, 0:N].astype(float)
u = xx / N; v = yy / N                          # glb UVs: v = 0 at the image top → head (v 1) at the bottom
def unoise(freqs, amp_v=3.0):                   # noise that tiles in u (integer frequencies), smooth along v
    out = np.zeros((N, N))
    for f in freqs:
        ph = rng.random() * T; pv = rng.random() * T; fv = rng.uniform(1, amp_v)
        out += np.sin(u * T * f + ph + 1.5 * np.sin(v * T * fv + pv)) / f
    return out / sum(1 / f for f in freqs)
uw = u + .03 * np.sin(v * T * 3) + .012 * np.sin(v * T * 9 + 1)    # stripes wave gently along the body
# --- base colour along the body (tail → head)
stops = [(0, (.03, .18, .55)), (.25, (.06, .30, .74)), (.5, (.14, .50, .90)), (.72, (.30, .70, .98)), (.88, (.55, .88, 1.0)), (1, (.80, .96, 1.0))]
base = np.zeros((N, N, 3))
for (a, ca), (b, cb) in zip(stops, stops[1:]):
    m = (v >= a) & (v <= b); t = ((v - a) / (b - a))[..., None]
    base = np.where(m[..., None], np.array(ca) * (1 - t) + np.array(cb) * t, base)
# --- long stripes round the body: strong at the tail, softer towards the head
s = np.sin(uw * T * 5) * .55 + np.sin(uw * T * 9 + 1.2) * .3 + unoise([3, 7, 11]) * .35
contrast = .30 * (1 - v) + .10
col = base * (1 + contrast[..., None] * s[..., None])
# thin white streaks along the body (more towards the head)
def line(c, w):
    d = np.abs(((uw - c) + .5) % 1 - .5); return np.clip(1 - d / w, 0, 1) ** 2
streak = (line(.11, .008) + line(.37, .006) + line(.58, .01) + line(.83, .007)) * (.35 + .65 * v)
col = col + (1 - col) * np.clip(streak, 0, 1)[..., None] * .9
# --- white curling wave crest across the middle of the body (ragged edge)
ragged = unoise([4, 9, 17], 5) * .05
crest = np.clip(1 - np.abs(v - (.52 + .05 * np.sin(u * T) + ragged)) / .09, 0, 1) ** .8 * .85
crest_tail = np.clip(1 - np.abs(v - (.47 + .05 * np.sin(u * T + .6) + ragged)) / .12, 0, 1) * .35   # softer foam trailing behind it
col = col + (1 - col) * np.clip(crest + crest_tail, 0, 1)[..., None]
# --- foam spray / splash blotches towards the head
blot = unoise([5, 8, 13, 21], 8)
foam = np.clip((blot - (.55 - .6 * np.clip((v - .72) / .28, 0, 1))) * 4, 0, 1) * (v > .7)
col = col + (1 - col) * foam[..., None] * .9
img = np.dstack([np.clip(col, 0, 1), np.ones((N, N))])
Image.fromarray((img * 255).astype(np.uint8), 'RGBA').filter(ImageFilter.GaussianBlur(1.6)).save(os.path.join(ROOT, 'water_dragon_skin.png'))
json.dump({'v': 1, 'desc': 'ผิวมังกรน้ำ รอบ 6 (รูป dragon_ref4): ปูครั้งเดียวทั้งตัว — หาง น้ำเงินเข้มลายเส้นยาว • กลางตัว ฟ้า + ยอดคลื่นขาวม้วนพาด • ช่วงหัว ฟ้าอ่อนเกือบขาว + ฟองน้ำแตกกระเซ็น (v 0 = หาง บนภาพ → 1 = หัว ล่างภาพ)',
           'gen': 'image', 'seed': 6, 'px': N, 'cols': 1, 'rows': 1, 'kind': 'loop', 'fps': 24, 'ramp': 'white', 'add': False, 'p': {}},
          open(os.path.join(ROOT, 'water_dragon_skin.tex.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('tex/water_dragon_skin')
