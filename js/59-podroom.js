// =====================================================================
//  ห้องโถงใหญ่ฮอกวอตส์สำหรับโพเดียม (ผู้ใช้ 2026-10-22 "design me a new lobby for background … has more object in it")
//  ฉากแยก PODS (ไม่ใช่ล็อบบี้ `stage`) — สร้างครั้งแรกตอนขึ้นโพเดียม (podRoomBuild) • js/55 ย้ายแท่น+ตัวละครเข้ามาเรนเดอร์
//  มีอะไร: พื้นหินปูพรมแดงขอบทอง • เสาหิน 2 แถว + คบเพลิง (เปลวสั่น) + ธงบ้านทั้ง 4 • โต๊ะยาว 4 ตัว (ม้านั่ง จานทอง ถ้วย เทียน) •
//    หน้าต่างโค้งสูงทั้ง 2 ข้าง + ลำแสงจันทร์ • หน้าต่างกระจกสีใหญ่ผนังหลัง + ตราโล่ + ธงคู่ • เทียนลอย ~140 เล่ม + โคมระย้า 3 ชุด •
//    ตู้โชว์ถ้วยทอง 2 ตู้ • ชุดเกราะ 4 ตัว • ท้องฟ้าดาวเปิดข้างบน (เพดานมนตร์) • แท่นกลมขอบทอง + วงรูน • กระดาษสีทองโปรยลงมา
//  แสง: สปอตหลักเหนือแท่น (เงา) + คบเพลิง 4 ดวง (point light) + แสงขอบฟ้าเย็น • ⚠ ตำแหน่ง/สี/จำนวนของทั้งหมด Claude ออกแบบเอง
// =====================================================================
const PODS=new THREE.Scene();
PODS.background=new THREE.Color('#05070f');PODS.fog=new THREE.Fog('#070a18',20,64);
const PODR={built:false,candles:[],flames:[],rune:null,conf:null,confV:null,stars:null,beams:[],chand:[]};
function podRoomBuild(){
  if(PODR.built)return;PODR.built=true;
  const S=PODS,gold=new THREE.MeshStandardMaterial({color:'#d9b45a',metalness:0.9,roughness:0.28,emissive:'#3a2a08'});
  const wood=(()=>{const t=texCanvas(256,128,g=>{g.fillStyle='#5a3a22';g.fillRect(0,0,256,128);for(let i=0;i<26;i++){g.fillStyle=`rgba(${20+Math.random()*30|0},${10+Math.random()*16|0},6,${0.18+Math.random()*0.22})`;g.fillRect(0,Math.random()*128,256,1+Math.random()*3);}for(let i=0;i<4;i++){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,i*32,256,1.5);}});t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;})();
  const woodM=(rx,ry)=>{const t=wood.clone();t.needsUpdate=true;t.repeat.set(rx,ry);return new THREE.MeshStandardMaterial({map:t,roughness:0.75,color:'#b89270'});};
  const steel=new THREE.MeshStandardMaterial({color:'#8a92a8',metalness:0.85,roughness:0.38});
  // ---- แสง ----
  S.add(new THREE.HemisphereLight('#7f95e6','#1a1410',0.5),new THREE.AmbientLight('#2a2a48',0.45));
  const key=new THREE.SpotLight('#ffe0a8',2.2,50,0.5,0.7,1);key.position.set(1.5,15,9);key.target.position.set(0,0.4,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-0.0008;S.add(key,key.target);
  const rim=new THREE.DirectionalLight('#6f8cff',0.8);rim.position.set(-6,8,-12);S.add(rim);
  // ---- พื้น + พรม + แท่นกลม ----
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(26,60),stoneMat(13,30,'#4a4c6a'));floor.rotation.x=-Math.PI/2;floor.position.set(0,0,-8);floor.receiveShadow=true;S.add(floor);
  const carpet=new THREE.Mesh(new THREE.PlaneGeometry(3.4,44),new THREE.MeshStandardMaterial({roughness:0.95,map:(()=>{const t=texCanvas(64,640,g=>{g.fillStyle='#7a1620';g.fillRect(0,0,64,640);g.fillStyle='#d9b45a';g.fillRect(3,0,3,640);g.fillRect(58,0,3,640);g.fillStyle='rgba(217,180,90,.5)';g.fillRect(9,0,1.5,640);g.fillRect(53.5,0,1.5,640);for(let y=20;y<640;y+=40){g.beginPath();g.moveTo(32,y-8);g.lineTo(38,y);g.lineTo(32,y+8);g.lineTo(26,y);g.closePath();g.fillStyle='rgba(217,180,90,.55)';g.fill();}});return t;})()}));
  carpet.rotation.x=-Math.PI/2;carpet.position.set(0,0.012,-6);carpet.receiveShadow=true;S.add(carpet);
  const dais=new THREE.Mesh(new THREE.CylinderGeometry(5.4,5.7,STAGE_Y,64),stoneMat(5,1,'#6c6c8c'));dais.position.y=STAGE_Y/2;dais.receiveShadow=true;S.add(dais);
  for(const r of [5.42,4.8]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,r>5?0.06:0.03,8,96),gold);t.rotation.x=Math.PI/2;t.position.y=STAGE_Y+0.005;S.add(t);}
  PODR.rune=new THREE.Mesh(new THREE.CircleGeometry(4.7,64),new THREE.MeshBasicMaterial({map:runeTex,color:hdr('#e8c66a',1.3),transparent:true,opacity:0.4,depthWrite:false,blending:THREE.AdditiveBlending}));
  PODR.rune.rotation.x=-Math.PI/2;PODR.rune.position.y=STAGE_Y+0.012;S.add(PODR.rune);
  // ---- ผนัง: ด้านข้าง 2 + ผนังหลัง (สูง 17 เปิดฟ้าข้างบน) ----
  const wallM=stoneMat(10,4,'#3a3a52');
  for(const sx of [-1,1]){const w=new THREE.Mesh(new THREE.BoxGeometry(1.2,17,60),wallM);w.position.set(sx*12,8.5,-8);S.add(w);}
  const back=new THREE.Mesh(new THREE.BoxGeometry(26,17,1.2),wallM);back.position.set(0,8.5,-23);S.add(back);
  const arch=(w,h)=>{const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h-w/2);s.quadraticCurveTo(-w/2,h-w*0.1,0,h);s.quadraticCurveTo(w/2,h-w*0.1,w/2,h-w/2);s.lineTo(w/2,0);s.lineTo(-w/2,0);return new THREE.ShapeGeometry(s,24);};   // หน้าต่างโค้งแหลม (กอธิค)
  const winTex=texCanvas(8,128,g=>{const r=g.createLinearGradient(0,0,0,128);r.addColorStop(0,'#a9bcff');r.addColorStop(0.55,'#4a5ca8');r.addColorStop(1,'#1a2248');g.fillStyle=r;g.fillRect(0,0,8,128);});
  const beamTex=texCanvas(16,128,g=>{const r=g.createLinearGradient(0,0,0,128);r.addColorStop(0,'rgba(170,190,255,.55)');r.addColorStop(1,'rgba(170,190,255,0)');g.fillStyle=r;g.fillRect(0,0,16,128);});
  const frameM=new THREE.MeshStandardMaterial({color:'#2a2838',roughness:0.95});
  const mkWin=(x,y,z,w,h,ry,mull)=>{
    const m=new THREE.Mesh(arch(w,h),new THREE.MeshBasicMaterial({map:winTex,color:hdr('#ffffff',0.55),fog:false,side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=ry;S.add(m);
    const f=new THREE.Mesh(arch(w+0.7,h+0.35),frameM);f.position.set(x+Math.sin(ry)*-0.04,y-0.1,z+Math.cos(ry)*-0.04);f.rotation.y=ry;S.add(f);
    if(mull){for(const mx of [-w/6,w/6]){const b=new THREE.Mesh(new THREE.BoxGeometry(0.08,h*0.82,0.08),frameM);b.position.set(x+Math.cos(ry)*mx,y+h*0.43,z-Math.sin(ry)*mx);b.rotation.y=ry;S.add(b);}
      for(const my of [0.3,0.58]){const b=new THREE.Mesh(new THREE.BoxGeometry(w,0.08,0.08),frameM);b.position.set(x,y+h*my,z);b.rotation.y=ry;S.add(b);}}
    return m;};
  // ผนังข้าง: หน้าต่างสูง 4 ช่อง/ข้าง + ลำแสงจันทร์เฉียงลงพื้น
  for(const sx of [-1,1])for(const z of [-17,-11,-5,1]){
    mkWin(sx*11.36,1.5,z,3.2,12,-sx*Math.PI/2,true);
    const bm=new THREE.Mesh(new THREE.PlaneGeometry(2.6,15),new THREE.MeshBasicMaterial({map:beamTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false,opacity:0.5}));
    bm.position.set(sx*7.2,6.4,z+1.2);bm.rotation.set(0,sx*Math.PI/2,sx*0.62);S.add(bm);PODR.beams.push(bm);
  }
  // หน้าต่างกระจกสีใหญ่ผนังหลัง (ตรงกลางเหนือแท่น) + ตราโล่ 4 บ้าน
  mkWin(0,1.8,-22.35,7.5,14.5,0,true);
  const HC=['#8a1c1c','#1c3f8a','#1f6a38','#9a7a12'],HE=['🦁','🦅','🐍','🦡'];
  const crest=(c,e)=>texCanvas(128,320,g=>{g.fillStyle=c;g.fillRect(0,0,128,320);g.fillStyle='#d9b45a';g.fillRect(0,0,128,7);g.fillRect(0,0,7,320);g.fillRect(121,0,7,320);
    g.beginPath();g.moveTo(14,110);g.lineTo(114,110);g.lineTo(114,190);g.quadraticCurveTo(114,250,64,276);g.quadraticCurveTo(14,250,14,190);g.closePath();g.fillStyle='rgba(0,0,0,.3)';g.fill();g.lineWidth=5;g.strokeStyle='#d9b45a';g.stroke();
    g.font='64px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(e,64,190);g.beginPath();g.moveTo(0,300);g.lineTo(64,320);g.lineTo(128,300);g.lineTo(128,320);g.lineTo(0,320);g.closePath();g.fillStyle='rgba(0,0,0,.35)';g.fill();});
  HC.forEach((c,i)=>{const x=-9.3+i*6.2,m=new THREE.Mesh(new THREE.PlaneGeometry(2.4,6),new THREE.MeshStandardMaterial({map:crest(c,HE[i]),roughness:0.9,side:THREE.DoubleSide}));m.position.set(x+(i>1?0.4:-0.4),9.4,-22.3);S.add(m);});
  // ---- เสา 2 แถว + คบเพลิง + ธงแขวนข้างเสา ----
  const pilM=stoneMat(1,5,'#6a6884'),torchPos=[];
  for(const sx of [-1,1])[-19,-13,-7,-1,5,10].forEach((z,i)=>{
    const x=sx*8.6,g=new THREE.Group();
    const col=new THREE.Mesh(new THREE.CylinderGeometry(0.62,0.78,16,12),pilM);col.position.y=8;col.castShadow=true;g.add(col);
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.95,0.62,0.7,12),pilM);cap.position.y=16.1;g.add(cap);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(0.95,1.05,0.5,12),pilM);base.position.y=0.25;g.add(base);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.7,0.05,6,24),gold);ring.rotation.x=Math.PI/2;ring.position.y=4.2;g.add(ring);
    // คบเพลิงบนเสา
    const br=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.07,0.55,6),steel);br.position.set(-sx*0.86,3.5,0);br.rotation.z=sx*0.4;g.add(br);
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.09,0.2,8),steel);cup.position.set(-sx*1.0,3.85,0);g.add(cup);
    const fl=new THREE.Sprite(glowMat('#ff9a3a',2.4));fl.scale.set(0.9,1.4,1);fl.position.set(-sx*1.0,4.35,0);g.add(fl);
    const fl2=new THREE.Sprite(glowMat('#ffd27a',2.6));fl2.scale.set(0.45,0.7,1);fl2.position.set(-sx*1.0,4.25,0);g.add(fl2);
    PODR.flames.push({a:fl,b:fl2,ph:Math.random()*6});
    if(i>=1&&i<=4&&torchPos.length<4&&(i===2||i===4))torchPos.push([x-sx*1.0,4.4,z]);
    // ธงบ้านแขวนบนเสา
    const k=(i+(sx>0?2:0))%4,bm=new THREE.Mesh(new THREE.PlaneGeometry(1.5,5.4),new THREE.MeshStandardMaterial({map:crest(HC[k],HE[k]),roughness:0.9,side:THREE.DoubleSide}));
    bm.position.set(-sx*0.82,10.6,0);bm.rotation.y=-sx*Math.PI/2;g.add(bm);
    g.position.set(x,0,z);S.add(g);
  });
  for(const [x,y,z] of torchPos){const L=new THREE.PointLight('#ff9a4a',1.5,13,2);L.position.set(x,y,z);S.add(L);}
  // ---- โต๊ะยาว 4 ตัว (2 ข้าง × 2 แถว) + ม้านั่ง + จานทอง + ถ้วย + เทียน ----
  const tM=woodM(8,1),bM=woodM(8,1),plate=new THREE.MeshStandardMaterial({color:'#e8c468',metalness:1,roughness:0.25}),gobl=new THREE.MeshStandardMaterial({color:'#d9b45a',metalness:1,roughness:0.3}),wax=new THREE.MeshStandardMaterial({color:'#efe6cf',roughness:0.6,emissive:'#2a2010'});
  const lenZ=24,cz=-9;
  for(const x of [-5.6,-3.5,3.5,5.6]){   // 4 โต๊ะ
    const top=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.12,lenZ),tM);top.position.set(x,1.05,cz);top.castShadow=top.receiveShadow=true;S.add(top);
    for(const z of [cz-lenZ/2+1.2,cz,cz+lenZ/2-1.2]){const lg=new THREE.Mesh(new THREE.BoxGeometry(0.8,1.0,0.14),tM);lg.position.set(x,0.5,z);S.add(lg);}
  }
  for(const x of [-6.7,-2.4,2.4,6.7]){const b=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.1,lenZ),bM);b.position.set(x,0.62,cz);b.castShadow=true;S.add(b);for(const z of [cz-lenZ/2+1.2,cz,cz+lenZ/2-1.2]){const lg=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.6,0.1),bM);lg.position.set(x,0.3,z);S.add(lg);}}
  {   // ของบนโต๊ะ (instanced)
    const pts=[];for(const x of [-5.6,-3.5,3.5,5.6])for(let z=cz-lenZ/2+1.5;z<cz+lenZ/2-1;z+=1.6)pts.push([x,z]);
    const pl=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28,0.22,0.04,14),plate,pts.length),gb=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07,0.05,0.2,8),gobl,pts.length),m4=new THREE.Matrix4();
    pts.forEach(([x,z],i)=>{m4.makeTranslation(x+(Math.random()-0.5)*0.15,1.13,z);pl.setMatrixAt(i,m4);m4.makeTranslation(x+0.22,1.21,z-0.3);gb.setMatrixAt(i,m4);});S.add(pl,gb);
    for(const x of [-5.6,-3.5,3.5,5.6])for(let z=cz-lenZ/2+3;z<cz+lenZ/2;z+=4.6){const c=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.34,8),wax);c.position.set(x,1.29,z);S.add(c);const f=new THREE.Sprite(glowMat('#ffb54a',2));f.scale.set(0.3,0.42,1);f.position.set(x,1.55,z);S.add(f);PODR.flames.push({a:f,b:null,ph:Math.random()*6});}
  }
  // ---- เทียนลอย ~140 เล่ม ----
  for(let i=0;i<140;i++){
    const g=new THREE.Group(),c=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.5,8),wax);g.add(c);
    const f=new THREE.Sprite(glowMat('#ffb54a',2.2));f.scale.set(0.35,0.5,1);f.position.y=0.36;g.add(f);
    const y=rnd(6.2,13);g.position.set(rnd(-10.5,10.5),y,rnd(-20,8));S.add(g);PODR.candles.push({g,y,ph:Math.random()*6});
  }
  // ---- โคมระย้า 3 ชุด (วงทอง + เทียน 10 เล่ม + โซ่) ----
  for(const z of [-17,-8,1]){
    const g=new THREE.Group(),ring=new THREE.Mesh(new THREE.TorusGeometry(1.7,0.07,8,40),gold);ring.rotation.x=Math.PI/2;g.add(ring);
    const ring2=new THREE.Mesh(new THREE.TorusGeometry(0.9,0.05,8,32),gold);ring2.rotation.x=Math.PI/2;ring2.position.y=0.4;g.add(ring2);
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2,x=Math.cos(a)*1.7,zz=Math.sin(a)*1.7;const c=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.4,8),wax);c.position.set(x,0.25,zz);g.add(c);const f=new THREE.Sprite(glowMat('#ffb54a',2.2));f.scale.set(0.34,0.5,1);f.position.set(x,0.62,zz);g.add(f);PODR.flames.push({a:f,b:null,ph:Math.random()*6});}
    const chain=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,6,4),steel);chain.position.y=3.2;g.add(chain);
    const gl=new THREE.Sprite(glowMat('#ffcf80',1.6));gl.scale.set(6,6,1);gl.position.y=0.4;g.add(gl);
    g.position.set(0,10.5,z);S.add(g);PODR.chand.push({g,ph:Math.random()*6,y:10.5});
  }
  // ---- ตู้โชว์ถ้วยทอง 2 ตู้ + ชุดเกราะ 4 ตัว ----
  const cupPts=[[0,0],[0.32,0],[0.3,0.06],[0.1,0.12],[0.08,0.4],[0.14,0.48],[0.36,0.62],[0.42,0.95],[0.4,1.0]].map(p=>new THREE.Vector2(p[0],p[1])),cupG=new THREE.LatheGeometry(cupPts,24);
  for(const sx of [-1,1]){
    const g=new THREE.Group(),cab=new THREE.Mesh(new THREE.BoxGeometry(0.9,4.0,3.2),woodM(1,2));cab.position.set(0,2,0);cab.castShadow=true;g.add(cab);
    const inner=new THREE.Mesh(new THREE.BoxGeometry(0.1,3.4,2.7),new THREE.MeshBasicMaterial({color:hdr('#ffd98a',0.5)}));inner.position.set(-sx*0.43,2,0);g.add(inner);
    for(const [y,zz,s] of [[1.2,-0.8,0.5],[1.2,0.8,0.42],[2.3,0,0.6],[3.3,-0.7,0.38],[3.3,0.7,0.38]]){const cp=new THREE.Mesh(cupG,gold);cp.scale.setScalar(s*0.55);cp.position.set(-sx*0.5,y-0.05,zz);g.add(cp);}
    const gl=new THREE.Sprite(glowMat('#ffd98a',1.4));gl.scale.set(3.4,4.4,1);gl.position.set(-sx*0.7,2,0);g.add(gl);
    g.position.set(sx*10.9,0,-19);S.add(g);
  }
  const armor=(x,z,ry)=>{const g=new THREE.Group();
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.26,1.5,10),steel);leg.position.y=0.8;g.add(leg);
    const torso=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.34,1.3,12),steel);torso.position.y=2.1;torso.scale.z=0.7;g.add(torso);
    for(const s of [-1,1]){const sh=new THREE.Mesh(new THREE.SphereGeometry(0.26,10,8),steel);sh.position.set(s*0.5,2.65,0);g.add(sh);const ar=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.09,1.0,8),steel);ar.position.set(s*0.55,2.1,0);g.add(ar);}
    const hd=new THREE.Mesh(new THREE.SphereGeometry(0.28,12,10),steel);hd.position.y=3.0;hd.scale.y=1.15;g.add(hd);
    const plume=new THREE.Mesh(new THREE.ConeGeometry(0.1,0.5,6),new THREE.MeshStandardMaterial({color:'#8a1c1c',roughness:0.8}));plume.position.y=3.5;g.add(plume);
    const sp=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,3.6,6),woodM(1,1));sp.position.set(0.62,2.0,0);g.add(sp);
    const tip=new THREE.Mesh(new THREE.ConeGeometry(0.08,0.4,6),steel);tip.position.set(0.62,3.95,0);g.add(tip);
    const plinth=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.2,0.9),pilM);plinth.position.y=0.1;g.add(plinth);
    g.position.set(x,0,z);g.rotation.y=ry;g.traverse(o=>{if(o.isMesh)o.castShadow=true;});S.add(g);};
  armor(-10.2,-22,0.3);armor(10.2,-22,-0.3);armor(-10.4,-14.5,Math.PI/2*0.9);armor(10.4,-14.5,-Math.PI/2*0.9);
  // ---- ท้องฟ้าดาว (เพดานมนตร์ เปิดเหนือกำแพง) ----
  {const n=700,pos=new Float32Array(n*3);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,e=0.12+Math.random()*1.2,r=70;pos[i*3]=Math.cos(a)*Math.cos(e)*r;pos[i*3+1]=Math.sin(e)*r+8;pos[i*3+2]=Math.sin(a)*Math.cos(e)*r-8;}
    const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    PODR.stars=new THREE.Points(gg,new THREE.PointsMaterial({map:glowTex,color:hdr('#dfe8ff',1.6),size:1.1,transparent:true,opacity:0.9,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));S.add(PODR.stars);
    const moon=new THREE.Sprite(glowMat('#cfe0ff',2.6));moon.scale.set(14,14,1);moon.position.set(-18,38,-48);moon.material.fog=false;S.add(moon);}
  // ---- ฝุ่นทอง + กระดาษทองโปรย ----
  {const n=240,pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=rnd(-9,9);pos[i*3+1]=rnd(0.4,10);pos[i*3+2]=rnd(-14,4);}
    const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    PODR.dust=new THREE.Points(dg,new THREE.PointsMaterial({map:glowTex,color:hdr('#ffd98a',1.4),size:0.09,transparent:true,opacity:0.7,depthWrite:false,blending:THREE.AdditiveBlending}));S.add(PODR.dust);}
  {const n=170,pos=new Float32Array(n*3),col=new Float32Array(n*3),C=['#ffd86b','#fff4cc','#ff9a3a','#ffffff'];PODR.confV=new Float32Array(n*2);
    for(let i=0;i<n;i++){pos[i*3]=rnd(-5,5);pos[i*3+1]=rnd(0,13);pos[i*3+2]=rnd(-4,4);const c=new THREE.Color(C[i%4]);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;PODR.confV[i*2]=rnd(0.8,2.0);PODR.confV[i*2+1]=rnd(0,6);}
    const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.BufferAttribute(pos,3));cg.setAttribute('color',new THREE.BufferAttribute(col,3));
    PODR.conf=new THREE.Points(cg,new THREE.PointsMaterial({size:0.16,vertexColors:true,transparent:true,opacity:0.95,depthWrite:false,blending:THREE.AdditiveBlending,map:glowTex}));S.add(PODR.conf);}
}
// ทุกเฟรมของโพเดียม: เปลวไฟสั่น เทียน/โคมลอย ดาวระยิบ กระดาษทองโปรย
function podRoomTick(dt,now){
  const t=now/1000;
  for(const f of PODR.flames){const s=0.9+0.16*Math.sin(t*11+f.ph)+0.1*Math.sin(t*23+f.ph*2);f.a.scale.y=(f.a.userData.sy||(f.a.userData.sy=f.a.scale.y))*s;if(f.b)f.b.scale.y=(f.b.userData.sy||(f.b.userData.sy=f.b.scale.y))*(1.1-s*0.2);}
  for(const c of PODR.candles)c.g.position.y=c.y+Math.sin(t*0.9+c.ph)*0.25;
  for(const c of PODR.chand){c.g.position.y=c.y+Math.sin(t*0.6+c.ph)*0.1;c.g.rotation.y=t*0.15+c.ph;}
  if(PODR.rune)PODR.rune.rotation.z=t/6;if(PODR.dust)PODR.dust.rotation.y=t/30;
  if(PODR.stars)PODR.stars.material.opacity=0.8+0.12*Math.sin(t*1.3);
  for(const b of PODR.beams)b.material.opacity=0.42+0.1*Math.sin(t*0.5+b.position.z);
  if(PODR.conf){const p=PODR.conf.geometry.attributes.position,a=p.array,V=PODR.confV;for(let i=0;i<a.length/3;i++){a[i*3+1]-=V[i*2]*dt;a[i*3]+=Math.sin(t*1.4+V[i*2+1])*dt*0.5;if(a[i*3+1]<0.05){a[i*3+1]=13;a[i*3]=rnd(-5,5);a[i*3+2]=rnd(-4,4);}}p.needsUpdate=true;}
}
