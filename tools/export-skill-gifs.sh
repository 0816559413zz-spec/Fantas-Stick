#!/bin/sh
# Export one Studio GIF per skill listed in designs/skill_gifs/map.json → designs/skill_gifs/<path>_<skill>.gif
cd "$(dirname "$0")/.."
python -X utf8 -c "import json;m=json.load(open('designs/skill_gifs/map.json',encoding='utf8'));[print(p,k,f) for p,v in m.items() for k,f in v.items() if f]" | while read p k f; do
  out=designs/skill_gifs/${p}_${k}.gif
  [ -f "$out" ] && continue
  if node tools/headless.js --fx "$f" --gif "sk_${p}_${k}" --fps 12 --gif-width 400 --max-len 4.5 --timeout 240 --quiet > "shots/sk_${p}_${k}.log" 2>&1; then
    mv "shots/sk_${p}_${k}.gif" "$out"; mv "shots/sk_${p}_${k}.png" "designs/skill_gifs/${p}_${k}.png"; echo "ok $p $k $f"
  else echo "FAIL $p $k $f: $(tail -1 shots/sk_${p}_${k}.log)"; fi
done
echo DONE
