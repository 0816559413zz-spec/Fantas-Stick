# Contact sheet from capture frames (shots/motion_<tag>_NNN.jpg), for a quick look before packing a GIF.
#   python tools/motion-sheet.py storm_dash [--every 3] [--cols 6] [--from 0] [--to 999]  -> shots/sheet_<tag>.jpg
import glob, sys, os
from PIL import Image
a = sys.argv[1:]; tag = a[0]
opt = lambda k, d: int(a[a.index(k) + 1]) if k in a else d
ev, cols, f0, f1 = opt('--every', 3), opt('--cols', 6), opt('--from', 0), opt('--to', 9999)
fs = sorted(glob.glob(os.path.join('shots', 'motion_%s_[0-9]*.jpg' % tag)))[f0:f1 + 1][::ev]
ims = [Image.open(f).convert('RGB') for f in fs]
if not ims: sys.exit('no frames for ' + tag)
w, h = ims[0].size; rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (w * cols, h * rows), (16, 16, 16))
for i, im in enumerate(ims): S.paste(im, ((i % cols) * w, (i // cols) * h))
S.save(os.path.join('shots', 'sheet_%s.jpg' % tag), quality=86); print(len(ims), 'frames ->', 'shots/sheet_%s.jpg' % tag)
