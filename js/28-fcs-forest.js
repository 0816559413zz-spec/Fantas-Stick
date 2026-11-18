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
  const crates=F.props.filter(q=>q[0]==='cr'||q[0]==='pl').map(q=>[q[1],q[2]]);
  const items={};const put=(id,x,y,s,extra)=>{(items[id]=items[id]||[]).push(Object.assign({x,y,s,r:R()*6.283},extra||{}));};
  const free=(x,y,big)=>x>0&&y>0&&x<FF_X1*C&&y<H&&!wallAt(x,y)&&!(big&&(nearP(x,y,cores,180)||nearP(x,y,sps,150)))&&!nearP(x,y,crates,big?60:28);
  // ต้นไม้ชนได้ (ตำแหน่งเดิมของผู้ใช้): สนหลายพันธุ์ + ต้นใบแดง/ไม้ตายนิดหน่อย
  const pickTree=()=>{const q=R();return q<0.27?['pine_a',13+R()*5]:q<0.5?['pine_b',15+R()*5]:q<0.7?['pine_c',10+R()*4]:q<0.84?['pine_d',17+R()*6]:q<0.875?['autumn_a',6+R()*2]:q<0.9?['autumn_b',6+R()*2]:q<0.95?['snag_a',8+R()*3]:['snag_b',7+R()*2];};
  const hOf={pine_a:20.5,pine_b:26.3,pine_c:15.6,pine_d:31.1,pine_s:6.6,pine_la:24.3,pine_lb:19.5,snag_a:13,snag_b:9,autumn_a:11.4,autumn_b:9.8};
  for(const [x,y] of trees){const [id,h]=pickTree();put(id,x,y,h/hOf[id]);}
  // ผนังต้นไม้รอบขอบ (ไม่ชน): 2 แถว ห่าง ~3.3 ม. สนไกลเบา ๆ ปนสนจริง
  const edge=(x,y)=>{if(!free(x,y,0)||nearP(x,y,sps,110))return;const q=R(),far=R()<0.42;
    if(far)put(q<0.5?'pine_la':'pine_lb',x,y,(0.55+R()*0.45),{lean:1});
    else{const [id,h]=pickTree();put(id==='autumn_a'||id==='autumn_b'?'pine_a':id,x,y,h/hOf[id==='autumn_a'||id==='autumn_b'?'pine_a':id]*(0.9+R()*0.3),{lean:1});}};
  for(let row=0;row<2;row++){const d0=60+row*110;
    for(let y=40;y<H;y+=62+R()*28)edge(d0+R()*60,y+R()*30);                       // ตะวันตก
    for(let x=100;x<(FF_X1-3)*C;x+=62+R()*28){edge(x+R()*30,d0+R()*50);edge(x+R()*30,H-d0-R()*50);}}   // เหนือ/ใต้
  // สนอ่อน (ต้นเล็กแซมใต้ร่ม)
  for(let i=0;i<70;i++){const [bx,by]=trees[(R()*trees.length)|0],a=R()*6.283,d=70+R()*160,x=bx+Math.cos(a)*d,y=by+Math.sin(a)*d;if(free(x,y,1))put('pine_s',x,y,0.7+R()*0.7,{lean:1});}
  // เฟิร์น+พุ่ม เป็นกลุ่มรอบโคนต้นไม้และกลางหย่อม
  const scatter=(ids,n,spread,fn)=>{for(let i=0;i<n;i++){const [bx,by]=trees[(R()*trees.length)|0],a=R()*6.283,d=R()*spread,x=bx+Math.cos(a)*d,y=by+Math.sin(a)*d;if(!free(x,y,0))continue;if(x>(FF_X1-5)*C&&R()<0.7)continue;fn(ids[(R()*ids.length)|0],x,y);}};
  scatter(['fern_a','fern_b'],400,170,(id,x,y)=>put(id,x,y,0.9+R()*0.9));
  scatter(['shrub_a','shrub_b'],70,230,(id,x,y)=>{if(free(x,y,1))put(id,x,y,0.9+R()*0.7);});
  scatter(['stone_a','stone_b','stone_c'],190,260,(id,x,y)=>put(id,x,y,0.8+R()*1.4));
  scatter(['stump_a'],14,300,(id,x,y)=>{if(free(x,y,1))put(id,x,y,0.7+R()*0.5);});
  scatter(['log_a','log_b','log_c'],26,300,(id,x,y)=>{if(free(x,y,1))put(id,x,y,0.8+R()*0.5);});
  // หินก้อนใหญ่ตามไหล่เนิน/ขอบหน้าผา (ที่ชัน) + หินเล็กรอบ ๆ
  let nb=0;for(let t=0;t<2600&&nb<44;t++){const x=60+R()*(FF_X1*C-120),y=60+R()*(H-120);if(!free(x,y,1)||slope(x,y)<0.28)continue;
    const id=['boulder_a','boulder_b','boulder_c','boulder_d','boulder_a','cliff_a'][(R()*6)|0];put(id,x,y,0.7+R()*0.7);nb++;
    for(let q=0;q<3;q++){const a=R()*6.283,d=30+R()*60,sx=x+Math.cos(a)*d,sy=y+Math.sin(a)*d;if(free(sx,sy,0))put(['stone_a','stone_b','stone_c'][q],sx,sy,1+R()*1.4);}}
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
