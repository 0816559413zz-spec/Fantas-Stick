// =====================================================================
//  ชุดเครื่องมือ VFX กลาง (ขั้น 2 ของแผนอัปเกรด VFX)
//  1) ระบบหางแสง/รอยฟัน (trail) ตัวเดียวให้ทุกสกิลใช้ — 2 ชั้น (เรืองแสง/ทึบ) วาดทีเดียวทั้งหมด
//  2) สูตรเอฟเฟกต์เป็นข้อมูล (VFXR) + playFx(ชื่อ, x, y, h, {s,a,col}) — ซ้อนชั้น แกนขาว/ฮาโล/ประกาย/เส้นพุ่ง/วงกระแทก/เกล็ด/แสง
//  โหลดท้ายสุด: มีแต่คำนิยาม
// =====================================================================

// ---------- 1) หางแสง ----------
// trailNew({col,col2,w,life,sweep}) → h • trailPoint(h,X,Y,Z[,X2,Y2,Z2][,wk]) พิกัดโลก 3D (sweep = ริบบิ้นระหว่างจุด 2 จุด เช่นโคน-ปลายดาบ)
// trailStop(h) = หยุดเพิ่มจุด แล้วจางหายเอง • col = สีหัว, col2 = สีท้าย (ไล่ตามอายุจุด) • life = อายุแต่ละจุด (วิ)
const TRMAX=48,TRPTS=40,TRAILS=[];
let _trL=null;
function trailLayer(){if(_trL)return _trL;
  const V=TRMAX*TRPTS*2,g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(V*3),3));g.setAttribute('tcol',new THREE.BufferAttribute(new Float32Array(V*4),4));g.setAttribute('tuv',new THREE.BufferAttribute(new Float32Array(V*2),2));
  const idx=[];for(let t=0;t<TRMAX;t++)for(let i=0;i<TRPTS-1;i++){const a=(t*TRPTS+i)*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}g.setIndex(idx);
  const m=new THREE.ShaderMaterial({vertexShader:'attribute vec4 tcol;attribute vec2 tuv;varying vec4 vC;varying vec2 vU;void main(){vC=tcol;vU=tuv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec4 vC;varying vec2 vU;void main(){float x=1.0-abs(vU.y*2.0-1.0);float a=vC.a*smoothstep(0.0,0.55,x);vec3 c=mix(vC.rgb,vec3(1.0),pow(x,5.0)*0.55*vU.x);gl_FragColor=vec4(c*a,a);}',
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=5;g.userData.keep=m.userData.keep=true;
  _trL={g,mesh};return _trL;}
function trailNew(o){o=o||{};if(TRAILS.length>=TRMAX){const old=TRAILS.find(t=>t.stop)||TRAILS[0];TRAILS.splice(TRAILS.indexOf(old),1);}
  const h={pts:[],c1:hdr(o.col||'#bfeaff',o.k||1.6),c2:hdr(o.col2||o.col||'#5ab8ff',(o.k||1.6)*0.7),w:o.w||0.3,life:o.life||0.25,sweep:!!o.sweep,stop:false};TRAILS.push(h);return h;}
function trailPoint(h,X,Y,Z,X2,Y2,Z2,wk){if(!h||h.stop)return;const P=h.pts,last=P[P.length-1];
  if(last&&Math.abs(last.x-X)+Math.abs(last.y-Y)+Math.abs(last.z-Z)<0.03&&!h.sweep){last.age=0;return;}
  P.push({x:X,y:Y,z:Z,x2:X2,y2:Y2,z2:Z2,wk:wk===undefined?1:wk,age:0});if(P.length>TRPTS)P.shift();}
function trailStop(h){if(h)h.stop=true;}
const _tv1=new THREE.Vector3(),_tv2=new THREE.Vector3(),_tv3=new THREE.Vector3();
function updateTrails(dt){
  if(!TRAILS.length){if(_trL)_trL.mesh.visible=false;return;}
  const L=trailLayer();if(L.mesh.parent!==scene)scene.add(L.mesh);L.mesh.visible=true;
  const pos=L.g.attributes.position.array,col=L.g.attributes.tcol.array,uv=L.g.attributes.tuv.array;let n=0;
  for(let i=TRAILS.length-1;i>=0;i--){const T=TRAILS[i],P=T.pts;
    for(const p of P)p.age+=dt;while(P.length&&P[0].age>=T.life)P.shift();
    if(!P.length){if(T.stop)TRAILS.splice(i,1);continue;}}
  for(let t=0;t<TRAILS.length&&t<TRMAX;t++){const T=TRAILS[t],P=T.pts,base=t*TRPTS*2;
    for(let j=0;j<TRPTS;j++){const v=base+j*2;
      if(j>=P.length||P.length<2){for(const q of [v,v+1]){col[q*4+3]=0;pos[q*3]=pos[q*3+1]=pos[q*3+2]=0;}continue;}
      const p=P[j],u=1-p.age/T.life,c=T.c1,c2=T.c2,a=u*u*p.wk*(j===P.length-1?0.4:1);
      let ax,ay,az,bx,by,bz;
      if(T.sweep){ax=p.x;ay=p.y;az=p.z;bx=p.x2;by=p.y2;bz=p.z2;}
      else{const q0=P[Math.max(0,j-1)],q1=P[Math.min(P.length-1,j+1)];_tv1.set(q1.x-q0.x,q1.y-q0.y,q1.z-q0.z);_tv2.set(cam.position.x-p.x,cam.position.y-p.y,cam.position.z-p.z);
        _tv3.crossVectors(_tv1,_tv2).normalize().multiplyScalar(T.w*(0.35+0.65*u)*p.wk);ax=p.x+_tv3.x;ay=p.y+_tv3.y;az=p.z+_tv3.z;bx=p.x-_tv3.x;by=p.y-_tv3.y;bz=p.z-_tv3.z;}
      pos[v*3]=ax;pos[v*3+1]=ay;pos[v*3+2]=az;pos[v*3+3]=bx;pos[v*3+4]=by;pos[v*3+5]=bz;
      const r=c2.r+(c.r-c2.r)*u,g=c2.g+(c.g-c2.g)*u,b=c2.b+(c.b-c2.b)*u;
      for(const q of [v,v+1]){col[q*4]=r;col[q*4+1]=g;col[q*4+2]=b;col[q*4+3]=a;}
      uv[v*2]=u;uv[v*2+1]=0;uv[v*2+2]=u;uv[v*2+3]=1;}
    n=t+1;}
  L.g.setDrawRange(0,n*(TRPTS-1)*6);L.g.attributes.position.needsUpdate=L.g.attributes.tcol.needsUpdate=L.g.attributes.tuv.needsUpdate=true;
}

// ---------- 2) สูตรเอฟเฟกต์ (ข้อมูล) ----------
// ชั้น (t): flash แกนขาวแว้บ • halo ฮาโลสีขยาย • spark ประกาย 4 แฉก • streak เส้นพุ่งออก • flake เกล็ดผลึกหมุนลอยตก • ring วงกระแทกพื้น
//          shard เศษผลึก 3D • mist หมอก Glacier Mist • crown มงกุฎหนามน้ำแข็ง • light ไฟจุด • motes ฝุ่นแสงลอยขึ้นช้า ๆ
// ค่า: n จำนวน, sp ความเร็ว (px/วิ), life, size, col/c2 สีต้น/ท้าย, r รัศมี (px), s ขนาด • x:1 = ชั้นเสริม (ข้ามเมื่อกราฟิกประหยัด) • dl = หน่วงเวลา (วิ)
// ทุกค่าขนาด/รัศมี/ความเร็วคูณด้วย o.s (ขนาดของครั้งนั้น)
const VFXR={
  ice_hit:[{t:'flash',col:'#e8f8ff',s:0.9,life:0.12},{t:'spark',n:6,sp:160,life:0.4,size:2.4,col:'#ffffff',c2:'#5ab8ff'},{t:'streak',n:6,sp:320,life:0.22,size:2.6,col:'#dff6ff',c2:'#4aa0ff'},{t:'shard',n:4,sp:140},{t:'flake',n:4,x:1}],
  ice_impact:[{t:'flash',col:'#ffffff',s:1.6,life:0.14},{t:'halo',col:'#2f8cff',s:3.4,life:0.35},{t:'ring',col:'#3a9cff',r:90,life:0.35},{t:'ring',col:'#ffffff',r:50,life:0.22,x:1},
    {t:'streak',n:14,sp:520,life:0.28,size:3.2,col:'#ffffff',c2:'#3a90ff'},{t:'spark',n:12,sp:260,life:0.6,size:3,col:'#ffffff',c2:'#6ac8ff'},{t:'flake',n:10,x:1},{t:'shard',n:8,sp:220},{t:'light',col:'#8fe0ff',int:4,dist:12,life:0.3},{t:'motes',n:8,x:1,dl:0.1}],
  ice_big:[{t:'flash',col:'#ffffff',s:2.6,life:0.18},{t:'halo',col:'#2a7cff',s:5,life:0.5},{t:'ring',col:'#3a9cff',r:160,life:0.45},{t:'ring',col:'#ffffff',r:100,life:0.3,x:1},{t:'ring',col:'#2a6cff',r:220,life:0.6,dl:0.08,x:1},
    {t:'streak',n:24,sp:700,life:0.32,size:3.8,col:'#ffffff',c2:'#3a90ff'},{t:'spark',n:20,sp:340,life:0.7,size:3.4,col:'#ffffff',c2:'#6ac8ff'},{t:'flake',n:16,x:1},{t:'shard',n:12,sp:280},{t:'light',col:'#8fe0ff',int:6,dist:16,life:0.4},{t:'motes',n:14,x:1,dl:0.15}],
  ice_summon:[{t:'flash',col:'#dff6ff',s:1.2,life:0.16},{t:'halo',col:'#2f8cff',s:3,life:0.5},{t:'spark',n:10,sp:120,life:0.7,size:2.6,col:'#ffffff',c2:'#6ac8ff',up:1},{t:'flake',n:8,x:1},{t:'motes',n:10,x:1},{t:'light',col:'#8fe0ff',int:3,dist:10,life:0.4}],
  ice_charge:[{t:'halo',col:'#2f8cff',s:2,life:0.3},{t:'spark',n:6,sp:-150,life:0.35,size:2.2,col:'#ffffff',c2:'#6ac8ff'},{t:'motes',n:4,x:1}],
};
function playFx(name,x,y,h,o){o=o||{};const R=VFXR[name];if(!R)return;const s=o.s||1,ex=vfxExtra();
  for(const L of R){if(L.x&&!ex)continue;
    if(L.dl){later(L.dl,()=>fxLayer(L,x,y,h,s,o));continue;}
    vfxOnce(()=>fxLayer(L,x,y,h,s,o));}}
function fxLayer(L,x,y,h,s,o){
  const col=L.col,c2=L.c2;
  switch(L.t){
    case 'flash':FX.flashSprite(x,y,h,col,0.3*s,(L.s||1)*s*1.6,L.life||0.12,3);break;
    case 'halo':FX.flashSprite(x,y,h,col,0.5*s,(L.s||3)*s,L.life||0.4,1.4);break;
    case 'ring':ring(x,y,col,(L.r||80)*s,L.life||0.35,o.gh!==undefined?o.gh:0.15);break;
    case 'spark':case 'streak':{const n=Math.round((L.n||8)*Math.min(2,s));
      for(let i=0;i<n;i++){const an=o.a!==undefined&&L.dir?o.a+rnd(-0.6,0.6):rnd(0,6.283),v=(L.sp||200)*s*rnd(0.4,1),up=L.up?rnd(1,4):rnd(-1,3);
        PARTS.push({x:x+(v<0?Math.cos(an)*-v*0.35:0),y:y+(v<0?Math.sin(an)*-v*0.35:0),h:h+rnd(-0.15,0.15),vx:Math.cos(an)*v,vy:Math.sin(an)*v,vh:L.t==='streak'?rnd(-1,2.5):up,life:(L.life||0.4)*rnd(0.7,1.2),max:L.life||0.4,
          col,c2,size:(L.size||2.4)*rnd(0.7,1.3)*Math.sqrt(s),g:L.t==='streak'?2:1.5,drag:L.t==='streak'?4:2.5,sh:L.t==='streak'?2:1,rot:rnd(0,6.283),vr:L.t==='spark'?rnd(-4,4):0,fin:8});}break;}
    case 'flake':{const n=Math.round((L.n||6)*Math.min(2,s));
      for(let i=0;i<n;i++){const an=rnd(0,6.283),v=rnd(40,160)*s;PARTS.push({x,y,h:h+rnd(0,0.6),vx:Math.cos(an)*v,vy:Math.sin(an)*v,vh:rnd(1,3.5),life:rnd(0.9,1.5),max:1.4,col:'#eaf8ff',c2:'#6ab8ff',size:rnd(2.4,3.6)*Math.sqrt(s),g:2.2,drag:2.2,sh:4,rot:rnd(0,6.283),vr:rnd(-5,5),fin:6});}break;}
    case 'motes':{const n=Math.round((L.n||6)*Math.min(2,s));
      for(let i=0;i<n;i++){const an=rnd(0,6.283),d=rnd(10,70)*s;PARTS.push({x:x+Math.cos(an)*d,y:y+Math.sin(an)*d,h:Math.max(0.1,h+rnd(-0.6,0.4)),vx:rnd(-12,12),vy:rnd(-12,12),vh:rnd(0.4,1.1),life:rnd(1.2,2),max:1.8,col:'#cfefff',c2:'#3a80ff',size:rnd(1.2,1.9),g:-0.1,drag:1,sh:1,rot:rnd(0,6.283),vr:rnd(-2,2),fin:3});}break;}
    case 'shard':iceChips(x,y,h,Math.round((L.n||6)*Math.min(2,s)),(L.sp||180)*s,4);break;
    case 'mist':glacierMist(x,y,(L.r||60)*s,L.n||8,{h:Math.max(0,h-1),out:1.4*s});break;
    case 'crown':iceBurst(x,y,(L.s||1.5)*s,{h:Math.max(0,h-1)});break;
    case 'light':FX.flashLight(x,y,h,col,L.int||3,(L.dist||10)*Math.sqrt(s),L.life||0.3);break;
  }
}
function updateVfxKit(dt){updateTrails(dt);}
