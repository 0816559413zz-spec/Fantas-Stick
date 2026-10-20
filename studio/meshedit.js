// =====================================================================
//  VFX Studio — ปั้นเองแบบ Blender (ชิ้นส่วน k:"poly") ในแท็บ 🧊 โมเดล • ง่ายกว่า Blender: ไม่มี modal / วงลูป / ตัวแต่งซับซ้อน
//  ＋ ชิ้นส่วน → ✎ ปั้นเอง (ลูกบาศก์ แผ่น ทรงกระบอก ทรงกลม กรวย) • Tab = เข้า/ออกโหมดแก้จุด
//  1 จุด / 2 ขอบ / 3 หน้า • คลิก = เลือก (Shift = เพิ่ม/เอาออก) • A = เลือกทั้งหมด/ไม่เลือก • ลูกศรจับ G ย้าย / R หมุน / S ขนาด
//  E ดึงออก • I หดหน้าเข้า • F เติมหน้า • M รวมจุด • X / Delete ลบ • ÷ แบ่งหน้าทั้งชิ้น • ⇅ กลับด้านหน้า • sub = ทำให้เนียน
//  ข้อมูล: P.v = [[x,y,z]…] (ม., แกนของชิ้น ก่อน pos/rot/scale) • P.f = [[เลขจุด…]…] ทวนเข็มเมื่อมองจากด้านนอก — สร้างโดย MKGEN.poly (js/46)
//  console: STUDIO.mesh.edit(true|false) • STUDIO.mesh.prim('cube') • STUDIO.mesh.esel('f',[0,1]) • STUDIO.mesh.op('extrude'|'inset'|'fill'|'merge'|'del'|'subdiv'|'flip')
// =====================================================================
const ME={on:false,mode:'v',sel:[],grp:null,pts:null,lines:null,fill:null,pick:null,pivot:null,snap:null,triF:[]};
const _meV=new THREE.Vector3(),meR=x=>Math.round(x*1e4)/1e4,meK=(a,b)=>a<b?a+'_'+b:b+'_'+a;
// ---------- รูปทรงเริ่มต้น (ฐานที่ y = 0, หน้าทวนเข็มเมื่อมองจากด้านนอก) ----------
function meRing(n,r,y){const o=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;o.push([meR(Math.sin(a)*r),meR(y),meR(Math.cos(a)*r)]);}return o;}
const MEPRIM={
  cube:{th:'ลูกบาศก์',icon:'■',make(){const q=0.25,h=0.5;return {v:[[-q,0,-q],[q,0,-q],[q,0,q],[-q,0,q],[-q,h,-q],[q,h,-q],[q,h,q],[-q,h,q]],f:[[0,1,2,3],[4,7,6,5],[3,2,6,7],[1,0,4,5],[2,1,5,6],[0,3,7,4]]};}},
  plane:{th:'แผ่น',icon:'▭',make(){const q=0.5;return {v:[[-q,0,-q],[q,0,-q],[q,0,q],[-q,0,q]],f:[[0,3,2,1]]};}},
  cyl:{th:'ทรงกระบอก',icon:'▮',make(){const n=8,v=[...meRing(n,0.25,0),...meRing(n,0.25,0.5)],f=[];for(let i=0;i<n;i++){const j=(i+1)%n;f.push([i,j,n+j,n+i]);}
    f.push([...Array(n).keys()].map(i=>n+i),[...Array(n).keys()].reverse());return {v,f};}},
  sphere:{th:'ทรงกลม',icon:'●',make(){const n=8,rings=4,r=0.3,v=[[0,0,0]],f=[];for(let k=1;k<rings;k++){const a=k/rings*Math.PI;v.push(...meRing(n,Math.sin(a)*r,r-Math.cos(a)*r));}v.push([0,meR(2*r),0]);
    const top=v.length-1,R=k=>1+(k-1)*n;for(let i=0;i<n;i++){const j=(i+1)%n;f.push([0,R(1)+j,R(1)+i]);for(let k=1;k+1<rings;k++)f.push([R(k)+i,R(k)+j,R(k+1)+j,R(k+1)+i]);f.push([R(rings-1)+i,R(rings-1)+j,top]);}return {v,f};}},
  cone:{th:'กรวย',icon:'▲',make(){const n=8,v=[...meRing(n,0.25,0),[0,0.6,0]],f=[];for(let i=0;i<n;i++)f.push([i,(i+1)%n,n]);f.push([...Array(n).keys()].reverse());return {v,f};}},
};
function mePart(){const M=MK.m;return M.d&&M.d.parts.find(p=>p.id===M.sel&&p.k==='poly')||null;}
function meMat(P){const o=mkOpts(P);return new THREE.Matrix4().makeScale(-1,1,1).multiply(mkTRS(o.pos,o.rot,o.scale));}   // แกนชิ้น → แกนโมเดลบนจอ (เหมือน fxMeshBuild: x กลับด้าน)
function meEdges(P){const E=new Map();for(const f of P.f||[])f.forEach((a,j)=>{const b=f[(j+1)%f.length];E.set(meK(a,b),[a,b]);});return E;}
// ---------- สิ่งที่ถูกเลือก (แปลงระหว่างโหมดจุด/ขอบ/หน้า) ----------
function meSelVerts(P){const s=new Set();if(!P)return s;if(ME.mode==='v')for(const i of ME.sel)s.add(i);else if(ME.mode==='e')for(const k of ME.sel){const [a,b]=k.split('_').map(Number);s.add(a);s.add(b);}else for(const fi of ME.sel)for(const i of P.f[fi]||[])s.add(i);return s;}
function meSelFaces(P){if(ME.mode==='f')return new Set(ME.sel);const vs=meSelVerts(P),o=new Set();(P.f||[]).forEach((f,fi)=>{if(f.every(i=>vs.has(i)))o.add(fi);});return o;}
function meSelEdges(P){if(ME.mode==='e')return new Set(ME.sel);const o=new Set();if(ME.mode==='f'){for(const fi of ME.sel){const f=P.f[fi]||[];f.forEach((a,j)=>o.add(meK(a,f[(j+1)%f.length])));}return o;}
  const vs=meSelVerts(P);for(const [k,[a,b]] of meEdges(P))if(vs.has(a)&&vs.has(b))o.add(k);return o;}
function meSetMode(m){const P=mePart();if(!P){ME.mode=m;return;}const vs=meSelVerts(P);ME.mode=m;
  ME.sel=m==='v'?[...vs]:m==='e'?[...meEdges(P).entries()].filter(([k,[a,b]])=>vs.has(a)&&vs.has(b)).map(([k])=>k):P.f.map((f,fi)=>f.every(i=>vs.has(i))?fi:-1).filter(i=>i>=0);
  meAfterSel();mkMeshBot();}
function meClean(P){const nv=(P.v||[]).length,nf=(P.f||[]).length,E=ME.mode==='e'?meEdges(P):null;
  ME.sel=ME.sel.filter(x=>ME.mode==='v'?x<nv:ME.mode==='f'?x<nf:E.has(x));}
// ---------- วาดจุด / ขอบ / หน้าที่เลือก บนจอ ----------
function meEnsure(){if(ME.grp)return;const M=MK.m,nd={depthTest:false,depthWrite:false,transparent:true};
  ME.grp=new THREE.Group();ME.grp.matrixAutoUpdate=false;
  ME.fill=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial(Object.assign({color:0xff8a2a,opacity:0.3,side:THREE.DoubleSide},nd)));ME.fill.renderOrder=21;
  ME.lines=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial(Object.assign({vertexColors:true,opacity:0.95},nd)));ME.lines.renderOrder=22;
  ME.pts=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial(Object.assign({size:7,sizeAttenuation:false,vertexColors:true},nd)));ME.pts.renderOrder=23;
  ME.pick=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));ME.pick.visible=false;
  ME.grp.add(ME.fill,ME.lines,ME.pts,ME.pick);ME.pivot=new THREE.Object3D();M.root.add(ME.grp,ME.pivot);}
function meGeo(o,pos,col){o.geometry.dispose();const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(col)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeBoundingSphere();o.geometry=g;}
const ME_ON=[1,0.55,0.12],ME_OFF=[0.92,0.92,0.92],ME_EDGE=[0.08,0.08,0.1];
function meDraw(){const P=mePart();if(!ME.on||!P){if(ME.grp)ME.grp.visible=false;return;}meEnsure();meClean(P);
  ME.grp.visible=true;ME.grp.matrix.copy(meMat(P));ME.grp.matrixWorldNeedsUpdate=true;
  const V=P.v||[],F=P.f||[],vs=meSelVerts(P),es=meSelEdges(P),fs=meSelFaces(P),pa=[],pc=[],la=[],lc=[],fa=[],pk=[];
  V.forEach((p,i)=>{pa.push(...p);pc.push(...(vs.has(i)?ME_ON:ME_OFF));});
  for(const [k,[a,b]] of meEdges(P)){if(!V[a]||!V[b])continue;la.push(...V[a],...V[b]);const c=es.has(k)?ME_ON:ME_EDGE;lc.push(...c,...c);}
  ME.triF=[];F.forEach((f,fi)=>{for(let i=1;i+1<f.length;i++){const t=[f[0],f[i],f[i+1]];if(t.some(j=>!V[j]))continue;for(const j of t)pk.push(...V[j]);ME.triF.push(fi);if(fs.has(fi))for(const j of t)fa.push(...V[j]);}});
  meGeo(ME.pts,pa,pc);meGeo(ME.lines,la,lc);meGeo(ME.fill,fa);meGeo(ME.pick,pk);ME.pts.material.size=ME.mode==='v'?8:5;meStat();}
function meStat(){const e=$st('meStat'),P=mePart();if(!e||!P)return;const n=ME.sel.length;e.textContent=(P.v||[]).length+' จุด • '+(P.f||[]).length+' หน้า'+(n?' • เลือก '+n+' '+(ME.mode==='v'?'จุด':ME.mode==='e'?'ขอบ':'หน้า'):'');}
// ลูกศรจับวางที่กลางของที่เลือก (แกนโลก) — ลากแล้ว meGizmo() ขยับจุดที่เลือกตาม
function meAttach(){const M=MK.m,P=mePart();if(!M.tc||!ME.pivot)return;const vs=[...meSelVerts(P)];if(!ME.on||!vs.length){M.tc.detach();return;}
  const m=meMat(P),c=new THREE.Vector3();for(const i of vs)c.add(_meV.set(...P.v[i]).applyMatrix4(m));c.divideScalar(vs.length);
  ME.pivot.position.copy(c);ME.pivot.quaternion.identity();ME.pivot.scale.set(1,1,1);ME.pivot.updateMatrix();M.tc.setSpace('world');M.tc.attach(ME.pivot);}
function meAfterSel(){meDraw();if(!MK.m.drag)meAttach();}
// เรียกจาก mkHi (maker.js): โหมดแก้จุดเปิดอยู่ = วาดเองแทนกรอบเหลืองของชิ้น
function meHi(){const M=MK.m;if(ME.on&&!mePart()){ME.on=false;document.body.classList.remove('meOn');}if(!ME.on){if(ME.grp)ME.grp.visible=false;return false;}
  meEnsure();M.hi.visible=false;meDraw();if(!M.drag)meAttach();return true;}
function meSnap(){const P=mePart();if(!P)return;ME.pivot.updateMatrix();const m=meMat(P);ME.snap={m,inv:m.clone().invert(),p0inv:ME.pivot.matrix.clone().invert(),orig:[...meSelVerts(P)].map(i=>[i,P.v[i].slice()])};}
function meGizmo(){const P=mePart(),S=ME.snap;if(!P||!S)return;ME.pivot.updateMatrix();const T=S.inv.clone().multiply(ME.pivot.matrix).multiply(S.p0inv).multiply(S.m);
  for(const [i,o] of S.orig){_meV.set(...o).applyMatrix4(T);P.v[i]=[meR(_meV.x),meR(_meV.y),meR(_meV.z)];}
  const M=MK.m;M.dirty=true;meDraw();if(!M.rb){M.rb=true;requestAnimationFrame(()=>{M.rb=false;mkMeshRebuild();mkSyncTitle();});}}
function meDragEnd(){ME.snap=null;if(ME.on)meAttach();meStat();}
// ---------- คลิกเลือกบนจอ ----------
function meSegD(x,y,A,B){const dx=B[0]-A[0],dy=B[1]-A[1],L=dx*dx+dy*dy;let t=L?((x-A[0])*dx+(y-A[1])*dy)/L:0;t=Math.max(0,Math.min(1,t));return Math.hypot(A[0]+dx*t-x,A[1]+dy*t-y);}
function mePick(e,add){const P=mePart();if(!P)return;const r=gl.domElement.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;ME.grp.updateMatrixWorld(true);
  const W=ME.grp.matrixWorld,scr=p=>{_meV.set(p[0],p[1],p[2]).applyMatrix4(W).project(cam);return [(_meV.x+1)/2*r.width,(1-_meV.y)/2*r.height,_meV.z];};let hit=null;
  if(ME.mode==='v'){let best=14;P.v.forEach((p,i)=>{const s=scr(p);if(s[2]>1)return;const d=Math.hypot(s[0]-mx,s[1]-my);if(d<best){best=d;hit=i;}});}
  else if(ME.mode==='e'){let best=10;for(const [k,[a,b]] of meEdges(P)){const A=scr(P.v[a]),B=scr(P.v[b]);if(A[2]>1||B[2]>1)continue;const d=meSegD(mx,my,A,B);if(d<best){best=d;hit=k;}}}
  else{_mkRay.setFromCamera(new THREE.Vector2(mx/r.width*2-1,-my/r.height*2+1),cam);const h0=_mkRay.intersectObject(ME.pick,false)[0];if(h0&&h0.faceIndex!=null)hit=ME.triF[h0.faceIndex];}
  if(hit===null||hit===undefined){if(!add)ME.sel=[];}
  else{const i=ME.sel.indexOf(hit);if(add){if(i>=0)ME.sel.splice(i,1);else ME.sel.push(hit);}else ME.sel=[hit];}
  meAfterSel();}
function meAll(){const P=mePart();if(!P)return;ME.sel=ME.sel.length?[]:ME.mode==='v'?P.v.map((p,i)=>i):ME.mode==='e'?[...meEdges(P).keys()]:P.f.map((f,i)=>i);meAfterSel();}
// ---------- เครื่องมือ ----------
function meCompact(P){const used=new Set();for(const f of P.f)for(const i of f)used.add(i);const map=new Map(),V=[];P.v.forEach((p,i)=>{if(used.has(i)){map.set(i,V.length);V.push(p);}});P.v=V;P.f=P.f.map(f=>f.map(i=>map.get(i)));return map;}
function meNorm(P,f){const V=P.v,n=[0,0,0];for(let j=0;j<f.length;j++){const a=V[f[j]],b=V[f[(j+1)%f.length]];n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1]);}const l=Math.hypot(...n)||1;return n.map(x=>x/l);}   // Newell
function meCen(P,ids){const c=[0,0,0];for(const i of ids)for(let a=0;a<3;a++)c[a]+=P.v[i][a]/ids.length;return c;}
function meDone(P,newSel,mode,msg){if(mode)ME.mode=mode;ME.sel=newSel;mkMChanged(true);mkMeshBot();if(msg)stToast(msg);}
function meOp(op){const P=mePart();if(!P||!ME.on)return;const V=P.v,F=P.f;
  if(op==='del'){if(!ME.sel.length)return stToast('เลือกจุด / ขอบ / หน้าก่อน');mkMPush();
    if(ME.mode==='v'){const s=new Set(ME.sel);P.f=F.filter(f=>!f.some(i=>s.has(i)));}else if(ME.mode==='e'){const s=new Set(ME.sel);P.f=F.filter(f=>!f.some((a,j)=>s.has(meK(a,f[(j+1)%f.length]))));}
    else{const s=new Set(ME.sel);P.f=F.filter((f,i)=>!s.has(i));}meCompact(P);return meDone(P,[]);}
  if(op==='extrude'){const fs=[...meSelFaces(P)];mkMPush();
    if(fs.length){const cnt=new Map(),nmap=new Map(),nv=i=>{if(!nmap.has(i)){nmap.set(i,V.length);V.push(V[i].slice());}return nmap.get(i);},side=[],n=[0,0,0];
      for(const fi of fs){const f=F[fi],fn=meNorm(P,f);for(let a=0;a<3;a++)n[a]+=fn[a];f.forEach((a,j)=>{const k=meK(a,f[(j+1)%f.length]);cnt.set(k,(cnt.get(k)||0)+1);});}
      const nl=Math.hypot(...n)||1;for(const fi of fs){const f=F[fi];f.forEach((a,j)=>{const b=f[(j+1)%f.length];if(cnt.get(meK(a,b))===1)side.push([a,b,nv(b),nv(a)]);});}
      for(const fi of fs)F[fi]=F[fi].map(nv);F.push(...side);for(const i of nmap.values())V[i]=V[i].map((x,a)=>meR(x+n[a]/nl*0.2));
      const ns=ME.mode==='f'?fs:ME.mode==='v'?[...nmap.values()]:fs.flatMap(fi=>F[fi].map((a,j)=>meK(a,F[fi][(j+1)%F[fi].length])));
      return meDone(P,ns,null,'ดึงหน้าออกแล้ว — ลากลูกศรเพื่อดึงต่อ');}
    const es=[...meSelEdges(P)].map(k=>k.split('_').map(Number));if(!es.length){mkMUndo(false);return stToast('เลือกหน้า (หรือขอบ) ที่จะดึงออกก่อน');}
    const nmap=new Map(),out=new Map(),nv=i=>{if(!nmap.has(i)){nmap.set(i,V.length);V.push(V[i].slice());}return nmap.get(i);},side=[];
    for(let [a,b] of es){const f=F.find(f=>f.some((x,j)=>x===a&&f[(j+1)%f.length]===b)),g=F.find(f=>f.some((x,j)=>x===b&&f[(j+1)%f.length]===a));
      if(f&&!g)[a,b]=[b,a];const ow=f||g;const c=ow?meCen(P,ow):meCen(P,[a,b]),m=meCen(P,[a,b]);let d=[m[0]-c[0],m[1]-c[1],m[2]-c[2]];const l=Math.hypot(...d);d=l>1e-6?d.map(x=>x/l):[0,1,0];
      for(const i of [a,b]){const o=out.get(i)||[0,0,0];out.set(i,o.map((x,q)=>x+d[q]));}side.push([a,b,nv(b),nv(a)]);}
    for(const [i,j] of nmap){const d=out.get(i),l=Math.hypot(...d)||1;V[j]=V[j].map((x,a)=>meR(x+d[a]/l*0.2));}F.push(...side);
    const ns=ME.mode==='v'?[...nmap.values()]:ME.mode==='e'?es.map(([a,b])=>meK(nmap.get(a),nmap.get(b))):[];
    return meDone(P,ns,ME.mode==='f'?'e':null,'ดึงขอบออกแล้ว — ลากลูกศรเพื่อดึงต่อ');}
  if(op==='inset'){const fs=[...meSelFaces(P)];if(!fs.length)return stToast('เลือกหน้าที่จะหดก่อน');mkMPush();
    for(const fi of fs){const f=F[fi],c=meCen(P,f),inn=f.map(i=>{V.push(V[i].map((x,a)=>meR(x+(c[a]-x)*0.3)));return V.length-1;});
      f.forEach((a,j)=>{const k=(j+1)%f.length;F.push([a,f[k],inn[k],inn[j]]);});F[fi]=inn;}
    return meDone(P,ME.mode==='f'?fs:[...new Set(fs.flatMap(fi=>F[fi]))].filter(()=>ME.mode==='v'),ME.mode==='e'?'f':null,'หดหน้าเข้าแล้ว — ใช้ E ดึงออก หรือลากลูกศร');}
  if(op==='fill'){let ids=ME.mode==='v'?ME.sel.slice():null;
    if(ME.mode==='e'&&ME.sel.length===2){const [a,b]=ME.sel[0].split('_').map(Number),[c,d]=ME.sel[1].split('_').map(Number),D=(x,y)=>Math.hypot(...V[x].map((q,i)=>q-V[y][i]));ids=D(b,c)<D(b,d)?[a,b,c,d]:[a,b,d,c];}
    if(!ids||ids.length<3)return stToast('เลือกจุด 3–4 จุด (เรียงตามรอบ) หรือขอบ 2 เส้น แล้วกด F');mkMPush();
    const mc=meCen(P,V.map((p,i)=>i)),fc=meCen(P,ids),n=meNorm(P,ids);if(n[0]*(fc[0]-mc[0])+n[1]*(fc[1]-mc[1])+n[2]*(fc[2]-mc[2])<0)ids.reverse();
    F.push(ids);return meDone(P,[F.length-1],'f','เติมหน้าแล้ว');}
  if(op==='merge'){const vs=[...meSelVerts(P)];if(vs.length<2)return stToast('เลือกจุดอย่างน้อย 2 จุดก่อน');mkMPush();const c=meCen(P,vs),k=vs[0],s=new Set(vs);V[k]=c.map(meR);
    P.f=F.map(f=>{const o=[];for(const i of f){const j=s.has(i)?k:i;if(o[o.length-1]!==j)o.push(j);}if(o.length>1&&o[0]===o[o.length-1])o.pop();return o;}).filter(f=>f.length>=3);
    const map=meCompact(P);return meDone(P,map.has(k)?[map.get(k)]:[],'v','รวมจุดแล้ว');}
  if(op==='subdiv'){mkMPush();const ek=meK,E=new Map(),c0=V.length;const mid=(a,b)=>{const k=ek(a,b);if(!E.has(k)){E.set(k,V.length);V.push(V[a].map((x,i)=>meR((x+V[b][i])/2)));}return E.get(k);};
    const NF=[];for(const f of F){const c=V.length;V.push(meCen(P,f).map(meR));f.forEach((a,j)=>NF.push([a,mid(a,f[(j+1)%f.length]),c,mid(f[(j+f.length-1)%f.length],a)]));}P.f=NF;
    return meDone(P,[],null,'แบ่งหน้าทั้งชิ้นแล้ว ('+P.f.length+' หน้า)');}
  if(op==='flip'){const fs=[...meSelFaces(P)];mkMPush();for(const fi of (fs.length?fs:F.map((f,i)=>i)))F[fi].reverse();return meDone(P,ME.sel,null,'กลับด้านหน้าแล้ว');}}
// ---------- เปิด/ปิดโหมดแก้จุด + เพิ่มรูปทรงเริ่มต้น ----------
function meToggle(on){const M=MK.m,P=M.d&&M.d.parts.find(p=>p.id===M.sel);if(on===undefined)on=!ME.on;
  if(on&&(!P||P.k!=='poly'))return stToast('เลือกชิ้นแบบ ✎ ปั้นเอง ก่อน (＋ ชิ้นส่วน → ✎ ลูกบาศก์ ฯลฯ) แล้วกด Tab');
  if(on&&(!Array.isArray(P.v)||!Array.isArray(P.f))){const d=MEPRIM.cube.make();P.v=P.v||d.v;P.f=P.f||d.f;}
  ME.on=on;ME.sel=[];ME.snap=null;document.body.classList.toggle('meOn',on);mkGizmoMode('translate');mkHi();mkMeshBot();mkMeshInsp();
  if(on)stToast('โหมดแก้จุด: 1 จุด / 2 ขอบ / 3 หน้า • คลิกเลือก • E ดึงออก • Tab ออก');}
function meAddPrim(k){const M=MK.m,T=MEPRIM[k];if(!T||!M.d)return;mkMPush();const S=M.d.parts.find(p=>p.id===M.sel),P=Object.assign({id:mkUid(k),k:'poly'},T.make(),{flat:true});
  if(S&&S.pos)P.pos=S.pos.slice();M.d.parts.push(P);M.sel=P.id;mkMChanged(true);ME.mode='f';meToggle(true);}
// ปุ่มบนแถบล่าง (maker.js → mkMeshBot)
function meBotButtons(){const M=MK.m,P=M.d&&M.d.parts.find(p=>p.id===M.sel),can=P&&P.k==='poly';
  const b=[h('span',{className:'sep'}),h('button',{className:ME.on?'on':'',disabled:!can&&!ME.on,title:can?'เข้า/ออกโหมดแก้จุด (Tab)':'เลือกชิ้นแบบ ✎ ปั้นเอง ก่อน — ＋ ชิ้นส่วน → ✎ ลูกบาศก์ ฯลฯ',on:{click:()=>meToggle()}},'✎ แก้จุด Tab')];
  if(!ME.on)return b;
  b.push(h('span',{className:'stSeg2'},...[['v','● จุด','1'],['e','╱ ขอบ','2'],['f','■ หน้า','3']].map(([m,t,k])=>h('button',{className:ME.mode===m?'on':'',title:'เลือกทีละ'+t.slice(2)+' ('+k+')',on:{click:()=>meSetMode(m)}},t+' '+k))),
    ...[['extrude','⇑ ดึงออก','E','ดึงหน้า/ขอบที่เลือกออกมาเป็นเนื้อใหม่ (แบบ Blender E)'],['inset','▣ หดใน','I','สร้างหน้าเล็กซ้อนข้างในหน้าที่เลือก (ใช้คู่กับดึงออก)'],['fill','◆ เติมหน้า','F','สร้างหน้าใหม่จากจุด 3–4 จุด หรือขอบ 2 เส้นที่เลือก'],
      ['merge','⊕ รวมจุด','M','รวมจุดที่เลือกเป็นจุดเดียวตรงกลาง'],['subdiv','÷ แบ่งหน้า','','แบ่งทุกหน้าของชิ้นนี้เป็น 4 (ได้จุดเพิ่มไว้ปั้นละเอียด)'],['flip','⇅ กลับหน้า','','กลับด้านหน้าที่เลือก (ถ้าหน้าดูทะลุ/มืด)'],['del','✕ ลบ','X','ลบจุด/ขอบ/หน้าที่เลือก']]
      .map(([op,t,k,ti])=>h('button',{title:ti+(k?' ('+k+')':''),on:{click:()=>meOp(op)}},t+(k?' '+k:''))),h('span',{id:'meStat',className:'mono'}));
  setTimeout(meStat,0);return b;}
// ปุ่มลัดในโหมดแก้จุด (คืน true = ใช้ปุ่มนี้แล้ว)
function meKey(e){if(e.code==='Tab'){e.preventDefault();meToggle();return true;}if(!ME.on||e.ctrlKey||e.metaKey||e.altKey)return false;
  const k=e.code,A={Digit1:()=>meSetMode('v'),Digit2:()=>meSetMode('e'),Digit3:()=>meSetMode('f'),KeyA:meAll,KeyE:()=>meOp('extrude'),KeyI:()=>meOp('inset'),KeyF:()=>meOp('fill'),KeyM:()=>meOp('merge'),KeyX:()=>meOp('del'),Delete:()=>meOp('del'),
    Escape:()=>{if(ME.sel.length){ME.sel=[];meAfterSel();}else meToggle(false);}}[k];
  if(A){e.preventDefault();A();return true;}return false;}
