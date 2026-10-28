// =====================================================================
//  สายลม 🌪️ — ภาพฝั่งเครื่องเล่น (ขั้นที่ 1) • ตรรกะอยู่ js/09-wind.js • ไฟล์นี้มีแต่นิยามฟังก์ชัน (โหลดท้าย)
//  เอฟเฟกต์ทั้งหมดมาจาก VFX Studio ที่ผู้ใช้ผ่านแล้ว (assets/fx/wind/*) — ชิ้นที่ใช้ในเกมแยกด้วย tools/wind-ingame-split.py
//  เรียกจาก: efxFX (js/25, z ขึ้นต้น 'wn') • syncPlayers (js/35 windFX) • render loop (js/37 syncWind)
// =====================================================================
const WV={st:new Map(),wl:new Map(),vo:new Map()};
const wvState=id=>{let s=WV.st.get(id);if(!s){s={};WV.st.set(id,s);}return s;};
const wvAlive=I=>!!I&&FXR.inst.indexOf(I)>=0;
// ---------- ทุกเฟรมของผู้เล่นสายลม: ปีกติดหลัง / ปีกห่อตอนยกโล่ / ดูดลมชาร์จเกจ ----------
function windFX(o,p,pz,now,dt){
  const A=p.wn;
  if(!A){const s=WV.st.get(p.id);if(s){for(const k of ['wing','guard'])if(s[k]){fxKill(s[k]);s[k]=null;}}return;}
  const s=wvState(p.id),alive=p.al&&!p.dn,guard=alive&&p.sh,h=o.zs||0;
  // ปีกติดหลังตลอดเวลา (ท่ากางเกือบนิ่ง) — ซ่อนตอนยกโล่ (ปีกห่อแทน)
  const big=A[5]===1;   // Featherwing บินอยู่: ปีกใหญ่ 1.6 เท่า (ผู้ใช้)
  if(alive&&!guard){if(!wvAlive(s.wing)||s.wingBig!==big){if(s.wing)fxKill(s.wing);s.wing=fxPlay('wind/wing_idle',{x:p.x,y:p.y,h,s:big?1.6:1,follow:p.id});s.wingBig=big;}}
  else if(s.wing){fxStop(s.wing);s.wing=null;}
  if(guard){if(!wvAlive(s.guard))s.guard=fxPlay('wind/shield_guard',{x:p.x,y:p.y,h,follow:p.id});}
  else if(s.guard){fxKill(s.guard);s.guard=null;}   // ห่อปีกยาว 9.5 วิ → ตัดทิ้งทันทีตอนลดโล่
  if(p.id===NET.myId)wvAimGhost(p,A,h);
  // ดูดลมชาร์จเกจ: ละอองลมไหลเข้าหาตัว
  if(alive&&A[1]&&Math.random()<0.8){const a=Math.random()*6.283,r=rnd(60,110);burst(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,Math.random()<0.5?'#8dff65':'#efffe8',1,-r*2.2,0.4,2.2,{h:h+rnd(0.4,1.8),g:0});}
  // เกจเต็ม: ประกายเขียวรอบมือ
  if(alive&&A[0]>=100&&Math.random()<0.35)burst(p.x+rnd(-14,14),p.y+rnd(-14,14),'#b8ff85',1,20,0.5,1.8,{h:h+rnd(0.8,1.6),vh:[0.5,1.5],g:-0.3});
}
// ---------- กำแพงลมจาก snapshot (ตามตำแหน่ง/ลบเมื่อหมด) ----------
function syncWind(v,dt,now){
  const seen=new Set();
  for(const w of (v.WW||[])){seen.add(w[0]);const o=WV.wl.get(w[0]);if(!o)continue;
    if(o.I){o.I.x=w[1];o.I.y=w[2];}if(o.P){o.P.x=w[1];o.P.y=w[2];if(!w[6]){fxStop(o.P);o.P=null;}}o.x=w[1];o.y=w[2];o.a=w[3];}
  const sv=new Set();
  for(const o of (v.WO||[])){sv.add(o[0]);let I=WV.vo.get(o[0]);if(!wvAlive(I)){I=fxPlay('wind/void_orb',{x:o[1],y:o[2],h:Math.max(0,o[3]-1.2),aim:false});if(I)WV.vo.set(o[0],I);}
    if(I){I.x=o[1];I.y=o[2];I.h=Math.max(0,o[3]-1.2);}}
  for(const [id,I] of WV.vo)if(!sv.has(id)){fxStop(I);WV.vo.delete(id);}
  for(const [id,o] of WV.wl)if(!seen.has(id)&&(o.age=(o.age||0)+dt)>0.5){if(o.I)fxStop(o.I);if(o.P)fxStop(o.P);WV.wl.delete(id);}
}
function wvWall(n){return WV.wl.get(n);}
// ---------- เหตุการณ์ (efx z 'wn…') ----------
function windEfx(ev){
  const z=ev.z,x=ev.x,y=ev.y,H=ev.h!==undefined?ev.h:0,me=myPos(),near=!me||Math.hypot(x-me.x,y-me.y)<1100,mine=ev.id===NET.myId,a=ev.a||0;
  switch(z){
    case 'wngb':fxPlay('wind/galeburst',{x,y,h:H,a});if(near)snd('cast_pull',ev);return true;
    case 'wngbhit':case 'wndshit':fxPlay('wind/ba_hit',{x,y,h:Math.max(0,H-0.2),a:Math.random()*6.283});return true;
    case 'wngbfull':fxPlay('wind/ba_hit',{x,y,h:H+1.2,a:0});ring(x,y,'#8dff65',30,0.3,H+0.1);if(mine)toast('GaleBurst พร้อม! คลิกซ้าย = ทอร์นาโด');return true;
    case 'wnchg':return true;
    case 'wnsbchg':ring(x,y,'#b8ff85',60,0.3,H+1);return true;
    case 'wnsb':fxPlay('wind/shield_burst',{x,y,h:H,follow:ev.id});if(near)shake(0.25);return true;
    case 'wnds':fxPlay('wind/dash_push',{x,y,h:H,a});return true;
    case 'wndswall':fxPlay('wind/wall_hit',{x,y,h:0,a:Math.random()*6.283});return true;
    case 'wnwaim':if(mine)toast('กำแพงลม: คลิกซ้าย = ดันไปข้างหน้า • คลิกขวา = วางตรงจุดเล็ง');return true;
    case 'wnwaimoff':return true;
    case 'wnwup':{const o={x,y,a,I:ev.m===2?null:fxPlay('wind/wall',{x,y,h:0,a}),P:ev.m?fxPlay('wind/wall_push',{x,y,h:0,a}):null};WV.wl.set(ev.n,o);return true;}
    case 'wnwstop':{const o=wvWall(ev.n);if(o&&o.P){fxStop(o.P);o.P=null;}fxPlay('wind/wall_stop',{x,y,h:0,a});return true;}
    case 'wnwhit':fxPlay('wind/wall_hit',{x,y,h:0,a:a+Math.PI});if(near)snd('hit',ev);return true;
    case 'wnwuns':{const o=wvWall(ev.n);if(o)o.U=fxPlay('wind/wall_unstable',{x,y,h:0,a});return true;}
    case 'wnwboom':{const o=wvWall(ev.n);if(o){if(o.I)fxKill(o.I);if(o.P)fxKill(o.P);if(o.U)fxKill(o.U);WV.wl.delete(ev.n);}fxPlay('wind/wall_break',{x,y,h:0,a});if(near){shake(0.35);snd('break',ev);}return true;}
    case 'wnwend':{const o=wvWall(ev.n);if(o){if(o.I)fxStop(o.I);if(o.P)fxStop(o.P);if(o.U)fxStop(o.U);WV.wl.delete(ev.n);}return true;}
    case 'wnwblk':fxPlay('wind/ba_hit',{x,y,h:Math.max(0,H-0.2),a:Math.random()*6.283});return true;
    case 'wndr':fxPlay('wind/windrift',{x,y,h:H,a});if(near)snd('cast_pull',ev);return true;
    case 'wndrslow':ring(x,y,'#8dff65',26,0.35,H+0.2);return true;
    case 'wndrland':case 'wndrwind':return true;   // ลงท่า/ลมตามมา อยู่ในเอฟเฟกต์ windrift แล้ว
    case 'wnvx':fxPlay('wind/vortex_bind',{x,y,h:H,a});later(0.8,()=>{if(near)shake(0.18);});if(near)snd('cast_pull',ev);return true;
    case 'wnvxstun':fxPlay('wind/wall_hit',{x,y,h:0,a:Math.random()*6.283});if(near)shake(0.15);return true;   // ลมรัดตัว = สตัน 0.5 วิ
    case 'wnvxcap':case 'wnvohit':fxPlay('wind/ba_hit',{x,y,h:Math.max(0,H-0.2),a:Math.random()*6.283});return true;
    case 'wnvofire':if(near)snd('cast_pull',ev);return true;
    case 'wnvoend':burst(x,y,'#8dff65',8,90,0.3,2,{h:H,g:0});return true;
    case 'wnfw':fxPlay('wind/fw_takeoff',{x,y,h:H,aim:false});return true;
    case 'wnfwflick':fxPlay('wind/fw_flick',{x,y,h:Math.max(0,H-3.2),a});if(near)shake(0.2);return true;
    case 'wnfwend':case 'wnfwland':return true;
    case 'wnult':fxPlay('wind/eye_of_heaven',{x,y,h:H,a,aim:false});if(near)snd('cast_pull',ev);return true;
    case 'wnulslam':if(near)shake(0.3);return true;
    case 'wnulimp':if(near){shake(0.5);snd('break',ev);}return true;
    case 'wnsoon':if(mine)toast('สกิลนี้ของสายลมยังทำไม่เสร็จ (ขั้นที่ 2-3)');return true;
  }
  return false;
}
// ---------- HUD รอบเป้าเล็ง: เกจ GaleBurst (โค้งซ้าย) + ชาร์จกำแพงลม (จุด 3 จุดใต้เป้า) ----------
function drawWindHud(x,y,A,me){const g=Math.max(0,Math.min(100,A[0]))/100,full=g>=1,R=34,a0=Math.PI*0.62,a1=Math.PI*1.38;
  cx.lineCap='round';cx.lineWidth=5;cx.strokeStyle='rgba(0,0,0,0.45)';cx.beginPath();cx.arc(x,y,R,a0,a1);cx.stroke();
  if(g>0){cx.strokeStyle=full?`rgba(239,255,232,${0.75+0.25*Math.sin(performance.now()/120)})`:'#8dff65';cx.lineWidth=full?5:3.5;cx.beginPath();cx.arc(x,y,R,a1-(a1-a0)*g,a1);cx.stroke();}
  cx.lineCap='butt';cx.font='600 12px Kanit,sans-serif';cx.textAlign='right';cx.fillStyle=full?'#efffe8':'#b8ff85';cx.fillText(full?'GALE':Math.floor(g*100)+'%',x-R-8,y+4);
  for(let i=0;i<3;i++){cx.beginPath();cx.arc(x-12+i*12,y+R+8,3.5,0,6.283);cx.fillStyle=i<(A[2]|0)?'#8dff65':'rgba(0,0,0,0.45)';cx.fill();}
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
