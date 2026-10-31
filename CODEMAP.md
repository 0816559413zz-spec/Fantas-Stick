# CODEMAP — where everything is (auto-generated: `node tools/codemap.js`, re-run after editing js/)
Game = `index.html` (HTML only + loader) + `css/game.css` + `js/NN-*.js`. The loader fetches the js files **in number order and joins them into ONE module** → every file sees every other file's top-level names (no import/export). Code that runs at load time may only use things from earlier files. New file = add its name to `FILES` in index.html.
Format: `name:line` = top-level function/const/let in that file. `§line title` = section header comment. Errors show `game.js:N` → `srcAt(N)` in the console gives file:line.

## js/01-core.js (22) — แกนกลาง: import Three.js + ฟังก์ชันพื้นฐาน ($ rnd clamp lerp store to…
$:12 rnd:13 clamp:14 lerp:15 dist2:16 lerpAng:17 esc:18 shuffle:19 store:20 toastT:21 toast:22

## js/02-city.js (165) — เมืองมักเกิ้ล — กล่องเทา (designs/city-bot-battle.md ขั้น 3)
CITY_PLAN:6 CITY_ZN:11 CITY_PLAZA:12 genCity:13 cityProps:126
§138 เล่นได้ทุกโหมด (ขั้น 6): พื้นที่เล่นต่อโหมด (กำแพงล่องหน AREA) + จุดเ…
CITY_MID:140 CITY_C2:140 cityModeData:141 mapArea:157 AREA:158 areaClamp:160

## js/02-citytest.js (28) — แมพทดสอบเมืองใหญ่ (กล่องเทา) — ใช้วัดความลื่นของเครื่องยนต์ก่อนสร้างเ…
CITY_N:4 CITY_B:4 CITY_ROAD:4 genCityTest:5 cityTestProps:19

## js/02-data.js (373) — 
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
HOUSES:227 HAIRC:232 HAIRSTY:234 WOODC:237 WOODN:238 WCOREC:239 WCOREN:240 WANDSTY:241 WANDN:246 WANDNN:261 EYEC:262 SKINC:263 CLOAKC:264 TIESTY:265 LOOKK:266 LOOKN:266 lookStr:267 parseLook:268 randLook:269 LOOKS:270 LOOKP:270 KITS:270 getKit:271 getLook:272 CREST_SH:273 CREST_PAT:274 starPts:279 CREST_ANI:281 crestSVG:287 houseColor:295 TEAMC:296 TEAMN:296 NOBROOM:298 MODES:299 PDEF:310 EDEF:337 POOLS:350 CDK:360 BUFFS:363 BRAR:372 rollRar:373

## js/03-spells-core.js (224) — 
ICONS:8 ICOALIAS:9 hasIco:10 ICOBASE:12 icoURL:13 ICO:14 icoTint:15 icoHTML:24 PATHS:25 SPELL_LIST:34 SPELLS:34 defSpell:35 SLOTK:36 BRMAP:36 KITP:37 parseKit:38 cleanKit:54 setKit:55 pathReset:58
§60 สถานะ (ใช้ได้ทั้งผู้เล่นและศัตรู)
isBig:61 ccScale:63 ccTouch:64 addStun:65 addRoot:66 addFreeze:67 addSlow:72 addChill:73 ignite:78 shock:86 knock:87 addWard:88 addFrostSlow:90 frostSlow:91 moveMul:98 BRN_MAX:100 addBurn:101 addXBurn:103 addPoison:104 addSil:105 addFear:106 addBlind:107 addMark:108 healT:110 tickStatus:115 clearStatus:135 fxMask:136
§138 วัตถุในสนามที่คาถาสร้าง: โซน / ฟ้าผ่าหน่วงเวลา / กำแพง / ช่องร่ายต่อเ…
foesIn:139 shieldFaces:146 aoeHit:152 addZone:158 updateZones:163 addStrike:174 updateStrikes:175 addWall:176 updateWalls:177 updateChan:181 updateSpells:185 aimPoint:187 aimWall:199
§201 ตัวช่วยคอมโบ (ทุกสายใช้หลักเดียวกัน: ตั้งต้น → ต่อยอด → ปิดจบ)
ROLE_N:203 takePoison:204
§206 ความสามารถพื้นฐาน (คลิกซ้าย) ของแต่ละสาย: สะสมสถานะตั้งต้นให้เองทุกๆ …
PBASIC:207

## js/04-frost-mech.js (106) — สายน้ำแข็ง: ประชิด/ไกล (V) • ฟันดาบ/ขวาน • ไถลน้ำแข็ง • พื้นน้ำแข็ง/ภ…
frostBoom:3 meleeHit:10 mirrorPos:21 frostBasic:22 frostSlam3:46 frostSlam:54 frostDash:60 addIce:65 updateIces:66 updateWaves:82 _stO:96 _stL:96 groundH:97

## js/05-terrain.js (44) — พื้นสูงต่ำ (แผนที่จากไฟล์ Blender — กติกาฝั่งคนปั้นใน MAP-DESIGN.md)
TERR:5 TSTEP:6 TSLOPE:6 terrT:7 floorAt:12 terrSolid:14 terrMove:21 updateGlaciers:30

## js/06-pyro.js (185) — สายไฟ: ยิงปกติ 2 โหมด / โล่ระเบิด / พุ่งชาร์จ
pyroBigBoom:5 pyroBall:13 pyroBasic:14 addOrbs:31 pyroParry:32 pyroBlock:33 launchOrbs:35 pyroDash:42 FPATH:62 pyroPathEnd:63 updateFirePaths:68 DF_R:99 dragonfallDive:100 dragonfallTick:101 dragonfallBoom:116 pyroSnap:137 colossusTick:147 updateERings:166

## js/07-frost-spells.js (33) — 
frostGlacier:11

## js/08-storm.js (214) — 
ST_MAX:5 stGain:6 stSpend:7 stormCone:9 stormLineFoes:14 stormBasic:18 stormTri:41 stormDash:48 stormDashTick:61 stormShieldBlast:69 stormTick:78
§87 สกิล 1 (ฟรี): เส้นสายฟ้า — ชี้ขึ้นแล้วกดลง 0.5 วิ จากนั้นสายฟ้าผ่าเป็…
stormLine:90
§96 สกิล 2 (1 stack): ดูดความเร็ว
§105 สกิล 3 (2 stacks): ฟ้าผ่าสามครั้ง — วางจุดครั้งเดียว ฟ้าผ่าจุดเดิม 3 …
TS_R:122 TS_SPD:122 TS_SEEK:122 updateTCells:123
§131 สกิล 4 (1 stack): ออร์บสายฟ้าคู่ — ลอยหลังเรา Dash โดนศัตรู = ออร์บพุ…
SORB_T:135 stormOrbLaunch:136
§142 สกิล 5 (2 stacks): Railgun — เส้นเตือนเหลือง 0.8 วิ (อัลติ 0.5) แล้วล…
stormRailFire:145
§152 อัลติ: ร่างเทพสายฟ้า 10 วิ
§155 สกิล 6 (3 stacks): ลูกสายฟ้าโดม — ทะยานขึ้น บินเล็ง 3 วิ คลิกยิงลูกสา…
stormDomeTick:156 stormDomeFire:171 stormDomeSlam:179 updateStorm:184

## js/09-earth.js (245) — 
EARTH:10 E_SH:10 E_CRUSH_PUSH:10 E_CRUSH_SLIDE:10 E_ENV:10
§14 ตัวช่วย
eOn:15 eStand:16 eNoStand:17 eSegD:19 eAdd:20 eCollide:22 eProjHit:29 eKill:32
§34 ทุกเฟรมของผู้เล่นสายดิน (เรียกจาก updatePlayer หลังส่วนโล่)
earthTick:35 earthSpd:61 earthShHit:63 earthBreak:64 earthReset:66
§68 ท่าพื้นฐาน (คลิกซ้าย)
earthBATarget:69 earthBasic:73 earthPunch:82 earthCBStart:88 earthCBSlam:89
§93 Dash: Stand Rampage / Rock Boost Escape
earthDash:94 earthRampEnd:113
§118 สกิล 1: Stonebreaker
§129 สกิล 2: Mud Swamp
§134 สกิล 3: Tectonic Crush
earthCrush:149
§160 สกิล 4: Dust Burst
§166 สกิล 5: Terra Auger
eAugAim:172 earthAugFire:173 earthMound:184
§187 อัลติ: Wrath (v2)
earthPillarThrow:195 earthWrathTick:206 earthWrathDrill:217 earthWrathEnd:222
§225 ทั้งสนาม: สิ่งก่อสร้างพัง / ฝุ่นหมดเวลา / Stonebreaker ชนกำแพง
updateEarth:226 earthSnapP:235 earthSnapW:237

## js/09-other-paths.js (196) — 
§65 สัตว์เวท (minion): AI ฝั่งโฮสต์
MIND:66 summonMin:72 minTarget:81 minShoot:88 updateMins:93 aimTarget:133
§180 ร่ายคาถา
castSlot:181 castUlt:196

## js/09-wind.js (259) — 
WINDP:8 W_BA:9
§22 ตัวช่วย
wOn:23 wGain:24 wSeg:26 wFoeNear:27
§29 ทุกเฟรมของผู้เล่นสายลม (เรียกจาก updatePlayer หลังส่วนโล่)
windTick:30 windSpd:51 windFlyZ:53 windReset:56
§58 ท่าพื้นฐาน (คลิกซ้าย): ใบมีดลม / ดูดลมชาร์จเกจ / GaleBurst
windBasic:59 windGaleBurst:78 windGBTick:81
§87 โล่ปีก
windShieldBurst:88
§92 Dash: ผลักศัตรูข้างหน้า + ดีดตัวเราถอยหลังลอยกลางอากาศ
windDash:93
§103 กำแพงลม Aegis Gale
windWallMake:104 windWallStop:112 windWallBoom:113 windDmg:118 windProjHit:122 windWallHurt:125 windCollide:127
§133 ทั้งสนาม: GaleBurst / กำแพงลม / ชนกำแพง
updateWind:134
§159 Windrift: ชาร์จปีก → พุ่ง 200 แบบ Jett → ลงท่าฮีโร่ → 1 วิต่อมาลมแรงต…
windDriftTick:160 windDriftWind:167
§174 Vortex Bind: ทอร์นาโด 3 อันโค้ง 45° ห่าง 200 → 0.6 วิ ดึงกลับมาหยุด 6…
windVortexTick:175
§186 Void Spheres: ลูกหลุมดำลม 3 ลูก ลากศัตรูตามทาง (ไม่เกิน 200) ชนกำแพงล…
windVoidFire:187 windVoidTick:189
§201 Featherwing: บิน 5 วิ → กดอีกครั้งสะบัดปีกไปข้างหน้า (เอียงลงพื้น) → …
windFlyTick:202 windFlick:204
§210 อัลติ Eye of Heaven
windUltTick:213 windFloatZ:227 windSnapP:230 windSnapW:231
§234 สกิล

## js/10-net.js (183) — เครือข่าย (PeerJS / WebRTC)
PREFIX:4 NET:5 RC:9 TURN_SERVERS:12 ICE:13 PEER_OPT:14 TURN_URL:16 ICE_READY:18 JN:22 LAG:24 lagDo:25 hostSend:26 LOBBY:27 genCode:28 sendAll:29 NETD_KEYS:33 NETD:33 netDeltaReset:34 netDelta:35 NETU:47 netUndelta:48 setStatus:54 hostGame:56 hostPeer:64 netConnect:83 joinWatch:94 joinFail:109 netLost:115 joinGame:130 joinPeer:141 clientOnData:156 leave:171 leaveRoom:173

## js/11-host.js (391) — 
G:4 EVL:4 EVN:4 hostLast:4 tickN:4 emit:5 feed:6 banner:7 plist:8 cleanName:9 freshStats:11 newPlayer:18 emptyInput:21 frameOk:23 addPlayer:24 initHostLobby:33 lobbyMsg:40 broadcastLobby:41 INPN:43 hostOnData:44 hostDrop:74 hostRemove:83 validate:96 hostStart:107 hostToLobby:133 MIDJOIN:140 midJoin:141 CHATT:157 chatRelay:158 emoHost:166 resetBody:168 fmap:174 spawnPts:175 teamPts:177 placeAll:178 respawn:190
§209 ลูปหลักฝั่งโฮสต์
hostTick:210 angDiff:224 cH:226 vR:227 updatePlayer:229 hitProp:378 damagePropsIn:385 nearUseProp:386 useProp:387

## js/12-buildings.js (498) — สิ่งปลูกสร้างที่พังเป็นชิ้นย่อย (บ้าน) แบบ Battlefield — คู่มือเต็ม: …
BLDDEF:8 BLD_PIECES:10 BLD_GRID:11 BLD_DOOR:13 BLD_FIRE:14 BLD_ICE:14 BLD_ROOF_MIN:14 BLDG:15 BLDON:15 genBldg:16 bldRect:26 bldChunk:28 bldAlive:35 bldLocal:36 bldWorld:37 rectDist:38 bldNear:39 BLD_MOUND:42 bldGone:43 bldMoundAt:44 bldMoundH:45 hitBldPiece:47 breakBldChunk:58 bldSupport:66 damageEnv:86 bldRay:101 _sgRB:109 aimClip:111 aimRay3:118 bldPieceAt:134 projEl:145 bldPush:150 collideBld:156 updateBldg:174 bldSnap:187 bldParse:193
§197 ของบังในแผนที่ไฟล์ที่พังได้ (หิน เสา รูปปั้น ต้นไม้ โคมไฟ ลัง ...) — …
BRKDEF:201 BRK_M:201 BRK_MCOL:201 BRK:202 genBrk:203 brkApply:210 brkStage:214 hitBrk:215 damageBrkIn:223 brkSnap:229 brkParse:230
§231 ตารางช่อง (spatial grid) สำหรับแมพใหญ่: หาเฉพาะของใกล้ ๆ แทนวนทุกชิ้น…
SG:234 sgObs:235 sgProps:235 sgGrid:237 sgNear:244 _sgCR:249 _sgCW:249 _sgCB:249 _sgCO:249 _sgPO:249 _sgPB:249 _sgPP:249 _sgM:249 _sgE:249 _sgA:249 _cwLast:251 collideWorld:252 shoot:291 eShoot:312 foesOf:319 breakShield:326 ULT_RATE:328 ultActive:329 gainUlt:330 lifesteal:331 damage:333 playerDown:390 killProj:411 explode:420 hitTarget:432 updateProjectiles:448

## js/12-city-dmg.js (239) — เมืองพังได้ (designs/city-bot-battle.md ขั้น 4) — ข้อมูลที่ทุกเครื่อง…
CITY_FL:8 CITY_PW:8 CDMG:9 CITYD:12 cityOn:13 cityLayout:15 cityReset:25 cityApplyBox:41 cityApplyItem:42 cityHex:43 cityMark:44 cityRampSync:45 cityPanelAt:47 cityHitPanel:52 cityHitItem:63 cityHitObs:72 _sgCD:77 cityDamageIn:79 cityTick:90 _sgCM:100 cityMoundH:101 cityMounds:109
§115 ข้างในตึก (2026-10-28 ผู้ใช้: เดินเข้าได้ 1–3 ชั้น มีทางขึ้น • ผนังนอ…
CIN:119 cityInterior:120 cinSlabOn:149 cinOpenPanel:151 cityIwHit:153 cityRampHit:155 cinIwSegs:158 cinIwRects:159 cinSecAt:160 citySecHit:162 cinIn:164 cinHole:165 cinRampH:166 _sgCI:167 cityBoxGrid:168 cityRoomAt:169 cityFloorH:171 cityCeilH:176 cinWallRect:180 cityCollideIn:183 cityProjIn:193 _sgCS:211 citySolidAt:212 cityRay:221 cityRoomBox:224 citySnapB:225 citySnapS:226 cityParse:228

## js/13-enemies.js (168) — ศัตรู (โหมด Co-op)
spawnEnemy:2 setupWave:19 bossPhase:36 enemySlam:44 updateEnemies:55

## js/14-mode-rules.js (105) — กติกาของแต่ละโหมด
hostPick:2 clearField:10 modeLogic:11 endMatch:80 matchOver:105

## js/15-arena.js (71) — 
AR_SIDE:7 AR_TEAM:7 AR_MAX:7 arPads:8 arOn:9 arState:10 arBusy:11 arReady:13 arNames:21 arenaTick:22 arStart:43 arEnd:51 arReset:57 arAddBots:64

## js/15-bot.js (115) — 
BOT_LV:8 botPersona:15 BOT_TEAM:16 BOT_MAX:16 bots:17 humans:18 botInZone:20 spawnBot:26 OWNED_K:39 clearOwned:40 removeBots:41 botPickTarget:43 aiBot:56 trBotCmd:105 botDebug:115

## js/15-botnav.js (134) — 
NAV_MAPS:13 NAV_EYE:13 NAV:14 navOn:16 navSig:17 navEnsure:24 navBuild:30 navCell:47 navWalk:48 navRay:50 navFree:55 navPath:61 _navFoe:79 botThink:82 botNav:88

## js/15-modes.js (408) — 
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
r1:359 DEFP:361 packP:362 unpackP:363 makeSnap:364 PROF:382 pf:383 hostLoop:384 HLW:398 pingN:408

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

## js/19-client.js (248) — 
cv:4 cx:4 DPR:5 SW:5 SH:5 resize:6 VIEW:12 screen:13 lastBuffKey:13 overShown:13 lastCount:13 PARTS:14 TEXTS:14
§15 งบเอฟเฟกต์ (VFX budget)
VFXB:20 _apush:21 vfxQual:29 vfxBegin:31 vfxEnd:34 vfxOnce:36 vfxExtra:38 PCOL:39 setScreen:41 onLobby:53 onSnap:59 snapApply:63
§72 บัฟเฟอร์ snapshot (ลูกข่าย, ผู้ใช้ 2026-10-22 "เล่นออนไลน์ให้ลื่น")
SBUF:75 NETOLD:76 sbufReset:77 sbufPush:78 sbufAdvance:88
§100 ทำนายตัวเอง (ลูกข่าย): ตัวเราขยับทันทีที่กด ไม่ต้องรอโฮสต์ตอบ
PRED:103 predictMe:104 myPos:125
§127 เอฟเฟกต์
burst:129 smoke:140 ring:141 floatText:142 shake:143 wandPos:144 impactFX:146 explosionFX:163
§175 เอฟเฟกต์คาถาใหม่
ZV:176 COLB:176 WVV:176 GLV:176 ICEV:176 SLV:176 ULTV:176 OBV:176 _iceDisc:178 _iceEdge:179 _iceSpk:180 iceFloorMat:181 _icePlane:182 _icePathMat:183 makeIceFloor:184 updateIceFloors:208 FLASHM:219 FLASHING:220 flashModel:221 endFlash:230 tickFlash:231 GHOSTM:233 SOLIDM:233 ghostOf:234 setGhost:240 hitSparks:248

## js/20-vfx-pyro-storm.js (414) — Dragonfall (ภาพ)
makeDfCircle:3 DFV:20 dfCracks:21 updateDfCracks:31 dragonfallFX:32
§84 สายฟ้า (ภาพ)
TBN:87 TBA:87 TBF:87 TBMAX:87 _tv:88 _tt:88 _ts:88 _tw:88 tbLayer:90 TBL:95 TBC:96 _tcc:97 tbGet:98 tbolt:100 tboltP:108 tbWrite:109 updateBolts:117 LATER:133 STV:133 SBV:133 SDV:133 TSV:133 CLV:133 stTgPos:135 STCLAW:139
§143 รอยกรงเล็บ (อัลติสายฟ้า): รอยข่วน 3 เส้นโค้งปลายแหลมขนานกัน ตั้งขวางห…
clawGeo:146 clawRakes:151 updateClaws:165 later:173 stFade:174 stBeam:175 shellPt:180 updateStormV:181 _ev:217 GODPTS:219 bWorld:221 stormClawSwipe:225 stormFX:252 STHUD:369 drawStormHud:370

## js/21-vfx-frost.js (205) — น้ำแข็ง (ภาพ): ชิ้นผลึก/หนาม/แผ่นน้ำแข็งชั่วคราว (โผล่ → ค้าง → หด) •…
FRV:2 _cryG:3 _spkG:3 _plateG:3 _hexG:3 _iceFxM:4 _frostM:4 iceFxM:5 frostM:6 ICEP:8 _im4:8 _iq:8 _ie:8 _ip:8 _is:8 icePool:9 iceBit:10 iceChips:13 updateFRV:14 iceRing:24 chillFX:25 makeSlash:41 _wbGeo:49 crescentGeo:51 makeWaveBlade:54 WGH:68 updateSlashes:69 _glGeo:82 _glMat:82 _glMat2:82 makeGlacier:83 updateGlacierVis:114 updateOrbShots:123 updateZV:133 WM3:205

## js/22-models.js (254) — โมเดลจากไฟล์ (.glb จาก Blender) — ข้อตกลงฝั่งคนปั้นอยู่ใน ASSETS.md
MODELS:5 modelManifest:6 gltfLoader:11 loadModel:16 modelInst:30 modelOr:31 prefetchModels:43
§45 Animation จากไฟล์ (Blender Actions) + โมเดลตัวละคร/ศัตรูจากไฟล์
ANIM_ALT:48 makeAnimator:49 animResolve:54 animPlay:55 animTick:64 lookTint:82 tintModel:86 useFileModel:101 rigStage:119 fileVariants:121 fileBroom:122 _rq:126 _rq2:126 _rq3:126 rigBind:127 rigStd:135 rigSync:136 FILE_MODELS:147
§149 VFX จากไฟล์ (รายละเอียดฝั่งคนทำอยู่ใน ASSETS.md)
VFXL:155 FLIPL:155 FLIPS:155 prefetchFx:156 playVfx:157 vfxSeq:203 flipTex:208 playFlip:216 fileFx:231 zoneFx:238 clearVfx:239 updateVfx:240

## js/23-props-bld-view.js (407) — prop ฝั่งแสดงผล
PROPV:2 propFallback:4 farCull:33 syncProps:34
§51 บ้านพังเป็นชิ้น ฝั่งแสดงผล
BLDV:54 CHARM:54 DEBRIS:54 BLD_WALLC:55 _bldIce:56 _halfRoof:56 charMat:57 bldIceMat:61 halfRoofGeo:63 bldMats:71 bldFallback:77 bldFilePiece:113 bldHasChunks:121 bldFallbackChunks:123 bldRubble:131 _moundMat:142 bldMound:143 BLD_RUBBLE_H:165 bldBuild:166 syncBld:190 bldDebris:223 bldChunkFall:251 updateDebris:264 debrisDrop:279 debrisCap:281 clearDebris:282 drawPropHint:283 syncWalls:291
§309 ของบังในแผนที่ไฟล์ที่พังได้ ฝั่งแสดงผล (สถานะจาก BRK[].st — host js/1…
BRKV:312 BRK_COL:312 brkSetup:313 BRK_CM:331 brkCrackMat:332 brkClip:348 brkYc:363 brkStump:365 brkSync:375 BRK_ZERO:396 brkFall:398

## js/24-minions-view.js (68) — สัตว์เวท: โมเดลโปร่งแสง + ซิงก์จาก snapshot (MN)
MM3:2 makeMinion:3 syncMins:36 drawMinBars:58

## js/25-efx.js (300) — efxFX: ภาพของ event "efx" ทุกคาถา (หนึ่ง case ต่อหนึ่งเอฟเฟกต์)
efxState:4 efxFX:15

## js/26-fx-events.js (240) — fx(ev): เอฟเฟกต์+เสียงของทุก event จากโฮสต์ • statusFX (สถานะบนตัว) •…
statusFX:3 fx:27
§208 overlay: เลือกบัฟ / สรุปผล
choosePick:209 syncOverlays:214 showOver:235

## js/27-world.js (268) — 
S3:4 tx:4 tz:4 CITY_KERB:7 cityKerb:8 GY:9 TW:9 hdr:10 gl:12 scene:18 cam:20 composer:21
§22 ท่อภาพ (post-processing): ฉาก → ชั้นเอฟเฟกต์นุ่ม (FXPass) → แสงฟุ้ง →…
rpass:25 fxScene:27 SOFTU:29 SOFT_GLSL:30 FXMATS:32 fxMat:33 softify:35 HAZE_U:40 AOU:44 GFX:49 AO_ON:50 AO_HEAD:51 AO_CALC:55 AO_COPY:69 AO_RT:85 fxPass:104 bloom:105 GRADEU:110 gradePass:126 aaPass:143
§145 คุณภาพกราฟิก: auto = ปรับความละเอียดเองตาม FPS / high = สวยสุด / low …
QUAL:146 QUAL_NAME:147 qualPR:148 applyQuality:154 qualTick:172 texCanvas:183 glowTex:184 stoneTex:185 runeTex:191 glowMats:199 glowMat:200 STONEM:202 stoneMat:203 shadowAll:204 SKY:207 hemi:227 moonL:229 LDIR:233 setSky:234
§242 เงาตามผู้เล่น
SHD:246 _shF:247 _shR:247 _shU:247 _shC:247 _shY:247 shadowFollow:248 LPOOL:267

## js/28-city-build.js (344) — เมืองมักเกิ้ล (ลอนดอน) — ภาพ • ข้อมูลอยู่ js/02-city.js • โมเดลจาก as…
CITY_WIN:4 cityWinTex:5 cityEmTex:10 cityBoxGeo:16 buildCity:21
§102 ข้างในตึกกลวง (ภาพ — ผัง I จาก cityInterior js/12-city-dmg)
cityInteriorView:106 cityHideIn:147 cityMoundView:153
§176 ชุดโมเดลลอนดอน (assets/city/*.glb จาก assets/src/city_kit_build.py)
CITY_STY:181 CITY_VEH:188 cityFacade:190 CITYK:203 _cZ:204 _cT:204 _cR:204 _cC:204 cityKitLoad:205 cityCull:227 citySet:233 cityTint:235 cityPools:237 cityShowBld:243 cityRubble:250 CITY_FALL:258 CAREA:261 cityAreaSync:262 cityViewSync:274 cityDebris:316 cityFX:325

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

## js/29-characters.js (436) — ระบบผ้า (เสื้อคลุมพลิ้วตามการเคลื่อนที่)
makeCloak:2 updateCloth:10 wandNamed:34 wandSparks:83
§92 โมเดลนักเรียนเวทมนตร์
SHGEO:94 SHMAT:94 SHTEX:94 sGeo:95 sMat:96 bMat:99 matKey:101 bodyPatch:107 BODYM:114 bodyMat:115 plainMat:120 mergeBody:121 sStripe:157 hashStr:158 stripeTex:159 shieldMat:160 addStatus:168 makeStudent:174 makeEnemy:281 keepTex:419 keepMatSet:420 disposeMaterial:421 disposeTree:427 disposeObj:434 PM3:435 EM3:435 JM3:435 clearDyn:436

## js/30-particles.js (265) — อนุภาค 2 ชั้น: แสงเรือง (additive) + ควัน (normal)
PMAX:2 PGLOW_OCC:6 PLIT:6 makePointSys:7
§46 เปลวไฟ: FLAME_STYLE 0 = อนุภาคกลมเรืองแสง (ไม่ใช้รูปเปลว) • 2 = แบบให…
FLAME_STYLE:48 PTIME:49 NOISETEX:51 FLAMETEX_V1:57 FLAMETEX_V2:62 PSYS:72 FLAMELUT:89 FLAMECOL:92 flame:93 PFB:102 ptexUse:103 ptexLoad:127 colCache:129 col3:130 CURL:133 curlAt:134 updateParticles:136
§172 เอฟเฟกต์รูปทรง: แฟลช / วงแหวน / โดม / รอยไหม้ / สายฟ้า / แสงชั่วคราว
SHAPES_Q:173 SHAPES:173 FLASHL:173 LINES:173 LREQ:174 ringGeo:175 ringVGeo:176 arcGeo:177 domeGeo:178 fullGeo:179 discGeo:180 decalTex:181 FX:182 jag:196 spawnShape:204 updateShapes:231 _cp:250 updateLights:251

## js/31-camera.js (131) — กล้องมุมหลังไหล่ (แบบ Hogwarts Legacy)
yaw:2 pitch:2 lastPh:2 locked:2 CAMRS:3 SENS:4 saveSet:5 applySettings:6 camPos:14 camLook:14 overlayOpen:17 showPause:18 hidePause:19 MAPCAM:20 PLACE:22 placeKey:23 updatePlaceGhost:31 _aimD:45 rayTerr:47 aimFromCrosshair:53 AIMZ:85 EZC:87 ESC:87 camRoomK:89 updateCamera:99 menuCamera:127

## js/32-stage.js (313) — เวทีเมนู/ล็อบบี้: ห้องโถงมืด แท่นวงเวททอง เทียนลอย (ฉากแยกจากแผนที่)
stage:2 STAGE:5 STAGE_Y:6 stageSpots:58 stageChar:74 POSES:81 stageIdle:87
§109 เอฟเฟกต์หน้าเมนู (โชว์เฉพาะหน้าแรก ไม่โชว์ในล็อบบี้/หน้าสร้างตัวละคร)…
stageMenuFx:135 _sv:146
§147 ฉากประจำบ้าน (โผล่ตอนเลือกบ้านในหน้าสร้างตัวละคร)
CRESTTEX:148 crestTex:149 crestBanner:157 buildHouseEnvs:165 TONE0:213 _tc:214 stageTone:215 stageScreen:228 renderStage:229 drawStageLabels:284

## js/33-pyro-view.js (281) — ภาพของสายไฟ (pyroFX: ชาร์จ/พุ่ง/ดีดนิ้ว/กลายร่าง/Dragonfall/Colossus)…
§2 sync ตัวละคร/ศัตรู/ลูกเวท กับ snapshot
localVel:3
§11 ภาพของสายไฟ: ชาร์จลูกไฟ / ย่อตัวชาร์จพุ่ง / วงเวทพ่นไฟ / ดีดนิ้ว / กล…
_pw:12 simOf:13 makeColossus:14 makeMagicCircle:67 _fsGeo:77 fireShieldFX:79 pyroFX:98

## js/34-frost-view.js (260) — ภาพของสายน้ำแข็ง: ดาบ/ขวานน้ำแข็งที่ปลายไม้ ท่าฟัน โล่อัศวิน ไถล แช่แ…
iceMat:2 iceRim:3 makeIceSword:4 makeIceAxe:23 makeKiteShield:39
§51 อาวุธน้ำแข็งลอย (ผู้ใช้ 2026-10-22: "ร่ายคาถาให้ดาบฟันเอง ระยะเท่าเดิ…
FWS:54 FWA:54 _fwM:55 _fwM2:55 _fwX:55 _fwY:55 _fwZ:55 _fwP:55 _fwS:55 _fwQ:55 _eo:56 _ei:56 _ss:56 fwAim:58 fwWeapons:59 FWP:61 FWT:61 fwChop:62 fwSweep:63 FF_RISE:64 fwIdle:65 fwSwing:68 FWL_N:80 fwLink:81 fwMat:84 frostFX:85

## js/35-sync.js (507) — ซิงก์ผู้เล่น/ศัตรู/ลูกเวทจาก snapshot + ฉายตำแหน่งลงจอ (ป้ายชื่อ/ตัวเ…
§2 ท่าร่ายคาถาแบบนักเวทในหนัง Harry Potter (ผู้ใช้ 2026-10-22: "ยิงปกติท…
CPOSE_T:7 _ce:7 _cs:7 _cb:7 AMP_B:9 AMP_S:9 CP_BEND:10 CPOSE:12 _cpT:20 _cpR:20 CGUARD:20 CP_STEP:21 CPCOL:22 castStyle:23 castStart:24
§25 ท่าร่ายสกิล / อัลติ / โล่ (ผู้ใช้ 2026-10-22: "เกือบทุกสกิลควรมีการเห…
CANIM:30 SKANIM:55 skAnim:60 _caT:61 _caR:61 skillPose:62 _g2:87 wandTwoHand:88 CBLOCK:95 blockPose:96 castPose:101 lateSkillPose:107 castPose0:108 syncPlayers:137 syncEnemies:220 projGeo:258 tailGeo:259 _t1:260 makeProj:261 _a:281 _b:281 PJFX:283 syncProj:284 _awT:370 animateWorld:371
§412 ฉายตำแหน่ง 3D ลงจอ (ป้ายชื่อ / ตัวเลขดาเมจ)
_v:413 toScreen:414 burnNum:421 drawLabels:428 drawTexts:459 HITM:473 DIRI:473 drawXh:475 drawCrosshair:485

## js/36-modes-view.js (164) — 
ROLE:4 KC:4 roleShowT:4 onPriv:5 MO:10 BREATHS:11 clearModeObjs:12 ITEMC:21 makeItem:22 syncModeObjs:34
§133 หน้าประชุมโหวต (หาลอร์ดโวลเดอมอร์)
meetKey:134 myVoted:134 castVote:135 syncMeeting:141

## js/37-render-loop.js (81) — ลูปเรนเดอร์
lastFrame:2 HSTOP:5 hitStop:6 FXSTUDIO:8 frame:9 _fpsAcc:18 _fpsN:18 render:19 renderGame:61

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

## js/41-debug.js (144) — 
botBrain:6 _obsKeep:48 balArena:49 balReset:50 balDuel:54 balTour:69 balCoop:83 balSpellTest:99
§118 Service Worker (sw.js): เก็บไฟล์เกมไว้ในเครื่อง เปิดครั้งต่อไปเร็วขึ้…
SWK:119 swSetup:120

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

## js/45-fx-runtime.js (346) — VFX Studio runtime — เล่นเอฟเฟกต์จากไฟล์ข้อมูล assets/fx/<กลุ่ม>/<ชื่อ>.fx.json (แผน desi…
FXR:9 FXDEG:10
§11 โหลด
fxFetch:12 fxDefaults:13 fxBoot:14 fxOverrides:24 fxLoad:27 fxData:31
§32 ค่า: ตัวเลข / สูตร / ช่วงสุ่ม / เส้นโค้ง / สี
_fxExpr:33 fxExpr:34 fxEval:38 fxV:40 fxIsCurve:47 fxCurve:48 fxG:56 fxCol:57 fxPal:58
§59 ตำแหน่ง: กรอบของเอฟเฟกต์ (+x ขวา, +y ขึ้น, +z ทิศเล็ง) → พิกัดแผนที่
_fxw:60 fxAnchor:61 fxBase:64 fxLocal:67 fxDir:68 fxYawV:69 fxPos:70 fxPlace:71
§72 เล่น / หยุด
fxPlay:73 fxStart:74 fxStop:83 fxKill:84 fxClearAll:85 fxGate:87
§89 ทุกเฟรม
updateFx:90
§106 สร้างชั้น
fxN:107 fxSpawn:108 fxTick:142 fxEnd:153
§160 อนุภาค
_fxrnd:161 fxUnit:162 fxCone:163 fxEmit:165 fxPart:182
§197 รูปทรง 3D
FXGEO:198 fxMerge:199 fxRibbon:204 fxGeo:210 fxEnergyMat:230 fxToonMat:242 fxMeshMake:250 fxMeshTick:268 fxFlipTex:283
§288 หางแสง / รอยฟัน
fxTrailTick:289
§295 สายฟ้า
fxBolt:296
§302 ฟังก์ชันในโค้ดที่ไฟล์เรียกได้ (ชั้น t:"code")
FXCODE:303
§316 ผูกกับ event ของเกม (assets/fx/bind.json) — เรียกจาก fx(ev)
fxLoopName:318 blzFxName:319 fxLoopKeep:320 fshHitFx:322 fxBind:325
§336 แม่แบบ playFx เป็นไฟล์ (assets/fx/tpl/*, sig/*, rec/*)
fxTpl:338

## js/46-fx-make.js (264) — 
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
FXMP:196 fxMPMat:197 fxMPGroup:201 _mpM:204 _mpQ:204 _mpE:204 _mpP:204 _mpS:204 fxMPUpdate:205 fxMPClear:214 fxMPSpawn:216
§220 อากาศบิดเบี้ยว (ชั้น warp) — ไอร้อน / คลื่นกระแทกบิดภาพ / เลนส์โป่ง •…
fxWarpMake:222 fxWarpTick:234
§240 ไฟ 3 มิติจากการจำลอง (ชั้น vol) — ไฟล์รูปแบบเดียวกับที่เพื่อน bake จา…
FXVOL:243 fxVolLoad:244 fxVolTex:248 fxVolSet:251 fxVolReady:252 fxVolMake:253 fxVolTick:256 fxPreAssets:261 fxAssetsWait:263

## js/47-earth-view.js (664) — 
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
earthClear:412 eMakeSO:417 syncEarth:433 earthFog:471 _eCamT:474 eAnim:475 eDebris:476 eWave:478 eAirWave:480 esbImpact:483
§490 event "efx" ของสายดิน (เรียกจากต้น efxFX) — คืน true = จัดการแล้ว
earthEfx:491 eWindOut:577 eAirCone:583 eDrillFly:585
§589 บึงโคลน (Mud Swamp + บึงจากเสาอัลติ): คลื่นกระเพื่อมจากกลางไปขอบ แล้ว…
earthMudZone:590 earthMudSink:597
§598 HUD ใต้เป้าเล็ง
ESM:600 eSmooth:601 ESF:604 eShieldFx:605 eChips:610 eShieldSegs:613 eShieldNum:627 eShieldArc:631 drawEarthHud:644

## js/48-ragdoll.js (227) — 
RAG:10 RAGJ:23 RAGB:29 RAGS:33 RAGMIN:37 RAGHINGE:39 _rv1:40 _rv2:40 _rv3:40 _rqa:40 _rqb:40 _rm:40 ragBones:41 ragBasis:48 ragTargets:56 ragStart:62 ragBack:88 ragFloor:89 ragStep:90 ragPose:155 ragWrite:170 ragRestore:182 ragEnd:186 ragTick:188 ragHideDead:222

## js/49-cloth.js (120) — 
CLOTH:10 CL_ROWS:22 CL_NC:22 CL_GAP:22 CL_IN:22 _clV:23 _clA:23 _clB:23 clPinK:25 clBind:27 clothSetup:30 clTargets:63 clReset:67 clCapsule:69 _clO:73 clWorld:74 clWorldHit:83 clStep:88 clDraw:100 clothTick:107

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

## js/51-warmup.js (109) — 
WARM:11 WARM_FXDIR:12 WARM_COMMON:12 WARM_X:13 WARM_Y:13 warmKeep:15 warmCompile:21 WARM_SKIP:24 warmFx:25 warmFxEnd:33 warmGather:35 warmPaths:37 warmStep:39 warmTick:54
§63 ภาพจากโค้ดของแต่ละสาย (เฟรมละฟังก์ชัน)
§72 อุ่นฉากเกมระหว่างรอในห้อง (ผู้ใช้ 2026-10-23: "กระตุกตอนเริ่มแมตช์แรก…
GWARM:77 gameWarmTick:78

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

## js/61-hub.js (883) — 
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
HL_SPOTS:737 HL_TEAM:738 hubLobbyLayout:739 hubLobbyTick:746 hubLabels:772
§786 หน้าโปรไฟล์ (UI ใน js/65 PRF)
PRF3:790 prfSpot:792 hubProfSet:801 hubProfShow:809 hubProfTick:810
§821 เรนเดอร์ (เรียกจาก renderStage — คืน true = วาดแล้ว)
hubRender:822

## js/62-hub-ui.js (302) — 
HUI_IMG:9 HMODES:10 HUI:15 HICO:17 hSvg:35 hHex:36 H_STAR:37
§95 สถานะหน้าจอ: menu / modes / room / off
hubUiState:96 hubMeChip:104 hubOnScreen:110
§119 เมนูแรก
hubJoinGo:122
§133 การ์ดโหมด
hubMxJoin:140 hubPickMode:153 hubFlipKill:166 hubRoomRect:167 hubFlip:168 hubLeaveRoom:184 hubUnflip:189 hubFlipEnd:202
§209 แผงห้อง (การ์ดที่ขยายแล้ว)
HUI_MAPN:210 hubLobby:211 hubRoomClick:273 hubKitChanged:292
§294 เริ่มต้น

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

## js/66-hud4.js (176) — HUD รอบ 4 (ผู้ใช้ 2026-10-23, designs/hud-full-mock.html)
H4E:5 H4:11 h4Pal:12 hud4Col:14 h4Parts:16 h4AuBits:21 h4Key:36 h4Ico:37 h4Build:38 h4Set:65 hud4Draw:66
§113 ไพ่สกิล: นาฬิกาทราย / ท่าใช้ / สลับตำแหน่ง
h4Glass:115 h4Bits:121 h4Fx:123 h4CardUse:125 h4GlassOut:129 h4Place:133 h4OrdKey:136 h4OrdLoad:137 h4Swap:140 h4Pick:143 h4AltKey:145 h4CardWire:149
§160 ไพ่อัลติ
H4SH:162 h4UltCard:164 h4UltUse:169 hud4Frame:173 hud4Hide:174 h4MapBox:176

## js/67-backdrop.js (139) — 
BACKDROP:8
§66 noise เล็ก ๆ (คงที่ต่อ seed)
bdHash:67 bdNoise:68 bdFbm:69 bdEdge:71 bdRing:73 bdPaint:79 bdTree:82 buildBackdrop:89 bdTower:135 backdropHide:139

## js/68-wind-view.js (97) — 
WV:6 wvState:7 wvAlive:8
§9 ทุกเฟรมของผู้เล่นสายลม: ปีกติดหลัง / ปีกห่อตอนยกโล่ / ดูดลมชาร์จเกจ
windFX:10
§26 กำแพงลมจาก snapshot (ตามตำแหน่ง/ลบเมื่อหมด)
syncWind:27 wvWall:37
§38 เหตุการณ์ (efx z 'wn…')
windEfx:39
§78 HUD รอบเป้าเล็ง: เกจ GaleBurst (โค้งซ้าย) + ชาร์จกำแพงลม (จุด 3 จุดใต…
drawWindHud:79
§86 ตัวช่วยเล็งกำแพงลม (เห็นเฉพาะเรา): เส้นโค้งเรืองที่จุดวาง (คลิกขวา) +…
wvAimGhost:87

## js/69-broom.js (228) — ไม้กวาด (ผู้ใช้ 2026-10-29): บินแบบเครื่องบิน + ยิงลำแสงตามสาย + อนิเ…
BRM:9 BSK:11 BROOM_SK:17 broomVert:38 broomMove:50 broomStrike:68 broomStrikeTick:77 broomFlak:85 broomAct:96 broomOff:102 broomBeam:104
§125 ฝั่งจอ
broomHead:127 BBEAM:134 _bbGeo:135 broomView:136 broomMountFx:165 broomDismountFx:173 broomBeamFx:175 broomSkFx:191 broomStrikeFx:204 broomFlakFx:209 broomHud:214 broomHudT:215 broomTick:224

(78 files, 18753 lines)
