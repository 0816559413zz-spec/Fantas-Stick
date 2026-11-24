# Character animation rules (user 2026-11-24)

Read this before making or changing any cast pose, skill motion or movement pose. The user wants these applied
**without being asked**. Good-looking settings get logged at the bottom so later work can copy them.

## 1. Bend the body like a person

- **Crouch with the knees.** Thighs forward + knees bent, then only a small body drop. Do not lower the whole
  body with straight legs (the feet sink into the floor and it looks like sliding down).
- **Bend both elbows.** Keep the joints visible through the motion. The right elbow layer rotates the wand and its tip
  with the forearm so the grip stays attached.
- **Torso leans a little** into a low move (forward when reaching down, back on a big upward yank). Small angles:
  the cast system multiplies them (`AMP_S` in `js/35-sync.js`), so a lean of 0.25 already reads as a clear bend.
- **Head** follows aim while the torso keeps the stance or the authored skill twist.
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
- **Shared ready stance** (`readyStance` in `js/35-sync.js`): torso at 40° with the right shoulder and foot leading,
  left foot back, and soft knees. Keep the right elbow low with the wand grip near the chin. The free arm follows
  breathing at rest and swings gently with the stride. A forward run lean keeps the wand up.
- **Transitions**: use ready as the base for the jump balance and landing layers. Shared basic and skill poses
  blend out of and back into that base over their existing wind-up and follow-through. Airborne casts keep the
  leg animation while the skill steers the upper body. Class-specific pose writers keep priority.
- **Nature**: face 45° right, with the left elbow forward and slightly raised and the hand folded diagonally below the chest and the right hand holding the
  wand low and slightly away from the thigh. The free hand drops just above the hip while running. Blend from
  the bind forearm orientation for the run bend. On basic whip, turn toward center for the leftward sweep and
  back to 45° for the rightward sweep. Let the free elbow stay bent while the arm follows the turn, and open the
  wand arm outward on the rightward follow-through. Give the head a small delayed turn and recoil. Let the wand
  lead along the swing arc and match the first vine segment to the equipped wand’s actual tip and direction.
- **Nature hands**: use the left hand for seeds, walls, plant relocation and World Tree. Use the right wand
  for Wood Ball and the whip. Faceted vines cinch the left sleeve and grade from bark brown at the shoulder through moss at the elbow to green at the wrist. Two tapered strands start together at the shoulder and divide into the upper wrap. Keep the thorns short and away from the shoulder start. They carry one small flower on a stem.
  The green orb follows the center of the palm with visible lag through movement and casts.
- The local head follows yaw and camera pitch. Other characters use shared yaw.

## 4. Settings that worked (log)

- **Earth Rampart cast `rampcast`** (2026-11-24, user chose "slap the ground then lift"): d 0.9 s. Wind-up 0–0.12 s
  (left hand raised, knees 0.45), slam at 0.18 s with ease `'i'` (knees 1.15, thighs −0.6, lean 0.24, body y −0.12),
  hold with tremble to 0.4 s, yank with `'o'` at 0.48 s (both arms up, knees straighten), settle.
  v2: left elbow 1.5 on the wind-up / 0.75 on the slam, stance right foot forward (thigh −0.9) left back, spread ±0.22. Gold line from the
  palm to the wall uses ease-in (slow then fast). Wall rises at 0.4 s.
- **Earth Terra Isle Stand** (2026-11-24, user: one hand, bend over, plunge, pull): `standPose({one,lean,cock,reach})` js/47 — lean 0→0.6 + cock over 0.2 s, plunge with cubic ease-in to 0.5 s (lean 1, body twist 0.22, left hand braced on the knee), strain/tremble to 0.8 s, pull with overshoot 0.35 s (elbow bends as it pulls, body straightens a little past upright). Stand beside the spot so the player sees it in profile.
- **Earth Terra Isle cast `islecast`** (2026-11-24): d 0.9 s. Wand pulled back low + knees 0.5 (0.1 s) → thrust at the spot, ease `'i'`, lands at 0.15 s with the ground crack (gold streak from the caster rides an ease-in, arriving with the crack) → hold pointed, left palm low, knees 0.85, tremble `tm` → both hands scoop up with `'o'` as the isle emerges at 0.5 s, knees straighten → settle. Defined in js/47 (`CANIM.islecast`).
  v2 side-on: body twist key 0.8 (×1.6 AMP ≈ 1.28 rad) with the right arm out to the side (`armR.x` −0.2, `armR.z` −1.18) so it points forward; head turned back to the target via `frostSlideHead` with `o.slHead = −cpb[2]×0.9` (use the smoothed pose value `o.cpb`, `o.b.rotation.y` is reset earlier in the frame).
  v3 (2026-11-24, user: the wall came up too soon after the slam): `rampcast.d` 1.4 s (override in js/47) → slam 0.28 s, hold + gold line 0.3→0.72 s, wall at `lift` 0.75 s. Lesson: leave ~0.4 s of visible hold between the impact and the result.
