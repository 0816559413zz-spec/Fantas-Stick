# Character animation rules (user 2026-11-24)

Read this before making or changing any cast pose, skill motion or movement pose. The user wants these applied
**without being asked**. Good-looking settings get logged at the bottom so later work can copy them.

## 1. Bend the body like a person

- **Crouch with the knees.** Thighs forward + knees bent, then only a small body drop. Do not lower the whole
  body with straight legs (the feet sink into the floor and it looks like sliding down).
- **Bend the free elbow.** Arms are not straight sticks unless the move is a full reach. The wand (right) hand follows
  the code arm, so bend only the free (left) elbow on the bone.
- **Torso leans a little** into a low move (forward when reaching down, back on a big upward yank). Small angles:
  the cast system multiplies them (`AMP_S` in `js/35-sync.js`), so a lean of 0.25 already reads as a clear bend.
- **Head and chest** face the cursor unless the move says otherwise. If the body turns side-on, turn the head back.
- Check every pose **from the side with the cloak hidden** (the robe hides the legs), then from the game camera.

## 2. Timing (the user's top priority)

A strong move has beats. Use them by default:

1. **Anticipation** — a slow wind-up the other way (smoothstep `'s'`).
2. **Strike** — accelerates into the contact (ease-in `'i'`), ends on the impact frame.
3. **Hold / delay** — a short pause with tension (tremble window `tm`), often while the VFX travels.
4. **Release** — explosive, with a little overshoot (`'o'`).
5. **Settle** — ease back to rest.

Put FX on the beats: impact FX on the strike frame, travelling FX during the hold (ease-in so it starts slow and
rips to the target), the big result on the release.

## 3. Where it lives in code

- Cast poses: `CANIM` in `js/35-sync.js`. Key = `[u, armR.x, armR.z, body twist, body lean(+fwd), armL.x, armL.z,
  body roll, body y, ease]`, `u` = 0..1 of `d` seconds. Eases: `'s'` smooth, `'i'` accelerate, `'o'` overshoot.
- Joints: optional `j:[[u, kneeR, kneeL, elbowL, thighR, thighL, spreadR, spreadL], ...]` on a CANIM entry (smoothstep
  between keys). Thigh pitch negative = forward. Knees → `dpKnees` (js/72), left elbow → `caElbowL` (js/35).
- **Every cast pose gets joints automatically** when it has no `j`: knee bend from the pose's body drop + lean, left
  elbow from arm height (0.45 overhead / 0.6 forward / 0.85 low), thigh ≈ half the knee bend (foot stays planted) with a
  small stagger (right foot forward) and spread. Poses with an authored `SKFEET` keep their thighs, still get knees/elbow.
- Stand **staggered and a bit wide**, not feet parallel (user 2026-11-24).
- Skill → pose name: `SKANIM` in `js/35-sync.js`.
- **Always-on arm/leg layer** (render loop after `rigSync`, js/35-sync.js): elbows rest bent (left 0.45, right 0.35;
  less while walking because the walk/run clip already bends them); right elbow bends the `forearm_R` bone and carries
  the wand around the elbow pivot (`caElbowR`), so the wand stays in the hand. Standing still: right foot ~0.14 forward,
  left a little back, feet slightly apart, soft knees (0.14 / 0.10). Walk/run clips already flex knees — don't add more.

## 4. Settings that worked (log)

- **Earth Rampart cast `rampcast`** (2026-11-24, user chose "slap the ground then lift"): d 0.9 s. Wind-up 0–0.12 s
  (left hand raised, knees 0.45), slam at 0.18 s with ease `'i'` (knees 1.15, thighs −0.6, lean 0.24, body y −0.12),
  hold with tremble to 0.4 s, yank with `'o'` at 0.48 s (both arms up, knees straighten), settle.
  v2: left elbow 1.5 on the wind-up / 0.75 on the slam, stance right foot forward (thigh −0.9) left back, spread ±0.22. Gold line from the
  palm to the wall uses ease-in (slow then fast). Wall rises at 0.4 s.
- **Earth Terra Isle Stand** (2026-11-24, user: one hand, bend over, plunge, pull): `standPose({one,lean,cock,reach})` js/47 — lean 0→0.6 + cock over 0.2 s, plunge with cubic ease-in to 0.5 s (lean 1, body twist 0.22, left hand braced on the knee), strain/tremble to 0.8 s, pull with overshoot 0.35 s (elbow bends as it pulls, body straightens a little past upright). Stand beside the spot so the player sees it in profile.
- **Earth Terra Isle cast `islecast`** (2026-11-24): d 0.9 s. Wand pulled back low + knees 0.5 (0.1 s) → thrust at the spot, ease `'i'`, lands at 0.15 s with the ground crack (gold streak from the caster rides an ease-in, arriving with the crack) → hold pointed, left palm low, knees 0.85, tremble `tm` → both hands scoop up with `'o'` as the isle emerges at 0.5 s, knees straighten → settle. Defined in js/47 (`CANIM.islecast`).
  v2 side-on: body twist key 0.8 (×1.6 AMP ≈ 1.28 rad) with the right arm out to the side (`armR.x` −0.2, `armR.z` −1.18) so it points forward; head turned back to the target via `frostSlideHead` with `o.slHead = −cpb[2]×0.9` (use the smoothed pose value `o.cpb`, `o.b.rotation.y` is reset earlier in the frame).
