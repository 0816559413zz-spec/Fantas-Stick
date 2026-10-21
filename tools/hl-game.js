// ตัวช่วยทดสอบเกมแบบไม่มีหน้าต่าง (tools/headless.js ฉีดไฟล์นี้เข้าหน้าเกมก่อนรันสคริปต์ของคุณ) — ทุกอย่างอยู่ใน window.HL
//   await HL.solo({mode:'train', kit:'1', map})  เริ่มเล่นคนเดียว (ห้องฝึก = แผนที่ test) • kit = สตริงชุดสาย เช่น '0' ไฟ '1' น้ำแข็ง '2' สายฟ้า '6' ดิน หรือ '1.12.13.14.15'
//   HL.step(n=1, dt=1/60)  เดินเกม n เฟรม (host + render) แบบกำหนดเวลาเอง (หยุดลูปจริงแล้ว ผลเหมือนเดิมทุกครั้ง)
//   HL.me() / HL.o()       ผู้เล่นของเรา (host state) / ตัวละคร 3D ของเรา (PM3)
//   HL.input({fire:true})  ตั้งปุ่ม (WD.INPUT) • HL.aim(yaw) หันกล้อง/เล็ง
//   HL.cam('side'|'front'|'back'|'game'|'top'|'q34', {dist, h, look})  กล้องจ้องตัวเรา (null = กล้องเกมปกติ)
//   HL.snap(w=480)          ภาพเฟรมปัจจุบันเป็น canvas เล็ก • HL.sheet([{t,label}...] หรือ canvas[], cols) → dataURL รวมหลายช่อง
//   HL.film(times, fn, opt) เดินเวลาแล้วถ่ายตามเวลาที่ให้ (วินาทีนับจากเริ่ม) — fn(t) เรียกทุกเฟรม (ใช้กดปุ่ม/ร่าย) → dataURL
//   HL.dummy(dx,dy)         วางหุ่นฝึกตรงหน้า (หน่วย px ของเกม, ระยะ 20 px = 1 ม.)
//   HL.errs                 error ที่จับได้ในหน้า
(function(){
const HL=window.HL={errs:[]};
window.addEventListener('error',e=>HL.errs.push(String(e.message)));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));HL.sleep=sleep;
let now=performance.now(),camMode=null,camOpt={};
HL.freeze=()=>{window.requestAnimationFrame=()=>0;for(let i=1;i<20000;i++){clearInterval(i);}};
HL.solo=async(o={})=>{
  o=Object.assign({mode:'train'},o);
  if(o.kit!==undefined)try{localStorage.setItem('wd_kit2',String(o.kit));}catch(e){}
  document.getElementById('btnSolo').click();
  for(let i=0;i<40&&WD.screen!=='lobby';i++)await sleep(100);
  const G=WD.G;G.mode=o.mode;if(o.map)G.mapPick=o.map;
  const me0=WD.G.players[WD.NET.myId];if(me0&&o.kit!==undefined){WD.setKit(me0,String(o.kit));me0.kt=me0.kit;WD.broadcastLobby();}
  WD.hostStart();
  for(let i=0;i<80&&WD.screen!=='game';i++)await sleep(100);
  await sleep(300);HL.freeze();
  if(o.datk===undefined&&G.tr)G.tr.datk=0;          // หุ่นไม่ยิงใส่ (ภาพไม่รก)
  for(let i=0;i<400&&G.ph!=='play';i++)HL.step(1);   // ข้ามนับถอยหลัง
  HL.step(30);return HL.info();
};
HL.me=()=>WD.G.players[WD.NET.myId];
HL.o=()=>WD.PM3.get(WD.NET.myId);
HL.info=()=>{const p=HL.me();return p?{x:p.x,y:p.y,kit:p.kit,path:p.pathIdx,hp:p.hp,map:WD.G.map,ph:WD.G.ph}:null;};
HL.input=(o)=>{Object.assign(WD.INPUT,o);};
HL.aim=(yaw,pitch)=>{WD.setYaw(yaw);if(pitch!==undefined)WD.setPitch(pitch);};
HL.step=(n=1,dt=1/60)=>{for(let i=0;i<n;i++){now+=dt*1000;try{WD.hostStep(dt);WD.render(dt,now);}catch(e){HL.errs.push('step: '+(e.stack||e.message).slice(0,300));}}};
HL.dummy=(dx=140,dy=0)=>{const p=HL.me();const G=WD.G;if(!G.en)return;const a=p.ang||0,c=Math.cos(a),s=Math.sin(a);
  const x=p.x+c*dx-s*dy,y=p.y+s*dx+c*dy;
  if(typeof WD.spawnDummy==='function')return WD.spawnDummy(x,y);
  const d=G.en.find(e=>e.dummy)||G.en[0];if(d){d.x=x;d.y=y;}return d;};
// กล้องจ้องตัวเรา: ตำแหน่งเทียบทิศที่ตัวละครหัน (local +z = หน้า, -x = ขวาของตัวละคร)
HL.cam=(mode,opt)=>{camMode=mode;camOpt=opt||{};
  WD.camHook=mode?(cam)=>{const o=HL.o();if(!o)return;const g=o.g,ry=g.rotation.y,fx=Math.sin(ry),fz=Math.cos(ry),rx=-Math.cos(ry),rz=Math.sin(ry);
    const P=g.position,d=camOpt.dist||(mode==='top'?9:5.5),h=camOpt.h!==undefined?camOpt.h:1.4,L=camOpt.look||[0,1.1,camOpt.fwd||0.6];
    let x,y,z;
    if(mode==='side'){x=P.x+rx*d;z=P.z+rz*d;y=P.y+h;}             // จากด้านขวาของตัวละคร
    else if(mode==='left'){x=P.x-rx*d;z=P.z-rz*d;y=P.y+h;}
    else if(mode==='front'){x=P.x+fx*d;z=P.z+fz*d;y=P.y+h;}
    else if(mode==='back'){x=P.x-fx*d;z=P.z-fz*d;y=P.y+h+0.6;}
    else if(mode==='q34'){x=P.x+(fx*0.7+rx*0.7)*d;z=P.z+(fz*0.7+rz*0.7)*d;y=P.y+h+0.4;}
    else if(mode==='top'){x=P.x-fx*1.5;z=P.z-fz*1.5;y=P.y+d;}
    else return;   // 'game' = กล้องเกมปกติ
    cam.position.set(x,y,z);
    cam.lookAt(P.x+fx*L[2]+rx*(L[0]||0),P.y+L[1],P.z+fz*L[2]+rz*(L[0]||0));}:null;};
HL.snap=(w=480)=>{const src=WD.gl.domElement,h=Math.round(w*src.height/src.width),c=document.createElement('canvas');c.width=w;c.height=h;
  WD.render(0,now);   // วาดเฟรมสุดท้ายซ้ำ (dt=0) ให้ buffer ไม่ว่าง
  c.getContext('2d').drawImage(src,0,0,w,h);return c;};
HL.sheet=(cells,cols=4,title='')=>{const w=cells[0].c.width,h=cells[0].c.height,rows=Math.ceil(cells.length/cols),top=title?26:0;
  const S=document.createElement('canvas');S.width=w*cols;S.height=h*rows+top;const x=S.getContext('2d');x.fillStyle='#111';x.fillRect(0,0,S.width,S.height);
  if(title){x.fillStyle='#fff';x.font='bold 16px sans-serif';x.fillText(title,8,18);}
  cells.forEach((q,i)=>{const cx=(i%cols)*w,cy=Math.floor(i/cols)*h+top;x.drawImage(q.c,cx,cy);if(q.label){x.fillStyle='rgba(0,0,0,.6)';x.fillRect(cx,cy,w,20);x.fillStyle='#ffe';x.font='13px sans-serif';x.fillText(q.label,cx+5,cy+15);}
    x.strokeStyle='#000';x.strokeRect(cx+0.5,cy+0.5,w-1,h-1);});
  return S.toDataURL('image/jpeg',0.85);};
// เดินเวลา (dt คงที่) เรียก fn(t) ทุกเฟรม ถ่ายภาพที่เวลาใน times → sheet
HL.film=(times,fn,opt={})=>{const dt=opt.dt||1/60,T=[...times].sort((a,b)=>a-b),cells=[];let t=0;
  for(const at of T){while(t<at-1e-6){if(fn)fn(t);HL.step(1,dt);t+=dt;}cells.push({c:HL.snap(opt.w||480),label:(opt.label||'')+' t='+at.toFixed(2)});}
  return HL.sheet(cells,opt.cols||Math.min(4,cells.length),opt.title||'');};
})();
