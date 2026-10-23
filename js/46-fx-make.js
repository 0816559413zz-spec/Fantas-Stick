// =====================================================================
//  ของที่สร้างเองใน VFX Studio (asset ของเอฟเฟกต์) — ใช้ทั้งในเกมและในสตูดิโอ (สตูดิโอเรียกฟังก์ชันชุดเดียวกัน)
//  โมเดล: assets/fx/mesh/<ชื่อ>.mesh.json = สูตรปั้น (ชิ้นส่วน parts + ตัวแต่ง) → เกมปั้นเป็นรูปทรง 3 มิติเองตอนโหลด (ไฟล์เล็ก แก้ต่อได้ ไม่ต้องใช้ Blender)
//         ใช้ในเอฟเฟกต์: ชั้น mesh {shape:"model", model:"<ชื่อ>"}
//  ภาพ:   assets/fx/tex/<ชื่อ>.png (ตารางเฟรม) + <ชื่อ>.tex.json (สูตรวาด + cols rows add span rand size) — สตูดิโอวาดและบันทึกภาพให้
//         ใช้ในเอฟเฟกต์: emit {fb:"tex/<ชื่อ>"} (ทุก look) • mesh {mat:"flip", tex:"tex/<ชื่อ>"} (การ์ดภาพ / ภาพบนรูปทรง)
//  หน่วย: เมตร • +x ขวา +y บน +z หน้า (เหมือน .fx.json) • uv: v = 0 โคน/ใน → 1 ปลาย/นอก (ไฟ/พลังงานไหลตาม v)
//  ฟิลด์ทั้งหมด + คำอธิบาย: assets/fx/schema.json → "mk" (โมเดล) และ "tx" (ภาพ) • รายละเอียดสำหรับคนทำ: FX-FORMAT.md
// =====================================================================
const FXMK={mesh:new Map(),tex:new Map()};
const MKD=Math.PI/180;
function mkRng(seed){let a=((seed|0)*9973+12345)|0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function mkHash(x,y,z,s){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(z|0,1274126177)^Math.imul(s|0,144269);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
// value noise 3 มิติ (-1..1) — ตำแหน่งเดียวกันได้ค่าเดียวกันเสมอ (จุดซ้อนตรงตะเข็บไม่แยก)
function mkNoise(x,y,z,s){const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),f=t=>t*t*(3-2*t),u=f(x-xi),v=f(y-yi),w=f(z-zi),H=(a,b,c)=>mkHash(xi+a,yi+b,zi+c,s),l=(a,b,t)=>a+(b-a)*t;
  return l(l(l(H(0,0,0),H(1,0,0),u),l(H(0,1,0),H(1,1,0),u),v),l(l(H(0,0,1),H(1,0,1),u),l(H(0,1,1),H(1,1,1),u),v),w)*2-1;}
const mkL=(a,b,t)=>a+(b-a)*t;
const mkR2=v=>Array.isArray(v)?[+v[0]||0,+v[1]||0]:[+v||0,+v||0];
// ---------- ที่เก็บจุด/สามเหลี่ยม ----------
// G = {p ตำแหน่ง, u uv, i สามเหลี่ยม, k ชิ้นย่อยของแต่ละจุด, piv จุดหมุนของแต่ละชิ้นย่อย} — ชิ้นย่อย (หนามแต่ละแท่ง / ชิ้นที่ทำซ้ำ) ใช้ทำ "งอกทีละชิ้น" (grow)
function mkG(){return {p:[],u:[],i:[],k:[],piv:[]};}
function mkPc(G){const n=G.p.length/3;if(!G.k||G.k.length!==n){G.k=new Array(n).fill(0);G.piv=[[0,0,0]];}return G;}   // ยังไม่แบ่งชิ้น = ทั้งก้อนเป็นชิ้นเดียว หมุนที่จุดกำเนิด (ฐาน)
function mkV(G,x,y,z,u,v){G.p.push(x,y,z);G.u.push(u,v);return G.p.length/3-1;}
function mkQ(G,a,b,c,d){G.i.push(a,b,c,a,c,d);}
function mkAppend(G,H){mkPc(G);mkPc(H);const o=G.p.length/3,po=G.piv.length;for(const x of H.p)G.p.push(x);for(const x of H.u)G.u.push(x);for(const x of H.i)G.i.push(x+o);for(const x of H.k)G.k.push(x+po);for(const q of H.piv)G.piv.push(q.slice());return G;}
function mkCopy(G){mkPc(G);return {p:G.p.slice(),u:G.u.slice(),i:G.i.slice(),k:G.k.slice(),piv:G.piv.map(q=>q.slice())};}
function mkFlat(G){mkPc(G);const H=mkG();for(let k=0;k<G.i.length;k++){const j=G.i[k];H.p.push(G.p[j*3],G.p[j*3+1],G.p[j*3+2]);H.u.push(G.u[j*2],G.u[j*2+1]);H.k.push(G.k[j]);H.i.push(k);}H.piv=G.piv.map(q=>q.slice());return H;}
const _mkv=new THREE.Vector3();
function mkXf(G,m){mkPc(G);for(let k=0;k<G.p.length;k+=3){_mkv.set(G.p[k],G.p[k+1],G.p[k+2]).applyMatrix4(m);G.p[k]=_mkv.x;G.p[k+1]=_mkv.y;G.p[k+2]=_mkv.z;}
  for(const q of G.piv){_mkv.set(q[0],q[1],q[2]).applyMatrix4(m);q[0]=_mkv.x;q[1]=_mkv.y;q[2]=_mkv.z;}
  if(m.determinant()<0)for(let k=0;k<G.i.length;k+=3){const t=G.i[k+1];G.i[k+1]=G.i[k+2];G.i[k+2]=t;}return G;}
function mkThree(geo){const P=geo.attributes.position.array,U=geo.attributes.uv?geo.attributes.uv.array:null,G=mkG();G.p=Array.from(P);G.u=U?Array.from(U):new Array(P.length/3*2).fill(0);
  G.i=geo.index?Array.from(geo.index.array):Array.from({length:P.length/3},(_,k)=>k);geo.dispose();return G;}
function mkTRS(pos,rot,sc){const r=rot||[0,0,0],s=typeof sc==='number'?[sc,sc,sc]:Array.isArray(sc)?sc:[1,1,1];
  return new THREE.Matrix4().compose(new THREE.Vector3(...(pos||[0,0,0])),new THREE.Quaternion().setFromEuler(new THREE.Euler((r[0]||0)*MKD,(r[1]||0)*MKD,(r[2]||0)*MKD,'YXZ')),new THREE.Vector3(s[0]||1e-3,s[1]||1e-3,s[2]||1e-3));}
// แถบจุดเป็นตาราง rows×cols → สี่เหลี่ยม (ใช้กับ ribbon/blade/fan/tube)
function mkGrid(G,rows){for(let j=0;j+1<rows.length;j++)for(let i=0;i+1<rows[j].length;i++)mkQ(G,rows[j][i],rows[j+1][i],rows[j+1][i+1],rows[j][i+1]);}
// ---------- ชิ้นส่วน (k) — พิกัด: ฐานอยู่ที่ y=0 (ยกเว้น sphere/box อยู่กลาง) ----------
// ---------- ปั้นเอง (k:"poly"): จุด v + หน้า f (เลขจุด ทวนเข็มเมื่อมองจากด้านนอก) • sub = ทำให้เนียนแบบ Catmull-Clark ----------
function mkCC(V,F){const ek=(a,b)=>a<b?a+'_'+b:b+'_'+a,fp=F.map(f=>{const c=[0,0,0];for(const i of f)for(let a=0;a<3;a++)c[a]+=V[i][a]/f.length;return c;}),E=new Map();
  F.forEach((f,fi)=>f.forEach((a,j)=>{const b=f[(j+1)%f.length],k=ek(a,b);let e=E.get(k);if(!e)E.set(k,e={a,b,f:[]});e.f.push(fi);}));
  const NV=V.map(p=>p.slice()),ep=new Map(),vf=V.map(()=>[]),ve=V.map(()=>[]);
  for(const [k,e] of E){const A=V[e.a],B=V[e.b];ep.set(k,NV.length);NV.push(e.f.length===2?[0,1,2].map(i=>(A[i]+B[i]+fp[e.f[0]][i]+fp[e.f[1]][i])/4):[0,1,2].map(i=>(A[i]+B[i])/2));ve[e.a].push(e);ve[e.b].push(e);}
  F.forEach((f,fi)=>f.forEach(i=>vf[i].push(fi)));
  V.forEach((P,i)=>{const es=ve[i];if(!es.length)return;const bd=es.filter(e=>e.f.length<2);
    if(bd.length){if(bd.length===2){const o=bd.map(e=>V[e.a===i?e.b:e.a]);NV[i]=[0,1,2].map(a=>P[a]*0.75+(o[0][a]+o[1][a])*0.125);}return;}   // ขอบเปิด: เนียนตามขอบ
    const n=es.length,Fa=[0,0,0],Ra=[0,0,0];for(const fi of vf[i])for(let a=0;a<3;a++)Fa[a]+=fp[fi][a]/vf[i].length;for(const e of es){const A=V[e.a],B=V[e.b];for(let a=0;a<3;a++)Ra[a]+=(A[a]+B[a])/2/n;}
    NV[i]=[0,1,2].map(a=>(Fa[a]+2*Ra[a]+(n-3)*P[a])/n);});
  const FO=[];F.forEach((f,fi)=>{const c=NV.length;NV.push(fp[fi]);f.forEach((a,j)=>{const b=f[(j+1)%f.length],q=f[(j+f.length-1)%f.length];FO.push([a,ep.get(ek(a,b)),c,ep.get(ek(q,a))]);});});
  return [NV,FO];}
const MKGEN={
  sphere(o){return mkThree(new THREE.SphereGeometry(o.r,Math.max(6,o.seg*2|0),Math.max(3,o.seg|0),0,Math.PI*2,0,o.hemi?Math.PI/2:Math.PI));},
  box(o){return mkThree(new THREE.BoxGeometry(o.w,o.h,o.d));},
  cyl(o){return mkThree(new THREE.CylinderGeometry(o.r1,o.r0,o.h,Math.max(3,o.sides|0),Math.max(1,o.segs|0),!o.caps).translate(0,o.h/2,0));},
  torus(o){return mkThree(new THREE.TorusGeometry(o.r,o.tube,Math.max(3,o.sides|0),Math.max(3,o.seg|0),o.arc*MKD).rotateX(Math.PI/2));},
  disc(o){const G=mkG(),n=Math.max(3,o.seg|0),a0=-o.arc*MKD/2,rows=[[],[]];
    for(let i=0;i<=n;i++){const a=a0+i/n*o.arc*MKD,c=Math.sin(a),s=Math.cos(a);rows[0].push(mkV(G,c*o.inner,0,s*o.inner,i/n,0));rows[1].push(mkV(G,c*o.r,0,s*o.r,i/n,1));}mkGrid(G,rows);return G;},
  lathe(o){const pr=(o.prof||[]).map(p=>new THREE.Vector2(Math.max(0,+p[0]||0),+p[1]||0));if(pr.length<2)return mkG();return mkThree(new THREE.LatheGeometry(pr,Math.max(3,o.seg|0)));},
  shard(o){const G=mkG(),n=Math.max(3,o.sides|0),h=Math.max(1e-3,o.h),r=o.w/2,mid=Math.min(0.95,Math.max(0.05,o.mid));
    const rings=[[0,r*0.8],[h*mid,r],[h,r*Math.max(0,o.tip)]].map(([y,rr])=>{const row=[];for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;row.push(mkV(G,Math.cos(a)*rr,y,Math.sin(a)*rr,i/n,y/h));}return row;});
    mkGrid(G,rings);if(o.tip>0.001){const c=mkV(G,0,h,0,0.5,1);for(let i=0;i<n;i++)G.i.push(c,rings[2][i+1],rings[2][i]);}return G;},
  crown(o,R){const G=mkG(),[h0,h1]=mkR2(o.h),rings=Math.max(1,o.rings|0);
    for(let j=0;j<rings;j++){const n=Math.max(1,Math.round(o.n*(1-j*0.3))),rr=o.r*(1-j*0.38),tl=o.tilt*(1-j*0.45)*MKD,hk=1+j*0.35;
      for(let i=0;i<n;i++){const a=(i+(j%2)*0.5)/n*Math.PI*2+(R()-0.5)*o.jit*(Math.PI*2/n),S=MKGEN.shard({h:mkL(h0,h1,R())*hk,w:o.w*(0.8+0.4*R()),sides:o.sides,tip:o.tip,mid:o.mid});
        if(o.flat)Object.assign(S,mkFlat(S));
        mkAppend(G,mkXf(S,new THREE.Matrix4().makeTranslation(Math.cos(a)*rr,0,Math.sin(a)*rr).multiply(new THREE.Matrix4().makeRotationY(-a)).multiply(new THREE.Matrix4().makeRotationZ(-tl)).multiply(new THREE.Matrix4().makeRotationY(R()*6.283))));}}
    return G;},
  cluster(o,R){const G=mkG(),[h0,h1]=mkR2(o.h),[t0,t1]=mkR2(o.tilt),n=Math.max(1,o.n|0);
    for(let i=0;i<n;i++){const c=i===0,d=c?0:o.spread*Math.sqrt(0.15+0.85*R()),a=R()*6.283,f=o.spread>0?d/o.spread:0,S=MKGEN.shard({h:c?h1:mkL(h1,h0,f)*(0.8+0.35*R()),w:o.w*(c?1.15:0.7+0.4*R()),sides:o.sides,tip:o.tip,mid:o.mid});
      if(o.flat)Object.assign(S,mkFlat(S));
      mkAppend(G,mkXf(S,new THREE.Matrix4().makeTranslation(Math.cos(a)*d,0,Math.sin(a)*d).multiply(new THREE.Matrix4().makeRotationY(-a)).multiply(new THREE.Matrix4().makeRotationZ(-(c?0:mkL(t0,t1,f))*MKD)).multiply(new THREE.Matrix4().makeRotationY(R()*6.283))));}
    return G;},
  burst(o,R){const G=mkG(),[h0,h1]=mkR2(o.h),n=Math.max(1,o.n|0),up=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),d=new THREE.Vector3();let k=0;
    for(let i=0;k<n&&i<n*3;i++){const y=1-(i+0.5)/(o.hemi?n:n)*(o.hemi?1:2);if(o.hemi&&y<0.02)break;const rr=Math.sqrt(Math.max(0,1-y*y)),a=i*2.39996+(R()-0.5)*o.jit;d.set(Math.cos(a)*rr,y,Math.sin(a)*rr).normalize();k++;
      const S=MKGEN.shard({h:mkL(h0,h1,R()),w:o.w*(0.75+0.5*R()),sides:o.sides,tip:o.tip,mid:o.mid});if(o.flat)Object.assign(S,mkFlat(S));q.setFromUnitVectors(up,d);
      mkAppend(G,mkXf(S,new THREE.Matrix4().compose(d.clone().multiplyScalar(o.r),q,new THREE.Vector3(1,1,1))));}
    return G;},
  tube(o){const G=mkG(),pts=(o.path||[]).map(p=>new THREE.Vector3(+p[0]||0,+p[1]||0,+p[2]||0));if(pts.length<2)return G;
    const C=new THREE.CatmullRomCurve3(pts,false,'centripetal'),N=Math.max(2,o.seg|0),n=Math.max(3,o.sides|0),F=C.computeFrenetFrames(N,false),rows=[];
    for(let j=0;j<=N;j++){const t=j/N,P=C.getPointAt(t),rad=mkL(o.r0,o.r1,Math.pow(t,o.curve||1)),row=[];
      for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,c=Math.cos(a),s=Math.sin(a);row.push(mkV(G,P.x+(F.normals[j].x*c+F.binormals[j].x*s)*rad,P.y+(F.normals[j].y*c+F.binormals[j].y*s)*rad,P.z+(F.normals[j].z*c+F.binormals[j].z*s)*rad,i/n,t));}rows.push(row);}
    mkGrid(G,rows);return G;},
  ribbon(o){const G=mkG(),pts=(o.path||[]).map(p=>new THREE.Vector3(+p[0]||0,+p[1]||0,+p[2]||0));if(pts.length<2)return G;
    const C=new THREE.CatmullRomCurve3(pts,false,'centripetal'),N=Math.max(2,o.seg|0),up=new THREE.Vector3(0,1,0),T=new THREE.Vector3(),sd=new THREE.Vector3(),rows=[[],[]];
    for(let j=0;j<=N;j++){const t=j/N,P=C.getPointAt(t);C.getTangentAt(t,T);if(o.wall)sd.set(0,1,0);else{sd.crossVectors(T,up);if(sd.lengthSq()<1e-6)sd.set(1,0,0);sd.normalize();}
      const w=o.w*(1-o.taper*t)*0.5;rows[0].push(mkV(G,P.x-sd.x*w,P.y-sd.y*w,P.z-sd.z*w,t,0));rows[1].push(mkV(G,P.x+sd.x*w,P.y+sd.y*w,P.z+sd.z*w,t,1));}
    mkGrid(G,rows);return G;},
  spiral(o){const G=mkG(),N=Math.max(4,o.seg|0),rows=[[],[]];
    for(let j=0;j<=N;j++){const t=j/N,a=t*o.turns*Math.PI*2,r=mkL(o.r0,o.r1,t),c=Math.cos(a),s=Math.sin(a),y=o.rise*t,w=o.w*Math.max(0,1-o.taper*t);
      if(o.wall){rows[0].push(mkV(G,c*r,y,s*r,t,0));rows[1].push(mkV(G,c*r,y+w,s*r,t,1));}
      else{rows[0].push(mkV(G,c*(r-w/2),y,s*(r-w/2),t,0));rows[1].push(mkV(G,c*(r+w/2),y,s*(r+w/2),t,1));}}
    mkGrid(G,rows);return G;},
  blade(o){const G=mkG(),N=Math.max(4,o.seg|0),ex=Math.pow(2,o.skew||0),R=[[],[],[],[]];
    for(let j=0;j<=N;j++){const t=j/N,a=(t-0.5)*o.arc*MKD,pf=Math.pow(Math.max(0,Math.sin(Math.PI*Math.pow(t,ex))),Math.max(0.15,o.taper)),c=Math.sin(a),s=Math.cos(a),ri=o.r-o.w*pf,rm=o.r-o.w*pf*0.5,th=o.thick*pf*0.5;
      R[0].push(mkV(G,c*ri,0,s*ri,t,0));R[2].push(mkV(G,c*o.r,0,s*o.r,t,1));if(o.thick>0){R[1].push(mkV(G,c*rm,th,s*rm,t,0.5));R[3].push(mkV(G,c*rm,-th,s*rm,t,0.5));}}
    if(o.thick>0)mkGrid(G,[R[0],R[1],R[2],R[3],R[0]]);else mkGrid(G,[R[0],R[2]]);return G;},
  fan(o){const G=mkG(),n=Math.max(1,o.n|0),N=Math.max(3,o.seg|0);
    for(let i=0;i<n;i++){const F=mkG(),f=n>1?i/(n-1):0.5,ph=(f-0.5)*o.spread*MKD,len=o.len*(1-o.lvar*Math.abs(f*2-1)),d=[Math.sin(ph),Math.cos(ph)],sd=[Math.cos(ph),-Math.sin(ph)],rows=[[],[]];   // ขนแต่ละเส้น = ชิ้นย่อย
      for(let j=0;j<=N;j++){const t=j/N,cb=o.curve*MKD*t,L=len*t,cx=d[0]*L*Math.cos(cb),cy=d[1]*L*Math.cos(cb),cz=-L*Math.sin(cb),w=o.w*Math.pow(Math.max(0,Math.sin(Math.PI*Math.min(1,t*1.15+0.02))),0.55)*(1-(1-o.tipw)*t)*0.5;
        rows[0].push(mkV(F,cx-sd[0]*w,cy-sd[1]*w,cz,0,t));rows[1].push(mkV(F,cx+sd[0]*w,cy+sd[1]*w,cz,1,t));}
      mkGrid(F,rows);mkAppend(G,F);}
    return G;},
  star(o){const G=mkG(),n=Math.max(2,o.n|0),c=mkV(G,0,o.h,0,0.5,0),ring=[];
    for(let i=0;i<=n*2;i++){const a=i/(n*2)*Math.PI*2,r=i%2?o.r*o.inner:o.r;ring.push(mkV(G,Math.sin(a)*r,0,Math.cos(a)*r,i/(n*2),i%2?o.inner:1));}
    for(let i=0;i<n*2;i++)G.i.push(c,ring[i],ring[i+1]);return G;},
  poly(o){let V=(o.v||[]).filter(p=>Array.isArray(p)&&p.length===3),F=(o.f||[]).filter(f=>Array.isArray(f)&&f.length>=3&&f.every(i=>i>=0&&i<V.length));
    for(let i=0;i<Math.min(3,o.sub|0);i++)[V,F]=mkCC(V,F);
    const G=mkG();let y0=Infinity,y1=-Infinity;for(const p of V){y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}const H=Math.max(1e-4,y1-y0);
    for(const p of V)mkV(G,p[0],p[1],p[2],Math.atan2(p[0],p[2])/(Math.PI*2)+0.5,(p[1]-y0)/H);
    for(const f of F)for(let i=1;i+1<f.length;i++)G.i.push(f[0],f[i],f[i+1]);return G;},
};
// ---------- ตัวแต่ง (ทำตามลำดับ): เรียว → บิด → โค้ง → ขรุขระ → แบน(เหลี่ยม) → ขนาด/หมุน/ตำแหน่ง → ทำซ้ำ (วง/แถว) → กระจกซ้ายขวา ----------
function mkDeform(G,o){const P=G.p;let y0=Infinity,y1=-Infinity;for(let k=1;k<P.length;k+=3){y0=Math.min(y0,P[k]);y1=Math.max(y1,P[k]);}const H=Math.max(1e-4,y1-y0);
  const tp=o.topScale!==undefined?o.topScale:1,tw=(o.twist||0)*MKD,bd=(o.bend||0)*MKD,nz=o.noise||0,nf=o.nfreq||2,sd=(o.seed|0)+7;
  if(tp===1&&!tw&&!bd&&!nz)return G;const Rb=bd?H/bd:0;
  for(let k=0;k<P.length;k+=3){let x=P[k],y=P[k+1],z=P[k+2];const f=(y-y0)/H;
    if(tp!==1){const s=mkL(1,tp,f);x*=s;z*=s;}
    if(tw){const a=tw*f,c=Math.cos(a),s=Math.sin(a);[x,z]=[x*c-z*s,x*s+z*c];}
    if(bd){const th=(y-y0)/Rb;[y,z]=[y0+(Rb-z)*Math.sin(th),Rb-(Rb-z)*Math.cos(th)];}
    if(nz){const X=x*nf,Y=y*nf,Z=z*nf;x+=mkNoise(X,Y,Z,sd)*nz;y+=mkNoise(X+31.4,Y,Z,sd)*nz;z+=mkNoise(X,Y+17.3,Z,sd)*nz;}
    P[k]=x;P[k+1]=y;P[k+2]=z;}
  return G;}
// ค่าเริ่มของชิ้นส่วนแต่ละแบบมาจาก schema.json → mk (ถ้าโหลดแล้ว) — ไม่มี schema ก็ใช้ค่าที่เขียนในสูตร
function mkOpts(P){const S=FXR.schema&&FXR.schema.mk,o={};if(S){for(const k in S.common)o[k]=S.common[k].def;const T=S.parts[P.k];if(T)for(const k in T.fields)o[k]=T.fields[k].def;}return Object.assign(o,P);}
function mkPart(P){const o=mkOpts(P),gen=MKGEN[o.k];if(!gen)return mkG();const R=mkRng(o.seed|0);
  let G=gen(o,R);if(!G.p.length)return G;mkDeform(G,o);if(o.flat&&!['crown','cluster','burst'].includes(o.k))G=mkFlat(G);
  mkXf(G,mkTRS(o.pos,o.rot,o.scale));
  const n=Math.max(1,Math.min(64,o.arr|0));if(n>1){const base=G,out=mkG(),AR=mkRng((o.seed|0)+99);
    for(let i=0;i<n;i++){const C=mkCopy(base),s=Math.pow(o.arrScale||1,i)*(1+(AR()-0.5)*(o.arrJit||0)),m=new THREE.Matrix4();
      if(o.arrMode==='line'){const st=o.arrStep||[0,0,1];m.makeTranslation(st[0]*i,st[1]*i,st[2]*i);}
      else m.makeRotationY(-(i/n)*Math.PI*2-(AR()-0.5)*(o.arrJit||0)*(Math.PI*2/n)).multiply(new THREE.Matrix4().makeTranslation(0,0,o.arrR||0));
      m.multiply(new THREE.Matrix4().makeScale(s,s,s));mkAppend(out,mkXf(C,m));}
    G=out;}
  if(o.mir){const M=mkXf(mkCopy(G),new THREE.Matrix4().makeScale(-1,1,1));mkAppend(G,M);}
  return G;}
// สูตร .mesh.json → BufferGeometry (แกน three ของชั้น mesh: x กลับด้านเหมือน fxRibbon)
// rec (สตูดิโอ): เก็บช่วงสามเหลี่ยมของแต่ละชิ้น [id, จาก, ถึง] ไว้คลิกเลือกชิ้นบนจอ
function fxMeshBuild(d,rec){const G=mkG();for(const P of (d&&d.parts)||[]){if(!P||P.off)continue;try{const H=mkPart(P),t0=G.i.length/3;mkAppend(G,H);if(rec)rec.push([P.id,t0,G.i.length/3]);}catch(e){console.warn('mesh part',P.id,e);}}
  if(!G.p.length){mkV(G,0,0,0,0,0);mkV(G,0,0,0,0,0);mkV(G,0,0,0,0,0);G.i.push(0,1,2);}mkPc(G);
  for(let k=0;k<G.p.length;k+=3)G.p[k]=-G.p[k];for(let k=0;k<G.i.length;k+=3){const t=G.i[k+1];G.i[k+1]=G.i[k+2];G.i[k+2]=t;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(G.p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(G.u,2));
  // ชิ้นย่อย: aPiv = จุดหมุน (ฐานของชิ้น) • aOrd = ลำดับ [ตามลำดับสร้าง, ระยะจากกลาง, สุ่ม, ความสูง] 0..1 → ชั้น mesh ใช้ทำ grow (งอกทีละชิ้น)
  {const n=G.p.length/3,np=G.piv.length,piv=new Float32Array(n*3),ord=new Float32Array(n*4);let rMax=1e-4,y0=Infinity,y1=-Infinity;
    for(const q of G.piv){rMax=Math.max(rMax,Math.hypot(q[0],q[2]));y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);}
    for(let v=0;v<n;v++){const pi=G.k[v],q=G.piv[pi];piv[v*3]=-q[0];piv[v*3+1]=q[1];piv[v*3+2]=q[2];
      ord[v*4]=np>1?pi/(np-1):0;ord[v*4+1]=Math.hypot(q[0],q[2])/rMax;ord[v*4+2]=mkHash(pi,7,3,11);ord[v*4+3]=y1>y0?(q[1]-y0)/(y1-y0):0;}
    g.setAttribute('aPiv',new THREE.BufferAttribute(piv,3));g.setAttribute('aOrd',new THREE.BufferAttribute(ord,4));g.userData.pieces=np;}
  g.setIndex(G.p.length/3>65535?new THREE.Uint32BufferAttribute(G.i,1):new THREE.Uint16BufferAttribute(G.i,1));g.computeVertexNormals();
  // จุดที่ติดแต่สามเหลี่ยมพื้นที่ 0 ได้ normal = 0 → shader normalize(0) = NaN → bloom ลามเป็นจอขาว (เจอกับโมเดล tornado มองจากหน้า 2026-10-23) → ใส่ normal ชี้ขึ้นแทน
  {const nm=g.attributes.normal.array;for(let k=0;k<nm.length;k+=3)if(nm[k]*nm[k]+nm[k+1]*nm[k+1]+nm[k+2]*nm[k+2]<1e-12)nm[k+1]=1;}
  g.computeBoundingSphere();g.computeBoundingBox();g.userData.tris=G.i.length/3;return g;}
// ---------- โหลด ----------
function fxMeshLoad(name){let e=FXMK.mesh.get(name);if(e)return e.p;e={data:null,geo:null,fail:false};FXMK.mesh.set(name,e);const v=((FXR.index.mesh||{})[name]||{}).v||'';
  e.p=fxFetch('assets/fx/mesh/'+name+'.mesh.json'+(v?'?v='+v:'')).then(d=>{e.data=d;e.geo=fxMeshBuild(d);e.geo.userData.keep=true;return e.geo;}).catch(err=>{e.fail=true;console.warn('fx: โหลดโมเดลไม่ได้',name,err.message);return null;});return e.p;}
function fxMeshGeo(name){if(!name)return null;const e=FXMK.mesh.get(name);if(!e){fxMeshLoad(name);return null;}return e.geo;}
// สตูดิโอ: ใช้สูตรใหม่ทันที (เอฟเฟกต์ที่ใช้โมเดลนี้เปลี่ยนตาม) — ของเก่าไม่ทิ้งทันทีเพราะอาจมีชิ้นที่ยังแสดงอยู่
function fxMeshSet(name,d){const e=FXMK.mesh.get(name)||{fail:false};if(e.geo)e.geo.userData.keep=false;e.data=d;e.geo=fxMeshBuild(d);e.geo.userData.keep=true;e.fail=false;e.p=Promise.resolve(e.geo);FXMK.mesh.set(name,e);return e.geo;}
// ภาพ: key = 'tex/<ชื่อ>' (ชื่อเดียวกับที่ใส่ใน fb / tex) → ลงทะเบียนเป็นระบบอนุภาค flipbook (PFB) ใช้ได้ทั้งเม็ดและการ์ด
function fxTexLoad(key){let e=FXMK.tex.get(key);if(e)return e.p;e={meta:null,tex:null,fail:false};FXMK.tex.set(key,e);const name=key.slice(4),v=((FXR.index.tex||{})[name]||{}).v||'',q=v?'?v='+v:'';
  e.p=fxFetch('assets/fx/tex/'+name+'.tex.json'+q).then(m=>new Promise((res,rej)=>new THREE.TextureLoader().load('assets/fx/tex/'+name+'.png'+q,t=>res([m,t]),undefined,rej)))
    .then(([m,t])=>{fxTexUse(key,m,t);return e;}).catch(err=>{e.fail=true;console.warn('fx: โหลดภาพไม่ได้',key,err&&err.message);return null;});return e.p;}
function fxTexUse(key,m,t){const e=FXMK.tex.get(key)||{};t.colorSpace=THREE.SRGBColorSpace;t.userData.keep=true;
  const add=m.add!==false,o={cols:m.cols||1,rows:m.rows||1,add,span:m.span||1,rand:m.rand?1:0,rot:m.rot!==undefined?m.rot:(add?0:0.6),spin:m.spin||0,size:m.size||1,occ:m.occ};
  if(e.tex&&e.tex!==t){e.tex.userData.keep=false;}ptexUse(key,t,o);Object.assign(e,{meta:m,tex:t,o,fail:false,p:e.p||Promise.resolve(e)});FXMK.tex.set(key,e);return e;}
function fxTexNeed(n){if(typeof n==='string'&&n.startsWith('tex/')&&!FXMK.tex.has(n))fxTexLoad(n);}
// ---------- โมเดลงอกทีละชิ้น (ชั้น mesh: grow 0..1 เส้นโค้งได้, stagger, growBy) ----------
// แต่ละชิ้นย่อย (หนามแต่ละแท่ง / ชิ้นที่ทำซ้ำ / ขนแต่ละเส้น) ขยายจากฐานของมันเอง 0 → 1 ตามลำดับ • stagger 0 = ขึ้นพร้อมกัน, 0.9 = ไล่ทีละชิ้น
const FXGROWBY={order:0,center:1,random:2,height:3};
function fxGrowInit(S,geo){const P=geo.attributes.position,piv=geo.attributes.aPiv,ord=geo.attributes.aOrd;if(!piv||!ord)return geo;
  const g=geo.clone();g.userData={tris:geo.userData.tris};S.gp={base:Float32Array.from(P.array),piv:piv.array,ord:ord.array,last:-1};g.computeBoundingSphere();return g;}
function fxGrowTick(S,gv,st,by){const G=S.gp;if(!G)return;const key=gv*1000+st*7+by;if(key===G.last)return;G.last=key;
  const P=S.geo.attributes.position.array,B=G.base,V=G.piv,O=G.ord,n=B.length/3,d=Math.max(0.001,1-st);
  for(let v=0;v<n;v++){let s=Math.min(1,Math.max(0,(gv-O[v*4+by]*st)/d));if(s<1){const u=s-1;s=1+2.7*u*u*u+1.7*u*u;}   // ease out-back (เด้งเกินนิดแล้วเข้าที่)
    const i=v*3;P[i]=V[i]+(B[i]-V[i])*s;P[i+1]=V[i+1]+(B[i+1]-V[i+1])*s;P[i+2]=V[i+2]+(B[i+2]-V[i+2])*s;}
  S.geo.attributes.position.needsUpdate=true;}
// ---------- วัสดุภาพบนรูปทรง (mat:"tex") — ภาพที่วาดในสตูดิโอ (tex/…) ไหลบนผิว + ขอบเรือง + สลายตัว ----------
// uvTile [u,v] = ปูกี่ซ้ำ • uvScroll [u,v] = ไหลกี่รอบ/วิ • col = ย้อมสี (#ffffff = สีตามภาพ) • col2 + rim = ขอบเรือง • dis = สลายตัวแบบขอบไหม้
function fxTexMat(name,o){const X=FXMK.tex.get(name);if(!X)fxTexNeed(name);
  const U={uMap:{value:null},uGrid:{value:new THREE.Vector2(1,1)},uFr:{value:0},uRep:{value:new THREE.Vector2(...(o.tile||[1,1]))},uScr:{value:new THREE.Vector2(...(o.scroll||[0,0]))},time:FIRE_U.time,
    uC1:{value:new THREE.Color(o.col)},uC2:{value:new THREE.Color(o.col2)},uRim:{value:o.rim},uOp:{value:1},uInt:{value:1},uDis:{value:0},uAdd:{value:1},uNz:{value:NOISETEX},uHas:{value:0}};
  const m=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor,
    vertexShader:'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform sampler2D uMap,uNz;uniform vec2 uGrid,uRep,uScr;uniform vec3 uC1,uC2;uniform float uFr,time,uRim,uOp,uInt,uDis,uAdd,uHas;varying vec2 vUv;varying vec3 vN;varying vec3 vV;'+
      'void main(){vec2 uv=vUv*uRep+uScr*time;float N=uGrid.x*uGrid.y;vec4 t=vec4(1.0);'+
      'if(uHas>0.5){if(N>1.5){uv=fract(uv);float f0=mod(floor(uFr),N);uv=vec2((mod(f0,uGrid.x)+uv.x)/uGrid.x,1.0-(floor(f0/uGrid.x)+1.0-uv.y)/uGrid.y);}t=texture2D(uMap,uv);}'+
      'float fr=1.0-abs(dot(normalize(vN),normalize(vV))),rim=pow(fr,2.0)*uRim;float n=texture2D(uNz,vUv*vec2(2.0,1.0)).r;if(n<uDis)discard;float edge=uDis>0.001?1.0-smoothstep(uDis,uDis+0.06,n):0.0;'+
      'vec3 c=t.rgb*uC1*uInt+uC2*(rim+edge*1.5);float a=clamp(t.a+rim*0.5+edge,0.0,1.0)*uOp;gl_FragColor=vec4(c*a,a*(uAdd>0.5?0.35:1.0));}'});
  m.userData.tex=name;fxTexMatBind(m);return m;}
function fxTexMatBind(m){const u=m.uniforms;if(u.uHas.value)return;const X=FXMK.tex.get(m.userData.tex);if(!X||!X.tex)return;
  u.uMap.value=X.tex;u.uGrid.value.set(X.o.cols,X.o.rows);u.uAdd.value=X.o.add?1:0;u.uHas.value=1;m.userData.fps=X.meta.kind==='loop'?(X.meta.fps||24):0;m.userData.span=X.o.span||1;
  if(X.o.cols*X.o.rows===1&&X.tex.wrapS!==THREE.RepeatWrapping){X.tex.wrapS=X.tex.wrapT=THREE.RepeatWrapping;X.tex.needsUpdate=true;}}
function fxTexMatTick(m,S,k){fxTexMatBind(m);const u=m.uniforms,N=u.uGrid.value.x*u.uGrid.value.y;if(N<=1)return;u.uFr.value=m.userData.fps?S.age*m.userData.fps:Math.min(N-1,k*N*(m.userData.span||1));}
// ---------- เศษโมเดลกระเด็น (emit look:"model") — หิน ผลึก ขนนก เศษดาบ: หมุน ตกตามแรงโน้มถ่วง เด้งพื้น ย่อหายตอนท้าย ----------
// ทุกเม็ดของโมเดล+วัสดุ+สีเดียวกันวาดรวมเป็น InstancedMesh ก้อนเดียว (เบา) • อยู่ต่อได้หลังชั้นจบ (เหมือนอนุภาค)
const FXMP={groups:new Map()};
function fxMPMat(mat,col,col2){switch(mat){
  case 'glow':return new THREE.MeshBasicMaterial({color:hdr(col,1.1),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  case 'ice':return new THREE.MeshStandardMaterial({color:col,emissive:col2,emissiveIntensity:0.45,roughness:0.15,metalness:0.1,transparent:true,opacity:0.88,flatShading:true});
  default:return new THREE.MeshStandardMaterial({color:col,emissive:col2,emissiveIntensity:0.12,roughness:0.92,metalness:0,flatShading:true});}}
function fxMPGroup(model,mat,col,col2){const key=model+'|'+mat+'|'+col+'|'+col2;let G=FXMP.groups.get(key);if(G)return G;const geo=fxMeshGeo(model);if(!geo)return null;
  const N=256,m=new THREE.InstancedMesh(geo,fxMPMat(mat,col,col2),N);m.count=0;m.frustumCulled=false;m.castShadow=mat==='solid';m.renderOrder=2;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.userData.keep=true;
  scene.add(m);G={mesh:m,list:[],N};FXMP.groups.set(key,G);return G;}
const _mpM=new THREE.Matrix4(),_mpQ=new THREE.Quaternion(),_mpE=new THREE.Euler(),_mpP=new THREE.Vector3(),_mpS=new THREE.Vector3();
function fxMPUpdate(dt){if(!FXMP.groups.size)return;
  for(const G of FXMP.groups.values()){const L=G.list;let n=0;if(!L.length&&!G.mesh.count)continue;
    for(let i=L.length-1;i>=0;i--){const p=L[i];p.age+=dt;if(p.age>=p.life)L.splice(i,1);}
    for(const p of L){p.x+=p.vx*dt;p.y+=p.vy*dt;p.h+=p.vh*dt;p.vh-=p.g*dt;const dr=Math.exp(-p.drag*dt);p.vx*=dr;p.vy*=dr;
      if(p.h<p.r0){p.h=p.r0;if(p.bounce>0&&p.vh<-1){p.vh=-p.vh*p.bounce;p.vx*=0.7;p.vy*=0.7;p.spin*=0.6;}else{p.vh=0;const f=Math.exp(-7*dt);p.vx*=f;p.vy*=f;p.spin*=Math.exp(-6*dt);}}
      p.rx+=p.spin*p.ax*dt;p.ry+=p.spin*p.ay*dt;p.rz+=p.spin*p.az*dt;
      const k=p.age/p.life,sc=p.s*Math.min(1,p.age/0.05+0.35)*(k>0.75?Math.max(0,(1-k)/0.25):1);
      _mpP.set(tx(p.x),p.h+GY(p.x,p.y),tz(p.y));_mpQ.setFromEuler(_mpE.set(p.rx,p.ry,p.rz));_mpS.setScalar(Math.max(1e-3,sc));G.mesh.setMatrixAt(n++,_mpM.compose(_mpP,_mpQ,_mpS));}
    G.mesh.count=n;G.mesh.instanceMatrix.needsUpdate=true;if(!G.mesh.parent)scene.add(G.mesh);}}
function fxMPClear(){for(const G of FXMP.groups.values()){G.list.length=0;G.mesh.count=0;}}
// q = เม็ดที่ fxPart เตรียมไว้ (ตำแหน่ง/ความเร็วแบบอนุภาค) • คืน false = โมเดลยังไม่โหลด (ใช้เม็ดธรรมดาแทน)
function fxMPSpawn(L,q,col,c2,V,g){const G=fxMPGroup(g('model'),g('mmat'),col,c2||col);if(!G)return false;const ms=V('msize'),sp=g('mspin')*MKD,R=Math.random;
  const ax=R()-0.5,ay=R()-0.5,az=R()-0.5,al=Math.hypot(ax,ay,az)||1;
  G.list.length>=G.N&&G.list.shift();G.list.push({x:q.x,y:q.y,h:Math.max(q.h,0.05),vx:q.vx,vy:q.vy,vh:q.vh,g:q.g,drag:q.drag,life:q.life,age:0,s:ms,r0:ms*0.25,bounce:g('bounce'),
    spin:(R()*2-1)*sp,ax:ax/al,ay:ay/al,az:az/al,rx:R()*6.283,ry:R()*6.283,rz:R()*6.283});return true;}
// ---------- อากาศบิดเบี้ยว (ชั้น warp) — ไอร้อน / คลื่นกระแทกบิดภาพ / เลนส์โป่ง • อ่านภาพฉากจาก FXPass (ใช้ได้ตอนกราฟิกกลาง-สูง เหมือน heat haze ของเกม) ----------
// kind: haze = อากาศร้อนสั่นไหวขึ้น (แผ่นหันหากล้อง) • shock = วงคลื่นขยายบิดภาพ (flat = นอนบนพื้น) • bulge = เลนส์โป่งดันภาพออก
function fxWarpMake(S,I,w,g,V,C){const kind={haze:0,shock:1,bulge:2}[g('kind')]||0;
  const U={uScene:HAZE_U.uScene,uNz:{value:NOISETEX},time:FIRE_U.time,uStr:{value:0},uK:{value:kind},uR:{value:0.5},uTint:{value:new THREE.Color(C('col'))},uGlow:{value:g('glow')},uOp:{value:1}};
  const m=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:'varying vec2 vUv;varying float vVZ;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.0);vVZ=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:SOFT_GLSL+'uniform sampler2D uScene,uNz;uniform float time,uStr,uK,uR,uGlow,uOp;uniform vec3 uTint;varying vec2 vUv;'+
      'void main(){vec2 c=vUv-0.5;float r=length(c)*2.0;vec2 dir=r>1e-4?c/(r*0.5):vec2(0.0);vec2 off;float m;'+
      'if(uK<0.5){m=smoothstep(1.0,0.3,r)*smoothstep(0.0,0.25,vUv.y+0.1);float a=texture2D(uNz,vUv*vec2(1.6,2.2)*0.5+vec2(0.0,-time*0.55)).r,b=texture2D(uNz,vUv*1.8+vec2(0.37,-time*1.0)).r;off=(vec2(a,b)-0.5)*2.0*0.018;}'+
      'else if(uK<1.5){float d=r-uR,w=0.07+0.08*(1.0-uR);m=exp(-d*d/(w*w))*smoothstep(1.0,0.9,r);off=dir*0.025*(d<0.0?1.0:-0.6);}'+
      'else{m=smoothstep(1.0,0.0,r);off=-dir*0.03*(1.0-r*r);}'+
      'm*=uOp;if(m<0.004)discard;m*=softK(0.3);vec2 su=gl_FragCoord.xy/uRes+off*uStr*m;vec3 col=texture2D(uScene,su).rgb+uTint*uGlow*m;gl_FragColor=vec4(col,clamp(m*2.0,0.0,1.0));}'});
  fxMat(m);m.renderOrder=-1;const geo=new THREE.PlaneGeometry(1,1);const obj=new THREE.Mesh(geo,m);obj.frustumCulled=false;obj.renderOrder=-1;
  const root=new THREE.Group();root.add(obj);S.obj=root;S.inner=obj;S.mats=[m];fxScene.add(root);}
function fxWarpTick(S,I,k,g,V){if(!S.obj)return;const m=S.mats[0],u=m.uniforms,w=fxPos(I,S,k),sz=Math.max(0.01,V('size')*I.s);
  fxPlace(S.obj,I,S,w,V('yaw')*FXDEG);S.obj.visible=!!SOFTU.uSoftOn.value;
  if(g('flat')){S.inner.rotation.set(-Math.PI/2,0,0);S.obj.rotation.set(0,0,0);}else{S.obj.rotation.set(0,0,0);S.obj.lookAt(cam.position);S.inner.rotation.set(0,0,0);}
  S.inner.scale.set(sz,g('kind')==='haze'?sz*1.4:sz,1);if(g('kind')==='haze')S.inner.position.y=sz*0.55;
  u.uStr.value=V('str');u.uR.value=g('kind')==='shock'?Math.min(0.95,0.05+k*0.9):0.5;
  let op;if(S.d.op!==undefined)op=V('op');else{const fd=0.3;op=Math.min(1,S.age/0.05);if(!g('loop')&&k>1-fd)op*=Math.max(0,(1-k)/fd);if(I.stop&&g('loop'))op=0;}u.uOp.value=op;}
// ---------- ไฟ 3 มิติจากการจำลอง (ชั้น vol) — ไฟล์รูปแบบเดียวกับที่เพื่อน bake จาก Blender (tools/pack_volseq.py) ----------
// src: "vol/<ชื่อ>" = ทำในแท็บ 🔥 ไฟ 3D ของสตูดิโอ (assets/fx/vol/<ชื่อ>.bin + .vol.json) • "<ชื่อ>" = ไฟล์ bake จาก Blender ใน assets/vfx (เช่น fire_column, df_impact)
// เล่นด้วย fireSeqVol (js/42: raymarch ในกล่อง hx×h×hz เมตร) • once:false = วนเฟรม (เสาไฟ เริ่มเฟรมสุ่ม) / once:true = เล่นครั้งเดียว (ระเบิด)
const FXVOL=new Map();
function fxVolLoad(src){if(!src.startsWith('vol/'))return fireSeqLoad(src);let e=FXVOL.get(src);if(e)return e.p;e={v:null,fail:false};FXVOL.set(src,e);
  const name=src.slice(4),ver=((FXR.index.vol||{})[name]||{}).v||'',q=ver?'?v='+ver:'';
  e.p=Promise.all([fxFetch('assets/fx/vol/'+name+'.vol.json'+q),fetch('assets/fx/vol/'+name+'.bin'+q).then(r=>{if(!r.ok)throw new Error(r.status);return r.arrayBuffer();})])
    .then(([m,b])=>{e.v=fxVolTex(new Uint8Array(b),m);return e.v;}).catch(err=>{e.fail=true;console.warn('fx: โหลดไฟ 3D ไม่ได้',src,err.message);return null;});return e.p;}
function fxVolTex(data,m){const t=new THREE.Data3DTexture(data,m.nx*m.frames,m.ny,m.nz);t.format=THREE.RedFormat;t.minFilter=t.magFilter=THREE.LinearFilter;t.wrapS=t.wrapT=t.wrapR=THREE.ClampToEdgeWrapping;t.unpackAlignment=1;t.needsUpdate=true;t.userData.keep=true;
  return {tex:t,m:{nx:m.nx,ny:m.ny,nz:m.nz,frames:m.frames}};}
// สตูดิโอ: ใช้ผลจำลองใหม่ทันที
function fxVolSet(src,data,m){const e=FXVOL.get(src)||{};if(e.v&&e.v.tex)e.v.tex.dispose();e.v=fxVolTex(data,m);e.fail=false;e.p=Promise.resolve(e.v);FXVOL.set(src,e);return e.v;}
function fxVolReady(src){if(!src)return null;if(!src.startsWith('vol/'))return fireSeqReady(src)||(fireSeqLoad(src),null);const e=FXVOL.get(src);if(!e){fxVolLoad(src);return null;}return e.v;}
function fxVolMake(S,I,w,g,V){const SQ=fxVolReady(g('src'));if(!SQ){S.oneshot=1;return;}
  const mesh=fireSeqVol(SQ,{hx:Math.max(0.05,V('hx')*I.s),hz:Math.max(0.05,V('hz')*I.s),h:Math.max(0.1,V('h')*I.s),int:V('int')*I.k,den:g('den')});
  S.obj=mesh;S.sq=SQ;S.f0=!g('once')&&g('rand')?Math.random()*SQ.m.frames:0;fxPlace(mesh,I,S,w,V('yaw')*FXDEG);fxScene.add(mesh);fxVolTick(S,I,0,g,V);}
function fxVolTick(S,I,k,g,V){if(!S.obj)return;const u=S.obj.userData.u,N=S.sq.m.frames,f=S.age*g('fps')*g('speed');
  u.uFr.value=g('once')?Math.min(N-1.001,f):(S.f0+f)%N;u.uDis.value=V('dis');u.uH.value=Math.max(0.01,V('hgt'));u.uInt.value=V('int')*I.k;
  if(I.stop&&g('loop'))u.uDis.value=Math.max(u.uDis.value,Math.min(1,(I.t-I.stopT)*2));
  fxPlace(S.obj,I,S,fxPos(I,S,k),V('yaw')*FXDEG);}
// โหลดโมเดล/ภาพที่เอฟเฟกต์ใช้ไว้ก่อน (เรียกตอนโหลดไฟล์ .fx.json)
function fxPreAssets(d){for(const L of (d&&d.layers)||[]){if(!L)continue;if(((L.t==='mesh'&&L.shape==='model')||(L.t==='emit'&&L.look==='model'))&&L.model&&!FXMK.mesh.has(L.model))fxMeshLoad(L.model);fxTexNeed(L.tex);fxTexNeed(L.fb);if(L.t==='vol'&&L.src)fxVolReady(L.src);}}
// รอให้โมเดล/ภาพที่เอฟเฟกต์ใช้โหลดเสร็จ (สตูดิโอใช้ก่อนทำแผ่นภาพสรุป)
function fxAssetsWait(d){fxPreAssets(d);const ps=[];for(const L of (d&&d.layers)||[]){if(!L)continue;if(L.shape==='model'&&FXMK.mesh.has(L.model))ps.push(FXMK.mesh.get(L.model).p);for(const n of [L.tex,L.fb])if(typeof n==='string'&&FXMK.tex.has(n))ps.push(FXMK.tex.get(n).p);if(L.t==='vol'&&L.src)ps.push(fxVolLoad(L.src));}return Promise.all(ps);}
Object.assign(window.WD||(window.WD={}),{mk:{build:fxMeshBuild,part:mkPart,gen:MKGEN,mesh:FXMK.mesh,tex:FXMK.tex,meshSet:fxMeshSet,texUse:fxTexUse,texLoad:fxTexLoad}});
