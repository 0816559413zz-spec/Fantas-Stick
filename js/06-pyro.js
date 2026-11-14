// ---------- สายไฟ: ยิงปกติ 2 โหมด / โล่ระเบิด / พุ่งชาร์จ ----------
// ตัวเลขทั้งหมดของสายไฟอยู่ใน PYV (ยิงปกติ/โล่/พุ่ง) และ v:{...} ของแต่ละสกิล — ปรับได้ในเครื่องมือ tune.html / F8 (js/73-tune.js)
const PYV=PATHS[0].v={flN:3,flCd:6,flR:180,flDmg:10,flSlow:0.2,flMax:2,flSlowT:2,flLow:0.35,flGap:0.5,flGrow:0.5,sparkDmg:5,sparkCd:0.3,sparkN:3,chargeT:1.6,ballDmg:20,ballCd:0.5,orbMax:0,orbParry:2,orbBlockN:3,orbBlock:2,orbDmg:4,orbSpd:1300,
  dashT:4,dashD0:150,dashD1:950,dashSp:2000,dashCd:3,pathT:3,pathW:15,pathDps:8};
PATHS[0].vn={sparkDmg:'ประกายไฟ (แตะ) • ดาเมจ',sparkN:'ประกายไฟ • โดนกี่นัดได้ Burning',sparkCd:'ประกายไฟ • เว้นยิง (วิ)',chargeT:'ลูกไฟชาร์จ • เวลาชาร์จ (วิ)',ballDmg:'ลูกไฟชาร์จ • ดาเมจ',ballCd:'ลูกไฟชาร์จ • เว้นยิง (วิ)',
  orbMax:'โล่ • ลูกไฟวิญญาณสูงสุด',orbParry:'โล่ • ได้ลูกไฟตอน Parry',orbBlockN:'โล่ • บล็อกกี่ครั้งได้ลูกไฟ',orbBlock:'โล่ • ได้ลูกไฟตอนบล็อกครบ',orbDmg:'ลูกไฟวิญญาณ • ดาเมจต่อลูก',orbSpd:'ลูกไฟวิญญาณ • ความเร็ว',
  dashT:'พุ่ง • ชาร์จนานสุด (วิ)',dashD0:'พุ่ง • ระยะต่ำสุด',dashD1:'พุ่ง • ระยะเพิ่มเมื่อชาร์จเต็ม',dashSp:'พุ่ง • ความเร็ว',dashCd:'พุ่ง • คูลดาวน์ (วิ)',pathT:'ทางไฟ • อยู่นาน (วิ)',pathW:'ทางไฟ • ความกว้าง',pathDps:'ทางไฟ • ดาเมจ/วิ'};
SPELLS.pyroball={id:'pyroball',hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');addBurn(t,1,pr.owner);const o=G.players[pr.owner];if(o)launchOrbs(o,t);}};
// ลูกไฟใหญ่ (Kindle): ระเบิดวง ~90 ตอนโดนตัวหรือพื้น — ทุกคนในวงโดน 20 +1 Burning
SPELLS.pyrobig={id:'pyrobig',hit(pr,t){}};
function pyroBigBoom(pr){
  const V=KINDLE.v;emit({k:'efx',z:'bigboom',x:pr.x,y:pr.y,h:pr.h,r:V.r});
  damageEnv(pr.x,pr.y,V.r,V.env,pr.owner,'fireblast',pr.h);
  const o=G.players[pr.owner];if(!o)return;
  let best=null,bd=1e9;
  for(const t of foesIn(pr.team,pr.x,pr.y,V.r,pr.h+3.5)){aoeHit(o,t,V.dmg,t=>addBurn(t,1,pr.owner));const d=Math.hypot(t.x-pr.x,t.y-pr.y);if(d<bd){bd=d;best=t;}}
  if(best)launchOrbs(o,best);
}
function pyroBall(p){shoot(p,'pfire',{sp:'pyroball',dmg:PYV.ballDmg,hand:1});}   // 2026-11-14: 12→20, charge 1.9→1.6 s
function pyroBasic(p,inp,dt,setCd){
  const prev=p.bfPrev;p.bfPrev=inp.fire;
  pyroFlickTick(p,dt);
  if(p.shieldOn||p.flLow>0){if(p.shieldOn&&inp.fire&&!prev)pyroFlick(p);p.chg=0;return;}   // ยกโล่ + คลิก = สะบัดวงไฟ
  if(p.dfall){if(p.dfall.ph===2&&inp.fire&&!prev)dragonfallDive(p);p.chg=0;return;}
  if(p.breath>0||p.snapT>0){p.chg=0;return;}
  if(inp.fire&&!prev){
    // Kindle: คลิก = ลูกไฟชาร์จเต็มทันที
    if(p.kindle>0&&p.cd.basic<=0){p.kindle--;if(!p.kindle){p.kindleT=0;p.hover=0;}shoot(p,'pfireb',{sp:'pyrobig',dmg:KINDLE.v.dmg,hand:1});setCd('basic',PYV.ballCd);p.chg=-1;return;}
    p.chg=0;
  }else if(inp.fire){if(p.chg>=0)p.chg=Math.min(PYV.chargeT,p.chg+dt);}
  else if(prev){
    // ปล่อยคลิก: แตะสั้น = ประกายไฟ / ชาร์จครบ 3 วิ = ลูกไฟ / ระหว่างนั้น = ไม่ยิง
    if(p.chg>=PYV.chargeT){pyroBall(p);setCd('basic',PYV.ballCd);}
    else if(p.chg>=0&&p.chg<0.25&&p.cd.basic<=0){shoot(p,'spark',{sp:'b_pyro',dmg:PYV.sparkDmg,hand:1});setCd('basic',PYV.sparkCd);}
    p.chg=0;
  }
}
// โล่สายไฟใหม่ (ผู้ใช้ 2026-11-11): ไม่มีลูกไฟวิญญาณแล้ว • ยกโล่ + คลิก = หมุนตัวครึ่งรอบ สะบัดวงไฟเกลียวออกรอบตัว
// ใช้ได้ flN ครั้ง คืนทีละครั้งทุก flCd วิ • โดน = ดาเมจ flDmg + ช้า flSlow ต่อครั้ง ซ้อนได้ flMax ครั้ง นาน flSlowT วิ • ระหว่างสะบัดโล่ลด flLow วิ
function pyroFlickTick(p,dt){if(p.flN===undefined){p.flN=PYV.flN;p.flT=0;}
  if(p.flLow>0){p.flLow-=dt;p.shieldOn=false;}if(p.flGapT>0)p.flGapT-=dt;
  if(p.flN<PYV.flN){p.flT+=dt;if(p.flT>=PYV.flCd){p.flT=0;p.flN++;}}else p.flT=0;}
function pyroFlick(p){if(!(p.flN>0)||p.flGapT>0)return;p.flN--;p.flGapT=PYV.flGap;p.flLow=PYV.flLow;p.shieldOn=false;
  emit({k:'efx',z:'pflick',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,id:p.id});
  for(const t of foesIn(p.team,p.x,p.y,PYV.flR,p.z+3.5)){const d=Math.hypot(t.x-p.x,t.y-p.y);
    G.strikes.push({t:Math.max(0.03,d/PYV.flR*PYV.flGrow),fn:()=>{if(t.dead||(!t.isE&&!t.isM&&(!t.alive||t.downed)))return;
      const n=t.flE>G.time?Math.min(PYV.flMax,(t.flS|0)+1):1;t.flS=n;t.flE=G.time+PYV.flSlowT;
      aoeHit(p,t,PYV.flDmg,q=>addSlow(q,1-PYV.flSlow*n,PYV.flSlowT));}});}}
// (เดิม) โล่สายไฟ: เก็บ "ลูกไฟวิญญาณ" (orb) หมุนรอบตัว — Parry +2 / บล็อกครบ 3 ครั้ง +2 / สูงสุด 4 (ลูกละ 5 — เนิร์ฟ 2026-10-27) ไม่หายจนกว่าจะใช้
function addOrbs(p,n){const was=p.orbs|0;p.orbs=Math.min(PYV.orbMax,was+n);if(p.orbs>was)emit({k:'efx',z:'orbget',x:p.x,y:p.y,h:p.z+1.2,id:p.id,n:p.orbs});}
function pyroParry(p){addOrbs(p,PYV.orbParry);}
function pyroBlock(p){p.orbBlk=(p.orbBlk|0)+1;if(p.orbBlk>=PYV.orbBlockN){p.orbBlk=0;addOrbs(p,PYV.orbBlock);}}
// ลูกไฟ (ชาร์จ/Kindle) โดนศัตรู = ปล่อยลูกไฟวิญญาณทั้งหมดพุ่งใส่เป้านั้น ลูกละ 10 • ทุก 2 ลูก = +1 Burning
function launchOrbs(p,t){
  const n=p.orbs|0;if(!n||!t)return;p.orbs=0;
  const d=Math.hypot(t.x-p.x,t.y-p.y),tt=Math.max(0.15,d/PYV.orbSpd);
  emit({k:'efx',z:'orbshot',x:p.x,y:p.y,h:p.z+1.3,x2:t.x,y2:t.y,h2:cH(t),n,t:Math.round(tt*100)/100});
  G.strikes.push({t:tt,fn:()=>{if(t.dead||(!t.isE&&!t.isM&&(!t.alive||t.downed)))return;aoeHit(p,t,PYV.orbDmg*n);emit({k:'efx',z:'orbhit',x:t.x,y:t.y,h:cH(t),n});}});
}
// คืนค่า true = กำลังชาร์จ (ขยับ/ยิง/ร่ายไม่ได้)
function pyroDash(p,inp,pr,dt,setCd){
  if(p.dchgOn){
    p.dchg=Math.min(PYV.dashT,p.dchg+dt);
    if(inp.dh)return true;
    p.dchgOn=false;
    // พุ่งไปตามทิศกล้อง/เป้าเล็งเสมอ (ไม่สน WASD)
    const dx=Math.cos(p.ang),dy=Math.sin(p.ang);
    const dist=PYV.dashD0+PYV.dashD1*p.dchg/PYV.dashT,sp=PYV.dashSp;
    p.dash=dist/sp;p.dashSp=sp;p.dashX=dx;p.dashY=dy;p.inv=p.dash+0.06;p.shieldOn=false;
    setCd('dodge',(PYV.dashCd+p.dash)*p.buffs.cdr);
    emit({k:'efx',z:'pboom',x:p.x-dx*24,y:p.y-dy*24,h:p.z+0.6,a:Math.atan2(dy,dx),n:Math.round(p.dchg/PYV.dashT*50)/10,id:p.id});
    emit({k:'dash',x:p.x,y:p.y});
    p.dchg=0;p.fpath={x:p.x,y:p.y};
    return false;
  }
  if(pr.sp&&p.cd.dodge<=0&&p.z<0.5){p.dchgOn=true;p.dchg=0;p.shieldOn=false;return true;}
  return false;
}
// ทางไฟจาก Dash (ผู้ใช้ 2026-10-22): ค้าง 3 วิ • ศัตรูเหยียบเข้า = burn +1 stack (ต่อการเข้า 1 ครั้ง) • ยืนบนทาง = 10 ดาเมจ/วิ
// ⚠ Claude เลือกเอง: กว้าง 1.5 ม. (ครึ่ง 15 px + ตัว) • เข้าซ้ำได้ stack ใหม่หลังออกไปแล้ว ≥1 วิ • ไม่โดนตัวเอง/ทีม • ลอยสูง >1.2 ม. ไม่โดน
function pyroPathEnd(p){
  const f=p.fpath;p.fpath=null;const len=Math.hypot(p.x-f.x,p.y-f.y);if(len<20||len>1300||!p.alive||p.downed)return;
  (G.fpaths||(G.fpaths=[])).push({x0:f.x,y0:f.y,x1:p.x,y1:p.y,t:PYV.pathT,tt:0.5,owner:p.id,team:p.team,on:new Map()});
  emit({k:'efx',z:'pfpath',x:Math.round(f.x),y:Math.round(f.y),h:groundH(f.x,f.y),a:Math.round(Math.atan2(p.y-f.y,p.x-f.x)*1000)/1000,len:Math.round(len),id:p.id});
}
function updateFirePaths(dt){
  if(!G.fpaths||!G.fpaths.length)return;
  for(const f of G.fpaths){
    f.t-=dt;f.tt-=dt;const tick=f.tt<=0;if(tick)f.tt=0.5;
    const dx=f.x1-f.x0,dy=f.y1-f.y0,L2=dx*dx+dy*dy||1;
    for(const t of foesOf(f.team)){
      const u=clamp(((t.x-f.x0)*dx+(t.y-f.y0)*dy)/L2,0,1),d=Math.hypot(t.x-(f.x0+dx*u),t.y-(f.y0+dy*u));
      const inside=d<PYV.pathW+(t.r||PR)*0.6&&(t.isE?(t.h||0):(t.z||0))<1.2&&!(t.inv>0);
      const last=f.on.get(t);
      if(inside){if(last===undefined||(last<0&&G.time+last>=1))addBurn(t,1,f.owner);f.on.set(t,1);if(tick)damage(t,PYV.pathDps*0.5,f.owner,'zone');}
      else if(last>0)f.on.set(t,-(G.time+0.001));
    }
  }
  G.fpaths=G.fpaths.filter(f=>f.t>0);
}


// =====================================================================
//  สายไฟ — ความร้อน: สะสมด้วยลูกไฟ/กำแพง/พุ่งเพลิง แล้วจุดระเบิดด้วยระเบิดความร้อน/อุกกาบาต
// =====================================================================
const KINDLE=defSpell(0,{id:'kindle',v:{shots:2,time:3,jump:15,push:1000,dmg:16,r:90,env:40},vn:{shots:'ลูกไฟใหญ่ได้กี่นัด',time:'ลอยนาน (วิ)',jump:'แรงกระโดด',push:'แรงพุ่งไปข้าง',dmg:'ลูกไฟใหญ่ • ดาเมจ',r:'ลูกไฟใหญ่ • รัศมีระเบิด',env:'ลูกไฟใหญ่ • ดาเมจใส่บ้าน/ของ'},role:'builder',n:'Kindle',ic:'🔥',cd:9,d:'กระโดดสูงไปทางที่กด WASD (ไม่กด = ถอยหลัง) ขึ้นกลางอากาศ แล้วลอยตกช้าๆ 3 วิ (แบบฟาราห์/เฟรย่า) • ยิงปกติ 2 นัดกลายเป็นลูกไฟใหญ่ทันที (16 ดาเมจ ระเบิดวงกว้าง ~90 +1 Burning ทุกคนในวง)',fx:'ยิงครบ 2 ลูกหรือครบ 3 วิ = ตกลงพื้นตามปกติ • ไฟพุ่งจากใต้เท้าตอนลอย',
  cast(p,S){const V=S.v;p.kindle=V.shots;p.kindleT=V.time;p.hover=V.time;p.vz=V.jump;{const i=p.inp||{};let dx=i.mx||0,dy=i.my||0;const l=Math.hypot(dx,dy);if(l>0.1){dx/=l;dy/=l;}else{dx=-Math.cos(p.ang);dy=-Math.sin(p.ang);}p.vx+=dx*V.push;p.vy+=dy*V.push;}p.shieldOn=false;emit({k:'efx',z:'kindle',x:p.x,y:p.y,h:p.z,id:p.id});}});
const DRAGONF=defSpell(0,{id:'dragonfall',v:{range:600,rise:6,fly:3,r:120,dmg:20,slow:0.7,slowT:1.2,burn:1,env:60},vn:{range:'ระยะเล็งจุดลง',rise:'บินสูง',fly:'บินนาน (วิ)',r:'รัศมีกระแทก',dmg:'ดาเมจกระแทก',slow:'ความเร็วคนโดน (เท่า)',slowT:'ช้านาน (วิ)',burn:'Burning ที่ใส่',env:'ดาเมจใส่บ้าน/ของ'},role:'builder',n:'Dragonfall',ic:'🐉',cd:13,d:'ทะยานขึ้นฟ้าด้วยเปลวไฟ แล้วบินควบคุมได้ 3 วิ (WASD เคลื่อนช้าๆ • Space ขึ้น / C ลง เล็กน้อย) — จุดที่เล็งคือจุดลง มีวงเตือนบนพื้นตามเป้าเล็งให้ทุกคนเห็น • คลิกยิง = ดิ่งกระแทกทันที • ครบ 3 วิ = ดิ่งลงจุดเล็งล่าสุดอัตโนมัติ',fx:'กระแทกวงรัศมี 120: 20 ดาเมจ +1 Burning + ช้าลง 30% 1.2 วิ (โดนครั้งเดียวต่อคน) • ไม่อมตะระหว่างบิน • โดนสตัน/แช่แข็งระหว่างบิน = ร่วงลงเฉยๆ ไม่กระแทก • ระหว่างบิน: ยิงปกติได้ แต่ใช้โล่/พุ่ง/คาถาอื่นไม่ได้',
  cast(p,S){
    if(p.dfall||p.colos>0)return false;
    const g0=groundH(p.x,p.y),q=aimPoint(p,S.v.range);
    p.dfall={ph:1,t:0.35,g0,H:g0+S.v.rise,tx:q.x,ty:q.y};
    p.shieldOn=false;p.dchgOn=false;p.hover=0;p.vz=0;
    emit({k:'efx',z:'dfrise',x:p.x,y:p.y,h:p.z,id:p.id});
  }});
// Dragonfall: 1 ย่อตัว+ทะยาน (0.35 วิ) → 2 บินควบคุมได้ 3 วิ (วงเตือนตามเป้าเล็ง • คลิกยิง = ดิ่งทันที) → 3 ดิ่งลงจุดเล็งล่าสุด (0.45 วิ) → กระแทก
function dragonfallDive(p){const D=p.dfall;D.ph=3;D.t=0.45;D.sx=p.x;D.sy=p.y;D.sz=p.z;emit({k:'efx',z:'dfdive',x:p.x,y:p.y,h:p.z,x2:Math.round(D.tx),y2:Math.round(D.ty),id:p.id});}
function dragonfallTick(p,inp,dt){
  const D=p.dfall;D.t-=dt;
  if(!p.alive||p.downed){p.dfall=null;return;}
  if(D.ph<3&&(p.stun>0||p.frz>0)){p.dfall=null;p.vz=0;emit({k:'efx',z:'dfcancel',x:p.x,y:p.y,h:p.z,id:p.id});return;}
  if(D.ph===1){if(D.t<0.25)p.z+=(D.H-p.z)*Math.min(1,14*dt);p.vz=0;if(D.t<=0){D.ph=2;D.t=DRAGONF.v.fly;}}
  else if(D.ph===2){
    D.H=clamp(D.H+((inp.jh?1:0)-(inp.ch?1:0))*2.5*dt,D.g0+4.5,D.g0+7.5);p.z+=(D.H-p.z)*Math.min(1,6*dt);p.vz=0;
    const q=aimClip(p.x,p.y,p.z,aimPoint(p,DRAGONF.v.range),PR+6);D.tx=q.x;D.ty=q.y;D.th=q.hit?q.h:null;   // ไม่ทะลุบ้าน
    if(D.t<=0)dragonfallDive(p);
  }else{
    const k=1-Math.max(0,D.t)/0.45,gh=D.th!=null?D.th:groundH(D.tx,D.ty);
    p.x=lerp(D.sx,D.tx,k);p.y=lerp(D.sy,D.ty,k);p.z=lerp(D.sz,gh,k*k);p.vz=0;
    if(D.t<=0){p.x=D.tx;p.y=D.ty;p.z=gh;p.dfall=null;dragonfallBoom(p,D.tx,D.ty,gh);}
  }
}
function dragonfallBoom(p,x,y,gh){
  const V=DRAGONF.v;emit({k:'efx',z:'dfboom',x:Math.round(x),y:Math.round(y),h:gh+0.08,r:V.r,id:p.id});
  for(const t of foesIn(p.team,x,y,V.r,gh+4))aoeHit(p,t,V.dmg,t=>{addBurn(t,V.burn,p.id);addSlow(t,V.slow,V.slowT);});
  damageEnv(x,y,V.r,V.env,p.id,'fireblast',gh);
}
const RINGE=defSpell(0,{id:'ringofembers',v:{range:400,r:170,time:3,delay:0.3,dmg:10,hitCd:0.5,edgeSlow:0.6,edgeT:0.4,push:280,wallH:3.6},vn:{range:'ระยะวาง',r:'รัศมีวง',time:'อยู่นาน (วิ)',delay:'อุกกาบาตตก (วิ)',dmg:'ดาเมจตอนพยายามออก',hitCd:'โดนซ้ำได้ทุก (วิ)',edgeSlow:'แตะขอบ • ความเร็ว (เท่า)',edgeT:'แตะขอบ • ช้านาน (วิ)',push:'แรงผลักกลับ',wallH:'ความสูงกำแพง (ม.)'},role:'control',n:'Ring of Embers',ic:'⭕',cd:14,d:'อุกกาบาตไฟตกลงที่จุดเล็ง (ระยะ ~400) ไม่มีดาเมจ แล้วกลายเป็นวงเพลิง (รัศมี ~170) นาน 3 วิ — คนข้างในเดินออกไม่ได้',fx:'พยายามเดินออก = 10 ดาเมจ + ผลักกลับเข้าวง • ใครแตะขอบวงไฟ = ช้าลง 40% • คนข้างนอกเดินเข้าได้ • กำแพงมีความสูง: บินสูงกว่ากำแพงออกได้',
  cast(p,S){
    const V=S.v,q=aimPoint(p,V.range);
    // อุกกาบาตไฟตกลงจุดที่วาง ~0.3 วิ → ตกถึงพื้น = 10 ดาเมจครั้งเดียว (ผู้เล่นสั่ง 2026-10-19) แล้ววงไฟค่อยเริ่ม (กับดักเริ่มช้าลง 0.3 วิ)
    (G.erings||(G.erings=[])).push({x:q.x,y:q.y,z:groundH(q.x,q.y),r:V.r,t:V.time,del:V.delay,owner:p.id,team:p.team,in:new Set(),cd:new Map(),ed:new Map()});
    emit({k:'efx',z:'ermet',x:q.x,y:q.y,h:0.2,r:V.r,t:V.delay,id:p.id});
  }});
const BLAZEF=defSpell(0,{id:'blazeform',v:{time:4,dmgUp:1.15,spdUp:1.25,taken:1.25,r:130,aura:1.05,burn:1},vn:{time:'อยู่นาน (วิ)',dmgUp:'ดาเมจเรา (เท่า)',spdUp:'เดินเร็ว (เท่า)',taken:'รับดาเมจ (เท่า)',r:'รัศมีออร่า',aura:'ออร่า • ดาเมจทุก 0.5 วิ',burn:'ออร่า • Burning ครั้งแรก'},role:'utility',n:'Blazeform',ic:'🔥',cd:20,d:'กลายร่างเปลวไฟ 4 วิ: ดาเมจทุกสกิล (รวมเผา Burning) +15% • เดินเร็ว +25% • ออร่าไฟรอบตัว (รัศมี ~130) เผา ~2.4/วิ • ศัตรูที่โดนออร่าครั้งแรก +1 Burning (คนละ 1 ชั้นต่อการใช้ 1 ครั้ง)',fx:'ผลเสีย: เรารับดาเมจ +25% ระหว่างนั้น',
  cast(p,S){p.blaze=S.v.time;p.blzTk=0;p.blzN=0;p.blzHit=new Set();emit({k:'efx',z:'blaze',x:p.x,y:p.y,h:p.z+1,id:p.id});}});
const SNAP=defSpell(0,{id:'ignitionsnap',v:{range:500,windup:0.6,dmg:15,heal:8},vn:{range:'ระยะ',windup:'ท่าเตรียม (วิ)',dmg:'ดาเมจต่อชั้น Burning',heal:'ฮีลต่อชั้น Burning'},role:'finisher',n:'Ignition Snap',ic:'🫰',cd:15,d:'ท่าเตรียม 0.6 วิ แล้วดีดนิ้ว: ศัตรูทุกคนที่มี Burning ในระยะ 500 ระเบิดพร้อมกัน (ไม่ต้องเล็ง)',fx:'15 ดาเมจต่อ 1 ชั้น Burning (5 ชั้น = 75) และฮีลเรา 8 ต่อชั้น แล้วใช้ Burning หมด • ไม่มีใครติดไฟในระยะ = ไม่เสียคูลดาวน์',
  cast(p,S){
    if(!foesOf(p.team).some(t=>t.brn>0&&Math.hypot(t.x-p.x,t.y-p.y)<S.v.range))return false;
    p.snapT=S.v.windup;emit({k:'efx',z:'snapwind',x:p.x,y:p.y,h:p.z+1.4,id:p.id});
  }});
const COLOS=defSpell(0,{id:'colossus',v:{time:6,shots:3,gap:1,dmg:80,r:200,burn:3,range:1000,env:100},vn:{time:'ร่างยักษ์อยู่นาน (วิ)',shots:'ยิงได้กี่นัด',gap:'เว้นระหว่างนัด (วิ)',dmg:'ดาเมจต่อนัด',r:'รัศมีระเบิด',burn:'Burning ที่ใส่',range:'ระยะยิง',env:'ดาเมจใส่บ้าน/ของ'},role:'ult',n:'Inferno Colossus',ic:'👹',cd:0,ult:true,d:'เวทโบราณสายไฟ: กระโดดขึ้นฟ้าทันที ร่างยักษ์ไฟปรากฏกลางอากาศ 6 วิ (Space = ขึ้น / Ctrl หรือ C = ลง) ถือหน้าไม้ไฟ ยิงได้ 3 นัด (เว้น 1 วิ) นัดละ 80 ดาเมจ ระเบิดวง ~200',fx:'คนโดน +3 Burning และ Extreme Burning (8/วิ 5 วิ) • ลอยเคลื่อนที่ได้ช้า โดนยิงได้ปกติ • ยิงครบ 3 นัด = ร่างหาย',
  cast(p,S){p.colos=S.v.time;p.colN=S.v.shots;p.colCd=0.6;p.colH=9;p.vz=0;p.fly=false;p.shieldOn=false;p.dchgOn=false;p.breath=0;emit({k:'efx',z:'colossus',x:p.x,y:p.y,h:p.z,id:p.id});}});
function pyroSnap(p){
  emit({k:'efx',z:'snap',x:p.x,y:p.y,h:p.z+1.6,id:p.id});
  for(const t of foesOf(p.team)){
    if(!(t.brn>0)||Math.hypot(t.x-p.x,t.y-p.y)>SNAP.v.range)continue;
    const n=t.brn|0;
    if(aoeHit(p,t,SNAP.v.dmg*n)){t.brn=0;t.brnT=0;healT(p,SNAP.v.heal*n);}   // เนิร์ฟ 2026-10-27 (ผู้ใช้): 25→20→16→15 ดาเมจ, ฮีล 20→10→8 ต่อชั้น
    emit({k:'efx',z:'snapboom',x:t.x,y:t.y,h:cH(t),n});
  }
}
// อัลติ: ลอย/ยิงหน้าไม้ไฟ (คลิกซ้าย) • ใช้แทนการยิงปกติ/โล่/พุ่ง/คาถาระหว่างร่างยักษ์
function colossusTick(p,inp,dt){
  const V=COLOS.v;p.colCd-=dt;
  if(!inp.fire||p.colCd>0||!(p.colN>0))return;
  let q=null,bs=1e9;
  for(const t of foesOf(p.team)){const dx=t.x-p.x,dy=t.y-p.y,dd=Math.hypot(dx,dy);if(dd>V.range||dd<1)continue;const da=Math.abs(angDiff(Math.atan2(dy,dx),p.ang));if(da<0.3&&da+dd/4000<bs){bs=da+dd/4000;q={x:t.x,y:t.y};}}
  if(!q){const r=aimRay3(p,p.z+4.2,V.range);if(r){q=r;q.free=1;}}   // ไม่ล็อกศัตรู = ยิงตามเป้ากลางจอ 3 มิติ (ชนพื้น/บ้าน/สุดระยะกลางอากาศ)
  if(!q){const ap=(inp.ap||0),H=p.z+4;let d=V.range;if(ap<-0.03)d=Math.min(V.range,H*20/Math.tan(-ap));d=Math.max(120,d);q={x:p.x+Math.cos(p.ang)*d,y:p.y+Math.sin(p.ang)*d};}
  q.x=clamp(q.x,40,MW-40);q.y=clamp(q.y,40,MH-40);
  if(!q.free){const c=aimClip(p.x,p.y,p.z+4.2,q,0);q.x=c.x;q.y=c.y;q.h=c.hit?c.h:groundH(q.x,q.y);}   // ชนบ้านก่อน = ระเบิดที่ผนัง
  p.colN--;p.colCd=V.gap;
  const fx=p.x+Math.cos(p.ang)*30,fy=p.y+Math.sin(p.ang)*30,tt=Math.hypot(q.x-fx,q.y-fy,(q.h-p.z-4.2)*20)/1800+0.08,qh=Math.round(q.h*10)/10;
  emit({k:'efx',z:'colbolt',x:fx,y:fy,h:p.z+4.2,x2:q.x,y2:q.y,h2:qh,t:tt,id:p.id});
  G.strikes.push({x:q.x,y:q.y,r:V.r,t:tt,fn:s=>{
    emit({k:'efx',z:'colboom',x:s.x,y:s.y,h:qh+0.3,r:V.r});
    for(const t of foesIn(p.team,s.x,s.y,V.r,q.h+6))if((t.isE?(t.h||0):(t.z||0))>q.h-6)aoeHit(p,t,V.dmg,t=>{addBurn(t,V.burn,p.id);addXBurn(t,p.id);});
    damageEnv(s.x,s.y,V.r,V.env,p.id,'fireblast',q.h);   // พังบ้าน/ลัง
  }});
  if(p.colN<=0)p.colos=Math.min(p.colos,0.5);
}
function updateERings(dt){
  if(!G.erings||!G.erings.length)return;
  const V=RINGE.v;for(const R of G.erings){
    if(R.del>0){R.del-=dt;if(R.del>0)continue;
      // อุกกาบาตไม่มีดาเมจแล้ว (ผู้ใช้ 2026-10-27) — ดาเมจมีแค่ตอนพยายามเดินออก (10)
      emit({k:'efx',z:'ering',x:R.x,y:R.y,h:0.2,r:R.r,t:R.t});continue;}
    R.t-=dt;
    for(const t of foesOf(R.team)){
      const dx=t.x-R.x,dy=t.y-R.y,d=Math.hypot(dx,dy)||1,tr=t.r||PR;
      // วงไฟมีผลแค่ระดับพื้น: สูงเกินกำแพง = ไม่โดนและหลุดจากการกักขัง (ผู้ใช้ 2026-11-09)
      if((t.isE?(t.h||0):(t.z||0))-R.z>=V.wallH){R.in.delete(t);continue;}
      // แตะขอบวงไฟ: ช้าลง (ไม่ใส่ Burning แล้ว — ผู้เล่นปรับ 2026-10-18)
      if(Math.abs(d-R.r)<26+tr*0.6&&!(!t.isE&&!t.isM&&t.inv>0)){addSlow(t,V.edgeSlow,V.edgeT);}
      if(d<R.r-tr*0.5){R.in.add(t);continue;}
      if(!R.in.has(t))continue;
      // อยู่ข้างในแล้วพยายามออก: ผลักกลับเข้าวง
      const m=R.r-tr*0.5-4;t.x=R.x+dx/d*m;t.y=R.y+dy/d*m;t.vx=-dx/d*V.push;t.vy=-dy/d*V.push;if(t.dash>0)t.dash=0;
      if(!(R.cd.get(t)>G.time)&&!(!t.isE&&!t.isM&&t.inv>0)){R.cd.set(t,G.time+V.hitCd);damage(t,V.dmg,R.owner,'zone');emit({k:'efx',z:'eringhit',x:t.x,y:t.y,h:cH(t)});}
    }
  }
  G.erings=G.erings.filter(R=>R.t>0);
}
