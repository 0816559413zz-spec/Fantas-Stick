// =====================================================================
//  VFX Studio — แก้เอฟเฟกต์ .fx.json บน renderer จริงของเกม (เปิด studio.html = index.html?studio)
//  โหลดต่อท้ายโค้ดเกม (ไฟล์เดียวกันทั้งหมดเป็นโมดูลเดียว) จึงใช้ G / hostStart / render / fxStart ฯลฯ ได้ตรง ๆ
//  แผน: designs/vfx-studio.md • รูปแบบไฟล์: FX-FORMAT.md • บันทึก/เก็บภาพผ่าน python tools/serve.py
//  URL: ?fx=<ชื่อ> &map=test|castle|... &cam=game|side|front|top|orbit &at=front|self|far &seed=N &sheet=0.05,0.2,... &save=<ชื่อภาพ> &t=<เวลา>
//  console: STUDIO.load(n) .data() .set('ball.scale',2) .play() .pause() .seek(t) .sheet([..]) .metrics() .save() .shot(n)
// =====================================================================
const SQ=new URLSearchParams(location.search);
const ST={fx:null,name:'',saved:'',mtime:0,dirty:false,t:0,play:!SQ.has('sheet'),speed:1,loop:true,seed:+(SQ.get('seed')||1),I:null,sel:null,
  cam:SQ.get('cam')||'game',orb:{yaw:0.9,pitch:0.32,dist:16},at:SQ.get('at')||'front',map:SQ.get('map')||'test',undo:[],redo:[],acc:0,seekTo:null,
  met:{white:0,lum:0,parts:0,calls:0,ms:0,block:0},run:{white:0,parts:0,block:0},list:{},ready:false,tail:0.6,api:false,mute:{},solo:null,busy:false,lint:[]};
const STD=1/60;let stVnow=performance.now(),stLast=performance.now(),stFr=0;
const $st=id=>document.getElementById(id);
function h(tag,a,...kids){const e=document.createElement(tag);if(a)for(const k in a){const v=a[k];if(k==='on')for(const ev in v)e.addEventListener(ev,v[ev]);else if(k==='style')e.style.cssText=v;else if(k in e&&k!=='list')e[k]=v;else e.setAttribute(k,v);}
  for(const c of kids.flat())if(c!=null&&c!==false)e.append(c.nodeType?c:document.createTextNode(c));return e;}
function stToast(m,ms){const t=$st('stToast');t.textContent=m;t.hidden=false;clearTimeout(stToast.k);stToast.k=setTimeout(()=>t.hidden=true,ms||2600);}
const stWait=(f,ms)=>new Promise(r=>{const t0=performance.now();const k=setInterval(()=>{let ok=false;try{ok=f();}catch(e){}if(ok||performance.now()-t0>ms){clearInterval(k);r(ok);}},50);});
function stRng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const TYPEC={flash:'#f3dc94',halo:'#e3a94a',ring:'#7fb8ff',light:'#ffb070',screen:'#c08aff',sound:'#8f9ab3',emit:'#ffd56a',mesh:'#ff8a3a',firevol:'#ff5a2a',trail:'#9fe8ff',bolt:'#ffe27a',decal:'#8a7a6a',debris:'#a08060',mist:'#cfe8ff',crown:'#9fd8ff',geyser:'#ff7a2a',use:'#b57dff',code:'#7d8aa8'};
const SHAPE_SVG={sphere:'<circle cx="12" cy="9" r="7"/>',dome:'<path d="M3 15a9 9 0 0 1 18 0Z"/>',disc:'<ellipse cx="12" cy="11" rx="10" ry="4"/>',ring:'<ellipse cx="12" cy="11" rx="10" ry="4" fill="none" stroke-width="2.5"/>',cylinder:'<path d="M4 4h16v12H4z" opacity=".8"/>',cone:'<path d="M12 1L20 17H4Z"/>',torus:'<ellipse cx="12" cy="10" rx="10" ry="5" fill="none" stroke-width="3.5"/>',crescent:'<path d="M5 16Q12-2 20 9Q12 3 5 16Z"/>',spikes:'<path d="M2 17L6 6L9 17L12 1L15 17L18 7L22 17Z"/>',beam:'<rect x="1" y="6" width="22" height="7" rx="3.5"/>',plane:'<rect x="5" y="2" width="14" height="14"/>',lathe:'<path d="M8 17C2 10 8 6 10 2h4c2 4 8 8 2 15Z"/>',ribbon:'<path d="M1 13Q7 1 12 9T23 5" fill="none" stroke-width="3"/>',glb:'<path d="M12 1L21 6v8l-9 5-9-5V6Z" fill="none" stroke-width="2"/>'};
// ---------- เริ่ม ----------
async function stBoot(){
  document.body.classList.add('studio');stBuildUI();
  // เข้าห้องฝึกเงียบ ๆ (ไม่มีเมนู ไม่มี HUD)
  try{$('#btnSolo').click();}catch(e){}
  await stWait(()=>G&&screen==='lobby',4000);if(crOpen)closeCreator(false);
  await stStartMap(ST.map);
  FXSTUDIO.own=true;gl.info.autoReset=false;stResize();
  await stWait(()=>FXR.ready,8000);
  WD.camHook=stCam;
  await stRefreshList();
  const first=SQ.get('fx')||(ST.list['start/explosion']?'start/explosion':Object.keys(ST.list)[0]);
  if(first)await stOpen(first);else stNew('start/ใหม่','');
  ST.ready=true;requestAnimationFrame(stFrame);setInterval(stPoll,1000);
  if(SQ.has('sheet')){const ts=SQ.get('sheet').split(',').map(Number).filter(x=>!isNaN(x));await stSheet(ts.length?ts:null,SQ.get('save'));}
  else if(SQ.has('t')){ST.play=false;stSeek(+SQ.get('t'));}
}
async function stStartMap(id){ST.map=id;MODES.train.map=id;G.mapPick=id;G.mode='train';
  try{hostStart();}catch(e){console.error(e);}
  await stWait(()=>screen==='game'&&VIEW.cur&&G.players.me,6000);
  if(G.tr){G.tr.datk=0;G.tr.mai=0;G.tr.god=1;G.tr.nocd=1;}
  yaw=0;pitch=0.2;}
function stResize(){const w=Math.max(200,innerWidth-parseFloat(getComputedStyle(document.body).getPropertyValue('--sL'))-parseFloat(getComputedStyle(document.body).getPropertyValue('--sR'))),
  hh=Math.max(150,innerHeight-parseFloat(getComputedStyle(document.body).getPropertyValue('--sT'))-parseFloat(getComputedStyle(document.body).getPropertyValue('--sB')));
  gl.setSize(w,hh,false);composer.setSize(w,hh);cam.aspect=w/hh;cam.updateProjectionMatrix();}
addEventListener('resize',()=>{if(document.body.classList.contains('studio'))setTimeout(stResize,0);});
// ---------- จุดที่เล่นเอฟเฟกต์ + กล้อง ----------
function stAnchor(){const me=G&&G.players&&G.players.me;if(!me)return null;const a=0,d=ST.at==='far'?600:ST.at==='self'?0:240;return {x:me.x+Math.cos(a)*d,y:me.y+Math.sin(a)*d,h:0,a,follow:ST.at==='self'?'me':undefined};}
const _stv=new THREE.Vector3();
function stCam(c){if(ST.cam==='game'||!ST.fx)return;const A=stAnchor();if(!A)return;const T=_stv.set(tx(A.x),GY(A.x,A.y)+1.1,tz(A.y));
  const f=[Math.cos(A.a),Math.sin(A.a)],r=[-Math.sin(A.a),Math.cos(A.a)];
  if(ST.cam==='side')c.position.set(T.x+r[0]*13,T.y+2.5,T.z+r[1]*13);
  else if(ST.cam==='front')c.position.set(T.x+f[0]*13,T.y+2.2,T.z+f[1]*13);
  else if(ST.cam==='top')c.position.set(T.x+0.01,T.y+22,T.z+0.01);
  else{const o=ST.orb;c.position.set(T.x+Math.cos(o.yaw)*Math.cos(o.pitch)*o.dist,T.y+Math.sin(o.pitch)*o.dist,T.z+Math.sin(o.yaw)*Math.cos(o.pitch)*o.dist);}
  c.lookAt(T);}
// ---------- เล่น / กรอเวลา (จำลองแน่นอน: dt คงที่ + เลขสุ่มมี seed) ----------
function stDur(){const F=ST.fx;if(!F)return 2;if(F.dur)return F.dur;let e=0.5;for(const L of F.layers||[]){const g=k=>L[k]!==undefined?L[k]:(FXR.def[L.t]||{})[k];const n=v=>typeof v==='number'?v:Array.isArray(v)?+v[1]||0:0;e=Math.max(e,n(g('at'))+n(g('life')));}return e;}
function stIsLoop(){return (ST.fx&&ST.fx.layers||[]).some(L=>L.loop);}
function stRender(dt,draw){stVnow+=dt*1000;FXSTUDIO.noDraw=!draw;try{render(dt,stVnow);}catch(e){console.error(e);}finally{FXSTUDIO.noDraw=false;}}
function stFlush(){if(ST.I){fxKill(ST.I);ST.I=null;}fxClearAll();for(let i=0;i<34;i++)stRender(0.15,false);PARTS.length=0;SCR.fl.length=0;SCR.rad=null;SCR.chr=0;shakeA=0;}
function stLayers(){const F=ST.fx;return Object.assign({},F,{layers:(F.layers||[]).filter(L=>!ST.mute[L.id]&&(!ST.solo||ST.solo===L.id))});}
function stRestart(){if(!ST.fx||!VIEW.cur)return;stFlush();Math.random=stRng(ST.seed*7919+13);ST.t=0;ST.acc=0;ST.run={white:0,parts:0,block:0};
  const A=stAnchor();if(!A)return;ST.I=fxStart(stLayers(),{x:A.x,y:A.y,h:A.h,a:A.a,follow:A.follow,own:true},ST.name);}
function stStep(){ST.t+=STD;if(ST.I&&stIsLoop()&&!ST.I.stop&&ST.t>=stDur())fxStop(ST.I);stRender(STD,false);}
function stSeek(t){t=Math.max(0,Math.min(t,stDur()+ST.tail));stRestart();let n=0;while(ST.t+STD*0.5<t&&n<900){stStep();n++;}stDraw(true);}
function stDraw(meas){gl.info.reset();const t0=performance.now();stRender(0,true);ST.met.ms=performance.now()-t0;ST.met.calls=gl.info.render.calls;ST.met.parts=PARTS.length;
  if(meas||stFr%5===0)stMeasure();stHudUpdate();}
// วัด: % พิกเซลขาวจ้า, ความสว่างเฉลี่ย, % ขาวจ้าบนตัวละคร (บังตัว)
const _stc=document.createElement('canvas');_stc.width=192;_stc.height=108;const _stx=_stc.getContext('2d',{willReadFrequently:true});
const _stb=new THREE.Box3(),_stp=new THREE.Vector3();
function stMeasure(){const W=_stc.width,H=_stc.height;_stx.drawImage(gl.domElement,0,0,W,H);const d=_stx.getImageData(0,0,W,H).data;let wh=0,lum=0;
  for(let i=0;i<d.length;i+=4){const l=(d[i]+d[i+1]+d[i+2])/3;lum+=l;if(d[i]>240&&d[i+1]>240&&d[i+2]>240)wh++;}
  ST.met.white=wh/(W*H)*100;ST.met.lum=lum/(W*H)/2.55;
  let blk=0;const o=PM3.get('me');if(o){_stb.setFromObject(o.g);let x0=1,y0=1,x1=-1,y1=-1,ok=false;
    for(let i=0;i<8;i++){_stp.set(i&1?_stb.max.x:_stb.min.x,i&2?_stb.max.y:_stb.min.y,i&4?_stb.max.z:_stb.min.z).project(cam);if(_stp.z<1){ok=true;x0=Math.min(x0,_stp.x);x1=Math.max(x1,_stp.x);y0=Math.min(y0,_stp.y);y1=Math.max(y1,_stp.y);}}
    if(ok){const px=v=>Math.round((v*0.5+0.5)*W),py=v=>Math.round((1-(v*0.5+0.5))*H),ax=Math.max(0,px(x0)),bx=Math.min(W-1,px(x1)),ay=Math.max(0,py(y1)),by=Math.min(H-1,py(y0));let n=0,b=0;
      for(let y=ay;y<=by;y++)for(let x=ax;x<=bx;x++){const i=(y*W+x)*4;n++;if(d[i]>235&&d[i+1]>235&&d[i+2]>235)b++;}blk=n?b/n*100:0;}}
  ST.met.block=blk;ST.run.white=Math.max(ST.run.white,ST.met.white);ST.run.parts=Math.max(ST.run.parts,ST.met.parts);if(blk>35)ST.run.block+=STD*5;}
function stFrame(now){requestAnimationFrame(stFrame);const rdt=Math.min(0.1,(now-stLast)/1000);stLast=now;stFr++;
  if(!ST.ready||ST.busy||screen!=='game'||!VIEW.cur)return;
  if(ST.seekTo!==null){const t=ST.seekTo;ST.seekTo=null;stSeek(t);stTlTime();return;}
  if(ST.play){ST.acc+=rdt*ST.speed;let n=0;while(ST.acc>=STD&&n<6){ST.acc-=STD;stStep();n++;}if(ST.acc>STD)ST.acc=0;
    if(ST.t>=stDur()+ST.tail){if(ST.loop)stRestart();else{ST.play=false;stSync();}}}
  stDraw(false);stTlTime();}
// ---------- แผ่นภาพสรุปทั้งไทม์ไลน์ (สำหรับ Claude: ภาพเดียวเห็นทั้ง ง้าง → กระแทก → สลาย) ----------
async function stSheet(times,save){if(!ST.fx)return null;ST.busy=true;const was=ST.play;ST.play=false;
  const D=stDur();times=(times&&times.length?times:[0.03,0.08,0.15,0.25,0.4,0.6,0.9,Math.max(1.2,D*0.8)]).filter(t=>t<=D+ST.tail).sort((a,b)=>a-b);
  const cols=Math.min(4,times.length),rows=Math.ceil(times.length/cols),cw=400,ch=225,cap=22,head=64,sh=document.createElement('canvas');sh.width=cols*cw;sh.height=head+rows*(ch+cap);
  const x=sh.getContext('2d');x.fillStyle='#070a14';x.fillRect(0,0,sh.width,sh.height);
  stRestart();const res=[];
  for(let i=0;i<times.length;i++){let n=0;while(ST.t+STD*0.5<times[i]&&n<900){stStep();n++;}stDraw(true);
    const cx=(i%cols)*cw,cy=head+Math.floor(i/cols)*(ch+cap);x.drawImage(gl.domElement,cx,cy,cw,ch);
    x.fillStyle='rgba(7,10,20,.85)';x.fillRect(cx,cy+ch,cw,cap);x.fillStyle=ST.met.white>8||ST.met.block>35?'#ff9a5a':'#f3dc94';x.font='13px JetBrains Mono,Consolas,monospace';
    x.fillText(`${times[i].toFixed(2)}s  ขาว ${ST.met.white.toFixed(1)}%  บังตัว ${ST.met.block.toFixed(0)}%  อนุภาค ${ST.met.parts}  ${ST.met.ms.toFixed(1)}ms`,cx+8,cy+ch+16);
    res.push({t:times[i],white:+ST.met.white.toFixed(2),block:+ST.met.block.toFixed(1),parts:ST.met.parts,calls:ST.met.calls,ms:+ST.met.ms.toFixed(2)});}
  stLintRun();const errs=ST.lint.filter(r=>r.lv==='err').length,wrn=ST.lint.filter(r=>r.lv==='warn').length,pk=Math.max(...res.map(r=>r.white)),pb=Math.max(...res.map(r=>r.block));
  x.fillStyle='#f3dc94';x.font='bold 20px Cinzel,serif';x.fillText('VFX Studio — '+(ST.name||'(ไม่มีชื่อ)'),12,26);
  x.font='13px JetBrains Mono,Consolas,monospace';x.fillStyle=pk>8||pb>35||errs?'#ff9a5a':'#7fd9a0';
  x.fillText(`ขาวจ้าสูงสุด ${pk.toFixed(1)}% (≤8)  บังตัวสูงสุด ${pb.toFixed(0)}% (≤35)  อนุภาคสูงสุด ${Math.max(...res.map(r=>r.parts))}  fx-check ✗${errs} ⚠${wrn}  กล้อง ${ST.cam}  แผนที่ ${ST.map}  seed ${ST.seed}`,12,50);
  const url=sh.toDataURL('image/jpeg',0.86);ST.sheet={url,res,peakWhite:pk,peakBlock:pb};ST.busy=false;ST.play=was;
  if(save)await stShot(save,url);else stShowImg(url);
  return ST.sheet;}
async function stShot(name,url){url=url||(stDraw(true),gl.domElement.toDataURL('image/jpeg',0.88));
  try{const r=await fetch('/api/shot?name='+encodeURIComponent(name),{method:'POST',body:url});const j=await r.json();if(j.ok){stToast('เก็บภาพแล้ว: '+j.path);return j.path;}}catch(e){}
  stToast('เก็บภาพลงไฟล์ไม่ได้ (เปิดผ่าน python tools/serve.py) — แสดงบนจอแทน');stShowImg(url);return null;}
function stShowImg(url){const m=h('div',{className:'stModal',on:{click:e=>{if(e.target===m)m.remove();}}},h('div',{className:'box'},h('div',{style:'display:flex;justify-content:space-between;gap:8px'},h('h3',null,'แผ่นภาพสรุปทั้งไทม์ไลน์'),h('button',{on:{click:()=>m.remove()}},'ปิด')),h('img',{src:url,alt:'แผ่นภาพสรุป'})));$st('st').append(m);}
// ---------- ไฟล์: เปิด / บันทึก / ใหม่ / ย้อนกลับ ----------
async function stRefreshList(){try{const r=await fetch('/api/fx-list',{cache:'no-cache'});if(r.ok){const j=await r.json();ST.list=j.fx||{};ST.api=true;ST.bindT=j.bind_t;stLibRender();return;}}catch(e){}
  try{const r=await fetch('assets/fx/index.json',{cache:'no-cache'});const j=await r.json();ST.list={};for(const k in j.fx)ST.list[k]=Object.assign({t:0},j.fx[k]);}catch(e){ST.list={};}ST.api=false;stLibRender();}
async function stOpen(name,keepT){try{const r=await fetch('assets/fx/'+name+'.fx.json',{cache:'no-cache'});if(!r.ok)throw new Error(r.status);const txt=await r.text();const d=JSON.parse(txt);
    ST.fx=d;ST.name=name;ST.saved=JSON.stringify(d);ST.mtime=(ST.list[name]||{}).t||0;ST.dirty=false;ST.undo=[];ST.redo=[];ST.mute={};ST.solo=null;FXR.db.set(name,{data:d,fail:false,p:Promise.resolve(d)});
    if(!keepT)ST.sel=null;stAfterChange(true,keepT);stLibRender();return true;}catch(e){stToast('เปิดไม่ได้: '+name+' ('+e.message+')');return false;}}
function stJson(){return JSON.stringify(ST.fx,null,2)
  .replace(/\n {6,}([^\n]*)/g,' $1').replace(/\[\s+/g,'[').replace(/\s+\]/g,']')+'\n';}
function stPretty(){// ชั้นละบรรทัด อ่านง่ายใน git diff
  const F=Object.assign({},ST.fx),L=F.layers||[];delete F.layers;const head=JSON.stringify(F,null,2).replace(/\n}$/,'');
  return head+(Object.keys(F).length?',':'')+'\n  "layers": [\n'+L.map(l=>'    '+JSON.stringify(l)).join(',\n')+'\n  ]\n}\n';}
async function stSave(as){let name=ST.name;if(as||!name){const n=prompt('ชื่อไฟล์ (โฟลเดอร์/ชื่อ เช่น fire/my_boom)',name||'');if(!n)return;name=n.trim().replace(/\.fx\.json$/,'');}
  if(!/^[a-z0-9_\-]+(\/[a-z0-9_\-]+)*$/.test(name)){stToast('ชื่อไฟล์ใช้ได้เฉพาะ a-z 0-9 _ - และ / (ภาษาอังกฤษตัวเล็ก)');return;}
  const txt=stPretty();
  try{const r=await fetch('/api/save?path='+encodeURIComponent('assets/fx/'+name+'.fx.json'),{method:'POST',body:txt});const j=await r.json();
    if(j.ok){ST.name=name;ST.saved=JSON.stringify(ST.fx);ST.dirty=false;FXR.db.set(name,{data:JSON.parse(txt),fail:false,p:Promise.resolve(null)});await stRefreshList();ST.mtime=(ST.list[name]||{}).t||0;stSync();stToast('บันทึกแล้ว → assets/fx/'+name+'.fx.json\n'+(j.check||''),4000);return true;}
    stToast('บันทึกไม่ได้: '+(j.err||r.status));return false;}catch(e){}
  // ไม่ได้เปิดผ่าน serve.py → ให้เลือกที่เก็บเอง / ดาวน์โหลด
  try{if(window.showSaveFilePicker){const fh=await showSaveFilePicker({suggestedName:name.split('/').pop()+'.fx.json',types:[{description:'Fantas Stick FX',accept:{'application/json':['.json']}}]});const w=await fh.createWritable();await w.write(txt);await w.close();ST.saved=JSON.stringify(ST.fx);ST.dirty=false;stSync();stToast('บันทึกแล้ว (วางไฟล์ไว้ที่ assets/fx/'+name+'.fx.json)');return true;}}catch(e){if(e.name==='AbortError')return false;}
  const a=h('a',{href:URL.createObjectURL(new Blob([txt],{type:'application/json'})),download:name.split('/').pop()+'.fx.json'});a.click();stToast('ดาวน์โหลดแล้ว — วางไว้ที่ assets/fx/'+name+'.fx.json (เปิดสตูดิโอผ่าน python tools/serve.py จะบันทึกตรงได้)',5000);return true;}
async function stNewFrom(){let tpls=Object.keys(ST.list).filter(n=>n.startsWith('start/'));
  const m=h('div',{className:'stModal'}),nm=h('input',{type:'text',value:'fire/new_effect',style:'width:260px',id:'stNewName'}),pal=h('select',{id:'stNewPal'},...FXR.schema.pals.filter(p=>p!=='col').map(p=>h('option',{value:p},p)));
  const pick=async t=>{const n=nm.value.trim();if(!/^[a-z0-9_\-]+(\/[a-z0-9_\-]+)*$/.test(n)){stToast('ชื่อใช้ได้เฉพาะ a-z 0-9 _ - /');return;}m.remove();await stNew(n,t,pal.value);};
  m.append(h('div',{className:'box'},h('h3',null,'เอฟเฟกต์ใหม่'),h('div',{style:'display:flex;gap:10px;flex-wrap:wrap;align-items:center'},h('label',null,'ชื่อไฟล์ ',nm),h('label',null,'ธาตุ ',pal)),
    h('div',{className:'tpls'},h('button',{on:{click:()=>pick('')}},'ว่างเปล่า',h('small',null,'ชั้นแฟลช 1 ชั้น')),...tpls.map(t=>h('button',{on:{click:()=>pick(t)}},t.slice(6),h('small',null,(ST.list[t]||{}).desc||'')))),
    h('div',null,h('button',{on:{click:()=>m.remove()}},'ยกเลิก'))));$st('st').append(m);nm.focus();nm.select();}
async function stNew(name,tpl,pal){let d={v:1,desc:'',pal:pal||'arcane',layers:[{id:'core',t:'flash',at:0,life:0.12,col:'$core',size:2.5}]};
  if(tpl){try{d=await (await fetch('assets/fx/'+tpl+'.fx.json',{cache:'no-cache'})).json();if(pal)d.pal=pal;}catch(e){}}
  ST.fx=d;ST.name=name;ST.saved='';ST.dirty=true;ST.undo=[];ST.redo=[];ST.sel=null;ST.mute={};ST.solo=null;stAfterChange(true);stToast('ยังไม่ได้บันทึก — กด 💾 (Ctrl+S)');}
function stPush(){ST.undo.push(JSON.stringify(ST.fx));if(ST.undo.length>80)ST.undo.shift();ST.redo.length=0;}
function stUndo(r){const A=r?ST.redo:ST.undo,B=r?ST.undo:ST.redo;if(!A.length)return;B.push(JSON.stringify(ST.fx));ST.fx=JSON.parse(A.pop());stAfterChange(true,true);}
// หลังแก้ไฟล์: ตรวจ + วาดแผงใหม่ + เล่นใหม่ที่เวลาเดิม
let _stChT=0;
function stChanged(rebuild){ST.dirty=JSON.stringify(ST.fx)!==ST.saved;clearTimeout(_stChT);_stChT=setTimeout(()=>stAfterChange(rebuild,true),110);}
function stAfterChange(rebuild,keepT){stLintRun();stSync();stTlRender();if(rebuild!==false)stInspRender();
  if(!VIEW.cur)return;if(keepT&&!ST.play)ST.seekTo=ST.t;else stRestart();}
function stLintRun(){if(!window.FXLINT||!FXR.schema||!ST.fx){ST.lint=[];return;}
  const man=MODELS.man||{},ctx={names:new Set(Object.keys(ST.list)),models:new Set(Object.keys(man.models||{})),flips:new Set([...Object.keys(man.fx||{}),...Object.keys(man.ptex||{})]),sounds:new Set(Object.keys(SFXN))};
  try{ST.lint=FXLINT.fxLint(ST.fx,FXR.schema,ctx);}catch(e){ST.lint=[{lv:'err',at:'',msg:String(e)}];}}
async function stPoll(){if(!ST.api||ST.busy)return;try{const r=await fetch('/api/fx-list',{cache:'no-cache'});const j=await r.json();const old=ST.list;ST.list=j.fx||{};
  if(Object.keys(old).join()!==Object.keys(ST.list).join())stLibRender();
  const e=ST.list[ST.name];if(e&&ST.name&&e.t>ST.mtime+0.01){ST.mtime=e.t;if(!ST.dirty){await stOpen(ST.name,true);stToast('โหลดไฟล์ใหม่ (แก้จากที่อื่น)');}else stBanner('ไฟล์นี้ถูกแก้จากที่อื่น',[['โหลดใหม่ (ทิ้งที่แก้)',()=>stOpen(ST.name,true)]]);}}catch(e){}}
function stBanner(msg,btns){const b=$st('stBanner');b.innerHTML='';b.append(h('span',null,msg),...btns.map(([t,f])=>h('button',{on:{click:()=>{b.hidden=true;f();}}},t)),h('button',{on:{click:()=>b.hidden=true}},'✕'));b.hidden=false;}
// ---------- ค่า: อ่าน/เขียนตาม schema ----------
function stSpec(L,k){const S=FXR.schema;if(!L)return S.file[k];return S.common[k]||(S.types[L.t]||{fields:{}}).fields[k];}
function stDef(L,k){const s=stSpec(L,k);return s?s.def:undefined;}
function stSet(L,k,v,rebuild){if(v===undefined){delete L[k];}else L[k]=v;stChanged(rebuild);}
// ---------- UI ----------
function stBuildUI(){
  const root=h('div',{id:'st'});document.body.append(root);
  const sel=(id,opts,val,fn)=>h('select',{id,on:{change:e=>fn(e.target.value)}},...opts.map(([v,t])=>h('option',{value:v,selected:v===val},t)));
  root.append(h('div',{id:'stTop'},h('span',{className:'logo'},'VFX Studio'),h('span',{className:'file',id:'stFile'},'—'),h('span',{className:'sep'}),
    h('button',{id:'stBNew',title:'เอฟเฟกต์ใหม่จากแม่แบบ',on:{click:stNewFrom}},'＋ ใหม่'),h('button',{id:'stBSave',className:'gold',title:'บันทึก (Ctrl+S)',on:{click:()=>stSave(false)}},'💾 บันทึก'),
    h('button',{id:'stBSaveAs',title:'บันทึกเป็นชื่อใหม่',on:{click:()=>stSave(true)}},'บันทึกเป็น…'),h('button',{id:'stBUndo',title:'ย้อน (Ctrl+Z)',on:{click:()=>stUndo(false)}},'↶'),h('button',{id:'stBRedo',title:'ทำซ้ำ (Ctrl+Y)',on:{click:()=>stUndo(true)}},'↷'),
    h('span',{className:'sep'}),h('label',null,'ธาตุ',sel('stPal',[],'',v=>{stPush();ST.fx.pal=v;stChanged(true);})),
    h('label',{title:'ความแรงรวมของทั้งเอฟเฟกต์ (k)'},'ความแรง',h('input',{type:'range',id:'stK',min:0.3,max:2,step:0.05,value:1,style:'width:80px',on:{pointerdown:stPush,input:e=>{ST.fx.k=+e.target.value;if(ST.fx.k===1)delete ST.fx.k;stChanged(false);}}})),
    h('span',{className:'sep'}),h('label',null,'แผนที่',sel('stMap',[['test','ห้องฝึก (สว่าง)'],['castle','ปราสาท (มืด)'],['greathall','ห้องโถง (มืด)'],['meadow','ทุ่งหญ้า (เย็น)'],['lake','ทะเลสาบ (คืน)']],ST.map,async v=>{ST.busy=true;await stStartMap(v);ST.busy=false;stResize();stRestart();})),
    h('label',null,'จุดเล่น',sel('stAt',[['front','หน้าเรา 12 ม.'],['self','ที่ตัวเรา (ติดตาม)'],['far','ไกล 30 ม.']],ST.at,v=>{ST.at=v;stRestart();})),
    h('label',null,'กราฟิก',sel('stQ',[['auto','อัตโนมัติ'],['high','สูง'],['low','ประหยัด']],QUAL.mode,v=>{QUAL.mode=v;applyQuality();stResize();stRestart();})),
    h('span',{className:'sep'}),h('button',{id:'stBSheet',title:'แผ่นภาพสรุปทั้งไทม์ไลน์ + ตัวเลขตรวจ',on:{click:()=>stSheet(null,null)}},'🖼 แผ่นภาพ'),
    h('button',{id:'stBShot',title:'เก็บภาพจอนี้ลง shots/',on:{click:()=>stShot((ST.name||'fx').replace(/\//g,'_')+'_'+ST.t.toFixed(2).replace('.','s'))}},'📷'),
    h('button',{id:'stBGame',title:'เปิดเกม (ห้องฝึก) โดยผูกเอฟเฟกต์นี้กับท่าที่เลือก',on:{click:stTryGame}},'🎮 ลองในเกม'),
    h('button',{id:'stBHelp',on:{click:stHelp}},'?')));
  root.append(h('div',{id:'stLib'},h('div',{className:'head'},h('h3',null,'ไลบรารี'),h('input',{type:'text',id:'stSearch',placeholder:'ค้นหา…',on:{input:stLibRender}})),h('div',{id:'stLibList'})));
  root.append(h('div',{id:'stView'},h('div',{id:'stCams'},...[['game','กล้องเกม'],['side','ข้าง'],['front','หน้า'],['top','บน'],['orbit','หมุนเอง']].map(([k,t])=>h('button',{id:'stCam_'+k,'data-cam':k,on:{click:()=>{ST.cam=k;stSync();if(!ST.play)ST.seekTo=ST.t;}}},t))),
    h('div',{id:'stHud'},h('span',{id:'stHParts'}),h('span',{id:'stHWhite'}),h('span',{id:'stHBlock'}),h('span',{id:'stHCalls'}),h('span',{id:'stHMs'})),h('div',{id:'stBanner',hidden:true})));
  root.append(h('div',{id:'stTl'},h('div',{className:'bar'},h('button',{id:'stPlay',title:'เล่น/หยุด (Space)',on:{click:()=>{ST.play=!ST.play;if(ST.play&&ST.t>=stDur()+ST.tail)stRestart();stSync();}}},'⏸'),
    h('button',{id:'stRe',title:'เล่นใหม่ (R)',on:{click:()=>{ST.play=true;stRestart();stSync();}}},'⟲'),...[0.1,0.25,0.5,1].map(s=>h('button',{'data-sp':s,id:'stSp'+s,on:{click:()=>{ST.speed=s;stSync();}}},s+'×')),
    h('button',{id:'stLoop',title:'วนเล่น',on:{click:()=>{ST.loop=!ST.loop;stSync();}}},'🔁'),h('span',{className:'time',id:'stTime'},'0.00'),
    h('span',{id:'stAdd'},h('button',{id:'stAddB',on:{click:()=>{const m=$st('stAddMenu');m.hidden=!m.hidden;}}},'＋ ชั้น'),h('div',{id:'stAddMenu',hidden:true})),
    h('label',{title:'เลขสุ่ม — เปลี่ยนเพื่อดูแบบสุ่มอื่น'},'seed',h('input',{type:'number',id:'stSeed',value:ST.seed,min:1,max:9999,style:'width:58px',on:{change:e=>{ST.seed=+e.target.value||1;stRestart();}}})),
    h('span',{className:'mute',style:'font-size:11.5px'},'ลากแถบ = เลื่อนจังหวะ • ลากขอบขวา = ยืดอายุ • คลิกแถวเวลา = กระโดด • 👁 ซ่อน • S เดี่ยว')),h('div',{id:'stRows'})));
  root.append(h('div',{id:'stInsp'}));
  root.append(h('div',{id:'stToast',hidden:true}));
  // เมนูเพิ่มชั้น
  const am=$st('stAddMenu');for(const [t,T] of Object.entries(FXR.schema?FXR.schema.types:{}))am.append(h('button',{on:{click:()=>{am.hidden=true;stAddLayer(t);}}},(T.icon||'')+' '+T.th,h('small',{className:'mute'},' '+t)));
  // กล้องหมุนเอง: ลากบนจอ / ล้อเมาส์ซูม
  const cv=gl.domElement;let drag=null;
  cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId);if(ST.cam!=='orbit'){ST.cam='orbit';stSync();}});
  cv.addEventListener('pointermove',e=>{if(!drag)return;ST.orb.yaw+=(e.clientX-drag.x)*0.008;ST.orb.pitch=Math.max(-0.2,Math.min(1.45,ST.orb.pitch+(e.clientY-drag.y)*0.006));drag={x:e.clientX,y:e.clientY};if(!ST.play)ST.seekTo=ST.t;});
  cv.addEventListener('pointerup',()=>drag=null);
  cv.addEventListener('wheel',e=>{e.preventDefault();ST.orb.dist=Math.max(3,Math.min(60,ST.orb.dist*(e.deltaY>0?1.1:0.9)));if(ST.cam!=='orbit'){ST.cam='orbit';stSync();}if(!ST.play)ST.seekTo=ST.t;},{passive:false});
  // ปุ่มลัด (กันไม่ให้ปุ่มไหลเข้าเกม)
  addEventListener('keydown',e=>{if(!document.body.classList.contains('studio'))return;const tg=e.target.tagName;const typing=tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT';
    if((e.ctrlKey||e.metaKey)&&e.code==='KeyS'){e.preventDefault();e.stopImmediatePropagation();stSave(false);return;}
    if(typing){e.stopImmediatePropagation();return;}
    if((e.ctrlKey||e.metaKey)&&e.code==='KeyZ'){e.preventDefault();stUndo(e.shiftKey);}
    else if((e.ctrlKey||e.metaKey)&&e.code==='KeyY'){e.preventDefault();stUndo(true);}
    else if(e.code==='Space'){e.preventDefault();$st('stPlay').click();}
    else if(e.code==='KeyR')$st('stRe').click();
    else if(e.code==='Delete'&&ST.sel){stDelLayer(ST.sel);}
    else if(e.code==='ArrowRight'||e.code==='ArrowLeft'){ST.play=false;ST.seekTo=Math.max(0,ST.t+(e.code==='ArrowRight'?1:-1)*(e.shiftKey?0.1:STD));stSync();}
    e.stopImmediatePropagation();},true);
  addEventListener('keyup',e=>{if(document.body.classList.contains('studio'))e.stopImmediatePropagation();},true);
  addEventListener('beforeunload',e=>{if(ST.dirty){e.preventDefault();e.returnValue='';}});
}
function stSync(){if(!$st('stTop'))return;const F=ST.fx;$st('stFile').textContent=(ST.name||'(ใหม่)')+(ST.dirty?' ●':'');$st('stFile').classList.toggle('dirty',ST.dirty);
  const ps=$st('stPal');if(FXR.schema&&ps.options.length<2)for(const p of FXR.schema.pals)ps.append(h('option',{value:p},p));if(F)ps.value=F.pal||'arcane';
  if(F)$st('stK').value=F.k||1;$st('stPlay').textContent=ST.play?'⏸':'▶';$st('stLoop').classList.toggle('on',ST.loop);
  document.querySelectorAll('#stTl [data-sp]').forEach(b=>b.classList.toggle('on',+b.dataset.sp===ST.speed));document.querySelectorAll('#stCams [data-cam]').forEach(b=>b.classList.toggle('on',b.dataset.cam===ST.cam));}
function stHudUpdate(){if(stFr%3)return;const M=ST.met,s=(id,t,bad)=>{const e=$st(id);e.textContent=t;e.className=bad?'bad':'good';};
  s('stHParts','อนุภาค '+M.parts,M.parts>3000);s('stHWhite','ขาวจ้า '+M.white.toFixed(1)+'%',M.white>8);s('stHBlock','บังตัว '+M.block.toFixed(0)+'%',M.block>35);s('stHCalls','draw '+M.calls,M.calls>900);s('stHMs',M.ms.toFixed(1)+' ms',M.ms>16);}
// ---------- ไลบรารี ----------
function stLibRender(){const box=$st('stLibList');if(!box)return;const q=($st('stSearch').value||'').toLowerCase();box.innerHTML='';const groups={};
  for(const n of Object.keys(ST.list).sort()){const e=ST.list[n];if(q&&!(n+' '+(e.desc||'')+' '+(e.tags||[]).join(' ')).toLowerCase().includes(q))continue;const g=n.includes('/')?n.slice(0,n.lastIndexOf('/')):'(ราก)';(groups[g]=groups[g]||[]).push(n);}
  for(const g of Object.keys(groups)){box.append(h('div',{className:'grp'},g));for(const n of groups[g]){const e=ST.list[n];box.append(h('button',{className:n===ST.name?'on':'',title:e.desc||n,on:{click:()=>stAskOpen(n)}},n.slice(n.lastIndexOf('/')+1),h('small',null,e.err?'⚠ '+e.err:(e.desc||''))));}}
  if(!Object.keys(groups).length)box.append(h('p',{className:'mute'},'ไม่พบ'));}
function stAskOpen(n){if(n===ST.name)return;if(ST.dirty)stBanner('ยังไม่ได้บันทึก '+(ST.name||'(ใหม่)'),[['ทิ้งแล้วเปิด '+n,()=>stOpen(n)],['บันทึกก่อน',async()=>{if(await stSave(false))stOpen(n);}]]);else stOpen(n);}
// ---------- ไทม์ไลน์ ----------
function stTlTime(){const D=stDur()+ST.tail;$st('stTime').textContent=ST.t.toFixed(2)+' / '+stDur().toFixed(2)+' s';const ph=$st('stPh');if(ph)ph.style.left=Math.min(100,ST.t/D*100)+'%';}
function stTlRender(){const R=$st('stRows');if(!R||!ST.fx)return;R.innerHTML='';const D=stDur()+ST.tail,F=ST.fx;
  R.append(h('div',{className:'stName',on:{click:()=>{ST.sel=null;stTlRender();stInspRender();}}},h('span',{className:'nm'+(ST.sel===null?' on':'')},'⚙ ตั้งค่าไฟล์')));
  const ru=h('div',{className:'stTrack ruler',id:'stRuler'});for(let s=0;s<=D+1e-6;s+=D>4?1:0.5)ru.append(h('span',{className:'stTick',style:'left:'+(s/D*100)+'%'},s.toFixed(1)));ru.append(h('div',{className:'stPh',id:'stPh'}));
  const seek=e=>{const b=ru.getBoundingClientRect();ST.play=false;ST.seekTo=Math.max(0,Math.min(D,(e.clientX-b.left)/b.width*D));stSync();};
  ru.addEventListener('pointerdown',e=>{seek(e);ru.setPointerCapture(e.pointerId);const mv=ev=>seek(ev),up=()=>{ru.removeEventListener('pointermove',mv);ru.removeEventListener('pointerup',up);};ru.addEventListener('pointermove',mv);ru.addEventListener('pointerup',up);});R.append(ru);
  const errAt=new Set(ST.lint.filter(r=>r.lv==='err'||r.lv==='warn').map(r=>String(r.at).split('.')[0]));
  F.layers.forEach((L,i)=>{const g=k=>L[k]!==undefined?L[k]:stDef(L,k),num=v=>typeof v==='number'?v:Array.isArray(v)?+v[1]||0:0,T=FXR.schema.types[L.t]||{};
    const nm=h('div',{className:'stName'+(ST.sel===L.id?' on':''),on:{click:e=>{if(e.target.closest('button'))return;ST.sel=L.id;stTlRender();stInspRender();}}},
      h('button',{title:'ซ่อน/แสดง',className:ST.mute[L.id]?'on':'',on:{click:()=>{ST.mute[L.id]=!ST.mute[L.id];stTlRender();stRestart();}}},ST.mute[L.id]?'◌':'👁'),
      h('button',{title:'เล่นชั้นนี้ชั้นเดียว',className:ST.solo===L.id?'on':'',on:{click:()=>{ST.solo=ST.solo===L.id?null:L.id;stTlRender();stRestart();}}},'S'),
      h('span',{className:'nm'+(errAt.has(L.id)?' bad':'')},(T.icon||'')+' '+L.id),h('span',{className:'ty'},L.t+(L.shape?':'+L.shape:'')),
      h('button',{title:'ขึ้น',on:{click:()=>stMove(i,-1)}},'↑'),h('button',{title:'ลง',on:{click:()=>stMove(i,1)}},'↓'),h('button',{title:'ทำซ้ำชั้น',on:{click:()=>stDupLayer(L.id)}},'⧉'),h('button',{title:'ลบชั้น (Delete)',on:{click:()=>stDelLayer(L.id)}},'✕'));
    const tr=h('div',{className:'stTrack'}),sg=h('div',{className:'stSeg'+(ST.sel===L.id?' on':'')+(g('loop')?' loop':'')+(ST.mute[L.id]||(ST.solo&&ST.solo!==L.id)?' off':''),style:'--c:'+(TYPEC[L.t]||'#d9b45a')}),rh=h('span',{className:'rh'});
    const place=()=>{sg.style.left=(num(g('at'))/D*100)+'%';sg.style.width=(Math.max(0.02,g('loop')?D-num(g('at')):num(g('life')))/D*100)+'%';};place();sg.append(rh);tr.append(sg);
    const editable=typeof g('at')==='number'&&typeof g('life')==='number';
    sg.addEventListener('pointerdown',e=>{e.preventDefault();ST.sel=L.id;if(!editable){stInspRender();return;}stPush();const b=tr.getBoundingClientRect(),x0=e.clientX,at0=g('at'),lf0=g('life'),rs=e.target===rh;sg.setPointerCapture(e.pointerId);
      const mv=ev=>{const d=(ev.clientX-x0)/b.width*D;if(rs)L.life=+Math.max(0.02,lf0+d).toFixed(2);else L.at=+Math.max(0,at0+d).toFixed(2);place();ST.dirty=true;};
      const up=()=>{sg.removeEventListener('pointermove',mv);sg.removeEventListener('pointerup',up);stChanged(true);};sg.addEventListener('pointermove',mv);sg.addEventListener('pointerup',up);});
    R.append(nm,tr);});
  stTlTime();}
function stUid(base){let i=1,id=base;const has=x=>ST.fx.layers.some(L=>L.id===x);while(has(id))id=base+(++i);return id;}
function stAddLayer(t){stPush();const L={id:stUid(t),t,at:+Math.min(ST.t,stDur()).toFixed(2)};const T=FXR.schema.types[t];
  // ค่าเริ่มที่ดูเห็นผลทันที
  if(t==='mesh'){L.shape='sphere';L.mat='energy';L.life=0.6;L.scale={'0':0.3,'1':2.5,ease:'out'};}
  else if(t==='emit'){L.life=0.1;L.burst=24;}else if(t==='use'){L.fx=Object.keys(ST.list).find(n=>n.startsWith('start/'))||'';}
  else L.life=T&&T.fields.life?T.fields.life.def:0.4;
  ST.fx.layers.push(L);ST.sel=L.id;stChanged(true);}
function stDelLayer(id){stPush();ST.fx.layers=ST.fx.layers.filter(L=>L.id!==id);if(ST.sel===id)ST.sel=null;stChanged(true);}
function stDupLayer(id){stPush();const i=ST.fx.layers.findIndex(L=>L.id===id),c=JSON.parse(JSON.stringify(ST.fx.layers[i]));c.id=stUid(id);ST.fx.layers.splice(i+1,0,c);ST.sel=c.id;stChanged(true);}
function stMove(i,d){const j=i+d,A=ST.fx.layers;if(j<0||j>=A.length)return;stPush();[A[i],A[j]]=[A[j],A[i]];stChanged(true);}
// ---------- แผงแก้ค่า ----------
function stInspRender(){const P=$st('stInsp');if(!P||!ST.fx)return;P.innerHTML='';const S=FXR.schema;
  const lint=h('div',{className:'stLint'});
  if(ST.sel===null){const F=ST.fx;P.append(h('div',{className:'hd'},h('b',null,ST.name||'(ใหม่)'),h('span',{className:'mute'},'ตั้งค่าไฟล์')));
    for(const k of ['desc','pal','dur','k','seed','tags','params'])P.append(stField(null,F,k,S.file[k]));
    for(const r of ST.lint)lint.append(h('div',{className:r.lv},h('span',null,r.lv==='err'?'✗':'⚠'),h('span',null,(r.at?r.at+': ':'')+r.msg)));if(!ST.lint.length)lint.append(h('div',{className:'ok'},'✓ fx-check ผ่าน'));
    P.append(h('h3',null,'ตรวจ (fx-check)'),lint,stBindPanel());return;}
  const L=ST.fx.layers.find(x=>x.id===ST.sel);if(!L){ST.sel=null;return stInspRender();}const T=S.types[L.t];
  P.append(h('div',{className:'hd'},h('b',null,(T.icon||'')+' '+L.id),h('span',{className:'mute'},T.th+' · '+L.t)),h('p',{className:'mute',style:'margin:0;font-size:12px'},T.desc));
  for(const r of ST.lint.filter(r=>String(r.at).split('.')[0]===L.id))lint.append(h('div',{className:r.lv},h('span',null,r.lv==='err'?'✗':'⚠'),h('span',null,r.msg+(String(r.at).includes('.')?' ('+String(r.at).split('.')[1]+')':''))));
  P.append(lint);
  P.append(stField(L,L,'id',S.common.id));
  if(L.t==='mesh')P.append(stShapePicker(L));
  for(const k in T.fields){if(L.t==='mesh'&&k==='shape')continue;if(!stShowField(L,k))continue;P.append(stField(L,L,k,T.fields[k]));}
  const com=h('details',{open:true},h('summary',null,'เวลา / ตำแหน่ง / เงื่อนไข'));for(const k of ['at','life','loop','end','att','pos','yaw','x','near','own'])com.append(stField(L,L,k,S.common[k]));P.append(com);
  P.append(h('details',null,h('summary',null,'JSON ของชั้นนี้'),stJsonBox(L)));}
// ซ่อนฟิลด์ที่ไม่เกี่ยวกับรูปทรง/วัสดุที่เลือก (ให้แผงสั้น อ่านง่าย)
function stShowField(L,k){if(L.t!=='mesh'&&L.t!=='emit'&&L.t!=='trail')return true;const g=q=>L[q]!==undefined?L[q]:stDef(L,q);
  if(L.t==='mesh'){const sh=g('shape'),mt=g('mat');if(k==='glb')return sh==='glb';if(k==='inner')return sh==='ring'||sh==='torus';if(k==='n')return sh==='spikes';if(k==='wk')return sh==='crescent'||sh==='ribbon';
    if(k==='prof')return sh==='lathe';if(k==='path')return sh==='ribbon';if(['heat','disp','flow','mode'].includes(k))return mt==='fire';if(k==='tex')return mt==='flip';if(['scroll','rim'].includes(k))return mt==='energy'||mt==='fire'||mt==='ice';if(k==='col2')return mt==='energy'||mt==='solid';}
  if(L.t==='emit'){if(k==='of')return g('from')==='mesh';if(k==='fh')return ['cone','box','line'].includes(g('from'));if(k==='spread')return ['up','down','aim'].includes(g('dir'))||g('from')==='cone';if(k==='fb')return ['smoke','fire'].includes(g('look'));}
  if(L.t==='trail'){if(['a0','a1','r','r0','tilt'].includes(k))return !!g('sweep');if(k==='of')return !g('sweep');}
  return true;}
function stShapePicker(L){const cur=L.shape||'sphere';return h('div',{className:'stF'},h('label',null,'รูปทรง',h('small',null,'shape')),h('div',{className:'stShapes'},...FXR.schema.shapes.map(k=>{const b=h('button',{className:k===cur?'on':'',title:k,on:{click:()=>{stPush();L.shape=k;stChanged(true);}}});b.innerHTML='<svg viewBox="0 0 24 18" fill="currentColor" stroke="currentColor">'+(SHAPE_SVG[k]||'')+'</svg>'+k;return b;})));}
function stJsonBox(L){const ta=h('textarea',{value:JSON.stringify(L,null,1),spellcheck:false,style:'width:100%;min-height:120px;font:11px var(--fu)'});
  return h('div',{className:'stF'},ta,h('button',{on:{click:()=>{try{const v=JSON.parse(ta.value);stPush();Object.keys(L).forEach(k=>delete L[k]);Object.assign(L,v);ST.sel=L.id;stChanged(true);}catch(e){stToast('JSON ผิด: '+e.message);}}}},'ใช้ JSON นี้'));}
const isCurveV=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).some(k=>k.trim()!==''&&!isNaN(+k));
function stField(L,obj,k,sp){if(!sp)return h('span');const cur=obj[k],v=cur!==undefined?cur:sp.def,lab=h('label',{title:sp.desc||''},sp.th||k,h('small',null,k+(cur===undefined?' · ค่าเริ่ม':'')));const box=h('div',{className:'stF'},lab);
  const set=(val,rebuild)=>{if(obj===ST.fx&&L===null){if(val===undefined||val===''||(Array.isArray(val)&&!val.length&&k==='tags'))delete obj[k];else obj[k]=val;stChanged(rebuild);}else stSet(obj,k,val,rebuild);};
  const reset=h('button',{className:'tg',title:'กลับเป็นค่าเริ่ม',on:{click:()=>{stPush();set(undefined,true);}}},'↺');
  switch(sp.type){
    case 'num':case 'int':{
      if(isCurveV(v)){box.append(stCurveEd(sp,v,nv=>set(nv,false)),h('div',{className:'row'},h('button',{className:'tg',on:{click:()=>{stPush();set(stCurveVal(v),true);}}},'เลิกใช้เส้นโค้ง'),reset));break;}
      const isR=Array.isArray(v)&&v.length===2,isE=typeof v==='string';const st=sp.step||0.01,mn=sp.min!==undefined?sp.min:0,mx=sp.max!==undefined?sp.max:10;
      const numIn=(val,fn)=>h('input',{type:'text',value:val,style:'width:62px',on:{focus:stPush,change:e=>{const s=e.target.value.trim();const n=+s;fn(s!==''&&!isNaN(n)?n:s);}}});
      if(isR){box.append(h('div',{className:'row'},numIn(v[0],x=>set([x,v[1]],false)),h('span',{className:'mute'},'ถึง'),numIn(v[1],x=>set([v[0],x],false)),h('button',{className:'tg',title:'ค่าเดียว',on:{click:()=>{stPush();set(typeof v[1]==='number'?v[1]:v[0],true);}}},'1'),reset));break;}
      const row=h('div',{className:'row'});
      if(!isE){const rg=h('input',{type:'range',min:mn,max:mx,step:st,value:v,on:{pointerdown:stPush,input:e=>{const n=+e.target.value;tb.value=n;set(n,false);}}});row.append(rg);}
      const tb=numIn(v,x=>set(x,true));row.append(tb);
      if(sp.range&&!isE)row.append(h('button',{className:'tg',title:'สุ่มในช่วง [min,max]',on:{click:()=>{stPush();set([+(v*0.7).toFixed(3),v],true);}}},'↔'));
      if(sp.curve&&!isE)row.append(h('button',{className:'tg',title:'เปลี่ยนตามเวลา (เส้นโค้ง)',on:{click:()=>{stPush();set({'0':v,'1':v},true);}}},'∿'));
      if(cur!==undefined)row.append(reset);box.append(row);
      if(isE)box.append(h('span',{className:'mute',style:'grid-column:1/-1;font-size:11px'},'สูตร: ใช้ params '+Object.keys(ST.fx.params||{}).join(', ')+' และ s k'));break;}
    case 'col':{const pal=fxPal(ST.fx.pal||'arcane'),chips=h('div',{className:'stChips'});
      for(const t of ['$core','$hi','$main','$deep','$light'])chips.append(h('button',{className:'stChip'+(v===t?' on':''),title:t,style:'background:'+pal[t.slice(1)],on:{click:()=>{stPush();set(t,true);}}}));
      chips.append(h('input',{type:'color',value:v&&v[0]==='#'?v:pal[(v||'$main').slice(1)]||'#ffffff',title:'สีเอง',on:{pointerdown:stPush,input:e=>set(e.target.value,false)}}));if(cur!==undefined)chips.append(reset);
      box.append(h('div',{className:'row'},chips));break;}
    case 'bool':box.append(h('div',{className:'row'},h('input',{type:'checkbox',checked:!!v,on:{change:e=>{stPush();set(e.target.checked,true);}}}),cur!==undefined?reset:null));break;
    case 'enum':{const list=Array.isArray(sp.of)?sp.of:sp.of==='types'?Object.keys(FXR.schema.types):FXR.schema[sp.of]||[];
      box.append(h('div',{className:'row'},h('select',{on:{change:e=>{stPush();set(e.target.value,true);}}},...list.map(o=>h('option',{value:o,selected:o===v},o))),cur!==undefined?reset:null));break;}
    case 'vec3':{if(isCurveV(v)||typeof v!=='object'||!Array.isArray(v)){
        if(typeof v==='number'||typeof v==='string'){const row=h('div',{className:'row'},h('input',{type:'text',value:v,style:'width:70px',on:{focus:stPush,change:e=>{const n=+e.target.value;set(isNaN(n)?e.target.value:n,true);}}}),
            h('button',{className:'tg',title:'แยก x y z',on:{click:()=>{stPush();set([v,v,v],true);}}},'xyz'),h('button',{className:'tg',title:'เปลี่ยนตามเวลา',on:{click:()=>{stPush();set({'0':typeof v==='number'?v*0.3:v,'1':v,ease:'out'},true);}}},'∿'),cur!==undefined?reset:null);box.append(row);
          if(k==='scale')box.append(h('span',{className:'mute',style:'grid-column:1/-1;font-size:11px'},'ตัวเลขเดียว = ขยายเท่ากันทุกด้าน (เมตร)'));break;}
        if(isCurveV(v)&&Object.keys(v).filter(q=>!isNaN(+q)).every(q=>typeof v[q]==='number')){box.append(stCurveEd(Object.assign({},sp,{min:0,max:Math.max(2,...Object.keys(v).filter(q=>!isNaN(+q)).map(q=>v[q]*1.5))}),v,nv=>set(nv,false)),h('div',{className:'row'},h('button',{className:'tg',on:{click:()=>{stPush();set(stCurveVal(v),true);}}},'เลิกใช้เส้นโค้ง'),reset));break;}
        const ta=h('textarea',{value:JSON.stringify(v),on:{focus:stPush,change:e=>{try{set(JSON.parse(e.target.value),true);}catch(er){stToast('JSON ผิด');}}}});box.append(ta,h('div',{className:'row'},reset));break;}
      const row=h('div',{className:'row'});['x','y','z'].forEach((ax,i)=>row.append(h('span',{className:'mute'},ax),h('input',{type:'number',step:0.1,value:v[i],style:'width:56px',on:{focus:stPush,input:e=>{const nv=v.slice();nv[i]=+e.target.value;set(nv,false);}}})));
      if(sp.curve)row.append(h('button',{className:'tg',title:'เคลื่อนที่ตามเวลา',on:{click:()=>{stPush();set({'0':v,'1':[v[0],v[1],v[2]+2]},true);}}},'∿'));if(cur!==undefined)row.append(reset);box.append(row);break;}
    case 'str':{const dl='stDL_'+k;const inp=h('input',{type:'text',value:v||'',list:dl,on:{focus:stPush,change:e=>set(e.target.value,true)}});const opts=k==='fx'?Object.keys(ST.list):k==='glb'?Object.keys((MODELS.man||{}).models||{}).filter(n=>n.startsWith('mesh_')||n.startsWith('vfx_')):k==='name'?Object.keys(SFXN):k==='tex'?[...Object.keys((MODELS.man||{}).fx||{}),...Object.keys((MODELS.man||{}).ptex||{})]:k==='fn'?Object.keys(FXCODE):k==='of'?ST.fx.layers.map(x=>x.id):[];
      box.append(h('div',{className:'row'},inp,cur!==undefined&&k!=='id'?reset:null),h('datalist',{id:dl},...opts.map(o=>h('option',{value:o}))));
      if(k==='id')inp.onchange=e=>{const n=e.target.value.trim();if(!n||ST.fx.layers.some(x=>x.id===n&&x!==obj)){stToast('id ซ้ำหรือว่าง');e.target.value=obj.id;return;}obj.id=n;ST.sel=n;stChanged(true);};break;}
    default:{const ta=h('textarea',{value:JSON.stringify(v,null,1),spellcheck:false,on:{focus:stPush,change:e=>{try{set(JSON.parse(e.target.value),true);}catch(er){stToast('JSON ผิด: '+er.message);}}}});box.append(ta);}}
  return box;}
function stCurveVal(c){const ks=Object.keys(c).filter(q=>!isNaN(+q)).sort((a,b)=>a-b);return c[ks[ks.length-1]];}
// ตัวแก้เส้นโค้ง: ลากจุด • ดับเบิลคลิกเพิ่มจุด • คลิกขวาลบ • เลือก ease
function stCurveEd(sp,c,onChange){const cvs=h('canvas',{width:300,height:90}),ease=h('select',{on:{change:e=>{stPush();if(e.target.value==='linear')delete c.ease;else c.ease=e.target.value;onChange(c);draw();}}},...['linear','in','out','inout','step'].map(o=>h('option',{value:o,selected:(c.ease||'linear')===o},o)));
  const xin=h('input',{type:'text',value:c.x!==undefined?c.x:'',placeholder:'คูณ',style:'width:60px',title:'ตัวคูณ (ตัวเลขหรือสูตร เช่น r*0.5)',on:{focus:stPush,change:e=>{const s=e.target.value.trim();if(!s)delete c.x;else c.x=isNaN(+s)?s:+s;onChange(c);}}});
  let mn=sp.min!==undefined?sp.min:0,mx=sp.max!==undefined?sp.max:1;const vals=Object.keys(c).filter(q=>!isNaN(+q)).map(q=>c[q]).filter(x=>typeof x==='number');if(vals.length){mn=Math.min(mn,...vals);mx=Math.max(Math.min(mx,Math.max(...vals)*1.6+0.01),...vals,mn+0.01);}
  const W=300,H=90,P=8,X=t=>P+t*(W-2*P),Y=v=>H-P-(v-mn)/(mx-mn)*(H-2*P),iX=x=>Math.max(0,Math.min(1,(x-P)/(W-2*P))),iY=y=>mn+(H-P-y)/(H-2*P)*(mx-mn);
  const pts=()=>Object.keys(c).filter(q=>!isNaN(+q)).map(q=>({k:q,t:+q,v:c[q]})).filter(p=>typeof p.v==='number').sort((a,b)=>a.t-b.t);
  function draw(){const x=cvs.getContext('2d');x.clearRect(0,0,W,H);x.strokeStyle='rgba(217,180,90,.15)';x.beginPath();for(let i=0;i<=4;i++){x.moveTo(X(i/4),P);x.lineTo(X(i/4),H-P);}x.stroke();
    x.fillStyle='#8f9ab3';x.font='10px monospace';x.fillText(mx.toFixed(2),2,10);x.fillText(mn.toFixed(2),2,H-2);
    x.strokeStyle='#f3dc94';x.lineWidth=2;x.beginPath();for(let i=0;i<=60;i++){const t=i/60,v=fxCurve(c,t,{P:{}});const y=typeof v==='number'?v:0;i?x.lineTo(X(t),Y(y)):x.moveTo(X(t),Y(y));}x.stroke();
    for(const p of pts()){x.fillStyle='#d9b45a';x.beginPath();x.arc(X(p.t),Y(p.v),4.5,0,7);x.fill();}}
  let dragK=null;const pos=e=>{const b=cvs.getBoundingClientRect();return [(e.clientX-b.left)*W/b.width,(e.clientY-b.top)*H/b.height];};
  const keyOf=t=>String(+t.toFixed(3));
  cvs.addEventListener('pointerdown',e=>{if(e.button!==0)return;const [x,y]=pos(e);let best=null,bd=10;for(const p of pts()){const d=Math.hypot(X(p.t)-x,Y(p.v)-y);if(d<bd){bd=d;best=p;}}if(best){stPush();dragK=best.k;cvs.setPointerCapture(e.pointerId);}});
  cvs.addEventListener('pointermove',e=>{if(dragK===null)return;const [x,y]=pos(e),v=+iY(y).toFixed(3);const ks=pts();const isEnd=dragK===ks[0].k||dragK===ks[ks.length-1].k;
    let t=isEnd?+dragK:+iX(x).toFixed(3);delete c[dragK];if(!isEnd){while(c[keyOf(t)]!==undefined)t=+(t+0.001).toFixed(3);}dragK=keyOf(t);c[dragK]=v;onChange(c);draw();});
  cvs.addEventListener('pointerup',()=>{dragK=null;});
  cvs.addEventListener('dblclick',e=>{const [x]=pos(e);const t=+iX(x).toFixed(3);stPush();const v=fxCurve(c,t,{P:{}});c[keyOf(t)]=+(+v).toFixed(3);onChange(c);draw();});
  cvs.addEventListener('contextmenu',e=>{e.preventDefault();const [x,y]=pos(e);const ps=pts();if(ps.length<=2)return;for(const p of ps){if(Math.hypot(X(p.t)-x,Y(p.v)-y)<9){stPush();delete c[p.k];onChange(c);draw();break;}}});
  draw();return h('div',{className:'stCurve'},cvs,h('div',{className:'row',style:'display:flex;gap:4px;align-items:center'},h('span',{className:'mute',style:'font-size:11px'},'ลากจุด • ดับเบิลคลิกเพิ่ม • คลิกขวาลบ'),ease,xin));}
// ---------- ผูกกับเกม (bind.json) ----------
function stBindPanel(){const box=h('div',null,h('h3',{style:'margin-top:8px'},'ผูกกับท่าในเกม (bind.json)'));let bind=null;
  const list=h('div',{className:'stLint'}),key=h('input',{type:'text',placeholder:'efx:dfboom',list:'stDLev',style:'width:130px'}),mode=h('select',null,h('option',{value:'add'},'เพิ่มทับ (add)'),h('option',{value:'replace'},'แทนที่ (replace)'));
  const evs=new Set([...Object.keys(EFXAUG).map(k=>'efx:'+k),'cast','pop','imp','boom','parry','block','sbreak','die','kill','revive','buff','land']);
  const load=async()=>{try{bind=await (await fetch('assets/fx/bind.json',{cache:'no-cache'})).json();}catch(e){bind={};}list.innerHTML='';const mine=Object.entries(bind).filter(([k,v])=>[].concat(v).some(b=>b&&b.fx===ST.name));
    if(!mine.length)list.append(h('div',{className:'mute'},'ยังไม่ได้ผูก'));for(const [k,v] of mine)list.append(h('div',null,h('span',{className:'mono'},k),h('span',{className:'mute'},' → '+[].concat(v).filter(b=>b.fx===ST.name).map(b=>b.mode||'add').join(',')),h('button',{className:'tg',on:{click:async()=>{const arr=[].concat(bind[k]).filter(b=>b.fx!==ST.name);if(arr.length)bind[k]=arr.length===1?arr[0]:arr;else delete bind[k];await saveB();}}},'ลบ')));};
  const saveB=async()=>{try{const r=await fetch('/api/save?path=assets/fx/bind.json',{method:'POST',body:JSON.stringify(bind,null,2)+'\n'});const j=await r.json();stToast(j.ok?'บันทึก bind.json แล้ว\n'+(j.check||''):'บันทึกไม่ได้: '+j.err,3500);FXR.bind=bind;}catch(e){stToast('ต้องเปิดผ่าน python tools/serve.py จึงบันทึก bind.json ได้');}load();};
  box.append(list,h('div',{style:'display:flex;gap:4px;flex-wrap:wrap;margin-top:4px'},key,mode,h('button',{on:{click:async()=>{const k=key.value.trim();if(!k||!ST.name){stToast('ใส่ชื่อ event และบันทึกไฟล์ก่อน');return;}const e={fx:ST.name};if(mode.value==='replace')e.mode='replace';bind[k]=bind[k]?[].concat(bind[k],e):e;await saveB();}}},'ผูก')),
    h('datalist',{id:'stDLev'},...[...evs].map(o=>h('option',{value:o}))),h('p',{className:'mute',style:'font-size:11.5px;margin:4px 0 0'},'เพิ่มทับ = เล่นเพิ่มจากภาพเดิมในเกม • แทนที่ = ใช้ไฟล์นี้แทนภาพเดิมของท่านั้นทั้งหมด'));
  load();return box;}
function stTryGame(){if(!ST.name){stToast('บันทึกไฟล์ก่อน');return;}const k=prompt('ผูกกับ event ไหนเพื่อลอง (เช่น efx:dfboom, imp:fire, parry)',ST.tryKey||'efx:');if(!k)return;ST.tryKey=k;
  const mode=confirm('แทนที่ภาพเดิมของท่านั้น? (ตกลง = แทนที่ • ยกเลิก = เพิ่มทับ)')?'replace':'add';
  try{const o=JSON.parse(localStorage.getItem('wd_fxbind')||'{}');o[k]={fx:ST.name,mode};localStorage.setItem('wd_fxbind',JSON.stringify(o));}catch(e){}
  if(ST.dirty)stToast('ไฟล์ยังไม่ได้บันทึก — เกมจะใช้เวอร์ชันที่บันทึกล่าสุด');window.open('index.html','_blank');
  stToast('เปิดเกมแล้ว: '+k+' → '+ST.name+' ('+mode+')\nล้างการผูกทดลอง: console → localStorage.removeItem("wd_fxbind")',5000);}
function stHelp(){const m=h('div',{className:'stModal',on:{click:e=>{if(e.target===m)m.remove();}}});m.append(h('div',{className:'box',style:'max-width:640px'},h('h3',null,'วิธีใช้ VFX Studio'),
  h('div',{style:'display:grid;gap:6px;font-size:13px'},...[
    'เลือกเอฟเฟกต์ทางซ้าย หรือ ＋ ใหม่ (เริ่มจากแม่แบบ) • ธาตุ = เปลี่ยนสีทั้งเอฟเฟกต์ในคลิกเดียว • ความแรง = คูณจำนวน/ขนาด/ความสว่างทั้งหมด',
    'ไทม์ไลน์: ลากแถบ = เลื่อนเวลาเริ่ม • ลากขอบขวา = ยืดอายุ • คลิกแถวเวลา = ไปเวลานั้น (ภาพจำลองแบบแน่นอน เหมือนเดิมทุกครั้ง) • 👁 ซ่อน • S เล่นชั้นเดียว',
    'แผงขวา: ค่าของชั้นที่เลือก • ∿ = เปลี่ยนค่าตามเวลา (เส้นโค้ง: ลากจุด ดับเบิลคลิกเพิ่ม คลิกขวาลบ) • ↔ = สุ่มในช่วง • ↺ = กลับค่าเริ่ม • ช่องตัวเลขพิมพ์สูตรได้ เช่น r*0.5',
    'จอ: ลากเมาส์ = หมุนกล้อง • ล้อเมาส์ = ซูม • ปุ่มมุมกล้อง • ตัวเลขล่างจอ: ขาวจ้า ≤ 8%, บังตัว ≤ 35% (แดง = เกิน)',
    'ปุ่มลัด: Space เล่น/หยุด • R เล่นใหม่ • ← → ทีละเฟรม (Shift = 0.1 วิ) • Ctrl+S บันทึก • Ctrl+Z / Ctrl+Y • Delete ลบชั้น',
    '🖼 แผ่นภาพ = ภาพสรุปทั้งไทม์ไลน์ + ตัวเลข • 🎮 ลองในเกม = เปิดห้องฝึกโดยผูกเอฟเฟกต์กับท่าที่เลือก • ผูกถาวร: ⚙ ตั้งค่าไฟล์ → ผูกกับท่าในเกม',
    'บันทึกตรงลงโปรเจกต์ต้องเปิดผ่าน python tools/serve.py • รูปแบบไฟล์ทั้งหมด: FX-FORMAT.md'].map(t=>h('p',{style:'margin:0'},'• '+t))),h('button',{on:{click:()=>m.remove()}},'ปิด')));$st('st').append(m);}
// ---------- API สำหรับ Claude / console ----------
window.STUDIO={load:n=>stOpen(n),data:()=>ST.fx,name:()=>ST.name,
  set(path,v){const [id,...ks]=path.split('.');const L=id==='file'?ST.fx:ST.fx.layers.find(x=>x.id===id);if(!L)return false;let o=L;for(let i=0;i<ks.length-1;i++)o=o[ks[i]];stPush();o[ks[ks.length-1]]=v;stChanged(true);return true;},
  play(){ST.play=true;stRestart();stSync();},pause(){ST.play=false;stSync();},seek:t=>{ST.play=false;stSeek(t);stSync();return ST.met;},sheet:(ts,save)=>stSheet(ts,save),
  metrics:()=>Object.assign({},ST.met,{run:ST.run,lint:ST.lint}),save:as=>stSave(as),shot:n=>stShot(n),cam:c=>{ST.cam=c;stSync();},at:a=>{ST.at=a;stRestart();},lint:()=>(stLintRun(),ST.lint),state:ST};
stBoot();
