// =====================================================================
//  ผ้าคลุมจริง (cloth sim) — เฉพาะตัวละครของเราเอง • ภาพบนเครื่องตัวเองล้วน ไม่แตะ sim / hitbox / snapshot / protocol
//  แผงเสื้อคลุมของโมเดลไฟล์ char_student = ตาราง 7 แถว × 29 คอลัมน์ (ด้านนอก tint_cloak + ซับใน tint_house,
//  ดู assets/src/student_build.py CL/GAP) → ตัดออกจากโมเดลของเรา แล้วจำลองเป็นจุดต่อกันด้วยแท่ง (verlet แบบ position-based)
//  • แถวบนติดตัว (ตามตำแหน่งจริงของโมเดลที่ขยับตามกระดูก = ตามท่าเดิน/คาถา/ragdoll) • ชายผ้าห้อยอิสระ
//  • ชนลำตัว / ขา / ต้นแขน / พื้น + ของในโลก (ลัง/หิน/ต้นไม้/บ้าน/กำแพงสายดิน/กำแพงน้ำแข็ง) → ตอน ragdoll ล้ม ผ้ากองลงพื้นตามตัว
//  • คนอื่นยังใช้แอนิเมชันกระดูกผ้าเดิม (ประหยัดเครื่อง)
//  เรียกจาก render loop หลัง syncPlayers (js/37) • ตัวเลขข้างล่างเป็นค่าภาพล้วน ปรับได้ตามชอบ
// =====================================================================
const CLOTH={
  ON:true,
  G:-16,          // แรงโน้มถ่วงผ้า (หน่วย/วิ²) — หนักขึ้น = ห้อยมากขึ้นตอนวิ่ง
  DAMP:0.992,     // หน่วงความเร็วต่อขั้น = แรงต้านอากาศ (น้อย = ผ้าปลิวแนวนอนตอนวิ่ง)
  IT:6,           // รอบแก้แท่งต่อขั้น (มาก = ผ้าตึงขึ้น)
  STEP:1/90,      // ขั้นจำลอง (วิ)
  SUB:2,          // แบ่งแถวเพิ่มระหว่างแถวของโมเดล (ผ้าโค้งเนียนขึ้น)
  TORSO:0.2,LEG:0.11,ARM:0.08,   // รัศมีชนลำตัว / ขา / ต้นแขน
  FLUT:0.9,       // ลมพลิ้วเบา ๆ ที่ชายผ้า
  VMAX:30,        // ความเร็วผ้าเทียบกับตัวสูงสุด (หน่วย/วิ) — กันแค่กรณีพุ่งผิดปกติ
  SNAP:3,         // ตัวกระโดดไกลกว่านี้ในเฟรมเดียว (วาร์ป/เกิดใหม่) = รีเซ็ตผ้า
};
const CL_ROWS=[[0.3,1.6],[0.355,1.5],[0.4,1.3],[0.47,1.0],[0.58,0.7],[0.7,0.4],[0.8,0.1]],CL_NC=29,CL_GAP=0.95,CL_IN=0.014;
const _clV=new THREE.Vector3(),_clA=new THREE.Vector3(),_clB=new THREE.Vector3();
// ความแข็งที่ดึงกลับรูปเดิมของแต่ละแถว (ตามความสูงในโมเดล): ไหล่ติดแน่น → ชายผ้าอิสระ
function clPinK(y){return y>=1.59?1:y>=1.45?0.6:y>=1.25?0.2:y>=1.05?0.05:0;}
// ตำแหน่งผ้าในโมเดลตอนยืนตรง (bind) ของแถว r (ทศนิยมได้ = แถวแทรก) คอลัมน์ j
function clBind(rf,j){const r0=Math.min(CL_ROWS.length-2,Math.floor(rf)),k=rf-r0,a=CL_ROWS[r0],b=CL_ROWS[r0+1],rr=lerp(a[0],b[0],k),y=lerp(a[1],b[1],k),ph=-Math.PI+CL_GAP/2+(Math.PI*2-CL_GAP)*j/(CL_NC-1);   // มุม atan2(x,-z): ช่องเปิดอยู่ที่ ±π
  return [rr*Math.sin(ph),y,-rr*Math.cos(ph)];}
// เตรียมผ้า: หาจุดแผงผ้าในโมเดล (ตามรูปทรงตอนสร้าง) → ตัดสามเหลี่ยมแผงออกจาก geometry ของเรา → สร้าง mesh ผ้าจำลอง
function clothSetup(o){
  const ms=[];o.fileModel.traverse(m=>{if(m.isSkinnedMesh&&(m.material.name==='tint_cloak'||m.material.name==='tint_house'))ms.push(m);});
  const outer=ms.find(m=>m.material.name==='tint_cloak'),inner=ms.find(m=>m.material.name==='tint_house');if(!outer||!inner)return null;
  const R0=CL_ROWS.length,ref=new Array(R0*CL_NC).fill(-1),grid=new Map();
  for(const m of [outer,inner]){const P=m.geometry.attributes.position,isIn=m===inner,mark=new Uint8Array(P.count);
    for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i);
      for(let r=0;r<R0;r++){const [rr,yy]=CL_ROWS[r];if(Math.abs(y-yy)>0.008||Math.abs(Math.hypot(x,z)-(rr-(isIn?CL_IN:0)))>0.008)continue;
        const ph=Math.atan2(x,-z),j=Math.round((ph+Math.PI-CL_GAP/2)/((Math.PI*2-CL_GAP)/(CL_NC-1)));if(j<0||j>=CL_NC)continue;
        mark[i]=1;if(!isIn&&ref[r*CL_NC+j]<0)ref[r*CL_NC+j]=i;break;}}
    grid.set(m,mark);}
  if(ref.some(i=>i<0))return null;   // โมเดลเปลี่ยนรูปผ้า → ใช้ผ้าเดิมต่อไป
  for(const m of [outer,inner]){const mark=grid.get(m),g=m.geometry.clone(),I=g.index.array,keep=[];
    for(let k=0;k<I.length;k+=3)if(!(mark[I[k]]&&mark[I[k+1]]&&mark[I[k+2]]))keep.push(I[k],I[k+1],I[k+2]);g.setIndex(keep);m.geometry=g;}
  // ตารางจำลอง: แถวของโมเดล + แถวแทรก (SUB) • แต่ละจุดจำว่าอยู่ระหว่างจุดโมเดลไหน (ไว้หาตำแหน่งเป้าตามกระดูก)
  const NR=(R0-1)*CLOTH.SUB+1,N=NR*CL_NC,rf=[],pk=new Float32Array(N);
  for(let r=0;r<NR;r++){const f=r/CLOTH.SUB;rf.push(f);for(let j=0;j<CL_NC;j++)pk[r*CL_NC+j]=clPinK(clBind(f,j)[1]);}
  const E=[];const add=(a,b,k)=>{const A=clBind(rf[Math.floor(a/CL_NC)],a%CL_NC),B=clBind(rf[Math.floor(b/CL_NC)],b%CL_NC);E.push(a,b,Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2]),k);};
  for(let r=0;r<NR;r++)for(let j=0;j<CL_NC;j++){const a=r*CL_NC+j;
    if(j+1<CL_NC)add(a,a+1,1);if(r+1<NR)add(a,a+CL_NC,1);
    if(j+1<CL_NC&&r+1<NR){add(a,a+CL_NC+1,0.6);add(a+1,a+CL_NC,0.6);}
    if(j+2<CL_NC)add(a,a+2,0.35);if(r+2<NR)add(a,a+2*CL_NC,0.35);}
  // mesh ผ้า (โลก): ด้านนอกสีเสื้อคลุม + ซับในสีบ้าน (เลื่อนเข้าตามแนวตั้งฉากนิดหน่อย)
  const idx=[];for(let r=0;r<NR-1;r++)for(let j=0;j<CL_NC-1;j++){const a=r*CL_NC+j,b=a+1,c=a+CL_NC,d=c+1;idx.push(a,b,c,b,d,c);}
  const mk=(mat,flip)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3));g.setIndex(flip?idx.slice().reverse():idx);
    const m=new THREE.Mesh(g,mat);m.frustumCulled=false;m.castShadow=outer.castShadow;m.receiveShadow=outer.receiveShadow;scene.add(m);return m;};
  const mo=mk(outer.material,false),mi=mk(inner.material,true);
  const B=n=>o.fileModel.getObjectByName(n);
  const C={o,outer,ref,rf,NR,N,pk,E,mo,mi,P:new Float32Array(N*3),Q:new Float32Array(N*3),T:new Float32Array(N*3),Tm:new Float32Array(CL_ROWS.length*CL_NC*3),
    caps:[['hips','neck','TORSO'],['thigh_L','shin_L','LEG'],['shin_L','foot_L','LEG'],['thigh_R','shin_R','LEG'],['shin_R','foot_R','LEG'],['upper_arm_L','forearm_L','ARM'],['upper_arm_R','forearm_R','ARM']].map(([a,b,k])=>[B(a),B(b),k]).filter(c=>c[0]&&c[1]),
    init:false,flip:false,t:0,acc:0};
  o.g.userData.extra=(o.g.userData.extra||[]).concat([mo,mi]);   // disposeObj(o.g) ทิ้ง mesh ผ้าด้วย
  return C;}
// ตำแหน่งเป้าของทุกจุด (ตามโมเดลที่ขยับตามกระดูกตอนนี้) → C.T
function clTargets(C){const P=C.outer.geometry.attributes.position,M=C.Tm;
  for(let k=0;k<C.ref.length;k++){_clV.fromBufferAttribute(P,C.ref[k]);C.outer.applyBoneTransform(C.ref[k],_clV);C.outer.localToWorld(_clV);M[k*3]=_clV.x;M[k*3+1]=_clV.y;M[k*3+2]=_clV.z;}
  for(let r=0;r<C.NR;r++){const f=C.rf[r],r0=Math.min(CL_ROWS.length-2,Math.floor(f)),k=f-r0;
    for(let j=0;j<CL_NC;j++){const a=(r0*CL_NC+j)*3,b=((r0+1)*CL_NC+j)*3,i=(r*CL_NC+j)*3;for(let q=0;q<3;q++)C.T[i+q]=M[a+q]+(M[b+q]-M[a+q])*k;}}}
function clReset(C){C.P.set(C.T);C.Q.set(C.T);C.init=true;}
// ดันจุดออกจากแคปซูล (a→b รัศมี rad)
function clCapsule(P,Q,i,a,b,rad){const ax=a.x,ay=a.y,az=a.z,bx=b.x-ax,by=b.y-ay,bz=b.z-az,px=P[i]-ax,py=P[i+1]-ay,pz=P[i+2]-az,L=bx*bx+by*by+bz*bz||1;
  const t=clamp((px*bx+py*by+pz*bz)/L,0,1),dx=px-bx*t,dy=py-by*t,dz=pz-bz*t,d=Math.hypot(dx,dy,dz);
  if(d<rad&&d>1e-5){const k=(rad-d)/d;P[i]+=dx*k;P[i+1]+=dy*k;P[i+2]+=dz*k;Q[i]+=dx*k;Q[i+1]+=dy*k;Q[i+2]+=dz*k;}}   // เลื่อน Q ตามด้วย = ดันออกแต่ไม่เพิ่มความเร็ว (ขาแกว่งไม่ดีดผ้าปลิว)
// ของในโลกใกล้ตัว (รวบทีละเฟรม): วงกลม [x,y,r,สูง,abs] (px / ม.) • บ้านใกล้ ๆ • กำแพง/เสาสายดิน (เส้น) — ผ้าชนแล้วไม่ทะลุ (ผู้ใช้ 2026-10-21)
const _clO={x:0,y:0};
function clWorld(cx,cy){const R=140,c=[],b=[],s=[],near=q=>Math.abs(q.x-cx)<R+q.r&&Math.abs(q.y-cy)<R+q.r;
  if(PROPON)for(const q of PROPS)if(q.st!==1&&near(q))c.push([q.x,q.y,q.r,q.hgt,0]);
  for(const q of OBS)if(q.bi===undefined&&near(q))c.push(q.top!==undefined?[q.x,q.y,q.r,q.top,1]:[q.x,q.y,q.r,q.hgt,0]);
  for(const q of BLDG)if(bldNear(q,cx,cy,R))b.push(q);
  if(G&&G.walls)for(const q of G.walls)if(near(q))c.push([q.x,q.y,q.r,q.hgt,0]);
  if(G&&G.eso){for(const w of G.eso)if(!w.dead&&w.k!=='mound'&&w.k!=='dom')s.push([w.x1,w.y1,w.x2,w.y2,w.r,w.hgt]);}
  else for(const o of EV.es.values())if(o.k===0||o.k===1)s.push([o.x1,o.y1,o.x2,o.y2,o.k?35:18,o.k?9:6]);
  return c.length||b.length||s.length?{c,b,s}:null;}
// ดันจุดผ้าออกจากของในโลก (แนวนอน) • เลื่อน Q ตาม = ไม่เด้ง
function clWorldHit(P,Q,i,W){const sx=P[i]/S3+MW/2,sy=P[i+2]/S3+MH/2,zh=P[i+1]-GY(sx,sy),r=4;let x=sx,y=sy;
  for(const c of W.c){if(zh>=(c[4]?c[3]-(TERR?terrT(x,y):0):c[3]))continue;const dx=x-c[0],dy=y-c[1],d=Math.hypot(dx,dy),m=c[2]+r;if(d<m&&d>0.001){x=c[0]+dx/d*m;y=c[1]+dy/d*m;}}
  for(const q of W.s){if(zh>=q[5])continue;const e=eSegD(x,y,{x1:q[0],y1:q[1],x2:q[2],y2:q[3]}),m=q[4]+r;if(e.d<m&&e.d>0.001){x=e.qx+(x-e.qx)/e.d*m;y=e.qy+(y-e.qy)/e.d*m;}}
  if(W.b.length){_clO.x=x;_clO.y=y;for(const b of W.b)collideBld(b,_clO,r,Math.max(0,zh));x=_clO.x;y=_clO.y;}
  if(x!==sx||y!==sy){const ax=(x-sx)*S3,az=(y-sy)*S3;P[i]+=ax;P[i+2]+=az;Q[i]+=ax;Q[i+2]+=az;}}
function clStep(C,h,gy,caps,bv,W){const P=C.P,Q=C.Q,T=C.T,pk=C.pk,E=C.E,N=C.N,g=CLOTH.G*h*h,D=CLOTH.DAMP;C.t+=h;
  for(let n=0;n<N;n++){const i=n*3,k=pk[n];
    if(k>=1){P[i]=Q[i]=T[i];P[i+1]=Q[i+1]=T[i+1];P[i+2]=Q[i+2]=T[i+2];continue;}
    const fl=(1-k)*CLOTH.FLUT*h*h*Math.sin(C.t*7+n*0.37);
    let vx=(P[i]-Q[i])*D,vy=(P[i+1]-Q[i+1])*D,vz=(P[i+2]-Q[i+2])*D;const bx=bv.x*h,by=bv.y*h,bz=bv.z*h,rx=vx-bx,ry=vy-by,rz=vz-bz,vm=Math.hypot(rx,ry,rz),mx=CLOTH.VMAX*h;if(vm>mx){const s=mx/vm;vx=bx+rx*s;vy=by+ry*s;vz=bz+rz*s;}   // จำกัดความเร็วผ้าเทียบกับตัว (วิ่ง/พุ่งเร็วแค่ไหนผ้าก็ตามทัน)
    const wk=(1-k)*h*h;Q[i]=P[i];Q[i+1]=P[i+1];Q[i+2]=P[i+2];P[i]+=vx+fl+CLW.x*wk;P[i+1]+=vy+g;P[i+2]+=vz+fl+CLW.z*wk;   // CLW = ลม ณ ตัวเรา (js/50)
    if(k>0)for(let q=0;q<3;q++)P[i+q]+=(T[i+q]-P[i+q])*k;}
  for(let it=0;it<CLOTH.IT;it++){
    for(let e=0;e<E.length;e+=4){const a=E[e]*3,b=E[e+1]*3,wa=pk[E[e]]>=1?0:1,wb=pk[E[e+1]]>=1?0:1;if(!(wa+wb))continue;
      const dx=P[b]-P[a],dy=P[b+1]-P[a+1],dz=P[b+2]-P[a+2],d=Math.hypot(dx,dy,dz)||1e-6,s=(d-E[e+2])/d*E[e+3]/(wa+wb);
      P[a]+=dx*s*wa;P[a+1]+=dy*s*wa;P[a+2]+=dz*s*wa;P[b]-=dx*s*wb;P[b+1]-=dy*s*wb;P[b+2]-=dz*s*wb;}
    for(let n=0;n<N;n++){if(pk[n]>=1)continue;const i=n*3;for(const c of caps)clCapsule(P,Q,i,c[0],c[1],c[2]);if(P[i+1]<gy){P[i+1]=gy;Q[i]=lerp(Q[i],P[i],0.6);Q[i+2]=lerp(Q[i+2],P[i+2],0.6);}if(W&&it===CLOTH.IT-1)clWorldHit(P,Q,i,W);}}}
function clDraw(C){const po=C.mo.geometry.attributes.position,pi=C.mi.geometry.attributes.position;po.array.set(C.P);po.needsUpdate=true;C.mo.geometry.computeVertexNormals();
  // ครั้งแรก: ให้ด้านนอกหันออกจากตัว (กลับลำดับสามเหลี่ยมถ้ากลับด้าน)
  if(!C.flip){C.flip=true;const nm=C.mo.geometry.attributes.normal,n=Math.floor(C.N/2)+3*CL_NC,i=n*3;_clA.set(C.P[i],0,C.P[i+2]);C.o.g.getWorldPosition(_clB);_clA.x-=_clB.x;_clA.z-=_clB.z;
    if(nm.getX(n)*_clA.x+nm.getZ(n)*_clA.z<0){const gi=C.mo.geometry.index.array.slice().reverse(),go=C.mi.geometry.index.array.slice().reverse();C.mo.geometry.setIndex(Array.from(gi));C.mi.geometry.setIndex(Array.from(go));C.mo.geometry.computeVertexNormals();}}
  const nm=C.mo.geometry.attributes.normal,A=pi.array;for(let i=0;i<C.N*3;i+=3){A[i]=C.P[i]-nm.array[i]*CL_IN;A[i+1]=C.P[i+1]-nm.array[i+1]*CL_IN;A[i+2]=C.P[i+2]-nm.array[i+2]*CL_IN;}
  pi.needsUpdate=true;C.mi.geometry.computeVertexNormals();}
// ทุกเฟรม (หลัง syncPlayers): ผ้าของเราเอง
function clothTick(dt){if(!CLOTH.ON||typeof NET==='undefined')return;const o=PM3.get(NET.myId);if(!o||!o.fileModel)return;
  if(o.cloth===undefined)o.cloth=clothSetup(o);const C=o.cloth;if(!C)return;
  let vis=true;for(let n=C.outer;n;n=n.parent)if(!n.visible){vis=false;break;}
  C.mo.visible=C.mi.visible=vis&&!!o.g.parent;if(!C.mo.visible){C.init=false;return;}
  o.g.updateMatrixWorld(true);clTargets(C);
  if(!C.init)clReset(C);
  else{const i=0;if(Math.hypot(C.T[i]-C.P[i],C.T[i+1]-C.P[i+1],C.T[i+2]-C.P[i+2])>CLOTH.SNAP)clReset(C);}
  const caps=C.caps.map(([a,b,k])=>[a.getWorldPosition(new THREE.Vector3()),b.getWorldPosition(new THREE.Vector3()),CLOTH[k]]);
  _clV.setFromMatrixPosition(C.o.g.matrixWorld);if(!C.lp)C.lp=_clV.clone();const dl=_clV.clone().sub(C.lp);C.lp.copy(_clV);
  // ตัวพุ่งเร็วมาก (ลอยขึ้นฟ้าอัลติ / พุ่ง / ตกเร็ว) > 0.5 ม. ต่อเฟรม = ยกผ้าทั้งผืนไปด้วยส่วนที่เกิน (ผ้าไม่ยืดค้าง/พันกัน)
  const dm=dl.length();if(dm>0.5){const k=(dm-0.5)/dm;for(let i=0;i<C.N*3;i+=3){C.P[i]+=dl.x*k;C.P[i+1]+=dl.y*k;C.P[i+2]+=dl.z*k;C.Q[i]+=dl.x*k;C.Q[i+1]+=dl.y*k;C.Q[i+2]+=dl.z*k;}dl.multiplyScalar(0.5/dm);}
  const bv=dl.divideScalar(Math.max(dt,1e-3));const psx=_clV.x/S3+MW/2,psy=_clV.z/S3+MH/2,gy=GY(psx,psy)+0.02,W=clWorld(psx,psy);
  C.acc=Math.min(C.acc+Math.min(dt,0.1),CLOTH.STEP*4);while(C.acc>=CLOTH.STEP){clStep(C,CLOTH.STEP,gy,caps,bv,W);C.acc-=CLOTH.STEP;}
  clDraw(C);}
