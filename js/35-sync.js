// ---------- ซิงก์ผู้เล่น/ศัตรู/ลูกเวทจาก snapshot + ฉายตำแหน่งลงจอ (ป้ายชื่อ/ตัวเลข/เป้าเล็ง) ----------
// ---------- ท่าร่ายคาถาแบบนักเวทในหนัง Harry Potter (ผู้ใช้ 2026-10-22: "ยิงปกติทุกสายให้ดูเหมือนนักเวทกำลังร่าย") ----------
// o.cpT นับถอยหลัง (ตั้งจาก event cast / stri / epunch) • o.cpS = ท่า: 0 ฟันเฉียงจากบนขวา 1 วนข้อมือแล้วสะบัด (swish & flick) 2 แทงตรง
//   3 พุ่งแทงแรง (ปล่อยลูกไฟชาร์จ / ก้อนน้ำแข็ง) 4 ฟาดจากเหนือหัว (สายฟ้าสามเหลี่ยม) 5 ชี้สั่ง (สายดินสั่ง Stand ต่อย)
// จังหวะ: ง้าง 25% → ฟาดเร็ว 30% → ตามแรง/คืนท่า • แขนขวาถือไม้ ตัวบิดหันไหล่ขวาเข้าหาเป้า เอนตัว มือซ้ายกางทรงตัว • ยืนนิ่ง = ก้าวขาเล็กน้อย
// ภาพอย่างเดียว (ดาเมจ/จังหวะยิงของ host ไม่เปลี่ยน) • ทำงานกับโมเดลไฟล์: เรียกหลัง rigStd → แขนซ้าย/ขาตามโค้ด
const CPOSE_T=0.46,_ce=t=>1-Math.pow(1-t,3),_cs=t=>t*t*(3-2*t),_cb=t=>{const u=t-1;return 1+2.5*u*u*u+1.5*u*u;};   // _cb = ฟาดเลยเป้านิดแล้วเด้งกลับ (มีน้ำหนัก)
// ผู้ใช้ 2026-10-22 รอบ 2: "เหวี่ยงมากขึ้นกว่านี้หน่อย" → ขยายระยะท่าจากท่ายืนปกติ [แขนขวา x, z, บิดตัว, เอนตัว, แขนซ้าย x, z, (เอียงข้าง, ย่อตัว)]
const _caJ=[0,0,0,0,0,0,0,0],_caJ0=[0,0,0,0,0,0,0,0];
// free (left) arm counters the torso twist like a thrower: right shoulder comes forward -> left arm pulls back/out, and the
// reverse on the wind-up. dTw = twist away from where the cast started. Nature keeps its own authored arms.
const CTWIST={x:.6,z:.22,max:.9};
function counterArm(o,T,rest,w,skip){if(skip||o.posePath===NATUREP)return;const d=clamp(T[2]-rest[2],-CTWIST.max,CTWIST.max);T[4]+=CTWIST.x*d*w;T[5]+=CTWIST.z*d*w;}
const AMP_B=[1.25,1.35,1.75,1.6,1.3,1.3],AMP_S=[1.2,1.3,1.6,1.5,1.2,1.2,1.6,1.4];
const CP_BEND=[0.13,0.05,0.06,0.09,0.04,0.07,-0.13,-0.1];   // เอียงตัวตามทิศเหวี่ยงของแต่ละท่า (ยิงปกติ)
//          [แขนขวา x, แขนขวา z, บิดตัว, เอนตัว, แขนซ้าย x, แขนซ้าย z] ของ ง้าง / ฟาด / ตามแรง
const CPOSE=[
  [[-2.7,-0.75,-0.4,-0.06,-0.5,0.45],[-1.3,0.3,0.3,0.12,0.3,0.7],[-1.45,0.05,0.12,0.05,0.1,0.5]],
  [[-1.75,-0.35,-0.15,0,-0.35,0.35],[-1.4,-0.05,0.15,0.08,0.15,0.55],[-1.5,-0.1,0.05,0.03,0,0.4]],
  [[-1.15,-0.5,-0.5,-0.08,-0.6,0.3],[-1.62,-0.02,0.22,0.18,0.4,0.6],[-1.55,-0.08,0.08,0.08,0.15,0.45]],
  [[-1.0,-0.6,-0.6,-0.12,-0.8,0.35],[-1.65,0,0.32,0.3,-1.55,-0.3],[-1.6,-0.05,0.12,0.15,-1.3,-0.15]],   // 3 = ท่าใหญ่: มือซ้ายดันออกไปพร้อมไม้ (สองมือ)
  [[-3.05,-0.15,-0.15,-0.15,-0.3,0.4],[-0.9,0.05,0.1,0.25,0.3,0.6],[-1.2,-0.05,0.05,0.1,0.1,0.45]],
  [[-1.2,-0.7,-0.5,-0.05,-0.4,0.4],[-1.7,-0.1,0.35,0.15,0.4,0.7],[-1.6,-0.15,0.15,0.08,0.2,0.5]],
  [[-2.2,0.55,0.45,-0.04,-0.3,0.7],[-1.35,-0.55,-0.3,0.12,-0.5,0.25],[-1.45,-0.35,-0.1,0.05,-0.3,0.35]],
  [[-0.55,-0.35,0.55,-0.06,0.55,1.15],[0.35,-0.75,-0.6,0.2,-1.7,-0.3],[0.15,-0.5,-0.3,0.1,-1.45,-0.05]]];   // 7 = Fire: throw with the burning LEFT hand (user 2026-11-24): load out-side-back, whip forward across + twist, wand arm swings back   // 6 = ฟันย้อนมือ (backhand) จากบนซ้ายไปขวา — สลับกับท่า 0 ให้ยิงปกติเหวี่ยงซ้าย-ขวา
const _cpT=[0,0,0,0,0,0],_cpR=[0,0,0,0,0,0];
const CP_STEP=[0,0,0.7,1,0.4,0.8,0.3,0.9];   // ก้าวขา (ยืนนิ่ง) ของแต่ละท่า
const CPCOL=['#ffb347','#bfeaff','#ffe27a','#c9a46a','#c9a46a','#c9a46a','#d8b46a'];   // สีหางแสงปลายไม้ตามสาย (pyro frost storm … earth)
function castStyle(t,n){if(t==='iceboulder')return [0,6][n%2];   /* Frost ยิงไกลเสริม: มือเดียว สลับฟาดขวา-ย้อนซ้าย (ผู้ใช้ 2026-11-16 ไม่เอาสองมือ) */if(t==='pfire'||t==='pfireb')return 3;if(t==='icicle'||t==='b_frost')return [0,6,2][n%3];return [0,6,2,0,6,1][n%6];}   // ยิงปกติ: ฟันขวา→ย้อนมือซ้าย→แทง... สลับไปมา
function castStart(o,t,style){o.castN=(o.castN|0)+1;o.cpS=style===undefined?(o.posePath===0&&(t==='pfire'||t==='pfireb')?7:castStyle(t,o.castN)):style;o.cpT=CPOSE_T;o.caN=null;}
// ---------- ท่าร่ายสกิล / อัลติ / โล่ (ผู้ใช้ 2026-10-22: "เกือบทุกสกิลควรมีการเหวี่ยงไม้คทา ... บิดเอวบิดตัว ... ท่าใหญ่ใช้ 2 มือ")
// host ส่ง event {k:'sk',id,s:สกิล} ตอนร่ายสำเร็จ → SKANIM เลือกท่า • สกิลที่มีท่าของตัวเองในไฟล์สายอยู่แล้ว (Kindle, Dragonfall,
// Ignition Snap, Railgun, Triple Strike, ร่างเทพ, Frost ลอยอาวุธ, สายดินสั่ง Stand) ไม่ใส่ที่นี่ — ไฟล์สายรันทีหลังจึงทับท่านี้อยู่แล้ว
// ช่อง: [เวลา 0–1, แขนขวา x, แขนขวา z, บิดตัว, เอนตัว, แขนซ้าย x, แขนซ้าย z, ตัวเอียงข้าง, ย่อตัว, ease('o'=ฟาดเร็ว 's'=นุ่ม)]
// แขน x: ติดลบ = ยกไปหน้า/ขึ้น (-1.57 ชี้ตรง, -3 ชูเหนือหัว) • แขนขวา z บวก = ข้ามตัวไปซ้าย • แขนซ้าย z ลบ = ข้ามตัวไปขวา
const CANIM={
  staffup:{d:0.42,st:0.7,tr:[0.2,0.7],k:[[0.35,-2.9,-0.1,0.2,-0.14,-0.5,0.2,0,0.06,'o'],[0.7,-3.05,0,0,-0.18,-0.45,0.2,0,0.1,'s'],[1,-1.3,0.1,0,0,-0.3,0.15,0,0,'s']]},   // Lightning: staff thrown up as it grows
  natthrow:{d:.62,st:0,k:[[.22,.12,-.40,-.45,.08,-.65,.48,.05,-.04,'s'],[.38,.12,-.39,-.05,.16,-1.66,.16,-.06,-.03,'o'],[.66,.11,-.37,-.12,.10,-1.2,.35,-.04,-.035,'s'],[1,.12,-.40,-.48,0,-.25,.28,0,0,'s']]},
  natraise:{d:.85,st:0,k:[[.21,.14,-.40,-.44,.22,-.62,.49,.07,-.11,'s'],[.48,.10,-.37,-.12,.06,-2.04,.23,-.08,-.04,'o'],[.72,.13,-.38,-.19,.04,-1.36,.28,-.04,-.035,'s'],[1,.13,-.40,-.47,0,-.25,.28,0,0,'s']]},
  natsummon:{d:1.3,st:.62,tm:[.45,.64],k:[[.25,.15,-.41,-.49,.17,-.44,.46,.07,-.13,'s'],[.58,.12,-.37,-.37,-.13,-2.55,.39,-.04,-.04,'s'],[.70,.08,-.39,-.06,.21,-1.36,.27,-.09,-.12,'o'],[.88,.12,-.39,-.28,.06,-.85,.32,-.04,-.035,'s'],[1,.13,-.4,-.48,0,-.25,.28,0,0,'s']]},
  natspell:{d:.66,st:.25,tr:[.14,.43],k:[[.15,-1.43,-.47,-.56,-.07,-.25,.27,.07,-.03,'s'],[.33,-1.01,-.06,-.24,.23,-.39,.31,-.06,-.07,'o'],[.62,-.88,-.19,-.36,.10,-.38,.32,-.02,-.04,'s'],[1,.10,-.39,-.48,0,-.25,.27,0,0,'s']]},
  sweep:{two:1,d:0.6,st:0.5,tr:[0.2,0.7],k:[[0.25,-1.5,0.9,0.6,0.05,-0.6,0.9,0.05,-0.05,'s'],[0.55,-1.5,-1.2,-0.7,0.1,-1.3,0.2,-0.08,-0.12,'o'],[1,-1.3,-0.9,-0.5,0.05,-0.8,0.5,-0.04,-0.08,'s']]},   // กวาดกว้างแนวนอน (Ring of Embers)
  powerup:{d:0.7,st:0,tr:null,k:[[0.35,0.3,-0.5,0,0.35,0.3,0.5,0,-0.2,'s'],[0.6,-0.9,-1.3,0,-0.2,-0.9,1.3,0,0.05,'o'],[1,-0.6,-0.9,0,-0.1,-0.6,0.9,0,0,'s']],tm:[0.05,0.35]},   // ย่อเกร็ง แล้วกางแขนอกผาย (เพิ่มพลังตัวเอง)
  // Inferno Nova (ผู้ใช้ 2026-11-14): ย่อรวบพลัง → ชูไม้ตรงขึ้นฟ้าค้างไว้ระหว่างปลายไม้ชาร์จ (0.8 วิ) → ดันขึ้นสุดตอนระเบิด แขนซ้ายกางออก → คืนท่า
  // Mirror Legion ท่าร่าย 1.5 วิ (ผู้ใช้ 2026-11-14 เลือกแบบ 1):
  mlraise:{d:1.0,st:0.3,tr:null,k:[[0.12,-1.55,0.1,0.1,0.06,-0.8,0.6,0,0,'o'],[0.8,-1.6,0.08,0,0.04,-0.8,0.6,0,0,'s'],[1,-1.2,0.1,0,0.05,-0.4,0.2,0,0,'s']]},   // ผู้ใช้ 2026-11-16: ไม่ชูมือแล้ว ชี้ไปข้างหน้าสั่งดาบหมุนแยกเป็น 3 เลย   // 1 ชูมือ (ดาบลอยขึ้นชาร์จ) แล้วชี้ไปข้างหน้าสั่งดาบหมุนแยกเป็น 3
  novaup:{d:1.9,st:0.4,tr:[0.06,0.2],k:[[0.08,-0.5,0.25,0.25,0.18,-0.4,0.3,0,-0.16,'s'],[0.17,-3.1,0.04,0,-0.12,-0.7,0.55,0,0.04,'o'],[0.62,-3.12,0.02,0,-0.16,-0.75,0.6,0,0.06,'s'],[0.67,-3.3,0,0,-0.26,-1.5,1.1,0,0.1,'o'],[0.84,-3.0,0.05,0,-0.14,-1.1,0.8,0,0.04,'s'],[1,-1.2,0.1,0,0,-0.4,0.2,0,0,'s']],tm:[0.17,0.62]},
  ultraise:{two:1,d:1.0,st:1,tr:[0.3,0.8],k:[[0.3,-0.5,0.35,0.15,0.25,-0.5,-0.35,0,-0.18,'s'],[0.6,-3.0,0.15,0,-0.25,-3.0,-0.15,0,0.08,'s'],[0.75,-1.2,0.2,0.05,0.4,-1.2,-0.2,0,-0.15,'o'],[1,-1.0,0.1,0,0.25,-1.0,-0.1,0,-0.1,'s']],tm:[0.45,0.6]},   // อัลติ: สองมือรวบไม้ ชูขึ้นฟ้า แล้วฟาดลง
  rend:{d:0.55,st:0.7,tr:[0.25,0.7],k:[[0.3,0.4,-0.6,-0.4,0.2,-0.5,0.5,0.06,-0.15,'s'],[0.6,-2.4,0.4,0.45,-0.1,-0.2,0.7,-0.05,0.02,'o'],[1,-2.0,0.2,0.3,-0.05,-0.3,0.6,0,0,'s']]},   // ตวัดจากพื้นต่ำขวาขึ้นบนซ้าย
  slam:{two:1,d:0.6,st:0.6,tr:[0.3,0.6],k:[[0.35,-3.0,0.1,0,-0.2,-3.0,-0.1,0,0.05,'s'],[0.55,-0.6,0.25,0,0.55,-0.6,-0.25,0,-0.35,'o'],[1,-0.7,0.2,0,0.4,-0.7,-0.2,0,-0.25,'s']]},   // สองมือชูแล้วทุบพื้น ย่อตัวลึก
  wrap:{d:0.55,st:0,tr:null,k:[[0.45,-1.4,0.9,0,0.3,-1.4,-0.9,0,-0.2,'s'],[1,-1.2,0.7,0,0.25,-1.2,-0.7,0,-0.15,'s']],tm:[0.1,0.5]},   // ไขว้แขนกอดอก ห่อตัว (Cryo Shell)
  forge:{d:0.6,st:0,tr:[0.1,0.65],k:[[0.3,-1.3,0.3,0.2,0.1,-1.2,0,0,-0.05,'s'],[0.65,-2.6,0.1,0.1,-0.05,-1.5,0.1,0,0.05,'o'],[1,-2.2,0.1,0.1,0,-1.2,0.2,0,0,'s']],ci:[0,0.3]},   // แบมือซ้าย วนไม้เหนือมือ แล้วดึงขึ้น (สร้างอาวุธ)
  line:{d:0.5,st:1,tr:[0.3,0.6],k:[[0.3,0.2,-0.4,-0.55,-0.1,-1.0,0.2,0,-0.08,'s'],[0.55,-1.62,0,0.35,0.3,-0.3,0.8,0,-0.12,'o'],[1,-1.55,-0.05,0.15,0.15,-0.2,0.6,0,-0.05,'s']]},   // ดึงไม้ไปข้างหลัง ก้าว แล้วแทงยาวไปหน้า
  siphon:{d:0.7,st:0,tr:null,k:[[0.35,-2.2,-0.6,-0.35,-0.2,-1.6,0.1,0.05,0,'s'],[0.75,-2.0,-0.7,-0.3,-0.25,-1.4,-0.1,0.05,0,'s'],[1,-1.6,-0.4,-0.15,-0.1,-1.0,0.2,0,0,'s']],tm:[0.3,0.8]},   // มือซ้ายกางดูด ไม้ยกไว้หลัง เอนตัวต้าน
  orbs:{d:0.6,st:0.4,tr:[0.05,0.7],k:[[0.45,-2.9,-0.1,0,-0.1,-0.5,0.6,0,0,'s'],[0.7,-1.6,-0.05,0.25,0.15,-0.4,0.6,0,-0.05,'o'],[1,-1.5,-0.1,0.1,0.05,-0.3,0.5,0,0,'s']],ci:[0.05,0.45]},   // วนไม้เหนือหัวแล้วชี้ไปหน้า
  upflick:{d:0.45,st:0.3,tr:[0.25,0.7],k:[[0.3,-0.6,-0.5,-0.4,-0.1,-0.5,0.5,0.05,-0.15,'s'],[0.6,-2.8,-0.2,0.3,-0.25,-1.6,0.3,-0.05,0.1,'o'],[1,-2.4,-0.1,0.15,-0.15,-1.2,0.4,0,0.05,'s']]},   // ย่อแล้วสะบัดไม้ขึ้นฟ้า (Kindle)
  snap:{d:1.15,st:0.2,tr:null,k:[[0.16,-3.0,0.38,0.08,-0.08,-0.4,0.3,0.04,0.02,'o'],[0.5,-3.05,0.42,0.08,-0.1,-0.4,0.3,0.04,0.03,'s'],[0.56,-3.25,0.5,0.1,-0.16,-0.5,0.35,0.06,0.06,'o'],[0.78,-3.05,0.42,0.08,-0.1,-0.4,0.3,0.04,0.03,'s'],[1,-1.2,0.1,0,0,-0.3,0.15,0,0,'s']],tm:[0.16,0.5]},   // Ignition Snap (ผู้ใช้ 2026-11-14): ชี้มือขึ้นฟ้าเฉียงซ้ายนิด ๆ ค้างระหว่างเตรียม แล้วกระตุกดีดตอนระเบิด
  pullback:{d:0.65,st:0.6,tr:null,k:[[0.4,-0.9,-0.7,-0.6,-0.1,-1.3,-0.2,0.06,-0.12,'s'],[1,-1.2,-0.5,-0.4,-0.05,-1.45,-0.1,0.04,-0.08,'s']],tm:[0.3,1]},   // ดึงไม้ไปข้างหลัง มือซ้ายเล็ง เกร็งสั่น (ท่าชาร์จ: Railgun / Terra Auger)
  summon3:{d:0.8,st:0,tr:[0.3,0.75],k:[[0.3,-1.5,0.6,0,0.1,-1.5,-0.6,0,-0.15,'s'],[0.65,-2.2,-1.2,0,-0.15,-2.2,1.2,0,0.08,'o'],[1,-1.9,-1.0,0,-0.1,-1.9,1.0,0,0.04,'s']]},   // สองมือรวบหน้าอก แล้วกางออกเรียกของ (Mirror Legion)
  punchcmd:{d:0.55,st:1,tr:[0.3,0.6],k:[[0.3,-1.0,-0.6,-0.6,-0.1,-1.2,0.3,0.05,-0.1,'s'],[0.5,-1.65,0.05,0.5,0.25,0.2,0.7,-0.06,-0.14,'o'],[1,-1.55,0,0.3,0.12,0,0.6,-0.03,-0.08,'s']]},   // บิดตัวแล้วแทงไม้สั่งต่อย มือซ้ายดึงกลับ (Stonebreaker)
  rampcast:{d:0.9,st:0,tr:[0.47,0.62],k:[[0.13,-0.75,-0.45,0.22,0.1,-2.3,0.7,0.04,-0.04,'s'],[0.2,-0.65,-0.35,0.12,0.24,-0.6,0.3,0,-0.12,'i'],[0.36,-0.6,-0.35,0.1,0.26,-0.56,0.3,0,-0.13,'s'],[0.44,-0.55,-0.3,0.1,0.28,-0.52,0.3,0,-0.14,'s'],[0.53,-2.85,-0.2,0,-0.06,-2.9,0.25,0,0.03,'o'],[1,-2.3,-0.15,0,-0.02,-2.3,0.2,0,0,'s']],tm:[0.36,0.46],j:[[0.13,0.5,0.4,1.5,-0.4,0.15,0.14,-0.14],[0.2,1.2,1.0,0.75,-0.9,-0.05,0.22,-0.22],[0.44,1.3,1.1,0.8,-0.95,-0.08,0.22,-0.22],[0.53,0.25,0.18,0.6,-0.35,0.2,0.16,-0.16],[1,0.15,0.1,0.5,-0.25,0.15,0.12,-0.12]]},   // Rampart: ตบพื้นแล้วยกขึ้น (เข่าย่อ ศอกซ้ายงอ)
  ground:{d:0.6,st:0.5,tr:[0.3,0.6],k:[[0.35,-2.6,-0.3,0.2,-0.1,-0.8,0.6,0,0.05,'s'],[0.6,-0.5,-0.1,-0.1,0.45,-0.5,0.5,0,-0.3,'o'],[1,-0.6,-0.1,0,0.35,-0.5,0.5,0,-0.2,'s']]},   // ฟาดไม้ลงพื้นตรงหน้า ย่อตัว (Mud Swamp)
  clap:{d:0.6,st:0.4,tr:[0.3,0.6],k:[[0.35,-1.5,-1.3,0,-0.05,-1.5,1.3,0,-0.05,'s'],[0.55,-1.5,0.5,0,0.15,-1.5,-0.5,0,-0.15,'o'],[1,-1.4,0.35,0,0.1,-1.4,-0.35,0,-0.1,'s']],tm:[0.55,0.9]},   // กางแขนกว้างแล้วบีบเข้าหากัน (Tectonic Crush บีบ)
  burst:{d:0.55,st:0,tr:[0.3,0.65],k:[[0.35,-0.9,0.8,0,0.3,-0.9,-0.8,0,-0.25,'s'],[0.55,-2.0,-1.3,0,-0.25,-2.0,1.3,0,0.1,'o'],[1,-1.6,-1.0,0,-0.1,-1.6,1.0,0,0.03,'s']]},   // ห่อตัวแล้วระเบิดกางออก (Dust Burst)
  skycall:{d:0.65,st:0.6,tr:[0.3,0.65],k:[[0.35,-3.1,-0.2,-0.05,-0.2,-0.6,0.5,0,0.05,'s'],[0.6,-1.3,0.1,0.3,0.3,-0.5,0.6,0,-0.12,'o'],[1,-1.4,0.05,0.15,0.15,-0.4,0.5,0,-0.06,'s']]},   // ชูไม้เรียกฟ้า แล้วฟาดชี้ลงจุดเป้า (Triple Strike)
  wallpush:{two:1,d:0.65,st:0.8,tr:[0.3,0.6],k:[[0.3,-0.7,0.3,0.1,-0.15,-0.7,-0.3,0,-0.08,'s'],[0.55,-1.65,0.15,0,0.25,-1.65,-0.15,0,-0.12,'o'],[1,-1.5,0.1,0,0.15,-1.5,-0.1,0,-0.06,'s']]},   // สายลม Aegis Gale ดัน: ง้างสองมือ แล้วผลักไม้ไปข้างหน้า
  vxpull:{d:1.3,st:0.8,tr:null,k:[[0.1,-1.57,-1.05,1.15,0,-0.4,0.5,0,-0.06,'o'],[0.6,-1.6,-1.1,1.15,0.02,-0.45,0.55,0,-0.08,'s'],[0.7,-1.0,0.75,0.55,-0.14,-0.9,0.3,0,-0.12,'o'],[1,-0.9,0.6,0.4,-0.08,-0.7,0.4,0,-0.08,'s']],tm:[0.15,0.55]},   // สายลม Vortex Bind (ผู้ใช้): ชี้ไม้ไปข้างหน้า ตัวหมุนซ้าย ~70° แขนขวาเหยียดตรง → ตอนดึง (0.6 วิ) พับแขนมาหน้าตัวเหมือนออกแรงดึง
  dome:{two:1,d:0.7,st:0,tr:[0.3,0.75],k:[[0.35,0.2,-0.5,0,0.3,0.2,0.5,0,-0.25,'s'],[0.7,-2.6,-0.8,0,-0.2,-2.6,0.8,0,0.08,'o'],[1,-2.3,-0.7,0,-0.1,-2.3,0.7,0,0.04,'s']]},   // สองมือต่ำแล้วยกกางขึ้นเป็นโดม
};
// ท่าเฉพาะธาตุ: ง้าง/ปล่อย/ตามแรง/คืนท่า ไม่เปลี่ยนเวลาคาถาหรือการเคลื่อนที่ของ host
Object.assign(CANIM,{
  tidecall:{d:0.95,st:0.2,ci:[0.05,0.55],k:[[0.25,-1.8,-0.7,-0.35,-0.08,-1.15,0.45,0.04,-0.08,'s'],[0.6,-2.65,0.15,0.25,-0.12,-1.7,-0.35,-0.04,0.02,'s'],[0.78,-1.7,-0.1,0.08,0.08,-1.35,0.15,0,-0.04,'o'],[1,-1.35,-0.1,0,0,-0.6,0.35,0,0,'s']]},
  wavecast:{d:0.8,st:0.9,tr:[0.05,0.65],k:[[0.15,-1.4,0.8,0.55,-0.08,-1.0,0.55,0.08,-0.12,'s'],[0.43,-1.55,-1.0,-0.65,0.22,-1.4,-0.5,-0.09,-0.17,'o'],[0.7,-1.5,-0.7,-0.3,0.1,-0.9,-0.3,-0.04,-0.04,'s'],[1,-1.0,-0.1,-0.05,0,-0.3,0.25,0,0,'s']]},
  cagecast:{d:0.68,st:0.75,k:[[0.14,-1.05,-0.5,-0.4,-0.12,-1.2,0.35,0.04,-0.1,'s'],[0.32,-1.65,-0.02,0.28,0.2,-1.4,-0.2,-0.04,-0.15,'o'],[0.7,-1.5,-0.05,0.1,0.08,-0.9,0.1,0,-0.05,'s'],[1,-1.0,-0.1,0,0,-0.35,0.3,0,0,'s']]},
  moonarts:{d:1.0,st:0.25,tr:[0.05,0.65],ci:[0.05,0.55],k:[[0.25,-1.6,0.7,0.4,-0.08,-1.5,-0.6,0.04,-0.08,'s'],[0.6,-2.45,-0.35,-0.3,-0.12,-1.8,0.4,-0.06,0.02,'s'],[0.8,-1.55,-0.05,0.1,0.1,-1.45,-0.25,0,-0.08,'o'],[1,-1.0,-0.1,0,0,-0.4,0.3,0,0,'s']]},
  dragoncall:{d:1.0,st:0.65,tr:[0.1,0.65],k:[[0.22,-1.1,-0.6,-0.35,0.18,-1.3,0.55,0.06,-0.18,'s'],[0.6,-3.05,-0.1,0.2,-0.18,-2.1,0.35,-0.04,0.07,'s'],[0.8,-2.2,-0.15,0.1,-0.08,-1.65,0.1,0,0.02,'o'],[1,-1.65,-0.1,0,0,-1.1,0.35,0,0,'s']]},
  dragoncommand:{d:0.8,st:0.8,tr:[0.1,0.5],k:[[0.16,-2.6,-0.25,-0.2,-0.12,-1.3,0.4,0,-0.04,'s'],[0.38,-0.95,-0.05,0.25,0.35,-0.7,0.25,-0.05,-0.22,'o'],[0.7,-1.25,-0.05,0.12,0.16,-0.55,0.3,0,-0.08,'s'],[1,-1.0,-0.1,0,0,-0.3,0.3,0,0,'s']]},
  fireflare:{d:0.85,st:0.2,k:[[0.22,-0.55,0.7,0.15,0.24,-0.55,-0.7,0,-0.24,'s'],[0.48,-2.0,-0.9,-0.12,-0.22,-2.0,0.9,0,0.08,'o'],[0.75,-1.5,-0.55,-0.05,-0.06,-1.5,0.55,0,0.02,'s'],[1,-0.8,-0.15,0,0,-0.4,0.35,0,0,'s']]},
  frostbreath:{d:0.9,st:0,k:[[0.25,-1.3,0.85,0,0.15,-1.3,-0.85,0,-0.13,'s'],[0.52,-2.05,-0.75,0,-0.16,-2.05,0.75,0,0.03,'s'],[0.78,-1.55,-0.5,0,-0.05,-1.55,0.5,0,-0.03,'s'],[1,-0.8,-0.1,0,0,-0.45,0.3,0,0,'s']]},
  godcall:{d:0.9,st:0.6,k:[[0.2,-1.0,-0.4,-0.25,0.12,-0.6,0.4,0.03,-0.15,'s'],[0.5,-3.1,-0.1,0,-0.2,-1.8,0.5,0,0.08,'o'],[0.73,-2.0,-0.55,0.2,-0.12,-1.75,0.65,-0.04,0.04,'o'],[1,-1.0,-0.2,0,0,-0.65,0.35,0,0,'s']]},
  windlaunch:{d:0.72,st:0.8,k:[[0.2,-0.6,-0.5,-0.2,0.28,-0.65,0.5,0,-0.25,'s'],[0.4,-1.7,-0.1,0.15,0.4,0.5,0.5,-0.03,-0.1,'o'],[0.75,-1.2,-0.2,0.05,0.16,0.3,0.4,0,-0.08,'s'],[1,-1.0,-0.1,0,0,-0.3,0.3,0,0,'s']]},
  wingrise:{d:0.9,st:0.35,k:[[0.22,-0.7,0.6,0,0.2,-0.7,-0.6,0,-0.2,'s'],[0.52,-1.75,-1.0,0,-0.15,-1.75,1.0,0,0.07,'o'],[0.76,-1.4,-0.6,0,-0.04,-1.35,0.6,0,0.03,'s'],[1,-1.0,-0.25,0,0,-0.7,0.4,0,0,'s']]},
  windvoid:{d:0.75,st:0.7,ci:[0.03,0.3],k:[[0.2,-1.2,-0.7,-0.5,-0.12,-1.4,0.25,0.06,-0.12,'s'],[0.42,-1.68,-0.05,0.35,0.25,-1.0,-0.4,-0.06,-0.15,'o'],[0.72,-1.5,-0.12,0.16,0.08,-0.6,0.2,-0.02,-0.04,'s'],[1,-1.0,-0.1,0,0,-0.3,0.3,0,0,'s']]},
  heavenslam:{d:3.1,st:0.8,two:[0,0.36],k:[[0.20,-3.0,0.1,0,-0.14,-2.6,-0.1,0,0.04,'s'],[1/3.1,-0.7,0.15,0.1,0.45,-0.8,-0.1,0,-0.28,'o'],[0.45,-1.35,0.35,0,0.1,-1.35,-0.35,0,-0.12,'s'],[0.7,-1.5,0.7,0,0.2,-1.5,-0.7,0,-0.2,'s'],[2.38/3.1,-1.9,-0.8,0,-0.18,-1.9,0.8,0,0.05,'o'],[1,-1.0,-0.1,0,0,-0.4,0.3,0,0,'s']]},
  wingflick:{d:0.95,st:0.6,k:[[0.25,0.15,-0.6,-0.1,-0.18,0.15,0.6,0,-0.12,'s'],[0.4,-1.75,-0.05,0.12,0.28,-1.65,0.05,0,-0.18,'o'],[0.7,-1.35,-0.2,0.05,0.15,-1.2,0.2,0,-0.06,'s'],[1,-1.0,-0.1,0,0,-0.4,0.3,0,0,'s']]}
});
CANIM.railrelease={d:0.65,st:0.6,two:[0,0.45],k:[[0.12,-1.45,-0.08,-0.16,-0.22,-1.5,-0.1,0.04,-0.12,'o'],[0.42,-1.58,-0.05,0.12,0.1,-1.4,-0.15,-0.03,-0.06,'s'],[1,-1.0,-0.1,0,0,-0.4,0.3,0,0,'s']]};
// Glacier Rend โหมดไกล (ผู้ใช้ 2026-11-16): ชาร์จ 1 วิ = ชี้ไม้ลงพื้นตรงหน้า ตัวเอนหน้าย่อ → น้ำแข็งพุ่ง (แบบโทโดโรกิ) = ตวัดไม้ขึ้นเร็ว ๆ ค้างแป๊บ
CANIM.rendfar={d:1.5,st:0.5,tr:[0.64,0.8],k:[[0.14,-0.7,-0.15,0,0.14,-0.3,0.4,0,-0.08,'s'],[0.64,-0.72,-0.15,0,0.16,-0.3,0.4,0,-0.09,'s'],[0.74,-2.65,0.1,0.12,-0.15,-0.6,0.6,0,0.05,'o'],[0.9,-2.5,0.1,0.1,-0.1,-0.5,0.55,0,0.02,'s'],[1,-1.8,0,0,0,-0.4,0.4,0,0,'s']]};
CANIM.dragonland={d:0.7,st:0,k:[[0.12,-0.8,-0.1,0.12,0.34,-0.55,0.65,0.06,-0.28,'o'],[0.45,-1.1,-0.1,0.06,0.12,-0.5,0.4,0.02,-0.1,'s'],[1,-1.0,-0.1,0,0,-0.3,0.3,0,0,'s']]};
// ขาแยก/ก้าว/ลงน้ำหนักต่างกันตามท่า (เฉพาะตอนหยุดเดิน; ไม่แย่งท่าวิ่ง)
const SKFEET={sweep:[0.25,-0.5,0.1,-0.12],powerup:[-0.25,-0.15,0.16,-0.16],ultraise:[0.25,-0.4,0.13,-0.12],rend:[-0.45,0.25,0.1,-0.06],slam:[-0.65,-0.35,0.18,-0.18],wrap:[-0.4,-0.25,0.08,-0.08],forge:[0.3,-0.4,0.1,-0.1],line:[-0.5,0.3,0.1,-0.08],siphon:[0.35,-0.3,0.15,-0.15],orbs:[0.25,-0.25,0.1,-0.1],upflick:[-0.45,0.3,0.1,-0.08],snap:[0.3,-0.4,0.12,-0.08],pullback:[0.35,-0.45,0.12,-0.12],summon3:[-0.2,-0.2,0.18,-0.18],punchcmd:[-0.5,0.35,0.1,-0.1],ground:[-0.6,0.25,0.15,-0.1],clap:[-0.25,-0.25,0.2,-0.2],burst:[-0.45,-0.25,0.2,-0.2],skycall:[0.3,-0.45,0.1,-0.1],wallpush:[-0.55,0.3,0.15,-0.12],vxpull:[0.5,-0.4,0.14,-0.14],dome:[-0.35,-0.25,0.2,-0.2],tidecall:[0.3,-0.25,0.1,-0.12],wavecast:[0.3,-0.6,0.14,-0.12],cagecast:[-0.5,0.3,0.1,-0.1],moonarts:[0.2,-0.3,0.12,-0.12],dragoncall:[0.25,-0.5,0.13,-0.13],dragoncommand:[-0.5,0.35,0.12,-0.1],fireflare:[-0.35,-0.2,0.2,-0.2],frostbreath:[-0.25,-0.25,0.14,-0.14],godcall:[0.25,-0.4,0.15,-0.15],windlaunch:[-0.6,0.35,0.12,-0.12],wingrise:[-0.3,-0.2,0.18,-0.18],windvoid:[-0.45,0.3,0.12,-0.12],heavenslam:[-0.6,-0.25,0.18,-0.18]};
// รอบ 2: ใส่ให้สกิลที่เดิมมีแต่ท่าค้าง (ไม่เหวี่ยง) ด้วย — ท่านี้เล่นหลังไฟล์สาย (lateSkillPose) จึงทับท่าค้างช่วงสั้น ๆ แล้วกลับท่าเดิม
const SKANIM={ringofembers:'sweep',blazeform:'fireflare',colossus:'novaup',kindle:'upflick',ignitionsnap:'snap',
  frostforge:'forge',glacierrend:'rend',permafrost:'slam',cryoshell:'wrap',frostaura:'frostbreath',mirrorlegion:'mlraise',
  thunderline:'line',speedsiphon:'staffup',stormorbs:'orbs',stormdome:'dome',triplestrike:'skycall',godlightning:'godcall',
  stonebreaker:'punchcmd',mudswamp:'ground',tectoniccrush:'dome',tectoniccrush_2:'clap',dustburst:'burst',terraauger:'pullback',rampart:'rampcast',wrath:'ultraise',
  riptide:'wavecast',tidecaller:'tidecall',aquacage:'cagecast',abyssalbeam:'pullback',moonwater:'moonarts',dragondeep:'dragoncall',dragondeep_dive:'dragoncommand',voidspheres:'windvoid',aegisgale_push:'wallpush',aegisgale_place:'ground',featherwing_2:'wingflick',eyeofheaven:'heavenslam'};
Object.assign(SKANIM,{poisondart:'natthrow',bloom:'natthrow',sporecloud:'natspell',vinelash:'natraise',thornburst:'natraise',worldtree:'natsummon',radiantsovereign:'novaup',lgrecall:'pullback'});
SKANIM.railgun_release='railrelease';SKANIM.terraauger_release='ground';
SKFEET.rendfar=[-0.75,0.5,0.1,-0.08];   /* ขาหน้าก้าวออกไปด้านหน้า ขาหลังยันหลัง ให้ท่าก้มดูมีน้ำหนักตามฟิสิกส์ (ผู้ใช้ 2026-11-16) */SKANIM.dragonfall_land='dragonland';SKFEET.dragonland=[-0.8,0.3,0.12,-0.1];SKFEET.wingflick=[-0.45,0.3,0.12,-0.12];
function skAnim(ev){const o=PM3.get(ev.id);let n=SKANIM[ev.s];if(ev.s==='glacierrend'){const v=VIEW.cur&&VIEW.cur.P.find(q=>q.id===ev.id);if(v&&v.fr&&v.fr[0]!==0)n='rendfar';}{const v=STORM_ANIM_V||STORM_ANIM_PICK[ev.s],sv=v&&'st_'+ev.s+'_'+v;if(sv&&CANIM[sv])n=sv;}if(!o||!n)return;if(ev.s==='stormdome'&&!ev.g)return;o.caN=n;o.caT=0;o.cpT=0;}
// ---- Storm skill animations, 3 to pick per skill (user 2026-11-25): bigger twists, counter-turns, slow wind-up -> fast hit -> hit-stop -> slow settle
//   no wand any more: the gold right hand leads. nc = authored both arms (no auto counter-arm)
Object.assign(CANIM,{
  // Thunder Line
  st_thunderline_a:{d:.6,st:.9,nc:1,k:[[.32,-2.95,-.35,-.6,-.2,-1.25,.35,.05,.02,'s'],[.4,-3.0,-.3,-.66,-.22,-1.3,.38,.06,.03,'s'],[.5,-.85,.05,.75,.48,.55,.5,-.04,-.2,'i'],[.68,-.9,.05,.78,.46,.55,.5,-.04,-.2,'s'],[1,-1.2,-.1,.3,.15,.2,.4,0,-.06,'s']]},   // A slam: arm up high behind, body turned back, slow at the top -> hammer the palm down-forward, bent over, hold
  st_thunderline_b:{d:.65,st:.6,nc:1,tm:[.5,.72],k:[[.3,-.75,.3,-.35,0,-.55,.4,.02,-.05,'s'],[.38,-.72,.32,-.38,0,-.58,.42,.02,-.06,'s'],[.5,-1.62,-.47,.42,.18,-.2,.45,-.03,-.09,'i'],[.72,-1.62,-.47,.44,.18,-.2,.45,-.03,-.09,'s'],[1,-1.25,-.05,.18,.08,-.25,.4,0,-.03,'s']]},   // B push, one hand (user round 2): right hand pulls back only a little, drives forward with the twist, held tense (shake), then back; left arm stays calm • armR.z -.47 = palm on the skill line despite the twist (measured: hand within ~2° of the aim)
  st_thunderline_c:{d:.6,st:.8,nc:1,k:[[.3,-1.6,.95,-.95,.05,.35,.55,.08,-.04,'s'],[.4,-1.62,1.0,-1.0,.06,.38,.58,.09,-.05,'s'],[.5,-1.35,-1.1,.7,.22,-.7,-.2,-.08,-.12,'o'],[.68,-1.35,-1.05,.68,.22,-.7,-.2,-.08,-.12,'s'],[1,-1.1,-.6,.25,.08,-.3,.3,0,-.03,'s']]},   // C chop: hand cocked at the left shoulder, body wound left -> backhand slash out to the right-front, hold
  // Triple Strike (call down at a point)
  st_triplestrike_a:{d:.7,st:.5,nc:1,k:[[.38,-3.15,-.25,-.25,-.25,-.9,.5,0,.04,'i'],[.48,-3.2,-.22,-.28,-.27,-.95,.52,0,.05,'s'],[.58,-1.0,.05,.55,.38,.45,.45,0,-.16,'o'],[.75,-1.0,.05,.55,.38,.45,.45,0,-.16,'s'],[1,-1.25,-.05,.2,.12,.15,.4,0,-.05,'s']]},   // A grab the sky: reach up (speeding up), hang at the top -> yank the fist down at the target, hold
  st_triplestrike_b:{d:.7,st:.6,nc:1,k:[[.35,-1.55,.1,.85,.02,-2.9,.55,-.06,0,'s'],[.5,-1.6,.12,.9,.02,-3.0,.58,-.07,0,'s'],[.56,-1.75,.15,1.0,.08,-2.6,.75,-.09,-.03,'o'],[.75,-1.72,.14,.98,.07,-2.65,.72,-.09,-.03,'s'],[1,-1.35,.05,.4,.03,-1.0,.5,0,0,'s']]},   // B aim + call: side-on like an archer, right palm points at the spot, left hand raised to the sky, a sharp snap, hold
  st_triplestrike_c:{d:.7,st:.7,nc:1,k:[[.3,-2.6,.4,-1.15,-.12,-2.6,-.4,.05,.02,'s'],[.42,-3.0,-.2,.85,-.2,-3.0,.2,-.05,.04,'i'],[.55,-.7,-.1,.55,.5,-.7,.1,0,-.22,'o'],[.74,-.72,-.1,.55,.48,-.72,.1,0,-.22,'s'],[1,-1.2,-.1,.2,.15,-.6,.4,0,-.05,'s']]},   // C spin call: both arms up, wind far left, whip round to the right overhead -> both crash down in front, hold
  // Storm Orbs (two orbs float behind)
  st_stormorbs_a:{d:.65,st:.3,nc:1,k:[[.35,-1.25,.55,0,.1,-1.25,-.55,0,-.06,'s'],[.48,-1.2,.62,0,.12,-1.2,-.62,0,-.08,'s'],[.58,.4,-1.3,0,-.18,.4,1.3,0,.02,'o'],[.75,.38,-1.28,0,-.17,.38,1.28,0,.02,'s'],[1,-.1,-.6,0,-.04,-.1,.6,0,0,'s']]},   // A gather + fling: palms cup in front of the chest (slowing), then fling both back-out wide, chest open, hold
  st_stormorbs_b:{d:.65,st:.4,nc:1,k:[[.35,-2.4,.75,-.75,.0,.45,.4,.06,0,'s'],[.46,-2.45,.8,-.8,0,.48,.42,.07,0,'s'],[.56,-2.6,-1.05,.6,-.12,-.6,.15,-.07,0,'o'],[.75,-2.55,-1.0,.58,-.11,-.6,.15,-.07,0,'s'],[1,-.9,-.45,.2,-.03,-.2,.35,0,0,'s']]},   // B shoulder toss: hand reaches over the left shoulder, body turned -> flick it back over the right shoulder, hold
  st_stormorbs_c:{d:.65,st:.2,nc:1,tm:[.1,.46],k:[[.38,.3,-.35,-.1,.28,.3,.35,0,-.26,'s'],[.46,.32,-.36,-.1,.3,.32,.36,0,-.28,'s'],[.56,-.4,-1.4,.05,-.22,-.4,1.4,0,.06,'o'],[.75,-.4,-1.38,.05,-.2,-.4,1.38,0,.05,'s'],[1,-.15,-.6,0,-.05,-.15,.6,0,0,'s']]},   // C charge burst: crouch with fists low, shaking -> burst up, arms flung wide, leaning back, hold
});
Object.assign(SKFEET,{st_thunderline_a:[-.55,.35,.14,-.12],st_thunderline_b:[.3,-.45,.16,-.16],st_thunderline_c:[-.4,.3,.12,-.1],st_triplestrike_a:[-.35,.3,.12,-.12],st_triplestrike_b:[.4,-.45,.14,-.1],st_triplestrike_c:[-.45,.35,.16,-.16],
  st_stormorbs_a:[.15,-.2,.14,-.14],st_stormorbs_b:[.3,-.35,.12,-.12],st_stormorbs_c:[-.2,-.2,.2,-.2]});
let STORM_ANIM_V=null;   // studio arg 'anim' forces a set
const STORM_ANIM_PICK={thunderline:'b',stormorbs:'c'};   // user's picks per skill (2026-11-25); skills not listed keep their old animation
const _caT=[0,0,0,0,0,0,0,0],_caR=[0,0,0,0,0,0,0,0];
function skillPose(o,p,dt,now){
  const A=CANIM[o.caN];if(!A){o.caN=null;o.caJ=null;return false;}
  o.caT+=dt;const u=o.caT/A.d;if(u>=1){o.caN=null;o.caJ=null;o.castPoseWeight=0;o.b.rotation.z=0;return false;}
  const R=o.armR.rotation,L=o.armL.rotation,c=o.cpb||(o.cpb=[R.x,R.z,o.b.rotation.y,0,L.x,L.z,0,0]);
  const rest=_caR;rest[0]=R.x;rest[1]=R.z;rest[2]=o.b.rotation.y;rest[3]=0;rest[4]=L.x;rest[5]=L.z;rest[6]=0;rest[7]=0;
  if(o.caT<=dt)for(let i=0;i<8;i++)c[i]=rest[i];
  const settle=u<0.76?1:1-_cs((u-0.76)/0.24);
  const w=_cs(Math.min(1,u/0.06))*settle;
  o.castPoseWeight=_cs(Math.min(1,o.caT/.075))*settle;
  let j=0;while(j<A.k.length-1&&u>A.k[j][0])j++;
  const K=A.k[j],P=j?A.k[j-1]:null,u0=P?P[0]:0,f=Math.min(1,(u-u0)/Math.max(0.001,K[0]-u0)),e=K[9]==='o'?_cb(f):K[9]==='i'?f*f*f:_cs(f);
  for(let i=0;i<8;i++){const a=lerp(P?P[i+1]:rest[i],K[i+1],e);_caT[i]=lerp(rest[i],rest[i]+(a-rest[i])*AMP_S[i],w);}
  counterArm(o,_caT,rest,w,!!A.two||!!A.nc||/^nat/.test(o.caN));
  _caT[0]=Math.max(-3.35,_caT[0]);_caT[4]=Math.max(-3.35,_caT[4]);
  if(A.ci&&u>A.ci[0]&&u<A.ci[1]){const q=(u-A.ci[0])/(A.ci[1]-A.ci[0])*Math.PI*2;_caT[0]+=0.32*Math.sin(q)*w;_caT[1]+=0.32*(Math.cos(q)-1)*w;}   // วนไม้เป็นวง
  if(A.tm&&u>A.tm[0]&&u<A.tm[1]){const tr=(Math.sin(now/23)+Math.sin(now/37))*0.03*w;_caT[0]+=tr;_caT[4]+=tr;_caT[3]+=tr*0.3;}   // เกร็งสั่น (ออกแรง)
  const r=1-Math.exp(-dt*(K[9]==='o'?60:K[9]==='i'?90:34));for(let i=0;i<8;i++)c[i]+=(_caT[i]-c[i])*r;
  R.x=c[0];R.z=c[1];o.b.rotation.y=c[2];o.b.rotation.x+=c[3];L.x=c[4];L.z=c[5];o.b.rotation.z=c[6];o.b.position.y+=c[7];
  if(A.two&&(!Array.isArray(A.two)||u>=A.two[0]&&u<=A.two[1]))wandTwoHand(o,w);   // ท่าสองมือ: ปล่อยมือได้เมื่อพ้นช่วงจับไม้
  const ks=A.k[0][0],st=A.st*w*(u<ks?0:Math.min(1,(u-ks)/0.15));
  if(st>0.01&&(o.vsp||0)<0.6){o.legs[1].rotation.x=-0.42*st;o.legs[0].rotation.x=0.3*st;}
  const feet=SKFEET[o.caN];if(feet&&(o.vsp||0)<0.6){const fw=w*_cs(Math.min(1,u/0.16));o.legs[0].rotation.x=lerp(o.legs[0].rotation.x,feet[0],fw);o.legs[1].rotation.x=lerp(o.legs[1].rotation.x,feet[1],fw);o.legs[0].rotation.z=feet[2]*fw;o.legs[1].rotation.z=feet[3]*fw;}
  // joints (user 2026-11-24: crouch with the knees, not by sinking the whole body; bend the free elbow)
  // joints (user 2026-11-24): crouch with the knees, bend the free elbow, natural staggered stance — on EVERY cast pose.
  // Explicit A.j = [[u, kneeR, kneeL, elbowL, thighR, thighL, spreadR, spreadL], ...]; otherwise derived from the pose:
  // body drop + lean → knee bend, left-arm height → elbow bend, plus a small default stagger/spread.
  const J=_caJ,still=(o.vsp||0)<0.6;
  if(A.j){let i=0;while(i<A.j.length-1&&u>A.j[i][0])i++;const B=A.j[i],P0=i?A.j[i-1]:_caJ0,f=_cs(clamp((u-P0[0])/Math.max(0.001,B[0]-P0[0]),0,1));
    for(let n=1;n<8;n++)J[n]=lerp(P0[n]||0,B[n]||0,f);}
  else{const dip=Math.max(0,-_caT[7]),lean=Math.max(0,_caT[3]),ax=_caT[4],k=clamp(0.15+dip*3.4+lean*0.7,0,1.35);
    J[1]=k;J[2]=k*0.85;J[3]=ax<-2.3?0.45:ax<-1.0?0.6:0.85;J[4]=-0.12-k*0.5;J[5]=0.16-k*0.42;J[6]=0.12;J[7]=-0.12;}   // thigh ≈ half the knee bend = foot stays planted
  if(still&&(A.j||!SKFEET[o.caN])){const fw=w*_cs(Math.min(1,u/0.12));o.legs[0].rotation.x=lerp(o.legs[0].rotation.x,J[4],fw);o.legs[1].rotation.x=lerp(o.legs[1].rotation.x,J[5],fw);
    o.legs[0].rotation.z=lerp(o.legs[0].rotation.z,J[6],fw);o.legs[1].rotation.z=lerp(o.legs[1].rotation.z,J[7],fw);}
  o.caJ=[(still?J[1]:J[1]*0.4)*w,(still?J[2]:J[2]*0.4)*w,J[3]*w*(A.two?0.15:1)];o.caJR=(_caT[0]<-2.3?0.25:0.4)*w;
  if(A.tr&&u>A.tr[0]&&u<A.tr[1]){if(!o.ctr){const col=CPCOL[getKit(p.id).path]||'#ffffff';o.ctr=trailNew({col:'#ffffff',col2:col,w:0.06,life:0.2,k:1.3});}
    o.tip.updateWorldMatrix(true,false);o.tip.getWorldPosition(_tv1);trailPoint(o.ctr,_tv1.x,_tv1.y,_tv1.z);}
  else if(o.ctr){trailStop(o.ctr);o.ctr=null;}
  return true;
}
// สองมือจับไม้ (ผู้ใช้ 2026-10-22 "the 2 hands cast make it hold the wand with 2 hand instead"): ชี้แขนซ้ายไปที่ด้ามไม้ใต้มือขวา
// แขนเป็นท่อนเดียวหมุนที่ไหล่ (rotation x/z, y = 0 ตาม rig ไฟล์โมเดล) → แก้สมการทิศ: d = (sin z, −cos z·cos x, −cos z·sin x)
const _g2=new THREE.Vector3();
function wandTwoHand(o,w){
  if(!(w>0.01))return;const R=o.armR,L=o.armL;R.updateMatrix();
  _g2.set(0,-0.76,0.03).applyMatrix4(R.matrix).sub(L.position);const l=_g2.length()||1;_g2.divideScalar(l);
  const z=Math.asin(clamp(_g2.x,-1,1)),cz=Math.max(1e-4,Math.cos(z)),x=Math.atan2(-_g2.z/cz,-_g2.y/cz);
  L.rotation.x=lerp(L.rotation.x,x,w);L.rotation.z=lerp(L.rotation.z,z,w);
}
// ท่าค้าง/ท่าจบ ใช้หลังท่าประจำสายแล้วค่อยส่งให้กระดูก (8ช่องเหมือน CANIM)
function characterPoseMix(out,a,b,k){for(let i=0;i<8;i++)out[i]=lerp(a[i],b[i],k);return out;}
function characterStance(o,P,feet,w){
  const R=o.armR.rotation,L=o.armL.rotation;w=clamp(w,0,1);
  R.x=lerp(R.x,P[0],w);R.z=lerp(R.z,P[1],w);L.x=lerp(L.x,P[4],w);L.z=lerp(L.z,P[5],w);
  o.b.rotation.y=lerp(o.b.rotation.y,P[2],w);o.b.rotation.x=lerp(o.b.rotation.x,P[3],w);o.b.rotation.z=lerp(o.b.rotation.z,P[6],w);o.b.position.y+=P[7]*w;o.bz=1;
  if(feet){for(let i=0;i<2;i++){o.legs[i].rotation.x=lerp(o.legs[i].rotation.x,feet[i],w);o.legs[i].rotation.z=lerp(o.legs[i].rotation.z,feet[i+2],w);}}
}
// Lower-body layer after casting poses. The arms, wand and torso stay with the skill.
const JUMP_LEGS={
  // Thigh pitch R/L, spread R/L, knee bend R/L, cloak lift, arm pitch, elbow bend, shoulder lift, arm spread.
  push: [-.27,.29,-.13,.11,.28,.16,.40,-1.04,1.62,.075,.38],
  tuck: [-.92,.36,-.43,.39,.64,.42,.98,-.07,1.53,.16,1.48],
  crest:[-.68,.22,-.39,.35,.48,.40,.79,-.07,1.53,.15,1.43],
  fall: [-.46,.16,-.34,.30,.36,.34,.54],
  reach:[-.20,.05,-.18,.16,.15,.21,.31,-.04,.75,.025,.41],
  land: [-.43,-.28,-.12,.11,.54,.57,.15,-.07,.61,0,.20]
};
function jumpLegPose(o,p,dt,locked,phase,hover){
  if(locked||p.dn||p.fl||p.st||p.gh||p.ds||p.df||p.hv||p.co||o.dp||o.wsl||o.rag){o.jumpLegs=null;return 0;}
  if(!phase&&!o.jumpLegs)return 0;
  const J=o.jumpLegs||(o.jumpLegs={phase:0,time:0,p:Float32Array.from(JUMP_LEGS.push),weight:0,land:0});
  if(!phase&&J.phase){
    // A movement skill can take over before the character touches down.
    if(p.z>groundH(p.x,p.y,p.z)+hover+.11){o.jumpLegs=null;return 0;}
    if(J.phase===2)J.land=.17;
  }
  if(phase)J.land=0;
  J.time=phase===J.phase?J.time+dt:0;J.phase=phase;
  let start=JUMP_LEGS.land,end=start,u=1;
  if(phase===1){
    const topped=J.time>=.13;
    start=topped?JUMP_LEGS.tuck:JUMP_LEGS.push;
    end=topped?JUMP_LEGS.crest:JUMP_LEGS.tuck;
    u=_cs(clamp((J.time-(topped?.13:0))/(topped?.20:.13),0,1));
  }else if(phase===2){
    start=JUMP_LEGS.fall;end=JUMP_LEGS.reach;u=_cs(clamp((J.time-.05)/.29,0,1));
  }
  const on=phase||J.land>0,blend=1-Math.exp(-dt*(phase===1?29:21));
  J.weight=lerp(J.weight,phase?1:clamp(J.land/.12,0,1)*.78,1-Math.exp(-dt*(on?30:15)));
  J.land=Math.max(0,J.land-dt);
  if(!on&&J.weight<.015){o.jumpLegs=null;return 0;}
  for(let i=0;i<7;i++)J.p[i]=lerp(J.p[i],lerp(start[i],end[i],u),blend);
  // Hands follow through at the apex before easing down over the descent.
  const handStart=phase===2?JUMP_LEGS.crest:start;
  const handProgress=phase===2?_cs(clamp((J.time-.065)/.37,0,1)):u;
  for(let i=7;i<J.p.length;i++)J.p[i]=lerp(J.p[i],lerp(handStart[i],end[i],handProgress),blend);
  for(let i=0;i<2;i++){
    const rotation=o.legs[i].rotation;
    rotation.x=lerp(rotation.x,J.p[i],J.weight);
    rotation.z=lerp(rotation.z,J.p[i+2],J.weight);
  }
  return J.weight;
}
const jumpCloakTurn=new THREE.Quaternion(),jumpCloakEuler=new THREE.Euler();
function jumpCloakPose(o,lift){
  const active=lift>.005,wasActive=o.jumpCloakActive;
  if(!o.fileModel||(!active&&!wasActive))return;
  o.jumpCloakActive=active;
  const bones=o.jumpCloak||(o.jumpCloak=['cloak_B','cloak_L','cloak_R'].map(n=>{
    const bone=o.fileModel.getObjectByName(n);
    return bone?{bone,base:new THREE.Quaternion(),applied:new THREE.Quaternion()}:null;
  }));
  for(let i=0;i<bones.length;i++){
    const k=bones[i];if(!k)continue;
    const rotation=k.bone.quaternion;
    if(wasActive&&rotation.equals(k.applied))rotation.copy(k.base);
    if(!active)continue;
    k.base.copy(rotation);
    jumpCloakEuler.set(lift*(i===0?.58:.49),0,lift*(i===1?.42:i===2?-.42:0));
    rotation.multiply(jumpCloakTurn.setFromEuler(jumpCloakEuler));
    k.applied.copy(rotation);
  }
}
const readyBaseR=new THREE.Quaternion(),readyBaseL=new THREE.Quaternion();
const castBaseR=new THREE.Quaternion(),castBaseL=new THREE.Quaternion();
const jumpElbowPivot=new THREE.Vector3(0,-.32,0);
function clearJumpArms(o){
  const a=o.jumpArms;
  if(!a?.applied)return;
  for(const k of a.shoulders)if(k.position.equals(k.after))k.position.copy(k.before);
  a.applied=false;
}
function jumpArmPose(o,weight){
  if(!weight||!o.rig)return;
  for(const [arm,side] of [[o.armR,-1],[o.armL,1]]){
    const r=arm.rotation;
    r.x=lerp(r.x,o.jumpLegs.p[7],weight);
    r.z=lerp(r.z,side*o.jumpLegs.p[10],weight);
  }
}
// Free-arm elbow bend. Restore the base bone pose before layering it again.
const _caEQ=new THREE.Quaternion(),_caEX=new THREE.Vector3(1,0,0);
function caElbowL(o,a,restWeight=0){const m=o.fileModel;if(!m)return;let k=o.caEL;if(!k||k.m!==m){const b=m.getObjectByName('forearm_L');k=o.caEL=b?{b,m,base:new THREE.Quaternion(),ap:new THREE.Quaternion(),on:false}:{m};}
  if(!k.b)return;const q=k.b.quaternion;if(k.on&&q.equals(k.ap))q.copy(k.base);if(Math.abs(a)<0.003){k.on=false;return;}
  k.base.copy(q);
  if(restWeight&&o.readyLeftForearm)q.slerp(o.readyLeftForearm,restWeight);
  q.multiply(_caEQ.setFromAxisAngle(_caEX,-a));k.ap.copy(q);k.on=true;}
const _caRQ=new THREE.Quaternion();
function caElbowR(o,a){const m=o.fileModel;if(!m)return;let k=o.caER;
  if(!k||k.m!==m){const b=m.getObjectByName('forearm_R');k=o.caER=b?{b,m,base:new THREE.Quaternion(),ap:new THREE.Quaternion(),on:false,wp:new THREE.Vector3(),wq:new THREE.Quaternion(),tp:new THREE.Vector3(),awp:new THREE.Vector3(),awq:new THREE.Quaternion()}:{m};}
  if(!k.b)return;const q=k.b.quaternion,W=o.wandG,T=o.tip;
  if(k.on){if(q.equals(k.ap))q.copy(k.base);if(W.position.equals(k.awp)&&W.quaternion.equals(k.awq)){W.position.copy(k.wp);W.quaternion.copy(k.wq);T.position.copy(k.tp);}}
  if(Math.abs(a)<0.003){k.on=false;return;}
  k.base.copy(q);k.wp.copy(W.position);k.wq.copy(W.quaternion);k.tp.copy(T.position);
  _caRQ.setFromAxisAngle(_caEX,-a);q.multiply(_caRQ);k.ap.copy(q);
  W.position.sub(jumpElbowPivot).applyQuaternion(_caRQ).add(jumpElbowPivot);W.quaternion.premultiply(_caRQ);
  T.position.sub(jumpElbowPivot).applyQuaternion(_caRQ).add(jumpElbowPivot);
  k.awp.copy(W.position);k.awq.copy(W.quaternion);k.on=true;}
let HEAD_DOWN=1;   // sign of 'head pitch down' in readyHeadPose (measured, see class stances)
const readyHeadTurn=new THREE.Quaternion(),readyHeadParent=new THREE.Quaternion(),readyHeadEuler=new THREE.Euler();
function readyHeadPose(o,weight,isMe,whip){
  if(!o.readyHeadRest||!weight)return;
  const head=o.lgHead??(o.lgHead=o.fileModel.getObjectByName('head'));
  if(!head)return;
  const lookPitch=(isMe?clamp(pitch-.3,-.39,.45):0)*(o.stHead?.4:1)+HEAD_DOWN*(o.stHead||0);
  const target=readyHeadTurn.setFromEuler(readyHeadEuler.set(lookPitch+(whip?.headPitch||0),
    whip?.headYaw||0,(whip?.headRoll||0)+(o.stHroll||0))).multiply(o.readyHeadRest);
  target.premultiply(o.g.getWorldQuaternion(readyHeadParent));
  head.parent.getWorldQuaternion(readyHeadParent).invert();
  target.premultiply(readyHeadParent);
  o.readyHeadBefore=(o.readyHeadBefore||new THREE.Quaternion()).copy(head.quaternion);
  head.quaternion.slerp(target,weight);
  o.readyHeadAfter=(o.readyHeadAfter||new THREE.Quaternion()).copy(head.quaternion);
  o.readyHeadApplied=true;
}

function readyAllowed(o,p,now){
  return !(p.dk?.[3]>0||now-(o.darkShieldAt??-Infinity)<.6||p.fl||p.dn||p.st||p.gh||
    p.rt||p.ds||p.df||p.hv||p.co||o.dp||o.wsl||o.rag||o.emo||
    p.fr&&(p.fr[3]&1)||p.wn&&p.wn[5]>=1||Math.abs(o.lgHeadYaw||0)>.005);
}
// ---------- Class stances (designs/class-stances.md, user 2026-11-24) ----------
// Each class may own an idle/run stance on top of the shared ready base. Two styles per class while the user picks
// ('a'/'b'; STANCE_STYLE[path] set by studio/class-stance.js, default 'a'). Angles in rad unless noted.
//   yaw deg body turn (+ = right shoulder leads) | lean whole-body pitch | spine/chest = waist bend forward (bones) |
//   rx/rz right arm (x- = raise forward, z- = out to the side) | lx/lz left arm (x- = forward, z+ = out) | ry/ly arm twist | elR/elL elbows |
//   legR/legL thigh pitch (- = forward) | spR/spL leg spread | kR/kL knees | head pitch (+ = down) | hroll head tilt |
//   br breath {T s, y, spine, arm} | sway {T s, roll, x} | bounce {T s, y} | run {lean, spine, rx, lx, head} | fx = class look
const STANCE_STYLE={};
const STANCES={
  darkness:{
    a:{name:'Reaper',yaw:0,lean:.02,spine:.3,chest:.24,rx:.75,rz:-.45,elR:.2,lx:-.28,lz:.5,elL:.5,legR:-.08,legL:.1,spR:.26,spL:.26,kR:.04,kL:.04,
      head:.62,br:{T:3.6,y:.026,spine:.06,arm:.05},run:{lean:.22,spine:.12,rx:1.25,lx:.55,head:.2},fx:'inkDrip'},
    b:{name:'Stalker',yaw:-40,lean:0,spine:.22,chest:.14,rx:.45,rz:-.68,elR:.3,lx:-1.0,lz:.25,elL:.55,legR:.18,legL:-.22,spR:.12,spL:.18,kR:.2,kL:0,
      head:.26,hroll:-.12,br:{T:2.6,y:.014,spine:.03,arm:.03},sway:{T:5,roll:.025,x:.02},run:{lean:.12,spine:.28,rx:.85,lx:-.55,head:.12},fx:'footMist'}},
  frost:{   // wand in the LEFT hand, forearm across at chin height, wand tip back toward the face; open right hand guides the sword
    a:{name:'Duelist',yaw:-28,lean:0,spine:-.02,chest:-.05,rx:-.12,rz:-1.05,elR:.18,lx:-1.45,ly:-1.2,lz:.12,elL:2.0,legR:.12,legL:-.18,spR:.16,spL:.16,kR:.05,kL:.05,wandDir:[-.08,.9,-.35],
      head:-.06,br:{T:4.2,y:.014,spine:.02,arm:.02},run:{lean:.12,spine:.08,rx:.35,lx:-.15,head:.05},wandL:1,fx:'frostBreath'},
    b:{name:'Guard',yaw:-28,lean:0,spine:.14,chest:.08,rx:-.05,rz:-.55,elR:.3,lx:-1.5,ly:-.9,lz:-.2,elL:1.3,legR:.32,legL:-.4,spR:.24,spL:.2,kR:.42,kL:.3,wandDir:[-.3,-.9,.35],
      head:.1,br:{T:3,y:.02,spine:.03,arm:.02},run:{lean:.18,spine:.12,rx:.3,lx:-.1,head:.05},wandL:1,fx:'frostGround'}},
  frostWand:{   // Frost in wand mode (user 2026-11-24): body turned left, wand hand out to the side a little behind, away from the body
    a:{name:'Wand',yaw:-40,lean:0,spine:.06,chest:.04,rx:-.35,rz:-.28,elR:.5,lx:.3,lz:.72,elL:.3,legR:.2,legL:-.26,spR:.18,spL:.2,kR:.12,kL:.08,wandDir:[.85,-.18,-.3],
      head:.04,br:{T:3.6,y:.015,spine:.02,arm:.03},run:{lean:.14,spine:.08,rx:-.1,lx:.45,head:.04},wandL:1,fx:'frostGround'}},
  pyro:{
    a:{name:'Brawler',yaw:36,lean:.03,spine:.18,chest:.1,rx:-.38,rz:-.28,elR:1.45,lx:-1.0,lz:.28,elL:.95,legR:-.36,legL:.3,spR:.24,spL:.24,kR:.5,kL:.45,
      head:.12,br:{T:3,y:.01,spine:.02,arm:.02},bounce:{T:.9,y:.03},run:{lean:.2,spine:.1,rx:.25,lx:.1,head:.05},fx:'fireArm'},
    b:{name:'Torchbearer',yaw:20,lean:0,spine:-.02,chest:-.07,rx:.06,rz:-.16,elR:.32,lx:-.35,lz:1.15,elL:1.55,legR:-.1,legL:.12,spR:.17,spL:.17,kR:.06,kL:.06,
      head:-.04,br:{T:4,y:.018,spine:.03,arm:.03},run:{lean:.14,spine:.06,rx:.3,lx:.1,head:.04},fx:'fireTorch'}},
  water:{   // same shared pose (user) - only the class look changes
    a:{name:'Water spiral',same:1,lzAdd:.42,lxAdd:-.25,fx:'waterSpiral'},   // user 2026-11-24: many water spirals turning round the LEFT arm, outside the sleeve, a clear water orb at the hand with water flowing round inside it
    b:{name:'Water hem',same:1,fx:'waterHem'}},     // user 2026-11-24: the cloak hem is running water
  storm:{   // user 2026-11-25: legs spread left-right (right foot a touch ahead), legs straight, upper body bent forward a little;
            // free LEFT arm out from the body, hanging, forearm lifted a bit; wand hand out and slightly back so the wand sits behind the body
    a:{name:'Charged',yaw:8,lean:0,spine:.24,chest:.14,rx:.7,rz:-.62,elR:.25,lx:-.08,lz:.46,elL:.6,legR:-.1,legL:.07,spR:.3,spL:.3,kR:.04,kL:.04,
      head:-.08,br:{T:3.2,y:.016,spine:.03,arm:.03},run:{lean:.2,spine:.1,rx:1.0,rz:-.3,elR:.05,lx:.95,lz:.28,elL:.05,swing:.12,head:-.06},fx:'stormArc'}}   // run (user 2026-11-25): both arms trail back-down, straight
};
// Storm hand looks (user 2026-11-25, 3 to pick; no wand in all three): g1 gold gauntlets always • g3 gold only while casting/dashing • g4 gold lightning streaks up the forearms
for(const [k,gold,name] of [['g1','glove','Gold gauntlets'],['g3','skill','Gold on cast'],['g4','streak','Gold streaks']])STANCES.storm[k]={...STANCES.storm.a,name,gold,noWand:1};
const STANCE_PICK={darkness:'b',frost:'b',frostWand:'a',pyro:'a',water:'a',storm:'a'};   // user's picks 2026-11-24 (Stalker, Guard, Brawler, Water spiral)
function stanceOf(o){const id0=PATHS[o.posePath]?.id,id=id0==='frost'&&o.fRanged?'frostWand':id0,S=STANCES[id];return S?S[STANCE_STYLE[o.posePath]||STANCE_PICK[id]||'a']||S.a:null;}
const _stQ=new THREE.Quaternion(),_stX=new THREE.Vector3(1,0,0),_stZ=new THREE.Vector3(0,0,1);
// waist bend on the spine + chest bones (the rig only drives arms/thighs), so legs stay straight and the head stays level
function stanceSpine(o,weight){const m=o.fileModel;if(!m)return;
  const B=o.stBones||(o.stBones=['spine','chest'].map(n=>m.getObjectByName(n)).filter(Boolean).map(b=>({b,rest:b.quaternion.clone()})));
  B.forEach((k,i)=>{k.b.quaternion.copy(k.rest).multiply(_stQ.setFromAxisAngle(_stX,o.stSpine[i]*weight)).multiply(_stQ.setFromAxisAngle(_stZ,(o.stRoll||0)*weight*(i?.6:.4)));});
  o.stOn=true;}
function stanceSpineOff(o){if(!o.stOn||!o.stBones)return;for(const k of o.stBones)k.b.quaternion.copy(k.rest);o.stOn=false;}
// Frost holds the wand in the LEFT hand: move the wand mesh + glowing tip to the left arm (and back when the class changes)
const STANCE_WAND={pos:[.33,.9,0],rot:[0,0,0]};   // left-hand wand offset (hand_L local) + extra turn so the tip points back at the face
function stanceWand(o,left){
  const m=o.fileModel;if(!m||!!o.wandL===!!left)return;
  const hR=m.getObjectByName('hand_R'),hL=m.getObjectByName('hand_L');if(!hR||!hL)return;
  const from=left?hR:hL,to=left?hL:hR,list=[];from.children.forEach(c=>{if(/^wand_/.test(c.name))list.push(c);});
  for(const w of list){
    if(left){w.userData.wR=w.userData.wR||{p:w.position.clone(),q:w.quaternion.clone()};to.add(w);
      w.position.set(...STANCE_WAND.pos);w.quaternion.copy(w.userData.wR.q).multiply(_stQ.setFromEuler(new THREE.Euler(...STANCE_WAND.rot)));}
    else{to.add(w);w.position.copy(w.userData.wR.p);w.quaternion.copy(w.userData.wR.q);}}
  if(o.tip){(left?o.armL:o.armR).add(o.tip);}
  o.wandL=!!left;}
// aim the left-hand wand: rotate it about its grip so the tip points along S.wandDir [forward, right, up] (body frame),
// then put the glowing tip sprite on the real tip
const _swA=new THREE.Vector3(),_swB=new THREE.Vector3(),_swD=new THREE.Vector3(),_swQ=new THREE.Quaternion(),_swQ2=new THREE.Quaternion(),_swP=new THREE.Vector3();
// casting (user 2026-11-25 "animation must follow the wand arm"): the wand turns from the stance direction to point on along
// the forearm (elbow -> hand -> wand tip), like the right-handed wand does in every cast pose
const _swE=new THREE.Vector3(),_swH=new THREE.Vector3();
function stanceWandTip(o,S,dt){
  if(!o.wandL||!o.tip||!o.fileModel)return;
  const cast=!!(o.caN||o.cpT>0||o.castT>0||o.fPose||o.mlcT>0);o.wCastK=(o.wCastK||0)+((cast?1:0)-(o.wCastK||0))*Math.min(1,(dt||.016)*(cast?16:7));const hL=stBone(o,'hand_L');const w=hL&&hL.children.find(c=>/^wand_/.test(c.name)&&c.visible);if(!w)return;
  const wg=w.geometry||(w.getObjectByProperty('isMesh',true)||{}).geometry;if(!wg)return;   // wand may load as a Group
  const E=w.userData.ends||(w.userData.ends=(()=>{wg.computeBoundingBox();const b=wg.boundingBox,cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2;
    return {grip:new THREE.Vector3(cx,b.max.y,cz),tip:new THREE.Vector3(cx,b.min.y,cz)};})());
  w.position.set(...STANCE_WAND.pos);w.quaternion.copy(w.userData.wR.q);w.updateWorldMatrix(true,false);
  const ck=o.wCastK||0,fa=ck>.001&&stBone(o,'forearm_L');
  if(S&&S.wandDir||fa){const grip=_swA.copy(E.grip).applyMatrix4(w.matrixWorld),cur=_swB.copy(E.tip).applyMatrix4(w.matrixWorld).sub(grip).normalize();
    const qb=o.b.getWorldQuaternion(_swQ2),d=S&&S.wandDir||[1,0,0];
    const want=_swD.set(-d[1],d[2],d[0]).applyQuaternion(qb).normalize();   // body frame: +z forward, -x right, +y up
    if(fa){fa.getWorldPosition(_swE);hL.getWorldPosition(_swH);want.lerp(_swH.sub(_swE).normalize(),ck).normalize();}
    const q=_swQ.setFromUnitVectors(cur,want),wp=w.getWorldPosition(_swP).sub(grip).applyQuaternion(q).add(grip);
    const wq=w.getWorldQuaternion(new THREE.Quaternion()).premultiply(q);
    w.parent.getWorldQuaternion(_swQ2).invert();w.quaternion.copy(_swQ2.multiply(wq));w.position.copy(w.parent.worldToLocal(wp));w.updateWorldMatrix(true,false);}
  const p=_stV.copy(E.tip).applyMatrix4(w.matrixWorld);o.tip.parent.worldToLocal(p);o.tip.position.copy(p);}
const _stV=new THREE.Vector3(),_stV2=new THREE.Vector3(),_stV3=new THREE.Vector3();
// ---------- Class look (always-on small VFX that tell the class, STANCES[..].fx) ----------
// Meshes driven by time (not PARTS), so they also show in VFX Studio seeks/GIF export. One group per character under o.g.
function stBone(o,n){const c=o.stBn||(o.stBn={});if(c.m!==o.fileModel){for(const k in c)delete c[k];c.m=o.fileModel;}return c[n]||(c[n]=o.fileModel?.getObjectByName(n)||null);}
function stLoc(o,n,out){const b=stBone(o,n);if(!b)return null;b.getWorldPosition(out);return o.g.worldToLocal(out);}
function stArmPt(o,t,out){   // left arm in o.g space, t 0 = shoulder .. 1 = palm
  const a=stLoc(o,'upper_arm_L',_stV2),b=stLoc(o,'forearm_L',_stV3);if(!a||!b)return null;
  if(t<.5)return out.lerpVectors(a,b,t*2);const c=stLoc(o,'hand_L',_stV2);return out.lerpVectors(_stV3,c,(t-.5)*2);}
const ST_TEX={};
function stTex(k){if(ST_TEX[k])return ST_TEX[k];const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
  if(k==='soft'){const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.45,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);}
  else if(k==='frost'){g.translate(32,32);g.strokeStyle='rgba(255,255,255,.9)';g.lineCap='round';
    for(let i=0;i<14;i++){const a=i/14*6.283+(i%2)*.2,L=18+(i%3)*5;g.lineWidth=i%2?1:1.6;g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(a)*L,Math.sin(a)*L);g.stroke();
      for(const f of [.45,.7]){const x=Math.cos(a)*L*f,y=Math.sin(a)*L*f;g.lineWidth=.8;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a+.7)*5,y+Math.sin(a+.7)*5);g.moveTo(x,y);g.lineTo(x+Math.cos(a-.7)*5,y+Math.sin(a-.7)*5);g.stroke();}}
    const r=g.createRadialGradient(0,0,0,0,0,32);r.addColorStop(0,'rgba(220,245,255,.5)');r.addColorStop(1,'rgba(220,245,255,0)');g.fillStyle=r;g.fillRect(-32,-32,64,64);}
  else if(k==='ring'){g.strokeStyle='rgba(255,255,255,1)';g.lineWidth=4;g.beginPath();g.arc(32,32,26,0,6.283);g.stroke();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return ST_TEX[k]=t;}
const ST_MAT={};
function stMat(k){return ST_MAT[k]||(ST_MAT[k]=stMatNew(k));}
function stMatNew(k){let m;   // own material per piece when each fades on its own (clone() lost the look)
  if(k==='ink')m=new THREE.MeshBasicMaterial({color:'#050308'});
  else if(k==='inkSmoke')m=new THREE.SpriteMaterial({map:stTex('soft'),color:'#0a0710',transparent:true,depthWrite:false,opacity:.5});
  else if(k==='mist')m=new THREE.SpriteMaterial({map:stTex('soft'),color:'#08060d',transparent:true,depthWrite:false,opacity:.9});
  else if(k==='breath')m=new THREE.SpriteMaterial({map:stTex('soft'),color:'#f2fbff',transparent:true,depthWrite:false,opacity:.6});
  else if(k==='glint')m=new THREE.SpriteMaterial({map:stTex('soft'),color:'#cdeeff',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.9});
  else if(k==='frost')m=new THREE.MeshBasicMaterial({map:stTex('frost'),color:'#e6f7ff',transparent:true,depthWrite:false,opacity:.6});
  else if(k==='ice')m=new THREE.MeshStandardMaterial({color:'#bfe8ff',emissive:'#3f9fd8',emissiveIntensity:.5,roughness:.15,metalness:.1,transparent:true,opacity:.85,flatShading:true});
  else if(k==='water')m=new THREE.MeshStandardMaterial({color:'#3aa6ff',emissive:'#0b4a8a',emissiveIntensity:.6,roughness:.08,metalness:.1,transparent:true,opacity:.8});
  else if(k==='waterSheet')m=new THREE.MeshStandardMaterial({color:'#46b4ff',emissive:'#1466b0',emissiveIntensity:.75,roughness:.05,metalness:.1,transparent:true,opacity:.72,side:THREE.DoubleSide,depthWrite:false});
  else if(k==='orb')m=new THREE.MeshStandardMaterial({color:'#7cc9ff',emissive:'#1a6fc0',emissiveIntensity:.55,roughness:.04,metalness:.1,transparent:true,opacity:.45,depthWrite:false});
  else if(k==='foam')m=new THREE.MeshBasicMaterial({color:'#e8f8ff',transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false});
  else if(k==='ripple')m=new THREE.MeshBasicMaterial({map:stTex('ring'),color:'#9fdcff',transparent:true,depthWrite:false,opacity:.6});
  return m;}
function stRibbon(n,mat){const g=new THREE.BufferGeometry(),idx=[];g.setAttribute('position',new THREE.BufferAttribute(new Float32Array((n+1)*2*3),3).setUsage(THREE.DynamicDrawUsage));
  for(let i=0;i<n;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}g.setIndex(idx);const m=new THREE.Mesh(g,mat);m.userData.n=n;return m;}
function stRibbonSet(m,f){const A=m.geometry.attributes.position,a=A.array,n=m.userData.n;for(let i=0;i<=n;i++)f(i/n,a,i*6);A.needsUpdate=true;m.geometry.computeVertexNormals();m.geometry.computeBoundingSphere();}
const FIRE_TONGUES=9;   // Fire class arm: flame tongues (cost: one small fire-shader mesh each)
// Storm class look (user 2026-11-25): small lightning arcs flicker over the whole body all the time — not many, random, very fast
// round 2 (user): bigger arcs, most of them crawl the wand (hand -> tip), a few on the left hand, fewer on the body
const ST_ARC={n:13,body:4,wand:6,dash:10,seg:7,life:[.06,.13],gap:[.03,.2],len:[.22,.45],jit:.11,w:.03,glow:2.1,
  bones:[['hips','spine',.32],['spine','chest',.3],['chest','neck',.24],['upper_arm_L','forearm_L',.15],['forearm_L','hand_L',.15],['upper_arm_R','forearm_R',.15],['forearm_R','hand_R',.15],['thigh_L','shin_L',.34],['thigh_R','shin_R',.34],['shin_L','foot_L',.42],['shin_R','foot_R',.42]]};   // radius = out past the robe/sleeves
// glow round an arc fades out to both edges (user 2026-11-25: no flat band 'aura', soft + thin)
let _stArG=null;function stArcGlowTex(){if(_stArG)return _stArG;const c=document.createElement('canvas');c.width=4;c.height=64;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,64);
  g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,4,64);_stArG=new THREE.CanvasTexture(c);return _stArG;}
function stRibbonUV(m){const n=m.userData.n,uv=new Float32Array((n+1)*4);for(let i=0;i<=n;i++){uv[i*4]=i/n;uv[i*4+1]=0;uv[i*4+2]=i/n;uv[i*4+3]=1;}m.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));}
// ---- Storm gold hands (user 2026-11-25) ----
// hand: a gold shell over the hand • forearm/upper arm: tubes with a streaky texture that fades up the arm (no hard cut at the wrist)
const ST_GOLD={tube:new THREE.CylinderGeometry(1,1,1,14,1,true),streaks:3,coatIn:.08,coatOut:.55,handR:.125,foreR:.15,upR:.16,fore:.62};
let _stGT=null;function stGoldTex(){if(_stGT)return _stGT;const W=128,H=128,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  for(let i=0;i<46;i++){const px=Math.random()*W,len=H*(.25+Math.random()*.75),w=2+Math.random()*7,g=x.createLinearGradient(0,H,0,H-len);   // v=0 at the hand end: streaks rise from the hand, ragged tops
    g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.7,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(px,H-len,w,len);x.fillRect(px-W,H-len,w,len);}
  _stGT=new THREE.CanvasTexture(c);_stGT.wrapS=THREE.RepeatWrapping;return _stGT;}
function stGoldMat(tube){return tube?new THREE.MeshStandardMaterial({color:'#ffcf3a',emissive:'#ffa800',emissiveIntensity:1.1,metalness:.35,roughness:.3,map:stGoldTex(),alphaMap:stGoldTex(),transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide})
  :new THREE.MeshStandardMaterial({color:'#ffd54a',emissive:'#ffb000',emissiveIntensity:1.2,metalness:.35,roughness:.28,transparent:true,opacity:0});}
const _sgGA=new THREE.Vector3(),_sgGB=new THREE.Vector3(),_sgGC=new THREE.Vector3(),_sgY=new THREE.Vector3(0,1,0);
function stTube(m,a,b,r,frac){const d=_sgGC.copy(a).sub(b),L=d.length()*frac;if(L<1e-4){m.visible=false;return;}d.normalize();m.position.copy(b).addScaledVector(d,L/2);m.quaternion.setFromUnitVectors(_sgY,d);m.scale.set(r,L,r);}   // from b (hand end) toward a
function stormGold(o,S,P,dt,t){
  if(S.noWand&&o.fileModel){const h=stBone(o,'hand_R');if(h)for(const c of h.children)if(/^wand_/.test(c.name))c.visible=false;if(o.tip)o.tip.visible=false;}
  const cast=!!(o.caN||o.cpT>0||o.castT>0||o.stBmK>0),dash=o.dp&&o.dp.st==='zap',dGo=dash&&o.dp.ph==='go';
  // coat level per side: 0 none .. 1 full (hand + streaky forearm); arm = upper arm too (dash: right arm)
  const want=S.gold==='glove'?1:S.gold==='skill'?(cast||dash?1:0):0;o.sgK=(o.sgK||0)+(want-(o.sgK||0))*Math.min(1,dt*(want>(o.sgK||0)?1/ST_GOLD.coatIn:1/ST_GOLD.coatOut));
  if(dGo)o.sgD=1;else o.sgD=Math.max(0,(o.sgD||0)-dt/(DPT.zapHold+DPT.zapUp+.2));const dk=_cs(o.sgD||0);   // dash coat fades out as the pose rises
  for(const sd of [0,1]){const nm=sd?'R':'L',sh=stLoc(o,'upper_arm_'+nm,_sgGA),el=stLoc(o,'forearm_'+nm,_sgGB),hd=stLoc(o,'hand_'+nm,_stArE);
    const H=P.gHand.find(m=>m.userData.sd===sd),F=P.gFore.find(m=>m.userData.sd===sd),U=P.gUpper.find(m=>m.userData.sd===sd);
    const k=Math.max(o.sgK,sd?dk:0),ku=sd?dk:0;if(!(sh&&el&&hd)){H.visible=F.visible=U.visible=false;continue;}
    H.visible=k>.01;H.position.copy(hd);H.scale.setScalar(ST_GOLD.handR*(1+.05*Math.sin(t*9+sd)));H.material.opacity=k;H.material.emissiveIntensity=1.1+.4*Math.sin(t*13+sd*2);
    F.visible=k>.01;stTube(F,el,hd,ST_GOLD.foreR,ku>.01?1:ST_GOLD.fore);F.material.opacity=k*(.85+.15*Math.sin(t*7));F.material.map.offset.x=t*.05;
    U.visible=ku>.01;if(U.visible){stTube(U,sh,el,ST_GOLD.upR,1);U.material.opacity=ku;}}
  // g4: gold zigzag streaks crawling up each forearm (persistent, re-jittered fast)
  P.gStreak.forEach((m,i)=>{const on=S.gold==='streak';m.visible=on;if(!on)return;const d=m.userData,nm=d.sd?'R':'L';d.t-=dt;
    const el=stLoc(o,'forearm_'+nm,_sgGA),hd=stLoc(o,'hand_'+nm,_sgGB);if(!el||!hd){m.visible=false;return;}
    if(d.t<=0){d.t=.07+Math.random()*.08;const ax=_sgGC.copy(el).sub(hd),len=ax.length();ax.normalize();const side=_stArD.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).cross(ax).normalize(),pts=d.p||(d.p=[]),reach=.45+Math.random()*.5;
      (d.wv||(d.wv=new THREE.Vector3())).crossVectors(ax,side).normalize();
      for(let j=0;j<=ST_ARC.seg;j++){const f=j/ST_ARC.seg,q=pts[j]||(pts[j]=new THREE.Vector3());q.copy(hd).addScaledVector(ax,f*len*reach).addScaledVector(side,.15+(Math.random()-.5)*.04).addScaledVector(d.wv,(Math.random()-.5)*.05);}}
    const w=.016,V=d.wv,pts=d.p;stRibbonSet(m,(u,a2,i6)=>{const j=Math.round(u*ST_ARC.seg),q=pts[j],ww=w*(1-u*.7);a2[i6]=q.x-V.x*ww;a2[i6+1]=q.y-V.y*ww;a2[i6+2]=q.z-V.z*ww;a2[i6+3]=q.x+V.x*ww;a2[i6+4]=q.y+V.y*ww;a2[i6+5]=q.z+V.z*ww;});});
  // dash: many blue + yellow arcs shorting round the right arm, thinning out as the coat fades
  P.darc.forEach((m,i)=>{const live=dk>.02&&Math.random()<.35+.6*dk;m.visible=live;if(!live)return;const d=m.userData;
    const a=stLoc(o,i%3?'forearm_R':'upper_arm_R',_sgGA),b=stLoc(o,i%3?'hand_R':'forearm_R',_sgGB);if(!a||!b){m.visible=false;return;}
    const ax=_sgGC.copy(b).sub(a),len=ax.length();ax.normalize();const side=_stArD.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).cross(ax).normalize(),pts=d.p||(d.p=[]),u0=Math.random()*.6;
    (d.wv||(d.wv=new THREE.Vector3())).crossVectors(ax,side).normalize();
    for(let j=0;j<=ST_ARC.seg;j++){const f=j/ST_ARC.seg,q=pts[j]||(pts[j]=new THREE.Vector3());q.copy(a).addScaledVector(ax,(u0+f*.45)*len).addScaledVector(side,.12+(Math.random()-.5)*.1).addScaledVector(d.wv,(Math.random()-.5)*.12);}
    const w=ST_ARC.w*.8,V=d.wv;m.material.opacity=.6+.4*dk;stRibbonSet(m,(u,a2,i6)=>{const j=Math.round(u*ST_ARC.seg),q=pts[j];a2[i6]=q.x-V.x*w;a2[i6+1]=q.y-V.y*w;a2[i6+2]=q.z-V.z*w;a2[i6+3]=q.x+V.x*w;a2[i6+4]=q.y+V.y*w;a2[i6+5]=q.z+V.z*w;});});}
const _stArA=new THREE.Vector3(),_stArB=new THREE.Vector3(),_stArC=new THREE.Vector3(),_stArD=new THREE.Vector3(),_stArE=new THREE.Vector3();
const ST_GEO={ball:new THREE.SphereGeometry(1,20,14),drop:new THREE.SphereGeometry(1,10,8),plane:new THREE.PlaneGeometry(1,1),shard:new THREE.OctahedronGeometry(1,0)};
function stBuild(o,kind){
  const g=new THREE.Group();g.name='Class look '+kind;g.userData={kind,parts:{}};const P=g.userData.parts;
  const add=(m,list)=>{m.renderOrder=3;m.frustumCulled=false;g.add(m);(P[list]||(P[list]=[])).push(m);return m;};
  if(kind==='fireArm'||kind==='fireTorch'){const torch=kind==='fireTorch',n=torch?9:10;   // user 2026-11-25: the whole arm under fire (sleeve hidden), flames short
    for(let i=0;i<n;i++)add(new THREE.Mesh(ST_GEO.ball,fireMat({mode:'ball',disp:.42,flow:[0,1,0],scale:[2.4,2.4,2.4],speed:1.7,int:1.05,op:.92,seed:i*7.3})),'arm');
    add(new THREE.Mesh(ST_GEO.ball,fireMat({mode:'ball',disp:.5,flow:[0,1,0],scale:[2,2,2],speed:1.9,int:1.35,op:.95,seed:3.1})),'hand');
    if(torch)add(new THREE.Mesh(ST_GEO.ball,fireMat({mode:'ball',disp:.6,flow:[0,1,0],scale:[1.6,1.6,1.6],speed:2.2,int:1.2,op:.85,seed:9.4})),'hand');
    for(let i=0;i<6;i++)add(new THREE.Sprite(new THREE.SpriteMaterial({map:stTex('soft'),color:'#ffb347',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})),'ember');
    // flame tongues licking up off the sleeve (user 2026-11-25: arm should read as fire) - few meshes, no per-frame PARTS
    for(let i=0;i<FIRE_TONGUES;i++)add(new THREE.Mesh(ST_GEO.ball,fireMat({mode:'ball',disp:.55,flow:[0,1,0],scale:[2,2,2],speed:2.3,int:.95,op:.9,seed:11+i*3.7})),'tongue');}
  else if(kind==='inkDrip'){for(let i=0;i<7;i++)add(new THREE.Mesh(ST_GEO.drop,stMat('ink')),'drop');for(let i=0;i<4;i++)add(new THREE.Sprite(stMatNew('inkSmoke')),'wisp');}
  else if(kind==='footMist'){for(let i=0;i<14;i++)add(new THREE.Sprite(stMatNew('mist')),'mist');}
  else if(kind==='stormArc'){for(let i=0;i<ST_ARC.n;i++){const m=add(stRibbon(ST_ARC.seg,new THREE.MeshBasicMaterial({color:i%4===3?'#7fe8ff':'#fff3a0',transparent:true,depthWrite:false,side:THREE.DoubleSide})),'arc');m.userData.t=-Math.random()*.3;
    m.userData.src=i<ST_ARC.body?0:i<ST_ARC.body+ST_ARC.wand?1:2;const gl=add(stRibbon(ST_ARC.seg,new THREE.MeshBasicMaterial({map:stArcGlowTex(),color:i%4===3?'#38d8ff':'#ffc21c',transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})),'arcGlow');stRibbonUV(gl);m.userData.gl=gl;}
    for(let i=0;i<ST_ARC.dash;i++){const m=add(stRibbon(ST_ARC.seg,new THREE.MeshBasicMaterial({color:i%2?'#7fe8ff':'#fff3a0',transparent:true,depthWrite:false,side:THREE.DoubleSide})),'darc');m.visible=false;}
    for(const sd of [0,1]){add(new THREE.Mesh(ST_GEO.ball,stGoldMat(0)),'gHand').userData.sd=sd;add(new THREE.Mesh(ST_GOLD.tube,stGoldMat(1)),'gFore').userData.sd=sd;add(new THREE.Mesh(ST_GOLD.tube,stGoldMat(1)),'gUpper').userData.sd=sd;}
    for(let i=0;i<ST_GOLD.streaks*2;i++){const m=add(stRibbon(ST_ARC.seg,new THREE.MeshBasicMaterial({color:'#ffd23a',transparent:true,depthWrite:false,side:THREE.DoubleSide})),'gStreak');m.userData.sd=i%2;m.userData.t=0;}}
  else if(kind==='frostBreath'){for(let i=0;i<4;i++)add(new THREE.Sprite(stMatNew('breath')),'puff');for(let i=0;i<7;i++)add(new THREE.Sprite(stMatNew('glint')),'glint');}
  else if(kind==='frostGround'){const d=add(new THREE.Mesh(ST_GEO.plane,stMat('frost')),'decal');d.rotation.x=-Math.PI/2;
    for(let i=0;i<5;i++)add(new THREE.Mesh(ST_GEO.shard,stMat('ice')),'shard');for(let i=0;i<5;i++)add(new THREE.Sprite(stMatNew('glint')),'glint');}
  if(kind==='waterArm'){for(let i=0;i<2;i++)add(stRibbon(48,stMat('waterSheet')),'strand');add(stRibbon(48,stMat('foam')),'foam');
    for(let i=0;i<6;i++)add(new THREE.Mesh(ST_GEO.drop,stMat('water')),'bead');for(let i=0;i<5;i++)add(new THREE.Mesh(ST_GEO.drop,stMat('water')),'drip');
    for(let i=0;i<5;i++){const m=add(new THREE.Mesh(ST_GEO.plane,stMatNew('ripple')),'ripple');m.rotation.x=-Math.PI/2;}}
  if(kind==='waterSpiral'){for(let i=0;i<4;i++)add(stRibbon(64,stMat('waterSheet')),'strand');for(let i=0;i<2;i++)add(stRibbon(64,stMat('foam')),'foam');
    add(new THREE.Mesh(ST_GEO.ball,stMat('orb')),'orb');for(let i=0;i<3;i++)add(stRibbon(40,stMat('waterSheet')),'swirl');add(stRibbon(40,stMat('foam')),'swirlFoam');
    for(let i=0;i<8;i++)add(new THREE.Mesh(ST_GEO.drop,stMat('water')),'bead');}
  if(kind==='waterHem'){add(stRibbon(CL_NC*2,stMat('waterSheet')),'hem');add(stRibbon(CL_NC*2,stMat('foam')),'foamHem');
    for(let i=0;i<8;i++)add(new THREE.Mesh(ST_GEO.drop,stMat('water')),'drip');
    for(let i=0;i<8;i++){const m=add(new THREE.Mesh(ST_GEO.plane,stMatNew('ripple')),'ripple');m.rotation.x=-Math.PI/2;}}
  if(kind==='waterOrb'||kind==='waterRing'){
    if(kind==='waterOrb')add(new THREE.Mesh(ST_GEO.ball,stMat('water')),'orb');else for(let i=0;i<7;i++)add(new THREE.Mesh(ST_GEO.drop,stMat('water')),'ring');
    for(let i=0;i<5;i++)add(new THREE.Mesh(ST_GEO.drop,stMat('water')),'drip');
    for(let i=0;i<5;i++){const m=add(new THREE.Mesh(ST_GEO.plane,stMatNew('ripple')),'ripple');m.rotation.x=-Math.PI/2;}}
  o.g.add(g);return g;}
const _stF=new THREE.Vector3(),_stH=new THREE.Vector3();
const stCyc=(t,P,i,n)=>((t/P+i/n)%1+1)%1;   // looping age 0..1 for item i of n
function stanceFX(o,p,now,dt,detail){
  const S=o.fileModel&&stanceOf(o),kind=S&&!p.dn&&!p.gh&&o.g.visible?S.fx:null;
  if(o.stLk&&o.stLk.userData.kind!==kind){o.g.remove(o.stLk);o.stLk=null;}
  if(!kind)return;const g=o.stLk||(o.stLk=stBuild(o,kind)),P=g.userData.parts,t=now/1000;g.visible=true;
  const B=S.br||{T:3.5},ph=(o.readyBreath||0)*6.283;
  const fwd=_stF.set(0,0,1).applyQuaternion(o.b.quaternion);fwd.y=0;fwd.normalize();   // facing in o.g space
  if(kind==='fireArm'||kind==='fireTorch'){const torch=kind==='fireTorch';
    P.arm.forEach((m,i)=>{const u=.12+.86*i/(P.arm.length-1);if(!stArmPt(o,u,m.position))return;m.position.y+=.03;
      const r=(torch?.12:.135)+(torch?.05:.03)*u,w=1+.12*Math.sin(t*7.3+i*1.7);m.position.y+=.03;m.scale.set(r*w,r*(1.55+.3*Math.sin(t*5.1+i)),r*w);});
    if(P.tongue)P.tongue.forEach((m,i)=>{const n=P.tongue.length,T=.55+.12*(i%3),c=t/T+i/n,a=c-Math.floor(c),k=Math.floor(c);   // each tongue: born on the sleeve, rises, thins out
      const h=Math.sin(k*12.9898+i*78.233)*43758.5453,u=.12+.84*(h-Math.floor(h));if(!stArmPt(o,u,m.position))return;
      m.position.y+=.1+a*.13;m.position.x+=Math.sin(k*3.1+i)*.03;m.position.z+=Math.cos(k*2.3+i)*.03;
      const r=.06*(1-a*.75)*(.8+.4*u);m.scale.set(r,r*(1.7+a*.6),r);});
    const h=stLoc(o,'hand_L',_stH);if(h){P.hand[0].position.copy(h).y+=torch?.16:.06;const s=torch?.17:.075;P.hand[0].scale.set(s,s*(torch?2.3:1.8)*(1+.12*Math.sin(t*9)),s);
      if(P.hand[1]){P.hand[1].position.copy(h).y+=.48+.05*Math.sin(t*6);P.hand[1].scale.set(.11,.3*(1+.2*Math.sin(t*8.3)),.11);}
      P.ember.forEach((m,i)=>{const a=stCyc(t,1.1,i,6);m.position.copy(h);m.position.x+=Math.sin(i*2.1+t)*.12*a;m.position.z+=Math.cos(i*1.3+t)*.12*a;m.position.y+=.1+a*(torch?.9:.6);
        m.scale.setScalar(.035*(1-a*.6));m.material.opacity=Math.sin(a*Math.PI);});}
  }else if(kind==='inkDrip'){
    const h=stLoc(o,'hand_L',_stH);if(h){const st=g.userData.st||(g.userData.st=P.drop.map(()=>({a:1,x:0,y:0,z:0})));
      P.drop.forEach((m,i)=>{const a=stCyc(t,1.3,i,P.drop.length),q=st[i];if(a<q.a){q.x=h.x+(Math.random()-.5)*.07;q.y=h.y-.06;q.z=h.z+(Math.random()-.5)*.07;}q.a=a;
        const fall=a<.25?a/.25*.03:.03+(a-.25)*(a-.25)*2.4;m.position.set(q.x,q.y-fall,q.z);const sz=.03*(a<.25?.5+a*2:1-(a-.25)*.6);m.scale.set(sz,sz*(a<.25?1+a*3:1.9),sz);m.visible=m.position.y>.02;});
      P.wisp.forEach((m,i)=>{const a=stCyc(t,2.2,i,4),an=t*.9+i*1.57;m.position.set(h.x+Math.cos(an)*.09,h.y-.04+a*.18,h.z+Math.sin(an)*.09);m.scale.setScalar(.12+a*.2);m.material.opacity=.45*Math.sin(a*Math.PI);});}
  }else if(kind==='stormArc'){stormGold(o,S,P,dt,t);   // gold hands / dash arm coat (user 2026-11-25)
    // each arc: pick a body segment, a zigzag along its surface, lives 0.05-0.11 s, waits 0.05-0.35 s, again
    P.arc.forEach(m=>{const d=m.userData;d.t+=dt;
      if(d.t>=(d.L||0)){d.t=-(ST_ARC.gap[0]+Math.random()*(ST_ARC.gap[1]-ST_ARC.gap[0]));d.L=ST_ARC.life[0]+Math.random()*(ST_ARC.life[1]-ST_ARC.life[0]);
        let sg,a,b;if(d.src===1&&S.noWand){sg=['forearm_R','hand_R',.07];a=stLoc(o,'forearm_R',_stArA);b=stLoc(o,'hand_R',_stArB);if(a&&b)b.addScaledVector(_stArC.copy(b).sub(a),.35);}   // no wand: these crawl round the right hand
        else if(d.src===1&&o.tip){sg=['hand_R','tip',.05];a=stLoc(o,'hand_R',_stArA);b=o.g.worldToLocal(o.tip.getWorldPosition(_stArB));}   // along the wand
        else if(d.src===2){sg=['forearm_L','hand_L',.07];a=stLoc(o,'forearm_L',_stArA);b=stLoc(o,'hand_L',_stArB);if(a&&b)b.addScaledVector(_stArC.copy(b).sub(a),.35);}   // round the left hand
        else{sg=ST_ARC.bones[Math.random()*ST_ARC.bones.length|0];a=stLoc(o,sg[0],_stArA);b=stLoc(o,sg[1],_stArB);}d.ok=!!(a&&b);
        if(d.ok){const ax=_stArB.sub(_stArA),len=ax.length();ax.normalize();const side=_stArC.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).cross(ax).normalize();
          const u0=d.src===1?Math.random()*.2:Math.random()*.7,span=d.src===1?len*(.75+Math.random()*.45):Math.min(len*.8,ST_ARC.len[0]+Math.random()*(ST_ARC.len[1]-ST_ARC.len[0])),r=sg[2],pts=d.p||(d.p=[]);
          const off=_stArD.copy(side).multiplyScalar(r);const tw=_stArE.crossVectors(ax,side);(d.wv||(d.wv=new THREE.Vector3())).copy(tw).add(side).normalize();
          for(let i=0;i<=ST_ARC.seg;i++){const f=i/ST_ARC.seg,j=i&&i<ST_ARC.seg?ST_ARC.jit:0;const q=pts[i]||(pts[i]=new THREE.Vector3());
            q.copy(_stArA).addScaledVector(ax,u0*len+f*span).add(off).addScaledVector(side,(Math.random()-.5)*j).addScaledVector(tw,(Math.random()-.5)*j*1.6);}}}
      const on=d.t>=0&&d.ok;m.visible=on;d.gl.visible=on;if(!on)return;const k=1-d.t/d.L,w=ST_ARC.w*(.6+.4*k)*(d.src===1?.8:1),pts=d.p;
      m.material.opacity=k>.5?1:k*2;d.gl.material.opacity=.35*m.material.opacity;
      const V=d.wv,rib=(M,W)=>stRibbonSet(M,(u,a2,i6)=>{const i=Math.round(u*ST_ARC.seg),q=pts[i];a2[i6]=q.x-V.x*W;a2[i6+1]=q.y-V.y*W;a2[i6+2]=q.z-V.z*W;a2[i6+3]=q.x+V.x*W;a2[i6+4]=q.y+V.y*W;a2[i6+5]=q.z+V.z*W;});
      rib(m,w);rib(d.gl,w*ST_ARC.glow);});
  }else if(kind==='footMist'){
    P.mist.forEach((m,i)=>{const a=stCyc(t,4.5,i,P.mist.length),an=i*2.4+t*.15,r=.3+a*.95;m.position.set(Math.cos(an)*r,.08+a*.22,Math.sin(an)*r);
      m.scale.set(.8+a*1.1,.35+a*.45,1);m.material.opacity=.9*Math.sin(a*Math.PI);});
  }else if(kind==='frostBreath'){
    const hd=stLoc(o,'head',_stH);if(hd){const cyc=(t*6.283/B.T+ph)/6.283,k=((cyc-.5)%1+1)%1;   // puffs on the falling half of the breath (exhale)
      P.puff.forEach((m,i)=>{const a=k*2-i*.08;const on=a>0&&a<1;m.visible=on;if(!on)return;
        m.position.copy(hd).addScaledVector(fwd,.18+a*.42);m.position.y+=-.1+a*.06;m.scale.setScalar(.06+a*.26);m.material.opacity=.55*(1-a)*Math.min(1,a*6);});}
    P.glint.forEach((m,i)=>{const an=i*.9+t*.25,r=.55+.15*Math.sin(i*3.1);m.position.set(Math.cos(an)*r,.5+((i*.37+t*.08)%1)*1.6,Math.sin(an)*r);
      m.scale.setScalar(.075);m.material.opacity=.3+.7*Math.max(0,Math.sin(t*3+i*2.3));});
  }else if(kind==='frostGround'){
    const d=P.decal[0];d.position.set(0,.025,0);const s=1.5+.06*Math.sin(t*1.3);d.scale.set(s,s,s);d.rotation.z=t*.05;d.material.opacity=.5+.1*Math.sin(t*2);
    const h=stLoc(o,'forearm_L',_stH);if(h)P.shard.forEach((m,i)=>{const an=t*1.4+i*1.257;m.position.set(h.x+Math.cos(an)*.16,h.y+.03*Math.sin(t*2+i),h.z+Math.sin(an)*.16);
      m.scale.set(.018,.045,.018);m.rotation.set(t+i,t*1.3,i);});
    P.glint.forEach((m,i)=>{const an=i*1.3+t*.3,r=.3+.5*((i*.29)%1);m.position.set(Math.cos(an)*r,.05+.04*i,Math.sin(an)*r);m.scale.setScalar(.04);m.material.opacity=Math.max(0,Math.sin(t*2.6+i*2));});
  }
  if(kind==='waterSpiral'){   // left arm: shoulder -> elbow -> hand; strands spiral outside the sleeve, orb at the hand
    const sh=stLoc(o,'upper_arm_L',_stH),el=stLoc(o,'forearm_L',_swA),hd=stLoc(o,'hand_L',_swB);
    if(sh&&el&&hd){const orbC=_swD.copy(hd).addScaledVector(_stV3.copy(hd).sub(el).normalize(),.13);
      const path=(u,out)=>u<.45?out.lerpVectors(sh,el,u/.45):out.lerpVectors(el,orbC,(u-.45)/.55);
      const T0=g.userData.v0||(g.userData.v0=[0,1,2,3,4].map(()=>new THREE.Vector3())),up=T0[4].set(0,1,0);
      const strand=(m,ph,rad,w,turns,spd)=>stRibbonSet(m,(u,a,k)=>{path(Math.max(0,u-.01),T0[0]);path(Math.min(1,u+.01),T0[1]);const tan=T0[1].sub(T0[0]).normalize();
        const N1=T0[2].crossVectors(tan,up);if(N1.lengthSq()<1e-4)N1.set(1,0,0);N1.normalize();const N2=T0[3].crossVectors(tan,N1);
        const an=u*6.283*turns-t*spd+ph,r=rad*(1+.1*Math.sin(t*4+u*11+ph))*(u>.85?1-(u-.85)/.15*.6:1),ww=w*Math.min(1,u*10)*Math.min(1,(1-u)*10);
        const c=path(u,_stV2).addScaledVector(N1,Math.cos(an)*r).addScaledVector(N2,Math.sin(an)*r);
        a[k]=c.x-tan.x*ww;a[k+1]=c.y-tan.y*ww-ww*.6;a[k+2]=c.z-tan.z*ww;a[k+3]=c.x+tan.x*ww;a[k+4]=c.y+tan.y*ww+ww*.6;a[k+5]=c.z+tan.z*ww;});
      strand(P.strand[0],0,.19,.03,3.2,5);strand(P.strand[1],1.57,.2,.026,3.2,5);strand(P.strand[2],3.14,.22,.024,2.4,-3.6);strand(P.strand[3],4.71,.17,.02,4,6.5);
      strand(P.foam[0],.8,.205,.008,3.2,5);strand(P.foam[1],3.9,.225,.007,2.4,-3.6);
      const ob=P.orb[0];ob.position.copy(orbC);ob.scale.setScalar(.12*(1+.05*Math.sin(t*3.3)));
      // water running round inside the orb: rings at different tilts turning
      const ring=(m,tilt,yaw,rad,w,spd)=>stRibbonSet(m,(u,a,k)=>{const an=u*6.283*.85+t*spd,x=Math.cos(an)*rad,y0=Math.sin(an)*rad;
        const cy=Math.cos(tilt),sy=Math.sin(tilt),cz=Math.cos(yaw),sz=Math.sin(yaw);let px=x,py=y0*cy,pz=y0*sy;const qx=px*cz-pz*sz,qz=px*sz+pz*cz;
        const ww=w*Math.sin(u*Math.PI);a[k]=orbC.x+qx;a[k+1]=orbC.y+py-ww;a[k+2]=orbC.z+qz;a[k+3]=orbC.x+qx*(1+ww*6);a[k+4]=orbC.y+py+ww;a[k+5]=orbC.z+qz*(1+ww*6);});
      ring(P.swirl[0],.3,t*.4,.085,.02,4.2);ring(P.swirl[1],1.3,1.2+t*.3,.08,.018,-3.6);ring(P.swirl[2],2.2,2.4,.07,.016,5.1);ring(P.swirlFoam[0],.8,t*.5,.09,.006,4.6);
      P.bead.forEach((m,i)=>{const u=stCyc(t,1.8,i,8),an=u*6.283*3.2-t*5+i*.8;path(u,m.position);m.position.x+=Math.cos(an)*.2;m.position.z+=Math.sin(an)*.2;m.position.y+=Math.sin(an*1.3)*.05;m.scale.setScalar(.02+.008*(i%3));});}
  }else if(kind==='waterArm'){   // two water strands + a foam line spiral from the elbow over the hand and up the wand to its tip
    const e=stLoc(o,'forearm_R',_stH),h=stLoc(o,'hand_R',_swA),tip=o.tip?o.g.worldToLocal(o.tip.getWorldPosition(_swB)):null;
    if(e&&h&&tip){const path=(u,out)=>u<.45?out.lerpVectors(e,h,u/.45):out.lerpVectors(h,tip,(u-.45)/.55);
      const T0=new THREE.Vector3(),T1=new THREE.Vector3(),N1=new THREE.Vector3(),N2=new THREE.Vector3(),c=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
      const strand=(m,ph,rad,w)=>stRibbonSet(m,(u,a,k)=>{path(Math.max(0,u-.01),T0);path(Math.min(1,u+.01),T1);const tan=T1.sub(T0).normalize();
        N1.crossVectors(tan,up);if(N1.lengthSq()<1e-4)N1.set(1,0,0);N1.normalize();N2.crossVectors(tan,N1);
        const an=u*6.283*2.6-t*5+ph,r=rad*(1-.5*u)*(1+.12*Math.sin(t*6+u*9)),ww=w*(1-.6*u)*Math.min(1,u*12)*Math.min(1,(1-u)*14);
        path(u,c).addScaledVector(N1,Math.cos(an)*r).addScaledVector(N2,Math.sin(an)*r);
        a[k]=c.x-tan.x*0;a[k+1]=c.y-ww;a[k+2]=c.z;a[k+3]=c.x;a[k+4]=c.y+ww;a[k+5]=c.z;});
      strand(P.strand[0],0,.13,.04);strand(P.strand[1],3.14,.12,.032);strand(P.foam[0],1.6,.14,.009);
      P.bead.forEach((m,i)=>{const u=stCyc(t,1.4,i,6),an=u*6.283*3.2-t*5+i;path(u,m.position);m.position.x+=Math.cos(an)*.09*(1-.55*u);m.position.z+=Math.sin(an)*.09*(1-.55*u);m.scale.setScalar(.022*(1-.5*u));});
      P.drip.forEach((m,i)=>{const a=stCyc(t,1.2,i,5),st=g.userData.dr||(g.userData.dr=[]);if(!st[i]||a<st[i].a)st[i]={a,x:h.x+(Math.random()-.5)*.1,y:h.y-.04,z:h.z+(Math.random()-.5)*.1};st[i].a=a;
        const y=st[i].y-a*a*3.2;m.visible=y>.02;m.position.set(st[i].x,Math.max(.02,y),st[i].z);m.scale.set(.016,.028,.016);
        const r=P.ripple[i],land=Math.sqrt(st[i].y/3.2),b=(a-land)/(1-land);r.position.set(st[i].x,.02,st[i].z);r.visible=b>0&&b<.7;r.scale.setScalar(.04+b*.3);r.material.opacity=.6*(1-b/.7);});}
  }else if(kind==='waterHem'){   // the cloak hem turns to running water: a wavy water band + foam line on the real cloth hem, streams falling off it
    const C=o.cloth;const hem=g.userData.hem||(g.userData.hem=new Float32Array(CL_NC*3));let ok=false;
    if(C&&C.P&&C.NR){const b=(C.NR-1)*CL_NC*3;for(let j=0;j<CL_NC;j++){_swA.set(C.P[b+j*3],C.P[b+j*3+1],C.P[b+j*3+2]);o.g.worldToLocal(_swA);hem[j*3]=_swA.x;hem[j*3+1]=_swA.y;hem[j*3+2]=_swA.z;}ok=true;}
    else for(let j=0;j<CL_NC;j++){const an=o.b.rotation.y+Math.PI+(j/(CL_NC-1)-.5)*5.6;hem[j*3]=Math.sin(an)*.42;hem[j*3+1]=.14;hem[j*3+2]=Math.cos(an)*.42;ok=true;}
    if(ok){const hp=(u,out)=>{const f=u*(CL_NC-1),j=Math.min(CL_NC-2,Math.floor(f)),k=f-j;return out.set(lerp(hem[j*3],hem[j*3+3],k),lerp(hem[j*3+1],hem[j*3+4],k),lerp(hem[j*3+2],hem[j*3+5],k));};
      const band=(m,top,bot,ph)=>stRibbonSet(m,(u,a,k)=>{hp(u,_swD);const w=.012*Math.sin(u*40+t*6+ph);a[k]=_swD.x;a[k+1]=_swD.y+top+w;a[k+2]=_swD.z;a[k+3]=_swD.x;a[k+4]=Math.max(.01,_swD.y-bot+w*.5);a[k+5]=_swD.z;});
      band(P.hem[0],.11,.07,0);band(P.foamHem[0],.115,-.1,1.7);
      P.drip.forEach((m,i)=>{const a=stCyc(t,.9,i,8),u=((i*.618)%1);hp(u,_swD);const y0=Math.max(.05,_swD.y-.04),y=y0-a*a*2.6;m.visible=y>.02;m.position.set(_swD.x,Math.max(.02,y),_swD.z);m.scale.set(.024,.05,.024);
        const r=P.ripple[i],land=Math.sqrt(y0/2.6),b=(a-land)/(1-land);r.position.set(_swD.x,.02,_swD.z);r.visible=b>0&&b<.7;r.scale.setScalar(.05+b*.32);r.material.opacity=.6*(1-b/.7);});}
  }
  if(kind==='waterOrb'||kind==='waterRing'){
    const h=stLoc(o,'hand_L',_stH);
    if(h&&P.orb){const m=P.orb[0];m.position.copy(h);m.position.addScaledVector(fwd,.08);m.position.y+=.06+.03*Math.sin(t*2.2);m.scale.set(.13*(1+.08*Math.sin(t*5.1)),.13*(1+.08*Math.sin(t*4.3+1)),.13*(1+.08*Math.sin(t*3.7+2)));}
    if(h&&P.ring)P.ring.forEach((m,i)=>{const an=t*2.4+i*6.283/7;m.position.set(h.x+Math.cos(an)*.18,h.y+.03+.04*Math.sin(an*2),h.z+Math.sin(an)*.18);m.scale.setScalar(.042+.014*(i%3));});
    // drops off the back/side cloak hem, a small ripple where each lands
    P.drip.forEach((m,i)=>{const a=stCyc(t,1.6,i,5),side=(i/4-.5)*2.2,back=_stV2.copy(fwd).multiplyScalar(-.3).add(_stV3.set(fwd.z,0,-fwd.x).multiplyScalar(side*.22));
      const fallT=.35,y0=.24;m.position.set(back.x,a<fallT?y0-(a/fallT)*(a/fallT)*y0:-1,back.z);m.visible=a<fallT;m.scale.set(.018,.03,.018);
      const r=P.ripple[i];r.position.set(back.x,.02,back.z);const b=(a-fallT)/(1-fallT);r.visible=b>0&&b<.6;r.scale.setScalar(.05+b*.35);r.material.opacity=.6*(1-b/.6);});
  }
}
function classStance(o,S,v,now,weight,stride,step,forward,rise){
  const run=stride,ph=(o.readyBreath||0)*6.283,B=S.br||{T:3.5,y:.015,spine:.03,arm:.03};
  const br=Math.sin(now/1000*6.283/B.T+ph),sw=S.sway?Math.sin(now/1000*6.283/S.sway.T+ph*.7):0,bn=S.bounce?Math.abs(Math.sin(now/1000*3.1416/S.bounce.T+ph)):0,R=S.run||{};
  o.b.rotation.y=lerp(o.b.rotation.y,(S.yaw??40)*Math.PI/180,weight);
  const lean=(S.lean||0)+(R.lean||0)*run*(.4+.6*forward);
  o.b.rotation.x=lerp(o.b.rotation.x,lean,weight);
  o.b.rotation.z=lerp(o.b.rotation.z,S.sway?S.sway.roll*sw*(1-run):0,weight);
  o.b.position.x=lerp(o.b.position.x,S.sway?S.sway.x*sw*(1-run):0,weight);
  const kneeDrop=.09*((S.kR||0)+(S.kL||0))*(1-run);
  o.b.position.y=lerp(o.b.position.y,-.045-kneeDrop+B.y*br*(1-.6*run)+(S.bounce?S.bounce.y*bn*(1-run):0)+rise*run,weight);
  const swing=step*run*(R.swing??1);   // run.swing / rz / lz / elR / elL: optional per-stance running arms
  o.armR.rotation.set(lerp(o.armR.rotation.x,lerp(S.rx,R.rx??S.rx,run)-B.arm*br+.3*swing,weight),(S.ry||0)*weight,lerp(o.armR.rotation.z,lerp(S.rz,R.rz??S.rz,run),weight));
  o.armL.rotation.set(lerp(o.armL.rotation.x,lerp(S.lx,R.lx??S.lx,run)+B.arm*br-.3*swing,weight),(S.ly||0)*weight,lerp(o.armL.rotation.z,lerp(S.lz,R.lz??S.lz,run),weight));   // ry/ly = upper-arm twist (turns the elbow bend plane)
  o.readyElbowL=lerp(S.elL,R.elL??S.elL,run)+.04*br;o.readyElbowR=lerp(S.elR,R.elR??S.elR,run);
  for(let side=0;side<2;side++){const leg=o.legs[side].rotation,base=side?S.legL:S.legR;
    leg.x=lerp(leg.x,-lean+base*(1-run*.7)+(side?step:-step)*run*.55,weight);   // -lean keeps the legs upright under a body lean
    leg.z=lerp(leg.z,(side?1:-1)*(side?S.spL:S.spR)*(1-.55*run),weight);}
  o.stK=[(S.kR||0)*(1-run),(S.kL||0)*(1-run)];
  o.stSpine=[(S.spine||0)+B.spine*br*.4+(R.spine||0)*run*.5,(S.chest||0)+B.spine*br+(R.spine||0)*run*.5];
  o.stRoll=S.sway?S.sway.roll*.8*sw*(1-run):0;
  o.stHead=(S.head||0)*(1-run)+(R.head||0)*run;o.stHroll=(S.hroll||0)*(1-run);
}
const natureReadyEuler=new THREE.Euler(),natureReadyArm=new THREE.Quaternion();
function readyStance(o,v,now,weight,nature,whip,whipWeight){
  let stS;
  const stride=clamp(v.sp/6,0,1),step=Math.sin(o.walk),forward=clamp(v.lvz/4,0,1),lean=(.06+.15*forward)*stride;
  const t=(now*.00028+(o.readyBreath??=(now*.00013)%1))%1;
  const breath=t<.34?_cs(t/.34):t<.46?1:t<.84?1-_cs((t-.46)/.38):0;
  const sway=nature?step*stride:0;
  if(whipWeight==null)o.b.rotation.y=lerp(o.b.rotation.y,nature?NATURE_READY_YAW:40*Math.PI/180,weight);
  o.b.rotation.x=lerp(o.b.rotation.x,nature?lean*.65*(1-(whipWeight||0)):lean,weight);
  const rise=nature?.033*step*step:.045*Math.abs(step);
  o.b.position.y=lerp(o.b.position.y,-.045+.019*breath*(1-stride)+rise*stride,weight);
  if(nature){
    const freeOut=whip?.freeOut||0,freeBack=whip?.freeBack||0;
    o.b.rotation.z=lerp(o.b.rotation.z,.037*sway+.052*(freeOut-freeBack),weight);
    o.b.position.x=lerp(o.b.position.x,.048*sway,weight);
    const rightWeight=weight*(1-(whipWeight||0));
    const right=natureReadyEuler.set(lerp(-.13,.29,stride)-.025*sway,0,lerp(-.40,-.35,stride)+.034*sway);
    o.armR.quaternion.slerp(natureReadyArm.setFromEuler(right),rightWeight);
    const left=o.armL.rotation;
    left.set(lerp(left.x,lerp(-.51,.16,stride)-.09*sway-.025*breath+.38*freeOut+.12*freeBack,weight),
      lerp(left.y,lerp(-.68,.10,stride)+.08*sway+1.22*freeOut-.14*freeBack,weight),
      lerp(left.z,lerp(.27,.31,stride)+.041*sway+.42*freeOut+.09*freeBack,weight));
    o.readyElbowL=lerp(1.30+.04*breath,1.24-.095*sway,stride)-.48*freeOut+.06*freeBack;
    o.readyElbowR=lerp(.28,.20,stride);
  }else if((stS=stanceOf(o))&&!stS.same){classStance(o,stS,v,now,weight,stride,step,forward,rise);return;
  }else{
    o.armR.rotation.set(lerp(o.armR.rotation.x,-1.06-lean*.9-.022*breath,weight),0,lerp(o.armR.rotation.z,.27,weight));
    o.armL.rotation.set(lerp(o.armL.rotation.x,.11+.055*breath*(1-stride)-.23*step*stride,weight),0,
      lerp(o.armL.rotation.z,.21+.035*breath+.045*step*stride,weight));
    o.readyElbowL=.73+.11*breath-.13*step*stride;
    if(stS?.lzAdd){o.armL.rotation.z+=stS.lzAdd*weight;o.armL.rotation.x+=(stS.lxAdd||0)*weight;}   // shared pose, free arm held a little out (Water spiral)
    o.readyElbowR=1.76+lean*.75;
  }
  for(let side=0;side<2;side++){
    const leg=o.legs[side].rotation,base=side?.27:-.39;
    leg.x=lerp(leg.x,base*(1-stride*.72)+(side?step:-step)*stride*(nature?.58:.53),weight);
    leg.z=lerp(leg.z,side?.18:-.19,weight);
  }
}
function jumpShoulders(o,weight){
  const lift=o.jumpLegs.p[9]*weight;
  if(lift<.003)return;
  const a=o.jumpArms||(o.jumpArms={
    shoulders:[o.armR,o.armL,...o.rig.filter(k=>!k.leg).map(k=>k.bone)]
      .map(({position})=>({position,before:new THREE.Vector3(),after:new THREE.Vector3()})),
    applied:false
  });
  for(const k of a.shoulders){
    k.before.copy(k.position);
    k.position.y+=lift;k.position.x*=1-lift*.55;
    k.after.copy(k.position);
  }
  a.applied=true;
}
// ยกโล่ (คลิกขวาค้าง): ไม้ขวางหน้าอก มือซ้ายดันออก ย่อตัวรับแรง หายใจ/สั่นนิด ๆ — สายดินใช้ Stand กันเลยไม่ใส่
const CBLOCK=[-1.45,0.55,-0.15,0.12,-1.35,-0.15];
const CBLOCK_PATH={0:[-1.25,0.35,-0.08,0.08,-1.15,-0.4],1:[-1.25,0.1,-0.18,0.13,-1.65,-0.1],7:[-1.5,-0.16,0,0.34,-1.5,0.16],8:[-1.4,0.25,-0.1,0.08,-1.45,-0.25]};
function blockPose(o,p,dt,now){
  const on=!!p.sh&&!p.ea&&!p.fl&&!p.dn&&!p.fr;o.bkw=(o.bkw||0)+((on?1:0)-(o.bkw||0))*Math.min(1,dt*(on?14:6));const w=o.bkw;if(w<0.005)return;
  const R=o.armR.rotation,L=o.armL.rotation,br=Math.sin(now/420)*0.03,B=CBLOCK_PATH[getKit(p.id).path]||CBLOCK;
  R.x=lerp(R.x,B[0]+br,w);R.z=lerp(R.z,B[1],w);o.b.rotation.y+=B[2]*w;o.b.rotation.x+=(B[3]+br*0.5)*w;L.x=lerp(L.x,B[4]-br,w);L.z=lerp(L.z,B[5],w);o.b.position.y-=0.1*w;
  if(!(p.wv>1)){o.legs[0].rotation.x=lerp(o.legs[0].rotation.x,0.22,w);o.legs[1].rotation.x=lerp(o.legs[1].rotation.x,-0.3,w);o.legs[0].rotation.z=0.1*w;o.legs[1].rotation.z=-0.1*w;}
}
// Left-handed wand (Frost, user 2026-11-24 "do it for every skill"): the right-handed cast result is mirrored across the
// body: arms swap (z flips), twist/roll/side-shift flip, legs swap, knee/elbow layers swap. Mirror is its own inverse.
function poseMirror(o){const R=o.armR.rotation,L=o.armL.rotation,rx=R.x,rz=R.z,ry=R.y;
  R.x=L.x;R.z=-L.z;R.y=-L.y;L.x=rx;L.z=-rz;L.y=-ry;
  o.b.rotation.y=-o.b.rotation.y;o.b.rotation.z=-o.b.rotation.z;o.b.position.x=-o.b.position.x;
  const a=o.legs[0].rotation,b=o.legs[1].rotation,ax=a.x,az=a.z;a.x=b.x;a.z=-b.z;b.x=ax;b.z=-az;
  if(o.caJ){const j=o.caJ,eR=o.caJR||0;o.caJ=[j[1],j[0],eR];o.caJR=j[2];}}
function castPose(o,p,v,dt,now){
  if(o.emo&&!o.caN&&!(o.cpT>0)){o.vsp=v.sp;if(emotePose(o,p,dt))return;}   // อีโมต (js/52)
  if(o.caN){if(p.fl||p.dn){o.caN=null;o.b.rotation.z=0;if(o.ctr){trailStop(o.ctr);o.ctr=null;}}else{o.vsp=v.sp;blockPose(o,p,dt,now);return;}}   // ท่าสกิลเล่นทีหลัง (lateSkillPose)
  castPose0(o,p,v,dt,now);blockPose(o,p,dt,now);
}
// เรียกหลังไฟล์สาย (pyroFX/stormFX/frostFX/earthFX) → ท่าสกิลทับท่าค้างของสายได้ แล้วคืนท่าเดิมตอนจบ
function lateSkillPose(o,p,dt,now){if(o.caN&&!p.fl&&!p.dn)skillPose(o,p,dt,now);}
function castPose0(o,p,v,dt,now){
  const R=o.armR.rotation,L=o.armL.rotation,c=o.cpa||(o.cpa=[R.x,R.z,0,0,L.x,L.z]);o.vsp=v.sp;
  if(p.fl||p.dn){o.cpT=0;if(o.ctr){trailStop(o.ctr);o.ctr=null;}return;}
  if(!(o.cpT>0)){if(o.bz){o.b.rotation.z=0;o.bz=0;}c[0]=R.x;c[1]=R.z;c[2]=o.b.rotation.y;c[3]=0;c[4]=L.x;c[5]=L.z;if(o.ctr){trailStop(o.ctr);o.ctr=null;}return;}
  o.cpT-=dt;const k=1-Math.max(0,o.cpT)/CPOSE_T,K=CPOSE[o.cpS|0]||CPOSE[0];
  // host ปล่อยลูกเวททันทีที่กด → ง้างสั้นมาก (0.06 วิ) แล้วฟาดทันที (0.1 วิ) ให้ลูกเวทออกตอนไม้ฟาด • ตามแรงยาว
  const k0=0.10,k1=0.30,hold=0.42,settle=k<0.62?1:1-_cs((k-0.62)/0.38);
  const w=Math.min(1,k/0.04)*settle;
  o.castPoseWeight=_cs(Math.min(1,k*CPOSE_T/.06))*settle;
  const T=_cpT,rest=_cpR;rest[0]=R.x;rest[1]=R.z;rest[2]=o.b.rotation.y;rest[3]=0;rest[4]=L.x;rest[5]=L.z;
  for(let i=0;i<6;i++){let a;
    if(k<k0)a=lerp(rest[i],K[0][i],_ce(k/k0));
    else if(k<k1)a=lerp(K[0][i],K[1][i],_cb((k-k0)/(k1-k0)));
    else a=lerp(K[1][i],K[2][i],_cs(clamp((k-hold)/(1-hold),0,1)));
    a=rest[i]+(a-rest[i])*AMP_B[i];T[i]=lerp(rest[i],a,w);}
  counterArm(o,T,rest,w,(o.cpS|0)===3||(o.cpS|0)===7);
  T[0]=Math.max(-3.35,T[0]);T[4]=Math.max(-3.35,T[4]);
  if((o.cpS|0)===1){if(k<k1){const u=k/k1*Math.PI*2;T[0]+=0.3*Math.sin(u)*w;T[1]+=0.3*(Math.cos(u)-1)*w;}}   // วนข้อมือเป็นวงแล้วสะบัด
  const r=1-Math.exp(-dt*(k>=k0&&k<hold?65:31));for(let i=0;i<6;i++)c[i]+=(T[i]-c[i])*r;
  R.x=c[0];R.z=c[1];o.b.rotation.y=c[2];o.b.rotation.x+=c[3];L.x=c[4];L.z=c[5];
  if((o.cpS|0)===3)wandTwoHand(o,w);   // ลูกไฟชาร์จ: ดันด้วยไม้สองมือ
  {const bell=k<k0?0:Math.sin(Math.min(1,(k-k0)/(1-k0))*Math.PI)*w;o.b.position.y-=0.08*bell;o.b.rotation.z=(CP_BEND[o.cpS|0]||0)*bell;o.bz=1;}   // ทิ้งน้ำหนักตัวลงตอนฟาด + เอียงตามแรง
  const st=CP_STEP[o.cpS|0]*w*(k<k0?0:k<k1?_cs((k-k0)/(k1-k0)):1);
  if(st>0.01&&v.sp<0.6){o.legs[1].rotation.x=-0.42*st;o.legs[0].rotation.x=0.3*st;}
  // หางแสงบาง ๆ จากปลายไม้ตอนฟาด
  if(k>=k0&&k<k1+.06){if(!o.ctr){const col=CPCOL[getKit(p.id).path]||'#ffffff';o.ctr=trailNew({col:'#ffffff',col2:col,w:0.05,life:0.16,k:1.3});}
    o.tip.updateWorldMatrix(true,false);o.tip.getWorldPosition(_tv1);trailPoint(o.ctr,_tv1.x,_tv1.y,_tv1.z);}
  else if(o.ctr){trailStop(o.ctr);o.ctr=null;}
}
function clearCharacterCast(o){
  o.caN=null;o.cpT=0;o.castT=0;o.caJ=null;o.bz=1;o.wBeamPose=null;o.wnPose=null;
  if(o.ctr){trailStop(o.ctr);o.ctr=null;}
  if(o.wWings){const d=o.wWings.userData;d.ul=d.fk=-1;}
}
function hitRecoilPose(o,dt){
  if(o.recoilT===undefined)return;
  const t=o.recoilT=Math.min(.19,o.recoilT+dt);
  if(t>=.19){o.recoilT=undefined;return;}
  const a=o.recoilAngle===undefined?-Math.PI/2:o.recoilAngle+o.g.rotation.y;
  const w=o.recoilPower*(t<.032?_cs(t/.032):1-_cs((t-.032)/.158));
  o.b.rotation.x+=Math.sin(a)*w;
  o.b.rotation.z-=Math.cos(a)*w;
}
function syncPlayers(P,mode,now,dt){
  const seen=new Set(),myP=P.find(q=>q.id===NET.myId),meGhost=!!(myP&&myP.gh);
  for(const p of P){
    seen.add(p.id);
    let o=PM3.get(p.id);
    if(!o){o=makeStudent(getLook(p.id),p.id);PM3.set(p.id,o);o.bat=p.id!==NET.myId;{const L=getLook(p.id);useFileModel(o,'char_student',lookTint(L),L);}}
    const posePath=getKit(p.id).path,nature=posePath===NATUREP;
    // ทำก่อนทางแยกคนตาย: ช่วง ragdoll ไม่เดินนาฬิกาท่าร่าย มิฉะนั้นจะเล่นท่าเดิมต่อเมื่อเกิดใหม่
    if(!p.al||p.dn)o.readyWeight=0;
    if(!p.al||p.dn||o.posePath!==undefined&&o.posePath!==posePath||p.st&&!o.poseStunned)clearCharacterCast(o);
    if(!p.al||p.dn)o.recoilT=undefined;
    if(!p.al&&!(o.deathImpact&&o.flashT>0))endFlash(o);
    o.posePath=posePath;o.poseStunned=!!p.st;
    const g=o.g;
    deathVisualSync(o,p,g.visible);
    g.visible=p.al&&!(p.iv&&!p.ds&&!(p.fr&&(p.fr[3]&2))&&Math.floor(now/80)%2===0);
    // ผี (หาลอร์ดโวลเดอมอร์): คนเป็นมองไม่เห็นผี / ผีเห็นกันเป็นเงาจางๆ
    if(p.gh&&!meGhost){g.visible=false;const l=LGV.st.get(p.id);if(l)lgClear(l);continue;}
    if(!!p.gh!==!!o.ghost){
      o.ghost=!!p.gh;
      setGhost(o,o.ghost);
    }
    const x=tx(p.x),z=tz(p.y);
    o.zs=o.zs===undefined?(p.z||0)+GY(p.x,p.y):lerp(o.zs,(p.z||0)+GY(p.x,p.y)+(p.gh?0.6+Math.sin(now/500)*0.2:0),1-Math.exp(-(p.ja===1?38:20)*dt));
    g.position.set(x,o.zs,z);
    const isMe=p.id===NET.myId,detail=isMe||viewDetailAt(x,o.zs+1,z,6);
    {const A=broomHead(o,p,dt);g.rotation.y=Math.atan2(Math.cos(A),Math.sin(A));}   // บิน = หันตามไม้กวาด (js/69)
    const v=localVel(o,x,z,dt,g.rotation.y);
    clearJumpArms(o);
    if(o.caER?.on)caElbowR(o,0);
    if(o.caEL?.on)caElbowL(o,0);
    if(o.readyHeadApplied){
      const h=o.lgHead;
      if(h.quaternion.equals(o.readyHeadAfter))h.quaternion.copy(o.readyHeadBefore);
      o.readyHeadApplied=false;
    }
    o.darkScythe?.resetLiveHandPose();
    if(!p.al){natHandGearTick(o,false,dt,now);o.jumpLegs=null;jumpCloakPose(o,0);const l=LGV.st.get(p.id);if(l)lgClear(l);if(o.natureWhipView)natureWhipView(o,null);if(ragTick(o,p,v,dt,now))ragHideDead(o,p,now);continue;}   // ตาย = ragdoll ค้างจนเกิดใหม่ (js/48)
    o.hitT=Math.max(0,(o.hitT||0)-dt);
    o.b.position.set(0,0,0);o.b.rotation.set(0,0,0);   // one-frame pose offsets must not build up (body drifted back / stayed tilted)
    if(o.darkGear?.visible||nature||o.natureWhipView?.vine.visible)o.armR.rotation.y=0;   // BA wand twist is applied fresh each frame
    const hoverPose=(posePath===LIGHTP||!!p.lt?.[0]&&!!p.lt[4])&&!p.fl&&!p.dn;   // Light always floats: no walk cycle on the legs (user 2026-11-25)
    if(o.anim)animTick(o,{down:!!p.dn,fly:!!p.fl,sp:hoverPose||p.wn&&p.wn[5]>=1||(p.fr&&p.fr[3]&1)?0:v.sp,castT:o.castT,hitT:o.hitT},dt,isMe?1:!detail&&!o.castT&&!o.hitT&&!p.ds?3:animLod(g));
    if(!o.fileModel)updateCloth(o.cloak,v.lvx,v.lvz,v.sp*(p.fl?1.4:1),now,dt);   // มีโมเดลไฟล์ = ผ้าคลุมโค้ดซ่อนอยู่ (ผ้าจริงคือ js/49)
    o.bsp=v.sp;broomView(o,p,dt,now);o.cocoon.visible=!!p.rt;   // ไม้กวาด: เอียงเลี้ยว + อนิเมชันเรียก/เก็บ (js/69)
    if(p.rt)o.cocoon.rotation.y=now/400;
    o.castT=Math.max(0,o.castT-dt);
    const ck=Math.min(1,o.castT/0.12);
    if(p.fl&&p.wn&&p.wn[7]===2){
      // Featherwing บินเร็ว (Shift): ท่าซูเปอร์แมน — ตัวโน้มไปข้างหน้า มือชี้ไปข้างหน้า ขาเหยียดตามหลัง (ไม่มีไม้กวาด)
      o.b.rotation.x=1.15+Math.min(0.2,v.sp*0.004);o.b.position.y=-0.15+Math.sin(now/420)*0.04;
      o.legs[0].rotation.x=o.legs[1].rotation.x=0.2+Math.sin(now/260)*0.08;
      o.armL.rotation.x=-2.7;o.armL.rotation.z=-0.12;o.armR.rotation.x=-2.7;o.armR.rotation.z=0.12;
    }else if(p.fl){
      // ท่านั่งไม้กวาด: ขาเหยียดไปหน้า ตัวเอนไปข้างหน้า มือจับด้าม
      o.b.rotation.x=0.18+Math.min(0.25,v.sp*0.012);o.b.position.y=-0.05+Math.sin(now/300)*0.05;
      o.legs[0].rotation.x=o.legs[1].rotation.x=-1.25;
      o.armL.rotation.x=-1.05;o.armL.rotation.z=-0.25;o.armR.rotation.x=-1.05;o.armR.rotation.z=0.25;
      o.broom.rotation.x=-0.1+Math.sin(now/300)*0.04;o.broom.rotation.z=clamp(-v.lvx*0.02,-0.4,0.4);
      if(detail&&Math.random()<0.8){const ha=o.fhS!==undefined?o.fhS:p.a,bx=p.x-Math.cos(ha)*30,by=p.y-Math.sin(ha)*30;PARTS.push({x:bx+rnd(-4,4),y:by+rnd(-4,4),h:(p.z||0)+0.8+rnd(-0.1,0.1),vx:rnd(-20,20),vy:rnd(-20,20),vh:rnd(-0.3,0.3),life:0.6,max:0.6,col:Math.random()<0.5?'#ffe9a8':'#ffffff',size:1.6,g:0.5});}
    }else{
      const wfly=hoverPose||p.wn&&p.wn[5]>=1;if(!wfly)o.walk+=dt*Math.min(v.sp,10)*(nature?.64:.68);   // บิน Featherwing: ไม่ก้าวขา ไม่มีเสียงเท้า
      const sw=wfly?0:Math.sin(o.walk)*Math.min(1,v.sp/5);
      if(p.dn){o.b.rotation.x=-1.4;o.b.position.y=0.4;}
      else{o.b.rotation.x=p.ds?0.4:wfly?0:Math.min(0.12,v.sp*0.01);o.b.position.y=wfly?0:Math.abs(Math.cos(o.walk))*0.05*Math.min(1,v.sp/5);}
      o.legs[0].rotation.x=sw*0.75;o.legs[1].rotation.x=-sw*0.75;
      o.legs[0].rotation.z=o.legs[1].rotation.z=0;
      {const still=1-Math.min(1,v.sp/1.2);if(still>0&&!p.fl){o.legs[0].rotation.x+=-0.14*still;o.legs[1].rotation.x+=0.06*still;o.legs[0].rotation.z=0.07*still;o.legs[1].rotation.z=-0.07*still;}}   // relaxed stance (user 2026-11-24)
      o.armL.rotation.x=-sw*0.55;o.armL.rotation.z=0.15;
      o.armR.rotation.x=o.cpT>0?-0.35+sw*0.4:lerp(-0.35+sw*0.4,-1.55,ck);o.armR.rotation.z=-0.12;o.b.rotation.y=0;
    }
    if(o.rig)rigStd(o);
    const casting=!!(o.caN||o.cpT>0||o.castT>0);
    readyBaseR.copy(o.armR.quaternion);readyBaseL.copy(o.armL.quaternion);
    o.castPoseWeight=null;o.caJ=null;
    castPose(o,p,v,dt,now);
    if(o.castPoseWeight!=null){castBaseR.copy(o.armR.quaternion);castBaseL.copy(o.armL.quaternion);}
    o.ends.forEach((E,i)=>{E.rotation.x=-clamp(v.lvz*0.07,0,1.2)+Math.sin(now*0.012+i*1.7)*0.08*(1+v.sp*0.15);E.rotation.z=clamp(v.lvx*0.04,-0.6,0.6);});
    o.shield.visible=!!(p.sh&&!p.fr)||!!(p.fm&(128|16384));   // Frost Sword Guard: no bubble (own half-dome)
    const fireSh=p.sh&&getKit(p.id).path===0;
    if(o.shield.visible){o.shield.material.uniforms.t.value=now/1000;o.shield.material.uniforms.c.value.set(fireSh?'#ff7a2a':p.sh?'#7ff0ff':(p.fm&128)?'#6fb8d8':'#9a7a3a');}
    // โล่ไฟ = เปลือกไฟลุกหุ้มรอบตัว (fireShieldFX ใน js/33) แทนโล่ฟอง
    if(fireSh)o.shield.visible=false;
    fireShieldFX(o,p,fireSh,dt,detail);
    // + ลูกแก้วไฟหุ้มตัว + เม็ดไฟลอยรอบ (แบบ 19 ต.ค. เช้า — ผู้ใช้เลือก "A + ตอนนี้" 2026-10-20)
    if(fireSh&&(!fxLoopName('fsh')||fxLoopKeep('fsh'))){if(!o.fsh){o.fsh=new THREE.Mesh(_fbGeo,fireMat({mode:'ball',shell:1,flow:[0,1,0],scale:[1.4,1.4,1.4],speed:1.4,heat:-0.12,op:0.85,int:1.0}));o.fsh.scale.setScalar(1.38);o.fsh.position.y=1.1;o.g.add(o.fsh);}
      o.fsh.visible=true;o.fsh.rotation.y+=dt*0.6;o.fsh.material.uniforms.uInt.value=o.fshK||1;o.fsh.material.uniforms.uOp.value=.85*(o.fshH||1);
      if(detail)for(let i=0;i<3;i++){const an=rnd(0,6.283),r=rnd(26,34);PARTS.push({x:p.x+Math.cos(an)*r,y:p.y+Math.sin(an)*r,h:(o.zs||0)+rnd(0.2,2.2),vx:0,vy:0,vh:rnd(1.2,2.6),life:0.4,max:0.4,col:i?'#ff7a2a':'#ffc04a',size:rnd(2.4,3.6),g:-1.5});}}
    else if(o.fsh)o.fsh.visible=false;
    statusFX(o,p.fm|0,p.x,p.y,o.zs||0,2.2,now,detail);
    o.stars.visible=!!p.st;o.stars.rotation.y=now/250;
    if(p.fl)o.ring.visible=false;
    else if(teamOn()){o.ring.visible=true;o.ring.material.color.set(TEAMC[p.tm]);}
    else if(isMe){o.ring.visible=true;o.ring.material.color.set('#ffffff');}
    else o.ring.visible=false;
    o.tip.scale.setScalar(0.3+0.08*Math.sin(now/120)+(o.castT>0?0.4:0))*((p.cg||0)>0?0.4:1);
    const pz=o.zs;
    pyroFX(o,p,pz,now,dt);
    stormFX(o,p,pz,now,dt);
    chillFX(o,p,pz,now,dt);
    frostFX(o,p,pz,now,dt);
    earthFX(o,p,pz,now,dt);
    windFX(o,p,pz,now,dt);waterFX(o,p,pz,now,dt);lightFX(o,p,pz,now,dt,v);
    if(o.caN){lateSkillPose(o,p,dt,now);castBaseR.copy(o.armR.quaternion);castBaseL.copy(o.armL.quaternion);}
    if(o.novaT>0||o.nvFx||o.nvFx2)pyroNovaCharge(o,dt,now);if(o.mlcT>0||o.mlcX)frostMlCast(o,p,dt,now);
    waterCharacterPose(o,p,dt,now);windCharacterPose(o,p,dt,now,v);windLatePose(o,p,dt);stormBowView(o,p,dt,now);stormStaffView(o,p,dt,now);dashPose(o,p,dt,now);   // ท่าพุ่ง (js/72) ทับท่าอื่นตอนพุ่ง
    natHookPose(o);natEmpPose(o);
    if(o.wandL&&(casting||o.fPose||o.castPoseWeight!=null)){const sc=o.castPoseWeight!=null&&o.armR.quaternion.equals(castBaseR)&&o.armL.quaternion.equals(castBaseL);
      poseMirror(o);if(sc){castBaseR.copy(o.armR.quaternion);castBaseL.copy(o.armL.quaternion);}}   // Nature Dash / thorn line poses must run before rigSync or the rigged arm never sees them
    const domeKnee=stormDomePose(o,p,pz,now);
    const whip=p.nt?.[0];
    const whipImpact=o.weaponContact?.kind==='whip'&&o.weaponContact.swing===whip?.[0]?o.weaponContact:null;
    const activeWhip=whip&&!p.dn&&!p.fl&&!whip[4]?{start:whip[0],
      age:weaponImpactAge(whipImpact,whip[1],NATURE_WHIP.impact,o.whipStart===whip[0]?o.whipRawAge:0),side:whip[2],angle:whip[3]}:null;
    let whipWeight;
    if(activeWhip){
      if(o.whipStart!==activeWhip.start){
        const gap=activeWhip.start-o.whipStart;
        o.whipCarry=nature&&gap>=NATURE_WHIP.follow-.02&&gap<=NATURE_WHIP.window+.02&&o.whipRawAge>=NATURE_WHIP.follow-.10?
          {angle:nwSwingAngle(gap,o.whipSide),pitch:-1.25+.25*Math.sin(Math.min(1,gap/.46)*Math.PI),
            release:nwRightRelease(gap,o.whipSide)}:null;
      }
      activeWhip.carry=o.whipCarry;
      whipWeight=natureWhipPose(o,activeWhip,nature);
      o.whipSide=activeWhip.side;
    }
    if(whip){o.whipStart=whip[0];o.whipRawAge=whip[1];}
    lightHeadPose(o);
    // Light settles into its resting hover above the floor. That height is not a fall.
    const hover=posePath===LIGHTP?LTV.baFloat:0;
    const airPhase=hover&&p.ja===2&&p.z<=groundH(p.x,p.y,p.z)+hover+.06?0:p.ja||0;
    const authoredElbows=o.faW>0.002||o.sbArmIn>.02||o.eFistBend!=null||!!(o.natFaR||o.natFaL||o.natWrist);
    const sharedCast=o.castPoseWeight!=null&&o.armR.quaternion.equals(castBaseR)&&o.armL.quaternion.equals(castBaseL);
    // Blend through ready while a shared cast winds up or settles; airborne balance stays layered over it.
    const armsFree=!casting&&o.armR.quaternion.equals(readyBaseR)&&o.armL.quaternion.equals(readyBaseL);
    let ready=0;
    if(!domeKnee&&!authoredElbows&&readyAllowed(o,p,now)){
      if(activeWhip){if(nature)ready=1;}
      else if(sharedCast&&!p.sh)ready=1-o.castPoseWeight;
      else if(armsFree||o.bkw>.005)ready=1-(o.bkw||0);
    }
    const rightReady=ready*(activeWhip?1-whipWeight:1);
    o.readyWeight=rightReady;
    o.stSpine=o.stK=null;o.stHead=o.stHroll=0;
    if(ready)readyStance(o,v,now,ready,nature,activeWhip,whipWeight);
    const jumpWeight=jumpLegPose(o,p,dt,domeKnee,airPhase,hover);
    const liftOff=airPhase===1?_cs(clamp((o.jumpLegs?.time||0)/.105,0,1)):1;
    const jumpArmWeight=p.sh||activeWhip?0:jumpWeight*ready*liftOff;
    jumpArmPose(o,jumpArmWeight);
    hitRecoilPose(o,dt);
    frostSwapPose(o);
    lightLeanPose(o,p,v,dt,ready);
    if(o.rig){
      if(ready&&o.stSpine)stanceSpine(o,ready);else stanceSpineOff(o);
      rigSync(o,dt,false,Math.max(jumpWeight,ready),Math.max(jumpArmWeight,ready));windForearm(o);stormBowForearm(o);earthFistForearm(o);natForearmR(o);
      if(domeKnee)dpKnees(o,0,domeKnee);
      else if(jumpWeight||o.caJ||ready){
        const kneeR=(o.caJ?.[0]||0)+(o.stK?o.stK[0]:.18)*ready,kneeL=(o.caJ?.[1]||0)+(o.stK?o.stK[1]:.13)*ready;
        dpKnees(o,lerp(kneeR,o.jumpLegs?.p[4]||0,jumpWeight),lerp(kneeL,o.jumpLegs?.p[5]||0,jumpWeight));
      }
      if(!authoredElbows){
        const walkBend=1-0.6*(!p.fl&&!p.dn&&!o.caN&&v.sp>.6?Math.min(1,v.sp/5):0);
        const left=sharedCast&&o.caJ&&!activeWhip?o.caJ[2]+(o.readyElbowL||0)*ready:lerp(.45*walkBend,o.readyElbowL||0,ready);
        const right=sharedCast&&o.caJ&&!activeWhip?o.caJR+(o.readyElbowR||0)*rightReady:lerp(.35*walkBend,o.readyElbowR||0,rightReady);
        const airElbow=o.jumpLegs?.p[8]||0;
        const lowArm=nature?ready*(1-jumpArmWeight)*clamp(v.sp/6,0,1):0;
        caElbowL(o,lerp(left,airElbow,jumpArmWeight),lowArm);
        caElbowR(o,lerp(right,airElbow,jumpArmWeight));
      }
      if(jumpArmWeight)jumpShoulders(o,jumpArmWeight);
      if(ready)readyHeadPose(o,ready,isMe,nature?activeWhip:null);
    }
    jumpCloakPose(o,jumpWeight?(o.jumpLegs.p[6]*jumpWeight):0);
    if(activeWhip||o.natureWhipView)natureWhipView(o,activeWhip);
    natureCharacter(o,p,now,dt,detail);
    darknessCharacter(o,p,myP,now);
    stanceFX(o,p,now,dt,detail);
    frostSwapLate(o,dt);
    windPalmLate(o,p,dt,now);
    if(o.wandLM!==o.fileModel){o.wandL=false;o.wandLM=o.fileModel;}stanceWand(o,stanceOf(o)?.wandL);stanceWandTip(o,stanceOf(o),dt);
    o.tip.getWorldPosition(o.tipW||(o.tipW=new THREE.Vector3()));o.tipWT=performance.now();
    frostWandLink(o,now);
    if(detail&&o.wspk)wandSparks(o,dt);
    if(ragTick(o,p,v,dt,now))o.tip.scale.setScalar(0.001);   // ล้ม/กระแทกแรง = ragdoll (js/48)
    if(detail){
      if(p.bn&&Math.random()<0.7)burst(p.x,p.y,'#ff6a2a',1,30,0.45,3.5,{h:pz+rnd(0.3,1.8),vh:[1,2.5],g:-1});
      if(p.u>=100&&Math.random()<0.35)burst(p.x+rnd(-18,18),p.y+rnd(-18,18),'#ffd86b',1,10,0.9,1.8,{h:pz+rnd(0,0.4),vh:[1.5,3],g:-0.3});
      if(p.sh&&!fireSh&&!p.ea&&getKit(p.id).path!==DARKP&&Math.random()<0.3)burst(p.x,p.y,'#7ff6ff',1,40,0.4,1.4,{h:pz+rnd(0.3,2)});
      if(p.ds)burst(p.x,p.y,'#bfefff',2,30,0.3,2,{h:pz+rnd(0.4,1.6),g:0});
    }
  }
  for(const [id,o] of PM3)if(!seen.has(id)){if(o.fball)scene.remove(o.fball);if(o.orbG)scene.remove(o.orbG);lightDropView(id);disposeObj(o.g);PM3.delete(id);}
}
function syncEnemies(E,P,now,dt){
  const seen=new Set();
  for(const e of E){
    seen.add(e.id);
    let o=EM3.get(e.id);
    if(!o){o=makeEnemy(e.t);EM3.set(e.id,o);useFileModel(o,'enemy_'+e.t);}
    const x=tx(e.x),z=tz(e.y);
    let tgt=null,bd=1e12;for(const p of P)if(p.al&&!p.dn){const d=(p.x-e.x)**2+(p.y-e.y)**2;if(d<bd){bd=d;tgt=p;}}
    if(tgt)o.g.rotation.y=Math.atan2(tx(tgt.x)-x,tz(tgt.y)-z);
    o.hs=o.hs===undefined?(e.h||0)+GY(e.x,e.y):lerp(o.hs,(e.h||0)+GY(e.x,e.y),1-Math.exp(-15*dt));
    o.g.position.set(x,o.hs,z);
    const detail=viewDetailAt(x,o.hs+(o.h||2)*.5,z,Math.max(6,o.h||2));
    const v=localVel(o,x,z,dt,o.g.rotation.y);
    o.hitT=Math.max(0,(o.hitT||0)-dt);o.atkT=Math.max(0,(o.atkT||0)-dt);
    if(o.anim)animTick(o,{fly:o.hs>1,sp:v.sp,atk:!!(e.sl||e.lg)||o.atkT>0,hitT:o.hitT},dt,animLod(o.g));
    if(o.legs){
      // ขาแมงมุมก้าวสลับ
      o.walk+=dt*Math.min(v.sp,20)*1.4;
      for(const l of o.legs){const ph=o.walk+l.ph;l.L.rotation.y=l.base+Math.sin(ph)*0.3*l.s;l.L.rotation.z=Math.max(0,Math.cos(ph))*0.3;}
      o.b.rotation.x=e.lg?-0.3:0;o.b.position.y=e.lg?0.3:Math.abs(Math.sin(o.walk*2))*0.03;
    }else if(o.dragon){
      const air=o.hs>1;
      for(const w of o.wings)w.wg.rotation.z=w.s*(Math.sin(now/(air?170:500))*(air?0.6:0.15)+(air?0.1:0.45));
      o.b.position.y=air?Math.sin(now/170)*0.3:0;
      o.b.rotation.x=air?-0.15:0;
    }else if(o.wings){
      for(const w of o.wings)w.wg.rotation.y=w.s*Math.sin(now/25)*0.9;
      o.b.position.y=Math.sin(now/200+e.id)*0.15;
      if(detail&&Math.random()<0.4)PARTS.push({x:e.x,y:e.y,h:o.hs+rnd(-0.2,0.2),vx:rnd(-15,15),vy:rnd(-15,15),vh:-0.3,life:0.6,max:0.6,col:'#8fd0ff',size:1.4,g:0.4});
    }else o.b.position.y=v.sp>0.3?Math.abs(Math.sin(now/90+e.id))*0.12:0;
    if(o.cloak)updateCloth(o.cloak,v.lvx,v.lvz,v.sp,now,dt);
    o.stars.visible=!!e.st;o.stars.rotation.y=now/250;
    if(o.tele){o.tele.visible=!!e.sl;if(e.sl)o.tele.material.opacity=0.2+0.2*Math.sin(now/60);if(o.club)o.club.rotation.x=e.sl?-0.6:Math.PI/2.6;}
    if(detail&&e.bn&&Math.random()<0.7)burst(e.x,e.y,'#ff6a2a',1,30,0.45,3.5,{h:o.hs+rnd(0.3,o.h*0.8),vh:[1,2.5],g:-1});
    darknessMarkView(o,e.dk,(o.h||2)*.65);
    statusFX(o,e.fm|0,e.x,e.y,o.hs||0,Math.max(1.2,(o.h||2)*0.9),now,detail);
    if(detail&&e.t==='wiz'&&Math.random()<0.15)smoke(e.x,e.y,0.2,1,'#1a2a14',1.2,4,20);
  }
  for(const [id,o] of EM3)if(!seen.has(id)){disposeObj(o.g);EM3.delete(id);}
}
const projGeo=new THREE.SphereGeometry(1,14,10);
const tailGeo=new THREE.ConeGeometry(1,1,14,1,true);tailGeo.rotateX(-Math.PI/2);tailGeo.translate(0,0,-0.5);
const _t1=new THREE.Vector3();
function makeProj(col,t,left=false){
  const g=new THREE.Group();
  const core=new THREE.Mesh(projGeo,new THREE.MeshBasicMaterial({color:hdr('#ffffff',2.2)}));g.add(core);
  const inner=new THREE.Mesh(projGeo,new THREE.MeshBasicMaterial({color:hdr(col,1.6),transparent:true,opacity:0.7,blending:THREE.AdditiveBlending,depthWrite:false}));g.add(inner);
  const halo=new THREE.Sprite(glowMat(col,0.9));g.add(halo);
  const tail=new THREE.Mesh(tailGeo,new THREE.MeshBasicMaterial({color:hdr(col,1.6),transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false}));g.add(tail);
  const o={g,core,inner,halo,tail,col,lines:[]};
  // หน้าตากระสุนจากไฟล์ proj_<ชนิด> (ปั้นให้ด้านหน้าพุ่งไปทาง −Y ของ Blender) — แสงรอบ (halo) ยังอยู่
  const fm=modelInst('proj_'+t);if(fm){fm.traverse(m=>{if(m.isMesh)m.castShadow=false;});g.add(fm);o.fileModel=fm;}
  // ลูกไฟชาร์จ / Kindle: ลูกไฟ shader (เปลวไหลไปด้านหลัง) + กรวยหางไฟ
  if(t==='erock'||t==='eslab'||t==='ekr'||t==='flak'||t.startsWith('efist')){earthProjMesh(o,t,left);if(t==='flak')o.fileModel.scale.setScalar(1.9);}
  if(t==='pfire'||t==='pfireb'){o.fb=makeFireBall({flow:[0,0,-1]});g.add(o.fb);o.ft=makeFireTail({speed:3.6});g.add(o.ft);}
  if(t==='stun'||t==='zap')for(let i=0;i<2;i++){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(9*3),3));
    const L=new THREE.Line(geo,new THREE.LineBasicMaterial({color:hdr('#c8f6ff',3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    g.add(L);o.lines.push(L);
  }
  if(t==='nature_pea'||t==='nature_thorn'){o.fileModel=natureProjectileModel(t);g.add(o.fileModel);}
  scene.add(g);
  return o;
}
const _a=new THREE.Vector3(),_b=new THREE.Vector3();
// กระสุนที่มีเอฟเฟกต์จากไฟล์ติดตัว (ผู้ใช้เลือก VFX 2026-10-22): [ระหว่างบิน (วน), ตอนโดน]
const PJFX={spark:['fire/spark_fly','fire/spark_hit'],pfire:['fire/fireball_fly',null],icicle:['frost/icicle_fly','frost/icicle_hitb'],wblade:['wind/feather_fly',null],wpush:['wind/push_fly','wind/ba_gust_hit'],wbl:['wind/blade_fly',null],wball:['wind/gale_orb_fly',null],wplume:['wind/plume_fly',null],wshp:['wind/shield_fly',null],wdrop:['water/ba_fly','water/ba_hit'],wcage:['water/cage_fly',null]};
function syncProj(v,now){
  const ex=VIEW.ex!==null?VIEW.ex:clamp((now-VIEW.tCur)/1000,0,0.1),seen=new Set();
  for(const j of v.J){
    seen.add(j.id);
    const vt=(j.t==='pfire'||j.t==='pfireb')?'fire':j.t,col=j.rf?'#7ff6ff':PCOL[j.t],r=PDEF[j.t].r*S3*(vt==='fire'?1.4:1),fist=j.t.startsWith('efist');
    let o=JM3.get(j.id);
    if(!o){o=makeProj(col,j.t,!!j.lf);o.pt=j.t;JM3.set(j.id,o);if(j.t==='swave')stormWaveMake(o,j);
      if(j.t==='pfire'||j.t==='pfireb'||j.t==='spark'){let bo=null,bd=60;for(const q of (v.P||[])){const d=Math.hypot(q.x-j.x,q.y-j.y);if(d<bd){bd=d;bo=q;}}const so=bo&&PM3.get(bo.id);   // ลูกไฟ/Kindle เริ่มที่ปลายไม้จริง (ผู้ใช้ 2026-11-14) แล้วค่อยเข้ารางจริง
        if(so&&so.tipW&&performance.now()-(so.tipWT||0)<200){const q=simOf(so.tipW),h0=j.h!==undefined?j.h:1.35;o.wOff=[q.x-j.x,q.y-j.y,(q.h-GY(q.x,q.y))-h0];o.wT0=now;}}
      if(PJFX[j.t])o.fx=fxPlay(PJFX[j.t][0],{x:j.x,y:j.y,h:j.h!==undefined?j.h:1.35,a:Math.atan2(j.vy,j.vx)});
      {const bp=pjPal(j.t);if(BF.on&&(bp==='fire'||bp==='ice')&&j.t!=='icicle'&&j.t!=='iceboulder')o.bt=fxPlay('env/bf_'+bp+'_trail',{x:j.x,y:j.y,h:j.h!==undefined?j.h:1.35,s:(j.t==='iceboulder'||j.t==='pfireb')?1.8:1});}   // สนามรบ: หางควัน/ไอเย็น (js/44 BF)
      if(j.t==='wcage')o.tr=trailNew({col:'#dff6ff',col2:'#2a8ad8',w:0.3,life:0.4,k:1.4});   // ลูกขังน้ำ: หางน้ำตามหลัง (ผู้ใช้ 2026-11-15)
      else if(fist)o.tr=trailNew({col:'#bb9569',col2:'#76573b',w:j.t==='efistc'?.13:.065,life:.11,k:.65});
      else if(!o.fx&&j.t!=='swave'&&j.t!=='iceboulder'&&j.t!=='icicle'){const P=palOf(pjPal(j.t),col),big=j.t==='iceboulder'||j.t==='pfireb';o.tr=trailNew({col:P.hi,col2:P.deep,w:big?0.32:vt==='fire'?0.2:0.11,life:big?0.28:0.17,k:1.7});}}   // หางแสงทุกกระสุน (สีตามธาตุ)
    if(o.col!==col){o.halo.material=glowMat(col,0.9);o.inner.material.color.copy(hdr(col,2.2));o.tail.material.color.copy(hdr(col,1.6));o.col=col;}
    let x=j.x+j.vx*ex,y=j.y+j.vy*ex,H=(j.h!==undefined?j.h:1.35)+(j.vh||0)*ex;
    if(o.wOff){const k=Math.min(1,(now-o.wT0)/160),w=(1-k)*(1-k);x+=o.wOff[0]*w;y+=o.wOff[1]*w;H+=o.wOff[2]*w;if(k>=1)o.wOff=null;}
    const X=tx(x),Z=tz(y);o.lpA=[x,y,H];
    if(o.fx){o.fx.x=x;o.fx.y=y;o.fx.h=H;o.fx.a=Math.atan2(j.vy,j.vx);}
    if(o.bt){o.bt.x=x;o.bt.y=y;o.bt.h=H;}
    if(o.swv)stormWaveTick(o,X,H+GY(x,y),Z);
    {const Hw=H+GY(x,y);o.g.position.set(X,Hw,Z);if(o.tr)trailPoint(o.tr,X,Hw,Z);o.g.lookAt(_t1.set(X+j.vx*S3,Hw+(j.vh||0),Z+j.vy*S3));}
    if(j.t==='web'){o.core.material.color.set('#f4f4ff');o.tail.visible=false;if(Math.random()<0.6)PARTS.push({x,y,h:H,vx:rnd(-30,30),vy:rnd(-30,30),vh:rnd(-0.5,0.5),life:0.5,max:0.5,col:'#e8e8f0',size:2.5,g:1,smoke:true});}
    const fl=1+0.15*Math.sin(now/30+j.id);
    o.core.scale.setScalar(r*0.6);o.inner.scale.setScalar(r*1.3*fl);
    o.halo.scale.setScalar(r*(vt==='fire'?(o.wOff?3.5:5):6.5)*fl);   // ไฟ: แสงฟุ้งเล็กลง (ช่วงออกจากไม้เล็กกว่าอีก ไม่คลุมตัว)
    o.tail.scale.set(r*1.1,r*1.1,vt==='fire'?2.2:2.8);
    if(o.fileModel){o.core.visible=o.inner.visible=o.tail.visible=false;}
    o.lines.forEach(L=>jag(L.geometry,_a.set(0,0,0),_b.set(0,0,-2.4),0.22));
    if(!fist&&vt!=='wplume'&&vt!=='wshp'&&vt!=='swave')LREQ.push({x:X,y:H,z:Z,col,int:vt==='fire'?2.4:1.6,dist:vt==='fire'?11:8});   // ขนนกยิงทีละหลายอัน แสงรวมกันแล้วพื้นขาว
    switch(vt){
      case 'efist':case 'efistc':case 'efistshard':o.halo.visible=false;break;
      case 'swave':case 'wshp':case 'wball':case 'wplume':case 'wblade':case 'wdrop':case 'wcage':o.core.visible=o.inner.visible=o.tail.visible=o.halo.visible=false;o.lp=[x,y,H];break;   // น้ำ: เห็นแค่ fx ไม่มีลูกแสงขาว
      case 'icicle':
        if(o.fx){o.core.visible=o.inner.visible=o.tail.visible=o.halo.visible=false;o.lp=[x,y,H];break;}   // ไม่มีแสงฟุ้ง/หาง (ผู้ใช้ 2026-11-16) • แบบ B: เข็มพลังงานจากไฟล์ fx
        // แท่งน้ำแข็งแหลม: ยาวตามทิศที่พุ่ง
        o.core.scale.set(r*0.22,r*0.22,r*2.6);o.inner.scale.set(r*0.45,r*0.45,r*3);o.halo.scale.setScalar(r*3.2);o.tail.visible=false;o.lp=[x,y,H];
        PARTS.push({x,y,h:H,vx:0,vy:0,vh:0,life:0.04,max:0.04,col:'#ffffff',size:2.6,g:0});
        if(Math.random()<0.7)PARTS.push({x:x+rnd(-3,3),y:y+rnd(-3,3),h:H+rnd(-0.08,0.08),vx:-j.vx*0.05+rnd(-20,20),vy:-j.vy*0.05+rnd(-20,20),vh:rnd(-0.4,0.2),life:0.3,max:0.3,col:Math.random()<0.5?'#ffffff':'#bfeaff',size:1.4,g:1});
        break;
      case 'iceboulder':
        o.core.scale.setScalar(r*0.75);o.inner.scale.setScalar(r*1.2*fl);o.halo.visible=false;   // ไม่มีแสงฟุ้ง (ผู้ใช้ 2026-11-16)
        for(let i=0;i<2;i++)PARTS.push({x:x+rnd(-8,8),y:y+rnd(-8,8),h:H+rnd(-0.2,0.2),vx:-j.vx*0.08+rnd(-30,30),vy:-j.vy*0.08+rnd(-30,30),vh:rnd(-0.5,0.5),life:0.45,max:0.45,col:i?'#ffffff':'#9fe0ff',size:2.6,g:2});
        // ไม่มีควัน/หมอกตามหลัง (ผู้ใช้ 2026-11-16)
        break;
      case 'spark':
        if(o.fx){o.core.visible=o.inner.visible=o.tail.visible=false;o.halo.scale.setScalar(r*1.3*fl);o.lp=[x,y,H];break;}   // แบบ C: ก้อนถ่านไฟจากไฟล์ fx
        // ประกายไฟพุ่งเร็ว: แกนเหลืองสว่าง + หางส้มแดง + ถ่านไฟเล็ก ๆ
        o.core.visible=false;o.inner.visible=false;o.halo.scale.setScalar(r*2*fl);o.tail.visible=false;
        PARTS.push({x,y,h:H,vx:0,vy:0,vh:0,life:0.05,max:0.05,col:'#fff6c0',size:3.4,g:0});
        for(let k=1;k<7;k++)PARTS.push({x:x-j.vx*0.005*k,y:y-j.vy*0.005*k,h:H+rnd(-0.03,0.03),vx:rnd(-15,15),vy:rnd(-15,15),vh:rnd(-0.1,0.3),life:0.1,max:0.1,col:k<3?'#ffc04a':k<5?'#ff6a1a':'#d83a10',size:2.6-k*0.25,g:0});
        for(let i=0;i<3;i++)PARTS.push({x:x+rnd(-4,4),y:y+rnd(-4,4),h:H+rnd(-0.1,0.1),vx:-j.vx*0.1+rnd(-60,60),vy:-j.vy*0.1+rnd(-60,60),vh:rnd(-0.3,1.5),life:rnd(0.18,0.35),max:0.35,col:['#fff2b0','#ffb347','#ff6a1a'][i],size:rnd(0.9,1.4),g:5,drag:2});
        flame(x-j.vx*0.01,y-j.vy*0.01,H-0.12,{vx:-j.vx*0.08+rnd(-20,20),vy:-j.vy*0.08+rnd(-20,20),vh:rnd(0.4,1.2),life:rnd(0.14,0.22),size:rnd(3,4.2),g:-1,drag:3});
        o.lp=[x,y,H];break;
      case 'fire':{
        // ลูกไฟชาร์จ/Kindle: ลูกไฟ shader แกนเหลืองขาว เปลวไหลไปด้านหลัง + กรวยหางไฟ + เปลวอนุภาค • Kindle ใหญ่และหนักกว่า มีเปลววนรอบแกน
        const big=j.t==='pfireb';o.halo.scale.setScalar(r*(big?5:3.6)*fl);o.inner.visible=o.core.visible=o.tail.visible=false;
        if(o.fx){o.fb.visible=o.ft.visible=false;o.halo.scale.setScalar(r*2.2*fl);o.lp=[x,y,H];break;}   // ลูกไฟชาร์จแบบ B: ลูกแสงขาวจากไฟล์ fx (ตอนโดนใช้แบบเดิม)
        if(o.fb){o.fb.scale.setScalar(r*(big?0.95:0.72)*fl);o.fb.userData.shell.rotation.z+=0.15;o.ft.scale.set(r*(big?0.9:0.68),r*(big?0.9:0.68),big?4.2:3.2);}
        for(let i=0;i<(big?5:3);i++)flame(x-j.vx*0.012*i+rnd(-5,5),y-j.vy*0.012*i+rnd(-5,5),H-0.25+rnd(-0.1,0.1),{vx:-j.vx*0.15+rnd(-20,20),vy:-j.vy*0.15+rnd(-20,20),vh:rnd(0.5,2),life:rnd(0.25,0.4),size:big?rnd(9,13):rnd(6,9),g:-2,drag:3});
        if(big)for(let i=0;i<4;i++){const a=now/55+i*1.57;flame(x+Math.cos(a)*r*16,y+Math.sin(a)*r*16,H-0.2+Math.sin(a*1.3)*0.2,{vx:-j.vx*0.05,vy:-j.vy*0.05,vh:rnd(0.5,1.5),life:0.22,size:6,g:-1});}
        for(let i=0;i<2;i++)PARTS.push({x:x+rnd(-6,6),y:y+rnd(-6,6),h:H+rnd(-0.15,0.15),vx:-j.vx*0.08+rnd(-50,50),vy:-j.vy*0.08+rnd(-50,50),vh:rnd(0.5,2),life:0.35,max:0.35,col:Math.random()<0.5?'#fff0b0':'#ffc04a',size:1.6,g:3,drag:2});
        if(Math.random()<0.4)PARTS.push({x,y,h:H,vx:rnd(-15,15),vy:rnd(-15,15),vh:rnd(0.5,1.2),life:0.9,max:0.9,col:'#2e2a2a',size:5,g:-0.4,smoke:true,grow:1.4,drag:2});
        o.lp=[x,y,H];break;}
      case 'ice':
        for(let i=0;i<2;i++)PARTS.push({x:x+rnd(-4,4),y:y+rnd(-4,4),h:H+rnd(-0.15,0.15),vx:rnd(-30,30),vy:rnd(-30,30),vh:rnd(-0.5,0.3),life:0.5,max:0.5,col:i?'#ffffff':'#9fe8ff',size:1.8,g:0.5,drag:3});
        break;
      case 'zap':
      case 'stun':
        for(let i=0;i<2;i++)PARTS.push({x,y,h:H+rnd(-0.2,0.2),vx:rnd(-90,90),vy:rnd(-90,90),vh:rnd(-1,1),life:0.25,max:0.25,col:i?'#ffffff':'#5ad1ff',size:1.8,g:0,drag:5});
        break;
      case 'pull':{
        const ang=Math.atan2(j.vy,j.vx),px=-Math.sin(ang),py=Math.cos(ang);
        for(let s=0;s<2;s++){const ph=now/40+s*Math.PI,rr=10*Math.cos(ph);PARTS.push({x:x+px*rr,y:y+py*rr,h:H+Math.sin(ph)*0.5,vx:0,vy:0,vh:0,life:0.45,max:0.45,col:s?'#e0b0ff':'#a050ff',size:2.4,g:0});}
        break;}
      case 'ebolt':
        PARTS.push({x,y,h:H,vx:rnd(-20,20),vy:rnd(-20,20),vh:rnd(-0.2,0.5),life:0.35,max:0.35,col:'#7dff6a',size:3,g:0});
        if(Math.random()<0.35)PARTS.push({x,y,h:H,vx:0,vy:0,vh:0.4,life:0.8,max:0.8,col:'#142a12',size:4,g:-0.3,smoke:true,grow:1.5});
        break;
      default:
        for(let i=0;i<2;i++)PARTS.push({x:x+rnd(-4,4),y:y+rnd(-4,4),h:H+rnd(-0.1,0.1),vx:rnd(-25,25),vy:rnd(-25,25),vh:rnd(-0.3,0.3),life:0.35,max:0.35,col:i?'#ffffff':col,size:i?1.2:2.2,g:0});
    }
  }
  for(const [id,o] of JM3)if(!seen.has(id)){
    // หมัด Stand สายดิน: หินแตกกระจาย + ฝุ่น + กระแทก (ผู้ใช้ 2026-11-15) • หมัดชาร์จ = ใหญ่กว่า + สั่น
    if(o.lpA&&(o.pt==='efist'||o.pt==='efistc'||o.pt==='efistshard')){const [x,y,H]=o.lpA,big=o.pt==='efistc',n=big?26:12,sp=big?320:200;
      for(let i=0;i<n;i++){const an=rnd(0,6.283),v=rnd(.4,1)*sp;PARTS.push({x,y,h:H,vx:Math.cos(an)*v,vy:Math.sin(an)*v,vh:rnd(1.5,big?7:4.5),life:rnd(.35,.6),max:.6,col:i%3?'#8a6a48':'#c9a46a',size:rnd(big?3:2,big?5:3.4),g:12,drag:1,sh:4,rot:rnd(0,6.283),vr:rnd(-9,9)});}
      smoke(x,y,Math.max(0.2,H-0.4),big?10:5,'#b49a74',big?1.1:.8,big?9:6,big?120:70);FX.flashSprite(x,y,H,'#ffe6b0',.18,big?2.4:1.4,.08,1.4);
      if(big){ring(x,y,'#d9b46a',140,.35,Math.max(0.1,H-1));const me=myPos();if(me&&Math.hypot(x-me.x,y-me.y)<600)shake(4);}}
    if(o.tr)trailStop(o.tr);
    if(o.bt)fxStop(o.bt);
    if(o.fx&&o.pt==='wshp'){fxKill(o.fx);o.fx=null;}   // โล่ลมที่ปาไป: ชั้นโมเดลยาว 3 วิ ถ้าแค่ stop จะค้างกลางอากาศ (บั๊กผู้ใช้ 2026-11-15)
    if(o.fx){fxStop(o.fx);const hf=PJFX[o.pt]&&PJFX[o.pt][1];if(hf&&o.lp)fxPlay(hf,{x:o.lp[0],y:o.lp[1],h:o.lp[2],a:o.fx.a,s:o.pt==='spark'?(o.lp[2]<0.8?0.5:0.8):1});}   // ประกายไฟชนพื้น: กระเซ็นเล็กลง (ผู้ใช้ 2026-11-11)
    if(o.lp&&o.pt==='icicle'&&!o.fx){const [x,y,H]=o.lp;playFx('ice_hit',x,y,H,{s:0.8});for(let i=0;i<8;i++){const an=rnd(0,6.283),sp=rnd(100,220);PARTS.push({x,y,h:H,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,vh:rnd(-1,2.5),life:rnd(0.15,0.3),max:0.3,col:i%2?'#ffffff':'#bfeaff',size:1.4,g:6,drag:4});}FX.flashSprite(x,y,H,'#dff6ff',0.25,1.3,0.25,1.6);}
    if(o.lp&&o.pt==='spark'){const [x,y,H]=o.lp;for(let i=0;i<9;i++){const an=rnd(0,6.283),sp=rnd(120,260);PARTS.push({x,y,h:H,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,vh:rnd(-1,3),life:rnd(0.12,0.22),max:0.22,col:i%3?'#ffc04a':'#fff6c0',size:1.3,g:6,drag:5});}}
    if(o.lp&&o.pt==='pfire'){const [x,y,H]=o.lp;ring(x,y,'#ff9a3a',70,0.28,Math.max(0.15,H-1));for(let i=0;i<14;i++){const an=i/14*6.283;flame(x+Math.cos(an)*10,y+Math.sin(an)*10,Math.max(0.1,H-0.5),{vx:Math.cos(an)*260,vy:Math.sin(an)*260,vh:rnd(1,3),life:0.3,size:rnd(6,9),drag:5});}
      for(let i=0;i<14;i++){const an=rnd(0,6.283),sp=rnd(150,340);PARTS.push({x,y,h:H,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,vh:rnd(0,5),life:rnd(0.2,0.4),max:0.4,col:i%2?'#ffb347':'#fff0b0',size:1.6,g:7,drag:3});}}
    if(o.lp&&o.pt==='pfireb'){const [x,y,H]=o.lp;fireBlast(x,y,Math.max(0.3,H),2.4,0.55);}
    if(o.lp&&o.pt==='pfire'){const [x,y,H]=o.lp;fireBlast(x,y,Math.max(0.3,H),1.3,0.4);}
    scene.remove(o.g);o.g.traverse(m=>{if(m.material&&m.material!==o.halo.material&&!m.material.userData.keep)m.material.dispose();if(m.isLine)m.geometry.dispose();});JM3.delete(id);}
}
let _awT=0;
function animateWorld(now){
  {const dt=_awT?Math.min(0.1,(now-_awT)/1000):0;_awT=now;const U=world&&world.userData;
    if(U&&U.mixer)U.mixer.update(dt);                         // ของขยับในไฟล์แผนที่ (anim_)
    if(U&&U.lights)for(const L of U.lights)LREQ.push(L);}     // ไฟประจำจุดในไฟล์แผนที่ (light_)
  if(CANDLESYS)updateCandles(now);
  for(const c of CANDLES)c.g.position.y=c.y+Math.sin(now/900+c.ph)*0.3;
  for(const t of TORCHES){
    const f=0.85+0.15*Math.sin(now/70+t.ph)+0.08*Math.sin(now/23+t.ph*2);
    t.fl.scale.set(1.6*f,2.2*f,1);
    if(t.light)t.light.intensity=1.4*f;
  }
  if(RUNE)RUNE.material.opacity=0.55+0.25*Math.sin(now/600);
  if(CRYSTAL){CRYSTAL.rotation.y=now/1200;CRYSTAL.position.y=7+Math.sin(now/800)*0.5;}
  if(SNITCH){
    const t=now/1000;
    SNITCH.position.set(Math.sin(t*0.7)*45+Math.sin(t*2.3)*8,9+Math.sin(t*1.3)*5,Math.cos(t*0.5)*25+Math.cos(t*1.9)*6);
    SNITCH.children[1].rotation.y=Math.sin(now/18)*0.9;SNITCH.children[2].rotation.y=-Math.sin(now/18)*0.9;
    SNITCH.rotation.y=t*2;
  }
  for(const b of BANNERS){
    // ธงโบกสะบัด
    const p=b.m.geometry.attributes.position.array,r=b.rest,t=now/400+b.ph;
    for(let i=0;i<p.length;i+=3){const k=(3.5-r[i+1])/7;p[i+2]=r[i+2]+Math.sin(t+r[i+1]*1.2)*0.35*k;}
    b.m.geometry.attributes.position.needsUpdate=true;
  }
  if(SNOW){
    const dt=Math.min(0.1,(now-SNOW.t)/1000);SNOW.t=now;const {sp,sv,hw,hh}=SNOW,n=sv.length;
    for(let i=0;i<n;i++){
      sp[i*3+1]-=sv[i]*dt;sp[i*3]+=Math.sin(now/1300+i)*0.35*dt;
      if(sp[i*3+1]<0){sp[i*3+1]=26;sp[i*3]=rnd(-hw-15,hw+15);sp[i*3+2]=rnd(-hh-15,hh+15);}
    }
    SNOW.pts.geometry.attributes.position.needsUpdate=true;
  }
  if(FIREFLIES){
    const {fp,fseed}=FIREFLIES,t=now/1000;
    for(let i=0;i<fseed.length;i++){const s=fseed[i];fp[i*3]=s[0]+Math.sin(t*0.3+s[3])*2;fp[i*3+1]=s[1]+Math.sin(t*0.7+s[3]*2)*0.6;fp[i*3+2]=s[2]+Math.cos(t*0.25+s[3])*2;}
    FIREFLIES.pts.geometry.attributes.position.needsUpdate=true;
    FIREFLIES.pts.material.opacity=0.6+0.4*Math.sin(t*2);
  }
}

// ---------- ฉายตำแหน่ง 3D ลงจอ (ป้ายชื่อ / ตัวเลขดาเมจ) ----------
const _v=new THREE.Vector3();
function toScreen(x,h,y){
  _v.set(tx(x),h+GY(x,y),tz(y)).project(cam);
  if(_v.z>1||_v.z<-1)return null;
  return [(_v.x+1)/2*SW,(1-_v.y)/2*SH];
}
// Burning: ตัวเลขแบบแฟนตาซี (ฟอนต์ Pirata One) สีแดง-ส้ม กลางตัวศัตรู
try{document.fonts.load("40px 'Pirata One'");}catch(e){}
// วาดตัวเลขครั้งเดียวลงแผ่นเล็กแล้วเก็บไว้ (shadowBlur ทุกเฟรม = แพงมาก) • key = เลข + ขนาด + DPR
const BURNC=new Map();
function burnNum(x,y,n){
  const t=performance.now(),S=Math.round(30+n*3+(n>=5?3*Math.sin(t/90):0)),key=n+'|'+S+'|'+DPR;
  let c=BURNC.get(key);
  if(!c){const fam=`${S}px 'Pirata One',serif`,pad=18,w=Math.ceil(S*0.7*String(n).length+S*0.6)+pad*2,h=S+pad*2;
    c=document.createElement('canvas');c.width=Math.ceil(w*DPR);c.height=Math.ceil(h*DPR);c.cw=w;c.ch=h;
    const g=c.getContext('2d');g.scale(DPR,DPR);g.textAlign='center';g.textBaseline='middle';g.font=fam;const yy=h/2;
    const gr=g.createLinearGradient(0,yy-S/2,0,yy+S/2);gr.addColorStop(0,n>=5?'#ffe27a':'#ffb347');gr.addColorStop(0.55,'#ff6a1a');gr.addColorStop(1,'#b3140a');
    g.shadowColor='#ff4a10';g.shadowBlur=12;g.lineWidth=4;g.strokeStyle='rgba(30,4,0,0.85)';g.strokeText(n,w/2,yy);g.fillStyle=gr;g.fillText(n,w/2,yy);
    if(document.fonts&&!document.fonts.check(fam))c=null;   // ฟอนต์ยังไม่มา: ไม่เก็บ (เดี๋ยววาดใหม่)
    else{if(BURNC.size>200)BURNC.clear();BURNC.set(key,c);}
    if(!c){cx.save();cx.textAlign='center';cx.textBaseline='middle';cx.font=fam;cx.fillStyle='#ff6a1a';cx.fillText(n,x,y);cx.restore();return;}}
  cx.drawImage(c,x-c.cw/2,y-c.ch/2,c.cw,c.ch);
}
// ป้ายชื่อ: วาดตัวหนังสือลงภาพเล็กครั้งเดียว แล้วใช้ drawImage ทุกเฟรม (fillText ภาษาไทย 2 ครั้ง/คน/เฟรม แพงตอนห้องเต็ม 12 คน)
const NAMETAG=new Map();
function nameTag(txt,col){const key=col+'|'+txt;let c=NAMETAG.get(key);if(c)return c;if(NAMETAG.size>96)NAMETAG.clear();
  const d=Math.min(2,DPR||1);c=document.createElement('canvas');const g=c.getContext('2d');g.font='600 13px Kanit,sans-serif';const w=Math.ceil(g.measureText(txt).width)+6;
  c.width=Math.ceil(w*d);c.height=Math.ceil(20*d);c._w=w;c._h=20;g.scale(d,d);g.font='600 13px Kanit,sans-serif';g.textAlign='center';g.textBaseline='alphabetic';
  g.fillStyle='rgba(0,0,0,0.65)';g.fillText(txt,w/2+1,16);g.fillStyle=col;g.fillText(txt,w/2,15);NAMETAG.set(key,c);return c;}
// Enemy tags hide behind walls (user 2026-11-24): camera → target segment vs terrain, obstacles/Map Builder walls, panels, city.
// Starts past our own player (camera may sit inside a wall). true = clear.
const _hsO=[];
function hudSight(x,y,h,me){
  const o=cam.position,x0=o.x/S3+MW/2,y0=o.z/S3+MH/2,dx=x-x0,dy=y-y0,L2=dx*dx+dy*dy;if(L2<1)return true;
  const L=Math.sqrt(L2),t0=me?clamp(((me.x-x0)*dx+(me.y-y0)*dy)/L2,0,0.95):0,t1=Math.max(t0,1-12/L);
  const wa=o.y,wb=GY(x,y)+h,ax=x0+dx*t0,ay=y0+dy*t0,aw=wa+(wb-wa)*t0,bx=x0+dx*t1,by=y0+dy*t1,bw=wa+(wb-wa)*t1;
  if(bldRay(ax,ay,aw-GY(ax,ay),bx,by,bw-GY(bx,by)))return false;
  const obs=sgNear(sgObs(),(ax+bx)/2,(ay+by)/2,L*(t1-t0)/2+10,_hsO),n=Math.max(1,Math.ceil(L*(t1-t0)/10));
  for(let i=0;i<=n;i++){const t=i/n,px=ax+(bx-ax)*t,py=ay+(by-ay)*t,wy=aw+(bw-aw)*t;
    if(TERR&&terrSolid(px,py,wy-terrT(px,py)))return false;
    for(const q of obs){if(q.bi!==undefined||q.k==='tfence'||q.bot>=q.hgt)continue;const g0=GY(q.x,q.y),lo=q.top!==undefined?-50:g0+(q.bot||0),hi=q.top!==undefined?q.top:g0+(q.hgt||9);
      if(wy>=lo&&wy<hi&&obsD2(q,px,py)<q.r*q.r)return false;}}
  return true;
}
// per-target cached sight (re-check every ~0.1 s, staggered) + smooth fade • returns alpha 0..1
const SIGHT=new Map();
function sightA(id,x,y,h,me){const now=performance.now();let s=SIGHT.get(id);
  if(!s){if(SIGHT.size>160)SIGHT.clear();s={a:1,v:true,t:0,l:now};SIGHT.set(id,s);}
  if(now>=s.t){s.v=hudSight(x,y,h,me);s.t=now+80+Math.random()*60;}
  const dt=Math.min(0.1,(now-s.l)/1000);s.l=now;s.a+=((s.v?1:0)-s.a)*Math.min(1,dt*14);return s.a;}
function drawLabels(P,E,v,me,spk){
  if(!SET.names){const team=teamOn(v);P=P.filter(p=>team&&me&&p.tm===me.tm);}
  cx.textAlign='center';
  for(const e of E){if(!e.br)continue;const o=EM3.get(e.id);if(!o)continue;const s=toScreen(e.x,(o.hs||0)+(o.h||2)*0.5,e.y);if(s)burnNum(s[0],s[1],e.br);}
  for(const p of P){if(!p.br||!p.al||p.id===NET.myId)continue;const s=toScreen(p.x,(p.z||0)+1.2,p.y);if(s)burnNum(s[0],s[1],p.br);}
  cx.textAlign='center';
  for(const e of E){
    const o=EM3.get(e.id);if(!o)continue;
    const d=me?Math.hypot(e.x-me.x,e.y-me.y):0;if(d>1500)continue;
    const s=toScreen(e.x,(o.hs||0)+o.h+0.4,e.y);if(!s)continue;
    if(EDEF[e.t]&&EDEF[e.t].boss)continue;
    const va=sightA('e'+e.id,e.x,e.y,(o.hs||0)+o.h*0.8,me);if(va<0.02)continue;cx.globalAlpha=va;
    const bw=e.t==='troll'?90:44;
    cx.fillStyle='rgba(0,0,0,0.6)';cx.fillRect(s[0]-bw/2,s[1],bw,5);
    cx.fillStyle='#ff5a5a';cx.fillRect(s[0]-bw/2,s[1],bw*clamp(e.hp/e.mh,0,1),5);
  }
  cx.globalAlpha=1;
  const meGh=!!(me&&me.gh),mates=ROLE&&ROLE.role==='imp'?ROLE.mates:[];
  for(const p of P){
    if(!p.al||p.id===NET.myId)continue;
    if(p.gh&&!meGh)continue;
    if(p.dk?.[0]&&me&&p.tm!==me.tm)continue;
    const s=toScreen(p.x,(p.z||0)+2.55,p.y);if(!s)continue;
    {const ally=me&&((teamOn(v)&&p.tm===me.tm)||mates.includes(p.id)),va=ally?1:sightA(p.id,p.x,p.y,(p.z||0)+2.1,me);if(va<0.02)continue;cx.globalAlpha=va;}   // enemies behind walls: no name/HP bar
    {const tg=nameTag((p.aw?'📶 ':'')+p.n+(p.hb?' 🔴':''),teamOn(v)?TEAMC[p.tm]:mates.includes(p.id)?'#ff6b6b':'#ffffff');cx.drawImage(tg,s[0]-tg._w/2,s[1]-23,tg._w,tg._h);}   // 📶 = เน็ตหลุด รอต่อกลับ
    if(v.mode==='imp')continue;
    if(spk.has(p.id)){cx.font='14px sans-serif';cx.fillText('🔊',s[0]+cx.measureText(p.n).width/2+16,s[1]-8);}
    const bw=50,hr=p.hp/p.mh;
    cx.fillStyle='rgba(0,0,0,0.6)';cx.fillRect(s[0]-bw/2,s[1]-2,bw,6);
    cx.fillStyle=hr>0.5?'#5be37d':hr>0.25?'#ffc94d':'#ff5a5a';cx.fillRect(s[0]-bw/2,s[1]-2,bw*hr,6);
    if(p.dn){cx.fillStyle='#ff9a9a';cx.font='600 13px Kanit,sans-serif';cx.fillText(`ล้ม! ไปยืนข้างๆ เพื่อชุบ ${Math.round(p.rv/2.5*100)}%`,s[0],s[1]+40);}
  }
  cx.globalAlpha=1;
}
// ตัวเลขดาเมจ/ข้อความลอย: วาดลงแผ่นเล็กครั้งเดียวแล้วแปะซ้ำ (fillText 2 ครั้งต่อข้อความต่อเฟรม กินเวลามากสุดในโค้ด HUD ตอนสู้กันนัว ๆ)
const TEXTAG=new Map();
function textTag(txt,col,size){const key=col+'|'+size+'|'+txt;let c=TEXTAG.get(key);if(c)return c;if(TEXTAG.size>256)TEXTAG.clear();
  const d=Math.min(2,DPR||1),px=size+2,font='600 '+px+'px Kanit,sans-serif';c=document.createElement('canvas');let g=c.getContext('2d');g.font=font;
  const w=Math.ceil(g.measureText(txt).width)+6,h=Math.ceil(px*1.5)+2,a=Math.ceil(px*1.1);c.width=Math.ceil(w*d);c.height=Math.ceil(h*d);c._w=w;c._h=h;c._a=a;g=c.getContext('2d');g.scale(d,d);g.font=font;g.textAlign='center';
  g.fillStyle='rgba(0,0,0,0.7)';g.fillText(txt,w/2+1.5,a+1.5);g.fillStyle=col;g.fillText(txt,w/2,a);TEXTAG.set(key,c);return c;}
function drawTexts(dt){
  cx.textAlign='center';
  for(let i=TEXTS.length-1;i>=0;i--){
    const t=TEXTS[i];t.life-=dt;if(t.life<=0){TEXTS.splice(i,1);continue;}
    if(t.h===undefined)t.h=2.4;
    t.h+=1.6*dt;
    const s=toScreen(t.x,t.h,t.y);if(!s)continue;
    cx.globalAlpha=Math.min(1,t.life/t.max*2);
    {const g=textTag(t.t,t.col,t.size);cx.drawImage(g,s[0]-g._w/2,s[1]-g._a,g._w,g._h);}
  }
  cx.globalAlpha=1;
}
const HITM={t:0,max:0.45,at:0,kill:false},DIRI=[];
// เป้าเล็งตามที่ตั้งค่า: 0 กากบาท / 1 จุด / 2 วงกลม / 3 กากบาท+วง
function drawXh(x,y,hot,g){
  g=g||cx;
  const s=(SET.xhs||100)/100,col=hot?'#ff9632':XHC[SET.xhc|0]||XHC[0],st=SET.xh|0;
  const cross=()=>{for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){g.beginPath();g.moveTo(x+dx*6*s,y+dy*6*s);g.lineTo(x+dx*12*s,y+dy*12*s);g.stroke();}};
  const circ=()=>{g.beginPath();g.arc(x,y,9*s,0,Math.PI*2);g.stroke();};
  g.strokeStyle='rgba(0,0,0,0.55)';g.lineWidth=3;if(st===0||st===3)cross();if(st===2||st===3)circ();
  g.strokeStyle=col;g.lineWidth=hot?2.5:1.6;if(st===0||st===3)cross();if(st===2||st===3)circ();
  g.fillStyle='rgba(0,0,0,0.5)';g.beginPath();g.arc(x,y,(st===1?3.2:2.2)*s+1,0,Math.PI*2);g.fill();
  g.fillStyle=col;g.beginPath();g.arc(x,y,(st===1?3.2:2.2)*s,0,Math.PI*2);g.fill();
}
function drawCrosshair(){
  const x=SW/2,y=SH/2;
  // เครื่องหมายตอนยิงโดน (X รอบเป้า, แดง = ฆ่า)
  if(HITM.t>0){const age=(performance.now()-HITM.at)/1000;HITM.t=HITM.max-age;
    if(HITM.t>0){const a=Math.min(1,HITM.t/0.2),pop=1+0.45*Math.max(0,1-age/0.08),r0=7*pop,r1=(HITM.kill?17:15)*pop;
      const X=()=>{for(const [dx,dy] of [[1,1],[-1,1],[1,-1],[-1,-1]]){cx.beginPath();cx.moveTo(x+dx*r0,y+dy*r0);cx.lineTo(x+dx*r1,y+dy*r1);cx.stroke();}};
      cx.strokeStyle=`rgba(0,0,0,${0.6*a})`;cx.lineWidth=5;X();
      cx.strokeStyle=HITM.kill?`rgba(255,70,70,${a})`:`rgba(255,255,255,${a})`;cx.lineWidth=2.8;X();}}
  // ทิศที่โดนยิง (โค้งแดงรอบเป้า ชี้ไปทางคนยิง)
  for(let i=DIRI.length-1;i>=0;i--){const d=DIRI[i];d.t-=1/60;if(d.t<=0||!SET.dirm){DIRI.splice(i,1);continue;}
    const rel=d.a-yaw-Math.PI/2;cx.strokeStyle=`rgba(255,60,60,${Math.min(0.85,d.t)})`;cx.lineWidth=6;cx.beginPath();cx.arc(x,y,96,rel-0.32,rel+0.32);cx.stroke();}
  const _v=VIEW.cur,_me=_v&&_v.P&&_v.P.find(q=>q.id===NET.myId),hot=_me&&(_me.cg>=1||_me.dc>=1);
  if(!(_me&&_me.ea&&_me.al&&_me.sh&&!(_me.ea[0]>0)))drawXh(x,y,hot);   // สายดินถือโล่: ซ่อนเป้าเล็ง (โชว์โค้ง HP โล่ + ตัวเลขแทน ใน drawEarthHud)
  if(_me&&_me.sm&&_me.al)drawStormHud(x,y,_me.sm);
  if(_me&&_me.ea&&_me.al)drawEarthHud(x,y,_me.ea,_me);
  if(_me&&_me.wn&&_me.al)drawWindHud(x,y,_me.wn,_me);
  if(_me&&_me.nt&&_me.nt.length>6&&_me.al)drawNatureHud(x,y,_me.nt);
  if(_me&&_me.wt&&_me.al)drawWaterHud(x,y,_me.wt,_me);
  if(_me&&_me.lt&&_me.al)drawLightHud(x,y,_me);
  if(_me?.dk&&_me.al&&getKit(_me.id).path===DARKP)drawDarknessHud(x,y,_me.dk);
  else if(darkFlowHud)darkFlowHud.plane.visible=false;
  if(_me&&_me.fh!==undefined&&_me.al)drawFireHeat(_me.fh);drawSnapBanner();
  if(!locked&&!VIC.on&&!(VIEW.cur&&VIEW.cur.ph==='over')){
    cx.font='600 17px Kanit,sans-serif';cx.textAlign='center';
    const t='🖱️ คลิกที่จอเพื่อบังคับกล้อง (Esc = ปล่อยเมาส์)',w=cx.measureText(t).width+48;
    plate(SW/2-w/2,SH/2+30,w,38);
    cx.fillStyle=HG2;cx.fillText(t,SW/2,SH/2+55);
  }
}
