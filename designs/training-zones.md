# Training room zones + bot v1 (plan, 2026-10-27)

Status: **steps 1 (zones) + 2 (bot brain, `js/15-bot.js`) built 2026-10-27; steps 3–4 not yet.** User wants zones clearly separated, and bot v1 callable in the training room.

## User decisions
- Summon bot: **walk onto a pad** → menu: element, difficulty (easy/medium/hard), count 1–3 → summon.
- Arena = **real match**: 3-2-1 countdown, full HP both sides, fight until one side loses, winner banner, rematch. Bot zone = casual sparring, no rules.
- Arena modes: **me vs bot, me vs friend, team 2v2** (humans and bots mixed).
- Zone separation: **fence + gate + floor colour + big name sign**, signposts at the central spawn.

## Layout (map 7200 × 5400 px, centre = spawn hub)
```
            north: SKILL TEST
   (range lane, AOE rings, pillars, walls, dummies — gathered into one fenced area)

 west:                 CENTRE              east:
 DESTRUCTION    ←    spawn hub    →        BOT ZONE
 village (kept)    signposts to all     bot pad + monster pad (current trZone moves here)

            south: ARENA
   round ring with walls, 2 team gates (A/B), ready pads, spectator edge
```

## Defaults Claude picked (change if user disagrees)
- Bots stay inside their zone (leash) — they don't chase you into other zones.
- Bot-zone bots fight whoever summoned them + anyone inside the zone; a "clear bots" button on the pad.
- Arena: stand on team A / team B pads, empty slots can be filled with bots from the pad menu; match starts when everyone is ready.
- Arena deaths don't respawn you mid-round; after the round everyone returns to full HP inside the arena.

## Build order
1. Rearrange the training map into 5 zones (fences, gates, floor colours, signs, signposts). Move existing stations, keep them working.
2. Bot brain v1 (host side, writes `p.inp` like a real player): find target, keep range, aim + basic attack, use skills when off cooldown, ult when target is low, random dodges; difficulty = aim error + reaction delay.
3. Bot zone: summon pad + menu (element / difficulty / count / clear).
4. Arena: team pads, countdown, HP reset, win banner, rematch; 1v1 and 2v2 with humans or bots.
Each step: test on host with bots, protocol `PREFIX` bump when snapshot changes.
