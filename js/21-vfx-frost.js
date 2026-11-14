// ---------- น้ำแข็ง (ภาพ): ชิ้นผลึก/หนาม/แผ่นน้ำแข็งชั่วคราว (โผล่ → ค้าง → หด) • กระเด็นได้ ----------
const FRV=[];
const _cryG=new THREE.OctahedronGeometry(1,0),_spkG=new THREE.ConeGeometry(1,1,5),_plateG=new THREE.BoxGeometry(1,0.14,0.75),_hexG=new THREE.CircleGeometry(1,6);
let _iceFxM=null,_frostM=null;
function iceFxM(){return _iceFxM||(_iceFxM=new THREE.MeshStandardMaterial({color:'#cfeaff',emissive:'#3a8ac8',emissiveIntensity:0.5,roughness:0.5,metalness:0,transparent:true,opacity:0.88,flatShading:true}));}
function frostM(){return _frostM||(_frostM=new THREE.MeshBasicMaterial({color:'#e8f8ff',transparent:true,opacity:0.7,depthWrite:false,side:THREE.DoubleSide}));}
// ชิ้นน้ำแข็งทั้งหมดวาดด้วย InstancedMesh (1 draw call ต่อรูปทรง/วัสดุ) — เดิมเป็น mesh แยกทีละชิ้น ทำให้ draw call พุ่งเป็นพัน
const ICEP=new Map(),_im4=new THREE.Matrix4(),_iq=new THREE.Quaternion(),_ie=new THREE.Euler(),_ip=new THREE.Vector3(),_is=new THREE.Vector3();
function icePool(geo,mat){const k=geo.uuid+mat.uuid;let P=ICEP.get(k);if(!P){const im=new THREE.InstancedMesh(geo,mat,400);im.count=0;im.frustumCulled=false;scene.add(im);P={im,n:0};ICEP.set(k,P);}return P;}
function iceBit(geo,x,y,h,sx,sy,sz,o){o=o||{};const P=icePool(geo,o.mat||iceFxM());
  FRV.push({P,x:tx(x),y:h+GY(x,y),z:tz(y),rx:o.rx||0,ry:o.ry===undefined?rnd(0,6.283):o.ry,rz:o.rz||0,age:0,life:o.life||0.8,up:o.up||0.12,down:o.down||0.25,s:[sx,sy,sz],v:o.v||null,spin:o.spin||0});}
// เศษน้ำแข็งกระเด็น (ชิ้นผลึกเล็กหมุน)
function iceChips(x,y,h,n,sp,up){for(let i=0;i<n;i++){const an=rnd(0,6.283),v=rnd(sp*0.4,sp),c=rnd(0.05,0.12);iceBit(_cryG,x,y,h,c,c*1.6,c,{life:rnd(0.5,0.8),up:0.02,down:0.2,v:[Math.cos(an)*v,Math.sin(an)*v,rnd(up*0.5,up)],spin:rnd(-12,12)});}}
function updateFRV(dt){
  for(const P of ICEP.values())P.n=0;
  for(let i=FRV.length-1;i>=0;i--){const f=FRV[i];f.age+=dt;if(f.age>=f.life){FRV.splice(i,1);continue;}
    const k=f.age<f.up?f.age/f.up:f.age>f.life-f.down?Math.max(0,(f.life-f.age)/f.down):1;
    if(f.v){f.x+=f.v[0]*dt*S3;f.z+=f.v[1]*dt*S3;f.y=Math.max(0.04,f.y+f.v[2]*dt);f.v[2]-=14*dt;f.rx+=f.spin*dt;f.rz+=f.spin*0.7*dt;}
    const P=f.P;if(P.n>=400)continue;
    _im4.compose(_ip.set(f.x,f.y,f.z),_iq.setFromEuler(_ie.set(f.rx,f.ry,f.rz,'XYZ')),_is.set(f.s[0]*k+0.001,f.s[1]*k+0.001,f.s[2]*k+0.001));P.im.setMatrixAt(P.n++,_im4);}
  for(const P of ICEP.values()){P.im.count=P.n;P.im.instanceMatrix.needsUpdate=true;P.im.visible=P.n>0;}
}
// วงผลึกสั้นๆ รอบขอบ (Permafrost / ทุบกลางอากาศ)
function iceRing(x,y,r,n,hgt,life,o){o=o||{};for(let i=0;i<n;i++){const an=i/n*6.283+rnd(-0.1,0.1),rr=r*rnd(0.92,1.05);iceBit(_spkG,x+Math.cos(an)*rr,y+Math.sin(an)*rr,hgt*0.45,rnd(0.1,0.18),hgt*rnd(0.7,1.2),rnd(0.1,0.18),{rx:rnd(-0.3,0.3),rz:rnd(-0.3,0.3),life,up:o.up||0.15,down:o.down||0.25});}}
function chillFX(o,p,pz,now,dt){
  const fs=p.fs|0;
  if(fs>0){
    if(!o.chG){o.chG=new THREE.Group();const m=new THREE.MeshBasicMaterial({color:'#dff6ff',transparent:true,opacity:0.75,depthWrite:false});o.chM=m;
      for(const L of o.legs){const c=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.13,0.5,7,1,true),m);c.position.y=-0.6;L.add(c);c.userData.leg=1;(o.chParts||(o.chParts=[])).push(c);}
      for(let i=0;i<6;i++){const cr=new THREE.Mesh(_cryG,iceFxM());const an=i/6*6.283;cr.position.set(Math.cos(an)*0.3,0.08,Math.sin(an)*0.3);cr.scale.set(0.06,0.14,0.06);o.chG.add(cr);}
      o.g.add(o.chG);}
    const k=Math.min(1,fs/30);o.chM.opacity=0.35+0.45*k;o.chParts.forEach(c=>{c.visible=true;c.scale.set(1,k,1);c.position.y=-0.85+0.25*k;});
    o.chG.visible=fs>=30;if(o.chG.visible)o.chG.rotation.y=now/2000;
    if(Math.random()<0.15*k)PARTS.push({x:p.x+rnd(-8,8),y:p.y+rnd(-8,8),h:pz+0.3,vx:0,vy:0,vh:0.2,life:0.6,max:0.6,col:'#eef8ff',size:3,g:0,smoke:true,grow:0.6});
    o.chOn=1;
  }else if(o.chOn){o.chOn=0;o.chParts&&o.chParts.forEach(c=>c.visible=false);if(o.chG)o.chG.visible=false;
    for(let i=0;i<14;i++)PARTS.push({x:p.x+rnd(-10,10),y:p.y+rnd(-10,10),h:pz+rnd(0.05,0.6),vx:rnd(-50,50),vy:rnd(-50,50),vh:rnd(0.5,2),life:0.45,max:0.45,col:i%2?'#ffffff':'#bfeaff',size:1.4,g:5});}
}
// รอยฟันดาบ: เสี้ยววงเรืองแสงที่จางเร็ว (แนวนอน = ฟันกวาด / แนวตั้ง = ฟันจากบนลงล่าง)
// wk = ความหนาของรอย (1 = เดิม 38% ของรัศมี, น้อย = รอยบางคม, มาก = รอยหนา) • norm = ผสมสีปกติ (เห็นบนพื้นสว่าง/หิมะ — แบบบวกแสงจะหายบนพื้นขาว)
function makeSlash(x,y,h,a,R,vert,tilt,col,br,wk,norm){
  const half=vert?1.25:1.05,geo=new THREE.RingGeometry(R*S3*(1-0.38*(wk||1)),R*S3,32,1,vert?-0.7:-half,vert?2.5:half*2);
  if(!vert)geo.rotateX(-Math.PI/2);
  const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:norm?new THREE.Color(col):hdr(col||'#cfefff',br||1.8),transparent:true,opacity:norm?0.75:0.85,blending:norm?THREE.NormalBlending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  m.position.set(tx(x),h+GY(x,y),tz(y));m.rotation.order='YXZ';m.rotation.y=-a;m.rotation.x=tilt||0;scene.add(m);
  SLV.push({m,age:0,life:0.22,r:br?R*S3:0});
}
// คลื่นดาบ Glacier Rend: เสี้ยวน้ำแข็งตั้งตรง (ตัวน้ำแข็งทึบให้เห็นชัดแม้บนหิมะ + ขอบขาวเรืองแสง + แสงฟุ้งรอบนอก)
let _wbGeo=null;
// ริบบิ้นโค้งแนวตั้ง: โค้งไปข้างหน้า (มองจากข้าง = เสี้ยวพระจันทร์) กว้างด้านข้างแบบใบดาบ หนากลาง ปลายแหลม (มองจากหลัง = ใบมีดตั้ง)
function crescentGeo(wk,xo){const N=24,pos=[],idx=[];
  for(let i=0;i<=N;i++){const a=-1.35+2.7*i/N,x=Math.cos(a)-1+xo,y=Math.sin(a),w=wk*Math.pow(Math.max(0,Math.cos(a*1.1)),1.4)+0.01;pos.push(x,y,-w,x,y,w);if(i){const q=i*2;idx.push(q-2,q-1,q,q-1,q+1,q);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
function makeWaveBlade(){
  if(!_wbGeo){_wbGeo=[crescentGeo(0.62,0),crescentGeo(0.2,0.04),crescentGeo(1.1,-0.05),crescentGeo(0.07,0.07)];_wbGeo.forEach(g=>g.userData.keep=true);}
  const g=new THREE.Group(),inner=new THREE.Group();g.add(inner);
  // หมุนให้แกน x ของรูปเสี้ยว = ทิศที่พุ่ง, แนวตั้ง = แกน y, ความหนา = ด้านข้าง
  const body=new THREE.Mesh(_wbGeo[0],new THREE.MeshStandardMaterial({color:'#b4dcf8',emissive:'#2a78c0',emissiveIntensity:0.45,roughness:0.5,metalness:0,transparent:true,opacity:0.9,side:THREE.DoubleSide,depthWrite:false}));
  const edge=new THREE.Mesh(_wbGeo[1],new THREE.MeshBasicMaterial({color:hdr('#e8f8ff',1.25),transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  const glow=new THREE.Mesh(_wbGeo[2],new THREE.MeshBasicMaterial({color:hdr('#5fc8ff',0.9),transparent:true,opacity:0.3,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));glow.scale.set(1.12,1.1,1);
  // รอบ VFX 2026-10-22 (ผู้ใช้: slash ต้องดีขึ้นมาก): + แกนขาวร้อนบางที่ขอบหน้า + เรืองไซยานชั้นนอกกว้าง • ใหญ่ขึ้น ~20% (ภาพเท่านั้น ระยะโดนเท่าเดิม)
  const core=new THREE.Mesh(_wbGeo[3],new THREE.MeshBasicMaterial({color:hdr('#ffffff',2),transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  const halo=new THREE.Mesh(_wbGeo[2],new THREE.MeshBasicMaterial({color:hdr('#2f9fff',0.7),transparent:true,opacity:0.18,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));halo.scale.set(1.3,1.25,1.6);
  inner.add(body,edge,glow,core,halo);inner.scale.set(1.8,2.05,1.6);inner.position.y=1.75;
  g.userData.mats=[body.material,edge.material,glow.material,core.material,halo.material];
  return g;
}
const WGH=[];
function updateSlashes(dt){
  for(let i=WGH.length-1;i>=0;i--){const q=WGH[i];q.age+=dt;const k=q.age/0.2;q.m.material.opacity=q.op*(1-k);q.m.scale.multiplyScalar(1+dt*0.6);if(k>=1){scene.remove(q.m);q.m.material.dispose();WGH.splice(i,1);}}
  for(let i=SLV.length-1;i>=0;i--){const s=SLV[i];s.age+=dt;const k=s.age/s.life,cd=s.m.position.distanceTo(cam.position);s.m.material.opacity=0.85*(1-k)*(s.r?Math.min(1,Math.max(0,(cd-s.r)/(s.r+2))):1);s.m.scale.setScalar(1+0.18*k);if(k>=1){scene.remove(s.m);s.m.geometry.dispose();s.m.material.dispose();SLV.splice(i,1);}}
  for(let i=ULTV.length-1;i>=0;i--){
    const u=ULTV[i];const st=Math.min(600-u.d,2000*dt);u.d+=st;u.acc+=st;
    const c=Math.cos(u.a),sn=Math.sin(u.a),x=u.x+c*u.d,y=u.y+sn*u.d;
    if(u.acc>=100){u.acc=0;   // (2026-10-22) ไม่มีเสี้ยวตั้งตรง 2 ข้างแล้ว — อาวุธลอย 3 เล่ม (js/34) ฟันให้เห็นเอง • เสี้ยวเดิมใหญ่ 3-4 ม. ลอยรอบกล้องตอนพุ่ง = จอขาวทั้งจอ
      burst(x,y,'#dff6ff',12,200,0.35,2,{h:1,g:2});for(let j=0;j<4;j++)iceBit(_plateG,x+rnd(-40,40),y+rnd(-40,40),rnd(0.6,1.8),0.22,0.22,0.12,{life:0.55,up:0.02,down:0.3,v:[rnd(-120,120),rnd(-120,120),rnd(1,4)],spin:rnd(-10,10)});}
    if(u.d>=600)ULTV.splice(i,1);
  }
}

// ภูเขาน้ำแข็งแบบท่าโทโดโรกิ: กลุ่มแท่งน้ำแข็งแหลมต่อกันเป็นแนว สูงขึ้นเรื่อยๆ (ความสูงตรงกับที่ host ใช้ให้เดินขึ้นไปได้)
let _glGeo=null,_glMat=null,_glMat2=null;
function makeGlacier(x,y,a,len,t){
  if(!_glGeo){_glGeo=new THREE.ConeGeometry(1,1,5);_glGeo.translate(0,0.5,0);_glGeo.userData.keep=true;
    _glMat=new THREE.MeshStandardMaterial({color:'#bfe4fa',emissive:'#2a6fa0',emissiveIntensity:0.45,roughness:0.5,metalness:0,transparent:true,opacity:0.9,flatShading:true});
    _glMat2=new THREE.MeshStandardMaterial({color:'#d4effc',emissive:'#4a9ad0',emissiveIntensity:0.5,roughness:0.5,transparent:true,opacity:0.75,flatShading:true});_glMat.userData.keep=_glMat2.userData.keep=true;}
  const g=new THREE.Group();g.position.set(tx(x),GY(x,y),tz(y));g.rotation.y=-a;scene.add(g);
  const spikes=[];
  mistLine(x,y,a,len,t,{rate:9,delay:len/1400});
  // กลุ่มหนามจากไฟล์ Blender (mesh_ice_spire) + shader น้ำแข็ง — ถ้ายังไม่โหลดใช้กรวยเดิมด้านล่าง
  const mat=MODELS.ready.get('mesh_ice_spire')?iceShaderMat({glow:1.1}):null;
  if(mat){for(let d=0;d<=len;d+=45){const H=1+7*d/len,dl=d/1400,wd=1.3+H*0.25;
      for(let i=0;i<4;i++){const m=iceModel('mesh_ice_spire',mat),big=i<2,hh=big?H*rnd(1.0,1.25)+0.5:H*rnd(0.4,0.75)+0.3,rr=(big?0.55+H*0.1:0.35+H*0.06)*2.2;
        m.position.set(d*S3+rnd(-0.8,0.8),-0.05,(big?rnd(-0.4,0.4):(i===2?-1:1)*rnd(0.5,1))*wd);
        m.rotation.set(rnd(-0.25,0.25),rnd(0,6.28),(big?-0.25:-0.1)+rnd(-0.2,0.2)+(i===3?0.35:i===2?-0.35:0));
        m.userData={hh,rr,dl};m.scale.setScalar(0.001);g.add(m);spikes.push(m);}
      spikes[spikes.length-1].userData.seg={d,dl,done:false};}
    return {g,spikes,age:0,t,mat};}
  for(let d=0;d<=len;d+=45){
    const H=1+7*d/len,dl=d/1400;
    const n=6+Math.floor(H*0.9),wd=1.4+H*0.28;
    for(let i=0;i<n;i++){
      const m=new THREE.Mesh(_glGeo,i===0?_glMat:(i%2?_glMat2:_glMat));
      const big=i<2,hh=(big?H*rnd(1.05,1.3)+0.6:H*rnd(0.35,1)+0.3),rr=big?0.6+H*0.12:rnd(0.3,0.6)+H*0.07;
      m.position.set(d*S3+rnd(-0.9,0.9),0,rnd(-wd,wd)*(big?0.35:1));
      m.rotation.set(rnd(-0.45,0.45),rnd(0,6.28),rnd(-0.4,0.3)-(big?0.3:0.2));
      m.userData={hh,rr};m.scale.set(0.001,0.001,0.001);g.add(m);spikes.push(m);
    }
    spikes[spikes.length-1].userData.seg={d,dl,done:false};
    spikes.forEach(s=>{if(s.userData.dl===undefined)s.userData.dl=dl;});
  }
  return {g,spikes,age:0,t};
}
function updateGlacierVis(dt){
  for(let i=GLV.length-1;i>=0;i--){
    const G2=GLV[i];G2.age+=dt;
    const fade=Math.min(1,Math.max(0,(G2.t-G2.age)/0.35));if(G2.mat)G2.mat.uniforms.uFade.value=Math.min(1,0.4+fade);
    for(const s of G2.spikes){const u=s.userData,k=clamp((G2.age-u.dl)/0.22,0,1)*fade;s.scale.set(u.rr*k+0.001,u.hh*k+0.001,u.rr*k+0.001);
      if(u.seg&&!u.seg.done&&k>0){u.seg.done=true;const p=new THREE.Vector3();s.getWorldPosition(p);const sx=p.x*20+MW/2,sy=p.z*20+MH/2;playFx('ice_hit',sx,sy,0.6,{s:1.1});glacierMist(sx,sy,50,4,{out:1.5,sz:1.2});if(Math.random()<0.5)dfCracks(sx,sy,0.06,40,'#bfeaff',0.8);iceChips(sx,sy,0.4,2,140,4);}}
    if(G2.age>=G2.t){scene.remove(G2.g);if(G2.mat)G2.mat.dispose();GLV.splice(i,1);}
  }
}
function updateOrbShots(dt){
  for(let i=OBV.length-1;i>=0;i--){const b=OBV[i];b.t+=dt;if(b.t<0)continue;const k=Math.min(1,b.t/b.max),px=-(b.y2-b.y),py=(b.x2-b.x),pl=Math.hypot(px,py)||1,arc=Math.sin(k*Math.PI)*40*b.s;
    const x=lerp(b.x,b.x2,k)+px/pl*arc,y=lerp(b.y,b.y2,k)+py/pl*arc,H=lerp(b.h,b.h2,k)+Math.sin(k*Math.PI)*0.8;
    if(b.sp){b.sp.visible=b.cr.visible=true;b.sp.position.set(tx(x),H+GY(x,y),tz(y));b.cr.position.copy(b.sp.position);const pu=1+0.15*Math.sin(b.t*40);b.sp.scale.setScalar(1.3*pu);}
    for(let j=0;j<3;j++)flame(x+rnd(-5,5),y+rnd(-5,5),H-0.2+rnd(-0.1,0.1),{vx:rnd(-20,20),vy:rnd(-20,20),vh:rnd(0.5,1.5),life:rnd(0.2,0.32),size:rnd(5,7),g:-1.5});
    for(let j=0;j<3;j++)PARTS.push({x:x+rnd(-6,6),y:y+rnd(-6,6),h:H+rnd(-0.15,0.15),vx:rnd(-40,40),vy:rnd(-40,40),vh:rnd(0,1.4),life:rnd(0.2,0.35),max:0.35,col:j?'#ffb347':'#fff0b0',size:1.6,g:2});
    for(let j=0;j<2;j++)PARTS.push({x:x+rnd(-5,5),y:y+rnd(-5,5),h:H,vx:0,vy:0,vh:0.6,life:0.4,max:0.4,col:j?'#ff7a1a':'#d8401a',size:4.5,g:-1,smoke:true,grow:1});
    LREQ.push({x:tx(x),y:H,z:tz(y),col:'#ff8a3a',int:2.5,dist:9});
    if(k>=1){if(b.sp){scene.remove(b.sp);scene.remove(b.cr);}burst(x,y,'#ffb347',12,200,0.35,2.6,{h:H,vh:[0,3],g:1});OBV.splice(i,1);}}
}
// ---------- คลื่นดาบน้ำแข็ง (ผู้ใช้ 2026-11-11): เส้นเสี้ยวบางคม ขอบหน้าขาว หางเป็นเส้นตรงเรียวลากไปข้างหลัง ไม่ใช่ครึ่งวงกลมทึบ ----------
// แผ่นเดียว: แนวโค้งเอียง 26° (ฟันเฉียง) ลากแผ่นหางไปด้านหลัง • shader วาดเส้นหน้า + ริ้วเส้นตรง + ปลายเรียว • ใช้ซ้ำ ไม่ dispose (ไม่ compile shader ใหม่)
const _fsl=new THREE.Vector3(),FSL={pool:[],geo:null};
function frostSlashGeo(){if(FSL.geo)return FSL.geo;const N=44,M=8,R=2.6,TL=0.45,P=[],U=[],I=[];
  for(let a=0;a<=N;a++){const u=a/N*2-1,th=u*1.2,r=R*Math.sin(th),fz=R*(Math.cos(th)-1)*0.75,tl=3.6*(0.25+0.75*(1-u*u));
    for(let b=0;b<=M;b++){const v=b/M;P.push(Math.sin(TL)*r,Math.cos(TL)*r,fz-tl*v);U.push(u,v);}}
  for(let a=0;a<N;a++)for(let b=0;b<M;b++){const q=a*(M+1)+b,r=q+M+1;I.push(q,r,q+1,r,r+1,q+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.userData.keep=true;return FSL.geo=g;}
function frostSlashGet(){let m=FSL.pool.pop();if(!m){m=new THREE.Mesh(frostSlashGeo(),new THREE.ShaderMaterial({uniforms:{time:FIRE_U.time,uFade:{value:1},uSeed:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform float time,uFade,uSeed;varying vec2 vUv;void main(){float u=vUv.x,v=vUv.y,au=abs(u);float tp=1.0-au*au*au;'+
      'float line=1.0-smoothstep(0.035,0.085,v);float glow=(1.0-smoothstep(0.06,0.34,v))*0.9;'+
      'float st=pow(abs(sin(u*31.0+uSeed+2.5*sin(u*9.0+uSeed))),14.0),st2=pow(abs(sin(u*57.0-uSeed*2.0)),22.0);'+
      'float tail=(st*0.95+st2*0.6)*pow(1.0-v,1.6)*(0.7+0.3*sin(time*34.0+u*40.0-v*18.0));float sheet=0.1*pow(1.0-v,3.0);'+
      'float a=clamp(line+glow+tail+sheet,0.0,1.0)*tp*uFade;if(a<0.01)discard;'+
      'vec3 c=mix(vec3(0.05,0.3,0.95),vec3(0.12,0.55,1.0),clamp(1.0-v*1.6,0.0,1.0));c=mix(c,vec3(0.6,0.9,1.0),tail*0.6);c=mix(c,vec3(1.0),line);gl_FragColor=vec4(c,a);}'}));
    m.material.userData.keep=true;m.frustumCulled=false;m.renderOrder=5;}
  scene.add(m);return m;}
function frostSlashPut(m){scene.remove(m);FSL.pool.push(m);}
function updateZV(dt){
  {let t=performance.now();const T=k=>{pf('zv.'+k,t);t=performance.now();};   // แยกเวลาแต่ละส่วน (WD.PROF — ปิดอยู่ = ไม่คิดเวลา)
  updateGlacierVis(dt);updateIceFloors(dt);T('ice');updateSlashes(dt);updateOrbShots(dt);updateDfCracks(dt);T('slash');updateStormV(dt);blazeVignette(dt);updateNovaDomes(dt);T('storm');updateFRV(dt);updateFireV(dt);T('fire');updateFrostV(dt);T('frost');updateVfxKit(dt);T('kit');wbBegin();updateFx(dt);wbEnd();T('fxfile');}
  for(let i=WVV.length-1;i>=0;i--){
    const w=WVV[i],st=Math.min(w.len-w.d,GREND.v.waveSpd*dt),c=Math.cos(w.a),sn=Math.sin(w.a);w.d+=st;
    if(!w.gnd){const cp=Math.cos(w.pt);w.x+=c*cp*st;w.y+=sn*cp*st;w.h+=Math.sin(w.pt)*st/20;
      if(w.h<=0.25){w.gnd=1;w.h=0;iceChips(w.x,w.y,0.6,6,220,4);dfCracks(w.x,w.y,0.06,35,'#bfeaff',0.4);if(nearMe(w.x,w.y,900))snd('break',{x:w.x,y:w.y,vol:0.5});}}
    else{w.x+=c*st;w.y+=sn*st;w.cr=(w.cr||0)+st;if(w.cr>=140){w.cr=0;dfCracks(w.x,w.y,0.06,30,'#bfeaff',0.35);}}
    const x=w.x,y=w.y,px=-sn,py=c,k=w.d/w.len,M=w.m,gy=GY(x,y),wy=gy+(w.gnd?1.05:w.h);
    M.position.set(tx(x),wy,tz(y));
    if(w.gnd)_fsl.set(tx(x+c*40),wy,tz(y+sn*40));else{const cp=Math.cos(w.pt);_fsl.set(tx(x+c*cp*40),wy+Math.sin(w.pt)*2,tz(y+sn*cp*40));}
    M.lookAt(_fsl);M.scale.setScalar((0.35+0.65*Math.min(1,w.d/80))*1.75);   // ใหญ่ขึ้นเห็นชัด (ผู้ใช้ 2026-11-15)M.material.uniforms.uFade.value=k>0.82?(1-k)/0.18:1;M.material.uniforms.uSeed.value=w.len*0.01+i;
    LREQ.push({x:tx(x),y:wy,z:tz(y),col:'#8fe0ff',int:2.6,dist:10});
    for(let q=0;q<4;q++){const s2=rnd(-48,48);PARTS.push({x:x+px*s2,y:y+py*s2,h:(w.gnd?1.05:w.h)+rnd(-0.15,0.15),vx:c*60,vy:sn*60,vh:0,life:0.16,max:0.16,col:q%2?'#ffffff':'#7fd4ff',size:rnd(4,6.5),g:0});}   // แสงแนวคมคลื่น
    // เศษน้ำแข็งเล็กปลิวตามหลัง (น้อย ไม่บังเส้น)
    for(let q=0;q<2;q++){const s=rnd(-34,34);PARTS.push({x:x+px*s-c*10,y:y+py*s-sn*10,h:(w.gnd?0:w.h)+rnd(0.2,1.8),vx:c*120,vy:sn*120,vh:rnd(0,2),life:0.3,max:0.3,col:q?'#ffffff':'#bfeaff',size:rnd(1.4,2.4),g:4,drag:3});}
    if(w.d>=w.len){if(w.gnd){playFx('ice_impact',x,y,1.2,{s:0.6});iceChips(x,y,1,6,200,4);}
      else{burst(x,y,'#dff6ff',w.hitWall?26:14,w.hitWall?260:180,0.3,2,{h:w.h,g:1});if(w.hitWall){iceChips(x,y,0.8,10,240,4);if(nearMe(x,y,900))snd('break',{x,y,vol:0.5});}}
      frostSlashPut(M);WVV.splice(i,1);}
  }
  for(let i=COLB.length-1;i>=0;i--){
    const b=COLB[i];b.t+=dt;const k=Math.min(1,b.t/b.max),x=lerp(b.x,b.x2,k),y=lerp(b.y,b.y2,k),H=lerp(b.h,b.h2!==undefined?b.h2+0.2:0.2,k);
    for(let j=0;j<5;j++)flame(x+rnd(-8,8),y+rnd(-8,8),H-0.3+rnd(-0.2,0.2),{vx:(b.x-b.x2)*0.3+rnd(-30,30),vy:(b.y-b.y2)*0.3+rnd(-30,30),vh:rnd(0.5,2),life:rnd(0.3,0.45),size:rnd(11,15),drag:3});
    for(let n=0;n<5;n++)PARTS.push({x:x+rnd(-6,6),y:y+rnd(-6,6),h:H+rnd(-0.2,0.2),vx:rnd(-40,40),vy:rnd(-40,40),vh:rnd(0,2),life:0.35,max:0.35,col:n<2?'#fff0b0':'#ff7a2a',size:n<2?3:5,g:-1,drag:3});
    LREQ.push({x:tx(x),y:H,z:tz(y),col:'#ff8a3a',int:3,dist:14});
    if(k>=1)COLB.splice(i,1);
  }
  for(let i=ZV.length-1;i>=0;i--){
    const z=ZV[i];z.t-=dt;if(z.t<=0){if(z.wall){scene.remove(z.wall);z.wall.traverse(m=>{if(m.geometry)m.geometry.dispose();});z.wall.userData.mats.forEach(m=>m.dispose());}ZV.splice(i,1);continue;}
    if(z.file)continue;   // ไฟล์ vfx_zone_* แทนที่ภาพจากโค้ดแล้ว (mode:"replace")
    if(z.kind==='icering'){
      if(Math.random()<0.15){const a=rnd(0,6.283),d=Math.sqrt(Math.random())*z.r;PARTS.push({x:z.x+Math.cos(a)*d,y:z.y+Math.sin(a)*d,h:rnd(0.3,1.5),vx:-Math.sin(a)*30,vy:Math.cos(a)*30,vh:-0.1,life:1.2,max:1.2,col:'#ffffff',size:1.3,g:0,drag:0.2});}
      if(z.t<=dt*1.5&&!z.sh){z.sh=1;dfCracks(z.x,z.y,0.07,z.r,'#ffffff',0.5);for(let j=0;j<16;j++){const a=rnd(0,6.283),d=Math.sqrt(Math.random())*z.r;iceBit(_plateG,z.x+Math.cos(a)*d,z.y+Math.sin(a)*d,0.1,rnd(0.3,0.5),0.4,rnd(0.25,0.4),{life:0.6,up:0.02,down:0.3,v:[rnd(-40,40),rnd(-40,40),rnd(2,4)],spin:rnd(-6,6)});}}
      // (เอาควันน้ำแข็งออก — ผู้ใช้ 2026-11-15)
      if(Math.random()<0.25){const a=rnd(0,6.283);PARTS.push({x:z.x+Math.cos(a)*z.r,y:z.y+Math.sin(a)*z.r,h:0.15,vx:0,vy:0,vh:rnd(0.8,1.8),life:0.6,max:0.6,col:'#bfeaff',size:2.2,g:-0.5});}
      continue;
    }
    if(z.kind==='ering'){
      // วงเพลิงกักขัง: กำแพงไฟ 3 มิติสูงรอบขอบ — เปลวหลายชั้นพุ่งขึ้นบิดวน ฐานเหลืองขาว ปลายส้มแดง • ระลอกไฟวิ่งวนรอบกำแพง • ประกาย/ถ่านพุ่งออก
      const age=(z.age=(z.age||0)+dt),up=Math.min(1,age/0.25),now2=performance.now(),wv=now2/450,nf=z.r*(z.wall?6:9.6)*dt,nn=Math.floor(nf)+(Math.random()<nf%1?1:0);
      // กำแพง shader: พุ่งขึ้นเร็ว (เด้งเกินนิด) → ระลอกสูงต่ำ → ยุบลงพื้น 0.3 วิสุดท้าย
      if(z.wall){const e=age<0.25?Math.sin(age/0.25*1.9)/Math.sin(1.9)*1.12:1,end=Math.min(1,z.t/0.3);z.wall.scale.y=Math.max(0.01,e*end*(1+0.06*Math.sin(now2/160)));z.wall.rotation.y+=dt*0.25;
        z.wall.userData.mats.forEach((m,j)=>{m.uniforms.uHeat.value=(m.userData.h0||0)+(age<0.35?0.18*(1-age/0.35):0);});}
      for(let k=0;k<nn;k++){const a=rnd(0,6.283),rr=z.r+rnd(-6,6),px=z.x+Math.cos(a)*rr,py=z.y+Math.sin(a)*rr;
        const d1=Math.abs(angDiff(a,wv)),d2=Math.abs(angDiff(a,wv+Math.PI)),boost=1+0.9*Math.max(0,1-Math.min(d1,d2)/0.6);
        flame(px,py,0.05,{vx:-Math.sin(a)*45,vy:Math.cos(a)*45,vh:rnd(4,7)*boost*up,life:rnd(0.5,0.75),size:rnd(12,18)*(0.6+0.4*up)*Math.min(1.5,boost),g:-2,drag:2.5,grow:0.25,col:Math.random()<0.6?'#ffffff':'#ffd8b0',fb:'-'});}
      for(let k=0;k<Math.round(nn*0.4);k++){const a=rnd(0,6.283);flame(z.x+Math.cos(a)*z.r,z.y+Math.sin(a)*z.r,0.03,{vh:rnd(1.5,2.5),life:0.3,size:rnd(6,8),g:-1,col:'#fff2d0',fb:'-'});}
      for(let k=0;k<(Math.random()<dt*120?2:0);k++){const a=rnd(0,6.283),out=Math.random()<0.5?1:-1;PARTS.push({x:z.x+Math.cos(a)*z.r,y:z.y+Math.sin(a)*z.r,h:rnd(0.5,2.5),vx:Math.cos(a)*out*rnd(60,140),vy:Math.sin(a)*out*rnd(60,140),vh:rnd(2,5),life:rnd(0.4,0.7),max:0.7,col:Math.random()<0.5?'#ffd27a':'#ff7a2a',size:1.5,g:5,drag:1.5});}
      // ไอร้อนลอยขึ้น
      if(Math.random()<dt*30){const a=rnd(0,6.283);PARTS.push({x:z.x+Math.cos(a)*z.r,y:z.y+Math.sin(a)*z.r,h:3,vx:0,vy:0,vh:1.2,life:1.2,max:1.2,col:'#3a2a24',size:7,g:-0.3,smoke:true,grow:1.3,drag:2});}
      if(Math.random()<0.6){const a=rnd(0,6.283);LREQ.push({x:tx(z.x+Math.cos(a)*z.r),y:1.8,z:tz(z.y+Math.sin(a)*z.r),col:'#ff6a2a',int:2.6,dist:14});}
      continue;
    }
    const n=Math.max(1,Math.round(z.r*dt*(z.kind==='lava'?0.14:0.09)));
    for(let k=0;k<n;k++){
      const a=rnd(0,Math.PI*2),d=Math.sqrt(Math.random())*z.r,px=z.x+Math.cos(a)*d,py=z.y+Math.sin(a)*d;
      if(z.kind==='fire'||z.kind==='lava'){
        PARTS.push({x:px,y:py,h:0.2,vx:rnd(-12,12),vy:rnd(-12,12),vh:rnd(1.4,3.4),life:rnd(0.4,0.8),max:0.8,col:Math.random()<0.5?'#ff7a2a':'#ffc04a',size:z.kind==='lava'?5.5:4.5,g:-1.5,drag:3});
        if(Math.random()<0.18)PARTS.push({x:px,y:py,h:0.8,vx:0,vy:0,vh:rnd(0.6,1.4),life:1.2,max:1.2,col:'#2a2522',size:6,g:-0.3,smoke:true,grow:1.3,drag:2});
      }else if(z.kind==='frost'){
        PARTS.push({x:px,y:py,h:rnd(4,7),vx:rnd(-60,60),vy:rnd(-60,60),vh:rnd(-3.5,-2),life:1.4,max:1.4,col:Math.random()<0.6?'#ffffff':'#9fe8ff',size:2.2,g:0,drag:1});
        if(Math.random()<0.2)PARTS.push({x:px,y:py,h:0.5,vx:0,vy:0,vh:0.5,life:1.2,max:1.2,col:'#cfeaff',size:7,g:-0.2,smoke:true,grow:1.2,drag:2});
      }else if(z.kind==='bloom'){
        PARTS.push({x:px,y:py,h:0.2,vx:rnd(-8,8),vy:rnd(-8,8),vh:rnd(0.8,2),life:1.3,max:1.3,col:Math.random()<0.5?'#ff9ad5':'#9aff9a',size:2.6,g:-0.3,drag:2});
      }else if(z.kind==='spore'){
        PARTS.push({x:px,y:py,h:rnd(0.3,2),vx:rnd(-14,14),vy:rnd(-14,14),vh:rnd(0.1,0.7),life:1.5,max:1.5,col:Math.random()<0.5?'#b6e86a':'#6f9a2a',size:rnd(5,9),g:-0.1,smoke:true,grow:0.8,drag:2});
        if(Math.random()<0.4)PARTS.push({x:px,y:py,h:rnd(0.3,2),vx:0,vy:0,vh:0.5,life:0.8,max:0.8,col:'#d8ff7a',size:1.6,g:0});
      }else if(z.kind==='storm'){
        PARTS.push({x:px,y:py,h:rnd(0.2,3),vx:rnd(-40,40),vy:rnd(-40,40),vh:rnd(-1,2),life:0.3,max:0.3,col:Math.random()<0.5?'#fff27a':'#ffffff',size:2,g:0,drag:4});
        if(Math.random()<0.06*z.r/100)FX.bolt(px,py,rnd(0.2,3),px+rnd(-60,60),py+rnd(-60,60),rnd(0,2.5),0.14,'#fff27a');
      }
    }
    if((z.kind==='lava'||z.kind==='storm')&&Math.random()<0.5)LREQ.push({x:tx(z.x),y:1.4,z:tz(z.y),col:z.col,int:1.6,dist:12});
  }
}
const WM3=new Map();
