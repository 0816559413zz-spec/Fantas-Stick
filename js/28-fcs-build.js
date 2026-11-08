// =====================================================================
//  ภาพแผนที่ First Castle Strike (แบบ Basic: กล่อง/ทรงพื้นฐาน ยังไม่มีโมเดลจริง) + ภาพ/HUD โหมดบุกปราสาท
//  ฉากนิ่ง buildFcs (รวม batch ได้) • ของที่เปลี่ยนสถานะ (แกน, กำแพงพังได้, ประตู, ขอบพื้นที่เฟส, ลำแสงร่าย) = sgSync ใน scene (ไม่โดน batch)
// =====================================================================
function buildFcs(){
  const M=MAPS.fcs,F=M.fcs,D=FCS_DATA,C=FCS_C,T=TERR,c3=C*S3;
  scene.fog.color.set('#c9b8a0');scene.fog.near=120;scene.fog.far=480;
  hemi.color.set('#ffe6c8');hemi.groundColor.set('#4a5a3a');hemi.intensity=0.8;moonL.intensity=1.45;moonL.color.set('#fff0dc');
  const surf=(i,j)=>parseInt(D.S[clamp(Math.floor(j/2),0,D.h-1)*D.w+clamp(Math.floor(i/2),0,D.w-1)],36);
  // พื้น: หญ้าทั้งแผนที่ + พื้นหินปราสาททับตรงช่องพื้นผิวหิน
  const gm=grLive(new THREE.MeshStandardMaterial({map:grassTex('#4f7a38',23,1),roughness:0.95}));
  const gr=new THREE.Mesh(terrGeo((i,j)=>T.g[j*T.nx+i],T.nx,T.ny,T.c,1),gm);gr.receiveShadow=true;addW(gr);
  const fl=new THREE.Mesh(terrGeo((i,j)=>{const a=[[i,j],[i-1,j],[i,j-1],[i-1,j-1]].every(([a,b])=>surf(Math.max(0,a),Math.max(0,b))===2);return a?T.g[j*T.nx+i]+0.03:NaN;},T.nx,T.ny,T.c,1),stoneMat(1,1,'#a8a294'));fl.receiveShadow=true;addW(fl);
  // กำแพงจากตาราง (InstancedMesh ต่อชนิด)
  const m4=new THREE.Matrix4(),cells=[[],[],[],[]];
  for(let y=0;y<D.h;y++)for(let x=0;x<D.w;x++){const v=parseInt(D.W[y*D.w+x],36);if(v)cells[v].push([x,y]);}
  const inst=(geo,mat,list,fn)=>{if(!list.length)return;const im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach((q,i)=>im.setMatrixAt(i,fn(q)));im.castShadow=im.receiveShadow=true;addW(im);};
  const box=sGeo(THREE.BoxGeometry,1,1,1);
  inst(box,stoneMat(1,1,'#7a746a'),cells[1],([x,y])=>{const px=(x+0.5)*C,py=(y+0.5)*C,b=GY(px,py);return m4.makeScale(c3,FCS_WH[1],c3).setPosition(tx(px),b+FCS_WH[1]/2,tz(py)).clone();});
  inst(box,stoneMat(1,1,'#9a8a6a'),cells[2],([x,y])=>{const px=(x+0.5)*C,py=(y+0.5)*C,b=GY(px,py);return m4.makeScale(c3,FCS_WH[2],c3).setPosition(tx(px),b+FCS_WH[2]/2,tz(py)).clone();});
  inst(box,new THREE.MeshStandardMaterial({color:'#5a4030',roughness:0.9}),cells[3],([x,y])=>{const px=(x+0.5)*C,py=(y+0.5)*C,b=GY(px,py);return m4.makeScale(c3*0.3,FCS_WH[3],c3*0.3).setPosition(tx(px),b+FCS_WH[3]/2,tz(py)).clone();});
  // ต้นไม้ / ลัง / เสา
  const P=k=>F.props.filter(q=>q[0]===k);
  inst(sGeo(THREE.CylinderGeometry,0.22,0.32,1,7),new THREE.MeshStandardMaterial({color:'#5a3f28',roughness:0.95}),P('tr'),([,x,y])=>m4.makeScale(1,3,1).setPosition(tx(x),GY(x,y)+1.5,tz(y)).clone());
  inst(sGeo(THREE.ConeGeometry,1.5,1,8),new THREE.MeshStandardMaterial({color:'#2f5a2a',roughness:0.9,flatShading:true}),P('tr'),([,x,y])=>m4.makeScale(1,4.5,1).setPosition(tx(x),GY(x,y)+4.6,tz(y)).clone());
  inst(box,new THREE.MeshStandardMaterial({color:'#8a6238',roughness:0.85}),P('cr'),([,x,y])=>m4.makeScale(1.25,1.2,1.25).setPosition(tx(x),GY(x,y)+0.6,tz(y)).clone());
  inst(sGeo(THREE.CylinderGeometry,0.65,0.75,1,10),stoneMat(1,1,'#bdb5a5'),P('pl'),([,x,y])=>m4.makeScale(1,6,1).setPosition(tx(x),GY(x,y)+3,tz(y)).clone());
  // แท่นจุดเกิด (สีทีม)
  for(const [t,L] of [[0,F.sp.A],[1,F.sp.B]])for(const k in L){const s=L[k],m=new THREE.Mesh(new THREE.CircleGeometry(SG_SPR*S3,32),new THREE.MeshBasicMaterial({color:TEAMC[t],transparent:true,opacity:0.18,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(tx(s.x),GY(s.x,s.y)+0.05,tz(s.y));addW(m);}
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
    c.cr.rotation.y+=dt*(act?1.2:0.3);c.cr.position.y=2.4+Math.sin(now/600+i)*0.15;
    const hit=act&&S.atk,col=hit?'#ff6a5a':fut?'#5a6a80':'#9fd8ff';c.cm.color.set(col);c.cm.emissive.set(hit?'#ff2a1a':fut?'#1a2030':'#3a8cff');
    c.ring.material.color.set(hit?'#ff6a5a':S.def?'#ffb060':'#7fc0ff');c.ring.material.opacity=0.35+0.25*Math.sin(now/(hit?120:400));});
  if(S.bw!==SGV3.bwK){const old=SGV3.bwK;SGV3.bwK=S.bw;SGV3.bw.forEach((o,i)=>{o.visible=S.bw[i]!=='1';if(old&&old[i]!=='1'&&S.bw[i]==='1')sgDust(o.position);});gl.shadowMap.needsUpdate=true;}
  // ลำแสงร่าย: จากมือคนร่ายไปยอดแกน
  const k=MAPS.fcs.fcs.cores[S.ph-1],seen=new Set();
  if(k)for(const p of P){if(!p.sc||!p.al)continue;seen.add(p.id);let b=SGV3.beams.get(p.id);
    if(!b){b=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.12,1,6,1,true),new THREE.MeshBasicMaterial({color:hdr('#8fd0ff',2),transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false}));SGV3.g.add(b);SGV3.beams.set(p.id,b);}
    const a=new THREE.Vector3(tx(p.x),GY(p.x,p.y)+(p.z||0)+1.3,tz(p.y)),e=new THREE.Vector3(tx(k.x),GY(k.x,k.y)+2.4,tz(k.y)),d=e.clone().sub(a),L=d.length();
    b.position.copy(a).addScaledVector(d,0.5);b.scale.set(1,L,1);b.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());b.material.opacity=0.55+0.3*Math.sin(now/70+p.x);
    if(Math.random()<0.4)PARTS.push({x:k.x+rnd(-14,14),y:k.y+rnd(-14,14),h:GY(k.x,k.y)+2.4+rnd(-0.6,0.6),vx:rnd(-40,40),vy:rnd(-40,40),vh:rnd(0.5,2),life:0.5,max:0.5,col:'#9fd8ff',size:1.6,g:0});}
  for(const [id,b] of SGV3.beams)if(!seen.has(id)){SGV3.g.remove(b);b.geometry.dispose();b.material.dispose();SGV3.beams.delete(id);}
}
function sgDust(pos){const x=pos.x*20+MW/2,y=pos.z*20+MH/2;for(let i=0;i<26;i++)PARTS.push({x:x+rnd(-40,40),y:y+rnd(-40,40),h:rnd(0.3,4),vx:rnd(-60,60),vy:rnd(-60,60),vh:rnd(0.5,3),life:1.4,max:1.4,col:'#b8a488',size:rnd(3,6),g:0,smoke:true,grow:1});}
function sgFx(ev){
  const me=myPos(),near=!me||Math.hypot(ev.x-me.x,ev.y-me.y)<1400;
  if(ev.k==='sgwall'){if(near)snd('rubble',ev);}
  else if(ev.k==='sgcore'){for(let i=0;i<40;i++)PARTS.push({x:ev.x+rnd(-20,20),y:ev.y+rnd(-20,20),h:2.4,vx:rnd(-260,260),vy:rnd(-260,260),vh:rnd(1,7),life:1.1,max:1.1,col:'#9fd8ff',size:2.4,g:6});FX.flashLight(ev.x,ev.y,2.4,'#7fc0ff',6,30,0.6);snd('boom',ev);}
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
