// =====================================================================
//  สายน้ำ 💧 (ผู้ใช้ออกแบบทั้งหมด — designs/water.md) • ฝั่งโฮสต์ • รอบแรก: ระบบเกมก่อน ภาพชั่วคราว (2026-10-31)
//  เล่นง่าย: BA ตวัดไม้สร้างเส้นน้ำยิง 3 นัด • โล่ฟองน้ำฮีลจากเกจ 70 • Dash จมดินทิ้งร่างโคลน กดอีกที = กลับ
//  สกิล: Riptide คลื่นพัด • Tidecaller Orb ลูกผู้ช่วยยิงตามเมื่อเราตีโดน • Aqua Cage ฟองขัง • Abyssal Beam ลำน้ำ 3 วิ
//        Moonwater Arts BA เป็นลำน้ำ 8 วิ • อัลติ Dragon of the Deep มังกรน้ำพุ่งลงพื้นที่
// =====================================================================
const WATERP=PATHS.length;
const WT_BA={cd:1.0,n:3,t0:0.25,gap:0.2,dmg:5,spd:2800,range:500,spr:0.06},   // ตวัดทุก 1 วิ • เส้นน้ำยิง 3 นัด (⚠ 0.25/0.45/0.65 วิ) ตามเมาส์ นัดละ 5 ไกล 500 กระจายนิดๆ
  WT_SH={gauge:70,heal:6,reg:3},                                             // โล่ฟองน้ำ: ไม่ช้า • ฮีล 6/วิ จากเกจ 70 • เกจคืน 3/วิ (⚠ ตอนไม่ยกโล่)
  WT_DS={dist:300,sink:0.35,r:120,push:900,back:6,cd:8},                     // Dash: จม 0.35 วิ (อมตะ) โผล่ห่าง 300 ผลักรัศมี 120 (~150) ไม่มีดาเมจ • 6 วิกดกลับโคลน • คูลดาวน์ 8 วิ
  WT_RP={len:400,t:0.8,w:100,dmg:20,cd:10},                                  // Riptide: คลื่นสูง ~4 ม. กว้าง 200 ไกล 400 ใน 0.8 วิ พัดติดไปจนสุด 20 ดาเมจ
  WT_FM={t:8,dmg:5,spd:4000,cd:15},   // spd 4000 = ลำน้ำ 'pew' แทบทันที (ผู้ใช้ 2026-11-01)
                                          // Tidecaller Orb: 8 วิ ทุกครั้งที่เราทำดาเมจ ลูกยิงตามล็อกเป้า 5 (⚠ คูลดาวน์ 15)
  WT_CG={spd:600,range:300,r:14,dmg:0,t:2,lift:0.6,cd:14},                  // Aqua Cage: ฟองขัง 2 วิ ลอยขึ้นนิดหน่อย ไม่มีดาเมจ ตีได้ฟองไม่แตก
  WT_AB={cast:1.5,t:3,len:700,w:28,tick:0.3,dmg:10,turn:0.6,lift:1.2,cd:25},   // lift 0.5 → 1.2 (ผู้ใช้ 2026-11-01: ลอยสูงขึ้น)
  // Abyssal Beam: ร่าย 0.5 ยิง 3 วิ โดน 10 ครั้งละ 10 ยาว 700 หมุนตามเมาส์ช้าๆ ลอย 0.5 ม. ยืนนิ่ง
  WT_MW={t:8,cd:20,len:900,w:28,life:0.6,tick:0.2,dmg:10,rate:1.75},         // Moonwater Arts: 8 วิ BA = ลำน้ำ 900 ค้าง 0.6 วิ โดนทุก 0.2 (10×3) ยิงทุก 1.75 วิ • (⚠ คูลดาวน์ 20 หลังหมด = 28 นับจากกด)
  WT_UL={intro:1,aim:4,range:700,r:350,rise:2.2,n:10,gap:0.2,dmg:15,slow:0.6,slowT:2};   // Dragon of the Deep: intro 1 วิ • เลือกจุด 4 วิ • มังกรบินขึ้นม้วนลง 2.2 วิ แล้ว 15 × 10 ใน 2 วิ รัศมี 350 ช้า 40%
PATHS.push({id:'water',n:'สายน้ำ',ic:'💧',col:'#4fc3ff',d:'เล่นง่าย — ยิงน้ำไกล คลื่นผลัก ฮีลตัวเองด้วยโล่ เคลื่อนที่ไหลลื่นด้วยร่างโคลน',
  combo:'Aqua Cage ขังศัตรู 2 วิ → Abyssal Beam / ลำน้ำ Moonwater ใส่เต็มๆ • Tidecaller Orb ยิงตามทุกครั้งที่เราตีโดน (คู่กับลำน้ำ = ยิงรัว) • Riptide พัดศัตรูออก • Dash ร่างโคลน หนีแล้วกลับที่เดิมได้'});
Object.assign(PDEF,{wdrop:{spd:WT_BA.spd,r:8,dmg:WT_BA.dmg,life:WT_BA.range/WT_BA.spd,col:'#7fdcff'},
  wcage:{spd:WT_CG.spd,r:WT_CG.r,dmg:WT_CG.dmg,life:WT_CG.range/WT_CG.spd,col:'#b9f0ff'}});
const wtOn=p=>p&&p.pathIdx===WATERP;
// จุดตัดของลำ (เส้นตรงจาก x,y ทิศ a ยาว L กว้าง w) กับเป้า
function wtInBeam(t,x,y,a,L,w,h){const dx=t.x-x,dy=t.y-y,u=dx*Math.cos(a)+dy*Math.sin(a);if(u<0||u>L)return false;
  return Math.abs(-dx*Math.sin(a)+dy*Math.cos(a))<=w+(t.r||PR)&&Math.abs(cH(t)-h)<3;}

// ---------- ทุกเฟรมของผู้เล่นสายน้ำ (เรียกจาก updatePlayer หลังส่วนโล่) ----------
function waterTick(p,dt){
  if(p.whg===undefined)p.whg=WT_SH.gauge;
  // โล่ฟองน้ำ: ฮีลจากเกจ • ไม่ยกโล่ = เกจคืน
  if(p.shieldOn&&p.whg>0&&p.hp<p.maxHp){const u=Math.min(p.whg,WT_SH.heal*dt);p.whg-=u;p.whA=(p.whA||0)+u;if(p.whA>=1){healT(p,Math.floor(p.whA));p.whA-=Math.floor(p.whA);}}
  else if(!p.shieldOn)p.whg=Math.min(WT_SH.gauge,p.whg+WT_SH.reg*dt);
  if(p.wln)waterLineTick(p,dt);
  if(p.wsk)waterSinkTick(p,dt);
  if(p.wcl&&!p.wsk){p.wcl.t-=dt;if(p.wcl.t<=0||!p.alive){p.wcl=null;p.cd.dodge=p.cdMax.dodge=WT_DS.cd*p.buffs.cdr;emit({k:'efx',z:'wtclend',x:p.x,y:p.y,id:p.id});}}
  if(p.wmsT>0)p.wmsT-=dt;
  if(p.wfam>0){p.wfam-=dt;if(p.wfam<=0||!p.alive){p.wfam=0;emit({k:'efx',z:'wtfamoff',x:p.x,y:p.y,id:p.id});}}
  if(p.wmw>0){p.wmw-=dt;if(p.wmw<=0)emit({k:'efx',z:'wtmwoff',x:p.x,y:p.y,id:p.id});}
  if(p.wab)waterBeamTick(p,dt);
  if(p.wdg)waterDragonTick(p,dt);
}
// ยืนนิ่ง: จมดิน / ร่าย-ยิง Abyssal Beam
function waterSpd(p){return p.wsk||p.wab?0:p.wmsT>0?0.55:1;}
function waterReset(p){p.wln=null;p.wsk=null;p.wcl=null;p.wfam=0;p.wmw=0;p.wab=null;p.wdg=null;p.wmsT=0;p.whg=WT_SH.gauge;p.whA=0;}

// ---------- BA: ตวัดไม้สร้างเส้นน้ำ → ยิง 3 นัดตามเมาส์ • Moonwater = ลำน้ำ ----------
const WT_BA_H=[2.28,1.61,1.12];   // ความสูงจุดบนรอยฟัน (ตรงกับ pinch ใน water/ba_slash)
function waterBasic(p,inp,dt,setCd){
  if(p.wdg&&p.wdg.ph==='aim')return;   // อัลติ: คลิกซ้าย = เลือกจุด
  if(p.wab)return;
  if(!inp.fire||p.cd.basic>0)return;
  if(p.wmw>0){waterMoonBeam(p);setCd('basic',WT_MW.rate);return;}
  p.wln={t:0,n:0};setCd('basic',WT_BA.cd);
  emit({k:'efx',z:'wtslash',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,id:p.id});}
function waterLineTick(p,dt){const L=p.wln;L.t+=dt;
  if(!p.alive||p.stun>0){p.wln=null;return;}
  while(L.n<WT_BA.n&&L.t>=WT_BA.t0+L.n*WT_BA.gap){const a=p.ang,side=(L.n-1)*16;L.n++;
    p.ang=a+rnd(-WT_BA.spr,WT_BA.spr);const pr=shoot(p,'wdrop',{sp:'b_water',dmg:WT_BA.dmg,quiet:1});p.ang=a;
    pr.x+=-Math.sin(a)*side;pr.y+=Math.cos(a)*side;{const h=pr.h;pr.h=p.z+WT_BA_H[L.n-1];pr.vh+=(h-pr.h)*WT_BA.spd/300;}}   // ออกจากรอยฟันเอง (ตรงหยดที่บีบ ซ้ายบน→ขวาล่าง)
  if(L.n>=WT_BA.n&&L.t>=WT_BA.t0+WT_BA.n*WT_BA.gap)p.wln=null;}
function waterMoonBeam(p){const a=p.ang;p.wmsT=0.45;(G.wtb||(G.wtb=[])).push({o:p.id,team:p.team,x:p.x,y:p.y,h:p.z+1.3,a,t:0,k:0,len:WT_MW.len,w:WT_MW.w,life:WT_MW.life,tick:WT_MW.tick,dmg:WT_MW.dmg});
  emit({k:'efx',z:'wtmb',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}

// ---------- Dash: จมดิน ทิ้งร่างโคลน → โผล่ห่าง 300 ทิศที่หัน • 6 วิกดอีกที = กลับไปที่โคลน ----------
function waterDash(p,inp,pr,dt,setCd){
  if(!pr.sp||p.wsk||p.wab)return false;
  if(p.wcl){const c=p.wcl;p.wsk={t:WT_DS.sink,x:c.x,y:c.y,back:1};p.inv=WT_DS.sink+0.05;p.shieldOn=false;
    emit({k:'efx',z:'wtsink',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id,n:1});return false;}
  if(p.cd.dodge>0)return false;
  const a=p.ang;let x=p.x+Math.cos(a)*WT_DS.dist,y=p.y+Math.sin(a)*WT_DS.dist;x=Math.max(30,Math.min(MW-30,x));y=Math.max(30,Math.min(MH-30,y));
  p.wcl={x:p.x,y:p.y,t:WT_DS.back};p.wsk={t:WT_DS.sink,x,y,back:0};p.inv=WT_DS.sink+0.05;p.shieldOn=false;setCd('dodge',WT_DS.back+WT_DS.sink);
  emit({k:'efx',z:'wtsink',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id,n:0});
  return false;}
function waterSinkTick(p,dt){const S=p.wsk;S.t-=dt;p.vx=p.vy=0;if(S.t>0)return;
  p.wsk=null;p.x=S.x;p.y=S.y;collideWorld(p,PR);p.z=Math.max(p.z,groundH(p.x,p.y,p.z));
  for(const t of foesOf(p.team))if(Math.hypot(t.x-p.x,t.y-p.y)<WT_DS.r+(t.r||PR))knock(t,p.x,p.y,WT_DS.push);   // ผลักรอบตัว ไม่มีดาเมจ
  if(S.back){p.wcl=null;p.cd.dodge=p.cdMax.dodge=WT_DS.cd*p.buffs.cdr;}
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
  for(const [t,s] of w.c)if(s!==null){t.vx=ca*300;t.vy=sa*300;}
  return false;}

// ---------- Abyssal Beam: ร่าย 0.5 วิ → ยิงลำน้ำ 3 วิ (ยืนนิ่ง ลอยนิดหน่อย หมุนตามเมาส์ช้าๆ) ----------
// ระยะก่อนชนกำแพง/หิน/ตึก (เงื่อนไขเดียวกับกระสุน updateProjectiles) • ชนแล้วลำหยุดตรงนั้น
function waterBeamStop(p,a,h){const c=Math.cos(a),s=Math.sin(a);
  for(let d=40;d<WT_AB.len;d+=16){const x=p.x+c*d,y=p.y+s*d,hh=h+terrT(p.x,p.y)-terrT(x,y);
    if(x<40||x>MW-40||y<40||y>MH-40||(TERR&&terrSolid(x,y,hh)))return d;
    for(const o of sgNear(sgObs(),x,y,8,_sgPO))if(o.bi===undefined&&!(o.bot!==undefined&&hh<o.bot)&&(o.top!==undefined?terrT(x,y)+hh<o.top:hh<o.hgt)&&(x-o.x)**2+(y-o.y)**2<(o.r+8)**2)return d;
    if(BLDG.length)for(const b of sgNear(sgBld(),x,y,8,_sgPB))if(bldNear(b,x,y,8)&&bldPieceAt(b,x,y,hh,8)>=0)return d;
    for(const w of G.walls)if(p.team!==w.team&&hh<w.hgt&&(x-w.x)**2+(y-w.y)**2<(w.r+8)**2)return d;
    if(citySolidAt(x,y,hh))return d;}
  return WT_AB.len;}
function waterBeamTick(p,dt){const B=p.wab;B.t-=dt;
  if(!p.alive||p.stun>0){p.wab=null;emit({k:'efx',z:'wtaboff',x:p.x,y:p.y,id:p.id});return;}
  p.wflt=0.2;p.wfz=WT_AB.lift;
  const inp=p.inp||{};if(typeof inp.ax==='number'){const want=Math.atan2(inp.ay-p.y,inp.ax-p.x),da=angDiff(want,B.a),m=WT_AB.turn*dt;B.a+=Math.max(-m,Math.min(m,da));}p.ang=B.a;   // ตัวหันช้าเท่าลำ วงเวทกับลำจึงไปด้วยกัน
  p.ang=B.a;
  if(B.ph==='cast'){if(B.t<=0){B.ph='fire';B.t=WT_AB.t;B.k=0;emit({k:'efx',z:'wtab',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(B.a*100)/100,id:p.id,n:1});}return;}
  // ไม่ทะลุ: ลำหยุดที่คนแรกในแนว โดนแค่คนนั้น (ผู้ใช้ 2026-11-01)
  let first=null;B.L=waterBeamStop(p,B.a,p.z+1.3);for(const t of foesOf(p.team))if(wtInBeam(t,p.x,p.y,B.a,WT_AB.len,WT_AB.w,p.z+1.3)){const d=Math.hypot(t.x-p.x,t.y-p.y);if(d<B.L){B.L=d;first=t;}}
  B.k-=dt;if(B.k<=0){B.k+=WT_AB.tick;if(first){aoeHit(p,first,WT_AB.dmg,null);emit({k:'efx',z:'wtabhit',x:Math.round(first.x),y:Math.round(first.y),h:cH(first)});}}
  if(B.t<=0){p.wab=null;emit({k:'efx',z:'wtaboff',x:p.x,y:p.y,id:p.id});}}
// ลำน้ำ Moonwater (ยิงแล้วหาย ทิศคงที่)
function waterMBTick(b,dt){b.t+=dt;b.k-=dt;const p=G.players[b.o];
  if(b.k<=0&&p){b.k+=b.tick;for(const t of foesOf(b.team))if(wtInBeam(t,b.x,b.y,b.a,b.len,b.w,b.h))aoeHit(p,t,b.dmg,null);}
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
function waterSnapP(p){if(!wtOn(p))return undefined;return [Math.floor(p.whg||0),p.wfam>0?1:0,p.wmw>0?1:0,p.wab&&p.wab.ph==='fire'?Math.round(p.wab.a*100):null,p.wcl?[Math.round(p.wcl.x),Math.round(p.wcl.y)]:0,p.wdg?({intro:1,aim:2,dive:3})[p.wdg.ph]:0,p.wab&&p.wab.ph==='fire'?Math.round(p.wab.L||WT_AB.len):0,p.wab?1:0];}
// snapshot ทั้งเกม: คลื่น WV=[id,x,y,a,k] • ลูกผู้ช่วยที่กำลังพุ่ง WF=[id,x,y,h,เจ้าของ]
function waterSnapW(){const o={};if(G.wtw&&G.wtw.length)o.WV=G.wtw.map(w=>[w.id,Math.round(w.x),Math.round(w.y),Math.round(w.a*100)/100,Math.round(Math.min(1,w.t/WT_RP.t)*100)/100]);
  if(G.wtf&&G.wtf.length)o.WF=G.wtf.map(f=>[f.id,Math.round(f.x),Math.round(f.y),Math.round(f.h*10)/10,f.o]);return o;}

defSpell(WATERP,{id:'riptide',role:'control',n:'Riptide',ic:'🌊',cd:WT_RP.cd,d:'กวาดไม้ → คลื่นน้ำยักษ์สูง ~4 ม. วิ่งไปข้างหน้า กว้าง 200 ไกล 400 • ศัตรูที่โดนถูกพัดติดไปกับคลื่นจนสุดทาง 20 ดาเมจ',
  cast(p){const a=p.ang;(G.wtw||(G.wtw=[])).push({id:++G.zid,o:p.id,team:p.team,x:p.x,y:p.y,h:p.z,a,t:0,c:new Map()});
    emit({k:'efx',z:'wtwave',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}});
defSpell(WATERP,{id:'tidecaller',role:'utility',n:'Tidecaller Orb',ic:'🔵',cd:WT_FM.cd,d:'เสกลูกน้ำลอยที่ไหล่ 8 วิ • ทุกครั้งที่เราทำดาเมจใส่ศัตรู (การโจมตีอะไรก็ได้) ลูกยิงตามล็อกเป้า โดน 100% ครั้งละ 5',
  cast(p){p.wfam=WT_FM.t;emit({k:'efx',z:'wtfam',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}});
defSpell(WATERP,{id:'aquacage',role:'control',n:'Aqua Cage',ic:'🫧',cd:WT_CG.cd,d:'ยิงฟองน้ำ ไกล 300 • โดน = ขังศัตรูในฟองลอยขึ้นนิดหน่อย 2 วิ (ทำอะไรไม่ได้ ตีได้ ฟองไม่แตก) ไม่มีดาเมจ',
  cast(p){shoot(p,'wcage',{sp:'aquacage'});},
  hit(pr,t){addStun(t,WT_CG.t);t.wflt=WT_CG.t;t.wfz=WT_CG.lift;
    emit({k:'efx',z:'wtcage',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),n:t.id});}});
defSpell(WATERP,{id:'abyssalbeam',role:'damage',n:'Abyssal Beam',ic:'🔱',cd:WT_AB.cd,d:'ร่าย 1.5 วิ แล้วยิงลำน้ำ 3 วิ ยาว 700 (หมุนตามเมาส์ช้ามาก) ไม่ทะลุ ชนคนแรกหรือสิ่งกีดขวางแล้วหยุด โดน 10 ครั้ง ครั้งละ 10 (ครบ = 100) • ยืนนิ่ง ลอยขึ้นนิดหน่อย • คอมโบกับ Tidecaller Orb',
  cast(p){p.wab={ph:'cast',t:WT_AB.cast,a:p.ang,k:0};p.shieldOn=false;p.wln=null;
    emit({k:'efx',z:'wtab',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,id:p.id,n:0});}});
defSpell(WATERP,{id:'moonwater',role:'damage',n:'Moonwater Arts',ic:'🌙',cd:WT_MW.cd,d:'8 วิ: คลิกซ้ายกลายเป็นลำน้ำ ไกล 900 ยิงแล้วหาย โดน 3 ครั้ง 10/10/10 ยิงได้ทุก 1.75 วิ',
  cast(p){p.wmw=WT_MW.t;p.cd.basic=0;emit({k:'efx',z:'wtmw',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}});
defSpell(WATERP,{id:'dragondeep',role:'ult',ult:true,n:'Dragon of the Deep',ic:'🐉',cd:0,d:'เรียกมังกรน้ำ (มีแค่หัว ตัวเป็นสายน้ำ) เลื้อยวนรอบตัว 1 วิ แล้วลอยเหนือหัวขวา • 4 วิเลือกจุด (คลิกซ้าย) ไกล 700 → มังกรพุ่งลง ดาเมจพื้นที่รัศมี 350 15 × 10 ครั้งใน 2 วิ ช้า 40%',
  cast(p){p.wdg={ph:'intro',t:WT_UL.intro};emit({k:'efx',z:'wtdg',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}});

// ท่าพื้นฐาน + โล่ + Dash ของสาย (PBASIC ต้องอยู่ช่องเดียวกับลำดับใน PATHS)
PBASIC.push({id:'b_water',type:'wdrop',n:'เส้นน้ำ',d:'คลิก = ตวัดไม้สร้างเส้นน้ำ แล้วเส้นน้ำยิงกระสุนน้ำเร็วมาก 3 นัดตามเมาส์ นัดละ 5 ไกล 500 • ตวัดได้ทุก 1 วิ',
  shd:'โล่ฟองน้ำ: กันรอบตัว ไม่ทำให้เดินช้า • ยกโล่ = ฮีล 6/วิ จากเกจฮีล 70 (เกจคืน 3/วิ ตอนไม่ยกโล่) • เกจหมด = กันได้อย่างเดียว',
  dsd:'Dash ร่างโคลน (Shift): จมลงพื้น ทิ้งร่างน้ำไว้ โผล่ห่าง 300 ทิศที่หัน ผลักรอบตัว • 6 วิกด Shift อีกครั้ง = กลับไปที่ร่างโคลน • คูลดาวน์ 8 วิ',
  hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');},
  tick:waterBasic,dash:waterDash});
SPELLS.b_water=PBASIC[WATERP];
