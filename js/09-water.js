// =====================================================================
//  สายน้ำ 💧 (ผู้ใช้ออกแบบทั้งหมด — designs/water.md) • ฝั่งโฮสต์ • รอบแรก: ระบบเกมก่อน ภาพชั่วคราว (2026-10-31)
//  เล่นง่าย: BA ตวัดไม้สร้างเส้นน้ำยิง 3 นัด • โล่ฟองน้ำฮีลจากเกจ 70 • Dash จมดินทิ้งร่างโคลน กดอีกที = กลับ
//  สกิล: Riptide คลื่นพัด • Tidecaller Orb ลูกผู้ช่วยยิงตามเมื่อเราตีโดน • Aqua Cage ฟองขัง • Abyssal Beam ลำน้ำ 2.2 วิ
//        Moonwater Arts BA เป็นลำน้ำ 8 วิ • อัลติ Dragon of the Deep มังกรน้ำพุ่งลงพื้นที่
// =====================================================================
const WATERP=PATHS.length;
// ตัวเลขทั้งหมดของสายน้ำ: WAV = PATHS[WATERP].v (เส้นน้ำ/โล่ฟองน้ำ/Dash) + v:{...} ของแต่ละสกิล (WT_RP WT_FM WT_CG WT_AB WT_MW WT_UL = S.v) — ปรับได้ใน tune.html / F8 (js/73-tune.js)
PATHS.push({id:'water',n:'สายน้ำ',ic:'💧',col:'#4fc3ff',d:'เล่นง่าย — ยิงน้ำไกล คลื่นผลัก ฮีลตัวเองด้วยโล่ เคลื่อนที่ไหลลื่นด้วยร่างโคลน',
  combo:'Aqua Cage ขังศัตรู 2 วิ → Abyssal Beam / ลำน้ำ Moonwater ใส่เต็มๆ • Tidecaller Orb ยิงตามทุกครั้งที่เราตีโดน (คู่กับลำน้ำ = ยิงรัว) • Riptide พัดศัตรูออก • Dash ร่างโคลน หนีแล้วกลับที่เดิมได้'});
const WAV=PATHS[WATERP].v={baCd:1.0,baN:3,baT0:0,baGap:0.08,baDmg:5,baSpd:2800,baRange:750,baSpr:0.06,shGauge:70,shHeal:6,shReg:3,
  dsDist:300,dsSink:0.35,dsR:120,dsPush:900,dsBack:6,dsCd:8};
PATHS[WATERP].vn={baCd:'เส้นน้ำ • ตวัดทุก (วิ)',baN:'เส้นน้ำ • จำนวนนัด',baT0:'เส้นน้ำ • นัดแรกออกหลัง (วิ)',baGap:'เส้นน้ำ • ห่างแต่ละนัด (วิ)',baDmg:'เส้นน้ำ • ดาเมจต่อนัด',baSpd:'เส้นน้ำ • ความเร็วกระสุน',baRange:'เส้นน้ำ • ระยะ',baSpr:'เส้นน้ำ • กระจาย (เรเดียน)',
  shGauge:'โล่ฟองน้ำ • เกจฮีลเต็ม',shHeal:'โล่ฟองน้ำ • ฮีลต่อวิ',shReg:'โล่ฟองน้ำ • เกจคืนต่อวิ',
  dsDist:'Dash • ระยะโผล่',dsSink:'Dash • จมดิน (วิ)',dsR:'Dash • รัศมีผลักตอนโผล่',dsPush:'Dash • แรงผลัก',dsBack:'Dash • กดกลับร่างโคลนได้ (วิ)',dsCd:'Dash • คูลดาวน์ (วิ)'};
Object.assign(PDEF,{wdrop:{spd:WAV.baSpd,r:8,dmg:WAV.baDmg,life:WAV.baRange/WAV.baSpd,col:'#7fdcff'}});
const wtOn=p=>p&&p.pathIdx===WATERP;
const WT_BEAM_H=1.3;
function waterBeamPitch(p,x=p.x,y=p.y,h=p.z+WT_BEAM_H){
  const i=p.inp;
  if(!Number.isFinite(i?.ah)||!Number.isFinite(i.ax)||!Number.isFinite(i.ay))return clamp(i?.ap||0,-1.5,1.5);
  return clamp(Math.atan2((i.ah-h+terrT(p.x,p.y)-terrT(x,y))*20,
    Math.hypot(i.ax-x,i.ay-y)),-1.5,1.5);
}
function waterBeamTarget(t,b){
  const c=Math.cos(b.a),s=Math.sin(b.a),dx=t.x-b.x,dy=t.y-b.y;
  const flat=dx*c+dy*s,up=(cH(t)+terrT(t.x,t.y)-b.h-terrT(b.x,b.y))*20;
  const cp=Math.cos(b.pt),sp=Math.sin(b.pt),d=flat*cp+up*sp;
  if(d<0||d>b.L||Math.abs(dy*c-dx*s)>b.w+(t.r||PR)||Math.abs(up*cp-flat*sp)>b.w+vR(t)*20)return Infinity;
  return d;
}
function waterBeamWindLimit(b,len){
  const flat=len*Math.cos(b.pt),x=b.x+Math.cos(b.a)*flat,y=b.y+Math.sin(b.a)*flat;
  const hit=windRay(b.team,b.x,b.y,x,y,0,b.h,b.h+Math.sin(b.pt)*len/20);
  return hit?len*hit.u:len;
}

// ---------- ทุกเฟรมของผู้เล่นสายน้ำ (เรียกจาก updatePlayer หลังส่วนโล่) ----------
function waterTick(p,dt){
  if(p.wcCharge){
    if(p.stun>0||p.sil>0)p.wcCharge=0;
    else if((p.wcCharge+=dt)>=WT_CG.charge)waterCageLaunch(p);
  }
  if(p.whg===undefined)p.whg=WAV.shGauge;
  // โล่ฟองน้ำ: ฮีลจากเกจ • ไม่ยกโล่ = เกจคืน
  if(p.shieldOn&&p.whg>0&&p.hp<p.maxHp){const u=Math.min(p.whg,WAV.shHeal*dt);p.whg-=u;p.whA=(p.whA||0)+u;if(p.whA>=1){healT(p,Math.floor(p.whA));p.whA-=Math.floor(p.whA);}}
  else if(!p.shieldOn)p.whg=Math.min(WAV.shGauge,p.whg+WAV.shReg*dt);
  if(p.wln)waterLineTick(p,dt);
  if(p.wtsk)waterSinkTick(p,dt);
  if(p.wcl&&!p.wtsk){p.wcl.t-=dt;if(p.wcl.t<=0||!p.alive){p.wcl=null;p.cd.dodge=p.cdMax.dodge=WAV.dsCd*p.buffs.cdr;emit({k:'efx',z:'wtclend',x:p.x,y:p.y,id:p.id});}}
  if(p.wmsT>0)p.wmsT-=dt;
  if(p.wfam>0){p.wfam-=dt;if(p.wfam<=0||!p.alive){p.wfam=0;emit({k:'efx',z:'wtfamoff',x:p.x,y:p.y,id:p.id});}}
  if(p.wmw>0){p.wmw-=dt;if(p.wmw<=0)emit({k:'efx',z:'wtmwoff',x:p.x,y:p.y,id:p.id});}
  if(p.wab)waterBeamTick(p,dt);
  if(p.wdg)waterDragonTick(p,dt);
}
// ยืนนิ่ง: จมดิน / ร่าย-ยิง Abyssal Beam
function waterSpd(p){return p.wtsk||p.wab?0:p.wmsT>0?WT_MW.slow:1;}
const waterCageBusy=p=>!!(p.wcCharge||p.wcOrb&&!p.wcOrb.dead);
function waterReset(p){if(p.wcOrb)p.wcOrb.dead=true;p.wcOrb=null;p.wcCharge=0;p.wln=null;p.wtsk=null;p.wcl=null;p.wfam=0;p.wmw=0;p.wmb=null;p.wab=null;p.wdg=null;p.wmsT=0;p.whg=WAV.shGauge;p.whA=0;}

function waterCageLaunch(p){
  p.wcCharge=0;
  const V=WT_CG,a=p.ang,h=p.z+1.45,pt=waterBeamPitch(p,p.x,p.y,h);
  const pr=shoot(p,'wcage',{sp:'aquacage',spd:V.spd,r:V.r,dmg:V.dmg,life:V.range/V.spd,quiet:1,h,cageYaw:a,cagePitch:pt});
  p.wcOrb=pr;
  waterCageSteer(pr,0);
  emit({k:'efx',z:'wtcagetoss',x:pr.x,y:pr.y,h:pr.h,id:p.id});
}
function waterCageSteer(pr,dt){
  const p=G.players[pr.owner],i=p?.inp,V=WT_CG;
  // ผู้ใช้ 2026-11-15: กดคลิกซ้ายค้าง = คุมลูกเลี้ยวตามเมาส์ • ปล่อย = ลูกพุ่งตรงไปทางเมาส์ตอนนั้นเลย แล้วเราเป็นอิสระ
  if(!pr.cageFree&&(pr.cgT=(pr.cgT||0)+dt)>0.12&&p&&!i?.fire){pr.cageFree=true;if(Number.isFinite(i?.ax)){const dx=i.ax-pr.x,dy=i.ay-pr.y,dz=(i.ah+terrT(p.x,p.y)-pr.h-terrT(pr.x,pr.y))*20;pr.cageYaw=Math.atan2(dy,dx);pr.cagePitch=clamp(Math.atan2(dz,Math.hypot(dx,dy)),-1.45,1.45);}if(p.wcOrb===pr)p.wcOrb=null;emit({k:'efx',z:'wtcagefree',x:pr.x,y:pr.y,h:pr.h,id:p.id});}
  if(pr.cageFree){}
  else if(p?.alive&&!(p.stun>0)&&Number.isFinite(i?.ax)&&Number.isFinite(i.ay)&&Number.isFinite(i.ah)){
    const dx=i.ax-pr.x,dy=i.ay-pr.y,dz=(i.ah+terrT(p.x,p.y)-pr.h-terrT(pr.x,pr.y))*20;
    const c=Math.cos(pr.cageYaw),s=Math.sin(pr.cageYaw),cp=Math.cos(pr.cagePitch),sp=Math.sin(pr.cagePitch);
    if(dx*c*cp+dy*s*cp+dz*sp>10){
      const yaw=angDiff(Math.atan2(dy,dx),pr.cageYaw);
      const pitch=clamp(Math.atan2(dz,Math.hypot(dx,dy)),-1.45,1.45)-pr.cagePitch;
      const step=Math.min(1-Math.exp(-dt/Math.max(0.01,V.response)),V.turn*dt/(Math.hypot(yaw,pitch)||1));
      pr.cageYaw+=yaw*step;pr.cagePitch+=pitch*step;
    }
  }
  const flat=V.spd*Math.cos(pr.cagePitch);
  pr.vx=Math.cos(pr.cageYaw)*flat;pr.vy=Math.sin(pr.cageYaw)*flat;pr.vh=V.spd*Math.sin(pr.cagePitch)/20;
}

// ---------- BA: สะบัดไม้ → ยิงเข็มน้ำ 3 นัดทันที ห่างกันนิดเดียว ตามเมาส์ (ผู้ใช้ 2026-11-08: ไม่มีเส้นน้ำแล้ว) • Moonwater = ลำน้ำ ----------
const WT_BA_SIDE=12,WT_BA_H=1.15;   // กระสุนเกิดขวามือ 0.6 ม. สูง 1.15 ม. (ตรงปลายไม้ในท่าแทง)
function waterBasic(p,inp,dt,setCd){
  if(p.wdg&&p.wdg.ph==='aim')return;   // อัลติ: คลิกซ้าย = เลือกจุด
  if(p.wab)return;
  if(!inp.fire||p.cd.basic>0)return;
  if(p.wmw>0){waterMoonBeam(p);setCd('basic',WT_MW.rate);return;}
  p.wln={t:0,n:0};setCd('basic',WAV.baCd);
  emit({k:'efx',z:'wtslash',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,id:p.id});}
function waterLineTick(p,dt){const L=p.wln;L.t+=dt;
  if(!p.alive||p.stun>0){p.wln=null;return;}
  while(L.n<WAV.baN&&L.t>=WAV.baT0+L.n*WAV.baGap){const a=p.ang;L.n++;
    Object.assign(PDEF.wdrop,{spd:WAV.baSpd,life:WAV.baRange/WAV.baSpd});const pr=shoot(p,'wdrop',{sp:'b_water',dmg:WAV.baDmg,quiet:1});
    // ออกจากฝั่งไม้คทา (ขวามือ) แล้วเล็งเข้าหาจุด crosshair จากตรงนั้น + กระจายนิด ๆ (ไม่เกาะกลุ่ม)
    pr.x+=-Math.sin(a)*WT_BA_SIDE;pr.y+=Math.cos(a)*WT_BA_SIDE;
    let b=a;if(p.inp&&typeof p.inp.ah==='number'&&!p.bot&&Math.hypot(p.inp.ax-pr.x,p.inp.ay-pr.y)>60)b=Math.atan2(p.inp.ay-pr.y,p.inp.ax-pr.x);
    b+=rnd(-WAV.baSpr,WAV.baSpr);const sp=Math.hypot(pr.vx,pr.vy);pr.vx=Math.cos(b)*sp;pr.vy=Math.sin(b)*sp;
    pr.h=p.z+WT_BA_H;if(p.inp&&typeof p.inp.ah==='number'&&!p.bot){const dd=Math.max(60,Math.hypot(p.inp.ax-pr.x,p.inp.ay-pr.y));pr.vh=clamp((p.inp.ah-pr.h)/(dd/sp),-sp/5,sp/5);}}
  if(L.n>=WAV.baN&&L.t>=WAV.baT0+WAV.baN*WAV.baGap)p.wln=null;}
function waterMoonBeam(p){const a=p.ang,pt=waterBeamPitch(p);p.wmsT=WT_MW.slowT;
  const b={o:p.id,team:p.team,x:p.x,y:p.y,h:p.z+WT_BEAM_H,a,pt,t:0,k:0,len:WT_MW.len,w:WT_MW.w,life:WT_MW.life,tick:WT_MW.tick,dmg:WT_MW.dmg};
  (G.wtb||(G.wtb=[])).push(b);p.wmb=b;
  emit({k:'efx',z:'wtmb',x:p.x,y:p.y,h:p.z,a,pt,id:p.id});}

// ---------- Dash: จมดิน ทิ้งร่างโคลน → โผล่ห่าง 300 ทิศที่หัน • 6 วิกดอีกที = กลับไปที่โคลน ----------
function waterDash(p,inp,pr,dt,setCd){
  if(!pr.sp||p.wtsk||p.wab)return false;
  if(p.wcl){const c=p.wcl;p.wtsk={t:WAV.dsSink,x:c.x,y:c.y,back:1};p.inv=WAV.dsSink+0.05;p.shieldOn=false;
    emit({k:'efx',z:'wtsink',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id,n:1});return false;}
  if(p.cd.dodge>0)return false;
  const a=p.ang;let x=p.x+Math.cos(a)*WAV.dsDist,y=p.y+Math.sin(a)*WAV.dsDist;x=Math.max(30,Math.min(MW-30,x));y=Math.max(30,Math.min(MH-30,y));
  p.wcl={x:p.x,y:p.y,t:WAV.dsBack};p.wtsk={t:WAV.dsSink,x,y,back:0};p.inv=WAV.dsSink+0.05;p.shieldOn=false;setCd('dodge',WAV.dsBack+WAV.dsSink);
  emit({k:'efx',z:'wtsink',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id,n:0});
  return false;}
// p.wtsk = จังหวะดำน้ำของ Dash สายน้ำ (เดิมชื่อ p.wsk ชนกับตัวจับเวลา Wind Push ของสายลม = ตัวเลข → host พังทุกเฟรม เกมค้างทั้งห้อง, ผู้ใช้ 2026-11-09)
function waterSinkTick(p,dt){const S=p.wtsk;S.t-=dt;p.vx=p.vy=0;if(S.t>0)return;
  p.wtsk=null;p.x=S.x;p.y=S.y;collideWorld(p,PR);p.z=Math.max(p.z,groundH(p.x,p.y,p.z));
  for(const t of foesOf(p.team))if(Math.hypot(t.x-p.x,t.y-p.y)<WAV.dsR+(t.r||PR))knock(t,p.x,p.y,WAV.dsPush);   // ผลักรอบตัว ไม่มีดาเมจ
  if(S.back){p.wcl=null;p.cd.dodge=p.cdMax.dodge=WAV.dsCd*p.buffs.cdr;}
  emit({k:'efx',z:'wtpop',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id,n:S.back});}

// ---------- ดาเมจใดๆ ของเรา → ลูกผู้ช่วยยิงตาม (เรียกจาก damage() ใน js/12) ----------
function waterOnHit(src,t,kind){if(!(src.wfam>0)||kind==='wfam'||t===src||(t.team!==undefined&&t.team===src.team))return;
  (G.wtf||(G.wtf=[])).push({o:src.id,t,x:src.x,y:src.y,h:src.z+2.1,id:++G.zid});}
function waterFamTick(f,dt){const o=G.players[f.o],t=f.t;if(!o||!t||t.dead||t.alive===false)return false;
  const dx=t.x-f.x,dy=t.y-f.y,dh=cH(t)-f.h,d=Math.hypot(dx,dy,dh*20)||1,st=WT_FM.spd*dt;
  if(d<=st+(t.r||PR)*0.5){damage(t,WT_FM.dmg,o.id,'wfam');emit({k:'efx',z:'wtfamhit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),id:o.id});return false;}   // ล็อกเป้า โดน 100%
  f.x+=dx/d*st;f.y+=dy/d*st;f.h+=dh*20/d*st/20;return true;}

// ---------- Riptide: คลื่นยักษ์วิ่งไปข้างหน้า พัดศัตรูติดไปจนสุดทาง ----------
function waterWaveTick(w,dt){w.t+=dt;const p=G.players[w.o],k=Math.min(1,w.t/WT_RP.t),d=WT_RP.len*k,ca=Math.cos(w.a),sa=Math.sin(w.a),fx=w.x+ca*d,fy=w.y+sa*d;
  if(p)for(const t of foesOf(w.team)){if(w.c.has(t))continue;const dx=t.x-w.x,dy=t.y-w.y,u=dx*ca+dy*sa;if(u<-10||u>d+10)continue;
    if(Math.abs(-dx*sa+dy*ca)>WT_RP.w+(t.r||PR)||cH(t)>(w.h+5))continue;if(aoeHit(p,t,WT_RP.dmg,null))w.c.set(t,-dx*sa+dy*ca);else w.c.set(t,null);}
  for(const [t,s] of w.c){if(s===null||t.dead||t.alive===false)continue;t.x=fx-sa*s;t.y=fy+ca*s;t.vx=t.vy=0;t.wpush=0.3;}   // ติดไปกับหน้าคลื่น
  if(k<1)return true;
  for(const [t,s] of w.c)if(s!==null){t.vx=ca*WT_RP.out;t.vy=sa*WT_RP.out;}
  return false;}

// ---------- Abyssal Beam: ร่าย 1.5 วิ → ยิงลำน้ำ 2.2 วิ (ยืนนิ่ง ลอยนิดหน่อย หมุนตามเมาส์ช้าๆ) ----------
// ระยะก่อนชนกำแพง/หิน/ตึก (เงื่อนไขเดียวกับกระสุน updateProjectiles) • ชนแล้วลำหยุดตรงนั้น
function waterBeamStop(b){const c=Math.cos(b.a)*Math.cos(b.pt),s=Math.sin(b.a)*Math.cos(b.pt),rise=Math.sin(b.pt)/20;
  const max=waterBeamWindLimit(b,WT_AB.len),h0=b.h+terrT(b.x,b.y);
  for(let d=8;d<max;d+=8){const x=b.x+c*d,y=b.y+s*d,hh=h0+rise*d-terrT(x,y);
    if(x<40||x>MW-40||y<40||y>MH-40||hh<=0||(TERR&&terrSolid(x,y,hh)))return d;
    for(const o of sgNear(sgObs(),x,y,8,_sgPO))if(o.bi===undefined&&!(o.bot!==undefined&&hh<o.bot)&&(o.top!==undefined?h0+rise*d<o.top:hh<o.hgt)&&(x-o.x)**2+(y-o.y)**2<(o.r+8)**2)return d;
    if(BLDG.length)for(const b of sgNear(sgBld(),x,y,8,_sgPB))if(bldNear(b,x,y,8)&&bldPieceAt(b,x,y,hh,8)>=0)return d;
    for(const w of G.walls)if(b.team!==w.team&&hh<w.hgt&&(x-w.x)**2+(y-w.y)**2<(w.r+8)**2)return d;
    if(citySolidAt(x,y,hh))return d;}
  return max;}
function waterBeamTick(p,dt){const B=p.wab;B.t-=dt;
  if(!p.alive||p.stun>0){p.wab=null;emit({k:'efx',z:'wtaboff',x:p.x,y:p.y,id:p.id});return;}
  p.wflt=0.2;p.wfz=WT_AB.lift;
  const i=p.inp,want=Number.isFinite(i?.ax)&&Number.isFinite(i.ay)?Math.atan2(i.ay-p.y,i.ax-p.x):p.ang;
  const da=angDiff(want,B.a),dp=waterBeamPitch(p)-B.pt;
  const step=Math.min(1,WT_AB.turn*dt/(Math.hypot(da,dp)||1));
  B.a=angDiff(B.a+da*step,0);B.pt+=dp*step;p.ang=B.a;
  p.ang=B.a;
  if(B.ph==='cast'){if(B.t<=0){B.ph='fire';B.t=WT_AB.t;B.k=0;emit({k:'efx',z:'wtab',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(B.a*100)/100,id:p.id,n:1});}return;}
  // ไม่ทะลุ: ลำหยุดที่คนแรกในแนว โดนแค่คนนั้น (ผู้ใช้ 2026-11-01)
  Object.assign(B,{x:p.x,y:p.y,h:p.z+WT_BEAM_H,team:p.team,w:WT_AB.w});
  let first=null;B.L=waterBeamStop(B);
  for(const t of foesOf(p.team)){const d=waterBeamTarget(t,B);if(d<B.L){B.L=d;first=t;}}
  const elapsed=WT_AB.t-B.t,interval=Math.max(0.01,WT_AB.tick);
  // ฮิตแรกทันที ฮิตที่ตรงกับเวลาปิดลำไม่นับ
  while(B.k*interval<WT_AB.t-1e-6&&B.k*interval<=elapsed+1e-6){
    B.k++;
    if(first){const L3=WT_AB.len/3,dd=B.L,dm=dd<L3?WT_AB.dmg:dd<L3*2?7:5;aoeHit(p,first,dm,null);   // ยิ่งไกลยิ่งเบา 10/7/5 (ผู้ใช้ 2026-11-15)
      emit({k:'efx',z:'wtabhit',x:Math.round(first.x),y:Math.round(first.y),h:cH(first)});}
  }
  if(B.t<=1e-6){p.wab=null;emit({k:'efx',z:'wtaboff',x:p.x,y:p.y,id:p.id});}}
// ลำน้ำ Moonwater หันตามเป้าทันทีตลอดจังหวะยิง
function waterMBTick(b,dt){b.t+=dt;b.k-=dt;const p=G.players[b.o];
  if(p?.alive&&p.wmb===b&&Number.isFinite(p.inp?.ax)&&Number.isFinite(p.inp.ay)){
    b.a=Math.atan2(p.inp.ay-b.y,p.inp.ax-b.x);b.pt=waterBeamPitch(p,b.x,b.y,b.h);
  }
  if(b.k<=0&&p){b.k+=b.tick;b.L=waterBeamWindLimit(b,b.len);for(const t of foesOf(b.team))if(waterBeamTarget(t,b)<Infinity)aoeHit(p,t,b.dmg,null);}
  if(b.t>=b.life-1e-6&&p?.wmb===b)p.wmb=null;
  return b.t<b.life-1e-6;}

// ---------- อัลติ Dragon of the Deep ----------
function waterDragonTick(p,dt){const D=p.wdg;D.t-=dt;const inp=p.inp||{};
  if(!p.alive){p.wdg=null;return;}
  if(D.ph==='intro'){if(D.t<=0){D.ph='aim';D.t=WT_UL.aim;D.f0=!!inp.fire;emit({k:'efx',z:'wtdgaim',x:p.x,y:p.y,id:p.id});}return;}
  if(D.ph==='aim'){const click=inp.fire&&!D.f0;D.f0=!!inp.fire;
    if(click||D.t<=0){let gx=typeof inp.gx==='number'?inp.gx:p.x+Math.cos(p.ang)*300,gy=typeof inp.gy==='number'?inp.gy:p.y+Math.sin(p.ang)*300;
      const d=Math.hypot(gx-p.x,gy-p.y);if(d>WT_UL.range){gx=p.x+(gx-p.x)/d*WT_UL.range;gy=p.y+(gy-p.y)/d*WT_UL.range;}
      D.ph='dive';D.t=WT_UL.rise;D.x=gx;D.y=gy;D.n=0;p.cd.basic=Math.max(p.cd.basic,0.3);
      emit({k:'efx',z:'wtdgdive',x:Math.round(gx),y:Math.round(gy),h:groundH(gx,gy,0),id:p.id});}
    return;}
  if(D.t>0)return;
  D.t+=WT_UL.gap;D.n++;
  for(const t of foesOf(p.team))if(Math.hypot(t.x-D.x,t.y-D.y)<WT_UL.r+(t.r||PR))aoeHit(p,t,WT_UL.dmg,t=>addSlow(t,WT_UL.slow,WT_UL.slowT));
  if(D.n>=WT_UL.n){p.wdg=null;emit({k:'efx',z:'wtdgend',x:Math.round(D.x),y:Math.round(D.y),id:p.id});}}

// ---------- ทุกเฟรม (ทั้งเกม) ----------
function updateWater(dt){
  if(G.wtw&&G.wtw.length)G.wtw=G.wtw.filter(w=>waterWaveTick(w,dt));
  if(G.wtf&&G.wtf.length)G.wtf=G.wtf.filter(f=>waterFamTick(f,dt));
  if(G.wtb&&G.wtb.length)G.wtb=G.wtb.filter(b=>waterMBTick(b,dt));
}
// snapshot ต่อผู้เล่น: [เกจฮีล, ลูกผู้ช่วย, Moonwater, ลำน้ำ (มุม×100 | null), ร่างโคลน [x,y] | 0, อัลติ 0/1 intro/2 เล็ง/3 พุ่ง]
function waterSnapP(p){if(!wtOn(p))return undefined;
  const beam=p.wab,fire=beam?.ph==='fire',moon=p.wmb;
  return [Math.floor(p.whg||0),p.wfam>0?1:0,p.wmw>0?1:0,fire?Math.round(beam.a*100):null,p.wcl?[Math.round(p.wcl.x),Math.round(p.wcl.y)]:0,p.wdg?({intro:1,aim:2,dive:3})[p.wdg.ph]:0,fire?Math.round(beam.L??WT_AB.len):0,beam?1:0,beam?Math.round(beam.pt*1000):0,moon?[Math.round(moon.a*1000),Math.round(moon.pt*1000)]:0,p.wcCharge?Math.round(p.wcCharge/WT_CG.charge*100):0];}
// snapshot ทั้งเกม: คลื่น WV=[id,x,y,a,k] • ลูกผู้ช่วยที่กำลังพุ่ง WF=[id,x,y,h,เจ้าของ]
function waterSnapW(){const o={};if(G.wtw&&G.wtw.length)o.WV=G.wtw.map(w=>[w.id,Math.round(w.x),Math.round(w.y),Math.round(w.a*100)/100,Math.round(Math.min(1,w.t/WT_RP.t)*100)/100]);
  if(G.wtf&&G.wtf.length)o.WF=G.wtf.map(f=>[f.id,Math.round(f.x),Math.round(f.y),Math.round(f.h*10)/10,f.o]);return o;}

const WT_RP=defSpell(WATERP,{id:'riptide',v:{len:480,t:0.8,w:100,dmg:20,out:300},vn:{len:'คลื่น • ระยะ',t:'คลื่น • เวลาวิ่ง (วิ)',w:'คลื่น • ครึ่งความกว้าง',dmg:'ดาเมจ',out:'จบคลื่น • ความเร็วไถลต่อ'},role:'control',n:'Riptide',ic:'🌊',cd:10,d:'กวาดไม้ → คลื่นน้ำยักษ์สูง ~4 ม. วิ่งไปข้างหน้า กว้าง 200 ไกล 480 • ศัตรูที่โดนถูกพัดติดไปกับคลื่นจนสุดทาง 20 ดาเมจ',
  cast(p){const a=p.ang;(G.wtw||(G.wtw=[])).push({id:++G.zid,o:p.id,team:p.team,x:p.x,y:p.y,h:p.z,a,t:0,c:new Map()});
    emit({k:'efx',z:'wtwave',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}}).v;
const WT_FM=defSpell(WATERP,{id:'tidecaller',v:{t:8,dmg:5,spd:4000},vn:{t:'ลูกผู้ช่วยอยู่ (วิ)',dmg:'ยิงตาม • ดาเมจ',spd:'ยิงตาม • ความเร็ว'},role:'utility',n:'Tidecaller Orb',ic:'🔵',cd:15,d:'เสกลูกน้ำลอยที่ไหล่ 8 วิ • ทุกครั้งที่เราทำดาเมจใส่ศัตรู (การโจมตีอะไรก็ได้) ลูกยิงตามล็อกเป้า โดน 100% ครั้งละ 5',
  cast(p){p.wfam=WT_FM.t;emit({k:'efx',z:'wtfam',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}}).v;
const WT_CG=defSpell(WATERP,{id:'aquacage',v:{charge:1,spd:400,range:2500,response:0.14,turn:2.4,r:14,dmg:0,t:2,lift:0.6},vn:{charge:'ชาร์จ (วิ)',spd:'ฟอง • ความเร็ว',range:'ฟอง • ระยะ',response:'หน่วงการเลี้ยว (วิ)',turn:'ความเร็วเลี้ยวสูงสุด (เรเดียน/วิ)',r:'ฟอง • ขนาดลูก',dmg:'ฟอง • ดาเมจ',t:'ขังนาน (วิ)',lift:'ลอยสูง (ม.)'},role:'control',n:'Aqua Cage',ic:'🫧',cd:14,d:'ชาร์จลูกน้ำข้างตัว 1 วิ แล้วเหวี่ยงออกไปไกล 2500 • กดคลิกซ้ายค้าง = ลูกเลี้ยวตามเมาส์ • ปล่อย = พุ่งตรงไปทางเมาส์ตอนนั้น • ช่วงชาร์จและคุมลูกทำได้แค่เดินกับเล็ง • โดน = ขังเป้า 2 วิ ไม่มีดาเมจ',
  cast(p){if(p.wab||p.wdg||p.wtsk||p.dash>0||p.fly)return false;p.wcCharge=1e-6;p.wln=null;},
  hit(pr,t){addStun(t,WT_CG.t);t.wflt=WT_CG.t;t.wfz=WT_CG.lift;
    emit({k:'efx',z:'wtcage',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),n:t.id});}}).v;
PDEF.wcage={spd:WT_CG.spd,r:WT_CG.r,dmg:WT_CG.dmg,life:WT_CG.range/WT_CG.spd,col:'#b9f0ff'};
const WT_AB=defSpell(WATERP,{id:'abyssalbeam',v:{cast:1.5,t:2.2,len:1000,w:28,tick:0.22,dmg:10,turn:0.9,lift:1.2},vn:{cast:'ร่าย (วิ)',t:'ยิงนาน (วิ)',len:'ลำ • ยาว',w:'ลำ • ครึ่งความกว้าง',tick:'โดนทุก (วิ)',dmg:'ดาเมจต่อครั้ง',turn:'หมุนตามเมาส์ (เรเดียน/วิ)',lift:'ลอยสูง (ม.)'},role:'damage',n:'Abyssal Beam',ic:'🔱',cd:25,d:'ร่าย 1.5 วิ แล้วยิงลำน้ำ 2.2 วิ ยาว 1000 (หมุนตามเมาส์ช้า) ไม่ทะลุ ชนคนแรกหรือสิ่งกีดขวางแล้วหยุด โดน 10 ครั้ง ใกล้ 10 / กลาง 7 / ไกล 5 ต่อครั้ง • ยืนนิ่ง ลอยขึ้นนิดหน่อย • คอมโบกับ Tidecaller Orb',
  cast(p){p.wab={ph:'cast',t:WT_AB.cast,a:p.ang,pt:waterBeamPitch(p),k:0};p.shieldOn=false;p.wln=null;
    emit({k:'efx',z:'wtab',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,id:p.id,n:0});}}).v;
const WT_MW=defSpell(WATERP,{id:'moonwater',v:{t:8,len:900,w:28,life:0.6,tick:0.2,dmg:10,rate:1.75,slow:0.55,slowT:0.45},vn:{t:'ระยะเวลา (วิ)',len:'ลำ • ยาว',w:'ลำ • ครึ่งความกว้าง',life:'ลำ • ค้าง (วิ)',tick:'ลำ • โดนทุก (วิ)',dmg:'ลำ • ดาเมจต่อครั้ง',rate:'ยิงได้ทุก (วิ)',slow:'ยิงแล้วเดินช้า (เท่า)',slowT:'ยิงแล้วเดินช้านาน (วิ)'},role:'damage',n:'Moonwater Arts',ic:'🌙',cd:20,d:'8 วิ: คลิกซ้ายกลายเป็นลำน้ำ ไกล 900 ยิงแล้วหาย โดน 3 ครั้ง 10/10/10 ยิงได้ทุก 1.75 วิ',
  cast(p){p.wmw=WT_MW.t;p.cd.basic=0;emit({k:'efx',z:'wtmw',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}}).v;
const WT_UL=defSpell(WATERP,{id:'dragondeep',v:{intro:1,aim:4,range:700,r:350,rise:2.2,n:10,gap:0.2,dmg:15,slow:0.6,slowT:2},vn:{intro:'เรียกมังกร (วิ)',aim:'เวลาเลือกจุด (วิ)',range:'ระยะเลือกจุด',r:'รัศมีดาเมจ',rise:'มังกรบินขึ้นม้วนลง (วิ — ตรงกับภาพ)',n:'จำนวนครั้งดาเมจ',gap:'ห่างแต่ละครั้ง (วิ)',dmg:'ดาเมจต่อครั้ง',slow:'ช้า (เท่า)',slowT:'ช้านาน (วิ)'},role:'ult',ult:true,n:'Dragon of the Deep',ic:'🐉',cd:0,d:'เรียกมังกรน้ำ (มีแค่หัว ตัวเป็นสายน้ำ) เลื้อยวนรอบตัว 1 วิ แล้วลอยเหนือหัวขวา • 4 วิเลือกจุด (คลิกซ้าย) ไกล 700 → มังกรพุ่งลง ดาเมจพื้นที่รัศมี 350 15 × 10 ครั้งใน 2 วิ ช้า 40%',
  cast(p){p.wdg={ph:'intro',t:WT_UL.intro};emit({k:'efx',z:'wtdg',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}}).v;

// ท่าพื้นฐาน + โล่ + Dash ของสาย (PBASIC ต้องอยู่ช่องเดียวกับลำดับใน PATHS)
PBASIC.push({id:'b_water',type:'wdrop',n:'เส้นน้ำ',d:'คลิก = สะบัดไม้ ยิงเข็มน้ำเร็วมาก 3 นัดติดกันตามเมาส์ นัดละ 5 ไกล 500 • ยิงได้ทุก 1 วิ',
  shd:'โล่ฟองน้ำ: กันรอบตัว ไม่ทำให้เดินช้า • ยกโล่ = ฮีล 6/วิ จากเกจฮีล 70 (เกจคืน 3/วิ ตอนไม่ยกโล่) • เกจหมด = กันได้อย่างเดียว',
  dsd:'Dash ร่างโคลน (Shift): จมลงพื้น ทิ้งร่างน้ำไว้ โผล่ห่าง 300 ทิศที่หัน ผลักรอบตัว • 6 วิกด Shift อีกครั้ง = กลับไปที่ร่างโคลน • คูลดาวน์ 8 วิ',
  hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');},
  tick:waterBasic,dash:waterDash});
SPELLS.b_water=PBASIC[WATERP];
