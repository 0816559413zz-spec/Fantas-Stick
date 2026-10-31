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
      {const I=CITYD&&CITYD.b[B.i]&&CITYD.b[B.i].I,c0=I?Math.min(B.h-CIN.slab,I.top-CIN.slab):0;   // ตึกกลวง: แกนทึบเหลือแค่ส่วนบน (+ แผ่นเพดานห้องชั้นบนสุด)
      CV.cores.push(I&&I.ring?new THREE.Matrix4().makeScale(0,0,0):new THREE.Matrix4().compose(new THREE.Vector3(x,(c0+B.h)/2,z),_q.set(0,0,0,1),new THREE.Vector3(Math.max(0.2,w-(I?0:0.8)),B.h-c0,Math.max(0.2,d-(I?0:0.8)))));}
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
  // ห่วงควิดดิชในสนามกีฬา (ขั้น 6)
  const goldM=std('#e8c060',{metalness:0.85,roughness:0.25,emissive:'#3a2a08'});
  for(const o of OBS)if(o.k==='hoop'){const x=tx(o.x),z=tz(o.y);
    const post=addW(new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.4,o.ring-1.6,12),goldM));post.position.set(x,(o.ring-1.6)/2,z);post.castShadow=true;
    const rg=addW(new THREE.Mesh(new THREE.TorusGeometry(1.6,0.16,12,40),goldM));rg.position.set(x,o.ring,z);rg.rotation.y=Math.PI/2;rg.castShadow=true;}
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
  cityInteriorView(CV);
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lamps,3));CV.lampPts=lg;
  addW(new THREE.Points(lg,new THREE.PointsMaterial({map:glowTex,color:hdr('#ffd08a',2),size:3.2,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
}
// ---------- ข้างในตึกกลวง (ภาพ — ผัง I จาก cityInterior js/12-city-dmg) ----------
// พื้นล่าง / พื้นชั้นบน (เว้นรูทางลาด) / ทางลาด / วงกบประตู = mesh รวมต่อวัสดุทั้งเมือง • ผนังด้านใน = InstancedMesh แผ่นละชิ้น (ซ่อนเมื่อแผ่นแตก — cityViewSync)
// ข้างในมืด (กลางคืน + ใต้พื้นชั้นบน) → วัสดุมีแสงในตัวนิดหน่อยให้เห็นห้อง
// ข้างในตึกวางบนระดับบล็อก (ทางเท้า CITY_KERB) เท่ากับเท้าตัวละคร (GY)
function cityInteriorView(CV){
  if(!CITYD)return;const IG=addW(new THREE.Group()),addI=o=>{IG.add(o);return o;};IG.position.y=CITY_KERB;
  const L={floor:[],roof:[]},lin=[],SI=[[],[]],FRI=[],RPI=[],IWI=[],_e=new THREE.Euler();
  const bm=(x0,z0,x1,z1,y,h)=>new THREE.Matrix4().compose(new THREE.Vector3((x0+x1)/2,y,(z0+z1)/2),new THREE.Quaternion(),new THREE.Vector3(Math.max(0.01,x1-x0),h,Math.max(0.01,z1-z0)));
  const cut=(R,H)=>{if(!H||H[0]>=R[2]||H[2]<=R[0]||H[1]>=R[3]||H[3]<=R[1])return [R];const o=[],a=Math.max(R[0],H[0]),b=Math.min(R[2],H[2]);   // สี่เหลี่ยม R ลบรู H
    if(H[0]>R[0])o.push([R[0],R[1],H[0],R[3]]);if(H[2]<R[2])o.push([H[2],R[1],R[2],R[3]]);if(H[1]>R[1])o.push([a,R[1],b,H[1]]);if(H[3]<R[3])o.push([a,H[3],b,R[3]]);return o;};
  const box=(list,x0,z0,x1,z1,y,h)=>{if(x1-x0<0.05||z1-z0<0.05)return;const g=new THREE.BoxGeometry(x1-x0,h,z1-z0);g.translate((x0+x1)/2,y,(z0+z1)/2);list.push(g);};
  const rect=(list,A,y,h)=>box(list,tx(A[0]),tz(A[1]),tx(A[2]),tz(A[3]),y,h);
  CITYD.b.forEach((d,i)=>{const I=d.I,r=CV.b[i];if(!I||!r)return;const B=d.B,Lt=d.L,R0=[I.x0,I.y0,I.x1,I.y1];
    rect(L.floor,R0,-0.03,0.06);   // พื้นล่าง (ผิวบน = ระดับบล็อก)
    for(const S of I.slabs){const H=S.hole,y=S.z-CIN.slab/2,h=CIN.slab,dst=S.roof?L.roof:L.floor;   // พื้นชั้นบน/หลังคา = กรอบในลบรูทางลาด
      if(!S.secs){for(const q of cut(R0,H))rect(dst,q,y,h);continue;}
      const bd=CIN.band;for(const q of cut([R0[0]+bd,R0[1]+bd,R0[2]-bd,R0[3]-bd],H))rect(dst,q,y,h);   // แกนกลาง (พังไม่ได้)
      for(const j of S.secs){r.sec=r.sec||[];r.sec[j]=[];for(const q of cut(I.sec[j].r,H)){const L2=SI[S.roof?1:0];r.sec[j].push([S.roof?1:0,L2.length]);L2.push(bm(tx(q[0]),tz(q[1]),tx(q[2]),tz(q[3]),y,h));}}}   // ช่องขอบ (พังได้ — ซ่อนทีละช่อง)
    for(const R of I.ramps){const run=(R.ax==='x'?R.x1-R.x0:R.y1-R.y0)*S3,wd=(R.ax==='x'?R.y1-R.y0:R.x1-R.x0)*S3,rise=R.z1-R.z0,hyp=Math.hypot(run,rise),an=Math.atan2(rise,run);
      (r.rp=r.rp||[])[R.j]=RPI.length;RPI.push(new THREE.Matrix4().compose(new THREE.Vector3(tx((R.x0+R.x1)/2),(R.z0+R.z1)/2-0.13,tz((R.y0+R.y1)/2)),new THREE.Quaternion().setFromEuler(_e.set(R.ax==='x'?0:-an*R.dir,0,R.ax==='x'?an*R.dir:0)),new THREE.Vector3(R.ax==='x'?hyp:wd,0.25,R.ax==='x'?wd:hyp)));}   // ทางลาด (พังได้ — ซ่อนทีละอัน)
    I.iw.forEach((W,j)=>{const z0=W.f*I.fh+(W.f?0:0.1),z1=W.f*I.fh+I.fh-CIN.slab,hz=W.fi<2,q=W.r,ids=[];   // ผนังห้องชั้นใน (ประตู = เสาสองข้าง + คานบน)
      const put=(a,b,y0,y1)=>{if(b-a<2||y1-y0<0.05)return;ids.push(IWI.length);IWI.push(hz?bm(tx(a),tz(q[1]),tx(b),tz(q[3]),(y0+y1)/2,y1-y0):bm(tx(q[0]),tz(a),tx(q[2]),tz(b),(y0+y1)/2,y1-y0));};
      const A=hz?q[0]:q[1],Bb=hz?q[2]:q[3];
      if(W.door){put(A,W.dp-CIN.door,z0,z1);put(W.dp+CIN.door,Bb,z0,z1);put(Math.max(A,W.dp-CIN.door),Math.min(Bb,W.dp+CIN.door),CIN.dh,z1);}else put(A,Bb,z0,z1);
      (r.iw=r.iw||[])[j]=ids;});
    const col=r.sty.col,fb=(x0,z0,x1,z1,y,h)=>{(r.fr=r.fr||[]).push(FRI.length);FRI.push([bm(x0,z0,x1,z1,y,h),col]);};
    Lt.F.forEach((F,fi)=>{const pw=CITY_PW*F.sx,wt=CIN.wt*S3;
      for(let k=0;k<F.k;k++)for(let f=0;f<I.nf;f++){const p=F.s0+k*Lt.n+f,P=Lt.P[p],cx=tx(P.x),cz=tz(P.y),nx=fi===2?-1:fi===3?1:0,nz=fi===0?-1:fi===1?1:0;
        if(I.door.has(p)){const dw=CIN.door*S3,j=(pw/2-dw),ux=nz?1:0,uz=nx?1:0,ix=cx+nx*wt/2,iz=cz+nz*wt/2;   // วงกบ: เสาสองข้าง + คานบน (สีผนังตึก)
          for(const s of [-1,1]){const u=s*(dw+j/2);fb(ix+ux*u-(ux?j/2:wt/2),iz+uz*u-(uz?j/2:wt/2),ix+ux*u+(ux?j/2:wt/2),iz+uz*u+(uz?j/2:wt/2),I.fh/2,I.fh);}
          fb(ix-(ux?dw:wt/2),iz-(uz?dw:wt/2),ix+(ux?dw:wt/2),iz+(uz?dw:wt/2),(CIN.dh+I.fh)/2,I.fh-CIN.dh);continue;}
        const m=new THREE.Matrix4().compose(new THREE.Vector3(cx+nx*(wt+0.02),(f+0.5)*I.fh,cz+nz*(wt+0.02)),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.atan2(nx,nz)),new THREE.Vector3(pw,I.fh,1));
        (r.lin||(r.lin=new Map())).set(p,lin.length);lin.push(m);}});});
  const mk=(list,mat)=>{if(!list.length)return;const g=mergeGeometries(list,false);list.forEach(q=>q.dispose());const m=addI(new THREE.Mesh(g,mat));m.castShadow=m.receiveShadow=true;};
  mk(L.floor,new THREE.MeshStandardMaterial({color:'#9a8f80',roughness:0.95,emissive:'#3a3128'}));
  const roofM=new THREE.MeshStandardMaterial({color:'#55575e',roughness:0.95,emissive:'#1a1a1e'});mk(L.roof,roofM);
  const ub=new THREE.BoxGeometry(1,1,1),imk=(list,mat)=>{const im=new THREE.InstancedMesh(ub,mat,Math.max(1,list.length));list.forEach((m,i)=>im.setMatrixAt(i,m));im.count=list.length;im.userData.M=list;im.castShadow=im.receiveShadow=true;im.computeBoundingSphere();addI(im);return im;};
  CV.secIm=[imk(SI[0],new THREE.MeshStandardMaterial({color:'#9a8f80',roughness:0.95,emissive:'#3a3128'})),imk(SI[1],roofM)];
  CV.rpIm=imk(RPI,new THREE.MeshStandardMaterial({color:'#8a6646',roughness:0.9,emissive:'#33241a'}));
  CV.iwIm=imk(IWI,new THREE.MeshStandardMaterial({color:'#d6cdb9',roughness:0.95,emissive:'#5a4e3e'}));IWI.forEach((m,i)=>CV.iwIm.setColorAt(i,_cC.set('#ffffff')));
  CV.frIm=imk(FRI.map(q=>q[0]),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:0.9}));FRI.forEach((q,i)=>CV.frIm.setColorAt(i,new THREE.Color(q[1])));
  const lm=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshStandardMaterial({color:'#d6cdb9',roughness:0.95,emissive:'#5a4e3e'}),Math.max(1,lin.length));
  lin.forEach((m,i)=>lm.setMatrixAt(i,m));lm.count=lin.length;lm.receiveShadow=true;lm.computeBoundingSphere();addI(lm);CV.lin=lm;CV.linM=lin;
}
// ตึก 1 ชั้นถล่ม: ซ่อนผนังด้านใน/วงกบประตู/ขอบพื้น (กองซาก cityRubble ทับพื้นล่าง)
function cityHideIn(CV,r){if(r.lin&&CV.lin){for(const ix of r.lin.values())CV.lin.setMatrixAt(ix,_cZ);CV.lin.instanceMatrix.needsUpdate=true;}
  if(r.fr&&CV.frIm){for(const ix of r.fr)CV.frIm.setMatrixAt(ix,_cZ);CV.frIm.instanceMatrix.needsUpdate=true;}
  if(r.sec)for(const L2 of r.sec)if(L2)for(const [w,ix] of L2){CV.secIm[w].setMatrixAt(ix,_cZ);CV.secIm[w].instanceMatrix.needsUpdate=true;}
  if(r.iw&&CV.iwIm){for(const ids of r.iw)if(ids)for(const ix of ids)CV.iwIm.setMatrixAt(ix,_cZ);CV.iwIm.instanceMatrix.needsUpdate=true;}
  if(r.rp&&CV.rpIm){for(const ix of r.rp)if(ix!==undefined)CV.rpIm.setMatrixAt(ix,_cZ);CV.rpIm.instanceMatrix.needsUpdate=true;}}
// เนินเศษที่โคนผนังตรงแผ่นที่แตก (ผัง d.mo จาก cityMounds — ที่ชนเดินขึ้นได้อยู่ใน cityMoundH) • สร้างใหม่ทุกครั้งที่สถานะตึกเปลี่ยน
function cityMoundView(r,d){
  if(r.mg){world.remove(r.mg);disposeTree(r.mg);r.mg=null;}if(!d.mo||!d.mo.length){if(!d.ns)return;}
  const g=new THREE.Group(),R=mulberry(d.B.i*31+d.nb),m1=sMat({color:r.sty.col,roughness:0.95}),m2=sMat({color:'#5a554e',roughness:1}),m3=sMat({color:'#7a746a',roughness:1}),rb=sMat({color:'#3a3634',roughness:0.6,metalness:0.4});
  for(const q of d.mo){const along=q.rx>q.ry,L=along?q.rx:q.ry,Wd=along?q.ry:q.rx,cx=tx(q.x),cz=tz(q.y);   // เนิน = ก้อนหยาบหลายก้อนเรียงตามแนวผนัง + อิฐ/คอนกรีต + เหล็กเส้น
    for(let k=0;k<4;k++){const lump=new THREE.Mesh(sGeo(THREE.DodecahedronGeometry,1,0),[m2,m1,m3][k%3]),u=(k/3-0.5)*L*S3*1.1+(R()-0.5)*0.6,sc=0.45+R()*0.35;
      lump.scale.set((along?L*0.55:Wd)*S3*sc,q.h*(0.65+R()*0.4),(along?Wd:L*0.55)*S3*sc);lump.position.set(cx+(along?u:0),0,cz+(along?0:u));lump.rotation.set((R()-0.5)*0.3,R()*3,(R()-0.5)*0.3);g.add(lump);}
    for(let k=0;k<12;k++){const c=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),[m1,m2,m3][k%3]),s=0.2+R()*0.6,u=(R()-0.5)*L*S3*1.6,v=(R()-0.5)*Wd*S3*1.6;c.scale.set(s,s*(0.4+R()*0.4),s*(0.6+R()));
      c.position.set(cx+(along?u:v),q.h*(0.3+R()*0.7),cz+(along?v:u));c.rotation.set(R()*2,R()*3,R()*2);g.add(c);}
    for(let k=0;k<2;k++){const b=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),rb);b.scale.set(0.05,0.05,1.2+R()*1.5);b.position.set(cx+(R()-0.5)*L*S3,q.h*0.8,cz+(R()-0.5)*Wd*S3);b.rotation.set(R()*1.2,R()*3,R()*0.6);g.add(b);}}
  // ตึกโดนแหว่ง (ผู้ใช้ 2026-10-29 ภาพอ้างอิง): ขอบพื้นที่พัง = ตอพื้นแหว่งฟันเลื่อยยื่นจากแกนกลาง + เสาคอนกรีตตั้งระหว่างช่อง + เศษบนพื้น — ภาพล้วน
  const I=d.I;
  if(I&&I.ring&&d.ns){const cm=sMat({color:'#8c867c',roughness:1}),cd=sMat({color:'#6e685f',roughness:1}),t=CIN.slab,pil=new Map();
    const bx=(a0,a1,p0,p1,y,h,hz,mat,ry)=>{const m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),mat);const X0=hz?a0:p0,X1=hz?a1:p1,Y0=hz?p0:a0,Y1=hz?p1:a1;
      m.scale.set(Math.abs(X1-X0)*S3,h,Math.abs(Y1-Y0)*S3);m.position.set(tx((X0+X1)/2),y,tz((Y0+Y1)/2));if(ry)m.rotation.set(ry[0],ry[1],ry[2]);g.add(m);return m;};
    I.sec.forEach((Q,j)=>{if(!d.sb[j])return;const S=I.slabs[Q.k],hz=Q.fi<2,q=Q.r,A=hz?q[0]:q[1],Bb=hz?q[2]:q[3];
      const core=Q.fi===0?q[1]:Q.fi===1?q[3]:Q.fi===2?q[0]:q[2],out=Q.fi===0||Q.fi===2?1:-1,outer=Q.fi===0?q[3]:Q.fi===1?q[1]:Q.fi===2?q[2]:q[0];
      for(let u=A;u<Bb-3;){const L=Math.min(Bb-u,10+R()*22),len=6+R()*26,y=S.z-t/2-R()*0.15;   // ตอพื้นฟันเลื่อย
        bx(u,u+L,core,core+out*len,y,t*(0.7+R()*0.3),hz,R()<0.7?cm:cd,[(R()-0.5)*0.12,0,(R()-0.5)*0.12]);u+=L+R()*5;}
      for(let k=0;k<3;k++){const u=A+R()*(Bb-A),v=core+out*(4+R()*14),c=bx(u-4,u+4,v-4,v+4,S.z+0.12,0.25+R()*0.3,hz,[cm,cd][k%2]);c.rotation.y=R()*3;}   // เศษบนตอพื้น
      for(const e of [A,Bb]){const key=Q.fi+'|'+Math.round(e),o=pil.get(key);if(!o||S.z>o.z)pil.set(key,{e,z:S.z,v:outer-out*14,hz});}});   // เสา: ต้นเดียวจากพื้นดิน สูงถึงแผ่นที่พังสูงสุดตรงนั้น
    for(const P of pil.values()){const brk=R()<0.35,h=(P.z-t)*(brk?0.45+R()*0.4:1);bx(P.e-7,P.e+7,P.v-7,P.v+7,h/2,h,P.hz,R()<0.5?cm:cd);}}   // บางต้นหักตอนบน (โคนติดพื้นเสมอ)
  g.position.y=CITY_KERB;shadowAll(g);world.add(g);r.mg=g;
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
  const L=cityLayout(B,zones),P=[],X=[],XP=[];   // XP[j] = แผ่นผนังที่ชิ้นโครง X[j] เกาะอยู่ (แผ่นไหนแตก = ชิ้นโครงนั้นหักหายไปด้วย — cityViewSync)
  L.P.forEach((p,pi)=>{const F=L.F[p.fi],nm=p.f>0?S.u(R,B,p.f,L.n):p.fi===L.front?S.g(p.i,B,F.k):S.s(R,B);
    P.push(kput(nm,tx(p.x),p.z0,tz(p.y),F.a,F.sx,L.sy));
    if(p.f===L.n-1){X.push(kput(S.top,tx(p.x),B.h,tz(p.y),F.a,F.sx));XP.push([pi]);}});
  for(const [sx2,sz2] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const cx=B.x+(sx2>0?B.w:0),cy=B.y+(sz2>0?B.d:0);
    for(let f=0;f<L.n;f++){X.push(kput(S.c,x+sx2*w/2,f*CITY_FL*L.sy,z+sz2*d/2,0,1,L.sy));   // เสามุม: เกาะแผ่นปลายสุดของสองด้านที่มาชนกันที่มุมนี้ (ชั้นเดียวกัน)
      const adj=[];L.P.forEach((q,pi)=>{if(q.f===f&&Math.hypot(q.x-cx,q.y-cy)<CITY_PW*L.F[q.fi].sx*10+8)adj.push(pi);});XP.push(adj);}}
  if(S.ch){const nc=1+Math.floor(R()*2);for(let i=0;i<nc;i++)X.push(kput('ct_chimney',x+(R()-0.5)*Math.max(0.5,w-9),B.h,z+(R()-0.5)*Math.max(0.5,d-9),R()<0.5?0:Math.PI/2));}
  return {P,X,XP,L,B};
}
// สร้าง InstancedMesh ต่อ (ชิ้น × ก้อน × วัสดุ) เมื่อไฟล์โหลดเสร็จ • city_paint / รถ = ย้อมสีต่อชิ้น (instanceColor) • ก้อนละกลุ่ม → cityCull ซ่อน/แสดง
// + กองแผ่นแตก (pool) ต่อชนิดตึก: จำนวนที่วาด = จำนวนแผ่นที่แตกตอนนี้
const CITYK={W:null,g:[],CV:null};
const _cZ=new THREE.Matrix4().makeScale(0,0,0),_cT=new THREE.Matrix4(),_cR=new THREE.Matrix4(),_cC=new THREE.Color();
function cityKitLoad(KI,CV){
  const W0=world,holes=[...new Set(Object.values(CITY_STY).flatMap(S=>[S.hole,S.hole+'o']))],   // <hole>o = รูโล่ง (ชั้นที่เดินเข้าได้ — ไม่มีแผ่นดำด้านหลัง)
       names=[...new Set([...Object.keys(KI),...holes])],tmp=new THREE.Matrix4();
  CITYK.W=W0;CITYK.g=[];CITYK.CV=CV;CV.mesh={};CV.pool={};CV.anims=[];CV.ready=false;
  if(window.WD&&!WD.city)Object.defineProperty(WD,'city',{get:()=>({K:CITYK,D:CITYD})});   // ดีบัก: WD.city.K.CV / WD.city.D
  for(let c=0;c<CITY_N*CITY_N;c++){const g=new THREE.Group();g.userData.cx=tx((c%CITY_N+0.5)*CITY_B);g.userData.cz=tz((Math.floor(c/CITY_N)+0.5)*CITY_B);W0.add(g);CITYK.g.push(g);}
  Promise.all(names.map(n=>loadModel('city_'+n))).then(rs=>{
    if(world!==W0||CITYK.W!==W0)return;   // เปลี่ยนแผนที่ไปแล้ว
    rs.forEach((r,j)=>{if(!r)return;const n=names[j];r.scene.updateMatrixWorld(true);
      if(holes.includes(n)){let cap=0;for(const b of CV.b)if(b&&(b.sty.hole===n||b.sty.hole+'o'===n))cap+=b.P.length;if(!cap)return;
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
    const op=n.endsWith('o');   // รูโล่ง = แผ่นในชั้นที่เดินเข้าได้ • รูทึบ = ชั้นบนที่ข้างในยังทึบ
    CITYD.b.forEach((d,i)=>{const r=CV.b[i];if(!r||r.sty.hole!==(op?n.slice(0,-1):n)||d.cl||r.tw||!d.nb)return;for(let p=0;p<d.br.length;p++)if(d.br[p]&&op===!!(d.I&&d.L.P[p].f<d.I.nf)&&!cinOpenPanel(d,p)){for(const im of ims){_cT.multiplyMatrices(r.P[p].M,im.userData.om);im.setMatrixAt(k,_cT);}k++;}});
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
// ---------- ตึกไฮไลต์ล้มทั้งตึก (ขั้น 7) ----------
// event 'T' → ทั้งตึก (แผ่น/ขอบ/มุม/แกน) หมุนรอบขอบฐานด้านที่ล้ม ช้าก่อนแล้วเร็วขึ้น (ease-in) ใช้เวลา CDMG.tower.lean = เท่ากับเวลาที่โฮสต์ใช้ก่อนตกพื้น
// จบท่า = ซ่อนทั้งตึก + กองซากยาวตามแนวล้ม (cityTowerRubble) • เข้ากลางเกม/พลาด event = วางกองซากทันทีจากสถานะ 'X'
const _ctA=new THREE.Matrix4(),_ctB=new THREE.Matrix4(),_ctC=new THREE.Matrix4();
function cityTowerPose(CV,r,ang){
  const B=r.B,fi=r.tw.fi,px=fi===2?tx(B.x+B.w):fi===3?tx(B.x):0,pz=fi===0?tz(B.y+B.d):fi===1?tz(B.y):0;
  if(fi<2)_ctB.makeRotationX(fi===0?ang:-ang);else _ctB.makeRotationZ(fi===2?-ang:ang);
  _ctA.makeTranslation(px,0,pz).multiply(_ctB).multiply(_ctC.makeTranslation(-px,0,-pz));
  const M=m=>new THREE.Matrix4().multiplyMatrices(_ctA,m);
  for(const q of r.P)citySet(CV,q,M(q.M));for(const q of r.X)citySet(CV,q,M(q.M));
  CV.core.setMatrixAt(r.core,M(CV.cores[r.core]));CV.core.instanceMatrix.needsUpdate=true;
}
function cityTowerAnim(CV,dt){
  for(const r of CV.b){if(!r||!r.tw)continue;const T=r.tw,L=CDMG.tower.lean;T.t+=dt;const k=Math.min(1,T.t/L);
    cityTowerPose(CV,r,Math.PI/2*0.97*Math.pow(k,2.6));
    if(Math.random()<0.6){const B=r.B,u=Math.random();smoke(B.x+u*B.w,B.y+(Math.random()<0.5?0:B.d),0.5,1,'#8a8070',2.2,10,60);}   // ฝุ่นร่วงจากฐานระหว่างเอียง
    if(k>=1){r.tw=null;cityShowBld(CV,r,null);if(r.cl&&!r.rub){const d=CITYD.b[r.B.i];r.rub=cityTowerRubble(r,d.fd!=null?d.fd:T.fi);}cityPools(CV,[r.sty.hole,r.sty.hole+'o']);}}
}
// กองซากตึกล้ม: ฐานตึก + แนวยาวตามทิศล้ม (สูง CDMG.tower.mound) — ก้อนกระจก/โครงเหล็ก/แผ่นพื้นหักเอียง
function cityTowerRubble(r,fi){
  const B=r.B,S=cityTowerStrip(B,fi),T=CDMG.tower,g=new THREE.Group(),R=mulberry(B.i*17+3),m1=sMat({color:r.sty.col,roughness:0.6,metalness:0.3}),m2=sMat({color:'#4a4640',roughness:1}),m3=sMat({color:'#6a6e76',roughness:0.7,metalness:0.4});
  const add=(x0,y0,x1,y1,h)=>{const w=(x1-x0)*S3,d=(y1-y0)*S3,cx=tx((x0+x1)/2),cz=tz((y0+y1)/2);
    const base=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),m2);base.scale.set(w+1,h,d+1);base.position.set(cx,h/2-0.1,cz);g.add(base);
    const n=Math.min(90,Math.round(w*d/10));
    for(let k=0;k<n;k++){const m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),[m1,m2,m3][k%3]);const s2=0.6+R()*2.6;m.scale.set(s2,0.3+R()*1.1,s2*(0.4+R()));
      m.position.set(cx+(R()-0.5)*w,h+0.05,cz+(R()-0.5)*d);m.rotation.set((R()-0.5)*0.9,R()*3,(R()-0.5)*0.9);g.add(m);}
    for(let k=0;k<Math.round(n/6);k++){const m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),m3);m.scale.set(5+R()*6,0.35,3+R()*3);   // แผ่นพื้นหักเอียง
      m.position.set(cx+(R()-0.5)*w*0.8,h*0.8,cz+(R()-0.5)*d*0.8);m.rotation.set((R()-0.5)*0.7,R()*3,(R()-0.5)*0.7);g.add(m);}};
  add(B.x,B.y,B.x+B.w,B.y+B.d,T.mound*0.8);add(S.x1,S.y1,S.x2,S.y2,T.mound);
  shadowAll(g);world.add(g);return g;
}
// ทุกเฟรม: เทียบสถานะ (CITYD จากโฮสต์/snapshot) กับภาพ แล้วเปลี่ยนเฉพาะที่ต่าง
// กำแพงล่องหนของพื้นที่เล่น (AREA) ให้เห็นเป็นม่านเรืองแสงบาง ๆ — สร้างใหม่เมื่อโหมด/แผนที่เปลี่ยน
const CAREA={k:'',g:null};
function cityAreaSync(){
  const k=MAPID==='city'&&AREA?JSON.stringify(AREA):'';if(k===CAREA.k)return;CAREA.k=k;
  if(CAREA.g){scene.remove(CAREA.g);disposeTree(CAREA.g);CAREA.g=null;}if(!k)return;
  const A=AREA,g=new THREE.Group(),H=6,m=new THREE.MeshBasicMaterial({color:'#7fd0ff',transparent:true,opacity:0.16,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}),ln=new THREE.MeshBasicMaterial({color:hdr('#9fe0ff',1.6)});
  if(A.r){const r=A.r*S3,c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,H,96,1,true),m);c.position.set(tx(A.cx),H/2,tz(A.cy));g.add(c);
    const t=new THREE.Mesh(new THREE.TorusGeometry(r,0.08,4,96),ln);t.rotation.x=-Math.PI/2;t.position.set(tx(A.cx),0.2,tz(A.cy));g.add(t);}
  else{const x1=tx(A.x1),x2=tx(A.x2),z1=tz(A.y1),z2=tz(A.y2);
    for(const [cx,cz,w,ry] of [[(x1+x2)/2,z1,x2-x1,0],[(x1+x2)/2,z2,x2-x1,0],[x1,(z1+z2)/2,z2-z1,Math.PI/2],[x2,(z1+z2)/2,z2-z1,Math.PI/2]]){
      const p=new THREE.Mesh(new THREE.PlaneGeometry(w,H),m);p.position.set(cx,H/2,cz);p.rotation.y=ry;g.add(p);
      const l=new THREE.Mesh(new THREE.BoxGeometry(w,0.08,0.08),ln);l.position.set(cx,0.2,cz);l.rotation.y=ry;g.add(l);}}
  scene.add(g);CAREA.g=g;
}
function cityViewSync(dt){
  cityAreaSync();
  const CV=CITYK.CV;if(!CV||!CV.ready||CITYK.W!==world||!cityOn())return;
  const pd=new Set();
  CITYD.b.forEach((d,i)=>{const r=CV.b[i];if(!r||r.v===d.v)return;const live=r.v!==-1;r.v=d.v;pd.add(r.sty.hole);pd.add(r.sty.hole+'o');
    if(d.cl&&d.fd!=null){if(r.cl)return;r.cl=1;if(!r.tw){cityShowBld(CV,r,null);r.rub=cityTowerRubble(r,d.fd);}return;}   // ตึกไฮไลต์ล้ม: ท่าล้มจบแล้วค่อยวางกองซาก (cityTowerAnim)
    if(d.cl){if(r.cl)return;r.cl=1;cityHideIn(CV,r);if(live)CV.anims.push({r,t:0});else{cityShowBld(CV,r,null);r.rub=cityRubble(r);}return;}
    if(r.cl){r.cl=0;if(r.rub){world.remove(r.rub);disposeTree(r.rub);r.rub=null;}CV.anims=CV.anims.filter(a=>a.r!==r);cityShowBld(CV,r,0);}
    for(let p=0;p<r.P.length;p++)citySet(CV,r.P[p],d.br[p]||(d.I&&d.I.door.has(p))?_cZ:r.P[p].M);
    if(r.XP){r.xg=r.xg||[];r.XP.forEach((adj,j)=>{const g=adj.some(p=>d.br[p]);if(g===!!r.xg[j])return;r.xg[j]=g;citySet(CV,r.X[j],g?_cZ:r.X[j].M);   // โครงนอก (เสามุม/ขอบดาดฟ้า) หักตามแผ่นข้าง ๆ
      if(g&&live){const v=r.X[j].M.elements;cityDebris(v[12]/S3+MW/2,v[14]/S3+MH/2,v[13]+1.5,r.sty.col,d.B.x+d.B.w/2,d.B.y+d.B.d/2,3,true);}});}
    if(r.lin){for(const [p,ix] of r.lin)CV.lin.setMatrixAt(ix,d.br[p]?_cZ:CV.linM[ix]);CV.lin.instanceMatrix.needsUpdate=true;}
    if(r.fr&&d.I){const g=d.br[[...d.I.door][0]];for(const ix of r.fr)CV.frIm.setMatrixAt(ix,g?_cZ:CV.frIm.userData.M[ix]);CV.frIm.instanceMatrix.needsUpdate=true;}   // วงกบประตูหายเมื่อแผ่นประตูแตก
    if(r.iw)r.iw.forEach((ids,j)=>{const W=d.I.iw[j],sj=d.I.secAt.get((W.f*4+W.fi)*1000+W.i),dirty=sj!==undefined&&d.sb[sj];   // ผนังชั้นใน • ขอบพื้นหน้าผนังพัง = คอนกรีตมอ ๆ
      for(const ix of ids){CV.iwIm.setMatrixAt(ix,d.ib[j]?_cZ:CV.iwIm.userData.M[ix]);CV.iwIm.setColorAt(ix,_cC.set(dirty?'#8a8378':'#ffffff'));}CV.iwIm.instanceMatrix.needsUpdate=true;if(CV.iwIm.instanceColor)CV.iwIm.instanceColor.needsUpdate=true;});
    if(r.rp)r.rp.forEach((ix,j)=>{if(ix===undefined)return;CV.rpIm.setMatrixAt(ix,d.rb[j]?_cZ:CV.rpIm.userData.M[ix]);CV.rpIm.instanceMatrix.needsUpdate=true;});   // ทางลาด
    if(r.sec)r.sec.forEach((L2,j)=>{if(!L2)return;for(const [w,ix] of L2){const im=CV.secIm[w];im.setMatrixAt(ix,d.sb[j]?_cZ:im.userData.M[ix]);im.instanceMatrix.needsUpdate=true;}});   // ขอบพื้น/หลังคาที่พัง (ตึก 2–4 ชั้น)
    cityMoundView(r,d);});
  if(pd.size)cityPools(CV,pd);
  // ตึกกำลังถล่ม: ทรุดลงทั้งหลัง (เร็วขึ้นเรื่อย ๆ) + ฝุ่นรอบฐาน → จบ = กองซาก
  for(const a of CV.anims){a.t+=dt;const k=Math.min(1,a.t/2.2),B=a.r.B;
    cityShowBld(CV,a.r,-(k*k)*(B.h+2));
    if(Math.random()<0.8){const s=Math.random()*4|0,u=Math.random();const x=s<2?B.x+u*B.w:s===2?B.x:B.x+B.w,y=s<2?(s?B.y+B.d:B.y):B.y+u*B.d;smoke(x,y,0.5,2,'#8a8070',2.4,12,90);}
    if(k>=1){cityShowBld(CV,a.r,null);a.r.rub=cityRubble(a.r);a.done=1;smoke(B.x+B.w/2,B.y+B.d/2,2,18,'#7a7268',3,16,200);}}
  if(CV.anims.length)CV.anims=CV.anims.filter(a=>!a.done);
  cityTowerAnim(CV,dt);
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
  for(let k=0;k<n;k++){const t=k%6,m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),t<3?mt:t<5?mc:mr);const s=big?0.6+Math.random()*1.0:0.45+Math.random()*0.9;if(t===5)m.scale.set(0.06,0.06,1+Math.random()*1.5);else if(t<2)m.scale.set(s*1.6,s*0.3,s*1.2);else m.scale.set(s,s*0.6,s*0.8);   // t<2 = แผ่นผนังชิ้นใหญ่ (ผู้ใช้ 2026-10-28)
    m.castShadow=true;m.position.set(tx(x)+rnd(-1.5,1.5),h+rnd(-1,1),tz(y)+rnd(-1.5,1.5));m.rotation.set(Math.random()*6,Math.random()*6,0);scene.add(m);
    let dx=x-ox,dy=y-oy;const dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;const sp=(big?6:3.5)*(0.6+Math.random()*0.8);
    DEBRIS.push({m,vx:dx*sp+rnd(-1.5,1.5),vz:dy*sp+rnd(-1.5,1.5),vy:1+Math.random()*4,rx:rnd(-8,8),rz:rnd(-8,8),life:3+Math.random()*1.5,s0:m.scale.clone()});}
  bfScatter(x,y,big?260:70,big?40:12,[mt,mc],big?1.3:0.8);bfScatter(x,y,big?300:80,big?30:10,'rock',0.7);
  debrisCap();
}
function cityFX(ev,H,near){
  const CV=CITYK.CV;
  if(ev.k==='cb'&&(ev.e==='T'||ev.e==='I')){const r=CV&&CV.b[ev.i],dd=Math.hypot(tx(ev.x)-cam.position.x,tz(ev.y)-cam.position.z);
    if(ev.e==='T'){if(r&&CV.ready&&!r.cl){r.tw={fi:ev.fi,t:0};cityPools(CV,[r.sty.hole,r.sty.hole+'o']);if(r.hl)for(const l of r.hl)l.visible=false;}
      if(dd<260){snd('break',{x:ev.x,y:ev.y,vol:1});snd('rubble',{x:ev.x,y:ev.y,vol:1});shake(dd<120?5:2);}return;}
    // ตกพื้น: ฝุ่นใหญ่ตลอดแนวล้ม (VFX Studio city/tower_fall) + รอย/ความพังของบรรยากาศ (bfCollapse) + จอสั่น + เสียง
    if(r){const S=cityTowerStrip(r.B,ev.fi),hz=ev.fi<2,len=hz?S.y2-S.y1:S.x2-S.x1,wid=hz?S.x2-S.x1:S.y2-S.y1,n=Math.max(2,Math.round(len/(wid*0.9)));
      for(let k=0;k<n;k++){const u=(k+0.5)/n,x=hz?(S.x1+S.x2)/2:S.x1+u*len,y=hz?S.y1+u*len:(S.y1+S.y2)/2;
        fxPlay('city/tower_fall',{x,y,h:0,s:clamp(wid/500,1,2.2)});if(k%2===0)bfCollapse(x,y,wid,wid,false);}}
    if(dd<320){snd('boom',{x:ev.x,y:ev.y,vol:1});snd('rubble',{x:ev.x,y:ev.y,vol:1});shake(dd<160?16:8);}
    return;}
  if(ev.k==='cb'){const r=CV&&CV.b[ev.i],col=r?r.sty.col:'#8a8070',el=ev.el||'none',fire=el.includes('fire');
    if(ev.e==='h'){burst(ev.x,ev.y,col,8,90,0.45,2.2,{h:ev.h,vh:[0.5,3],g:6});if(near)snd('thud',{x:ev.x,y:ev.y,vol:0.5});}
    else if(ev.e==='b'){cityDebris(ev.x,ev.y,ev.h,col,ev.ox||ev.x,ev.oy||ev.y,el.includes('blast')?10:6,false);
      smoke(ev.x,ev.y,ev.h,10,fire?'#2a2522':'#7a6a58',1.8,9,120);burst(ev.x,ev.y,col,26,200,0.8,3,{h:ev.h,vh:[1,6],g:9});
      if(r&&r.sty.hole==='cg_hole')burst(ev.x,ev.y,'#cfe8ff',30,240,0.9,1.6,{h:ev.h,vh:[0,5],g:10});   // กระจกแตก
      if(near){snd('break',ev);shake(3);}}
    else if(ev.e==='w'||ev.e==='r'){cityDebris(ev.x,ev.y,ev.h,ev.e==='w'?'#cfc6b4':'#8a6646',ev.x,ev.y,6,true);smoke(ev.x,ev.y,ev.h,6,'#8a8070',1.6,9,80);if(near){snd('break',ev);shake(2);}}   // ผนังชั้นใน / ทางลาดพัง
    else if(ev.e==='s'){cityDebris(ev.x,ev.y,ev.h,'#8c857a',ev.x,ev.y,7,true);smoke(ev.x,ev.y,ev.h,8,'#8a8070',1.8,10,90);burst(ev.x,ev.y,'#9a9080',22,180,0.8,3,{h:ev.h,vh:[-2,3],g:9});if(near){snd('break',ev);shake(3);}}   // ขอบพื้น/หลังคาพัง
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
