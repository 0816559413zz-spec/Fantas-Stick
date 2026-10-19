// =====================================================================
//  โลก 3D (Three.js + Bloom) — 1 หน่วย 3D = 20 พิกเซลของระบบเกม
// =====================================================================
const S3=1/20,tx=x=>(x-MW/2)*S3,tz=y=>(y-MH/2)*S3;
// ความสูงพื้นจริงในโลก 3D (แผนที่จากไฟล์มีเนิน) — ความสูงจากเกม (z/h) + GY(x,y) = ตำแหน่ง y ในฉาก • TW = แบบพิกัด 3D
const GY=(x,y)=>TERR?terrT(x,y):0,TW=(X,Z)=>TERR?terrT(X*20+MW/2,Z*20+MH/2):0;
const hdr=(c,k)=>new THREE.Color(c).multiplyScalar(k);
// antialias ปิดไว้: ภาพผ่าน EffectComposer (render target) อยู่แล้ว MSAA ของ canvas จึงไม่ช่วยอะไร แค่กินแรง
const gl=new THREE.WebGLRenderer({canvas:document.getElementById('gl'),antialias:false,powerPreference:'high-performance'});
gl.setPixelRatio(Math.min(1,window.devicePixelRatio||1));
gl.useLegacyLights=true;
gl.shadowMap.enabled=true;gl.shadowMap.type=THREE.PCFShadowMap;
gl.shadowMap.autoUpdate=false; // อัปเดตเงาเองใน render() (โหมดอัตโนมัติ = ทุก 2 เฟรม)
gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.1;
const scene=new THREE.Scene();
scene.fog=new THREE.Fog('#151a33',50,170);
const cam=new THREE.PerspectiveCamera(62,1,0.1,700);
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
class FXPass extends Pass{
  constructor(){super();this.needsSwap=true;
    this.cp=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:{t:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:'uniform sampler2D t;varying vec2 vUv;void main(){gl_FragColor=texture2D(t,vUv);}',depthTest:false,depthWrite:false}));}
  render(r,write,read){const ac=r.autoClear;r.autoClear=false;
    if(!SOFTU.uSoftOn.value){this.needsSwap=false;r.setRenderTarget(read);r.render(fxScene,cam);r.autoClear=ac;return;}
    // นุ่ม: ก๊อปภาพฉากไปอีกแผ่น แล้ววาดเอฟเฟกต์ทับโดยอ่านความลึกจากแผ่นเดิม (อ่าน+เขียนแผ่นเดียวกันไม่ได้)
    this.needsSwap=true;SOFTU.uDepth.value=read.depthTexture;SOFTU.uRes.value.set(read.width,read.height);SOFTU.uNear.value=cam.near;SOFTU.uFar.value=cam.far;
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
  // soft particles: ปิดเมื่อกราฟิกประหยัด หรืออัตโนมัติลดถึงขั้นปิดเงา (ประหยัดการก๊อปภาพเต็มจอ 1 ครั้ง)
  const soft=QUAL.mode!=='low'&&!(QUAL.mode==='auto'&&QUAL.lvl>=2)?1:0;
  if(SOFTU.uSoftOn.value!==soft){SOFTU.uSoftOn.value=soft;for(const m of FXMATS)m.depthTest=!soft;}
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
moonL.position.set(-55,95,-70);moonL.castShadow=true;moonL.shadow.bias=-0.0006;
scene.add(moonL);
function setSky(mode){
  const day=mode==='sunset';
  SKY.mesh.material.map=day?SKY.sunset:SKY.night;SKY.mesh.material.needsUpdate=true;
  SKY.stars.visible=!day;SKY.moon.visible=!day;SKY.sun.visible=day;
  if(day){moonL.color.set('#ffbe8a');moonL.position.set(80,45,-110);gl.toneMappingExposure=1.05;}
  else{moonL.color.set('#c4d2ff');moonL.position.set(-55,95,-70);gl.toneMappingExposure=1.1;}
}
// ไฟชั่วคราวสำหรับคาถา (pool คงที่ ไม่ต้อง compile shader ใหม่)
const LPOOL=[];
for(let i=0;i<6;i++){const L=new THREE.PointLight('#ffffff',0,12,2);L.position.set(0,-100,0);scene.add(L);LPOOL.push(L);}
