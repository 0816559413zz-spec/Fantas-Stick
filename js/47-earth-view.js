// =====================================================================
//  สายดิน ⛰️ — ภาพฝั่งเครื่องเล่น (Stand หิน / กำแพง / เสา / เนิน / โดเมน / ฝุ่น / สว่าน / HUD)
//  ตรรกะอยู่ js/09-earth.js • ไฟล์นี้มีแต่นิยามฟังก์ชัน (โหลดท้ายสุด) — เรียกจาก syncPlayers / render loop / efxFX / makeProj / drawHUD
//  snapshot: p.ea = [Stand แตกเหลือกี่วิ, Rampage, ชาร์จ Auger (วิ), Wrath (1 ฟ้า 2 ลง 3 ร่างแปลง), เสาเหลือ, โดเมน, เวลา Wrath เหลือ, HP โล่, Crush ได้]
//            v.ES = สิ่งก่อสร้าง [id, ชนิด 0 กำแพง 1 เสา 2 เนิน 3 โดเมน, x1,y1,x2,y2, r, HP%, ทีม, เจ้าของ] • v.ED = ฝุ่น [id,x,y,r,เหลือ,ทีม]
// =====================================================================
Object.assign(PCOL,{erock:'#c9a36a',eslab:'#d8b47a'});
const ECOL={stone:'#8f7a5c',dark:'#5e4d38',dust:'#b39a74',glow:'#ffcf6a',mud:'#5b4128'};
var EV={st:new Map(),es:new Map(),anims:[],fog:null};
const eW=(x,y,h)=>new THREE.Vector3(tx(x),(h||0)+GY(x,y),tz(y));
const eYaw=(x1,y1,x2,y2)=>Math.atan2(x2-x1,y2-y1);
// หินเหลี่ยมขรุขระ: กล่องที่ขยับมุมแบบสุ่ม (low-poly rock) + สีหินหลายเฉด — ไม่ใช้ texture (texture หินของเกมเป็นลายอิฐ)
function eMat(col,op){return new THREE.MeshStandardMaterial({color:col||ECOL.stone,roughness:0.95,metalness:0,flatShading:true,emissive:'#24180a',emissiveIntensity:0.45,transparent:op!==undefined,opacity:op===undefined?1:op});}
function rockGeo(w,h,d,j,seg){const g=new THREE.BoxGeometry(w,h,d,seg||2,seg||2,seg||2),P=g.attributes.position,k=j===undefined?0.12:j,m=new Map();
  for(let i=0;i<P.count;i++){const key=[P.getX(i),P.getY(i),P.getZ(i)].map(v=>v.toFixed(3)).join();let o=m.get(key);if(!o){o=[rnd(-k,k)*w,rnd(-k,k)*h,rnd(-k,k)*d];m.set(key,o);}P.setXYZ(i,P.getX(i)+o[0],P.getY(i)+o[1],P.getZ(i)+o[2]);}
  g.computeVertexNormals();return g;}
// ---------- Stand หิน (คนหินลอยตัว แขนยาว หมัดใหญ่ ตาเรืองทอง) ----------
function makeStand(sc){
  const g=new THREE.Group(),mat=eMat(ECOL.stone,1),dk=eMat(ECOL.dark,1),glow=new THREE.MeshBasicMaterial({color:hdr(ECOL.glow,2.2),transparent:true});
  const B=(w,h,d,x,y,z,par,m)=>{const o=new THREE.Mesh(m===glow?new THREE.BoxGeometry(w,h,d):rockGeo(w,h,d,0.1),m||mat);o.position.set(x,y,z);o.castShadow=true;(par||g).add(o);return o;};
  const body=new THREE.Group();g.add(body);
  B(1.55,1.1,0.95,0,2.25,0,body);B(1.05,0.7,0.75,0,1.5,0,body,dk);B(0.8,0.45,0.65,0,1.0,0,body);
  for(const [x,y,r] of [[0.15,2.35,0.6],[-0.25,2.05,-0.4],[0.05,1.6,1.2]]){const c=B(0.5,0.04,0.02,x,y,0.49,body,glow);c.rotation.z=r;}   // รอยร้าวเรืองทอง
  const head=B(0.62,0.66,0.62,0,3.15,0.05,body);B(0.7,0.18,0.66,0,3.42,0.02,body,dk);
  for(const s of [-1,1]){B(0.12,0.07,0.04,s*0.15,3.18,0.37,body,glow);}
  const arm=s=>{const sh=B(0.66,0.62,0.74,s*1.02,2.6,0,body,dk),up=new THREE.Group();up.position.set(s*1.05,2.5,0);body.add(up);
    B(0.44,0.95,0.44,0,-0.45,0,up);const fo=new THREE.Group();fo.position.set(0,-0.92,0);up.add(fo);B(0.4,0.82,0.4,0,-0.4,0,fo,dk);B(0.62,0.55,0.62,0,-0.95,0,fo);return {up,fo};};
  const L=arm(-1),R=arm(1);
  for(const s of [-1,1]){B(0.45,0.85,0.45,s*0.36,0.42,0,body,dk);}
  g.scale.setScalar(sc||1);g.visible=false;scene.add(g);
  return {g,body,head,L,R,mats:[mat,dk,glow],op:0};}
function standOp(S,op){S.op=op;S.g.visible=op>0.02;for(const m of S.mats){m.transparent=op<0.99;m.opacity=op;m.depthWrite=op>0.5;}}
function standPose(S,k){   // k: {punch 0-1, hold 0/1, lean, run, t}
  S.R.up.rotation.set(-(k.punch||0)*1.55-(k.hold?1.2:0)-(k.raise||0)*2.6,0,0);S.R.fo.rotation.x=k.hold?-0.5:-(1-(k.punch||0))*0.5*(k.punch?1:0);
  S.L.up.rotation.set(-(k.hold?1.2:0)-(k.raise||0)*2.6+(k.punch?0.4:0),0,0);S.L.fo.rotation.x=k.hold?-0.5:-0.2;
  S.body.rotation.x=k.lean||0;S.body.position.y=Math.sin((k.t||0)*3)*0.08;
  if(k.run){const r=Math.sin(k.t*14)*0.7;S.R.up.rotation.x+=r;S.L.up.rotation.x-=r;}}
function eState(id){let s=EV.st.get(id);if(!s){s={stand:null,giant:null,drill:null,shield:null,pn:null,prev:null,lift:0};EV.st.set(id,s);}return s;}
function eStandOf(s){if(!s.stand){s.stand=makeStand(1);const sl=new THREE.Mesh(rockGeo(3.1,2.7,0.45,0.08,3),eMat('#7d6a50',1));sl.position.set(0,1.75,1.25);sl.castShadow=true;s.stand.g.add(sl);s.stand.mats.push(sl.material);s.shield=sl;}return s.stand;}
// ---------- ทุกเฟรม: ผู้เล่นสายดิน (เรียกจาก syncPlayers) ----------
function earthFX(o,p,pz,now,dt){
  const A=p.ea;if(!A){if(EV.st.has(p.id)){const s=EV.st.get(p.id);for(const k of ['stand','giant'])if(s[k])standOp(s[k],0);if(s.drill)s.drill.visible=false;}return;}
  const s=eState(p.id),S=eStandOf(s),t=now/1000,fx=Math.cos(p.a),fy=Math.sin(p.a),broken=A[0]>0;
  if(o.shield)o.shield.visible=false;   // ใช้โล่หินของ Stand แทนโล่ฟอง
  let op=0,pose={t};S.g.scale.setScalar(1);
  if(s.pn&&!broken){const P=s.pn;P.t+=dt;const k=P.t;   // หมัด: เข้า 0.2 → ต่อย → ดีดกลับ → หาย
    op=k<0.2?k/0.2:k<0.45?1:Math.max(0,1-(k-0.45)/0.25);const pu=k<0.2?0:k<0.3?(k-0.2)/0.1:k<0.45?1-(k-0.3)/0.15*0.7:0.3;
    const bx=P.x+(P.x2-P.x)*0.25*pu,by=P.y+(P.y2-P.y)*0.25*pu;S.g.position.copy(eW(bx,by,P.h+0.3));S.g.rotation.y=eYaw(P.x,P.y,P.x2,P.y2);pose={t,punch:pu,lean:pu*0.25};
    if(k>0.7)s.pn=null;}
  else if(A[1]){op=1;S.g.position.copy(eW(p.x,p.y,(p.z||0)));S.g.rotation.y=Math.atan2(fx,fy);pose={t,lean:0.45,run:1};}
  else if(p.sh&&!broken){op=Math.min(1,S.op+dt*8);S.g.position.copy(eW(p.x+fx*16,p.y+fy*16,(p.z||0)+0.1));S.g.rotation.y=Math.atan2(fx,fy);pose={t,hold:1};}
  else op=Math.max(0,S.op-dt*5);
  if(s.shield)s.shield.visible=!!(p.sh&&!broken&&!s.pn&&!A[1]);
  standOp(S,op);if(op>0)standPose(S,pose);
  // ขี่ Stand ตอน Rampage
  s.lift=lerp(s.lift,A[1]?1.9:0,1-Math.exp(-12*dt));if(s.lift>0.01)o.g.position.y+=s.lift;
  if(A[1]&&Math.random()<0.7)burst(p.x+rnd(-20,20),p.y+rnd(-20,20),ECOL.dust,2,90,0.6,3,{h:0.2,vh:[0.5,2],g:1,smoke:true,grow:1.2});
  // Stand แตก: ฝุ่นหินร่วงเบาๆ รอบตัว
  if(broken&&Math.random()<0.08)burst(p.x+rnd(-15,15),p.y+rnd(-15,15),ECOL.dust,1,15,0.8,1.6,{h:pz+rnd(0.5,2),g:3});
  // Terra Auger: สว่านหินหมุนเหนือหัว โตตามระดับ
  if(A[2]>0){if(!s.drill){s.drill=makeDrill();scene.add(s.drill);}const tier=A[2]>=4.5?3:A[2]>=2?2:1,sc=[0.55,0.85,1.25][tier-1];
    s.drill.visible=true;s.drill.position.copy(eW(p.x,p.y,(p.z||0)+3.1+sc*1.2));s.drill.scale.setScalar(sc*(1+0.04*Math.sin(t*30)));s.drill.rotation.y+=dt*(8+tier*8);
    if(s.lastTier&&tier>s.lastTier){burst(p.x,p.y,ECOL.glow,14,120,0.5,2.4,{h:(p.z||0)+3.4,g:0});ring(p.x,p.y,ECOL.glow,60+tier*20,0.4,(p.z||0)+3);if(p.id===NET.myId)snd('buff',{x:p.x,y:p.y,vol:0.6});}s.lastTier=tier;
    if(Math.random()<0.5)burst(p.x+rnd(-25,25),p.y+rnd(-25,25),ECOL.dust,1,40,0.6,2,{h:(p.z||0)+rnd(0.2,3),vh:[1,3],g:-1,smoke:true});}
  else if(s.drill){s.drill.visible=false;s.lastTier=0;}
  // Wrath ร่างแปลง: Stand ยักษ์ลอยหลังเรา
  if(A[3]===3){if(!s.giant)s.giant=makeStand(2.4);const G2=s.giant;standOp(G2,Math.min(1,G2.op+dt*3));
    if(!G2.slam||G2.slam<=0){G2.g.position.copy(eW(p.x-fx*40,p.y-fy*40,(p.z||0)+0.5));G2.g.rotation.y=Math.atan2(fx,fy);standPose(G2,{t});}
    else{G2.slam-=dt;standPose(G2,{t,raise:G2.slam>0.2?1:0,punch:G2.slam<=0.2?1:0});}}
  else if(s.giant&&s.giant.op>0)standOp(s.giant,Math.max(0,s.giant.op-dt*2));
  if(A[3]===1&&Math.random()<0.5)burst(p.x+rnd(-30,30),p.y+rnd(-30,30),ECOL.glow,1,20,0.7,1.6,{h:(p.z||0)+rnd(0,2),g:-0.5});
}
function makeDrill(){const g=new THREE.Group(),m=eMat('#a08860',1),gm=new THREE.MeshBasicMaterial({color:hdr(ECOL.glow,1.8)});
  const c=new THREE.Mesh(new THREE.ConeGeometry(0.75,2.6,7,4),m);c.rotation.x=Math.PI;g.add(c);
  for(let i=0;i<4;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(0.62-i*0.13,0.06,4,12),i%2?m:gm);r.rotation.x=Math.PI/2;r.position.y=0.7-i*0.5;g.add(r);}
  return g;}
// ---------- กระสุนหิน ----------
function earthProjMesh(o,t){let m;
  if(t==='eslab'){m=new THREE.Group();const b=new THREE.Mesh(rockGeo(2.6,1.9,0.5,0.07,3),eMat('#8a7658'));m.add(b);
    const cr=new THREE.MeshBasicMaterial({color:hdr(ECOL.glow,1.6)});for(const [x,y,r] of [[0,0,0],[0.3,0.25,1.1],[-0.35,-0.2,2.2]]){const c=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.05,0.52),cr);c.position.set(x,y,0);c.rotation.z=r;m.add(c);}}
  else{m=new THREE.Mesh(new THREE.DodecahedronGeometry(0.3,0),eMat('#9a8462'));}
  o.g.add(m);o.fileModel=m;o.halo.material=glowMat(ECOL.dust,0.4);}
// ---------- สิ่งก่อสร้าง + ฝุ่น (เรียกจาก render loop) ----------
function earthClear(){if(!EV)return;   // clearDyn ถูกเรียกตอนโหลด (ก่อนไฟล์นี้) — var จึงยังเป็น undefined
  for(const o of EV.es.values())disposeObj(o.g);EV.es.clear();for(const s of EV.st.values()){for(const k of ['stand','giant'])if(s[k])disposeObj(s[k].g);if(s.drill)disposeObj(s.drill);}EV.st.clear();
  for(const a of EV.anims)if(a.g)disposeObj(a.g);EV.anims.length=0;earthFog(false);}
function eMakeSO(w){const k=w[1],x1=w[2],y1=w[3],x2=w[4],y2=w[5],r=w[6],g=new THREE.Group(),mat=k===3?new THREE.MeshBasicMaterial({color:hdr('#ffd86b',1.2),transparent:true,opacity:0.18,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}):eMat(k===2?'#7a6446':ECOL.stone);let h=1;
  if(k===0){const L=Math.hypot(x2-x1,y2-y1)*S3;h=6;const b=new THREE.Mesh(rockGeo(r*2*S3,h,L+r*2*S3,0.06,4),mat);b.position.y=h/2;b.castShadow=b.receiveShadow=true;g.add(b);
    for(let i=0;i<5;i++){const c=new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(0.5,0.9),0),mat);c.position.set(rnd(-0.6,0.6),h+rnd(-0.3,0.1),(i/4-0.5)*L);g.add(c);}
    g.rotation.y=eYaw(x1,y1,x2,y2);}
  else if(k===1){h=9;const c=new THREE.Mesh(new THREE.CylinderGeometry(r*S3*0.85,r*S3,h,7),mat);c.position.y=h/2;c.castShadow=true;g.add(c);const tp=new THREE.Mesh(new THREE.ConeGeometry(r*S3*0.9,1.4,7),mat);tp.position.y=h+0.6;g.add(tp);}
  else if(k===2){h=1;const d=new THREE.Mesh(new THREE.SphereGeometry(r*S3,10,6,0,Math.PI*2,0,Math.PI/2),mat);d.scale.y=1.1/(r*S3);d.receiveShadow=true;g.add(d);}
  else{const L=Math.hypot(x2-x1,y2-y1)*S3;h=12;const b=new THREE.Mesh(new THREE.PlaneGeometry(L,h),mat);b.position.y=h/2;b.rotation.y=Math.PI/2;g.add(b);g.rotation.y=eYaw(x1,y1,x2,y2);}
  g.position.copy(eW((x1+x2)/2,(y1+y2)/2,0));scene.add(g);return {g,mat,k,h,born:performance.now(),x:(x1+x2)/2,y:(y1+y2)/2,hp:w[7]};}
function syncEarth(v,dt,now){
  const seen=new Set();
  for(const w of (v.ES||[])){seen.add(w[0]);let o=EV.es.get(w[0]);
    if(!o){o=eMakeSO(w);EV.es.set(w[0],o);if(o.k!==3){burst(o.x,o.y,ECOL.dust,14,140,0.9,4,{h:0.3,vh:[1,4],g:3,smoke:true,grow:1.5});shake(o.k===1?0.25:0.15);}}
    const age=(now-o.born)/1000;
    if(o.k===0||o.k===2)o.g.scale.y=Math.min(1,0.05+age/0.3);
    if(o.k===3)o.mat.opacity=0.14+0.08*Math.sin(now/300);
    else if(w[7]!==o.hp){o.hp=w[7];o.mat.color.set(ECOL.stone).lerp(new THREE.Color('#3a2e22'),1-w[7]/100);burst(o.x,o.y,ECOL.dust,4,60,0.5,2,{h:rnd(0.5,o.h),g:4});}}
  for(const [id,o] of EV.es)if(!seen.has(id)){disposeObj(o.g);o.mat.dispose();EV.es.delete(id);}
  // ฝุ่น Dust Burst
  const me=myPos();let inEnemy=false;
  for(const d of (v.ED||[])){const [,x,y,r,t,team]=d;
    for(let i=0,n=Math.ceil(r/120);i<n;i++){const a=rnd(0,Math.PI*2),rr=r*Math.sqrt(Math.random());smoke(x+Math.cos(a)*rr,y+Math.sin(a)*rr,rnd(0.3,4),1,Math.random()<0.5?ECOL.dust:'#c9b38c',2.6,rnd(10,16),20);}
    if(me&&me.al&&Math.hypot(me.x-x,me.y-y)<r){if(team!==me.tm)inEnemy=true;}}
  earthFog(inEnemy);
  // ภาพเคลื่อนไหวชั่วคราว (สว่านพุ่ง / เสาตก / เสาถูกยกทุบ / ก้อนหินลอย)
  for(let i=EV.anims.length-1;i>=0;i--){const a=EV.anims[i];a.t+=dt;if(a.fn(a)===false||a.t>=a.life){if(a.g)disposeObj(a.g);EV.anims.splice(i,1);}}
}
// ศัตรูอยู่ในฝุ่น: มองชัดแค่ ~150 รอบตัว ไกลกว่านั้นจางเป็นสีฝุ่น (ใช้ fog ของฉาก)
function earthFog(on){const F=scene.fog;if(!F)return;
  if(on){if(!EV.fog)EV.fog={c:F.color.clone(),n:F.near,f:F.far};const cd=cam.position.distanceTo(_eCamT())||6;F.color.set('#9c8664');F.near=cd+3;F.far=cd+26;}
  else if(EV.fog){F.color.copy(EV.fog.c);F.near=EV.fog.n;F.far=EV.fog.f;EV.fog=null;}}
function _eCamT(){const me=myPos();return me?eW(me.x,me.y,(me.z||0)+1.2):new THREE.Vector3();}
function eAnim(o){EV.anims.push(Object.assign({t:0},o));}
function eRock(x,y,h,sc){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(sc||1,0),eMat('#9a8462'));m.position.copy(eW(x,y,h));m.castShadow=true;scene.add(m);return m;}
function eDebris(x,y,h,n,sp){burst(x,y,'#7a6446',n,sp||200,0.9,3.2,{h:h||0.3,vh:[2,7],g:14,sh:4,vr:6,c2:'#3a2e22'});smoke(x,y,h||0.3,Math.ceil(n/2),ECOL.dust,1.4,8,sp?sp*0.4:70);}
// ---------- event "efx" ของสายดิน (เรียกจากต้น efxFX) — คืน true = จัดการแล้ว ----------
function earthEfx(ev){
  const z=ev.z,x=ev.x,y=ev.y,H=ev.h!==undefined?ev.h:0,me=myPos(),near=!me||Math.hypot(x-me.x,y-me.y)<1100;
  switch(z){
    case 'epunch':{const s=eState(ev.id);s.pn={t:0,x,y,h:H,x2:ev.x2,y2:ev.y2};later(0.22,()=>{burst(ev.x2,ev.y2,ECOL.dust,8,120,0.4,2.5,{h:H+1.3,g:2});if(near)snd('hit',{x:ev.x2,y:ev.y2,vol:0.5});});if(near)snd('whoosh',{x,y,vol:0.35});return true;}
    case 'estdbreak':eDebris(x,y,H,30,260);shake(0.3);if(near)snd('break',ev);return true;
    case 'estdon':burst(x,y,ECOL.glow,20,140,0.8,2.6,{h:H+1.5,g:-0.5});ring(x,y,ECOL.glow,80,0.5,H+0.2);if(near)snd('buff',{x,y,vol:0.5});return true;
    case 'erampon':smoke(x,y,0.3,8,ECOL.dust,1.2,8,90);if(near)snd('whoosh',ev);return true;
    case 'erampoff':smoke(x,y,0.3,6,ECOL.dust,1,7,60);return true;
    case 'eslam':eDebris(x,y,0.3,36,ev.r*1.6);ring(x,y,'#c9a36a',ev.r,0.45,0.15);playFx('earth_impact',x,y,0.4,{s:ev.r/110});shake(0.5);if(near)snd('boom',ev);return true;
    case 'erhit':eDebris(x,y,H,10,150);shake(0.2);if(near)snd('hit',ev);return true;
    case 'eboost':{const r=eRock(x,y,-1,1.1);eAnim({g:r,life:0.6,fn(a){const k=a.t/0.6;r.position.y=GY(x,y)-1+Math.sin(Math.min(1,k*2)*Math.PI/2)*1.6;r.rotation.y+=0.1;if(k>0.6)r.scale.setScalar(1.1*(1-(k-0.6)/0.4));}});
      eDebris(x,y,0.3,18,150);if(near)snd('boom',{x,y,vol:0.5});return true;}
    case 'esbcast':{const s=eState(ev.id),a=ev.a;s.pn={t:0.08,x:x-Math.cos(a)*30,y:y-Math.sin(a)*30,h:H,x2:x+Math.cos(a)*120,y2:y+Math.sin(a)*120};burst(x+Math.cos(a)*40,y+Math.sin(a)*40,ECOL.dust,10,160,0.5,3,{h:H+1.3,a,spread:0.6});if(near)snd('boom',{x,y,vol:0.55});return true;}
    case 'esbhit':eDebris(x,y,H,22,220);playFx('earth_impact',x,y,H,{s:0.8});shake(0.25);if(near)snd('break',ev);return true;
    case 'esbwall':eDebris(x,y,H,26,240);ring(x,y,'#ffd86b',70,0.4,H);burst(x,y,'#ffe7a0',12,120,0.6,2.2,{h:H+0.8,g:0});shake(0.4);if(near)snd('boom',ev);return true;
    case 'ewallup':{const s=eState(ev.id),a=ev.a;s.pn={t:0.1,x:x+Math.cos(a)*40,y:y+Math.sin(a)*40,h:H,x2:x+Math.cos(a)*200,y2:y+Math.sin(a)*200};shake(0.35);if(near)snd('boom',ev);return true;}
    case 'ecrushw':{const s=eState(ev.id);s.pn={t:0,x,y,h:H,x2:x+Math.cos(ev.a)*10,y2:y+Math.sin(ev.a)*10};ring(x,y,'#ff9a4a',140,0.8,0.2);return true;}
    case 'ecrush':{const c=Math.cos(ev.a),s=Math.sin(ev.a);for(let i=-3;i<=3;i++)eDebris(x+c*i*45,y+s*i*45,1+rnd(0,2),8,180);shake(ev.n>=2?0.7:0.45);playFx('earth_big',x,y,1,{s:1.3});if(near)snd('boom',ev);return true;}
    case 'ecrushno':case 'enostand':case 'enopil':floatText(x,y,z==='enostand'?'Stand แตกอยู่!':z==='enopil'?'ไม่มีเสาใกล้จุดเล็ง':'กำแพงพังหมดแล้ว','#ffcf6a',15,H);return true;
    case 'enodom':floatText(x,y,'ต้องปักเสาครบ 4 ต้นก่อน ('+(ev.n|0)+'/4)','#ffcf6a',15,H);return true;
    case 'ehitw':burst(x,y,ECOL.dust,4,80,0.4,2,{h:H,g:5});return true;
    case 'ebreakw':{const n=ev.n===1?24:ev.n===2?18:30;if(ev.n===0){for(let i=0;i<=4;i++)eDebris(lerp(ev.x1,ev.x2,i/4),lerp(ev.y1,ev.y2,i/4),rnd(1,4),8,160);}else eDebris(x,y,ev.n===1?3:0.6,n,200);if(near)snd('break',ev);return true;}
    case 'edustup':{const st=ev.n,r=eRock(ev.x2,ev.y2,1,0.8);eAnim({g:r,life:0.75,fn(a){const k=Math.min(1,a.t/0.5);r.position.copy(eW(lerp(ev.x2,x,k),lerp(ev.y2,y,k),1+Math.sin(k*Math.PI)*4+k*1.5));r.rotation.x+=0.2;}});
      if(st){const s=eState(ev.id);later(0.4,()=>{s.pn={t:0.12,x:x-30,y:y-30,h:2,x2:x,y2:y};});}return true;}
    case 'edust':smoke(x,y,1.5,30,ECOL.dust,2.2,14,ev.r*0.9);burst(x,y,'#d8c098',18,ev.r,1.2,4,{h:2,g:1,smoke:true,grow:2});ring(x,y,ECOL.dust,ev.r,0.6,0.3);shake(0.25);if(near)snd('boom',ev);return true;
    case 'eaugon':smoke(x,y,0.3,6,ECOL.dust,1,6,40);return true;
    case 'eaugoff':{const s=EV.st.get(ev.id);if(s&&s.drill){const p=s.drill.position;burst(x,y,ECOL.dust,12,120,0.6,3,{h:(H||0)+3.5,g:6});}return true;}
    case 'eaugfire':{const tier=ev.n,d=makeDrill(),sc=[0.55,0.85,1.25][tier-1];d.scale.setScalar(sc);scene.add(d);const h0=4;
      eAnim({g:d,life:0.36,fn(a){const k=Math.min(1,a.t/0.35);d.position.copy(eW(lerp(ev.x2,x,k),lerp(ev.y2,y,k),h0+Math.sin(k*Math.PI)*2*(1-k)+(1-k)*2));d.rotation.y+=0.6;d.lookAt(eW(x,y,0));d.rotateX(-Math.PI/2);}});
      ring(x,y,'#ff9a4a',ev.r,0.4,0.15);if(near)snd('whoosh',ev);return true;}
    case 'eaugboom':{const n=ev.n;eDebris(x,y,0.3,14+n*12,ev.r*1.8);playFx(n===3?'earth_big':'earth_impact',x,y,0.4,{s:ev.r/100});ring(x,y,'#c9a36a',ev.r,0.5,0.15);
      if(n===2){const m=new THREE.Mesh(new THREE.SphereGeometry(ev.r*S3*0.7,8,5,0,Math.PI*2,0,Math.PI/2),eMat('#7a6446'));m.scale.y=0.25;m.position.copy(eW(x,y,0));scene.add(m);eAnim({g:m,life:4,fn(a){if(a.t>3)m.scale.y=0.25*(1-(a.t-3));}});}
      if(n===3)fxPlay('start/stone_eruption',{x,y,h:0,s:0.9});shake(0.2+n*0.15);if(near)snd('boom',ev);return true;}
    case 'ewrath':smoke(x,y,0.3,20,ECOL.dust,1.6,10,120);burst(x,y,ECOL.glow,24,200,1,3,{h:1,vh:[3,8],g:-2});shake(0.4);if(near)snd('buff',ev);return true;
    case 'epilfall':{const m=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.75,9,7),eMat());m.castShadow=true;scene.add(m);ring(x,y,'#ffcf6a',40,0.45,0.15);
      eAnim({g:m,life:0.45,fn(a){const k=Math.min(1,a.t/0.45);m.position.copy(eW(x,y,4.5+(1-k)*(1-k)*40));}});return true;}
    case 'epilland':eDebris(x,y,0.3,20,200);shake(0.3);if(near)snd('boom',ev);return true;
    case 'edomain':for(const o of EV.es.values())if(o.k===3)o.mat.opacity=0.6;ring(x,y,'#ffd86b',300,0.8,0.3);shake(0.3);if(near)snd('buff',ev);return true;
    case 'ewland':eDebris(x,y,0.3,30,260);playFx('earth_big',x,y,0.4,{s:1.2});shake(0.6);if(near)snd('boom',ev);return true;
    case 'ewend':smoke(x,y,0.5,8,ECOL.dust,1.2,8,80);return true;
    case 'epilslam':{const s=EV.st.get(ev.id);if(s&&s.giant)s.giant.slam=0.35;const m=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.75,9,7),eMat());scene.add(m);
      eAnim({g:m,life:0.36,fn(a){const k=Math.min(1,a.t/0.35),up=k<0.5?k/0.5:1;m.position.copy(eW(lerp(ev.x2,x,k),lerp(ev.y2,y,k),4.5+Math.sin(k*Math.PI)*10*up));m.rotation.z=k*1.4;}});eDebris(ev.x2,ev.y2,0.3,10,120);return true;}
    case 'epilboom':eDebris(x,y,0.4,30,ev.r*1.8);playFx('earth_big',x,y,0.4,{s:ev.r/110});ring(x,y,'#c9a36a',ev.r,0.5,0.15);shake(0.5);if(near)snd('boom',ev);return true;
  }
  return false;}
// โคลน Mud Swamp (event 'zn' kind 'mud')
function earthMudZone(ev){SHAPES_Q.push({k:'decal',x:ev.x,y:ev.y,col:ECOL.mud,s1:ev.r/26,life:ev.t,op:0.85});SHAPES_Q.push({k:'rune',x:ev.x,y:ev.y,col:'#8a6a3a',s1:ev.r*S3,life:ev.t,op:0.35});
  for(let i=0;i<10;i++)later(i*0.45,()=>{const a=rnd(0,Math.PI*2),r=ev.r*Math.sqrt(Math.random());burst(ev.x+Math.cos(a)*r,ev.y+Math.sin(a)*r,'#6b4c2c',3,30,0.6,2.4,{h:0.1,vh:[1,2.5],g:6});});}
// ขาจมโคลน (สถานะ bit 524288)
function earthMudSink(o,fm,x,y){if(!(fm&524288))return;o.g.position.y-=0.45;if(Math.random()<0.15)burst(x+rnd(-12,12),y+rnd(-12,12),'#6b4c2c',1,25,0.5,2,{h:0.15,vh:[0.5,1.5],g:5});}
// ---------- HUD ใต้เป้าเล็ง ----------
function drawEarthHud(x,y,A){
  const y0=y+70;cx.textAlign='center';cx.font='600 15px Kanit,sans-serif';
  const txt=(s,yy,col)=>{cx.lineWidth=4;cx.strokeStyle='rgba(0,0,0,0.75)';cx.strokeText(s,x,yy);cx.fillStyle=col;cx.fillText(s,x,yy);};
  if(A[0]>0)txt('🪨 Stand แตก — กลับมาใน '+A[0]+' วิ',y0,'#ffb07a');
  if(A[2]>0){const t=A[2],tier=t>=4.5?3:t>=2?2:1,k=Math.min(1,t/4.5);cx.lineWidth=6;cx.strokeStyle='rgba(0,0,0,0.6)';cx.beginPath();cx.arc(x,y,40,-Math.PI/2,Math.PI*1.5);cx.stroke();
    cx.strokeStyle=['#c9a36a','#ffb24a','#ffd86b'][tier-1];cx.beginPath();cx.arc(x,y,40,-Math.PI/2,-Math.PI/2+k*Math.PI*2);cx.stroke();
    for(const m of [2/4.5,1]){const a=-Math.PI/2+m*Math.PI*2;cx.fillStyle='#fff';cx.fillRect(x+Math.cos(a)*40-2,y+Math.sin(a)*40-2,4,4);}
    txt('Terra Auger ระดับ '+tier,y0+(A[0]>0?22:0),'#ffd86b');}
  if(A[3]===1)txt('🗿 Wrath: คลิกปักเสา (เหลือ '+A[4]+')'+(A[5]?' • โดเมนขึ้นแล้ว':(10-A[4]>=4?' • กด X = ยกกำแพงโดเมน':' • ปักครบ 4 = กด X ยกโดเมน')),y0+44,'#ffd86b');
  else if(A[3]===3)txt('🗿 ร่างแปลง '+A[6]+' วิ • คลิก = ทุบเสาลงจุดเล็ง',y0+44,'#ffd86b');
  if(A[8])txt('Tectonic: กดอีกครั้ง = Crush!',y0+(A[3]?66:44),'#ff9a4a');
}
