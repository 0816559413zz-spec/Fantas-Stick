// เปิดหน้าเกม/สตูดิโอใน Chrome แบบไม่มีหน้าต่าง (DevTools protocol, ไม่ต้องลงอะไรเพิ่ม) แล้วรันสคริปต์ในหน้า — ใช้ทดสอบ/ถ่ายภาพอัตโนมัติ
// ต้องรัน python tools/serve.py ก่อน (พอร์ต 8765) • รันพร้อมกันหลายตัวได้ (แต่ละตัวใช้พอร์ต debug + โปรไฟล์ชั่วคราวของตัวเอง)
//
// ใช้:
//   node tools/headless.js --url "studio.html?fx=frost/slam&sheet=0.1,0.3,0.6&save=x" --wait-shot x     ← รอจน shots/x.jpg ถูกเขียน (contact sheet ของสตูดิโอ)
//   node tools/headless.js --game --js my-test.js                                                       ← เปิดเกม (?nosw) + โหลด tools/hl-game.js (ตัวช่วย HL) แล้วรันไฟล์ js ในหน้า
//   node tools/headless.js --game --eval "await HL.solo({kit:'1'});return HL.info()"
// ตัวเลือก: --w 1280 --h 720 • --timeout 180 (วินาที) • --shot out.jpg (ถ่ายทั้งจอตอนจบ ลง shots/) • --quiet (ไม่พิมพ์ console log ของหน้า)
// สคริปต์ (--js/--eval) = body ของ async function ในหน้า: return ค่าอะไรก็ได้ (พิมพ์เป็น JSON) •
//   ถ้าคืน {images:{ชื่อ:dataURL}} → เขียนเป็น shots/<ชื่อ>.jpg|png ให้ Claude เปิดด้วย Read
// จบแล้วพิมพ์ error ของหน้า (window.onerror / console.error) ทั้งหมด • exit code 1 = สคริปต์ล้ม/หมดเวลา
const {spawn}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os'),net=require('net');
const ROOT=path.join(__dirname,'..'),BASE='http://localhost:8765/';
const CHROME=[process.env.CHROME||'','C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p=>fs.existsSync(p));
const A={};{const a=process.argv.slice(2);for(let i=0;i<a.length;i++){if(!a[i].startsWith('--'))continue;const k=a[i].slice(2),v=a[i+1]&&!a[i+1].startsWith('--')?a[++i]:true;A[k]=v;}}
const W=+(A.w||1280),H=+(A.h||720),TMO=+(A.timeout||180)*1000;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const freePort=()=>new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
function saveImg(name,data){const m=/^data:image\/(png|jpeg);base64,(.*)$/.exec(data);if(!m)return null;const ext=m[1]==='png'?'png':'jpg';const d=path.join(ROOT,'shots');fs.mkdirSync(d,{recursive:true});
  const f=path.join(d,String(name).replace(/[^\w.\-]/g,'_')+'.'+ext);fs.writeFileSync(f,Buffer.from(m[2],'base64'));return path.relative(ROOT,f).replace(/\\/g,'/');}
async function main(){
  if(!CHROME)throw new Error('ไม่พบ Chrome / Edge');
  let url=A.url||(A.game?'index.html?nosw':'');if(!url)throw new Error('ต้องมี --url หรือ --game');
  if(!/^https?:/.test(url))url=BASE+url.replace(/^\//,'');
  const port=await freePort(),prof=fs.mkdtempSync(path.join(os.tmpdir(),'wdhl-'));
  const ch=spawn(CHROME,['--headless=new','--remote-debugging-port='+port,'--user-data-dir='+prof,'--window-size='+W+','+H,'--hide-scrollbars','--no-first-run','--mute-audio','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-background-timer-throttling','--disable-renderer-backgrounding',...(process.getuid&&process.getuid()===0?['--no-sandbox']:[]),'about:blank'],{stdio:'ignore'});
  let ws,id=0;const pend={},errs=[],logs=[];
  const timer=setTimeout(()=>{console.error('✗ หมดเวลา '+TMO/1000+' วิ');finish(1);},TMO);
  let done=false;
  async function finish(code){if(done)return;done=true;clearTimeout(timer);try{ws&&ws.close();}catch(e){}ch.kill();await sleep(300);try{fs.rmSync(prof,{recursive:true,force:true});}catch(e){}process.exit(code);}
  try{
    let tgt;for(let i=0;i<80&&!tgt;i++){try{tgt=(await (await fetch('http://127.0.0.1:'+port+'/json/list')).json()).find(t=>t.type==='page');}catch(e){}if(!tgt)await sleep(250);}
    if(!tgt)throw new Error('Chrome ไม่ตอบ');
    ws=new WebSocket(tgt.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
    ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend[d.id]){pend[d.id](d);delete pend[d.id];return;}
      if(d.method==='Fetch.requestPaused'){cdnServe(d.params);return;}
      if(d.method==='Runtime.consoleAPICalled'){const t=d.params.type,s=d.params.args.map(a=>a.value!==undefined?(typeof a.value==='string'?a.value:JSON.stringify(a.value)):(a.description||a.type)).join(' ');
        if(t==='error'||t==='assert')errs.push('console.error: '+s.slice(0,400));else if(!A.quiet)logs.push(s.slice(0,300));}
      if(d.method==='Runtime.exceptionThrown'){const e=d.params.exceptionDetails;errs.push('uncaught: '+((e.exception&&e.exception.description)||e.text).slice(0,500));}};
    const cmd=(method,params)=>new Promise((r,j)=>{const i=++id;pend[i]=d=>d.error?j(new Error(method+': '+d.error.message)):r(d.result);ws.send(JSON.stringify({id:i,method,params:params||{}}));});
    const ev=async(js,aw=true)=>{const r=await cmd('Runtime.evaluate',{expression:js,awaitPromise:aw,returnByValue:true});if(r.exceptionDetails)throw new Error((r.exceptionDetails.exception||{}).description||r.exceptionDetails.text);return r.result.value;};
    await cmd('Runtime.enable');
    // CDN_DIR=<folder> → serve https://unpkg.com/<pkg>@<ver>/... from <folder>/<pkg>@<ver>/... (cloud sessions where the CDN is blocked; npm tarballs unpacked there)
    const CDN=process.env.CDN_DIR;
    function cdnServe(q){const f=path.join(CDN,decodeURIComponent(new URL(q.request.url).pathname));
      if(!fs.existsSync(f)||!fs.statSync(f).isFile()){console.log('cdn miss '+q.request.url);return cmd('Fetch.failRequest',{requestId:q.requestId,errorReason:'FileNotFound'}).catch(()=>{});}
      const ct=/\.m?js$/.test(f)?'application/javascript':'application/octet-stream';
      cmd('Fetch.fulfillRequest',{requestId:q.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:ct},{name:'Access-Control-Allow-Origin',value:'*'}],body:fs.readFileSync(f).toString('base64')}).catch(()=>{});}
    if(CDN){await cmd('Network.enable');await cmd('Network.setBypassServiceWorker',{bypass:true});await cmd('Fetch.enable',{patterns:[{urlPattern:'https://unpkg.com/*'}]});}
    await cmd('Emulation.setDeviceMetricsOverride',{width:W,height:H,deviceScaleFactor:1,mobile:false});
    await cmd('Page.navigate',{url});
    // รอให้หน้าโหลดเสร็จ: เกม = มี window.WD • สตูดิโอ = STUDIO.state.ready
    const isStudio=/studio\.html|\?studio/.test(url),isGame=!isStudio&&/^\/(index\.html)?(\?|#|$)/.test(url.replace(/^https?:\/\/[^/]+/,''));
    for(let i=0;i<240;i++){await sleep(250);try{if(await ev(isStudio?`!!(window.STUDIO&&STUDIO.state&&STUDIO.state.ready)`:isGame?`!!(window.WD&&window.WD.G!==undefined&&document.readyState==='complete')`:`document.readyState!=='loading'`,false))break;}catch(e){}}
    if(A['wait-shot']){const f=String(A['wait-shot']).replace(/\.(jpg|png)$/,''),c=['jpg','png'].map(x=>path.join(ROOT,'shots',f+'.'+x)),t0=Date.now();
      const old=c.map(p=>fs.existsSync(p)?fs.statSync(p).mtimeMs:0);
      for(;;){await sleep(400);const k=c.findIndex((p,i)=>fs.existsSync(p)&&fs.statSync(p).mtimeMs>Math.max(old[i],t0-60000)&&fs.statSync(p).mtimeMs>old[i]);if(k>=0){console.log('✓ '+path.relative(ROOT,c[k]).replace(/\\/g,'/'));break;}}
      try{const sh=await ev(`(()=>{const s=window.STUDIO&&STUDIO.state&&STUDIO.state.sheet;return s?{res:s.res,peakWhite:s.peakWhite,peakBlock:s.peakBlock}:null;})()`,false);if(sh)console.log('metrics '+JSON.stringify(sh));}catch(e){}}
    let body='';
    if(A.game||A.js||A.eval)await ev(fs.readFileSync(path.join(__dirname,'hl-game.js'),'utf8'),false);
    if(A.js)body=fs.readFileSync(path.resolve(A.js),'utf8');else if(A.eval&&A.eval!==true)body=A.eval;
    if(body){const r=await ev(`(async()=>{${body}\n})()`);
      if(r&&r.images){for(const k in r.images){const f=saveImg(k,r.images[k]);if(f)console.log('✓ '+f);}delete r.images;}
      if(r!==undefined)console.log(JSON.stringify(r,null,1).slice(0,20000));}
    if(A.shot){const s=await cmd('Page.captureScreenshot',{format:'jpeg',quality:86});console.log('✓ '+saveImg(String(A.shot).replace(/\.(jpg|png)$/,''),'data:image/jpeg;base64,'+s.data));}
    if(logs.length&&!A.quiet)console.log('--- console ('+logs.length+') ---\n'+logs.slice(-40).join('\n'));
    if(errs.length){console.log('--- page errors ('+errs.length+') ---\n'+[...new Set(errs)].slice(0,30).join('\n'));}
    else console.log('page errors: 0');
    await finish(0);
  }catch(e){console.error('✗ '+(e.stack||e.message||e));if(errs.length)console.log('--- page errors ---\n'+[...new Set(errs)].slice(0,30).join('\n'));await finish(1);}
}
main();
