# CODEMAP — where everything is (auto-generated: `node tools/codemap.js`, re-run after editing js/)
Game = `index.html` (HTML only + loader) + `css/game.css` + `js/NN-*.js`. The loader fetches the js files **in number order and joins them into ONE module** → every file sees every other file's top-level names (no import/export). Code that runs at load time may only use things from earlier files. New file = add its name to `FILES` in index.html.
Format: `name:line` = top-level function/const/let in that file. `§line title` = section header comment. Errors show `game.js:N` → `srcAt(N)` in the console gives file:line.

## js/01-core.js (64) — แกนกลาง: import Three.js + ฟังก์ชันพื้นฐาน ($ rnd clamp lerp store to…
FLAT_GEO:13 FLAT_ON:13 flatMark:14 MXC:23 INSTZ:38 instz:39 instzSync:44 instzTick:48 $:54 rnd:55 clamp:56 lerp:57 dist2:58 lerpAng:59 esc:60 shuffle:61 store:62 toastT:63 toast:64

## js/02-city.js (165) — เมืองมักเกิ้ล — กล่องเทา (designs/city-bot-battle.md ขั้น 3)
CITY_PLAN:6 CITY_ZN:11 CITY_PLAZA:12 genCity:13 cityProps:126
§138 เล่นได้ทุกโหมด (ขั้น 6): พื้นที่เล่นต่อโหมด (กำแพงล่องหน AREA) + จุดเ…
CITY_MID:140 CITY_C2:140 cityModeData:141 mapArea:157 AREA:158 areaClamp:160

## js/02-citytest.js (28) — แมพทดสอบเมืองใหญ่ (กล่องเทา) — ใช้วัดความลื่นของเครื่องยนต์ก่อนสร้างเ…
CITY_N:4 CITY_B:4 CITY_ROAD:4 genCityTest:5 cityTestProps:19

## js/02-data.js (400) — 
W:4 H:4 PR:4 PILLARS:6 SPAWNF:7 mulberry:9 genForest:10 genPitch:27 genHogsmeade:36
§54 แผนที่โล่ง 3 แบบ (ผู้ใช้: ป่ามืดไม่สนุก อยากได้ที่โล่งๆ)
genMeadow:55 genLake:61 genRuins:66
§73 Test Place (ห้องฝึก): พื้นโล่งไม่มีสิ่งกีดขวาง
TEST_W:75 TEST_H:75 TEST_C:75 TEST_VIL:75 TEST_GW:77 TEST_Z:78 TEST_ST:85 TEST_PH:86 testWalls:88 testDummySpots:90 testFences:92 genTest:105 testProps:120 trZone:133 trBotPad:134 trFixSpots:136 trShow:138 genGreatHall:139 MAPS:147 MAP_OFF:160 MAP_TEST:163 PLAYMAP:164 RANDOM_MAPS:165 MAPID:166 MW:166 MH:166 OBS:166 setMapVars:167
§168 แผนที่จากไฟล์ (Blender → assets/maps/<id>.json + .glb, สคริปต์ assets…
FMAPS:171 b64i16:172 regFileMap:173 loadMapData:196 loadAllMapData:204 mapReady:207 modeMap:208 mapOkFor:209
§210 ของประกอบฉากที่พังได้ / ใช้ได้ (prop)
PROPDEF:214 PROP_OFF_MODES:221 PROP_USE:223 PROPS:224 PROPON:224 genProps:225
§245 ตัวละคร: บ้านฮอกวอตส์ + หน้าตา
HOUSES:247 HAIRC:252 HAIRSTY:254 WOODC:257 WOODN:258 WCOREC:259 WCOREN:260 WANDSTY:261 WANDN:266 WANDNN:281 EYEC:282 SKINC:283 CLOAKC:284 TIESTY:285 GENDERN:286 LOOKK:287 LOOKN:287 lookStr:288 parseLook:289 randLook:290 LOOKS:291 LOOKP:291 KITS:291 getKit:292 getLook:293 CREST_SH:294 CREST_PAT:295 starPts:300 CREST_ANI:302 crestSVG:308 houseColor:316 TEAMC:317 TEAMN:317 NOBROOM:319 ROOM_MAX:321 MODES:322 hostModeEnabled:334 PLAY:336 PDEF:337 EDEF:364 POOLS:377 CDK:387 BUFFS:390 BRAR:399 rollRar:400

## js/02-fcs-data.js (3) — 
FCS_DATA:3

## js/02-fcs-rooms.js (100) — FCS room pieces (rule: guides/MAP-ROOMS.md — user 2026-11-20: every room/courtyard is a s…
FCS_ROOMS:11 fcsRoomAdd:12 FCS_C0:13 fcsRoomOf:14 fcsCut:15
§16 gen context (called from genFcs)
fcsRoomK:17 roomWall:27 roomCol:36 roomFloor:38 roomCeil:44 fcsCeilAt:46 fcsCeilClamp:54
§55 breakable room props (user 2026-11-20): BRK groups (js/12-buildings.j…
RPK:59 roomProp:67 roomsFromFile:77 roomsCur:89 RWH:91 roomWallEnv:92

## js/02-fcs.js (266) — 
FCS_C:7 FCS_WH:8 genFcs:9
§196 พื้นที่เล่นตามเฟส (กำแพงล่องหน) + เขตจุดเกิดปลอดภัย — ใช้ทั้งโฮสต์ (G…
SGPH:197 SGTR:197 SGLT:197 SG_SPR:198 sgFD:200 _sgAreaC:201 sgArea:202 _sgAreaT:209 sgAreaT:210 sgClamp:216 _sgAreaL:227 sgAreaL:228 sgInArea:233 sgAttach:236 sgFromFile:246

## js/02-room-greathall.js (105) — 


## js/03-spells-core.js (270) — 
SHIELD_OFF:2 REGEN:4 FROST_GUARD:7 FROST_SWAP_T:8 shieldAllowed:9 ICONS:17 ICOALIAS:18 hasIco:19 ICOBASE:21 icoURL:22 ICO:23 icoTint:24 icoHTML:33 PATHS:34 SPELL_LIST:43 SPELLS:43 defSpell:44 SLOTK:45 BRMAP:45 KITP:46 parseKit:47 cleanKit:64 setKit:65 pathReset:68
§70 สถานะ (ใช้ได้ทั้งผู้เล่นและศัตรู)
isBig:71 ccScale:73 ccTouch:74 addStun:75 addRoot:76 addFreeze:77 addSlow:82 addChill:83 ignite:88 FX_SHOCK_CYAN:96 FX_ONFIRE:96 shock:97 knock:102 addWard:103 addFrostSlow:105 frostSlow:106 moveMul:113 BRN_MAX:115 addBurn:116 addOnFire:118 addXBurn:119 addPoison:120 addSil:121 addFear:122 addBlind:123 addMark:124 healT:126 tickStatus:131 clearStatus:154 fxMask:155
§157 วัตถุในสนามที่คาถาสร้าง: โซน / ฟ้าผ่าหน่วงเวลา / กำแพง / ช่องร่ายต่อเ…
foesIn:158 SHIELD_BREAK_LOCK:166 shieldFaces:168 frostGuardFaces:169 shieldFacesRaw:170 aoeHit:180 addZone:187 updateZones:192 addStrike:203 updateStrikes:204 addWall:205 updateWalls:206 updateChan:217 updateSpells:221 surfH:226 aimPoint:230 aimWall:242
§244 ตัวช่วยคอมโบ (ทุกสายใช้หลักเดียวกัน: ตั้งต้น → ต่อยอด → ปิดจบ)
ROLE_N:246 takePoison:247
§249 ความสามารถพื้นฐาน (คลิกซ้าย) ของแต่ละสาย: สะสมสถานะตั้งต้นให้เองทุกๆ …
PBASIC:250

## js/04-frost-mech.js (143) — สายน้ำแข็ง: ประชิด/ไกล (V) • ฟันดาบ/ขวาน • ไถลน้ำแข็ง • พื้นน้ำแข็ง/ภ…
FROSTV:3 FROST_SWING3_HIT:9 frostContactTime:10 frostShieldPitch:11 frostBoom:16 meleeHit:23 mirrorPos:34 frostBasic:35 frostCutTick:57 frostSlam3:66 frostSlam:74 frostDash:80 addIce:85 updateIces:87 frostWavePitch:104 frostWaveSolid:107 updateWaves:113 _stN:131 OBS_STEP:131 groundH:132

## js/05-terrain.js (45) — พื้นสูงต่ำ (แผนที่จากไฟล์ Blender — กติกาฝั่งคนปั้นใน guides/MAP-DESI…
TERR:5 TSTEP:6 TSLOPE:6 terrT:7 floorAt:12 terrSolid:14 terrMove:21 updateGlaciers:30

## js/06-pyro.js (223) — สายไฟ: ยิงปกติ 2 โหมด / โล่ระเบิด / พุ่งชาร์จ
PYV:3 pyroBigBoom:11 pyroBall:19 pyroBasic:20 PHEAT:41 pyroHeatLv:42 pyroHeatGain:43 pyroHeatTick:44 pyroHeatDmg:45 pyroHeatSpd:46 addOrbs:47 pyroParry:48 pyroBlock:49 launchOrbs:51 pyroDash:58 pyroPathEnd:78 updateFirePaths:83 pyroKindleVolley:106 pyroKindleCurve:109 KINDLE:111 DRAGONF:113 dragonfallDive:122 dragonfallTick:123 dragonfallBoom:139 RINGE:144 BLAZEF:151 pyroBlazeAct:154 SNAP:155 COLOS:162 pyroNova:165 pyroSnap:170 colossusTick:183 updateERings:202

## js/07-frost-spells.js (34) — 
FROSTF:4 GREND:6 frostGlacier:11 PERMA:16 CRYO:18 FAURA:25 MIRROR:27 mirrorStart:30

## js/08-storm.js (339) — 
STORMV:6 stGain:10 stSpend:11 stormCone:13 stormLineFoes:18 stormBasic:22 stormTri:56 stormClawStrike:64 stormDash:69 stormDashTick:82 stormShieldBlast:99 stormTick:108 TLINE:126 stormLine:128
§138 สกิล 2 (1 stack): ดูดความเร็ว
SIPH:139 stormWaveShoot:141 stormWaveTargetLive:142 stormWaveMark:148 clearStormWaveMarks:159 updateStormWaveMarks:163 STPULSE:177 stormPulse:179
§187 สกิล 4 (1 stack): ออร์บสายฟ้าคู่ — ลอยหลังเรา Dash โดนศัตรู = ออร์บพุ…
SORBS:188 stormOrbLaunch:191 STMARK:199 stormAllyMarkAim:202 updateStormAllyMark:244
§257 อัลติ: ร่างเทพสายฟ้า 10 วิ
GODL:258
§260 ลูกสายฟ้าโดม: รวมไฟที่พื้น → ทะยานขึ้น → เล็ง → ฟาดไม้ยิงและค้างชี้เป…
stormDomeCost:261 stormDomeLaunch:262 stormDomeTick:271 stormDomeFire:291 stormDomeSlam:297 updateStorm:302

## js/09-darkness.js (480) — 
DARKP:2 DARK_V:6 DARK_BA:7 DARK_LONG_DASH:8 DARK_CHASE_FLOW:9 DARK_MAW:10 DARK_VEIL_PULL_CLEAR:11 DARK_NF:13 DARK_CHASE_T:14 DARK_LIFT:16 darkNFRoute:18 DARK_WALTZ_ORB:26 darkFlow:27 darkOrbImmune:28 darkAlive:36 darkReset:37 darkState:38 darkEvent:39 darkAim:42 darkTarget:49 darkCone:53 darkBAFloor:60 darkBATargets:64 darkMoveHeading:81 darkClearCooldown:84 darkMark:88 darkReveal:95 darkQueue:96 darkGainFlow:97 darkKill:103 darkTick:106 darkShieldTick:140 darkShieldCrossAt:157 darkShieldCross:166 darkBeamStop:167 darkDash:176 darkBasic:199 DARK_MARK:229 darkWaveTick:246 DARK_CHASE:271 darkMoveWaltz:323 DARK_WALTZ:348 DARK_WARD:370 DARK_VEIL:385 DARK_ULT:393 darkUltBite:408 darkMoveChase:418 darkSnap:458 darkMarked:477

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

## js/09-light.js (582) — 
LIGHTP:8 LTV:12 lgOn:19 lightShieldPitch:20 lightShieldGauge:21 lightClearBond:22 lightReset:26 lightAlly:32 lightLinkPos:33 lightUnlink:34 lightReleaseAlly:52 lightBondTarget:59 lightBondTap:79 lightRecall:94
§95 ทุกเฟรม
lightTick:96 lightSlotOf:113
§114 BA Prism Ray: กดค้าง = ลำแสง • 0 ชิ้น = ลำบางทะลุ 5/1 วิ • 1/2/3 ชิ้น…
lightBeamAng:115 lightBeamPitch:117 lightBeamLength:119 lightHeatTick:134 lightBeamHits:141 lightTapShot:148 lightBasic:157
§177 Dash Light Step: วาร์ป 250 ตามทิศเดิน • เล็งคู่หู (ไม่เกิน 900) = วาร…
lightStepBehind:178 lightDash:191 lightDmgOut:221 lightDmgIn:222 lightSnapP:223
§229 สกิล
lightSkillsTick:230 LIGHT_FORM_BASE:269 LIGHT_FORM_SCALE:270 LIGHT_FORM_PIVOT:271 LIGHT_FORM_PALM:272 LIGHT_FORM_PALM_DEPTH:272 LIGHT_FORM_HEART_Y:273 LIGHT_FORM_HEART_Z:273 lightFinishDrive:274 lightFinishPitch:275 lightFinishPush:276 lightFormAngles:277 lightFormRecoil:282 lightFormHand:286 LIGHT_FORM_ARMS:297 lightArmRest:306 _lightArmWork:307 lightArmPose:309 lightFormOpenPalm:337 lightArmAim:349 lightUltSnap:356 lightXGuard:365 lightHexAbsorb:368 lightUltEnd:373 _lightFormAngles:388 _lightFormTurn:388 _lightFormHand:388 _lightFormAimLocal:389 _lightFormUpLocal:389 lightUltOrigin:390 lightUltRay:407 lightUltBeamHit:414 lightUltFinish:429 lightUltTick:440 lightSanEnd:506 lightAimPt:507 LT_BOND:509 LT_VO:512 LT_EM:519 LT_SC:522 LT_VS_RELEASE:526 LT_VS_TRAVEL:526 LT_VS_S:527 LT_VS:530 LT_UL:533 lightAllyHit:553 lightQueueTick:556

## js/09-nature-ba.js (182) — 
NATURE_BA_TEST:2 NATURE_WHIP:3 natureWhipEnabled:4 NAT_SLAM:8 NAT_LINE:8 natureEmpNear:9 natureEmpHit:10 natureWhipHit:19 natureWhipBasic:42 NATURE_READY_YAW:66 NW_RINGS:67 NW_SIDES:67 nwCounterTurn:68 nwAimTurn:68 nwArmAim:68 nwRootAim:69 nwUp:69 nwPhase:70 nwEase:71 nwSwingAngle:72 nwRightRelease:78 natureWhipPose:81 natureWhipVisualMake:120 nwWandTipWorld:142 natureWhipWand:143 natureWhipView:163

## js/09-nature.js (480) — 
NATUREP:2 NAT:3 natureDist:5 natureItems:6 natureLive:7 naturePlants:8 natureY:9 natureHead:10 natureTreeReady:11 natureEmit:12 natureWallLocal:15 natureWallContains:21 natureWallPush:28 natureBurnWall:36 natureWallDamage:43 natureWallTick:48 natureTrace:57 natureSight:75 natureGround:76 natureAimPoint:82 naturePlace:89 naturePlant:97 natureCastPlant:107 natureLotusToggle:123 natureMovePlants:131 natureAimSpot:142 natureAimStart:143 natureAimDone:144 natureAimTick:148 natureWallBuild:159 natureCastWall:160 NAT_WALLS:167 natureWallUse:168 natureWallCharges:169 naturePoison:176 natureStatus:181 natureSpore:193 natureSendSpore:200 NAT_SHIELD_HIT:210 natureShield:211 natureHookCandidates:225 NAT_DASH:230 natureDashCharge:231 natureDash:232 natureHookMove:260 natureBall:295 natureBallTick:303 natureTree:322 natureTreeReach:327 natureGuardian:332 natureGuard:338 natureDamage:347 natureEnd:353 natureTurret:359 naturePeaSplash:392 NAT_TREE:399 natureTreeTick:400 natureUpdate:409 natureReset:443 natureSnapP:448 natureLotusCooldown:460 natureSnapW:465

## js/09-other-paths.js (177) — สายธรรมชาติ — ป้อมพืช แส้ และการคุ้มครองทีม
§12 สายคำสาป — ตรามรณะ: ตีตรา (ดาเมจ +25%) → คำสาปทุกชนิดแรงขึ้นกับคนมีตร…
§44 สัตว์เวท (minion): AI ฝั่งโฮสต์
MIND:45 summonMin:51 minTarget:60 minShoot:67 updateMins:72 aimTarget:112
§122 สายอัญเชิญ — สัตว์เวท: เรียกกองทัพ → วิญญาณเสริมพลัง → ระเบิดวิญญาณปิ…
SDOME:149
§159 ร่ายคาถา
castSlot:160 castUlt:177

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

## js/09-wind.js (602) — 
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
windFlyTick:322 windFastOn:334 windFastOff:337 windFocusEnd:340 windAirMove:342 windFlick:351 windFocusAct:357 windOrbLaunch:361 windOrbBoom:366
§369 Downburst (ผู้ใช้ 2026-11-08): ลมกดจากฟ้าลงพื้นต่อเนื่อง — วงดาเมจ + …
§370 Tailwind (เดิม Windblade): ร่องลมจากตัวเราไปตามทิศเล็ง — เพื่อน+ตัวเร…
windTailCast:371 windTailIn:374 windTailTick:375 windDownCast:380 windPressDown:387 windDownTick:390
§397 Windup (เดิม Aegis Gale): ลมพัดขึ้น — วางวงลมตรงจุดเล็ง รอ 0.45 วิ แล…
windUpCast:399 windUpTick:406
§413 Wind Push (เดิม Windrift): ยิงลมแรงไปทางที่เล็ก
§416 Plume Volley (ผู้ใช้ 2026-11-09): ขนนกนีออนจากสองปีกสลับกันทีละอันเร็…
windVolleyCast:417 windVolleyTick:418 windPlumeShoot:419 windFeatherBoom:429 windPlumeBoom:430 windPushCast:432 windPushHit:435
§441 Windforce (เดิม Vortex Bind): พุ่งด้วยลม
§444 Slipstream (ผู้ใช้ 2026-11-08): แดชหมุนหลบตามทิศเดิน • 2 ชาร์จ 5 วิ/อ…
windSlipCast:445 windSlipTick:450 windForceCast:451 windSmash:457 windAheadHit:461 windForceTick:467
§487 Windblade (เดิม Void Spheres): ใบมีดลมเล็ก ๆ รัว ๆ
windBladeCast:489 windBladeTick:491 windBladeHit:495
§501 อัลติ Sonic Boom Strike (เดิม Eye of Heaven)
windUltCast:505 windUltTick:508 windUltSweep:533 windFloatZ:541 windShieldPitch:544 windSnapP:548 windSnapW:549
§552 สกิล (ผู้ใช้ 2026-11-08: รีดีไซน์ทั้งชุด — id เดิมไว้ให้ชุดสกิล/tune/…
W_WL:554 W_DR:560 W_VX:566 W_VO:572 W_FW:578 W_UL:588

## js/10-net.js (210) — 
PREFIX:4 NET:5 RC:9 TURN_SERVERS:12 ICE:13 PEER_OPT:14 TURN_URL:16 ICE_READY:18 JN:22 LAG:24 lagDo:25 hostSend:26 LOBBY:27 genCode:28 sendAll:29 NETD_KEYS:33 NETD:33 netDeltaReset:34 netDelta:35 NET_MAX:49 _netTE:49 netSendSnap:50 NET_QMAX:70 NETU:72 netUndelta:73 setStatus:79 hostGame:81 hostPeer:90 netConnect:110 joinWatch:121 joinFail:136 netLost:142 joinGame:157 joinPeer:168 clientOnData:183 leave:198 leaveRoom:200

## js/11-host.js (496) — 
G:4 EVL:4 EVN:4 hostLast:4 tickN:4 emit:5 feed:6 banner:7 plist:8 cleanName:9 freshStats:11 newPlayer:18 emptyInput:21 frameOk:23 addPlayer:24 initHostLobby:33 lobbyMsg:40 broadcastLobby:41 INPN:43 hostOnData:44 hostDrop:76 hostRemove:85 validate:101 hostMapNext:117 hostStart:128 hostToLobby:153 MIDJOIN:160 modeCap:161 midJoin:162 CHATT:178 chatRelay:179 emoHost:187 resetBody:189 fmap:195 spawnPts:196 teamPts:198 spSpread:200 placeAll:201 respawn:213
§232 ลูปหลักฝั่งโฮสต์
hostTick:233 angDiff:250 cH:252 vR:253 updatePlayer:255 hitProp:483 damagePropsIn:490 nearUseProp:491 useProp:492

## js/12-buildings.js (454) — environment damage / rays / collision shared by breakable things
BLDON:4 bldMoundH:5 damageEnv:7 bldRay:16 aimClip:21 aimLineH:29 aimRay3:30 projEl:57 bldPush:62 updateBldg:68
§69 ของบังในแผนที่ไฟล์ที่พังได้ (หิน เสา รูปปั้น ต้นไม้ โคมไฟ ลัง ...) — …
BRKDEF:73 BRK_M:73 BRK_MCOL:73 BRK:74 genBrk:75 brkApply:82 brkStage:87 hitBrk:88 damageBrkIn:96 brkSnap:102 brkParse:103
§104 ตารางช่อง (spatial grid) สำหรับแมพใหญ่: หาเฉพาะของใกล้ ๆ แทนวนทุกชิ้น…
SG:107 OCX:110 OCY:110 obsD2:112 obsLo:113 obsRR:114 obsOut:116 obsEach:118 obsBox:119 sgObs:120 sgProps:120 sgGrid:121 sgNear:128 _sgCR:133 _sgCW:133 _sgCB:133 _sgCO:133 _sgPO:133 _sgPB:133 _sgPP:133 _sgM:133 _sgE:133 _sgA:133 _cwLast:135 collideWorld:136 shoot:177 eShoot:205 foesOf:212 breakShield:220 ULT_RATE:227 ultActive:228 gainUlt:229 lifesteal:230 impactProjectile:232 damage:233 playerDown:310 killProj:333 explode:345 hitTarget:357 hitProjectileTarget:361 updateProjectiles:378 projStep:386

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

## js/12-pnl.js (226) — Breakable panels (แผ่นพัง) — Map Builder pn_wall → data.pnl (guides/D…
PNDEF:13 PN_BODY:17 PN_CH:18 PNL:19 PNG:19 pnGT:20 sgPnl:21 _sgPN:22 _sgPN2:22 _sgPN3:22 pnlGen:23 pnTP:37 pnTopF:38 pnLoc:39 pnWorld:40 pnCU:41 pnL3:43 pnP3:45 pnCellPos:46 pnCellUW:47 pnSolid:48 pnMark:49 pnlLinks:51 pnlSupport:69 pnEmit:77 pnBreakAll:81 pnStage:82 pnlHit:84 pnDmgCell:98 pnHitFx:103 pnlEnv:105 pnSeg:115 pnlRay:122 pnlSolidAt:127 pnlProj:130 pnlCollide:136 pnPileCols:154 pnPileAt:158 pnlTopH:163 pnlMoundH:172 pnlTick:174 pnlSnap:180 pnlParse:185
§191 old houses → panel groups (same footprint as BLDDEF: walls wh m, gabl…
PN_HOUSE:194 pnHouse:195 pnlHouseConv:223

## js/13-enemies.js (171) — ศัตรู (โหมด Co-op)
spawnEnemy:2 setupWave:19 bossPhase:36 enemySlam:44 updateEnemies:55

## js/14-mode-rules.js (108) — กติกาของแต่ละโหมด
hostPick:2 clearField:10 modeLogic:11 endMatch:81 matchOver:108

## js/15-arena.js (71) — 
AR_SIDE:7 AR_TEAM:7 AR_MAX:7 arPads:8 arOn:9 arState:10 arBusy:11 arReady:13 arNames:21 arenaTick:22 arStart:43 arEnd:51 arReset:57 arAddBots:64

## js/15-bot.js (347) — 
BOT_LV:8 BOT_SKIP:16 botKit:17 botPersona:24 BOT_TEAM:25 BOT_MAX:25 bots:26 humans:27 botInZone:29 spawnBot:36 OWNED_K:50 clearOwned:51 removeBots:52 botPickTarget:54 BOT_PB:76 botPlay:77
§193 บอทยืนนิ่ง (ห้องฝึก): หุ่นผู้เล่น = ไม่ทำอะไร • บอทโชว์สกิล (ai.show)…
showName:194 showBot:195 stillBot:196 trShowCmd:211 aiBot:235 trBotCmd:311
§320 บอทในห้องรอ (ผู้ใช้ 2026-10-31 "สร้างห้องเล่นกับบอทได้")
BOT_MODES:324 lobbyBots:325 lobbyBotAdd:326 lobbyBotFill:335 lobbyBotCmd:340 lobbyBotsStart:345 botDebug:347

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

## js/15-siege.js (353) — 
SGV:14 SG_TEAM:28
§29 loot-phase items (designs/castle-gameplay-concept.md "ลำดับแมตช์ใหม่"…
SG_ITEMS:34 SG_ITEM_T:37 SG_CARRY:38 sgF:39 sgCore:40 sgZone:42 sgPolyBB:44 sgPolyIn:45 sgPolyD:46 sgZoneIn:48 sgInZone:49 sgZonePt:51 sgCapT:53 sgCapMul:54 sgCapBack:55 sgSpawn:56 sgInit:57 sgWallsApply:66 sgWallDmg:71 sgWallHit:77 sgWallEnv:78 sgStop:83 sgTick:84 sgCoreDown:126 sgPhaseGo:140
§148 loot phase (after core b = S.ph-1 fell, between the retreat and the n…
sgLootR:149 sgHasLoot:150 sgLootGo:151 sgLootEnd:159 sgItemsTick:164 sgEnd:176 sgResult:178 sgSnap:184 SGB:195 sgBotTarget:197
§207 team plan (user 2026-11-22: don't trickle in one by one)
SGT:210 sgTeamPlan:211 sgBotMode:232 sgBreachAim:246 sgBotGoal:253 sgBotIn:272 sgBotLoot:281 sgUnstick:293 sgBotThink:306

## js/16-voice.js (89) — 
VOICE:4 rosterIds:5 toggleMic:6 voiceSync:20 teamOn:37 teamOf:38 applyVoiceGates:39 VAC:49 onIncomingCall:50 voiceLevels:62 speakingIds:70 updateVoiceUI:76

## js/17-input.js (66) — 
INPUT:4 mouseX:5 mouseY:5 showBoard:5 SET_DEF:6 SET:7 KEYACT:9 KMAP:10 PMAP:10 SKORD:11 rebuildKeys:12 keyName:22 _rebind:24 MSANE:50 mouseSane:51 cvEl:66

## js/18-audio.js (315) — 
AC:4 MASTER:4 SFXBUS:4 REVERB:4 NB:4 WIND:4 TOOL_CTX:6 toolSoundOn:7 masterGain:8 toolSoundApply:9 sfxLast:11 ac:12 outNode:33 tone:48 noiz:54 snd:61 sfx:124
§126 ไฟล์เสียงจริง (โฟลเดอร์ audio/) — เริ่มโหลดเมื่อ ac() ถูกเรียกครั้งแร…
SFXN:128 SFXV:129 SFXR:130 SFXSYN:131 BUF:132 AUD:132 loadBuf:133 loadSfx:134 playBuf:139 AMB:147 ambKey:148 ambLoad:149 ambTick:150 MUSF:161 MUSF_VOL:162 STINGERS:162 musicEl:163 fadeMusic:171 stopFileMusic:175 isWin:176 wantTrack:184 mapTrack:193 audioPrefetch:195 fileMusicTick:201
§218 "เพลงของฉัน": เลือกไฟล์เพลงจากเครื่องตัวเอง เล่นแค่ในเครื่องนี้ (ไม่อ…
MY:219 myDB:220 mySave:221 myLoad:224 myDecodeReady:230 myPlay:231 myNext:243 myClear:244 myInfo:245 windUpdate:251
§265 เพลงประกอบ (สร้างสดตามแผนที่)
MUSIC:266 THEMES:267 padNote:272 musicTick:279 toggleMusic:308

## js/19-client.js (343) — 
cv:4 cx:4 DPR:5 SW:5 SH:5 resize:6 VIEW:12 screen:13 lastBuffKey:13 overShown:13 lastCount:13 PARTS:14 TEXTS:14
§15 งบเอฟเฟกต์ (VFX budget)
VFXB:20 combatFxParams:21 FULL_COMBAT_VFX:22 combatVfxReduced:23 _apush:24 vfxQual:33 vfxBegin:35 vfxEnd:39 vfxOnce:41 vfxExtra:43 PCOL:44 setScreen:46 onLobby:58
§64 ภาพของโฮสต์ลื่น (ผู้ใช้ 2026-10-31 "ขี่ไม้กวาด/กระโดด กล้องสั่น")
HVB:68 HBOLD:68 hbReset:69 hbPush:70 hbPair:73 onSnap:77 snapApply:81
§92 บัฟเฟอร์ snapshot (ลูกข่าย, ผู้ใช้ 2026-10-22 "เล่นออนไลน์ให้ลื่น")
SBUF:95 NETOLD:96 sbufReset:97 sbufPush:98 sbufAdvance:108
§120 ทำนายตัวเอง (ลูกข่าย): ตัวเราขยับทันทีที่กด ไม่ต้องรอโฮสต์ตอบ
PRED:123 predictMe:124 myPos:145
§147 เอฟเฟกต์
SMOKE_K:150 burst:151 smoke:164 ring:165 floatText:166 shake:167 weaponContactAge:168 weaponImpactAge:184 wandPos:189 impactFX:191 explosionFX:213
§225 เอฟเฟกต์คาถาใหม่
ZV:226 COLB:226 WVV:226 GLV:226 ICEV:226 SLV:226 ULTV:226 OBV:226 _iceDisc:228 _iceEdge:229 _iceSpk:230 iceFloorMat:231 _icePlane:232 _icePathMat:233 _iceWvM:233 iceWvMat:235 _iceShardGeo:248 _isM:251 _isQ:251 _isP:251 _isS:251 _isY:251 iceShardTrail:252 _iceShardMat:257 makeIceFloor:258 ICE_WV:293 updateIceFloors:294 FLASHM:306 FLASHING:307 flashModel:308 endFlash:321 tickFlash:322 GHOSTM:324 SOLIDM:324 ghostOf:325 setGhost:331 hitSparks:339

## js/20-vfx-pyro-storm.js (1046) — Dragonfall (ภาพ)
makeDfCircle:3 stormCircleCyan:21 DFV:26 dfCracks:27 updateDfCracks:37 _domeAim:38 domeChargeOrb:39 _spearUp:47 _spearDir:47 _spearA:47 _spearB:47 DOME_SPEAR_LEN:48 stormDomePath:49 stormDomeSpearFX:53 stormDomeHoverFX:84 stormDomeReadyFX:108 stormDomeGroundPoint:129 stormDomeFracture:132 stormDomeFloorPullFX:178 stormDomeFieldFX:205 SDOME_POSE:242 stormDomePose:243 dragonfallFX:307
§377 สายฟ้า (ภาพ)
TBN:380 TBA:380 TBF:380 TBMAX:380 _tv:381 _tt:381 _ts:381 _tw:381 tbFalloff:384 tbLayer:387 TBL:393 TBO_MAX:395 tbOrbLayer:396 TBC:399 _tcc:400 domeCyan:401 domeGold:402 tbGet:403 TBLUE:406 TBFIRE:406 tboltB:407 tbolt:408 tboltP:420 _tbW:423 _tbA:423 _tbC:423 _tbS:423 _tbF:423 tbWrite4:424 tbSet:432 updateBolts:433 LATER:464 STV:464 SBV:464 SDV:464 TSV:464 CLV:464 stTgPos:466 STCLAW:470
§474 รอยกรงเล็บ (อัลติสายฟ้า): รอยข่วน 3 เส้นโค้งปลายแหลมขนานกัน ตั้งขวางห…
clawGeo:477 clawRakes:482 updateClaws:496 later:504 stFade:505 stBeam:506 STHIT:512 STBASH:512 stBashLean:514 shellPt:521 stormReworkField:522 stormAllyBranchFx:550 updateStormV:568 _ev:616 GODPTS:618 bWorld:620 stormClawStop:624 CLAWFX:630 stormClawRangeFX:631 updateClawFX:661 stormClawSwipe:674 stormAllyMarkTexture:722 stormAllyMarkGlyph:734 STBEAM:749 stormFX:750 STHUD:914 drawStormHud:915
§962 Storm round 2 (user 2026-11-28): Thunderbomb charge/burst, Storm Dome…
STORM_BOMB_CAM:963 stShellMat:964 stBranches:970 STRING:979 stRing:980 stRingTick:984 STSHELL:987 stShell:988 stShellTick:994 stormPulseCharge:999 stormPulseBurst:1011 stormDomeAim:1019 stormDomeMuzzle:1026 stormMarkArea:1035

## js/21-vfx-frost.js (228) — น้ำแข็ง (ภาพ): ชิ้นผลึก/หนาม/แผ่นน้ำแข็งชั่วคราว (โผล่ → ค้าง → หด) •…
FRV:2 _cryG:3 _spkG:3 _plateG:3 _hexG:3 _iceFxM:4 _frostM:4 iceFxM:5 frostM:6 ICEP:8 _im4:8 _iq:8 _ie:8 _ip:8 _is:8 icePool:9 iceBit:10 iceChips:13 updateFRV:14 iceRing:24 chillFX:25 makeSlash:41 _wbGeo:49 crescentGeo:51 makeWaveBlade:54 WGH:68 updateSlashes:69 _glGeo:82 _glMat:82 _glMat2:82 makeGlacier:83 updateGlacierVis:114 updateOrbShots:123
§133 คลื่นดาบน้ำแข็ง (ผู้ใช้ 2026-11-11): เส้นเสี้ยวบางคม ขอบหน้าขาว หางเป…
_fsl:135 FSL:135 frostSlashGeo:136 frostSlashGet:141 frostSlashPut:151 updateZV:152 WM3:228

## js/22-models.js (366) — โมเดลจากไฟล์ (.glb จาก Blender) — ข้อตกลงฝั่งคนปั้นอยู่ใน guides/ASSE…
MODELS:5 modelManifest:6 gltfLoader:11 loadModel:16 modelInst:31 modelOr:32 prefetchModels:44
§46 Animation จากไฟล์ (Blender Actions) + โมเดลตัวละคร/ศัตรูจากไฟล์
ANIM_ALT:49 makeAnimator:50 animResolve:55 animPlay:56 _animN:66 animLod:67 animTick:68 lookTint:88 tintModel:92 shareSkinSkeletons:107 batchStudentSkin:115 _palPx:134 palPixels:135 _s2l:138 mergeStudent:139 _matTw:174 matTwin:175 useFileModel:179 rigStage:205 fileVariants:207 GDX:210 gdParts:211 lookGender:220 fileBroom:229 _rq:233 _rq2:233 _rq3:233 rigBind:234 rigStd:245 rigSync:246 FILE_MODELS:259
§261 VFX จากไฟล์ (รายละเอียดฝั่งคนทำอยู่ใน guides/ASSETS.md)
VFXL:267 FLIPL:267 FLIPS:267 prefetchFx:268 playVfx:269 vfxSeq:315 flipTex:320 playFlip:328 fileFx:343 zoneFx:350 clearVfx:351 updateVfx:352

## js/23-props-bld-view.js (276) — prop ฝั่งแสดงผล
PROP_BATCH_TYPES:2 PROPV:3 propFallback:5 farCull:34 PROP_BATCH_SRC:35 _propMatrix:35 propBatchSource:36 propBatchMesh:51 propBatchWrite:58 propBatchAdd:62 propBatchRemove:74 syncProps:79
§122 flying debris (city towers / props): chunks fall, bounce, then rest a…
CHARM:124 DEBRIS:124 _bldIce:125 charMat:126 bldIceMat:130 updateDebris:132 debrisDrop:147 debrisCap:149 clearDebris:150 drawPropHint:151 syncWalls:159
§177 ของบังในแผนที่ไฟล์ที่พังได้ ฝั่งแสดงผล (สถานะจาก BRK[].st — host js/1…
BRKV:180 BRK_COL:180 brkSetup:181 BRK_CM:200 brkCrackMat:201 brkClip:217 brkYc:232 brkStump:234 brkSync:244 BRK_ZERO:265 brkFall:267

## js/24-minions-view.js (68) — สัตว์เวท: โมเดลโปร่งแสง + ซิงก์จาก snapshot (MN)
MM3:2 makeMinion:3 syncMins:36 drawMinBars:58

## js/25-efx.js (419) — efxFX: ภาพของ event "efx" ทุกคาถา (หนึ่ง case ต่อหนึ่งเอฟเฟกต์)
efxState:4 efxFX:21 an:42 rr:42

## js/26-fx-events.js (283) — fx(ev): เอฟเฟกต์+เสียงของทุก event จากโฮสต์ • statusFX (สถานะบนตัว) •…
onfOutlineMat:4 onFireFX:6 statusFX:17 fx:44
§251 overlay: เลือกบัฟ / สรุปผล
choosePick:252 syncOverlays:257 showOver:278

## js/27-world.js (651) — 
S3:4 tx:4 tz:4 CITY_KERB:7 cityKerb:8 GY:9 TW:9 hdr:10 PTG:15 gl:23
§37 เงานุ่มแบบ PCSS (contact-hardening): ใกล้จุดสัมผัสคม ไกลจากวัตถุที่บั…
PCSS:40 scene:73 cam:75 composer:76
§77 ท่อภาพ (post-processing): ฉาก → ชั้นเอฟเฟกต์นุ่ม (FXPass) → แสงฟุ้ง →…
rpass:80 fxScene:82 SOFTU:84 SOFT_GLSL:85 FXMATS:87 fxMat:88 softify:90 HAZE_U:95 AOU:99 GFX:105 AO_ON:106 AO_HEAD:107 AO_CALC:111
§125 Wet ground + reflections (rain, js/76-weather.js) — pixels whose dept…
WETU:128 WET_GLSL:130 WET_MAIN:138 AO_COPY:157
§179 TAA (ลบขอบหยักแบบสะสมหลายเฟรม) — กราฟิกสูงเท่านั้น • ปิดด้วย ?notaa
TAA:182 TAA_FRAG:183 _taaH:198 taaWanted:199 taaBegin:200 taaEnd:208 taaFinish:209 taaQuad:211 taaWarm:214 taaResolve:216 AO_RT:225 fxPass:250 bloom:251 GRADEU:258 gradePass:279 aaPass:297
§299 คุณภาพกราฟิก: auto = ปรับความละเอียดเองตาม FPS / high = สวยสุด / low …
GQ_OPT:302 GQ_PRE:326 GQ_NAME:333 GQ:334 gq:337 gqSave:338 gqPreset:339 gqSet:340 gqMode:343 gqSync:344 QUAL:345 QUAL_NAME:347 qDyn:348 qualPR:349 gqShadowSize:354 applyQuality:355 qualTick:381
§397 ประหยัด CPU สำหรับเครื่องอ่อน (ผู้ใช้ 2026-11-06 "เครื่องผู้เล่นแย่กว…
qualCS:401 CULL:402 cullTick:403 texCanvas:414 glowTex:415 stoneTex:416 runeTex:422 glowMats:430 glowMat:431 STONEM:433 stoneMat:434 shadowAll:435
§438 clear midday sky (user refs 2026-11-24: anime key-art noon) — baked O…
SKYC:443 skyBakeClear:445 skyBake:532 SKY:537 hemi:569 moonL:571 LDIR:575 setSky:576 SKYB:592 skyFollow:593
§594 เงาตามผู้เล่น
SHD:598 _shF:599 _shR:599 _shU:599 _shC:599 _shY:599 SHD_DM:603 shadowDepthSplit:604 shadowFollow:609 shadowSoft:629 LPOOL:631 MLS_N:637 MLS:637 mlsPoint:639 _mlsP:641 mlsInScene:642 mlsTick:643

## js/28-city-build.js (386) — เมืองมักเกิ้ล (ลอนดอน) — ภาพ • ข้อมูลอยู่ js/02-city.js • โมเดลจาก as…
CITY_WIN:4 cityWinTex:5 cityEmTex:10 cityBoxGeo:16 buildCity:21
§102 ข้างในตึกกลวง (ภาพ — ผัง I จาก cityInterior js/12-city-dmg)
cityInteriorView:106 cityHideIn:147 cityMoundView:153
§176 ชุดโมเดลลอนดอน (assets/city/*.glb จาก assets/src/city_kit_build.py)
CITY_STY:181 CITY_VEH:188 cityFacade:190 CITYK:203 _cZ:204 _cT:204 _cR:204 _cC:204 cityKitLoad:205 cityCull:227 citySet:233 cityTint:235 cityPools:237 cityShowBld:243 cityRubble:250 CITY_FALL:258
§259 ตึกไฮไลต์ล้มทั้งตึก (ขั้น 7)
_ctA:262 _ctB:262 _ctC:262 cityTowerPose:263 cityTowerAnim:271 cityTowerRubble:278 CAREA:292 cityAreaSync:293 cityViewSync:305 cityDebris:349 cityFX:358

## js/28-fcs-build.js (434) — 
buildFcs:5 fcsBridge:41 fcsRubbleMat:64 fcsCore:79 FCSB:105 fcsParView:106 FSH_V:120 FSH_B:121 fcsShellMat:123 fcsBlocks:138 fcsShellBuild:150 fcsParFall:165 fcsFallTick:172 fcsShellView:184 FPILE:192 _rfP:194 _rfQ:194 _rfS:194 fcsFadeList:195 fcsRubbleFade:200 fcsShellFall:204 fcsPileTick:213 fcsShellClear:231 EFS3:234 fcsFences:235 _efC:252 _efM:252 _efS:252 _efZ:252 efsView:253
§279 ภาพโหมด (ลูกข่ายทุกเครื่องจาก snapshot M.sg)
SGV3:280 sgClearView:281 sgFileBuild:284 sgViewBuild:290 sgZoneMesh:311 sgBarrier:327 sgSync:341 sgLootSync:364 sgDust:385 sgFx:386
§392 HUD
sgTop:393 sgLootHud:396 sgHud:404

## js/28-fcs-castle.js (433) — 
FCSC:9 fcsCastleMat:10 fcsBannerTex:34 fcsGlowTex:44 fcsCastle:46 fcsCastleDressing:154 fcsCastleTick:175
§178 room pieces: look (js/02-room-*.js view(K,V)) — V = shared builder, m…
fcsRoomsView:179 DK_TEX:182 DK_GLSL:186 DK_FRAG:197 DK_SHAPE:257 DK_MATS:258 dkMat:259 dkUV:271 dkTri:273 dkBox:278 dkRev:280 dkGeo:281 dkRoad:307 fcsDecoFile:330 fcsDecoKit:346 MB_STYLE:390 _poOn:391 fileStyleScene:392 TORCH_BATCH:405 fcsTorchSync:406

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

## js/28-maps-build.js (851) — สร้างแผนที่
CANDLESYS:2 builtMap:3 builtKey:3 world:3 TORCHES:3 CANDLES:3 FIREFLIES:3 CRYSTAL:3 RUNE:3 SNITCH:3 BANNERS:3 SNOW:3 WCACHE:5 WCACHE_MAX:5 wkey:7 buildWorld:8 addW:48 _prewarmed:50 prewarmShaders:51 batchStatic:70 makeCandles:95 updateCandles:104 buildCastle:113 buildHogsmeade:179 buildGreatHall:254 buildForest:324
§421 ทุ่งหญ้าฮอกวอตส์ (เย็น)
ringTrees:422 grassTex:431 buildMeadow:432
§451 ทะเลสาบน้ำแข็ง (กลางคืน)
buildLake:452
§473 ซากลานประลอง (เย็น ทราย)
§474 Test Place (ห้องฝึก): พื้นตารางเรียบๆ กลางวัน + วงโซนเสกมอนสเตอร์
§475 บรรยากาศที่ใช้ร่วมกัน (แผนที่จากโค้ด + แผนที่จากไฟล์ผ่าน fx ใน guides…
makeSnow:476 makeFireflies:483 makeSnitch:490 fileMapFx:497
§507 แผนที่จากไฟล์ Blender (guides/MAP-DESIGN.md)
terrGeo:509 buildFileMap:517 fileMapLight:523
§540 Phase layers (Map Builder "Phase Layer", user 2026-11-25)
PHL:543 PHK:543 PHGD:543 PHGG:543 phOf:544 phLayers:545 phTick:546 fileMapBody:555 replaceMeadowTufts:600 tickM:642 TRPAD:643 ARPAD:643 SHPAD:643 signTex:644 testSign:645 buildTest:652 buildRuins:757 buildPitch:782

## js/28-pnl-build.js (327) — Breakable panels — view (state = PNL in js/12-pnl.js)
PNV:7 PN_BATCH:8 PN_MI:9 PN_GLSL:10 pnlMat:66 PN_RUB:138 PN_HEAP:139 pnlCls:146 PN_ZU:155 pnlGeo:156 pnlBuild:240 pnlBatch:266 pnlBatSet:288 pnlSyncOne:293 pnlView:316 pnlFX:319

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

## js/31-camera.js (284) — กล้องมุมหลังไหล่ (แบบ Hogwarts Legacy)
yaw:2 pitch:2 lastPh:2 locked:2 CAMRS:3 SENS:4 saveSet:5 applySettings:6 camPos:15 camLook:15 overlayOpen:18 showPause:19 hidePause:20 MAPCAM:21 PLACE:23 placeKey:24 PLN:33 PLR:33 placeGeos:34 updatePlaceGhost:42 _aimD:66 rayTerr:68 aimFromCrosshair:74 AIMZ:107 WBY:107 CAM_FRAMES:111 CAM_FRAME:129 CAM_TRACK:129 _camFocus:130 _camAnchor:130 _camWant:130 cameraFrame:131 camRoomK:164 _camOB:176 camObsK:177 combatCam:188 combatCameraImpact:189 combatCameraCharge:193 combatCameraFrame:205 updateCamera:218 menuCamera:280

## js/32-stage.js (319) — เวทีเมนู/ล็อบบี้: ห้องโถงมืด แท่นวงเวททอง เทียนลอย (ฉากแยกจากแผนที่)
stage:2 STAGE:5 STAGE_Y:6 stageSpots:58 stageChar:74 POSES:81 stageIdle:87
§109 เอฟเฟกต์หน้าเมนู (โชว์เฉพาะหน้าแรก ไม่โชว์ในล็อบบี้/หน้าสร้างตัวละคร)…
stageMenuFx:135 _sv:146
§147 ฉากประจำบ้าน (โผล่ตอนเลือกบ้านในหน้าสร้างตัวละคร)
CRESTTEX:148 crestTex:149 crestBanner:157 buildHouseEnvs:165 TONE0:213 _tc:214 stageTone:215 stageScreen:228 renderStage:229 drawStageLabels:290

## js/33-pyro-view.js (383) — ภาพของสายไฟ (pyroFX: ชาร์จ/พุ่ง/ดีดนิ้ว/กลายร่าง/Dragonfall/Colossus)…
§2 sync ตัวละคร/ศัตรู/ลูกเวท กับ snapshot
localVel:3
§11 ภาพของสายไฟ: ชาร์จลูกไฟ / ย่อตัวชาร์จพุ่ง / วงเวทพ่นไฟ / ดีดนิ้ว / กล…
_pw:12 simOf:13 makeColossus:14 makeMagicCircle:67 _fsGeo:77 fireShieldFX:79 KINDLE_AIM:104 pyroFX:105 NOVAD:313 _novaGeo:313 novaDome:314 updateNovaDomes:319 frostMlCast:323 pyroNovaCharge:343 pyFire:359 pyTip:360 BLZV:363 blzOutlineMat:364 blzOutline:366 blazeLinks:371 blazeVignette:380

## js/34-frost-view.js (400) — 
frGuardMat:2
§9 ภาพของสายน้ำแข็ง: ดาบ/ขวานน้ำแข็งที่ปลายไม้ ท่าฟัน โล่อัศวิน ไถล แช่แ…
iceMat:10 iceRim:11 makeIceSword:12 makeIceAxe:31 makeKiteShield:47
§59 อาวุธน้ำแข็งลอย (ผู้ใช้ 2026-10-22: "ร่ายคาถาให้ดาบฟันเอง ระยะเท่าเดิ…
makeIceCrown:63 frostCrown:68 FW_MID:74 FSW:76 _fsV:78 _fsW:78 _fsC:78 _fsD:78 _fsEase:79 frostSwapPose:81 fsShards:101 frostSwapLate:106 FWS:127 FWA:127 _fwM:128 _fwM2:128 _fwX:128 _fwY:128 _fwZ:128 _fwP:128 _fwS:128 _fwQ:128 _eo:129 _ei:129 _ss:129 fwAim:131 fwWeapons:132 FWP:134 FWT:134 fwChop:135 fwSweep:136 FF_RISE:137 fwIdle:138 fwSwing:141 FWL_N:153 fwLink:154 fwMat:157 SLIDE_POSE:160 _slQ:162 frostSlideHead:163 _slAx:169 frostWandLink:170 frostFX:178

## js/35-sync.js (1400) — ซิงก์ผู้เล่น/ศัตรู/ลูกเวทจาก snapshot + ฉายตำแหน่งลงจอ (ป้ายชื่อ/ตัวเ…
§2 ท่าร่ายคาถาแบบนักเวทในหนัง Harry Potter (ผู้ใช้ 2026-10-22: "ยิงปกติท…
CPOSE_T:7 _ce:7 _cs:7 _cb:7 _caJ:9 _caJ0:9 CTWIST:12 counterArm:13 AMP_B:14 AMP_S:14 CP_BEND:15 CPOSE:17 _cpT:26 _cpR:26 CP_STEP:27 CPCOL:28 castStyle:29 castStart:30
§31 ท่าร่ายสกิล / อัลติ / โล่ (ผู้ใช้ 2026-10-22: "เกือบทุกสกิลควรมีการเห…
CANIM:36 SKFEET:92 SKANIM:94 skAnim:102
§103 Storm skill animations, 3 to pick per skill (user 2026-11-25): bigger…
STORM_ANIM_V:121 STORM_ANIM_PICK:152 _caT:153 _caR:153 skillPose:154 _g2:195 wandTwoHand:196 characterPoseMix:203 characterStance:204 JUMP_LEGS:211 jumpLegPose:220 jumpCloakTurn:256 jumpCloakEuler:256 jumpCloakPose:257 readyBaseR:276 readyBaseL:276 castBaseR:277 castBaseL:277 jumpElbowPivot:278 clearJumpArms:279 jumpArmPose:285 _caEQ:294 _caEX:294 caElbowL:295 _caRQ:300 caElbowR:301 HEAD_DOWN:311 readyHeadTurn:312 readyHeadParent:312 readyHeadEuler:312 readyHeadPose:313 readyAllowed:329
§334 Class stances (designs/class-stances.md, user 2026-11-24)
STANCE_STYLE:341 STANCES:342 STANCE_PICK:371 stanceOf:372 _stQ:373 _stX:373 _stZ:373 stanceSpine:375 stanceSpineOff:379 STANCE_WAND:381 stanceWand:382 _swA:394 _swB:394 _swD:394 _swQ:394 _swQ2:394 _swP:394 _swE:397 _swH:397 stanceWandTip:398 _stV:414 _stV2:414 _stV3:414
§415 Class look (always-on small VFX that tell the class, STANCES[..].fx)
stBone:417 stLoc:418 stArmPt:419 ST_TEX:422 stTex:423 ST_MAT:431 stMat:432 stMatNew:436 stRibbon:450 stRibbonSet:452 FIRE_TONGUES:453 ST_ARC:456 _stArG:459 stArcBatch:461 stArcWrite:482 stArcFinish:492
§500 Storm gold hands (user 2026-11-25)
ST_GOLD:502 _stGT:503 stGoldMat:507 _sgGA:509 _sgGB:509 _sgGC:509 _sgY:509 stTube:510 stormGold:511 _stArA:537 _stArB:537 _stArC:537 _stArD:537 _stArE:537 ST_GEO:538 stBuild:540 _stF:576 _stH:576 stCyc:577 stanceFX:578 classStance:701 natureReadyEuler:723 natureReadyArm:723 readyStance:724 jumpShoulders:767 CBLOCK:783 CBLOCK_PATH:784 blockPose:785 poseMirror:793 castPose:798 lateSkillPose:804 castPose0:805 clearCharacterCast:834 hitRecoilPose:839 syncPlayers:848 syncEnemies:1041 projGeo:1081 tailGeo:1082 _t1:1083 makeProj:1084 _a:1105 _b:1105 PJFX:1107 syncProj:1108 _awT:1209 animateWorld:1210
§1251 ฉายตำแหน่ง 3D ลงจอ (ป้ายชื่อ / ตัวเลขดาเมจ)
_v:1252 toScreen:1253 BURNC:1261 burnNum:1262 NAMETAG:1276 nameTag:1277 _hsO:1283 _hsQ:1283 _hsLo:1283 _hsHi:1283 hudSight:1284 SIGHT:1298 sightA:1299 drawLabels:1303 TEXTAG:1338 textTag:1339 drawTexts:1343 HITM:1355 DIRI:1355 drawXh:1357 drawCrosshair:1367

## js/36-modes-view.js (171) — 
ROLE:4 KC:4 roleShowT:4 onPriv:5 MO:10 BREATHS:11 clearModeObjs:12 ITEMC:21 healTex:22 makeItem:23 syncModeObjs:39
§140 หน้าประชุมโหวต (หาลอร์ดโวลเดอมอร์)
meetKey:141 myVoted:141 castVote:142 syncMeeting:148

## js/37-render-loop.js (133) — ลูปเรนเดอร์
lastFrame:2 HSTOP:5 hitStop:6 FXSTUDIO:8
§9 เก็บ shader ที่ compile แล้วไว้ตลอดเกม (ผู้ใช้ 2026-11-02 "เล่นกับบอท…
PINMAX:13 PINNED:13 KEEPSRC:16 pinPrograms:22 frame:25 _fpsAcc:42 _fpsN:42 _fpsLast:42 render:43 detailCull:90 viewDetailAt:93 renderGame:100

## js/38-hud.js (503) — 
hudPips:2 hudArc:6 drawReticleTimer:8
§17 HUD
rr:18 SLOTS:19 fmtTime:20
§21 ชิ้นส่วน HUD ธีมทอง-น้ำเงิน
HG:22 HG2:22 HUDF:24 hudTick:26 readyPulse:28 diaPath:30 plate:32 frameBox:38 bossTrail:46 drawBossBar:47 spellDia:67 thinBar:96 drawHUD:101 raceRankClient:194 drawModeHUD:198 MM:236 MMB:237 _mmO:237 drawMinimap:238 slotKey:316 mySlots:317 STATUS_ICO:326 SLOTS_IMP:327 BR_LOCK:328 CLUSTER:330 E_NEEDSTAND:331 slotState:332 drawBottom:356 drawBoard:371 FHUD:396 FHTEX:397 fhFrame:398 FH_EDGE:401 FH_CORE:401 fhMix:402 FHC:404 fhLayer:405 drawFireHeat:408 SNAPB:492 snapBanner:493 drawSnapBanner:494

## js/39-menu.js (355) — 
myLook:5 myColor:5 myKit:5 myName:6 renderMyHouse:9
§11 หน้าสร้าง/แต่งตัวละคร (ผู้ใช้ 2026-11-24: แบบรูปภาพ — เลือกเพศด้านบน,…
crLib:13 crSaved:13 crKitSaved:13 crOpen:13 crStep:13 crTab:13 crFirst:13 crKitOnly:13 crSlot:13 CRI:14 CRTABS:15 crWandTab:21 sw_:22 bt_:23 nameBox_:24
§25 รูปตัวอย่าง: เรนเดอร์โมเดลจริงด้วย WebGLRenderer เล็กแยกหนึ่งตัว → da…
CRT:26 crtSetup:27 crtDrop:37 _ctv:38 crtShot:39 crtImg:59 crtPump:64 crVar:73 crGdHair:74 tile_:75 grid_:79 crPanelSet:80 crRenderGender:86 crRenderStep1:89
§106 ขั้น 3: สาย + ชุดคาถา
ROLE_COL:107 roleTag:108 DESIGNED:109 spellTags:110 spellDescHTML:117 baseDescHTML:121 SB_THEME:129 ROLE_ORDER:138 sbFxRun:139 sbFxT:139 sbParts:139 crRenderKit:140 sbStartFx:169 sbFxTick:170 sbBurst:197 crAssign:203 crRenderHouse:212 crGo:219 crSaveName:231 crSetHouse:232 openCreator:233 closeCreator:242 lobbyKitSend:249
§286 ฉากเปิด (#intro) + ประกายบนหน้าเมนู (#menuFx)
TITLE:289 titleSpark:290 TSPR:292 titleSprite:293 titleDraw:294 titleLoop:304 titleGo:315 JOINQ:328 ovResult:348

## js/40-train-settings.js (265) — เมนูทดลอง (ห้องฝึก / Test Place)
trOpenF:2 trKey:2 trN:2 TR_OPTS:3 trToggle:4 trSend:9 trSync:14
§52 แท่นเสกบอท (โซนเสกบอท ห้องฝึก, trBotPad js/02): ยืนบนแท่น = เมนูขึ้น …
bpOpen:53 bpOn:53 bpKey:53 bpShow:55 bpSync:57 hovEl:127
§128 หน้าตั้งค่า
setRow:129 setTog:130 setTab:131 XHC:132 XHN:132 setOpts:133 SET_ICO:135 SET_EN:138 gfxPanel:141 renderSettings:148 drawXhPrev:171 openSettings:172 closeSettings:174 modeIcon:230 modeTitle:231 renderLobby:232

## js/41-debug.js (223) — 
botBrain:6 _obsKeep:50 balArena:51 _balStash:54 balIsolate:55 balReset:58 balDuel:64 balTour:80 balTeamReset:95 balTeam:104 balCoop:132 balSpellTest:148
§171 Service Worker (sw.js): เก็บไฟล์เกมไว้ในเครื่อง เปิดครั้งต่อไปเร็วขึ้…
SWK:172 swSetup:173
§192 เช็คการ์ดจอตอนเปิดเกม
GPUC:195 gpuCheck:196

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

## js/44-vfx-kit.js (419) — 
§8 1) หางแสง
TRMAX:11 TRPTS:11 TRAILS:11 _trL:12 trailLayer:13 trailNew:22 trailPoint:25 trailStop:28 _tv1:29 _tv2:29 _tv3:29 updateTrails:30
§53 2) สูตรเอฟเฟกต์ = จานสี (ธาตุ) × แม่แบบ (ขนาด/ชนิด)
VFXPAL:57 VFXTPL:74 VFXSIG:86 VFXSIGK:94 VFXR:96 _palCache:99 palOf:100 _pc:103
§104 VFX level of detail (user 2026-11-24 "6v6 FPS drops a lot", guides/OP…
VLOD:108 vlodPrep:110 vlod:113 playFx:116 nearMe:126 fxLayer:127
§159 3) ผูกเอฟเฟกต์ซ้อนชั้นกับเหตุการณ์ของทุกสาย (เพิ่มทับของเดิม ไม่ลบหน้…
EFXAUG:161 PJPAL:180 pjPal:182 ULTCOL:183 efxAug:184 VFXAUG_ON:191 fxAug:192
§213 3b) สนามรบ (designs/battlefield.md ขั้น 1, แบบ C): ทุกสกิลทิ้งควัน/ฝุ…
BF_EL:216 BF_CLS:216 BF_EXTRA:218 BF:221 BF_SKIP:222 bfAfter:223 bfPlay:247
§251 3c) สนามรบ ขั้น 2: รอยค้างบนพื้น + ซากรก ๆ (หายเองหลัง BF_LIFE วิ, เด…
BF_LIFE:255 BFM:256 BF_MK:257 BF_MKA:257 BF_MKR:257 bfMarkMesh:258 _bfQ:266 _bfQ2:266 _bfN:266 _bfUp:266 _bfS:266 _bfP:266 _bfMx:266 bfMark:268 bfAge:277 updateBfMarks:290 BFRS:295 bfRestPool:296 bfRestAdd:301 bfBinAdd:308 bfBinBuild:312 bfRest:317 bfScatter:323 _rockMat:331 bfCollapse:333 updateBfRest:340 bfClear:347
§351 3d) สนามรบ ขั้น 5: บรรยากาศตามความพังรอบตัว (designs/battlefield.md)
BFA:355 bfWreck:356 updateBfAir:361 bfRumble:384 updateBf:387
§390 4) เอฟเฟกต์ทั้งจอ (ค่าไปที่ GradePass ใน js/27-world.js)
SCR:391 impactFrame:394 screenFlash:395 screenRadial:396 screenKick:397 screenHurt:398 _scv:399 updateScreenFx:400 updateVfxKit:419

## js/45-fx-runtime.js (434) — 
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
§116 สร้างชั้น
fxN:117 VLOD_N:118 fxSpawn:119 fxTick:153 fxEnd:164
§171 อนุภาค
_fxrnd:172 fxUnit:173 fxCone:174 fxEmit:176 fxPart:193
§208 รูปทรง 3D
FXGEO:209 fxMerge:210 fxRibbon:215 fxGeo:221 fxEnergyMat:241 fxWaterMat:256 fxToonWaterMat:269 fxWindShellMat:285 fxToonMat:294 fxArmorMat:304 fxArmorLines:315 fxMeshMake:332 fxMeshTick:356 fxFlipTex:371
§376 หางแสง / รอยฟัน
fxTrailTick:377
§383 สายฟ้า
fxBolt:384
§390 ฟังก์ชันในโค้ดที่ไฟล์เรียกได้ (ชั้น t:"code")
FXCODE:391
§404 ผูกกับ event ของเกม (assets/fx/bind.json) — เรียกจาก fx(ev)
fxLoopName:406 blzFxName:407 fxLoopKeep:408 fshHitFx:410 fxBind:413
§424 แม่แบบ playFx เป็นไฟล์ (assets/fx/tpl/*, sig/*, rec/*)
fxTpl:426

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

## js/49-cloth.js (300) — 
CLOTH:10 CLOTH_LITE:28 CL_ROWS:29 CL_NC:29 CL_GAP:29 CL_IN:29 _clV:30 _clA:30 _clB:30 clPinK:32 clBind:34 cloakPanelGrid:36 cloakBodyIndices:50 stormCape:59 clothSetup:97 _clM:130 clTargets:131 clReset:143 clCapsuleState:147 clCapsuleUpdate:150 clCapsule:159 _clO:169 clWorld:170 clWorldHit:178 clStep:183 clDraw:195 _clRank:217 clothTick:218 clRun:229
§246 other players: low-res cloth on the batched body (student_all_batch)
clLiteSetup:248 clLiteShow:275 clLiteTick:276 clLiteDraw:287 clOuterNormals:294

## js/50-grass.js (443) — 
AIR:10 AIR_MAP:17 AIR_NG:20 airGust:21 airGustOff:26 airEnv:27 airGs:28 airMark:30 airForMap:33 _airV:34 airAt:35 airGv:41 airTick:42
§45 ต่อเข้ากับเอฟเฟกต์เดิม (ไม่ต้องแก้ทุกสกิล): แสงวาบ = ลมกระโชก • วงคลื…
CLW:54
§56 หญ้า
GRASS:58
§59 รอยสนามรบบนหญ้า + พื้น (อยู่ทั้งแมตช์ — designs/battlefield.md ขั้น 3)
SCAR:62 scarReset:64 scarPaint:71 scarRect:86 grassScar:97
§102 ไฟลามหญ้า (ภาพล้วน: ไม่มีดาเมจ ไม่ซิงก์ — แต่ละเครื่องลามไม่เหมือนกัน…
FIRE:108 GR_FIRE:111 fireReset:113 fireBuild:115 fireLight:122 fireIgnite:124 fireFx:136 fireStep:141 fireTick:165
§170 พื้นหญ้ามีชีวิต: สีเป็นหย่อม (เขียวเข้ม / แห้งเหลือง / ดินโผล่) + จุด…
GR_NOISE:173 GR_LIVE:178 SNOWU:199 GR_SNOW:200 grLive:202 GR_GLSL_V:212 GR_BEGIN:217 grassMat:269 grassBuild:287 _grBasic:301 grassBake:302 grassCount:372 grassForMap:379 grassPrebake:382 grassTick:384
§420 สกิลลม → หญ้า (ภาพล้วน เรียกจาก windEfx js/68)
WIND_GRASS:422 airWind:436

## js/51-warmup.js (462) — 
WARM:11 WARM_FXDIR:12 WARM_COMMON:12 WARM_SLICE:13 WARM_X:14 WARM_Y:14 warmKeep:16 warmStaticModels:22 glReady:31 warmCompile:32 warmDraw:35 WARM_SKIP:45 warmAssets:48 warmFx:58 warmNow:71 warmFxRun:79 warmFxEnd:82 warmGather:84 warmPaths:86 warmFrame:88 warmStep:90 preloadCharMat:158 warmTrCopy:161 warmCharVariants:164 warmQueue:184 WARM_LOBBY:193 warmLobbyTick:194 warmTick:201
§212 Entry loader (PRELOAD-STANDARD step 3, 2026-11-23)
PRE:218 preloadReg:219 warmDissolve:221 preProg:254 preFin:255 preStart:257
§270 Event rehearsal (PRELOAD-STANDARD step 4, 2026-11-23)
WARM_REC_SKIP:276 warmRec:277 warmRecDump:279 WARM_EVFLAGS:280 WARM_EVX:281 WARM_EVY:281 warmEvShift:282 warmRehearse:287 preTick:294
§304 ภาพจากโค้ดของแต่ละสาย (เฟรมละฟังก์ชัน)
warmOutline:315
§332 อุ่นฉากเกมระหว่างรอในห้อง (ผู้ใช้ 2026-10-23: "กระตุกตอนเริ่มแมตช์แรก…
GWARM:337 gameWarmTick:338 LMAP:371 lobbyMapTick:372 gameWarmFree:382
§388 Shader never seen before mid-match: compile in the background, hide t…
SHR:396 shrLights:400 IMZ:405 imzPre:418 imzPost:420 shrCollect:421 shrPending:427 shReadyPre:431 shReadyPost:457

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

## js/66-hud4.js (234) — HUD รอบ 4 (ผู้ใช้ 2026-10-23, designs/hud-full-mock.html)
H4E:5 H4:15 h4God:16 h4Pal:17 hud4Col:19 h4Parts:21 h4AuBits:26 h4Key:41 h4Ico:42 h4Build:43 h4Set:73 hud4Draw:74 h4Ammo:130 h4Shield:134
§139 ไพ่สกิล: นาฬิกาทราย / ท่าใช้ / สลับตำแหน่ง
h4Glass:141 h4Bits:147 h4Fx:149 h4CardUse:151 h4GlassOut:155 h4Place:159 h4OrdKey:162 h4OrdLoad:163 h4Swap:166 h4Pick:169 h4AltKey:171 h4CardWire:175
§186 ไพ่อัลติ
H4SH:188 h4UltCard:190 h4UltUse:195 hud4Frame:197 hud4Hide:198
§199 ไพ่อัลติกลางจอ (ผู้ใช้ 2026-11-01)
h4UltX:202
§209 รูปตัวละครเรา (FFA / TDM แทนแผนที่ย่อ)
H4PF:211 h4PfMode:212 h4PfAvatar:214 h4Portrait:216 h4PfRead:227 h4MapBox:234

## js/66-hudlay.js (35) — HUD layout (HUD Editor, user 2026-11-24)
HUDL_DEF:5 HUDL:11 HL0:12 hlGet:13 hudHs:14 hlSet:16 hlJson:20 hlApplyDom:22 hlBegin:26 hlEnd:28 hlBox:30 HL_DEMO_FEED:31

## js/66-hudmin.js (74) — Minimal HUD (Settings > หน้าจอ > รูปแบบ HUD, user 2026-11-25)
HM:6 hudMin:7 hmSet:8 hmHs:9 hmMapBox:11 hmBuild:12 hudMinDraw:35 hudMinFrame:73

## js/67-backdrop.js (141) — 
BACKDROP:8
§66 noise เล็ก ๆ (คงที่ต่อ seed)
bdHash:67 bdNoise:68 bdFbm:69 bdEdge:71 bdRing:73 bdPaint:79 bdTree:82 buildBackdrop:89 bdTower:137 backdropHide:141

## js/67-coast.js (439) — 
COAST:10 BD_LOD:14
§26 2D value noise (deterministic)
cvN:27 cvF:29
§30 overcast sky dome (shader: thick cloud deck on a flat layer, horizon …
COAST_SKY:31 coastSky:32 BD_AIR:59 BD_DET_V:63 BD_DET_F:64 bdDetailCol:68 BD_DET_N:78 bdDetail:81 bdAerial:88 bdAirTick:96 BD_SEC:99 bdSec:100 bdSplit:101 bdSnapTrees:110 bdReach:122 bdFar:123 backdropLook:125
§136 land shape
coastShape:137 coastH:162
§175 height sources: one interface for the code coast (BACKDROP.fcs) and M…
coastSrcProc:178 BD_SURF:184 bdB64:185 bdRle:186 bdHsh:187 bdGridSrc:188 coastGrid:224 bdCoast:234 coastTreePts:352 BD_TREE_FAR:360 coastTreeMesh:361
§400 near-edge detail bands (user 2026-11-23: backdrop next to the play ar…
bdNearKit:405

## js/67-ocean.js (132) — 
OCEAN:6 OC_COMMON:9 OC_VERT:17 OC_INIT:18 OC_EVOLVE:30 OC_FFT:37 OC_ASM:43 ocJon:49 ocMat:50 oceanSim:51 oceanSpectrum:67 oceanStep:71 oceanFree:77 OCU:79 oceanTick:81 oceanRun:87 oceanWarm:93 OC_GLSL_V:97 OC_GLSL_F:99

## js/67-pond.js (73) — Map Builder water surfaces (data.water, mapbuild/model.js gameData; u…
WATER_LOOK:6 POND:7 pondTick:8 pondMat:12 pondBuild:52

## js/68-darkness-view.js (1158) — 
nightWaltzStrip:2 nightWaltzBorder:80 stDarkVeilGround:118 darkFxMesh:195 drawDarknessHud:201 drawDarkHudBar:220 darknessMarkView:227 darkWaveViews:237 darkActiveViews:237 darkViewRoot:238 darkViewTemp:245 darknessClear:257 darkDeathRoots:265 darkDeathClear:268 darkWorldAt:282 darkMarkWind:285 darkMarkLaunch:313 darkMarkContact:325 darkViewNow:339 darkFlowHud:339 darkIdleWeaponPose:340 darkBAGroundImpact:344 darkSettleWeapon:359 darkBlendWeapon:370 darkShowWeaponReturn:393 darkTrailHistory:400 darkDashView:439 darknessCharacter:485 darknessEfx:728 stDarkShieldInk:1028 stDarkVeilBlade:1071 stWardDrainPool:1108

## js/68-light-view.js (2033) — 
LGV:7 LGSH:9 LGSH_L:11 _lgM4:14 _lgQ:14 _lgSV:14 _lgS:14 _lgC:14 _lgC2:14 lgGlowTex:15 lgNeon:17 lgEmpFx:25 lgWallBurn:44 lgShardSpawn:60 lgShardTick:64 lgBaCore:65 lgCrDim:108 lgEmpBeam:112 lgNeonCrystal:126 lgSanctumFloorTex:136 lgSanctumMoteTex:147 lgHoneyTex:162 lgShield:166 _lgShieldEuler:202 lightShieldEv:203 LGPOSE:206 _lgLeanBase:207 _lgLeanUndo:207 _lgGlass:208 _lgCore:208 _lgGeo:208 _lgEdge:208 _lgEdgeM:208 lgCrystalMesh:210 lgState:218 _lgV:219 _lgW:219 lgWorld:220 LG_ULT_ASSET:223 LG_CRYSTAL_ASSET:223 LG_ULT_INTRO:224 LG_ULT_ARRIVAL_FX:224 LG_ULT_TIME:225 lgUltMaterials:226 lgSovereignFinishes:227 lgSovereignMaterials:228 lgSovereignFinish:289 lgSovereignCrystal:310 lgSkinSovereign:319 _lgX:373 lgPoseSovereign:374 lgSovereignHeart:457 LG_SASH_X:483 LG_SASH_Z:483 lgSovereignRibbon:484 lgSovereignFlare:543 LG_PALM_TRAVEL:556 LG_PALM_SCORCH_LIFE:557 LG_PALM_SCORCH_SLOTS:557 lgPalmGateOffset:558 lgSovereignPalmWaves:560 lgPosePalmWaves:569 lgPoseBeamWaves:575 lgSovereignPalmGate:587 lgSovereignScorchTrail:597 lgPalmScorch:625 lgSovereignCrossSparks:661 lgSovereignGather:684 lgSovereignWingCurrent:717 lgSovereignChargeSeal:746 lgSovereignChestRecoil:763 lgSovereignSeal:773 lgSovereignArmSigils:789 lgBuildSovereign:820 lgReturnMark:897 _lgHexTex:912 lgHexTex:913 LG_XG:917 lgXIn:918 _lgHP:920 _lgHN:920 _lgHZ:920 lgSelfHex:921 lgHexShield:934 LG_LEAN:948 lightLeanPose:949 lgUltVisual:961 lgWardVisual:1207 _lgBeamM:1223 lgBeamMat:1224 lgSovereignChestBeam:1227 lgSovereignPalmBeam:1264 _lgLinkM:1335 lgLinkMat:1336 lgUnitTube:1339 lgTube:1340 lgAim:1348 lightFX:1349 lgBaseObjects:1592 lgClearBase:1593 lgClear:1594 lightDropView:1601 lgAllyEmpEnd:1607
§1611 เหตุการณ์
lgBlip:1613 lgArcFx:1617 lgFlyFx:1620 lgSovereignArrival:1621 lightFxTick:1660 LG_BLAST_EXPAND:1664 LG_BLAST_HOLD:1664 lgImpactDome:1665 lgBlastFloor:1705 lgBlastThreads:1736 lgFitGround:1764 lgGroundWarning:1773 lightEfx:1786 _lgHq:1943 _lgHy:1943 lgProcHead:1945 lightHeadPose:1960 LGHUD:1968 lgBondScreen:1969 drawCrystalBondHud:1970 drawLightHud:1993

## js/68-nature-art.js (171) — 
naturePlantArt:2 Turret:3 auraTextures:44 auraTex:45 LotusAura:88 glowWallTex:92 M_BUB:95 M_BUBRIM:96 M_DRIP:97 M_POOL:98 lotusPetalVeins:100 Lotus:127

## js/68-nature-fx.js (195) — 
_natFx:3 natFxClear:4 natFxMake:5 T:6 S:6 O:6 seed:7 ease:8 outQ:8 inQ:8 phase:8 tipW:9 ALL:10 mesh:11 STD:12 ADD:13 M:14 glowTex:31 GLOWT:32 GLOWG:32 GLOWP:32 GLOWV:32 glow:33 ring:34 Tube:36 TubeSet:55 V3:73 Thorns:75 thornsAlong:87
§91 อนุภาค
Pool:92 leafGeo:100 LEAF:101 SPK:102 DIRT:103 PUFF:104 CHIP:105 POOLS:106 leafCols:107 leaves:108 sparks:109 dirt:110 puff:111 chips:112 TrailRibbon:114 WHIP_N:125 WHIP_L:125 WHIP_LAG:125 Whip:126 CLIPS:189 tick:190 clip:191 drop:192 natFx:195

## js/68-nature-view.js (1103) — 
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

## js/68-wind-view.js (505) — 
WV:6 WN_BODY:8 WN_AIR_FEET:8 WF_POSE:12 WF_FEET:12 WF_REF:12 WF_ROLL:12 _wfP:13 _wfF:13 windFlyPose:14 WTLF:24 windTailDraw:25 windTailFeel:31 windCharacterPose:33 wvState:50 wvAlive:51
§52 ทุกเฟรมของผู้เล่นสายลม: ปีกติดหลัง / ปีกห่อตอนยกโล่ / ดูดลมชาร์จเกจ
wfeSwing:53 wfeTwist:53 W_BLAST_SUCK:54 WFE_HOLD:55 WFE_TURN:55 windLatePose:57 _faX:98 _faQ:98 _faT:98 WF_ELBOW:98 windForearm:99
§101 Palm sigil + palm wind ball (user 2026-11-25)
_wpTex:105 wpSigilTex:106 _wpN:113 _wpO:113 WP:114 _wpH:114 _wpF:114 _wpD:114 _wpQ:114 _wpZ:114 windPalmLate:115 windFX:142
§174 กำแพงลมจาก snapshot (ตามตำแหน่ง/ลบเมื่อหมด)
syncWind:175 wvWall:188 wvHitFx:189 wvAimFx:190
§191 ตา Eye of Heaven: ตำแหน่งตาบนฟ้า (ตรงกับ EYE ใน tools/wind-eye-ult-ge…
wvEyePos:192 wvEyeSeen:193
§194 เหตุการณ์ (efx z 'wn…')
WDOME_G:196 WDOME_V:197 WDOME_F:198 windDome:199 windSuckFx:208 windEfx:219
§312 HUD รอบเป้าเล็ง: GaleBurst / Downburst / Dash / Slipstream
_wShellM:314 windShellMat:315 windSlipHud:322 drawWindHud:328
§339 ตัวช่วยเล็งกำแพงลม (เห็นเฉพาะเรา): เส้นโค้งเรืองที่จุดวาง (คลิกขวา) +…
wvAimGhost:340
§351 ปีกเวทสายลมติดหลัง: ขนนก 8+4 เส้นต่อข้าง ทำจากสายลม (shader) + ริบบิ้…
WWS:353 WWU:353 WW_NOISE:354 _wwMat:359 wwMats:360 wwFeatherGeo:406 WW_PRI:417 WW_COV:419 WW_RIB:420 _wwGeo:421 _wsupG:423 _wsupD:423 windSupDust:424 windSupDustTick:428 windWingSup:429 makeWindWings:455 wwCue:469 poseWindWings:473

## js/69-broom.js (236) — ไม้กวาด (ผู้ใช้ 2026-10-29): บินแบบเครื่องบิน + ยิงลำแสงตามสาย + อนิเ…
BRM:9 BFW:12 BSK:13 BROOM_SK:19 broomVert:40 broomMove:53 broomStrike:72 broomStrikeTick:81 broomFlak:89 broomAct:100 broomOff:107 broomBeam:109
§131 ฝั่งจอ
broomHead:133 BBEAM:140 _bbGeo:141 broomView:142 broomMountFx:173 broomDismountFx:181 broomBeamFx:183 broomSkFx:199 broomStrikeFx:212 broomFlakFx:217 broomHud:222 broomHudT:223 broomTick:232

## js/70-water-dragon.js (512) — อัลติน้ำ Dragon of the Deep — มังกรน้ำตัวจริงในเกม (ผู้ใช้รับหน้าตา 2026-11-01 จากตัวอย่า…
WDG:7 wdgBuild:8 T:9 root:9 fixed:9 rings:10 sides:10 fastNormals:12 geoOf:21 skin:22 faceSkin:50 group:51 head:52 faceTime:54 groundY:54 faceMaterial:55 faceBlue:60 hornBlue:60 ridgeCyan:60 profile:62 headProfile:63 faceGeo:68 fp:68 fc:68 fi:68 faceRings:68 faceSides:68 navy:69 aqua:69 belly:69 flowHi:69 neckBlend:69 headStroke:81 eyePatch:82 waterCrest:97 bodyGeo:123 bodyP:123 bodyUV:123 indices:123 body:129 finShape:131 finGeo:132 finPos:134 finUV:134 finSkin:136 FIN_N:139 fins:139 _fM:140 _fQ:140 _fS:140 _fP:140 limbSkin:142 clawSkin:143 taperedLimb:144 arms:151 bodyLength:161 intro:161 settleWindow:161 tipHz:161 bodyBulk:161 bodyRadius:162 flight:164 quarters:165 step:165 dr:165 dy:165 spiralKnot:166 first:167 entry:167 crest:171 bank:174 corner:174 cruiseEntry:174 quarterHandle:177 leadLength:179 up:183 zAxis:183 yAxis:183 smooth:184 startAt:185 startD:185 startDistance:187 distanceToCruise:187 hoverSpeed:187 fastDuration:187 brakeDuration:187 startRamp:187 fastSpeed:188 progress:189
§198 ทางบิน: ใช้ระยะทาง (เมตร) ไม่ใช่สัดส่วน เพื่อต่อทางพุ่งลงตอนเล็งเสร็จ…
dive:199 PA:200 TA:201 DIVE_DOWN:203 DIVE_POUR:203 DIVE_STEP:203 diveDist:204 lastTime:205 lastHeadT:205 headRight:205 bodyState:205 filtered:205 SBUF:209 _sq1:210 _sq2:210 _sv1:210 _sHT:210 _sPrev:210 _sCand:210 _sSide:210 _sUR:210 _sRt:210 _sM:210 _bCos:211 _bSin:211 shape:212 gate:268 rune:270 shadowMat:271 shadow:272 ringMat:273 ring:274 glyphMat:275 glyphHi:276 glyphPath:277 water:284 splashGeometry:287 lowWaveGeometry:288 splashBursts:289 pulse:295 outerRing:296 dropletMat:297 drops:297 transform:299 gateAt:300 sprayMaterial:322 spray:322 curlCurve:324 foamMaterial:325 foam:326 particles:327 foamParticles:327 rand:328 bodySprayAt:329 waveSegments:350 waveSheets:350 wavesAt:357 currentConfigs:372 currentMaterial:379 currentSegments:384 currentSides:384 currentMeshes:384 _cC:393 _cR:393 _cV:393 _cRad:393 currentPointTo:394 currentPoint:401 currentSpray:402 currentParticles:403 _cS:404 _cCos:405 _cSin:405 _cPow:405 currentsAt:406
§471 เล่น
WDG_YAW:472 wdgGet:473 wdgStart:474 wdgDive:481 wdgKeep:484 wdgEnd:485 wdgTick:486

## js/71-perfhud.js (164) — 
PERF:9 perfNetSample:11 perfNetSend:14 perfNetReceive:20 perfNetFrame:25 FRZ:40 frzAdd:42 frzOk:45 frzFrame:46 SHW:53 shwDiff:54 shwPath:58 shwSig:60 shwWho:61 shwHead:68 shwSrc:69 shwSame:70 shwFrame:71 frzRecv:87 frzIn:89 frzNote:91 FRZ_NAME:95 frzRows:96 perfFrame:98 perfDom:113 perfStats:121 perfGraph:125 _gpuName:138 gpuIntegrated:139 perfRows:140 perfPanel:160 perfText:161

## js/72-dash-pose.js (107) — 
DPOSE:12 DPT:32 _dpQ:33 _dpX:33 _dpP:33 STANCE_STORM_ZAP:34 dpMix:35 dpKnees:37 dpStyle:45 DPDBG:51 dashPose:52 _zpP:88 zapMix:89 dpApply:97

## js/73-tune.js (141) — แผงปรับค่า 🎚️ (F8 / ปุ่ม "ปรับค่า" ในเมนูพัก และหน้าแรก) — ปรับตัวเลขในเกมสดๆ แล้วเซฟลง …
TUNE:8 tuneNum:9 tuneBuild:15
§80 ใช้ / เก็บค่า
tuneSetVal:81 tuneApplyFile:84 tuneJson:88
§91 หน้าตา
tuneOpenF:96 tuneFmt:97 tuneRow:98 tuneRefresh:101 tuneMsg:109 tuneToggle:110 tuneEdit:114
§138 API สำหรับเครื่องมือแยก tune.html (เปิดเกมใน iframe แล้วเรียกผ่าน WD)
tuneDump:139 tuneSetKey:140

## js/74-look.js (105) — Look 🌗 — พรีเซ็ตลุคของฉาก: แสงรอบตัวจากท้องฟ้า (IBL) + ความสว่าง + คอนทราสต์ + ย้อมสีเงา…
§12 ฟิลด์: sky = ท้องฟ้าที่ถ่ายเป็นแสง ('night'|'sunset') • warm = ทิศย้อ…
LOOK:17 lookPreset:41 lookMap:43 lookName:44 lookEnvFor:45 lookApply:55 lookRays:72 _lkV:77 lookRaysFrame:79 lookRefresh:86
§87 ลงทะเบียนในเครื่องมือปรับค่า (js/73-tune.js): 1 หมวด "🌗 Look" แยกส่ว…
LOOK_F:88 lookRegister:94 lookTest:99

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

## js/76-weather.js (100) — Weather: central system for every map (user 2026-11-26)
WX:10 WX_N:11 WX_S:11 wxParse:12 wxPick:13 wxMap:15 wxRainMesh:18 wxSplashMesh:31 _wxF:43 wxSplashTick:44 wxSound:50 wxTick:59 _wxV:77 _wxT:77 _wxR:77 _wxP:77 _wxN:77 _wxQ:77 _wxC:77 wxPre:78

## js/77-dev.js (316) — Dev Mode: ทดสอบแมพ/สกิลในแมตช์จริง (ผู้ใช้ 2026-11-18)
DEV:5 devOn:10 devOff:11 devSoloOk:12 devHold:13 devBroomOk:14 dvMe:15 devSave:16
§17 hook จากโฮสต์: เรียกต้น hostTick (คืน dt ที่ปรับแล้ว • -1 = หยุดโลก)
devDt:18 devTick:23 devGod:32 devFreeze:33
§34 กล้องอิสระ
MBCAM:37 mbcamDone:38 devMbCam:40 devFcToggle:41 devFcCam:48 devFcTop:54 devFcMe:58 devKey:75 devMount:86 DEV_BOTS:94 devStartMode:95
§108 Spectator (user 2026-11-20): watch a full bot match — host steps out,…
devSpecStart:111 devSpecRestore:127 devSpecStop:133 devSpecAim:135 devSpecKey:139 devCell:143 devCopyAim:144
§150 คำสั่งโฮสต์
devTp:151 devSgPhase:155 devSgLoot:167 devBotAdd:171 devAct:180
§224 Destruction debug (user 2026-11-19): repair / collapse breakables at …
DEVD_R:227 devBrkFix:228 devPnlFix:229 devPropFix:233 devSkinFix:234 devDestroy:239
§273 ภาพซ้อนไว้ดูแมพ: กล่องชน (OBS) + วงเขตยึด/จุดเกิดปลอดภัย
_dvCyl:274 _dvMat:275 devOverlay:276
§296 2D overlay map: spawn zones + capture zones + players (click = warp)
_dvMap:297 _dvY:301 devMapDraw:302

## js/77-paint.js (374) — 
PAINT:12 paintOn:23 paintMap:25 kuwOn:34 paintLights:35
§44 VFX สีสด (ทดลอง): บนแมพสว่าง เอฟเฟกต์เรืองแสงเดิมซีดเป็นขาว-เหลืองอ่อ…
_ptHSL:45 paintVivid:46 paintVfx:48
§58 ไฟก้อนหลอมรวม (blob / metaball) — ภาพอ้างอิงผู้ใช้ 2026-11-11: ไฟเป็น…
BLOB:60 blobPre:61 blobFire:62 paintGrass:85
§86 ภาพผิว: เปลือกไม้ (ครึ่งซ้าย) + ใบไม้ปาดพู่กัน 4 แบบ (ครึ่งขวา 2×2)
paintAtlas:87 paintStrokeTex:111
§119 ต้นไม้
paintTreeGeo:120 paintCanopy:163 paintKit:167
§194 tree wind (user 2026-11-23: trees more alive)
PTW:196 PTW_HEAD:199 PTW_BODY:201 PTW_FS:221 ptWindTick:224
§228 ลายพู่กันบนผิว (ต่อท้าย onBeforeCompile เดิมของวัสดุ เหมือน js/76)
PT_VS:229 PT_VS_BODY:230 PT_FS:231 PT_FS_BODY:232 paintPatch:242 paintApply:256 ptreeScene:259
§267 ฉากของแมพ (เรียกจาก buildFileMap ก่อน brkSetup/batchStatic)
paintScene:268 paintTreePts:286 paintShafts:290
§315 ฟิลเตอร์ภาพวาด (Kuwahara 4 ทิศ, 64 จุด) — เลือกค่าเฉลี่ยของมุมที่สีเร…
kuwQ:318 KUW_LOOP:319 kuwMat:321 paintRT:338 paintKuw:339
§355 ปรับค่า (tune.html / F8)

## js/78-dev-ui.js (248) — Dev Mode UI (user 2026-11-20): one floating window, many small column…
§10 orbit camera
devOrbPick:11 devOrbToggle:23 devOrbCam:28
§42 video recording
REC:43 _dvBadge:44 devRecStart:45 devRecStop:60 devRecFrame:62 devRecSave:67 devRecAuto:83 devAutoTick:87
§94 window
_dvPanel:95 _dvBtn:98 _dvBody:100 _dvHead:100 devUiApply:102 devFreeMouse:110 devToggle:111 devF2:116 devGrave:121
§130 rows
dvA:131 dvTg:132 dvB:133 dvCh:134 dvSl:135 dvSub:136 dvCol:137 devKeyOf:138 devRender:143 devPos:196 devUiAct:203

## js/79-photo.js (105) — Photo mode (user 2026-11-23): promo shots of maps
PH:6 PH_F:8 phStore:13 phBase:15 phShadowSize:18 phOn:19 phOff:20 photoFrame:28 photoPre:43 photoPost:46 phAdd:48 phGo:49 phWait:51 phSave:52 phShoot:57 photoCol:74 photoAct:88 photoSet:103 photoKey:104

(123 files, 39028 lines)
