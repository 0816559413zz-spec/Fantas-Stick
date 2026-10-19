> **แทนแบบเดิม (2026-10-19: ระบบคลังหิน + Labyrinth ult) — ผู้ใช้ส่งแบบใหม่ 2026-10-20.** แบบเดิมดูได้ใน git: `git show bf0fd59:designs/earth.md`

# 🌍 EARTH CLASS — COMPLETE DESIGN HANDOFF

**Project:** Wizard-dueling / elemental action-combat game  
**Class:** Earth — *Architect / Battlefield Chaos*  
**Source:** Entire Earth-skill design conversation with the user, through 2026-10-20  
**Purpose:** Give another AI the detailed design decisions and open questions without making up missing mechanics.  
**Design authority:** **The user decides all mechanics and numbers. Do not silently finalize, rebalance, or implement unapproved ideas.**

> **IMPORTANT STATE LABELS**  
> - **LOCKED:** User explicitly accepted/locked the design (individual tuning values may still be subject to playtesting).  
> - **CONFIRMED IN DISCUSSION:** User clearly chose or said something, but has not necessarily formally locked the whole skill.  
> - **DRAFT / PROPOSED:** In progress or being explored; not a final commitment.  
> - **OPEN:** Unknown, uncertain, or expressly postponed.
>
---

## 1. Overall class vision

- **Fantasy:** Earth is not just a ranged rock mage. Its identity is **Architect / Battlefield Chaos**: create, reshape, occupy, and exploit battlefield geometry so positioning becomes part of its offense.
- **Signature feature:** A large **humanoid stone Stand** (JoJo-inspired in function, not necessarily an exact visual copy). The Stand is the main actor in attacks and defense; the player casts/manipulates terrain, stone, and support abilities.
- **Combat loop:** Create physical obstacles → influence enemies' positioning and movement → punish collisions with terrain → make follow-up combos with other Earth skills.
- **Key tradeoff:** Losing the Stand temporarily disables or alters Stand-dependent actions.
- **User preference:** Co-design: provide design criticism, combo ideas, counterplay and references, but **let the user invent and approve skills**. When clarification is needed, **group major questions together** rather than one after another. Chat in casual Thai; a blunt/friendly tone is fine.
- **Balancing philosophy:** Don't guess final damage/range/cooldown values. Test real player-versus-player interactions, especially strong terrain CC and inescapable ultimate interactions.

### Status overview

| Ability | Name / concept | Status |
|---|---|---|
| Basic Attack | Stand-based basic; fallback small rock shots | Core concept agreed; exact attack pattern OPEN |
| Shield | Stand Barrier, frontal shield | **LOCKED** |
| Dash (Stand active) | Stand Rampage | **LOCKED** |
| Dash (Stand broken) | Rock Boost Escape | **LOCKED** |
| Skill 1 | Stonebreaker | **LOCKED** |
| Skill 2 | Mud Swamp | **LOCKED** |
| Skill 3 | Tectonic Crush | **LOCKED — user explicitly confirmed** |
| Skill 4 | Compressed rock → dust cloud (vision reduction) | **DRAFT; multiple mechanics confirmed** |
| Skill 5 | Chargeable earth drill, three charge stages | **DRAFT; multiple mechanics confirmed** |
| Ultimate | Manually place 10 pillars → optional enclosed domain → pillar-resource transformation mode | **DRAFT; direction liked, not fully locked** |

---

## 2. Basic Attack — two operating states

### Stand active — core concept
- The **Stand is the primary source of basic attacks** rather than the character simply spamming rocks.
- The ultimate transformation would **replace** this with a pillar-consuming Stand smash (see Ultimate).
- **OPEN:** Ordinary Stand basic-attack animation, exact melee range, damage, combo count/speed and any secondary effect were **not fully specified** in the available discussion. Don't invent these as locked facts.

### Stand broken — agreed fallback
- Basic attack becomes **shooting small rocks**.
- Stand-dependent offensive mechanics are limited until it returns.

---

## 3. Shield — Stand Barrier [LOCKED]

- The Stand generates and holds a **large frontal shield**, compared to Reinhardt's shield from *Overwatch*.
- **Shield HP: 300**, intended to be the **highest shield health among the classes**.
- Shield HP **regenerates slowly while the shield is not being used**. Exact regeneration delay/rate **OPEN**.
- When shield HP reaches **0**, the Stand **immediately breaks/disappears**, without a drawn-out break animation.
- The Stand remains **unavailable for 15 seconds**.
- While broken:
  - No Stand shield.
  - Basic Attack changes to small rock projectiles.
  - Stand-dependent skills become unavailable or switch to a weaker form according to each skill.
  - Dash changes into **Rock Boost Escape** rather than **Stand Rampage**.
- This is a defining **resource-risk system**; defending too much sacrifices offensive kit access.
- **OPEN:** Detailed shield hitbox shape, regeneration speed/delay, effects of Stand being restored, and whether non-shield events could break it.

---

## 4. Dash — dual form [LOCKED]

### A. Stand active — **Stand Rampage**
- Player hops onto the Stand.
- Stand **charges/runs forward**, reminiscent of The Thing's charge in *Marvel Rivals*.
- Destroys/breaks destructible constructs or constructions in its path.
- When it collides with an enemy player, it inflicts **damage, stun and knockback**.
- Player can **press Shift again** to end the charge early.
- When stopped, the Stand **slams the ground**, causing **AoE damage and stun**.
- **OPEN:** Cooldown, acceleration, maximum dash distance/duration, precise slam area and interruption rules.

### B. Stand broken — **Rock Boost Escape**
- A physical rock **rises from below the player's feet** and launches/boosts them **forward**.
- It is **not just an explosion propelling the character**: the rising rock mechanically does the boosting.
- At the launch location, the rock erupts/bursts and **knocks away nearby enemies**.
- Mostly an **escape** tool; enough height/arc to hop over enemies and low obstacles, but **not major walls**.
- **OPEN:** Distance, exact damage (if any), cooldown and trajectory.

---

## 5. Skill 1 — **Stonebreaker** [LOCKED]

### Casting and appearance
1. Player conjures a **fairly large rectangular stone slab** in front of them.
2. The Stand **punches the center of the slab**, leaving visible cracks and an almost-broken impact mark.
3. The slab flies **straight ahead** at **very high speed** over **medium range**.
4. It **does not rotate, wobble or spin** in flight.

### Hit behavior
- Hitting the **first enemy player** causes damage and **strong knockback**.
- The projectile **stops and breaks immediately** upon hitting its first player; it **does not pierce multiple players**.
- If the knocked-back player strikes **any collidable solid/blocking hitbox** — map walls, terrain, the Earth player's constructed walls, or another solid obstacle — apply **bonus damage + 2-second stun**.
- If the slab hits a blocking obstacle before reaching an enemy, it **breaks on the obstacle**.
- If it reaches maximum range without hitting anything, it **falls to the ground and crumbles naturally piece by piece**, not an explosive disappearance.
- **Unavailable while Stand is broken.**
- **OPEN:** Base damage, bonus collision damage, range, projectile speed, cooldown and exact collision thresholds (to be tuned).

### Crucial synergies
- **Tectonic Crush walls** provide a controllable surface for Stonebreaker's collision bonus/stun.
- Ultimate **physical terrain or raised mound** may provide additional collision opportunities, but specifics need implementing and testing.
- **Mud Swamp is not a solid blocking hitbox** and should not itself trigger the wall stun.

---

## 6. Skill 2 — **Mud Swamp** [LOCKED]

### Casting and effect
- Player targets the ground to place a **relatively small circular muddy area**.
- **0.5-second warning ring/telegraph** appears before it activates.
- Once active, the mud remains for **5 seconds**.
- **Enemy-only** effect; friendly players/owner are not affected.
- Enemy characters' **legs visibly sink partway into the mud**, not just a speed debuff icon.
- While in the mud, enemies suffer:
  - **50% movement-speed reduction**.
  - **All Dash and mobility skills blocked** while affected.
- **No direct damage**.
- **Still usable when the Stand is broken**, giving Earth a survival/control option during the 15-second Stand downtime.
- Bosses receive **reduced slow** and retain access to at least some mobility capabilities; exact boss exceptions **OPEN**.
- Mud is **not solid geometry** for collision-based Stonebreaker stun.

### Balance caution
- Mud Swamp placed between two Tectonic Crush walls can make escaping the crushing zone difficult. **Do not automatically nerf without playtesting**, but telegraph clarity and escape routes matter.

---

## 7. Skill 3 — **Tectonic Crush** [LOCKED]

> **Explicitly locked by user:** “Earth Skill 3: ยืนยันล็อก Tectonic Crush แล้ว.”

### Phase 1 — Construction
- The Stand **rips/lifts/extracts the ground upward**, producing **two opposite, facing stone walls** in front of the player (**front placement**).
- Walls are **stationary after being created**, until triggered for Crush or otherwise destroyed/replaced.
- Characters overlapping an **emerging wall** are **knocked back to the side**. This is not an automatic knockback of everyone standing between the walls.
- The two walls form an **open-ended corridor**: both the front and rear ends remain open for escape.
- Each wall is **breakable and has its own HP**.
- They act as **solid blocking hitboxes/cover**, usable for Stonebreaker wall collision combos.
- **Requires the Stand**; cannot initiate this skill if the Stand is broken.

### Phase 2 — Second activation: Crush
- During its eligible recast window, press the same skill again.
- The Stand performs a visible **wind-up** before the walls move; not an instantaneous unavoidable hit.
- **Both walls intact:** they slam together, inflicting **high damage** on enemies caught between them.
- **Only one wall intact:** **One-Sided Crush**; remaining wall surges from its side, dealing **reduced damage + knockback**.
- **Neither wall intact:** Crush **fails / cannot be performed**.
- **After Crush:** the wall(s) **break and disappear**.
- **If Stand breaks before the second activation:** the Crush is **canceled/unavailable**; no free Crush without Stand. Existing walls remain subject to their normal persistence/destruction/replacement rules.

### Phase 3 — Persistence and cooldown rule
- **If the user does NOT recast Crush before the skill cooldown refreshes**, they **permanently lose the option to Crush that existing pair**.
- The walls **still remain in the world** after that recast window expires; they do **not** automatically vanish when the cooldown is ready.
- They persist **until destroyed** or until the Earth player **casts a new pair**, replacing/removing the prior pair.
- Thus one skill serves both as a **timed attack trap** and as a **persistent piece of architecture**.
- HUD should distinguish when **Crush recast** is still possible vs **new wall construction** is available; this UI was a *recommendation*, not a mandated implementation.

### Synergies / considerations
- **Stonebreaker → constructed wall:** bonus damage + **2s stun** on knockback collision.
- **Mud Swamp between walls → Crush:** powerful slow + no Dash + heavy damage, but the walls have **open ends**, **breakable HP** and Crush has **wind-up**, providing counterplay.
- **Stand Rampage → construction:** the charge may break constructs, offering a way to alter the environment further; **specific friendly-wall handling needs implementation confirmation**.
- **Stand broken:** no Skill 3 or Crush, but persistent already-created walls can still remain.
- **OPEN numerical tuning:** wall HP/dimensions/separation, cooldown and recast timing, wind-up duration, full vs one-sided damage, knockback amount, friendly/enemy collision and team rules.

---

## 8. Skill 4 — Compressed Stone / Dust Cloud [DRAFT]

> This skill **WAS described in the actual conversation**. It was mistakenly omitted by an earlier assistant summary. **Do not omit it** when passing the class design to another AI.

### Visual sequence — confirmed in discussion
1. The Earth player **lifts/pulls up rock/earth**.
2. The stone forms a **rough, ugly, uneven, clumped, somewhat round mass** of assembled rocks. It is *not* a polished sphere.
3. The **Stand compresses/squeezes** the mass tighter.
4. After roughly **1 second** from the creation/compression sequence, it **bursts apart into a large billowing cloud of dust/sand**.
5. The cloud covers a **fairly large area** (exact radius unknown).

### Effect — confirmed in discussion
- Enemies **inside the cloud retain some ability to see**, but **their battlefield visibility is heavily reduced/obscured**.
- **Not a black screen**, total blindness, or absolute loss of sight. It is a **partial-vision / dust-obscuring effect**.
- Dust lasts **up to about 8 seconds**, proposed by user; final timing can be adjusted later.
- Targets are **not trapped**; they can **leave the dust area freely** at any moment.
- Combat continues: skills can still be used within the dusty area, allowing follow-up combos.
- Focus is **visual obstruction / sightline disruption**, different from Mud Swamp's movement restriction.

### Potential combos (analysis only)
- Conceal Stonebreaker launch/positioning and reduce enemy information.
- Pressure enemies toward Tectonic Crush walls or out of cover, depending on the cloud's geometry.
- Use dust as an opening for positional tricks rather than imposing another hard CC.

### OPEN — do not silently decide
- **Skill name** is not finalized (call it *Dust Cloud / Stone Compression* descriptively for now).
- Is it placed on target ground, spawned directly ahead, or centered on the player?
- Does the dust affect **enemies only, everyone, or also the Earth player**? Not definitively stated.
- Does it reduce view *distance*, overlay particles, hide player outlines, or block line-of-sight queries? No implementation spec settled.
- Damage from the burst (if any) **not defined**; don't assume it damages or definitively deals zero.
- Can it be used while the Stand is broken? Sequence explicitly features Stand squeezing the stone, so it appears Stand-reliant, **but the lockout was not confirmed**.
- Cooldown, exact dust duration, cloud radius and timing need playtesting.
- **Overall skill is not formally locked yet**.

---

## 9. Skill 5 — Charged Earth Drill [DRAFT]

### Main idea — confirmed in discussion
- Earth creates/fires a **large, extremely fast-spinning stone drill / auger** after charging it.
- Player explicitly referenced an anime/game-inspired **massive rotating earth drill**; the exact third-party character name is unclear from speech transcription. **Do not make up the reference identity**.
- The player can choose between **three charge stages**, trading charging time/risk for stronger impact and terrain effects.
- The longer the player holds the charge, the higher the released tier.
- Charging up to the final stage was **tentatively estimated around 4–5 seconds**; exact charge thresholds **not finalized**.

### Three charge levels

**Tier 1 — Quick Release**
- Fire the drill early.
- On impact: **explosion/impact damage, relatively low**.
- No confirmed persistent terrain gameplay effect at this stage.

**Tier 2 — Intermediate Charge**
- Larger/stronger impact explosion with **substantially more damage** than Tier 1.
- Ground forms a **small mound/raised-earth visual effect** as part of the impact.
- This is **mostly visual terrain**, not the reusable physical obstacle reserved for Tier 3.

**Tier 3 — Full Charge**
- Very powerful drill impact; user described it as potentially **extremely high / one-hit kill** damage (an ambition, **not a finalized balance number**).
- Creates a **real, usable raised earthen mound/terrain obstacle**, not just a visual effect.
- It can be used for **knockback collision combos**: push an enemy into the raised mound/wall to trigger **bonus collision damage**, as with Stonebreaker's collision mechanic.
- **Only the final charge stage creates the reusable gameplay terrain**. Lower-stage mounds, if shown, are VFX/visual-only.
- The user does **not** want a separate skill dedicated to creating that mound; this interaction belongs to full-charge Skill 5.

### Charging/interrupt rules — clearly confirmed
- **Hold the input** to charge; can release/cast before max charge to use a lower stage.
- The user phrased release as “click once” after holding; exact **tap/release control binding** is worth confirming during implementation, but the **hold-to-charge, release at any tier** intent is clear.
- **Knockback DOES NOT cancel charging.** Player may be pushed back and **continue charging**.
- **Stun DOES cancel charging.**
- **Freeze DOES cancel charging.**
- This was an explicit balancing decision: ordinary knockbacks are too common and would make a 4–5 second charge too easy to disrupt; stun/freeze are stronger, rarer counterplay tools (especially for Earth).
- The above CC rules are confirmed, even though **the entire Skill 5 is not formally locked**.

### OPEN
- Official skill name; drill source/appearance (Stand manipulation and spell animation specifics); trajectory/range/speed.
- Exact charge stages and charge meter UI.
- Whether charging slows walking or prevents other attacks; when cooldown starts.
- Whether charge progress resets to zero after stun/freeze (cancel strongly implies interruption, but exact behavior unconfirmed).
- Tier damage/radius, Tier 3 mound collision shape/HP/duration/replacement limits.
- Whether Skill 5 is disabled during Stand break **not explicitly confirmed**.

### Important balance note
- Combining Tier 3 enormous damage **plus** persistent geometry **plus** Stonebreaker wall-stun opportunities creates a high-power package. The user likes the big payoff and sees long charging as its built-in cost; **do not preemptively nerf without asking**. Test counterplay via stun/freeze and movement.

---

## 10. Ultimate — **Ten Stone Pillars / Domain Transformation** [DRAFT, NOT LOCKED]

### 10.1 Evolution of idea

**Initial idea from user's friend:**
- Shoot **10 earth/stone pillars** from above.
- Each pillar strikes and sinks into the ground, causing ground collapse/deformation; damage was mentioned around **30** in that early proposal.
- Intended fantasy: **chaotic, wrecked battlefield**.
- User found simply firing ten terrain strikes too **underwhelming for an Ultimate**.

**Revised direction the user likes:**
- Keep the **10 falling/placed stone pillars**, but let the pillars **remain** as finite objects/resources.
- After placement, Earth gains a **special transformed skill/basic-attack mode** consuming the pillars for enhanced attacks and different skills.
- Add a **magical barrier/domain** formed from selected pillars to keep combat in the prepared battlefield.
- This ultimate direction was discussed enthusiastically, **not formally locked in its entirety**.

### 10.2 Launch and aerial placement — confirmed in discussion
1. Activate ultimate: Earth rises **very high into the sky** (user compared the spectacle with a Susanoo-like aerial ultimate).
2. Player **personally aims and chooses where each pillar will land**; placement is **NOT automatic random scattering**.
3. Earth has **10 pillars total** to fire/place.
4. Each pillar descends from above and **sticks upright/persists** in the environment.
5. **No large explosive AoE on landing.** For damage, a pillar must **hit an enemy directly**, which is difficult since falling pillars have visible travel time and moving players can evade.
6. **Direct pillar hit:** about **20 damage + knockback**, stated in discussion (this supersedes the original friend's tentative ~30 as the current example).
7. Earth is so high during placement that attacking Earth from the ground is **difficult**, though theoretically possible; the user is **not particularly worried** about being attacked during this initial aerial setup.
8. After all **10 pillars are placed**, Earth **descends and enters a powered-up mode** with altered skills and basic attacks.

> **Important:** There was a conflicting assistant paraphrase that said remaining pillars can *only* be fired inside the domain. **The user actually said they may be placed INSIDE OR OUTSIDE the domain**, though in normal play they expect to favor inside because combatants cannot escape. Preserve the user's statement.

### 10.3 Domain creation during aerial phase — current preferred concept
- The user wants to manually **choose when to establish the arena/domain**, instead of waiting for all 10 pillars to finish.
- After placing **roughly 4 or 5 pillars** (exact minimum is **OPEN**), press a **special activation button** while still in the sky.
- The game joins the selected **existing pillars as the boundary/vertices** of an enclosed domain using a **faint, translucent yellow magical wall**.
- The wall **appears immediately when the button is pressed**, *while Earth is still airborne*. Reason: if it forms only after the full aerial sequence, enemies can see the setup and escape first.
- **All characters inside — enemies AND Earth — are trapped inside.** Currently **nobody can exit** the domain once created.
- Remaining pillars (e.g. the other 5–6) can still be manually placed **inside or outside**, but they **do not expand or create additional domain boundaries**; they are independent combat-resource pillars.
- The **domain wall remains even when its original supporting pillar is consumed/used**; it should not open individual escape holes when a boundary pillar disappears.
- The emerging concept was that the domain disappears **when all available pillar resources are consumed**. Treat this as a **current draft rule to confirm**, not a fully ratified specification; precise end conditions were not finalized.

### 10.4 Why manually designate domain pillars?
- The user worried about an automatic algorithm determining which among 10 scattered pillars are **outer-edge pillars vs interior pillars** (coding complexity and unclear topology).
- User's solution: **the pillars already placed at the time the button is pressed define the domain**. Pillars fired later are ordinary resources, not domain-defining supports.
- This also introduces a gameplay choice between the **size/shape of the enclosed fighting area**, how many pillars are invested in its boundary, and where to place later resources.
- **Do not assume** the game will compute the convex hull of all 10 or require a circular domain; those were not approved designs.
- **OPEN implementation issue:** In what order are the first 4–5 selected pillars connected to build a **non-self-crossing closed perimeter**? Possibilities include placement order and polygon sorting, but these are **engineering suggestions**, not decisions made by the user.

### 10.5 Transformed mode: 10 consumable pillars
- Pillars become a **finite resource**; using a pillar for an ultimate-mode action causes that pillar to **disappear/be consumed**.
- The **ordinary basic attacks and skills transform into a new set** in this mode.
- **Current Basic Attack idea:** The giant Stand pulls a pillar **within its usable range** and **slams it into the ground**, creating a **moderate-damage AoE**. Should not be ultra-high damage because the attack is meant to be relatively straightforward to use.
- **Original limiting mechanic:** Each pillar has a **local use radius**, which makes preplanning where pillars land strategically important.
- **Big design problem recognized by user:** The enemy can flee the useful radius of the pillars, rendering Earth's mode ineffective even though pillars remain. Creating an enclosing domain is intended to help keep fights near the resources.

### 10.6 Possible pillar-moving / collection skill — NOT APPROVED
- Idea: While walking near a pillar, collect it so it **floats beside Earth**, then **throw it back** to another spot, potentially using it there for further attacks.
- Alternative thought: pull a remote pillar immediately or use it from a distance.
- User is **not fond of this ability as currently imagined**. Moving/recalling pillars too easily creates an exploit: dump all 10 in one spot, collect/recall them, and defeat the purpose of strategic placement.
- The user **did NOT settle** whether to allow remote recall, portable pillars, or a network between pillars. Do not automatically turn these suggestions into final ultimate abilities.
- A suggestion about linked outer-wall pillars disappearing on use was **superseded by the user's preferred magical domain wall that remains even after individual pillars are consumed**.

### 10.7 Domain/counterplay analysis (not locked)
- An inescapable domain combined with Stand pillar slams and altered skills can be very powerful.
- Even if escaping the boundary is disallowed for all sides, opponents should ideally have **internal counterplay**: dodge pillar attacks, contest Earth, evade/shatter resources if permitted, use line-of-sight/terrain, or survive until the domain ends. These are **design considerations, not approved rules**.
- In team modes, a large enclosed domain could trap teammates too. Exact interaction with allies, enemies standing on its border, late arrivals, bosses, and map geometry is **OPEN**.
- Need to establish how the **final boundary formed by the first pillars** behaves with complex terrain; player/Stand spawn position; if Earth is outside the domain at activation; and what happens to any unconsumed pillars outside the wall.
- Clarify if the magical boundary begins after **at least 4**, after **at least 5**, or user-defined threshold; when the player must close it; how the HUD communicates pillar count.
- The user wants the space **kept contained**, but **has not chosen a full special-move list** for ultimate mode. Only the pillar-slam Basic Attack is substantive, and even that is a current design idea rather than formal lock.

---

## 11. Combos and systems to preserve

| Combination | Intended interaction | Status / caution |
|---|---|---|
| **Tectonic Crush walls + Stonebreaker** | Knockback target into solid wall → collision bonus damage + 2-sec stun | Both constituent skills locked |
| **Mud Swamp + Tectonic Crush** | Slow enemy 50%, disable mobility, punish with crushing walls | Powerful; wall openings, breakable walls and wind-up are important counterplay |
| **Stand Rampage + constructions** | Rampage destroys constructs while charging; can change available cover/routes | Rampage locked; friendly-wall specifics to confirm |
| **Skill 4 dust + reposition/other skills** | Reduced visibility enables concealment/ambush and continued casting | Skill 4 draft; don't invent extra hard CC |
| **Skill 5 Tier 3 mound + Stonebreaker** | Use the fully charged physical mound as a blocking hitbox for bonus collision effects | Tier 3 concept confirmed, exact collision tuning open |
| **Ultimate domain + pillar mode** | Domain keeps combat near pre-positioned finite pillars; Earth uses Stand slams and mode skills | Ultimate draft; only initial transformed basic idea specified |
| **Shield break → fallback** | 15 sec without Stand changes basic and dash; Mud Swamp remains available | Locked core interaction |

### Major balancing questions (do not pre-answer)
1. What is a reasonable amount of **escape opportunity** in Mud Swamp + Tectonic Crush, given 2-sec collision stun and mobility lock?
2. Is **Skill 5 max-charge damage** intended to one-shot standard PvP targets literally, or express a high-damage finisher fantasy?
3. Does **Skill 4 dust** obscure friends/owner as well as enemies, and how strongly does it affect visibility?
4. How do **shield breaking/Stand outage** interact with Skill 4, Skill 5 and the Ultimate?
5. If **all domain combatants cannot exit**, what inside-the-arena counters and ending conditions keep the fight fair?
6. How do the **10 finite pillars** get used effectively if players stand far from them, without making placement irrelevant?
7. Exactly how does the **recast-vs-cooldown** UI work for persistent Tectonic Crush walls?
8. How does the engine represent **persistent terrain and moving walls**, including collision, networking, performance and PvE bosses?

---

## 12. Design state — explicitly separate locked from unfinished

### Locked / user-accepted
- **Shield:** frontal Stand barrier, **300 HP**, slow regen when not used; on zero Stand disappears **15 sec**.
- **Dash:** Stand Rampage when available; Rock Boost Escape when broken.
- **Skill 1:** Stonebreaker rectangular slab, center Stand punch, fast straight shot, first-hit knockback, bonus terrain collision stun **2 sec**, disabled during Stand break.
- **Skill 2:** Mud Swamp small enemy-only 5-second area, **0.5-sec telegraph**, 50% slow, blocks Dash/mobility, no damage, usable during Stand break.
- **Skill 3:** Tectonic Crush front-facing two extractable breakable walls, lateral knockback on emergence, open ends, wind-up recast full/one-sided crush, zero walls = fail, post-crush break, permanent walls until destroyed/replaced if not recast before cooldown refresh. **Explicitly locked.**

### Discussed with explicit confirmations but NOT fully skill-locked
- **Skill 4:** Stand squeezes rough clumped round stone → big dust cloud after ~1 sec; vision is **partially obscured** (not blackout); about **8 sec**; players can move out and use skills.
- **Skill 5:** Rotating stone drill, **3 charges**; Stage 1 low damage, Stage 2 higher damage + visual small mound, Stage 3 huge damage + real collidable raised mound; tentative full charge **4–5 sec**; **knockback does not cancel**, **stun/freeze cancels**.
- **Ultimate:** manually aim **10 persistent pillars from high in the sky**; direct strike around **20 damage + knockback**, no explosive splash; can erect **instant faint-yellow domain** after approx. **4–5 pillars** while still airborne; nobody inside exits; can still place remaining pillars inside or outside; after ten placed, descend into pillar-consuming transformed mode; giant Stand's proposed Basic Attack slams one nearby pillar for modest AoE damage.

### Ideas specifically still in flux
- Skill 4 official name and exact targeting/visibility implementation.
- Skill 5 name, exact controls and values, mound lifespan and whether one-hit kill is literal.
- Domain button and geometry, pillar connection rules, domain expiration, exact inside/outside interactions.
- Skill list for transformed ultimate mode, remote-pillar retrieval and safe counterplay.
- Exact mapping to game engine / keys / cooldowns / netcode and all balance values not stated above.

---

## 13. Instructions to the next AI

1. **Use this document as the authoritative summary of the user's Earth design conversation.** Don't confuse early pitches with later decisions. In particular, **Skill 3 is locked**, while Skill 4, Skill 5 and Ultimate still need user confirmation.
2. **Do not implement anything until asked**, and never invent missing game mechanics, damage values, or interactions and mark them as confirmed.
3. If building in a repository, inspect actual engine structures and existing code first. This file documents **design intent**, not proof of implemented features.
4. Ask the user whether they want to finish **Skill 4/5**, brainstorm the **ultimate's transformed moves**, or focus on **ultimate pillar placement/domain escape rules**. **Bundle only essential outstanding questions** and prioritize the user's own ideas.
5. Speak **Thai naturally and casually** for interactive skill design. Avoid lengthy repeated confirmations of already agreed facts.
6. Where this file says **OPEN**, give 2–4 concise viable options and discuss tradeoffs rather than declaring one correct.
7. **Important correction to prior assistant summaries:** Skill 4 **was already discussed extensively** and must not be treated as unknown; remaining pillars **may be fired inside or outside the domain**; **knockback continues** Skill 5 charge, while **stun and freeze cancel** it.
8. The original ten-pillar **ground-collapse-only** ultimate was **an earlier friend's concept**. The current favored direction is **terrain resource + transformation + magical domain**, and was not yet completely locked.

---

**End of Earth Class Design Handoff.**
