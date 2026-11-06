// =====================================================================
//  สายดิน ⛰️ (ผู้ใช้ออกแบบทั้งหมด — designs/earth.md §0 FINAL SPEC) • ฝั่งโฮสต์
//  Stand หิน = ตัวต่อย/ถือโล่ • โล่ 300 HP (p.ehp) แตก = Stand หาย 15 วิ (p.stdB) → ยิงหินเล็ก / Rock Boost / สกิลที่ใช้ Stand ใช้ไม่ได้
//  สิ่งก่อสร้างของสายดิน G.eso: {k:'tec' กำแพง Tectonic | 'pil' เสา Wrath | 'mound' เนิน Terra Auger | 'dom' กำแพงโดเมน} เป็นเส้น (x1,y1)-(x2,y2) หนา r
//  v2 (designs/earth.md §0 FINAL SPEC v2): BA ชาร์จ = Stand ใหญ่ทุบ (คลิกซ้ายค้าง) • Terra Auger เดินช้า 85% เนินสูงเท่าตัว (นับเป็นกำแพง) • Wrath = ปาเสาใหญ่ 1 ต้นจากฟ้า → บึงโคลน r400 → สว่าน 5 อัน 10 วิ
//  ฝุ่น Dust Burst G.edust: ศัตรูข้างในมองเห็นชัดแค่ ~150 รอบตัว (ฝั่งภาพทำใน js/47-earth-view.js)
// =====================================================================
// Tectonic Crush: Stand ดันช้า (TECT.v.push) แล้วกำแพงปิดเร็ว (TECT.v.slide) • ERV.env = ตัวคูณความแรงพังบ้าน/ของของทุกสกิลสายดิน (ผู้ใช้ 2026-10-21)
const EARTH=6;   // ตัวเลขของสายดิน: ERV (ท่าพื้นฐาน/โล่/Dash) + v:{...} ของแต่ละสกิล — ปรับได้ใน tune.html / F8
PATHS.push({id:'earth',n:'สายดิน',ic:'⛰️',col:'#c9a36a',d:'สถาปนิกสนามรบ — Stand หินต่อยแทนเรา ถือโล่ 300 สร้างกำแพง/เสา/เนิน แล้วผลักศัตรูให้ชนของแข็ง',
  combo:'Stonebreaker ผลักศัตรูชนกำแพง (กำแพงแผนที่ / Tectonic Crush / เสา Wrath / กำแพงโดเมน) = +20 ดาเมจ สตัน 2 วิ • Mud Swamp ช้า 50% ห้าม Dash แล้ว Crush กำแพงหนีบ 80 • Dust Burst บังสายตาศัตรู • Terra Auger ชาร์จ 3 ระดับ • โล่แตก = Stand หาย 15 วิ'});
const ERV=PATHS[EARTH].v={sh:300,shDelay:3,shRegen:20,standOff:15,punch:10,punchR:300,punchCd:0.8,punchDelay:0.2,rockCd:0.35,cbHold:0.25,cbCharge:2,cbDmg:50,cbR:180,cbStun:0.7,cbCd:6,cbSlow:0.6,
  rampT:1.2,rampSp:500,rampDmg:15,rampStun:0.5,rampKnock:650,rampCd:8,slamR:150,slamDmg:20,slamStun:0.8,boostDist:400,boostR:120,boostKnock:900,boostCd:6,env:2.5};
PATHS[EARTH].vn={sh:'โล่ Stand • HP',shDelay:'โล่ • เริ่มฟื้นหลังไม่ใช้ (วิ)',shRegen:'โล่ • ฟื้นต่อวิ',standOff:'โล่แตก • Stand หาย (วิ)',punch:'หมัด Stand • ดาเมจ',punchR:'หมัด Stand • ระยะล็อก',punchCd:'หมัด Stand • เว้น (วิ)',punchDelay:'หมัด Stand • หน่วงก่อนโดน (วิ)',rockCd:'หินเล็ก (Stand แตก) • เว้นยิง (วิ)',
  cbHold:'ทุบชาร์จ • กดค้างกี่วิเริ่มชาร์จ',cbCharge:'ทุบชาร์จ • ชาร์จ (วิ)',cbDmg:'ทุบชาร์จ • ดาเมจ',cbR:'ทุบชาร์จ • รัศมี',cbStun:'ทุบชาร์จ • สตัน (วิ)',cbCd:'ทุบชาร์จ • คูลดาวน์ (วิ)',cbSlow:'ทุบชาร์จ • ความเร็วเดินตอนชาร์จ (เท่า)',
  rampT:'Rampage • วิ่งนาน (วิ)',rampSp:'Rampage • ความเร็ว',rampDmg:'Rampage • ชนดาเมจ',rampStun:'Rampage • ชนสตัน (วิ)',rampKnock:'Rampage • ชนกระเด็น',rampCd:'Rampage • คูลดาวน์ (วิ)',slamR:'Rampage จบ • รัศมีทุบ',slamDmg:'Rampage จบ • ดาเมจ',slamStun:'Rampage จบ • สตัน (วิ)',
  boostDist:'Rock Boost • ระยะ',boostR:'Rock Boost • รัศมีผลัก',boostKnock:'Rock Boost • แรงผลัก',boostCd:'Rock Boost • คูลดาวน์ (วิ)',env:'ทุกสกิล • ตัวคูณพังบ้าน/ของ'};
Object.assign(PDEF,{erock:{spd:1100,r:6,dmg:5,life:0.55,col:'#c9a36a'},eslab:{spd:1800,r:24,dmg:25,life:0.39,col:'#d8b47a'}});
// ---------- ตัวช่วย ----------
const eOn=p=>p&&p.pathIdx===EARTH;
const eStand=p=>!(p.stdB>0);
function eNoStand(p){emit({k:'efx',z:'enostand',x:p.x,y:p.y,h:p.z+2.2,id:p.id});return false;}
// ระยะจากจุดถึงเส้น (x1,y1)-(x2,y2) → {d, qx, qy}
function eSegD(x,y,w){const dx=w.x2-w.x1,dy=w.y2-w.y1,L=dx*dx+dy*dy;let t=L?((x-w.x1)*dx+(y-w.y1)*dy)/L:0;t=Math.max(0,Math.min(1,t));const qx=w.x1+dx*t,qy=w.y1+dy*t;return {d:Math.hypot(x-qx,y-qy),qx,qy};}
function eAdd(o){const w=Object.assign({id:++G.zid,hgt:7,hp:1e9,maxHp:1e9},o);(G.eso||(G.eso=[])).push(w);return w;}
// ชนสิ่งก่อสร้างสายดิน (เรียกจาก collideWorld) • คืนจำนวนครั้งที่ชนของแข็ง (รวมเนิน v2) ไว้ทำคอมโบ Stonebreaker
function eCollide(o,r,z){let n=0;if(!G||!G.eso)return 0;
  for(const w of G.eso){if(w.hgt<=z||w.dead||w.k==='mound')continue;if(o.eRamp&&w.owner===o.eRamp&&w.k!=='dom')continue;   // เนินเดินข้ามได้ (เป็นพื้นสูงใน groundH)
    const s=eSegD(o.x,o.y,w),m=w.r+r;if(s.d>=m)continue;
    if(s.d>0.001){o.x=s.qx+(o.x-s.qx)/s.d*m;o.y=s.qy+(o.y-s.qy)/s.d*m;}else{const a=Math.atan2(w.y2-w.y1,w.x2-w.x1)+Math.PI/2;o.x=s.qx+Math.cos(a)*m;o.y=s.qy+Math.sin(a)*m;}
    n++;}
  return n;}
// กระสุนชนสิ่งก่อสร้าง (กระสุนฝ่ายเดียวกันทะลุของตัวเอง • กำแพงโดเมนกระสุนผ่านได้)
function eProjHit(pr){if(!G.eso)return false;
  for(const w of G.eso){if(w.dead||w.k==='dom'||w.k==='mound'||pr.team===w.team||pr.h>=w.hgt)continue;if(eSegD(pr.x,pr.y,w).d<w.r+pr.r){w.hp-=pr.dmg||5;emit({k:'efx',z:'ehitw',x:Math.round(pr.x),y:Math.round(pr.y),h:pr.h});return true;}}
  return false;}
function eKill(w,quiet){if(w.dead)return;w.dead=1;if(!quiet)emit({k:'efx',z:'ebreakw',x:Math.round((w.x1+w.x2)/2),y:Math.round((w.y1+w.y2)/2),x2:Math.round(w.x2),y2:Math.round(w.y2),x1:Math.round(w.x1),y1:Math.round(w.y1),r:w.r,n:w.k==='pil'?1:w.k==='mound'?2:0});}

// ---------- ทุกเฟรมของผู้เล่นสายดิน (เรียกจาก updatePlayer หลังส่วนโล่) ----------
function earthTick(p,dt){
  if(p.ehp===undefined)p.ehp=ERV.sh;
  if(p.stdB>0){p.stdB-=dt;if(p.stdB<=0){p.stdB=0;p.ehp=ERV.sh;emit({k:'efx',z:'estdon',x:p.x,y:p.y,h:p.z,id:p.id});}}
  if(p.shieldOn)p.eShT=0;else{p.eShT=(p.eShT||0)+dt;if(p.eShT>=ERV.shDelay&&!(p.stdB>0))p.ehp=Math.min(ERV.sh,p.ehp+ERV.shRegen*dt);}
  p.shieldE=p.stdB>0?0:p.ehp/ERV.sh*100;p.shieldBroken=p.stdB>0?p.stdB:0;
  const inp=p.inp||{};
  // หมัด Stand: เข้า 0.2 วิ แล้วค่อยโดน (หลบทันได้)
  if(p.epn){p.epn.t-=dt;if(p.epn.t<=0){const P=p.epn;p.epn=null;const t=P.tg;
    if(t&&!t.dead&&(t.isE||t.isM||(t.alive&&!t.downed))&&Math.hypot(t.x-P.x,t.y-P.y)<60+(t.r||PR)&&Math.abs(cH(t)-(p.z+1.1))<3.5){p.baHit=1;damage(t,ERV.punch,p.id,'melee');p.baHit=0;}}}
  // Terra Auger: ชาร์จ
  if(p.aug){const A=p.aug,k=A.k;A.t+=dt;
    const shP=inp.sh&&!p.eShPrv;
    if(p.stun>0||!p.alive){p.aug=null;p.cd[k]=AUGER.v.cdCancel*p.buffs.cdr;p.cdMax[k]=p.cd[k];emit({k:'efx',z:'eaugoff',x:p.x,y:p.y,h:p.z,id:p.id});}
    else if(shP){p.aug=null;p.cd[k]=0.5;p.cdMax[k]=0.5;emit({k:'efx',z:'eaugoff',x:p.x,y:p.y,h:p.z,id:p.id});}
    else if(!inp['h'+k])earthAugFire(p);}
  p.eShPrv=inp.sh;
  // Tectonic Crush: หมดสิทธิ์ Crush เมื่อคูลดาวน์ครบ / Stand แตก • ง้าง TECT.v.push+slide
  if(p.tec){if(p.tec.ok&&(p.cd[p.tec.k]<=0||p.stdB>0))p.tec.ok=false;}
  if(p.crush){if(p.stdB>0||!p.alive){p.crush=null;}else{p.crush.t-=dt;if(p.crush.t<=0)earthCrush(p);}}
  if(p.ramp&&(p.stun>0||!p.alive))earthRampEnd(p,true);
  // BA ชาร์จ: Stand ใหญ่ยกสองมือ 2 วิ แล้วทุบ (สตัน/แช่แข็งไม่ยกเลิก • Stand แตก = ยกเลิก)
  if(p.ecbCd>0)p.ecbCd-=dt;
  if(p.ecb){if(p.stdB>0||!p.alive){p.ecb=null;emit({k:'efx',z:'ecboff',x:p.x,y:p.y,h:p.z,id:p.id});}else{p.ecb.t+=dt;if(p.ecb.t>=ERV.cbCharge)earthCBSlam(p);}}
  if(p.wr)earthWrathTick(p,dt);
}
// ความเร็วเดินพิเศษของสายดิน
function earthSpd(p){return p.aug?AUGER.v.slow:p.ecb?ERV.cbSlow:p.wr&&p.wr.ph==='sky'?0:1;}   // Auger ช้า 85% • BA ชาร์จ ช้า 40%
// โดนตีที่โล่ Stand (ลด HP โล่ตรงๆ)
function earthShHit(p,amt){p.ehp=(p.ehp===undefined?ERV.sh:p.ehp)-amt;p.shBlk=(p.shBlk|0)+1;if(p.ehp<=0)earthBreak(p);else p.shieldE=p.ehp/ERV.sh*100;}
function earthBreak(p){p.ehp=0;p.stdB=ERV.standOff;p.shieldOn=false;p.shieldE=0;p.crush=null;if(p.ecb){p.ecb=null;emit({k:'efx',z:'ecboff',x:p.x,y:p.y,h:p.z,id:p.id});}if(p.tec)p.tec.ok=false;if(p.ramp)earthRampEnd(p,true);
  emit({k:'efx',z:'estdbreak',x:p.x,y:p.y,h:p.z+1.3,id:p.id});}
function earthReset(p){p.ehp=ERV.sh;p.stdB=0;p.eShT=0;p.epn=null;p.aug=null;p.ramp=null;p.crush=null;p.ecb=null;p.ecbCd=0;p.eHold=0;p.mudT=0;p.eRamp=null;if(p.wr)earthWrathEnd(p);}

// ---------- ท่าพื้นฐาน (คลิกซ้าย) ----------
function earthBATarget(p){let best=null,bs=1e9;
  for(const t of foesOf(p.team)){const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);if(d>ERV.punchR+(t.r||PR)||Math.abs(cH(t)-(p.z+1.1))>4)continue;
    const da=Math.abs(angDiff(Math.atan2(dy,dx),p.ang));if(da>1.2)continue;const sc=da+d/1500;if(sc<bs){bs=sc;best=t;}}
  return best;}
function earthBasic(p,inp,dt,setCd){
  const prev=p.eFirePrv;p.eFirePrv=inp.fire;
  if(p.aug||p.ramp||p.ecb)return;
  if(p.wr){if(p.wr.ph==='sky'){if(inp.fire&&!prev)earthPillarThrow(p);return;}if(p.wr.ph==='trans'&&inp.fire&&!prev&&p.cd.basic<=0){earthWrathDrill(p);setCd('basic',0.3);}return;}
  if(p.stdB>0){p.eHold=0;if(inp.fire&&p.cd.basic<=0){shoot(p,'erock',{sp:'b_earth'});setCd('basic',ERV.rockCd);}return;}
  // มี Stand: แตะ (ปล่อยก่อน 0.25 วิ) = หมัด Stand • ค้าง 0.25 วิ = เริ่มชาร์จทุบ (ถ้าคูลดาวน์ 6 วิ ยังไม่ครบ ปล่อยแล้วเป็นหมัดปกติ)
  if(inp.fire){if(p.eHold>=0)p.eHold=(p.eHold||0)+dt;if(p.eHold>=ERV.cbHold&&!(p.ecbCd>0)){p.eHold=-1;earthCBStart(p);}return;}
  const h=p.eHold||0;p.eHold=0;if(h>0&&p.cd.basic<=0){earthPunch(p);setCd('basic',ERV.punchCd);}
}
function earthPunch(p){const t=earthBATarget(p);let x,y,tx2,ty2;
  if(t){const a=Math.atan2(p.y-t.y,p.x-t.x)+rnd(-1.3,1.3);x=t.x+Math.cos(a)*55;y=t.y+Math.sin(a)*55;tx2=t.x;ty2=t.y;}
  else{x=p.x+Math.cos(p.ang)*40;y=p.y+Math.sin(p.ang)*40;tx2=p.x+Math.cos(p.ang)*110;ty2=p.y+Math.sin(p.ang)*110;}
  p.epn={t:ERV.punchDelay,tg:t,x,y};
  emit({k:'efx',z:'epunch',x:Math.round(x),y:Math.round(y),h:Math.round((p.z||0)*10)/10,x2:Math.round(tx2),y2:Math.round(ty2),id:p.id});}
// BA ชาร์จ: วงเตือนรัศมี 180 หน้าเรา (ศูนย์กลางห่าง 170) ⚠ ระยะศูนย์กลางเป็นการตีความ • 2 วิ แล้วทุบ 50 + สตัน 0.7 วิ • คูลดาวน์ 6 วิ
function earthCBStart(p){p.ecb={t:0};p.shieldOn=false;emit({k:'efx',z:'ecbon',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}
function earthCBSlam(p){p.ecb=null;p.ecbCd=ERV.cbCd;const x=p.x+Math.cos(p.ang)*170,y=p.y+Math.sin(p.ang)*170;
  emit({k:'efx',z:'ecbslam',x:Math.round(x),y:Math.round(y),h:0,r:ERV.cbR,a:Math.round(p.ang*100)/100,id:p.id});   // ภาพทุบก่อนเสมอ (ถ้าดาเมจ/ทำลายของสะดุด effect ยังขึ้น)
  for(const t of foesIn(p.team,x,y,ERV.cbR,p.z+5))aoeHit(p,t,ERV.cbDmg,t=>addStun(t,ERV.cbStun));damageEnv(x,y,ERV.cbR,ERV.cbDmg*ERV.env,p.id,'rock',0.6);}

// ---------- Dash: Stand Rampage / Rock Boost Escape ----------
function earthDash(p,inp,pr,dt,setCd){
  if(p.ramp){const R=p.ramp;R.t-=dt;
    p.dashX=Math.cos(p.ang);p.dashY=Math.sin(p.ang);p.dash=0.05;p.dashSp=ERV.rampSp;p.eRamp=p.id;p.shieldOn=false;
    for(const t of foesOf(p.team)){if(R.hit.has(t))continue;if(Math.hypot(t.x-p.x,t.y-p.y)>PR+(t.r||PR)+28||Math.abs(cH(t)-(p.z+1.1))>3)continue;
      R.hit.add(t);if(aoeHit(p,t,ERV.rampDmg,t=>{addStun(t,ERV.rampStun);knock(t,p.x,p.y,ERV.rampKnock);}))emit({k:'efx',z:'erhit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});}
    for(const w of G.eso||[])if(!w.dead&&w.team!==p.team&&w.k!=='dom'&&eSegD(p.x,p.y,w).d<w.r+PR+20)w.hp=0;   // พังสิ่งก่อสร้างศัตรู
    for(const w of G.walls||[])if(w.team!==p.team&&Math.hypot(w.x-p.x,w.y-p.y)<w.r+PR+20)w.hp=0;
    R.env=(R.env||0)-dt;if(R.env<=0){R.env=0.1;damageEnv(p.x+Math.cos(p.ang)*30,p.y+Math.sin(p.ang)*30,60,12*ERV.env,p.id,'rock',p.z+0.5);}   // วิ่งชนบ้าน/ของพังตามทาง
    if(pr.sp||R.t<=0||p.stun>0)earthRampEnd(p,p.stun>0);
    return true;}
  if(p.aug||p.wr&&p.wr.ph==='sky')return false;
  if(!pr.sp||p.cd.dodge>0||p.mudT>0||p.z>groundH(p.x,p.y,p.z)+0.3)return false;
  if(p.stdB>0){   // Rock Boost Escape: หินดันตัวพุ่งไปข้างหน้า ~400 + ศัตรูรอบจุดเริ่ม (120) กระเด็น ไม่มีดาเมจ
    let dx,dy;if(typeof inp.mx==='number'&&Math.hypot(inp.mx,inp.my)>0.1){dx=inp.mx;dy=inp.my;const l=Math.hypot(dx,dy);dx/=l;dy/=l;}else{dx=Math.cos(p.ang);dy=Math.sin(p.ang);}
    for(const t of foesIn(p.team,p.x,p.y,ERV.boostR,p.z+3))knock(t,p.x,p.y,ERV.boostKnock);
    p.dash=0.35;p.dashSp=ERV.boostDist/0.35;p.dashX=dx;p.dashY=dy;p.vz=7;p.shieldOn=false;setCd('dodge',ERV.boostCd*p.buffs.cdr);
    emit({k:'efx',z:'eboost',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(Math.atan2(dy,dx)*100)/100,id:p.id});return true;}
  p.ramp={t:ERV.rampT,hit:new Set()};p.shieldOn=false;emit({k:'efx',z:'erampon',x:p.x,y:p.y,h:p.z,id:p.id});return true;
}
function earthRampEnd(p,quiet){p.ramp=null;p.dash=0;p.dashSp=0;p.eRamp=null;p.cd.dodge=ERV.rampCd*p.buffs.cdr;p.cdMax.dodge=p.cd.dodge;
  if(quiet){emit({k:'efx',z:'erampoff',x:p.x,y:p.y,h:p.z,id:p.id});return;}
  emit({k:'efx',z:'eslam',x:Math.round(p.x),y:Math.round(p.y),h:p.z,r:ERV.slamR,id:p.id});damageEnv(p.x,p.y,ERV.slamR,30*ERV.env,p.id,'rock',p.z+0.3);
  for(const t of foesIn(p.team,p.x,p.y,ERV.slamR,p.z+3))aoeHit(p,t,ERV.slamDmg,t=>addStun(t,ERV.slamStun));}

// ---------- สกิล 1: Stonebreaker ----------
const STONEB=defSpell(EARTH,{id:'stonebreaker',v:{delay:0.45,knock:1800,wallDmg:20,wallStun:2,env:40},vn:{delay:'แผ่นหินพุ่งหลังกด (วิ)',knock:'แรงกระเด็น',wallDmg:'ชนของแข็ง • ดาเมจเพิ่ม',wallStun:'ชนของแข็ง • สตัน (วิ)',env:'แผ่นหินแตก • ดาเมจใส่บ้าน/ของ (×ตัวคูณ)'},role:'finisher',n:'Stonebreaker',ic:'🧱',cd:8,d:'เสกแผ่นหินใหญ่ตรงหน้า Stand ต่อยกลางแผ่น แผ่นหินพุ่งตรงเร็วมาก ระยะ 700 โดนศัตรูคนแรกแล้วแตก',fx:'25 ดาเมจ + กระเด็นไกล ~300 • กระเด็นไปชนของแข็ง (กำแพงแผนที่ / กำแพง Tectonic / เสา + กำแพงโดเมน Wrath) = +20 ดาเมจ สตัน 2 วิ (โคลน/เนิน Auger ไม่นับ) • ต้องมี Stand',
  cast(p){if(!eStand(p))return eNoStand(p);if(p.aug||p.ramp||p.ecb)return false;
    // งัดแผ่นหินขึ้นจากพื้นก่อน → Stand โผล่มาต่อย (รอยร้าว) → แผ่นหินพุ่ง (0.45 วิ หลังกด)
    emit({k:'efx',z:'esbcast',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,id:p.id});
    G.strikes.push({x:p.x,y:p.y,t:STONEB.v.delay,fn(){if(!p.alive||p.stdB>0)return;const pr=shoot(p,'eslab',{sp:'stonebreaker'});pr.vh=0;pr.h=p.z+1.2;}});},
  hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');const o=G.players[pr.owner];
    if(!t.isE&&shieldFaces(t,pr.x-pr.vx*0.05,pr.y-pr.vy*0.05))return;
    const a=Math.atan2(pr.vy,pr.vx);knock(t,t.x-Math.cos(a)*10,t.y-Math.sin(a)*10,STONEB.v.knock);t.sbk=0.7;t.sbkSrc=pr.owner;t.sbkN=t.solN|0;
    emit({k:'efx',z:'esbhit',x:Math.round(t.x),y:Math.round(t.y),h:pr.h,a:Math.round(a*100)/100});}});

// ---------- สกิล 2: Mud Swamp ----------
const MUDS=defSpell(EARTH,{id:'mudswamp',v:{range:600,r:120,warn:0.5,time:5,slow:0.5},vn:{range:'ระยะเล็ง',r:'รัศมี',warn:'วงเตือน (วิ)',time:'อยู่นาน (วิ)',slow:'ศัตรู • ความเร็ว (เท่า)'},role:'control',n:'Mud Swamp',ic:'🟤',cd:12,d:'เล็งพื้นระยะ 600 วงเตือน 0.5 วิ แล้วเป็นบ่อโคลนรัศมี 120 นาน 5 วิ (โดนเฉพาะศัตรู)',fx:'ศัตรูในโคลน: ช้าลง 50% ใช้ Dash/กระโดดไม่ได้ ขาจมโคลน • ไม่มีดาเมจ • ใช้ได้แม้ Stand แตก',
  cast(p,S){if(p.aug||p.ramp)return false;const V=S.v,o=aimPoint(p,V.range);
    addStrike({x:o.x,y:o.y,r:V.r,t:V.warn,col:'#8a6a3a',fn(){addZone({x:o.x,y:o.y,r:V.r,t:V.time,tick:0.15,owner:p.id,team:p.team,kind:'mud',hit(t){addSlow(t,V.slow,0.3);t.mudT=Math.max(t.mudT||0,0.3);}});}});}});

// ---------- สกิล 3: Tectonic Crush ----------
// กำแพงหินคู่ขนานหน้าตัวเรา (ยาว 300 ห่างกัน 240 HP 200) • กดซ้ำก่อนคูลดาวน์ครบ = Crush (ง้าง 0.5 วิ) • ไม่กดทัน = กำแพงอยู่ต่อเป็นที่กำบังจนพัง/ร่ายคู่ใหม่
const TECT=defSpell(EARTH,{id:'tectoniccrush',v:{len:300,gap:240,hp:200,crush2:80,crush1:40,push:1.0,slide:0.06,knock1:900,envUp:20,envCrush:40},vn:{len:'กำแพง • ยาว',gap:'กำแพง • ห่างกัน',hp:'กำแพง • HP',crush2:'Crush กำแพงครบ 2 • ดาเมจ',crush1:'Crush กำแพงเหลือ 1 • ดาเมจ',push:'Crush • Stand ดัน (วิ)',slide:'Crush • กำแพงปิด (วิ)',knock1:'Crush เหลือ 1 • แรงกระเด็น',envUp:'กำแพงโผล่ • พังบ้าน/ของ (×ตัวคูณ)',envCrush:'Crush • พังบ้าน/ของ (×ตัวคูณ)'},role:'control',n:'Tectonic Crush',ic:'🪨',cd:14,d:'Stand ดึงพื้นขึ้นเป็นกำแพงหินคู่ขนานหันหน้าเข้าหากันตรงหน้าเรา (ยาว 300 ห่าง 240 HP 200 เปิดหัวท้าย) • กดอีกครั้งก่อนคูลดาวน์ครบ = Crush (Stand ดัน 0.5 วิ แล้วกำแพงหนีบเร็ว)',fx:'Crush: กำแพงครบ 2 = 80 ดาเมจคนตรงกลาง • เหลือ 1 = 40 + กระเด็น • ไม่กด Crush ทัน = กำแพงอยู่ต่อเป็นที่กำบัง • ต้องมี Stand',
  toggle(p){const T=p.tec;if(!T||!T.ok||p.crush)return false;if(!(p.cd[T.k]>0))return false;if(!eStand(p)){eNoStand(p);return true;}
    p.crush={t:TECT.v.push+TECT.v.slide};T.ok=false;emit({k:'efx',z:'ecrushw',x:Math.round(T.cx),y:Math.round(T.cy),h:p.z,a:Math.round(T.a*100)/100,id:p.id});return true;},
  cast(p,S,i){if(!eStand(p))return eNoStand(p);if(p.aug||p.ramp)return false;
    if(p.tec)for(const id of p.tec.ids){const w=(G.eso||[]).find(q=>q.id===id);if(w)eKill(w);}
    const V=S.v,a=p.ang,c=Math.cos(a),s=Math.sin(a),ids=[],G2=V.gap/2,L=V.len;
    for(const sd of [-1,1]){const ox=-s*G2*sd,oy=c*G2*sd,w=eAdd({k:'tec',x1:p.x+c*60+ox,y1:p.y+s*60+oy,x2:p.x+c*(60+L)+ox,y2:p.y+s*(60+L)+oy,r:18,hgt:6,hp:V.hp,maxHp:V.hp,team:p.team,owner:p.id,side:sd});ids.push(w.id);
      // ใครยืนทับกำแพงที่กำลังโผล่ = กระเด็นออกด้านข้าง (คนที่อยู่ระหว่างกำแพงไม่โดน)
      for(const t of plist().concat(G.en)){if(t===p||t.dead||t.alive===false)continue;const q=eSegD(t.x,t.y,w);if(q.d>=w.r+(t.r||PR)+4)continue;
        const d=q.d||1,f=isBig(t)?150:600,nx=q.d>0.5?(t.x-q.qx)/d:-s*sd,ny=q.d>0.5?(t.y-q.qy)/d:c*sd;t.vx=(t.vx||0)+nx*f;t.vy=(t.vy||0)+ny*f;}}
    for(const sd of [-1,1])for(let d=60;d<=60+L;d+=60)damageEnv(p.x+c*d-s*G2*sd,p.y+s*d+c*G2*sd,40,V.envUp*ERV.env,p.id,'rock',0.5);   // กำแพงโผล่ = ดันของ/ผนังบ้านพัง
    p.tec={ids,ok:true,k:SLOTK[i],a,cx:p.x+c*(60+L/2),cy:p.y+s*(60+L/2)};
    emit({k:'efx',z:'ewallup',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}});
function earthCrush(p){const T=p.tec;p.crush=null;if(!T)return;
  const W=T.ids.map(id=>(G.eso||[]).find(q=>q.id===id&&!q.dead)).filter(Boolean);if(!W.length){emit({k:'efx',z:'ecrushno',x:p.x,y:p.y,h:p.z+2,id:p.id});return;}
  const V=TECT.v,c=Math.cos(T.a),s=Math.sin(T.a),bx=T.cx-c*V.len/2,by=T.cy-s*V.len/2;
  const inside=t=>{const dx=t.x-bx,dy=t.y-by,u=dx*c+dy*s,l=-dx*s+dy*c;return u>-(t.r||PR)&&u<V.len+(t.r||PR)&&Math.abs(l)<V.gap/2;};
  for(const t of foesOf(p.team)){if(!inside(t)||Math.abs(cH(t)-(p.z+1.1))>4)continue;
    if(W.length>=2)aoeHit(p,t,V.crush2);
    else{const sd=W[0].side;aoeHit(p,t,V.crush1,t=>{t.vx+=s*sd*V.knock1;t.vy+=-c*sd*V.knock1;});}}
  damageEnv(T.cx,T.cy,170,V.envCrush*ERV.env,p.id,'rock',0.5);
  emit({k:'efx',z:'ecrush',x:Math.round(T.cx),y:Math.round(T.cy),h:p.z,a:Math.round(T.a*100)/100,n:W.length,s:W.length===1?W[0].side:0,id:p.id});
  for(const w of W)eKill(w,true);p.tec=null;}

// ---------- สกิล 4: Dust Burst ----------
const DUSTB=defSpell(EARTH,{id:'dustburst',v:{range:500,r:350,time:8,rWeak:200,timeWeak:5,delay:1.1},vn:{range:'ระยะเล็ง',r:'รัศมี (มี Stand)',time:'อยู่นาน (มี Stand)',rWeak:'รัศมี (Stand แตก)',timeWeak:'อยู่นาน (Stand แตก)',delay:'ฝุ่นเกิดหลังกด (วิ)'},role:'utility',n:'Dust Burst',ic:'🌫️',cd:20,d:'เล็งพื้นระยะ ~500: โยนหินขึ้น Stand ต่อยแตกเป็นฝุ่น (Stand แตก = เราทุบเองแบบอ่อนกว่า)',fx:'ศัตรูในฝุ่นมองชัดแค่ ~150 รอบตัว ไกลกว่านั้นจางเป็นสีฝุ่น (ไม่มืดบอด) • ไม่มีดาเมจ เดินออกได้ • Stand: รัศมี 350 นาน 8 วิ • Stand แตก: 200 นาน 5 วิ',
  cast(p,S){if(p.aug||p.ramp)return false;const V=S.v,o=aimPoint(p,V.range),st=eStand(p),r=st?V.r:V.rWeak,t=st?V.time:V.timeWeak;
    emit({k:'efx',z:'edustup',x:Math.round(o.x),y:Math.round(o.y),h:0,x2:Math.round(p.x),y2:Math.round(p.y),n:st?1:0,id:p.id});
    G.strikes.push({x:o.x,y:o.y,t:V.delay,fn(){(G.edust||(G.edust=[])).push({id:++G.zid,x:o.x,y:o.y,r,t,max:t,team:p.team});emit({k:'efx',z:'edust',x:Math.round(o.x),y:Math.round(o.y),h:0,r,n:st?1:0});}});}});

// ---------- สกิล 5: Terra Auger ----------
// กดค้างชาร์จ: แตะ = ระดับ 1 • 2 วิ = 2 • 4.5 วิ = 3 • ปล่อยแล้วสว่านพุ่งลงจุดเล็ง (600) • คูลดาวน์เริ่มตอนปล่อย
const AUGER=defSpell(EARTH,{id:'terraauger',v:{range:600,t2:2,t3:4.5,d1:20,d2:50,d3:120,r1:80,r2:110,r3:150,slow:0.15,cdCancel:7},vn:{range:'ระยะเล็ง',t2:'ชาร์จถึงระดับ 2 (วิ)',t3:'ชาร์จถึงระดับ 3 (วิ)',d1:'ระดับ 1 • ดาเมจ',d2:'ระดับ 2 • ดาเมจ',d3:'ระดับ 3 • ดาเมจ',r1:'ระดับ 1 • รัศมี',r2:'ระดับ 2 • รัศมี',r3:'ระดับ 3 • รัศมี',slow:'ความเร็วเดินตอนชาร์จ (เท่า)',cdCancel:'โดนสตันยกเลิก • คูลดาวน์ (วิ)'},role:'finisher',n:'Terra Auger',ic:'🌀',cd:14,d:'กดค้างชาร์จสว่านหินหมุนเหนือหัว แตะ = ระดับ 1 • ค้าง 2 วิ = 2 • 4.5 วิ = 3 ปล่อยแล้วพุ่งลงจุดเล็ง (ระยะ 600) • ระหว่างชาร์จเดินช้า 85% ใช้ท่าอื่นไม่ได้ กดโล่ = ยกเลิก • สว่านพุ่งเฉียงลงจากข้างบนไปที่เป้า',fx:'ดาเมจ 20 / 50 / 120 รัศมี 80 / 110 / 150 • ระดับ 3 พื้นแตกเป็นหลุม + เนินดินเล็ก ๆ เดินข้ามได้ (มีได้ทีละอัน) • โดนสตัน/แช่แข็ง = ยกเลิก คูลดาวน์ 7 วิ • ใช้ได้แม้ Stand แตก',
  cast(p,S,i){if(p.aug||p.ramp||p.ecb)return false;p.aug={t:0,k:SLOTK[i]};emit({k:'efx',z:'eaugon',x:p.x,y:p.y,h:p.z,id:p.id});return false;}});
// จุดลงของสว่าน: ตามเป้าเมาส์เสมอ • เล็งเหนือขอบฟ้า (ไม่โดนพื้น) = ไกลสุด 600 ตามทิศที่หัน (ไม่ดูดเข้าศัตรูใกล้ ๆ)
// เล็งอิสระ 3 มิติ (ผู้ใช้ 2026-10-27): ตามเส้นเป้ากลางจอจากสว่านเหนือหัว ชนพื้น/บ้าน/สุดระยะ (กลางอากาศ) • บอท = จุดเล็งบนพื้นแบบเดิม
function eAugAim(p,range){const r=aimRay3(p,p.z+3,range);if(r)return Object.assign(r,{hit:r.hit==='bld'||r.hit==='air'||r.hit==='edge'});return aimClip(p.x,p.y,p.z+3,aimPoint(p,range),0);}
function earthAugFire(p){const A=p.aug,V=AUGER.v;p.aug=null;const tier=A.t>=V.t3?3:A.t>=V.t2?2:1,o=eAugAim(p,V.range),oh=Math.round(o.h*10)/10,dm=[V.d1,V.d2,V.d3][tier-1],r=[V.r1,V.r2,V.r3][tier-1];
  p.cd[A.k]=AUGER.cd*p.buffs.cdr;p.cdMax[A.k]=p.cd[A.k];
  emit({k:'efx',z:'eaugfire',x:Math.round(o.x),y:Math.round(o.y),h:oh,x2:Math.round(p.x),y2:Math.round(p.y),n:tier,r,id:p.id});
  G.strikes.push({x:o.x,y:o.y,t:0.35,fn(){
    for(const t of foesIn(p.team,o.x,o.y,r,o.h+5))if((t.isE?(t.h||0):(t.z||0))>o.h-5)aoeHit(p,t,dm);
    damageEnv(o.x,o.y,r,dm*ERV.env,p.id,'rock',o.hit?o.h:0.5);
    if(tier===3&&!o.hit)earthMound(p,o.x,o.y,false);
    emit({k:'efx',z:'eaugboom',x:Math.round(o.x),y:Math.round(o.y),h:oh,n:tier,r});}});}

// เนินดินระดับ 3 (ผู้ใช้ 2026-10-21: เล็กลงครึ่งนึง เดินผ่านได้เหมือนเนินเล็ก ๆ): โดมรัศมี 37 สูง 1.2 • ไม่ใช่ของแข็ง ไม่บังกระสุน เดินขึ้นไปยืนได้ (groundH)
// ของท่าปกติมีได้ทีละอัน • ของอัลติ (u) เล็กกว่า (รัศมี 28 สูง 0.9) ไม่ลบกันเอง หายเองใน 15 วิ ⚠ การตีความ
function earthMound(p,x,y,ult){if(!ult)for(const w of G.eso||[])if(w.k==='mound'&&w.owner===p.id&&!w.u)eKill(w);
  eAdd({k:'mound',x1:x-0.01,y1:y,x2:x+0.01,y2:y,r:ult?28:37,hgt:ult?0.9:1.2,team:p.team,owner:p.id,u:ult?1:0,life:ult?15:undefined});}

// ---------- อัลติ: Wrath (v2) ----------
// ลอยขึ้นฟ้า (ขยับซ้าย/ขวาได้ ขึ้นลงไม่ได้ สูงสุด 5 วิ) • Stand ใหญ่ถือเสายักษ์ท่าพุ่งแหลน • คลิก = ปาลงจุดเล็ง (หมดเวลา = ปาเองที่จุดเล็ง)
// เสาปักตามองศาที่ตก HP 300 อยู่จนพัง • แรงกระแทก 100 ทั้งบึง (r400, โล่กันได้) + กระเด็น • บึงโคลน r400 8 วิ • ทุก 2 วิ หินแหลมพุ่งขึ้นใต้ศัตรูในบึง 30 (ผู้ใช้ 2026-11-01)
// (เลิกสว่าน 5 อันหลังลงพื้นแล้ว — ผู้ใช้: 'no more residue skill coming up after ult')
const WRATH=defSpell(EARTH,{id:'wrath',v:{sky:5,height:14,side:240,range:700,maxRange:900,r:400,hit:100,knock:900,pilHp:300,mud:8,mudSlow:0.5,every:2,spk:30,warn:0.5,sr:55,env:50},vn:{sky:'ลอยบนฟ้านานสุด (วิ)',height:'ลอยสูง',side:'ขยับซ้ายขวา • ความเร็ว',range:'ระยะปาเสา (บอท)',maxRange:'ระยะปาเสาไกลสุด',r:'รัศมีบึงโคลน/แรงกระแทก',hit:'แรงกระแทก • ดาเมจ',knock:'แรงกระแทก • กระเด็น',pilHp:'เสา • HP',mud:'บึงโคลน • นาน (วิ)',mudSlow:'บึงโคลน • ความเร็วศัตรู (เท่า)',every:'หินแหลม • ทุก (วิ)',spk:'หินแหลม • ดาเมจ',warn:'หินแหลม • เตือน (วิ)',sr:'หินแหลม • รัศมี',env:'เสาตก • พังบ้าน/ของ (×ตัวคูณ)'},role:'ult',ult:true,n:'Wrath',ic:'🗿',cd:0,d:'ลอยขึ้นฟ้า (ขยับได้แค่ซ้าย/ขวา สูงสุด 5 วิ) Stand ใหญ่ถือเสาหินยักษ์ คลิก = ปาลงจุดเล็ง • เสาปักลงพื้น (HP 300) แรงกระแทก 100 ทั้งบริเวณ (โล่กันได้) พื้นรัศมี 400 กลายเป็นบึงโคลน 8 วิ • ทุก 2 วิ หินแหลมพุ่งขึ้นใต้ศัตรูในบึง 30',fx:'แรงกระแทก 100 + กระเด็น ทั้งบึง (โล่กันได้) • บึงโคลน: ศัตรูช้า 50% ใช้ Dash ไม่ได้ • ทุก 2 วิ หินแหลมพุ่งขึ้นใต้ศัตรูในบึง (มีวงเตือน 0.5 วิ) 30 • ลงพื้นแล้วจบ ไม่มีสว่านต่อ • ไม่ติดช้า • ใช้ได้แม้ Stand แตก (Stand กลับมาทันที โล่เต็ม)',
  cast(p){if(p.aug)p.aug=null;if(p.ramp)earthRampEnd(p,true);p.crush=null;p.ecb=null;
    if(p.stdB>0){p.stdB=0;p.ehp=ERV.sh;emit({k:'efx',z:'estdon',x:p.x,y:p.y,h:p.z,id:p.id});}
    p.wr={ph:'sky',t:0,a0:p.ang,nd:0};p.shieldOn=false;
    emit({k:'efx',z:'ewrath',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}});
function earthPillarThrow(p){const W=p.wr;if(!W||W.ph!=='sky')return;
  let o;if(p.inp&&!p.bot&&p.inp.gx>=0)o={x:p.inp.gx,y:p.inp.gy};else o=aimPoint(p,E_WRS.range);
  const dx=o.x-p.x,dy=o.y-p.y,d=Math.hypot(dx,dy)||1,M=E_WRS.maxRange;if(d>M){o.x=p.x+dx/d*M;o.y=p.y+dy/d*M;}
  const x=clamp(o.x,50,MW-50),y=clamp(o.y,50,MH-50),a=Math.atan2(y-p.y,x-p.x);W.ph='land';W.lt=0.9;
  emit({k:'efx',z:'epilthrow',x:Math.round(p.x),y:Math.round(p.y),h:Math.round(p.z*10)/10,x2:Math.round(x),y2:Math.round(y),id:p.id});
  G.strikes.push({x,y,t:0.45,fn(){
    for(const t of foesIn(p.team,x,y,E_WRS.r,30))aoeHit(p,t,E_WRS.hit,t=>knock(t,x,y,E_WRS.knock));damageEnv(x,y,90,E_WRS.env*ERV.env,p.id,'rock',0.6);   // แรงกระแทกทั้งบึง (aoeHit = โล่กันได้)
    // เสาเอียงตามทิศที่ตก: เก็บทิศไว้ในปลายเส้นสั้น ๆ (x2,y2)
    eAdd({k:'pil',x1:x,y1:y,x2:x+Math.cos(a)*0.5,y2:y+Math.sin(a)*0.5,r:35,hgt:9,hp:E_WRS.pilHp,maxHp:E_WRS.pilHp,team:p.team,owner:p.id});
    addZone({x,y,r:E_WRS.r,t:E_WRS.mud,tick:0.15,owner:p.id,team:p.team,kind:'mud',hit(t){addSlow(t,E_WRS.mudSlow,0.3);t.mudT=Math.max(t.mudT||0,0.3);}});
    (G.espk||(G.espk=[])).push({x,y,t:E_WRS.mud,nx:E_WRS.every,owner:p.id,team:p.team});
    emit({k:'efx',z:'epilland',x:Math.round(x),y:Math.round(y),h:0,a:Math.round(a*100)/100});}});}
function earthWrathTick(p,dt){const W=p.wr;W.t+=dt;
  if(W.ph==='sky'){p.z+=(E_WRS.height-p.z)*Math.min(1,5*dt);p.vz=0;
    // ขยับได้แค่ซ้าย/ขวา (ตั้งฉากกับทิศตอนกดอัลติ)
    const inp=p.inp||{},px=-Math.sin(W.a0),py=Math.cos(W.a0);let m=0;
    if(typeof inp.mx==='number')m=inp.mx*px+inp.my*py;
    if(Math.abs(m)>0.1){const k=Math.sign(m)*Math.min(1,Math.abs(m))*E_WRS.side*dt;p.x=clamp(p.x+px*k,40,MW-40);p.y=clamp(p.y+py*k,40,MH-40);}
    if(W.t>=E_WRS.sky)earthPillarThrow(p);
    return;}
  if(W.ph==='land'){W.lt-=dt;if(W.lt<=0){p.vz=-10;emit({k:'efx',z:'ewland',x:Math.round(p.x),y:Math.round(p.y),h:0,id:p.id});earthWrathEnd(p);}return;}   // ลงพื้น = จบ (ไม่มีสว่านต่อแล้ว)
  W.dt-=dt;if(W.dt<=0||W.nd<=0)earthWrathEnd(p);}
// คลิกซ้ายตอนมีสว่าน: ยิงทีละอัน (ขวา → ซ้าย) = Terra Auger ระดับ 3
function earthWrathDrill(p){const W=p.wr;if(!W||W.nd<=0)return;W.nd--;const o=eAugAim(p,700),oh=Math.round(o.h*10)/10,i=W.nd;
  emit({k:'efx',z:'ewdrill',x:Math.round(o.x),y:Math.round(o.y),h:oh,x2:Math.round(p.x),y2:Math.round(p.y),n:i,id:p.id});
  G.strikes.push({x:o.x,y:o.y,t:0.35,fn(){
    for(const t of foesIn(p.team,o.x,o.y,80,o.h+5))if((t.isE?(t.h||0):(t.z||0))>o.h-5)aoeHit(p,t,120);damageEnv(o.x,o.y,80,120*ERV.env,p.id,'rock',o.hit?o.h:0.5);
    if(!o.hit)earthMound(p,o.x,o.y,true);emit({k:'efx',z:'eaugboom',x:Math.round(o.x),y:Math.round(o.y),h:oh,n:3,r:80});}});}   // รัศมีระเบิดสว่าน 150 → 80 (ผู้ใช้ 2026-10-21)
function earthWrathEnd(p){const W=p.wr;p.wr=null;if(!W)return;
  emit({k:'efx',z:'ewend',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}

// หินแหลมในบึง Wrath: ทุก 2 วิ พุ่งขึ้นใต้ศัตรูทุกคนในบึง (เตือนวงที่พื้น 0.5 วิ หลบได้) + จุดสุ่มอีก 3 จุด • โดน = 30 (โล่กันได้) + เด้งขึ้นนิดหน่อย
const E_WRS=WRATH.v;
function earthSpikeTick(S,dt){S.t-=dt;S.nx-=dt;if(S.nx>0)return;S.nx=E_WRS.every;const o=G.players[S.owner];if(!o)return;
  const pts=foesIn(S.team,S.x,S.y,E_WRS.r,30).map(t=>({x:t.x+(Math.random()-0.5)*20,y:t.y+(Math.random()-0.5)*20}));
  for(let i=0;i<3;i++){const a=Math.random()*6.283,d=Math.sqrt(Math.random())*E_WRS.r*0.9;pts.push({x:S.x+Math.cos(a)*d,y:S.y+Math.sin(a)*d});}
  for(const q of pts){const x=clamp(q.x,40,MW-40),y=clamp(q.y,40,MH-40);emit({k:'efx',z:'espkw',x:Math.round(x),y:Math.round(y),h:0});
    G.strikes.push({x,y,t:E_WRS.warn,fn(){for(const t of foesIn(S.team,x,y,E_WRS.sr,30))aoeHit(o,t,E_WRS.spk,t=>{t.vz=Math.max(t.vz||0,6);});emit({k:'efx',z:'espk',x:Math.round(x),y:Math.round(y),h:0});}});}}

// ---------- ทั้งสนาม: สิ่งก่อสร้างพัง / ฝุ่นหมดเวลา / Stonebreaker ชนกำแพง ----------
function updateEarth(dt){
  if(G.espk){for(const S of G.espk)earthSpikeTick(S,dt);G.espk=G.espk.filter(S=>S.t>0);}
  if(G.eso){for(const w of G.eso)if(!w.dead&&(w.hp<=0||w.life!==undefined&&(w.life-=dt)<=0))eKill(w,w.k==='mound');G.eso=G.eso.filter(w=>!w.dead);}
  if(G.edust){for(const d of G.edust)d.t-=dt;G.edust=G.edust.filter(d=>d.t>0);}
  for(const t of foesOf(-99)){if(t.mudT>0)t.mudT-=dt;
    if(t.sbk>0){t.sbk-=dt;if((t.solN|0)>(t.sbkN|0)&&Math.hypot(t.vx||0,t.vy||0)>120){t.sbk=0;const o=G.players[t.sbkSrc];
      if(o){o.baHit=0;damage(t,STONEB.v.wallDmg,o.id,'proj');}addStun(t,STONEB.v.wallStun);emit({k:'efx',z:'esbwall',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});}}}
}
// สำหรับ snapshot
// [Stand แตกเหลือ, Rampage, ชาร์จ Auger (วิ), Wrath (1 ฟ้า 2 ลง 3 สว่าน), สว่านเหลือ, เวลาบนฟ้าเหลือ, เวลาสว่านเหลือ, HP โล่, Crush ได้, ชาร์จ BA (วิ), คูลดาวน์ BA ชาร์จ]
function earthSnapP(p){if(!eOn(p))return undefined;const W=p.wr;
  return [p.stdB>0?Math.ceil(p.stdB):0,p.ramp?1:0,p.aug?Math.round(p.aug.t*10)/10+0.01:0,W?(W.ph==='sky'?1:W.ph==='land'?2:3):0,W?W.nd|0:0,W&&W.ph==='sky'?Math.max(0,Math.ceil(E_WRS.sky-W.t)):0,W&&W.ph==='trans'?Math.max(0,Math.ceil(W.dt)):0,Math.round(p.ehp||0),p.tec&&p.tec.ok?1:0,p.ecb?Math.round(p.ecb.t*10)/10+0.01:0,p.ecbCd>0?Math.ceil(p.ecbCd):0];}
function earthSnapW(){return {ES:(G.eso||[]).map(w=>[w.id,{tec:0,pil:1,mound:2,dom:3}[w.k],Math.round(w.x1),Math.round(w.y1),Math.round(w.x2),Math.round(w.y2),w.r,w.maxHp>1e8?100:Math.max(1,Math.round(w.hp/w.maxHp*100)),w.team,w.owner]),
  ED:(G.edust||[]).map(d=>[d.id,Math.round(d.x),Math.round(d.y),d.r,Math.round(d.t*10)/10,d.team])};}

// ท่าพื้นฐาน + โล่ + Dash ของสาย (PBASIC ต้องอยู่ช่องที่ 6 = ลำดับใน PATHS)
PBASIC.push({id:'b_earth',type:'erock',n:'หมัด Stand / หินเล็ก',d:'คลิก = Stand ล็อกศัตรูที่ใกล้จุดเล็งที่สุดในระยะ 300 โผล่ข้างเป้า (~0.2 วิ หลบทันได้) ต่อยหมัดเดียว 10 ดาเมจ ทุก 0.8 วิ ไม่มีศัตรู = ต่อยหน้าเรา • กดค้าง = Stand ใหญ่ยกสองมือชาร์จ 2 วิ แล้วทุบวงหน้าเรา (รัศมี 180) 50 + สตัน 0.7 วิ คูลดาวน์ 6 วิ เดินช้า 40% • Stand แตก = ยิงหินเล็ก 5 ดาเมจ ทุก 0.35 วิ เล็งเอง',
  shd:'โล่ Stand Barrier: Stand ยกโล่หินใหญ่ กันได้รอบตัว 300 HP (มากที่สุดในทุกสาย) • ไม่ได้ใช้ 3 วิ ฟื้น 20/วิ • โล่แตก = Stand หาย 15 วิ (ยิงหินเล็กแทนหมัด, Dash เป็น Rock Boost, สกิลที่ใช้ Stand ใช้ไม่ได้) แล้วกลับมาพร้อมโล่เต็ม 300',
  dsd:'Stand Rampage (Shift): ขี่ Stand วิ่งชาร์จตามทิศเล็ง 1.2 วิ (~600) กด Shift อีกครั้งหยุดก่อน • ชนศัตรู 15 + สตัน 0.5 วิ + กระเด็น • จบด้วยทุบพื้น 20 + สตัน 0.8 วิ รัศมี 150 • ทะลุกำแพง/เสาของเรา พังของศัตรู • คูลดาวน์ 8 วิ • Stand แตก = Rock Boost Escape: หินดันพุ่ง ~400 ศัตรูรอบจุดเริ่ม (120) กระเด็น คูลดาวน์ 6 วิ',
  hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');},tick:earthBasic,dash:earthDash});
SPELLS.b_earth=PBASIC[EARTH];
