// ---------- สายไฟ: ยิงปกติ 2 โหมด / โล่ระเบิด / พุ่งชาร์จ ----------
SPELLS.pyroball={id:'pyroball',hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');addBurn(t,1,pr.owner);const o=G.players[pr.owner];if(o)launchOrbs(o,t);}};
// ลูกไฟใหญ่ (Kindle): ระเบิดวง ~90 ตอนโดนตัวหรือพื้น — ทุกคนในวงโดน 20 +1 Burning
SPELLS.pyrobig={id:'pyrobig',hit(pr,t){}};
function pyroBigBoom(pr){
  emit({k:'efx',z:'bigboom',x:pr.x,y:pr.y,h:pr.h,r:90});
  damageEnv(pr.x,pr.y,90,40,pr.owner,'fireblast',pr.h);
  const o=G.players[pr.owner];if(!o)return;
  let best=null,bd=1e9;
  for(const t of foesIn(pr.team,pr.x,pr.y,90,pr.h+3.5)){aoeHit(o,t,20,t=>addBurn(t,1,pr.owner));const d=Math.hypot(t.x-pr.x,t.y-pr.y);if(d<bd){bd=d;best=t;}}
  if(best)launchOrbs(o,best);
}
function pyroBall(p){shoot(p,'pfire',{sp:'pyroball',dmg:20});}
function pyroBasic(p,inp,dt,setCd){
  const prev=p.bfPrev;p.bfPrev=inp.fire;
  if(p.dfall){if(p.dfall.ph===2&&inp.fire&&!prev)dragonfallDive(p);p.chg=0;return;}
  if(p.breath>0||p.snapT>0){p.chg=0;return;}
  if(inp.fire&&!prev){
    // Kindle: คลิก = ลูกไฟชาร์จเต็มทันที
    if(p.kindle>0&&p.cd.basic<=0){p.kindle--;if(!p.kindle){p.kindleT=0;p.hover=0;}shoot(p,'pfireb',{sp:'pyrobig',dmg:20});setCd('basic',0.5);p.chg=-1;return;}
    p.chg=0;
  }else if(inp.fire){if(p.chg>=0)p.chg=Math.min(1.5,p.chg+dt);}
  else if(prev){
    // ปล่อยคลิก: แตะสั้น = ประกายไฟ / ชาร์จครบ 3 วิ = ลูกไฟ / ระหว่างนั้น = ไม่ยิง
    if(p.chg>=1.5){pyroBall(p);setCd('basic',0.5);}
    else if(p.chg>=0&&p.chg<0.25&&p.cd.basic<=0){shoot(p,'spark',{sp:'b_pyro',dmg:6});setCd('basic',0.3);}
    p.chg=0;
  }
}
// โล่สายไฟ: เก็บ "ลูกไฟวิญญาณ" (orb) หมุนรอบตัว — Parry +2 / บล็อกครบ 3 ครั้ง +2 / สูงสุด 6 ไม่หายจนกว่าจะใช้
function addOrbs(p,n){const was=p.orbs|0;p.orbs=Math.min(6,was+n);if(p.orbs>was)emit({k:'efx',z:'orbget',x:p.x,y:p.y,h:p.z+1.2,id:p.id,n:p.orbs});}
function pyroParry(p){addOrbs(p,2);}
function pyroBlock(p){p.orbBlk=(p.orbBlk|0)+1;if(p.orbBlk>=3){p.orbBlk=0;addOrbs(p,2);}}
// ลูกไฟ (ชาร์จ/Kindle) โดนศัตรู = ปล่อยลูกไฟวิญญาณทั้งหมดพุ่งใส่เป้านั้น ลูกละ 10 • ทุก 2 ลูก = +1 Burning
function launchOrbs(p,t){
  const n=p.orbs|0;if(!n||!t)return;p.orbs=0;
  const d=Math.hypot(t.x-p.x,t.y-p.y),tt=Math.max(0.15,d/1300);
  emit({k:'efx',z:'orbshot',x:p.x,y:p.y,h:p.z+1.3,x2:t.x,y2:t.y,h2:cH(t),n,t:Math.round(tt*100)/100});
  G.strikes.push({t:tt,fn:()=>{if(t.dead||(!t.isE&&!t.isM&&(!t.alive||t.downed)))return;aoeHit(p,t,10*n);emit({k:'efx',z:'orbhit',x:t.x,y:t.y,h:cH(t),n});}});
}
// คืนค่า true = กำลังชาร์จ (ขยับ/ยิง/ร่ายไม่ได้)
function pyroDash(p,inp,pr,dt,setCd){
  if(p.dchgOn){
    p.dchg=Math.min(4,p.dchg+dt);
    if(inp.dh)return true;
    p.dchgOn=false;
    // พุ่งไปตามทิศกล้อง/เป้าเล็งเสมอ (ไม่สน WASD)
    const dx=Math.cos(p.ang),dy=Math.sin(p.ang);
    const dist=150+950*p.dchg/4,sp=2000;
    p.dash=dist/sp;p.dashSp=sp;p.dashX=dx;p.dashY=dy;p.inv=p.dash+0.06;p.shieldOn=false;
    setCd('dodge',(3+p.dash)*p.buffs.cdr);
    emit({k:'efx',z:'pboom',x:p.x-dx*24,y:p.y-dy*24,h:p.z+0.6,a:Math.atan2(dy,dx),n:Math.round(p.dchg/4*50)/10,id:p.id});
    emit({k:'dash',x:p.x,y:p.y});
    p.dchg=0;p.fpath={x:p.x,y:p.y};
    return false;
  }
  if(pr.sp&&p.cd.dodge<=0&&p.z<0.5){p.dchgOn=true;p.dchg=0;p.shieldOn=false;return true;}
  return false;
}
// ทางไฟจาก Dash (ผู้ใช้ 2026-10-22): ค้าง 3 วิ • ศัตรูเหยียบเข้า = burn +1 stack (ต่อการเข้า 1 ครั้ง) • ยืนบนทาง = 10 ดาเมจ/วิ
// ⚠ Claude เลือกเอง: กว้าง 1.5 ม. (ครึ่ง 15 px + ตัว) • เข้าซ้ำได้ stack ใหม่หลังออกไปแล้ว ≥1 วิ • ไม่โดนตัวเอง/ทีม • ลอยสูง >1.2 ม. ไม่โดน
const FPATH={T:3,W:15,DPS:10};
function pyroPathEnd(p){
  const f=p.fpath;p.fpath=null;const len=Math.hypot(p.x-f.x,p.y-f.y);if(len<20||len>1300||!p.alive||p.downed)return;
  (G.fpaths||(G.fpaths=[])).push({x0:f.x,y0:f.y,x1:p.x,y1:p.y,t:FPATH.T,tt:0.5,owner:p.id,team:p.team,on:new Map()});
  emit({k:'efx',z:'pfpath',x:Math.round(f.x),y:Math.round(f.y),h:groundH(f.x,f.y),a:Math.round(Math.atan2(p.y-f.y,p.x-f.x)*1000)/1000,len:Math.round(len),id:p.id});
}
function updateFirePaths(dt){
  if(!G.fpaths||!G.fpaths.length)return;
  for(const f of G.fpaths){
    f.t-=dt;f.tt-=dt;const tick=f.tt<=0;if(tick)f.tt=0.5;
    const dx=f.x1-f.x0,dy=f.y1-f.y0,L2=dx*dx+dy*dy||1;
    for(const t of foesOf(f.team)){
      const u=clamp(((t.x-f.x0)*dx+(t.y-f.y0)*dy)/L2,0,1),d=Math.hypot(t.x-(f.x0+dx*u),t.y-(f.y0+dy*u));
      const inside=d<FPATH.W+(t.r||PR)*0.6&&(t.isE?(t.h||0):(t.z||0))<1.2&&!(t.inv>0);
      const last=f.on.get(t);
      if(inside){if(last===undefined||(last<0&&G.time+last>=1))addBurn(t,1,f.owner);f.on.set(t,1);if(tick)damage(t,FPATH.DPS*0.5,f.owner,'zone');}
      else if(last>0)f.on.set(t,-(G.time+0.001));
    }
  }
  G.fpaths=G.fpaths.filter(f=>f.t>0);
}


// =====================================================================
//  สายไฟ — ความร้อน: สะสมด้วยลูกไฟ/กำแพง/พุ่งเพลิง แล้วจุดระเบิดด้วยระเบิดความร้อน/อุกกาบาต
// =====================================================================
defSpell(0,{id:'kindle',role:'builder',n:'Kindle',ic:'🔥',cd:9,d:'กระโดดสูงไปทางที่กด WASD (ไม่กด = ถอยหลัง) ขึ้นกลางอากาศ แล้วลอยตกช้าๆ 3 วิ (แบบฟาราห์/เฟรย่า) • ยิงปกติ 2 นัดกลายเป็นลูกไฟใหญ่ทันที (20 ดาเมจ ระเบิดวงกว้าง ~90 +1 Burning ทุกคนในวง)',fx:'ยิงครบ 2 ลูกหรือครบ 3 วิ = ตกลงพื้นตามปกติ • ไฟพุ่งจากใต้เท้าตอนลอย',
  cast(p,S){p.kindle=2;p.kindleT=3;p.hover=3;p.vz=15;{const i=p.inp||{};let dx=i.mx||0,dy=i.my||0;const l=Math.hypot(dx,dy);if(l>0.1){dx/=l;dy/=l;}else{dx=-Math.cos(p.ang);dy=-Math.sin(p.ang);}p.vx+=dx*1000;p.vy+=dy*1000;}p.shieldOn=false;emit({k:'efx',z:'kindle',x:p.x,y:p.y,h:p.z,id:p.id});}});
defSpell(0,{id:'dragonfall',role:'builder',n:'Dragonfall',ic:'🐉',cd:13,d:'ทะยานขึ้นฟ้าด้วยเปลวไฟ แล้วบินควบคุมได้ 3 วิ (WASD เคลื่อนช้าๆ • Space ขึ้น / C ลง เล็กน้อย) — จุดที่เล็งคือจุดลง มีวงเตือนบนพื้นตามเป้าเล็งให้ทุกคนเห็น • คลิกยิง = ดิ่งกระแทกทันที • ครบ 3 วิ = ดิ่งลงจุดเล็งล่าสุดอัตโนมัติ',fx:'กระแทกวงรัศมี 120: 28 ดาเมจ +1 Burning + ช้าลง 30% 1.2 วิ (โดนครั้งเดียวต่อคน) • ไม่อมตะระหว่างบิน • โดนสตัน/แช่แข็งระหว่างบิน = ร่วงลงเฉยๆ ไม่กระแทก • ระหว่างบิน: ยิงปกติได้ แต่ใช้โล่/พุ่ง/คาถาอื่นไม่ได้',
  cast(p,S){
    if(p.dfall||p.colos>0)return false;
    const g0=groundH(p.x,p.y),q=aimPoint(p,600);
    p.dfall={ph:1,t:0.35,g0,H:g0+6,tx:q.x,ty:q.y};
    p.shieldOn=false;p.dchgOn=false;p.hover=0;p.vz=0;
    emit({k:'efx',z:'dfrise',x:p.x,y:p.y,h:p.z,id:p.id});
  }});
// Dragonfall: 1 ย่อตัว+ทะยาน (0.35 วิ) → 2 บินควบคุมได้ 3 วิ (วงเตือนตามเป้าเล็ง • คลิกยิง = ดิ่งทันที) → 3 ดิ่งลงจุดเล็งล่าสุด (0.45 วิ) → กระแทก
const DF_R=120;
function dragonfallDive(p){const D=p.dfall;D.ph=3;D.t=0.45;D.sx=p.x;D.sy=p.y;D.sz=p.z;emit({k:'efx',z:'dfdive',x:p.x,y:p.y,h:p.z,x2:Math.round(D.tx),y2:Math.round(D.ty),id:p.id});}
function dragonfallTick(p,inp,dt){
  const D=p.dfall;D.t-=dt;
  if(!p.alive||p.downed){p.dfall=null;return;}
  if(D.ph<3&&(p.stun>0||p.frz>0)){p.dfall=null;p.vz=0;emit({k:'efx',z:'dfcancel',x:p.x,y:p.y,h:p.z,id:p.id});return;}
  if(D.ph===1){if(D.t<0.25)p.z+=(D.H-p.z)*Math.min(1,14*dt);p.vz=0;if(D.t<=0){D.ph=2;D.t=3;}}
  else if(D.ph===2){
    D.H=clamp(D.H+((inp.jh?1:0)-(inp.ch?1:0))*2.5*dt,D.g0+4.5,D.g0+7.5);p.z+=(D.H-p.z)*Math.min(1,6*dt);p.vz=0;
    const q=aimClip(p.x,p.y,p.z,aimPoint(p,600),PR+6);D.tx=q.x;D.ty=q.y;D.th=q.hit?q.h:null;   // ไม่ทะลุบ้าน
    if(D.t<=0)dragonfallDive(p);
  }else{
    const k=1-Math.max(0,D.t)/0.45,gh=D.th!=null?D.th:groundH(D.tx,D.ty);
    p.x=lerp(D.sx,D.tx,k);p.y=lerp(D.sy,D.ty,k);p.z=lerp(D.sz,gh,k*k);p.vz=0;
    if(D.t<=0){p.x=D.tx;p.y=D.ty;p.z=gh;p.dfall=null;dragonfallBoom(p,D.tx,D.ty,gh);}
  }
}
function dragonfallBoom(p,x,y,gh){
  emit({k:'efx',z:'dfboom',x:Math.round(x),y:Math.round(y),h:gh+0.08,r:DF_R,id:p.id});
  for(const t of foesIn(p.team,x,y,DF_R,gh+4))aoeHit(p,t,28,t=>{addBurn(t,1,p.id);addSlow(t,0.7,1.2);});
  damageEnv(x,y,DF_R,60,p.id,'fireblast',gh);
}
defSpell(0,{id:'ringofembers',role:'control',n:'Ring of Embers',ic:'⭕',cd:14,d:'อุกกาบาตไฟตกลงที่จุดเล็ง (ระยะ ~400) โดนคนในวง 10 ดาเมจ แล้วกลายเป็นวงเพลิง (รัศมี ~170) นาน 3 วิ — คนข้างในเดินออกไม่ได้',fx:'พยายามเดินออก = 12.5 ดาเมจ + ผลักกลับเข้าวง • ใครแตะขอบวงไฟ = ช้าลง 40% • คนข้างนอกเดินเข้าได้',
  cast(p,S){
    const q=aimPoint(p,400);
    // อุกกาบาตไฟตกลงจุดที่วาง ~0.3 วิ → ตกถึงพื้น = 10 ดาเมจครั้งเดียว (ผู้เล่นสั่ง 2026-10-19) แล้ววงไฟค่อยเริ่ม (กับดักเริ่มช้าลง 0.3 วิ)
    (G.erings||(G.erings=[])).push({x:q.x,y:q.y,r:170,t:3,del:0.3,owner:p.id,team:p.team,in:new Set(),cd:new Map(),ed:new Map()});
    emit({k:'efx',z:'ermet',x:q.x,y:q.y,h:0.2,r:170,t:0.3,id:p.id});
  }});
defSpell(0,{id:'blazeform',role:'utility',n:'Blazeform',ic:'🔥',cd:20,d:'กลายร่างเปลวไฟ 6 วิ: ดาเมจทุกสกิล (รวมเผา Burning) +30% • เดินเร็ว +25% • ออร่าไฟรอบตัว (รัศมี ~130) เผา ~19/วิ • ศัตรูที่โดนออร่าครั้งแรก +1 Burning (คนละ 1 ชั้นต่อการใช้ 1 ครั้ง)',fx:'ผลเสีย: เรารับดาเมจ +25% ระหว่างนั้น',
  cast(p,S){p.blaze=6;p.blzTk=0;p.blzN=0;p.blzHit=new Set();emit({k:'efx',z:'blaze',x:p.x,y:p.y,h:p.z+1,id:p.id});}});
defSpell(0,{id:'ignitionsnap',role:'finisher',n:'Ignition Snap',ic:'🫰',cd:5,d:'ท่าเตรียม 0.6 วิ แล้วดีดนิ้ว: ศัตรูทุกคนที่มี Burning ในระยะ 500 ระเบิดพร้อมกัน (ไม่ต้องเล็ง)',fx:'25 ดาเมจต่อ 1 ชั้น Burning (6 ชั้น = 150) และฮีลเรา 20 ต่อชั้น แล้วใช้ Burning หมด • ไม่มีใครติดไฟในระยะ = ไม่เสียคูลดาวน์',
  cast(p,S){
    if(!foesOf(p.team).some(t=>t.brn>0&&Math.hypot(t.x-p.x,t.y-p.y)<500))return false;
    p.snapT=0.6;emit({k:'efx',z:'snapwind',x:p.x,y:p.y,h:p.z+1.4,id:p.id});
  }});
defSpell(0,{id:'colossus',role:'ult',n:'Inferno Colossus',ic:'👹',cd:0,ult:true,d:'เวทโบราณสายไฟ: กระโดดขึ้นฟ้าทันที ร่างยักษ์ไฟปรากฏกลางอากาศ 6 วิ (Space = ขึ้น / Ctrl หรือ C = ลง) ถือหน้าไม้ไฟ ยิงได้ 3 นัด (เว้น 1 วิ) นัดละ 100 ดาเมจ ระเบิดวง ~200',fx:'คนโดน +3 Burning และ Extreme Burning (10/วิ 5 วิ) • ลอยเคลื่อนที่ได้ช้า โดนยิงได้ปกติ • ยิงครบ 3 นัด = ร่างหาย',
  cast(p,S){p.colos=6;p.colN=3;p.colCd=0.6;p.colH=9;p.vz=0;p.fly=false;p.shieldOn=false;p.dchgOn=false;p.breath=0;emit({k:'efx',z:'colossus',x:p.x,y:p.y,h:p.z,id:p.id});}});
function pyroSnap(p){
  emit({k:'efx',z:'snap',x:p.x,y:p.y,h:p.z+1.6,id:p.id});
  for(const t of foesOf(p.team)){
    if(!(t.brn>0)||Math.hypot(t.x-p.x,t.y-p.y)>500)continue;
    const n=t.brn|0;
    if(aoeHit(p,t,25*n)){t.brn=0;t.brnT=0;healT(p,20*n);}
    emit({k:'efx',z:'snapboom',x:t.x,y:t.y,h:cH(t),n});
  }
}
// อัลติ: ลอย/ยิงหน้าไม้ไฟ (คลิกซ้าย) • ใช้แทนการยิงปกติ/โล่/พุ่ง/คาถาระหว่างร่างยักษ์
function colossusTick(p,inp,dt){
  p.colCd-=dt;
  if(!inp.fire||p.colCd>0||!(p.colN>0))return;
  let q=null,bs=1e9;
  for(const t of foesOf(p.team)){const dx=t.x-p.x,dy=t.y-p.y,dd=Math.hypot(dx,dy);if(dd>1000||dd<1)continue;const da=Math.abs(angDiff(Math.atan2(dy,dx),p.ang));if(da<0.3&&da+dd/4000<bs){bs=da+dd/4000;q={x:t.x,y:t.y};}}
  if(!q&&typeof inp.ah==='number'&&!p.bot){const g=inp.gx>=0,dx=(g?inp.gx:inp.ax)-p.x,dy=(g?inp.gy:inp.ay)-p.y,dd=Math.hypot(dx,dy)||1,k=Math.min(1000,Math.max(120,dd))/dd;q={x:p.x+dx*k,y:p.y+dy*k};}
  if(!q){const ap=(inp.ap||0),H=p.z+4;let d=1000;if(ap<-0.03)d=Math.min(1000,H*20/Math.tan(-ap));d=Math.max(120,d);q={x:p.x+Math.cos(p.ang)*d,y:p.y+Math.sin(p.ang)*d};}
  q.x=clamp(q.x,40,MW-40);q.y=clamp(q.y,40,MH-40);
  {const c=aimClip(p.x,p.y,p.z+4.2,q,0);q.x=c.x;q.y=c.y;q.h=c.hit?c.h:0.5;}   // ชนบ้านก่อน = ระเบิดที่ผนัง
  p.colN--;p.colCd=1;
  const fx=p.x+Math.cos(p.ang)*30,fy=p.y+Math.sin(p.ang)*30,tt=Math.hypot(q.x-fx,q.y-fy)/1800+0.08;
  emit({k:'efx',z:'colbolt',x:fx,y:fy,h:p.z+4.2,x2:q.x,y2:q.y,t:tt,id:p.id});
  G.strikes.push({x:q.x,y:q.y,r:200,t:tt,fn:s=>{
    emit({k:'efx',z:'colboom',x:s.x,y:s.y,h:0.3,r:200});
    for(const t of foesIn(p.team,s.x,s.y,200,6))aoeHit(p,t,100,t=>{addBurn(t,3,p.id);addXBurn(t,p.id);});
    damageEnv(s.x,s.y,200,100,p.id,'fireblast',q.h);   // พังบ้าน/ลัง
  }});
  if(p.colN<=0)p.colos=Math.min(p.colos,0.5);
}
function updateERings(dt){
  if(!G.erings||!G.erings.length)return;
  for(const R of G.erings){
    if(R.del>0){R.del-=dt;if(R.del>0)continue;
      for(const t of foesIn(R.team,R.x,R.y,R.r,6))aoeHit({id:R.owner,x:R.x,y:R.y},t,10);
      emit({k:'efx',z:'ering',x:R.x,y:R.y,h:0.2,r:R.r,t:R.t});continue;}
    R.t-=dt;
    for(const t of foesOf(R.team)){
      const dx=t.x-R.x,dy=t.y-R.y,d=Math.hypot(dx,dy)||1,tr=t.r||PR;
      // แตะขอบวงไฟ: ช้าลง (ไม่ใส่ Burning แล้ว — ผู้เล่นปรับ 2026-10-18)
      if(Math.abs(d-R.r)<26+tr*0.6&&!(!t.isE&&!t.isM&&t.inv>0)){addSlow(t,0.6,0.4);}
      if(d<R.r-tr*0.5){R.in.add(t);continue;}
      if(!R.in.has(t))continue;
      // อยู่ข้างในแล้วพยายามออก: ผลักกลับเข้าวง
      const m=R.r-tr*0.5-4;t.x=R.x+dx/d*m;t.y=R.y+dy/d*m;t.vx=-dx/d*280;t.vy=-dy/d*280;if(t.dash>0)t.dash=0;
      if(!(R.cd.get(t)>G.time)&&!(!t.isE&&!t.isM&&t.inv>0)){R.cd.set(t,G.time+0.5);damage(t,12.5,R.owner,'zone');emit({k:'efx',z:'eringhit',x:t.x,y:t.y,h:cH(t)});}
    }
  }
  G.erings=G.erings.filter(R=>R.t>0);
}
