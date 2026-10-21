// ---------- ซิงก์ผู้เล่น/ศัตรู/ลูกเวทจาก snapshot + ฉายตำแหน่งลงจอ (ป้ายชื่อ/ตัวเลข/เป้าเล็ง) ----------
function syncPlayers(P,mode,now,dt){
  const seen=new Set(),myP=P.find(q=>q.id===NET.myId),meGhost=!!(myP&&myP.gh);
  for(const p of P){
    seen.add(p.id);
    let o=PM3.get(p.id);
    if(!o){o=makeStudent(getLook(p.id),p.id);PM3.set(p.id,o);{const L=getLook(p.id);useFileModel(o,'char_student',lookTint(L),L);}}
    const g=o.g;
    g.visible=p.al&&!(p.iv&&!p.ds&&!(p.fr&&(p.fr[3]&2))&&Math.floor(now/80)%2===0);
    // ผี (หาลอร์ดโวลเดอมอร์): คนเป็นมองไม่เห็นผี / ผีเห็นกันเป็นเงาจางๆ
    if(p.gh&&!meGhost){g.visible=false;continue;}
    if(!!p.gh!==!!o.ghost){
      o.ghost=!!p.gh;
      setGhost(o,o.ghost);
    }
    const x=tx(p.x),z=tz(p.y);
    o.zs=o.zs===undefined?(p.z||0)+GY(p.x,p.y):lerp(o.zs,(p.z||0)+GY(p.x,p.y)+(p.gh?0.6+Math.sin(now/500)*0.2:0),1-Math.exp(-20*dt));
    g.position.set(x,o.zs,z);
    g.rotation.y=Math.atan2(Math.cos(p.a),Math.sin(p.a));
    const v=localVel(o,x,z,dt,g.rotation.y);
    if(!p.al){if(ragTick(o,p,v,dt,now))ragHideDead(o,p,now);continue;}   // ตาย = ragdoll ค้างจนเกิดใหม่ (js/48)
    o.hitT=Math.max(0,(o.hitT||0)-dt);
    if(o.anim)animTick(o,{down:!!p.dn,fly:!!p.fl,sp:v.sp,castT:o.castT,hitT:o.hitT},dt);
    updateCloth(o.cloak,v.lvx,v.lvz,v.sp*(p.fl?1.4:1),now,dt);
    o.broom.visible=!!p.fl;o.cocoon.visible=!!p.rt;
    if(p.rt)o.cocoon.rotation.y=now/400;
    o.castT=Math.max(0,o.castT-dt);
    const ck=Math.min(1,o.castT/0.12);
    if(p.fl){
      // ท่านั่งไม้กวาด: ขาเหยียดไปหน้า ตัวเอนไปข้างหน้า มือจับด้าม
      o.b.rotation.x=0.18+Math.min(0.25,v.sp*0.012);o.b.position.y=-0.05+Math.sin(now/300)*0.05;
      o.legs[0].rotation.x=o.legs[1].rotation.x=-1.25;
      o.armL.rotation.x=-1.05;o.armL.rotation.z=-0.25;o.armR.rotation.x=-1.05;o.armR.rotation.z=0.25;
      o.broom.rotation.x=-0.1+Math.sin(now/300)*0.04;o.broom.rotation.z=clamp(-v.lvx*0.02,-0.4,0.4);
      if(Math.random()<0.8){const bx=p.x-Math.cos(p.a)*30,by=p.y-Math.sin(p.a)*30;PARTS.push({x:bx+rnd(-4,4),y:by+rnd(-4,4),h:(p.z||0)+0.8+rnd(-0.1,0.1),vx:rnd(-20,20),vy:rnd(-20,20),vh:rnd(-0.3,0.3),life:0.6,max:0.6,col:Math.random()<0.5?'#ffe9a8':'#ffffff',size:1.6,g:0.5});}
    }else{
      o.walk+=dt*v.sp*0.8;
      const sw=Math.sin(o.walk)*Math.min(1,v.sp/5);
      if(p.dn){o.b.rotation.x=-1.4;o.b.position.y=0.4;}
      else{o.b.rotation.x=p.ds?0.4:Math.min(0.12,v.sp*0.01);o.b.position.y=Math.abs(Math.cos(o.walk))*0.05*Math.min(1,v.sp/5);}
      o.legs[0].rotation.x=sw*0.75;o.legs[1].rotation.x=-sw*0.75;
      o.armL.rotation.x=-sw*0.55;o.armL.rotation.z=0.15;
      o.armR.rotation.x=lerp(-0.35+sw*0.4,-1.55,ck);o.armR.rotation.z=-0.12;
    }
    if(o.rig)rigStd(o);
    o.ends.forEach((E,i)=>{E.rotation.x=-clamp(v.lvz*0.07,0,1.2)+Math.sin(now*0.012+i*1.7)*0.08*(1+v.sp*0.15);E.rotation.z=clamp(v.lvx*0.04,-0.6,0.6);});
    o.shield.visible=!!p.sh||!!(p.fm&(128|16384));
    const fireSh=p.sh&&getKit(p.id).path===0;
    if(o.shield.visible){o.shield.material.uniforms.t.value=now/1000;o.shield.material.uniforms.c.value.set(fireSh?'#ff7a2a':p.sh?'#7ff0ff':(p.fm&128)?'#6fb8d8':'#9a7a3a');}
    // โล่ไฟ = เปลือกไฟลุกหุ้มรอบตัว (fireShieldFX ใน js/33) แทนโล่ฟอง
    if(fireSh)o.shield.visible=false;
    fireShieldFX(o,p,fireSh,dt);
    // + ลูกแก้วไฟหุ้มตัว + เม็ดไฟลอยรอบ (แบบ 19 ต.ค. เช้า — ผู้ใช้เลือก "A + ตอนนี้" 2026-10-20)
    if(fireSh){if(!o.fsh){o.fsh=new THREE.Mesh(_fbGeo,fireMat({mode:'ball',shell:1,flow:[0,1,0],scale:[1.4,1.4,1.4],speed:1.4,heat:-0.12,op:0.85,int:1.0}));o.fsh.scale.setScalar(1.38);o.fsh.position.y=1.1;o.g.add(o.fsh);}
      o.fsh.visible=true;o.fsh.rotation.y+=dt*0.6;
      for(let i=0;i<3;i++){const an=rnd(0,6.283),r=rnd(26,34);PARTS.push({x:p.x+Math.cos(an)*r,y:p.y+Math.sin(an)*r,h:(o.zs||0)+rnd(0.2,2.2),vx:0,vy:0,vh:rnd(1.2,2.6),life:0.4,max:0.4,col:i?'#ff7a2a':'#ffc04a',size:rnd(2.4,3.6),g:-1.5});}}
    else if(o.fsh)o.fsh.visible=false;
    statusFX(o,p.fm|0,p.x,p.y,o.zs||0,2.2,now);
    o.stars.visible=!!p.st;o.stars.rotation.y=now/250;
    const isMe=p.id===NET.myId;
    if(p.fl)o.ring.visible=false;
    else if(teamOn()){o.ring.visible=true;o.ring.material.color.set(TEAMC[p.tm]);}
    else if(isMe){o.ring.visible=true;o.ring.material.color.set('#ffffff');}
    else o.ring.visible=false;
    o.tip.scale.setScalar(0.3+0.08*Math.sin(now/120)+(o.castT>0?0.4:0))*((p.cg||0)>0?0.4:1);
    const pz=o.zs;
    pyroFX(o,p,pz,now,dt);
    stormFX(o,p,pz,now,dt);
    chillFX(o,p,pz,now,dt);
    frostFX(o,p,pz,now,dt);
    earthFX(o,p,pz,now,dt);
    if(o.rig)rigSync(o,dt);
    if(ragTick(o,p,v,dt,now))o.tip.scale.setScalar(0.001);   // ล้ม/กระแทกแรง = ragdoll (js/48)
    if(p.bn&&Math.random()<0.7)burst(p.x,p.y,'#ff6a2a',1,30,0.45,3.5,{h:pz+rnd(0.3,1.8),vh:[1,2.5],g:-1});
    if(p.u>=100&&Math.random()<0.35)burst(p.x+rnd(-18,18),p.y+rnd(-18,18),'#ffd86b',1,10,0.9,1.8,{h:pz+rnd(0,0.4),vh:[1.5,3],g:-0.3});
    if(p.sh&&!fireSh&&!p.ea&&Math.random()<0.3)burst(p.x,p.y,'#7ff6ff',1,40,0.4,1.4,{h:pz+rnd(0.3,2)});
    if(p.ds)burst(p.x,p.y,'#bfefff',2,30,0.3,2,{h:pz+rnd(0.4,1.6),g:0});
  }
  for(const [id,o] of PM3)if(!seen.has(id)){if(o.fball)scene.remove(o.fball);if(o.orbG)scene.remove(o.orbG);if(o.clones)o.clones.forEach(c=>scene.remove(c.g));disposeObj(o.g);PM3.delete(id);}
}
function syncEnemies(E,P,now,dt){
  const seen=new Set();
  for(const e of E){
    seen.add(e.id);
    let o=EM3.get(e.id);
    if(!o){o=makeEnemy(e.t);EM3.set(e.id,o);useFileModel(o,'enemy_'+e.t);}
    const x=tx(e.x),z=tz(e.y);
    let tgt=null,bd=1e12;for(const p of P)if(p.al&&!p.dn){const d=(p.x-e.x)**2+(p.y-e.y)**2;if(d<bd){bd=d;tgt=p;}}
    if(tgt)o.g.rotation.y=Math.atan2(tx(tgt.x)-x,tz(tgt.y)-z);
    o.hs=o.hs===undefined?(e.h||0)+GY(e.x,e.y):lerp(o.hs,(e.h||0)+GY(e.x,e.y),1-Math.exp(-15*dt));
    o.g.position.set(x,o.hs,z);
    const v=localVel(o,x,z,dt,o.g.rotation.y);
    o.hitT=Math.max(0,(o.hitT||0)-dt);o.atkT=Math.max(0,(o.atkT||0)-dt);
    if(o.anim)animTick(o,{fly:o.hs>1,sp:v.sp,atk:!!(e.sl||e.lg)||o.atkT>0,hitT:o.hitT},dt);
    if(o.legs){
      // ขาแมงมุมก้าวสลับ
      o.walk+=dt*Math.min(v.sp,20)*1.4;
      for(const l of o.legs){const ph=o.walk+l.ph;l.L.rotation.y=l.base+Math.sin(ph)*0.3*l.s;l.L.rotation.z=Math.max(0,Math.cos(ph))*0.3;}
      o.b.rotation.x=e.lg?-0.3:0;o.b.position.y=e.lg?0.3:Math.abs(Math.sin(o.walk*2))*0.03;
    }else if(o.dragon){
      const air=o.hs>1;
      for(const w of o.wings)w.wg.rotation.z=w.s*(Math.sin(now/(air?170:500))*(air?0.6:0.15)+(air?0.1:0.45));
      o.b.position.y=air?Math.sin(now/170)*0.3:0;
      o.b.rotation.x=air?-0.15:0;
    }else if(o.wings){
      for(const w of o.wings)w.wg.rotation.y=w.s*Math.sin(now/25)*0.9;
      o.b.position.y=Math.sin(now/200+e.id)*0.15;
      if(Math.random()<0.4)PARTS.push({x:e.x,y:e.y,h:o.hs+rnd(-0.2,0.2),vx:rnd(-15,15),vy:rnd(-15,15),vh:-0.3,life:0.6,max:0.6,col:'#8fd0ff',size:1.4,g:0.4});
    }else o.b.position.y=v.sp>0.3?Math.abs(Math.sin(now/90+e.id))*0.12:0;
    if(o.cloak)updateCloth(o.cloak,v.lvx,v.lvz,v.sp,now,dt);
    o.stars.visible=!!e.st;o.stars.rotation.y=now/250;
    if(o.tele){o.tele.visible=!!e.sl;if(e.sl)o.tele.material.opacity=0.2+0.2*Math.sin(now/60);if(o.club)o.club.rotation.x=e.sl?-0.6:Math.PI/2.6;}
    if(e.bn&&Math.random()<0.7)burst(e.x,e.y,'#ff6a2a',1,30,0.45,3.5,{h:o.hs+rnd(0.3,o.h*0.8),vh:[1,2.5],g:-1});
    statusFX(o,e.fm|0,e.x,e.y,o.hs||0,Math.max(1.2,(o.h||2)*0.9),now);
    if(e.t==='wiz'&&Math.random()<0.15)smoke(e.x,e.y,0.2,1,'#1a2a14',1.2,4,20);
  }
  for(const [id,o] of EM3)if(!seen.has(id)){disposeObj(o.g);EM3.delete(id);}
}
const projGeo=new THREE.SphereGeometry(1,14,10);
const tailGeo=new THREE.ConeGeometry(1,1,14,1,true);tailGeo.rotateX(-Math.PI/2);tailGeo.translate(0,0,-0.5);
const _t1=new THREE.Vector3();
function makeProj(col,t){
  const g=new THREE.Group();
  const core=new THREE.Mesh(projGeo,new THREE.MeshBasicMaterial({color:hdr('#ffffff',2.2)}));g.add(core);
  const inner=new THREE.Mesh(projGeo,new THREE.MeshBasicMaterial({color:hdr(col,1.6),transparent:true,opacity:0.7,blending:THREE.AdditiveBlending,depthWrite:false}));g.add(inner);
  const halo=new THREE.Sprite(glowMat(col,0.9));g.add(halo);
  const tail=new THREE.Mesh(tailGeo,new THREE.MeshBasicMaterial({color:hdr(col,1.6),transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false}));g.add(tail);
  const o={g,core,inner,halo,tail,col,lines:[]};
  // หน้าตากระสุนจากไฟล์ proj_<ชนิด> (ปั้นให้ด้านหน้าพุ่งไปทาง −Y ของ Blender) — แสงรอบ (halo) ยังอยู่
  const fm=modelInst('proj_'+t);if(fm){fm.traverse(m=>{if(m.isMesh)m.castShadow=false;});g.add(fm);o.fileModel=fm;}
  // ลูกไฟชาร์จ / Kindle: ลูกไฟ shader (เปลวไหลไปด้านหลัง) + กรวยหางไฟ
  if(t==='erock'||t==='eslab')earthProjMesh(o,t);
  if(t==='pfire'||t==='pfireb'){o.fb=makeFireBall({flow:[0,0,-1]});g.add(o.fb);o.ft=makeFireTail({speed:3.6});g.add(o.ft);}
  if(t==='stun'||t==='zap')for(let i=0;i<2;i++){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(9*3),3));
    const L=new THREE.Line(geo,new THREE.LineBasicMaterial({color:hdr('#c8f6ff',3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    g.add(L);o.lines.push(L);
  }
  scene.add(g);
  return o;
}
const _a=new THREE.Vector3(),_b=new THREE.Vector3();
function syncProj(v,now){
  const ex=Math.min(0.1,(now-VIEW.tCur)/1000),seen=new Set();
  for(const j of v.J){
    seen.add(j.id);
    const vt=(j.t==='pfire'||j.t==='pfireb')?'fire':j.t,col=j.rf?'#7ff6ff':PCOL[j.t],r=PDEF[j.t].r*S3*(vt==='fire'?1.4:1);
    let o=JM3.get(j.id);
    if(!o){o=makeProj(col,j.t);o.pt=j.t;JM3.set(j.id,o);
      {const P=palOf(pjPal(j.t),col),big=j.t==='iceboulder'||j.t==='pfireb';o.tr=trailNew({col:P.hi,col2:P.deep,w:big?0.32:vt==='fire'?0.2:0.11,life:big?0.28:0.17,k:1.7});}}   // หางแสงทุกกระสุน (สีตามธาตุ)
    if(o.col!==col){o.halo.material=glowMat(col,0.9);o.inner.material.color.copy(hdr(col,2.2));o.tail.material.color.copy(hdr(col,1.6));o.col=col;}
    const x=j.x+j.vx*ex,y=j.y+j.vy*ex,X=tx(x),Z=tz(y),H=(j.h!==undefined?j.h:1.35)+(j.vh||0)*ex;
    {const Hw=H+GY(x,y);o.g.position.set(X,Hw,Z);if(o.tr)trailPoint(o.tr,X,Hw,Z);o.g.lookAt(_t1.set(X+j.vx*S3,Hw+(j.vh||0),Z+j.vy*S3));}
    if(j.t==='web'){o.core.material.color.set('#f4f4ff');o.tail.visible=false;if(Math.random()<0.6)PARTS.push({x,y,h:H,vx:rnd(-30,30),vy:rnd(-30,30),vh:rnd(-0.5,0.5),life:0.5,max:0.5,col:'#e8e8f0',size:2.5,g:1,smoke:true});}
    const fl=1+0.15*Math.sin(now/30+j.id);
    o.core.scale.setScalar(r*0.6);o.inner.scale.setScalar(r*1.3*fl);
    o.halo.scale.setScalar(r*(vt==='fire'?7:6.5)*fl);
    o.tail.scale.set(r*1.1,r*1.1,vt==='fire'?2.2:2.8);
    if(o.fileModel){o.core.visible=o.inner.visible=o.tail.visible=false;}
    o.lines.forEach(L=>jag(L.geometry,_a.set(0,0,0),_b.set(0,0,-2.4),0.22));
    LREQ.push({x:X,y:H,z:Z,col,int:vt==='fire'?2.4:1.6,dist:vt==='fire'?11:8});
    switch(vt){
      case 'icicle':
        // แท่งน้ำแข็งแหลม: ยาวตามทิศที่พุ่ง
        o.core.scale.set(r*0.22,r*0.22,r*2.6);o.inner.scale.set(r*0.45,r*0.45,r*3);o.halo.scale.setScalar(r*3.2);o.tail.visible=false;o.lp=[x,y,H];
        PARTS.push({x,y,h:H,vx:0,vy:0,vh:0,life:0.04,max:0.04,col:'#ffffff',size:2.6,g:0});
        if(Math.random()<0.7)PARTS.push({x:x+rnd(-3,3),y:y+rnd(-3,3),h:H+rnd(-0.08,0.08),vx:-j.vx*0.05+rnd(-20,20),vy:-j.vy*0.05+rnd(-20,20),vh:rnd(-0.4,0.2),life:0.3,max:0.3,col:Math.random()<0.5?'#ffffff':'#bfeaff',size:1.4,g:1});
        break;
      case 'iceboulder':
        o.core.scale.setScalar(r*0.75);o.inner.scale.setScalar(r*1.2*fl);o.halo.scale.setScalar(r*4);
        for(let i=0;i<2;i++)PARTS.push({x:x+rnd(-8,8),y:y+rnd(-8,8),h:H+rnd(-0.2,0.2),vx:-j.vx*0.08+rnd(-30,30),vy:-j.vy*0.08+rnd(-30,30),vh:rnd(-0.5,0.5),life:0.45,max:0.45,col:i?'#ffffff':'#9fe0ff',size:2.6,g:2});
        if(Math.random()<0.3)PARTS.push({x,y,h:H,vx:0,vy:0,vh:0.3,life:0.8,max:0.8,col:'#e8f6ff',size:5,g:-0.2,smoke:true,grow:1.3});
        break;
      case 'spark':
        // ประกายไฟพุ่งเร็ว: แกนเหลืองสว่าง + หางส้มแดง + ถ่านไฟเล็ก ๆ
        o.core.visible=false;o.inner.visible=false;o.halo.scale.setScalar(r*2*fl);o.tail.visible=false;
        PARTS.push({x,y,h:H,vx:0,vy:0,vh:0,life:0.05,max:0.05,col:'#fff6c0',size:3.4,g:0});
        for(let k=1;k<7;k++)PARTS.push({x:x-j.vx*0.005*k,y:y-j.vy*0.005*k,h:H+rnd(-0.03,0.03),vx:rnd(-15,15),vy:rnd(-15,15),vh:rnd(-0.1,0.3),life:0.1,max:0.1,col:k<3?'#ffc04a':k<5?'#ff6a1a':'#d83a10',size:2.6-k*0.25,g:0});
        for(let i=0;i<3;i++)PARTS.push({x:x+rnd(-4,4),y:y+rnd(-4,4),h:H+rnd(-0.1,0.1),vx:-j.vx*0.1+rnd(-60,60),vy:-j.vy*0.1+rnd(-60,60),vh:rnd(-0.3,1.5),life:rnd(0.18,0.35),max:0.35,col:['#fff2b0','#ffb347','#ff6a1a'][i],size:rnd(0.9,1.4),g:5,drag:2});
        flame(x-j.vx*0.01,y-j.vy*0.01,H-0.12,{vx:-j.vx*0.08+rnd(-20,20),vy:-j.vy*0.08+rnd(-20,20),vh:rnd(0.4,1.2),life:rnd(0.14,0.22),size:rnd(3,4.2),g:-1,drag:3});
        o.lp=[x,y,H];break;
      case 'fire':{
        // ลูกไฟชาร์จ/Kindle: ลูกไฟ shader แกนเหลืองขาว เปลวไหลไปด้านหลัง + กรวยหางไฟ + เปลวอนุภาค • Kindle ใหญ่และหนักกว่า มีเปลววนรอบแกน
        const big=j.t==='pfireb';o.halo.scale.setScalar(r*(big?5:3.6)*fl);o.inner.visible=o.core.visible=o.tail.visible=false;
        if(o.fb){o.fb.scale.setScalar(r*(big?0.95:0.72)*fl);o.fb.userData.shell.rotation.z+=0.15;o.ft.scale.set(r*(big?0.9:0.68),r*(big?0.9:0.68),big?4.2:3.2);}
        for(let i=0;i<(big?5:3);i++)flame(x-j.vx*0.012*i+rnd(-5,5),y-j.vy*0.012*i+rnd(-5,5),H-0.25+rnd(-0.1,0.1),{vx:-j.vx*0.15+rnd(-20,20),vy:-j.vy*0.15+rnd(-20,20),vh:rnd(0.5,2),life:rnd(0.25,0.4),size:big?rnd(9,13):rnd(6,9),g:-2,drag:3});
        if(big)for(let i=0;i<4;i++){const a=now/55+i*1.57;flame(x+Math.cos(a)*r*16,y+Math.sin(a)*r*16,H-0.2+Math.sin(a*1.3)*0.2,{vx:-j.vx*0.05,vy:-j.vy*0.05,vh:rnd(0.5,1.5),life:0.22,size:6,g:-1});}
        for(let i=0;i<2;i++)PARTS.push({x:x+rnd(-6,6),y:y+rnd(-6,6),h:H+rnd(-0.15,0.15),vx:-j.vx*0.08+rnd(-50,50),vy:-j.vy*0.08+rnd(-50,50),vh:rnd(0.5,2),life:0.35,max:0.35,col:Math.random()<0.5?'#fff0b0':'#ffc04a',size:1.6,g:3,drag:2});
        if(Math.random()<0.4)PARTS.push({x,y,h:H,vx:rnd(-15,15),vy:rnd(-15,15),vh:rnd(0.5,1.2),life:0.9,max:0.9,col:'#2e2a2a',size:5,g:-0.4,smoke:true,grow:1.4,drag:2});
        o.lp=[x,y,H];break;}
      case 'ice':
        for(let i=0;i<2;i++)PARTS.push({x:x+rnd(-4,4),y:y+rnd(-4,4),h:H+rnd(-0.15,0.15),vx:rnd(-30,30),vy:rnd(-30,30),vh:rnd(-0.5,0.3),life:0.5,max:0.5,col:i?'#ffffff':'#9fe8ff',size:1.8,g:0.5,drag:3});
        break;
      case 'zap':
      case 'stun':
        for(let i=0;i<2;i++)PARTS.push({x,y,h:H+rnd(-0.2,0.2),vx:rnd(-90,90),vy:rnd(-90,90),vh:rnd(-1,1),life:0.25,max:0.25,col:i?'#ffffff':'#5ad1ff',size:1.8,g:0,drag:5});
        break;
      case 'pull':{
        const ang=Math.atan2(j.vy,j.vx),px=-Math.sin(ang),py=Math.cos(ang);
        for(let s=0;s<2;s++){const ph=now/40+s*Math.PI,rr=10*Math.cos(ph);PARTS.push({x:x+px*rr,y:y+py*rr,h:H+Math.sin(ph)*0.5,vx:0,vy:0,vh:0,life:0.45,max:0.45,col:s?'#e0b0ff':'#a050ff',size:2.4,g:0});}
        break;}
      case 'ebolt':
        PARTS.push({x,y,h:H,vx:rnd(-20,20),vy:rnd(-20,20),vh:rnd(-0.2,0.5),life:0.35,max:0.35,col:'#7dff6a',size:3,g:0});
        if(Math.random()<0.35)PARTS.push({x,y,h:H,vx:0,vy:0,vh:0.4,life:0.8,max:0.8,col:'#142a12',size:4,g:-0.3,smoke:true,grow:1.5});
        break;
      default:
        for(let i=0;i<2;i++)PARTS.push({x:x+rnd(-4,4),y:y+rnd(-4,4),h:H+rnd(-0.1,0.1),vx:rnd(-25,25),vy:rnd(-25,25),vh:rnd(-0.3,0.3),life:0.35,max:0.35,col:i?'#ffffff':col,size:i?1.2:2.2,g:0});
    }
  }
  for(const [id,o] of JM3)if(!seen.has(id)){
    if(o.tr)trailStop(o.tr);
    if(o.lp&&o.pt==='icicle'){const [x,y,H]=o.lp;playFx('ice_hit',x,y,H,{s:0.8});for(let i=0;i<8;i++){const an=rnd(0,6.283),sp=rnd(100,220);PARTS.push({x,y,h:H,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,vh:rnd(-1,2.5),life:rnd(0.15,0.3),max:0.3,col:i%2?'#ffffff':'#bfeaff',size:1.4,g:6,drag:4});}FX.flashSprite(x,y,H,'#dff6ff',0.25,1.3,0.25,1.6);}
    if(o.lp&&o.pt==='spark'){const [x,y,H]=o.lp;for(let i=0;i<9;i++){const an=rnd(0,6.283),sp=rnd(120,260);PARTS.push({x,y,h:H,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,vh:rnd(-1,3),life:rnd(0.12,0.22),max:0.22,col:i%3?'#ffc04a':'#fff6c0',size:1.3,g:6,drag:5});}}
    if(o.lp&&o.pt==='pfire'){const [x,y,H]=o.lp;ring(x,y,'#ff9a3a',70,0.28,Math.max(0.15,H-1));for(let i=0;i<14;i++){const an=i/14*6.283;flame(x+Math.cos(an)*10,y+Math.sin(an)*10,Math.max(0.1,H-0.5),{vx:Math.cos(an)*260,vy:Math.sin(an)*260,vh:rnd(1,3),life:0.3,size:rnd(6,9),drag:5});}
      for(let i=0;i<14;i++){const an=rnd(0,6.283),sp=rnd(150,340);PARTS.push({x,y,h:H,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,vh:rnd(0,5),life:rnd(0.2,0.4),max:0.4,col:i%2?'#ffb347':'#fff0b0',size:1.6,g:7,drag:3});}}
    if(o.lp&&o.pt==='pfireb'){const [x,y,H]=o.lp;fireBlast(x,y,Math.max(0.3,H),2.4,0.55);}
    if(o.lp&&o.pt==='pfire'){const [x,y,H]=o.lp;fireBlast(x,y,Math.max(0.3,H),1.3,0.4);}
    scene.remove(o.g);o.g.traverse(m=>{if(m.material&&m.material!==o.halo.material&&!m.material.userData.keep)m.material.dispose();if(m.isLine)m.geometry.dispose();});JM3.delete(id);}
}
let _awT=0;
function animateWorld(now){
  {const dt=_awT?Math.min(0.1,(now-_awT)/1000):0;_awT=now;const U=world&&world.userData;
    if(U&&U.mixer)U.mixer.update(dt);                         // ของขยับในไฟล์แผนที่ (anim_)
    if(U&&U.lights)for(const L of U.lights)LREQ.push(L);}     // ไฟประจำจุดในไฟล์แผนที่ (light_)
  if(CANDLESYS)updateCandles(now);
  for(const c of CANDLES)c.g.position.y=c.y+Math.sin(now/900+c.ph)*0.3;
  for(const t of TORCHES){
    const f=0.85+0.15*Math.sin(now/70+t.ph)+0.08*Math.sin(now/23+t.ph*2);
    t.fl.scale.set(1.6*f,2.2*f,1);
    if(t.light)t.light.intensity=1.4*f;
  }
  if(RUNE)RUNE.material.opacity=0.55+0.25*Math.sin(now/600);
  if(CRYSTAL){CRYSTAL.rotation.y=now/1200;CRYSTAL.position.y=7+Math.sin(now/800)*0.5;}
  if(SNITCH){
    const t=now/1000;
    SNITCH.position.set(Math.sin(t*0.7)*45+Math.sin(t*2.3)*8,9+Math.sin(t*1.3)*5,Math.cos(t*0.5)*25+Math.cos(t*1.9)*6);
    SNITCH.children[1].rotation.y=Math.sin(now/18)*0.9;SNITCH.children[2].rotation.y=-Math.sin(now/18)*0.9;
    SNITCH.rotation.y=t*2;
  }
  for(const b of BANNERS){
    // ธงโบกสะบัด
    const p=b.m.geometry.attributes.position.array,r=b.rest,t=now/400+b.ph;
    for(let i=0;i<p.length;i+=3){const k=(3.5-r[i+1])/7;p[i+2]=r[i+2]+Math.sin(t+r[i+1]*1.2)*0.35*k;}
    b.m.geometry.attributes.position.needsUpdate=true;
  }
  if(SNOW){
    const dt=Math.min(0.1,(now-SNOW.t)/1000);SNOW.t=now;const {sp,sv,hw,hh}=SNOW,n=sv.length;
    for(let i=0;i<n;i++){
      sp[i*3+1]-=sv[i]*dt;sp[i*3]+=Math.sin(now/1300+i)*0.35*dt;
      if(sp[i*3+1]<0){sp[i*3+1]=26;sp[i*3]=rnd(-hw-15,hw+15);sp[i*3+2]=rnd(-hh-15,hh+15);}
    }
    SNOW.pts.geometry.attributes.position.needsUpdate=true;
  }
  if(FIREFLIES){
    const {fp,fseed}=FIREFLIES,t=now/1000;
    for(let i=0;i<fseed.length;i++){const s=fseed[i];fp[i*3]=s[0]+Math.sin(t*0.3+s[3])*2;fp[i*3+1]=s[1]+Math.sin(t*0.7+s[3]*2)*0.6;fp[i*3+2]=s[2]+Math.cos(t*0.25+s[3])*2;}
    FIREFLIES.pts.geometry.attributes.position.needsUpdate=true;
    FIREFLIES.pts.material.opacity=0.6+0.4*Math.sin(t*2);
  }
}

// ---------- ฉายตำแหน่ง 3D ลงจอ (ป้ายชื่อ / ตัวเลขดาเมจ) ----------
const _v=new THREE.Vector3();
function toScreen(x,h,y){
  _v.set(tx(x),h+GY(x,y),tz(y)).project(cam);
  if(_v.z>1||_v.z<-1)return null;
  return [(_v.x+1)/2*SW,(1-_v.y)/2*SH];
}
// Burning: ตัวเลขแบบแฟนตาซี (ฟอนต์ Pirata One) สีแดง-ส้ม กลางตัวศัตรู
try{document.fonts.load("40px 'Pirata One'");}catch(e){}
function burnNum(x,y,n){
  const t=performance.now(),s=30+n*3+(n>=5?3*Math.sin(t/90):0);
  cx.save();cx.textAlign='center';cx.textBaseline='middle';cx.font=`${Math.round(s)}px 'Pirata One',serif`;
  const g=cx.createLinearGradient(0,y-s/2,0,y+s/2);g.addColorStop(0,n>=5?'#ffe27a':'#ffb347');g.addColorStop(0.55,'#ff6a1a');g.addColorStop(1,'#b3140a');
  cx.shadowColor='#ff4a10';cx.shadowBlur=12;cx.lineWidth=4;cx.strokeStyle='rgba(30,4,0,0.85)';cx.strokeText(n,x,y);
  cx.fillStyle=g;cx.fillText(n,x,y);cx.restore();
}
function drawLabels(P,E,v,me,spk){
  if(!SET.names){const team=teamOn(v);P=P.filter(p=>team&&me&&p.tm===me.tm);}
  cx.textAlign='center';
  for(const e of E){if(!e.br)continue;const o=EM3.get(e.id);if(!o)continue;const s=toScreen(e.x,(o.hs||0)+(o.h||2)*0.5,e.y);if(s)burnNum(s[0],s[1],e.br);}
  for(const p of P){if(!p.br||!p.al||p.id===NET.myId)continue;const s=toScreen(p.x,(p.z||0)+1.2,p.y);if(s)burnNum(s[0],s[1],p.br);}
  cx.textAlign='center';
  for(const e of E){
    const o=EM3.get(e.id);if(!o)continue;
    const d=me?Math.hypot(e.x-me.x,e.y-me.y):0;if(d>1500)continue;
    const s=toScreen(e.x,(o.hs||0)+o.h+0.4,e.y);if(!s)continue;
    if(EDEF[e.t]&&EDEF[e.t].boss)continue;
    const bw=e.t==='troll'?90:44;
    cx.fillStyle='rgba(0,0,0,0.6)';cx.fillRect(s[0]-bw/2,s[1],bw,5);
    cx.fillStyle='#ff5a5a';cx.fillRect(s[0]-bw/2,s[1],bw*clamp(e.hp/e.mh,0,1),5);
  }
  const meGh=!!(me&&me.gh),mates=ROLE&&ROLE.role==='imp'?ROLE.mates:[];
  for(const p of P){
    if(!p.al||p.id===NET.myId)continue;
    if(p.gh&&!meGh)continue;
    const s=toScreen(p.x,(p.z||0)+2.55,p.y);if(!s)continue;
    cx.font='600 13px Kanit,sans-serif';
    cx.fillStyle='rgba(0,0,0,0.65)';cx.fillText(p.n,s[0]+1,s[1]-7);
    cx.fillStyle=teamOn(v)?TEAMC[p.tm]:mates.includes(p.id)?'#ff6b6b':'#ffffff';cx.fillText(p.n+(p.hb?' 🔴':''),s[0],s[1]-8);
    if(v.mode==='imp')continue;
    if(spk.has(p.id)){cx.font='14px sans-serif';cx.fillText('🔊',s[0]+cx.measureText(p.n).width/2+16,s[1]-8);}
    const bw=50,hr=p.hp/p.mh;
    cx.fillStyle='rgba(0,0,0,0.6)';cx.fillRect(s[0]-bw/2,s[1]-2,bw,6);
    cx.fillStyle=hr>0.5?'#5be37d':hr>0.25?'#ffc94d':'#ff5a5a';cx.fillRect(s[0]-bw/2,s[1]-2,bw*hr,6);
    if(p.dn){cx.fillStyle='#ff9a9a';cx.font='600 13px Kanit,sans-serif';cx.fillText(`ล้ม! ไปยืนข้างๆ เพื่อชุบ ${Math.round(p.rv/2.5*100)}%`,s[0],s[1]+40);}
  }
}
function drawTexts(dt){
  cx.textAlign='center';
  for(let i=TEXTS.length-1;i>=0;i--){
    const t=TEXTS[i];t.life-=dt;if(t.life<=0){TEXTS.splice(i,1);continue;}
    if(t.h===undefined)t.h=2.4;
    t.h+=1.6*dt;
    const s=toScreen(t.x,t.h,t.y);if(!s)continue;
    cx.globalAlpha=Math.min(1,t.life/t.max*2);
    cx.font=`600 ${t.size+2}px Kanit,sans-serif`;
    cx.fillStyle='rgba(0,0,0,0.7)';cx.fillText(t.t,s[0]+1.5,s[1]+1.5);
    cx.fillStyle=t.col;cx.fillText(t.t,s[0],s[1]);
  }
  cx.globalAlpha=1;
}
const HITM={t:0,max:0.45,at:0,kill:false},DIRI=[];
// เป้าเล็งตามที่ตั้งค่า: 0 กากบาท / 1 จุด / 2 วงกลม / 3 กากบาท+วง
function drawXh(x,y,hot,g){
  g=g||cx;
  const s=(SET.xhs||100)/100,col=hot?'#ff9632':XHC[SET.xhc|0]||XHC[0],st=SET.xh|0;
  const cross=()=>{for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){g.beginPath();g.moveTo(x+dx*6*s,y+dy*6*s);g.lineTo(x+dx*12*s,y+dy*12*s);g.stroke();}};
  const circ=()=>{g.beginPath();g.arc(x,y,9*s,0,Math.PI*2);g.stroke();};
  g.strokeStyle='rgba(0,0,0,0.55)';g.lineWidth=3;if(st===0||st===3)cross();if(st===2||st===3)circ();
  g.strokeStyle=col;g.lineWidth=hot?2.5:1.6;if(st===0||st===3)cross();if(st===2||st===3)circ();
  g.fillStyle='rgba(0,0,0,0.5)';g.beginPath();g.arc(x,y,(st===1?3.2:2.2)*s+1,0,Math.PI*2);g.fill();
  g.fillStyle=col;g.beginPath();g.arc(x,y,(st===1?3.2:2.2)*s,0,Math.PI*2);g.fill();
}
function drawCrosshair(){
  const x=SW/2,y=SH/2;
  // เครื่องหมายตอนยิงโดน (X รอบเป้า, แดง = ฆ่า)
  if(HITM.t>0){const age=(performance.now()-HITM.at)/1000;HITM.t=HITM.max-age;
    if(HITM.t>0){const a=Math.min(1,HITM.t/0.2),pop=1+0.45*Math.max(0,1-age/0.08),r0=7*pop,r1=(HITM.kill?17:15)*pop;
      const X=()=>{for(const [dx,dy] of [[1,1],[-1,1],[1,-1],[-1,-1]]){cx.beginPath();cx.moveTo(x+dx*r0,y+dy*r0);cx.lineTo(x+dx*r1,y+dy*r1);cx.stroke();}};
      cx.strokeStyle=`rgba(0,0,0,${0.6*a})`;cx.lineWidth=5;X();
      cx.strokeStyle=HITM.kill?`rgba(255,70,70,${a})`:`rgba(255,255,255,${a})`;cx.lineWidth=2.8;X();}}
  // ทิศที่โดนยิง (โค้งแดงรอบเป้า ชี้ไปทางคนยิง)
  for(let i=DIRI.length-1;i>=0;i--){const d=DIRI[i];d.t-=1/60;if(d.t<=0||!SET.dirm){DIRI.splice(i,1);continue;}
    const rel=d.a-yaw-Math.PI/2;cx.strokeStyle=`rgba(255,60,60,${Math.min(0.85,d.t)})`;cx.lineWidth=6;cx.beginPath();cx.arc(x,y,96,rel-0.32,rel+0.32);cx.stroke();}
  const _v=VIEW.cur,_me=_v&&_v.P&&_v.P.find(q=>q.id===NET.myId),hot=_me&&(_me.cg>=1||_me.dc>=1);
  if(!(_me&&_me.ea&&_me.al&&_me.sh&&!(_me.ea[0]>0)))drawXh(x,y,hot);   // สายดินถือโล่: ซ่อนเป้าเล็ง (โชว์โค้ง HP โล่ + ตัวเลขแทน ใน drawEarthHud)
  if(_me&&_me.sm&&_me.al)drawStormHud(x,y,_me.sm);
  if(_me&&_me.ea&&_me.al)drawEarthHud(x,y,_me.ea,_me);
  if(!locked){
    cx.font='600 17px Kanit,sans-serif';cx.textAlign='center';
    const t='🖱️ คลิกที่จอเพื่อบังคับกล้อง (Esc = ปล่อยเมาส์)',w=cx.measureText(t).width+48;
    plate(SW/2-w/2,SH/2+30,w,38);
    cx.fillStyle=HG2;cx.fillText(t,SW/2,SH/2+55);
  }
}
