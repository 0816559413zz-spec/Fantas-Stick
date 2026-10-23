// =====================================================================
//  VFX Studio — แก้เอฟเฟกต์ .fx.json บน renderer จริงของเกม (เปิด studio.html = index.html?studio)
//  โหลดต่อท้ายโค้ดเกม (ไฟล์เดียวกันทั้งหมดเป็นโมดูลเดียว) จึงใช้ G / hostStart / render / fxStart ฯลฯ ได้ตรง ๆ
//  แผน: designs/vfx-studio.md • รูปแบบไฟล์: FX-FORMAT.md • บันทึก/เก็บภาพผ่าน python tools/serve.py
//  URL: ?fx=<ชื่อ> &map=test|castle|... &cam=game|side|front|top|orbit &at=front|self|far &seed=N &sheet=0.05,0.2,... &save=<ชื่อภาพ> &t=<เวลา>
//  console: STUDIO.load(n) .data() .set('ball.scale',2) .play() .pause() .seek(t) .sheet([..]) .metrics() .save() .shot(n)
// =====================================================================
const SQ=new URLSearchParams(location.search);
const ST={fx:null,name:'',saved:'',mtime:0,dirty:false,t:0,play:!SQ.has('sheet'),speed:1,loop:true,seed:+(SQ.get('seed')||1),I:null,sel:null,
  cam:SQ.get('cam')||'game',dist:+SQ.get('dist')||9,orb:{yaw:0.9,pitch:0.32,dist:12},at:SQ.get('at')||'front',map:SQ.get('map')||'test',undo:[],redo:[],acc:0,seekTo:null,
  met:{white:0,lum:0,parts:0,calls:0,ms:0,block:0},run:{white:0,parts:0,block:0},list:{},ready:false,tail:0.6,api:false,mute:{},solo:null,busy:false,lint:[]};
const STD=1/60;let stVnow=performance.now(),stLast=performance.now(),stFr=0;
const $st=id=>document.getElementById(id);
function h(tag,a,...kids){const e=document.createElement(tag);if(a)for(const k in a){const v=a[k];if(k==='on')for(const ev in v)e.addEventListener(ev,v[ev]);else if(k==='style')e.style.cssText=v;else if(k in e&&k!=='list')e[k]=v;else e.setAttribute(k,v);}
  for(const c of kids.flat())if(c!=null&&c!==false)e.append(c.nodeType?c:document.createTextNode(c));return e;}
function stToast(m,ms){const t=$st('stToast');t.textContent=m;t.hidden=false;clearTimeout(stToast.k);stToast.k=setTimeout(()=>t.hidden=true,ms||2600);}
const stWait=(f,ms)=>new Promise(r=>{const t0=performance.now();const k=setInterval(()=>{let ok=false;try{ok=f();}catch(e){}if(ok||performance.now()-t0>ms){clearInterval(k);r(ok);}},50);});
function stRng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const TYPEC={flash:'#f3dc94',halo:'#e3a94a',ring:'#7fb8ff',light:'#ffb070',screen:'#c08aff',sound:'#8f9ab3',emit:'#ffd56a',mesh:'#ff8a3a',firevol:'#ff5a2a',trail:'#9fe8ff',bolt:'#ffe27a',decal:'#8a7a6a',debris:'#a08060',mist:'#cfe8ff',crown:'#9fd8ff',geyser:'#ff7a2a',warp:'#9ad0c8',use:'#b57dff',code:'#7d8aa8'};
const SHAPE_SVG={sphere:'<circle cx="12" cy="9" r="7"/>',dome:'<path d="M3 15a9 9 0 0 1 18 0Z"/>',disc:'<ellipse cx="12" cy="11" rx="10" ry="4"/>',ring:'<ellipse cx="12" cy="11" rx="10" ry="4" fill="none" stroke-width="2.5"/>',cylinder:'<path d="M4 4h16v12H4z" opacity=".8"/>',cone:'<path d="M12 1L20 17H4Z"/>',torus:'<ellipse cx="12" cy="10" rx="10" ry="5" fill="none" stroke-width="3.5"/>',crescent:'<path d="M5 16Q12-2 20 9Q12 3 5 16Z"/>',spikes:'<path d="M2 17L6 6L9 17L12 1L15 17L18 7L22 17Z"/>',beam:'<rect x="1" y="6" width="22" height="7" rx="3.5"/>',plane:'<rect x="5" y="2" width="14" height="14"/>',lathe:'<path d="M8 17C2 10 8 6 10 2h4c2 4 8 8 2 15Z"/>',ribbon:'<path d="M1 13Q7 1 12 9T23 5" fill="none" stroke-width="3"/>',glb:'<path d="M12 1L21 6v8l-9 5-9-5V6Z" fill="none" stroke-width="2"/>',model:'<path d="M12 1L21 6V13L12 18L3 13V6Z" opacity=".35"/><path d="M12 1L21 6L12 11L3 6Z"/>'};
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
  await mkInit();   // แท็บ 🧊 โมเดล + 🎞 ภาพ (studio/maker.js)
  if(SQ.has('sheet')){const ts=SQ.get('sheet').split(',').map(Number).filter(x=>!isNaN(x));await stSheet(ts.length?ts:null,SQ.get('save'));}
  else if(SQ.has('t')){ST.play=false;stSeek(+SQ.get('t'));}
}
async function stStartMap(id){ST.map=id;MODES.train.map=id;G.mapPick=id;G.mode='train';
  try{hostStart();}catch(e){console.error(e);}
  await stWait(()=>screen==='game'&&VIEW.cur&&G.players.me,6000);
  if(G.tr){G.tr.datk=0;G.tr.mai=0;G.tr.god=1;G.tr.nocd=1;}
  yaw=0;pitch=0.2;}
function stResize(){const w=Math.max(200,innerWidth-stVar('--sL')-stVar('--sR')),hh=Math.max(150,innerHeight-stVar('--sT')-stVar('--sB')-stVar('--sS'));
  gl.setSize(w,hh,false);composer.setSize(w,hh);cam.aspect=w/hh;cam.updateProjectionMatrix();}
addEventListener('resize',()=>{if(document.body.classList.contains('studio'))setTimeout(stResize,0);});
// ---------- จุดที่เล่นเอฟเฟกต์ + กล้อง ----------
function stAnchor(){const me=G&&G.players&&G.players.me;if(!me)return null;const a=0,d=ST.at==='far'?600:ST.at==='self'?0:240;return {x:me.x+Math.cos(a)*d,y:me.y+Math.sin(a)*d,h:0,a,follow:ST.at==='self'?'me':undefined};}
const _stv=new THREE.Vector3();
function stCam(c){if(ST.cam==='game'||!ST.fx)return;const A=stAnchor();if(!A)return;const T=_stv.set(tx(A.x),GY(A.x,A.y)+1.1,tz(A.y));
  const f=[Math.cos(A.a),Math.sin(A.a)],r=[-Math.sin(A.a),Math.cos(A.a)];
  if(ST.cam==='side')c.position.set(T.x+r[0]*ST.dist,T.y+2.2*ST.dist/9,T.z+r[1]*ST.dist);
  else if(ST.cam==='front')c.position.set(T.x+f[0]*ST.dist,T.y+2*ST.dist/9,T.z+f[1]*ST.dist);
  else if(ST.cam==='top')c.position.set(T.x+0.01,T.y+22,T.z+0.01);
  else{const o=ST.orb;c.position.set(T.x+Math.cos(o.yaw)*Math.cos(o.pitch)*o.dist,T.y+Math.sin(o.pitch)*o.dist,T.z+Math.sin(o.yaw)*Math.cos(o.pitch)*o.dist);}
  c.lookAt(T);}
// ---------- เล่น / กรอเวลา (จำลองแน่นอน: dt คงที่ + เลขสุ่มมี seed) ----------
function stDur(){const F=ST.fx;if(!F)return 2;if(F.dur)return F.dur;let e=0.5;for(const L of F.layers||[]){const g=k=>L[k]!==undefined?L[k]:(FXR.def[L.t]||{})[k];const n=v=>typeof v==='number'?v:Array.isArray(v)?+v[1]||0:0;e=Math.max(e,n(g('at'))+n(g('life')));}return e;}
function stIsLoop(){return (ST.fx&&ST.fx.layers||[]).some(L=>L.loop);}
function stRender(dt,draw){stVnow+=dt*1000;FXSTUDIO.noDraw=!draw;try{render(dt,stVnow);}catch(e){console.error(e);}finally{FXSTUDIO.noDraw=false;}}
function stFlush(){if(ST.I){fxKill(ST.I);ST.I=null;}fxClearAll();for(let i=0;i<34;i++)stRender(0.15,false);PARTS.length=0;SCR.fl.length=0;SCR.rad=null;SCR.chr=0;shakeA=0;}
function stLayers(){const F=ST.fx;return Object.assign({},F,{layers:(F.layers||[]).filter(L=>!ST.mute[L.id]&&(!ST.solo||ST.solo===L.id))});}
function stRestart(){if(!ST.fx||!VIEW.cur||MK.ws!=='fx')return;stFlush();Math.random=stRng(ST.seed*7919+13);ST.t=0;ST.acc=0;ST.run={white:0,parts:0,block:0};
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
  if(MK.ws!=='fx'){mkFrame(rdt);return;}   // แท็บโมเดล / ภาพ วาดจอเอง
  if(ST.seekTo!==null){const t=ST.seekTo;ST.seekTo=null;stSeek(t);stTlTime();return;}
  if(ST.play){ST.acc+=rdt*ST.speed;let n=0;while(ST.acc>=STD&&n<6){ST.acc-=STD;stStep();n++;}if(ST.acc>STD)ST.acc=0;
    if(ST.t>=stDur()+ST.tail){if(ST.loop)stRestart();else{ST.play=false;stSync();}}}
  stDraw(false);stTlTime();}
// ---------- แผ่นภาพสรุปทั้งไทม์ไลน์ (สำหรับ Claude: ภาพเดียวเห็นทั้ง ง้าง → กระแทก → สลาย) ----------
async function stSheet(times,save){if(!ST.fx)return null;ST.busy=true;try{await fxAssetsWait(ST.fx);}catch(e){}const was=ST.play;ST.play=false;
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
    ST.fx=d;ST.name=name;ST.saved=JSON.stringify(d);ST.mtime=(ST.list[name]||{}).t||0;ST.dirty=false;ST.undo=[];ST.redo=[];ST.mute={};ST.solo=null;FXR.db.set(name,{data:JSON.parse(txt),fail:false,p:Promise.resolve(null)});
    if(!keepT){ST.sel=null;if(!SQ.has('at')){const tg=d.tags||[];ST.at=tg.some(t=>['self','aura','shield','buff','slash','beam','projectile','melee'].includes(t))?'self':'front';const el=$st('stAt');if(el)el.value=ST.at;}}
    stAfterChange(true,keepT);stLibRender();return true;}catch(e){stToast('เปิดไม่ได้: '+name+' ('+e.message+')');return false;}}
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
function stAfterChange(rebuild,keepT){if(ST.fx)fxPreAssets(ST.fx);stLintRun();stSync();stTlRender();if(rebuild!==false)stInspRender();
  if(!VIEW.cur)return;if(keepT&&!ST.play)ST.seekTo=ST.t;else stRestart();}
function stLintRun(){if(!window.FXLINT||!FXR.schema||!ST.fx){ST.lint=[];return;}
  const man=MODELS.man||{},ctx={names:new Set(Object.keys(ST.list)),models:new Set(Object.keys(man.models||{})),flips:new Set([...Object.keys(man.fx||{}),...Object.keys(man.ptex||{})]),sounds:new Set(Object.keys(SFXN)),self:ST.name,meshes:new Set(Object.keys(MK.list.mesh)),texs:new Set(Object.keys(MK.list.tex))};
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
  const seg=(...k)=>h('span',{className:'stSeg2'},...k);
  root.append(h('div',{id:'stTop'},h('span',{className:'logo'},h('i',null,'✦'),'VFX Studio'),h('span',{className:'sep'}),
    h('span',{className:'file',id:'stFile',title:'ไฟล์ที่เปิดอยู่ (● สีส้ม = ยังไม่ได้บันทึก)'},'—'),
    seg(h('button',{id:'stBNew',title:'สร้างเอฟเฟกต์ใหม่ โดยเริ่มจากแม่แบบ',on:{click:stNewFrom}},'＋ ใหม่'),h('button',{id:'stBSave',className:'gold',title:'บันทึกลงโปรเจกต์ (Ctrl+S)',on:{click:()=>stSave(false)}},'💾 บันทึก'),
      h('button',{id:'stBSaveAs',title:'บันทึกเป็นชื่อใหม่ (Ctrl+Shift+S)',on:{click:()=>stSave(true)}},'เป็น…')),
    seg(h('button',{id:'stBUndo',title:'ย้อนกลับ (Ctrl+Z)',on:{click:()=>stUndo(false)}},'↶'),h('button',{id:'stBRedo',title:'ทำซ้ำ (Ctrl+Y)',on:{click:()=>stUndo(true)}},'↷')),
    h('span',{className:'sep'}),h('label',{title:'ธาตุ = เปลี่ยนสีทั้งเอฟเฟกต์ในคลิกเดียว (สี $core $main … ตามธาตุ)'},'ธาตุ',sel('stPal',[],'',v=>{stPush();ST.fx.pal=v;stChanged(true);})),
    h('label',{title:'ความแรงรวมของทั้งเอฟเฟกต์ (k): คูณจำนวน / ขนาด / ความสว่างทั้งหมด'},'ความแรง',h('input',{type:'range',id:'stK',min:0.3,max:2,step:0.05,value:1,style:'width:80px',on:{pointerdown:stPush,input:e=>{ST.fx.k=+e.target.value;if(ST.fx.k===1)delete ST.fx.k;stChanged(false);}}})),
    h('span',{className:'grow'}),
    h('label',{title:'ฉากที่ใช้ดู — ลองทั้งฉากสว่างและฉากมืด'},'🗺',sel('stMap',[['test','ห้องฝึก (สว่าง)'],['castle','ปราสาท (มืด)'],['greathall','ห้องโถง (มืด)'],['meadow','ทุ่งหญ้า (เย็น)'],['lake','ทะเลสาบ (คืน)']],ST.map,async v=>{ST.busy=true;await stStartMap(v);ST.busy=false;stResize();stRestart();})),
    h('label',{title:'จุดที่เล่นเอฟเฟกต์: หน้าตัวเรา / ที่ตัวเรา (ออร่า โล่ ฟัน) / ไกล'},'📍',sel('stAt',[['front','หน้าเรา 12 ม.'],['self','ที่ตัวเรา (ติดตาม)'],['far','ไกล 30 ม.']],ST.at,v=>{ST.at=v;stRestart();})),
    h('label',{title:'ระดับกราฟิก — ลอง "ประหยัด" ด้วย เพื่อดูว่าเครื่องช้ายังสวยไหม'},'⚙',sel('stQ',[['auto','กราฟิกอัตโนมัติ'],['high','กราฟิกสูง'],['low','กราฟิกประหยัด']],QUAL.mode,v=>{QUAL.mode=v;applyQuality();stResize();stRestart();})),
    h('span',{className:'sep'}),
    seg(h('button',{id:'stBSheet',title:'แผ่นภาพสรุปทั้งไทม์ไลน์ + ตัวเลขตรวจ (ขาวจ้า / บังตัว)',on:{click:()=>stSheet(null,null)}},'🖼 แผ่นภาพ'),
      h('button',{id:'stBShot',title:'เก็บภาพจอนี้ลงโฟลเดอร์ shots/',on:{click:()=>stShot((ST.name||'fx').replace(/\//g,'_')+'_'+ST.t.toFixed(2).replace('.','s'))}},'📷')),
    h('button',{id:'stBGame',title:'เปิดเกม (ห้องฝึก) แล้วผูกเอฟเฟกต์นี้กับท่าที่เลือก เพื่อลองของจริง',on:{click:stTryGame}},'🎮 ลองในเกม'),
    h('button',{id:'stBHelp',className:'ghost',title:'วิธีใช้ + ปุ่มลัดทั้งหมด (?)',on:{click:stHelp}},'❔')));
  root.append(h('div',{id:'stLib'},h('div',{className:'stPH'},h('h3',null,'ไลบรารีเอฟเฟกต์'),h('button',{className:'ghost',title:'สร้างเอฟเฟกต์ใหม่จากแม่แบบ',on:{click:stNewFrom}},'＋')),
    h('div',{className:'head'},h('input',{type:'search',id:'stSearch',placeholder:'🔍 ค้นหาชื่อ / คำอธิบาย / แท็ก',on:{input:stLibRender}})),h('div',{id:'stLibList'})));
  root.append(h('div',{id:'stView'},h('div',{id:'stCams'},h('span',{className:'lab',title:'มุมกล้อง (ปุ่ม 1–5) • ลากบนจอ = หมุน • ล้อเมาส์ = ซูม'},'🎥'),
      ...[['game','กล้องเกม'],['side','ข้าง'],['front','หน้า'],['top','บน'],['orbit','หมุนเอง']].map(([k,t],i)=>h('button',{id:'stCam_'+k,'data-cam':k,title:t+' ('+(i+1)+')',on:{click:()=>stSetCam(k)}},t))),
    h('div',{id:'stHud'},h('span',{id:'stHParts',title:'จำนวนอนุภาคตอนนี้ (ควรต่ำกว่า 3000)'}),h('span',{id:'stHWhite',title:'ขาวจ้า: % ของจอที่ขาวเกือบทั้งหมด (ต้อง ≤ 8%)'}),h('span',{id:'stHBlock',title:'บังตัว: % ของตัวละครเราที่ถูกแสงกลบ (ต้อง ≤ 35%)'}),h('span',{id:'stHCalls',title:'draw calls (ยิ่งน้อยยิ่งเร็ว)'}),h('span',{id:'stHMs',title:'เวลาวาดต่อเฟรม (ควรต่ำกว่า 16 ms)'})),h('div',{id:'stBanner',hidden:true})));
  root.append(h('div',{id:'stTl'},h('div',{className:'bar'},h('span',{className:'ttl'},'ไทม์ไลน์'),
    seg(h('button',{id:'stToStart',title:'กลับไปจุดเริ่ม (Home)',on:{click:()=>{ST.play=false;ST.seekTo=0;stSync();}}},'⏮'),
      h('button',{id:'stPlay',title:'เล่น / หยุด (Space)',on:{click:()=>{ST.play=!ST.play;if(ST.play&&ST.t>=stDur()+ST.tail)stRestart();stSync();}}},'⏸'),
      h('button',{id:'stRe',title:'เล่นใหม่ตั้งแต่ต้น (R)',on:{click:()=>{ST.play=true;stRestart();stSync();}}},'⟲'),
      h('button',{id:'stLoop',title:'วนเล่นซ้ำ (L)',on:{click:()=>{ST.loop=!ST.loop;stSync();}}},'🔁')),
    h('span',{className:'time',id:'stTime',title:'เวลาตอนนี้ / ความยาวเอฟเฟกต์ • ← → ทีละเฟรม (Shift = ทีละ 0.1 วิ)'},'0.00'),
    h('span',{className:'mute',style:'font-size:11.5px'},'ความเร็ว'),seg(...[0.1,0.25,0.5,1].map(s=>h('button',{'data-sp':s,id:'stSp'+s,title:'เล่นช้าลงเพื่อดูรายละเอียด',on:{click:()=>{ST.speed=s;stSync();}}},s+'×'))),
    h('span',{className:'sep'}),h('span',{id:'stAdd'},h('button',{id:'stAddB',className:'gold',title:'เพิ่มชั้นใหม่ที่ตำแหน่งหัวเล่น (Shift+A)',on:{click:e=>stAddMenu(e.currentTarget)}},'＋ เพิ่มชั้น')),
    h('span',{className:'grow',style:'flex:1'}),
    h('label',{className:'mute',style:'display:flex;gap:5px;align-items:center;font-size:11.5px',title:'เลขสุ่ม — เปลี่ยนเพื่อดูการสุ่มแบบอื่น (ภาพเดิมทุกครั้งถ้าเลขเดิม)'},'🎲 seed',h('input',{type:'number',id:'stSeed',value:ST.seed,min:1,max:9999,style:'width:62px',on:{change:e=>{ST.seed=+e.target.value||1;stRestart();}}}))),h('div',{id:'stRows'})));
  root.append(h('div',{id:'stInsp'}));
  root.append(h('div',{id:'stStat'},h('span',{className:'hint',id:'stHint'}),h('span',{id:'stSLint',title:'ผลตรวจไฟล์ (fx-check) — คลิกเพื่อดูรายละเอียด',style:'cursor:pointer',on:{click:()=>{if(stWs()!=='fx')return;ST.sel=null;stTlRender();stInspRender();}}}),
    h('span',{id:'stSSave'}),h('span',{id:'stSApi'}),h('span',null,h('button',{title:'วิธีใช้ + ปุ่มลัดทั้งหมด (?)',on:{click:stHelp}},'⌨ ปุ่มลัด'))));
  for(const s of ['L','R','B'])root.append(h('div',{className:'stSplit',id:'stSp'+s,title:'ลากเพื่อปรับขนาดแผง • ดับเบิลคลิก = พับ / กาง'}));
  root.append(h('div',{id:'stToast',hidden:true}));
  stSplitInit();
  // แถบสถานะบอกว่าปุ่ม/ช่องที่ชี้อยู่ทำอะไร (แบบ Blender)
  root.addEventListener('mouseover',e=>{const t=e.target.closest&&e.target.closest('[title]');stHint(t?t.title:'');});
  // กล้องหมุนเอง: ลากบนจอ / ล้อเมาส์ซูม
  const cv=gl.domElement;let drag=null;
  cv.addEventListener('pointerdown',e=>{if(mkGizmoHot()||meBoxDown(e))return;drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId);if(ST.cam!=='orbit'){ST.cam='orbit';stSync();}});
  cv.addEventListener('pointermove',e=>{if(!drag)return;ST.orb.yaw+=(e.clientX-drag.x)*0.008;ST.orb.pitch=Math.max(-0.2,Math.min(1.45,ST.orb.pitch+(e.clientY-drag.y)*0.006));drag={x:e.clientX,y:e.clientY};if(!ST.play)ST.seekTo=ST.t;});
  cv.addEventListener('pointerup',()=>drag=null);
  cv.addEventListener('wheel',e=>{e.preventDefault();ST.orb.dist=Math.max(3,Math.min(60,ST.orb.dist*(e.deltaY>0?1.1:0.9)));if(ST.cam!=='orbit'){ST.cam='orbit';stSync();}if(!ST.play)ST.seekTo=ST.t;},{passive:false});
  // ปุ่มลัด (กันไม่ให้ปุ่มไหลเข้าเกม)
  addEventListener('keydown',e=>{if(!document.body.classList.contains('studio'))return;const tg=e.target.tagName;const typing=tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT';
    if(typing&&e.target._key){e.target._key(e);e.stopImmediatePropagation();return;}
    if(e.key==='Escape'&&document.querySelector('#st .stPop,#st .stModal')){stPopClose();document.querySelectorAll('#st .stModal').forEach(x=>x.remove());e.stopImmediatePropagation();return;}
    if(MK.ws!=='fx'){mkKey(e,typing);e.stopImmediatePropagation();return;}
    const C=e.ctrlKey||e.metaKey;
    if(C&&e.code==='KeyS'){e.preventDefault();e.stopImmediatePropagation();stSave(e.shiftKey);return;}
    if(typing){e.stopImmediatePropagation();return;}
    if(C&&e.code==='KeyZ'){e.preventDefault();stUndo(e.shiftKey);}
    else if(C&&e.code==='KeyY'){e.preventDefault();stUndo(true);}
    else if(C&&e.code==='KeyD'){e.preventDefault();if(ST.sel)stDupLayer(ST.sel);}
    else if(e.shiftKey&&e.code==='KeyA'){e.preventDefault();stAddMenu($st('stAddB'));}
    else if(e.key==='?'||(e.shiftKey&&e.code==='Slash')){stHelp();}
    else if(e.code==='Space'){e.preventDefault();$st('stPlay').click();}
    else if(e.code==='KeyR'&&!C)$st('stRe').click();
    else if(e.code==='KeyL'&&!C)$st('stLoop').click();
    else if(e.code==='KeyH'&&!C&&ST.sel)stMuteT(ST.sel);
    else if(e.code==='F2'&&ST.sel){e.preventDefault();stRename(ST.sel);}
    else if(e.code==='Home'){ST.play=false;ST.seekTo=0;stSync();}
    else if(e.code==='Escape'){if(ST.sel){ST.sel=null;stTlRender();stInspRender();}}
    else if(/^Digit[1-5]$/.test(e.code)&&!C){stSetCam(['game','side','front','top','orbit'][+e.code.slice(5)-1]);}
    else if((e.code==='Delete'||e.code==='Backspace')&&ST.sel){stDelLayer(ST.sel);}
    else if(e.code==='ArrowRight'||e.code==='ArrowLeft'){ST.play=false;ST.seekTo=Math.max(0,ST.t+(e.code==='ArrowRight'?1:-1)*(e.shiftKey?0.1:STD));stSync();}
    else if((e.code==='ArrowUp'||e.code==='ArrowDown')&&ST.fx){e.preventDefault();const A=ST.fx.layers,i=A.findIndex(L=>L.id===ST.sel),j=Math.max(-1,Math.min(A.length-1,i+(e.code==='ArrowDown'?1:-1)));ST.sel=j<0?null:A[j].id;stTlRender();stInspRender();}
    e.stopImmediatePropagation();},true);
  addEventListener('keyup',e=>{if(document.body.classList.contains('studio'))e.stopImmediatePropagation();},true);
  addEventListener('beforeunload',e=>{if(ST.dirty){e.preventDefault();e.returnValue='';}});
}
const stWs=()=>{try{return MK.ws;}catch(e){return 'fx';}};
function stSetCam(k){ST.cam=k;stSync();if(!ST.play)ST.seekTo=ST.t;}
// ---------- แถบสถานะ + คำใบ้ ----------
const ST_HINT={fx:'ลากแถบสี = เลื่อนเวลา • ลากขอบขวา = ยืดอายุ • คลิกขวาที่ชั้น = เมนู • Shift+A เพิ่มชั้น • Space เล่น/หยุด • ? ดูปุ่มลัดทั้งหมด',
  mesh:'คลิกชิ้นบนจอ = เลือก • G ย้าย / R หมุน / S ย่อขยาย • ลากจอ = หมุนกล้อง • ล้อเมาส์ = ซูม',edit:'โหมดแก้จุด: 1 จุด / 2 ขอบ / 3 หน้า • คลิก = เลือก (Shift เพิ่ม) • Alt+คลิกขอบ = เลือกวง • B ลากกรอบ • Ctrl+R ตัดวง • A ทั้งหมด • ลากลูกศร G/R/S • E ดึงออก • I หดใน • F เติมหน้า • M รวมจุด • X ลบ • Tab ออก',
  tex:'ปรับค่าทางขวา ภาพจะวาดใหม่เอง • ลากไฟล์ PNG/JPG มาวางบนจอเพื่อนำเข้า',vol:'ตั้งค่าทางขวา แล้วกดจำลอง • ลากจอ = หมุนกล้อง'};
function stHint(s){const e=$st('stHint');if(!e)return;let w=stWs();try{if(w==='mesh'&&ME.on)w='edit';}catch(er){}e.textContent=s||ST_HINT[w]||'';}
function stStatus(){const l=$st('stSLint');if(!l)return;const fx=stWs()==='fx';
  const e=ST.lint.filter(r=>r.lv==='err').length,w=ST.lint.filter(r=>r.lv==='warn').length;l.className=e?'err':w?'warn':'ok';l.textContent=e?'✗ ผิด '+e+(w?' • ⚠ '+w:''):w?'⚠ เตือน '+w:'✓ ตรวจผ่าน';l.style.display=fx?'':'none';
  const s=$st('stSSave');s.className=ST.dirty?'warn':'ok';s.textContent=ST.dirty?'● ยังไม่บันทึก':'✓ บันทึกแล้ว';s.style.display=fx?'':'none';
  const a=$st('stSApi');a.className=ST.api?'ok':'warn';a.textContent=ST.api?'🔌 บันทึกลงโปรเจกต์ได้':'⚠ บันทึกตรงไม่ได้';
  a.title=ST.api?'เชื่อมกับ tools/serve.py แล้ว — กดบันทึก ไฟล์ลงโปรเจกต์ทันที':'ไม่ได้เปิดผ่าน VFX Studio.bat (serve.py) — บันทึกจะเป็นการดาวน์โหลดไฟล์แทน';
  if(!$st('stHint').textContent)stHint('');}
// ---------- เส้นแบ่งปรับขนาดแผง (จำขนาดไว้ในเครื่อง) ----------
function stLoad(k,d){try{return JSON.parse(localStorage.getItem(k))||d;}catch(e){return d;}}
function stStore(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function stVar(n){return parseFloat(getComputedStyle(document.body).getPropertyValue(n))||0;}
function stSplitInit(){const lay=stLoad('wd_studio_lay',{}),B=document.body.style,lim={L:[150,520],R:[250,640],B:[110,()=>innerHeight*0.62]};
  const apply=()=>{for(const k of ['L','R','B']){if(lay['c'+k])B.setProperty('--s'+k,'0px');else if(lay[k])B.setProperty('--s'+k,lay[k]+'px');else B.removeProperty('--s'+k);document.body.classList.toggle('no'+k,!!lay['c'+k]);}try{stResize();}catch(e){}};
  for(const k of ['L','R','B']){const el=$st('stSp'+k);
    el.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();el.setPointerCapture(e.pointerId);el.classList.add('on');const x0=e.clientX,y0=e.clientY,v0=lay['c'+k]?0:stVar('--s'+k);
      const mv=ev=>{const v=k==='L'?v0+(ev.clientX-x0):k==='R'?v0-(ev.clientX-x0):v0-(ev.clientY-y0),[a,b]=lim[k],mx=typeof b==='function'?b():b;
        if(v<a*0.5)lay['c'+k]=true;else{lay['c'+k]=false;lay[k]=Math.round(Math.max(a,Math.min(mx,v)));}apply();};
      const up=()=>{el.classList.remove('on');el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);stStore('wd_studio_lay',lay);};
      el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);});
    el.addEventListener('dblclick',()=>{lay['c'+k]=!lay['c'+k];apply();stStore('wd_studio_lay',lay);});}
  apply();}
// ---------- หน้าต่างลอย (เมนูเพิ่มชั้น / คลิกขวา) ----------
function stPopClose(){document.querySelectorAll('#st .stPop').forEach(p=>p.remove());}
function stPop(box,x,y,up){stPopClose();box.classList.add('stPop');$st('st').append(box);const r=box.getBoundingClientRect();if(up)y-=r.height+6;
  box.style.left=Math.max(6,Math.min(innerWidth-r.width-6,x))+'px';box.style.top=Math.max(6,Math.min(innerHeight-r.height-6,y))+'px';
  setTimeout(()=>{const off=e=>{if(!box.isConnected||!box.contains(e.target)){box.remove();removeEventListener('pointerdown',off,true);}};addEventListener('pointerdown',off,true);},0);return box;}
const ST_CATS=[['แสงและแฟลช',['flash','halo','ring','light']],['รูปทรง 3D และไฟ',['mesh','firevol','vol','geyser','crown']],['อนุภาคและเศษ',['emit','debris','mist','trail']],['ธาตุพิเศษ',['bolt','decal','warp']],['ทั้งจอและเสียง',['screen','sound']],['ขั้นสูง',['use','code']]];
function stAddMenu(anchor){const T=FXR.schema&&FXR.schema.types;if(!T||!ST.fx)return;
  const q=h('input',{type:'search',placeholder:'🔍 พิมพ์หาชนิดชั้น เช่น ไฟ, อนุภาค, ring … แล้วกด Enter'}),cats=h('div',{className:'cats'}),box=h('div',{id:'stAddMenu'},q,cats);
  const seen=new Set(ST_CATS.flatMap(c=>c[1])),groups=ST_CATS.map(([n,ks])=>[n,ks.filter(k=>T[k])]),rest=Object.keys(T).filter(k=>!seen.has(k));if(rest.length)groups.push(['อื่น ๆ',rest]);
  let first=null;const pick=t=>{box.remove();stAddLayer(t);stToast('เพิ่มชั้น "'+(T[t].th||t)+'" ที่เวลา '+Math.min(ST.t,stDur()).toFixed(2)+' วิ แล้ว — แก้ค่าได้ที่แผงขวา');};
  const draw=()=>{const s=q.value.trim().toLowerCase();cats.innerHTML='';first=null;
    for(const [n,ks] of groups){const opts=ks.filter(k=>!s||(k+' '+T[k].th+' '+(T[k].desc||'')+' '+n).toLowerCase().includes(s));if(!opts.length)continue;
      cats.append(h('div',{className:'cat'},h('h4',null,n),...opts.map(k=>{const b=h('button',{className:'opt'+(first?'':' hi'),title:(T[k].th||k)+' — '+(T[k].desc||''),style:'--c:'+(TYPEC[k]||'#d9b45a'),on:{click:()=>pick(k)}},h('i',null,T[k].icon||'•'),h('b',null,T[k].th||k),h('small',null,k+' · '+(T[k].desc||'')));if(!first)first=k;return b;})));}
    if(!first)cats.append(h('p',{className:'mute'},'ไม่พบชนิดที่ค้นหา'));};
  q._key=e=>{if(e.key==='Enter'&&first)pick(first);else if(e.key==='Escape')box.remove();};q.addEventListener('input',draw);draw();
  const r=anchor?anchor.getBoundingClientRect():{left:innerWidth/2-280,top:innerHeight/2};stPop(box,r.left,r.top,true);q.focus();}
function stLayerMenu(L,i,x,y){if(ST.sel!==L.id){ST.sel=L.id;stTlRender();stInspRender();}
  const it=(t,k,f,cls)=>h('button',{className:cls||'',on:{click:()=>{stPopClose();f();}}},h('span',null,t),k?h('kbd',null,k):null);
  stPop(h('div',{className:'stCtx'},it('✎ เปลี่ยนชื่อ','F2',()=>stRename(L.id)),it('⧉ ทำซ้ำชั้นนี้','Ctrl+D',()=>stDupLayer(L.id)),h('hr'),
    it(ST.mute[L.id]?'👁 แสดงชั้นนี้':'◌ ซ่อนชั่วคราว','H',()=>stMuteT(L.id)),it(ST.solo===L.id?'◉ เลิกเล่นเดี่ยว':'◉ เล่นชั้นนี้ชั้นเดียว','',()=>stSoloT(L.id)),h('hr'),
    it('↑ ย้ายขึ้น','',()=>stMove(i,-1)),it('↓ ย้ายลง','',()=>stMove(i,1)),it('⏱ ให้เริ่มที่หัวเล่น ('+ST.t.toFixed(2)+' วิ)','',()=>{stPush();L.at=+Math.min(ST.t,stDur()).toFixed(2);stChanged(true);}),h('hr'),
    it('✕ ลบชั้น','Delete',()=>stDelLayer(L.id),'danger')),x,y);}
function stMuteT(id){ST.mute[id]=!ST.mute[id];stTlRender();stRestart();}
function stSoloT(id){ST.solo=ST.solo===id?null:id;stTlRender();stRestart();}
function stRename(id){const el=document.querySelector('#stRows .stName[data-id="'+CSS.escape(id)+'"] .nm'),L=ST.fx.layers.find(x=>x.id===id);if(!el||!L)return;
  const inp=h('input',{type:'text',value:id,spellcheck:false});el.innerHTML='';el.append(inp);inp.focus();inp.select();let done=false;
  const fin=ok=>{if(done)return;done=true;const n=inp.value.trim().replace(/\s+/g,'_');
    if(ok&&n&&n!==id){if(ST.fx.layers.some(x=>x.id===n))stToast('มีชั้นชื่อ '+n+' แล้ว');else{stPush();for(const X of ST.fx.layers)if(X.of===id)X.of=n;L.id=n;if(ST.sel===id)ST.sel=n;if(ST.mute[id]){ST.mute[n]=1;delete ST.mute[id];}if(ST.solo===id)ST.solo=n;stChanged(true);return;}}
    stTlRender();};
  inp._key=e=>{if(e.key==='Enter')fin(true);else if(e.key==='Escape')fin(false);};inp.addEventListener('blur',()=>fin(true));}
function stSync(){if(!$st('stTop'))return;const F=ST.fx;$st('stFile').textContent=(ST.name||'(ใหม่)')+(ST.dirty?' ●':'');$st('stFile').classList.toggle('dirty',ST.dirty);
  const ps=$st('stPal');if(FXR.schema&&ps.options.length<2)for(const p of FXR.schema.pals)ps.append(h('option',{value:p},p));if(F)ps.value=F.pal||'arcane';
  if(F)$st('stK').value=F.k||1;$st('stPlay').textContent=ST.play?'⏸':'▶';$st('stPlay').classList.toggle('on',ST.play);$st('stLoop').classList.toggle('on',ST.loop);
  $st('stBUndo').disabled=!ST.undo.length;$st('stBRedo').disabled=!ST.redo.length;
  document.querySelectorAll('#stTl [data-sp]').forEach(b=>b.classList.toggle('on',+b.dataset.sp===ST.speed));document.querySelectorAll('#stCams [data-cam]').forEach(b=>b.classList.toggle('on',b.dataset.cam===ST.cam));stStatus();}
function stHudUpdate(){if(stFr%3)return;const M=ST.met,s=(id,t,bad)=>{const e=$st(id);e.textContent=t;e.className=bad?'bad':'good';};
  s('stHParts','อนุภาค '+M.parts,M.parts>3000);s('stHWhite','ขาวจ้า '+M.white.toFixed(1)+'%',M.white>8);s('stHBlock','บังตัว '+M.block.toFixed(0)+'%',M.block>35);s('stHCalls','draw '+M.calls,M.calls>900);s('stHMs',M.ms.toFixed(1)+' ms',M.ms>16);}
// ---------- ไลบรารี ----------
const ST_GRP={start:['✨','แม่แบบเริ่มต้น'],tpl:['◈','แม่แบบในเกม'],sig:['◆','ลายเซ็นธาตุ'],rec:['↺','ท่าตอบโต้'],fire:['🔥','ไฟ'],pyro:['🔥','ไฟ (Pyro)'],ice:['❄','น้ำแข็ง'],frost:['❄','น้ำแข็ง (Frost)'],storm:['ϟ','สายฟ้า'],earth:['⛰','ดิน'],nature:['❦','ธรรมชาติ'],hex:['☠','คำสาป'],summon:['✺','อัญเชิญ']};
function stLibRender(){const box=$st('stLibList');if(!box)return;const q=($st('stSearch').value||'').toLowerCase();box.innerHTML='';const groups={};
  for(const n of Object.keys(ST.list).sort()){const e=ST.list[n];if(q&&!(n+' '+(e.desc||'')+' '+(e.tags||[]).join(' ')).toLowerCase().includes(q))continue;const g=n.includes('/')?n.slice(0,n.lastIndexOf('/')):'(ราก)';(groups[g]=groups[g]||[]).push(n);}
  const shut=ST.shut||(ST.shut=stLoad('wd_studio_shut',{})),order=Object.keys(groups).sort((a,b)=>a==='start'?-1:b==='start'?1:a.localeCompare(b));
  for(const g of order){const [ic,lab]=ST_GRP[g]||['✦',g],closed=!q&&shut[g]&&!groups[g].includes(ST.name);
    box.append(h('button',{className:'grp'+(closed?' shut':''),title:'คลิกเพื่อพับ / กางกลุ่ม '+g,on:{click:()=>{shut[g]=!closed;stStore('wd_studio_shut',shut);stLibRender();}}},h('span',{className:'car'},'▾'),lab+(lab!==g?' · '+g:''),h('span',{className:'cnt'},groups[g].length)));
    if(closed)continue;
    for(const n of groups[g]){const e=ST.list[n];box.append(h('button',{className:'it'+(n===ST.name?' on':'')+(e.err?' bad':''),title:n+' — '+(e.desc||'(ไม่มีคำอธิบาย)'),on:{click:()=>stAskOpen(n)}},
      h('span',{className:'ic'},ic),h('span',{className:'nm'},n.slice(n.lastIndexOf('/')+1)),h('small',null,e.err?'⚠ '+e.err:(e.desc||'—'))));}}
  if(!order.length)box.append(h('p',{className:'mute',style:'padding:8px'},'ไม่พบ "'+q+'"'));}
function stAskOpen(n){if(n===ST.name)return;if(ST.dirty)stBanner('ยังไม่ได้บันทึก '+(ST.name||'(ใหม่)'),[['ทิ้งแล้วเปิด '+n,()=>stOpen(n)],['บันทึกก่อน',async()=>{if(await stSave(false))stOpen(n);}]]);else stOpen(n);}
// ---------- ไทม์ไลน์ ----------
function stTlTime(){const D=stDur()+ST.tail;$st('stTime').textContent=ST.t.toFixed(2)+' / '+stDur().toFixed(2)+' วิ';const f=Math.min(1,ST.t/D),ph=$st('stPh');if(ph)ph.style.left=f*100+'%';
  const pa=$st('stPhAll'),ru=$st('stRuler');if(pa&&ru)pa.style.left=(ru.offsetLeft+ru.offsetWidth*f)+'px';}
function stTlRender(){const R=$st('stRows');if(!R||!ST.fx)return;const sc=R.scrollTop;R.innerHTML='';const D=stDur()+ST.tail,F=ST.fx,step=D>6?1:D>2.5?0.5:D>1.2?0.25:0.1,gs='--gs:'+(step/D*100)+'%';
  R.append(h('div',{className:'stName head'+(ST.sel===null?' on':''),title:'ตั้งค่าทั้งไฟล์: คำอธิบาย ธาตุ ความยาว ผลตรวจ และผูกกับท่าในเกม',on:{click:()=>{ST.sel=null;stTlRender();stInspRender();}}},h('span',{className:'nm'},'⚙ ตั้งค่าไฟล์ / ผูกกับท่า'),h('span',{className:'ty'},F.layers.length+' ชั้น')));
  const ru=h('div',{className:'stTrack ruler',id:'stRuler',title:'คลิกหรือลาก = เลื่อนหัวเล่นไปเวลานั้น'});
  for(let s=0;s<=D+1e-6;s+=step)ru.append(h('span',{className:'stTick',style:'left:'+(s/D*100)+'%'},String(+s.toFixed(2))));
  ru.append(h('div',{className:'end',style:'left:'+(stDur()/D*100)+'%'}),h('div',{className:'stPh',id:'stPh'}));
  const seekAt=(e,el)=>{const b=el.getBoundingClientRect();ST.play=false;ST.seekTo=Math.max(0,Math.min(D,(e.clientX-b.left)/b.width*D));stSync();};
  const scrub=el=>el.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('.stSeg'))return;seekAt(e,el);el.setPointerCapture(e.pointerId);const mv=ev=>seekAt(ev,el),up=()=>{el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);};el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);});
  scrub(ru);R.append(ru);
  const errAt=new Set(ST.lint.filter(r=>r.lv==='err'||r.lv==='warn').map(r=>String(r.at).split('.')[0]));
  F.layers.forEach((L,i)=>{const g=k=>L[k]!==undefined?L[k]:stDef(L,k),num=v=>typeof v==='number'?v:Array.isArray(v)?+v[1]||0:0,T=FXR.schema.types[L.t]||{},col=TYPEC[L.t]||'#d9b45a',muted=!!ST.mute[L.id],solo=ST.solo===L.id;
    const grip=h('span',{className:'grip',title:'ลากขึ้น/ลงเพื่อเรียงลำดับชั้น'},'⋮⋮');
    const nm=h('div',{className:'stName'+(ST.sel===L.id?' on':''),'data-id':L.id,'data-i':i,style:'--c:'+col,title:(T.th||L.t)+' — ดับเบิลคลิกชื่อ = เปลี่ยนชื่อ • คลิกขวา = เมนู',
        on:{click:e=>{if(e.target.closest('button,input'))return;ST.sel=L.id;stTlRender();stInspRender();},contextmenu:e=>{e.preventDefault();stLayerMenu(L,i,e.clientX,e.clientY);},dblclick:e=>{if(e.target.closest('.nm')&&!e.target.closest('input'))stRename(L.id);}}},
      grip,h('span',{className:'nm'+(errAt.has(L.id)?' bad':'')},(T.icon||'')+' '+L.id),h('span',{className:'ty'},L.t+(L.shape?':'+L.shape:'')),
      h('span',{className:'act'+(muted||solo?' pin':'')},
        h('button',{title:muted?'แสดงชั้นนี้ (H)':'ซ่อนชั้นนี้ชั่วคราว (H)',className:muted?'on':'',on:{click:()=>stMuteT(L.id)}},muted?'◌':'👁'),
        h('button',{title:'เล่นชั้นนี้ชั้นเดียว (solo)',className:solo?'on':'',on:{click:()=>stSoloT(L.id)}},'S'),
        h('button',{title:'เมนูของชั้น (หรือคลิกขวาที่แถว)',on:{click:e=>{const b=e.currentTarget.getBoundingClientRect();stLayerMenu(L,i,b.left,b.bottom+2);}}},'⋯')));
    stGripDrag(grip,i);
    const tr=h('div',{className:'stTrack',style:gs}),sg=h('div',{className:'stSeg'+(ST.sel===L.id?' on':'')+(g('loop')?' loop':'')+(muted||(ST.solo&&!solo)?' off':''),style:'--c:'+col,title:L.id+' — ลาก = เลื่อนเวลาเริ่ม • ลากขอบขวา = ยืดอายุ'},h('span',{className:'lb'},L.id)),rh=h('span',{className:'rh',title:'ลากเพื่อยืด / หดอายุของชั้น'});
    const place=()=>{sg.style.left=(num(g('at'))/D*100)+'%';sg.style.width=(Math.max(0.02,g('loop')?D-num(g('at')):num(g('life')))/D*100)+'%';};place();sg.append(rh);tr.append(sg);scrub(tr);
    sg.addEventListener('contextmenu',e=>{e.preventDefault();stLayerMenu(L,i,e.clientX,e.clientY);});
    const editable=typeof g('at')==='number'&&typeof g('life')==='number';
    sg.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();const was=ST.sel;ST.sel=L.id;if(!editable){stTlRender();stInspRender();return;}const b=tr.getBoundingClientRect(),x0=e.clientX,at0=g('at'),lf0=g('life'),rs=e.target===rh;let moved=false;sg.setPointerCapture(e.pointerId);
      const mv=ev=>{if(!moved&&Math.abs(ev.clientX-x0)<3)return;if(!moved){moved=true;stPush();}const d=(ev.clientX-x0)/b.width*D;if(rs)L.life=+Math.max(0.02,lf0+d).toFixed(2);else L.at=+Math.max(0,at0+d).toFixed(2);place();ST.dirty=true;stHint((rs?'อายุ ':'เริ่ม ')+(rs?L.life:L.at).toFixed(2)+' วิ');};
      const up=()=>{sg.removeEventListener('pointermove',mv);sg.removeEventListener('pointerup',up);if(moved)stChanged(true);else if(was!==L.id){stTlRender();stInspRender();}};sg.addEventListener('pointermove',mv);sg.addEventListener('pointerup',up);});
    R.append(nm,tr);});
  if(!F.layers.length)R.append(h('div',{className:'mute',style:'grid-column:1/-1;padding:18px;text-align:center'},'ยังไม่มีชั้น — กด ',h('b',null,'＋ เพิ่มชั้น'),' (หรือ Shift+A) เพื่อเริ่ม'));
  R.append(h('div',{id:'stPhAll',style:'height:'+R.scrollHeight+'px'}));R.scrollTop=sc;
  stTlTime();}
function stGripDrag(g,i){g.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();g.setPointerCapture(e.pointerId);const rows=[...document.querySelectorAll('#stRows .stName[data-i]')];rows[i].classList.add('drag');let to=i;
  const mv=ev=>{rows.forEach(r=>r.classList.remove('dropA','dropB'));const r=rows.find(r=>{const b=r.getBoundingClientRect();return ev.clientY>=b.top&&ev.clientY<b.bottom;});if(!r)return;const b=r.getBoundingClientRect(),j=+r.dataset.i,below=ev.clientY>b.top+b.height/2;r.classList.add(below?'dropB':'dropA');to=below?j+1:j;};
  const up=()=>{g.removeEventListener('pointermove',mv);g.removeEventListener('pointerup',up);rows.forEach(r=>r.classList.remove('dropA','dropB','drag'));const j=to>i?to-1:to;if(j!==i){stPush();const A=ST.fx.layers,[x]=A.splice(i,1);A.splice(j,0,x);stChanged(true);}};
  g.addEventListener('pointermove',mv);g.addEventListener('pointerup',up);});}
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
// ส่วนพับได้ (จำว่าเปิด/ปิดไว้) + ช่องค้นหาค่า
function stSec(key,title,kids,sub,defOpen){const o=ST.open||(ST.open=stLoad('wd_studio_open',{}));
  const d=h('details',{open:o[key]!==undefined?o[key]:defOpen!==false},h('summary',null,title,sub?h('small',null,sub):null),h('div',{className:'in'},...kids));
  d.addEventListener('toggle',()=>{if(ST.finding)return;o[key]=d.open;stStore('wd_studio_open',o);});return d;}
function stFind(P){const flt=()=>{const s=(ST.find||'').trim().toLowerCase();P.querySelectorAll('.stF').forEach(f=>f.classList.toggle('hide',!!s&&!(f.dataset.q||'').toLowerCase().includes(s)));
    if(s){ST.finding=true;P.querySelectorAll('details').forEach(d=>d.open=true);setTimeout(()=>ST.finding=false,0);}};
  const inp=h('input',{type:'search',placeholder:'🔍 หาค่าที่จะแก้ เช่น ขนาด, สี, size',value:ST.find||'',title:'พิมพ์ชื่อค่า (ไทยหรืออังกฤษ) เพื่อกรองเฉพาะค่าที่ต้องการ',on:{input:e=>{ST.find=e.target.value;flt();}}});
  inp._key=e=>{if(e.key==='Escape'){inp.value='';ST.find='';flt();}};setTimeout(flt,0);return h('div',{className:'find'},inp);}
function stInspRender(){const P=$st('stInsp');if(!P||!ST.fx)return;const same=P._sel===ST.sel,sc=P.scrollTop;P._sel=ST.sel;P.innerHTML='';const S=FXR.schema;
  const lint=h('div',{className:'stLint'});
  if(ST.sel===null){const F=ST.fx;
    P.append(h('div',{className:'stCard'},h('i',null,'⚙'),h('b',null,ST.name||'(ใหม่ ยังไม่บันทึก)'),h('span',null,'ตั้งค่าทั้งไฟล์ • '+F.layers.length+' ชั้น • ยาว '+stDur().toFixed(2)+' วิ')),stFind(P));
    for(const r of ST.lint)lint.append(h('div',{className:r.lv},h('span',null,r.lv==='err'?'✗':'⚠'),h('span',null,(r.at?r.at+': ':'')+r.msg)));if(!ST.lint.length)lint.append(h('div',{className:'ok'},'✓ fx-check ผ่าน ไม่มีปัญหา'));
    P.append(stSec('f:main','ข้อมูลเอฟเฟกต์',['desc','pal','dur','k','seed'].map(k=>stField(null,F,k,S.file[k]))),
      stSec('f:lint','ตรวจไฟล์ (fx-check)',[lint],ST.lint.length?ST.lint.length+' เรื่อง':'ผ่าน'),
      stSec('f:bind','ผูกกับท่าในเกม (bind.json)',[stBindPanel()]),
      stSec('f:more','แท็ก / ค่าที่เกมส่งมา (params)',['tags','params'].map(k=>stField(null,F,k,S.file[k])),'ขั้นสูง',false));
    if(same)P.scrollTop=sc;return;}
  const L=ST.fx.layers.find(x=>x.id===ST.sel);if(!L){ST.sel=null;return stInspRender();}const T=S.types[L.t];
  const n=v=>typeof v==='number'?v.toFixed(2):Array.isArray(v)?v.join('–'):'สูตร',at=L.at!==undefined?L.at:stDef(L,'at'),life=L.life!==undefined?L.life:stDef(L,'life');
  P.append(h('div',{className:'stCard',style:'--c:'+(TYPEC[L.t]||'#4a8cff')},h('i',null,T.icon||'•'),h('b',null,L.id),h('span',null,T.th+' · '+L.t+' • เริ่ม '+n(at)+' วิ • อายุ '+(L.loop?'วนเรื่อย ๆ':n(life)+' วิ'))),h('p',{className:'desc'},T.desc),stFind(P));
  for(const r of ST.lint.filter(r=>String(r.at).split('.')[0]===L.id))lint.append(h('div',{className:r.lv},h('span',null,r.lv==='err'?'✗':'⚠'),h('span',null,r.msg+(String(r.at).includes('.')?' ('+String(r.at).split('.')[1]+')':''))));
  if(lint.childNodes.length)P.append(h('div',{className:'pad'},lint));
  const main=[stField(L,L,'id',S.common.id)];if(L.t==='mesh')main.push(stShapePicker(L));
  for(const k in T.fields){if(L.t==='mesh'&&k==='shape')continue;if(!stShowField(L,k))continue;main.push(stField(L,L,k,T.fields[k]));}
  P.append(stSec('l:main','ค่าของ'+T.th,main,L.t),
    stSec('l:com','เวลา / ตำแหน่ง / เงื่อนไข',['at','life','loop','end','att','pos','yaw','x','near','own'].map(k=>stField(L,L,k,S.common[k]))),
    stSec('l:json','JSON ของชั้นนี้',[stJsonBox(L)],'ขั้นสูง',false));
  if(same)P.scrollTop=sc;}
// ซ่อนฟิลด์ที่ไม่เกี่ยวกับรูปทรง/วัสดุที่เลือก (ให้แผงสั้น อ่านง่าย)
function stShowField(L,k){if(L.t!=='mesh'&&L.t!=='emit'&&L.t!=='trail')return true;const g=q=>L[q]!==undefined?L[q]:stDef(L,q);
  if(L.t==='mesh'){const sh=g('shape'),mt=g('mat');if(k==='glb')return sh==='glb';if(k==='model')return sh==='model';if(k==='inner')return sh==='ring'||sh==='torus';if(k==='n')return sh==='spikes';if(k==='wk')return sh==='crescent'||sh==='ribbon';
    if(k==='prof')return sh==='lathe';if(k==='path')return sh==='ribbon';if(['heat','disp','flow','mode'].includes(k))return mt==='fire';if(k==='tex')return mt==='flip'||mt==='tex';if(k==='uvTile'||k==='uvScroll')return mt==='tex';if(['grow','stagger','growBy'].includes(k))return sh==='model';if(k==='scroll')return mt==='energy'||mt==='fire'||mt==='ice';if(k==='rim')return mt==='energy'||mt==='fire'||mt==='ice'||mt==='tex';if(k==='col2')return mt==='energy'||mt==='solid'||mt==='tex';}
  if(L.t==='emit'){if(['model','mmat','msize','bounce','mspin'].includes(k))return g('look')==='model';if(k==='of')return g('from')==='mesh';if(k==='fh')return ['cone','box','line'].includes(g('from'));if(k==='spread')return ['up','down','aim'].includes(g('dir'))||g('from')==='cone';}
  if(L.t==='trail'){if(['a0','a1','r','r0','tilt'].includes(k))return !!g('sweep');if(k==='of')return !g('sweep');}
  return true;}
function stShapePicker(L){const cur=L.shape||'sphere';return h('div',{className:'stF'},h('label',null,'รูปทรง',h('small',null,'shape')),h('div',{className:'stShapes'},...FXR.schema.shapes.map(k=>{const b=h('button',{className:k===cur?'on':'',title:k,on:{click:()=>{stPush();L.shape=k;stChanged(true);}}});b.innerHTML='<svg viewBox="0 0 24 18" fill="currentColor" stroke="currentColor">'+(SHAPE_SVG[k]||'')+'</svg>'+k;return b;})));}
function stJsonBox(L){const ta=h('textarea',{value:JSON.stringify(L,null,1),spellcheck:false,style:'width:100%;min-height:120px;font:11px var(--fu)'});
  return h('div',{className:'stF'},ta,h('button',{on:{click:()=>{try{const v=JSON.parse(ta.value);stPush();Object.keys(L).forEach(k=>delete L[k]);Object.assign(L,v);ST.sel=L.id;stChanged(true);}catch(e){stToast('JSON ผิด: '+e.message);}}}},'ใช้ JSON นี้'));}
const isCurveV=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).some(k=>k.trim()!==''&&!isNaN(+k));
function stField(L,obj,k,sp){if(!sp)return h('span');const cur=obj[k],v=cur!==undefined?cur:sp.def,lab=h('label',{title:sp.desc||''},sp.th||k,h('small',null,k+(cur===undefined?' · ค่าเริ่ม':'')));const box=h('div',{className:'stF'+(cur!==undefined?' set':''),'data-q':(sp.th||'')+' '+k+' '+(sp.desc||'')},lab);
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
    case 'str':{const dl='stDL_'+k;const inp=h('input',{type:'text',value:v||'',list:dl,on:{focus:stPush,change:e=>set(e.target.value,true)}});const opts=k==='fx'?Object.keys(ST.list):k==='glb'?Object.keys((MODELS.man||{}).models||{}).filter(n=>n.startsWith('mesh_')||n.startsWith('vfx_')):k==='name'?Object.keys(SFXN):k==='tex'?[...Object.keys(MK.list.tex).map(n=>'tex/'+n),...Object.keys((MODELS.man||{}).fx||{}),...Object.keys((MODELS.man||{}).ptex||{})]:k==='fb'?[...Object.keys(MK.list.tex).map(n=>'tex/'+n),'smoke','fire']:k==='model'?Object.keys(MK.list.mesh):k==='fn'?Object.keys(FXCODE):k==='of'?ST.fx.layers.map(x=>x.id):[];
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
function stBindPanel(){const box=h('div');let bind=null;
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
function stHelp(){if(document.querySelector('#st .stModal.help'))return;const m=h('div',{className:'stModal help',on:{click:e=>{if(e.target===m)m.remove();}}});
  const K=(...ks)=>h('span',null,...ks.flatMap((k,i)=>i?[' ',h('kbd',null,k)]:[h('kbd',null,k)])),row=(t,...ks)=>h('div',null,h('span',null,t),K(...ks));
  m.append(h('div',{className:'box',style:'max-width:760px'},h('div',{style:'display:flex;justify-content:space-between;align-items:center;gap:8px'},h('h3',null,'วิธีใช้ VFX Studio'),h('button',{on:{click:()=>m.remove()}},'ปิด (Esc)')),
    h('p',{style:'margin:0'},h('a',{href:'manual/index.html',target:'_blank',style:'color:var(--acc2);font-size:14px'},'📖 เปิดคู่มือแบบมีรูป (ภาษาไทย)')),
    h('div',{style:'display:grid;gap:5px;font-size:12.5px;color:var(--tx2)'},...[
      '1. เลือกเอฟเฟกต์ทางซ้าย หรือกด ＋ ใหม่ เพื่อเริ่มจากแม่แบบ',
      '2. ไทม์ไลน์ด้านล่าง: แต่ละแถว = 1 ชั้น • ลากแถบสี = เลื่อนเวลาเริ่ม • ลากขอบขวา = ยืดอายุ • ลาก ⋮⋮ = เรียงลำดับ • คลิกขวา = เมนู',
      '3. แผงขวา: แก้ค่าของชั้นที่เลือก • ∿ = เปลี่ยนตามเวลา • ↔ = สุ่มในช่วง • ↺ = กลับค่าเริ่ม • จุดส้มหน้าชื่อ = ค่าที่แก้ไปแล้ว • ช่อง 🔍 หาค่าได้',
      '4. ตัวเลขมุมขวาบนของจอ: ขาวจ้า ≤ 8%, บังตัว ≤ 35% (สีส้ม = เกิน ต้องลดความสว่าง)',
      '5. 💾 บันทึก → 🎮 ลองในเกม • ผูกถาวรที่ ⚙ ตั้งค่าไฟล์ → ผูกกับท่าในเกม',
      '• ลากเส้นขอบแผงเพื่อปรับขนาด ดับเบิลคลิกเส้นขอบ = พับแผงเก็บ • ชี้เมาส์ที่ปุ่มไหนก็ได้ แถบล่างสุดจะบอกว่าปุ่มนั้นทำอะไร'].map(t=>h('p',{style:'margin:0'},t))),
    h('div',{className:'stKeys'},h('h4',null,'เล่น / ดู'),row('เล่น / หยุด','Space'),row('เล่นใหม่ตั้งแต่ต้น','R'),row('ทีละเฟรม','←','→'),row('ทีละ 0.1 วิ','Shift','←'),row('กลับจุดเริ่ม','Home'),row('วนเล่น','L'),
      row('มุมกล้อง: เกม / ข้าง / หน้า / บน / หมุนเอง','1','–','5'),row('หมุนกล้อง / ซูม','ลากจอ','ล้อเมาส์'),
      h('h4',null,'แก้ชั้น'),row('เพิ่มชั้น','Shift','A'),row('เลือกชั้นบน / ล่าง','↑','↓'),row('เปลี่ยนชื่อชั้น','F2'),row('ทำซ้ำชั้น','Ctrl','D'),row('ซ่อนชั้นชั่วคราว','H'),row('ลบชั้น','Delete'),row('เลิกเลือก / ปิดเมนู','Esc'),
      h('h4',null,'ไฟล์'),row('บันทึก','Ctrl','S'),row('บันทึกเป็นชื่อใหม่','Ctrl','Shift','S'),row('ย้อนกลับ','Ctrl','Z'),row('ทำซ้ำ','Ctrl','Y'),row('หน้านี้','?')),
    h('p',{className:'mute',style:'margin:0;font-size:11.5px'},'แท็บ 🧊 โมเดล = ปั้นโมเดลของเอฟเฟกต์ • 🎞 ภาพ = วาดภาพ/flipbook • 🔥 ไฟ 3D = จำลองไฟ (กด ? ในแท็บนั้นดูวิธีใช้) • บันทึกตรงลงโปรเจกต์ต้องเปิดผ่าน VFX Studio.bat')));
  $st('st').append(m);m.tabIndex=-1;m.focus();m.addEventListener('keydown',e=>{if(e.key==='Escape')m.remove();});}
// ---------- API สำหรับ Claude / console ----------
window.STUDIO={load:n=>stOpen(n),data:()=>ST.fx,name:()=>ST.name,
  set(path,v){const [id,...ks]=path.split('.');const L=id==='file'?ST.fx:ST.fx.layers.find(x=>x.id===id);if(!L)return false;let o=L;for(let i=0;i<ks.length-1;i++)o=o[ks[i]];stPush();o[ks[ks.length-1]]=v;stChanged(true);return true;},
  play(){ST.play=true;stRestart();stSync();},pause(){ST.play=false;stSync();},seek:t=>{ST.play=false;stSeek(t);stSync();return ST.met;},sheet:(ts,save)=>stSheet(ts,save),
  add:t=>(stAddLayer(t),ST.sel),select:id=>{ST.sel=id;stTlRender();stInspRender();},del:id=>stDelLayer(id),undo:()=>stUndo(false),redo:()=>stUndo(true),newFx:(n,tpl,pal)=>stNew(n,tpl,pal),
  metrics:()=>Object.assign({},ST.met,{run:ST.run,lint:ST.lint}),save:as=>stSave(as),shot:n=>stShot(n),cam:c=>{ST.cam=c;stSync();},at:a=>{ST.at=a;stRestart();},lint:()=>(stLintRun(),ST.lint),state:ST};
stBoot();
