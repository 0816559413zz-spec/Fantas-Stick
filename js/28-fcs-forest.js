// =====================================================================
//  ป่าสนหมอก ในแผนที่ First Castle Strike (เฟส 1 = ช่อง x 0–28 ของ Map Editor) — ทำตามรูปอ้างอิงหุบเขาสน (2026-11-18, ผู้ใช้ขอเฉพาะส่วนป่า)
//  ภาพล้วน ๆ: ต้นไม้ที่ชนได้ยังเป็นตำแหน่ง 'tr' เดิมจากผู้ใช้ (genFcs ไม่แตะ) • ของเสริม (ต้นสนขอบ/เฟิร์น/พุ่ม/หิน/ท่อนไม้) ไม่มีวงชน
//  โมเดล = assets/mapkit/gorge.glb (ชุดเดียวกับแมพ gorge, tools/gorge-assets.mjs) → InstancedMesh ต่อชิ้นส่วน • พื้นป่า = ภาพวาดทับพื้นหญ้า (จางหายตรงขอบปราสาท)
//  บรรยากาศ: เข้าป่า → หมอกเขียวเทาใกล้ขึ้น + แสงเย็นลง (ค่อย ๆ ผสมตามตำแหน่งกล้อง — ปราสาทเหมือนเดิม) — fcsForestTick() เรียกจาก sgSync
// =====================================================================
const FF={base:null,on:false,k:0,fb:[],sky:null};
const FF_X1=28;   // ขอบป่า (ช่อง)
const FF_NS=new Set(['stone_a','stone_b','stone_c','log_c','shrub_a','shrub_b','fern_a','fern_b','pine_la','pine_lb']);   // ไม่ทอดเงา (เบา)
// ภาพวาดพื้นป่า: มอส/ใบสนทับถม/ดินเปียก/กรวด + แนวทางดินจากจุดเกิดไปจุดยึด 1 + วงมืดใต้ต้นไม้ • ขอบตะวันออกจางหายเข้าพื้นปราสาท
function ffGroundTex(trees,R){
  const C=FCS_C,PW=(FF_X1+2)*C,PH=FCS_DATA.h*C,W=1152,H=Math.round(W*PH/PW),k=W/PW;
  return texCanvas(W,H,(g)=>{
    g.fillStyle='#4b4c31';g.fillRect(0,0,W,H);
    const pal=['#5e6a3c','#3f4a2c','#5d4a34','#403524','#6a6a48','#34402a','#725c3e'];
    for(let i=0;i<1500;i++){const x=R()*W,y=R()*H,r=14+R()*80,c=pal[(R()*pal.length)|0],gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,c+'66');gr.addColorStop(1,c+'00');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
    // วงมืดใต้ต้นไม้ (ใบสนทับถม)
    for(const [x,y] of trees){const r=3.4*20*k*(0.8+R()*0.5),px=x*k,py=y*k,gr=g.createRadialGradient(px,py,0,px,py,r);gr.addColorStop(0,'rgba(34,28,18,0.62)');gr.addColorStop(0.6,'rgba(48,40,26,0.3)');gr.addColorStop(1,'rgba(48,40,26,0)');g.fillStyle=gr;g.fillRect(px-r,py-r,r*2,r*2);}
    // แนวทางดิน (ช่อง) จุดเกิด 1 → จุดยึด 1 → ประตูตะวันออก
    const P=[[3,40],[4,36],[7,32],[10,28],[12,24],[14,19],[17,15],[20,13.5],[24,14],[28,14]].map(([a,b])=>[(a+0.5)*C*k,(b+0.5)*C*k]);
    const trail=(w,col,al,j)=>{g.strokeStyle=col;g.globalAlpha=al;g.lineWidth=w;g.lineCap=g.lineJoin='round';g.beginPath();P.forEach(([x,y],i)=>{const jx=x+(R()-0.5)*j,jy=y+(R()-0.5)*j;if(!i)g.moveTo(jx,jy);else{const [px,py]=P[i-1];g.quadraticCurveTo((px+x)/2+(R()-0.5)*j*2,(py+y)/2+(R()-0.5)*j*2,jx,jy);}});g.stroke();g.globalAlpha=1;};
    trail(54,'#3b3022',0.35,8);trail(40,'#5e4d38',0.8,6);trail(26,'#74644a',0.85,4);trail(10,'#86765a',0.45,3);
    // เม็ดลาย: เข็มสน/ใบไม้แห้ง/กรวด
    const sp=['#2c2a1a','#6a5238','#8a7050','#7d7a68','#4c5a30','#a08a60','#22301c'];
    for(let i=0;i<110000;i++){g.fillStyle=sp[(R()*sp.length)|0];g.globalAlpha=0.18+R()*0.4;const s=1+R()*2.6;g.save();g.translate(R()*W,R()*H);g.rotate(R()*6.3);g.fillRect(0,0,s*(1+R()*2),s);g.restore();}
    g.globalAlpha=1;
    // ขอบตะวันออกจางหาย (ตรงกับขอบพื้นปราสาท)
    g.globalCompositeOperation='destination-in';const fx0=(FF_X1-5)*C*k,fx1=FF_X1*C*k,gr=g.createLinearGradient(fx0,0,fx1,0);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);g.globalCompositeOperation='source-over';
  });
}
// ดึงชิ้นส่วนโมเดลจาก gorge.glb (จัดกึ่งกลาง xz + ก้นแตะพื้น ตามที่ตัวโหลดคลังของ Map Builder ทำ)
function ffParts(sc,name){
  const n=sc.getObjectByName(name);if(!n)return null;n.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(n.matrixWorld).invert(),parts=[],box=new THREE.Box3(),b=new THREE.Box3();
  n.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const rel=new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld);o.geometry.computeBoundingBox();b.copy(o.geometry.boundingBox).applyMatrix4(rel);box.union(b);parts.push({g:o.geometry,m:o.material,rel});});
  if(!parts.length)return null;
  return {parts,off:new THREE.Vector3(-(box.min.x+box.max.x)/2,-box.min.y,-(box.min.z+box.max.z)/2),h:box.max.y-box.min.y};
}
function fcsForest(fallback){
  const D=FCS_DATA,C=FCS_C,F=MAPS.fcs.fcs,T=TERR,W=world,R=mulberry(20261118),H=D.h*C;
  FF.base=null;FF.on=false;FF.fb=fallback||[];const gy0=(x,y)=>GY(x,y);
  const wallAt=(x,y)=>{const i=Math.floor(x/C),j=Math.floor(y/C);return i<0||j<0||i>=D.w||j>=D.h?0:parseInt(D.W[j*D.w+i],36)||0;};
  const trees=F.props.filter(q=>q[0]==='tr'&&q[1]<FF_X1*C).map(q=>[q[1],q[2]]);
  // พื้นป่า (ทับพื้นหญ้า — ใช้ตารางความสูงและการแบ่งสามเหลี่ยมเดียวกับพื้นหลัก จึงทับพอดี)
  {const nxI=FF_X1*2,geo=terrGeo((i,j)=>i<=nxI?T.g[j*T.nx+i]+0.03:NaN,T.nx,T.ny,T.c,1),pos=geo.attributes.position,uv=geo.attributes.uv,PW=(FF_X1+2)*C*S3,x0=tx(0),z0=tz(0);
   for(let i=0;i<pos.count;i++){uv.setXY(i,(pos.getX(i)-x0)/PW,1-(pos.getZ(i)-z0)/(H*S3));}
   const tex=ffGroundTex(trees,mulberry(77));tex.anisotropy=8;
   const dr=mulberry(5),det=texCanvas(256,256,g=>{g.fillStyle='#b8b8b8';g.fillRect(0,0,256,256);
     for(let i=0;i<5200;i++){const v=40+dr()*215|0;g.fillStyle=`rgba(${v},${v},${v},${0.25+dr()*0.4})`;g.save();g.translate(dr()*256,dr()*256);g.rotate(dr()*6.3);g.fillRect(0,0,1+dr()*7,1+dr()*1.6);g.restore();}
     for(let i=0;i<60;i++){const x=dr()*256,y=dr()*256,r=6+dr()*16,gr=g.createRadialGradient(x,y,0,x,y,r),v=dr()<0.5?60:230;gr.addColorStop(0,`rgba(${v},${v},${v},0.22)`);gr.addColorStop(1,`rgba(${v},${v},${v},0)`);g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}},false);
   det.wrapS=det.wrapT=THREE.RepeatWrapping;det.colorSpace=THREE.SRGBColorSpace;det.anisotropy=8;
   const mat=new THREE.MeshStandardMaterial({map:tex,roughness:1,metalness:0,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
   mat.onBeforeCompile=sh=>{sh.uniforms.uDet={value:det};sh.fragmentShader='uniform sampler2D uDet;\n'+sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb*=texture2D(uDet,vMapUv*vec2('+(PW/4).toFixed(1)+','+(H*S3/4).toFixed(1)+')).rgb*1.75;');};
   mat.customProgramCacheKey=()=>'fcsff2';
   const m=new THREE.Mesh(geo,mat);
   m.receiveShadow=true;m.renderOrder=1;addW(m);}
  // ฟ้าครึ้มสีเขียวเทา (ผสมเข้าตามตำแหน่งกล้องใน fcsForestTick — ซ้อนทับฟ้าพระอาทิตย์ตกของแมพ)
  {const t=texCanvas(8,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#c9d1cb');gr.addColorStop(0.55,'#bfc9bd');gr.addColorStop(1,'#b6c1b5');g.fillStyle=gr;g.fillRect(0,0,w,h);});
   const sk=new THREE.Mesh(new THREE.SphereGeometry(560,24,12),new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide,transparent:true,opacity:0,depthWrite:false,fog:false}));
   sk.visible=false;sk.frustumCulled=false;sk.renderOrder=-1;sk.userData.ffSky=1;W.add(sk);FF.sky=sk;}
  // หมอกลอยต่ำ: สไปรต์นุ่มขนาดใหญ่ ๆ เกลี่ยทั่วป่า (ไม่เขียนความลึก)
  {const mt=new THREE.SpriteMaterial({map:glowTex,color:'#cfd8cc',opacity:0.2,depthWrite:false,transparent:true,fog:false}),mg=new THREE.Group();
   for(let i=0;i<30;i++){const x=(0.5+R()*(FF_X1-1.5))*C,y=(0.5+R()*(D.h-1))*C,sp=new THREE.Sprite(mt);sp.scale.set(34+R()*30,10+R()*8,1);sp.position.set(tx(x),gy0(x,y)+2.2+R()*2.5,tz(y));mg.add(sp);}
   W.add(mg);}
  // ---------- วางของ (พิกัด px) ----------
  const gy=(x,y)=>GY(x,y),slope=(x,y)=>Math.hypot(gy(x+30,y)-gy(x-30,y),gy(x,y+30)-gy(x,y-30))/3;
  const cores=F.cores.map(k=>[k.x,k.y]),sps=[];for(const t of ['A','B'])for(const k in F.sp[t])sps.push([F.sp[t][k].x,F.sp[t][k].y]);
  const nearP=(x,y,L,d)=>L.some(q=>(q[0]-x)**2+(q[1]-y)**2<d*d);
  const crates=F.props.filter(q=>q[0]==='cr'||q[0]==='pl').map(q=>[q[1],q[2]]),ruinO=MAPS.fcs.obs.filter(o=>o.k==='fcr');
  const items={};const put=(id,x,y,s,extra)=>{(items[id]=items[id]||[]).push(Object.assign({x,y,s,r:R()*6.283},extra||{}));};
  const free=(x,y,big)=>x>0&&y>0&&x<FF_X1*C&&y<H&&!wallAt(x,y)&&!(F.bridge&&F.bridge.at(x,y,big?60:25))&&!(big&&(nearP(x,y,cores,180)||nearP(x,y,sps,150)))&&!nearP(x,y,crates,big?60:28)&&!ruinO.some(o=>(o.x-x)**2+(o.y-y)**2<(o.r+(big?50:14))**2);
  // ต้นไม้ชนได้ (ตำแหน่งเดิมของผู้ใช้): สนหลายพันธุ์ + ต้นใบแดง/ไม้ตายนิดหน่อย
  const pickTree=()=>{const q=R();return q<0.27?['pine_a',13+R()*5]:q<0.5?['pine_b',15+R()*5]:q<0.7?['pine_c',10+R()*4]:q<0.84?['pine_d',17+R()*6]:q<0.875?['autumn_a',6+R()*2]:q<0.9?['autumn_b',6+R()*2]:q<0.95?['snag_a',8+R()*3]:['snag_b',7+R()*2];};
  const hOf={pine_a:20.5,pine_b:26.3,pine_c:15.6,pine_d:31.1,pine_s:6.6,pine_la:24.3,pine_lb:19.5,snag_a:13,snag_b:9,autumn_a:11.4,autumn_b:9.8};
  for(const [x,y] of trees){const [id,h]=pickTree();put(id,x,y,h/hOf[id]);}
  // ผนังต้นไม้รอบขอบ (ไม่ชน): 2 แถว ห่าง ~3.3 ม. สนไกลเบา ๆ ปนสนจริง
  const edge=(x,y)=>{const q=R(),far=R()<0.42;
    if(far)put(q<0.5?'pine_la':'pine_lb',x,y,(0.55+R()*0.45),{lean:1});
    else{const [id,h]=pickTree();put(id==='autumn_a'||id==='autumn_b'?'pine_a':id,x,y,h/hOf[id==='autumn_a'||id==='autumn_b'?'pine_a':id]*(0.9+R()*0.3),{lean:1});}};
  // ผนังต้นไม้ขอบแผนที่ (ชนได้ — สร้างใน genFcs js/02-fcs.js) • สนไกลเบา ๆ ปนสนจริง
  for(const q of F.props)if(q[0]==='te')edge(q[1],q[2]);
  // สนอ่อน (ต้นเล็กแซมใต้ร่ม)
  for(let i=0;i<70;i++){const [bx,by]=trees[(R()*trees.length)|0],a=R()*6.283,d=70+R()*160,x=bx+Math.cos(a)*d,y=by+Math.sin(a)*d;if(free(x,y,1))put('pine_s',x,y,0.7+R()*0.7,{lean:1});}
  // เฟิร์น+พุ่ม เป็นกลุ่มรอบโคนต้นไม้และกลางหย่อม
  const scatter=(ids,n,spread,fn)=>{for(let i=0;i<n;i++){const [bx,by]=trees[(R()*trees.length)|0],a=R()*6.283,d=R()*spread,x=bx+Math.cos(a)*d,y=by+Math.sin(a)*d;if(!free(x,y,0))continue;if(x>(FF_X1-5)*C&&R()<0.7)continue;fn(ids[(R()*ids.length)|0],x,y);}};
  scatter(['fern_a','fern_b'],400,170,(id,x,y)=>put(id,x,y,0.9+R()*0.9));
  scatter(['shrub_a','shrub_b'],70,230,(id,x,y)=>{if(free(x,y,1))put(id,x,y,0.9+R()*0.7);});
  scatter(['stone_a','stone_b','stone_c'],190,260,(id,x,y)=>put(id,x,y,0.8+R()*1.4));
  scatter(['stump_a'],14,300,(id,x,y)=>{if(free(x,y,1))put(id,x,y,0.7+R()*0.5);});
  scatter(['log_a','log_b','log_c'],26,300,(id,x,y)=>{if(free(x,y,1))put(id,x,y,0.8+R()*0.5);});
  // หินก้อนใหญ่ (ชนได้ — ตำแหน่ง/ชนิด/ขนาดจาก genFcs) + หินเล็กรอบ ๆ
  for(const q of F.props){if(q[0]!=='bd')continue;const [,x,y,ty,sz]=q;put(['boulder_a','boulder_b','boulder_c','boulder_d','cliff_a'][ty],x,y,sz);
    for(let k=0;k<4;k++){const a=R()*6.283,d=40+R()*70,sx=x+Math.cos(a)*d,sy=y+Math.sin(a)*d;if(free(sx,sy,0))put(['stone_a','stone_b','stone_c'][k%3],sx,sy,1+R()*1.6);}}
  // พื้นมีชีวิต: ของเล็กเกลี่ยทั่วป่า (ไม่ชน) — กอหญ้า, พุ่มใบ, กิ่งไม้, เห็ด, หิน, เฟิร์น
  const trailP=[[3,40],[4,36],[7,32],[10,28],[12,24],[14,19],[17,15],[20,13.5],[24,14],[28,14]].map(([a,b])=>[(a+0.5)*C,(b+0.5)*C]);
  const dTrail=(x,y)=>{let m=1e9;for(let i=1;i<trailP.length;i++){const [ax,ay]=trailP[i-1],[bx,by]=trailP[i],dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy),0,1);m=Math.min(m,Math.hypot(x-ax-t*dx,y-ay-t*dy));}return m;};
  const area=(n,fn)=>{for(let i=0;i<n;i++){const x=20+R()*(FF_X1*C-40),y=20+R()*(H-40);if(!free(x,y,0))continue;if(x>(FF_X1-4)*C&&R()<0.75)continue;fn(x,y,dTrail(x,y));}};
  area(500,(x,y,d)=>{if(d>40)put(R()<0.5?'fern_a':'fern_b',x,y,0.8+R()*1.0);});
  area(260,(x,y,d)=>{if(d>30)put(['stone_a','stone_b','stone_c'][(R()*3)|0],x,y,0.7+R()*1.8);});
  area(60,(x,y,d)=>{if(d>60&&free(x,y,1))put(R()<0.5?'shrub_a':'shrub_b',x,y,0.9+R()*0.7);});
  area(30,(x,y,d)=>{if(d>70&&free(x,y,1))put(['log_b','log_c','stump_a'][(R()*3)|0],x,y,0.8+R()*0.5);});
  area(40,(x,y,d)=>{if(d>50)put('pine_s',x,y,0.5+R()*0.6,{lean:1});});
  ffDetail(W,R,area,trees,free);
  fcsRuin(W,F);
  // ---------- โหลดโมเดลแล้วสร้าง InstancedMesh ----------
  (typeof gltfLoader==='function'?gltfLoader():Promise.reject('no loader')).then(L=>L.loadAsync('assets/mapkit/gorge.glb?v=9')).then(gltf=>{
    if(!W.parent)return;
    const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sv=new THREE.Vector3(),pv=new THREE.Vector3(),tm=new THREE.Matrix4(),fin=new THREE.Matrix4();
    const g=new THREE.Group();
    for(const id in items){const P=ffParts(gltf.scene,'g_'+id);if(!P)continue;const L2=items[id],ns=FF_NS.has(id);
      const mats=L2.map(o=>{e.set(o.lean?(R()-0.5)*0.07:0,o.r,o.lean?(R()-0.5)*0.07:0);q.setFromEuler(e);sv.setScalar(o.s);pv.set(tx(o.x),gy(o.x,o.y)-0.05,tz(o.y));return new THREE.Matrix4().compose(pv,q,sv);});
      tm.makeTranslation(P.off.x,P.off.y,P.off.z);
      for(const p of P.parts){const im=new THREE.InstancedMesh(p.g,p.m,L2.length);
        mats.forEach((M,i)=>{fin.multiplyMatrices(M,tm).multiply(p.rel);im.setMatrixAt(i,fin);});
        im.instanceMatrix.needsUpdate=true;im.castShadow=!ns;im.receiveShadow=true;g.add(im);}}
    W.add(g);W.userData.ffGroup=g;
    for(const o of FF.fb){if(!o)continue;W.remove(o);if(o.geometry)o.geometry.dispose();}FF.fb=[];   // ลบต้นไม้กรวยเดิมที่ใช้ชั่วคราว
    if(typeof gl!=='undefined')gl.shadowMap.needsUpdate=true;
  }).catch(err=>console.warn('fcs forest',err));
}
// รวมรูปทรงหลายชิ้น (ไม่มี index) เป็นก้อนเดียว พร้อมสีจุดยอด: parts = [[geometry, สี, Matrix4, สีปลาย?]]
function ffMerge(parts){
  const P=[],N=[],Cl=[],c=new THREE.Color(),c2=new THREE.Color();
  for(const [g0,col,m,tip] of parts){const g=(g0.index?g0.toNonIndexed():g0.clone()).applyMatrix4(m);g.computeVertexNormals();
    const p=g.attributes.position,n=g.attributes.normal;g.computeBoundingBox();const y0=g.boundingBox.min.y,y1=g.boundingBox.max.y;c.set(col);if(tip)c2.set(tip);
    for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));N.push(n.getX(i),n.getY(i),n.getZ(i));const t=tip?(p.getY(i)-y0)/Math.max(1e-4,y1-y0):0;Cl.push(c.r+(c2.r-c.r)*t,c.g+(c2.g-c.g)*t,c.b+(c2.b-c.b)*t);}g.dispose();}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(Cl,3));return g;
}
// ของเล็กที่สร้างในโค้ด (InstancedMesh): กอหญ้าแห้ง/เขียว, พุ่มใบเขียวเข้ม, กิ่งไม้ร่วง, เห็ดเป็นกลุ่ม
function ffDetail(W,R,area,trees,free){
  const M=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),sv=new THREE.Vector3(),col=new THREE.Color(),g=new THREE.Group();
  const gr=mulberry(31),tri=new THREE.BufferGeometry();tri.setAttribute('position',new THREE.Float32BufferAttribute([-0.035,0,0,0.035,0,0,0,1,0],3));
  const tuft=ffMerge(Array.from({length:9},(_,i)=>{const a=i/9*6.283+gr(),h=0.35+gr()*0.45,lean=0.25+gr()*0.5;e.set(Math.sin(a)*lean,a,Math.cos(a)*lean*0.3);q.setFromEuler(e);
    return [tri,'#3a3f22',new THREE.Matrix4().compose(v.set(Math.cos(a)*0.06,0,Math.sin(a)*0.06),q,sv.set(1,h,1)),'#a8a46a'];}));
  const bush=ffMerge(Array.from({length:6},(_,i)=>[new THREE.IcosahedronGeometry(0.45+gr()*0.3,0),i<2?'#2c3a22':'#3a4a2a',new THREE.Matrix4().compose(v.set((gr()-0.5)*0.9,0.35+gr()*0.4,(gr()-0.5)*0.9),q.identity(),sv.set(1,0.8,1))]));
  const twig=ffMerge([[new THREE.CylinderGeometry(0.03,0.045,1,5),'#4a3a28',new THREE.Matrix4().makeRotationZ(Math.PI/2)],[new THREE.CylinderGeometry(0.015,0.025,0.35,4),'#4a3a28',new THREE.Matrix4().compose(v.set(0.15,0.06,0.08),q.setFromEuler(e.set(0.6,0.8,1.0)),sv.set(1,1,1))]]);
  const mush=ffMerge([0,1,2].flatMap(i=>{const x=(gr()-0.5)*0.3,z=(gr()-0.5)*0.3,s=0.6+gr()*0.6;return [[new THREE.CylinderGeometry(0.02*s,0.025*s,0.1*s,5),'#d8ceb4',new THREE.Matrix4().makeTranslation(x,0.05*s,z)],[new THREE.ConeGeometry(0.07*s,0.05*s,7),i?'#8a4a2a':'#b0562e',new THREE.Matrix4().makeTranslation(x,0.115*s,z)]];}));
  const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95,side:THREE.DoubleSide});
  const matF=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.9,flatShading:true});
  const make=(geo,m,L,shadow)=>{if(!L.length)return;const im=new THREE.InstancedMesh(geo,m,L.length);
    L.forEach((o,i)=>{e.set(o.tx||0,o.r,o.tz||0);q.setFromEuler(e);sv.set(o.s,o.sy||o.s,o.s);M.compose(v.set(tx(o.x),GY(o.x,o.y)+(o.dy||0),tz(o.y)),q,sv);im.setMatrixAt(i,M);col.setHSL(o.h||0,o.sat||0,o.l||1);im.setColorAt(i,col);});
    im.castShadow=!!shadow;im.receiveShadow=true;g.add(im);};
  const T=[],B=[],K=[],U=[];
  // กอหญ้า: เป็นหย่อม ๆ (จุดศูนย์กลางสุ่ม + กระจายรอบ) โทนเขียวหม่นถึงเหลืองแห้ง • ไม่ขึ้นกลางทางดิน
  const tc=[];area(140,(x,y,d)=>tc.push([x,y]));
  for(const [cx,cy] of tc){const n=8+(R()*22|0),sp=40+R()*90;for(let i=0;i<n;i++){const a=R()*6.283,d=Math.sqrt(R())*sp,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d;if(!free(x,y,0))continue;
    T.push({x,y,s:0.7+R()*0.9,sy:0.6+R()*1.1,r:R()*6.283,tx:(R()-0.5)*0.2,tz:(R()-0.5)*0.2,h:0,sat:0,l:0.75+R()*0.45});}}
  area(700,(x,y,d)=>{if(d>25)T.push({x,y,s:0.6+R()*0.8,sy:0.5+R(),r:R()*6.283,l:0.7+R()*0.4});});
  // พุ่มใบ: รอบโคนต้นไม้บางต้น + กลางหย่อม
  for(let i=0;i<180;i++){const [bx,by]=trees[(R()*trees.length)|0],a=R()*6.283,d=40+R()*120,x=bx+Math.cos(a)*d,y=by+Math.sin(a)*d;if(free(x,y,1))B.push({x,y,s:0.7+R()*0.9,sy:0.6+R()*0.6,r:R()*6.283,l:0.8+R()*0.35,dy:-0.1});}
  area(380,(x,y,d)=>{if(d>35)K.push({x,y,s:0.6+R()*0.9,r:R()*6.283,dy:0.03,l:0.8+R()*0.3});});
  area(90,(x,y,d)=>{if(d>40)U.push({x,y,s:0.8+R()*0.8,r:R()*6.283,l:1});});
  make(tuft,mat,T,0);make(bush,matF,B,1);make(twig,matF,K,0);make(mush,matF,U,0);
  W.add(g);
}
// ซากปราสาทรอบจุดยึด 1 (ตำแหน่ง/ความสูงจาก genFcs js/02-fcs.js — ตรงกับวงชน): ก้อนหินก่อเรียงสลับแนว ยอดแหว่ง มอสเกาะ + หอกลมพัง + กองหินหล่น
function fcsRuin(W,F){
  const R=mulberry(4242),M=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),sv=new THREE.Vector3(),c=new THREE.Color();
  const B=[],D=[];   // B = ก้อนหินกล่อง {p,ry,s,col,rx,rz} • D = ก้อนโค้งของหอ/เสา
  const stoneC=()=>{const t=R();c.setHSL(0.28+R()*0.1,0.05+R()*0.05,0.17+R()*0.09);if(t<0.3)c.lerp(new THREE.Color('#3e4a26'),0.35+R()*0.35);return c.clone();};
  const moss=(col,y,h)=>{if(R()<(y<0.6?0.55:y>h-0.7?0.4:0.12))col.lerp(new THREE.Color('#3f4d22'),0.35+R()*0.4);return col;};
  const CH=0.55;
  for(const p of F.props){
    if(p[0]==='ru'){const [,x1,y1,x2,y2,th,hs]=p,X1=tx(x1),Z1=tz(y1),X2=tx(x2),Z2=tz(y2),L=Math.hypot(X2-X1,Z2-Z1),ry=-Math.atan2(Z2-Z1,X2-X1),n=hs.length,cw=L/n,T=th*S3;
      for(let i=0;i<n;i++)for(let k=0;k*CH<hs[i]-0.01;k++){
        const top=(k+1)*CH>=hs[i]-0.01;if(top&&R()<0.25)continue;   // ยอดแหว่ง
        const off=(k%2)*0.5*cw,t=(i+0.5)/n,bx=X1+(X2-X1)*t+Math.cos(-ry)*(off-0.25*cw)*0,bz=Z1+(Z2-Z1)*t;
        // อิฐสลับแนว: ชั้นคี่เลื่อนครึ่งก้อน (ตัดปลายไม่ให้ยื่นเลยกำแพง)
        const u=((i+0.5)*cw+(k%2?0.5*cw:0))/L;if(u>1)continue;const px=X1+(X2-X1)*u,pz=Z1+(Z2-Z1)*u,base=GY(x1+(x2-x1)*u,y1+(y2-y1)*u);
        const w=cw*(k%2&&(i===n-1)?0.5:0.97),jit=top?0.12:0.04;
        B.push({x:px+(R()-0.5)*0.05,y:base+k*CH+CH/2,z:pz+(R()-0.5)*0.05,ry:ry+(R()-0.5)*jit,rx:(R()-0.5)*jit,sx:w*(top?0.75+R()*0.25:1),sy:CH*0.96,sz:T*(0.9+R()*0.14),col:moss(stoneC(),k*CH,hs[i])});}
      // ฐานกว้างกว่านิดหน่อย (ฐานรากโผล่)
      for(let i=0;i<n;i++){const u=(i+0.5)/n;B.push({x:X1+(X2-X1)*u,y:GY(x1+(x2-x1)*u,y1+(y2-y1)*u)+0.12,z:Z1+(Z2-Z1)*u,ry,rx:0,sx:cw*1.02,sy:0.3,sz:T*1.35,col:moss(stoneC(),0,1)});}}
    else if(p[0]==='rt'){const [,x,y,r,h]=p,X=tx(x),Z=tz(y),G=GY(x,y),rr=r*S3,pillar=rr<1;
      if(pillar){let hh=0;for(let k=0;hh<h-0.05;k++){const dh=Math.min(0.7,h-hh);D.push({x:X+(R()-0.5)*0.04,y:G+hh+dh/2,z:Z,ry:R()*6.3,rx:(R()-0.5)*0.03,sx:rr*0.95,sy:dh*0.97,sz:rr*0.95,col:moss(stoneC(),hh,h)});hh+=dh;}
        B.push({x:X,y:G+0.15,z:Z,ry:R(),rx:0,sx:rr*2.6,sy:0.3,sz:rr*2.6,col:stoneC()});}
      else{const nb=Math.max(8,Math.round(6.283*rr/1.1));for(let k=0;k*CH<h;k++)for(let i=0;i<nb;i++){
          const a=(i+(k%2)*0.5)/nb*6.283,hk=h*(0.55+0.45*Math.cos(a-0.8+Math.sin(i*1.7)*0.3));if(k*CH>hk)continue;   // ยอดหอพังเป็นแนวเฉียง
          B.push({x:X+Math.cos(a)*rr*0.86,y:G+k*CH+CH/2,z:Z+Math.sin(a)*rr*0.86,ry:-a,rx:(R()-0.5)*0.04,sx:rr*0.34,sy:CH*0.96,sz:6.283*rr/nb*0.97,col:moss(stoneC(),k*CH,hk)});}
        D.push({x:X,y:G+0.2,z:Z,ry:0,rx:0,sx:rr*0.8,sy:0.4,sz:rr*0.8,col:stoneC()});}}
    else if(p[0]==='rp'){const [,x0,y0,cc,hs]=p,cw=cc*S3;   // raised platform: stone courses on the sides + flagstones on top, per node cell
      hs.forEach((row,j)=>row.forEach((h,i)=>{const cx=x0+i*cc,cy=y0+j*cc,X=tx(cx),Z=tz(cy),G=GY(cx,cy);
        B.push({x:X,y:G+h/2-0.06,z:Z,ry:0,rx:0,sx:cw,sy:h,sz:cw,col:stoneC()});   // body
        for(let k=0;k*CH<h-0.05;k++)for(const [dx,dz,ry] of [[0,-0.5,0],[0,0.5,0],[-0.5,0,Math.PI/2],[0.5,0,Math.PI/2]])for(let u=0;u<2;u++){   // side stones
          const off=(u+0.5)/2-0.5+(k%2)*0.25,px=X+dx*cw+(dz?off*cw:0),pz=Z+dz*cw+(dx?off*cw:0),dh=Math.min(CH,h-k*CH);
          if(Math.abs(off)>0.5)continue;B.push({x:px,y:G+k*CH+dh/2,z:pz,ry:ry+(R()-0.5)*0.05,rx:(R()-0.5)*0.04,sx:cw*0.48,sy:dh*0.95,sz:0.32,col:moss(stoneC(),k*CH,h)});}
        for(let a=0;a<2;a++)for(let b=0;b<2;b++){if(R()<0.12)continue;   // flagstones, a few missing (broken floor)
          B.push({x:X+(a-0.5)*cw*0.5,y:G+h+0.02,z:Z+(b-0.5)*cw*0.5,ry:(R()-0.5)*0.08,rx:(R()-0.5)*0.05,sx:cw*0.47,sy:0.14,sz:cw*0.47,col:moss(stoneC(),h,h)});}}));}
    else if(p[0]==='rr'){const [,x,y,s]=p,n=3+(R()*5|0);for(let i=0;i<n;i++){const a=R()*6.283,d=R()*1.4*s,bx=x+Math.cos(a)*d*20,by=y+Math.sin(a)*d*20,w=(0.35+R()*0.5)*s;
      B.push({x:tx(bx),y:GY(bx,by)+w*0.25,z:tz(by),ry:R()*6.3,rx:(R()-0.5)*0.6,sx:w*1.3,sy:w*0.6,sz:w,col:moss(stoneC(),0,1)});}}
  }
  const mk=(geo,L)=>{if(!L.length)return;const m=new THREE.MeshStandardMaterial({roughness:0.95,metalness:0,flatShading:true});
    const im=new THREE.InstancedMesh(geo,m,L.length);L.forEach((o,i)=>{e.set(o.rx,o.ry,o.rz||0);q.setFromEuler(e);M.compose(v.set(o.x,o.y,o.z),q,sv.set(o.sx,o.sy,o.sz));im.setMatrixAt(i,M);im.setColorAt(i,o.col);});
    im.castShadow=im.receiveShadow=true;W.add(im);};
  const box=new THREE.BoxGeometry(1,1,1),bp=box.attributes.position;for(let i=0;i<bp.count;i++){bp.setX(i,bp.getX(i)*(1-0.06*Math.abs(bp.getY(i))));}box.computeVertexNormals();   // ขอบมนนิด ๆ
  mk(box,B);mk(new THREE.CylinderGeometry(1,1,1,10),D);
}
// หมอก/แสงเฉพาะในป่า: ผสมตามตำแหน่งกล้อง (เรียกทุกเฟรมจาก sgSync)
function fcsForestTick(){
  const cx=(cam.position.x/S3+MW/2)/FCS_C,k=1-clamp((cx-(FF_X1-8))/9,0,1);
  if(FF.sky){FF.sky.visible=k>0.01;FF.sky.material.opacity=k*k*(3-2*k);FF.sky.position.copy(cam.position);if(SKY.day)SKY.sun.visible=k<0.6;}
  if(k<=0.001){if(FF.on&&FF.base){const B=FF.base;scene.fog.color.copy(B.fc);scene.fog.near=B.fn;scene.fog.far=B.ff;hemi.color.copy(B.hc);hemi.groundColor.copy(B.hg);hemi.intensity=B.hi;moonL.color.copy(B.mc);moonL.intensity=B.mi;}FF.on=false;FF.base=null;return;}
  if(!FF.base)FF.base={fc:scene.fog.color.clone(),fn:scene.fog.near,ff:scene.fog.far,hc:hemi.color.clone(),hg:hemi.groundColor.clone(),hi:hemi.intensity,mc:moonL.color.clone(),mi:moonL.intensity};
  FF.on=true;const B=FF.base,s=k*k*(3-2*k);
  scene.fog.color.copy(B.fc).lerp(FFC.fog,s);scene.fog.near=B.fn+(40-B.fn)*s;scene.fog.far=B.ff+(300-B.ff)*s;
  hemi.color.copy(B.hc).lerp(FFC.hemi,s);hemi.groundColor.copy(B.hg).lerp(FFC.gnd,s);hemi.intensity=B.hi*(1-0.1*s);
  moonL.color.copy(B.mc).lerp(FFC.sun,s);moonL.intensity=B.mi*(1-0.18*s);
}
const FFC={fog:new THREE.Color('#b3bfb2'),hemi:new THREE.Color('#d2dad0'),gnd:new THREE.Color('#47482f'),sun:new THREE.Color('#f3efdc')};
