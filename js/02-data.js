// =====================================================================
//  ค่าคงที่ของเกม
// =====================================================================
const W=1600,H=1000,PR=18;
// hgt = ความสูงสิ่งกีดขวาง (หน่วย 3D) — บินสูงกว่านี้จะข้ามได้
const PILLARS=[{x:400,y:300,r:45},{x:1200,y:300,r:45},{x:400,y:700,r:45},{x:1200,y:700,r:45},{x:800,y:500,r:70},{x:800,y:200,r:30},{x:800,y:800,r:30}];
const SPAWNF=[[.1,.16],[.9,.84],[.9,.16],[.1,.84],[.5,.09],[.5,.91]];
// สุ่มแบบมี seed เพื่อให้ทุกเครื่องได้ป่าหน้าตาเดียวกัน
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function genForest(){
  const FW=3200,FH=2200,R=mulberry(20251016),obs=[];
  const keep=[[FW/2,FH/2,330],[FW*.14,FH/2,180],[FW*.86,FH/2,180],[FW*.1,FH/2,320],[FW*.9,FH/2,320]];
  SPAWNF.forEach(f=>keep.push([f[0]*FW,f[1]*FH,180]));
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2+0.2;obs.push({x:FW/2+Math.cos(a)*250,y:FH/2+Math.sin(a)*250,r:24,k:'stone',s:R(),hgt:6.5});}
  let tries=0;
  while(obs.length<190&&tries<8000){
    tries++;
    const k=R()<0.13?'rock':'tree',r=k==='rock'?26+R()*20:18+R()*16;
    const x=70+R()*(FW-140),y=70+R()*(FH-140);
    if(keep.some(([kx,ky,kr])=>Math.hypot(x-kx,y-ky)<kr+r))continue;
    if(obs.some(o=>Math.hypot(o.x-x,o.y-y)<o.r+r+105))continue;
    const s=R();
    obs.push({x,y,r,k,s,hgt:k==='tree'?9+s*7:2.2});
  }
  return {W:FW,H:FH,obs};
}
function genPitch(){
  const FW=3000,FH=1800,obs=[];
  [[-160,13],[0,17],[160,15]].forEach(([dy,h],i)=>{
    for(const fx of [0.07,0.93])obs.push({x:FW*fx,y:FH/2+dy,r:12,k:'hoop',hgt:h+1.6,ring:h,s:i/3});
  });
  [[.25,.3],[.25,.7],[.75,.3],[.75,.7],[.38,.5],[.62,.5],[.5,.24],[.5,.76],[.19,.5],[.81,.5]].forEach(([fx,fy],i)=>obs.push({x:FW*fx,y:FH*fy,r:40,k:'crate',hgt:2.6,s:i/10}));
  [[.35,.14],[.65,.86],[.35,.86],[.65,.14]].forEach(([fx,fy],i)=>obs.push({x:FW*fx,y:FH*fy,r:34,k:'hay',hgt:2,s:i/4}));
  return {W:FW,H:FH,obs};
}
function genHogsmeade(){
  const FW=2600,FH=1700,R=mulberry(1031),obs=[];
  obs.push({x:FW/2,y:FH/2,r:46,k:'well',hgt:1.6});
  // ถนนหลักสองแถว (เหนือ/ใต้) หน้าบ้านหันเข้าลานกลาง + บ้านริมซ้าย/ขวา
  for(const [y,ry] of [[330,0],[FH-330,Math.PI]])for(let i=0;i<5;i++)obs.push({x:480+i*410+(R()-0.5)*50,y:y+(R()-0.5)*50,r:84,k:'house',hgt:10,w:150+R()*40,d:120+R()*30,s:R(),ry});
  for(const [x,y,ry] of [[300,FH/2-250,Math.PI/2],[300,FH/2+250,Math.PI/2],[FW-300,FH/2-250,-Math.PI/2],[FW-300,FH/2+250,-Math.PI/2]])obs.push({x,y,r:80,k:'house',hgt:10,w:140,d:120,s:R(),ry});
  // แผงตลาด + โคมไฟรอบลาน
  for(const [dx,dy] of [[-420,-250],[420,-250],[-420,250],[420,250]])obs.push({x:FW/2+dx,y:FH/2+dy,r:44,k:'stall',hgt:3,s:R(),ry:dx<0?Math.PI/2:-Math.PI/2});
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2+0.4;obs.push({x:FW/2+Math.cos(a)*250,y:FH/2+Math.sin(a)*190,r:9,k:'lamp',hgt:7});}
  let nb=0;
  for(let t=0;t<600&&nb<18;t++){
    const x=200+R()*(FW-400),y=200+R()*(FH-400);
    if(obs.some(o=>Math.hypot(o.x-x,o.y-y)<o.r+(o.k==='house'?70:40)))continue;
    if(SPAWNF.some(f=>Math.hypot(f[0]*FW-x,f[1]*FH-y)<170))continue;
    obs.push({x,y,r:16,k:'barrel',hgt:1.7,s:R()});nb++;
  }
  return {W:FW,H:FH,obs};
}
// ----- แผนที่โล่ง 3 แบบ (ผู้ใช้: ป่ามืดไม่สนุก อยากได้ที่โล่งๆ) -----
function genMeadow(){
  const FW=2800,FH=1800,R=mulberry(5150),obs=[];
  for(const [fx,fy] of [[.3,.32],[.7,.68],[.3,.68],[.7,.32]])obs.push({x:FW*fx,y:FH*fy,r:22,k:'stone',hgt:5,s:R()});
  for(const [fx,fy,r] of [[.5,.2,40],[.5,.8,40],[.17,.5,34],[.83,.5,34],[.42,.5,26],[.58,.5,26]])obs.push({x:FW*fx,y:FH*fy,r,k:'rock',hgt:2,s:R()});
  return {W:FW,H:FH,obs};
}
function genLake(){
  const FW=3000,FH=2000,R=mulberry(7777),obs=[];
  for(const [fx,fy,r] of [[.32,.3,46],[.68,.7,46],[.5,.5,38],[.22,.62,30],[.78,.38,30],[.5,.18,26],[.5,.82,26]])obs.push({x:FW*fx,y:FH*fy,r,k:'icechunk',hgt:2.4,s:R()});
  return {W:FW,H:FH,obs};
}
function genRuins(){
  const FW=2600,FH=1800,R=mulberry(3141),obs=[];
  const cx0=FW/2,cy0=FH/2;
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2+0.3;const broken=i%3!==0;obs.push({x:cx0+Math.cos(a)*620,y:cy0+Math.sin(a)*420,r:30,k:'column',hgt:broken?2.6+R()*2:8,s:R(),broken});}
  for(const [dx,dy,a] of [[-260,-120,0.4],[260,130,-0.6]])obs.push({x:cx0+dx,y:cy0+dy,r:44,k:'fallen',hgt:1.8,s:R(),ry:a});
  return {W:FW,H:FH,obs};
}
// ----- Test Place (ห้องฝึก): พื้นโล่งไม่มีสิ่งกีดขวาง -----
// ห้องฝึก 360 × 270 หน่วย: กลาง = ที่ฝึกเดิม (หุ่นซ้อม/จุดเกิด/โซนมอนสเตอร์) • รอบๆ = จุดทดสอบ (TEST_ST) • ไกลออกไปทางตะวันตก = หมู่บ้านทดสอบทำลาย (บ้าน 10 หลัง + ต้นไม้/ลัง/ถัง/หีบใน testProps)
const TEST_W=7200,TEST_H=5400,TEST_C={x:TEST_W/2,y:TEST_H/2},TEST_VIL={x:1000,y:TEST_H/2};
// จุดทดสอบ (พิกัดเกม): range = ลานยิงไกล (หุ่นที่ 1000/1400/1800 จากจุดเกิด) • aoe = วงวัดรัศมี 100–600 + หุ่นกลางวง • pillar = เสาสูงต่างกัน (บินข้าม/บังกระสุน) • wall = กำแพงยาว + ทางแคบ (ชนกำแพง/พุ่ง)
const TEST_ST={aoe:{x:TEST_C.x+1400,y:TEST_C.y-1350},pillar:{x:TEST_C.x+1500,y:TEST_C.y+1000},wall:{x:TEST_C.x,y:TEST_C.y+1500}};
const TEST_PH=[1.5,3,6,12];                                                                  // ความสูงเสาแต่ละคอลัมน์ (หน่วย 3D)
// กำแพง [x1,y1,x2,y2] — ชนเป็นเสากลมเรียงชิด (OBS) ภาพเป็นกล่องยาว (buildTest)
function testWalls(){const W=TEST_ST.wall;return [[W.x-700,W.y-130,W.x+500,W.y-130],[W.x-700,W.y+130,W.x+500,W.y+130],[W.x+800,W.y-450,W.x+800,W.y+450]];}
// หุ่นซ้อมประจำที่ (ตายแล้วฟื้นที่เดิม — trainTick)
function testDummySpots(){const C=TEST_C,A=TEST_ST.aoe;return [[C.x,C.y+160-1000],[C.x,C.y+160-1400],[C.x,C.y+160-1800],[A.x,A.y],[A.x+300,A.y],[A.x-150,A.y+260]];}
function genTest(){
  const W=TEST_W,H=TEST_H,V=TEST_VIL,hs=[],obs=[];
  for(let i=0;i<4;i++){hs.push({x:V.x-600+i*360,y:V.y-330,ry:0});hs.push({x:V.x-600+i*360,y:V.y+330,ry:Math.PI});}   // 2 แถวหันหน้าเข้าถนน
  hs.push({x:V.x+620,y:V.y-170,ry:Math.PI/2},{x:V.x+620,y:V.y+170,ry:Math.PI/2});                                          // ท้ายถนนหันไปทางลานฝึก
  hs.forEach((o,i)=>obs.push(Object.assign({r:84,k:'house',hgt:10,w:[170,150,185,160,175,155,190,165,170,170][i],d:[135,125,145,130,140,120,150,128,135,135][i],s:(i*0.37)%1},o)));
  const P=TEST_ST.pillar;
  for(let c=0;c<4;c++)for(let r=0;r<3;r++)obs.push({x:P.x+(c-1.5)*280,y:P.y+(r-1)*260,r:40,k:'tpillar',hgt:TEST_PH[c],s:0});
  for(const [x1,y1,x2,y2] of testWalls()){const L=Math.hypot(x2-x1,y2-y1),n=Math.ceil(L/36);for(let i=0;i<=n;i++)obs.push({x:x1+(x2-x1)*i/n,y:y1+(y2-y1)*i/n,r:26,k:'twall',hgt:6,s:0});}
  return {W,H,obs};
}
// ของพังได้ในห้องฝึก (เหมือนกันทุกเครื่อง): ป่าเล็กเหนือ/ใต้หมู่บ้าน + ต้นไม้ริมถนน + ลัง/ถังหน้าบ้าน + หีบ 2 ใบ
function testProps(){
  const V=TEST_VIL,R=mulberry(4242),out=[],add=(k,x,y)=>out.push({i:out.length,k,x:Math.round(x),y:Math.round(y),a:R()*6.283,r:PROPDEF[k].r,hgt:PROPDEF[k].hgt,hp:PROPDEF[k].hp||0,st:0,ht:0});
  const free=(x,y,r)=>!MAPS.test.obs.some(o=>Math.abs(x-o.x)<(o.w||o.r*2)/2+r+40&&Math.abs(y-o.y)<(o.w||o.r*2)/2+r+40)&&!out.some(o=>Math.hypot(o.x-x,o.y-y)<o.r+r+30);
  for(const [cx,cy,n] of [[V.x,V.y-900,26],[V.x,V.y+900,26],[V.x+1000,V.y-1250,10],[V.x+1000,V.y+1250,10]])
    for(let t=0,k=0;k<n&&t<400;t++){const x=cx+(R()-0.5)*1300,y=cy+(R()-0.5)*520;if(!free(x,y,24))continue;add(R()<0.5?'ptree':'ppine',x,y);k++;}
  for(let i=0;i<5;i++){add('ptree',V.x-760+i*360,V.y-130);add('ppine',V.x-580+i*360,V.y+130);}                         // ต้นไม้ริมถนน
  for(let i=0;i<4;i++)for(const s of [-1,1]){const x=V.x-600+i*360+(R()-0.5)*80,y=V.y+s*190;if(free(x,y,20))add(R()<0.5?'pcrate':'pbarrel',x,y);}
  add('pchest',V.x-820,V.y);add('pchest',V.x+900,V.y-420);
  for(let i=0;i<8;i++){const x=V.x+900+(i%4)*55,y=V.y+380+Math.floor(i/4)*55;add(i%2?'pbarrel':'pcrate',x,y);}            // กองลังไว้ทดสอบระเบิด
  return out;
}
// โซนเสกมอนสเตอร์ในห้องฝึก (พิกัดเกม) — ใช้ทั้งโฮสต์ (จุดเกิด) และจอ (วงบนพื้น)
function trZone(){return {x:MW/2+1344,y:MH/2-288,r:230};}
function genGreatHall(){
  const FW=2400,FH=1500,obs=[],tables=[];
  // โต๊ะยาว 4 บ้านวางตามแนวยาว (ช่องกลางเป็นทางเดินพรม) + โต๊ะอาจารย์ที่ปลายห้อง
  for(const y of [330,560,940,1170]){tables.push({x0:440,y0:y,x1:1700,y1:y});for(let x=440;x<=1700;x+=62)obs.push({x,y,r:40,k:'table',hgt:1.8});}
  tables.push({x0:2160,y0:570,x1:2160,y1:930,teacher:1});for(let y=570;y<=930;y+=62)obs.push({x:2160,y,r:40,k:'table',hgt:1.8});
  for(const [x,y] of [[850,750],[1650,750]])obs.push({x,y,r:50,k:'pillar',hgt:14});
  return {W:FW,H:FH,obs,tables};
}
const MAPS={
  castle:{name:'🏰 ลานปราสาท',d:'ลานประลองกลางปราสาทยามค่ำคืน',W,H,obs:PILLARS.map(p=>Object.assign({k:'pillar',hgt:9.5},p))},
  forest:Object.assign({name:'🌲 ป่ามืด',d:'ป่ากว้าง ต้นไม้เยอะ ระวังแมงมุมยักษ์!'},genForest()),
  pitch:Object.assign({name:'🏟️ สนามควิดดิช',d:'สนามกว้างยามเย็น เหมาะกับบินไม้กวาด'},genPitch()),
  hogsmeade:Object.assign({name:'❄️ หมู่บ้านฮอกส์มี้ด',d:'หมู่บ้านหิมะยามค่ำ บ้านไม้ แผงตลาด และโคมไฟ'},genHogsmeade()),
  greathall:Object.assign({name:'🕯️ ห้องโถงใหญ่',d:'โต๊ะยาวสี่บ้าน เทียนลอย เพดานเวทมนตร์'},genGreatHall()),
  meadow:Object.assign({name:'🌄 ทุ่งหญ้าฮอกวอตส์',d:'ทุ่งกว้างยามเย็น หินตั้งไม่กี่ก้อน มองเห็นปราสาทไกลๆ'},genMeadow()),
  lake:Object.assign({name:'🧊 ทะเลสาบน้ำแข็ง',d:'ลานน้ำแข็งกว้างใต้แสงจันทร์ มีก้อนน้ำแข็งให้หลบนิดหน่อย'},genLake()),
  ruins:Object.assign({name:'🏛️ ซากลานประลอง',d:'ลานประลองโบราณกลางทราย เสาหักรอบขอบ ตรงกลางโล่ง'},genRuins()),
  test:Object.assign({name:'🧪 Test Place',d:'พื้นโล่งสำหรับทดลองคาถา (ห้องฝึก)'},genTest())
};
// แผนที่ที่สุ่มได้ (ป่ามืดเอาออกจากการสุ่มตามที่ผู้ใช้ขอ — ยังเลือกเองในล็อบบี้ได้)
const RANDOM_MAPS=['castle','pitch','hogsmeade','greathall','meadow','lake','ruins'];
let MAPID='castle',MW=W,MH=H,OBS=MAPS.castle.obs;
function setMapVars(id){if(!MAPS[id])id='castle';MAPID=id;MW=MAPS[id].W;MH=MAPS[id].H;OBS=MAPS[id].obs;TERR=MAPS[id].terr||null;PROPS=genProps(id);BLDG=genBldg(id);BRK=genBrk(id);}
// ---------- แผนที่จากไฟล์ (Blender → assets/maps/<id>.json + .glb, สคริปต์ assets/src/map_export.py, กติกา MAP-DESIGN.md) ----------
// manifest "maps":{id:{file,data,v}} • ไฟล์ .json = ข้อมูลเกม (ทุกเครื่องโหลดไฟล์เดียวกัน → คำนวณตรงกัน) • .glb = หน้าตา (โหลดตอนสร้างฉาก)
// id ซ้ำกับแผนที่จากโค้ด = แทนที่ของเดิม • โหลดไม่ได้ = ใช้แผนที่จากโค้ดตามเดิม
const FMAPS={pend:new Map(),fail:new Set()};
function b64i16(b){const bin=atob(b),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);const v=new Int16Array(u.buffer),f=new Float32Array(v.length);for(let i=0;i<v.length;i++)f[i]=v[i]===-32768?NaN:v[i]/100;return f;}
function regFileMap(id,e,d){
  const obs=(d.obs||[]).map(o=>Object.assign({x:o.x,y:o.y,r:o.r,hgt:o.hgt,k:o.k||'col',fm:1},o.ring!=null?{ring:o.ring}:{},o.b!=null?{b:o.b}:{}));   // b = กลุ่มของบังที่พังได้ (d.brk[b]) • ring = ความสูงห่วงควิดดิช (k:'hoop')
  (d.houses||[]).forEach((h,i)=>obs.push({x:h.x,y:h.y,r:Math.max(h.w,h.d)/2,k:'house',hgt:10,w:h.w,d:h.d,s:(i*0.37)%1,ry:h.ry||0}));
  const terr={c:d.c,nx:d.nx,ny:d.ny,g:b64i16(d.g),fl:(d.fl||[]).map(f=>({x0:f.x0,y0:f.y0,nx:f.nx,ny:f.ny,top:b64i16(f.top),bot:b64i16(f.bot)}))};
  {const keep=TERR;TERR=terr;for(const o of obs)if(o.fm)o.top=terrT(o.x,o.y)+o.hgt;TERR=keep;}   // ที่ชนจากไฟล์: เทียบความสูงจริง (พื้นใต้ตัวกับใต้ที่ชนสูงไม่เท่ากันได้)
  MAPS[id]={name:d.name||id,d:d.desc||'',W:d.W,H:d.H,obs,terr,fm:{file:e.file,v:e.v||0,sky:d.sky||'night',fog:d.fog||null,music:d.music||'',modes:d.modes||null,
    spawns:d.spawns||[],props:d.props,espawn:d.espawn||[],rings:d.rings||[],tasks:d.tasks||[],lights:d.lights||[],env:d.env||[],weather:d.weather||'',fx:d.fx||[],brk:d.brk||[]}};
  const ri=RANDOM_MAPS.indexOf(id);
  if(d.random===0){if(ri>=0)RANDOM_MAPS.splice(ri,1);}else if(ri<0)RANDOM_MAPS.push(id);
  if(builtMap===id)builtMap='';                                   // ฉากที่สร้างไว้เป็นแบบโค้ด (เช่นเมนู) → ให้สร้างใหม่ครั้งหน้า
  if(window.WD)WD.MAPS=MAPS;
}
function loadMapData(id){
  if(FMAPS.pend.has(id))return FMAPS.pend.get(id);
  const pr=modelManifest().then(m=>{const e=m.maps&&m.maps[id];if(!e||!e.data){FMAPS.fail.add(id);return false;}
    return fetch('assets/'+e.data+'?v='+(e.v||0)).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();}).then(d=>{regFileMap(id,e,d);return true;});
  }).catch(err=>{console.warn('map',id,err);FMAPS.fail.add(id);return false;});
  FMAPS.pend.set(id,pr);return pr;
}
// ข้อมูลแผนที่ทุกอันใน manifest โหลดตั้งแต่เปิดหน้า (ไฟล์เล็ก) เพื่อให้เลือก/สุ่มได้และเครื่องลูกพร้อมก่อนโฮสต์เริ่มเกม
function loadAllMapData(){return modelManifest().then(m=>Promise.all(Object.keys(m.maps||{}).map(loadMapData)));}
// แผนที่ที่ใช้ได้กับโหมดนี้ (ไฟล์แผนที่บอกโหมดเองได้)
// เครื่องลูก: ยังไม่มีข้อมูลแผนที่นี้ → สั่งโหลดแล้วรอ snapshot ถัดไป (โหลดไม่ได้ = ใช้แผนที่สำรอง)
function mapReady(id){if(MAPS[id]||FMAPS.fail.has(id))return true;loadMapData(id);return false;}
function mapOkFor(id,mode){const f=MAPS[id]&&MAPS[id].fm;return !f||!f.modes||f.modes.includes(mode);}
// ---------- ของประกอบฉากที่พังได้ / ใช้ได้ (prop) ----------
// ตำแหน่งสุ่มแบบ seed จากชื่อแผนที่ → ทุกเครื่องคำนวณได้ตรงกันเอง ส่งในเน็ตแค่สถานะ (snapshot PB: 1 ตัวต่อชิ้น 0=ปกติ 1=พัง 2=ใช้แล้ว)
// ตัวเลข (hp/ขนาด/จำนวน/โหมดที่เปิด) เป็นค่าตั้งต้นให้ทีมเกมเพลย์ปรับ • model = ชื่อใน assets/manifest.json (ไม่มีไฟล์ = ใช้โมเดลจากโค้ด)
// เพิ่มชนิดใหม่: ใส่ใน PROPDEF (+ ผลตอนใช้ใน PROP_USE, + โมเดลสำรองใน propFallback) — ห้ามเปลี่ยนลำดับ/ตัวเลขแบบสุ่มโดยไม่เพิ่ม PREFIX (ตำแหน่งจะไม่ตรงกับเครื่องเก่า)
const PROPDEF={
  pcrate:{n:'ลังไม้',r:18,hgt:1.4,hp:30,model:'prop_crate',w:5,col:'#a07a46'},
  pbarrel:{n:'ถังไม้',r:15,hgt:1.6,hp:45,model:'prop_barrel',w:4,col:'#8a5a32'},
  pchest:{n:'หีบสมบัติ',r:18,hgt:1.0,use:'เปิดหีบ',model:'prop_chest',w:1,max:2,col:'#e8c060'},
  ptree:{n:'ต้นโอ๊ก',r:22,hgt:7.5,hp:70,model:'prop_tree',w:0,col:'#4f8f3c'},     // w:0 = ไม่สุ่มลงแผนที่ทั่วไป (ห้องฝึก / วางเองในไฟล์แผนที่ prop_tree_)
  ppine:{n:'ต้นสน',r:20,hgt:7,hp:55,model:'prop_pine',w:0,col:'#2f6a30'},
};
const PROP_OFF_MODES=['quid','race','imp'];
// ผลตอนผู้เล่นกดใช้ (ฝั่งโฮสต์) — ว่างไว้ให้ทีมเกมเพลย์ใส่ เช่น ให้บัฟ/ของ
const PROP_USE={pchest(p,o){}};
let PROPS=[],PROPON=false;
function genProps(id){
  const M=MAPS[id];if(!M)return [];if(id==='test')return testProps();
  if(M.fm&&M.fm.props)return M.fm.props.filter(q=>PROPDEF[q.k]).map((q,i)=>{const D=PROPDEF[q.k];return {i,k:q.k,x:q.x,y:q.y,a:q.a||0,r:D.r,hgt:D.hgt,hp:D.hp||0,st:0,ht:0};});   // วางเองในไฟล์แผนที่
  const rng=mulberry(hashStr('props:'+id)),out=[],W=M.W,H=M.H,obs=M.obs||[];
  const n=Math.min(24,Math.round(W*H/200000)),kinds=Object.keys(PROPDEF),wsum=kinds.reduce((a,k)=>a+PROPDEF[k].w,0),cnt={};
  const spawns=SPAWNF.map(f=>[f[0]*W,f[1]*H]);
  for(let tries=0;out.length<n&&tries<n*60;tries++){
    let pick=rng()*wsum,k=kinds[0];for(const kk of kinds){pick-=PROPDEF[kk].w;if(pick<=0){k=kk;break;}}
    const D=PROPDEF[k],x=140+rng()*(W-280),y=140+rng()*(H-280),a=rng()*Math.PI*2;
    if(D.max&&(cnt[k]|0)>=D.max)continue;
    if(Math.hypot(x-W/2,y-H/2)<300)continue;                        // จุดเกิด co-op/ฝึก (กลางแผนที่)
    if((x<W*0.2||x>W*0.8)&&Math.abs(y-H/2)<320)continue;            // จุดเกิดดวล/ทีม
    if(spawns.some(q=>Math.hypot(x-q[0],y-q[1])<180))continue;      // จุดเกิด FFA
    if(obs.some(c=>Math.hypot(x-c.x,y-c.y)<c.r+D.r+40))continue;
    if(out.some(o=>Math.hypot(x-o.x,y-o.y)<o.r+D.r+50))continue;
    cnt[k]=(cnt[k]|0)+1;
    out.push({i:out.length,k,x,y,a,r:D.r,hgt:D.hgt,hp:D.hp||0,st:0,ht:0});
  }
  return out;
}
// ---------- ตัวละคร: บ้านฮอกวอตส์ + หน้าตา ----------
// สีหลัก c ของบ้านใช้เป็นสีประจำตัวทั่วเกม (ป้ายชื่อ แผนที่ย่อ ตารางคะแนน) / c2 = สีรอง (สีเนคไท ผ้าพันคอ)
const HOUSES=[
  {n:'Gryffindor',th:'กริฟฟินดอร์',ic:'🦁',c:'#a71b26',c2:'#f0b92a',tr:'กล้าหาญ',gl:'#ff6a3c',bg:'#2e080b',ds:'กล้าหาญ • เด็ดเดี่ยว • ไม่ยอมถอย',po:'ท่าชูไม้กายสูง'},
  {n:'Slytherin',th:'สลิธีริน',ic:'🐍',c:'#14693a',c2:'#c9d1d8',tr:'เจ้าเล่ห์',gl:'#3cdc8a',bg:'#04190e',ds:'เจ้าเล่ห์ • ทะเยอทะยาน • เฉียบคม',po:'ท่ากอดอกยิ้มมุมปาก'},
  {n:'Hufflepuff',th:'ฮัฟเฟิลพัฟ',ic:'🦡',c:'#f6c928',c2:'#2b2b2b',tr:'ซื่อสัตย์',gl:'#ffd23c',bg:'#2b2305',ds:'ซื่อสัตย์ • อดทน • ใจดีกับทุกคน',po:'ท่าโบกมือทักทาย'},
  {n:'Ravenclaw',th:'เรเวนคลอ',ic:'🦅',c:'#1b4f9e',c2:'#b8863e',tr:'ฉลาด',gl:'#4a8cff',bg:'#050d2c',ds:'ฉลาด • ช่างคิด • รักการเรียนรู้',po:'ท่านักคิด ไม้กายแตะคาง'}];
const HAIRC=['#15100d','#2b1b10','#4a2c17','#8a5a2b','#c9a15a','#eadba0','#b8431f','#6b2d17','#8a8f99','#2d6a8a','#f2f2f6','#d9467a','#7a4ad0','#3f9a5a','#e8c24a','#2f4fb0'];
// ลำดับสำคัญ: ทรง 0-3 เป็นของเดิม (ตัวละครที่บันทึกไว้ยังใช้ได้) 4+ เป็นทรงใหม่
const HAIRSTY=['ทรงสั้น','หน้าม้า','ยาวสยาย','มวยผม','ยุ่งแบบพอตเตอร์','ผมบ็อบ','หางม้า','ผมเปีย','หยิกฟู','หางเปียคู่','หัวแหลม'];
// ไม้กายสิทธิ์: ไม้ (สีด้าม) / แกนเวท (สีประกายปลายไม้) / ทรงด้าม
const WOODC=['#6b4423','#8a5a2f','#2a1a14','#a9885a','#d8c9a0','#5a2e22','#c9b48a','#7a3a2a'];
const WOODN=['โอ๊ค','ฮอลลี','อีโบนี','วิลโลว์','เอลเดอร์','ยู','เบิร์ช','เชอร์รี'];
const WCOREC=['#fff2c0','#ffb040','#6aff7a','#6ab4ff','#c88aff','#ff6a6a'];
const WCOREN=['ขนยูนิคอร์น','ขนฟินิกซ์','เส้นหัวใจมังกร','ผลึกน้ำแข็ง','ธุลีจันทรา','เปลวเพลิง'];
const WANDSTY=['เรียบ','เกลียว','ปมไม้','ด้ามทอง'];
const EYEC=['#4a2e16','#171210','#3f7fd0','#3f9a5a','#8a6a2a','#8a94a0','#8a5ad0','#d08a20'];
const SKINC=['#fbe3cf','#f1d2b0','#e0b48c','#c68e62','#a6704a','#8d5a3b','#6b4128','#4a2c1c'];
const CLOAKC=['#141218','#1d2b4a','#1f3a2a','#4a1620','#3a2a1a','#3d3f4a','#4a2a6a','#e6e2da'];
const TIESTY=['ลายตามบ้าน','สีหลักบ้าน','สีรองบ้าน','ไม่ผูกเนคไท'];
const LOOKK=['h','hr','hs','ey','sk','cl','ti','wd','wc','ws'],LOOKN=[4,HAIRC.length,HAIRSTY.length,EYEC.length,SKINC.length,CLOAKC.length,TIESTY.length,WOODC.length,WCOREC.length,WANDSTY.length];
function lookStr(l){return LOOKK.map(k=>l[k]).join('.');}
function parseLook(s){const a=String(s||'').split('.'),o={};LOOKK.forEach((k,i)=>{const v=+a[i];o[k]=Number.isInteger(v)&&v>=0&&v<LOOKN[i]?v:0;});return o;}
function randLook(seed){const R=mulberry(seed===undefined?Math.floor(Math.random()*1e9):seed),o={};LOOKK.forEach((k,i)=>{o[k]=Math.floor(R()*LOOKN[i]);});if(o.cl>3)o.cl=0;return o;}
const LOOKS={},LOOKP={},KITS={};
function getKit(id){return parseKit(KITS[id]!==undefined?KITS[id]:'0');}
function getLook(id){const s=LOOKS[id]||(LOOKS[id]=lookStr(randLook(hashStr(id))));return LOOKP[s]||(LOOKP[s]=parseLook(s));}
const CREST_SH='M8 8H92V62C92 92 66 108 50 116C34 108 8 92 8 62Z';
const CREST_PAT=[
  c2=>`<polygon points="0,18 100,66 100,92 0,44" fill="${c2}" opacity=".95"/>`,
  c2=>`<path d="M0 26L50 68L100 26L100 52L50 94L0 52Z" fill="${c2}" opacity=".9"/>`,
  c2=>`<path d="M0 30L50 72L100 30L100 52L50 94L0 52Z" fill="${c2}" opacity=".92"/><path d="M0 62L50 104L100 62L100 80L50 122L0 80Z" fill="${c2}" opacity=".92"/>`,
  c2=>`<path d="M50 4L96 62L50 120L4 62Z" fill="${c2}" opacity=".85"/><path d="M50 22L80 62L50 102L20 62Z" fill="rgba(0,0,0,.25)"/>`];
function starPts(cx,cy,n,ro,ri){let o='';for(let i=0;i<n*2;i++){const a=Math.PI*i/n-Math.PI/2,r=i%2?ri:ro;o+=(cx+Math.cos(a)*r).toFixed(1)+','+(cy+Math.sin(a)*r).toFixed(1)+' ';}return o;}
// สัตว์ประจำบ้าน วาดเป็นเวกเตอร์เอง (สิงโต / งู / แบดเจอร์ / อินทรี)
const CREST_ANI=[
  ()=>`<polygon points="${starPts(50,58,15,27,20)}" fill="#e9a21f" stroke="#5a2f06" stroke-width="1.3"/><circle cx="38" cy="43" r="4.6" fill="#f6c75e" stroke="#5a2f06"/><circle cx="62" cy="43" r="4.6" fill="#f6c75e" stroke="#5a2f06"/><circle cx="50" cy="58" r="16" fill="#f6c75e" stroke="#5a2f06" stroke-width="1.3"/><ellipse cx="44" cy="54" rx="2.2" ry="1.7" fill="#2b1203"/><ellipse cx="56" cy="54" rx="2.2" ry="1.7" fill="#2b1203"/><path d="M46 60L54 60L50 66Z" fill="#6a2a12"/><path d="M50 66V69M43 70Q50 74 57 70" stroke="#6a2a12" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  ()=>`<path d="M62 38C26 34 28 58 50 60C76 62 72 88 36 86" stroke="#06241a" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M62 38C26 34 28 58 50 60C76 62 72 88 36 86" stroke="#e1e7ec" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="14 2.5"/><ellipse cx="65" cy="37" rx="9" ry="6.5" fill="#e1e7ec" stroke="#06241a" stroke-width="1.5" transform="rotate(-14 65 37)"/><circle cx="67" cy="35" r="1.6" fill="#0a2a1c"/><path d="M73 38L81 35M73 38L81 41" stroke="#d6283a" stroke-width="1.6" stroke-linecap="round"/>`,
  ()=>`<defs><clipPath id="bdg"><ellipse cx="50" cy="60" rx="22" ry="19"/></clipPath></defs><circle cx="33" cy="44" r="6" fill="#1b1b1b"/><circle cx="67" cy="44" r="6" fill="#1b1b1b"/><circle cx="33" cy="44" r="2.4" fill="#f5f1e4"/><circle cx="67" cy="44" r="2.4" fill="#f5f1e4"/><ellipse cx="50" cy="60" rx="22" ry="19" fill="#f5f1e4" stroke="#111" stroke-width="1.6"/><g clip-path="url(#bdg)"><path d="M30 40C35 54 36 68 41 80L48 80L47 38Z" fill="#1b1b1b"/><path d="M70 40C65 54 64 68 59 80L52 80L53 38Z" fill="#1b1b1b"/></g><circle cx="41" cy="57" r="2.2" fill="#f5f1e4"/><circle cx="59" cy="57" r="2.2" fill="#f5f1e4"/><ellipse cx="50" cy="71" rx="5" ry="3.4" fill="#111"/>`,
  ()=>{const w='<path d="M48 62L8 34L15 48L3 52L16 61L7 72L24 69L22 82L37 73L48 79Z" fill="#cf9f55" stroke="#4a2f0c" stroke-width="1.4"/><path d="M40 60L16 46M38 67L14 62M36 73L22 76" stroke="#4a2f0c" stroke-width="1" opacity=".7"/>';return w+`<g transform="translate(100 0) scale(-1 1)">${w}</g><path d="M44 78L50 96L56 78Z" fill="#8a5a22" stroke="#4a2f0c"/><ellipse cx="50" cy="66" rx="7.5" ry="14" fill="#946226" stroke="#4a2f0c" stroke-width="1.3"/><circle cx="50" cy="47" r="7.5" fill="#efe9d6" stroke="#4a2f0c" stroke-width="1.3"/><path d="M46.5 50L50 58L53.5 50Z" fill="#f2b630" stroke="#7a4a08" stroke-width=".8"/><circle cx="47.5" cy="46" r="1.3" fill="#1a1208"/><circle cx="52.5" cy="46" r="1.3" fill="#1a1208"/>`;}];
// ตราบ้าน: โล่ลายสีบ้าน + สัตว์ประจำบ้าน + ริบบิ้นชื่อ (w = ความกว้างพิกเซล, rib = แสดงริบบิ้นไหม)
function crestSVG(h,w,rib=true){
  const H=HOUSES[h],id='cg'+h+'_'+w+(rib?'r':'n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 ${rib?132:120}" width="${w}" height="${Math.round(w*(rib?1.32:1.2))}" class="crest"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient><clipPath id="${id}c"><path d="${CREST_SH}"/></clipPath></defs>
<path d="${CREST_SH}" fill="${H.c}"/><g clip-path="url(#${id}c)">${CREST_PAT[h](H.c2)}<path d="${CREST_SH}" fill="url(#${id})"/></g>
<path d="${CREST_SH}" fill="none" stroke="#2a1a05" stroke-width="5.5"/><path d="${CREST_SH}" fill="none" stroke="#f0cf78" stroke-width="3"/><path d="M14 14H86V60C86 85 64 99 50 107C36 99 14 85 14 60Z" fill="none" stroke="#fff3c4" stroke-opacity=".4" stroke-width="1"/>
${CREST_ANI[h]()}
${rib?`<path d="M-2 100L102 100L94 113L102 126L-2 126L6 113Z" fill="#eadcae" stroke="#5a3d10" stroke-width="2"/><text x="50" y="117" font-family="'Cinzel Decorative',Cinzel,serif" font-weight="900" font-size="12" fill="${H.c}" stroke="#2a1a05" stroke-width=".4" text-anchor="middle" textLength="76" lengthAdjust="spacingAndGlyphs">${H.n.toUpperCase()}</text>`:''}</svg>`;
}
function houseColor(lk){return HOUSES[parseLook(lk).h].c;}
const TEAMC=['#4da3ff','#ff5a5a'], TEAMN=['ทีมฟ้า','ทีมแดง'];
const MODES={
  coop:{name:'🗝️ ดันเจียน Co-op',d:'1-6 คน ฝ่าทีละชั้น บอสเรดทุก 5 ชั้น',min:1,max:6},
  train:{name:'🎯 ห้องฝึก',d:'1-6 คน Test Place: ลองคาถา เสกมอนสเตอร์ ปรับไม่มีคูลดาวน์ได้',min:1,max:6,map:'test'},
  duel:{name:'⚔️ ดวล 1v1',d:'2 คน ชนะ 2 ใน 3 รอบ',min:2,max:2},
  ffa:{name:'💥 FFA',d:'2-6 คน ใครได้ 10 kill ก่อนชนะ',min:2,max:6},
  tdm:{name:'🛡️ ทีม 2v2 / 3v3',d:'2-6 คน ทีมไหนได้ 15 kill ก่อนชนะ',min:2,max:6,team:true},
  quid:{name:'🏟️ ควิดดิช',d:'2-6 คน 2 ทีม บินแย่งบอลโยนเข้าห่วง',min:2,max:6,team:true,map:'pitch'},
  race:{name:'🏁 แข่งไม้กวาด',d:'1-6 คน บินลอดห่วงครบ 2 รอบ',min:1,max:6},
  br:{name:'🌀 แบทเทิลรอยัล',d:'2-6 คน เก็บคาถา วงหด คนสุดท้ายชนะ',min:2,max:6,map:'lake'},
  imp:{name:'🐍 หาลอร์ดโวลเดอมอร์',d:'4-6 คน ทำภารกิจ จับตัวโวลเดอมอร์ (แบบ Among Us)',min:4,max:6}
};
const PDEF={
  bolt:{spd:950,r:7,dmg:10,life:1.1,col:'#ffe27a'},
  fire:{spd:640,r:12,dmg:20,life:1.6,col:'#ff6a2a'},
  stun:{spd:820,r:9,dmg:8,life:1.2,col:'#5ad1ff'},
  pull:{spd:860,r:9,dmg:6,life:1.0,col:'#c77dff'},
  ebolt:{spd:500,r:8,dmg:9,life:2.6,col:'#7dff6a'},
  web:{spd:520,r:11,dmg:4,life:2.2,col:'#e8e8f0'},
  ice:{spd:1000,r:8,dmg:11,life:1.0,col:'#9fe8ff'},
  zap:{spd:1500,r:7,dmg:12,life:0.9,col:'#fff27a'},
  vine:{spd:720,r:9,dmg:8,life:1.1,col:'#6fd57f'},
  dart:{spd:1300,r:6,dmg:6,life:0.9,col:'#b6e86a'},
  hex:{spd:850,r:9,dmg:8,life:1.1,col:'#b57dff'},
  ember:{spd:720,r:6,dmg:6,life:1.2,col:'#ff9a4a'},
  spike:{spd:780,r:11,dmg:16,life:1.2,col:'#d8f4ff'},
  pb0:{spd:950,r:7,dmg:10,life:1.1,col:'#ff8a3a'},
  spark:{spd:1000,r:7,dmg:6,life:0.4,col:'#ffb347'},
  icicle:{spd:1150,r:7,dmg:7,life:0.61,col:'#bfeaff'},
  iceboulder:{spd:850,r:14,dmg:20,life:0.82,col:'#9fe0ff'},
  pfire:{spd:1500,r:11,dmg:20,life:0.6,col:'#ff6a2a'},
  pfireb:{spd:1300,r:16,dmg:20,life:0.8,col:'#ff5a1a'},
  pb1:{spd:950,r:7,dmg:10,life:1.1,col:'#9fe8ff'},
  pb2:{spd:1100,r:6,dmg:9,life:1.0,col:'#fff27a'},
  pb3:{spd:950,r:6,dmg:8,life:1.1,col:'#8ef07a'},
  pb4:{spd:950,r:7,dmg:9,life:1.1,col:'#b57dff'},
  pb5:{spd:900,r:7,dmg:9,life:1.1,col:'#ff9ad5'}
};
// ch = ความสูงจุดกึ่งกลางลำตัว, vr = ครึ่งความสูง (ใช้เช็กโดนในแนวตั้ง)
const EDEF={
  gob:{hp:30,spd:150,r:15,dmg:8,col:'#6bbf4e',ch:0.9,vr:1,name:'ก็อบลิน'},
  wiz:{hp:45,spd:110,r:16,dmg:9,col:'#9b59d0',ch:1.3,vr:1.4,name:'พ่อมดมืด'},
  troll:{hp:450,spd:82,r:38,dmg:28,col:'#8a6a4a',ch:2.6,vr:2.6,name:'โทรลล์'},
  spl:{hp:14,spd:215,r:12,dmg:5,col:'#4a3a30',ch:0.35,vr:0.55,name:'แมงมุมจิ๋ว'},
  spider:{hp:60,spd:170,r:24,dmg:12,col:'#3a2a22',ch:0.8,vr:0.95,name:'แมงมุมยักษ์'},
  queen:{hp:900,spd:105,r:56,dmg:26,col:'#2a1d18',ch:2.2,vr:2.4,name:'ราชินีแมงมุม'},
  pixie:{hp:18,spd:240,r:11,dmg:6,col:'#4fa8ff',ch:0,vr:0.7,fly:true,name:'พิกซี่'},
  dragon:{hp:1600,spd:95,r:70,dmg:30,col:'#7a1e1e',ch:3,vr:3.2,name:'มังกร',boss:true},
  dummy:{hp:250,spd:0,r:18,dmg:6,col:'#c8a060',ch:1,vr:1.1,name:'หุ่นซ้อม'}
};
EDEF.queen.boss=true;
const POOLS={
  castle:{early:['gob'],mid:['wiz','pixie','troll'],boss:'dragon'},
  forest:{early:['spl','spider'],mid:['spider','wiz'],boss:'queen'},
  pitch:{early:['pixie','gob'],mid:['wiz','spider','pixie','troll'],boss:'dragon'},
  hogsmeade:{early:['gob','pixie'],mid:['wiz','pixie','troll'],boss:'dragon'},
  greathall:{early:['gob','pixie'],mid:['wiz','troll','pixie'],boss:'dragon'},
  meadow:{early:['gob','pixie'],mid:['wiz','spider','troll'],boss:'dragon'},
  lake:{early:['pixie','spl'],mid:['spider','wiz','pixie'],boss:'queen'},
  ruins:{early:['gob','spl'],mid:['wiz','troll','spider'],boss:'dragon'}
};
const CDK=['basic','q','e','r','f','dodge'];
const BUFFS=[
  {n:'พลังเวท +20%',i:'✨',d:'ทุกคาถาแรงขึ้น',ap:p=>p.buffs.dmg*=1.2},
  {n:'ร่ายไว +15%',i:'⏳',d:'คูลดาวน์สั้นลง',ap:p=>p.buffs.cdr*=0.85},
  {n:'พลังชีวิต +25',i:'❤️',d:'เลือดสูงสุดเพิ่ม และฮีลเต็ม',ap:p=>{p.maxHp+=25;p.hp=p.maxHp;}},
  {n:'ฝีเท้าลม +12%',i:'🪶',d:'เดินและบินเร็วขึ้น',ap:p=>p.buffs.spd*=1.12},
  {n:'ดูดชีวิต 6%',i:'🩸',d:'ฟื้นเลือดจากดาเมจที่ทำ',ap:p=>p.buffs.life+=0.06},
  {n:'โล่แกร่ง',i:'🛡️',d:'โล่ฟื้นเร็วขึ้น 50%',ap:p=>p.buffs.shReg*=1.5},
  {n:'เวทโบราณ +35%',i:'🌟',d:'ชาร์จอัลติเร็วขึ้น',ap:p=>p.buffs.ult*=1.35}
];
