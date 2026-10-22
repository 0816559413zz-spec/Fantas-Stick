// =====================================================================
//  เมนูแรก = ลานดวลเวทใต้ดาว ที่ "เดินได้" (ผู้ใช้ 2026-10-22, รอบ 2: "redesign the menu by use the ref from other game that interact with things")
//  อ้างอิง: บ้านใน Hades (เดินไปหาของแล้วกดใช้) / ยานใน Deep Rock Galactic (เดินไปที่เครื่อง) / ภาพวาดใน Mario 64 (ประตู = ด่าน)
//  ผู้ใช้เลือก: คลิกของ → พ่อมดวิ่งไปเอง + เดิน WASD ได้ • ของครบทุกชิ้น + "make it the best"
//  เล่น: คลิกของ = พ่อมดวิ่งไป หันหาของ ร่ายไม้ ของ "ทำงาน" (ประตูสว่าง นกฮูกบินมา หนังสือพลิก …) แล้วม้วนกระดาษเมนูคลี่ออกข้าง ๆ
//        คลิกพื้น = เดินไปตรงนั้น • WASD = เดินเอง • ใกล้ของ = ขึ้น [E] • Esc / ✕ = ปิด
//  ของ (เมนู): 🌀 ประตูเวท = เล่น • 🦉 นกฮูกส่งจดหมาย = ใส่รหัสห้อง • 📖 หนังสือเวท = คู่มือ • 🔮 ลูกแก้วดาราศาสตร์ = ตั้งค่า
//              🪞 กระจกวิเศษ = แต่งตัว / เลือกคาถา • 🏆 ตู้ถ้วยรางวัล = เลเวล & สถิติ • 🎵 เครื่องเล่นแผ่นเสียง = เพลง
//  ของเล่น (ให้ลานมีชีวิต): แมวดำเดินเล่น (คลิก = ร้องเหมียว นั่ง หัวใจ) • ลูกสนิชบินวน (คลิก = จับได้!) • กระถางไฟ (คลิก = ลุกวาบ)
//  ฉากแยก MENUS (ล็อบบี้ห้องโถง `stage` + หน้าสร้างตัวละครไม่เปลี่ยน) • ปุ่มเมนูเดิมยังอยู่หลัง "☰ เมนูปกติ" • สร้างฉากพัง = กลับเมนูเดิมเอง
//  ตำแหน่งของ = รอบวงลาน (ไม่ขึ้นกับขนาดจอ, กล้องตามพ่อมด) — บทเรียนรอบที่แล้ว: เทสที่จอ 1891×942 / 1366×768 / 1024×768
//  ⚠ ตำแหน่ง/สี/ท่า/เสียงทั้งหมด Claude ออกแบบเอง
// =====================================================================
const MENUS=new THREE.Scene();
MENUS.background=new THREE.Color('#04050d');MENUS.fog=new THREE.Fog('#070a1c',26,85);
// enabled:false = ปิดลานเดินได้ (ผู้ใช้ 2026-10-22 ขอเมนูแบบใหม่ → js/61-62) • เปิดกลับ = true
const MN={built:false,enabled:false,hits:[],hot:null,focus:null,fT:0,popFor:'',cam:{p:new THREE.Vector3(),l:new THREE.Vector3(),init:false},fx:{},ray:new THREE.Raycaster(),nav:false,shoot:{t:-1,x:0,y:0,z:0},rp:null,
  w:{x:0,z:0.6,a:0,tx:null,tz:null,go:null,sp:0,keys:{},act:null,actT:0},toys:[],near:null,ground:null};
const MN_FOV=48,MN_R=11.5;   // มุมกล้องเมนู • เดินได้ในรัศมีนี้
const _mv=new THREE.Vector3(),_mcp=new THREE.Vector3(),_mcl=new THREE.Vector3();
function mnCrest(c,e){return texCanvas(128,320,g=>{g.fillStyle=c;g.fillRect(0,0,128,320);g.fillStyle='#d9b45a';g.fillRect(0,0,128,7);g.fillRect(0,0,7,320);g.fillRect(121,0,7,320);
  g.beginPath();g.moveTo(14,110);g.lineTo(114,110);g.lineTo(114,190);g.quadraticCurveTo(114,250,64,276);g.quadraticCurveTo(14,250,14,190);g.closePath();g.fillStyle='rgba(0,0,0,.3)';g.fill();g.lineWidth=5;g.strokeStyle='#d9b45a';g.stroke();
  g.font='64px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(e,64,190);});}
// เสียงสังเคราะห์สั้น ๆ (เหมียว / ฮู้ / วู้ช)
function mnTone(kind){const A=AC;if(!A||!SFXBUS)return;const t0=A.currentTime,o=A.createOscillator(),g=A.createGain();o.connect(g);g.connect(SFXBUS);
  if(kind==='meow'){o.type='sawtooth';o.frequency.setValueAtTime(520,t0);o.frequency.linearRampToValueAtTime(820,t0+0.12);o.frequency.linearRampToValueAtTime(480,t0+0.42);g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(0.08,t0+0.05);g.gain.exponentialRampToValueAtTime(0.0001,t0+0.45);o.start(t0);o.stop(t0+0.5);}
  else if(kind==='hoot'){o.type='sine';o.frequency.setValueAtTime(330,t0);o.frequency.linearRampToValueAtTime(300,t0+0.25);g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(0.16,t0+0.04);g.gain.exponentialRampToValueAtTime(0.0001,t0+0.3);g.gain.setValueAtTime(0.0001,t0+0.36);g.gain.exponentialRampToValueAtTime(0.14,t0+0.4);g.gain.exponentialRampToValueAtTime(0.0001,t0+0.75);o.start(t0);o.stop(t0+0.8);}
  else{o.type='triangle';o.frequency.setValueAtTime(220,t0);o.frequency.exponentialRampToValueAtTime(880,t0+0.25);g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(0.1,t0+0.05);g.gain.exponentialRampToValueAtTime(0.0001,t0+0.35);o.start(t0);o.stop(t0+0.4);}}
// ของที่คลิกได้: {id, mesh (กล่องรับคลิก), pos, stand (จุดยืน), icon/name/sub, anchor (ป้าย), act() เมื่อพ่อมดถึง, pop (เมนู) หรือ go (ทำเลย)}
function mnHit(id,o){const m=new THREE.Mesh(new THREE.BoxGeometry(o.w,o.h,o.d),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));m.position.set(o.x,o.h/2+(o.y0||0),o.z);m.rotation.y=o.ry||0;MENUS.add(m);
  const h=Object.assign({id,mesh:m,k:0,anchor:new THREE.Vector3(o.x,o.ay,o.z),stand:new THREE.Vector3(o.sx,0,o.sz),glow:[]},o);MN.hits.push(h);return h;}
function mnBuild(){
  if(MN.built)return;MN.built=true;const S=MENUS;
  const gold=new THREE.MeshStandardMaterial({color:'#d9b45a',metalness:0.9,roughness:0.28,emissive:'#3a2a08'}),stone=stoneMat(1,4,'#6a6884'),iron=new THREE.MeshStandardMaterial({color:'#2a2a34',metalness:0.7,roughness:0.5}),wood=new THREE.MeshStandardMaterial({color:'#4a2e1a',roughness:0.8});
  const goldL=new THREE.MeshBasicMaterial({color:hdr('#d9b45a',0.85)});
  // ---- แสง ----
  S.add(new THREE.HemisphereLight('#7f96f0','#1a1410',0.95),new THREE.AmbientLight('#2a2c52',0.55));
  {const moonL=new THREE.DirectionalLight('#a9bcff',0.7);moonL.position.set(-12,22,8);S.add(moonL);}   // แสงจันทร์ส่องลาน
  const key=new THREE.SpotLight('#ffe0a8',2.0,60,0.75,0.6,1);key.position.set(2,18,10);key.target.position.set(0,0,-1);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-0.0008;S.add(key,key.target);MN.key=key;
  const rim=new THREE.DirectionalLight('#7f9cff',0.8);rim.position.set(-6,9,-14);S.add(rim);
  // ---- พื้น ----
  const grass=new THREE.Mesh(new THREE.CircleGeometry(95,40),new THREE.MeshStandardMaterial({color:'#0c1410',roughness:1}));grass.rotation.x=-Math.PI/2;grass.position.y=-0.03;S.add(grass);
  const plaza=new THREE.Mesh(new THREE.CircleGeometry(15,72),stoneMat(12,12,'#3a3e58'));plaza.rotation.x=-Math.PI/2;plaza.receiveShadow=true;S.add(plaza);MN.ground=plaza;
  for(const [r,w] of [[4,0.06],[7.2,0.05],[13.6,0.07]]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,w,6,120),goldL);t.rotation.x=Math.PI/2;t.position.y=0.02;S.add(t);}
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2,l=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.02,3.2),goldL);l.position.set(Math.cos(a)*5.6,0.015,Math.sin(a)*5.6);l.rotation.y=-a+Math.PI/2;S.add(l);}
  const dais=new THREE.Mesh(new THREE.CylinderGeometry(2.7,2.9,0.22,48),stoneMat(4,1,'#6c6c8c'));dais.position.y=0.11;dais.receiveShadow=true;S.add(dais);
  const rune=new THREE.Mesh(new THREE.CircleGeometry(2.55,48),new THREE.MeshBasicMaterial({map:runeTex,color:hdr('#e8c66a',1.3),transparent:true,opacity:0.45,depthWrite:false,blending:THREE.AdditiveBlending}));rune.rotation.x=-Math.PI/2;rune.position.y=0.235;S.add(rune);MN.fx.rune=rune;
  // ---- เสาหินพังรอบวง + ซุ้มโค้ง + ลูกแสงรูน + ธง ----
  const HC=['#8a1c1c','#1c3f8a','#1f6a38','#9a7a12'],HE=['🦁','🦅','🐍','🦡'];MN.fx.orbs=[];const P=[];
  for(let i=0;i<14;i++){const a=-0.28+(Math.PI+0.56)*i/13,x=Math.cos(a)*17.5,z=-Math.sin(a)*17.5,tall=i%5!==2,H=tall?11:5.5;P.push([x,z,H,tall]);
    const col=new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.9,H,12),stone);col.position.set(x,H/2,z);S.add(col);
    const b=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.2,0.5,12),stone);b.position.set(x,0.25,z);S.add(b);
    if(tall){const cap=new THREE.Mesh(new THREE.CylinderGeometry(1.05,0.7,0.6,12),stone);cap.position.set(x,H+0.1,z);S.add(cap);const o=new THREE.Sprite(glowMat(HC[i%4],2.2));o.scale.setScalar(1.4);o.position.set(x,H+1.7,z);S.add(o);MN.fx.orbs.push({o,y:H+1.7,ph:i});}
    else{const r=new THREE.Mesh(new THREE.DodecahedronGeometry(0.9,0),stone);r.position.set(x,H+0.2,z);r.scale.set(1,0.7,1);r.rotation.set(0.4,i,0.3);S.add(r);}}
  for(let i=0;i<13;i++){const A=P[i],B=P[i+1];if(!A[3]||!B[3]||i%2)continue;const dx=B[0]-A[0],dz=B[1]-A[1],d=Math.hypot(dx,dz),ar=new THREE.Mesh(new THREE.TorusGeometry(d/2-0.1,0.34,8,28,Math.PI),stone);ar.position.set((A[0]+B[0])/2,11.3,(A[1]+B[1])/2);ar.rotation.y=-Math.atan2(dz,dx);S.add(ar);}
  [[3,0],[5,1],[8,2],[10,3]].forEach(([i,h])=>{const p=P[i];if(!p)return;const m=new THREE.Mesh(new THREE.PlaneGeometry(1.8,5),new THREE.MeshStandardMaterial({map:mnCrest(HC[h],HE[h]),roughness:0.9,side:THREE.DoubleSide}));m.position.set(p[0]*0.94,7.4,p[1]*0.94);m.lookAt(0,7.4,0);S.add(m);});
  // ---- กระถางไฟ 4 ใบ (คลิกได้ = ลุกวาบ) ----
  MN.fx.flames=[];
  for(const [x,z] of [[-11.5,4.5],[11.5,4.5],[-12,-5],[12,-5]]){
    const g=new THREE.Group(),bowl=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.28,0.45,12),iron);bowl.position.y=1.25;g.add(bowl);
    for(let k=0;k<3;k++){const a=k/3*Math.PI*2,lg=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.05,1.3,6),iron);lg.position.set(Math.cos(a)*0.32,0.62,Math.sin(a)*0.32);lg.rotation.set(Math.sin(a)*0.18,0,-Math.cos(a)*0.18);g.add(lg);}
    const f1=new THREE.Sprite(glowMat('#ff8a2a',2.6));f1.scale.set(1.2,1.9,1);f1.position.y=1.9;g.add(f1);const f2=new THREE.Sprite(glowMat('#ffd27a',2.8));f2.scale.set(0.6,1.0,1);f2.position.y=1.8;g.add(f2);
    const fl={a:f1,b:f2,ph:Math.random()*6,boost:0};MN.fx.flames.push(fl);
    if(z<0){const L=new THREE.PointLight('#ff9a4a',1.1,13,2);L.position.set(0,2.2,0);g.add(L);fl.L=L;}
    g.position.set(x,0,z);S.add(g);
    MN.toys.push({id:'fire',mesh:(()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(1.4,2.6,1.4),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));m.position.set(x,1.3,z);S.add(m);return m;})(),fl});}
  // ---- ท้องฟ้า ----
  {const n=1500,pos=new Float32Array(n*3);for(let i=0;i<n;i++){let a,e;if(i<420){const u=Math.random()*Math.PI*2,w=(Math.random()+Math.random()-1)*0.12;a=u;e=0.5+Math.sin(u)*0.35+w;}else{a=Math.random()*Math.PI*2;e=0.05+Math.random()*1.45;}
      const r=120;pos[i*3]=Math.cos(a)*Math.cos(e)*r;pos[i*3+1]=Math.sin(e)*r;pos[i*3+2]=Math.sin(a)*Math.cos(e)*r-30;}
    const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    MN.fx.stars=new THREE.Points(gg,new THREE.PointsMaterial({map:glowTex,color:hdr('#dfe8ff',1.7),size:1.5,transparent:true,opacity:0.92,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));S.add(MN.fx.stars);
    const moon=new THREE.Sprite(glowMat('#cfe0ff',2.8));moon.scale.set(22,22,1);moon.position.set(-38,62,-85);moon.material.fog=false;S.add(moon);
    for(const [c,x,y,z,s] of [['#5a3ea8',40,48,-90,60],['#1f6a8a',-60,36,-70,50],['#8a2a6a',10,70,-100,46]]){const n2=new THREE.Sprite(glowMat(c,0.55));n2.scale.set(s,s*0.6,1);n2.position.set(x,y,z);n2.material.fog=false;n2.material.opacity=0.35;S.add(n2);}
    MN.fx.shoot=new THREE.Sprite(glowMat('#ffffff',3));MN.fx.shoot.scale.set(10,0.5,1);MN.fx.shoot.visible=false;MN.fx.shoot.material.fog=false;S.add(MN.fx.shoot);}
  MN.fx.mist=[];for(let i=0;i<9;i++){const m=new THREE.Sprite(glowMat('#5a6ac0',0.5));m.scale.set(16,3.2,1);m.position.set(rnd(-18,18),0.5,rnd(-16,8));m.material.opacity=0.15;m.material.fog=false;S.add(m);MN.fx.mist.push({m,x:m.position.x,ph:Math.random()*6});}
  {const n=90,pos=new Float32Array(n*3),seed=[];for(let i=0;i<n;i++)seed.push([rnd(-14,14),rnd(0.3,9),rnd(-14,9),Math.random()*6,rnd(0.2,0.6)]);
    const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    MN.fx.fly={pts:new THREE.Points(fg,new THREE.PointsMaterial({map:glowTex,color:hdr('#ffe9a0',1.8),size:0.16,transparent:true,opacity:0.85,depthWrite:false,blending:THREE.AdditiveBlending})),seed,pos};S.add(MN.fx.fly.pts);}
  // ============ ของที่ใช้เปิดเมนู (วางรอบวง หันเข้ากลาง) ============
  const face=(g,x,z)=>{g.rotation.y=Math.atan2(-x,-z);};   // ให้ด้านหน้า (+z ของกลุ่ม) หันเข้าหากลางลาน
  // 🌀 ประตูเวท (เล่น) — หลังกลาง
  {const g=new THREE.Group(),sw=texCanvas(256,256,c=>{const r=c.createRadialGradient(128,128,4,128,128,128);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(0.25,'rgba(150,120,255,.95)');r.addColorStop(0.7,'rgba(60,200,220,.7)');r.addColorStop(1,'rgba(30,60,140,0)');c.fillStyle=r;c.fillRect(0,0,256,256);
      c.lineWidth=5;for(let k=0;k<6;k++){c.beginPath();for(let t=0;t<40;t++){const a=k*Math.PI/3+t*0.14,rr=6+t*3;c.lineTo(128+Math.cos(a)*rr,128+Math.sin(a)*rr);}c.strokeStyle=`rgba(255,255,255,${0.55-k*0.04})`;c.stroke();}});
    for(const sx of [-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(0.8,5.4,0.9),stone);p.position.set(sx*1.95,2.7,0);g.add(p);const cp=new THREE.Mesh(new THREE.BoxGeometry(1.05,0.35,1.15),stone);cp.position.set(sx*1.95,5.5,0);g.add(cp);const rb=new THREE.Mesh(new THREE.BoxGeometry(0.1,3.6,0.1),new THREE.MeshBasicMaterial({color:hdr('#9fe8ff',1.6)}));rb.position.set(sx*1.57,2.7,0.5);g.add(rb);}
    const top=new THREE.Mesh(new THREE.TorusGeometry(1.95,0.42,10,36,Math.PI),stone);top.position.set(0,5.3,0);g.add(top);
    const keyst=new THREE.Mesh(new THREE.OctahedronGeometry(0.4,0),gold);keyst.position.set(0,7.3,0.2);g.add(keyst);
    for(const sx of [-1,1]){const st=new THREE.Mesh(new THREE.BoxGeometry(5.6,0.25,1.2),stone);st.position.set(0,0.12,0.9);g.add(st);break;}
    const disc=new THREE.Mesh(new THREE.CircleGeometry(1.75,48),new THREE.MeshBasicMaterial({map:sw,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:hdr('#ffffff',1.4)}));disc.position.set(0,3.4,0.08);disc.scale.y=1.55;g.add(disc);
    const rings=[];for(const [r,c] of [[1.6,'#9fe8ff'],[1.3,'#b49bff']]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,0.03,6,48),new THREE.MeshBasicMaterial({color:hdr(c,1.8),transparent:true,opacity:0.8}));t.position.set(0,3.4,0.1);t.scale.y=1.55;g.add(t);rings.push(t);}
    const gl=new THREE.Sprite(glowMat('#9a8cff',1.8));gl.scale.set(5.5,7,1);gl.position.set(0,3.4,0.3);g.add(gl);
    const L=new THREE.PointLight('#8a9cff',2.4,16,2);L.position.set(0,3.2,2);g.add(L);
    g.position.set(0,0,-10.2);S.add(g);MN.fx.portal={disc,rings,gl,L};
    const h=mnHit('play',{x:0,z:-10.2,w:4.8,h:7.4,d:2,ay:8.2,sx:0,sz:-7.6,icon:'🌀',name:'ประตูเวท',sub:'เล่น',col:'#b49bff'});h.glow=[gl];h.gb=[5.5,7];}
  // 🦉 นกฮูกส่งจดหมาย (เข้าร่วมด้วยรหัส) — หลังซ้าย
  {const g=new THREE.Group(),post=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.16,2.6,8),wood);post.position.y=1.3;g.add(post);
    const perch=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,1.4,8),wood);perch.rotation.z=Math.PI/2;perch.position.y=2.55;g.add(perch);
    const box=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.6,0.5),wood);box.position.set(0,1.1,0.2);g.add(box);
    for(let i=0;i<3;i++){const l=new THREE.Mesh(new THREE.PlaneGeometry(0.34,0.24),new THREE.MeshStandardMaterial({color:'#efe0bc',roughness:0.9,side:THREE.DoubleSide}));l.position.set(-0.22+i*0.22,1.45,0.2+i*0.02);l.rotation.set(-0.3,0,(i-1)*0.2);g.add(l);}
    const owl=new THREE.Group(),fM=new THREE.MeshStandardMaterial({color:'#8a6a4a',roughness:0.9}),wM=new THREE.MeshStandardMaterial({color:'#efe6d8',roughness:0.9});
    const bd=new THREE.Mesh(new THREE.SphereGeometry(0.32,14,12),fM);bd.scale.set(1,1.25,0.95);owl.add(bd);const bl=new THREE.Mesh(new THREE.SphereGeometry(0.24,12,10),wM);bl.position.set(0,-0.05,0.14);bl.scale.set(1,1.2,0.6);owl.add(bl);
    const hd=new THREE.Group();hd.position.y=0.44;owl.add(hd);const hm=new THREE.Mesh(new THREE.SphereGeometry(0.25,14,12),fM);hd.add(hm);const fc=new THREE.Mesh(new THREE.SphereGeometry(0.2,12,10),wM);fc.position.set(0,-0.02,0.12);fc.scale.set(1.1,0.9,0.5);hd.add(fc);
    for(const sx of [-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(0.07,10,8),new THREE.MeshBasicMaterial({color:hdr('#ffb000',1.5)}));e.position.set(sx*0.09,0.03,0.2);hd.add(e);const pu=new THREE.Mesh(new THREE.SphereGeometry(0.035,8,6),new THREE.MeshBasicMaterial({color:'#000'}));pu.position.set(sx*0.09,0.03,0.26);hd.add(pu);const t=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.18,5),fM);t.position.set(sx*0.17,0.22,0);t.rotation.z=-sx*0.4;hd.add(t);}
    const bk=new THREE.Mesh(new THREE.ConeGeometry(0.035,0.1,5),new THREE.MeshStandardMaterial({color:'#d9a040'}));bk.position.set(0,-0.04,0.26);bk.rotation.x=Math.PI/2+0.3;hd.add(bk);
    const wings=[];for(const sx of [-1,1]){const w=new THREE.Group();w.position.set(sx*0.28,0.1,0);const wm=new THREE.Mesh(new THREE.SphereGeometry(0.26,10,8),fM);wm.scale.set(0.35,1,0.8);wm.position.y=-0.12;w.add(wm);owl.add(w);wings.push(w);}
    const letter=new THREE.Mesh(new THREE.PlaneGeometry(0.34,0.24),new THREE.MeshStandardMaterial({color:'#efe0bc',roughness:0.9,side:THREE.DoubleSide,emissive:'#3a2a10'}));letter.position.set(0,-0.45,0.1);letter.visible=false;owl.add(letter);
    const seal=new THREE.Mesh(new THREE.CircleGeometry(0.05,10),new THREE.MeshBasicMaterial({color:'#a01c1c'}));seal.position.set(0,0,0.002);letter.add(seal);
    owl.position.set(0,2.95,0);g.add(owl);const x=-7.2,z=-7.4;g.position.set(x,0,z);face(g,x,z);S.add(g);
    MN.fx.owl={owl,hd,wings,letter,home:new THREE.Vector3(x,2.95,z),grp:g,st:'perch',t:0,blink:0};
    mnHit('join',{x,z,w:1.8,h:3.4,d:1.6,ay:4.3,sx:-5.4,sz:-5.5,icon:'🦉',name:'นกฮูกส่งจดหมาย',sub:'เข้าห้องด้วยรหัส',col:'#ffb000'});}
  // 📖 หนังสือเวท (คู่มือ) — ซ้าย
  {const g=new THREE.Group();
    const post=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.5,1.25,4),wood);post.position.y=0.62;post.rotation.y=Math.PI/4;g.add(post);
    const bd=new THREE.Mesh(new THREE.BoxGeometry(1.55,0.12,1.0),wood);bd.position.y=1.32;bd.rotation.x=-0.45;g.add(bd);
    const page=texCanvas(128,160,c=>{c.fillStyle='#efe0bc';c.fillRect(0,0,128,160);c.strokeStyle='rgba(90,60,20,.55)';c.lineWidth=1.5;for(let y=30;y<150;y+=11){c.beginPath();c.moveTo(14,y);c.lineTo(114-((y*7)%30),y);c.stroke();}c.fillStyle='#b8862a';c.font='22px serif';c.textAlign='center';c.fillText('✦',64,20);});
    const bk=new THREE.Group(),pm=new THREE.MeshStandardMaterial({map:page,roughness:0.9,side:THREE.DoubleSide,emissive:'#3a2a10',emissiveIntensity:0.6});
    for(const sx of [-1,1]){const pg=new THREE.Mesh(new THREE.PlaneGeometry(0.78,1.0),pm);pg.position.set(sx*0.4,0,0);pg.rotation.set(-1.05,0,sx*-0.22);bk.add(pg);}
    const sp=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,1.0),gold);sp.rotation.x=-1.05;bk.add(sp);
    const flip=new THREE.Mesh(new THREE.PlaneGeometry(0.78,1.0),pm);flip.geometry.translate(0.39,0,0);bk.add(flip);
    bk.position.set(0,2.0,0);g.add(bk);
    const gl=new THREE.Sprite(glowMat('#ffd98a',1.7));gl.scale.set(3.8,3.0,1);gl.position.set(0,2.1,0.1);g.add(gl);
    const runes=[];for(let i=0;i<6;i++){const r=new THREE.Sprite(glowMat(i%2?'#9fe8ff':'#ffd98a',2.2));r.scale.setScalar(0.22);g.add(r);runes.push({r,ph:i/6*6.283});}
    const x=-10.2,z=-0.6;g.position.set(x,0,z);face(g,x,z);S.add(g);MN.fx.book={bk,flip,gl,runes,fast:0};
    const h=mnHit('book',{x,z,w:2,h:2.6,d:1.8,ay:3.6,sx:-7.8,sz:-0.5,icon:'📖',name:'หนังสือเวท',sub:'คู่มือ',col:'#ffd98a'});h.glow=[gl];h.gb=[3.8,3.0];}
  // 🔮 ลูกแก้วดาราศาสตร์ (ตั้งค่า) — หน้าขวา
  {const g=new THREE.Group();
    const ped=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.85,1.3,10),stone);ped.position.y=0.65;g.add(ped);const pc=new THREE.Mesh(new THREE.CylinderGeometry(0.75,0.55,0.18,10),gold);pc.position.y=1.38;g.add(pc);
    const sph=new THREE.Group();sph.position.y=2.6;g.add(sph);const arm=[];
    for(const [r,ax] of [[1.0,[0,0,0]],[0.82,[1.2,0,0]],[0.64,[0,0,1.2]]]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,0.04,8,64),gold);t.rotation.set(ax[0],ax[1],ax[2]);sph.add(t);arm.push({t,s:0.35+r*0.2,ax});}
    const orb=new THREE.Mesh(new THREE.SphereGeometry(0.3,20,16),new THREE.MeshBasicMaterial({color:hdr('#7ff0e0',2)}));sph.add(orb);
    const gl=new THREE.Sprite(glowMat('#7ff0e0',1.8));gl.scale.set(3.2,3.2,1);sph.add(gl);
    const moons=[];for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(0.08,10,8),gold);sph.add(m);moons.push({m,ph:i*2.1,r:0.7+i*0.16});}
    const x=6.0,z=4.6;g.position.set(x,0,z);S.add(g);MN.fx.arm={arm,moons,gl,fast:0};
    const h=mnHit('settings',{x,z,w:2.6,h:4,d:2.6,ay:4.6,sx:4.5,sz:3.4,icon:'🔮',name:'ลูกแก้วดาราศาสตร์',sub:'ตั้งค่า',col:'#7ff0e0'});h.glow=[gl];h.gb=[3.2,3.2];}
  // 🪞 กระจกวิเศษ (แต่งตัว / เลือกคาถา) — หลังขวา
  {const g=new THREE.Group(),glass=texCanvas(128,256,c=>{const r=c.createLinearGradient(0,0,0,256);r.addColorStop(0,'#1a2440');r.addColorStop(0.5,'#3a4a78');r.addColorStop(1,'#141a30');c.fillStyle=r;c.fillRect(0,0,128,256);for(let i=0;i<40;i++){c.fillStyle=`rgba(255,240,200,${Math.random()*0.5})`;c.fillRect(Math.random()*128,Math.random()*256,1.5,1.5);}});
    const surf=new THREE.Mesh(new THREE.PlaneGeometry(1.7,3.2),new THREE.MeshBasicMaterial({map:glass,color:hdr('#ffffff',1.1)}));surf.position.set(0,2.35,0.06);g.add(surf);
    const fr=new THREE.Mesh(new THREE.TorusGeometry(1.0,0.11,8,40),gold);fr.position.set(0,3.3,0.02);fr.scale.set(0.95,0.7,1);g.add(fr);
    for(const sx of [-1,1]){const side=new THREE.Mesh(new THREE.BoxGeometry(0.18,3.0,0.18),gold);side.position.set(sx*0.94,2.15,0.02);g.add(side);const claw=new THREE.Mesh(new THREE.SphereGeometry(0.16,10,8),gold);claw.position.set(sx*0.9,0.18,0.1);g.add(claw);}
    const base=new THREE.Mesh(new THREE.BoxGeometry(2.1,0.25,0.6),gold);base.position.set(0,0.65,0.02);g.add(base);const back=new THREE.Mesh(new THREE.BoxGeometry(2.0,3.6,0.08),wood);back.position.set(0,2.3,-0.06);g.add(back);
    const sh=new THREE.Mesh(new THREE.PlaneGeometry(1.7,3.2),new THREE.MeshBasicMaterial({color:hdr('#ffd98a',1.5),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));sh.position.set(0,2.35,0.08);g.add(sh);
    const gl=new THREE.Sprite(glowMat('#ffd98a',1.2));gl.scale.set(3.4,4.8,1);gl.position.set(0,2.4,0.3);g.add(gl);
    const x=7.2,z=-7.4;g.position.set(x,0,z);face(g,x,z);S.add(g);MN.fx.mirror={sh,gl,surf,fast:0};
    const h=mnHit('mirror',{x,z,w:2.4,h:4.2,d:1.2,ay:5.0,sx:5.4,sz:-5.5,icon:'🪞',name:'กระจกวิเศษ',sub:'แต่งตัว • เลือกคาถา',col:'#ffd98a'});h.glow=[gl];h.gb=[3.4,4.8];}
  // 🏆 ตู้ถ้วยรางวัล (เลเวล & สถิติ) — ขวา
  {const g=new THREE.Group(),cab=new THREE.Mesh(new THREE.BoxGeometry(2.6,3.6,0.9),wood);cab.position.y=1.8;g.add(cab);
    const inner=new THREE.Mesh(new THREE.PlaneGeometry(2.2,3.1),new THREE.MeshBasicMaterial({color:hdr('#ffd98a',0.45)}));inner.position.set(0,1.85,0.46);g.add(inner);
    const cupPts=[[0,0],[0.32,0],[0.3,0.06],[0.1,0.12],[0.08,0.4],[0.14,0.48],[0.36,0.62],[0.42,0.95],[0.4,1.0]].map(p=>new THREE.Vector2(p[0],p[1])),cupG=new THREE.LatheGeometry(cupPts,24);
    for(const [cx2,y,s] of [[-0.6,0.5,0.42],[0.6,0.5,0.42],[0,1.55,0.62],[-0.65,2.55,0.34],[0.65,2.55,0.34]]){const cp=new THREE.Mesh(cupG,gold);cp.scale.setScalar(s);cp.position.set(cx2,y+0.15,0.3);g.add(cp);}
    for(const y of [0.55,1.6,2.6]){const sh=new THREE.Mesh(new THREE.BoxGeometry(2.3,0.06,0.5),wood);sh.position.set(0,y,0.2);g.add(sh);}
    const doors=[];for(const sx of [-1,1]){const d=new THREE.Group();d.position.set(sx*1.1,1.85,0.47);const pane=new THREE.Mesh(new THREE.BoxGeometry(1.1,3.1,0.04),new THREE.MeshStandardMaterial({color:'#a8c4ff',transparent:true,opacity:0.18,roughness:0.05,metalness:0.2}));pane.position.x=-sx*0.55;d.add(pane);const fr=new THREE.Mesh(new THREE.BoxGeometry(0.08,3.1,0.06),gold);fr.position.x=-sx*1.06;d.add(fr);g.add(d);doors.push({d,sx});}
    const crown=new THREE.Mesh(new THREE.BoxGeometry(2.8,0.22,1.0),gold);crown.position.y=3.7;g.add(crown);
    const gl=new THREE.Sprite(glowMat('#ffd98a',1.4));gl.scale.set(3.8,4.4,1);gl.position.set(0,1.9,0.6);g.add(gl);
    const x=10.2,z=-0.6;g.position.set(x,0,z);face(g,x,z);S.add(g);MN.fx.trophy={doors,gl,open:0};
    const h=mnHit('trophy',{x,z,w:2.8,h:4,d:1.6,ay:4.8,sx:7.8,sz:-0.5,icon:'🏆',name:'ตู้ถ้วยรางวัล',sub:'เลเวล & สถิติ',col:'#ffd98a'});h.glow=[gl];h.gb=[3.8,4.4];}
  // 🎵 เครื่องเล่นแผ่นเสียง (เพลง) — หน้าซ้าย
  {const g=new THREE.Group(),tbl=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.7,1.1,10),wood);tbl.position.y=0.55;g.add(tbl);
    const box=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.35,1.1),wood);box.position.y=1.28;g.add(box);
    const rec=new THREE.Mesh(new THREE.CylinderGeometry(0.46,0.46,0.03,32),new THREE.MeshStandardMaterial({color:'#111',roughness:0.3,metalness:0.4}));rec.position.y=1.47;g.add(rec);
    const lab=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.035,16),new THREE.MeshBasicMaterial({color:'#a01c1c'}));lab.position.y=1.475;g.add(lab);
    const horn=new THREE.Mesh(new THREE.ConeGeometry(0.55,1.3,18,1,true),new THREE.MeshStandardMaterial({color:'#d9b45a',metalness:0.9,roughness:0.25,side:THREE.DoubleSide,emissive:'#3a2a08'}));horn.position.set(0.25,2.25,-0.15);horn.rotation.set(-0.9,0,-0.5);g.add(horn);
    const notes=[];for(let i=0;i<4;i++){const n=new THREE.Sprite(new THREE.SpriteMaterial({map:texCanvas(64,64,c=>{c.font='48px serif';c.fillStyle='#ffe9a8';c.textAlign='center';c.textBaseline='middle';c.fillText(i%2?'♪':'♫',32,34);}),transparent:true,depthWrite:false}));n.scale.setScalar(0.45);g.add(n);notes.push({n,ph:i/4});}
    const gl=new THREE.Sprite(glowMat('#ffd98a',1.2));gl.scale.set(2.8,2.8,1);gl.position.set(0,1.8,0);g.add(gl);
    const x=-6.0,z=4.6;g.position.set(x,0,z);face(g,x,z);S.add(g);MN.fx.gram={rec,notes,gl,fast:0};
    const h=mnHit('music',{x,z,w:2,h:3,d:2,ay:3.7,sx:-4.5,sz:3.4,icon:'🎵',name:'เครื่องเล่นแผ่นเสียง',sub:'เพลง',col:'#ffd98a'});h.glow=[gl];h.gb=[2.8,2.8];}
  // ============ ของเล่น ============
  // 🐈 แมวดำเดินเล่น
  {const c=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:'#15131a',roughness:0.8});
    const bd=new THREE.Mesh(new THREE.SphereGeometry(0.26,12,10),m);bd.scale.set(0.8,0.75,1.4);bd.position.y=0.36;c.add(bd);
    const hd=new THREE.Mesh(new THREE.SphereGeometry(0.17,12,10),m);hd.position.set(0,0.58,0.36);c.add(hd);
    for(const sx of [-1,1]){const ear=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.13,4),m);ear.position.set(sx*0.09,0.72,0.36);c.add(ear);const e=new THREE.Mesh(new THREE.SphereGeometry(0.03,8,6),new THREE.MeshBasicMaterial({color:hdr('#9fff7a',1.6)}));e.position.set(sx*0.065,0.6,0.5);c.add(e);}
    const legs=[];for(const [lx,lz] of [[-0.12,0.22],[0.12,0.22],[-0.12,-0.22],[0.12,-0.22]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.26,6),m);l.position.set(lx,0.13,lz);c.add(l);legs.push(l);}
    const tail=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.035,0.55,6),m);tail.position.set(0,0.55,-0.42);tail.rotation.x=-0.7;c.add(tail);
    c.position.set(3,0,3);S.add(c);
    const hit=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.9,1.1),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));S.add(hit);
    MN.fx.cat={c,legs,tail,hit,x:3,z:3,tx:3,tz:3,a:0,wait:2,sit:0,heart:null};MN.toys.push({id:'cat',mesh:hit});
    const ht=new THREE.Sprite(new THREE.SpriteMaterial({map:texCanvas(64,64,g=>{g.font='48px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('💜',32,34);}),transparent:true,depthWrite:false}));ht.scale.setScalar(0.5);ht.visible=false;S.add(ht);MN.fx.cat.heart=ht;}
  // ✨ ลูกสนิชบินวน
  {const sn=new THREE.Group(),ball=new THREE.Mesh(new THREE.SphereGeometry(0.13,14,12),gold);sn.add(ball);const ws=[];
    for(const sx of [-1,1]){const w=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.16),new THREE.MeshBasicMaterial({color:'#f6f2e6',transparent:true,opacity:0.85,side:THREE.DoubleSide}));w.geometry.translate(sx*0.21,0,0);sn.add(w);ws.push(w);}
    const gl=new THREE.Sprite(glowMat('#ffd86b',2));gl.scale.setScalar(0.9);sn.add(gl);S.add(sn);
    const hit=new THREE.Mesh(new THREE.SphereGeometry(0.7,8,6),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));S.add(hit);
    MN.fx.snitch={sn,ws,hit,caught:0,ph:Math.random()*6};MN.toys.push({id:'snitch',mesh:hit});}
  // ---- ป๊อปอัป (ม้วนกระดาษ) + ปุ่มเมนูปกติ + คำแนะนำ ----
  const pop=document.createElement('div');pop.id='mnPop';pop.className='hidden';document.body.appendChild(pop);
  const lg=document.querySelector('.mleft .logo-th');
  const tog=document.createElement('button');tog.id='mnNavTog';tog.textContent='☰ เมนูปกติ';tog.onclick=()=>{MN.nav=!MN.nav;document.body.classList.toggle('navOpen',MN.nav);};
  if(lg)lg.insertAdjacentElement('afterend',tog);
  const hint=document.createElement('div');hint.id='mnHint';hint.innerHTML='<b>WASD</b> เดิน • <b>คลิก</b>ที่ของ = วิ่งไปใช้ • <b>E</b> ใช้ของตรงหน้า';document.body.appendChild(hint);
  const toast=document.createElement('div');toast.id='mnToast';document.body.appendChild(toast);
  const st=document.createElement('style');st.textContent=`
body.menu3d .mnav,body.menu3d .mleft .orn{display:none}body.menu3d.navOpen .mnav{display:flex}body.menu3d.navOpen .mleft .orn{display:block}
body.menu3d:not(.navOpen) .mleft{position:absolute;left:0;top:0;height:auto;pointer-events:none;background:none;width:auto;padding:26px 38px}body.menu3d:not(.navOpen) .mleft::after{display:none}
body.menu3d:not(.navOpen) .mleft .mSigil{display:none}body.menu3d .mleft .logo-en{font-size:clamp(34px,4.2vw,60px)}
body.menu3d .mleft button,body.menu3d .mleft input,body.menu3d .mleft .mnav{pointer-events:auto}
body.menu3d:not(.navOpen) .mprof{display:none}   /* แต่งตัว/ชื่อ ย้ายไปอยู่ที่กระจกวิเศษ */
#mnPop .mnN{display:flex;align-items:center;gap:8px;margin:4px 0 10px;font:600 13px Kanit,sans-serif;color:#6a4a20}#mnPop .mnN input{flex:1;min-width:0;padding:7px 10px;font:600 16px Kanit,sans-serif;color:#2a1a08;background:rgba(255,255,255,.55);border:1px solid rgba(120,80,20,.45);border-radius:4px;outline:none}
#mnNavTog{margin:10px 0 0;padding:5px 12px;font:600 12px Kanit,sans-serif;color:rgba(255,255,255,.7);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.18);border-radius:6px;cursor:pointer;display:none;align-self:flex-start}
body.menu3d #mnNavTog{display:block}#mnNavTog:hover{color:#fff;border-color:rgba(243,220,148,.6)}
#mnHint{display:none;position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:3;padding:7px 16px;font:500 13px Kanit,sans-serif;color:rgba(255,240,210,.85);background:rgba(6,8,20,.55);border:1px solid rgba(217,180,90,.3);border-radius:20px;pointer-events:none;white-space:nowrap}
#mnHint b{color:#ffd86b}body.menu3d #mnHint{display:block}
#mnToast{position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:7;font:700 22px Kanit,sans-serif;color:#ffe9a8;text-shadow:0 2px 8px #000,0 0 18px rgba(255,200,80,.7);opacity:0;pointer-events:none;transition:opacity .3s}
#mnPop{position:fixed;top:50%;width:min(360px,calc(100vw - 32px));z-index:6;padding:30px 26px 22px;color:#2a1a08;
  background:radial-gradient(ellipse at 50% 40%,#f6e9c8,#e7d3a2 70%,#cdb27a);border-radius:6px;box-shadow:0 18px 50px rgba(0,0,0,.55),inset 0 0 40px rgba(120,80,20,.35);
  transform-origin:50% 0;animation:mnUnroll .5s cubic-bezier(.2,1.1,.3,1) both}
#mnPop::before,#mnPop::after{content:'';position:absolute;left:-10px;right:-10px;height:18px;border-radius:9px;background:linear-gradient(180deg,#8a5a2a,#c08a4a 45%,#6a4018);box-shadow:0 3px 8px rgba(0,0,0,.4)}
#mnPop::before{top:-9px}#mnPop::after{bottom:-9px}
#mnPop.hidden{display:none}@keyframes mnUnroll{from{clip-path:inset(0 0 100% 0);transform:translateY(-50%) scaleY(.4)}to{clip-path:inset(0 0 0 0);transform:translateY(-50%) scaleY(1)}}
#mnPop h2{margin:0 0 4px;font:700 24px "Cinzel Decorative",Cinzel,serif;color:#5a2e0a;letter-spacing:1px}#mnPop p{margin:0 0 12px;font:400 13px Kanit,sans-serif;color:#6a4a20}
#mnPop button.mnB{display:block;width:100%;text-align:left;margin:7px 0;padding:10px 14px;font:600 17px Kanit,sans-serif;color:#2a1a08;background:rgba(255,255,255,.35);border:1px solid rgba(120,80,20,.4);border-radius:4px;cursor:pointer;transition:transform .15s,background .2s,border-color .2s}
#mnPop button.mnB:hover{transform:translateX(4px);background:rgba(255,250,235,.75);border-color:#8a5a1a}#mnPop button.mnB small{display:block;font:400 12px Kanit,sans-serif;color:#7a5a30;margin-top:1px}
#mnPop .mnJ{display:flex;gap:8px;margin:7px 0}#mnPop .mnJ input{flex:1;min-width:0;padding:10px 12px;font:700 19px Kanit,sans-serif;letter-spacing:5px;text-transform:uppercase;color:#2a1a08;background:rgba(255,255,255,.55);border:1px solid rgba(120,80,20,.45);border-radius:4px;outline:none}
#mnPop .mnJ input:focus{border-color:#8a2a1a;background:#fffaf0}#mnPop .mnJ button{padding:0 16px;font:700 15px Kanit,sans-serif;color:#fff4dc;background:linear-gradient(180deg,#a03a1a,#6a1c0a);border:none;border-radius:4px;cursor:pointer}
#mnPop .mnX{position:absolute;right:8px;top:10px;width:28px;height:28px;font:700 16px sans-serif;color:#7a5a30;background:none;border:none;cursor:pointer}#mnPop .mnX:hover{color:#2a1a08}`;document.head.appendChild(st);
  pop.addEventListener('click',e=>{
    if(e.target.closest('.mnX')){mnClose();return;}
    const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
    if(a==='join'){const v=($('#mnCode').value||'').trim();if(v.length!==5){$('#mnCode').focus();return;}$('#codeIn').value=v;mnClose();$('#btnJoin').click();return;}
    if(a==='mtoggle'){try{ac();toggleMusic();}catch(err){}return;}
    const M={solo:'#btnSolo',host:'#btnHost',guide:'#btnGuide',prog:'#btnProg',music:'#btnMyMusic',settings:'#btnSettings',look:'#btnLook',kit:'#btnKit'};
    mnClose();const el=M[a]&&$(M[a]);if(el)el.click();});
  pop.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'&&e.target.id==='mnCode')pop.querySelector('[data-act=join]').click();});
}
const MNPOP={
  play:`<button class="mnX">✕</button><h2>🌀 ประตูเวท</h2><p>เลือกเส้นทางที่จะก้าวผ่าน</p>
    <button class="mnB" data-act="solo">⚔️ เล่นคนเดียว<small>ไม่ต้องใช้อินเทอร์เน็ต • ห้องฝึก / โหมดต่าง ๆ</small></button>
    <button class="mnB" data-act="host">🌐 สร้างห้องออนไลน์<small>ได้รหัสห้อง / ลิงก์เชิญ ไปส่งให้เพื่อน</small></button>`,
  join:`<button class="mnX">✕</button><h2>🦉 จดหมายเชิญ</h2><p>ใส่รหัสห้อง 5 ตัวจากเพื่อน แล้วนกฮูกจะพาไป</p>
    <div class="mnJ"><input id="mnCode" maxlength="5" placeholder="รหัสห้อง" autocomplete="off"><button data-act="join">เข้าร่วม</button></div>`,
  book:`<button class="mnX">✕</button><h2>📖 หนังสือเวท</h2><p>ตำราของพ่อมดมือใหม่</p>
    <button class="mnB" data-act="guide">📜 คู่มือ<small>วิธีเล่น / ปุ่มกด / เล่นกับเพื่อน</small></button>
    <button class="mnB" data-act="kit">✨ วิธีเล่นแต่ละสาย<small>เลือกสายแล้วกด 📖 วิธีเล่นสายนี้</small></button>`,
  settings:`<button class="mnX">✕</button><h2>🔮 ลูกแก้วดาราศาสตร์</h2><p>ปรับเกมให้ถูกใจ</p>
    <button class="mnB" data-act="settings">⚙️ ตั้งค่า<small>เมาส์ / เสียง / กราฟิก / ปุ่มกด / ภาพ</small></button>`,
  mirror:`<button class="mnX">✕</button><h2>🪞 กระจกวิเศษ</h2><p>กระจกสะท้อนตัวตนที่แท้จริงของคุณ</p>
    <label class="mnN">ชื่อ<input id="mnName" maxlength="16" autocomplete="off"></label>
    <button class="mnB" data-act="look">🎭 แต่งตัวละคร / เลือกบ้าน<small>หน้าตา ผม เสื้อคลุม ไม้กายสิทธิ์</small></button>
    <button class="mnB" data-act="kit">📚 เลือกสาย & คาถา<small>ไฟ / น้ำแข็ง / สายฟ้า / ดิน</small></button>`,
  trophy:`<button class="mnX">✕</button><h2>🏆 ตู้ถ้วยรางวัล</h2><p>เกียรติยศของคุณ</p>
    <button class="mnB" data-act="prog">📈 เลเวล & สถิติ<small>XP • ชนะ-แพ้ • ของปลดล็อค</small></button>`,
  music:`<button class="mnX">✕</button><h2>🎵 เครื่องเล่นแผ่นเสียง</h2><p>เพลงประกอบการผจญภัย</p>
    <button class="mnB" data-act="mtoggle">⏯️ เปิด / ปิดเพลง<small>ปุ่มลัดในเกม: M</small></button>
    <button class="mnB" data-act="music">💿 เพลงของฉัน<small>เลือกไฟล์เพลงในเครื่อง (เล่นแค่ในเครื่องคุณ)</small></button>`};
function mnToast(t){const el=$('#mnToast');if(!el)return;el.textContent=t;el.style.opacity=1;clearTimeout(MN.toT);MN.toT=setTimeout(()=>el.style.opacity=0,1600);}
// ---- สั่งพ่อมด ----
function mnGo(h){   // วิ่งไปที่จุดยืนของของ แล้วใช้
  if(MN.focus)return;const W=MN.w;W.tx=h.stand.x;W.tz=h.stand.z;W.go=h;W.act=null;try{snd('tick',{vol:0.3});}catch(e){}
}
function mnWalkTo(x,z){const W=MN.w,l=Math.hypot(x,z);if(l>MN_R){x*=MN_R/l;z*=MN_R/l;}W.tx=x;W.tz=z;W.go=null;}
function mnUse(h){   // ถึงแล้ว: หันหา ร่ายไม้ ของทำงาน แล้วเปิดเมนู
  const W=MN.w;W.tx=W.tz=null;W.go=null;W.act=h;W.actT=0;
  const o=STAGE.chars.get('me-preview');if(o)castStart(o,'',1);
  try{mnTone(h.id==='join'?'hoot':'whoosh');}catch(e){}
}
function mnClose(){
  const W=MN.w;MN.focus=null;MN.popFor='';W.act=null;const p=$('#mnPop');if(p)p.classList.add('hidden');
  const O=MN.fx.owl;if(O&&O.st!=='perch'){O.st='back';O.t=0;}
}
// ---- เมาส์ / คีย์บอร์ด ----
const MN_BLOCK='.mleft button,.mleft input,.mleft .mnav,.mprof,.mnews,.mver,.card,.overlay:not(.hidden),#mnPop,button,input,select,textarea';
function mnRay(e){const r=gl.domElement.getBoundingClientRect();MN.ray.setFromCamera({x:((e.clientX-r.left)/r.width)*2-1,y:-((e.clientY-r.top)/r.height)*2+1},cam);}
function mnPick(e){
  if(!MN.rp)return;
  if(MN.focus||(e.target.closest&&e.target.closest(MN_BLOCK))){mnHot(null);return;}
  mnRay(e);const all=MN.hits.map(h=>h.mesh).concat(MN.toys.map(t=>t.mesh)),hs=MN.ray.intersectObjects(all,false);
  if(!hs.length){mnHot(null);return;}const m=hs[0].object;mnHot(MN.hits.find(h=>h.mesh===m)||MN.toys.find(t=>t.mesh===m)||null);
}
function mnHot(h){if(h===MN.hot)return;MN.hot=h;document.body.style.cursor=h?'pointer':'';}
addEventListener('mousemove',mnPick);
addEventListener('click',e=>{
  if(!MN.rp||MN.focus)return;if(e.target.closest&&e.target.closest(MN_BLOCK))return;
  mnPick(e);const h=MN.hot;
  if(h&&h.stand){mnGo(h);return;}
  if(h&&h.id){mnToy(h);return;}
  mnRay(e);const g=MN.ray.intersectObject(MN.ground,false)[0];if(g)mnWalkTo(g.point.x,g.point.z);   // คลิกพื้น = เดินไป
});
addEventListener('keydown',e=>{
  if(!MN.rp)return;if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;
  if(e.key==='Escape'&&MN.focus){mnClose();return;}
  if(MN.focus)return;
  const k=e.code;if(k==='KeyW'||k==='KeyA'||k==='KeyS'||k==='KeyD'||k.startsWith('Arrow')){MN.w.keys[k]=1;MN.w.tx=MN.w.tz=null;MN.w.go=null;}
  if(k==='KeyE'&&MN.near)mnUse(MN.near);
});
addEventListener('keyup',e=>{delete MN.w.keys[e.code];});
addEventListener('blur',()=>{MN.w.keys={};});
function mnToy(t){const F=MN.fx;
  if(t.id==='cat'){const C=F.cat;C.sit=2.2;C.wait=2.5;try{mnTone('meow');}catch(e){}C.heart.visible=true;C.hT=0;}
  else if(t.id==='snitch'){if(F.snitch.caught<=0){F.snitch.caught=9;mnToast('✨ จับลูกสนิชได้! +150 แต้ม (ในใจ)');try{snd('buff',{vol:0.6});}catch(e){}}}
  else if(t.id==='fire'){t.fl.boost=1;try{mnTone('whoosh');}catch(e){}}
}
// ---- เรนเดอร์ (เรียกจาก renderStage js/32 — คืน true = จัดการแล้ว) ----
function mnRestore(){
  if(cam.fov!==SET.fov){cam.fov=SET.fov;cam.updateProjectionMatrix();}
  if(STAGE.mfx&&STAGE.mfx.parent!==stage)stage.add(STAGE.mfx);
  for(const o of STAGE.chars.values())if(o.g.parent!==stage){stage.add(o.g);o.g.position.set(0,STAGE_Y,0);}
  MN.rp=null;if(MN.focus)mnClose();MN.w.keys={};document.body.classList.remove('menu3d');document.body.style.cursor='';
}
function mnMenuRender(dt,now){
  if(!MN.enabled||screen!=='menu'||crOpen){if(MN.built)mnRestore();return false;}
  try{mnBuild();}catch(e){console.error('menu3d',e);MN.enabled=false;document.body.classList.remove('menu3d');if(MN.built)mnRestore();return false;}
  document.body.classList.add('menu3d');MN.rp=true;
  const t=now/1000,F=MN.fx,W=MN.w;dt=Math.min(dt,0.05);
  if(STAGE.mfx.parent===MENUS)stage.add(STAGE.mfx);   // เอฟเฟกต์เมนูเดิม (วงแสงรอบตัว) ไม่ใช้ในลานนี้
  const o=stageChar('me-preview',lookStr(myLook));if(o.g.parent!==MENUS)MENUS.add(o.g);
  for(const [id,c] of STAGE.chars)if(id!=='me-preview'&&c.g.parent===MENUS)stage.add(c.g);
  // ---- เดิน: WASD (เทียบกล้อง) หรือไปหาจุดหมาย ----
  let mx=0,mz=0;const K=W.keys;
  if(K.KeyW||K.ArrowUp)mz-=1;if(K.KeyS||K.ArrowDown)mz+=1;if(K.KeyA||K.ArrowLeft)mx-=1;if(K.KeyD||K.ArrowRight)mx+=1;
  if(!mx&&!mz&&W.tx!==null){const dx=W.tx-W.x,dz=W.tz-W.z,d=Math.hypot(dx,dz);if(d<0.12){W.tx=W.tz=null;if(W.go)mnUse(W.go);}else{mx=dx/d;mz=dz/d;}}
  const ml=Math.hypot(mx,mz),SPD=4.6;
  if(ml>0&&!W.act){mx/=ml;mz/=ml;W.x+=mx*SPD*dt;W.z+=mz*SPD*dt;const l=Math.hypot(W.x,W.z);if(l>MN_R){W.x*=MN_R/l;W.z*=MN_R/l;}
    const ta=Math.atan2(mx,mz);let da=ta-W.a;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;W.a+=da*Math.min(1,dt*12);W.sp+=(SPD-W.sp)*Math.min(1,dt*10);}
  else W.sp+=(0-W.sp)*Math.min(1,dt*10);
  if(W.act){const a=Math.atan2(W.act.x-W.x,W.act.z-W.z);let da=a-W.a;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;W.a+=da*Math.min(1,dt*10);}
  // ใกล้ของไหน (ขึ้น [E])
  MN.near=null;if(!W.act&&!MN.focus){let bd=2.3;for(const h of MN.hits){const d=Math.hypot(h.stand.x-W.x,h.stand.z-W.z);if(d<bd){bd=d;MN.near=h;}}}
  // ตัวพ่อมด
  o.x=W.x;o.g.position.set(W.x,Math.hypot(W.x,W.z)<2.8?0.22:0,W.z);   // ยืนบนแท่นกลาง = สูงขึ้นนิดo.g.rotation.y=W.a;o.g.visible=true;o.g.scale.setScalar(1);
  const ws=W.sp/SPD;
  if(ws>0.05){o.walk=(o.walk||0)+dt*W.sp*2.3;const s=Math.sin(o.walk)*ws;
    o.b.rotation.set(0.08*ws,0,0);o.b.position.y=Math.abs(Math.cos(o.walk))*0.07*ws;o.legs[0].rotation.x=s*0.75;o.legs[1].rotation.x=-s*0.75;
    o.armR.rotation.x=-s*0.55-0.15;o.armR.rotation.z=-0.12;o.armL.rotation.x=s*0.55-0.1;o.armL.rotation.z=0.12;o.tip.scale.setScalar(0.3);
    updateCloth(o.cloak,0,W.sp,W.sp,now,dt);o.broom.visible=o.cocoon.visible=o.shield.visible=o.stars.visible=false;if(o.anim)animTick(o,{sp:W.sp},dt);if(o.rig){rigStage(o);rigSync(o,dt);}}
  else{o.b.rotation.y=0;stageIdle(o,now,dt,0);}
  castPose(o,{id:NET.myId,fl:false,dn:false,sh:false},{sp:W.sp},dt,now);   // ท่าร่ายไม้ตอนใช้ของ (castStart ใน mnUse)
  if(o.ring){o.ring.visible=true;o.ring.material.color.set('#f3dc94');o.ring.material.opacity=0.7;}
  // ---- ใช้ของ: ของทำงาน 0.7 วิ แล้วเปิดเมนู ----
  if(W.act){W.actT+=dt;const h=W.act;
    if(W.actT>0.55&&!MN.focus){MN.focus=h.id;MN.fT=0;}
  }
  // ---- ของในลานเคลื่อนไหว ----
  F.rune.rotation.z=t/12;
  for(const q of F.orbs)q.o.position.y=q.y+Math.sin(t*0.8+q.ph)*0.3;
  for(const f of F.flames){f.boost=Math.max(0,f.boost-dt*1.2);const s=(0.9+0.16*Math.sin(t*11+f.ph)+0.1*Math.sin(t*23+f.ph*2))*(1+f.boost*1.6);f.a.scale.set(1.2*(1+f.boost),1.9*s,1);f.b.scale.set(0.6*(1+f.boost*0.6),1.0*(1.1-s*0.2+f.boost),1);if(f.L)f.L.intensity=1.1*(1+f.boost*2);}
  {const P=F.portal,on=MN.focus==='play'||(W.act&&W.act.id==='play');P.disc.rotation.z=-t*(on?2.2:0.5);P.rings[0].rotation.z=t*(on?3:0.9);P.rings[1].rotation.z=-t*(on?3.5:1.3);P.gl.material.opacity=0.8+0.2*Math.sin(t*2.1);P.L.intensity=(on?4:2.2)+0.5*Math.sin(t*2.6);P.disc.scale.set(on?1.12:1,on?1.74:1.55,1);}
  {const B=F.book,on=MN.focus==='book'||(W.act&&W.act.id==='book');B.bk.position.y=2.0+Math.sin(t*1.2)*0.08+(on?0.25:0);B.bk.rotation.y=Math.sin(t*0.5)*0.12;
    const u=(t*(on?1.6:0.35))%1,a=lerp(0.2,Math.PI-0.2,_cs(Math.min(1,u*2)));B.flip.rotation.set(-1.05,u<0.5?-a*0.5:0,0);B.flip.visible=u<0.5;
    for(const q of B.runes){const a2=t*(on?2.4:0.9)+q.ph;q.r.position.set(Math.cos(a2)*1.2,2.1+Math.sin(a2*1.7)*0.35,Math.sin(a2)*0.8);q.r.material.opacity=0.6+0.4*Math.sin(t*3+q.ph);}}
  {const A=F.arm,on=MN.focus==='settings'||(W.act&&W.act.id==='settings'),m=on?4:1;for(const q of A.arm){q.t.rotation.x=q.ax[0]+t*q.s*m*(q.ax[0]?1:0.4);q.t.rotation.y=q.ax[1]+t*q.s*0.5*m;q.t.rotation.z=q.ax[2]+t*q.s*m*(q.ax[2]?1:0.3);}
    for(const q of A.moons){const a=t*0.8*m+q.ph;q.m.position.set(Math.cos(a)*q.r,Math.sin(a*1.3)*0.4,Math.sin(a)*q.r);}}
  {const M=F.mirror,on=MN.focus==='mirror'||(W.act&&W.act.id==='mirror');M.fast+=((on?1:0)-M.fast)*Math.min(1,dt*4);M.sh.material.opacity=0.08+0.5*M.fast+0.05*Math.sin(t*2);M.surf.material.color.copy(hdr('#ffffff',1.1+0.6*M.fast));}
  {const T=F.trophy,on=MN.focus==='trophy'||(W.act&&W.act.id==='trophy');T.open+=((on?1:0)-T.open)*Math.min(1,dt*4);for(const q of T.doors)q.d.rotation.y=q.sx*T.open*1.4;T.gl.material.opacity=0.7+0.3*T.open;}
  {const G=F.gram,on=MN.focus==='music'||(W.act&&W.act.id==='music');G.rec.rotation.y=t*(on?6:2);for(const q of G.notes){const u=(t*(on?0.9:0.4)+q.ph)%1;q.n.position.set(0.3+Math.sin(u*6+q.ph*6)*0.4,2.3+u*1.6,-0.2);q.n.material.opacity=Math.sin(u*Math.PI)*(on?1:0.6);}}
  // 🦉 นกฮูก: เกาะคอน (หันหัว กระพริบ) • ถูกใช้ = บินมาหาพ่อมด ถือจดหมาย • ปิดเมนู = บินกลับ
  {const O=F.owl,on=(W.act&&W.act.id==='join')||MN.focus==='join';O.t+=dt;
    if(on&&O.st==='perch'){O.st='go';O.t=0;try{mnTone('hoot');}catch(e){}}
    const tgt=_mv.set(W.x+Math.sin(W.a)*0.9,2.9,W.z+Math.cos(W.a)*0.9),wp=O.grp.worldToLocal(tgt.clone());
    if(O.st==='perch'){O.owl.position.set(0,2.95,0);O.hd.rotation.y=Math.sin(t*0.7)*0.9;O.owl.rotation.set(0,0,0);for(const w of O.wings)w.rotation.z=0;O.letter.visible=false;}
    else{const fly=O.st==='go'?Math.min(1,O.t/0.9):O.st==='back'?1-Math.min(1,O.t/0.9):1;if(O.st==='go'&&fly>=1)O.st='hover';if(O.st==='back'&&O.t>=0.9)O.st='perch';
      const e=_cs(fly);O.owl.position.set(lerp(0,wp.x,e),lerp(2.95,wp.y,e)+Math.sin(fly*Math.PI)*1.6+Math.sin(t*6)*0.05,lerp(0,wp.z,e));O.owl.rotation.y=Math.atan2(wp.x,wp.z)*(O.st==='back'?-1:1)*0.6;
      for(const [i,w] of O.wings.entries())w.rotation.z=(i?-1:1)*(0.3+Math.sin(t*22)*0.9);O.letter.visible=O.st!=='back';}}
  // 🐈 แมว: เดินไปจุดสุ่ม → นั่ง → เดินต่อ
  {const C=F.cat;if(C.sit>0)C.sit-=dt;else{const dx=C.tx-C.x,dz=C.tz-C.z,d=Math.hypot(dx,dz);
      if(d<0.1){C.wait-=dt;if(C.wait<=0){const a=Math.random()*Math.PI*2,r=rnd(3.5,8.5);C.tx=Math.cos(a)*r;C.tz=Math.sin(a)*r;C.wait=rnd(1.5,4);}}
      else{C.x+=dx/d*1.3*dt;C.z+=dz/d*1.3*dt;C.a=Math.atan2(dx,dz);}}
    const walking=C.sit<=0&&Math.hypot(C.tx-C.x,C.tz-C.z)>0.1;C.c.position.set(C.x,0,C.z);C.c.rotation.y=C.a;C.legs.forEach((l,i)=>l.rotation.x=walking?Math.sin(t*12+(i%2?0:Math.PI)+(i>1?Math.PI/2:0))*0.5:0);
    C.tail.rotation.z=Math.sin(t*3)*0.4;C.c.scale.y=C.sit>0?0.85:1;C.hit.position.set(C.x,0.45,C.z);
    if(C.heart.visible){C.hT=(C.hT||0)+dt;C.heart.position.set(C.x,1.0+C.hT*0.8,C.z);C.heart.material.opacity=Math.max(0,1-C.hT/1.5);if(C.hT>1.5)C.heart.visible=false;}}
  // ✨ สนิช: บินเป็นเลข 8 รอบลาน • จับได้ = หาย 9 วิ แล้วกลับมา
  {const N=F.snitch;N.caught=Math.max(0,N.caught-dt);const a=t*0.55+N.ph;
    N.sn.position.set(Math.sin(a)*7.5,3.4+Math.sin(a*2.3)*1.0,Math.sin(a*2)*3.5-1);N.sn.visible=N.caught<=0;N.hit.position.copy(N.sn.position);N.hit.visible=N.caught<=0;
    N.ws.forEach((w,i)=>w.rotation.y=(i?-1:1)*Math.sin(t*40)*0.9);N.sn.rotation.y=Math.atan2(Math.cos(a)*7.5,Math.cos(a*2)*7)+Math.PI;}
  // ฉาก
  F.stars.material.opacity=0.85+0.1*Math.sin(t*1.1);
  for(const m of F.mist)m.m.position.x=m.x+Math.sin(t*0.12+m.ph)*3;
  {const fl=F.fly,s=fl.seed;for(let i=0;i<s.length;i++){const q=s[i],h=(q[1]+t*q[4])%9.5;fl.pos[i*3]=q[0]+Math.sin(t*0.4+q[3])*0.9;fl.pos[i*3+1]=h+0.3;fl.pos[i*3+2]=q[2]+Math.cos(t*0.35+q[3])*0.9;}fl.pts.geometry.attributes.position.needsUpdate=true;}
  {const S=MN.shoot,sh=F.shoot;if(S.t<0&&Math.random()<dt/6){S.t=0;S.x=rnd(-50,20);S.y=rnd(50,80);S.z=-85;}if(S.t>=0){S.t+=dt;const k=S.t/1.1;sh.visible=k<1;sh.position.set(S.x+k*60,S.y-k*26,S.z);sh.material.rotation=0.4;sh.material.opacity=Math.sin(Math.min(1,k)*Math.PI);if(k>=1)S.t=-1;}}
  for(const h of MN.hits){const on=MN.hot===h||MN.near===h||MN.focus===h.id;h.k+=((on?1:0)-h.k)*Math.min(1,dt*10);for(const g of h.glow){g.scale.set(h.gb[0]*(1+0.2*h.k),h.gb[1]*(1+0.2*h.k),1);g.material.opacity=0.75+0.25*h.k;}}
  // ---- กล้อง: ตามพ่อมดหลวม ๆ • เปิดเมนู = ถ่ายของ + พ่อมดจากด้านข้าง ----
  if(cam.fov!==MN_FOV){cam.fov=MN_FOV;cam.updateProjectionMatrix();}
  const u=STAGE.introT<0?0:Math.min(1,STAGE.introT),e=1-Math.pow(1-u,3);if(STAGE.introT>=0&&STAGE.introT<1)STAGE.introT+=dt/2.8;
  const fx=W.x*0.55,fz=W.z*0.45;
  const ka=Math.max(1,1.85/cam.aspect);   // จอแคบ (เช่น 4:3) = ถอยกล้องให้เห็นของครบวง
  let pp=_mcp.set(lerp(2,fx+Math.sin(t/6)*0.4,e),lerp(16,7.4*ka,e),lerp(30,fz+13.8*ka,e)),ll=_mcl.set(lerp(0,fx,e),lerp(3,1.2,e),lerp(-4,fz-2.2,e));
  const foc=MN.focus&&MN.hits.find(h=>h.id===MN.focus);
  if(foc){MN.fT+=dt;const ox=foc.x,oz=foc.z,cx2=(ox+W.x)/2,cz2=(oz+W.z)/2,dx=-ox,dz=-oz,dl=Math.hypot(dx,dz)||1,nx=dx/dl,nz=dz/dl;
    const side=ox>=0?1:-1;   // ของอยู่ขวา = กล้องเยื้องให้ของอยู่ซ้ายจอ (เมนูอยู่ขวา) และกลับกัน
    pp=_mcp.set(cx2+nx*6.5+nz*side*2.2,3.6,cz2+nz*6.5-nx*side*2.2);ll=_mcl.set(cx2-nz*side*1.4,2.0,cz2+nx*side*1.4);}
  const C=MN.cam;if(!C.init){C.p.copy(pp);C.l.copy(ll);C.init=true;}const k=1-Math.exp(-(foc?3.2:3.0)*dt);C.p.lerp(pp,k);C.l.lerp(ll,k);
  cam.position.copy(C.p);cam.lookAt(C.l);if(window.__stageCam)window.__stageCam(cam);
  // ---- เปิดเมนูเมื่อกล้องเกือบถึง (ม้วนกระดาษอยู่ฝั่งตรงข้ามกับของบนจอ) ----
  if(foc&&!MN.popFor&&MN.fT>0.6){MN.popFor=foc.id;const p=$('#mnPop');p.innerHTML=MNPOP[foc.id]||'';
    _mv.set(foc.x,2,foc.z).project(cam);const left=_mv.x>0;p.style.left=left?'max(24px,6vw)':'auto';p.style.right=left?'auto':'max(24px,6vw)';
    const nm=p.querySelector('#mnName');if(nm){nm.value=$('#nameIn').value;nm.addEventListener('input',()=>{$('#nameIn').value=nm.value;try{store('wd_name',cleanName(nm.value));}catch(e){}});}   // แก้ชื่อในกระจก = ช่องชื่อเดิม
    p.classList.remove('hidden');p.style.animation='none';void p.offsetWidth;p.style.animation='';const inp=p.querySelector('input');if(inp)setTimeout(()=>inp.focus(),300);}
  rpass.scene=MENUS;gl.shadowMap.needsUpdate=true;composer.render();rpass.scene=scene;
  // ---- ป้ายชื่อเหนือของ (2D) ----
  cx.save();cx.textAlign='center';cx.textBaseline='middle';
  for(const h of MN.hits){if(MN.focus)break;_mv.copy(h.anchor);_mv.y+=Math.sin(t*1.5+h.x)*0.08;_mv.project(cam);if(_mv.z>1)continue;
    const x=(_mv.x+1)/2*SW,y=(1-_mv.y)/2*SH,hk=h.k,near=MN.near===h,l1=h.icon+' '+h.name,l2=near?'กด E หรือคลิก — '+h.sub:h.sub;
    cx.font='700 15px Kanit,sans-serif';const w1=cx.measureText(l1).width;cx.font='500 12px Kanit,sans-serif';const w=Math.max(w1,cx.measureText(l2).width)+30+hk*10,H=near?52:42;
    cx.globalAlpha=0.72+0.28*hk;cx.fillStyle=`rgba(8,10,24,${0.6+0.25*hk})`;cx.strokeStyle=near?'#ffd86b':`rgba(243,220,148,${0.45+0.5*hk})`;cx.lineWidth=1+hk;
    cx.beginPath();if(cx.roundRect)cx.roundRect(x-w/2,y-H/2,w,H,9);else cx.rect(x-w/2,y-H/2,w,H);cx.fill();cx.stroke();
    cx.font='700 15px Kanit,sans-serif';cx.fillStyle=hk>0.5?'#fff4cc':'#fff';cx.fillText(l1,x,y-(near?10:7));
    cx.font='500 12px Kanit,sans-serif';cx.fillStyle=near?'#ffd86b':'rgba(232,196,104,.85)';cx.fillText(l2,x,y+(near?12:10));}
  cx.restore();
  return true;
}
