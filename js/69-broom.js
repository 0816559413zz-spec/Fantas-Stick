// ---------- ไม้กวาด (ผู้ใช้ 2026-10-29): บินแบบเครื่องบิน + ยิงลำแสงตามสาย + อนิเมชันเรียกไม้กวาด + สกิลบนไม้กวาดตามสาย ----------
// บังคับ: เมาส์ (กล้อง) = ทิศที่อยากไป + เงย/ก้ม = ไต่ขึ้น/ดิ่งลง • W เร่ง (ค่อยๆ ถึงเร็วสุด) • S เบรก/ถอยช้าๆ • ไม่กด = ร่อนช้าลง
//   A/D สไลด์ข้างเบาๆ • Space/C ขึ้น/ลงตรงๆ ยังใช้ได้ • เลี้ยวเป็นวง: อัตราเลี้ยวจำกัด (เร็ว = วงกว้าง) + ค่อยๆ เพิ่ม/ลดแรงเลี้ยว ไม่หักปุบปับ
// โจมตีบนไม้กวาด: คลิกซ้าย (กดค้างได้) = ลำแสงระยะไกลสีตามสาย • ไม่ใช้กับควิดดิช/แข่ง (โหมดนั้นร่ายเวทปกติ)
// สกิลบนไม้กวาด (ผู้ใช้ 2026-10-29) — BROOM_SK[สาย](p,inp,pr,dt):
//   ไฟ Afterburner (Shift ค้าง) เร่งแรง เชื้อเพลิง 100 เผา 10/วิ • น้ำแข็ง Ice Barrage (E) ยิงน้ำแข็งเล็กรัวๆ
//   สายฟ้า Lightning Strike (Shift ค้าง = ชาร์จอยู่กับที่ ปล่อย = พุ่งไปทางเล็ง) • หิน Flak (E) ก้อนหินช้า ใกล้ศัตรูแตกเป็นกรวย
//   ลม Maneuver (Shift ค้าง) เลี้ยวแคบ ขึ้นลงไว
const BRM={acc:1.25,drag:0.85,brake:650,back:-140,side:160,turnLo:2.8,turnHi:1.35,turnK:2.4,turnA:4.5,climb:0.9,dz:0.05,vzMax:13,
  rng:950,cd:0.38,dmg:12,w:22};
const BSK={ab:{fuel:100,burn:10,reg:8,regD:1,spd:1.8,acc:3.5},   // Afterburner: ไม่ใช้ 1 วิ แล้วเติมคืน 8/วิ
  ib:{n:10,gap:0.08,cd:6,dmg:6,spr:0.06},   // Ice Barrage
  ls:{chg:1.1,min:0.15,d0:320,d1:1000,t:0.32,dmg:[14,26],r:70,cd:5},   // Lightning Strike: ชาร์จสูงสุด 1.1 วิ → พุ่ง 320-1000 px
  fk:{spd:620,life:1.7,prox:120,n:7,cone:0.5,dmg:5,cd:3.5},   // Flak
  wm:{turn:2.2,turnA:2.6,vz:1.7}};   // Wind Maneuver
Object.assign(PCOL,{flak:'#c9a36a'});Object.assign(PDEF,{flak:{spd:620,r:13,dmg:8,life:1.7,col:'#c9a36a'}});
const BROOM_SK={
  0(p,inp,pr,dt){const A=BSK.ab;if(p.abF===undefined)p.abF=A.fuel;
    p.bab=!!inp.dh&&p.abF>0;
    if(p.bab){p.abF=Math.max(0,p.abF-A.burn*dt);p.abI=0;if(p.abF<=0)p.bab=false;}
    else{p.abI=(p.abI||0)+dt;if(p.abI>A.regD)p.abF=Math.min(A.fuel,p.abF+A.reg*dt);}
    p.bbv=p.abF;p.bbf=p.bab?1:0;},
  1(p,inp,pr,dt){const B=BSK.ib;p.ibCd=Math.max(0,(p.ibCd||0)-dt);
    if(pr.e&&p.ibCd<=0&&!(p.ibN>0)){p.ibCd=B.cd;p.ibN=B.n;p.ibT=0;}
    if(p.ibN>0){p.ibT-=dt;if(p.ibT<=0){p.ibT=B.gap;p.ibN--;const a=p.ang;p.ang+=rnd(-B.spr,B.spr);shoot(p,'icicle',{sp:'bsk_ice',life:0.9,dmg:B.dmg});p.ang=a;}}
    p.bbv=Math.ceil(p.ibCd);p.bbf=0;},
  2(p,inp,pr,dt){const L=BSK.ls;p.lsCd=Math.max(0,(p.lsCd||0)-dt);
    if(!p.lsd){
      if(inp.dh&&p.lsCd<=0){p.lsc=Math.min(L.chg,(p.lsc||0)+dt);}
      else if(p.lsc>0){const k=clamp(p.lsc/L.chg,0,1);if(p.lsc>=L.min)broomStrike(p,k);p.lsc=0;}
    }
    p.bbv=p.lsc>0?Math.round(p.lsc/L.chg*100):Math.ceil(p.lsCd);p.bbf=(p.lsc>0?4:0)|(p.lsd?8:0);},
  [EARTH](p,inp,pr,dt){const F=BSK.fk;p.fkCd=Math.max(0,(p.fkCd||0)-dt);
    if(pr.e&&p.fkCd<=0){p.fkCd=F.cd;const q=shoot(p,'flak',{sp:'bsk_flak',life:F.life});q.flak=1;}
    p.bbv=Math.ceil(p.fkCd);p.bbf=0;},
  [WINDP](p,inp,pr,dt){p.bwm=!!inp.dh;p.bbv=0;p.bbf=p.bwm?2:0;}
};
function broomVert(p,inp,dt){
  if(!p.flyOn){p.flyOn=true;p.fh=p.ang;p.fs=0;p.fyr=0;p.fcl=0;p.bab=p.bwm=false;p.lsd=null;p.lsc=0;}
  if(p.lsd)return;   // กำลังพุ่งสายฟ้า: ความสูงคุมใน broomStrikeTick
  const W=p.bwm?BSK.wm.vz:1;
  let ap=clamp(inp.ap||0,-0.9,0.9);ap=Math.abs(ap)<BRM.dz?0:ap-Math.sign(ap)*BRM.dz;
  p.fcl=ap*BRM.climb;   // มุมไต่ (เงยกล้อง = ขึ้น)
  const tv=clamp(Math.max(0,p.fs)/20*Math.sin(p.fcl)*W,-BRM.vzMax*W,BRM.vzMax*W)+((inp.jh?8:0)-(inp.ch?8:0))*W;
  p.vz+=(tv-p.vz)*Math.min(1,5*W*dt);
  p.z=clamp(p.z+p.vz*dt,0.6,24);
  if((p.z<=0.6&&p.vz<0)||(p.z>=24&&p.vz>0))p.vz=0;
}
// mx,my = ทิศที่กด (โลก, หมุนตามกล้องแล้ว) • spd = เร็วสุดบนไม้กวาด
function broomMove(p,mx,my,spd,canAct,dt){
  if(p.lsd){broomStrikeTick(p,dt);return;}
  const c=Math.cos(p.ang),s=Math.sin(p.ang),f=mx*c+my*s,sd=-mx*s+my*c;
  const k=clamp(p.fs/Math.max(1,spd),0,1),W=p.bwm?BSK.wm:null;
  if(canAct){const d=angDiff(p.ang,p.fh),mr=(BRM.turnLo+(BRM.turnHi-BRM.turnLo)*k)*(W?W.turn:1),tr=clamp(d*BRM.turnK*(W?W.turn:1),-mr,mr),ta=BRM.turnA*(W?W.turnA:1);
    p.fyr+=clamp(tr-p.fyr,-ta*dt,ta*dt);}
  else p.fyr*=Math.exp(-4*dt);
  p.fh=angDiff(p.fh+p.fyr*dt,0);
  if(p.lsc>0)p.fs*=Math.exp(-6*dt);   // ชาร์จสายฟ้า = หยุดลอยอยู่กับที่
  else if(p.bab)p.fs+=(spd*BSK.ab.spd-p.fs)*Math.min(1,BSK.ab.acc*dt);   // Afterburner: พุ่งไปข้างหน้าเองแม้ไม่กด W
  else if(f>0.2)p.fs+=(spd*f-p.fs)*Math.min(1,BRM.acc*dt);
  else if(f<-0.2)p.fs=Math.max(BRM.back,p.fs-BRM.brake*dt);
  else p.fs*=Math.exp(-BRM.drag*dt);
  const hv=p.fs*Math.cos(p.fcl||0),hc=Math.cos(p.fh),hs=Math.sin(p.fh);
  p.mvx=hc*hv-hs*sd*BRM.side;p.mvy=hs*hv+hc*sd*BRM.side;
  p.x+=p.mvx*dt;p.y+=p.mvy*dt;
}
// Lightning Strike: พุ่งตรงไปจุดเล็ง (รวมขึ้น/ลง) ทะลุศัตรู โดนคนละครั้ง ดาเมจตามชาร์จ + Shock
function broomStrike(p,k){
  const L=BSK.ls,D=L.d0+(L.d1-L.d0)*k,h0=p.z+1.2,r=aimRay3(p,h0,D);
  let dx,dy,dh;
  if(r){dx=r.x-p.x;dy=r.y-p.y;dh=(r.h-h0)*20;}else{dx=Math.cos(p.ang)*D;dy=Math.sin(p.ang)*D;dh=0;}
  const l=Math.hypot(dx,dy,dh)||1,sp=D/L.t;dx/=l;dy/=l;dh/=l;
  p.lsd={t:L.t,vx:dx*sp,vy:dy*sp,vh:dh*sp/20,hit:new Set(),dmg:L.dmg[0]+(L.dmg[1]-L.dmg[0])*k};
  p.lsCd=L.cd;p.inv=Math.max(p.inv,L.t);
  emit({k:'bls',id:p.id,x:Math.round(p.x),y:Math.round(p.y),h:Math.round(h0*10)/10,x2:Math.round(p.x+dx*D),y2:Math.round(p.y+dy*D),h2:Math.round((h0+dh*D/20)*10)/10,k:Math.round(k*10)/10});
}
function broomStrikeTick(p,dt){
  const S=p.lsd,n=Math.max(1,Math.ceil(Math.hypot(S.vx,S.vy)*dt/8)),st=dt/n;
  for(let i=0;i<n;i++){p.x+=S.vx*st;p.y+=S.vy*st;p.z=clamp(p.z+S.vh*st,0.6,24);collideWorld(p,PR,p.z);
    for(const t of foesOf(p.team)){if(S.hit.has(t)||t.gh)continue;if(Math.hypot(t.x-p.x,t.y-p.y)<BSK.ls.r+(t.r||PR)&&Math.abs(cH(t)-(p.z+1.1))<3){S.hit.add(t);p.baHit=1;aoeHit(p,t,S.dmg,t=>shock(t,p.id,0.3));p.baHit=0;}}}
  p.mvx=S.vx;p.mvy=S.vy;p.vz=0;
  S.t-=dt;if(S.t<=0){p.fh=Math.atan2(S.vy,S.vx);p.fs=540*p.buffs.spd;p.fyr=0;p.lsd=null;emit({k:'efx',z:'jump',x:p.x,y:p.y,h:p.z,id:p.id});}
}
// Flak: ก้อนหินบินช้า — ใกล้ศัตรู (หรือหมดเวลา) แตกเป็นเศษหินกรวยไปทางที่บิน
function broomFlak(pr){
  let near=pr.life<=0.05;
  if(!near)for(const t of foesOf(pr.team)){if(t.gh)continue;if(Math.hypot(t.x-pr.x,t.y-pr.y)<BSK.fk.prox+(t.r||PR)&&Math.abs(cH(t)-pr.h)<4){near=true;break;}}
  if(!near)return false;
  pr.dead=true;const F=BSK.fk,a=Math.atan2(pr.vy,pr.vx),o=G.players[pr.owner];
  for(let i=0;i<F.n;i++){const b=a+(i/(F.n-1)-0.5)*2*F.cone+rnd(-0.06,0.06),sp=1000;
    G.proj.push({id:++G.pid,type:'erock',x:pr.x,y:pr.y,h:pr.h,vh:pr.vh*0.5+rnd(-2,2),vx:Math.cos(b)*sp,vy:Math.sin(b)*sp,r:7,dmg:F.dmg*(o?o.buffs.dmg:1),life:0.3,owner:pr.owner,team:pr.team,src:'p'});}
  emit({k:'bflak',x:Math.round(pr.x),y:Math.round(pr.y),h:Math.round(pr.h*10)/10,a:Math.round(a*100)/100});
  return true;
}
// โฮสต์: ทุกเฟรมตอนอยู่บนไม้กวาด (นอกควิดดิช/แข่ง)
function broomAct(p,inp,pr,dt){
  p.bbCd=Math.max(0,(p.bbCd||0)-dt);
  if(inp.fire&&p.bbCd<=0&&!p.lsd&&!(p.lsc>0)){p.bbCd=BRM.cd;broomBeam(p);}
  const S=BROOM_SK[p.pathIdx|0];
  if(S)S(p,inp,pr,dt);else{p.bbv=0;p.bbf=0;}
}
function broomOff(p){p.bab=p.bwm=false;p.lsc=0;p.lsd=null;p.ibN=0;p.bbf=0;}
// ลำแสง: ยิงตรงไปที่เป้ากลางจอ (aimRay3 หยุดที่พื้น/ตึก) แล้วโดนศัตรูตัวแรกที่อยู่ใกล้เส้น
function broomBeam(p){
  const h0=p.z+1.2,R=BRM.rng,r=aimRay3(p,h0,R);
  let ex,ey,eh;
  if(r){ex=r.x;ey=r.y;eh=r.h;}
  else{const ap=clamp((p.inp&&p.inp.ap)||0,-0.9,0.9);ex=p.x+Math.cos(p.ang)*R;ey=p.y+Math.sin(p.ang)*R;eh=h0+Math.tan(ap)*R/20;}
  const dx=ex-p.x,dy=ey-p.y,dh=(eh-h0)*20,L2=dx*dx+dy*dy+dh*dh||1;
  let best=null,bu=2;
  for(const t of foesOf(p.team)){
    if(t.gh)continue;
    const qx=t.x-p.x,qy=t.y-p.y,qh=(cH(t)-0.3-h0)*20,u=clamp((qx*dx+qy*dy+qh*dh)/L2,0,1);
    const d=Math.hypot(qx-dx*u,qy-dy*u,(qh-dh*u)*0.6);
    if(d<(t.r||PR)+BRM.w&&u<bu){bu=u;best=t;}
  }
  if(best){ex=p.x+dx*bu;ey=p.y+dy*bu;eh=h0+dh*bu/20;
    const pi=p.pathIdx|0;p.baHit=1;
    aoeHit(p,best,BRM.dmg,t=>{if(pi===0)addBurn(t,1,p.id);else if(pi===1)addSlow(t,0.7,1.2);else if(pi===2)shock(t,p.id,0.2);});
    p.baHit=0;}
  else if(r&&r.hit==='bld')damagePropsIn(ex,ey,30,BRM.dmg,p.id);
  emit({k:'bbm',id:p.id,x:Math.round(p.x),y:Math.round(p.y),h:Math.round(h0*10)/10,x2:Math.round(ex),y2:Math.round(ey),h2:Math.round(eh*10)/10,c:p.pathIdx|0,ht:best?1:0});
}

// ---------- ฝั่งจอ ----------
// ทิศตัวละครตอนบิน = ทิศไม้กวาด (fh จากโฮสต์) ไม่ใช่ทิศกล้อง • คำนวณเอียงตอนเลี้ยว/เงยตอนไต่
function broomHead(o,p,dt){
  if(!p.fl||typeof p.fh!=='number'){o.fhS=undefined;return p.a;}
  if(o.fhS===undefined){o.fhS=p.fh;o.fyr=0;}
  const d=angDiff(p.fh,o.fhS),n=angDiff(o.fhS+d*Math.min(1,dt*14),0);
  o.fyr+=((dt>0?angDiff(n,o.fhS)/dt:0)-o.fyr)*Math.min(1,dt*6);o.fhS=n;
  return n;
}
const BBEAM=[];
const _bbGeo=new THREE.CylinderGeometry(1,1,1,10,1,true).rotateX(Math.PI/2).translate(0,0,0.5);
function broomView(o,p,dt,now){
  const g=o.g;g.rotation.order='YXZ';
  if(o.mntT>0)o.mntT=Math.max(0,o.mntT-dt);
  if(o.dmtT>0)o.dmtT=Math.max(0,o.dmtT-dt);
  // เอียงตามแรงเลี้ยว + เงย/ก้มตามความเร็วขึ้นลง (ค่อยๆ เข้า/ออก)
  let bank=0,pit=0;
  if(p.fl){
    const zv=o.bzp===undefined?0:(o.zs-o.bzp)/Math.max(dt,1e-3);
    o.bzv=(o.bzv||0)+(zv-(o.bzv||0))*Math.min(1,dt*5);
    bank=clamp((o.fyr||0)*0.42,-0.75,0.75);
    pit=-clamp(Math.atan2(o.bzv,Math.max(4,o.bsp||0))*0.7,-0.55,0.55);
  }
  o.bzp=o.zs;
  o.bnk=(o.bnk||0)+(bank-(o.bnk||0))*Math.min(1,dt*6);o.bpt=(o.bpt||0)+(pit-(o.bpt||0))*Math.min(1,dt*6);
  g.rotation.z=o.bnk;g.rotation.x=o.bpt;
  if(p.fl&&p.al)broomSkFx(o,p,dt,now);
  const B=o.broom;
  if(p.fl&&o.mntT>0){
    // เรียกไม้กวาด: วงเวทใต้เท้า → ไม้กวาดหมุนขึ้นมาจากพื้น ขยายเต็มขนาด แล้วตัวละครกระโดดขึ้นนั่ง
    const k=1-o.mntT/0.75,e=1-Math.pow(1-k,3),bk=k<1?1+2.2*Math.pow(k-1,3)+1.2*Math.pow(k-1,2):1;
    B.visible=true;B.scale.setScalar(Math.max(0.01,bk));
    B.position.y=-0.9+1.7*e;B.rotation.y=(1-e)*Math.PI*5;
    if(Math.random()<0.9){const a=now/90+Math.random()*6.28,r=18+Math.random()*10;
      PARTS.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,h:(p.z||0)+B.position.y+0.2,vx:-Math.sin(a)*60,vy:Math.cos(a)*60,vh:rnd(1,2.5),life:0.45,max:0.45,col:Math.random()<0.5?'#ffe9a8':'#fff6dc',size:1.8,g:-0.5,drag:2});}
  }else if(!p.fl&&o.dmtT>0){
    // ลงจากไม้กวาด: ไม้กวาดหมุนหดหายเป็นประกาย
    const k=1-o.dmtT/0.45;B.visible=true;B.scale.setScalar(Math.max(0.01,1-k*k));B.rotation.y=k*k*Math.PI*4;B.position.y=0.8-0.5*k;
  }else{B.visible=!!p.fl;B.scale.setScalar(1);B.position.y=0.8;B.rotation.y=0;}
}
function broomMountFx(ev){
  const o=PM3.get(ev.id);if(o){o.mntT=0.75;o.dmtT=0;}
  const p=VIEW.cur&&VIEW.cur.P.find(q=>q.id===ev.id),c=p?(PATHS[getKit(p.id).path]||PATHS[0]).col:'#ffe9a8',H=ev.h||0;
  SHAPES_Q.push({k:'rune',x:ev.x,y:ev.y,col:c,s1:1.6,life:0.9,op:0.85});
  SHAPES_Q.push({k:'ring',x:ev.x,y:ev.y,col:'#ffe9a8',s0:0.3,s1:2.4,life:0.6,op:0.9});
  FX.flashSprite(ev.x,ev.y,H+0.4,c,0.5,3,0.35,2);
  for(let i=0;i<26;i++){const a=i/26*Math.PI*2;PARTS.push({x:ev.x+Math.cos(a)*34,y:ev.y+Math.sin(a)*34,h:H+0.1,vx:-Math.sin(a)*70,vy:Math.cos(a)*70,vh:rnd(2,5),life:0.8,max:0.8,col:i%2?c:'#ffffff',size:2,g:0.6,drag:2});}
}
function broomDismountFx(ev){const o=ev.id!==undefined&&PM3.get(ev.id);if(o){o.dmtT=0.45;o.mntT=0;}}
// ลำแสงบนไม้กวาด: แกนขาวสว่าง + ขอบสีสาย หดบางลงแล้วจางใน ~0.25 วิ • สายฟ้าเพิ่มเส้นหยัก
function broomBeamFx(ev){
  const c=(PATHS[ev.c]||PATHS[0]).col;
  const a=new THREE.Vector3(tx(ev.x),ev.h+GY(ev.x,ev.y),tz(ev.y)),b=new THREE.Vector3(tx(ev.x2),ev.h2+GY(ev.x2,ev.y2),tz(ev.y2));
  const o=PM3.get(ev.id);if(o){o.castT=0.2;const t=o.tip&&o.tip.getWorldPosition?o.tip.getWorldPosition(new THREE.Vector3()):null;if(t&&t.distanceTo(a)<2.5)a.copy(t);}
  const L=a.distanceTo(b);if(L<0.2)return;
  for(const [w,col,k] of [[0.07,'#ffffff',1.5],[0.2,c,1.0],[0.45,c,0.3]]){
    const m=new THREE.Mesh(_bbGeo,new THREE.MeshBasicMaterial({color:hdr(col,k),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    m.position.copy(a);m.lookAt(b);m.scale.set(w,w,L);scene.add(m);BBEAM.push({m,w,life:0.3,max:0.3});
  }
  if(ev.c===2)FX.bolt(ev.x,ev.y,ev.h,ev.x2,ev.y2,ev.h2,0.18,c);
  FX.flashSprite(ev.x,ev.y,ev.h,c,0.3,0.9,0.12,1.2);
  FX.flashSprite(ev.x2,ev.y2,ev.h2,c,0.4,ev.ht?2.2:1.3,0.2,1.5);
  burst(ev.x2,ev.y2,c,ev.ht?14:7,ev.ht?170:90,0.35,1.8,{h:ev.h2});
  snd(ev.c===2?'zap':ev.c===0?'cast_fire':'cast_bolt',ev);
}
// สกิลบนไม้กวาดที่ค้างอยู่ (bb[1] จากโฮสต์): 1 Afterburner ไฟพ่นท้าย • 2 ลมเลี้ยวแคบ เส้นลมสองข้าง • 4 ชาร์จสายฟ้า • 8 พุ่งสายฟ้า
function broomSkFx(o,p,dt,now){
  const f=p.bb?p.bb[1]|0:0;
  if(f&1&&!o.abG){o.abG=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:hdr('#ff7a2a',2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));o.abG.position.z=-1.9;o.broom.add(o.abG);}
  if(o.abG){o.abG.visible=!!(f&1);if(f&1)o.abG.scale.setScalar(1.3+Math.random()*0.5);}
  if(!f)return;
  const ha=o.fhS!==undefined?o.fhS:p.a,c=Math.cos(ha),s=Math.sin(ha),H=(p.z||0)+0.8;
  if(f&1){for(let i=0;i<6;i++){const sp=rnd(160,320);PARTS.push({x:p.x-c*40+rnd(-5,5),y:p.y-s*40+rnd(-5,5),h:H+rnd(-0.15,0.15),vx:-c*sp+rnd(-30,30),vy:-s*sp+rnd(-30,30),vh:rnd(-0.3,0.8),life:rnd(0.25,0.45),max:0.45,col:i%3===0?'#ffe08a':i%3===1?'#ff7a2a':'#ff4a1a',size:rnd(3.5,6),g:-1.5,drag:3});}
    if(Math.random()<0.3)smoke(p.x-c*60,p.y-s*60,H,1,'#4a4048',0.6,5,40);}
  if(f&2&&Math.random()<0.8)for(const sd of [-1,1])PARTS.push({x:p.x-s*sd*22-c*10,y:p.y+c*sd*22-s*10,h:H+0.3,vx:-c*220,vy:-s*220,vh:0,life:0.3,max:0.3,col:'#bfffd0',size:1.6,g:0,drag:1});
  if(f&4){o.lsT=(o.lsT||0)-dt;if(o.lsT<=0){o.lsT=0.07;const a=rnd(0,6.283),r=rnd(25,45);FX.bolt(p.x,p.y,H+0.4,p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,H+rnd(-0.6,1.2),0.08,'#ffe27a');}
    PARTS.push({x:p.x+rnd(-20,20),y:p.y+rnd(-20,20),h:H+rnd(0,1.4),vx:0,vy:0,vh:rnd(0.5,1.5),life:0.25,max:0.25,col:'#fff6b0',size:1.8,g:0});}
  if(f&8)for(let i=0;i<4;i++)PARTS.push({x:p.x+rnd(-10,10),y:p.y+rnd(-10,10),h:H+rnd(0,1),vx:0,vy:0,vh:0,life:0.3,max:0.3,col:i%2?'#ffe27a':'#ffffff',size:2.6,g:0});
}
function broomStrikeFx(ev){
  FX.bolt(ev.x,ev.y,ev.h,ev.x2,ev.y2,ev.h2,0.3,'#ffe27a');FX.bolt(ev.x,ev.y,ev.h,ev.x2,ev.y2,ev.h2,0.22,'#ffffff');
  FX.flashSprite(ev.x,ev.y,ev.h,'#ffe27a',0.6,2.4+ev.k*1.5,0.25,1.6);FX.flashLight(ev.x,ev.y,ev.h+0.5,'#ffe27a',6,10,0.25);
  burst(ev.x,ev.y,'#fff27a',18,220,0.35,2,{h:ev.h});snd('zap',ev);snd('dash',ev);
}
function broomFlakFx(ev){
  for(let i=0;i<22;i++){const b=ev.a+rnd(-0.55,0.55),sp=rnd(150,380);PARTS.push({x:ev.x,y:ev.y,h:ev.h,vx:Math.cos(b)*sp,vy:Math.sin(b)*sp,vh:rnd(-1,2.5),life:rnd(0.3,0.6),max:0.6,col:i%3?'#c9a36a':'#8a6a44',size:rnd(2,3.4),g:4,drag:2});}
  smoke(ev.x,ev.y,0.15,8,'#9a8466',0.7,4,120);FX.flashSprite(ev.x,ev.y,ev.h,'#ffd9a0',0.4,1.8,0.18,1.4);snd('break',ev);
}
// ข้อความสกิลบนไม้กวาดใต้จอ (js/38)
function broomHud(me){const m=VIEW.cur&&VIEW.cur.mode;if(m==='quid'||m==='race')return '';const t=broomHudT(me);return t?'  •  '+t:'';}
function broomHudT(me){
  const k=getKit(me.id).path,b=me.bb||[0,0],v=b[0]|0,f=b[1]|0,cd=n=>n>0?` (${n} วิ)`:' พร้อม';
  if(k===0)return `🔥 Shift Afterburner ${v}/100${f&1?' 🔥':''}`;
  if(k===1)return `❄️ E Ice Barrage${cd(v)}`;
  if(k===2)return f&4?`⚡ ชาร์จ ${v}% — ปล่อย Shift เพื่อพุ่ง`:`⚡ Shift Lightning Strike${cd(v)}`;
  if(k===EARTH)return `🪨 E Flak${cd(v)}`;
  if(k===WINDP)return `🌪️ Shift Maneuver${f&2?' ✓':''}`;
  return '';
}
function broomTick(dt){
  for(let i=BBEAM.length-1;i>=0;i--){const B=BBEAM[i];B.life-=dt;
    if(B.life<=0){scene.remove(B.m);B.m.material.dispose();BBEAM.splice(i,1);continue;}
    const t=B.life/B.max,w=B.w*(0.35+0.65*t);B.m.scale.x=B.m.scale.y=w;B.m.material.opacity=Math.min(1,t*1.6);}
}
