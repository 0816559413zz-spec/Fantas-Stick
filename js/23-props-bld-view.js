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
function syncProps(v){
  if(!v||!v.PB){if(PROPV.g)PROPV.g.visible=false;return;}
  if(!PROPV.g||PROPV.g.parent!==world||PROPV.map!==builtMap){
    PROPV.g=new THREE.Group();world.add(PROPV.g);PROPV.map=builtMap;PROPV.list=[];
    prefetchModels(Object.values(PROPDEF).flatMap(D=>[D.model,D.model+'_broken',D.model+'_used']));
    for(const o of PROPS){const g=new THREE.Group();g.position.set(tx(o.x),GY(o.x,o.y),tz(o.y));g.rotation.y=o.a;PROPV.g.add(g);PROPV.list.push({g,st:-1,o});}
  }
  PROPV.g.visible=true;
  for(const q of PROPV.list){
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
  return {wall:sMat({color:BLD_WALLC[Math.floor(b.o.s*4)%4],roughness:0.9}),beam:sMat({color:'#3a281a',roughness:0.9}),roof:sMat({color:'#4a3438',roughness:0.85}),
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
function bldBuild(b,file){
  const g=new THREE.Group();
  for(let j=0;j<6;j++){
    const f=b.pc[j].fl,br=f&1;
    const m=(file&&bldFilePiece(b,BLD_PIECES[j]+(br?'_broken':'')))||bldFallback(b,j,br);
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
    prefetchModels([BLDDEF.house.model,'debris_wood','debris_stone']);
  }
  BLDV.g.visible=true;
  const file=MODELS.ready.has(BLDDEF.house.model);
  for(const q of BLDV.list){
    if(BLDG[q.b.i]&&q.b!==BLDG[q.b.i]){q.b=BLDG[q.b.i];q.key='';if(DEBRIS.length)clearDebris();}   // เริ่มเกมใหม่ แผนที่เดิม → สถานะชุดใหม่
    let key=file?'F':'C';for(const p of q.b.pc)key+=p.fl&3;
    if(key!==q.key){
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
  const j=ev.p,R=bldRect(b,j),D=b.D,roof=j>=4,el=ev.el||'none',blast=el.includes('blast'),fire=el.includes('fire'),ice=el==='ice';
  const M=bldMats(b),file=MODELS.ready.get(roof?'debris_wood':'debris_stone'),pool=[];
  if(file)file.scene.traverse(o=>{if(o.isMesh)pool.push(o);});
  const n=blast?22:ice?16:12;
  for(let k=0;k<n;k++){
    const lx=R[0]+(Math.random()*2-1)*R[2],ly=R[1]+(Math.random()*2-1)*R[3],[x,y]=bldWorld(b,lx,ly);
    const h=roof?D.wh+Math.random()*D.rh*0.5:0.3+Math.random()*D.wh;
    let m;
    if(ice&&k%2===0)m=new THREE.Mesh(sGeo(THREE.OctahedronGeometry,0.35,0),bldIceMat());
    else if(pool.length){const src=pool[k%pool.length];m=new THREE.Mesh(src.geometry,src.material);}
    else{m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),roof?(k%2?M.roof:M.beam):(k%3?M.wall:M.beam));m.scale.set(0.25+Math.random()*0.55,0.15+Math.random()*0.35,0.25+Math.random()*0.5);}
    if(fire&&m.material!==_bldIce)m.material=charMat(m.material);
    m.castShadow=true;m.position.set(tx(x),h+GY(x,y),tz(y));m.rotation.set(Math.random()*6,Math.random()*6,0);scene.add(m);
    let dx=x-ev.ox,dy=y-ev.oy;const dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;
    const sp=(blast?9:ice?5:3.5)*(0.6+Math.random()*0.8);
    DEBRIS.push({m,vx:dx*sp+rnd(-1.5,1.5),vz:dy*sp+rnd(-1.5,1.5),vy:(blast?5:roof?0:2.5)+Math.random()*4,rx:rnd(-8,8),rz:rnd(-8,8),life:3+Math.random()*1.5,s0:m.scale.clone()});
  }
  while(DEBRIS.length>180)scene.remove(DEBRIS.shift().m);
}
function updateDebris(dt){
  for(let i=DEBRIS.length-1;i>=0;i--){
    const q=DEBRIS[i],m=q.m;q.life-=dt;
    q.vy-=18*dt;m.position.x+=q.vx*dt;m.position.y+=q.vy*dt;m.position.z+=q.vz*dt;
    if(m.position.y<0.1){m.position.y=0.1;q.vy=Math.abs(q.vy)*0.3;q.vx*=0.6;q.vz*=0.6;q.rx*=0.5;q.rz*=0.5;}
    m.rotation.x+=q.rx*dt;m.rotation.z+=q.rz*dt;
    if(q.life<0.6)m.scale.copy(q.s0).multiplyScalar(Math.max(0.01,q.life/0.6));
    if(q.life<=0){scene.remove(m);DEBRIS.splice(i,1);}
  }
}
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
