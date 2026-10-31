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
  if(!A){if(o.wWings)o.wWings.visible=false;const s=WV.st.get(p.id);if(s){for(const k of ['wing','guard'])if(s[k]){fxKill(s[k]);s[k]=null;}}return;}
  const s=wvState(p.id),alive=p.al&&!p.dn,guard=alive&&p.sh,h=o.zs||0;
  // ปีกติดหลังตลอดเวลา (ท่ากางเกือบนิ่ง) — ซ่อนตอนยกโล่ (ปีกห่อแทน)
  const big=A[5]===1;   // Featherwing บินอยู่: ปีกใหญ่ 1.6 เท่า (ผู้ใช้)
  // ปีกเวทสายลม (designs/wind-wings-magic.html ผู้ใช้ผ่าน 2026-10-31) แทน fx wind/wing_idle เดิม
  if(alive&&!guard){if(!o.wWings){o.wWings=makeWindWings();o.wWings.position.set(0,1.35,-0.25);o.b.add(o.wWings);}
    o.wWings.visible=true;poseWindWings(o.wWings,big,dt);}
  else if(o.wWings)o.wWings.visible=false;
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
  for(const o of (v.WO||[])){sv.add(o[0]);const I=WV.vo.get(o[0]);if(I){I.x=o[1];I.y=o[2];}}   // หลุมดำ Void Spheres เลื่อนตามโฮสต์
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
    case 'wnwpass':fxPlay('wind/wall_hit',{x,y,h:0,a:a+Math.PI});if(near)snd('hit',ev);return true;
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
    case 'wnvxcap':fxPlay('wind/ba_hit',{x,y,h:Math.max(0,H-0.2),a:Math.random()*6.283});return true;
    case 'wnvocast':fxPlay('wind/void_matter',{x,y,h:H,a,aim:false});if(near)snd('cast_pull',ev);return true;
    case 'wnvohole':{const I=fxPlay('wind/void_hole',{x,y,h:H,a,aim:false});if(I)WV.vo.set(ev.n,I);if(near)shake(0.15);return true;}
    case 'wnvoboom':{const I=WV.vo.get(ev.n);if(I){fxKill(I);WV.vo.delete(ev.n);}fxPlay('wind/void_boom',{x,y,h:H,a,aim:false});if(near){shake(0.6);snd('break',ev);if(ev.c)hitStop(0.08);}return true;}
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
  const feather=new THREE.ShaderMaterial(Object.assign({uniforms:{time:WWU.time},
    vertexShader:`attribute float layer;uniform float time;varying vec2 vUv;varying float vL;
      void main(){vUv=uv;vL=layer;vec3 p=position;float u=uv.x;
        p.z+=sin(u*7.0-time*5.0+layer*0.9)*0.07*u;p.y+=sin(u*9.0-time*6.5+layer*1.3)*0.045*u*u;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader:`uniform float time;varying vec2 vUv;varying float vL;${WW_NOISE}
      float h(float n){return fract(sin(n)*43758.5453);}
      void main(){float u=vUv.x,v=vUv.y,av=abs(v);
        float n=fbm(vec2(u*3.0-time*1.4,v*2.0+vL*1.7));
        float streams=pow(0.5+0.5*sin(v*9.0+n*5.0+vL*2.3),3.0);
        float gust=smoothstep(0.35,0.85,fbm(vec2(u*5.0-time*3.2,v*3.0+vL)));
        float edge=smoothstep(1.0,0.45+0.4*n,av),tipFade=smoothstep(1.0,0.62+0.3*n,u),rootFade=smoothstep(0.0,0.18,u);
        float cell=floor(u*12.0-time*2.0);
        float spark=step(0.8,h(cell+vL*13.0))*smoothstep(0.3,0.0,abs(fract(u*12.0-time*2.0)-0.5))*smoothstep(0.25,0.0,abs(v-(h(cell*3.1+vL)-0.5)*1.2));
        float a=(0.1+streams*(0.3+0.7*gust)+0.18*n+spark*0.9)*edge*tipFade*rootFade;
        vec3 col=mix(vec3(0.08,0.8,0.42),vec3(0.6,1.0,0.78),clamp(streams*gust*0.8+u*0.2,0.0,1.0))+vec3(1.0,0.95,0.7)*spark;
        gl_FragColor=vec4(col*a*1.3,clamp(a*1.2,0.0,0.9));}`},base));
  // ริบบิ้นลม = ขีดลมไหลไปตามเส้นโค้งรอบปีก
  const ribbon=new THREE.ShaderMaterial(Object.assign({uniforms:{time:WWU.time},
    vertexShader:`attribute float layer;uniform float time;varying vec2 vUv;varying float vL;
      void main(){vUv=uv;vL=layer;vec3 p=position;p.z+=sin(uv.x*6.0-time*4.0+layer)*0.12;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader:`uniform float time;varying vec2 vUv;varying float vL;
      void main(){float u=vUv.x,av=abs(vUv.y);float k=fract(u*2.2-time*(0.9+fract(vL*0.37)*0.6)+vL*0.31);
        float a=smoothstep(0.0,0.5,k)*smoothstep(1.0,0.6,k)*smoothstep(1.0,0.0,av)*smoothstep(0.0,0.1,u)*smoothstep(1.0,0.85,u)*0.9;
        gl_FragColor=vec4(vec3(0.55,1.0,0.8)*a,a*0.8);}`},base));
  // วงเวทลมกลางหลัง (วาดลง canvas ครั้งเดียว)
  const S=256,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');g.translate(S/2,S/2);g.scale(0.5,0.5);
  g.strokeStyle='#bfffe0';g.lineCap='round';const ring=(r,w)=>{g.lineWidth=w;g.beginPath();g.arc(0,0,r,0,6.283);g.stroke();};
  ring(240,4);ring(222,2);ring(150,3);ring(136,1.5);ring(60,2);let sd=7;const rn=()=>(sd=(sd*16807)%2147483647)/2147483647;
  for(let k=0;k<28;k++){g.save();g.rotate(k/28*6.283);g.translate(0,-231);g.lineWidth=2;g.beginPath();for(let j=0;j<3;j++){g.moveTo((rn()-0.5)*12,(rn()-0.5)*10);g.lineTo((rn()-0.5)*12,(rn()-0.5)*10);}g.stroke();g.restore();}
  g.lineWidth=2.5;for(const r0 of [0,Math.PI/3]){g.beginPath();for(let k=0;k<=3;k++){const a=r0+k/3*6.283-Math.PI/2;g[k?'lineTo':'moveTo'](Math.cos(a)*150,Math.sin(a)*150);}g.stroke();}
  for(let k=0;k<6;k++){g.save();g.rotate(k/6*6.283);g.beginPath();g.arc(0,-100,22,0.63,4.71);g.stroke();g.restore();}
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const circle=new THREE.MeshBasicMaterial({map:tex,color:'#3fdf8f',transparent:true,opacity:0.55,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  return _wwMat={feather,ribbon,circle};}
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
function makeWindWings(){
  const M=wwMats();
  if(!_wwGeo){const rel=(P0,a)=>[a[0]-P0[0],a[1]-P0[1]],f=(L,z0,off)=>L.map(([P0,C,T,w],i)=>({P0,i:i+off,g:wwFeatherGeo([0,0],rel(P0,C),rel(P0,T),w,i+off,z0+i*0.03)}));
    _wwGeo={fe:[...f(WW_PRI,0,0),...f(WW_COV,-0.12,10)],rib:WW_RIB.map(([P0,C,T,w],i)=>wwFeatherGeo(P0,C,T,w,20+i,0.15+i*0.02))};}
  const W=new THREE.Group(),rig=new THREE.Group(),sides=[],fe=[];rig.scale.setScalar(WWS);W.add(rig);
  for(const sd of [1,-1]){const piv=new THREE.Group(),wing=new THREE.Group();wing.scale.x=sd;piv.position.x=sd*0.2;piv.add(wing);rig.add(piv);sides.push({piv,sd});
    for(const F of _wwGeo.fe){const fp=new THREE.Group();fp.position.set(F.P0[0],F.P0[1],0);const m=new THREE.Mesh(F.g,M.feather);m.frustumCulled=false;m.renderOrder=3;fp.add(m);fp.userData.i=F.i;wing.add(fp);fe.push(fp);}
    for(const g of _wwGeo.rib){const m=new THREE.Mesh(g,M.ribbon);m.frustumCulled=false;m.renderOrder=3;wing.add(m);}}
  const circle=new THREE.Mesh(new THREE.PlaneGeometry(3.2,3.2),M.circle);circle.position.set(0,0.2,-0.3);circle.renderOrder=2;rig.add(circle);
  W.userData={sides,fe,circle,t:Math.random()*10,flap:0};return W;}
// ท่าปีก: ยืน = กางเกือบนิ่ง (ผู้ใช้ไม่เอากระพือตอนยืน) • บิน Featherwing (big) = ใหญ่ 1.6 เท่า + กระพือ
// ต้นแบบ: ตัวละครหัน +z ปีกอยู่ฝั่ง −z → ปีกกวาดไปข้างหลัง = หมุน y ตาม sd
function poseWindWings(W,big,dt){
  const d=W.userData;d.t+=dt;WWU.time.value=performance.now()/1000;
  d.flap+=((big?1:0)-d.flap)*Math.min(1,dt*4);const fl=Math.sin(d.t*(big?6:1.2))*(0.04+0.22*d.flap);
  W.scale.setScalar(1+0.6*d.flap);
  for(const {piv,sd} of d.sides){piv.rotation.y=-sd*(0.3+fl);piv.rotation.z=sd*fl*0.35;}
  for(const f of d.fe)f.rotation.z=Math.sin(d.t*2.0-f.userData.i*0.3)*0.03;
  d.circle.rotation.z=d.t*0.25;}
