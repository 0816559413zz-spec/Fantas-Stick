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
  const m=new THREE.ShaderMaterial({vertexShader:'attribute vec4 tcol;attribute vec2 tuv;varying vec4 vC;varying vec2 vU;varying float vVZ;void main(){vC=tcol;vU=tuv;vec4 mv=modelViewMatrix*vec4(position,1.0);vVZ=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:SOFT_GLSL+'varying vec4 vC;varying vec2 vU;void main(){float x=1.0-abs(vU.y*2.0-1.0);float a=vC.a*smoothstep(0.0,0.55,x)*softK(0.25);vec3 c=mix(vC.rgb,vec3(1.0),pow(x,5.0)*0.55*vU.x);gl_FragColor=vec4(c*a,a);}',
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  fxMat(m);const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=5;g.userData.keep=m.userData.keep=true;
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
  const L=trailLayer();if(L.mesh.parent!==fxScene)fxScene.add(L.mesh);L.mesh.visible=true;
  const pos=L.g.attributes.position.array,col=L.g.attributes.tcol.array,uv=L.g.attributes.tuv.array;let n=0;
  for(let i=TRAILS.length-1;i>=0;i--){const T=TRAILS[i],P=T.pts;
    for(const p of P)p.age+=dt;while(P.length&&P[0].age>=T.life)P.shift();
    if(!P.length){if(T.stop)TRAILS.splice(i,1);continue;}}
  for(let t=0;t<TRAILS.length&&t<TRMAX;t++){const T=TRAILS[t],P=T.pts,base=t*TRPTS*2;
    for(let j=0;j<TRPTS;j++){const v=base+j*2;
      if(j>=P.length||P.length<2){const e=P[P.length-1];for(const q of [v,v+1]){col[q*4+3]=0;pos[q*3]=e?e.x:0;pos[q*3+1]=e?e.y:0;pos[q*3+2]=e?e.z:0;}continue;}   // จุดว่างยุบไว้ที่ปลายหาง (เดิมไป (0,0,0) → เส้นจาง ๆ ลากไปกลางแมพ)
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

// ---------- 2) สูตรเอฟเฟกต์ = จานสี (ธาตุ) × แม่แบบ (ขนาด/ชนิด) ----------
// playFx('ธาตุ_แม่แบบ', x, y, h, {s, col, gh, a}) เช่น 'fire_impact' • ธาตุ 'col' = สร้างจานสีจาก o.col (สีอะไรก็ได้)
// ถ้ามีชื่อเต็มใน VFXR (สูตรเฉพาะ) จะใช้อันนั้นก่อน
// สีในชั้นใช้ตัวแทน: $core แกน • $hi สว่าง • $main สีหลัก • $deep เข้ม (ท้ายอายุ) • $light สีไฟจุด
const VFXPAL={
  ice:{core:'#ffffff',hi:'#dff6ff',main:'#9fe8ff',deep:'#2f8cff',light:'#8fe0ff',sig:'ice'},
  fire:{core:'#fff6dc',hi:'#ffd56a',main:'#ff9a2a',deep:'#e2440f',light:'#ff8a3a',sig:'fire'},
  storm:{core:'#ffffff',hi:'#fff6c0',main:'#ffe27a',deep:'#ff9a1a',light:'#ffe27a',sig:'storm'},
  nature:{core:'#f4ffe8',hi:'#c8ff9a',main:'#7dff6a',deep:'#2f9a3a',light:'#8ef07a',sig:'nature'},
  hex:{core:'#f6eaff',hi:'#e0b0ff',main:'#b57dff',deep:'#5a1aa8',light:'#b57dff',sig:'hex'},
  summon:{core:'#fff0fa',hi:'#ffc8ea',main:'#ff9ad5',deep:'#b03a8a',light:'#ff9ad5',sig:'hex'},
  earth:{core:'#fff4e0',hi:'#f0d0a0',main:'#d8a060',deep:'#7a4a22',light:'#ffb070',sig:'earth'},
  arcane:{core:'#ffffff',hi:'#e8f0ff',main:'#bfd4ff',deep:'#5a7cff',light:'#cfe0ff',sig:''},
  shield:{core:'#ffffff',hi:'#dffcff',main:'#7ff6ff',deep:'#1aa8c8',light:'#7ff6ff',sig:''},
  heal:{core:'#ffffff',hi:'#d8ffe4',main:'#7dff9a',deep:'#1a9a4a',light:'#7dff9a',sig:'nature'},
  // สายลม (ผู้ใช้ 2026-10-24, designs/wind_ref): ลมใส มิ้นต์-ขาว • ลมต้องสาป = ริบบิ้นดำ + เขียวเข้ม/นีออน (ใช้กับไม้ธาตุลม)
  wind:{core:'#ffffff',hi:'#d8fff4',main:'#7fe8c8',deep:'#2a9a86',light:'#9ff0d8',sig:''},
  curse:{core:'#b8ffd0',hi:'#4dff95',main:'#0c2a20',deep:'#010604',light:'#3aff8a',sig:''},
};
// แม่แบบ: ขนาด/ชนิดของเหตุการณ์ (ทุกธาตุใช้ร่วมกัน) + ชั้นเฉพาะธาตุ (VFXSIG) ต่อท้าย
const VFXTPL={
  pop:[{t:'flash',col:'$hi',s:0.5,life:0.08},{t:'spark',n:4,sp:120,life:0.3,size:2,col:'$core',c2:'$deep'}],
  hit:[{t:'flash',col:'$core',s:0.9,life:0.12},{t:'spark',n:6,sp:160,life:0.4,size:2.4,col:'$core',c2:'$deep'},{t:'streak',n:6,sp:320,life:0.22,size:2.6,col:'$hi',c2:'$deep'}],
  impact:[{t:'flash',col:'$core',s:0.9,life:0.12},{t:'halo',col:'$deep',s:2,life:0.3,k:0.8},{t:'ring',col:'$deep',r:80,life:0.35,op:0.5},{t:'ring',col:'$core',r:45,life:0.22,op:0.4,x:1},
    {t:'streak',n:14,sp:520,life:0.28,size:3.2,col:'$core',c2:'$deep'},{t:'spark',n:12,sp:260,life:0.6,size:3,col:'$core',c2:'$main'},{t:'light',col:'$light',int:2,dist:10,life:0.25},{t:'motes',n:8,x:1,dl:0.1}],
  big:[{t:'flash',col:'$core',s:1.2,life:0.14},{t:'halo',col:'$deep',s:2.8,life:0.4,k:0.8},{t:'ring',col:'$deep',r:130,life:0.45,op:0.45},{t:'ring',col:'$core',r:80,life:0.3,op:0.35,x:1},{t:'ring',col:'$deep',r:180,life:0.6,op:0.3,dl:0.08,x:1},
    {t:'streak',n:24,sp:700,life:0.32,size:3.8,col:'$core',c2:'$deep'},{t:'spark',n:20,sp:340,life:0.7,size:3.4,col:'$core',c2:'$main'},{t:'light',col:'$light',int:2.5,dist:12,life:0.3},{t:'motes',n:14,x:1,dl:0.15}],
  summon:[{t:'flash',col:'$hi',s:0.9,life:0.14},{t:'halo',col:'$deep',s:2.2,life:0.4,k:1},{t:'spark',n:10,sp:120,life:0.7,size:2.6,col:'$core',c2:'$main',up:1},{t:'motes',n:10,x:1},{t:'light',col:'$light',int:1.5,dist:9,life:0.3}],
  charge:[{t:'halo',col:'$deep',s:2,life:0.3},{t:'spark',n:6,sp:-150,life:0.35,size:2.2,col:'$core',c2:'$main'},{t:'motes',n:4,x:1}],
  heal:[{t:'halo',col:'$deep',s:2,life:0.4},{t:'spark',n:8,sp:60,life:0.9,size:2.4,col:'$core',c2:'$main',up:1},{t:'motes',n:6,x:1}],
};
// ชั้นเฉพาะธาตุ (ต่อท้ายแม่แบบ) — จำนวนคูณตามแม่แบบ (VFXSIGK): pop 0.3 • hit 0.5 • charge 0.4 • summon/heal 0.8 • impact 1 • big 1.6
const VFXSIG={
  ice:[{t:'flake',n:8,x:1},{t:'shard',n:6,sp:200}],
  fire:[{t:'ember',n:10},{t:'smoke',n:4,col:'#2e2a2a',x:1}],
  storm:[{t:'crackle',n:4},{t:'streak',n:6,sp:600,life:0.16,size:2.4,col:'#ffffff',c2:'$main'}],
  nature:[{t:'leaf',n:8}],
  hex:[{t:'swirl',n:8},{t:'smoke',n:3,col:'#2a1a3a',x:1}],
  earth:[{t:'smoke',n:6,col:'#6a5a48'},{t:'shard',n:5,sp:180,rock:1}],
};
const VFXSIGK={pop:0.3,hit:0.5,charge:0.4,summon:0.8,heal:0.8,impact:1,big:1.6};
// สูตรเฉพาะ (ชื่อเต็ม) — ใช้ก่อนแม่แบบ
const VFXR={
  parry:[{t:'flash',col:'#ffffff',s:1.6,life:0.14},{t:'ring',col:'#1aa8c8',r:110,life:0.4,op:0.5},{t:'streak',n:26,sp:700,life:0.3,size:3.4,col:'#ffffff',c2:'#1aa8c8'},{t:'spark',n:14,sp:300,life:0.6,size:3,col:'#ffffff',c2:'#7ff6ff'},{t:'motes',n:10,x:1}],
};
const _palCache={};
function palOf(name,col){if(name!=='col'&&VFXPAL[name])return VFXPAL[name];col=col||'#ffffff';if(_palCache[col])return _palCache[col];
  const c=new THREE.Color(col),hsl={};c.getHSL(hsl);const f=(l,s)=>'#'+new THREE.Color().setHSL(hsl.h,Math.min(1,hsl.s*s),l).getHexString();
  return _palCache[col]={core:'#ffffff',hi:f(Math.min(0.9,hsl.l+0.25),0.8),main:col,deep:f(Math.max(0.25,hsl.l-0.22),1.2),light:col,sig:''};}
function _pc(v,P){return typeof v==='string'&&v[0]==='$'?P[v.slice(1)]:v;}
function playFx(name,x,y,h,o){o=o||{};if(x===undefined||y===undefined||isNaN(x))return;
  if(fxTpl(name,x,y,h,o))return;   // แม่แบบเป็นไฟล์ assets/fx/tpl/ (แก้ในสตูดิโอได้) — ยังไม่โหลด = แบบโค้ดด้านล่าง
  let R=VFXR[name],P=VFXPAL.arcane,tpl=null;
  if(!R){const k=name.indexOf('_');tpl=name.slice(k+1);P=palOf(name.slice(0,k),o.col);R=VFXTPL[tpl];if(!R)return;}
  const s=o.s||1,ex=vfxExtra(),run=(L,m)=>{if(L.x&&!ex)return;if(L.dl)later(L.dl,()=>fxLayer(L,x,y,h,s,o,P,m));else vfxOnce(()=>fxLayer(L,x,y,h,s,o,P,m));};
  for(const L of R)run(L,1);
  if(tpl&&P.sig&&VFXSIG[P.sig]){const m=VFXSIGK[tpl]||1;for(const L of VFXSIG[P.sig])run(L,m);}
  // เอฟเฟกต์ทั้งจอ: ระเบิดใหญ่ใกล้เรา = สีเหลื่อมแว้บ
  if(tpl==='big'&&nearMe(x,y,700))screenKick(0.35*Math.min(1.5,s));
}
function nearMe(x,y,d){const me=myPos();return !me||Math.hypot(x-me.x,y-me.y)<d;}
function fxLayer(L,x,y,h,s,o,P,m){
  P=P||VFXPAL.arcane;m=m||1;const col=_pc(L.col,P),c2=_pc(L.c2,P),N=k=>Math.max(1,Math.round(k*m*Math.min(2,s)));
  switch(L.t){
    case 'flash':FX.flashSprite(x,y,h,col,0.3*s,(L.s||1)*Math.min(1.5,s)*1.4,L.life||0.12,2.2);break;
    case 'halo':FX.flashSprite(x,y,h,col,0.5*s,(L.s||3)*Math.min(1.5,s),L.life||0.4,L.k||1.2);break;
    case 'ring':SHAPES_Q.push({k:'ring',x,y,h:o.gh!==undefined?o.gh:0.15,col,s1:(L.r||80)*s*S3,life:L.life||0.35,op:L.op||0.5});break;
    case 'spark':case 'streak':{const n=N(L.n||8);
      for(let i=0;i<n;i++){const an=o.a!==undefined&&L.dir?o.a+rnd(-0.6,0.6):rnd(0,6.283),v=(L.sp||200)*s*rnd(0.4,1),up=L.up?rnd(1,4):rnd(-1,3);
        PARTS.push({x:x+(v<0?Math.cos(an)*-v*0.35:0),y:y+(v<0?Math.sin(an)*-v*0.35:0),h:h+rnd(-0.15,0.15),vx:Math.cos(an)*v,vy:Math.sin(an)*v,vh:L.t==='streak'?rnd(-1,2.5):up,life:(L.life||0.4)*rnd(0.7,1.2),max:L.life||0.4,
          col,c2,size:(L.size||2.4)*rnd(0.7,1.3)*Math.sqrt(s),g:L.t==='streak'?2:1.5,drag:L.t==='streak'?4:2.5,sh:L.t==='streak'?2:1,rot:rnd(0,6.283),vr:L.t==='spark'?rnd(-4,4):0,fin:8});}break;}
    case 'flake':{const n=N(L.n||6);
      for(let i=0;i<n;i++){const an=rnd(0,6.283),v=rnd(40,160)*s;PARTS.push({x,y,h:h+rnd(0,0.6),vx:Math.cos(an)*v,vy:Math.sin(an)*v,vh:rnd(1,3.5),life:rnd(0.9,1.5),max:1.4,col:'#eaf8ff',c2:'#6ab8ff',size:rnd(2.4,3.6)*Math.sqrt(s),g:2.2,drag:2.2,sh:4,rot:rnd(0,6.283),vr:rnd(-5,5),fin:6});}break;}
    case 'leaf':{const n=N(L.n||6);   // ใบไม้/กลีบ: เส้นสั้นหมุน ปลิวตก
      for(let i=0;i<n;i++){const an=rnd(0,6.283),v=rnd(60,200)*s;PARTS.push({x,y,h:h+rnd(0,0.5),vx:Math.cos(an)*v,vy:Math.sin(an)*v,vh:rnd(1,3),life:rnd(1,1.6),max:1.5,col:P.hi,c2:P.deep,size:rnd(2.6,3.6)*Math.sqrt(s),g:1.6,drag:2.4,sh:2,rot:rnd(0,6.283),vr:rnd(-6,6),fin:6});}break;}
    case 'ember':{const n=N(L.n||8);   // ไฟ: เปลวลอยขึ้น + ถ่านไฟเล็กกระเด็น
      for(let i=0;i<Math.ceil(n/2);i++){const an=rnd(0,6.283),v=rnd(30,120)*s;flame(x+Math.cos(an)*8,y+Math.sin(an)*8,Math.max(0.1,h-0.3),{vx:Math.cos(an)*v,vy:Math.sin(an)*v,vh:rnd(1,3),life:rnd(0.3,0.5),size:rnd(5,8)*Math.sqrt(s),g:-1.5,drag:3});}
      for(let i=0;i<n;i++){const an=rnd(0,6.283),v=rnd(80,320)*s;PARTS.push({x,y,h,vx:Math.cos(an)*v,vy:Math.sin(an)*v,vh:rnd(1,5),life:rnd(0.5,1.1),max:1,col:'#fff0b0',c2:'#ff3a10',size:rnd(1,1.6),g:3,drag:1.6,sh:2,fin:10});}break;}
    case 'crackle':{const n=N(L.n||3);   // สายฟ้า: สายฟ้าสั้นแตกออกจากจุด
      for(let i=0;i<n;i++){const an=rnd(0,6.283),d=rnd(40,110)*s;tbolt(x,y,h,x+Math.cos(an)*d,y+Math.sin(an)*d,Math.max(0.1,h+rnd(-1,0.6)),rnd(0.08,0.16),0,0.09,1);}break;}
    case 'swirl':{const n=N(L.n||6);   // คำสาป: ประกายหมุนวนเข้าหาจุด
      for(let i=0;i<n;i++){const an=rnd(0,6.283),d=rnd(40,90)*s,v=rnd(120,220)*s;PARTS.push({x:x+Math.cos(an)*d,y:y+Math.sin(an)*d,h:h+rnd(-0.3,0.6),vx:-Math.sin(an)*v-Math.cos(an)*v*0.4,vy:Math.cos(an)*v-Math.sin(an)*v*0.4,vh:rnd(0,1),life:rnd(0.5,0.8),max:0.7,col:P.hi,c2:P.deep,size:rnd(2,3),g:0,drag:1.5,sh:1,rot:rnd(0,6.283),vr:rnd(-6,6),fin:6});}break;}
    case 'smoke':smoke(x,y,Math.max(0.2,h-0.4),N(L.n||4),L.col||'#3a3640',1.2,6*Math.sqrt(s),70*s);break;
    case 'motes':{const n=N(L.n||6);
      for(let i=0;i<n;i++){const an=rnd(0,6.283),d=rnd(10,70)*s;PARTS.push({x:x+Math.cos(an)*d,y:y+Math.sin(an)*d,h:Math.max(0.1,h+rnd(-0.6,0.4)),vx:rnd(-12,12),vy:rnd(-12,12),vh:rnd(0.4,1.1),life:rnd(1.2,2),max:1.8,col:P.hi,c2:P.deep,size:rnd(1.2,1.9),g:-0.1,drag:1,sh:1,rot:rnd(0,6.283),vr:rnd(-2,2),fin:3});}break;}
    case 'shard':if(L.rock){for(let i=0;i<N(L.n||5);i++){const an=rnd(0,6.283),v=rnd(80,(L.sp||180))*s;PARTS.push({x,y,h,vx:Math.cos(an)*v,vy:Math.sin(an)*v,vh:rnd(2,5),life:rnd(0.6,1),max:1,col:'#8a6a4a',size:rnd(2.4,3.6),g:9,drag:1,smoke:true});}}
      else iceChips(x,y,h,N(L.n||6),(L.sp||180)*s,4);break;
    case 'mist':glacierMist(x,y,(L.r||60)*s,L.n||8,{h:Math.max(0,h-1),out:1.4*s});break;
    case 'crown':iceBurst(x,y,(L.s||1.5)*s,{h:Math.max(0,h-1)});break;
    case 'light':FX.flashLight(x,y,h,col,L.int||3,(L.dist||10)*Math.sqrt(s),L.life||0.3);break;
  }
}

// ---------- 3) ผูกเอฟเฟกต์ซ้อนชั้นกับเหตุการณ์ของทุกสาย (เพิ่มทับของเดิม ไม่ลบหน้าตาเดิม) ----------
// [สูตร, ขนาด, ult] • ult=1 = อัลติ/ท่าใหญ่: ถ้าเป็นของเรา → เบลอพุ่งเข้าหาจุด + แฟลชจอ
const EFXAUG={
  // สายน้ำแข็ง (ส่วนใหญ่เรียก playFx เองอยู่แล้วใน efxFX)
  slam:['ice_impact',1],slamgo:['ice_charge',1],auhit:['ice_pop',1],aura:['ice_summon',1],mirrorend:['ice_impact',1],freeze:['ice_hit',0.8],fswap:['ice_pop',1],mirror:['',1,1],
  // สายไฟ
  kindle:['fire_summon',1],dfrise:['fire_charge',1.4,1],dfdive:['fire_charge',1],dfboom:['fire_big',1.2],dfcancel:['fire_pop',1],fblock:['fire_hit',0.9],
  orbget:['fire_pop',1],orbshot:['fire_pop',0.8],orbhit:['fire_hit',0.9],bigboom:['fire_big',1.2],ering:['fire_impact',1.2],eringhit:['fire_pop',1],
  blaze:['fire_summon',1.2,1],snapwind:['fire_charge',1],snap:['fire_hit',1],snapboom:['fire_big',1.1],colossus:['fire_big',1,1],colbolt:['fire_hit',1],
  colboom:['fire_impact',1.2],colend:['fire_impact',1],pboom:['fire_impact',1],ember:['fire_pop',1],inferno:['fire_big',1],melt:['fire_hit',0.8],flare:['fire_impact',1],
  // สายฟ้า
  stgain:['storm_pop',0.8],stri:['storm_hit',1],sdash:['storm_charge',1],sdashe:['storm_hit',1],sdhit:['storm_hit',1],ston:['storm_summon',1],sthit:['storm_pop',1],
  stoff:['storm_pop',1],stblast:['storm_impact',1.1],slup:['storm_summon',0.9],sline:['storm_impact',1],sorbon:['storm_summon',0.8],
  sorbgo:['storm_pop',1],sorbhit:['storm_hit',1],sorboff:['storm_pop',1],srailc:['storm_charge',1.2],srail:['storm_impact',1.3],tstrike:['storm_impact',1.1],
  sdrise:['storm_charge',1.4,1],sdball:['storm_summon',1.2],sdome:['storm_big',1.2],sdboom:['storm_big',1.2],godon:['storm_big',1,1],godoff:['storm_impact',1],
  // สายอื่น (ยังเป็นแบบชั่วคราว)
  wallbreak:['earth_impact',1],wallhit:['earth_hit',1],vine:['nature_hit',1],thorn:['nature_impact',1],worldtree:['nature_big',1.2,1],wispheal:['heal_heal',1],
  silence:['hex_hit',1],terror:['hex_impact',1],blind:['hex_hit',1],mark:['hex_pop',1.2],curse:['hex_impact',1],siphon:['hex_hit',1],soulburst:['hex_big',1.2,1],
  summon:['summon_summon',1],unsummon:['summon_pop',1.2],legion:['summon_big',1.2,1],
};
// ชนิดกระสุน → ธาตุ (ไม่อยู่ในรายการ = สร้างจานสีจากสีกระสุน PCOL)
const PJPAL={fire:'fire',pfire:'fire',pfireb:'fire',spark:'fire',ember:'fire',zap:'storm',stun:'storm',ice:'ice',icicle:'ice',iceboulder:'ice',spike:'ice',
  vine:'nature',dart:'nature',ebolt:'nature',hex:'hex',pull:'hex',web:'arcane'};
function pjPal(t){return PJPAL[t]||'col';}
const ULTCOL={mirror:'#8fe0ff'};
function efxAug(ev){const A=EFXAUG[ev.z];if(!A)return;const H=ev.h!==undefined?ev.h:1;
  if(A[0]&&VFXAUG_ON)playFx(A[0],ev.x,ev.y,H,{s:A[1]});
  if(A[2]&&ev.id!==undefined&&ev.id===NET.myId&&ev.x!==undefined){screenRadial(ev.x,ev.y,H,1,0.55);screenFlash(ULTCOL[ev.z]||palOf(A[0].split('_')[0]).main,0.04,0.3);}}
// เหตุการณ์ทั่วไป: เรียกจาก fx(ev) ทุก event
let VFXAUG_ON=true;   // ปิดชั่วคราวเพื่อเทียบกับภาพเดิม (WD.vfxAug(false))
function fxAug(ev,H){if(!VFXAUG_ON&&ev.k!=='hit')return;
  switch(ev.k){
    case 'efx':efxAug(ev);break;
    case 'cast':if(ev.x!==undefined){const [wx,wy]=wandPos(ev);playFx(pjPal(ev.t)+'_pop',wx,wy,H,{s:0.6,col:PCOL[ev.t]});}break;
    case 'pop':playFx(pjPal(ev.t)+'_pop',ev.x,ev.y,H,{s:0.9,col:PCOL[ev.t]});break;
    case 'imp':playFx(pjPal(ev.t)+'_hit',ev.x,ev.y,H,{s:0.9,col:PCOL[ev.t]});break;
    case 'boom':playFx('fire_big',ev.x,ev.y,H,{s:1.1});break;
    case 'parry':playFx('parry',ev.x,ev.y,H);if(nearMe(ev.x,ev.y,500)){screenKick(0.5);screenFlash('#7ff6ff',0.06,0.18);}break;
    case 'block':playFx('shield_pop',ev.x,ev.y,H,{s:1.2});break;
    case 'sbreak':playFx('shield_impact',ev.x,ev.y,H);break;
    case 'die':playFx('col_impact',ev.x,ev.y,H,{col:ev.c||'#ffffff',s:1.1});break;
    case 'nova':playFx('col_big',ev.x,ev.y,H,{col:'#ffd86b'});break;
    case 'kill':if(nearMe(ev.x,ev.y,1000))playFx('heal_big',ev.x,ev.y,1.3);break;
    case 'revive':if(nearMe(ev.x,ev.y,700))playFx('heal_summon',ev.x,ev.y,1,{s:0.8});break;
    case 'buff':if(ev.x!==undefined)playFx('arcane_summon',ev.x,ev.y,H,{s:0.8});break;
    case 'land':playFx('earth_pop',ev.x,ev.y,0.3,{s:1.2});break;
    case 'hit':if(ev.id===NET.myId&&!ev.b)screenHurt(Math.min(1,0.3+(ev.n||5)/40));break;
  }
}

// ---------- 3b) สนามรบ (designs/battlefield.md ขั้น 1, แบบ C): ทุกสกิลทิ้งควัน/ฝุ่น/ไอเย็นตามธาตุ ----------
// ไฟล์ assets/fx/env/bf_<ธาตุ>(_air|_trail|_cast) สร้างจาก tools/bf-skill-gen.py • ขนาด s: 0.6 โดน / 1 ระเบิด / 1.5 ใหญ่
// เรียกจาก fx(ev) ทุก event (ก่อน bind.json → ใช้ได้แม้ท่านั้นถูก replace) • ภาพบนเครื่องตัวเองล้วน ไม่แตะโปรโตคอล
const BF_EL={fire:1,storm:1,earth:1,ice:1},BF_CLS={pop:0.45,hit:0.6,impact:1,big:1.5};
// ท่าที่ไม่อยู่ใน EFXAUG: [ธาตุ, s] (epunch ใช้จุดหมัด x2,y2)
const BF_EXTRA={iceboom:['ice',1.2],glacier:['ice',1],slam3:['ice',1.3],gwave:['ice',1],
  epunch:['earth',0.6],eslam:['earth',1.2],ecbslam:['earth',1.3],ecrush:['earth',1.2],epilland:['earth',1],ewland:['earth',1],eaugboom:['earth',1.3],
  esbhit:['earth',0.8],erhit:['earth',0.6],ewallup:['earth',0.8],estdbreak:['earth',1],ebreakw:['earth',0.8]};
const BF={on:true,last:new Map()};
function bfAfter(ev,H){if(!BF.on||ev.x===undefined||isNaN(ev.x))return;
  let el=null,s=1,x=ev.x,y=ev.y,h=H;
  if(ev.k==='efx'){const X=BF_EXTRA[ev.z];
    if(X){[el,s]=X;if(ev.x2!==undefined){x=ev.x2;y=ev.y2;}if(ev.h===undefined)h=0;}
    else{const A=EFXAUG[ev.z];if(!A||!A[0])return;const [e,c]=A[0].split('_');el=e;
      if(c==='charge'||c==='summon'){if(el==='fire'||el==='ice')bfPlay('bf_'+el+'_cast',el,x,y,h,1);return;}
      s=(BF_CLS[c]||0.8)*(A[1]||1);}}
  else if(ev.k==='imp'||ev.k==='pop'){el=pjPal(ev.t);s=ev.k==='imp'?0.6:0.45;}
  else if(ev.k==='boom'){el='fire';s=1.4;}
  else if(ev.k==='cast'){el=pjPal(ev.t);if(el==='fire'||el==='ice'){const [wx,wy]=wandPos(ev);bfPlay('bf_'+el+'_cast',el,wx,wy,h,1);}return;}
  else return;
  if(!BF_EL[el])return;
  if(h<=Math.max(0.6,s)){   // รอยบนหญ้า/พื้นทั้งแมตช์ (js/50) + รอยภาพ + เศษโปรย เฉพาะที่โดนใกล้พื้น (ตีโดนตัวกลางอากาศ = ไม่มีรอย) — ทาทุกครั้ง ไม่ติดกันซ้อน/ระยะของ bfPlay
    grassScar(x,y,el,s);bfMark(x,y,el,s);const R=16+36*s;
    if(el==='earth')bfScatter(x,y,R,3+7*s*s,'rock',0.7+0.4*s);
    else if(el==='fire'&&s>=0.9)bfScatter(x,y,R,4*s,'char',0.8);
    else if(el==='ice')bfScatter(x,y,R,2+4*s,'ice',0.6+0.4*s);
    else if(el==='storm'&&s>=0.9)bfScatter(x,y,R*0.6,2*s,'char',0.6);}
  bfPlay('bf_'+el+(h>2.5?'_air':''),el,x,y,h,s);}
// กันซ้อนถี่: จุดเดียวกัน (ช่อง 40 px) ธาตุเดียวกัน เล่นได้ทุก 0.25 วิ • ไกลกว่า ~80 ม. ไม่เล่น
function bfPlay(name,el,x,y,h,s){if(!nearMe(x,y,1600))return;
  const k=name+'|'+Math.round(x/40)+'|'+Math.round(y/40),t=performance.now(),o=BF.last.get(k);if(o&&t-o<250)return;
  BF.last.set(k,t);if(BF.last.size>400)BF.last.clear();
  fxPlay('env/'+name,{x,y,h,s});}
// ---------- 3c) สนามรบ ขั้น 2: รอยค้างบนพื้น + ซากรก ๆ ค้างทั้งแมตช์ (ล้างเมื่อเริ่มแมตช์ใหม่ — bfClear จาก setScreen js/19) ----------
// รอย = InstancedMesh เดียว ภาพ assets/fx/tex/bf_marks.png (4×2 ช่อง จาก tools/bf-mark-gen.py) • ทุกรอยเก็บ {x,y,el,r} ไว้ใน BFM.at (ไว้เปลี่ยนเป็นหลุมจริงทีหลัง)
// ซาก = ชิ้นที่ตกนิ่งแล้ว (DEBRIS js/23, rockChunks js/42, bfScatter) ย้ายเข้า InstancedMesh ต่อ (geometry, วัสดุ) → วาดถูก ค้างได้เป็นพัน • สตูดิโอ VFX = ไม่ค้าง (หดหายแบบเดิม)
const BFM={MAX:300,N:{high:300,auto:190,low:80},mesh:null,attr:null,n:0,head:0,at:[],grow:[]};
const BF_MK={fire:[0,1],storm:[2,3],earth:[4,5],ice:[6,7]},BF_MKA={fire:0.92,storm:0.88,earth:0.85,ice:0.82},BF_MKR={fire:1,storm:1.1,earth:1.05,ice:1.1};
function bfMarkMesh(){if(BFM.mesh)return BFM.mesh;
  const t=new THREE.TextureLoader().load('assets/fx/tex/bf_marks.png?v='+(((FXR.index.tex||{}).bf_marks||{}).v||''));t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.userData.keep=true;
  const geo=new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2);geo.userData.keep=true;
  BFM.attr=new THREE.InstancedBufferAttribute(new Float32Array(BFM.MAX*3),3);geo.setAttribute('aMk',BFM.attr);
  const m=new THREE.MeshLambertMaterial({map:t,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});m.userData.keep=true;
  m.onBeforeCompile=s=>{s.vertexShader='attribute vec3 aMk;varying float vMkA;\n'+s.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvMapUv=vMapUv*vec2(0.25,0.5)+aMk.xy;vMkA=aMk.z;');
    s.fragmentShader='varying float vMkA;\n'+s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.a*=vMkA;');};
  const M=new THREE.InstancedMesh(geo,m,BFM.MAX);M.count=0;M.frustumCulled=false;M.receiveShadow=true;M.renderOrder=1;scene.add(M);return BFM.mesh=M;}
const _bfQ=new THREE.Quaternion(),_bfQ2=new THREE.Quaternion(),_bfN=new THREE.Vector3(),_bfUp=new THREE.Vector3(0,1,0),_bfS=new THREE.Vector3(),_bfP=new THREE.Vector3(),_bfMx=new THREE.Matrix4();
// รอยค้าง ณ จุดเกม x,y (ธาตุ el, ขนาด s 0.45–1.8) • จุดเดิมธาตุเดิมซ้ำ = เข้มขึ้นแทนการซ้อนรอยใหม่ • เอียงตามเนินพื้น
function bfMark(x,y,el,s){const C=BF_MK[el];if(!C||FXSTUDIO.own)return;const M=bfMarkMesh();
  const r=(0.75+1.9*s)*BF_MKR[el],a=BF_MKA[el]*Math.min(1,0.6+0.3*s);
  for(let i=0;i<BFM.n;i++){const q=BFM.at[i];if(q&&q.el===el&&q.r>=r*0.75&&Math.hypot(q.x-x,q.y-y)*S3<r*0.45){q.a=Math.min(1,q.a+0.2);if(!BFM.grow.includes(i))BFM.grow.push(i);return;}}
  const cap=Math.min(BFM.MAX,BFM.N[QUAL.mode]||190);let i;if(BFM.n<cap)i=BFM.n++;else{i=BFM.head%cap;BFM.head=(BFM.head+1)%cap;}
  const d=r/S3,gx=(GY(x+d,y)-GY(x-d,y))/(2*r),gz=(GY(x,y+d)-GY(x,y-d))/(2*r);
  _bfN.set(-gx,1,-gz).normalize();_bfQ.setFromUnitVectors(_bfUp,_bfN);_bfQ2.setFromAxisAngle(_bfUp,Math.random()*6.283);_bfQ.multiply(_bfQ2);
  _bfMx.compose(_bfP.set(tx(x),GY(x,y)+0.015,tz(y)),_bfQ,_bfS.set(r*(Math.random()<0.5?-1:1),1,r));M.setMatrixAt(i,_bfMx);M.instanceMatrix.needsUpdate=true;
  const c=C[Math.random()*C.length|0];BFM.attr.setXYZ(i,(c%4)*0.25,c<4?0.5:0,0);BFM.attr.needsUpdate=true;
  BFM.at[i]={x,y,el,r,a,a0:0};if(!BFM.grow.includes(i))BFM.grow.push(i);M.count=BFM.n;}
function updateBfMarks(dt){if(!BFM.grow.length)return;
  for(let k=BFM.grow.length-1;k>=0;k--){const i=BFM.grow[k],q=BFM.at[i];if(!q){BFM.grow.splice(k,1);continue;}
    q.a0=Math.min(q.a,q.a0+dt*2.2);BFM.attr.setZ(i,q.a0);if(q.a0>=q.a)BFM.grow.splice(k,1);}
  BFM.attr.needsUpdate=true;}
// ซากนิ่ง: pool ต่อ (geometry, วัสดุ) • แต่ละ pool โตทีละเท่าจนถึงเพดานตามกราฟิก แล้ววนทับชิ้นเก่าสุด • จำนวน pool เกินเพดาน = ทิ้ง pool เก่าสุด
const BFRS={N:{high:700,auto:420,low:120},P:{high:140,auto:90,low:30},M:{high:400,auto:250,low:80},pools:new Map(),smoke:[],bins:new Map(),big:[],dirty:false,reT:0,nCol:0};
function bfRestPool(geo,mat){const k=geo.uuid+'|'+mat.uuid;let p=BFRS.pools.get(k);if(p)return p;
  const cap=8,M=new THREE.InstancedMesh(geo,mat,cap);M.count=0;M.frustumCulled=false;M.castShadow=QUAL.mode!=='low';M.receiveShadow=true;scene.add(M);
  p={k,M,cap,n:0,head:0};BFRS.pools.set(k,p);
  if(BFRS.pools.size>(BFRS.P[QUAL.mode]||90)){const [k0,p0]=BFRS.pools.entries().next().value;scene.remove(p0.M);p0.M.dispose();BFRS.pools.delete(k0);}
  return p;}
function bfRestAdd(geo,mat,mx){const p=bfRestPool(geo,mat),max=BFRS.N[QUAL.mode]||420;
  if(p.n>=p.cap&&p.cap<max){const cap=Math.min(max,p.cap*2),M=new THREE.InstancedMesh(geo,mat,cap);M.instanceMatrix.array.set(p.M.instanceMatrix.array);
    M.frustumCulled=false;M.castShadow=p.M.castShadow;M.receiveShadow=true;scene.remove(p.M);p.M.dispose();scene.add(M);p.M=M;p.cap=cap;}
  let i;if(p.n<p.cap)i=p.n++;else{i=p.head;p.head=(p.head+1)%p.cap;}
  p.M.setMatrixAt(i,mx);p.M.count=p.n;p.M.instanceMatrix.needsUpdate=true;}
// ชิ้นใหญ่รูปทรงไม่ซ้ำ (ชิ้นผนังจากไฟล์บ้าน) = รวม mesh ต่อวัสดุ (bin) สร้างใหม่ทีละช่วงตอนมีชิ้นเพิ่ม • เกินเพดาน = ทิ้งชิ้นเก่าสุด
function bfBinAdd(m){const g=m.geometry,key=m.material.uuid+'|'+Object.keys(g.attributes).sort().join(',')+'|'+(g.index?1:0);
  let b=BFRS.bins.get(key);if(!b)BFRS.bins.set(key,b={mat:m.material,geos:[],mesh:null});
  const c=g.clone();for(const k in c.morphAttributes)delete c.morphAttributes[k];c.applyMatrix4(m.matrixWorld);b.geos.push(c);BFRS.big.push(b);BFRS.dirty=true;
  const max=BFRS.M[QUAL.mode]||250;while(BFRS.big.length>max){const o=BFRS.big.shift(),q=o.geos.shift();if(q)q.dispose();}}
function bfBinBuild(){BFRS.dirty=false;for(const b of BFRS.bins.values()){
  if(b.mesh){scene.remove(b.mesh);b.mesh.geometry.dispose();b.mesh=null;}if(!b.geos.length)continue;
  const g=mergeGeometries(b.geos,false);if(!g)continue;b.mesh=new THREE.Mesh(g,b.mat);b.mesh.castShadow=QUAL.mode!=='low';b.mesh.receiveShadow=true;scene.add(b.mesh);}}
// ย้ายวัตถุที่ตกนิ่งแล้ว (mesh หรือ group) เข้า pool แล้วเอาออกจากฉาก • คืน false = ไม่ค้าง (สตูดิโอ) ให้คนเรียกจัดการเอง
// smo = จุดควันกรุ่น (ซากที่โดนไฟ) • big = ชิ้นรูปทรงไม่ซ้ำ → รวม mesh (bin) • ชิ้นวัสดุหลายแบบ (array) ใส่ไม่ได้ → ข้าม
function bfRest(o,smo,big){if(FXSTUDIO.own||!BF.on)return false;
  o.updateMatrixWorld(true);o.traverse(m=>{if(m.isMesh&&m.visible&&!Array.isArray(m.material)){if(big)bfBinAdd(m);else bfRestAdd(m.geometry,m.material,m.matrixWorld);}});
  if(o.parent)o.parent.remove(o);
  if(smo&&BFRS.smoke.length<30){const q=simOf(o.position);BFRS.smoke.push({x:q.x,y:q.y,h:q.h,t:rnd(10,22),acc:Math.random()});}
  return true;}
// เศษเล็กโปรยนิ่งรอบจุด (ไม่มีฟิสิกส์ — ใส่ pool ทันที): กรวด/หิน/ไม้/น้ำแข็ง ให้พื้นรก ๆ แบบสนามรบ • kind: 'rock' | 'ice' | 'char' | mats = [วัสดุ...]
function bfScatter(x,y,R,n,kind,size){if(FXSTUDIO.own||!BF.on||!nearMe(x,y,1800))return;n=Math.round(n*(QUAL.mode==='low'?0.35:QUAL.mode==='high'?1:0.7));
  const mats=Array.isArray(kind)?kind:null,sz=size||1;
  for(let k=0;k<n;k++){const an=Math.random()*6.283,d=Math.sqrt(Math.random())*R,px=x+Math.cos(an)*d,py=y+Math.sin(an)*d;let geo,mat,s;
    if(kind==='ice'){geo=sGeo(THREE.OctahedronGeometry,1,0);mat=bldIceMat();s=rnd(0.06,0.18)*sz;_bfS.set(s,s*rnd(0.4,1.4),s);}
    else if(mats){geo=sGeo(THREE.BoxGeometry,1,1,1);mat=mats[k%mats.length];s=rnd(0.08,0.3)*sz;const pl=Math.random()<0.35;_bfS.set(pl?s*0.4:s,s*rnd(0.35,0.7),pl?s*3.5:s*rnd(0.7,1.3));}
    else{geo=_rockGeo;mat=kind==='char'?charMat(_rockMat()):_rockMat();s=(Math.random()<0.75?rnd(0.04,0.1):rnd(0.12,0.24))*sz;_bfS.set(s*rnd(0.8,1.3),s*rnd(0.5,0.9),s*rnd(0.8,1.3));}
    _bfQ.setFromEuler(new THREE.Euler(rnd(-0.5,0.5),Math.random()*6.283,rnd(-0.5,0.5)));
    _bfMx.compose(_bfP.set(tx(px),GY(px,py)+_bfS.y*0.3,tz(py)),_bfQ,_bfS);bfRestAdd(geo,mat,_bfMx);}}
function _rockMat(){return _rockM||(_rockM=new THREE.MeshStandardMaterial({color:'#3d3833',roughness:1,flatShading:true}));}
// ฝุ่นก้อนใหญ่ตอนตึก/บ้านถล่มทั้งหลัง (w,d = ขนาดพิกเซลเกม) • charred = เคยโดนไฟ → ควันกรุ่น + รอยไหม้
function bfCollapse(x,y,w,d,charred){if(!BF.on||!nearMe(x,y,2400))return;BFRS.nCol++;const s=clamp(Math.max(w,d)/180,0.8,2.6);
  fxPlay('env/bf_collapse',{x,y,h:0,s});
  const R=Math.max(w,d)*0.6;bfScatter(x,y,R,30*s,'rock',1.2);
  for(let k=0;k<5;k++){const an=Math.random()*6.283,dd=Math.sqrt(Math.random())*R*0.8;bfMark(x+Math.cos(an)*dd,y+Math.sin(an)*dd,charred?'fire':'earth',1.2+Math.random()*0.5);}
  if(charred)for(let k=0;k<6&&BFRS.smoke.length<46;k++)BFRS.smoke.push({x:x+rnd(-w,w)*0.35,y:y+rnd(-d,d)*0.35,h:1,t:rnd(18,30),acc:Math.random(),big:1});}
// ควันกรุ่นจากซากที่โดนไฟ (ค่อย ๆ จางจนหมด)
function updateBfRest(dt){const S=BFRS.smoke;
  if(BFRS.dirty&&(BFRS.reT-=dt)<=0){BFRS.reT=0.4;bfBinBuild();}   // ชิ้นใหญ่ที่เพิ่งนิ่ง → รวม mesh ใหม่ (ไม่เกินทุก 0.4 วิ)
  for(let i=S.length-1;i>=0;i--){const q=S[i];q.t-=dt;if(q.t<=0){S.splice(i,1);continue;}
    q.acc+=dt*(q.big?1.4:0.7)*Math.min(1,q.t/6);if(q.acc<1||!nearMe(q.x,q.y,1400))continue;q.acc-=1;
    smoke(q.x+rnd(-8,8),q.y+rnd(-8,8),q.h,1,Math.random()<0.5?'#3a3430':'#55504a',q.big?3:2.2,q.big?11:6,12);
    if(Math.random()<0.25)PARTS.push({x:q.x+rnd(-10,10),y:q.y+rnd(-10,10),h:q.h+0.1,vx:0,vy:0,vh:rnd(0.6,1.4),life:0.9,max:0.9,col:'#ff8a3a',size:2,g:-0.5,drag:2});}}
function bfClear(){BFM.n=BFM.head=0;BFM.at.length=0;BFM.grow.length=0;bfMarkMesh().count=0;   // สร้างไว้ก่อน = ภาพรอยโหลดตั้งแต่เริ่มแมตช์
  for(const e in BF_EL)for(const v of ['','_air'])fxLoad('env/bf_'+e+v);fxLoad('env/bf_collapse');   // โหลดไฟล์ไว้ก่อน (ครั้งแรกจะได้ไม่พลาด)
  for(const p of BFRS.pools.values()){scene.remove(p.M);p.M.dispose();}BFRS.pools.clear();BFRS.smoke.length=0;
  for(const b of BFRS.bins.values()){if(b.mesh){scene.remove(b.mesh);b.mesh.geometry.dispose();}b.geos.forEach(g=>g.dispose());}BFRS.bins.clear();BFRS.big.length=0;BFRS.dirty=false;}
function updateBf(dt){updateBfMarks(dt);updateBfRest(dt);}
if(window.WD)window.WD.bf={BF,BFM,BFRS,after:bfAfter,play:bfPlay,mark:bfMark,scatter:bfScatter,collapse:bfCollapse,clear:bfClear};   // ทดสอบ: WD.bf.after({k:'imp',t:'fire',x,y,h:1},1) • ปิด: WD.bf.BF.on=false

// ---------- 4) เอฟเฟกต์ทั้งจอ (ค่าไปที่ GradePass ใน js/27-world.js) ----------
const SCR={fl:[],rad:null,chr:0,hurt:0};
function screenFlash(col,amt,life){if(QUAL.mode==='low')return;SCR.fl.push({c:new THREE.Color(col),a:amt,t:life,max:life});}
function screenRadial(x,y,h,amt,life){if(QUAL.mode==='low')return;SCR.rad={x:tx(x),y:h+GY(x,y),z:tz(y),a:amt,t:life,max:life};}
function screenKick(amt){SCR.chr=Math.max(SCR.chr,amt);}
function screenHurt(amt){SCR.hurt=Math.max(SCR.hurt,amt);}
const _scv=new THREE.Vector3();
function updateScreenFx(dt){
  const F=GRADEU.uFlash.value.setRGB(0,0,0);
  for(let i=SCR.fl.length-1;i>=0;i--){const f=SCR.fl[i];f.t-=dt;if(f.t<=0){SCR.fl.splice(i,1);continue;}const k=f.a*(f.t/f.max)**2;F.r+=f.c.r*k;F.g+=f.c.g*k;F.b+=f.c.b*k;}
  if(SCR.rad){const R=SCR.rad;R.t-=dt;if(R.t<=0)SCR.rad=null;else{_scv.set(R.x,R.y,R.z).project(cam);GRADEU.uCtr.value.set(clamp(_scv.x*0.5+0.5,0,1),clamp(_scv.y*0.5+0.5,0,1));const u=1-R.t/R.max;GRADEU.uRad.value=R.a*Math.sin(Math.min(1,u*2.5)*Math.PI*0.5)*(1-u);}}
  if(!SCR.rad)GRADEU.uRad.value=0;
  SCR.chr=Math.max(0,SCR.chr-dt*3);GRADEU.uChr.value=SCR.chr;
  SCR.hurt=Math.max(0,SCR.hurt-dt*1.8);GRADEU.uHurt.value=SCR.hurt*0.55;
}
function updateVfxKit(dt){updateTrails(dt);updateScreenFx(dt);updateBf(dt);}
