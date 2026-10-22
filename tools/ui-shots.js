// ถ่ายภาพพื้นหลังการ์ดเมนูจากแผนที่จริงในเกม → assets/ui/maps/<แผนที่>.jpg (1280×800) + assets/ui/modes/<โหมด>.jpg (600×800) + shots/ui-shots-sheet.jpg
// Render menu-card backgrounds from the real in-game maps (headless Chrome over DevTools, no npm deps). Needs the game server: python tools/serve.py (port 8765).
// ใช้ / usage:  node tools/ui-shots.js [castle forest ... ffa tdm coop train]  •  --probe <map..> = 6 test angles → shots/ui-probe-<map>.jpg  •  --try views.json = compare angles  •  --sheet = only rebuild the sheet
const {spawn}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const ROOT=path.join(__dirname,'..'),BASE='http://localhost:8765/',PORT=9343;
const OUT_MAPS=path.join(ROOT,'assets','ui','maps'),OUT_MODES=path.join(ROOT,'assets','ui','modes'),SHOTS=path.join(ROOT,'shots');
const CHROME=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p=>fs.existsSync(p));
const SS=2;   // ถ่ายใหญ่ 2 เท่าแล้วย่อ (ขอบเนียน) • supersampling factor

// ===================== มุมกล้อง (แก้ตรงนี้) • CAMERA PRESETS (tweak here) =====================
// หน่วย 3D (1 หน่วย = 20 px ของเกม) กลางแผนที่ = (0,0,0) • pos = ตำแหน่งกล้อง [x,y,z] • at = จุดที่มอง • y เทียบกับพื้นตรงนั้น (rel) ถ้าไม่ใส่ rel:false
// fov = มุมกว้าง (องศา) • exp = ความสว่าง (คูณ exposure) • lift = ยกเงามืด 0..1 • sat = ความอิ่มสี • kb = ขนาดไฟล์สูงสุด
// units: 3D (1 = 20 sim px), map centre = origin • y is relative to the ground under that point unless rel:false
const MAP_SHOTS={
  castle:   {pos:[-30,16,30],  at:[4,4,-4],   fov:50, exp:1.25, lift:0.10},
  forest:   {pos:[-40,14,40],  at:[0,3,0],    fov:50, exp:1.35, lift:0.12},
  pitch:    {pos:[-55,16,40],  at:[0,6,0],    fov:50, exp:1.0},
  hogsmeade:{pos:[-40,14,35],  at:[0,3,0],    fov:50, exp:1.3,  lift:0.10},
  greathall:{pos:[0,9,30],     at:[0,4,-10],  fov:55, exp:1.25, lift:0.08},
  meadow:   {pos:[-50,12,40],  at:[0,3,0],    fov:50, exp:1.0},
  lake:     {pos:[-45,14,40],  at:[0,2,0],    fov:50, exp:1.3,  lift:0.10},
  ruins:    {pos:[-40,14,35],  at:[0,3,0],    fov:50, exp:1.0},
  valley:   {pos:[-45,16,35],  at:[0,3,0],    fov:50, exp:1.0},
  test:     {pos:[-25,12,25],  at:[0,2,-10],  fov:50, exp:1.0},
};
// การ์ดโหมด (แนวตั้ง 600×800) • map = แผนที่ที่ใช้ถ่าย • mode = โหมดเกมตอนถ่าย (train = มีหุ่นซ้อม) • grade = โทนมืดฟ้า-ม่วงเข้าธีมเมนู 0..1
const MODE_SHOTS={
  ffa:  {map:'ruins',     pos:[-20,8,20],  at:[0,3,0],   fov:55, exp:1.0,  grade:0.55},
  tdm:  {map:'castle',    pos:[0,10,22],   at:[0,4,0],   fov:55, exp:1.2,  grade:0.55},
  coop: {map:'forest',    pos:[-12,6,12],  at:[0,3,0],   fov:55, exp:1.2,  grade:0.6},
  train:{map:'test',      mode:'train', pos:[0,6,14], at:[0,2,0], fov:55, exp:1.0, grade:0.5},
};
// ===========================================================================================

const MAP_W=1280,MAP_H=800,MODE_W=600,MODE_H=800;
const A=process.argv.slice(2),flags=new Set(A.filter(a=>a.startsWith('--'))),names=A.filter(a=>!a.startsWith('--'));
const probe=flags.has('--probe')?names.splice(0):null,sheetOnly=flags.has('--sheet'),tryFile=flags.has('--try')?names.splice(0,1)[0]:null;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ---------- โค้ดที่ฉีดเข้าหน้าเกม • page helper ----------
const PAGE=`(function(){
const U=window.__ui={errs:[]};let now=performance.now();
addEventListener('error',e=>U.errs.push(String(e.message)));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));U.sleep=sleep;
U.step=(n=1,dt=1/60)=>{for(let i=0;i<n;i++){now+=dt*1000;
  if(WD.G&&WD.G.ph==='count')WD.G.cdT=1e9;                                  // ค้างที่นับถอยหลัง = ไม่มีใครขยับ/ยิง
  if(WD.G&&WD.G.mode!=='train'){WD.G.en=[];WD.G.queue=[];}                     // ไม่เอามอนสเตอร์ในภาพ
  try{WD.hostStep(dt);WD.render(dt,now);}catch(e){U.errs.push('step: '+String(e.stack||e.message).slice(0,300));}}};
U.ground=(x,z)=>{const M=WD.MAPS[WD.MAPID];return WD.TERR?WD.terrT(x*20+M.W/2,z*20+M.H/2)||0:0;};
// เริ่มเกมคนเดียวบนแผนที่ k (ครั้งแรกกดปุ่มเล่นคนเดียว) แล้วหยุดลูปจริง เดินเฟรมเอง
U.start=async(k,mode)=>{
  if(WD.screen==='menu'){document.getElementById('btnSolo').click();for(let i=0;i<50&&WD.screen!=='lobby';i++)await sleep(100);}
  else WD.hostToLobby();
  for(let a=0;a<4&&k!=='test'&&!(WD.MAPS[k]&&WD.MAPS[k].fm);a++){if(a){WD.FMAPS.pend.delete(k);WD.FMAPS.fail.delete(k);await sleep(500);}await WD.loadMapData(k);}   // โหลดข้อมูลแผนที่ (ลองใหม่ถ้าเซิร์ฟเวอร์สะดุด)
  if(!WD.MAPS[k])throw new Error('map '+k+' not found');
  const G=WD.G;G.mode=mode||(k==='test'?'train':'coop');G.mapPick=k;
  WD.hostStart();
  for(let i=0;i<80&&WD.screen!=='game';i++)await sleep(50);
  if(!U.frozen){window.requestAnimationFrame=()=>0;for(let i=1;i<20000;i++)clearInterval(i);U.frozen=true;}
  if(G.tr)G.tr.datk=0;
  WD.post.SHD.on=false;                                                        // เงาคลุมทั้งแผนที่ (ภาพมุมกว้าง)
  U.step(3);
  // รอไฟล์ .glb ของแผนที่ + โมเดลบ้าน/ของประกอบฉาก
  const fm=WD.MAPS[k]&&WD.MAPS[k].fm,t0=performance.now();
  if(fm&&fm.file){for(;performance.now()-t0<40000;){const e=performance.getEntriesByType('resource').find(r=>r.name.includes('/assets/'+fm.file));if(e&&e.responseEnd>0)break;await sleep(200);}}
  await sleep(2500);U.step(10);await sleep(2500);U.step(10);
  try{WD.grass.grassBake();}catch(e){U.errs.push('grass '+e.message);}        // หญ้าใหม่จากฉากที่โหลดครบแล้ว
  if(WD.MAPID!==k)throw new Error('map '+k+' did not start (got '+WD.MAPID+')');
  return {map:WD.MAPID,mode:G.mode,ms:Math.round(performance.now()-t0),gpu:U.gpu()};
};
U.gpu=()=>{try{const g=WD.gl.getContext(),d=g.getExtension('WEBGL_debug_renderer_info');return d?g.getParameter(d.UNMASKED_RENDERER_WEBGL):'?';}catch(e){return '?';}};
// ถ่าย 1 ภาพ: S = {pos,at,fov,exp,lift,sat,grade,rel} • w×h = ขนาดไฟล์ • คืน dataURL jpeg
U.shoot=(S,w,h,kb)=>{
  const P=S.pos.slice(),T=S.at.slice();
  if(S.rel!==false){P[1]+=U.ground(P[0],P[2]);T[1]+=U.ground(T[0],T[2]);}
  WD.camHook=c=>{c.position.set(P[0],P[1],P[2]);if(c.fov!==(S.fov||50)){c.fov=S.fov||50;c.updateProjectionMatrix();}c.lookAt(T[0],T[1],T[2]);};
  const gl=WD.gl,ex0=gl.toneMappingExposure;
  U.step(S.frames||40);
  gl.toneMappingExposure=ex0*(S.exp||1);
  const bl=WD.bloom,b0=bl?bl.strength:0;if(bl&&S.bloom!=null)bl.strength=b0*S.bloom;
  U.step(1);
  const hid=[];for(const o of WD.PM3.values())for(const e of [o.g,...((o.g.userData&&o.g.userData.extra)||[])])if(e&&e.visible){e.visible=false;hid.push(e);}   // ซ่อนตัวละครเรา
  gl.shadowMap.needsUpdate=true;WD.composer.render();
  const src=gl.domElement,cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');
  x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
  const f=[];if(S.sat)f.push('saturate('+S.sat+')');if(S.bright)f.push('brightness('+S.bright+')');if(S.contrast)f.push('contrast('+S.contrast+')');x.filter=f.join(' ')||'none';
  // ครอบภาพให้ได้สัดส่วนเป้าหมาย (กลางภาพ)
  const sa=src.width/src.height,ta=w/h;let sw=src.width,sh=src.height;if(sa>ta)sw=sh*ta;else sh=sw/ta;
  x.drawImage(src,(src.width-sw)/2,(src.height-sh)/2,sw,sh,0,0,w,h);x.filter='none';
  for(const e of hid)e.visible=true;gl.toneMappingExposure=ex0;if(bl)bl.strength=b0;
  if(S.lift){x.globalCompositeOperation='screen';x.fillStyle='rgba(70,80,110,'+S.lift+')';x.fillRect(0,0,w,h);x.globalCompositeOperation='source-over';}
  if(S.grade)U.grade(x,w,h,S.grade);
  const st=U.stats(x,w,h);
  let q=0.82,url;for(;;){url=cv.toDataURL('image/jpeg',q);if(url.length*0.75/1024<=(kb||220)||q<=0.6)break;q=+(q-0.04).toFixed(2);}
  return {url,q,kb:Math.round(url.length*0.75/1024),st};
};
// โทนเมนู: มืดลง + ฟ้าเข้ม → ม่วงอ่อน + ขอบมืด (ตัวหนังสือบนการ์ดอ่านง่าย)
U.grade=(x,w,h,k)=>{
  x.globalCompositeOperation='multiply';const g=x.createLinearGradient(0,0,0,h);
  g.addColorStop(0,'rgba(120,140,215,'+k+')');g.addColorStop(1,'rgba(140,110,200,'+k+')');x.fillStyle=g;x.fillRect(0,0,w,h);
  x.globalCompositeOperation='source-over';
  const v=x.createRadialGradient(w/2,h*0.42,Math.min(w,h)*0.25,w/2,h*0.5,Math.max(w,h)*0.75);v.addColorStop(0,'rgba(6,8,22,0)');v.addColorStop(1,'rgba(6,8,22,'+(0.65*k+0.15)+')');x.fillStyle=v;x.fillRect(0,0,w,h);
  const b=x.createLinearGradient(0,h*0.55,0,h);b.addColorStop(0,'rgba(8,10,28,0)');b.addColorStop(1,'rgba(8,10,28,'+(0.55*k)+')');x.fillStyle=b;x.fillRect(0,0,w,h);
};
// ค่าความสว่าง: เฉลี่ย, % ดำสนิท, % ขาวจ้า (บน 70% ของภาพ / ทั้งภาพ)
U.stats=(x,w,h)=>{const d=x.getImageData(0,0,w,h).data;let s=0,n=0,bk=0,wt=0,su=0,nu=0;const top=Math.floor(h*0.7);
  for(let j=0;j<h;j+=4)for(let i=0;i<w;i+=4){const p=(j*w+i)*4,l=0.2126*d[p]+0.7152*d[p+1]+0.0722*d[p+2];s+=l;n++;if(l<8)bk++;if(l>248)wt++;if(j<top){su+=l;nu++;}}
  return {avg:Math.round(s/n),top:Math.round(su/nu),black:+(bk/n*100).toFixed(1),white:+(wt/n*100).toFixed(1)};};
// แผ่นรวมภาพ: cells = [{url,label,w,h}] วางเรียงตามแถว
U.sheet=async(rows,W)=>{const imgs=await Promise.all(rows.flat().map(c=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=c.url;})));
  let H=0;for(const row of rows)H+=Math.max(...row.map(c=>c.h))+26;
  const S=document.createElement('canvas');S.width=W;S.height=H;const x=S.getContext('2d');x.fillStyle='#0b0e1a';x.fillRect(0,0,W,H);
  let y=0,k=0;for(const row of rows){let cx=0;const rh=Math.max(...row.map(c=>c.h));
    for(const c of row){const im=imgs[k++];if(im)x.drawImage(im,cx,y+22,c.w,c.h);else{x.fillStyle='#400';x.fillRect(cx,y+22,c.w,c.h);}
      x.fillStyle='#e8ecff';x.font='bold 15px sans-serif';x.fillText(c.label,cx+6,y+16);x.strokeStyle='#000';x.strokeRect(cx+0.5,y+22.5,c.w-1,c.h-1);cx+=c.w+4;}
    y+=rh+26;}
  return S.toDataURL('image/jpeg',0.86);};
true;})()`;

async function main(){
  if(!CHROME)throw new Error('ไม่พบ Chrome / Edge (no Chrome found)');
  try{await fetch(BASE+'index.html',{method:'HEAD'});}catch(e){throw new Error('เปิด python tools/serve.py ก่อน (game server on :8765 not running)');}
  fs.mkdirSync(OUT_MAPS,{recursive:true});fs.mkdirSync(OUT_MODES,{recursive:true});fs.mkdirSync(SHOTS,{recursive:true});
  const prof=fs.mkdtempSync(path.join(os.tmpdir(),'wdui-'));
  const ch=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--user-data-dir='+prof,'--window-size='+MAP_W*SS+','+MAP_H*SS,'--hide-scrollbars','--no-first-run','--mute-audio',
    '--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-background-timer-throttling','--disable-renderer-backgrounding','about:blank'],{stdio:'ignore'});
  let ws,id=0;const pend={};
  try{
    let tgt;for(let i=0;i<80&&!tgt;i++){try{tgt=(await (await fetch('http://127.0.0.1:'+PORT+'/json/list')).json()).find(t=>t.type==='page');}catch(e){}if(!tgt)await sleep(250);}
    if(!tgt)throw new Error('Chrome ไม่ตอบ (no DevTools target on port '+PORT+')');
    ws=new WebSocket(tgt.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
    const perr=[];
    ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend[d.id]){pend[d.id](d);delete pend[d.id];return;}
      if(d.method==='Runtime.exceptionThrown'){const e=d.params.exceptionDetails;perr.push(((e.exception&&e.exception.description)||e.text).slice(0,300));}
      if(d.method==='Runtime.consoleAPICalled'&&d.params.type==='error')perr.push(d.params.args.map(a=>a.value!==undefined?String(a.value):(a.description||a.type)).join(' ').slice(0,300));};
    const cmd=(method,params)=>new Promise((r,j)=>{const i=++id;pend[i]=d=>d.error?j(new Error(method+': '+d.error.message)):r(d.result);ws.send(JSON.stringify({id:i,method,params:params||{}}));});
    const ev=async(js)=>{const r=await cmd('Runtime.evaluate',{expression:js,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error((r.exceptionDetails.exception||{}).description||r.exceptionDetails.text);return r.result.value;};
    const size=async(w,h)=>{await cmd('Emulation.setDeviceMetricsOverride',{width:w*SS,height:h*SS,deviceScaleFactor:1,mobile:false});await sleep(300);await ev(`dispatchEvent(new Event('resize'));true`);};
    // ก่อนโหลดหน้า: มีชื่อ/หน้าตาแล้ว (ไม่เปิดหน้าสร้างตัวละคร) + กราฟิกสูง
    await cmd('Page.addScriptToEvaluateOnNewDocument',{source:`if(location.port==='8765'){try{performance.setResourceTimingBufferSize(20000);localStorage.setItem('wd_look','"0.0.0.0.0.0.0.0.0"');localStorage.setItem('wd_name','"shots"');localStorage.setItem('wd_gfx','high');}catch(e){}}`});
    await size(MAP_W,MAP_H);
    await cmd('Runtime.enable');
    // เปิดหน้าเกม (ถ้าโหลดไม่ขึ้น ลองใหม่ 1 ครั้ง — ไฟล์อาจกำลังถูกแก้อยู่) • open the game page, retry once
    let ok=false;
    for(let a=0;a<2&&!ok;a++){perr.length=0;await cmd('Page.navigate',{url:BASE+'?nointro&nosw'});
      for(let i=0;i<240&&!ok;i++){await sleep(250);try{ok=await ev(`!!(window.WD&&WD.loadMapData&&document.getElementById('btnSolo')&&document.readyState==='complete')`);}catch(e){}}}
    if(!ok)throw new Error('หน้าเกมโหลดไม่ขึ้น (game page did not load):\n'+[...new Set(perr)].slice(0,10).join('\n'));
    await sleep(1500);await ev(PAGE);
    const save=(file,url)=>{fs.writeFileSync(file,Buffer.from(url.split(',')[1],'base64'));return Math.round(fs.statSync(file).size/1024);};
    const rel=f=>path.relative(ROOT,f).replace(/\\/g,'/');

    if(probe){   // ---- มุมทดลอง 6 มุมต่อแผนที่ • exploration views ----
      for(const k of probe){
        const info=await ev(`__ui.start(${JSON.stringify(k)})`);console.log('map',JSON.stringify(info));
        const M=await ev(`(()=>{const M=WD.MAPS[${JSON.stringify(k)}];return {hw:M.W/40,hh:M.H/40};})()`),hw=M.hw,hh=M.hh,H=Math.max(hw,hh)*0.55;
        const views=[['NW',[-hw*0.75,H,-hh*0.75],[0,0,0]],['NE',[hw*0.75,H,-hh*0.75],[0,0,0]],['SE',[hw*0.75,H,hh*0.75],[0,0,0]],['SW',[-hw*0.75,H,hh*0.75],[0,0,0]],
          ['top',[0,Math.max(hw,hh)*1.25,0.01],[0,0,0],70],['low S',[0,4,hh*0.55],[0,3,0]]];
        const cells=[];
        for(const [n,pos,at,fov] of views){const r=await ev(`__ui.shoot(${JSON.stringify({pos,at,fov:fov||55,frames:20})},640,400,400)`);
          cells.push({url:r.url,label:`${k} ${n} pos=${pos.map(v=>v.toFixed(0))} avg=${r.st.avg}`,w:640,h:400});}
        const s=await ev(`__ui.sheet(${JSON.stringify([cells.slice(0,3),cells.slice(3)])},1928)`);
        console.log('✓ '+rel(path.join(SHOTS,'ui-probe-'+k+'.jpg'))+' '+save(path.join(SHOTS,'ui-probe-'+k+'.jpg'),s)+' KB  hw='+hw+' hh='+hh);
      }
      return;
    }
    if(tryFile){   // ---- ลองหลายมุมจากไฟล์ JSON {"castle":[{pos,at,...},...], "mode:ffa":[{map,pos,at,...}]} → shots/ui-try-<key>.jpg ----
      const T=JSON.parse(fs.readFileSync(path.resolve(tryFile),'utf8')),keys=Object.keys(T).sort((a,b)=>a.startsWith('mode:')-b.startsWith('mode:'));let portrait=false;
      for(const key of keys){const isMode=key.startsWith('mode:'),k=isMode?key.slice(5):key,w=isMode?MODE_W:MAP_W,h=isMode?MODE_H:MAP_H,cw=isMode?300:640,cells=[];
        if(isMode&&!portrait){await size(MODE_W,MODE_H);portrait=true;}
        let cur='';
        for(const [i,V0] of T[key].entries()){const V=Object.assign({},isMode?MODE_SHOTS[k]:MAP_SHOTS[k],V0),map=isMode?V.map:k,mode=isMode?V.mode||null:null;
          if(cur!==map+'|'+mode){await ev(`__ui.start(${JSON.stringify(map)},${JSON.stringify(mode)})`);cur=map+'|'+mode;}
          const r=await ev(`__ui.shoot(${JSON.stringify(V)},${w},${h},400)`);
          cells.push({url:r.url,label:`${i}: ${map} pos=${V.pos} at=${V.at} avg=${r.st.avg} top=${r.st.top} blk=${r.st.black}% wht=${r.st.white}%`,w:cw,h:400});}
        const rows=[];const per=isMode?5:3;for(let i=0;i<cells.length;i+=per)rows.push(cells.slice(i,i+per));
        const f=path.join(SHOTS,'ui-try-'+key.replace(':','-')+'.jpg'),s=await ev(`__ui.sheet(${JSON.stringify(rows)},${per*(cw+4)})`);console.log('✓ '+rel(f)+' '+save(f,s)+' KB');}
      return;
    }
    const want=names.length?names:[...Object.keys(MAP_SHOTS),...Object.keys(MODE_SHOTS)];
    if(!sheetOnly){
      // แผนที่ก่อน (1280×800) แล้วโหมด (600×800) — ใช้แผนที่เดิมต่อถ้าตรงกัน
      for(const k of want.filter(k=>MAP_SHOTS[k])){
        const info=await ev(`__ui.start(${JSON.stringify(k)})`);
        const r=await ev(`__ui.shoot(${JSON.stringify(MAP_SHOTS[k])},${MAP_W},${MAP_H},${MAP_SHOTS[k].kb||220})`);
        const f=path.join(OUT_MAPS,k+'.jpg');console.log(`✓ ${rel(f)} ${save(f,r.url)} KB q=${r.q} ${JSON.stringify(r.st)} (${info.ms} ms, ${info.gpu})`);
      }
      const ms=want.filter(k=>MODE_SHOTS[k]);
      if(ms.length){await size(MODE_W,MODE_H);
        for(const k of ms){const S=MODE_SHOTS[k];
          await ev(`__ui.start(${JSON.stringify(S.map)},${JSON.stringify(S.mode||null)})`);
          const r=await ev(`__ui.shoot(${JSON.stringify(S)},${MODE_W},${MODE_H},${S.kb||180})`);
          const f=path.join(OUT_MODES,k+'.jpg');console.log(`✓ ${rel(f)} ${save(f,r.url)} KB q=${r.q} ${JSON.stringify(r.st)}`);}
      }
    }
    // ---- แผ่นรวมภาพ • contact sheet ----
    const t=Date.now(),mk=Object.keys(MAP_SHOTS).filter(k=>fs.existsSync(path.join(OUT_MAPS,k+'.jpg'))).map(k=>({url:`${BASE}assets/ui/maps/${k}.jpg?t=${t}`,label:k,w:384,h:240}));
    const md=Object.keys(MODE_SHOTS).filter(k=>fs.existsSync(path.join(OUT_MODES,k+'.jpg'))).map(k=>({url:`${BASE}assets/ui/modes/${k}.jpg?t=${t}`,label:'mode: '+k,w:240,h:320}));
    const rows=[];for(let i=0;i<mk.length;i+=5)rows.push(mk.slice(i,i+5));if(md.length)rows.push(md);
    if(rows.length){const s=await ev(`__ui.sheet(${JSON.stringify(rows)},${5*388})`);const f=path.join(SHOTS,'ui-shots-sheet.jpg');console.log('✓ '+rel(f)+' '+save(f,s)+' KB');}
    const errs=await ev(`__ui.errs`);if(errs.length)console.log('page errors:\n'+[...new Set(errs)].slice(0,20).join('\n'));
  }finally{try{ws&&ws.close();}catch(e){}ch.kill();await sleep(400);try{fs.rmSync(prof,{recursive:true,force:true});}catch(e){}}
}
main().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
