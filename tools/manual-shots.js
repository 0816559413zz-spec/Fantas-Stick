// ถ่ายรูปคู่มือ VFX Studio ใหม่ (manual/img/*.jpg) + คำนวณตำแหน่งเลขบนรูป (MARKS ใน manual/index.html)
// ใช้: python tools/serve.py (อีกหน้าต่าง) แล้ว  node tools/manual-shots.js  [ชื่อรูป ...]
// เปิด Chrome แบบไม่มีหน้าต่าง 1760×1000 ผ่าน DevTools protocol (ไม่ต้องลงอะไรเพิ่ม) • ตัวเลขวัดจากกรอบของปุ่มจริง ไม่ต้องกะเอง
// แก้ UI แล้ว → รันใหม่ ถ้าปุ่มที่ชี้เปลี่ยนชื่อ/ย้าย ให้แก้ SHOTS ข้างล่าง (sel = ฟังก์ชันในหน้าเว็บที่คืน element)
const {spawn}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const ROOT=path.join(__dirname,'..'),OUT=path.join(ROOT,'manual','img'),URL0='http://localhost:8765/studio.html',W=1760,H=1000,PORT=9333;
const CHROME=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p=>fs.existsSync(p));

// ตัวช่วยที่ฉีดเข้าหน้าเว็บ: q(css) • t(css,คำ) = element ที่มีคำนั้น • f(key) = ช่องค่าในแผงขวาของ key • U(...) = กรอบรวมหลายอัน
const HELP=`window.__m={q:s=>document.querySelector(s),t:(s,w)=>[...document.querySelectorAll(s)].find(e=>e.textContent.includes(w)),
  f:k=>[...document.querySelectorAll('#stInsp .stF,#mkInsp .stF')].find(e=>{const s=e.querySelector('label small');return s&&s.textContent.split(' ')[0]===k;}),
  wait:ms=>new Promise(r=>setTimeout(r,ms)),hover:e=>{e.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));}};true`;
// แต่ละรูป: k = ชื่อรูป • setup = เตรียมหน้าจอ • clip = กรอบที่ถ่าย (null = ทั้งจอ) • marks = [เลข, ตำแหน่งป้าย tl|c, ฟังก์ชันหา element (หรือ array = กรอบรวม)]
const SHOTS=[
 {k:'fx_main',setup:`await STUDIO.ws('fx');await STUDIO.load('start/crystal_nova');STUDIO.cam('side');STUDIO.select('crown');STUDIO.seek(0.42);await __m.wait(600);STUDIO.seek(0.42);`,
  marks:[[1,'tl',`q('#mkTabs')`],[2,'tl',`[q('#stFile'),q('#stBRedo')]`],[3,'tl',`[q('#stPal').parentElement,q('#stK').parentElement]`],[4,'tl',`[q('#stMap').parentElement,q('#stQ').parentElement]`],
   [5,'tl',`[q('#stBSheet'),q('#stBHelp')]`],[6,'c',`q('#stLib')`],[7,'c',`q('#stView')`,{inset:[90,140,120,140]}],[8,'tl',`q('#stCams')`],[9,'tl',`q('#stHud')`],[10,'tl',`q('#stTl .bar')`],
   [11,'c',`q('#stRows')`],[12,'c',`q('#stInsp')`],[13,'tl',`q('#stStat')`]]},
 {k:'fx_timeline',setup:`STUDIO.select('crown');STUDIO.seek(0.42);await __m.wait(300);`,clip:`q('#stTl')`,
  marks:[[1,'tl',`[q('#stToStart'),q('#stLoop')]`],[2,'tl',`q('#stTime')`],[3,'tl',`[q('#stSp0\\\\.1'),q('#stSp1')]`],[4,'tl',`q('#stAddB')`],
   [5,'tl',`q('#stRows .stName.head')`],[6,'tl',`q('#stRuler')`],[7,'tl',`q('#stRows .stName.on .grip')`],[8,'tl',`q('#stRows .stName.on .act')`],[9,'c',`q('#stRows .stSeg.on')`]]},
 {k:'fx_ctx',setup:`const r=q('#stRows .stName.on').getBoundingClientRect();q('#stRows .stName.on').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:r.left+150,clientY:r.top-150}));await __m.wait(250);`,
  clip:`q('#st .stCtx')`,pad:6,after:`document.querySelectorAll('#st .stPop').forEach(p=>p.remove());`,marks:[]},
 {k:'fx_insp',setup:`STUDIO.select('crown');q('#stInsp').scrollTop=0;await __m.wait(300);`,clip:`q('#stInsp')`,
  marks:[[1,'tl',`q('#stInsp .stCard')`],[2,'tl',`q('#stInsp .find')`],[3,'tl',`q('#stInsp .stShapes').parentElement`],[4,'tl',`f('model')`],[5,'tl',`f('mat')`],[6,'tl',`f('col')`],[7,'tl',`f('scale')`]]},
 {k:'fx_curve',setup:`STUDIO.select('shock');await __m.wait(200);let c=q('#stInsp .stCurve');if(!c){STUDIO.select('crown');await __m.wait(200);c=q('#stInsp .stCurve');}c.closest('.stF').scrollIntoView({block:'center'});await __m.wait(200);`,
  clip:`q('#stInsp .stCurve').closest('.stF')`,pad:4,marks:[[1,'c',`q('#stInsp .stCurve canvas')`],[2,'tl',`q('#stInsp .stCurve select')`]]},
 {k:'fx_add',setup:`q('#stAddB').click();await __m.wait(250);`,clip:`q('#stAddMenu')`,pad:6,after:`document.querySelectorAll('#st .stPop').forEach(p=>p.remove());`,
  marks:[[1,'c',`q('#stAddMenu input')`],[2,'tl',`q('#stAddMenu .cat:nth-child(3) h4')`],[3,'c',`q('#stAddMenu .cat:nth-child(2) .opt')`]]},
 {k:'fx_new',setup:`q('#stBNew').click();await __m.wait(500);`,clip:`q('#st .stModal .box')`,pad:6,after:`document.querySelectorAll('#st .stModal').forEach(p=>p.remove());`,marks:[]},
 {k:'fx_bind',setup:`STUDIO.select(null);STUDIO.state.sel=null;q('#stRows .stName.head').click();await __m.wait(400);const b=t('#stInsp summary','ตรวจไฟล์');b.scrollIntoView({block:'start'});await __m.wait(200);`,
  clip:`[t('#stInsp details','ตรวจไฟล์'),t('#stInsp details','ผูกกับท่า')]`,marks:[[1,'tl',`t('#stInsp details','ตรวจไฟล์')`],[2,'c',`t('#stInsp details','ผูกกับท่า').querySelector('.in>div>div:nth-child(2)')`],[3,'tl',`t('#stInsp details','ผูกกับท่า').querySelector('.in>div>div:first-child')`]]},
 {k:'mesh_main',setup:`await STUDIO.ws('mesh');await STUDIO.mesh.open('crystal_crown');STUDIO.mesh.select('outer');STUDIO.cam('orbit');await __m.wait(800);STUDIO.tick(20);`,
  marks:[[1,'c',`q('#mkLib')`],[2,'tl',`q('#mkBNew')`],[3,'c',`q('#stView')`,{inset:[120,200,120,200]}],[4,'tl',`t('#mkBot button','ชิ้นส่วน')`],[5,'tl',`[t('#mkBot button','ย้าย'),t('#mkBot button','ขนาด')]`],
   [6,'tl',`t('#mkBot button','โครงลวด')`],[7,'tl',`t('#mkBot button','ใส่ในเอฟเฟกต์')`],[8,'tl',`t('#mkBot button','glb')`],[9,'c',`q('#mkRows')`],[10,'c',`q('#mkInsp')`],[11,'tl',`t('#mkBot button','บันทึก')`]]},
 {k:'mesh_add',setup:`t('#mkBot button','ชิ้นส่วน').click();await __m.wait(250);`,clip:`q('#mkAddMenu')`,pad:4,after:`q('#mkAddMenu').hidden=true;`,marks:[]},
 {k:'tex_main',setup:`await STUDIO.ws('tex');await STUDIO.tex.open('fire_sim');await __m.wait(2500);STUDIO.tick(12);`,
  marks:[[1,'c',`q('#mkLib')`],[2,'c',`q('#mkTexView .pv')`],[3,'c',`q('#mkTexView .atlas')`],[4,'c',`q('#mkGens')`],[5,'tl',`q('#mkInsp .mkRamp')`],[6,'tl',`t('#mkBot button','นำเข้าภาพ')`],
   [7,'tl',`[t('#mkBot button','เป็นเม็ด'),t('#mkBot button','การ์ดภาพ')]`],[8,'tl',`t('#mkBot button','ลองใน 3D')`],[9,'tl',`t('#mkBot button','บันทึก')`],[10,'tl',`q('#mkInsp .stF')`]]},
 {k:'vol_main',setup:`await STUDIO.ws('vol');await STUDIO.vol.open('fire3d_column');await __m.wait(2500);STUDIO.tick(30);`,
  marks:[[1,'c',`q('#mkGens')`],[2,'tl',`q('#mkVRun')`],[3,'tl',`q('#mkVStat')`],[4,'c',`q('#stView')`,{inset:[100,260,120,260]}],[5,'c',`q('#mkInsp')`],[6,'tl',`t('#mkBot button','ใส่ในเอฟเฟกต์')`],[7,'tl',`t('#mkBot button','บันทึก')`],[8,'c',`q('#mkLib')`]]},
];

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
  if(!CHROME)throw new Error('ไม่พบ Chrome / Edge');
  const only=process.argv.slice(2),prof=fs.mkdtempSync(path.join(os.tmpdir(),'wdshot-'));
  const ch=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--user-data-dir='+prof,'--window-size='+W+','+H,'--hide-scrollbars','--no-first-run','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','about:blank'],{stdio:'ignore'});
  let ws,id=0;const pend={};
  try{
    let tgt;for(let i=0;i<60&&!tgt;i++){try{tgt=(await (await fetch('http://127.0.0.1:'+PORT+'/json/list')).json()).find(t=>t.type==='page');}catch(e){}if(!tgt)await sleep(250);}
    ws=new WebSocket(tgt.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
    ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend[d.id]){pend[d.id](d);delete pend[d.id];}};
    const cmd=(method,params)=>new Promise((r,j)=>{const i=++id;pend[i]=d=>d.error?j(new Error(method+': '+d.error.message)):r(d.result);ws.send(JSON.stringify({id:i,method,params:params||{}}));});
    const ev=async(js)=>{const r=await cmd('Runtime.evaluate',{expression:js,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error((r.exceptionDetails.exception||{}).description||r.exceptionDetails.text);return r.result.value;};
    await cmd('Emulation.setDeviceMetricsOverride',{width:W,height:H,deviceScaleFactor:1,mobile:false});
    await cmd('Page.navigate',{url:URL0});
    for(let i=0;i<120;i++){await sleep(500);try{if(await ev(`!!(window.STUDIO&&STUDIO.state.ready&&STUDIO.state.fx&&document.getElementById('mkTabs'))`))break;}catch(e){}}
    await sleep(1500);await ev(HELP);
    const res={};
    for(const S of SHOTS){if(only.length&&!only.includes(S.k))continue;
      await ev(`(async()=>{const {q,t,f}=__m;${S.setup}})()`);await sleep(350);
      const box=await ev(`(()=>{const {q,t,f}=__m;const R=x=>{const a=[].concat(x).filter(Boolean).map(e=>e.getBoundingClientRect());if(!a.length)return null;const l=Math.min(...a.map(r=>r.left)),tp=Math.min(...a.map(r=>r.top));return {x:l,y:tp,w:Math.max(...a.map(r=>r.right))-l,h:Math.max(...a.map(r=>r.bottom))-tp};};
        let C=${S.clip?`R(${S.clip})`:'{x:0,y:0,w:innerWidth,h:innerHeight}'};const p=${S.pad||0};C={x:Math.max(0,C.x-p),y:Math.max(0,C.y-p),w:C.w+2*p,h:C.h+2*p};C.w=Math.min(C.w,innerWidth-C.x);C.h=Math.min(C.h,innerHeight-C.y);
        const M=[${S.marks.map(([n,pos,sel,o])=>`(()=>{let r=R(${sel});if(!r)return {n:${n},miss:true};${o&&o.inset?`r={x:r.x+${o.inset[3]},y:r.y+${o.inset[0]},w:r.w-${o.inset[1]+o.inset[3]},h:r.h-${o.inset[0]+o.inset[2]}};`:''}return {n:${n},pos:'${pos}',x:r.x,y:r.y,w:r.w,h:r.h};})()`).join(',')}];
        return {C,M};})()`);
      const C=box.C,r2=v=>Math.round(v*100)/100;
      const marks=box.M.map(m=>{if(m.miss){console.warn('  ⚠ '+S.k+' เลข '+m.n+' หาไม่เจอ');return null;}const x=Math.max(m.x,C.x),y=Math.max(m.y,C.y),x2=Math.min(m.x+m.w,C.x+C.w),y2=Math.min(m.y+m.h,C.y+C.h);
        return {n:m.n,pos:m.pos,x:r2((x-C.x)/C.w*100),y:r2((y-C.y)/C.h*100),w:r2((x2-x)/C.w*100),h:r2((y2-y)/C.h*100)};}).filter(Boolean);
      const shot=await cmd('Page.captureScreenshot',{format:'jpeg',quality:88,clip:{x:C.x,y:C.y,width:C.w,height:C.h,scale:1},captureBeyondViewport:false});
      fs.writeFileSync(path.join(OUT,S.k+'.jpg'),Buffer.from(shot.data,'base64'));
      res[S.k]={w:Math.round(C.w),h:Math.round(C.h),marks};console.log('✓ '+S.k+' '+Math.round(C.w)+'×'+Math.round(C.h)+' เลข '+marks.length);
      if(S.after)await ev(`(()=>{const {q,t,f}=__m;${S.after}})()`);}
    // เขียนตำแหน่งเลข + ขนาดรูปกลับเข้า manual/index.html
    const HP=path.join(ROOT,'manual','index.html');let html=fs.readFileSync(HP,'utf8');const mm=html.match(/const MARKS = (\{.*\});/);const MK=JSON.parse(mm[1]);
    for(const k in res){MK[k]={marks:res[k].marks};html=html.replace(new RegExp('(src="img/'+k+'\\.jpg"[^>]*?width=")\\d+(" height=")\\d+'),'$1'+res[k].w+'$2'+res[k].h);}
    html=html.replace(mm[0],'const MARKS = '+JSON.stringify(MK)+';');fs.writeFileSync(HP,html);console.log('เขียน MARKS ลง manual/index.html แล้ว');
    return res;
  }finally{try{ws&&ws.close();}catch(e){}ch.kill();await sleep(300);try{fs.rmSync(prof,{recursive:true,force:true});}catch(e){}}}
main().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
