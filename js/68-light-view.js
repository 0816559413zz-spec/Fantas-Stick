// =====================================================================
//  สายแสง ✨ ภาพฝั่งเครื่องผู้เล่น (รอบแรก 2026-11-16 — ภาพชั่วคราวตามสเปก designs/light.md รอผู้ใช้ดู/สั่งแก้)
//  snapshot p.lt = [คริสตัลกับตัว, คู่หู id|'P'(ปริซึม)|0, จุดลิงก์ [x,y]|0, คริสตัลที่ได้จากคนอื่น, ลำแสง (-1 ชาร์จ / 1+n ยิง / 0),
//                   Empower, Dash พร้อม, วงฮีล [x,y,n]|0, กับดัก [x,y,arm]|0, ความยาวลำ, มุมลำ, กางโล่,
//                   ชาร์จ BA, มุมก้มเงย, อัลติ [phase,time,ally,homeX,homeY,homeH,shot,finish]|0, โล่คู่หู]
// =====================================================================
const LGV={st:new Map(),fx:[],empA:{}};
// โล่รังผึ้ง: กระเบื้องหกเหลี่ยม (ขนาด s) วงชั้น k = คริสตัล 1/2/3 → 7/19/37 แผ่น • โค้งรอบตัวรัศมี R
const LGSH={stepOut:0.09,stepHide:0.04,s:0.42,gap:0.035,R:1.25,bend:0,open:0.05,hitT:0.45,brkT:0.6};
// ระดับโล่ (ผู้ใช้ 2026-11-16): 1 ชิ้น = รังผึ้งวง 2 (19 แผ่น) • 2 ชิ้น = วง 4 ตัดแถวบนให้สูงเท่าระดับ 3 • 3 ชิ้น = กำแพงยาว 13×6 แถว (เดินถือไปได้)
const LGSH_L=[null,...[q=>Math.max(Math.abs(q[0]),Math.abs(q[1]),Math.abs(q[0]+q[1]))<=2,q=>Math.max(Math.abs(q[0]),Math.abs(q[1]),Math.abs(q[0]+q[1]))<=4&&q[1]<=3,q=>Math.abs(q[0]+q[1]/2)<=6.1&&q[1]>=-2&&q[1]<=3].map(f=>{
  const out=[],sz=LGSH.s+LGSH.gap;for(let q=-9;q<=9;q++)for(let r=-4;r<=4;r++){if(!f([q,r]))continue;out.push({x:sz*Math.sqrt(3)*(q+r/2),y:sz*1.5*r,d:Math.hypot(q+r/2,r*0.866)});}
  const m=Math.max(...out.map(t=>t.d));for(const t of out)t.u=t.d/m;return out.sort((a,b)=>a.d-b.d);})];
const _lgM4=new THREE.Matrix4(),_lgQ=new THREE.Quaternion(),_lgSV=new THREE.Vector3(),_lgS=new THREE.Vector3(),_lgC=new THREE.Color(),_lgC2=new THREE.Color();
function lgGlowTex(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,240,190,1)');g.addColorStop(.35,'rgba(255,170,40,0.45)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
// ร่างแสงนีออน: ซ้อนเมชเรืองแสงทับตัวละคร (ใช้ geometry/skeleton เดิม ไม่แตะวัสดุที่แชร์กัน)
function lgNeon(o,k){
  if(!(k>0.01)){if(o.lgNeon)for(const m of o.lgNeon)m.visible=false;return;}
  if(!o.lgNeon){o.lgNeon=[];o.lgNeonM=new THREE.MeshBasicMaterial({color:hdr('#ffd77a',0.7),transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false});
    const src=[];o.g.traverse(m=>{if(m.isMesh&&!m.userData.lgNeon&&m.visible)src.push(m);});
    for(const m of src){const n=m.isSkinnedMesh?new THREE.SkinnedMesh(m.geometry,o.lgNeonM):new THREE.Mesh(m.geometry,o.lgNeonM);if(m.isSkinnedMesh)n.bind(m.skeleton,m.bindMatrix);
      n.userData.lgNeon=1;n.position.copy(m.position);n.quaternion.copy(m.quaternion);n.scale.copy(m.scale).multiplyScalar(1.03);n.renderOrder=5;n.frustumCulled=false;m.parent.add(n);o.lgNeon.push(n);}}
  o.lgNeonM.opacity=k;for(const m of o.lgNeon)m.visible=true;}
// ระหว่างบัฟ Empower (ผู้ใช้ 2026-11-17 ขอให้รู้ชัดว่ากำลังบัฟ): ตัวเรืองนีออนทองจาง ๆ เป็นจังหวะ • ห่วงแสงหมุนเหนือหัว • แสงแฟลร์ปลายไม้ • คริสตัลมีหางแสง
function lgEmpFx(S,o,on,now,dt){   // ผู้ใช้ 2026-11-17: ไม่มีมงกุฎ ไม่เปลี่ยนสีตัว/ผ้าคลุม → ประกายทองหมุนวนลอยขึ้นรอบตัว + แฟลร์ปลายไม้ + หางคริสตัล
  S.empK=clamp((S.empK||0)+(on?dt/0.3:-dt/0.4),0,1);const k=S.empK;
  if(!S.eMo&&k>0){const T=LGV.glowT||(LGV.glowT=lgGlowTex());S.eMo=[];
    for(let i=0;i<22;i++){const g=new THREE.Sprite(new THREE.SpriteMaterial({map:T,color:hdr(i%3?'#ffd36a':'#fff4c8',1.5),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
      g.userData={ph:Math.random(),a:Math.random()*6.283,sp:0.5+Math.random()*0.5,r:0.45+Math.random()*0.3,s:0.07+Math.random()*0.07};scene.add(g);S.eMo.push(g);}
    S.eTip=new THREE.Sprite(new THREE.SpriteMaterial({map:T,color:hdr('#ffe08a',1.6),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
    S.eTr=[];for(let i=0;i<3*6;i++){const g=new THREE.Sprite(new THREE.SpriteMaterial({map:T,color:hdr('#ffc04a',1.2),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(g);S.eTr.push(g);}
    S.eH=[[],[],[]];scene.add(S.eTip);}
  if(!S.eMo)return;const vis=k>0.01&&o.g.visible;S.eTip.visible=vis;
  const P0=o.g.position;
  for(const g of S.eMo){const d=g.userData;g.visible=vis;if(!vis)continue;
    const u=(d.ph+now/1000*d.sp*0.55)%1,a=d.a+u*4.2,r=d.r*(1-0.35*u);   // ขึ้นจากเท้าถึงเหนือหัว หมุนเกลียว วงแคบลงตอนบน
    g.position.set(P0.x+Math.cos(a)*r,P0.y+0.1+u*2.3,P0.z+Math.sin(a)*r);
    g.scale.setScalar(d.s*(1+0.4*Math.sin(now/90+d.a))*k);g.material.opacity=k*Math.sin(u*Math.PI)*0.95;}
  if(vis){if(o.tipW){S.eTip.position.copy(o.tipW);S.eTip.scale.setScalar((0.45+0.12*Math.sin(now/70))*k);S.eTip.material.opacity=0.9*k;}else S.eTip.visible=false;}
  for(let c=0;c<3;c++){const cr=S.cr&&S.cr[c],H=S.eH[c];if(cr&&cr.visible&&vis){H.unshift(cr.position.clone());if(H.length>6)H.pop();}else H.length=0;
    for(let j=0;j<6;j++){const g=S.eTr[c*6+j],P=H[j+1];g.visible=!!P&&vis;if(g.visible){g.position.copy(P);g.scale.setScalar(0.32*(1-j/6));g.material.opacity=0.7*k*(1-j/6);}}}}
// แกนลำแสง BA (ผู้ใช้ 2026-11-17 "ลำดูจาง"): แกนขาวร้อนตรงกลาง + ประกายวิ่งไปตามลำ + แฟลร์ตรงปลาย → อ่านออกบนแมพสว่าง
// รอยไหม้บนผนัง: q = จุดชน (null = ไม่ได้ชนแล้ว → ค้างจางใน 1 วิ) • โตตามเวลาที่ยิงค้างจุดเดิม
function lgWallBurn(S,q,nrm,w,now,dt){
  if(!S.bHot){const T=LGV.glowT||(LGV.glowT=lgGlowTex());S.bHot=new THREE.Mesh(new THREE.CircleGeometry(1,32),new THREE.MeshBasicMaterial({map:T,color:hdr('#ffa830',1.8),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    S.bHotR=new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({map:T,color:hdr('#fff4d0',1.6),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));scene.add(S.bHot,S.bHotR);
    const sm=new THREE.MeshBasicMaterial({color:hdr('#ffe2a0',1.4),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),pg=new THREE.PlaneGeometry(1,1).translate(0.5,0,0);
    S.wSp=[];for(let i=0;i<10;i++){const G=new THREE.Group(),m=new THREE.Mesh(pg,sm.clone());G.add(m);G.userData={m,a:i/10*Math.PI*2+Math.random()*0.4,ph:Math.random()};scene.add(G);S.wSp.push(G);}}
  if(q){if(!S.wQ||S.wQ.distanceTo(q)>0.6)S.wT=0;S.wQ=(S.wQ||new THREE.Vector3()).copy(q);S.wN=(S.wN||new THREE.Vector3()).copy(nrm);S.wW=w;S.wT=(S.wT||0)+dt;S.wOff=0;}
  else if(S.wQ&&!S.wOff)S.wOff=now;
  const fade=!S.wQ?0:S.wOff?Math.max(0,1-(now-S.wOff)/1000):1;
  if(fade<=0){S.bHot.visible=S.bHotR.visible=false;for(const G of S.wSp)G.visible=false;S.wQ=null;S.wT=0;return;}
  const P=S.wQ,N=S.wN,gw=0.6+0.9*Math.min(1,(S.wT||0)/2),W=S.wW||0.1,live=!S.wOff;
  for(const m of [S.bHot,S.bHotR]){m.visible=true;m.position.copy(P);m.lookAt(P.clone().add(N));}
  S.bHot.scale.setScalar((0.4+W*1.8)*gw*(live?0.92+0.12*Math.sin(now/45):1));S.bHot.material.opacity=fade;
  S.bHotR.scale.setScalar((0.15+W*0.8)*gw);S.bHotR.material.opacity=fade*(live?1:0.6);
  for(let i=0;i<S.wSp.length;i++){const G=S.wSp[i],d=G.userData;G.visible=live;if(!live)continue;if(i%2){G.visible=false;continue;}const u=(d.ph+now/320)%1,L=(0.22+W*1.6)*(0.4+u)*gw;   // แสงสาดเป็นพัดไปตามผนัง
    G.position.copy(P).addScaledVector(N,0.02);G.lookAt(P.clone().add(N));G.rotateZ(d.a+0.3*Math.sin(now/500+i));d.m.position.x=u*L*0.5;d.m.scale.set(L*(1-u*0.5),0.03+W*0.15*(1-u),1);d.m.material.opacity=0.55*(1-u)*fade;}}
// เศษคริสตัลทองแตกจากตัวศัตรู (พูลเล็ก ๆ ต่อผู้ยิง)
function lgShardSpawn(S,b,fwd,side,up){
  if(!S.shd){S.shd=[];const g=new THREE.OctahedronGeometry(0.09,0);g.scale(0.6,1.7,0.6);const m=new THREE.MeshBasicMaterial({color:'#ffcf4a',transparent:true,depthWrite:false});for(let i=0;i<18;i++){const c=new THREE.Mesh(g,m.clone());c.visible=false;c.userData={t:1};scene.add(c);S.shd.push(c);}}
  const c=S.shd.find(x=>x.userData.t>=1)||S.shd[0],d=c.userData;d.t=0;d.v=fwd.clone().multiplyScalar(-(1+Math.random()*2.5)).addScaledVector(side,(Math.random()-0.5)*8).addScaledVector(up,1.5+Math.random()*3.5);d.r=new THREE.Vector3(Math.random()*12,Math.random()*12,0);
  c.position.copy(b).addScaledVector(fwd,-0.1);c.visible=true;c.scale.setScalar(0.8+Math.random()*0.7);}
function lgShardTick(S,dt){if(!S.shd)return;for(const c of S.shd){const d=c.userData;if(d.t>=1){c.visible=false;continue;}d.t+=dt/0.55;d.v.y-=9*dt;c.position.addScaledVector(d.v,dt);c.rotation.x+=d.r.x*dt;c.rotation.z+=d.r.y*dt;c.material.opacity=1-d.t*d.t;}}
function lgBaCore(S,on,a,b,fwd,w,now){
  if(!S.bC){S.bC=lgTube(new THREE.MeshBasicMaterial({color:hdr('#fffbe8',1.7),transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false}),1);S.bC.renderOrder=6;
    const T=LGV.glowT||(LGV.glowT=lgGlowTex());S.bSp=[];for(let i=0;i<10;i++){const g=new THREE.Sprite(new THREE.SpriteMaterial({map:T,color:hdr(i%2?'#ffe9a8':'#ffc24a',1.8),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));g.userData={ph:i/10,o:Math.random()*6.283};scene.add(g);S.bSp.push(g);}
    S.bEnd=new THREE.Sprite(new THREE.SpriteMaterial({map:T,color:hdr('#fff0c0',2.2),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(S.bEnd);
    const rm=c=>new THREE.MeshBasicMaterial({color:hdr(c,1.8),transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
    S.bR=[new THREE.Mesh(new THREE.TorusGeometry(1,0.06,6,48,Math.PI*1.55),rm('#ffd36a')),new THREE.Mesh(new THREE.TorusGeometry(0.72,0.045,6,40,Math.PI*1.2),rm('#fff1c0'))];for(const r of S.bR)scene.add(r);}
  if(!on){for(const r of S.bLR||[])r.visible=false;for(const r of S.mR||[])r.visible=false;}
  S.bC.visible=S.bEnd.visible=on;for(const g of S.bSp)g.visible=on;const hitK=on?(S.bHitK|0):0,wall=hitK>0;for(const r of S.bR)r.visible=on&&!wall;
  const bdt=Math.min(0.05,Math.max(0,(now-(S.bNow||now))/1000));S.bNow=now;lgShardTick(S,bdt);if(hitK!==1)lgWallBurn(S,null,null,0,now,bdt);if(hitK!==2&&S.hitO){lgNeon(S.hitO,0);S.hitO=null;}if(!on)return;
  const len=a.distanceTo(b),side=new THREE.Vector3().crossVectors(fwd,new THREE.Vector3(0,1,0)).normalize(),up=new THREE.Vector3().crossVectors(side,fwd).normalize();
  // ลำเต้นเป็นจังหวะ + ร้อนแล้วลำเปลี่ยน (ผู้ใช้ 2026-11-17): ใกล้เต็ม = แกนออกส้มขาว ลำสั่น ประกายร้อนแตกจากปากลำ
  const hk=clamp(((S.bHeat||0)-0.6)/0.4,0,1),pl=1+0.16*Math.sin(now/150)+0.06*Math.sin(now/53);S.bPulse=pl;
  if(hk>0){const j=w*0.35*hk;const o=side.clone().multiplyScalar((Math.random()-0.5)*j).addScaledVector(up,(Math.random()-0.5)*j);a=a.clone().add(o.clone().multiplyScalar(0.3));b=b.clone().add(o);
    if(Math.random()<hk*0.5){const x=a.x/S3+MW/2,y=a.z/S3+MH/2;burst(x,y,Math.random()<0.5?'#ffb070':'#ff8a3a',2,120,0.25,1.8,{h:a.y,vh:[0,3],g:4});}}
  lgAim(S.bC,a,b);S.bC.scale.x=S.bC.scale.y=w*0.32*pl*(1+0.25*hk)*(1+0.12*Math.sin(now/35));S.bC.material.color.copy(hdr('#fffbe8',1.15)).lerp(hdr('#ff8a30',1.0),hk);S.bC.material.opacity=0.6;

  // ขั้นตามจำนวนคริสตัล (ผู้ใช้ 2026-11-17): 1 = แกน+แสงฟุ้ง • 2 = + วงแสงวิ่งรอบลำ • 3 = + ประกายวิ่งตามลำ + ปลายลำใหญ่ขึ้น • วงที่ปากลำโตและเพิ่มชั้นตามขั้น
  const st=S.bSt||0;
  for(const g of S.bSp){g.visible=st>=3;if(!g.visible)continue;const d=g.userData,u=(d.ph+now/450)%1,ang=d.o+u*9,r=w*1.3;
    g.position.copy(a).addScaledVector(fwd,u*len).addScaledVector(side,Math.cos(ang)*r).addScaledVector(up,Math.sin(ang)*r);g.scale.setScalar(0.12+w*0.6);g.material.opacity=Math.min(1,(1-u)*3)*0.9;}
  if(!S.bLR){const m=new THREE.MeshBasicMaterial({color:hdr('#ffe2a0',1.0),transparent:true,opacity:0.6,blending:THREE.AdditiveBlending,depthWrite:false});S.bLR=[];for(let k=0;k<3;k++){const r=new THREE.Mesh(new THREE.TorusGeometry(1,0.05,6,32),m);scene.add(r);S.bLR.push(r);}
    const mm=c=>new THREE.MeshBasicMaterial({color:hdr(c,1.15),transparent:true,opacity:0.7,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
    S.mR=[new THREE.Mesh(new THREE.TorusGeometry(1,0.045,6,40,Math.PI*1.5),mm('#ffd36a')),new THREE.Mesh(new THREE.TorusGeometry(1,0.035,6,40,Math.PI*1.2),mm('#fff1c0'))];for(const r of S.mR)scene.add(r);}
  for(let k=0;k<S.bLR.length;k++){const r=S.bLR[k];r.visible=st>=2;if(!r.visible)continue;const u=((now/900)+k/S.bLR.length)%1;r.position.copy(a).addScaledVector(fwd,u*len);r.lookAt(r.position.clone().add(fwd));r.scale.setScalar(w*(2.2+0.6*Math.sin(u*Math.PI)));r.material.opacity=0.55*Math.sin(u*Math.PI);}
  for(let k=0;k<2;k++){const r=S.mR[k];r.visible=st>=k+2;if(!r.visible)continue;r.position.copy(a);r.lookAt(a.clone().add(fwd));r.rotateZ((k?-1:1)*now/(k?140:200));r.scale.setScalar((0.32+0.1*k)*(0.8+0.25*st)*(1+0.06*Math.sin(now/60+k)));}
  S.bEnd.position.copy(b);const eK=(S.bSt||0)>=3?1.4:1;
  if(hitK===1){   // ชนกำแพง/พื้น (ผู้ใช้ 2026-11-17): รอยไหม้เรืองทองโตขึ้นยิ่งยิงนาน ค้าง ~1 วิหลังหยุด + แสงสาดออกเป็นพัดไปตามผนัง + ประกาย + ควันจาง
    S.bEnd.material.color.copy(hdr('#fff0c0',1.4));S.bEnd.scale.setScalar((0.5+w*1.8)*(0.85+0.25*Math.sin(now/40)));
    const ex=b.x/S3+MW/2,ey=b.z/S3+MH/2,gnd=b.y-GY(ex,ey)<0.35,nrm=gnd?new THREE.Vector3(0,1,0):new THREE.Vector3(-fwd.x,0,-fwd.z).normalize();
    const q=gnd?b.clone():b.clone().addScaledVector(fwd,-0.4);if(gnd)q.y=GY(ex,ey)+0.03;else S.bEnd.position.copy(q);lgWallBurn(S,q,nrm,w*eK,now,bdt);   // จุดชนจริงจมในกล่องผนังนิดหน่อย → ดึงรอยไหม้/แสงออกมาหน้าผนัง
    if(!S.bSpkT||now-S.bSpkT>55){S.bSpkT=now;const qq=b.clone().addScaledVector(fwd,-0.15),x=qq.x/S3+MW/2,y=qq.z/S3+MH/2,ba=Math.atan2(fwd.z,fwd.x)+Math.PI;
      burst(x,y,Math.random()<0.5?'#ffe08a':'#ffb347',4,220,0.4,3,{h:qq.y+0.05,vh:[1.5,5],g:9,a:ba,spread:1.5});if(Math.random()<0.35)burst(x,y,'#a89a88',1,30,0.9,5,{h:qq.y,vh:[0.6,1.4],g:-0.6});}
    LREQ.push({x:b.x,y:b.y,z:b.z,col:'#ffb847',int:1.0,dist:4});}
  else if(hitK===2){   // ชนศัตรู (ผู้ใช้ 2026-11-17): จุดแสงบนตัว + เศษคริสตัลทองแตกกระเด็นกลับ ไม่มีวง
    S.bEnd.material.color.copy(hdr('#ffe7a8',1.2));S.bEnd.scale.setScalar((0.55+w*1.6)*eK*(0.8+0.3*Math.sin(now/30)));
    {let hit=null,bd=1.3;for(const [,po] of PM3){if(!po||!po.g||po===S.me)continue;const d=Math.hypot(po.g.position.x-b.x,po.g.position.z-b.z);if(d<bd){bd=d;hit=po;}}   // ตัวที่โดนเรืองทองตอนลำแตะ (เห็นชัดจากมุมคนยิง)
      if(S.hitO&&S.hitO!==hit)lgNeon(S.hitO,0);S.hitO=hit;if(hit)lgNeon(hit,0.3+0.12*Math.sin(now/45));}
    if(!S.shdT||now-S.shdT>65){S.shdT=now;for(let k=0;k<(st>=3?3:2);k++)lgShardSpawn(S,b,fwd,side,up);const x=b.x/S3+MW/2,y=b.z/S3+MH/2;burst(x,y,'#ffe08a',2,160,0.3,2.2,{h:b.y,vh:[0.5,3],g:6,a:Math.atan2(fwd.z,fwd.x)+Math.PI,spread:1.2});}
    LREQ.push({x:b.x,y:b.y,z:b.z,col:'#ffd36a',int:0.8,dist:3});}
  else{   // สุดระยะ (ผู้ใช้ 2026-11-17 แบบลำน้ำ): ลูกแสงขาว + วงนีออนทอง 2 วงหมุนสวนกัน ลำไม่บานที่ปลาย
    S.bEnd.material.color.copy(hdr('#fffbe8',1.5));S.bEnd.scale.setScalar((0.45+w*1.8)*eK*(0.9+0.15*Math.sin(now/50)));
    const R=0.22+w*1.9;for(let k=0;k<2;k++){const r=S.bR[k];r.position.copy(b);r.lookAt(b.clone().add(fwd));r.rotateZ((k?-1:1)*now/(k?160:220));r.scale.setScalar(R*(k?1:1)*(1+0.06*Math.sin(now/70+k)));}}}
// คริสตัลหรี่ตอนร้อนเกิน (วัสดุแชร์ทุกคน → โคลนเป็นของคริสตัลชุดนี้ครั้งแรกที่ต้องใช้) • sp = แวบสว่างตอนชาร์จเสร็จ
function lgCrDim(S,k,sp){if(!S.crOwn&&k<=0&&sp<=0)return;S.crOwn=1;
  for(const c of S.cr)c.traverse(m=>{if(!m.material)return;if(!m.userData.lgB){m.material=m.material.clone();m.userData.lgB={op:m.material.opacity,ei:m.material.emissiveIntensity};}
    const B=m.userData.lgB;m.material.opacity=B.op*(1-0.75*k);if(B.ei!==undefined)m.material.emissiveIntensity=B.ei*(1-0.85*k)*(1+2*sp);});}
// ลำแสงตอนบัฟ Empower (ผู้ใช้ 2026-11-17): คลื่นวงแหวนวิ่งไปตามลำ + เส้นพลังพุ่งออกจากลำแล้วโค้งกลับเข้าลำ (เหมือนพลังล้นจนแตกออก)
function lgEmpBeam(S,on,a,b,fwd,w,now){
  if(!S.ew){S.ew=[];S.ea=[];const tm=new THREE.MeshBasicMaterial({color:hdr('#ffe2a0',1.2),transparent:true,opacity:0.6,blending:THREE.AdditiveBlending,depthWrite:false});
    for(let k=0;k<4;k++){const r=new THREE.Mesh(new THREE.TorusGeometry(1,0.06,6,28),tm);r.visible=false;scene.add(r);S.ew.push(r);}
    S.eaM=new THREE.MeshBasicMaterial({color:hdr('#ffd77a',1.5),transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false});}
  if(!on){for(const r of S.ew)r.visible=false;for(const m of S.ea)m.visible=false;return;}
  const len=a.distanceTo(b),side=new THREE.Vector3().crossVectors(fwd,new THREE.Vector3(0,1,0)).normalize(),up=new THREE.Vector3().crossVectors(side,fwd).normalize();
  for(let k=0;k<S.ew.length;k++){const r=S.ew[k],u=((now/700)+k/S.ew.length)%1;r.visible=true;r.position.copy(a).addScaledVector(fwd,u*len);r.lookAt(r.position.clone().add(fwd));r.scale.setScalar(w*(1.7+0.8*Math.sin(u*Math.PI)));r.material.opacity=0.6*Math.sin(u*Math.PI);}
  if(!S.eaT||now-S.eaT>90||len<S.eaLen-0.05){S.eaT=now;S.eaLen=len;for(const m of S.ea){m.geometry.dispose();scene.remove(m);}S.ea.length=0;
    for(let k=0;k<5;k++){const u0=Math.random()*0.8,du=0.05+Math.random()*0.12,ang=Math.random()*Math.PI*2,h=w*2.5+0.25+Math.random()*0.45,dir=side.clone().multiplyScalar(Math.cos(ang)).addScaledVector(up,Math.sin(ang));
      const p0=a.clone().addScaledVector(fwd,u0*len),p1=a.clone().addScaledVector(fwd,(u0+du*0.5)*len).addScaledVector(dir,h),p2=a.clone().addScaledVector(fwd,(u0+du)*len);
      const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0,p1,p2),12,0.03,5,false),S.eaM);m.frustumCulled=false;scene.add(m);S.ea.push(m);}}
  for(const m of S.ea)m.visible=true;S.eaM.opacity=0.6+0.4*Math.random();}
// คริสตัลนีออนล้วน (ไม่ใช่แก้ว) สำหรับ Sanctum: แกนเรืองทอง + ขอบเส้นขาวทอง
function lgNeonCrystal(scale){   // ผู้ใช้ 2026-11-17 รอบ 2: ทรงคริสตัลหกเหลี่ยม (แท่ง + ยอดแหลมบน/ล่าง) เหลี่ยมเห็นแสง + แกนเรือง + ขอบทอง + แสงฟุ้ง + ห่วงแสงรอบเอว
  if(!LGV.ncGeo){LGV.ncGeo=new THREE.LatheGeometry([new THREE.Vector2(0,-1),new THREE.Vector2(0.36,-0.42),new THREE.Vector2(0.36,0.42),new THREE.Vector2(0,1.15)],6);LGV.ncGeo.computeVertexNormals();LGV.ncEdge=new THREE.EdgesGeometry(LGV.ncGeo,20);}
  const g=new THREE.Group(),k=new THREE.Group();g.add(k);k.scale.setScalar(0.33);
  const shell=new THREE.Mesh(LGV.ncGeo,new THREE.MeshStandardMaterial({color:'#ffcf6a',emissive:'#d86a08',emissiveIntensity:0.35,metalness:0.4,roughness:0.2,flatShading:true,transparent:true,opacity:0.9,depthWrite:false}));
  const core=new THREE.Mesh(LGV.ncGeo,new THREE.MeshBasicMaterial({color:'#ffc04a',transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false}));core.scale.set(0.45,0.7,0.45);
  const edge=new THREE.LineSegments(LGV.ncEdge,new THREE.LineBasicMaterial({color:'#ffe4a0',transparent:true,opacity:0.9}));
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:LGV.glowT||(LGV.glowT=lgGlowTex()),color:'#ffb040',transparent:true,opacity:0.3,blending:THREE.AdditiveBlending,depthWrite:false}));glow.scale.set(2.2,3.4,1);
  const hm=new THREE.MeshBasicMaterial({color:'#ffd36a',transparent:true,opacity:0.48,depthWrite:false}),h1=new THREE.Mesh(new THREE.TorusGeometry(0.62,0.012,6,64),hm),h2=new THREE.Mesh(new THREE.TorusGeometry(0.78,0.008,6,64),hm);
  const heart=new THREE.Mesh(LGV.ncGeo,new THREE.MeshBasicMaterial({color:hdr('#ffe08c',1.25),transparent:true,opacity:0.35,blending:THREE.AdditiveBlending,depthWrite:false}));heart.scale.set(0.2,0.34,0.2);
  h1.rotation.x=Math.PI/2+0.25;h2.rotation.x=Math.PI/2-0.3;k.add(glow,shell,core,heart,edge,h1,h2);g.userData.halo=[h1,h2];g.userData.core=core;g.userData.heart=heart;g.userData.glow=glow;g.scale.setScalar(scale);return g;}
function lgSanctumFloorTex(){
  if(LGV.sanFloorTex)return LGV.sanFloorTex;
  const c=document.createElement('canvas');c.width=c.height=128;
  const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(0.76,'rgba(255,255,255,0.8)');
  g.addColorStop(0.96,'rgba(255,255,255,0.35)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,128,128);
  return LGV.sanFloorTex=new THREE.CanvasTexture(c);
}
function lgSanctumMoteTex(){
  if(LGV.sanMoteTex)return LGV.sanMoteTex;
  const c=document.createElement('canvas');c.width=32;c.height=96;
  const x=c.getContext('2d'),width=x.createLinearGradient(0,0,32,0);
  width.addColorStop(0,'rgba(255,185,55,0)');width.addColorStop(0.26,'rgba(255,195,66,0.2)');
  width.addColorStop(0.5,'#ffe9a0');width.addColorStop(0.74,'rgba(255,195,66,0.2)');
  width.addColorStop(1,'rgba(255,185,55,0)');x.fillStyle=width;x.fillRect(0,0,32,96);
  const length=x.createLinearGradient(0,0,0,96);
  length.addColorStop(0,'transparent');length.addColorStop(0.19,'white');
  length.addColorStop(0.49,'rgba(255,255,255,0.58)');length.addColorStop(1,'transparent');
  x.globalCompositeOperation='destination-in';x.fillStyle=length;x.fillRect(0,0,32,96);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  return LGV.sanMoteTex=tex;
}
// ลายรังผึ้งบนพื้น Shard Storm
function lgHoneyTex(){if(LGV.honey)return LGV.honey;const N=512,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),s=26,h=s*Math.sqrt(3);x.strokeStyle='rgba(255,220,140,1)';x.lineWidth=2.2;
  for(let row=-1;row<N/h+1;row++)for(let col=-1;col<N/(s*1.5)+1;col++){const cx=col*s*1.5,cy=row*h+(col%2?h/2:0);x.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;x[k?'lineTo':'moveTo'](cx+Math.cos(a)*s*0.94,cy+Math.sin(a)*s*0.94);}x.closePath();x.stroke();}
  x.globalCompositeOperation='destination-in';const g=x.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2);g.addColorStop(0,'rgba(0,0,0,0.35)');g.addColorStop(0.75,'rgba(0,0,0,0.8)');g.addColorStop(0.97,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,N,N);
  LGV.honey=new THREE.CanvasTexture(c);return LGV.honey;}
function lgShield(S,o,p,n,on,now,dt){
  if(!S.shF){const N=Math.max(LGSH_L[2].length,LGSH_L[3].length)+8,mk=(g,op,add)=>{const m=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:op,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,depthWrite:false,side:THREE.DoubleSide}),N);m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(N*3),3);m.frustumCulled=false;m.visible=false;scene.add(m);return m;};
    S.shF=mk(new THREE.CircleGeometry(LGSH.s*0.9,6).rotateZ(Math.PI/6),0.3,true);S.shE=mk(new THREE.RingGeometry(LGSH.s*0.84,LGSH.s*0.93,6).rotateZ(Math.PI/6),1,true);S.shG=mk(new THREE.CircleGeometry(LGSH.s*0.84,6).rotateZ(Math.PI/6),0.35,true);
    S.shGl=[];for(let k=0;k<3;k++){const g=new THREE.Sprite(new THREE.SpriteMaterial({map:LGV.glowT||(LGV.glowT=lgGlowTex()),color:hdr('#ff9a1a',2.4),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false}));g.renderOrder=11;g.visible=false;scene.add(g);S.shGl.push(g);}}
  for(let k=0;k<3;k++)if(!on||k>=n)S.shGl[k].visible=false;
  if(on){if(!S.shOn0){S.shOn0=now;S.shN=n;}S.shN=n;S.shA=p.a||0;S.shP=o.g.position.clone();S.brk=0;}
  else if(S.shOn0){S.shOn0=0;if(S.brkReq&&now-S.brkReq<400)S.brk=now;}
  const brk=S.brk&&now-S.brk<LGSH.brkT*1000?(now-S.brk)/(LGSH.brkT*1000):-1;
  if(!on&&brk<0){S.shF.visible=S.shE.visible=S.shG.visible=false;for(const g of S.shGl)g.visible=false;if(S.mote)for(const M of S.mote)M.g.visible=false;return;}
  const K=Math.max(1,Math.min(3,S.shN||n)),a=S.shA,P=on?o.g.position:S.shP,cx=P.x,cz=P.z,y0=P.y+1.25,t=on?(now-S.shOn0)/1000:0;
  const hit=S.hitT&&now-S.hitT<LGSH.hitT*1000?(now-S.hitT)/(LGSH.hitT*1000):-1;let i=0;
  const TL=LGSH_L[K],dm=TL[TL.length-1].d;
  for(const T of TL){
    let sc=1,b=(1-0.5*T.u)*(1+0.35*Math.sin(now/260+T.x*1.6-T.y*0.9));   // แสงไหลวิบวับข้ามแผ่น   // กลางสว่าง ขอบจาง
    if(on){const u=clamp((t-T.d*LGSH.open)/0.12,0,1);sc=u<1?u*(1.25-0.25*u):1;}   // เปิด: แผ่นเด้งออกจากกลางทีละวง
    if(hit>=0){const w=hit*(dm+1.2),dd=Math.abs(T.d-w);b+=1.6*Math.exp(-dd*dd*6)*(1-hit);}   // โดนตี: ระลอกแสงจากกลาง
    const yy=y0+T.y;if(yy<P.y+0.05)continue;   // แผ่นเรียบ (ไม่โค้ง) หน้าตัว • แผ่นที่จมดินไม่วาด
    const ca=Math.cos(a),sa=Math.sin(a),ang=a;let px=cx+ca*LGSH.R-sa*T.x,pz=cz+sa*LGSH.R+ca*T.x,py=yy;
    if(brk>=0){const f=brk;px+=Math.cos(ang)*f*1.4;pz+=Math.sin(ang)*f*1.4;py+=f*0.6-f*f*2.2;sc=1-f*0.6;b*=1-f;}   // แตก: แผ่นกระเด็นออก ตก จาง
    _lgSV.set(px,py,pz);_lgQ.setFromAxisAngle(_lgS.set(0,1,0),Math.PI/2-a);
    if(brk>=0)_lgQ.multiply(new THREE.Quaternion().setFromAxisAngle(_lgS.set(1,0.3,0).normalize(),brk*4*(T.d%1.7)));
    _lgM4.compose(_lgSV,_lgQ,_lgS.set(sc,sc,sc));S.shF.setMatrixAt(i,_lgM4);S.shE.setMatrixAt(i,_lgM4);
    S.shF.setColorAt(i,_lgC.set('#ff9a2a').lerp(_lgC2.set('#ffe2a0'),clamp(1-T.u,0,1)*0.45).multiplyScalar(0.45+0.45*clamp(b,0,1.8)));S.shE.setColorAt(i,_lgC.set('#ffcf5a').multiplyScalar(Math.max(0,b)*1.9));S.shG.setColorAt(i,_lgC.set('#ffb030').multiplyScalar(Math.max(0,b)*(0.45+0.55*(1-T.u))));S.shG.setMatrixAt(i,_lgM4);i++;}
  // ละอองแสงลอยขึ้นจากกำแพง
  if(!S.mote){S.mote=[];for(let k=0;k<26;k++){const g=new THREE.Sprite(new THREE.SpriteMaterial({map:LGV.glowT||(LGV.glowT=lgGlowTex()),color:hdr('#fff0c0',2),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));g.visible=false;scene.add(g);S.mote.push({g,t:Math.random(),x:0,y:0});}}
  {const W=TL[TL.length-1].x>0?Math.max(...TL.map(t=>Math.abs(t.x))):1;for(const M of S.mote){M.t+=dt/1.6;if(M.t>=1){M.t-=1;M.x=(Math.random()*2-1)*W;M.y=(Math.random()*2-1)*0.9;}
    const u=M.t,ca=Math.cos(a),sa=Math.sin(a),f=on?1:Math.max(0,1-brk*2);M.g.visible=f>0&&(on||brk>=0);if(!M.g.visible)continue;
    M.g.position.set(cx+ca*(LGSH.R+0.08)-sa*M.x,y0+M.y+u*1.1,cz+sa*(LGSH.R+0.08)+ca*M.x);M.g.scale.setScalar(0.12*Math.sin(u*Math.PI)+0.02);M.g.material.opacity=Math.sin(u*Math.PI)*f;}}
  for(const m of [S.shF,S.shE,S.shG]){m.count=i;m.visible=true;m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;}
  if(on){LREQ.push({x:cx+Math.cos(a)*LGSH.R,y:y0-0.6,z:cz+Math.sin(a)*LGSH.R,col:'#ffb84a',int:0.6+0.2*K,dist:4});
    if(o.armL){const k=clamp(t/0.15,0,1);o.armL.rotation.x=lerp(o.armL.rotation.x,-1.45,k);o.armL.rotation.z=lerp(o.armL.rotation.z,0.15,k);}}}   // ท่า: ยื่นมือซ้ายไปหน้า
// โดนตีโล่ / โล่แตก (เหตุการณ์ block / sbreak จาก host มี id) — คืน true = ไม่ต้องเล่นเอฟเฟกต์โล่ฟ้าปกติ
function lightShieldEv(ev,kind){const S=ev.id!=null&&LGV.st.get(ev.id);if(!S||!(S.shOn0||kind==='brk'&&S.shF&&S.shF.visible))return false;
  const now=LGV.now||performance.now();if(kind==='hit'){S.hitT=now;fxPlay('light/shield_hit',{x:ev.x,y:ev.y,h:ev.h||1.2,a:S.shA,aim:false});}
  else{S.brkReq=now;S.brk=now;S.shOn0=0;fxPlay('light/shield_break',{x:ev.x,y:ev.y,h:ev.h||1.2,a:S.shA,aim:false});}return true;}
const LGPOSE={body:1.45,head:-1.3,ax:-0.1,az:-1.5};   // ท่า BA: หมุนตัว / หัวกลับ / แขนขวา (x,z) — ปรับได้
let _lgGlass=null,_lgCore=null,_lgGeo=null,_lgEdge=null,_lgEdgeM=null;
// คริสตัล (ผู้ใช้ 2026-11-16 ออกแบบใหม่): แก้วทองทึบขึ้นเห็นชัด + ขอบเส้นสว่าง + แกนนีออนเหลืองกลางชิ้น
function lgCrystalMesh(scale=1){
  if(!_lgGeo){_lgGeo=new THREE.OctahedronGeometry(0.22,0);_lgGeo.scale(0.7,1.6,0.7);_lgGeo.userData.keep=true;
    _lgEdge=new THREE.EdgesGeometry(_lgGeo);_lgEdge.userData.keep=true;
    _lgGlass=new THREE.MeshPhysicalMaterial({color:'#ffe9a6',roughness:0.18,metalness:0.15,transparent:true,opacity:0.86,emissive:'#e8a21a',emissiveIntensity:0.7,flatShading:true,depthWrite:false});_lgGlass.userData.keep=true;
    _lgCore=new THREE.MeshBasicMaterial({color:hdr('#ffd21a',2.4),transparent:true,opacity:1});_lgCore.userData.keep=true;
    _lgEdgeM=new THREE.LineBasicMaterial({color:hdr('#fff3c4',2.2),transparent:true,opacity:0.95});_lgEdgeM.userData.keep=true;}
  const g=new THREE.Group(),o=new THREE.Mesh(_lgGeo,_lgGlass),c=new THREE.Mesh(_lgGeo,_lgCore),e=new THREE.LineSegments(_lgEdge,_lgEdgeM);
  c.scale.set(0.42,0.6,0.42);c.renderOrder=3;o.renderOrder=2;e.renderOrder=4;g.add(o,c,e);g.scale.setScalar(scale);return g;}
function lgState(id){let s=LGV.st.get(id);if(!s){s={cr:[],ally:[],t:0};LGV.st.set(id,s);}return s;}
const _lgV=new THREE.Vector3(),_lgW=new THREE.Vector3();
function lgWorld(x,y,h){return new THREE.Vector3(tx(x),GY(x,y)+(h||0),tz(y));}

// glTF geometry stays shared. Uniforms animate the materials without per-actor shader copies.
const LG_ULT_ASSET='radiant_sovereign',LG_CRYSTAL_ASSET='radiant_sovereign_crystal';
const LG_ULT_INTRO=1.18,LG_ULT_ARRIVAL_FX=.49;
const LG_ULT_TIME={value:0};
let lgUltMaterials=null;
const lgSovereignFinishes=new Map();
function lgSovereignMaterials(){
  if(lgUltMaterials)return lgUltMaterials;
  const basic=(col,intensity)=>new THREE.MeshBasicMaterial({color:hdr(col,intensity),toneMapped:false});
  const body=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.48,transparent:true,alphaTest:.02});
  body.onBeforeCompile=function(s){
    s.uniforms.uDissolve=this.userData.dissolve;
    s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>
      attribute float _palm_light, _palm_crease, _waist_fade, _body_height, _arm_sculpt;
      varying vec4 vRadianceBody;varying float vArmSculpt;varying vec3 vLightStone;`).replace('#include <begin_vertex>',`#include <begin_vertex>
      vRadianceBody=vec4(_palm_light,_palm_crease,_waist_fade,_body_height);vArmSculpt=_arm_sculpt;vLightStone=position;`);
    s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
      uniform float uDissolve;varying vec4 vRadianceBody;varying float vArmSculpt;varying vec3 vLightStone;`).replace('#include <color_fragment>',`#include <color_fragment>
      float fracture=fract(sin(dot(floor(vLightStone*21.),vec3(71.91,19.32,31.73)))*18732.37);
      float threshold=.16+.62*fracture+.16*clamp(vLightStone.y-2.,0.,1.);
      float scatter=1.-smoothstep(threshold-.054,threshold+.035,uDissolve);
      vec3 marble=mix(vec3(.65,.52,.34),vec3(.16,.097,.036),smoothstep(3.24,3.43,vRadianceBody.w));
      marble=mix(marble,vec3(.46,.33,.20),.40*vArmSculpt);
      diffuseColor.rgb*=mix(marble,vec3(.82,.59,.20),vRadianceBody.x);
      diffuseColor.a*=max(smoothstep(0.,1.,vRadianceBody.z),vRadianceBody.x)*(1.+.13*vArmSculpt)*scatter;`)
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      float edge=(1.-smoothstep(.01,.11,abs(uDissolve-threshold)))*step(.055,uDissolve);
      totalEmissiveRadiance+=vec3(1.,.70,.16)*((.075-.037*vArmSculpt+.52*vRadianceBody.x)*(1.-.3*vRadianceBody.y)+edge*.66);`);
  };
  const current=(base,peak,bodyLine=false)=>{
    const m=basic('#fff5d9',1);m.transparent=true;m.depthWrite=false;
    m.blending=bodyLine?THREE.NormalBlending:THREE.AdditiveBlending;
    m.customProgramCacheKey=()=>`radiance-line-${base}-${peak}-${bodyLine}`;
    m.onBeforeCompile=function(s){
      s.uniforms.uRadianceTime=LG_ULT_TIME;
      s.uniforms.uCrossClock=this.userData.crossClock;
      s.uniforms.uCrossCharge=this.userData.crossCharge;
      s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>
        attribute float _flow_distance;uniform float uCrossCharge;varying float vRadianceFlow;`).replace('#include <begin_vertex>',
        '#include <begin_vertex>\nvRadianceFlow=_flow_distance;transformed+=normal*(.044*uCrossCharge);');
      s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
        uniform float uRadianceTime,uCrossClock,uCrossCharge;varying float vRadianceFlow;`).replace('#include <color_fragment>',`#include <color_fragment>
        float t=fract(vRadianceFlow-uCrossClock);
        float wave=smoothstep(0.,.05,t)*(1.-smoothstep(.05,.23,t));
        float filament=.13*pow(.5+.5*sin(vRadianceFlow*58.-uRadianceTime*14.),6.);
        diffuseColor.rgb*=mix(vec3(1.,.37,.028),vec3(1.,.95,.68),wave)*(${base}+${peak}*wave+filament+uCrossCharge*1.33);
        diffuseColor.a*=mix(${bodyLine?'0.88':'0.58'},1.,wave);`);
    };
    return m;
  };
  const shell=new THREE.MeshStandardMaterial({color:'#edf5ff',roughness:.15,metalness:.28,transparent:true,opacity:.32,depthWrite:false,
    emissive:'#a9c5ff',emissiveIntensity:.22});
  const core=basic('#ffce45',1);
  core.onBeforeCompile=s=>{
    s.uniforms.uRadianceTime=LG_ULT_TIME;
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying float vCrystalHeight;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvCrystalHeight=position.y;');
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float uRadianceTime;varying float vCrystalHeight;')
      .replace('#include <color_fragment>',`#include <color_fragment>
      float phase=fract(uRadianceTime*.56);
      float wave=(1.-smoothstep(.035,.21,abs(abs(vCrystalHeight)-phase*.94)))*sin(3.14159*phase);
      diffuseColor.rgb*=mix(vec3(1.,.72,.18),vec3(2.0,1.55,.82),wave);`);
  };
  lgUltMaterials={body,flow:current(.91,2.8,true),wake:current(.52,1.45),shell,core};
  for(const m of Object.values(lgUltMaterials))m.userData.keep=true;
  return lgUltMaterials;
}
function lgSovereignFinish(source){
  if(!source.emissive)return source;
  if(lgSovereignFinishes.has(source))return lgSovereignFinishes.get(source);
  const m=source.clone(),name=m.name;
  m.userData.keep=true;
  if(name.startsWith('Solar blade')){
    if(name.includes('amber'))m.color.lerp(new THREE.Color('#bc681f'),.27);
    else if(name.includes('pale gold')||name.includes('white gold'))m.color.lerp(new THREE.Color('#ffebaf'),.53);
    m.color.multiplyScalar(.76);m.emissiveIntensity*=.25;
  }else if(name.includes('face planes')){
    m.color.lerp(new THREE.Color(name.startsWith('Ivory')?'#fff0cf':'#af947c'),.61);
    m.emissiveIntensity*=.42;
  }else if(name.startsWith('Wrist sigil')){
    m.color.multiplyScalar(.8);m.emissiveIntensity*=.44;
  }else{
    if(m.color.r*.2126+m.color.g*.7152+m.color.b*.0722>.08)m.color.lerp(new THREE.Color('#ffd36b'),.64);
    m.emissive.lerp(new THREE.Color('#ffbf31'),.32);
    m.color.multiplyScalar(.72);m.emissiveIntensity*=.50;
  }
  lgSovereignFinishes.set(source,m);return m;
}
function lgSovereignCrystal(){
  const inst=modelInst(LG_CRYSTAL_ASSET);
  if(!inst)return null;
  const {shell,core}=lgSovereignMaterials();
  inst.getObjectByName('SovereignCrystalShell').traverse(o=>{if(o.isMesh){o.material=shell;o.renderOrder=6;}});
  inst.getObjectByName('SovereignCrystalCore').traverse(o=>{if(o.isMesh)o.material=core;});
  inst.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
  return inst;
}
function lgSkinSovereign(g){
  const old=g.getObjectByName('SovereignBody'),geo=old.geometry;
  // Skin attributes are immutable and shared by every clone of this GLB.
  if(!geo.hasAttribute('skinIndex')){
    const pos=geo.attributes.position,ids=new Uint16Array(pos.count*4),weights=new Float32Array(pos.count*4);
    const curls=LIGHT_FORM_ARMS.map(()=>new Float32Array(pos.count*3));
    const axis=LIGHT_FORM_ARMS.map(a=>a.upper.clone().add(a.lower).normalize());
    const palmFront=LIGHT_FORM_ARMS.map(a=>new THREE.Vector3(0,0,1).addScaledVector(a.hand,-a.hand.z).normalize());
    const v=new THREE.Vector3(),delta=new THREE.Vector3();
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(pos,i);
      const side=v.x>=0?0:1,a=LIGHT_FORM_ARMS[side],offset=i*4,first=side*3+1;
      const active=THREE.MathUtils.smoothstep(Math.abs(v.x),.60,1.04);
      const elbow=delta.copy(v).sub(a.elbow).dot(axis[side]),wrist=delta.copy(v).sub(a.wrist).dot(a.lower);
      const lower=THREE.MathUtils.smoothstep(elbow,-.17,.19),hand=THREE.MathUtils.smoothstep(wrist,-.10,.12);
      ids.set([0,first,first+1,first+2],offset);
      weights.set([1-active,active*(1-lower),active*lower*(1-hand),active*lower*hand],offset);
      if(hand>.98){
        const along=delta.copy(v).sub(a.wrist).dot(a.hand);
        const curl=THREE.MathUtils.smoothstep(along,.19,.54);
        if(curl>0)delta.copy(palmFront[side]).multiplyScalar(.23*curl).addScaledVector(a.hand,-.16*curl).toArray(curls[side],i*3);
      }
    }
    geo.setAttribute('skinIndex',new THREE.BufferAttribute(ids,4));
    geo.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
    geo.morphTargetsRelative=true;
    geo.morphAttributes.position=curls.map((d,i)=>{const attr=new THREE.BufferAttribute(d,3);attr.name='RelaxedPalm'+i;return attr;});
  }
  const mesh=new THREE.SkinnedMesh(geo,old.material);
  mesh.name=old.name;mesh.position.copy(old.position);mesh.quaternion.copy(old.quaternion);mesh.scale.copy(old.scale);
  mesh.frustumCulled=false;
  const parent=old.parent;parent.remove(old);parent.add(mesh);
  const root=new THREE.Bone(),bones=[root];mesh.add(root);
  const arms=[1,-1].map(sign=>{
    const A=lightArmRest(sign),tag=sign>0?'Positive':'Negative';
    const upper=new THREE.Bone(),lower=new THREE.Bone(),hand=new THREE.Bone();
    upper.name='SovereignShoulder'+tag;lower.name='SovereignElbow'+tag;hand.name='SovereignPalm'+tag;
    upper.position.copy(A.shoulder);lower.position.copy(A.elbow).sub(A.shoulder);hand.position.copy(A.wrist).sub(A.elbow);
    root.add(upper);upper.add(lower);lower.add(hand);bones.push(upper,lower,hand);
    return {sign,upper,lower,hand,mark:g.getObjectByName('Wrist'+tag),amount:0,guard:0,
      restingUpper:new THREE.Vector3(sign*.52,-.84,.14).normalize(),
      restingLower:new THREE.Vector3(-sign*.33,.24,.91).normalize(),
      restingHand:new THREE.Vector3(-sign*.41,.15,.87).normalize(),
      releaseUpper:new THREE.Vector3(sign*.74,-.57,-.36).normalize(),
      releaseLower:new THREE.Vector3(sign*.63,-.48,-.61).normalize(),
      palmNormal:new THREE.Vector3(0,0,1).addScaledVector(A.hand,-A.hand.z).normalize(),
      target:new THREE.Vector3(sign*.35,2.3,5),q1:new THREE.Quaternion(),q2:new THREE.Quaternion(),q3:new THREE.Quaternion()};
  });
  g.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones));
  for(const a of arms)a.lower.attach(a.mark);
  return {arms,curls:mesh.morphTargetInfluences};
}
function lgPoseSovereign(V,shot,gesture,opening,bob,finish,lean,release,fireAge,dt){
  const blend=1-Math.exp(-20*dt),speed=1-Math.exp(-76*dt);
  const amount=gesture?gesture[1]:0;
  const recoil=gesture?lightFormRecoil(gesture[6]??-1):0;
  const kick=fireAge>=0 ? .14*THREE.MathUtils.smoothstep(fireAge,0,.045)*(1-THREE.MathUtils.smoothstep(fireAge,.05,.23)) : 0;
  if(gesture){
    V.cursor.set(gesture[2],gesture[3],gesture[4]);
    lightFormAngles(gesture[0],amount,V.cursor,V.turn);
  }else{
    const jolt=fireAge>=0 ? .027*Math.sin(fireAge*62)+.013*Math.sin(fireAge*104) : 0;
    V.turn.set(lightFinishPitch(finish,lean)*(1-.24*release)+jolt-kick,0,jolt*.66,'YXZ');
  }
  V.hover.quaternion.slerp(V.turnQ.setFromEuler(V.turn),shot||finish>=.89?speed:blend);
  V.inverse.copy(V.hover.quaternion).invert();
  V.hover.position.copy(LIGHT_FORM_PIVOT).applyQuaternion(V.hover.quaternion).negate().add(LIGHT_FORM_PIVOT);
  V.hover.position.y+=bob-LIGHT_FORM_BASE;
  V.hover.position.z+=lightFinishPush(finish)*(1-.35*release)-kick*1.35;
  if(shot){
    V.beamEnd.copy(lgWorld(shot[4],shot[5],shot[6]));
    V.hover.worldToLocal(V.beamEnd);
    V.palmUp.set(0,1,0).applyQuaternion(V.inverse);
  }
  const resting=1-THREE.MathUtils.smoothstep(opening,.20,.84);
  const drive=lightFinishDrive(finish),cup=THREE.MathUtils.smoothstep(finish,.02,.43)*(1-drive);
  for(const [index,arm] of V.arms.entries()){
    const A=lightArmRest(arm.sign),leading=gesture&&gesture[0]===arm.sign,firing=shot&&shot[0]===arm.sign;
    if(leading)arm.target.lerp(lightFormHand(arm.sign,V.cursor,V.inverse,V.aim),speed);
    arm.amount=lerp(arm.amount,leading?amount:0,leading?speed:blend);
    arm.pull=lerp(arm.pull||0,leading?(gesture[5]||0):0,leading?speed:blend);
    const guard=leading?0:Math.max(.83*resting,THREE.MathUtils.smoothstep(amount,.02,.53));
    arm.guard=lerp(arm.guard,guard,blend);
    V.curls[index]=Math.max(arm.guard*.48,.62*cup);
    const target=cup>0?V.aim.set(arm.sign*.31,2.81,1.16):arm.target;
    const pose=lightArmPose(arm.sign,target,Math.max(arm.amount,cup),arm.pull,leading?recoil:0);
    pose.upper.lerp(arm.restingUpper,arm.guard).normalize();
    pose.lower.lerp(arm.restingLower,arm.guard).normalize();
    pose.hand.lerp(arm.restingHand,arm.guard).normalize();
    if(cup>0){
      pose.hand.lerp(V.aim.set(-arm.sign*.48,.82,-.21).normalize(),cup).normalize();
      pose.palm.set(-arm.sign*.78,-.18,-.58).normalize();
    }
    pose.upper.lerp(arm.releaseUpper,drive).normalize();
    pose.lower.lerp(arm.releaseLower,drive).normalize();
    pose.hand.lerp(arm.releaseLower,drive).normalize();
    if(!leading&&shot){
      pose.upper.z+=.016*recoil*arm.guard;
      pose.lower.y-=.024*recoil*arm.guard;
      pose.hand.z+=.024*recoil*arm.guard;
      pose.upper.normalize();pose.lower.normalize();pose.hand.normalize();
    }
    if(firing){
      V.muzzle.copy(pose.shoulder).addScaledVector(pose.upper,A.a).addScaledVector(pose.lower,A.b);
      lightFormOpenPalm(V.muzzle,V.beamEnd,V.palmUp,pose.hand,pose.palm);
      V.muzzle.addScaledVector(pose.hand,LIGHT_FORM_PALM).addScaledVector(pose.palm,LIGHT_FORM_PALM_DEPTH);
      V.fireDir.copy(pose.palm);
      const gap=lgPalmGateOffset(V.muzzle.distanceTo(V.beamEnd)*LIGHT_FORM_SCALE)/LIGHT_FORM_SCALE;
      V.gatePoint.copy(V.muzzle).addScaledVector(V.fireDir,gap);
    }
    arm.q1.setFromUnitVectors(A.upper,pose.upper);
    arm.q2.setFromUnitVectors(A.lower,pose.lower);
    V.handDir.copy(A.hand).applyQuaternion(arm.q2);
    arm.q3.setFromUnitVectors(V.handDir,pose.hand).multiply(arm.q2);
    if(leading||cup>0){
      V.palmFacing.copy(arm.palmNormal).applyQuaternion(arm.q3);
      V.palmTarget.copy(pose.palm).addScaledVector(pose.hand,-pose.palm.dot(pose.hand)).normalize();
      const cosine=V.palmFacing.dot(V.palmTarget);
      const sine=V.palmFacing.cross(V.palmTarget).dot(pose.hand);
      arm.q3.premultiply(V.palmTwist.setFromAxisAngle(pose.hand,Math.atan2(sine,cosine)*(firing?1:Math.max(arm.amount,cup))));
    }
    arm.upper.quaternion.copy(arm.q1);
    arm.upper.position.copy(pose.shoulder);
    arm.lower.quaternion.copy(arm.q1).invert().multiply(arm.q2);
    arm.hand.quaternion.copy(arm.q2).invert().multiply(arm.q3);
  }
}

function lgSovereignHeart(heart){
  const uniforms={time:LG_ULT_TIME,alpha:{value:0},charge:{value:0}};
  heart.material=new THREE.ShaderMaterial({uniforms,transparent:true,toneMapped:false,
    vertexShader:`varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 p;uniform float time,alpha,charge;
      void main(){
        vec3 f=p/vec3(.128,.213,.074);
        float edge=1.-smoothstep(.025,.078,min(abs(f.x),abs(f.z)));
        float glint=1.-smoothstep(.025,.34,abs(f.y-(fract(time*.72)*2.6-1.3)));
        float core=pow(max(0.,f.z),1.8)*(1.-smoothstep(.13,.76,abs(f.y)));
        vec3 amber=mix(vec3(.45,.12,.014),vec3(.96,.48,.064),.38+.44*step(0.,f.x*f.y));
        vec3 light=vec3(1.49,1.08,.51);
        gl_FragColor=vec4(mix(amber,light,clamp(.69*core+.56*glint+charge*.55,0.,1.))
          +vec3(.52,.31,.064)*edge,alpha);
      }`});
  heart.renderOrder=6;
  const collar=new THREE.Mesh(new THREE.RingGeometry(.89,1.13,4),new THREE.MeshBasicMaterial({
    color:'#925220',side:THREE.DoubleSide,transparent:true,toneMapped:false}));
  collar.name='SovereignHeartCollar';collar.scale.set(.134,.22,1);collar.position.z=.006;collar.renderOrder=5;
  heart.add(collar);
  const rim=new THREE.Mesh(new THREE.RingGeometry(1.065,1.135,4),new THREE.MeshBasicMaterial({
    color:hdr('#ffdf90',1.18),side:THREE.DoubleSide,transparent:true,depthWrite:false,toneMapped:false}));
  rim.name='SovereignHeartRim';rim.scale.copy(collar.scale);rim.position.z=.011;rim.renderOrder=6;heart.add(rim);
  return {collar,rim,uniforms};
}

const LG_SASH_X=1.97,LG_SASH_Z=1.44;
function lgSovereignRibbon(){
  const positions=[],uvs=[],indices=[],steps=88;
  for(let lane=0;lane<2;lane++){
    for(let i=0;i<=steps;i++){
      const f=i/steps,a=f*Math.PI*2,x=Math.cos(a),z=Math.sin(a);
      const shoulder=Math.max(0,x)**3;
      for(const edge of [-1,1]){
        const r=lane?1.13+edge*.024:1+edge*(.119+.035*Math.sin(a-.36));
        const y=(lane?-.205+edge*.018:edge*.145)-.32*Math.max(0,z)-.20*Math.max(0,-z)-.17*shoulder;
        positions.push((LG_SASH_X*x+.32*shoulder)*r,y,LG_SASH_Z*z*r-.61*shoulder);uvs.push(f,2*lane+(edge+1)/2);
      }
      if(i<steps){const k=(lane*(steps+1)+i)*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);
  const mat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,toneMapped:false,
    uniforms:{time:LG_ULT_TIME,alpha:{value:0},surge:{value:0}},
    vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 v;uniform float time,alpha,surge;
      void main(){
        float lane=step(1.5,v.y),y=v.y-2.*lane;
        float t=fract(v.x*2.-time*.46);
        float edges=smoothstep(.74,.95,abs(y*2.-1.));
        float streak=smoothstep(.17,.32,t)*(1.-smoothstep(.36,.76,t));
        float thread=(1.-smoothstep(.027,.10,abs(y-.57)))*streak;
        float cell=abs(fract(v.x*22.-time*.76)-.5);
        float rune=1.-smoothstep(.09,.16,abs(cell*2.5+abs(y-.48)*2.6-.42));
        float cut=smoothstep(.05,.15,t)*(1.-smoothstep(.78,.95,t));
        vec3 gold=mix(vec3(.89,.33,.037),vec3(1.34,1.01,.47),max(max(edges,thread),rune*.70));
        gl_FragColor=vec4(gold*(1.+.31*surge),alpha*mix(.73+.23*edges,.94*cut,lane));
      }`});
  const mesh=new THREE.Mesh(geo,mat);mesh.name='SovereignSash';mesh.renderOrder=3;mesh.position.y=2.01;
  const motesGeo=new THREE.BufferGeometry(),seeds=[];
  for(let i=0;i<19;i++)seeds.push(i/19,(i*13%19)/19,(i*7%19)/19);
  motesGeo.setAttribute('position',new THREE.Float32BufferAttribute(seeds,3));
  const moteMat=new THREE.ShaderMaterial({uniforms:mat.uniforms,transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`uniform float time,surge;varying float glow;
      void main(){
        float a=position.x*6.283-time*(1.05+.38*position.y);
        float r=1.04+.17*position.y+.058*sin(a*4.+time*4.);
        float x=cos(a),z=sin(a),shoulder=pow(max(0.,x),3.);
        vec3 p=vec3((${LG_SASH_X}*x+.32*shoulder)*r,-.25+.37*position.z+sin(a*3.+time*3.)*.09-.30*abs(z)-.17*shoulder,z*${LG_SASH_Z}*r-.61*shoulder);
        vec4 q=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*q;
        gl_PointSize=clamp((22.+36.*position.z+12.*surge)/(-q.z),2.,10.);
        glow=.52+.44*pow(abs(sin(a*3.5+time*1.7)),5.);
      }`,
    fragmentShader:`uniform float alpha;varying float glow;
      void main(){
        vec2 q=abs(gl_PointCoord-.5);float d=q.x*.79+q.y;
        vec3 c=mix(vec3(.93,.39,.025),vec3(1.49,1.13,.58),1.-smoothstep(.04,.29,d));
        gl_FragColor=vec4(c,alpha*glow*(1.-smoothstep(.30,.49,d)));
      }`});
  const motes=new THREE.Points(motesGeo,moteMat);motes.name='SovereignSashMotes';motes.frustumCulled=false;motes.renderOrder=4;
  mesh.add(motes);
  return mesh;
}

function lgSovereignFlare(){
  const pos=[];
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,dx=Math.cos(a),dy=Math.sin(a),length=i%3===0?1:.58;
    pos.push(-dy*.087,dx*.087,0,dy*.087,-dx*.087,0,dx*length,dy*length,0);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  const mat=new THREE.MeshBasicMaterial({color:hdr('#ffda78',2.6),toneMapped:false,side:THREE.DoubleSide,
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const mesh=new THREE.Mesh(geo,mat);mesh.visible=false;mesh.renderOrder=8;
  return mesh;
}

const LG_PALM_TRAVEL=.085;
const LG_PALM_SCORCH_LIFE=1.8,LG_PALM_SCORCH_SLOTS=88;
function lgPalmGateOffset(length){return Math.min(.61,length*.33);}

function lgSovereignPalmWaves(){
  const group=new THREE.Group();group.name='SovereignPalmWaves';group.visible=false;
  for(const [i,tint] of ['#ffdc8a','#ffab42','#ffc16a'].entries()){
    const material=new THREE.MeshBasicMaterial({color:hdr(tint,i===0?1.48:1.16),transparent:true,depthWrite:false,toneMapped:false});
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(.92,i===0?.065:.045,6,42),material);
    mesh.renderOrder=7;group.add(mesh);
  }
  return group;
}
function lgPosePalmWaves(V,age){
  const group=V.palmWaves;group.visible=age>=0;
  if(age<0)return;
  group.position.copy(V.gatePoint);group.quaternion.setFromUnitVectors(V.front,V.fireDir);
  for(const [i,mesh] of group.children.entries()){
    const t=age-[0,.055,.26][i],duration=i===0 ? .27 : i===1 ? .23 : .21;
    const elapsed=i===2&&t>=0?t%.37:t;
    mesh.visible=elapsed>=0&&elapsed<duration;
    if(!mesh.visible)continue;
    const k=elapsed/duration,ease=1-(1-k)**2;
    mesh.position.z=.08+ease*(i===0?2.34:1.75);
    mesh.scale.setScalar(.35+ease*(i===0?1.69:i===1?1.24:1.06));
    mesh.material.opacity=(1-k)**1.25*(i===0 ? 1 : i===1 ? .84 : .76);
  }
}

function lgSovereignPalmGate(){
  const root=new THREE.Group();root.name='SovereignPalmGate';root.visible=false;
  const edge=new THREE.Mesh(new THREE.TorusGeometry(.89,.082,8,48),new THREE.MeshBasicMaterial({
    color:hdr('#ffc36a',1.27),transparent:true,depthWrite:false,toneMapped:false}));
  edge.renderOrder=7;root.add(edge);
  const trim=lgSovereignChargeSeal();trim.name='SovereignPalmGateTrim';trim.position.z=-.048;
  trim.position.y=0;trim.scale.setScalar(1.30);trim.visible=true;trim.renderOrder=7;root.add(trim);
  return {root,edge,trim};
}

function lgSovereignScorchTrail(){
  const n=LG_PALM_SCORCH_SLOTS,geometry=new THREE.BufferGeometry(),indices=[];
  const position=new THREE.BufferAttribute(new Float32Array(n*12),3).setUsage(THREE.DynamicDrawUsage);
  const mark=new THREE.BufferAttribute(new Float32Array(n*16),4).setUsage(THREE.DynamicDrawUsage);
  for(let i=0;i<n;i++){
    const k=i*4;indices.push(k,k+2,k+1,k+1,k+2,k+3);
    for(let v=0;v<4;v++)mark.setW(k+v,-10000);
  }
  geometry.setAttribute('position',position);geometry.setAttribute('mark',mark);geometry.setIndex(indices);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,
    polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:false,
    uniforms:{time:LG_ULT_TIME,life:{value:LG_PALM_SCORCH_LIFE}},
    vertexShader:`attribute vec4 mark;varying vec4 stroke;
      void main(){stroke=mark;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float time,life;varying vec4 stroke;
      void main(){
        float age=time-stroke.w;
        if(age<0.||age>=life)discard;
        float cap=max(0.,max(-stroke.x,stroke.x-stroke.z));
        float d=length(vec2(cap,stroke.y));
        float edge=1.-smoothstep(.61,.99,d),fade=1.-smoothstep(life-.52,life,age);
        gl_FragColor=vec4(vec3(.037,.037,.041),.74*edge*fade);
      }`});
  const mesh=new THREE.Mesh(geometry,material);mesh.name='SovereignScorchTrail';mesh.renderOrder=1;
  mesh.frustumCulled=false;scene.add(mesh);
  return {mesh,position,mark,next:0,index:0,last:null,seen:0};
}

function lgPalmScorch(S,shot,age,now){
  if(!shot||age<LG_PALM_TRAVEL||shot[11]!==1){
    if(S.palmTrail){
      S.palmTrail.last=null;
      if(now-S.palmTrail.seen>LG_PALM_SCORCH_LIFE*1000)S.palmTrail.mesh.visible=false;
    }
    return;
  }
  const trail=S.palmTrail||(S.palmTrail=lgSovereignScorchTrail());
  if(now<trail.seen)return;
  const x=shot[4],y=shot[5],h=shot[6],last=trail.last,nowSec=now/1000;
  const distance=last?Math.hypot(x-last.x,y-last.y):0;
  const connects=!!last&&now-trail.seen<150&&distance<205&&Math.abs(last.h-h)<1.1;
  trail.seen=now;
  trail.mesh.visible=true;
  if(connects&&distance<8){
    if(now-last.time>640){
      for(let v=0;v<4;v++)trail.mark.setW(trail.index+v,nowSec);
      trail.mark.needsUpdate=true;last.time=now;
    }
    return;
  }
  const start=connects?last:{x,y,h},length=connects?distance*S3:0;
  const dx=length>.001?(x-start.x)*S3/length:1,dz=length>.001?(y-start.y)*S3/length:0;
  const width=.57,index=trail.next*4;
  for(let v=0;v<4;v++){
    const atEnd=v>=2,side=v%2?1:-1,point=atEnd?{x,y,h}:start,cap=atEnd?1:-1;
    const sx=width*(cap*dx-side*dz),sz=width*(cap*dz+side*dx);
    trail.position.setXYZ(index+v,tx(point.x)+sx,GY(point.x+sx/S3,point.y+sz/S3)+point.h+.029,tz(point.y)+sz);
    trail.mark.setXYZW(index+v,atEnd?length/width+1:-1,side,length/width,nowSec);
  }
  trail.position.needsUpdate=trail.mark.needsUpdate=true;
  trail.index=index;trail.next=(trail.next+1)%LG_PALM_SCORCH_SLOTS;
  trail.last={x,y,h,time:now};
}

function lgSovereignCrossSparks(){
  const geo=new THREE.BufferGeometry(),seeds=[];
  for(let i=0;i<36;i++)seeds.push(i/36,(i*19%37)/37,i%4);
  geo.setAttribute('position',new THREE.Float32BufferAttribute(seeds,3));
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{time:LG_ULT_TIME,alpha:{value:0},surge:{value:0}},
    vertexShader:`uniform float time,surge;varying float glow;
      void main(){
        float t=fract(position.x+time*(.64+position.y*.34)),s=mod(position.z,2.)*2.-1.;
        float high=step(1.5,position.z),drift=t*t;
        vec3 p=vec3(s*t*mix(.64,1.10,high),2.75+t*mix(-.88,.53,high),.57-t*t*.20);
        p.xy+=vec2(s,position.y-.5)*drift*(.15+surge*.47);
        p.z+=sin(t*7.+position.y*10.)*.082+drift*.23;
        vec4 q=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*q;
        gl_PointSize=clamp((18.+position.y*28.+surge*23.)/(-q.z),1.,9.);
        glow=smoothstep(0.,.08,t)*(1.-t)*(.55+.45*position.y);
      }`,
    fragmentShader:`uniform float alpha,surge;varying float glow;
      void main(){vec2 p=abs(gl_PointCoord-.5);float a=1.-smoothstep(.19,.48,p.x+p.y);
        gl_FragColor=vec4(vec3(1.55,1.03,.26)*(1.+surge),a*glow*alpha);}`});
  const sparks=new THREE.Points(geo,mat);sparks.frustumCulled=false;sparks.renderOrder=4;
  return sparks;
}
function lgSovereignGather(){
  const geo=new THREE.BufferGeometry(),seeds=[];
  for(let i=0;i<116;i++)seeds.push(i/116,(i*43%127)/127,(i*71%127)/127);
  geo.setAttribute('position',new THREE.Float32BufferAttribute(seeds,3));
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{clock:{value:0},power:{value:0},dissolve:{value:0},casting:{value:0}},
    vertexShader:`uniform float clock,power,dissolve,casting;varying float glow;varying vec2 direction;
      void main(){
        float t=fract(position.x+clock*(.70+.41*position.z)),outward=step(.01,casting);
        float a=position.y*6.283+t*1.87,r=mix(4.4+position.z*2.45,.063,pow(t,.74));
        r=mix(r,.25+t*(2.9+position.z*2.1),outward);
        vec3 p=vec3(cos(a)*r,sin(a)*r*.73,(position.z-.32)*r);
        float shed=clamp((dissolve-position.x*.54)*1.93,0.,1.);
        float scatterRadius=.38+position.z*2.42+shed*1.7;
        vec3 scatter=vec3(cos(position.y*6.283)*scatterRadius,(position.z-.49)*2.86+shed*2.1,
          sin(position.y*6.283)*scatterRadius*.57-shed*.36);
        p=mix(p,scatter,step(.0001,dissolve));
        vec4 q=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*q;
        vec4 center=projectionMatrix*modelViewMatrix*vec4(0.,0.,0.,1.);
        direction=normalize(gl_Position.xy/max(.01,gl_Position.w)-center.xy/max(.01,center.w)+vec2(.0001));
        gl_PointSize=clamp((34.+67.*position.z+28.*power)/(-q.z),1.,15.);
        glow=smoothstep(0.,.16,t)*(1.-smoothstep(mix(.81,.55,outward),1.,t));
        if(dissolve>0.)glow=smoothstep(0.,.12,shed)*(1.-smoothstep(.51,1.,shed));
      }`,
    fragmentShader:`uniform float power;varying float glow;varying vec2 direction;
      void main(){
        vec2 p=vec2(gl_PointCoord.x-.5,.5-gl_PointCoord.y);
        float along=dot(p,direction),across=dot(p,vec2(-direction.y,direction.x));
        float a=(1.-smoothstep(.08,.24,abs(across)))*(1.-smoothstep(.19,.49,abs(along)));
        gl_FragColor=vec4(vec3(1.82,1.24,.48),a*glow*power);}`});
  const points=new THREE.Points(geo,mat);points.frustumCulled=false;points.renderOrder=6;points.visible=false;
  points.name='SovereignGather';return points;
}
function lgSovereignWingCurrent(wing){
  const vertices=[],uvs=[],indices=[],steps=23,lower=wing.phase<0;
  for(const [lane,[endX,endY]] of (lower?[[2.1,-1.63],[1.66,-1.80]]:[[2.25,2.52],[2.35,1.76],[1.77,1.10]]).entries()){
    for(let i=0;i<=steps;i++){
      const t=i/steps,curve=Math.sin(Math.PI*t),width=.17*curve+.08*Math.sin(t*4)**2;
      for(const side of [-1,1]){
        vertices.push(wing.side*(endX*t+side*width),endY*t+.28*curve-side*width*.81,.13+lane*.09+.17*t);
        uvs.push(t,(side+1)/2);
      }
      if(i<steps){const k=(lane*(steps+1)+i)*2;indices.push(k,k+1,k+2,k+2,k+1,k+3);}
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    uniforms:{time:LG_ULT_TIME,power:{value:0},launch:{value:-1}},
    vertexShader:`varying vec2 p;void main(){p=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 p;uniform float time,power,launch;
      void main(){
        float wave=1.-smoothstep(.03,.23,abs(fract(p.x*2.4-time*2.9)-.53));
        float edge=smoothstep(.50,.95,abs(p.y*2.-1.));
        float taper=smoothstep(0.,.12,p.x)*(1.-smoothstep(.84,1.,p.x));
        float shock=(1.-smoothstep(.06,.28,abs(p.x-(launch-.035)*4.1)))*step(0.,launch);
        vec3 gold=mix(vec3(.93,.37,.023),vec3(1.73,1.22,.59),clamp(wave*.75+edge*.25+shock*.59,0.,1.));
        gl_FragColor=vec4(gold,taper*clamp(power*(.33+.49*wave+.16*edge)+shock*.8,0.,1.));
      }`});
  const mesh=new THREE.Mesh(geometry,material);mesh.name='SovereignWingCurrent';mesh.visible=false;mesh.renderOrder=4;
  wing.node.add(mesh);return mesh;
}
function lgSovereignChargeSeal(){
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    uniforms:{power:{value:0}},
    vertexShader:`varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 p;uniform float power;
      void main(){
        float r=length(p),a=atan(p.y,p.x),cell=fract(a*1.90986+.5);
        float broken=smoothstep(.065,.13,cell)*(1.-smoothstep(.86,.95,cell));
        float edge=(1.-smoothstep(.011,.04,abs(r-.98)))+(1.-smoothstep(.009,.025,abs(r-.79)));
        float rune=(1.-smoothstep(.046,.083,abs(abs(cell-.51)*.82+abs(r-.887)*2.2-.159)));
        vec3 color=mix(vec3(.94,.38,.035),vec3(1.6,1.12,.48),clamp(edge*.64+rune*.58,0.,1.));
        gl_FragColor=vec4(color,power*(.21+.56*clamp(edge+rune*.73,0.,1.))*broken);
      }`});
  const ring=new THREE.Mesh(new THREE.RingGeometry(.76,1,72),material);
  ring.name='SovereignChargeSeal';ring.position.set(0,LIGHT_FORM_HEART_Y,.90);ring.visible=false;ring.renderOrder=5;
  return ring;
}
function lgSovereignChestRecoil(){
  const group=new THREE.Group();group.name='SovereignChestRecoil';group.visible=false;
  group.position.set(0,LIGHT_FORM_HEART_Y,LIGHT_FORM_HEART_Z+.12);
  for(const [i,color] of ['#ffce76','#ff9c35'].entries()){
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(.94,i===0?.056:.028,6,56),new THREE.MeshBasicMaterial({
      color:hdr(color,1.30),toneMapped:false,transparent:true,depthWrite:false}));
    mesh.renderOrder=8;group.add(mesh);
  }
  return group;
}
function lgSovereignSeal(){
  const mesh=new THREE.Mesh(new THREE.RingGeometry(.68,.715,6),new THREE.MeshBasicMaterial({
    color:hdr('#ffcb54',1.36),side:THREE.DoubleSide,transparent:true,depthWrite:false,toneMapped:false}));
  mesh.name='SovereignHaloSeal';mesh.position.z=.035;
  const pos=[];
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,x=Math.cos(a),y=Math.sin(a),tip=i%3===0?1.37:1.21;
    pos.push(x*.96-y*.044,y*.96+x*.044,0,x*.96+y*.044,y*.96-x*.044,0,x*tip,y*tip,0);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  const rays=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({
    color:hdr('#ffc24d',1.55),side:THREE.DoubleSide,transparent:true,depthWrite:false,toneMapped:false}));
  rays.name='SovereignHaloRays';
  return {mesh,rays};
}

function lgSovereignArmSigils(arm){
  const A=lightArmRest(arm.sign),root=new THREE.Group();
  root.name='SovereignArmSigils';root.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),A.lower);
  const uniforms={time:LG_ULT_TIME,alpha:{value:0},power:{value:0}};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 v;uniform float time,alpha,power;
      void main(){
        float t=fract(v.x-time*1.34),pulse=1.-smoothstep(.04,.23,abs(t-.5));
        vec3 gold=mix(vec3(.79,.25,.032),vec3(1.45,1.12,.54),.36+pulse*.64);
        gl_FragColor=vec4(gold*(1.+.46*power),alpha*(.55+.45*pulse));
      }`});
  for(const phase of [0,Math.PI]){
    const points=[];
    for(let i=0;i<=16;i++){
      const t=i/16,a=phase+t*Math.PI*2.15,r=lerp(.249,.128,t)+.045*Math.sin(t*Math.PI);
      points.push(new THREE.Vector3(r*Math.cos(a),r*Math.sin(a),A.b*lerp(.14,.97,t)));
    }
    const trace=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),28,.018,5,false),material);
    trace.renderOrder=4;root.add(trace);
  }
  const loops=new THREE.Group(),ringMat=new THREE.MeshBasicMaterial({color:hdr('#ffce57',1.2),
    side:THREE.DoubleSide,transparent:true,depthWrite:false,toneMapped:false});
  for(const [along,r] of [[.24,.269],[.58,.232],[.84,.165]]){
    const loop=new THREE.Mesh(new THREE.RingGeometry(r-.024,r,6),ringMat);
    loop.position.z=A.b*along;loop.rotation.z=along*7;loop.renderOrder=4;loops.add(loop);
  }
  root.add(loops);arm.lower.add(root);
  return {uniforms,ringMat,loops};
}

function lgBuildSovereign(){
  const g=modelInst(LG_ULT_ASSET);
  if(!g)return null;
  const {body,flow,wake}=lgSovereignMaterials();
  const skin=lgSkinSovereign(g);
  const fades=new Map(),arrivalLight={value:0};
  const instance=(source,alpha,start=.08,end=.66)=>{
    if(fades.has(source))return fades.get(source).material;
    const material=source.clone();
    material.onBeforeCompile=function(s,renderer){
      source.onBeforeCompile.call(this,s,renderer);
      s.uniforms.uSovereignArrival=arrivalLight;
      s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float uSovereignArrival;')
        .replace('#include <opaque_fragment>',`
          outgoingLight=mix(outgoingLight,vec3(3.65,2.72,1.37),uSovereignArrival);
          diffuseColor.a=mix(diffuseColor.a,1.,uSovereignArrival*.97);
          #include <opaque_fragment>`);
    };
    material.customProgramCacheKey=()=>source.customProgramCacheKey()+'|sovereign-arrival';
    material.transparent=true;material.opacity=alpha;material.userData.keep=false;
    fades.set(source,{material,alpha,start,end});
    return material;
  };
  const set=(name,mat,alpha,start,end)=>g.getObjectByName(name).traverse(o=>{if(o.isMesh)o.material=instance(mat,alpha,start,end);});
  g.traverse(o=>{if(o.isMesh){
    o.castShadow=o.receiveShadow=false;
    if(/^(SovereignBody|SovereignCross|SovereignHeart)/.test(o.name))return;
    const finish=source=>{
      const name=source.name,mat=lgSovereignFinish(source);
      if(name.startsWith('Solar blade'))return instance(mat,.65,.29,.90);
      if(name.startsWith('Wrist sigil'))return instance(mat,.94,.45,.93);
      if(name.startsWith('Eclipse'))return instance(mat,.94,.51,1);
      if(name.startsWith('Warm light'))return instance(mat,.94,0,.32);
      return instance(mat,.65);
    };
    o.material=Array.isArray(o.material)?o.material.map(finish):finish(o.material);
  }});
  const crossClock={value:0},crossCharge={value:0},dissolve={value:0};
  set('SovereignBody',body,.65,.10,.63);set('SovereignCross',flow,.94,.22,.68);set('SovereignCrossWake',wake,.86,.30,.78);
  fades.get(body).material.userData.dissolve=dissolve;
  for(const source of [flow,wake])Object.assign(fades.get(source).material.userData,{crossClock,crossCharge});
  g.getObjectByName('SovereignCross').traverse(o=>{if(o.isMesh)o.renderOrder=2;});
  const hover=g.getObjectByName('SovereignHover'),halo=g.getObjectByName('SolarHalo');
  const head=g.getObjectByName('SovereignHead');
  const wings=[['SovereignWingLeft',-1,0],['SovereignWingRight',1,.42],['SovereignWingLower',-1,-.78]]
    .map(([name,side,phase])=>({node:g.getObjectByName(name),side,phase})).filter(w=>w.node);
  for(const wing of wings)wing.current=lgSovereignWingCurrent(wing);
  const seal=lgSovereignSeal();halo.add(seal.mesh,seal.rays);
  const haloHome=halo.position.clone();haloHome.y+=.88;haloHome.z-=.11;
  const heart=g.getObjectByName('SovereignHeart'),heartFx=lgSovereignHeart(heart);
  heart.position.set(0,LIGHT_FORM_HEART_Y,LIGHT_FORM_HEART_Z);
  const gather=lgSovereignGather();gather.position.copy(heart.position);hover.add(gather);
  const chargeSeal=lgSovereignChargeSeal(),chestFlare=lgSovereignFlare();
  const chestRecoil=lgSovereignChestRecoil();
  chestFlare.position.copy(heart.position);chestFlare.position.z+=.18;hover.add(chargeSeal,chestFlare,chestRecoil);
  const sash=lgSovereignRibbon(),sparks=lgSovereignCrossSparks();hover.add(sash,sparks);
  const blink=lgSovereignFlare(),blast=lgSovereignFlare();
  blink.position.set(0,2.59,.34);hover.add(blink,blast);
  const palmWaves=lgSovereignPalmWaves();hover.add(palmWaves);
  const flash=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshBasicMaterial({
    color:hdr('#ffe4a1',2.2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  flash.visible=false;hover.add(flash);
  const wrists=[1,-1].map(sign=>{
    const name=sign>0?'Positive':'Negative';
    return {sign,marks:g.getObjectByName('WristMarks'+name),pulse:g.getObjectByName('WristPulse'+name),
      sigils:lgSovereignArmSigils(skin.arms.find(a=>a.sign===sign))};
  });
  scene.add(g);
  return {g,hover,head,halo,haloHome,seal,haloSpin:0,haloCore:null,haloLight:[],heart,heartFx,gather,chargeSeal,chestFlare,chestRecoil,
    channeling:false,crossClock,crossCharge,dissolve,arrivalLight,wrists,crystals:[],
    ...skin,wings,sash,sparks,flash,blink,blast,palmWaves,aim:new THREE.Vector3(),cursor:new THREE.Vector3(),
    muzzle:new THREE.Vector3(),gatePoint:new THREE.Vector3(),
    handDir:new THREE.Vector3(),palmFacing:new THREE.Vector3(),palmTarget:new THREE.Vector3(),palmTwist:new THREE.Quaternion(),
    palmUp:new THREE.Vector3(),beamEnd:new THREE.Vector3(),
    fireDir:new THREE.Vector3(0,0,1),front:new THREE.Vector3(0,0,1),
    turn:new THREE.Euler(),turnQ:new THREE.Quaternion(),inverse:new THREE.Quaternion(),fades:[...fades.values()]};
}
function lgReturnMark(){
  const root=new THREE.Group();root.name='SovereignCastMark';
  const base=new THREE.Mesh(new THREE.RingGeometry(.93,1,64),new THREE.MeshBasicMaterial({
    color:hdr('#ffc663',1.5),transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
  base.rotation.x=-Math.PI/2;root.add(base);scene.add(root);
  const glints=new THREE.Group(),material=new THREE.MeshBasicMaterial({color:hdr('#ffc362',1.32),transparent:true,
    depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const arc=new THREE.RingGeometry(1.19,1.227,24,1,0,Math.PI*.36);
  for(let i=0;i<3;i++){
    const streak=new THREE.Mesh(arc,material);streak.rotation.z=i*Math.PI*2/3;glints.add(streak);
  }
  glints.rotation.x=-Math.PI/2;glints.position.y=.012;root.add(glints);
  return {root,base,glints,crystal:null};
}
function lgUltVisual(o,p,S,U,alive,now,dt){
  const form=!!(U&&U[0]>1&&alive);
  const shot=form&&U[6];
  const rigShot=shot&&Number.isFinite(shot[10])?shot:null;
  const gesture=form&&(U[8]||(rigShot&&[shot[0],shot[10],shot[7],shot[8],shot[9],0,-1]));
  const firingAge=gesture?.[6]??-1;
  let shotAge=firingAge>=0?firingAge:LG_PALM_TRAVEL;
  if(shot){
    if(S.palmSample?.age!==shotAge||S.palmSample?.side!==shot[0])S.palmSample={age:shotAge,side:shot[0],time:now};
    shotAge+=clamp((now-S.palmSample.time)*.001,0,.065);
  }else S.palmSample=null;
  const surge=shot ? .16+.84*Math.exp(-shotAge*16)+.045*Math.sin(shotAge*43) : 0;
  const pulseAge=shotAge>=.32?(shotAge-.32)%.37:1;
  const pulse=shot ? 1-THREE.MathUtils.smoothstep(pulseAge,0,.13) : 0;
  if(U&&alive){
    const mark=S.returnMark||(S.returnMark=lgReturnMark());
    mark.root.visible=true;
    mark.root.position.copy(lgWorld(U[3],U[4],U[5]+.06));
    mark.base.material.opacity=.59+.11*Math.sin(now*.004);
    mark.glints.rotation.z=-now*.00094;
    mark.glints.scale.setScalar(1+.07*Math.sin(now*.0028));
    mark.glints.children[0].material.opacity=.29+.11*Math.sin(now*.0036);
    if(!mark.crystal){
      const crystal=lgSovereignCrystal();
      if(crystal){
        crystal.name='SovereignCastCrystal';crystal.scale.setScalar(1.12);
        const glass=lgSovereignMaterials().shell.clone();
        glass.userData.keep=false;glass.color.set('#ffce73');glass.emissive.set('#ffc15c');glass.opacity=.53;
        crystal.getObjectByName('SovereignCrystalShell').traverse(o=>{if(o.isMesh)o.material=glass;});
        mark.root.add(crystal);mark.crystal=crystal;
      }
    }
    if(mark.crystal){
      mark.crystal.position.y=1.43+.12*Math.sin(now*.003);
      mark.crystal.rotation.set(.12,now*.0026,-.18);
    }
  }else if(S.returnMark)S.returnMark.root.visible=false;
  if(form&&!S.sovereign)S.sovereign=lgBuildSovereign();
  const V=S.sovereign;
  if(V){
    V.g.visible=form;
    if(form){
      V.g.position.copy(o.g.position);V.g.rotation.copy(o.g.rotation);o.g.visible=false;
      V.g.scale.setScalar(LIGHT_FORM_SCALE);
      const elapsed=Math.max(0,LT_UL.t-U[1]);
      V.age=clamp(Math.max(elapsed,(V.age??elapsed)+dt),0,LG_ULT_INTRO);
      const opening=V.age/LG_ULT_INTRO,open=THREE.MathUtils.smoothstep(opening,.06,.31);
      const spread=THREE.MathUtils.smoothstep(opening,.18,.70);
      const bloom=THREE.MathUtils.smoothstep(V.age,.01,.07)*(1-THREE.MathUtils.smoothstep(opening,.26,.85));
      const settle=THREE.MathUtils.smoothstep(opening,.2,.48)*(1-THREE.MathUtils.smoothstep(opening,.48,.88));
      V.arrivalLight.value=bloom;
      const charging=U[0]===3,afterCharge=U[0]===4,dissolving=U[0]===5;
      const firingLeft=U[7]-LT_UL.finishDelay;
      const releasing=afterCharge&&firingLeft>0;
      V.channeling=releasing;
      const finish=charging?clamp(1-U[7]/LT_UL.finishCast,0,1):afterCharge||dissolving?1:0;
      const release=dissolving?clamp(1-U[7]/LT_UL.finishDissolve,0,1):0;
      const fireAge=releasing?Math.max(0,LT_UL.finishRelease-firingLeft):-1;
      const impact=releasing?Math.exp(-fireAge*13):0;
      const channel=releasing ? .83+.16*Math.sin(fireAge*20)**2 : 0;
      const fade=1-THREE.MathUtils.smoothstep(release,.06,1);
      const load=THREE.MathUtils.smoothstep(finish,.02,.69),drive=lightFinishDrive(finish);
      V.g.position.y+=-.79*(1-open)+.28*settle;
      V.dissolve.value=release;
      for(const f of V.fades){
        const detail=THREE.MathUtils.smoothstep(opening,f.start*.52,f.end*.69);
        f.material.opacity=f.alpha*Math.max(detail,bloom*.68)*fade;
      }
      if(V.head)V.head.rotation.x=.67*load*(1-drive)-.11*drive*(1-release);
      for(const w of V.wings){
        const flap=now*.0032+w.phase;
        const knock=releasing?THREE.MathUtils.smoothstep(fireAge,.048,.14)*(1-THREE.MathUtils.smoothstep(fireAge,.14,.35)):0;
        w.node.rotation.set(.045*Math.sin(flap-.4)-.12*load,
          w.side*(.12*Math.sin(flap-.9)+.45*load+.20*drive*(1-release)+.27*knock),
          w.side*(.36*(1-spread)-.17*settle+.107*Math.sin(flap)*(1-load*.74)-.13*impact));
        w.node.scale.setScalar(.53+.47*spread+.11*settle);
        const wingLight=(.34*load+.61*channel+.32*impact)*fade;
        w.current.visible=wingLight>.04;w.current.material.uniforms.power.value=wingLight;
        w.current.material.uniforms.launch.value=fireAge;
      }
      const bob=.135*open*Math.sin(now*.003)*(1-load);
      lgPoseSovereign(V,rigShot,gesture,opening,bob,finish,U[9]||.26,release,fireAge,dt);
      V.crossClock.value+=dt*(charging?-lerp(.92,4.2,finish):releasing?4.65:.58);
      V.crossCharge.value=(load+.46*channel+.34*impact)*fade;
      V.gather.visible=(charging&&finish>.02)||releasing||dissolving;
      V.gather.material.uniforms.clock.value+=dt*(.46+1.93*finish+1.42*channel);
      V.gather.material.uniforms.power.value=(1.25*load+.26*channel+.25*impact)*fade;
      V.gather.material.uniforms.dissolve.value=release;
      V.gather.material.uniforms.casting.value=channel;
      const sealPower=(.52*load+.52*channel+.45*impact)*fade;
      V.chargeSeal.visible=sealPower>.035;
      V.chargeSeal.rotation.z-=dt*(1.8+2.7*load+4.8*channel);
      V.chargeSeal.rotation.y=.29*Math.sin(V.chargeSeal.rotation.z*.27);
      V.chargeSeal.scale.setScalar(1+.56*load+.38*impact);
      V.chargeSeal.material.uniforms.power.value=sealPower;
      V.chestFlare.visible=impact>.12;
      V.chestFlare.rotation.z=now*.004;
      V.chestFlare.scale.setScalar(.64+2.1*(1-impact));
      V.chestFlare.material.opacity=impact*.91;
      V.chestRecoil.visible=releasing&&fireAge<.31;
      if(V.chestRecoil.visible)for(const [i,ring] of V.chestRecoil.children.entries()){
        const t=clamp((fireAge-i*.043)/.25,0,1),k=1-(1-t)**2;
        ring.visible=fireAge>=i*.043&&t<1;
        ring.scale.setScalar(.34+(i===0?1.72:2.11)*k);
        ring.position.z=k*(i===0?1.02:.59);
        ring.material.opacity=(1-t)**1.43*(i===0 ? .94 : .66);
      }
      V.sash.rotation.set(.24+.04*Math.sin(now*.003-.6),-.12+.08*Math.sin(now*.00065),.69+.035*Math.sin(now*.004-.45));
      V.sash.scale.setScalar(.79+.23*spread+.041*surge);
      V.sash.material.uniforms.alpha.value=spread*fade;
      V.sash.material.uniforms.surge.value=surge;
      V.sparks.material.uniforms.alpha.value=open*(1-.88*load)*fade;
      V.sparks.material.uniforms.surge.value=surge;
      const palmFlare=Math.max(surge,.56*pulse);
      V.flash.visible=!!shot&&palmFlare>.22;
      V.flash.position.copy(V.gatePoint);V.flash.scale.set(.22+.42*palmFlare,.21+.37*palmFlare,.43+.42*palmFlare);
      V.flash.material.opacity=.92*palmFlare;
      const flicker=bloom*(1-THREE.MathUtils.smoothstep(opening,.24,.62));
      V.blink.visible=flicker>.01;V.blink.material.opacity=flicker;
      V.blink.scale.set(.70+1.0*open,2.4+1.6*open,1);
      const launch=shotAge<.23,wave=clamp(launch?shotAge/.23:pulseAge/.13,0,1);
      V.blast.visible=!!shot&&wave<1;
      V.blast.position.copy(V.gatePoint).addScaledVector(V.fireDir,.10);
      V.blast.quaternion.setFromUnitVectors(V.front,V.fireDir);V.blast.rotateZ(now*.012);
      V.blast.scale.setScalar((launch?1.27:.63)+1.28*wave);
      V.blast.material.opacity=(launch ? .98 : .73)*(1-wave)**1.65;
      lgPosePalmWaves(V,shot?shotAge:-1);
      V.heart.visible=open*fade>.02;
      V.heart.scale.setScalar(1.66+.06*Math.sin(now*.005)+.13*surge+.42*load+.22*drive*(1-release));
      V.heart.rotation.y=.16+.19*Math.sin(now*.003+.5);
      V.heartFx.collar.material.opacity=.94*open*fade;
      V.heartFx.rim.material.opacity=(.67+.29*load)*open*fade;
      V.heartFx.uniforms.alpha.value=open*fade;
      V.heartFx.uniforms.charge.value=.32*surge+finish*(1-.68*release);
      V.halo.position.copy(V.haloHome).lerp(V.heart.position,.70*drive);
      const haloOpen=THREE.MathUtils.smoothstep(opening,.48,1);
      V.halo.scale.setScalar((.36+.64*haloOpen)*(1-.74*drive)*fade);
      V.haloSpin+=dt*(.69+2.65*load+2.1*channel);
      V.halo.rotation.set(.10*Math.sin(now*.0017),.19*Math.sin(now*.0013)+(1-haloOpen)*.96+drive*Math.PI,V.haloSpin);
      V.seal.mesh.rotation.z=-V.haloSpin*2;V.seal.mesh.material.opacity=.79*haloOpen;
      V.seal.rays.rotation.z=V.haloSpin*.35;V.seal.rays.material.opacity=.95*haloOpen;
      if(!V.haloCore){
        V.haloCore=lgSovereignCrystal();
        if(V.haloCore){
          V.haloCore.name='SovereignHaloCore';V.haloCore.position.z=.14;V.halo.add(V.haloCore);
          V.haloCore.getObjectByName('SovereignCrystalCore').traverse(o=>{if(o.isMesh){
            const source=o.material;o.material=source.clone();o.material.onBeforeCompile=source.onBeforeCompile;
            o.material.userData.keep=false;V.haloLight.push({material:o.material,color:source.color.clone()});
          }});
        }
      }
      if(V.haloCore){
        V.haloCore.rotation.set(.14,now*.0015,-V.halo.rotation.z+.08*Math.sin(now*.003),'ZXY');
        V.haloCore.scale.setScalar(haloOpen*(.39+.055*Math.sin(now*.004)+.15*finish));
        const haloCharge=THREE.MathUtils.smoothstep(finish,0,.42)*(1-.79*drive);
        for(const o of V.haloLight)o.material.color.copy(o.color).multiplyScalar(1+1.7*haloCharge);
      }
      for(const w of V.wrists){
        w.marks.rotation.y=w.sign*now*.001;w.pulse.rotation.y=w.sign*now*.0029;
        const power=gesture?.[0]===w.sign?gesture[1]:0;
        w.sigils.uniforms.alpha.value=spread*fade*(.69+.28*power);
        w.sigils.uniforms.power.value=power*(.48+.52*surge);
        w.sigils.ringMat.opacity=spread*fade*(.48+.42*power);
        w.sigils.loops.rotation.z=now*.00078*w.sign;
      }
      while(V.crystals.length<4){const c=lgSovereignCrystal();if(!c)break;V.halo.add(c);V.crystals.push(c);}
      V.crystals.forEach((c,i)=>{
        const a=now*.00092+i*Math.PI/2;
        c.position.set(Math.cos(a)*1.12,Math.sin(a)*1.12,0);
        c.rotation.set(0,now*.0018,a-Math.PI/2);c.scale.setScalar(.115*haloOpen);
      });
      LREQ.push({x:o.g.position.x,y:o.g.position.y+.9,z:o.g.position.z,col:'#ffdb83',int:(.47+.43*load+.62*impact)*fade,dist:3.7});
    }else{
      V.age=null;
      V.channeling=false;
      V.hover.rotation.y=0;
      for(const a of V.arms){a.amount=0;a.guard=0;}
    }
  }
  if(shot){
    if(!S.ultBeam)S.ultBeam=lgSovereignPalmBeam();
    const gate=S.palmGate||(S.palmGate=lgSovereignPalmGate());
    if(!gate.root.parent)scene.add(gate.root);
    const b=lgWorld(shot[4],shot[5],shot[6]);
    const a=V&&rigShot?V.hover.localToWorld(V.gatePoint.clone()):lgWorld(shot[1],shot[2],shot[3]);
    if(!V||!rigShot){const length=a.distanceTo(b);a.lerp(b,lgPalmGateOffset(length)/Math.max(.001,length));}
    lgAim(S.ultBeam,a,b);S.ultBeam.visible=S.ultBeam.scale.z>.05;
    const cutoff=THREE.MathUtils.smoothstep(shotAge,LT_UL.baHold-.13,LT_UL.baHold);
    gate.root.visible=S.ultBeam.visible;gate.root.position.copy(a);gate.root.quaternion.copy(S.ultBeam.quaternion);
    gate.root.scale.setScalar((.43+.17*surge+.098*pulse)*(1-.64*cutoff));
    gate.edge.material.opacity=(.88+.10*surge)*(1-.91*cutoff);
    gate.trim.rotation.z=now*.0095;
    gate.trim.material.uniforms.power.value=(.91+.26*surge+.14*pulse)*(1-.91*cutoff);
    const reach=clamp(shotAge/LG_PALM_TRAVEL,0,1);
    S.ultBeam.scale.z*=.016+.984*(1-(1-reach)**1.42);
    S.ultBeam.scale.x=S.ultBeam.scale.y=(.289+.127*surge+.019*pulse)*(1-.925*cutoff);
    const uniforms=S.ultBeam.material.uniforms;
    uniforms.lengthM.value=Math.max(.06,S.ultBeam.scale.z);
    uniforms.ignite.value=1-THREE.MathUtils.smoothstep(shotAge,0,.19);
    uniforms.age.value=shotAge;
    LREQ.push({x:a.x,y:a.y,z:a.z,col:'#ffe399',int:.42+.43*surge,dist:3.5});
  }else{
    if(S.ultBeam)S.ultBeam.visible=false;
    if(S.palmGate)S.palmGate.root.visible=false;
  }
  lgPalmScorch(S,shot,shotAge,now);
  return form;
}
function lgWardVisual(o,S,active,now){
  const parts=S.wardCrystals||(S.wardCrystals=[]);
  while(active&&parts.length<3){
    const c=lgSovereignCrystal();if(!c)break;
    c.scale.setScalar(.23);scene.add(c);parts.push(c);
  }
  parts.forEach((c,i)=>{
    c.visible=active;if(!active)return;
    const a=-now*.00085+i*Math.PI*2/3;
    c.position.copy(o.g.position);c.position.x+=Math.cos(a)*.84;c.position.z+=Math.sin(a)*.84;
    c.position.y+=1.16+.10*Math.sin(now*.002+i);
    c.rotation.y=now*.0013;
  });
  return active&&parts.length===3;
}
// ลำแสง: ท่อเรืองแสงทอง-ขาว แกนสว่าง ขอบจาง + วงแหวนแสงตรงจุดเริ่ม
let _lgBeamM=null;
function lgBeamMat(){if(_lgBeamM)return _lgBeamM;_lgBeamM=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uK:{value:1}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vU;varying vec3 vN,vV;void main(){vU=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uT,uK;varying vec2 vU;varying vec3 vN,vV;void main(){float f=abs(dot(normalize(vN),normalize(vV)));float core=smoothstep(0.35,0.95,f);float s=0.75+0.25*sin(vU.y*40.-uT*30.);float fade=smoothstep(1.,0.85,vU.y);vec3 col=mix(vec3(1.,0.7,0.15),vec3(1.,0.9,0.55),core);float a=(0.06+0.6*core)*s*fade*uK;gl_FragColor=vec4(col*a,a);}'});_lgBeamM.userData.keep=true;return _lgBeamM;}
function lgSovereignChestBeam(){
  const shared={time:LG_ULT_TIME,span:{value:1},age:{value:0},fade:{value:1}};
  const material=outer=>new THREE.ShaderMaterial({uniforms:{...shared,shell:{value:outer?1:0}},
    transparent:true,depthWrite:false,side:outer?THREE.DoubleSide:THREE.FrontSide,toneMapped:false,
    vertexShader:`uniform float span,age,shell;varying vec2 path;varying vec3 n,v;
      void main(){
        path=vec2(uv.x,position.z*span);
        float mouth=mix(.39,1.,smoothstep(0.,min(1.67,span*.32),path.y));
        float taper=mix(.27,1.,smoothstep(0.,min(1.22,span*.35),span-path.y));
        float ripple=1.+shell*.09*sin(path.x*18.8496+path.y*2.3-age*31.);
        vec4 q=modelViewMatrix*vec4(position.xy*mouth*taper*ripple,position.z,1.);
        n=normalize(normalMatrix*normal);v=-q.xyz;gl_Position=projectionMatrix*q;
      }`,
    fragmentShader:`uniform float time,span,age,fade,shell;varying vec2 path;varying vec3 n,v;
      void main(){
        float d=path.y,a=path.x*6.283185;
        float facing=abs(dot(normalize(n),normalize(v)));
        float fire=exp(-age*10.),flow=fract(d*.57-time*9.4+.12*sin(a*5.));
        float dash=smoothstep(.053,.14,flow)*(1.-smoothstep(.48,.86,flow));
        float strand=.5+.5*sin(a*5.+.34*sin(d*.75-time*5.4)+.19*sin(d*2.8-time*13.));
        float stream=pow(strand,9.)*(.42+.58*dash);
        float tip=smoothstep(0.,min(.58,span*.28),span-d);
        vec3 core=mix(vec3(1.13,.45,.041),vec3(1.22,1.08,.84),smoothstep(.0,.85,facing));
        vec3 fold=mix(vec3(.96,.34,.017),vec3(1.15,.79,.22),dash);
        float face=gl_FrontFacing?1.:.39;
        float veil=.066+.84*stream+.09*(1.-facing);
        vec3 gold=mix(core,fold,shell)*(1.+.21*fire);
        gl_FragColor=vec4(gold,fade*tip*mix(.86+.14*facing,veil*face,shell));
      }`});
  const beam=lgTube(material(false),.68,42);beam.name='SovereignChestBeam';beam.renderOrder=6;
  const mantle=lgTube(material(true),1.24,46);mantle.name='SovereignChestBeamMantle';mantle.renderOrder=7;
  beam.add(mantle);
  return beam;
}
function lgSovereignPalmBeam(){
  const uniforms={time:LG_ULT_TIME,lengthM:{value:1},ignite:{value:0},age:{value:0}};
  const vertexShader=`uniform float lengthM;varying vec2 path;varying vec3 n,v;
    void main(){
      path=vec2(uv.x,position.z);
      float remaining=(1.-path.y)*lengthM;
      float taper=mix(.20,1.,smoothstep(0.,min(.78,lengthM*.41),remaining));
      vec3 p=vec3(position.xy*taper,position.z);
      vec4 q=modelViewMatrix*vec4(p,1.);v=-q.xyz;n=normalize(normalMatrix*normal);
      gl_Position=projectionMatrix*q;
    }`;
  const coreMat=new THREE.ShaderMaterial({uniforms,vertexShader,transparent:true,depthWrite:false,toneMapped:false,
    fragmentShader:`uniform float time,lengthM,ignite;varying vec2 path;varying vec3 n,v;
      void main(){
        float d=path.y*lengthM,remaining=lengthM-d;
        float facing=smoothstep(.04,.94,abs(dot(normalize(n),normalize(v))));
        float seam=.5+.5*sin(d*6.1-time*30.+path.x*18.8496);
        float moving=pow(seam,7.);
        float tip=smoothstep(.014,min(.34,lengthM*.27),remaining);
        vec3 edge=vec3(.94,.38,.037),hot=vec3(1.12,1.01,.75);
        vec3 color=mix(edge,hot,clamp(.21+.76*facing+.13*moving,0.,1.));
        gl_FragColor=vec4(color*(1.+.18*ignite),tip*(.63+.30*facing));
      }`});
  const beam=lgTube(coreMat,.70,30);beam.name='SovereignPalmBeam';beam.renderOrder=6;
  const sheathMat=new THREE.ShaderMaterial({uniforms,vertexShader,transparent:true,depthWrite:false,
    side:THREE.DoubleSide,toneMapped:false,
    fragmentShader:`uniform float time,lengthM,ignite;varying vec2 path;varying vec3 n,v;
      void main(){
        float d=path.y*lengthM,remaining=lengthM-d,a=path.x*6.283185;
        float rim=pow(1.-abs(dot(normalize(n),normalize(v))),1.5);
        float offset=a*2.-d*1.9+time*3.8;
        float weave=pow(.5+.5*cos(offset+.26*sin(d*1.8-time*9.)),9.);
        float run=fract(d*.59-time*6.4),packet=smoothstep(.09,.28,run)*(1.-smoothstep(.56,.92,run));
        float tip=smoothstep(0.,min(.61,lengthM*.32),remaining);
        vec3 gold=mix(vec3(.78,.21,.014),vec3(1.03,.68,.13),packet);
        float face=gl_FrontFacing ? 1. : .52;
        gl_FragColor=vec4(gold,tip*face*(.043*rim+.92*weave*(.41+.59*packet))*(1.+.16*ignite));
      }`});
  const sheath=lgTube(sheathMat,1.43,36);sheath.name='SovereignPalmCurrent';sheath.renderOrder=7;beam.add(sheath);
  const seeds=[];
  for(let i=0;i<26;i++)seeds.push(i/26,(i*17%29)/29,(i*11%31)/31);
  for(let i=0;i<22;i++)seeds.push(i/22,(i*13%23)/23,1+(i*7%23)/23);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(seeds,3));
  const moteMat=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,
    vertexShader:`uniform float time,lengthM,ignite,age;varying float fade;
      void main(){
        float seed=fract(position.z),flash=step(1.,position.z);
        float t=fract(position.x+time*(15.+seed*8.)/max(2.,lengthM));
        float a=position.y*6.283+t*lengthM*.79+time*1.64,r=.90+seed*.82;
        float repeat=step(.32,age),pulseAge=mod(max(0.,age-.32),.37);
        float launchAge=max(0.,mix(age,pulseAge,repeat)-position.x*.045);
        if(flash>.5){
          t=min(.96,launchAge*(3.5+seed*9.5)/max(.20,lengthM));
          r=.14+launchAge*(9.5+seed*15.4);a=position.y*6.283+launchAge*6.7;
        }
        vec4 q=modelViewMatrix*vec4(cos(a)*r,sin(a)*r,t,1.);
        gl_Position=projectionMatrix*q;
        gl_PointSize=clamp((17.+27.*seed+14.*ignite+22.*flash)/(-q.z),1.5,10.);
        fade=mix(smoothstep(0.,.08,t)*(1.-smoothstep(.71,.995,t)),
          smoothstep(0.,.015,launchAge)*(1.-smoothstep(.049,mix(.28,.15,repeat),launchAge))*(1.-.42*repeat),flash);
      }`,
    fragmentShader:`varying float fade;void main(){
      vec2 p=abs(gl_PointCoord-.5);
      float spark=1.-smoothstep(.14,.49,p.x*.82+p.y);
      gl_FragColor=vec4(1.37,.81,.20,fade*spark);
    }`});
  const motes=new THREE.Points(geometry,moteMat);motes.name='SovereignPalmMotes';motes.frustumCulled=false;motes.renderOrder=8;
  beam.add(motes);return beam;
}
// สายลิงก์: ความทึบไม่เท่ากันตามหน้าตัด (ขอบจาง กลางเข้ม เป็นแถบ) + ลายวิ่งไปตลอด
let _lgLinkM=null;
function lgLinkMat(){if(_lgLinkM)return _lgLinkM;_lgLinkM=new THREE.ShaderMaterial({uniforms:{uT:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uT;varying vec2 vU;void main(){float a=vU.x*6.2832;float band=0.5+0.5*sin(a*3.+vU.y*14.-uT*5.);float band2=0.5+0.5*sin(a*1.-vU.y*9.+uT*3.3);float run=smoothstep(0.6,1.,0.5+0.5*sin(vU.y*30.-uT*12.));float al=(0.12+0.5*band*band2+0.45*run)*smoothstep(0.,0.06,vU.y)*smoothstep(1.,0.94,vU.y);gl_FragColor=vec4(vec3(1.,0.72,0.2)*al*1.6,al);}'});_lgLinkM.userData.keep=true;return _lgLinkM;}
function lgTube(mat,r,segments=1){const g=new THREE.CylinderGeometry(r,r,1,16,segments,true).translate(0,0.5,0).rotateX(Math.PI/2);const m=new THREE.Mesh(g,mat);m.frustumCulled=false;m.renderOrder=5;scene.add(m);return m;}
function lgAim(m,a,b){m.position.copy(a);m.lookAt(b);m.scale.set(1,1,a.distanceTo(b));}
function lightFX(o,p,pz,now,dt){
  const L=p.lt,s=LGV.st.get(p.id);
  if(!L){if(s)lgClear(s);return;}
  LGV.now=now;const S=lgState(p.id),n=L[0]|0,alive=p.al&&!p.dn,empOn=alive&&(L[5]|0)===1;S.t+=dt;
  if(!empOn&&S.empAura){fxKill(S.empAura);S.empAura=null;}
  LG_ULT_TIME.value=now/1000;
  if(getKit(p.id).path===LIGHTP||L[14]||L[15]){
    loadModel(LG_ULT_ASSET);loadModel(LG_CRYSTAL_ASSET);
  }
  const ward=lgWardVisual(o,S,!!L[15]&&alive,now);
  if(lgUltVisual(o,p,S,L[14],alive,now,dt)){lgClearBase(S);return;}
  o.g.updateWorldMatrix(true,false);
  // ---------- Light Step (ผู้ใช้ 2026-11-16 รอบ 2): วาร์ปแวบเดียว • ตัวโผล่มาเป็นร่างแสงนีออน แล้วจางกลับเป็นตัวปกติ + ท่าลงพื้น ----------
  // ลำดับ: 0–0.09 วิ ตัวยังอยู่ที่เดิมแต่กลายเป็นร่างแสงนีออน → แวบ (ปริซึมหดเป็นเส้น) → หาย 0.04 วิ (เส้นแสงแวบ) → โผล่ที่ใหม่เป็นร่างแสง แล้วจางกลับตัวปกติ • คริสตัลหาย/โผล่พร้อมตัว
  S.crHide=false;
  if(S.step){const st=S.step,t=(now-st.t0)/1000,T1=LGSH.stepOut,T2=T1+LGSH.stepHide;
    if(!S.orbT){S.orbT=lgTube(lgBeamMat(),1);}
    if(t<T1){o.g.visible=true;o.g.position.copy(st.a0);o.g.updateWorldMatrix(true,false);const k=clamp(t/0.05,0,1);lgNeon(o,k);
      o.b.rotation.x-=0.2*k;if(o.armL&&o.armR){o.armL.rotation.z-=0.5*k;o.armR.rotation.z+=0.5*k;}o.b.updateWorldMatrix(true,true);}   // ท่าก่อนแวบ: ตัวเอนหลังนิด แขนหุบ
    else{if(!st.outD){st.outD=1;fxPlay('light/step_out',{x:st.x,y:st.y,h:st.h,aim:false});}
      if(!st.inD&&t>=T1+0.02){st.inD=1;fxPlay('light/step_in',{x:st.x2,y:st.y2,h:st.h2,gh:st.h2,aim:false});if(p.id===NET.myId)shake(0.2);}
      const lt=t-T1;if(lt<0.12){S.orbT.visible=true;lgAim(S.orbT,st.a,st.b);S.orbT.scale.x=S.orbT.scale.y=0.22*(1-lt/0.12);}else S.orbT.visible=false;   // เส้นแสงแวบระหว่าง 2 จุด
      o.g.visible=t>=T2;S.crHide=t<T2;if(t>=T2&&!st.crS){st.crS=1;S.crSnap=1;}
      const u=clamp((t-T2)/0.25,0,1);lgNeon(o,t<T2?0:0.85*(1-u*u));   // ร่างแสงนีออน → ตัวปกติ
      if(t>=T2&&u<1){const e=1-u,c=e*e;if(!st.air){o.b.position.y-=0.22*c;o.b.rotation.x+=0.35*c;}if(o.armL&&o.armR){o.armL.rotation.z+=0.9*c;o.armR.rotation.z-=0.9*c;}o.b.updateWorldMatrix(true,true);}}   // มีพื้น: ย่อรับแรง • กลางอากาศ: กางแขนก่อนตก
    if(t>0.75){S.step=null;o.g.visible=true;lgNeon(o,0);S.orbT.visible=false;}}
  // ---------- Empower Light: ยกมือซ้ายแบ (ประกายดูดเข้ามือ) → กำมือดึงลงเร็ว (คลื่นแสงรอบตัว) • คริสตัลหมุนไว 2 รอบ ----------
  S.empSp=S.empSp||0;
  if(o.empOn){o.empT+=dt;const t=o.empT,R1=0.45,R2=0.6,HOLD=0.85,hand=()=>o.armL?o.armL.localToWorld(new THREE.Vector3(0,-0.5,0)):o.g.position.clone().add(new THREE.Vector3(0,1.8,0));
    if(t<dt*1.5){const h=hand();fxPlay('light/emp_gather',{x:h.x/S3+MW/2,y:h.z/S3+MH/2,h:h.y-GY(h.x/S3+MW/2,h.z/S3+MH/2),aim:false});}
    const w=t<0.12?t/0.12:(t>HOLD?Math.max(0,1-(t-HOLD)/0.25):1);
    if(o.armL&&w>0){let ax,tw,lx,dy=0,fa=0;
      if(t<R1){const e=t/R1;ax=-2.5-0.35*e*e;tw=0.3*e;lx=-0.12*e;}   // แบมือ: ยกขึ้นช้า ๆ ตัวบิดเปิดไปทางมือ เอนหลังนิด
      else{const e=clamp((t-R1)/(R2-R1),0,1),f=1-(1-e)*(1-e);ax=-2.85+1.35*f;tw=0.3-0.75*f;lx=-0.12+0.38*f;dy=-0.1*f;fa=f;}   // กำดึงลง: ศอกลง แขนท่อนล่างงอชี้ขึ้น ตัวบิดเข้าหามือ โน้มหน้า ย่อ
      o.armL.rotation.x=lerp(o.armL.rotation.x,ax,w);o.armL.rotation.z=lerp(o.armL.rotation.z,0.3,w);o.natFaL=Math.max(o.natFaL||0,fa*w);
      o.b.rotation.y+=tw*w;o.b.rotation.x+=lx*w;o.b.position.y+=dy*w;o.b.updateWorldMatrix(true,true);}
    if(t>=R1+0.06&&!o.empB){o.empB=1;fxPlay('light/emp_burst',{x:o.g.position.x/S3+MW/2,y:o.g.position.z/S3+MH/2,h:0,a:p.a||0,aim:false});
      if(empOn){fxKill(S.empAura);S.empAura=fxPlay('light/emp_aura',{x:p.x,y:p.y,h:0,follow:p.id,p:{t:LT_EM.t-t},aim:false});}
      if(p.id===NET.myId)shake(0.2);S.empX=now;}
    // คริสตัล: ตอนแบมือหมุนเร็วเข้ามาใกล้ตัว • กำมือ → กางออกวงกว้างแล้วค่อยกลับ
    S.empSp=(S.empSp||0)+dt*(t<R1?14:t<R2+0.1?24:5);S.empRr=t<R1+0.06?1.5:null;
    if(t>HOLD+0.3){o.empOn=0;}}
  // ---------- Shard Storm: ชูไม้วนวงเหนือหัว 2 รอบ (คริสตัลหมุนไว) → ฟาดชี้ไปทางเพื่อน ส่งคริสตัล ----------
  if(o.stOn){o.stT+=dt;const t=o.stT,UP=0.12,SP=0.42,PT=0.58,END=0.9,w=t<UP?t/UP:(t>END?Math.max(0,1-(t-END)/0.2):1);
    if(o.armR&&w>0){let ax,az,tw=0,lx=0;
      if(t<SP){const e=clamp(t/UP,0,1),ph=t/SP*Math.PI*4;ax=lerp(-1.0,-2.95,e)+0.22*Math.sin(ph);az=-0.25*Math.cos(ph);tw=-0.12*e;lx=-0.06*e;}   // ชูไม้ วงกลมเหนือหัว
      else{const e=clamp((t-SP)/(PT-SP),0,1),f=1-(1-e)*(1-e)*(1-e);ax=lerp(-2.95,-1.45,f);az=0;tw=-0.12+0.42*f;lx=-0.06+0.2*f;}   // ฟาดลงชี้ไปข้างหน้า ตัวบิดตามไม้ โน้มหน้า
      o.armR.rotation.x=lerp(o.armR.rotation.x,ax,w);o.armR.rotation.z=lerp(o.armR.rotation.z,az,w);o.b.rotation.y+=tw*w;o.b.rotation.x+=lx*w;o.b.updateWorldMatrix(true,true);}
    S.empSp=(S.empSp||0)+dt*(t<SP?22:4);
    if(t>=LT_VS_RELEASE&&!o.stF){o.stF=1;const ev=o.stEv;if(ev){const a=o.tipW?o.tipW.clone():o.g.position.clone().add(new THREE.Vector3(0,1.6,0));lgArcFx(a,lgWorld(ev.x,ev.y,0.4),LT_VS_TRAVEL,1.5,()=>{ring(ev.x,ev.y,'#ffd36a',ev.r||300,0.35,0.1);burst(ev.x,ev.y,'#ffe9a8',18,240,0.45,2,{h:0.5,g:1});});}if(p.id===NET.myId)shake(0.15);}
    if(t>END+0.2)o.stOn=0;}
  {const k=S.empX?(now-S.empX)/1000:9;const base=(L[5]|0)===1?1.8:1.0;S.empR=S.empRr!=null?S.empRr:(k<1.6?base+0.6*Math.max(0,1-k/1.6)*Math.min(1,k/0.15):base);if(!o.empOn)S.empSp=(S.empSp||0)+dt*Math.max(0,3*(1-k/1.6));}
  const allyId=L[1];
  if(empOn){S.empSp=(S.empSp||0)+dt*3.5;if(allyId&&allyId!=='P')LGV.empA[allyId]=now;}
  lgEmpFx(S,o,empOn,now,dt);
  {const oh=(L[17]|0)===1;if(S.ohOn&&!oh){S.ohEnd=now;for(const c of S.cr)if(c.visible){const P=c.position;fxPlay('light/crystal_in',{x:P.x/S3+MW/2,y:P.z/S3+MH/2,h:P.y-GY(P.x/S3+MW/2,P.z/S3+MH/2),aim:false,s:0.6});}}S.ohOn=oh;   // ร้อนเกิน: คริสตัลหรี่+ห้อยต่ำ 2 วิ → ครบแล้วหมุนตัวเองแวบ = พร้อมยิง
    S.ohK=clamp((S.ohK||0)+(oh?dt/0.25:-dt/0.5),0,1);const sp=S.ohEnd?clamp(1-(now-S.ohEnd)/700,0,1):0;S.crSpin=(S.crSpin||0)+dt*sp*sp*28;lgCrDim(S,S.ohK,sp);}
  // ---------- คริสตัลกับตัว ----------
  while(S.cr.length<3){const c=lgCrystalMesh(1);scene.add(c);S.cr.push(c);}
  const beam=L[4]|0,ba=L[10]||0,shOn=L[11]|0,bp=beam!==0?(L[13]||0):0;
  if(shOn&&o.shield)o.shield.visible=false;   // ไม่ใช้โล่ลูกแก้วปกติ (ใช้หกเหลี่ยม)
  // ท่า BA (ผู้ใช้ 2026-11-16): ตัวหันข้างเต็ม ๆ หัวหันไปทางเล็ง แขนขวากางชี้ไปทางเล็ง
  if(beam!==0&&alive){o.g.rotation.y=Math.atan2(Math.cos(ba),Math.sin(ba));o.g.updateWorldMatrix(true,false);}
  // ลอยขึ้นนุ่ม ๆ ฝั่งภาพ (snapshot มาเป็นช่วง ๆ ทำให้ขึ้นแบบหยุด ๆ): นับเวลาเอง แล้วอิงพื้นจาก snapshot แบบกรองนุ่ม
  if(beam!==0&&alive&&n>0){const py=o.g.position.y;o.lgFlT=Math.min(1,(o.lgFlT||0)+dt/LTV.baRise);const u=o.lgFlT,e=u*u*u*(u*(u*6-15)+10),fl=LTV.baFloat*e;
    if(o.lgY0===undefined)o.lgY0=py;else o.lgY0+=(py-fl-o.lgY0)*Math.min(1,dt*3);
    o.g.position.y=o.lgY0+fl;o.g.updateWorldMatrix(true,false);}
  else{o.lgFlT=0;o.lgY0=undefined;}   // ตัวหันตามทิศลำแสงจริงเสมอ
  {const on=beam!==0&&alive,k=o.lgPose=(o.lgPose||0)+((on?1:0)-(o.lgPose||0))*Math.min(1,dt*(on?6:4));
    if(k>0.01){const LP=LGPOSE;o.b.rotation.y+=LP.body*k;if(o.armR){o.armR.rotation.x=lerp(o.armR.rotation.x,LP.ax,k);o.armR.rotation.z=lerp(o.armR.rotation.z,LP.az-bp,k);
        const ht=(L[16]||0)/100,hs=ht*ht*0.11*k;if(hs>0.002){const t=now;o.armR.rotation.x+=hs*(Math.sin(t/21)+0.6*Math.sin(t/13.7));o.armR.rotation.z+=hs*(Math.sin(t/17.3)+0.6*Math.sin(t/29));}}   // ไม้สั่นตามความร้อน (ผู้ใช้ 2026-11-17)
      o.b.updateWorldMatrix(true,true);}
    o.lgHeadYaw=k>0.01?LGPOSE.head*k:0;}
  if(o.tip){o.tip.getWorldPosition(_lgW);}else _lgW.copy(o.g.position).add(new THREE.Vector3(0,1.4,0));
  const fwd=new THREE.Vector3(Math.cos(ba)*Math.cos(bp),Math.sin(bp),Math.sin(ba)*Math.cos(bp)),side=new THREE.Vector3(-Math.sin(ba),0,Math.cos(ba)),up=new THREE.Vector3(0,1,0),rUp=new THREE.Vector3().crossVectors(side,fwd).normalize();
  const ringC=_lgW.clone().addScaledVector(fwd,0.35);
  for(let i=0;i<3;i++){const c=S.cr[i];c.visible=alive&&i<n&&!S.crHide;if(!c.visible)continue;if(!shOn)c.scale.setScalar(empOn?1.2+0.08*Math.sin(now/90+i):1);
    let P;
    if(beam!==0&&n>0){   // คริสตัลบินไปรวมที่ปลายไม้ทีละชิ้นก่อนชาร์จเต็ม • ยิง: หมุนช้าลง (1 ชิ้น = อยู่กลาง ไม่หมุน)
      const ch=beam<0?(L[12]||0)/LTV.baCharge:1;
      const bk=(L[5]|0)===1?2:1;if(beam<0){S.spin=(S.spin||0)+dt*(ch<0.66?0:3.2*bk);}else S.spin=(S.spin||0)+dt*1.6*bk;
      let Pt;
      if(n===1)Pt=ringC.clone();
      else{const a=S.spin+i*Math.PI*2/n,r=0.5;Pt=ringC.clone().addScaledVector(side,Math.cos(a)*r).addScaledVector(rUp,Math.sin(a)*r);}
      const t0=0.094+i*0.188,u=beam<0?clamp((ch-t0)/0.312,0,1):1;   // บินเข้าปลายไม้ก่อน แล้วกางออกไปที่วง
      if(!c.lgFrom)c.lgFrom=c.position.clone();
      if(u<0.6){const e=u/0.6,f=e*e*(3-2*e);P=c.lgFrom.clone().lerp(_lgW,f);if(f>0&&f<1)P.y+=Math.sin(f*Math.PI)*0.2;}
      else{const e=(u-0.6)/0.4,f=e*e*(3-2*e);P=_lgW.clone().lerp(Pt,f);}
      c.position.copy(P);c.rotation.set(0,n===1?0:S.spin*2,0);continue;}   // ตัวคริสตัลตั้งขึ้นเสมอ
    c.lgFrom=null;
    if(shOn){   // โล่: คริสตัลเรียงสามเหลี่ยมกลางกำแพงรังผึ้ง (ด้านนอก)
      const a=p.a||0,sx=(i-(n-1)/2)*(n>2?2.2:1.3),sy=1.75+0.12*Math.sin(S.t*2+i);P=o.g.position.clone().add(new THREE.Vector3(Math.cos(a)*(LGSH.R-0.6)-Math.sin(a)*sx,sy,Math.sin(a)*(LGSH.R-0.6)+Math.cos(a)*sx));if(S.shGl){const g=S.shGl[i];g.visible=true;g.position.copy(c.position);g.scale.setScalar(1.5+0.2*Math.sin(S.t*5+i));}c.scale.setScalar(2.2);c.traverse(m=>m.renderOrder=12);   // คริสตัลหลังกำแพง ส่องแสง
      if(i<2)LREQ.push({x:P.x,y:P.y,z:P.z,col:'#ffc04a',int:1.1,dist:4});c.rotation.y+=dt*2;}
    else{const a=S.t*0.9+i*Math.PI*2/3+(S.empSp||0),er=S.empR||1.0;P=o.g.position.clone().add(new THREE.Vector3(Math.cos(a)*er,1.45-0.3*(S.ohK||0)+0.08*Math.sin(S.t*2+i),Math.sin(a)*er));c.rotation.y=S.t*1.5+(S.crSpin||0);}
    if(S.crSnap)c.position.copy(P);else c.position.lerp(P,Math.min(1,dt*14));}
  S.crSnap=0;
  // ---------- ลำแสง ----------
  if(!(beam>0&&alive))S.pb=0;
  if(beam>0&&alive){if(!S.beam){S.beam=lgTube(lgBeamMat(),1);S.ring=new THREE.Mesh(new THREE.TorusGeometry(0.3,0.03,8,40),new THREE.MeshBasicMaterial({color:hdr('#fff1c0',2.4),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(S.ring);}
    if(!(S.pb>0)){S.fireT=now;   // ลำแรกออก: แรงกระแทก (VFX Studio light/ba_fire) + ลำหนาพุ่งแล้วหด + จอสั่นเบา ๆ (ของเรา)
      {const q=ringC.clone().addScaledVector(fwd,-0.6),fx0=q.x/S3+MW/2,fy0=q.z/S3+MH/2;fxPlay('light/ba_fire',{x:fx0,y:fy0,h:q.y-1.3-GY(fx0,fy0),a:ba,aim:false,s:empOn?1.5:1});}if(p.id===NET.myId)shake(empOn?0.3:0.18);}
    const kick=Math.max(0,1-(now-(S.fireT||0))/220),len=(L[9]??600)*S3,w=[0.058,0.115,0.215,0.35][Math.min(3,beam-1)]*(1+1.6*kick*kick);S.pb=beam;
    const end=o.g.position.clone().addScaledVector(up,1.35).addScaledVector(fwd,len),axis=end.clone().sub(ringC);
    const visible=axis.dot(fwd)>0.01;
    S.ring.visible=S.beam.visible=visible;
    if(visible){lgAim(S.beam,ringC,end);}
    _lgBeamM.uniforms.uT.value=now/1000;S.ring.position.copy(ringC);S.ring.lookAt(ringC.clone().add(fwd));S.ring.scale.setScalar(0.8+0.25*Math.sin(now/60));
    axis.normalize();S.bWall=(L[18]|0)>0;S.bHitK=L[18]|0;S.me=o;S.bHeat=(L[16]||0)/100;S.bSt=Math.max(0,beam-1);
    lgBaCore(S,visible,ringC,end,axis,w*(empOn?1.15:1),now);
    lgEmpBeam(S,visible&&empOn,ringC,end,axis,w,now);if(visible)S.beam.scale.x=S.beam.scale.y=w*(empOn?1.45:1)*(S.bPulse||1);   // ลำเต้นเป็นจังหวะ (S.bPulse จาก lgBaCore)
    LREQ.push({x:ringC.x,y:ringC.y,z:ringC.z,col:'#ffd36a',int:0.7,dist:4});
}
  else if(S.beam){S.beam.visible=S.ring.visible=false;lgEmpBeam(S,false);lgBaCore(S,false);}
  // ---------- โล่รังผึ้ง (ผู้ใช้ 2026-11-16 ref: กำแพงหกเหลี่ยมโค้งรอบหน้า คริสตัลมาก = กว้าง/ใหญ่) ----------
  lgShield(S,o,p,n,shOn&&alive,now,dt);
  // ---------- สายลิงก์ ----------
  const lp=L[2];
  if(lp&&alive){if(!S.link)S.link=lgTube(lgLinkMat(),0.09);S.link.visible=true;
    const a=o.g.position.clone().add(new THREE.Vector3(0,1.3,0));let b;
    if(L[1]&&L[1]!=='P'){const ao=PM3.get(L[1]);b=ao?ao.g.position.clone().add(new THREE.Vector3(0,1.3,0)):lgWorld(lp[0],lp[1],1.3);}else b=lgWorld(lp[0],lp[1],1.0);
    // สายลิงก์พุ่งออกจากอกเราไปหาคู่หู (0.6 วิ) มีหัวแสงนำ → ถึงแล้วแวบแสงที่คู่หู • ตอนหลุด/เรียกคืน สายหดกลับเข้าหาเรา
    const tgt=L[1]||'P';if(S.lkTo!==tgt){S.lkTo=tgt;S.lkT0=now;S.lkHit=0;}
    const gk=clamp((now-S.lkT0)/600,0,1),ge=1-(1-gk)*(1-gk),bb=a.clone().lerp(b,ge);S.lkA=a.clone();S.lkB=b.clone();S.unT0=0;
    lgAim(S.link,a,bb);_lgLinkM.uniforms.uT.value=now/1000;
    if(!S.lkHead){S.lkHead=new THREE.Sprite(new THREE.SpriteMaterial({map:LGV.glowT||(LGV.glowT=lgGlowTex()),color:hdr('#fff0c0',2.6),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(S.lkHead);}
    S.lkHead.visible=gk<1;if(gk<1){S.lkHead.position.copy(bb);S.lkHead.scale.setScalar(0.7);}
    if(gk>=1&&!S.lkHit){S.lkHit=1;const bx=b.x/S3+MW/2,by=b.z/S3+MH/2;fxPlay('light/crystal_in',{x:bx,y:by,h:b.y-GY(bx,by),aim:false});}
    if(L[1]==='P'){if(!S.prism){S.prism=lgCrystalMesh(2.2);scene.add(S.prism);}S.prism.visible=true;S.prism.position.copy(lgWorld(lp[0],lp[1],1.0+0.1*Math.sin(now/400)));S.prism.rotation.y=now/700;}
    else if(S.prism)S.prism.visible=false;}
  else{if(S.prism)S.prism.visible=false;
    if(S.lkTo&&S.lkA){S.lkTo=null;S.unT0=now;}   // หดกลับ
    const uk=S.unT0?clamp((now-S.unT0)/420,0,1):1;
    if(S.link&&uk<1&&alive){const a=o.g.position.clone().add(new THREE.Vector3(0,1.3,0)),e=uk*uk;S.link.visible=true;lgAim(S.link,a,S.lkB.clone().lerp(a,e));if(S.lkHead){S.lkHead.visible=true;S.lkHead.position.copy(S.lkB.clone().lerp(a,e));}}
    else{if(S.link)S.link.visible=false;if(S.lkHead)S.lkHead.visible=false;S.unT0=0;}}
  // ---------- คริสตัลที่ได้จากคู่หู (หมุนรอบตัวช้า ๆ) ----------
  const an=L[3]|0;
  while(S.ally.length<an){const c=lgCrystalMesh(0.85);scene.add(c);S.ally.push(c);}
  for(let i=0;i<S.ally.length;i++){const c=S.ally[i];c.visible=alive&&!ward&&i<an;if(!c.visible)continue;const a=-S.t*0.7+i*Math.PI*2/Math.max(1,an);
    c.scale.setScalar(LGV.empA[p.id]&&now-LGV.empA[p.id]<300?1.05+0.08*Math.sin(now/90+i):0.85);c.position.copy(o.g.position).add(new THREE.Vector3(Math.cos(a)*0.62,1.55+0.06*Math.sin(S.t*2+i),Math.sin(a)*0.62));c.rotation.y=S.t;}
  if(an>0&&alive&&!ward){if(!S.aura){S.aura=new THREE.Mesh(new THREE.CircleGeometry(0.9,40),new THREE.MeshBasicMaterial({map:LGV.glowT||(LGV.glowT=lgGlowTex()),color:hdr('#ffb847',1),transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false}));S.aura.rotation.x=-Math.PI/2;scene.add(S.aura);}
    S.aura.visible=true;S.aura.position.copy(o.g.position).add(new THREE.Vector3(0,0.04,0));S.aura.scale.setScalar(0.8+0.15*an);S.aura.material.opacity=0.28+0.1*an+0.05*Math.sin(S.t*3);}else if(S.aura)S.aura.visible=false;   // ออร่าทองที่เท้าคู่หู
  // ---------- Sanctum Crystal: พื้นเหลืองตามจำนวนคริสตัลและประกายลอยขึ้น ----------
  const Z=L[7];
  if(Z){if(!S.san){S.san=lgNeonCrystal(4.5);S.sanR=new THREE.Mesh(new THREE.RingGeometry(0.984,1,96),new THREE.MeshBasicMaterial({color:'#f2cd59',transparent:true,opacity:0.64,depthWrite:false,side:THREE.DoubleSide}));S.sanR.rotation.x=-Math.PI/2;
      S.sanTint=new THREE.Mesh(new THREE.CircleGeometry(1,96),new THREE.MeshBasicMaterial({map:lgSanctumFloorTex(),color:'#ffd965',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
      S.sanTint.rotation.x=-Math.PI/2;S.sanO=[];S.sanM=[];scene.add(S.san,S.sanR,S.sanTint);}
    const P=lgWorld(Z[0],Z[1],0),nz=Z[2]|0,Rt=(LT_SC.r+LT_SC.rUp*Math.max(0,nz-1))*S3;if(!S.sanRc){S.sanRc=Rt;S.sanRv=0;}else{const h=Math.min(dt,0.05);S.sanRv+=((Rt-S.sanRc)*40-S.sanRv*7)*h;S.sanRc+=S.sanRv*h;}const R=S.sanRc;if(!S.sanT0||S.sanKey!==Z[0]+','+Z[1]){S.sanT0=now;S.sanKey=Z[0]+','+Z[1];S.sanN=nz;}
    if(nz>(S.sanN|0)){S.sanPulse=now;S.sanWr0=S.sanRc;S.sanWr1=Rt;}S.sanN=nz;const pulse=S.sanPulse?Math.max(0,1-(now-S.sanPulse)/500):0;
    const rise=clamp((now-S.sanT0-250)/900,0,1),re=1-(1-rise)*(1-rise);
    S.sanLevel=lerp(S.sanLevel??nz,nz,Math.min(1,dt*5.5));
    const stage=clamp(S.sanLevel-1,0,2);
    S.san.visible=S.sanR.visible=true;
    const gt=1+0.3*Math.max(0,nz-1);
    if(!S.sanG){S.sanG=gt;S.sanGv=0;}else{const h=Math.min(dt,0.05);S.sanGv+=((gt-S.sanG)*30-S.sanGv*5)*h;S.sanG+=S.sanGv*h;}
    const NS=4.5*(0.4+0.6*re)*S.sanG*(1+0.1*pulse);
    const lift=0.3+re*(1+stage*(0.56+0.1*stage))+0.38*NS*0.33*1.15;
    S.san.scale.setScalar(NS);S.san.position.set(P.x,P.y+lift+(0.25+0.045*stage)*Math.sin(now/700),P.z);
    S.san.rotation.set(0.05*Math.sin(now/1300),now/1100,0.05*Math.cos(now/1500));
    const U=S.san.userData,bt=0.05*Math.sin(now/260),hs=1+0.18*stage;
    U.halo[0].rotation.z=now/600;U.halo[1].rotation.z=-now/800;
    U.core.material.opacity=Math.min(0.95,0.37+0.18*stage+0.17*pulse+bt);
    U.heart.material.opacity=Math.min(0.95,0.35+0.26*stage+0.18*pulse+bt);
    U.heart.scale.set(0.2*hs,0.34*hs,0.2*hs);
    U.glow.material.opacity=0.14+0.095*stage+0.1*pulse;
    S.sanR.position.copy(P).add(new THREE.Vector3(0,0.05,0));S.sanR.scale.setScalar(R*Math.min(1,0.2+rise*1.5));S.sanR.material.opacity=0.64+0.14*pulse;
    S.sanTint.visible=true;S.sanTint.position.set(P.x,P.y+0.025,P.z);S.sanTint.scale.copy(S.sanR.scale);
    S.sanTint.material.opacity=rise*(0.17+0.18*stage);
    if(!S.sanWv){S.sanWv=new THREE.Mesh(new THREE.RingGeometry(0.982,1,72),new THREE.MeshBasicMaterial({color:'#ffe08a',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));S.sanWv.rotation.x=-Math.PI/2;scene.add(S.sanWv);}
    {const e=S.sanPulse?clamp((now-S.sanPulse)/700,0,1):1,eo=1-(1-e)*(1-e)*(1-e);S.sanWv.visible=e<1;if(e<1){S.sanWv.position.copy(P).add(new THREE.Vector3(0,0.07,0));S.sanWv.scale.setScalar(0.3*(S.sanWr0||R)+((S.sanWr1||R)*1.08-0.3*(S.sanWr0||R))*eo);S.sanWv.material.opacity=0.55*(1-e);}}
    while(S.sanO.length<nz){const c=lgCrystalMesh(1);scene.add(c);S.sanO.push(c);}
    for(let i=0;i<S.sanO.length;i++){const c=S.sanO[i];c.visible=i<nz&&now-S.sanT0>300;const a=now/450+i*Math.PI*2/Math.max(1,nz);const cy=S.san.position.y-P.y,orr=0.3*NS*0.33+0.55;c.position.copy(P).add(new THREE.Vector3(Math.cos(a)*orr,cy+0.12*Math.sin(now/400+i*2),Math.sin(a)*orr));c.rotation.y=now/300;c.scale.setScalar(1.8);c.traverse(m=>m.renderOrder=9);}
    if(!S.sanM.length)for(let k=0;k<23;k++){
      const g=new THREE.Sprite(new THREE.SpriteMaterial({map:lgSanctumMoteTex(),color:hdr('#ffffff',1.4),transparent:true,depthWrite:false}));
      scene.add(g);S.sanM.push({g,t:Math.random(),a:k*2.39996,r:Math.random(),speed:0.42+Math.random()*0.25});}
    const live=11+4*nz;
    for(let k=0;k<S.sanM.length;k++){
      const M=S.sanM[k];M.t+=dt*M.speed;
      if(M.t>=1){M.t%=1;M.a+=1.7;M.r=Math.random();}
      const r=R*(k%2?0.73+0.23*M.r:0.13+0.62*Math.sqrt(M.r));
      const a=M.a+M.t*0.07,f=Math.sin(M.t*Math.PI);
      M.g.visible=rise>0.05&&k<live;
      M.g.position.set(P.x+Math.cos(a)*r,P.y+0.16+M.t*(2+2*M.speed),P.z+Math.sin(a)*r);
      M.g.scale.set(0.29+0.11*f,0.48+0.55*f,1);M.g.material.rotation=0.07*Math.sin(M.a);
      M.g.material.opacity=rise*Math.min(0.9,f*1.4);}
    LREQ.push({x:P.x,y:P.y+0.3,z:P.z,col:'#ffb847',int:0.33+0.16*stage+pulse*0.15,dist:5+nz});}
  else if(S.san){S.sanRc=0;S.sanG=0;S.sanLevel=null;S.san.visible=S.sanR.visible=S.sanTint.visible=false;if(S.sanWv)S.sanWv.visible=false;for(const c of S.sanO)c.visible=false;for(const M of S.sanM)M.g.visible=false;S.sanT0=0;}
  // ---------- Shard Storm: วงใบมีดคริสตัลหมุนอยู่กับที่ (ไม่ตามตัว) ----------
  const W=L[8];
  if(W){if(!S.veil){S.veil=new THREE.Group();S.vB=[];const sm=new THREE.MeshBasicMaterial({color:hdr('#ffb840',1.1),transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
      for(let r=0;r<2;r++){const n=r?5:3,ro=r?0.78:0.42;for(let q=0;q<n;q++){const b=new THREE.Group(),c=lgCrystalMesh(1);c.rotation.z=Math.PI/2;c.scale.set(3.6,5.2,2.2);b.add(c);
        const st=new THREE.Mesh(new THREE.RingGeometry(ro-0.018,ro+0.018,32,1,0,0.8),sm);st.rotation.x=-Math.PI/2;S.veil.add(st);S.vB.push({b,st,r,ro,a0:q*Math.PI*2/n});S.veil.add(b);}}
      S.veilR=new THREE.Mesh(new THREE.RingGeometry(0.978,1,96),new THREE.MeshBasicMaterial({color:'#df9f45',transparent:true,opacity:0.65,depthWrite:false,side:THREE.DoubleSide}));S.veilR.rotation.x=-Math.PI/2;
      S.veilF=new THREE.Mesh(new THREE.CircleGeometry(1,72),new THREE.MeshBasicMaterial({map:lgHoneyTex(),color:hdr('#ffb040',0.8),transparent:true,opacity:0.25,blending:THREE.AdditiveBlending,depthWrite:false}));S.veilF.rotation.x=-Math.PI/2;scene.add(S.veil,S.veilR,S.veilF);}
    const P=lgWorld(W[0],W[1],0),R=LT_VS.r*S3,left=W[2]/10,el=LT_VS.t-left,gr=clamp(el/0.4,0,1),ge=1-(1-gr)*(1-gr)*(1-gr),fd=clamp(left/0.4,0,1),k=ge*fd;
    S.veilR.visible=true;S.veil.visible=S.veilF.visible=k>0.01;S.veil.position.copy(P);S.veil.scale.setScalar(R*ge);
    for(const B of S.vB){const a=B.a0+(B.r?1:-1)*now/(B.r?140:105);B.b.position.set(Math.cos(a)*B.ro,(0.5+0.25*B.r+0.08*Math.sin(now/180+B.a0))/(R*ge+0.01),Math.sin(a)*B.ro);B.b.rotation.set(0,-a+(B.r?0:Math.PI),0.25);B.b.scale.setScalar(1/(R*ge+0.01));B.b.visible=k>0.01;
      B.st.position.y=0.06/(R*ge+0.01);B.st.rotation.z=B.r?-a:-a-0.8;B.st.material.opacity=0.35*k;}
    S.veilR.position.copy(P).add(new THREE.Vector3(0,0.05,0));S.veilR.scale.setScalar(R);S.veilR.material.opacity=(0.62+0.06*Math.sin(now/120))*Math.max(0.2,fd);
    S.veilF.position.copy(P).add(new THREE.Vector3(0,0.04,0));S.veilF.scale.setScalar(R*ge);S.veilF.rotation.z=-now/2500;S.veilF.material.opacity=0.22*k;
    LREQ.push({x:P.x,y:P.y+0.6,z:P.z,col:'#ffc04a',int:0.7*k,dist:8});}
  else if(S.veil){S.veil.visible=S.veilR.visible=S.veilF.visible=false;}
}
function lgBaseObjects(s){return [...s.cr,...s.ally,s.beam,s.ring,s.shF,s.shE,s.shG,s.orbT,s.aura,s.lkHead,...(s.ew||[]),...(s.ea||[]),...(s.shGl||[]),...(s.mote||[]).map(M=>M.g),s.link,s.prism,s.san,s.sanR,s.sanTint,s.sanWv,...(s.sanO||[]),...(s.sanM||[]).map(M=>M.g),s.veil,s.veilR,s.veilF,...(s.eMo||[]),s.eTip,s.bC,s.bEnd,...(s.wSp||[]),...(s.shd||[]),...(s.bLR||[]),...(s.mR||[]),s.bHot,s.bHotR,...(s.bSp||[]),...(s.bR||[]),...(s.eTr||[])];}
function lgClearBase(s){for(const m of lgBaseObjects(s))if(m)m.visible=false;}
function lgClear(s){
  lgClearBase(s);
  fxKill(s.empAura);s.empAura=null;
  lgAllyEmpEnd(s);
  for(const m of [s.sovereign?.g,s.ultBeam,s.palmGate?.root,s.palmTrail?.mesh,s.returnMark?.root,...(s.wardCrystals||[])])if(m)m.visible=false;
  if(s.palmTrail)s.palmTrail.last=null;
}
function lightDropView(id){
  const s=LGV.st.get(id);if(!s)return;
  fxKill(s.empAura);lgAllyEmpEnd(s);
  for(const m of [...lgBaseObjects(s),s.sovereign?.g,s.returnMark?.root,s.ultBeam,s.palmGate?.root,s.palmTrail?.mesh,...(s.wardCrystals||[])])if(m)disposeObj(m);
  LGV.st.delete(id);
}
function lgAllyEmpEnd(s){
  s.allyEmpPending=null;
  fxKill(s.allyEmpAura);s.allyEmpAura=null;
}
// ---------- เหตุการณ์ ----------
// คริสตัลแวบ a→b: ปริซึมหดที่ a, เส้นแสงแวบ 0.1 วิ, ปริซึมกางที่ b (0.05 วิ ให้หลัง)
function lgBlip(a,b,trail=true){const g=v=>[v.x/S3+MW/2,v.z/S3+MH/2];const[ax,ay]=g(a),[bx,by]=g(b);fxPlay('light/crystal_out',{x:ax,y:ay,h:a.y-GY(ax,ay),aim:false});
  if(trail){const m=lgTube(lgBeamMat(),1);lgAim(m,a,b);m.scale.x=m.scale.y=0.06;LGV.fx.push({m:null,t:0,max:0.12,fn:k=>{m.scale.x=m.scale.y=0.06*(1-k);},end:()=>scene.remove(m)});}
  later(0.05,()=>fxPlay('light/crystal_in',{x:bx,y:by,h:b.y-GY(bx,by),aim:false}));}
// คริสตัลพุ่งโค้งมีหางแสง a→b แล้วเรียก done ตอนถึง
function lgArcFx(a,b,t,arc,done){const c=lgCrystalMesh(1.2),tr=lgTube(lgBeamMat(),1),pts=[];scene.add(c);tr.visible=false;
  LGV.fx.push({m:null,t:0,max:t,fn:k=>{const e=k*k;const P=a.clone().lerp(b,e);P.y+=Math.sin(k*Math.PI)*arc*(1-k*0.3);c.position.copy(P);c.rotation.y+=0.4;pts.push(P.clone());if(pts.length>5)pts.shift();if(pts.length>1){tr.visible=true;lgAim(tr,pts[0],P);tr.scale.x=tr.scale.y=0.05;}},
    end:()=>{scene.remove(c);scene.remove(tr);if(done)done();}});}
function lgFlyFx(a,b,t,scale){const c=lgCrystalMesh(scale||1);scene.add(c);LGV.fx.push({m:c,a,b,t:0,max:t,arc:0.6});}
function lgSovereignArrival(center){
  const root=new THREE.Group();root.name='SovereignArrival';root.position.copy(center);
  const light=(color,intensity)=>new THREE.MeshBasicMaterial({color:hdr(color,intensity),toneMapped:false,
    transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const cross=new THREE.Group();cross.name='SovereignArrivalCross';root.add(cross);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,0,0,-.16,0,1,0,0,-1,0,0,1,0,0,0,.16,0],3));
  const flash=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    uniforms:{alpha:{value:1}},
    vertexShader:`varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 p;uniform float alpha;void main(){
      float width=abs(p.y)/max(.008,.16*(1.-abs(p.x)));
      float edge=1.-smoothstep(.65,1.,width),core=1.-smoothstep(.17,.47,width);
      vec3 color=mix(vec3(1.35,.49,.057),vec3(3.7,2.86,1.52),core);
      gl_FragColor=vec4(color,alpha*edge*(.42+.58*core));
    }`});
  for(const angle of [-Math.PI/4,Math.PI/4]){
    const stroke=new THREE.Mesh(g,flash);stroke.rotation.z=angle;stroke.renderOrder=8;cross.add(stroke);
  }
  const rings=[-1,1].map((side,i)=>{
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1,i===0?.051:.027,6,64),light(i===0?'#ffd082':'#fff0ba',1.38));
    ring.name='SovereignArrivalRing';ring.rotation.set(Math.PI/2+side*.53,side*.57,0);
    ring.renderOrder=7;root.add(ring);return ring;
  });
  scene.add(root);
  const pose=k=>{
    cross.quaternion.copy(cam.quaternion);
    cross.scale.setScalar(.56+6.15*(1-(1-k)**3));
    flash.uniforms.alpha.value=1-THREE.MathUtils.smoothstep(k,.14,.89);
    for(const [i,ring] of rings.entries()){
      const t=clamp((k-i*.07)/(1-i*.07),0,1);
      ring.visible=k>=i*.07;
      ring.scale.setScalar(.59+(i===0?4.45:3.64)*(1-(1-t)**2));
      ring.material.opacity=(i===0?.96:.84)*(1-t)**1.62;
    }
  };
  pose(0);
  LGV.fx.push({t:0,max:LG_ULT_ARRIVAL_FX,fresh:true,fn:pose,end:()=>disposeObj(root)});
}
function lightFxTick(dt){for(let i=LGV.fx.length-1;i>=0;i--){const f=LGV.fx[i];if(f.fresh)f.fresh=false;else f.t+=dt;const k=Math.min(1,(f.t+1e-6)/f.max);
  if(f.m){f.m.position.lerpVectors(f.a,f.b,k);f.m.position.y+=Math.sin(k*Math.PI)*(f.arc||0);f.m.rotation.y+=dt*8;}
  if(f.fn)f.fn(k,f);
  if(k>=1){if(f.m)scene.remove(f.m);if(f.end)f.end(f);LGV.fx.splice(i,1);}}}
const LG_BLAST_EXPAND=.24,LG_BLAST_HOLD=.23;
function lgImpactDome(x,y,h,r,duration,kind='impact'){
  const blast=kind!=='impact',inner=kind==='inner';
  const uniforms={progress:{value:0},alpha:{value:blast ? .75 : .88},
    density:{value:inner ? .28 : blast ? .44 : .38},inner:{value:inner?1:0}};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    vertexShader:`varying vec3 p,n,v;void main(){
      p=position;n=normalize(normalMatrix*normal);vec4 q=modelViewMatrix*vec4(position,1.);v=-q.xyz;
      gl_Position=projectionMatrix*q;
    }`,
    fragmentShader:`uniform float progress,alpha,density,inner;varying vec3 p,n,v;
      void main(){
        float rim=pow(1.-abs(dot(normalize(n),normalize(v))),2.75);
        float t=fract(p.y*2.7-progress*(4.+inner*1.65)+p.x*.63+.11*sin(p.z*17.+progress*13.));
        float trace=1.-smoothstep(.025,.095,abs(t-.45));
        float foot=1.-smoothstep(.012,.093,p.y);
        vec3 c=mix(mix(vec3(.99,.51,.067),vec3(1.37,.54,.058),inner),vec3(1.57,1.19,.49),max(rim,trace*.74));
        float facing=gl_FrontFacing ? 1. : .65;
        gl_FragColor=vec4(c,alpha*facing*clamp(density+rim*.52+trace*.25+foot*.31,0.,1.));
      }`});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1,36,14,0,Math.PI*2,0,Math.PI/2),material);
  const center=lgWorld(x,y,h+.025);
  dome.name=inner?'SovereignInnerBlast':blast?'SovereignBlastDome':'SovereignImpactDome';
  dome.renderOrder=inner?6:7;scene.add(dome);
  const pose=k=>{
    const t=k*duration,lag=inner ? .050 : 0;
    const expand=clamp((t-lag)/LG_BLAST_EXPAND,0,1);
    const compress=blast?0:THREE.MathUtils.smoothstep(t,duration-.24,duration);
    const scale=blast?r*(1-(1-expand)**2):r*(.63+.37*THREE.MathUtils.smoothstep(k,0,.55))*(1-.81*compress);
    const heightRatio=inner ? .82 : blast ? 1 : .69;
    dome.scale.set(Math.max(.02,scale),Math.max(.02,scale*heightRatio),Math.max(.02,scale));
    dome.position.copy(center);
    if(!blast){const jitter=lerp(.055,.16,k)*(1-compress);dome.position.x+=Math.sin(t*102)*jitter;dome.position.z+=Math.sin(t*73+.9)*jitter;}
    uniforms.progress.value=k;
    const fade=1-THREE.MathUtils.smoothstep(t,lag+LG_BLAST_EXPAND+LG_BLAST_HOLD,duration);
    uniforms.alpha.value=inner ? .80*fade*THREE.MathUtils.smoothstep(t,lag,lag+.08)
      : blast ? .96*fade : .84+.14*k+.09*Math.sin(t*72)+.18*compress;
  };
  pose(0);LGV.fx.push({t:0,max:duration,fresh:true,fn:pose,end:()=>disposeObj(dome)});
}
function lgBlastFloor(x,y,h,r,duration){
  const geometry=new THREE.PlaneGeometry(r*2,r*2,24,24).rotateX(-Math.PI/2);
  const pos=geometry.attributes.position,base=GY(x,y);
  for(let i=0;i<pos.count;i++){
    const px=x+pos.getX(i)/S3,py=y+pos.getZ(i)/S3;
    pos.setY(i,GY(px,py)+groundH(px,py,h)-base-h);
  }
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    uniforms:{progress:{value:0},expand:{value:LG_BLAST_EXPAND/duration}},
    vertexShader:`varying vec2 p;void main(){p=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float progress,expand;varying vec2 p;
      void main(){
        float r=length(p),a=atan(p.y,p.x),left=1.-clamp(progress/expand,0.,1.);
        float front=1.-left*left;
        float echo=.72*smoothstep(.05,.34,progress);
        float edge=1.-smoothstep(.008,.043,abs(r-front*.982));
        float sweep=1.-smoothstep(.009,.045,abs(r-echo));
        float cell=abs(fract(a*3.8197+.5)-.5);
        float rune=(1.-smoothstep(.030,.063,abs(cell*.81+abs(r-.84)*3.3-.206)))*smoothstep(.74,.82,front);
        float crack=1.-smoothstep(.008,.032,abs(fract(a*2.228+r*1.1+.11*sin(r*29.)+.05*sin(r*66.))-.5));
        crack*=(1.-smoothstep(.49,.85,r))*(1.-smoothstep(.03,.105,r-front));
        float resident=(1.-smoothstep(.02,front*.89+.12,r))*.34;
        float mark=clamp(edge+.78*sweep+.68*rune+.62*crack,0.,1.);
        vec3 color=mix(vec3(.92,.37,.042),vec3(1.59,1.14,.44),mark);
        float fade=smoothstep(0.,.07,progress)*(1.-smoothstep(.52,1.,progress));
        gl_FragColor=vec4(color,fade*(1.-smoothstep(.986,1.,r))*clamp(.79*mark+resident,0.,1.));
      }`});
  const floor=new THREE.Mesh(geometry,material);floor.name='SovereignBlastFloor';floor.renderOrder=4;
  floor.position.copy(lgWorld(x,y,h+.047));scene.add(floor);
  LGV.fx.push({t:0,max:duration,fresh:true,fn:k=>{material.uniforms.progress.value=k;},end:()=>disposeObj(floor)});
}
function lgBlastThreads(x,y,h,r,duration){
  const seeds=[],segments=12;
  for(let i=0;i<26;i++){
    const a=i/26,phase=(i*13%29)/29;
    for(let j=0;j<segments;j++)seeds.push(a,phase,j/segments,a,phase,(j+1)/segments);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(seeds,3));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{r:{value:r},progress:{value:0}},
    vertexShader:`uniform float r,progress;varying float glow;varying float colorMix;
      void main(){
        float age=max(0.,progress-position.y*.085),speed=smoothstep(0.,.40,age);
        float t=position.z,a=position.x*6.283+(.32+position.y*.51)*t+age*.34;
        float reach=r*speed*(.62+.23*position.y)*t;
        float h=r*speed*sin(t*2.5)*(.10+.41*position.y)+r*age*.085;
        vec3 q=vec3(cos(a)*reach,h,sin(a)*reach);
        glow=smoothstep(0.,.07,age)*(1.-smoothstep(.53,1.,age))*sin(t*3.14159)*(.40+.60*position.y);
        float front=fract(t*2.-age*2.6+position.y);
        colorMix=1.-smoothstep(.0,.21,abs(front-.36));
        gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.);
      }`,
    fragmentShader:`varying float glow,colorMix;
      void main(){gl_FragColor=vec4(mix(vec3(1.35,.51,.055),vec3(2.1,1.54,.69),colorMix),glow);}`});
  const threads=new THREE.LineSegments(geometry,material);
  threads.name='SovereignBlastThreads';threads.frustumCulled=false;threads.renderOrder=5;
  threads.position.copy(lgWorld(x,y,h+.065));scene.add(threads);
  LGV.fx.push({t:0,max:duration,fresh:true,fn:k=>{material.uniforms.progress.value=k;},end:()=>disposeObj(threads)});
}
function lightEfx(ev){
  const z=ev.z,x=ev.x,y=ev.y,H=ev.h!==undefined?ev.h:0,me=myPos(),near=!me||Math.hypot(x-me.x,y-me.y)<1100;
  switch(z){
    case 'lgsanadd':{const o=PM3.get(ev.id);if(o)castStart(o,'line');const a=o&&o.tip?o.tip.getWorldPosition(new THREE.Vector3()):lgWorld(x,y,H);lgArcFx(a,lgWorld(ev.x2,ev.y2,1.4),0.4,1.6,()=>fxPlay('light/crystal_in',{x:ev.x2,y:ev.y2,h:1.4,aim:false}));if(near)snd('cast_pull',ev);return true;}   // เพิ่ม: พุ่งโค้งเข้าวง (วงสว่างขึ้นใน lightFX)
    case 'lgsend':{   // Crystal Bond ส่ง: สะบัดไม้ชี้หาคู่หู • คริสตัลแวบหายที่เรา → เส้นแสงแวบ → แวบโผล่ที่คู่หู
      const o=PM3.get(ev.id);if(o)castStart(o,'line');lgBlip(lgWorld(x,y,H+0.1),lgWorld(ev.x2,ev.y2,(ev.h2||1.4)+0.15));if(near)snd('cast_pull',ev);return true;}
    case 'lgrecall':{   // กดค้างหรือคู่หูล้ม: ดึงไม้กลับและให้คริสตัลแวบกลับทีละชิ้น
      skAnim({id:ev.id,s:'lgrecall'});
      const S=LGV.st.get(ev.id);
      if(S){if(ev.instant||ev.blocked){S.lkTo=null;S.unT0=0;}S.crSnap=1;}
      if(ev.n>0&&ev.x2!==undefined){
        const from=lgWorld(ev.x2,ev.y2,ev.h2),to=lgWorld(x,y,H);
        for(let k=0;k<ev.n;k++){
          const offset=new THREE.Vector3(Math.cos(k*2.1),0,Math.sin(k*2.1));
          const a=from.clone().addScaledVector(offset,.6),b=to.clone().addScaledVector(offset,.7);
          if(k===0)lgBlip(a,b,!ev.blocked);
          else later(k*.06,()=>lgBlip(a,b,!ev.blocked));
        }
      }else FX.flashSprite(x,y,H,'#ffd36a',0.2,1,0.1,1);
      if(near)snd('cast_pull',ev);return true;}
    case 'lglink':case 'lgprism':FX.flashSprite(x,y,H+1.3,'#fff1c0',0.25,1.2,0.1,1);if(near)snd('buff',ev);return true;
    case 'lgunlink':FX.flashSprite(x,y,H,'#ffd36a',0.2,1,0.1,1);return true;
    case 'lgbahit':FX.flashSprite(x,y,H,'#fff1c0',0.1,0.45,0.08,0.5);return true;
    case 'lgvol':{   // Shard Volley: คริสตัลหมุนเข้าปลายไม้ (0.15 วิ) → ชี้ไม้ → แวบไปจุด (ตัวใหญ่) → หมุนชาร์จเร็วขึ้น/สว่างขึ้น + วงเตือนพื้น
      const o=PM3.get(ev.id);if(o)castStart(o,'line');const C=ev.t||LT_VO.charge,W=ev.w||LT_VO.wind,ST=ev.st||LT_VO.step,S=LGV.st.get(ev.id);
      const tip=()=>o&&o.tip?o.tip.getWorldPosition(new THREE.Vector3()):lgWorld(x,y,H);
      (ev.pts||[]).forEach((q,i)=>{const b=lgWorld(q[0],q[1],1.2),c=lgCrystalMesh(1),from=S&&S.cr[i]&&S.cr[i].visible!==undefined?S.cr[i].position.clone():tip();scene.add(c);let bl=0;
        const B=W+i*ST,T=B+C,r=(q[2]??ev.r??LT_VO.r)/20;   // ชิ้นที่ i: รอที่ปลายไม้จนถึงคิว → แวบไปกลางวงของตัวเอง → หมุนกลางวงขณะวงเตือนนับ (ช้าแล้วเร็วขึ้น)
        LGV.fx.push({m:null,t:0,max:T,fn:k=>{const tt=k*T;
          if(tt<B){const e=Math.min(1,tt/W),tp=tip(),a=Math.PI*2*(tt/W)+i*2.1,rr=0.25*(1-e)+(e>=1?0.32:0);c.position.copy(from).lerp(tp,e*e).add(new THREE.Vector3(Math.cos(a)*rr,0.05*i,Math.sin(a)*rr));c.scale.setScalar(1);c.rotation.y=a;}   // รอคิว: วนรอบปลายไม้
          else{if(!bl){bl=1;lgBlip(tip(),b.clone());fxPlay('light/volley_warn',{x:q[0],y:q[1],h:0,p:{r,t:C},aim:false});}
            const u=(tt-B)/C;c.visible=tt>B+0.05;c.position.copy(b).add(new THREE.Vector3(0,0.12*Math.sin(u*Math.PI*2),0));c.scale.setScalar(2.6+0.6*u);c.rotation.y=3*u+14*u*u;}},
          end:()=>scene.remove(c)});});
      if(near)snd('cast_pull',ev);return true;}
    case 'lgvolboom':{   // ระเบิด: เสาแสง + เศษคริสตัล + คลื่นพื้น • คริสตัลบินโค้งกลับหาเราช้า ๆ (~0.8 วิ)
      const r=(ev.r||150)/20,o=PM3.get(ev.id);
      for(const q of ev.pts||[]){fxPlay('light/volley_boom',{x:q[0],y:q[1],h:0,p:{r},aim:false});
        const a=lgWorld(q[0],q[1],1.2),c=lgCrystalMesh(1);scene.add(c);
        LGV.fx.push({m:null,t:0,max:LT_VO.back,fn:k=>{const b=o?o.g.position.clone().add(new THREE.Vector3(0,1.45,0)):lgWorld(x,y,1.45),e=k*k*(3-2*k);c.position.copy(a).lerp(b,e);c.position.y+=Math.sin(k*Math.PI)*1.2;c.rotation.y+=0.2;c.scale.setScalar(0.4+0.6*Math.min(1,k*3));},end:()=>scene.remove(c)});}
      if(near){snd('boom',ev);shake(3);}return true;}
    case 'lgemp':{const o=PM3.get(ev.id);if(o){o.empT=0;o.empOn=1;o.empB=0;}   // ท่า/เอฟเฟกต์ทำต่อใน lightFX (lgEmpPose)
      if(ev.t!=null){const S=lgState(ev.t);lgAllyEmpEnd(S);S.allyEmpPending=ev;later(0.4,()=>{
        if(S.allyEmpPending!==ev)return;
        S.allyEmpPending=null;const a=PM3.get(ev.t);if(!a||LT_EM.t<=0.4)return;
        const P=a.g.position,x=P.x/S3+MW/2,y=P.z/S3+MH/2;
        fxPlay('light/crystal_in',{x,y,h:1.5,aim:false});
        S.allyEmpAura=fxPlay('light/emp_aura',{x,y,h:0,follow:ev.t,p:{t:LT_EM.t-0.4},aim:false});
      });}
      if(near)snd('buff',ev);return true;}
    case 'lgempend':{const S=LGV.st.get(ev.id);if(S)lgAllyEmpEnd(S);return true;}
    case 'lgbolt':{   // Empower: เศษคริสตัลแสงเล็กพุ่งโค้งมีหางทองไปหาศัตรู → แตกประกาย
      const a=lgWorld(x,y,ev.h||1.6),b=lgWorld(ev.x2,ev.y2,ev.h2||1.2),c=lgCrystalMesh(0.55);scene.add(c);
      const side=new THREE.Vector3(-(b.z-a.z),0,b.x-a.x).normalize().multiplyScalar((Math.random()<0.5?-1:1)*(0.6+Math.random()*0.6)),pts=[];
      const tr=lgTube(lgBeamMat(),1);tr.visible=false;
      LGV.fx.push({m:null,t:0,max:0.28,fn:k=>{const P=a.clone().lerp(b,k).addScaledVector(side,Math.sin(k*Math.PI)).add(new THREE.Vector3(0,Math.sin(k*Math.PI)*0.4,0));c.position.copy(P);c.rotation.y+=0.5;
        pts.push(P.clone());if(pts.length>4)pts.shift();if(pts.length>1){tr.visible=true;lgAim(tr,pts[0],P);tr.scale.x=tr.scale.y=0.035;}},
        end:()=>{scene.remove(c);scene.remove(tr);fxPlay('light/bolt_hit',{x:ev.x2,y:ev.y2,h:ev.h2||1.2,aim:false});}});return true;}
    case 'lgsan':{   // Sanctum: ชี้ไม้ลงจุด → คริสตัลพุ่งโค้งมีหางปักพื้น → แรงกระแทก (คริสตัลนีออนใหญ่ลอยขึ้นใน lightFX)
      const o=PM3.get(ev.id);if(o)castStart(o,'line');const a=o&&o.tip?o.tip.getWorldPosition(new THREE.Vector3()):lgWorld(x,y,1.4);
      lgArcFx(a,lgWorld(x,y,0.1),0.42,2.2,()=>{fxPlay('light/san_plant',{x,y,h:0,aim:false});if(near)shake(0.15);});if(near)snd('buff',ev);return true;}
    case 'lgsanheal':for(const id of ev.ids||[]){const o=PM3.get(id);if(o)fxPlay('light/heal_tick',{x:o.g.position.x/S3+MW/2,y:o.g.position.z/S3+MH/2,h:0,follow:id,p:{c:Math.min(1.6,0.6+0.35*(ev.n||1))},aim:false});}return true;
    case 'lgsanend':{   // จบ/เรียกคืน: คริสตัลใหญ่แตกเป็นแสง • คริสตัลที่วนอยู่แวบกลับหาเรา
      fxPlay('light/san_end',{x,y,h:0,aim:false});const S=LGV.st.get(ev.id),o=PM3.get(ev.id);
      if(S&&S.sanO&&o){S.sanO.forEach((c,i)=>{if(!c.visible)return;const from=c.position.clone(),to=o.g.position.clone().add(new THREE.Vector3(Math.cos(i*2.1),1.45,Math.sin(i*2.1)));later(0.05+i*0.06,()=>lgBlip(from,to));});}
      return true;}
    case 'lgveil':{const o=PM3.get(ev.id);if(o){o.stOn=1;o.stT=0;o.stF=0;o.stEv={x,y,r:ev.r};}else later(LT_VS_RELEASE,()=>lgArcFx(lgWorld(x,y,1.4),lgWorld(x,y,0.4),LT_VS_TRAVEL,1.5));if(near)snd('cast_pull',ev);return true;}
    case 'lgoh':{const S=LGV.st.get(ev.id);if(S)for(const c of S.cr)if(c.visible){const P=c.position,x=P.x/S3+MW/2,y=P.z/S3+MH/2;burst(x,y,'#ffb347',8,120,0.45,2.6,{h:P.y,vh:[0.5,3],g:2});burst(x,y,'#9a8a78',4,40,0.7,4,{h:P.y,vh:[1,2],g:-1});}
      if(ev.id===NET.myId)shake(0.15);break;}
    case 'lgveilhit':for(const id of ev.ids||[]){const o=PM3.get(id);if(o)fxPlay('light/bolt_hit',{x:o.g.position.x/S3+MW/2,y:o.g.position.z/S3+MH/2,h:1,s:0.7,aim:false});}return true;
    case 'lgveilarm':if(near)snd('buff',ev);return true;
    case 'lgveilboom':{const P=lgWorld(x,y,0),col=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.8,6,24,1,true),new THREE.MeshBasicMaterial({color:hdr('#fff1c0',2),transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
      col.position.copy(P).add(new THREE.Vector3(0,3,0));scene.add(col);LGV.fx.push({m:null,t:0,max:0.5,fn:k=>{col.material.opacity=0.8*(1-k);col.scale.set(1+k,1,1+k);},end:()=>scene.remove(col)});
      ring(x,y,'#ffd36a',ev.r||200,0.4,0.1);burst(x,y,'#ffe9a8',24,260,0.5,2.4,{h:1,g:1});if(near){snd('boom',ev);shake(4);}return true;}
    case 'lgstep':{   // Light Step: แตกเป็นเศษแสง → ก้อนแสงพุ่ง 0.15 วิ (มีหาง) → รวมร่างที่จุดใหม่
      const S=ev.id!=null&&lgState(ev.id),h2=ev.h2??H;
      if(S){S.step={t0:LGV.now||performance.now(),x,y,a0:lgWorld(x,y,H),a:lgWorld(x,y,H+1.1),b:lgWorld(ev.x2,ev.y2,h2+1.1),x2:ev.x2,y2:ev.y2,h:H,h2,air:!!ev.air,inD:0};}
      if(near)snd('whoosh',ev);return true;}
    case 'lgstepboom':later(LGSH.stepOut+LGSH.stepHide,()=>{fxPlay('light/step_boom',{x,y,h:H,gh:H,p:{r:(ev.r||150)/20},aim:false});if(near)shake(2);});return true;
    case 'lgultneed':if(ev.id===NET.myId)toast('ลิงก์คู่หูด้วย Crystal Bond ก่อนใช้ Radiant Sovereign');return true;
    case 'lgult':ring(x,y,'#ffc861',45,.52,H+.06);FX.flashSprite(x,y,H+1.6,'#fff1c0',.4,2.3,.22,1.8);if(near)snd('buff',ev);return true;
    case 'lgultform':
      lgSovereignArrival(lgWorld(x,y,H+1.10));
      FX.flashSprite(x,y,H+1.10,'#fff1c0',.32,2.55,.18,1.4);
      burst(x,y,'#ffcd68',28,186,.54,1.8,{h:H+1.10,g:0});return true;
    case 'lgultend':
      if(Number.isFinite(ev.x2))lgBlip(lgWorld(ev.x2,ev.y2,ev.h2+1),lgWorld(x,y,H+1));
      FX.flashSprite(x,y,H+1.1,'#ffe895',.24,1.75,.14,1.5);return true;
    case 'lgultstrike':{
      const a=lgWorld(x,y,H),b=lgWorld(ev.x2,ev.y2,ev.h2),ray=lgSovereignChestBeam();
      const duration=ev.t||LT_UL.finishRelease;
      const impactDuration=duration+LT_UL.finishDelay;
      const sovereign=LGV.st.get(ev.id)?.sovereign,origin=new THREE.Vector3();
      lgAim(ray,a,b);ray.visible=ray.scale.z>.045;
      const uniforms=ray.material.uniforms;
      uniforms.span.value=Math.max(.05,ray.scale.z);
      ray.scale.x=ray.scale.y=.94;
      LGV.fx.push({t:0,max:duration,fresh:true,fn:k=>{
        if(sovereign?.channeling)lgAim(ray,sovereign.heart.getWorldPosition(origin),b);
        uniforms.span.value=Math.max(.05,ray.scale.z);uniforms.age.value=k*duration;
        uniforms.fade.value=1-THREE.MathUtils.smoothstep(k,.9,1);
        ray.scale.x=ray.scale.y=(.73+.21*Math.exp(-k*15))*(1-.79*THREE.MathUtils.smoothstep(k,.91,1));
      },end:()=>disposeObj(ray)});
      burst(x,y,'#fff0a7',24,174,.31,1.75,{h:H,g:0});
      if(ev.ground){
        dfCracks(ev.x2,ev.y2,ev.h2+.026,66,'#ffbe43',impactDuration+.08);
        burst(ev.x2,ev.y2,'#917d61',10,58,.33,2.1,{h:ev.h2+.05,vh:[.6,1.65],g:8});
      }
      lgImpactDome(ev.x2,ev.y2,ev.h2,1.44,impactDuration);
      return true;
    }
    case 'lgultboom':{
      const radius=ev.r*S3,duration=1.05;
      lgImpactDome(x,y,H,radius,duration,'blast');
      lgImpactDome(x,y,H,radius*.71,duration,'inner');
      const floorH=groundH(x,y,H);
      if(Math.abs(H-floorH)<3.5)lgBlastFloor(x,y,floorH,radius,duration+.22);
      lgBlastThreads(x,y,H,radius,duration);
      FX.flashSprite(x,y,H+.42,'#fff1c0',.36,3.3,.19,2.45);
      burst(x,y,'#ffcf55',66,354,.89,2.5,{h:H+.32,vh:[1.7,8],g:9});
      burst(x,y,'#fff0ac',28,226,.76,1.6,{h:H+.55,vh:[3,10],g:8});
      if(near)snd('boom',ev);return true;
    }
  }
  return false;
}

// หัวหันไปทางเล็ง: ตั้งแบบค่าสัมบูรณ์ทุกเฟรม (กระดูกหัวใน idle เป็นค่าคงที่ mixer ไม่เขียนซ้ำ → ถ้าใช้ += หัวจะหมุนสะสม)
const _lgHq=new THREE.Quaternion(),_lgHy=new THREE.Vector3(0,1,0);
// ตัวละครปกติ (ไม่ใช่ไฟล์โมเดล): หัว/ตา/ผม/หมวกติดกับลำตัวตรง ๆ ไม่มีกระดูกหัว → ครั้งแรกย้ายชิ้นที่สูงกว่าคอเข้ากลุ่ม pivot ที่คอ แล้วหมุนกลุ่มนั้น (ผู้ใช้ 2026-11-17 "ทำไมหัวไม่หันไปทางเล็ง")
function lgProcHead(o){
  if(o.lgHG===undefined){o.lgHG=null;const b=o.b;if(!b)return;const Y=1.68,P0=1.66,H=new THREE.Group();H.position.set(0,P0,0);let got=0;
    for(const c of [...b.children]){if(c===o.armR||c===o.armL||c.userData.anim)continue;
      if(c.position.y>=Y){b.remove(c);c.position.y-=P0;H.add(c);got++;continue;}
      if(!c.isMesh||c.position.lengthSq()>1e-6||c.rotation.x||c.rotation.y||c.rotation.z)continue;   // ชิ้นที่ mergeBody รวมไว้ (ตำแหน่ง 0) → แยกสามเหลี่ยมที่อยู่สูงกว่าคอออกมา
      const g0=c.geometry.index?c.geometry.toNonIndexed():c.geometry,pa=g0.attributes.position,n=pa.count/3,keep=[],head=[];
      for(let t=0;t<n;t++){const hi=pa.getY(t*3)>=Y&&pa.getY(t*3+1)>=Y&&pa.getY(t*3+2)>=Y;(hi?head:keep).push(t);}
      if(!head.length){if(g0!==c.geometry)g0.dispose();continue;}
      const pick=(ts,dy)=>{const g=new THREE.BufferGeometry();for(const k of Object.keys(g0.attributes)){const A=g0.attributes[k],sz=A.itemSize,arr=new A.array.constructor(ts.length*3*sz);
        ts.forEach((t,i)=>{for(let v=0;v<3;v++)for(let j=0;j<sz;j++)arr[(i*3+v)*sz+j]=A.array[(t*3+v)*sz+j];});g.setAttribute(k,new THREE.BufferAttribute(arr,sz));}
        if(dy)g.translate(0,dy,0);g.computeBoundingSphere();return g;};
      const hm=new THREE.Mesh(pick(head,-P0),c.material);hm.castShadow=c.castShadow;hm.receiveShadow=c.receiveShadow;H.add(hm);
      const old=c.geometry;c.geometry=pick(keep,0);old.dispose();if(g0!==old)g0.dispose();got++;}
    if(!got)return;b.add(H);o.lgHG=H;}
  if(!o.lgHG)return;o.lgHG.rotation.y=o.lgHeadYaw||0;}
function lightHeadPose(o){
  if(!o.fileModel){lgProcHead(o);return;}
  const hb=o.fileModel&&(o.lgHead!==undefined?o.lgHead:(o.lgHead=o.fileModel.getObjectByName('head')||null));if(!hb)return;
  if(o.lgHeadSet&&hb.quaternion.equals(o.lgHeadSet))hb.quaternion.copy(o.lgHeadBase);   // mixer ไม่ได้เขียนทับ = คืนค่าเดิมก่อน
  const y=o.lgHeadYaw||0;if(Math.abs(y)<0.005){o.lgHeadSet=null;return;}
  o.lgHeadBase=(o.lgHeadBase||new THREE.Quaternion()).copy(hb.quaternion);
  hb.quaternion.multiply(_lgHq.setFromAxisAngle(_lgHy,y));o.lgHeadSet=(o.lgHeadSet||new THREE.Quaternion()).copy(hb.quaternion);}
// เกจร้อน BA รอบเป้าเล็ง (ผู้ใช้ 2026-11-17): โค้งด้านล่างเป้า ทอง→ส้ม→แดงตามความร้อน • ร้อนเกิน = แดงกะพริบ ลดลงจนชาร์จเสร็จ
const LGHUD={h:0,a:0,e:0};   // e = เพิ่งหมด Empower: เกจไหลลงช้า ๆ ให้เห็น
function drawLightHud(x,y,L){
  const emp=(L[5]|0)===1,tgt=emp?1:(L[16]||0)/100,oh=(L[17]|0)===1,dt=1/60;if(LGHUD.em&&!emp)LGHUD.e=1;LGHUD.em=emp;if(emp||LGHUD.h<0.02)LGHUD.e=0;   // Empower (ผู้ใช้ 2026-11-18): เกจเต็มมีแสงไหล ไม่ร้อน • หมดบัฟ = เกจลดลงจนเป็น 0
  LGHUD.h+=(tgt-LGHUD.h)*Math.min(1,dt*(LGHUD.e&&tgt<LGHUD.h?2.2:12));
  LGHUD.a=clamp(LGHUD.a+((LGHUD.h>0.01||oh||emp)?dt/0.15:-dt/0.4),0,1);if(LGHUD.a<=0)return;
  const h=LGHUD.h,R=112,cX=x-52,lo=0.47,hi=-0.47,sp=lo-hi,T=performance.now();   // โค้งด้านขวาเป้า ห่างออกมา (ผู้ใช้ 2026-11-17) • ธีมแสง: ทองเรือง + แกนขาว • เปลี่ยนสีแค่ใกล้เต็ม/ร้อนเกิน
  const P=t=>[cX+Math.cos(t)*R,y+Math.sin(t)*R],dia=(t,r,c)=>{const [px,py]=P(t);cx.fillStyle=c;cx.beginPath();cx.moveTo(px,py-r*1.6);cx.lineTo(px+r,py);cx.lineTo(px,py+r*1.6);cx.lineTo(px-r,py);cx.closePath();cx.fill();};
  cx.save();cx.globalAlpha=LGHUD.a;cx.lineCap='round';
  cx.strokeStyle='rgba(20,14,4,0.45)';cx.lineWidth=7;cx.beginPath();cx.arc(cX,y,R,hi,lo);cx.stroke();
  cx.strokeStyle='rgba(255,226,150,0.28)';cx.lineWidth=1.2;cx.beginPath();cx.arc(cX,y,R,hi,lo);cx.stroke();
  const col=oh?`rgb(255,${70+40*Math.sin(T/80)},50)`:h<0.85?'#ffd36a':'#ffa03a';
  if(h>0.005){const t0=lo-sp*h;cx.shadowColor=col;cx.shadowBlur=oh?14:10;
    cx.strokeStyle=col;cx.lineWidth=4.5;cx.beginPath();cx.arc(cX,y,R,t0,lo);cx.stroke();
    cx.shadowBlur=0;cx.strokeStyle=oh?'rgba(255,220,200,0.9)':'rgba(255,250,230,0.95)';cx.lineWidth=1.6;cx.beginPath();cx.arc(cX,y,R,t0,lo);cx.stroke();
    if(emp){const N=28;for(let k=0;k<N;k++){const a0=lo-sp*k/N,a1=lo-sp*(k+1)/N,w=0.5+0.5*Math.sin(k*0.4-T/320);cx.strokeStyle=`rgba(255,${212+30*w},${70+70*w},1)`;cx.shadowColor=w>0.5?'#ffe680':'#ffc93a';cx.shadowBlur=14+10*w;cx.lineWidth=5;cx.beginPath();cx.arc(cX,y,R,a1,a0);cx.stroke();}cx.shadowBlur=0;}   // แสงไหลไปตามเกจตอน Empower
    cx.shadowColor=col;cx.shadowBlur=12;dia(t0,3.2+0.8*Math.sin(T/90),'#fffbe8');}   // ประกายเพชรที่ปลายเกจ
  cx.shadowBlur=0;dia(lo,2.6,'rgba(255,226,150,0.7)');   // คริสตัลเล็กปิดท้ายล่าง
  {const [ex,ey]=P(hi),tg=hi-Math.PI/2,c1=oh?'rgba(255,170,140,0.95)':'rgba(255,244,205,0.95)';cx.save();cx.shadowColor=oh?'#ff6a3a':'#ffd36a';cx.shadowBlur=8;cx.fillStyle=c1;   // ปลายบนด้านนอก (ผู้ใช้ 2026-11-17): เศษคริสตัลยื่นต่อจากปลาย + ดาวแสง 4 แฉกลอยเหนือขึ้นไป
    cx.translate(ex,ey);cx.rotate(tg);cx.beginPath();cx.moveTo(0,-2.6);cx.lineTo(9,0);cx.lineTo(0,2.6);cx.lineTo(-1.5,0);cx.closePath();cx.fill();cx.restore();
    const [tx,ty]=P(hi-0.128),r=4.2+0.5*Math.sin(T/260);cx.save();cx.translate(tx,ty);cx.rotate(T/1400);cx.shadowColor=oh?'#ff6a3a':'#ffd36a';cx.shadowBlur=8;cx.fillStyle=c1;
    cx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,q=i%2?r*0.32:r;cx.lineTo(Math.cos(a)*q,Math.sin(a)*q);}cx.closePath();cx.fill();cx.restore();}
  cx.restore();}
