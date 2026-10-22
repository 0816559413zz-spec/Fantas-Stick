// =====================================================================
//  กล้องตอนตาย (ผู้ใช้ 2026-10-22): "when ded make cam focus on person who kill u at ur ded body first 3 sec
//  after will go 3rd person cam of person who killed u for 4 sec and then fade black u spawn"
//  ช่วง 1 (0–3 วิ): กล้องอยู่หลังศพเรา มองไปที่คนฆ่า (เห็นทั้งศพและคนฆ่า) ซูมเข้าช้า ๆ
//  ช่วง 2 (3–7 วิ): กล้องบุคคลที่ 3 ตามหลังคนฆ่า
//  ช่วง 3: จอค่อย ๆ ดำจนเกิดใหม่ แล้วสว่างกลับ • ไม่มีคนฆ่า (ตกตาย/ไฟเผาเอง) = ดูศพตัวเองจนเกิด
//  เกิดใหม่ช้าลงเป็น 7.5 วิ ในโหมดที่เกิดใหม่ได้และมีคนฆ่า (ffa/tdm/ควิดดิช) — js/12 playerDown • ห้องฝึกยังเกิด 2 วิ (กล้องหยุดตอนเกิด)
//  แบทเทิลรอยัล (ตายถาวร): จบลำดับแล้วดูคนที่ฆ่าเราต่อ (โหมดดูเพื่อน js/52)
// =====================================================================
const DCAM_T1=3,DCAM_T2=7,DCAM_FADE=0.5;
const DCAM={on:false,t0:0,ki:'',x:0,y:0,h:0,kx:0,ky:0,ka:0,kz:0,blk:0,kn:''};
function dcamDie(ev){
  if(ev.id!==NET.myId)return;
  const v=VIEW.cur,k=ev.ki&&v&&v.P.find(p=>p.id===ev.ki);
  Object.assign(DCAM,{on:true,t0:performance.now(),ki:ev.ki||'',x:ev.x,y:ev.y,h:ev.h||0,kn:k?k.n:''});
  if(k){DCAM.kx=k.x;DCAM.ky=k.y;DCAM.kz=k.z||0;DCAM.ka=k.a||0;}
}
// ตั้งกล้องเอง (คืน true = ใช้กล้องนี้แทน updateCamera) — เรียกจาก render js/37
const _dcP=new THREE.Vector3(),_dcL=new THREE.Vector3();
function dcamCam(P,me,dt){
  if(!DCAM.on)return false;
  if(me&&me.al){DCAM.on=false;return false;}
  const t=(performance.now()-DCAM.t0)/1000;
  if(VIEW.cur&&VIEW.cur.mode==='br'&&t>DCAM_T2){DCAM.on=false;if(DCAM.ki)SPEC.id=DCAM.ki;return false;}   // ตายถาวร: ดูคนที่ฆ่าเราต่อ (js/52)
  const k=DCAM.ki&&P.find(p=>p.id===DCAM.ki);
  if(k&&k.al){DCAM.kx=k.x;DCAM.ky=k.y;DCAM.kz=k.z||0;DCAM.ka=k.a||0;}   // คนฆ่าตาย = ค้างที่ตำแหน่งสุดท้าย
  const bx=tx(DCAM.x),bz=tz(DCAM.y),by=GY(DCAM.x,DCAM.y)+(DCAM.h>2?DCAM.h-1:0);
  const kx=tx(DCAM.kx),kz=tz(DCAM.ky),ky=GY(DCAM.kx,DCAM.ky)+DCAM.kz;
  if(!DCAM.ki||t<DCAM_T1){
    // ช่วง 1: หลังศพ มองคนฆ่า (ไม่มีคนฆ่า = วนรอบศพช้า ๆ)
    let dx=DCAM.ki?kx-bx:Math.cos(t*0.4),dz=DCAM.ki?kz-bz:Math.sin(t*0.4);const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
    const back=lerp(4.6,3.4,Math.min(1,t/DCAM_T1));
    _dcP.set(bx-dx*back-dz*0.9,by+2.3,bz-dz*back+dx*0.9);
    if(DCAM.ki)_dcL.set(lerp(bx,kx,0.6),lerp(by,ky,0.6)+1.4,lerp(bz,kz,0.6));else _dcL.set(bx,by+0.6,bz);
  }else{
    // ช่วง 2+: บุคคลที่ 3 ข้างหลังคนฆ่า
    const fx=Math.cos(DCAM.ka),fz=Math.sin(DCAM.ka);
    _dcP.set(kx-fx*5.4+fz*0.8,ky+2.5,kz-fz*5.4-fx*0.8);_dcL.set(kx+fx*4,ky+1.7,kz+fz*4);
  }
  if(TERR)_dcP.y=Math.max(TW(_dcP.x,_dcP.z)+0.5,_dcP.y);
  const cut=DCAM.ki&&Math.abs(t-DCAM_T1)<dt*1.5;   // เปลี่ยนช่วง = ตัดภาพ (ไม่ลากกล้องข้ามแมพ)
  camPos.lerp(_dcP,cut?1:1-Math.exp(-6*dt));cam.position.copy(camPos);
  camLook.lerp(_dcL,cut?1:1-Math.exp(-8*dt));cam.lookAt(camLook);
  return true;
}
// ข้อความบนจอ + จอดำก่อนเกิด
function drawDeathCam(me){
  const n=performance.now();
  if(DCAM.on&&me&&!me.al){
    const t=(n-DCAM.t0)/1000;
    cx.save();cx.textAlign='center';cx.textBaseline='middle';
    const msg=!DCAM.ki?'💀 คุณตายแล้ว':t<DCAM_T1?'💀 ถูก '+DCAM.kn+' ฆ่า':'👁 มุมมองของ '+DCAM.kn;
    cx.font='700 20px Kanit,sans-serif';cx.lineWidth=4;cx.strokeStyle='rgba(0,0,0,.7)';cx.strokeText(msg,SW/2,SH*0.16);cx.fillStyle=t<DCAM_T1?'#ff9a9a':'#ffe9a8';cx.fillText(msg,SW/2,SH*0.16);
    cx.restore();
    // จอดำ: เริ่มก่อนเกิด DCAM_FADE วิ (rs = วินาทีที่เหลือก่อนเกิด, ปัดขึ้น) — ใช้เวลาเองหลังช่วง 2 ด้วย
    const left=Math.max(0,(DCAM.ki?DCAM_T2+DCAM_FADE:99)-t);
    DCAM.blk=Math.max(DCAM.blk,DCAM.ki&&t>DCAM_T2?Math.min(1,(t-DCAM_T2)/DCAM_FADE):left<DCAM_FADE?1-left/DCAM_FADE:0);
  }else DCAM.blk=Math.max(0,DCAM.blk-1/60/0.4);   // เกิดแล้ว: สว่างกลับ 0.4 วิ
  if(DCAM.blk>0.003){cx.save();cx.fillStyle=`rgba(0,0,0,${DCAM.blk})`;cx.fillRect(0,0,SW,SH);cx.restore();}
}
