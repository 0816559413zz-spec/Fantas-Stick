"""Pack real-game frames from capture-skill-motion.js with one stable palette."""
import json
import sys
from pathlib import Path
from PIL import Image

shots = Path(__file__).resolve().parents[1] / "shots"
for skill in sys.argv[1:]:
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
    packed[0].save(out, save_all=True, append_images=packed[1:], duration=50,
                   loop=0, optimize=False, disposal=2)
    print(json.dumps({"file": str(out), "frames": len(frames), "seconds": len(frames) / 20}))
