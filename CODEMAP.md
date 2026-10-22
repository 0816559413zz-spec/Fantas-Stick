# CODEMAP — where everything is (auto-generated: `node tools/codemap.js`, re-run after editing js/)
Game = `index.html` (HTML only + loader) + `css/game.css` + `js/NN-*.js`. The loader fetches the js files **in number order and joins them into ONE module** → every file sees every other file's top-level names (no import/export). Code that runs at load time may only use things from earlier files. New file = add its name to `FILES` in index.html.
Format: `name:line` = top-level function/const/let in that file. `§line title` = section header comment. Errors show `game.js:N` → `srcAt(N)` in the console gives file:line.

## js/01-core.js (22) — แกนกลาง: import Three.js + ฟังก์ชันพื้นฐาน ($ rnd clamp lerp store to…
$:12 rnd:13 clamp:14 lerp:15 dist2:16 lerpAng:17 esc:18 shuffle:19 store:20 toastT:21 toast:22

## js/02-data.js (315) — 
W:4 H:4 PR:4 PILLARS:6 SPAWNF:7 mulberry:9 genForest:10 genPitch:27 genHogsmeade:36
§54 แผนที่โล่ง 3 แบบ (ผู้ใช้: ป่ามืดไม่สนุก อยากได้ที่โล่งๆ)
genMeadow:55 genLake:61 genRuins:66
§73 Test Place (ห้องฝึก): พื้นโล่งไม่มีสิ่งกีดขวาง
TEST_W:75 TEST_H:75 TEST_C:75 TEST_VIL:75 TEST_ST:77 TEST_PH:78 testWalls:80 testDummySpots:82 genTest:83 testProps:94 trZone:106 genGreatHall:107 MAPS:115 RANDOM_MAPS:127 MAPID:128 MW:128 MH:128 OBS:128 setMapVars:129
§130 แผนที่จากไฟล์ (Blender → assets/maps/<id>.json + .glb, สคริปต์ assets…
FMAPS:133 b64i16:134 regFileMap:135 loadMapData:147 loadAllMapData:155 mapReady:158 mapOkFor:159
§160 ของประกอบฉากที่พังได้ / ใช้ได้ (prop)
PROPDEF:164 PROP_OFF_MODES:171 PROP_USE:173 PROPS:174 PROPON:174 genProps:175
§195 ตัวละคร: บ้านฮอกวอตส์ + หน้าตา
HOUSES:197 HAIRC:202 HAIRSTY:204 WOODC:206 WOODN:207 WCOREC:208 WCOREN:209 WANDSTY:210 EYEC:211 SKINC:212 CLOAKC:213 TIESTY:214 LOOKK:215 LOOKN:215 lookStr:216 parseLook:217 randLook:218 LOOKS:219 LOOKP:219 KITS:219 getKit:220 getLook:221 CREST_SH:222 CREST_PAT:223 starPts:228 CREST_ANI:230 crestSVG:236 houseColor:244 TEAMC:245 TEAMN:245 MODES:246 PDEF:257 EDEF:284 POOLS:296 CDK:306 BUFFS:307

## js/03-spells-core.js (222) — 
ICONS:8 ICOALIAS:9 hasIco:10 ICOBASE:12 icoURL:13 ICO:14 icoTint:15 icoHTML:24 PATHS:25 SPELL_LIST:34 SPELLS:34 defSpell:35 SLOTK:36 BRMAP:36 KITP:37 parseKit:38 cleanKit:54 setKit:55 pathReset:58
§60 สถานะ (ใช้ได้ทั้งผู้เล่นและศัตรู)
isBig:61 ccScale:63 ccTouch:64 addStun:65 addRoot:66 addFreeze:67 addSlow:72 addChill:73 ignite:78 shock:86 knock:87 addWard:88 addFrostSlow:90 frostSlow:91 moveMul:98 BRN_MAX:100 addBurn:101 addXBurn:103 addPoison:104 addSil:105 addFear:106 addBlind:107 addMark:108 healT:110 tickStatus:115 clearStatus:135 fxMask:136
§138 วัตถุในสนามที่คาถาสร้าง: โซน / ฟ้าผ่าหน่วงเวลา / กำแพง / ช่องร่ายต่อเ…
foesIn:139 shieldFaces:146 aoeHit:152 addZone:158 updateZones:163 addStrike:174 updateStrikes:175 addWall:176 updateWalls:177 updateChan:181 updateSpells:185 aimPoint:187
§199 ตัวช่วยคอมโบ (ทุกสายใช้หลักเดียวกัน: ตั้งต้น → ต่อยอด → ปิดจบ)
ROLE_N:201 takePoison:202
§204 ความสามารถพื้นฐาน (คลิกซ้าย) ของแต่ละสาย: สะสมสถานะตั้งต้นให้เองทุกๆ …
PBASIC:205

## js/04-frost-mech.js (102) — สายน้ำแข็ง: ประชิด/ไกล (V) • ฟันดาบ/ขวาน • ไถลน้ำแข็ง • พื้นน้ำแข็ง/ภ…
frostBoom:3 meleeHit:10 mirrorPos:21 frostBasic:22 frostSlam3:46 frostSlam:54 frostDash:60 addIce:65 updateIces:66 updateWaves:82 groundH:95

## js/05-terrain.js (44) — พื้นสูงต่ำ (แผนที่จากไฟล์ Blender — กติกาฝั่งคนปั้นใน MAP-DESIGN.md)
TERR:5 TSTEP:6 TSLOPE:6 terrT:7 floorAt:12 terrSolid:14 terrMove:21 updateGlaciers:30

## js/06-pyro.js (161) — สายไฟ: ยิงปกติ 2 โหมด / โล่ระเบิด / พุ่งชาร์จ
pyroBigBoom:5 pyroBall:13 pyroBasic:14 addOrbs:31 pyroParry:32 pyroBlock:33 launchOrbs:35 pyroDash:42 DF_R:76 dragonfallDive:77 dragonfallTick:78 dragonfallBoom:93 pyroSnap:114 colossusTick:124 updateERings:142

## js/07-frost-spells.js (33) — 
frostGlacier:11

## js/08-storm.js (200) — 
ST_MAX:5 stGain:6 stSpend:7 stormCone:9 stormLineFoes:14 stormBasic:18 stormTri:41 stormDash:48 stormDashTick:61 stormShieldBlast:69 stormTick:78
§87 สกิล 1 (ฟรี): เส้นสายฟ้า — ชี้ขึ้นแล้วกดลง 0.5 วิ จากนั้นสายฟ้าผ่าเป็…
stormLine:90
§96 สกิล 2 (1 stack): ดูดความเร็ว
§105 สกิล 3 (2 stacks): ฟ้าผ่าสามครั้ง — วางจุดครั้งเดียว ฟ้าผ่าจุดเดิม 3 …
§120 สกิล 4 (1 stack): ออร์บสายฟ้าคู่ — ลอยหลังเรา Dash โดนศัตรู = ออร์บพุ…
stormOrbLaunch:123
§129 สกิล 5 (2 stacks): Railgun — เส้นเตือนเหลือง 0.8 วิ (อัลติ 0.5) แล้วล…
stormRailFire:132
§139 อัลติ: ร่างเทพสายฟ้า 10 วิ
§142 สกิล 6 (3 stacks): ลูกสายฟ้าโดม — ทะยานขึ้น บินเล็ง 3 วิ คลิกยิงลูกสา…
stormDomeTick:143 stormDomeFire:158 stormDomeSlam:166 updateStorm:171

## js/09-earth.js (244) — สายดิน ⛰️ (ผู้ใช้ออกแบบทั้งหมด — designs/earth.md §0 FINAL SPEC) • ฝั่งโฮสต์
§8 E_CRUSH = เวลาก่อนหนีบ Tectonic Crush = ช่วง Stand ออกแรงดัน (ช้า) + …
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
eAugAim:171 earthAugFire:172 earthMound:183
§186 อัลติ: Wrath (v2)
earthPillarThrow:194 earthWrathTick:205 earthWrathDrill:216 earthWrathEnd:221
§224 ทั้งสนาม: สิ่งก่อสร้างพัง / ฝุ่นหมดเวลา / Stonebreaker ชนกำแพง
updateEarth:225 earthSnapP:234 earthSnapW:236

## js/09-other-paths.js (196) — 
§65 สัตว์เวท (minion): AI ฝั่งโฮสต์
MIND:66 summonMin:72 minTarget:81 minShoot:88 updateMins:93 aimTarget:133
§180 ร่ายคาถา
castSlot:181 castUlt:196

## js/10-net.js (97) — 
PREFIX:4 NET:5 RC:9 LAG:11 lagDo:12 hostSend:13 LOBBY:14 genCode:15 sendAll:16 setStatus:17 hostGame:19 netConnect:42 netLost:50 joinGame:65 clientOnData:83 leave:97

## js/11-host.js (381) — 
G:4 EVL:4 EVN:4 hostLast:4 tickN:4 emit:5 feed:6 banner:7 plist:8 cleanName:9 freshStats:11 newPlayer:18 emptyInput:21 addPlayer:22 initHostLobby:31 lobbyMsg:38 broadcastLobby:39 INPN:41 hostOnData:42 hostDrop:72 hostRemove:81 validate:94 hostStart:105 hostToLobby:130 MIDJOIN:136 midJoin:137 CHATT:153 chatRelay:154 emoHost:162 resetBody:164 fmap:170 spawnPts:171 teamPts:173 placeAll:174 respawn:186
§203 ลูปหลักฝั่งโฮสต์
hostTick:204 angDiff:218 cH:220 vR:221 updatePlayer:223 hitProp:368 damagePropsIn:375 nearUseProp:376 useProp:377

## js/12-buildings.js (418) — สิ่งปลูกสร้างที่พังเป็นชิ้นย่อย (บ้าน) แบบ Battlefield — คู่มือเต็ม: …
BLDDEF:8 BLD_PIECES:9 BLD_GRID:10 BLD_FIRE:11 BLD_ICE:11 BLD_ROOF_MIN:11 BLDG:12 BLDON:12 genBldg:13 bldRect:23 bldChunk:25 bldAlive:32 bldLocal:33 bldWorld:34 rectDist:35 bldNear:36 BLD_MOUND:39 bldGone:40 bldMoundAt:41 bldMoundH:42 hitBldPiece:44 breakBldChunk:55 bldSupport:63 damageEnv:83 bldPieceAt:97 projEl:107 bldPush:112 collideBld:118 updateBldg:133 bldSnap:145 bldParse:151
§155 ของบังในแผนที่ไฟล์ที่พังได้ (หิน เสา รูปปั้น ต้นไม้ โคมไฟ ลัง ...) — …
BRKDEF:159 BRK_M:159 BRK_MCOL:159 BRK:160 genBrk:161 brkApply:168 brkStage:172 hitBrk:173 damageBrkIn:181 brkSnap:187 brkParse:188 collideWorld:189 shoot:216 eShoot:237 foesOf:244 breakShield:251 ULT_RATE:253 ultActive:254 gainUlt:255 lifesteal:256 damage:258 playerDown:314 killProj:334 explode:343 hitTarget:355 updateProjectiles:371

## js/13-enemies.js (168) — ศัตรู (โหมด Co-op)
spawnEnemy:2 setupWave:19 bossPhase:36 enemySlam:44 updateEnemies:55

## js/14-mode-rules.js (105) — กติกาของแต่ละโหมด
hostPick:2 clearField:10 modeLogic:11 endMatch:80 matchOver:105

## js/15-modes.js (400) — 
sendPriv:5 TASKF:9 taskPts:10 raceRings:11 modeInit:17 spawnDummy:59 trainTick:64 TR_KEYS:79 trTeams:81 trCmd:89 hostEndTraining:106
§108 ควิดดิช
quidThrow:109 quidDrop:115 quidTick:120 snitchTick:155
§178 แข่งไม้กวาด
raceTick:179 raceRank:201
§211 แบทเทิลรอยัล
brTick:212 ITEMN:226 brPick:227
§236 หาลอร์ดโวลเดอมอร์
impActions:237 startMeeting:275 hostVote:282 meetTick:287 impCheck:306
§314 ระเบิดที่ตั้งเวลาไว้ (ลูกไฟมังกร / คลื่นไฟ)
bombTick:315 modeSnap:328
§350 สร้าง snapshot ส่งให้ทุกเครื่อง
r1:351 DEFP:353 packP:354 unpackP:355 makeSnap:356 PROF:374 pf:375 hostLoop:376 HLW:390 pingN:400

## js/16-voice.js (89) — 
VOICE:4 rosterIds:5 toggleMic:6 voiceSync:20 teamOn:37 teamOf:38 applyVoiceGates:39 VAC:49 onIncomingCall:50 voiceLevels:62 speakingIds:70 updateVoiceUI:76

## js/17-input.js (56) — 
INPUT:4 mouseX:5 mouseY:5 showBoard:5 SET_DEF:6 SET:7 KEYACT:9 KMAP:10 PMAP:10 rebuildKeys:11 keyName:20 _rebind:22 cvEl:56

## js/18-audio.js (298) — 
AC:4 MASTER:4 SFXBUS:4 REVERB:4 NB:4 WIND:4 sfxLast:5 ac:6 outNode:27 tone:42 noiz:48 snd:55 sfx:116
§118 ไฟล์เสียงจริง (โฟลเดอร์ audio/) — เริ่มโหลดเมื่อ ac() ถูกเรียกครั้งแร…
SFXN:120 SFXV:121 SFXR:122 SFXSYN:123 BUF:124 AUD:124 loadBuf:125 loadSfx:126 playBuf:131 AMB:139 ambTick:140 MUSF:151 MUSF_VOL:152 STINGERS:152 musicEl:153 fadeMusic:161 stopFileMusic:165 isWin:166 wantTrack:174 fileMusicTick:184
§201 "เพลงของฉัน": เลือกไฟล์เพลงจากเครื่องตัวเอง เล่นแค่ในเครื่องนี้ (ไม่อ…
MY:202 myDB:203 mySave:204 myLoad:207 myDecodeReady:213 myPlay:214 myNext:226 myClear:227 myInfo:228 windUpdate:234
§248 เพลงประกอบ (สร้างสดตามแผนที่)
MUSIC:249 THEMES:250 padNote:255 musicTick:262 toggleMusic:291

## js/19-client.js (243) — ฝั่งแสดงผล (ทุกเครื่อง รวมโฮสต์ ใช้ snapshot เดียวกัน)
cv:4 cx:4 DPR:5 SW:5 SH:5 resize:6 VIEW:12 screen:13 lastBuffKey:13 overShown:13 lastCount:13 PARTS:14 TEXTS:14
§15 งบเอฟเฟกต์ (VFX budget)
VFXB:20 _apush:21 vfxQual:29 vfxBegin:31 vfxEnd:34 vfxOnce:36 vfxExtra:38 PCOL:39 setScreen:41 onLobby:50 onSnap:56 snapApply:60
§68 บัฟเฟอร์ snapshot (ลูกข่าย, ผู้ใช้ 2026-10-22 "เล่นออนไลน์ให้ลื่น")
SBUF:71 NETOLD:72 sbufReset:73 sbufPush:74 sbufAdvance:84
§96 ทำนายตัวเอง (ลูกข่าย): ตัวเราขยับทันทีที่กด ไม่ต้องรอโฮสต์ตอบ
PRED:99 predictMe:100 myPos:121
§123 เอฟเฟกต์
burst:125 smoke:136 ring:137 floatText:138 shake:139 wandPos:140 impactFX:142 explosionFX:159
§171 เอฟเฟกต์คาถาใหม่
ZV:172 COLB:172 WVV:172 GLV:172 ICEV:172 SLV:172 ULTV:172 OBV:172 _iceDisc:174 _iceEdge:175 _iceSpk:176 iceFloorMat:177 _icePlane:178 _icePathMat:179 makeIceFloor:180 updateIceFloors:203 FLASHM:214 FLASHING:215 flashModel:216 endFlash:225 tickFlash:226 GHOSTM:228 SOLIDM:228 ghostOf:229 setGhost:235 hitSparks:243

## js/20-vfx-pyro-storm.js (398) — Dragonfall (ภาพ)
makeDfCircle:3 DFV:20 dfCracks:21 updateDfCracks:31 dragonfallFX:32
§84 สายฟ้า (ภาพ)
TBN:87 TBA:87 TBF:87 TBMAX:87 _tv:88 _tt:88 _ts:88 _tw:88 tbLayer:90 TBL:95 TBC:96 _tcc:97 tbGet:98 tbolt:100 tboltP:108 tbWrite:109 updateBolts:117 LATER:133 STV:133 SBV:133 SDV:133 TSV:133 CLV:133 STCLAW:136
§140 รอยกรงเล็บ (อัลติสายฟ้า): รอยข่วน 3 เส้นโค้งปลายแหลมขนานกัน ตั้งขวางห…
clawGeo:143 clawRakes:148 updateClaws:162 later:170 stFade:171 stBeam:172 shellPt:177 updateStormV:178 _ev:209 GODPTS:211 bWorld:213 stormClawSwipe:217 stormFX:238 STHUD:353 drawStormHud:354

## js/21-vfx-frost.js (202) — น้ำแข็ง (ภาพ): ชิ้นผลึก/หนาม/แผ่นน้ำแข็งชั่วคราว (โผล่ → ค้าง → หด) •…
FRV:2 _cryG:3 _spkG:3 _plateG:3 _hexG:3 _iceFxM:4 _frostM:4 iceFxM:5 frostM:6 ICEP:8 _im4:8 _iq:8 _ie:8 _ip:8 _is:8 icePool:9 iceBit:10 iceChips:13 updateFRV:14 iceRing:24 chillFX:25 makeSlash:41 _wbGeo:49 crescentGeo:51 makeWaveBlade:54 WGH:65 updateSlashes:66 _glGeo:79 _glMat:79 _glMat2:79 makeGlacier:80 updateGlacierVis:111 updateOrbShots:120 updateZV:130 WM3:202

## js/22-models.js (253) — โมเดลจากไฟล์ (.glb จาก Blender) — ข้อตกลงฝั่งคนปั้นอยู่ใน ASSETS.md
MODELS:5 modelManifest:6 gltfLoader:11 loadModel:16 modelInst:30 modelOr:31 prefetchModels:43
§45 Animation จากไฟล์ (Blender Actions) + โมเดลตัวละคร/ศัตรูจากไฟล์
ANIM_ALT:48 makeAnimator:49 animResolve:54 animPlay:55 animTick:64 lookTint:82 tintModel:86 useFileModel:101 rigStage:118 fileVariants:120 fileBroom:121 _rq:125 _rq2:125 _rq3:125 rigBind:126 rigStd:134 rigSync:135 FILE_MODELS:146
§148 VFX จากไฟล์ (รายละเอียดฝั่งคนทำอยู่ใน ASSETS.md)
VFXL:154 FLIPL:154 FLIPS:154 prefetchFx:155 playVfx:156 vfxSeq:202 flipTex:207 playFlip:215 fileFx:230 zoneFx:237 clearVfx:238 updateVfx:239

## js/23-props-bld-view.js (378) — prop ฝั่งแสดงผล
PROPV:2 propFallback:4 syncProps:32
§48 บ้านพังเป็นชิ้น ฝั่งแสดงผล
BLDV:51 CHARM:51 DEBRIS:51 BLD_WALLC:52 _bldIce:53 _halfRoof:53 charMat:54 bldIceMat:58 halfRoofGeo:60 bldMats:68 bldFallback:73 bldFilePiece:109 bldHasChunks:117 bldFallbackChunks:119 bldRubble:127 _moundMat:133 bldMound:134 BLD_RUBBLE_H:156 bldBuild:157 syncBld:181 bldDebris:211 bldChunkFall:234 updateDebris:246 clearDebris:256 drawPropHint:257 syncWalls:265
§283 ของบังในแผนที่ไฟล์ที่พังได้ ฝั่งแสดงผล (สถานะจาก BRK[].st — host js/1…
BRKV:286 BRK_COL:286 brkSetup:287 BRK_CM:305 brkCrackMat:306 brkClip:322 brkYc:337 brkStump:339 brkSync:349 BRK_ZERO:367 brkFall:369

## js/24-minions-view.js (68) — สัตว์เวท: โมเดลโปร่งแสง + ซิงก์จาก snapshot (MN)
MM3:2 makeMinion:3 syncMins:36 drawMinBars:58

## js/25-efx.js (297) — efxFX: ภาพของ event "efx" ทุกคาถา (หนึ่ง case ต่อหนึ่งเอฟเฟกต์)
efxState:4 efxFX:15

## js/26-fx-events.js (247) — fx(ev): เอฟเฟกต์+เสียงของทุก event จากโฮสต์ • statusFX (สถานะบนตัว) •…
statusFX:3 fx:27
§200 overlay: เลือกบัฟ / สรุปผล
choosePick:201 syncOverlays:206 showOver:228

## js/27-world.js (265) — 
S3:4 tx:4 tz:4 GY:6 TW:6 hdr:7 gl:9 scene:15 cam:17 composer:18
§19 ท่อภาพ (post-processing): ฉาก → ชั้นเอฟเฟกต์นุ่ม (FXPass) → แสงฟุ้ง →…
rpass:22 fxScene:24 SOFTU:26 SOFT_GLSL:27 FXMATS:29 fxMat:30 softify:32 HAZE_U:37 AOU:41 GFX:46 AO_ON:47 AO_HEAD:48 AO_CALC:52 AO_COPY:66 AO_RT:82 fxPass:101 bloom:102 GRADEU:107 gradePass:123 aaPass:140
§142 คุณภาพกราฟิก: auto = ปรับความละเอียดเองตาม FPS / high = สวยสุด / low …
QUAL:143 QUAL_NAME:144 qualPR:145 applyQuality:151 qualTick:169 texCanvas:180 glowTex:181 stoneTex:182 runeTex:188 glowMats:196 glowMat:197 STONEM:199 stoneMat:200 shadowAll:201 SKY:204 hemi:224 moonL:226 LDIR:230 setSky:231
§239 เงาตามผู้เล่น
SHD:243 _shF:244 _shR:244 _shU:244 _shC:244 _shY:244 shadowFollow:245 LPOOL:264

## js/28-maps-build.js (725) — สร้างแผนที่
CANDLESYS:2 builtMap:3 builtKey:3 world:3 TORCHES:3 CANDLES:3 FIREFLIES:3 CRYSTAL:3 RUNE:3 SNITCH:3 BANNERS:3 SNOW:3 WCACHE:5 WCACHE_MAX:5 wkey:7 buildWorld:8 addW:40 _prewarmed:42 prewarmShaders:43 batchStatic:61 makeCandles:86 updateCandles:95 buildCastle:104 buildHogsmeade:170 buildGreatHall:258 buildForest:328
§425 ทุ่งหญ้าฮอกวอตส์ (เย็น)
ringTrees:426 grassTex:435 buildMeadow:436
§455 ทะเลสาบน้ำแข็ง (กลางคืน)
buildLake:456
§477 ซากลานประลอง (เย็น ทราย)
§478 Test Place (ห้องฝึก): พื้นตารางเรียบๆ กลางวัน + วงโซนเสกมอนสเตอร์
§479 บรรยากาศที่ใช้ร่วมกัน (แผนที่จากโค้ด + แผนที่จากไฟล์ผ่าน fx ใน MAP-DE…
makeSnow:480 makeFireflies:487 makeSnitch:494 fileMapFx:501
§511 แผนที่จากไฟล์ Blender (MAP-DESIGN.md)
terrGeo:513 buildFileMap:521 tickM:557 testSign:558 buildTest:565 buildRuins:631 buildPitch:656

## js/29-characters.js (373) — ระบบผ้า (เสื้อคลุมพลิ้วตามการเคลื่อนที่)
makeCloak:2 updateCloth:10
§33 โมเดลนักเรียนเวทมนตร์
SHGEO:35 SHMAT:35 SHTEX:35 sGeo:36 sMat:37 bMat:40 matKey:42 bodyPatch:48 BODYM:55 bodyMat:56 plainMat:61 mergeBody:62 sStripe:98 hashStr:99 stripeTex:100 shieldMat:101 addStatus:109 makeStudent:115 makeEnemy:218 keepTex:356 keepMatSet:357 disposeMaterial:358 disposeTree:364 disposeObj:371 PM3:372 EM3:372 JM3:372 clearDyn:373

## js/30-particles.js (265) — อนุภาค 2 ชั้น: แสงเรือง (additive) + ควัน (normal)
PMAX:2 PGLOW_OCC:6 PLIT:6 makePointSys:7
§46 เปลวไฟ: FLAME_STYLE 0 = อนุภาคกลมเรืองแสง (ไม่ใช้รูปเปลว) • 2 = แบบให…
FLAME_STYLE:48 PTIME:49 NOISETEX:51 FLAMETEX_V1:57 FLAMETEX_V2:62 PSYS:72 FLAMELUT:89 FLAMECOL:92 flame:93 PFB:102 ptexUse:103 ptexLoad:127 colCache:129 col3:130 CURL:133 curlAt:134 updateParticles:136
§172 เอฟเฟกต์รูปทรง: แฟลช / วงแหวน / โดม / รอยไหม้ / สายฟ้า / แสงชั่วคราว
SHAPES_Q:173 SHAPES:173 FLASHL:173 LINES:173 LREQ:174 ringGeo:175 ringVGeo:176 arcGeo:177 domeGeo:178 fullGeo:179 discGeo:180 decalTex:181 FX:182 jag:196 spawnShape:204 updateShapes:231 _cp:250 updateLights:251

## js/31-camera.js (116) — กล้องมุมหลังไหล่ (แบบ Hogwarts Legacy)
yaw:2 pitch:2 lastPh:2 locked:2 SENS:3 saveSet:4 applySettings:5 camPos:13 camLook:13 overlayOpen:16 showPause:17 hidePause:18 MAPCAM:19 PLACE:21 placeKey:22 updatePlaceGhost:30 _aimD:44 rayTerr:46 aimFromCrosshair:52 AIMZ:82 EZC:84 ESC:84 updateCamera:85 menuCamera:112

## js/32-stage.js (311) — เวทีเมนู/ล็อบบี้: ห้องโถงมืด แท่นวงเวททอง เทียนลอย (ฉากแยกจากแผนที่)
stage:2 STAGE:5 STAGE_Y:6 stageSpots:58 stageChar:74 POSES:81 stageIdle:87
§109 เอฟเฟกต์หน้าเมนู (โชว์เฉพาะหน้าแรก ไม่โชว์ในล็อบบี้/หน้าสร้างตัวละคร)…
stageMenuFx:135 _sv:146
§147 ฉากประจำบ้าน (โผล่ตอนเลือกบ้านในหน้าสร้างตัวละคร)
CRESTTEX:148 crestTex:149 crestBanner:157 buildHouseEnvs:165 TONE0:213 _tc:214 stageTone:215 stageScreen:228 renderStage:229 drawStageLabels:282

## js/33-pyro-view.js (269) — ภาพของสายไฟ (pyroFX: ชาร์จ/พุ่ง/ดีดนิ้ว/กลายร่าง/Dragonfall/Colossus)…
§2 sync ตัวละคร/ศัตรู/ลูกเวท กับ snapshot
localVel:3
§11 ภาพของสายไฟ: ชาร์จลูกไฟ / ย่อตัวชาร์จพุ่ง / วงเวทพ่นไฟ / ดีดนิ้ว / กล…
_pw:12 simOf:13 makeColossus:14 makeMagicCircle:67 _fsGeo:77 fireShieldFX:79 pyroFX:93

## js/34-frost-view.js (247) — ภาพของสายน้ำแข็ง: ดาบ/ขวานน้ำแข็งที่ปลายไม้ ท่าฟัน โล่อัศวิน ไถล แช่แ…
iceMat:2 iceRim:3 makeIceSword:4 makeIceAxe:23 makeKiteShield:39
§47 อาวุธน้ำแข็งลอย (ผู้ใช้ 2026-10-22: "ร่ายคาถาให้ดาบฟันเอง ระยะเท่าเดิ…
FWS:50 FWA:50 _fwM:51 _fwM2:51 _fwX:51 _fwY:51 _fwZ:51 _fwP:51 _fwS:51 _fwQ:51 _eo:52 _ei:52 _ss:52 fwAim:54 fwWeapons:55 FWP:57 FWT:57 fwChop:58 fwSweep:59 fwIdle:60 fwSwing:63 FWL_N:75 fwLink:76 fwMat:79 frostFX:80

## js/35-sync.js (479) — ซิงก์ผู้เล่น/ศัตรู/ลูกเวทจาก snapshot + ฉายตำแหน่งลงจอ (ป้ายชื่อ/ตัวเ…
§2 ท่าร่ายคาถาแบบนักเวทในหนัง Harry Potter (ผู้ใช้ 2026-10-22: "ยิงปกติท…
CPOSE_T:7 _ce:7 _cs:7 _cb:7 AMP_B:9 AMP_S:9 CP_BEND:10 CPOSE:12 _cpT:20 _cpR:20 CGUARD:20 CP_STEP:21 CPCOL:22 castStyle:23 castStart:24
§25 ท่าร่ายสกิล / อัลติ / โล่ (ผู้ใช้ 2026-10-22: "เกือบทุกสกิลควรมีการเห…
CANIM:30 SKANIM:53 skAnim:57 _caT:58 _caR:58 skillPose:59 CBLOCK:82 blockPose:83 castPose:88 lateSkillPose:94 castPose0:95 syncPlayers:123 syncEnemies:204 projGeo:242 tailGeo:243 _t1:244 makeProj:245 _a:265 _b:265 syncProj:266 _awT:343 animateWorld:344
§385 ฉายตำแหน่ง 3D ลงจอ (ป้ายชื่อ / ตัวเลขดาเมจ)
_v:386 toScreen:387 burnNum:394 drawLabels:401 drawTexts:432 HITM:446 DIRI:446 drawXh:448 drawCrosshair:458

## js/36-modes-view.js (164) — 
ROLE:4 KC:4 roleShowT:4 onPriv:5 MO:10 BREATHS:11 clearModeObjs:12 ITEMC:21 makeItem:22 syncModeObjs:34
§133 หน้าประชุมโหวต (หาลอร์ดโวลเดอมอร์)
meetKey:134 myVoted:134 castVote:135 syncMeeting:141

## js/37-render-loop.js (79) — ลูปเรนเดอร์
lastFrame:2 HSTOP:5 hitStop:6 FXSTUDIO:8 frame:9 _fpsAcc:18 _fpsN:18 render:19 renderGame:59

## js/38-hud.js (415) — HUD
rr:2 SLOTS:3 fmtTime:4
§5 ชิ้นส่วน HUD ธีมทอง-น้ำเงิน
HG:6 HG2:6 HN:6 HUDF:8 hudTick:9 readyPulse:11 diaPath:13 plate:15 frameBox:21 bossTrail:29 drawBossBar:30 spellDia:50 thinBar:79 drawHUD:84 raceRankClient:164 drawModeHUD:168 MM:205 drawMinimap:206 slotKey:285 mySlots:286 drawUlt:296 STATUS_ICO:321 SLOTS_IMP:322 BR_LOCK:323 CLUSTER:325 E_NEEDSTAND:326 slotState:327 drawBottom:346 drawBoard:398

## js/39-menu.js (283) — 
myLook:5 myColor:5 myKit:5 myName:6 renderMyHouse:9
§11 หน้าสร้าง/แต่งตัวละคร (2 ขั้น: 1 หน้าตา → 2 เลือกบ้าน)
crLib:12 crSaved:12 crKitSaved:12 crOpen:12 crStep:12 crTab:12 crFirst:12 crKitOnly:12 crSlot:12 CRTABS:13 sw_:14 bt_:15 nameBox_:16 crPanelSet:17 crRenderStep1:22 crRenderWand:33
§36 ขั้น 3: สาย + ชุดคาถา
ROLE_COL:37 roleTag:38 DESIGNED:39 spellTags:40 spellDescHTML:47 baseDescHTML:51 SB_THEME:59 ROLE_ORDER:68 sbFxRun:69 sbFxT:69 sbParts:69 crRenderKit:70 sbStartFx:99 sbFxTick:100 sbBurst:127 crAssign:133 crRenderHouse:142 crGo:149 crSaveName:161 crSetHouse:162 openCreator:163 closeCreator:173 lobbyKitSend:180
§221 ฉากเปิด (#intro) + ประกายบนหน้าเมนู (#menuFx)
TITLE:224 titleSpark:225 titleDraw:226 titleLoop:237 titleGo:248 JOINQ:256 ovResult:276

## js/40-train-settings.js (173) — เมนูทดลอง (ห้องฝึก / Test Place)
trOpenF:2 trKey:2 trN:2 TR_OPTS:3 trToggle:4 trSend:9 trSync:14 hovEl:62
§63 หน้าตั้งค่า
setRow:64 setTog:65 setTab:66 XHC:67 XHN:67 setOpts:68 renderSettings:69 drawXhPrev:86 openSettings:87 closeSettings:88 modeIcon:143 modeTitle:144 renderLobby:145

## js/41-debug.js (141) — เครื่องมือทดสอบสมดุล (ใช้ผ่านคอนโซล WD.bal / WD.dmgTest เท่านั้น ผู้เล่นปกติไม่เห็น)
§5 บอทต่อสู้แบบง่ายๆ: เล็งนำเป้า เดินรักษาระยะ+ส่ายไปมา ร่ายคาถาทุกครั้ง…
botBrain:6 _obsKeep:47 balArena:48 balReset:49 balDuel:53 balTour:68 balCoop:82 balSpellTest:98
§117 Service Worker (sw.js): เก็บไฟล์เกมไว้ในเครื่อง เปิดครั้งต่อไปเร็วขึ้…
SWK:118 swSetup:119

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

## js/43-frost-vfx.js (144) — 
FROST_U:6
§7 shader น้ำแข็ง: ฐานน้ำเงินเข้ม → ปลายขาว • ขอบสว่าง (fresnel) • รอยร้…
ICE_VS:8 ICE_FS:10 _iceShM:23 iceShaderMat:24 iceModel:28
§32 มงกุฎหนามน้ำแข็งพุ่งจากพื้น (ภาพอ้างอิงจากผู้ใช้)
ICEM:34 iceBurst:35 updateIceMeshes:42
§49 Glacier Mist: หมอกเย็นลอยต่ำ ฟุ้งออกจากน้ำแข็ง (InstancedMesh 1 draw …
MISTTEX:50 MISTMAX:57 MISTP:57 MISTSRC:57 mistMesh:58 mistPuff:70 glacierMist:73 mistLine:77 mistArea:78 updateMist:79 mistWave:95 forgeRise:97 forgeAura:101 updateFrostV:103
§105 ดาบ/ขวานน้ำแข็งจากไฟล์ Blender (mesh_ice_sword / mesh_ice_axe)
_wpM:107 fileWeapon:108
§116 Ice circle (Permafrost): ริบบิ้นแสงวนเป็นก้นหอยบนพื้น + ผลึกลอยหมุนรอ…
SWIRL_FS:117 ICIRC:121 iceCircle:122 updateIceCircles:133

## js/44-vfx-kit.js (207) — 
§8 1) หางแสง
TRMAX:11 TRPTS:11 TRAILS:11 _trL:12 trailLayer:13 trailNew:22 trailPoint:24 trailStop:27 _tv1:28 _tv2:28 _tv3:28 updateTrails:29
§52 2) สูตรเอฟเฟกต์ = จานสี (ธาตุ) × แม่แบบ (ขนาด/ชนิด)
VFXPAL:56 VFXTPL:69 VFXSIG:81 VFXSIGK:89 VFXR:91 _palCache:94 palOf:95 _pc:98 playFx:99 nearMe:109 fxLayer:110
§142 3) ผูกเอฟเฟกต์ซ้อนชั้นกับเหตุการณ์ของทุกสาย (เพิ่มทับของเดิม ไม่ลบหน้…
EFXAUG:144 PJPAL:163 pjPal:165 ULTCOL:166 efxAug:167 VFXAUG_ON:171 fxAug:172
§192 4) เอฟเฟกต์ทั้งจอ (ค่าไปที่ GradePass ใน js/27-world.js)
SCR:193 screenFlash:194 screenRadial:195 screenKick:196 screenHurt:197 _scv:198 updateScreenFx:199 updateVfxKit:207

## js/45-fx-runtime.js (326) — 
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
fxN:107 fxSpawn:108 fxTick:140 fxEnd:151
§158 อนุภาค
_fxrnd:159 fxUnit:160 fxCone:161 fxEmit:163 fxPart:180
§195 รูปทรง 3D
FXGEO:196 fxMerge:197 fxRibbon:202 fxGeo:208 fxEnergyMat:228 fxMeshMake:239 fxMeshTick:256 fxFlipTex:270
§275 หางแสง / รอยฟัน
fxTrailTick:276
§282 สายฟ้า
fxBolt:283
§289 ฟังก์ชันในโค้ดที่ไฟล์เรียกได้ (ชั้น t:"code")
FXCODE:290
§303 ผูกกับ event ของเกม (assets/fx/bind.json) — เรียกจาก fx(ev)
fxBind:305
§316 แม่แบบ playFx เป็นไฟล์ (assets/fx/tpl/*, sig/*, rec/*)
fxTpl:318

## js/46-fx-make.js (261) — 
FXMK:10 MKD:11 mkRng:12 mkHash:13 mkNoise:15 mkL:17 mkR2:18
§19 ที่เก็บจุด/สามเหลี่ยม
mkG:21 mkPc:22 mkV:23 mkQ:24 mkAppend:25 mkCopy:26 mkFlat:27 _mkv:28 mkXf:29 mkThree:32 mkTRS:34 mkGrid:37
§38 ชิ้นส่วน (k) — พิกัด: ฐานอยู่ที่ y=0 (ยกเว้น sphere/box อยู่กลาง)
§39 ปั้นเอง (k:"poly"): จุด v + หน้า f (เลขจุด ทวนเข็มเมื่อมองจากด้านนอก)…
mkCC:40 MKGEN:51
§112 ตัวแต่ง (ทำตามลำดับ): เรียว → บิด → โค้ง → ขรุขระ → แบน(เหลี่ยม) → ขน…
mkDeform:113 mkOpts:124 mkPart:125 fxMeshBuild:138
§149 โหลด
fxMeshLoad:150 fxMeshGeo:152 fxMeshSet:154 fxTexLoad:156 fxTexUse:159 fxTexNeed:162
§163 โมเดลงอกทีละชิ้น (ชั้น mesh: grow 0..1 เส้นโค้งได้, stagger, growBy)
FXGROWBY:165 fxGrowInit:166 fxGrowTick:168
§173 วัสดุภาพบนรูปทรง (mat:"tex") — ภาพที่วาดในสตูดิโอ (tex/…) ไหลบนผิว + …
fxTexMat:175 fxTexMatBind:187 fxTexMatTick:190
§191 เศษโมเดลกระเด็น (emit look:"model") — หิน ผลึก ขนนก เศษดาบ: หมุน ตกตา…
FXMP:193 fxMPMat:194 fxMPGroup:198 _mpM:201 _mpQ:201 _mpE:201 _mpP:201 _mpS:201 fxMPUpdate:202 fxMPClear:211 fxMPSpawn:213
§217 อากาศบิดเบี้ยว (ชั้น warp) — ไอร้อน / คลื่นกระแทกบิดภาพ / เลนส์โป่ง •…
fxWarpMake:219 fxWarpTick:231
§237 ไฟ 3 มิติจากการจำลอง (ชั้น vol) — ไฟล์รูปแบบเดียวกับที่เพื่อน bake จา…
FXVOL:240 fxVolLoad:241 fxVolTex:245 fxVolSet:248 fxVolReady:249 fxVolMake:250 fxVolTick:253 fxPreAssets:258 fxAssetsWait:260

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

## js/50-grass.js (186) — 
AIR:9 AIR_MAP:16 airGust:18 airGs:21 airMark:23 airForMap:26 _airV:27 airAt:28 airGv:34 airTick:35
§38 ต่อเข้ากับเอฟเฟกต์เดิม (ไม่ต้องแก้ทุกสกิล): แสงวาบ = ลมกระโชก • วงคลื…
CLW:48
§50 หญ้า
GRASS:52 GR_GLSL_V:53 GR_BEGIN:55 grassMat:79 grassBuild:93 _grBasic:107 grassBake:108 grassCount:158 grassTick:163

## js/51-warmup.js (72) — 
WARM:11 WARM_FXDIR:12 WARM_COMMON:12 WARM_X:13 WARM_Y:13 warmKeep:15 warmCompile:21 WARM_SKIP:24 warmFx:25 warmFxEnd:33 warmGather:35 warmPaths:37 warmStep:39 warmTick:54
§63 ภาพจากโค้ดของแต่ละสาย (เฟรมละฟังก์ชัน)

## js/52-social.js (170) — เล่นกับเพื่อน (ผู้ใช้ 2026-10-22): แชท + อีโมต + ดูเพื่อนเล่น (spectator) + ป้ายต่อเน็ตให…
§6 แชท: Enter = พิมพ์ / Enter อีกที = ส่ง / Esc = ปิด • ข้อความขึ้นมุมซ้…
CHAT:7 chatOpen:27 chatClose:32 chatSend:41 chatAdd:46 escH:51 onChat:52 drawSocial:58 drawPing:82
§88 อีโมต: กด Z ค้าง → วงล้อ 6 แบบ ลากเมาส์ไปทางที่ต้องการ ปล่อย Z = เล่น…
EMOS:89 EMO:90 drawEmoWheel:108 emoFx:121 emotePose:123
§139 ดูเพื่อนเล่น: ตายแล้ว ≥2 วิ หรือเข้ามาเป็นคนดู → กล้องตามคนอื่น คลิกซ…
SPEC:140 specTarget:141 specCycle:150 drawSpecHint:155
§163 ป้าย "กำลังต่อใหม่..." (ลูกข่ายหลุดจากโฮสต์ js/10 netLost)
drawNetBanner:164

## js/53-victory.js (165) — จบเกม (ผู้ใช้ 2026-10-22): VICTORY / DEFEAT แบบ Overwatch แต่เป็นเวทมนตร์ (สายฟ้า + ไฟ) +…
VIC:6 VPAL:7 vicKind:17 vicStart:25 vicStop:31 vicSkip:32 vicBolt:36 vicLoop:42
§108 จอสรุป: MVP + จุดเด่น (ใส่ใน showOver js/26)
overMvp:117 overBar:127
§129 ห้องฝึก: นับคอมโบ (ผู้ใช้ 2026-10-22 "ห้องลองคอมโบ ... ใส่ในห้องฝึก")
COMBO:132 comboHit:133 comboEnd:139 drawCombo:140

## js/54-ffa.js (170) — FFA ให้มันขึ้น (ผู้ใช้ 2026-10-22 เลือกชุด A + B(เฉพาะขวดเลือด) + C)
FFA:8
§10 โฮสต์
ffaInit:11 ffaPotSpots:16 ffaTick:27 ffaDmgLog:40 ffaKill:46 ffaDone:65 ffaSnapPots:72
§74 ภาพ: ขวดเลือด 3 มิติ
POT3:75 potMesh:76 syncPots:86 potFx:98
§103 ภาพ: ป้ายตอนฆ่า / จอตอนตาย / อันดับ / มงกุฎค่าหัว
FFAV:104 MULTI:105 MULTI_TH:105 STREAK:106 pName:107 ffaKf:108 kfSound:123 KINDN:124 drawFFA:125

## js/55-podium.js (84) — โพเดียมธีมฮอกวอตส์ (ผู้ใช้ 2026-10-22 "podium but make it magician theme hogwart theme")
POD:6 POD_X:7 POD_H:7 POD_C:7 podStart:8 podStop:29 podPose:37 renderPodium:49

(56 files, 13083 lines)
