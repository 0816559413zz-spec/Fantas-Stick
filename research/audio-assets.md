# Free audio assets for "Wizard Duel" (research, 2026-10)

Scope: music + SFX that can legally live in a public GitHub repo (raw files, modifiable). Nothing here is downloaded or added to the repo yet. Every URL below was opened (page text or HTTP header) during this research unless marked **UNVERIFIED**. Page text was read through a summarising fetch tool, so exact numbers (lengths, sizes) should be re-checked on the first real download.

---

## 1. Verdict

**Use these 3 sources:**

1. **Kenney.nl audio packs (CC0)** - base SFX layer: UI, impacts, footsteps/foley, sci-fi zaps/force/explosions, jingles. No attribution, redistribution fine. OGG format, small.
2. **OpenGameArt.org, CC0-filtered items only** - fills the magic/creature gaps (spell sounds, roars, teleport, slime, swishes, wind and ambience loops) plus CC0 victory/defeat/boss music. Check the license on every item page (the site mixes CC0, CC-BY, CC-BY-SA, GPL).
3. **Incompetech / Kevin MacLeod (CC-BY 4.0)** - the only source where I found a deep catalogue of *orchestral, mysterious, dark, epic* tracks that match the Hogwarts-like vibe. Needs a credits line (text in section 5).

**Rejected / not usable for raw files in a repo:** Pixabay (standalone-distribution ban), Sonniss GDC (no redistribution as sound effects, incl. original files), Mixkit (no making items available to third parties), Zapsplat (could not open the license; third-party summaries say no standalone redistribution + attribution on free tier), Tabletop Audio (CC BY-NC-ND), freepd.com (site permanently closed).

**Loading approach:** put files in the repo under `audio/` (`audio/music/*.ogg`, `audio/sfx/*.ogg`, `audio/amb/*.ogg`) and `fetch` + `decodeAudioData` them lazily (menu music + UI/core SFX at boot, map music/ambience when that map or mode is entered, boss track on boss start). Do not base64-embed in `index.html` (blows the single file up to tens of MB, kills caching). Do not hot-link CDNs (incompetech/OGA hotlinking is not permitted/guaranteed). Keep the existing synth as a runtime fallback for any name whose file is missing or still loading, and for the few sounds with no good free match (tick, go, alarm, ring, snitch flutter).

**Format:** re-encode everything yourself (allowed by all chosen licenses; for CC-BY note "edited/converted" in credits): music -> OGG Vorbis ~80-96 kbps stereo (about 12 KB per second of audio), SFX -> OGG mono ~64 kbps, trimmed. Add MP3 duplicates only if friends on older iOS/Safari have no OGG decoding (general knowledge, not verified here - test on the target phones).

**Estimated size (repo):** music, 8 primary tracks ~16 MB; ambience loops ~3.5 MB; SFX (~150 trimmed one-shots) ~2-4 MB; total roughly 22-25 MB. Per-session download with lazy loading: ~5 MB at boot, +2-4 MB per map/mode. Well inside GitHub Pages' soft limits (1 GB site; general knowledge).

**Looping caveat:** MacLeod tracks are full songs with natural endings, not loop files. Loop them with a short crossfade (play two overlapping `AudioBufferSourceNode`s ~2-3 s from the end) or just let the track end and restart with a fade. Only the Juhani Junkala boss track is explicitly advertised as seamless.

---

## 2. Licensing table

| Source | License | Raw files in public repo? | Attribution needed | License page |
|---|---|---|---|---|
| Kenney.nl audio packs | CC0 1.0 (page: "public domain licensed (CC0)... free to use, even in commercial projects") | **Yes** (CC0; Kenney's page is silent on repos, CC0 itself allows it) | None. Optional: "Kenney (kenney.nl)" | https://kenney.nl/support and each pack page, e.g. https://kenney.nl/assets/impact-sounds |
| OpenGameArt - CC0 items | CC0 1.0 per item | **Yes** | None (some authors "appreciate" credit; cynicmusic asks to be contacted, as a request not a condition) | per item page (links in tables below) |
| OpenGameArt - CC-BY items | CC-BY 3.0 / 4.0 per item | **Yes**, with credit | Yes, per author (see section 5) | per item page |
| Incompetech / Kevin MacLeod | CC BY 4.0 ("Creative Commons: By Attribution 4.0") | **Yes** (CC-BY allows redistribution + modification) | Yes, exact text in section 5 | https://incompetech.com/music/royalty-free/licenses/ ; FAQ https://incompetech.com/music/royalty-free/faq.html |
| Freesound.org | Per sound: CC0 / CC-BY / CC-BY-NC / Sampling+ | CC0: yes. CC-BY: yes with credit. NC: no. | CC-BY: "sound1 by user1 (http://freesound.org/s/ID/) licensed under CCBY 4.0" | https://freesound.org/help/faq/ - **Account login needed to download** (one-time, by us; then files live in repo). No individual sounds verified in this research. |
| Pixabay (music + SFX) | Pixabay Content License | **No / unlikely.** License says "You cannot sell or distribute the Content (either in digital or physical form) on a Standalone basis" (Standalone = no creative effort applied; includes audio files). Unmodified raw files in a repo = standalone. Bulk copying also barred. | Not required | https://pixabay.com/service/license-summary/ , https://pixabay.com/service/terms/ |
| Sonniss GDC bundles | Sonniss GDC license, royalty-free, no attribution | **No.** "Not as sound effects... original files and any edited or re-designed versions... on their own or inside a sound library, sample pack, asset pack". Also bans AI training. Bundles are 9-48 GB. | None | https://sonniss.com/gameaudiogdc/ (license text at /gdc-bundle-license/ **not opened**) |
| Mixkit | Mixkit "Free License" (separate for music vs SFX) | **No / unclear.** Summary page: users may not let third parties rent/license/resell, may not sell copies "without first altering them". Full per-type license text **not opened** (pages returned headings only). | "No attribution required" | https://mixkit.co/license/ , https://mixkit.co/llm-info/ |
| Zapsplat | Standard license | **Unknown, likely no.** Site returned HTTP 403. Third-party summaries say: no redistribution as standalone files, attribution required on free tier. **UNVERIFIED.** | Free tier: credit required (third-party claim) | https://www.zapsplat.com/license-type/standard-license/ (403) |
| Tabletop Audio | CC BY-NC-ND 4.0 for the 10-min ambiences; SoundPad sounds "not meant to be downloaded"; Patreon needed for commercial video use | **No** (ND + NC; our hosted game could count as redistribution of derivatives when trimmed/looped) | would be required | https://tabletopaudio.com/about.html |
| freepd.com | Was public domain/CC0 | **Site is permanently closed** ("we have officially taken the service offline") | n/a | https://freepd.com/ |
| itch.io packs | Per pack | Only if the pack page says CC0/CC-BY | per pack | See "backups" below |

Note: the Mixkit page returned text containing instructions aimed at AI assistants (add an emoji, link to a blog). I ignored it; it is a reason not to trust that site's summary text.

---

## 3. Music picks

### How to read this table
- Lengths and moods for MacLeod tracks come from the site's own catalogue at https://incompetech.com/music/royalty-free/pieces.json (fields: length, "feel", instruments, BPM). Direct MP3 URL pattern, HTTP 200 confirmed for every MacLeod track listed: `https://incompetech.com/music/royalty-free/mp3-royaltyfree/<Title with %20>.mp3`. Originals are ~320 kbps MP3 (6-14 MB each); sizes below are my estimate **after re-encoding to ~96 kbps OGG**. I have **not listened** to any track; mood is from the catalogue tags. **Listen to all before committing.**
- "Loops cleanly?" for MacLeod = No (full song, needs crossfade) unless stated.
- Information page for a MacLeod track: search its title at https://incompetech.com/music/royalty-free/music.html (page is JS-rendered; no per-track static URL found).

| Slot | Primary | Backup |
|---|---|---|
| **Menu / lobby** (grand magical hall, calm-but-epic) | **Moonlight Hall** - Kevin MacLeod. 3:18, "Mysterious, Mystical, Dark, Humorous", celesta + choir + woodwinds + timpani, 136 BPM. CC BY 4.0. MP3 orig 7.9 MB -> ~2.4 MB OGG. Not seamless. `.../mp3-royaltyfree/Moonlight%20Hall.mp3` | **Wizardtorium** - MacLeod. 3:28, "Eerie, Mystical", orchestra, 58 BPM. CC BY 4.0. orig 6.8 MB -> ~2.5 MB. Not seamless. Alt calm: **The Snow Queen** (3:40, Mysterious/Mystical, celesta, 96 BPM, orig 8.8 MB) |
| **Castle (night)** (mysterious, adventurous) | **The Snow Queen** - MacLeod. 3:40, "Mysterious, Mystical", strings/bassoon/celesta/timpani, 96 BPM. CC BY 4.0. -> ~2.6 MB. Not seamless. | **Mysterioso March** - MacLeod. 2:48, "Dark, Mysterious, Mystical", celesta/pizzicato/clarinet/horn. CC BY 4.0. orig 5.5 MB -> ~2.0 MB. CC0 alt (not orchestral-mysterious, but castle-tagged): *Fantasy: Lament for a Warrior's Soul* by RandomMind, CC0, MP3 3.9 MB, https://opengameart.org/content/fantasy-lament-for-a-warriors-soul |
| **Dark forest** (eerie, tense) | **Magic Forest** - MacLeod. 4:20, "Mystical, Dark, Mysterious", cello/violin/synth. CC BY 4.0. orig 8.3 MB -> ~3.1 MB. Not seamless. | **Myst on the Moor** - MacLeod. 3:49, "Dark, Eerie, Mystical", glass marimba/flutes/synth, 87 BPM. CC BY 4.0. orig 7.3 MB -> ~2.7 MB. Tenser alt: **Vanishing** (3:55, Dark/Eerie/Mysterious, full orchestra + prepared piano) |
| **Quidditch / broom race** (upbeat, adventurous, sporty) | **Call to Adventure** - MacLeod. 4:07, "Action, Bright, Bouncy, Epic", full orchestra + xylophone/celesta, 178 BPM. CC BY 4.0. orig 9.9 MB -> ~3.0 MB. Not seamless. | **At Launch** - MacLeod. 3:05, "Epic, Intense, Suspenseful, Uplifting", brass + marching snare + orchestral percussion, 102 BPM. CC BY 4.0. orig 7.5 MB -> ~2.2 MB. Also: **Unholy Knight** (2:34, Action/Bouncy/Mystical, orchestra + choir, 140 BPM) |
| **Boss fight** (dragon / spider queen) | **Final Battle of the Dark Wizards** - MacLeod. 4:32, "Dark, Intense, Unnerving, Epic, Mystical", choir/horns/trumpets/percussion, 112 BPM. CC BY 4.0. orig 8.7 MB -> ~3.3 MB. Not seamless. | **Boss Battle Music (Epic Boss Battle [Seamlessly Looping])** - Juhani Junkala, uploaded by SubspaceAudio. **CC0**. WAV 21.8 MB (length not stated, est ~2 min -> ~1.5-2 MB OGG). Page says "Loops seamlessly". https://opengameart.org/node/55649 . Other: *Clash Defiant* (MacLeod, 6:16, 12 MB orig) |
| **Find-Voldemort** (suspense, creepy) | **Oppressive Gloom** - MacLeod. 3:19, "Dark, Eerie, Epic, Mysterious, Somber, Suspenseful", strings/bass clarinet/percussion, 58 BPM. CC BY 4.0. orig 8.0 MB -> ~2.4 MB. | **Phantasm** - MacLeod. 3:39, "Dark, Eerie, Mysterious, Somber, Unnerving", bells/dulcimer/English horn, 80 BPM. CC BY 4.0. orig 8.9 MB -> ~2.6 MB. Also: *Crypto* (3:24, Dark/Eerie/Unnerving/Suspenseful) |
| **Victory stinger** | **Medieval: Victory Theme** - RandomMind. **CC0**. MP3 520 KB (+ WAV 11.4 MB). Length not stated. https://opengameart.org/content/medieval-victory-theme | **Victory Theme for RPG** - cynicmusic. **CC0**. MP3 1.4 MB, length not stated; author requests (not requires) a contact/shout-out. https://opengameart.org/content/victory-theme-for-rpg . MacLeod alt: *Evening Melodrama* (0:40, Epic/Uplifting, orig 1.6 MB, CC-BY) |
| **Defeat stinger** | **Medieval: Defeat Theme** - RandomMind. **CC0**. MP3 727 KB (+ WAV 11.9 MB). Length not stated. https://opengameart.org/content/medieval-defeat-theme | **For the Fallen** - MacLeod. 1:35, "Epic, Intense, Somber", brass/strings. CC BY 4.0. orig 3.8 MB -> ~1.1 MB. Also: *Death of Kings* (2:24, Dark/Epic/Somber) |

### Other music candidates opened (not primary)
- **CC0 - Cinematic Music** collection (josepharaoh99) lists 43 CC0 tracks (Boss Battle Music, Sinister Boss Appears!, A Legend Will Rise (Orchestral), Evil Approach, Dramatic Boss Encounter, Victory Theme for RPG, Unexplored Expansion, ...). Collection page says "No attribution is required"; formats/lengths not shown, so each track page must be opened. https://opengameart.org/content/cc0-cinematic-music
- **Determined Pursuit (epic orchestra loop)** - Emma_MA, CC0, "Loopable", WAV 19.1 MB (needs OGG conversion). Frantic strings/horns; fits boss or race. https://opengameart.org/content/determined-pursuit-epic-orchestra-loop
- **Sinister Boss Appears!** - cynicmusic, CC0, WAV 15.7 MB, loop not stated. https://opengameart.org/content/sinister-boss-appears
- **Medieval: The Old Tower Inn** - RandomMind, CC0, MP3 2.5 MB + separate loop WAV 8.8 MB. Upbeat folk, could suit a village/Quidditch-lite mood. https://opengameart.org/content/medieval-the-old-tower-inn
- **Throne Room** - Of Far Different Nature, CC-BY 4.0, MP3 5.2 MB, not looping (a loop version is in Loop Box #3). Majestic, castle-like. https://opengameart.org/content/throne-room
- **Loop Box #3** - Of Far Different Nature, CC-BY 4.0, 17 orchestral RPG tracks, OGG zip 31.1 MB (named tracks seen: Adventure Begins, Flow, Horny v2, Obscurium, Ship in a Storm, Underground Town; other 11 not listed). Page does not state that each loops seamlessly. https://opengameart.org/comment/86517 . Good all-in-one OGG fallback if MacLeod tracks disappoint.
- **FarBeyond Studio - Fantasy Music Loops (Freebies Vol.1)** - CC-BY 4.0, 7 loops (forest/underwater/fire/winter), 156 MB zip, pay-what-you-want (free), credit text "Music by FarBeyond Studio" + link. Track names not listed. https://farbeyond-studio.itch.io/fantasy-music-loops . Zip is huge; only if the moods fit.
- HZSMITH "Free Epic Fantasy Forest Music Pack" (itch.io): search snippet said CC BY-SA 4.0, 30 loop-ready tracks; the page itself returned 404, so **UNVERIFIED** and share-alike is a bad fit. Not recommended.

---

## 4. SFX picks

### Packs used
| Pack | Author | License | Size / format | URL |
|---|---|---|---|---|
| Interface Sounds | Kenney | CC0 | 100 OGG, 834 KB zip | https://opengameart.org/content/interface-sounds , https://kenney.nl/assets/interface-sounds |
| Impact Sounds | Kenney | CC0 | 130 files (format not stated on page; Kenney ships OGG) | https://kenney.nl/assets/impact-sounds |
| RPG Audio | Kenney | CC0 | 50 OGG, 691 KB zip (tags: metal, cloth, book, footstep, creak, coin, knife) | https://opengameart.org/content/50-rpg-sound-effects , https://kenney.nl/assets/rpg-audio |
| Sci-fi Sounds | Kenney | CC0 | 70 OGG, 5.9 MB zip (engines, explosions, lasers; volume-normalised) | https://opengameart.org/content/sci-fi-sounds , https://kenney.nl/assets/sci-fi-sounds |
| Music Jingles | Kenney | CC0 | 85 files (format not stated) | https://kenney.nl/assets/music-jingles |
| 63 Digital Sound Effects (lasers, phasers, space) | Kenney | CC0 | WAV, 1.1 MB zip (9 lasers, 15 phasers, 12 power-ups, 6 zaps...) | https://opengameart.org/content/63-digital-sound-effects-lasers-phasers-space-etc |
| Magic Spell SFX | JaggedStone | CC0 | 7 OGG: magical_1..7 (37-79 KB each) | https://opengameart.org/content/magic-spell-sfx |
| 3 Dark Magic Spells | qubodup | CC0 | 7z, 824 KB (inner formats not shown) | https://opengameart.org/content/3-dark-magic-spells |
| Teleport Spell | Ogrebane | CC0 | teleport.wav 287 KB | https://opengameart.org/content/teleport-spell |
| 80 CC0 Creature SFX #2 | rubberduck | CC0 | zip 1.9 MB (likely OGG); categories: roar 3, monster 13, breath 1, die 4, grunt 4, attack 5, stomp 1, bug 9, slime 8, weird 4, ... | https://opengameart.org/content/80-cc0-creture-sfx-2 |
| 75 CC0 Breaking / Falling / Hit SFX | rubberduck | CC0 | zip 1.6 MB | https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx |
| 100 CC0 Metal and Wood SFX | rubberduck | CC0 | zip 2 MB | https://opengameart.org/content/100-cc0-metal-and-wood-sfx |
| CC0 Deep Monster Roar | trazzz123 | CC0 | monster_roar.wav 1.3 MB | https://opengameart.org/content/cc0-deep-monster-roar |
| Monster Snarls | Darsycho | CC0 | 5 OGG, 75-204 KB each | https://opengameart.org/content/monster-snarls |
| Swishes Sound Pack | artisticdude | CC0 | 13 WAV, zip 385 KB (4 light, 9 heavy) | https://opengameart.org/content/swishes-sound-pack |
| RPG Sound Pack | artisticdude | CC0 | 95 WAV, 12.5 MB zip (spells, weapon swings, beetle/beast/giant/shade/slime/ogre voices, coins, cloth) | https://opengameart.org/content/rpg-sound-pack |
| Well Done (applause) | qubodup | CC0 (changed from CC-BY 3.0 on 2024-10-05) | OGG 44 KB mono | https://opengameart.org/content/well-done |

### Name -> recommended asset
**All Kenney individual file names are NOT verified** (pack pages and zip contents were not downloaded). "Pack/category" below means "audition that category inside the pack"; I did not confirm a specific file exists. A 10-minute listening pass after the first extract will settle the final picks.

| Game sound | Recommended source (pack -> category) | License |
|---|---|---|
| alarm | keep synth, or Kenney Sci-fi Sounds (alert-like) / Interface Sounds (error) | CC0 |
| bite | rubberduck Creature SFX #2 -> attack_* ; Kenney Impact Sounds (soft) | CC0 |
| block | Kenney RPG Audio (metal) / rubberduck Metal&Wood -> metal hit | CC0 |
| boom | Kenney Sci-fi Sounds -> explosion / low-frequency explosion | CC0 |
| break (shield) | rubberduck Breaking/Falling/Hit (glass) + JaggedStone magical_* ; Kenney Impact (glass) | CC0 |
| breath (dragon fire) | rubberduck Creature SFX #2 -> breath_01 layered with SketchMan3 wind loop (low-passed) ; Sci-fi Sounds thruster | CC0 |
| buff | JaggedStone magical_1/2/3 ; Digital SFX power-ups | CC0 |
| catch (snitch) | Interface Sounds (confirmation) / Digital SFX power-up | CC0 |
| crew | Music Jingles (short) or Interface Sounds | CC0 |
| dash | artisticdude Swishes (light) | CC0 |
| die | rubberduck Creature SFX #2 -> die_* ; artisticdude RPG pack voices | CC0 |
| dismount | Kenney Impact (thud) + Swishes | CC0 |
| eject | Interface Sounds (negative) / Sci-fi force-field-style | CC0 |
| end | Music Jingles | CC0 |
| fanfare | Music Jingles ; RandomMind Victory Theme (CC0) | CC0 |
| go | Interface Sounds (confirm) or keep synth | CC0 |
| goal | Well Done (clap) + Music Jingles ; crowd: Gregor Quendel (CC-BY, see below) | CC0 / CC-BY |
| hiss | rubberduck Creature SFX #2 -> weird/monster ; artisticdude RPG pack "shade" | CC0 |
| hit / hurt | Kenney Impact Sounds ; rubberduck Breaking/Falling/Hit | CC0 |
| imp (Voldemort reveal) | qubodup 3 Dark Magic Spells ; Darsycho Monster Snarls | CC0 |
| kill (Avada Kedavra) | Kenney Sci-fi laser (large) + qubodup Dark Magic | CC0 |
| nova (ultimate) | Sci-fi explosion + JaggedStone magical_4 / magical_7 (79 / 76 KB) | CC0 |
| parry | Kenney RPG Audio (metal clash) / Metal&Wood hit | CC0 |
| pickup | Kenney RPG Audio (coin) ; Interface Sounds | CC0 |
| pixie / pixiedie | JaggedStone magical_* short ; Digital SFX high blips | CC0 |
| portal | Ogrebane teleport.wav | CC0 |
| push (force push) | Sci-fi force-field/low-frequency ; JaggedStone | CC0 |
| revive | JaggedStone magical_* ; Digital SFX power-up | CC0 |
| ring (race ring) | Interface Sounds (bell/confirm) or keep synth | CC0 |
| roar | trazzz123 Deep Monster Roar ; rubberduck Creature SFX #2 -> roar_* (3) | CC0 |
| slam (troll/boss) | Kenney Impact (heavy) ; rubberduck stomp_* | CC0 |
| snitch flutter | keep synth, or Swishes (light) | CC0 |
| spiderdie | rubberduck Creature SFX #2 -> bug_* / die_* ; artisticdude beetle | CC0 |
| splat | rubberduck Creature SFX #2 -> slime_* ; artisticdude slime | CC0 |
| task | Interface Sounds (confirm) / Music Jingles | CC0 |
| throw | artisticdude Swishes | CC0 |
| thud | Kenney Impact Sounds | CC0 |
| tick | Interface Sounds (tick/click) | CC0 |
| whoosh | Swishes ; SketchMan3 wind whoosh loop | CC0 |
| zap (stun/lightning) | Kenney Sci-fi Sounds ; Kenney 63 Digital SFX (6 zaps) | CC0 |

### Extras requested
| Need | Recommended | License / size |
|---|---|---|
| Spell cast: basic bolt | Sci-fi Sounds laser (small) or JaggedStone magical_5/6 | CC0 |
| Spell cast: fireball | JaggedStone magical_*, plus noise burst; or CC-BY: *Fire & Evil Spell* by artisticdude/qubodup (https://opengameart.org/content/fire-evil-spell, CC-BY 3.0, 248 KB 7z, contents unverified) | CC0 / CC-BY 3.0 |
| Spell cast: stun | Digital SFX zap / Sci-fi | CC0 |
| Spell cast: pull | Sci-fi force-field / Ogrebane teleport (reversed) | CC0 |
| Broom wind loop | SketchMan3 *wind whoosh loop*, OGG 252 KB, loop by description - https://opengameart.org/content/wind-whoosh-loop | CC0 |
| Footsteps | Kenney RPG Audio (tag footstep) and Impact Sounds (foley) - exact files unverified | CC0 |
| UI click / hover | Kenney Interface Sounds (100 OGG, clicks/snaps/confirm) | CC0 |
| Ambience: night castle | Wolfgang_ *Crickets Ambient Noise - loopable* (MP3 184 KB, 11 s, loopable, CC0, https://opengameart.org/content/crickets-ambient-noise-loopable) + wind whoosh loop | CC0 |
| Ambience: forest | congusbongus *Cathedral in the Forest ambient loop* (forest_2.ogg 2.9 MB, "seamless", CC0, https://opengameart.org/content/cathedral-in-the-forest-ambient-loop). Alt: Spring Spring *Birds and Wind* (OGG 1.9 MB variant, CC0, has synth pads, https://opengameart.org/content/birds-and-wind-ambient-birds-wind-and-synth) | CC0 |
| Ambience: stadium crowd | Gregor Quendel *Free Crowd Cheering Sounds*, 11 MP3 tracks (e.g. "Soft cheering and chatter", "Ambience"), zip 19.6 MB, **CC-BY 4.0** - https://opengameart.org/content/free-crowd-cheering-sounds . Pick 1-2 tracks and re-encode (~0.5-1 MB each). No CC0 crowd bed found; fallback: qubodup *Well Done* applause, CC0 | CC-BY 4.0 / CC0 |

---

## 5. Attribution block (paste into credits / README)

Required (only if the track is actually shipped; replace the title list with what you use):

```
Music by Kevin MacLeod (incompetech.com)
"Moonlight Hall", "The Snow Queen", "Magic Forest", "Call to Adventure",
"Final Battle of the Dark Wizards", "Oppressive Gloom"
Licensed under Creative Commons: By Attribution 4.0
https://creativecommons.org/licenses/by/4.0/
(Tracks converted to OGG and trimmed/faded for in-game use.)
```

MacLeod's own template is: `Title Kevin MacLeod (incompetech.com) / Licensed under Creative Commons: By Attribution 4.0 / https://creativecommons.org/licenses/by/4.0/` - credit must be easy to find, e.g. a credits screen (source: FAQ page above).

Only if used:

```
Crowd ambience: "Free Crowd Cheering Sounds" by Gregor Quendel, CC BY 4.0
https://opengameart.org/content/free-crowd-cheering-sounds
```
```
"Fire & Evil Spell" by artisticdude (via qubodup), CC BY 3.0
https://opengameart.org/content/fire-evil-spell
```
```
Loop Box #3 / Throne Room by Of Far Different Nature, CC BY 4.0 (https://fardifferent.carrd.co/)
```
```
Music by FarBeyond Studio (https://farbeyond-studio.carrd.co/)   [if that pack is used]
```

Courtesy credit (not required), CC0:
```
Sound effects: Kenney (kenney.nl) and OpenGameArt contributors rubberduck, JaggedStone,
artisticdude, qubodup, Ogrebane, trazzz123, Darsycho, SketchMan3, Wolfgang_, congusbongus,
RandomMind, Juhani Junkala, cynicmusic - all CC0.
```
Add a disclaimer line: "Fan project, not affiliated with or endorsed by Warner Bros. / J.K. Rowling / Hogwarts Legacy; no copyrighted soundtrack or game audio used."

---

## 6. Risks / open questions

1. **Nothing has been listened to.** Moods are catalogue tags only; "Hogwarts feel" is a judgement call. Do a 15-minute audition of the 2 candidates per slot before encoding.
2. **MacLeod tracks do not loop.** Need crossfade code or accept restart. Boss slot has a CC0 true-loop backup.
3. **Kenney SFX file names unverified.** I could only read pack pages (counts/tags), not zip contents (not downloaded because downloads need your OK). The mapping above is category-level. Several game names (hiss, imp, pixie, snitch, ring, alarm, tick, go) have no clearly matching free asset - plan to keep the synth versions for those.
4. **Some OGA zips are 7z and WAV** (qubodup packs, 7z; artisticdude, Ogrebane, trazzz123 WAV; boss/victory WAVs 12-22 MB). Needs ffmpeg conversion to OGG before commit; do not commit the raw WAVs (repo bloat).
5. **License drift on OGA.** Uploaders can change terms (Well Done switched CC-BY -> CC0 in 2024). Record the item URL + date + license in a `audio/CREDITS.md` at download time.
6. **Rejected OGA items to avoid:** *Spell Sounds Starter Pack* (p0ss, 72 sounds incl. zaps) is CC-BY-SA 3.0 / GPL 3.0 / GPL 2.0 - share-alike/GPL, not worth the risk. *Magic Shield* and *Magic Smite* (spookymodem) and *Ice & Electricity Magic* (qubodup) are CC-BY 3.0 (usable with credit, but WAV/7z). Note the *Spell Sounds* page by Augmentality was described as OGA-BY 3.0 / CC0 only in a search snippet - unverified.
7. **Pixabay is tempting but the standalone clause is the blocker**; asking Pixabay in writing is the only way to be sure. Same for Zapsplat (403 - could not verify) and Mixkit (license text not opened).
8. **Browser support:** OGG Vorbis decodeAudioData on older iOS/Safari is not verified here. If any friend plays on iPhone, test it or ship MP3/AAC alongside.
9. **Freesound** would give the best spell/roar/ambience variety (CC0 filter) but needs a login to download and I verified no specific sounds; treat as a phase-2 gap filler.
10. **Tracking requests:** cynicmusic asks to be told about uses of his music (a request, not a condition of CC0).
11. Legal note: this is a fan project referencing Harry Potter themes. The audio itself is free of Harry Potter/Williams/Hogwarts Legacy material, but names such as "Voldemort" stay a trademark matter outside this audio research.
