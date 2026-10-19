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
const rpass=new RenderPass(scene,cam);composer.addPass(rpass);
const bloom=new UnrealBloomPass(new THREE.Vector2(512,512),0.65,0.45,0.88);
// เรนเดอร์แสงฟุ้งที่ครึ่งความละเอียด (ดูแทบไม่ต่าง แต่เร็วขึ้นมาก)
{const bs=bloom.setSize.bind(bloom);bloom.setSize=(w,h)=>bs(Math.max(1,Math.round(w/2)),Math.max(1,Math.round(h/2)));}
composer.addPass(bloom);
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
