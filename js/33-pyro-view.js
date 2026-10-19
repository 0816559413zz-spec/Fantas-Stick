// ---------- ภาพของสายไฟ (pyroFX: ชาร์จ/พุ่ง/ดีดนิ้ว/กลายร่าง/Dragonfall/Colossus) + ตัวช่วย sync ----------
// ---------- sync ตัวละคร/ศัตรู/ลูกเวท กับ snapshot ----------
function localVel(o,x,z,dt,rotY){
  if(o.lx===null||!Number.isFinite(o.lx+o.lz+o.svx+o.svz)){o.lx=x;o.lz=z;o.svx=o.svz=0;}
  const k=1-Math.exp(-12*dt),ivx=(x-o.lx)/Math.max(dt,0.001),ivz=(z-o.lz)/Math.max(dt,0.001);
  const big=Math.hypot(ivx,ivz)>60;
  o.svx+=((big?0:ivx)-o.svx)*k;o.svz+=((big?0:ivz)-o.svz)*k;o.lx=x;o.lz=z;
  const c=Math.cos(rotY),s=Math.sin(rotY);
  return {lvx:o.svx*c-o.svz*s,lvz:o.svx*s+o.svz*c,sp:Math.hypot(o.svx,o.svz)};
}
// ---------- ภาพของสายไฟ: ชาร์จลูกไฟ / ย่อตัวชาร์จพุ่ง / วงเวทพ่นไฟ / ดีดนิ้ว / กลายร่าง / ร่างยักษ์ไฟ ----------
const _pw=new THREE.Vector3();
function simOf(v){return {x:v.x*20+MW/2,y:v.z*20+MH/2,h:v.y};}
function makeColossus(){
  // ร่างยักษ์ไฟแบบซูซาโนโอะของซาสึเกะ: ใส่เกราะซามูไรทั้งตัว (อกเกราะ เกราะท้องเป็นชั้น กระโปรงเกราะ
  // บ่าซ้อนชั้น ปลอกแขน หมวกเกราะมีเขาแหลมยื่นหน้า ตาเรืองแสง) + คันธนูยักษ์และลูกศรไฟ
  // แต่ละชิ้น = เนื้อเกราะส้มโปร่ง + ขอบเรืองแสง (ชิ้นเดียวกันขยาย 6% ด้านใน)
  const g=new THREE.Group(),A=THREE.AdditiveBlending;
  const body=new THREE.MeshBasicMaterial({color:'#b8360a',transparent:true,opacity:0.55,depthWrite:false,side:THREE.DoubleSide});
  const dark=new THREE.MeshBasicMaterial({color:'#7a1e06',transparent:true,opacity:0.6,depthWrite:false,side:THREE.DoubleSide});
  const rim=new THREE.MeshBasicMaterial({color:hdr('#ff8a2a',1.0),transparent:true,opacity:0.35,blending:A,depthWrite:false,side:THREE.BackSide});
  const part=(geo,x,y,z,rx,ry,rz,sx,sy,sz,m,par)=>{const P=par||g,o=new THREE.Group();o.position.set(x,y,z);o.rotation.set(rx||0,ry||0,rz||0);o.scale.set(sx||1,sy||1,sz||1);
    o.add(new THREE.Mesh(geo,m||body));const r=new THREE.Mesh(geo,rim);r.scale.setScalar(1.06);o.add(r);P.add(o);return o;};
  const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d),cyl=(a,b,h,n)=>new THREE.CylinderGeometry(a,b,h,n||8);
  // อกเกราะ (หกเหลี่ยม) + แผ่นอกหน้า
  part(cyl(1.55,1.05,2.2,6),0,4.2,0,0,Math.PI/6,0,1,1,0.75);
  part(box(1.9,1.3,0.25),0,4.5,0.95,-0.12,0,0,1,1,1,dark);
  // เกราะท้องเป็นชั้นๆ
  for(let i=0;i<3;i++)part(cyl(1.08-i*0.04,1.12-i*0.04,0.34,8),0,2.85-i*0.38,0,0,0,0,1,1,0.78,i%2?dark:body);
  // กระโปรงเกราะ (คุซาซูริ) 6 แผ่นบานออก
  for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2+Math.PI/6;part(box(0.9,1.3,0.12),Math.sin(a)*1.05,1.35,Math.cos(a)*0.85,0.32*Math.cos(a),a,0.32*-Math.sin(a)*0,1,1,1,i%2?dark:body);}
  // บ่าเกราะซ้อน 3 ชั้น + แขน + ปลอกแขน + ถุงมือ
  for(const s of [-1,1]){
    for(let k=0;k<3;k++)part(box(1.5-k*0.15,0.16,1.3-k*0.1),s*(1.75+k*0.12),5.15-k*0.32,0,0,0,s*(0.5+k*0.08),1,1,1,k%2?dark:body);
    part(cyl(0.38,0.32,1.6,8),s*2.0,4.0,0.35,0.9,0,s*0.3);
    part(cyl(0.48,0.36,1.7,8),s*1.45,3.6,1.45,Math.PI/2,0,-s*0.3,1,1,1,dark);
    part(box(0.55,0.4,0.6),s*1.05,3.55,2.25);
  }
  // หมวกเกราะ: หัว + โดม + เขาแหลมยื่นหน้า (แบบซาสึเกะ) + ปีกข้าง + ที่กันคาง
  const head=new THREE.Group();head.position.set(0,6.05,0.1);g.add(head);
  part(new THREE.SphereGeometry(0.72,14,10),0,0,0,0,0,0,1,1.05,1.1,dark,head);
  part(new THREE.SphereGeometry(0.85,14,10,0,Math.PI*2,0,Math.PI/2),0,0.12,-0.05,0,0,0,1.05,1,1.15,body,head);
  part(new THREE.ConeGeometry(0.22,2.2,6),0,0.55,1.25,Math.PI/2.4,0,0,1,1,1,body,head);
  part(box(0.9,0.35,0.6),0,-0.6,0.45,0.25,0,0,1,1,1,body,head);
  for(const s of [-1,1]){
    part(box(0.12,0.8,0.9),s*0.92,-0.05,-0.1,0,0,s*0.35,1,1,1,body,head);
    part(new THREE.ConeGeometry(0.12,1.2,5),s*0.55,0.95,0.1,0.2,0,-s*0.6,1,1,1,body,head);
    const eye=new THREE.Mesh(new THREE.SphereGeometry(0.13,10,8),new THREE.MeshBasicMaterial({color:hdr('#fff2a0',4)}));eye.scale.set(1.6,0.7,0.6);eye.position.set(s*0.3,0.05,0.74);head.add(eye);
    const eg=new THREE.Sprite(glowMat('#ffd27a',1.6));eg.scale.setScalar(0.7);eg.position.set(s*0.3,0.05,0.82);head.add(eg);
  }
  // หน้าไม้ไฟ จับในมือทั้งสองข้าง: ราง (stock) ยาวตามแนวเล็ง + คันโค้งขวาง + สาย + ลูกดอกไฟบนราง
  const bow=new THREE.Group();bow.position.set(0,3.6,2.4);g.add(bow);
  const glowM=c=>new THREE.MeshBasicMaterial({color:hdr(c,1.2),transparent:true,opacity:0.85,blending:A,depthWrite:false});
  const stock=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.35,3.4),body);stock.position.z=0.6;bow.add(stock);
  const stR=new THREE.Mesh(new THREE.BoxGeometry(0.44,0.39,3.5),rim);stR.position.z=0.6;bow.add(stR);
  const prod=new THREE.Mesh(new THREE.TorusGeometry(2.1,0.13,6,30,Math.PI*0.75),glowM('#ffc04a'));prod.rotation.x=-Math.PI/2;prod.rotation.z=Math.PI*0.125+Math.PI/2;prod.position.z=0.9;bow.add(prod);
  const str=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,3.9,4),glowM('#ffe0a0'));str.rotation.z=Math.PI/2;str.position.z=-0.7;bow.add(str);
  const arrow=new THREE.Group();bow.add(arrow);
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,3.2,8),new THREE.MeshBasicMaterial({color:hdr('#ffc870',1.5)}));shaft.rotation.x=Math.PI/2;shaft.position.set(0,0.25,0.9);arrow.add(shaft);
  const tipM=new THREE.Mesh(new THREE.ConeGeometry(0.32,1.1,8),new THREE.MeshBasicMaterial({color:hdr('#ffe6a0',2)}));tipM.rotation.x=Math.PI/2;tipM.position.set(0,0.25,2.95);arrow.add(tipM);
  const ag=new THREE.Sprite(glowMat('#ff8a3a',1.2));ag.scale.setScalar(1.6);ag.position.set(0,0.25,2.95);arrow.add(ag);
  g.scale.setScalar(1.25);
  g.userData={head,bow,arrow,bolt:arrow,tipG:ag};
  return g;
}
function makeMagicCircle(){
  const g=new THREE.Group(),A=THREE.AdditiveBlending;
  const r1=new THREE.Mesh(new THREE.RingGeometry(0.62,0.72,48),new THREE.MeshBasicMaterial({color:hdr('#ffb347',2),transparent:true,blending:A,depthWrite:false,side:THREE.DoubleSide}));g.add(r1);
  const r2=new THREE.Mesh(new THREE.RingGeometry(0.38,0.43,6),new THREE.MeshBasicMaterial({color:hdr('#ffd27a',2),transparent:true,blending:A,depthWrite:false,side:THREE.DoubleSide}));g.add(r2);
  const rn=new THREE.Mesh(new THREE.CircleGeometry(0.7,48),new THREE.MeshBasicMaterial({map:runeTex,color:hdr('#ff8a3a',1.6),transparent:true,opacity:0.85,blending:A,depthWrite:false,side:THREE.DoubleSide}));g.add(rn);
  g.userData={r2,rn};return g;
}
function pyroFX(o,p,pz,now,dt){
  const a=p.a||0,ca=Math.cos(a),sa=Math.sin(a);
  o.pyroOn=getKit(p.id).path===0;
  dragonfallFX(o,p,pz,now,dt);
  // ชาร์จลูกไฟ (กดค้าง): อนุภาคไฟถูกดูดเข้ามารวมเป็นลูกไฟที่ปลายไม้ / Kindle พร้อม: ไฟลุกที่ปลายไม้
  // ชาร์จเต็ม: แฟลชครั้งเดียว + วงไฟ บอกว่าเต็มแล้ว
  const cgFull=(p.cg||0)>=1,dcFull=(p.dc||0)>=1;
  if(cgFull&&!o.cgFull){o.tip.getWorldPosition(_pw);const s=simOf(_pw);burst(s.x,s.y,'#ffd27a',26,220,0.35,2.4,{h:s.h,g:0});FX.flashLight(s.x,s.y,s.h,'#ffb347',4,10,0.25);if(p.id===NET.myId)snd('buff');}
  if(dcFull&&!o.dcFull){ring(p.x,p.y,'#ffb347',70,0.4,pz+0.15);burst(p.x,p.y,'#ff7a2a',40,260,0.45,3,{h:pz+0.3,vh:[2,6],g:-1});FX.flashLight(p.x,p.y,pz+0.8,'#ff8a3a',5,12,0.3);if(p.id===NET.myId)snd('buff');}
  o.cgFull=cgFull;o.dcFull=dcFull;
  if(dcFull){for(let i=0;i<4;i++){const an=now/120+i*Math.PI/2;PARTS.push({x:p.x+Math.cos(an)*30,y:p.y+Math.sin(an)*30,h:pz+0.15,vx:0,vy:0,vh:rnd(2.5,4.5),life:0.4,max:0.4,col:i%2?'#ffd27a':'#ff6a1a',size:3.5,g:-1});}}
  if((p.cg||0)>0||p.kd>0){
    if(p.cg>0){o.armR.rotation.x=-1.45;o.armR.rotation.z=-0.15;o.armR.updateMatrixWorld(true);}
    o.tip.getWorldPosition(_pw);const s=simOf(_pw),k=p.kd>0?1:p.cg,full=k>=1;
    for(let i=0;i<2+Math.floor(k*2);i++){const an=rnd(0,6.283),r=rnd(25,55),hv=rnd(-0.9,0.9);
      PARTS.push({x:s.x+Math.cos(an)*r,y:s.y+Math.sin(an)*r,h:s.h+hv,vx:-Math.cos(an)*r/0.28,vy:-Math.sin(an)*r/0.28,vh:-hv/0.28,life:0.28,max:0.28,col:i%2?'#ffd27a':'#fff0b0',size:rnd(1.2,2),g:0,drag:0});}
    // เปลวส้มแดงวนรอบแกน
    for(let i=0;i<3;i++){const an=now/70+i*2.094,rr=10+8*(1-k);flame(s.x+Math.cos(an)*rr,s.y+Math.sin(an)*rr,s.h-0.15+Math.sin(an*1.7)*0.15,{vx:-Math.sin(an)*rr*8,vy:Math.cos(an)*rr*8,vh:0.6,life:0.16,size:3+k*3,g:0,col:'#ffd0b0'});}
    if(!o.fball){o.fball=new THREE.Sprite(glowMat('#ffd27a',2.6));scene.add(o.fball);o.fcore=new THREE.Sprite(glowMat('#fffbe8',3.2));o.fball.add(o.fcore);o.fcore.scale.setScalar(0.45);(o.g.userData.extra||(o.g.userData.extra=[])).push(o.fball);}
    o.fball.visible=true;o.fball.position.copy(_pw);o.fball.scale.setScalar(full?1.55*(1+0.22*Math.sin(now/70)):(0.25+k*0.9)*(1+0.1*Math.sin(now/40)));
    if(full){
      // เต็มแล้ว: ไฟลุกพุ่งขึ้นจากมือ + วงไฟเต้นที่เท้า
      for(let i=0;i<2;i++)flame(s.x+rnd(-5,5),s.y+rnd(-5,5),s.h-0.1,{vh:rnd(2,3.5),life:0.3,size:rnd(4,6),g:-2});
      // ชาร์จเต็ม: เปลวไฟพุ่งขึ้นจากใต้เท้า
      for(let i=0;i<4;i++){const an=rnd(0,6.283),rr=rnd(8,24);flame(p.x+Math.cos(an)*rr,p.y+Math.sin(an)*rr,pz+0.05,{vh:rnd(5,8),life:rnd(0.3,0.45),size:rnd(6,9),g:-2.5});}
    }
    if(full)for(let i=0;i<3;i++){const an=now/90+i*2.094;PARTS.push({x:s.x+Math.cos(an)*14,y:s.y+Math.sin(an)*14,h:s.h+Math.sin(an*1.3)*0.5,vx:0,vy:0,vh:rnd(0.5,1.5),life:0.3,max:0.3,col:i?'#ffd27a':'#fff4c8',size:2.8,g:-1});}
    LREQ.push({abs:1,x:_pw.x,y:_pw.y,z:_pw.z,col:'#ff8a3a',int:0.8+k*2,dist:8});
  }else if(o.fball)o.fball.visible=false;
  // พุ่ง: ตัวเอนไปข้างหน้า หางไฟหนา เศษถ่าน/ประกายแตกออกสองข้าง • จบด้วยไฟปะทุเล็ก ๆ ที่จุดลง
  if(p.ds&&o.pyroOn){o.b.rotation.x=0.55;o.armR.rotation.x=0.9;o.armL.rotation.x=0.9;o.legs[0].rotation.x=0.5;o.legs[1].rotation.x=-0.3;
    for(let i=0;i<4;i++)flame(p.x-ca*rnd(10,40)+rnd(-8,8),p.y-sa*rnd(10,40)+rnd(-8,8),pz+rnd(0.3,1.6),{vx:-ca*rnd(100,200),vy:-sa*rnd(100,200),vh:rnd(0.5,2),life:rnd(0.25,0.4),size:rnd(9,13),drag:4});
    for(const sd of [-1,1])for(let i=0;i<2;i++)PARTS.push({x:p.x+rnd(-6,6),y:p.y+rnd(-6,6),h:pz+rnd(0.3,1.5),vx:-sa*sd*rnd(180,320)-ca*80,vy:ca*sd*rnd(180,320)-sa*80,vh:rnd(0,3),life:rnd(0.25,0.45),max:0.45,col:i?'#ffd27a':'#ff7a2a',size:rnd(1.4,2.2),g:6,drag:2});
    LREQ.push({x:tx(p.x),y:pz+1,z:tz(p.y),col:'#ff7a2a',int:3,dist:10});}
  if(o.pyroOn&&o.wasDs&&!p.ds){ring(p.x,p.y,'#ffb347',50,0.3,pz+0.1);for(let i=0;i<12;i++){const an=i/12*6.283;flame(p.x+Math.cos(an)*12,p.y+Math.sin(an)*12,pz+0.05,{vx:Math.cos(an)*160,vy:Math.sin(an)*160,vh:rnd(2,4),life:0.3,size:rnd(6,9),drag:5});}}
  o.wasDs=!!p.ds;
  // ชาร์จพุ่ง: ย่อตัวทำท่าพร้อมวิ่ง ไฟสะสมที่เท้า
  if(p.dc>0){
    const k=Math.min(1,p.dc);
    o.b.rotation.x=0.3+0.55*k;o.b.position.y=-0.12-0.38*k;
    o.legs[0].rotation.x=-0.5-0.8*k;o.legs[1].rotation.x=0.4+0.7*k;
    o.armL.rotation.x=0.3+0.5*k;o.armL.rotation.z=0.3;o.armR.rotation.x=0.4+0.6*k;o.armR.rotation.z=-0.3;
    for(let i=0;i<1+Math.floor(k*4);i++){const r=rnd(8,18+k*20),an=rnd(0,6.283);PARTS.push({x:p.x-ca*14+Math.cos(an)*r,y:p.y-sa*14+Math.sin(an)*r,h:pz+0.1,vx:0,vy:0,vh:rnd(0.6,1.8+k*2),life:0.45,max:0.45,col:Math.random()<0.5?'#ff7a2a':'#ffc04a',size:2+k*2,g:-1});}
    if(Math.random()<0.3)LREQ.push({x:tx(p.x),y:pz+0.4,z:tz(p.y),col:'#ff7a2a',int:1+k*2,dist:8});
  }
  // Dragon's Breath: วงเวทกลมเล็กด้านหน้า แล้วพ่นไฟ
  if(p.bm){
    if(!o.mcirc){o.mcirc=makeMagicCircle();o.g.add(o.mcirc);}
    o.mcirc.visible=true;o.mcirc.position.set(0,1.35,0.95);
    o.mcAge=(o.mcAge||0)+dt;const grow=Math.min(1,o.mcAge/0.4);o.mcirc.scale.setScalar(0.3+0.7*grow);
    o.mcirc.userData.rn.rotation.z=now/350;o.mcirc.userData.r2.rotation.z=-now/220;
    o.armR.rotation.x=-1.55;
    if(p.bm===2){
      o.mcirc.getWorldPosition(_pw);const s=simOf(_pw);
      // เปลวไฟจริง: ก้อนไฟหนาๆ พองขึ้นเรื่อยๆ ใกล้ปากวง = เหลืองขาว ไกลออกไป = ส้มแดง แล้วกลายเป็นควัน (ระยะ ~300 ตรงกับดาเมจ)
      for(let i=0;i<22;i++){const sp=rnd(560,700),da=rnd(-0.17,0.17),f=Math.random();
        PARTS.push({x:s.x+ca*sp*f*0.05,y:s.y+sa*sp*f*0.05,h:s.h+rnd(-0.1,0.1),vx:Math.cos(a+da)*sp,vy:Math.sin(a+da)*sp,vh:rnd(-0.2,1.2),life:rnd(0.5,0.6),max:0.6,col:i<2?'#fff4c8':i<6?'#ffc04a':i<13?'#ff7a22':'#e83a10',size:rnd(6,9)*(i<4?0.65:1),g:-2.4,drag:0.6,grow:i<4?1.4:2.8});}
      // ก้อนเปลวแบบทึบ (ไม่ใช่แสงบวก) ให้เห็นชัดแม้พื้นสว่าง เช่นหิมะ
      for(let i=0;i<13;i++){const sp=rnd(540,660),da=rnd(-0.16,0.16);PARTS.push({x:s.x+ca*16,y:s.y+sa*16,h:s.h+rnd(-0.08,0.08),vx:Math.cos(a+da)*sp,vy:Math.sin(a+da)*sp,vh:rnd(0.1,1),life:rnd(0.5,0.58),max:0.58,col:i<3?'#ffb347':i<6?'#ff7a1a':'#e8401a',size:rnd(6,9),g:-2.2,drag:0.6,grow:2.6,smoke:true});}
      // ประกายไฟกระเด็น
      for(let i=0;i<4;i++){const sp=rnd(500,800),da=rnd(-0.3,0.3);PARTS.push({x:s.x,y:s.y,h:s.h,vx:Math.cos(a+da)*sp,vy:Math.sin(a+da)*sp,vh:rnd(0,3),life:rnd(0.3,0.5),max:0.5,col:'#fff0b0',size:1.6,g:3,drag:1.5});}
      if(Math.random()<0.8)PARTS.push({x:s.x+ca*rnd(170,290),y:s.y+sa*rnd(170,290),h:s.h+rnd(0.2,0.9),vx:ca*70+rnd(-30,30),vy:sa*70+rnd(-30,30),vh:rnd(0.8,1.6),life:1.1,max:1.1,col:'#2a2220',size:9,g:-0.4,smoke:true,grow:1.3,drag:2});
      LREQ.push({x:tx(p.x+ca*130),y:pz+1.3,z:tz(p.y+sa*130),col:'#ff7a2a',int:4.5,dist:16});
    }
  }else if(o.mcirc){o.mcirc.visible=false;o.mcAge=0;}
  // Ignition Snap: ยกมือ เปลวไฟรวมที่นิ้ว
  if(p.sn){
    o.armR.rotation.x=-2.7;o.armR.rotation.z=-0.2;o.armR.updateMatrixWorld(true);
    o.tip.getWorldPosition(_pw);const s=simOf(_pw);
    for(let i=0;i<2;i++)flame(s.x+rnd(-4,4),s.y+rnd(-4,4),s.h-0.1,{vh:rnd(1,2.5),life:0.22,size:rnd(3,5),g:-1});
    // เปลวไฟจากศัตรูที่ติด Burning ไหลเป็นเส้นโค้งมารวมที่ปลายนิ้ว + สะเก็ดไฟรอบศัตรูบอกจำนวนชั้น
    const V=VIEW.cur,foes=V?[...(V.P||[]).filter(q=>q.id!==p.id&&q.al&&(q.br|0)>0&&(!(MODES[V.mode]&&MODES[V.mode].team)||q.tm!==p.tm)),...(V.E||[]).filter(e=>(e.br|0)>0)]:[];
    for(const t of foes){const th=(t.z||t.h||0)+1.3;if(Math.hypot(t.x-p.x,t.y-p.y)>500)continue;
      const mx=(t.x+s.x)/2-(s.y-t.y)*0.25,my=(t.y+s.y)/2+(s.x-t.x)*0.25,mh=Math.max(th,s.h)+1.2;
      for(let i=0;i<3;i++){const u=Math.random(),iu=1-u,bx=iu*iu*t.x+2*iu*u*mx+u*u*s.x,by=iu*iu*t.y+2*iu*u*my+u*u*s.y,bh=iu*iu*th+2*iu*u*mh+u*u*s.h;
        const dx=2*iu*(mx-t.x)+2*u*(s.x-mx),dy=2*iu*(my-t.y)+2*u*(s.y-my),dh=2*iu*(mh-th)+2*u*(s.h-mh);flame(bx,by,bh-0.15,{vx:dx*1.6,vy:dy*1.6,vh:dh*1.6,life:0.14,size:4,g:0,drag:0});}
      const n=t.br|0;for(let i=0;i<n;i++){const an=now/220+i/n*6.283;PARTS.push({x:t.x+Math.cos(an)*26,y:t.y+Math.sin(an)*26,h:th+0.4,vx:0,vy:0,vh:0,life:0.06,max:0.06,col:'#ffd27a',size:3.2,g:0});}}
    LREQ.push({abs:1,x:_pw.x,y:_pw.y,z:_pw.z,col:'#ffb347',int:2.5,dist:9});
  }
  // ลูกไฟวิญญาณ (จากโล่): อยู่ข้างตัวซ้าย/ขวา เยื้องหลังเล็กน้อย ชิดตัว • แกนสว่าง เปลวพุ่งขึ้นไหวเหมือนไฟจริง หางไฟและสะเก็ด
  {const n=p.ob|0;
    if(n>0&&!o.orbG){o.orbG=new THREE.Group();o.orbM=[];for(let i=0;i<6;i++){const s=new THREE.Sprite(glowMat('#ff8a2a',1.4));s.material.userData.keep=true;s.scale.setScalar(0.62);const c=new THREE.Sprite(glowMat('#fff2c0',3));c.material.userData.keep=true;c.scale.setScalar(0.42);s.add(c);o.orbG.add(s);o.orbM.push(s);}o.g.add(o.orbG);}
    if(o.orbG){o.orbG.visible=n>0;if(n>0){
      o.orbM.forEach((s,i)=>{s.visible=i<n;if(i>=n)return;const sd=i%2?1:-1,row=i>>1;s.position.set(sd*(0.72+row*0.12),1.15+row*0.42+Math.sin(now/260+i)*0.06,-0.32-row*0.12);
        s.getWorldPosition(_pw);const q=simOf(_pw);
        flame(q.x+rnd(-2,2),q.y+rnd(-2,2),q.h-0.18,{vh:rnd(1.5,3),life:rnd(0.18,0.3),size:rnd(4.5,6),g:-1.5});
        if(Math.random()<0.5)PARTS.push({x:q.x+rnd(-4,4),y:q.y+rnd(-4,4),h:q.h,vx:rnd(-20,20),vy:rnd(-20,20),vh:rnd(0.5,2),life:0.3,max:0.3,col:Math.random()<0.5?'#ffd27a':'#ff7a2a',size:1.4,g:-1});});}}
  }
  // Kindle ลอยเล็ง: ขาหน้าพับยกเข่าขึ้น (ชายผ้าหน้าเปิดตาม) ขาหลังเหยียดลง ยื่นไม้ไปข้างหน้า มือซ้ายประคอง (แบบ Freja) — ค่อยๆ เข้า/ออกท่า
  {const on=p.hv&&p.kd>0;o.kAimK=(o.kAimK||0)+((on?1:0)-(o.kAimK||0))*Math.min(1,dt*12);const k=o.kAimK;
    if(o.cloak)o.cloak.kick=k>0.01?k:0;
    if(k>0.01){o.legs[0].rotation.x=lerp(o.legs[0].rotation.x,-1.45,k);o.legs[0].scale.y=lerp(1,0.6,k);o.legs[1].rotation.x=lerp(o.legs[1].rotation.x,0.12,k);o.legs[1].scale.y=lerp(1,1.08,k);o.b.rotation.x=lerp(o.b.rotation.x,-0.12,k);
      o.armR.rotation.x=lerp(o.armR.rotation.x,-1.55,k);o.armR.rotation.z=lerp(o.armR.rotation.z,-0.06,k);o.armL.rotation.x=lerp(o.armL.rotation.x,-1.3,k);o.armL.rotation.z=lerp(o.armL.rotation.z,0.55,k);}
    else if(o.legs[0].scale.y!==1){o.legs[0].scale.y=o.legs[1].scale.y=1;}}
  // Kindle ลอยกลางอากาศ: ไฟพ่นลงจากใต้เท้า
  if(p.hv){for(let i=0;i<4;i++)PARTS.push({x:p.x+rnd(-8,8),y:p.y+rnd(-8,8),h:pz+rnd(-0.1,0.2),vx:rnd(-20,20),vy:rnd(-20,20),vh:rnd(-5,-2.5),life:rnd(0.25,0.4),max:0.4,col:i?'#ff8a2a':'#ffe08a',size:rnd(2.4,3.6),g:2,drag:2,smoke:i===3});LREQ.push({x:tx(p.x),y:pz,z:tz(p.y),col:'#ff8a3a',int:2,dist:8});}
  // Blazeform: ออร่าไฟรอบตัว + ขอบวงบอกระยะ (~180)
  if((p.fm|0)&131072){
    if(!o.blzR){o.blzR=new THREE.Mesh(_iceEdge,new THREE.MeshBasicMaterial({color:hdr('#ff7a2a',1.5),transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false}));o.blzR.scale.setScalar(130*S3);o.g.add(o.blzR);
      o.blzD=new THREE.Mesh(_iceDisc,new THREE.MeshBasicMaterial({color:hdr('#ff5a1a',1),transparent:true,opacity:0.1,blending:THREE.AdditiveBlending,depthWrite:false}));o.blzD.scale.setScalar(130*S3);o.g.add(o.blzD);}
    o.blzR.visible=o.blzD.visible=true;o.blzR.position.y=0.07;o.blzD.position.y=0.06;o.blzR.material.opacity=0.6+0.25*Math.sin(now/120);
    for(let i=0;i<3;i++){const an=rnd(0,6.283);PARTS.push({x:p.x+Math.cos(an)*130,y:p.y+Math.sin(an)*130,h:pz+0.1,vx:0,vy:0,vh:rnd(1.5,3.5),life:rnd(0.35,0.6),max:0.6,col:i?'#ff7a2a':'#ffc04a',size:rnd(2.6,4),g:-1.5,drag:2});}
  }else if(o.blzR)o.blzR.visible=o.blzD.visible=false;
  if((p.fm|0)&131072){
    const hp=[[o.armR,0,-0.66,0],[o.armL,0,-0.66,0],[o.legs[0],0,-0.8,0.05],[o.legs[1],0,-0.8,0.05]];
    // ไฟเด่นที่มือและเท้า + หางไฟบาง ๆ
    for(const [P,lx,ly,lz] of hp){_ev.set(lx,ly,lz);P.localToWorld(_ev);const q=simOf(_ev);flame(q.x+rnd(-2,2),q.y+rnd(-2,2),q.h-0.12,{vx:-(o.svx||0)*0.3,vy:-(o.svz||0)*0.3,vh:rnd(1.2,2.4),life:rnd(0.2,0.3),size:rnd(4,5.5),g:-1.5});
      if(Math.random()<0.3)PARTS.push({x:q.x,y:q.y,h:q.h,vx:rnd(-30,30),vy:rnd(-30,30),vh:rnd(0.5,2),life:0.35,max:0.35,col:'#ffd27a',size:1.3,g:-0.5});}
    // เปลวบาง ๆ ตามลำตัว (ไม่บังตัว)
    if(Math.random()<0.6){_ev.set(rnd(-0.25,0.25),rnd(0.9,1.8),rnd(0.15,0.3));o.b.localToWorld(_ev);const q=simOf(_ev);flame(q.x,q.y,q.h-0.1,{vh:rnd(1,2),life:0.2,size:rnd(3,4),g:-1,col:'#ffe0c0'});}
    // ไฟไต่เป็นเกลียวขึ้นตามแขน และไล่จากเท้าขึ้นขา (ตอนเพิ่งแปลงร่าง)
    if(o.blzIn>0){o.blzIn-=dt;const t=1-o.blzIn/0.6;for(const [P,lx,ly,lz] of hp){for(let i=0;i<2;i++){const u=t*(0.8+0.2*i),an=u*12+i*3;_ev.set(lx+Math.cos(an)*0.12,ly*(1-u),lz+Math.sin(an)*0.12);P.localToWorld(_ev);const q=simOf(_ev);flame(q.x,q.y,q.h-0.1,{vh:1,life:0.25,size:5,g:-1});}}}
    // ทิ้งรอยถ่านไฟบนพื้นตอนวิ่ง
    const lp=o.blzLast||[p.x,p.y];if(Math.hypot(p.x-lp[0],p.y-lp[1])>14){for(let i=0;i<3;i++)PARTS.push({x:p.x+rnd(-8,8),y:p.y+rnd(-8,8),h:pz+0.04,vx:0,vy:0,vh:0,life:rnd(0.8,1.3),max:1.3,col:i?'#ff5a14':'#ffb347',size:rnd(1.4,2.2),g:0});o.blzLast=[p.x,p.y];}else if(!o.blzLast)o.blzLast=[p.x,p.y];
    if(Math.random()<0.5)LREQ.push({x:tx(p.x),y:pz+1.2,z:tz(p.y),col:'#ff7a2a',int:1.8,dist:9});
  }else o.blzLast=null;
  // Inferno Colossus
  if(p.co){
    if(!o.colo){o.colo=makeColossus();o.g.add(o.colo);}
    const c=o.colo,u=c.userData;c.visible=true;c.position.y=-2.4;
    // ตอนแปลงร่าง: เกราะก่อตัวขึ้น (ขยายจากเล็กพร้อมเสาไฟรวมเข้าหาตัว)
    if(!o.coIn&&!o.coOn){o.coIn=0.6;}o.coOn=1;
    if(o.coIn>0){o.coIn-=dt;const k=1-Math.max(0,o.coIn)/0.6;c.scale.setScalar(1.25*(0.35+0.65*k));
      for(let i=0;i<6;i++){const an=i/6*6.283+now/300,rr=lerp(160,40,k);for(let j=0;j<2;j++)flame(p.x+Math.cos(an)*rr,p.y+Math.sin(an)*rr,pz-2+rnd(0,5),{vx:-Math.cos(an)*200,vy:-Math.sin(an)*200,vh:rnd(3,6),life:0.3,size:rnd(12,16),drag:2});}}
    else c.scale.setScalar(1.25);
    // หัวเอียงเข้าหาไหล่แบบนักยิง + หน้าไม้ชี้ตามเป้า (ตัวเราใช้มุมก้มเงยของกล้อง)
    u.head.rotation.y=0.08*Math.sin(now/600);u.head.rotation.z=0.22;u.arrow.visible=p.co>1;
    u.bow.rotation.x=p.id===NET.myId?clamp(pitch*0.9-0.15,-0.6,0.9):0.25;
    // ไฟอัดรวมที่สายและหัวลูกก่อนยิง (สว่างขึ้นภายใน 1 วิ หลังยิงนัดก่อน)
    {const since=(now-(o.colShot||0))/1000,ch=Math.min(1,since/1);u.tipG.scale.setScalar(1+ch*1.6+0.2*Math.sin(now/50));
      if(p.co>1){u.tipG.getWorldPosition(_pw);const q=simOf(_pw);for(let i=0;i<1+Math.round(ch*3);i++){const an=rnd(0,6.283),r=rnd(20,45)*(1.2-ch*0.5);PARTS.push({x:q.x+Math.cos(an)*r,y:q.y+Math.sin(an)*r,h:q.h+rnd(-0.8,0.8),vx:-Math.cos(an)*r*4,vy:-Math.sin(an)*r*4,vh:0,life:0.22,max:0.22,col:i%2?'#ffd27a':'#ff7a2a',size:2.4,g:0,drag:0});}}}
    // ดวงตายักษ์ลุกไฟสว่าง + อนุภาค
    for(const sd of [-1,1]){_ev.set(sd*0.3,0.05,0.8);u.head.localToWorld(_ev);const q=simOf(_ev);flame(q.x,q.y,q.h-0.1,{vh:rnd(2,4),life:0.2,size:rnd(5,8),g:-2});PARTS.push({x:q.x,y:q.y,h:q.h,vx:rnd(-40,40),vy:rnd(-40,40),vh:rnd(1,3),life:0.3,max:0.3,col:'#fff2a0',size:1.6,g:-1});}
    // เปลวไฟท่วมทั้งร่าง: อนุภาคไฟลุกตามรูปร่าง (ลำตัว หัว ไหล่ แขน) แล้วลอยขึ้นเป็นเปลว — ไม่ใช้วงทึบ
    const fw=Math.cos(p.a||0),fs=Math.sin(p.a||0),rx=-fs,ry=fw,SC=1.25*20;
    const pts=[[0,1.6,-0.4,1.1],[0,3.2,-0.4,1.5],[0,4.4,-0.4,1.4],[0,5.7,-0.2,0.9],[-1.9,4.3,0.3,0.6],[1.9,4.3,0.3,0.6],[-1.4,3.7,1.4,0.5],[1.4,3.7,1.4,0.5],[0,0.6,-0.4,1.3]];
    for(let i=0;i<34;i++){const q=pts[i%pts.length],an=rnd(0,6.283),rr=Math.sqrt(Math.random())*q[3]*SC,ox=q[0]*SC,oz=q[2]*SC;
      const x=p.x+rx*ox+fw*oz+Math.cos(an)*rr,y=p.y+ry*ox+fs*oz+Math.sin(an)*rr,hh=pz-2.4*1.25+q[1]*1.25+rnd(-0.6,0.6);
      PARTS.push({x,y,h:hh,vx:rnd(-14,14),vy:rnd(-14,14),vh:rnd(2.5,5.5),life:rnd(0.45,0.8),max:0.8,col:i%6===0?'#ffe08a':i%3===0?'#ff9a3a':i%2?'#ff5a14':'#e8401a',size:rnd(7,12),g:-2.2,drag:2,grow:1.1,smoke:i%2===1});}
    // ลิ้นไฟสูงๆ ที่ขอบร่าง
    for(let i=0;i<4;i++){const an=rnd(0,6.283),rr=rnd(55,75);PARTS.push({x:p.x+Math.cos(an)*rr,y:p.y+Math.sin(an)*rr,h:pz+rnd(-2.5,3),vx:0,vy:0,vh:rnd(5,8),life:rnd(0.3,0.5),max:0.5,col:i%2?'#ff7a2a':'#ffb347',size:rnd(3,5),g:-2,drag:2,smoke:i%2===0});}
    // ลูกศรไฟ: ไฟลุกตามลูกศร
    if(p.co>1){const ax=p.x+fw*58,ay=p.y+fs*58;for(let i=0;i<3;i++){const t=Math.random();PARTS.push({x:ax+fw*t*90,y:ay+fs*t*90,h:pz+2.4+rnd(-0.15,0.15),vx:rnd(-10,10),vy:rnd(-10,10),vh:rnd(1,2.5),life:0.35,max:0.35,col:i?'#ffb347':'#fff0b0',size:rnd(3,5),g:-1});}}
    LREQ.push({x:tx(p.x),y:pz+2,z:tz(p.y),col:'#ff6a2a',int:3,dist:20});
  }else{if(o.colo)o.colo.visible=false;o.coOn=0;o.coIn=0;}
}
