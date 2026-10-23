// ---------- ภาพของสายน้ำแข็ง: ดาบ/ขวานน้ำแข็งที่ปลายไม้ ท่าฟัน โล่อัศวิน ไถล แช่แข็งตัวเอง ออร่า ร่างแยก ----------
function iceMat(op,em){return new THREE.MeshStandardMaterial({color:'#c4e6fa',emissive:em||'#3a8ac0',emissiveIntensity:0.45,roughness:0.5,metalness:0,transparent:true,opacity:op,flatShading:true});}
function iceRim(geo,s){return new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:hdr('#9fe0ff',1.4),transparent:true,opacity:0.35,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.BackSide}));}
function makeIceSword(){
  {const f=fileWeapon('mesh_ice_sword',-0.66,0.5);if(f)return f;}
  // ดาบคริสตัลน้ำแข็ง: ใบดาบหยักเป็นผลึก สันกลางเรืองแสง การ์ดเป็นผลึกเฉียงขึ้น อัญมณีกลาง (จุดหมุน = ในกำมือ)
  const g=new THREE.Group();g.position.set(0,-0.66,0.02);
  {const grip=new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.036,0.3,7),iceMat(0.95,'#2a6a9a'));grip.position.y=0.17;g.add(grip);const pm=new THREE.Mesh(new THREE.OctahedronGeometry(0.06),iceMat(0.95,'#6ac0f0'));pm.position.y=0.34;g.add(pm);}
  const blade0=new THREE.Group();blade0.position.y=-0.04;g.add(blade0);
  const s=new THREE.Shape(),P=[[0.05,0],[0.15,-0.1],[0.11,-0.32],[0.17,-0.46],[0.12,-0.72],[0.16,-0.98],[0.1,-1.28],[0.13,-1.5],[0,-2.0]];
  s.moveTo(-P[0][0],P[0][1]);for(const [px,py] of P)s.lineTo(-px,py);for(let i=P.length-2;i>=0;i--)s.lineTo(P[i][0],P[i][1]);
  const geo=new THREE.ExtrudeGeometry(s,{depth:0.03,bevelEnabled:true,bevelThickness:0.03,bevelSize:0.022,bevelSegments:1});geo.translate(0,0,-0.015);
  const blade=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:'#e6f8ff',emissive:'#3a90d0',emissiveIntensity:0.45,roughness:0.45,metalness:0,transparent:true,opacity:0.86,flatShading:true}));blade0.add(blade);
  const rim=iceRim(geo);rim.scale.set(1.12,1.03,1.6);blade0.add(rim);
  const core=new THREE.Mesh(new THREE.BoxGeometry(0.02,1.75,0.075),new THREE.MeshBasicMaterial({color:hdr('#cfefff',2),transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false}));core.position.y=-0.92;blade0.add(core);
  const gm=iceMat(0.95,'#5ab8f0');
  for(const sd of [-1,1]){const q=new THREE.Mesh(new THREE.OctahedronGeometry(0.1),gm);q.scale.set(2.6,0.7,0.8);q.position.set(sd*0.24,0.02,0);q.rotation.z=sd*0.45;g.add(q);
    const sh=new THREE.Mesh(new THREE.ConeGeometry(0.035,0.24,4),gm);sh.position.set(sd*0.42,0.12,0);sh.rotation.z=-sd*0.6;g.add(sh);}
  const gem=new THREE.Mesh(new THREE.OctahedronGeometry(0.075),new THREE.MeshBasicMaterial({color:hdr('#7fe0ff',2.4)}));gem.position.set(0,0,0.04);g.add(gem);
  const gl=new THREE.Sprite(glowMat('#8fe0ff',1.2));gl.scale.setScalar(0.45);g.add(gl);
  return g;
}
function makeIceAxe(){
  {const f=fileWeapon('mesh_ice_axe',-0.45,0.9,-1.55);if(f)return f;}
  // ขวานศึกน้ำแข็งสองคม: ด้ามยาวพันคาด ใบขวานพระจันทร์เสี้ยวสองข้าง หนามบน/ล่าง อัญมณีกลางหัว (จุดหมุน = ในกำมือ ด้ามยื่นเลยมือนิดหน่อย)
  const g=new THREE.Group();g.position.set(0,-0.45,0.02);
  const hm=iceMat(0.92,'#2a6a9a');
  const haft=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.045,1.75,7),hm);haft.position.y=-0.85;g.add(haft);
  for(let i=0;i<4;i++){const w=new THREE.Mesh(new THREE.TorusGeometry(0.05,0.014,5,10),iceMat(0.95,'#6ac0f0'));w.rotation.x=Math.PI/2;w.position.y=-0.1-i*0.09;g.add(w);}
  const s=new THREE.Shape();s.moveTo(0.04,0.2);s.quadraticCurveTo(0.32,0.42,0.66,0.62);s.quadraticCurveTo(0.48,0.18,0.52,0);s.quadraticCurveTo(0.48,-0.18,0.66,-0.62);s.quadraticCurveTo(0.32,-0.42,0.04,-0.2);s.lineTo(0.04,0.2);
  const geo=new THREE.ExtrudeGeometry(s,{depth:0.04,bevelEnabled:true,bevelThickness:0.03,bevelSize:0.03,bevelSegments:1});geo.translate(0,0,-0.02);
  const bm=new THREE.MeshStandardMaterial({color:'#d0ecfc',emissive:'#3a90d0',emissiveIntensity:0.45,roughness:0.45,metalness:0,transparent:true,opacity:0.88,flatShading:true});
  for(const sd of [1,-1]){const b=new THREE.Mesh(geo,bm);b.position.y=-1.55;b.scale.x=sd;g.add(b);const r=iceRim(geo);r.position.y=-1.55;r.scale.set(sd*1.06,1.06,1.5);g.add(r);}
  const top=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.45,5),hm);top.position.y=-2.05;top.rotation.x=Math.PI;g.add(top);
  const gem=new THREE.Mesh(new THREE.OctahedronGeometry(0.09),new THREE.MeshBasicMaterial({color:hdr('#7fe0ff',2.4)}));gem.position.set(0,-1.55,0.05);g.add(gem);
  const gl=new THREE.Sprite(glowMat('#8fe0ff',1.4));gl.scale.setScalar(0.9);gl.position.y=-1.55;g.add(gl);
  return g;
}
function makeKiteShield(){
  const sh=new THREE.Shape();sh.moveTo(0,0.6);sh.lineTo(0.42,0.42);sh.lineTo(0.36,-0.15);sh.lineTo(0,-0.72);sh.lineTo(-0.36,-0.15);sh.lineTo(-0.42,0.42);sh.lineTo(0,0.6);
  const geo=new THREE.ExtrudeGeometry(sh,{depth:0.06,bevelEnabled:true,bevelSize:0.03,bevelThickness:0.03,bevelSegments:1});geo.translate(0,0,-0.03);
  // แบบ A โล่ว่าวคริสตัล (ผู้ใช้เลือก 2026-10-22): ผลึกใส + แกนฟ้าเย็นข้างใน + ขอบขาวเรือง 2 ชั้น + อัญมณีกลาง • ประกาย/เกล็ด = frost/shield_a
  const g=new THREE.Group();g.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:'#e6f8ff',emissive:'#4aa8e8',emissiveIntensity:0.35,roughness:0.25,metalness:0,transparent:true,opacity:0.62,flatShading:true})));
  const core=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:hdr('#3f9cff',0.9),transparent:true,opacity:0.45,blending:THREE.AdditiveBlending,depthWrite:false}));core.scale.set(0.55,0.6,1.3);g.add(core);
  const rim=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:hdr('#ffffff',1.2),transparent:true,opacity:0.32,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.BackSide}));rim.scale.setScalar(1.07);g.add(rim);
  const rim2=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:hdr('#5fc8ff',1),transparent:true,opacity:0.25,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.BackSide}));rim2.scale.setScalar(1.16);g.add(rim2);
  const boss=new THREE.Mesh(new THREE.OctahedronGeometry(0.11),iceMat(1,'#6ac0f0'));boss.position.z=0.08;g.add(boss);
  g.scale.setScalar(1.15);
  return g;
}
// ---------- อาวุธน้ำแข็งลอย (ผู้ใช้ 2026-10-22: "ร่ายคาถาให้ดาบฟันเอง ระยะเท่าเดิม" • อัลติ = ดาบ/ขวาน 3 เล่มแทนร่างแยก) ----------
// o.fw.g = ลูกของ o.g (หันตามตัว: +z หน้า, -x ขวา, +y ขึ้น) ถือดาบ+ขวาน • ตัวอาวุธ: ด้ามที่จุด 0 ใบชี้ทาง -y หน้าแบนตามแกน z
// ท่าทั้งหมดคิดจาก snapshot เดิม (F[1] นับครั้งฟัน, F[2] จังหวะ, ธง 32 ชาร์จ, ธง 16 อัลติ) → ทุกเครื่องเห็นเหมือนกัน ไม่แก้ protocol • ดาเมจ/ระยะยังเป็นของ host เหมือนเดิม
const FWS=1.3,FWA=[[-2.75,0,1.5],[2.75,0,1.5]];   // ขนาดอาวุธลอย • จุดของเล่มเสริมตอนอัลติ (= mirrorPos ฝั่ง host: หน้า 30 px ข้าง 55 px)
const _fwM=new THREE.Matrix4(),_fwM2=new THREE.Matrix4(),_fwX=new THREE.Vector3(),_fwY=new THREE.Vector3(),_fwZ=new THREE.Vector3(),_fwP=new THREE.Vector3(),_fwS=new THREE.Vector3(FWS,FWS,FWS),_fwQ=new THREE.Quaternion();
const _eo=t=>1-Math.pow(1-t,3),_ei=t=>t*t*t,_ss=t=>t*t*(3-2*t);
// หมุนอาวุธให้ใบชี้ทาง (bx,by,bz) หน้าแบนหันทาง (nx,ny,nz) → _fwQ
function fwAim(bx,by,bz,nx,ny,nz){_fwY.set(-bx,-by,-bz).normalize();_fwZ.set(nx,ny,nz);_fwZ.addScaledVector(_fwY,-_fwZ.dot(_fwY));if(_fwZ.lengthSq()<1e-6)_fwZ.set(1,0,0);_fwZ.normalize();_fwX.crossVectors(_fwY,_fwZ);_fwM.makeBasis(_fwX,_fwY,_fwZ);return _fwQ.setFromRotationMatrix(_fwM);}
function fwWeapons(){const g=new THREE.Group(),sword=makeIceSword(),axe=makeIceAxe();for(const w of [sword,axe]){w.position.set(0,0,0);g.add(w);}g.scale.setScalar(FWS);return {g,sword,axe};}
// ท่าอาวุธ+แขน เก็บใน P: x,y,z = ด้าม (กรอบ o.g) • b = ทิศใบ • n = หน้าแบน • ax/az/ty/tx = แขนขวา/บิดตัว/เอนตัว • strike = กำลังฟันจริง (วางตรง ไม่ไล่นุ่ม)
const FWP={},FWT={};
function fwChop(P,th,ff){const c=Math.cos(th),s=Math.sin(th),L=ff?2.0:1.75;P.x=-0.1;P.y=1.95+c*L;P.z=0.7+s*L;P.bx=0;P.by=c;P.bz=s;P.nx=1;P.ny=0;P.nz=0;}   // สับแนวตั้ง: th 0 = ใบชี้ฟ้า → 2.05 = ปลายแตะพื้นหน้า ~4.7 ม.
function fwSweep(P,ph,h,ff){const s=Math.sin(ph),c=Math.cos(ph),R=ff?2.45:2.1;P.x=R*s;P.y=h;P.z=R*c;P.bx=s;P.by=0.12;P.bz=c;P.nx=0;P.ny=1;P.nz=0;}   // กวาดรอบตัว: ph 0 = หน้า, + = ไปทางซ้าย • ปลายใบถึง ~4.8 ม. (ขวาน ~5.3)
const FF_RISE=0.75;   // Frostforge เปิด: เวลาที่ขวานงอกจากพื้นหมุนขึ้นเข้าที่ (คู่กับ frost/forge_axe)
function fwIdle(P,now,ff,seed){const bob=Math.sin(now/430+seed)*0.09,sw=Math.sin(now/700+seed)*0.12;
  P.x=ff?-1.15:-1.0;P.y=1.5+bob;P.z=0.75;P.bx=-0.2+sw;P.by=0.92;P.bz=0.35;P.nx=1;P.ny=0;P.nz=0.2;P.rate=9;P.strike=false;P.ax=-0.95;P.az=-0.3;P.ty=-0.1;P.tx=0;}
// ท่าฟันคอมโบที่เวลา k (0..1) ของจังหวะ c: 0 = ขวา→ซ้าย (ลงเฉียง) • 1 = ซ้าย→ขวา (ขึ้นเฉียง) • 2 = ยกสูงแล้วสับลงพื้นหน้า (ตรงกับระเบิด slam3) • ขวานง้างนานกว่า หนักกว่า
function fwSwing(P,c,ff,k){P.strike=false;
  if(c===2){
    if(k<0.5){const e=_eo(k/0.5);fwChop(P,lerp(-0.1,-0.45,e),ff);P.y+=0.5*e;P.rate=14;P.ax=lerp(-1.2,-2.95,e);P.tx=lerp(0,-0.25,e);P.az=-0.15;P.ty=-0.05;}
    else if(k<0.62){const e=_ei((k-0.5)/0.12);fwChop(P,lerp(-0.45,2.05,e),ff);P.y+=0.5*(1-e);P.strike=true;P.ax=lerp(-2.95,-0.55,e);P.tx=lerp(-0.25,0.35,e);P.az=-0.1;P.ty=0;}
    else{const e=_eo((k-0.62)/0.38);fwChop(P,2.05-0.25*e,ff);P.rate=lerp(30,8,e);P.ax=lerp(-0.55,-0.95,e);P.tx=lerp(0.35,0,e);P.az=-0.2;P.ty=-0.05;}
    return P;}
  const sd=c===1?-1:1,W=ff?0.32:0.24,S=ff?0.62:0.56,P0=-1.95*sd,P1=1.8*sd,h0=sd>0?2.15:0.85,h1=sd>0?0.95:2.0;
  if(k<W){const e=_eo(k/W);fwSweep(P,P0-0.3*sd*e,lerp(1.6,h0+0.25,e),ff);P.rate=ff?16:22;P.az=lerp(-0.3,-1.15*sd,e);P.ax=lerp(-0.95,-1.4,e);P.ty=lerp(-0.1,-0.45*sd,e);P.tx=0;}
  else if(k<S){const e=_ss((k-W)/(S-W));fwSweep(P,lerp(P0-0.3*sd,P1,e),lerp(h0+0.25,h1,e),ff);P.strike=true;P.az=lerp(-1.15*sd,0.85*sd,e);P.ax=-1.4;P.ty=lerp(-0.45*sd,0.45*sd,e);P.tx=0.05;}
  else{const e=_eo((k-S)/(1-S));fwSweep(P,P1+0.15*sd*e,h1,ff);P.rate=lerp(30,7,e);P.az=lerp(0.85*sd,-0.3,e);P.ax=lerp(-1.4,-0.95,e);P.ty=lerp(0.45*sd,-0.1,e);P.tx=0;}
  return P;}
// เส้นด้ายเวทจากปลายไม้ → ด้ามอาวุธ (บาง ๆ พลิ้ว ไม่ใช่เลเซอร์)
const FWL_N=12;
function fwLink(){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(FWL_N*3),3));
  const l=new THREE.Line(geo,new THREE.LineBasicMaterial({color:hdr('#a8e6ff',1.6),transparent:true,opacity:0.35,blending:THREE.AdditiveBlending,depthWrite:false}));l.frustumCulled=false;l.visible=false;return l;}
// เมทริกซ์โลกของใบอาวุธ W ถ้าอาวุธอยู่ท่า P (ใช้เก็บจุดหางแสงย่อยระหว่างเฟรม ให้โค้งเนียน)
function fwMat(o,W,P,off){fwAim(P.bx,P.by,P.bz,P.nx,P.ny,P.nz);_fwP.set(P.x+(off?off[0]:0),P.y+(off?off[1]:0),P.z+(off?off[2]:0));_fwM2.compose(_fwP,_fwQ,_fwS);_fwM.multiplyMatrices(o.g.matrixWorld,_fwM2);return _fwM.multiply(W.matrix);}
function frostFX(o,p,pz,now,dt){
  const F=p.fr;
  if(!F){if(o.fw)o.fw.g.visible=false;if(o.fwLk)o.fwLk.visible=false;if(o.ishield)o.ishield.visible=false;if(o.cryoM)o.cryoM.visible=false;if(o.cryoFx){fxKill(o.cryoFx);o.cryoFx=null;}if(o.fwx)o.fwx.forEach(c=>{c.g.visible=false;c.on=0;});return;}
  const melee=F[0]===0,flags=F[3]|0,ff=flags&8,fwOn=melee&&!p.fl;
  if(!o.fw){o.fw=fwWeapons();o.g.add(o.fw.g);o.sword=o.fw.sword;o.axe=o.fw.axe;o.fwLk=fwLink();scene.add(o.fwLk);(o.g.userData.extra||(o.g.userData.extra=[])).push(o.fwLk);}
  else if(!o.sword.userData.file&&MODELS.ready.get('mesh_ice_sword')&&MODELS.ready.get('mesh_ice_axe')){   // โมเดลไฟล์โหลดเสร็จทีหลัง → สลับเป็นแบบไฟล์
    for(const k of ['sword','axe']){const old=o[k],nw=k==='sword'?makeIceSword():makeIceAxe();nw.position.set(0,0,0);nw.scale.copy(old.scale);old.parent.add(nw);old.parent.remove(old);disposeTree(old);o[k]=o.fw[k]=nw;}}
  o.fw.g.visible=fwOn;o.sword.visible=!ff;o.axe.visible=!!ff;
  if(o.wandG)o.wandG.visible=true;o.tip.visible=true;   // ถือไม้ตลอด: โหมดประชิดก็ร่ายคาถาบังคับอาวุธลอย
  if(!melee&&!p.fl){o.tip.getWorldPosition(_pw);const q=simOf(_pw);
    for(let i=0;i<3;i++){const an=now/120+i*2.094;PARTS.push({x:q.x+Math.cos(an)*9,y:q.y+Math.sin(an)*9,h:q.h+Math.sin(an*1.5)*0.15,vx:-Math.sin(an)*50,vy:Math.cos(an)*50,vh:0,life:0.08,max:0.08,col:i?'#bfeaff':'#ffffff',size:1.5,g:0});}
    if(ff){if(!o.ffBall){o.ffBall=new THREE.Mesh(new THREE.IcosahedronGeometry(0.22,0),iceFxM());scene.add(o.ffBall);(o.g.userData.extra||(o.g.userData.extra=[])).push(o.ffBall);}
      o.ffBall.visible=true;o.ffBall.position.copy(_pw);o.ffBall.rotation.y=now/400;o.ffBall.rotation.x=now/700;o.ffBall.scale.setScalar(1+0.12*Math.sin(now/90));}
    else if(o.ffBall)o.ffBall.visible=false;}
  else if(o.ffBall)o.ffBall.visible=false;
  // Frostforge โหมดประชิด: หัวขวานงอกจากผลึกน้ำแข็งตามใบ (ตอนเพิ่งเปิด)
  if(ff&&!o.ffWas){o.ffGrow=0.45;o.ffRise=FF_RISE;}o.ffWas=!!ff;
  if(ff&&!o.ffFx)o.ffFx=fxPlay('frost/forge_buff',{x:p.x,y:p.y,h:pz,follow:p.id});else if(!ff&&o.ffFx){fxStop(o.ffFx);o.ffFx=null;}   // วงเวทใต้เท้าระหว่างบัฟ (แบบ B)
  if(ff&&!p.fl)forgeAura(p.x,p.y,pz);   // บัฟ Frostforge ยังอยู่: ผลึก/หมอกลอยขึ้นเบา ๆ
  if(o.ffGrow>0){o.ffGrow-=dt;const k=1-Math.max(0,o.ffGrow)/0.45;if(melee&&o.axe){o.axe.scale.setScalar(0.35+0.65*k);o.axe.getWorldPosition(_pw);const q=simOf(_pw);for(let i=0;i<3;i++)PARTS.push({x:q.x+rnd(-14,14),y:q.y+rnd(-14,14),h:q.h-rnd(0.2,1.2),vx:rnd(-30,30),vy:rnd(-30,30),vh:rnd(0,1.5),life:0.25,max:0.25,col:i?'#bfeaff':'#ffffff',size:1.8,g:0});}}
  else if(o.axe&&o.axe.scale.x!==1)o.axe.scale.setScalar(1);
  // ---- ท่า: อาวุธลอยฟันเอง + มือขวาร่ายไม้ตามจังหวะ (host ตีทันทีตอนกด / จังหวะ 3 ตีหลัง 0.32 วิ — ภาพฟันจริงอยู่ในช่วงนั้น) ----
  if(o.swN===undefined)o.swN=F[1];
  if(F[1]!==o.swN){o.swN=F[1];o.swC=F[2];o.swT=o.swC===2?0.62:ff?0.42:0.34;o.fwK0=0;}
  const SWT=o.swC===2?0.62:ff?0.42:0.34;   // คิดหลังอัปเดตจังหวะ (เดิมคิดก่อน → เฟรมแรกของจังหวะใหม่ k ติดลบ แขน/ตัวกระตุกแรง)
  if(o.swT>0)o.swT-=dt;
  if(flags&16){if(!o.mlOn){o.mlOn=1;o.mlT=0.4;}}else o.mlOn=0;   // อัลติเพิ่งเปิด = พุ่งไปพร้อมกวาดฟันรอบตัวรัว ๆ 0.4 วิ
  if(o.mlT>0)o.mlT-=dt;
  const fa=o.fa||(o.fa={ax:-1.05,az:0.15,by:0,bx:0}),P=FWP;
  fwIdle(P,now,ff,o.fwSeed||(o.fwSeed=rnd(0,6)));o.fwSub=0;
  if(fwOn&&o.mlT>0){const k=1-o.mlT/0.4,w=Math.sin(k*Math.PI*3);fwSweep(P,1.75*w,1.35+0.35*Math.cos(k*Math.PI*3),ff);P.strike=true;P.ax=-1.4;P.az=0.85*w;P.ty=0.35*w;P.tx=0.1;}   // ฟันไป-กลับ 3 ครั้งเฉพาะด้านหน้า (ไม่กวาดผ่านหลัง = ไม่บังกล้อง)
  else if(fwOn&&o.swT>0){const k=clamp(1-o.swT/SWT,0,1);fwSwing(P,o.swC,ff,k);if(P.strike){o.fwSub=1;o.fwKs=[o.fwK0||0,k];}o.fwK0=k;}
  // Glacier Rend โหมดประชิด: ชาร์จ = อาวุธลอยสูงเหนือหัวเรืองแสง ไม้ชี้ฟ้า / ปล่อย = สับลงแล้วคลื่นพุ่ง
  if(fwOn&&(flags&32)){fwChop(P,-0.35,ff);P.y+=0.6+Math.sin(now/60)*0.04;P.rate=10;P.strike=false;o.fwSub=0;P.ax=-2.8;P.az=-0.1;P.tx=-0.15;P.ty=0;}
  let ax=P.ax,az=P.az,by=P.ty,bx=P.tx;
  const rpose=!melee&&!p.fl&&((flags&32)||o.grUp>0);
  if(!melee&&!p.fl&&(flags&32)){ax=-1.42;az=0.1;bx=0.12;by=-0.1;}
  if(o.grUp>0){o.grUp-=dt;const k=1-Math.max(0,o.grUp)/0.5;const e=1-Math.pow(1-Math.min(1,k/0.45),3);ax=lerp(-1.42,-3.0,e);az=0.05;bx=lerp(0.12,-0.2,e);by=0;}
  if(o.grDown>0){o.grDown-=dt;const k=1-Math.max(0,o.grDown)/0.3;az=-0.05;by=0;o.fwSub=0;
    if(k<0.35){const e=Math.pow(k/0.35,2.2);ax=lerp(-2.85,-0.4,e);bx=lerp(-0.2,0.4,e);if(fwOn){fwChop(P,lerp(-0.35,2.05,e),ff);P.strike=true;}}
    else{const e=1-Math.pow(1-(k-0.35)/0.65,3);ax=lerp(-0.4,-0.95,e);bx=lerp(0.4,0,e);if(fwOn){fwChop(P,2.05-0.3*e,ff);P.strike=false;P.rate=lerp(30,8,e);}}}
  // ฟาดจากที่สูง (กระโดดลง): อาวุธพุ่งนำลงไปข้างหน้า ปลายชี้พื้น
  if(fwOn&&o.slamT>0&&pz>0.2&&!(o.swT>0)){P.x=0;P.y=0.5;P.z=1.4;P.bx=0;P.by=-0.8;P.bz=0.6;P.nx=1;P.ny=0;P.nz=0;P.rate=14;P.strike=false;ax=-0.6;az=-0.1;bx=0.25;}
  // Frostforge เปิด (ผู้ใช้ 2026-10-22 'new animation of axe coming up'): ขวานงอกจากใต้พื้นหน้าขวา หมุนวนขึ้นมาเข้าที่
  if(fwOn&&o.ffRise>0){o.ffRise-=dt;const k=1-Math.max(0,o.ffRise)/FF_RISE,e=1-Math.pow(1-k,3),sp=(1-e)*Math.PI*3,c=Math.cos(sp),s=Math.sin(sp);
    P.y=lerp(-1.1,P.y,e);P.z=lerp(0.85,P.z,e);P.x=lerp(-1.1,P.x,e);
    const bx=P.bx,bz=P.bz,nx=P.nx,nz=P.nz;P.bx=bx*c-bz*s;P.bz=bx*s+bz*c;P.nx=nx*c-nz*s;P.nz=nx*s+nz*c;P.rate=60;P.strike=false;o.fwSub=0;}
  // วางอาวุธ: ช่วงฟันจริงวางตรงทุกเฟรม (ทางโค้งคม ไม่ตัดมุม) • นอกนั้นไล่ตามนุ่ม ๆ
  fwAim(P.bx,P.by,P.bz,P.nx,P.ny,P.nz);_fwP.set(P.x,P.y,P.z);
  {const G=o.fw.g;if(P.strike||!o.fwInit){G.position.copy(_fwP);G.quaternion.copy(_fwQ);o.fwInit=1;}else{const r=Math.min(1,dt*P.rate);G.position.lerp(_fwP,r);G.quaternion.slerp(_fwQ,r);}}
  o.fwStrike=fwOn&&P.strike;
  const sm=(o.swT>0||o.grDown>0||o.grUp>0||o.mlT>0)?Math.min(1,dt*30):Math.min(1,dt*10);
  fa.ax+=(ax-fa.ax)*sm;fa.az+=(az-fa.az)*sm;fa.by+=(by-fa.by)*sm;fa.bx+=(bx-fa.bx)*sm;
  if((melee&&!o.caN||rpose)&&!p.fl){o.armR.rotation.x=fa.ax;o.armR.rotation.z=fa.az;o.b.rotation.y=fa.by;if(Math.abs(fa.bx)>0.01)o.b.rotation.x+=fa.bx;
    if(rpose){o.armL.rotation.x=lerp(-0.2,-1.6,o.grUp>0?1:0.5);o.armL.rotation.z=0.25;}
    if(melee&&!p.sh){const act=o.swT>0||o.grDown>0||(flags&32)||o.mlT>0;o.armL.rotation.x=act?-0.75:-0.4;o.armL.rotation.z=act?0.8:0.35;}}   // มือซ้ายกางทรงตัวตอนร่าย
  else o.b.rotation.y*=0.8;
  // เส้นด้ายเวท ปลายไม้ → ด้ามอาวุธ (+ ประกายไหลไปตามเส้น)
  if(fwOn&&o.fwLk){o.tip.getWorldPosition(_tv1);o.fw.g.getWorldPosition(_tv2);const A=o.fwLk.geometry.attributes.position,ar=A.array,amp=o.fwStrike?0.03:0.08;
    for(let i=0;i<FWL_N;i++){const t=i/(FWL_N-1),w=Math.sin(t*Math.PI);ar[i*3]=lerp(_tv1.x,_tv2.x,t)+Math.sin(now/90+t*9)*w*amp;ar[i*3+1]=lerp(_tv1.y,_tv2.y,t)+Math.sin(now/70+t*7)*w*amp+w*0.15;ar[i*3+2]=lerp(_tv1.z,_tv2.z,t)+Math.cos(now/80+t*8)*w*amp;}
    A.needsUpdate=true;o.fwLk.visible=true;o.fwLk.material.opacity=o.fwStrike?0.65:0.28+0.1*Math.sin(now/200);
    if(Math.random()<0.45){const t=Math.random(),q=simOf(_tv3.lerpVectors(_tv1,_tv2,t));PARTS.push({x:q.x,y:q.y,h:q.h+Math.sin(t*Math.PI)*0.15,vx:(_tv2.x-_tv1.x)*50,vy:(_tv2.z-_tv1.z)*50,vh:(_tv2.y-_tv1.y)*2.5,life:0.3,max:0.3,col:Math.random()<0.5?'#ffffff':'#bfeaff',size:1.2,g:0});}}
  else if(o.fwLk)o.fwLk.visible=false;
  // รอยฟัน = ริบบิ้นติดใบดาบ/ขวาน ทุกเฟรมที่กำลังฟัน (ผู้ใช้ 2026-10-20: รอยต้องตามดาบ • ขวานต้องดูหนักและต่างจากดาบ ไม่ใช่แค่หนากว่า)
  //   ดาบ = ปาดสว่างคม: ริบบิ้นขาว-ฟ้าตามใบ + คลื่นฟ้าจางยื่นเลยปลายใบ + ประกายจากปลาย
  //   ขวาน = ปาดหนัก: ริบบิ้นน้ำเงินเข้ม + ทิ้งแนวผลึกน้ำแข็งตามทางที่หัวขวานผ่าน (ค้างแล้วร่วงแตก) + หมอกหนา + จบท่าแล้วพื้นร้าว/เศษน้ำแข็ง
  {const W=ff?o.axe:o.sword,sw=W&&o.fwStrike;
    if(sw){if(!o.wtr){const ch=(o.swC===2&&o.swT>0)||o.grDown>0,kk=ch?0.5:1,lk=ch?0.7:1;   // สับแนวตั้ง = ริบบิ้นสูงเป็นกำแพง → หรี่ลง ไม่ให้ขาวทั้งจอ
        o.wtr=trailNew({sweep:true,col:ff?'#d8ecff':ch?'#cfefff':'#ffffff',col2:ff?'#1a52c8':'#54c2ff',life:(ff?0.3:0.2)*lk,k:(ff?1.3:1.7)*kk});
        o.wtr2=trailNew({sweep:true,col:ff?'#5e9cff':'#a8e6ff',col2:ff?'#0b2f8a':'#2f86ff',life:(ff?0.36:0.24)*lk,k:(ff?0.9:1.0)*kk});o.wAx=!!ff;}
      o.g.updateWorldMatrix(true,false);W.updateMatrix();W.updateWorldMatrix(true,false);
      // ฟันเร็วมาก (~0.1 วิ ต่อ 200°) → เก็บจุดย่อย 3 จุดต่อเฟรมจากท่าระหว่างเฟรม ให้หางแสงโค้งเนียน
      const ns=o.fwSub?3:1;
      for(let j=1;j<=ns;j++){const M=ns>1?fwMat(o,W,fwSwing(FWT,o.swC,ff,lerp(o.fwKs[0],o.fwKs[1],j/ns))):W.matrixWorld;
        _tv1.set(0,ff?-1.0:-0.3,0).applyMatrix4(M);_tv2.set(0,-2.05,0).applyMatrix4(M);
        trailPoint(o.wtr,_tv1.x,_tv1.y,_tv1.z,_tv2.x,_tv2.y,_tv2.z);
        _tv3.set(0,ff?-1.5:-1.3,0).applyMatrix4(M);_ev.set(0,ff?-2.75:-2.9,0).applyMatrix4(M);
        trailPoint(o.wtr2,_tv3.x,_tv3.y,_tv3.z,_ev.x,_ev.y,_ev.z,0.75);}
      const q=simOf(_tv2);o.wTip=[q.x,q.y];
      if(ff){// แนวผลึกน้ำแข็งตามทางหัวขวาน
        for(let i=0;i<2;i++){const c=rnd(0.07,0.13);iceBit(_cryG,q.x+rnd(-6,6),q.y+rnd(-6,6),Math.max(0.05,q.h-GY(q.x,q.y)+rnd(-0.25,0.25)),c,c*rnd(2,3.2),c,{life:rnd(0.45,0.7),up:0.03,down:0.3,rx:rnd(-1,1),rz:rnd(-1,1),v:[rnd(-25,25),rnd(-25,25),rnd(-1.5,0.3)],spin:rnd(-4,4)});}
        if(Math.random()<0.6)mistPuff(q.x,q.y,Math.max(0.05,q.h-GY(q.x,q.y)-0.4),{vx:rnd(-25,25),vy:rnd(-25,25),vh:-0.3,size:1.8,grow:0.6,life:rnd(0.7,1),a:0.32});}
      else{PARTS.push({x:q.x,y:q.y,h:q.h,vx:rnd(-40,40),vy:rnd(-40,40),vh:rnd(-0.5,1),life:0.25,max:0.25,col:Math.random()<0.5?'#ffffff':'#bfeaff',size:rnd(1.4,2.2),g:1});
        if(Math.random()<0.25)mistPuff(q.x,q.y,Math.max(0.05,q.h-GY(q.x,q.y)-0.3),{vx:rnd(-20,20),vy:rnd(-20,20),vh:-0.2,size:1,grow:0.5,life:rnd(0.5,0.8),a:0.2});}}
    else if(o.wtr){trailStop(o.wtr);trailStop(o.wtr2);o.wtr=o.wtr2=null;
      if(o.wAx&&o.wTip){// ขวานจบท่า: พื้นตรงปลายทางร้าวเป็นน้ำแข็ง + เศษผลึกกระเด็น + ฝุ่นหิมะ
        const [x,y]=o.wTip;dfCracks(x,y,0.06,70,'#bfeaff',1);iceChips(x,y,0.2,8,200,4);burst(x,y,'#eaf8ff',14,160,0.5,2.4,{h:0.3,vh:[1,4],g:6,c2:'#5ab8ff'});
        SHAPES_Q.push({k:'decal',x,y,col:'#e8f6ff',s1:2.4,life:2,op:0.5});if(p.id===NET.myId)shake(2.5);}
      o.wTip=null;}}
  // รอยเท้าผลึกบาง ๆ ใต้ทุกก้าว แล้วแตก/จางไป (ไม่ทิ้งทางยาวแบบไถล)
  if(!p.fl&&!(flags&1)&&pz<0.3){const st=Math.sin(o.walk||0)>0;if(o.stepS!==undefined&&st!==o.stepS){const L=o.legs[st?0:1];_ev.set(0,-0.82,0.05);L.localToWorld(_ev);const q=simOf(_ev);
      iceBit(_hexG,q.x,q.y,0.03,0.17,0.24,1,{rx:-Math.PI/2,mat:frostM(),life:0.9,up:0.04,down:0.5});PARTS.push({x:q.x,y:q.y,h:0.15,vx:rnd(-8,8),vy:rnd(-8,8),vh:0.3,life:0.6,max:0.6,col:'#eef8ff',size:3,g:0,smoke:true,grow:0.8});
      if(Math.random()<0.5)PARTS.push({x:q.x,y:q.y,h:0.08,vx:rnd(-30,30),vy:rnd(-30,30),vh:rnd(0.5,1.2),life:0.3,max:0.3,col:'#ffffff',size:1.1,g:4});}
    o.stepS=st;}
  if(o.slamT>0){o.slamT-=dt;if(pz<0.2&&o.slamT<1.3)o.slamT=0;else{const W=melee?(ff?o.axe:o.sword):o.tip;for(let i=0;i<2;i++){_ev.set(Math.cos(now/40+i*3.14)*0.12,(melee?-1:1)*(0.2+((now/300+i*0.5)%1)*(melee?1.8:1.2)),Math.sin(now/40+i*3.14)*0.12);W.localToWorld(_ev);const q=simOf(_ev);PARTS.push({x:q.x,y:q.y,h:q.h,vx:0,vy:0,vh:0,life:0.12,max:0.12,col:i?'#bfeaff':'#ffffff',size:2,g:0});}}}
  // ไอเย็นจางๆ ตามใบดาบ
  if(melee&&Math.random()<0.25){(ff?o.axe:o.sword).getWorldPosition(_pw);const s=simOf(_pw);PARTS.push({x:s.x+rnd(-8,8),y:s.y+rnd(-8,8),h:s.h-rnd(0.3,1.6),vx:0,vy:0,vh:-0.3,life:0.6,max:0.6,col:'#e8f6ff',size:1.4,g:0});}
  // Glacier Rend ชาร์จ: ดาบเรืองแสง ไอเย็นดูดเข้า
  if(flags&32){(melee?(ff?o.axe:o.sword):o.tip).getWorldPosition(_pw);const s=simOf(_pw);
    for(let i=0;i<3;i++){const an=rnd(0,6.283),r=rnd(30,55);PARTS.push({x:s.x+Math.cos(an)*r,y:s.y+Math.sin(an)*r,h:s.h-0.8+rnd(-0.8,0.8),vx:-Math.cos(an)*r/0.25,vy:-Math.sin(an)*r/0.25,vh:0,life:0.25,max:0.25,col:i?'#bfeaff':'#ffffff',size:2,g:0});}
    LREQ.push({x:_pw.x,y:_pw.y-0.8,z:_pw.z,col:'#8fe0ff',int:2.5,dist:9});
    if(melee){const W=ff?o.axe:o.sword;for(let i=0;i<3;i++){_ev.set(0,-rnd(0.3,1.9),0);W.localToWorld(_ev);const q=simOf(_ev);PARTS.push({x:q.x,y:q.y,h:q.h,vx:0,vy:0,vh:0,life:0.08,max:0.08,col:i?'#bfeaff':'#ffffff',size:2.6,g:0});}}}
  // โล่อัศวินน้ำแข็ง (แทนโล่ฟองสบู่)
  if(p.sh){
    if(!o.ishield){o.ishield=makeKiteShield();o.g.add(o.ishield);}
    if(!o.shFx)o.shFx=fxPlay('frost/shield_a',{x:p.x,y:p.y,h:pz,follow:p.id});   // โล่ว่าวคริสตัลแบบ A (ผู้ใช้เลือก 2026-10-22: ยื่นออกหน้าตัวมากขึ้น 0.5 → 0.95 ม.) — ประกาย/เกล็ดจากไฟล์
    o.ishield.visible=true;o.ishield.position.set(0.12,1.15,0.95);o.ishield.rotation.set(0.08,0,0);
    o.armL.rotation.x=-1.3;o.armL.rotation.z=0.5;
    o.shield.visible=!!((p.fm|0)&(128|16384));
    if(Math.random()<0.3){o.ishield.getWorldPosition(_pw);const s=simOf(_pw);PARTS.push({x:s.x+rnd(-8,8),y:s.y+rnd(-8,8),h:s.h+rnd(-0.5,0.5),vx:0,vy:0,vh:0.4,life:0.5,max:0.5,col:'#dff6ff',size:1.6,g:0});}
  }else{if(o.shFx){fxStop(o.shFx);o.shFx=null;}if(o.ishield)o.ishield.visible=false;}
  // ไถลน้ำแข็ง
  if(flags&1){o.b.rotation.x=0.5;o.legs[0].rotation.x=-0.75;o.legs[1].rotation.x=0.6;o.armL.rotation.x=0.6;o.armL.rotation.z=0.6;
    for(let i=0;i<3;i++)PARTS.push({x:p.x+rnd(-10,10),y:p.y+rnd(-10,10),h:pz+0.1,vx:rnd(-60,60),vy:rnd(-60,60),vh:rnd(0.5,2),life:0.35,max:0.35,col:i?'#ffffff':'#bfeaff',size:1.8,g:4});
    if(Math.random()<0.8)PARTS.push({x:p.x+rnd(-12,12),y:p.y+rnd(-12,12),h:pz+0.12,vx:rnd(-10,10),vy:rnd(-10,10),vh:0.15,life:0.9,max:0.9,col:'#eef8ff',size:6,g:0,smoke:true,grow:0.9,drag:2});
    const lp=o.slLast||[p.x,p.y];if(Math.hypot(p.x-lp[0],p.y-lp[1])>45){dfCracks((p.x+lp[0])/2,(p.y+lp[1])/2,pz+0.06,40,'#bfeaff',0.9);o.slLast=[p.x,p.y];}else if(!o.slLast)o.slLast=[p.x,p.y];
    o.slA=p.a;}
  else if(o.slLast){const a=o.slA||p.a||0;o.slLast=null;PARTS.push({x:p.x,y:p.y,h:pz+0.2,vx:0,vy:0,vh:0.3,life:0.8,max:0.8,col:'#eef8ff',size:8,g:0,smoke:true,grow:1});
    for(let i=0;i<8;i++){const an=a+rnd(-0.5,0.5),v=rnd(150,280);iceBit(_cryG,p.x+Math.cos(a)*14,p.y+Math.sin(a)*14,pz+0.2,0.07,0.12,0.07,{life:0.6,up:0.02,down:0.2,v:[Math.cos(an)*v,Math.sin(an)*v,rnd(2,4)],spin:rnd(-12,12)});}
    for(let i=0;i<10;i++)PARTS.push({x:p.x+Math.cos(a)*16,y:p.y+Math.sin(a)*16,h:pz+0.1,vx:Math.cos(a+rnd(-0.6,0.6))*rnd(120,240),vy:Math.sin(a+rnd(-0.6,0.6))*rnd(120,240),vh:rnd(0.5,2.5),life:0.35,max:0.35,col:i%2?'#ffffff':'#bfeaff',size:1.6,g:6});}
  // แช่แข็งตัวเอง
  if(flags&2){
    // ผู้ใช้ 2026-10-23 เลือกแบบ 4 (แก้วปริซึม) = assets/fx/frost/cryoshell — เปลือกเดิม (ทรงยี่สิบหน้า) เหลือไว้เป็นสำรองถ้าเล่นไฟล์ไม่ได้
    if(!o.cryoFx)o.cryoFx=fxPlay('frost/cryoshell',{x:p.x,y:p.y,h:pz,a:p.a||0,follow:p.id});
    if(!o.cryoM){o.cryoM=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),iceMat(0.6,'#4aa0d8'));o.g.add(o.cryoM);}
    if(!o.cryoM.visible)o.cryoGrow=0;o.cryoGrow=Math.min(1,(o.cryoGrow||0)+dt/0.35);const gk=1-Math.pow(1-o.cryoGrow,3);
    o.cryoM.visible=!o.cryoFx;o.cryoM.scale.set(0.95*(0.6+0.4*gk),1.45*gk+0.01,0.95*(0.6+0.4*gk));o.cryoM.position.y=1.15*gk;o.cryoM.rotation.y=now/3000;
    if(o.cryoGrow<1)for(let i=0;i<4;i++){const an=rnd(0,6.283);PARTS.push({x:p.x+Math.cos(an)*22,y:p.y+Math.sin(an)*22,h:pz+2.4*gk*rnd(0.6,1),vx:0,vy:0,vh:0,life:0.25,max:0.25,col:'#ffffff',size:2,g:0});}
    {const pl=0.5+0.5*Math.sin(now/260);LREQ.push({x:tx(p.x),y:pz+1.2,z:tz(p.y),col:'#9fe8ff',int:1.2+2*pl,dist:6});if(Math.random()<0.3)PARTS.push({x:p.x+rnd(-6,6),y:p.y+rnd(-6,6),h:pz+1.2,vx:0,vy:0,vh:0,life:0.4,max:0.4,col:'#dff6ff',size:3+3*pl,g:0});}
    if(Math.random()<0.4)PARTS.push({x:p.x+rnd(-20,20),y:p.y+rnd(-20,20),h:pz+rnd(0.3,2.4),vx:0,vy:0,vh:0.3,life:0.7,max:0.7,col:'#7dff9a',size:1.6,g:-0.5});
  }else{if(o.cryoM)o.cryoM.visible=false;if(o.cryoFx){fxKill(o.cryoFx);o.cryoFx=null;}}
  if(!(flags&4)&&o.auraR)o.auraR.visible=o.auraD.visible=false;
  if(flags&4){
    for(let i=0;i<4;i++){const an=now/260+i*1.571,r=24+6*Math.sin(now/300+i),hh=pz+0.3+((now/600+i*0.25)%1)*2.2;PARTS.push({x:p.x+Math.cos(an)*r,y:p.y+Math.sin(an)*r,h:hh,vx:-Math.sin(an)*r*4,vy:Math.cos(an)*r*4,vh:0.6,life:0.25,max:0.25,col:i%2?'#ffffff':'#cfefff',size:i%2?1.6:2.4,g:0});}
    if(Math.random()<0.12){const an=rnd(0,6.283);PARTS.push({x:p.x+Math.cos(an)*26,y:p.y+Math.sin(an)*26,h:pz+rnd(0.1,0.5),vx:-Math.sin(an)*90,vy:Math.cos(an)*90,vh:0.2,life:0.6,max:0.6,col:'#cfe6fa',size:4,g:0,smoke:true,grow:0.6,drag:1});}   // หมอกต่ำแค่ข้อเท้า (เดิมสูงถึงอก บังกล้องจนขาว)
    if(Math.floor(now/600)!==o.auP){o.auP=Math.floor(now/600);ring(p.x,p.y,'#7cc4ff',120,0.5,pz+0.08);}
    o.auOn=1;}
  else if(o.auOn){o.auOn=0;for(let i=0;i<24;i++){const an=rnd(0,6.283),r=rnd(60,140);PARTS.push({x:p.x+Math.cos(an)*r,y:p.y+Math.sin(an)*r,h:pz+rnd(0.3,2),vx:-Math.cos(an)*r*2.2,vy:-Math.sin(an)*r*2.2,vh:0,life:0.45,max:0.45,col:i%2?'#ffffff':'#bfeaff',size:2,g:0,drag:0});}
    smoke(p.x,p.y,pz+0.8,10,'#eef8ff',1,7,40);}
  // ออร่าเยือกแข็ง (ขอบวงบนพื้นให้เห็นระยะ)
  if(flags&4){
    if(!o.auraR){
      o.auraR=new THREE.Group();const m=new THREE.MeshBasicMaterial({color:hdr('#f0f6ff',1.3),transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
      for(let i=0;i<20;i++){const seg=new THREE.Mesh(new THREE.RingGeometry(0.93,1,6,1,i/20*Math.PI*2,Math.PI*2/20*0.55),m);seg.rotation.x=-Math.PI/2;o.auraR.add(seg);}
      for(let i=0;i<6;i++){const f=new THREE.Mesh(new THREE.OctahedronGeometry(0.035,0),m);const a=i/6*Math.PI*2;f.position.set(Math.cos(a),0.6,Math.sin(a));f.userData.a=a;o.auraR.add(f);}
      o.auraR.scale.set(180*S3,1,180*S3);o.g.add(o.auraR);
      o.auraD={visible:false};}
    o.auraR.visible=o.auraD.visible=true;o.auraR.position.y=0.07;o.auraR.rotation.y=-o.g.rotation.y+now/900;
for(let i=0;i<5;i++){const an=rnd(0,6.283),r=rnd(40,180);PARTS.push({x:p.x+Math.cos(an)*r,y:p.y+Math.sin(an)*r,h:pz+rnd(0.1,2.2),vx:-Math.sin(an)*120,vy:Math.cos(an)*120,vh:rnd(-0.6,0.2),life:0.6,max:0.6,col:i%2?'#ffffff':'#bfeaff',size:rnd(1.6,2.6),g:0,drag:1});}
    if(Math.random()<0.15){const an=rnd(0,6.283),rr=rnd(60,170);PARTS.push({x:p.x+Math.cos(an)*rr,y:p.y+Math.sin(an)*rr,h:pz+0.15,vx:0,vy:0,vh:0.1,life:1,max:1,col:'#d6ecff',size:5,g:0,smoke:true,grow:0.6});}}
  // อัลติ Mirror Legion: อาวุธน้ำแข็งลอยเพิ่ม 2 เล่ม (ซ้าย/ขวา เยื้องหน้า = จุดที่ host ฟันซ้ำ 50%) ทำท่าเดียวกับเล่มหลักทุกจังหวะ
  if(flags&16){
    if(!o.fwx)o.fwx=FWA.map(()=>{const w=fwWeapons();w.g.visible=false;o.g.add(w.g);return w;});
    o.fwx.forEach((c,i)=>{const A=FWA[i];
      if(!!c.sword.userData.file!==!!o.sword.userData.file)for(const k of ['sword','axe']){const old=c[k],nw=k==='sword'?makeIceSword():makeIceAxe();nw.position.set(0,0,0);c.g.add(nw);c.g.remove(old);disposeTree(old);c[k]=nw;}
      c.sword.visible=!ff;c.axe.visible=!!ff;
      c.g.position.set(o.fw.g.position.x+A[0],o.fw.g.position.y+A[1],o.fw.g.position.z+A[2]);c.g.quaternion.copy(o.fw.g.quaternion);
      if(!c.on){c.on=1;c.born=0;c.endT=0;c.g.updateWorldMatrix(true,false);_tv1.set(0,-1,0);c.g.localToWorld(_tv1);const q=simOf(_tv1);burst(q.x,q.y,'#dff6ff',10,160,0.4,2,{h:q.h,vh:[1,4],g:2});
        // เศษผลึกพุ่งเข้ามาประกอบเป็นใบอาวุธ
        for(let j=0;j<14;j++){const an=rnd(0,6.283),r=rnd(60,110),sx=q.x+Math.cos(an)*r,sy=q.y+Math.sin(an)*r,hh=Math.max(0.2,q.h+rnd(-1.2,1.2));iceBit(_plateG,sx,sy,hh,0.16,0.16,0.1,{life:0.3,up:0.03,down:0.08,v:[(q.x-sx)/0.28,(q.y-sy)/0.28,(q.h-hh)/0.28],spin:rnd(-8,8)});}}
      c.born=Math.min(1,c.born+dt*4);c.g.scale.setScalar(FWS*(0.2+0.8*(1-Math.pow(1-c.born,3))));c.g.visible=fwOn;
      // หางแสงของเล่มเสริม (ตามท่าเดียวกับเล่มหลัก)
      if(fwOn&&o.fwStrike){const W=ff?c.axe:c.sword;W.updateMatrix();o.g.updateWorldMatrix(true,false);
        if(!c.tr)c.tr=trailNew({sweep:true,col:ff?'#d8ecff':'#e8f8ff',col2:ff?'#1a52c8':'#54c2ff',life:ff?0.24:0.16,k:ff?0.9:1.0});
        const ns=o.fwSub?3:1;for(let j=1;j<=ns;j++){const M=fwMat(o,W,ns>1?fwSwing(FWT,o.swC,ff,lerp(o.fwKs[0],o.fwKs[1],j/ns)):FWP,A);
          _tv1.set(0,ff?-1.0:-0.3,0).applyMatrix4(M);_tv2.set(0,-2.05,0).applyMatrix4(M);trailPoint(c.tr,_tv1.x,_tv1.y,_tv1.z,_tv2.x,_tv2.y,_tv2.z);}}
      else if(c.tr){trailStop(c.tr);c.tr=null;}});
  }else if(o.fwx){o.fwx.forEach(c=>{if(c.tr){trailStop(c.tr);c.tr=null;}
      if(c.on&&!c.endT){c.endT=0.35;}c.on=0;
      if(c.endT>0){c.endT-=dt;c.g.updateWorldMatrix(true,false);_tv1.set(0,-1,0);c.g.localToWorld(_tv1);const q=simOf(_tv1);
        // รอยร้าวแล่นทั่วใบ แล้วแตกเป็นเกล็ดน้ำแข็ง
        if(Math.random()<0.7){const an=rnd(0,6.283);FX.bolt(q.x,q.y,q.h,q.x+Math.cos(an)*rnd(10,25),q.y+Math.sin(an)*rnd(10,25),q.h+rnd(-0.9,0.9),0.15,'#ffffff');}
        if(c.endT<=0){c.g.visible=false;c.endT=0;for(let j=0;j<26;j++){const an=rnd(0,6.283),v=rnd(40,160);PARTS.push({x:q.x+rnd(-10,10),y:q.y+rnd(-10,10),h:q.h+rnd(-1,1),vx:Math.cos(an)*v,vy:Math.sin(an)*v,vh:rnd(-0.5,2),life:rnd(0.5,0.9),max:0.9,col:j%3===0?'#ffffff':j%3===1?'#dff6ff':'#9fe0ff',size:rnd(1.4,2.4),g:2.5,drag:1});}
          iceChips(q.x,q.y,Math.max(0.3,q.h),6,120,3);}}
      else c.g.visible=false;});}
}
