// =====================================================================
//  ตัววัดประสิทธิภาพบนจอ (ผู้ใช้ 2026-11-05: "อยากได้ตัววัดอื่น ๆ เพิ่ม เอาไว้เก็บข้อมูล optimize + กราฟ FPS เปิดในการตั้งค่า")
//  เปิดในตั้งค่า → ภาพ: SET.fpsg = กราฟเวลาเฟรม (ms) / SET.stats = แผงข้อมูลละเอียด • SET.fps (ข้อความ FPS เดิม) ยังอยู่
//  กราฟ: แท่งละเฟรม 240 เฟรมล่าสุด, เส้น 16.7 ms (60) / 33 ms (30), แท่งเหลือง/แดง = เฟรมช้า, ส่วนล่างสีฟ้า = เวลา CPU
//  แผง: FPS เฉลี่ย / 1% ต่ำสุด / เฟรมช้าสุด, CPU (เกม+สั่งวาด) แยกเวลาโฮสต์คำนวณ, draw call / สามเหลี่ยม (รวมทุก pass),
//  shader / geometry / texture, หน่วยความจำ JS (Chrome), ความละเอียด + ระดับกราฟิก, จำนวนอนุภาค/เอฟเฟกต์/คน/ศัตรู/กระสุน, เน็ต
//  ปุ่ม 📋 คัดลอกค่าปัจจุบันเป็นข้อความ (วางให้ Claude ดูได้เลย) • F3 = เปิด/ปิดแผงเร็ว ๆ
// =====================================================================
const PERF={N:240,ft:new Float32Array(240),cpu:new Float32Array(240),i:0,n:0,host:0,hostAcc:0,
  last:0,netTime:0,netSample:null,netRate:null,txt:'',txtT:0,el:null,cv:null,pan:null,calls:0,tris:0};
function perfNetSample(){
  return PERF.netSample||(PERF.netSample={sent:0,received:0,bytes:0,trimmed:0,gap:0,lastReceive:0,queued:0});
}
function perfNetSend(bytes,trimmed){
  const sample=perfNetSample();sample.sent++;sample.bytes+=bytes;if(trimmed)sample.trimmed++;
  for(const conn of NET.conns.values())if(conn.open){
    sample.queued=Math.max(sample.queued,conn.dataChannel?.bufferedAmount||0);
  }
}
function perfNetReceive(){
  const sample=perfNetSample(),now=performance.now();
  if(sample.lastReceive)sample.gap=Math.max(sample.gap,now-sample.lastReceive);
  sample.lastReceive=now;sample.received++;
}
function perfNetFrame(now){
  if(!SET.stats||!NET.online||screen!=='game'){
    PERF.netTime=0;PERF.netSample=PERF.netRate=null;return;
  }
  if(!PERF.netTime)PERF.netTime=now;
  const seconds=(now-PERF.netTime)/1000;
  if(seconds<1)return;
  const sample=perfNetSample();
  const gap=Math.max(sample.gap,sample.lastReceive?now-sample.lastReceive:0);
  PERF.netRate={...sample,gap,sent:sample.sent/seconds,received:sample.received/seconds,kb:sample.bytes/1024/seconds};
  PERF.netTime=now;PERF.netSample=null;perfNetSample().lastReceive=sample.lastReceive;
}
// Freeze log (user 2026-11-23: online 1–3 s freezes every few tens of seconds) — always on, cheap. Shown in F3 + 📋 copy.
//  f = this PC's frame stalled (cpu/shader/geometry/heap delta tell why) • r = guest got no snapshot • i = host got no input from a guest
//  q = host send queue to a guest backed up (snapshot skipped)
const FRZ={L:[],hid:0,pf:0,pg:0,ge:0,tx:0,hp:0,lr:0,MIN:400};
addEventListener('visibilitychange',()=>{FRZ.hid=performance.now();});
function frzAdd(k,ms,info){
  const e={t:new Date().toTimeString().slice(0,8),k,ms:Math.round(ms),info};FRZ.L.push(e);if(FRZ.L.length>12)FRZ.L.shift();
  console.warn('[freeze]',k,e.ms+'ms',info);}
function frzOk(){return screen==='game'&&!document.hidden&&performance.now()-FRZ.hid>1500;}
function frzFrame(gap){
  const I=gl.info,pg=I.programs?I.programs.length:0,ge=I.memory.geometries,tx=I.memory.textures,hp=performance.memory?performance.memory.usedJSHeapSize:0;
  if(gap>FRZ.MIN&&FRZ.pf<100&&frzOk())frzAdd('f',gap,`cpu ${QUAL.cpu.toFixed(0)}ms shader+${pg-FRZ.pg} geo${ge-FRZ.ge>=0?'+':''}${ge-FRZ.ge} tex+${tx-FRZ.tx}`+(hp&&FRZ.hp?` heap ${((hp-FRZ.hp)/1048576).toFixed(0)}MB`:''));
  FRZ.pg=pg;FRZ.ge=ge;FRZ.tx=tx;FRZ.hp=hp;FRZ.pf=gap;shwFrame(gap);}
// Mid-match shader watch (guides/PRELOAD-STANDARD.md §3c): every program three creates after the match is warmed is a freeze
// that preload missed. Logged with its recipe difference from the nearest older program and the objects using it.
// Armed in 'play' once the warm queue is empty (+1.5 s). Dev mode (?dev=1) also toasts. WD.SHW.L = list (bench gate reads it).
const SHW={L:[],seen:new WeakSet(),len:0,play:0,armed:false,n:0};
function shwDiff(pg){const a=pg.cacheKey.split(',');let best=null,bd=1e9;
  for(const q of gl.info.programs){if(q===pg)continue;const b=q.cacheKey.split(',');if(b.length!==a.length)continue;let d=0;for(let i=0;i<a.length&&d<bd;i++)if(a[i]!==b[i])d++;if(d<bd){bd=d;best=b;}}
  if(!best)return 'new shape';
  return a.map((v,i)=>v!==best[i]?i+':'+String(best[i]).slice(0,28)+'>'+String(v).slice(0,28):null).filter(Boolean).slice(0,6).join(' ');}
function shwPath(o){const n=[];for(let q=o,k=0;q&&k<5;q=q.parent,k++)n.push(q.name||q.type);return n.reverse().join('>');}
// material signature for the first user: side / transparent / fog / colour / opacity / userData keys (finds who made it)
function shwSig(m){try{return 's'+m.side+(m.transparent?' tr':'')+(m.fog===false?' nofog':'')+(m.color?' #'+m.color.getHexString():'')+(m.opacity<1?' op'+m.opacity.toFixed(2):'')+(Object.keys(m.userData).length?' ud:'+Object.keys(m.userData).join('/'):'');}catch(e){return '';}}
function shwWho(pg){const out=[];
  for(const sc of [scene,fxScene])sc.traverse(o=>{if(out.length>=3||!o.material)return;
    for(const m of [].concat(o.material)){const pr=m&&gl.properties.get(m);if(!pr)continue;
      if(pr.currentProgram===pg||(pr.programs&&[...pr.programs.values()].includes(pg))){out.push((sc===fxScene?'fx:':'')+shwPath(o)+(o.isInstancedMesh?'{IM '+o.count+'/'+o.instanceMatrix.count+(o.instanceColor?' col':'')+' '+(o.geometry.type||'')+' v'+(o.geometry.attributes.position?o.geometry.attributes.position.count:0)+(o.name?' '+o.name:'')+'}':'')+' ['+(m.name||m.type)+(out.length?'':' '+shwSig(m))+']');break;}}});
  return out.length?out:['(not in scene: shadow/depth or already gone)'];}
// diagnosis: an older program with the exact same GLSL = the program key changed although the shader did not
// (e.g. a ShaderMaterial source id was dropped and handed out again) • returns how its key differs, '' = really new GLSL
function shwHead(pg){try{const c=gl.getContext(),sh=c.getAttachedShaders(pg.program)||[];return sh.map(x=>{const t=c.getShaderSource(x),i=t.indexOf('void main');return t.slice(Math.max(0,i-220),i+60).replace(/\s+/g,' ');}).join(' ‖ ');}catch(e){return '';}}   // ShaderMaterial: start of its own GLSL (find the owner)
function shwSrc(pg){const c=gl.getContext(),sh=c.getAttachedShaders(pg.program)||[];return sh.map(x=>c.getShaderSource(x)).join('');}
function shwSame(pg,L){try{const s=shwSrc(pg);for(const q of L){if(q===pg||!SHW.seen.has(q))continue;if(shwSrc(q)===s){const a=pg.cacheKey.split(','),b=q.cacheKey.split(',');const d=[];for(let i=0;i<Math.max(a.length,b.length)&&d.length<3;i++)if(a[i]!==b[i])d.push(i+':'+String(b[i]).slice(0,20)+'>'+String(a[i]).slice(0,20));return d.join(' ')||'identical key';}}}catch(e){}return '';}
function shwFrame(gap){
  const L=gl.info.programs;if(!L)return;
  const play=screen==='game'&&G&&G.ph==='play';
  if(!play){SHW.play=0;SHW.armed=false;}else if(!SHW.play)SHW.play=performance.now();
  if(play&&!SHW.armed&&!WARM.busy&&!WARM.q.length&&performance.now()-SHW.play>1500)SHW.armed=true;
  if(L.length===SHW.len)return;
  SHW.len=L.length;
  for(const pg of L){if(SHW.seen.has(pg))continue;SHW.seen.add(pg);
    if(!SHW.armed)continue;
    const e={t:new Date().toTimeString().slice(0,8),ms:Math.round(gap),name:pg.name||'?',diff:shwDiff(pg),who:shwWho(pg),key:pg.cacheKey,same:shwSame(pg,L),src:/^\d/.test(pg.cacheKey)?shwHead(pg):''};
    if(e.same)e.who[0]+=' ⟨same source as an older program: '+e.same+'⟩';
    SHW.n++;SHW.L.push(e);if(SHW.L.length>40)SHW.L.shift();
    console.warn('[shader mid-match]',e.ms+'ms',e.name,e.diff,e.who.join(' | '));
    if(DEV.on)toast('⚠ shader ใหม่กลางแมตช์ '+e.ms+'ms: '+e.name+' — '+e.who[0]);}}
function frzRecv(){const n=performance.now();
  if(FRZ.lr&&n-FRZ.lr>FRZ.MIN&&frzOk())frzAdd('r',n-FRZ.lr,`ping ${NET.rtt?Math.round(NET.rtt):'-'}ms`);FRZ.lr=n;}
function frzIn(c,p){const n=performance.now();
  if(c._lin&&n-c._lin>FRZ.MIN&&frzOk())frzAdd('i',n-c._lin,p.name||c.peer);c._lin=n;}
function frzNote(k,q,c){const n=performance.now();
  if(c._lq&&n-c._lq<1500){c._lqMax=Math.max(c._lqMax||0,q);c._lq=n;const e=c._lqE;if(e){e.info=`${(c._lqMax/1024).toFixed(0)}KB ${c._lqName}`;e.ms=Math.round(n-c._lq0);}return;}
  const p=G&&G.players[c.pid||c.peer];c._lqName=p?p.name:c.peer;c._lq=c._lq0=n;c._lqMax=q;
  frzAdd(k,0,`${(q/1024).toFixed(0)}KB ${c._lqName}`);c._lqE=FRZ.L[FRZ.L.length-1];}
const FRZ_NAME={f:'เครื่องนี้ค้าง',r:'ไม่ได้รับข้อมูลจากโฮสต์',i:'ไม่ได้รับปุ่มจาก',q:'คิวส่งเต็ม (ข้าม snapshot)'};
function frzRows(){return FRZ.L.slice(-6).map(e=>`${e.t} ${FRZ_NAME[e.k]} ${e.ms?e.ms+' ms ':''}(${e.info})`).join(' • ');}
// เรียกจาก frame() (js/37) ทุกเฟรม: dt = เวลาเฟรม (วิ), cpu = ms ที่ JS ใช้ในเฟรมนี้, host = ms ที่โฮสต์คำนวณเกม
function perfFrame(dt,cpu,host){
  const on=!!(SET.fpsg||SET.stats);
  if(gl.info.autoReset===on)gl.info.autoReset=!on;   // นับ draw call ของทุก pass ในเฟรม (ปกติ three รีเซ็ตทุก render() → เห็นแค่ pass สุดท้าย)
  if(!on){if(PERF.netTime)perfNetFrame(0);if(PERF.el)PERF.el.style.display='none';PERF.last=0;return;}
  const tn=performance.now();
  if(SET.stats||PERF.netTime)perfNetFrame(tn);
  const R=gl.info.render;PERF.calls=R.calls;PERF.tris=R.triangles;gl.info.reset();
  const ft=PERF.last?tn-PERF.last:dt*1000;PERF.last=tn;   // เวลาจริง (dt ของเกมถูกตัดที่ 50 ms)
  const i=PERF.i;PERF.ft[i]=ft;PERF.cpu[i]=cpu;PERF.i=(i+1)%PERF.N;PERF.n=Math.min(PERF.N,PERF.n+1);
  PERF.host=PERF.host*0.9+host*0.1;
  perfDom();PERF.el.style.display='block';PERF.el.style.top=SET.fps?'28px':'8px';
  PERF.cv.style.display=SET.fpsg?'block':'none';PERF.pan.style.display=SET.stats?'block':'none';
  if(SET.fpsg)perfGraph();
  if(SET.stats){PERF.txtT-=dt;if(PERF.txtT<=0){PERF.txtT=0.25;perfPanel();}}
}
function perfDom(){if(PERF.el)return;
  const el=document.createElement('div');el.id='perfHud';
  el.innerHTML='<canvas width="240" height="70"></canvas><div class="pp"></div>';document.body.appendChild(el);
  PERF.el=el;PERF.cv=el.querySelector('canvas');PERF.pan=el.querySelector('.pp');
  PERF.pan.addEventListener('click',e=>{if(e.target.dataset.pcopy===undefined)return;const t=perfText();
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>{e.target.textContent='✓ คัดลอกแล้ว';},()=>{console.log(t);e.target.textContent='ดูในคอนโซล';});
    setTimeout(()=>{e.target.textContent='📋 คัดลอก';},1500);});}
// ค่าสถิติจากประวัติเวลาเฟรม
function perfStats(){const n=PERF.n,a=[];let s=0,c=0,mx=0;
  for(let k=0;k<n;k++){const v=PERF.ft[k];a.push(v);s+=v;c+=PERF.cpu[k];if(v>mx)mx=v;}
  a.sort((x,y)=>y-x);const lo=a.slice(0,Math.max(1,Math.round(n*0.01)));const p1=lo.reduce((t,v)=>t+v,0)/lo.length;
  return {avg:s/Math.max(1,n),cpu:c/Math.max(1,n),max:mx,fps:1000/Math.max(0.1,s/Math.max(1,n)),low1:1000/Math.max(0.1,p1),slow:a.filter(v=>v>33.4).length};}
function perfGraph(){const cv=PERF.cv,g=cv.getContext('2d'),W=cv.width,H=cv.height,top=50,sc=(H-4)/top;   // แกนตั้ง 0–50 ms
  g.clearRect(0,0,W,H);g.fillStyle='rgba(8,10,20,.62)';g.fillRect(0,0,W,H);
  for(const [ms,col] of [[16.7,'rgba(159,224,160,.55)'],[33.3,'rgba(255,200,90,.55)']]){const y=H-ms*sc;g.fillStyle=col;g.fillRect(0,y,W,1);}
  const n=PERF.n,bw=W/PERF.N;
  for(let k=0;k<n;k++){const j=(PERF.i-n+k+PERF.N)%PERF.N,v=PERF.ft[j],c=Math.min(v,PERF.cpu[j]),x=(PERF.N-n+k)*bw,h=Math.min(H,v*sc);
    g.fillStyle=v>50?'#ff5a4a':v>33.4?'#ffc04a':v>17.5?'#d8e070':'#7fd88a';g.fillRect(x,H-h,Math.max(1,bw-0.2),h);
    g.fillStyle='rgba(110,180,255,.75)';g.fillRect(x,H-Math.min(H,c*sc),Math.max(1,bw-0.2),Math.min(H,c*sc));}
  const S=perfStats();g.font='600 11px Kanit,sans-serif';g.textBaseline='top';g.fillStyle='#000';
  const t=`${S.fps.toFixed(0)} FPS  ${S.avg.toFixed(1)} ms  สูงสุด ${S.max.toFixed(0)}`;g.fillText(t,5,4);g.fillStyle='#e8f4e8';g.fillText(t,4,3);
  g.fillStyle='rgba(232,244,232,.6)';g.font='10px Kanit,sans-serif';g.fillText('60',W-14,H-16.7*sc-11);g.fillText('30',W-14,H-33.3*sc-11);}
// รายการค่าทั้งหมด [หัวข้อ, ค่า] (ใช้ทั้งแผงและปุ่มคัดลอก)
// ชื่อการ์ดจอที่เบราว์เซอร์ใช้จริง — โน้ตบุ๊ก 2 การ์ด (เช่น Radeon ในตัว + RTX) Windows อาจให้ Chrome ใช้การ์ดในตัว = ช้ามาก
//   แก้ฝั่งผู้เล่น: Windows ตั้งค่า → ระบบ → จอแสดงผล → กราฟิก → Chrome → ประสิทธิภาพสูง (มีคำเตือนสีส้มในแผงถ้าเจอการ์ดในตัว)
let _gpuName=null;function gpuName(){if(_gpuName===null){try{const c=gl.getContext(),d=c.getExtension('WEBGL_debug_renderer_info');_gpuName=String(d?c.getParameter(d.UNMASKED_RENDERER_WEBGL):'?').replace(/^ANGLE \(|\)$/g,'').replace(/ Direct3D.*$/,'');}catch(e){_gpuName='?';}}return _gpuName;}
const gpuIntegrated=()=>/Radeon\(TM\) Graphics|Radeon Graphics|Intel|UHD|Iris|Vega|SwiftShader|llvmpipe/i.test(gpuName())&&!/RX |NVIDIA|GeForce|Arc /i.test(gpuName());
function perfRows(){const S=perfStats(),I=gl.info,v=VIEW.cur,mem=performance.memory,px=gl.getPixelRatio(),sz=gl.getSize(new THREE.Vector2());
  const rows=[
    ['เฟรม',`${S.fps.toFixed(0)} FPS • เฉลี่ย ${S.avg.toFixed(1)} ms • 1% ต่ำสุด ${S.low1.toFixed(0)} FPS • ช้าสุด ${S.max.toFixed(0)} ms • เฟรม >33ms ${S.slow}/${PERF.n}`],
    ['การ์ดจอ',gpuName()+(gpuIntegrated()?' <span style="color:#ffa040">⚠ การ์ดจอในตัว — ถ้ามีการ์ดแยก ตั้ง Chrome = ประสิทธิภาพสูง ใน Windows กราฟิก</span>':'')],
    ['CPU',`${S.cpu.toFixed(1)} ms/เฟรม`+(NET.isHost&&screen==='game'?` (โฮสต์คำนวณเกม ${PERF.host.toFixed(1)})`:'')+` • ที่เหลือ ≈ รอการ์ดจอ/เบราว์เซอร์`],
    ['วาด',`${PERF.calls} draw call • ${(PERF.tris/1000).toFixed(0)}k สามเหลี่ยม`],
    ['GPU mem',`${I.programs?I.programs.length:0} shader • ${I.memory.geometries} geometry • ${I.memory.textures} texture`],
    ['ภาพ',`${Math.round(sz.x*px)}×${Math.round(sz.y*px)} px (×${px.toFixed(2)}) • กราฟิก ${GQ_NAME[GQ.p]}${gq('dyn')?' ลดเอง ระดับ '+QUAL.lvl:''}`],
  ];
  if(mem)rows.push(['JS mem',`${(mem.usedJSHeapSize/1048576).toFixed(0)} / ${(mem.jsHeapSizeLimit/1048576).toFixed(0)} MB`]);
  if(screen==='game'&&v){
    rows.push(['ในฉาก',`อนุภาค ${PARTS.length} • เอฟเฟกต์ ${FXR.inst.length} • คน ${v.P.length} • ศัตรู ${v.E.length} • กระสุน ${(v.J||[]).length}`]);
    rows.push(['แผนที่',`${builtMap||'-'} • โหมด ${v.mode||'-'}`]);}
  const net=PERF.netRate;
  if(NET.online&&net)rows.push(['เน็ต',NET.isHost?
    `ส่ง ${net.sent.toFixed(0)} snapshot/วิ • ${net.kb.toFixed(1)} KB/วิ ต่อคน • คิวส่งสูงสุด ${(net.queued/1024).toFixed(1)} KB • ตัดข้อมูล ${net.trimmed} ครั้ง`:
    `รับ ${net.received.toFixed(0)} snapshot/วิ • ช่วงห่างสูงสุด ${net.gap.toFixed(0)} ms • ปิง ${NET.rtt?Math.round(NET.rtt):'-'} ms`]);
  if(FRZ.L.length)rows.push(['ค้างล่าสุด',frzRows()]);
  if(SHW.n)rows.push(['shader กลางแมตช์',`${SHW.n} ตัว • `+SHW.L.slice(-4).map(e=>`${e.ms}ms ${e.name} (${e.who[0]})`).join(' • ')]);
  return rows;}
function perfPanel(){PERF.pan.innerHTML=perfRows().map(([k,v])=>`<div><b>${k}</b> ${v}</div>`).join('')+'<button type="button" data-pcopy>📋 คัดลอก</button>';}
function perfText(){return '[Fantas Stick perf '+new Date().toISOString().slice(0,16).replace('T',' ')+' '+navigator.userAgent.replace(/^.*?\) /,'').slice(0,60)+']\n'+perfRows().map(([k,v])=>k+': '+String(v).replace(/<[^>]+>/g,'')).join('\n');}
// F3 = เปิด/ปิดแผงข้อมูล (ไม่ทับปุ่มเกม: F1–F12 ยังไม่ถูกใช้)
addEventListener('keydown',e=>{if(e.code!=='F3')return;e.preventDefault();SET.stats=SET.stats?0:1;try{saveSet();}catch(_){}});
if(window.WD){window.WD.perf=PERF;window.WD.perfText=perfText;window.WD.FRZ=FRZ;window.WD.SHW=SHW;window.WD.shwFrame=shwFrame;window.WD.PATHS=PATHS;window.WD.MODES=MODES;window.WD.MLS=MLS;window.WD.mlsPoint=mlsPoint;window.WD.getKit=getKit;if(!('builtMap' in window.WD))Object.defineProperty(window.WD,'builtMap',{get:()=>builtMap});}
