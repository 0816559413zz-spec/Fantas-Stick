// ---------- เมืองมักเกิ้ล (กล่องเทา) — ภาพ • ข้อมูลอยู่ js/02-city.js ----------
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
  const contM=['#a8442e','#2e6aa8','#3e8a4a','#c8a03a','#7a3a6a'].map(c=>std(c,{roughness:0.7,metalness:0.2})),carM=['#c8302e','#e8e8ea','#2a2c34','#2e5aa8','#9aa0a8'].map(c=>std(c,{roughness:0.4,metalness:0.4}));
  const roofM=std('#3a3c42'),glassCar=std('#1a2230',{roughness:0.2,metalness:0.6});
  const zoneOf=(x,y)=>M.zones.find(z=>x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.d);
  const KI={},kput=(n,x,y,z,a,sx)=>{(KI[n]||(KI[n]=[])).push(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),a),new THREE.Vector3(sx||1,1,1)));};
  const KR=mulberry(3550),coreM=std('#2a2624');
  for(const B of M.boxes){
    const w=B.w*S3,d=B.d*S3,x=tx(B.x+B.w/2),z=tz(B.y+B.d/2);
    const zn=(B.m==='shop'||B.m==='brick')&&zoneOf(B.x+B.w/2,B.y+B.d/2);
    if(zn&&zn.k==='shops'){cityFacade(B,zn,w,d,x,z,kput,KR);const m=addW(new THREE.Mesh(new THREE.BoxGeometry(w-0.8,B.h,d-0.8),coreM));m.position.set(x,B.h/2,z);flat(w-0.4,d-0.4,roofM,x,z,B.h+0.02);continue;}
    if(B.m==='car'){const c=carM[B.i%carM.length],b=addW(new THREE.Mesh(new THREE.BoxGeometry(w,0.8,d),c));b.position.set(x,0.5,z);const t=addW(new THREE.Mesh(new THREE.BoxGeometry(w*0.55,0.6,d*0.9),glassCar));t.position.set(x,1.2,z);shadowAll(b);shadowAll(t);continue;}
    const mat=B.m==='cont'?contM[B.i%contM.length]:MAT[B.m]||MAT.concrete;
    const m=addW(new THREE.Mesh(cityBoxGeo(w,B.h,d),mat));m.position.set(x,B.h/2,z);m.castShadow=m.receiveShadow=true;
    if(B.h>3&&B.m!=='cont'&&B.m!=='train'){flat(w-0.4,d-0.4,roofM,x,z,B.h+0.02);}
    if(B.hl){for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const l=addW(new THREE.Sprite(glowMat('#ff3030',2.4)));l.position.set(x+sx*w/2,B.h+0.6,z+sz*d/2);l.scale.set(2,2,1);}}
  }
  // เสา (ทางด่วน / ไซต์ก่อสร้าง / หลักผูกเรือ) + พื้นทางด่วน (ภาพ)
  const pillM=std('#8c8c90');
  for(const o of OBS)if(o.k==='cpill'){const r=o.r*S3,m=addW(new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.05,o.hgt,12),pillM));m.position.set(tx(o.x),o.hgt/2,tz(o.y));shadowAll(m);}
  for(const D of M.deck){const w=D.w*S3,d=D.d*S3,x=tx(D.x+D.w/2),z=tz(D.y+D.d/2);
    const m=addW(new THREE.Mesh(new THREE.BoxGeometry(w,1,d),std('#6e6e74')));m.position.set(x,D.h+0.5,z);shadowAll(m);
    for(const s of [-1,1]){const r=addW(new THREE.Mesh(new THREE.BoxGeometry(w,0.9,0.3),std('#9a9aa0')));r.position.set(x,D.h+1.45,z+s*(d/2-0.15));}
    flat(w,0.2,lineM,x,z,D.h+1.02);}
  // เสาไฟริมทางเท้า: เสารวม mesh ได้ • หัวไฟเป็น Points ก้อนเดียว (draw call เดียวทั้งเมือง)
  const poleM=std('#22252c',{roughness:0.5}),lamps=[];
  for(let k=1;k<CITY_N;k++)for(let s=CITY_ROAD/2+150;s<MW;s+=500){if(Math.abs(s%CITY_B)<CITY_ROAD/2+60||Math.abs(s%CITY_B-CITY_B)<CITY_ROAD/2+60)continue;
    for(const sd of [-1,1]){const c=k*CITY_B+sd*(CITY_ROAD/2+18);
      for(const [px,py] of [[c,s],[s,c]]){if(Math.hypot(px-MW/2,py-MH/2)<CITY_PLAZA)continue;{const zz=zoneOf(px+(px===c?sd*60:0),py+(py===c?sd*60:0));if(zz&&zz.k==='shops')continue;}const p=addW(new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.12,6,6),poleM));p.position.set(tx(px),3,tz(py));lamps.push(tx(px),6.1,tz(py));}}}
  for(let a=0;a<16;a++){const x=Math.cos(a/16*Math.PI*2)*(CITY_PLAZA*S3-2),z=Math.sin(a/16*Math.PI*2)*(CITY_PLAZA*S3-2);const p=addW(new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.12,5,6),poleM));p.position.set(x,2.5,z);lamps.push(x,5.1,z);}
  for(const q of M.street||[]){kput('cp_'+q.m,tx(q.x),0,tz(q.y),q.a);if(q.m==='lamp')lamps.push(tx(q.x),4.42,tz(q.y));}
  cityKitLoad(KI);
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lamps,3));
  addW(new THREE.Points(lg,new THREE.PointsMaterial({map:glowTex,color:hdr('#ffd08a',2),size:3.2,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
}
// ---------- ชุดโมเดลลอนดอน (assets/city/*.glb จาก assets/src/city_kit_build.py) ----------
// ผนังตึกแถว = แผ่น 4 ม. × ชั้นละ 3.5 ม. ต่อกันรอบกล่องตึก (ยืดแผ่นให้พอดีความยาวด้าน) • ด้านที่หันหาถนนใกล้สุด = หน้าตึก (ชั้นล่างเป็นร้าน/ประตู)
// ทุกชิ้นวาดแบบ InstancedMesh (ชิ้นชนิดเดียวกันทั้งเมือง = draw call เดียวต่อวัสดุ) • โหลดไฟล์ไม่ได้ = เหลือกล่องแกนสีเข้มตามเดิม
const CITY_FL=3.5,CITY_PW=4;
function cityFacade(B,zn,w,d,x,z,kput,R){
  const n=Math.max(1,Math.round(B.h/CITY_FL));
  // ด้าน: [มุม rotation.y, ระยะออกจากกลาง, ความยาว, ระยะถึงขอบย่าน (หาหน้าตึก)]
  const F=[[0,d/2,w,zn.y+zn.d-(B.y+B.d)],[Math.PI,d/2,w,B.y-zn.y],[Math.PI/2,w/2,d,zn.x+zn.w-(B.x+B.w)],[-Math.PI/2,w/2,d,B.x-zn.x]];
  const front=F.reduce((a,f,i)=>f[3]<F[a][3]?i:a,0);
  F.forEach(([a,off,L],fi)=>{
    const k=Math.max(1,Math.round(L/CITY_PW)),sx=L/(k*CITY_PW),nx=Math.sin(a),nz=Math.cos(a),tx2=Math.cos(a),tz2=-Math.sin(a);
    for(let i=0;i<k;i++){const t=(i+0.5-k/2)*CITY_PW*sx,px=x+nx*off+tx2*t,pz=z+nz*off+tz2*t;
      for(let f=0;f<n;f++){const nm=f>0?(R()<0.6?'ct_win':'ct_win_d'):fi===front?(i%3===1?'ct_door':(Math.floor(B.x+B.y)+i)%2?'ct_shop_r':'ct_shop_b'):(R()<0.5?'ct_plain':'ct_win_d');kput(nm,px,f*CITY_FL,pz,a,sx);}
      kput('ct_cornice',px,n*CITY_FL,pz,a,sx);}
  });
  for(const [sx2,sz2] of [[-1,-1],[1,-1],[-1,1],[1,1]])for(let f=0;f<n;f++)kput('ct_corner',x+sx2*w/2,f*CITY_FL,z+sz2*d/2,0);
  const nc=1+Math.floor(R()*2);for(let i=0;i<nc;i++)kput('ct_chimney',x+(R()-0.5)*(w-3),n*CITY_FL,z+(R()-0.5)*(d-3),R()<0.5?0:Math.PI/2);
}
function cityKitLoad(KI){
  const W0=world,names=Object.keys(KI),tmp=new THREE.Matrix4();
  Promise.all(names.map(n=>loadModel('city_'+n))).then(rs=>{
    if(world!==W0)return;   // เปลี่ยนแผนที่ไปแล้ว
    rs.forEach((r,j)=>{if(!r)return;const L=KI[names[j]];r.scene.updateMatrixWorld(true);
      r.scene.traverse(o=>{if(!o.isMesh)return;const im=new THREE.InstancedMesh(o.geometry,o.material,L.length);
        for(let i=0;i<L.length;i++){tmp.multiplyMatrices(L[i],o.matrixWorld);im.setMatrixAt(i,tmp);}
        im.castShadow=im.receiveShadow=true;im.computeBoundingSphere();W0.add(im);});});
    gl.shadowMap.needsUpdate=true;
  });
}
