// ---------- prop ฝั่งแสดงผล ----------
const PROPV={g:null,map:null,list:[]};
// โมเดลสำรองจากโค้ด (ใช้เมื่อยังไม่มี/โหลดไฟล์ไม่ได้) — st: 0 ปกติ, 1 พัง, 2 ใช้แล้ว
function propFallback(k,st){
  const D=PROPDEF[k],g=new THREE.Group(),s=D.r*S3;
  const M=(c,r,ex)=>sMat(Object.assign({color:c,roughness:r===undefined?0.85:r},ex||{}));
  const add=(par,geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);par.add(m);return m;};
  if(k==='pcrate'){
    const w=s*1.45,wd=M(D.col,0.9),dk=M('#5a3e22',0.9);
    if(st!==1){add(g,sGeo(THREE.BoxGeometry,w,w,w),wd,0,w/2,0);for(const y of [0.06,w-0.06])add(g,sGeo(THREE.BoxGeometry,w+0.05,0.1,w+0.05),dk,0,y,0);}
    else for(let i=0;i<6;i++){const m=add(g,sGeo(THREE.BoxGeometry,w*0.9,0.08,0.22),i%2?dk:wd,Math.cos(i*1.3)*w*0.55,0.05+i*0.03,Math.sin(i*1.7)*w*0.55);m.rotation.y=i*1.1;}
  }else if(k==='pbarrel'){
    const wd=M(D.col,0.85),ir=M('#3a3a40',0.5,{metalness:0.6});
    if(st!==1){add(g,sGeo(THREE.CylinderGeometry,s*0.9,s*0.9,D.hgt,14),wd,0,D.hgt/2,0);for(const y of [0.25,D.hgt-0.25])add(g,sGeo(THREE.CylinderGeometry,s*0.94,s*0.94,0.08,14),ir,0,y,0);}
    else{add(g,sGeo(THREE.CylinderGeometry,s*0.9,s*0.9,0.25,14),wd,0,0.125,0);for(let i=0;i<5;i++){const m=add(g,sGeo(THREE.BoxGeometry,0.18,0.06,D.hgt*0.8),wd,Math.cos(i*1.26)*s*1.4,0.04,Math.sin(i*1.26)*s*1.4);m.rotation.y=-i*1.26;}}
  }else if(k==='ptree'||k==='ppine'){
    const bark=M('#5a3a1c',0.9),leaf=M(D.col,0.85),pine=k==='ppine';
    if(st!==1){add(g,sGeo(THREE.CylinderGeometry,0.25,0.4,pine?2:3.4,8),bark,0,pine?1:1.7,0);
      if(pine)for(const [y,r,h] of [[1.6,1.9,2.6],[3,1.5,2.3],[4.3,1.05,2]])add(g,sGeo(THREE.ConeGeometry,r,h,8),leaf,0,y+h/2,0);
      else{add(g,sGeo(THREE.SphereGeometry,1.8,10,8),leaf,0,4.5,0);add(g,sGeo(THREE.SphereGeometry,1.2,10,8),leaf,1,4,0.4);}}
    else{add(g,sGeo(THREE.CylinderGeometry,0.32,0.42,0.7,8),bark,0,0.35,0);const t=add(g,sGeo(THREE.CylinderGeometry,0.28,0.36,2.8,8),bark,2,0.36,0);t.rotation.z=Math.PI/2;add(g,sGeo(THREE.SphereGeometry,1.3,8,6),leaf,4.2,1,0);}
  }else if(k==='pchest'){
    const w=s*1.6,d=s*1.1,wd=M('#6a4422',0.8),gold=M(D.col,0.35,{metalness:0.8});
    add(g,sGeo(THREE.BoxGeometry,w,0.55,d),wd,0,0.275,0);
    add(g,sGeo(THREE.BoxGeometry,w+0.05,0.08,d+0.05),gold,0,0.55,0);
    const lid=new THREE.Group();lid.position.set(0,0.55,-d/2);g.add(lid);
    add(lid,sGeo(THREE.BoxGeometry,w,0.28,d),wd,0,0.14,d/2);add(lid,sGeo(THREE.BoxGeometry,0.16,0.16,0.06),gold,0,0.08,d+0.01);
    if(st===2){lid.rotation.x=-1.9;const gl2=new THREE.Sprite(glowMat('#ffd86b',1.6));gl2.scale.setScalar(1.6);gl2.position.y=0.8;g.add(gl2);}
  }
  shadowAll(g);return g;
}
// แมพใหญ่: ของที่ไกลกว่าหมอก (มองไม่เห็นอยู่แล้ว) ไม่ต้องวาด — x,y,r = sim px • เช็กเป็นวงกลมรอบกล้องบนพื้น
function farCull(x,y,r){const dx=tx(x)-cam.position.x,dz=tz(y)-cam.position.z,R=(scene.fog?scene.fog.far:170)+10+r*S3;return dx*dx+dz*dz>R*R;}
function syncProps(v){
  if(!v||!v.PB){if(PROPV.g)PROPV.g.visible=false;return;}
  if(!PROPV.g||PROPV.g.parent!==world||PROPV.map!==builtMap){
    PROPV.g=new THREE.Group();world.add(PROPV.g);PROPV.map=builtMap;PROPV.list=[];
    prefetchModels(Object.values(PROPDEF).flatMap(D=>[D.model,D.model+'_broken',D.model+'_used']));
    for(const o of PROPS){const g=new THREE.Group();g.position.set(tx(o.x),GY(o.x,o.y),tz(o.y));g.rotation.y=o.a;PROPV.g.add(g);PROPV.list.push({g,st:-1,o});}
  }
  PROPV.g.visible=true;
  for(const q of PROPV.list){
    if(farCull(q.o.x,q.o.y,60)){q.g.visible=false;continue;}q.g.visible=true;   // ไกลเกินหมอก: ซ่อน + ยังไม่ต้องสร้างโมเดล
    const st=+(v.PB[q.o.i]||0);if(st===q.st)continue;q.st=st;
    for(const c of [...q.g.children]){q.g.remove(c);disposeTree(c);}
    const D=PROPDEF[q.o.k];
    q.g.add(modelOr(D.model+(st===1?'_broken':st===2?'_used':''),()=>propFallback(q.o.k,st)));
    gl.shadowMap.needsUpdate=true;
  }
}
// ---------- บ้านพังเป็นชิ้น ฝั่งแสดงผล ----------
// ทุกหลังสร้างจากสถานะชิ้น (BLDG[].pc[].fl) → สร้างใหม่เมื่อชิ้นพัง/ไหม้ดำ แล้วรวม mesh ต่อหลัง (batchStatic) • เกาะน้ำแข็ง/ติดไฟ = เอฟเฟกต์ซ้อนทับ ไม่สร้างใหม่
// มีไฟล์ bld_house.glb = ใช้ชิ้นจากไฟล์ตามชื่อ (wall_front / wall_front_broken ...) ยืดตามขนาดบ้าน • ชิ้นไหนไม่มีในไฟล์ = ใช้ของจากโค้ด
const BLDV={g:null,map:null,list:[]},CHARM=new Map(),DEBRIS=[];
const BLD_WALLC=['#cbb89a','#b9a7a0','#c9c2a8','#a9b4c4'];
let _bldIce=null,_halfRoof=null;
function charMat(m){
  let c=CHARM.get(m.uuid);if(c)return c;
  c=m.clone();if(c.color)c.color.multiplyScalar(0.18);if(c.emissive)c.emissive.set('#000000');c.userData.keep=true;CHARM.set(m.uuid,c);return c;
}
function bldIceMat(){if(!_bldIce){_bldIce=iceMat(0.42);_bldIce.depthWrite=false;_bldIce.userData.keep=true;}return _bldIce;}
// ครึ่งหลังคาทรงปิรามิด ฐาน 1×2 สูง 1 (side -1 = ซ้าย x<0, +1 = ขวา) → ยืดตามบ้านด้วย scale
function halfRoofGeo(side){
  _halfRoof=_halfRoof||{};if(_halfRoof[side])return _halfRoof[side];
  const s=side,A=[0,1,0],P=[[s,0,-1],[s,0,1],[0,0,1],[0,0,-1]];
  const tri=[[P[0],P[1],A],[P[1],P[2],A],[P[3],P[0],A],[P[2],P[3],A],[P[0],P[3],P[2]],[P[0],P[2],P[1]]];
  const pos=[];for(const t of tri){const q=s<0?t:[t[0],t[2],t[1]];for(const v of q)pos.push(...v);}
  const g=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();g.userData.keep=true;
  return _halfRoof[side]=g;
}
function bldMats(b){
  const wc=b.D.wallc||BLD_WALLC;
  return {wall:sMat({color:wc[Math.floor(b.o.s*4)%4],roughness:0.9}),beam:sMat({color:'#3a281a',roughness:0.9}),roof:sMat({color:b.D.roofc||'#4a3438',roughness:0.85}),
    cap:sMat({color:'#eef3fb',roughness:1}),door:sMat({color:'#5a3a22',roughness:0.9}),stone:sMat({color:'#9a9fb0',roughness:0.95}),win:bMat({color:hdr('#ffc36b',1.6)})};
}
// ชิ้นจากโค้ด (ใช้เมื่อไม่มีไฟล์) — หน่วย 3D, แกนของบ้าน: หน้า (ประตู) = +z
function bldFallback(b,j,br){
  const g=new THREE.Group(),M=bldMats(b),w=b.o.w*S3,d=b.o.d*S3,wh=b.D.wh,T=b.D.th*S3,R=mulberry(b.i*37+j*7+1);
  const box=(mat,sx,sy,sz,x,y,z,ry)=>{const m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);if(ry)m.rotation.y=ry;g.add(m);return m;};
  const pl=(mat,sx,sy,x,y,z,ry)=>{const m=new THREE.Mesh(sGeo(THREE.PlaneGeometry,1,1),mat);m.scale.set(sx,sy,1);m.position.set(x,y,z);m.rotation.y=ry||0;g.add(m);return m;};
  if(j<4){
    const fb=j<2,L=fb?w:d,sg=j===0||j===3?1:-1,cx=fb?0:sg*w/2,cz=fb?sg*d/2:0;
    // ของบนผนัง วางตามแกนยาวของผนัง (u) — หน้า/หลัง u = x, ซ้าย/ขวา u = z
    const at=(u,y)=>fb?[cx+u,y,cz]:[cx,y,cz+u];
    if(!br){
      box(M.wall,fb?L:T,wh,fb?T:L,cx,wh/2,cz);
      if(!fb)for(const e of [-1,1])box(M.beam,0.28,wh,0.28,cx,wh/2,e*d/2);
      if(fb){
        for(const sx of [-1,1]){const p=at(sx*w*0.27,2.5);pl(M.win,0.95,1.2,p[0],p[1],p[2]+sg*(T/2+0.03),sg>0?0:Math.PI);}
        if(j===0)pl(M.door,1.1,2.2,0,1.1,cz+T/2+0.03,0);
      }
    }else{
      // ซากผนัง: ตอผนังสูงไม่เท่ากัน + เศษกองข้างล่าง
      const n=4;for(let k=0;k<n;k++){const u=(k+0.5)/n*L-L/2,hh=0.35+R()*1.4,p=at(u,hh/2);box(M.wall,fb?L/n*0.95:T,hh,fb?T:L/n*0.95,p[0],p[1],p[2]);}
      if(!fb)for(const e of [-1,1]){const hh=0.6+R()*1.6;box(M.beam,0.28,hh,0.28,cx,hh/2,e*d/2);}
      for(let k=0;k<6;k++){const u=(R()-0.5)*L,o=(R()-0.5)*2.2,p=at(u,0.12);const m=box(k%3?M.wall:M.beam,0.4+R()*0.6,0.18+R()*0.2,0.3+R()*0.4,p[0]+(fb?0:o),0.1,p[2]+(fb?o:0),R()*3);m.rotation.z=(R()-0.5)*0.5;}
    }
  }else{
    const s=j===4?-1:1,hx=w*0.55,hz=d*0.55,rh=b.D.rh;
    if(!br){
      const r=new THREE.Mesh(halfRoofGeo(s),M.roof);r.scale.set(hx,rh,hz);r.position.y=wh;g.add(r);
      const c=new THREE.Mesh(halfRoofGeo(s),M.cap);c.scale.set(hx*0.9,rh,hz*0.9);c.position.y=wh+0.12;g.add(c);
      if(s>0){box(M.stone,0.9,2.8,0.9,w*0.25,wh+2.2,-d*0.12);box(M.cap,1.05,0.3,1.05,w*0.25,wh+3.7,-d*0.12);}
    }else{
      // หลังคาถล่ม: คานหักเอียง + กองเศษในบ้าน
      for(let k=0;k<3;k++){const m=box(M.beam,0.25,0.25,d*(0.5+R()*0.4),s*w*(0.12+R()*0.3),0.4+R()*0.8,(R()-0.5)*d*0.4);m.rotation.x=(R()-0.5)*0.9;m.rotation.z=(R()-0.5)*0.6;}
      for(let k=0;k<7;k++){const m=box(k%2?M.roof:M.cap,0.6+R()*0.9,0.15+R()*0.3,0.5+R()*0.8,s*w*(0.05+R()*0.4),0.12,(R()-0.5)*d*0.8,R()*3);m.rotation.z=(R()-0.5)*0.6;}
      if(s>0)box(M.stone,0.9,0.7+R()*0.6,0.9,w*0.25,0.5,-d*0.12);
    }
  }
  return g;
}
function bldFilePiece(b,name){
  const r=MODELS.ready.get(b.D.model);if(!r)return null;
  const src=r.scene.getObjectByName(name);if(!src)return null;
  r.scene.updateMatrixWorld(true);
  const c=src.clone(true);src.matrixWorld.decompose(c.position,c.quaternion,c.scale);
  const h=new THREE.Group();h.scale.set(b.o.w*S3/b.D.bw,1,b.o.d*S3/b.D.bd);h.add(c);return h;
}
// ชิ้นย่อยจากไฟล์ (<ส่วน>_c<เลข>) มีครบไหม — ไฟล์รุ่นเก่า (ไม่มีชิ้นย่อย) = ใช้ทั้งส่วนแบบเดิม
function bldHasChunks(b){const r=MODELS.ready.get(b?b.D.model:BLDDEF.house.model);return !!(r&&r.scene.getObjectByName('wall_front_c0'));}
// ส่วนจากโค้ด (ไม่มีไฟล์) แบบชิ้นย่อย: ผนัง = กล่องต่อชิ้น, หลังคา = ปิรามิดครึ่งซีกถ้ายังเหลือ ≥ ครึ่ง
function bldFallbackChunks(b,j,q){
  if(j>=4)return bldFallback(b,j,q.cb&&(q.cb.toString(2).split('1').length-1)*2>q.nc*q.nr);
  const g=new THREE.Group(),M=bldMats(b);
  for(let k=0;k<q.nc*q.nr;k++){if(!bldAlive(q,k))continue;const C=bldChunk(b,j,k),m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),M.wall);
    m.scale.set(C[2]*2*S3,C[5]-C[4],C[3]*2*S3);m.position.set(C[0]*S3,(C[4]+C[5])/2,C[1]*S3);g.add(m);}
  return g;
}
// เศษกองที่โคนผนังตรงชิ้นที่พัง (ติดกับบ้าน รวม mesh ไปด้วย)
function bldRubble(b,j,k,g,M){
  const C=bldChunk(b,j,k),R=mulberry(b.i*131+j*17+k*7+3),n=C[4]<0.1?3:1;
  for(let i=0;i<n;i++){const m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),i%2?M.beam:M.stone);
    m.scale.set(0.3+R()*0.5,0.15+R()*0.25,0.3+R()*0.45);m.position.set((C[0]+(R()*2-1)*C[2])*S3+(j===2?-1:j===3?1:0)*R()*0.8,0.1,(C[1]+(R()*2-1)*C[3])*S3+(j===0?1:j===1?-1:0)*R()*0.8);m.rotation.set(R()*0.6,R()*3,R()*0.6);g.add(m);}
}
// เนินกองซาก: ผิวเนินตามสูตรเดียวกับฝั่งโฮสต์ (bldMoundAt) + ผิวขรุขระนิดหน่อย + ไม้คาน/ก้อนหิน/ชิ้นผนัง/แผ่นหลังคาโผล่บนผิว
let _moundMat=null;
function bldMound(b,M,charred){
  const G3=new THREE.Group(),R=mulberry(b.i*977+5),A=(b.o.w/2+BLD_MOUND.pad)*S3,C=(b.o.d/2+BLD_MOUND.pad)*S3,H=BLD_MOUND.h;
  const hAt=r=>r>=1?-0.12:H*Math.min(1,1.6*(1-r*r));
  const NR=10,NA=32,pos=[],col=[],idx=[],cs=[new THREE.Color('#6e6458'),new THREE.Color('#7d7367'),new THREE.Color('#62584d'),new THREE.Color(M.wall.color).multiplyScalar(0.75)];
  pos.push(0,hAt(0),0);col.push(...cs[0].toArray());
  for(let i=1;i<=NR;i++)for(let k=0;k<NA;k++){const r=i/NR,a=k/NA*Math.PI*2,n=i<NR?(R()-0.5)*0.35+0.12*Math.sin(a*5+i):0,c=cs[Math.floor(R()*cs.length)].clone().multiplyScalar(charred?0.35:0.92+R()*0.12);
    pos.push(Math.cos(a)*A*r,hAt(r)+n,Math.sin(a)*C*r);col.push(c.r,c.g,c.b);}
  for(let k=0;k<NA;k++)idx.push(0,1+(k+1)%NA,1+k);
  for(let i=1;i<NR;i++)for(let k=0;k<NA;k++){const a=1+(i-1)*NA+k,b2=1+(i-1)*NA+(k+1)%NA,c=a+NA,d=b2+NA;idx.push(a,b2,c,b2,d,c);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));geo.setIndex(idx);geo.computeVertexNormals();
  if(!_moundMat)_moundMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95,flatShading:true});
  G3.add(new THREE.Mesh(geo,_moundMat));
  const mats=[M.beam,M.beam,M.stone,M.stone,M.wall,M.roof].map(m=>charred?charMat(m):m);
  for(let k=0;k<56;k++){const r=Math.sqrt(R())*0.9,a=R()*Math.PI*2,x=Math.cos(a)*A*r,z=Math.sin(a)*C*r,t=k%6,m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),mats[t]);
    let tilt=0.9;
    if(t<2){m.scale.set(0.22,0.22,1.6+R()*2.6);if(k%4===0)tilt=2.2;}            // คาน (บางอันเสียบเอียงขึ้นฟ้า)
    else if(t<4)m.scale.set(0.35+R()*0.6,0.25+R()*0.4,0.35+R()*0.6);              // ก้อนหิน
    else{m.scale.set(1+R()*1.4,0.18,0.7+R()*1.1);tilt=1.3;}                        // ชิ้นผนัง / แผ่นหลังคา
    m.position.set(x,hAt(r)-0.05+R()*0.15,z);m.rotation.set((R()-0.5)*tilt,R()*6.3,(R()-0.5)*tilt);G3.add(m);}
  return G3;
}
// ความสูงซากเมื่อส่วนนั้นพังหมด (คูณแกนตั้งของโมเดล _broken) — ซากไม่มีการชน เลยให้เตี้ยระดับเข่า
const BLD_RUBBLE_H=0.28;
function bldBuild(b,file){
  const g=new THREE.Group(),chunks=file&&bldHasChunks(b),M=bldMats(b),gone=bldGone(b);
  if(gone)g.add(bldMound(b,M,b.pc.some(q=>q.fl&2)));   // พังครบทั้งหลัง = เนินกองซาก (เดินปีนได้ — host groundH)
  for(let j=0;j<6&&!gone;j++){
    const q=b.pc[j],f=q.fl,br=f&1;let m;
    if(br){m=(file&&bldFilePiece(b,BLD_PIECES[j]+'_broken'))||bldFallback(b,j,true);m.scale.y*=BLD_RUBBLE_H;}   // ซากทั้งส่วน: กดให้เตี้ย (เดินทะลุได้ ไม่ควรสูงบังตัว)
    else if(!q.cb)m=(file&&bldFilePiece(b,BLD_PIECES[j]))||bldFallback(b,j,false);
    else if(chunks){m=new THREE.Group();for(let k=0;k<q.nc*q.nr;k++){if(bldAlive(q,k)){const c=bldFilePiece(b,BLD_PIECES[j]+'_c'+k);if(c)m.add(c);}else if(j<4)bldRubble(b,j,k,m,M);}}
    else m=bldFallbackChunks(b,j,q);
    if(f&2)m.traverse(x=>{if(x.isMesh)x.material=Array.isArray(x.material)?x.material.map(charMat):charMat(x.material);});
    g.add(m);
  }
  g.position.set(tx(b.o.x),GY(b.o.x,b.o.y),tz(b.o.y));g.rotation.y=b.o.ry||0;shadowAll(g);
  batchStatic(g,new Set());
  // เปลือกน้ำแข็ง 1 ชิ้นต่อส่วน (ซ่อนไว้ โชว์เมื่อเกาะน้ำแข็ง)
  const ice=[];
  for(let j=0;j<6;j++){
    const R=bldRect(b,j),m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),bldIceMat());
    if(j<4){m.scale.set(R[2]*2*S3+0.25,b.D.wh+0.2,R[3]*2*S3+0.25);m.position.set(R[0]*S3,b.D.wh/2,R[1]*S3);}
    else{m.scale.set(R[2]*2*S3+0.4,b.D.rh*0.55,R[3]*2*S3+0.4);m.position.set(R[0]*S3,b.D.wh+b.D.rh*0.25,R[1]*S3);}
    m.visible=false;g.add(m);ice.push(m);
  }
  return {g,ice};
}
function syncBld(dt){
  if(!BLDG.length){if(BLDV.g)BLDV.g.visible=false;return;}
  if(!BLDV.g||BLDV.g.parent!==world||BLDV.map!==builtMap){
    if(BLDV.g){if(BLDV.g.parent)BLDV.g.parent.remove(BLDV.g);disposeTree(BLDV.g);}
    BLDV.g=new THREE.Group();world.add(BLDV.g);BLDV.map=builtMap;BLDV.list=BLDG.map(b=>({b,key:'',g:null,ice:[]}));
    prefetchModels([...new Set(BLDG.map(b=>b.D.model)),'debris_wood','debris_stone']);
  }
  BLDV.g.visible=true;
  for(const q of BLDV.list){
    if(BLDG[q.b.i]&&q.b!==BLDG[q.b.i]){q.b=BLDG[q.b.i];q.key='';q.gone=undefined;if(DEBRIS.length)clearDebris();}   // เริ่มเกมใหม่ แผนที่เดิม → สถานะชุดใหม่
    if(farCull(q.b.o.x,q.b.o.y,q.b.o.w)){if(q.g)q.g.visible=false;continue;}   // ไกลเกินหมอก: ซ่อน (ยังไม่เคยเห็น = ยังไม่สร้าง)
    if(q.g)q.g.visible=true;
    const file=MODELS.ready.has(q.b.D.model);   // แต่ละหลังใช้ไฟล์ของชนิดตัวเอง (บ้านหิมะ / บ้านลอนดอน)
    let key=file?'F':'C';for(const p of q.b.pc)key+=(p.fl&3)+'.'+p.cb+',';
    if(key!==q.key){
      const gone=bldGone(q.b);if(gone&&q.gone===false)bfCollapse(q.b.o.x,q.b.o.y,q.b.o.w,q.b.o.d,q.b.pc.some(p=>p.fl&2));q.gone=gone;   // เพิ่งถล่มทั้งหลัง = ฝุ่นก้อนใหญ่ (js/44)
      q.key=key;if(q.g){BLDV.g.remove(q.g);disposeTree(q.g);}
      const r=bldBuild(q.b,file);q.g=r.g;q.ice=r.ice;BLDV.g.add(q.g);gl.shadowMap.needsUpdate=true;
    }
    for(let j=0;j<6;j++){
      const p=q.b.pc[j];q.ice[j].visible=(p.fl&9)===8;
      if((p.fl&5)===4&&Math.random()<dt*16){
        // ชิ้นที่ติดไฟ: เปลวไฟ + ควันลอยจากจุดสุ่มบนชิ้นนั้น
        const R=bldRect(q.b,j),lx=R[0]+(Math.random()*2-1)*R[2],ly=R[1]+(Math.random()*2-1)*R[3],[x,y]=bldWorld(q.b,lx,ly);
        const h=j<4?Math.random()*q.b.D.wh:q.b.D.wh+Math.random()*q.b.D.rh*0.6;
        PARTS.push({x,y,h,vx:rnd(-10,10),vy:rnd(-10,10),vh:rnd(1.5,3.5),life:rnd(0.5,0.9),max:0.9,col:Math.random()<0.5?'#ff7a2a':'#ffc04a',size:rnd(6,10),g:-1.5,drag:3,grow:0.7});
        if(Math.random()<0.35)PARTS.push({x,y,h:h+1,vx:0,vy:0,vh:rnd(0.8,1.6),life:1.8,max:1.8,col:'#2a2522',size:9,g:-0.3,smoke:true,grow:1.5,drag:2});
        if(Math.random()<0.15)LREQ.push({x:tx(x),y:h+0.5,z:tz(y),col:'#ff6a2a',int:2.2,dist:12});
      }
    }
  }
}
// เศษซาก (เฉพาะเครื่องนี้ ไม่ส่งในเน็ต): กระเด็นออกจากจุดที่โดน (ox,oy) แรง/แบบตามธาตุ
function bldDebris(ev){
  const b=BLDG[ev.i];if(!b)return;
  const j=ev.p,ck=ev.c!=null&&ev.c>=0,C=ck?bldChunk(b,j,ev.c):null,R=ck?C:bldRect(b,j),D=b.D,roof=j>=4,el=ev.el||'none',blast=el.includes('blast'),fire=el.includes('fire'),ice=el==='ice',fall=el==='fall';
  if(ck)bldChunkFall(b,j,ev.c,C,ev,fire,blast,fall);
  const M=bldMats(b),file=MODELS.ready.get(roof?'debris_wood':'debris_stone'),pool=[];
  if(file)file.scene.traverse(o=>{if(o.isMesh)pool.push(o);});
  const n=ck?(blast?16:fall?7:11):blast?32:ice?22:20;   // สนามรบ: เศษเยอะ ๆ (ตกแล้วค้างทั้งแมตช์ — updateDebris → bfRest js/44)
  for(let k=0;k<n;k++){
    const lx=R[0]+(Math.random()*2-1)*R[2],ly=R[1]+(Math.random()*2-1)*R[3],[x,y]=bldWorld(b,lx,ly);
    const h=ck?C[4]+Math.random()*(C[5]-C[4]):roof?D.wh+Math.random()*D.rh*0.5:0.3+Math.random()*D.wh;
    let m;
    if(ice&&k%2===0)m=new THREE.Mesh(sGeo(THREE.OctahedronGeometry,0.35,0),bldIceMat());
    else if(pool.length){const src=pool[k%pool.length];m=new THREE.Mesh(src.geometry,src.material);}
    else{const t=k%5;m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),roof?(k%2?M.roof:M.beam):t<2?M.wall:t<4?M.beam:M.stone);
      if(t===2||t===3)m.scale.set(0.12+Math.random()*0.1,0.1+Math.random()*0.08,0.9+Math.random()*1.6);   // ไม้คาน/แผ่นไม้ยาว
      else m.scale.set(0.2+Math.random()*0.55,0.12+Math.random()*0.3,0.2+Math.random()*0.5);}
    if(fire&&m.material!==_bldIce)m.material=charMat(m.material);
    m.castShadow=true;m.position.set(tx(x),h+GY(x,y),tz(y));m.rotation.set(Math.random()*6,Math.random()*6,0);scene.add(m);
    let dx=x-ev.ox,dy=y-ev.oy;const dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;
    const sp=(blast?9:ice?5:3.5)*(0.6+Math.random()*0.8);
    DEBRIS.push({m,vx:dx*sp+rnd(-1.5,1.5),vz:dy*sp+rnd(-1.5,1.5),vy:(blast?5:roof?0:2.5)+Math.random()*4,rx:rnd(-8,8),rz:rnd(-8,8),life:3+Math.random()*1.5,s0:m.scale.clone(),fire});
  }
  // เศษเล็กโปรยนิ่งรอบโคนผนัง (กรวด/อิฐ/ไม้) — ให้พื้นรอบบ้านรก ๆ
  const sm=[M.wall,M.stone,M.beam].map(q=>fire?charMat(q):q),[bx,by]=bldWorld(b,R[0],R[1]);
  bfScatter(bx,by,Math.max(R[2],R[3])+30,ck?(blast?10:6):16,sm,0.8);bfScatter(bx,by,Math.max(R[2],R[3])+40,ck?6:12,fire?'char':'rock',0.6);
  debrisCap();
}
// ชิ้นย่อยที่พัง: ก๊อปชิ้นจริงจากไฟล์ (หรือกล่องสีผนัง) แล้วให้ร่วง/กระเด็นหมุนลงพื้น — เฉพาะเครื่องนี้
function bldChunkFall(b,j,k,C,ev,fire,blast,fall){
  const piv=new THREE.Group(),[x,y]=bldWorld(b,C[0],C[1]),zc=(C[4]+C[5])/2;
  let src=bldHasChunks(b)?bldFilePiece(b,BLD_PIECES[j]+'_c'+k):null;
  if(!src){src=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),j<4?bldMats(b).wall:bldMats(b).roof);src.scale.set(C[2]*2*S3,C[5]-C[4],C[3]*2*S3);src.position.set(C[0]*S3,zc,C[1]*S3);}
  src.position.x-=C[0]*S3;src.position.y-=zc;src.position.z-=C[1]*S3;     // หมุนรอบกลางชิ้น
  piv.add(src);if(fire)piv.traverse(m=>{if(m.isMesh)m.material=Array.isArray(m.material)?m.material.map(charMat):charMat(m.material);});
  piv.traverse(m=>{if(m.isMesh)m.castShadow=true;});
  piv.position.set(tx(x),zc+GY(x,y),tz(y));piv.rotation.y=b.o.ry||0;scene.add(piv);
  let dx=x-ev.ox,dy=y-ev.oy;const dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;
  const sp=fall?0.6:blast?7:3;
  DEBRIS.push({m:piv,vx:dx*sp+rnd(-0.6,0.6),vz:dy*sp+rnd(-0.6,0.6),vy:fall?0:blast?4:1.5,rx:rnd(-3,3)*(fall?0.5:1),rz:rnd(-3,3)*(fall?0.5:1),life:2.6+Math.random(),s0:piv.scale.clone(),big:1,fire});
}
// ตก/กระดอน/ไถลบนพื้น (ระดับพื้นจริง GY) → หมดเวลาแล้วนิ่ง = ย้ายเข้ากองซากค้างทั้งแมตช์ (bfRest js/44) • สตูดิโอ VFX = หดหายแบบเดิม
function updateDebris(dt){
  for(let i=DEBRIS.length-1;i>=0;i--){
    const q=DEBRIS[i],m=q.m;q.life-=dt;
    if(q.gy===undefined)q.gy=GY(m.position.x/S3+MW/2,m.position.z/S3+MH/2);
    q.vy-=18*dt;m.position.x+=q.vx*dt;m.position.y+=q.vy*dt;m.position.z+=q.vz*dt;
    const fy=q.gy+(q.big?0.35:0.1);let gnd=false;
    if(m.position.y<fy){m.position.y=fy;gnd=true;if(q.vy<-4&&q.big&&!q.dust){q.dust=1;const p=simOf(m.position);smoke(p.x,p.y,0.2,3,'#8a7a68',1.4,9,60);snd('thud',{x:p.x,y:p.y,vol:0.4});}
      else if(q.vy<-5&&!q.tick&&Math.random()<0.2){q.tick=1;const p=simOf(m.position);snd('rubble',{x:p.x,y:p.y,vol:0.25});}   // เศษตกกระทบพื้น (สนามรบ ขั้น 5)
      q.vy=Math.abs(q.vy)*0.3;q.vx*=0.6;q.vz*=0.6;q.rx*=0.5;q.rz*=0.5;if(q.vy<0.8)q.vy=0;}
    if(gnd){const f=Math.exp(-5*dt);q.vx*=f;q.vz*=f;q.rx*=f;q.rz*=f;}
    m.rotation.x+=q.rx*dt;m.rotation.z+=q.rz*dt;
    if(q.life<=0&&(q.keep||(q.keep=(gnd&&Math.hypot(q.vx,q.vz)<0.5)||q.life<-2?1:0))){DEBRIS.splice(i,1);debrisDrop(q);continue;}
  }
}
// ชิ้นที่จบแล้ว: ค้างเป็นซาก (ไฟไหม้ = มีควันกรุ่น) • ค้างไม่ได้ (สตูดิโอ) = ลบ
function debrisDrop(q){if(!bfRest(q.m,q.fire,q.big))scene.remove(q.m);}
// เศษที่กำลังบินเกินเพดาน: ทิ้งเศษเล็กเก่าสุดก่อน (ชิ้นผนังใหญ่เก็บไว้ให้ตกถึงพื้น) — ยังไม่ตกถึงพื้น = ลบ ไม่ค้างกลางอากาศ
function debrisCap(){while(DEBRIS.length>260){let i=DEBRIS.findIndex(q=>!q.big);if(i<0)i=0;const q=DEBRIS.splice(i,1)[0];if(q.keep)debrisDrop(q);else scene.remove(q.m);}}
function clearDebris(){for(const q of DEBRIS)scene.remove(q.m);DEBRIS.length=0;}
function drawPropHint(me){
  const o=nearUseProp(me.x,me.y);if(!o)return;
  const t='['+keyName(KEYS.use)+']  '+PROPDEF[o.k].use;
  cx.font="600 15px 'Kanit',sans-serif";cx.textAlign='center';
  const w=cx.measureText(t).width+28,x=SW/2,y=SH*0.66;
  cx.fillStyle='rgba(10,14,30,0.72)';cx.fillRect(x-w/2,y-16,w,30);cx.strokeStyle='rgba(217,180,90,0.7)';cx.lineWidth=1;cx.strokeRect(x-w/2,y-16,w,30);
  cx.fillStyle='#f3dc94';cx.fillText(t,x,y+5);
}
function syncWalls(v){
  const seen=new Set();
  for(const w of (v.WL||[])){
    seen.add(w[0]);let o=WM3.get(w[0]);
    if(!o){
      const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:'#bfeaff',roughness:0.15,metalness:0.1,transparent:true,opacity:0.85,emissive:'#2f6a9a',flatShading:true});
      const r=w[3]*S3;
      for(const [ox,oz,sx,sy] of [[0,0,1.1,3.8],[0.5,0.3,0.55,2.4],[-0.5,-0.25,0.6,2.8]]){const m=new THREE.Mesh(new THREE.OctahedronGeometry(1,0),mat);m.scale.set(r*sx,sy,r*sx);m.position.set(ox,sy*0.9,oz);m.rotation.y=w[0]*1.7+ox;m.castShadow=true;g.add(m);}
      const gl2=new THREE.Sprite(glowMat('#8fe0ff',1.2));gl2.scale.set(5,4,1);gl2.position.y=2.2;g.add(gl2);
      scene.add(g);o={g,mat};WM3.set(w[0],o);
    }
    o.g.position.set(tx(w[1]),GY(w[1],w[2]),tz(w[2]));
    o.mat.opacity=0.5+0.4*clamp(w[4]/70,0,1);
    if(Math.random()<0.1)burst(w[1]+rnd(-30,30),w[2]+rnd(-30,30),'#cfeaff',1,20,0.8,1.6,{h:rnd(0.5,4),vh:[0,1],g:-0.2});
  }
  for(const [id,o] of WM3)if(!seen.has(id)){disposeObj(o.g);o.mat.dispose();WM3.delete(id);}
}

// ---------- ของบังในแผนที่ไฟล์ที่พังได้ ฝั่งแสดงผล (สถานะจาก BRK[].st — host js/12-buildings.js) ----------
// โมเดลที่ map_export.py ติด userData.brk ไว้: ไม่รวม batch → รวมเป็น InstancedMesh ต่อ (geometry, วัสดุ) • ร้าว = ดึงออกมาเป็น mesh วัสดุรอยร้าว
// พัง = ตัดโมเดลเหลือส่วนล่าง 1/3 (ขอบหยัก) + กองหินบนรอยตัด • ตอนพัง (event brk:b) ส่วนบนล้มออกจากจุดระเบิดแล้วจมหาย (เฉพาะเครื่องนี้)
const BRKV={sc:null,grp:[],fall:[]},BRK_COL={stone:'#7d776d',wood:'#6a4a30',ice:'#bfe6f5'};
function brkSetup(sc,skip){
  BRKV.sc=null;BRKV.grp=[];BRKV.fall.length=0;
  const objs=[];sc.traverse(o=>{const b=o.userData&&o.userData.brk;if(b!=null&&o!==sc){(objs[b]=objs[b]||[]).push(o);skip.add(o);}});
  if(!objs.length)return;
  sc.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(sc.matrixWorld).invert(),ims=new Map();
  objs.forEach((L,i)=>{if(!L)return;const q={i,parts:[],key:-1,dmg:null,cut:null};BRKV.grp[i]=q;
    for(const o of L){o.traverse(m=>{if(!m.isMesh||Array.isArray(m.material))return;
      const M=new THREE.Matrix4().multiplyMatrices(inv,m.matrixWorld),k=m.geometry.uuid+'|'+m.material.uuid;
      let e=ims.get(k);if(!e)ims.set(k,e={geo:m.geometry,mat:m.material,list:[],cs:m.castShadow});
      const p={geo:m.geometry,mat:m.material,M,e,idx:e.list.length};e.list.push(p);q.parts.push(p);});
      if(o.parent)o.parent.remove(o);}
  });
  for(const e of ims.values()){
    const im=new THREE.InstancedMesh(e.geo,e.mat,e.list.length);e.list.forEach((p,j)=>im.setMatrixAt(j,p.M));
    im.castShadow=e.cs;im.receiveShadow=true;im.computeBoundingSphere();sc.add(im);e.im=im;}
  BRKV.sc=sc;
}
// วัสดุรอยร้าว: เส้นร้าวจากลาย voronoi ในพิกัดโลก (ไม่ต้องมี uv) • lv 1 = ร้าวบาง, 2 = ร้าวหนา + มืดลง
const BRK_CM=new Map();
function brkCrackMat(mat,lv){
  const k=mat.uuid+'|'+lv;let m=BRK_CM.get(k);if(m)return m;
  m=mat.clone();const w=lv>1?0.07:0.04,dk=lv>1?0.85:0.97,dn=lv>1?'0.85':'0.4';   // dn = สัดส่วนเส้นร้าวที่โผล่
  m.onBeforeCompile=s=>{
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vBrkW;').replace('#include <project_vertex>','#include <project_vertex>\nvBrkW=(modelMatrix*vec4(transformed,1.0)).xyz;');
    s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vBrkW;
vec3 brkH(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return fract(sin(p)*43758.5453);}
vec2 brkCell(vec3 x){vec3 n=floor(x),f=fract(x);float d1=8.0,d2=8.0,id=0.0,id2=0.0;
  for(int k=-1;k<=1;k++)for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec3 g=vec3(float(i),float(j),float(k)),h=brkH(n+g),r=g+h-f;float d=dot(r,r);if(d<d1){d2=d1;id2=id;d1=d;id=h.y;}else if(d<d2){d2=d;id2=h.y;}}
  return vec2(sqrt(d2)-sqrt(d1),min(id,id2));}`).replace('#include <map_fragment>',`#include <map_fragment>
{vec2 e=brkCell(vBrkW*1.6);diffuseColor.rgb*=${dk.toFixed(2)}*mix(0.18,1.0,max(smoothstep(${(w*0.5).toFixed(3)},${w.toFixed(3)},e.x),step(${dn},e.y)));}`);
  };
  m.customProgramCacheKey=()=>'brk'+lv;BRK_CM.set(k,m);return m;
}
// ตัด geometry (พิกัดฉาก) ด้วยระนาบหยัก y = yc(x,z): below = เก็บส่วนล่าง ไม่งั้นเก็บส่วนบน
function brkClip(geo,M,yc,below){
  const g=(geo.index?geo.toNonIndexed():geo.clone()).applyMatrix4(M),names=Object.keys(g.attributes).filter(n=>g.attributes[n].itemSize<=4),A=names.map(n=>g.attributes[n]),pi=names.indexOf('position'),out=names.map(()=>[]);
  const P=g.attributes.position,get=['getX','getY','getZ','getW'];
  const vert=i=>A.map(a=>{const r=[];for(let k=0;k<a.itemSize;k++)r.push(a[get[k]](i));return r;});
  const lerpV=(u,v,t)=>u.map((arr,j)=>arr.map((x,k)=>x+(v[j][k]-x)*t));
  for(let i=0;i+2<P.count;i+=3){
    const vs=[vert(i),vert(i+1),vert(i+2)],sd=vs.map(v=>{const p=v[pi],y=yc(p[0],p[2]);return below?y-p[1]:p[1]-y;});
    if(sd.every(d=>d>=0)){vs.forEach(v=>v.forEach((a,j)=>out[j].push(...a)));continue;}
    if(sd.every(d=>d<0))continue;
    const poly=[];for(let e=0;e<3;e++){const a=vs[e],b=vs[(e+1)%3],da=sd[e],db=sd[(e+1)%3];if(da>=0)poly.push(a);if((da>=0)!==(db>=0))poly.push(lerpV(a,b,da/(da-db)));}
    for(let t=1;t+1<poly.length;t++)for(const v of [poly[0],poly[t],poly[t+1]])v.forEach((a,j)=>out[j].push(...a));
  }
  const r=new THREE.BufferGeometry();names.forEach((n,j)=>r.setAttribute(n,new THREE.BufferAttribute(new Float32Array(out[j]),A[j].itemSize)));
  g.dispose();if(r.attributes.normal)r.normalizeNormals();return r;
}
function brkYc(q){const g=BRK[q.i],b=GY(g.x,g.y)+(g.d.vh||g.d.h)*BRKDEF.rub,s=q.i*1.7;return (x,z)=>b+0.22*Math.sin(x*2.3+s)*Math.cos(z*1.9-s)+0.12*Math.sin((x+z)*5.1+s);}
// ซาก: ส่วนล่างของทุกชิ้น + ก้อนหิน/ไม้บนรอยตัด
function brkStump(q){
  if(q.cut)return q.cut;const g=BRK[q.i],yc=brkYc(q),G3=new THREE.Group();
  for(const p of q.parts){const m=new THREE.Mesh(brkClip(p.geo,p.M,yc,true),brkCrackMat(p.mat,2));m.castShadow=m.receiveShadow=true;G3.add(m);}
  const R=Math.max(...g.cs.map(o=>o.r))*S3*(g.d.m==='wood'?0.45:1),cx=tx(g.x),cz=tz(g.y),y=GY(g.x,g.y)+(g.d.vh||g.d.h)*BRKDEF.rub,mat=new THREE.MeshStandardMaterial({color:BRK_COL[g.d.m]||BRK_COL.stone,roughness:0.95,flatShading:true});
  const disc=new THREE.Mesh(new THREE.CircleGeometry(R*0.95,9),new THREE.MeshStandardMaterial({color:'#2a2622',roughness:1}));disc.rotation.x=-Math.PI/2;disc.position.set(cx,y-0.06,cz);G3.add(disc);
  const n=3+Math.min(5,Math.round(R*2));
  for(let k=0;k<n;k++){const a=k/n*6.283+q.i,d=R*(0.15+0.55*((k*0.37+q.i*0.11)%1)),s=R*(0.3+0.25*((k*0.53)%1));
    const m=new THREE.Mesh(sGeo(THREE.DodecahedronGeometry,1,0),mat);m.scale.set(s,s*0.7,s);m.position.set(cx+Math.cos(a)*d,y-s*0.2,cz+Math.sin(a)*d);m.rotation.set(k,k*2.1,k*0.7);m.castShadow=true;G3.add(m);}
  return q.cut=G3;
}
function brkSync(dt){
  if(!BRKV.sc)return;
  if(BRKV.sc.parent!==world){BRKV.sc=null;BRKV.grp=[];BRKV.fall.length=0;return;}
  let ch=false;
  for(const q of BRKV.grp){if(!q)continue;const g=BRK[q.i],st=g?g.st:0;if(st===q.key)continue;
    q.key=st;ch=true;
    if(q.dmg){BRKV.sc.remove(q.dmg);q.dmg=null;}
    for(const p of q.parts){p.e.im.setMatrixAt(p.idx,st?BRK_ZERO:p.M);p.e.im.instanceMatrix.needsUpdate=true;}
    if(st>=3)q.dmg=brkStump(q);
    else if(st){q.dmg=new THREE.Group();for(const p of q.parts){const m=new THREE.Mesh(p.geo,brkCrackMat(p.mat,st));m.matrixAutoUpdate=false;m.matrix.copy(p.M);m.castShadow=p.e.cs;m.receiveShadow=true;q.dmg.add(m);}}
    if(q.dmg)BRKV.sc.add(q.dmg);
  }
  if(ch)gl.shadowMap.needsUpdate=true;
  for(let i=BRKV.fall.length-1;i>=0;i--){const f=BRKV.fall[i];f.t+=dt;
    if(f.t<f.T){f.w+=f.acc*dt;f.ang=Math.min(f.max,f.ang+f.w*dt);f.piv.quaternion.setFromAxisAngle(f.ax,f.ang);if(f.ang>=f.max&&!f.hit){f.hit=1;f.T=f.t;if(f.onHit)f.onHit();}}
    else if(!FXSTUDIO.own&&BF.on){   // สนามรบ: ส่วนบนหล่นจากตอลงนอนราบกับพื้น แล้วค้างทั้งแมตช์ (รวม mesh — bfRest js/44)
      f.vy=(f.vy||0)+14*dt;f.piv.position.y=Math.max(f.gy+0.15,f.piv.position.y-f.vy*dt);f.ang=Math.min(Math.PI*0.5,f.ang+dt*1.2);f.piv.quaternion.setFromAxisAngle(f.ax,f.ang);
      if(f.piv.position.y<=f.gy+0.15&&f.ang>=Math.PI*0.5){bfRest(f.piv,false,true);f.piv.traverse(m=>{if(m.isMesh)m.geometry.dispose();});BRKV.fall.splice(i,1);}}
    else{f.piv.position.y-=dt*0.8;if(f.t>f.T+1.6){BRKV.sc.remove(f.piv);f.piv.traverse(m=>{if(m.isMesh)m.geometry.dispose();});BRKV.fall.splice(i,1);}}
    gl.shadowMap.needsUpdate=true;}
}
const BRK_ZERO=new THREE.Matrix4().makeScale(0,0,0);
// ตอนพัง: ส่วนบนเหนือรอยตัดล้มออกจากจุดระเบิด (ox,oy) แล้วหล่นนอนค้างบนพื้นทั้งแมตช์ (สตูดิโอ VFX = จมลงดินแบบเดิม)
function brkFall(ev){
  const q=BRKV.grp[ev.i],g=BRK[ev.i];if(!q||!g||!BRKV.sc)return;
  const yc=brkYc(q),cx=tx(g.x),cz=tz(g.y),y=GY(g.x,g.y)+(g.d.vh||g.d.h)*BRKDEF.rub,piv=new THREE.Group();piv.position.set(cx,y,cz);
  for(const p of q.parts){const m=new THREE.Mesh(brkClip(p.geo,p.M,yc,false),brkCrackMat(p.mat,2));m.position.set(-cx,-y,-cz);m.castShadow=true;piv.add(m);}
  let dx=g.x-ev.ox,dy=g.y-ev.oy;const dl=Math.hypot(dx,dy);if(dl<1){const a=ev.i*2.4;dx=Math.cos(a);dy=Math.sin(a);}else{dx/=dl;dy/=dl;}
  BRKV.sc.add(piv);
  const tall=(g.d.vh||g.d.h)*(1-BRKDEF.rub);
  BRKV.fall.push({piv,gy:GY(g.x,g.y),ax:new THREE.Vector3(dy,0,-dx).normalize(),ang:0,w:0.6,acc:Math.max(3,14/Math.max(1,tall*0.5)),max:Math.PI*0.48,t:0,T:3,
    onHit(){const lx=g.x+dx*tall*12,ly=g.y+dy*tall*12;fx({k:'brk',t:'land',i:ev.i,mi:ev.mi,col:ev.col,sz:ev.sz,hh:ev.hh,x:Math.round(lx),y:Math.round(ly),h:0.2,r:ev.r});}});
}
