# CODEMAP — where everything is (auto-generated: `node tools/codemap.js`, re-run after editing js/)
Game = `index.html` (HTML only + loader) + `css/game.css` + `js/NN-*.js`. The loader fetches the js files **in number order and joins them into ONE module** → every file sees every other file's top-level names (no import/export). Code that runs at load time may only use things from earlier files. New file = add its name to `FILES` in index.html.
Format: `name:line` = top-level function/const/let in that file. `§line title` = section header comment. Errors show `game.js:N` → `srcAt(N)` in the console gives file:line.

## js/01-core.js (27) — แกนกลาง: import Three.js + ฟังก์ชันพื้นฐาน ($ rnd clamp lerp store to…
$:17 rnd:18 clamp:19 lerp:20 dist2:21 lerpAng:22 esc:23 shuffle:24 store:25 toastT:26 toast:27

## js/02-city.js (165) — เมืองมักเกิ้ล — กล่องเทา (designs/city-bot-battle.md ขั้น 3)
CITY_PLAN:6 CITY_ZN:11 CITY_PLAZA:12 genCity:13 cityProps:126
§138 เล่นได้ทุกโหมด (ขั้น 6): พื้นที่เล่นต่อโหมด (กำแพงล่องหน AREA) + จุดเ…
CITY_MID:140 CITY_C2:140 cityModeData:141 mapArea:157 AREA:158 areaClamp:160

## js/02-citytest.js (28) — แมพทดสอบเมืองใหญ่ (กล่องเทา) — ใช้วัดความลื่นของเครื่องยนต์ก่อนสร้างเ…
CITY_N:4 CITY_B:4 CITY_ROAD:4 genCityTest:5 cityTestProps:19

## js/02-data.js (377) — 
W:4 H:4 PR:4 PILLARS:6 SPAWNF:7 mulberry:9 genForest:10 genPitch:27 genHogsmeade:36
§54 แผนที่โล่ง 3 แบบ (ผู้ใช้: ป่ามืดไม่สนุก อยากได้ที่โล่งๆ)
genMeadow:55 genLake:61 genRuins:66
§73 Test Place (ห้องฝึก): พื้นโล่งไม่มีสิ่งกีดขวาง
TEST_W:75 TEST_H:75 TEST_C:75 TEST_VIL:75 TEST_GW:77 TEST_Z:78 TEST_ST:85 TEST_PH:86 testWalls:88 testDummySpots:90 testFences:92 genTest:105 testProps:120 trZone:133 trBotPad:134 genGreatHall:135 MAPS:143 MAP_OFF:156 RANDOM_MAPS:157 MAPID:158 MW:158 MH:158 OBS:158 setMapVars:159
§160 แผนที่จากไฟล์ (Blender → assets/maps/<id>.json + .glb, สคริปต์ assets…
FMAPS:163 b64i16:164 regFileMap:165 loadMapData:177 loadAllMapData:185 mapReady:188 mapOkFor:189
§190 ของประกอบฉากที่พังได้ / ใช้ได้ (prop)
PROPDEF:194 PROP_OFF_MODES:201 PROP_USE:203 PROPS:204 PROPON:204 genProps:205
§225 ตัวละคร: บ้านฮอกวอตส์ + หน้าตา
HOUSES:227 HAIRC:232 HAIRSTY:234 WOODC:237 WOODN:238 WCOREC:239 WCOREN:240 WANDSTY:241 WANDN:246 WANDNN:261 EYEC:262 SKINC:263 CLOAKC:264 TIESTY:265 LOOKK:266 LOOKN:266 lookStr:267 parseLook:268 randLook:269 LOOKS:270 LOOKP:270 KITS:270 getKit:271 getLook:272 CREST_SH:273 CREST_PAT:274 starPts:279 CREST_ANI:281 crestSVG:287 houseColor:295 TEAMC:296 TEAMN:296 NOBROOM:298 ROOM_MAX:300 MODES:301 PLAY:313 PDEF:314 EDEF:341 POOLS:354 CDK:364 BUFFS:367 BRAR:376 rollRar:377

## js/03-spells-core.js (224) — ระบบคาถาใหม่: สาย (path) × คาถา (spell) + สถานะ (status effects)
§6 ไอคอนคาถา: จาก game-icons.net (CC BY 3.0, เครดิตใน "คู่มือ" และ icons…
ICONS:8 ICOALIAS:9 hasIco:10 ICOBASE:12 icoURL:13 ICO:14 icoTint:15 icoHTML:24 PATHS:25 SPELL_LIST:34 SPELLS:34 defSpell:35 SLOTK:36 BRMAP:36 KITP:37 parseKit:38 cleanKit:54 setKit:55 pathReset:58
§60 สถานะ (ใช้ได้ทั้งผู้เล่นและศัตรู)
isBig:61 ccScale:63 ccTouch:64 addStun:65 addRoot:66 addFreeze:67 addSlow:72 addChill:73 ignite:78 shock:86 knock:87 addWard:88 addFrostSlow:90 frostSlow:91 moveMul:98 BRN_MAX:100 addBurn:101 addXBurn:103 addPoison:104 addSil:105 addFear:106 addBlind:107 addMark:108 healT:110 tickStatus:115 clearStatus:135 fxMask:136
§138 วัตถุในสนามที่คาถาสร้าง: โซน / ฟ้าผ่าหน่วงเวลา / กำแพง / ช่องร่ายต่อเ…
foesIn:139 shieldFaces:146 aoeHit:152 addZone:158 updateZones:163 addStrike:174 updateStrikes:175 addWall:176 updateWalls:177 updateChan:181 updateSpells:185 aimPoint:187 aimWall:199
§201 ตัวช่วยคอมโบ (ทุกสายใช้หลักเดียวกัน: ตั้งต้น → ต่อยอด → ปิดจบ)
ROLE_N:203 takePoison:204
§206 ความสามารถพื้นฐาน (คลิกซ้าย) ของแต่ละสาย: สะสมสถานะตั้งต้นให้เองทุกๆ …
PBASIC:207

## js/04-frost-mech.js (112) — สายน้ำแข็ง: ประชิด/ไกล (V) • ฟันดาบ/ขวาน • ไถลน้ำแข็ง • พื้นน้ำแข็ง/ภ…
FROSTV:3 frostBoom:9 meleeHit:16 mirrorPos:27 frostBasic:28 frostSlam3:52 frostSlam:60 frostDash:66 addIce:71 updateIces:72 updateWaves:88 _stO:102 _stL:102 groundH:103

## js/05-terrain.js (44) — พื้นสูงต่ำ (แผนที่จากไฟล์ Blender — กติกาฝั่งคนปั้นใน MAP-DESIGN.md)
TERR:5 TSTEP:6 TSLOPE:6 terrT:7 floorAt:12 terrSolid:14 terrMove:21 updateGlaciers:30

## js/06-pyro.js (189) — สายไฟ: ยิงปกติ 2 โหมด / โล่ระเบิด / พุ่งชาร์จ
PYV:3 pyroBigBoom:11 pyroBall:19 pyroBasic:20 addOrbs:37 pyroParry:38 pyroBlock:39 launchOrbs:41 pyroDash:48 pyroPathEnd:68 updateFirePaths:73 KINDLE:93 DRAGONF:95 dragonfallDive:104 dragonfallTick:105 dragonfallBoom:120 RINGE:125 BLAZEF:132 SNAP:134 COLOS:139 pyroSnap:141 colossusTick:151 updateERings:170

## js/07-frost-spells.js (33) — 
FROSTF:4 GREND:6 frostGlacier:11 PERMA:16 CRYO:18 FAURA:25 MIRROR:27

## js/08-storm.js (216) — สายสายฟ้า (ผู้เล่นออกแบบทั้งหมด — designs/storm.md)
§5 ตัวเลขพื้นฐานของสายสายฟ้าอยู่ใน STORMV + v:{...} ของแต่ละสกิล — ปรับไ…
STORMV:6 stGain:10 stSpend:11 stormCone:13 stormLineFoes:18 stormBasic:22 stormTri:45 stormDash:52 stormDashTick:65 stormShieldBlast:73 stormTick:82
§91 สกิล 1 (ฟรี): เส้นสายฟ้า — ชี้ขึ้นแล้วกดลง 0.5 วิ จากนั้นสายฟ้าผ่าเป็…
TLINE:92 stormLine:94
§100 สกิล 2 (1 stack): ดูดความเร็ว
SIPH:101
§109 สกิล 3 (2 stacks): ฟ้าผ่าสามครั้ง — วางจุดครั้งเดียว ฟ้าผ่าจุดเดิม 3 …
TSTR:110 updateTCells:126
§134 สกิล 4 (1 stack): ออร์บสายฟ้าคู่ — ลอยหลังเรา Dash โดนศัตรู = ออร์บพุ…
SORBS:135 stormOrbLaunch:138
§144 สกิล 5 (2 stacks): Railgun — เส้นเตือนเหลือง 0.8 วิ (อัลติ 0.5) แล้วล…
RAIL:145 stormRailFire:147
§154 อัลติ: ร่างเทพสายฟ้า 10 วิ
GODL:155
§157 สกิล 6 (3 stacks): ลูกสายฟ้าโดม — ทะยานขึ้น บินเล็ง 3 วิ คลิกยิงลูกสา…
stormDomeTick:158 stormDomeFire:173 stormDomeSlam:181 updateStorm:186

## js/09-earth.js (261) — สายดิน ⛰️ (ผู้ใช้ออกแบบทั้งหมด — designs/earth.md §0 FINAL SPEC) • ฝั่งโฮสต์
§8 Tectonic Crush: Stand ดันช้า (TECT.v.push) แล้วกำแพงปิดเร็ว (TECT.v.s…
EARTH:9 ERV:12
§19 ตัวช่วย
eOn:20 eStand:21 eNoStand:22 eSegD:24 eAdd:25 eCollide:27 eProjHit:34 eKill:37
§39 ทุกเฟรมของผู้เล่นสายดิน (เรียกจาก updatePlayer หลังส่วนโล่)
earthTick:40 earthSpd:66 earthShHit:68 earthBreak:69 earthReset:71
§73 ท่าพื้นฐาน (คลิกซ้าย)
earthBATarget:74 earthBasic:78 earthPunch:87 earthCBStart:93 earthCBSlam:94
§98 Dash: Stand Rampage / Rock Boost Escape
earthDash:99 earthRampEnd:118
§123 สกิล 1: Stonebreaker
STONEB:124
§134 สกิล 2: Mud Swamp
MUDS:135
§139 สกิล 3: Tectonic Crush
TECT:141 earthCrush:154
§165 สกิล 4: Dust Burst
DUSTB:166
§171 สกิล 5: Terra Auger
AUGER:173 eAugAim:177 earthAugFire:178 earthMound:189
§192 อัลติ: Wrath (v2)
WRATH:196 earthPillarThrow:201 earthWrathTick:213 earthWrathDrill:224 earthWrathEnd:229 E_WRS:233 earthSpikeTick:234
§240 ทั้งสนาม: สิ่งก่อสร้างพัง / ฝุ่นหมดเวลา / Stonebreaker ชนกำแพง
updateEarth:241 earthSnapP:251 earthSnapW:253

## js/09-other-paths.js (196) — 
§65 สัตว์เวท (minion): AI ฝั่งโฮสต์
MIND:66 summonMin:72 minTarget:81 minShoot:88 updateMins:93 aimTarget:133 SDOME:170
§180 ร่ายคาถา
castSlot:181 castUlt:196

## js/09-water.js (167) — 
WATERP:7 WAV:11 wtOn:17 wtInBeam:19
§22 ทุกเฟรมของผู้เล่นสายน้ำ (เรียกจาก updatePlayer หลังส่วนโล่)
waterTick:23 waterSpd:38 waterReset:39
§41 BA: ตวัดไม้สร้างเส้นน้ำ → ยิง 3 นัดตามเมาส์ • Moonwater = ลำน้ำ
WT_BA_H:42 waterBasic:43 waterLineTick:50 waterMoonBeam:56
§59 Dash: จมดิน ทิ้งร่างโคลน → โผล่ห่าง 300 ทิศที่หัน • 6 วิกดอีกที = กลั…
waterDash:60 waterSinkTick:69
§75 ดาเมจใดๆ ของเรา → ลูกผู้ช่วยยิงตาม (เรียกจาก damage() ใน js/12)
waterOnHit:76 waterFamTick:78
§83 Riptide: คลื่นยักษ์วิ่งไปข้างหน้า พัดศัตรูติดไปจนสุดทาง
waterWaveTick:84
§92 Abyssal Beam: ร่าย 0.5 วิ → ยิงลำน้ำ 3 วิ (ยืนนิ่ง ลอยนิดหน่อย หมุนตา…
waterBeamStop:94 waterBeamTick:102 waterMBTick:113
§117 อัลติ Dragon of the Deep
waterDragonTick:118
§132 ทุกเฟรม (ทั้งเกม)
updateWater:133 waterSnapP:139 waterSnapW:141 WT_RP:144 WT_FM:147 WT_CG:149 WT_AB:153 WT_MW:156 WT_UL:158

## js/09-wind.js (256) — 
WINDP:8 WNV:12
§19 ตัวช่วย
wOn:20 wGain:21 wSeg:23 wFoeNear:24
§26 ทุกเฟรมของผู้เล่นสายลม (เรียกจาก updatePlayer หลังส่วนโล่)
windTick:27 windSpd:47 windFlyZ:49 windReset:52
§54 ท่าพื้นฐาน (คลิกซ้าย): ใบมีดลม / ดูดลมชาร์จเกจ / GaleBurst
windBasic:55 windGaleBurst:74 windGBTick:77
§83 โล่ปีก
windShieldBurst:84
§88 Dash: ผลักศัตรูข้างหน้า + ดีดตัวเราถอยหลังลอยกลางอากาศ
windDash:89
§99 กำแพงลม Aegis Gale
windWallMake:100 windWallStop:108 windWallBoom:109 windDmg:114 windProjHit:118 windWallHurt:121 windCollide:123
§129 ทั้งสนาม: GaleBurst / กำแพงลม / ชนกำแพง
updateWind:130
§155 Windrift: ชาร์จปีก → พุ่ง 200 แบบ Jett → ลงท่าฮีโร่ → 1 วิต่อมาลมแรงต…
windDriftTick:156 windDriftWind:163
§170 Vortex Bind: ทอร์นาโด 3 อันโค้ง 45° ห่าง 200 → 0.6 วิ ดึงกลับมาหยุด 6…
windVortexTick:171
§182 Void Spheres: หลุมดำลูกเดียว (ผู้ใช้ 2026-10-31, designs/wind.md)
windVoidCast:185 windVoidTick:187
§198 Featherwing: บิน 5 วิ → กดอีกครั้งสะบัดปีกไปข้างหน้า (เอียงลงพื้น) → …
windFlyTick:199 windFlick:201
§207 อัลติ Eye of Heaven
windUltTick:210 windFloatZ:224 windSnapP:227 windSnapW:228
§231 สกิล
W_WL:232 W_DR:235 W_VX:237 W_VO:240 W_FW:242 W_UL:245

## js/10-net.js (198) — 
PREFIX:4 NET:5 RC:9 TURN_SERVERS:12 ICE:13 PEER_OPT:14 TURN_URL:16 ICE_READY:18 JN:22 LAG:24 lagDo:25 hostSend:26 LOBBY:27 genCode:28 sendAll:29 NETD_KEYS:33 NETD:33 netDeltaReset:34 netDelta:35 NET_MAX:49 _netTE:49 netSendSnap:50 NETU:62 netUndelta:63 setStatus:69 hostGame:71 hostPeer:79 netConnect:98 joinWatch:109 joinFail:124 netLost:130 joinGame:145 joinPeer:156 clientOnData:171 leave:186 leaveRoom:188

## js/11-host.js (397) — 
G:4 EVL:4 EVN:4 hostLast:4 tickN:4 emit:5 feed:6 banner:7 plist:8 cleanName:9 freshStats:11 newPlayer:18 emptyInput:21 frameOk:23 addPlayer:24 initHostLobby:33 lobbyMsg:40 broadcastLobby:41 INPN:43 hostOnData:44 hostDrop:75 hostRemove:84 validate:97 hostStart:109 hostToLobby:135 MIDJOIN:142 modeCap:143 midJoin:144 CHATT:160 chatRelay:161 emoHost:169 resetBody:171 fmap:177 spawnPts:178 teamPts:180 spSpread:182 placeAll:183 respawn:195
§214 ลูปหลักฝั่งโฮสต์
hostTick:215 angDiff:229 cH:231 vR:232 updatePlayer:234 hitProp:384 damagePropsIn:391 nearUseProp:392 useProp:393

## js/12-buildings.js (502) — สิ่งปลูกสร้างที่พังเป็นชิ้นย่อย (บ้าน) แบบ Battlefield — คู่มือเต็ม: …
BLDDEF:8 BLD_PIECES:10 BLD_GRID:11 BLD_DOOR:13 BLD_FIRE:14 BLD_ICE:14 BLD_ROOF_MIN:14 BLDG:15 BLDON:15 genBldg:16 bldRect:26 bldChunk:28 bldAlive:35 bldLocal:36 bldWorld:37 rectDist:38 bldNear:39 BLD_MOUND:42 bldGone:43 bldMoundAt:44 bldMoundH:45 hitBldPiece:47 breakBldChunk:58 bldSupport:66 damageEnv:86 bldRay:101 _sgRB:109 aimClip:111 aimRay3:118 bldPieceAt:134 projEl:145 bldPush:150 collideBld:156 updateBldg:174 bldSnap:187 bldParse:193
§197 ของบังในแผนที่ไฟล์ที่พังได้ (หิน เสา รูปปั้น ต้นไม้ โคมไฟ ลัง ...) — …
BRKDEF:201 BRK_M:201 BRK_MCOL:201 BRK:202 genBrk:203 brkApply:210 brkStage:214 hitBrk:215 damageBrkIn:223 brkSnap:229 brkParse:230
§231 ตารางช่อง (spatial grid) สำหรับแมพใหญ่: หาเฉพาะของใกล้ ๆ แทนวนทุกชิ้น…
SG:234 sgObs:235 sgProps:235 sgGrid:237 sgNear:244 _sgCR:249 _sgCW:249 _sgCB:249 _sgCO:249 _sgPO:249 _sgPB:249 _sgPP:249 _sgM:249 _sgE:249 _sgA:249 _cwLast:251 collideWorld:252 shoot:291 eShoot:315 foesOf:322 breakShield:329 ULT_RATE:331 ultActive:332 gainUlt:333 lifesteal:334 damage:336 playerDown:394 killProj:415 explode:424 hitTarget:436 updateProjectiles:452

## js/12-city-dmg.js (270) — เมืองพังได้ (designs/city-bot-battle.md ขั้น 4) — ข้อมูลที่ทุกเครื่อง…
CITY_FL:8 CITY_PW:8 CDMG:9 CITYD:16 cityOn:17 cityLayout:19 cityReset:29 cityApplyBox:45 cityApplyItem:46 cityHex:47 cityMark:48 cityRampSync:49 cityPanelAt:51 cityHitPanel:56 cityTowerStart:70 cityTowerStrip:76 cityTowerFall:80 cityHitItem:91 cityHitObs:100 _sgCD:105 cityDamageIn:107 cityTick:118 _sgCM:129 cityMoundH:130 cityMounds:140
§146 ข้างในตึก (2026-10-28 ผู้ใช้: เดินเข้าได้ 1–3 ชั้น มีทางขึ้น • ผนังนอ…
CIN:150 cityInterior:151 cinSlabOn:180 cinOpenPanel:182 cityIwHit:184 cityRampHit:186 cinIwSegs:189 cinIwRects:190 cinSecAt:191 citySecHit:193 cinIn:195 cinHole:196 cinRampH:197 _sgCI:198 cityBoxGrid:199 cityRoomAt:200 cityFloorH:202 cityCeilH:207 cinWallRect:211 cityCollideIn:214 cityProjIn:224 _sgCS:242 citySolidAt:243 cityRay:252 cityRoomBox:255 citySnapB:256 citySnapS:257 cityParse:259

## js/13-enemies.js (168) — ศัตรู (โหมด Co-op)
spawnEnemy:2 setupWave:19 bossPhase:36 enemySlam:44 updateEnemies:55

## js/14-mode-rules.js (105) — กติกาของแต่ละโหมด
hostPick:2 clearField:10 modeLogic:11 endMatch:80 matchOver:105

## js/15-arena.js (71) — 
AR_SIDE:7 AR_TEAM:7 AR_MAX:7 arPads:8 arOn:9 arState:10 arBusy:11 arReady:13 arNames:21 arenaTick:22 arStart:43 arEnd:51 arReset:57 arAddBots:64

## js/15-bot.js (142) — 
BOT_LV:8 botPersona:15 BOT_TEAM:16 BOT_MAX:16 bots:17 humans:18 botInZone:20 spawnBot:26 OWNED_K:39 clearOwned:40 removeBots:41 botPickTarget:43 aiBot:56 trBotCmd:106
§115 บอทในห้องรอ (ผู้ใช้ 2026-10-31 "สร้างห้องเล่นกับบอทได้")
BOT_MODES:119 lobbyBots:120 lobbyBotAdd:121 lobbyBotFill:130 lobbyBotCmd:135 lobbyBotsStart:140 botDebug:142

## js/15-botnav.js (135) — 
NAV_MAPS:14 NAV_EYE:14 NAV:15 navOn:17 navSig:18 navEnsure:25 navBuild:31 navCell:48 navWalk:49 navRay:51 navFree:56 navPath:62 _navFoe:80 botThink:83 botNav:89

## js/15-botplay.js (88) — 
BOT_RANGE:7 botMem:9 botWallBehind:11 _bspd:21 botSave:23 botWant:25 botCombo:64

## js/15-modes.js (410) — 
sendPriv:5 TASKF:9 taskPts:10 raceRings:11 modeInit:17 spawnDummy:59 trainTick:64 TR_KEYS:81 trTeams:83 trCmd:93 hostEndTraining:111
§113 ควิดดิช
quidThrow:114 quidDrop:120 quidArea:126 quidTick:127 snitchTick:163
§186 แข่งไม้กวาด
raceTick:187 raceRank:209
§219 แบทเทิลรอยัล
brTick:220 ITEMN:234 brPick:235
§244 หาลอร์ดโวลเดอมอร์
impActions:245 startMeeting:283 hostVote:290 meetTick:295 impCheck:314
§322 ระเบิดที่ตั้งเวลาไว้ (ลูกไฟมังกร / คลื่นไฟ)
bombTick:323 modeSnap:336
§358 สร้าง snapshot ส่งให้ทุกเครื่อง
r1:359 DEFP:361 packP:362 unpackP:363 makeSnap:364 PROF:382 pf:383 hostSent:384 hostLoop:385 HLW:400 pingN:410

## js/16-voice.js (89) — 
VOICE:4 rosterIds:5 toggleMic:6 voiceSync:20 teamOn:37 teamOf:38 applyVoiceGates:39 VAC:49 onIncomingCall:50 voiceLevels:62 speakingIds:70 updateVoiceUI:76

## js/17-input.js (66) — 
INPUT:4 mouseX:5 mouseY:5 showBoard:5 SET_DEF:6 SET:7 KEYACT:9 KMAP:10 PMAP:10 SKORD:11 rebuildKeys:12 keyName:22 _rebind:24 MSANE:50 mouseSane:51 cvEl:66

## js/18-audio.js (300) — 
AC:4 MASTER:4 SFXBUS:4 REVERB:4 NB:4 WIND:4 sfxLast:5 ac:6 outNode:27 tone:42 noiz:48 snd:55 sfx:118
§120 ไฟล์เสียงจริง (โฟลเดอร์ audio/) — เริ่มโหลดเมื่อ ac() ถูกเรียกครั้งแร…
SFXN:122 SFXV:123 SFXR:124 SFXSYN:125 BUF:126 AUD:126 loadBuf:127 loadSfx:128 playBuf:133 AMB:141 ambTick:142 MUSF:153 MUSF_VOL:154 STINGERS:154 musicEl:155 fadeMusic:163 stopFileMusic:167 isWin:168 wantTrack:176 fileMusicTick:186
§203 "เพลงของฉัน": เลือกไฟล์เพลงจากเครื่องตัวเอง เล่นแค่ในเครื่องนี้ (ไม่อ…
MY:204 myDB:205 mySave:206 myLoad:209 myDecodeReady:215 myPlay:216 myNext:228 myClear:229 myInfo:230 windUpdate:236
§250 เพลงประกอบ (สร้างสดตามแผนที่)
MUSIC:251 THEMES:252 padNote:257 musicTick:264 toggleMusic:293

## js/19-client.js (262) — 
cv:4 cx:4 DPR:5 SW:5 SH:5 resize:6 VIEW:12 screen:13 lastBuffKey:13 overShown:13 lastCount:13 PARTS:14 TEXTS:14
§15 งบเอฟเฟกต์ (VFX budget)
VFXB:20 _apush:21 vfxQual:29 vfxBegin:31 vfxEnd:34 vfxOnce:36 vfxExtra:38 PCOL:39 setScreen:41 onLobby:53
§59 ภาพของโฮสต์ลื่น (ผู้ใช้ 2026-10-31 "ขี่ไม้กวาด/กระโดด กล้องสั่น")
HVB:63 HBOLD:63 hbReset:64 hbPush:65 hbPair:68 onSnap:72 snapApply:77
§86 บัฟเฟอร์ snapshot (ลูกข่าย, ผู้ใช้ 2026-10-22 "เล่นออนไลน์ให้ลื่น")
SBUF:89 NETOLD:90 sbufReset:91 sbufPush:92 sbufAdvance:102
§114 ทำนายตัวเอง (ลูกข่าย): ตัวเราขยับทันทีที่กด ไม่ต้องรอโฮสต์ตอบ
PRED:117 predictMe:118 myPos:139
§141 เอฟเฟกต์
burst:143 smoke:154 ring:155 floatText:156 shake:157 wandPos:158 impactFX:160 explosionFX:177
§189 เอฟเฟกต์คาถาใหม่
ZV:190 COLB:190 WVV:190 GLV:190 ICEV:190 SLV:190 ULTV:190 OBV:190 _iceDisc:192 _iceEdge:193 _iceSpk:194 iceFloorMat:195 _icePlane:196 _icePathMat:197 makeIceFloor:198 updateIceFloors:222 FLASHM:233 FLASHING:234 flashModel:235 endFlash:244 tickFlash:245 GHOSTM:247 SOLIDM:247 ghostOf:248 setGhost:254 hitSparks:262

## js/20-vfx-pyro-storm.js (414) — Dragonfall (ภาพ)
makeDfCircle:3 DFV:20 dfCracks:21 updateDfCracks:31 dragonfallFX:32
§84 สายฟ้า (ภาพ)
TBN:87 TBA:87 TBF:87 TBMAX:87 _tv:88 _tt:88 _ts:88 _tw:88 tbLayer:90 TBL:95 TBC:96 _tcc:97 tbGet:98 tbolt:100 tboltP:108 tbWrite:109 updateBolts:117 LATER:133 STV:133 SBV:133 SDV:133 TSV:133 CLV:133 stTgPos:135 STCLAW:139
§143 รอยกรงเล็บ (อัลติสายฟ้า): รอยข่วน 3 เส้นโค้งปลายแหลมขนานกัน ตั้งขวางห…
clawGeo:146 clawRakes:151 updateClaws:165 later:173 stFade:174 stBeam:175 shellPt:180 updateStormV:181 _ev:217 GODPTS:219 bWorld:221 stormClawSwipe:225 stormFX:252 STHUD:369 drawStormHud:370

## js/21-vfx-frost.js (206) — น้ำแข็ง (ภาพ): ชิ้นผลึก/หนาม/แผ่นน้ำแข็งชั่วคราว (โผล่ → ค้าง → หด) •…
FRV:2 _cryG:3 _spkG:3 _plateG:3 _hexG:3 _iceFxM:4 _frostM:4 iceFxM:5 frostM:6 ICEP:8 _im4:8 _iq:8 _ie:8 _ip:8 _is:8 icePool:9 iceBit:10 iceChips:13 updateFRV:14 iceRing:24 chillFX:25 makeSlash:41 _wbGeo:49 crescentGeo:51 makeWaveBlade:54 WGH:68 updateSlashes:69 _glGeo:82 _glMat:82 _glMat2:82 makeGlacier:83 updateGlacierVis:114 updateOrbShots:123 updateZV:133 WM3:206

## js/22-models.js (292) — โมเดลจากไฟล์ (.glb จาก Blender) — ข้อตกลงฝั่งคนปั้นอยู่ใน ASSETS.md
MODELS:5 modelManifest:6 gltfLoader:11 loadModel:16 modelInst:30 modelOr:31 prefetchModels:43
§45 Animation จากไฟล์ (Blender Actions) + โมเดลตัวละคร/ศัตรูจากไฟล์
ANIM_ALT:48 makeAnimator:49 animResolve:54 animPlay:55 _animN:65 animLod:66 animTick:67 lookTint:87 tintModel:91 shareSkinSkeletons:106 batchStudentSkin:114 useFileModel:132 rigStage:157 fileVariants:159 fileBroom:160 _rq:164 _rq2:164 _rq3:164 rigBind:165 rigStd:173 rigSync:174 FILE_MODELS:185
§187 VFX จากไฟล์ (รายละเอียดฝั่งคนทำอยู่ใน ASSETS.md)
VFXL:193 FLIPL:193 FLIPS:193 prefetchFx:194 playVfx:195 vfxSeq:241 flipTex:246 playFlip:254 fileFx:269 zoneFx:276 clearVfx:277 updateVfx:278

## js/23-props-bld-view.js (408) — prop ฝั่งแสดงผล
PROPV:2 propFallback:4 farCull:33 syncProps:34
§51 บ้านพังเป็นชิ้น ฝั่งแสดงผล
BLDV:54 CHARM:54 DEBRIS:54 BLD_WALLC:55 _bldIce:56 _halfRoof:56 charMat:57 bldIceMat:61 halfRoofGeo:63 bldMats:71 bldFallback:77 bldFilePiece:113 bldHasChunks:121 bldFallbackChunks:123 bldRubble:131 _moundMat:142 bldMound:143 BLD_RUBBLE_H:165 bldBuild:166 syncBld:190 bldDebris:224 bldChunkFall:252 updateDebris:265 debrisDrop:280 debrisCap:282 clearDebris:283 drawPropHint:284 syncWalls:292
§310 ของบังในแผนที่ไฟล์ที่พังได้ ฝั่งแสดงผล (สถานะจาก BRK[].st — host js/1…
BRKV:313 BRK_COL:313 brkSetup:314 BRK_CM:332 brkCrackMat:333 brkClip:349 brkYc:364 brkStump:366 brkSync:376 BRK_ZERO:397 brkFall:399

## js/24-minions-view.js (68) — สัตว์เวท: โมเดลโปร่งแสง + ซิงก์จาก snapshot (MN)
MM3:2 makeMinion:3 syncMins:36 drawMinBars:58

## js/25-efx.js (306) — efxFX: ภาพของ event "efx" ทุกคาถา (หนึ่ง case ต่อหนึ่งเอฟเฟกต์)
efxState:4 efxFX:20

## js/26-fx-events.js (240) — fx(ev): เอฟเฟกต์+เสียงของทุก event จากโฮสต์ • statusFX (สถานะบนตัว) •…
statusFX:3 fx:27
§208 overlay: เลือกบัฟ / สรุปผล
choosePick:209 syncOverlays:214 showOver:235

## js/27-world.js (275) — 
S3:4 tx:4 tz:4 CITY_KERB:7 cityKerb:8 GY:9 TW:9 hdr:10 gl:12 scene:20 cam:22 composer:23
§24 ท่อภาพ (post-processing): ฉาก → ชั้นเอฟเฟกต์นุ่ม (FXPass) → แสงฟุ้ง →…
rpass:27 fxScene:29 SOFTU:31 SOFT_GLSL:32 FXMATS:34 fxMat:35 softify:37 HAZE_U:42 AOU:46 GFX:51 AO_ON:52 AO_HEAD:53 AO_CALC:57 AO_COPY:71 AO_RT:87 fxPass:106 bloom:107 GRADEU:112 gradePass:128 aaPass:145
§147 คุณภาพกราฟิก: auto = ปรับความละเอียดเองตาม FPS / high = สวยสุด / low …
QUAL:148 QUAL_NAME:149 qualPR:150 applyQuality:156 qualTick:175 texCanvas:190 glowTex:191 stoneTex:192 runeTex:198 glowMats:206 glowMat:207 STONEM:209 stoneMat:210 shadowAll:211 SKY:214 hemi:234 moonL:236 LDIR:240 setSky:241
§249 เงาตามผู้เล่น
SHD:253 _shF:254 _shR:254 _shU:254 _shC:254 _shY:254 shadowFollow:255 LPOOL:274

## js/28-city-build.js (386) — เมืองมักเกิ้ล (ลอนดอน) — ภาพ • ข้อมูลอยู่ js/02-city.js • โมเดลจาก as…
CITY_WIN:4 cityWinTex:5 cityEmTex:10 cityBoxGeo:16 buildCity:21
§102 ข้างในตึกกลวง (ภาพ — ผัง I จาก cityInterior js/12-city-dmg)
cityInteriorView:106 cityHideIn:147 cityMoundView:153
§176 ชุดโมเดลลอนดอน (assets/city/*.glb จาก assets/src/city_kit_build.py)
CITY_STY:181 CITY_VEH:188 cityFacade:190 CITYK:203 _cZ:204 _cT:204 _cR:204 _cC:204 cityKitLoad:205 cityCull:227 citySet:233 cityTint:235 cityPools:237 cityShowBld:243 cityRubble:250 CITY_FALL:258
§259 ตึกไฮไลต์ล้มทั้งตึก (ขั้น 7)
_ctA:262 _ctB:262 _ctC:262 cityTowerPose:263 cityTowerAnim:271 cityTowerRubble:278 CAREA:292 cityAreaSync:293 cityViewSync:305 cityDebris:349 cityFX:358

## js/28-maps-build.js (762) — สร้างแผนที่
CANDLESYS:2 builtMap:3 builtKey:3 world:3 TORCHES:3 CANDLES:3 FIREFLIES:3 CRYSTAL:3 RUNE:3 SNITCH:3 BANNERS:3 SNOW:3 WCACHE:5 WCACHE_MAX:5 wkey:7 buildWorld:8 addW:41 _prewarmed:43 prewarmShaders:44 batchStatic:63 makeCandles:88 updateCandles:97 buildCastle:106 buildHogsmeade:172 buildGreatHall:260 buildForest:330
§427 ทุ่งหญ้าฮอกวอตส์ (เย็น)
ringTrees:428 grassTex:437 buildMeadow:438
§457 ทะเลสาบน้ำแข็ง (กลางคืน)
buildLake:458
§479 ซากลานประลอง (เย็น ทราย)
§480 Test Place (ห้องฝึก): พื้นตารางเรียบๆ กลางวัน + วงโซนเสกมอนสเตอร์
§481 บรรยากาศที่ใช้ร่วมกัน (แผนที่จากโค้ด + แผนที่จากไฟล์ผ่าน fx ใน MAP-DE…
makeSnow:482 makeFireflies:489 makeSnitch:496 fileMapFx:503
§513 แผนที่จากไฟล์ Blender (MAP-DESIGN.md)
terrGeo:515 buildFileMap:523 tickM:561 TRPAD:562 ARPAD:562 signTex:563 testSign:564 buildTest:571 buildRuins:668 buildPitch:693

## js/29-characters.js (439) — ระบบผ้า (เสื้อคลุมพลิ้วตามการเคลื่อนที่)
makeCloak:2 updateCloth:10 wandNamed:34 wandSparks:83
§92 โมเดลนักเรียนเวทมนตร์
SHGEO:94 SHMAT:94 SHTEX:94 sGeo:95 sMat:96 bMat:99 matKey:101 bodyPatch:107 BODYM:114 bodyMat:115 plainMat:120 mergeBody:121 sStripe:157 hashStr:158 stripeTex:159 shieldMat:160 addStatus:168 makeStudent:174 makeEnemy:281 keepTex:419 keepMatSet:420 disposeMaterial:421 disposeTree:427 disposeObj:437 PM3:438 EM3:438 JM3:438 clearDyn:439

## js/30-particles.js (271) — อนุภาค 2 ชั้น: แสงเรือง (additive) + ควัน (normal)
PMAX:2 PGLOW_OCC:6 PLIT:6 makePointSys:7
§46 เปลวไฟ: FLAME_STYLE 0 = อนุภาคกลมเรืองแสง (ไม่ใช้รูปเปลว) • 2 = แบบให…
FLAME_STYLE:48 PTIME:49 NOISETEX:51 FLAMETEX_V1:57 FLAMETEX_V2:62 PSYS:72 FLAMELUT:89 FLAMECOL:92 flame:93 PFB:102 ptexUse:103 ptexLoad:128 colCache:130 col3:131 CURL:134 CURL_V:135 curlAt:136 updateParticles:138
§178 เอฟเฟกต์รูปทรง: แฟลช / วงแหวน / โดม / รอยไหม้ / สายฟ้า / แสงชั่วคราว
SHAPES_Q:179 SHAPES:179 FLASHL:179 LINES:179 LREQ:180 ringGeo:181 ringVGeo:182 arcGeo:183 domeGeo:184 fullGeo:185 discGeo:186 decalTex:187 FX:188 jag:202 spawnShape:210 updateShapes:237 _cp:256 updateLights:257

## js/31-camera.js (188) — กล้องมุมหลังไหล่ (แบบ Hogwarts Legacy)
yaw:2 pitch:2 lastPh:2 locked:2 CAMRS:3 SENS:4 saveSet:5 applySettings:6 camPos:14 camLook:14 overlayOpen:17 showPause:18 hidePause:19 MAPCAM:20 PLACE:22 placeKey:23 updatePlaceGhost:31 _aimD:45 rayTerr:47 aimFromCrosshair:53 AIMZ:85 WBY:85 CAM_FRAMES:89 CAM_FRAME:99 CAM_TRACK:99 _camFocus:100 _camAnchor:100 _camWant:100 cameraFrame:101 camRoomK:124 updateCamera:134 menuCamera:184

## js/32-stage.js (313) — เวทีเมนู/ล็อบบี้: ห้องโถงมืด แท่นวงเวททอง เทียนลอย (ฉากแยกจากแผนที่)
stage:2 STAGE:5 STAGE_Y:6 stageSpots:58 stageChar:74 POSES:81 stageIdle:87
§109 เอฟเฟกต์หน้าเมนู (โชว์เฉพาะหน้าแรก ไม่โชว์ในล็อบบี้/หน้าสร้างตัวละคร)…
stageMenuFx:135 _sv:146
§147 ฉากประจำบ้าน (โผล่ตอนเลือกบ้านในหน้าสร้างตัวละคร)
CRESTTEX:148 crestTex:149 crestBanner:157 buildHouseEnvs:165 TONE0:213 _tc:214 stageTone:215 stageScreen:228 renderStage:229 drawStageLabels:284

## js/33-pyro-view.js (287) — ภาพของสายไฟ (pyroFX: ชาร์จ/พุ่ง/ดีดนิ้ว/กลายร่าง/Dragonfall/Colossus)…
§2 sync ตัวละคร/ศัตรู/ลูกเวท กับ snapshot
localVel:3
§11 ภาพของสายไฟ: ชาร์จลูกไฟ / ย่อตัวชาร์จพุ่ง / วงเวทพ่นไฟ / ดีดนิ้ว / กล…
_pw:12 simOf:13 makeColossus:14 makeMagicCircle:67 _fsGeo:77 fireShieldFX:79 pyroFX:98

## js/34-frost-view.js (260) — ภาพของสายน้ำแข็ง: ดาบ/ขวานน้ำแข็งที่ปลายไม้ ท่าฟัน โล่อัศวิน ไถล แช่แ…
iceMat:2 iceRim:3 makeIceSword:4 makeIceAxe:23 makeKiteShield:39
§51 อาวุธน้ำแข็งลอย (ผู้ใช้ 2026-10-22: "ร่ายคาถาให้ดาบฟันเอง ระยะเท่าเดิ…
FWS:54 FWA:54 _fwM:55 _fwM2:55 _fwX:55 _fwY:55 _fwZ:55 _fwP:55 _fwS:55 _fwQ:55 _eo:56 _ei:56 _ss:56 fwAim:58 fwWeapons:59 FWP:61 FWT:61 fwChop:62 fwSweep:63 FF_RISE:64 fwIdle:65 fwSwing:68 FWL_N:80 fwLink:81 fwMat:84 frostFX:85

## js/35-sync.js (567) — ซิงก์ผู้เล่น/ศัตรู/ลูกเวทจาก snapshot + ฉายตำแหน่งลงจอ (ป้ายชื่อ/ตัวเ…
§2 ท่าร่ายคาถาแบบนักเวทในหนัง Harry Potter (ผู้ใช้ 2026-10-22: "ยิงปกติท…
CPOSE_T:7 _ce:7 _cs:7 _cb:7 AMP_B:9 AMP_S:9 CP_BEND:10 CPOSE:12 _cpT:20 _cpR:20 CGUARD:20 CP_STEP:21 CPCOL:22 castStyle:23 castStart:24
§25 ท่าร่ายสกิล / อัลติ / โล่ (ผู้ใช้ 2026-10-22: "เกือบทุกสกิลควรมีการเห…
CANIM:30 SKFEET:74 SKANIM:76 skAnim:83 _caT:84 _caR:84 skillPose:85 _g2:111 wandTwoHand:112 characterPoseMix:119 characterStance:120 CBLOCK:127 CBLOCK_PATH:128 blockPose:129 castPose:135 lateSkillPose:141 castPose0:142 clearCharacterCast:171 syncPlayers:176 syncEnemies:265 projGeo:303 tailGeo:304 _t1:305 makeProj:306 _a:326 _b:326 PJFX:328 syncProj:329 _awT:416 animateWorld:417
§458 ฉายตำแหน่ง 3D ลงจอ (ป้ายชื่อ / ตัวเลขดาเมจ)
_v:459 toScreen:460 BURNC:468 burnNum:469 NAMETAG:483 nameTag:484 drawLabels:488 drawTexts:518 HITM:532 DIRI:532 drawXh:534 drawCrosshair:544

## js/36-modes-view.js (170) — 
ROLE:4 KC:4 roleShowT:4 onPriv:5 MO:10 BREATHS:11 clearModeObjs:12 ITEMC:21 healTex:22 makeItem:23 syncModeObjs:39
§139 หน้าประชุมโหวต (หาลอร์ดโวลเดอมอร์)
meetKey:140 myVoted:140 castVote:141 syncMeeting:147

## js/37-render-loop.js (104) — ลูปเรนเดอร์
lastFrame:2 HSTOP:5 hitStop:6 FXSTUDIO:8
§9 เก็บ shader ที่ compile แล้วไว้ตลอดเกม (ผู้ใช้ 2026-11-02 "เล่นกับบอท…
PINMAX:13 PINNED:13 KEEPSRC:16 pinPrograms:22 frame:25 _fpsAcc:39 _fpsN:39 render:40 renderGame:83

## js/38-hud.js (346) — HUD
rr:2 SLOTS:3 fmtTime:4
§5 ชิ้นส่วน HUD ธีมทอง-น้ำเงิน
HG:6 HG2:6 HUDF:8 hudTick:9 readyPulse:11 diaPath:13 plate:15 frameBox:21 bossTrail:29 drawBossBar:30 spellDia:50 thinBar:79 drawHUD:84 raceRankClient:164 drawModeHUD:168 MM:205 drawMinimap:206 slotKey:279 mySlots:280 STATUS_ICO:289 SLOTS_IMP:290 BR_LOCK:291 CLUSTER:293 E_NEEDSTAND:294 slotState:295 drawBottom:314 drawBoard:329

## js/39-menu.js (284) — 
myLook:5 myColor:5 myKit:5 myName:6 renderMyHouse:9
§11 หน้าสร้าง/แต่งตัวละคร (2 ขั้น: 1 หน้าตา → 2 เลือกบ้าน)
crLib:12 crSaved:12 crKitSaved:12 crOpen:12 crStep:12 crTab:12 crFirst:12 crKitOnly:12 crSlot:12 CRTABS:13 sw_:14 bt_:15 nameBox_:16 crPanelSet:17 crRenderStep1:22 crRenderWand:33
§36 ขั้น 3: สาย + ชุดคาถา
ROLE_COL:37 roleTag:38 DESIGNED:39 spellTags:40 spellDescHTML:47 baseDescHTML:51 SB_THEME:59 ROLE_ORDER:68 sbFxRun:69 sbFxT:69 sbParts:69 crRenderKit:70 sbStartFx:99 sbFxTick:100 sbBurst:127 crAssign:133 crRenderHouse:142 crGo:149 crSaveName:161 crSetHouse:162 openCreator:163 closeCreator:173 lobbyKitSend:180
§222 ฉากเปิด (#intro) + ประกายบนหน้าเมนู (#menuFx)
TITLE:225 titleSpark:226 titleDraw:227 titleLoop:238 titleGo:249 JOINQ:257 ovResult:277

## js/40-train-settings.js (221) — เมนูทดลอง (ห้องฝึก / Test Place)
trOpenF:2 trKey:2 trN:2 TR_OPTS:3 trToggle:4 trSend:9 trSync:14
§48 แท่นเสกบอท (โซนเสกบอท ห้องฝึก, trBotPad js/02): ยืนบนแท่น = เมนูขึ้น …
bpOpen:49 bpOn:49 bpKey:49 bpShow:51 bpSync:53 hovEl:97
§98 หน้าตั้งค่า
setRow:99 setTog:100 setTab:101 XHC:102 XHN:102 setOpts:103 SET_ICO:105 SET_EN:108 renderSettings:109 drawXhPrev:131 openSettings:132 closeSettings:134 modeIcon:190 modeTitle:191 renderLobby:192

## js/41-debug.js (171) — 
botBrain:6 _obsKeep:51 balArena:52 balReset:53 balDuel:57 balTour:72 balCoop:86 balSpellTest:102
§121 Service Worker (sw.js): เก็บไฟล์เกมไว้ในเครื่อง เปิดครั้งต่อไปเร็วขึ้…
SWK:122 swSetup:123
§141 เช็คการ์ดจอตอนเปิดเกม
GPUC:144 gpuCheck:145

## js/42-fire-vfx.js (345) — ไฟแบบใหม่ (2026-10-19): shader ไฟเคลื่อนไหวจริง (noise ไหล) ใช้กับลูก…
FIRE_U:4 FIRE_GLSL:5 fireMat:24
§55 ชิ้นงานสำเร็จรูป
_fbGeo:56 _fbGeo2:56 makeFireBall:58 _ftGeo:66 makeFireTail:67 makeFireWall:70 FIREV:78 fireBlast:79 fireTemp:84 updateFireV:85
§90 ปีกไฟ (Dragonfall) จากไฟล์ Blender mesh_fire_wing (assets/src/fx_mesh…
makeFireWings:93 poseFireWings:100
§101 ชิ้นงานพื้น/กระแทก (รอบ Pyro 2026-10-19): พื้นแตกเป็นใย (ดำ + ไฟลุกตา…
_crackPaths:104 _crackGeo:113 _decM:117 _crackRibbon:119 fireCrackWeb:127 _charTex:149 charTex:150 _discGeo:153 scorch:154 _fruneTex:158 fruneTex:159 fireRune:167 _rockGeo:173 _rockM:174 rockChunks:175 fireGeyser:183 _mv1:191 _mv2:191 fireMeteor:192
§204 อากาศร้อนบิดเบี้ยว (heat haze) — Blazeform "ออร่าความร้อน" (ผู้เล่น 2…
HZM:207 hazeMat:208 _hzPlane:218 _hzRing:219 hazeOf:221 fireBurn:226
§235 ไฟ 3 มิติจริง (volumetric) — ผู้เล่น 2026-10-19: "ไฟดูเป็นภาพ 2D เกิน…
NOISE3D:240 FIRE3D:249 _fvIdx:254 fireVol:255 fireVolTemp:299
§300 ไฟ 3 มิติที่ bake จาก Blender ทั้งก้อน (วิธี 1 — ผู้เล่นเลือก 2026-10…
FSEQ:304 fireSeqLoad:305 fireSeqReady:309 fireSeqVol:310 fireSeqAt:331 _sqA:338 _sqB:338 _sqX:338 _sqY:338 _sqZ:338 _sqM:338 fireSeqLine:339

## js/43-frost-vfx.js (145) — 
FROST_U:6
§7 shader น้ำแข็ง: ฐานน้ำเงินเข้ม → ปลายขาว • ขอบสว่าง (fresnel) • รอยร้…
ICE_VS:8 ICE_FS:11 _iceShM:24 iceShaderMat:25 iceModel:29
§33 มงกุฎหนามน้ำแข็งพุ่งจากพื้น (ภาพอ้างอิงจากผู้ใช้)
ICEM:35 iceBurst:36 updateIceMeshes:43
§50 Glacier Mist: หมอกเย็นลอยต่ำ ฟุ้งออกจากน้ำแข็ง (InstancedMesh 1 draw …
MISTTEX:51 MISTMAX:58 MISTP:58 MISTSRC:58 mistMesh:59 mistPuff:71 glacierMist:74 mistLine:78 mistArea:79 updateMist:80 mistWave:96 forgeRise:98 forgeAura:102 updateFrostV:104
§106 ดาบ/ขวานน้ำแข็งจากไฟล์ Blender (mesh_ice_sword / mesh_ice_axe)
_wpM:108 fileWeapon:109
§117 Ice circle (Permafrost): ริบบิ้นแสงวนเป็นก้นหอยบนพื้น + ผลึกลอยหมุนรอ…
SWIRL_FS:118 ICIRC:122 iceCircle:123 updateIceCircles:134

## js/44-vfx-kit.js (365) — 
§8 1) หางแสง
TRMAX:11 TRPTS:11 TRAILS:11 _trL:12 trailLayer:13 trailNew:22 trailPoint:24 trailStop:27 _tv1:28 _tv2:28 _tv3:28 updateTrails:29
§52 2) สูตรเอฟเฟกต์ = จานสี (ธาตุ) × แม่แบบ (ขนาด/ชนิด)
VFXPAL:56 VFXTPL:72 VFXSIG:84 VFXSIGK:92 VFXR:94 _palCache:97 palOf:98 _pc:101 playFx:102 nearMe:112 fxLayer:113
§145 3) ผูกเอฟเฟกต์ซ้อนชั้นกับเหตุการณ์ของทุกสาย (เพิ่มทับของเดิม ไม่ลบหน้…
EFXAUG:147 PJPAL:166 pjPal:168 ULTCOL:169 efxAug:170 VFXAUG_ON:174 fxAug:175
§195 3b) สนามรบ (designs/battlefield.md ขั้น 1, แบบ C): ทุกสกิลทิ้งควัน/ฝุ…
BF_EL:198 BF_CLS:198 BF_EXTRA:200 BF:203 bfAfter:204 bfPlay:224
§228 3c) สนามรบ ขั้น 2: รอยค้างบนพื้น + ซากรก ๆ ค้างทั้งแมตช์ (ล้างเมื่อเร…
BFM:231 BF_MK:232 BF_MKA:232 BF_MKR:232 bfMarkMesh:233 _bfQ:241 _bfQ2:241 _bfN:241 _bfUp:241 _bfS:241 _bfP:241 _bfMx:241 bfMark:243 updateBfMarks:252 BFRS:257 bfRestPool:258 bfRestAdd:263 bfBinAdd:269 bfBinBuild:273 bfRest:278 bfScatter:284 _rockMat:292 bfCollapse:294 updateBfRest:301 bfClear:307
§311 3d) สนามรบ ขั้น 5: บรรยากาศตามความพังรอบตัว (designs/battlefield.md)
BFA:315 bfWreck:316 updateBfAir:321 bfRumble:344 updateBf:347
§350 4) เอฟเฟกต์ทั้งจอ (ค่าไปที่ GradePass ใน js/27-world.js)
SCR:351 screenFlash:352 screenRadial:353 screenKick:354 screenHurt:355 _scv:356 updateScreenFx:357 updateVfxKit:365

## js/45-fx-runtime.js (384) — 
FXR:9 FXDEG:10
§11 โหลด
fxFetch:12 fxDefaults:13 fxBoot:14 fxOverrides:24 fxLoad:27 fxData:31
§32 ค่า: ตัวเลข / สูตร / ช่วงสุ่ม / เส้นโค้ง / สี
_fxExpr:33 fxExpr:34 fxEval:38 fxV:40 fxIsCurve:47 _fxCK:50 _fxCKon:50 fxCurveKeys:51 fxCurve:52 fxG:60 fxCol:61 fxPal:62
§63 ตำแหน่ง: กรอบของเอฟเฟกต์ (+x ขวา, +y ขึ้น, +z ทิศเล็ง) → พิกัดแผนที่
_fxw:64 fxAnchor:65 fxBase:68 fxLocal:71 fxDir:72 fxYawV:73 fxPos:74 fxPlace:75
§76 เล่น / หยุด
fxPlay:77 fxStart:78 fxStop:87 fxKill:88 fxClearAll:89 fxGate:91
§93 ทุกเฟรม
updateFx:94
§110 สร้างชั้น
fxN:111 fxSpawn:112 fxTick:146 fxEnd:157
§164 อนุภาค
_fxrnd:165 fxUnit:166 fxCone:167 fxEmit:169 fxPart:186
§201 รูปทรง 3D
FXGEO:202 fxMerge:203 fxRibbon:208 fxGeo:214 fxEnergyMat:234 fxWaterMat:249 fxToonWaterMat:262 fxToonMat:277 fxMeshMake:285 fxMeshTick:306 fxFlipTex:321
§326 หางแสง / รอยฟัน
fxTrailTick:327
§333 สายฟ้า
fxBolt:334
§340 ฟังก์ชันในโค้ดที่ไฟล์เรียกได้ (ชั้น t:"code")
FXCODE:341
§354 ผูกกับ event ของเกม (assets/fx/bind.json) — เรียกจาก fx(ev)
fxLoopName:356 blzFxName:357 fxLoopKeep:358 fshHitFx:360 fxBind:363
§374 แม่แบบ playFx เป็นไฟล์ (assets/fx/tpl/*, sig/*, rec/*)
fxTpl:376

## js/46-fx-make.js (280) — 
FXMK:10 MKD:11 mkRng:12 mkHash:13 mkNoise:15 mkL:17 mkR2:18
§19 ที่เก็บจุด/สามเหลี่ยม
mkG:21 mkPc:22 mkV:23 mkQ:24 mkAppend:25 mkCopy:26 mkFlat:27 _mkv:28 mkXf:29 mkThree:32 mkTRS:34 mkGrid:37
§38 ชิ้นส่วน (k) — พิกัด: ฐานอยู่ที่ y=0 (ยกเว้น sphere/box อยู่กลาง)
§39 ปั้นเอง (k:"poly"): จุด v + หน้า f (เลขจุด ทวนเข็มเมื่อมองจากด้านนอก)…
mkCC:40 MKGEN:51
§112 ตัวแต่ง (ทำตามลำดับ): เรียว → บิด → โค้ง → ขรุขระ → แบน(เหลี่ยม) → ขน…
mkDeform:113 mkOpts:124 mkPart:125 fxMeshBuild:138
§152 โหลด
fxMeshLoad:153 fxMeshGeo:155 fxMeshSet:157 fxTexLoad:159 fxTexUse:162 fxTexNeed:165
§166 โมเดลงอกทีละชิ้น (ชั้น mesh: grow 0..1 เส้นโค้งได้, stagger, growBy)
FXGROWBY:168 fxGrowInit:169 fxGrowTick:171
§176 วัสดุภาพบนรูปทรง (mat:"tex") — ภาพที่วาดในสตูดิโอ (tex/…) ไหลบนผิว + …
fxTexMat:178 fxTexMatBind:190 fxTexMatTick:193
§194 เศษโมเดลกระเด็น (emit look:"model") — หิน ผลึก ขนนก เศษดาบ: หมุน ตกตา…
FXMP:196 MPLOD:200 MPLOD_PX:200 MPLOD_ON:200 fxMPParticleGeo:201 fxMPMat:206 fxMPGroup:210 _mpM:215 _mpQ:215 _mpE:215 _mpP:215 _mpS:215 fxMPUpdate:216 fxMPClear:230 fxMPSpawn:232
§236 อากาศบิดเบี้ยว (ชั้น warp) — ไอร้อน / คลื่นกระแทกบิดภาพ / เลนส์โป่ง •…
fxWarpMake:238 fxWarpTick:250
§256 ไฟ 3 มิติจากการจำลอง (ชั้น vol) — ไฟล์รูปแบบเดียวกับที่เพื่อน bake จา…
FXVOL:259 fxVolLoad:260 fxVolTex:264 fxVolSet:267 fxVolReady:268 fxVolMake:269 fxVolTick:272 fxPreAssets:277 fxAssetsWait:279

## js/47-earth-view.js (686) — 
ECOL:9 EGUARD_BIG:14 EGUARD:14 CB:15 EV:16 eW:17 eYaw:18
§19 ลายผิว (วาดเองบน canvas: หิน/ทราย + รอยร้าว + ขอบบล็อกแบบ Roblox)
ETEX:20 eTex:21 eFadeTex:35 eMat:37 eTMat:38 rockGeo:39 _eChunkM:43 eChunks:44
§46 Stand (บล็อกหิน/ทรายครึ่งตัวบน)
makeStand:48
§84 Rampage: เกราะลมหน้า Stand (ผู้ใช้: เหมือนอุกกาบาตตกโลก ต้านลม — เปลื…
makeBow:86 EBOW:95 _RIM:95 eRampWind:96 eSpikes:108 standOp:113 _ikDn:116 eArmIK:117 PK:124 standPose:126 _eRq:152 _eRq2:152 _eRx:152 standRun:153 eState:171 eStandOf:172 eGiantOf:173 eSandFall:175 eAppear:176 eAim:178
§181 วงเตือนบนพื้น (BA ชาร์จ / จุดปาเสา): วงเข้มก่อน แล้วสีอ่อนค่อย ๆ เติม…
makeWarn:182 eWarnAt:187
§188 ทุกเฟรม: ผู้เล่นสายดิน (เรียกจาก syncPlayers)
earthFX:189
§282 สว่าน (ref: designs/earth_ref/drill_ref.png): หินแหลมเรียวเป็นตัวหลัก…
eSteelEnv:284 eHeatTex:289 EDR:294 eDrillGeo:295 makeDrill:301 drillHeat:308
§310 เสายักษ์ (ref: designs/earth_ref/pillar_ref.png): เสาเหลี่ยมยาว ปลายห…
makePillar:311
§317 กระสุนหิน
earthProjMesh:318 SLAB:324 makeSlab:325 eSlabGeo:330 eSlabMats:341 slabCracks:408
§411 สิ่งก่อสร้าง + ฝุ่น (เรียกจาก render loop)
earthClear:412 eMakeSO:417 syncEarth:433 earthFog:476 eMudScreen:479 _eOlMat:486 eOutlines:488 _eCamT:493 eAnim:494 eDebris:495 eWave:497 eAirWave:499 esbImpact:502
§509 event "efx" ของสายดิน (เรียกจากต้น efxFX) — คืน true = จัดการแล้ว
earthEfx:510 eWindOut:599 eAirCone:605 eDrillFly:607
§611 บึงโคลน (Mud Swamp + บึงจากเสาอัลติ): คลื่นกระเพื่อมจากกลางไปขอบ แล้ว…
earthMudZone:612 earthMudSink:619
§620 HUD ใต้เป้าเล็ง
ESM:622 eSmooth:623 ESF:626 eShieldFx:627 eChips:632 eShieldSegs:635 eShieldNum:649 eShieldArc:653 drawEarthHud:666

## js/48-ragdoll.js (227) — 
RAG:10 RAGJ:23 RAGB:29 RAGS:33 RAGMIN:37 RAGHINGE:39 _rv1:40 _rv2:40 _rv3:40 _rqa:40 _rqb:40 _rm:40 ragBones:41 ragBasis:48 ragTargets:56 ragStart:62 ragBack:88 ragFloor:89 ragStep:90 ragPose:155 ragWrite:170 ragRestore:182 ragEnd:186 ragTick:188 ragHideDead:222

## js/49-cloth.js (132) — 
CLOTH:10 CL_ROWS:26 CL_NC:26 CL_GAP:26 CL_IN:26 _clV:27 _clA:27 _clB:27 clPinK:29 clBind:31 clothSetup:34 clTargets:68 clReset:72 clCapsule:74 _clO:78 clWorld:79 clWorldHit:88 clStep:93 clDraw:106 clothTick:113

## js/50-grass.js (294) — 
AIR:10 AIR_MAP:17 airGust:19 airGs:22 airMark:24 airForMap:27 _airV:28 airAt:29 airGv:35 airTick:36
§39 ต่อเข้ากับเอฟเฟกต์เดิม (ไม่ต้องแก้ทุกสกิล): แสงวาบ = ลมกระโชก • วงคลื…
CLW:48
§50 หญ้า
GRASS:52
§53 รอยสนามรบบนหญ้า + พื้น (อยู่ทั้งแมตช์ — designs/battlefield.md ขั้น 3)
SCAR:56 scarReset:58 scarPaint:65 grassScar:80
§85 พื้นหญ้ามีชีวิต: สีเป็นหย่อม (เขียวเข้ม / แห้งเหลือง / ดินโผล่) + จุด…
GR_NOISE:88 GR_LIVE:93 grLive:111 GR_GLSL_V:118 GR_BEGIN:123 grassMat:169 grassBuild:187 _grBasic:201 grassBake:202 grassCount:258 grassTick:263

## js/51-warmup.js (186) — 
WARM:11 WARM_FXDIR:12 WARM_COMMON:12 WARM_X:13 WARM_Y:13 warmKeep:15 warmStaticModels:21 warmCompile:29 warmDraw:32 WARM_SKIP:42 warmAssets:45 warmFx:55 warmFxEnd:66 warmGather:68 warmPaths:70 warmStep:72 warmTick:104
§113 ภาพจากโค้ดของแต่ละสาย (เฟรมละฟังก์ชัน)
warmOutline:123
§140 อุ่นฉากเกมระหว่างรอในห้อง (ผู้ใช้ 2026-10-23: "กระตุกตอนเริ่มแมตช์แรก…
GWARM:145 gameWarmTick:146 gameWarmFree:179

## js/52-social.js (172) — 
§6 แชท: Enter = พิมพ์ / Enter อีกที = ส่ง / Esc = ปิด • ข้อความขึ้นมุมซ้…
CHAT:7 chatOpen:27 chatClose:32 chatSend:42 chatAdd:47 escH:52 onChat:53 drawSocial:59 drawPing:83
§89 อีโมต: กด Z ค้าง → วงล้อ 6 แบบ ลากเมาส์ไปทางที่ต้องการ ปล่อย Z = เล่น…
EMOS:90 EMO:91 drawEmoWheel:109 emoFx:122 emotePose:124
§140 ดูเพื่อนเล่น: ตายแล้ว ≥2 วิ หรือเข้ามาเป็นคนดู → กล้องตามคนอื่น คลิกซ…
SPEC:141 specTarget:142 specCycle:152 drawSpecHint:157
§165 ป้าย "กำลังต่อใหม่..." (ลูกข่ายหลุดจากโฮสต์ js/10 netLost)
drawNetBanner:166

## js/53-victory.js (165) — 
VIC:6 VPAL:7 vicKind:17 vicStart:25 vicStop:31 vicSkip:32 vicBolt:36 vicLoop:42
§108 จอสรุป: MVP + จุดเด่น (ใส่ใน showOver js/26)
overMvp:117 overBar:127
§129 ห้องฝึก: นับคอมโบ (ผู้ใช้ 2026-10-22 "ห้องลองคอมโบ ... ใส่ในห้องฝึก")
COMBO:132 comboHit:133 comboEnd:139 drawCombo:140

## js/54-ffa.js (197) — 
FFA:8
§12 โฮสต์
ffaInit:13 potSpotOk:19 potSpots:23 potInit:31 potTick:32 ffaTick:43 ffaDmgLog:45 ffaKill:51 ffaDone:69 ffaSnapPots:77
§79 ภาพ: แท่นขวดเลือด 3 มิติ (แบบแท่นเฮล Overwatch)
POT3:81 potBottle:82 potMesh:91 syncPots:108 potFx:125
§130 ภาพ: ป้ายตอนฆ่า / จอตอนตาย / อันดับ / มงกุฎค่าหัว
FFAV:131 MULTI:132 MULTI_TH:132 STREAK:133 pName:134 ffaKf:135 kfSound:150 KINDN:151 drawFFA:152

## js/55-podium.js (82) — 
POD:6 POD_X:7 POD_H:7 POD_C:7 podStart:8 podStop:29 podPose:37 renderPodium:49

## js/56-progress.js (94) — 
LV_MAX:8 DEV_MAXLV:11 lvNeed:12 UNLOCKS:13 PROF_ITEMS:23 lvRewards:31 lvNextReward:32 PROG:33 progSave:34 lvOf:35 progLv:36 xpMax:37 wandKillNeed:39 lookLock:40 lookClampLocks:41 progXP:43 progAward:44 progBox:56 progOpen:64 progChip:76

## js/57-tutorial.js (44) — 
TUTTIPS:7 tutOpen:12 tutTry:31

## js/58-deathcam.js (60) — 
DCAM_T1:10 DCAM_T2:10 DCAM_FADE:10 DCAM:11 dcamDie:12 _dcP:19 _dcL:19 dcamCam:20 drawDeathCam:47

## js/59-podroom.js (151) — 
PODS:9 PODR:11 podRoomBuild:12 podRoomTick:142

## js/60-menu3d.js (397) — 
MENUS:14 MN:17 MN_FOV:19 MN_R:19 _mv:20 _mcp:20 _mcl:20 mnCrest:21 mnTone:25 mnHit:30 mnBuild:32 MNPOP:223 mnToast:243
§244 สั่งพ่อมด
mnGo:245 mnWalkTo:248 mnUse:249 mnClose:254
§258 เมาส์ / คีย์บอร์ด
MN_BLOCK:259 mnRay:260 mnPick:261 mnHot:267 mnToy:285
§290 เรนเดอร์ (เรียกจาก renderStage js/32 — คืน true = จัดการแล้ว)
mnRestore:291 mnMenuRender:297

## js/61-hub.js (884) — 
HUBS:11 HUBL:11 HUB:14 HB:18 _hq:19 _hq2:19 _hq3:19 _hv:19 _hv2:19 _hv3:19 _hY:19 hEase:20 hSm:21
§23 อนุภาคเรืองแสงของเมนู (ขนาด/สี/ความจางต่อเม็ด)
hubPS:24 hCol:50 H_SPARK:51
§53 ผิว/ลาย (วาดด้วย canvas)
hubTexCloth:54 hubTexFloor:79 hubTexWindow:85 hubTexPage:92 hubTexCard:98 hubStarTex:103 hubStar:105 hubShaftTex:106
§109 ของบนโต๊ะ
hubLathe:110 hubCloth:112 hubTexRug:128 hubTexGlobe:138 hubTexMap:144 hubTexStars:152 HWP:162 hubWipeMake:163 hubWipeLook:174 hubWipeDraw:182 hubBuildStudy:200
§367 ล็อบบี้รอเริ่ม: แท่นวงเวท + ม่าน + หน้าต่างโค้ง + ลำแสงลงแต่ละที่ยืน
hubBuildLobby:368
§405 ตัวละคร (โมเดลไฟล์ + จัดท่าเอง)
HPOSE:407 HPK:420 HBN:420 LOBBY_POSES:421 hubMakeChar:422 hubSetPose:454 hbAim:456 hbRot:462 _hcq:467 _hax:467 _hd:467 _ht:467 hubCharTick:468
§525 ลูกแก้วเวท (เล่นในมือ)
hubMakeOrb:527 hubOrbTick:541 hubBurst:558
§561 สร้างฉาก (ครั้งแรกที่เปิดเมนู)
hubBuild:562 hubTipStar:568
§569 อุ่นเชดเดอร์ล่วงหน้า (ผู้ใช้ 2026-10-23: "กระตุกตอนกดเล่น / เข้าห้อง")
HWARM:573 hubShowAll:574 hubWarm:575 hubWarmDraw:593 hubPlaceWand:609 hubMenuChar:632 hubResetMenu:640
§647 กล้อง
_hf0:649 _hf1:649 _hf2:649 _hf3:649 hubFrame:650 _hcA:659 _hcB:659 _hcC:659 hCamMix:660 hAspK:662 hubCamMenu:664 hubCamPick:666 hubCamLift:667 hubCamPoseA:670 hubCamPose:671 hubCamRoom:673
§676 ลำดับตอนกด "เล่น" (ผู้ใช้ 2026-10-23)
HSQ:679 hPickRy:680 hubGo:681 hubBack:685 hubFadeDo:689 hubSeqAt:691 hubCamSeq:714 hWipeP:720 hubSeq:721 hubSnapModes:729
§735 ล็อบบี้: ใครยืนตรงไหน ท่าอะไร
HL_SPOTS:738 HL_TEAM:739 hubLobbyLayout:740 hubLobbyTick:747 hubLabels:773
§787 หน้าโปรไฟล์ (UI ใน js/65 PRF)
PRF3:791 prfSpot:793 hubProfSet:802 hubProfShow:810 hubProfTick:811
§822 เรนเดอร์ (เรียกจาก renderStage — คืน true = วาดแล้ว)
hubRender:823

## js/62-hub-ui.js (308) — 
HUI_IMG:9 HMODES:10 HUI:15 HICO:17 hSvg:35 hHex:36 H_STAR:37
§95 สถานะหน้าจอ: menu / modes / room / off
hubUiState:96 hubMeChip:104 hubOnScreen:110
§119 เมนูแรก
hubJoinGo:122
§133 การ์ดโหมด
hubMxJoin:140 hubPickMode:153 hubFlipKill:166 hubRoomRect:167 hubFlip:168 hubLeaveRoom:184 hubUnflip:189 hubFlipEnd:202
§209 แผงห้อง (การ์ดที่ขยายแล้ว)
HUI_MAPN:210 hubLobby:211 hubRoomClick:275 hubKitChanged:298
§300 เริ่มต้น

## js/63-skillwheel.js (317) — 
SKW:9 SKW_PO:10 SKW_PI:10 SKW_RUNE:11 skwPaths:12 skwKey:13 skwOffN:14 skwChanged:15 skwSnd:16
§17 โครง DOM (สร้างครั้งแรกที่เปิด)
skwSvg:18 skwBuild:28
§41 ลากคาถาลงช่อง (pointer — ใช้ได้ทุกเบราว์เซอร์/จอสัมผัส)
skwDragDown:43 skwSlotAt:50 skwDragMove:55 skwDragUp:71
§90 วาด
skwRender:91 skwRow:96 skwPos:104 skwArcs:105 skwRing:118 skwSwap:139 skwSlots:145 skwInd:161 skwIndApply:167
§168 ข้อความกลางวง
skwSetInfo:169 skwSpellInfo:173 skwBaseInfo:180 skwClassInfo:187 skwLibInfo:191 skwInfoDef:195 skwSpellHover:196 skwOver:202
§214 การกระทำ
skwClick:215 skwSetSlot:224 skwSetPath:225 skwSetLib:232 skwAssign:233 skwGhost:249 skwFlashSlot:257
§258 พื้นหลัง: ฝุ่นดาว + ประกายตอนใส่คาถา (canvas เดียว หลังเนื้อหา)
skwBurst:259 skwFxStart:263 skwFxTick:268
§288 เปิด/ปิด
skwOpen:289 skwClose:299

## js/64-mappick.js (157) — 
MPK_TXT:7 MPK_SKY:19 MPK_I:21 MPK_DICE:31 MPK:36 mpkE:37 mpkC:37 mpkSnd:38 mpkCut:39 mpkName:40 mpkCardHTML:41 mpkBuild:51 mpkUp:89 mpkMeasure:101 mpkIdx:102 mpkStep:103 mpkTo:104 mpkPick:105 mpkOpen:111 mpkClose:127 mpkLoop:131 mpkTick:133

## js/65-ui3.js (409) — 
UIG:6 uiGalaxy:7 uiGalaxyOn:15 uiGalRaf:16 uiGalT:16 uiGalLoop:17 uiGalDraw:19 uiShow:36 uiHide:37
§40 เมนูหยุดเกม
§44 คู่มือ (แบบ Skill Tree)
GICO:47 GROW:58 GPATH:59 GUIDE:63 GD:84 guideBuild:85 guideLayout:95 guideOpen:102 guideClose:106 guidePic:107 guideGo:112
§130 จอสรุปหลังจบเกม (ต่อจากป้ายชนะ + โพเดียม)
RICO:133 rIcon:139 OV:140 ovScore:141 ovOpen:142 ovHead:151 ovSummary:157 ovNextReward:179 ovLvAnim:186 ovBoard:205
§227 หน้าโปรไฟล์ + รางวัลเลเวล
PRF:232 prfItem:233 prfLv:234 prfOk:235 prfGet:236 pathIdx:237 BORDERS:239 BRAR_C:248 BRAR_N:248 bordOk:249 myFrame:250 PBN:252 PB_SVG:253 prfAvatar:268 BADGES:271 BICO:275 BFR:279 badgeHtml:283 SICO:284 PT:286 PFS:287 prfSave:288 prf3Sync:289 profOpen:290 prfStageX:298 profClose:300 prfRender:301 prfItems:325 prfRwHtml:332 prfRewards:343 prfClick:352 prfDrag:364
§374 การ์ดพลังเสริม (ดันเจียน) + ความหายาก
BKICO:377 buffShow:381
§400 จอมืดตอนเริ่มแมตช์ (ผู้ใช้ 2026-10-23: กระตุกตอนเริ่มแมตช์แรก)
gameCover:403

## js/66-hud4.js (209) — HUD รอบ 4 (ผู้ใช้ 2026-10-23, designs/hud-full-mock.html)
H4E:5 H4:12 h4Pal:13 hud4Col:15 h4Parts:17 h4AuBits:22 h4Key:37 h4Ico:38 h4Build:39 h4Set:66 hud4Draw:67
§116 ไพ่สกิล: นาฬิกาทราย / ท่าใช้ / สลับตำแหน่ง
h4Glass:118 h4Bits:124 h4Fx:126 h4CardUse:128 h4GlassOut:132 h4Place:136 h4OrdKey:139 h4OrdLoad:140 h4Swap:143 h4Pick:146 h4AltKey:148 h4CardWire:152
§163 ไพ่อัลติ
H4SH:165 h4UltCard:167 h4UltUse:172 hud4Frame:174 hud4Hide:175
§176 ไพ่อัลติกลางจอ (ผู้ใช้ 2026-11-01)
h4UltX:179
§186 รูปตัวละครเรา (FFA / TDM แทนแผนที่ย่อ)
H4PF:188 h4PfMode:189 h4PfAvatar:191 h4Portrait:193 h4PfRead:203 h4MapBox:209

## js/67-backdrop.js (139) — 
BACKDROP:8
§66 noise เล็ก ๆ (คงที่ต่อ seed)
bdHash:67 bdNoise:68 bdFbm:69 bdEdge:71 bdRing:73 bdPaint:79 bdTree:82 buildBackdrop:89 bdTower:135 backdropHide:139

## js/68-water-view.js (216) — 
WTV:5 WTC:6 WT_BODY:8 waterCharacterPose:13 wtState:34 wtStop:35 wtMesh:36 _wtV:38 _wtP:38 wtBakeClone:39 wtLineMat:50 _wtOlMat:57 wtOutline:59 WT_SINKD:65 wtSinkOffset:66 wtAlive:73 wtLoop:75 WT_FR:78 wtFrPath:79 _wtFa:81 _wtFb:81 _wtFs:81 _wtFn:81 wtFamRiseMesh:82 WT_POOL:87 wtFamRise:88 wtFamRiseOff:95 _wtTube:97 WT_BEAM_V:98 WT_BEAM_F:101 WT_BEAM_O:105 wtBeamMesh:108 wtBeamSync:112 wtBeamOff:117
§119 ต่อผู้เล่น: โล่ฟองน้ำ/ฮีล • ลูกผู้ช่วยที่ไหล่ • ร่างโคลน + เส้นน้ำ • …
waterFX:120
§156 ทั้งเกม: ลูกผู้ช่วยที่กำลังพุ่ง (ล็อกเป้า)
WT_MOUTH:158 _wtA:159 _wtB:159 wtMouth:160 _wtCyl:163 wtBeam:165 syncWater:168 wtPew:175
§183 เหตุการณ์ (efx z 'wt…')
waterEfx:184
§212 HUD: เกจฮีลโล่ (โค้งซ้ายรอบเป้าเล็ง)
drawWaterHud:213

## js/68-wind-view.js (221) — 
WV:6 WN_BODY:7 WN_AIR_FEET:7 windCharacterPose:9 wvState:25 wvAlive:26
§27 ทุกเฟรมของผู้เล่นสายลม: ปีกติดหลัง / ปีกห่อตอนยกโล่ / ดูดลมชาร์จเกจ
windFX:28
§47 กำแพงลมจาก snapshot (ตามตำแหน่ง/ลบเมื่อหมด)
syncWind:48 wvWall:57 wvAimFx:58
§59 เหตุการณ์ (efx z 'wn…')
windEfx:60
§102 HUD รอบเป้าเล็ง: เกจ GaleBurst (โค้งซ้าย) + ชาร์จกำแพงลม (จุด 3 จุดใต…
drawWindHud:103
§110 ตัวช่วยเล็งกำแพงลม (เห็นเฉพาะเรา): เส้นโค้งเรืองที่จุดวาง (คลิกขวา) +…
wvAimGhost:111
§122 ปีกเวทสายลมติดหลัง: ขนนก 8+4 เส้นต่อข้าง ทำจากสายลม (shader) + ริบบิ้…
WWS:124 WWU:124 WW_NOISE:125 _wwMat:130 wwMats:131 wwFeatherGeo:171 WW_PRI:182 WW_COV:184 WW_RIB:185 _wwGeo:186 makeWindWings:187 wwCue:199 poseWindWings:203

## js/69-broom.js (228) — ไม้กวาด (ผู้ใช้ 2026-10-29): บินแบบเครื่องบิน + ยิงลำแสงตามสาย + อนิเ…
BRM:9 BSK:11 BROOM_SK:17 broomVert:38 broomMove:50 broomStrike:68 broomStrikeTick:77 broomFlak:85 broomAct:96 broomOff:102 broomBeam:104
§125 ฝั่งจอ
broomHead:127 BBEAM:134 _bbGeo:135 broomView:136 broomMountFx:165 broomDismountFx:173 broomBeamFx:175 broomSkFx:191 broomStrikeFx:204 broomFlakFx:209 broomHud:214 broomHudT:215 broomTick:224

## js/70-water-dragon.js (476) — 
WDG:7 wdgBuild:8 T:9 root:9 fixed:9 rings:10 sides:10 geoOf:11 skin:12 faceSkin:40 group:41 head:42 faceTime:44 groundY:44 faceMaterial:45 faceBlue:50 hornBlue:50 ridgeCyan:50 profile:52 headProfile:53 faceGeo:58 fp:58 fc:58 fi:58 faceRings:58 faceSides:58 navy:59 aqua:59 belly:59 flowHi:59 neckBlend:59 headStroke:71 eyePatch:72 waterCrest:87 bodyGeo:113 bodyP:113 bodyUV:113 indices:113 body:119 finShape:121 finGeo:122 finPos:124 finUV:124 finSkin:126 fins:127 limbSkin:129 clawSkin:130 taperedLimb:131 arms:138 bodyLength:148 intro:148 settleWindow:148 tipHz:148 bodyBulk:148 bodyRadius:149 flight:151 quarters:152 step:152 dr:152 dy:152 spiralKnot:153 first:154 entry:154 crest:158 bank:161 corner:161 cruiseEntry:161 quarterHandle:164 leadLength:166 up:170 zAxis:170 yAxis:170 smooth:171 startAt:172 startD:172 startDistance:174 distanceToCruise:174 hoverSpeed:174 fastDuration:174 brakeDuration:174 startRamp:174 fastSpeed:175 progress:176
§185 ทางบิน: ใช้ระยะทาง (เมตร) ไม่ใช่สัดส่วน เพื่อต่อทางพุ่งลงตอนเล็งเสร็จ…
dive:186 PA:187 TA:188 DIVE_DOWN:190 DIVE_POUR:190 DIVE_STEP:190 diveDist:191 lastTime:192 lastHeadT:192 headRight:192 bodyState:192 filtered:192 shape:193 gate:246 rune:248 shadowMat:249 shadow:250 ringMat:251 ring:252 glyphMat:253 glyphHi:254 glyphPath:255 water:262 splashGeometry:265 lowWaveGeometry:266 splashBursts:267 pulse:273 outerRing:274 dropletMat:275 drops:275 transform:277 gateAt:278 sprayMaterial:300 spray:300 curlCurve:302 foamMaterial:303 foam:304 particles:305 foamParticles:305 rand:306 bodySprayAt:307 waveSegments:328 waveSheets:328 wavesAt:335 currentConfigs:350 currentMaterial:357 currentSegments:362 currentSides:362 currentMeshes:362 currentPoint:370 currentSpray:377 currentParticles:378 currentsAt:379
§443 เล่น
WDG_YAW:444 wdgGet:445 wdgStart:446 wdgDive:453 wdgKeep:456 wdgEnd:457 wdgTick:458

## js/71-perfhud.js (72) — 
PERF:9 perfFrame:12 perfDom:26 perfStats:34 perfGraph:38 _gpuName:51 gpuIntegrated:52 perfRows:53 perfPanel:68 perfText:69

## js/72-dash-pose.js (84) — 
DPOSE:12 DPT:24 _dpQ:25 _dpX:25 _dpP:25 dpMix:26 dpKnees:28 dpStyle:36 DPDBG:41 dashPose:42 dpApply:74

## js/73-tune.js (125) — แผงปรับค่า 🎚️ (F8 / ปุ่ม "ปรับค่า" ในเมนูพัก และหน้าแรก) — ปรับตัวเลขในเกมสดๆ แล้วเซฟลง …
TUNE:8 tuneNum:9 tuneBuild:15
§64 ใช้ / เก็บค่า
tuneSetVal:65 tuneApplyFile:68 tuneJson:72
§75 หน้าตา
tuneOpenF:80 tuneFmt:81 tuneRow:82 tuneRefresh:85 tuneMsg:93 tuneToggle:94 tuneEdit:98
§122 API สำหรับเครื่องมือแยก tune.html (เปิดเกมใน iframe แล้วเรียกผ่าน WD)
tuneDump:123 tuneSetKey:124

(85 files, 20727 lines)
