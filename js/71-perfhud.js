// =====================================================================
//  ตัววัดประสิทธิภาพบนจอ (ผู้ใช้ 2026-11-05: "อยากได้ตัววัดอื่น ๆ เพิ่ม เอาไว้เก็บข้อมูล optimize + กราฟ FPS เปิดในการตั้งค่า")
//  เปิดในตั้งค่า → ภาพ: SET.fpsg = กราฟเวลาเฟรม (ms) / SET.stats = แผงข้อมูลละเอียด • SET.fps (ข้อความ FPS เดิม) ยังอยู่
//  กราฟ: แท่งละเฟรม 240 เฟรมล่าสุด, เส้น 16.7 ms (60) / 33 ms (30), แท่งเหลือง/แดง = เฟรมช้า, ส่วนล่างสีฟ้า = เวลา CPU
//  แผง: FPS เฉลี่ย / 1% ต่ำสุด / เฟรมช้าสุด, CPU (เกม+สั่งวาด) แยกเวลาโฮสต์คำนวณ, draw call / สามเหลี่ยม (รวมทุก pass),
//  shader / geometry / texture, หน่วยความจำ JS (Chrome), ความละเอียด + ระดับกราฟิก, จำนวนอนุภาค/เอฟเฟกต์/คน/ศัตรู/กระสุน, เน็ต
//  ปุ่ม 📋 คัดลอกค่าปัจจุบันเป็นข้อความ (วางให้ Claude ดูได้เลย) • F3 = เปิด/ปิดแผงเร็ว ๆ
// =====================================================================
const PERF={N:240,ft:new Float32Array(240),cpu:new Float32Array(240),i:0,n:0,host:0,hostAcc:0,
  last:0,snapN:0,snapB:0,snapIn:0,rate:{snap:0,kb:0,snapIn:0},rateT:0,txt:'',txtT:0,el:null,cv:null,pan:null,calls:0,tris:0};
// เรียกจาก frame() (js/37) ทุกเฟรม: dt = เวลาเฟรม (วิ), cpu = ms ที่ JS ใช้ในเฟรมนี้, host = ms ที่โฮสต์คำนวณเกม
function perfFrame(dt,cpu,host){
  const on=!!(SET.fpsg||SET.stats);
  if(gl.info.autoReset===on)gl.info.autoReset=!on;   // นับ draw call ของทุก pass ในเฟรม (ปกติ three รีเซ็ตทุก render() → เห็นแค่ pass สุดท้าย)
  if(!on){if(PERF.el)PERF.el.style.display='none';PERF.last=0;return;}
  const R=gl.info.render;PERF.calls=R.calls;PERF.tris=R.triangles;gl.info.reset();
  const tn=performance.now(),ft=PERF.last?tn-PERF.last:dt*1000;PERF.last=tn;   // เวลาจริง (dt ของเกมถูกตัดที่ 50 ms)
  const i=PERF.i;PERF.ft[i]=ft;PERF.cpu[i]=cpu;PERF.i=(i+1)%PERF.N;PERF.n=Math.min(PERF.N,PERF.n+1);
  PERF.host=PERF.host*0.9+host*0.1;
  PERF.rateT+=dt;if(PERF.rateT>=1){PERF.rate={snap:PERF.snapN/PERF.rateT,kb:PERF.snapB/1024/PERF.rateT,snapIn:PERF.snapIn/PERF.rateT};PERF.snapN=PERF.snapB=PERF.snapIn=0;PERF.rateT=0;}
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
    ['ภาพ',`${Math.round(sz.x*px)}×${Math.round(sz.y*px)} px (×${px.toFixed(2)}) • กราฟิก ${QUAL_NAME[QUAL.mode]}${QUAL.mode==='auto'?' ระดับ '+QUAL.lvl:''}`],
  ];
  if(mem)rows.push(['JS mem',`${(mem.usedJSHeapSize/1048576).toFixed(0)} / ${(mem.jsHeapSizeLimit/1048576).toFixed(0)} MB`]);
  if(screen==='game'&&v){
    rows.push(['ในฉาก',`อนุภาค ${PARTS.length} • เอฟเฟกต์ ${FXR.inst.length} • คน ${v.P.length} • ศัตรู ${v.E.length} • กระสุน ${(v.J||[]).length}`]);
    rows.push(['แผนที่',`${builtMap||'-'} • โหมด ${v.mode||'-'}`]);}
  if(NET.online)rows.push(['เน็ต',NET.isHost?`ส่ง ${PERF.rate.snap.toFixed(0)} snapshot/วิ • ${PERF.rate.kb.toFixed(1)} KB/วิ ต่อคน • ${NET.conns.size} คนต่ออยู่`:`รับ ${PERF.rate.snapIn.toFixed(0)} snapshot/วิ • ปิง ${NET.rtt?Math.round(NET.rtt):'-'} ms`]);
  return rows;}
function perfPanel(){PERF.pan.innerHTML=perfRows().map(([k,v])=>`<div><b>${k}</b> ${v}</div>`).join('')+'<button type="button" data-pcopy>📋 คัดลอก</button>';}
function perfText(){return '[Fantas Stick perf '+new Date().toISOString().slice(0,16).replace('T',' ')+' '+navigator.userAgent.replace(/^.*?\) /,'').slice(0,60)+']\n'+perfRows().map(([k,v])=>k+': '+String(v).replace(/<[^>]+>/g,'')).join('\n');}
// F3 = เปิด/ปิดแผงข้อมูล (ไม่ทับปุ่มเกม: F1–F12 ยังไม่ถูกใช้)
addEventListener('keydown',e=>{if(e.code!=='F3')return;e.preventDefault();SET.stats=SET.stats?0:1;try{saveSet();}catch(_){}});
if(window.WD){window.WD.perf=PERF;window.WD.perfText=perfText;}
