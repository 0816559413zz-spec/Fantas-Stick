// =====================================================================
//  น้ำแข็ง VFX จาก Blender + Glacier Mist (หมอกเย็นตอนน้ำแข็งโผล่)
//  ไฟล์โมเดล: mesh_ice_burst (มงกุฎหนามบนพื้น) / mesh_ice_spire (กลุ่มหนาม) — ต้นฉบับ assets/src/frost_meshes_build.py + frost_meshes.blend
//  โหลดท้ายสุด: มีแต่คำนิยาม (ไฟล์ก่อนหน้าเรียกฟังก์ชันพวกนี้ได้ตอนเล่น ไม่ใช่ตอนโหลด)
// =====================================================================
const FROST_U={time:{value:0}};
// ---------- shader น้ำแข็ง: ฐานน้ำเงินเข้ม → ปลายขาว • ขอบสว่าง (fresnel) • รอยร้าวข้างใน • ประกายวิบวับ ----------
const ICE_VS=`varying vec3 vW;varying vec3 vO;varying float vH;
void main(){vH=uv.y;vO=position;vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const ICE_FS=`uniform float uT;uniform float uFade;uniform float uGlow;uniform float uRim;uniform sampler2D uNz;varying vec3 vW;varying vec3 vO;varying float vH;
void main(){
  vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));vec3 v=normalize(cameraPosition-vW);if(dot(n,v)<0.0)n=-n;
  float fr=pow(1.0-abs(dot(n,v)),2.0);
  float nz=texture2D(uNz,vO.xz*1.3+vec2(vO.y*0.7,vO.y*0.4)).r;
  float cr=1.0-smoothstep(0.0,0.035,abs(nz-0.5));
  float facet=0.5+0.5*dot(n,normalize(vec3(0.35,1.0,0.25)));
  vec3 deep=vec3(0.03,0.16,0.45),mid=vec3(0.18,0.58,1.0),hi=vec3(0.8,0.95,1.0);
  vec3 c=mix(deep,mid,smoothstep(0.0,0.55,vH));c=mix(c,hi,smoothstep(0.5,1.0,vH)*0.55);
  c*=0.45+0.6*facet;c+=vec3(0.4,0.78,1.0)*fr*0.55*uRim;c+=vec3(0.6,0.92,1.0)*cr*(0.35+0.35*vH);
  float sp=texture2D(uNz,vO.xy*3.0+vec2(uT*0.05,-uT*0.03)).r;c+=vec3(0.85,0.95,1.0)*smoothstep(0.9,0.97,sp)*(0.4+fr*0.6);
  c*=uGlow;float a=clamp((0.72+0.28*fr+0.2*cr)*uFade,0.0,1.0);
  gl_FragColor=vec4(c,a);}`;
let _iceShM=null;
function iceShaderMat(o){o=o||{};
  if(!_iceShM){_iceShM=new THREE.ShaderMaterial({uniforms:{uT:FROST_U.time,uFade:{value:1},uGlow:{value:1},uRim:{value:1},uNz:{value:NOISETEX}},vertexShader:ICE_VS,fragmentShader:ICE_FS,transparent:true,depthWrite:true,side:THREE.FrontSide});_iceShM.userData.keep=true;}
  const m=_iceShM.clone();m.uniforms.uT=FROST_U.time;m.uniforms.uNz.value=NOISETEX;m.uniforms.uGlow.value=o.glow||0.95;m.uniforms.uRim.value=o.rim===undefined?1:o.rim;return m;}
// อินสแตนซ์ของโมเดลน้ำแข็งจากไฟล์ (null ถ้ายังไม่โหลด → เริ่มโหลด แล้วผู้เรียกใช้ภาพเดิมแทน)
function iceModel(name,mat){
  if(!MODELS.ready.get(name)){if(!MODELS.fail.has(name))loadModel(name);return null;}
  const g=modelInst(name);g.traverse(m=>{if(m.isMesh){m.material=mat;m.castShadow=false;m.receiveShadow=false;m.renderOrder=2;}});return g;}

// ---------- มงกุฎหนามน้ำแข็งพุ่งจากพื้น (ภาพอ้างอิงจากผู้ใช้) ----------
// x,y = จุดบนแผนที่ (px) • R = รัศมี (หน่วย 3D) • o.h = ความสูงพื้น • o.life = อยู่นานเท่าไร • o.hy = ยืดสูง • o.mist = จำนวนหมอก (0 = ไม่มี)
const ICEM=[];
function iceBurst(x,y,R,o){o=o||{};
  const life=o.life||1.1,n=o.mist===undefined?Math.round(8+R*5):o.mist;
  if(n)glacierMist(x,y,R*20*0.9,n,{h:o.h||0,out:R*1.6});
  const mat=iceShaderMat({glow:o.glow}),g=iceModel('mesh_ice_burst',mat);
  if(!g){mat.dispose();iceRing(x,y,R*20*0.8,Math.round(8+R*3),R*0.8,life,{up:0.12,down:0.3});return null;}
  const root=new THREE.Group();root.position.set(tx(x),(o.h||0)+GY(x,y),tz(y));root.rotation.y=rnd(0,6.283);root.add(g);scene.add(root);
  const E={root,mat,age:0,life,R,hy:o.hy||1,up:o.up||0.16};ICEM.push(E);E.root.scale.setScalar(0.001);return E;}
function updateIceMeshes(dt){
  for(let i=ICEM.length-1;i>=0;i--){const E=ICEM[i];E.age+=dt;
    const u=E.age/E.up,grow=u<1?1-Math.pow(1-u,3)*(1-0.6*u)+Math.sin(u*Math.PI)*0.18:1,end=Math.max(0,Math.min(1,(E.life-E.age)/0.3));
    E.root.scale.set(E.R*grow,E.R*E.hy*grow*(0.25+0.75*end),E.R*grow);E.mat.uniforms.uFade.value=end;
    if(E.age>=E.life){scene.remove(E.root);E.mat.dispose();ICEM.splice(i,1);}}
}

// ---------- Glacier Mist: หมอกเย็นลอยต่ำ ฟุ้งออกจากน้ำแข็ง (InstancedMesh 1 draw call, ภาพ billboard หันหากล้อง) ----------
const MISTTEX=(()=>{const N=128,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),im=x.createImageData(N,N);
  let sd=91;const rr=()=>((sd=(sd*16807)%2147483647)/2147483647);const oct=[];for(let o=0;o<5;o++){const L=3<<o,g=[];for(let i=0;i<L*L;i++)g.push(rr());oct.push({L,g});}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){let v=0,a=0.5,t=0;for(const {L,g} of oct){const fx=i/N*L,fy=j/N*L,ix=Math.floor(fx),iy=Math.floor(fy),ux=fx-ix,uy=fy-iy,sx=ux*ux*(3-2*ux),sy=uy*uy*(3-2*uy);
      const G=(p,q)=>g[((q+L)%L)*L+((p+L)%L)],a0=G(ix,iy)+(G(ix+1,iy)-G(ix,iy))*sx,a1=G(ix,iy+1)+(G(ix+1,iy+1)-G(ix,iy+1))*sx;v+=a*(a0+(a1-a0)*sy);t+=a;a*=0.5;}
    v/=t;const dx=i/N-0.5,dy=j/N-0.5,r=Math.sqrt(dx*dx+dy*dy)*2,fall=Math.max(0,1-r);const al=Math.max(0,Math.min(1,(v-0.3)*2.2))*fall*fall*(3-2*fall);
    const k=(j*N+i)*4;im.data[k]=im.data[k+1]=im.data[k+2]=Math.round((0.7+0.3*v)*255);im.data[k+3]=Math.round(al*255);}
  x.putImageData(im,0,0);const T=new THREE.CanvasTexture(c);T.userData.keep=true;return T;})();
const MISTMAX=220,MISTP=[],MISTSRC=[];let _mistIM=null,_mistA=null;
function mistMesh(){if(_mistIM)return _mistIM;
  const geo=new THREE.PlaneGeometry(1,1);_mistA=new THREE.InstancedBufferAttribute(new Float32Array(MISTMAX*2),2);geo.setAttribute('iData',_mistA);
  const mat=new THREE.ShaderMaterial({uniforms:{uTex:{value:MISTTEX},uCol:{value:new THREE.Color('#a8c3dc')}},transparent:true,depthWrite:false,
    vertexShader:`attribute vec2 iData;varying vec2 vUv;varying float vA;varying float vVZ;
      void main(){vA=iData.x;float c=cos(iData.y),s=sin(iData.y);vUv=vec2(c*(uv.x-0.5)-s*(uv.y-0.5),s*(uv.x-0.5)+c*(uv.y-0.5))+0.5;
        vec4 ctr=modelViewMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0);float sc=length(instanceMatrix[0].xyz);
        ctr.xy+=position.xy*sc*vec2(1.5,0.85);vVZ=-ctr.z;gl_Position=projectionMatrix*ctr;}`,
    fragmentShader:SOFT_GLSL+`uniform sampler2D uTex;uniform vec3 uCol;varying vec2 vUv;varying float vA;
      void main(){vec4 t=texture2D(uTex,vUv);float a=t.a*vA;if(a<0.004)discard;gl_FragColor=vec4(uCol*(0.72+0.4*t.r),a*softK(1.2));}`});fxMat(mat);
  mat.userData.keep=true;geo.userData.keep=true;
  _mistIM=new THREE.InstancedMesh(geo,mat,MISTMAX);_mistIM.count=0;_mistIM.frustumCulled=false;_mistIM.renderOrder=4;return _mistIM;}
// ก้อนหมอก 1 ก้อน (พิกัดแผนที่ px) — vx/vy px/วิ, size = หน่วย 3D
function mistPuff(x,y,h,o){if(VFXB.k<1&&Math.random()>=VFXB.k)return;const mx=VFXB.mul<1?MISTMAX>>1:MISTMAX;while(MISTP.length>=mx)MISTP.shift();
  MISTP.push({x,y,h,vx:o.vx||0,vy:o.vy||0,vh:o.vh||0,s:o.size||2,grow:o.grow||0.5,age:0,life:o.life||2,a:o.a||0.5,rot:rnd(0,6.283),vr:rnd(-0.4,0.4)});}
// หมอกฟุ้งเป็นวง: n ก้อน รอบจุด x,y รัศมี r (px) ไหลออกด้านนอกช้า ๆ ต่ำติดพื้น
function glacierMist(x,y,r,n,o){o=o||{};const h0=o.h||0;
  for(let i=0;i<n;i++){const an=rnd(0,6.283),d=Math.sqrt(Math.random())*r,sp=rnd(20,60)*(o.out?o.out*0.6:1);
    mistPuff(x+Math.cos(an)*d,y+Math.sin(an)*d,h0+rnd(0.1,0.7),{vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,vh:rnd(0.05,0.35),size:rnd(1.6,3)*(o.sz||1),grow:rnd(0.25,0.55),life:rnd(1.6,2.8)*(o.lf||1),a:rnd(0.35,0.6)*(o.a||1)});}}
// แหล่งหมอกค้าง: ปล่อยหมอกเรื่อย ๆ ตลอดเวลา t — แนวเส้น (ภูเขาน้ำแข็ง) หรือวง (Permafrost)
function mistLine(x,y,a,len,t,o){MISTSRC.push({k:'line',x,y,a,len,t,age:0,rate:(o&&o.rate)||10,acc:0,delay:(o&&o.delay)||0});}
function mistArea(x,y,r,t,o){MISTSRC.push({k:'area',x,y,r,t,age:0,rate:(o&&o.rate)||8,acc:0,delay:0});}
function updateMist(dt){
  for(let i=MISTSRC.length-1;i>=0;i--){const S=MISTSRC[i];S.age+=dt;if(S.age>=S.t){MISTSRC.splice(i,1);continue;}
    const fade=Math.min(1,(S.t-S.age)/1.2);S.acc+=S.rate*dt*fade;
    while(S.acc>=1){S.acc-=1;
      if(S.k==='line'){const reach=S.len*Math.min(1,S.age/Math.max(0.01,S.delay||0.01)),d=rnd(0,reach),px=-Math.sin(S.a),py=Math.cos(S.a),w=rnd(-60,60);
        mistPuff(S.x+Math.cos(S.a)*d+px*w,S.y+Math.sin(S.a)*d+py*w,rnd(0.1,0.5),{vx:px*Math.sign(w)*rnd(15,40),vy:py*Math.sign(w)*rnd(15,40),vh:rnd(0.02,0.2),size:rnd(1.8,3.2),grow:0.3,life:rnd(2,3),a:rnd(0.25,0.42)});}
      else{const an=rnd(0,6.283),d=Math.sqrt(Math.random())*S.r;mistPuff(S.x+Math.cos(an)*d,S.y+Math.sin(an)*d,rnd(0.05,0.35),{vx:Math.cos(an)*rnd(5,20),vy:Math.sin(an)*rnd(5,20),vh:0.05,size:rnd(2,3.5),grow:0.25,life:rnd(2.2,3.2),a:rnd(0.2,0.34)});}}}
  if(!MISTP.length){if(_mistIM)_mistIM.visible=false;return;}
  const IM=mistMesh();if(IM.parent!==fxScene)fxScene.add(IM);IM.visible=true;let n=0;const D=_mistA.array;
  for(let i=MISTP.length-1;i>=0;i--){const p=MISTP[i];p.age+=dt;if(p.age>=p.life){MISTP.splice(i,1);continue;}
    const dr=Math.exp(-1.2*dt);p.x+=p.vx*dt;p.y+=p.vy*dt;p.h+=p.vh*dt;p.vx*=dr;p.vy*=dr;p.vh*=dr;p.s*=1+p.grow*dt;p.rot+=p.vr*dt;
    const k=p.age/p.life,al=p.a*Math.min(1,k*5)*(1-k)*(1-k)*1.35;
    _im4.compose(_ip.set(tx(p.x),p.h+GY(p.x,p.y)+p.s*0.25,tz(p.y)),_iq.identity(),_is.set(p.s,p.s,p.s));IM.setMatrixAt(n,_im4);D[n*2]=al;D[n*2+1]=p.rot;n++;}
  IM.count=n;IM.instanceMatrix.needsUpdate=true;_mistA.needsUpdate=true;
}
// คลื่นหมอกต่ำแผ่ออกจากจุดกระแทก (ฟาดพื้น)
function mistWave(x,y,r,n){for(let i=0;i<n;i++){const an=i/n*6.283+rnd(-0.15,0.15);mistPuff(x+Math.cos(an)*r,y+Math.sin(an)*r,0.02,{vx:Math.cos(an)*rnd(200,280),vy:Math.sin(an)*rnd(200,280),vh:0,size:rnd(1.3,1.9),grow:0.6,life:rnd(0.8,1.1),a:0.35});}}   // ต่ำติดพื้น วิ่งออกเร็ว ไม่บังตัวละคร
// Frostforge เปิด: ผลึกน้ำแข็ง + หมอกเย็นลอยขึ้นรอบตัว (รู้สึกว่าเพิ่งเพิ่มพลัง)
function forgeRise(x,y){vfxOnce(()=>{for(let i=0;i<16;i++){const an=rnd(0,6.283),d=rnd(14,34);PARTS.push({x:x+Math.cos(an)*d,y:y+Math.sin(an)*d,h:rnd(0.1,0.6),vx:Math.cos(an)*rnd(5,20),vy:Math.sin(an)*rnd(5,20),vh:rnd(2,4.5),life:rnd(0.8,1.3),max:1.2,col:'#eaf8ff',c2:'#3a8cff',size:rnd(2.6,3.8),g:-0.4,drag:1.5,sh:4,rot:rnd(0,6.283),vr:rnd(-5,5),fin:8});}
  for(let i=0;i<8;i++){const an=i/8*6.283;mistPuff(x+Math.cos(an)*22,y+Math.sin(an)*22,0.1,{vx:Math.cos(an)*30,vy:Math.sin(an)*30,vh:rnd(0.6,1.2),size:rnd(1.4,2),grow:0.6,life:rnd(1,1.5),a:0.4});}
  for(let i=0;i<6;i++){const an=rnd(0,6.283),d=rnd(16,30);iceBit(_cryG,x+Math.cos(an)*d,y+Math.sin(an)*d,0.05,0.07,0.16,0.07,{life:0.9,up:0.05,down:0.3,v:[Math.cos(an)*20,Math.sin(an)*20,rnd(5,8)],spin:rnd(-8,8)});}});}
// ระหว่างบัฟ Frostforge 6 วิ: เบา ๆ ต่อเนื่อง (ผลึกลอยขึ้นไม่กี่ชิ้น + หมอกบาง) — เรียกทุกเฟรมจาก frostFX
function forgeAura(x,y,h){if(Math.random()<0.35){const an=rnd(0,6.283),d=rnd(12,26);PARTS.push({x:x+Math.cos(an)*d,y:y+Math.sin(an)*d,h:h+rnd(0.1,0.8),vx:0,vy:0,vh:rnd(1,2),life:rnd(0.7,1.1),max:1,col:'#eaf8ff',c2:'#3a8cff',size:rnd(1.8,2.6),g:-0.3,drag:1,sh:4,rot:rnd(0,6.283),vr:rnd(-4,4),fin:6});}
  if(Math.random()<0.08){const an=rnd(0,6.283);mistPuff(x+Math.cos(an)*18,y+Math.sin(an)*18,h+0.1,{vx:0,vy:0,vh:0.5,size:1.3,grow:0.5,life:1.2,a:0.25});}}
function updateFrostV(dt){FROST_U.time.value+=dt;updateIceMeshes(dt);updateIceCircles(dt);updateMist(dt);}

// ---------- ดาบ/ขวานน้ำแข็งจากไฟล์ Blender (mesh_ice_sword / mesh_ice_axe) ----------
// คืน Group ตำแหน่งเดียวกับแบบโค้ดเดิม (จุดหมุนในกำมือ) หรือ null ถ้ายังไม่โหลด (frostFX สลับให้เองเมื่อโหลดเสร็จ)
let _wpM=null;
function fileWeapon(name,py,glow,gy){
  if(!MODELS.ready.get(name)){if(!MODELS.fail.has(name))loadModel(name);return null;}
  if(!_wpM){_wpM={ice:iceShaderMat({glow:1.0,rim:0.35}),core:new THREE.MeshBasicMaterial({color:hdr('#8fd8ff',1.1),transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false}),gem:new THREE.MeshBasicMaterial({color:hdr('#7fe0ff',1.6)})};
    _wpM.ice.side=THREE.DoubleSide;for(const k in _wpM)_wpM[k].userData.keep=true;}
  const g=new THREE.Group();g.position.set(0,py,0.02);g.userData.file=1;const inst=modelInst(name);
  inst.traverse(m=>{if(!m.isMesh)return;m.castShadow=true;m.receiveShadow=false;const n=(m.material.name||'').replace(/\.\d+$/,'');if(_wpM[n]){m.material=_wpM[n];if(n!=='ice')m.castShadow=false;}});
  g.add(inst);const gl=new THREE.Sprite(glowMat('#8fe0ff',0.8));gl.scale.setScalar(glow*0.8);if(gy)gl.position.y=gy;g.add(gl);return g;}

// ---------- Ice circle (Permafrost): ริบบิ้นแสงวนเป็นก้นหอยบนพื้น + ผลึกลอยหมุนรอบ + หมอก ----------
const SWIRL_FS=`uniform float uT;uniform float uFade;uniform float uSp;varying vec2 vUv;
void main(){float across=1.0-abs(vUv.y*2.0-1.0);float head=fract(vUv.x*1.5-uT*uSp);float streak=pow(head,3.0);
  float a=smoothstep(0.0,0.5,across)*(0.55+1.8*streak)*smoothstep(0.0,0.12,vUv.x)*smoothstep(1.0,0.75,vUv.x)*uFade;
  vec3 c=mix(vec3(0.12,0.48,1.0),vec3(0.85,0.97,1.0),streak*across*0.75);gl_FragColor=vec4(c*1.7,min(1.0,a));}`;
const ICIRC=[];
function iceCircle(x,y,R,t){
  if(!MODELS.ready.get('mesh_ice_circle')){if(!MODELS.fail.has('mesh_ice_circle'))loadModel('mesh_ice_circle');return;}
  const root=new THREE.Group();root.position.set(tx(x),GY(x,y)+0.05,tz(y));scene.add(root);const rings=[];
  for(const [s,sp,dir] of [[1,0.55,1],[0.55,0.8,-1]]){
    const mat=new THREE.ShaderMaterial({uniforms:{uT:FROST_U.time,uFade:{value:0},uSp:{value:sp}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:SWIRL_FS,
      transparent:true,depthWrite:false,side:THREE.DoubleSide});   // ผสมแบบปกติ (ไม่ additive) → เห็นเป็นสีฟ้าทั้งบนพื้นสว่างและพื้นมืด
    const m=modelInst('mesh_ice_circle');m.traverse(q=>{if(q.isMesh){q.material=mat;q.renderOrder=3;q.castShadow=q.receiveShadow=false;}});
    const piv=new THREE.Group();piv.scale.set(R*s,1,R*s*(dir<0?-1:1));piv.add(m);root.add(piv);rings.push({piv,mat,dir,sp});}
  const sh=[];for(let i=0;i<22;i++)sh.push({a:rnd(0,6.283),r:rnd(0.25,0.95)*R,h:rnd(0.2,2.2),w:rnd(0.25,0.6)*(Math.random()<0.5?1:-1),b:rnd(0,6.283),s:rnd(0.12,0.24),sp:rnd(-3,3)});
  ICIRC.push({x,y,root,rings,sh,age:0,t,R});
}
function updateIceCircles(dt){
  for(let i=ICIRC.length-1;i>=0;i--){const C=ICIRC[i];C.age+=dt;
    const f=Math.min(1,C.age/0.35)*Math.min(1,Math.max(0,(C.t-C.age)/0.6));
    for(const r of C.rings){r.piv.rotation.y+=r.dir*r.sp*0.6*dt;r.mat.uniforms.uFade.value=f;}
    // ผลึกลอยหมุนรอบวง (ใช้ InstancedMesh เดียวกับเศษน้ำแข็งอื่น)
    const P=icePool(_cryG,iceFxM());
    for(const s of C.sh){s.a+=s.w*dt*0.6;s.b+=dt;if(P.n>=400)break;
      const X=C.root.position.x+Math.cos(s.a)*s.r,Z=C.root.position.z+Math.sin(s.a)*s.r,Y=C.root.position.y+s.h+Math.sin(s.b*1.3)*0.25;
      _im4.compose(_ip.set(X,Y,Z),_iq.setFromEuler(_ie.set(s.b*s.sp,s.b*0.8,0.4)),_is.set(s.s*f+0.001,s.s*2.2*f+0.001,s.s*f+0.001));P.im.setMatrixAt(P.n++,_im4);}
    P.im.count=P.n;P.im.instanceMatrix.needsUpdate=true;P.im.visible=P.n>0;
    if(C.age>=C.t){scene.remove(C.root);C.rings.forEach(r=>r.mat.dispose());ICIRC.splice(i,1);}}
}
