// ---------- ภาพของสายน้ำแข็ง: ดาบ/ขวานน้ำแข็งที่ปลายไม้ ท่าฟัน โล่อัศวิน ไถล แช่แข็งตัวเอง ออร่า ร่างแยก ----------
function iceMat(op,em){return new THREE.MeshStandardMaterial({color:'#d8f4ff',emissive:em||'#3a8ac0',emissiveIntensity:0.6,roughness:0.08,metalness:0.2,transparent:true,opacity:op,flatShading:true});}
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
  const blade=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:'#e6f8ff',emissive:'#3a90d0',emissiveIntensity:0.55,roughness:0.04,metalness:0.4,transparent:true,opacity:0.86,flatShading:true}));blade0.add(blade);
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
  const bm=new THREE.MeshStandardMaterial({color:'#e6f8ff',emissive:'#3a90d0',emissiveIntensity:0.55,roughness:0.04,metalness:0.45,transparent:true,opacity:0.88,flatShading:true});
  for(const sd of [1,-1]){const b=new THREE.Mesh(geo,bm);b.position.y=-1.55;b.scale.x=sd;g.add(b);const r=iceRim(geo);r.position.y=-1.55;r.scale.set(sd*1.06,1.06,1.5);g.add(r);}
  const top=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.45,5),hm);top.position.y=-2.05;top.rotation.x=Math.PI;g.add(top);
  const gem=new THREE.Mesh(new THREE.OctahedronGeometry(0.09),new THREE.MeshBasicMaterial({color:hdr('#7fe0ff',2.4)}));gem.position.set(0,-1.55,0.05);g.add(gem);
  const gl=new THREE.Sprite(glowMat('#8fe0ff',1.4));gl.scale.setScalar(0.9);gl.position.y=-1.55;g.add(gl);
  return g;
}
function makeKiteShield(){
  const sh=new THREE.Shape();sh.moveTo(0,0.6);sh.lineTo(0.42,0.42);sh.lineTo(0.36,-0.15);sh.lineTo(0,-0.72);sh.lineTo(-0.36,-0.15);sh.lineTo(-0.42,0.42);sh.lineTo(0,0.6);
  const geo=new THREE.ExtrudeGeometry(sh,{depth:0.06,bevelEnabled:true,bevelSize:0.03,bevelThickness:0.03,bevelSegments:1});geo.translate(0,0,-0.03);
  const g=new THREE.Group();g.add(new THREE.Mesh(geo,iceMat(0.82)));
  const rim=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:hdr('#9fe0ff',1.2),transparent:true,opacity:0.3,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.BackSide}));rim.scale.setScalar(1.08);g.add(rim);
  const boss=new THREE.Mesh(new THREE.OctahedronGeometry(0.11),iceMat(1,'#6ac0f0'));boss.position.z=0.08;g.add(boss);
  return g;
}
const _icyClone=new THREE.MeshStandardMaterial({color:'#bfe8ff',emissive:'#3a8ac0',emissiveIntensity:0.7,roughness:0.1,transparent:true,opacity:0.55,depthWrite:false});_icyClone.userData.keep=true;
function makeMirrorClone(o){
  for(const k of ['shield','ring','broom','cocoon','stars','colo','mcirc','ishield','cryoM','axe'])if(o[k])o[k].name='skip';
  o.armR.name='armR';o.armL.name='armL';o.b.name='body';
  const c=o.g.clone(true);
  c.traverse(m=>{if(m.name==='skip')m.visible=false;if(m.isMesh)m.material=_icyClone;if(m.isSprite&&m.name!=='skip')m.visible=false;});
  scene.add(c);return {g:c,armR:c.getObjectByName('armR'),armL:c.getObjectByName('armL'),b:c.getObjectByName('body'),born:0};
}
function frostFX(o,p,pz,now,dt){
  const F=p.fr;
  if(!F){if(o.sword)o.sword.visible=false;if(o.axe)o.axe.visible=false;if(o.ishield)o.ishield.visible=false;if(o.cryoM)o.cryoM.visible=false;if(o.clones)o.clones.forEach(c=>c.g.visible=false);return;}
  const melee=F[0]===0,flags=F[3]|0,ff=flags&8;
  if(!o.sword){o.sword=makeIceSword();o.armR.add(o.sword);o.axe=makeIceAxe();o.armR.add(o.axe);}
  else if(!o.sword.userData.file&&MODELS.ready.get('mesh_ice_sword')&&MODELS.ready.get('mesh_ice_axe')){   // โมเดลไฟล์โหลดเสร็จทีหลัง → สลับเป็นแบบไฟล์
    for(const k of ['sword','axe']){const old=o[k],nw=k==='sword'?makeIceSword():makeIceAxe();nw.scale.copy(old.scale);nw.rotation.copy(old.rotation);old.parent.add(nw);old.parent.remove(old);o[k]=nw;}}
  o.sword.visible=melee&&!ff;o.axe.visible=melee&&!!ff;
  if(o.wandG)o.wandG.visible=!melee;o.tip.visible=!melee;
  if(!melee&&!p.fl){o.tip.getWorldPosition(_pw);const q=simOf(_pw);
    for(let i=0;i<3;i++){const an=now/120+i*2.094;PARTS.push({x:q.x+Math.cos(an)*9,y:q.y+Math.sin(an)*9,h:q.h+Math.sin(an*1.5)*0.15,vx:-Math.sin(an)*50,vy:Math.cos(an)*50,vh:0,life:0.08,max:0.08,col:i?'#bfeaff':'#ffffff',size:1.5,g:0});}
    if(ff){if(!o.ffBall){o.ffBall=new THREE.Mesh(new THREE.IcosahedronGeometry(0.22,0),iceFxM());scene.add(o.ffBall);(o.g.userData.extra||(o.g.userData.extra=[])).push(o.ffBall);}
      o.ffBall.visible=true;o.ffBall.position.copy(_pw);o.ffBall.rotation.y=now/400;o.ffBall.rotation.x=now/700;o.ffBall.scale.setScalar(1+0.12*Math.sin(now/90));}
    else if(o.ffBall)o.ffBall.visible=false;}
  else if(o.ffBall)o.ffBall.visible=false;
  // Frostforge โหมดประชิด: หัวขวานงอกจากผลึกน้ำแข็งตามใบ (ตอนเพิ่งเปิด)
  if(ff&&!o.ffWas){o.ffGrow=0.45;}o.ffWas=!!ff;
  if(o.ffGrow>0){o.ffGrow-=dt;const k=1-Math.max(0,o.ffGrow)/0.45;if(melee&&o.axe){o.axe.scale.setScalar(0.35+0.65*k);o.axe.getWorldPosition(_pw);const q=simOf(_pw);for(let i=0;i<3;i++)PARTS.push({x:q.x+rnd(-14,14),y:q.y+rnd(-14,14),h:q.h-rnd(0.2,1.2),vx:rnd(-30,30),vy:rnd(-30,30),vh:rnd(0,1.5),life:0.25,max:0.25,col:i?'#bfeaff':'#ffffff',size:1.8,g:0});}}
  else if(o.axe&&o.axe.scale.x!==1)o.axe.scale.setScalar(1);
  // ท่าฟัน: ง้าง → ฟัน → คืนท่า (ลื่นๆ มีบิดตัว) — ค่าทำให้นุ่มด้วยการไล่ค่าแบบ exponential
  const SWT=o.swC===2?0.62:0.34;
  if(o.swN===undefined)o.swN=F[1];
  if(F[1]!==o.swN){o.swN=F[1];o.swC=F[2];o.swT=o.swC===2?0.62:0.34;}
  if(o.swT>0)o.swT-=dt;
  const fa=o.fa||(o.fa={ax:-1.05,az:0.15,by:0,bx:0});
  // ท่าพร้อม: แขนยื่นไปข้างหน้าระดับเอว ใบดาบเฉียงขึ้น ~45° ไปข้างหน้า (แบบอัศวินตั้งการ์ด)
  let ax=-1.05,az=0.15,by=-0.12,bx=0,bl=-1.3;
  if(melee&&!p.fl&&o.swT>0){bl=0;
    const k=1-o.swT/SWT,W=o.swC===2?0.5:0.24,S=o.swC===2?0.66:0.56,eo=t=>1-Math.pow(1-t,3),ei=t=>t*t*t;
    if(o.swC===2){
      if(k<W){const e=eo(k/W);ax=lerp(-1.05,-3.15,e);bx=lerp(0,-0.35,e);by=Math.sin(k*20)*0.03;}
      else if(k<S){const e=ei((k-W)/(S-W));ax=lerp(-3.05,0.3,e);bx=lerp(-0.25,0.5,e);}
      else{const e=eo((k-S)/(1-S));ax=lerp(0.3,-1.05,e);bx=lerp(0.5,0,e);}
      az=-0.12;
    }else{
      const sd=o.swC===1?-1:1;
      if(k<W){const e=eo(k/W);az=lerp(0.15,-1.45*sd,e);ax=lerp(-1.05,-1.5,e);by=lerp(-0.12,-0.6*sd,e);}
      else if(k<S){const e=(k-W)/(S-W),e2=e*e*(3-2*e);az=lerp(-1.45*sd,1.2*sd,e2);ax=-1.5;by=lerp(-0.6*sd,0.55*sd,e2);}
      else{const e=eo((k-S)/(1-S));az=lerp(1.2*sd,0.15,e);ax=lerp(-1.5,-1.05,e);by=lerp(0.55*sd,-0.12,e);}
    }
  }
  // Glacier Rend: ชาร์จ = ยกดาบสูงเหนือหัว / ปล่อย = ฟันลงทันที แล้วคลื่นพุ่งออกไป
  if(melee&&!p.fl&&(flags&32)){ax=-2.75;az=-0.08;bl=0;bx=-0.18;by=0;}
  const rpose=!melee&&!p.fl&&((flags&32)||o.grUp>0);
  if(!melee&&!p.fl&&(flags&32)){ax=-1.42;az=0.1;bx=0.12;by=-0.1;}
  if(o.grUp>0){o.grUp-=dt;const k=1-Math.max(0,o.grUp)/0.5;const e=1-Math.pow(1-Math.min(1,k/0.45),3);ax=lerp(-1.42,-3.0,e);az=0.05;bx=lerp(0.12,-0.2,e);by=0;}
  if(o.grDown>0){o.grDown-=dt;const k=1-Math.max(0,o.grDown)/0.3;bl=0;az=-0.05;by=0;
    if(k<0.35){const e=Math.pow(k/0.35,2.2);ax=lerp(-2.85,0.35,e);bx=lerp(-0.2,0.45,e);}else{const e=1-Math.pow(1-(k-0.35)/0.65,3);ax=lerp(0.35,-1.05,e);bx=lerp(0.45,0,e);}}
  const sm=(o.swT>0||o.grDown>0||o.grUp>0)?Math.min(1,dt*40):Math.min(1,dt*12);
  fa.ax+=(ax-fa.ax)*sm;fa.az+=(az-fa.az)*sm;fa.by+=(by-fa.by)*sm;fa.bx+=(bx-fa.bx)*sm;fa.bl=(fa.bl===undefined?bl:fa.bl)+(bl-(fa.bl===undefined?bl:fa.bl))*Math.min(1,dt*(bl===0?30:8));
  {const tw=(o.swT>0&&o.swC!==2)?0:Math.PI/2;fa.tw=(fa.tw===undefined?tw:fa.tw)+(tw-(fa.tw===undefined?tw:fa.tw))*Math.min(1,dt*30);}
  if(o.sword){o.sword.rotation.x=melee?fa.bl:0;o.sword.rotation.y=fa.tw;}if(o.axe){o.axe.rotation.x=melee?fa.bl:0;o.axe.rotation.y=fa.tw;}
  if((melee||rpose)&&!p.fl){o.armR.rotation.x=fa.ax;o.armR.rotation.z=fa.az;o.b.rotation.y=fa.by;if(Math.abs(fa.bx)>0.01)o.b.rotation.x+=fa.bx;
    if(rpose){o.armL.rotation.x=lerp(-0.2,-1.6,o.grUp>0?1:0.5);o.armL.rotation.z=0.25;}
    if(melee&&!p.sh&&!(o.swT>0)&&!(o.grDown>0)&&!(flags&32)){o.armL.rotation.x=-0.45;o.armL.rotation.z=0.3;}}
  else o.b.rotation.y*=0.8;
  // รอยเท้าผลึกบาง ๆ ใต้ทุกก้าว แล้วแตก/จางไป (ไม่ทิ้งทางยาวแบบไถล)
  if(!p.fl&&!(flags&1)&&pz<0.3){const st=Math.sin(o.walk||0)>0;if(o.stepS!==undefined&&st!==o.stepS){const L=o.legs[st?0:1];_ev.set(0,-0.82,0.05);L.localToWorld(_ev);const q=simOf(_ev);
      iceBit(_hexG,q.x,q.y,0.03,0.17,0.24,1,{rx:-Math.PI/2,mat:frostM(),life:0.9,up:0.04,down:0.5});PARTS.push({x:q.x,y:q.y,h:0.15,vx:rnd(-8,8),vy:rnd(-8,8),vh:0.3,life:0.6,max:0.6,col:'#eef8ff',size:3,g:0,smoke:true,grow:0.8});
      if(Math.random()<0.5)PARTS.push({x:q.x,y:q.y,h:0.08,vx:rnd(-30,30),vy:rnd(-30,30),vh:rnd(0.5,1.2),life:0.3,max:0.3,col:'#ffffff',size:1.1,g:4});}
    o.stepS=st;}
  if(o.slamT>0){o.slamT-=dt;if(pz<0.2&&o.slamT<1.3)o.slamT=0;else{const W=melee?(ff?o.axe:o.sword):o.tip;for(let i=0;i<2;i++){_ev.set(Math.cos(now/40+i*3.14)*0.12,0.2+((now/300+i*0.5)%1)*1.2,Math.sin(now/40+i*3.14)*0.12);W.localToWorld(_ev);const q=simOf(_ev);PARTS.push({x:q.x,y:q.y,h:q.h,vx:0,vy:0,vh:0,life:0.12,max:0.12,col:i?'#bfeaff':'#ffffff',size:2,g:0});}}}
  // ไอเย็นจางๆ ตามใบดาบ
  if(melee&&Math.random()<0.25){(ff?o.axe:o.sword).getWorldPosition(_pw);const s=simOf(_pw);PARTS.push({x:s.x+rnd(-8,8),y:s.y+rnd(-8,8),h:s.h-rnd(0.3,1.6),vx:0,vy:0,vh:-0.3,life:0.6,max:0.6,col:'#e8f6ff',size:1.4,g:0});}
  // Glacier Rend ชาร์จ: ดาบเรืองแสง ไอเย็นดูดเข้า
  if(flags&32){(melee?(ff?o.axe:o.sword):o.tip).getWorldPosition(_pw);const s=simOf(_pw);
    for(let i=0;i<3;i++){const an=rnd(0,6.283),r=rnd(30,55);PARTS.push({x:s.x+Math.cos(an)*r,y:s.y+Math.sin(an)*r,h:s.h-0.8+rnd(-0.8,0.8),vx:-Math.cos(an)*r/0.25,vy:-Math.sin(an)*r/0.25,vh:0,life:0.25,max:0.25,col:i?'#bfeaff':'#ffffff',size:2,g:0});}
    LREQ.push({x:_pw.x,y:_pw.y-0.8,z:_pw.z,col:'#8fe0ff',int:2.5,dist:9});
    if(melee){const W=ff?o.axe:o.sword;for(let i=0;i<3;i++){_ev.set(0,rnd(0.3,1.3),0);W.localToWorld(_ev);const q=simOf(_ev);PARTS.push({x:q.x,y:q.y,h:q.h,vx:0,vy:0,vh:0,life:0.08,max:0.08,col:i?'#bfeaff':'#ffffff',size:2.6,g:0});}}}
  // โล่อัศวินน้ำแข็ง (แทนโล่ฟองสบู่)
  if(p.sh){
    if(!o.ishield){o.ishield=makeKiteShield();o.g.add(o.ishield);}
    o.ishield.visible=true;o.ishield.position.set(0.12,1.15,0.5);o.ishield.rotation.set(0.08,0,0);
    o.armL.rotation.x=-1.3;o.armL.rotation.z=0.5;
    o.shield.visible=!!((p.fm|0)&(128|16384));
    if(Math.random()<0.3){o.ishield.getWorldPosition(_pw);const s=simOf(_pw);PARTS.push({x:s.x+rnd(-8,8),y:s.y+rnd(-8,8),h:s.h+rnd(-0.5,0.5),vx:0,vy:0,vh:0.4,life:0.5,max:0.5,col:'#dff6ff',size:1.6,g:0});}
  }else if(o.ishield)o.ishield.visible=false;
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
    if(!o.cryoM){o.cryoM=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),iceMat(0.6,'#4aa0d8'));o.g.add(o.cryoM);}
    if(!o.cryoM.visible)o.cryoGrow=0;o.cryoGrow=Math.min(1,(o.cryoGrow||0)+dt/0.35);const gk=1-Math.pow(1-o.cryoGrow,3);
    o.cryoM.visible=true;o.cryoM.scale.set(0.95*(0.6+0.4*gk),1.45*gk+0.01,0.95*(0.6+0.4*gk));o.cryoM.position.y=1.15*gk;o.cryoM.rotation.y=now/3000;
    if(o.cryoGrow<1)for(let i=0;i<4;i++){const an=rnd(0,6.283);PARTS.push({x:p.x+Math.cos(an)*22,y:p.y+Math.sin(an)*22,h:pz+2.4*gk*rnd(0.6,1),vx:0,vy:0,vh:0,life:0.25,max:0.25,col:'#ffffff',size:2,g:0});}
    {const pl=0.5+0.5*Math.sin(now/260);LREQ.push({x:tx(p.x),y:pz+1.2,z:tz(p.y),col:'#9fe8ff',int:1.2+2*pl,dist:6});if(Math.random()<0.3)PARTS.push({x:p.x+rnd(-6,6),y:p.y+rnd(-6,6),h:pz+1.2,vx:0,vy:0,vh:0,life:0.4,max:0.4,col:'#dff6ff',size:3+3*pl,g:0});}
    if(Math.random()<0.4)PARTS.push({x:p.x+rnd(-20,20),y:p.y+rnd(-20,20),h:pz+rnd(0.3,2.4),vx:0,vy:0,vh:0.3,life:0.7,max:0.7,col:'#7dff9a',size:1.6,g:-0.5});
  }else if(o.cryoM)o.cryoM.visible=false;
  if(!(flags&4)&&o.auraR)o.auraR.visible=o.auraD.visible=false;
  if(flags&4){
    for(let i=0;i<4;i++){const an=now/260+i*1.571,r=24+6*Math.sin(now/300+i),hh=pz+0.3+((now/600+i*0.25)%1)*2.2;PARTS.push({x:p.x+Math.cos(an)*r,y:p.y+Math.sin(an)*r,h:hh,vx:-Math.sin(an)*r*4,vy:Math.cos(an)*r*4,vh:0.6,life:0.25,max:0.25,col:i%2?'#ffffff':'#cfefff',size:i%2?1.6:2.4,g:0});}
    if(Math.random()<0.5){const an=rnd(0,6.283);PARTS.push({x:p.x+Math.cos(an)*20,y:p.y+Math.sin(an)*20,h:pz+rnd(0.2,1.8),vx:-Math.sin(an)*90,vy:Math.cos(an)*90,vh:0.8,life:0.6,max:0.6,col:'#eef8ff',size:6,g:0,smoke:true,grow:0.8,drag:1});}
    if(Math.floor(now/600)!==o.auP){o.auP=Math.floor(now/600);ring(p.x,p.y,'#dff6ff',120,0.5,pz+0.08);}
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
    if(Math.random()<0.4){const an=rnd(0,6.283);PARTS.push({x:p.x+Math.cos(an)*rnd(0,170),y:p.y+Math.sin(an)*rnd(0,170),h:pz+0.15,vx:0,vy:0,vh:0.2,life:1,max:1,col:'#e8f6ff',size:6,g:0,smoke:true,grow:0.7});}}
  // ร่างแยก
  if(flags&16){
    if(!o.clones)o.clones=[makeMirrorClone(o),makeMirrorClone(o)];
    o.clones.forEach((c,i)=>{const s=i?1:-1,a=p.a||0,X=p.x+Math.cos(a)*30-Math.sin(a)*55*s,Y=p.y+Math.sin(a)*30+Math.cos(a)*55*s;
      if(!c.g.visible){c.g.visible=true;c.born=0;burst(X,Y,'#dff6ff',10,160,0.4,2,{h:1,vh:[1,4],g:2});
        // เศษกระจกน้ำแข็งพุ่งเข้ามาประกอบเป็นร่าง
        for(let j=0;j<14;j++){const an=rnd(0,6.283),r=rnd(60,110),sx=X+Math.cos(an)*r,sy=Y+Math.sin(an)*r,hh=rnd(0.3,2.4);iceBit(_plateG,sx,sy,hh,0.18,0.18,0.12,{life:0.3,up:0.03,down:0.08,v:[(X-sx)/0.28,(Y-sy)/0.28,(1.2-hh)/0.28+2],spin:rnd(-8,8)});}}
      c.born=Math.min(1,c.born+dt*5);c.g.scale.setScalar(0.3+0.7*c.born);
      let fa2=a;{let gx=p.x+Math.cos(a)*400,gy=p.y+Math.sin(a)*400;if(p.id===NET.myId&&INPUT.gx>=0){const dd=Math.hypot(INPUT.gx-p.x,INPUT.gy-p.y);if(dd>60){gx=INPUT.gx;gy=INPUT.gy;}}fa2=Math.atan2(gy-Y,gx-X);}
      c.g.position.set(tx(X),o.g.position.y,tz(Y));c.g.rotation.y=Math.atan2(Math.cos(fa2),Math.sin(fa2));
      c.armR.rotation.copy(o.armR.rotation);c.armL.rotation.copy(o.armL.rotation);c.b.rotation.copy(o.b.rotation);c.b.position.copy(o.b.position);});
  }else if(o.clones){o.clones.forEach(c=>{if(c.g.visible&&!c.endT){c.endT=0.35;c.endP=[c.g.position.x*20+MW/2,c.g.position.z*20+MH/2,c.g.position.y];}
      if(c.endT>0){c.endT-=dt;const [X,Y,H0]=c.endP;
        // รอยร้าวแผ่ออกจากกลางร่าง
        if(Math.random()<0.7){const an=rnd(0,6.283);FX.bolt(X,Y,H0+1.2,X+Math.cos(an)*rnd(10,25),Y+Math.sin(an)*rnd(10,25),H0+1.2+rnd(-0.9,0.9),0.15,'#ffffff');}
        if(c.endT<=0){c.g.visible=false;c.endT=0;for(let j=0;j<26;j++){const an=rnd(0,6.283),v=rnd(40,160);PARTS.push({x:X+rnd(-10,10),y:Y+rnd(-10,10),h:H0+rnd(0.2,2.3),vx:Math.cos(an)*v,vy:Math.sin(an)*v,vh:rnd(-0.5,2),life:rnd(0.5,0.9),max:0.9,col:j%3===0?'#ffffff':j%3===1?'#dff6ff':'#9fe0ff',size:rnd(1.4,2.4),g:2.5,drag:1});}
          iceChips(X,Y,H0+1,6,120,3);}}
      else c.g.visible=false;});}
}
