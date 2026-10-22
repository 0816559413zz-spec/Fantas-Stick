// =====================================================================
//  โพเดียมธีมฮอกวอตส์ (ผู้ใช้ 2026-10-22 "podium but make it magician theme hogwart theme")
//  หลังป้าย VICTORY/DEFEAT (js/53): ห้องโถงเดียวกับล็อบบี้ (เทียนลอย แท่นวงเวททอง) + แท่นหิน 3 ระดับขอบทอง + ถ้วยทองลอยเหนืออันดับ 1
//  อันดับ 1 ชูไม้ (ปลายไม้สว่าง) • 2 โบกมือ • 3 ปรบมือ • ประกายทองโปรย • ~6.5 วิ (คลิก/Space ข้ามได้หลัง 1 วิ) → จอสรุป
// =====================================================================
const POD={on:false,t:0,rows:null,cb:null,g:null,cup:null,spark:[]};
const POD_X=[0,-2.05,2.05],POD_H=[1.05,0.7,0.45],POD_C=['#ffd86b','#dfe6f2','#e0a070'];
function podStart(res,cb){
  const R=(res&&res.rows||[]).filter(r=>r.id).slice(0,3);
  if(R.length<2||res.mode==='train'){cb();return;}
  Object.assign(POD,{on:true,t:0,rows:R,cb,spark:[]});
  if(!POD.g){
    const g=new THREE.Group(),stone=stoneMat(2,1,'#7a7a96'),gold=new THREE.MeshStandardMaterial({color:'#e8c468',metalness:1,roughness:0.28,emissive:'#5a3d08',emissiveIntensity:0.35});
    POD_X.forEach((x,i)=>{const h=POD_H[i],m=new THREE.Mesh(new THREE.CylinderGeometry(0.78,0.86,h,40),stone);m.position.set(x,STAGE_Y+h/2,0);m.castShadow=m.receiveShadow=true;g.add(m);
      for(const y of [h-0.03,0.05]){const t=new THREE.Mesh(new THREE.TorusGeometry(y>0.1?0.79:0.87,0.045,8,48),gold);t.rotation.x=Math.PI/2;t.position.set(x,STAGE_Y+y,0);g.add(t);}
      const ring=new THREE.Mesh(new THREE.RingGeometry(0.4,0.7,40),new THREE.MeshBasicMaterial({color:hdr(POD_C[i],1.6),transparent:true,opacity:0.5,depthWrite:false,blending:THREE.AdditiveBlending}));
      ring.rotation.x=-Math.PI/2;ring.position.set(x,STAGE_Y+h+0.01,0);g.add(ring);});
    // ถ้วยทอง: ทรงถ้วยหมุนรอบแกน + หูจับ 2 ข้าง + แสง
    const pts=[[0,0],[0.32,0],[0.3,0.06],[0.1,0.12],[0.08,0.4],[0.14,0.48],[0.36,0.62],[0.42,0.95],[0.4,1.0]].map(p=>new THREE.Vector2(p[0],p[1]));
    const cup=new THREE.Group();cup.add(new THREE.Mesh(new THREE.LatheGeometry(pts,36),gold));
    for(const s of [-1,1]){const h=new THREE.Mesh(new THREE.TorusGeometry(0.17,0.03,8,20,Math.PI),gold);h.position.set(s*0.4,0.72,0);h.rotation.z=s>0?-Math.PI/2:Math.PI/2;cup.add(h);}
    const gl=new THREE.Sprite(glowMat('#ffd86b',1.2));gl.scale.setScalar(2.4);gl.position.y=0.6;cup.add(gl);
    cup.scale.setScalar(0.62);g.add(cup);POD.cup=cup;
    const L=new THREE.PointLight('#ffd98a',2.2,8,2);L.position.set(0,STAGE_Y+3.6,1.2);g.add(L);
    POD.g=g;
  }
  stage.add(POD.g);
}
function podStop(){
  if(!POD.on)return;POD.on=false;
  if(POD.g)stage.remove(POD.g);
  for(const o of STAGE.chars.values()){o.g.visible=true;o.g.scale.setScalar(1);}
  const cb=POD.cb;POD.cb=null;if(cb)cb();
}
addEventListener('keydown',e=>{if(POD.on&&POD.t>1&&(e.code==='Space'||e.code==='Enter'||e.code==='Escape'))podStop();});
addEventListener('mousedown',()=>{if(POD.on&&POD.t>1)podStop();});
function podPose(o,place,now,dt,i){
  const t=now/1000;o.joinT=0;
  o.b.rotation.x=place===0?-0.08:0.02;o.b.rotation.z=0;o.b.position.y=Math.sin(t*1.6+i)*0.02;o.legs[0].rotation.x=o.legs[1].rotation.x=0;
  const R=o.armR.rotation,L=o.armL.rotation;
  if(place===0){R.x=-2.95+Math.sin(t*2.4)*0.06;R.z=-0.12;L.x=-0.5;L.z=0.55+Math.sin(t*2)*0.05;o.tip.scale.setScalar(0.9+0.2*Math.sin(t*9));}   // ชูไม้ชัยชนะ
  else if(place===1){R.x=-2.6;R.z=-0.45+Math.sin(t*9)*0.3;L.x=-0.3;L.z=0.4;o.tip.scale.setScalar(0.35);}   // โบกมือ
  else{const c=Math.abs(Math.sin(t*7));R.x=-1.25;R.z=0.35+c*0.35;L.x=-1.25;L.z=-0.35-c*0.35;o.tip.scale.setScalar(0.3);}   // ปรบมือ
  updateCloth(o.cloak,0,0,0,now,dt);
  o.broom.visible=o.cocoon.visible=o.shield.visible=o.stars.visible=false;
  if(o.anim)animTick(o,{sp:0},dt);
  if(o.rig){rigStage(o);rigSync(o,dt);}
}
function renderPodium(dt,now){
  POD.t+=dt;if(POD.t>6.5){podStop();return;}
  const want=new Set();
  POD.rows.forEach((r,i)=>{const o=stageChar(r.id,lookStr(getLook(r.id)));want.add(r.id);o.g.visible=true;
    const rise=Math.min(1,Math.max(0,(POD.t-0.25*(2-i))/0.6)),e=1-Math.pow(1-rise,3);   // 3 → 2 → 1 ลอยขึ้นแท่นตามลำดับ
    o.g.position.set(POD_X[i],STAGE_Y+POD_H[i]-0.6*(1-e),0.05);o.g.rotation.y=-POD_X[i]*0.08;o.g.scale.setScalar(Math.max(0.001,e));
    podPose(o,i,now,dt,i);});
  for(const [id,o] of STAGE.chars)if(!want.has(id))o.g.visible=false;
  STAGE.slotRings.forEach(r=>r.visible=false);STAGE.env.forEach(g=>g.visible=false);STAGE.wins.forEach(m=>m.visible=true);
  for(const c of STAGE.candles)c.g.position.y=c.y+Math.sin(now/900+c.ph)*0.25;
  STAGE.rune.rotation.z=now/6000;STAGE.rune.material.opacity=0.4+0.15*Math.sin(now/500);STAGE.dust.rotation.y=now/30000;
  const cupT=Math.min(1,Math.max(0,(POD.t-1.0)/0.8));
  POD.cup.visible=cupT>0;POD.cup.position.set(0,STAGE_Y+POD_H[0]+2.4+Math.sin(now/600)*0.08+(1-cupT)*1.5,0.05);POD.cup.rotation.y=now/700;
  // กล้อง: เลื่อนเข้าหาแท่นช้า ๆ มุมต่ำมองขึ้น
  const u=Math.min(1,POD.t/2.5),e=1-Math.pow(1-u,3);
  cam.position.set(Math.sin(now/4000)*0.25,lerp(2.6,2.0,e),lerp(10.5,7.2,e));cam.lookAt(0,1.95,0);
  rpass.scene=stage;gl.shadowMap.needsUpdate=true;composer.render();rpass.scene=scene;
  // 2D: หัวข้อ + ชื่อ/สถิติใต้แท่น + ประกายทองโปรย
  cx.save();cx.textAlign='center';cx.textBaseline='middle';
  cx.globalAlpha=Math.min(1,POD.t/0.6);
  cx.font='900 38px "Cinzel Decorative",Cinzel,serif';cx.lineWidth=5;cx.strokeStyle='rgba(30,18,4,.85)';cx.strokeText('Hall of Champions',SW/2,58);
  const hg=cx.createLinearGradient(0,40,0,76);hg.addColorStop(0,'#fff4cc');hg.addColorStop(1,'#d9a640');cx.fillStyle=hg;cx.shadowColor='#ffcc55';cx.shadowBlur=18;cx.fillText('Hall of Champions',SW/2,58);cx.shadowBlur=0;
  cx.font='500 15px Kanit,sans-serif';cx.fillStyle='rgba(255,240,210,.85)';cx.fillText('ห้องโถงแห่งผู้ชนะ',SW/2,92);
  POD.rows.forEach((r,i)=>{const s=stageScreen(POD_X[i],STAGE_Y+0.15,0.9);if(!s)return;cx.globalAlpha=Math.min(1,Math.max(0,(POD.t-0.25*(2-i)-0.4)/0.4));
    cx.font='900 30px "Cinzel Decorative",Cinzel,serif';cx.fillStyle=POD_C[i];cx.strokeStyle='rgba(0,0,0,.7)';cx.lineWidth=4;cx.strokeText(['I','II','III'][i],s[0],s[1]+18);cx.fillText(['I','II','III'][i],s[0],s[1]+18);
    cx.font='700 17px Kanit,sans-serif';cx.strokeText(r.n,s[0],s[1]+50);cx.fillStyle=r.id===NET.myId?'#fff4cc':'#ffffff';cx.fillText(r.n,s[0],s[1]+50);
    cx.font='500 13px Kanit,sans-serif';cx.fillStyle='rgba(255,255,255,.8)';cx.fillText((r.k||0)+' ฆ่า • '+(r.dmg||0)+' ดาเมจ',s[0],s[1]+72);});
  cx.globalAlpha=1;
  if(POD.t<5.5)for(let i=0;i<4;i++)POD.spark.push({x:Math.random()*SW,y:-10,vy:60+Math.random()*90,vx:(Math.random()-0.5)*30,r:1.5+Math.random()*2.5,c:Math.random()<0.7?'#ffd86b':'#fff4cc',ph:Math.random()*6});
  cx.globalCompositeOperation='lighter';
  for(let i=POD.spark.length-1;i>=0;i--){const p=POD.spark[i];p.y+=p.vy*dt;p.x+=p.vx*dt+Math.sin(now/300+p.ph)*0.4;if(p.y>SH+10){POD.spark.splice(i,1);continue;}
    cx.globalAlpha=0.5+0.5*Math.sin(now/120+p.ph);cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,p.r,0,Math.PI*2);cx.fill();}
  cx.globalCompositeOperation='source-over';cx.globalAlpha=1;
  if(POD.t>1){cx.font='400 12px Kanit,sans-serif';cx.fillStyle='rgba(255,255,255,.55)';cx.fillText('คลิก / Space = ข้าม',SW/2,SH-24);}
  cx.restore();
}
