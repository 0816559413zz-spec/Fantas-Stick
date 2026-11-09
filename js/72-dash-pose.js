// =====================================================================
//  ท่าพุ่ง 3D (ผู้ใช้ 2026-11-05: "บางท่า เช่น Windrift เป็นแบบพุ่งตัว … ตอนนี้ไม่เป็น Animation แค่ยืนร่าย แล้วก็ท่าอื่นที่พุ่ง")
//  ทุกอย่างที่ host ตั้ง p.dash (snapshot ds): Dash ทุกสาย, Windrift, Rock Boost, ดาบเปิดอัลติ Mirror Legion ฯลฯ
//   • ออกตัว: หันตัวไปทางที่พุ่ง โน้มตัว แขนเหวี่ยงไปหลัง ขาก้าวยาว งอเข่า (กลางอากาศ = หดขา)
//   • จบ: เบรกด้วยขาหน้าแล้วคืนท่า • พุ่งถอยหลัง = ท่าถอยหลบ (ไม่หันหลัง) • Mirror Legion = ง้างดาบแล้วฟันตามแรง
//   • Windrift = แบบ Jett ตัวเกือบนอน แขนลู่หลัง → (ถ้ายังลอย = ท่าร่วง) → ลงท่าฮีโร่ เข่าแตะพื้น แล้วลุก
//  ภาพล้วน ไม่แตะ host/snapshot • เรียกจาก syncPlayers (js/35) หลังท่าสกิลทั้งหมด ก่อน rigSync
//  เข่า = หมุนกระดูก shin_R/shin_L ของโมเดลไฟล์เพิ่มจากแอนิเมชัน (แขนขาโค้ดมีแค่ต้นขา)
// =====================================================================
//  ช่อง: 0 โน้มตัว(+หน้า) 1 ยกตัว y 2 แขนขวา x(+หลัง) 3 แขนขวา z 4 แขนซ้าย x 5 แขนซ้าย z
//        6 ต้นขาขวา x(+หลัง) 7 ต้นขาซ้าย x 8 งอเข่าขวา 9 งอเข่าซ้าย 10 เอียงข้าง (b.rotation.z)
const DPOSE={
  run:  [0.42,-0.06, 0.85,-0.35, 0.75, 0.4,  0.55,-0.95, 0.45,1.05, 0],      // พุ่งไปหน้า: ก้าวยาว ขาหลังเตะขึ้น แขนลู่หลัง
  brake:[-0.1,-0.12,-0.55,-0.3,-0.35, 0.55,  0.3,-0.65,  0.75,0.55, 0],      // เบรก: ขาหน้าปักพื้น ตัวตั้ง แขนเหวี่ยงมาหน้ากันล้ม
  back: [-0.3,-0.08,-1.0,-0.4, -0.75, 0.6, -0.45, 0.35,  0.7,0.35, 0],       // ถอยหลบ: ตัวเอนหลัง แขนยื่นหน้า
  tuck: [0.25, 0.05, 0.7,-0.5,  0.6, 0.55, -0.55,-0.95, 1.4,1.5, 0],         // พุ่งกลางอากาศ (Rock Boost กระโดด): หดขา
  wind: [0.7, 0.3, 0.4,-0.45, 0.35, 0.5,  0.15,-0.55,  0.35,1.0, 0],         // Windrift แบบ Jett: ตัวเกือบนอน ขาลากหลัง แขนลู่ตามตัว
  fall: [0.3, 0.02, 0.2,-1.0,   0.1, 1.0,  0.2,-0.7,    0.5,1.15, 0],        // Windrift จบกลางอากาศ: กางแขนทรงตัวรอลง
  hero: [0.55,-0.3,-1.15,-0.25, 0.8, 1.0, -0.4,-1.95,  1.45,1.5, 0.06],      // ลงท่าฮีโร่: เข่าขวาแตะพื้น เท้าซ้ายวางหน้า มือไม้ยันพื้น แขนซ้ายกางหลัง
  slash:[0.38,-0.08, 0.7,-1.05, 0.55, 0.45, 0.5,-0.9,   0.45,1.0, -0.05],    // Mirror Legion: ง้างดาบต่ำไปหลังขวา
  slashF:[0.2,-0.14,-1.35, 0.7,  0.3, 0.6,  0.35,-0.7,  0.6,0.7, 0.08],      // ฟันตามแรงข้ามตัว
  stand:[0.05,-0.04,-0.35,-0.12, 0, 0.15,  0,0,         0.15,0.15, 0],       // ยืนปกติ (ปลายทางคืนท่าหลังถอยหลบ)
};
const DPT={rec:0.32,land:0.62,fallMax:0.9};   // เวลา: คืนท่าหลังพุ่ง • ลงท่าฮีโร่ • รอลงพื้นนานสุด
const _dpQ=new THREE.Quaternion(),_dpX=new THREE.Vector3(1,0,0),_dpP=new Array(11).fill(0);
function dpMix(A,B,f){for(let i=0;i<11;i++)_dpP[i]=A[i]+(B[i]-A[i])*f;return _dpP;}
// งอเข่าที่กระดูกโมเดล (บวกเพิ่มจากแอนิเมชัน) • ถ้าแอนิเมชันไม่ได้เขียนทับ (ค่าเท่าที่เราตั้งเฟรมก่อน) คืนค่าเดิมก่อน กันหมุนสะสม
function dpKnees(o,kr,kl){
  const m=o.fileModel;if(!m)return;
  let K=o.dpKB;if(!K||K.m!==m){K=o.dpKB=['shin_R','shin_L'].map(n=>{const b=m.getObjectByName(n);return b?{b,base:new THREE.Quaternion(),ap:new THREE.Quaternion(),on:false}:null;});K.m=m;}
  for(let i=0;i<2;i++){const k=K[i];if(!k)continue;const q=k.b.quaternion,a=i?kl:kr;
    if(k.on&&q.equals(k.ap))q.copy(k.base);
    if(Math.abs(a)<0.003){k.on=false;continue;}
    k.base.copy(q);q.multiply(_dpQ.setFromAxisAngle(_dpX,a));k.ap.copy(q);k.on=true;}
}
function dpStyle(p){
  if(p.wn&&p.wn[6]===2)return 'wind';
  if(p.fr&&(p.fr[3]&16))return 'slash';   // สายน้ำแข็งไม่มี Dash แบบพุ่ง (Shift = ไถล) → ds ระหว่าง Mirror Legion = ดาบเปิดอัลติ
  return 'run';
}
const DPDBG={pose:null};   // ดีบัก: WD.DPDBG.pose='hero' = ค้างท่านั้นทุกตัว (ตรวจท่านิ่ง ๆ)
function dashPose(o,p,dt,now){
  if(o.wsl){if(o.dp)o.dp=null;dpKnees(o,o.wsl.kn||0,0);return;}   // Slipstream มีท่า 4 ทิศของตัวเอง (windLatePose)
  if(DPDBG.pose&&DPOSE[DPDBG.pose]){o.dp=null;dpApply(o,DPOSE[DPDBG.pose],1,1,1,0);return;}
  let S=o.dp;
  if(!p.al||p.dn||p.fl||p.st||o.rag||p.gh||(p.ea&&p.ea[1])||p.df){if(S)o.dp=null;dpKnees(o,0,0);return;}   // ขี่ Stand (Rampage) / Dragonfall / บิน มีท่าของตัวเอง
  const gp=o.g.position;
  if(p.ds&&(!S||S.ph!=='go'))S=o.dp={ph:'go',t:0,w:S?S.w*0.5:0,px:gp.x,pz:gp.z,py:gp.y,rel:S?S.rel:0,back:-1,st:dpStyle(p),air:0,sp:0,caN:o.caN,aw:1};
  if(!S){dpKnees(o,0,0);return;}
  S.t+=dt;
  // ทิศที่พุ่งจริง (จากการเคลื่อนของตัว) เทียบทิศที่หัน → หันตัวตามทาง • ถอยหลัง (>115°) ล็อกเป็นท่าถอยหลบตั้งแต่เริ่ม
  const dx=gp.x-S.px,dz=gp.z-S.pz,d=Math.hypot(dx,dz);S.px=gp.x;S.pz=gp.z;S.sp+=(d/Math.max(dt,1e-3)-S.sp)*Math.min(1,dt*12);
  const vy=(gp.y-S.py)/Math.max(dt,1e-3);S.py=gp.y;
  if(S.ph==='go'&&d>0.02){const ry=o.g.rotation.y,c=Math.cos(ry),s=Math.sin(ry),rel=Math.atan2(dx*c-dz*s,dx*s+dz*c);
    if(S.back<0)S.back=S.st==='run'&&Math.abs(rel)>2.0?1:0;
    const want=S.back?angDiff(rel,Math.PI):rel;S.rel+=angDiff(want,S.rel)*Math.min(1,dt*25);}
  const air=(p.z||0)-groundH(p.x,p.y,p.z)>0.35;S.air+=((air?1:0)-S.air)*Math.min(1,dt*14);
  if(S.ph==='go'&&!p.ds){S.ph=S.st==='wind'?(air?'fall':'land'):'rec';S.t=0;}
  if(S.ph==='fall'&&(!air&&vy>-0.5||S.t>DPT.fallMax)){S.ph='land';S.t=0;}
  // ท่าตามช่วง
  const base=S.back>0?DPOSE.back:DPOSE[S.st]||DPOSE.run;let P,w,legW=1;
  if(S.ph==='go'){S.w=Math.min(1,S.w+dt/0.05);w=S.w;P=S.st==='run'&&S.air>0.01&&!S.back?dpMix(base,DPOSE.tuck,S.air):base;}
  else if(S.ph==='rec'){const f=Math.min(1,S.t/DPT.rec),end=S.back>0?DPOSE.stand:S.st==='slash'?DPOSE.slashF:DPOSE.brake;
    P=dpMix(base,end,_cs(Math.min(1,f/(S.st==='slash'?0.3:0.4))));w=S.w*(f<0.4?1:1-_cs((f-0.4)/0.6));if(f>=1){o.dp=null;dpKnees(o,0,0);return;}}
  else if(S.ph==='fall'){P=dpMix(DPOSE.wind,DPOSE.fall,_cs(Math.min(1,S.t/0.22)));w=1;}
  else{   // land: ลงท่าฮีโร่ (กระแทกเร็ว ค้าง แล้วลุก) • เดินต่อทันที = ขาไปท่าเดิน ตัวบนยังค้างท่านิดหน่อย
    if(S.sp>3&&S.t>0.1)S.t+=dt*1.5;
    const f=Math.min(1,S.t/DPT.land);if(f>=1){o.dp=null;dpKnees(o,0,0);return;}
    P=dpMix(S.t<0.02?DPOSE.wind:DPOSE.fall,DPOSE.hero,_ce(Math.min(1,S.t/0.09)));
    w=f<0.55?1:1-_cs((f-0.55)/0.45);legW=S.sp>3?Math.max(0,1-S.t/0.18):1;}
  // สกิล/ยิงใหม่หลังพุ่งจบ → คืนแขนให้ท่าร่าย
  const newCast=S.ph!=='go'&&(o.cpT>0||o.caN&&o.caN!==S.caN);S.aw+=((newCast?0:1)-S.aw)*Math.min(1,dt*18);
  dpApply(o,P,w,S.aw,legW,S.rel);
}
function dpApply(o,P,w,armW,legW,yaw){
  const R=o.armR.rotation,L=o.armL.rotation,b=o.b,aw=w*armW,lw=w*legW;
  b.rotation.x=lerp(b.rotation.x,P[0],w);b.position.y+=P[1]*w;
  b.rotation.y+=yaw*w;
  b.rotation.z=lerp(b.rotation.z,P[10],w);o.bz=1;
  R.x=lerp(R.x,P[2],aw);R.z=lerp(R.z,P[3],aw);L.x=lerp(L.x,P[4],aw);L.z=lerp(L.z,P[5],aw);
  o.legs[0].rotation.x=lerp(o.legs[0].rotation.x,P[6],lw);o.legs[1].rotation.x=lerp(o.legs[1].rotation.x,P[7],lw);
  o.legs[0].rotation.z*=1-lw;o.legs[1].rotation.z*=1-lw;
  dpKnees(o,P[8]*lw,P[9]*lw);
}
if(window.WD)Object.assign(window.WD,{DPOSE,DPT,DPDBG});
