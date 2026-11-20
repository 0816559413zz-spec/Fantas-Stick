# Ink texture for the Darkness ult jaw/tail: pure black strands, a few mid-black streaks,
# translucent gaps, torn spiky edges at top/bottom. Tiles along x (flow direction).
# Run: python assets/src/darkness_ult_ink.py  -> assets/fx/tex/dark_jaw_ink.png
import numpy as np
from PIL import Image

W = H = 512
x = np.linspace(0, 1, W, endpoint=False)[None, :]
y = np.linspace(0, 1, H)[:, None]
TAU = 2 * np.pi
rng = np.random.default_rng(7)

def wave(n, amp, ph):
    return amp * np.sin(TAU * n * x + ph)

# strand coordinate across the band, wavy along x (integer freqs keep it tileable)
s = y * 14 + wave(1, .35, .4) + wave(3, .12, 1.7) + wave(5, .05, 2.9)
band = 0.5 + 0.5 * np.sin(TAU * s)
fine = 0.5 + 0.5 * np.sin(TAU * (y * 41 + wave(2, .5, .8) + wave(7, .08, .2)))
streak = (0.5 + 0.5 * np.sin(TAU * (2 * x + y * 3 + wave(1, .3, 2.2)))) ** 6   # rare mid-black streaks

value = 0.002 + 0.006 * band * fine + 0.045 * streak * band     # max ~0.05 = mid black, never grey
alpha = 1.0 - 0.40 * ((1 - band) ** 6) * np.clip(np.sin(TAU * (3 * x + y * 5 + 1.1)), 0, 1)  # few translucent gaps

# torn edges: backward-pointing spikes, tileable (8 and 11 teeth across x)
def spikes(n, ph, depth):
    saw = (n * x + ph) % 1.0
    return depth * (1 - saw) ** 1.6
top = 0.02 + spikes(8, .13, .10) + spikes(11, .57, .04) + wave(2, .015, .3)
bot = 0.02 + spikes(9, .71, .10) + spikes(13, .29, .04) + wave(3, .015, 1.9)
edge = np.clip((y - top) / .015, 0, 1) * np.clip(((1 - y) - bot) / .015, 0, 1)
alpha = np.clip(alpha * edge, 0, 1)

v8 = np.clip(value * 255, 0, 255).astype(np.uint8)
img = np.dstack([v8, v8, v8, (alpha * 255).astype(np.uint8)])
Image.fromarray(img, 'RGBA').save('assets/fx/tex/dark_jaw_ink.png')
print('ok', img.shape)
