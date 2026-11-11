# CODEMAP — where everything is (auto-generated: `node tools/codemap.js`, re-run after editing js/)
Game = `index.html` (HTML only + loader) + `css/game.css` + `js/NN-*.js`. The loader fetches the js files **in number order and joins them into ONE module** → every file sees every other file's top-level names (no import/export). Code that runs at load time may only use things from earlier files. New file = add its name to `FILES` in index.html.
Format: `name:line` = top-level function/const/let in that file. `§line title` = section header comment. Errors show `game.js:N` → `srcAt(N)` in the console gives file:line.

## js/01-core.js (47) — แกนกลาง: import Three.js + ฟังก์ชันพื้นฐาน ($ rnd clamp lerp store to…
FLAT_GEO:13 FLAT_ON:13 flatMark:14 INSTZ:21 instz:22 instzSync:27 instzTick:31 $:37 rnd:38 clamp:39 lerp:40 dist2:41 lerpAng:42 esc:43 shuffle:44 store:45 toastT:46 toast:47

## js/02-city.js (165) — เมืองมักเกิ้ล — กล่องเทา (designs/city-bot-battle.md ขั้น 3)
CITY_PLAN:6 CITY_ZN:11 CITY_PLAZA:12 genCity:13 cityProps:126
§138 เล่นได้ทุกโหมด (ขั้น 6): พื้นที่เล่นต่อโหมด (กำแพงล่องหน AREA) + จุดเ…
CITY_MID:140 CITY_C2:140 cityModeData:141 mapArea:157 AREA:158 areaClamp:160

## js/02-citytest.js (28) — แมพทดสอบเมืองใหญ่ (กล่องเทา) — ใช้วัดความลื่นของเครื่องยนต์ก่อนสร้างเ…
CITY_N:4 CITY_B:4 CITY_ROAD:4 genCityTest:5 cityTestProps:19

## js/02-data.js (383) — 
W:4 H:4 PR:4 PILLARS:6 SPAWNF:7 mulberry:9 genForest:10 genPitch:27 genHogsmeade:36
§54 แผนที่โล่ง 3 แบบ (ผู้ใช้: ป่ามืดไม่สนุก อยากได้ที่โล่งๆ)
genMeadow:55 genLake:61 genRuins:66
§73 Test Place (ห้องฝึก): พื้นโล่งไม่มีสิ่งกีดขวาง
TEST_W:75 TEST_H:75 TEST_C:75 TEST_VIL:75 TEST_GW:77 TEST_Z:78 TEST_ST:85 TEST_PH:86 testWalls:88 testDummySpots:90 testFences:92 genTest:105 testProps:120 trZone:133 trBotPad:134 trFixSpots:136 trShow:138 genGreatHall:139 MAPS:147 MAP_OFF:160 RANDOM_MAPS:161 MAPID:162 MW:162 MH:162 OBS:162 setMapVars:163
§164 แผนที่จากไฟล์ (Blender → assets/maps/<id>.json + .glb, สคริปต์ assets…
FMAPS:167 b64i16:168 regFileMap:169 loadMapData:181 loadAllMapData:189 mapReady:192 mapOkFor:193
§194 ของประกอบฉากที่พังได้ / ใช้ได้ (prop)
PROPDEF:198 PROP_OFF_MODES:205 PROP_USE:207 PROPS:208 PROPON:208 genProps:209
§229 ตัวละคร: บ้านฮอกวอตส์ + หน้าตา
HOUSES:231 HAIRC:236 HAIRSTY:238 WOODC:241 WOODN:242 WCOREC:243 WCOREN:244 WANDSTY:245 WANDN:250 WANDNN:265 EYEC:266 SKINC:267 CLOAKC:268 TIESTY:269 LOOKK:270 LOOKN:270 lookStr:271 parseLook:272 randLook:273 LOOKS:274 LOOKP:274 KITS:274 getKit:275 getLook:276 CREST_SH:277 CREST_PAT:278 starPts:283 CREST_ANI:285 crestSVG:291 houseColor:299 TEAMC:300 TEAMN:300 NOBROOM:302 ROOM_MAX:304 MODES:305 hostModeEnabled:317 PLAY:319 PDEF:320 EDEF:347 POOLS:360 CDK:370 BUFFS:373 BRAR:382 rollRar:383

## js/02-fcs-data.js (3) — 
FCS_DATA:3

## js/02-fcs.js (71) — 
FCS_C:7 FCS_WH:8 genFcs:9
§45 พื้นที่เล่นตามเฟส (กำแพงล่องหน) + เขตจุดเกิดปลอดภัย — ใช้ทั้งโฮสต์ (G…
SGPH:46 SG_SPR:47 _sgAreaC:48 sgArea:49 sgClamp:55 sgInArea:65

## js/03-spells-core.js (241) — 
ICONS:8 ICOALIAS:9 hasIco:10 ICOBASE:12 icoURL:13 ICO:14 icoTint:15 icoHTML:24 PATHS:25 SPELL_LIST:34 SPELLS:34 defSpell:35 SLOTK:36 BRMAP:36 KITP:37 parseKit:38 cleanKit:54 setKit:55 pathReset:58
§60 สถานะ (ใช้ได้ทั้งผู้เล่นและศัตรู)
isBig:61 ccScale:63 ccTouch:64 addStun:65 addRoot:66 addFreeze:67 addSlow:72 addChill:73 ignite:78 shock:86 knock:87 addWard:88 addFrostSlow:90 frostSlow:91 moveMul:98 BRN_MAX:100 addBurn:101 addXBurn:103 addPoison:104 addSil:105 addFear:106 addBlind:107 addMark:108 healT:110 tickStatus:115 clearStatus:137 fxMask:138
§140 วัตถุในสนามที่คาถาสร้าง: โซน / ฟ้าผ่าหน่วงเวลา / กำแพง / ช่องร่ายต่อเ…
foesIn:141 shieldFaces:149 aoeHit:159 addZone:165 updateZones:170 addStrike:181 updateStrikes:182 addWall:183 updateWalls:184 updateChan:195 updateSpells:199 aimPoint:201 aimWall:213
§215 ตัวช่วยคอมโบ (ทุกสายใช้หลักเดียวกัน: ตั้งต้น → ต่อยอด → ปิดจบ)
ROLE_N:217 takePoison:218
§220 ความสามารถพื้นฐาน (คลิกซ้าย) ของแต่ละสาย: สะสมสถานะตั้งต้นให้เองทุกๆ …
PBASIC:221

## js/04-frost-mech.js (112) — สายน้ำแข็ง: ประชิด/ไกล (V) • ฟันดาบ/ขวาน • ไถลน้ำแข็ง • พื้นน้ำแข็ง/ภ…
FROSTV:3 frostBoom:9 meleeHit:16 mirrorPos:27 frostBasic:28 frostSlam3:52 frostSlam:60 frostDash:66 addIce:71 updateIces:72 updateWaves:88 _stO:102 _stL:102 groundH:103

## js/05-terrain.js (44) — พื้นสูงต่ำ (แผนที่จากไฟล์ Blender — กติกาฝั่งคนปั้นใน guides/MAP-DESI…
TERR:5 TSTEP:6 TSLOPE:6 terrT:7 floorAt:12 terrSolid:14 terrMove:21 updateGlaciers:30

## js/06-pyro.js (191) — สายไฟ: ยิงปกติ 2 โหมด / โล่ระเบิด / พุ่งชาร์จ
PYV:3 pyroBigBoom:11 pyroBall:19 pyroBasic:20 addOrbs:37 pyroParry:38 pyroBlock:39 launchOrbs:41 pyroDash:48 pyroPathEnd:68 updateFirePaths:73 KINDLE:93 DRAGONF:95 dragonfallDive:104 dragonfallTick:105 dragonfallBoom:120 RINGE:125 BLAZEF:132 SNAP:134 COLOS:139 pyroSnap:141 colossusTick:151 updateERings:170

## js/07-frost-spells.js (33) — 
FROSTF:4 GREND:6 frostGlacier:11 PERMA:16 CRYO:18 FAURA:25 MIRROR:27

## js/08-storm.js (220) — 
STORMV:6 stGain:10 stSpend:11 stormCone:13 stormLineFoes:18 stormBasic:22 stormTri:46 stormDash:53 stormDashTick:66 stormShieldBlast:74 stormTick:83
§92 สกิล 1 (ฟรี): เส้นสายฟ้า — ชี้ขึ้นแล้วกดลง 0.5 วิ จากนั้นสายฟ้าผ่าเป็…
TLINE:93 stormLine:95
§101 สกิล 2 (1 stack): ดูดความเร็ว
SIPH:102 stormWaveShoot:104
§105 สกิล 3 (2 stacks): ฟ้าผ่าสามครั้ง — วางจุดครั้งเดียว ฟ้าผ่าจุดเดิม 3 …
TSTR:106 updateTCells:122
§130 สกิล 4 (1 stack): ออร์บสายฟ้าคู่ — ลอยหลังเรา Dash โดนศัตรู = ออร์บพุ…
SORBS:131 stormOrbLaunch:134
§140 สกิล 5 (2 stacks): Railgun — เส้นเตือนเหลือง 0.8 วิ (อัลติ 0.5) แล้วล…
RAIL:142 stormBowTick:145 stormBowFire:151
§158 อัลติ: ร่างเทพสายฟ้า 10 วิ
GODL:159
§161 สกิล 6 (3 stacks): ลูกสายฟ้าโดม — ทะยานขึ้น บินเล็ง 3 วิ คลิกยิงลูกสา…
stormDomeTick:162 stormDomeFire:177 stormDomeSlam:185 updateStorm:190

## js/09-earth.js (261) — 
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

## js/09-nature-ba.js (107) — 
NATURE_BA_TEST:2 NATURE_WHIP:3 natureWhipEnabled:4 natureWhipHit:7 natureWhipBasic:29 NW_RINGS:50 NW_SIDES:50 nwPhase:51 nwEase:52 nwSwingAngle:53 natureWhipPose:59 natureWhipVisualMake:68 natureWhipView:90

## js/09-nature.js (439) — 
NATUREP:2 NAT:3 natureDist:5 natureItems:6 natureLive:7 naturePlants:8 natureY:9 natureHead:10 natureTreeReady:11 natureEmit:12 natureWallLocal:15 natureWallContains:21 natureWallPush:28 natureBurnWall:36 natureWallDamage:43 natureWallTick:48 natureTrace:57 natureSight:75 natureGround:76 natureAimPoint:82 naturePlace:88 naturePlant:96 natureCastPlant:106 natureLotusToggle:122 natureMovePlants:130 natureAimSpot:141 natureAimStart:142 natureAimDone:143 natureAimTick:146 natureWallBuild:157 natureCastWall:158 naturePoison:165 natureStatus:170 natureSpore:182 natureSendSpore:189 natureShield:198 natureHookCandidates:212 natureDash:216 natureHookMove:242 natureBall:271 natureBallTick:279 natureTree:298 natureTreeReach:303 natureGuardian:308 natureGuard:314 natureDamage:323 natureEnd:329 natureTurret:335 naturePeaSplash:368 natureUpdate:373 natureReset:405 natureSnapP:409 natureLotusCooldown:419 natureSnapW:424

## js/09-other-paths.js (175) — 
§44 สัตว์เวท (minion): AI ฝั่งโฮสต์
MIND:45 summonMin:51 minTarget:60 minShoot:67 updateMins:72 aimTarget:112 SDOME:149
§159 ร่ายคาถา
castSlot:160 castUlt:175

## js/09-water.js (173) — 
WATERP:7 WAV:11 wtOn:17 wtInBeam:19
§23 ทุกเฟรมของผู้เล่นสายน้ำ (เรียกจาก updatePlayer หลังส่วนโล่)
waterTick:24 waterSpd:39 waterReset:40
§42 BA: สะบัดไม้ → ยิงเข็มน้ำ 3 นัดทันที ห่างกันนิดเดียว ตามเมาส์ (ผู้ใช้…
WT_BA_SIDE:43 WT_BA_H:43 waterBasic:44 waterLineTick:51 waterMoonBeam:61
§64 Dash: จมดิน ทิ้งร่างโคลน → โผล่ห่าง 300 ทิศที่หัน • 6 วิกดอีกที = กลั…
waterDash:65 waterSinkTick:75
§81 ดาเมจใดๆ ของเรา → ลูกผู้ช่วยยิงตาม (เรียกจาก damage() ใน js/12)
waterOnHit:82 waterFamTick:84
§89 Riptide: คลื่นยักษ์วิ่งไปข้างหน้า พัดศัตรูติดไปจนสุดทาง
waterWaveTick:90
§98 Abyssal Beam: ร่าย 0.5 วิ → ยิงลำน้ำ 3 วิ (ยืนนิ่ง ลอยนิดหน่อย หมุนตา…
waterBeamStop:100 waterBeamTick:108 waterMBTick:119
§123 อัลติ Dragon of the Deep
waterDragonTick:124
§138 ทุกเฟรม (ทั้งเกม)
updateWater:139 waterSnapP:145 waterSnapW:147 WT_RP:150 WT_FM:153 WT_CG:155 WT_AB:159 WT_MW:162 WT_UL:164

## js/09-wind.js (575) — 
WINDP:8 WNV:12
§19 ตัวช่วย
wOn:20 wGain:21 wSeg:23 wFoeNear:24
§26 ทุกเฟรมของผู้เล่นสายลม (เรียกจาก updatePlayer หลังส่วนโล่)
windTick:27 windSpd:56 windFlyZ:58 windReset:67
§69 ท่าพื้นฐาน (คลิกซ้าย): ใบมีดลม / ดูดลมชาร์จเกจ / GaleBurst
windBasic:70 windEnh:101 windEnhExtra:102 windFeatherShoot:103 windCurveStep:114 windShieldShoot:118 windWallBlast:121 windStreamStart:125 windStreamEnd:126 windStreamTick:127
§137 โล่ปีก
windShieldBurst:138
§142 Dash: ผลักศัตรูข้างหน้า + ดีดตัวเราถอยหลังลอยกลางอากาศ
windDashGo:143 windDash:146
§153 กำแพงลม Aegis Gale
windWallMake:154 windWallStop:162 windWallBoom:163 windDmg:168 windRay:172 windBlockLen:180 windProjHit:185 windWallHurt:189 windCollide:191
§197 ทั้งสนาม: GaleBurst / กำแพงลม / ชนกำแพง
updateWind:198
§235 Windrift: ชาร์จปีก 0.2 → พุ่ง 400 (20 ม. ใน 0.09 วิ) แบบ Jett → ลงท่า…
windDriftTick:236 windDriftWind:243
§250 Vortex Bind: ทอร์นาโด 3 อันโค้ง 45° ห่าง 200 → 0.6 วิ ดึงกลับมาหยุด 6…
windVortexTick:251
§263 Void Spheres: หลุมดำลูกเดียว (ผู้ใช้ 2026-10-31, designs/wind.md)
windVoidCast:266 windVoidTick:268
§279 รูปแบบการเล่นสายลม (ผู้ใช้ 2026-11-08): บนพื้น = อ่อนลงทันที • บิน (F…
windAir:282 windSpin:282 windAirborne:283 windLift:284 windSink:285 windSlam:286 windSinkZ:288 windTargetZ:289 windSlotOf:293 windCdCut:294 windSlow:295
§297 Featherwing: กด → หมุนตัวบินวนขึ้น → บิน 8 วิ (ผู้ใช้ 2026-11-08)
windFlyTick:301 windFastOn:313 windFastOff:316 windFocusEnd:319 windAirMove:321 windFlick:330 windFocusAct:336 windOrbLaunch:339 windOrbBoom:344
§347 Downburst (ผู้ใช้ 2026-11-08): ลมกดจากฟ้าลงพื้นต่อเนื่อง — วงดาเมจ + …
§348 Tailwind (เดิม Windblade): ร่องลมจากตัวเราไปตามทิศเล็ง — เพื่อน+ตัวเร…
windTailCast:349 windTailIn:352 windTailTick:353 windDownCast:358 windPressDown:365 windDownTick:368
§375 Windup (เดิม Aegis Gale): ลมพัดขึ้น — วางวงลมตรงจุดเล็ง รอ 0.45 วิ แล…
windUpCast:377 windUpTick:384
§391 Wind Push (เดิม Windrift): ยิงลมแรงไปทางที่เล็ก
§394 Plume Volley (ผู้ใช้ 2026-11-09): ขนนกนีออนจากสองปีกสลับกันทีละอันเร็…
windVolleyCast:395 windVolleyTick:396 windPlumeShoot:397 windFeatherBoom:407 windPlumeBoom:408 windPushCast:410 windPushHit:413
§419 Windforce (เดิม Vortex Bind): พุ่งด้วยลม
§422 Slipstream (ผู้ใช้ 2026-11-08): แดชหมุนหลบตามทิศเดิน • 2 ชาร์จ 5 วิ/อ…
windSlipCast:423 windSlipTick:428 windForceCast:429 windSmash:435 windAheadHit:439 windForceTick:445
§465 Windblade (เดิม Void Spheres): ใบมีดลมเล็ก ๆ รัว ๆ
windBladeCast:467 windBladeTick:469 windBladeHit:473
§479 อัลติ Sonic Boom Strike (เดิม Eye of Heaven)
windUltCast:483 windUltTick:486 windUltSweep:511 windFloatZ:519 windSnapP:522 windSnapW:523
§526 สกิล (ผู้ใช้ 2026-11-08: รีดีไซน์ทั้งชุด — id เดิมไว้ให้ชุดสกิล/tune/…
W_WL:528 W_DR:534 W_VX:540 W_VO:546 W_FW:552 W_UL:561

## js/10-net.js (200) — 
PREFIX:4 NET:5 RC:9 TURN_SERVERS:12 ICE:13 PEER_OPT:14 TURN_URL:16 ICE_READY:18 JN:22 LAG:24 lagDo:25 hostSend:26 LOBBY:27 genCode:28 sendAll:29 NETD_KEYS:33 NETD:33 netDeltaReset:34 netDelta:35 NET_MAX:49 _netTE:49 netSendSnap:50 NETU:62 netUndelta:63 setStatus:69 hostGame:71 hostPeer:80 netConnect:100 joinWatch:111 joinFail:126 netLost:132 joinGame:147 joinPeer:158 clientOnData:173 leave:188 leaveRoom:190

## js/11-host.js (413) — 
G:4 EVL:4 EVN:4 hostLast:4 tickN:4 emit:5 feed:6 banner:7 plist:8 cleanName:9 freshStats:11 newPlayer:18 emptyInput:21 frameOk:23 addPlayer:24 initHostLobby:33 lobbyMsg:40 broadcastLobby:41 INPN:43 hostOnData:44 hostDrop:75 hostRemove:84 validate:97 hostStart:110 hostToLobby:136 MIDJOIN:143 modeCap:144 midJoin:145 CHATT:161 chatRelay:162 emoHost:170 resetBody:172 fmap:178 spawnPts:179 teamPts:181 spSpread:183 placeAll:184 respawn:196
§215 ลูปหลักฝั่งโฮสต์
hostTick:216 angDiff:231 cH:233 vR:234 updatePlayer:236 hitProp:400 damagePropsIn:407 nearUseProp:408 useProp:409

## js/12-buildings.js (528) — สิ่งปลูกสร้างที่พังเป็นชิ้นย่อย (บ้าน) แบบ Battlefield — คู่มือเต็ม: …
BLDDEF:8 BLD_PIECES:10 BLD_GRID:11 BLD_DOOR:13 BLD_FIRE:14 BLD_ICE:14 BLD_ROOF_MIN:14 BLDG:15 BLDON:15 genBldg:16 bldRect:26 bldChunk:28 bldAlive:35 bldLocal:36 bldWorld:37 rectDist:38 bldNear:39 BLD_MOUND:42 bldGone:43 bldMoundAt:44 bldMoundH:45 hitBldPiece:47 breakBldChunk:58 bldSupport:66 damageEnv:86 bldRay:104 _sgRB:112 aimClip:114 aimLineH:122 aimRay3:123 bldPieceAt:139 projEl:150 bldPush:155 collideBld:161 updateBldg:179 bldSnap:192 bldParse:198
§202 ของบังในแผนที่ไฟล์ที่พังได้ (หิน เสา รูปปั้น ต้นไม้ โคมไฟ ลัง ...) — …
BRKDEF:206 BRK_M:206 BRK_MCOL:206 BRK:207 genBrk:208 brkApply:215 brkStage:219 hitBrk:220 damageBrkIn:228 brkSnap:234 brkParse:235
§236 ตารางช่อง (spatial grid) สำหรับแมพใหญ่: หาเฉพาะของใกล้ ๆ แทนวนทุกชิ้น…
SG:239 sgObs:240 sgProps:240 sgGrid:242 sgNear:249 _sgCR:254 _sgCW:254 _sgCB:254 _sgCO:254 _sgPO:254 _sgPB:254 _sgPP:254 _sgM:254 _sgE:254 _sgA:254 _cwLast:256 collideWorld:257 shoot:297 eShoot:321 foesOf:328 breakShield:336 ULT_RATE:338 ultActive:339 gainUlt:340 lifesteal:341 damage:343 playerDown:403 killProj:424 explode:434 hitTarget:446 updateProjectiles:463 projStep:471

## js/12-city-dmg.js (270) — เมืองพังได้ (designs/city-bot-battle.md ขั้น 4) — ข้อมูลที่ทุกเครื่อง…
CITY_FL:8 CITY_PW:8 CDMG:9 CITYD:16 cityOn:17 cityLayout:19 cityReset:29 cityApplyBox:45 cityApplyItem:46 cityHex:47 cityMark:48 cityRampSync:49 cityPanelAt:51 cityHitPanel:56 cityTowerStart:70 cityTowerStrip:76 cityTowerFall:80 cityHitItem:91 cityHitObs:100 _sgCD:105 cityDamageIn:107 cityTick:118 _sgCM:129 cityMoundH:130 cityMounds:140
§146 ข้างในตึก (2026-10-28 ผู้ใช้: เดินเข้าได้ 1–3 ชั้น มีทางขึ้น • ผนังนอ…
CIN:150 cityInterior:151 cinSlabOn:180 cinOpenPanel:182 cityIwHit:184 cityRampHit:186 cinIwSegs:189 cinIwRects:190 cinSecAt:191 citySecHit:193 cinIn:195 cinHole:196 cinRampH:197 _sgCI:198 cityBoxGrid:199 cityRoomAt:200 cityFloorH:202 cityCeilH:207 cinWallRect:211 cityCollideIn:214 cityProjIn:224 _sgCS:242 citySolidAt:243 cityRay:252 cityRoomBox:255 citySnapB:256 citySnapS:257 cityParse:259

## js/13-enemies.js (171) — ศัตรู (โหมด Co-op)
spawnEnemy:2 setupWave:19 bossPhase:36 enemySlam:44 updateEnemies:55

## js/14-mode-rules.js (107) — กติกาของแต่ละโหมด
hostPick:2 clearField:10 modeLogic:11 endMatch:81 matchOver:107

## js/15-arena.js (71) — 
AR_SIDE:7 AR_TEAM:7 AR_MAX:7 arPads:8 arOn:9 arState:10 arBusy:11 arReady:13 arNames:21 arenaTick:22 arStart:43 arEnd:51 arReset:57 arAddBots:64

## js/15-bot.js (311) — 
BOT_LV:8 BOT_SKIP:16 botKit:17 botPersona:24 BOT_TEAM:25 BOT_MAX:25 bots:26 humans:27 botInZone:29 spawnBot:36 OWNED_K:50 clearOwned:51 removeBots:52 botPickTarget:54 BOT_PB:76 botPlay:77
§171 บอทยืนนิ่ง (ห้องฝึก): หุ่นผู้เล่น = ไม่ทำอะไร • บอทโชว์สกิล (ai.show)…
showName:172 showBot:173 stillBot:174 trShowCmd:189 aiBot:213 trBotCmd:275
§284 บอทในห้องรอ (ผู้ใช้ 2026-10-31 "สร้างห้องเล่นกับบอทได้")
BOT_MODES:288 lobbyBots:289 lobbyBotAdd:290 lobbyBotFill:299 lobbyBotCmd:304 lobbyBotsStart:309 botDebug:311

## js/15-botnav.js (140) — 
NAV_MAPS:14 NAV_EYE:14 NAV:15 navOn:17 navSig:18 navEnsure:26 navBuild:32 navCell:52 navWalk:53 navRay:55 navFree:60 navPath:66 _navFoe:84 botThink:87 botNav:94

## js/15-botplay.js (255) — 
BOT_RANGE:7 botMem:9 botWallBehind:11 _bspd:21 botSave:23 botWant:25 botClassPlanFor:57 botClassAim:58 botClassGround:63 botClassTarget:64 botClassLane:70 botClassPlan:73 botWindPlan:89 botNaturePlan:162 botCombo:232

## js/15-modes.js (419) — 
sendPriv:5 TASKF:9 taskPts:10 raceRings:11 modeInit:17 spawnDummy:64 trainTick:69 TR_KEYS:86 trTeams:88 trCmd:98 hostEndTraining:117
§119 ควิดดิช
quidThrow:120 quidDrop:126 quidArea:132 quidTick:133 snitchTick:169
§192 แข่งไม้กวาด
raceTick:193 raceRank:215
§225 แบทเทิลรอยัล
brTick:226 ITEMN:240 brPick:241
§250 หาลอร์ดโวลเดอมอร์
impActions:251 startMeeting:289 hostVote:296 meetTick:301 impCheck:320
§328 ระเบิดที่ตั้งเวลาไว้ (ลูกไฟมังกร / คลื่นไฟ)
bombTick:329 modeSnap:342
§367 สร้าง snapshot ส่งให้ทุกเครื่อง
r1:368 DEFP:370 packP:371 unpackP:372 makeSnap:373 PROF:391 pf:392 hostSent:393 hostLoop:394 HLW:409 pingN:419

## js/15-siege.js (203) — 
SGV:12 SG_TEAM:24 sgF:25 sgCore:26 sgInZone:27 sgSpawn:28 sgInit:29 sgWallsApply:38 sgWallDmg:42 sgWallHit:48 sgWallEnv:49 sgInput:54 sgStop:62 sgTick:63 sgCoreDown:94 sgEnd:107 sgResult:109 sgSnap:115 SGB:124 sgBotTarget:126 sgBotGoal:137 sgUnstick:149 sgBotThink:162

## js/16-voice.js (89) — 
VOICE:4 rosterIds:5 toggleMic:6 voiceSync:20 teamOn:37 teamOf:38 applyVoiceGates:39 VAC:49 onIncomingCall:50 voiceLevels:62 speakingIds:70 updateVoiceUI:76

## js/17-input.js (66) — 
INPUT:4 mouseX:5 mouseY:5 showBoard:5 SET_DEF:6 SET:7 KEYACT:9 KMAP:10 PMAP:10 SKORD:11 rebuildKeys:12 keyName:22 _rebind:24 MSANE:50 mouseSane:51 cvEl:66

## js/18-audio.js (306) — 
AC:4 MASTER:4 SFXBUS:4 REVERB:4 NB:4 WIND:4 TOOL_CTX:6 toolSoundOn:7 masterGain:8 toolSoundApply:9 sfxLast:11 ac:12 outNode:33 tone:48 noiz:54 snd:61 sfx:124
§126 ไฟล์เสียงจริง (โฟลเดอร์ audio/) — เริ่มโหลดเมื่อ ac() ถูกเรียกครั้งแร…
SFXN:128 SFXV:129 SFXR:130 SFXSYN:131 BUF:132 AUD:132 loadBuf:133 loadSfx:134 playBuf:139 AMB:147 ambTick:148 MUSF:159 MUSF_VOL:160 STINGERS:160 musicEl:161 fadeMusic:169 stopFileMusic:173 isWin:174 wantTrack:182 fileMusicTick:192
§209 "เพลงของฉัน": เลือกไฟล์เพลงจากเครื่องตัวเอง เล่นแค่ในเครื่องนี้ (ไม่อ…
MY:210 myDB:211 mySave:212 myLoad:215 myDecodeReady:221 myPlay:222 myNext:234 myClear:235 myInfo:236 windUpdate:242
§256 เพลงประกอบ (สร้างสดตามแผนที่)
MUSIC:257 THEMES:258 padNote:263 musicTick:270 toggleMusic:299

## js/19-client.js (281) — 
cv:4 cx:4 DPR:5 SW:5 SH:5 resize:6 VIEW:12 screen:13 lastBuffKey:13 overShown:13 lastCount:13 PARTS:14 TEXTS:14
§15 งบเอฟเฟกต์ (VFX budget)
VFXB:20 _apush:21 vfxQual:29 vfxBegin:31 vfxEnd:34 vfxOnce:36 vfxExtra:38 PCOL:39 setScreen:41 onLobby:53
§59 ภาพของโฮสต์ลื่น (ผู้ใช้ 2026-10-31 "ขี่ไม้กวาด/กระโดด กล้องสั่น")
HVB:63 HBOLD:63 hbReset:64 hbPush:65 hbPair:68 onSnap:72 snapApply:77
§87 บัฟเฟอร์ snapshot (ลูกข่าย, ผู้ใช้ 2026-10-22 "เล่นออนไลน์ให้ลื่น")
SBUF:90 NETOLD:91 sbufReset:92 sbufPush:93 sbufAdvance:103
§115 ทำนายตัวเอง (ลูกข่าย): ตัวเราขยับทันทีที่กด ไม่ต้องรอโฮสต์ตอบ
PRED:118 predictMe:119 myPos:140
§142 เอฟเฟกต์
burst:144 smoke:155 ring:156 floatText:157 shake:158 wandPos:159 impactFX:161 explosionFX:178
§190 เอฟเฟกต์คาถาใหม่
ZV:191 COLB:191 WVV:191 GLV:191 ICEV:191 SLV:191 ULTV:191 OBV:191 _iceDisc:193 _iceEdge:194 _iceSpk:195 iceFloorMat:196 _icePlane:197 _icePathMat:198 _iceWvM:198 iceWvMat:200 makeIceFloor:212 ICE_WV:239 updateIceFloors:240 FLASHM:252 FLASHING:253 flashModel:254 endFlash:263 tickFlash:264 GHOSTM:266 SOLIDM:266 ghostOf:267 setGhost:273 hitSparks:281

## js/20-vfx-pyro-storm.js (417) — Dragonfall (ภาพ)
makeDfCircle:3 DFV:21 dfCracks:22 updateDfCracks:32 dragonfallFX:33
§85 สายฟ้า (ภาพ)
TBN:88 TBA:88 TBF:88 TBMAX:88 _tv:89 _tt:89 _ts:89 _tw:89 tbLayer:91 TBL:96 TBC:97 _tcc:98 tbGet:99 tbolt:101 tboltP:110 tbWrite:111 updateBolts:119 LATER:136 STV:136 SBV:136 SDV:136 TSV:136 CLV:136 stTgPos:138 STCLAW:142
§146 รอยกรงเล็บ (อัลติสายฟ้า): รอยข่วน 3 เส้นโค้งปลายแหลมขนานกัน ตั้งขวางห…
clawGeo:149 clawRakes:154 updateClaws:168 later:176 stFade:177 stBeam:178 shellPt:183 updateStormV:184 _ev:220 GODPTS:222 bWorld:224 stormClawSwipe:228 stormFX:255 STHUD:372 drawStormHud:373

## js/21-vfx-frost.js (206) — น้ำแข็ง (ภาพ): ชิ้นผลึก/หนาม/แผ่นน้ำแข็งชั่วคราว (โผล่ → ค้าง → หด) •…
FRV:2 _cryG:3 _spkG:3 _plateG:3 _hexG:3 _iceFxM:4 _frostM:4 iceFxM:5 frostM:6 ICEP:8 _im4:8 _iq:8 _ie:8 _ip:8 _is:8 icePool:9 iceBit:10 iceChips:13 updateFRV:14 iceRing:24 chillFX:25 makeSlash:41 _wbGeo:49 crescentGeo:51 makeWaveBlade:54 WGH:68 updateSlashes:69 _glGeo:82 _glMat:82 _glMat2:82 makeGlacier:83 updateGlacierVis:114 updateOrbShots:123 updateZV:133 WM3:206

## js/22-models.js (340) — โมเดลจากไฟล์ (.glb จาก Blender) — ข้อตกลงฝั่งคนปั้นอยู่ใน guides/ASSE…
MODELS:5 modelManifest:6 gltfLoader:11 loadModel:16 modelInst:31 modelOr:32 prefetchModels:44
§46 Animation จากไฟล์ (Blender Actions) + โมเดลตัวละคร/ศัตรูจากไฟล์
ANIM_ALT:49 makeAnimator:50 animResolve:55 animPlay:56 _animN:66 animLod:67 animTick:68 lookTint:88 tintModel:92 shareSkinSkeletons:107 batchStudentSkin:115 _palPx:134 palPixels:135 _s2l:138 mergeStudent:139 _matTw:174 matTwin:175 useFileModel:179 rigStage:205 fileVariants:207 fileBroom:208 _rq:212 _rq2:212 _rq3:212 rigBind:213 rigStd:221 rigSync:222 FILE_MODELS:233
§235 VFX จากไฟล์ (รายละเอียดฝั่งคนทำอยู่ใน guides/ASSETS.md)
VFXL:241 FLIPL:241 FLIPS:241 prefetchFx:242 playVfx:243 vfxSeq:289 flipTex:294 playFlip:302 fileFx:317 zoneFx:324 clearVfx:325 updateVfx:326

## js/23-props-bld-view.js (409) — prop ฝั่งแสดงผล
PROPV:2 propFallback:4 farCull:33 syncProps:34
§51 บ้านพังเป็นชิ้น ฝั่งแสดงผล
BLDV:54 CHARM:54 DEBRIS:54 BLD_WALLC:55 _bldIce:56 _halfRoof:56 charMat:57 bldIceMat:61 halfRoofGeo:63 bldMats:71 bldFallback:77 bldFilePiece:113 bldHasChunks:121 bldFallbackChunks:123 bldRubble:131 _moundMat:142 bldMound:143 BLD_RUBBLE_H:165 bldBuild:166 syncBld:190 bldDebris:224 bldChunkFall:252 updateDebris:265 debrisDrop:280 debrisCap:282 clearDebris:283 drawPropHint:284 syncWalls:292
§310 ของบังในแผนที่ไฟล์ที่พังได้ ฝั่งแสดงผล (สถานะจาก BRK[].st — host js/1…
BRKV:313 BRK_COL:313 brkSetup:314 BRK_CM:333 brkCrackMat:334 brkClip:350 brkYc:365 brkStump:367 brkSync:377 BRK_ZERO:398 brkFall:400

## js/24-minions-view.js (68) — สัตว์เวท: โมเดลโปร่งแสง + ซิงก์จาก snapshot (MN)
MM3:2 makeMinion:3 syncMins:36 drawMinBars:58

## js/25-efx.js (311) — efxFX: ภาพของ event "efx" ทุกคาถา (หนึ่ง case ต่อหนึ่งเอฟเฟกต์)
efxState:4 efxFX:20

## js/26-fx-events.js (241) — fx(ev): เอฟเฟกต์+เสียงของทุก event จากโฮสต์ • statusFX (สถานะบนตัว) •…
statusFX:3 fx:27
§209 overlay: เลือกบัฟ / สรุปผล
choosePick:210 syncOverlays:215 showOver:236

## js/27-world.js (402) — 
S3:4 tx:4 tz:4 CITY_KERB:7 cityKerb:8 GY:9 TW:9 hdr:10 gl:12
§20 เงานุ่มแบบ PCSS (contact-hardening): ใกล้จุดสัมผัสคม ไกลจากวัตถุที่บั…
PCSS:23 scene:50 cam:52 composer:53
§54 ท่อภาพ (post-processing): ฉาก → ชั้นเอฟเฟกต์นุ่ม (FXPass) → แสงฟุ้ง →…
rpass:57 fxScene:59 SOFTU:61 SOFT_GLSL:62 FXMATS:64 fxMat:65 softify:67 HAZE_U:72 AOU:76 GFX:82 AO_ON:83 AO_HEAD:84 AO_CALC:88 AO_COPY:102
§123 TAA (ลบขอบหยักแบบสะสมหลายเฟรม) — กราฟิกสูงเท่านั้น • ปิดด้วย ?notaa
TAA:126 TAA_FRAG:127 _taaH:142 taaWanted:143 taaBegin:144 taaEnd:152 taaFinish:153 taaResolve:155 AO_RT:165 fxPass:186 bloom:187 GRADEU:194 gradePass:215 aaPass:233
§235 คุณภาพกราฟิก: auto = ปรับความละเอียดเองตาม FPS / high = สวยสุด / low …
QUAL:236 QUAL_NAME:237 qualPR:238 applyQuality:244 qualTick:265
§281 ประหยัด CPU สำหรับเครื่องอ่อน (ผู้ใช้ 2026-11-06 "เครื่องผู้เล่นแย่กว…
qualCS:285 CULL:286 cullTick:287 texCanvas:298 glowTex:299 stoneTex:300 runeTex:306 glowMats:314 glowMat:315 STONEM:317 stoneMat:318 shadowAll:319 SKY:322 hemi:343 moonL:345 LDIR:349 setSky:350 SKYB:362 skyFollow:363
§364 เงาตามผู้เล่น
SHD:368 _shF:369 _shR:369 _shU:369 _shC:369 _shY:369 SHD_DM:373 shadowDepthSplit:374 shadowFollow:379 shadowSoft:399 LPOOL:401

## js/28-city-build.js (386) — เมืองมักเกิ้ล (ลอนดอน) — ภาพ • ข้อมูลอยู่ js/02-city.js • โมเดลจาก as…
CITY_WIN:4 cityWinTex:5 cityEmTex:10 cityBoxGeo:16 buildCity:21
§102 ข้างในตึกกลวง (ภาพ — ผัง I จาก cityInterior js/12-city-dmg)
cityInteriorView:106 cityHideIn:147 cityMoundView:153
§176 ชุดโมเดลลอนดอน (assets/city/*.glb จาก assets/src/city_kit_build.py)
CITY_STY:181 CITY_VEH:188 cityFacade:190 CITYK:203 _cZ:204 _cT:204 _cR:204 _cC:204 cityKitLoad:205 cityCull:227 citySet:233 cityTint:235 cityPools:237 cityShowBld:243 cityRubble:250 CITY_FALL:258
§259 ตึกไฮไลต์ล้มทั้งตึก (ขั้น 7)
_ctA:262 _ctB:262 _ctC:262 cityTowerPose:263 cityTowerAnim:271 cityTowerRubble:278 CAREA:292 cityAreaSync:293 cityViewSync:305 cityDebris:349 cityFX:358

## js/28-fcs-build.js (120) — 
buildFcs:5
§31 ภาพโหมด (ลูกข่ายทุกเครื่องจาก snapshot M.sg)
SGV3:32 sgClearView:33 sgViewBuild:34 SGVZR:53 sgBarrier:55 sgSync:69 sgDust:90 sgFx:91
§96 HUD
sgTop:97 sgHud:99

## js/28-maps-build.js (776) — สร้างแผนที่
CANDLESYS:2 builtMap:3 builtKey:3 world:3 TORCHES:3 CANDLES:3 FIREFLIES:3 CRYSTAL:3 RUNE:3 SNITCH:3 BANNERS:3 SNOW:3 WCACHE:5 WCACHE_MAX:5 wkey:7 buildWorld:8 addW:44 _prewarmed:46 prewarmShaders:47 batchStatic:66 makeCandles:91 updateCandles:100 buildCastle:109 buildHogsmeade:175 buildGreatHall:263 buildForest:333
§430 ทุ่งหญ้าฮอกวอตส์ (เย็น)
ringTrees:431 grassTex:440 buildMeadow:441
§460 ทะเลสาบน้ำแข็ง (กลางคืน)
buildLake:461
§482 ซากลานประลอง (เย็น ทราย)
§483 Test Place (ห้องฝึก): พื้นตารางเรียบๆ กลางวัน + วงโซนเสกมอนสเตอร์
§484 บรรยากาศที่ใช้ร่วมกัน (แผนที่จากโค้ด + แผนที่จากไฟล์ผ่าน fx ใน guides…
makeSnow:485 makeFireflies:492 makeSnitch:499 fileMapFx:506
§516 แผนที่จากไฟล์ Blender (guides/MAP-DESIGN.md)
terrGeo:518 buildFileMap:526 tickM:567 TRPAD:568 ARPAD:568 SHPAD:568 signTex:569 testSign:570 buildTest:577 buildRuins:682 buildPitch:707

## js/29-characters.js (439) — ระบบผ้า (เสื้อคลุมพลิ้วตามการเคลื่อนที่)
makeCloak:2 updateCloth:10 wandNamed:34 wandSparks:83
§92 โมเดลนักเรียนเวทมนตร์
SHGEO:94 SHMAT:94 SHTEX:94 sGeo:95 sMat:96 bMat:99 matKey:101 bodyPatch:107 BODYM:114 bodyMat:115 plainMat:120 mergeBody:121 sStripe:157 hashStr:158 stripeTex:159 shieldMat:160 addStatus:168 makeStudent:174 makeEnemy:281 keepTex:419 keepMatSet:420 disposeMaterial:421 disposeTree:427 disposeObj:437 PM3:438 EM3:438 JM3:438 clearDyn:439

## js/30-particles.js (366) — อนุภาค 2 ชั้น: แสงเรือง (additive) + ควัน (normal)
PMAX:2 PGLOW_OCC:6 PLIT:6
§7 อนุภาคบน GPU (ผู้ใช้ 2026-11-06 ลองเล่นแล้วให้เปิดทุกคน • ?cpup = กลั…
PGPU:10 PGPU_F:10 PG_U:10 PGPU_HEAD:11 PGPU_DEAD:18 PGPU_MV:19 pgpuGeo:20 makePointSys:24
§72 เปลวไฟ: FLAME_STYLE 0 = อนุภาคกลมเรืองแสง (ไม่ใช้รูปเปลว) • 2 = แบบให…
PBLOB:74 PCEL:75 FLAME_STYLE:76 PTIME:77 NOISETEX:79 FLAMETEX_V1:85 FLAMETEX_V2:90 PSYS:100 FLAMELUT:124 FLAMECOL:127 flame:128 PFB:137 ptexUse:138 ptexLoad:164 colCache:166 colCacheV:166 col3:168 CURL:171 CURL_V:172 curlAt:173 pgpuSpawn:176 _pgF:190 updateParticlesG:191 updateParticles:206
§247 เอฟเฟกต์รูปทรง: แฟลช / วงแหวน / โดม / รอยไหม้ / สายฟ้า / แสงชั่วคราว
SHAPES_Q:248 SHAPES:248 FLASHL:248 LINES:248 LREQ:249 ringGeo:250 ringVGeo:251 arcGeo:252 domeGeo:253 fullGeo:254 discGeo:255 decalTex:256 FX:257 jag:271 SHB:285 _sbM:285 _sbQ:285 _sbE:285 _sbS:285 _sbC:285 SHB_GEO:286 _sbDecalMat:287 shbMat:288 shbMake:299 spawnShape:311 updateShapes:321 _cp:351 updateLights:352

## js/31-camera.js (189) — กล้องมุมหลังไหล่ (แบบ Hogwarts Legacy)
yaw:2 pitch:2 lastPh:2 locked:2 CAMRS:3 SENS:4 saveSet:5 applySettings:6 camPos:14 camLook:14 overlayOpen:17 showPause:18 hidePause:19 MAPCAM:20 PLACE:22 placeKey:23 updatePlaceGhost:31 _aimD:45 rayTerr:47 aimFromCrosshair:53 AIMZ:85 WBY:85 CAM_FRAMES:89 CAM_FRAME:99 CAM_TRACK:99 _camFocus:100 _camAnchor:100 _camWant:100 cameraFrame:101 camRoomK:124 updateCamera:134 menuCamera:185

## js/32-stage.js (315) — เวทีเมนู/ล็อบบี้: ห้องโถงมืด แท่นวงเวททอง เทียนลอย (ฉากแยกจากแผนที่)
stage:2 STAGE:5 STAGE_Y:6 stageSpots:58 stageChar:74 POSES:81 stageIdle:87
§109 เอฟเฟกต์หน้าเมนู (โชว์เฉพาะหน้าแรก ไม่โชว์ในล็อบบี้/หน้าสร้างตัวละคร)…
stageMenuFx:135 _sv:146
§147 ฉากประจำบ้าน (โผล่ตอนเลือกบ้านในหน้าสร้างตัวละคร)
CRESTTEX:148 crestTex:149 crestBanner:157 buildHouseEnvs:165 TONE0:213 _tc:214 stageTone:215 stageScreen:228 renderStage:229 drawStageLabels:286

## js/33-pyro-view.js (287) — ภาพของสายไฟ (pyroFX: ชาร์จ/พุ่ง/ดีดนิ้ว/กลายร่าง/Dragonfall/Colossus)…
§2 sync ตัวละคร/ศัตรู/ลูกเวท กับ snapshot
localVel:3
§11 ภาพของสายไฟ: ชาร์จลูกไฟ / ย่อตัวชาร์จพุ่ง / วงเวทพ่นไฟ / ดีดนิ้ว / กล…
_pw:12 simOf:13 makeColossus:14 makeMagicCircle:67 _fsGeo:77 fireShieldFX:79 pyroFX:98

## js/34-frost-view.js (260) — ภาพของสายน้ำแข็ง: ดาบ/ขวานน้ำแข็งที่ปลายไม้ ท่าฟัน โล่อัศวิน ไถล แช่แ…
iceMat:2 iceRim:3 makeIceSword:4 makeIceAxe:23 makeKiteShield:39
§51 อาวุธน้ำแข็งลอย (ผู้ใช้ 2026-10-22: "ร่ายคาถาให้ดาบฟันเอง ระยะเท่าเดิ…
FWS:54 FWA:54 _fwM:55 _fwM2:55 _fwX:55 _fwY:55 _fwZ:55 _fwP:55 _fwS:55 _fwQ:55 _eo:56 _ei:56 _ss:56 fwAim:58 fwWeapons:59 FWP:61 FWT:61 fwChop:62 fwSweep:63 FF_RISE:64 fwIdle:65 fwSwing:68 FWL_N:80 fwLink:81 fwMat:84 frostFX:85

## js/35-sync.js (589) — ซิงก์ผู้เล่น/ศัตรู/ลูกเวทจาก snapshot + ฉายตำแหน่งลงจอ (ป้ายชื่อ/ตัวเ…
§2 ท่าร่ายคาถาแบบนักเวทในหนัง Harry Potter (ผู้ใช้ 2026-10-22: "ยิงปกติท…
CPOSE_T:7 _ce:7 _cs:7 _cb:7 AMP_B:9 AMP_S:9 CP_BEND:10 CPOSE:12 _cpT:20 _cpR:20 CGUARD:20 CP_STEP:21 CPCOL:22 castStyle:23 castStart:24
§25 ท่าร่ายสกิล / อัลติ / โล่ (ผู้ใช้ 2026-10-22: "เกือบทุกสกิลควรมีการเห…
CANIM:30 SKFEET:78 SKANIM:80 skAnim:88 _caT:89 _caR:89 skillPose:90 _g2:116 wandTwoHand:117 characterPoseMix:124 characterStance:125 CBLOCK:132 CBLOCK_PATH:133 blockPose:134 castPose:140 lateSkillPose:146 castPose0:147 clearCharacterCast:176 syncPlayers:181 syncEnemies:282 projGeo:320 tailGeo:321 _t1:322 makeProj:323 _a:344 _b:344 PJFX:346 syncProj:347 _awT:435 animateWorld:436
§477 ฉายตำแหน่ง 3D ลงจอ (ป้ายชื่อ / ตัวเลขดาเมจ)
_v:478 toScreen:479 BURNC:487 burnNum:488 NAMETAG:502 nameTag:503 drawLabels:507 TEXTAG:537 textTag:538 drawTexts:542 HITM:554 DIRI:554 drawXh:556 drawCrosshair:566

## js/36-modes-view.js (171) — 
ROLE:4 KC:4 roleShowT:4 onPriv:5 MO:10 BREATHS:11 clearModeObjs:12 ITEMC:21 healTex:22 makeItem:23 syncModeObjs:39
§140 หน้าประชุมโหวต (หาลอร์ดโวลเดอมอร์)
meetKey:141 myVoted:141 castVote:142 syncMeeting:148

## js/37-render-loop.js (109) — ลูปเรนเดอร์
lastFrame:2 HSTOP:5 hitStop:6 FXSTUDIO:8
§9 เก็บ shader ที่ compile แล้วไว้ตลอดเกม (ผู้ใช้ 2026-11-02 "เล่นกับบอท…
PINMAX:13 PINNED:13 KEEPSRC:16 pinPrograms:22 frame:25 _fpsAcc:41 _fpsN:41 _fpsLast:41 render:42 renderGame:85

## js/38-hud.js (348) — HUD
rr:2 SLOTS:3 fmtTime:4
§5 ชิ้นส่วน HUD ธีมทอง-น้ำเงิน
HG:6 HG2:6 HUDF:8 hudTick:9 readyPulse:11 diaPath:13 plate:15 frameBox:21 bossTrail:29 drawBossBar:30 spellDia:50 thinBar:79 drawHUD:84 raceRankClient:165 drawModeHUD:169 MM:207 drawMinimap:208 slotKey:281 mySlots:282 STATUS_ICO:291 SLOTS_IMP:292 BR_LOCK:293 CLUSTER:295 E_NEEDSTAND:296 slotState:297 drawBottom:316 drawBoard:331

## js/39-menu.js (286) — 
myLook:5 myColor:5 myKit:5 myName:6 renderMyHouse:9
§11 หน้าสร้าง/แต่งตัวละคร (2 ขั้น: 1 หน้าตา → 2 เลือกบ้าน)
crLib:12 crSaved:12 crKitSaved:12 crOpen:12 crStep:12 crTab:12 crFirst:12 crKitOnly:12 crSlot:12 CRTABS:13 sw_:14 bt_:15 nameBox_:16 crPanelSet:17 crRenderStep1:22 crRenderWand:33
§36 ขั้น 3: สาย + ชุดคาถา
ROLE_COL:37 roleTag:38 DESIGNED:39 spellTags:40 spellDescHTML:47 baseDescHTML:51 SB_THEME:59 ROLE_ORDER:68 sbFxRun:69 sbFxT:69 sbParts:69 crRenderKit:70 sbStartFx:99 sbFxTick:100 sbBurst:127 crAssign:133 crRenderHouse:142 crGo:149 crSaveName:161 crSetHouse:162 openCreator:163 closeCreator:173 lobbyKitSend:180
§222 ฉากเปิด (#intro) + ประกายบนหน้าเมนู (#menuFx)
TITLE:225 titleSpark:226 TSPR:228 titleSprite:229 titleDraw:230 titleLoop:240 titleGo:251 JOINQ:259 ovResult:279

## js/40-train-settings.js (247) — เมนูทดลอง (ห้องฝึก / Test Place)
trOpenF:2 trKey:2 trN:2 TR_OPTS:3 trToggle:4 trSend:9 trSync:14
§48 แท่นเสกบอท (โซนเสกบอท ห้องฝึก, trBotPad js/02): ยืนบนแท่น = เมนูขึ้น …
bpOpen:49 bpOn:49 bpKey:49 bpShow:51 bpSync:53 hovEl:123
§124 หน้าตั้งค่า
setRow:125 setTog:126 setTab:127 XHC:128 XHN:128 setOpts:129 SET_ICO:131 SET_EN:134 renderSettings:135 drawXhPrev:157 openSettings:158 closeSettings:160 modeIcon:216 modeTitle:217 renderLobby:218

## js/41-debug.js (171) — 
botBrain:6 _obsKeep:49 balArena:50 balReset:51 balDuel:55 balTour:70 balCoop:84 balSpellTest:100
§121 Service Worker (sw.js): เก็บไฟล์เกมไว้ในเครื่อง เปิดครั้งต่อไปเร็วขึ้…
SWK:122 swSetup:123
§141 เช็คการ์ดจอตอนเปิดเกม
GPUC:144 gpuCheck:145

## js/42-fire-vfx.js (353) — ไฟแบบใหม่ (2026-10-19): shader ไฟเคลื่อนไหวจริง (noise ไหล) ใช้กับลูก…
FIRE_U:4 FIRE_GLSL:5 fireMat:27
§59 ชิ้นงานสำเร็จรูป
_fbGeo:60 _fbGeo2:60 makeFireBall:62 _ftGeo:70 makeFireTail:71 makeFireWall:74 FIREV:82 fireBlast:83 fireTemp:88 updateFireV:89
§94 ปีกไฟ (Dragonfall) จากไฟล์ Blender mesh_fire_wing (assets/src/fx_mesh…
makeFireWings:97 poseFireWings:104
§105 ชิ้นงานพื้น/กระแทก (รอบ Pyro 2026-10-19): พื้นแตกเป็นใย (ดำ + ไฟลุกตา…
_crackPaths:108 _crackGeo:117 _decM:121 _crackRibbon:123 fireCrackWeb:131 _charTex:153 charTex:154 _discGeo:157 scorch:158 _fruneTex:162 fruneTex:163 fireRune:171 _rockGeo:177 _rockM:178 _rockRestProx:179 rockChunks:180 fireGeyser:189 _mv1:197 _mv2:197 fireMeteor:198
§210 อากาศร้อนบิดเบี้ยว (heat haze) — Blazeform "ออร่าความร้อน" (ผู้เล่น 2…
HZM:213 hazeMat:214 _hzPlane:224 _hzRing:225 hazeOf:227 fireBurn:232
§241 ไฟ 3 มิติจริง (volumetric) — ผู้เล่น 2026-10-19: "ไฟดูเป็นภาพ 2D เกิน…
NOISE3D:246 FIRE3D:255 _fvIdx:260 fireVol:261 fireVolTemp:306
§307 ไฟ 3 มิติที่ bake จาก Blender ทั้งก้อน (วิธี 1 — ผู้เล่นเลือก 2026-10…
FSEQ:311 fireSeqLoad:312 fireSeqReady:316 fireSeqVol:317 fireSeqAt:339 _sqA:346 _sqB:346 _sqX:346 _sqY:346 _sqZ:346 _sqM:346 fireSeqLine:347

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

## js/44-vfx-kit.js (374) — 
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
SCR:351 impactFrame:354 screenFlash:355 screenRadial:356 screenKick:357 screenHurt:358 _scv:359 updateScreenFx:360 updateVfxKit:374

## js/45-fx-runtime.js (395) — 
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
FXGEO:202 fxMerge:203 fxRibbon:208 fxGeo:214 fxEnergyMat:234 fxWaterMat:249 fxToonWaterMat:262 fxWindShellMat:278 fxToonMat:287 fxMeshMake:295 fxMeshTick:317 fxFlipTex:332
§337 หางแสง / รอยฟัน
fxTrailTick:338
§344 สายฟ้า
fxBolt:345
§351 ฟังก์ชันในโค้ดที่ไฟล์เรียกได้ (ชั้น t:"code")
FXCODE:352
§365 ผูกกับ event ของเกม (assets/fx/bind.json) — เรียกจาก fx(ev)
fxLoopName:367 blzFxName:368 fxLoopKeep:369 fshHitFx:371 fxBind:374
§385 แม่แบบ playFx เป็นไฟล์ (assets/fx/tpl/*, sig/*, rec/*)
fxTpl:387

## js/46-fx-make.js (356) — 
FXMK:10 MKD:11 mkRng:12 mkHash:13 mkNoise:15 mkL:17 mkR2:18
§19 ที่เก็บจุด/สามเหลี่ยม
mkG:21 mkPc:22 mkV:23 mkQ:24 mkAppend:25 mkCopy:26 mkFlat:27 _mkv:28 mkXf:29 mkThree:32 mkTRS:34 mkGrid:37
§38 ชิ้นส่วน (k) — พิกัด: ฐานอยู่ที่ y=0 (ยกเว้น sphere/box อยู่กลาง)
§39 ปั้นเอง (k:"poly"): จุด v + หน้า f (เลขจุด ทวนเข็มเมื่อมองจากด้านนอก)…
mkCC:40 MKGEN:51
§113 ตัวแต่ง (ทำตามลำดับ): เรียว → บิด → โค้ง → ขรุขระ → แบน(เหลี่ยม) → ขน…
mkDeform:114 mkOpts:125 mkPart:126 fxMeshBuild:139 fxModelBark:164 fxModelEmission:198
§207 โหลด
_fxMQ:209 fxMeshQueue:210 fxMeshLoad:211 fxMeshGeo:213 fxMeshSet:215 fxTexLoad:217 fxTexUse:220 fxTexNeed:223
§224 โมเดลงอกทีละชิ้น (ชั้น mesh: grow 0..1 เส้นโค้งได้, stagger, growBy)
FXGROWBY:226 fxGrowInit:227 fxGrowTick:229
§234 วัสดุภาพบนรูปทรง (mat:"tex") — ภาพที่วาดในสตูดิโอ (tex/…) ไหลบนผิว + …
fxTexMat:236 fxTexMatBind:249 fxTexMatTick:252
§253 เศษโมเดลกระเด็น (emit look:"model") — หิน ผลึก ขนนก เศษดาบ: หมุน ตกตา…
FXMP:255 MPLOD:259 MPLOD_PX:259 MPLOD_ON:259 fxMPParticleGeo:260 fxMPMat:265 fxMPGroup:269 _mpM:274 _mpQ:274 _mpE:274 _mpP:274 _mpS:274 fxMPUpdate:275 fxMPClear:289 fxMPSpawn:291
§295 อากาศบิดเบี้ยว (ชั้น warp) — ไอร้อน / คลื่นกระแทกบิดภาพ / เลนส์โป่ง •…
WB:298 wbInit:299 wbBegin:309 wbEnd:310 fxWarpMake:311 fxWarpTick:324
§332 ไฟ 3 มิติจากการจำลอง (ชั้น vol) — ไฟล์รูปแบบเดียวกับที่เพื่อน bake จา…
FXVOL:335 fxVolLoad:336 fxVolTex:340 fxVolSet:343 fxVolReady:344 fxVolMake:345 fxVolTick:348 fxPreAssets:353 fxAssetsWait:355

## js/47-earth-view.js (711) — 
ECOL:9 EGUARD_BIG:14 EGUARD:14 CB:15 EV:16 eW:17 eYaw:18
§19 ลายผิว (วาดเองบน canvas: หิน/ทราย + รอยร้าว + ขอบบล็อกแบบ Roblox)
ETEX:20 eTex:21 eFadeTex:35 eMat:37 eTMat:38 rockGeo:39 ROCKU:45 rockMesh:46 coneMesh:48 _eChunkM:50 eChunks:51
§53 Stand (บล็อกหิน/ทรายครึ่งตัวบน)
makeStand:55
§92 Rampage: เกราะลมหน้า Stand (ผู้ใช้: เหมือนอุกกาบาตตกโลก ต้านลม — เปลื…
makeBow:94 EBOW:103 _RIM:103 eRampWind:104 eSpikes:116 standOp:121 _ikDn:124 eArmIK:125 PK:132 standPose:134 _eRq:160 _eRq2:160 _eRx:160 standRun:161 eState:179 eStandOf:180 eGiantOf:181 eSandFall:183 eAppear:184 eAim:186
§189 วงเตือนบนพื้น (BA ชาร์จ / จุดปาเสา): วงเข้มก่อน แล้วสีอ่อนค่อย ๆ เติม…
makeWarn:190 eWarnAt:195
§196 ทุกเฟรม: ผู้เล่นสายดิน (เรียกจาก syncPlayers)
earthFX:197
§290 สว่าน (ref: designs/earth_ref/drill_ref.png): หินแหลมเรียวเป็นตัวหลัก…
eSteelEnv:292 eHeatTex:297 EDR:302 eDrillGeo:303 makeDrill:309 drillHeat:316
§318 เสายักษ์ (ref: designs/earth_ref/pillar_ref.png): เสาเหลี่ยมยาว ปลายห…
makePillar:319
§325 กระสุนหิน
earthProjMesh:326 SLAB:332 makeSlab:333 eSlabGeo:338 eSlabMats:349 slabCracks:416
§419 สิ่งก่อสร้าง + ฝุ่น (เรียกจาก render loop)
earthClear:420 eMergePartial:428 eMergeKids:433 eMakeSO:441 syncEarth:458 earthFog:501 eMudScreen:504 _eOlMat:511 eOutlines:513 _eCamT:518 eAnim:519 eDebris:520 eWave:522 eAirWave:524 esbImpact:527
§534 event "efx" ของสายดิน (เรียกจากต้น efxFX) — คืน true = จัดการแล้ว
earthEfx:535 eWindOut:624 eAirCone:630 eDrillFly:632
§636 บึงโคลน (Mud Swamp + บึงจากเสาอัลติ): คลื่นกระเพื่อมจากกลางไปขอบ แล้ว…
earthMudZone:637 earthMudSink:644
§645 HUD ใต้เป้าเล็ง
ESM:647 eSmooth:648 ESF:651 eShieldFx:652 eChips:657 eShieldSegs:660 eShieldNum:674 eShieldArc:678 drawEarthHud:691

## js/48-ragdoll.js (227) — 
RAG:10 RAGJ:23 RAGB:29 RAGS:33 RAGMIN:37 RAGHINGE:39 _rv1:40 _rv2:40 _rv3:40 _rqa:40 _rqb:40 _rm:40 ragBones:41 ragBasis:48 ragTargets:56 ragStart:62 ragBack:88 ragFloor:89 ragStep:90 ragPose:155 ragWrite:170 ragRestore:182 ragEnd:186 ragTick:188 ragHideDead:222

## js/49-cloth.js (132) — 
CLOTH:10 CL_ROWS:26 CL_NC:26 CL_GAP:26 CL_IN:26 _clV:27 _clA:27 _clB:27 clPinK:29 clBind:31 clothSetup:34 clTargets:68 clReset:72 clCapsule:74 _clO:78 clWorld:79 clWorldHit:88 clStep:93 clDraw:106 clothTick:113

## js/50-grass.js (403) — 
AIR:10 AIR_MAP:17 AIR_NG:20 airGust:21 airGustOff:26 airEnv:27 airGs:28 airMark:30 airForMap:33 _airV:34 airAt:35 airGv:41 airTick:42
§45 ต่อเข้ากับเอฟเฟกต์เดิม (ไม่ต้องแก้ทุกสกิล): แสงวาบ = ลมกระโชก • วงคลื…
CLW:54
§56 หญ้า
GRASS:58
§59 รอยสนามรบบนหญ้า + พื้น (อยู่ทั้งแมตช์ — designs/battlefield.md ขั้น 3)
SCAR:62 scarReset:64 scarPaint:71 grassScar:86
§91 ไฟลามหญ้า (ภาพล้วน: ไม่มีดาเมจ ไม่ซิงก์ — แต่ละเครื่องลามไม่เหมือนกัน…
FIRE:97 GR_FIRE:100 fireReset:102 fireBuild:104 fireLight:111 fireIgnite:113 fireFx:125 fireStep:130 fireTick:154
§159 พื้นหญ้ามีชีวิต: สีเป็นหย่อม (เขียวเข้ม / แห้งเหลือง / ดินโผล่) + จุด…
GR_NOISE:162 GR_LIVE:167 grLive:185 GR_GLSL_V:193 GR_BEGIN:198 grassMat:247 grassBuild:265 _grBasic:279 grassBake:280 grassCount:337 grassTick:342
§380 สกิลลม → หญ้า (ภาพล้วน เรียกจาก windEfx js/68)
WIND_GRASS:382 airWind:396

## js/51-warmup.js (189) — 
WARM:11 WARM_FXDIR:12 WARM_COMMON:12 WARM_X:13 WARM_Y:13 warmKeep:15 warmStaticModels:21 glReady:30 warmCompile:31 warmDraw:34 WARM_SKIP:44 warmAssets:47 warmFx:57 warmFxEnd:68 warmGather:70 warmPaths:72 warmStep:74 warmTick:106
§115 ภาพจากโค้ดของแต่ละสาย (เฟรมละฟังก์ชัน)
warmOutline:125
§142 อุ่นฉากเกมระหว่างรอในห้อง (ผู้ใช้ 2026-10-23: "กระตุกตอนเริ่มแมตช์แรก…
GWARM:147 gameWarmTick:148 gameWarmFree:181

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

## js/61-hub.js (910) — 
HUBS:11 HUBL:11 HUB:14 HB:18 _hq:19 _hq2:19 _hq3:19 _hv:19 _hv2:19 _hv3:19 _hY:19 hEase:20 hSm:21
§23 อนุภาคเรืองแสงของเมนู (ขนาด/สี/ความจางต่อเม็ด)
hubPS:24 hCol:50 H_SPARK:51
§53 ผิว/ลาย (วาดด้วย canvas)
hubTexCloth:54 hubTexFloor:79 hubTexWindow:85 hubTexPage:92 hubTexCard:98 hubStarTex:103 hubStar:105 hubShaftTex:106
§109 ของบนโต๊ะ
hubLathe:110 hubCloth:112 hubTexRug:128 hubTexGlobe:138 hubTexMap:144 hubTexStars:152 HWP:162 hubWipeMake:163 hubWipeLook:174 hubWipeDraw:182 hubBuildStudy:200
§368 ล็อบบี้รอเริ่ม: แท่นวงเวท + ม่าน + หน้าต่างโค้ง + ลำแสงลงแต่ละที่ยืน
hubBuildLobby:369
§406 ตัวละคร (โมเดลไฟล์ + จัดท่าเอง)
HPOSE:408 HPK:421 HBN:421 LOBBY_POSES:422 hubMakeChar:423 hubSetPose:455 hbAim:457 hbRot:463 _hcq:468 _hax:468 _hd:468 _ht:468 hubCharTick:469
§526 ลูกแก้วเวท (เล่นในมือ)
hubMakeOrb:528 hubOrbTick:542 hubBurst:559
§562 สร้างฉาก (ครั้งแรกที่เปิดเมนู)
hubBuild:563 hubTipStar:569
§570 อุ่นเชดเดอร์ล่วงหน้า (ผู้ใช้ 2026-10-23: "กระตุกตอนกดเล่น / เข้าห้อง")
HWARM:574 hubShowAll:575 hubWarm:576 hubWarmDraw:594 hubPlaceWand:610 hubMenuChar:633 hubResetMenu:641
§648 กล้อง
_hf0:650 _hf1:650 _hf2:650 _hf3:650 hubFrame:651 _hcA:660 _hcB:660 _hcC:660 hCamMix:661 hAspK:663 hubCamMenu:665 hubCamPick:667 hubCamLift:668 hubCamPoseA:671 hubCamPose:672 hubCamRoom:674
§677 ลำดับตอนกด "เล่น" (ผู้ใช้ 2026-10-23)
HSQ:680 hPickRy:681 hubGo:682 hubBack:686 hubFadeDo:690 hubSeqAt:692 hubCamSeq:715 hWipeP:721 hubSeq:722 hubSnapModes:730
§736 ล็อบบี้: ใครยืนตรงไหน ท่าอะไร
HL_SPOTS:739 HL_TEAM:740 hubLobbyLayout:741 hubLobbyTick:748 hubLabels:774
§788 หน้าโปรไฟล์ (UI ใน js/65 PRF)
PRF3:792 prfSpot:794 hubProfSet:803 hubProfShow:811 hubProfTick:812
§823 เรนเดอร์ (เรียกจาก renderStage — คืน true = วาดแล้ว)
hubMergeStatic:826 NOHUBIDLE:844 hubRender:845

## js/62-hub-ui.js (311) — 
HUI_IMG:9 HMODES:10 HUI:16 HICO:18 hSvg:37 hHex:38 H_STAR:39
§97 สถานะหน้าจอ: menu / modes / room / off
hubUiState:98 hubMeChip:106 hubOnScreen:112
§121 เมนูแรก
hubJoinGo:124
§135 การ์ดโหมด
hubMxJoin:142 hubPickMode:155 hubFlipKill:170 hubRoomRect:171 hubFlip:172 hubLeaveRoom:188 hubUnflip:193 hubFlipEnd:206
§213 แผงห้อง (การ์ดที่ขยายแล้ว)
HUI_MAPN:214 hubLobby:215 hubRoomClick:278 hubKitChanged:301
§303 เริ่มต้น

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

## js/65-ui3.js (408) — 
UIG:6 uiGalaxy:7 uiGalaxyOn:15 uiGalRaf:16 uiGalT:16 uiGalLoop:17 uiGalDraw:19 uiShow:36 uiHide:37
§40 เมนูหยุดเกม
§44 คู่มือ (แบบ Skill Tree)
GICO:47 GROW:58 GPATH:59 GUIDE:63 GD:83 guideBuild:84 guideLayout:94 guideOpen:101 guideClose:105 guidePic:106 guideGo:111
§129 จอสรุปหลังจบเกม (ต่อจากป้ายชนะ + โพเดียม)
RICO:132 rIcon:138 OV:139 ovScore:140 ovOpen:141 ovHead:150 ovSummary:156 ovNextReward:178 ovLvAnim:185 ovBoard:204
§226 หน้าโปรไฟล์ + รางวัลเลเวล
PRF:231 prfItem:232 prfLv:233 prfOk:234 prfGet:235 pathIdx:236 BORDERS:238 BRAR_C:247 BRAR_N:247 bordOk:248 myFrame:249 PBN:251 PB_SVG:252 prfAvatar:267 BADGES:270 BICO:274 BFR:278 badgeHtml:282 SICO:283 PT:285 PFS:286 prfSave:287 prf3Sync:288 profOpen:289 prfStageX:297 profClose:299 prfRender:300 prfItems:324 prfRwHtml:331 prfRewards:342 prfClick:351 prfDrag:363
§373 การ์ดพลังเสริม (ดันเจียน) + ความหายาก
BKICO:376 buffShow:380
§399 จอมืดตอนเริ่มแมตช์ (ผู้ใช้ 2026-10-23: กระตุกตอนเริ่มแมตช์แรก)
gameCover:402

## js/66-hud4.js (211) — HUD รอบ 4 (ผู้ใช้ 2026-10-23, designs/hud-full-mock.html)
H4E:5 H4:12 h4Pal:13 hud4Col:15 h4Parts:17 h4AuBits:22 h4Key:37 h4Ico:38 h4Build:39 h4Set:66 hud4Draw:67
§117 ไพ่สกิล: นาฬิกาทราย / ท่าใช้ / สลับตำแหน่ง
h4Glass:119 h4Bits:125 h4Fx:127 h4CardUse:129 h4GlassOut:133 h4Place:137 h4OrdKey:140 h4OrdLoad:141 h4Swap:144 h4Pick:147 h4AltKey:149 h4CardWire:153
§164 ไพ่อัลติ
H4SH:166 h4UltCard:168 h4UltUse:173 hud4Frame:175 hud4Hide:176
§177 ไพ่อัลติกลางจอ (ผู้ใช้ 2026-11-01)
h4UltX:180
§187 รูปตัวละครเรา (FFA / TDM แทนแผนที่ย่อ)
H4PF:189 h4PfMode:190 h4PfAvatar:192 h4Portrait:194 h4PfRead:205 h4MapBox:211

## js/67-backdrop.js (139) — 
BACKDROP:8
§66 noise เล็ก ๆ (คงที่ต่อ seed)
bdHash:67 bdNoise:68 bdFbm:69 bdEdge:71 bdRing:73 bdPaint:79 bdTree:82 buildBackdrop:89 bdTower:135 backdropHide:139

## js/68-nature-art.js (171) — 
naturePlantArt:2 Turret:3 auraTextures:44 auraTex:45 LotusAura:88 glowWallTex:92 M_BUB:95 M_BUBRIM:96 M_DRIP:97 M_POOL:98 lotusPetalVeins:100 Lotus:127

## js/68-nature-fx.js (173) — 
_natFx:3 natFxClear:4 natFxMake:5 T:6 S:6 O:6 seed:7 ease:8 outQ:8 inQ:8 phase:8 tipW:9 ALL:10 mesh:11 STD:12 ADD:13 M:14 glowTex:31 GLOWT:32 GLOWG:32 GLOWP:32 GLOWV:32 glow:33 ring:34 Tube:36 V3:51 Thorns:53 thornsAlong:65
§69 อนุภาค
Pool:70 leafGeo:78 LEAF:79 SPK:80 DIRT:81 PUFF:82 CHIP:83 POOLS:84 leafCols:85 leaves:86 sparks:87 dirt:88 puff:89 chips:90 TrailRibbon:92 WHIP_N:103 WHIP_L:103 WHIP_LAG:103 Whip:104 CLIPS:167 tick:168 clip:169 drop:170 natFx:173

## js/68-nature-view.js (676) — 
NAT_VIEW:2 NAT_MARKS:2 NAT_MOTION:2 natV:3 natWorld:4 natPhase:5 natSmooth:6 natEase:7 natOut:8 natStd:9 natAdd:10 natMesh:11 natRing:12 natLeaf:16 natPlantM:19 natGlow:26 natArt:29 natureProjectileModel:31 natSet:37 natAnimate:38 natTube:39 natTrail:50 natSeed:68 natLotus:77 natBall:93 natPlantView:103 natStartStudy:113 natWearWall:131 natTreeGlow:154 natModelTick:174 natMarker:257 natMarks:268 natThorn:287 NAT_SHIELD_K:292 natShieldMake:293 natureCharacter:325 natOutlineMat:355 natOutline:359 natLinks:371 syncNature:386 natureClear:405 natDome:414 natMuzzle:436 natSlam:446 natHook:463 natCoil:520 natHookPose:541 natHookArm:549 natShock:551 natSprout:552 natHealRims:553 natWhipHit:555 natBallRange:556 natSummon:558 natTreeAura:565 natAuraDrop:575 NAT_HOLO:577 natHoloMake:578 natHolo:583 natHoloClear:584 natDirOf:585 natMoment:586 natureEvent:615

## js/68-storm-bow.js (122) — 
SB_FULL:2 _sbShard:3 sbShard:4 sbMat:5 sbJag:6 SB_TIP:8 _sbBlade:9 sbBlade:10 sbMake:11 stormBowView:29 _sbFaQ:53 _sbFaT:53 _sbFaX:53 stormBowForearm:54 stormBowFx:55 sbStaffAxis:70 sbStaffMake:71 stormStaffView:88 stormStaffCast:100 stormStaffSwing:103 _sbWaveG:105 sbWaveGeo:106 SB_WAVE_F:107 stormWaveMake:114 stormWaveTick:117

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

## js/68-wind-view.js (423) — 
WV:6 WN_BODY:8 WN_AIR_FEET:8 WF_POSE:12 WF_FEET:12 WF_REF:12 WF_ROLL:12 _wfP:13 _wfF:13 windFlyPose:14 WTLF:24 windTailDraw:25 windTailFeel:31 windCharacterPose:33 wvState:50 wvAlive:51
§52 ทุกเฟรมของผู้เล่นสายลม: ปีกติดหลัง / ปีกห่อตอนยกโล่ / ดูดลมชาร์จเกจ
wfeSwing:53 wfeTwist:53 W_BLAST_SUCK:54 WFE_HOLD:55 WFE_TURN:55 windLatePose:57 _faX:93 _faQ:93 _faT:93 WF_ELBOW:93 windForearm:94 windFX:96
§121 กำแพงลมจาก snapshot (ตามตำแหน่ง/ลบเมื่อหมด)
syncWind:122 wvWall:135 wvHitFx:136 wvAimFx:137
§138 ตา Eye of Heaven: ตำแหน่งตาบนฟ้า (ตรงกับ EYE ใน tools/wind-eye-ult-ge…
wvEyePos:139 wvEyeSeen:140
§141 เหตุการณ์ (efx z 'wn…')
WDOME_G:143 WDOME_V:144 WDOME_F:145 windDome:146 windSuckFx:155 windEfx:166
§259 HUD รอบเป้าเล็ง: เกจ GaleBurst (โค้งซ้าย) + ชาร์จกำแพงลม (จุด 3 จุดใต…
drawWindHud:260
§268 ตัวช่วยเล็งกำแพงลม (เห็นเฉพาะเรา): เส้นโค้งเรืองที่จุดวาง (คลิกขวา) +…
wvAimGhost:269
§280 ปีกเวทสายลมติดหลัง: ขนนก 8+4 เส้นต่อข้าง ทำจากสายลม (shader) + ริบบิ้…
WWS:282 WWU:282 WW_NOISE:283 _wwMat:288 wwMats:289 wwFeatherGeo:335 WW_PRI:346 WW_COV:348 WW_RIB:349 _wwGeo:350 _wsupG:352 _wsupD:352 windSupDust:353 windSupDustTick:357 windWingSup:358 makeWindWings:379 wwCue:393 poseWindWings:397

## js/69-broom.js (236) — ไม้กวาด (ผู้ใช้ 2026-10-29): บินแบบเครื่องบิน + ยิงลำแสงตามสาย + อนิเ…
BRM:9 BFW:12 BSK:13 BROOM_SK:19 broomVert:40 broomMove:53 broomStrike:72 broomStrikeTick:81 broomFlak:89 broomAct:100 broomOff:107 broomBeam:109
§131 ฝั่งจอ
broomHead:133 BBEAM:140 _bbGeo:141 broomView:142 broomMountFx:173 broomDismountFx:181 broomBeamFx:183 broomSkFx:199 broomStrikeFx:212 broomFlakFx:217 broomHud:222 broomHudT:223 broomTick:232

## js/70-water-dragon.js (495) — 
WDG:7 wdgBuild:8 T:9 root:9 fixed:9 rings:10 sides:10 fastNormals:12 geoOf:21 skin:22 faceSkin:50 group:51 head:52 faceTime:54 groundY:54 faceMaterial:55 faceBlue:60 hornBlue:60 ridgeCyan:60 profile:62 headProfile:63 faceGeo:68 fp:68 fc:68 fi:68 faceRings:68 faceSides:68 navy:69 aqua:69 belly:69 flowHi:69 neckBlend:69 headStroke:81 eyePatch:82 waterCrest:97 bodyGeo:123 bodyP:123 bodyUV:123 indices:123 body:129 finShape:131 finGeo:132 finPos:134 finUV:134 finSkin:136 fins:137 limbSkin:139 clawSkin:140 taperedLimb:141 arms:148 bodyLength:158 intro:158 settleWindow:158 tipHz:158 bodyBulk:158 bodyRadius:159 flight:161 quarters:162 step:162 dr:162 dy:162 spiralKnot:163 first:164 entry:164 crest:168 bank:171 corner:171 cruiseEntry:171 quarterHandle:174 leadLength:176 up:180 zAxis:180 yAxis:180 smooth:181 startAt:182 startD:182 startDistance:184 distanceToCruise:184 hoverSpeed:184 fastDuration:184 brakeDuration:184 startRamp:184 fastSpeed:185 progress:186
§195 ทางบิน: ใช้ระยะทาง (เมตร) ไม่ใช่สัดส่วน เพื่อต่อทางพุ่งลงตอนเล็งเสร็จ…
dive:196 PA:197 TA:198 DIVE_DOWN:200 DIVE_POUR:200 DIVE_STEP:200 diveDist:201 lastTime:202 lastHeadT:202 headRight:202 bodyState:202 filtered:202 shape:203 gate:256 rune:258 shadowMat:259 shadow:260 ringMat:261 ring:262 glyphMat:263 glyphHi:264 glyphPath:265 water:272 splashGeometry:275 lowWaveGeometry:276 splashBursts:277 pulse:283 outerRing:284 dropletMat:285 drops:285 transform:287 gateAt:288 sprayMaterial:310 spray:310 curlCurve:312 foamMaterial:313 foam:314 particles:315 foamParticles:315 rand:316 bodySprayAt:317 waveSegments:338 waveSheets:338 wavesAt:345 currentConfigs:360 currentMaterial:367 currentSegments:372 currentSides:372 currentMeshes:372 _cC:381 _cR:381 _cV:381 _cRad:381 currentPointTo:382 currentPoint:389 currentSpray:390 currentParticles:391 _cS:392 _cCos:393 _cSin:393 _cPow:393 currentsAt:394
§459 เล่น
WDG_YAW:460 wdgGet:461 wdgStart:462 wdgDive:469 wdgKeep:472 wdgEnd:473 wdgTick:474

## js/71-perfhud.js (72) — 
PERF:9 perfFrame:12 perfDom:26 perfStats:34 perfGraph:38 _gpuName:51 gpuIntegrated:52 perfRows:53 perfPanel:68 perfText:69

## js/72-dash-pose.js (85) — 
DPOSE:12 DPT:24 _dpQ:25 _dpX:25 _dpP:25 dpMix:26 dpKnees:28 dpStyle:36 DPDBG:41 dashPose:42 dpApply:75

## js/73-tune.js (142) — แผงปรับค่า 🎚️ (F8 / ปุ่ม "ปรับค่า" ในเมนูพัก และหน้าแรก) — ปรับตัวเลขในเกมสดๆ แล้วเซฟลง …
TUNE:8 tuneNum:9 tuneBuild:15
§81 ใช้ / เก็บค่า
tuneSetVal:82 tuneApplyFile:85 tuneJson:89
§92 หน้าตา
tuneOpenF:97 tuneFmt:98 tuneRow:99 tuneRefresh:102 tuneMsg:110 tuneToggle:111 tuneEdit:115
§139 API สำหรับเครื่องมือแยก tune.html (เปิดเกมใน iframe แล้วเรียกผ่าน WD)
tuneDump:140 tuneSetKey:141

## js/74-look.js (80) — 
LOOK:17 lookPreset:24 lookMap:26 lookName:27 lookEnvFor:28 lookApply:38 lookRays:54 _lkV:59 lookRaysFrame:61 lookRefresh:68
§69 ลงทะเบียนในเครื่องมือปรับค่า (js/73-tune.js): 1 หมวด "🌗 Look" แยกส่ว…
LOOK_F:70 lookRegister:76

## js/75-ambient.js (52) — Ambient 🌫️ — ฝุ่นลอย (dust motes) + หมอกลอยต่ำ (mist) ที่ใช้ได้ทุกแมพ ปรับตามพรีเซ็ต Loo…
AMBX:9 AMBX_V:10 AMBX_F:24 ambMesh:27 ambQual:39 ambFrame:40

## js/76-surface.js (125) — 
SURF:11
§15 ภาพผิว (ความสูง 4 แบบ) : noise ที่วนซ้ำได้ (ทุกฟังก์ชันรับ x,y ใน [0,…
_sh:16 _sva:17 _sfb:20 _sfa:21 _SW:22 _swor:23 _SCL:27 SURF_H:28 surfBuild:37
§48 ส่งค่าเข้า uniform / กราฟิก
surfSync:49 surfQuality:53
§54 ใส่ผิวเข้าวัสดุ
SURF_VS:55 SURF_VS_BODY:56 SURF_FS:67 SURF_FS_BODY:68 surfOk:98 surfApply:99 surfScene:111
§112 ปรับค่า (tune.html / F8)

## js/77-paint.js (288) — 
PAINT:12 paintOn:19 paintMap:21 paintLights:30
§39 VFX สีสด (ทดลอง): บนแมพสว่าง เอฟเฟกต์เรืองแสงเดิมซีดเป็นขาว-เหลืองอ่อ…
_ptHSL:40 paintVivid:41 paintVfx:43
§53 ไฟก้อนหลอมรวม (blob / metaball) — ภาพอ้างอิงผู้ใช้ 2026-11-11: ไฟเป็น…
BLOB:55 blobPre:56 blobFire:57 paintGrass:79
§80 ภาพผิว: เปลือกไม้ (ครึ่งซ้าย) + ใบไม้ปาดพู่กัน 4 แบบ (ครึ่งขวา 2×2)
paintAtlas:81 paintStrokeTex:105
§113 ต้นไม้
paintTreeGeo:114 paintCanopy:157 paintKit:161
§184 ลายพู่กันบนผิว (ต่อท้าย onBeforeCompile เดิมของวัสดุ เหมือน js/76)
PT_VS:185 PT_VS_BODY:186 PT_FS:187 PT_FS_BODY:188 PT_CEL_RE:197 PT_CEL_CHUNK:198 paintPatch:201 paintApply:216 paintSweep:218
§219 ฉากของแมพ (เรียกจาก buildFileMap ก่อน brkSetup/batchStatic)
paintScene:220 paintShafts:235
§246 ฟิลเตอร์ภาพวาด (Kuwahara 4 ทิศ, 64 จุด) — เลือกค่าเฉลี่ยของมุมที่สีเร…
§272 ปรับค่า (tune.html / F8)

(99 files, 25007 lines)
