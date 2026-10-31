// =====================================================================
//  สายน้ำ 💧 — ภาพฝั่งผู้เล่น • VFX = assets/fx/water/* (tools/water-vfx-gen.py, สไตล์ designs/water_ref/style_toon_orb.png)
//  เรียกจาก: efxFX (js/25, z ขึ้นต้น 'wt') • syncPlayers (js/35 waterFX) • render loop (js/37 syncWater) • HUD (js/35 drawWaterHud)
// =====================================================================
const WTV={st:new Map(),wf:new Map()};
const WTC={hi:'#e3f7ff',main:'#4fc3ff',deep:'#1466c8',neon:'#7ff6ff'};
function wtState(id){let s=WTV.st.get(id);if(!s){s={};WTV.st.set(id,s);}return s;}
function wtStop(s,k){if(s[k]){fxStop(s[k]);s[k]=null;}}
function wtMesh(s,k){if(s[k]){scene.remove(s[k]);s[k]=null;}}
const wtAlive=I=>I&&FXR.inst.includes(I);
// เล่น fx วน ค้างไว้ใน s[k] (เล่นใหม่ถ้าหลุด)
function wtLoop(s,k,name,o){if(!wtAlive(s[k]))s[k]=fxPlay(name,o);return s[k];}

// ---------- ต่อผู้เล่น: โล่ฟองน้ำ/ฮีล • ลูกผู้ช่วยที่ไหล่ • ร่างโคลน + เส้นน้ำ • ลำน้ำ Abyssal • Moonwater • มังกร ----------
function waterFX(o,p,pz,now,dt){
  const A=p.wt,s=WTV.st.get(p.id);
  if(!A){if(s){for(const k of ['sh','heal','fam','cl','beam','moon','drg','aim'])wtStop(s,k);wtMesh(s,'ln');}return;}
  const S=wtState(p.id),alive=p.al&&!p.dn,a=p.a||0,t=now/1000;
  // โล่ฟองน้ำ + ฮีล (มีเกจ)
  if(alive&&p.sh){wtLoop(S,'sh','water/shield_bubble',{x:p.x,y:p.y,h:0,follow:p.id});if(A[0]>0)wtLoop(S,'heal','water/shield_heal',{x:p.x,y:p.y,h:0,follow:p.id});else wtStop(S,'heal');}
  else{wtStop(S,'sh');wtStop(S,'heal');}
  // ลูกผู้ช่วย: ลอยที่ไหล่ขวา (ผู้ใช้: ให้เห็นง่ายว่ากำลังใช้)
  if(alive&&A[1]){const I=wtLoop(S,'fam','water/fam_orb',{x:p.x,y:p.y,h:2,aim:false});if(I){const rx=Math.cos(a+Math.PI/2),ry=Math.sin(a+Math.PI/2);I.x=p.x+rx*16;I.y=p.y+ry*16;I.h=(pz||0)+2.15+Math.sin(t*3)*0.08;}}
  else wtStop(S,'fam');
  // ร่างโคลน + เส้นน้ำบนพื้นจากโคลนถึงตัวเรา
  if(A[4]){const I=wtLoop(S,'cl','water/clone',{x:A[4][0],y:A[4][1],h:0,a,aim:false});if(I){I.x=A[4][0];I.y=A[4][1];}
    const cx=tx(A[4][0]),cz=tz(A[4][1]),cy=GY(A[4][0],A[4][1]),P=o.g.position;
    if(!S.ln){S.ln=new THREE.Mesh(new THREE.PlaneGeometry(0.42,1),new THREE.MeshBasicMaterial({color:WTC.neon,transparent:true,opacity:0.7,depthWrite:false,side:THREE.DoubleSide}));S.ln.rotation.order='YXZ';S.ln.rotation.x=-Math.PI/2;scene.add(S.ln);}
    const dx=P.x-cx,dz=P.z-cz,L=Math.hypot(dx,dz)||0.01;S.ln.scale.set(1,L,1);S.ln.position.set((P.x+cx)/2,Math.min(cy,P.y)+0.06,(P.z+cz)/2);S.ln.rotation.y=Math.atan2(dx,dz);
    S.ln.material.opacity=0.5+0.25*Math.sin(t*7);}
  else{wtStop(S,'cl');wtMesh(S,'ln');}
  // ลำน้ำ Abyssal Beam (3 วิ) — fx ตามตัว หันตามตัวผู้เล่น (host หมุนตัวตามลำ)
  if(A[3]!==null&&A[3]!==undefined)wtLoop(S,'beam','water/beam_loop',{x:p.x,y:p.y,h:0,follow:p.id});else wtStop(S,'beam');
  // Moonwater Arts 8 วิ
  if(alive&&A[2])wtLoop(S,'moon','water/moon_aura',{x:p.x,y:p.y,h:0,follow:p.id});else wtStop(S,'moon');
  // มังกร: ลอยเหนือหัวขวาระหว่างเลือกจุด + วงเล็ง (เฉพาะเรา)
  if(A[5]===2)wtLoop(S,'drg','water/dragon_hover',{x:p.x,y:p.y,h:0,follow:p.id});else wtStop(S,'drg');
  if(A[5]===2&&p.id===NET.myId){let gx=typeof INPUT.gx==='number'?INPUT.gx:p.x,gy=typeof INPUT.gy==='number'?INPUT.gy:p.y;const d=Math.hypot(gx-p.x,gy-p.y);if(d>700){gx=p.x+(gx-p.x)/d*700;gy=p.y+(gy-p.y)/d*700;}
    const I=wtLoop(S,'aim','water/dragon_aim',{x:gx,y:gy,h:0,aim:false});if(I){I.x=gx;I.y=gy;}}
  else wtStop(S,'aim');
}

// ---------- ทั้งเกม: ลูกผู้ช่วยที่กำลังพุ่ง (ล็อกเป้า) ----------
function syncWater(v,dt,now){
  const sf=new Set();
  for(const f of (v.WF||[])){sf.add(f[0]);let I=WTV.wf.get(f[0]);if(!wtAlive(I)){I=fxPlay('water/fam_shot',{x:f[1],y:f[2],h:f[3],aim:false});if(I)WTV.wf.set(f[0],I);}if(I){I.x=f[1];I.y=f[2];I.h=f[3];}}
  for(const [id,I] of WTV.wf)if(!sf.has(id)){fxStop(I);WTV.wf.delete(id);}
}

// ---------- เหตุการณ์ (efx z 'wt…') ----------
function waterEfx(ev){
  const z=ev.z,x=ev.x,y=ev.y,H=ev.h!==undefined?ev.h:0,me=myPos(),near=!me||Math.hypot(x-me.x,y-me.y)<1100,a=ev.a||0;
  switch(z){
    case 'wtslash':fxPlay('water/ba_slash',{x,y,h:0,follow:ev.id});if(near)snd('cast_pull',ev);return true;
    case 'wtsink':fxPlay('water/dash_sink',{x,y,h:0});if(near)snd('cast_pull',ev);return true;
    case 'wtpop':fxPlay('water/dash_pop',{x,y,h:0});if(near)shake(0.15);return true;
    case 'wtclend':return true;
    case 'wtfam':fxPlay('water/dash_pop',{x,y,h:0,s:0.5});return true;
    case 'wtfamoff':return true;
    case 'wtfamhit':fxPlay('water/fam_hit',{x,y,h:H});return true;
    case 'wtwave':fxPlay('water/riptide',{x,y,h:0,a,aim:false});if(near){shake(0.12);snd('cast_pull',ev);}return true;
    case 'wtcage':fxPlay('water/cage_bubble',{x,y,h:0,follow:ev.n});return true;
    case 'wtab':if(!ev.n)fxPlay('water/beam_cast',{x,y,h:0,follow:ev.id});if(near)snd(ev.n?'break':'cast_pull',ev);if(ev.n&&near)shake(0.12);return true;
    case 'wtaboff':return true;
    case 'wtmw':fxPlay('water/dash_pop',{x,y,h:0,s:0.6});return true;
    case 'wtmwoff':return true;
    case 'wtmb':fxPlay('water/moon_beam',{x,y,h:0,a,aim:false});if(near)snd('break',ev);return true;
    case 'wtdg':fxPlay('water/dragon_intro',{x,y,h:0,follow:ev.id});if(near){shake(0.2);snd('cast_pull',ev);}return true;
    case 'wtdgaim':return true;
    case 'wtdgdive':{const c=VIEW.cur&&VIEW.cur.P.find(q=>q.id===ev.id),da=c?Math.atan2(y-c.y,x-c.x):0;
      fxPlay('water/dragon_dive',{x,y,h:0,a:da,aim:false});if(near)snd('break',ev);later(0.7,()=>{if(near)snd('break',ev);});return true;}
    case 'wtdgend':return true;
  }
  return false;
}

// ---------- HUD: เกจฮีลโล่ (โค้งซ้ายรอบเป้าเล็ง) ----------
function drawWaterHud(x,y,A,me){const g=Math.max(0,Math.min(70,A[0]))/70,R=34,a0=Math.PI*0.62,a1=Math.PI*1.38;
  cx.lineCap='round';cx.lineWidth=5;cx.strokeStyle='rgba(0,0,0,0.45)';cx.beginPath();cx.arc(x,y,R,a0,a1);cx.stroke();
  if(g>0){cx.strokeStyle=WTC.main;cx.lineWidth=3.5;cx.beginPath();cx.arc(x,y,R,a1-(a1-a0)*g,a1);cx.stroke();}
  cx.lineCap='butt';cx.font='600 12px Kanit,sans-serif';cx.textAlign='right';cx.fillStyle='#bfeaff';cx.fillText('+'+Math.floor(A[0]),x-R-8,y+4);}
