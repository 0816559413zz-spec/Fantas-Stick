// ---------- เมืองมักเกิ้ล (ลอนดอน) — ภาพ • ข้อมูลอยู่ js/02-city.js • โมเดลจาก assets/src/city_kit_build.py ----------
// กลางคืน ไฟหน้าต่างตึก + เสาไฟริมถนน • ตึกเป็นกล่องสีตามชนิด (หน้าต่างใช้ UV ตามขนาดจริง → วัสดุเดียวใช้ได้ทุกตึก รวม mesh ได้ใน batchStatic)
// ยังเป็นภาพชั่วคราวสำหรับลองขนาดเมือง — ภาพจริง (Blender + สไตล์ C) = ขั้น 7
const CITY_WIN=28;   // ขนาดลายหน้าต่าง 1 แผ่น (ม.) = 8 ช่อง × 3.5 ม.
function cityWinTex(base,lit,seed){
  const R=mulberry(seed);
  return texCanvas(256,256,g=>{g.fillStyle=base;g.fillRect(0,0,256,256);
    for(let i=0;i<8;i++)for(let j=0;j<8;j++){const on=R()<lit;g.fillStyle=on?(R()<0.7?'#ffd890':'#cfe6ff'):'#1a2230';g.fillRect(i*32+7,j*32+8,18,16);}});
}
function cityEmTex(lit,seed){   // ไฟหน้าต่าง (emissiveMap) — ลายเดียวกับ cityWinTex (seed เดียวกัน)
  const R=mulberry(seed);
  return texCanvas(256,256,g=>{g.fillStyle='#000';g.fillRect(0,0,256,256);
    for(let i=0;i<8;i++)for(let j=0;j<8;j++){const on=R()<lit;R();if(on){g.fillStyle='#fff';g.fillRect(i*32+7,j*32+8,18,16);}}});
}
// กล่องที่ UV เป็นหน่วยเมตร/CITY_WIN (ลายหน้าต่างไม่ยืดตามขนาดตึก)
function cityBoxGeo(w,h,d){
  const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv,S=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*S[f][0]/CITY_WIN,uv.getY(i)*S[f][1]/CITY_WIN);}
  return g;
}
function buildCity(){
  const M=MAPS[MAPID];
  scene.fog.color.set('#161c2c');scene.fog.near=60;scene.fog.far=210;
  hemi.color.set('#9fb0e0');hemi.groundColor.set('#3a3a48');hemi.intensity=0.75;moonL.intensity=0.9;
  const R=mulberry(77),std=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:0.9},o));
  const flat=(w,d,mat,x,z,y)=>{const m=addW(new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;return m;};
  // พื้นถนนทั้งแผนที่ + นอกแผนที่
  const asph=texCanvas(256,256,g=>{g.fillStyle='#2c2f36';g.fillRect(0,0,256,256);for(let i=0;i<3000;i++){g.fillStyle=R()<0.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.12)';g.fillRect(R()*256,R()*256,2,2);}});
  asph.wrapS=asph.wrapT=THREE.RepeatWrapping;asph.repeat.set(MW*S3/8,MH*S3/8);
  flat(MW*S3,MH*S3,std('#ffffff',{map:asph,roughness:0.85}),0,0,0);
  flat(1400,1400,std('#1c1f26',{roughness:1}),0,0,-0.03);
  // ทางเท้า + พื้นในบล็อกตามย่าน
  const side=std('#6f727a'),grass=grLive(std('#ffffff',{map:grassTex('#3f6e32',21,12)})),pave=stoneMat(6,6,'#8a8a94'),dirt=std('#5a4a38'),conc=std('#55585f'),park=std('#33363d');
  for(const z of M.zones){
    const x=tx(z.x+z.w/2),y=tz(z.y+z.d/2),w=z.w*S3,d=z.d*S3;
    const sw=addW(new THREE.Mesh(new THREE.BoxGeometry(w,0.12,d),side));sw.position.set(x,0.06,y);sw.receiveShadow=true;
    const P=3,inner=z.k==='park'||z.k==='field'?grass:z.k==='plaza'?pave:z.k==='build'?dirt:z.k==='parking'?park:conc;
    flat(w-2*P,d-2*P,inner,x,y,0.125);
    if(z.k==='field'){flat(w*0.62,d*0.42,std('#4f8a3c'),x,y,0.13);const ln=std('#e8e8e8');for(const sx of [-1,0,1])flat(0.25,d*0.42,ln,x+sx*w*0.31,y,0.135);}
    if(z.k==='parking')for(let r=0;r<5;r++)for(let c=0;c<=9;c++)flat(0.15,3.2,std('#d8d8d8'),tx(z.x+60+60+c*130-20),tz(z.y+60+80+r*240+23),0.13);
    if(z.water){const W2=z.water;flat(W2.w*S3,W2.d*S3,std('#1c3a5a',{roughness:0.12,metalness:0.5}),tx(W2.x+W2.w/2),tz(W2.y+W2.d/2),0.14);}
  }
  // ลานกลางเมือง (ทับถนนสี่แยกกลาง) + น้ำพุเตี้ย ๆ เป็นภาพ
  const pl=addW(new THREE.Mesh(new THREE.CircleGeometry(CITY_PLAZA*S3,64),stoneMat(10,10,'#9a96a0')));pl.rotation.x=-Math.PI/2;pl.position.y=0.14;pl.receiveShadow=true;
  const ring=addW(new THREE.Mesh(new THREE.TorusGeometry(CITY_PLAZA*S3,0.35,6,64),std('#77757e')));ring.rotation.x=-Math.PI/2;ring.position.y=0.15;
  // เส้นประกลางถนน
  const lineM=std('#d8b84a',{emissive:'#3a2c08'});
  for(let k=1;k<CITY_N;k++)for(let s=0;s<MW;s+=160){const p=k*CITY_B;if(Math.abs(s%CITY_B)<CITY_ROAD/2+40||Math.abs(s%CITY_B-CITY_B)<CITY_ROAD/2+40)continue;if(Math.hypot(p-MW/2,s-MH/2)<CITY_PLAZA+40||Math.hypot(s-MW/2,p-MH/2)<CITY_PLAZA+40)continue;
    flat(0.22,3.2,lineM,tx(p),tz(s),0.02);flat(3.2,0.22,lineM,tx(s),tz(p),0.02);}
  // ตึก: วัสดุตามชนิด
  const win=(base,lit,seed,o)=>std('#ffffff',Object.assign({map:cityWinTex(base,lit,seed),emissive:'#ffffff',emissiveMap:cityEmTex(lit,seed),emissiveIntensity:0.9,roughness:0.75},o));
  const MAT={office:win('#6c7482',0.35,11),glass:win('#3a5878',0.45,12,{metalness:0.4,roughness:0.35}),shop:win('#b8a68a',0.5,13),brick:win('#7a4a3a',0.3,14),station:win('#a89a80',0.25,15),
    metal:std('#6a7078',{roughness:0.6,metalness:0.3}),garage:std('#77787c'),concrete:std('#8a8a8a'),stand:std('#5a5e66'),kiosk:std('#d8d4c8'),train:std('#b8c0c8',{metalness:0.5,roughness:0.4})};
  const roofM=std('#3a3c42');
  const zoneOf=(x,y)=>M.zones.find(z=>x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.d);
  // ชิ้นโมเดล: KI[ชื่อ][ก้อน] = {m:[เมทริกซ์], c:[สี|null]} • ก้อน = บล็อกเมืองที่ชิ้นนั้นอยู่ (ซ่อนทั้งก้อนเมื่อไกลเกินหมอก — cityCull)
  const KI={},_q=new THREE.Quaternion(),_ax=new THREE.Vector3(0,1,0);
  // kput คืน "ที่อยู่" ของชิ้น {n,ch,ix,M} (ไว้ซ่อน/ขยับ/ย้อมสีทีหลังตอนพัง — cityViewSync)
  const kput=(n,x,y,z,a,sx,sy,col)=>{const ch=clamp(Math.floor((x/S3+MW/2)/CITY_B),0,CITY_N-1)+clamp(Math.floor((z/S3+MH/2)/CITY_B),0,CITY_N-1)*CITY_N;
    const K=KI[n]||(KI[n]={}),L=K[ch]||(K[ch]={m:[],c:[]}),Mx=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),_q.setFromAxisAngle(_ax,a||0),new THREE.Vector3(sx||1,sy||1,1));
    L.m.push(Mx);L.c.push(col||null);return {n,ch,ix:L.m.length-1,M:Mx,col};};
  const KR=mulberry(3550),coreM=std('#2a2624'),CONT=['#a8442e','#2e6aa8','#3e8a4a','#c8a03a','#7a3a6a','#5a6a7a'];
  const CV={b:[],it:[],cores:[],lampPts:null,lampIx:[],rub:[]};
  for(const B of M.boxes){
    const w=B.w*S3,d=B.d*S3,x=tx(B.x+B.w/2),z=tz(B.y+B.d/2),st=CITY_STY[B.m];
    if(st){const r=cityFacade(B,st,M.zones,w,d,x,z,kput,KR);r.core=CV.cores.length;r.v=-1;r.sty=st;CV.b[B.i]=r;
      CV.cores.push(new THREE.Matrix4().compose(new THREE.Vector3(x,B.h/2,z),_q.set(0,0,0,1),new THREE.Vector3(Math.max(0.2,w-0.8),B.h,Math.max(0.2,d-0.8))));
      if(B.hl){r.hl=[];for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const l=addW(new THREE.Sprite(glowMat('#ff3030',2.4)));l.position.set(x+sx*w/2,B.h+2.2,z+sz*d/2);l.scale.set(2,2,1);r.hl.push(l);}}
      continue;}
    if(B.m==='cont'){const lay=B.h>3?2:1;for(let l=0;l<lay;l++)for(const o of [-1,1])kput('cp_container',x,l*2.6,z+o*(d/4),w>d?0:Math.PI/2,Math.max(w,d)/12.2,1,CONT[Math.floor(KR()*CONT.length)]);continue;}
    if(B.m==='train'){kput('cp_train',x,0,z,w>d?0:Math.PI/2,Math.max(w,d)/17);continue;}
    if(B.m==='kiosk'){kput('cp_kiosk',x,0,z,0,w/6,B.h/3);continue;}
    if(B.m==='stand'){const fa=zoneOf(B.x+B.w/2,B.y+B.d/2),up=fa&&(B.y+B.d/2)<fa.y+fa.d/2,k=Math.max(1,Math.round(w/4));for(let i=0;i<k;i++)kput('cs_stand',x+(i+0.5-k/2)*w/k,0,z,up?0:Math.PI,w/k/4,B.h/4.5);continue;}
    const mat=MAT[B.m]||MAT.concrete;
    const m=addW(new THREE.Mesh(cityBoxGeo(w,B.h,d),mat));m.position.set(x,B.h/2,z);m.castShadow=m.receiveShadow=true;
    if(B.h>3&&B.m!=='cont'&&B.m!=='train'){flat(w-0.4,d-0.4,roofM,x,z,B.h+0.02);}
  }
  // เสา (ทางด่วน / ไซต์ก่อสร้าง / หลักผูกเรือ) + พื้นทางด่วน (ภาพ)
  const pillM=std('#8c8c90');
  for(const o of OBS)if(o.k==='cpill'){const r=o.r*S3,m=addW(new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.05,o.hgt,12),pillM));m.position.set(tx(o.x),o.hgt/2,tz(o.y));shadowAll(m);}
  for(const D of M.deck){const w=D.w*S3,d=D.d*S3,x=tx(D.x+D.w/2),z=tz(D.y+D.d/2);
    const m=addW(new THREE.Mesh(new THREE.BoxGeometry(w,1,d),std('#6e6e74')));m.position.set(x,D.h+0.5,z);shadowAll(m);
    for(const s of [-1,1]){const r=addW(new THREE.Mesh(new THREE.BoxGeometry(w,0.9,0.3),std('#9a9aa0')));r.position.set(x,D.h+1.45,z+s*(d/2-0.15));}
    flat(w,0.2,lineM,x,z,D.h+1.02);}
  // หัวเสาไฟเรืองแสง = Points ก้อนเดียวทั้งเมือง (ตัวเสาเป็นโมเดล cp_lamp จาก M.street)
  const lamps=[];
  for(const q of M.street||[]){CV.it.push({r:kput('cp_'+q.m,tx(q.x),q.m==='boat'?0.1:0,tz(q.y),q.a,1,1,q.col||(CITY_VEH.has('cp_'+q.m)?'#ffffff':null)),v:-1,li:q.m==='lamp'?lamps.length/3:-1});if(q.m==='lamp')lamps.push(tx(q.x),4.42,tz(q.y));}
  // แกนตึก (ข้างในทึบสีเข้ม + หลังคา) = InstancedMesh ก้อนเดียว (ซ่อนทีละหลังตอนถล่ม)
  const cg=new THREE.BoxGeometry(1,1,1),core=new THREE.InstancedMesh(cg,[coreM,coreM,roofM,coreM,coreM,coreM],CV.cores.length);
  CV.cores.forEach((m,i)=>core.setMatrixAt(i,m));core.castShadow=core.receiveShadow=true;core.computeBoundingSphere();addW(core);CV.core=core;
  cityKitLoad(KI,CV);
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lamps,3));CV.lampPts=lg;
  addW(new THREE.Points(lg,new THREE.PointsMaterial({map:glowTex,color:hdr('#ffd08a',2),size:3.2,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
}
// ---------- ชุดโมเดลลอนดอน (assets/city/*.glb จาก assets/src/city_kit_build.py) ----------
// ผนังตึกแถว = แผ่น 4 ม. × ชั้นละ 3.5 ม. ต่อกันรอบกล่องตึก (ยืดแผ่นให้พอดีความยาวด้าน) • ด้านที่หันหาถนนใกล้สุด = หน้าตึก (ชั้นล่างเป็นร้าน/ประตู)
// ทุกชิ้นวาดแบบ InstancedMesh (ชิ้นชนิดเดียวกันทั้งเมือง = draw call เดียวต่อวัสดุ) • โหลดไฟล์ไม่ได้ = เหลือกล่องแกนสีเข้มตามเดิม
// ชนิดตึก (MAPS.city.boxes[].m) → ชุดแผ่น: g = ชั้นล่างด้านหน้า (i = ลำดับแผ่น, k = จำนวนแผ่น) • u = ชั้นบน • s = ชั้นล่างด้านอื่น • top = ขอบดาดฟ้า • c = มุม • ch = มีปล่องไฟ
// hole = แผ่นที่แตกแล้ว • col = สีเศษ/ฝุ่นตอนพัง • ผังแผ่น (ตำแหน่ง/ลำดับ) = cityLayout ใน js/12-city-dmg (โฮสต์ใช้ชุดเดียวกันคิดว่าแผ่นไหนโดน)
const CITY_STY={
  brick:{g:(i,B)=>i%3===1?'ct_door':(Math.floor(B.x+B.y)+i)%2?'ct_shop_r':'ct_shop_b',u:R=>R()<0.6?'ct_win':'ct_win_d',s:R=>R()<0.5?'ct_plain':'ct_win_d',top:'ct_cornice',c:'ct_corner',ch:1,hole:'ct_hole',col:'#8a4a3a'},
  office:{g:(i,B,k)=>i===Math.floor(k/2)?'co_lobby':'co_win_d',u:R=>R()<0.4?'co_win':'co_win_d',s:R=>R()<0.3?'co_plain':'co_win_d',top:'co_top',c:'co_corner',hole:'co_hole',col:'#c8c0ac'},
  glass:{g:()=>'cg_lobby',u:R=>R()<0.3?'cg_win':'cg_win_d',s:R=>R()<0.3?'cg_win':'cg_win_d',top:'cg_top',c:'cg_corner',hole:'cg_hole',col:'#9fc8e0'},
  metal:{g:(i,B)=>i%3===1?'cw_door':B.i%2?'cw_wall_b':'cw_wall',u:(R,B,f,n)=>f===n-1?'cw_win':B.i%2?'cw_wall_b':'cw_wall',s:(R,B)=>B.i%2?'cw_wall_b':'cw_wall',top:'cw_top',c:'cw_corner',hole:'cw_hole',col:'#7d8590'},
  garage:{g:(i,B,k)=>i===Math.floor(k/2)?'cc_entry':'cc_open',u:()=>'cc_open',s:()=>'cc_open',top:'cc_top',c:'cc_corner',hole:'cc_hole',col:'#9a9890'}};
CITY_STY.shop=CITY_STY.station=CITY_STY.brick;
const CITY_VEH=new Set(['cp_car','cp_van','cp_taxi','cp_bus']);
// แผ่นผนังตามผัง cityLayout (ลำดับ P ตรงกับโฮสต์) • คืน {P:[ที่อยู่แผ่น], X:[ขอบดาดฟ้า/มุม/ปล่องไฟ], L, B}
function cityFacade(B,S,zones,w,d,x,z,kput,R){
  const L=cityLayout(B,zones),P=[],X=[];
  for(const p of L.P){const F=L.F[p.fi],nm=p.f>0?S.u(R,B,p.f,L.n):p.fi===L.front?S.g(p.i,B,F.k):S.s(R,B);
    P.push(kput(nm,tx(p.x),p.z0,tz(p.y),F.a,F.sx,L.sy));
    if(p.f===L.n-1)X.push(kput(S.top,tx(p.x),B.h,tz(p.y),F.a,F.sx));}
  for(const [sx2,sz2] of [[-1,-1],[1,-1],[-1,1],[1,1]])for(let f=0;f<L.n;f++)X.push(kput(S.c,x+sx2*w/2,f*CITY_FL*L.sy,z+sz2*d/2,0,1,L.sy));
  if(S.ch){const nc=1+Math.floor(R()*2);for(let i=0;i<nc;i++)X.push(kput('ct_chimney',x+(R()-0.5)*(w-3),B.h,z+(R()-0.5)*(d-3),R()<0.5?0:Math.PI/2));}
  return {P,X,L,B};
}
// สร้าง InstancedMesh ต่อ (ชิ้น × ก้อน × วัสดุ) เมื่อไฟล์โหลดเสร็จ • city_paint / รถ = ย้อมสีต่อชิ้น (instanceColor) • ก้อนละกลุ่ม → cityCull ซ่อน/แสดง
// + กองแผ่นแตก (pool) ต่อชนิดตึก: จำนวนที่วาด = จำนวนแผ่นที่แตกตอนนี้
const CITYK={W:null,g:[],CV:null};
const _cZ=new THREE.Matrix4().makeScale(0,0,0),_cT=new THREE.Matrix4(),_cR=new THREE.Matrix4(),_cC=new THREE.Color();
function cityKitLoad(KI,CV){
  const W0=world,holes=[...new Set(Object.values(CITY_STY).map(S=>S.hole))],names=[...new Set([...Object.keys(KI),...holes])],tmp=new THREE.Matrix4();
  CITYK.W=W0;CITYK.g=[];CITYK.CV=CV;CV.mesh={};CV.pool={};CV.anims=[];CV.ready=false;
  if(window.WD&&!WD.city)Object.defineProperty(WD,'city',{get:()=>({K:CITYK,D:CITYD})});   // ดีบัก: WD.city.K.CV / WD.city.D
  for(let c=0;c<CITY_N*CITY_N;c++){const g=new THREE.Group();g.userData.cx=tx((c%CITY_N+0.5)*CITY_B);g.userData.cz=tz((Math.floor(c/CITY_N)+0.5)*CITY_B);W0.add(g);CITYK.g.push(g);}
  Promise.all(names.map(n=>loadModel('city_'+n))).then(rs=>{
    if(world!==W0||CITYK.W!==W0)return;   // เปลี่ยนแผนที่ไปแล้ว
    rs.forEach((r,j)=>{if(!r)return;const n=names[j];r.scene.updateMatrixWorld(true);
      if(holes.includes(n)){let cap=0;for(const b of CV.b)if(b&&b.sty.hole===n)cap+=b.P.length;if(!cap)return;
        const ims=[];r.scene.traverse(o=>{if(!o.isMesh)return;const im=new THREE.InstancedMesh(o.geometry,o.material,cap);im.count=0;im.frustumCulled=false;im.castShadow=im.receiveShadow=true;im.userData.om=o.matrixWorld.clone();W0.add(im);ims.push(im);});
        CV.pool[n]=ims;return;}
      const veh=CITY_VEH.has(n);CV.mesh[n]={};
      for(const [ch,L] of Object.entries(KI[n])){CV.mesh[n][ch]=[];r.scene.traverse(o=>{if(!o.isMesh)return;const im=new THREE.InstancedMesh(o.geometry,o.material,L.m.length);
        const paint=[].concat(o.material)[0].name==='city_paint';im.userData.om=o.matrixWorld.clone();
        for(let i=0;i<L.m.length;i++){tmp.multiplyMatrices(L.m[i],o.matrixWorld);im.setMatrixAt(i,tmp);if(paint||veh)im.setColorAt(i,_cC.set(paint&&L.c[i]?L.c[i]:'#ffffff'));}
        im.castShadow=im.receiveShadow=true;im.computeBoundingSphere();CITYK.g[ch].add(im);CV.mesh[n][ch].push(im);});}});
    CV.ready=true;for(const b of CV.b)if(b)b.v=-1;for(const it of CV.it)it.v=-1;   // สถานะที่มีอยู่แล้ว (เข้ากลางเกม) → ใช้ทันทีแบบไม่เล่นท่า
    gl.shadowMap.needsUpdate=true;
  });
}
// ทุกเฟรม: ก้อนบล็อกที่ไกลกว่าหมอก (+ครึ่งแนวทแยงบล็อก) ไม่วาด
function cityCull(){
  if(!CITYK.W||CITYK.W!==world)return;
  const R=(scene.fog?scene.fog.far:210)+10+CITY_B*S3*0.71;
  for(const g of CITYK.g){const dx=g.userData.cx-cam.position.x,dz=g.userData.cz-cam.position.z;g.visible=dx*dx+dz*dz<R*R;}
}
// ขยับ/ซ่อนชิ้นเดียว (M = เมทริกซ์ใหม่ของชิ้น หรือ _cZ = ซ่อน)
function citySet(CV,ref,M){const L=CV.mesh[ref.n]&&CV.mesh[ref.n][ref.ch];if(!L)return;
  for(const im of L){if(M===_cZ)im.setMatrixAt(ref.ix,_cZ);else{_cT.multiplyMatrices(M,im.userData.om);im.setMatrixAt(ref.ix,_cT);}im.instanceMatrix.needsUpdate=true;}}
function cityTint(CV,ref,col,veh){const L=CV.mesh[ref.n]&&CV.mesh[ref.n][ref.ch];if(!L)return;
  for(const im of L){if(!im.instanceColor)continue;const paint=[].concat(im.material)[0].name==='city_paint';im.setColorAt(ref.ix,_cC.set(col||(paint&&ref.col)||'#ffffff'));im.instanceColor.needsUpdate=true;}}
function cityPools(CV,names){
  for(const n of names){const ims=CV.pool[n];if(!ims)continue;let k=0;
    CITYD.b.forEach((d,i)=>{const r=CV.b[i];if(!r||r.sty.hole!==n||d.cl||!d.nb)return;for(let p=0;p<d.br.length;p++)if(d.br[p]){for(const im of ims){_cT.multiplyMatrices(r.P[p].M,im.userData.om);im.setMatrixAt(k,_cT);}k++;}});
    for(const im of ims){im.count=k;im.instanceMatrix.needsUpdate=true;}}
}
function cityShowBld(CV,r,off){
  const M=off?(m=>{_cR.copy(m);_cR.elements[13]+=off;return _cR;}):(m=>m);
  for(const q of r.P)citySet(CV,q,off===null?_cZ:M(q.M));for(const q of r.X)citySet(CV,q,off===null?_cZ:M(q.M));
  if(off===null)CV.core.setMatrixAt(r.core,_cZ);else CV.core.setMatrixAt(r.core,M(CV.cores[r.core]));CV.core.instanceMatrix.needsUpdate=true;
  if(r.hl)for(const l of r.hl)l.visible=off===0;
}
// กองซากตึกถล่ม (ภาพ) — สูงตาม CDMG.mound • ชิ้นอิฐ/หินสีตามชนิดตึก
function cityRubble(r){
  const B=r.B,g=new THREE.Group(),R=mulberry(B.i*13+7),w=B.w*S3,d=B.d*S3,m1=sMat({color:r.sty.col,roughness:0.95}),m2=sMat({color:'#4a4640',roughness:1});
  const base=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),m2);base.scale.set(w+1,CDMG.mound,d+1);base.position.y=CDMG.mound/2-0.1;g.add(base);
  const n=Math.min(40,Math.round(w*d/12));
  for(let k=0;k<n;k++){const m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),k%3?m1:m2);const s=0.6+R()*2.2;m.scale.set(s,0.4+R()*1.2,s*(0.5+R()));
    m.position.set((R()-0.5)*w,CDMG.mound+0.1,(R()-0.5)*d);m.rotation.set((R()-0.5)*0.8,R()*3,(R()-0.5)*0.8);g.add(m);}
  g.position.set(tx(B.x+B.w/2),0,tz(B.y+B.d/2));shadowAll(g);world.add(g);return g;
}
const CITY_FALL=1.1;   // วินาทีที่เสา/ตู้ล้มลงพื้น
// ทุกเฟรม: เทียบสถานะ (CITYD จากโฮสต์/snapshot) กับภาพ แล้วเปลี่ยนเฉพาะที่ต่าง
function cityViewSync(dt){
  const CV=CITYK.CV;if(!CV||!CV.ready||CITYK.W!==world||!cityOn())return;
  const pd=new Set();
  CITYD.b.forEach((d,i)=>{const r=CV.b[i];if(!r||r.v===d.v)return;const live=r.v!==-1;r.v=d.v;pd.add(r.sty.hole);
    if(d.cl){if(r.cl)return;r.cl=1;if(live)CV.anims.push({r,t:0});else{cityShowBld(CV,r,null);r.rub=cityRubble(r);}return;}
    if(r.cl){r.cl=0;if(r.rub){world.remove(r.rub);disposeTree(r.rub);r.rub=null;}CV.anims=CV.anims.filter(a=>a.r!==r);cityShowBld(CV,r,0);}
    for(let p=0;p<r.P.length;p++)citySet(CV,r.P[p],d.br[p]?_cZ:r.P[p].M);});
  if(pd.size)cityPools(CV,pd);
  // ตึกกำลังถล่ม: ทรุดลงทั้งหลัง (เร็วขึ้นเรื่อย ๆ) + ฝุ่นรอบฐาน → จบ = กองซาก
  for(const a of CV.anims){a.t+=dt;const k=Math.min(1,a.t/2.2),B=a.r.B;
    cityShowBld(CV,a.r,-(k*k)*(B.h+2));
    if(Math.random()<0.8){const s=Math.random()*4|0,u=Math.random();const x=s<2?B.x+u*B.w:s===2?B.x:B.x+B.w,y=s<2?(s?B.y+B.d:B.y):B.y+u*B.d;smoke(x,y,0.5,2,'#8a8070',2.4,12,90);}
    if(k>=1){cityShowBld(CV,a.r,null);a.r.rub=cityRubble(a.r);a.done=1;smoke(B.x+B.w/2,B.y+B.d/2,2,18,'#7a7268',3,16,200);}}
  if(CV.anims.length)CV.anims=CV.anims.filter(a=>!a.done);
  const lp=CV.lampPts.attributes.position;let lpd=false;
  CITYD.it.forEach((it,i)=>{const r=CV.it[i];if(!r)return;
    if(r.v!==it.v){const live=r.v!==-1;r.v=it.v;const m=it.q.m,veh=CITY_VEH.has('cp_'+m);
      r.fall=null;r.burn=it.st===2;
      if(it.st===0){citySet(CV,r.r,r.r.M);if(veh)cityTint(CV,r.r,null,1);}
      else if(it.st===1){if(CDMG.topple.has(m)){if(live)r.fall={t:0};else{_cR.makeRotationX(Math.PI/2);citySet(CV,r.r,_cT.multiplyMatrices(r.r.M,_cR).clone());}}else citySet(CV,r.r,_cZ);}
      else if(it.st===3)cityTint(CV,r.r,'#2a2420',1);
      if(r.li>=0){lp.setY(r.li,it.st===1?-100:4.42);lpd=true;}}
    if(r.fall){r.fall.t+=dt;const k=Math.min(1,r.fall.t/CITY_FALL);_cR.makeRotationX(Math.PI/2*k*k);citySet(CV,r.r,_cT.multiplyMatrices(r.r.M,_cR).clone());if(k>=1)r.fall=null;}
    if((r.burn||it.st===3)&&Math.random()<(r.burn?dt*22:dt*2)){const q=it.q;
      if(Math.hypot(tx(q.x)-cam.position.x,tz(q.y)-cam.position.z)<90){
        if(r.burn)PARTS.push({x:q.x+rnd(-30,30),y:q.y+rnd(-30,30),h:rnd(0.8,1.8),vx:rnd(-10,10),vy:rnd(-10,10),vh:rnd(2,4),life:rnd(0.5,0.9),max:0.9,col:Math.random()<0.5?'#ff7a2a':'#ffc04a',size:rnd(8,13),g:-1.5,drag:3,grow:0.7});
        PARTS.push({x:q.x+rnd(-20,20),y:q.y+rnd(-20,20),h:1.8,vx:0,vy:0,vh:rnd(0.8,1.6),life:2.2,max:2.2,col:'#2a2522',size:10,g:-0.3,smoke:true,grow:1.6,drag:2});
        if(r.burn&&Math.random()<0.2)LREQ.push({x:tx(q.x),y:2,z:tz(q.y),col:'#ff6a2a',int:2.6,dist:14});}}
  });
  if(lpd)lp.needsUpdate=true;
}
// เอฟเฟกต์ของเหตุการณ์เมือง (เรียกจาก fx() js/26)
function cityDebris(x,y,h,col,ox,oy,n,big){
  const mt=sMat({color:col,roughness:0.9}),mc=sMat({color:'#8c8a86',roughness:1}),mr=sMat({color:'#5a4a3c',roughness:0.9});n=Math.round(n*1.8);   // สนามรบ: เศษเยอะ (คอนกรีต/เหล็กเส้น) ค้างทั้งแมตช์
  for(let k=0;k<n;k++){const t=k%6,m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),t<3?mt:t<5?mc:mr);const s=big?0.5+Math.random()*0.9:0.25+Math.random()*0.5;if(t===5)m.scale.set(0.06,0.06,1+Math.random()*1.5);else m.scale.set(s,s*0.6,s*0.8);
    m.castShadow=true;m.position.set(tx(x)+rnd(-1.5,1.5),h+rnd(-1,1),tz(y)+rnd(-1.5,1.5));m.rotation.set(Math.random()*6,Math.random()*6,0);scene.add(m);
    let dx=x-ox,dy=y-oy;const dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;const sp=(big?6:3.5)*(0.6+Math.random()*0.8);
    DEBRIS.push({m,vx:dx*sp+rnd(-1.5,1.5),vz:dy*sp+rnd(-1.5,1.5),vy:1+Math.random()*4,rx:rnd(-8,8),rz:rnd(-8,8),life:3+Math.random()*1.5,s0:m.scale.clone()});}
  bfScatter(x,y,big?260:70,big?40:12,[mt,mc],big?1.3:0.8);bfScatter(x,y,big?300:80,big?30:10,'rock',0.7);
  debrisCap();
}
function cityFX(ev,H,near){
  const CV=CITYK.CV;
  if(ev.k==='cb'){const r=CV&&CV.b[ev.i],col=r?r.sty.col:'#8a8070',el=ev.el||'none',fire=el.includes('fire');
    if(ev.e==='h'){burst(ev.x,ev.y,col,8,90,0.45,2.2,{h:ev.h,vh:[0.5,3],g:6});if(near)snd('thud',{x:ev.x,y:ev.y,vol:0.5});}
    else if(ev.e==='b'){cityDebris(ev.x,ev.y,ev.h,col,ev.ox||ev.x,ev.oy||ev.y,el.includes('blast')?10:6,false);
      smoke(ev.x,ev.y,ev.h,10,fire?'#2a2522':'#7a6a58',1.8,9,120);burst(ev.x,ev.y,col,26,200,0.8,3,{h:ev.h,vh:[1,6],g:9});
      if(r&&r.sty.hole==='cg_hole')burst(ev.x,ev.y,'#cfe8ff',30,240,0.9,1.6,{h:ev.h,vh:[0,5],g:10});   // กระจกแตก
      if(near){snd('break',ev);shake(3);}}
    else if(ev.e==='c'){const B=r&&r.B;if(B)for(let k=0;k<26;k++){const t=k/26*6.28;smoke(ev.x+Math.cos(t)*B.w*0.6,ev.y+Math.sin(t)*B.d*0.6,1,2,'#8a8070',3,16,160);}
      cityDebris(ev.x,ev.y,4,col,ev.x,ev.y,16,true);
      if(B)bfCollapse(ev.x,ev.y,B.w,B.d,fire);   // ฝุ่นก้อนใหญ่ + เศษ + รอย (js/44)
      const dd=Math.hypot(tx(ev.x)-cam.position.x,tz(ev.y)-cam.position.z);if(dd<150){snd('boom',{x:ev.x,y:ev.y,vol:1});snd('break',ev);shake(dd<60?12:6);}}
    return;}
  if(ev.k==='cs'){
    if(ev.e==='b'){burst(ev.x,ev.y,'#5a5a60',18,160,0.7,2.4,{h:1,vh:[1,5],g:9});smoke(ev.x,ev.y,0.5,4,'#6a6058',1,5,60);if(near)snd('break',ev);}
    else if(ev.e==='f'){burst(ev.x,ev.y,'#ff8a3a',30,160,0.9,2.4,{h:1,vh:[1,4],g:-1});FX.flashLight(ev.x,ev.y,1.5,'#ff7a2a',4,14,0.5);if(near)snd('thud',{x:ev.x,y:ev.y,vol:0.8});}
  }
}
