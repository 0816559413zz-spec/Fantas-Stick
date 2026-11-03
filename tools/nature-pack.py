"""Pack Nature preview frames (shots/nat_<sk>_fNNN.jpg from tools/nature-preview.js) into shots/nat_<sk>.gif.

python tools/nature-pack.py            -> every skill that has frames
python tools/nature-pack.py whip root  -> only these
"""
import sys
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / 'shots'
SKILLS = ['whip', 'dash', 'shield', 'turret', 'lotus', 'move', 'ball', 'root', 'ult']


def pack(sk, width=600, fps=20):
    if sk in ('whip', 'dash'):
        fps = 30  # previews render at 30 fps for the fast action
    files = sorted(f for f in SHOTS.glob(f'nat_{sk}_f*.jpg') if re.fullmatch(rf'nat_{re.escape(sk)}_f\d{{3}}\.jpg', f.name))
    if not files:
        print('no frames for', sk)
        return
    frames = []
    for f in files:
        im = Image.open(f).convert('RGB')
        h = round(im.height * width / im.width)
        frames.append(im.resize((width, h), Image.Resampling.LANCZOS))
    pal = [fr.quantize(colors=192, method=Image.Quantize.MEDIANCUT) for fr in frames]
    out = SHOTS / f'nat_{sk}.gif'
    pal[0].save(out, save_all=True, append_images=pal[1:], duration=round(1000 / fps), loop=0, optimize=True, disposal=1)
    print(out.relative_to(ROOT), len(frames), 'frames', round(out.stat().st_size / 1024), 'KB')


for sk in (sys.argv[1:] or SKILLS):
    pack(sk)
