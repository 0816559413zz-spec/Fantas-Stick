// =====================================================================
//  สายน้ำ 💧 — ภาพฝั่งผู้เล่น (ชั่วคราว: ทรงง่ายๆ สีฟ้า ไว้ลองเล่นก่อนทำ VFX จริงทีละสกิล — designs/water.md)
//  เรียกจาก: efxFX (js/25, z ขึ้นต้น 'wt') • syncPlayers (js/35 waterFX) • render loop (js/37 syncWater) • HUD (js/35 drawWaterHud)
// =====================================================================
const WTV={st:new Map(),wv:new Map(),wf:new Map(),tmp:[]};
const WTC={hi:'#e3f7ff',main:'#4fc3ff',deep:'#1466c8',neon:'#7ff6ff'};
function wtMat(col,op){return new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide});}
function wtGlow(col,s){const g=new THREE.Sprite(glowMat(col,1.4));g.scale.set(s,s,s);return g;}
// ชิ้นชั่วคราวที่หายเอง (แสงลำน้ำ ฟองขัง ฯลฯ): fn(o,k) เรียกทุกเฟรม k = 0→1
function wtTemp(obj,life,fn){scene.add(obj);WTV.tmp.push({obj,life,t:0,fn});}
function wtState(id){let s=WTV.st.get(id);if(!s){s={};WTV.st.set(id,s);}return s;}
function wtKill(s,k){if(s[k]){scene.remove(s[k]);s[k]=null;}}

// ---------- ต่อผู้เล่น: ลูกผู้ช่วยที่ไหล่ • ร่างโคลน + เส้นน้ำบนพื้น • ลำน้ำ Abyssal • มังกร ----------
function waterFX(o,p,pz,now,dt){
  const A=p.wt;const s=WTV.st.get(p.id);
  if(!A){if(s)for(const k of ['fam','cl','ln','beam','drg','aim'])wtKill(s,k);return;}
  const S=wtState(p.id),P=o.g.position,a=p.a||0,rx=Math.cos(a+Math.PI/2),ry=Math.sin(a+Math.PI/2),t=now/1000;
  // ลูกผู้ช่วย: ลอยที่ไหล่ขวา เรืองชัดๆ (ผู้ใช้: ให้เห็นง่ายว่ากำลังใช้)
  if(A[1]){if(!S.fam){S.fam=new THREE.Group();S.fam.add(new THREE.Mesh(new THREE.SphereGeometry(0.28,16,12),wtMat(WTC.main,0.85)),wtGlow(WTC.neon,1.6));scene.add(S.fam);}
    S.fam.position.set(P.x+rx*0.75,P.y+2.15+Math.sin(t*3)*0.08,P.z+ry*0.75);}else wtKill(S,'fam');
  // ร่างโคลน + เส้นน้ำบนพื้นจากโคลนถึงตัวเรา
  if(A[4]){const cx=tx(A[4][0]),cz=tz(A[4][1]),cy=GY(A[4][0],A[4][1]);
    if(!S.cl){S.cl=new THREE.Mesh(new THREE.CapsuleGeometry(0.42,1.1,4,10),wtMat(WTC.main,0.45));scene.add(S.cl);}
    S.cl.position.set(cx,cy+0.95,cz);
    if(!S.ln){S.ln=new THREE.Mesh(new THREE.PlaneGeometry(0.28,1),wtMat(WTC.neon,0.6));S.ln.rotation.x=-Math.PI/2;S.ln.rotation.order='YXZ';scene.add(S.ln);}
    const dx=P.x-cx,dz=P.z-cz,L=Math.hypot(dx,dz)||0.01;S.ln.scale.set(1,L,1);S.ln.position.set((P.x+cx)/2,Math.min(cy,P.y)+0.06,(P.z+cz)/2);S.ln.rotation.y=Math.atan2(dx,dz);
    S.ln.material.opacity=0.45+0.2*Math.sin(t*6);}
  else{wtKill(S,'cl');wtKill(S,'ln');}
  // ลำน้ำ Abyssal Beam (3 วิ)
  if(A[3]!==null&&A[3]!==undefined){const ba=A[3]/100,L=35;
    if(!S.beam){S.beam=new THREE.Group();const c=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.75,L,14,1,true),wtMat(WTC.main,0.55)),c2=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.3,L,10,1,true),wtMat(WTC.hi,0.9));
      for(const m of [c,c2]){m.rotation.x=Math.PI/2;m.position.z=L/2;S.beam.add(m);}S.beam.add(wtGlow(WTC.neon,3.2));scene.add(S.beam);}
    S.beam.position.set(P.x+Math.cos(ba)*0.8,P.y+1.6,P.z+Math.sin(ba)*0.8);S.beam.rotation.y=Math.atan2(Math.cos(ba),Math.sin(ba));
    S.beam.children[0].scale.set(1+0.12*Math.sin(t*30),1,1+0.12*Math.sin(t*30));}else wtKill(S,'beam');
  // มังกร (หัว + สายน้ำ): intro วนรอบตัว → เหนือหัวขวา
  if(A[5]===1||A[5]===2){if(!S.drg){S.drg=new THREE.Group();for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(i===0?0.55:0.42-i*0.03,12,10),wtMat(i===0?WTC.hi:WTC.main,i===0?0.95:0.7));S.drg.add(m);}scene.add(S.drg);}
    S.drg.children.forEach((m,i)=>{const u=t*2.4-i*0.28;let x,y,z;
      if(A[5]===1){x=P.x+Math.cos(u*2)*2.2;z=P.z+Math.sin(u*2)*2.2;y=P.y+1.5+Math.sin(u*3)*0.8;}
      else{x=P.x+rx*1.6+Math.cos(u)*0.5*(i/9);z=P.z+ry*1.6+Math.sin(u)*0.5*(i/9);y=P.y+3.4-i*0.25+Math.sin(u*2)*0.25;}
      m.position.set(x,y,z);});}else wtKill(S,'drg');
  // วงเล็งอัลติ (เฉพาะเรา)
  if(A[5]===2&&p.id===NET.myId){if(!S.aim){S.aim=new THREE.Mesh(new THREE.RingGeometry(10.4,11,48),wtMat(WTC.neon,0.7));S.aim.rotation.x=-Math.PI/2;S.aim.renderOrder=20;S.aim.material.depthTest=false;scene.add(S.aim);}
    let gx=typeof INPUT.gx==='number'?INPUT.gx:p.x,gy=typeof INPUT.gy==='number'?INPUT.gy:p.y;const d=Math.hypot(gx-p.x,gy-p.y);if(d>700){gx=p.x+(gx-p.x)/d*700;gy=p.y+(gy-p.y)/d*700;}
    S.aim.position.set(tx(gx),GY(gx,gy)+0.08,tz(gy));S.aim.material.opacity=0.5+0.3*Math.sin(t*8);}else wtKill(S,'aim');
}

// ---------- ทั้งเกม: คลื่น Riptide • ลูกผู้ช่วยที่กำลังพุ่ง • ชิ้นชั่วคราว ----------
function syncWater(v,dt,now){
  const sv=new Set();
  for(const w of (v.WV||[])){sv.add(w[0]);let m=WTV.wv.get(w[0]);
    if(!m){m=new THREE.Group();const body=new THREE.Mesh(new THREE.CylinderGeometry(4,4,10,20,1,true,-Math.PI/2,Math.PI),wtMat(WTC.main,0.6)),crest=new THREE.Mesh(new THREE.BoxGeometry(10,0.35,1.2),wtMat(WTC.hi,0.85));
      body.rotation.z=Math.PI/2;body.scale.set(1,1,0.35);body.position.y=0;crest.position.set(0,4,0.4);m.add(body,crest);scene.add(m);WTV.wv.set(w[0],m);}
    const d=400*w[4],x=w[1]+Math.cos(w[3])*d,y=w[2]+Math.sin(w[3])*d;m.position.set(tx(x),GY(x,y),tz(y));m.rotation.y=Math.atan2(Math.cos(w[3]),Math.sin(w[3]));
    const k=Math.min(1,w[4]*5);m.scale.set(1,k,1);}
  for(const [id,m] of WTV.wv)if(!sv.has(id)){scene.remove(m);WTV.wv.delete(id);burst(m.position.x/S3+MW/2,m.position.z/S3+MH/2,WTC.main,14,160,0.5,3,{h:1,g:2});}
  const sf=new Set();
  for(const f of (v.WF||[])){sf.add(f[0]);let g=WTV.wf.get(f[0]);if(!g){g=wtGlow(WTC.neon,0.9);scene.add(g);WTV.wf.set(f[0],g);}g.position.set(tx(f[1]),GY(f[1],f[2])+f[3],tz(f[2]));}
  for(const [id,g] of WTV.wf)if(!sf.has(id)){scene.remove(g);WTV.wf.delete(id);}
  for(const T of WTV.tmp){T.t+=dt;T.fn(T.obj,Math.min(1,T.t/T.life));}
  WTV.tmp=WTV.tmp.filter(T=>{if(T.t>=T.life){scene.remove(T.obj);return false;}return true;});
}

// ---------- เหตุการณ์ (efx z 'wt…') ----------
function waterEfx(ev){
  const z=ev.z,x=ev.x,y=ev.y,H=ev.h!==undefined?ev.h:0,me=myPos(),near=!me||Math.hypot(x-me.x,y-me.y)<1100,a=ev.a||0,X=tx(x),Z=tz(y),Y=GY(x,y)+H;
  switch(z){
    case 'wtslash':{const m=new THREE.Mesh(new THREE.TorusGeometry(1.1,0.07,6,24,Math.PI*0.9),wtMat(WTC.neon,0.9));m.position.set(X+Math.cos(a)*0.9,Y+1.7,Z+Math.sin(a)*0.9);m.rotation.y=Math.atan2(Math.cos(a),Math.sin(a))+Math.PI/2;
      wtTemp(m,0.7,(o,k)=>{o.material.opacity=0.9*(1-k*k);});if(near)snd('cast_pull',ev);return true;}
    case 'wtsink':burst(x,y,WTC.main,16,120,0.45,2.5,{h:H+0.2,g:1});ring(x,y,WTC.neon,40,0.35,H+0.05);if(near)snd('cast_pull',ev);return true;
    case 'wtpop':burst(x,y,WTC.hi,22,260,0.5,3,{h:H+0.5,g:3});ring(x,y,WTC.main,120,0.4,H+0.08);if(near)shake(0.15);return true;
    case 'wtclend':return true;
    case 'wtfam':burst(x,y,WTC.neon,12,90,0.4,2,{h:H+2,g:0});return true;
    case 'wtfamoff':return true;
    case 'wtfamhit':burst(x,y,WTC.neon,8,120,0.3,2,{h:H,g:1});return true;
    case 'wtwave':if(near){shake(0.12);snd('cast_pull',ev);}return true;
    case 'wtcage':{const m=new THREE.Mesh(new THREE.SphereGeometry(1.25,20,14),wtMat(WTC.main,0.4));m.add(wtGlow(WTC.neon,2.4));
      wtTemp(m,2,(o,k)=>{const q=PM3.get(ev.n),P=q&&q.g.position;if(P)o.position.set(P.x,P.y+1.1,P.z);else o.position.set(X,Y,Z);o.scale.setScalar(1+0.05*Math.sin(k*40));o.material.opacity=k>0.9?0.4*(1-k)*10:0.4;});
      burst(x,y,WTC.hi,14,160,0.4,2.5,{h:H,g:1});return true;}
    case 'wtab':if(near)snd(ev.n?'break':'cast_pull',ev);if(ev.n&&near)shake(0.12);return true;
    case 'wtaboff':return true;
    case 'wtmw':burst(x,y,WTC.neon,18,140,0.5,2.5,{h:H+1.5,g:0});ring(x,y,WTC.neon,60,0.4,H+0.1);return true;
    case 'wtmwoff':return true;
    case 'wtmb':{const L=45,g=new THREE.Group(),c=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.5,L,12,1,true),wtMat(WTC.hi,0.9));c.rotation.x=Math.PI/2;c.position.z=L/2;g.add(c,wtGlow(WTC.neon,2.2));
      g.position.set(X+Math.cos(a)*0.8,Y+1.6,Z+Math.sin(a)*0.8);g.rotation.y=Math.atan2(Math.cos(a),Math.sin(a));wtTemp(g,0.6,(o,k)=>{o.children[0].material.opacity=0.9*(1-k);o.children[0].scale.set(1-0.6*k,1,1-0.6*k);});
      if(near)snd('break',ev);return true;}
    case 'wtdg':if(near){shake(0.2);snd('cast_pull',ev);}return true;
    case 'wtdgaim':return true;
    case 'wtdgdive':{const g=new THREE.Group();for(let i=0;i<9;i++)g.add(new THREE.Mesh(new THREE.SphereGeometry(i===0?0.9:0.7,12,10),wtMat(i===0?WTC.hi:WTC.main,0.85)));
      wtTemp(g,2.4,(o,k)=>{const fall=Math.min(1,k/0.25);o.children.forEach((m,i)=>{const u=Math.max(0,fall-i*0.06);m.position.set(X+Math.sin(i*0.9)*0.6,Y+12*(1-u)+i*0.9*(1-fall*0.6),Z+Math.cos(i*0.9)*0.6);m.material.opacity=k>0.85?0.85*(1-k)/0.15:0.85;});
        if(Math.random()<0.5)burst(x+(Math.random()-0.5)*300,y+(Math.random()-0.5)*300,WTC.hi,6,200,0.4,3,{h:H+0.3,g:4});});
      later(0.4,()=>{ring(x,y,WTC.neon,220,0.6,H+0.1);if(near)shake(0.4);});if(near)snd('break',ev);return true;}
    case 'wtdgend':ring(x,y,WTC.main,220,0.5,0.1);return true;
  }
  return false;
}

// ---------- HUD: เกจฮีลโล่ (โค้งซ้ายรอบเป้าเล็ง) ----------
function drawWaterHud(x,y,A,me){const g=Math.max(0,Math.min(70,A[0]))/70,R=34,a0=Math.PI*0.62,a1=Math.PI*1.38;
  cx.lineCap='round';cx.lineWidth=5;cx.strokeStyle='rgba(0,0,0,0.45)';cx.beginPath();cx.arc(x,y,R,a0,a1);cx.stroke();
  if(g>0){cx.strokeStyle=WTC.main;cx.lineWidth=3.5;cx.beginPath();cx.arc(x,y,R,a1-(a1-a0)*g,a1);cx.stroke();}
  cx.lineCap='butt';cx.font='600 12px Kanit,sans-serif';cx.textAlign='right';cx.fillStyle='#bfeaff';cx.fillText('+'+Math.floor(A[0]),x-R-8,y+4);}
