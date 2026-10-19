# CODEMAP — where everything is (auto-generated: `node tools/codemap.js`, re-run after editing js/)
Game = `index.html` (HTML only + loader) + `css/game.css` + `js/NN-*.js`. The loader fetches the js files **in number order and joins them into ONE module** → every file sees every other file's top-level names (no import/export). Code that runs at load time may only use things from earlier files. New file = add its name to `FILES` in index.html.
Format: `name:line` = top-level function/const/let in that file. `§line title` = section header comment. Errors show `game.js:N` → `srcAt(N)` in the console gives file:line.

## js/01-core.js (22) — แกนกลาง: import Three.js + ฟังก์ชันพื้นฐาน ($ rnd clamp lerp store to…
$:12 rnd:13 clamp:14 lerp:15 dist2:16 lerpAng:17 esc:18 shuffle:19 store:20 toastT:21 toast:22

## js/02-data.js (283) — 
W:4 H:4 PR:4 PILLARS:6 SPAWNF:7 mulberry:9 genForest:10 genPitch:27 genHogsmeade:36
§54 แผนที่โล่ง 3 แบบ (ผู้ใช้: ป่ามืดไม่สนุก อยากได้ที่โล่งๆ)
genMeadow:55 genLake:61 genRuins:66
§73 Test Place (ห้องฝึก): พื้นโล่งไม่มีสิ่งกีดขวาง
genTest:75 trZone:77 genGreatHall:78 MAPS:86 RANDOM_MAPS:98 MAPID:99 MW:99 MH:99 OBS:99 setMapVars:100
§101 แผนที่จากไฟล์ (Blender → assets/maps/<id>.json + .glb, สคริปต์ assets…
FMAPS:104 b64i16:105 regFileMap:106 loadMapData:117 loadAllMapData:125 mapReady:128 mapOkFor:129
§130 ของประกอบฉากที่พังได้ / ใช้ได้ (prop)
PROPDEF:134 PROP_OFF_MODES:139 PROP_USE:141 PROPS:142 PROPON:142 genProps:143
§163 ตัวละคร: บ้านฮอกวอตส์ + หน้าตา
HOUSES:165 HAIRC:170 HAIRSTY:172 WOODC:174 WOODN:175 WCOREC:176 WCOREN:177 WANDSTY:178 EYEC:179 SKINC:180 CLOAKC:181 TIESTY:182 LOOKK:183 LOOKN:183 lookStr:184 parseLook:185 randLook:186 LOOKS:187 LOOKP:187 KITS:187 getKit:188 getLook:189 CREST_SH:190 CREST_PAT:191 starPts:196 CREST_ANI:198 crestSVG:204 houseColor:212 TEAMC:213 TEAMN:213 MODES:214 PDEF:225 EDEF:252 POOLS:264 CDK:274 BUFFS:275

## js/03-spells-core.js (218) — 
ICONS:8 ICOALIAS:9 hasIco:10 ICOBASE:12 icoURL:13 ICO:14 icoTint:15 icoHTML:24 PATHS:25 SPELL_LIST:33 SPELLS:33 defSpell:34 SLOTK:35 BRMAP:35 KITP:36 parseKit:37 cleanKit:53 setKit:54
§56 สถานะ (ใช้ได้ทั้งผู้เล่นและศัตรู)
isBig:57 ccScale:59 ccTouch:60 addStun:61 addRoot:62 addFreeze:63 addSlow:68 addChill:69 ignite:74 shock:82 knock:83 addWard:84 addFrostSlow:86 frostSlow:87 moveMul:94 BRN_MAX:96 addBurn:97 addXBurn:99 addPoison:100 addSil:101 addFear:102 addBlind:103 addMark:104 healT:106 tickStatus:111 clearStatus:131 fxMask:132
§134 วัตถุในสนามที่คาถาสร้าง: โซน / ฟ้าผ่าหน่วงเวลา / กำแพง / ช่องร่ายต่อเ…
foesIn:135 shieldFaces:142 aoeHit:148 addZone:154 updateZones:159 addStrike:170 updateStrikes:171 addWall:172 updateWalls:173 updateChan:177 updateSpells:181 aimPoint:183
§195 ตัวช่วยคอมโบ (ทุกสายใช้หลักเดียวกัน: ตั้งต้น → ต่อยอด → ปิดจบ)
ROLE_N:197 takePoison:198
§200 ความสามารถพื้นฐาน (คลิกซ้าย) ของแต่ละสาย: สะสมสถานะตั้งต้นให้เองทุกๆ …
PBASIC:201

## js/04-frost-mech.js (100) — สายน้ำแข็ง: ประชิด/ไกล (V) • ฟันดาบ/ขวาน • ไถลน้ำแข็ง • พื้นน้ำแข็ง/ภ…
frostBoom:3 meleeHit:10 mirrorPos:21 frostBasic:22 frostSlam3:46 frostSlam:54 frostDash:60 addIce:65 updateIces:66 updateWaves:82 groundH:95

## js/05-terrain.js (44) — พื้นสูงต่ำ (แผนที่จากไฟล์ Blender — กติกาฝั่งคนปั้นใน MAP-DESIGN.md)
TERR:5 TSTEP:6 TSLOPE:6 terrT:7 floorAt:12 terrSolid:14 terrMove:21 updateGlaciers:30

## js/06-pyro.js (160) — สายไฟ: ยิงปกติ 2 โหมด / โล่ระเบิด / พุ่งชาร์จ
pyroBigBoom:5 pyroBall:13 pyroBasic:14 addOrbs:31 pyroParry:32 pyroBlock:33 launchOrbs:35 pyroDash:42 DF_R:76 dragonfallDive:77 dragonfallTick:78 dragonfallBoom:93 pyroSnap:114 colossusTick:124 updateERings:141

## js/07-frost-spells.js (33) — 
frostGlacier:11

## js/08-storm.js (197) — 
ST_MAX:5 stGain:6 stSpend:7 stormCone:9 stormLineFoes:14 stormBasic:18 stormTri:41 stormDash:48 stormDashTick:61 stormShieldBlast:69 stormTick:78
§87 สกิล 1 (ฟรี): เส้นสายฟ้า — ชี้ขึ้นแล้วกดลง 0.5 วิ จากนั้นสายฟ้าผ่าเป็…
stormLine:90
§96 สกิล 2 (1 stack): ดูดความเร็ว
§105 สกิล 3 (2 stacks): ฟ้าผ่าสามครั้ง — วางจุดครั้งเดียว ฟ้าผ่าจุดเดิม 3 …
§119 สกิล 4 (1 stack): ออร์บสายฟ้าคู่ — ลอยหลังเรา Dash โดนศัตรู = ออร์บพุ…
stormOrbLaunch:122
§128 สกิล 5 (2 stacks): Railgun — เส้นเตือนเหลือง 0.8 วิ (อัลติ 0.5) แล้วล…
stormRailFire:131
§137 อัลติ: ร่างเทพสายฟ้า 10 วิ
§140 สกิล 6 (3 stacks): ลูกสายฟ้าโดม — ทะยานขึ้น บินเล็ง 3 วิ คลิกยิงลูกสา…
stormDomeTick:141 stormDomeFire:156 stormDomeSlam:164 updateStorm:168

## js/09-other-paths.js (194) — 
§65 สัตว์เวท (minion): AI ฝั่งโฮสต์
MIND:66 summonMin:72 minTarget:81 minShoot:88 updateMins:93 aimTarget:133
§180 ร่ายคาถา
castSlot:181 castUlt:194

## js/10-net.js (71) — 
PREFIX:4 NET:5 LOBBY:6 genCode:7 sendAll:8 setStatus:9 hostGame:11 joinGame:34 clientOnData:59 leave:71

## js/11-host.js (323) — 
G:4 EVL:4 EVN:4 hostLast:4 tickN:4 emit:5 feed:6 banner:7 plist:8 cleanName:9 freshStats:11 newPlayer:18 emptyInput:21 addPlayer:22 initHostLobby:31 lobbyMsg:38 broadcastLobby:39 hostOnData:41 hostDrop:63 validate:77 hostStart:88 hostToLobby:113 resetBody:115 fmap:121 spawnPts:122 teamPts:124 placeAll:125 respawn:137
§154 ลูปหลักฝั่งโฮสต์
hostTick:155 angDiff:167 cH:169 vR:170 updatePlayer:172 hitProp:310 damagePropsIn:317 nearUseProp:318 useProp:319

## js/12-buildings.js (307) — สิ่งปลูกสร้างที่พังเป็นชิ้น (บ้าน)
BLDDEF:7 BLD_PIECES:8 BLD_FIRE:9 BLD_ICE:9 BLDG:10 BLDON:10 genBldg:11 bldRect:19 bldLocal:20 bldWorld:21 rectDist:22 bldNear:23 hitBldPiece:24 breakBldPiece:35 damageEnv:43 bldPieceAt:57 projEl:63 collideBld:68 updateBldg:81 bldSnap:89 collideWorld:90 shoot:115 eShoot:136 foesOf:143 breakShield:150 gainUlt:151 lifesteal:152 damage:154 playerDown:208 killProj:225 explode:233 hitTarget:245 updateProjectiles:261

## js/13-enemies.js (168) — ศัตรู (โหมด Co-op)
spawnEnemy:2 setupWave:19 bossPhase:36 enemySlam:44 updateEnemies:55

## js/14-mode-rules.js (99) — กติกาของแต่ละโหมด
hostPick:2 modeLogic:8 endMatch:76

## js/15-modes.js (381) — 
sendPriv:5 TASKF:9 taskPts:10 raceRings:11 modeInit:17 spawnDummy:58 trainTick:63 TR_KEYS:75 trTeams:77 trCmd:85 hostEndTraining:102
§104 ควิดดิช
quidThrow:105 quidDrop:111 quidTick:116 snitchTick:151
§174 แข่งไม้กวาด
raceTick:175 raceRank:197
§207 แบทเทิลรอยัล
brTick:208 ITEMN:222 brPick:223
§232 หาลอร์ดโวลเดอมอร์
impActions:233 startMeeting:271 hostVote:278 meetTick:283 impCheck:301
§309 ระเบิดที่ตั้งเวลาไว้ (ลูกไฟมังกร / คลื่นไฟ)
bombTick:310 modeSnap:323
§345 สร้าง snapshot ส่งให้ทุกเครื่อง
r1:346 makeSnap:347 PROF:364 pf:365

## js/16-voice.js (89) — 
VOICE:4 rosterIds:5 toggleMic:6 voiceSync:20 teamOn:37 teamOf:38 applyVoiceGates:39 VAC:49 onIncomingCall:50 voiceLevels:62 speakingIds:70 updateVoiceUI:76

## js/17-input.js (55) — 
INPUT:4 mouseX:5 mouseY:5 showBoard:5 SET_DEF:6 SET:7 KEYACT:9 KMAP:10 PMAP:10 rebuildKeys:11 keyName:19 _rebind:21 cvEl:55

## js/18-audio.js (298) — 
AC:4 MASTER:4 SFXBUS:4 REVERB:4 NB:4 WIND:4 sfxLast:5 ac:6 outNode:27 tone:42 noiz:48 snd:55 sfx:116
§118 ไฟล์เสียงจริง (โฟลเดอร์ audio/) — เริ่มโหลดเมื่อ ac() ถูกเรียกครั้งแร…
SFXN:120 SFXV:121 SFXR:122 SFXSYN:123 BUF:124 AUD:124 loadBuf:125 loadSfx:126 playBuf:131 AMB:139 ambTick:140 MUSF:151 MUSF_VOL:152 STINGERS:152 musicEl:153 fadeMusic:161 stopFileMusic:165 isWin:166 wantTrack:174 fileMusicTick:184
§201 "เพลงของฉัน": เลือกไฟล์เพลงจากเครื่องตัวเอง เล่นแค่ในเครื่องนี้ (ไม่อ…
MY:202 myDB:203 mySave:204 myLoad:207 myDecodeReady:213 myPlay:214 myNext:226 myClear:227 myInfo:228 windUpdate:234
§248 เพลงประกอบ (สร้างสดตามแผนที่)
MUSIC:249 THEMES:250 padNote:255 musicTick:262 toggleMusic:291

## js/19-client.js (186) — 
cv:4 cx:4 DPR:5 SW:5 SH:5 resize:6 VIEW:12 screen:13 lastBuffKey:13 overShown:13 lastCount:13 PARTS:14 TEXTS:14
§15 งบเอฟเฟกต์ (VFX budget)
VFXB:20 _apush:21 vfxQual:29 vfxBegin:31 vfxEnd:34 vfxOnce:36 vfxExtra:38 PCOL:39 setScreen:41 onLobby:50 onSnap:56 myPos:64
§66 เอฟเฟกต์
burst:68 smoke:79 ring:80 floatText:81 shake:82 wandPos:83 impactFX:85 explosionFX:102
§114 เอฟเฟกต์คาถาใหม่
ZV:115 COLB:115 WVV:115 GLV:115 ICEV:115 SLV:115 ULTV:115 OBV:115 _iceDisc:117 _iceEdge:118 _iceSpk:119 iceFloorMat:120 _icePlane:121 _icePathMat:122 makeIceFloor:123 updateIceFloors:146 FLASHM:157 FLASHING:158 flashModel:159 endFlash:168 tickFlash:169 GHOSTM:171 SOLIDM:171 ghostOf:172 setGhost:178 hitSparks:186

## js/20-vfx-pyro-storm.js (370) — Dragonfall (ภาพ)
makeDfCircle:3 DFV:20 dfCracks:21 updateDfCracks:31 dragonfallFX:32
§84 สายฟ้า (ภาพ)
TBN:87 TBA:87 TBF:87 TBMAX:87 _tv:88 _tt:88 _ts:88 _tw:88 tbLayer:90 TBL:95 TBC:96 _tcc:97 tbGet:98 tbolt:100 tboltP:108 tbWrite:109 updateBolts:117 LATER:133 STV:133 SBV:133 SDV:133 TSV:133 CLV:133 STCLAW:136
§140 รอยกรงเล็บ (อัลติสายฟ้า): รอยข่วน 3 เส้นโค้งปลายแหลมขนานกัน ตั้งขวางห…
clawGeo:143 clawRakes:148 updateClaws:162 later:170 stFade:171 stBeam:172 shellPt:177 updateStormV:178 _ev:209 GODPTS:211 bWorld:213 stormFX:214 STHUD:325 drawStormHud:326

## js/21-vfx-frost.js (202) — น้ำแข็ง (ภาพ): ชิ้นผลึก/หนาม/แผ่นน้ำแข็งชั่วคราว (โผล่ → ค้าง → หด) •…
FRV:2 _cryG:3 _spkG:3 _plateG:3 _hexG:3 _iceFxM:4 _frostM:4 iceFxM:5 frostM:6 ICEP:8 _im4:8 _iq:8 _ie:8 _ip:8 _is:8 icePool:9 iceBit:10 iceChips:13 updateFRV:14 iceRing:24 chillFX:25 makeSlash:41 _wbGeo:49 crescentGeo:51 makeWaveBlade:54 WGH:65 updateSlashes:66 _glGeo:79 _glMat:79 _glMat2:79 makeGlacier:80 updateGlacierVis:111 updateOrbShots:120 updateZV:130 WM3:202

## js/22-models.js (220) — โมเดลจากไฟล์ (.glb จาก Blender) — ข้อตกลงฝั่งคนปั้นอยู่ใน ASSETS.md
MODELS:5 modelManifest:6 gltfLoader:11 loadModel:16 modelInst:30 modelOr:31 prefetchModels:43
§45 Animation จากไฟล์ (Blender Actions) + โมเดลตัวละคร/ศัตรูจากไฟล์
ANIM_ALT:48 makeAnimator:49 animResolve:54 animPlay:55 animTick:64 lookTint:82 tintModel:86 useFileModel:101 FILE_MODELS:113
§115 VFX จากไฟล์ (รายละเอียดฝั่งคนทำอยู่ใน ASSETS.md)
VFXL:121 FLIPL:121 FLIPS:121 prefetchFx:122 playVfx:123 vfxSeq:169 flipTex:174 playFlip:182 fileFx:197 zoneFx:204 clearVfx:205 updateVfx:206

## js/23-props-bld-view.js (216) — prop ฝั่งแสดงผล
PROPV:2 propFallback:4 syncProps:26
§42 บ้านพังเป็นชิ้น ฝั่งแสดงผล
BLDV:45 CHARM:45 DEBRIS:45 BLD_WALLC:46 _bldIce:47 _halfRoof:47 charMat:48 bldIceMat:52 halfRoofGeo:54 bldMats:62 bldFallback:67 bldFilePiece:103 bldBuild:110 syncBld:130 bldDebris:160 updateDebris:181 clearDebris:191 drawPropHint:192 syncWalls:200

## js/24-minions-view.js (68) — สัตว์เวท: โมเดลโปร่งแสง + ซิงก์จาก snapshot (MN)
MM3:2 makeMinion:3 syncMins:36 drawMinBars:58

## js/25-efx.js (282) — efxFX: ภาพของ event "efx" ทุกคาถา (หนึ่ง case ต่อหนึ่งเอฟเฟกต์)
efxFX:2

## js/26-fx-events.js (237) — fx(ev): เอฟเฟกต์+เสียงของทุก event จากโฮสต์ • statusFX (สถานะบนตัว) •…
statusFX:3 fx:26
§190 overlay: เลือกบัฟ / สรุปผล
choosePick:191 syncOverlays:196 showOver:218

## js/27-world.js (165) — 
S3:4 tx:4 tz:4 GY:6 TW:6 hdr:7 gl:9 scene:15 cam:17 composer:18
§19 ท่อภาพ (post-processing): ฉาก → ชั้นเอฟเฟกต์นุ่ม (FXPass) → แสงฟุ้ง →…
rpass:22 fxScene:24 SOFTU:26 SOFT_GLSL:27 FXMATS:29 fxMat:30 softify:32 HAZE_U:37 fxPass:47 bloom:48 GRADEU:53 gradePass:69
§72 คุณภาพกราฟิก: auto = ปรับความละเอียดเองตาม FPS / high = สวยสุด / low …
QUAL:73 QUAL_NAME:74 qualPR:75 applyQuality:81 qualTick:96 texCanvas:107 glowTex:108 stoneTex:109 runeTex:115 glowMats:123 glowMat:124 STONEM:126 stoneMat:127 shadowAll:128 SKY:131 hemi:151 moonL:153 setSky:156 LPOOL:164

## js/28-maps-build.js (650) — สร้างแผนที่
CANDLESYS:2 builtMap:3 world:3 TORCHES:3 CANDLES:3 FIREFLIES:3 CRYSTAL:3 RUNE:3 SNITCH:3 BANNERS:3 SNOW:3 WCACHE:5 WCACHE_MAX:5 buildWorld:6 addW:37 _prewarmed:39 prewarmShaders:40 batchStatic:58 makeCandles:83 updateCandles:92 buildCastle:101 buildHogsmeade:167 buildGreatHall:260 buildForest:330
§432 ทุ่งหญ้าฮอกวอตส์ (เย็น)
ringTrees:433 grassTex:442 buildMeadow:443
§462 ทะเลสาบน้ำแข็ง (กลางคืน)
buildLake:463
§484 ซากลานประลอง (เย็น ทราย)
§485 Test Place (ห้องฝึก): พื้นตารางเรียบๆ กลางวัน + วงโซนเสกมอนสเตอร์
§486 แผนที่จากไฟล์ Blender (MAP-DESIGN.md)
terrGeo:488 buildFileMap:496 buildTest:529 buildRuins:552 buildPitch:577

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

## js/31-camera.js (112) — กล้องมุมหลังไหล่ (แบบ Hogwarts Legacy)
yaw:2 pitch:2 lastPh:2 locked:2 SENS:3 saveSet:4 applySettings:5 camPos:13 camLook:13 overlayOpen:16 showPause:17 hidePause:18 MAPCAM:19 PLACE:21 placeKey:22 updatePlaceGhost:30 _aimD:44 rayTerr:46 aimFromCrosshair:52 AIMZ:82 updateCamera:83 menuCamera:108

## js/32-stage.js (265) — เวทีเมนู/ล็อบบี้: ห้องโถงมืด แท่นวงเวททอง เทียนลอย (ฉากแยกจากแผนที่)
stage:2 STAGE:5 STAGE_Y:6 stageSpots:58 stageChar:74 POSES:81 stageIdle:87 _sv:107
§108 ฉากประจำบ้าน (โผล่ตอนเลือกบ้านในหน้าสร้างตัวละคร)
CRESTTEX:109 crestTex:110 crestBanner:118 buildHouseEnvs:126 TONE0:174 _tc:175 stageTone:176 stageScreen:189 renderStage:190 drawStageLabels:236

## js/33-pyro-view.js (267) — ภาพของสายไฟ (pyroFX: ชาร์จ/พุ่ง/ดีดนิ้ว/กลายร่าง/Dragonfall/Colossus)…
§2 sync ตัวละคร/ศัตรู/ลูกเวท กับ snapshot
localVel:3
§11 ภาพของสายไฟ: ชาร์จลูกไฟ / ย่อตัวชาร์จพุ่ง / วงเวทพ่นไฟ / ดีดนิ้ว / กล…
_pw:12 simOf:13 makeColossus:14 makeMagicCircle:67 _fsGeo:77 fireShieldFX:79 pyroFX:93

## js/34-frost-view.js (208) — ภาพของสายน้ำแข็ง: ดาบ/ขวานน้ำแข็งที่ปลายไม้ ท่าฟัน โล่อัศวิน ไถล แช่แ…
iceMat:2 iceRim:3 makeIceSword:4 makeIceAxe:23 makeKiteShield:39 _icyClone:47 MIRSKIP:50 mirrorNodes:51 makeMirrorClone:52 mirrorStale:59 mirrorPose:60 dropMirror:65 frostFX:66

## js/35-sync.js (345) — ซิงก์ผู้เล่น/ศัตรู/ลูกเวทจาก snapshot + ฉายตำแหน่งลงจอ (ป้ายชื่อ/ตัวเ…
syncPlayers:2 syncEnemies:72 projGeo:110 tailGeo:111 _t1:112 makeProj:113 _a:132 _b:132 syncProj:133 _awT:210 animateWorld:211
§252 ฉายตำแหน่ง 3D ลงจอ (ป้ายชื่อ / ตัวเลขดาเมจ)
_v:253 toScreen:254 burnNum:261 drawLabels:268 drawTexts:299 HITM:313 DIRI:313 drawXh:315 drawCrosshair:325

## js/36-modes-view.js (164) — 
ROLE:4 KC:4 roleShowT:4 onPriv:5 MO:10 BREATHS:11 clearModeObjs:12 ITEMC:21 makeItem:22 syncModeObjs:34
§133 หน้าประชุมโหวต (หาลอร์ดโวลเดอมอร์)
meetKey:134 myVoted:134 castVote:135 syncMeeting:141

## js/37-render-loop.js (76) — ลูปเรนเดอร์
lastFrame:2 HSTOP:5 hitStop:6 FXSTUDIO:8 frame:9 _fpsAcc:18 _fpsN:18 render:19 renderGame:56

## js/38-hud.js (343) — HUD
rr:2 SLOTS:3 fmtTime:4
§5 ชิ้นส่วน HUD ธีมทอง-น้ำเงิน
HG:6 HG2:6 HN:6 diaPath:7 plate:9 frameBox:15 bossTrail:23 drawBossBar:24 spellDia:42 thinBar:67 drawHUD:72 raceRankClient:128 drawModeHUD:132 MM:169 drawMinimap:170 slotKey:243 mySlots:244 drawUlt:249 STATUS_ICO:268 SLOTS_IMP:269 BR_LOCK:270 CLUSTER:272 slotState:273 drawBottom:286 drawBoard:326

## js/39-menu.js (234) — 
myLook:5 myColor:5 myKit:5 myName:6 renderMyHouse:9
§11 หน้าสร้าง/แต่งตัวละคร (2 ขั้น: 1 หน้าตา → 2 เลือกบ้าน)
crLib:12 crSaved:12 crKitSaved:12 crOpen:12 crStep:12 crTab:12 crFirst:12 crKitOnly:12 crSlot:12 CRTABS:13 sw_:14 bt_:15 nameBox_:16 crPanelSet:17 crRenderStep1:22 crRenderWand:33
§36 ขั้น 3: สาย + ชุดคาถา
ROLE_COL:37 roleTag:38 DESIGNED:39 spellTags:40 spellDescHTML:47 baseDescHTML:51 SB_THEME:59 ROLE_ORDER:67 sbFxRun:68 sbFxT:68 sbParts:68 crRenderKit:69 sbStartFx:98 sbFxTick:99 sbBurst:126 crAssign:132 crRenderHouse:141 crGo:148 crSaveName:160 crSetHouse:161 openCreator:162 closeCreator:172 lobbyKitSend:179

## js/40-train-settings.js (170) — เมนูทดลอง (ห้องฝึก / Test Place)
trOpenF:2 trKey:2 trN:2 TR_OPTS:3 trToggle:4 trSend:9 trSync:14 hovEl:62
§63 หน้าตั้งค่า
setRow:64 setTog:65 setTab:66 XHC:67 XHN:67 setOpts:68 renderSettings:69 drawXhPrev:86 openSettings:87 closeSettings:88 modeIcon:140 modeTitle:141 renderLobby:142

## js/41-debug.js (141) — 
botBrain:6 _obsKeep:47 balArena:48 balReset:49 balDuel:53 balTour:68 balCoop:82 balSpellTest:98
§117 Service Worker (sw.js): เก็บไฟล์เกมไว้ในเครื่อง เปิดครั้งต่อไปเร็วขึ้…
SWK:118 swSetup:119

## js/42-fire-vfx.js (290) — ไฟแบบใหม่ (2026-10-19): shader ไฟเคลื่อนไหวจริง (noise ไหล) ใช้กับลูก…
FIRE_U:4 FIRE_GLSL:5 fireMat:24
§55 ชิ้นงานสำเร็จรูป
_fbGeo:56 _fbGeo2:56 makeFireBall:58 _ftGeo:66 makeFireTail:67 makeFireWall:70 FIREV:78 fireBlast:79 fireTemp:84 updateFireV:85
§90 ปีกไฟ (Dragonfall) จากไฟล์ Blender mesh_fire_wing (assets/src/fx_mesh…
makeFireWings:93 poseFireWings:100
§101 ชิ้นงานพื้น/กระแทก (รอบ Pyro 2026-10-19): พื้นแตกเป็นใย (ดำ + ไฟลุกตา…
_crackPaths:104 _crackGeo:113 _decM:117 _crackRibbon:119 fireCrackWeb:127 _charTex:149 charTex:150 _discGeo:153 scorch:154 _fruneTex:158 fruneTex:159 fireRune:167 _rockGeo:173 _rockM:174 rockChunks:175 fireGeyser:183 _mv1:191 _mv2:191 fireMeteor:192
§204 อากาศร้อนบิดเบี้ยว (heat haze) — Blazeform "ออร่าความร้อน" (ผู้เล่น 2…
HZM:207 hazeMat:208 _hzPlane:218 _hzRing:219 hazeOf:221 fireBurn:226
§233 ไฟ 3 มิติจริง (volumetric) — ผู้เล่น 2026-10-19: "ไฟดูเป็นภาพ 2D เกิน…
NOISE3D:238 _fvIdx:245 fireVol:246 fireVolTemp:290

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

## js/45-fx-runtime.js (310) — 
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
fxN:107 fxSpawn:108 fxTick:137 fxEnd:146
§151 อนุภาค
_fxrnd:152 fxUnit:153 fxCone:154 fxEmit:156 fxPart:173
§186 รูปทรง 3D
FXGEO:187 fxMerge:188 fxRibbon:193 fxGeo:199 fxEnergyMat:219 fxMeshMake:230 fxMeshTick:245 fxFlipTex:257
§261 หางแสง / รอยฟัน
fxTrailTick:262
§268 สายฟ้า
fxBolt:269
§275 ฟังก์ชันในโค้ดที่ไฟล์เรียกได้ (ชั้น t:"code")
FXCODE:276
§288 ผูกกับ event ของเกม (assets/fx/bind.json) — เรียกจาก fx(ev)
fxBind:290
§300 แม่แบบ playFx เป็นไฟล์ (assets/fx/tpl/*, sig/*, rec/*)
fxTpl:302

(45 files, 9552 lines)
