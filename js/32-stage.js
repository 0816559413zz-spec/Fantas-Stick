// ---------- เวทีเมนู/ล็อบบี้: ห้องโถงมืด แท่นวงเวททอง เทียนลอย (ฉากแยกจากแผนที่) ----------
const stage=new THREE.Scene();
stage.background=new THREE.Color('#04060d');
stage.fog=new THREE.Fog('#04060d',16,46);
const STAGE={chars:new Map(),env:[],wins:[],candles:[],rune:null,slotRings:[],plates:[],dust:null,banners:[],switchT:-1,k:0,tg:null,tb:null,rotY:0,rotV:0,drag:false};
const STAGE_Y=0.36;
(function(){
  STAGE.hemi=new THREE.HemisphereLight('#7f95e6','#1a1410',0.45);stage.add(STAGE.hemi);
  stage.add(new THREE.AmbientLight('#2a2a48',0.4));
  const key=new THREE.SpotLight('#ffe0a8',1.9,45,0.55,0.7,1);
  key.position.set(1.5,14,9);key.target.position.set(0,0.4,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-0.0008;
  stage.add(key,key.target);STAGE.key=key;
  const rim=new THREE.DirectionalLight('#6f8cff',0.9);rim.position.set(-6,7,-10);stage.add(rim);STAGE.rim=rim;
  const floor=new THREE.Mesh(new THREE.CircleGeometry(42,48),stoneMat(16,16,'#3e4260'));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;stage.add(floor);
  const dais=new THREE.Mesh(new THREE.CylinderGeometry(7.6,8,STAGE_Y,72),stoneMat(6,1,'#6c6c8c'));dais.position.y=STAGE_Y/2;dais.receiveShadow=true;stage.add(dais);
  const goldM=new THREE.MeshStandardMaterial({color:'#d9b45a',metalness:0.85,roughness:0.3,emissive:'#3a2a08'});
  for(const r of [7.62,6.9]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,r>7?0.07:0.035,8,120),goldM);t.rotation.x=Math.PI/2;t.position.y=STAGE_Y+0.005;stage.add(t);}
  STAGE.rune=new THREE.Mesh(new THREE.CircleGeometry(6.8,72),new THREE.MeshBasicMaterial({map:runeTex,color:hdr('#e8c66a',1.3),transparent:true,opacity:0.4,depthWrite:false,blending:THREE.AdditiveBlending}));
  STAGE.rune.rotation.x=-Math.PI/2;STAGE.rune.position.y=STAGE_Y+0.01;stage.add(STAGE.rune);
  // หน้าต่างโค้งเรืองแสงจันทร์ + เสาหิน + ธงประจำบ้าน ด้านหลัง
  const arch=(w,h)=>{const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h-w/2);s.absarc(0,h-w/2,w/2,Math.PI,0,true);s.lineTo(w/2,0);s.lineTo(-w/2,0);return new THREE.ShapeGeometry(s,24);};
  const winTex=texCanvas(8,128,(g)=>{const r=g.createLinearGradient(0,0,0,128);r.addColorStop(0,'#9fb4ff');r.addColorStop(0.6,'#3a4c94');r.addColorStop(1,'#141a3a');g.fillStyle=r;g.fillRect(0,0,8,128);});
  for(const [x,z,w,h] of [[0,-15,5,11],[-10,-13,3.4,8],[10,-13,3.4,8]]){
    const m=new THREE.Mesh(arch(w,h),new THREE.MeshBasicMaterial({map:winTex,color:hdr('#ffffff',x?0.32:0.42),fog:false}));m.position.set(x,1.5,z);m.lookAt(0,1.5+0,6);stage.add(m);STAGE.wins.push(m);
    const fr=new THREE.Mesh(arch(w+0.6,h+0.3),new THREE.MeshStandardMaterial({color:'#2a2838',roughness:0.95}));fr.position.set(x,1.35,z-0.05);fr.lookAt(0,1.35,6);stage.add(fr);STAGE.wins.push(fr);
  }
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(19,19,18,48,1,true,Math.PI*0.62,Math.PI*0.76),stoneMat(12,4,'#3a3a52'));wall.material.side=THREE.BackSide;wall.position.y=9;stage.add(wall);
  const HC=['#7a1c1c','#1c3f7a','#1f5a32','#8a6a12'];
  [[-6,-12.5],[6,-12.5],[-14,-9],[14,-9]].forEach(([x,z],i)=>{
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.75,0.9,16,12),stoneMat(1,5,'#6a6884'));p.position.set(x,8,z);stage.add(p);
    const b=new THREE.Mesh(new THREE.PlaneGeometry(1.7,5.2),new THREE.MeshStandardMaterial({color:HC[i],roughness:0.9,side:THREE.DoubleSide}));b.position.set(x,8.2,z+0.95);b.lookAt(0,8.2,8);stage.add(b);STAGE.banners.push(b);
    const tr=new THREE.Mesh(new THREE.PlaneGeometry(1.7,0.12),goldM);tr.position.set(x,10.75,z+0.97);tr.lookAt(0,10.75,8);stage.add(tr);
  });
  // เทียนลอย
  const wax=new THREE.MeshStandardMaterial({color:'#efe6cf',roughness:0.6,emissive:'#2a2010'});
  for(let i=0;i<30;i++){
    const g=new THREE.Group(),c=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.5,8),wax);g.add(c);
    const f=new THREE.Sprite(glowMat('#ffb54a',2.2));f.scale.set(0.35,0.5,1);f.position.y=0.36;g.add(f);
    const x=rnd(-13,13),z=rnd(-12,3),y=rnd(5.5,10);g.position.set(x,y,z);stage.add(g);
    STAGE.candles.push({g,y,ph:Math.random()*6});
  }
  // ฝุ่นละอองทองลอยในแสง
  const n=220,pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){pos[i*3]=rnd(-9,9);pos[i*3+1]=rnd(0.4,9);pos[i*3+2]=rnd(-9,2.5);}
  const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  STAGE.dust=new THREE.Points(dg,new THREE.PointsMaterial({map:glowTex,color:hdr('#ffd98a',1.4),size:0.09,transparent:true,opacity:0.7,depthWrite:false,blending:THREE.AdditiveBlending}));
  stage.add(STAGE.dust);
  // วงคลื่นพลังตอนเปลี่ยนบ้าน
  STAGE.burst=new THREE.Mesh(new THREE.RingGeometry(0.9,1,64),new THREE.MeshBasicMaterial({color:hdr('#ffffff',2),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  STAGE.burst.rotation.x=-Math.PI/2;STAGE.burst.position.y=STAGE_Y+0.04;STAGE.burst.visible=false;stage.add(STAGE.burst);
  // วงช่องว่าง (รอเพื่อนเข้าห้อง)
  for(let i=0;i<6;i++){
    const r=new THREE.Mesh(new THREE.RingGeometry(0.62,0.7,40),new THREE.MeshBasicMaterial({color:hdr('#d9b45a',1.2),transparent:true,opacity:0.35,depthWrite:false}));
    r.rotation.x=-Math.PI/2;r.position.y=STAGE_Y+0.02;r.visible=false;stage.add(r);STAGE.slotRings.push(r);
  }
})();
// ตำแหน่งยืนบนแท่น: คนแรก (โฮสต์) อยู่กลาง แล้วกระจายออกซ้าย-ขวา / โหมดทีม = ฟ้าซ้าย แดงขวา
function stageSpots(L){
  const P=L.players,team=MODES[L.mode]&&MODES[L.mode].team,out=[],empty=[];
  const arcZ=x=>-Math.abs(x)*0.22;
  if(team){
    for(const t of [0,1]){
      const mem=P.filter(p=>p.tm===t),sg=t?1:-1,cap=L.online?Math.max(3,mem.length):mem.length;
      for(let i=0;i<cap;i++){const x=sg*(1.35+i*1.8);(i<mem.length?out:empty).push(i<mem.length?{p:mem[i],x,z:arcZ(x)}:{x,z:arcZ(x)});}
    }
  }else{
    const cap=L.online?Math.max(6,P.length):P.length;
    const xs=[];for(let i=0;i<cap;i++)xs.push((i-(cap-1)/2)*1.75);
    xs.sort((a,b)=>Math.abs(a)-Math.abs(b)||a-b);
    xs.forEach((x,i)=>(i<P.length?out:empty).push(i<P.length?{p:P[i],x,z:arcZ(x)}:{x,z:arcZ(x)}));
  }
  return {out,empty};
}
function stageChar(id,lk){
  let o=STAGE.chars.get(id),px=null,had=false,pp=null;
  if(o&&o.lk!==lk){px=o.x;pp=o.pp;had=true;stage.remove(o.g);disposeObj(o.g);STAGE.chars.delete(id);o=null;}
  if(!o){const re=had&&id==='me-preview';o=makeStudent(parseLook(lk),id);stage.add(o.g);{const L=parseLook(lk);useFileModel(o,'char_student',lookTint(L),L);}o.lk=lk;o.house=parseLook(lk).h;o.pid=id;o.joinT=re?0:1.6;o.x=re?px:null;if(pp)o.pp=pp;STAGE.chars.set(id,o);}
  return o;
}
// ท่าประจำบ้าน [แขนขวา rx,rz | แขนซ้าย rx,rz | ลำตัว rx,rz] — ปรับนุ่มๆ เวลาเปลี่ยนบ้าน
const POSES=[
  [-2.7,-0.28,-0.12,0.55,-0.06,0],
  [-1.3,0.5,-1.15,-0.6,0.03,0.07],
  [-0.3,-0.12,-2.6,0.5,0,0],
  [-1.75,-0.06,-0.95,0.38,0.06,-0.05],
  [-2.0,-0.1,-0.12,0.5,-0.02,0]];   // 4 = ท่าโชว์ไม้กายสิทธิ์ (ขั้นเลือกไม้กาย)
function stageIdle(o,now,dt,i){
  o.joinT=Math.max(0,o.joinT-dt);
  const lift=Math.min(1,o.joinT*1.2),h=(o.pid==='me-preview'&&crOpen&&(crStep===2||crStep===3))?4:(o.house|0),T=POSES[h];
  if(!o.pp)o.pp=T.slice();
  const k=1-Math.exp(-7*dt);for(let j=0;j<6;j++)o.pp[j]+=(T[j]-o.pp[j])*k;
  const P=o.pp,t=now/1000;
  let bob=Math.sin(now/700+i)*0.012,wv=0,sw=0;
  if(h===2){wv=Math.sin(t*7)*0.28;bob=Math.abs(Math.sin(t*3.2))*0.05;}
  if(h===0)bob=Math.sin(t*1.6)*0.02;
  if(h===1)sw=Math.sin(t*0.9)*0.03;
  if(h===3)sw=Math.sin(t*0.7)*0.04;
  o.b.rotation.x=P[4];o.b.rotation.z=P[5]+sw;o.b.position.y=bob;
  o.legs[0].rotation.x=o.legs[1].rotation.x=0;
  o.armL.rotation.x=P[2]+Math.sin(now/900+i)*0.04;o.armL.rotation.z=P[3]+wv;
  o.armR.rotation.x=lerp(P[0]+Math.sin(now/800+i)*0.04,-2.3,lift);o.armR.rotation.z=P[1];
  updateCloth(o.cloak,0,0,0,now,dt);
  o.ends.forEach((E,k)=>{E.rotation.x=Math.sin(now*0.0015+k+i)*0.05;E.rotation.z=0;});
  o.tip.scale.setScalar(0.3+0.08*Math.sin(now/120+i)+lift*0.6+(h===0||h===4?0.15:0));
  o.broom.visible=o.cocoon.visible=o.shield.visible=o.stars.visible=false;
  if(o.anim)animTick(o,{sp:0},dt);
  if(o.rig){rigStage(o);rigSync(o,dt);}
}
// ---------- เอฟเฟกต์หน้าเมนู (โชว์เฉพาะหน้าแรก ไม่โชว์ในล็อบบี้/หน้าสร้างตัวละคร): ลำแสงจากหน้าต่าง เสาแสง วงเวทลอยรอบตัว ประกายหมุนขึ้น ----------
(function(){
  const G=new THREE.Group();stage.add(G);STAGE.mfx=G;STAGE.introT=-1;
  const vgrad=texCanvas(4,128,(g)=>{const r=g.createLinearGradient(0,0,0,128);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(0.35,'rgba(255,255,255,0.55)');r.addColorStop(1,'rgba(255,255,255,1)');g.fillStyle=r;g.fillRect(0,0,4,128);});
  const add=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({map:vgrad,color:hdr(c,1),transparent:true,opacity:0.2,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false},o||{}));
  // ลำแสงจันทร์จากหน้าต่าง 3 บาน ส่องลงแท่น
  STAGE.rays=[];
  for(const [x,z,w] of [[0,-15,4.2],[-10,-13,2.8],[10,-13,2.8]]){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,22),add('#9fb4ff',{opacity:x?0.05:0.07}));
    m.position.set(x*0.55,6,(z+1)*0.5);m.lookAt(0,6,8);m.rotateX(-0.75);G.add(m);STAGE.rays.push(m);
  }
  // เสาแสงทองบนตัวละคร
  STAGE.pillar=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.35,12,32,1,true),add('#ffd27a',{opacity:0.13}));STAGE.pillar.position.y=STAGE_Y+6;STAGE.pillar.rotation.x=Math.PI;G.add(STAGE.pillar);
  // วงเวทลอยรอบตัว 3 ชั้น
  STAGE.halos=[[0.75,1.6,'#ffd27a',0.55],[1.55,1.25,'#9fd0ff',0.4],[2.35,1.85,'#e8c66a',0.35]].map(([y,r,c,op],i)=>{
    const m=new THREE.Mesh(new THREE.CircleGeometry(r,64),new THREE.MeshBasicMaterial({map:runeTex,color:hdr(c,1.4),transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false}));
    m.rotation.x=-Math.PI/2;m.position.y=STAGE_Y+y;m.userData={y:STAGE_Y+y,op,s:i%2?-1:1,tilt:[0.28,-0.34,0.42][i]};G.add(m);return m;});
  // ประกายหมุนเป็นเกลียวขึ้นรอบตัว
  const n=160,pos=new Float32Array(n*3),seed=[];for(let i=0;i<n;i++)seed.push([Math.random(),Math.random()*6.283,0.7+Math.random()*1.0,Math.random()]);
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  STAGE.spiral={pts:new THREE.Points(pg,new THREE.PointsMaterial({map:glowTex,color:hdr('#ffe2a0',2),size:0.09,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})),pos,seed};
  STAGE.spiral.pts.frustumCulled=false;G.add(STAGE.spiral.pts);
  // วงเวทยักษ์จางๆ บนผนังหลัง
  STAGE.sigil=new THREE.Mesh(new THREE.CircleGeometry(9,96),new THREE.MeshBasicMaterial({map:runeTex,color:hdr('#7f95e6',1),transparent:true,opacity:0.16,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
  STAGE.sigil.position.set(0,8.5,-16.5);G.add(STAGE.sigil);
})();
function stageMenuFx(now,on){
  const G=STAGE.mfx;G.visible=on;if(!on)return;
  const t=now/1000;
  STAGE.halos.forEach((m,i)=>{const u=m.userData;m.rotation.z=t*0.35*u.s;m.rotation.x=-Math.PI/2+u.tilt+Math.sin(t*0.6+i)*0.06;m.position.y=u.y+Math.sin(t*0.9+i*2)*0.08;m.material.opacity=u.op*(0.75+0.25*Math.sin(t*1.7+i));});
  STAGE.pillar.material.opacity=0.1+0.04*Math.sin(t*1.3);STAGE.pillar.rotation.y=t*0.2;
  STAGE.rays.forEach((m,i)=>m.material.opacity=(i?0.045:0.065)*(0.8+0.2*Math.sin(t*0.5+i)));
  STAGE.sigil.rotation.z=-t*0.04;
  const S=STAGE.spiral;for(let i=0;i<S.seed.length;i++){const s=S.seed[i],h=(s[0]+t*0.12*(0.6+s[3]))%1,a=s[1]+t*(1.2+s[3])+h*6,r=s[2]*(1-h*0.45);
    S.pos[i*3]=Math.cos(a)*r;S.pos[i*3+1]=STAGE_Y+0.1+h*3.4;S.pos[i*3+2]=Math.sin(a)*r;}
  S.pts.geometry.attributes.position.needsUpdate=true;S.pts.material.opacity=0.85;
}
const _sv=new THREE.Vector3();
// ---------- ฉากประจำบ้าน (โผล่ตอนเลือกบ้านในหน้าสร้างตัวละคร) ----------
const CRESTTEX=[];
function crestTex(h){
  if(CRESTTEX[h])return CRESTTEX[h];
  const c=document.createElement('canvas');c.width=256;c.height=308;
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;CRESTTEX[h]=t;
  const img=new Image();img.onload=()=>{c.getContext('2d').drawImage(img,0,0,256,308);t.needsUpdate=true;};
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(crestSVG(h,256,false));
  return t;
}
function crestBanner(h,x,y,z,w){
  const g=new THREE.Group(),H=HOUSES[h],hh=w*1.9;
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(w,hh),new THREE.MeshStandardMaterial({color:H.c,roughness:0.9,side:THREE.DoubleSide})));
  const tr=new THREE.Mesh(new THREE.PlaneGeometry(w*1.04,0.16),new THREE.MeshStandardMaterial({color:'#d9b45a',metalness:0.8,roughness:0.3}));tr.position.set(0,hh/2,0.02);g.add(tr);
  const bt=tr.clone();bt.position.y=-hh/2;g.add(bt);
  const em=new THREE.Mesh(new THREE.PlaneGeometry(w*0.82,w*0.82*1.2),new THREE.MeshBasicMaterial({map:crestTex(h),transparent:true}));em.position.set(0,hh*0.1,0.03);g.add(em);
  g.position.set(x,y,z);return g;
}
function buildHouseEnvs(){
  const E=[],stoneD=stoneMat(3,3,'#4a4a62');
  const mk=()=>{const g=new THREE.Group();g.visible=false;stage.add(g);return g;};
  const std=(c,r=0.9)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
  const box=(g,w,h,d,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);g.add(m);return m;};
  const glow=(g,col,k,sx,sy,x,y,z)=>{const q=new THREE.Sprite(glowMat(col,k));q.scale.set(sx,sy,1);q.position.set(x,y,z);g.add(q);return q;};
  const light=(g,col,base,x,y,z,fl)=>{const L=new THREE.PointLight(col,0,34,2);L.position.set(x,y,z);stage.add(L);g.userData.L=L;g.userData.base=base;g.userData.fl=fl;};
  // 0 กริฟฟินดอร์: เตาผิงใหญ่ + ธงแดงทอง
  {const g=mk();
   box(g,8,6,1.4,stoneD,0,3,-12);box(g,4.6,3.4,0.5,std('#0a0605'),0,1.9,-11.25);
   box(g,9,0.5,1.8,std('#5a3a22'),0,6.1,-11.8);
   glow(g,'#ff7a2a',3,5,4,0,1.8,-10.7);glow(g,'#ffc060',2.4,2.6,2.2,0,1.3,-10.6);
   for(const sx of[-1,1]){g.add(crestBanner(0,sx*7.2,4.4,-11.6,2.6));box(g,1.6,1,1.6,std('#8a1a22'),sx*5.6,0.5,-8.5);}
   light(g,'#ff8a40',2.8,0,2.6,-9,1);E[0]=g;}
  // 1 สลิธีริน: ห้องใต้ดินโค้งหิน + โคมเขียวแขวน
  {const g=mk();
   for(const x of[-9,0,9]){box(g,1.3,10,1.3,stoneD,x-2.4,5,-12.6);box(g,1.3,10,1.3,stoneD,x+2.4,5,-12.6);box(g,6.2,1.3,1.3,stoneD,x,10,-12.6);glow(g,'#30ff90',1.5,6.5,9,x,5,-13.4);}
   for(let i=0;i<7;i++){const x=-10.5+i*3.5,y=6.2+(i%2)*1.6;box(g,0.05,14-y,0.05,std('#2a2a30'),x,y+(14-y)/2,-9);glow(g,'#40ff9a',2.4,1.3,1.3,x,y,-9);}
   for(const sx of[-1,1])g.add(crestBanner(1,sx*4.5,4.5,-11.9,2.6));
   light(g,'#30ff90',2.4,0,5,-8,0);E[1]=g;}
  // 2 ฮัฟเฟิลพัฟ: ประตูกลมอบอุ่น + ต้นไม้ + ถัง
  {const g=mk();
   box(g,40,12,0.6,std('#5a4430'),0,6,-13.2);
   for(const x of[-9,0,9]){const d=new THREE.Mesh(new THREE.CircleGeometry(2.3,32),std('#7a4a22'));d.position.set(x,3.4,-12.8);g.add(d);
     const r=new THREE.Mesh(new THREE.TorusGeometry(2.3,0.16,8,32),new THREE.MeshStandardMaterial({color:'#c9923a',metalness:0.7,roughness:0.35}));r.position.set(x,3.4,-12.78);g.add(r);
     glow(g,'#ffc850',1.4,6,6,x,3.4,-13);const kn=new THREE.Mesh(new THREE.SphereGeometry(0.16,10,8),new THREE.MeshStandardMaterial({color:'#e8c060',metalness:0.8}));kn.position.set(x+1.1,3.2,-12.6);g.add(kn);}
   for(const x of[-10,-7,7,10]){const pot=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.4,0.8,12),std('#8a4a2a'));pot.position.set(x,0.4,-8);g.add(pot);
     const lf=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),std('#3f9a45'));lf.position.set(x,1.7,-8);lf.scale.set(0.95,1.1,0.95);g.add(lf);}
   for(const x of[-4.8,5]){const b=new THREE.Mesh(new THREE.CylinderGeometry(0.85,0.85,1.5,16),std('#6a4222'));b.position.set(x,0.75,-9.4);g.add(b);}
   for(const sx of[-1,1])g.add(crestBanner(2,sx*4.6,4.6,-12.4,2.6));
   const sp=[];for(let i=0;i<16;i++){const q=glow(g,'#ffe86a',2.4,0.3,0.3,rnd(-12,12),rnd(1.5,8),rnd(-12,-5));q.userData.y=q.position.y;sp.push(q);}g.userData.sp=sp;
   light(g,'#ffc850',2.6,0,4,-8,0);E[2]=g;}
  // 3 เรเวนคลอ: หอคอยดาว + ชั้นหนังสือ + ลูกแก้วลอย
  {const g=mk();
   const n=420,pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=rnd(-24,24);pos[i*3+1]=rnd(1,18);pos[i*3+2]=-18;}
   const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(pos,3));
   g.add(new THREE.Points(sg,new THREE.PointsMaterial({map:glowTex,color:hdr('#cfe0ff',1.6),size:0.2,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})));
   glow(g,'#bcd4ff',1.6,7,7,2,12,-17.5);
   const cols=['#2a4a9a','#b8863e','#5a2a6a','#1a6a8a','#8a2a3a','#e8e2d0'];
   for(const sx of[-1,1]){box(g,3.6,11,1.3,std('#3a2616'),sx*9.5,5.5,-11.8);
     for(let r=0;r<6;r++)for(let c=0;c<9;c++){const bh=rnd(0.7,1.1);box(g,0.28,bh,0.8,std(cols[(r*3+c*5)%cols.length],0.8),sx*9.5-1.2+c*0.3,1.2+r*1.7+bh/2,-11.1);}}
   for(const sx of[-1,1])g.add(crestBanner(3,sx*4.6,4.5,-12,2.6));
   const sp=[];for(let i=0;i<10;i++){const q=glow(g,'#6aa8ff',2.2,0.7,0.7,rnd(-8,8),rnd(2,9),rnd(-11,-5));q.userData.y=q.position.y;sp.push(q);}g.userData.sp=sp;
   light(g,'#5a9aff',2.4,0,5,-8,0);E[3]=g;}
  return E;
}
STAGE.env=buildHouseEnvs();
// โทนสีฉากตามบ้านที่เลือก (null = โทนกลางปกติ) ค่อยๆ เปลี่ยนนุ่มๆ
const TONE0={bg:new THREE.Color('#04060d'),gl:new THREE.Color('#6f8cff'),ac:new THREE.Color('#e8c66a'),sky:new THREE.Color('#7f95e6'),key:new THREE.Color('#ffe0a8'),dust:new THREE.Color('#ffd98a')};
const _tc=new THREE.Color();
function stageTone(dt,H){
  if(!STAGE.tg){STAGE.tg=TONE0.gl.clone();STAGE.tb=TONE0.bg.clone();}
  const f=1-Math.exp(-4.5*dt);
  STAGE.k+=((H?1:0)-STAGE.k)*f;
  STAGE.tg.lerp(H?_tc.set(H.gl):TONE0.gl,f);STAGE.tb.lerp(H?_tc.set(H.bg):TONE0.bg,f);
  const k=STAGE.k;
  stage.background.copy(STAGE.tb);stage.fog.color.copy(STAGE.tb);
  STAGE.rim.color.copy(STAGE.tg);STAGE.hemi.color.copy(TONE0.sky).lerp(STAGE.tg,k*0.8);STAGE.key.color.copy(TONE0.key).lerp(STAGE.tg,k*0.45);
  STAGE.rune.material.color.copy(TONE0.ac).lerp(STAGE.tg,k).multiplyScalar(1.3+k*0.5);
  STAGE.dust.material.color.copy(TONE0.dust).lerp(STAGE.tg,k).multiplyScalar(1.4);
  const hc=H?_tc.set(H.c):null;
  STAGE.banners.forEach((b,i)=>{b.material.color.set(['#7a1c1c','#1c3f7a','#1f5a32','#8a6a12'][i]);if(hc)b.material.color.lerp(hc,k);});
}
function stageScreen(x,y,z){_sv.set(x,y,z).project(cam);if(_sv.z>1)return null;return [(_sv.x+1)/2*SW,(1-_sv.y)/2*SH];}
function renderStage(dt,now){
  const lob=screen==='lobby'&&LOBBY;
  const want=new Set(),rows=[];
  if(lob){
    const {out,empty}=stageSpots(LOBBY);
    for(const s of out){const o=stageChar(s.p.id,s.p.lk||lookStr(getLook(s.p.id)));want.add(s.p.id);rows.push({o,s,p:s.p});}
    STAGE.slotRings.forEach((r,i)=>{const e=empty[i];r.visible=!!e;if(e){r.position.x=e.x;r.position.z=e.z;r.material.opacity=0.5+0.2*Math.sin(now/400+i);}});
    STAGE.empty=empty;
  }else{
    const o=stageChar('me-preview',lookStr(myLook));want.add('me-preview');
    rows.push({o,s:{x:0,z:0},p:null});
    STAGE.slotRings.forEach(r=>r.visible=false);STAGE.empty=[];
  }
  for(const [id,o] of STAGE.chars)if(!want.has(id)){stage.remove(o.g);disposeObj(o.g);STAGE.chars.delete(id);}
  stageTone(dt,crOpen&&crStep===4?HOUSES[myLook.h]:null);
  const eh=crOpen&&crStep===4?myLook.h:-1;
  STAGE.env.forEach((g,i)=>{g.visible=i===eh;const u=g.userData;if(u.L)u.L.intensity=i===eh?u.base*(u.fl?0.8+0.22*Math.sin(now/90)+0.12*Math.sin(now/37):1):0;if(i===eh&&u.sp)u.sp.forEach((q,j)=>{q.position.y=q.userData.y+Math.sin(now/900+j)*0.35;});});
  STAGE.wins.forEach(m=>m.visible=eh<0||eh===3);
  // เปลี่ยนบ้าน: ตัวละครหมุนหนึ่งรอบ + คลื่นพลัง
  let spin=0;
  if(STAGE.switchT>=0){STAGE.switchT+=dt/0.8;const u=Math.min(1,STAGE.switchT),e=1-Math.pow(1-u,3);spin=e*Math.PI*2;
    STAGE.burst.visible=true;STAGE.burst.scale.setScalar(1+u*8);STAGE.burst.material.opacity=(1-u)*0.9;STAGE.burst.material.color.copy(STAGE.tg).multiplyScalar(2);
    if(u>=1){STAGE.switchT=-1;STAGE.burst.visible=false;}}
  if(!STAGE.drag&&STAGE.rotV){STAGE.rotY+=STAGE.rotV*dt;STAGE.rotV*=Math.exp(-4*dt);if(Math.abs(STAGE.rotV)<0.02)STAGE.rotV=0;}
  const team=lob&&MODES[LOBBY.mode]&&MODES[LOBBY.mode].team;
  rows.forEach(({o,s,p},i)=>{
    o.x=o.x===null?s.x:lerp(o.x,s.x,1-Math.exp(-8*dt));
    o.g.position.set(o.x,STAGE_Y,s.z);
    o.g.rotation.y=(lob?-o.x*0.06:-0.22+((mouseX||SW*0.6)/Math.max(1,SW)-0.6)*0.5)+(p?0:spin+STAGE.rotY)+(window.__rotY||0);
    stageIdle(o,now,dt,i);
    const mine=p?p.id===NET.myId:true;
    o.ring.visible=true;o.ring.material.color.set(team?TEAMC[p.tm]:mine?'#f3dc94':'#8a94b8');o.ring.material.opacity=mine||team?0.85:0.4;
  });
  for(const c of STAGE.candles)c.g.position.y=c.y+Math.sin(now/900+c.ph)*0.25;
  STAGE.rune.rotation.z=now/9000;STAGE.rune.material.opacity=0.32+0.12*Math.sin(now/700);
  STAGE.dust.rotation.y=now/40000;
  stageMenuFx(now,!lob&&!crOpen);
  // กล้อง: เมนู = ตัวเราอยู่ฝั่งขวา / ล็อบบี้ = มองทั้งแท่น
  const sway=Math.sin(now/5200)*0.15;
  if(lob){const mx=Math.max(0,...rows.map(r=>Math.abs(r.s.x)),...STAGE.empty.map(e=>Math.abs(e.x))),dist=clamp((mx+1.1)/(0.3*cam.aspect),6.5,13);cam.position.set(sway,1.5+dist*0.1,dist);cam.lookAt(0,1.45,0);}
  else if(crOpen){const s3=crStep===4,sw=crStep===2||crStep===3;cam.position.set(-0.45+sway*0.4,s3?1.95:sw?1.85:1.8,s3?4.5:sw?3.2:3.9);cam.lookAt(-0.45,s3?1.2:sw?1.55:1.5,0);}
  else{
    // หน้าแรก: กล้องโฉบจากมุมสูงไกลลงมาหาตัวละครตอนกดผ่านฉากเปิด (STAGE.introT 0→1) แล้วลอยช้าๆ
    const u=STAGE.introT<0?0:Math.min(1,STAGE.introT),e=1-Math.pow(1-u,3);
    if(STAGE.introT>=0&&STAGE.introT<1)STAGE.introT+=dt/2.8;
    const drift=Math.sin(now/7000)*0.25;
    cam.position.set(lerp(1.5,-0.85+sway*0.5+drift,e),lerp(8.5,1.55,e),lerp(17,5.6,e));cam.lookAt(lerp(0,-0.85,e),lerp(3.2,1.12,e),0);
  }
  if(window.__stageCam)window.__stageCam(cam);
  rpass.scene=stage;gl.shadowMap.needsUpdate=true;composer.render();rpass.scene=scene;
  if(lob)drawStageLabels(rows,team);
}
// ป้ายชื่อเหนือหัวในล็อบบี้ (คลิกเพื่อย้ายทีมได้ถ้าเป็นโฮสต์)
function drawStageLabels(rows,team){
  STAGE.plates=[];
  const spk=speakingIds();
  cx.textAlign='center';cx.textBaseline='middle';
  // จัดป้ายไม่ให้ทับกัน: ป้ายที่ชนกับป้ายข้างๆ จะยกขึ้นอีกชั้น
  const L=[];
  for(const {o,p} of rows){
    const s=stageScreen(o.x,STAGE_Y+2.55,o.g.position.z);if(!s)continue;
    cx.font='600 15px Kanit,sans-serif';
    const w=Math.max(80,cx.measureText(p.n).width+40);
    L.push({s,p,w,lv:0});
  }
  L.sort((a,b)=>a.s[0]-b.s[0]);
  L.forEach((a,i)=>{const b=L[i-1];if(b&&b.lv===0&&a.s[0]-a.w/2<b.s[0]+b.w/2+6)a.lv=1;});
  for(const {s,p,w,lv} of L){
    const host=p.id===LOBBY.host,me=p.id===NET.myId;
    const h=30,x=s[0]-w/2,y=s[1]-h-lv*50;
    if(lv){cx.strokeStyle='rgba(217,180,90,0.5)';cx.lineWidth=1;cx.beginPath();cx.moveTo(s[0],y+h);cx.lineTo(s[0],s[1]);cx.stroke();}
    cx.font='600 15px Kanit,sans-serif';
    plate(x,y,w,h,me);
    if(team){cx.fillStyle=TEAMC[p.tm];cx.fillRect(x+4,y+h-3,w-8,2);}
    cx.fillStyle=me?'#f3dc94':'#efe6cf';cx.fillText(p.n,s[0],y+h/2+1);
    const sub=(host?'👑 โฮสต์':'')+(me?(host?' · ':'')+'คุณ':'')+(spk.has(p.id)?' 🔊':'');
    if(sub){cx.font='12px Kanit,sans-serif';cx.fillStyle='rgba(0,0,0,0.7)';cx.fillText(sub,s[0]+1,y-9);cx.fillStyle='#e8c66a';cx.fillText(sub,s[0],y-10);}
    STAGE.plates.push({x,y,w,h,id:p.id});
  }
  cx.font='600 14px Kanit,sans-serif';cx.fillStyle='rgba(243,220,148,0.7)';
  for(const e of STAGE.empty||[]){const s=stageScreen(e.x,STAGE_Y+1.1,e.z);if(s)cx.fillText('+ ว่าง',s[0],s[1]);}
  cx.textBaseline='alphabetic';
}
