"""Pack real-game frames from capture-skill-motion.js with one stable palette."""
import argparse
import json
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("skills", nargs="+")
parser.add_argument("--fps", type=int, default=20)
args = parser.parse_args()
if not 1 <= args.fps <= 50:
    parser.error("--fps must be between 1 and 50")

shots = Path(__file__).resolve().parents[1] / "shots"
for skill in args.skills:
    files = sorted(shots.glob(f"motion_{skill}_[0-9][0-9][0-9].jpg"))
    if not files:
        raise SystemExit(f"No recorded frames: {skill}")
    frames = [Image.open(p).convert("RGB") for p in files]
    w, h = frames[0].size
    sample = Image.new("RGB", (w, h * 8))
    for i in range(8):
        sample.paste(frames[round(i * (len(frames) - 1) / 7)], (0, i * h))
    palette = sample.quantize(colors=192)
    packed = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in frames]
    out = shots / f"motion_{skill}.gif"
    # GIF stores durations in centiseconds. Round cumulative time to avoid drift.
    durations = [10 * (round((i + 1) * 100 / args.fps) - round(i * 100 / args.fps))
                 for i in range(len(frames))]
    packed[0].save(out, save_all=True, append_images=packed[1:], duration=durations,
                   loop=0, optimize=False, disposal=2)
    print(json.dumps({"file": str(out), "frames": len(frames), "seconds": sum(durations) / 1000}))
