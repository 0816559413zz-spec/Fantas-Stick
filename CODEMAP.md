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

## js/02-data.js (384) — 
W:4 H:4 PR:4 PILLARS:6 SPAWNF:7 mulberry:9 genForest:10 genPitch:27 genHogsmeade:36
§54 แผนที่โล่ง 3 แบบ (ผู้ใช้: ป่ามืดไม่สนุก อยากได้ที่โล่งๆ)
genMeadow:55 genLake:61 genRuins:66
§73 Test Place (ห้องฝึก): พื้นโล่งไม่มีสิ่งกีดขวาง
TEST_W:75 TEST_H:75 TEST_C:75 TEST_VIL:75 TEST_GW:77 TEST_Z:78 TEST_ST:85 TEST_PH:86 testWalls:88 testDummySpots:90 testFences:92 genTest:105 testProps:120 trZone:133 trBotPad:134 trFixSpots:136 trShow:138 genGreatHall:139 MAPS:147 MAP_OFF:160 PLAYMAP:161 RANDOM_MAPS:162 MAPID:163 MW:163 MH:163 OBS:163 setMapVars:164
§165 แผนที่จากไฟล์ (Blender → assets/maps/<id>.json + .glb, สคริปต์ assets…
FMAPS:168 b64i16:169 regFileMap:170 loadMapData:182 loadAllMapData:190 mapReady:193 mapOkFor:194
§195 ของประกอบฉากที่พังได้ / ใช้ได้ (prop)
PROPDEF:199 PROP_OFF_MODES:206 PROP_USE:208 PROPS:209 PROPON:209 genProps:210
§230 ตัวละคร: บ้านฮอกวอตส์ + หน้าตา
HOUSES:232 HAIRC:237 HAIRSTY:239 WOODC:242 WOODN:243 WCOREC:244 WCOREN:245 WANDSTY:246 WANDN:251 WANDNN:266 EYEC:267 SKINC:268 CLOAKC:269 TIESTY:270 LOOKK:271 LOOKN:271 lookStr:272 parseLook:273 randLook:274 LOOKS:275 LOOKP:275 KITS:275 getKit:276 getLook:277 CREST_SH:278 CREST_PAT:279 starPts:284 CREST_ANI:286 crestSVG:292 houseColor:300 TEAMC:301 TEAMN:301 NOBROOM:303 ROOM_MAX:305 MODES:306 hostModeEnabled:318 PLAY:320 PDEF:321 EDEF:348 POOLS:361 CDK:371 BUFFS:374 BRAR:383 rollRar:384

## js/02-fcs-data.js (3) — 
FCS_DATA:3

## js/02-fcs-rooms.js (82) — 
FCS_ROOMS:11 fcsRoomAdd:12 FCS_C0:13 fcsRoomOf:14 fcsCut:15
§16 gen context (called from genFcs)
fcsRoomK:17 roomWall:27 roomCol:36 roomFloor:38 roomCeil:44 fcsCeilAt:46 fcsCeilClamp:52
§53 breakable room props (user 2026-11-20): BRK groups (js/12-buildings.j…
RPK:56 roomProp:64 RWH:73 roomWallEnv:74

## js/02-fcs.js (230) — 
FCS_C:7 FCS_WH:8 genFcs:9
§196 พื้นที่เล่นตามเฟส (กำแพงล่องหน) + เขตจุดเกิดปลอดภัย — ใช้ทั้งโฮสต์ (G…
SGPH:197 SGTR:197 SG_SPR:198 _sgAreaC:199 sgArea:200 _sgAreaT:207 sgAreaT:208 sgClamp:214 sgInArea:224

## js/02-room-greathall.js (105) — 


## js/03-spells-core.js (250) —
ICONS:8 ICOALIAS:9 hasIco:10 ICOBASE:12 icoURL:13 ICO:14 icoTint:15 icoHTML:24 PATHS:25 SPELL_LIST:34 SPELLS:34 defSpell:35 SLOTK:36 BRMAP:36 KITP:37 parseKit:38 cleanKit:55 setKit:56 pathReset:59
§61 สถานะ (ใช้ได้ทั้งผู้เล่นและศัตรู)
isBig:62 ccScale:64 ccTouch:65 addStun:66 addRoot:67 addFreeze:68 addSlow:73 addChill:74 ignite:79 FX_SHOCK_CYAN:87 FX_ONFIRE:87 shock:88 knock:93 addWard:94 addFrostSlow:96 frostSlow:97 moveMul:104 BRN_MAX:106 addBurn:107 addOnFire:109 addXBurn:110 addPoison:111 addSil:112 addFear:113 addBlind:114 addMark:115 healT:117 tickStatus:122 clearStatus:145 fxMask:146
§148 วัตถุในสนามที่คาถาสร้าง: โซน / ฟ้าผ่าหน่วงเวลา / กำแพง / ช่องร่ายต่อเ…
foesIn:149 SHIELD_BREAK_LOCK:157 shieldFaces:158 aoeHit:168 addZone:174 updateZones:179 addStrike:190 updateStrikes:191 addWall:192 updateWalls:193 updateChan:204 updateSpells:208 aimPoint:210 aimWall:222
§224 ตัวช่วยคอมโบ (ทุกสายใช้หลักเดียวกัน: ตั้งต้น → ต่อยอด → ปิดจบ)
ROLE_N:226 takePoison:227
§229 ความสามารถพื้นฐาน (คลิกซ้าย) ของแต่ละสาย: สะสมสถานะตั้งต้นให้เองทุกๆ …
PBASIC:230

## js/04-frost-mech.js (132) — สายน้ำแข็ง: ประชิด/ไกล (V) • ฟันดาบ/ขวาน • ไถลน้ำแข็ง • พื้นน้ำแข็ง/ภ…
FROSTV:3 FROST_SWING3_HIT:9 frostShieldPitch:10 frostBoom:15 meleeHit:22 mirrorPos:33 frostBasic:34 frostSlam3:58 frostSlam:66 frostDash:72 addIce:77 updateIces:78 frostWavePitch:95 frostWaveSolid:98 updateWaves:104 _stO:122 _stL:122 groundH:123

## js/05-terrain.js (44) — พื้นสูงต่ำ (แผนที่จากไฟล์ Blender — กติกาฝั่งคนปั้นใน guides/MAP-DESI…
TERR:5 TSTEP:6 TSLOPE:6 terrT:7 floorAt:12 terrSolid:14 terrMove:21 updateGlaciers:30

## js/06-pyro.js (222) — สายไฟ: ยิงปกติ 2 โหมด / โล่ระเบิด / พุ่งชาร์จ
PYV:3 pyroBigBoom:11 pyroBall:19 pyroBasic:20 PHEAT:41 pyroHeatLv:42 pyroHeatGain:43 pyroHeatTick:44 pyroHeatDmg:45 pyroHeatSpd:46 addOrbs:47 pyroParry:48 pyroBlock:49 launchOrbs:51 pyroDash:58 pyroPathEnd:78 updateFirePaths:83 pyroKindleVolley:106 pyroKindleCurve:109 KINDLE:111 DRAGONF:113 dragonfallDive:122 dragonfallTick:123 dragonfallBoom:138 RINGE:143 BLAZEF:150 pyroBlazeAct:153 SNAP:154 COLOS:161 pyroNova:164 pyroSnap:169 colossusTick:182 updateERings:201

## js/07-frost-spells.js (34) — 
FROSTF:4 GREND:6 frostGlacier:11 PERMA:16 CRYO:18 FAURA:25 MIRROR:27 mirrorStart:30

## js/08-storm.js (325) — สายสายฟ้า (ผู้เล่นออกแบบทั้งหมด — designs/storm.md)
§5 ตัวเลขพื้นฐานของสายสายฟ้าอยู่ใน STORMV + v:{...} ของแต่ละสกิล — ปรับไ…
STORMV:6 stGain:10 stSpend:11 stormCone:13 stormLineFoes:18 stormBasic:22 stormTri:55 stormClawStrike:63 stormDash:68 stormDashTick:81 stormShieldBlast:98 stormTick:107
§117 สกิล 1 (ฟรี): เส้นสายฟ้า — ชี้ขึ้นแล้วกดลง 0.5 วิ จากนั้นสายฟ้าผ่าเป็…
TLINE:118 stormLine:120
§126 สกิล 2 (1 stack): ดูดความเร็ว
SIPH:127 stormWaveShoot:129 stormWaveTargetLive:130 stormWaveMark:136 clearStormWaveMarks:147 updateStormWaveMarks:151
§164 สกิล 3 (2 stacks): ฟ้าผ่าสามครั้ง — วางจุดครั้งเดียว ฟ้าผ่าจุดเดิม 3 …
TSTR:165 updateTCells:181
§189 สกิล 4 (1 stack): ออร์บสายฟ้าคู่ — ลอยหลังเรา Dash โดนศัตรู = ออร์บพุ…
SORBS:190 stormOrbLaunch:193
§199 สกิล 5 (2 stacks): Railgun — เส้นเตือนเหลือง 0.8 วิ (อัลติ 0.5) แล้วล…
RAIL:201 stormBowTick:204 stormBowFire:223
§230 อัลติ: ร่างเทพสายฟ้า 10 วิ
GODL:231
§233 ลูกสายฟ้าโดม: รวมไฟที่พื้น → ทะยานขึ้น → เล็ง → ฟาดไม้ยิงและค้างชี้เป…
SDOME_POSE:234 stormDomeCost:235 stormDomeDash:236 stormDomeCharge:237 stormDomeTick:238 stormDomeFire:269 stormDomeSlam:276 updateStorm:281

## js/09-darkness.js (395) —
DARKP:2 DARK_V:6 DARK_BA:7 DARK_CHASE_FLOW:8 DARK_CHASE_T:9 darkFlow:10 darkAlive:11 darkReset:12 darkState:13 darkEvent:14 darkAim:17 darkTarget:24 darkCone:28 darkClearCooldown:35 darkMark:39 darkReveal:46 darkQueue:47 darkGainFlow:48 darkTick:53 darkShieldTick:82 darkShieldCrossAt:100 darkShieldCross:109 darkBeamStop:110 darkDash:119 darkBasic:144 DARK_MARK:164 darkWaveTick:181 DARK_CHASE:203 darkMoveWaltz:244 DARK_WALTZ:269 DARK_WARD:291 DARK_VEIL:306 DARK_ULT:313 darkUltBite:326 darkMoveChase:336 darkSnap:373 darkMarked:392

## js/09-earth.js (323) — 
EARTH:9 ERV:12
§24 ตัวช่วย
eOn:25 eStand:26 eNoStand:27 eSegD:29 eAdd:30 eCollide:32 eProjHit:39 eKill:42
§44 ทุกเฟรมของผู้เล่นสายดิน (เรียกจาก updatePlayer หลังส่วนโล่)
earthTick:45 earthSpd:69 earthShHit:71 earthBreak:72 earthReset:74
§76 ท่าพื้นฐาน (คลิกซ้าย)
earthBasic:77 earthFistStart:86 earthCBStart:87 earthFistAim:88 earthFistFire:89 earthFistBreak:96
§108 Dash: Stand Rampage / Rock Boost Escape
earthDash:109 earthRampEnd:128
§133 สกิล 1: Stonebreaker
earthStoneAim:134 STONEB:143
§162 สกิล 2: Mud Swamp
MUDS:163
§167 สกิล 3: Tectonic Crush
TECT:169 earthCrush:182
§193 สกิล 4: Dust Burst
DUSTB:194
§199 สกิล 5: Terra Auger
AUGER:201 eAugAim:205 earthAugFire:206 earthMound:217
§220 อัลติ: Wrath — ชาร์จบนพื้น หินดันผู้เล่นขึ้นฟ้า Stand ปาเสาลงจุดเล็ง
WRATH_READY_T:221 WRATH_THROW_SWING_T:222 WRATH_DRAW_T:223 WRATH:224 earthWrathAim:230 earthWrathFlightAngles:231 earthPillarThrow:237 earthPillarImpact:243 earthWrathTick:251 earthWrathEnd:275 E_WRS:279 earthSpikeTick:280
§286 ทั้งสนาม: สิ่งก่อสร้างพัง / ฝุ่นหมดเวลา / Stonebreaker ชนกำแพง
updateEarth:287 earthSnapP:299 earthSnapW:315

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

## js/09-nature-ba.js (122) — 
NATURE_BA_TEST:2 NATURE_WHIP:3 natureWhipEnabled:4 NAT_SLAM:8 NAT_LINE:8 natureEmpNear:9 natureEmpHit:10 natureWhipHit:18 natureWhipBasic:41 NW_RINGS:65 NW_SIDES:65 nwPhase:66 nwEase:67 nwSwingAngle:68 natureWhipPose:74 natureWhipVisualMake:83 natureWhipView:105

## js/09-nature.js (480) — 
NATUREP:2 NAT:3 natureDist:5 natureItems:6 natureLive:7 naturePlants:8 natureY:9 natureHead:10 natureTreeReady:11 natureEmit:12 natureWallLocal:15 natureWallContains:21 natureWallPush:28 natureBurnWall:36 natureWallDamage:43 natureWallTick:48 natureTrace:57 natureSight:75 natureGround:76 natureAimPoint:82 naturePlace:89 naturePlant:97 natureCastPlant:107 natureLotusToggle:123 natureMovePlants:131 natureAimSpot:142 natureAimStart:143 natureAimDone:144 natureAimTick:148 natureWallBuild:159 natureCastWall:160 NAT_WALLS:167 natureWallUse:168 natureWallCharges:169 naturePoison:176 natureStatus:181 natureSpore:193 natureSendSpore:200 NAT_SHIELD_HIT:210 natureShield:211 natureHookCandidates:225 NAT_DASH:230 natureDashCharge:231 natureDash:232 natureHookMove:260 natureBall:295 natureBallTick:303 natureTree:322 natureTreeReach:327 natureGuardian:332 natureGuard:338 natureDamage:347 natureEnd:353 natureTurret:359 naturePeaSplash:392 NAT_TREE:399 natureTreeTick:400 natureUpdate:409 natureReset:443 natureSnapP:448 natureLotusCooldown:460 natureSnapW:465

## js/09-other-paths.js (178) —
§44 สัตว์เวท (minion): AI ฝั่งโฮสต์
MIND:45 summonMin:51 minTarget:60 minShoot:67 updateMins:72 aimTarget:112 SDOME:149
§160 ร่ายคาถา
castSlot:161 castUlt:178

## js/09-water.js (248) — สายน้ำ 💧 (ผู้ใช้ออกแบบทั้งหมด — designs/water.md) • ฝั่งโฮสต์ • รอบแรก: ระบบเกมก่อน ภาพช…
WATERP:7 WAV:11 wtOn:17 WT_BEAM_H:18 waterBeamPitch:19 waterBeamTarget:25 waterBeamWindLimit:32
§38 ทุกเฟรมของผู้เล่นสายน้ำ (เรียกจาก updatePlayer หลังส่วนโล่)
waterTick:39 waterSpd:58 waterCageBusy:59 waterReset:60 waterCageLaunch:62 waterCageSteer:71
§95 BA: สะบัดไม้ → ยิงเข็มน้ำ 3 นัดทันที ห่างกันนิดเดียว ตามเมาส์ (ผู้ใช้…
WT_BA_SIDE:96 WT_BA_H:96 waterBasic:97 waterLineTick:104 waterMoonBeam:114
§119 Dash: จมดิน ทิ้งร่างโคลน → โผล่ห่าง 300 ทิศที่หัน • 6 วิกดอีกที = กลั…
waterDash:120 waterSinkTick:130
§136 ดาเมจใดๆ ของเรา → ลูกผู้ช่วยยิงตาม (เรียกจาก damage() ใน js/12)
waterOnHit:137 waterFamTick:139
§144 Riptide: คลื่นยักษ์วิ่งไปข้างหน้า พัดศัตรูติดไปจนสุดทาง
waterWaveTick:145
§153 Abyssal Beam: ร่าย 1.5 วิ → ยิงลำน้ำ 2.2 วิ (ยืนนิ่ง ลอยนิดหน่อย หมุน…
waterBeamStop:155 waterBeamTick:165 waterMBTick:187
§195 อัลติ Dragon of the Deep
waterDragonTick:196
§210 ทุกเฟรม (ทั้งเกม)
updateWater:211 waterSnapP:217 waterSnapW:221 WT_RP:224 WT_FM:227 WT_CG:229 WT_AB:234 WT_MW:237 WT_UL:239

## js/09-wind.js (597) — 
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
windUltCast:504 windUltTick:507 windUltSweep:532 windFloatZ:540 windSnapP:543 windSnapW:544
§547 สกิล (ผู้ใช้ 2026-11-08: รีดีไซน์ทั้งชุด — id เดิมไว้ให้ชุดสกิล/tune/…
W_WL:549 W_DR:555 W_VX:561 W_VO:567 W_FW:573 W_UL:583

## js/10-net.js (200) —
PREFIX:4 NET:5 RC:9 TURN_SERVERS:12 ICE:13 PEER_OPT:14 TURN_URL:16 ICE_READY:18 JN:22 LAG:24 lagDo:25 hostSend:26 LOBBY:27 genCode:28 sendAll:29 NETD_KEYS:33 NETD:33 netDeltaReset:34 netDelta:35 NET_MAX:49 _netTE:49 netSendSnap:50 NETU:62 netUndelta:63 setStatus:69 hostGame:71 hostPeer:80 netConnect:100 joinWatch:111 joinFail:126 netLost:132 joinGame:147 joinPeer:158 clientOnData:173 leave:188 leaveRoom:190

## js/11-host.js (449) —
G:4 EVL:4 EVN:4 hostLast:4 tickN:4 emit:5 feed:6 banner:7 plist:8 cleanName:9 freshStats:11 newPlayer:18 emptyInput:21 frameOk:23 addPlayer:24 initHostLobby:33 lobbyMsg:40 broadcastLobby:41 INPN:43 hostOnData:44 hostDrop:75 hostRemove:84 validate:100 hostStart:114 hostToLobby:141 MIDJOIN:148 modeCap:149 midJoin:150 CHATT:166 chatRelay:167 emoHost:175 resetBody:177 fmap:183 spawnPts:184 teamPts:186 spSpread:188 placeAll:189 respawn:201
§220 ลูปหลักฝั่งโฮสต์
hostTick:221 angDiff:238 cH:240 vR:241 updatePlayer:243 hitProp:436 damagePropsIn:443 nearUseProp:444 useProp:445

## js/12-buildings.js (568) — สิ่งปลูกสร้างที่พังเป็นชิ้นย่อย (บ้าน) แบบ Battlefield — คู่มือเต็ม: …
BLDDEF:8 BLD_PIECES:10 BLD_GRID:11 BLD_DOOR:13 BLD_FIRE:14 BLD_ICE:14 BLD_ROOF_MIN:14 BLDG:15 BLDON:15 genBldg:16 bldRect:26 bldChunk:28 bldAlive:35 bldLocal:36 bldWorld:37 rectDist:38 bldNear:39 BLD_MOUND:42 bldGone:43 bldMoundAt:44 bldMoundH:45 hitBldPiece:47 breakBldChunk:58 bldSupport:66 damageEnv:86 bldRay:104 _sgRB:112 aimClip:114 aimLineH:122 aimRay3:123 bldPieceAt:151 projEl:162 bldPush:167 collideBld:173 updateBldg:191 bldSnap:204 bldParse:210
§214 ของบังในแผนที่ไฟล์ที่พังได้ (หิน เสา รูปปั้น ต้นไม้ โคมไฟ ลัง ...) — …
BRKDEF:218 BRK_M:218 BRK_MCOL:218 BRK:219 genBrk:220 brkApply:227 brkStage:232 hitBrk:233 damageBrkIn:241 brkSnap:247 brkParse:248
§249 ตารางช่อง (spatial grid) สำหรับแมพใหญ่: หาเฉพาะของใกล้ ๆ แทนวนทุกชิ้น…
SG:252 sgObs:253 sgProps:253 sgGrid:255 sgNear:262 _sgCR:267 _sgCW:267 _sgCB:267 _sgCO:267 _sgPO:267 _sgPB:267 _sgPP:267 _sgM:267 _sgE:267 _sgA:267 _cwLast:269 collideWorld:270 shoot:310 eShoot:338 foesOf:345 breakShield:353 ULT_RATE:360 ultActive:361 gainUlt:362 lifesteal:363 damage:365 playerDown:434 killProj:456 explode:467 hitTarget:479 updateProjectiles:496 projStep:504

## js/12-city-dmg.js (270) — เมืองพังได้ (designs/city-bot-battle.md ขั้น 4) — ข้อมูลที่ทุกเครื่อง…
CITY_FL:8 CITY_PW:8 CDMG:9 CITYD:16 cityOn:17 cityLayout:19 cityReset:29 cityApplyBox:45 cityApplyItem:46 cityHex:47 cityMark:48 cityRampSync:49 cityPanelAt:51 cityHitPanel:56 cityTowerStart:70 cityTowerStrip:76 cityTowerFall:80 cityHitItem:91 cityHitObs:100 _sgCD:105 cityDamageIn:107 cityTick:118 _sgCM:129 cityMoundH:130 cityMounds:140
§146 ข้างในตึก (2026-10-28 ผู้ใช้: เดินเข้าได้ 1–3 ชั้น มีทางขึ้น • ผนังนอ…
CIN:150 cityInterior:151 cinSlabOn:180 cinOpenPanel:182 cityIwHit:184 cityRampHit:186 cinIwSegs:189 cinIwRects:190 cinSecAt:191 citySecHit:193 cinIn:195 cinHole:196 cinRampH:197 _sgCI:198 cityBoxGrid:199 cityRoomAt:200 cityFloorH:202 cityCeilH:207 cinWallRect:211 cityCollideIn:214 cityProjIn:224 _sgCS:242 citySolidAt:243 cityRay:252 cityRoomBox:255 citySnapB:256 citySnapS:257 cityParse:259

## js/12-efs.js (78) — 
EFSV:9 EFS:10 efsLv:11 efsBuild:12 efsBreak:28 efsRepair:29 efsDist:30 efsHeat:31 efsProj:36 efsEnv:42 _efsHit:46 efsTick:47 efsSnap:67 efsParse:71 efsHostView:78

## js/12-fcs-bridge.js (113) — 
BSKV:10 BSKN:11 bskBuild:14 bskGround:38 bskOutline:40 bskSegs:53 bskInPoly:63 bskCut:65 bskStage:70 bskSetSt:71 bskHit:75 bskEnv:84 bskSnap:93 bskParse:97 bskRepair:104 bskExport:106

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

## js/15-botnav.js (143) — 
NAV_MAPS:14 NAV_EYE:14 NAV:15 navOn:17 navSig:18 navEnsure:26 navBuild:32 navCell:52 navWalk:53 navRay:55 navFree:60 navPath:66 _navFoe:84 botThink:87 botNav:97

## js/15-botplay.js (324) — 
BOT_RANGE:7 botMem:10 botWallBehind:12 _bspd:22 botSave:24 botFireCanNova:25 botFireCanSnap:29 botWant:42 botLightSupport:78 botClassPlanFor:121 botClassAim:122 botClassGround:127 botClassTarget:128 botClassLane:134 botClassPlan:137 botWindPlan:153 botNaturePlan:228 botCombo:298

## js/15-modes.js (437) — โหมดพิเศษ: ควิดดิช / แข่งไม้กวาด / แบทเทิลรอยัล / หาลอร์ดโวลเดอมอร์ / ห้องฝึก
§4 ส่งข้อความลับถึงผู้เล่นคนเดียว (เช่น บทบาทในโหมดหาลอร์ดโวลเดอมอร์)
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

## js/15-siege.js (218) — 
SGV:12 SG_TEAM:25 sgF:26 sgCore:27 sgInZone:28 sgSpawn:29 sgInit:30 sgWallsApply:39 sgWallDmg:43 sgWallHit:49 sgWallEnv:50 sgInput:55 sgStop:63 sgTick:64 sgCoreDown:100 sgPhaseGo:113 sgEnd:121 sgResult:123 sgSnap:129 SGB:138 sgBotTarget:140 sgBotGoal:151 sgUnstick:164 sgBotThink:177

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

## js/19-client.js (289) — 
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
SMOKE_K:145 burst:146 smoke:158 ring:159 floatText:160 shake:161 wandPos:162 impactFX:164 explosionFX:186
§198 เอฟเฟกต์คาถาใหม่
ZV:199 COLB:199 WVV:199 GLV:199 ICEV:199 SLV:199 ULTV:199 OBV:199 _iceDisc:201 _iceEdge:202 _iceSpk:203 iceFloorMat:204 _icePlane:205 _icePathMat:206 _iceWvM:206 iceWvMat:208 makeIceFloor:220 ICE_WV:247 updateIceFloors:248 FLASHM:260 FLASHING:261 flashModel:262 endFlash:271 tickFlash:272 GHOSTM:274 SOLIDM:274 ghostOf:275 setGhost:281 hitSparks:289

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

## js/25-efx.js (371) — efxFX: ภาพของ event "efx" ทุกคาถา (หนึ่ง case ต่อหนึ่งเอฟเฟกต์)
efxState:4 efxFX:21 an:42 rr:42

## js/26-fx-events.js (265) — fx(ev): เอฟเฟกต์+เสียงของทุก event จากโฮสต์ • statusFX (สถานะบนตัว) •…
onfOutlineMat:4 onFireFX:6 statusFX:16 fx:42
§233 overlay: เลือกบัฟ / สรุปผล
choosePick:234 syncOverlays:239 showOver:260

## js/27-world.js (402) — 
S3:4 tx:4 tz:4 CITY_KERB:7 cityKerb:8 GY:9 TW:9 hdr:10 gl:12
§20 เงานุ่มแบบ PCSS (contact-hardening): ใกล้จุดสัมผัสคม ไกลจากวัตถุที่บั…
PCSS:23 scene:50 cam:52 composer:53
§54 ท่อภาพ (post-processing): ฉาก → ชั้นเอฟเฟกต์นุ่ม (FXPass) → แสงฟุ้ง →…
rpass:57 fxScene:59 SOFTU:61 SOFT_GLSL:62 FXMATS:64 fxMat:65 softify:67 HAZE_U:72 AOU:76 GFX:82 AO_ON:83 AO_HEAD:84 AO_CALC:88 AO_COPY:102
§123 TAA (ลบขอบหยักแบบสะสมหลายเฟรม) — กราฟิกสูงเท่านั้น • ปิดด้วย ?notaa
TAA:126 TAA_FRAG:127 _taaH:142 taaWanted:143 taaBegin:144 taaEnd:152 taaFinish:153 taaResolve:155 AO_RT:165 fxPass:187 bloom:188 GRADEU:195 gradePass:216 aaPass:234
§236 คุณภาพกราฟิก: auto = ปรับความละเอียดเองตาม FPS / high = สวยสุด / low …
QUAL:237 QUAL_NAME:238 qualPR:239 applyQuality:245 qualTick:266
§282 ประหยัด CPU สำหรับเครื่องอ่อน (ผู้ใช้ 2026-11-06 "เครื่องผู้เล่นแย่กว…
qualCS:286 CULL:287 cullTick:288 texCanvas:299 glowTex:300 stoneTex:301 runeTex:307 glowMats:315 glowMat:316 STONEM:318 stoneMat:319 shadowAll:320 SKY:323 hemi:343 moonL:345 LDIR:349 setSky:350 SKYB:362 skyFollow:363
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

## js/28-fcs-build.js (374) — 
buildFcs:5 fcsBridge:41 fcsRubbleMat:64 fcsCore:79 FCSB:105 fcsParView:106 FSH_V:120 FSH_B:121 fcsShellMat:123 fcsBlocks:138 fcsShellBuild:150 fcsParFall:165 fcsFallTick:172 fcsShellView:184 FPILE:192 _rfP:194 _rfQ:194 _rfS:194 fcsFadeList:195 fcsRubbleFade:200 fcsShellFall:204 fcsPileTick:213 fcsShellClear:231 EFS3:234 fcsFences:235 _efC:252 _efM:252 _efS:252 _efZ:252 efsView:253
§279 ภาพโหมด (ลูกข่ายทุกเครื่องจาก snapshot M.sg)
SGV3:280 sgClearView:281 sgViewBuild:282 SGVZR:302 sgBarrier:305 sgSync:319 sgDust:340 sgFx:341
§346 HUD
sgTop:347 sgHud:349

## js/28-fcs-castle.js (208) — 
FCSC:9 fcsCastleMat:10 fcsBannerTex:34 fcsGlowTex:44 fcsCastle:46 fcsCastleTick:171
§173 room pieces: look (js/02-room-*.js view(K,V)) — V = shared builder, m…
fcsRoomsView:174

## js/28-fcs-forest.js (259) — 
FF:7 FF_X1:8 FF_NS:9 ffGroundTex:11 ffParts:33 fcsForest:40 ffMerge:123 ffDetail:131 fcsRuin:158 ffSkyMat:201 ffMist:229 ffMistFrame:246 fcsForestTick:248 FFC:259

## js/28-fcs-props.js (156) — 
FRP:11 FRP_PV:12 FRP_PB:13 frpMat:16
§26 part builders: local metres, x along the prop, z across, y up. push(g…
frpBuild:27 fcsPropsBuild:75 fcsPropsView:101 fcsRoomBrkFx:110 FRP_DEB:111 frpDebris:114 _frM:128 _frQ:128 _frS:128 frpSet:129 frpDebrisTick:130
§139 wall hit marks (event 'rwh'): decal quads on the wall face, ring buff…
frpMarkTex:140 fcsWallHit:144

## js/28-maps-build.js (781) — สร้างแผนที่
CANDLESYS:2 builtMap:3 builtKey:3 world:3 TORCHES:3 CANDLES:3 FIREFLIES:3 CRYSTAL:3 RUNE:3 SNITCH:3 BANNERS:3 SNOW:3 WCACHE:5 WCACHE_MAX:5 wkey:7 buildWorld:8 addW:42 _prewarmed:44 prewarmShaders:45 batchStatic:64 makeCandles:89 updateCandles:98 buildCastle:107 buildHogsmeade:173 buildGreatHall:261 buildForest:331
§428 ทุ่งหญ้าฮอกวอตส์ (เย็น)
ringTrees:429 grassTex:438 buildMeadow:439
§458 ทะเลสาบน้ำแข็ง (กลางคืน)
buildLake:459
§480 ซากลานประลอง (เย็น ทราย)
§481 Test Place (ห้องฝึก): พื้นตารางเรียบๆ กลางวัน + วงโซนเสกมอนสเตอร์
§482 บรรยากาศที่ใช้ร่วมกัน (แผนที่จากโค้ด + แผนที่จากไฟล์ผ่าน fx ใน guides…
makeSnow:483 makeFireflies:490 makeSnitch:497 fileMapFx:504
§514 แผนที่จากไฟล์ Blender (guides/MAP-DESIGN.md)
terrGeo:516 buildFileMap:524 tickM:572 TRPAD:573 ARPAD:573 SHPAD:573 signTex:574 testSign:575 buildTest:582 buildRuins:687 buildPitch:712

## js/29-characters.js (439) — ระบบผ้า (เสื้อคลุมพลิ้วตามการเคลื่อนที่)
makeCloak:2 updateCloth:10 wandNamed:34 wandSparks:83
§92 โมเดลนักเรียนเวทมนตร์
SHGEO:94 SHMAT:94 SHTEX:94 sGeo:95 sMat:96 bMat:99 matKey:101 bodyPatch:107 BODYM:114 bodyMat:115 plainMat:120 mergeBody:121 sStripe:157 hashStr:158 stripeTex:159 shieldMat:160 addStatus:168 makeStudent:174 makeEnemy:281 keepTex:419 keepMatSet:420 disposeMaterial:421 disposeTree:427 disposeObj:437 PM3:438 EM3:438 JM3:438 clearDyn:439

## js/30-particles.js (354) — อนุภาค 2 ชั้น: แสงเรือง (additive) + ควัน (normal)
PMAX:2 PGLOW_OCC:6 PLIT:6
§7 อนุภาคบน GPU (ผู้ใช้ 2026-11-06 ลองเล่นแล้วให้เปิดทุกคน • ?cpup = กลั…
PGPU:10 PGPU_F:10 PG_U:10 PGPU_HEAD:11 PGPU_DEAD:18 PGPU_MV:19 pgpuGeo:20 makePointSys:24
§69 เปลวไฟ: FLAME_STYLE 0 = อนุภาคกลมเรืองแสง (ไม่ใช้รูปเปลว) • 2 = แบบให…
FLAME_STYLE:71 PTIME:72 NOISETEX:74 FLAMETEX_V1:80 FLAMETEX_V2:85 PSYS:95 FLAMELUT:113 FLAMECOL:116 flame:117 PFB:126 ptexUse:127 ptexLoad:153 colCache:155 col3:156 CURL:159 CURL_V:160 curlAt:161 pgpuSpawn:164 _pgF:178 updateParticlesG:179 updateParticles:194
§235 เอฟเฟกต์รูปทรง: แฟลช / วงแหวน / โดม / รอยไหม้ / สายฟ้า / แสงชั่วคราว
SHAPES_Q:236 SHAPES:236 FLASHL:236 LINES:236 LREQ:237 ringGeo:238 ringVGeo:239 arcGeo:240 domeGeo:241 fullGeo:242 discGeo:243 decalTex:244 FX:245 jag:259 SHB:273 _sbM:273 _sbQ:273 _sbE:273 _sbS:273 _sbC:273 SHB_GEO:274 _sbDecalMat:275 shbMat:276 shbMake:287 spawnShape:299 updateShapes:309 _cp:339 updateLights:340

## js/31-camera.js (228) — กล้องมุมหลังไหล่ (แบบ Hogwarts Legacy)
yaw:2 pitch:2 lastPh:2 locked:2 CAMRS:3 SENS:4 saveSet:5 applySettings:6 camPos:14 camLook:14 overlayOpen:17 showPause:18 hidePause:19 MAPCAM:20 PLACE:22 placeKey:23 updatePlaceGhost:31 _aimD:45 rayTerr:47 aimFromCrosshair:53 AIMZ:85 WBY:85 CAM_FRAMES:89 CAM_FRAME:106 CAM_TRACK:106 _camFocus:107 _camAnchor:107 _camWant:107 cameraFrame:108 camRoomK:140 _camOB:152 camObsK:153 updateCamera:163 menuCamera:224

## js/32-stage.js (315) — เวทีเมนู/ล็อบบี้: ห้องโถงมืด แท่นวงเวททอง เทียนลอย (ฉากแยกจากแผนที่)
stage:2 STAGE:5 STAGE_Y:6 stageSpots:58 stageChar:74 POSES:81 stageIdle:87
§109 เอฟเฟกต์หน้าเมนู (โชว์เฉพาะหน้าแรก ไม่โชว์ในล็อบบี้/หน้าสร้างตัวละคร)…
stageMenuFx:135 _sv:146
§147 ฉากประจำบ้าน (โผล่ตอนเลือกบ้านในหน้าสร้างตัวละคร)
CRESTTEX:148 crestTex:149 crestBanner:157 buildHouseEnvs:165 TONE0:213 _tc:214 stageTone:215 stageScreen:228 renderStage:229 drawStageLabels:286

## js/33-pyro-view.js (367) — ภาพของสายไฟ (pyroFX: ชาร์จ/พุ่ง/ดีดนิ้ว/กลายร่าง/Dragonfall/Colossus)…
§2 sync ตัวละคร/ศัตรู/ลูกเวท กับ snapshot
localVel:3
§11 ภาพของสายไฟ: ชาร์จลูกไฟ / ย่อตัวชาร์จพุ่ง / วงเวทพ่นไฟ / ดีดนิ้ว / กล…
_pw:12 simOf:13 makeColossus:14 makeMagicCircle:67 _fsGeo:77 fireShieldFX:79 pyroFX:101 NOVAD:299 _novaGeo:299 novaDome:300 updateNovaDomes:305 frostMlCast:309 pyroNovaCharge:329 pyTip:344 BLZV:347 blzOutlineMat:348 blzOutline:350 blazeLinks:355 blazeVignette:364

## js/34-frost-view.js (285) — ภาพของสายน้ำแข็ง: ดาบ/ขวานน้ำแข็งที่ปลายไม้ ท่าฟัน โล่อัศวิน ไถล แช่แ…
iceMat:2 iceRim:3 makeIceSword:4 makeIceAxe:23 makeKiteShield:39
§51 อาวุธน้ำแข็งลอย (ผู้ใช้ 2026-10-22: "ร่ายคาถาให้ดาบฟันเอง ระยะเท่าเดิ…
makeIceCrown:55 frostCrown:60 FWS:66 FWA:66 _fwM:67 _fwM2:67 _fwX:67 _fwY:67 _fwZ:67 _fwP:67 _fwS:67 _fwQ:67 _eo:68 _ei:68 _ss:68 fwAim:70 fwWeapons:71 FWP:73 FWT:73 fwChop:74 fwSweep:75 FF_RISE:76 fwIdle:77 fwSwing:80 FWL_N:92 fwLink:93 fwMat:96 frostFX:97

## js/35-sync.js (621) — ซิงก์ผู้เล่น/ศัตรู/ลูกเวทจาก snapshot + ฉายตำแหน่งลงจอ (ป้ายชื่อ/ตัวเ…
§2 ท่าร่ายคาถาแบบนักเวทในหนัง Harry Potter (ผู้ใช้ 2026-10-22: "ยิงปกติท…
CPOSE_T:7 _ce:7 _cs:7 _cb:7 AMP_B:9 AMP_S:9 CP_BEND:10 CPOSE:12 _cpT:20 _cpR:20 CGUARD:20 CP_STEP:21 CPCOL:22 castStyle:23 castStart:24
§25 ท่าร่ายสกิล / อัลติ / โล่ (ผู้ใช้ 2026-10-22: "เกือบทุกสกิลควรมีการเห…
CANIM:30 SKFEET:84 SKANIM:86 skAnim:94 _caT:95 _caR:95 skillPose:96 _g2:122 wandTwoHand:123 characterPoseMix:130 characterStance:131 CBLOCK:138 CBLOCK_PATH:139 blockPose:140 castPose:146 lateSkillPose:152 castPose0:153 clearCharacterCast:182 syncPlayers:187 syncEnemies:294 projGeo:333 tailGeo:334 _t1:335 makeProj:336 _a:357 _b:357 PJFX:359 syncProj:360 _awT:461 animateWorld:462
§503 ฉายตำแหน่ง 3D ลงจอ (ป้ายชื่อ / ตัวเลขดาเมจ)
_v:504 toScreen:505 BURNC:513 burnNum:514 NAMETAG:528 nameTag:529 drawLabels:533 TEXTAG:564 textTag:565 drawTexts:569 HITM:581 DIRI:581 drawXh:583 drawCrosshair:593

## js/36-modes-view.js (171) — 
ROLE:4 KC:4 roleShowT:4 onPriv:5 MO:10 BREATHS:11 clearModeObjs:12 ITEMC:21 healTex:22 makeItem:23 syncModeObjs:39
§140 หน้าประชุมโหวต (หาลอร์ดโวลเดอมอร์)
meetKey:141 myVoted:141 castVote:142 syncMeeting:148

## js/37-render-loop.js (111) — ลูปเรนเดอร์
lastFrame:2 HSTOP:5 hitStop:6 FXSTUDIO:8
§9 เก็บ shader ที่ compile แล้วไว้ตลอดเกม (ผู้ใช้ 2026-11-02 "เล่นกับบอท…
PINMAX:13 PINNED:13 KEEPSRC:16 pinPrograms:22 frame:25 _fpsAcc:41 _fpsN:41 _fpsLast:41 render:42 renderGame:86

## js/38-hud.js (461) —
drawReticleTimer:1
§10 HUD
rr:11 SLOTS:12 fmtTime:13
§14 ชิ้นส่วน HUD ธีมทอง-น้ำเงิน
HG:15 HG2:15 HUDF:17 hudTick:18 readyPulse:20 diaPath:22 plate:24 frameBox:30 bossTrail:38 drawBossBar:39 spellDia:59 thinBar:88 drawHUD:93 raceRankClient:173 drawModeHUD:177 MM:215 drawMinimap:216 slotKey:289 mySlots:290 STATUS_ICO:299 SLOTS_IMP:300 BR_LOCK:301 CLUSTER:303 E_NEEDSTAND:304 slotState:305 drawBottom:329 drawBoard:344 FHUD:369 FHTEX:370 fhFrame:371 FH_EDGE:374 FH_CORE:374 fhMix:375 drawFireHeat:376 SNAPB:450 snapBanner:451 drawSnapBanner:452

## js/39-menu.js (286) — 
myLook:5 myColor:5 myKit:5 myName:6 renderMyHouse:9
§11 หน้าสร้าง/แต่งตัวละคร (2 ขั้น: 1 หน้าตา → 2 เลือกบ้าน)
crLib:12 crSaved:12 crKitSaved:12 crOpen:12 crStep:12 crTab:12 crFirst:12 crKitOnly:12 crSlot:12 CRTABS:13 sw_:14 bt_:15 nameBox_:16 crPanelSet:17 crRenderStep1:22 crRenderWand:33
§36 ขั้น 3: สาย + ชุดคาถา
ROLE_COL:37 roleTag:38 DESIGNED:39 spellTags:40 spellDescHTML:47 baseDescHTML:51 SB_THEME:59 ROLE_ORDER:68 sbFxRun:69 sbFxT:69 sbParts:69 crRenderKit:70 sbStartFx:99 sbFxTick:100 sbBurst:127 crAssign:133 crRenderHouse:142 crGo:149 crSaveName:161 crSetHouse:162 openCreator:163 closeCreator:173 lobbyKitSend:180
§222 ฉากเปิด (#intro) + ประกายบนหน้าเมนู (#menuFx)
TITLE:225 titleSpark:226 TSPR:228 titleSprite:229 titleDraw:230 titleLoop:240 titleGo:251 JOINQ:259 ovResult:279

## js/40-train-settings.js (253) — เมนูทดลอง (ห้องฝึก / Test Place)
trOpenF:2 trKey:2 trN:2 TR_OPTS:3 trToggle:4 trSend:9 trSync:14
§52 แท่นเสกบอท (โซนเสกบอท ห้องฝึก, trBotPad js/02): ยืนบนแท่น = เมนูขึ้น …
bpOpen:53 bpOn:53 bpKey:53 bpShow:55 bpSync:57 hovEl:127
§128 หน้าตั้งค่า
setRow:129 setTog:130 setTab:131 XHC:132 XHN:132 setOpts:133 SET_ICO:135 SET_EN:138 renderSettings:139 drawXhPrev:161 openSettings:162 closeSettings:164 modeIcon:220 modeTitle:221 renderLobby:222

## js/41-debug.js (220) — 
botBrain:6 _obsKeep:50 balArena:51 _balStash:54 balIsolate:55 balReset:58 balDuel:64 balTour:80 balTeamReset:95 balTeam:104 balCoop:132 balSpellTest:148
§169 Service Worker (sw.js): เก็บไฟล์เกมไว้ในเครื่อง เปิดครั้งต่อไปเร็วขึ้…
SWK:170 swSetup:171
§189 เช็คการ์ดจอตอนเปิดเกม
GPUC:192 gpuCheck:193

## js/42-fire-vfx.js (347) — ไฟแบบใหม่ (2026-10-19): shader ไฟเคลื่อนไหวจริง (noise ไหล) ใช้กับลูก…
FIRE_U:4 FIRE_GLSL:5 fireMat:24
§55 ชิ้นงานสำเร็จรูป
_fbGeo:56 _fbGeo2:56 makeFireBall:58 _ftGeo:66 makeFireTail:67 makeFireWall:70 FIREV:78 fireBlast:79 fireTemp:84 updateFireV:85
§90 ปีกไฟ (Dragonfall) จากไฟล์ Blender mesh_fire_wing (assets/src/fx_mesh…
makeFireWings:93 poseFireWings:100
§101 ชิ้นงานพื้น/กระแทก (รอบ Pyro 2026-10-19): พื้นแตกเป็นใย (ดำ + ไฟลุกตา…
_crackPaths:104 _crackGeo:113 _decM:117 _crackRibbon:119 fireCrackWeb:127 _charTex:149 charTex:150 _discGeo:153 scorch:154 _fruneTex:158 fruneTex:159 fireRune:167 _rockGeo:173 _rockM:174 _rockRestProx:175 rockChunks:176 fireGeyser:185 _mv1:193 _mv2:193 fireMeteor:194
§206 อากาศร้อนบิดเบี้ยว (heat haze) — Blazeform "ออร่าความร้อน" (ผู้เล่น 2…
HZM:209 hazeMat:210 _hzPlane:220 _hzRing:221 hazeOf:223 fireBurn:228
§237 ไฟ 3 มิติจริง (volumetric) — ผู้เล่น 2026-10-19: "ไฟดูเป็นภาพ 2D เกิน…
NOISE3D:242 FIRE3D:251 _fvIdx:256 fireVol:257 fireVolTemp:301
§302 ไฟ 3 มิติที่ bake จาก Blender ทั้งก้อน (วิธี 1 — ผู้เล่นเลือก 2026-10…
FSEQ:306 fireSeqLoad:307 fireSeqReady:311 fireSeqVol:312 fireSeqAt:333 _sqA:340 _sqB:340 _sqX:340 _sqY:340 _sqZ:340 _sqM:340 fireSeqLine:341

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

## js/44-vfx-kit.js (395) — 
§8 1) หางแสง
TRMAX:11 TRPTS:11 TRAILS:11 _trL:12 trailLayer:13 trailNew:22 trailPoint:24 trailStop:27 _tv1:28 _tv2:28 _tv3:28 updateTrails:29
§52 2) สูตรเอฟเฟกต์ = จานสี (ธาตุ) × แม่แบบ (ขนาด/ชนิด)
VFXPAL:56 VFXTPL:73 VFXSIG:85 VFXSIGK:93 VFXR:95 _palCache:98 palOf:99 _pc:102 playFx:103 nearMe:113 fxLayer:114
§146 3) ผูกเอฟเฟกต์ซ้อนชั้นกับเหตุการณ์ของทุกสาย (เพิ่มทับของเดิม ไม่ลบหน้…
EFXAUG:148 PJPAL:167 pjPal:169 ULTCOL:170 efxAug:171 VFXAUG_ON:178 fxAug:179
§199 3b) สนามรบ (designs/battlefield.md ขั้น 1, แบบ C): ทุกสกิลทิ้งควัน/ฝุ…
BF_EL:202 BF_CLS:202 BF_EXTRA:204 BF:207 bfAfter:208 bfPlay:228
§232 3c) สนามรบ ขั้น 2: รอยค้างบนพื้น + ซากรก ๆ (หายเองหลัง BF_LIFE วิ, เด…
BF_LIFE:236 BF_FADE:236 BFM:237 BF_MK:238 BF_MKA:238 BF_MKR:238 bfMarkMesh:239 _bfQ:247 _bfQ2:247 _bfN:247 _bfUp:247 _bfS:247 _bfP:247 _bfMx:247 bfMark:249 bfAge:258 updateBfMarks:271 BFRS:276 bfRestPool:277 bfRestAdd:282 bfBinAdd:289 bfBinBuild:293 bfRest:298 bfScatter:304 _rockMat:312 bfCollapse:314 updateBfRest:321 bfClear:328
§332 3d) สนามรบ ขั้น 5: บรรยากาศตามความพังรอบตัว (designs/battlefield.md)
BFA:336 bfWreck:337 updateBfAir:342 bfRumble:365 updateBf:368
§371 4) เอฟเฟกต์ทั้งจอ (ค่าไปที่ GradePass ใน js/27-world.js)
SCR:372 impactFrame:375 screenFlash:376 screenRadial:377 screenKick:378 screenHurt:379 _scv:380 updateScreenFx:381 updateVfxKit:395

## js/45-fx-runtime.js (398) — 
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
FXGEO:205 fxMerge:206 fxRibbon:211 fxGeo:217 fxEnergyMat:237 fxWaterMat:252 fxToonWaterMat:265 fxWindShellMat:281 fxToonMat:290 fxMeshMake:298 fxMeshTick:320 fxFlipTex:335
§340 หางแสง / รอยฟัน
fxTrailTick:341
§347 สายฟ้า
fxBolt:348
§354 ฟังก์ชันในโค้ดที่ไฟล์เรียกได้ (ชั้น t:"code")
FXCODE:355
§368 ผูกกับ event ของเกม (assets/fx/bind.json) — เรียกจาก fx(ev)
fxLoopName:370 blzFxName:371 fxLoopKeep:372 fshHitFx:374 fxBind:377
§388 แม่แบบ playFx เป็นไฟล์ (assets/fx/tpl/*, sig/*, rec/*)
fxTpl:390

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

## js/47-earth-view.js (996) — 
ECOL:9 EGUARD_BIG:14 EGUARD:14 EV:15 eW:16 EARTH_FIST_SCALE:17 eYaw:18
§19 ลายผิว (วาดเองบน canvas: หิน/ทราย + รอยร้าว + ขอบบล็อกแบบ Roblox)
ETEX:20 eTex:21 eFadeTex:35 eMat:37 eTMat:38 rockGeo:39 ROCKU:45 rockMesh:46 coneMesh:48 _eChunkM:50 eChunks:51
§53 Stand (บล็อกหิน/ทรายครึ่งตัวบน)
makeStand:55
§92 Rampage: เกราะลมหน้า Stand (ผู้ใช้: เหมือนอุกกาบาตตกโลก ต้านลม — เปลื…
makeBow:94 EBOW:103 _RIM:103 eRampWind:104 eSpikes:116 standOp:121 _ikDn:124 eArmIK:125 PK:132 standPose:134 _eRq:161 _eRq2:161 _eRx:161 standRun:162 eState:180 eStandOf:181 eGiantOf:182 eSandFall:184 eAppear:185 eAim:187
§190 วงเตือนบนพื้น (BA ชาร์จ / จุดปาเสา): วงเข้มก่อน แล้วสีอ่อนค่อย ๆ เติม…
makeWarn:191 eWarnAt:196 eStoneDir:197 eStonePrep:201 eFistCharge:209 eStonePunch:226 eFistEase:238 eFistMotion:239 eFistPose:243 eFistPlayerPose:268 eWrathPillarDir:285 eWrathBoostRock:286 eWrathStand:311 eWrathPlayerPose:386 _eForearmAxis:403 _eForearmQ:403 earthFistForearm:404
§415 ทุกเฟรม: ผู้เล่นสายดิน (เรียกจาก syncPlayers)
earthFX:416
§490 สว่าน (ref: designs/earth_ref/drill_ref.png): หินแหลมเรียวเป็นตัวหลัก…
eSteelEnv:492 eHeatTex:497 EDR:502 eDrillGeo:503 makeDrill:509 drillHeat:516
§518 เสายักษ์ (ref: designs/earth_ref/pillar_ref.png): เสาเหลี่ยมยาว ปลายห…
ePillarVeins:519 makePillar:537
§543 กระสุนหิน
earthFistMat:545 makeEarthFist:549 eFistCrumble:565 earthProjMesh:588 SLAB:598 makeSlab:599 eSlabGeo:604 eSlabMats:615 slabCracks:682
§685 สิ่งก่อสร้าง + ฝุ่น (เรียกจาก render loop)
earthClear:686 eMergePartial:694 eMergeKids:699 eMakeSO:707 syncEarth:724 earthFog:769 eMudScreen:772 _eOlMat:779 eOutlines:781 _eCamT:786 eAnim:787 eDebris:788 eWave:790 eAirWave:792 esbImpact:795
§802 event "efx" ของสายดิน (เรียกจากต้น efxFX) — คืน true = จัดการแล้ว
earthEfx:803 eWindOut:912 eAirCone:918 eDrillFly:920
§924 บึงโคลน (Mud Swamp + บึงจากเสาอัลติ): คลื่นกระเพื่อมจากกลางไปขอบ แล้ว…
earthMudZone:925 earthMudSink:932
§933 HUD ใต้เป้าเล็ง
ESM:935 eSmooth:936 ESF:939 eShieldFx:940 eChips:945 eShieldSegs:948 eShieldNum:962 eShieldArc:966 drawEarthHud:979

## js/48-ragdoll.js (227) — 
RAG:10 RAGJ:23 RAGB:29 RAGS:33 RAGMIN:37 RAGHINGE:39 _rv1:40 _rv2:40 _rv3:40 _rqa:40 _rqb:40 _rm:40 ragBones:41 ragBasis:48 ragTargets:56 ragStart:62 ragBack:88 ragFloor:89 ragStep:90 ragPose:155 ragWrite:170 ragRestore:182 ragEnd:186 ragTick:188 ragHideDead:222

## js/49-cloth.js (189) — 
CLOTH:10 CL_ROWS:26 CL_NC:26 CL_GAP:26 CL_IN:26 _clV:27 _clA:27 _clB:27 clPinK:29 clBind:31 cloakPanelGrid:33 cloakBodyIndices:47 stormCape:56 clothSetup:94 clTargets:123 clReset:127 clCapsule:131 _clO:135 clWorld:136 clWorldHit:145 clStep:150 clDraw:163 clothTick:170

## js/50-grass.js (400) — 
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
GR_NOISE:162 GR_LIVE:167 grLive:185 GR_GLSL_V:193 GR_BEGIN:198 grassMat:245 grassBuild:263 _grBasic:277 grassBake:278 grassCount:334 grassTick:339
§377 สกิลลม → หญ้า (ภาพล้วน เรียกจาก windEfx js/68)
WIND_GRASS:379 airWind:393

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

## js/53-victory.js (165) — จบเกม (ผู้ใช้ 2026-10-22): VICTORY / DEFEAT แบบ Overwatch แต่เป็นเวทมนตร์ (สายฟ้า + ไฟ) +…
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

## js/55-podium.js (82) — โพเดียมธีมฮอกวอตส์ (ผู้ใช้ 2026-10-22 "podium but make it magician theme hogwart theme")
POD:6 POD_X:7 POD_H:7 POD_C:7 podStart:8 podStop:29 podPose:37 renderPodium:49

## js/56-progress.js (94) — เลเวล + สถิติ + ของปลดล็อค (ผู้ใช้ 2026-10-22: "more skin wand cloak unlock as lvl" → เลื…
§7 var/function (ไม่ใช่ const): หน้าสร้างตัวละครอาจเปิดตอนโหลด (?nointro…
LV_MAX:8 DEV_MAXLV:11 lvNeed:12 UNLOCKS:13 PROF_ITEMS:23 lvRewards:31 lvNextReward:32 PROG:33 progSave:34 lvOf:35 progLv:36 xpMax:37 wandKillNeed:39 lookLock:40 lookClampLocks:41 progXP:43 progAward:44 progBox:56 progOpen:64 progChip:76

## js/57-tutorial.js (44) — วิธีเล่นแต่ละสาย (ผู้ใช้ 2026-10-22 "สอนเล่นแต่ละสาย") — ปุ่ม "📖 วิธีเล่นสายนี้" ในหน้าเ…
TUTTIPS:7 tutOpen:12 tutTry:31

## js/58-deathcam.js (60) — กล้องตอนตาย (ผู้ใช้ 2026-10-22): "when ded make cam focus on person who kill u at ur ded …
DCAM_T1:10 DCAM_T2:10 DCAM_FADE:10 DCAM:11 dcamDie:12 _dcP:19 _dcL:19 dcamCam:20 drawDeathCam:47

## js/59-podroom.js (151) — ห้องโถงใหญ่ฮอกวอตส์สำหรับโพเดียม (ผู้ใช้ 2026-10-22 "design me a new lobby for background…
PODS:9 PODR:11 podRoomBuild:12 podRoomTick:142

## js/60-menu3d.js (397) — เมนูแรก = ลานดวลเวทใต้ดาว ที่ "เดินได้" (ผู้ใช้ 2026-10-22, รอบ 2: "redesign the menu by …
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

## js/62-hub-ui.js (312) — 
HUI_IMG:9 HMODES:10 HUI:16 HICO:18 hSvg:37 hHex:38 H_STAR:39
§97 สถานะหน้าจอ: menu / modes / room / off
hubUiState:98 hubMeChip:106 hubOnScreen:112
§121 เมนูแรก
hubJoinGo:124
§135 การ์ดโหมด
hubMxJoin:142 hubPickMode:155 hubFlipKill:171 hubRoomRect:172 hubFlip:173 hubLeaveRoom:189 hubUnflip:194 hubFlipEnd:207
§214 แผงห้อง (การ์ดที่ขยายแล้ว)
HUI_MAPN:215 hubLobby:216 hubRoomClick:279 hubKitChanged:302
§304 เริ่มต้น

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

## js/66-hud4.js (222) — HUD รอบ 4 (ผู้ใช้ 2026-10-23, designs/hud-full-mock.html)
H4E:5 H4:15 h4God:16 h4Pal:17 hud4Col:19 h4Parts:21 h4AuBits:26 h4Key:41 h4Ico:42 h4Build:43 h4Set:73 hud4Draw:74
§128 ไพ่สกิล: นาฬิกาทราย / ท่าใช้ / สลับตำแหน่ง
h4Glass:130 h4Bits:136 h4Fx:138 h4CardUse:140 h4GlassOut:144 h4Place:148 h4OrdKey:151 h4OrdLoad:152 h4Swap:155 h4Pick:158 h4AltKey:160 h4CardWire:164
§175 ไพ่อัลติ
H4SH:177 h4UltCard:179 h4UltUse:184 hud4Frame:186 hud4Hide:187
§188 ไพ่อัลติกลางจอ (ผู้ใช้ 2026-11-01)
h4UltX:191
§198 รูปตัวละครเรา (FFA / TDM แทนแผนที่ย่อ)
H4PF:200 h4PfMode:201 h4PfAvatar:203 h4Portrait:205 h4PfRead:216 h4MapBox:222

## js/67-backdrop.js (139) — 
BACKDROP:8
§66 noise เล็ก ๆ (คงที่ต่อ seed)
bdHash:67 bdNoise:68 bdFbm:69 bdEdge:71 bdRing:73 bdPaint:79 bdTree:82 buildBackdrop:89 bdTower:135 backdropHide:139

## js/68-darkness-view.js (941) —
nightWaltzStrip:2 nightWaltzBorder:80 stDarkVeilGround:118 darkFxMesh:195 darkShieldHud:201 drawDarknessHud:202 drawDarkHudBar:222 drawDarkShieldMeter:229 darknessMarkView:243 darkWaveViews:253 darkActiveViews:253 darkViewRoot:254 darkViewTemp:260 darknessClear:272 darkWorldAt:281 darkMarkWind:284 darkMarkLaunch:309 darkMarkContact:321 darkViewNow:334 darkFlowHud:334 darkSettleWeapon:335 darkBlendWeapon:345 darkTrailHistory:357 darkDashView:395 darknessCharacter:440 darknessEfx:619 stDarkShieldInk:821 stDarkVeilBlade:864 stWardDrainPool:901

## js/68-light-view.js (1884) —
LGV:7 LGSH:9 LGSH_L:11 _lgM4:14 _lgQ:14 _lgSV:14 _lgS:14 _lgC:14 _lgC2:14 lgGlowTex:15 lgNeon:17 lgEmpFx:25 lgWallBurn:44 lgShardSpawn:60 lgShardTick:64 lgBaCore:65 lgCrDim:108 lgEmpBeam:112 lgNeonCrystal:126 lgSanctumFloorTex:136 lgSanctumMoteTex:147 lgHoneyTex:162 lgShield:166 _lgShieldEuler:202 lightShieldEv:203 LGPOSE:206 _lgGlass:207 _lgCore:207 _lgGeo:207 _lgEdge:207 _lgEdgeM:207 lgCrystalMesh:209 lgState:217 _lgV:218 _lgW:218 lgWorld:219 LG_ULT_ASSET:222 LG_CRYSTAL_ASSET:222 LG_ULT_INTRO:223 LG_ULT_ARRIVAL_FX:223 LG_ULT_TIME:224 lgUltMaterials:225 lgSovereignFinishes:226 lgSovereignMaterials:227 lgSovereignFinish:288 lgSovereignCrystal:309 lgSkinSovereign:318 lgPoseSovereign:371 lgSovereignHeart:447 LG_SASH_X:473 LG_SASH_Z:473 lgSovereignRibbon:474 lgSovereignFlare:533 LG_PALM_TRAVEL:546 LG_PALM_SCORCH_LIFE:547 LG_PALM_SCORCH_SLOTS:547 lgPalmGateOffset:548 lgSovereignPalmWaves:550 lgPosePalmWaves:559 lgPoseBeamWaves:565 lgSovereignPalmGate:577 lgSovereignScorchTrail:587 lgPalmScorch:615 lgSovereignCrossSparks:651 lgSovereignGather:674 lgSovereignWingCurrent:707 lgSovereignChargeSeal:736 lgSovereignChestRecoil:753 lgSovereignSeal:763 lgSovereignArmSigils:779 lgBuildSovereign:810 lgReturnMark:887 lgUltVisual:901 lgWardVisual:1128 _lgBeamM:1144 lgBeamMat:1145 lgSovereignChestBeam:1148 lgSovereignPalmBeam:1185 _lgLinkM:1255 lgLinkMat:1256 lgUnitTube:1259 lgTube:1260 lgAim:1268 lightFX:1269 lgBaseObjects:1486 lgClearBase:1487 lgClear:1488 lightDropView:1495 lgAllyEmpEnd:1501
§1505 เหตุการณ์
lgBlip:1507 lgArcFx:1511 lgFlyFx:1514 lgSovereignArrival:1515 lightFxTick:1554 LG_BLAST_EXPAND:1558 LG_BLAST_HOLD:1558 lgImpactDome:1559 lgBlastFloor:1599 lgBlastThreads:1630 lgVolleyWarning:1658 lightEfx:1681 _lgHq:1825 _lgHy:1825 lgProcHead:1827 lightHeadPose:1842 LGHUD:1850 drawLightHud:1851

## js/68-nature-art.js (171) — 
naturePlantArt:2 Turret:3 auraTextures:44 auraTex:45 LotusAura:88 glowWallTex:92 M_BUB:95 M_BUBRIM:96 M_DRIP:97 M_POOL:98 lotusPetalVeins:100 Lotus:127

## js/68-nature-fx.js (173) — 
_natFx:3 natFxClear:4 natFxMake:5 T:6 S:6 O:6 seed:7 ease:8 outQ:8 inQ:8 phase:8 tipW:9 ALL:10 mesh:11 STD:12 ADD:13 M:14 glowTex:31 GLOWT:32 GLOWG:32 GLOWP:32 GLOWV:32 glow:33 ring:34 Tube:36 V3:51 Thorns:53 thornsAlong:65
§69 อนุภาค
Pool:70 leafGeo:78 LEAF:79 SPK:80 DIRT:81 PUFF:82 CHIP:83 POOLS:84 leafCols:85 leaves:86 sparks:87 dirt:88 puff:89 chips:90 TrailRibbon:92 WHIP_N:103 WHIP_L:103 WHIP_LAG:103 Whip:104 CLIPS:167 tick:168 clip:169 drop:170 natFx:173

## js/68-nature-view.js (831) — 
NAT_VIEW:2 NAT_MARKS:2 NAT_MOTION:2 natV:3 natWorld:4 natPhase:5 natSmooth:6 natEase:7 natOut:8 natStd:9 natAdd:10 natMesh:11 natRing:12 natLeaf:16 natPlantM:19 natGlow:26 natArt:29 natureProjectileModel:31 natSet:37 natAnimate:38 natTube:39 natTrail:50 natSeed:68 natLotus:77 natBall:93 natPlantView:103 natStartStudy:113 natWearWall:131 natTreeGlow:154 natModelTick:174 natMarker:257 natMarks:268 natThorn:287 NAT_SHIELD_K:292 natShieldMake:293 natureCharacter:325 natOutlineMat:354 natOutline:358 natLinks:370 syncNature:385 natureClear:404 natDome:413 natMuzzle:435 natSlam:445 natHook:462 natCoil:519 _nfQ:540 _nfT:540 _nfX:540 natWandTip:542 HOOK_HIT:545 natPullQ:545 natPullE:545 _nwQ:546 natForearmR:548 natEmpPose:552 natBigSlam:560 natRootWarn:567 natRootUp:571 natThornLine:577 natRest:590 natHookFoePose:595 natHookPose:611 natHookArm:627 natShock:629 natSprout:630 natHealRims:631 natWhipHit:633 natBallRange:634 natSummon:636 NAT_TREE_GREEN:644 NAT_TREE_RED:644 _natGlowRed:645 natFoe:646 natTreeTint:647 natTreeAura:648 natAuraDrop:658 NAT_HOLO:660 natHoloMake:661 natHolo:672 natHoloClear:675 natDirOf:676 natMoment:677 natureEvent:706 NTHUD:774 drawNatureHud:775 NPH:796 NPH_IC:797 natPortraitObj:803 natPortrait:804 natPlantHud:816

## js/68-storm-bow.js (285) — 
SB_FULL:2 _sbShard:3 sbShard:4 sbMat:5 sbJag:6 SB_TIP:8 _sbBlade:9 sbBlade:10 sbMake:11 SB_START:33 SB_ANCHOR:33 SB_POLE:33 stormBowView:34 _ikS:90 _ikE:90 _ikH:90 _ikT:90 _ikP:90 _ikD:90 _ikA:90 _ikQ:90 _ikQ2:90 sbAim:91 stormBowForearm:94 stormBowFx:106 sbStaffAxis:122 sbStaffMake:123 stormStaffView:140 stormStaffCast:152 stormStaffSwing:155 _sbWaveG:157 sbWaveGeo:158 SB_WAVE_F:159 stormWaveMake:169 stormWaveTick:173 SMK:181 SWAVE_BURSTS:182 WAVE_BURST_CYAN:183 stormWaveBurst:184 stormWaveBurstTick:209 _smkEye:239 _smkRot:239 stormMarkSet:240 stormMarkClear:262 stormMarkTick:266

## js/68-water-view.js (249) — 
WTV:5 WTC:6 WT_BODY:8 WMB_POSE:14 waterMoonPose:15 waterCharacterPose:19 wtState:49 wtStop:50 wtMesh:51 _wtV:53 _wtP:53 wtBakeClone:54 wtLineMat:65 _wtOlMat:72 wtOutline:74 WT_SINKD:80 wtSinkOffset:81 wtAlive:88 wtLoop:90 WT_FR:93 wtFrPath:94 _wtFa:96 _wtFb:96 _wtFs:96 _wtFn:96 wtFamRiseMesh:97 WT_POOL:102 wtFamRise:103 wtFamRiseOff:110 _wtTube:112 WT_BEAM_V:113 WT_BEAM_F:116 WT_BEAM_O:120 wtBeamMesh:123 wtBeamSync:127 wtBeamOff:137
§139 ต่อผู้เล่น: โล่ฟองน้ำ/ฮีล • ลูกผู้ช่วยที่ไหล่ • ร่างโคลน + เส้นน้ำ • …
waterFX:140
§188 ทั้งเกม: ลูกผู้ช่วยที่กำลังพุ่ง (ล็อกเป้า)
WT_MOUTH:190 _wtA:191 _wtB:191 wtMouth:192 _wtCyl:195 wtBeam:197 syncWater:200 wtPew:207
§215 เหตุการณ์ (efx z 'wt…')
waterEfx:216
§245 HUD: เกจฮีลโล่ (โค้งซ้ายรอบเป้าเล็ง)
drawWaterHud:246

## js/68-wind-view.js (438) — 
WV:6 WN_BODY:8 WN_AIR_FEET:8 WF_POSE:12 WF_FEET:12 WF_REF:12 WF_ROLL:12 _wfP:13 _wfF:13 windFlyPose:14 WTLF:24 windTailDraw:25 windTailFeel:31 windCharacterPose:33 wvState:50 wvAlive:51
§52 ทุกเฟรมของผู้เล่นสายลม: ปีกติดหลัง / ปีกห่อตอนยกโล่ / ดูดลมชาร์จเกจ
wfeSwing:53 wfeTwist:53 W_BLAST_SUCK:54 WFE_HOLD:55 WFE_TURN:55 windLatePose:57 _faX:93 _faQ:93 _faT:93 WF_ELBOW:93 windForearm:94 windFX:96
§126 กำแพงลมจาก snapshot (ตามตำแหน่ง/ลบเมื่อหมด)
syncWind:127 wvWall:140 wvHitFx:141 wvAimFx:142
§143 ตา Eye of Heaven: ตำแหน่งตาบนฟ้า (ตรงกับ EYE ใน tools/wind-eye-ult-ge…
wvEyePos:144 wvEyeSeen:145
§146 เหตุการณ์ (efx z 'wn…')
WDOME_G:148 WDOME_V:149 WDOME_F:150 windDome:151 windSuckFx:160 windEfx:171
§264 HUD รอบเป้าเล็ง: GaleBurst / Downburst / Dash / Slipstream
_wShellM:266 windShellMat:267 drawWindHud:273
§283 ตัวช่วยเล็งกำแพงลม (เห็นเฉพาะเรา): เส้นโค้งเรืองที่จุดวาง (คลิกขวา) +…
wvAimGhost:284
§295 ปีกเวทสายลมติดหลัง: ขนนก 8+4 เส้นต่อข้าง ทำจากสายลม (shader) + ริบบิ้…
WWS:297 WWU:297 WW_NOISE:298 _wwMat:303 wwMats:304 wwFeatherGeo:350 WW_PRI:361 WW_COV:363 WW_RIB:364 _wwGeo:365 _wsupG:367 _wsupD:367 windSupDust:368 windSupDustTick:372 windWingSup:373 makeWindWings:394 wwCue:408 poseWindWings:412

## js/69-broom.js (236) — ไม้กวาด (ผู้ใช้ 2026-10-29): บินแบบเครื่องบิน + ยิงลำแสงตามสาย + อนิเ…
BRM:9 BFW:12 BSK:13 BROOM_SK:19 broomVert:40 broomMove:53 broomStrike:72 broomStrikeTick:81 broomFlak:89 broomAct:100 broomOff:107 broomBeam:109
§131 ฝั่งจอ
broomHead:133 BBEAM:140 _bbGeo:141 broomView:142 broomMountFx:173 broomDismountFx:181 broomBeamFx:183 broomSkFx:199 broomStrikeFx:212 broomFlakFx:217 broomHud:222 broomHudT:223 broomTick:232

## js/70-water-dragon.js (498) — 
WDG:7 wdgBuild:8 T:9 root:9 fixed:9 rings:10 sides:10 fastNormals:12 geoOf:21 skin:22 faceSkin:50 group:51 head:52 faceTime:54 groundY:54 faceMaterial:55 faceBlue:60 hornBlue:60 ridgeCyan:60 profile:62 headProfile:63 faceGeo:68 fp:68 fc:68 fi:68 faceRings:68 faceSides:68 navy:69 aqua:69 belly:69 flowHi:69 neckBlend:69 headStroke:81 eyePatch:82 waterCrest:97 bodyGeo:123 bodyP:123 bodyUV:123 indices:123 body:129 finShape:131 finGeo:132 finPos:134 finUV:134 finSkin:136 fins:137 limbSkin:139 clawSkin:140 taperedLimb:141 arms:148 bodyLength:158 intro:158 settleWindow:158 tipHz:158 bodyBulk:158 bodyRadius:159 flight:161 quarters:162 step:162 dr:162 dy:162 spiralKnot:163 first:164 entry:164 crest:168 bank:171 corner:171 cruiseEntry:171 quarterHandle:174 leadLength:176 up:180 zAxis:180 yAxis:180 smooth:181 startAt:182 startD:182 startDistance:184 distanceToCruise:184 hoverSpeed:184 fastDuration:184 brakeDuration:184 startRamp:184 fastSpeed:185 progress:186
§195 ทางบิน: ใช้ระยะทาง (เมตร) ไม่ใช่สัดส่วน เพื่อต่อทางพุ่งลงตอนเล็งเสร็จ…
dive:196 PA:197 TA:198 DIVE_DOWN:200 DIVE_POUR:200 DIVE_STEP:200 diveDist:201 lastTime:202 lastHeadT:202 headRight:202 bodyState:202 filtered:202 shape:203 gate:256 rune:258 shadowMat:259 shadow:260 ringMat:261 ring:262 glyphMat:263 glyphHi:264 glyphPath:265 water:272 splashGeometry:275 lowWaveGeometry:276 splashBursts:277 pulse:283 outerRing:284 dropletMat:285 drops:285 transform:287 gateAt:288 sprayMaterial:310 spray:310 curlCurve:312 foamMaterial:313 foam:314 particles:315 foamParticles:315 rand:316 bodySprayAt:317 waveSegments:338 waveSheets:338 wavesAt:345 currentConfigs:360 currentMaterial:367 currentSegments:372 currentSides:372 currentMeshes:372 _cC:381 _cR:381 _cV:381 _cRad:381 currentPointTo:382 currentPoint:389 currentSpray:390 currentParticles:391 _cS:392 _cCos:393 _cSin:393 _cPow:393 currentsAt:394
§459 เล่น
WDG_YAW:460 wdgGet:461 wdgStart:462 wdgDive:469 wdgKeep:472 wdgEnd:473 wdgTick:474

## js/71-perfhud.js (72) — ตัววัดประสิทธิภาพบนจอ (ผู้ใช้ 2026-11-05: "อยากได้ตัววัดอื่น ๆ เพิ่ม เอาไว้เก็บข้อมูล opt…
PERF:9 perfFrame:12 perfDom:26 perfStats:34 perfGraph:38 _gpuName:51 gpuIntegrated:52 perfRows:53 perfPanel:68 perfText:69

## js/72-dash-pose.js (85) — 
DPOSE:12 DPT:24 _dpQ:25 _dpX:25 _dpP:25 dpMix:26 dpKnees:28 dpStyle:36 DPDBG:41 dashPose:42 dpApply:75

## js/73-tune.js (142) — 
TUNE:8 tuneNum:9 tuneBuild:15
§81 ใช้ / เก็บค่า
tuneSetVal:82 tuneApplyFile:85 tuneJson:89
§92 หน้าตา
tuneOpenF:97 tuneFmt:98 tuneRow:99 tuneRefresh:102 tuneMsg:110 tuneToggle:111 tuneEdit:115
§139 API สำหรับเครื่องมือแยก tune.html (เปิดเกมใน iframe แล้วเรียกผ่าน WD)
tuneDump:140 tuneSetKey:141

## js/74-look.js (82) — 
LOOK:17 lookPreset:27 lookMap:29 lookName:30 lookEnvFor:31 lookApply:41 lookRays:56 _lkV:61 lookRaysFrame:63 lookRefresh:70
§71 ลงทะเบียนในเครื่องมือปรับค่า (js/73-tune.js): 1 หมวด "🌗 Look" แยกส่ว…
LOOK_F:72 lookRegister:78

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

## js/77-dev.js (300) — Dev Mode: ทดสอบแมพ/สกิลในแมตช์จริง (ผู้ใช้ 2026-11-18)
DEV:5 devOn:9 devOff:10 devSoloOk:11 devHold:12 devBroomOk:13 dvMe:14 devSave:15
§16 hook จากโฮสต์: เรียกต้น hostTick (คืน dt ที่ปรับแล้ว • -1 = หยุดโลก)
devDt:17 devTick:22 devGod:31 devFreeze:32
§33 กล้องอิสระ
devFcToggle:34 devFcCam:41 devFcTop:47 devFcMe:51 devKey:68 devMount:79 DEV_BOTS:87 devStartMode:88
§101 Spectator (user 2026-11-20): watch a full bot match — host steps out,…
devSpecStart:104 devSpecRestore:120 devSpecStop:126 devSpecAim:128 devSpecKey:132 devCell:136 devCopyAim:137
§143 คำสั่งโฮสต์
devTp:144 devSgPhase:148 devBotAdd:159 devAct:168
§209 Destruction debug (user 2026-11-19): repair / collapse breakables at …
DEVD_R:212 devBrkFix:213 devBldFix:214 devPropFix:218 devSkinFix:219 devDestroy:224
§259 ภาพซ้อนไว้ดูแมพ: กล่องชน (OBS) + วงเขตยึด/จุดเกิดปลอดภัย
_dvCyl:260 _dvMat:261 devOverlay:262
§282 2D overlay map: spawn zones + capture zones + players (click = warp)
_dvMap:283 devMapDraw:287

## js/78-dev-ui.js (243) — Dev Mode UI (user 2026-11-20): one floating window, many small column…
§10 orbit camera
devOrbPick:11 devOrbToggle:23 devOrbCam:28
§42 video recording
REC:43 _dvBadge:44 devRecStart:45 devRecStop:60 devRecFrame:62 devRecSave:67 devRecAuto:83 devAutoTick:87
§94 window
_dvPanel:95 _dvBtn:98 _dvBody:100 _dvHead:100 devUiApply:102 devFreeMouse:110 devToggle:111 devF2:116 devGrave:121
§130 rows
dvA:131 dvTg:132 dvB:133 dvCh:134 dvSl:135 dvSub:136 dvCol:137 devKeyOf:138 devRender:143 devPos:193 devUiAct:200

(111 files, 32729 lines)
