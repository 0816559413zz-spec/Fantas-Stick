# One command: record a VFX Studio fx as GIF (headless, with retry) and cut a contact sheet from its frames.
#   python tools/fxsheet.py darkness/rework_lift --times 0.1,0.3,0.5,0.9 [--to 2 = full GIF length] [--cam side] [--dist 11] [--lookh 1.2] [--fps 20] [--name x] [--cols 4]
# Output: shots/<name>.gif + _sheet.jpg + _s.gif (480 px, send the _s.gif in chat: big GIFs do not play there). Starts nothing else: headless.js opens its own server.
# Why: the old --url ...&sheet=&save= + --wait-shot path hangs often (3 min timeouts, names with '/' never match). This path is ~30-60 s.
import argparse, os, subprocess, sys
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
a = argparse.ArgumentParser()
a.add_argument('fx'); a.add_argument('--times', required=True)
a.add_argument('--cam', default='side'); a.add_argument('--dist', default='9'); a.add_argument('--lookh'); a.add_argument('--at', default='self', help='self (follows caster) | front (12 m ahead, fixed) | far')
a.add_argument('--fps', type=float, default=20); a.add_argument('--name'); a.add_argument('--cols', type=int, default=4)
a.add_argument('--to', type=float, help='GIF end time (default: last --times + 0.05)'); a.add_argument('--scale', type=float, default=.5); a.add_argument('--tries', type=int, default=3)
A = a.parse_args()
times = [float(x) for x in A.times.split(',')]
name = A.name or A.fx.replace('/', '_')
t0, t1 = 0, A.to or max(times) + .05
cmd = ['node', os.path.join(ROOT, 'tools', 'headless.js'), '--fx', A.fx, '--cam', A.cam, '--dist', str(A.dist), '--at', A.at,
       '--gif', name, '--from', str(t0), '--to', str(t1), '--fps', str(A.fps), '--still-at', str(times[len(times)//2]), '--quiet', '--timeout', '120']
if A.lookh: cmd += ['--lookh', str(A.lookh)]
gif = os.path.join(ROOT, 'shots', name + '.gif')
for i in range(A.tries):
    if os.path.exists(gif): os.remove(gif)
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if os.path.exists(gif): break
    err = [l for l in (r.stdout + r.stderr).splitlines() if 'rror' in l][:4]
    print(f'try {i+1} failed', *err, sep='\n  ', file=sys.stderr)
else:
    sys.exit('no gif')
g = Image.open(gif); frames = []
try:
    while True: frames.append(g.convert('RGB')); g.seek(g.tell() + 1)
except EOFError: pass
w, h = frames[0].size; W, H = int(w * A.scale), int(h * A.scale)
rows = (len(times) + A.cols - 1) // A.cols
sheet = Image.new('RGB', (W * A.cols, H * rows), 'black'); d = ImageDraw.Draw(sheet)
for i, t in enumerate(times):
    f = frames[min(len(frames) - 1, round((t - t0) * A.fps))].resize((W, H))
    x, y = (i % A.cols) * W, (i // A.cols) * H; sheet.paste(f, (x, y)); d.text((x + 6, y + 4), f'{t:.2f}s', fill='yellow')
out = os.path.join(ROOT, 'shots', name + '_sheet.jpg'); sheet.save(out, quality=88)
print(os.path.relpath(out, ROOT).replace('\\', '/'))
# small looping copy for chat (big 5-7 MB GIFs do not play in the chat preview) -> send THIS one
small = [f.resize((480, int(480 * h / w))).quantize(64) for f in frames]
sg = os.path.join(ROOT, 'shots', name + '_s.gif')
small[0].save(sg, save_all=True, append_images=small[1:], duration=int(1000 / A.fps), loop=0, optimize=True)
print(os.path.relpath(sg, ROOT).replace(os.sep, '/'))
