// ---------- สร้างแผนที่ ----------
let CANDLESYS=null;
let builtMap="",builtKey="",world=null,TORCHES=[],CANDLES=[],FIREFLIES=null,CRYSTAL=null,RUNE=null,SNITCH=null,BANNERS=[],SNOW=null;
// แผนที่ที่สร้างแล้วเก็บไว้ใช้ซ้ำ (LRU) — กลับมาแผนที่เดิมไม่ต้องสร้าง/อัปโหลด GPU ใหม่ • ตัวแปรที่ผูกกับแผนที่ต้องอยู่ในรายการนี้ทั้งหมด
const WCACHE=new Map(),WCACHE_MAX=3;
// key ของแคช = id + เวอร์ชันไฟล์ (เมนูสร้างแผนที่จากโค้ดไว้ก่อนไฟล์แผนที่ id เดียวกันโหลดเสร็จ → ห้ามเอาของเก่ามาใช้)
function wkey(id){const f=MAPS[id]&&MAPS[id].fm;return f?id+'#'+(f.v||0):id;}
function buildWorld(id){
  if(world){
    scene.remove(world);
    if(PROPV.g){if(PROPV.g.parent)PROPV.g.parent.remove(PROPV.g);disposeTree(PROPV.g);PROPV.g=null;}   // prop สร้างใหม่ทุกเกมจาก snapshot
    if(BLDV.g){if(BLDV.g.parent)BLDV.g.parent.remove(BLDV.g);disposeTree(BLDV.g);BLDV.g=null;}   // บ้านพังได้ก็เช่นกัน
    WCACHE.delete(builtKey);WCACHE.set(builtKey,{world,CANDLESYS,TORCHES,CANDLES,FIREFLIES,CRYSTAL,RUNE,SNITCH,BANNERS,SNOW});
    const key=wkey(id);
    for(const [k,v] of WCACHE){if(WCACHE.size<=WCACHE_MAX)break;if(k===key)continue;WCACHE.delete(k);disposeTree(v.world);}
  }
  clearDyn();clearDebris();
  prefetchModels([...FILE_MODELS(),"mesh_fire_wing","mesh_storm_claw","mesh_ice_burst","mesh_ice_spire","mesh_ice_sword","mesh_ice_axe","mesh_ice_circle"]);prefetchFx();
  const FM=MAPS[id]&&MAPS[id].fm;
  setSky(FM?(FM.sky==='sunset'||FM.sky==='day'?'sunset':'night'):id==='pitch'||id==='meadow'||id==='ruins'||id==='test'?'sunset':'night');
  const cached=WCACHE.get(wkey(id));
  if(cached){
    WCACHE.delete(wkey(id));
    ({world,CANDLESYS,TORCHES,CANDLES,FIREFLIES,CRYSTAL,RUNE,SNITCH,BANNERS,SNOW}=cached);
    scene.add(world);builtMap=id;builtKey=wkey(id);
  }else{
    world=new THREE.Group();scene.add(world);
    builtMap=id;builtKey=wkey(id);CANDLESYS=null;TORCHES=[];CANDLES=[];FIREFLIES=null;CRYSTAL=null;RUNE=null;SNITCH=null;BANNERS=[];SNOW=null;
    if(FM)buildFileMap(id);else if(id==='forest')buildForest();else if(id==='pitch')buildPitch();else if(id==='hogsmeade')buildHogsmeade();else if(id==='greathall')buildGreatHall();else if(id==='meadow')buildMeadow();else if(id==='lake')buildLake();else if(id==='ruins')buildRuins();else if(id==='test')buildTest();else buildCastle();
    batchStatic(world,new Set([RUNE,CRYSTAL,SNITCH,FIREFLIES&&FIREFLIES.pts,...CANDLES.map(c=>c.g),...BANNERS.map(b=>b.m)].filter(Boolean)));
    setTimeout(prewarmShaders,0);
  }
  gl.shadowMap.needsUpdate=true;
  const ext=Math.max(MW,MH)*S3/2+12;
  Object.assign(moonL.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,near:1,far:400});
  moonL.shadow.camera.updateProjectionMatrix();
  const ms=id==='castle'||id==='greathall'||QUAL.mode!=='high'?2048:4096;
  if(moonL.shadow.mapSize.x!==ms){moonL.shadow.mapSize.set(ms,ms);if(moonL.shadow.map){moonL.shadow.map.dispose();moonL.shadow.map=null;}}
}
function addW(o){world.add(o);return o;}
// อุ่นเชดเดอร์ล่วงหน้า (ตอนโหลดด่าน/นับถอยหลัง) — ลดอาการกระตุกตอนใช้สกิลครั้งแรก
let _prewarmed=false;
function prewarmShaders(){
  try{
    const grp=new THREE.Group();grp.position.set(0,-800,0);
    if(!_prewarmed){
      const add=o=>{grp.add(o);return o;};
      add(makeColossus());add(makeMagicCircle());
      const st=add(new THREE.Group());st.add(makeIceSword());st.add(makeIceAxe());add(makeKiteShield());
      add(new THREE.Mesh(_iceDisc,iceFloorMat(0.5)));add(new THREE.Mesh(_iceEdge,new THREE.MeshBasicMaterial({color:'#9fe4ff',transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})));
      add(new THREE.Mesh(_iceSpk,iceMat(0.85)));
      for(const c of ['#ff6a2a','#bfeaff','#ffb347','#9fe0ff'])add(makeProj(c,'fire').g);
      add(new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),iceMat(0.6,'#4aa0d8')));
    }
    scene.add(grp);
    const done=()=>{scene.remove(grp);if(!_prewarmed){disposeTree(grp);_prewarmed=true;}};
    if(gl.compileAsync)gl.compileAsync(scene,cam).then(done,done);else{gl.compile(scene,cam);done();}
  }catch(e){console.warn('prewarm',e);}
}
// รวมชิ้นส่วนฉากที่ไม่ขยับและใช้วัสดุเดียวกันเป็น mesh เดียว (ลด draw call จากหลายร้อยเหลือไม่กี่สิบ)
function batchStatic(root,skip){
  root.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(root.matrixWorld).invert(),groups=new Map();
  root.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh||!o.visible||Array.isArray(o.material)||o.material.transparent)return;
    for(let q=o;q&&q!==root;q=q.parent)if(skip.has(q)||!q.visible)return;
    if(o.matrixWorld.determinant()<0)return;
    const g=o.geometry;if(g.morphAttributes&&Object.keys(g.morphAttributes).length)return;
    const key=o.material.uuid+'|'+Object.keys(g.attributes).sort().join(',')+'|'+(g.index?1:0)+'|'+o.castShadow+'|'+o.receiveShadow;
    let L=groups.get(key);if(!L)groups.set(key,L=[]);L.push(o);
  });
  const m4=new THREE.Matrix4();
  for(const L of groups.values()){
    if(L.length<2)continue;
    const geos=L.map(o=>{const g=o.geometry.clone();g.applyMatrix4(m4.multiplyMatrices(inv,o.matrixWorld));return g;});
    const merged=mergeGeometries(geos,false);
    geos.forEach(g=>g.dispose());
    if(!merged)continue;
    const m=new THREE.Mesh(merged,L[0].material);m.castShadow=L[0].castShadow;m.receiveShadow=L[0].receiveShadow;
    root.add(m);
    for(const o of L)o.parent.remove(o);
  }
}

// เทียนลอย: ไส้เทียนเป็น InstancedMesh ชิ้นเดียว + เปลวไฟเป็น Points ชิ้นเดียว (เดิมเทียนละ 2 draw call → รวมเหลือ 2 ทั้งหมด)
function makeCandles(n,x0,x1,z0,z1,y0,y1){
  const wax=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09,0.09,0.55,6),new THREE.MeshStandardMaterial({color:'#f3ead2',emissive:'#5a4a30',roughness:0.6}),n);
  const pos=new Float32Array(n*3),xs=[],ys=[],zs=[],ph=[];
  for(let i=0;i<n;i++){xs.push(rnd(x0,x1));zs.push(rnd(z0,z1));ys.push(rnd(y0,y1));ph.push(rnd(0,10));}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({map:glowTex,color:hdr('#ffcc66',2.4),size:1.15,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  pts.frustumCulled=false;wax.frustumCulled=false;addW(wax);addW(pts);
  CANDLESYS={n,wax,pts,pos,xs,ys,zs,ph,m:new THREE.Matrix4()};updateCandles(0);
}
function updateCandles(now){
  const C=CANDLESYS;
  for(let i=0;i<C.n;i++){
    const y=C.ys[i]+Math.sin(now/900+C.ph[i])*0.3;
    C.m.makeTranslation(C.xs[i],y,C.zs[i]);C.wax.setMatrixAt(i,C.m);
    C.pos[i*3]=C.xs[i];C.pos[i*3+1]=y+0.42;C.pos[i*3+2]=C.zs[i];
  }
  C.wax.instanceMatrix.needsUpdate=true;C.pts.geometry.attributes.position.needsUpdate=true;
}
function buildCastle(){
  scene.fog.color.set('#151a33');scene.fog.near=50;scene.fog.far=170;
  hemi.color.set('#8fa6ff');hemi.groundColor.set('#2a1f1a');hemi.intensity=0.55;moonL.intensity=1.0;
  const fc=document.createElement('canvas');fc.width=W;fc.height=H;
  const f=fc.getContext('2d');
  f.fillStyle='#2a2630';f.fillRect(0,0,W,H);
  for(let y=0;y<H;y+=50)for(let x=0;x<W;x+=50){const v=Math.random()*16;f.fillStyle=`rgb(${70+v},${66+v},${78+v})`;f.fillRect(x+2,y+2,46,46);
    for(let k=0;k<6;k++){f.fillStyle=`rgba(0,0,0,${Math.random()*0.08})`;f.fillRect(x+2+Math.random()*40,y+2+Math.random()*40,4+Math.random()*8,2+Math.random()*6);}}
  f.fillStyle='rgba(77,163,255,0.07)';f.fillRect(20,20,260,H-40);
  f.fillStyle='rgba(255,90,90,0.07)';f.fillRect(W-280,20,260,H-40);
  const ft=new THREE.CanvasTexture(fc);ft.colorSpace=THREE.SRGBColorSpace;ft.anisotropy=gl.capabilities.getMaxAnisotropy();
  const fl=addW(new THREE.Mesh(new THREE.PlaneGeometry(W*S3,H*S3),new THREE.MeshStandardMaterial({map:ft,roughness:0.85})));
  fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;
  const out=addW(new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({color:'#18201a',roughness:1})));
  out.rotation.x=-Math.PI/2;out.position.y=-0.02;out.receiveShadow=true;
  RUNE=addW(new THREE.Mesh(new THREE.PlaneGeometry(19,19),new THREE.MeshBasicMaterial({map:runeTex,color:hdr('#b58cff',1.3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})));
  RUNE.rotation.x=-Math.PI/2;RUNE.position.y=0.03;

  const wm=stoneMat(20,2);
  const hw=W*S3/2,hh=H*S3/2,wh=5,th=1.6;
  const walls=[[0,-hh-th/2,W*S3+th*2,th],[0,hh+th/2,W*S3+th*2,th],[-hw-th/2,0,th,H*S3],[hw+th/2,0,th,H*S3]];
  for(const [x,z,w,d] of walls){
    const m=addW(new THREE.Mesh(new THREE.BoxGeometry(w,wh,d),wm));m.position.set(x,wh/2,z);shadowAll(m);
    const along=w>d,len=along?w:d;
    for(let s=-len/2+1;s<len/2;s+=2.6){
      const c=addW(new THREE.Mesh(new THREE.BoxGeometry(along?1.3:d+0.2,1.1,along?d+0.2:1.3),wm));
      c.position.set(along?x+s:x,wh+0.55,along?z:z+s);shadowAll(c);
    }
  }
  const roofM=new THREE.MeshStandardMaterial({color:'#2b3a6b',roughness:0.7});
  const winM=new THREE.MeshBasicMaterial({color:hdr('#ffc36b',1.5)});
  const tower=(x,z,r,hgt,windows)=>{
    const t=addW(new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.1,hgt,18),stoneMat(4,hgt/4)));t.position.set(x,hgt/2,z);shadowAll(t);
    const rf=addW(new THREE.Mesh(new THREE.ConeGeometry(r*1.3,r*2.2,18),roofM));rf.position.set(x,hgt+r*1.1,z);shadowAll(rf);
    for(let i=0;i<windows;i++){
      const a=Math.random()*Math.PI*2,y=rnd(hgt*0.3,hgt*0.9);
      const wnd=addW(new THREE.Mesh(new THREE.PlaneGeometry(r*0.25,r*0.45),winM));
      wnd.position.set(x+Math.cos(a)*(r+0.05),y,z+Math.sin(a)*(r+0.05));wnd.lookAt(x+Math.cos(a)*r*3,y,z+Math.sin(a)*r*3);
    }
  };
  for(const sx of [-1,1])for(const sz of [-1,1])tower(sx*(hw+1.5),sz*(hh+1.5),3.2,13,3);
  const keep=addW(new THREE.Mesh(new THREE.BoxGeometry(50,22,18),stoneMat(10,4,'#9a93a8')));keep.position.set(0,11,-75);shadowAll(keep);
  const hallRoof=addW(new THREE.Mesh(new THREE.CylinderGeometry(0.1,13,10,4,1),roofM));hallRoof.rotation.y=Math.PI/4;hallRoof.scale.set(2.7,1,1);hallRoof.position.set(0,27,-75);
  for(let i=0;i<14;i++){const w=addW(new THREE.Mesh(new THREE.PlaneGeometry(1.4,3),winM));w.position.set(-21+i*3.2,rnd(8,16),-65.9);}
  [[-38,-70,5,40],[-22,-88,4,52],[24,-90,4.5,58],[40,-68,5.5,36],[-70,-40,4,30],[72,-35,4.5,34],[0,-95,6,64]].forEach(([x,z,r,h])=>tower(x,z,r,h,5));
  for(const x of [-30,-10,10,30])for(const sz of [-1,1]){
    const z=sz*(hh-0.1);
    const st=addW(new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.06,0.9,6),new THREE.MeshStandardMaterial({color:'#3a2a1a'})));st.position.set(x,3.2,z);
    const fl2=addW(new THREE.Sprite(glowMat('#ffa040',2.2)));fl2.position.set(x,3.85,z);fl2.scale.set(1.6,2.2,1);
    TORCHES.push({fl:fl2,x,z,ph:Math.random()*10});
  }
  [[-20,-1],[20,-1],[-20,1],[20,1]].forEach(([x,sz],i)=>{
    const L=addW(new THREE.PointLight('#ff9a40',1.4,26,2));L.position.set(x,4,sz*(hh-1));TORCHES[i].light=L;
  });
  for(const c of OBS){
    const r=c.r*S3,g=new THREE.Group(),m=stoneMat(3,3);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(r*1.25,r*1.35,0.6,20),m);base.position.y=0.3;
    const col=new THREE.Mesh(new THREE.CylinderGeometry(r*0.95,r,8,20),m);col.position.y=4.6;
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(r*1.3,r*1.0,0.7,20),m);cap.position.y=8.95;
    g.add(base,col,cap);
    if(c.r<40){const fire=new THREE.Sprite(glowMat('#7fb0ff',2.2));fire.position.y=9.9;fire.scale.set(2.2,2.8,1);g.add(fire);}
    g.position.set(tx(c.x),0,tz(c.y));shadowAll(g);addW(g);
  }
  makeCandles(70,-38,38,-23,23,10,15);
}

function buildHogsmeade(){
  scene.fog.color.set('#1b2438');scene.fog.near=40;scene.fog.far=165;
  hemi.color.set('#b4c6ff');hemi.groundColor.set('#5a6684');hemi.intensity=0.7;moonL.intensity=1.0;
  const R=mulberry(4242),hw=MW*S3/2,hh=MH*S3/2;
  const snow=texCanvas(256,256,g=>{g.fillStyle='#b4c3dc';g.fillRect(0,0,256,256);for(let i=0;i<2600;i++){g.fillStyle=R()<0.5?'rgba(235,242,255,.55)':'rgba(120,145,190,.35)';g.fillRect(R()*256,R()*256,2+R()*3,1+R()*2);}});
  snow.wrapS=snow.wrapT=THREE.RepeatWrapping;snow.repeat.set(MW*S3/9,MH*S3/9);
  const fl=addW(new THREE.Mesh(new THREE.PlaneGeometry(MW*S3,MH*S3),new THREE.MeshStandardMaterial({map:snow,roughness:0.95})));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;
  const snow2=snow.clone();snow2.needsUpdate=true;snow2.repeat.set(80,80);
  const out=addW(new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({map:snow2,roughness:1})));out.rotation.x=-Math.PI/2;out.position.y=-0.02;out.receiveShadow=true;
  // ลานหินกลางหมู่บ้าน + บ่อน้ำ
  const plaza=addW(new THREE.Mesh(new THREE.CircleGeometry(15,48),stoneMat(6,6,'#8892a8')));plaza.rotation.x=-Math.PI/2;plaza.position.y=0.03;plaza.receiveShadow=true;
  const stoneM=stoneMat(2,1,'#9a9fb0'),woodD=new THREE.MeshStandardMaterial({color:'#4a3220',roughness:0.9}),goldM=new THREE.MeshStandardMaterial({color:'#e8c060',metalness:0.8,roughness:0.3,emissive:'#3a2a08'});
  const well=new THREE.Group(),wadd=(m,x,y,z,rx)=>{m.position.set(x,y,z);if(rx)m.rotation.x=rx;well.add(m);return m;};
  wadd(new THREE.Mesh(new THREE.CylinderGeometry(1.8,2,1.1,20),stoneM),0,0.55,0);
  wadd(new THREE.Mesh(new THREE.CircleGeometry(1.45,20),new THREE.MeshBasicMaterial({color:'#0e1c3a'})),0,1.12,0,-Math.PI/2);
  for(const sx of[-1,1])wadd(new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,3.6,8),woodD),sx*1.5,2.3,0);
  wadd(new THREE.Mesh(new THREE.ConeGeometry(2.6,1.3,4),new THREE.MeshStandardMaterial({color:'#4a3a3a'})),0,4.6,0).rotation.y=Math.PI/4;
  shadowAll(well);addW(well);
  // วัสดุร่วม (ให้รวม mesh ได้)
  const wallMs=['#cbb89a','#b9a7a0','#c9c2a8','#a9b4c4'].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:0.9}));
  const roofM=new THREE.MeshStandardMaterial({color:'#4a3438',roughness:0.85}),capM=new THREE.MeshStandardMaterial({color:'#eef3fb',roughness:1});
  const doorM=new THREE.MeshStandardMaterial({color:'#5a3a22',roughness:0.9}),winM=new THREE.MeshBasicMaterial({color:hdr('#ffc36b',1.6)});
  const beamM=new THREE.MeshStandardMaterial({color:'#3a281a',roughness:0.9});
  const stripe=new THREE.MeshStandardMaterial({map:stripeTex('#b8322e','#f0e8d8'),roughness:0.9,side:THREE.DoubleSide});
  const barM=new THREE.MeshStandardMaterial({color:'#7a5432',roughness:0.9}),poleM=new THREE.MeshStandardMaterial({color:'#1a1a22',roughness:0.6});
  const lampSpr=new THREE.SpriteMaterial({map:glowTex,color:hdr('#ffc870',2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true});
  for(const o of OBS){
    const x=tx(o.x),z=tz(o.y);
    if(o.k==='house'&&o.bi!==undefined)continue;        // บ้านพังได้ สร้างใน syncBld
    if(o.k==='house'){
      const g=new THREE.Group(),w=o.w*S3,d=o.d*S3,wh=4.2;
      const wall=new THREE.Mesh(new THREE.BoxGeometry(w,wh,d),wallMs[Math.floor(o.s*4)%4]);wall.position.y=wh/2;g.add(wall);
      for(const sx of[-1,1])for(const sz of[-1,1]){const b=new THREE.Mesh(new THREE.BoxGeometry(0.28,wh,0.28),beamM);b.position.set(sx*w/2,wh/2,sz*d/2);g.add(b);}
      const rg=new THREE.Group();rg.scale.set(w*0.78,1,d*0.78);rg.position.y=wh+1.7;
      const roof=new THREE.Mesh(new THREE.ConeGeometry(1,3.4,4),roofM);roof.rotation.y=Math.PI/4;rg.add(roof);
      const cap=new THREE.Mesh(new THREE.ConeGeometry(0.84,2.9,4),capM);cap.rotation.y=Math.PI/4;cap.position.y=0.22;rg.add(cap);g.add(rg);
      const ch=new THREE.Mesh(new THREE.BoxGeometry(0.9,2.8,0.9),stoneM);ch.position.set(w*0.25,wh+2.2,-d*0.12);g.add(ch);
      const chc=new THREE.Mesh(new THREE.BoxGeometry(1.05,0.3,1.05),capM);chc.position.set(w*0.25,wh+3.7,-d*0.12);g.add(chc);
      for(const sx of[-1,1]){const wn=new THREE.Mesh(new THREE.PlaneGeometry(0.95,1.2),winM);wn.position.set(sx*w*0.27,2.5,d/2+0.03);g.add(wn);const wb=wn.clone();wb.position.z=-d/2-0.03;wb.rotation.y=Math.PI;g.add(wb);}
      const dr=new THREE.Mesh(new THREE.PlaneGeometry(1.1,2.2),doorM);dr.position.set(0,1.1,d/2+0.03);g.add(dr);
      g.rotation.y=o.ry;g.position.set(x,0,z);shadowAll(g);addW(g);
    }else if(o.k==='stall'){
      const g=new THREE.Group();
      const tb=new THREE.Mesh(new THREE.BoxGeometry(3.2,1,1.8),barM);tb.position.y=0.5;g.add(tb);
      for(const sx of[-1,1])for(const sz of[-1,1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,3.2,6),woodD);p.position.set(sx*1.55,1.6,sz*0.95);g.add(p);}
      const aw=new THREE.Mesh(new THREE.BoxGeometry(3.7,0.1,2.6),stripe);aw.position.y=3.25;aw.rotation.x=0.18;g.add(aw);
      for(let i=0;i<5;i++){const it=new THREE.Mesh(new THREE.SphereGeometry(0.2,8,6),new THREE.MeshStandardMaterial({color:['#d94a3a','#e8b32a','#4aa05a','#8a5ad0','#e8e2d0'][i],roughness:0.7}));it.position.set(-1.2+i*0.6,1.2,0);g.add(it);}
      g.rotation.y=o.ry;g.position.set(x,0,z);shadowAll(g);addW(g);
    }else if(o.k==='lamp'){
      const pl=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.1,4.4,6),poleM);pl.position.set(x,2.2,z);addW(pl);
      const lb=new THREE.Mesh(new THREE.BoxGeometry(0.45,0.6,0.45),winM);lb.position.set(x,4.6,z);addW(lb);
      const sp=new THREE.Sprite(lampSpr);sp.scale.set(2.4,2.4,1);sp.position.set(x,4.6,z);addW(sp);
    }else if(o.k==='barrel'){
      const b=new THREE.Mesh(new THREE.CylinderGeometry(0.62,0.62,1.3,12),barM);b.position.set(x,0.65,z);shadowAll(b);addW(b);
    }
  }
  // รั้วไม้รอบหมู่บ้าน
  const fx=hw-0.3,fz=hh-0.3,posts=[];
  for(let a=-fx;a<=fx;a+=2.6)posts.push([a,-fz],[a,fz]);
  for(let a=-fz;a<=fz;a+=2.6)posts.push([-fx,a],[fx,a]);
  const fp=new THREE.InstancedMesh(new THREE.BoxGeometry(0.22,1.5,0.22),woodD,posts.length),m4=new THREE.Matrix4();
  posts.forEach(([a,b],i)=>{m4.makeTranslation(a,0.75,b);fp.setMatrixAt(i,m4);});fp.castShadow=true;addW(fp);
  for(const [w,d,x,z] of [[fx*2,0.12,0,-fz],[fx*2,0.12,0,fz],[0.12,fz*2,-fx,0],[0.12,fz*2,fx,0]])for(const y of[0.55,1.1]){const r=new THREE.Mesh(new THREE.BoxGeometry(w,0.1,d),woodD);r.position.set(x,y,z);addW(r);}
  // สนไกลๆ รอบนอก (instanced)
  const NT=260,pm=new THREE.MeshStandardMaterial({color:'#1d3a2e',roughness:0.95,flatShading:true}),sm=new THREE.MeshStandardMaterial({color:'#e8eff9',roughness:1,flatShading:true});
  const t1=new THREE.InstancedMesh(new THREE.ConeGeometry(2.4,5.5,7),pm,NT),t2=new THREE.InstancedMesh(new THREE.ConeGeometry(1.8,4.4,7),pm,NT),t3=new THREE.InstancedMesh(new THREE.ConeGeometry(1.2,2.4,7),sm,NT),tk=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3,0.4,2,6),woodD,NT);
  const q=new THREE.Quaternion(),ps=new THREE.Vector3(),sc=new THREE.Vector3();
  for(let i=0;i<NT;i++){
    const side=Math.floor(R()*4),d=rnd(2,34),u=R();let x,z;
    if(side===0){x=(u*2-1)*(hw+d);z=-hh-d;}else if(side===1){x=(u*2-1)*(hw+d);z=hh+d;}else if(side===2){x=-hw-d;z=(u*2-1)*(hh+d);}else{x=hw+d;z=(u*2-1)*(hh+d);}
    const s=0.8+R()*0.9;
    for(const [M,y] of [[tk,1*s],[t1,4.6*s],[t2,7.4*s],[t3,10.1*s]]){m4.compose(ps.set(x,y,z),q,sc.set(s,s,s));M.setMatrixAt(i,m4);}
  }
  for(const M of [t1,t2,t3,tk]){M.castShadow=true;addW(M);}
  // ภูเขาหิมะ + ปราสาทฮอกวอตส์ไกลๆ (ไม่โดนหมอก)
  const mtM=new THREE.MeshStandardMaterial({color:'#8a98b8',roughness:1,flatShading:true,fog:false}),snM=new THREE.MeshStandardMaterial({color:'#f2f6ff',roughness:1,flatShading:true,fog:false});
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2+0.2,r=rnd(420,500),h=rnd(60,120),rad=rnd(80,130);
    const m=addW(new THREE.Mesh(new THREE.ConeGeometry(rad,h,7),mtM));m.position.set(Math.cos(a)*r,h/2-2,Math.sin(a)*r);
    const c=addW(new THREE.Mesh(new THREE.ConeGeometry(rad*0.42,h*0.34,7),snM));c.position.set(m.position.x,h*0.84-2,m.position.z);}
  const cas=new THREE.Group(),cm=new THREE.MeshBasicMaterial({color:'#222a45',fog:false}),cw=new THREE.SpriteMaterial({map:glowTex,color:hdr('#ffc36b',2),fog:false,depthWrite:false,blending:THREE.AdditiveBlending,transparent:true});
  const tower=(x,z,r,h)=>{const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.1,h,10),cm);t.position.set(x,h/2,z);cas.add(t);const c=new THREE.Mesh(new THREE.ConeGeometry(r*1.35,r*2.6,10),cm);c.position.set(x,h+r*1.3,z);cas.add(c);
    for(let i=0;i<3;i++){const w=new THREE.Sprite(cw);w.scale.set(2.2,3,1);const a=rnd(-0.7,0.7);w.position.set(x+Math.sin(a)*r*1.05,h*rnd(0.4,0.85),z+Math.cos(a)*r*1.05);cas.add(w);}};
  {const kp=new THREE.Mesh(new THREE.BoxGeometry(150,50,30),cm);kp.position.set(0,25,0);cas.add(kp);}
  [[-55,6,10,95],[-28,10,8,120],[8,12,12,140],[42,8,9,105],[68,4,10,85],[-80,0,7,70]].forEach(a=>tower(...a));
  cas.position.set(-60,0,-340);addW(cas);
  makeSnow(hw,hh);
}

function buildGreatHall(){
  scene.fog.color.set('#0e1120');scene.fog.near=70;scene.fog.far=240;
  hemi.color.set('#ffe0b0');hemi.groundColor.set('#2a2030');hemi.intensity=0.95;moonL.intensity=0.7;
  const R=mulberry(909),hw=MW*S3/2,hh=MH*S3/2,WH=17,TH=1.6;
  // พื้นหินอ่อนเข้ม + พรมแดงตรงทางเดินกลาง
  const cw=Math.round(MW/2),ch=Math.round(MH/2),fc=document.createElement('canvas');fc.width=cw;fc.height=ch;const f=fc.getContext('2d');
  f.fillStyle='#2a2833';f.fillRect(0,0,cw,ch);
  for(let y=0;y<ch;y+=40)for(let x=0;x<cw;x+=40){const v=R()*18;f.fillStyle=`rgb(${56+v},${54+v},${68+v})`;f.fillRect(x+1.5,y+1.5,37,37);}
  f.fillStyle='#46121c';f.fillRect(0,ch*0.375,cw,ch*0.25);f.strokeStyle='#d9b45a';f.lineWidth=3;f.strokeRect(2,ch*0.375+8,cw-4,ch*0.25-16);
  f.fillStyle='rgba(217,180,90,0.5)';for(let x=40;x<cw;x+=80){f.beginPath();f.moveTo(x,ch*0.5-8);f.lineTo(x+8,ch*0.5);f.lineTo(x,ch*0.5+8);f.lineTo(x-8,ch*0.5);f.fill();}
  const ft=new THREE.CanvasTexture(fc);ft.colorSpace=THREE.SRGBColorSpace;ft.anisotropy=gl.capabilities.getMaxAnisotropy();
  const fl=addW(new THREE.Mesh(new THREE.PlaneGeometry(MW*S3,MH*S3),new THREE.MeshStandardMaterial({map:ft,roughness:0.55,metalness:0.1})));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;
  const out=addW(new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({color:'#10131c',roughness:1})));out.rotation.x=-Math.PI/2;out.position.y=-0.02;
  // ผนัง + เสาค้ำ + หน้าต่างโค้งสูงส่องแสงจันทร์
  const wm=stoneMat(24,3,'#6e6c84'),pillM=stoneMat(2,6,'#7c7a92');
  const walls=[[0,-hh-TH/2,MW*S3+TH*2,TH],[0,hh+TH/2,MW*S3+TH*2,TH],[-hw-TH/2,0,TH,MH*S3],[hw+TH/2,0,TH,MH*S3]];
  for(const [x,z,w,d] of walls){const m=addW(new THREE.Mesh(new THREE.BoxGeometry(w,WH,d),wm));m.position.set(x,WH/2,z);shadowAll(m);}
  const arch=(w,h)=>{const sh=new THREE.Shape();sh.moveTo(-w/2,0);sh.lineTo(-w/2,h-w/2);sh.absarc(0,h-w/2,w/2,Math.PI,0,true);sh.lineTo(w/2,0);sh.lineTo(-w/2,0);return new THREE.ShapeGeometry(sh,16);};
  const winTex=texCanvas(8,128,(g)=>{const r=g.createLinearGradient(0,0,0,128);r.addColorStop(0,'#bcd0ff');r.addColorStop(0.55,'#5a74c8');r.addColorStop(1,'#1c2450');g.fillStyle=r;g.fillRect(0,0,8,128);});
  const winM=new THREE.MeshBasicMaterial({color:hdr('#7f9cff',1.5),side:THREE.DoubleSide,fog:false}),mullM=new THREE.MeshStandardMaterial({color:'#2a2838',roughness:0.9});
  const nW=7,gap=MW*S3/nW;
  for(let i=0;i<nW;i++){
    const x=-hw+gap*(i+0.5);
    for(const sz of[-1,1]){
      const wn=new THREE.Mesh(arch(3.4,10),winM);wn.position.set(x,4.2,sz*(hh-0.05));if(sz>0)wn.rotation.y=Math.PI;addW(wn);
      const m1=new THREE.Mesh(new THREE.BoxGeometry(0.16,9,0.3),mullM);m1.position.set(x,8.2,sz*(hh-0.12));addW(m1);
      const pl=new THREE.Mesh(new THREE.BoxGeometry(1.4,WH,1.2),pillM);pl.position.set(x+gap/2,WH/2,sz*(hh-0.5));shadowAll(pl);addW(pl);
    }
  }
  // ผนังท้ายห้อง (โต๊ะอาจารย์): หน้าต่างบานใหญ่ 3 บาน
  for(const z of[-12,0,12]){const wn=new THREE.Mesh(arch(5,14),winM);wn.position.set(hw-0.05,3,z);wn.rotation.y=-Math.PI/2;addW(wn);}
  // ธงสี่บ้านบนผนังยาว (ตราเดียวกับหน้าสร้างตัวละคร)
  for(let i=0;i<4;i++){
    const x=-hw+gap*(i+2),a=crestBanner(i,x,9.2,-hh+1.25,2.6);addW(a);
    const b=crestBanner((i+2)%4,x,9.2,hh-1.25,2.6);b.rotation.y=Math.PI;addW(b);
  }
  // โต๊ะยาว + ม้านั่ง + จานทองเหลือง
  const woodM=new THREE.MeshStandardMaterial({color:'#9a6a3a',roughness:0.75}),benchM=new THREE.MeshStandardMaterial({color:'#7a5230',roughness:0.85}),clothM=new THREE.MeshStandardMaterial({color:'#3a4f94',roughness:0.9});
  const goldM=new THREE.MeshStandardMaterial({color:'#e8c060',metalness:0.85,roughness:0.25,emissive:'#3a2a08'});
  const cupG=new THREE.CylinderGeometry(0.1,0.07,0.3,8),plG=new THREE.CylinderGeometry(0.26,0.26,0.04,12);
  for(const t of (MAPS.greathall.tables||[])){
    const dx=(t.x1-t.x0)*S3,dz=(t.y1-t.y0)*S3,len=Math.hypot(dx,dz),cx=tx((t.x0+t.x1)/2),cz=tz((t.y0+t.y1)/2),ang=-Math.atan2(dz,dx);
    const g=new THREE.Group();
    const top=new THREE.Mesh(new THREE.BoxGeometry(len+1,0.2,1.7),woodM);top.position.y=1.3;g.add(top);
    const run=new THREE.Mesh(new THREE.BoxGeometry(len+1.04,0.04,0.9),clothM);run.position.y=1.42;g.add(run);
    for(const sz of[-1,1]){const b=new THREE.Mesh(new THREE.BoxGeometry(len+0.6,0.14,0.55),benchM);b.position.set(0,0.78,sz*1.35);g.add(b);}
    for(let x=-len/2+1;x<len/2;x+=len/5){for(const sx of[-0.8,0.8]){const lg=new THREE.Mesh(new THREE.BoxGeometry(0.22,1.3,0.22),woodM);lg.position.set(x,0.65,sx);g.add(lg);}}
    const n=Math.max(4,Math.floor(len/1.8));
    for(let i=0;i<n;i++){const x=-len/2+(i+0.5)*len/n;for(const sz of[-0.55,0.55]){const c=new THREE.Mesh(cupG,goldM);c.position.set(x,1.62,sz);g.add(c);const pl=new THREE.Mesh(plG,goldM);pl.position.set(x+0.5,1.46,sz*0.7);g.add(pl);}}
    g.position.set(cx,0,cz);g.rotation.y=ang;shadowAll(g);addW(g);
  }
  // แท่นยก + เก้าอี้โต๊ะอาจารย์
  const dais=addW(new THREE.Mesh(new THREE.BoxGeometry(7,0.5,27),stoneMat(3,6,'#7a7890')));dais.position.set(tx(2160)+1.2,0.25,0);dais.receiveShadow=true;
  for(let i=0;i<5;i++){const c=new THREE.Mesh(new THREE.BoxGeometry(0.9,i===2?3.2:2.3,0.9),goldM);c.position.set(tx(2160)+2.4,i===2?2.1:1.65,tz(570+i*90));addW(c);}
  // เสาในห้อง (ชนได้)
  for(const c of OBS){
    if(c.k!=='pillar')continue;
    const r=c.r*S3,g=new THREE.Group();
    const base=new THREE.Mesh(new THREE.CylinderGeometry(r*1.3,r*1.4,0.7,18),pillM);base.position.y=0.35;
    const col=new THREE.Mesh(new THREE.CylinderGeometry(r*0.95,r,WH-2,18),pillM);col.position.y=WH/2;
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(r*1.4,r*1.0,0.8,18),pillM);cap.position.y=WH-0.6;
    g.add(base,col,cap);g.position.set(tx(c.x),0,tz(c.y));shadowAll(g);addW(g);
  }
  // คบไฟข้างผนัง + เทียนลอยเต็มเพดานเวทมนตร์
  for(let x=-hw+3;x<hw;x+=gap/2)for(const sz of[-1,1]){
    const fl2=addW(new THREE.Sprite(glowMat('#ffa040',2.2)));fl2.position.set(x,4.2,sz*(hh-0.9));fl2.scale.set(1.5,2.1,1);TORCHES.push({fl:fl2,x,z:sz*hh,ph:R()*10});
  }
  makeCandles(120,-hw+3,hw-3,-hh+3,hh-3,7,13);
}

function buildForest(){
  scene.fog.color.set('#0a1510');scene.fog.near=18;scene.fog.far=105;
  hemi.color.set('#7f9fc0');hemi.groundColor.set('#1a2416');hemi.intensity=0.5;moonL.intensity=0.85;
  const R=mulberry(777);
  const grass=texCanvas(512,512,(g)=>{
    g.fillStyle='#1f3a1c';g.fillRect(0,0,512,512);
    for(let i=0;i<9000;i++){const v=R();g.fillStyle=v<0.5?`rgba(40,${70+R()*50|0},30,0.55)`:v<0.85?`rgba(20,${40+R()*30|0},18,0.5)`:'rgba(70,55,35,0.45)';g.fillRect(R()*512,R()*512,2+R()*3,2+R()*6);}
  });
  grass.wrapS=grass.wrapT=THREE.RepeatWrapping;grass.repeat.set(80,80);grass.anisotropy=gl.capabilities.getMaxAnisotropy();
  const gr=addW(new THREE.Mesh(new THREE.PlaneGeometry(700,700),new THREE.MeshStandardMaterial({map:grass,roughness:1})));
  gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;
  const dirt=texCanvas(256,256,(g)=>{const r=g.createRadialGradient(128,128,40,128,128,128);r.addColorStop(0,'rgba(80,64,44,1)');r.addColorStop(0.8,'rgba(70,56,38,0.8)');r.addColorStop(1,'rgba(70,56,38,0)');g.fillStyle=r;g.fillRect(0,0,256,256);});
  const cl=addW(new THREE.Mesh(new THREE.PlaneGeometry(36,36),new THREE.MeshStandardMaterial({map:dirt,transparent:true,roughness:1,depthWrite:false})));
  cl.rotation.x=-Math.PI/2;cl.position.y=0.02;cl.receiveShadow=true;
  RUNE=addW(new THREE.Mesh(new THREE.PlaneGeometry(26,26),new THREE.MeshBasicMaterial({map:runeTex,color:hdr('#5fd8ff',1.2),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})));
  RUNE.rotation.x=-Math.PI/2;RUNE.position.y=0.04;

  // ต้นไม้ในแผนที่ (ชนได้) + ต้นไม้รอบนอก (ตกแต่ง)
  const trees=OBS.filter(o=>o.k==='tree').map(o=>({x:tx(o.x),z:tz(o.y),r:o.r*S3,s:o.s}));
  const hw=MW*S3/2,hh=MH*S3/2;
  for(let i=0;i<420;i++){
    const side=Math.floor(R()*4),d=rnd(1.5,30);
    let x,z;
    if(side<2){x=rnd(-hw-30,hw+30);z=(side?1:-1)*(hh+d);}else{z=rnd(-hh-30,hh+30);x=(side===2?1:-1)*(hw+d);}
    trees.push({x,z,r:rnd(0.9,1.8),s:R()});
  }
  const n=trees.length;
  const trunkG=new THREE.CylinderGeometry(0.75,1,1,8);trunkG.translate(0,0.5,0);
  const trunks=new THREE.InstancedMesh(trunkG,new THREE.MeshStandardMaterial({color:'#3b2a1e',roughness:1}),n);
  const coneG=new THREE.ConeGeometry(1,1,9);coneG.translate(0,0.5,0);
  const leafM=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:0.95});
  const layers=[0,1,2,3].map(()=>new THREE.InstancedMesh(coneG,leafM,n));
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),ps=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),c=new THREE.Color();
  trees.forEach((t,i)=>{
    const h=9+t.s*7,rot=t.s*6;
    q.setFromAxisAngle(up,rot);
    m4.compose(ps.set(t.x,0,t.z),q,sc.set(t.r,h*0.45,t.r));trunks.setMatrixAt(i,m4);
    for(let L=0;L<4;L++){
      const rad=(3.6-L*0.7)*(0.8+t.s*0.5),y=h*0.25+L*h*0.17;
      m4.compose(ps.set(t.x,y,t.z),q,sc.set(rad,h*0.36,rad));layers[L].setMatrixAt(i,m4);
      c.setHSL(0.3+t.s*0.06,0.45,0.1+L*0.025+t.s*0.04);layers[L].setColorAt(i,c);
    }
  });
  for(const im of [trunks,...layers]){im.castShadow=true;im.receiveShadow=true;addW(im);}

  // หิน
  const rocks=OBS.filter(o=>o.k==='rock');
  const rockM=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:'#6b6a72',roughness:0.95,flatShading:true}),rocks.length);
  rocks.forEach((o,i)=>{q.setFromEuler(new THREE.Euler(o.s*3,o.s*7,o.s*2));const r=o.r*S3*1.15;m4.compose(ps.set(tx(o.x),r*0.35,tz(o.y)),q,sc.set(r,r*0.75,r));rockM.setMatrixAt(i,m4);});
  rockM.castShadow=rockM.receiveShadow=true;addW(rockM);

  // วงหินโบราณกลางป่า + คริสตัลลอย
  const runeStripM=new THREE.MeshBasicMaterial({color:hdr('#5fd8ff',2.2)});
  for(const o of OBS.filter(o=>o.k==='stone')){
    const g=new THREE.Group();
    const s=addW(g);s.position.set(tx(o.x),0,tz(o.y));s.lookAt(0,0,0);
    const st=new THREE.Mesh(new THREE.BoxGeometry(1.5,5.5+o.s*1.5,0.9),stoneMat(1,2,'#8a8794'));st.position.y=2.6;g.add(st);
    const strip=new THREE.Mesh(new THREE.PlaneGeometry(0.25,3),runeStripM);strip.position.set(0,2.8,0.46);g.add(strip);
    shadowAll(g);
  }
  CRYSTAL=addW(new THREE.Group());
  const cr=new THREE.Mesh(new THREE.OctahedronGeometry(1.1,0),new THREE.MeshStandardMaterial({color:'#7fe8ff',emissive:hdr('#3fc8ff',1.6),roughness:0.2,metalness:0.1,flatShading:true}));
  cr.scale.set(1,1.7,1);CRYSTAL.add(cr);
  const cg=new THREE.Sprite(glowMat('#5fd8ff',1.4));cg.scale.setScalar(7);CRYSTAL.add(cg);
  const cL=new THREE.PointLight('#5fd8ff',2.2,30,2);CRYSTAL.add(cL);
  CRYSTAL.position.set(0,7,0);

  // หญ้า พุ่มไม้ เห็ดเรืองแสง
  const tuftG=new THREE.ConeGeometry(0.04,0.45,3);tuftG.translate(0,0.22,0);
  const NT=4200,tufts=new THREE.InstancedMesh(tuftG,new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1}),NT);
  for(let i=0;i<NT;i++){
    q.setFromEuler(new THREE.Euler(rnd(-0.3,0.3),0,rnd(-0.3,0.3)));
    m4.compose(ps.set(rnd(-hw-10,hw+10),0,rnd(-hh-10,hh+10)),q,sc.set(1,rnd(0.35,0.9),1));tufts.setMatrixAt(i,m4);
    c.setHSL(0.27+R()*0.08,0.5,0.12+R()*0.12);tufts.setColorAt(i,c);
  }
  tufts.receiveShadow=true;addW(tufts);
  const NB=200,bush=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,flatShading:true}),NB);
  for(let i=0;i<NB;i++){
    const x=rnd(-hw,hw),z=rnd(-hh,hh);if(Math.hypot(x,z)<14){i--;continue;}
    const s=rnd(0.6,1.4);m4.compose(ps.set(x,s*0.4,z),q.identity(),sc.set(s*1.3,s,s*1.3));bush.setMatrixAt(i,m4);
    c.setHSL(0.3,0.4,0.08+R()*0.06);bush.setColorAt(i,c);
  }
  bush.castShadow=bush.receiveShadow=true;addW(bush);
  const NM=160;
  const stem=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04,0.05,0.25,6),new THREE.MeshStandardMaterial({color:'#d8d0c0'}),NM);
  const cap=new THREE.InstancedMesh(new THREE.SphereGeometry(0.14,10,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshBasicMaterial({color:'#ffffff'}),NM);
  for(let i=0;i<NM;i++){
    const t=trees[Math.floor(R()*Math.min(trees.length,180))],a=R()*Math.PI*2,d=t.r+rnd(0.3,1.2);
    const x=t.x+Math.cos(a)*d,z=t.z+Math.sin(a)*d,s=rnd(0.7,1.5);
    m4.compose(ps.set(x,0.12*s,z),q.identity(),sc.set(s,s,s));stem.setMatrixAt(i,m4);
    m4.compose(ps.set(x,0.25*s,z),q.identity(),sc.set(s,s,s));cap.setMatrixAt(i,m4);
    cap.setColorAt(i,R()<0.5?hdr('#4fe8d0',1.8):hdr('#b77dff',1.8));
  }
  addW(stem);addW(cap);
  makeFireflies(hw,hh,350,R);
}

// ----- ทุ่งหญ้าฮอกวอตส์ (เย็น) -----
function ringTrees(n,rx,rz,jitter,col,R){
  const tg=new THREE.ConeGeometry(1,1,7);tg.translate(0,0.5,0);const trunk=new THREE.CylinderGeometry(0.3,0.4,1,6);trunk.translate(0,0.5,0);
  const im=new THREE.InstancedMesh(tg,new THREE.MeshStandardMaterial({color:col,roughness:0.9,flatShading:true}),n),it=new THREE.InstancedMesh(trunk,new THREE.MeshStandardMaterial({color:'#3a2a1c',roughness:1}),n);
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3();
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2+R()*0.2,j=1+R()*jitter,h=8+R()*9,w=2.6+R()*1.6;
    p.set(Math.cos(a)*rx*j,1.5,Math.sin(a)*rz*j);s.set(w,h,w);m4.compose(p,q,s);im.setMatrixAt(i,m4);
    p.y=0;s.set(1,2,1);m4.compose(p,q,s);it.setMatrixAt(i,m4);}
  im.castShadow=true;addW(im);addW(it);
}
function grassTex(base,seed,rep){const R=mulberry(seed);const t=texCanvas(256,256,g=>{g.fillStyle=base;g.fillRect(0,0,256,256);for(let i=0;i<3200;i++){g.fillStyle=`rgba(${30+R()*40|0},${70+R()*60|0},${20+R()*20|0},0.45)`;g.fillRect(R()*256,R()*256,2,3+R()*4);}for(let i=0;i<90;i++){g.fillStyle=['#f2e6a0','#e8a0c0','#ffffff'][i%3];g.fillRect(R()*256,R()*256,2,2);}});t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);return t;}
function buildMeadow(){
  scene.fog.color.set('#d8a888');scene.fog.near=130;scene.fog.far=520;
  hemi.color.set('#ffe0b8');hemi.groundColor.set('#4a5a2a');hemi.intensity=0.75;moonL.intensity=1.5;
  const R=mulberry(808),hw=MW*S3/2,hh=MH*S3/2;
  const fl=addW(new THREE.Mesh(new THREE.PlaneGeometry(MW*S3,MH*S3),new THREE.MeshStandardMaterial({map:grassTex('#4f8a38',11,MW*S3/10),roughness:0.95})));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;
  const out=addW(new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({map:grassTex('#3f7430',12,90),roughness:1})));out.rotation.x=-Math.PI/2;out.position.y=-0.02;out.receiveShadow=true;
  // ทะเลสาบไกลๆ ด้านใต้ + ปราสาทเงาๆ ด้านเหนือ + ต้นไม้รอบนอกสนาม
  const lake=addW(new THREE.Mesh(new THREE.PlaneGeometry(500,120),new THREE.MeshStandardMaterial({color:'#5a7fa8',roughness:0.15,metalness:0.4})));lake.rotation.x=-Math.PI/2;lake.position.set(0,0.02,hh+80);
  const cm=new THREE.MeshStandardMaterial({color:'#5a4a5a',roughness:1,flatShading:true});
  for(const [x,w,h] of [[-60,18,40],[-30,12,58],[0,26,46],[28,12,64],[55,18,38],[80,10,50]]){const t=addW(new THREE.Mesh(new THREE.BoxGeometry(w,h,14),cm));t.position.set(x,h/2,-hh-170);const c=addW(new THREE.Mesh(new THREE.ConeGeometry(w*0.55,h*0.4,4),cm));c.position.set(x,h+h*0.2,-hh-170);c.rotation.y=Math.PI/4;}
  ringTrees(70,hw+40,hh+40,0.35,'#2f5a2a',R);
  const rockM=new THREE.MeshStandardMaterial({color:'#8a8478',roughness:0.95,flatShading:true}),stM=stoneMat(1,2,'#9a958a');
  for(const o of OBS){const x=tx(o.x),z=tz(o.y);
    if(o.k==='rock'){const m=addW(new THREE.Mesh(new THREE.DodecahedronGeometry(o.r*S3,0),rockM));m.position.set(x,o.r*S3*0.45,z);m.scale.set(1,0.7,1);m.rotation.y=o.s*6;shadowAll(m);}
    else if(o.k==='stone'){const m=addW(new THREE.Mesh(new THREE.BoxGeometry(o.r*S3*1.3,o.hgt,o.r*S3*0.9),stM));m.position.set(x,o.hgt/2,z);m.rotation.set(0,o.s*3,(o.s-0.5)*0.15);shadowAll(m);}
  }
  const cloudM=new THREE.SpriteMaterial({map:glowTex,color:'#ffd6c0',transparent:true,opacity:0.35,depthWrite:false,fog:false});
  for(let i=0;i<18;i++){const c=addW(new THREE.Sprite(cloudM));const a=R()*Math.PI*2,r=200+R()*200;c.position.set(Math.cos(a)*r,70+R()*70,Math.sin(a)*r);c.scale.set(80+R()*80,25+R()*20,1);}
}
// ----- ทะเลสาบน้ำแข็ง (กลางคืน) -----
function buildLake(){
  scene.fog.color.set('#16223a');scene.fog.near=90;scene.fog.far=380;
  hemi.color.set('#a8c0f0');hemi.groundColor.set('#304668');hemi.intensity=0.55;moonL.intensity=1.0;
  const R=mulberry(9191),hw=MW*S3/2,hh=MH*S3/2;
  const ice=texCanvas(512,512,g=>{g.fillStyle='#6f98be';g.fillRect(0,0,512,512);
    for(let i=0;i<60;i++){g.fillStyle=`rgba(${190+R()*50|0},${220+R()*30|0},255,0.18)`;g.beginPath();g.arc(R()*512,R()*512,20+R()*60,0,7);g.fill();}
    g.strokeStyle='rgba(255,255,255,0.55)';g.lineWidth=1.2;for(let i=0;i<40;i++){let x=R()*512,y=R()*512;g.beginPath();g.moveTo(x,y);for(let k=0;k<6;k++){x+=(R()-0.5)*80;y+=(R()-0.5)*80;g.lineTo(x,y);}g.stroke();}});
  ice.wrapS=ice.wrapT=THREE.RepeatWrapping;ice.repeat.set(MW*S3/40,MH*S3/40);
  const fl=addW(new THREE.Mesh(new THREE.PlaneGeometry(MW*S3,MH*S3),new THREE.MeshStandardMaterial({map:ice,roughness:0.12,metalness:0.25})));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;
  const snow=texCanvas(128,128,g=>{g.fillStyle='#c8d6ec';g.fillRect(0,0,128,128);for(let i=0;i<900;i++){g.fillStyle=R()<0.5?'rgba(240,246,255,.6)':'rgba(140,160,200,.3)';g.fillRect(R()*128,R()*128,2,2);}});snow.wrapS=snow.wrapT=THREE.RepeatWrapping;snow.repeat.set(70,70);
  const out=addW(new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({map:snow,roughness:1})));out.rotation.x=-Math.PI/2;out.position.y=-0.03;out.receiveShadow=true;
  // ขอบทะเลสาบ: หิมะนูนต่ำๆ + สนสีเข้ม + ภูเขา
  const bankM=new THREE.MeshStandardMaterial({color:'#d4e0f2',roughness:1,flatShading:true});
  for(let i=0;i<40;i++){const a=i/40*Math.PI*2,m=addW(new THREE.Mesh(new THREE.DodecahedronGeometry(6+R()*5,0),bankM));m.position.set(Math.cos(a)*(hw+9),0,Math.sin(a)*(hh+9));m.scale.set(1.6,0.45,1.6);}
  ringTrees(80,hw+30,hh+30,0.4,'#1f3a34',R);
  const mtM=new THREE.MeshStandardMaterial({color:'#3a4a6a',roughness:1,flatShading:true});
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2+0.2,r=380+R()*80,hgt=60+R()*70,m=addW(new THREE.Mesh(new THREE.ConeGeometry(70+R()*40,hgt,6),mtM));m.position.set(Math.cos(a)*r,hgt/2-2,Math.sin(a)*r);}
  const iceM=new THREE.MeshStandardMaterial({color:'#d8f0ff',emissive:'#2a5a8a',emissiveIntensity:0.35,roughness:0.08,metalness:0.2,flatShading:true});
  for(const o of OBS){if(o.k!=='icechunk')continue;const x=tx(o.x),z=tz(o.y);
    for(let k=0;k<3;k++){const s=o.r*S3*(k?0.55:0.9),m=addW(new THREE.Mesh(new THREE.IcosahedronGeometry(s,0),iceM));m.position.set(x+(k?(R()-0.5)*s*1.6:0),s*0.55,z+(k?(R()-0.5)*s*1.6:0));m.scale.set(1,k?1.1:0.9,1);m.rotation.set(R(),R()*6,R());shadowAll(m);}}
}
// ----- ซากลานประลอง (เย็น ทราย) -----
// ----- Test Place (ห้องฝึก): พื้นตารางเรียบๆ กลางวัน + วงโซนเสกมอนสเตอร์ -----
// ----- บรรยากาศที่ใช้ร่วมกัน (แผนที่จากโค้ด + แผนที่จากไฟล์ผ่าน fx ใน MAP-DESIGN.md) -----
function makeSnow(hw,hh){
  const NS=1500,sp=new Float32Array(NS*3),sv=new Float32Array(NS);
  for(let i=0;i<NS;i++){sp[i*3]=rnd(-hw-15,hw+15);sp[i*3+1]=rnd(0,26);sp[i*3+2]=rnd(-hh-15,hh+15);sv[i]=rnd(1.6,3.6);}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
  const pts=addW(new THREE.Points(sg,new THREE.PointsMaterial({map:glowTex,color:'#ffffff',size:0.34,transparent:true,opacity:0.9,depthWrite:false})));pts.frustumCulled=false;
  SNOW={pts,sp,sv,hw,hh,t:performance.now()};
}
function makeFireflies(hw,hh,n,R){
  const NF=n,fp=new Float32Array(NF*3);
  const fseed=[];for(let i=0;i<NF;i++){fseed.push([rnd(-hw,hw),rnd(0.5,5),rnd(-hh,hh),R()*10]);}
  const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.BufferAttribute(fp,3));
  FIREFLIES={pts:addW(new THREE.Points(fg,new THREE.PointsMaterial({map:glowTex,color:hdr('#d8ff6a',2),size:0.5,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}))),fp,fseed};
  FIREFLIES.pts.frustumCulled=false;
}
function makeSnitch(){
  SNITCH=addW(new THREE.Group());
  SNITCH.add(new THREE.Mesh(new THREE.SphereGeometry(0.22,16,12),new THREE.MeshStandardMaterial({color:'#ffd860',metalness:0.9,roughness:0.2,emissive:hdr('#7a5a10',1)})));
  for(const s of [-1,1]){const w=new THREE.Mesh(new THREE.PlaneGeometry(0.7,0.25),new THREE.MeshBasicMaterial({color:hdr('#fff8e0',1.4),side:THREE.DoubleSide,transparent:true,opacity:0.85}));w.position.x=s*0.42;SNITCH.add(w);}
  const sgl=new THREE.Sprite(glowMat('#ffd860',1.2));sgl.scale.setScalar(1.6);SNITCH.add(sgl);
}
// fx ของแผนที่จากไฟล์ (custom property "fx" ของ collection MAP_<id>): snow | fireflies[:จำนวน] | candles[:จำนวน:สูงต่ำสุด:สูงสุด] | snitch | rune[:สี:ขนาด]
function fileMapFx(list){
  const hw=MW*S3/2,hh=MH*S3/2;
  for(const t of list||[]){const [k,...a]=String(t).trim().split(':');
    if(k==='snow')makeSnow(hw,hh);
    else if(k==='fireflies')makeFireflies(hw,hh,+a[0]||350,Math.random);
    else if(k==='candles')makeCandles(+a[0]||80,-hw+3,hw-3,-hh+3,hh-3,+a[1]||8,+a[2]||13);
    else if(k==='snitch')makeSnitch();
    else if(k==='rune'){const z=+a[1]||19;RUNE=addW(new THREE.Mesh(new THREE.PlaneGeometry(z,z),new THREE.MeshBasicMaterial({map:runeTex,color:hdr(a[0]||'#b58cff',1.3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})));RUNE.rotation.x=-Math.PI/2;RUNE.position.y=GY(MW/2,MH/2)+0.05;}
  }
}
// ----- แผนที่จากไฟล์ Blender (MAP-DESIGN.md) -----
// โชว์พื้นสำรองจากตารางความสูงทันที (เดิน/ทดสอบได้แม้ไม่มี .glb) แล้วสลับเป็นไฟล์ .glb เมื่อโหลดเสร็จ
function terrGeo(get,nx,ny,c,step){
  const cols=Math.floor((nx-1)/step)+1,rows=Math.floor((ny-1)/step)+1,pos=new Float32Array(cols*rows*3),uv=new Float32Array(cols*rows*2),idx=[];
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const k=j*cols+i,gi=i*step,gj=j*step,h=get(gi,gj);
    pos[k*3]=tx(gi*c);pos[k*3+1]=isNaN(h)?0:h;pos[k*3+2]=tz(gj*c);uv[k*2]=gi*c*S3/8;uv[k*2+1]=gj*c*S3/8;}
  for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){const a=j*cols+i,b=a+1,d=a+cols,e=d+1;
    if([a,b,d,e].some(q=>isNaN(get((q%cols)*step,Math.floor(q/cols)*step))))continue;idx.push(a,d,b,b,d,e);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function buildFileMap(id){
  const F=MAPS[id].fm,T=TERR,night=F.sky!=='sunset'&&F.sky!=='day';
  const fog=F.fog||(night?['#16223a',90,380]:['#d8a888',130,520]);
  scene.fog.color.set(fog[0]);scene.fog.near=+fog[1];scene.fog.far=+fog[2];
  if(night){hemi.color.set('#a8b8e8');hemi.groundColor.set('#2a3448');hemi.intensity=0.6;moonL.intensity=1.0;moonL.color.set('#c8d8ff');}
  else{hemi.color.set('#ffe0b8');hemi.groundColor.set('#4a5a2a');hemi.intensity=0.75;moonL.intensity=1.5;moonL.color.set('#fff0dc');}
  const W=world,fb=addW(new THREE.Group());
  if(T){
    const tex=t=>{t=t.clone();t.repeat.set(1,1);t.needsUpdate=true;return t;};
    const gm=new THREE.MeshStandardMaterial({map:tex(grassTex(night?'#3d5a3a':'#4f8a38',11,1)),roughness:0.95,flatShading:false});
    const gr=new THREE.Mesh(terrGeo((i,j)=>T.g[j*T.nx+i],T.nx,T.ny,T.c,Math.max(1,Math.ceil(Math.max(T.nx,T.ny)/240))),gm);gr.receiveShadow=true;fb.add(gr);
    const sm=stoneMat(1,1,'#8a8478');
    for(const f of T.fl){const m=new THREE.Mesh(terrGeo((i,j)=>f.top[j*f.nx+i],f.nx,f.ny,T.c,1),sm);m.position.set(f.x0*S3,0,f.y0*S3);m.castShadow=m.receiveShadow=true;fb.add(m);}
  }
  const cols=MAPS[id].obs.filter(o=>o.fm);
  if(cols.length){
    const im=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,10),new THREE.MeshStandardMaterial({color:'#7d7468',roughness:0.95,flatShading:true}),cols.length),m4=new THREE.Matrix4();
    cols.forEach((o,i)=>{const r=o.r*S3,b=GY(o.x,o.y);im.setMatrixAt(i,m4.makeScale(r,o.hgt,r).setPosition(tx(o.x),b+o.hgt/2,tz(o.y)));});
    im.castShadow=im.receiveShadow=true;fb.add(im);
  }
  // ไฟประจำจุด (light_) → ใช้ชุดไฟรวมของเกม (เปิดจริงเฉพาะดวงที่ใกล้กล้อง)
  fileMapFx(F.fx);
  W.userData.lights=(F.lights||[]).map(L=>({abs:1,x:tx(L.x),y:GY(L.x,L.y)+(L.h||2),z:tz(L.y),col:L.col||'#ffb060',int:L.int||2,dist:L.dist||14}));
  if(!F.file)return;
  gltfLoader().then(L=>L.loadAsync('assets/'+F.file+'?v='+(F.v||0))).then(gltf=>{
    if(!fb.parent)return;                                       // ฉากถูกทิ้งไปแล้ว
    const sc=gltf.scene,skip=new Set();
    sc.traverse(o=>{if(/^anim_/i.test(o.name))skip.add(o);if(!o.isMesh)return;o.receiveShadow=true;o.castShadow=!(o.userData&&o.userData.ns);});
    W.remove(fb);setTimeout(()=>disposeTree(fb),5000);W.add(sc);   // ทิ้งพื้นสำรองทีหลัง (กำลังอุ่นเชดเดอร์อยู่ได้)
    brkSetup(sc,skip);   // ของบังที่พังได้: แยกออกจาก batch (js/23)
    batchStatic(sc,skip);
    if(gltf.animations&&gltf.animations.length){const mx=new THREE.AnimationMixer(sc);for(const c of gltf.animations)mx.clipAction(c).play();W.userData.mixer=mx;}
    gl.shadowMap.needsUpdate=true;setTimeout(prewarmShaders,0);
  }).catch(err=>console.warn('map glb',id,err));
}
// ห้องฝึก: วัสดุขีดระยะ + ป้ายไม้ (ข้อความ 2 บรรทัด) — x,y = พิกัดเกม, ry = หันป้าย
function tickM(){return new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0.55});}
function testSign(t1,t2,x,y,ry){
  const st=texCanvas(512,160,g=>{g.fillStyle='#5a3a22';g.fillRect(0,0,512,160);g.strokeStyle='#e8c060';g.lineWidth=8;g.strokeRect(6,6,500,148);g.fillStyle='#f3dc94';g.textAlign='center';g.textBaseline='middle';g.font='bold 54px Kanit, sans-serif';g.fillText(t1,256,62);g.font=(t2.length>30?'24':'30')+'px Kanit, sans-serif';g.fillText(t2,256,118);});
  const sg=addW(new THREE.Group()),post=new THREE.MeshStandardMaterial({color:'#4e3420',roughness:0.9});
  for(const s of [-1,1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,3.2,6),post);p.position.set(s*2.2,1.6,0);sg.add(p);}
  const bd=new THREE.Mesh(new THREE.PlaneGeometry(5,1.56),new THREE.MeshStandardMaterial({map:st,roughness:0.8,side:THREE.DoubleSide}));bd.position.y=2.6;sg.add(bd);
  sg.position.set(tx(x),0,tz(y));sg.rotation.y=ry;return sg;
}
function buildTest(){
  scene.fog.color.set('#c9d6e2');scene.fog.near=160;scene.fog.far=620;
  hemi.color.set('#ffffff');hemi.groundColor.set('#6a7078');hemi.intensity=0.85;moonL.intensity=1.35;moonL.color.set('#fff4e6');gl.toneMappingExposure=1;
  const grid=(base,line,rep)=>{const t=texCanvas(256,256,g=>{g.fillStyle=base;g.fillRect(0,0,256,256);g.strokeStyle=line;g.lineWidth=3;g.strokeRect(1.5,1.5,253,253);g.lineWidth=1;g.globalAlpha=0.5;for(const p of [64,128,192]){g.beginPath();g.moveTo(p,0);g.lineTo(p,256);g.moveTo(0,p);g.lineTo(256,p);g.stroke();}});t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);t.anisotropy=4;return t;};
  const fw=MW*S3,fh=MH*S3;
  const fl=addW(new THREE.Mesh(new THREE.PlaneGeometry(fw,fh),new THREE.MeshStandardMaterial({map:grid('#9aa1a8','#6e767e',[fw/8,fh/8]),roughness:0.9})));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;
  const out=addW(new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),new THREE.MeshStandardMaterial({map:grid('#6f767d','#5a6168',[1400/8,1400/8]),roughness:1})));out.rotation.x=-Math.PI/2;out.position.y=-0.03;out.receiveShadow=true;
  // ขอบเขตด่าน = แถบเหลืองบนพื้น
  const edgeM=new THREE.MeshBasicMaterial({color:'#e8c040'});
  for(const [w,h,x,z] of [[fw,0.5,0,-fh/2],[fw,0.5,0,fh/2],[0.5,fh,-fw/2,0],[0.5,fh,fw/2,0]]){const m=addW(new THREE.Mesh(new THREE.PlaneGeometry(w,h),edgeM));m.rotation.x=-Math.PI/2;m.position.set(x,0.02,z);}
  // วงโซนเสกมอนสเตอร์
  const Z=trZone(),zs=Z.r*S3*2;
  const zt=texCanvas(512,512,g=>{
    g.translate(256,256);g.fillStyle='rgba(220,60,60,0.18)';g.beginPath();g.arc(0,0,250,0,7);g.fill();
    g.strokeStyle='rgba(255,90,80,0.95)';g.lineWidth=10;g.setLineDash([34,18]);g.beginPath();g.arc(0,0,244,0,7);g.stroke();g.setLineDash([]);
    g.lineWidth=4;g.beginPath();g.arc(0,0,190,0,7);g.stroke();
    g.fillStyle='rgba(255,235,230,0.95)';g.textAlign='center';g.textBaseline='middle';g.font='bold 52px Kanit, sans-serif';g.fillText('โซนเสกมอนสเตอร์',0,-14);g.font='34px Kanit, sans-serif';g.fillText('กด P → เสกมอนสเตอร์',0,44);
  });
  const zm=addW(new THREE.Mesh(new THREE.PlaneGeometry(zs,zs),new THREE.MeshBasicMaterial({map:zt,transparent:true,depthWrite:false})));zm.rotation.x=-Math.PI/2;zm.position.set(tx(Z.x),0.04,tz(Z.y));
  // หมู่บ้านทดสอบทำลาย (ฝั่งตะวันตก): ลานหญ้า + ถนนดิน + ป้าย — บ้าน/ต้นไม้/ลังมาจากระบบพังได้ (syncBld / syncProps)
  {const V=TEST_VIL,gm=new THREE.MeshStandardMaterial({map:grassTex('#5f8f45',11,1),roughness:0.95}),dm=new THREE.MeshStandardMaterial({color:'#8a7456',roughness:1});
    const gr=addW(new THREE.Mesh(new THREE.PlaneGeometry(1900*S3,2900*S3),gm));gr.rotation.x=-Math.PI/2;gr.position.set(tx(V.x+150),0.01,tz(V.y));gr.receiveShadow=true;
    const rd=addW(new THREE.Mesh(new THREE.PlaneGeometry(1800*S3,180*S3),dm));rd.rotation.x=-Math.PI/2;rd.position.set(tx(V.x+100),0.02,tz(V.y));rd.receiveShadow=true;
    testSign('หมู่บ้านทดสอบทำลาย','บ้าน · ต้นไม้ · ลัง พังได้ทั้งหมด',V.x+1050,V.y-150,Math.PI/2);}
  // จุดทดสอบรอบลานฝึก (TEST_ST ใน js/02) — พื้นสีแยกโซน + ป้าย
  const pad=(x,y,w,h,col)=>{const m=addW(new THREE.Mesh(new THREE.PlaneGeometry(w*S3,h*S3),new THREE.MeshStandardMaterial({color:col,roughness:0.95})));m.rotation.x=-Math.PI/2;m.position.set(tx(x),0.012,tz(y));m.receiveShadow=true;};
  const lbl=(t,x,y,sz,col)=>{const c=texCanvas(256,96,g=>{g.fillStyle=col||'#ffffff';g.textAlign='center';g.textBaseline='middle';g.font='bold 60px Kanit, sans-serif';g.fillText(t,128,48);});
    const m=addW(new THREE.Mesh(new THREE.PlaneGeometry(sz,sz*0.375),new THREE.MeshBasicMaterial({map:c,transparent:true,depthWrite:false})));m.rotation.x=-Math.PI/2;m.position.set(tx(x),0.05,tz(y));};
  {// ลานยิงไกล: ทางเดินยาวไปทางเหนือ + เลขระยะจากจุดเกิด (เมตร) ทุก 200 px ถึง 2000
    const C=TEST_C,y0=C.y+160;pad(C.x,y0-1050,420,2150,'#8c949b');
    for(let d=1000;d<=2000;d+=200){const m=addW(new THREE.Mesh(new THREE.PlaneGeometry(6,0.3),tickM()));m.rotation.x=-Math.PI/2;m.position.set(0,0.03,tz(y0-d));}
    for(let d=200;d<=2000;d+=200)lbl(d/20+' ม.',C.x+170,y0-d,4.2);
    testSign('ลานยิงไกล','หุ่นที่ 50 · 70 · 90 เมตร',C.x-300,y0-760,0);}
  {// วงวัดรัศมี: วงทุก 100 px (5 ม.) ถึง 600 + หุ่น 3 ตัว (กลาง / 300 / 300 เฉียง)
    const A=TEST_ST.aoe,R=600,t=texCanvas(1024,1024,g=>{g.translate(512,512);const k=500/R;g.fillStyle='rgba(80,140,255,0.10)';g.beginPath();g.arc(0,0,R*k,0,7);g.fill();
      for(let r=100;r<=R;r+=100){g.strokeStyle=r%200?'rgba(150,200,255,0.6)':'rgba(190,225,255,0.95)';g.lineWidth=r%200?3:6;g.beginPath();g.arc(0,0,r*k,0,7);g.stroke();
        g.fillStyle='rgba(225,240,255,0.95)';g.font='bold 40px Kanit, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(r/20+' ม.',0,-r*k+26);}
      g.strokeStyle='rgba(190,225,255,0.5)';g.lineWidth=2;g.beginPath();g.moveTo(-R*k,0);g.lineTo(R*k,0);g.moveTo(0,-R*k);g.lineTo(0,R*k);g.stroke();});
    const m=addW(new THREE.Mesh(new THREE.PlaneGeometry(R*2*S3,R*2*S3),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false})));m.rotation.x=-Math.PI/2;m.position.set(tx(A.x),0.045,tz(A.y));
    testSign('วงวัดรัศมี','วงละ 5 ม. — ลองระเบิด/คาถาวงกว้าง',A.x-R-120,A.y+60,Math.PI/2);}
  {// เสาสูงต่างกัน: บินข้าม / หลบหลังเสา / ยิงบัง
    const P=TEST_ST.pillar;pad(P.x,P.y,1300,900,'#868079');
    const cols=['#7fbf7a','#d8c25a','#e0904a','#d0605a'],mats=cols.map(c=>new THREE.MeshStandardMaterial({color:c,roughness:0.9})),cap=new THREE.MeshStandardMaterial({color:'#8d8a86',roughness:0.9});
    for(const o of OBS)if(o.k==='tpillar'){const c=TEST_PH.indexOf(o.hgt),r=o.r*S3,m=addW(new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.06,o.hgt,16),mats[c]));m.position.set(tx(o.x),o.hgt/2,tz(o.y));
      const t=addW(new THREE.Mesh(new THREE.CylinderGeometry(r*1.1,r*1.1,0.2,16),cap));t.position.set(tx(o.x),o.hgt+0.1,tz(o.y));shadowAll(m);shadowAll(t);}
    TEST_PH.forEach((h,c)=>lbl(h+' ม.',P.x+(c-1.5)*280,P.y-420,4,cols[c]));
    testSign('เสาสูงต่างกัน','1.5 · 3 · 6 · 12 ม. — บินข้าม / หลบ / บังกระสุน',P.x-760,P.y,Math.PI/2);}
  {// กำแพงยาว + ทางแคบ: ชนกำแพง (กระแทก/Stonebreaker) / พุ่ง / ต่อสู้ในทางแคบ
    const Wd=TEST_ST.wall,wm=new THREE.MeshStandardMaterial({map:grid('#a39078','#7d6c58',[1,1]),roughness:0.9});pad(Wd.x+50,Wd.y,1800,1100,'#8a8478');
    for(const [x1,y1,x2,y2] of testWalls()){const L=Math.hypot(x2-x1,y2-y1)*S3+2.6,m=addW(new THREE.Mesh(new THREE.BoxGeometry(L,6,2.6),wm.clone()));m.material.map=m.material.map.clone();m.material.map.repeat.set(L/3,2);m.material.map.needsUpdate=true;
      m.position.set(tx((x1+x2)/2),3,tz((y1+y2)/2));m.rotation.y=-Math.atan2(y2-y1,x2-x1);shadowAll(m);}
    testSign('กำแพง + ทางแคบ','ลองกระแทกศัตรูชนกำแพง / พุ่งชน',Wd.x-300,Wd.y-420,Math.PI);}
  // ป้ายบอกทางกลางลาน
  testSign('จุดทดสอบ','↑ ยิงไกล   ↗ วงรัศมี   ↘ เสา   ↓ กำแพง   ← หมู่บ้าน',TEST_C.x-420,TEST_C.y-60,0);
  // ป้ายระยะ (ทุก 200 px) จากจุดเกิดไปทางหุ่นซ้อมไกล — ไว้ดูระยะคาถา
  for(let d=200;d<=800;d+=200){const m=addW(new THREE.Mesh(new THREE.PlaneGeometry(3,0.25),tickM()));m.rotation.x=-Math.PI/2;m.position.set(0,0.03,tz(MH/2+160-d));}
}
function buildRuins(){
  scene.fog.color.set('#d09a6a');scene.fog.near=120;scene.fog.far=480;
  hemi.color.set('#ffdcb0');hemi.groundColor.set('#7a5a3a');hemi.intensity=0.75;moonL.intensity=1.5;
  const R=mulberry(2718),hw=MW*S3/2,hh=MH*S3/2;
  const sand=texCanvas(512,512,g=>{g.fillStyle='#c8a676';g.fillRect(0,0,512,512);for(let i=0;i<9000;i++){g.fillStyle=`rgba(${150+R()*70|0},${115+R()*60|0},${70+R()*40|0},0.35)`;g.fillRect(R()*512,R()*512,2,2);}
    g.strokeStyle='rgba(120,90,55,0.55)';g.lineWidth=5;g.beginPath();g.ellipse(256,256,200,140,0,0,7);g.stroke();g.lineWidth=3;g.beginPath();g.ellipse(256,256,60,42,0,0,7);g.stroke();});
  const fl=addW(new THREE.Mesh(new THREE.PlaneGeometry(MW*S3,MH*S3),new THREE.MeshStandardMaterial({map:sand,roughness:1})));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;
  const sand2=texCanvas(128,128,g=>{g.fillStyle='#b8946a';g.fillRect(0,0,128,128);for(let i=0;i<1200;i++){g.fillStyle='rgba(150,115,75,.4)';g.fillRect(R()*128,R()*128,2,2);}});sand2.wrapS=sand2.wrapT=THREE.RepeatWrapping;sand2.repeat.set(80,80);
  const out=addW(new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({map:sand2,roughness:1})));out.rotation.x=-Math.PI/2;out.position.y=-0.02;out.receiveShadow=true;
  // อัฒจันทร์หินโค้งรอบนอก (เป็นขั้นๆ แตกบางช่วง)
  const stM=stoneMat(2,1,'#b8a080');
  const N=44;for(let i=0;i<N;i++){const a=i/N*Math.PI*2;if(R()<0.12)continue;const rx=hw+12,rz=hh+12;for(let t=0;t<3;t++){const h=3+t*3,m=addW(new THREE.Mesh(new THREE.BoxGeometry(9,h,5),stM));m.position.set(Math.cos(a)*(rx+t*5),h/2,Math.sin(a)*(rz+t*5));m.lookAt(0,h/2,0);if(t===0)shadowAll(m);}}
  const colM=stoneMat(1,2,'#d8c8a8');
  for(const o of OBS){const x=tx(o.x),z=tz(o.y);
    if(o.k==='column'){const r=o.r*S3*0.75;const base=addW(new THREE.Mesh(new THREE.BoxGeometry(r*2.6,0.6,r*2.6),colM));base.position.set(x,0.3,z);
      const c=addW(new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.1,o.hgt,12),colM));c.position.set(x,o.hgt/2+0.6,z);shadowAll(c);
      if(!o.broken){const cap=addW(new THREE.Mesh(new THREE.BoxGeometry(r*2.6,0.8,r*2.6),colM));cap.position.set(x,o.hgt+1,z);shadowAll(cap);}
      else{const top=addW(new THREE.Mesh(new THREE.ConeGeometry(r*1.05,0.9,7),colM));top.position.set(x,o.hgt+0.8,z);top.rotation.z=0.4;}}
    else if(o.k==='fallen'){const c=addW(new THREE.Mesh(new THREE.CylinderGeometry(o.r*S3*0.45,o.r*S3*0.5,o.r*S3*2.6,12),colM));c.position.set(x,o.r*S3*0.45,z);c.rotation.set(0,o.ry,Math.PI/2);shadowAll(c);}
  }
  // กระถางไฟ 4 มุมลาน
  const fireM=glowMat('#ff8a3a',2.2);
  for(const [fx,fz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=fx*(hw-6),z=fz*(hh-6);const b=addW(new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.5,1.4,10),new THREE.MeshStandardMaterial({color:'#4a3a2a',metalness:0.5,roughness:0.5})));b.position.set(x,0.7,z);
    const fl2=addW(new THREE.Sprite(fireM));fl2.position.set(x,2,z);fl2.scale.set(2.4,3.2,1);TORCHES.push({fl:fl2,x,z,ph:R()*6});}
}
function buildPitch(){
  scene.fog.color.set('#c98a78');scene.fog.near=110;scene.fog.far=470;
  hemi.color.set('#ffd2a8');hemi.groundColor.set('#3e4a2a');hemi.intensity=0.65;moonL.intensity=1.45;
  const hw=MW*S3/2,hh=MH*S3/2;
  // สนามหญ้าตัดเป็นแถบ + เส้นสนาม
  const fc=document.createElement('canvas');fc.width=1500;fc.height=900;
  const f=fc.getContext('2d');
  for(let i=0;i<20;i++){f.fillStyle=i%2?'#3f7a32':'#4a8a3a';f.fillRect(i*75,0,75,900);}
  for(let i=0;i<14000;i++){f.fillStyle=`rgba(${20+Math.random()*40|0},${60+Math.random()*50|0},20,0.35)`;f.fillRect(Math.random()*1500,Math.random()*900,2,3+Math.random()*4);}
  f.strokeStyle='rgba(255,255,255,0.75)';f.lineWidth=6;
  f.beginPath();f.ellipse(750,450,720,420,0,0,Math.PI*2);f.stroke();
  f.beginPath();f.arc(750,450,90,0,Math.PI*2);f.stroke();
  f.beginPath();f.moveTo(750,30);f.lineTo(750,870);f.stroke();
  for(const x of [105,1395]){f.beginPath();f.ellipse(x,450,150,250,0,0,Math.PI*2);f.stroke();}
  const ft=new THREE.CanvasTexture(fc);ft.colorSpace=THREE.SRGBColorSpace;ft.anisotropy=gl.capabilities.getMaxAnisotropy();
  const fl=addW(new THREE.Mesh(new THREE.PlaneGeometry(MW*S3,MH*S3),new THREE.MeshStandardMaterial({map:ft,roughness:0.95})));
  fl.rotation.x=-Math.PI/2;fl.position.y=0.01;fl.receiveShadow=true;
  const grass=texCanvas(256,256,(g)=>{g.fillStyle='#355f2a';g.fillRect(0,0,256,256);for(let i=0;i<3000;i++){g.fillStyle=`rgba(${20+Math.random()*30|0},${50+Math.random()*40|0},20,0.5)`;g.fillRect(Math.random()*256,Math.random()*256,2,4);}});
  grass.wrapS=grass.wrapT=THREE.RepeatWrapping;grass.repeat.set(90,90);
  const out=addW(new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({map:grass,roughness:1})));
  out.rotation.x=-Math.PI/2;out.receiveShadow=true;

  // ไม้ (ลาย planks)
  const wood=texCanvas(128,128,(g)=>{g.fillStyle='#7a5432';g.fillRect(0,0,128,128);for(let y=0;y<128;y+=16){g.fillStyle=`rgb(${100+Math.random()*30|0},${68+Math.random()*20|0},${40+Math.random()*15|0})`;g.fillRect(0,y+1,128,14);}for(let i=0;i<200;i++){g.fillStyle='rgba(40,25,10,0.25)';g.fillRect(Math.random()*128,Math.random()*128,10,1);}});
  wood.wrapS=wood.wrapT=THREE.RepeatWrapping;
  const woodM=new THREE.MeshStandardMaterial({map:wood,roughness:0.85});
  const HC=['#a8262a','#2a7a46','#2a4fa8','#d8a822'];
  // อัฒจันทร์ + หอคอยผ้าสีบ้าน รอบสนาม
  const N=28;
  for(let i=0;i<N;i++){
    const a=i/N*Math.PI*2,rx=hw+9,rz=hh+9,x=Math.cos(a)*rx,z=Math.sin(a)*rz,col=HC[i%4];
    const tall=i%2===0,h=tall?17:9;
    const t=addW(new THREE.Mesh(new THREE.BoxGeometry(5,h,5),woodM));t.position.set(x,h/2,z);t.lookAt(0,h/2,0);shadowAll(t);
    if(tall){
      const top=addW(new THREE.Mesh(new THREE.ConeGeometry(4.2,6,4),new THREE.MeshStandardMaterial({color:col,roughness:0.8})));
      top.position.set(x,h+3,z);top.rotation.y=Math.PI/4-a;shadowAll(top);
      const bn=addW(new THREE.Mesh(new THREE.PlaneGeometry(2.6,7,1,8),new THREE.MeshStandardMaterial({color:col,roughness:0.9,side:THREE.DoubleSide})));
      bn.position.set(x-Math.cos(a)*2.6,h-4.5,z-Math.sin(a)*2.6);bn.lookAt(0,h-4.5,0);
      BANNERS.push({m:bn,rest:Float32Array.from(bn.geometry.attributes.position.array),ph:i});
    }else{
      const rail=addW(new THREE.Mesh(new THREE.BoxGeometry(6,1.2,1),new THREE.MeshStandardMaterial({color:col})));
      rail.position.set(x-Math.cos(a)*2.4,h-0.6,z-Math.sin(a)*2.4);rail.lookAt(0,h-0.6,0);
    }
  }
  // ห่วงประตู / ลังไม้ / ฟาง
  const goldM=new THREE.MeshStandardMaterial({color:'#e8c060',metalness:0.85,roughness:0.25,emissive:'#3a2a08'});
  for(const o of OBS){
    const x=tx(o.x),z=tz(o.y);
    if(o.k==='hoop'){
      const post=addW(new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.4,o.ring-1.6,12),goldM));post.position.set(x,(o.ring-1.6)/2,z);post.castShadow=true;
      const rg=addW(new THREE.Mesh(new THREE.TorusGeometry(1.6,0.16,12,40),goldM));rg.position.set(x,o.ring,z);rg.rotation.y=Math.PI/2;rg.castShadow=true;
    }else if(o.k==='crate'){
      const s=o.r*S3*1.5;
      const c=addW(new THREE.Mesh(new THREE.BoxGeometry(s,o.hgt,s),woodM));c.position.set(x,o.hgt/2,z);c.rotation.y=o.s*3;shadowAll(c);
      const c2=addW(new THREE.Mesh(new THREE.BoxGeometry(s*0.6,1.2,s*0.6),woodM));c2.position.set(x+0.3,o.hgt+0.6,z-0.2);c2.rotation.y=o.s*5;shadowAll(c2);
    }else if(o.k==='hay'){
      const hy=addW(new THREE.Mesh(new THREE.CylinderGeometry(o.r*S3,o.r*S3,o.hgt,16),new THREE.MeshStandardMaterial({color:'#d8b860',roughness:1})));
      hy.position.set(x,o.hgt/2,z);shadowAll(hy);
    }
  }
  // ภูเขาไกลๆ + เมฆ
  const mtM=new THREE.MeshStandardMaterial({color:'#4a3a5a',roughness:1,flatShading:true});
  for(let i=0;i<16;i++){
    const a=i/16*Math.PI*2+0.2,r=rnd(400,480),h=rnd(50,110);
    const m=addW(new THREE.Mesh(new THREE.ConeGeometry(rnd(70,110),h,7),mtM));m.position.set(Math.cos(a)*r,h/2-2,Math.sin(a)*r);
  }
  const cloudM=new THREE.SpriteMaterial({map:glowTex,color:'#ffd6c0',transparent:true,opacity:0.35,depthWrite:false,fog:false});
  for(let i=0;i<22;i++){const c=addW(new THREE.Sprite(cloudM));const a=rnd(0,Math.PI*2),r=rnd(200,400);c.position.set(Math.cos(a)*r,rnd(70,140),Math.sin(a)*r);c.scale.set(rnd(80,160),rnd(25,45),1);}
  makeSnitch();
}
