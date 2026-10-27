"""Pack the captured Wind wing preview frames into a looping animated GIF."""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


def load_frames(folder: Path, max_width: int) -> list[Image.Image]:
    paths: dict[str, Path] = {}
    for extension in (".png", ".jpg", ".jpeg"):
        for path in folder.glob(f"frame_*{extension}"):
            paths.setdefault(path.stem, path)
    if not paths:
        raise SystemExit(f"No frame_*.png or frame_*.jpg images found in {folder}")

    frames = []
    for stem in sorted(paths):
        with Image.open(paths[stem]) as source:
            frame = source.convert("RGB")
        if frame.width > max_width:
            height = round(frame.height * max_width / frame.width)
            frame = frame.resize((max_width, height), Image.Resampling.LANCZOS)
        if frames and frame.size != frames[0].size:
            raise SystemExit(f"Frame dimensions differ: {paths[stem]}")
        frames.append(frame)
    return frames


def make_palette(frames: list[Image.Image], colors: int) -> Image.Image:
    # Sample every frame so particles and highlight colors share one palette.
    thumb_width = min(225, frames[0].width)
    thumb_height = max(1, round(frames[0].height * thumb_width / frames[0].width))
    columns = min(8, len(frames))
    rows = math.ceil(len(frames) / columns)
    sheet = Image.new("RGB", (columns * thumb_width, rows * thumb_height))
    for index, frame in enumerate(frames):
        thumb = frame.resize((thumb_width, thumb_height), Image.Resampling.LANCZOS)
        sheet.paste(thumb, ((index % columns) * thumb_width, (index // columns) * thumb_height))
    return sheet.quantize(colors=colors, method=Image.Quantize.MEDIANCUT)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=ROOT / "shots/wing-motion")
    parser.add_argument("--output", type=Path, default=ROOT / "storyboard/img/wind_wing_motion.gif")
    parser.add_argument("--fps", type=float, default=12)
    parser.add_argument("--max-width", type=int, default=900)
    parser.add_argument("--colors", type=int, default=192)
    args = parser.parse_args()
    if not 0 < args.fps <= 100 or args.max_width < 1 or not 2 <= args.colors <= 256:
        parser.error("Use 0 < fps <= 100, positive max-width, and 2 to 256 colors.")

    frames = load_frames(args.input, args.max_width)
    palette = make_palette(frames, args.colors)
    indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
    # GIF timing uses 10 ms units. Alternate delays to retain the requested fps.
    durations = [
        10 * (round((index + 1) * 100 / args.fps) - round(index * 100 / args.fps))
        for index in range(len(indexed))
    ]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    indexed[0].save(
        args.output,
        format="GIF",
        save_all=True,
        append_images=indexed[1:],
        duration=durations,
        loop=0,
        optimize=True,
        disposal=1,
    )
    print(f"Saved {args.output} ({len(indexed)} frames, {sum(durations) / 1000:.2f} s, "
          f"{args.output.stat().st_size / 1024 / 1024:.2f} MiB)")


if __name__ == "__main__":
    main()
