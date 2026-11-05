"""Generate an editable first-pass Nature root-tree model for Studio."""
import json
import math
from pathlib import Path

parts = [{"id": "trunk", "k": "tube", "path": [[0, 0, 0], [.1, 1.2, 0], [-.15, 2.9, .08], [0, 4.7, 0], [.2, 6.1, 0]], "r0": .75, "r1": .23, "sides": 10, "seg": 32}]
for i in range(7):
    a = i * math.tau / 7
    x, z = math.cos(a), math.sin(a)
    parts.append({"id": f"root_{i}", "k": "tube", "path": [[x*.3, .65, z*.3], [x*.7, .22, z*.7], [x*1.35, .09, z*1.35], [x*2.1, .035, z*2.1]], "r0": .32, "r1": .025, "sides": 8, "seg": 20})
for i in range(9):
    a = i * math.tau / 9 + .2
    x, z = math.cos(a), math.sin(a)
    height = 3.5 + (i % 3) * .32
    reach = 2.0 + (i % 3) * .22
    parts.append({"id": f"branch_{i}", "k": "tube", "path": [[0, height, 0], [x*.7, height+.5, z*.7], [x*1.35, height+1.1, z*1.35], [x*reach, height+1.35, z*reach]], "r0": .28, "r1": .055, "sides": 7, "seg": 16})
    parts.append({"id": f"crown_{i}", "k": "sphere", "r": 1, "seg": 7, "pos": [round(x*reach,3), height+1.65, round(z*reach,3)], "scale": [1.2, .85, 1.05], "noise": .12, "seed": i+1})
parts.append({"id": "crown_top", "k": "sphere", "r": 1, "seg": 8, "pos": [0, 6.3, 0], "scale": [1.45, 1.05, 1.45], "noise": .1, "seed": 21})
out = {"v": 1, "desc": "ร่างทรงต้นไม้ใหญ่สำหรับสกิลรากยักษ์ — รอรีวิว", "mat": "solid", "pal": "nature", "tags": ["nature"], "parts": parts}
Path('assets/fx/mesh/nature_root_tree_draft.mesh.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
