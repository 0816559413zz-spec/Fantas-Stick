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
- Joints: optional `j:[[u, kneeR, kneeL, elbowL, thighR, thighL], ...]` on a CANIM entry (smoothstep between keys).
  Thigh pitch negative = forward. Knees → `dpKnees` (js/72), left elbow → `caElbowL` (js/35).
- Skill → pose name: `SKANIM` in `js/35-sync.js`.

## 4. Settings that worked (log)

- **Earth Rampart cast `rampcast`** (2026-11-24, user chose "slap the ground then lift"): d 0.9 s. Wind-up 0–0.12 s
  (left hand raised, knees 0.45), slam at 0.18 s with ease `'i'` (knees 1.15, thighs −0.6, lean 0.24, body y −0.12),
  hold with tremble to 0.4 s, yank with `'o'` at 0.48 s (both arms up, knees straighten), settle. Gold line from the
  palm to the wall uses ease-in (slow then fast). Wall rises at 0.4 s.
