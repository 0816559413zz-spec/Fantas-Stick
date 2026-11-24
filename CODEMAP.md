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

## js/02-data.js (393) — 
W:4 H:4 PR:4 PILLARS:6 SPAWNF:7 mulberry:9 genForest:10 genPitch:27 genHogsmeade:36
§54 แผนที่โล่ง 3 แบบ (ผู้ใช้: ป่ามืดไม่สนุก อยากได้ที่โล่งๆ)
genMeadow:55 genLake:61 genRuins:66
§73 Test Place (ห้องฝึก): พื้นโล่งไม่มีสิ่งกีดขวาง
TEST_W:75 TEST_H:75 TEST_C:75 TEST_VIL:75 TEST_GW:77 TEST_Z:78 TEST_ST:85 TEST_PH:86 testWalls:88 testDummySpots:90 testFences:92 genTest:105 testProps:120 trZone:133 trBotPad:134 trFixSpots:136 trShow:138 genGreatHall:139 MAPS:147 MAP_OFF:160 PLAYMAP:161 RANDOM_MAPS:162 MAPID:163 MW:163 MH:163 OBS:163 setMapVars:164
§165 แผนที่จากไฟล์ (Blender → assets/maps/<id>.json + .glb, สคริปต์ assets…
FMAPS:168 b64i16:169 regFileMap:170 loadMapData:190 loadAllMapData:198 mapReady:201 modeMap:202 mapOkFor:203
§204 ของประกอบฉากที่พังได้ / ใช้ได้ (prop)
PROPDEF:208 PROP_OFF_MODES:215 PROP_USE:217 PROPS:218 PROPON:218 genProps:219
§239 ตัวละคร: บ้านฮอกวอตส์ + หน้าตา
HOUSES:241 HAIRC:246 HAIRSTY:248 WOODC:251 WOODN:252 WCOREC:253 WCOREN:254 WANDSTY:255 WANDN:260 WANDNN:275 EYEC:276 SKINC:277 CLOAKC:278 TIESTY:279 LOOKK:280 LOOKN:280 lookStr:281 parseLook:282 randLook:283 LOOKS:284 LOOKP:284 KITS:284 getKit:285 getLook:286 CREST_SH:287 CREST_PAT:288 starPts:293 CREST_ANI:295 crestSVG:301 houseColor:309 TEAMC:310 TEAMN:310 NOBROOM:312 ROOM_MAX:314 MODES:315 hostModeEnabled:327 PLAY:329 PDEF:330 EDEF:357 POOLS:370 CDK:380 BUFFS:383 BRAR:392 rollRar:393

## js/02-fcs-data.js (3) — 
FCS_DATA:3

## js/02-fcs-rooms.js (100) — FCS room pieces (rule: guides/MAP-ROOMS.md — user 2026-11-20: every room/courtyard is a s…
FCS_ROOMS:11 fcsRoomAdd:12 FCS_C0:13 fcsRoomOf:14 fcsCut:15
§16 gen context (called from genFcs)
fcsRoomK:17 roomWall:27 roomCol:36 roomFloor:38 roomCeil:44 fcsCeilAt:46 fcsCeilClamp:54
§55 breakable room props (user 2026-11-20): BRK groups (js/12-buildings.j…
RPK:59 roomProp:67 roomsFromFile:77 roomsCur:89 RWH:91 roomWallEnv:92

## js/02-fcs.js (257) — 
FCS_C:7 FCS_WH:8 genFcs:9
§196 พื้นที่เล่นตามเฟส (กำแพงล่องหน) + เขตจุดเกิดปลอดภัย — ใช้ทั้งโฮสต์ (G…
SGPH:197 SGTR:197 SG_SPR:198 sgFD:200 _sgAreaC:201 sgArea:202 _sgAreaT:209 sgAreaT:210 sgClamp:216 sgInArea:226 sgAttach:229 sgFromFile:239

## js/02-room-greathall.js (105) — 


## js/03-spells-core.js (262) — 
SHIELD_OFF:2 REGEN:4 FROST_GUARD:7 shieldAllowed:8 ICONS:16 ICOALIAS:17 hasIco:18 ICOBASE:20 icoURL:21 ICO:22 icoTint:23 icoHTML:32 PATHS:33 SPELL_LIST:42 SPELLS:42 defSpell:43 SLOTK:44 BRMAP:44 KITP:45 parseKit:46 cleanKit:63 setKit:64 pathReset:67
§69 สถานะ (ใช้ได้ทั้งผู้เล่นและศัตรู)
isBig:70 ccScale:72 ccTouch:73 addStun:74 addRoot:75 addFreeze:76 addSlow:81 addChill:82 ignite:87 FX_SHOCK_CYAN:95 FX_ONFIRE:95 shock:96 knock:101 addWard:102 addFrostSlow:104 frostSlow:105 moveMul:112 BRN_MAX:114 addBurn:115 addOnFire:117 addXBurn:118 addPoison:119 addSil:120 addFear:121 addBlind:122 addMark:123 healT:125 tickStatus:130 clearStatus:153 fxMask:154
§156 วัตถุในสนามที่คาถาสร้าง: โซน / ฟ้าผ่าหน่วงเวลา / กำแพง / ช่องร่ายต่อเ…
foesIn:157 SHIELD_BREAK_LOCK:165 shieldFaces:167 frostGuardFaces:168 shieldFacesRaw:169 aoeHit:179 addZone:186 updateZones:191 addStrike:202 updateStrikes:203 addWall:204 updateWalls:205 updateChan:216 updateSpells:220 aimPoint:222 aimWall:234
§236 ตัวช่วยคอมโบ (ทุกสายใช้หลักเดียวกัน: ตั้งต้น → ต่อยอด → ปิดจบ)
ROLE_N:238 takePoison:239
§241 ความสามารถพื้นฐาน (คลิกซ้าย) ของแต่ละสาย: สะสมสถานะตั้งต้นให้เองทุกๆ …
PBASIC:242

## js/04-frost-mech.js (142) — สายน้ำแข็ง: ประชิด/ไกล (V) • ฟันดาบ/ขวาน • ไถลน้ำแข็ง • พื้นน้ำแข็ง/ภ…
FROSTV:3 FROST_SWING3_HIT:9 frostContactTime:10 frostShieldPitch:11 frostBoom:16 meleeHit:23 mirrorPos:34 frostBasic:35 frostCutTick:57 frostSlam3:66 frostSlam:74 frostDash:80 addIce:85 updateIces:86 frostWavePitch:103 frostWaveSolid:106 updateWaves:112 _stO:130 _stL:130 groundH:131

## js/05-terrain.js (44) — พื้นสูงต่ำ (แผนที่จากไฟล์ Blender — กติกาฝั่งคนปั้นใน guides/MAP-DESI…
TERR:5 TSTEP:6 TSLOPE:6 terrT:7 floorAt:12 terrSolid:14 terrMove:21 updateGlaciers:30

## js/06-pyro.js (222) — สายไฟ: ยิงปกติ 2 โหมด / โล่ระเบิด / พุ่งชาร์จ
PYV:3 pyroBigBoom:11 pyroBall:19 pyroBasic:20 PHEAT:41 pyroHeatLv:42 pyroHeatGain:43 pyroHeatTick:44 pyroHeatDmg:45 pyroHeatSpd:46 addOrbs:47 pyroParry:48 pyroBlock:49 launchOrbs:51 pyroDash:58 pyroPathEnd:78 updateFirePaths:83 pyroKindleVolley:106 pyroKindleCurve:109 KINDLE:111 DRAGONF:113 dragonfallDive:122 dragonfallTick:123 dragonfallBoom:138 RINGE:143 BLAZEF:150 pyroBlazeAct:153 SNAP:154 COLOS:161 pyroNova:164 pyroSnap:169 colossusTick:182 updateERings:201

## js/07-frost-spells.js (34) — 
FROSTF:4 GREND:6 frostGlacier:11 PERMA:16 CRYO:18 FAURA:25 MIRROR:27 mirrorStart:30

## js/08-storm.js (326) — 
STORMV:6 stGain:10 stSpend:11 stormCone:13 stormLineFoes:18 stormBasic:22 stormTri:55 stormClawStrike:63 stormDash:68 stormDashTick:81 stormShieldBlast:98 stormTick:107
§117 สกิล 1 (ฟรี): เส้นสายฟ้า — ชี้ขึ้นแล้วกดลง 0.5 วิ จากนั้นสายฟ้าผ่าเป็…
TLINE:118 stormLine:120
§127 สกิล 2 (1 stack): ดูดความเร็ว
SIPH:128 stormWaveShoot:130 stormWaveTargetLive:131 stormWaveMark:137 clearStormWaveMarks:148 updateStormWaveMarks:152
§165 สกิล 3 (2 stacks): ฟ้าผ่าสามครั้ง — วางจุดครั้งเดียว ฟ้าผ่าจุดเดิม 3 …
TSTR:166 updateTCells:182
§190 สกิล 4 (1 stack): ออร์บสายฟ้าคู่ — ลอยหลังเรา Dash โดนศัตรู = ออร์บพุ…
SORBS:191 stormOrbLaunch:194
§200 สกิล 5 (2 stacks): Railgun — เส้นเตือนเหลือง 0.8 วิ (อัลติ 0.5) แล้วล…
RAIL:202 stormBowTick:205 stormBowFire:224
§231 อัลติ: ร่างเทพสายฟ้า 10 วิ
GODL:232
§234 ลูกสายฟ้าโดม: รวมไฟที่พื้น → ทะยานขึ้น → เล็ง → ฟาดไม้ยิงและค้างชี้เป…
SDOME_POSE:235 stormDomeCost:236 stormDomeDash:237 stormDomeCharge:238 stormDomeTick:239 stormDomeFire:270 stormDomeSlam:277 updateStorm:282

## js/09-darkness.js (463) — 
DARKP:2 DARK_V:6 DARK_BA:7 DARK_LONG_DASH:8 DARK_CHASE_FLOW:9 DARK_MAW:10 DARK_VEIL_PULL_CLEAR:11 DARK_CHASE_T:12 DARK_WALTZ_ORB:13 darkFlow:14 darkOrbImmune:15 darkAlive:23 darkReset:24 darkState:25 darkEvent:26 darkAim:29 darkTarget:36 darkCone:40 darkBAFloor:47 darkBATargets:51 darkMoveHeading:68 darkClearCooldown:71 darkMark:75 darkReveal:82 darkQueue:83 darkGainFlow:84 darkKill:90 darkTick:93 darkShieldTick:127 darkShieldCrossAt:144 darkShieldCross:153 darkBeamStop:154 darkDash:163 darkBasic:186 DARK_MARK:216 darkWaveTick:233 DARK_CHASE:255 darkMoveWaltz:306 DARK_WALTZ:331 DARK_WARD:353 DARK_VEIL:368 DARK_ULT:376 darkUltBite:391 darkMoveChase:401 darkSnap:441 darkMarked:460

## js/09-earth.js (424) — 
EARTH:9 ERV:12
§24 ตัวช่วย
eOn:25 eStand:26 eNoStand:27 eSegD:29 eAdd:30 eCollide:32 eProjHit:53 eKill:56
§58 ทุกเฟรมของผู้เล่นสายดิน (เรียกจาก updatePlayer หลังส่วนโล่)
earthTick:59 earthSpd:84 earthShHit:86 earthBreak:87 earthReset:89
§91 ท่าพื้นฐาน (คลิกซ้าย)
EROCK:94 earthRockTick:95 earthRockSplash:96 earthBasic:101 earthFistStart:114 earthCBStart:115 earthFistAim:116 earthFistFire:117 earthFistBreak:124
§136 Dash: Stand Rampage / Rock Boost Escape
EKICK:137 earthDash:139 earthRampEnd:174
§179 สกิล 1: Stonebreaker
earthStoneAim:180 STONEB:190
§191 สกิล 1: Stone Mark — ชาร์จไม้สั้น ๆ แล้วยิงเส้นสเปลหัก ๆ ถึงทันที (ไม…
SMARK:193 earthMarkFire:199 earthStoneHit:208 earthStoneSnap:213
§215 สกิล 2: Mud Swamp
MUDS:216
§220 สกิล 3: Tectonic Crush
TECT:223
§224 สกิล 3: Stone Barrage — ปาหินทั้งวงหลังตัวออกไปรัว ๆ (ไม่ตรงเป้า 100%…
BARRAGE:225 earthBarrageTick:230 earthCrush:236
§247 สกิล 4: Dust Burst
DUSTB:249
§250 สกิล 4: Terra Isle — Stand ต่อยจุ่มลงพื้นตรงจุดเล็งแล้วยกเกาะหินลอยขึ…
ISLE:252 earthIsleTick:262
§272 สกิล 5: Terra Auger
AUGER:275
§276 สกิล 5: Rampart (ผู้ใช้ 2026-11-23 v2) — เลือกจุด (โฮโลแกรม) แล้วคลิก…
RAMPART:278 earthRampAimUpd:283 earthRampAimTick:285 earthRampPlace:291 eAugAim:303 earthAugFire:304 earthMound:315
§318 อัลติ: Wrath — ชาร์จบนพื้น หินดันผู้เล่นขึ้นฟ้า Stand ปาเสาลงจุดเล็ง
WRATH_READY_T:319 WRATH_THROW_SWING_T:320 WRATH_DRAW_T:321 WRATH_HEAD:322 WRATH:323 earthWrathAim:329 earthWrathFlightAngles:330 earthPillarThrow:336 earthPillarImpact:342 earthWrathTick:350 earthWrathEnd:374 E_WRS:378 earthSpikeTick:379
§385 ทั้งสนาม: สิ่งก่อสร้างพัง / ฝุ่นหมดเวลา / Stonebreaker ชนกำแพง
updateEarth:386 earthSnapP:400 earthSnapW:416

## js/09-light.js (564) — 
LIGHTP:8 LTV:12 lgOn:19 lightShieldPitch:20 lightShieldGauge:21 lightClearBond:22 lightReset:26 lightAlly:32 lightLinkPos:33 lightUnlink:34 lightReleaseAlly:52 lightBondTarget:59 lightBondTap:79 lightRecall:94
§95 ทุกเฟรม
lightTick:96 lightSlotOf:113
§114 BA Prism Ray: กดค้าง = ลำแสง • 0 ชิ้น = ลำบางทะลุ 5/1 วิ • 1/2/3 ชิ้น…
lightBeamAng:115 lightBeamPitch:117 lightBeamLength:119 lightHeatTick:134 lightBeamHits:141 lightTapShot:148 lightBasic:157
§177 Dash Light Step: วาร์ป 250 ตามทิศเดิน • เล็งคู่หู (ไม่เกิน 900) = วาร…
lightStepBehind:178 lightDash:191 lightDmgOut:221 lightDmgIn:222 lightSnapP:223
§229 สกิล
lightSkillsTick:230 LIGHT_FORM_BASE:269 LIGHT_FORM_SCALE:270 LIGHT_FORM_PIVOT:271 LIGHT_FORM_PALM:272 LIGHT_FORM_PALM_DEPTH:272 LIGHT_FORM_HEART_Y:273 LIGHT_FORM_HEART_Z:273 lightFinishDrive:274 lightFinishPitch:275 lightFinishPush:276 lightFormAngles:277 lightFormRecoil:282 lightFormHand:286 LIGHT_FORM_ARMS:297 lightArmRest:306 _lightArmWork:307 lightArmPose:309 lightFormOpenPalm:337 lightArmAim:349 lightUltSnap:356 lightUltEnd:363 _lightFormAngles:377 _lightFormTurn:377 _lightFormHand:377 _lightFormAimLocal:378 _lightFormUpLocal:378 lightUltOrigin:379 lightUltRay:396 lightUltBeamHit:403 lightUltFinish:418 lightUltTick:429 lightSanEnd:491 lightAimPt:492 LT_BOND:494 LT_VO:497 LT_EM:504 LT_SC:507 LT_VS_RELEASE:511 LT_VS_TRAVEL:511 LT_VS_S:512 LT_VS:515 LT_UL:516 lightAllyHit:535 lightQueueTick:538

## js/09-nature-ba.js (182) — 
NATURE_BA_TEST:2 NATURE_WHIP:3 natureWhipEnabled:4 NAT_SLAM:8 NAT_LINE:8 natureEmpNear:9 natureEmpHit:10 natureWhipHit:19 natureWhipBasic:42 NATURE_READY_YAW:66 NW_RINGS:67 NW_SIDES:67 nwCounterTurn:68 nwAimTurn:68 nwArmAim:68 nwRootAim:69 nwUp:69 nwPhase:70 nwEase:71 nwSwingAngle:72 nwRightRelease:78 natureWhipPose:81 natureWhipVisualMake:120 nwWandTipWorld:142 natureWhipWand:143 natureWhipView:163

## js/09-nature.js (480) — 
NATUREP:2 NAT:3 natureDist:5 natureItems:6 natureLive:7 naturePlants:8 natureY:9 natureHead:10 natureTreeReady:11 natureEmit:12 natureWallLocal:15 natureWallContains:21 natureWallPush:28 natureBurnWall:36 natureWallDamage:43 natureWallTick:48 natureTrace:57 natureSight:75 natureGround:76 natureAimPoint:82 naturePlace:89 naturePlant:97 natureCastPlant:107 natureLotusToggle:123 natureMovePlants:131 natureAimSpot:142 natureAimStart:143 natureAimDone:144 natureAimTick:148 natureWallBuild:159 natureCastWall:160 NAT_WALLS:167 natureWallUse:168 natureWallCharges:169 naturePoison:176 natureStatus:181 natureSpore:193 natureSendSpore:200 NAT_SHIELD_HIT:210 natureShield:211 natureHookCandidates:225 NAT_DASH:230 natureDashCharge:231 natureDash:232 natureHookMove:260 natureBall:295 natureBallTick:303 natureTree:322 natureTreeReach:327 natureGuardian:332 natureGuard:338 natureDamage:347 natureEnd:353 natureTurret:359 naturePeaSplash:392 NAT_TREE:399 natureTreeTick:400 natureUpdate:409 natureReset:443 natureSnapP:448 natureLotusCooldown:460 natureSnapW:465

## js/09-other-paths.js (178) — 
§44 สัตว์เวท (minion): AI ฝั่งโฮสต์
MIND:45 summonMin:51 minTarget:60 minShoot:67 updateMins:72 aimTarget:112 SDOME:149
§160 ร่ายคาถา
castSlot:161 castUlt:178

## js/09-water.js (255) — 
WATERP:7 WAV:11 wtOn:17 WT_BEAM_H:18 waterBeamPitch:19 waterBeamTarget:25 waterBeamWindLimit:32
§38 ทุกเฟรมของผู้เล่นสายน้ำ (เรียกจาก updatePlayer หลังส่วนโล่)
waterTick:39 waterSpd:58 waterCageBusy:59 waterReset:60 waterCageLaunch:62 waterCageSteer:70
§102 BA: สะบัดไม้ → ยิงเข็มน้ำ 3 นัดทันที ห่างกันนิดเดียว ตามเมาส์ (ผู้ใช้…
WT_BA_SIDE:103 WT_BA_H:103 waterBasic:104 waterLineTick:111 waterMoonBeam:121
§126 Dash: จมดิน ทิ้งร่างโคลน → โผล่ห่าง 300 ทิศที่หัน • 6 วิกดอีกที = กลั…
waterDash:127 waterSinkTick:137
§143 ดาเมจใดๆ ของเรา → ลูกผู้ช่วยยิงตาม (เรียกจาก damage() ใน js/12)
waterOnHit:144 waterFamTick:146
§151 Riptide: คลื่นยักษ์วิ่งไปข้างหน้า พัดศัตรูติดไปจนสุดทาง
waterWaveTick:152
§160 Abyssal Beam: ร่าย 1.5 วิ → ยิงลำน้ำ 2.2 วิ (ยืนนิ่ง ลอยนิดหน่อย หมุน…
waterBeamStop:162 waterBeamTick:172 waterMBTick:194
§202 อัลติ Dragon of the Deep
waterDragonTick:203
§217 ทุกเฟรม (ทั้งเกม)
updateWater:218 waterSnapP:224 waterSnapW:228 WT_RP:231 WT_FM:234 WT_CG:236 WT_AB:241 WT_MW:244 WT_UL:246

## js/09-wind.js (601) — 
WINDP:8 WNV:12
§19 ตัวช่วย
wOn:20 wGain:21 wSeg:23 wFoeNear:24
§26 ทุกเฟรมของผู้เล่นสายลม (เรียกจาก updatePlayer หลังส่วนโล่)
windTick:27 windSpd:60 windFlyZ:62 windGliding:71 windOrbStance:72 windLandCheck:73 windTakeoffDash:78 windReset:87
§89 ท่าพื้นฐาน (คลิกซ้าย): ใบมีดลม / ดูดลมชาร์จเกจ / GaleBurst
windBasic:90 windEnh:121 windEnhExtra:122 windFeatherShoot:123 windCurveStep:134 windShieldShoot:138 windWallBlast:141 windStreamStart:145 windStreamEnd:146 windStreamTick:147
§157 โล่ปีก
windShieldBurst:158
§162 Dash: ผลักศัตรูข้างหน้า + ดีดตัวเราถอยหลังลอยกลางอากาศ
windDashGo:163 windDash:166
§173 กำแพงลม Aegis Gale
windWallMake:174 windWallStop:182 windWallBoom:183 windDmg:188 windRay:192 windBlockLen:201 windProjHit:206 windWallHurt:210 windCollide:212
§218 ทั้งสนาม: GaleBurst / กำแพงลม / ชนกำแพง
updateWind:219
§256 Windrift: ชาร์จปีก 0.2 → พุ่ง 400 (20 ม. ใน 0.09 วิ) แบบ Jett → ลงท่า…
windDriftTick:257 windDriftWind:264
§271 Vortex Bind: ทอร์นาโด 3 อันโค้ง 45° ห่าง 200 → 0.6 วิ ดึงกลับมาหยุด 6…
windVortexTick:272
§284 Void Spheres: หลุมดำลูกเดียว (ผู้ใช้ 2026-10-31, designs/wind.md)
windVoidCast:287 windVoidTick:289
§300 รูปแบบการเล่นสายลม (ผู้ใช้ 2026-11-08): บนพื้น = อ่อนลงทันที • บิน (F…
windAir:303 windSpin:303 windAirborne:304 windLift:305 windSink:306 windSlam:307 windSinkZ:309 windTargetZ:310 windSlotOf:314 windCdCut:315 windSlow:316
§318 Featherwing: กด → หมุนตัวบินวนขึ้น → บิน 8 วิ (ผู้ใช้ 2026-11-08)
windFlyTick:322 windFastOn:334 windFastOff:337 windFocusEnd:340 windAirMove:342 windFlick:351 windFocusAct:357 windOrbLaunch:360 windOrbBoom:365
§368 Downburst (ผู้ใช้ 2026-11-08): ลมกดจากฟ้าลงพื้นต่อเนื่อง — วงดาเมจ + …
§369 Tailwind (เดิม Windblade): ร่องลมจากตัวเราไปตามทิศเล็ง — เพื่อน+ตัวเร…
windTailCast:370 windTailIn:373 windTailTick:374 windDownCast:379 windPressDown:386 windDownTick:389
§396 Windup (เดิม Aegis Gale): ลมพัดขึ้น — วางวงลมตรงจุดเล็ง รอ 0.45 วิ แล…
windUpCast:398 windUpTick:405
§412 Wind Push (เดิม Windrift): ยิงลมแรงไปทางที่เล็ก
§415 Plume Volley (ผู้ใช้ 2026-11-09): ขนนกนีออนจากสองปีกสลับกันทีละอันเร็…
windVolleyCast:416 windVolleyTick:417 windPlumeShoot:418 windFeatherBoom:428 windPlumeBoom:429 windPushCast:431 windPushHit:434
§440 Windforce (เดิม Vortex Bind): พุ่งด้วยลม
§443 Slipstream (ผู้ใช้ 2026-11-08): แดชหมุนหลบตามทิศเดิน • 2 ชาร์จ 5 วิ/อ…
windSlipCast:444 windSlipTick:449 windForceCast:450 windSmash:456 windAheadHit:460 windForceTick:466
§486 Windblade (เดิม Void Spheres): ใบมีดลมเล็ก ๆ รัว ๆ
windBladeCast:488 windBladeTick:490 windBladeHit:494
§500 อัลติ Sonic Boom Strike (เดิม Eye of Heaven)
windUltCast:504 windUltTick:507 windUltSweep:532 windFloatZ:540 windShieldPitch:543 windSnapP:547 windSnapW:548
§551 สกิล (ผู้ใช้ 2026-11-08: รีดีไซน์ทั้งชุด — id เดิมไว้ให้ชุดสกิล/tune/…
W_WL:553 W_DR:559 W_VX:565 W_VO:571 W_FW:577 W_UL:587

## js/10-net.js (210) — 
PREFIX:4 NET:5 RC:9 TURN_SERVERS:12 ICE:13 PEER_OPT:14 TURN_URL:16 ICE_READY:18 JN:22 LAG:24 lagDo:25 hostSend:26 LOBBY:27 genCode:28 sendAll:29 NETD_KEYS:33 NETD:33 netDeltaReset:34 netDelta:35 NET_MAX:49 _netTE:49 netSendSnap:50 NET_QMAX:70 NETU:72 netUndelta:73 setStatus:79 hostGame:81 hostPeer:90 netConnect:110 joinWatch:121 joinFail:136 netLost:142 joinGame:157 joinPeer:168 clientOnData:183 leave:198 leaveRoom:200

## js/11-host.js (495) — 
G:4 EVL:4 EVN:4 hostLast:4 tickN:4 emit:5 feed:6 banner:7 plist:8 cleanName:9 freshStats:11 newPlayer:18 emptyInput:21 frameOk:23 addPlayer:24 initHostLobby:33 lobbyMsg:40 broadcastLobby:41 INPN:43 hostOnData:44 hostDrop:76 hostRemove:85 validate:101 hostMapNext:117 hostStart:128 hostToLobby:153 MIDJOIN:160 modeCap:161 midJoin:162 CHATT:178 chatRelay:179 emoHost:187 resetBody:189 fmap:195 spawnPts:196 teamPts:198 spSpread:200 placeAll:201 respawn:213
§232 ลูปหลักฝั่งโฮสต์
hostTick:233 angDiff:250 cH:252 vR:253 updatePlayer:255 hitProp:482 damagePropsIn:489 nearUseProp:490 useProp:491

## js/12-buildings.js (446) — environment damage / rays / collision shared by breakable things
BLDON:4 bldMoundH:5 damageEnv:7 bldRay:16 aimClip:21 aimLineH:29 aimRay3:30 projEl:57 bldPush:62 updateBldg:68
§69 ของบังในแผนที่ไฟล์ที่พังได้ (หิน เสา รูปปั้น ต้นไม้ โคมไฟ ลัง ...) — …
BRKDEF:73 BRK_M:73 BRK_MCOL:73 BRK:74 genBrk:75 brkApply:82 brkStage:87 hitBrk:88 damageBrkIn:96 brkSnap:102 brkParse:103
§104 ตารางช่อง (spatial grid) สำหรับแมพใหญ่: หาเฉพาะของใกล้ ๆ แทนวนทุกชิ้น…
SG:107 OCX:109 OCY:109 obsD2:110 obsEach:111 obsBox:112 sgObs:113 sgProps:113 sgGrid:114 sgNear:121 _sgCR:126 _sgCW:126 _sgCB:126 _sgCO:126 _sgPO:126 _sgPB:126 _sgPP:126 _sgM:126 _sgE:126 _sgA:126 _cwLast:128 collideWorld:129 shoot:170 eShoot:198 foesOf:205 breakShield:213 ULT_RATE:220 ultActive:221 gainUlt:222 lifesteal:223 impactProjectile:225 damage:226 playerDown:302 killProj:325 explode:337 hitTarget:349 hitProjectileTarget:353 updateProjectiles:370 projStep:378

## js/12-city-dmg.js (270) — เมืองพังได้ (designs/city-bot-battle.md ขั้น 4) — ข้อมูลที่ทุกเครื่อง…
CITY_FL:8 CITY_PW:8 CDMG:9 CITYD:16 cityOn:17 cityLayout:19 cityReset:29 cityApplyBox:45 cityApplyItem:46 cityHex:47 cityMark:48 cityRampSync:49 cityPanelAt:51 cityHitPanel:56 cityTowerStart:70 cityTowerStrip:76 cityTowerFall:80 cityHitItem:91 cityHitObs:100 _sgCD:105 cityDamageIn:107 cityTick:118 _sgCM:129 cityMoundH:130 cityMounds:140
§146 ข้างในตึก (2026-10-28 ผู้ใช้: เดินเข้าได้ 1–3 ชั้น มีทางขึ้น • ผนังนอ…
CIN:150 cityInterior:151 cinSlabOn:180 cinOpenPanel:182 cityIwHit:184 cityRampHit:186 cinIwSegs:189 cinIwRects:190 cinSecAt:191 citySecHit:193 cinIn:195 cinHole:196 cinRampH:197 _sgCI:198 cityBoxGrid:199 cityRoomAt:200 cityFloorH:202 cityCeilH:207 cinWallRect:211 cityCollideIn:214 cityProjIn:224 _sgCS:242 citySolidAt:243 cityRay:252 cityRoomBox:255 citySnapB:256 citySnapS:257 cityParse:259

## js/12-efs.js (78) — 
EFSV:9 EFS:10 efsLv:11 efsBuild:12 efsBreak:28 efsRepair:29 efsDist:30 efsHeat:31 efsProj:36 efsEnv:42 _efsHit:46 efsTick:47 efsSnap:67 efsParse:71 efsHostView:78

## js/12-fcs-bridge.js (113) — 
BSKV:10 BSKN:11 bskBuild:14 bskGround:38 bskOutline:40 bskSegs:53 bskInPoly:63 bskCut:65 bskStage:70 bskSetSt:71 bskHit:75 bskEnv:84 bskSnap:93 bskParse:97 bskRepair:104 bskExport:106

## js/12-launch.js (39) — 
LAUNCH:4 launch:10 launchTick:22 launchWall:31 launchWallHit:39

## js/12-pnl.js (224) — Breakable panels (แผ่นพัง) — Map Builder pn_wall → data.pnl (guides/D…
PNDEF:13 PN_BODY:17 PN_CH:18 PNL:19 PNG:19 pnGT:20 sgPnl:21 _sgPN:22 _sgPN2:22 _sgPN3:22 pnlGen:23 pnTP:36 pnTopF:37 pnLoc:38 pnWorld:39 pnCU:40 pnL3:42 pnP3:44 pnCellPos:45 pnCellUW:46 pnSolid:47 pnMark:48 pnlLinks:50 pnlSupport:68 pnEmit:76 pnBreakAll:80 pnStage:81 pnlHit:83 pnDmgCell:97 pnHitFx:102 pnlEnv:104 pnSeg:114 pnlRay:121 pnlSolidAt:126 pnlProj:129 pnlCollide:135 pnPileCols:152 pnPileAt:156 pnlTopH:161 pnlMoundH:170 pnlTick:172 pnlSnap:178 pnlParse:183
§189 old houses → panel groups (same footprint as BLDDEF: walls wh m, gabl…
PN_HOUSE:192 pnHouse:193 pnlHouseConv:221

## js/13-enemies.js (171) — ศัตรู (โหมด Co-op)
spawnEnemy:2 setupWave:19 bossPhase:36 enemySlam:44 updateEnemies:55

## js/14-mode-rules.js (108) — กติกาของแต่ละโหมด
hostPick:2 clearField:10 modeLogic:11 endMatch:81 matchOver:108

## js/15-arena.js (71) — 
AR_SIDE:7 AR_TEAM:7 AR_MAX:7 arPads:8 arOn:9 arState:10 arBusy:11 arReady:13 arNames:21 arenaTick:22 arStart:43 arEnd:51 arReset:57 arAddBots:64

## js/15-bot.js (361) — 
BOT_LV:8 BOT_SKIP:16 botKit:17 botPersona:24 BOT_TEAM:25 BOT_MAX:25 bots:26 humans:27 botInZone:29 spawnBot:36 OWNED_K:50 clearOwned:51 removeBots:52 botPickTarget:54 BOT_PB:76 botPlay:77
§207 บอทยืนนิ่ง (ห้องฝึก): หุ่นผู้เล่น = ไม่ทำอะไร • บอทโชว์สกิล (ai.show)…
showName:208 showBot:209 stillBot:210 trShowCmd:225 aiBot:249 trBotCmd:325
§334 บอทในห้องรอ (ผู้ใช้ 2026-10-31 "สร้างห้องเล่นกับบอทได้")
BOT_MODES:338 lobbyBots:339 lobbyBotAdd:340 lobbyBotFill:349 lobbyBotCmd:354 lobbyBotsStart:359 botDebug:361

## js/15-botnav.js (156) — 
NAV_MAPS:14 NAV_EYE:14 NAV:15 navOn:17 navSig:18 navEnsure:26 navBuild:32 navCell:55 navWalk:56 navRay:58 navFree:63 NAV_BRK:70 navBrkPen:71 navPath:79 _navFoe:97 botThink:100 botNav:110

## js/15-botplay.js (324) — 
BOT_RANGE:7 botMem:10 botWallBehind:12 _bspd:22 botSave:24 botFireCanNova:25 botFireCanSnap:29 botWant:42 botLightSupport:78 botClassPlanFor:121 botClassAim:122 botClassGround:127 botClassTarget:128 botClassLane:134 botClassPlan:137 botWindPlan:153 botNaturePlan:228 botCombo:298

## js/15-modes.js (437) — 
sendPriv:5 TASKF:9 taskPts:10 raceRings:11 modeInit:17 spawnDummy:64 trainTick:69 TR_KEYS:86 trTeams:88 trCmd:102 hostEndTraining:135
§137 ควิดดิช
quidThrow:138 quidDrop:144 quidArea:150 quidTick:151 snitchTick:187
§210 แข่งไม้กวาด
raceTick:211 raceRank:233
§243 แบทเทิลรอยัล
brTick:244 ITEMN:258 brPick:259
§268 หาลอร์ดโวลเดอมอร์
impActions:269 startMeeting:307 hostVote:314 meetTick:319 impCheck:338
§346 ระเบิดที่ตั้งเวลาไว้ (ลูกไฟมังกร / คลื่นไฟ)
bombTick:347 modeSnap:360
§385 สร้าง snapshot ส่งให้ทุกเครื่อง
r1:386 DEFP:388 packP:389 unpackP:390 makeSnap:391 PROF:409 pf:410 hostSent:411 hostLoop:412 HLW:427 pingN:437

## js/15-siege.js (277) — 🏰 โหมดบุกปราสาท (siege) — แบบ Basic ตาม designs/castle-gameplay-concept.md + แผนที่ js/0…
SGV:12 SG_TEAM:25 sgF:26 sgCore:27 sgInZone:28 sgSpawn:29 sgInit:30 sgWallsApply:39 sgWallDmg:43 sgWallHit:49 sgWallEnv:50 sgInput:55 sgStop:63 sgTick:64 sgCoreDown:100 sgPhaseGo:113 sgEnd:121 sgResult:123 sgSnap:129
§135 บอทเล่นบุกปราสาท: ฝ่ายบุก = เดินไปแกนแล้วร่าย (เจอศัตรูใกล้ = สู้ก่อน…
SGB:138 sgBotTarget:140
§150 team plan (user 2026-11-22: don't trickle in one by one)
SGT:153 sgTeamPlan:154 sgBotMode:175 sgBreachAim:189 sgBotGoal:196 sgUnstick:212 sgBotThink:225

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

## js/19-client.js (342) — 
cv:4 cx:4 DPR:5 SW:5 SH:5 resize:6 VIEW:12 screen:13 lastBuffKey:13 overShown:13 lastCount:13 PARTS:14 TEXTS:14
§15 งบเอฟเฟกต์ (VFX budget)
VFXB:20 combatFxParams:21 FULL_COMBAT_VFX:22 combatVfxReduced:23 _apush:24 vfxQual:33 vfxBegin:35 vfxEnd:39 vfxOnce:41 vfxExtra:43 PCOL:44 setScreen:46 onLobby:58
§64 ภาพของโฮสต์ลื่น (ผู้ใช้ 2026-10-31 "ขี่ไม้กวาด/กระโดด กล้องสั่น")
HVB:68 HBOLD:68 hbReset:69 hbPush:70 hbPair:73 onSnap:77 snapApply:81
§91 บัฟเฟอร์ snapshot (ลูกข่าย, ผู้ใช้ 2026-10-22 "เล่นออนไลน์ให้ลื่น")
SBUF:94 NETOLD:95 sbufReset:96 sbufPush:97 sbufAdvance:107
§119 ทำนายตัวเอง (ลูกข่าย): ตัวเราขยับทันทีที่กด ไม่ต้องรอโฮสต์ตอบ
PRED:122 predictMe:123 myPos:144
§146 เอฟเฟกต์
SMOKE_K:149 burst:150 smoke:163 ring:164 floatText:165 shake:166 weaponContactAge:167 weaponImpactAge:183 wandPos:188 impactFX:190 explosionFX:212
§224 เอฟเฟกต์คาถาใหม่
ZV:225 COLB:225 WVV:225 GLV:225 ICEV:225 SLV:225 ULTV:225 OBV:225 _iceDisc:227 _iceEdge:228 _iceSpk:229 iceFloorMat:230 _icePlane:231 _icePathMat:232 _iceWvM:232 iceWvMat:234 _iceShardGeo:247 _isM:250 _isQ:250 _isP:250 _isS:250 _isY:250 iceShardTrail:251 _iceShardMat:256 makeIceFloor:257 ICE_WV:292 updateIceFloors:293 FLASHM:305 FLASHING:306 flashModel:307 endFlash:320 tickFlash:321 GHOSTM:323 SOLIDM:323 ghostOf:324 setGhost:330 hitSparks:338

## js/20-vfx-pyro-storm.js (857) — Dragonfall (ภาพ)
makeDfCircle:3 stormCircleCyan:20 DFV:25 dfCracks:26 updateDfCracks:36 _domeAim:37 domeChargeOrb:38 _spearUp:46 _spearDir:46 _spearA:46 _spearB:46 DOME_SPEAR_LEN:47 stormDomePath:48 stormDomeSpearFX:52 stormDomeHoverFX:83 stormDomeReadyFX:107 stormDomeGroundPoint:128 stormDomeFracture:131 stormDomeFloorPullFX:177 stormDomeFieldFX:204 stormDomePose:240 dragonfallFX:304
§368 สายฟ้า (ภาพ)
TBN:371 TBA:371 TBF:371 TBMAX:371 _tv:372 _tt:372 _ts:372 _tw:372 tbFalloff:375 tbLayer:378 TBL:384 TBO_MAX:386 tbOrbLayer:387 TBC:390 _tcc:391 domeCyan:392 domeGold:393 tbGet:394 TBLUE:397 TBFIRE:397 tboltB:398 tbolt:399 tboltP:409 tbWrite:410 updateBolts:418 LATER:452 STV:452 SBV:452 SDV:452 TSV:452 CLV:452 stTgPos:454 STCLAW:458
§462 รอยกรงเล็บ (อัลติสายฟ้า): รอยข่วน 3 เส้นโค้งปลายแหลมขนานกัน ตั้งขวางห…
clawGeo:465 clawRakes:470 updateClaws:484 later:492 stFade:493 stBeam:494 STHIT:500 STBASH:500 stBashLean:502 shellPt:509 updateStormV:510 _ev:558 GODPTS:560 bWorld:562 stormClawStop:566 CLAWFX:572 stormClawRangeFX:573 updateClawFX:603 stormClawSwipe:616 stormFX:664 STHUD:811 drawStormHud:812

## js/21-vfx-frost.js (228) — น้ำแข็ง (ภาพ): ชิ้นผลึก/หนาม/แผ่นน้ำแข็งชั่วคราว (โผล่ → ค้าง → หด) •…
FRV:2 _cryG:3 _spkG:3 _plateG:3 _hexG:3 _iceFxM:4 _frostM:4 iceFxM:5 frostM:6 ICEP:8 _im4:8 _iq:8 _ie:8 _ip:8 _is:8 icePool:9 iceBit:10 iceChips:13 updateFRV:14 iceRing:24 chillFX:25 makeSlash:41 _wbGeo:49 crescentGeo:51 makeWaveBlade:54 WGH:68 updateSlashes:69 _glGeo:82 _glMat:82 _glMat2:82 makeGlacier:83 updateGlacierVis:114 updateOrbShots:123
§133 คลื่นดาบน้ำแข็ง (ผู้ใช้ 2026-11-11): เส้นเสี้ยวบางคม ขอบหน้าขาว หางเป…
_fsl:135 FSL:135 frostSlashGeo:136 frostSlashGet:141 frostSlashPut:151 updateZV:152 WM3:228

## js/22-models.js (345) — โมเดลจากไฟล์ (.glb จาก Blender) — ข้อตกลงฝั่งคนปั้นอยู่ใน guides/ASSE…
MODELS:5 modelManifest:6 gltfLoader:11 loadModel:16 modelInst:31 modelOr:32 prefetchModels:44
§46 Animation จากไฟล์ (Blender Actions) + โมเดลตัวละคร/ศัตรูจากไฟล์
ANIM_ALT:49 makeAnimator:50 animResolve:55 animPlay:56 _animN:66 animLod:67 animTick:68 lookTint:88 tintModel:92 shareSkinSkeletons:107 batchStudentSkin:115 _palPx:134 palPixels:135 _s2l:138 mergeStudent:139 _matTw:174 matTwin:175 useFileModel:179 rigStage:205 fileVariants:207 fileBroom:208 _rq:212 _rq2:212 _rq3:212 rigBind:213 rigStd:224 rigSync:225 FILE_MODELS:238
§240 VFX จากไฟล์ (รายละเอียดฝั่งคนทำอยู่ใน guides/ASSETS.md)
VFXL:246 FLIPL:246 FLIPS:246 prefetchFx:247 playVfx:248 vfxSeq:294 flipTex:299 playFlip:307 fileFx:322 zoneFx:329 clearVfx:330 updateVfx:331

## js/23-props-bld-view.js (205) — prop ฝั่งแสดงผล
PROPV:2 propFallback:4 farCull:33 syncProps:34
§51 flying debris (city towers / props): chunks fall, bounce, then rest a…
CHARM:53 DEBRIS:53 _bldIce:54 charMat:55 bldIceMat:59 updateDebris:61 debrisDrop:76 debrisCap:78 clearDebris:79 drawPropHint:80 syncWalls:88
§106 ของบังในแผนที่ไฟล์ที่พังได้ ฝั่งแสดงผล (สถานะจาก BRK[].st — host js/1…
BRKV:109 BRK_COL:109 brkSetup:110 BRK_CM:129 brkCrackMat:130 brkClip:146 brkYc:161 brkStump:163 brkSync:173 BRK_ZERO:194 brkFall:196

## js/24-minions-view.js (68) — สัตว์เวท: โมเดลโปร่งแสง + ซิงก์จาก snapshot (MN)
MM3:2 makeMinion:3 syncMins:36 drawMinBars:58

## js/25-efx.js (372) — efxFX: ภาพของ event "efx" ทุกคาถา (หนึ่ง case ต่อหนึ่งเอฟเฟกต์)
efxState:4 efxFX:21 an:42 rr:42

## js/26-fx-events.js (283) — fx(ev): เอฟเฟกต์+เสียงของทุก event จากโฮสต์ • statusFX (สถานะบนตัว) •…
onfOutlineMat:4 onFireFX:6 statusFX:17 fx:44
§251 overlay: เลือกบัฟ / สรุปผล
choosePick:252 syncOverlays:257 showOver:278

## js/27-world.js (606) — 
S3:4 tx:4 tz:4 CITY_KERB:7 cityKerb:8 GY:9 TW:9 hdr:10 PTG:15 gl:23
§37 เงานุ่มแบบ PCSS (contact-hardening): ใกล้จุดสัมผัสคม ไกลจากวัตถุที่บั…
PCSS:40 scene:67 cam:69 composer:70
§71 ท่อภาพ (post-processing): ฉาก → ชั้นเอฟเฟกต์นุ่ม (FXPass) → แสงฟุ้ง →…
rpass:74 fxScene:76 SOFTU:78 SOFT_GLSL:79 FXMATS:81 fxMat:82 softify:84 HAZE_U:89 AOU:93 GFX:99 AO_ON:100 AO_HEAD:101 AO_CALC:105 AO_COPY:119
§140 TAA (ลบขอบหยักแบบสะสมหลายเฟรม) — กราฟิกสูงเท่านั้น • ปิดด้วย ?notaa
TAA:143 TAA_FRAG:144 _taaH:159 taaWanted:160 taaBegin:161 taaEnd:169 taaFinish:170 taaResolve:172 AO_RT:182 fxPass:207 bloom:208 GRADEU:215 gradePass:236 aaPass:254
§256 คุณภาพกราฟิก: auto = ปรับความละเอียดเองตาม FPS / high = สวยสุด / low …
GQ_OPT:259 GQ_PRE:281 GQ_NAME:288 GQ:289 gq:292 gqSave:293 gqPreset:294 gqSet:295 gqMode:298 gqSync:299 QUAL:300 QUAL_NAME:302 qDyn:303 qualPR:304 gqShadowSize:309 applyQuality:310 qualTick:336
§352 ประหยัด CPU สำหรับเครื่องอ่อน (ผู้ใช้ 2026-11-06 "เครื่องผู้เล่นแย่กว…
qualCS:356 CULL:357 cullTick:358 texCanvas:369 glowTex:370 stoneTex:371 runeTex:377 glowMats:385 glowMat:386 STONEM:388 stoneMat:389 shadowAll:390
§393 clear midday sky (user refs 2026-11-24: anime key-art noon) — baked O…
SKYC:398 skyBakeClear:400 skyBake:487 SKY:492 hemi:524 moonL:526 LDIR:530 setSky:531 SKYB:547 skyFollow:548
§549 เงาตามผู้เล่น
SHD:553 _shF:554 _shR:554 _shU:554 _shC:554 _shY:554 SHD_DM:558 shadowDepthSplit:559 shadowFollow:564 shadowSoft:584 LPOOL:586 MLS_N:592 MLS:592 mlsPoint:594 _mlsP:596 mlsInScene:597 mlsTick:598

## js/28-city-build.js (386) — เมืองมักเกิ้ล (ลอนดอน) — ภาพ • ข้อมูลอยู่ js/02-city.js • โมเดลจาก as…
CITY_WIN:4 cityWinTex:5 cityEmTex:10 cityBoxGeo:16 buildCity:21
§102 ข้างในตึกกลวง (ภาพ — ผัง I จาก cityInterior js/12-city-dmg)
cityInteriorView:106 cityHideIn:147 cityMoundView:153
§176 ชุดโมเดลลอนดอน (assets/city/*.glb จาก assets/src/city_kit_build.py)
CITY_STY:181 CITY_VEH:188 cityFacade:190 CITYK:203 _cZ:204 _cT:204 _cR:204 _cC:204 cityKitLoad:205 cityCull:227 citySet:233 cityTint:235 cityPools:237 cityShowBld:243 cityRubble:250 CITY_FALL:258
§259 ตึกไฮไลต์ล้มทั้งตึก (ขั้น 7)
_ctA:262 _ctB:262 _ctC:262 cityTowerPose:263 cityTowerAnim:271 cityTowerRubble:278 CAREA:292 cityAreaSync:293 cityViewSync:305 cityDebris:349 cityFX:358

## js/28-fcs-build.js (383) — 
buildFcs:5 fcsBridge:41 fcsRubbleMat:64 fcsCore:79 FCSB:105 fcsParView:106 FSH_V:120 FSH_B:121 fcsShellMat:123 fcsBlocks:138 fcsShellBuild:150 fcsParFall:165 fcsFallTick:172 fcsShellView:184 FPILE:192 _rfP:194 _rfQ:194 _rfS:194 fcsFadeList:195 fcsRubbleFade:200 fcsShellFall:204 fcsPileTick:213 fcsShellClear:231 EFS3:234 fcsFences:235 _efC:252 _efM:252 _efS:252 _efZ:252 efsView:253
§279 ภาพโหมด (ลูกข่ายทุกเครื่องจาก snapshot M.sg)
SGV3:280 sgClearView:281 sgFileBuild:284 sgViewBuild:290 SGVZR:310 sgBarrier:313 sgSync:327 sgDust:348 sgFx:349
§354 HUD
sgTop:355 sgHud:357

## js/28-fcs-castle.js (402) — 
FCSC:9 fcsCastleMat:10 fcsBannerTex:34 fcsGlowTex:44 fcsCastle:46 fcsCastleDressing:154 fcsCastleTick:175
§178 room pieces: look (js/02-room-*.js view(K,V)) — V = shared builder, m…
fcsRoomsView:179 DK_TEX:182 DK_GLSL:186 DK_FRAG:197 DK_SHAPE:251 DK_MATS:252 dkMat:253 dkUV:265 dkTri:267 dkBox:272 dkRev:274 dkGeo:275 fcsDecoFile:301 fcsDecoKit:315 MB_STYLE:359 _poOn:360 fileStyleScene:361 TORCH_BATCH:374 fcsTorchSync:375

## js/28-fcs-forest.js (261) — 
FF:7 FF_X1:8 FF_NS:9 ffGroundTex:11 ffParts:33 fcsForest:40 ffMerge:125 ffDetail:133 fcsRuin:160 ffSkyMat:203 ffMist:231 ffMistFrame:248 fcsForestTick:250 FFC:261

## js/28-fcs-hall.js (98) — 
HALL:12 hallWinRec:16 hallZones:18
§21 textures: pane = plain pale glass in a pointed arch (stone corners) •…
hallTex:22
§31 windows in the hall: {c centre, n inward normal, t along (viewer's ri…
hallWindows:32
§38 build (called once per world build, after the room view / file deco f…
hallBuild:39 hallEnv:85
§87 mood: blend by how far the camera is inside the hall rect (3 m soft e…
hallPre:88 hallPost:97

## js/28-fcs-props.js (156) — FCS room props — look + destruction (user 2026-11-20). Gameplay side: RPK / roomProp in j…
FRP:11 FRP_PV:12 FRP_PB:13 frpMat:16
§26 part builders: local metres, x along the prop, z across, y up. push(g…
frpBuild:27 fcsPropsBuild:75 fcsPropsView:101 fcsRoomBrkFx:110 FRP_DEB:111 frpDebris:114 _frM:128 _frQ:128 _frS:128 frpSet:129 frpDebrisTick:130
§139 wall hit marks (event 'rwh'): decal quads on the wall face, ring buff…
frpMarkTex:140 fcsWallHit:144

## js/28-maps-build.js (833) — สร้างแผนที่
CANDLESYS:2 builtMap:3 builtKey:3 world:3 TORCHES:3 CANDLES:3 FIREFLIES:3 CRYSTAL:3 RUNE:3 SNITCH:3 BANNERS:3 SNOW:3 WCACHE:5 WCACHE_MAX:5 wkey:7 buildWorld:8 addW:47 _prewarmed:49 prewarmShaders:50 batchStatic:69 makeCandles:94 updateCandles:103 buildCastle:112 buildHogsmeade:178 buildGreatHall:253 buildForest:323
§420 ทุ่งหญ้าฮอกวอตส์ (เย็น)
ringTrees:421 grassTex:430 buildMeadow:431
§450 ทะเลสาบน้ำแข็ง (กลางคืน)
buildLake:451
§472 ซากลานประลอง (เย็น ทราย)
§473 Test Place (ห้องฝึก): พื้นตารางเรียบๆ กลางวัน + วงโซนเสกมอนสเตอร์
§474 บรรยากาศที่ใช้ร่วมกัน (แผนที่จากโค้ด + แผนที่จากไฟล์ผ่าน fx ใน guides…
makeSnow:475 makeFireflies:482 makeSnitch:489 fileMapFx:496
§506 แผนที่จากไฟล์ Blender (guides/MAP-DESIGN.md)
terrGeo:508 buildFileMap:516 fileMapLight:522 fileMapBody:539 replaceMeadowTufts:582 tickM:624 TRPAD:625 ARPAD:625 SHPAD:625 signTex:626 testSign:627 buildTest:634 buildRuins:739 buildPitch:764

## js/28-pnl-build.js (326) — Breakable panels — view (state = PNL in js/12-pnl.js)
PNV:7 PN_BATCH:8 PN_MI:9 PN_GLSL:10 pnlMat:66 PN_RUB:138 PN_HEAP:139 pnlCls:146 PN_ZU:154 pnlGeo:155 pnlBuild:239 pnlBatch:265 pnlBatSet:287 pnlSyncOne:292 pnlView:315 pnlFX:318

## js/29-characters.js (441) — ระบบผ้า (เสื้อคลุมพลิ้วตามการเคลื่อนที่)
makeCloak:2 updateCloth:10 wandNamed:34 wandSparks:83
§92 โมเดลนักเรียนเวทมนตร์
SHGEO:94 SHMAT:94 SHTEX:94 sGeo:95 sMat:96 bMat:99 matKey:101 bodyPatch:107 BODYM:114 bodyMat:115 plainMat:120 mergeBody:121 sStripe:157 hashStr:158 stripeTex:159 shieldMat:160 addStatus:168 makeStudent:174 makeEnemy:281 keepTex:419 keepMatSet:420 disposeMaterial:421 disposeTree:427 disposeObj:439 PM3:440 EM3:440 JM3:440 clearDyn:441

## js/30-particles.js (375) — อนุภาค 2 ชั้น: แสงเรือง (additive) + ควัน (normal)
PMAX:2 PGLOW_OCC:6 PLIT:6
§7 อนุภาคบน GPU (ผู้ใช้ 2026-11-06 ลองเล่นแล้วให้เปิดทุกคน • ?cpup = กลั…
PGPU:10 PGPU_F:10 PG_U:10 PGPU_HEAD:11 PGPU_DEAD:18 PGPU_MV:19 pgpuGeo:20 makePointSys:24
§72 เปลวไฟ: FLAME_STYLE 0 = อนุภาคกลมเรืองแสง (ไม่ใช้รูปเปลว) • 2 = แบบให…
PBLOB:74 PCEL:75 FLAME_STYLE:76 PTIME:77 NOISETEX:79 FLAMETEX_V1:85 FLAMETEX_V2:90 PSYS:100 FLAMELUT:124 FLAMECOL:127 flame:128 PFB:137 ptexUse:138 ptexLoad:164 colCache:166 colCacheV:166 col3:168 CURL:171 CURL_V:172 curlAt:173 pgpuSpawn:176 _pgF:190 updateParticlesG:191 updateParticles:208
§249 เอฟเฟกต์รูปทรง: แฟลช / วงแหวน / โดม / รอยไหม้ / สายฟ้า / แสงชั่วคราว
SHAPES_Q:250 SHAPES:250 FLASHL:250 LINES:250 LREQ:251 ringGeo:252 ringVGeo:253 arcGeo:254 domeGeo:255 fullGeo:256 discGeo:257 decalTex:258 FX:259 jag:279 SHB:293 _sbM:293 _sbQ:293 _sbE:293 _sbS:293 _sbC:293 SHB_GEO:294 _sbDecalMat:295 shbMat:296 shbMake:307 spawnShape:319 updateShapes:329 _cp:359 updateLights:360

## js/31-camera.js (281) — กล้องมุมหลังไหล่ (แบบ Hogwarts Legacy)
yaw:2 pitch:2 lastPh:2 locked:2 CAMRS:3 SENS:4 saveSet:5 applySettings:6 camPos:14 camLook:14 overlayOpen:17 showPause:18 hidePause:19 MAPCAM:20 PLACE:22 placeKey:23 PLN:32 PLR:32 placeGeos:33 updatePlaceGhost:41 _aimD:65 rayTerr:67 aimFromCrosshair:73 AIMZ:106 WBY:106 CAM_FRAMES:110 CAM_FRAME:127 CAM_TRACK:127 _camFocus:128 _camAnchor:128 _camWant:128 cameraFrame:129 camRoomK:161 _camOB:173 camObsK:174 combatCam:185 combatCameraImpact:186 combatCameraCharge:190 combatCameraFrame:202 updateCamera:215 menuCamera:277

## js/32-stage.js (315) — เวทีเมนู/ล็อบบี้: ห้องโถงมืด แท่นวงเวททอง เทียนลอย (ฉากแยกจากแผนที่)
stage:2 STAGE:5 STAGE_Y:6 stageSpots:58 stageChar:74 POSES:81 stageIdle:87
§109 เอฟเฟกต์หน้าเมนู (โชว์เฉพาะหน้าแรก ไม่โชว์ในล็อบบี้/หน้าสร้างตัวละคร)…
stageMenuFx:135 _sv:146
§147 ฉากประจำบ้าน (โผล่ตอนเลือกบ้านในหน้าสร้างตัวละคร)
CRESTTEX:148 crestTex:149 crestBanner:157 buildHouseEnvs:165 TONE0:213 _tc:214 stageTone:215 stageScreen:228 renderStage:229 drawStageLabels:286

## js/33-pyro-view.js (370) — ภาพของสายไฟ (pyroFX: ชาร์จ/พุ่ง/ดีดนิ้ว/กลายร่าง/Dragonfall/Colossus)…
§2 sync ตัวละคร/ศัตรู/ลูกเวท กับ snapshot
localVel:3
§11 ภาพของสายไฟ: ชาร์จลูกไฟ / ย่อตัวชาร์จพุ่ง / วงเวทพ่นไฟ / ดีดนิ้ว / กล…
_pw:12 simOf:13 makeColossus:14 makeMagicCircle:67 _fsGeo:77 fireShieldFX:79 pyroFX:104 NOVAD:302 _novaGeo:302 novaDome:303 updateNovaDomes:308 frostMlCast:312 pyroNovaCharge:332 pyTip:347 BLZV:350 blzOutlineMat:351 blzOutline:353 blazeLinks:358 blazeVignette:367

## js/34-frost-view.js (334) — 
frGuardMat:2
§9 ภาพของสายน้ำแข็ง: ดาบ/ขวานน้ำแข็งที่ปลายไม้ ท่าฟัน โล่อัศวิน ไถล แช่แ…
iceMat:10 iceRim:11 makeIceSword:12 makeIceAxe:31 makeKiteShield:47
§59 อาวุธน้ำแข็งลอย (ผู้ใช้ 2026-10-22: "ร่ายคาถาให้ดาบฟันเอง ระยะเท่าเดิ…
makeIceCrown:63 frostCrown:68 FWS:74 FWA:74 _fwM:75 _fwM2:75 _fwX:75 _fwY:75 _fwZ:75 _fwP:75 _fwS:75 _fwQ:75 _eo:76 _ei:76 _ss:76 fwAim:78 fwWeapons:79 FWP:81 FWT:81 fwChop:82 fwSweep:83 FF_RISE:84 fwIdle:85 fwSwing:88 FWL_N:100 fwLink:101 fwMat:104 SLIDE_POSE:107 _slQ:109 frostSlideHead:110 _slAx:116 frostWandLink:117 frostFX:125

## js/35-sync.js (922) — ซิงก์ผู้เล่น/ศัตรู/ลูกเวทจาก snapshot + ฉายตำแหน่งลงจอ (ป้ายชื่อ/ตัวเ…
§2 ท่าร่ายคาถาแบบนักเวทในหนัง Harry Potter (ผู้ใช้ 2026-10-22: "ยิงปกติท…
CPOSE_T:7 _ce:7 _cs:7 _cb:7 _caJ:9 _caJ0:9 AMP_B:10 AMP_S:10 CP_BEND:11 CPOSE:13 _cpT:21 _cpR:21 CP_STEP:22 CPCOL:23 castStyle:24 castStart:25
§26 ท่าร่ายสกิล / อัลติ / โล่ (ผู้ใช้ 2026-10-22: "เกือบทุกสกิลควรมีการเห…
CANIM:31 SKFEET:87 SKANIM:89 skAnim:97 _caT:98 _caR:98 skillPose:99 _g2:139 wandTwoHand:140 characterPoseMix:147 characterStance:148 JUMP_LEGS:155 jumpLegPose:164 jumpCloakTurn:200 jumpCloakEuler:200 jumpCloakPose:201 readyBaseR:220 readyBaseL:220 castBaseR:221 castBaseL:221 jumpElbowPivot:222 clearJumpArms:223 jumpArmPose:229 _caEQ:238 _caEX:238 caElbowL:239 _caRQ:244 caElbowR:245 readyHeadTurn:255 readyHeadParent:255 readyHeadEuler:255 readyHeadPose:256 readyAllowed:272 natureReadyEuler:277 natureReadyArm:277 readyStance:278 jumpShoulders:313 CBLOCK:329 CBLOCK_PATH:330 blockPose:331 castPose:337 lateSkillPose:343 castPose0:344 clearCharacterCast:372 hitRecoilPose:377 syncPlayers:386 syncEnemies:569 projGeo:609 tailGeo:610 _t1:611 makeProj:612 _a:633 _b:633 PJFX:635 syncProj:636 _awT:737 animateWorld:738
§779 ฉายตำแหน่ง 3D ลงจอ (ป้ายชื่อ / ตัวเลขดาเมจ)
_v:780 toScreen:781 BURNC:789 burnNum:790 NAMETAG:804 nameTag:805 _hsO:811 hudSight:812 SIGHT:825 sightA:826 drawLabels:830 TEXTAG:865 textTag:866 drawTexts:870 HITM:882 DIRI:882 drawXh:884 drawCrosshair:894

## js/36-modes-view.js (171) — 
ROLE:4 KC:4 roleShowT:4 onPriv:5 MO:10 BREATHS:11 clearModeObjs:12 ITEMC:21 healTex:22 makeItem:23 syncModeObjs:39
§140 หน้าประชุมโหวต (หาลอร์ดโวลเดอมอร์)
meetKey:141 myVoted:141 castVote:142 syncMeeting:148

## js/37-render-loop.js (131) — ลูปเรนเดอร์
lastFrame:2 HSTOP:5 hitStop:6 FXSTUDIO:8
§9 เก็บ shader ที่ compile แล้วไว้ตลอดเกม (ผู้ใช้ 2026-11-02 "เล่นกับบอท…
PINMAX:13 PINNED:13 KEEPSRC:16 pinPrograms:22 frame:25 _fpsAcc:42 _fpsN:42 _fpsLast:42 render:43 detailCull:89 viewDetailAt:92 renderGame:99

## js/38-hud.js (489) — 
hudPips:2 hudArc:6 drawReticleTimer:8
§17 HUD
rr:18 SLOTS:19 fmtTime:20
§21 ชิ้นส่วน HUD ธีมทอง-น้ำเงิน
HG:22 HG2:22 HUDF:24 hudTick:25 readyPulse:27 diaPath:29 plate:31 frameBox:37 bossTrail:45 drawBossBar:46 spellDia:66 thinBar:95 drawHUD:100 raceRankClient:182 drawModeHUD:186 MM:224 MMB:225 drawMinimap:226 slotKey:302 mySlots:303 STATUS_ICO:312 SLOTS_IMP:313 BR_LOCK:314 CLUSTER:316 E_NEEDSTAND:317 slotState:318 drawBottom:342 drawBoard:357 FHUD:382 FHTEX:383 fhFrame:384 FH_EDGE:387 FH_CORE:387 fhMix:388 FHC:390 fhLayer:391 drawFireHeat:394 SNAPB:478 snapBanner:479 drawSnapBanner:480

## js/39-menu.js (285) — 
myLook:5 myColor:5 myKit:5 myName:6 renderMyHouse:9
§11 หน้าสร้าง/แต่งตัวละคร (2 ขั้น: 1 หน้าตา → 2 เลือกบ้าน)
crLib:12 crSaved:12 crKitSaved:12 crOpen:12 crStep:12 crTab:12 crFirst:12 crKitOnly:12 crSlot:12 CRTABS:13 sw_:14 bt_:15 nameBox_:16 crPanelSet:17 crRenderStep1:22 crRenderWand:33
§36 ขั้น 3: สาย + ชุดคาถา
ROLE_COL:37 roleTag:38 DESIGNED:39 spellTags:40 spellDescHTML:47 baseDescHTML:51 SB_THEME:59 ROLE_ORDER:68 sbFxRun:69 sbFxT:69 sbParts:69 crRenderKit:70 sbStartFx:99 sbFxTick:100 sbBurst:127 crAssign:133 crRenderHouse:142 crGo:149 crSaveName:161 crSetHouse:162 openCreator:163 closeCreator:172 lobbyKitSend:179
§216 ฉากเปิด (#intro) + ประกายบนหน้าเมนู (#menuFx)
TITLE:219 titleSpark:220 TSPR:222 titleSprite:223 titleDraw:224 titleLoop:234 titleGo:245 JOINQ:258 ovResult:278

## js/40-train-settings.js (265) — เมนูทดลอง (ห้องฝึก / Test Place)
trOpenF:2 trKey:2 trN:2 TR_OPTS:3 trToggle:4 trSend:9 trSync:14
§52 แท่นเสกบอท (โซนเสกบอท ห้องฝึก, trBotPad js/02): ยืนบนแท่น = เมนูขึ้น …
bpOpen:53 bpOn:53 bpKey:53 bpShow:55 bpSync:57 hovEl:127
§128 หน้าตั้งค่า
setRow:129 setTog:130 setTab:131 XHC:132 XHN:132 setOpts:133 SET_ICO:135 SET_EN:138 gfxPanel:141 renderSettings:148 drawXhPrev:171 openSettings:172 closeSettings:174 modeIcon:230 modeTitle:231 renderLobby:232

## js/41-debug.js (221) — 
botBrain:6 _obsKeep:50 balArena:51 _balStash:54 balIsolate:55 balReset:58 balDuel:64 balTour:80 balTeamReset:95 balTeam:104 balCoop:132 balSpellTest:148
§169 Service Worker (sw.js): เก็บไฟล์เกมไว้ในเครื่อง เปิดครั้งต่อไปเร็วขึ้…
SWK:170 swSetup:171
§190 เช็คการ์ดจอตอนเปิดเกม
GPUC:193 gpuCheck:194

## js/42-fire-vfx.js (356) — ไฟแบบใหม่ (2026-10-19): shader ไฟเคลื่อนไหวจริง (noise ไหล) ใช้กับลูก…
FIRE_U:4 FIRE_GLSL:5 fireMat:27
§62 ชิ้นงานสำเร็จรูป
_fbGeo:63 _fbGeo2:63 makeFireBall:65 _ftGeo:73 makeFireTail:74 makeFireWall:77 FIREV:85 fireBlast:86 fireTemp:91 updateFireV:92
§97 ปีกไฟ (Dragonfall) จากไฟล์ Blender mesh_fire_wing (assets/src/fx_mesh…
makeFireWings:100 poseFireWings:107
§108 ชิ้นงานพื้น/กระแทก (รอบ Pyro 2026-10-19): พื้นแตกเป็นใย (ดำ + ไฟลุกตา…
_crackPaths:111 _crackGeo:120 _decM:124 _crackRibbon:126 fireCrackWeb:134 _charTex:156 charTex:157 _discGeo:160 scorch:161 _fruneTex:165 fruneTex:166 fireRune:174 _rockGeo:180 _rockM:181 _rockRestProx:182 rockChunks:183 fireGeyser:192 _mv1:200 _mv2:200 fireMeteor:201
§213 อากาศร้อนบิดเบี้ยว (heat haze) — Blazeform "ออร่าความร้อน" (ผู้เล่น 2…
HZM:216 hazeMat:217 _hzPlane:227 _hzRing:228 hazeOf:230 fireBurn:235
§244 ไฟ 3 มิติจริง (volumetric) — ผู้เล่น 2026-10-19: "ไฟดูเป็นภาพ 2D เกิน…
NOISE3D:249 FIRE3D:258 _fvIdx:263 fireVol:264 fireVolTemp:309
§310 ไฟ 3 มิติที่ bake จาก Blender ทั้งก้อน (วิธี 1 — ผู้เล่นเลือก 2026-10…
FSEQ:314 fireSeqLoad:315 fireSeqReady:319 fireSeqVol:320 fireSeqAt:342 _sqA:349 _sqB:349 _sqX:349 _sqY:349 _sqZ:349 _sqM:349 fireSeqLine:350

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

## js/44-vfx-kit.js (405) — 
§8 1) หางแสง
TRMAX:11 TRPTS:11 TRAILS:11 _trL:12 trailLayer:13 trailNew:22 trailPoint:25 trailStop:28 _tv1:29 _tv2:29 _tv3:29 updateTrails:30
§53 2) สูตรเอฟเฟกต์ = จานสี (ธาตุ) × แม่แบบ (ขนาด/ชนิด)
VFXPAL:57 VFXTPL:74 VFXSIG:86 VFXSIGK:94 VFXR:96 _palCache:99 palOf:100 _pc:103 playFx:104 nearMe:114 fxLayer:115
§147 3) ผูกเอฟเฟกต์ซ้อนชั้นกับเหตุการณ์ของทุกสาย (เพิ่มทับของเดิม ไม่ลบหน้…
EFXAUG:149 PJPAL:168 pjPal:170 ULTCOL:171 efxAug:172 VFXAUG_ON:179 fxAug:180
§201 3b) สนามรบ (designs/battlefield.md ขั้น 1, แบบ C): ทุกสกิลทิ้งควัน/ฝุ…
BF_EL:204 BF_CLS:204 BF_EXTRA:206 BF:209 bfAfter:210 bfPlay:233
§237 3c) สนามรบ ขั้น 2: รอยค้างบนพื้น + ซากรก ๆ (หายเองหลัง BF_LIFE วิ, เด…
BF_LIFE:241 BFM:242 BF_MK:243 BF_MKA:243 BF_MKR:243 bfMarkMesh:244 _bfQ:252 _bfQ2:252 _bfN:252 _bfUp:252 _bfS:252 _bfP:252 _bfMx:252 bfMark:254 bfAge:263 updateBfMarks:276 BFRS:281 bfRestPool:282 bfRestAdd:287 bfBinAdd:294 bfBinBuild:298 bfRest:303 bfScatter:309 _rockMat:317 bfCollapse:319 updateBfRest:326 bfClear:333
§337 3d) สนามรบ ขั้น 5: บรรยากาศตามความพังรอบตัว (designs/battlefield.md)
BFA:341 bfWreck:342 updateBfAir:347 bfRumble:370 updateBf:373
§376 4) เอฟเฟกต์ทั้งจอ (ค่าไปที่ GradePass ใน js/27-world.js)
SCR:377 impactFrame:380 screenFlash:381 screenRadial:382 screenKick:383 screenHurt:384 _scv:385 updateScreenFx:386 updateVfxKit:405

## js/45-fx-runtime.js (430) — 
FXR:9 FXDEG:10
§11 โหลด
fxFetch:12 fxDefaults:13 fxBoot:14 fxOverrides:24 fxLoad:27 fxData:31
§32 ค่า: ตัวเลข / สูตร / ช่วงสุ่ม / เส้นโค้ง / สี
_fxExpr:33 fxExpr:34 fxEval:38 fxV:40 fxIsCurve:47 _fxCK:50 _fxCKon:50 fxCurveKeys:51 fxCurve:52 fxG:60 fxCol:61 fxPal:62
§63 ตำแหน่ง: กรอบของเอฟเฟกต์ (+x ขวา, +y ขึ้น, +z ทิศเล็ง) → พิกัดแผนที่
_fxw:64 fxAnchor:65 fxBase:68 fxLocal:71 fxDir:73 fxYawV:76 fxPos:77 fxPlace:78
§79 เล่น / หยุด
fxPlay:80 fxStart:81 fxStop:90 fxKill:91 fxClearAll:92 fxGate:94
§96 ทุกเฟรม
updateFx:97
§113 สร้างชั้น
fxN:114 fxSpawn:115 fxTick:149 fxEnd:160
§167 อนุภาค
_fxrnd:168 fxUnit:169 fxCone:170 fxEmit:172 fxPart:189
§204 รูปทรง 3D
FXGEO:205 fxMerge:206 fxRibbon:211 fxGeo:217 fxEnergyMat:237 fxWaterMat:252 fxToonWaterMat:265 fxWindShellMat:281 fxToonMat:290 fxArmorMat:300 fxArmorLines:311 fxMeshMake:328 fxMeshTick:352 fxFlipTex:367
§372 หางแสง / รอยฟัน
fxTrailTick:373
§379 สายฟ้า
fxBolt:380
§386 ฟังก์ชันในโค้ดที่ไฟล์เรียกได้ (ชั้น t:"code")
FXCODE:387
§400 ผูกกับ event ของเกม (assets/fx/bind.json) — เรียกจาก fx(ev)
fxLoopName:402 blzFxName:403 fxLoopKeep:404 fshHitFx:406 fxBind:409
§420 แม่แบบ playFx เป็นไฟล์ (assets/fx/tpl/*, sig/*, rec/*)
fxTpl:422

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

## js/47-earth-view.js (1218) — 
ECOL:9 EGUARD_BIG:14 EGUARD:14 EV:15 eW:16 EARTH_FIST_SCALE:17 eYaw:18
§19 ลายผิว (วาดเองบน canvas: หิน/ทราย + รอยร้าว + ขอบบล็อกแบบ Roblox)
ETEX:20 eTex:21 eFadeTex:35 eMat:37 eTMat:38 rockGeo:39 ROCKU:45 rockMesh:46 coneMesh:48 _eChunkM:50 eChunks:51
§53 Stand (บล็อกหิน/ทรายครึ่งตัวบน)
makeStand:55
§92 Rampage: เกราะลมหน้า Stand (ผู้ใช้: เหมือนอุกกาบาตตกโลก ต้านลม — เปลื…
makeBow:94 EBOW:103 _RIM:103 eRampWind:104 eSpikes:116 standOp:121 _ikDn:124 eArmIK:125 PK:132 standPose:134 _eRq:170 _eRq2:170 _eRx:170 standRun:171 eState:189 eStandOf:190 eGiantOf:191 eSandFall:193 eAppear:194 eAim:196
§199 วงเตือนบนพื้น (BA ชาร์จ / จุดปาเสา): วงเข้มก่อน แล้วสีอ่อนค่อย ๆ เติม…
makeWarn:200 eWarnAt:205 eStoneDir:206 eStonePrep:210 eFistCharge:218 eStonePunch:235 eFistEase:247 eFistMotion:248 eFistPose:252 eFistPlayerPose:277 eWrathPillarDir:294 eWrathBoostRock:295 WRATH_FORM:323 eWrathPillar:324 eWrathPlayerPose:353 _eForearmAxis:370 _eForearmQ:370 earthFistForearm:371
§382 ทุกเฟรม: ผู้เล่นสายดิน (เรียกจาก syncPlayers)
earthFX:383
§459 สว่าน (ref: designs/earth_ref/drill_ref.png): หินแหลมเรียวเป็นตัวหลัก…
eSteelEnv:461 eHeatTex:466 EDR:471 eDrillGeo:472 makeDrill:478 drillHeat:485
§487 เสายักษ์ (ref: designs/earth_ref/pillar_ref.png): เสาเหลี่ยมยาว ปลายห…
ePillarVeins:488 makePillar:506
§512 กระสุนหิน
earthFistMat:514 makeEarthFist:518 eFistCrumble:534 earthProjMesh:557 SLAB:568 makeSlab:569 eSlabGeo:574 eSlabMats:585 slabCracks:652
§655 สิ่งก่อสร้าง + ฝุ่น (เรียกจาก render loop)
earthClear:656 eMergePartial:664 eMergeKids:669 eMakeSO:677
§696 Rampart wall (user 2026-11-23 v2): fused rounded boulders, uneven top…
ERAMP:697 eRng:698 eBlock:701 eRampGeo:716 eRampMats:732 eRampMesh:743 eRampHolo:747 eRampPlace:748 eRampTick:750
§768 Terra Isle (user 2026-11-24, ref: floating island chunk): earthy top …
ESTN:796 eCoatMat:797 eCoatMake:808 earthStoneVis:815 eStoneUpd:816 eStoneCrust:832 ERING:840 earthRockRing:844 EISLE:861 eIsleGeo:862 eIsleTint:882 eIsleMesh:884 eIsleTick:888 syncEarth:896 earthFog:950 eMudScreen:953 _eOlMat:960 eOutlines:962 _eCamT:967 eAnim:968 eDebris:969 eWave:971 eAirWave:973 esbImpact:976
§983 event "efx" ของสายดิน (เรียกจากต้น efxFX) — คืน true = จัดการแล้ว
earthEfx:984 eWindOut:1134 eAirCone:1140 eDrillFly:1142
§1146 บึงโคลน (Mud Swamp + บึงจากเสาอัลติ): คลื่นกระเพื่อมจากกลางไปขอบ แล้ว…
earthMudZone:1147 earthMudSink:1154
§1155 HUD ใต้เป้าเล็ง
ESM:1157 eSmooth:1158 ESF:1161 eShieldFx:1162 eChips:1167 eShieldSegs:1170 eShieldNum:1184 eShieldArc:1188 drawEarthHud:1201

## js/48-ragdoll.js (429) — 
RAG:10 RAGJ:23 RAGB:29 RAGS:33 RAGMIN:37 RAGHINGE:39 _rv1:40 _rv2:40 _rv3:40 _rqa:40 _rqb:40 _rm:40 _ragFw:41 ragBones:42 ragBasis:49 ragTargets:57 ragStart:63 ragBack:96 ragFloor:97 ragStep:98 ragPose:170 ragWrite:185 ragRestore:197 ragEnd:201 ragTick:203 ragHideDead:250 clearDeathFades:259 deathClipMat:269 deathSlashSplit:276 DD_ALPHA:330 deathDissolve:331 deathVisualSync:405

## js/49-cloth.js (258) — 
CLOTH:10 CLOTH_LITE:28 CL_ROWS:29 CL_NC:29 CL_GAP:29 CL_IN:29 _clV:30 _clA:30 _clB:30 clPinK:32 clBind:34 cloakPanelGrid:36 cloakBodyIndices:50 stormCape:59 clothSetup:97 clTargets:127 clReset:131 clCapsule:135 _clO:139 clWorld:140 clWorldHit:148 clStep:153 clDraw:166 clothTick:187 clRun:197
§213 other players: low-res cloth on the batched body (student_all_batch)
clLiteSetup:215 clLiteShow:242 clLiteTick:243 clLiteDraw:253

## js/50-grass.js (428) — 
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
GR_NOISE:162 GR_LIVE:167 SNOWU:188 GR_SNOW:189 grLive:191 GR_GLSL_V:201 GR_BEGIN:206 grassMat:258 grassBuild:276 _grBasic:290 grassBake:291 grassCount:361 grassTick:367
§405 สกิลลม → หญ้า (ภาพล้วน เรียกจาก windEfx js/68)
WIND_GRASS:407 airWind:421

## js/51-warmup.js (421) — 
WARM:11 WARM_FXDIR:12 WARM_COMMON:12 WARM_SLICE:13 WARM_X:14 WARM_Y:14 warmKeep:16 warmStaticModels:22 glReady:31 warmCompile:32 warmDraw:35 WARM_SKIP:45 warmAssets:48 warmFx:58 warmNow:71 warmFxRun:79 warmFxEnd:82 warmGather:84 warmPaths:86 warmFrame:88 warmStep:90 preloadCharMat:158 warmTrCopy:161 warmCharVariants:164 warmQueue:183 WARM_LOBBY:189 warmLobbyTick:190 warmTick:197
§208 Entry loader (PRELOAD-STANDARD step 3, 2026-11-23)
PRE:214 preloadReg:215 warmDissolve:217 preProg:226 preFin:227 preStart:229
§242 Event rehearsal (PRELOAD-STANDARD step 4, 2026-11-23)
WARM_REC_SKIP:248 warmRec:249 warmRecDump:251 WARM_EVFLAGS:252 WARM_EVX:253 WARM_EVY:253 warmEvShift:254 warmRehearse:259 preTick:266
§276 ภาพจากโค้ดของแต่ละสาย (เฟรมละฟังก์ชัน)
warmOutline:286
§303 อุ่นฉากเกมระหว่างรอในห้อง (ผู้ใช้ 2026-10-23: "กระตุกตอนเริ่มแมตช์แรก…
GWARM:308 gameWarmTick:309 LMAP:342 lobbyMapTick:343 gameWarmFree:351
§357 Shader never seen before mid-match: compile in the background, hide t…
SHR:365 shrLights:369 IMZ:374 imzPre:381 imzPost:383 shrRoot:384 shrCollect:385 shrPending:391 shReadyPre:395 shReadyPost:416

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

## js/61-hub.js (909) — 
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

## js/62-hub-ui.js (313) — 
HUI_IMG:9 HMODES:10 HUI:16 HICO:18 hSvg:37 hHex:38 H_STAR:39
§97 สถานะหน้าจอ: menu / modes / room / off
hubUiState:98 hubMeChip:106 hubOnScreen:112
§121 เมนูแรก
hubJoinGo:124
§135 การ์ดโหมด
hubMxJoin:142 hubPickMode:155 hubFlipKill:171 hubRoomRect:172 hubFlip:173 hubLeaveRoom:189 hubUnflip:194 hubFlipEnd:207
§214 แผงห้อง (การ์ดที่ขยายแล้ว)
HUI_MAPN:215 hubLobby:216 hubRoomClick:280 hubKitChanged:303
§305 เริ่มต้น

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

## js/65-ui3.js (427) — 
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
BRIEF_PIC:403 gameCover:404

## js/66-hud4.js (230) — HUD รอบ 4 (ผู้ใช้ 2026-10-23, designs/hud-full-mock.html)
H4E:5 H4:15 h4God:16 h4Pal:17 hud4Col:19 h4Parts:21 h4AuBits:26 h4Key:41 h4Ico:42 h4Build:43 h4Set:73 hud4Draw:74
§135 ไพ่สกิล: นาฬิกาทราย / ท่าใช้ / สลับตำแหน่ง
h4Glass:137 h4Bits:143 h4Fx:145 h4CardUse:147 h4GlassOut:151 h4Place:155 h4OrdKey:158 h4OrdLoad:159 h4Swap:162 h4Pick:165 h4AltKey:167 h4CardWire:171
§182 ไพ่อัลติ
H4SH:184 h4UltCard:186 h4UltUse:191 hud4Frame:193 hud4Hide:194
§195 ไพ่อัลติกลางจอ (ผู้ใช้ 2026-11-01)
h4UltX:198
§205 รูปตัวละครเรา (FFA / TDM แทนแผนที่ย่อ)
H4PF:207 h4PfMode:208 h4PfAvatar:210 h4Portrait:212 h4PfRead:223 h4MapBox:230

## js/66-hudlay.js (34) — HUD layout (HUD Editor, user 2026-11-24)
HUDL_DEF:5 HUDL:11 HL0:12 hlGet:13 hudHs:14 hlSet:16 hlJson:20 hlApplyDom:22 hlBegin:26 hlEnd:28 hlBox:30 HL_DEMO_FEED:31

## js/67-backdrop.js (141) — 
BACKDROP:8
§66 noise เล็ก ๆ (คงที่ต่อ seed)
bdHash:67 bdNoise:68 bdFbm:69 bdEdge:71 bdRing:73 bdPaint:79 bdTree:82 buildBackdrop:89 bdTower:137 backdropHide:141

## js/67-coast.js (415) — 
COAST:10 BD_LOD:14
§26 2D value noise (deterministic)
cvN:27 cvF:29
§30 overcast sky dome (shader: thick cloud deck on a flat layer, horizon …
COAST_SKY:31 coastSky:32 BD_AIR:59 BD_DET_V:63 BD_DET_F:64 bdDetailCol:68 BD_DET_N:78 bdDetail:81 bdAerial:88 bdAirTick:96 BD_SEC:99 bdSec:100 bdSplit:101 bdSnapTrees:110 bdReach:122 bdFar:123 backdropLook:125
§136 land shape
coastShape:137 coastH:162
§175 height sources: one interface for the code coast (BACKDROP.fcs) and M…
coastSrcProc:178 BD_SURF:184 bdB64:185 bdRle:186 bdHsh:187 bdGridSrc:188 coastGrid:224 bdCoast:234 coastTreePts:328 BD_TREE_FAR:336 coastTreeMesh:337
§376 near-edge detail bands (user 2026-11-23: backdrop next to the play ar…
bdNearKit:381

## js/68-darkness-view.js (1153) — 
nightWaltzStrip:2 nightWaltzBorder:80 stDarkVeilGround:118 darkFxMesh:195 drawDarknessHud:201 drawDarkHudBar:220 darknessMarkView:227 darkWaveViews:237 darkActiveViews:237 darkViewRoot:238 darkViewTemp:245 darknessClear:257 darkDeathRoots:265 darkDeathClear:268 darkWorldAt:282 darkMarkWind:285 darkMarkLaunch:313 darkMarkContact:325 darkViewNow:338 darkFlowHud:338 darkIdleWeaponPose:339 darkBAGroundImpact:343 darkSettleWeapon:358 darkBlendWeapon:369 darkShowWeaponReturn:392 darkTrailHistory:399 darkDashView:438 darknessCharacter:484 darknessEfx:727 stDarkShieldInk:1024 stDarkVeilBlade:1067 stWardDrainPool:1104

## js/68-light-view.js (1963) — 
LGV:7 LGSH:9 LGSH_L:11 _lgM4:14 _lgQ:14 _lgSV:14 _lgS:14 _lgC:14 _lgC2:14 lgGlowTex:15 lgNeon:17 lgEmpFx:25 lgWallBurn:44 lgShardSpawn:60 lgShardTick:64 lgBaCore:65 lgCrDim:108 lgEmpBeam:112 lgNeonCrystal:126 lgSanctumFloorTex:136 lgSanctumMoteTex:147 lgHoneyTex:162 lgShield:166 _lgShieldEuler:202 lightShieldEv:203 LGPOSE:206 _lgLeanBase:207 _lgLeanUndo:207 _lgGlass:208 _lgCore:208 _lgGeo:208 _lgEdge:208 _lgEdgeM:208 lgCrystalMesh:210 lgState:218 _lgV:219 _lgW:219 lgWorld:220 LG_ULT_ASSET:223 LG_CRYSTAL_ASSET:223 LG_ULT_INTRO:224 LG_ULT_ARRIVAL_FX:224 LG_ULT_TIME:225 lgUltMaterials:226 lgSovereignFinishes:227 lgSovereignMaterials:228 lgSovereignFinish:289 lgSovereignCrystal:310 lgSkinSovereign:319 lgPoseSovereign:372 lgSovereignHeart:448 LG_SASH_X:474 LG_SASH_Z:474 lgSovereignRibbon:475 lgSovereignFlare:534 LG_PALM_TRAVEL:547 LG_PALM_SCORCH_LIFE:548 LG_PALM_SCORCH_SLOTS:548 lgPalmGateOffset:549 lgSovereignPalmWaves:551 lgPosePalmWaves:560 lgPoseBeamWaves:566 lgSovereignPalmGate:578 lgSovereignScorchTrail:588 lgPalmScorch:616 lgSovereignCrossSparks:652 lgSovereignGather:675 lgSovereignWingCurrent:708 lgSovereignChargeSeal:737 lgSovereignChestRecoil:754 lgSovereignSeal:764 lgSovereignArmSigils:780 lgBuildSovereign:811 lgReturnMark:888 lgUltVisual:902 lgWardVisual:1139 _lgBeamM:1155 lgBeamMat:1156 lgSovereignChestBeam:1159 lgSovereignPalmBeam:1196 _lgLinkM:1266 lgLinkMat:1267 lgUnitTube:1270 lgTube:1271 lgAim:1279 lightFX:1280 lgBaseObjects:1523 lgClearBase:1524 lgClear:1525 lightDropView:1532 lgAllyEmpEnd:1538
§1542 เหตุการณ์
lgBlip:1544 lgArcFx:1548 lgFlyFx:1551 lgSovereignArrival:1552 lightFxTick:1591 LG_BLAST_EXPAND:1595 LG_BLAST_HOLD:1595 lgImpactDome:1596 lgBlastFloor:1636 lgBlastThreads:1667 lgFitGround:1695 lgGroundWarning:1704 lightEfx:1717 _lgHq:1874 _lgHy:1874 lgProcHead:1876 lightHeadPose:1891 LGHUD:1899 lgBondScreen:1900 drawCrystalBondHud:1901 drawLightHud:1924

## js/68-nature-art.js (171) — 
naturePlantArt:2 Turret:3 auraTextures:44 auraTex:45 LotusAura:88 glowWallTex:92 M_BUB:95 M_BUBRIM:96 M_DRIP:97 M_POOL:98 lotusPetalVeins:100 Lotus:127

## js/68-nature-fx.js (195) — 
_natFx:3 natFxClear:4 natFxMake:5 T:6 S:6 O:6 seed:7 ease:8 outQ:8 inQ:8 phase:8 tipW:9 ALL:10 mesh:11 STD:12 ADD:13 M:14 glowTex:31 GLOWT:32 GLOWG:32 GLOWP:32 GLOWV:32 glow:33 ring:34 Tube:36 TubeSet:55 V3:73 Thorns:75 thornsAlong:87
§91 อนุภาค
Pool:92 leafGeo:100 LEAF:101 SPK:102 DIRT:103 PUFF:104 CHIP:105 POOLS:106 leafCols:107 leaves:108 sparks:109 dirt:110 puff:111 chips:112 TrailRibbon:114 WHIP_N:125 WHIP_L:125 WHIP_LAG:125 Whip:126 CLIPS:189 tick:190 clip:191 drop:192 natFx:195

## js/68-nature-view.js (1097) — 
NAT_VIEW:2 NAT_MARKS:2 NAT_MOTION:2 natV:3 natWorld:4 natPhase:5 natSmooth:6 natEase:7 natOut:8 natStd:9 natAdd:10 natMesh:11 natRing:12 natLeaf:16 natPlantM:19 natGlow:26 natArt:29 natureProjectileModel:31 natSet:37 natAnimate:38 natTube:39 natTrail:50 natSeed:68 natLotus:77 natBall:93 natPlantView:103 natStartStudy:113 natWearWall:131 natTreeGlow:154 natModelTick:174 natMarker:257 natMarks:268 natThorn:287 NAT_SHIELD_K:292 natShieldMake:293 natHandLight:366 natBarkWrap:368 natWrapProfile:370 natWrapShapes:371 NAT_WRAP:373 natSleeveRestore:386 natSleeveFit:392 natBarkStrips:424 natHandGearMake:489 natPlantHand:524 natHandGearTick:528 natureCharacter:554 natOutlineMat:584 natOutline:588 natLinks:600 syncNature:615 natureClear:634 natDome:643 natMuzzle:665 natSlam:675 natHook:692 natCoil:749 _nfQ:770 _nfT:770 _nfX:770 natWandTip:772 HOOK_HIT:775 natPullQ:775 natPullE:775 _nwQ:776 natForearmR:778 natEmpPose:782 natBigSlam:790 natRootWarn:797 natRootUp:801 natThornLine:822 natRest:838 natHookFoePose:843 natHookPose:859 natHookArm:875 natShock:877 natSprout:878 natHealRims:879 natWhipHit:881 natBallRange:882 natSummon:884 NAT_TREE_GREEN:892 NAT_TREE_RED:892 _natGlowRed:893 natFoe:894 natTreeTint:895 natTreeAura:896 natAuraDrop:906 NAT_HOLO:908 natHoloMake:909 natHolo:920 natHoloClear:923 natDirOf:924 natMoment:925 natureEvent:954 NTHUD:1022 drawNatureHud:1023 NPH:1042 NPH_IC:1043 natPortraitObj:1049 natPortrait:1050 natPlantHud:1062

## js/68-storm-bow.js (285) — 
SB_FULL:2 _sbShard:3 sbShard:4 sbMat:5 sbJag:6 SB_TIP:8 _sbBlade:9 sbBlade:10 sbMake:11 SB_START:33 SB_ANCHOR:33 SB_POLE:33 stormBowView:34 _ikS:90 _ikE:90 _ikH:90 _ikT:90 _ikP:90 _ikD:90 _ikA:90 _ikQ:90 _ikQ2:90 sbAim:91 stormBowForearm:94 stormBowFx:106 sbStaffAxis:122 sbStaffMake:123 stormStaffView:140 stormStaffCast:152 stormStaffSwing:155 _sbWaveG:157 sbWaveGeo:158 SB_WAVE_F:159 stormWaveMake:169 stormWaveTick:173 SMK:181 SWAVE_BURSTS:182 WAVE_BURST_CYAN:183 stormWaveBurst:184 stormWaveBurstTick:209 _smkEye:239 _smkRot:239 stormMarkSet:240 stormMarkClear:262 stormMarkTick:266

## js/68-water-view.js (250) — 
WTV:5 WTC:6 WT_BODY:8 WMB_POSE:14 waterMoonPose:15 waterCharacterPose:19 wtState:49 wtStop:50 wtMesh:51 _wtV:53 _wtP:53 wtBakeClone:54 wtLineMat:65 _wtOlMat:72 wtOutline:74 WT_SINKD:80 wtSinkOffset:81 wtAlive:88 wtLoop:90 WT_FR:93 wtFrPath:94 _wtFa:96 _wtFb:96 _wtFs:96 _wtFn:96 wtFamRiseMesh:97 WT_POOL:102 wtFamRise:103 wtFamRiseOff:110 _wtTube:112 WT_BEAM_V:113 WT_BEAM_F:116 WT_BEAM_O:120 wtBeamMesh:123 wtBeamSync:127 wtBeamOff:137
§139 ต่อผู้เล่น: โล่ฟองน้ำ/ฮีล • ลูกผู้ช่วยที่ไหล่ • ร่างโคลน + เส้นน้ำ • …
waterFX:140
§188 ทั้งเกม: ลูกผู้ช่วยที่กำลังพุ่ง (ล็อกเป้า)
WT_MOUTH:190 _wtA:191 _wtB:191 wtMouth:192 _wtCyl:195 wtBeam:197 syncWater:200 wtPew:207
§215 เหตุการณ์ (efx z 'wt…')
waterEfx:216
§245 HUD: เกจฮีลโล่ (โค้งซ้ายรอบเป้าเล็ง)
drawWaterHud:246

## js/68-wind-view.js (445) — 
WV:6 WN_BODY:8 WN_AIR_FEET:8 WF_POSE:12 WF_FEET:12 WF_REF:12 WF_ROLL:12 _wfP:13 _wfF:13 windFlyPose:14 WTLF:24 windTailDraw:25 windTailFeel:31 windCharacterPose:33 wvState:50 wvAlive:51
§52 ทุกเฟรมของผู้เล่นสายลม: ปีกติดหลัง / ปีกห่อตอนยกโล่ / ดูดลมชาร์จเกจ
wfeSwing:53 wfeTwist:53 W_BLAST_SUCK:54 WFE_HOLD:55 WFE_TURN:55 windLatePose:57 _faX:93 _faQ:93 _faT:93 WF_ELBOW:93 windForearm:94 windFX:96
§128 กำแพงลมจาก snapshot (ตามตำแหน่ง/ลบเมื่อหมด)
syncWind:129 wvWall:142 wvHitFx:143 wvAimFx:144
§145 ตา Eye of Heaven: ตำแหน่งตาบนฟ้า (ตรงกับ EYE ใน tools/wind-eye-ult-ge…
wvEyePos:146 wvEyeSeen:147
§148 เหตุการณ์ (efx z 'wn…')
WDOME_G:150 WDOME_V:151 WDOME_F:152 windDome:153 windSuckFx:162 windEfx:173
§266 HUD รอบเป้าเล็ง: GaleBurst / Downburst / Dash / Slipstream
_wShellM:268 windShellMat:269 drawWindHud:275
§285 ตัวช่วยเล็งกำแพงลม (เห็นเฉพาะเรา): เส้นโค้งเรืองที่จุดวาง (คลิกขวา) +…
wvAimGhost:286
§297 ปีกเวทสายลมติดหลัง: ขนนก 8+4 เส้นต่อข้าง ทำจากสายลม (shader) + ริบบิ้…
WWS:299 WWU:299 WW_NOISE:300 _wwMat:305 wwMats:306 wwFeatherGeo:352 WW_PRI:363 WW_COV:365 WW_RIB:366 _wwGeo:367 _wsupG:369 _wsupD:369 windSupDust:370 windSupDustTick:374 windWingSup:375 makeWindWings:397 wwCue:411 poseWindWings:415

## js/69-broom.js (236) — ไม้กวาด (ผู้ใช้ 2026-10-29): บินแบบเครื่องบิน + ยิงลำแสงตามสาย + อนิเ…
BRM:9 BFW:12 BSK:13 BROOM_SK:19 broomVert:40 broomMove:53 broomStrike:72 broomStrikeTick:81 broomFlak:89 broomAct:100 broomOff:107 broomBeam:109
§131 ฝั่งจอ
broomHead:133 BBEAM:140 _bbGeo:141 broomView:142 broomMountFx:173 broomDismountFx:181 broomBeamFx:183 broomSkFx:199 broomStrikeFx:212 broomFlakFx:217 broomHud:222 broomHudT:223 broomTick:232

## js/70-water-dragon.js (502) — 
WDG:7 wdgBuild:8 T:9 root:9 fixed:9 rings:10 sides:10 fastNormals:12 geoOf:21 skin:22 faceSkin:50 group:51 head:52 faceTime:54 groundY:54 faceMaterial:55 faceBlue:60 hornBlue:60 ridgeCyan:60 profile:62 headProfile:63 faceGeo:68 fp:68 fc:68 fi:68 faceRings:68 faceSides:68 navy:69 aqua:69 belly:69 flowHi:69 neckBlend:69 headStroke:81 eyePatch:82 waterCrest:97 bodyGeo:123 bodyP:123 bodyUV:123 indices:123 body:129 finShape:131 finGeo:132 finPos:134 finUV:134 finSkin:136 FIN_N:139 fins:139 _fM:140 _fQ:140 _fS:140 _fP:140 limbSkin:142 clawSkin:143 taperedLimb:144 arms:151 bodyLength:161 intro:161 settleWindow:161 tipHz:161 bodyBulk:161 bodyRadius:162 flight:164 quarters:165 step:165 dr:165 dy:165 spiralKnot:166 first:167 entry:167 crest:171 bank:174 corner:174 cruiseEntry:174 quarterHandle:177 leadLength:179 up:183 zAxis:183 yAxis:183 smooth:184 startAt:185 startD:185 startDistance:187 distanceToCruise:187 hoverSpeed:187 fastDuration:187 brakeDuration:187 startRamp:187 fastSpeed:188 progress:189
§198 ทางบิน: ใช้ระยะทาง (เมตร) ไม่ใช่สัดส่วน เพื่อต่อทางพุ่งลงตอนเล็งเสร็จ…
dive:199 PA:200 TA:201 DIVE_DOWN:203 DIVE_POUR:203 DIVE_STEP:203 diveDist:204 lastTime:205 lastHeadT:205 headRight:205 bodyState:205 filtered:205 shape:206 gate:260 rune:262 shadowMat:263 shadow:264 ringMat:265 ring:266 glyphMat:267 glyphHi:268 glyphPath:269 water:276 splashGeometry:279 lowWaveGeometry:280 splashBursts:281 pulse:287 outerRing:288 dropletMat:289 drops:289 transform:291 gateAt:292 sprayMaterial:314 spray:314 curlCurve:316 foamMaterial:317 foam:318 particles:319 foamParticles:319 rand:320 bodySprayAt:321 waveSegments:342 waveSheets:342 wavesAt:349 currentConfigs:364 currentMaterial:371 currentSegments:376 currentSides:376 currentMeshes:376 _cC:385 _cR:385 _cV:385 _cRad:385 currentPointTo:386 currentPoint:393 currentSpray:394 currentParticles:395 _cS:396 _cCos:397 _cSin:397 _cPow:397 currentsAt:398
§463 เล่น
WDG_YAW:464 wdgGet:465 wdgStart:466 wdgDive:473 wdgKeep:476 wdgEnd:477 wdgTick:478

## js/71-perfhud.js (162) — 
PERF:9 perfNetSample:11 perfNetSend:14 perfNetReceive:20 perfNetFrame:25 FRZ:40 frzAdd:42 frzOk:45 frzFrame:46 SHW:53 shwDiff:54 shwPath:58 shwSig:60 shwWho:61 shwHead:68 shwSrc:69 shwSame:70 shwFrame:71 frzRecv:85 frzIn:87 frzNote:89 FRZ_NAME:93 frzRows:94 perfFrame:96 perfDom:111 perfStats:119 perfGraph:123 _gpuName:136 gpuIntegrated:137 perfRows:138 perfPanel:158 perfText:159

## js/72-dash-pose.js (85) — 
DPOSE:12 DPT:24 _dpQ:25 _dpX:25 _dpP:25 dpMix:26 dpKnees:28 dpStyle:36 DPDBG:41 dashPose:42 dpApply:75

## js/73-tune.js (141) — แผงปรับค่า 🎚️ (F8 / ปุ่ม "ปรับค่า" ในเมนูพัก และหน้าแรก) — ปรับตัวเลขในเกมสดๆ แล้วเซฟลง …
TUNE:8 tuneNum:9 tuneBuild:15
§80 ใช้ / เก็บค่า
tuneSetVal:81 tuneApplyFile:84 tuneJson:88
§91 หน้าตา
tuneOpenF:96 tuneFmt:97 tuneRow:98 tuneRefresh:101 tuneMsg:109 tuneToggle:110 tuneEdit:114
§138 API สำหรับเครื่องมือแยก tune.html (เปิดเกมใน iframe แล้วเรียกผ่าน WD)
tuneDump:139 tuneSetKey:140

## js/74-look.js (102) — 
LOOK:17 lookPreset:38 lookMap:40 lookName:41 lookEnvFor:42 lookApply:52 lookRays:69 _lkV:74 lookRaysFrame:76 lookRefresh:83
§84 ลงทะเบียนในเครื่องมือปรับค่า (js/73-tune.js): 1 หมวด "🌗 Look" แยกส่ว…
LOOK_F:85 lookRegister:91 lookTest:96

## js/75-ambient.js (52) — 
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

## js/77-dev.js (307) — Dev Mode: ทดสอบแมพ/สกิลในแมตช์จริง (ผู้ใช้ 2026-11-18)
DEV:5 devOn:10 devOff:11 devSoloOk:12 devHold:13 devBroomOk:14 dvMe:15 devSave:16
§17 hook จากโฮสต์: เรียกต้น hostTick (คืน dt ที่ปรับแล้ว • -1 = หยุดโลก)
devDt:18 devTick:23 devGod:32 devFreeze:33
§34 กล้องอิสระ
MBCAM:37 mbcamDone:38 devMbCam:40 devFcToggle:41 devFcCam:48 devFcTop:54 devFcMe:58 devKey:75 devMount:86 DEV_BOTS:94 devStartMode:95
§108 Spectator (user 2026-11-20): watch a full bot match — host steps out,…
devSpecStart:111 devSpecRestore:127 devSpecStop:133 devSpecAim:135 devSpecKey:139 devCell:143 devCopyAim:144
§150 คำสั่งโฮสต์
devTp:151 devSgPhase:155 devBotAdd:166 devAct:175
§216 Destruction debug (user 2026-11-19): repair / collapse breakables at …
DEVD_R:219 devBrkFix:220 devPnlFix:221 devPropFix:225 devSkinFix:226 devDestroy:231
§265 ภาพซ้อนไว้ดูแมพ: กล่องชน (OBS) + วงเขตยึด/จุดเกิดปลอดภัย
_dvCyl:266 _dvMat:267 devOverlay:268
§288 2D overlay map: spawn zones + capture zones + players (click = warp)
_dvMap:289 _dvY:293 devMapDraw:294

## js/77-paint.js (351) — 
PAINT:12 paintOn:22 paintMap:24 kuwOn:33 paintLights:34
§43 VFX สีสด (ทดลอง): บนแมพสว่าง เอฟเฟกต์เรืองแสงเดิมซีดเป็นขาว-เหลืองอ่อ…
_ptHSL:44 paintVivid:45 paintVfx:47
§57 ไฟก้อนหลอมรวม (blob / metaball) — ภาพอ้างอิงผู้ใช้ 2026-11-11: ไฟเป็น…
BLOB:59 blobPre:60 blobFire:61 paintGrass:83
§84 ภาพผิว: เปลือกไม้ (ครึ่งซ้าย) + ใบไม้ปาดพู่กัน 4 แบบ (ครึ่งขวา 2×2)
paintAtlas:85 paintStrokeTex:109
§117 ต้นไม้
paintTreeGeo:118 paintCanopy:161 paintKit:165
§192 tree wind (user 2026-11-23: trees more alive)
PTW:194 PTW_HEAD:197 PTW_BODY:199 PTW_FS:219 ptWindTick:222
§226 ลายพู่กันบนผิว (ต่อท้าย onBeforeCompile เดิมของวัสดุ เหมือน js/76)
PT_VS:227 PT_VS_BODY:228 PT_FS:229 PT_FS_BODY:230 paintPatch:240 paintApply:254 ptreeScene:257
§265 ฉากของแมพ (เรียกจาก buildFileMap ก่อน brkSetup/batchStatic)
paintScene:266 paintShafts:281
§292 ฟิลเตอร์ภาพวาด (Kuwahara 4 ทิศ, 64 จุด) — เลือกค่าเฉลี่ยของมุมที่สีเร…
kuwQ:295 KUW_LOOP:296 kuwMat:298 paintRT:315 paintKuw:316
§332 ปรับค่า (tune.html / F8)

## js/78-dev-ui.js (246) — Dev Mode UI (user 2026-11-20): one floating window, many small column…
§10 orbit camera
devOrbPick:11 devOrbToggle:23 devOrbCam:28
§42 video recording
REC:43 _dvBadge:44 devRecStart:45 devRecStop:60 devRecFrame:62 devRecSave:67 devRecAuto:83 devAutoTick:87
§94 window
_dvPanel:95 _dvBtn:98 _dvBody:100 _dvHead:100 devUiApply:102 devFreeMouse:110 devToggle:111 devF2:116 devGrave:121
§130 rows
dvA:131 dvTg:132 dvB:133 dvCh:134 dvSl:135 dvSub:136 dvCol:137 devKeyOf:138 devRender:143 devPos:194 devUiAct:201

## js/79-photo.js (105) — Photo mode (user 2026-11-23): promo shots of maps
PH:6 PH_F:8 phStore:13 phBase:15 phShadowSize:18 phOn:19 phOff:20 photoFrame:28 photoPre:43 photoPost:46 phAdd:48 phGo:49 phWait:51 phSave:52 phShoot:57 photoCol:74 photoAct:88 photoSet:103 photoKey:104

(119 files, 36991 lines)
