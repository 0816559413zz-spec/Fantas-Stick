// =====================================================================
//  ลม + หญ้า 3D (ภาพบนเครื่องตัวเองล้วน ไม่แตะโฮสต์/โปรโตคอล)
//  • AIR = ลมกลาง: ลมประจำแผนที่ (ทิศ/แรง) + ลมกระโชกจากสกิล (ระเบิด/แสงวาบ/วงคลื่นบนพื้น) — หญ้า + ผ้าคลุมอ่านจากที่นี่
//  • หญ้า: ใบหญ้าเป็นหมื่นใบรอบกล้อง (การ์ดจอขยับเองทั้งหมด) วางเฉพาะพื้นที่ "เขียว" ของแผนที่
//    ตอนโหลดแผนที่ ถ่ายภาพแผนที่จากด้านบน 1 ครั้ง (grassBake) → รู้สีพื้น + ความสูงพื้น + ตรงไหนมีหลังคา/ต้นไม้บัง
//  • หญ้าแหวกตามตัวละคร/ไม้กวาดบินต่ำ, ลู่ออกเป็นวงตอนระเบิด แล้วเด้งกลับ, ไหม้ดำ (รอยไหม้) / ขาวน้ำแข็ง (รอยน้ำแข็ง) ชั่วคราว
//  ตัวเลขข้างล่างเป็นค่าภาพล้วน ปรับได้ตามชอบ • ดีบัก: WD.grass (GRASS, AIR, grassBake)
// =====================================================================
const AIR={
  dir:new THREE.Vector2(1,0),   // ทิศลมประจำแผนที่ (ตั้งใน grassBake ตามแผนที่)
  str:0.35,                      // แรงลมปกติ (หน่วยงอของหญ้า; ผ้าคลุม ×CLW_K)
  t:0,
  G:[],                          // ลมกระโชก {x,z,R,s,age,life}
  M:[],                          // รอยบนหญ้า {x,z,r,burn(1)/frost(-1),age,life}
};
const AIR_MAP={pitch:0.5,meadow:0.5,lake:0.45,ruins:0.45,forest:0.25,castle:0.3,greathall:0,hogsmeade:0.35,test:0.35};
// เพิ่มลมกระโชกที่จุด (หน่วย 3D) — R = รัศมี, s = แรง (1 ≈ ระเบิดใหญ่)
function airGust(x,z,R,s){if(!(s>0.02))return;const G=AIR.G;
  if(G.length>=8){let w=0;for(let i=1;i<G.length;i++)if(airGs(G[i])<airGs(G[w]))w=i;if(airGs(G[w])>s)return;G.splice(w,1);}
  G.push({x,z,R:Math.min(R,16),s:Math.min(s,2),age:0,life:1.4});}
function airGs(g){return g.s*Math.exp(-g.age*2.5);}
// รอยไหม้ (k=1) / น้ำแข็ง (k=-1) บนหญ้า
function airMark(x,z,r,k,life){const M=AIR.M;if(M.length>=12)M.shift();M.push({x,z,r:Math.min(r,10),k,age:0,life:life||8});}
// ลม ณ จุด (สำหรับ CPU: ผ้าคลุม) — สูตรเดียวกับใน shader หญ้าแบบย่อ → {x,z}
// ลมประจำแผนที่: ทิศคงที่ตามชื่อแผนที่ (ทุกเครื่องเห็นเหมือนกัน)
function airForMap(){const a=(hashStr(MAPID)%628)/100;AIR.dir.set(Math.cos(a),Math.sin(a));AIR.str=AIR_MAP[MAPID]!==undefined?AIR_MAP[MAPID]:0.35;}
const _airV={x:0,z:0};
function airAt(x,z){
  const ph=(x*AIR.dir.x+z*AIR.dir.y)*0.25-AIR.t*1.6,w=0.6+0.4*Math.sin(ph)+0.2*Math.sin(ph*2.3+x*0.7);
  let vx=AIR.dir.x*AIR.str*w,vz=AIR.dir.y*AIR.str*w;
  for(const g of AIR.G){const dx=x-g.x,dz=z-g.z,L=Math.hypot(dx,dz),r=g.R*Math.min(1,g.age/0.18+0.25);if(L>r)continue;const f=airGv(g)*(1-L/r)/(L+0.2);vx+=dx*f;vz+=dz*f;}
  _airV.x=vx;_airV.z=vz;return _airV;}
// แรงกระโชกตามเวลา: พุ่งออก แล้วเด้งกลับนิดหน่อย (หญ้าโยกกลับ)
function airGv(g){return g.s*Math.exp(-g.age*2.5)*Math.cos(Math.min(g.age*5,3.6));}
function airTick(dt){AIR.t+=dt;
  for(let i=AIR.G.length-1;i>=0;i--){const g=AIR.G[i];g.age+=dt;if(g.age>g.life)AIR.G.splice(i,1);}
  for(let i=AIR.M.length-1;i>=0;i--){const m=AIR.M[i];m.age+=dt;if(m.age>m.life)AIR.M.splice(i,1);}}
// ----- ต่อเข้ากับเอฟเฟกต์เดิม (ไม่ต้องแก้ทุกสกิล): แสงวาบ = ลมกระโชก • วงคลื่นบนพื้น = ลมกระโชกกว้าง • รอยดำ/ขาวบนพื้น = ไหม้/น้ำแข็ง -----
{const fl=FX.flashLight;FX.flashLight=function(x,y,h,col,int,dist,life){
  try{if(h-GY(x,y)<5&&int>=2.5)airGust(tx(x),tz(y),Math.max(2,dist*0.3),Math.min(1.6,(int-1.5)*0.16));}catch(e){}
  return fl.apply(this,arguments);};}
SHAPES_Q.push=function(...a){
  try{for(const s of a){if(!s)continue;
    if(s.k==='ring'&&(s.h===undefined||s.h<1.5)&&s.s1>1.2)airGust(tx(s.x),tz(s.y),s.s1*1.25,Math.min(1.2,0.25+s.s1*0.06));
    else if(s.k==='decal'&&s.col){const c=new THREE.Color(s.col),l=c.r+c.g+c.b;if(l<0.6)airMark(tx(s.x),tz(s.y),(s.s1||2)*0.6,1,Math.max(6,(s.life||6)*1.5));else if(c.b>0.8&&l>2)airMark(tx(s.x),tz(s.y),(s.s1||2)*0.6,-1,Math.max(4,(s.life||3)*2));}}}catch(e){}
  return Array.prototype.push.apply(this,a);};
// ผ้าคลุมของเรา: แรงลม (หน่วย/วิ²) ณ ตัวเรา — js/49 clStep บวกเข้าไป
const CLW={x:0,z:0,K:9};

// ---------- หญ้า ----------
// DENS = ใบต่อตร.หน่วย • S = ขนาดผืนหญ้ารอบกล้อง (หน่วย 3D) ตามระดับกราฟิก • H = ความสูงใบ • MAXN = จำนวนสูงสุด
const GRASS={ON:true,DENS:20,H:0.46,W:0.045,MAXN:75000,S:{high:60,auto:46,auto1:34},mesh:null,key:'',cache:new Map(),tex:null,box:null,bakeMs:0,n:0};
const GR_GLSL_V='uniform vec4 uGrMap;uniform sampler2D uGround;uniform vec3 uGrCam;uniform vec4 uWind;uniform vec4 uGust[8];uniform vec4 uPush[8];uniform vec4 uMark[12];uniform float uGrH;uniform float uGrW;uniform sampler2D uGroundH;'+
  'attribute vec4 aOff;varying vec3 vGC;varying vec2 vMk;\n';
const GR_BEGIN=
  'vec3 transformed;{'+
  'float S=uGrCam.z;vec2 c=uGrCam.xy;vec2 wp=c+(fract(aOff.xy-c/S+0.5)-0.5)*S;'+
  'vec2 muv=(wp-uGrMap.xy)/uGrMap.zw;vec4 gm=texture2D(uGround,muv);'+
  'float ok=step(0.0,muv.x)*step(muv.x,1.0)*step(0.0,muv.y)*step(muv.y,1.0)*step(aOff.z,gm.a*1.15-0.15);'+
  'float d=length(wp-c);float fade=1.0-smoothstep(S*0.3,S*0.48,d);'+
  // รอยไหม้/น้ำแข็ง
  'float bu=0.0,fr=0.0;for(int i=0;i<12;i++){vec4 m=uMark[i];float k=(1.0-smoothstep(m.z*0.55,m.z,length(wp-m.xy)));bu+=max(m.w,0.0)*k;fr+=max(-m.w,0.0)*k;}'+
  'bu=min(bu,1.0);fr=min(fr,1.0);vMk=vec2(bu,fr);'+
  'float cl=0.5+0.25*sin(wp.x*0.43+sin(wp.y*0.31)*2.0)+0.25*sin(wp.y*0.57+sin(wp.x*0.23)*2.0);'+   // กอหญ้าสูง/เตี้ยเป็นหย่อม
  'float hgt=uGrH*(0.45+0.75*fract(aOff.w*7.31))*(0.45+0.9*cl)*fade*ok*(1.0-0.65*bu);'+
  // ลม: ลมแผนที่ (คลื่นวิ่งตามทิศลม) + สั่นเล็กน้อย + กระโชก + ตัวละครแหวก
  'float ph=dot(wp,uWind.xy)*0.25-uWind.w*1.6;'+
  'vec2 v=uWind.xy*uWind.z*(0.6+0.4*sin(ph)+0.2*sin(ph*2.3+wp.x*0.7));'+
  'v+=vec2(sin(uWind.w*3.1+wp.y*1.7+wp.x),cos(uWind.w*2.7+wp.x*1.3+aOff.w*6.0))*0.07*(uWind.z+0.15);'+
  'for(int i=0;i<8;i++){vec4 g=uGust[i];vec2 dd=wp-g.xy;float L=length(dd);v+=dd/(L+0.2)*g.w*(1.0-smoothstep(g.z*0.6,g.z,L));}'+
  'for(int i=0;i<8;i++){vec4 q=uPush[i];vec2 dd=wp-q.xy;float L=length(dd);v+=dd/(L+0.05)*q.w*(1.0-smoothstep(q.z*0.35,q.z,L))*1.8;}'+
  'v*=1.0-0.8*fr;float bl=length(v);if(bl>1.6)v*=1.6/bl;bl=min(bl,1.6);'+
  'float t=position.y,a=aOff.w*6.2832;vec2 sd=vec2(cos(a),sin(a));'+
  'vec3 p=vec3(sd.x*position.x*uGrW,0.0,sd.y*position.x*uGrW);'+
  'p.xz+=v*(t*t)*hgt*0.9;p.y=t*hgt*(1.0-0.55*bl*bl/(1.0+bl*bl));'+
  'transformed=vec3(wp.x,texture2D(uGroundH,muv).r,wp.y)+p;'+
  'vGC=gm.rgb*(0.5+0.75*position.y)*(0.8+0.4*fract(aOff.w*3.7));'+
  '}';
function grassMat(){
  const m=new THREE.MeshLambertMaterial({side:THREE.DoubleSide});
  const U={uGrMap:{value:new THREE.Vector4(0,0,1,1)},uGround:{value:null},uGroundH:{value:null},uGrCam:{value:new THREE.Vector3(0,0,40)},uWind:{value:new THREE.Vector4(1,0,0.3,0)},
    uGust:{value:Array.from({length:8},()=>new THREE.Vector4(0,0,1,0))},uPush:{value:Array.from({length:8},()=>new THREE.Vector4(0,0,1,0))},uMark:{value:Array.from({length:12},()=>new THREE.Vector4(0,0,1,0))},uGrH:{value:GRASS.H},uGrW:{value:GRASS.W}};
  m.userData.U=U;
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader=GR_GLSL_V+sh.vertexShader
      .replace('#include <beginnormal_vertex>','vec3 objectNormal=vec3(0.0,1.0,0.0);')
      .replace('#include <begin_vertex>',GR_BEGIN);
    sh.fragmentShader='varying vec3 vGC;varying vec2 vMk;\n'+sh.fragmentShader
      .replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize(vNormal);')   // ด้านหลังใบไม่มืด (normal ชี้ขึ้นทั้งสองด้าน)
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );','vec3 gc=mix(vGC,vec3(0.025,0.02,0.018),vMk.x);gc=mix(gc,vec3(0.75,0.88,1.0),vMk.y*0.85);vec4 diffuseColor=vec4(gc,opacity);');};
  m.customProgramCacheKey=()=>'grass1';
  return m;}
function grassBuild(){
  // ใบหญ้า: 5 จุด (โคนกว้าง → ปลายแหลม) x = ซ้าย/ขวา (-1..1), y = 0 โคน → 1 ปลาย
  const g=new THREE.InstancedBufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,0, 1,0,0, -0.7,0.45,0, 0.7,0.45,0, 0,1,0],3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute([0,1,0,0,1,0,0,1,0,0,1,0,0,1,0],3));
  g.setIndex([0,1,2, 1,3,2, 2,3,4]);
  const N=GRASS.MAXN,A=new Float32Array(N*4);
  // ลำดับกระจายสม่ำเสมอ (R2) → ใช้แค่ n ใบแรกก็ยังกระจายทั่วผืน
  for(let i=0;i<N;i++){A[i*4]=(0.5+i*0.7548776662)%1;A[i*4+1]=(0.5+i*0.5698402910)%1;const h=Math.sin(i*12.9898)*43758.5453;A[i*4+2]=h-Math.floor(h);const h2=Math.sin(i*78.233)*12543.13;A[i*4+3]=h2-Math.floor(h2);}
  g.setAttribute('aOff',new THREE.InstancedBufferAttribute(A,4));
  g.instanceCount=0;g.boundingSphere=new THREE.Sphere(new THREE.Vector3(),1e6);
  const m=new THREE.Mesh(g,grassMat());m.frustumCulled=false;m.receiveShadow=true;m.castShadow=false;m.renderOrder=-1;m.userData.keep=true;
  GRASS.mesh=m;scene.add(m);}
// ถ่ายแผนที่จากด้านบน: สีพื้นจริง (ไม่มีแสง) + ความสูงผิวบนสุด → ตรงไหน "เขียว" และไม่มีอะไรบัง = ปลูกหญ้า
const _grBasic=new WeakMap();
function grassBake(){
  const t0=performance.now();
  const hx=MW*S3/2+4,hz=MH*S3/2+4,res=Math.min(1024,Math.max(128,Math.round(Math.max(hx,hz)*2/0.22)));
  const rw=Math.max(32,Math.round(res*hx/Math.max(hx,hz))),rh=Math.max(32,Math.round(res*hz/Math.max(hx,hz)));
  const oc=new THREE.OrthographicCamera(-hx,hx,hz,-hz,1,600);oc.position.set(0,300,0);oc.up.set(0,0,-1);oc.lookAt(0,0,0);oc.updateMatrixWorld();
  const hidden=[];for(const o of scene.children)if(o!==world&&o.visible){o.visible=false;hidden.push(o);}
  const swaps=[];world.traverse(o=>{if(!o.visible){return;}if(o.isSprite||o.isPoints||o.isLine){o.visible=false;hidden.push(o);return;}
    if(!o.isMesh)return;const ms=[].concat(o.material);const nb=ms.map(m=>{let b=_grBasic.get(m);if(!b){b=new THREE.MeshBasicMaterial({color:m.color?m.color.clone():new THREE.Color(0),map:m.map||null,vertexColors:!!m.vertexColors,side:THREE.DoubleSide,transparent:!!m.transparent,opacity:m.opacity??1});_grBasic.set(m,b);}return b;});
    swaps.push([o,o.material]);o.material=Array.isArray(o.material)?nb:nb[0];});
  const fog=scene.fog,bg=scene.background,ov=scene.overrideMaterial,ac=gl.autoClear,cc=gl.getClearColor(new THREE.Color()),ca=gl.getClearAlpha(),sh=gl.shadowMap.autoUpdate;
  scene.fog=null;scene.background=null;gl.autoClear=true;gl.shadowMap.autoUpdate=false;
  const rtC=new THREE.WebGLRenderTarget(rw,rh),rtH=new THREE.WebGLRenderTarget(rw,rh,{type:THREE.FloatType});
  const col=new Uint8Array(rw*rh*4),hgt=new Float32Array(rw*rh*4);
  try{
    gl.setClearColor(0x000000,0);gl.setRenderTarget(rtC);gl.render(scene,oc);gl.readRenderTargetPixels(rtC,0,0,rw,rh,col);
    for(const [o,m] of swaps)o.material=m;swaps.length=0;
    scene.overrideMaterial=new THREE.ShaderMaterial({side:THREE.DoubleSide,vertexShader:'varying float vY;void main(){vec4 w=modelMatrix*vec4(position,1.0);\n#ifdef USE_INSTANCING\nw=modelMatrix*instanceMatrix*vec4(position,1.0);\n#endif\nvY=w.y;gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:'varying float vY;void main(){gl_FragColor=vec4(vY,0.0,0.0,1.0);}'});
    gl.setRenderTarget(rtH);gl.render(scene,oc);gl.readRenderTargetPixels(rtH,0,0,rw,rh,hgt);
  }finally{
    for(const [o,m] of swaps)o.material=m;
    if(scene.overrideMaterial&&scene.overrideMaterial!==ov)scene.overrideMaterial.dispose();
    scene.overrideMaterial=ov;scene.fog=fog;scene.background=bg;gl.autoClear=ac;gl.setClearColor(cc,ca);gl.shadowMap.autoUpdate=sh;gl.setRenderTarget(null);
    for(const o of hidden)o.visible=true;rtC.dispose();rtH.dispose();}
  // สีในภาพเป็นค่าเส้นตรง (render target ไม่แปลง sRGB) → เก็บเป็น sRGB 8 บิต (เข้มไม่เป็นขั้น) • ความหนาแน่นหญ้า = ความเขียว • ปิดตรงที่ผิวบนสูงกว่าพื้นดิน (หลังคา/ต้นไม้/กำแพง)
  const C=new Uint8Array(rw*rh*4),H=new Uint16Array(rw*rh),toS=v=>{v=Math.max(0,Math.min(1,v));return Math.round(255*(v<=0.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-0.055));};
  const N=rw*rh,D=new Float32Array(N),R=new Float32Array(N),Gc=new Float32Array(N),B=new Float32Array(N),Y=new Float32Array(N),st=new Uint8Array(N);   // st: 0 = ใช้ได้, 1 = ใต้พุ่มไม้ (เติมจากรอบ ๆ), 2 = ไม่มีหญ้า
  for(let j=0;j<rh;j++)for(let i=0;i<rw;i++){const k=j*rw+i,p=k*4;
    const r=col[p]/255,g=col[p+1]/255,b=col[p+2]/255,y=hgt[p],has=hgt[p+3]>0.5;
    const X=-hx+(i+0.5)/rw*2*hx,Z=hz-(j+0.5)/rh*2*hz,ground=TW(X,Z);
    const green=has&&g>0.02?Math.max(0,Math.min(1,((g-Math.max(r,b))/g-0.04)*4)):0;
    R[k]=r;Gc[k]=g;B[k]=b;Y[k]=has?y:ground;D[k]=green;
    // ผิวบนสูงกว่าพื้น: เขียว + สูง ≥2 = พุ่มไม้ (ใต้นั้นยังมีหญ้า เติมจากรอบ ๆ) / อื่น ๆ (หลังคา กำแพง หิน) = ไม่มีหญ้า
    st[k]=has&&y>ground+0.9?(green>0.3&&y>ground+2?1:2):0;if(st[k]===2)D[k]=0;}
  // เติมใต้พุ่มไม้: ค่อย ๆ ลามสี/ความสูง/ความหนาแน่นจากช่องข้าง ๆ เข้าไป (พุ่มใหญ่เกินไปตรงกลางยังว่าง)
  for(let it=0;it<24;it++){const fill=[];
    for(let j=1;j<rh-1;j++)for(let i=1;i<rw-1;i++){const k=j*rw+i;if(st[k]!==1)continue;let c=0,r=0,g=0,b=0,y=0,d=0;
      for(const q of [k-1,k+1,k-rw,k+rw])if(st[q]===0){c++;r+=R[q];g+=Gc[q];b+=B[q];y+=Y[q];d+=D[q];}
      if(c)fill.push(k,r/c,g/c,b/c,y/c,d/c*0.97);}
    for(let f=0;f<fill.length;f+=6){const k=fill[f];R[k]=fill[f+1];Gc[k]=fill[f+2];B[k]=fill[f+3];Y[k]=fill[f+4];D[k]=fill[f+5];st[k]=0;}
    if(!fill.length)break;}
  let n=0;
  for(let k=0;k<N;k++){const p=k*4,d=st[k]?0:D[k];C[p]=toS(R[k]);C[p+1]=toS(Gc[k]);C[p+2]=toS(B[k]);C[p+3]=Math.round(d*255);if(d>0.2)n++;H[k]=THREE.DataUtils.toHalfFloat(Y[k]);}
  GRASS.tex=new THREE.DataTexture(C,rw,rh,THREE.RGBAFormat);GRASS.tex.colorSpace=THREE.SRGBColorSpace;GRASS.tex.magFilter=GRASS.tex.minFilter=THREE.LinearFilter;GRASS.tex.needsUpdate=true;
  GRASS.texH=new THREE.DataTexture(H,rw,rh,THREE.RedFormat,THREE.HalfFloatType);GRASS.texH.magFilter=GRASS.texH.minFilter=THREE.LinearFilter;GRASS.texH.needsUpdate=true;
  GRASS.box=[-hx,hz,2*hx,-2*hz];GRASS.n=n;
  // เก็บไว้ 4 แผนที่ล่าสุด (กลับมาแผนที่เดิมไม่ต้องถ่ายใหม่)
  const BC=GRASS.cache;BC.delete(builtKey);BC.set(builtKey,{tex:GRASS.tex,texH:GRASS.texH,box:GRASS.box,n});
  while(BC.size>4){const [k,v]=BC.entries().next().value;BC.delete(k);v.tex.dispose();v.texH.dispose();}
  airForMap();
  GRASS.bakeMs=+(performance.now()-t0).toFixed(1);}
function grassCount(){
  if(!GRASS.ON||QUAL.mode==='low'||(QUAL.mode==='auto'&&QUAL.lvl>=2))return [0,0];
  const S=QUAL.mode==='high'?GRASS.S.high:QUAL.lvl>=1||QUAL.scale<0.8?GRASS.S.auto1:GRASS.S.auto;
  return [Math.min(GRASS.MAXN,Math.round(GRASS.DENS*S*S)),S];}
// ทุกเฟรมในเกม: ลม + หญ้า + แรงลมให้ผ้าคลุม
function grassTick(dt){
  airTick(dt);
  if(!GRASS.mesh)grassBuild();
  const m=GRASS.mesh;
  if(screen!=='game'||!world){m.visible=false;return;}
  if(GRASS.key!==builtKey){GRASS.key=builtKey;const c=GRASS.cache.get(builtKey);
    if(c){Object.assign(GRASS,{tex:c.tex,texH:c.texH,box:c.box,n:c.n});airForMap();}
    else try{grassBake();}catch(e){console.error(e);GRASS.n=0;}}
  const [cnt,S]=grassCount();
  m.visible=cnt>0&&GRASS.n>20;
  {const me=typeof myPos==='function'?myPos():null;if(me){const w=airAt(tx(me.x),tz(me.y));CLW.x=w.x*CLW.K;CLW.z=w.z*CLW.K;}else CLW.x=CLW.z=0;}
  if(!m.visible)return;
  m.geometry.instanceCount=cnt;
  const U=m.material.userData.U;
  U.uGround.value=GRASS.tex;U.uGroundH.value=GRASS.texH;U.uGrMap.value.set(...GRASS.box);
  U.uGrCam.value.set(cam.position.x,cam.position.z,S);U.uWind.value.set(AIR.dir.x,AIR.dir.y,AIR.str,AIR.t);
  for(let i=0;i<8;i++){const g=AIR.G[i],u=U.uGust.value[i];if(g)u.set(g.x,g.z,g.R*Math.min(1,g.age/0.18+0.25),airGv(g));else u.w=0;}
  for(let i=0;i<12;i++){const k=AIR.M[i],u=U.uMark.value[i];if(k){const f=Math.min(1,k.age/0.3)*Math.min(1,(k.life-k.age)/2);u.set(k.x,k.z,k.r,k.k*f);}else u.w=0;}
  // ตัวละคร/ศัตรูใกล้กล้องที่สุด 8 ตัว แหวกหญ้า (บินต่ำ = วงกว้างขึ้น จางตามความสูง)
  const L=[];const add=o=>{if(!o||!o.g||!o.g.parent||!o.g.visible)return;const p=o.g.position,dh=p.y-TW(p.x,p.z);if(dh>3)return;const d=Math.hypot(p.x-cam.position.x,p.z-cam.position.z);if(d>S*0.5)return;L.push([d,p.x,p.z,dh<0.6?0.75:1.6,dh<0.6?1:Math.max(0,1-dh/3)*0.8]);};
  for(const o of PM3.values())add(o);for(const o of EM3.values())add(o);
  L.sort((a,b)=>a[0]-b[0]);
  for(let i=0;i<8;i++){const q=L[i],u=U.uPush.value[i];if(q)u.set(q[1],q[2],q[3],q[4]);else u.w=0;}
}
