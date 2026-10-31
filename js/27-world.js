// =====================================================================
//  โลก 3D (Three.js + Bloom) — 1 หน่วย 3D = 20 พิกเซลของระบบเกม
// =====================================================================
const S3=1/20,tx=x=>(x-MW/2)*S3,tz=y=>(y-MH/2)*S3;
// ความสูงพื้นจริงในโลก 3D (แผนที่จากไฟล์มีเนิน) — ความสูงจากเกม (z/h) + GY(x,y) = ตำแหน่ง y ในฉาก • TW = แบบพิกัด 3D
// ความสูงพื้นที่ใช้วาดภาพ (หน่วย 3D): แมพไฟล์ = ผิวดิน • แมพเมือง = บล็อก (ทางเท้า/ลาน) ยกสูงจากถนน 0.14 ม. — ไม่งั้นกรอบสกิล/เอฟเฟกต์บนพื้นจมใต้ทางเท้า (ผู้ใช้ 2026-10-29)
const CITY_KERB=0.14;
function cityKerb(x,y){const Z=MAPID==='city'&&MAPS.city&&MAPS.city.zones;if(!Z)return 0;for(const z of Z)if(x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.d)return CITY_KERB;return 0;}
const GY=(x,y)=>TERR?terrT(x,y):cityKerb(x,y),TW=(X,Z)=>TERR?terrT(X*20+MW/2,Z*20+MH/2):cityKerb(X*20+MW/2,Z*20+MH/2);
const hdr=(c,k)=>new THREE.Color(c).multiplyScalar(k);
// antialias ปิดไว้: ภาพผ่าน EffectComposer (render target) อยู่แล้ว MSAA ของ canvas จึงไม่ช่วยอะไร แค่กินแรง
const gl=new THREE.WebGLRenderer({canvas:document.getElementById('gl'),antialias:false,powerPreference:'high-performance'});
gl.setPixelRatio(Math.min(1,window.devicePixelRatio||1));
gl.useLegacyLights=true;
gl.shadowMap.enabled=true;gl.shadowMap.type=THREE.PCFSoftShadowMap; // ขอบเงานุ่ม (เงาตามผู้เล่น shadowFollow ทำให้คมพอจะนุ่มได้)
gl.shadowMap.autoUpdate=false; // อัปเดตเงาเองใน render() (โหมดอัตโนมัติ = ทุก 2 เฟรม)
gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.1;
const scene=new THREE.Scene();
scene.fog=new THREE.Fog('#151a33',50,170);
const cam=new THREE.PerspectiveCamera(62,1,0.25,700);   // near 0.1 → 0.25: ความละเอียดความลึกดีขึ้น ~2.5 เท่า (ผิวที่ห่างกันน้อย เช่น พื้นในบล็อก/ทางเท้า ไม่กระพริบไกล ๆ)
const composer=new EffectComposer(gl);
// ===== ท่อภาพ (post-processing): ฉาก → ชั้นเอฟเฟกต์นุ่ม (FXPass) → แสงฟุ้ง → โทนสี/เอฟเฟกต์ทั้งจอ (GradePass) → จอ =====
// ความลึกของฉากเก็บเป็นภาพ (depthTexture) ให้อนุภาค/หมอก/หางแสงอ่านได้ → จางลงนุ่ม ๆ ตรงที่แตะพื้น/กำแพง (soft particles)
for(const rt of [composer.renderTarget1,composer.renderTarget2]){rt.depthTexture=new THREE.DepthTexture(rt.width,rt.height);rt.depthTexture.type=THREE.UnsignedIntType;}
const rpass=new RenderPass(scene,cam);composer.addPass(rpass);
// ฉากแยกของเอฟเฟกต์โปร่งใส (อนุภาค หมอก หางแสง) — วาดหลังฉากหลัก
const fxScene=new THREE.Scene();
// ค่ากลางของ soft particles (shader ของอนุภาคอ่านจากที่นี่) • on=0 → วาดแบบเดิม (ทดสอบความลึกปกติ ไม่นุ่ม)
const SOFTU={uDepth:{value:null},uRes:{value:new THREE.Vector2(1,1)},uNear:{value:0.1},uFar:{value:700},uSoftOn:{value:1}};
const SOFT_GLSL='uniform sampler2D uDepth;uniform vec2 uRes;uniform float uNear;uniform float uFar;uniform float uSoftOn;varying float vVZ;'+
  'float softK(float range){if(uSoftOn<0.5)return 1.0;float d=texture2D(uDepth,gl_FragCoord.xy/uRes).x;float sz=(uNear*uFar)/(uFar-d*(uFar-uNear));float k=(sz-vVZ)/range;if(k<0.0)discard;return clamp(k,0.0,1.0);}';
const FXMATS=new Set();   // วัสดุในชั้นเอฟเฟกต์ — สลับ depthTest ตามโหมดนุ่ม/ไม่นุ่ม
function fxMat(m){m.uniforms=Object.assign(m.uniforms||{},SOFTU);m.depthTest=!SOFTU.uSoftOn.value;FXMATS.add(m);m.userData.keep=true;return m;}
// ใส่ soft particles ให้ ShaderMaterial ที่มี "vec4 mv=modelViewMatrix*..." ใน vertex shader (อนุภาค) — range = ระยะจางเป็นหน่วย 3D
function softify(m,range){
  m.vertexShader='varying float vVZ;'+m.vertexShader.replace('vec4 mv=modelViewMatrix*vec4(position,1.0);','vec4 mv=modelViewMatrix*vec4(position,1.0);vVZ=-mv.z;');
  const f=m.fragmentShader,i=f.lastIndexOf('}');m.fragmentShader=SOFT_GLSL+f.slice(0,i)+'gl_FragColor*=softK('+range.toFixed(2)+');}';
  return fxMat(m);}
// ภาพฉากหลัก (ก่อนวาดชั้นเอฟเฟกต์) ให้ shader อากาศร้อนบิดเบี้ยว (heat haze, js/42) อ่าน — มีค่าเฉพาะตอนเปิด soft
const HAZE_U={uScene:{value:null}};
// เงาตามซอกมุม (SSAO) — คำนวณจากภาพความลึกอย่างเดียว (ไม่ต้องวาดฉากซ้ำ) ที่ครึ่งความละเอียด ลงแผ่น aoRT
// แล้วตอนก๊อปภาพฉากใน FXPass เบลอ 4×4 (ไม่เบลอข้ามขอบวัตถุ) คูณเข้าภาพ → อนุภาค/เอฟเฟกต์ที่วาดทีหลังไม่โดนทำให้มืด
// uAO = ความเข้ม (0 = ปิด) • uR = รัศมีที่มองหาซอก (หน่วย 3D) • uFade = ระยะที่เริ่มจาง/หายหมด (ไกลกว่านั้นหมอกบังอยู่แล้ว)
const AOU={uAO:{value:0},uR:{value:1.4},uFade:{value:new THREE.Vector2(35,70)},uTan:{value:new THREE.Vector2(1,1)},tAO:{value:null},uAORes:{value:new THREE.Vector2(1,1)},
  uRim:{value:0},uRimCol:{value:new THREE.Color()},uHaze:{value:0},uHazeCol:{value:new THREE.Color()},uHazeD:{value:new THREE.Vector3(0,0.06,22)},uCamY:{value:new THREE.Vector4()}};
// ภาพสวยขึ้น (ทำในขั้นก๊อปภาพของ FXPass เลย แทบไม่กินแรงเพิ่ม • ทำงานเมื่อเปิด soft = ไม่ใช่โหมดประหยัด):
//  rim = ไฟขอบ: ขอบวัตถุใกล้ ๆ ที่ข้างหลังไกลกว่ามาก (เช่นตัวละครบนพื้น) สว่างขึ้นเหมือนโดนแสงจันทร์/แดดจากด้านหลัง → ตัวละครเด่น (สีตามแสงหลัก) • rimZ = ไกลสุดที่มีไฟขอบ
//  haze = หมอกบาง ๆ ตามระยะ (ของไกลจางเข้าหาสีหมอกของแผนที่ → ฉากมีมิติ) • hazeK = ความหนา (เทียบกับ fog.far ของแผนที่) • aa = ลบขอบหยัก (FXAA)
const GFX={rim:0.17,rimZ:22,haze:0.55,hazeK:1.4,aa:true};
const AO_ON={strength:2.2};
const AO_HEAD='uniform sampler2D tD;uniform vec2 uRes;uniform float uNear;uniform float uFar;uniform float uAO;uniform float uR;uniform vec2 uFade;uniform vec2 uTan;varying vec2 vUv;'+
  'float lz(vec2 uv){float d=texture2D(tD,uv).x;return (uNear*uFar)/(uFar-d*(uFar-uNear));}'+
  'vec3 vp(vec2 uv){float z=lz(uv);return vec3((uv*2.0-1.0)*uTan*z,-z);}';
// ขั้น 1: ค่า AO (1 = สว่าง, 0 = มืด) • มุมสุ่มตามตาราง 4×4 พิกเซล → เบลอ 4×4 แล้วเรียบพอดี
const AO_CALC=AO_HEAD+'void main(){float ao=1.0;'+
  'if(texture2D(tD,vUv).x<0.99999){vec3 P=vp(vUv);float z=-P.z;'+
    'if(z<uFade.y){vec2 px=1.0/uRes;'+
      'vec3 pr=vp(vUv+vec2(px.x,0.0))-P,pl=P-vp(vUv-vec2(px.x,0.0)),pu=vp(vUv+vec2(0.0,px.y))-P,pd=P-vp(vUv-vec2(0.0,px.y));'+
      'vec3 N=normalize(cross(abs(pr.z)<abs(pl.z)?pr:pl,abs(pu.z)<abs(pd.z)?pu:pd));'+
      'vec2 rad=min(vec2(uR)/(2.0*uTan*z),vec2(0.15));'+
      'vec2 q=mod(floor(gl_FragCoord.xy),4.0);float ang=6.2832*(q.x*4.0+q.y+0.5)/16.0;float j=fract((q.x+q.y*4.0)*0.618);'+
      'float occ=0.0;'+
      'for(int i=0;i<12;i++){float f=(float(i)+j)/12.0;float a=ang+float(i)*2.39996;'+
        'vec3 v=vp(vUv+vec2(cos(a),sin(a))*rad*sqrt(f))-P;float L=length(v);'+
        'occ+=max(0.0,dot(N,v)/(L+1e-4)-0.2)*(1.0-smoothstep(uR*0.5,uR*1.5,L));}'+
      'ao=clamp(1.0-uAO*occ/12.0,0.0,1.0);ao=mix(ao,1.0,smoothstep(uFade.x,uFade.y,z));}}'+
  'gl_FragColor=vec4(ao,ao,ao,1.0);}';
// ขั้น 2: ก๊อปภาพฉาก × AO ที่เบลอแล้ว (ถ่วงน้ำหนักตามความลึกใกล้เคียง กันเงาเลอะข้ามขอบ)
const AO_COPY=AO_HEAD+'uniform sampler2D t;uniform sampler2D tAO;uniform vec2 uAORes;uniform float uRim;uniform vec3 uRimCol;uniform float uHaze;uniform vec3 uHazeCol;uniform vec3 uHazeD;uniform vec4 uCamY;'+
  'void main(){vec4 c=texture2D(t,vUv);'+
  'if(texture2D(tD,vUv).x<0.99999){float z=lz(vUv);'+   // ท้องฟ้าไม่ต้องทำ
  'if(uAO>0.001){float s=0.0,w=0.0;vec2 px=1.0/uAORes;'+
    'for(int x=0;x<4;x++)for(int y=0;y<4;y++){vec2 uv=vUv+(vec2(float(x),float(y))-1.5)*px;'+
      'float k=1.0/(1.0+abs(lz(uv)-z)*8.0/z);s+=texture2D(tAO,uv).r*k;w+=k;}'+
    'c.rgb*=s/max(w,1e-4);}'+
  // ไฟขอบ: มองหาพิกเซลข้างบน/ข้าง ๆ (5 ทิศ × 2 ระยะ) ที่ลึกกว่าเรามาก → เราอยู่ที่ขอบ (ทิศบนแรงสุด = แสงจากด้านหลังบน)
  'if(uRim>0.001&&z<uHazeD.z){vec2 px=1.0/uRes;float r=0.0;'+
    'for(int i=0;i<5;i++){float a=float(i)*0.7854;vec2 o=vec2(cos(a),sin(a));float wt=0.45+0.55*o.y;'+
      'for(int j=1;j<3;j++){float d=lz(vUv+o*px*1.6*float(j))-z;r=max(r,wt*(j==1?1.0:0.55)*smoothstep(0.12*z+0.25,0.4*z+0.8,d));}}'+
    'c.rgb+=uRimCol*r*smoothstep(1.5,4.5,z)*(1.0-smoothstep(uHazeD.z*0.55,uHazeD.z,z));}'+
  // หมอกตามระยะ (จางเข้าหาสีหมอกแผนที่) • ที่ต่ำหนากว่าที่สูงนิดหน่อย
  'if(uHaze>0.001){vec3 P=vec3((vUv*2.0-1.0)*uTan*z,-z);float wy=dot(uCamY.xyz,P)+uCamY.w;'+
    'float f=(1.0-exp(-length(P)*uHazeD.x))*(0.65+0.35*exp(-max(wy,0.0)*uHazeD.y));c.rgb=mix(c.rgb,uHazeCol,f*uHaze);}}'+
  'gl_FragColor=c;}';
const AO_RT=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false});
class FXPass extends Pass{
  constructor(){super();this.needsSwap=true;
    const vs='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
    this.ao=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:Object.assign({tD:{value:null}},SOFTU,AOU),vertexShader:vs,fragmentShader:AO_CALC,depthTest:false,depthWrite:false}));
    this.cp=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:Object.assign({t:{value:null},tD:{value:null}},SOFTU,AOU),vertexShader:vs,fragmentShader:AO_COPY,depthTest:false,depthWrite:false}));}
  setSize(w,h){AO_RT.setSize(Math.max(1,w>>1),Math.max(1,h>>1));AOU.uAORes.value.set(AO_RT.width,AO_RT.height);}
  render(r,write,read){const ac=r.autoClear;r.autoClear=false;
    if(!SOFTU.uSoftOn.value){this.needsSwap=false;r.setRenderTarget(read);r.render(fxScene,cam);r.autoClear=ac;return;}
    // นุ่ม: ก๊อปภาพฉากไปอีกแผ่น แล้ววาดเอฟเฟกต์ทับโดยอ่านความลึกจากแผ่นเดิม (อ่าน+เขียนแผ่นเดียวกันไม่ได้)
    this.needsSwap=true;SOFTU.uDepth.value=read.depthTexture;SOFTU.uRes.value.set(read.width,read.height);SOFTU.uNear.value=cam.near;SOFTU.uFar.value=cam.far;
    const th=Math.tan(cam.fov*Math.PI/360);AOU.uTan.value.set(th*cam.aspect,th);
    this.ao.material.uniforms.tD.value=this.cp.material.uniforms.tD.value=read.depthTexture;
    if(AOU.uAO.value>0.001){r.setRenderTarget(AO_RT);this.ao.render(r);AOU.tAO.value=AO_RT.texture;}
    const F=rpass.scene.fog,e=cam.matrixWorld.elements;AOU.uCamY.value.set(e[1],e[5],e[9],e[13]);
    AOU.uHaze.value=F&&F.isFog?GFX.haze:0;if(F){AOU.uHazeCol.value.copy(F.color);AOU.uHazeD.value.x=GFX.hazeK/Math.max(F.far||1,1);}
    AOU.uRim.value=GFX.rim;AOU.uRimCol.value.copy(moonL.color).multiplyScalar(GFX.rim);AOU.uHazeD.value.z=GFX.rimZ;
    this.cp.material.uniforms.t.value=read.texture;HAZE_U.uScene.value=read.texture;r.setRenderTarget(write);this.cp.render(r);r.render(fxScene,cam);r.autoClear=ac;}
}
const fxPass=new FXPass();composer.addPass(fxPass);
const bloom=new UnrealBloomPass(new THREE.Vector2(512,512),0.72,0.5,0.86);
// เรนเดอร์แสงฟุ้งที่ครึ่งความละเอียด (ดูแทบไม่ต่าง แต่เร็วขึ้นมาก)
{const bs=bloom.setSize.bind(bloom);bloom.setSize=(w,h)=>bs(Math.max(1,Math.round(w/2)),Math.max(1,Math.round(h/2)));}
composer.addPass(bloom);
// โทนสีทั้งจอ + เอฟเฟกต์ทั้งจอ: แฟลชสี, เบลอพุ่งเข้าหาจุด (radial blur ตอนอัลติ), สีเหลื่อม (chromatic) ตอนกระแทก, ขอบจอมืด/แดงตอนโดนตี
const GRADEU={tDiffuse:{value:null},uFlash:{value:new THREE.Color(0,0,0)},uRad:{value:0},uCtr:{value:new THREE.Vector2(0.5,0.5)},uChr:{value:0},uVig:{value:0.28},uHurt:{value:0},uSat:{value:1.1},uOn:{value:1}};
class GradePass extends Pass{
  constructor(){super();this.needsSwap=true;
    this.q=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:GRADEU,depthTest:false,depthWrite:false,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader:'uniform sampler2D tDiffuse;uniform vec3 uFlash;uniform float uRad;uniform vec2 uCtr;uniform float uChr;uniform float uVig;uniform float uHurt;uniform float uSat;varying vec2 vUv;'+
        'void main(){vec2 uv=vUv;vec3 c;'+
        'if(uRad>0.001){vec2 d=uv-uCtr;c=vec3(0.0);for(int i=0;i<10;i++){float t=float(i)/9.0;c+=texture2D(tDiffuse,uCtr+d*(1.0-uRad*0.16*t)).rgb;}c/=10.0;}else c=texture2D(tDiffuse,uv).rgb;'+
        'if(uChr>0.001){vec2 o=(uv-0.5)*uChr*0.006;c.r=mix(c.r,texture2D(tDiffuse,uv+o).r,0.85);c.b=mix(c.b,texture2D(tDiffuse,uv-o).b,0.85);}'+
        'float l=dot(c,vec3(0.2126,0.7152,0.0722));c=max(mix(vec3(l),c,uSat),0.0);'+
        'c=mix(c*vec3(0.9,0.95,1.12),c,smoothstep(0.0,0.35,l));'+   // เงาอมฟ้าเล็กน้อย
        'vec2 q=(uv-0.5)*vec2(1.0,0.82);float v=smoothstep(0.78,0.22,length(q));c*=mix(1.0-uVig,1.0,v);'+
        'c=mix(c,c*0.35+vec3(0.9,0.05,0.05)*0.6,uHurt*(1.0-v));'+
        'c+=uFlash;gl_FragColor=vec4(c,1.0);}'}));}
  render(r,write,read){GRADEU.tDiffuse.value=read.texture;r.setRenderTarget(this.renderToScreen?null:write);this.q.render(r);}
}
const gradePass=new GradePass();composer.addPass(gradePass);
composer.addPass(new OutputPass());
// ลบขอบหยัก (FXAA) — ทำหลังแปลงสีจอแล้ว (ภาพ sRGB) ตรงที่สีต่างกันมากเท่านั้น • ปิดในโหมดประหยัด / GFX.aa=false
class AAPass extends Pass{
  constructor(){super();this.needsSwap=true;
    this.q=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:{t:{value:null},uPx:{value:new THREE.Vector2(1,1)}},depthTest:false,depthWrite:false,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader:'uniform sampler2D t;uniform vec2 uPx;varying vec2 vUv;vec3 L=vec3(0.299,0.587,0.114);float lu(vec2 o){return dot(texture2D(t,vUv+o*uPx).rgb,L);}'+
        'void main(){vec4 cm=texture2D(t,vUv);float nw=lu(vec2(-1.0,-1.0)),ne=lu(vec2(1.0,-1.0)),sw=lu(vec2(-1.0,1.0)),se=lu(vec2(1.0,1.0)),m=dot(cm.rgb,L);'+
        'float lo=min(m,min(min(nw,ne),min(sw,se))),hi=max(m,max(max(nw,ne),max(sw,se)));'+
        'if(hi-lo<max(0.04,hi*0.125)){gl_FragColor=vec4(cm.rgb,1.0);return;}'+
        'vec2 d=vec2(-((nw+ne)-(sw+se)),(nw+sw)-(ne+se));float rd=max((nw+ne+sw+se)*0.03125,0.0078125);'+
        'd=clamp(d/(min(abs(d.x),abs(d.y))+rd),-8.0,8.0)*uPx;'+
        'vec3 a=0.5*(texture2D(t,vUv-d/6.0).rgb+texture2D(t,vUv+d/6.0).rgb),b=a*0.5+0.25*(texture2D(t,vUv-d*0.5).rgb+texture2D(t,vUv+d*0.5).rgb);'+
        'float lb=dot(b,L);gl_FragColor=vec4((lb<lo||lb>hi)?a:b,1.0);}'}));}
  render(r,write,read){const u=this.q.material.uniforms;u.t.value=read.texture;u.uPx.value.set(1/read.width,1/read.height);r.setRenderTarget(this.renderToScreen?null:write);this.q.render(r);}
}
const aaPass=new AAPass();composer.addPass(aaPass);fxPass.gfx=GFX;

// ---------- คุณภาพกราฟิก: auto = ปรับความละเอียดเองตาม FPS / high = สวยสุด / low = เครื่องช้า ----------
const QUAL={mode:['auto','high','low'].includes(store('wd_gfx'))?store('wd_gfx'):'auto',scale:1,acc:0,n:0,good:0,frame:0,lvl:0};
const QUAL_NAME={auto:'อัตโนมัติ',high:'สูง',low:'ประหยัด'};
function qualPR(){
  const dpr=window.devicePixelRatio||1;
  if(QUAL.mode==='high')return Math.min(1.5,dpr);
  if(QUAL.mode==='low')return Math.min(1,dpr)*0.7;
  return Math.min(1,dpr)*QUAL.scale;
}
function applyQuality(){
  const pr=qualPR();gl.setPixelRatio(pr);composer.setPixelRatio(pr);
  const sh=QUAL.mode!=='low'&&!(QUAL.mode==='auto'&&QUAL.lvl>=2);
  if(gl.shadowMap.enabled!==sh){
    gl.shadowMap.enabled=sh;
    for(const sc of [scene,typeof stage!=='undefined'?stage:null])if(sc)sc.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>m.needsUpdate=true);});
  }
  bloom.enabled=QUAL.mode!=='low'&&!(QUAL.mode==='auto'&&QUAL.lvl>=1);
  gradePass.enabled=QUAL.mode!=='low';
  aaPass.enabled=GFX.aa&&QUAL.mode!=='low'&&!(QUAL.mode==='auto'&&QUAL.lvl>=2);
  // soft particles: ปิดเมื่อกราฟิกประหยัด หรืออัตโนมัติลดถึงขั้นปิดเงา (ประหยัดการก๊อปภาพเต็มจอ 1 ครั้ง)
  const soft=QUAL.mode!=='low'&&!(QUAL.mode==='auto'&&QUAL.lvl>=2)?1:0;
  if(SOFTU.uSoftOn.value!==soft){SOFTU.uSoftOn.value=soft;for(const m of FXMATS)m.depthTest=!soft;}
  // เงาตามซอกมุม: สูง = เปิด / อัตโนมัติ = เปิดจนกว่าเครื่องเริ่มช้า (lvl≥1) / ประหยัด = ปิด (ทำงานเฉพาะตอน soft เปิด)
  AOU.uAO.value=soft&&(QUAL.mode==='high'||QUAL.lvl<1)?AO_ON.strength:0;
  if(typeof resize==='function'&&SW)resize();
}
// ปรับความละเอียดอัตโนมัติ: เฟรมช้า (<~40fps) ลดลงทีละขั้น / ลื่นต่อเนื่องค่อยเพิ่มกลับ
function qualTick(dt){
  if(QUAL.mode!=='auto'||screen!=='game'||dt>0.2)return;
  QUAL.acc+=dt;QUAL.n++;
  if(QUAL.acc<2)return;
  const avg=QUAL.acc/QUAL.n*1000;QUAL.acc=0;QUAL.n=0;
  // ช้า: ลดความละเอียดก่อน → ปิดแสงฟุ้ง (lvl1) → ปิดเงา (lvl2) / ลื่นต่อเนื่อง: ค่อยๆ คืนกลับทีละขั้น
  if(avg>24){QUAL.good=0;if(QUAL.scale>0.6)QUAL.scale=Math.max(0.55,+(QUAL.scale-0.15).toFixed(2));else if(QUAL.lvl<2)QUAL.lvl++;else if(QUAL.scale>0.45)QUAL.scale=0.45;applyQuality();}
  else if(avg<16){if(++QUAL.good>=4){QUAL.good=0;if(QUAL.scale<0.7&&QUAL.lvl>0)QUAL.lvl--;else if(QUAL.scale<1)QUAL.scale=Math.min(1,+(QUAL.scale+0.1).toFixed(2));else if(QUAL.lvl>0)QUAL.lvl--;else return;applyQuality();}}
  else QUAL.good=0;
}

function texCanvas(w,h,draw,srgb=true){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t;}
const glowTex=texCanvas(64,64,(g,w)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(0.22,'rgba(255,255,255,0.65)');r.addColorStop(0.5,'rgba(255,255,255,0.18)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,w);},false);
const stoneTex=texCanvas(256,256,(g)=>{
  g.fillStyle='#4a4554';g.fillRect(0,0,256,256);
  for(let y=0;y<256;y+=32)for(let x=-(y/32%2)*32;x<256;x+=64){const v=Math.random()*22;g.fillStyle=`rgb(${92+v},${86+v},${100+v})`;g.fillRect(x+2,y+2,60,28);}
  for(let i=0;i<500;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*0.12})`;g.fillRect(Math.random()*256,Math.random()*256,3,3);}
});
stoneTex.wrapS=stoneTex.wrapT=THREE.RepeatWrapping;
const runeTex=texCanvas(256,256,(g)=>{
  g.translate(128,128);g.strokeStyle='#fff';g.lineWidth=5;
  for(const r of [120,100,58]){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();}
  g.lineWidth=3;g.beginPath();for(let i=0;i<=6;i++){const a=i/6*Math.PI*2;i?g.lineTo(Math.cos(a)*100,Math.sin(a)*100):g.moveTo(100,0);}g.stroke();
  g.beginPath();for(let i=0;i<=3;i++){const a=i/3*Math.PI*2-Math.PI/2;i?g.lineTo(Math.cos(a)*100,Math.sin(a)*100):g.moveTo(0,-100);}g.stroke();
  g.font='bold 18px serif';g.fillStyle='#fff';g.textAlign='center';
  const R='ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊ';for(let i=0;i<16;i++){g.save();g.rotate(i/16*Math.PI*2);g.fillText(R[i],0,-104);g.restore();}
},false);
const glowMats={};
function glowMat(col,k=1.6){const key=col+k;if(!glowMats[key])glowMats[key]=new THREE.SpriteMaterial({map:glowTex,color:hdr(col,k),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true});return glowMats[key];}
// ใช้วัสดุหินซ้ำ (ค่าเดียวกัน = วัสดุเดียวกัน) เพื่อให้รวมชิ้นส่วนฉากเป็นก้อนเดียวได้
const STONEM={};
function stoneMat(rx,ry,tint){const k=rx+'|'+ry+'|'+(tint||'');if(STONEM[k])return STONEM[k];const t=stoneTex.clone();t.needsUpdate=true;t.repeat.set(rx,ry);return STONEM[k]=new THREE.MeshStandardMaterial({map:t,color:tint||'#ffffff',roughness:0.95});}
function shadowAll(o){o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});}

// ท้องฟ้า: กลางคืน (ปราสาท/ป่า) หรือ พระอาทิตย์ตก (สนามควิดดิช)
const SKY={};
(function(){
  const grad=(stops)=>texCanvas(4,256,(g)=>{const r=g.createLinearGradient(0,0,0,256);stops.forEach(([p,c])=>r.addColorStop(p,c));g.fillStyle=r;g.fillRect(0,0,4,256);});
  SKY.night=grad([[0,'#03050f'],[0.45,'#141a3a'],[0.52,'#3a2f55'],[0.6,'#151a33'],[1,'#08090f']]);
  SKY.sunset=grad([[0,'#16234f'],[0.3,'#4a3f86'],[0.44,'#c06a8a'],[0.5,'#ff9a5a'],[0.53,'#ffd08a'],[0.6,'#6a4a5a'],[1,'#2a2030']]);
  SKY.mesh=new THREE.Mesh(new THREE.SphereGeometry(600,32,16),new THREE.MeshBasicMaterial({map:SKY.night,side:THREE.BackSide,fog:false,depthWrite:false}));
  scene.add(SKY.mesh);
  const n=1500,pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,e=Math.random()*1.3+0.12;pos[i*3]=Math.cos(a)*Math.cos(e)*550;pos[i*3+1]=Math.sin(e)*550;pos[i*3+2]=Math.sin(a)*Math.cos(e)*550;}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  SKY.stars=new THREE.Points(sg,new THREE.PointsMaterial({color:'#dfe6ff',size:1.6,sizeAttenuation:false,fog:false}));scene.add(SKY.stars);
  SKY.moon=new THREE.Group();
  const mg=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:'#c8d4ff',fog:false,depthWrite:false}));mg.scale.set(110,110,1);SKY.moon.add(mg);
  const mc=new THREE.Mesh(new THREE.CircleGeometry(14,32),new THREE.MeshBasicMaterial({color:hdr('#f4f6ff',1.6),fog:false}));SKY.moon.add(mc);
  SKY.moon.position.set(-190,180,-310);mc.lookAt(190,-180,310);scene.add(SKY.moon);
  SKY.sun=new THREE.Group();
  const sg2=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:hdr('#ffb070',1.2),fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));sg2.scale.set(220,220,1);SKY.sun.add(sg2);
  const sc=new THREE.Mesh(new THREE.CircleGeometry(22,40),new THREE.MeshBasicMaterial({color:hdr('#fff0c0',2.2),fog:false}));SKY.sun.add(sc);
  SKY.sun.position.set(300,45,-420);sc.lookAt(-300,-45,420);SKY.sun.visible=false;scene.add(SKY.sun);
})();
const hemi=new THREE.HemisphereLight('#8fa6ff','#2a1f1a',0.55);scene.add(hemi);
scene.add(new THREE.AmbientLight('#404060',0.3));
const moonL=new THREE.DirectionalLight('#c4d2ff',1.0);
moonL.position.set(-55,95,-70);moonL.castShadow=true;moonL.shadow.bias=-0.0004;moonL.shadow.normalBias=0.03;
scene.add(moonL);scene.add(moonL.target);
// ทิศจากพื้นไปหาแสงหลัก (setSky ตั้ง) — shadowFollow ใช้วางแสงตามผู้เล่น
const LDIR=new THREE.Vector3(-55,95,-70).normalize();
function setSky(mode){
  const day=mode==='sunset';
  SKY.mesh.material.map=day?SKY.sunset:SKY.night;SKY.mesh.material.needsUpdate=true;
  SKY.stars.visible=!day;SKY.moon.visible=!day;SKY.sun.visible=day;
  if(day){moonL.color.set('#ffbe8a');moonL.position.set(80,45,-110);gl.toneMappingExposure=1.05;}
  else{moonL.color.set('#c4d2ff');moonL.position.set(-55,95,-70);gl.toneMappingExposure=1.1;}
  LDIR.copy(moonL.position).normalize();
}
// ---------- เงาตามผู้เล่น ----------
// กล้องเงาครอบแค่พื้นที่รอบ ๆ ที่กล้องมอง (ไม่ใช่ทั้งแผนที่) → เงาคมขึ้นหลายเท่า โดยภาพเงาขนาดเท่าเดิม
// r = ครึ่งความกว้างพื้นที่เงา (หน่วย 3D, ไม่เกินขนาดแผนที่) • ahead = ดันจุดกลางไปข้างหน้ากล้อง (สัดส่วนของ r)
// ขยับเป็นขั้นเท่าพิกเซลเงาพอดี กันขอบเงาสั่นยิบ ๆ ตอนเดิน/หันกล้อง • on=false → กลับไปแบบคลุมทั้งแผนที่ (ตั้งใน buildWorld)
const SHD={on:true,r:36,rHigh:48,ahead:0.5};
const _shF=new THREE.Vector3(),_shR=new THREE.Vector3(),_shU=new THREE.Vector3(),_shC=new THREE.Vector3(),_shY=new THREE.Vector3(0,1,0);
function shadowFollow(){
  if(!gl.shadowMap.enabled)return;
  const c=moonL.shadow.camera,ext=Math.max(MW,MH)*S3/2+12;
  if(!SHD.on){   // แบบเดิม: คลุมทั้งแผนที่ แสงมองไปที่กลางแผนที่
    if(c.right!==ext){Object.assign(c,{left:-ext,right:ext,top:ext,bottom:-ext,near:1,far:400});c.updateProjectionMatrix();}
    moonL.target.position.set(0,0,0);moonL.position.copy(LDIR).multiplyScalar(133);moonL.target.updateMatrixWorld();return;}
  const r=Math.min(ext,QUAL.mode==='high'?SHD.rHigh:SHD.r);
  if(c.right!==r){Object.assign(c,{left:-r,right:r,top:r,bottom:-r,near:1,far:420});c.updateProjectionMatrix();}
  _shF.set(0,0,-1).applyQuaternion(cam.quaternion);_shF.y=0;if(_shF.lengthSq()<1e-6)_shF.set(0,0,-1);_shF.normalize();
  const x=cam.position.x+_shF.x*r*SHD.ahead,z=cam.position.z+_shF.z*r*SHD.ahead;
  _shC.set(x,TW(x,z),z);
  // ปัดจุดกลางให้ตรงตารางพิกเซลเงา (แกนขวา/บนของกล้องเงา)
  _shF.copy(LDIR).negate();_shR.crossVectors(_shF,_shY).normalize();_shU.crossVectors(_shR,_shF);
  const tex=2*r/moonL.shadow.mapSize.x,a=_shC.dot(_shR),b=_shC.dot(_shU);
  _shC.addScaledVector(_shR,Math.round(a/tex)*tex-a).addScaledVector(_shU,Math.round(b/tex)*tex-b);
  moonL.target.position.copy(_shC);moonL.position.copy(_shC).addScaledVector(LDIR,200);
  moonL.target.updateMatrixWorld();
}
// ไฟชั่วคราวสำหรับคาถา (pool คงที่ ไม่ต้อง compile shader ใหม่)
const LPOOL=[];
for(let i=0;i<6;i++){const L=new THREE.PointLight('#ffffff',0,12,2);L.position.set(0,-100,0);scene.add(L);LPOOL.push(L);}
