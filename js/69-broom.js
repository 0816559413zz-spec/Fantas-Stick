// ---------- ไม้กวาด (ผู้ใช้ 2026-10-29): บินแบบเครื่องบิน + ยิงลำแสงตามสาย + อนิเมชันเรียกไม้กวาด ----------
// บังคับ: เมาส์ (กล้อง) = ทิศที่อยากไป + เงย/ก้ม = ไต่ขึ้น/ดิ่งลง • W เร่ง (ค่อยๆ ถึงเร็วสุด) • S เบรก/ถอยช้าๆ • ไม่กด = ร่อนช้าลง
//   A/D สไลด์ข้างเบาๆ • Space/C ขึ้น/ลงตรงๆ ยังใช้ได้ • เลี้ยวเป็นวง: อัตราเลี้ยวจำกัด (เร็ว = วงกว้าง) + ค่อยๆ เพิ่ม/ลดแรงเลี้ยว ไม่หักปุบปับ
// โจมตีบนไม้กวาด: คลิกซ้าย (กดค้างได้) = ลำแสงระยะไกลสีตามสาย • ไม่ใช้กับควิดดิช/แข่ง (โหมดนั้นร่ายเวทปกติ)
// สกิลบนไม้กวาด (อนาคต): ใส่ฟังก์ชันใน BROOM_SK[สาย] = {q(p),e(p),r(p),f(p),x(p)} — ตอนนี้ยังว่าง
const BRM={acc:1.25,drag:0.85,brake:650,back:-140,side:160,turnLo:2.8,turnHi:1.35,turnK:2.4,turnA:4.5,climb:0.9,dz:0.05,vzMax:13,
  rng:950,cd:0.38,dmg:12,w:22};
const BROOM_SK={};
function broomVert(p,inp,dt){
  if(!p.flyOn){p.flyOn=true;p.fh=p.ang;p.fs=0;p.fyr=0;p.fcl=0;}
  let ap=clamp(inp.ap||0,-0.9,0.9);ap=Math.abs(ap)<BRM.dz?0:ap-Math.sign(ap)*BRM.dz;
  p.fcl=ap*BRM.climb;   // มุมไต่ (เงยกล้อง = ขึ้น)
  const tv=clamp(Math.max(0,p.fs)/20*Math.sin(p.fcl),-BRM.vzMax,BRM.vzMax)+(inp.jh?8:0)-(inp.ch?8:0);
  p.vz+=(tv-p.vz)*Math.min(1,5*dt);
  p.z=clamp(p.z+p.vz*dt,0.6,24);
  if((p.z<=0.6&&p.vz<0)||(p.z>=24&&p.vz>0))p.vz=0;
}
// mx,my = ทิศที่กด (โลก, หมุนตามกล้องแล้ว) • spd = เร็วสุดบนไม้กวาด
function broomMove(p,mx,my,spd,canAct,dt){
  const c=Math.cos(p.ang),s=Math.sin(p.ang),f=mx*c+my*s,sd=-mx*s+my*c;
  const k=clamp(p.fs/Math.max(1,spd),0,1);
  if(canAct){const d=angDiff(p.ang,p.fh),mr=BRM.turnLo+(BRM.turnHi-BRM.turnLo)*k,tr=clamp(d*BRM.turnK,-mr,mr);
    p.fyr+=clamp(tr-p.fyr,-BRM.turnA*dt,BRM.turnA*dt);}
  else p.fyr*=Math.exp(-4*dt);
  p.fh=angDiff(p.fh+p.fyr*dt,0);
  if(f>0.2)p.fs+=(spd*f-p.fs)*Math.min(1,BRM.acc*dt);
  else if(f<-0.2)p.fs=Math.max(BRM.back,p.fs-BRM.brake*dt);
  else p.fs*=Math.exp(-BRM.drag*dt);
  const hv=p.fs*Math.cos(p.fcl||0),hc=Math.cos(p.fh),hs=Math.sin(p.fh);
  p.mvx=hc*hv-hs*sd*BRM.side;p.mvy=hs*hv+hc*sd*BRM.side;
  p.x+=p.mvx*dt;p.y+=p.mvy*dt;
}
// โฮสต์: ทุกเฟรมตอนอยู่บนไม้กวาด (นอกควิดดิช/แข่ง)
function broomAct(p,inp,pr,dt){
  p.bbCd=Math.max(0,(p.bbCd||0)-dt);
  if(inp.fire&&p.bbCd<=0){p.bbCd=BRM.cd;broomBeam(p);}
  const S=BROOM_SK[p.pathIdx|0];
  if(S)for(const k of ['q','e','r','f','x'])if(pr[k]&&S[k])S[k](p);
}
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
function broomTick(dt){
  for(let i=BBEAM.length-1;i>=0;i--){const B=BBEAM[i];B.life-=dt;
    if(B.life<=0){scene.remove(B.m);B.m.material.dispose();BBEAM.splice(i,1);continue;}
    const t=B.life/B.max,w=B.w*(0.35+0.65*t);B.m.scale.x=B.m.scale.y=w;B.m.material.opacity=Math.min(1,t*1.6);}
}
