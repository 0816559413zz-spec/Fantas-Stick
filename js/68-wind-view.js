// =====================================================================
//  สายลม 🌪️ — ภาพฝั่งเครื่องเล่น (ขั้นที่ 1) • ตรรกะอยู่ js/09-wind.js • ไฟล์นี้มีแต่นิยามฟังก์ชัน (โหลดท้าย)
//  เอฟเฟกต์ทั้งหมดมาจาก VFX Studio ที่ผู้ใช้ผ่านแล้ว (assets/fx/wind/*) — ชิ้นที่ใช้ในเกมแยกด้วย tools/wind-ingame-split.py
//  เรียกจาก: efxFX (js/25, z ขึ้นต้น 'wn') • syncPlayers (js/35 windFX) • render loop (js/37 syncWind)
// =====================================================================
const WV={st:new Map(),wl:new Map(),vo:new Map()};
Object.assign(PCOL,{wplume:'#8dff65',wball:'#8dff65',wpush:'#8dff65',wbl:'#b8ff85'});
const WN_BODY={charge:[-0.7,-0.3,-0.12,0.3,-0.7,0.3,0,-0.2],dash:[0.65,-0.2,0,0.68,0.8,0.3,0,-0.05],hover:[-1.0,-0.35,0,-0.08,-0.75,0.45,0,-0.03]},WN_AIR_FEET=[-0.45,0.25,0.12,-0.12];
WN_BODY.dive=[0.5,-0.25,0,0.5,0.55,0.25,0,-0.04];WN_BODY.wallAim=[-1.55,-0.08,0.1,0.08,-1.2,0.35,0,-0.04];WN_BODY.gather=[-1.8,-0.45,-0.15,-0.08,-1.35,0.45,0,-0.08];WN_BODY.shieldCharge=[-1.2,0.6,0,0.2,-1.2,-0.6,0,-0.18];
// ท่าบิน (ผู้ใช้ 2026-11-08): ซ้อนท่าตามทิศที่กำลังไปบนท่าลอยนิ่ง แล้วใช้สปริงให้มีแรงเฉื่อยและเลยนิด ๆ (แนวทาง additive lean + bank ของเกมบิน)
// ลำดับ = แขนขวา x/z, หันตัว, ก้มตัว, แขนซ้าย x/z, เอียงตัว, สูงต่ำ • ขา = ซ้าย x, ขวา x, ซ้าย z, ขวา z
const WF_POSE={idle:[-0.35,-0.3,0,0.08,-0.3,0.38,0,-0.03],fw:[0.7,-0.2,0,0.9,0.7,0.2,0,-0.08],bk:[-0.8,-0.45,0,-0.55,-0.75,0.5,0,0.02],glide:[-0.5,-0.85,0,0.24,-0.5,0.85,0,-0.02]},WF_FEET={glide:[0.28,0.28,0.04,-0.04],idle:[0.04,0.04,0.05,-0.05],fw:[0.5,0.5,0.03,-0.03],bk:[-0.55,-0.55,0.05,-0.05]},WF_REF=9,WF_ROLL=0.55;
const _wfP=new Array(8).fill(0),_wfF=[0,0,0,0];
function windFlyPose(o,s,v,dt,now,w,glide){if(!s.fx){s.fx=s.fv=s.rx=s.rv=0;}const K=70,D=11,h=Math.min(dt,0.05);if(o.wslH>0)o.wslH-=dt;if(o.wsl||o.wslH>0){s.fx=s.fv=s.rx=s.rv=0;v=null;}
  const tf=clamp((v?v.lvz:0)/WF_REF,-1,1),tr=clamp((v?-v.lvx:0)/WF_REF,-1,1);
  s.fv+=(K*(tf-s.fx)-D*s.fv)*h;s.fx+=s.fv*h;s.rv+=(K*(tr-s.rx)-D*s.rv)*h;s.rx+=s.rv*h;
  const f=Math.max(0,s.fx),b=Math.max(0,-s.fx),I=glide?WF_POSE.glide:WF_POSE.idle,F=WF_POSE.fw,B=WF_POSE.bk,IF=glide?WF_FEET.glide:WF_FEET.idle;
  for(let i=0;i<8;i++)_wfP[i]=I[i]+(F[i]-I[i])*f+(B[i]-I[i])*b;
  for(let i=0;i<4;i++)_wfF[i]=IF[i]+(WF_FEET.fw[i]-IF[i])*f+(WF_FEET.bk[i]-IF[i])*b;
  const sway=Math.sin(now/620);_wfP[6]=s.rx*WF_ROLL+sway*0.02;_wfP[7]+=Math.sin(now/480)*0.05;_wfP[3]+=Math.sin(now/480+1)*0.015;_wfP[1]-=s.rx*0.15;_wfP[5]-=s.rx*0.15;_wfF[2]+=s.rx*0.12;_wfF[3]+=s.rx*0.12;
  characterStance(o,_wfP,_wfF,w);
  if(o.wWings){o.wWings.userData.airSw=s.fx>0?-0.22*s.fx:-0.2*s.fx;o.wWings.userData.gh=glide?1:0;}}
// Tailwind ฝั่งจอ (เฉพาะเรา): อยู่ในร่องลมทีมเดียวกัน = ลมวิ่งที่ขอบและมุมจอ + กล้องซูมออกนิด • คำนวณจาก event ไม่เพิ่มข้อมูลใน snapshot
const WTLF={k:0,fov:0,c:null,x:null,S:[]};
function windTailDraw(k){let c=WTLF.c;if(k<0.01){if(c&&c.style.display!=='none'){c.style.display='none';}return;}
  if(!c){c=WTLF.c=document.createElement('canvas');c.id='wtlFx';c.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:2;pointer-events:none';document.body.appendChild(c);WTLF.x=c.getContext('2d');for(let i=0;i<54;i++)WTLF.S.push({a:Math.random()*6.283,r:0.68+Math.random()*0.5,s:0.9+Math.random()*1.1,l:0.08+Math.random()*0.16,w:1+Math.random()*2.2});for(let i=0;i<18;i++){const r0=0.1+Math.random()*0.5;WTLF.S.push({m:1,a:Math.random()*6.283,r0,r:r0+Math.random()*0.3,s:0.5+Math.random()*0.6,l:0.05+Math.random()*0.09,w:1+Math.random()*1.5});}}
  c.style.display='block';const W=innerWidth,H=innerHeight;if(c.width!==W||c.height!==H){c.width=W;c.height=H;}
  const g=WTLF.x,cx=W/2,cy=H/2,ax=W*0.58,ay=H*0.58;g.clearRect(0,0,W,H);
  const v=g.createRadialGradient(cx,cy,Math.min(W,H)*0.42,cx,cy,Math.hypot(cx,cy));v.addColorStop(0,'rgba(120,255,190,0)');v.addColorStop(1,'rgba(120,255,190,'+(0.2*k)+')');g.fillStyle=v;g.fillRect(0,0,W,H);
  g.lineCap='round';for(const s of WTLF.S){const al=s.m?Math.sin(Math.PI*Math.min(1,(s.r-s.r0)/0.3))*0.5*k:Math.min(1,(s.r-0.68)/0.14)*Math.min(1,(1.22-s.r)/0.14)*0.75*k;if(al<=0)continue;const cs=Math.cos(s.a),sn=Math.sin(s.a);g.strokeStyle='rgba(225,255,240,'+al+')';g.lineWidth=s.w;g.beginPath();g.moveTo(cx+cs*ax*s.r,cy+sn*ay*s.r);g.lineTo(cx+cs*ax*(s.r+s.l),cy+sn*ay*(s.r+s.l));g.stroke();}}
function windTailFeel(p,dt){const Z=WV.tl||[];let on=false;for(let i=Z.length-1;i>=0;i--){const z=Z[i];z.t+=dt;if(z.t>=W_VO.tlD+W_VO.tlT){Z.splice(i,1);continue;}if(z.t<W_VO.tlD||z.tm!==p.tm||on)continue;const dx=p.x-z.x,dy=p.y-z.y,u=dx*z.ca+dy*z.sa;if(u>=-PR&&u<=W_VO.tlL+PR&&Math.abs(dy*z.ca-dx*z.sa)<=W_VO.tlW/2+PR)on=true;}
  if(!p.al)on=false;WTLF.k+=((on?1:0)-WTLF.k)*Math.min(1,dt*(on?8:4));WTLF.fov=WTLF.k*5;for(const s of WTLF.S){s.r+=s.s*dt;if(s.m){if(s.r>s.r0+0.3){s.r0=0.1+Math.random()*0.5;s.r=s.r0;s.a=Math.random()*6.283;}}else if(s.r>1.22){s.r=0.68;s.a=Math.random()*6.283;}}windTailDraw(WTLF.k);}
function windCharacterPose(o,p,dt,now,v){
  if(p.id===NET.myId)windTailFeel(p,dt);
  const A=p.wn;if(!A||!p.al||p.dn||p.fl||p.st){o.wnPose=null;if(o.wWings)o.wWings.userData.gh=0;return;}
  let s=o.wnPose;if(!s)s=o.wnPose={phase:0,t:0,w:0,P:WN_BODY.hover.slice(),hover:0};
  if(A[6]===1||A[9]===1){   // ชาร์จอัลติ Sonic Boom (A[9]=1) / (เลิกใช้) ชาร์จ Windrift • ช่วงพุ่ง/ลงท่าฮีโร่ = dashPose (js/72)
    if(s.phase!==A[6]){s.phase=A[6];s.t=0;}s.t+=dt;s.w=Math.min(1,s.w+dt*14);
    const target=WN_BODY.charge;for(let i=0;i<8;i++)s.P[i]=target[i];
    characterStance(o,s.P,WN_AIR_FEET,s.w);return;
  }
  if(s.phase){s.phase=0;s.t=0;}
  if(s.w>0){s.t+=dt;s.w=Math.max(0,1-_cs(Math.min(1,s.t/0.35)));if(!p.sh&&!o.caN&&!(o.cpT>0))characterStance(o,s.P,p.wv>1?null:WN_AIR_FEET,s.w);}
  const idle=A[5]>=1&&!p.sh&&!o.caN&&!(o.cpT>0);s.hover+=((idle?1:0)-s.hover)*(1-Math.exp(-10*dt));
  if(idle)windFlyPose(o,s,v,dt,now,s.hover,A[5]===2);else if(o.wWings){o.wWings.userData.airSw=0;o.wWings.userData.gh=0;}
  if(A[4])characterStance(o,WN_BODY.shieldCharge,p.wv>1?null:WN_AIR_FEET,0.9);
  else if(A[3]&&!o.caN)characterStance(o,WN_BODY.wallAim,p.wv>1?null:WN_AIR_FEET,0.8);
  else if(A[1]&&!o.caN&&!p.sh)characterStance(o,WN_BODY.gather,p.wv>1?null:WN_AIR_FEET,0.8);
}
const wvState=id=>{let s=WV.st.get(id);if(!s){s={};WV.st.set(id,s);}return s;};
const wvAlive=I=>!!I&&FXR.inst.indexOf(I)>=0;
// ---------- ทุกเฟรมของผู้เล่นสายลม: ปีกติดหลัง / ปีกห่อตอนยกโล่ / ดูดลมชาร์จเกจ ----------
const WFE_HOLD=0.55,WFE_TURN=0.32;   // วิที่ค้างท่าหลังยิง • มุมหันตัว (เรเดียน)
// ท่าแขนของสายลมที่ต้องทับท่าบิน: เรียกหลัง windCharacterPose • กด Featherwing = ชูมือถือไม้ตอนลอย แล้วค่อย ๆ ลดลง • ยิงขนนก = ชี้ไม้ไปข้างหน้า
function windLatePose(o,p,dt){const R=o.armR.rotation;if(!p.wn||!p.al||p.dn||(p.sh&&o.wbc===undefined)){o.wfu=undefined;if(o.wsl&&o.wsl.d>=1){if(o.wsl.d>=2)o.b.rotation.y=0;o.wsl=null;}return;}   // ง้างปล่อยโล่ยังถือโล่อยู่ ต้องให้ท่าทำงานด้วย
  if(o.wsl){const S=o.wsl,u=S.t+=dt,T=S.T,E=T+(S.d===1?0.6:S.d>=2?0.65:0.14),L=o.armL.rotation,e=Math.min(1,u/T),bl=u<T?Math.sin(e*Math.PI):0;   // Slipstream: หน้า = โน้มตัวพุ่ง เอียงตามโค้ง • หลัง = เงยตัว ปีกสะบัดมาหน้าดันตัวถอย • ซ้าย/ขวา = ม้วนตัวหมุนรอบเต็มรอบ
    if(u>=E||(S.d>=1&&u>T&&(o.wfe&&o.wfe.t<u||o.wpv&&o.wpv.t<u||o.wdb<u||o.wbc<u||o.wbk<u||o.wso<u||o.caN&&o.caT<u))){o.wslH=0.3;o.wsl=null;o.b.position.x=0;o.b.rotation.z=0;if(S.d>=2)o.b.rotation.y=0;}else if(S.d===0){const h=u<T?Math.min(1,u/0.05):Math.max(0,1-(u-T)/0.14),e2=h*h*(3-2*h),l0=o.legs[0].rotation,l1=o.legs[1].rotation;S.kn=1.5*e2;o.b.rotation.x=lerp(o.b.rotation.x,0.7,e2);o.b.rotation.z=lerp(o.b.rotation.z,0,e2);R.x=lerp(R.x,0.85,e2);R.z=lerp(R.z,-0.12,e2);L.x=lerp(L.x,0.85,e2);L.z=lerp(L.z,0.12,e2);l0.x=lerp(l0.x,-1.2,e2);l1.x=lerp(l1.x,0.3,e2);}
    else if(S.d===1){const r1=Math.max(0,Math.min(1,(u-T-0.25)/0.35)),h1=Math.min(1,u/0.05)*(1-r1*r1*(3-2*r1));o.b.rotation.x=lerp(o.b.rotation.x,-0.6,h1);o.b.rotation.z=lerp(o.b.rotation.z,0,h1);R.x=lerp(R.x,-1.35,h1);L.x=lerp(L.x,-1.1,h1);L.z=lerp(L.z,0.5,h1);for(const l of o.legs)l.rotation.x-=0.42*h1;}
    else{const sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},Ts=T+0.08,xs=Math.min(1,u/Ts),ph=2*Math.PI*(1-Math.pow(1-xs,1.7)),lift=sm(u/0.08),sw=1-Math.pow(1-xs,1.7),out=1-sm((u-Ts-0.2)/0.37),env=Math.min(lift,out),leftLead=S.s<0,firstIsLead=(o.legs[0].position.x>0)===leftLead,le=(firstIsLead?o.legs[0]:o.legs[1]).rotation,ot=(firstIsLead?o.legs[1]:o.legs[0]).rotation,kn=env*lerp(1.0,0.3,sw);S.kn=leftLead?0:kn;S.kl=leftLead?kn:0;o.b.rotation.y=S.s*ph;o.b.position.y+=0.24*Math.sin(Math.PI*xs);o.b.rotation.z=S.s*0.28*Math.sin(Math.max(0,Math.min(1,(u-Ts*0.35)/(E-Ts*0.35)))*Math.PI);o.bz=1;le.x=lerp(le.x,lerp(-0.7,-0.35,sw),env);le.z=lerp(le.z,-S.s*lerp(0.25,0.75,sw),env);ot.x=lerp(ot.x,0.12,env);ot.z=lerp(ot.z,S.s*0.08,env);R.x=lerp(R.x,0.25,env);R.z=lerp(R.z,-0.35,env);L.x=lerp(L.x,0.25,env);L.z=lerp(L.z,0.35,env);}}
  if(o.wpv){const V=o.wpv,u=V.t+=dt,W=W_DR.vWind,G_=W_DR.vGap,E=W+G_*V.n,L=o.armL.rotation,sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};   // Plume Volley: ง้าง = กางแขนไปหลัง อกแอ่น • ยิง = แทงไม้ไปข้างหน้า มือซ้ายกางออก ตัวโยกตามแต่ละชุด
    if(u<W){const k=sm(u/W);R.x=lerp(R.x,0.35,k);R.z=lerp(R.z,-0.4,k);L.x=lerp(L.x,0.35,k);L.z=lerp(L.z,0.4,k);o.b.rotation.x-=0.18*k;}
    else if(u<E+0.55){const a=sm((u-W)/0.07),h=1-sm((u-E-0.25)/0.3),pu=u<E?Math.abs(Math.sin((u-W)/(G_*2)*Math.PI)):0;R.x=lerp(R.x,lerp(0.35,-1.55,a)-0.1*pu,h);R.z=lerp(R.z,lerp(-0.4,-0.08,a),h);L.x=lerp(L.x,lerp(0.35,-0.85,a),h);L.z=lerp(L.z,lerp(0.4,0.6,a),h);o.b.rotation.x+=(lerp(-0.18,0.14,a)+0.05*pu)*h;V.tw=(V.tw||0)+((u<E?(V.s||0)*0.2:0)-(V.tw||0))*Math.min(1,dt*22);o.b.rotation.y+=V.tw*h;}
    else o.wpv=undefined;}
  if(o.wso!==undefined){o.wso+=dt;const u=o.wso,C=W_UL.chg,P=0.28,L=o.armL.rotation,sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},e=sm(u/0.3),pr=sm((u-C+P)/P),sh=Math.sin(u*70)*0.03*Math.min(1,u/C)*(1-pr),g=o.wsoAir?0:1;   // Sonic Boom ชาร์จ: ลอยขึ้นนิด (ถ้าอยู่พื้น) มือลงข้างลำตัวสั่น ตัวเอนหลัง → ก่อนพุ่ง โน้มหน้าท่าเตรียมวิ่ง
    if(u>C+0.1)o.wso=undefined;else{R.x=lerp(R.x,lerp(0.15+sh,1.0,pr),e);R.z=lerp(R.z,lerp(-0.45,-0.35,pr),e);L.x=lerp(L.x,lerp(0.15-sh,-0.9,pr),e);L.z=lerp(L.z,lerp(0.45,0.3,pr),e);o.b.rotation.x+=lerp(-0.22+sh,0.75,pr)*e;o.b.position.y+=(g*0.9-0.15*pr)*e;const a=o.legs[0].position.x>0?o.legs[0]:o.legs[1],b=a===o.legs[0]?o.legs[1]:o.legs[0];a.rotation.x-=0.75*pr;b.rotation.x+=0.45*pr;o.wkn=[0.5*pr,1.1*pr];}}
  if(o.wud!==undefined){o.wud+=dt;o.g.visible=true;const L=o.armL.rotation;if(o.wud>W_UL.ifr*3+0.1)o.wud=undefined;else{R.x=lerp(R.x,1.1,0.8);R.z=lerp(R.z,-0.3,0.8);L.x=lerp(L.x,1.1,0.8);L.z=lerp(L.z,0.3,0.8);o.b.rotation.x+=1.0;for(const l of o.legs)l.rotation.x+=0.5;}}
  if(o.wld){o.g.visible=true;const S=o.wld;S.t+=dt;const u=S.t,H=S.air?W_UL.landA:W_UL.land,L=o.armL.rotation,sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},w=sm(u/0.08)*(1-sm((u-H)/0.3)),a=o.legs[0].position.x>0?o.legs[0]:o.legs[1],b=a===o.legs[0]?o.legs[1]:o.legs[0];   // จบแดช: พื้น = Superhero landing • บิน = ก้มหน้า คทายื่นไปหน้า ขางอข้างหนึ่ง
    if(u>H+0.3)o.wld=null;else if(S.air){R.x=lerp(R.x,-1.55,w);R.z=lerp(R.z,0,w);L.x=lerp(L.x,0.3,w);L.z=lerp(L.z,0.4,w);o.b.rotation.x+=1.1*w;a.rotation.x-=0.65*w;b.rotation.x+=0.25*w;o.wkn=[0.2*w,1.3*w];}
    else{R.x=lerp(R.x,0.2,w);R.z=lerp(R.z,-0.12,w);L.x=lerp(L.x,0.95,w);L.z=lerp(L.z,0.95,w);o.b.rotation.x+=0.55*w;o.b.position.y-=0.78*w;a.rotation.x-=1.3*w;b.rotation.x+=0.6*w;o.wkn=[1.9*w,1.6*w];}}
  if(o.wtl!==undefined){o.wtl+=dt;const u=o.wtl,T=W_VO.tlD,L=o.armL.rotation,sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};   // Tailwind: ไขว้ไม้ลงซ้ายล่างระดับเข่า ย่อตัว แล้วตวัดขึ้นเร็ว ปล่อยลม
    if(u<T+0.7){const d=sm(u/(T*0.9)),a=sm((u-T)/0.09),w=d*(1-sm((u-T-0.35)/0.35));R.x=lerp(R.x,lerp(-0.35,-2.7,a),w);R.z=lerp(R.z,lerp(1.0,-0.25,a),w);L.x=lerp(L.x,lerp(0.3,-0.5,a),w);L.z=lerp(L.z,0.4,w);o.b.rotation.y+=lerp(0.5,-0.25,a)*w;o.b.rotation.x+=lerp(0.28,-0.14,a)*w;o.b.position.y-=0.24*(1-a)*w;for(const l of o.legs)l.rotation.x+=0.32*(1-a)*w;}else o.wtl=undefined;}
  if(o.wdb!==undefined){o.wdb+=dt;const u=o.wdb,T=W_WL.dbTele,L=o.armL.rotation,sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};   // Downburst: ชูไม้ขึ้นฟ้า ตัวแอ่นมองขึ้น → ฟาดไม้ลงชี้เป้า ตัวโน้ม ย่อขานิด ปีกกดลงมาหน้า → ค้างแป๊บแล้วคืนท่า
    if(u<T){const k=sm(u/(T*0.8));R.x=lerp(R.x,-3.05,k);R.z=lerp(R.z,0.08,k);L.x=lerp(L.x,-0.5,k);L.z=lerp(L.z,0.55,k);o.b.rotation.x-=0.24*k;}
    else if(u<T+0.72){const a=sm((u-T)/0.05),ov=a*Math.max(0,1-(u-T-0.05)/0.16),h=1-sm((u-T-0.42)/0.3);R.x=lerp(R.x,lerp(-3.05,-0.72,a)+0.42*ov,h);R.z=lerp(R.z,0,h);L.x=lerp(L.x,lerp(-0.5,0.32,a),h);L.z=lerp(L.z,lerp(0.55,0.2,a),h);o.b.rotation.x+=(lerp(-0.24,0.26,a)+0.12*ov)*h;o.b.position.y-=0.06*a*h;for(const l of o.legs)l.rotation.x-=0.14*a*h;}
    else o.wdb=undefined;}
  if(o.wdc!==undefined){o.wdc+=dt;const u=o.wdc,T=WNV.dsCh,e=Math.min(1,u/(T*0.7)),k=e*e*(3-2*e),L=o.armL.rotation;   // Dash ชาร์จ: ย่อตัวลงนิด โน้มตัว เข่างอ ลดไม้กับมือซ้ายลงต่ำ เตรียมส่งตัวขึ้น
    if(u>T+0.15)o.wdc=undefined;else{R.x=lerp(R.x,0.4,k);R.z=lerp(R.z,-0.22,k);L.x=lerp(L.x,0.4,k);L.z=lerp(L.z,0.22,k);o.b.rotation.x+=0.3*k;o.b.position.y-=0.2*k;for(const l of o.legs)l.rotation.x-=0.65*k;}}
  if(o.wdu!==undefined){o.wdu+=dt;const u=o.wdu,T=WNV.dsUpT,w=u<0.08?u/0.08:u<T?1:Math.max(0,1-(u-T)/0.3),L=o.armL.rotation,cr=Math.max(0,1-u/0.08);o.b.position.y-=0.2*cr;o.b.rotation.x+=0.3*cr;   // Dash: ชูไม้ขึ้นฟ้า มือซ้ายแนบลำตัวชี้ลง ตัวแอ่นนิด ขาชิดเหยียด (ตัวเป็นเส้นตรงพุ่งขึ้น) แล้วค่อยคลายเป็นท่าร่อน
    R.x=lerp(R.x,-3.05,w);R.z=lerp(R.z,0.08,w);L.x=lerp(L.x,0.28,w);L.z=lerp(L.z,0.2,w);o.b.rotation.x=lerp(o.b.rotation.x,-0.14,w);o.b.rotation.z=lerp(o.b.rotation.z,0,w);for(const l of o.legs){l.rotation.x=lerp(l.rotation.x,0.1,w);l.rotation.z=lerp(l.rotation.z,0,w);}if(u>T+0.3)o.wdu=undefined;}
  if(o.wbk!==undefined){o.wbk+=dt;const u=o.wbk,sl=Math.exp(-6*u),a=_cs(Math.min(1,u/0.1)),w=u<0.3?1:Math.max(0,1-(u-0.3)/0.25),L=o.armL.rotation;R.x=lerp(R.x,lerp(0.25,-1.6,a),w);R.z=lerp(R.z,lerp(-0.18,-0.1,a),w);L.x=lerp(L.x,lerp(0.25,-1.6,a),w);L.z=lerp(L.z,lerp(0.18,0.1,a),w);   // แทงแขนออก: ศอกเหยียดไปพร้อมแขน
    o.b.rotation.x+=0.2*sl;o.legs[0].rotation.x-=0.2*sl;o.legs[1].rotation.x-=0.2*sl;o.faW=1-a;if(u>0.55)o.wbk=undefined;}
  if(o.wbc!==undefined){o.wbc+=dt;const u=o.wbc,T=0.6,x0=Math.min(1,u/T),k=1-(1-x0)*(1-x0),L=o.armL.rotation;if(u<T){R.x=lerp(R.x,0.25,k);R.z=lerp(R.z,-0.18,k);L.x=lerp(L.x,0.25,k);L.z=lerp(L.z,0.18,k);o.b.rotation.x-=0.3*k;o.legs[0].rotation.x+=0.3*k;o.legs[1].rotation.x+=0.3*k;o.faW=k;}else{o.wbc=undefined;o.wbk=0;}}   // เยื้องตัวบนไปหลัง ขาอยู่ที่เดิม • ศอกงอ ปลายแขนยังชี้หน้า   // ง้าง: ตัวเอนไปหลัง ดึงมือเข้า   // ระเบิดกำแพง: ผลักมือออก ตัวสะท้อนกลับ
  if(o.wob){const B=o.wob,T0=0.35;B.t+=dt;const t=B.t,up=t<T0?Math.min(1,t/0.16):1,k=t<T0?0:_cs(Math.min(1,(t-T0)/0.1)),out=t<T0+0.3?1:Math.max(0,1-(t-T0-0.3)/0.25);
    const sx=-2.25,sz=B.s>0?-0.95:1.05,x=lerp(sx,-1.5,k),z=lerp(sz,-0.1,k),w=up*out,L=o.armL.rotation,lx=B.s>0?-1.5:-1.8,lz=B.s>0?-0.75:0.7;
    R.x=lerp(R.x,x,w);R.z=lerp(R.z,z,w);L.x=lerp(L.x,lerp(lx,0.35,k),w);L.z=lerp(L.z,lerp(lz,0.3,k),w);o.b.rotation.y+=lerp(-B.s*0.55,B.s*0.3,k)*w;   // ชาร์จ: บิดตัวไปข้างที่ง้าง มืออีกข้างตามไปประคอง • ปล่อย: บิดสวนมาอีกทาง
    if(t>T0){const u=t-T0,r=Math.exp(-9*u)*Math.sin(22*u);o.b.rotation.x-=0.34*r;o.b.position.y+=0.07*r;o.b.position.z-=0.12*r;}   // ปล่อย: แรงกระแทกดันตัวถอยแล้วเด้งกลับ
    if(t>T0+0.55)o.wob=null;return;}
  if(o.wfu!==undefined){o.wfu+=dt;const u=o.wfu,w=u<0.15?u/0.15:u<0.55?1:Math.max(0,1-(u-0.55)/0.3);R.x=lerp(R.x,-3,w);R.z=lerp(R.z,0.12,w);if(u>0.85)o.wfu=undefined;}
  else if(o.wfeW>0.01){R.x=lerp(R.x,-1.5,o.wfeW);R.z=lerp(R.z,-0.1,o.wfeW);}}
// งอศอก: แขนโค้ดมีข้อเดียว เลยหมุนกระดูก forearm ของโมเดลตรง ๆ หลัง rigSync (ตั้งเป้าเทียบท่าตรงที่จำไว้ จึงไม่สะสมแม้เฟรมที่ข้าม mixer)
const _faX=new THREE.Vector3(1,0,0),_faQ=new THREE.Quaternion(),_faT=new THREE.Quaternion(),WF_ELBOW=-1.9;
function windForearm(o){const w=o.faW||0;if(w<=0.002)return;o.faW=0;if(o.faB===undefined){o.faB=null;const a=o.g.getObjectByName('forearm_R'),b=o.g.getObjectByName('forearm_L');if(a&&b)o.faB=[[a,a.quaternion.clone()],[b,b.quaternion.clone()]];}
  if(!o.faB)return;_faQ.setFromAxisAngle(_faX,WF_ELBOW);for(const [b,q0] of o.faB){_faT.copy(q0).multiply(_faQ);b.quaternion.slerp(_faT,w);}}
function windFX(o,p,pz,now,dt){
  const A=p.wn;
  if(!A){if(o.wWings)o.wWings.visible=false;const s=WV.st.get(p.id);if(s){for(const k of ['wing','guard'])if(s[k]){fxKill(s[k]);s[k]=null;}}return;}
  const s=wvState(p.id),alive=p.al&&!p.dn,guard=alive&&p.sh&&o.wbc===undefined,h=o.zs||0;
  // ปีกติดหลังตลอดเวลา (ท่ากางเกือบนิ่ง) — ซ่อนตอนยกโล่ (ปีกห่อแทน)
  const big=A[5]>=1||A[7]>=1;   // Featherwing บินอยู่: ปีกใหญ่ 1.6 เท่า (ผู้ใช้)
  // ปีกเวทสายลม (designs/wind-wings-magic.html ผู้ใช้ผ่าน 2026-10-31) แทน fx wind/wing_idle เดิม
  // ยกโล่ = ปีกเดียวกันห่อตัว (fx shield_guard เหลือแค่ลม/ประกาย — ตัดปีกเก่าด้วย tools/wind-wings-strip.py)
  if(alive){if(!o.wWings){o.wWings=makeWindWings();o.wWings.position.set(0,1.35,-0.25);o.b.add(o.wWings);}
    o.wWings.visible=true;poseWindWings(o.wWings,big,dt,false);}
  else if(o.wWings)o.wWings.visible=false;
  if(alive&&p.sh)o.shield.visible=false;   // ไม่ใช้โล่ลูกแก้วปกติ
  if(alive&&A[11]){if(!wvAlive(s.enh))s.enh=fxPlay('wind/slip_ready',{x:p.x,y:p.y,h,aim:false,follow:p.id});}   // แดชแล้ว นัดถัดไปพร้อม: ขนนกนีออนลอยรอบตัว
  if(guard){if(!wvAlive(s.guard))s.guard=fxPlay('wind/wall_guard',{x:p.x,y:p.y,h,a:p.a,follow:p.id});else s.guard.a=p.a;}   // โล่ใหม่ = กำแพงลมตรงหน้า ปีกไม่ห่อแล้ว (ผู้ใช้ 2026-11-08)
  else if(s.guard){fxKill(s.guard);s.guard=null;}   // ห่อปีกยาว 9.5 วิ → ตัดทิ้งทันทีตอนลดโล่
  if(p.id===NET.myId)wvAimGhost(p,A,h);
  // ยิงขนนก: ชี้ไม้ไปข้างหน้าค้าง + หันตัวเปิดทางให้ปีกที่ยิง (ปีกซ้ายยิง = หันขวา) ค้างแป๊บ ไม่ยิงต่อค่อยกลับ
  {const E=o.wfe;if(E){E.t+=dt;const on=E.t<WFE_HOLD&&alive&&!guard;o.wfeW=(o.wfeW||0)+((on?1:0)-(o.wfeW||0))*Math.min(1,dt*(on?18:7));o.wfeY=(o.wfeY||0)+((on?E.s*WFE_TURN:0)-(o.wfeY||0))*Math.min(1,dt*(on?14:6));
    o.b.rotation.y+=o.wfeY;const w=o.wfeW;if(!on&&w<0.01&&Math.abs(o.wfeY)<0.01){o.wfe=null;o.wfeW=0;o.wfeY=0;}}}
  // ดูดลมชาร์จเกจ: ละอองลมไหลเข้าหาตัว
  if(alive&&A[1]&&Math.random()<0.8){const a=Math.random()*6.283,r=rnd(60,110);burst(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,Math.random()<0.5?'#8dff65':'#efffe8',1,-r*2.2,0.4,2.2,{h:h+rnd(0.4,1.8),g:0});}
  // เกจเต็ม: ประกายเขียวรอบมือ
  if(alive&&A[0]>=100&&Math.random()<0.35)burst(p.x+rnd(-14,14),p.y+rnd(-14,14),'#b8ff85',1,20,0.5,1.8,{h:h+rnd(0.8,1.6),vh:[0.5,1.5],g:-0.3});
}
// ---------- กำแพงลมจาก snapshot (ตามตำแหน่ง/ลบเมื่อหมด) ----------
function syncWind(v,dt,now){
  const seen=new Set();
  for(const w of (v.WW||[])){seen.add(w[0]);const o=WV.wl.get(w[0]);if(!o)continue;
    // ตำแหน่งภาพลื่นทุกเฟรม: กำแพงที่กำลังดันเลื่อนต่อด้วยความเร็วเดิมระหว่างรอ snapshot แล้วค่อยดึงเข้าหาค่าจริง (ไม่กระตุกตามอัตรา snapshot)
    if(o.sx===undefined){o.sx=w[1];o.sy=w[2];}
    if(w[6]){o.sx+=Math.cos(w[3])*W_WL.spd*dt;o.sy+=Math.sin(w[3])*W_WL.spd*dt;}
    {const k=Math.min(1,dt*14);o.sx+=(w[1]-o.sx)*k;o.sy+=(w[2]-o.sy)*k;}
    if(o.I){o.I.x=o.sx;o.I.y=o.sy;}if(o.P){o.P.x=o.sx;o.P.y=o.sy;if(!w[6]){fxStop(o.P);o.P=null;}}o.x=w[1];o.y=w[2];o.a=w[3];}
  const sv=new Set();
  for(const o of (v.WO||[])){sv.add(o[0]);const I=WV.vo.get(o[0]);if(I){I.x=o[1];I.y=o[2];}}   // หลุมดำ Void Spheres เลื่อนตามโฮสต์
  for(const [id,I] of WV.vo)if(!sv.has(id)){fxStop(I);WV.vo.delete(id);}
  for(const [id,o] of WV.wl)if(!seen.has(id)&&(o.age=(o.age||0)+dt)>0.5){if(o.I)fxStop(o.I);if(o.P)fxStop(o.P);if(o.U)fxStop(o.U);WV.wl.delete(id);}
}
function wvWall(n){return WV.wl.get(n);}
function wvHitFx(n){const o=wvWall(n);return o&&o.C?'wind/aegis_c_hit':'wind/wall_hit';}   // ศัตรูชน/ทะลุกำแพง: แบบ C = ม่านวาบตรงจุดชน
function wvAimFx(id){const o=WV.wa;if(o&&o.has(id)){fxStop(o.get(id));o.delete(id);}}   // หยุดลมรอบตัวตอนเล็งกำแพง
// ---------- ตา Eye of Heaven: ตำแหน่งตาบนฟ้า (ตรงกับ EYE ใน tools/wind-eye-ult-gen.py: สูง 16 ม. ข้างหน้า 30 ม. ตามทิศร่าย) ----------
function wvEyePos(x,y,a){return {x:x+Math.cos(a||0)*600,y:y+Math.sin(a||0)*600,h:16};}
function wvEyeSeen(e){const v=new THREE.Vector3(tx(e.x),e.h+GY(e.x,e.y),tz(e.y));const me=myPos();if(me&&Math.hypot(me.x-e.x,me.y-e.y)>2400)return false;v.project(cam);return v.z<1&&Math.abs(v.x)<1.05&&Math.abs(v.y)<1.05;}
// ---------- เหตุการณ์ (efx z 'wn…') ----------
function windEfx(ev){
  try{airWind(ev);}catch(e){}   // หญ้า/ลม (js/50): ท่าลมทำให้หญ้าพลิ้ว
  const z=ev.z,x=ev.x,y=ev.y,H=ev.h!==undefined?ev.h:0,me=myPos(),near=!me||Math.hypot(x-me.x,y-me.y)<1100,mine=ev.id===NET.myId,a=ev.a||0;
  switch(z){
    case 'wngbw':fxPlay('wind/gale_charge',{x,y,h:H,a:0,follow:ev.id});if(near)snd('cast_pull',ev);return true;   // เตรียมยิง (กดค้างตอนเกจเต็ม)
    case 'wngb':{const o=WV.gs||(WV.gs=new Map());const old=o.get(ev.id);if(old){fxStop(old);o.delete(ev.id);}   // ยิงลมต่อเนื่อง: เริ่ม (n=1) / หยุด (n=0) ตามตัวผู้ร่าย
      if(ev.n===1){const h=fxPlay('wind/gale_stream',{x,y,h:H,a:ev.a||0,follow:ev.id});if(h)o.set(ev.id,h);if(near)snd('cast_pull',ev);}return true;}
    case 'wngbhit':case 'wndshit':fxPlay('wind/ba_gust_hit',{x,y,h:Math.max(0,H-0.2),a:Math.random()*6.283});return true;
    case 'wngbfull':fxPlay('wind/ba_hit',{x,y,h:H+1.2,a:0});ring(x,y,'#8dff65',30,0.3,H+0.1);if(mine)toast('GaleBurst พร้อม! กดโจมตีปกติค้าง = ยิงลมต่อเนื่อง');return true;
    case 'wnchg':return true;
    case 'wnsbchg':ring(x,y,'#b8ff85',60,0.3,H+1);return true;
    case 'wnsb':fxPlay('wind/shield_burst',{x,y,h:H,follow:ev.id});if(near)shake(0.25);return true;
    case 'wnpv':{const o=PM3.get(ev.id);if(o){o.wpv={t:0,n:ev.n};if(o.wWings)o.wWings.userData.pv=0,o.wWings.userData.pvE=W_DR.vWind+W_DR.vGap*ev.n;}fxPlay('wind/plume_cast',{x,y,h:H,aim:false,follow:ev.id});if(near)snd('whoosh',{x,y,vol:0.8});return true;}   // ง้างปีก + กางแขน แล้วดันไปข้างหน้าตอนขนพุ่ง
    case 'wnpf':{const o=PM3.get(ev.id);if(o&&o.wWings){const d=o.wWings.userData;(d.fs||(d.fs={}))[-ev.n]={t:0};}if(o&&o.wpv)o.wpv.s=ev.n;if(near)snd('whoosh',{x,y,vol:0.22});return true;}   // ยิงทีละขน: ปีกข้างนั้นยืดออก (sd=+1 คือซ้าย, n=+1 คือขวา)
    case 'wnsl':{const o=PM3.get(ev.id);if(o){o.wsl={t:0,T:ev.t,d:ev.n,s:ev.m};if(o.wWings){const u=o.wWings.userData;u.sl=0;u.slD=ev.n;u.slT=ev.t;}}if(ev.n===0){fxPlay(ev.m?'wind/slip_fwd':'wind/slip_fwd_g',{x,y,h:H,a,aim:false,follow:ev.id});fxPlay(ev.m?'wind/slip_fwd_w':'wind/slip_fwd_gw',{x,y,h:H,a});}else if(ev.n===1){fxPlay(ev.m?'wind/slip_back':'wind/slip_back_g',{x,y,h:H,a,aim:false,follow:ev.id});fxPlay(ev.m?'wind/slip_back_w':'wind/slip_back_gw',{x,y,h:H,a});}else{const g=ev.w?'':'_g';fxPlay('wind/slip_side_'+(ev.m<0?'l':'r')+g,{x,y,h:H,a,aim:false,follow:ev.id});fxPlay('wind/slip_side_w'+g,{x,y,h:H,a});}if(near)snd('whoosh',{x,y,vol:0.8});return true;}   // ท่าแดช 4 ทิศ
    case 'wnse':fxPlay('wind/slip_shot',{x,y,h:H,aim:false,follow:ev.id});if(near)snd('whoosh',{x,y,vol:0.6});return true;
    case 'wnpb':fxPlay('wind/plume_pop',{x,y,h:H,aim:false});if(near)snd('hit',{x,y,vol:0.5});return true;
    case 'wndb':fxPlay('wind/downburst',{x,y,h:H,aim:false});wwCue(ev.id,'db');{const o=PM3.get(ev.id);if(o)o.wdb=0;}if(near)snd('cast_pull',ev);return true;   // ชูไม้ แล้วฟาดลง ลมถึงพื้นตอนฟาด
    case 'wndg':if(near){snd('whoosh',{x,y,vol:0.9});shake(0.16);}return true;
    case 'wndt':if(me){const d=Math.hypot(x-me.x,y-me.y);if(d<W_WL.dbR+250)shake(d<W_WL.dbR+30?0.07:0.03);}return true;   // พื้นในวงสั่นเป็นจังหวะตามลมกด
    case 'wndc':fxPlay('wind/dash_charge',{x,y,h:H,aim:false});wwCue(ev.id,'du');{const o=PM3.get(ev.id);if(o)o.wdc=0;}return true;   // ย่อตัว ลมวนเข้าเท้า
    case 'wnds':fxPlay('wind/dash_up',{x,y,h:H,aim:false});{const o=PM3.get(ev.id);if(o){o.wdc=undefined;o.wdu=0;}}if(near){snd('whoosh',{x,y,vol:0.9});shake(0.12);}return true;   // ลมระเบิดขึ้น
    case 'wndswall':fxPlay('wind/wall_hit',{x,y,h:0,a:Math.random()*6.283});return true;
    case 'wnwaim':{const o=WV.wa||(WV.wa=new Map());if(o.has(ev.id))fxStop(o.get(ev.id));o.set(ev.id,fxPlay('wind/aegis_aim',{x,y,h:H,follow:ev.id,aim:false}));}if(mine)toast('กำแพงลม: คลิกซ้าย = ดันไปข้างหน้า • คลิกขวา = วางตรงจุดเล็ง');return true;
    case 'wnwaimoff':wvAimFx(ev.id);return true;
    case 'wnwup':{const R=ev.m===2;   // กำแพงจากสกิล = แบบ C ม่านลมโค้ง (ผู้ใช้เลือก 2026-11-06; เล็ง/ปล่อย/ดัน/หยุด ยังเป็นของแบบ A) • m 2 = วงกำแพงของอัลติ = ชิ้นละ wind/eye_wall (สตอรี่บอร์ด #20 แบบ B) แตก/ใกล้แตกใช้ของ Aegis
      if(!R){wvAimFx(ev.id);const c=(VIEW.cur&&VIEW.cur.P||[]).find(p=>p.id===ev.id);if(c)fxPlay('wind/aegis_cast',{x:c.x,y:c.y,h:c.z||0,a:Math.atan2(y-c.y,x-c.x)});}
      const o={x,y,a,A:true,C:!R,I:fxPlay(R?'wind/eye_wall':'wind/aegis_c_wall',{x,y,h:0,a}),P:ev.m===1?fxPlay('wind/aegis_push',{x,y,h:0,a}):null};WV.wl.set(ev.n,o);return true;}
    case 'wnwstop':{const o=wvWall(ev.n);if(o&&o.P){fxStop(o.P);o.P=null;}fxPlay(o&&o.A===false?'wind/wall_stop':'wind/aegis_stop',{x,y,h:0,a});return true;}
    case 'wnwpass':fxPlay(wvHitFx(ev.n),{x,y,h:0,a:a+Math.PI});if(near)snd('hit',ev);return true;
    case 'wnwhit':fxPlay(wvHitFx(ev.n),{x,y,h:0,a:a+Math.PI});if(near)snd('hit',ev);return true;
    case 'wnwuns':{const o=wvWall(ev.n);if(o)o.U=fxPlay(o.C?'wind/aegis_c_unstable':o.A===false?'wind/wall_unstable':'wind/aegis_unstable',{x,y,h:0,a});return true;}
    case 'wnwboom':{const o=wvWall(ev.n);if(o){if(o.I)fxKill(o.I);if(o.P)fxKill(o.P);if(o.U)fxKill(o.U);WV.wl.delete(ev.n);}fxPlay(o&&o.C?'wind/aegis_c_break':o&&o.A===false?'wind/wall_break':'wind/aegis_break',{x,y,h:0,a});if(near){shake(0.35);snd('break',ev);}return true;}
    case 'wnwend':{const o=wvWall(ev.n);if(o){if(o.I)fxStop(o.I);if(o.P)fxStop(o.P);if(o.U)fxStop(o.U);WV.wl.delete(ev.n);}return true;}
    case 'wnwblk':fxPlay('wind/ba_hit',{x,y,h:Math.max(0,H-0.2),a:Math.random()*6.283});return true;
    case 'wndr':fxPlay('wind/windrift_sb_a',{x,y,h:H,a});if(near)snd('cast_pull',ev);return true;
    case 'wndrslow':ring(x,y,'#8dff65',26,0.35,H+0.2);return true;
    case 'wndrland':case 'wndrwind':return true;   // ลงท่า/ลมตามมา อยู่ในเอฟเฟกต์ windrift แล้ว
    case 'wnvx':fxPlay('wind/vortex_bind_sb_a',{x,y,h:H,a});later(0.8,()=>{if(near)shake(0.18);});if(near)snd('cast_pull',ev);return true;
    case 'wnvxstun':fxPlay('wind/wall_hit',{x,y,h:0,a:Math.random()*6.283});if(near)shake(0.15);return true;   // ลมรัดตัว = สตัน 0.5 วิ
    case 'wnvxcap':fxPlay('wind/ba_hit',{x,y,h:Math.max(0,H-0.2),a:Math.random()*6.283});return true;
    case 'wnorb':fxPlay('wind/gale_orb_boom',{x,y,h:H,aim:false});if(near){snd('boom',{x,y,vol:0.5});shake(0.25);}return true;
    case 'wnoc':{fxPlay('wind/gale_orb_charge',{x,y,h:H,follow:ev.id});const o=PM3.get(ev.id);if(o)o.wob={s:ev.n,t:0};if(near)snd('cast_pull',{x,y,vol:0.4});return true;}   // ง้างไม้ไปข้าง ลูกลมก่อตัวที่ปลายไม้
    case 'wnol':fxPlay('wind/gale_orb_launch',{x,y,h:H,a,aim:false});if(near)snd('whoosh',{x,y,vol:0.6});return true;
    case 'wnwc':{fxPlay('wind/wall_launch',{x,y,h:H,a,aim:false});const o=PM3.get(ev.id);if(o)o.wbc=0;if(near)snd('cast_pull',{x,y,vol:0.5});return true;}   // ง้างก่อนปล่อยโล่
    case 'wnwb':{fxPlay('wind/wall_blast',{x,y,h:H,a,aim:false});if(near){snd('boom',{x,y,vol:0.45});shake(0.2);}return true;}
    case 'wnfe':{const o=PM3.get(ev.id);if(o){o.wfe={s:ev.n,t:0};if(o.wWings){const d=o.wWings.userData;(d.fs||(d.fs={}))[-ev.n]={t:0};}}if(near)snd('whoosh',{x,y,vol:0.35});return true;}   // ยิงขนนก: ปีก sd=+1 คือซ้ายของตัวละคร ส่วน n=+1 คือขวา
    case 'wnvocast':fxPlay('wind/void_wave',{x,y,h:H,a,aim:false});if(near)snd('cast_pull',ev);return true;
    case 'wnvohole':{const I=fxPlay('wind/void_hole',{x,y,h:H,a,aim:false});if(I)WV.vo.set(ev.n,I);if(near)shake(0.15);return true;}
    case 'wnvoboom':{const I=WV.vo.get(ev.n);if(I){fxKill(I);WV.vo.delete(ev.n);}fxPlay('wind/void_boom',{x,y,h:H,a,aim:false});if(near){shake(0.6);snd('break',ev);if(ev.c)hitStop(0.08);}return true;}
    case 'wnfw':fxPlay('wind/fw_rise',{x,y,h:H,follow:ev.id});{const o=PM3.get(ev.id);if(o)o.wfu=0;}if(near)snd('cast_pull',ev);return true;   // เริ่มหมุนตัวบินวนขึ้น (ev.n = ด้าน -1/1)
    case 'wnfwfocus':{const o=WV.fo||(WV.fo=new Map());const old=o.get(ev.id);if(old){fxStop(old);o.delete(ev.id);}
      const I=fxPlay('wind/fw_focus',{x,y,h:H,a,follow:ev.id});if(I)o.set(ev.id,I);if(near){shake(0.15);if(mine)toast('บิน: WASD = ทิศ • Space/Ctrl = สูง/ต่ำ');}return true;}
    case 'wnfwflick':fxPlay('wind/fw_flick',{x,y,h:Math.max(0,H-3.2),a});wwCue(ev.id,'fk');if(near)shake(0.2);return true;
    case 'wnfwend':{const o=WV.fo;if(o&&o.get(ev.id)){fxStop(o.get(ev.id));o.delete(ev.id);}const f=WV.ff;if(f&&f.get(ev.id)){fxStop(f.get(ev.id));f.delete(ev.id);}return true;}
    case 'wnfwland':return true;
    case 'wnult':fxPlay('wind/eye_ult',{x,y,h:H,a,aim:false});wwCue(ev.id,'ul');if(near)snd('cast_pull',ev);return true;
    case 'wnulslam':{   // ตาลืมเต็ม: คนโดน (ev.v) เห็น Impact frame เต็ม • คนที่ "มองเห็นตา" (ตาอยู่ในจอ) เห็นเบากว่า • ตัวคนโดนมีลมรัดตัว
      const eye=wvEyePos(x,y,a),vic=!!(ev.v&&ev.v.includes(NET.myId));
      if(vic)impactFrame(1,eye.x,eye.y,eye.h);else if(wvEyeSeen(eye))impactFrame(0.75,eye.x,eye.y,eye.h);
      for(const id of ev.v||[]){const c=(VIEW.cur&&VIEW.cur.P||[]).find(q=>q.id===id);if(c)fxPlay('wind/ult_hold',{x:c.x,y:c.y,h:c.z||0,follow:id,aim:false});}
      if(near)shake(0.3);return true;}
    case 'wnulblade':fxPlay('wind/ult_blade_'+'abc'[ev.n|0],{x,y,h:H,a});if(near&&Math.random()<0.4)snd('hit',ev);return true;
    case 'wnulimp':if(near){shake(0.5);snd('break',ev);}return true;
    // ---- รูปแบบใหม่ 2026-11-08 (VFX จาก tools/wind-air-gen.py → assets/fx/wind/{up_*,push_*,slam_hit,force_*,blade_fly,fw_fast,sonic_*}) ----
    case 'wnup':fxPlay('wind/up_zone',{x,y,h:H,aim:false,p:{r:(ev.r||100)/20,t:ev.t||0.45}});if(near)snd('cast_pull',ev);return true;
    case 'wnupgo':fxPlay('wind/up_go',{x,y,h:H,aim:false,p:{r:(ev.r||100)/20,a:ev.m?1.0:0.35}});if(near)snd('whoosh',ev);return true;
    case 'wnuphit':fxPlay('wind/up_hit',{x,y,h:H,aim:false});if(near)snd('hit',ev);return true;
    case 'wnpush':{const ca=Math.cos(a),sa=Math.sin(a);burst(x+ca*30,y+sa*30,'#8dff65',8,200,0.25,2,{h:H+1.3,a,spread:0.4,g:0});ring(x+ca*30,y+sa*30,'#efffe8',34,0.25,H+1.2);if(near)snd('cast_pull',ev);return true;}
    case 'wnpushup':fxPlay('wind/push_up',{x,y,h:H,aim:false});if(near){shake(0.2);snd('hit',ev);}return true;
    case 'wnpushsink':fxPlay('wind/push_sink',{x,y,h:0,aim:false});if(near)snd('slam',ev);return true;
    case 'wnpushslam':fxPlay('wind/push_slam',{x,y,h:H,aim:false});if(near)snd('hit',ev);return true;
    case 'wnslam':fxPlay('wind/slam_hit',{x,y,h:0,aim:false});if(near){snd('slam',ev);hitStop(0.05);}return true;
    case 'wnblcast':fxPlay('wind/blade_cast',{x,y,h:H,a});if(near)snd('cast_pull',ev);return true;
    case 'wnblhit':fxPlay(ev.m?'wind/blade_hit':'wind/blade_pop',{x,y,h:H,a:Math.random()*6.283});if(ev.n>0)fxPlay('wind/blade_slow',{x,y,h:H,aim:false,p:{t:ev.n}});if(near&&ev.m)snd('hit',ev);return true;
    case 'wnfc':fxPlay(ev.m?'wind/force_dash':'wind/force_dash_g',{x,y,h:H,a,follow:ev.id});if(near)snd('dash',ev);return true;
    case 'wnfchit':fxPlay('wind/force_hit',{x,y,h:H,a});if(near)snd('hit',ev);return true;
    case 'wnfcend':return true;
    case 'wnfast':{const o=WV.ff||(WV.ff=new Map());const old=o.get(ev.id);if(old){fxStop(old);o.delete(ev.id);}
      if(ev.n){const I=fxPlay('wind/fw_fast',{x,y,h:H,a,follow:ev.id});if(I)o.set(ev.id,I);if(near)snd('whoosh',ev);if(mine)toast('บินเร็ว: เมาส์ = บังคับแบบเครื่องบิน • ใช้สกิลไม่ได้ • ปล่อย Shift = กลับบินปกติ');}return true;}
    case 'wnsochg':fxPlay('wind/sonic_charge',{x,y,h:H,a,follow:ev.id});{const o=PM3.get(ev.id);if(o){o.wso=0;o.wsoAir=!!ev.m;o.wld=null;if(o.wWings)o.wWings.userData.sup={t:0,dis:-1};}}if(near)snd('cast_pull',ev);if(mine)toast('Sonic Boom Strike: ชาร์จ 2.4 วิ แล้วพุ่งไปตามที่เล็ง');return true;
    case 'wnsoimp':{const o=PM3.get(ev.id);if(o){o.wso=undefined;o.wud=0;if(o.wWings&&o.wWings.userData.sup)o.wWings.userData.sup.dash=true;}}if(near)impactFrame(1,x,y,H+1.2,W_UL.ifr*3,ev.id);return true;
    case 'wnsodash':fxPlay(ev.m?'wind/sonic_dash':'wind/sonic_dash_g',{x,y,h:H,a,follow:ev.id});{const o=PM3.get(ev.id);if(o){o.wud=undefined;o.wld={t:0,air:!!ev.m};if(o.wWings&&o.wWings.userData.sup){const S=o.wWings.userData.sup;S.dash=false;S.dis=0;}}fxPlay('wind/sonic_end',{x:ev.x2,y:ev.y2,h:H,a});}if(near){snd('boom',ev);snd('whoosh',ev);}return true;
    case 'wnsohit':fxPlay('wind/sonic_hit',{x,y,h:H,a});if(near){snd('break',ev);hitStop(0.1);}return true;
    case 'wnsowave':fxPlay('wind/sonic_wave',{x,y,h:H,aim:false});if(near)snd('hit',ev);return true;
    case 'wnsocancel':{const o=PM3.get(ev.id);if(o){o.wso=undefined;if(o.wWings&&o.wWings.userData.sup)o.wWings.userData.sup.dis=1.9;}}return true;
    case 'wnsoend':return true;
    case 'wntl':{const o=PM3.get(ev.id);if(o)o.wtl=0;(WV.tl||(WV.tl=[])).push({x,y,ca:Math.cos(a),sa:Math.sin(a),t:0,tm:ev.tm});}fxPlay('wind/tailwind',{x,y,h:H,a});if(near)snd('whoosh',ev);return true;
    case 'wnsoon':if(mine)toast('สกิลนี้ของสายลมยังทำไม่เสร็จ (ขั้นที่ 2-3)');return true;
  }
  return false;
}
// ---------- HUD รอบเป้าเล็ง: เกจ GaleBurst (โค้งซ้าย) + ชาร์จกำแพงลม (จุด 3 จุดใต้เป้า) ----------
function drawWindHud(x,y,A,me){const g=Math.max(0,Math.min(100,A[0]))/100,full=g>=1,R=34,a0=Math.PI*0.62,a1=Math.PI*1.38;
  cx.lineCap='round';cx.lineWidth=5;cx.strokeStyle='rgba(0,0,0,0.45)';cx.beginPath();cx.arc(x,y,R,a0,a1);cx.stroke();
  if(g>0){cx.strokeStyle=full?`rgba(239,255,232,${0.75+0.25*Math.sin(performance.now()/120)})`:'#8dff65';cx.lineWidth=full?5:3.5;cx.beginPath();cx.arc(x,y,R,a1-(a1-a0)*g,a1);cx.stroke();}
  cx.lineCap='butt';cx.font='600 12px Kanit,sans-serif';cx.textAlign='right';cx.fillStyle=full?'#efffe8':'#b8ff85';cx.fillText(full?'GALE':Math.floor(g*100)+'%',x-R-8,y+4);
  for(let i=0,N=W_WL.max;i<N;i++){cx.beginPath();cx.arc(x-(N-1)*6+i*12,y+R+8,3.5,0,6.283);cx.fillStyle=i<(A[2]|0)?'#8dff65':'rgba(0,0,0,0.45)';cx.fill();}
  for(let i=0,N=W_VX.sMax;i<N;i++){cx.beginPath();cx.arc(x-(N-1)*6+i*12,y+R+18,3.5,0,6.283);cx.fillStyle=i<(A[10]|0)?'#c9ffe2':'rgba(0,0,0,0.45)';cx.fill();}
  if(A[3]){cx.textAlign='center';cx.font='600 14px Kanit,sans-serif';cx.fillStyle='#efffe8';cx.fillText('คลิกซ้าย = ดันกำแพง • คลิกขวา = วางตรงจุดเล็ง',x,y+R+30);}
}
// ---------- ตัวช่วยเล็งกำแพงลม (เห็นเฉพาะเรา): เส้นโค้งเรืองที่จุดวาง (คลิกขวา) + ลูกศรทางดัน (คลิกซ้าย) ----------
function wvAimGhost(p,A,h){
  if(!WV.gh){const m=new THREE.MeshBasicMaterial({color:'#3fd65a',transparent:true,opacity:0.8,depthWrite:false,depthTest:false,side:THREE.DoubleSide});   // ไม่ใช้ additive (พื้นสว่างแล้วมองไม่เห็น)
    const arc=new THREE.Mesh(new THREE.RingGeometry(10.6,11.2,48,1,Math.PI/2-0.61,1.22),m),pu=new THREE.Mesh(new THREE.PlaneGeometry(0.5,20),m.clone());
    arc.rotation.x=-Math.PI/2;pu.rotation.x=-Math.PI/2;arc.renderOrder=pu.renderOrder=20;pu.material.opacity=0.55;const ga=new THREE.Group(),gp=new THREE.Group();ga.add(arc);gp.add(pu);arc.position.z=10.9;pu.position.z=10;scene.add(ga,gp);WV.gh={ga,gp};}
  const on=!!A[3]&&p.al&&!p.dn;WV.gh.ga.visible=WV.gh.gp.visible=on;if(!on)return;
  const a=p.a||0;let gx=typeof INPUT.gx==='number'?INPUT.gx:p.x+Math.cos(a)*200,gy=typeof INPUT.gy==='number'?INPUT.gy:p.y+Math.sin(a)*200;
  const d=Math.hypot(gx-p.x,gy-p.y);if(d>500){gx=p.x+(gx-p.x)/d*500;gy=p.y+(gy-p.y)/d*500;}
  const yaw=Math.atan2(Math.cos(a),Math.sin(a));
  WV.gh.ga.position.set(tx(gx),GY(gx,gy)+0.06,tz(gy));WV.gh.ga.rotation.y=yaw;
  WV.gh.gp.position.set(tx(p.x+Math.cos(a)*40),GY(p.x,p.y)+0.05,tz(p.y+Math.sin(a)*40));WV.gh.gp.rotation.y=yaw;
  const k=0.55+0.25*Math.sin(performance.now()/140);WV.gh.ga.children[0].material.opacity=k;}
// ---------- ปีกเวทสายลมติดหลัง: ขนนก 8+4 เส้นต่อข้าง ทำจากสายลม (shader) + ริบบิ้นลม + วงเวท ----------
// ต้นแบบ/ปรับหน้าตา: designs/wind-wings-magic.html (ตัวเลขทรงขน/สี/shader ชุดเดียวกัน) • หน่วยต้นแบบ × WWS = เมตรในเกม
const WWS=0.52,WWU={time:{value:0}};
const WW_NOISE=`
  float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){return vn(p)*0.55+vn(p*2.1+3.7)*0.3+vn(p*4.3+7.1)*0.15;}`;
let _wwMat=null;
function wwMats(){if(_wwMat)return _wwMat;
  // premultiplied: สว่างเรืองบนฉากมืด + ยังทึบพอให้เห็นบนฉากสว่าง (additive ล้วนหายบนพื้นขาว)
  const base={transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor};
  // ขน = กระแสลมวิ่งตามแนวขน (โคน→ปลาย) ขอบฟุ้ง ปลายสลายเป็นเกลียวลม ทั้งเส้นพลิ้ว
  const feather=new THREE.ShaderMaterial(Object.assign({uniforms:{time:WWU.time,boost:{value:0}},
    vertexShader:`attribute float layer;uniform float time;varying vec2 vUv;varying float vL;
      void main(){vUv=uv;vL=layer;vec3 p=position;float u=uv.x;
        p.z+=sin(u*7.0-time*5.0+layer*0.9)*0.07*u;p.y+=sin(u*9.0-time*6.5+layer*1.3)*0.045*u*u;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader:`uniform float time,boost;varying vec2 vUv;varying float vL;${WW_NOISE}
      float h(float n){return fract(sin(n)*43758.5453);}
      void main(){float u=vUv.x,v=vUv.y,av=abs(v);
        float n=fbm(vec2(u*3.0-time*1.4,v*2.0+vL*1.7));
        float streams=pow(0.5+0.5*sin(v*9.0+n*5.0+vL*2.3),3.0);
        float gust=smoothstep(0.35,0.85,fbm(vec2(u*5.0-time*3.2,v*3.0+vL)));
        float edge=smoothstep(1.0,0.45+0.4*n,av),tipFade=smoothstep(1.0,0.62+0.3*n,u),rootFade=smoothstep(0.0,0.18,u);
        float cell=floor(u*12.0-time*2.0);
        float spark=step(0.8,h(cell+vL*13.0))*smoothstep(0.3,0.0,abs(fract(u*12.0-time*2.0)-0.5))*smoothstep(0.25,0.0,abs(v-(h(cell*3.1+vL)-0.5)*1.2));
        float a=(0.1+streams*(0.3+0.7*gust)+0.18*n+spark*0.9)*edge*tipFade*rootFade*(1.0+boost*1.4);
        vec3 col=mix(vec3(0.08,0.8,0.42),vec3(0.6,1.0,0.78),clamp(streams*gust*0.8+u*0.2+boost*0.35,0.0,1.0))+vec3(1.0,0.95,0.7)*spark;
        gl_FragColor=vec4(col*a*1.3,clamp(a*1.2,0.0,0.9));}`},base));
  // ริบบิ้นลม = ขีดลมไหลไปตามเส้นโค้งรอบปีก
  const ribbon=new THREE.ShaderMaterial(Object.assign({uniforms:{time:WWU.time,boost:{value:0}},
    vertexShader:`attribute float layer;uniform float time;varying vec2 vUv;varying float vL;
      void main(){vUv=uv;vL=layer;vec3 p=position;p.z+=sin(uv.x*6.0-time*4.0+layer)*0.12;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader:`uniform float time,boost;varying vec2 vUv;varying float vL;
      void main(){float u=vUv.x,av=abs(vUv.y);float k=fract(u*2.2-time*(0.9+fract(vL*0.37)*0.6)+vL*0.31);
        float a=smoothstep(0.0,0.5,k)*smoothstep(1.0,0.6,k)*smoothstep(1.0,0.0,av)*smoothstep(0.0,0.1,u)*smoothstep(1.0,0.85,u)*0.9;
        a*=1.0+boost*1.5;gl_FragColor=vec4(vec3(0.55,1.0,0.8)*a,min(a*0.8,0.9));}`},base));
  // วงเวทลมกลางหลัง (วาดลง canvas ครั้งเดียว)
  const S=256,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');g.translate(S/2,S/2);g.scale(0.5,0.5);
  g.strokeStyle='#bfffe0';g.lineCap='round';const ring=(r,w)=>{g.lineWidth=w;g.beginPath();g.arc(0,0,r,0,6.283);g.stroke();};
  ring(240,4);ring(222,2);ring(150,3);ring(136,1.5);ring(60,2);let sd=7;const rn=()=>(sd=(sd*16807)%2147483647)/2147483647;
  for(let k=0;k<28;k++){g.save();g.rotate(k/28*6.283);g.translate(0,-231);g.lineWidth=2;g.beginPath();for(let j=0;j<3;j++){g.moveTo((rn()-0.5)*12,(rn()-0.5)*10);g.lineTo((rn()-0.5)*12,(rn()-0.5)*10);}g.stroke();g.restore();}
  g.lineWidth=2.5;for(const r0 of [0,Math.PI/3]){g.beginPath();for(let k=0;k<=3;k++){const a=r0+k/3*6.283-Math.PI/2;g[k?'lineTo':'moveTo'](Math.cos(a)*150,Math.sin(a)*150);}g.stroke();}
  for(let k=0;k<6;k++){g.save();g.rotate(k/6*6.283);g.beginPath();g.arc(0,-100,22,0.63,4.71);g.stroke();g.restore();}
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const circle=new THREE.MeshBasicMaterial({map:tex,color:'#3fdf8f',transparent:true,opacity:0.55,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  // รวมขนทั้งปีกเป็นชิ้นเดียว: ท่าพลิ้วของแต่ละเส้น (เดิมหมุน Group รายเส้นใน poseWindWings) ย้ายมาคิดใน shader • ภาพเดิม 34 draw/คน เหลือ 4 • ?nofxbatch = ปิด
  const featherB=feather.clone();featherB.vertexShader=`attribute float layer;attribute vec2 aRoot;uniform float time,uWT,uWrap;varying vec2 vUv;varying float vL;
      void main(){vUv=uv;vL=layer;vec3 p=position;float u=uv.x;
        p.z+=sin(u*7.0-time*5.0+layer*0.9)*0.07*u;p.y+=sin(u*9.0-time*6.5+layer*1.3)*0.045*u*u;
        float a=sin(uWT*2.0-layer*0.3)*0.03-(layer<10.0?layer*0.07:0.2)*uWrap,c=cos(a),s=sin(a);p.xy=vec2(c*p.x-s*p.y,s*p.x+c*p.y)+aRoot;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`;
  return _wwMat={feather,ribbon,circle,featherB};}
// ขน 1 เส้น: เส้นโค้ง bezier P0→C→T กว้าง w ปลายแหลม (uv.x โคน→ปลาย, uv.y −1..1 ขวางขน)
function wwFeatherGeo(P0,C,T,w,layer,z){
  const N=24,pos=[],uv=[],lay=[],idx=[];
  for(let i=0;i<=N;i++){const t=i/N,it=1-t;
    const px=it*it*P0[0]+2*it*t*C[0]+t*t*T[0],py=it*it*P0[1]+2*it*t*C[1]+t*t*T[1];
    let dx=2*it*(C[0]-P0[0])+2*t*(T[0]-C[0]),dy=2*it*(C[1]-P0[1])+2*t*(T[1]-C[1]);const dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;
    const prof=Math.pow(Math.sin(Math.PI*Math.min(1,0.15+t*0.9)),0.7)*(1-Math.pow(t,3)*0.6),wo=w*prof,wi=w*prof*0.55;
    pos.push(px-dy*wi,py+dx*wi,z,px+dy*wo,py-dx*wo,z);uv.push(t,1,t,-1);lay.push(layer,layer);
    if(i<N){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('layer',new THREE.Float32BufferAttribute(lay,1));g.setIndex(idx);return g;}
// ทรงปีกข้างขวา (+x ออกนอก, +y ขึ้น): [โคน, จุดดัดโค้ง, ปลาย, ความกว้าง]
const WW_PRI=[[[0.35,0.55],[2.7,0.9],[3.3,3.4],0.42],[[0.45,0.4],[2.6,0.55],[4.0,2.3],0.38],[[0.55,0.22],[2.6,0.2],[4.2,1.25],0.36],[[0.65,0.05],[2.5,-0.25],[3.85,0.15],0.34],
  [[0.75,-0.1],[2.2,-0.65],[3.2,-0.75],0.32],[[0.85,-0.2],[1.9,-0.95],[2.45,-1.5],0.3],[[0.9,-0.25],[1.5,-1.05],[1.75,-1.95],0.27],[[0.85,-0.25],[1.05,-1.05],[1.05,-2.05],0.24]];
const WW_COV=[[[0.15,0.35],[1.4,1.15],[2.5,0.95],0.34],[[0.25,0.15],[1.3,0.55],[2.2,0.25],0.3],[[0.35,-0.05],[1.2,-0.05],[1.8,-0.5],0.28],[[0.45,-0.15],[1.0,-0.45],[1.25,-1.05],0.24]];
const WW_RIB=[[[0.3,1.0],[2.4,2.9],[4.0,2.9],0.06],[[0.6,0.6],[3.4,1.1],[4.9,1.9],0.05],[[0.7,-0.4],[3.4,-0.3],[4.6,0.5],0.05],[[0.8,-0.9],[2.7,-1.7],[3.4,-2.4],0.05],[[0.6,-1.0],[1.2,-2.2],[0.6,-2.9],0.045]];
let _wwGeo=null;
// Sonic Boom: ชุดเสริมปีก (ใบมีดแสงงอกทีละใบ + ขนนกลอยโค้งเข้าปีก) ระหว่างชาร์จ • ง้างปีกดุก่อนพุ่ง • จบแดชสลายใน 2 วิ
let _wsupG=null;
function windWingSup(d,dt){const S=d.sup,C=W_UL.chg;S.t+=dt;if(S.dis>=0)S.dis+=dt;
  if(!_wsupG){const sh=new THREE.Shape();sh.moveTo(0,-0.09);sh.lineTo(0.72,-0.055);sh.lineTo(1,0);sh.lineTo(0.72,0.055);sh.lineTo(0,0.09);sh.closePath();_wsupG=new THREE.ShapeGeometry(sh);_wsupG.userData.keep=true;}
  if(!S.bl){const mk=c=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:1,depthWrite:false,depthTest:false,side:THREE.DoubleSide,toneMapped:false});S.ma=mk('#10e08c');S.mc=mk('#d8fff0');S.bl=[];S.fe=[];S.gs=[];
    for(const sd of d.sides){const wing=sd.piv.children[0],G=new THREE.Group();wing.add(G);S.gs.push(G);
      for(let i=0;i<9;i++){const b=new THREE.Group(),m=new THREE.Mesh(_wsupG,S.ma),c=new THREE.Mesh(_wsupG,S.mc);c.scale.set(0.92,0.32,1);c.position.z=0.01;m.frustumCulled=c.frustumCulled=false;m.renderOrder=c.renderOrder=4;b.add(m,c);b.position.set(0.35+i*0.05,0.3,0.12);b.rotation.z=-0.28+i*0.215;b.userData={i,L:lerp(5.6,3.6,Math.abs(i-2)/6)};b.scale.setScalar(0.001);G.add(b);S.bl.push(b);}
      for(let i=0;i<14;i++){const m=new THREE.Mesh(_wsupG,S.ma);m.frustumCulled=false;m.renderOrder=4;m.visible=false;const A=-0.3+Math.random()*2,E=3+Math.random()*2;m.userData={t0:0.05+i*(C-0.5)/14,to:[Math.cos(A)*E*0.6,Math.sin(A)*E*0.6,0.1],f:[Math.cos(A+1.2)*7,Math.sin(A+1.2)*7-1,(Math.random()-0.5)*5],s:[Math.cos(A+0.6)*7,Math.sin(A+0.6)*7,(Math.random()-0.5)*7]};G.add(m);S.fe.push(m);}}}
  const pg=Math.min(1,S.t/C),T9=C-0.25;
  for(const b of S.bl){const i=b.userData.i;let g=Math.min(1,Math.max(0,(S.t-i*T9/9)/0.28));if(S.dis>=0)g*=1-Math.min(1,Math.max(0,(S.dis-i*0.1)/1.1));const L=b.userData.L*g;b.scale.set(L,L*0.42,1);}
  for(const m of S.fe){const U=m.userData,u=(S.t-U.t0)/0.55;if(u<0||u>=1||S.dis>=0){m.visible=false;continue;}m.visible=true;const v=1-u,p=(a,b,c)=>v*v*a+2*v*u*b+u*u*c;m.position.set(p(U.f[0],U.s[0],U.to[0]),p(U.f[1],U.s[1],U.to[1]),p(U.f[2],U.s[2],U.to[2]));m.rotation.z=S.t*14+U.t0*9;m.scale.set(0.9,0.75,1);}
  if(S.dis>=0){S.ma.opacity=S.mc.opacity=Math.max(0,1-S.dis/2);if(S.dis>=2){for(const G of S.gs)G.parent.remove(G);S.ma.dispose();S.mc.dispose();d.sup=null;return null;}return{sw:-1.1*(1-Math.min(1,S.dis/1.7)),sc:1.5-0.5*Math.min(1,S.dis/2),b:Math.max(0,0.3-S.dis/6)};}
  if(S.dash)return{sw:-1.5,sc:1.5,b:0.35};
  const pr=Math.max(0,Math.min(1,(S.t-C+0.28)/0.28));return{sw:lerp(-0.15*pg,-1.3,pr),sc:1+0.5*pg,b:0.08+0.27*pg};}
function makeWindWings(){
  const M=wwMats();
  if(!_wwGeo){const rel=(P0,a)=>[a[0]-P0[0],a[1]-P0[1]],f=(L,z0,off)=>L.map(([P0,C,T,w],i)=>({P0,i:i+off,g:wwFeatherGeo([0,0],rel(P0,C),rel(P0,T),w,i+off,z0+i*0.03)}));
    _wwGeo={fe:[...f(WW_PRI,0,0),...f(WW_COV,-0.12,10)],rib:WW_RIB.map(([P0,C,T,w],i)=>wwFeatherGeo(P0,C,T,w,20+i,0.15+i*0.02))};
    if(WB.on){_wwGeo.feM=mergeGeometries(_wwGeo.fe.map(F=>{const g=F.g.clone(),n=g.attributes.position.count,R=new Float32Array(n*2);for(let i=0;i<n;i++){R[i*2]=F.P0[0];R[i*2+1]=F.P0[1];}g.setAttribute('aRoot',new THREE.BufferAttribute(R,2));return g;}),false);_wwGeo.ribM=mergeGeometries(_wwGeo.rib,false);_wwGeo.feM.userData.keep=_wwGeo.ribM.userData.keep=true;}}
  const W=new THREE.Group(),rig=new THREE.Group(),sides=[],fe=[];rig.scale.setScalar(WWS);W.add(rig);
  const boost={value:0},uWT={value:0},uWrap={value:0},mf=(WB.on?M.featherB:M.feather).clone(),mr=M.ribbon.clone();mf.uniforms={time:WWU.time,boost,uWT,uWrap};mr.uniforms={time:WWU.time,boost};   // เรืองต่อคน แต่นาฬิการ่วมกัน
  for(const sd of [1,-1]){const piv=new THREE.Group(),wing=new THREE.Group();wing.scale.x=sd;piv.position.x=sd*0.2;piv.add(wing);rig.add(piv);sides.push({piv,sd});
    if(WB.on){for(const [G,M0] of [[_wwGeo.feM,mf],[_wwGeo.ribM,mr]]){const m=new THREE.Mesh(G,M0);m.frustumCulled=false;m.renderOrder=3;wing.add(m);}continue;}
    for(const F of _wwGeo.fe){const fp=new THREE.Group();fp.position.set(F.P0[0],F.P0[1],0);const m=new THREE.Mesh(F.g,mf);m.frustumCulled=false;m.renderOrder=3;fp.add(m);fp.userData.i=F.i;wing.add(fp);fe.push(fp);}
    for(const g of _wwGeo.rib){const m=new THREE.Mesh(g,mr);m.frustumCulled=false;m.renderOrder=3;wing.add(m);}}
  const circle=new THREE.Mesh(new THREE.PlaneGeometry(3.2,3.2),M.circle);circle.position.set(0,0.2,-0.3);circle.renderOrder=2;rig.add(circle);
  W.userData={sides,fe,circle,boost,uWT,uWrap,t:Math.random()*10,flap:0,wrap:0,fk:-1,ul:-1};return W;}
// สั่งท่าพิเศษจากเหตุการณ์: 'fk' = Featherwing สะบัดปีก • 'ul' = Eye of Heaven
function wwCue(id,k){const o=PM3.get(id);if(o&&o.wWings)o.wWings.userData[k]=0;}
// ท่าปีก: ยืน = กางเกือบนิ่ง (ผู้ใช้ไม่เอากระพือตอนยืน) • บิน Featherwing (big) = ใหญ่ 1.6 เท่า + กระพือ
// guard = ยกโล่ ห่อปีกมาด้านหน้า • fk = สะบัดปีก (ชาร์จง้างหลัง 0.38 วิ → ฟาดมาหน้า) • ul = อัลติ (ห่อ 1.6× เรือง → กางพรึ่บตอนกระแทก 2.38 วิ)
// sw = กวาดปีก: 0 ปกติ • + = มาหน้า/ห่อ • − = ง้างไปหลัง
function poseWindWings(W,big,dt,guard){
  const d=W.userData;d.t+=dt;WWU.time.value=performance.now()/1000;
  if(d.fs)for(const k of [-1,1]){const S=d.fs[k];if(S&&S.t>=0){S.t+=dt;if(S.t>0.42)S.t=-1;}}
  d.flap+=((big?1:0)-d.flap)*Math.min(1,dt*4);
  d.wrap+=((guard?1:0)-d.wrap)*Math.min(1,dt*9);
  let wrap=d.wrap,sw=0,boost=0,sc=1+0.6*d.flap;
  if(d.fk>=0){const k=d.fk+=dt;
    if(k<0.38){const e=k/0.38;sw=-0.7*e;boost=e;}
    else if(k<1.0){const e=(k-0.38)/0.62;sw=-0.7+1.6*Math.min(1,e*5)-0.9*Math.max(0,e-0.2)/0.8;boost=1-e;}
    else d.fk=-1;}
  if(d.ul>=0){const k=d.ul+=dt;
    if(k>1.2&&k<3.2){const e=Math.min(1,(k-1.2)/0.3);wrap=Math.max(wrap,e);sc=Math.max(sc,1+0.6*e);boost=e;}   // 1.2 = W_UL.slam (ตาลืมเต็ม) … 3.2 = W_UL.imp
    else if(k>=3.2&&k<4.12){const e=(k-3.2)/0.92;sw=-0.8*Math.sin(Math.min(1,e*4)*Math.PI/2)*(1-e);sc=Math.max(sc,1.6-0.6*e);boost=1-e;}
    else if(k>=4.12)d.ul=-1;}
  if(d.sl>=0){const k=d.sl+=dt,T=d.slT,D=d.slD,bl=k<T?Math.sin(k/T*Math.PI):0;if(k>T+0.34)d.sl=-1;else if(D===1){if(k<0.05)sw=-0.95*k/0.05;else if(k<T){sw=-0.95+2.4*Math.min(1,(k-0.05)/0.05);boost=Math.max(boost,0.6);}else sw=1.45*(1-(k-T)/0.34);}else if(D===0){if(k<0.04)sw=0.7*k/0.04;else if(k<0.1){sw=0.7-1.9*(k-0.04)/0.06;boost=Math.max(boost,0.4);}else sw=-1.2*(1-(k-0.1)/(T+0.24));}else{if(k<0.05)sw=0.7*k/0.05;else if(k<0.13){sw=0.7-1.9*(k-0.05)/0.08;boost=Math.max(boost,0.5);}else sw=-1.2*(1-(k-0.13)/(T+0.21));}}   // หลัง: ง้างแล้วตบมาหน้าแรง ๆ • หน้า: ลู่ไปหลัง • ม้วนตัว: หุบ
  if(d.pv>=0){const k=d.pv+=dt,W=W_DR.vWind,E=d.pvE;if(k<W){const e=k/W;sw=-0.6*e;boost=Math.max(boost,e);}else if(k<E+0.5){const a=Math.min(1,(k-W)/0.07),h=k<E+0.2?1:1-(k-E-0.2)/0.3;sw=(lerp(-0.6,0.3,a)+(k<E?0.08*Math.sin((k-W)/(W_DR.vGap*2)*Math.PI*2):0))*h;boost=Math.max(boost,0.8*h);}else d.pv=-1;}   // Plume Volley: ง้างปีกไปหลัง แล้วสะบัดมาหน้าตอนขนพุ่ง
  if(d.db>=0){const k=d.db+=dt,T=W_WL.dbTele;if(k<T)sw=-0.4*Math.min(1,k/(T*0.7));else if(k<T+0.72){const a=Math.min(1,(k-T)/0.05),h=k<T+0.42?1:1-(k-T-0.42)/0.3;sw=lerp(-0.4,0.6,a)*h;boost=Math.max(boost,(1-a*0.5)*h);}else d.db=-1;}   // Downburst: ปีกง้างขึ้นไปหลัง แล้วตบลงมาด้านหน้าตอนฟาด
  if(d.du>=0){d.du+=dt;if(d.du>WNV.dsCh+WNV.dsUpT+0.1)d.du=-1;}
  d.gl=(d.gl||0)+((d.du>=0||d.gh?1:0)-(d.gl||0))*Math.min(1,dt*9);sw=lerp(sw,-0.3,d.gl);sc*=1+0.1*d.gl;   // Dash + ร่อน: กางปีกออกค้างไว้ ไม่กระพือ (ผู้ใช้ 2026-11-09)
  if(d.sup){const q=windWingSup(d,dt);if(q){sw=q.sw;sc=Math.max(sc,q.sc);boost=Math.max(boost,q.b);}}
  sw+=d.airSw||0;   // ท่าบิน: ไปหน้า ปีกลู่หลัง • ถอยหลัง ปีกมาหน้า
  const fl=Math.sin(d.t*(big?3.2:1.2))*(0.04+0.14*d.flap)*(1-wrap)*(1-d.gl);
  d.boost.value=boost;
  W.scale.setScalar(sc*(1-0.35*wrap));
  for(const {piv,sd} of d.sides){const S=d.fs&&d.fs[sd],q=S&&S.t>=0?Math.sin(Math.min(1,S.t/0.42)*Math.PI):0;piv.scale.setScalar(1+0.3*q);piv.rotation.y=-sd*(0.3+sw+wrap*1.0+fl+0.32*q);piv.rotation.z=sd*(fl*0.35-wrap*0.45+0.12*q);}   // q = ปีกที่ยิงขนนก ยืดขึ้นและขยับมาหน้าแว้บหนึ่ง
  d.uWT.value=d.t;d.uWrap.value=wrap;for(const f of d.fe){const i=f.userData.i;f.rotation.z=Math.sin(d.t*2.0-i*0.3)*0.03-(i<10?i*0.07:0.2)*wrap;}
  d.circle.rotation.z=d.t*(0.25+boost);d.circle.visible=wrap<0.5;}
