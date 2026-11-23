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

## js/02-data.js (391) — 
W:4 H:4 PR:4 PILLARS:6 SPAWNF:7 mulberry:9 genForest:10 genPitch:27 genHogsmeade:36
§54 แผนที่โล่ง 3 แบบ (ผู้ใช้: ป่ามืดไม่สนุก อยากได้ที่โล่งๆ)
genMeadow:55 genLake:61 genRuins:66
§73 Test Place (ห้องฝึก): พื้นโล่งไม่มีสิ่งกีดขวาง
TEST_W:75 TEST_H:75 TEST_C:75 TEST_VIL:75 TEST_GW:77 TEST_Z:78 TEST_ST:85 TEST_PH:86 testWalls:88 testDummySpots:90 testFences:92 genTest:105 testProps:120 trZone:133 trBotPad:134 trFixSpots:136 trShow:138 genGreatHall:139 MAPS:147 MAP_OFF:160 PLAYMAP:161 RANDOM_MAPS:162 MAPID:163 MW:163 MH:163 OBS:163 setMapVars:164
§165 แผนที่จากไฟล์ (Blender → assets/maps/<id>.json + .glb, สคริปต์ assets…
FMAPS:168 b64i16:169 regFileMap:170 loadMapData:188 loadAllMapData:196 mapReady:199 modeMap:200 mapOkFor:201
§202 ของประกอบฉากที่พังได้ / ใช้ได้ (prop)
PROPDEF:206 PROP_OFF_MODES:213 PROP_USE:215 PROPS:216 PROPON:216 genProps:217
§237 ตัวละคร: บ้านฮอกวอตส์ + หน้าตา
HOUSES:239 HAIRC:244 HAIRSTY:246 WOODC:249 WOODN:250 WCOREC:251 WCOREN:252 WANDSTY:253 WANDN:258 WANDNN:273 EYEC:274 SKINC:275 CLOAKC:276 TIESTY:277 LOOKK:278 LOOKN:278 lookStr:279 parseLook:280 randLook:281 LOOKS:282 LOOKP:282 KITS:282 getKit:283 getLook:284 CREST_SH:285 CREST_PAT:286 starPts:291 CREST_ANI:293 crestSVG:299 houseColor:307 TEAMC:308 TEAMN:308 NOBROOM:310 ROOM_MAX:312 MODES:313 hostModeEnabled:325 PLAY:327 PDEF:328 EDEF:355 POOLS:368 CDK:378 BUFFS:381 BRAR:390 rollRar:391

## js/02-fcs-data.js (3) — 
FCS_DATA:3

## js/02-fcs-rooms.js (100) — 
FCS_ROOMS:11 fcsRoomAdd:12 FCS_C0:13 fcsRoomOf:14 fcsCut:15
§16 gen context (called from genFcs)
fcsRoomK:17 roomWall:27 roomCol:36 roomFloor:38 roomCeil:44 fcsCeilAt:46 fcsCeilClamp:54
§55 breakable room props (user 2026-11-20): BRK groups (js/12-buildings.j…
RPK:59 roomProp:67 roomsFromFile:77 roomsCur:89 RWH:91 roomWallEnv:92

## js/02-fcs.js (252) — 
FCS_C:7 FCS_WH:8 genFcs:9
§196 พื้นที่เล่นตามเฟส (กำแพงล่องหน) + เขตจุดเกิดปลอดภัย — ใช้ทั้งโฮสต์ (G…
SGPH:197 SGTR:197 SG_SPR:198 sgFD:200 _sgAreaC:201 sgArea:202 _sgAreaT:209 sgAreaT:210 sgClamp:216 sgInArea:226 sgAttach:229 sgFromFile:239

## js/02-room-greathall.js (105) — 


## js/03-spells-core.js (255) — ระบบคาถาใหม่: สาย (path) × คาถา (spell) + สถานะ (status effects)
SHIELD_OFF:2 REGEN:4
§10 ไอคอนคาถา: จาก game-icons.net (CC BY 3.0, เครดิตใน "คู่มือ" และ icons…
ICONS:12 ICOALIAS:13 hasIco:14 ICOBASE:16 icoURL:17 ICO:18 icoTint:19 icoHTML:28 PATHS:29 SPELL_LIST:38 SPELLS:38 defSpell:39 SLOTK:40 BRMAP:40 KITP:41 parseKit:42 cleanKit:59 setKit:60 pathReset:63
§65 สถานะ (ใช้ได้ทั้งผู้เล่นและศัตรู)
isBig:66 ccScale:68 ccTouch:69 addStun:70 addRoot:71 addFreeze:72 addSlow:77 addChill:78 ignite:83 FX_SHOCK_CYAN:91 FX_ONFIRE:91 shock:92 knock:97 addWard:98 addFrostSlow:100 frostSlow:101 moveMul:108 BRN_MAX:110 addBurn:111 addOnFire:113 addXBurn:114 addPoison:115 addSil:116 addFear:117 addBlind:118 addMark:119 healT:121 tickStatus:126 clearStatus:149 fxMask:150
§152 วัตถุในสนามที่คาถาสร้าง: โซน / ฟ้าผ่าหน่วงเวลา / กำแพง / ช่องร่ายต่อเ…
foesIn:153 SHIELD_BREAK_LOCK:161 shieldFaces:162 aoeHit:172 addZone:179 updateZones:184 addStrike:195 updateStrikes:196 addWall:197 updateWalls:198 updateChan:209 updateSpells:213 aimPoint:215 aimWall:227
§229 ตัวช่วยคอมโบ (ทุกสายใช้หลักเดียวกัน: ตั้งต้น → ต่อยอด → ปิดจบ)
ROLE_N:231 takePoison:232
§234 ความสามารถพื้นฐาน (คลิกซ้าย) ของแต่ละสาย: สะสมสถานะตั้งต้นให้เองทุกๆ …
PBASIC:235

## js/04-frost-mech.js (141) — สายน้ำแข็ง: ประชิด/ไกล (V) • ฟันดาบ/ขวาน • ไถลน้ำแข็ง • พื้นน้ำแข็ง/ภ…
FROSTV:3 FROST_SWING3_HIT:9 frostContactTime:10 frostShieldPitch:11 frostBoom:16 meleeHit:23 mirrorPos:34 frostBasic:35 frostCutTick:57 frostSlam3:66 frostSlam:74 frostDash:80 addIce:85 updateIces:86 frostWavePitch:103 frostWaveSolid:106 updateWaves:112 _stO:130 _stL:130 groundH:131

## js/05-terrain.js (44) — พื้นสูงต่ำ (แผนที่จากไฟล์ Blender — กติกาฝั่งคนปั้นใน guides/MAP-DESI…
TERR:5 TSTEP:6 TSLOPE:6 terrT:7 floorAt:12 terrSolid:14 terrMove:21 updateGlaciers:30

## js/06-pyro.js (222) — สายไฟ — ความร้อน: สะสมด้วยลูกไฟ/กำแพง/พุ่งเพลิง แล้วจุดระเบิดด้วยระเบิดความร้อน/อุกกาบาต
§1 สายไฟ: ยิงปกติ 2 โหมด / โล่ระเบิด / พุ่งชาร์จ
PYV:3 pyroBigBoom:11 pyroBall:19 pyroBasic:20 PHEAT:41 pyroHeatLv:42 pyroHeatGain:43 pyroHeatTick:44 pyroHeatDmg:45 pyroHeatSpd:46 addOrbs:47 pyroParry:48 pyroBlock:49 launchOrbs:51 pyroDash:58 pyroPathEnd:78 updateFirePaths:83
§103 Kindle volley (user 2026-11-14): one click = 3 fireballs. The big mid…
pyroKindleVolley:106 pyroKindleCurve:109 KINDLE:111 DRAGONF:113 dragonfallDive:122 dragonfallTick:123 dragonfallBoom:138 RINGE:143 BLAZEF:150 pyroBlazeAct:153 SNAP:154 COLOS:161 pyroNova:164 pyroSnap:169 colossusTick:182 updateERings:201

## js/07-frost-spells.js (34) — 
FROSTF:4 GREND:6 frostGlacier:11 PERMA:16 CRYO:18 FAURA:25 MIRROR:27 mirrorStart:30

## js/08-storm.js (326) — สายสายฟ้า (ผู้เล่นออกแบบทั้งหมด — designs/storm.md)
§5 ตัวเลขพื้นฐานของสายสายฟ้าอยู่ใน STORMV + v:{...} ของแต่ละสกิล — ปรับไ…
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

## js/09-earth.js (337) — 
EARTH:9 ERV:12
§24 ตัวช่วย
eOn:25 eStand:26 eNoStand:27 eSegD:29 eAdd:30 eCollide:32 eProjHit:52 eKill:55
§57 ทุกเฟรมของผู้เล่นสายดิน (เรียกจาก updatePlayer หลังส่วนโล่)
earthTick:58 earthSpd:82 earthShHit:84 earthBreak:85 earthReset:87
§89 ท่าพื้นฐาน (คลิกซ้าย)
earthBasic:90 earthFistStart:99 earthCBStart:100 earthFistAim:101 earthFistFire:102 earthFistBreak:109
§121 Dash: Stand Rampage / Rock Boost Escape
earthDash:122 earthRampEnd:141
§146 สกิล 1: Stonebreaker
earthStoneAim:147 STONEB:156
§175 สกิล 2: Mud Swamp
MUDS:176
§180 สกิล 3: Tectonic Crush
TECT:182 earthCrush:195
§206 สกิล 4: Dust Burst
DUSTB:207
§212 สกิล 5: Terra Auger
AUGER:214 eAugAim:218 earthAugFire:219 earthMound:230
§233 อัลติ: Wrath — ชาร์จบนพื้น หินดันผู้เล่นขึ้นฟ้า Stand ปาเสาลงจุดเล็ง
WRATH_READY_T:234 WRATH_THROW_SWING_T:235 WRATH_DRAW_T:236 WRATH:237 earthWrathAim:243 earthWrathFlightAngles:244 earthPillarThrow:250 earthPillarImpact:256 earthWrathTick:264 earthWrathEnd:288 E_WRS:292 earthSpikeTick:293
§299 ทั้งสนาม: สิ่งก่อสร้างพัง / ฝุ่นหมดเวลา / Stonebreaker ชนกำแพง
updateEarth:300 earthSnapP:313 earthSnapW:329

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

## js/09-nature-ba.js (123) — 
NATURE_BA_TEST:2 NATURE_WHIP:3 natureWhipEnabled:4 NAT_SLAM:8 NAT_LINE:8 natureEmpNear:9 natureEmpHit:10 natureWhipHit:19 natureWhipBasic:42 NW_RINGS:66 NW_SIDES:66 nwPhase:67 nwEase:68 nwSwingAngle:69 natureWhipPose:75 natureWhipVisualMake:84 natureWhipView:106

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

## js/10-net.js (210) — เครือข่าย (PeerJS / WebRTC)
PREFIX:4 NET:5 RC:9 TURN_SERVERS:12 ICE:13 PEER_OPT:14 TURN_URL:16 ICE_READY:18 JN:22 LAG:24 lagDo:25 hostSend:26 LOBBY:27 genCode:28 sendAll:29 NETD_KEYS:33 NETD:33 netDeltaReset:34 netDelta:35 NET_MAX:49 _netTE:49 netSendSnap:50 NET_QMAX:70 NETU:72 netUndelta:73 setStatus:79 hostGame:81 hostPeer:90 netConnect:110 joinWatch:121 joinFail:136 netLost:142 joinGame:157 joinPeer:168 clientOnData:183 leave:198 leaveRoom:200

## js/11-host.js (488) — ฝั่งโฮสต์: สถานะเกมทั้งหมดคำนวณที่นี่ (server-authoritative)
G:4 EVL:4 EVN:4 hostLast:4 tickN:4 emit:5 feed:6 banner:7 plist:8 cleanName:9 freshStats:11 newPlayer:18 emptyInput:21 frameOk:23 addPlayer:24 initHostLobby:33 lobbyMsg:40 broadcastLobby:41 INPN:43 hostOnData:44 hostDrop:76 hostRemove:85 validate:101 hostStart:115 hostToLobby:147 MIDJOIN:154 modeCap:155 midJoin:156 CHATT:172 chatRelay:173 emoHost:181 resetBody:183 fmap:189 spawnPts:190 teamPts:192 spSpread:194 placeAll:195 respawn:207
§226 ลูปหลักฝั่งโฮสต์
hostTick:227 angDiff:244 cH:246 vR:247 updatePlayer:249 hitProp:475 damagePropsIn:482 nearUseProp:483 useProp:484

## js/12-buildings.js (441) — environment damage / rays / collision shared by breakable things
BLDON:4 bldMoundH:5 damageEnv:7 bldRay:16 aimClip:21 aimLineH:29 aimRay3:30 projEl:57 bldPush:62 updateBldg:68
§69 ของบังในแผนที่ไฟล์ที่พังได้ (หิน เสา รูปปั้น ต้นไม้ โคมไฟ ลัง ...) — …
BRKDEF:73 BRK_M:73 BRK_MCOL:73 BRK:74 genBrk:75 brkApply:82 brkStage:87 hitBrk:88 damageBrkIn:96 brkSnap:102 brkParse:103
§104 ตารางช่อง (spatial grid) สำหรับแมพใหญ่: หาเฉพาะของใกล้ ๆ แทนวนทุกชิ้น…
SG:107 OCX:109 OCY:109 obsD2:110 obsEach:111 obsBox:112 sgObs:113 sgProps:113 sgGrid:114 sgNear:121 _sgCR:126 _sgCW:126 _sgCB:126 _sgCO:126 _sgPO:126 _sgPB:126 _sgPP:126 _sgM:126 _sgE:126 _sgA:126 _cwLast:128 collideWorld:129 shoot:170 eShoot:198 foesOf:205 breakShield:213 ULT_RATE:220 ultActive:221 gainUlt:222 lifesteal:223 impactProjectile:225 damage:226 playerDown:299 killProj:322 explode:333 hitTarget:345 hitProjectileTarget:349 updateProjectiles:366 projStep:374

## js/12-city-dmg.js (270) — เมืองพังได้ (designs/city-bot-battle.md ขั้น 4) — ข้อมูลที่ทุกเครื่อง…
CITY_FL:8 CITY_PW:8 CDMG:9 CITYD:16 cityOn:17 cityLayout:19 cityReset:29 cityApplyBox:45 cityApplyItem:46 cityHex:47 cityMark:48 cityRampSync:49 cityPanelAt:51 cityHitPanel:56 cityTowerStart:70 cityTowerStrip:76 cityTowerFall:80 cityHitItem:91 cityHitObs:100 _sgCD:105 cityDamageIn:107 cityTick:118 _sgCM:129 cityMoundH:130 cityMounds:140
§146 ข้างในตึก (2026-10-28 ผู้ใช้: เดินเข้าได้ 1–3 ชั้น มีทางขึ้น • ผนังนอ…
CIN:150 cityInterior:151 cinSlabOn:180 cinOpenPanel:182 cityIwHit:184 cityRampHit:186 cinIwSegs:189 cinIwRects:190 cinSecAt:191 citySecHit:193 cinIn:195 cinHole:196 cinRampH:197 _sgCI:198 cityBoxGrid:199 cityRoomAt:200 cityFloorH:202 cityCeilH:207 cinWallRect:211 cityCollideIn:214 cityProjIn:224 _sgCS:242 citySolidAt:243 cityRay:252 cityRoomBox:255 citySnapB:256 citySnapS:257 cityParse:259

## js/12-efs.js (78) — 
EFSV:9 EFS:10 efsLv:11 efsBuild:12 efsBreak:28 efsRepair:29 efsDist:30 efsHeat:31 efsProj:36 efsEnv:42 _efsHit:46 efsTick:47 efsSnap:67 efsParse:71 efsHostView:78

## js/12-fcs-bridge.js (113) — 
BSKV:10 BSKN:11 bskBuild:14 bskGround:38 bskOutline:40 bskSegs:53 bskInPoly:63 bskCut:65 bskStage:70 bskSetSt:71 bskHit:75 bskEnv:84 bskSnap:93 bskParse:97 bskRepair:104 bskExport:106

## js/12-pnl.js (220) — Breakable panels (แผ่นพัง) — Map Builder pn_wall → data.pnl (guides/D…
PNDEF:13 PN_BODY:16 PN_CH:17 PNL:18 PNG:18 pnGT:19 sgPnl:20 _sgPN:21 _sgPN2:21 _sgPN3:21 pnlGen:22 pnLoc:34 pnWorld:35 pnCU:36 pnL3:38 pnP3:40 pnCellPos:41 pnCellUW:42 pnSolid:43 pnMark:44 pnlLinks:46 pnlSupport:64 pnEmit:72 pnBreakAll:76 pnStage:77 pnlHit:79 pnDmgCell:93 pnHitFx:98 pnlEnv:100 pnSeg:110 pnlRay:117 pnlSolidAt:122 pnlProj:125 pnlCollide:131 pnPileCols:148 pnPileAt:152 pnlTopH:157 pnlMoundH:166 pnlTick:168 pnlSnap:174 pnlParse:179
§185 old houses → panel groups (same footprint as BLDDEF: walls wh m, gabl…
PN_HOUSE:188 pnHouse:189 pnlHouseConv:217

## js/13-enemies.js (171) — ศัตรู (โหมด Co-op)
spawnEnemy:2 setupWave:19 bossPhase:36 enemySlam:44 updateEnemies:55

## js/14-mode-rules.js (108) — กติกาของแต่ละโหมด
hostPick:2 clearField:10 modeLogic:11 endMatch:81 matchOver:108

## js/15-arena.js (71) — 
AR_SIDE:7 AR_TEAM:7 AR_MAX:7 arPads:8 arOn:9 arState:10 arBusy:11 arReady:13 arNames:21 arenaTick:22 arStart:43 arEnd:51 arReset:57 arAddBots:64

## js/15-bot.js (361) — บอทรุ่นแรก (designs/training-zones.md ขั้น 2): ผู้เล่นปลอมฝั่งโฮสต์ ใช้สกิลผ่านปุ่มเหมือน…
§5 ระดับความเก่ง: react = วิที่ใช้คิดใหม่ (เลือกเป้า/ขยับเป้าเล็ง) • err…
BOT_LV:8 BOT_SKIP:16 botKit:17 botPersona:24 BOT_TEAM:25 BOT_MAX:25 bots:26 humans:27 botInZone:29 spawnBot:36 OWNED_K:50 clearOwned:51 removeBots:52 botPickTarget:54
§72 วิธีเล่นตามสาย (guides/CLASS-GUIDE.md): เงื่อนไขใช้แต่ละท่า + ท่าต่อเ…
BOT_PB:76 botPlay:77
§207 บอทยืนนิ่ง (ห้องฝึก): หุ่นผู้เล่น = ไม่ทำอะไร • บอทโชว์สกิล (ai.show)…
showName:208 showBot:209 stillBot:210 trShowCmd:225 aiBot:249 trBotCmd:325
§334 บอทในห้องรอ (ผู้ใช้ 2026-10-31 "สร้างห้องเล่นกับบอทได้")
BOT_MODES:338 lobbyBots:339 lobbyBotAdd:340 lobbyBotFill:349 lobbyBotCmd:354 lobbyBotsStart:359 botDebug:361

## js/15-botnav.js (156) — 
NAV_MAPS:14 NAV_EYE:14 NAV:15 navOn:17 navSig:18 navEnsure:26 navBuild:32 navCell:55 navWalk:56 navRay:58 navFree:63 NAV_BRK:70 navBrkPen:71 navPath:79 _navFoe:97 botThink:100 botNav:110

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

## js/15-siege.js (277) — 
SGV:12 SG_TEAM:25 sgF:26 sgCore:27 sgInZone:28 sgSpawn:29 sgInit:30 sgWallsApply:39 sgWallDmg:43 sgWallHit:49 sgWallEnv:50 sgInput:55 sgStop:63 sgTick:64 sgCoreDown:100 sgPhaseGo:113 sgEnd:121 sgResult:123 sgSnap:129 SGB:138 sgBotTarget:140
§150 team plan (user 2026-11-22: don't trickle in one by one)
SGT:153 sgTeamPlan:154 sgBotMode:175 sgBreachAim:189 sgBotGoal:196 sgUnstick:212 sgBotThink:225

## js/16-voice.js (89) — ไมค์ (WebRTC audio แบบ mesh: ทุกคนโทรหากันตรงๆ)
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

## js/19-client.js (323) — 
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
ZV:225 COLB:225 WVV:225 GLV:225 ICEV:225 SLV:225 ULTV:225 OBV:225 _iceDisc:227 _iceEdge:228 _iceSpk:229 iceFloorMat:230 _icePlane:231 _icePathMat:232 _iceWvM:232 iceWvMat:234 makeIceFloor:246 ICE_WV:273 updateIceFloors:274 FLASHM:286 FLASHING:287 flashModel:288 endFlash:301 tickFlash:302 GHOSTM:304 SOLIDM:304 ghostOf:305 setGhost:311 hitSparks:319

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

## js/22-models.js (342) — โมเดลจากไฟล์ (.glb จาก Blender) — ข้อตกลงฝั่งคนปั้นอยู่ใน guides/ASSE…
MODELS:5 modelManifest:6 gltfLoader:11 loadModel:16 modelInst:31 modelOr:32 prefetchModels:44
§46 Animation จากไฟล์ (Blender Actions) + โมเดลตัวละคร/ศัตรูจากไฟล์
ANIM_ALT:49 makeAnimator:50 animResolve:55 animPlay:56 _animN:66 animLod:67 animTick:68 lookTint:88 tintModel:92 shareSkinSkeletons:107 batchStudentSkin:115 _palPx:134 palPixels:135 _s2l:138 mergeStudent:139 _matTw:174 matTwin:175 useFileModel:179 rigStage:205 fileVariants:207 fileBroom:208 _rq:212 _rq2:212 _rq3:212 rigBind:213 rigStd:221 rigSync:222 FILE_MODELS:235
§237 VFX จากไฟล์ (รายละเอียดฝั่งคนทำอยู่ใน guides/ASSETS.md)
VFXL:243 FLIPL:243 FLIPS:243 prefetchFx:244 playVfx:245 vfxSeq:291 flipTex:296 playFlip:304 fileFx:319 zoneFx:326 clearVfx:327 updateVfx:328

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

## js/26-fx-events.js (281) — fx(ev): เอฟเฟกต์+เสียงของทุก event จากโฮสต์ • statusFX (สถานะบนตัว) •…
onfOutlineMat:4 onFireFX:6 statusFX:17 fx:44
§249 overlay: เลือกบัฟ / สรุปผล
choosePick:250 syncOverlays:255 showOver:276

## js/27-world.js (404) — 
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
qualCS:286 CULL:287 cullTick:288 texCanvas:299 glowTex:300 stoneTex:301 runeTex:307 glowMats:315 glowMat:316 STONEM:318 stoneMat:319 shadowAll:320 SKY:323 hemi:344 moonL:346 LDIR:350 setSky:351 SKYB:364 skyFollow:365
§366 เงาตามผู้เล่น
SHD:370 _shF:371 _shR:371 _shU:371 _shC:371 _shY:371 SHD_DM:375 shadowDepthSplit:376 shadowFollow:381 shadowSoft:401 LPOOL:403

## js/28-city-build.js (386) — เมืองมักเกิ้ล (ลอนดอน) — ภาพ • ข้อมูลอยู่ js/02-city.js • โมเดลจาก as…
CITY_WIN:4 cityWinTex:5 cityEmTex:10 cityBoxGeo:16 buildCity:21
§102 ข้างในตึกกลวง (ภาพ — ผัง I จาก cityInterior js/12-city-dmg)
cityInteriorView:106 cityHideIn:147 cityMoundView:153
§176 ชุดโมเดลลอนดอน (assets/city/*.glb จาก assets/src/city_kit_build.py)
CITY_STY:181 CITY_VEH:188 cityFacade:190 CITYK:203 _cZ:204 _cT:204 _cR:204 _cC:204 cityKitLoad:205 cityCull:227 citySet:233 cityTint:235 cityPools:237 cityShowBld:243 cityRubble:250 CITY_FALL:258
§259 ตึกไฮไลต์ล้มทั้งตึก (ขั้น 7)
_ctA:262 _ctB:262 _ctC:262 cityTowerPose:263 cityTowerAnim:271 cityTowerRubble:278 CAREA:292 cityAreaSync:293 cityViewSync:305 cityDebris:349 cityFX:358

## js/28-fcs-build.js (382) — 
buildFcs:5 fcsBridge:41 fcsRubbleMat:64 fcsCore:79 FCSB:105 fcsParView:106 FSH_V:120 FSH_B:121 fcsShellMat:123 fcsBlocks:138 fcsShellBuild:150 fcsParFall:165 fcsFallTick:172 fcsShellView:184 FPILE:192 _rfP:194 _rfQ:194 _rfS:194 fcsFadeList:195 fcsRubbleFade:200 fcsShellFall:204 fcsPileTick:213 fcsShellClear:231 EFS3:234 fcsFences:235 _efC:252 _efM:252 _efS:252 _efZ:252 efsView:253
§279 ภาพโหมด (ลูกข่ายทุกเครื่องจาก snapshot M.sg)
SGV3:280 sgClearView:281 sgFileBuild:284 sgViewBuild:290 SGVZR:310 sgBarrier:313 sgSync:327 sgDust:348 sgFx:349
§354 HUD
sgTop:355 sgHud:357

## js/28-fcs-castle.js (247) — 
FCSC:9 fcsCastleMat:10 fcsBannerTex:34 fcsGlowTex:44 fcsCastle:46 fcsCastleDressing:154 fcsCastleTick:175
§177 room pieces: look (js/02-room-*.js view(K,V)) — V = shared builder, m…
fcsRoomsView:178 fcsDecoFile:180 fcsDecoKit:195 MB_STYLE:238 _poOn:239 fileStyleScene:240

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

## js/28-fcs-props.js (156) — 
FRP:11 FRP_PV:12 FRP_PB:13 frpMat:16
§26 part builders: local metres, x along the prop, z across, y up. push(g…
frpBuild:27 fcsPropsBuild:75 fcsPropsView:101 fcsRoomBrkFx:110 FRP_DEB:111 frpDebris:114 _frM:128 _frQ:128 _frS:128 frpSet:129 frpDebrisTick:130
§139 wall hit marks (event 'rwh'): decal quads on the wall face, ring buff…
frpMarkTex:140 fcsWallHit:144

## js/28-maps-build.js (822) — สร้างแผนที่
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
terrGeo:508 buildFileMap:516 replaceMeadowTufts:571 tickM:613 TRPAD:614 ARPAD:614 SHPAD:614 signTex:615 testSign:616 buildTest:623 buildRuins:728 buildPitch:753

## js/28-pnl-build.js (245) — Breakable panels — view (state = PNL in js/12-pnl.js)
PNV:7 PN_MI:8 PN_GLSL:9 pnlMat:41 PN_RUB:92 PN_HEAP:93 pnlCls:100 PN_ZU:108 pnlGeo:109 pnlBuild:192 pnlSyncOne:212 pnlView:234 pnlFX:237

## js/29-characters.js (440) — ระบบผ้า (เสื้อคลุมพลิ้วตามการเคลื่อนที่)
makeCloak:2 updateCloth:10 wandNamed:34 wandSparks:83
§92 โมเดลนักเรียนเวทมนตร์
SHGEO:94 SHMAT:94 SHTEX:94 sGeo:95 sMat:96 bMat:99 matKey:101 bodyPatch:107 BODYM:114 bodyMat:115 plainMat:120 mergeBody:121 sStripe:157 hashStr:158 stripeTex:159 shieldMat:160 addStatus:168 makeStudent:174 makeEnemy:281 keepTex:419 keepMatSet:420 disposeMaterial:421 disposeTree:427 disposeObj:438 PM3:439 EM3:439 JM3:439 clearDyn:440

## js/30-particles.js (374) — อนุภาค 2 ชั้น: แสงเรือง (additive) + ควัน (normal)
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

## js/34-frost-view.js (299) — ภาพของสายน้ำแข็ง: ดาบ/ขวานน้ำแข็งที่ปลายไม้ ท่าฟัน โล่อัศวิน ไถล แช่แ…
iceMat:2 iceRim:3 makeIceSword:4 makeIceAxe:23 makeKiteShield:39
§51 อาวุธน้ำแข็งลอย (ผู้ใช้ 2026-10-22: "ร่ายคาถาให้ดาบฟันเอง ระยะเท่าเดิ…
makeIceCrown:55 frostCrown:60 FWS:66 FWA:66 _fwM:67 _fwM2:67 _fwX:67 _fwY:67 _fwZ:67 _fwP:67 _fwS:67 _fwQ:67 _eo:68 _ei:68 _ss:68 fwAim:70 fwWeapons:71 FWP:73 FWT:73 fwChop:74 fwSweep:75 FF_RISE:76 fwIdle:77 fwSwing:80 FWL_N:92 fwLink:93 fwMat:96 frostFX:97

## js/35-sync.js (769) — ซิงก์ผู้เล่น/ศัตรู/ลูกเวทจาก snapshot + ฉายตำแหน่งลงจอ (ป้ายชื่อ/ตัวเ…
§2 ท่าร่ายคาถาแบบนักเวทในหนัง Harry Potter (ผู้ใช้ 2026-10-22: "ยิงปกติท…
CPOSE_T:7 _ce:7 _cs:7 _cb:7 AMP_B:9 AMP_S:9 CP_BEND:10 CPOSE:12 _cpT:20 _cpR:20 CGUARD:20 CP_STEP:21 CPCOL:22 castStyle:23 castStart:24
§25 ท่าร่ายสกิล / อัลติ / โล่ (ผู้ใช้ 2026-10-22: "เกือบทุกสกิลควรมีการเห…
CANIM:30 SKFEET:84 SKANIM:86 skAnim:94 _caT:95 _caR:95 skillPose:96 _g2:122 wandTwoHand:123 characterPoseMix:130 characterStance:131 JUMP_LEGS:138 jumpLegPose:147 jumpCloakTurn:184 jumpCloakEuler:184 jumpCloakPose:185 jumpArmBaseR:204 jumpArmBaseL:204 jumpElbowAxis:205 jumpElbowTurn:205 jumpElbowPivot:206 clearJumpArms:207 jumpArmPose:216 jumpElbowPose:226 CBLOCK:253 CBLOCK_PATH:254 blockPose:255 castPose:261 lateSkillPose:267 castPose0:268 clearCharacterCast:297 hitRecoilPose:302 syncPlayers:311 syncEnemies:441 projGeo:481 tailGeo:482 _t1:483 makeProj:484 _a:505 _b:505 PJFX:507 syncProj:508 _awT:609 animateWorld:610
§651 ฉายตำแหน่ง 3D ลงจอ (ป้ายชื่อ / ตัวเลขดาเมจ)
_v:652 toScreen:653 BURNC:661 burnNum:662 NAMETAG:676 nameTag:677 drawLabels:681 TEXTAG:712 textTag:713 drawTexts:717 HITM:729 DIRI:729 drawXh:731 drawCrosshair:741

## js/36-modes-view.js (171) — 
ROLE:4 KC:4 roleShowT:4 onPriv:5 MO:10 BREATHS:11 clearModeObjs:12 ITEMC:21 healTex:22 makeItem:23 syncModeObjs:39
§140 หน้าประชุมโหวต (หาลอร์ดโวลเดอมอร์)
meetKey:141 myVoted:141 castVote:142 syncMeeting:148

## js/37-render-loop.js (129) — ลูปเรนเดอร์
lastFrame:2 HSTOP:5 hitStop:6 FXSTUDIO:8
§9 เก็บ shader ที่ compile แล้วไว้ตลอดเกม (ผู้ใช้ 2026-11-02 "เล่นกับบอท…
PINMAX:13 PINNED:13 KEEPSRC:16 pinPrograms:22 frame:25 _fpsAcc:42 _fpsN:42 _fpsLast:42 render:43 detailCull:87 viewDetailAt:90 renderGame:97

## js/38-hud.js (480) — 
drawReticleTimer:1
§10 HUD
rr:11 SLOTS:12 fmtTime:13
§14 ชิ้นส่วน HUD ธีมทอง-น้ำเงิน
HG:15 HG2:15 HUDF:17 hudTick:18 readyPulse:20 diaPath:22 plate:24 frameBox:30 bossTrail:38 drawBossBar:39 spellDia:59 thinBar:88 drawHUD:93 raceRankClient:173 drawModeHUD:177 MM:215 MMB:216 drawMinimap:217 slotKey:293 mySlots:294 STATUS_ICO:303 SLOTS_IMP:304 BR_LOCK:305 CLUSTER:307 E_NEEDSTAND:308 slotState:309 drawBottom:333 drawBoard:348 FHUD:373 FHTEX:374 fhFrame:375 FH_EDGE:378 FH_CORE:378 fhMix:379 FHC:381 fhLayer:382 drawFireHeat:385 SNAPB:469 snapBanner:470 drawSnapBanner:471

## js/39-menu.js (286) — 
myLook:5 myColor:5 myKit:5 myName:6 renderMyHouse:9
§11 หน้าสร้าง/แต่งตัวละคร (2 ขั้น: 1 หน้าตา → 2 เลือกบ้าน)
crLib:12 crSaved:12 crKitSaved:12 crOpen:12 crStep:12 crTab:12 crFirst:12 crKitOnly:12 crSlot:12 CRTABS:13 sw_:14 bt_:15 nameBox_:16 crPanelSet:17 crRenderStep1:22 crRenderWand:33
§36 ขั้น 3: สาย + ชุดคาถา
ROLE_COL:37 roleTag:38 DESIGNED:39 spellTags:40 spellDescHTML:47 baseDescHTML:51 SB_THEME:59 ROLE_ORDER:68 sbFxRun:69 sbFxT:69 sbParts:69 crRenderKit:70 sbStartFx:99 sbFxTick:100 sbBurst:127 crAssign:133 crRenderHouse:142 crGo:149 crSaveName:161 crSetHouse:162 openCreator:163 closeCreator:173 lobbyKitSend:180
§222 ฉากเปิด (#intro) + ประกายบนหน้าเมนู (#menuFx)
TITLE:225 titleSpark:226 TSPR:228 titleSprite:229 titleDraw:230 titleLoop:240 titleGo:251 JOINQ:259 ovResult:279

## js/40-train-settings.js (256) — เมนูทดลอง (ห้องฝึก / Test Place)
trOpenF:2 trKey:2 trN:2 TR_OPTS:3 trToggle:4 trSend:9 trSync:14
§52 แท่นเสกบอท (โซนเสกบอท ห้องฝึก, trBotPad js/02): ยืนบนแท่น = เมนูขึ้น …
bpOpen:53 bpOn:53 bpKey:53 bpShow:55 bpSync:57 hovEl:127
§128 หน้าตั้งค่า
setRow:129 setTog:130 setTab:131 XHC:132 XHN:132 setOpts:133 SET_ICO:135 SET_EN:138 renderSettings:139 drawXhPrev:162 openSettings:163 closeSettings:165 modeIcon:221 modeTitle:222 renderLobby:223

## js/41-debug.js (220) — 
botBrain:6 _obsKeep:50 balArena:51 _balStash:54 balIsolate:55 balReset:58 balDuel:64 balTour:80 balTeamReset:95 balTeam:104 balCoop:132 balSpellTest:148
§169 Service Worker (sw.js): เก็บไฟล์เกมไว้ในเครื่อง เปิดครั้งต่อไปเร็วขึ้…
SWK:170 swSetup:171
§189 เช็คการ์ดจอตอนเปิดเกม
GPUC:192 gpuCheck:193

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
BF_LIFE:241 BF_FADE:241 BFM:242 BF_MK:243 BF_MKA:243 BF_MKR:243 bfMarkMesh:244 _bfQ:252 _bfQ2:252 _bfN:252 _bfUp:252 _bfS:252 _bfP:252 _bfMx:252 bfMark:254 bfAge:263 updateBfMarks:276 BFRS:281 bfRestPool:282 bfRestAdd:287 bfBinAdd:294 bfBinBuild:298 bfRest:303 bfScatter:309 _rockMat:317 bfCollapse:319 updateBfRest:326 bfClear:333
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

## js/48-ragdoll.js (409) — 
RAG:10 RAGJ:23 RAGB:29 RAGS:33 RAGMIN:37 RAGHINGE:39 _rv1:40 _rv2:40 _rv3:40 _rqa:40 _rqb:40 _rm:40 _ragFw:41 ragBones:42 ragBasis:49 ragTargets:57 ragStart:63 ragBack:96 ragFloor:97 ragStep:98 ragPose:163 ragWrite:178 ragRestore:190 ragEnd:194 ragTick:196 ragHideDead:240 clearDeathFades:249 deathSlashSplit:257 deathDissolve:310 deathVisualSync:385

## js/49-cloth.js (202) — 
CLOTH:10 CL_ROWS:26 CL_NC:26 CL_GAP:26 CL_IN:26 _clV:27 _clA:27 _clB:27 clPinK:29 clBind:31 cloakPanelGrid:33 cloakBodyIndices:47 stormCape:56 clothSetup:94 clTargets:123 clReset:127 clCapsule:131 _clO:135 clWorld:136 clWorldHit:144 clStep:149 clDraw:162 clothTick:183

## js/50-grass.js (421) — 
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
GR_NOISE:162 GR_LIVE:167 grLive:186 GR_GLSL_V:196 GR_BEGIN:201 grassMat:253 grassBuild:271 _grBasic:285 grassBake:286 grassCount:355 grassTick:360
§398 สกิลลม → หญ้า (ภาพล้วน เรียกจาก windEfx js/68)
WIND_GRASS:400 airWind:414

## js/51-warmup.js (286) — 
WARM:11 WARM_FXDIR:12 WARM_COMMON:12 WARM_SLICE:13 WARM_X:14 WARM_Y:14 warmKeep:16 warmStaticModels:22 glReady:31 warmCompile:32 warmDraw:35 WARM_SKIP:45 warmAssets:48 warmFx:58 warmFxEnd:69 warmGather:71 warmPaths:73 warmFrame:75 warmStep:77 warmQueue:129 WARM_LOBBY:135 warmLobbyTick:136 warmTick:143
§150 ภาพจากโค้ดของแต่ละสาย (เฟรมละฟังก์ชัน)
warmOutline:160
§177 อุ่นฉากเกมระหว่างรอในห้อง (ผู้ใช้ 2026-10-23: "กระตุกตอนเริ่มแมตช์แรก…
GWARM:182 gameWarmTick:183 gameWarmFree:216
§222 Shader never seen before mid-match: compile in the background, hide t…
SHR:230 shrLights:234 IMZ:239 imzPre:246 imzPost:248 shrRoot:249 shrCollect:250 shrPending:256 shReadyPre:260 shReadyPost:281

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

## js/63-skillwheel.js (317) — วงเลือกคาถา (ผู้ใช้ 2026-10-22, designs/ui-menu.md "วงคาถา + ห้าเหลี่ยม 4 ช่อง") • สไตล์ม…
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

## js/65-ui3.js (427) — UI รอบ 3 (ผู้ใช้ 2026-10-23 — สเปก designs/ui-menu.md "รอบ 3") • สไตล์เดียวกับเมนูใหม่ (c…
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

## js/66-hud4.js (226) — HUD รอบ 4 (ผู้ใช้ 2026-10-23, designs/hud-full-mock.html)
H4E:5 H4:15 h4God:16 h4Pal:17 hud4Col:19 h4Parts:21 h4AuBits:26 h4Key:41 h4Ico:42 h4Build:43 h4Set:73 hud4Draw:74
§132 ไพ่สกิล: นาฬิกาทราย / ท่าใช้ / สลับตำแหน่ง
h4Glass:134 h4Bits:140 h4Fx:142 h4CardUse:144 h4GlassOut:148 h4Place:152 h4OrdKey:155 h4OrdLoad:156 h4Swap:159 h4Pick:162 h4AltKey:164 h4CardWire:168
§179 ไพ่อัลติ
H4SH:181 h4UltCard:183 h4UltUse:188 hud4Frame:190 hud4Hide:191
§192 ไพ่อัลติกลางจอ (ผู้ใช้ 2026-11-01)
h4UltX:195
§202 รูปตัวละครเรา (FFA / TDM แทนแผนที่ย่อ)
H4PF:204 h4PfMode:205 h4PfAvatar:207 h4Portrait:209 h4PfRead:220 h4MapBox:226

## js/67-backdrop.js (141) — 
BACKDROP:8
§66 noise เล็ก ๆ (คงที่ต่อ seed)
bdHash:67 bdNoise:68 bdFbm:69 bdEdge:71 bdRing:73 bdPaint:79 bdTree:82 buildBackdrop:89 bdTower:137 backdropHide:141

## js/67-coast.js (326) — 
COAST:10 BD_LOD:14
§25 2D value noise (deterministic)
cvN:26 cvF:28
§29 overcast sky dome (shader: thick cloud deck on a flat layer, horizon …
COAST_SKY:30 coastSky:31 backdropLook:57
§68 land shape
coastShape:69 coastH:94
§107 height sources: one interface for the code coast (BACKDROP.fcs) and M…
coastSrcProc:110 BD_SURF:116 bdB64:117 bdRle:118 bdHsh:119 bdGridSrc:120 coastGrid:155 bdCoast:165 coastTreePts:255 coastTreeMesh:263
§295 near-edge detail bands (user 2026-11-23: backdrop next to the play ar…
bdNearKit:299

## js/68-darkness-view.js (1144) — 
nightWaltzStrip:2 nightWaltzBorder:80 stDarkVeilGround:118 darkFxMesh:195 drawDarknessHud:201 drawDarkHudBar:220 darknessMarkView:227 darkWaveViews:237 darkActiveViews:237 darkViewRoot:238 darkViewTemp:245 darknessClear:257 darkDeathRoots:265 darkDeathClear:268 darkWorldAt:282 darkMarkWind:285 darkMarkLaunch:313 darkMarkContact:325 darkViewNow:338 darkFlowHud:338 darkIdleWeaponPose:339 darkBAGroundImpact:343 darkSettleWeapon:358 darkBlendWeapon:369 darkShowWeaponReturn:392 darkTrailHistory:399 darkDashView:438 darknessCharacter:484 darknessEfx:727 stDarkShieldInk:1024 stDarkVeilBlade:1067 stWardDrainPool:1104

## js/68-light-view.js (1950) — 
LGV:7 LGSH:9 LGSH_L:11 _lgM4:14 _lgQ:14 _lgSV:14 _lgS:14 _lgC:14 _lgC2:14 lgGlowTex:15 lgNeon:17 lgEmpFx:25 lgWallBurn:44 lgShardSpawn:60 lgShardTick:64 lgBaCore:65 lgCrDim:108 lgEmpBeam:112 lgNeonCrystal:126 lgSanctumFloorTex:136 lgSanctumMoteTex:147 lgHoneyTex:162 lgShield:166 _lgShieldEuler:202 lightShieldEv:203 LGPOSE:206 _lgLeanBase:207 _lgLeanUndo:207 _lgGlass:208 _lgCore:208 _lgGeo:208 _lgEdge:208 _lgEdgeM:208 lgCrystalMesh:210 lgState:218 _lgV:219 _lgW:219 lgWorld:220 LG_ULT_ASSET:223 LG_CRYSTAL_ASSET:223 LG_ULT_INTRO:224 LG_ULT_ARRIVAL_FX:224 LG_ULT_TIME:225 lgUltMaterials:226 lgSovereignFinishes:227 lgSovereignMaterials:228 lgSovereignFinish:289 lgSovereignCrystal:310 lgSkinSovereign:319 lgPoseSovereign:372 lgSovereignHeart:448 LG_SASH_X:474 LG_SASH_Z:474 lgSovereignRibbon:475 lgSovereignFlare:534 LG_PALM_TRAVEL:547 LG_PALM_SCORCH_LIFE:548 LG_PALM_SCORCH_SLOTS:548 lgPalmGateOffset:549 lgSovereignPalmWaves:551 lgPosePalmWaves:560 lgPoseBeamWaves:566 lgSovereignPalmGate:578 lgSovereignScorchTrail:588 lgPalmScorch:616 lgSovereignCrossSparks:652 lgSovereignGather:675 lgSovereignWingCurrent:708 lgSovereignChargeSeal:737 lgSovereignChestRecoil:754 lgSovereignSeal:764 lgSovereignArmSigils:780 lgBuildSovereign:811 lgReturnMark:888 lgUltVisual:902 lgWardVisual:1139 _lgBeamM:1155 lgBeamMat:1156 lgSovereignChestBeam:1159 lgSovereignPalmBeam:1196 _lgLinkM:1266 lgLinkMat:1267 lgUnitTube:1270 lgTube:1271 lgAim:1279 lightFX:1280 lgBaseObjects:1523 lgClearBase:1524 lgClear:1525 lightDropView:1532 lgAllyEmpEnd:1538
§1542 เหตุการณ์
lgBlip:1544 lgArcFx:1548 lgFlyFx:1551 lgSovereignArrival:1552 lightFxTick:1591 LG_BLAST_EXPAND:1595 LG_BLAST_HOLD:1595 lgImpactDome:1596 lgBlastFloor:1636 lgBlastThreads:1667 lgFitGround:1695 lgGroundWarning:1704 lightEfx:1717 _lgHq:1874 _lgHy:1874 lgProcHead:1876 lightHeadPose:1891 LGHUD:1899 lgBondScreen:1900 drawCrystalBondHud:1901 drawLightHud:1924

## js/68-nature-art.js (171) — 
naturePlantArt:2 Turret:3 auraTextures:44 auraTex:45 LotusAura:88 glowWallTex:92 M_BUB:95 M_BUBRIM:96 M_DRIP:97 M_POOL:98 lotusPetalVeins:100 Lotus:127

## js/68-nature-fx.js (195) — 
_natFx:3 natFxClear:4 natFxMake:5 T:6 S:6 O:6 seed:7 ease:8 outQ:8 inQ:8 phase:8 tipW:9 ALL:10 mesh:11 STD:12 ADD:13 M:14 glowTex:31 GLOWT:32 GLOWG:32 GLOWP:32 GLOWV:32 glow:33 ring:34 Tube:36 TubeSet:55 V3:73 Thorns:75 thornsAlong:87
§91 อนุภาค
Pool:92 leafGeo:100 LEAF:101 SPK:102 DIRT:103 PUFF:104 CHIP:105 POOLS:106 leafCols:107 leaves:108 sparks:109 dirt:110 puff:111 chips:112 TrailRibbon:114 WHIP_N:125 WHIP_L:125 WHIP_LAG:125 Whip:126 CLIPS:189 tick:190 clip:191 drop:192 natFx:195

## js/68-nature-view.js (890) — 
NAT_VIEW:2 NAT_MARKS:2 NAT_MOTION:2 natV:3 natWorld:4 natPhase:5 natSmooth:6 natEase:7 natOut:8 natStd:9 natAdd:10 natMesh:11 natRing:12 natLeaf:16 natPlantM:19 natGlow:26 natArt:29 natureProjectileModel:31 natSet:37 natAnimate:38 natTube:39 natTrail:50 natSeed:68 natLotus:77 natBall:93 natPlantView:103 natStartStudy:113 natWearWall:131 natTreeGlow:154 natModelTick:174 natMarker:257 natMarks:268 natThorn:287 NAT_SHIELD_K:292 natShieldMake:293 natureCharacter:366 natOutlineMat:395 natOutline:399 natLinks:411 syncNature:426 natureClear:445 natDome:454 natMuzzle:476 natSlam:486 natHook:503 natCoil:560 _nfQ:581 _nfT:581 _nfX:581 natWandTip:583 HOOK_HIT:586 natPullQ:586 natPullE:586 _nwQ:587 natForearmR:589 natEmpPose:593 natBigSlam:601 natRootWarn:608 natRootUp:612 natThornLine:633 natRest:649 natHookFoePose:654 natHookPose:670 natHookArm:686 natShock:688 natSprout:689 natHealRims:690 natWhipHit:692 natBallRange:693 natSummon:695 NAT_TREE_GREEN:703 NAT_TREE_RED:703 _natGlowRed:704 natFoe:705 natTreeTint:706 natTreeAura:707 natAuraDrop:717 NAT_HOLO:719 natHoloMake:720 natHolo:731 natHoloClear:734 natDirOf:735 natMoment:736 natureEvent:765 NTHUD:833 drawNatureHud:834 NPH:855 NPH_IC:856 natPortraitObj:862 natPortrait:863 natPlantHud:875

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

## js/68-wind-view.js (440) — 
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
WWS:299 WWU:299 WW_NOISE:300 _wwMat:305 wwMats:306 wwFeatherGeo:352 WW_PRI:363 WW_COV:365 WW_RIB:366 _wwGeo:367 _wsupG:369 _wsupD:369 windSupDust:370 windSupDustTick:374 windWingSup:375 makeWindWings:396 wwCue:410 poseWindWings:414

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

## js/71-perfhud.js (126) — 
PERF:9 perfNetSample:11 perfNetSend:14 perfNetReceive:20 perfNetFrame:25 FRZ:40 frzAdd:42 frzOk:45 frzFrame:46 frzRecv:50 frzIn:52 frzNote:54 FRZ_NAME:58 frzRows:59 perfFrame:61 perfDom:76 perfStats:84 perfGraph:88 _gpuName:101 gpuIntegrated:102 perfRows:103 perfPanel:122 perfText:123

## js/72-dash-pose.js (85) — 
DPOSE:12 DPT:24 _dpQ:25 _dpX:25 _dpP:25 dpMix:26 dpKnees:28 dpStyle:36 DPDBG:41 dashPose:42 dpApply:75

## js/73-tune.js (141) — 
TUNE:8 tuneNum:9 tuneBuild:15
§80 ใช้ / เก็บค่า
tuneSetVal:81 tuneApplyFile:84 tuneJson:88
§91 หน้าตา
tuneOpenF:96 tuneFmt:97 tuneRow:98 tuneRefresh:101 tuneMsg:109 tuneToggle:110 tuneEdit:114
§138 API สำหรับเครื่องมือแยก tune.html (เปิดเกมใน iframe แล้วเรียกผ่าน WD)
tuneDump:139 tuneSetKey:140

## js/74-look.js (90) — 
LOOK:17 lookPreset:34 lookMap:36 lookName:37 lookEnvFor:38 lookApply:48 lookRays:64 _lkV:69 lookRaysFrame:71 lookRefresh:78
§79 ลงทะเบียนในเครื่องมือปรับค่า (js/73-tune.js): 1 หมวด "🌗 Look" แยกส่ว…
LOOK_F:80 lookRegister:86

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
DEVD_R:212 devBrkFix:213 devPnlFix:214 devPropFix:218 devSkinFix:219 devDestroy:224
§258 ภาพซ้อนไว้ดูแมพ: กล่องชน (OBS) + วงเขตยึด/จุดเกิดปลอดภัย
_dvCyl:259 _dvMat:260 devOverlay:261
§281 2D overlay map: spawn zones + capture zones + players (click = warp)
_dvMap:282 _dvY:286 devMapDraw:287

## js/77-paint.js (291) — 
PAINT:12 paintOn:22 paintMap:24 paintLights:33
§42 VFX สีสด (ทดลอง): บนแมพสว่าง เอฟเฟกต์เรืองแสงเดิมซีดเป็นขาว-เหลืองอ่อ…
_ptHSL:43 paintVivid:44 paintVfx:46
§56 ไฟก้อนหลอมรวม (blob / metaball) — ภาพอ้างอิงผู้ใช้ 2026-11-11: ไฟเป็น…
BLOB:58 blobPre:59 blobFire:60 paintGrass:82
§83 ภาพผิว: เปลือกไม้ (ครึ่งซ้าย) + ใบไม้ปาดพู่กัน 4 แบบ (ครึ่งขวา 2×2)
paintAtlas:84 paintStrokeTex:108
§116 ต้นไม้
paintTreeGeo:117 paintCanopy:160 paintKit:164
§187 ลายพู่กันบนผิว (ต่อท้าย onBeforeCompile เดิมของวัสดุ เหมือน js/76)
PT_VS:188 PT_VS_BODY:189 PT_FS:190 PT_FS_BODY:191 PT_CEL_RE:200 PT_CEL_CHUNK:201 paintPatch:204 paintApply:219 paintSweep:221
§222 ฉากของแมพ (เรียกจาก buildFileMap ก่อน brkSetup/batchStatic)
paintScene:223 paintShafts:238
§249 ฟิลเตอร์ภาพวาด (Kuwahara 4 ทิศ, 64 จุด) — เลือกค่าเฉลี่ยของมุมที่สีเร…
§275 ปรับค่า (tune.html / F8)

## js/78-dev-ui.js (243) — Dev Mode UI (user 2026-11-20): one floating window, many small column…
§10 orbit camera
devOrbPick:11 devOrbToggle:23 devOrbCam:28
§42 video recording
REC:43 _dvBadge:44 devRecStart:45 devRecStop:60 devRecFrame:62 devRecSave:67 devRecAuto:83 devAutoTick:87
§94 window
_dvPanel:95 _dvBtn:98 _dvBody:100 _dvHead:100 devUiApply:102 devFreeMouse:110 devToggle:111 devF2:116 devGrave:121
§130 rows
dvA:131 dvTg:132 dvB:133 dvCh:134 dvSl:135 dvSub:136 dvCol:137 devKeyOf:138 devRender:143 devPos:193 devUiAct:200

(116 files, 35062 lines)
