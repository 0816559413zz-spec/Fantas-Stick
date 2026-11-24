// =====================================================================
//  Ragdoll (ตัวอ่อนปวกเปียก) ของผู้เล่น — ภาพบนเครื่องตัวเองล้วน ไม่แตะ sim / hitbox / snapshot / protocol
//  จุดข้อต่อ 20 จุด (verlet แบบ position-based) ต่อกันด้วยแท่ง → หมุนกระดูกโมเดลไฟล์ char_student ตาม
//  โหมด: 'dead'  ตาย → ล้มตามแรงที่โดน ค้างจนเกิดใหม่ (นานเกิน RAG.SINK วิ = ค่อยๆ จมดินหาย)
//        'down'  ล้มรอชุบ (coop) → ล้มกองตามพื้นจริง พอลุก (dn หาย) ค่อยๆ กลับท่าปกติ
//        'knock' โดนกระแทกแรง → สะโพก/ขาตามตัวจริง ส่วนบน แขน หัว สะบัดแป๊บเดียวแล้วกลับท่าปกติ
//  เรียกจาก syncPlayers (js/35) หลัง rigSync • ทิศที่โดนตีจาก event 'hit' (sx/sy) → o.lhit (js/26)
//  ตัวเลขข้างล่างเป็นค่าภาพล้วน (ไม่ใช่ตัวเลขเกม) ปรับได้ตามชอบ
// =====================================================================
const RAG={
  G:-22,           // แรงโน้มถ่วงของตัวอ่อน (หน่วย/วินาที²)
  IT:8,            // รอบแก้แท่ง/ข้อต่อต่อเฟรม (มาก = แข็งขึ้น)
  PUSH:6,          // แรงผลักออกจากทิศที่โดนตีตอนตาย/ล้ม (หน่วย/วิ)
  SINK:[4,0.7],    // ศพค้าง 4 วิ แล้วจมดิน 0.7 วิ (ถ้ายังไม่เกิดใหม่ — ปกติเกิดใหม่ก่อน)
  KNOCK_SP:14,     // ตัวพุ่งเร็วกว่านี้ (หน่วย/วิ) ภายใน KNOCK_WIN วิหลังโดนตี = "กระแทกแรง"
  KNOCK_WIN:0.35,
  KNOCK_T:0.75,    // นานเท่าไหร่ (วิ)
  KNOCK_K:[12,40], // สปริงดึงส่วนบนกลับท่าปกติ [ตอนเริ่ม, เพิ่มจนจบ] (น้อย = เอนมาก)
  KNOCK_LEAD:1.2,  // ส่วนบนพุ่งนำตัว (เท่าของความเร็วตัว) = ลำตัวเอนไปตามทิศที่กระเด็น
  BACK_T:0.4,      // ช่วงค่อยๆ กลับท่าปกติ (วิ)
};
// จุดข้อต่อ: [กระดูก, ระยะไปตามแกน Y ของกระดูก (ปลายกระดูก), รัศมีชนพื้น]
const RAGJ=[['hips',0,0.13],['chest',0,0.15],['neck',0,0.12],['head',0.4,0.15],
  ['upper_arm_L',0,0.08],['forearm_L',0,0.06],['hand_L',0,0.05],['hand_L',0.12,0.04],
  ['upper_arm_R',0,0.08],['forearm_R',0,0.06],['hand_R',0,0.05],['hand_R',0.12,0.04],
  ['thigh_L',0,0.09],['shin_L',0,0.07],['foot_L',0,0.06],['foot_L',0.18,0.04],
  ['thigh_R',0,0.09],['shin_R',0,0.07],['foot_R',0,0.06],['foot_R',0.18,0.04]];
// กระดูกที่ขับ (พ่อก่อนลูก): ลำตัวล่าง 'L' / ลำตัวบน 'U' / ท่อน [จุดต้น, จุดปลาย]
const RAGB=[['hips','L'],['spine','L'],['chest','U'],['neck',[2,3]],['head',[2,3]],
  ['upper_arm_L',[4,5]],['forearm_L',[5,6]],['hand_L',[6,7]],['upper_arm_R',[8,9]],['forearm_R',[9,10]],['hand_R',[10,11]],
  ['thigh_L',[12,13]],['shin_L',[13,14]],['foot_L',[14,15]],['thigh_R',[16,17]],['shin_R',[17,18]],['foot_R',[18,19]]];
// แท่ง: [a,b,ความแข็ง] — ท่อนแขนขา + โครงลำตัว (กันลำตัวพับ)
const RAGS=[[0,1,1],[1,2,1],[2,3,1],[0,2,0.4],[1,3,0.5],
  [4,5,1],[5,6,1],[6,7,1],[8,9,1],[9,10,1],[10,11,1],[12,13,1],[13,14,1],[14,15,1],[16,17,1],[17,18,1],[18,19,1],
  [0,12,1],[0,16,1],[12,16,1],[1,4,1],[1,8,1],[4,8,1],[2,4,1],[2,8,1],[12,1,0.6],[16,1,0.6],[0,4,0.6],[0,8,0.6],[3,4,0.3],[3,8,0.3]];
// ระยะต่ำสุด (กันพับจนทะลุตัว): [a,b,สัดส่วนของความยาวท่อนรวม, ท่อน1, ท่อน2]
const RAGMIN=[[12,14,0.55,12,13],[16,18,0.55,16,17],[4,6,0.35,4,5],[8,10,0.35,8,9]];
// ข้อพับทางเดียว: [ต้น, ข้อ, ปลาย, ฐานลำตัว 'L'/'U', ทิศ (+1 = ข้อพับไปหน้า เช่นเข่าดันไปหน้า, -1 = ข้อศอกพับไปหลัง)]
const RAGHINGE=[[12,13,14,'L',1],[16,17,18,'L',1],[4,5,6,'U',-1],[8,9,10,'U',-1]];
const _rv1=new THREE.Vector3(),_rv2=new THREE.Vector3(),_rv3=new THREE.Vector3(),_rqa=new THREE.Quaternion(),_rqb=new THREE.Quaternion(),_rm=new THREE.Matrix4();
const _ragFw=new THREE.Vector3();
function ragBones(o){
  if(o.ragB!==undefined)return o.ragB;
  const inst=o.fileModel;if(!inst)return null;
  const B={};for(const [n] of RAGB){const b=inst.getObjectByName(n);if(!b||!b.isBone){o.ragB=null;return null;}B[n]=b;}
  return o.ragB=B;
}
// ฐานแกนลำตัว (ขวา, ขึ้น, หน้า) จากจุด → quaternion
function ragBasis(P,k,q){
  const a=k==='L'?0:1,b=k==='L'?1:2,l=k==='L'?12:4,r=k==='L'?16:8;
  const u=_rv1.subVectors(P[b],P[a]).normalize(),s=_rv2.subVectors(P[r],P[l]);
  s.addScaledVector(u,-s.dot(u));if(s.lengthSq()<1e-8)s.set(1,0,0);s.normalize();
  const f=_rv3.crossVectors(s,u);
  return q.setFromRotationMatrix(_rm.makeBasis(s,u,f));
}
// อ่านท่าปัจจุบัน (หลัง animation + rigSync) = เป้า
function ragTargets(o,R){
  o.g.updateMatrixWorld(true);
  const B=R.B;
  RAGJ.forEach(([n,len],i)=>{const b=B[n];if(len)R.T[i].set(0,len,0).applyMatrix4(b.matrixWorld);else R.T[i].setFromMatrixPosition(b.matrixWorld);});
  for(const [n] of RAGB)B[n].getWorldQuaternion(R.TQ[n]);
}
function ragStart(o,p,mode,now){
  const B=ragBones(o);if(!B)return;
  const R={mode,t:0,B,T:RAGJ.map(()=>new THREE.Vector3()),TQ:{},P:[],V:[],Q0:{},D0:{},M0:{},WQ:{},DQ:{},F:{},back:-1,BQ:{},BP:new THREE.Vector3(),LA:{},LW:{}};
  for(const [n] of RAGB){R.TQ[n]=new THREE.Quaternion();R.WQ[n]=new THREE.Quaternion();R.DQ[n]=new THREE.Quaternion();R.BQ[n]=new THREE.Quaternion();}
  ragTargets(o,R);
  R.P=R.T.map(v=>v.clone());
  for(const [n] of RAGB)R.Q0[n]=R.TQ[n].clone();
  for(const [n,d] of RAGB)if(Array.isArray(d))R.D0[n]=new THREE.Vector3().subVectors(R.P[d[1]],R.P[d[0]]);
  R.M0.L=ragBasis(R.P,'L',new THREE.Quaternion());R.M0.U=ragBasis(R.P,'U',new THREE.Quaternion());
  R.L=RAGS.map(([a,b])=>R.P[a].distanceTo(R.P[b]));
  R.MN=RAGMIN.map(([a,b,f,s1,s2])=>f*(R.P[s1].distanceTo(R.P[s1+1])+R.P[s2].distanceTo(R.P[s2+1])));
  // ทิศ "หน้า" ของลำตัวในแกนฐาน (จากปลายเท้า) → ใช้บอกทางพับเข่า/ศอก
  const fw=_rv1.subVectors(R.P[15],R.P[14]).add(_rv2.subVectors(R.P[19],R.P[18]));fw.y=0;if(fw.lengthSq()<1e-6)fw.set(Math.sin(o.g.rotation.y),0,Math.cos(o.g.rotation.y));fw.normalize();
  R.F.L=fw.clone().applyQuaternion(_rqa.copy(R.M0.L).invert());R.F.U=fw.clone().applyQuaternion(_rqa.copy(R.M0.U).invert());
  // ความเร็วเริ่ม = ความเร็วตัว + แรงผลักออกจากทิศที่โดนตี (ส่วนบนโดนมากสุด → ล้มหงาย/คว่ำตามทิศ)
  const bv=new THREE.Vector3(o.svx||0,0,o.svz||0);if(bv.length()>30)bv.setLength(30);
  const h=o.lhit&&now-o.lhit.t<1500?o.lhit:null;
  const fatal=mode==='dead'?o.deathImpact:null;
  let dx=0,dz=0;
  if(Number.isFinite(fatal?.angle)){dx=Math.cos(fatal.angle);dz=Math.sin(fatal.angle);}
  else if(h&&h.sx!==undefined){dx=p.x-h.sx;dz=p.y-h.sy;}else if(bv.lengthSq()>1){dx=bv.x;dz=bv.z;}else{dx=-fw.x;dz=-fw.z;}
  const dl=Math.hypot(dx,dz)||1;dx/=dl;dz/=dl;
  const UP=[0.35,1,1,1.1,1,1,1,1,1,1,1,1,0.1,0.05,0,0,0.1,0.05,0,0];
  const push=mode==='knock'?0:fatal?clamp(5+(fatal.power||0)*.12,6.5,12):RAG.PUSH*(0.85+Math.random()*0.3);
  if(fatal)bv.multiplyScalar(.18);
  R.V=R.P.map((_,i)=>{
    const weight=fatal?.weapon==='whip'?lerp(.62,1,UP[i]):fatal?lerp(.72,1,UP[i]):UP[i];
    const lead=mode==='knock'&&UP[i]>.5?RAG.KNOCK_LEAD:1;
    return new THREE.Vector3(bv.x*lead+dx*push*weight+rnd(-.4,.4),mode==='knock'?0:fatal?lerp(2.9,4.9,UP[i]):1.2*UP[i]+rnd(-.2,.2),bv.z*lead+dz*push*weight+rnd(-.4,.4));
  });
  o.rag=R;
}
// ช่วงกลับท่าปกติ: จำท่าล่าสุด (world) แล้วค่อยๆ หมุนเข้าหาท่าจาก animation
function ragBack(R){if(R.back>=0)return;R.back=0;for(const [n] of RAGB)R.BQ[n].copy(R.WQ[n]);R.BP.copy(R.P[0]);}
function ragFloor(X,Z){return TW(X,Z);}
function ragStep(o,R,dt){
  const P=R.P,V=R.V,T=R.T,g=RAG.G;
  const knock=R.mode==='knock',sinkK=R.mode==='dead'&&R.t>RAG.SINK[0]?Math.min(1,(R.t-RAG.SINK[0])/RAG.SINK[1]):0;
  const prev=P.map(v=>v.clone());
  // ถูกตรึง: 'knock' สะโพก+ขาตามตัวจริง ส่วนบนมีสปริงดึงกลับ (ดึงแรงขึ้นเรื่อยๆ) • 'down' สะโพกถูกดึงเบาๆ ถ้าตัวจริงเลื่อนไปไกล
  const kt=knock?R.t/RAG.KNOCK_T:0;
  for(let i=0;i<P.length;i++){
    V[i].y+=g*dt*(knock?0.5:1);
    V[i].multiplyScalar(Math.exp(-(knock?2.5:0.6)*dt));
    P[i].addScaledVector(V[i],dt);
    if(knock){
      const hard=i===0||i>=12;
      if(hard)P[i].copy(T[i]);
      else P[i].lerp(T[i],1-Math.exp(-(i>=4?0.6:1)*(RAG.KNOCK_K[0]+kt*kt*RAG.KNOCK_K[1])*dt));   // แขนสปริงอ่อนกว่า = สะบัดมากกว่า
    }
  }
  if(R.mode==='down'){
    const gx=o.g.position.x,gz=o.g.position.z,ex=gx-P[0].x,ez=gz-P[0].z,d=Math.hypot(ex,ez);
    if(d>0.8){const k=(d-0.8)/d*(1-Math.exp(-4*dt));for(const q of P){q.x+=ex*k;q.z+=ez*k;}}
  }
  const nearO=[];const sx0=P[0].x*20+MW/2,sy0=P[0].z*20+MH/2;
  for(const ob of OBS)if(Math.abs(ob.x-sx0)<ob.r+70+Math.abs(ob.hx||0)&&Math.abs(ob.y-sy0)<ob.r+70+Math.abs(ob.hy||0))nearO.push(ob);
  for(let it=0;it<RAG.IT;it++){
    for(let s=0;s<RAGS.length;s++){
      const [a,b,st]=RAGS[s],pa=P[a],pb=P[b];
      _rv1.subVectors(pb,pa);const d=_rv1.length()||1e-6,e=(d-R.L[s])/d*0.5*st;
      const wa=knock&&(a===0||a>=12)?0:1,wb=knock&&(b===0||b>=12)?0:1,ws=wa+wb;if(!ws)continue;
      pa.addScaledVector(_rv1,e*2*wa/ws);pb.addScaledVector(_rv1,-e*2*wb/ws);
    }
    for(let m=0;m<RAGMIN.length;m++){
      const [a,b]=RAGMIN[m],mn=R.MN[m];
      _rv1.subVectors(P[b],P[a]);const d=_rv1.length()||1e-6;if(d>=mn)continue;
      const e=(d-mn)/d*0.5;P[a].addScaledVector(_rv1,e);P[b].addScaledVector(_rv1,-e);
    }
    // ข้อพับทางเดียว: ถ้าข้อ (เข่า/ศอก) ไปผิดฝั่งของเส้นต้น-ปลาย → ดันกลับ
    for(const [a,j,c,k,sg] of RAGHINGE){
      const fw=_ragFw.copy(R.F[k]).applyQuaternion(ragBasis(P,k,_rqb));
      _rv1.addVectors(P[a],P[c]).multiplyScalar(0.5);_rv2.subVectors(P[j],_rv1);
      const side=_rv2.dot(fw)*sg;
      if(side<0){P[j].addScaledVector(fw,-side*sg*0.6);P[a].addScaledVector(fw,side*sg*0.2);P[c].addScaledVector(fw,side*sg*0.2);}
    }
    // พื้น + เสา/หิน (OBS)
    if(!sinkK)for(let i=0;i<P.length;i++){
      if(knock&&(i===0||i>=12))continue;
      const q=P[i],r=RAGJ[i][2],fl=ragFloor(q.x,q.z)+r;
      if(q.y<fl)q.y=fl;
      if(nearO.length){
        const qx=q.x*20+MW/2,qy=q.z*20+MH/2;
        for(const ob of nearO){
          const top=ob.top!==undefined?ob.top:ragFloor(tx(ob.x),tz(ob.y))+(ob.hgt||9);
          if(q.y>top)continue;
          obsCP(ob,qx,qy);const ddx=qx-OCX,ddy=qy-OCY,dd=Math.hypot(ddx,ddy),rr=ob.r+r*20;
          if(dd<rr&&dd>1e-3){const k=(rr-dd)/dd/20;q.x+=ddx*k;q.z+=ddy*k;}
        }
      }
    }
  }
  if(sinkK)for(const q of P)q.y-=dt*1.2;
  // ความเร็วจากการเลื่อนจริง + แรงเสียดทานตอนแตะพื้น
  for(let i=0;i<P.length;i++){
    V[i].subVectors(P[i],prev[i]).divideScalar(dt).clampLength(0,22);
    if(!sinkK&&P[i].y<=ragFloor(P[i].x,P[i].z)+RAGJ[i][2]+0.02){const f=Math.exp(-14*dt);V[i].x*=f;V[i].z*=f;if(V[i].y<0)V[i].y=0;}
  }
  // launch (js/12-launch): whole body follows the real sim position (XZ always, Y while airborne), after velocities so the shift adds no speed — shape/tumble stays free
  if(R.mode==='launch'){
    const g=o.g.position,air=g.y>ragFloor(g.x,g.z)+0.2;
    _rv1.subVectors(T[0],P[0]);if(!air)_rv1.y=0;
    for(const q of P)q.add(_rv1);
    _rv2.copy(V[0]);if(!air)_rv2.y=0;for(const w of V)w.sub(_rv2);   // keep only motion relative to the hips
  }
}
// จุด → หมุนกระดูก (world): ลำตัว = ฐานแกน, แขนขา = หมุนตามท่อน ต่อจากการหมุนของพ่อ
function ragPose(R){
  const P=R.P;
  ragBasis(P,'L',_rqa);R.DQ.L=(R.DQ.L||new THREE.Quaternion()).copy(_rqa).multiply(_rqb.copy(R.M0.L).invert());
  ragBasis(P,'U',_rqa);R.DQ.U=(R.DQ.U||new THREE.Quaternion()).copy(_rqa).multiply(_rqb.copy(R.M0.U).invert());
  for(const [n,d] of RAGB){
    if(!Array.isArray(d)){R.DQ[n].copy(R.DQ[d]);}
    else{
      const par=R.B[n].parent.name,pre=R.DQ[par]||R.DQ.U;
      _rv1.copy(R.D0[n]).applyQuaternion(pre).normalize();_rv2.subVectors(P[d[1]],P[d[0]]).normalize();
      R.DQ[n].setFromUnitVectors(_rv1,_rv2).multiply(pre);
    }
    R.WQ[n].copy(R.DQ[n]).multiply(R.Q0[n]);
  }
}
// เขียนกระดูก: ตำแหน่งสะโพกก่อน แล้ว world → local ทีละชิ้น (พ่อก่อนลูก อัปเดตลูกหลานทันที เผื่อมีกระดูกคั่นกลางที่ไม่ได้ขับ)
function ragWrite(R,WQ,hipPos){
  const B=R.B,h=B.hips,S=(k,v)=>{(R.LA[k]=R.LA[k]||v.clone()).copy(v);};
  S('hp',h.position);h.position.copy(h.parent.worldToLocal(_rv1.copy(hipPos)));(R.LW.hp=R.LW.hp||h.position.clone()).copy(h.position);
  for(const [n] of RAGB){
    const b=B[n];S(n,b.quaternion);
    b.quaternion.copy(b.parent.getWorldQuaternion(_rqa).invert().multiply(WQ[n]));
    (R.LW[n]=R.LW[n]||b.quaternion.clone()).copy(b.quaternion);
    b.updateWorldMatrix(false,true);
  }
}
// AnimationMixer ไม่เขียนกระดูกซ้ำถ้าค่าในท่าไม่เปลี่ยน (เช่นท่ายืนนิ่ง) → ค่าที่ ragdoll เขียนจะค้าง
// จึงจำค่าก่อนเขียน (LA) กับค่าที่เขียน (LW): เฟรมต่อมาถ้ากระดูกยังเป็น LW เป๊ะ = mixer ไม่ได้แตะ → คืน LA เอง
function ragRestore(R){
  for(const [n] of RAGB){const b=R.B[n];if(R.LW[n]&&b.quaternion.equals(R.LW[n]))b.quaternion.copy(R.LA[n]);}
  const h=R.B.hips;if(R.LW.hp&&h.position.equals(R.LW.hp))h.position.copy(R.LA.hp);
}
function ragEnd(o){if(o.rag)ragRestore(o.rag);o.rag=null;}
// เรียกทุกเฟรมจาก syncPlayers หลังจัดท่าเสร็จ — คืน true ถ้ากำลังเป็น ragdoll
function ragTick(o,p,v,dt,now){
  if(!o.fileModel||p.gh){if(o.rag)ragEnd(o);return false;}
  const dead=!p.al,down=!!p.dn;
  if(dead&&o.deathImpact){
    const I=o.deathImpact;
    if(o.flashT>0){o.g.visible=true;return true;}
    if(!I.played){
      I.played=true;ragEnd(o);o.ragWasAl=true;
      if(I.weapon==='frost'||I.weapon==='scythe')I.split=deathSlashSplit(o,I);
    }
    if(I.split){o.g.visible=false;return true;}
  }
  let R=o.rag;
  // เริ่ม
  if(!R){
    if(dead&&o.ragWasAl)ragStart(o,p,'dead',now);
    else if(down&&!o.ragWasDn)ragStart(o,p,'down',now);
    else if(!dead&&!down&&p.lr)ragStart(o,p,'launch',now);
    else if(!dead&&!down&&!p.fl&&!p.ds&&!(p.wn&&p.wn[5]>=1)&&o.lhit&&now-o.lhit.t<RAG.KNOCK_WIN*1000&&v&&v.sp>RAG.KNOCK_SP)ragStart(o,p,'knock',now);
    R=o.rag;
  }else{
    // เปลี่ยนสถานะ: เกิดใหม่ = จบทันที • ตายระหว่างล้ม/กระแทก = เปลี่ยนเป็นศพ • ลุก/กระแทกหมด = ค่อยๆ กลับท่า
    if(R.mode==='dead'&&!dead){ragEnd(o);R=null;}
    else if(dead&&R.mode!=='dead'){R.mode='dead';R.back=-1;R.t=0;}
    else if(down&&R.mode==='knock'){R.mode='down';R.back=-1;R.t=0;}
    else if(R.mode==='down'&&!down)ragBack(R);
    else if(R.mode==='knock'&&R.t>=RAG.KNOCK_T)ragBack(R);
    else if(p.lr&&!dead&&!down&&(R.mode!=='launch'||R.back>=0)){R.mode='launch';R.back=-1;R.t=0;}   // launched (again)
    else if(R.mode==='launch'&&!p.lr)ragBack(R);
  }
  o.ragWasAl=!!p.al;o.ragWasDn=down;
  if(!R)return false;
  dt=Math.min(dt,1/30);R.t+=dt;
  ragRestore(R);ragTargets(o,R);
  if(R.back>=0){
    R.back+=dt;const w=Math.min(1,R.back/RAG.BACK_T),k=w*w*(3-2*w);
    for(const [n] of RAGB)R.WQ[n].slerpQuaternions(R.BQ[n],R.TQ[n],k);
    ragWrite(R,R.WQ,_rv3.copy(R.BP).lerp(R.T[0],k));
    if(w>=1){ragEnd(o);return false;}
    return true;
  }
  if(dt>0)ragStep(o,R,dt);
  ragPose(R);ragWrite(R,R.WQ,R.P[0]);
  if(R.mode==='dead')o.g.visible=R.t<=RAG.SINK[0]+RAG.SINK[1];
  return true;
}
// ศพ: ซ่อนของที่ติดตัวตอนยังมีชีวิต (โล่ ดาว มึน ไม้กวาด วงใต้เท้า แสงปลายไม้ สถานะ)
function ragHideDead(o,p,now){
  o.shield.visible=o.stars.visible=o.cocoon.visible=o.broom.visible=o.ring.visible=false;
  if(o.fsh)o.fsh.visible=false;
  o.tip.scale.setScalar(0.001);
  statusFX(o,0,p.x,p.y,o.zs||0,2.2,now);
}

// Map initialization may call cleanup before the first match.
var deathFades;
function clearDeathFades(){
  if(!deathFades?.size)return;
  for(let i=FIREV.length-1;i>=0;i--){
    const v=FIREV[i];
    if(!deathFades.has(v.g))continue;
    v.fn(v,1);FIREV.splice(i,1);
  }
}
// Slash-split piece material: own world-space plane cut (discard) instead of three's clippingPlanes — renderer.compile() ignores
// clipping state, so a clipping program could not be warmed up and compiled mid-fight on the first frost/scythe kill (0.3–0.9 s)
function deathClipMat(original,clipU){
  const m=original.clone(),ob=original.onBeforeCompile;
  m.onBeforeCompile=function(sh,r){ob.call(this,sh,r);sh.uniforms.uDc=clipU;
    sh.vertexShader='varying vec3 vDcW;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvDcW=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader='varying vec3 vDcW;uniform vec4 uDc;\n'+sh.fragmentShader.replace('#include <clipping_planes_fragment>','if(dot(vDcW,uDc.xyz)+uDc.w<0.0)discard;\n#include <clipping_planes_fragment>');};
  m.customProgramCacheKey=()=>original.customProgramCacheKey()+'|dclip';
  m.transparent=true;m.depthWrite=false;m.forceSinglePass=true;return m;}
function deathSlashSplit(o,hit){
  const source=o.fileModel,cloner=MODELS.lib?.SU,hips=ragBones(o)?.hips;
  if(!source||!cloner||!hips)return false;
  o.g.updateMatrixWorld(true);
  const seam=hips.getWorldPosition(new THREE.Vector3()),base=o.g.position;
  const angle=hit.angle??(-o.g.rotation.y-Math.PI*.5),dx=Math.cos(angle),dz=Math.sin(angle);
  const axis=new THREE.Vector3(dz,0,-dx),root=new THREE.Group(),materials=new Set(),skeletons=new Set();
  root.name='Slash defeat pieces';
  const pieces=[true,false].map(upper=>{
    const group=new THREE.Group(),model=cloner.clone(source),cache=new Map();
    const pivot=new THREE.Vector3(seam.x,upper?seam.y:base.y,seam.z);
    group.position.copy(pivot);root.add(group);group.add(model);
    source.matrixWorld.decompose(model.position,model.quaternion,model.scale);model.position.sub(pivot);
    const normal=new THREE.Vector3(0,upper?1:-1,0),edge=new THREE.Vector3(0,seam.y-pivot.y,0),plane=new THREE.Plane();
    const clipU={value:new THREE.Vector4(0,1,0,1e9)};
    model.traverse(part=>{
      if(!part.isMesh)return;
      if(/^wand_/.test(part.name)){part.visible=false;return;}
      if(part.isSkinnedMesh)skeletons.add(part.skeleton);
      const clip=original=>{
        if(cache.has(original))return cache.get(original);
        const m=deathClipMat(original,clipU);
        materials.add(m);cache.set(original,m);return m;
      };
      part.material=Array.isArray(part.material)?part.material.map(clip):clip(part.material);
      part.castShadow=false;part.frustumCulled=false;
    });
    return {upper,group,pivot,normal,edge,plane,clipU};
  });
  (deathFades??=new Set()).add(root);
  fireTemp(root,[],1.25,(_v,k)=>{
    if(k>=1){root.removeFromParent();root.clear();for(const m of materials)m.dispose();for(const s of skeletons)s.dispose();deathFades.delete(root);return;}
    const t=k*1.25,u=clamp(t/.69,0,1),s=1-(1-u)**2,fall=_cs(clamp((t-.13)/.45,0,1));
    for(const P of pieces){
      const Q=P.group;Q.position.copy(P.pivot);
      if(P.upper){
        Q.position.x+=dx*3.7*s-dz*.58*Math.sin(Math.PI*u);
        Q.position.z+=dz*3.7*s+dx*.58*Math.sin(Math.PI*u);
        const floor=TW(Q.position.x,Q.position.z);
        Q.position.y=Math.max(floor+.25,lerp(P.pivot.y,floor+.34,_cs(u))+1.25*Math.sin(Math.PI*u));
        Q.quaternion.setFromAxisAngle(axis,1.65*s);
      }else{
        Q.position.x+=dx*.44*fall;Q.position.z+=dz*.44*fall;
        Q.quaternion.setFromAxisAngle(axis,1.42*fall);
      }
      Q.updateMatrixWorld(true);
      P.plane.setFromNormalAndCoplanarPoint(P.normal,P.edge).applyMatrix4(Q.matrixWorld);
      P.clipU.value.set(P.plane.normal.x,P.plane.normal.y,P.plane.normal.z,P.plane.constant);
    }
    const opacity=1-_cs(clamp((t-.79)/.46,0,1));
    for(const m of materials)m.opacity=opacity;
  });
  return true;
}
const DD_ALPHA=['opacity','uOpacity','uAlpha','alpha','uFade','fade','uA'];
function deathDissolve(sources){
  const root=new THREE.Group(),materials=new Map(),geometries=new Map(),seen=new Set();
  root.name='Player death dissolve';
  const fade={value:1};
  for(const source of sources){
    if(!source||!source.isObject3D)continue;   // fx layers may hold non-Object3D handles
    source.updateWorldMatrix(true,true);
    source.traverseVisible(part=>{
      if(seen.has(part)||!part.material||!part.layers.test(cam.layers)||part.isSkinnedMesh||
        !(part.isMesh||part.isSprite||part.isPoints||part.isLine))return;
      if(part.isInstancedMesh&&!part.count||part.geometry?.isInstancedBufferGeometry&&!part.geometry.instanceCount)return;
      const list=Array.isArray(part.material)?part.material:[part.material];
      if(list.every(m=>!m.visible||m.opacity<=0))return;
      seen.add(part);
      let copy;
      if(part.isInstancedMesh){
        copy=new THREE.InstancedMesh(part.geometry,part.material,part.count);
        copy.instanceMatrix.copy(part.instanceMatrix);
        if(part.instanceColor)copy.instanceColor=part.instanceColor.clone();
      }else if(part.isSprite){
        copy=new THREE.Sprite();copy.center.copy(part.center);
      }else if(part.isPoints)copy=new THREE.Points();
      else if(part.isLine)copy=part.isLineSegments?new THREE.LineSegments():new THREE.Line();
      else copy=new THREE.Mesh();
      if(!part.isSprite)copy.geometry=part.geometry;
      if(!part.isSprite&&part.geometry&&!part.geometry.userData.keep){
        if(!geometries.has(part.geometry))geometries.set(part.geometry,part.geometry.clone());
        copy.geometry=geometries.get(part.geometry);
      }
      const mapped=list.map(sourceMaterial=>{
        if(!materials.has(sourceMaterial)){
          const material=sourceMaterial.clone();
          material.transparent=true;material.depthWrite=false;material.forceSinglePass=true;
          if(material.isShaderMaterial){
            // same shader text = same program (PRELOAD-STANDARD rule: no shader text built mid-fight). Fade through the
            //   effect's own alpha uniform when it has one; otherwise it stays as is and is hidden halfway (fadeK).
            for(const [key,uniform] of Object.entries(sourceMaterial.uniforms))if(uniform.value?.isTexture)material.uniforms[key].value=uniform.value;
            const ak=DD_ALPHA.find(k=>typeof material.uniforms[k]?.value==='number');
            materials.set(sourceMaterial,{material,opacity:ak?material.uniforms[ak].value:1,ak,fadeK:!ak});
            return material;
          }else{
            material.onBeforeCompile=sourceMaterial.onBeforeCompile;
            const key=sourceMaterial.customProgramCacheKey();
            material.customProgramCacheKey=()=>key;
          }
          materials.set(sourceMaterial,{material,opacity:sourceMaterial.opacity});
        }
        return materials.get(sourceMaterial).material;
      });
      copy.material=Array.isArray(part.material)?mapped:mapped[0];
      copy.name=part.name;
      part.matrixWorld.decompose(copy.position,copy.quaternion,copy.scale);
      copy.matrixAutoUpdate=true;copy.castShadow=false;copy.frustumCulled=false;copy.renderOrder=part.renderOrder;
      root.add(copy);
    });
  }
  if(!root.children.length)return;
  (deathFades??=new Set()).add(root);
  fireTemp(root,[],.62,(_v,k)=>{
    if(k>=1){
      // materials are not disposed: three deletes a program with its last material, and the next death would compile it again
      for(const geometry of geometries.values())geometry.dispose();
      for(const part of root.children)if(part.isInstancedMesh)part.dispose();
      root.clear();root.removeFromParent();deathFades.delete(root);return;
    }
    const left=1-k*k*(3-2*k);
    root.position.y=.18*k;
    fade.value=left;
    for(const {material,opacity,ak,fadeK} of materials.values()){
      if(!material.isShaderMaterial)material.opacity=opacity*left;
      else if(ak)material.uniforms[ak].value=opacity*left;
      else if(fadeK)material.visible=left>.5;}
  });
}
function deathVisualSync(o,p,wasVisible){
  const down=!p.al||p.dn;
  if(!down){
    if(o.deathHidden){
      for(const [obj,visible] of o.deathHidden)obj.visible=visible;
      o.deathHidden=null;
      o.deathImpact=null;
    }
    return;
  }
  if(o.deathHidden)return;
  const attachments=[o.wandG,o.tip,o.darkGear,o.shield,o.fsh,o.fshR,o.fw?.g,o.fwLk,o.wShell,
    ...(o.fwx||[]).map(weapon=>weapon.g)];
  o.fileModel?.traverse(part=>{if(/^wand_\d+$/.test(part.name))attachments.push(part);});
  const light=LGV.st.get(p.id),lightObjects=light?lgBaseObjects(light):[];
  const bound=FXR.inst.filter(fx=>fx.o.follow===p.id||fx===o.darkUltFx);
  const owned=darkDeathRoots(p.id);
  deathDissolve([...(wasVisible?attachments:[]),o.natureWhipView?.vine,...owned,...lightObjects,...bound.flatMap(fx=>fx.L.map(layer=>layer.obj))]);
  o.deathHidden=attachments.filter(Boolean).map(obj=>[obj,obj.visible]);
  for(const [obj] of o.deathHidden)obj.visible=false;
  o.darkDown=true;
  darkDeathClear(o,owned);
  for(const fx of bound)fxKill(fx);
  if(light)lgClear(light);
}
