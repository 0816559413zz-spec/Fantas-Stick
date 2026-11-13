// =====================================================================
//  ภาพแผนที่ First Castle Strike (แบบ Basic: กล่อง/ทรงพื้นฐาน ยังไม่มีโมเดลจริง) + ภาพ/HUD โหมดบุกปราสาท
//  ฉากนิ่ง buildFcs (รวม batch ได้) • ของที่เปลี่ยนสถานะ (แกน, กำแพงพังได้, ประตู, ขอบพื้นที่เฟส, ลำแสงร่าย) = sgSync ใน scene (ไม่โดน batch)
// =====================================================================
const FCSFB=[];   // กล่องสำรอง (กำแพงเตี้ย/รั้ว/ลัง/เสา) ระหว่างรอชุดตกแต่งโหลด
function buildFcs(){FCSFB.length=0;
  const M=MAPS.fcs,F=M.fcs,D=FCS_DATA,C=FCS_C,T=TERR,c3=C*S3;
  scene.fog.color.set('#c9b8a0');scene.fog.near=120;scene.fog.far=480;
  const PT=typeof paintOn==='function'&&paintOn('fcs');if(PT){const f=PAINT.maps.fcs.fog;scene.fog.color.set(f[0]);scene.fog.near=f[1];scene.fog.far=f[2];}
  hemi.color.set('#ffe6c8');hemi.groundColor.set('#4a5a3a');hemi.intensity=0.8;moonL.intensity=1.45;moonL.color.set('#fff0dc');
  const surf=(i,j)=>parseInt(D.S[clamp(Math.floor(j/2),0,D.h-1)*D.w+clamp(Math.floor(i/2),0,D.w-1)],36);
  // พื้น: หญ้าทั้งแผนที่ + พื้นหินปราสาททับตรงช่องพื้นผิวหิน
  const gm=grLive(new THREE.MeshStandardMaterial({map:grassTex('#4f7a38',23,1),roughness:0.95}));
  const gr=new THREE.Mesh(terrGeo((i,j)=>T.g[j*T.nx+i],T.nx,T.ny,T.c,1),gm);gr.receiveShadow=true;addW(gr);
  const fl=new THREE.Mesh(terrGeo((i,j)=>{const a=[[i,j],[i-1,j],[i,j-1],[i-1,j-1]].every(([a,b])=>surf(Math.max(0,a),Math.max(0,b))===2);return a?T.g[j*T.nx+i]+0.03:NaN;},T.nx,T.ny,T.c,1),stoneMat(1,1,'#a8a294'));fl.receiveShadow=true;addW(fl);
  // กำแพงจากตาราง (InstancedMesh ต่อชนิด)
  const m4=new THREE.Matrix4(),cells=[[],[],[],[]];
  for(let y=0;y<D.h;y++)for(let x=0;x<D.w;x++){const v=parseInt(D.W[y*D.w+x],36);if(v)cells[v].push([x,y]);}
  const inst=(geo,mat,list,fn)=>{if(!list.length)return;const im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach((q,i)=>im.setMatrixAt(i,fn(q)));im.castShadow=im.receiveShadow=true;addW(im);return im;};
  const box=sGeo(THREE.BoxGeometry,1,1,1);
  inst(box,stoneMat(1,1,'#a89e8c'),cells[1],([x,y])=>{const px=(x+0.5)*C,py=(y+0.5)*C,b=GY(px,py);return m4.makeScale(c3,FCS_WH[1],c3).setPosition(tx(px),b+FCS_WH[1]/2,tz(py)).clone();});
  FCSFB.push(inst(box,stoneMat(1,1,'#9a8a6a'),cells[2],([x,y])=>{const px=(x+0.5)*C,py=(y+0.5)*C,b=GY(px,py);return m4.makeScale(c3,FCS_WH[2],c3).setPosition(tx(px),b+FCS_WH[2]/2,tz(py)).clone();}));
  FCSFB.push(inst(box,new THREE.MeshStandardMaterial({color:'#5a4030',roughness:0.9}),cells[3],([x,y])=>{const px=(x+0.5)*C,py=(y+0.5)*C,b=GY(px,py);return m4.makeScale(c3*0.3,FCS_WH[3],c3*0.3).setPosition(tx(px),b+FCS_WH[3]/2,tz(py)).clone();}));
  fcsKitLoad(F,cells);   // ชุดตกแต่งจาก Blender (assets/fcs/fcs_kit.glb) — มาแล้วแทนกล่องสำรอง FCSFB
  // ต้นไม้ / ลัง / เสา
  const P=k=>F.props.filter(q=>q[0]===k);
  fcsTreesBuild(F);   // ต้นไม้ทีละต้น (หักล้มได้ — ดู sgTreesView)
  FCSFB.push(inst(box,new THREE.MeshStandardMaterial({color:'#8a6238',roughness:0.85}),P('cr'),([,x,y])=>m4.makeScale(1.25,1.2,1.25).setPosition(tx(x),GY(x,y)+0.6,tz(y)).clone()));
  FCSFB.push(inst(sGeo(THREE.CylinderGeometry,0.65,0.75,1,10),stoneMat(1,1,'#bdb5a5'),P('pl'),([,x,y])=>m4.makeScale(1,6,1).setPosition(tx(x),GY(x,y)+3,tz(y)).clone()));
  // แท่นจุดเกิด (สีทีม)
  for(const [t,L] of [[0,F.sp.A],[1,F.sp.B]])for(const k in L){const s=L[k],m=new THREE.Mesh(new THREE.CircleGeometry(SG_SPR*S3,32),new THREE.MeshBasicMaterial({color:TEAMC[t],transparent:true,opacity:0.18,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(tx(s.x),GY(s.x,s.y)+0.05,tz(s.y));addW(m);}
  if(PT)fcsPaint(gm);   // ลุคภาพวาด: ลายพู่กันทุกวัสดุ + หญ้าโดนแดด (js/77)
}
// ---------- ภาพโหมด (ลูกข่ายทุกเครื่องจาก snapshot M.sg) ----------
const SGV3={g:null,cores:[],bw:[],bar:null,barK:'',beams:new Map(),bwK:''};
function sgClearView(){if(SGV3.g){scene.remove(SGV3.g);disposeTree(SGV3.g);}SGV3.g=null;SGV3.cores=[];SGV3.bw=[];SGV3.bar=null;SGV3.barK='';SGV3.bwK='';SGV3.beams.clear();}
function sgViewBuild(){
  sgClearView();const F=MAPS.fcs.fcs,g=new THREE.Group();scene.add(g);SGV3.g=g;
  F.cores.forEach((k,i)=>{const o=new THREE.Group();o.position.set(tx(k.x),GY(k.x,k.y),tz(k.y));g.add(o);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.4,0.6,8),stoneMat(1,1,'#6a6258'));base.position.y=0.3;base.castShadow=true;o.add(base);
    const cm=new THREE.MeshStandardMaterial({color:'#9fd8ff',emissive:'#3a8cff',emissiveIntensity:1.2,roughness:0.2,transparent:true,opacity:0.92});
    const cr=new THREE.Mesh(new THREE.OctahedronGeometry(0.9,0),cm);cr.scale.set(1,2,1);cr.position.y=2.4;o.add(cr);
    const glow=new THREE.Sprite(glowMat('#7fc0ff',1.4));glow.scale.setScalar(4);glow.position.y=2.4;o.add(glow);
    const ring=new THREE.Mesh(new THREE.RingGeometry(SGVZR()*S3-0.25,SGVZR()*S3,64),new THREE.MeshBasicMaterial({color:'#7fc0ff',transparent:true,opacity:0.5,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=0.08;o.add(ring);
    const rub=new THREE.Group();for(let q=0;q<6;q++){const m=new THREE.Mesh(sGeo(THREE.OctahedronGeometry,0.4,0),cm);m.position.set(Math.cos(q)*0.9,0.7,Math.sin(q*1.7)*0.9);m.rotation.set(q,q*2,0);rub.add(m);}rub.visible=false;o.add(rub);
    for(const ch of [base,cr,glow,rub]){ch.scale.multiplyScalar(1.8);ch.position.y*=1.8;}   // แมพขยาย 3 เท่า → แกนใหญ่ขึ้นให้เห็นจากไกล
    SGV3.cores.push({o,cr,cm,glow,ring,rub});});
  F.bw.forEach((b,i)=>{const cx=b.x+b.w/2,cy=b.y+b.d/2,o=new THREE.Group();o.position.set(tx(cx),GY(cx,cy),tz(cy));g.add(o);
    if(b.k==='gate'){const n=Math.max(2,Math.round(Math.max(b.w,b.d)/20)),horiz=b.w>=b.d;
      for(let q=0;q<n;q++){const t=(q+0.5)/n-0.5,m=new THREE.Mesh(sGeo(THREE.BoxGeometry,0.18,1,0.18),new THREE.MeshStandardMaterial({color:'#3a3a40',metalness:0.6,roughness:0.5}));m.scale.y=b.h;m.position.set(horiz?t*b.w*S3:0,b.h/2,horiz?0:t*b.d*S3);m.castShadow=true;o.add(m);}
      const top=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,0.3,1),new THREE.MeshStandardMaterial({color:'#4a4040',metalness:0.5}));top.scale.set(Math.max(0.3,b.w*S3),1,Math.max(0.3,b.d*S3));top.position.y=b.h;o.add(top);}
    else{const m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),stoneMat(1,1,'#b08a60'));m.scale.set(b.w*S3,b.h,b.d*S3);m.position.y=b.h/2;m.castShadow=m.receiveShadow=true;o.add(m);
      const cr=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),new THREE.MeshBasicMaterial({color:'#ffcf6a',transparent:true,opacity:0.18,depthWrite:false}));cr.scale.set(b.w*S3+0.08,b.h+0.08,b.d*S3+0.08);cr.position.y=b.h/2;o.add(cr);}   // ขอบสีทอง = พังได้
    SGV3.bw.push(o);});
}
function SGVZR(){return (VIEW.cur&&VIEW.cur.M&&VIEW.cur.M.sg&&VIEW.cur.M.sg.zr)||150;}
// ขอบพื้นที่เล่นของเฟส: ม่านโปร่งบาง ๆ ตามเส้นขอบรวมของทุกกรอบ
function sgBarrier(ph){
  if(SGV3.barK===ph+'')return;SGV3.barK=ph+'';
  if(SGV3.bar){SGV3.g.remove(SGV3.bar);disposeTree(SGV3.bar);SGV3.bar=null;}
  const A=sgArea(ph),R=A.rects,ins=(x,y)=>R.some(q=>x>=q.x1&&x<=q.x2&&y>=q.y1&&y<=q.y2),step=FCS_C,pos=[],H=5;
  const seg=(x0,y0,x1,y1)=>{const b0=GY(x0,y0),b1=GY(x1,y1);pos.push(tx(x0),b0,tz(y0),tx(x1),b1,tz(y1),tx(x1),b1+H,tz(y1),tx(x0),b0,tz(y0),tx(x1),b1+H,tz(y1),tx(x0),b0+H,tz(y0));};
  for(const q of R){
    for(let x=q.x1;x<q.x2;x+=step){for(const [y,o] of [[q.y1,-2],[q.y2,2]]){const mx=x+step/2;if(y<=2||y>=MH-2)continue;if(!ins(mx,y+o))seg(x,y,x+step,y);}}
    for(let y=q.y1;y<q.y2;y+=step){for(const [x,o] of [[q.x1,-2],[q.x2,2]]){const my=y+step/2;if(x<=2||x>=MW-2)continue;if(!ins(x+o,my))seg(x,y,x,y+step);}}
  }
  if(!pos.length)return;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));
  const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:'#ffd27a',transparent:true,opacity:0.13,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  SGV3.bar=m;SGV3.g.add(m);
}
function sgSync(v,P,me,now,dt){
  const S=v.M&&v.M.sg;
  if(v.mode!=='siege'||!S||MAPID!=='fcs'){if(SGV3.g)sgClearView();return;}
  SGPH=S.ph;
  if(!SGV3.g)sgViewBuild();
  sgBarrier(S.ph);
  SGV3.cores.forEach((c,i)=>{const n=i+1,dead=S.hp[i]<=0,act=n===S.ph,fut=n>S.ph;
    c.cr.visible=c.glow.visible=!dead;c.rub.visible=dead;c.ring.visible=act;
    c.cr.rotation.y+=dt*(act?1.2:0.3);c.cr.position.y=4.3+Math.sin(now/600+i)*0.25;
    const hit=act&&S.atk,col=hit?'#ff6a5a':fut?'#5a6a80':'#9fd8ff';c.cm.color.set(col);c.cm.emissive.set(hit?'#ff2a1a':fut?'#1a2030':'#3a8cff');
    c.ring.material.color.set(hit?'#ff6a5a':S.def?'#ffb060':'#7fc0ff');c.ring.material.opacity=0.35+0.25*Math.sin(now/(hit?120:400));});
  sgTreesView(S,dt);   // ต้นไม้หักล้ม
  if(S.bw!==SGV3.bwK){const old=SGV3.bwK;SGV3.bwK=S.bw;SGV3.bw.forEach((o,i)=>{o.visible=S.bw[i]!=='1';if(old&&old[i]!=='1'&&S.bw[i]==='1')sgDust(o.position);});gl.shadowMap.needsUpdate=true;}
  // ลำแสงร่าย: จากมือคนร่ายไปยอดแกน
  const k=MAPS.fcs.fcs.cores[S.ph-1],seen=new Set();
  if(k)for(const p of P){if(!p.sc||!p.al)continue;seen.add(p.id);let b=SGV3.beams.get(p.id);
    if(!b){b=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.12,1,6,1,true),new THREE.MeshBasicMaterial({color:hdr('#8fd0ff',2),transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false}));SGV3.g.add(b);SGV3.beams.set(p.id,b);}
    const a=new THREE.Vector3(tx(p.x),GY(p.x,p.y)+(p.z||0)+1.3,tz(p.y)),e=new THREE.Vector3(tx(k.x),GY(k.x,k.y)+4.3,tz(k.y)),d=e.clone().sub(a),L=d.length();
    b.position.copy(a).addScaledVector(d,0.5);b.scale.set(1,L,1);b.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());b.material.opacity=0.55+0.3*Math.sin(now/70+p.x);
    if(Math.random()<0.4)PARTS.push({x:k.x+rnd(-14,14),y:k.y+rnd(-14,14),h:GY(k.x,k.y)+4.3+rnd(-0.8,0.8),vx:rnd(-40,40),vy:rnd(-40,40),vh:rnd(0.5,2),life:0.5,max:0.5,col:'#9fd8ff',size:1.6,g:0});}
  for(const [id,b] of SGV3.beams)if(!seen.has(id)){SGV3.g.remove(b);b.geometry.dispose();b.material.dispose();SGV3.beams.delete(id);}
}
function sgDust(pos){const x=pos.x*20+MW/2,y=pos.z*20+MH/2;for(let i=0;i<26;i++)PARTS.push({x:x+rnd(-40,40),y:y+rnd(-40,40),h:rnd(0.3,4),vx:rnd(-60,60),vy:rnd(-60,60),vh:rnd(0.5,3),life:1.4,max:1.4,col:'#b8a488',size:rnd(3,6),g:0,smoke:true,grow:1});}
function sgFx(ev){
  const me=myPos(),near=!me||Math.hypot(ev.x-me.x,ev.y-me.y)<1400;
  if(ev.k==='sgwall'){if(near)snd('rubble',ev);}
  else if(ev.k==='sgcore'){for(let i=0;i<40;i++)PARTS.push({x:ev.x+rnd(-20,20),y:ev.y+rnd(-20,20),h:4.3,vx:rnd(-260,260),vy:rnd(-260,260),vh:rnd(1,7),life:1.1,max:1.1,col:'#9fd8ff',size:2.4,g:6});FX.flashLight(ev.x,ev.y,4.3,'#7fc0ff',6,30,0.6);snd('boom',ev);}
}
// ---------- HUD ----------
function sgTop(v){const S=v.M&&v.M.sg;if(!S)return '🏰 บุกปราสาท';const i=S.ph-1,pc=Math.ceil(S.hp[i]/S.mx*100);
  return `🏰 เฟส ${S.ph}/${S.n}   •   แกน ${S.ph} เหลือ ${pc}%   •   `+(S.pr>0?`เตรียมตัว ${S.pr} วิ`:S.ot?`⏱ ต่อเวลา! (ผ่อนผัน ${S.gr.toFixed(1)} วิ)`:`⏱ ${fmtTime(v.tm)}`);}
function sgHud(v,me,big){
  const S=v.M&&v.M.sg;if(!S||!me)return;
  const atk=me.tm===0,F=MAPS.fcs.fcs,k=F.cores[S.ph-1];
  // แถบเลือดแกนทั้ง 3 (ใต้แถบบน)
  const bw=Math.min(110,(SW-80)/S.n-10),x0=SW/2-(bw+10)*S.n/2;
  for(let i=0;i<S.n;i++){const x=x0+i*(bw+10),r=S.hp[i]/S.mx,act=i===S.ph-1;
    cx.fillStyle='rgba(8,10,20,0.7)';cx.fillRect(x,52,bw,12);cx.fillStyle=S.hp[i]<=0?'#555':act&&S.atk?'#ff6a5a':act?'#7fc0ff':'#4a5a70';cx.fillRect(x+1,53,(bw-2)*r,10);
    if(act){cx.strokeStyle=HG2;cx.lineWidth=1.5;cx.strokeRect(x-1,51,bw+2,14);}
    cx.font='600 11px Kanit,sans-serif';cx.textAlign='center';cx.fillStyle='#efe6cf';cx.fillText(S.hp[i]<=0?'แตกแล้ว':'แกน '+(i+1),x+bw/2,78);}
  cx.textAlign='center';
  big(`คุณเป็น${atk?SG_TEAM[0]:SG_TEAM[1]} (${TEAMN[me.tm]||''})`,96,14,atk?'#8fc8ff':'#ff9a9a');
  if(S.atk)big('⚠️ แกนกำลังถูกร่ายทำลาย',SH*0.2,18,'#ff8a7a');
  // เครื่องหมายแกนบนจอ
  if(k&&me.al){const s=toScreen(k.x,(GY(k.x,k.y)||0)+4,k.y),d=Math.round(Math.hypot(k.x-me.x,k.y-me.y)/20);
    if(s&&s[0]>30&&s[0]<SW-30&&s[1]>30&&s[1]<SH-30){cx.save();cx.translate(s[0],s[1]);cx.rotate(Math.PI/4);cx.strokeStyle=S.atk?'#ff6a5a':'#9fd8ff';cx.lineWidth=2.5;cx.strokeRect(-9,-9,18,18);cx.restore();
      cx.font='600 13px Kanit,sans-serif';cx.fillStyle='#efe6cf';cx.fillText(`แกน ${S.ph} • ${d} ม.`,s[0],s[1]-18);}}
  if(atk&&me.al&&S.pr<=0&&k){const inz=Math.hypot(me.x-k.x,me.y-k.y)<S.zr+PR;
    if(me.sc)big('🔮 กำลังร่ายทำลายแกน… (ยิง / โล่ / สกิล / พุ่ง = หยุด • G = หยุด)',SH-170,17,'#9fd8ff');
    else if(inz)big('กด G เพื่อร่ายทำลายแกน',SH-170,18,'#ffe9a8');}
  if(atk&&S.pr>0)big(`ฝ่ายรับกำลังเตรียมตัว — ประตูเปิดใน ${S.pr} วิ`,SH*0.36,22,'#ffe9a8');
  if(!atk&&S.pr>0)big(`เตรียมแนวป้องกัน — ฝ่ายบุกออกมาใน ${S.pr} วิ`,SH*0.36,22,'#ffe9a8');
}

// ---------- ต้นไม้หักล้มได้ (โหมดบุกปราสาท) ----------
// แต่ละต้น = กลุ่มที่โคน: top (ทั้งต้น หมุนรอบโคนตอนล้ม) + stump (ตอ โผล่ตอนหัก) • ลุคภาพวาด = ต้นไม้พู่กันจาก js/77
const FCT3={list:[],K:'',anim:[]};
function fcsTreesBuild(F){FCT3.list=[];FCT3.K='';FCT3.anim=[];
  const pt=typeof paintOn==='function'&&paintOn('fcs'),K=pt?paintKit():null;
  const trunk=new THREE.MeshStandardMaterial({color:'#5a3f28',roughness:0.95}),leaf=new THREE.MeshStandardMaterial({color:'#2f5a2a',roughness:0.9,flatShading:true});
  const stumpM=new THREE.MeshStandardMaterial({color:'#6a4a2e',roughness:0.95,flatShading:true}),woodM=new THREE.MeshStandardMaterial({color:'#d8b27a',roughness:0.9,flatShading:true});
  const stG=new THREE.CylinderGeometry(0.42,0.55,SGT.stump,9),cutG=new THREE.CylinderGeometry(0.36,0.42,0.16,9);
  F.trees.forEach((T,i)=>{const g=new THREE.Group(),b=GY(T.x,T.y);g.position.set(tx(T.x),b,tz(T.y));g.userData.noBatch=1;
    const top=new THREE.Group();g.add(top);
    if(K){const m=new THREE.Mesh(K.tree[(i*7+3)%K.tree.length],K.mat);m.castShadow=m.receiveShadow=true;const sc=0.72+((i*37)%10)/40;m.scale.setScalar(sc);m.rotation.y=i*2.39;top.add(m);}
    else{const t=new THREE.Mesh(sGeo(THREE.CylinderGeometry,0.22,0.32,1,7),trunk);t.scale.set(1,3,1);t.position.y=1.5;const c=new THREE.Mesh(sGeo(THREE.ConeGeometry,1.5,1,8),leaf);c.scale.set(1,4.5,1);c.position.y=4.6;for(const q of [t,c]){q.castShadow=true;top.add(q);}}
    const st=new THREE.Group();const s1=new THREE.Mesh(stG,stumpM);s1.position.y=SGT.stump/2;const s2=new THREE.Mesh(cutG,woodM);s2.position.y=SGT.stump+0.02;s2.rotation.z=0.25;st.add(s1,s2);st.visible=false;g.add(st);
    for(const q of [s1,s2])q.castShadow=true;
    addW(g);FCT3.list.push({g,top,st,b,x:T.x,y:T.y});});
}
// สถานะจาก snapshot (S.tr) → ที่ชน (sgTreesApply, ลูกข่าย) + ภาพล้ม: ช่วงแรกเอนช้า แล้วเร่งตามแรงโน้มถ่วง → กระแทกพื้นเด้งนิด ๆ
function sgTreesView(S,dt){
  const str=S.tr||'';if(str!==FCT3.K){const old=FCT3.K;sgTreesApply(str);
    FCT3.list.forEach((o,i)=>{const was=old[i]||'0',now=str[i]||'0';if(was===now)return;
      if(now==='0'){o.top.quaternion.identity();o.top.position.y=0;o.st.visible=false;FCT3.anim=FCT3.anim.filter(a=>a.o!==o);return;}
      const a=sgTreeDir(now),d=new THREE.Vector3(Math.cos(a),0,Math.sin(a));o.st.visible=true;o.top.position.y=SGT.stump;
      const fresh=!!old;   // เปิดเกมมาแล้วต้นล้มอยู่แล้ว = นอนเลย ไม่เล่นท่าล้ม
      FCT3.anim.push({o,ax:new THREE.Vector3(d.z,0,-d.x),d,t:fresh?0:9,hit:!fresh});
      if(fresh){const me=myPos(),near=!me||Math.hypot(o.x-me.x,o.y-me.y)<1400;if(near)snd('break',{x:o.x,y:o.y});
        for(let k=0;k<22;k++)PARTS.push({x:o.x+rnd(-8,8),y:o.y+rnd(-8,8),h:o.b+SGT.stump+rnd(0,0.3),vx:rnd(-160,160)+d.x*120,vy:rnd(-160,160)+d.z*120,vh:rnd(1,5),life:0.8,max:0.8,col:k%3?'#d8b27a':'#6a4a2e',size:rnd(1.2,2.2),g:12,sh:4,vr:8});}});
    FCT3.K=str;gl.shadowMap.needsUpdate=true;}
  const REST=Math.PI/2*0.93,T=1.15;
  for(let i=FCT3.anim.length-1;i>=0;i--){const A=FCT3.anim[i];A.t+=dt;const k=Math.min(1,A.t/T);let th=REST*k*k*k*(1.6-0.6*k);
    if(A.t>T){const u=A.t-T;th=REST-0.07*Math.exp(-u*7)*Math.abs(Math.cos(u*17));}
    A.o.top.quaternion.setFromAxisAngle(A.ax,Math.min(REST,th));
    if(A.hit&&A.t>=T){A.hit=false;const o=A.o,L=SGT.len*0.75,x=o.x+A.d.x*L,y=o.y+A.d.z*L,me=myPos();
      if(!me||Math.hypot(x-me.x,y-me.y)<1400){snd('thud',{x,y});if(me&&Math.hypot(x-me.x,y-me.y)<500)shake(0.25);}
      for(let k=0;k<26;k++){const s=rnd(0.15,1);PARTS.push({x:o.x+A.d.x*SGT.len*s+rnd(-20,20),y:o.y+A.d.z*SGT.len*s+rnd(-20,20),h:o.b+rnd(0.2,1.5),vx:rnd(-90,90),vy:rnd(-90,90),vh:rnd(0.5,3),life:1.3,max:1.3,col:k%2?'#b8a488':'#8fb860',size:rnd(2.5,5),g:0.5,smoke:k%2===0,grow:k%2?0:1});}
      gl.shadowMap.needsUpdate=true;}
    if(A.t>T+0.8)FCT3.anim.splice(i,1);}
}
// ลุคภาพวาดของแมพนี้ (เหมือน paintScene ของแมพไฟล์ แต่แมพนี้สร้างจากโค้ด): ลายพู่กัน + cel บนทุกวัสดุในฉาก
function fcsPaint(gm){
  if(gm&&gm.color&&!gm.userData.ptG){gm.userData.ptG=1;gm.color.multiply(new THREE.Color(PAINT.ground[0],PAINT.ground[1],PAINT.ground[2]));}
  world.traverse(o=>{if(!o.isMesh)return;for(const m of [].concat(o.material))if(m&&!m.userData.pt&&!m.userData.noSurf)paintApply(m);});
}
// ---------- ชุดตกแต่งปราสาท (Blender: assets/src/fcs_kit_build.py) ----------
// วางตามตารางกำแพงเอง: ขอบกำแพงทึบที่โล่ง = ใบเสมาบน + ฐานหินล่าง (บางขอบ: ค้ำยัน/ธง/คบเพลิง/หินร่วง) • มุมนูน = หอคอย
// กำแพงเตี้ย/รั้ว/เสา/ลัง = ชิ้นจริงแทนกล่อง • หน้าตาเท่านั้น (ที่ชนอยู่ js/02-fcs) • สุ่มแบบ hash ตำแหน่ง = ทุกเครื่องเหมือนกัน
const FCS_KIT_V=3;
function fcsKitLoad(F,cells){
  const W=world,D=FCS_DATA,C=FCS_C,c3=C*S3,wc=(x,y)=>x<0||y<0||x>=D.w||y>=D.h?-1:parseInt(D.W[y*D.w+x],36)||0;
  gltfLoader().then(L=>L.loadAsync('assets/fcs/fcs_kit.glb?v='+FCS_KIT_V)).then(gltf=>{
    if(world!==W||builtMap!=='fcs')return;
    const K={};gltf.scene.traverse(o=>{if(o.isMesh)K[o.name]=o;});
    const L={};const put=(n,x,y,yb,rot,sx,sy,sz)=>{(L[n]=L[n]||[]).push([x,y,yb,rot||0,sx||1,sy||sx||1,sz||sx||1]);};
    const h=(x,y,k)=>{let v=(x*73856093^y*19349663^k*83492791)>>>0;v^=v>>>13;v=Math.imul(v,1274126177)>>>0;return (v>>>0)/4294967296;};
    const DIRS=[[1,0],[-1,0],[0,1],[0,-1]],TW=[];
    // กำแพงทึบ: ขอบที่ติดที่โล่ง
    for(const [x,y] of cells[1]){const cx=(x+0.5)*C,cy=(y+0.5)*C,b=GY(cx,cy),open=DIRS.map(([dx,dy])=>{const v=wc(x+dx,y+dy);return v!==1&&v!==-1;});
      DIRS.forEach(([dx,dy],k)=>{if(!open[k])return;const ex=cx+dx*C/2,ey=cy+dy*C/2,rot=Math.atan2(dx,dy);   // +z ของชิ้น = ทิศออกนอกกำแพง
        put('merlon',ex,ey,b+FCS_WH[1],rot);put('plinth',ex,ey,b,rot);const r=h(x,y,k);
        if(r<0.12)put('buttress',ex,ey,b,rot);else if(r<0.2)put('banner',ex,ey,b+5.3,rot);else if(r<0.27)put('torch',ex,ey,b+3.3,rot);else if(r<0.36)put('rubble',ex+dx*20,ey+dy*20,b,rot+r*9);});
      // มุมนูน: โล่ง 2 ด้านที่ตั้งฉากกัน + ช่องทแยงโล่ง → หอคอย
      for(const [a,c] of [[0,2],[0,3],[1,2],[1,3]])if(open[a]&&open[c]){const v=wc(x+DIRS[a][0]+DIRS[c][0],y+DIRS[a][1]+DIRS[c][1]);   // มุมนูนของแนวกำแพงรูปตัว L (กำแพงต่อไปทั้ง 2 ทาง) + ห่างหอคอยอื่น ≥ 6 ช่อง
        if(v!==1&&v!==-1&&wc(x-DIRS[a][0],y-DIRS[a][1])===1&&wc(x-DIRS[c][0],y-DIRS[c][1])===1&&!TW.some(t=>Math.max(Math.abs(t[0]-x),Math.abs(t[1]-y))<6)){TW.push([x,y]);put('tower',cx,cy,b,h(x,y,5)*6.28);break;}}}
    // กำแพงเตี้ย / รั้ว: ตามแนวที่ต่อกัน (เหมือนที่ชน js/02-fcs)
    for(const v of [2,3])for(const [x,y] of cells[v]){const cx=(x+0.5)*C,cy=(y+0.5)*C,hz=wc(x-1,y)===v||wc(x+1,y)===v;put(v===2?'lowwall':'fence',cx,cy,GY(cx,cy),hz?0:Math.PI/2,1,1,v===2?1.45:1);}
    for(const [t,x,y] of F.props){if(t==='pl')put('column',x,y,GY(x,y),0);else if(t==='cr')put(h(x|0,y|0,3)<0.5?'crate':'crate2',x,y,GY(x,y),h(x|0,y|0,4)*6.28);}
    const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),P=new THREE.Vector3(),S=new THREE.Vector3();
    for(const n in L){const src=K[n];if(!src)continue;const im=new THREE.InstancedMesh(src.geometry,src.material,L[n].length);
      L[n].forEach(([x,y,yb,rot,sx,sy,sz],i)=>{q.setFromAxisAngle(Y,rot);im.setMatrixAt(i,m4.compose(P.set(tx(x),yb,tz(y)),q,S.set(sx,sy,sz)));});
      im.castShadow=n!=='rubble'&&n!=='torch';im.receiveShadow=true;im.computeBoundingSphere();W.add(im);}
    for(const f of FCSFB)if(f){W.remove(f);f.dispose();}FCSFB.length=0;
    if(typeof paintOn==='function'&&paintOn('fcs'))fcsPaint(null);
    gl.shadowMap.needsUpdate=true;if(typeof prewarmShaders==='function')setTimeout(prewarmShaders,0);
  }).catch(e=>console.warn('fcs kit',e));
}
