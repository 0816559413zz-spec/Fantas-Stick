"""Fallback GIF packer for tools/studio-gif.js when FFmpeg is missing.
usage: python tools/png-to-gif.py <frame dir with 00000.png...> <fps>  -> <dir>/capture.gif"""
import sys
from pathlib import Path
from PIL import Image

d, fps = Path(sys.argv[1]), int(sys.argv[2])
files = sorted(d.glob("[0-9][0-9][0-9][0-9][0-9].png"))
if not files:
    raise SystemExit("no frames in " + str(d))
frames = [Image.open(p).convert("RGB") for p in files]
w, h = frames[0].size
n = min(8, len(frames))
sample = Image.new("RGB", (w, h * n))
for i in range(n):
    sample.paste(frames[round(i * (len(frames) - 1) / max(1, n - 1))], (0, i * h))
pal = sample.quantize(colors=224)
packed = [f.quantize(palette=pal, dither=Image.Dither.FLOYDSTEINBERG) for f in frames]
dur = [10 * (round((i + 1) * 100 / fps) - round(i * 100 / fps)) for i in range(len(frames))]
packed[0].save(d / "capture.gif", save_all=True, append_images=packed[1:], duration=dur, loop=0, optimize=True)
