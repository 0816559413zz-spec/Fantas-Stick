// =====================================================================
//  อัดท่าตัวละครจากเกมจริง ให้สตอรี่บอร์ด (storyboard.html → ⬇ Import / 🎬 อัดท่าจากเกม)
//  เปิดเป็น iframe: index.html?rec=<spell id>&kind=spell|ult|basic|shield|dash&path=<ลำดับสาย>
//  เข้าห้องฝึก → ใส่สกิลให้ตัวเรา → เล็งไปทางเป้า (ห่าง 5 ตัว ทาง +x) → กดสกิล → เดินเกมเองทีละ 1/60 วิ (ไม่พึ่งเวลาจริง
//  หน้าต่างซ่อนอยู่ก็อัดได้ ได้ผลเท่าเดิมทุกครั้ง) → อัดทุก 1/30 วิ:
//    ตำแหน่ง/หมุน/ขนาดของโมเดลไฟล์ (เทียบจุดยืนตอนเริ่ม; +x = ทางเป้า, y = ขึ้น, z = ขวา) + มุมกระดูกทุกชิ้น (ท่าจากไฟล์ + ท่าจากโค้ด)
//  จบเมื่อกลับมายืนนิ่ง 0.6 วิ (หรือครบ 12 วิ) → ส่งให้หน้าแม่ทาง postMessage {sbrec:1, done:1, data}
// =====================================================================
const RQ=new URLSearchParams(location.search);
const CHAR_PX=2.1/S3;   // ตัวละครสูง 2.1 ม. = 42 หน่วยในเกม
async function recBoot(){
  const send=o=>{try{parent.postMessage(Object.assign({sbrec:1},o),'*');}catch(e){}};
  const W=(f,ms)=>new Promise(r=>{const t0=performance.now();const k=setInterval(()=>{let ok=false;try{ok=f();}catch(e){}if(ok||performance.now()-t0>ms){clearInterval(k);r(ok);}},50);});
  let vnow=performance.now();
  const draw=dt=>{vnow+=dt*1000;FXSTUDIO.noDraw=true;try{render(dt,vnow);}catch(e){console.error(e);}finally{FXSTUDIO.noDraw=false;}};
  let pump=0;
  try{
    send({st:'กำลังเปิดเกม…'});
    try{$('#btnSolo').click();}catch(e){}
    await W(()=>G&&screen==='lobby',10000);if(crOpen)closeCreator(false);
    const path=+RQ.get('path')||0,id=RQ.get('rec'),kind=RQ.get('kind')||'spell';
    MODES.train.map='test';G.mapPick='test';G.mode='train';hostStart();
    if(!await W(()=>screen==='game'&&VIEW.cur&&G.players.me,12000))throw 'เข้าห้องฝึกไม่ได้';
    FXSTUDIO.own=true;pump=setInterval(()=>draw(0.05),50);   // เราเดินภาพเอง (rAF หยุดตอนหน้าต่างซ่อน)
    if(G.tr){G.tr.datk=0;G.tr.mai=0;G.tr.god=1;G.tr.nocd=1;}
    const me=G.players.me;setKit(me,String(path));me.kt=me.kit;try{WD.broadcastLobby();}catch(e){}
    yaw=0;pitch=0.2;
    send({st:'กำลังโหลดตัวละคร…'});
    if(!await W(()=>{const o=PM3.get('me');return o&&o.fileModel;},15000))throw 'โหลดโมเดลตัวละครไม่ได้';
    clearInterval(pump);pump=0;
    const o=PM3.get('me'),inst=o.fileModel,T={x:me.x+CHAR_PX*5,y:me.y};   // เป้า: ห่าง 5 ตัวละคร ทาง +x
    const aim=()=>{INPUT.gx=T.x;INPUT.gy=T.y;INPUT.ah=0;INPUT.u=INPUT.d=INPUT.l=INPUT.r=0;};
    const D=1/60,step=()=>{aim();WD.hostStep(D);draw(D);};
    // ส่วนนี้ทำรวดเดียว (ไม่มี await) → ลูปโฮสต์ปกติแทรกไม่ได้ = เดินเกมตามเราเท่านั้น
    for(let i=0;i<72;i++)step();   // ยืนนิ่ง 1.2 วิ ให้ท่าเข้าที่
    o.g.updateWorldMatrix(true,true);
    const org=new THREE.Vector3().setFromMatrixPosition(o.g.matrixWorld);
    const bones=[];inst.traverse(b=>{if(b.isBone)bones.push(b);});
    const top=new Set(bones.filter(b=>!(b.parent&&b.parent.isBone)).map(b=>b.name));
    const F=[],P=new THREE.Vector3(),Q=new THREE.Quaternion(),S=new THREE.Vector3(),r=(v,n)=>Math.round(v*n)/n;
    const grab=t=>{inst.updateWorldMatrix(true,false);inst.matrixWorld.decompose(P,Q,S);
      F.push({t:r(t,1000),a:o.anim?o.anim.curName:'',p:[r(P.x-org.x,1000),r(P.y-org.y,1000),r(P.z-org.z,1000)],q:[Q.x,Q.y,Q.z,Q.w].map(v=>r(v,10000)),s:r(S.x,1000),
        b:bones.map(b=>[...[b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w].map(v=>r(v,10000)),...(top.has(b.name)?[b.position.x,b.position.y,b.position.z].map(v=>r(v,10000)):[])])});};
    // กดสกิล (ปุ่มที่ต้องกดค้าง = ปล่อยตามเวลาในเกม)
    let ok=true,rel=0;aim();
    if(kind==='spell'){me.kitIds[0]=id;me.cd.q=0;ok=castSlot(me,0)!==false;}
    else if(kind==='ult'){me.ultId=id;me.ult=100;ok=castUlt(me)!==false;}
    else if(kind==='basic'){INPUT.fire=1;rel=0.9;}
    else if(kind==='shield'){INPUT.sh=1;rel=1.2;}
    else if(kind==='dash'){INPUT.c.sp=(INPUT.c.sp|0)+1;INPUT.dh=1;rel=0.45;}
    if(!ok)throw 'กดสกิลนี้ในห้องฝึกไม่ได้';
    let t=0,still=0,lp=o.g.position.clone();grab(0);
    while(t<12){
      step();t+=D;
      if(rel&&t>=rel){INPUT.fire=INPUT.sh=INPUT.dh=0;rel=0;}
      if(Math.round(t*60)%2===0)grab(t);
      const p=o.g.position,moved=p.distanceTo(lp);lp.copy(p);
      const busy=me.dfall||me.colos>0||me.sdome||me.wr||me.rail||me.aug||me.ramp||me.snapT>0||me.hover>0||me.grT>0||rel;
      still=(!busy&&moved<0.002&&(!o.anim||o.anim.curName==='idle'))?still+D:0;
      if(t>0.8&&still>0.6)break;
    }
    FXSTUDIO.own=false;requestAnimationFrame(frame);
    send({done:1,data:{v:1,id,kind,path,fps:30,dur:r(t,1000),model:'char_student',bones:bones.map(b=>b.name),top:[...top],frames:F}});
  }catch(e){console.error(e);if(pump)clearInterval(pump);send({err:String(e)});}
}
if(RQ.has('rec'))recBoot();
