// =====================================================================
//  สายดิน ⛰️ — ภาพฝั่งเครื่องเล่น (Stand / Stand ใหญ่ / กำแพง / เสา / เนิน / ฝุ่น / สว่าน / บึงโคลน / HUD) • v2 ตาม designs/earth.md §0 FINAL SPEC v2
//  ตรรกะอยู่ js/09-earth.js • ไฟล์นี้มีแต่นิยามฟังก์ชัน (โหลดท้ายสุด) — เรียกจาก syncPlayers / render loop / efxFX / makeProj / drawHUD
//  snapshot: p.ea = [Stand แตกเหลือกี่วิ, Rampage, ชาร์จ Auger (วิ), Wrath (1 ฟ้า 2 ลง 3 สว่าน), สว่านเหลือ, เวลาบนฟ้าเหลือ, เวลาสว่านเหลือ, HP โล่, Crush ได้, ชาร์จ BA (วิ), คูลดาวน์ BA ชาร์จ]
//            v.ES = สิ่งก่อสร้าง [id, ชนิด 0 กำแพง 1 เสา 2 เนิน 3 (เดิม: โดเมน), x1,y1,x2,y2, r, HP%, ทีม, เจ้าของ] • v.ED = ฝุ่น [id,x,y,r,เหลือ,ทีม]
//  หน้าตา Stand (ผู้ใช้): ตัวบล็อกหิน/ทรายแบบ Roblox มีแค่ครึ่งตัวบน ส่วนล่างจางลงเป็นทราย • มีลายผิว ไม่ใช่สีเรียบ • กำปั้นมีรายละเอียด • ตัวใหญ่รายละเอียดเยอะกว่า
// =====================================================================
Object.assign(PCOL,{erock:'#c9a36a',eslab:'#d8b47a'});
const ECOL={stone:'#8f7a5c',dark:'#5e4d38',dust:'#b39a74',glow:'#ffcf6a',mud:'#5b4128',sand:'#c9a878'};
// โล่ Stand ใหญ่: ค่าเริ่มต้น = ตัวใหญ่เท่า Stand ตอน BA ชาร์จ (ผู้ใช้ 2026-10-21: ตัวเล็กไป) • ใหญ่ขึ้นอีกขั้น: เปิดเกมด้วย ?eshield=big
// ท่ากัน (ผู้ใช้ 2026-10-21): อยู่หลังเรา ก้มตัวลงมาคลุม ไหล่/หัวสูงกว่าเราหน่อย • back = ฐานอยู่หลังเรากี่ px • side = เลื่อนไปขวา px • z = ฐานลอย(+)/จม(-) • lean = ก้ม (rad)
// แขนกัน (R) พับศอกบังหน้า: fist = จุดกำปั้น [หน้า px, ขวา px, สูง] • elbow = ทิศศอก [ซ้าย, หน้า, ลง]
// larm = แขน L (จาง) ง้างหมัดเก็บไว้ข้างเอว แบบนักสู้ [ต้นแขน x (+ = ศอกไปหลัง), กาง z, ศอก x] • lo = ท่อนล่างจางเป็นทราย [สูง (คูณ), ตำแหน่ง y] ให้หายเร็วขึ้น
const EGUARD_BIG=/[?&]eshield=big/.test(location.search),EGUARD=EGUARD_BIG?{sc:1.8,back:80,side:14,z:0.05,lean:0.8,fist:[14,12,1.95],elbow:[0.8,1,0.3],larm:[-0.4,0.1,-1.97],lo:[0.5,1.37]}:{sc:1.55,back:69,side:12,z:0.2,lean:0.8,fist:[14,12,1.85],elbow:[0.8,1,0.3],larm:[-0.4,0.1,-1.97],lo:[0.5,1.37]};
const CB={upX:-3.05,upC:-0.3,clasp:0.38,foC:-1.15,lnB:-0.32,sUp:-1.05,sCl:0.22,sFo:-0.15,sLn:1.0,lunge:16};   // ท่า BA ชาร์จ (ง้าง → ทุบ)
var EV={st:new Map(),es:new Map(),anims:[],fog:null,crush:[],mark:null};
const eW=(x,y,h)=>new THREE.Vector3(tx(x),(h||0)+GY(x,y),tz(y));
const eYaw=(x1,y1,x2,y2)=>Math.atan2(x2-x1,y2-y1);
// ---------- ลายผิว (วาดเองบน canvas: หิน/ทราย + รอยร้าว + ขอบบล็อกแบบ Roblox) ----------
const ETEX={};
function eTex(kind){if(ETEX[kind])return ETEX[kind];const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  const P={stand:['#b8975f','#94754a','#d8bb88','#5e4730'],big:['#a8885a','#82653f','#dcc08a','#47351f'],fist:['#86694a','#634c33','#b39062','#2f2316'],
    pillar:['#4a3422','#2a1b10','#c9a23a','#100a05'],wall:['#8a7254','#6a5640','#a88c66','#3a2c1e'],cliff:['#94795a','#6e573e','#b89a72','#3a2c1e'],mud:['#5b4128','#43301c','#7a5a38','#2a1c10']}[kind];
  x.fillStyle=P[0];x.fillRect(0,0,128,128);
  for(let i=0;i<1100;i++){x.globalAlpha=rnd(0.12,0.4);x.fillStyle=Math.random()<0.5?P[1]:P[2];const s=rnd(1,4);x.fillRect(rnd(0,128),rnd(0,128),s,s);}
  x.globalAlpha=0.3;for(let i=0;i<16;i++){x.fillStyle=Math.random()<0.5?P[1]:P[2];x.beginPath();const cx0=rnd(0,128),cy0=rnd(0,128),r=rnd(6,18);for(let k=0;k<6;k++){const a=k/6*Math.PI*2,rr=r*rnd(0.6,1.2);x.lineTo(cx0+Math.cos(a)*rr,cy0+Math.sin(a)*rr);}x.fill();}
  if(kind==='pillar'){for(let i=0;i<26;i++){x.globalAlpha=rnd(0.25,0.6);x.strokeStyle=Math.random()<0.55?P[2]:P[3];x.lineWidth=rnd(1,3.5);x.beginPath();let px=rnd(0,128);x.moveTo(px,0);for(let y=0;y<=128;y+=16){px+=rnd(-3,3);x.lineTo(px,y);}x.stroke();}}
  if(kind==='cliff'){let y=0;while(y<128){const bh=rnd(10,22);x.globalAlpha=rnd(0.12,0.24);x.fillStyle=Math.random()<0.5?P[1]:P[2];x.fillRect(0,y,128,bh);y+=bh;x.globalAlpha=rnd(0.18,0.32);x.strokeStyle=P[3];x.lineWidth=1;x.beginPath();x.moveTo(0,y);for(let px=0;px<=128;px+=8)x.lineTo(px,y+rnd(-1,1));x.stroke();}
    for(let i=0;i<40;i++){x.globalAlpha=rnd(0.2,0.45);x.fillStyle=Math.random()<0.5?P[3]:P[2];x.beginPath();const cx0=rnd(0,128),cy0=rnd(0,128),r=rnd(1.5,4);for(let k=0;k<5;k++){const an=k/5*Math.PI*2;x.lineTo(cx0+Math.cos(an)*r*rnd(0.6,1.3),cy0+Math.sin(an)*r*rnd(0.6,1.3));}x.fill();}}
  if(kind==='mud'){for(let i=0;i<10;i++){x.globalAlpha=rnd(0.25,0.45);x.fillStyle='#8a6a48';x.beginPath();x.ellipse(rnd(0,128),rnd(0,128),rnd(6,16),rnd(3,8),rnd(0,3),0,Math.PI*2);x.fill();}}
  x.globalAlpha=0.85;x.strokeStyle=P[3];x.lineWidth=1.4;for(let i=0;i<(kind==='mud'?0:4);i++){x.beginPath();let px=rnd(10,118),py=rnd(10,118);x.moveTo(px,py);for(let j=0;j<5;j++){px+=rnd(-18,18);py+=rnd(-18,18);x.lineTo(px,py);}x.stroke();}
  if(kind!=='pillar'&&kind!=='mud'&&kind!=='cliff'){x.globalAlpha=0.55;x.strokeStyle=P[3];x.lineWidth=7;x.strokeRect(0,0,128,128);x.globalAlpha=0.3;x.strokeStyle=P[2];x.lineWidth=2;x.strokeRect(6,6,116,116);}
  x.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.userData.keep=true;ETEX[kind]=t;return t;}
// ไล่ความโปร่ง: บนทึบ → ล่างใส (ส่วนล่างของ Stand จางเป็นทราย) • k = แบบจางแรง (ท่ากันโล่: เริ่มจางทันที หายก่อนถึงล่าง)
function eFadeTex(k){const n=k?'fade2':'fade';if(ETEX[n])return ETEX[n];const c=document.createElement('canvas');c.width=4;c.height=64;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,64);
  if(k){g.addColorStop(0,'#c8c8c8');g.addColorStop(0.2,'#808080');g.addColorStop(0.65,'#000000');}else{g.addColorStop(0,'#ffffff');g.addColorStop(0.35,'#ffffff');}g.addColorStop(1,'#000000');x.fillStyle=g;x.fillRect(0,0,4,64);const t=new THREE.CanvasTexture(c);t.userData.keep=true;ETEX[n]=t;return t;}
function eMat(col,op){return new THREE.MeshStandardMaterial({color:col||ECOL.stone,roughness:0.95,metalness:0,flatShading:true,emissive:'#24180a',emissiveIntensity:0.45,transparent:op!==undefined,opacity:op===undefined?1:op});}
function eTMat(kind,col){return new THREE.MeshStandardMaterial({map:eTex(kind),color:col||'#ffffff',roughness:0.92,metalness:0,flatShading:true});}
function rockGeo(w,h,d,j,seg){const g=new THREE.BoxGeometry(w,h,d,seg||2,seg||2,seg||2),P=g.attributes.position,k=j===undefined?0.12:j,m=new Map();
  for(let i=0;i<P.count;i++){const key=[P.getX(i),P.getY(i),P.getZ(i)].map(v=>v.toFixed(3)).join();let o=m.get(key);if(!o){o=[rnd(-k,k)*w,rnd(-k,k)*h,rnd(-k,k)*d];m.set(key,o);}P.setXYZ(i,P.getX(i)+o[0],P.getY(i)+o[1],P.getZ(i)+o[2]);}
  g.computeVertexNormals();return g;}
// เศษหินกระเด็นแบบมีฟิสิกส์ (ใช้ระบบชิ้นของน้ำแข็ง iceBit กับวัสดุหิน)
let _eChunkM=null;const _eChunkG=new THREE.DodecahedronGeometry(1,0);
function eChunks(x,y,h,n,sp,up,sc){if(!_eChunkM){_eChunkM=eTMat('wall');_eChunkM.userData.keep=true;}
  for(let i=0;i<n;i++){const a=rnd(0,6.283),v=rnd(sp*0.35,sp),c=(sc||0.22)*rnd(0.5,1.2);iceBit(_eChunkG,x,y,h,c,c*rnd(0.7,1.2),c,{mat:_eChunkM,life:rnd(0.7,1.2),up:0.02,down:0.25,v:[Math.cos(a)*v,Math.sin(a)*v,rnd(up*0.5,up)],spin:rnd(-9,9)});}}
// ---------- Stand (บล็อกหิน/ทรายครึ่งตัวบน) ----------
// big = Stand ใหญ่ (โล่ / BA ชาร์จ / Crush / อัลติ): เกราะไหล่มีหนาม ผลึก แผ่นอก ลายเรืองที่แขน
function makeStand(sc,big){
  const g=new THREE.Group(),T=eTex(big?'big':'stand'),mat=new THREE.MeshStandardMaterial({map:T,roughness:0.9,flatShading:true}),
    fm=new THREE.MeshStandardMaterial({map:eTex('fist'),roughness:0.85,flatShading:true}),
    fade=new THREE.MeshStandardMaterial({map:T,alphaMap:eFadeTex(),transparent:true,roughness:0.9,depthWrite:false}),
    glow=new THREE.MeshBasicMaterial({color:hdr(ECOL.glow,2.2),transparent:true}),
    cry=new THREE.MeshStandardMaterial({color:'#e8c066',emissive:'#b0701a',emissiveIntensity:0.9,roughness:0.3,metalness:0.2,flatShading:true,transparent:true});
  const Bx=(w,h,d,x,y,z,par,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m||mat);o.position.set(x,y,z);o.castShadow=m!==fade&&m!==glow;(par||g).add(o);return o;};
  const body=new THREE.Group();g.add(body);
  Bx(1.5,1.15,0.85,0,2.2,0,body);const lo=Bx(1.32,1.0,0.78,0,1.15,0,body,fade),ab=Bx(1.36,0.7,0.8,0,1.5,0,body);ab.visible=false;   // ab = ท้องทึบ (โชว์แทนส่วนจางตอนมีขา)
  for(const [x,y,r] of [[0.2,2.35,0.6],[-0.3,2.1,-0.4],[0.05,1.75,1.2]]){const c=Bx(0.5,0.04,0.02,x,y,0.44,body,glow);c.rotation.z=r;}
  const head=Bx(0.78,0.78,0.78,0,3.2,0.02,body);Bx(0.84,0.16,0.3,0,3.45,0.3,body,fm);
  for(const s of [-1,1])Bx(0.14,0.08,0.04,s*0.17,3.24,0.41,body,glow);
  const LM={mat:mat.clone(),fm:fm.clone(),glow:glow.clone()};   // แขนซ้ายวัสดุแยก (ท่ากันให้แขนซ้ายจางไป)
  const arm=s=>{const M=s<0?LM:{mat,fm,glow};const B2=(w,h,d,x,y,z,par,m)=>Bx(w,h,d,x,y,z,par,m===fm?M.fm:m===glow?M.glow:m===undefined||m===mat?M.mat:m);
    B2(0.62,0.6,0.7,s*1.02,2.62,0,body,fm);const up=new THREE.Group();up.position.set(s*1.05,2.55,0);body.add(up);
    B2(0.46,0.88,0.46,0,-0.45,0,up);const fo=new THREE.Group();fo.position.set(0,-0.9,0);up.add(fo);
    B2(0.54,0.72,0.54,0,-0.36,0,fo,fm);B2(0.6,0.08,0.6,0,-0.15,0,fo,glow);
    const fist=new THREE.Group();fist.position.set(0,-0.95,0);fo.add(fist);B2(0.8,0.72,0.8,0,0,0,fist,fm);
    for(let i=0;i<4;i++)B2(0.16,0.15,0.17,-0.27+i*0.18,0.12,0.42,fist,mat);   // ข้อนิ้ว
    B2(0.22,0.3,0.22,-s*0.42,0.05,0.2,fist,mat);   // นิ้วโป้ง
    B2(0.82,0.06,0.06,0,-0.12,0.41,fist,glow);
    if(big){const pd=B2(0.95,0.38,0.95,s*1.02,3.0,0,body,fm);for(let i=0;i<3;i++){const sp=new THREE.Mesh(new THREE.ConeGeometry(0.16,0.75,4),cry);sp.position.set(s*(0.8+i*0.18),3.4,-0.25+i*0.25);sp.rotation.z=-s*0.5;body.add(sp);}
      B2(0.7,0.06,0.06,0,-0.55,0.28,fo,glow);}
    return {up,fo,fist};};
  const L=arm(-1),R=arm(1);
  if(big){Bx(1.05,0.6,0.16,0,2.35,0.48,body,fm);for(let i=0;i<4;i++){const c=new THREE.Mesh(new THREE.OctahedronGeometry(0.28,0),cry);c.position.set(rnd(-0.6,0.6),rnd(2.4,3.2),-0.5);c.scale.y=1.8;c.rotation.z=rnd(-0.6,0.6);body.add(c);}
    for(const s of [-1,1])Bx(0.12,0.9,0.05,s*0.45,2.15,0.44,body,glow);}
  // ขา (เฉพาะ Stand เล็ก) — โชว์แค่ตอนวิ่ง Rampage • up = สะโพก, fo = เข่า, fist = ข้อเท้า (โครงเดียวกับแขน ใช้ eArmIK ได้)
  let legs=null,bow=null;if(!big){legs=new THREE.Group();legs.visible=false;g.add(legs);Bx(1.3,0.5,0.78,0,1.42,0,legs);
    const leg=s=>{const up=new THREE.Group();up.position.set(s*0.42,1.4,0);legs.add(up);Bx(0.58,0.84,0.62,0,-0.38,0,up);
      const fo=new THREE.Group();fo.position.set(0,-0.78,0);up.add(fo);Bx(0.64,0.2,0.68,0,0,0.02,fo,fm);Bx(0.52,0.74,0.56,0,-0.36,0,fo,fm);Bx(0.54,0.06,0.06,0,-0.3,0.29,fo,glow);
      const fist=new THREE.Group();fist.position.set(0,-0.72,0);fo.add(fist);Bx(0.68,0.28,0.98,0,-0.1,0.16,fist,fm);for(let i=0;i<3;i++)Bx(0.17,0.15,0.15,-0.21+i*0.21,-0.15,0.68,fist,mat);
      return {up,fo,fist};};
    legs.L=leg(-1);legs.R=leg(1);bow=makeBow();g.add(bow);}
  g.scale.setScalar(sc||1);g.visible=false;scene.add(g);
  return {g,body,head,L,R,lo,ab,legs,bow,mats:[mat,fm,fade,glow,cry],lmats:[LM.mat,LM.fm,LM.glow],op:0,big:!!big};}
// ---------- Rampage: เกราะลมหน้า Stand (ผู้ใช้: เหมือนอุกกาบาตตกโลก ต้านลม — เปลือกแรงดันด้านหน้า + เส้นลมไหลจากปลายออกข้าง ๆ) ----------
// เปลือกพาราโบลา: u รอบตัว, v ปลาย(0) → ขอบ(1) • เส้นลมวิ่งจากปลายไปขอบ • ปลายร้อนส้ม • ขอบเรืองตามมุมมอง (fresnel)
function makeBow(){const m=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uA:{value:0},uC:{value:hdr('#fff1d8',1.25)},uH:{value:hdr('#ffb45a',2.4)}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    vertexShader:'varying vec2 vU;varying float vF;void main(){vU=uv;vec4 mv=modelViewMatrix*vec4(position,1.0);vec3 n=normalize(normalMatrix*normal);vF=1.0-abs(dot(n,normalize(-mv.xyz)));gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float uT,uA;uniform vec3 uC,uH;varying vec2 vU;varying float vF;float h1(float x){return fract(sin(x*127.1)*43758.5453);}'+
      'void main(){float a=vU.x*60.0,id=floor(a),r=h1(id+3.0),w=smoothstep(0.5,0.08,abs(fract(a)-0.5));float s=fract(vU.y*1.2-uT*(2.4+2.6*r)+r*9.0);'+
      'float ln=w*smoothstep(0.0,0.08,s)*smoothstep(0.75,0.3,s)*step(0.28,r);float tip=exp(-vU.y*vU.y*26.0);float fd=smoothstep(1.0,0.5,vU.y)*smoothstep(0.0,0.05,vU.y+0.02);'+
      'float al=(0.03+0.24*vF*vF*vF+0.65*ln*(0.4+0.6*vU.y)+0.6*tip)*fd*uA;gl_FragColor=vec4(mix(uC,uH,tip),al);}'});
  const pts=[];for(let i=0;i<=18;i++){const v=i/18;pts.push(new THREE.Vector2(Math.max(0.002,v),-v*v));}
  const sh=new THREE.Mesh(new THREE.LatheGeometry(pts,44),m);sh.rotation.x=Math.PI/2;sh.renderOrder=6;const g=new THREE.Group();g.add(sh);g.visible=false;g.userData.m=m;return g;}
// ทุกเฟรม (on = กำลังวิ่ง): เปลือกลม + เส้นลมไหลจากขอบออกไปหลัง (trail) + ประกายลมหลุดจากขอบ + วงลมหลุดจากปลายทิ้งไว้ข้างหลัง • หยุดวิ่ง/ทุบ = เปลือกขยายแตกแล้วจาง
const EBOW={w:1.8,h:1.5,d:3.0,y:1.8,z:2.9},_RIM=[0.12,0.7,1.25,Math.PI-1.25,Math.PI-0.7,Math.PI-0.12,-0.45,Math.PI+0.45];
function eRampWind(s,S,p,on,t,dt,fx,fy,rx,ry){const B=S.bow;if(!B)return;const U=B.userData.m.uniforms;
  if(on){s.bowA=clamp(((s.rT||0)-0.12)/0.18,0,1);B.scale.set(EBOW.w,EBOW.h,EBOW.d);}
  else if(s.bowA>0){s.bowA=Math.max(0,s.bowA-dt*6);B.scale.multiplyScalar(1+dt*4);}
  B.visible=s.bowA>0.01&&S.g.visible;B.position.set(0,EBOW.y,EBOW.z);U.uA.value=(s.bowA||0)*(0.85+0.15*Math.sin(t*40));U.uT.value=t;
  if(!on||s.bowA<0.3){if(!on&&s.wl){for(const h of s.wl)trailStop(h);s.wl=null;}return;}
  const P=(th,r,dz)=>S.g.localToWorld(new THREE.Vector3(EBOW.w*r*Math.cos(th),EBOW.y+EBOW.h*r*Math.sin(th),EBOW.z-EBOW.d*r*r+(dz||0)));
  if(!s.wl)s.wl=_RIM.map(()=>trailNew({col:'#fff4de',col2:'#d8b888',w:0.1,life:0.24,k:1.5}));
  _RIM.forEach((th,i)=>{const v=P(th,0.86);trailPoint(s.wl[i],v.x,v.y,v.z);});
  for(let i=0;i<4;i++){const th=rnd(-0.5,Math.PI+0.5),q=simOf(P(th,rnd(0.6,0.95))),c=Math.cos(th),v=rnd(180,320);
    PARTS.push({x:q.x,y:q.y,h:q.h-GY(q.x,q.y),vx:-fx*v+rx*c*70,vy:-fy*v+ry*c*70,vh:Math.sin(th)*1.5,life:rnd(0.14,0.24),max:0.24,col:i%2?'#e8d4a8':'#fff6e4',size:rnd(1.2,2),g:0,sh:2});}
  s.awT=(s.awT||0)-dt;if(s.awT<=0){s.awT=0.16;eAirWave(P(0,0,0.15),new THREE.Vector3(fx,0,fy),0.5,'#fff0d0',0.25);}}
// วงหินแหลมพุ่งขึ้นรอบจุดทุบ (เอียงออกนอก) แล้วจมกลับ — Rampage ตอนทุบ
function eSpikes(x,y,r,n){const g=new THREE.Group(),m=eTMat('wall','#c8b08a'),L=[];g.position.copy(eW(x,y,0));scene.add(g);
  for(let i=0;i<n;i++){const a=i/n*6.283+rnd(-0.2,0.2),d=r*S3*rnd(0.45,0.75),h=rnd(1.3,2.4),pv=new THREE.Group(),o=new THREE.Mesh(rockGeo(rnd(0.5,0.75),h,rnd(0.5,0.75),0.2),m);
    o.position.y=h/2;o.castShadow=true;pv.add(o);pv.position.set(Math.cos(a)*d,-h,Math.sin(a)*d);pv.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(Math.cos(a)*0.6,1,Math.sin(a)*0.6).normalize());pv.userData.h=h;pv.userData.d=rnd(0,0.06);g.add(pv);L.push(pv);}
  eAnim({g,life:1.5,fn(a){for(const pv of L){const h=pv.userData.h,k=a.t-pv.userData.d;pv.position.y=k<0?-h:k<0.1?-h+h*1.05*(1-Math.pow(1-k/0.1,3)):k<1.0?-0.05*h:lerp(-0.05*h,-h,Math.min(1,(k-1.0)/0.45));}}});}
// lop = ความทึบแขนซ้าย (คูณกับ op) — ท่ากันให้แขนซ้ายจางจนแทบมองไม่เห็น
function standOp(S,op,lop){S.op=op;S.g.visible=op>0.02;for(const m of S.mats){m.transparent=true;m.opacity=op;m.depthWrite=op>0.6&&!m.alphaMap;}
  const lo=op*(lop===undefined?1:lop);for(const m of S.lmats){m.transparent=true;m.opacity=lo;m.depthWrite=lo>0.6;}}
// แขน Stand ยื่นมือไปแตะจุด T (พิกัดโลก) แบบ 2 ท่อน: ต้นแขน → ศอก (งอไปทาง pole) → มือ
const _ikDn=new THREE.Vector3(0,-1,0);
function eArmIK(A,T,pole){A.up.rotation.set(0,0,0);A.fo.rotation.set(0,0,0);A.up.updateMatrixWorld(true);
  const S=A.up.getWorldPosition(new THREE.Vector3()),E0=A.fo.getWorldPosition(new THREE.Vector3()),H0=A.fist.getWorldPosition(new THREE.Vector3()),a=E0.distanceTo(S),b=H0.distanceTo(E0);
  const D=T.clone().sub(S),d=clamp(D.length(),Math.abs(a-b)+0.05,(a+b)*0.995),dir=D.normalize(),al=Math.acos(clamp((a*a+d*d-b*b)/(2*a*d),-1,1));
  const n=pole.clone().addScaledVector(dir,-pole.dot(dir)).normalize(),E=S.clone().addScaledVector(dir,Math.cos(al)*a).addScaledVector(n,Math.sin(al)*a),H=S.clone().addScaledVector(dir,d);
  A.up.quaternion.setFromUnitVectors(_ikDn,E.clone().sub(S).normalize().applyQuaternion(A.up.parent.getWorldQuaternion(new THREE.Quaternion()).invert()));A.up.updateMatrixWorld(true);
  A.fo.quaternion.setFromUnitVectors(_ikDn,H.sub(E).normalize().applyQuaternion(A.up.getWorldQuaternion(new THREE.Quaternion()).invert()));}
// ปรับท่าต่อยเต็มแรง (Stonebreaker) — tw0/tw1 = บิดเพิ่มตอนง้าง/ตอนต่อย • ln = โน้มตัว • ux/uz/uy = แขนขวา • lu = พุ่งตัวเข้าหาแผ่นหิน • hs = ค้างหมัดตอนโดน (วิ)
const PK={tw0:0.45,tw1:0.5,ln:0.06,ux:0.4,uz:0.1,uy:0.35,lu:0.03,hs:0.07};
// k: {punch 0-1, pk = ต่อยเต็มแรง 0/1, hold, raise, slam 0-1, squeeze, spread 0-1 (1 = กางสุด, 0 = หนีบ), throwK (-1 ง้างสุด → 1 ปาออก), lean, run, t}
function standPose(S,k){const R=S.R,L=S.L;
  R.up.rotation.set(0,0,0);L.up.rotation.set(0,0,0);R.fo.rotation.set(0,0,0);L.fo.rotation.set(0,0,0);S.body.rotation.set(k.lean||0,k.twist||0,0);S.head.rotation.set(0,0,0);let dip=0;
  // ต่อยแบบธรรมชาติ: w = ง้าง (บิดสะโพก/ไหล่ขวาไปหลัง ข้อศอกพับ แขนซ้ายยกกันหน้า) • punch = หมุนตัวส่งหมัดเร็ว ๆ (ไหล่เข้า ตัวโน้ม ย่อตัว) • rec = ผ่อนกลับ
  // G = ต่อยเต็มแรง (Stonebreaker): บิดตัวมากขึ้น แขนเหยียดตรงสุด ไหล่ดันไปหน้า แขนซ้ายดึงกลับเอว
  if(k.punch!==undefined){const w=k.punchW===undefined?1:k.punchW,p=k.punch||0,rc=k.rec||0,keep=1-0.55*rc,G=k.pk||0;
    const tw=lerp((0.6+PK.tw0*G)*w,-0.55-PK.tw1*G,p)*keep;S.body.rotation.y=tw;S.body.rotation.z=lerp((0.08+0.06*G)*w,-0.16-0.08*G,p)*keep;S.body.rotation.x=(0.04+(0.06-0.1*G)*w+(0.22+PK.ln*G)*p)*keep;dip=(0.06*w+(0.16+0.1*G)*p)*keep;
    S.head.rotation.y=-tw*0.6;   // หัวยังมองเป้า
    R.up.rotation.x=lerp(lerp(-0.45,-0.85+0.5*G,w),-1.42-PK.ux*G,p)*(1-0.35*rc);R.up.rotation.z=lerp((0.4+0.3*G)*w,-0.18+PK.uz*G,p)*keep;R.up.rotation.y=PK.uy*G*p*keep;R.fo.rotation.x=lerp(lerp(-0.5,-1.55-0.4*G,w),-0.08+0.08*G,p)+(-0.7*rc);
    L.up.rotation.x=lerp(lerp(-0.35,-1.15,w),-0.45+0.7*G,p)*keep;L.up.rotation.z=lerp(-0.2*w,0.35-0.15*G,p)*keep;L.fo.rotation.x=lerp(lerp(-0.6,-1.35,w),-1.0-0.7*G,p);}
  if(S.big){const q=k.guard&&EGUARD.lo;S.lo.scale.y=q?q[0]:1;S.lo.position.y=q?q[1]:1.15;S.mats[2].alphaMap=eFadeTex(q?1:0);}   // ท่อนล่างจาง: ท่ากันจางแรงกว่า
  if(k.guard){   // ท่ากัน: Stand ใหญ่ก้มตัวลงคลุมเราจากข้างหลัง • แขน R พับมาบังหน้า (IK ใน earthFX) • แขน L (จางครึ่ง) ง้างหมัดเก็บข้างเอว
    const la=EGUARD.larm;S.body.rotation.x=k.gLean||0.62;L.up.rotation.x=la[0];L.up.rotation.z=la[1];L.fo.rotation.x=la[2];}
  if(k.hold){for(const [A,s] of [[R,1],[L,-1]]){A.up.rotation.x=-1.4;A.up.rotation.z=-s*0.3;A.fo.rotation.x=-0.35;}}
  // BA ชาร์จ: raise = ยกสองมือขึ้นเหนือหัว (กำปั้นชิดกัน) • cock = ง้างไปหลังหัว + เอนหลัง • slam = ฟาดลงพื้น ตัวโน้มไปหน้า
  if(k.slam!==undefined){const v=k.slam,e=v*v;for(const [A,s] of [[R,1],[L,-1]]){A.up.rotation.x=lerp(CB.upX+CB.upC,CB.sUp,e);A.up.rotation.z=-s*lerp(CB.clasp,CB.sCl,e);A.fo.rotation.x=lerp(CB.foC,CB.sFo,e);}S.body.rotation.x=lerp(CB.lnB,CB.sLn,e);S.head.rotation.x=lerp(-0.35,0.25,e);}
  else if(k.raise!==undefined){const r=k.raise,c=k.cock||0;for(const [A,s] of [[R,1],[L,-1]]){A.up.rotation.x=lerp(-0.35,CB.upX,r)+CB.upC*c;A.up.rotation.z=-s*CB.clasp*r;A.fo.rotation.x=-0.35*r+(CB.foC+0.35)*c;}S.body.rotation.x=CB.lnB*(0.7*r+0.3*c);S.head.rotation.x=-0.35*r;}
  if(k.squeeze!==undefined){const r=k.squeeze;for(const [A,s] of [[R,1],[L,-1]]){A.up.rotation.x=-1.35;A.up.rotation.z=-s*lerp(0.15,0.55,r);A.fo.rotation.x=-0.5;}}
  if(k.spread!==undefined){const r=k.spread;for(const [A,s] of [[R,1],[L,-1]]){A.up.rotation.x=-1.25;A.up.rotation.z=s*lerp(-0.25,1.05,r);A.fo.rotation.x=-0.25;}}
  if(k.throwK!==undefined){const r=k.throwK;   // ท่าพุ่งแหลน: แขนขวาเหยียดไปหลังสุด → ปาออก • แขนซ้ายยื่นไปหน้า
    R.up.rotation.x=r<0?2.5:lerp(2.5,-1.7,r);R.up.rotation.z=-0.25;R.fo.rotation.x=0;L.up.rotation.x=-1.7;L.up.rotation.z=0.5;L.fo.rotation.x=-0.15;S.body.rotation.y=r<0?0.5:lerp(0.5,-0.3,r);S.body.rotation.x=r<0?-0.2:lerp(-0.2,0.25,r);}
  S.body.position.y=Math.sin((k.t||0)*3)*0.08-dip;S.body.position.z=0;
  if(S.legs){const on=!!k.run;S.legs.visible=on;S.ab.visible=on;S.lo.visible=!on;}
  if(k.run)standRun(S,k);}
// ท่า Rampage (ผู้ใช้): ยื่นสองมือไปหน้า → พับเข้ามาไขว้บังหน้า ค้างไว้ตลอด • ตัวก้มพุ่งตรง ๆ แบบ The Thing (Marvel Rivals) • ขาก้าวยาว หนัก ไม่สับถี่
// k: rt = วินาทีตั้งแต่เริ่มวิ่ง • rise 0-1 = ชูสองหมัดขึ้นเหนือหัว (ช่วงท้าย) • sl 0-1 = ทุบลงพื้น (ขาหยุดกางยืนมั่น)
const _eRq=new THREE.Quaternion(),_eRq2=new THREE.Quaternion(),_eRx=new THREE.Vector3(1,0,0);
function standRun(S,k){const ez=x=>{x=clamp(x,0,1);return x*x*(3-2*x);},rt=k.rt||0,ph=rt*10.5,ri=ez(k.rise||0),sl=ez(k.sl||0),mv=!k.sl,HY=1.4,go=ez(rt/0.2);
  const ln=sl>0?lerp(-0.15,0.95,sl):lerp(lerp(0.1,0.8,ez(rt/0.24)),-0.15,ri),bob=mv?-0.14*Math.cos(2*ph)*go:-0.32*sl,tw=mv?0.13*Math.sin(ph)*go*(1-ri):0;
  S.body.rotation.set(ln,tw,tw*0.4);S.body.position.set(0,HY-HY*Math.cos(ln)+bob,-HY*Math.sin(ln));S.legs.position.y=bob;S.head.rotation.x=-0.5*Math.max(0,ln);
  S.g.updateMatrixWorld(true);const bq=S.body.getWorldQuaternion(_eRq),B=v=>S.body.localToWorld(v),Gw=v=>S.g.localToWorld(v);
  const push=ez(rt/0.12),fold=ez((rt-0.13)/0.15);
  for(const [A,s] of [[S.R,1],[S.L,-1]]){
    const T=new THREE.Vector3(s*1.05,0.8,0.3).lerp(new THREE.Vector3(s*0.7,2.7,1.95),push)   // ห้อย → ยื่นตรงไปหน้า
      .lerp(s>0?new THREE.Vector3(-0.05,3.05,1.0):new THREE.Vector3(0.12,2.8,0.78),fold)   // พับไขว้บังหน้า (ขวาหน้า-สูง ซ้ายหลัง-ต่ำ)
      .lerp(new THREE.Vector3(s*0.5,4.5,0.45),ri);B(T);   // ชูขึ้นเหนือหัว
    if(sl>0)T.lerp(Gw(new THREE.Vector3(s*0.42,0.35,2.2)),sl);   // ทุบลงพื้นข้างหน้า
    eArmIK(A,T,new THREE.Vector3(s,-0.55*(1-ri),-0.35*ri).applyQuaternion(bq).normalize());}
  // ขา: ช่วงยืนเท้าแตะพื้นไถลไปหลัง • ช่วงยกเท้าเหวี่ยงไปหน้าสูง ๆ (ก้าวยาว)
  const gq=S.g.getWorldQuaternion(_eRq2),fw=new THREE.Vector3(0,0,1).applyQuaternion(gq);
  for(const [A,s] of [[S.legs.R,1],[S.legs.L,-1]]){let z,y=0.23,pt=0;
    if(mv){const u=((ph/6.2832+(s<0?0.5:0))%1+1)%1;if(u<0.5)z=0.9*(1-4*u);else{const v=(u-0.5)*2;z=-0.9+1.8*ez(v);y+=0.62*Math.sin(Math.PI*v);pt=0.4*Math.sin(Math.PI*v);}z=lerp(s*0.12,z+0.1,go);}
    else{z=s>0?0.8:-0.6;}
    eArmIK(A,Gw(new THREE.Vector3(s*0.5,y,z)),fw.clone().addScaledVector(new THREE.Vector3(s,0,0).applyQuaternion(gq),0.15));
    A.fist.quaternion.copy(A.fo.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(gq).multiply(new THREE.Quaternion().setFromAxisAngle(_eRx,pt)));}}
function eState(id){let s=EV.st.get(id);if(!s){s={stand:null,giant:null,cgiant:null,drill:null,pn:null,lift:0,ugT:-1,gSlam:0,spin:0,drills:[]};EV.st.set(id,s);}return s;}
function eStandOf(s){if(!s.stand)s.stand=makeStand(1,false);return s.stand;}
function eGiantOf(s){if(!s.giant)s.giant=makeStand(1,true);return s.giant;}
// ทรายร่วงจากส่วนล่างที่จาง + เศษหินตอนโผล่
function eSandFall(S,x,y,h,n){if(S.op<0.3)return;for(let i=0;i<n;i++)PARTS.push({x:x+rnd(-14,14)*S.g.scale.x,y:y+rnd(-14,14)*S.g.scale.x,h:h+rnd(0.2,0.9)*S.g.scale.x,vx:rnd(-10,10),vy:rnd(-10,10),vh:rnd(-1.5,-0.3),life:rnd(0.5,0.9),max:0.9,col:Math.random()<0.5?ECOL.sand:ECOL.dust,size:rnd(1.4,2.4),g:3});}
function eAppear(x,y,h,sc){burst(x,y,ECOL.sand,10*sc,90*sc,0.6,2.4,{h:h+1.5*sc,vh:[-1,2],g:3});eChunks(x,y,h+1*sc,Math.round(4*sc),120,4,0.14*sc);}
// จุดเล็งบนพื้น (ของเรา = เป้ากลางจอ • คนอื่น = ข้างหน้า 350)
function eAim(p,rg){const R=rg||350;let a=p.a;
  if(p.id===NET.myId){if(INPUT.gx>=0){const dx=INPUT.gx-p.x,dy=INPUT.gy-p.y,d=Math.hypot(dx,dy)||1,k=rg?Math.min(1,rg/d):1;return {x:p.x+dx*k,y:p.y+dy*k};}if(INPUT.ax||INPUT.ay)a=Math.atan2(INPUT.ay-p.y,INPUT.ax-p.x);}
  return {x:p.x+Math.cos(a)*R,y:p.y+Math.sin(a)*R};}
// ---------- วงเตือนบนพื้น (BA ชาร์จ / จุดปาเสา): วงเข้มก่อน แล้วสีอ่อนค่อย ๆ เติมเต็มวง ----------
function makeWarn(){const g=new THREE.Group(),dk=new THREE.MeshBasicMaterial({color:'#2a1a0c',transparent:true,opacity:0.45,depthWrite:false}),
  lt=new THREE.MeshBasicMaterial({color:hdr('#ffcf6a',1.2),transparent:true,opacity:0.35,depthWrite:false,blending:THREE.AdditiveBlending}),
  rim=new THREE.MeshBasicMaterial({color:hdr('#ffb04a',1.6),transparent:true,opacity:0.9,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const d=new THREE.Mesh(new THREE.CircleGeometry(1,48),dk),f=new THREE.Mesh(new THREE.CircleGeometry(1,48),lt),r=new THREE.Mesh(new THREE.RingGeometry(0.95,1,64),rim);
  for(const m of [d,f,r])m.rotation.x=-Math.PI/2;d.position.y=0.03;f.position.y=0.05;r.position.y=0.06;g.add(d,f,r);scene.add(g);g.userData={f,r};return g;}
function eWarnAt(g,x,y,r,k){g.visible=true;g.position.copy(eW(x,y,0));g.scale.setScalar(r*S3);g.userData.f.scale.setScalar(Math.max(0.001,k));g.userData.r.material.opacity=0.6+0.4*Math.sin(performance.now()/90);}
// ---------- ทุกเฟรม: ผู้เล่นสายดิน (เรียกจาก syncPlayers) ----------
function earthFX(o,p,pz,now,dt){
  const A=p.ea;if(!A){if(EV.st.has(p.id)){const s=EV.st.get(p.id);for(const k of ['stand','giant','cgiant'])if(s[k])standOp(s[k],0);if(s.drill)s.drill.visible=false;for(const d of s.drills)d.visible=false;if(s.warn)s.warn.visible=false;if(s.augW)s.augW.visible=false;if(s.pil)s.pil.visible=false;}return;}
  const s=eState(p.id),S=eStandOf(s),G2=eGiantOf(s),t=now/1000,fx=Math.cos(p.a),fy=Math.sin(p.a),rx=-fy,ry=fx,broken=A[0]>0,z0=(pz||0)-GY(p.x,p.y);   // ความสูงที่วาดจริงเหนือพื้น (snapshot ไม่มี p.z)
  if(o.shield)o.shield.visible=false;   // โล่ = Stand ใหญ่ เอามือบังหน้า (ไม่ใช้โล่ฟอง)
  // ----- Stand เล็ก: หมัด / ขี่ตอน Rampage -----
  let op=0,pose={t};
  if(s.pn&&!broken){const P=s.pn;if(P.pk&&P.t>=0.29&&(P.hs||0)<PK.hs)P.hs=(P.hs||0)+dt;else P.t+=dt;const k=P.t;   // pk: ค้างหมัดตอนโดนแผ่นหิน (hit-stop)
    if(!P.fx){P.fx=1;eAppear(P.x,P.y,P.h,1);}
    // 0–0.18 โผล่ + ง้าง • 0.18–0.29 ส่งหมัด (เร็ว ออกแรงตอนท้าย) • 0.29–0.65 ค้างแล้วผ่อนกลับ • จางหายถึง 0.75
    const ez=x=>x*x*(3-2*x),w=ez(Math.min(1,k/0.18)),pu=k<0.18?0:1-Math.pow(1-Math.min(1,(k-0.18)/0.11),3),rc=k<0.29?0:ez(Math.min(1,(k-0.29)/0.36));
    op=k<0.15?k/0.15:k<0.5?1:Math.max(0,1-(k-0.5)/0.25);
    const lu=(0.22+PK.lu*(P.pk||0))*pu*(1-0.5*rc)-0.06*w*(1-pu),bx=P.x+(P.x2-P.x)*lu,by=P.y+(P.y2-P.y)*lu;S.g.position.copy(eW(bx,by,P.h+0.15));S.g.rotation.y=eYaw(P.x,P.y,P.x2,P.y2);pose={t,punchW:w,punch:pu,rec:rc,pk:P.pk||0};
    if(k>0.76)s.pn=null;}
  else if(A[1]||s.rs>=0){   // Rampage: วิ่ง (ท่าใน standRun) • จบ = ชูสองหมัดแล้วทุบพื้น (s.rs เริ่มจาก event eslam)
    const sm=s.rs>=0;if(!sm){s.rT=(s.rT||0)+dt;s.ra=p.a;}else{s.rs+=dt;if(s.rs>0.55)s.rs=-1;}const a=s.ra===undefined?p.a:s.ra;
    op=sm?clamp((0.55-s.rs)/0.2,0,1):1;S.g.position.copy(eW(p.x,p.y,z0));S.g.rotation.y=Math.atan2(Math.cos(a),Math.sin(a));
    pose={t,run:1,rt:s.rT||0,rise:sm?1:clamp(((s.rT||0)-1.0)/0.16,0,1),sl:sm?Math.max(0.001,clamp(s.rs/0.07,0,1)):0};s.rLP=pose;}
  // Rampage จบแต่ event ทุบยังไม่มา (หรือจบแบบเงียบ) → ค้างท่าเดิมแล้วจางไปเลย ไม่ยืดตัวลุกขึ้นยืน
  else if(s.rLP&&S.op>0.02){op=Math.max(0,S.op-dt*5);pose=s.rLP;pose.t=t;S.g.position.copy(eW(p.x,p.y,z0));if(op<=0.02)s.rLP=null;}
  else{op=Math.max(0,S.op-dt*5);s.rT=0;s.rLP=null;}
  standOp(S,op);if(op>0){standPose(S,pose);eSandFall(S,(S.g.position.x/S3)+MW/2,(S.g.position.z/S3)+MH/2,S.g.position.y-GY(p.x,p.y)+0.6,1);}
  // ขี่ Stand ตอน Rampage: ยกตัว + ฝุ่นตลบ + หินกระเด็นหลัง + รอยพื้นแตก + เกราะลม/เส้นลม (eRampWind) + เท้ากระแทกพื้น
  s.lift=lerp(s.lift,A[1]||s.rs>=0&&s.rs<0.3||s.rLP&&S.op>0.5?1.9:0,1-Math.exp(-12*dt));if(s.lift>0.01)o.g.position.y+=s.lift;
  eRampWind(s,S,p,A[1]&&!(s.rs>=0)&&op>0,t,dt,fx,fy,rx,ry);
  if(A[1]&&!(s.rs>=0)){for(let i=0;i<2;i++)burst(p.x-fx*rnd(10,40)+rnd(-20,20),p.y-fy*rnd(10,40)+rnd(-20,20),ECOL.dust,1,60,1.1,5,{h:0.3,vh:[0.5,2],g:-0.2,smoke:true,grow:1.8});
    if(Math.random()<0.5)eChunks(p.x-fx*15,p.y-fy*15,0.2,1,160,5,0.16);
    s.crk=(s.crk||0)-dt;if(s.crk<=0){s.crk=0.07;SHAPES_Q.push({k:'decal',x:p.x+rnd(-8,8),y:p.y+rnd(-8,8),col:'#000000',s1:0.9,life:1.6,op:0.55});}
    const si=Math.floor((s.rT||0)*10.5/Math.PI);if(si!==s.stp){s.stp=si;if(si>0){const sd=si%2?-1:1,X=p.x+fx*20+rx*10*sd,Y=p.y+fy*20+ry*10*sd;   // เท้ากระแทกพื้น (หนัก ๆ แบบ The Thing)
      burst(X,Y,ECOL.dust,6,90,0.6,3.4,{h:0.2,vh:[0.3,1.5],g:-0.2,smoke:true,grow:1.6});ring(X,Y,'#e8d4a8',34,0.25,0.1);eChunks(X,Y,0.2,3,140,4,0.14);SHAPES_Q.push({k:'decal',x:X,y:Y,col:'#000000',s1:0.8,life:1.8,op:0.6});
      if(p.id===NET.myId)shake(2.5);}}}
  if(broken&&Math.random()<0.08)burst(p.x+rnd(-15,15),p.y+rnd(-15,15),ECOL.dust,1,15,0.8,1.6,{h:pz+rnd(0.5,2),g:3});
  // ----- Stand ใหญ่: อัลติบนฟ้า > BA ชาร์จ > โล่ -----
  let gop=0;const gp={t};
  if(A[3]===1||s.ugT>=0){   // อัลติ: ถือเสายักษ์ท่าพุ่งแหลนหลังเรา
    G2.g.scale.setScalar(2.6);G2.g.position.copy(eW(p.x-fx*26+rx*70,p.y-fy*26+ry*70,z0-2.6));G2.g.rotation.y=Math.atan2(fx,fy);gop=1;   // หลัง-ขวา ไม่บังเป้า
    if(s.ugT>=0){s.ugT+=dt;gp.throwK=Math.min(1,s.ugT/0.16);if(s.ugT>0.6)s.ugT=-1;}else gp.throwK=-1;
    if(!s.pil){s.pil=makePillar();scene.add(s.pil);}
    s.pil.visible=A[3]===1&&s.ugT<0;
    if(s.pil.visible){G2.g.updateMatrixWorld(true);const h=new THREE.Vector3();G2.R.fist.getWorldPosition(h);const am=eAim(p);s.pil.position.copy(h);s.pil.lookAt(eW(am.x,am.y,0));s.pil.translateZ(1.2);}}
  else if(s.pil)s.pil.visible=false;
  if(!(A[3]===1||s.ugT>=0)){
    if(A[9]>0||s.gSlam>0){   // BA ชาร์จ: ยกสองมือหลังเรา แล้วทุบ
      // 0–1.3 วิ ค่อย ๆ ยกมือ • 1.3–2 วิ ง้างไปหลังหัว สั่นแรงขึ้น • ทุบ: เหวี่ยงลง 0.1 วิ (ตรงกับระเบิด) ค้าง แล้วจาง
      if(A[9]>0){s.cbT=(s.cbT||0)+dt;if(Math.abs(s.cbT-A[9])>0.2)s.cbT=A[9];}else if(!(s.gSlam>0))s.cbT=0;
      const u=s.gSlam>0?0.7-s.gSlam:-1,v=u<0?0:Math.min(1,u/0.1),bk=24-CB.lunge*v*v;
      G2.g.scale.setScalar(1.55);G2.g.position.copy(eW(p.x-fx*bk,p.y-fy*bk,z0-0.3));G2.g.rotation.y=Math.atan2(fx,fy);gop=1;
      if(s.gSlam>0){s.gSlam-=dt;gp.slam=v;if(u>0.1&&u<0.2)G2.g.position.y-=Math.sin((u-0.1)/0.1*Math.PI)*0.12;if(s.gSlam<=0.28)gop=Math.max(0,s.gSlam/0.28);}
      else{const T=s.cbT||0,r=Math.min(1,T/1.3),c=clamp((T-1.3)/0.7,0,1),sh=0.015+0.06*c*c;gp.raise=r*r*(3-2*r);gp.cock=c*c*(3-2*c);G2.g.position.y+=Math.sin(t*41)*sh;G2.g.position.x+=Math.sin(t*37+1)*sh*0.6;}}
    else if(p.sh&&!broken){   // โล่: Stand ใหญ่ชิดหลังเรา เอามือมาบังข้างหน้า
      G2.g.scale.setScalar(EGUARD.sc);G2.g.position.copy(eW(p.x-fx*EGUARD.back+rx*EGUARD.side,p.y-fy*EGUARD.back+ry*EGUARD.side,z0+EGUARD.z));G2.g.rotation.y=Math.atan2(fx,fy);gp.guard=1;gp.gLean=EGUARD.lean;gop=Math.min(1,(s.gopL||0)+dt*8);}}
  if(!gop)gop=Math.max(0,(s.gopL||0)-dt*4);
  if(gop>0.02&&(s.gopL||0)<=0.02)eAppear(p.x-fx*20,p.y-fy*20,z0,1.6);
  // Stand ใหญ่อยู่ระหว่างกล้องกับตัวเรา → ของเราเองให้โปร่ง (ไม่บังจอ) ตอน BA ชาร์จ 0.5 / อัลติ 0.75 • ท่ากันโล่ = ทึบชัด (ผู้ใช้ 2026-10-21) แขน L จางครึ่ง
  s.gopL=gop;standOp(G2,gop*(p.id===NET.myId&&!gp.guard?(A[3]===1||s.ugT>=0?0.75:0.5):1),gp.guard?0.5:1);if(gop>0){standPose(G2,gp);if(Math.random()<0.6)eSandFall(G2,p.x-fx*20,p.y-fy*20,z0+1.3,1);
    if(gp.guard){const F=EGUARD.fist,E=EGUARD.elbow;G2.g.updateMatrixWorld(true);eArmIK(G2.R,eW(p.x+fx*F[0]+rx*F[1],p.y+fy*F[0]+ry*F[1],z0+F[2]),new THREE.Vector3(-rx*E[0]+fx*E[1],-E[2],-ry*E[0]+fy*E[1]).normalize());}}
  // วงเตือน BA ชาร์จ (ทุกคนเห็น)
  if(A[9]>0){if(!s.warn)s.warn=makeWarn();eWarnAt(s.warn,p.x+fx*170,p.y+fy*170,180,Math.min(1,A[9]/2));}else if(s.warn)s.warn.visible=false;
  // ท่าตัวเรา: ชูไม้ตอนชาร์จ BA / Auger ระดับสูงสุด / ถือเสา • ฟาดไม้ลงตอนปล่อย
  if(o.wdT>0){o.wdT-=dt;const k=1-Math.max(0,o.wdT)/0.25;o.armR.rotation.x=lerp(-2.9,-0.4,Math.min(1,k*1.6));o.armR.rotation.z=-0.1;}
  else if(A[9]>0||A[3]===1){o.armR.rotation.x=-2.9;o.armR.rotation.z=-0.1;}
  // ----- Terra Auger: สว่านเงินเรียวแหลมลอยเฉียงเหนือไหล่ หันตามเป้า หมุนเร็วขึ้น/ร้อนขึ้นตามระดับ -----
  if(A[2]>0){if(!s.drill){s.drill=makeDrill();scene.add(s.drill);}const tier=A[2]>=4.5?3:A[2]>=2?2:1,am=eAim(p,600),D=s.drill;
    if(p.id===NET.myId){if(!s.augW)s.augW=makeWarn();eWarnAt(s.augW,am.x,am.y,[80,110,150][tier-1],Math.min(1,A[2]/4.5));}
    D.visible=true;D.scale.setScalar(EDR.sc);D.position.copy(eW(p.x+fx*EDR.fw+rx*EDR.side,p.y+fy*EDR.fw+ry*EDR.side,z0+EDR.h));D.lookAt(eW(am.x,am.y,0));s.spin+=dt*(10+tier*16);D.rotateZ(s.spin);drillHeat(D,tier,t);
    // ลมดูดเข้า: เส้นลม/ฝุ่นจากรอบ ๆ หมุนวนเข้าหาตัวสว่าน (แรงขึ้นตามระดับ) • ฝุ่นพื้นใต้ตัวถูกดูดขึ้น
    const q=simOf(D.position);for(let i=0;i<1+tier;i++){const a=rnd(0,6.283),rr=rnd(45,80),dh=rnd(-1.2,1.2),lf=rnd(0.22,0.32),sw=40+40*tier;
      PARTS.push({x:q.x+Math.cos(a)*rr,y:q.y+Math.sin(a)*rr,h:q.h+dh,vx:-Math.cos(a)*rr/lf-Math.sin(a)*sw,vy:-Math.sin(a)*rr/lf+Math.cos(a)*sw,vh:-dh/lf,life:lf,max:lf,col:i%2?'#f2f4f6':'#dcd6ca',size:rnd(1.1,1.8),g:0,drag:0,sh:2});}
    if(Math.random()<0.25*tier){const a=rnd(0,6.283),rr=rnd(20,50),gx=q.x+Math.cos(a)*rr,gy=q.y+Math.sin(a)*rr,gh=GY(gx,gy)+0.1,lf=0.5;PARTS.push({x:gx,y:gy,h:gh,vx:(q.x-gx)/lf,vy:(q.y-gy)/lf,vh:(q.h-gh)/lf,life:lf,max:lf,col:ECOL.dust,size:rnd(2.5,4),g:0,smoke:true,grow:-0.5});}
    if(tier>=2&&Math.random()<0.4)burst(q.x,q.y,tier===3?'#ff5a1a':'#ffa040',1,30,0.35,1.6,{h:q.h,g:-1});
    if(s.lastTier&&tier>s.lastTier){burst(q.x,q.y,tier===3?'#ff6a2a':'#ffb04a',16,140,0.5,2.4,{h:q.h,g:0});FX.flashLight(q.x,q.y,q.h,tier===3?'#ff6a2a':'#ffb04a',3,8,0.25);if(p.id===NET.myId)snd('buff',{x:p.x,y:p.y,vol:0.6});}s.lastTier=tier;
    // ท่าตอนชาร์จ: ขาไปหลัง แขนชี้ไปทางเป้า • ระดับสูงสุด = ชูไม้
    if(o.legs){o.legs[1].rotation.x=0.6;o.legs[0].rotation.x=-0.25;}
    if(!(o.wdT>0)){o.armR.rotation.x=tier===3?-2.9:-1.5;o.armR.rotation.z=-0.05;}
    if(Math.random()<0.4)burst(p.x+rnd(-25,25),p.y+rnd(-25,25),ECOL.dust,1,40,0.6,2,{h:z0+0.1,vh:[0.5,1.5],g:-0.5,smoke:true});}
  else if(s.drill){s.drill.visible=false;s.lastTier=0;}
  if(!(A[2]>0)&&s.augW)s.augW.visible=false;
  // ----- Wrath: สว่านชาร์จเต็ม 5 อันลอยหลังเรา (ขวา → ซ้าย ยิงอันขวาสุดก่อน) -----
  // ขึ้นจากพื้นตอนเริ่ม (ไล่ทีละอัน) • จมลงพื้นตอนจบอัลติ
  if(A[3]===3){s.drN=A[4];s.drA=Math.min(1,(s.drA||0)+dt/0.9);}else s.drA=Math.max(0,(s.drA||0)-dt/0.5);
  if(s.drA>0){const am=eAim(p);while(s.drills.length<5){const d=makeDrill();scene.add(d);s.drills.push(d);}
    for(let i=0;i<5;i++){const d=s.drills[i],on=i<(s.drN|0);d.visible=on;if(!on)continue;const lat=(i-2)*28,hh=3.4+Math.cos((i-2)*0.7)*0.8,
        e=A[3]===3?Math.min(1,Math.max(0,(s.drA*0.9-i*0.08)/0.55)):s.drA,k=1-Math.pow(1-e,3),hx=p.x-fx*26+rx*lat,hy=p.y-fy*26+ry*lat;
      d.position.copy(eW(hx,hy,lerp(-2.4,z0+hh+Math.sin(t*3+i)*0.12,k)));d.lookAt(eW(am.x,am.y,0));d.rotateZ(t*60+i);drillHeat(d,3,t);
      if(e>0&&e<1&&Math.random()<0.6){burst(hx,hy,ECOL.dust,2,60,0.6,2.4,{h:0.2,vh:[1,3],g:4});if(Math.random()<0.3)eChunks(hx,hy,0.2,1,90,4,0.12);}
      if(Math.random()<0.2){const q=simOf(d.position);burst(q.x,q.y,'#ff5a1a',1,25,0.3,1.4,{h:q.h,g:-1});}}}
  else for(const d of s.drills)d.visible=false;
  if(A[3]===1){if(Math.random()<0.5)burst(p.x+rnd(-30,30),p.y+rnd(-30,30),ECOL.glow,1,20,0.7,1.6,{h:z0+rnd(0,2),g:-0.5});
    if(p.id===NET.myId){const am=eAim(p);if(!EV.mark)EV.mark=makeWarn();eWarnAt(EV.mark,am.x,am.y,90,0.25+0.15*Math.sin(t*6));}}
  else if(p.id===NET.myId&&EV.mark)EV.mark.visible=false;
}
// ---------- สว่าน (ref: designs/earth_ref/drill_ref.png): หินแหลมเรียวเป็นตัวหลัก (เด่นสุด) + เส้นเกลียวลมบาง ๆ รอบ ๆ เป็นเอฟเฟกต์ • ร้อนที่ตัวหิน (เหลือง → แดงตามระดับ) • ปลายชี้ +z ----------
// ภาพสะท้อนปลอมของเหล็ก (equirect): ฟ้าสว่างบน ขอบฟ้าขาวจ้า พื้นเข้ม + แถบไฟสว่าง → เหล็กดูเงาวาวแม้ฉากไม่มี envMap
function eSteelEnv(){if(ETEX.env)return ETEX.env;const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,128);
  g.addColorStop(0,'#c8d6e6');g.addColorStop(0.42,'#f4f8fc');g.addColorStop(0.5,'#ffffff');g.addColorStop(0.56,'#6c727a');g.addColorStop(1,'#2a2e33');x.fillStyle=g;x.fillRect(0,0,256,128);
  x.fillStyle='#ffffff';for(const [px,w] of [[30,14],[110,6],[170,20],[220,8]]){x.globalAlpha=0.9;x.fillRect(px,18,w,34);}
  const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.colorSpace=THREE.SRGBColorSpace;t.userData.keep=true;ETEX.env=t;return t;}
// ความร้อน (emissiveMap): ปลายเหลืองขาว → ส้ม → แดง → ค่อย ๆ เฟดหายเกือบถึงกลาง-ค่อนท้าย (uv.y = 1 ที่ปลายกรวย = บนสุดของภาพ)
function eHeatTex(){if(ETEX.heat)return ETEX.heat;const c=document.createElement('canvas');c.width=4;c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);
  g.addColorStop(0,'#fff3c8');g.addColorStop(0.07,'#ffd060');g.addColorStop(0.18,'#ff8a26');g.addColorStop(0.32,'#f0400e');g.addColorStop(0.46,'#a81a04');g.addColorStop(0.6,'#4a0a02');g.addColorStop(0.72,'#140200');g.addColorStop(0.8,'#000000');g.addColorStop(1,'#000000');
  x.fillStyle=g;x.fillRect(0,0,4,256);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.userData.keep=true;ETEX.heat=t;return t;}
// กรวยมีร่องเกลียว 3 ร่อง (บิดตามความยาว) ท้ายตัดเรียบ • uv.y = 0 ท้าย → 1 ปลาย (ใช้กับความร้อน) • ปลายชี้ +y (หมุนทีหลัง)
// ตำแหน่ง/ขนาดสว่านตอนชาร์จ (ผู้ใช้ 2026-10-21: เล็กลง เรียวขึ้น ลอยข้างตัวห่างออกมา เห็นทรงชัด) • side = ไปทางขวา (px) • fw = ไปหน้า (px) • h = สูงจากพื้น (ม.)
const EDR={side:46,fw:4,h:2.8,sc:1};
function eDrillGeo(){if(EV.drGeo)return EV.drGeo;const R=0.19,L=2.5,NS=40,NR=48,pos=[],uv=[],idx=[];
  for(let j=0;j<=NS;j++){const t=j/NS;for(let i=0;i<=NR;i++){const th=i/NR*Math.PI*2,fl=1-0.16*Math.pow(0.5+0.5*Math.cos(3*(th-t*Math.PI*2.2)),3),r=R*(1-t)*fl;pos.push(Math.cos(th)*r,t*L-L/2,Math.sin(th)*r);uv.push(i/NR,t);}}
  for(let j=0;j<NS;j++)for(let i=0;i<NR;i++){const a=j*(NR+1)+i,b=a+NR+1;idx.push(a,a+1,b,b,a+1,b+1);}
  const c0=pos.length/3;pos.push(0,-L/2,0);uv.push(0.5,0);for(let i=0;i<NR;i++)idx.push(c0,i+1,i);   // ฝาท้ายเรียบ
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.userData.keep=true;EV.drGeo=g;return g;}
// สว่าน (ผู้ใช้ 2026-10-21): กรวยเหล็กเงา ร่องเกลียว ท้ายตัดเรียบ • ความร้อนเฟดจากปลายถึงกลาง-ค่อนท้าย • เส้นเกลียวลมบาง ๆ รอบ ๆ • ปลายชี้ +z
function makeDrill(){const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:'#c6ccd3',metalness:0.92,roughness:0.2,envMap:eSteelEnv(),envMapIntensity:0.95,emissive:'#ffffff',emissiveMap:eHeatTex(),emissiveIntensity:0});
  const sp=new THREE.Mesh(eDrillGeo(),m);sp.rotation.x=Math.PI/2;sp.position.z=0.35;sp.castShadow=true;g.add(sp);
  const wm=new THREE.MeshBasicMaterial({color:hdr('#f4efe4',1.1),transparent:true,opacity:0.28,blending:THREE.AdditiveBlending,depthWrite:false});
  for(const ph of [0,Math.PI]){const pts=[];for(let i=0;i<=40;i++){const k=i/40,a=ph+k*Math.PI*2*2.5,r=0.27*(1-k)+0.04;pts.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,k*2.5-0.9));}
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),60,0.012,3,false),wm));}
  g.userData={m,wm};return g;}
// ระดับ 1 = เหล็กเย็น • 2 = ปลายร้อนส้ม • 3 = ร้อนจัด — ไล่เฉดจาก eHeatTex เสมอ
function drillHeat(d,tier,t){const U=d.userData;
  U.m.emissiveIntensity=tier<=1?0:tier===2?0.85+0.1*Math.sin(t*20):1.9+0.25*Math.sin(t*25);U.wm.opacity=tier<=1?0.2:tier===2?0.28:0.35;}
// ---------- เสายักษ์ (ref: designs/earth_ref/pillar_ref.png): เสาเหลี่ยมยาว ปลายหนึ่งแหลม อีกปลายมีก้อนหินเกาะ • น้ำตาลเข้ม เหลือง-ดำ • ปลายแหลมชี้ +z ----------
function makePillar(){const g=new THREE.Group(),m=eTMat('pillar');m.userData.keep=false;
  const col=new THREE.Mesh(new THREE.CylinderGeometry(0.85,0.95,7,4,1),m);col.rotation.x=Math.PI/2;col.rotation.y=Math.PI/4;col.castShadow=true;g.add(col);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(0.85,2.2,4),m);tip.rotation.x=Math.PI/2;tip.rotation.y=Math.PI/4;tip.position.z=4.6;g.add(tip);
  for(let i=0;i<8;i++){const r=new THREE.Mesh(rockGeo(rnd(0.7,1.3),rnd(0.6,1.1),rnd(0.7,1.3),0.15),eTMat('pillar','#8a7458'));r.position.set(rnd(-0.9,0.9),rnd(-0.9,0.9),-3.6+rnd(-0.6,0.5));r.rotation.set(rnd(0,3),rnd(0,3),rnd(0,3));r.castShadow=true;g.add(r);}
  for(let i=0;i<5;i++){const c=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.05,rnd(1.5,3)),new THREE.MeshBasicMaterial({color:hdr('#ffb83a',1.3)}));c.position.set(rnd(-0.6,0.6)>0?0.88:-0.88,rnd(-0.6,0.6),rnd(-2.5,2.5));g.add(c);}
  return g;}
// ---------- กระสุนหิน ----------
function earthProjMesh(o,t){let m;
  if(t==='eslab'){m=makeSlab(true);m.position.y=0.8;}   // แผ่นหินลอยสูงกว่าจุดชน (ตรงกับตอนงัดขึ้นมา)
  else{m=new THREE.Mesh(new THREE.DodecahedronGeometry(0.3,0),eTMat('wall'));}
  o.g.add(m);o.fileModel=m;o.halo.material=glowMat(ECOL.dust,0.4);}
// แผ่นหินเหลี่ยม Stonebreaker (cr = มีรอยร้าวเรืองจากหมัด)
// SLAB = ขนาดแผ่น (กว้าง สูง หนา) — แบนใหญ่ • ชนจริงใช้รัศมีบน host (PDEF.eslab.r) ไม่ได้ขึ้นกับ mesh
const SLAB={w:5.2,h:2.7,d:0.3};
function makeSlab(cr){const m=new THREE.Group();const b=new THREE.Mesh(rockGeo(SLAB.w,SLAB.h,SLAB.d,0.05,3),eTMat('wall','#c8b08a'));b.castShadow=true;m.add(b);
  if(cr)slabCracks(m);
  return m;}
// รอยร้าวเรืองแตกออกจากกลางแผ่น (จุดที่หมัดโดน)
function slabCracks(m){const cm=new THREE.MeshBasicMaterial({color:hdr(ECOL.glow,1.8)});
  for(let i=0;i<7;i++){const a=i/7*6.283+0.3,L=i%2?1.1:1.6,c=new THREE.Mesh(new THREE.BoxGeometry(L,0.07,SLAB.d+0.08),cm);c.position.set(Math.cos(a)*L*0.5,Math.sin(a)*L*0.5,0);c.rotation.z=a;m.add(c);}
  const o=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,SLAB.d+0.1),cm);o.rotation.z=0.8;m.add(o);}
// ---------- สิ่งก่อสร้าง + ฝุ่น (เรียกจาก render loop) ----------
function earthClear(){if(!EV)return;   // clearDyn ถูกเรียกตอนโหลด (ก่อนไฟล์นี้) — var จึงยังเป็น undefined
  for(const o of EV.es.values())disposeObj(o.g);EV.es.clear();
  for(const s of EV.st.values()){for(const k of ['stand','giant','cgiant'])if(s[k])disposeObj(s[k].g);for(const k of ['drill','warn','augW','pil'])if(s[k])disposeObj(s[k]);for(const d of s.drills)disposeObj(d);}EV.st.clear();
  for(const c of EV.crush)if(c.G)disposeObj(c.G.g);EV.crush.length=0;if(EV.mark){disposeObj(EV.mark);EV.mark=null;}
  for(const a of EV.anims)if(a.g)disposeObj(a.g);EV.anims.length=0;earthFog(false);}
function eMakeSO(w){const k=w[1],x1=w[2],y1=w[3],x2=w[4],y2=w[5],r=w[6],g=new THREE.Group();let mat,mats=null,h=1;
  if(k===0){const L=Math.hypot(x2-x1,y2-y1)*S3,W=r*2*S3;h=6;mat=eTMat('cliff');const m2=eTMat('cliff','#d2c2a8'),dk=eTMat('cliff','#8c7c6a');mats=[mat,m2,dk];
    const n=Math.max(4,Math.round(L/1.7)),cw=L/n;
    for(let i=0;i<n;i++){const z=-L/2+cw*(i+0.5),hh=h*(i===0||i===n-1?rnd(0.7,0.85):rnd(0.86,1.1)),b=new THREE.Mesh(rockGeo(W*rnd(0.95,1.2),hh,cw*1.3,0.07,3),i%3===1?m2:mat);
      b.position.set(rnd(-0.12,0.12),hh/2-0.15,z);b.rotation.set(rnd(-0.05,0.05),rnd(-0.12,0.12),rnd(-0.06,0.06));b.castShadow=b.receiveShadow=true;g.add(b);
      const t=new THREE.Mesh(new THREE.ConeGeometry(rnd(0.45,0.75),rnd(0.9,2),5),i%2?mat:m2);t.position.set(rnd(-0.2,0.2),hh-0.15,z+rnd(-0.3,0.3));t.rotation.set(rnd(-0.25,0.25),rnd(0,3),rnd(-0.25,0.25));t.castShadow=true;g.add(t);}
    for(let i=0;i<n*2;i++){const sd=i%2?1:-1,c=new THREE.Mesh(rockGeo(rnd(0.6,1.25),rnd(0.5,1.05),rnd(0.6,1.25),0.18),dk);c.position.set(sd*(W/2+rnd(0.05,0.5)),rnd(0.1,0.35),-L/2+rnd(0,L));c.rotation.y=rnd(0,3);c.castShadow=true;g.add(c);}
    g.rotation.y=eYaw(x1,y1,x2,y2);}
  else if(k===1){   // เสาอัลติ: ปักเอียงตามทิศที่ตก (ทิศเก็บใน x1,y1 → x2,y2)
    mat=null;const P=makePillar(),a=Math.atan2(y2-y1,x2-x1),d=new THREE.Vector3(Math.cos(a),-1.15,Math.sin(a)).normalize();
    P.position.copy(d.clone().multiplyScalar(-2.4));P.lookAt(P.position.clone().add(d));g.add(P);P.traverse(q=>{if(q.isMesh)q.castShadow=true;});h=7;}
  else if(k===2){   // เนินดิน Terra Auger: สูงเท่าตัว กว้าง ~150 เหมือนกำแพง
    mat=eTMat('wall','#9a8262');h=2.4;const R=r*S3;const c=new THREE.Mesh(rockGeo(R*1.3,h,R*1.3,0.12,3),mat);c.position.y=h/2-0.1;c.castShadow=c.receiveShadow=true;g.add(c);
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2,b=new THREE.Mesh(rockGeo(rnd(1,1.6),rnd(1,1.9),rnd(1,1.6),0.18),mat);b.position.set(Math.cos(a)*R*0.75,rnd(0.4,0.9),Math.sin(a)*R*0.75);b.rotation.y=rnd(0,3);b.castShadow=true;g.add(b);}}
  else{mat=new THREE.MeshBasicMaterial({color:hdr('#ffd86b',1.2),transparent:true,opacity:0.18,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});const L=Math.hypot(x2-x1,y2-y1)*S3;h=12;const b=new THREE.Mesh(new THREE.PlaneGeometry(L,h),mat);b.position.y=h/2;b.rotation.y=Math.PI/2;g.add(b);g.rotation.y=eYaw(x1,y1,x2,y2);}
  g.position.copy(eW(k===1?x1:(x1+x2)/2,k===1?y1:(y1+y2)/2,0));scene.add(g);return {g,mat,mats:mats||(mat?[mat]:[]),k,h,born:performance.now(),x:k===1?x1:(x1+x2)/2,y:k===1?y1:(y1+y2)/2,hp:w[7],x1,y1,x2,y2,base:g.position.clone()};}
function syncEarth(v,dt,now){
  const seen=new Set();
  for(const w of (v.ES||[])){seen.add(w[0]);let o=EV.es.get(w[0]);
    if(!o){o=eMakeSO(w);EV.es.set(w[0],o);
      if(o.k===0){const L=Math.hypot(o.x2-o.x1,o.y2-o.y1);for(let i=0;i<=5;i++){const px=lerp(o.x1,o.x2,i/5),py=lerp(o.y1,o.y2,i/5);burst(px,py,ECOL.dust,6,140,0.9,3.6,{h:0.3,vh:[2,6],g:6});eChunks(px,py,0.3,2,150,7,0.22);}
        for(let i=0;i<3;i++)smoke(lerp(o.x1,o.x2,rnd(0,1)),lerp(o.y1,o.y2,rnd(0,1)),0.2,3,ECOL.dust,1.6,9,L*0.15);shake(0.15);}
      else if(o.k===2){eChunks(o.x,o.y,0.3,10,200,7,0.25);smoke(o.x,o.y,0.3,8,ECOL.dust,1.4,9,70);}
      else if(o.k!==3){burst(o.x,o.y,ECOL.dust,14,140,0.9,4,{h:0.3,vh:[1,4],g:3,smoke:true,grow:1.5});}}
    const age=(now-o.born)/1000;
    if(o.k===0||o.k===2)o.g.scale.y=Math.min(1,0.05+age/(o.k===0?0.22:0.3));
    if(o.k===3)o.mat.opacity=0.14+0.08*Math.sin(now/300);
    else if(w[7]!==o.hp&&o.mat){o.hp=w[7];for(const m of o.mats){if(!m.userData.c0)m.userData.c0=m.color.clone();m.color.copy(m.userData.c0).lerp(new THREE.Color('#5a4632'),1-w[7]/100);}burst(o.x,o.y,ECOL.dust,4,60,0.5,2,{h:rnd(0.5,o.h),g:4});}}
  for(const [id,o] of EV.es)if(!seen.has(id)){disposeObj(o.g);for(const m of o.mats)m.dispose();EV.es.delete(id);}
  // Tectonic Crush: Stand ใหญ่หลังกำแพง ออกแรงช้า ๆ (หินสั่น ฝุ่นออก) แล้วหนีบปังทีเดียว
  for(let i=EV.crush.length-1;i>=0;i--){const C=EV.crush[i];C.t+=dt;const k=C.t/E_CRUSH,c=Math.cos(C.a),sn=Math.sin(C.a),nx=-sn,ny=c;
    const G=C.G;G.g.position.copy(eW(C.x+c*178,C.y+sn*178,-0.6));G.g.rotation.y=Math.atan2(-c,-sn);
    standOp(G,C.boom?Math.max(0,1-(C.t-C.boom)/0.5):Math.min(1,C.t/0.15));
    const strain=Math.min(1,k/0.7),close=k<0.7?0:Math.min(1,(k-0.7)/0.3);
    standPose(G,{t:now/1000,lean:0.22*strain+0.12*close});if(!C.boom)G.g.position.y+=Math.sin(now/22)*0.03*strain;
    // มือแปะด้านนอกกำแพงแต่ละข้าง (ใกล้ปลายฝั่ง Stand) แล้วดันตามกำแพงที่เลื่อนเข้าหากัน • หลังปัง = ค้างมือที่จุดสุดท้าย
    if(!C.tg)C.tg={};if(!C.boom)for(const o of EV.es.values()){if(o.k!==0||Math.hypot(o.x-C.x,o.y-C.y)>260)continue;const sd=Math.sign((o.x-C.x)*nx+(o.y-C.y)*ny)||1;
      C.tg[sd]=o.g.position.clone().add(new THREE.Vector3(c*112*S3+sd*nx*24*S3,3.3,sn*112*S3+sd*ny*24*S3));}
    G.g.updateMatrixWorld(true);for(const A of [G.R,G.L]){const sh=A.up.getWorldPosition(new THREE.Vector3()),sd=Math.sign((sh.x-G.g.position.x)*nx+(sh.z-G.g.position.z)*ny)||1,T=C.tg[sd];
      if(T)eArmIK(A,T,new THREE.Vector3(sd*nx,-0.7,sd*ny).normalize());}
    if(!C.boom){for(const o of EV.es.values()){if(o.k!==0||Math.hypot(o.x-C.x,o.y-C.y)>260)continue;const sd=Math.sign((o.x-C.x)*nx+(o.y-C.y)*ny)||1,off=close*close*100;
        o.g.position.copy(o.base).add(new THREE.Vector3(-sd*nx*off*S3+rnd(-1,1)*0.06*strain,0,-sd*ny*off*S3+rnd(-1,1)*0.06*strain));
        if(Math.random()<0.35*strain){const q=lerp(-1,1,Math.random());burst(o.x+c*q*130,o.y+sn*q*130,ECOL.dust,2,60,0.7,3,{h:rnd(0.5,5),vh:[0,1],g:2,smoke:true,grow:1.4});}}
      if(Math.random()<0.4*strain)eChunks(C.x+rnd(-80,80),C.y+rnd(-80,80),0.2,1,80,3,0.12);}
    if(C.t>(C.boom||9)+0.6){disposeObj(G.g);EV.crush.splice(i,1);}}
  // ฝุ่น Dust Burst
  const me=myPos();let inEnemy=false;
  for(const d of (v.ED||[])){const [,x,y,r,t,team]=d;
    for(let i=0,n=Math.ceil(r/120);i<n;i++){const a=rnd(0,Math.PI*2),rr=r*Math.sqrt(Math.random());smoke(x+Math.cos(a)*rr,y+Math.sin(a)*rr,rnd(0.3,4),1,Math.random()<0.5?ECOL.dust:'#c9b38c',2.6,rnd(10,16),20);}
    if(me&&me.al&&Math.hypot(me.x-x,me.y-y)<r){if(team!==me.tm)inEnemy=true;}}
  earthFog(inEnemy);
  for(let i=EV.anims.length-1;i>=0;i--){const a=EV.anims[i];a.t+=dt;if(a.fn(a)===false||a.t>=a.life){if(a.g)disposeObj(a.g);if(a.end)a.end(a);EV.anims.splice(i,1);}}
}
// ศัตรูอยู่ในฝุ่น: มองชัดแค่ ~150 รอบตัว ไกลกว่านั้นจางเป็นสีฝุ่น (ใช้ fog ของฉาก)
function earthFog(on){const F=scene.fog;if(!F)return;
  if(on){if(!EV.fog)EV.fog={c:F.color.clone(),n:F.near,f:F.far};const cd=cam.position.distanceTo(_eCamT())||6;F.color.set('#9c8664');F.near=cd+7.5;F.far=cd+30;}
  else if(EV.fog){F.color.copy(EV.fog.c);F.near=EV.fog.n;F.far=EV.fog.f;EV.fog=null;}}
function _eCamT(){const me=myPos();return me?eW(me.x,me.y,(me.z||0)+1.2):new THREE.Vector3();}
function eAnim(o){EV.anims.push(Object.assign({t:0},o));}
function eDebris(x,y,h,n,sp){burst(x,y,'#7a6446',n,sp||200,0.9,3.2,{h:h||0.3,vh:[2,7],g:14,sh:4,vr:6,c2:'#3a2e22'});smoke(x,y,h||0.3,Math.ceil(n/2),ECOL.dust,1.4,8,sp?sp*0.4:70);eChunks(x,y,h||0.3,Math.ceil(n/5),(sp||200)*0.8,6,0.2);}
// คลื่นกระแทก (วงสว่างขยายเร็ว + วงฝุ่น) — ใช้ตอนต่อย/ทุบ/ปา
function eWave(x,y,h,r,col){ring(x,y,col||'#ffe0a0',r,0.35,h||0.2);later(0.06,()=>ring(x,y,ECOL.dust,r*1.25,0.5,(h||0.2)+0.05));SHAPES_Q.push({k:'ringv',x,y,h:(h||0.2)+1.2,col:col||'#fff0c8',s1:r*S3*0.5,life:0.25,op:0.6});}
// คลื่นกระแทกกลางอากาศ (แผ่นวงหันตามทิศปา)
function eAirWave(pos,dir,sc,col,op){const O=op||0.6,m=new THREE.Mesh(new THREE.RingGeometry(0.6,1,48),new THREE.MeshBasicMaterial({color:hdr(col||'#ffe2a0',1.1),transparent:true,opacity:O,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  m.position.copy(pos);m.lookAt(pos.clone().add(dir));scene.add(m);eAnim({g:m,life:0.3,fn(a){const k=a.t/0.3;m.scale.setScalar((0.5+k*3.5)*(sc||1));m.material.opacity=O*(1-k);}});}
// ระเบิดตอนหมัดโดนกลางแผ่นหิน: แฟลชขาว + ลูกไฟส้ม + คลื่นกระแทกวงใหญ่ (หน้า/หลังแผ่น) + ประกายพุ่งรอบ + เศษหินกระเด็นจากขอบแผ่น + จอสั่น
function esbImpact(P,c,sn,a,mine,ox,oy){const q=simOf(P),h=q.h,d=new THREE.Vector3(c,0,sn);
  FX.flashSprite(q.x,q.y,h,'#ffffff',0.5,3,0.09,2.4);FX.flashSprite(q.x,q.y,h,'#ffb04a',0.8,4.2,0.24,1.8);FX.flashLight(q.x,q.y,h,'#ffcf6a',4.5,16,0.22);
  eAirWave(P.clone().addScaledVector(d,0.3),d,0.9,'#fff0c8',0.85);later(0.05,()=>eAirWave(P.clone().addScaledVector(d,0.9),d,1.25,'#ffd890',0.5));eAirWave(P.clone().addScaledVector(d,-0.3),d.clone().negate(),0.55,'#ffe2a0',0.45);
  burst(q.x,q.y,'#fff4d0',34,420,0.3,2.4,{h,vh:[-3,3],g:2,sh:2,c2:'#ffb060'});burst(q.x,q.y,ECOL.glow,18,240,0.45,2.8,{h,vh:[-2,4],g:3,c2:'#ff8a3a'});
  burst(q.x,q.y,ECOL.dust,20,300,0.6,3.4,{h,a,spread:1.2,g:4});smoke(q.x,q.y,h-0.5,8,ECOL.dust,1.1,9,140);
  eChunks(q.x,q.y,h,16,360,7,0.26);eWave(q.x,q.y,0.3,75);
  const me=myPos(),D=me?Math.hypot(me.x-ox,me.y-oy):1e9;shake(mine?1.6:D<400?1:D<800?0.4:0);if(mine)hitStop(0.06);}
// ---------- event "efx" ของสายดิน (เรียกจากต้น efxFX) — คืน true = จัดการแล้ว ----------
function earthEfx(ev){
  const z=ev.z,x=ev.x,y=ev.y,H=ev.h!==undefined?ev.h:0,me=myPos(),near=!me||Math.hypot(x-me.x,y-me.y)<1100,mine=ev.id===NET.myId;
  switch(z){
    case 'epunch':{const s=eState(ev.id);s.pn={t:0,x,y,h:H,x2:ev.x2,y2:ev.y2};later(0.22,()=>{burst(ev.x2,ev.y2,ECOL.dust,8,120,0.4,2.5,{h:H+1.3,g:2});ring(ev.x2,ev.y2,'#ffe0a0',40,0.2,H+1.2);if(near)snd('hit',{x:ev.x2,y:ev.y2,vol:0.5});});if(near)snd('whoosh',{x,y,vol:0.35});return true;}
    case 'estdbreak':eDebris(x,y,H,30,260);shake(0.3);if(near)snd('break',ev);return true;
    case 'estdon':burst(x,y,ECOL.glow,20,140,0.8,2.6,{h:H+1.5,g:-0.5});ring(x,y,ECOL.glow,80,0.5,H+0.2);if(near)snd('buff',{x,y,vol:0.5});return true;
    case 'erampon':{const s=eState(ev.id);s.rT=0;s.rs=-1;s.stp=0;}smoke(x,y,0.3,10,ECOL.dust,1.2,9,100);eChunks(x,y,0.3,6,180,5,0.2);if(near)snd('whoosh',ev);return true;
    case 'erampoff':smoke(x,y,0.3,6,ECOL.dust,1,7,60);return true;
    // จบ Rampage: Stand ทุบสองหมัดลงพื้น (ท่าใน standRun) → หมัดถึงพื้น 0.06 วิ: ฝุ่น/เศษหินใหญ่ คลื่น 2 ชั้น หินแหลมพุ่งรอบวง รอยร้าวเรือง แสงวาบ จอสั่นตามระยะ
    case 'eslam':{const s=eState(ev.id);s.rs=0;
      later(0.06,()=>{eDebris(x,y,0.3,64,ev.r*2.2);ring(x,y,'#ffe0a0',ev.r*1.25,0.35,0.2);ring(x,y,ECOL.glow,ev.r*0.7,0.25,0.25);SHAPES_Q.push({k:'ringv',x,y,h:1.2,col:'#ffe6b8',s1:ev.r*S3*0.4,life:0.22,op:0.35});later(0.07,()=>{ring(x,y,ECOL.dust,ev.r*2,0.6,0.3);smoke(x,y,0.4,16,ECOL.dust,2.6,15,ev.r*1.4);});
        fxPlay('start/stone_eruption',{x,y,h:0,s:1.45});dfCracks(x,y,0.06,ev.r*1.6,ECOL.glow,1.2);eSpikes(x,y,ev.r,11);
        SHAPES_Q.push({k:'decal',x,y,col:'#000000',s1:ev.r/18,life:4,op:0.7});smoke(x,y,0.4,18,ECOL.dust,2.2,13,ev.r*0.9);eChunks(x,y,0.4,16,340,10,0.3);
        burst(x,y,'#ffe6b0',14,ev.r*3.2,0.3,2,{h:0.8,vh:[0.5,3],g:1,sh:2,c2:'#b39a74'});FX.flashLight(x,y,1.5,'#ffcf6a',3.5,20,0.3);
        const d=me?Math.hypot(me.x-x,me.y-y):1e9;shake(mine?9:d<300?7:d<700?3.5:d<1100?1.2:0);if(near){snd('boom',ev);snd('break',ev);}});return true;}
    case 'erhit':eDebris(x,y,H,12,170);ring(x,y,'#ffe0a0',60,0.25,H+0.8);shake(0.25);if(near)snd('hit',ev);return true;
    case 'eboost':{const r=new THREE.Mesh(rockGeo(1.6,1.4,1.6,0.15),eTMat('wall'));r.position.copy(eW(x,y,-1));r.castShadow=true;scene.add(r);eAnim({g:r,life:0.6,fn(a){const k=a.t/0.6;r.position.y=GY(x,y)-1+Math.sin(Math.min(1,k*2)*Math.PI/2)*1.6;r.rotation.y+=0.1;if(k>0.6)r.scale.setScalar(1-(k-0.6)/0.4);}});
      eDebris(x,y,0.3,18,150);if(near)snd('boom',{x,y,vol:0.5});return true;}
    // ----- BA ชาร์จ -----
    case 'ecbon':smoke(x,y,0.3,6,ECOL.dust,1,7,50);if(near)snd('buff',{x,y,vol:0.35});return true;
    case 'ecboff':{const s=EV.st.get(ev.id);if(s)s.gSlam=0;return true;}
    case 'ecbslam':{const s=eState(ev.id),o=PM3.get(ev.id);s.gSlam=0.7;if(o)o.wdT=0.25;
      later(0.1,()=>{eDebris(x,y,0.3,50,ev.r*2);eWave(x,y,0.2,ev.r*1.15);fxPlay('earth/cbslam',{x,y,h:0,s:ev.r/180});smoke(x,y,0.5,22,ECOL.dust,2.4,13,ev.r*0.9);
        SHAPES_Q.push({k:'decal',x,y,col:'#000000',s1:ev.r/22,life:4,op:0.7});eChunks(x,y,0.3,14,260,8,0.3);FX.flashLight(x,y,1,'#ffcf6a',3,14,0.25);shake(near?0.7:0.2);if(near)snd('boom',ev);});return true;}
    // ----- Stonebreaker: งัดแผ่นหิน → Stand ต่อย (รอยร้าว + คลื่นกระแทก) → แผ่นพุ่ง -----
    case 'esbcast':{const a=ev.a,c=Math.cos(a),sn=Math.sin(a),sx=x+c*60,sy=y+sn*60,s=eState(ev.id),sl=makeSlab(false);sl.position.copy(eW(sx,sy,H-1.5));sl.rotation.y=Math.atan2(c,sn);scene.add(sl);
      eDebris(sx,sy,0.2,14,120);
      later(0.07,()=>{s.pn={t:0,x:x-c*12,y:y-sn*12,h:H,x2:sx,y2:sy,pk:1};});   // หมัดโดนกลางแผ่นตอน 0.07+0.29 = 0.36 วิ
      eAnim({g:sl,life:0.46,fn(an){const k=Math.min(1,an.t/0.2);sl.position.copy(eW(sx,sy,lerp(H-1.5,H+2.0,1-Math.pow(1-k,3))));
        if(an.cr)sl.position.add(new THREE.Vector3(rnd(-1,1),rnd(-1,1),rnd(-1,1)).multiplyScalar(0.07*Math.max(0,1-(an.t-0.36)/0.1)));   // แผ่นสั่นตอนโดน
        if(an.t>=0.36&&!an.cr){an.cr=1;slabCracks(sl);esbImpact(sl.position.clone(),c,sn,a,mine,x,y);if(near){snd('boom',{x,y,vol:0.9});snd('break',{x,y,vol:0.7});}}}});
      return true;}
    case 'esbhit':eDebris(x,y,H,34,260);eWave(x,y,H,90);playFx('earth_impact',x,y,H,{s:1.3});eChunks(x,y,H+1,12,320,6,0.32);FX.flashLight(x,y,H+1,'#ffcf6a',3,12,0.2);shake(0.4);if(near)snd('break',ev);return true;
    case 'esbwall':eDebris(x,y,H,26,240);ring(x,y,'#ffd86b',70,0.4,H);burst(x,y,'#ffe7a0',12,120,0.6,2.2,{h:H+0.8,g:0});shake(0.4);if(near)snd('boom',ev);return true;
    // ----- Tectonic Crush -----
    case 'ewallup':shake(0.35);if(near)snd('boom',ev);return true;
    case 'ecrushw':{const G=makeStand(3.2,true);EV.crush.push({t:0,x,y,a:ev.a,id:ev.id,G});eAppear(x+Math.cos(ev.a)*190,y+Math.sin(ev.a)*190,0,2.4);if(near)snd('buff',{x,y,vol:0.5});return true;}
    case 'ecrush':{const C=EV.crush.find(q=>!q.boom&&Math.hypot(q.x-x,q.y-y)<80);if(C)C.boom=C.t;
      const c=Math.cos(ev.a),s=Math.sin(ev.a);for(let i=-3;i<=3;i++)eDebris(x+c*i*45,y+s*i*45,1+rnd(0,3),10,200);eWave(x,y,0.3,240);eChunks(x,y,2,22,360,8,0.35);
      smoke(x,y,0.5,24,ECOL.dust,2.2,13,180);fxPlay('start/stone_eruption',{x,y,h:0,s:1.1});FX.flashLight(x,y,2,'#ffcf6a',4,18,0.25);shake(ev.n>=2?0.8:0.5);if(near){snd('boom',ev);snd('break',ev);}return true;}
    case 'ecrushno':case 'enostand':floatText(x,y,z==='enostand'?'Stand แตกอยู่!':'กำแพงพังหมดแล้ว','#ffcf6a',15,H);return true;
    case 'ehitw':burst(x,y,ECOL.dust,4,80,0.4,2,{h:H,g:5});return true;
    case 'ebreakw':{const n=ev.n===1?30:ev.n===2?20:30;if(ev.n===0){for(let i=0;i<=4;i++)eDebris(lerp(ev.x1,ev.x2,i/4),lerp(ev.y1,ev.y2,i/4),rnd(1,4),8,160);}else eDebris(x,y,ev.n===1?3:0.8,n,220);if(near)snd('break',ev);return true;}
    // ----- Dust Burst: ก้อนหินเหลี่ยม ๆ รวมตัวขึ้นมาสูงระดับหัว → Stand บีบ (หินเล็กลง มีแสง) → ฟุ้งเป็นฝุ่น -----
    case 'edustup':{const st=ev.n,rk=new THREE.Group(),m=eTMat('wall');m.emissive=new THREE.Color('#ff9a3a');m.emissiveIntensity=0;
      for(let i=0;i<8;i++){const b=new THREE.Mesh(rockGeo(rnd(0.5,0.9),rnd(0.5,0.9),rnd(0.5,0.9),0.18),m);b.position.set(rnd(-0.45,0.45),rnd(-0.45,0.45),rnd(-0.45,0.45));b.rotation.set(rnd(0,3),rnd(0,3),rnd(0,3));b.castShadow=true;rk.add(b);}
      rk.position.copy(eW(x,y,-1));scene.add(rk);eDebris(x,y,0.2,12,110);
      const dx=ev.x2-x,dy=ev.y2-y,dl=Math.hypot(dx,dy)||1,G=st?makeStand(1.1,false):null;
      // 0–0.3 หินลอยขึ้นระดับหัว • 0.3–0.4 Stand โผล่ • 0.4–0.65 บีบแรง (หินหดเร็ว สั่น ฝุ่นพ่น) • 0.65–1.1 บีบค้าง หินเรืองขึ้นเรื่อย ๆ • 1.1 ฟุ้งเป็นฝุ่น (host)
      eAnim({g:rk,life:1.12,end(){if(G)disposeObj(G.g);},fn(a){const t=a.t,up=Math.min(1,t/0.28);rk.position.copy(eW(x,y,lerp(-1,1.9,1-Math.pow(1-up,3))));rk.rotation.y+=0.03;
        const hard=t<0.4?0:Math.min(1,(t-0.4)/0.25),hold=t<0.65?0:Math.min(1,(t-0.65)/0.45);rk.scale.setScalar(1-0.25*(1-Math.pow(1-hard,2))-0.06*hold);m.emissiveIntensity=hard*0.5+hold*1.4;
        if(hard>0){const j=(hard<1?0.09:0.035)*(st?1:0.6);rk.position.x+=rnd(-1,1)*j;rk.position.y+=rnd(-1,1)*j;if(hard<1&&Math.random()<0.6)burst(x,y,ECOL.dust,2,90,0.5,2.2,{h:1.9,g:1,smoke:true,grow:1.3});if(Math.random()<0.3)burst(x,y,ECOL.glow,1,40,0.3,1.6,{h:1.9,g:0});}
        if(G){const k=t<0.3?0:Math.min(1,(t-0.3)/0.1);standOp(G,t>1.06?Math.max(0,1-(t-1.06)/0.06):k);G.g.position.copy(eW(x+dx/dl*42,y+dy/dl*42,0.1));G.g.rotation.y=eYaw(x+dx/dl*42,y+dy/dl*42,x,y);standPose(G,{t,squeeze:Math.min(1,hard*1.2),lean:0.15*hard});if(k>0&&!a.ap){a.ap=1;eAppear(x+dx/dl*42,y+dy/dl*42,0,1);}
          if(hard>0&&hard<1&&!a.sq){a.sq=1;shake(mine?0.15:0.05);if(near)snd('hit',{x,y,vol:0.4});}}}});
      if(!st){const o=PM3.get(ev.id);if(o)o.wdT=0.25;}
      return true;}
    case 'edust':{const w=ev.n?1:0.6;smoke(x,y,1.5,Math.round(32*w),ECOL.dust,2.4,15,ev.r*0.9);burst(x,y,'#d8c098',Math.round(22*w),ev.r,1.2,4,{h:2,g:1,smoke:true,grow:2});eWave(x,y,1.5,ev.r*0.9,'#e8d4a8');
      FX.flashLight(x,y,1.9,'#ffcf6a',2.5*w,10,0.2);eChunks(x,y,1.9,Math.round(10*w),220,3,0.12);shake(0.25);if(near)snd('boom',ev);return true;}
    // ----- Terra Auger -----
    case 'eaugon':smoke(x,y,0.3,6,ECOL.dust,1,6,40);return true;
    case 'eaugoff':{const s=EV.st.get(ev.id);if(s&&s.drill&&s.drill.visible){const q=simOf(s.drill.position);eChunks(q.x,q.y,q.h-GY(q.x,q.y),6,100,2,0.08);}return true;}
    case 'eaugfire':{const s=EV.st.get(ev.id),o=PM3.get(ev.id);if(o)o.wdT=0.25;const from=s&&s.drill&&s.drill.visible?s.drill.position.clone():eW(ev.x2,ev.y2,4);eDrillFly(from,x,y,ev.n);eWindOut(from,eW(x,y,0),ev.n);
      ring(x,y,'#ff9a4a',ev.r,0.4,0.15);if(near)snd('whoosh',ev);return true;}
    case 'eaugboom':{const n=ev.n;eDebris(x,y,0.3,16+n*14,ev.r*2);playFx(n===3?'earth_big':'earth_impact',x,y,0.4,{s:ev.r/100});eWave(x,y,0.2,ev.r);
      SHAPES_Q.push({k:'decal',x,y,col:'#000000',s1:ev.r/26,life:5,op:0.75});eChunks(x,y,0.3,6+n*4,240,7,0.24);if(n>=2)FX.flashLight(x,y,0.8,'#ff7a2a',2+n,12,0.3);
      if(n===2){const m=new THREE.Mesh(new THREE.SphereGeometry(ev.r*S3*0.7,8,5,0,Math.PI*2,0,Math.PI/2),eTMat('wall'));m.scale.y=0.25;m.position.copy(eW(x,y,0));scene.add(m);eAnim({g:m,life:4,fn(a){if(a.t>3)m.scale.y=0.25*(1-(a.t-3));}});}
      shake(0.2+n*0.15);if(near)snd('boom',ev);return true;}
    // ----- Wrath -----
    case 'ewrath':smoke(x,y,0.3,20,ECOL.dust,1.6,10,120);burst(x,y,ECOL.glow,24,200,1,3,{h:1,vh:[3,8],g:-2});eChunks(x,y,0.3,10,200,10,0.25);shake(0.4);if(near)snd('buff',ev);return true;
    case 'epilthrow':{const s=eState(ev.id),o=PM3.get(ev.id);if(o)o.wdT=0.25;s.ugT=0;
      const from=s.pil&&s.pil.visible?s.pil.position.clone():eW(x,y,H+3),to=eW(ev.x2,ev.y2,0),dir=to.clone().sub(from).normalize(),P=makePillar();scene.add(P);
      eAirWave(from.clone().addScaledVector(dir,2),dir,1.3);eAirWave(from.clone().addScaledVector(dir,4.5),dir,0.85);const q=simOf(from);burst(q.x,q.y,'#ffe0a0',18,240,0.4,2.2,{h:q.h,g:0});FX.flashLight(q.x,q.y,q.h,'#ffe0a0',2.5,14,0.25);
      eAnim({g:P,life:0.45,fn(a){const k=Math.min(1,a.t/0.45);P.position.copy(from).lerp(to,k*k);P.lookAt(to);const w=simOf(P.position);if(Math.random()<0.8)burst(w.x,w.y,ECOL.dust,2,40,0.5,3,{h:w.h,g:0,smoke:true,grow:1.5});}});
      if(near)snd('whoosh',{x,y,vol:0.8});shake(mine?0.4:0.1);return true;}
    case 'epilland':{eDebris(x,y,0.3,60,320);playFx('earth_big',x,y,0.4,{s:1.5});eWave(x,y,0.2,260);later(0.1,()=>eWave(x,y,0.2,380,ECOL.dust));later(0.22,()=>ring(x,y,'#7a5a38',420,0.7,0.1));
      eChunks(x,y,0.5,26,420,10,0.4);FX.flashLight(x,y,2,'#ffcf6a',5,22,0.35);SHAPES_Q.push({k:'decal',x,y,col:'#000000',s1:7,life:8,op:0.7});
      for(let i=0;i<26;i++){const a=rnd(0,6.283),r=rnd(40,260);smoke(x+Math.cos(a)*r,y+Math.sin(a)*r,rnd(0.3,3),1,i%2?ECOL.dust:'#c9b38c',rnd(3,5),rnd(12,20),30);}
      shake(near?1:0.3);if(near){snd('boom',ev);snd('break',ev);}return true;}
    case 'ewland':eDebris(x,y,0.3,30,260);playFx('earth_impact',x,y,0.4,{s:1.2});shake(0.5);if(near)snd('boom',ev);return true;
    case 'ewdrill':{const s=EV.st.get(ev.id);let from=null;if(s&&s.drills[ev.n])from=s.drills[ev.n].position.clone();eDrillFly(from||eW(ev.x2,ev.y2,4),x,y,3);ring(x,y,'#ff9a4a',150,0.4,0.15);if(near)snd('whoosh',ev);return true;}
    case 'ewend':smoke(x,y,0.5,8,ECOL.dust,1.2,8,80);return true;
  }
  return false;}
// สว่านพุ่งเฉียงลงจากจุดลอยไปที่เป้า (หมุน + ความร้อนตามระดับ + ลมตามทาง)
// ลมออกตอนปล่อย: วงคลื่นลม 2 ชั้นตามทิศยิง + ลมพุ่งออกรอบตัวสว่าน + ฝุ่นเบา ๆ (แรงขึ้นตามระดับ)
// แหวกอากาศ: วงคลื่นจาง ๆ ตามทิศยิง + เส้นลมแตกออกด้านข้างตลอดแนวทางสั้น ๆ หน้าสว่าน
function eWindOut(from,to,tier){const dir=to.clone().sub(from).normalize(),w=simOf(from),n=tier||1,f2=simOf(from.clone().addScaledVector(dir,1)),dx=f2.x-w.x,dy=f2.y-w.y,dl=Math.hypot(dx,dy)||1,ux=dx/dl,uy=dy/dl;
  for(let i=0;i<12+n*6;i++){const k=rnd(0.3,4),px=w.x+ux*k*20,py=w.y+uy*k*20,sd=Math.random()<0.5?-1:1,sp=rnd(120,220);
    PARTS.push({x:px,y:py,h:w.h+rnd(-0.4,0.4)-(w.h-0.5)*k/6,vx:-uy*sd*sp+ux*60,vy:ux*sd*sp+uy*60,vh:rnd(-0.3,1.2),life:0.28,max:0.28,col:i%3?'#eef2f6':'#ffffff',size:rnd(1.3,2),g:0,drag:3,sh:2});}
  eAirWave(from.clone().addScaledVector(dir,1.6),dir,0.22+0.08*n,'#dfe6ee',0.35);later(0.05,()=>eAirWave(from.clone().addScaledVector(dir,3.4),dir,0.16+0.06*n,'#eef2f6',0.3));
  smoke(w.x,w.y,w.h,1+n,'#ece6da',0.7,4,40);}
// กรวยคลื่นอากาศครอบหัวสว่าน (แหวกอากาศตอนพุ่ง): กรวยเปิดโปร่งแสงชี้ไปข้างหน้า ปลายติดหัวสว่าน บานออกด้านหลัง
function eAirCone(){const m=new THREE.MeshBasicMaterial({color:hdr('#eef4fa',1.2),transparent:true,opacity:0.0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),
  c=new THREE.Mesh(new THREE.ConeGeometry(0.75,2,24,1,true),m);c.rotation.x=-Math.PI/2;c.position.z=0.9;c.userData.m=m;return c;}
function eDrillFly(from,x,y,tier){const d=makeDrill(),to=eW(x,y,0),ac=eAirCone();d.position.copy(from);d.add(ac);scene.add(d);
  eAnim({g:d,life:0.33,fn(a){const k=Math.min(1,a.t/0.32);d.position.copy(from).lerp(to,k*k);d.lookAt(to);ac.rotation.z=0;ac.userData.m.opacity=0.22*Math.min(1,a.t/0.06)*(1-k*0.5);ac.scale.set(1,1+k*0.6,1);d.children[0].rotation.y=a.t*80;drillHeat(d,tier,a.t);const w=simOf(d.position);
    burst(w.x,w.y,tier===3?'#ff6a2a':'#e8e4dc',1,30,0.25,tier===3?2.2:1.6,{h:w.h,g:0});
    for(let i=0;i<3;i++){const an=rnd(0,6.283);PARTS.push({x:w.x+Math.cos(an)*12,y:w.y+Math.sin(an)*12,h:w.h+rnd(-0.3,0.3),vx:Math.cos(an)*140,vy:Math.sin(an)*140,vh:rnd(-0.3,0.8),life:0.2,max:0.2,col:'#f4f6f8',size:1.5,g:0,drag:2,sh:2});}}});}   // อากาศแตกออกรอบตัวตามทาง
// ---------- บึงโคลน (Mud Swamp + บึงจากเสาอัลติ): คลื่นกระเพื่อมจากกลางไปขอบ แล้วพื้นกลายเป็นโคลน (ไม่ใช่วงเวท) ----------
function earthMudZone(ev){const x=ev.x,y=ev.y,r=ev.r,life=ev.t,R=r*S3;
  for(let i=0;i<3;i++)later(i*0.12,()=>ring(x,y,i?'#6b4c2c':'#a07a50',r*(0.6+i*0.25),0.55,0.08));
  const mt=new THREE.MeshStandardMaterial({map:eTex('mud'),color:'#ffffff',roughness:0.25,metalness:0.1,transparent:true,opacity:0,depthWrite:false});
  const m=new THREE.Mesh(new THREE.CircleGeometry(1,48),mt);m.rotation.x=-Math.PI/2;m.position.copy(eW(x,y,0.04));m.scale.setScalar(0.01);m.receiveShadow=true;scene.add(m);
  eAnim({g:m,life,fn(a){const k=Math.min(1,a.t/0.55);m.scale.setScalar(Math.max(0.01,R*(1-Math.pow(1-k,2))));mt.opacity=0.92*Math.min(1,a.t/0.3)*(a.t>life-0.6?Math.max(0,(life-a.t)/0.6):1);
    if(a.t>0.4&&Math.random()<r/500){const q=rnd(0,6.283),rr=r*Math.sqrt(Math.random())*0.9;ring(x+Math.cos(q)*rr,y+Math.sin(q)*rr,'#7a5a38',rnd(14,30),0.6,0.07);burst(x+Math.cos(q)*rr,y+Math.sin(q)*rr,'#6b4c2c',2,25,0.5,2,{h:0.1,vh:[1,2],g:6});}}});}
// ขาจมโคลน (สถานะ bit 524288)
function earthMudSink(o,fm,x,y){if(!(fm&524288))return;o.g.position.y-=0.45;if(Math.random()<0.15)burst(x+rnd(-12,12),y+rnd(-12,12),'#6b4c2c',1,25,0.5,2,{h:0.15,vh:[0.5,1.5],g:5});}
// ---------- HUD ใต้เป้าเล็ง ----------
function drawEarthHud(x,y,A,me){
  const y0=y+70;cx.textAlign='center';cx.font='600 15px Kanit,sans-serif';let row=0;
  const txt=(s,col)=>{const yy=y0+row*22;row++;cx.lineWidth=4;cx.strokeStyle='rgba(0,0,0,0.75)';cx.strokeText(s,x,yy);cx.fillStyle=col;cx.fillText(s,x,yy);};
  const arc=(k,col,r)=>{cx.lineWidth=6;cx.strokeStyle='rgba(0,0,0,0.6)';cx.beginPath();cx.arc(x,y,r,-Math.PI/2,Math.PI*1.5);cx.stroke();cx.strokeStyle=col;cx.beginPath();cx.arc(x,y,r,-Math.PI/2,-Math.PI/2+k*Math.PI*2);cx.stroke();};
  if(A[0]>0)txt('🪨 Stand แตก — กลับมาใน '+A[0]+' วิ','#ffb07a');
  if(me&&me.sh&&!A[0]){const w=150,k=Math.max(0,Math.min(1,A[7]/300)),yy=y0+row*22-10;row++;   // HP โล่ Stand
    cx.fillStyle='rgba(0,0,0,0.6)';cx.fillRect(x-w/2-2,yy-2,w+4,14);cx.fillStyle=k>0.35?'#e8c070':'#ff8a5a';cx.fillRect(x-w/2,yy,w*k,10);
    cx.font='600 12px Kanit,sans-serif';cx.lineWidth=3;cx.strokeStyle='rgba(0,0,0,0.8)';cx.strokeText('โล่ Stand '+A[7]+' / 300',x,yy+9);cx.fillStyle='#fff';cx.fillText('โล่ Stand '+A[7]+' / 300',x,yy+9);cx.font='600 15px Kanit,sans-serif';}
  if(A[9]>0){arc(Math.min(1,A[9]/2),'#ffcf6a',46);txt('Stand ใหญ่ชาร์จทุบ…','#ffcf6a');}
  if(A[2]>0){const t=A[2],tier=t>=4.5?3:t>=2?2:1;arc(Math.min(1,t/4.5),['#c9ccd2','#ffb24a','#ff5a2a'][tier-1],40);
    for(const m of [2/4.5,1]){const a=-Math.PI/2+m*Math.PI*2;cx.fillStyle='#fff';cx.fillRect(x+Math.cos(a)*40-2,y+Math.sin(a)*40-2,4,4);}
    txt('Terra Auger ระดับ '+tier,'#ffd86b');}
  if(A[3]===1)txt('🗿 Wrath: คลิก = ปาเสา • ขยับได้แค่ซ้าย/ขวา • เหลือ '+A[5]+' วิ','#ffd86b');
  else if(A[3]===3)txt('🗿 สว่าน '+A[4]+'/5 • คลิกซ้ายยิง • เหลือ '+A[6]+' วิ','#ffd86b');
  if(A[8])txt('Tectonic: กดอีกครั้ง = Crush!','#ff9a4a');
}
