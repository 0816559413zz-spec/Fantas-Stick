// =====================================================================
//  เมนูแรกแบบ "ลานดวลเวทใต้ดาว" (ผู้ใช้ 2026-10-22: "make the first lobby more unique … interact with the menu like play button, setting button")
//  ผู้ใช้เลือก: ฉาก = ลานดวลเวทใต้ดาว • คลิกของ = กล้องเลื่อนเข้าหา แล้วเมนูเปิด • ของที่ใช้ได้ = เล่น (คนเดียว/สร้างห้อง/เข้าร่วม) + ตั้งค่า/คู่มือ
//  ฉากแยก MENUS (ล็อบบี้ห้องโถง `stage` และหน้าสร้างตัวละครไม่เปลี่ยน) — ตัวละคร (me-preview) กับ STAGE.mfx (เอฟเฟกต์เมนูเดิม) ถูกย้ายเข้ามาตอนอยู่หน้าเมนู
//  ของในลาน (คลิกได้ เลื่อนเมาส์ = เรืองแสง + ชื่อ): 🌀 ประตูเวท = เล่น • 📖 หนังสือเวทบนแท่น = คู่มือ/สถิติ/เพลง • 🔮 ลูกแก้วดาราศาสตร์ = ตั้งค่า • ตัวละคร = แต่งตัว
//  ปุ่มเมนูธรรมดาเดิมยังอยู่เป็นทางสำรอง (ซ่อนไว้ กด "☰ เมนูปกติ") • ถ้าสร้างฉากพัง = กลับเมนูแบบเดิมเอง
//  ⚠ ตำแหน่ง/สี/ท่าทางของทุกอย่าง Claude ออกแบบเอง
// =====================================================================
const MENUS=new THREE.Scene();
MENUS.background=new THREE.Color('#04050d');MENUS.fog=new THREE.Fog('#070a1c',24,80);
const MN={built:false,enabled:true,hits:[],hot:null,focus:null,fT:0,popFor:'',cam:{p:new THREE.Vector3(),l:new THREE.Vector3(),init:false},fx:{},ray:new THREE.Raycaster(),nav:false,shoot:{t:-1,x:0,y:0,z:0},rp:null};
const _mv=new THREE.Vector3();
function mnCrest(c,e){return texCanvas(128,320,g=>{g.fillStyle=c;g.fillRect(0,0,128,320);g.fillStyle='#d9b45a';g.fillRect(0,0,128,7);g.fillRect(0,0,7,320);g.fillRect(121,0,7,320);
  g.beginPath();g.moveTo(14,110);g.lineTo(114,110);g.lineTo(114,190);g.quadraticCurveTo(114,250,64,276);g.quadraticCurveTo(14,250,14,190);g.closePath();g.fillStyle='rgba(0,0,0,.3)';g.fill();g.lineWidth=5;g.strokeStyle='#d9b45a';g.stroke();
  g.font='64px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(e,64,190);});}
function mnBuild(){
  if(MN.built)return;MN.built=true;const S=MENUS,V=THREE.Vector3;
  const gold=new THREE.MeshStandardMaterial({color:'#d9b45a',metalness:0.9,roughness:0.28,emissive:'#3a2a08'}),stone=stoneMat(1,4,'#6a6884'),dark=new THREE.MeshStandardMaterial({color:'#1a1626',roughness:0.9});
  const hit=(w,h,d,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));m.position.set(x,y,z);return m;};
  // ---- แสง ----
  S.add(new THREE.HemisphereLight('#6f86e0','#1a1410',0.55),new THREE.AmbientLight('#2a2c52',0.5));
  const key=new THREE.SpotLight('#ffe0a8',2.1,45,0.55,0.7,1);key.position.set(1.5,14,9);key.target.position.set(0,0.4,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-0.0008;S.add(key,key.target);
  const rim=new THREE.DirectionalLight('#7f9cff',0.9);rim.position.set(-6,8,-12);S.add(rim);
  // ---- พื้นลาน + วงดวลเวท ----
  const grass=new THREE.Mesh(new THREE.CircleGeometry(90,40),new THREE.MeshStandardMaterial({color:'#0c1410',roughness:1}));grass.rotation.x=-Math.PI/2;grass.position.y=-0.03;S.add(grass);
  const plaza=new THREE.Mesh(new THREE.CircleGeometry(26,64),stoneMat(16,16,'#3a3e58'));plaza.rotation.x=-Math.PI/2;plaza.receiveShadow=true;S.add(plaza);
  const goldL=new THREE.MeshBasicMaterial({color:hdr('#d9b45a',0.85)});
  for(const [r,w] of [[7,0.07],[10.5,0.05],[14,0.05]]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,w,6,120),goldL);t.rotation.x=Math.PI/2;t.position.y=0.02;S.add(t);}
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2,l=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.02,7),goldL);l.position.set(Math.cos(a)*10.5,0.015,Math.sin(a)*10.5);l.rotation.y=-a+Math.PI/2;S.add(l);}   // เส้นรัศมีของวงดวล
  const dais=new THREE.Mesh(new THREE.CylinderGeometry(4.1,4.4,STAGE_Y,64),stoneMat(5,1,'#6c6c8c'));dais.position.y=STAGE_Y/2;dais.receiveShadow=true;S.add(dais);
  for(const r of [4.12,3.6]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,r>4?0.06:0.03,8,96),gold);t.rotation.x=Math.PI/2;t.position.y=STAGE_Y+0.005;S.add(t);}
  const rune=new THREE.Mesh(new THREE.CircleGeometry(3.5,64),new THREE.MeshBasicMaterial({map:runeTex,color:hdr('#e8c66a',1.3),transparent:true,opacity:0.4,depthWrite:false,blending:THREE.AdditiveBlending}));rune.rotation.x=-Math.PI/2;rune.position.y=STAGE_Y+0.012;S.add(rune);MN.fx.rune=rune;
  // ---- เสาหินพัง + ซุ้มโค้ง วงครึ่งวงด้านหลัง ----
  const P=[],HC=['#8a1c1c','#1c3f8a','#1f6a38','#9a7a12'],HE=['🦁','🦅','🐍','🦡'];MN.fx.orbs=[];
  for(let i=0;i<9;i++){const a=Math.PI*(0.08+0.84*i/8),x=Math.cos(a)*17,z=-Math.sin(a)*17+3,tall=i<8,H=tall?11:5.5;P.push([x,z,H]);
    const col=new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.9,H,12),stone);col.position.set(x,H/2,z);S.add(col);
    const b=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.2,0.5,12),stone);b.position.set(x,0.25,z);S.add(b);
    if(tall){const cap=new THREE.Mesh(new THREE.CylinderGeometry(1.05,0.7,0.6,12),stone);cap.position.set(x,H+0.1,z);S.add(cap);}
    else{const r=new THREE.Mesh(new THREE.DodecahedronGeometry(0.9,0),stone);r.position.set(x,H+0.2,z);r.scale.set(1,0.7,1);r.rotation.set(0.4,i,0.3);S.add(r);const rb=new THREE.Mesh(new THREE.DodecahedronGeometry(0.6,0),stone);rb.position.set(x+2,0.3,z+1.4);S.add(rb);}
    if(tall){const o=new THREE.Sprite(glowMat(HC[i%4],2.2));o.scale.setScalar(1.5);o.position.set(x,H+1.7,z);S.add(o);MN.fx.orbs.push({o,y:H+1.7,ph:i});}   // ลูกแสงรูนลอยบนเสา
  }
  for(let i=0;i<8;i+=2){const A=P[i],B=P[i+1],dx=B[0]-A[0],dz=B[1]-A[1],d=Math.hypot(dx,dz),ar=new THREE.Mesh(new THREE.TorusGeometry(d/2-0.1,0.34,8,28,Math.PI),stone);ar.position.set((A[0]+B[0])/2,A[2]+0.3,(A[1]+B[1])/2);ar.rotation.y=-Math.atan2(dz,dx);S.add(ar);}
  // ---- ธงบ้านบนเสา ----
  [[1,3],[3,2],[5,1],[7,0]].forEach(([i,h])=>{const p=P[i],m=new THREE.Mesh(new THREE.PlaneGeometry(1.8,5),new THREE.MeshStandardMaterial({map:mnCrest(HC[h],HE[h]),roughness:0.9,side:THREE.DoubleSide}));m.position.set(p[0]*0.93,7.6,p[1]*0.93+1.0);m.lookAt(0,7.6,10);S.add(m);});
  // ---- กระถางไฟ 4 ใบ ----
  MN.fx.flames=[];const iron=new THREE.MeshStandardMaterial({color:'#2a2a34',metalness:0.7,roughness:0.5});
  for(const [x,z] of [[-7.5,-1.5],[7.5,-1.5],[-5,5.5],[5.5,5.5]]){
    const g=new THREE.Group(),bowl=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.28,0.45,12),iron);bowl.position.y=1.25;g.add(bowl);
    for(let k=0;k<3;k++){const a=k/3*Math.PI*2,lg=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.05,1.3,6),iron);lg.position.set(Math.cos(a)*0.32,0.62,Math.sin(a)*0.32);lg.rotation.set(Math.sin(a)*0.18,0,-Math.cos(a)*0.18);g.add(lg);}
    const f1=new THREE.Sprite(glowMat('#ff8a2a',2.6));f1.scale.set(1.2,1.9,1);f1.position.y=1.9;g.add(f1);const f2=new THREE.Sprite(glowMat('#ffd27a',2.8));f2.scale.set(0.6,1.0,1);f2.position.y=1.8;g.add(f2);
    MN.fx.flames.push({a:f1,b:f2,ph:Math.random()*6});
    if(x<0&&z<0||x>0&&z>0){const L=new THREE.PointLight('#ff9a4a',1.0,11,2);L.position.set(0,2.2,0);g.add(L);}
    g.position.set(x,0,z);S.add(g);}
  // ---- ท้องฟ้า: ดาว + ทางช้างเผือก + จันทร์ + เนบิวลา ----
  {const n=1500,pos=new Float32Array(n*3);for(let i=0;i<n;i++){let a,e;if(i<420){const u=Math.random()*Math.PI*2,w=(Math.random()+Math.random()-1)*0.12;a=u;e=0.5+Math.sin(u*1.0)*0.35+w;}else{a=Math.random()*Math.PI*2;e=0.05+Math.random()*1.45;}
      const r=120;pos[i*3]=Math.cos(a)*Math.cos(e)*r;pos[i*3+1]=Math.sin(e)*r;pos[i*3+2]=Math.sin(a)*Math.cos(e)*r-30;}
    const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const st=new THREE.Points(gg,new THREE.PointsMaterial({map:glowTex,color:hdr('#dfe8ff',1.7),size:1.5,transparent:true,opacity:0.92,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));S.add(st);MN.fx.stars=st;
    const moon=new THREE.Sprite(glowMat('#cfe0ff',2.8));moon.scale.set(22,22,1);moon.position.set(-38,62,-85);moon.material.fog=false;S.add(moon);
    for(const [c,x,y,z,s] of [['#5a3ea8',40,48,-90,60],['#1f6a8a',-60,36,-70,50],['#8a2a6a',10,70,-100,46]]){const n2=new THREE.Sprite(glowMat(c,0.55));n2.scale.set(s,s*0.6,1);n2.position.set(x,y,z);n2.material.fog=false;n2.material.opacity=0.35;S.add(n2);}
    MN.fx.shoot=new THREE.Sprite(glowMat('#ffffff',3));MN.fx.shoot.scale.set(10,0.5,1);MN.fx.shoot.visible=false;MN.fx.shoot.material.fog=false;S.add(MN.fx.shoot);}
  // ---- หมอกต่ำ + หิ่งห้อย/โคมลอย ----
  MN.fx.mist=[];for(let i=0;i<9;i++){const m=new THREE.Sprite(glowMat('#5a6ac0',0.5));m.scale.set(16,3.2,1);m.position.set(rnd(-18,18),0.5,rnd(-14,6));m.material.opacity=0.16;m.material.fog=false;S.add(m);MN.fx.mist.push({m,x:m.position.x,ph:Math.random()*6});}
  {const n=90,pos=new Float32Array(n*3),seed=[];for(let i=0;i<n;i++){seed.push([rnd(-14,14),rnd(0.3,9),rnd(-14,8),Math.random()*6,rnd(0.2,0.6)]);}
    const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    MN.fx.fly={pts:new THREE.Points(fg,new THREE.PointsMaterial({map:glowTex,color:hdr('#ffe9a0',1.8),size:0.16,transparent:true,opacity:0.85,depthWrite:false,blending:THREE.AdditiveBlending})),seed,pos};S.add(MN.fx.fly.pts);}
  // =============== ของที่คลิกได้ ===============
  // 1) ประตูเวท (เล่น) — ซ้ายด้านหลัง
  {const g=new THREE.Group(),sw=texCanvas(256,256,c=>{const r=c.createRadialGradient(128,128,4,128,128,128);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(0.25,'rgba(150,120,255,.95)');r.addColorStop(0.7,'rgba(60,200,220,.7)');r.addColorStop(1,'rgba(30,60,140,0)');c.fillStyle=r;c.fillRect(0,0,256,256);
      c.lineWidth=5;for(let k=0;k<6;k++){c.beginPath();for(let t=0;t<40;t++){const a=k*Math.PI/3+t*0.14,rr=6+t*3;c.lineTo(128+Math.cos(a)*rr,128+Math.sin(a)*rr);}c.strokeStyle=`rgba(255,255,255,${0.55-k*0.04})`;c.stroke();}});
    for(const sx of [-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(0.8,5.4,0.9),stone);p.position.set(sx*1.95,2.7,0);g.add(p);const cp=new THREE.Mesh(new THREE.BoxGeometry(1.05,0.35,1.15),stone);cp.position.set(sx*1.95,5.5,0);g.add(cp);const rb=new THREE.Mesh(new THREE.BoxGeometry(0.1,3.6,0.1),new THREE.MeshBasicMaterial({color:hdr('#9fe8ff',1.6)}));rb.position.set(sx*1.57,2.7,0.5);g.add(rb);}
    const top=new THREE.Mesh(new THREE.TorusGeometry(1.95,0.42,10,36,Math.PI),stone);top.position.set(0,5.3,0);g.add(top);
    const keyst=new THREE.Mesh(new THREE.OctahedronGeometry(0.4,0),gold);keyst.position.set(0,7.3,0.2);g.add(keyst);
    const disc=new THREE.Mesh(new THREE.CircleGeometry(1.75,48),new THREE.MeshBasicMaterial({map:sw,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:hdr('#ffffff',1.4)}));disc.position.set(0,3.4,0.08);disc.scale.y=1.55;g.add(disc);MN.fx.portal=disc;
    const rings=[];for(const [r,c] of [[1.6,'#9fe8ff'],[1.3,'#b49bff']]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,0.03,6,48),new THREE.MeshBasicMaterial({color:hdr(c,1.8),transparent:true,opacity:0.8}));t.position.set(0,3.4,0.1);t.scale.y=1.55;g.add(t);rings.push(t);}MN.fx.pRings=rings;
    const gl=new THREE.Sprite(glowMat('#9a8cff',1.8));gl.scale.set(7,9,1);gl.position.set(0,3.4,0.3);g.add(gl);MN.fx.pGlow=gl;
    const L=new THREE.PointLight('#8a9cff',2.4,16,2);L.position.set(0,3.2,2);g.add(L);MN.fx.pLight=L;
    g.position.set(-7.4,0,-2.0);g.rotation.y=0.5;S.add(g);
    const h=hit(4.6,7.4,2.2,-7.4,3.7,-2.0);h.rotation.y=0.5;S.add(h);MN.hits.push({id:'play',mesh:h,icon:'🌀',name:'ประตูเวท',sub:'เล่น',anchor:new V(-7.4,8.0,-2.0),glow:[gl],base:7,cam:[-6.2,3.3,4.6],look:[-4.0,3.3,-2.0]});}
  // 2) หนังสือเวทบนแท่นอ่าน (คู่มือ/สถิติ/เพลง) — หน้าซ้าย
  {const g=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:'#4a2e1a',roughness:0.8});
    const post=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.5,1.25,4),wood);post.position.y=0.62;post.rotation.y=Math.PI/4;g.add(post);
    const bd=new THREE.Mesh(new THREE.BoxGeometry(1.55,0.12,1.0),wood);bd.position.y=1.32;bd.rotation.x=-0.45;g.add(bd);
    const page=texCanvas(128,160,c=>{c.fillStyle='#efe0bc';c.fillRect(0,0,128,160);c.strokeStyle='rgba(90,60,20,.55)';c.lineWidth=1.5;for(let y=30;y<150;y+=11){c.beginPath();c.moveTo(14,y);c.lineTo(114-((y*7)%30),y);c.stroke();}c.fillStyle='#b8862a';c.font='22px serif';c.textAlign='center';c.fillText('✦',64,20);});
    const bk=new THREE.Group();const pm=new THREE.MeshStandardMaterial({map:page,roughness:0.9,side:THREE.DoubleSide,emissive:'#3a2a10',emissiveIntensity:0.6});
    for(const sx of [-1,1]){const pg=new THREE.Mesh(new THREE.PlaneGeometry(0.78,1.0),pm);pg.position.set(sx*0.4,0,0);pg.rotation.set(-1.05,0,sx*-0.22);bk.add(pg);}
    const sp=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,1.0),gold);sp.rotation.x=-1.05;bk.add(sp);
    const flip=new THREE.Mesh(new THREE.PlaneGeometry(0.78,1.0),pm);flip.position.x=0;flip.geometry.translate(0.39,0,0);bk.add(flip);MN.fx.flip=flip;
    bk.position.set(0,2.0,0);g.add(bk);MN.fx.book=bk;
    const gl=new THREE.Sprite(glowMat('#ffd98a',1.7));gl.scale.set(3.8,3.0,1);gl.position.set(0,2.1,0.1);g.add(gl);MN.fx.bGlow=gl;
    MN.fx.runes=[];for(let i=0;i<6;i++){const r=new THREE.Sprite(glowMat(i%2?'#9fe8ff':'#ffd98a',2.2));r.scale.setScalar(0.22);g.add(r);MN.fx.runes.push({r,ph:i/6*6.283});}
    g.position.set(-3.3,0,3.0);g.rotation.y=0.25;S.add(g);
    const h=hit(2.0,2.4,1.6,-3.3,1.6,3.0);S.add(h);MN.hits.push({id:'book',mesh:h,icon:'📖',name:'หนังสือเวท',sub:'คู่มือ • สถิติ • เพลง',anchor:new V(-3.3,3.5,3.0),glow:[gl],base:3.8,cam:[-2.4,2.7,7.4],look:[-0.6,2.1,3.0]});}
  // 3) ลูกแก้วดาราศาสตร์ (ตั้งค่า) — ขวาด้านหลัง
  {const g=new THREE.Group();
    const ped=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.85,1.3,10),stone);ped.position.y=0.65;g.add(ped);const pc=new THREE.Mesh(new THREE.CylinderGeometry(0.75,0.55,0.18,10),gold);pc.position.y=1.38;g.add(pc);
    const sph=new THREE.Group();sph.position.y=2.7;g.add(sph);MN.fx.arm=[];
    for(const [r,ax] of [[1.15,[0,0,0]],[0.95,[1.2,0,0]],[0.75,[0,0,1.2]]]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,0.04,8,64),gold);t.rotation.set(ax[0],ax[1],ax[2]);sph.add(t);MN.fx.arm.push({t,s:0.35+r*0.2,ax});}
    const orb=new THREE.Mesh(new THREE.SphereGeometry(0.34,20,16),new THREE.MeshBasicMaterial({color:hdr('#7ff0e0',2)}));sph.add(orb);
    const gl=new THREE.Sprite(glowMat('#7ff0e0',1.8));gl.scale.set(3.6,3.6,1);sph.add(gl);MN.fx.aGlow=gl;
    MN.fx.moons=[];for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(0.09,10,8),gold);sph.add(m);MN.fx.moons.push({m,ph:i*2.1,r:0.8+i*0.18});}
    g.position.set(6.4,0,-2.6);S.add(g);MN.fx.sph=sph;
    const h=hit(2.8,4.2,2.8,6.4,2.1,-2.6);S.add(h);MN.hits.push({id:'settings',mesh:h,icon:'🔮',name:'ลูกแก้วดาราศาสตร์',sub:'ตั้งค่า',anchor:new V(6.4,4.9,-2.6),glow:[gl],base:3.6,cam:[4.6,3.0,4.0],look:[8.8,2.7,-2.6]});}
  // 4) ตัวละคร (แต่งตัว)
  {const h=hit(2.2,3.6,2.2,0,2.0,0);S.add(h);MN.hits.push({id:'char',mesh:h,icon:'🎭',name:'พ่อมดของคุณ',sub:'แต่งตัว',anchor:new V(0,4.3,0),glow:[],base:0});}
  // ---- ป๊อปอัปเมนู + ปุ่มเมนูปกติ + สไตล์ ----
  const pop=document.createElement('div');pop.id='mnPop';pop.className='hidden';document.body.appendChild(pop);
  const tog=document.createElement('button');tog.id='mnNavTog';tog.textContent='☰ เมนูปกติ';tog.onclick=()=>{MN.nav=!MN.nav;document.body.classList.toggle('navOpen',MN.nav);};
  const lg=document.querySelector('.mleft .logo-th');if(lg)lg.insertAdjacentElement('afterend',tog);
  const hint=document.createElement('div');hint.id='mnHint';hint.textContent='✦ คลิกที่ประตูเวท หนังสือ หรือลูกแก้วในลาน ✦';if(lg)lg.insertAdjacentElement('afterend',hint);
  const st=document.createElement('style');st.textContent=`
body.menu3d .mnav,body.menu3d .mleft .orn{display:none}body.menu3d.navOpen .mnav{display:flex}body.menu3d.navOpen .mleft .orn{display:block}
#mnNavTog{margin:10px 0 0;padding:5px 12px;font:600 12px Kanit,sans-serif;color:rgba(255,255,255,.7);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.18);border-radius:6px;cursor:pointer;display:none;align-self:flex-start}
body.menu3d #mnNavTog{display:block}#mnNavTog:hover{color:#fff;border-color:rgba(243,220,148,.6)}
#mnHint{display:none;margin-top:14px;font:500 13px Kanit,sans-serif;color:#e8c468;letter-spacing:.5px;animation:mnPulse 2.4s ease-in-out infinite}body.menu3d #mnHint{display:block}body.menu3d.navOpen #mnHint{display:none}
@keyframes mnPulse{50%{opacity:.45}}
#mnPop{position:fixed;right:max(24px,5vw);top:50%;transform:translateY(-50%);width:min(360px,calc(100vw - 32px));z-index:6;padding:22px 22px 18px;background:linear-gradient(160deg,rgba(14,16,34,.94),rgba(6,8,20,.96));border:1px solid rgba(217,180,90,.55);box-shadow:0 0 44px rgba(120,140,255,.22),inset 0 0 30px rgba(217,180,90,.06);border-radius:4px;animation:mnIn .35s cubic-bezier(.2,1.2,.3,1) both}
#mnPop.hidden{display:none}@keyframes mnIn{from{opacity:0;transform:translateY(-46%) scale(.94)}}
#mnPop h2{margin:0 0 4px;font:700 24px "Cinzel Decorative",Cinzel,serif;color:#f3dc94;letter-spacing:1px}#mnPop p{margin:0 0 14px;font:400 13px Kanit,sans-serif;color:rgba(255,255,255,.65)}
#mnPop button.mnB{display:block;width:100%;text-align:left;margin:7px 0;padding:11px 14px;font:600 17px Kanit,sans-serif;color:#fff;background:linear-gradient(90deg,rgba(217,180,90,.14),rgba(217,180,90,.03));border:1px solid rgba(217,180,90,.35);border-radius:3px;cursor:pointer;transition:transform .15s,background .2s,border-color .2s}
#mnPop button.mnB:hover{transform:translateX(4px);border-color:#f3dc94;background:linear-gradient(90deg,rgba(243,220,148,.28),rgba(243,220,148,.06))}#mnPop button.mnB small{display:block;font:400 12px Kanit,sans-serif;color:rgba(255,255,255,.6);margin-top:1px}
#mnPop .mnJ{display:flex;gap:8px;margin:7px 0}#mnPop .mnJ input{flex:1;min-width:0;padding:10px 12px;font:600 17px Kanit,sans-serif;letter-spacing:4px;text-transform:uppercase;color:#fff;background:rgba(0,0,0,.4);border:1px solid rgba(217,180,90,.35);border-radius:3px;outline:none}#mnPop .mnJ input:focus{border-color:#f3dc94}
#mnPop .mnJ button{padding:0 16px;font:600 15px Kanit,sans-serif;color:#1a1204;background:linear-gradient(180deg,#f3dc94,#c9a040);border:none;border-radius:3px;cursor:pointer}
#mnPop .mnX{position:absolute;right:10px;top:8px;width:28px;height:28px;font:600 16px sans-serif;color:rgba(255,255,255,.6);background:none;border:none;cursor:pointer}#mnPop .mnX:hover{color:#fff}`;document.head.appendChild(st);
  pop.addEventListener('click',e=>{
    if(e.target.closest('.mnX')){mnClose();return;}
    const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
    if(a==='join'){const v=($('#mnCode').value||'').trim();if(v.length!==5){$('#mnCode').focus();return;}$('#codeIn').value=v;mnClose();$('#btnJoin').click();return;}
    const M={solo:'#btnSolo',host:'#btnHost',guide:'#btnGuide',prog:'#btnProg',music:'#btnMyMusic',settings:'#btnSettings'};
    mnClose();const el=M[a]&&$(M[a]);if(el)el.click();});
  pop.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'&&e.target.id==='mnCode')pop.querySelector('[data-act=join]').click();});
}
const MNPOP={
  play:`<button class="mnX">✕</button><h2>🌀 ประตูเวท</h2><p>เลือกเส้นทางที่จะก้าวเข้าไป</p>
    <button class="mnB" data-act="solo">⚔️ เล่นคนเดียว<small>ไม่ต้องใช้อินเทอร์เน็ต • ห้องฝึก / ฝึกกับบอท</small></button>
    <button class="mnB" data-act="host">🌐 สร้างห้องออนไลน์<small>ได้รหัสห้อง / ลิงก์เชิญ ไปส่งให้เพื่อน</small></button>
    <div class="mnJ"><input id="mnCode" maxlength="5" placeholder="รหัสห้อง" autocomplete="off"><button data-act="join">เข้าร่วม</button></div>`,
  book:`<button class="mnX">✕</button><h2>📖 หนังสือเวท</h2><p>ตำราของพ่อมดผู้ชนะ</p>
    <button class="mnB" data-act="guide">📜 คู่มือ<small>วิธีเล่น / ปุ่มกด / เล่นกับเพื่อน</small></button>
    <button class="mnB" data-act="prog">📈 เลเวล & สถิติ<small>XP • ชนะ-แพ้ • ของปลดล็อค</small></button>
    <button class="mnB" data-act="music">🎵 เพลงของฉัน<small>เลือกไฟล์เพลงในเครื่อง</small></button>`,
  settings:`<button class="mnX">✕</button><h2>🔮 ลูกแก้วดาราศาสตร์</h2><p>ปรับเกมให้ถูกใจ</p>
    <button class="mnB" data-act="settings">⚙️ ตั้งค่า<small>เมาส์ / เสียง / กราฟิก / ปุ่มกด / ภาพ</small></button>`};
function mnFocus(id){
  if(id==='char'){try{sfx('go');}catch(e){}$('#btnLook').click();return;}
  MN.focus=id;MN.fT=0;MN.popFor='';try{snd('buff',{vol:0.4});}catch(e){}
}
function mnClose(){MN.focus=null;MN.popFor='';const p=$('#mnPop');if(p)p.classList.add('hidden');}
// ---- เมาส์: เลื่อน = เรืองแสง • คลิก = เข้าหาของ ----
function mnPick(e){
  if(!MN.rp||MN.focus)return;
  if(e.target.closest&&e.target.closest('.mleft,.mprof,.mnews,.mver,.card,.overlay,#mnPop,button,input,select'))return mnHot(null);
  const r=gl.domElement.getBoundingClientRect();
  MN.ray.setFromCamera({x:((e.clientX-r.left)/r.width)*2-1,y:-((e.clientY-r.top)/r.height)*2+1},cam);
  const hs=MN.ray.intersectObjects(MN.hits.map(h=>h.mesh),false);
  mnHot(hs.length?MN.hits.find(h=>h.mesh===hs[0].object):null);
}
function mnHot(h){if(h===MN.hot)return;if(h){try{snd('tick',{vol:0.35});}catch(e){}}MN.hot=h;document.body.style.cursor=h?'pointer':'';}
addEventListener('mousemove',mnPick);
addEventListener('click',e=>{if(!MN.rp||MN.focus)return;mnPick(e);if(MN.hot&&!(e.target.closest&&e.target.closest('.mleft,.mprof,.mnews,.mver,.card,.overlay,#mnPop,button,input,select')))mnFocus(MN.hot.id);});
addEventListener('keydown',e=>{if(e.key==='Escape'&&MN.focus)mnClose();});
// ---- เรนเดอร์ (เรียกจาก renderStage js/32 — คืน true = จัดการให้แล้ว) ----
const MN_FOV=48;
function mnRestore(){
  if(cam.fov!==SET.fov){cam.fov=SET.fov;cam.updateProjectionMatrix();}   // ออกจากหน้าเมนู (ล็อบบี้/หน้าสร้างตัวละคร): คืนตัวละคร + เอฟเฟกต์เมนูให้ฉากห้องโถง
  if(STAGE.mfx&&STAGE.mfx.parent!==stage)stage.add(STAGE.mfx);
  for(const o of STAGE.chars.values())if(o.g.parent!==stage)stage.add(o.g);
  MN.rp=null;if(MN.focus)mnClose();document.body.classList.remove('menu3d');document.body.style.cursor='';
}
function mnMenuRender(dt,now){
  if(!MN.enabled||screen!=='menu'||crOpen){if(MN.built)mnRestore();return false;}
  try{mnBuild();}catch(e){console.error('menu3d',e);MN.enabled=false;document.body.classList.remove('menu3d');if(MN.built)mnRestore();return false;}
  document.body.classList.add('menu3d');MN.rp=true;
  const t=now/1000,F=MN.fx;
  // ตัวละคร + เอฟเฟกต์เมนูเดิม
  if(STAGE.mfx.parent!==MENUS)MENUS.add(STAGE.mfx);
  const o=stageChar('me-preview',lookStr(myLook));if(o.g.parent!==MENUS)MENUS.add(o.g);
  for(const [id,c] of STAGE.chars)if(id!=='me-preview'&&c.g.parent===MENUS)stage.add(c.g);
  o.x=0;o.g.position.set(0,STAGE_Y,0);o.g.rotation.y=-0.22+((mouseX||SW*0.6)/Math.max(1,SW)-0.6)*0.5+(window.__rotY||0);o.g.visible=true;
  stageIdle(o,now,dt,0);stageMenuFx(now,true);
  const ch=o.ring;if(ch){ch.visible=true;ch.material.color.set('#f3dc94');ch.material.opacity=0.85;}
  // ของในลาน
  F.rune.rotation.z=t/12;
  for(const q of F.orbs)q.o.position.y=q.y+Math.sin(t*0.8+q.ph)*0.3;
  for(const f of F.flames){const s=0.9+0.16*Math.sin(t*11+f.ph)+0.1*Math.sin(t*23+f.ph*2);f.a.scale.y=1.9*s;f.b.scale.y=1.0*(1.1-s*0.2);}
  F.portal.rotation.z=-t*0.5;F.pRings[0].rotation.z=t*0.9;F.pRings[1].rotation.z=-t*1.3;F.pGlow.material.opacity=0.8+0.2*Math.sin(t*2.1);F.pLight.intensity=2.2+0.5*Math.sin(t*2.6);
  F.book.position.y=2.0+Math.sin(t*1.2)*0.08;F.book.rotation.y=Math.sin(t*0.5)*0.12;
  {const u=(t*0.35)%1,a=u<0.5?lerp(0.2,Math.PI-0.2,_cs(u*2)):Math.PI-0.2;F.flip.rotation.set(-1.05,0,0);F.flip.rotation.y=u<0.5?-a*0.5:0;F.flip.visible=u<0.5;}   // หน้ากระดาษพลิกเป็นพัก ๆ
  for(const q of F.runes){const a=t*0.9+q.ph;q.r.position.set(Math.cos(a)*1.2,2.1+Math.sin(a*1.7)*0.35,Math.sin(a)*0.8);q.r.material.opacity=0.6+0.4*Math.sin(t*3+q.ph);}
  for(const q of F.arm){q.t.rotation.x=q.ax[0]+t*q.s*(q.ax[0]?1:0.4);q.t.rotation.y=q.ax[1]+t*q.s*0.5;q.t.rotation.z=q.ax[2]+t*q.s*(q.ax[2]?1:0.3);}
  for(const q of F.moons){const a=t*0.8+q.ph;q.m.position.set(Math.cos(a)*q.r,Math.sin(a*1.3)*0.4,Math.sin(a)*q.r);}
  F.stars.material.opacity=0.85+0.1*Math.sin(t*1.1);
  for(const m of F.mist){m.m.position.x=m.x+Math.sin(t*0.12+m.ph)*3;}
  {const fl=F.fly,s=fl.seed;for(let i=0;i<s.length;i++){const q=s[i],h=(q[1]+t*q[4])%9.5;fl.pos[i*3]=q[0]+Math.sin(t*0.4+q[3])*0.9;fl.pos[i*3+1]=h+0.3;fl.pos[i*3+2]=q[2]+Math.cos(t*0.35+q[3])*0.9;}fl.pts.geometry.attributes.position.needsUpdate=true;}
  // ดาวตก
  {const S=MN.shoot,sh=F.shoot;if(S.t<0&&Math.random()<dt/6){S.t=0;S.x=rnd(-50,20);S.y=rnd(50,80);S.z=-85;}if(S.t>=0){S.t+=dt;const k=S.t/1.1;sh.visible=k<1;sh.position.set(S.x+k*60,S.y-k*26,S.z);sh.material.rotation=0.4;sh.material.opacity=Math.sin(Math.min(1,k)*Math.PI);if(k>=1)S.t=-1;}}
  // ไฮไลต์ของที่ชี้
  for(const h of MN.hits){const on=MN.hot===h||MN.focus===h.id;h.k=(h.k||0)+((on?1:0)-(h.k||0))*Math.min(1,dt*10);for(const g of h.glow){g.scale.set(h.base*(1+0.18*h.k)*(h.id==='play'?0.78:1),h.base*(h.id==='play'?1.29:1)*(1+0.18*h.k)*(h.id==='book'?0.79:1),1);g.material.opacity=0.8+0.2*h.k;}}
  // กล้อง: เริ่มเฟรมแรกด้วย intro (โฉบลงมา) แล้วลอยช้า ๆ • คลิกของ = เลื่อนเข้าหา
  const foc=MN.focus&&MN.hits.find(h=>h.id===MN.focus);
  const u=STAGE.introT<0?0:Math.min(1,STAGE.introT),e=1-Math.pow(1-u,3);if(STAGE.introT>=0&&STAGE.introT<1)STAGE.introT+=dt/2.8;
  const sway=Math.sin(t/5.2)*0.25,drift=Math.sin(t/7)*0.2;
  if(cam.fov!==MN_FOV){cam.fov=MN_FOV;cam.updateProjectionMatrix();}   // เมนูใช้มุมแคบ (ของดูใหญ่ขึ้น)
  let pp=_mcp.set(lerp(2.4,-0.2+sway*0.6+drift,e),lerp(9,2.3,e),lerp(20,9.4,e)),ll=_mcl.set(lerp(0,0.4,e),lerp(3.2,2.1,e),lerp(0,-0.4,e));
  if(foc){MN.fT+=dt;pp=_mcp.set(...foc.cam);ll=_mcl.set(...foc.look);}
  const C=MN.cam;if(!C.init){C.p.copy(pp);C.l.copy(ll);C.init=true;}const k=1-Math.exp(-(foc?3.4:2.6)*dt);C.p.lerp(pp,k);C.l.lerp(ll,k);
  cam.position.copy(C.p);cam.lookAt(C.l);if(window.__stageCam)window.__stageCam(cam);
  // ป๊อปอัปเปิดเมื่อกล้องใกล้ถึง
  if(foc&&!MN.popFor&&MN.fT>0.7){MN.popFor=foc.id;const p=$('#mnPop');p.innerHTML=MNPOP[foc.id]||'';p.classList.remove('hidden');}
  rpass.scene=MENUS;gl.shadowMap.needsUpdate=true;composer.render();rpass.scene=scene;
  // ป้ายชื่อลอยเหนือของ (2D)
  cx.save();cx.textAlign='center';cx.textBaseline='middle';
  for(const h of MN.hits){if(MN.focus&&MN.focus!==h.id)continue;_mv.copy(h.anchor);_mv.y+=Math.sin(t*1.5+h.anchor.x)*0.1;_mv.project(cam);if(_mv.z>1)continue;
    const x=(_mv.x+1)/2*SW,y=(1-_mv.y)/2*SH,hk=h.k||0,w=(h.sub?170:130)+hk*30,H=h.sub?44:30;
    cx.globalAlpha=MN.focus===h.id?0.0:0.78+0.22*hk;
    cx.fillStyle=`rgba(8,10,24,${0.62+0.2*hk})`;cx.strokeStyle=`rgba(243,220,148,${0.5+0.5*hk})`;cx.lineWidth=1+hk;cx.beginPath();if(cx.roundRect)cx.roundRect(x-w/2,y-H/2,w,H,8);else cx.rect(x-w/2,y-H/2,w,H);cx.fill();cx.stroke();
    cx.font='700 15px Kanit,sans-serif';cx.fillStyle=hk>0.5?'#fff4cc':'#fff';cx.fillText(h.icon+' '+h.name,x,y-(h.sub?7:0));
    if(h.sub){cx.font='500 12px Kanit,sans-serif';cx.fillStyle=hk>0.5?'#ffd86b':'rgba(232,196,104,.85)';cx.fillText(h.sub,x,y+11);}
    if(!MN.focus){cx.globalAlpha=0.5+0.4*Math.sin(t*3+h.anchor.x);cx.fillStyle='#f3dc94';cx.beginPath();cx.moveTo(x-5,y+H/2+5);cx.lineTo(x+5,y+H/2+5);cx.lineTo(x,y+H/2+11);cx.fill();}}
  cx.restore();
  return true;
}
const _mcp=new THREE.Vector3(),_mcl=new THREE.Vector3();
