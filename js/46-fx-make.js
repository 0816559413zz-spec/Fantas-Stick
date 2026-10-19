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
function mkG(){return {p:[],u:[],i:[]};}
function mkV(G,x,y,z,u,v){G.p.push(x,y,z);G.u.push(u,v);return G.p.length/3-1;}
function mkQ(G,a,b,c,d){G.i.push(a,b,c,a,c,d);}
function mkAppend(G,H){const o=G.p.length/3;for(const x of H.p)G.p.push(x);for(const x of H.u)G.u.push(x);for(const x of H.i)G.i.push(x+o);return G;}
function mkCopy(G){return {p:G.p.slice(),u:G.u.slice(),i:G.i.slice()};}
function mkFlat(G){const H=mkG();for(let k=0;k<G.i.length;k++){const j=G.i[k];H.p.push(G.p[j*3],G.p[j*3+1],G.p[j*3+2]);H.u.push(G.u[j*2],G.u[j*2+1]);H.i.push(k);}return H;}
const _mkv=new THREE.Vector3();
function mkXf(G,m){for(let k=0;k<G.p.length;k+=3){_mkv.set(G.p[k],G.p[k+1],G.p[k+2]).applyMatrix4(m);G.p[k]=_mkv.x;G.p[k+1]=_mkv.y;G.p[k+2]=_mkv.z;}
  if(m.determinant()<0)for(let k=0;k<G.i.length;k+=3){const t=G.i[k+1];G.i[k+1]=G.i[k+2];G.i[k+2]=t;}return G;}
function mkThree(geo){const P=geo.attributes.position.array,U=geo.attributes.uv?geo.attributes.uv.array:null,G=mkG();G.p=Array.from(P);G.u=U?Array.from(U):new Array(P.length/3*2).fill(0);
  G.i=geo.index?Array.from(geo.index.array):Array.from({length:P.length/3},(_,k)=>k);geo.dispose();return G;}
function mkTRS(pos,rot,sc){const r=rot||[0,0,0],s=typeof sc==='number'?[sc,sc,sc]:Array.isArray(sc)?sc:[1,1,1];
  return new THREE.Matrix4().compose(new THREE.Vector3(...(pos||[0,0,0])),new THREE.Quaternion().setFromEuler(new THREE.Euler((r[0]||0)*MKD,(r[1]||0)*MKD,(r[2]||0)*MKD,'YXZ')),new THREE.Vector3(s[0]||1e-3,s[1]||1e-3,s[2]||1e-3));}
// แถบจุดเป็นตาราง rows×cols → สี่เหลี่ยม (ใช้กับ ribbon/blade/fan/tube)
function mkGrid(G,rows){for(let j=0;j+1<rows.length;j++)for(let i=0;i+1<rows[j].length;i++)mkQ(G,rows[j][i],rows[j+1][i],rows[j+1][i+1],rows[j][i+1]);}
// ---------- ชิ้นส่วน (k) — พิกัด: ฐานอยู่ที่ y=0 (ยกเว้น sphere/box อยู่กลาง) ----------
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
    for(let i=0;i<n;i++){const f=n>1?i/(n-1):0.5,ph=(f-0.5)*o.spread*MKD,len=o.len*(1-o.lvar*Math.abs(f*2-1)),d=[Math.sin(ph),Math.cos(ph)],sd=[Math.cos(ph),-Math.sin(ph)],rows=[[],[]];
      for(let j=0;j<=N;j++){const t=j/N,cb=o.curve*MKD*t,L=len*t,cx=d[0]*L*Math.cos(cb),cy=d[1]*L*Math.cos(cb),cz=-L*Math.sin(cb),w=o.w*Math.pow(Math.max(0,Math.sin(Math.PI*Math.min(1,t*1.15+0.02))),0.55)*(1-(1-o.tipw)*t)*0.5;
        rows[0].push(mkV(G,cx-sd[0]*w,cy-sd[1]*w,cz,0,t));rows[1].push(mkV(G,cx+sd[0]*w,cy+sd[1]*w,cz,1,t));}
      mkGrid(G,rows);}
    return G;},
  star(o){const G=mkG(),n=Math.max(2,o.n|0),c=mkV(G,0,o.h,0,0.5,0),ring=[];
    for(let i=0;i<=n*2;i++){const a=i/(n*2)*Math.PI*2,r=i%2?o.r*o.inner:o.r;ring.push(mkV(G,Math.sin(a)*r,0,Math.cos(a)*r,i/(n*2),i%2?o.inner:1));}
    for(let i=0;i<n*2;i++)G.i.push(c,ring[i],ring[i+1]);return G;},
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
  if(!G.p.length){mkV(G,0,0,0,0,0);mkV(G,0,0,0,0,0);mkV(G,0,0,0,0,0);G.i.push(0,1,2);}
  for(let k=0;k<G.p.length;k+=3)G.p[k]=-G.p[k];for(let k=0;k<G.i.length;k+=3){const t=G.i[k+1];G.i[k+1]=G.i[k+2];G.i[k+2]=t;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(G.p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(G.u,2));
  g.setIndex(G.p.length/3>65535?new THREE.Uint32BufferAttribute(G.i,1):new THREE.Uint16BufferAttribute(G.i,1));g.computeVertexNormals();g.computeBoundingSphere();g.computeBoundingBox();g.userData.tris=G.i.length/3;return g;}
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
// โหลดโมเดล/ภาพที่เอฟเฟกต์ใช้ไว้ก่อน (เรียกตอนโหลดไฟล์ .fx.json)
function fxPreAssets(d){for(const L of (d&&d.layers)||[]){if(!L)continue;if(L.t==='mesh'&&L.shape==='model'&&L.model&&!FXMK.mesh.has(L.model))fxMeshLoad(L.model);fxTexNeed(L.tex);fxTexNeed(L.fb);}}
// รอให้โมเดล/ภาพที่เอฟเฟกต์ใช้โหลดเสร็จ (สตูดิโอใช้ก่อนทำแผ่นภาพสรุป)
function fxAssetsWait(d){fxPreAssets(d);const ps=[];for(const L of (d&&d.layers)||[]){if(!L)continue;if(L.shape==='model'&&FXMK.mesh.has(L.model))ps.push(FXMK.mesh.get(L.model).p);for(const n of [L.tex,L.fb])if(typeof n==='string'&&FXMK.tex.has(n))ps.push(FXMK.tex.get(n).p);}return Promise.all(ps);}
Object.assign(window.WD||(window.WD={}),{mk:{build:fxMeshBuild,part:mkPart,gen:MKGEN,mesh:FXMK.mesh,tex:FXMK.tex,meshSet:fxMeshSet,texUse:fxTexUse,texLoad:fxTexLoad}});
