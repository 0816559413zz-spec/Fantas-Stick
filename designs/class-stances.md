# Class stances + class identity VFX (user 2026-11-24)

User: give **Darkness, Frost, Water, Fire** their own stance (idle / run) like Nature, plus small always-on
VFX that tell which class a player is (Nature reference: thorn wrap + wrist blossom + palm orb, `HANDOFF.md`).
User also asked Claude to **design with its own judgment** and offer **2 clearly different styles per class** to choose from.

## User's words (source of truth)
- **Fire:** option 1 (aggressive: low crouch leaning forward, open left palm with a small flame) + the whole left arm burning.
- **Frost:** wand in the **LEFT** hand (all other classes: right). Right hand open, spread out and down ~60° from the top;
  the floating sword sits on the right side by the empty hand. Left arm up to the upper chest, forearm horizontal, elbow
  pointing forward, forearm slightly in toward the body but still away from it, hand up to the chin tip, wand turned toward self.
- **Water:** same pose as now (shared ready) — add option 2 (water orb on the palm) + a few small drops at the cloak hem.
- **Darkness:** body leans down a bit, legs straight and spread; left hand low on a diagonal; right hand behind and slightly
  down, diagonal, spread out; head looks forward-down (not up); breathing all the time, body rising and falling.

## Code
- Values: `STANCES` in `js/35-sync.js` (per class `a`/`b`; field legend in the comment above it). `classStance()` applies
  them inside `readyStance`; the waist bend uses the `spine` + `chest` bones (`stanceSpine`), so legs stay straight and the
  head stays level. Head pitch: `o.stHead` added in `readyHeadPose` (`HEAD_DOWN` sign measured: +1 = down).
- Frost left-hand wand: `stanceWand` moves `wand_*` meshes from `hand_R` to `hand_L` (same local offset, the bones mirror)
  and the glow `o.tip` to `armL`; `stanceWandTip` aims the wand along `wandDir` [forward, right, up] (body frame) and puts the
  glow on the real tip. Casts still animate the right arm (to do after the user picks a style).
- Class looks: `stanceFX` → mesh/sprite pieces driven by time (not `PARTS`, which VFX Studio clears on every seek), group `o.stLk` under `o.g`.
  Note: `material.clone()` lost the look on these sprites — use `stMatNew(k)` for per-piece opacity.
- Preview: `studio/class-stance.js` (FXCODE `studio_class_stance`, drives the real studio player: kit, idle, run 2.4–4.0 s) +
  `assets/fx/stance/<cls>_<a|b>.fx.json`. Studio camera `cam=left` added (other side). GIFs:
  `node tools/headless.js --fx stance/darkness_a --cam front --dist 2.8 --at self --gif <name> --from 0 --to 5.6 --fps 15`.
- Measuring helper used: hand/elbow/wand positions relative to the chest in body frame (head-forward-of-hips for lean).

## Styles offered (2026-11-24)
| Class | A | B |
|---|---|---|
| Darkness | **Reaper** — square to the front, bent at the waist, head down, wand arm trailing behind-out-down, left hand low in front dripping black ink, slow deep breath | **Stalker** — side-on with the LEFT shoulder leading, left hand reaching toward the target, wand hand trailing low behind, weight on the back leg, head tilted, slow sway, black mist creeping at the feet |
| Frost | **Duelist** — upright and proud, chin up a little, wand across under the chin pointing to the right shoulder, right hand open 60° out, frost breath puffs on each exhale + drifting ice glints | **Guard** — low fencing crouch, left foot forward, wand pointing down along the chest, right hand lower, frost-crystal decal under the feet + ice shards circling the left forearm |
| Fire | **Brawler** — low crouch, boxer bounce, left arm forward with an open burning palm, whole left arm in flames, wand cocked at the hip | **Torchbearer** — upright and confident, left arm raised out to the side with the forearm up like a torch, a tall flame column from the fist, whole arm burning, embers rising |
| Water | **Palm orb** — shared pose, a wobbling water orb floating in front of the left palm, drops falling from the cloak hem with small ripples | **Wrist ring** — shared pose, seven water droplets circling the left wrist, same hem drops |

## Choices (user 2026-11-24)
- **Darkness: B Stalker** — cloak looked a bit odd → narrower legs, less sway, wand hand further out so it stops pushing the cloak.
- **Frost: B Guard** — elbow more forward, left hand further in front at chin height, wand points back-out beside the head (never into it): `lx -1.5, ly -.9, lz -.2, elL 1.3, wandDir [-.45,-.85,.1]` (measured: wand ≥0.29 m from the head centre).
- **Fire: A Brawler** — less fire on the hand, the whole arm still burns but thinner.
- **Water:** neither orb style read as water. User picked: water winding round the RIGHT (wand) arm up to the wand tip (`waterArm`, style a) and the cloak hem as running water (`waterHem`, style b, uses the real cloth hem row `C.P`). Waiting for the pick.
- **Water (round 3):** user: water spirals round the LEFT arm instead, many strands turning all the time, floating outside the sleeve so they read clearly, and a clear water orb at the hand with water running round inside it → `waterSpiral` (style a): 4 strands + 2 foam lines + beads, orb (`stMat('orb')`) with 3 tilted inner water rings + foam ring; the shared pose keeps but the free arm is held a little out (`lzAdd .42`, `lxAdd -.25`) so the water shows from the front.
- **Frost B (round 3):** wand was hidden by the head from the front → body turn -48° → -28° and `wandDir [-.3,-.9,.35]` (tip out to the left side beside the head, measured ≥0.32 m from the head centre).

## Cast animation round (2026-11-24 night, approved 2026-11-25)
User asked (before sleeping): body twist with the other arm countering, natural, on every skill of every class (classes that already have their own authored poses are skipped); Frost wand-mode animation; Fire Kindle + charge with the burning hand.
- **Counter-twist (all classes, js/35 `counterArm`, `CTWIST`):** in `castPose0` (basic attacks) and `skillPose` (CANIM skills) the free (left) arm gets `+CTWIST.x*dTw` pitch and `+CTWIST.z*dTw` spread, dTw = torso twist away from where the cast began — wind-up (right shoulder back) the free arm reaches forward/across, strike (right shoulder forward) it pulls back/out. Skipped: two-hand poses, Nature (`nat*`, authored), Fire style 7 (authored).
- **Frost casts mirrored (`poseMirror`):** every right-handed cast/skill/melee pose is mirrored across the body when the wand is in the left hand (`o.wandL`): arms swap, twist/roll/side-shift flip, legs swap, knee/elbow layers swap. Frost melee poses flag `o.fPose` (js/34) so they mirror too.
- **Frost mode swap (js/34 `o.fwSw`, `FW_SWAP` 1 s):** sword → wand: the sword pinwheels faster and faster around its blade centre, shrinks and rises, breaking into ice sparkles; wand → sword plays it backwards. Wand mode stance = `STANCES.frostWand` (body turned left, wand hand out to the side a little behind, away from the body).
- **Fire (js/33):** `o.pyHand` (Fire with the Brawler burning arm) → charge (`p.cg`) loads the burning LEFT hand out to the side and back, body twisted, wand arm forward as a counter; the fireball sits in front of the left palm (`pyFire`); release + Kindle shots use cast style 7 (whip the left hand forward across with the twist, wand arm swings back). Kindle hover aim (`KINDLE_AIM`): side-on, burning hand aims, wand arm back.
- **VFX Studio previews:** `studio/class-stance.js` now replays real gameplay in seeks/GIF export (it steps the host + snapshot + `syncPlayers` per studio step — the studio skipped both while seeking) and takes `acts` [{t, a:fire|hold|skill|ult|swap|dash, id, d}], `fmode`. New fx: `stance/frost_swap`, `frost_skills`, `pyro_charge`, `pyro_kindle`, `counter_storm`, `counter_water`, `counter_earth`. Studio camera `?lookh=<m>` raises the target (airborne).

## Round 2 of the cast animations (user 2026-11-25)
- **Frost swap, 3 beats** (user): sword → wand = (1) still in the sword pose, (2) right hand comes forward, the sword follows the palm spinning, flick out to the RIGHT and the sword breaks up at the flick, (3) settle into the wand stance. Wand → sword = right hand raised all the way up, the sword comes out spinning FLAT above the hand with ice particles, the spin slows, the hand lowers into the sword stance. User answers: walk allowed but no attacks during the swap (A), raise fully, flick to the right.
  Code: `FSW` timings + arm targets (js/34), `frostSwapPose` (arms/body, crossfades the stance change in beat 3), `frostSwapLate` (sword on the palm), host `FROST_SWAP_T` / `p.fswT` (js/03, js/11). On the return the body turns back to almost square so the right arm can go up (wand stance is left-shoulder-leading).
- **Fire arm** (user: "more fire, don't make it lag"): flame tongues born on the sleeve rise and thin out (`FIRE_TONGUES` = 9 small fire-shader meshes, no extra particles); blobs a bit bigger and less white.
- **Kindle** (user: leg looked weird): with the fire-hand aim the folded/shrunk kick leg is gone; legs hang loose (`KINDLE_AIM.l0/l1`).
- **Round 3 (user 2026-11-25):** Frost animations must follow the wand arm -> while casting the left-hand wand blends from the stance direction to point on along the forearm (`o.wCastK`, `stanceWandTip`), so it no longer points back behind the head in cast poses; wand-mode stance wand points forward, less diagonal (`frostWand.wandDir [.85,-.18,-.3]`). Fire: the whole arm under fire again (10 bigger blobs hide the sleeve) but the flames are short. Preview `stance/frost_wand_all` (wand basics, Glacier Rend, Frostforge, Permafrost, Frost Aura, Mirror Legion).
