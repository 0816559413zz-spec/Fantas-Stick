// ---------- Dragonfall (ภาพ) ----------
// วงเตือนบนพื้น: วงส้มแดง + แผ่นจางๆ + ขีดอักขระไฟ 10 เส้นที่หุบเข้าหาศูนย์กลางใน 0.65 วิสุดท้ายก่อนกระแทก (ทุกคนเห็น)
function makeDfCircle(st){
  const g=new THREE.Group(),BL=st?THREE.NormalBlending:THREE.AdditiveBlending;   // สายฟ้า: สีปกติ เห็นชัดแม้บนหิมะ
  const rm=new THREE.MeshBasicMaterial({color:st?'#ffcc00':hdr('#ff5a1a',1.3),transparent:true,opacity:0.75,depthWrite:false,blending:BL,side:THREE.DoubleSide});
  const ring=new THREE.Mesh(new THREE.RingGeometry(st?0.88:0.93,1,56),rm);ring.rotation.x=-Math.PI/2;g.add(ring);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(0.93,48),new THREE.MeshBasicMaterial({color:st?'#ffd23a':'#ff3a10',transparent:true,opacity:0.13,depthWrite:false,side:THREE.DoubleSide}));disc.rotation.x=-Math.PI/2;g.add(disc);
  const inner=new THREE.Mesh(new THREE.RingGeometry(0.9,1,40),new THREE.MeshBasicMaterial({color:st?'#fff6c0':hdr('#ffb347',1.2),transparent:true,opacity:0.55,depthWrite:false,blending:BL,side:THREE.DoubleSide}));inner.rotation.x=-Math.PI/2;g.add(inner);
  const runes=[];const bm=new THREE.MeshBasicMaterial({color:st?'#ffe680':hdr('#ffd27a',1.4),transparent:true,opacity:0.85,depthWrite:false,blending:BL,side:THREE.DoubleSide});
  for(let i=0;i<(st?12:10);i++){const r=new THREE.Mesh(new THREE.PlaneGeometry(0.05,0.22),bm);r.rotation.x=-Math.PI/2;r.userData.a=i/(st?12:10)*Math.PI*2;g.add(r);runes.push(r);
    if(st){const c=new THREE.Mesh(new THREE.PlaneGeometry(0.14,0.035),bm);c.position.y=0.04;r.add(c);}}
  if(st){// ลวดลายรูน: วงในบาง + ดาวหกแฉก (สามเหลี่ยมสองอันซ้อน) ที่หมุนอยู่
    const r2=new THREE.Mesh(new THREE.RingGeometry(0.76,0.79,48),rm);r2.rotation.x=-Math.PI/2;g.add(r2);
    for(const off of [0,Math.PI]){const pts=[0,1,2,3].map(i=>{const an=off+i/3*Math.PI*2+Math.PI/2;return new THREE.Vector3(Math.cos(an)*0.76,0.005,Math.sin(an)*0.76);});
      for(let i=0;i<3;i++){const A=pts[i],B=pts[i+1],L=A.distanceTo(B),m=new THREE.Mesh(new THREE.PlaneGeometry(L,0.025),rm);m.rotation.x=-Math.PI/2;m.rotation.z=-Math.atan2(B.z-A.z,B.x-A.x);m.position.set((A.x+B.x)/2,0.005,(A.z+B.z)/2);m.rotation.order='YXZ';m.rotation.set(-Math.PI/2,0,0);m.rotation.y=-Math.atan2(B.z-A.z,B.x-A.x);g.add(m);}}}
  g.userData={ring,disc,inner,runes,mats:[rm,disc.material,inner.material,bm]};g.visible=false;scene.add(g);
  return g;
}
// รอยแตกไฟบนพื้น (เส้นหักสั้นๆ 8 เส้น) จางหายใน 0.5 วิ แล้วลบทิ้ง
const DFV=[];
function dfCracks(x,y,h,r,col,life){
  const g=new THREE.Group();g.position.set(tx(x),h+GY(x,y),tz(y));
  const m=new THREE.MeshBasicMaterial({color:hdr(col||'#ff7a1a',1.6),transparent:true,opacity:0.95,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const pos=[],idx=[];
  for(let i=0;i<8;i++){let an=i/8*Math.PI*2+rnd(-0.25,0.25),px=0,pz=0;const segs=3,len=rnd(0.45,0.85)*r*S3/segs;
    for(let k=0;k<segs;k++){an+=rnd(-0.5,0.5);const w=0.16*(1-k/segs)+0.04,dx=Math.cos(an),dz=Math.sin(an),nx=-dz*w/2,nz=dx*w/2,ex=px+dx*len,ez=pz+dz*len,q=pos.length/3;
      pos.push(px+nx,0,pz+nz, px-nx,0,pz-nz, ex+nx,0,ez+nz, ex-nx,0,ez-nz);idx.push(q,q+1,q+2,q+1,q+3,q+2);px=ex;pz=ez;}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);
  g.add(new THREE.Mesh(geo,m));scene.add(g);DFV.push({g,m,age:0,life:life||0.5});
}
function updateDfCracks(dt){for(let i=DFV.length-1;i>=0;i--){const d=DFV[i];d.age+=dt;d.m.opacity=0.95*Math.max(0,1-d.age/d.life);if(d.age>=d.life){scene.remove(d.g);d.g.traverse(o=>{if(o.geometry)o.geometry.dispose();});d.m.dispose();DFV.splice(i,1);}}}
function dragonfallFX(o,p,pz,now,dt){
  const D=p.df;
  if(o.sdBall&&(!D||D[4]!==1||D[0]===3))o.sdBall.visible=false;
  if(!D){if(o.dfC)o.dfC.visible=false;if(o.fWings)o.fWings.visible=false;o.dfPh=0;return;}
  const ph=D[0],left=ph===1?D[3]+3.45:ph===2?D[3]+0.45:D[3],ca=Math.cos(p.a||0),sa=Math.sin(p.a||0),ST=D[4]===1;
  const c1=ST?'#ffffff':'#fff0b0',c2=ST?'#fff27a':'#ffb347',c3=ST?'#9fd8ff':'#ff5a1a';
  if(!o.dfC){o.dfC=makeDfCircle(ST);(o.g.userData.extra||(o.g.userData.extra=[])).push(o.dfC);}
  const C=o.dfC,U=C.userData,R=(ST?150:DF_R)*S3;
  if(!C.visible){C.visible=true;C.position.set(tx(D[1]),0.07+GY(D[1],D[2]),tz(D[2]));}
  C.position.x+=(tx(D[1])-C.position.x)*Math.min(1,dt*18);C.position.z+=(tz(D[2])-C.position.z)*Math.min(1,dt*18);
  C.scale.set(R,1,R);
  const conv=clamp(1-left/0.65,0,1),pulse=0.5+0.5*Math.sin(now/110);
  U.mats[0].opacity=0.55+0.25*pulse+0.2*conv;U.mats[1].opacity=0.1+0.12*conv;
  U.inner.scale.setScalar(Math.max(0.04,1-conv*0.96));U.mats[2].opacity=0.25+0.5*conv;
  U.runes.forEach((r,i)=>{const an=r.userData.a+now/900,rr=lerp(0.82,0.1,conv);r.position.set(Math.cos(an)*rr,0.01,Math.sin(an)*rr);r.rotation.z=-an;r.scale.set(1/R*R,1+conv*1.5,1);});
  if(!o.dfPh||o.dfPh!==ph)o.dfPh=ph;
  // ท่าทาง + ไฟตามตัว
  if(ph===1&&D[3]>0.25){o.b.position.y=-0.32;o.legs[0].rotation.x=-1.1;o.legs[1].rotation.x=-1.1;o.b.rotation.x=0.35;}
  else if(ph<=2){
    o.armL.rotation.x=-0.6;o.armL.rotation.z=1.1;o.armR.rotation.z=-1.1;o.legs[0].rotation.x=0.35;o.legs[1].rotation.x=0.2;o.b.rotation.x=0.18;
    if(ST){o.armR.rotation.x=-3.0;o.armR.rotation.z=-0.1;}
    else{// ปีกไฟกางออก กระพือ และทิ้งสะเก็ดไฟ
      const fl2=Math.sin(now/170)*0.35,open=ph===1?Math.min(1,(0.35-D[3])/0.3+0.2):1;
      // ปีกไฟจากไฟล์ (shader เปลวไหลจากโคนขนไปปลาย) กระพือช้า ๆ
      if(!o.fWings){o.fWings=makeFireWings();if(o.fWings){o.fWings.position.set(0,1.5,-0.22);o.fWings.scale.setScalar(1.05);o.b.add(o.fWings);}}
      if(o.fWings){o.fWings.visible=true;poseFireWings(o.fWings,open,fl2*0.75,0);}
      for(const sd of [-1,1]){const bones=[[0.15,1.55,-0.25],[0.9*open,1.95+fl2*0.6,-0.55],[1.9*open,1.75+fl2*1.4,-0.85],[1.5*open,1.05+fl2,-0.75],[0.8*open,0.95+fl2*0.4,-0.5]];
        for(let i=0;i<(o.fWings?2:7);i++){const b=(Math.random()*4)|0,u=Math.random(),A=bones[b],B=bones[b+1];_ev.set(sd*lerp(A[0],B[0],u),lerp(A[1],B[1],u),lerp(A[2],B[2],u));o.b.localToWorld(_ev);const q=simOf(_ev);
          flame(q.x,q.y,q.h-0.2,{vh:rnd(0.5,1.8),life:rnd(0.12,0.2),size:rnd(6,9),g:-1});}
        if(Math.random()<0.5){_ev.set(sd*1.9*open,1.75+fl2*1.4,-0.85);o.b.localToWorld(_ev);const q=simOf(_ev);PARTS.push({x:q.x,y:q.y,h:q.h,vx:rnd(-40,40),vy:rnd(-40,40),vh:rnd(-2,0),life:0.5,max:0.5,col:'#ffd27a',size:1.5,g:3});}}}
    for(let i=0;i<5;i++)PARTS.push({x:p.x+rnd(-10,10),y:p.y+rnd(-10,10),h:pz+rnd(-0.1,0.3),vx:rnd(-30,30),vy:rnd(-30,30),vh:rnd(-6,-3),life:rnd(0.3,0.45),max:0.45,col:i<2?c1:i<4?c2:c3,size:rnd(2.5,4),g:2,grow:0.8});
    for(let i=0;i<2;i++)PARTS.push({x:p.x-ca*rnd(10,30)+rnd(-8,8),y:p.y-sa*rnd(10,30)+rnd(-8,8),h:pz+rnd(0.6,1.6),vx:0,vy:0,vh:rnd(0,0.6),life:0.5,max:0.5,col:i?c3:c2,size:rnd(3,4.5),g:-0.5,grow:0.5});
    if(!ST&&Math.random()<0.4)PARTS.push({x:p.x+rnd(-10,10),y:p.y+rnd(-10,10),h:pz,vx:0,vy:0,vh:-1,life:0.7,max:0.7,col:'#3a2a24',size:6,g:0,smoke:true,grow:1});
    if(ST){// สายฟ้าหนาพัน/พาดผ่านร่างตอนลอย
      for(let j=0;j<2;j++){const a1=rnd(0,6.283),q=shellPt(p.x,p.y,pz+rnd(0,0.5),18,a1,0),q2=shellPt(p.x,p.y,pz+rnd(1.6,2.4),18,a1+rnd(2,4),0);tbolt(q[0],q[1],q[2],q2[0],q2[1],q2[2],0.07,0,0.12,Math.random()<0.4?1:0);}
      // ลูกสายฟ้าที่ปลายไม้ (โตขึ้นตามเวลาบิน)
      if(!o.sdBall){o.sdBall=new THREE.Group();const a1=new THREE.Sprite(glowMat('#ffd23a',1.1));a1.material.userData.keep=true;a1.scale.setScalar(1.3);const a2=new THREE.Sprite(glowMat('#fff7d0',1.8));a2.material.userData.keep=true;a2.scale.setScalar(0.5);o.sdBall.add(a1,a2);scene.add(o.sdBall);(o.g.userData.extra||(o.g.userData.extra=[])).push(o.sdBall);}
      o.tip.getWorldPosition(_pw);o.sdBall.visible=true;o.sdBall.position.set(_pw.x+rnd(-0.08,0.08),_pw.y+0.55+rnd(-0.08,0.08),_pw.z+rnd(-0.08,0.08));const k=ph===1?0.5:0.7+0.5*Math.min(1,(3-D[3])/1.5);o.sdBall.scale.setScalar(k*(0.9+0.15*Math.sin(now/40)));
      {const q=simOf(o.sdBall.position),R=14*k;for(let j=0;j<3;j++){const a1=rnd(0,6.283),e1=rnd(-1,1),b1=shellPt(q.x,q.y,q.h,R,a1,e1),b2=shellPt(q.x,q.y,q.h,R,a1+rnd(1.2,2.8),-e1);tbolt(b1[0],b1[1],b1[2],b2[0],b2[1],b2[2],0.05,0,0.08,j===0?1:0);}
        if(Math.random()<0.5){const an=rnd(0,6.283);tbolt(q.x,q.y,q.h,q.x+Math.cos(an)*rnd(25,50),q.y+Math.sin(an)*rnd(25,50),q.h+rnd(-0.8,0.8),0.06,0,0.09);}}
    }
    LREQ.push({x:tx(p.x),y:pz+0.5,z:tz(p.y),col:ST?'#ffe27a':'#ff7a2a',int:2.5,dist:10});
  }else{
    // ห่อตัวดิ่งลง: พับปีกเข้าหาตัว + หมุนตัวหนึ่งรอบ (เฉพาะสายไฟ)
    if(!ST){const k=1-Math.max(0,D[3])/0.45;o.b.rotation.y=k*Math.PI*2;if(o.fWings){o.fWings.visible=true;poseFireWings(o.fWings,1,0,Math.min(1,k*3));}
      for(const sd of [-1,1])for(let i=0;i<4;i++){const u=Math.random();_ev.set(sd*lerp(0.2,0.55,u),lerp(1.6,0.9,u),-0.45);o.b.localToWorld(_ev);const q=simOf(_ev);flame(q.x,q.y,q.h-0.2,{vh:2,life:0.15,size:7,g:-1});}}
    o.b.rotation.x=1.05;o.legs[0].rotation.x=-1.4;o.legs[1].rotation.x=-1.2;o.armL.rotation.x=-2.2;o.armR.rotation.x=-2.2;o.armL.rotation.z=0.3;o.armR.rotation.z=-0.3;
    for(let i=0;i<9;i++)PARTS.push({x:p.x+rnd(-8,8),y:p.y+rnd(-8,8),h:pz+rnd(0.3,1.6),vx:rnd(-20,20),vy:rnd(-20,20),vh:rnd(0,1),life:rnd(0.25,0.4),max:0.4,col:i<3?'#fff0b0':i<6?'#ffb347':'#ff5a1a',size:rnd(3,5),g:-1,grow:0.6});
    PARTS.push({x:p.x,y:p.y,h:pz+1,vx:0,vy:0,vh:0.3,life:0.4,max:0.4,col:'#ff6a1a',size:5,g:0,smoke:true,grow:0.8});
    LREQ.push({x:tx(p.x),y:pz+1,z:tz(p.y),col:'#ff8a3a',int:3,dist:12});
  }
}
// ---------- สายฟ้า (ภาพ) ----------
// ภาษาภาพของผู้เล่น: สายฟ้าหนา สีเหลืองเด่น แกนขาวสว่าง เคลื่อนที่เร็ว (ไม่ใช่เส้นบางสีขาว/ฟ้า)
// tbolt = ริบบิ้นหันหากล้อง 3 ชั้น (เรืองแสงเหลือง / ตัวเหลืองเข้ม / แกนขาว) ซิกแซกสุ่มใหม่ทุก ~0.035 วิ + แตกกิ่ง • ใช้วัตถุซ้ำจากพูล
const TBN=12,TBA=[],TBF=[],TBMAX=420;
const _tv=new THREE.Vector3(),_tt=new THREE.Vector3(),_ts=new THREE.Vector3(),_tw=new THREE.Vector3();
// วาดสายฟ้าทุกเส้นรวมใน 3 mesh เดียว (เรืองแสง / ตัว / แกน) — ลด draw call จาก 3 ต่อเส้น เหลือ 3 ทั้งหมด • สี+ความจางเก็บต่อจุด (RGBA)
function tbLayer(blend,ro){const V=TBMAX*TBN*2,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(V*3),3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(V*4),4).setUsage(THREE.DynamicDrawUsage));
  const idx=new Uint32Array(TBMAX*(TBN-1)*6);let q=0;for(let b=0;b<TBMAX;b++){const o=b*TBN*2;for(let i=0;i<TBN-1;i++){const a=o+i*2;idx[q++]=a;idx[q++]=a+1;idx[q++]=a+2;idx[q++]=a+1;idx[q++]=a+3;idx[q++]=a+2;}}
  g.setIndex(new THREE.BufferAttribute(idx,1));g.setDrawRange(0,0);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:blend,depthWrite:false,side:THREE.DoubleSide}));m.frustumCulled=false;m.renderOrder=ro;scene.add(m);return m;}
let TBL=null;   // สร้างตอนใช้ครั้งแรก (ตอนโหลดไฟล์ scene ยังไม่ถูกสร้าง)
const TBC={glow:new THREE.Color('#ffb800').multiplyScalar(1.3),body:new THREE.Color('#ffc400'),acc:new THREE.Color('#7fd6ff'),core:new THREE.Color('#fffbe0').multiplyScalar(1.8)};
const _tcc=new THREE.Color();
function tbGet(){if(TBA.length>=TBMAX){const old=TBA.shift();TBF.push(old);}let o=TBF.pop();if(!o){o={pts:Array.from({length:TBN},()=>new THREE.Vector3()),A:new THREE.Vector3(),B:new THREE.Vector3(),path:null};}TBA.push(o);return o;}
// จุด sim (x,y,h) — col ไม่ใช้ (เหลืองเสมอ) ยกเว้น '#9fd8ff' = สีรองฟ้า • w = ความหนา (หน่วยโลก) • br = จำนวนกิ่ง
function tbolt(x1,y1,h1,x2,y2,h2,life,col,w,br){
  const o=tbGet();o.A.set(tx(x1),h1+GY(x1,y1),tz(y1));o.B.set(tx(x2),h2+GY(x2,y2),tz(y2));o.path=null;o.life=o.max=life||0.12;o.w=(w||0.14)*1.2;o.rj=0;o.gk=1;
  const L=o.A.distanceTo(o.B);o.amp=Math.min(0.55,L*0.11+0.03);o.acc=col==='#9fd8ff';
  if(br&&L>1.2)for(let i=0;i<br;i++){const k=rnd(0.25,0.75),bx=lerp(x1,x2,k)+rnd(-8,8),by=lerp(y1,y2,k)+rnd(-8,8),bh=lerp(h1,h2,k),an=rnd(0,6.283),bl=L/S3*rnd(0.2,0.4);
    tbolt(bx,by,bh,bx+Math.cos(an)*bl,by+Math.sin(an)*bl,bh+rnd(-0.6,0.6)*L*0.3,life,col,o.w*0.55,0);}
  return o;
}
// สายฟ้าตามเส้นทางที่กำหนด (จุดโลก) — ใช้กับหาง/เกลียวรอบ Railgun
function tboltP(P,life,w,amp,col){const o=tbGet();o.path=P;o.life=o.max=life;o.w=w*1.2;o.rj=0;o.amp=amp;o.acc=col==='#9fd8ff';o.gk=1;return o;}
function tbWrite(L,slot,pts,w,taper,c,a){
  const g=L.geometry,P0=g.attributes.position.array,C0=g.attributes.color.array,cp=cam.position,base=slot*TBN*2;
  for(let i=0;i<TBN;i++){const P=pts[i],Pa=pts[Math.max(0,i-1)],Pb=pts[Math.min(TBN-1,i+1)];
    _tt.subVectors(Pb,Pa);_tv.subVectors(cp,P);_ts.crossVectors(_tt,_tv).normalize();
    const t=i/(TBN-1),ww=w*0.5*(taper?(1-0.7*t):(0.7+0.3*Math.sin(Math.PI*Math.min(1,t*1.15+0.05)))),v=(base+i*2)*3,cc=(base+i*2)*4;
    P0[v]=P.x-_ts.x*ww;P0[v+1]=P.y-_ts.y*ww;P0[v+2]=P.z-_ts.z*ww;P0[v+3]=P.x+_ts.x*ww;P0[v+4]=P.y+_ts.y*ww;P0[v+5]=P.z+_ts.z*ww;
    C0[cc]=C0[cc+4]=c.r;C0[cc+1]=C0[cc+5]=c.g;C0[cc+2]=C0[cc+6]=c.b;C0[cc+3]=C0[cc+7]=a;}
}
function updateBolts(dt){
  if(!TBL){if(!TBA.length)return;TBL={glow:tbLayer(THREE.AdditiveBlending,1),body:tbLayer(THREE.NormalBlending,2),core:tbLayer(THREE.NormalBlending,3)};}
  let n=0;
  for(let i=TBA.length-1;i>=0;i--){const o=TBA[i];o.life-=dt;if(o.life<=0){TBA.splice(i,1);TBF.push(o);}}
  for(const o of TBA){
    o.rj-=dt;
    if(o.rj<=0){o.rj=0.035;
      for(let j=0;j<TBN;j++){const t=j/(TBN-1),e=(j===0||j===TBN-1)?0:o.amp*Math.sin(Math.PI*t);
        if(o.path){const f=t*(o.path.length-1),k=Math.floor(f),u=f-k,Pa=o.path[k],Pb=o.path[Math.min(o.path.length-1,k+1)];o.pts[j].lerpVectors(Pa,Pb,u);}
        else o.pts[j].lerpVectors(o.A,o.B,t);
        o.pts[j].x+=rnd(-e,e);o.pts[j].y+=rnd(-e,e);o.pts[j].z+=rnd(-e,e);}}
    const k=Math.min(1,o.life/o.max*2.2),tp=!!o.path;
    tbWrite(TBL.glow,n,o.pts,o.w*2.6,tp,TBC.glow,0.5*k*o.gk);tbWrite(TBL.body,n,o.pts,o.w,tp,o.acc?TBC.acc:TBC.body,k);tbWrite(TBL.core,n,o.pts,o.w*0.32,tp,o.gk<1?_tcc.copy(TBC.core).multiplyScalar(0.36+0.64*o.gk):TBC.core,k);n++;
  }
  for(const L of Object.values(TBL)){const g=L.geometry;g.setDrawRange(0,n*(TBN-1)*6);g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true;L.visible=n>0;}
}
const LATER=[],STV=[],SBV=[],SDV=[],TSV=[],CLV=[];
// ตำแหน่งตัวเป้าในภาพตอนนี้ ('e12' = มอน/หุ่น, อื่น ๆ = ผู้เล่น) → [x,y,h อก] หรือ null
function stTgPos(tg){const v=VIEW.cur;if(!v||tg==null)return null;if(typeof tg==='string'&&tg[0]==='e'){const id=+tg.slice(1),e=v.E.find(q=>q.id===id);return e?[e.x,e.y,(e.h||0)+groundH(e.x,e.y)+1]:null;}
  const p=v.P.find(q=>q.id===tg);return p&&p.al!==false?[p.x,p.y,(p.z||0)+1.1]:null;}
// วัสดุกรงเล็บอัลติ (ใช้ร่วมกันทุกคน): ใบมีดเข้มเหลือบโลหะ • คมเหลืองไม่เรืองจัด • สนับมือโลหะเข้ม
// blades = จุดโคน/กลาง/ปลายของใบมีด 3 เล่มในพิกัดของไฟล์ (glTF: x, y=บน, z=หน้า) — ตรงกับ assets/src/fx_meshes_build.py
const STCLAW={dark:new THREE.MeshStandardMaterial({color:'#17140f',metalness:0.85,roughness:0.32,emissive:'#3a2a00',emissiveIntensity:0.35}),
  edge:new THREE.MeshBasicMaterial({color:'#ffc81e'}),metal:new THREE.MeshStandardMaterial({color:'#2a2621',metalness:0.9,roughness:0.4}),
  blades:[0,1,2].map(i=>{const x0=(i-1)*0.09,L=i===1?0.82:0.74,sp=(i-1)*0.16,P=t=>[x0+sp*t,-0.06-L*t*(1-0.18*t),0.02+0.55*t*t*L];return [P(0.04),P(0.5),P(0.97)];})};
for(const k of ['dark','edge','metal'])STCLAW[k].userData.keep=true;
// ---------- รอยกรงเล็บ (อัลติสายฟ้า): รอยข่วน 3 เส้นโค้งปลายแหลมขนานกัน ตั้งขวางหน้าเรา ----------
// รอบปรับ 2026-10-19 (ผู้เล่นขอ "เข้มและมีเอฟเฟกต์สายฟ้า ไม่เรืองแสงเกิน"): ตัวรอยสีเข้มเกือบดำ + ขอบคมเหลืองบาง + แสงเรืองจางลง
// + สายฟ้าบางวิ่งไล่ตามแต่ละรอยระหว่างปาด และแลบออกปลายรอย • ปาดออกเร็วแล้วจาง
function clawGeo(R,arc,W,off){const N=18,pos=[],idx=[];
  for(let i=0;i<=N;i++){const t=i/N,th=-arc/2+arc*t,w=W*Math.pow(Math.sin(Math.PI*t),0.75)+0.004,cx=Math.cos(th),cy=Math.sin(th);
    pos.push(cx*(R+off)-cx*0,cy*(R+off),0, cx*(R+off-w),cy*(R+off-w),0);if(i){const q=i*2;idx.push(q-2,q-1,q,q-1,q+1,q);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);return g;}
// x,y,h = จุดศูนย์กลางรอย (sim) • a = ทิศหันหน้า • R = ขนาดรอย (โลก) • rot = เอียงรอย (เรเดียน) • big = ใหญ่/หนา
function clawRakes(x,y,h,a,R,rot,big){
  const g=new THREE.Group();g.position.set(tx(x),h+GY(x,y),tz(y));g.rotation.order='YXZ';g.rotation.y=-a+Math.PI/2;g.rotation.z=rot;scene.add(g);g.updateMatrixWorld(true);
  const arc=big?1.5:1.25,W=(big?0.34:0.26)*R/2,gap=(big?0.42:0.32)*R/2,parts=[],paths=[];
  for(let k=-1;k<=1;k++){const off=k*gap,Rk=R*(1-Math.abs(k)*0.06);
    const glow=new THREE.Mesh(clawGeo(Rk,arc,W*1.8,off+W*0.4),new THREE.MeshBasicMaterial({color:hdr('#ffb800',0.8),transparent:true,opacity:0.1,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
    const body=new THREE.Mesh(clawGeo(Rk,arc,W,off),new THREE.MeshBasicMaterial({color:'#100c04',transparent:true,opacity:0.95,depthWrite:false,side:THREE.DoubleSide}));
    const mid=new THREE.Mesh(clawGeo(Rk,arc,W*0.55,off-W*0.12),new THREE.MeshBasicMaterial({color:'#2c2006',transparent:true,opacity:0.92,depthWrite:false,side:THREE.DoubleSide}));
    const edge=new THREE.Mesh(clawGeo(Rk,arc,W*0.16,off+0.004),new THREE.MeshBasicMaterial({color:'#ffd23a',transparent:true,opacity:1,depthWrite:false,side:THREE.DoubleSide}));
    for(const m of [glow,body,mid,edge])m.position.set(-R*0.86,0,0.01*k);g.add(glow,body,mid,edge);parts.push(glow,body,mid,edge);
    // เส้นทางสายฟ้าตามรอยนี้ (จุดโลก 12 จุด ตามแนวกลางรอย)
    const P=[];for(let i=0;i<=11;i++){const th=-arc/2+arc*i/11,r=Rk+off-W*0.35;P.push(new THREE.Vector3(Math.cos(th)*r-R*0.86,Math.sin(th)*r,0.02*k).applyMatrix4(g.matrixWorld));}paths.push(P);}
  parts.forEach(m=>m.geometry.setDrawRange(0,0));
  CLV.push({g,parts,paths,age:0,rev:big?0.09:0.06,life:big?0.42:0.32,bt:0,big});
}
function updateClaws(dt){for(let i=CLV.length-1;i>=0;i--){const c=CLV[i];c.age+=dt;const k=Math.min(1,c.age/c.rev),n=Math.ceil(18*k)*6;
  const fade=Math.max(0,1-Math.max(0,c.age-c.rev)/(c.life-c.rev));
  c.parts.forEach((m,j)=>{m.geometry.setDrawRange(0,n);const base=j%4===0?0.1:j%4===3?1:0.94;m.material.opacity=base*fade;});
  c.g.scale.setScalar(1+0.12*Math.min(1,c.age/c.life));
  // สายฟ้าวิ่งตามรอย (เฉพาะส่วนที่ปาดถึงแล้ว) + แลบออกที่ปลายรอย
  c.bt-=dt;if(c.bt<=0&&fade>0.25){c.bt=0.03;for(const P of c.paths){const m=Math.max(3,Math.round(12*k)),Q=P.slice(0,m);tboltP(Q,0.045,c.big?0.06:0.05,0.035).gk=0.3;
      if(Math.random()<0.35){const e=simOf(Q[Q.length-1]);tbolt(e.x,e.y,e.h,e.x+rnd(-16,16),e.y+rnd(-16,16),e.h+rnd(-0.5,0.3),0.05,0,0.035).gk=0.3;}}}
  if(c.age>=c.life){scene.remove(c.g);c.parts.forEach(m=>{m.geometry.dispose();m.material.dispose();});CLV.splice(i,1);}}}
function later(d,fn){LATER.push({t:d,fn});}
function stFade(m,life){scene.add(m);STV.push({m,age:0,life,op:m.material.opacity});}
function stBeam(x,y,h,a,len,rad,col,op,nb){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,len*S3,12,1,true),new THREE.MeshBasicMaterial({color:nb?col:hdr(col,2),transparent:true,opacity:op,blending:nb?THREE.NormalBlending:THREE.AdditiveBlending,depthWrite:false}));
  m.rotation.order='YXZ';m.rotation.y=-a;m.rotation.z=Math.PI/2;m.position.set(tx(x+Math.cos(a)*len/2),h+GY(x,y),tz(y+Math.sin(a)*len/2));return m;
}
// จุดบนเปลือกทรงกลมรอบ (x,y,h) รัศมี R (หน่วย sim)
function shellPt(x,y,h,R,a,e){return [x+Math.cos(a)*R*Math.cos(e),y+Math.sin(a)*R*Math.cos(e),h+R*S3*Math.sin(e)];}
function updateStormV(dt){
  for(let i=LATER.length-1;i>=0;i--){const L=LATER[i];L.t-=dt;if(L.t<=0){LATER.splice(i,1);try{vfxOnce(L.fn);}catch(e){}}}
  updateBolts(dt);updateClaws(dt);
  for(let i=STV.length-1;i>=0;i--){const v=STV[i];v.age+=dt;v.m.material.opacity=v.op*Math.max(0,1-v.age/v.life);if(v.grow)v.m.scale.multiplyScalar(1+v.grow*dt);if(v.age>=v.life){scene.remove(v.m);v.m.geometry.dispose();v.m.material.dispose();STV.splice(i,1);}}
  for(let i=SBV.length-1;i>=0;i--){const b=SBV[i];if(b.s){b.t+=dt;const T=stTgPos(b.tg)||[b.x2,b.y2,groundH(b.x2,b.y2)+1],k=Math.min(1,b.t/b.max),u=0.2/b.max,dl=Math.hypot(T[0]-b.s[0],T[1]-b.s[1])||1,fw=Math.min(36,dl*0.3),A=[b.s[0]+(T[0]-b.s[0])/dl*fw,b.s[1]+(T[1]-b.s[1])/dl*fw,b.s[2]+1.8];let q;
      if(k<u){const e=1-Math.pow(1-k/u,2);q=[lerp(b.s[0],A[0],e),lerp(b.s[1],A[1],e),lerp(b.s[2],A[2],e)];}   // ลอยขึ้น + เลื่อนออกหน้า (ไม่ลอยค้างหน้ากล้อง)
      else{const e=(k-u)/(1-u),C=[lerp(A[0],T[0],0.35),lerp(A[1],T[1],0.35),A[2]+1.4],w=1-e;q=[w*w*A[0]+2*w*e*C[0]+e*e*T[0],w*w*A[1]+2*w*e*C[1]+e*e*T[1],w*w*A[2]+2*w*e*C[2]+e*e*T[2]];}   // โค้งลงไล่ตัวเป้า
      if(b.fx){b.fx.x=q[0];b.fx.y=q[1];b.fx.h=q[2];}if(k>=1){if(b.fx)fxStop(b.fx);SBV.splice(i,1);}continue;}
    b.t+=dt;const k=Math.min(1,b.t/b.max),x=lerp(b.x,b.x2,k),y=lerp(b.y,b.y2,k),h=lerp(b.h,b.h2,k);
    b.g.position.set(tx(x),h+GY(x,y),tz(y));for(let j=0;j<3;j++)PARTS.push({x:x+rnd(-8,8),y:y+rnd(-8,8),h:h+rnd(-0.3,0.3),vx:0,vy:0,vh:rnd(-0.5,0.5),life:0.3,max:0.3,col:j?'#ffd000':'#ffffff',size:rnd(2.5,4),g:0});
    if(Math.random()<0.8){const a1=rnd(0,6.283),e1=rnd(-1,1),R=b.R||16,q=shellPt(x,y,h,R,a1,e1),q2=shellPt(x,y,h,R,a1+rnd(1,2.5),-e1);tbolt(q[0],q[1],q[2],q2[0],q2[1],q2[2],0.05,0,0.08);}
    if(k>=1){scene.remove(b.g);SBV.splice(i,1);}}
  for(let i=SDV.length-1;i>=0;i--){const d=SDV[i];d.t-=dt;d.m.material.opacity=0.16+0.1*Math.sin(performance.now()/60);d.w.material.opacity=0.45*Math.min(1,d.t*3);d.m.rotation.y+=dt*0.8;d.w.rotation.y-=dt*1.4;
    for(let j=0;j<2;j++){const a1=rnd(0,6.283),e1=rnd(0,1.3),q=shellPt(d.x,d.y,d.h,d.r,a1,e1),q2=shellPt(d.x,d.y,d.h,d.r,a1+rnd(0.5,1.6),rnd(0,1.3));tbolt(q[0],q[1],q[2],q2[0],q2[1],q2[2],0.08,0,0.13,1);}
    // อนุภาควนเป็นเกลียวเข้ากลาง + สายฟ้าโค้งวนเข้าหากลาง
    for(let j=0;j<4;j++){const an=rnd(0,6.283),r=d.r*rnd(0.85,1.05),tg=an+Math.PI/2;PARTS.push({x:d.x+Math.cos(an)*r,y:d.y+Math.sin(an)*r,h:d.h+rnd(0.1,0.8),vx:-Math.cos(an)*140+Math.cos(tg)*110,vy:-Math.sin(an)*140+Math.sin(tg)*110,vh:0,life:0.7,max:0.7,col:j%2?'#ffd000':'#ffffff',size:2.6,g:0,drag:0.6});}
    if(Math.random()<0.5){const P=[],a0=rnd(0,6.283);for(let j=0;j<=8;j++){const an=a0+j*0.25,r=d.r*(1-j/9);_tw.set(tx(d.x+Math.cos(an)*r),d.h+0.2+GY(d.x,d.y),tz(d.y+Math.sin(an)*r));P.push(_tw.clone());}tboltP(P,0.12,0.1,0.05);}
    // ลูกสายฟ้าค้างกลางโดม: สั่น + สายฟ้าพันรอบ + สายฟ้าลงพื้น
    {const ob=d.orb;ob.position.set(tx(d.x)+rnd(-0.08,0.08),d.h+1.3+GY(d.x,d.y)+rnd(-0.08,0.08),tz(d.y)+rnd(-0.08,0.08));ob.scale.setScalar(0.9+0.15*Math.sin(performance.now()/40));
      for(let j=0;j<3;j++){const a1=rnd(0,6.283),e1=rnd(-1,1),q=shellPt(d.x,d.y,d.h+1.3,20,a1,e1),q2=shellPt(d.x,d.y,d.h+1.3,20,a1+rnd(1.2,2.8),-e1);tbolt(q[0],q[1],q[2],q2[0],q2[1],q2[2],0.05,0,0.08,j===0?1:0);}
      if(Math.random()<0.4){const an=rnd(0,6.283),r=rnd(30,d.r*0.8);tbolt(d.x,d.y,d.h+1.3,d.x+Math.cos(an)*r,d.y+Math.sin(an)*r,d.h+0.1,0.08,0,0.1);}
      LREQ.push({x:tx(d.x),y:d.h+1.3,z:tz(d.y),col:'#ffd23a',int:3,dist:12});}
    // พื้นพลังงานยุบเข้ากลาง: วงซ้อนหดจากขอบเข้าหากลางวนไปเรื่อยๆ + หลุมมืดตรงกลาง
    {const tt=(d.max-d.t);for(const r of d.rings){const k=1-((tt*0.9+r.userData.ph)%1);r.scale.setScalar(Math.max(0.02,d.r*S3*k));r.material.opacity=0.6*(1-k*0.3)*Math.min(1,d.t*3);}
      d.pit.scale.setScalar(d.r*S3*(0.15+0.25*Math.min(1,tt/d.max)));d.pit.material.opacity=0.35*Math.min(1,d.t*3);d.m.scale.set(1,1-0.25*Math.min(1,tt/d.max),1);}
    if(d.t<=0){for(const m of [d.m,d.w,d.pit,...d.rings]){scene.remove(m);m.geometry.dispose();m.material.dispose();}scene.remove(d.orb);SDV.splice(i,1);}}
  // วงรูนเตือนฟ้าผ่าสามครั้ง: หมุน + ขีดรูนหุบเข้ากลางก่อนแต่ละครั้ง + วาบตอนฟ้าผ่า
  for(let i=TSV.length-1;i>=0;i--){const v=TSV[i];v.age+=dt;if(v.tgt){const k=Math.min(1,dt*10),p=v.g.position;p.x+=(tx(v.tgt[0])-p.x)*k;p.z+=(tz(v.tgt[1])-p.z)*k;p.y+=(v.tgt[2]+0.07+GY(v.tgt[0],v.tgt[1])-p.y)*k;}
    /* วงเลื่อนหาศัตรู (host ส่ง tsmv) */const U=v.g.userData,T=[0.6,1.1,1.6];let nx=T.find(t=>t>v.age),prev=[0,...T].filter(t=>t<=v.age).pop()||0;
    if(nx===undefined){v.g.visible=v.age<1.85;if(v.age>=1.85){scene.remove(v.g);v.g.traverse(o=>{if(o.geometry)o.geometry.dispose();});U.mats.forEach(m=>m.dispose());TSV.splice(i,1);}continue;}
    const conv=clamp((v.age-prev)/(nx-prev),0,1),now=performance.now();
    v.g.rotation.y=v.age*1.6;U.mats[0].opacity=0.75+0.25*Math.sin(now/60);U.mats[1].opacity=0.12+0.2*conv;
    U.inner.scale.setScalar(Math.max(0.05,1-conv*0.95));U.mats[2].opacity=0.4+0.6*conv;
    U.runes.forEach(r=>{const an=r.userData.a,rr=lerp(0.85,0.12,conv);r.position.set(Math.cos(an)*rr,0.01,Math.sin(an)*rr);r.rotation.z=-an;r.scale.set(1,1+conv*2,1);});}
}
// ภาพเฉพาะตัวสายฟ้า + อาการ Shock ของทุกคน (โคลงตัว ไม่สั่นกล้อง)
const _ev=new THREE.Vector3();
// จุดบนร่าง (พิกัดใน o.b) สำหรับสายฟ้าวิ่งทั่วตัว
const GODPTS=[[0,1.95,0.05],[0.12,1.8,0.12],[-0.12,1.8,0.12],[0,1.5,0.18],[0.25,1.45,0],[-0.25,1.45,0],[0,1.2,0.2],[0.2,1.1,0],[-0.2,1.1,0],[0,0.9,0.15],[0.12,0.55,0.05],[-0.12,0.55,0.05],[0.12,0.1,0.08],[-0.12,0.1,0.08],[0,1.3,-0.2],[0.4,1.15,0.1],[-0.4,1.15,0.1]];

function bWorld(o,x,y,z){_ev.set(x,y,z);o.b.localToWorld(_ev);return simOf(_ev);}
// แขนปาดกรงเล็บ + รอยข่วนตามปลายใบมีด 3 เล่ม (ผู้ใช้ 2026-10-20: "รอยต้องตามกรงเล็บตอนปาด")
// รอบ 2026-10-21 (ผู้ใช้ส่งรูปตัวอย่าง): รอยข่วน = เส้นเรืองบางเรียวหัวท้าย ขนานกัน 3 เส้น (แกนขาว + ฟุ้งเหลือง) + ประกายเม็ดเล็กโปรยตามรอย
// n 0 = แขนขวาปาดเฉียงลง • 1 = แขนซ้าย • 2 = สองแขนฟาดลงจากบน • 3 = สองแขนกวาดแนวนอนขวา→ซ้าย (ท่าเสริม; รอยกวาดใหญ่ = storm/claw_sweep ใน bind.json)
function stormClawSwipe(o,dt){const S=o.clSw,n=S.n,emp=n===3;S.t+=dt;const k=Math.min(1,S.t/S.dur),e=1-Math.pow(1-k,2.2),R=o.armR,L=o.armL;
  if(n===0){R.rotation.x=lerp(-2.8,-0.45,e);R.rotation.z=lerp(-1.0,0.95,e);}
  else if(n===1){L.rotation.x=lerp(-2.8,-0.45,e);L.rotation.z=lerp(1.0,-0.95,e);}
  else if(n===2){R.rotation.x=L.rotation.x=lerp(-3.05,-0.25,e);R.rotation.z=-0.2;L.rotation.z=0.2;}
  else{R.rotation.x=L.rotation.x=-1.45;R.rotation.z=lerp(-1.7,1.1,e);L.rotation.z=lerp(-0.9,1.7,e);}
  // ตัวบิดตามแรงปาด (ผู้ใช้ 2026-10-22: "claw … not even move the body make it บิดตัวไปมาเพิ่มขึ้น") — ง้าง → ฟาดเลย → คืน
  // [บิดตอนง้าง, บิดตอนตามแรง, โน้มหน้าสุด, เอียงข้าง, ย่อ, ก้าวขา] ของท่า 0 ขวา / 1 ซ้าย / 2 สองแขนฟาดลง / 3 กวาดแนวนอน
  {const P=[[-0.65,0.75,0.32,0.16,0.14,0.9],[0.65,-0.75,0.32,-0.16,0.14,0.9],[0,0,0.55,0,0.26,1],[0.95,-1.05,0.22,-0.1,0.16,0.7]][n],
    w=k<0.08?k/0.08:k>0.8?1-(k-0.8)/0.2:1,bell=Math.sin(Math.min(1,e*1.15)*Math.PI);
    o.b.rotation.y=lerp(P[0],P[1],e)*w;o.b.rotation.x+=(n===2?lerp(-0.22,P[2],e):P[2]*bell)*w;o.b.rotation.z=P[3]*bell*w;o.bz=1;o.b.position.y-=P[4]*bell*w;
    if((o.vsp||0)<0.6){o.legs[1].rotation.x=-0.5*P[5]*bell*w;o.legs[0].rotation.x=0.35*P[5]*bell*w;}}
  const act=n===0?[o.claws[0]]:n===1?[o.claws[1]]:o.claws,B=STCLAW.blades;
  if(!S.tr){S.tr=[];for(const c of act)for(let b=0;b<3;b++)S.tr.push({c,b,
    g:trailNew({col:'#ffd23a',col2:'#ff9000',w:emp?0.2:0.15,life:emp?0.36:0.32,k:emp?1.1:0.9}),
    h:trailNew({col:'#ffffff',col2:'#fff0a0',w:emp?0.065:0.05,life:emp?0.32:0.28,k:emp?2.2:1.9})});}
  if(k<1){o.g.updateMatrixWorld(true);
    // จุดปลายใบ (ยื่นเลยปลายไปตามแนวใบ + กางห่างกันขึ้นให้เห็นเป็นเส้นขนาน)
    for(const T of S.tr){const q0=B[T.b][1],q1=B[T.b][2],ex=emp?0.7:0.45,sp=1.7;
      _tw.set((q1[0]+(q1[0]-q0[0])*ex)*sp,q1[1]+(q1[1]-q0[1])*ex,q1[2]+(q1[2]-q0[2])*ex);T.c.localToWorld(_tw);
      trailPoint(T.g,_tw.x,_tw.y,_tw.z);trailPoint(T.h,_tw.x,_tw.y,_tw.z);}
    // ประกายเม็ดเล็กโปรยตามรอยที่เพิ่งปาดผ่าน (ลอยออกช้า ๆ)
    for(const T of S.tr){const P=T.h.pts;if(P.length<2)continue;for(let j=0;j<(emp?2:1);j++){const p=P[Math.max(0,P.length-1-((Math.random()*6)|0))],q=simOf(_tw.set(p.x,p.y,p.z));
      PARTS.push({x:q.x+rnd(-5,5),y:q.y+rnd(-5,5),h:q.h+rnd(-0.12,0.12),vx:rnd(-35,35),vy:rnd(-35,35),vh:rnd(-0.3,1.2),life:rnd(0.25,0.5),max:0.5,col:Math.random()<0.45?'#ffffff':Math.random()<0.5?'#ffe066':'#ffb000',size:rnd(1,emp?2:1.6),g:0.6});}}
    // สายฟ้าเส้นเล็กแลบตามรอยเป็นครั้งคราว
    S.bt=(S.bt||0)-dt;if(S.bt<=0){S.bt=emp?0.05:0.08;const T=S.tr[(Math.random()*S.tr.length)|0],P=T.h.pts.slice(-6).map(p=>new THREE.Vector3(p.x,p.y,p.z));
      if(P.length>=3)tboltP(P,0.035,emp?0.05:0.035,0.03).gk=0.3;}}
  if(S.t>=S.dur+0.04){for(const T of S.tr||[]){trailStop(T.h);trailStop(T.g);}o.clSw=null;}}
function stormFX(o,p,pz,now,dt){
  if((p.fm|0)&16){o.b.rotation.z+=Math.sin(now/22)*0.2;o.b.rotation.x+=Math.sin(now/31)*0.08;}
  const M=p.sm;
  if(!M){if(o.sOrbs)o.sOrbs.forEach(q=>q.visible=false);if(o.railC)o.railC.visible=false;if(o.godG)o.godG.visible=false;if(o.godEyes)o.godEyes.forEach(e=>e.visible=false);if(o.stG)o.stG.visible=false;if(o.claws)o.claws.forEach(c=>c.visible=false);return;}
  const f=M[3]|0,isMe=p.id===NET.myId,god=!!(f&4);
  // ลำสายฟ้า (กดค้าง): สายฟ้าหนาจากปลายไม้ไปทุกเป้าที่ล็อก
  if(f&1&&!god){if(!o.bmFx)o.bmFx=fxPlay('storm/beam_b',{x:p.x,y:p.y,h:pz,follow:p.id});}else if(o.bmFx){fxStop(o.bmFx);o.bmFx=null;}
  if(f&1&&!god){
    // ท่ายิงลำแสงแบบดวลในหนัง (Priori Incantatem): แขนขวายื่นตรงเกร็ง มือซ้ายจับข้อมือประคอง ตัวเอนหลังต้านแรง ไหล่ขวาออก ขากาง • สั่นตลอด
    {const tr=Math.sin(now/31)*0.06+Math.sin(now/53)*0.035;o.armR.rotation.x=-1.5+tr;o.armR.rotation.z=-0.05+tr*0.5;o.armL.rotation.x=-1.3+tr;o.armL.rotation.z=-0.42;
      o.b.rotation.y=0.28+Math.sin(now/260)*0.08;o.b.rotation.x-=0.1+Math.sin(now/170)*0.03;o.b.position.y-=0.05;   // ยิงลำค้าง: ตัวโยกต้านแรง ไม่นิ่ง
     if((o.vsp||0)<0.6){o.legs[1].rotation.x=-0.3;o.legs[0].rotation.x=0.25;o.legs[1].rotation.z=0.12;o.legs[0].rotation.z=-0.12;}}
    o.bmT=(o.bmT||0)-dt;
    if(o.bmT<=0){o.bmT=0.05;o.tip.getWorldPosition(_pw);const q=simOf(_pw),T=M[7]||[];
      if(T.length)for(const t of T){tbolt(q.x,q.y,q.h,t[0]+rnd(-5,5),t[1]+rnd(-5,5),t[2]+rnd(-0.2,0.3),0.07,0,0.1,Math.random()<0.4?1:0);
        for(let j=0;j<4;j++)PARTS.push({x:t[0]+rnd(-6,6),y:t[1]+rnd(-6,6),h:t[2]+rnd(-0.3,0.3),vx:rnd(-90,90),vy:rnd(-90,90),vh:rnd(0,4),life:0.22,max:0.22,col:j%2?'#ffd000':'#ffffff',size:rnd(1.8,2.8),g:6});}
      else for(let j=0;j<2;j++){const a=(p.a||0)+rnd(-0.55,0.55),d=rnd(55,100);tbolt(q.x,q.y,q.h,q.x+Math.cos(a)*d,q.y+Math.sin(a)*d,q.h+rnd(-0.6,0.4),0.06,0,0.1,1);}
      LREQ.push({abs:1,x:_pw.x,y:_pw.y,z:_pw.z,col:'#ffd23a',int:2.5,dist:8});}
    o.bmS=(o.bmS||0)-dt;if(o.bmS<=0){o.bmS=0.4;snd('zap',{x:p.x,y:p.y,vol:isMe?0.35:0.2});}
  }
  // ยิงครั้งถัดไปเป็นสายฟ้าสามเหลี่ยม: ประกายเหลืองที่ปลายไม้
  if(M[1]&&!god&&Math.random()<0.5){o.tip.getWorldPosition(_pw);const q=simOf(_pw);PARTS.push({x:q.x+rnd(-4,4),y:q.y+rnd(-4,4),h:q.h,vx:rnd(-20,20),vy:rnd(-20,20),vh:rnd(0.5,2),life:0.3,max:0.3,col:Math.random()<0.5?'#ffd000':'#ffffff',size:2.4,g:-1});}
  // โล่สายฟ้า: เปลือกสายฟ้าแตกแขนงล้อมตัว สีเหลืองตลอด ยิ่งดูดมากยิ่งแลบถี่
  if(f&2){o.shield.visible=false;const k=Math.min(1,(M[4]||0)/90),R=30,hc=pz+1.15;
    for(let j=0;j<4+Math.round(k*5);j++){const a1=rnd(0,6.283),e1=rnd(-0.9,1.2),q=shellPt(p.x,p.y,hc,R,a1,e1),q2=shellPt(p.x,p.y,hc,R,a1+rnd(0.6,1.4),e1+rnd(-0.7,0.7));tbolt(q[0],q[1],q[2],q2[0],q2[1],q2[2],0.1,0,0.08+0.05*k,k>0.4?1:0);}
    if(!o.stG){o.stG=new THREE.Sprite(glowMat('#ffd23a',0.5));o.stG.material.userData.keep=true;o.stG.position.y=1.15;o.g.add(o.stG);}
    o.stG.visible=true;o.stG.scale.setScalar(1.9+0.15*Math.sin(now/50));
    LREQ.push({x:tx(p.x),y:pz+1.2,z:tz(p.y),col:'#ffd23a',int:1.6+2*k,dist:8});
  }else if(o.stG)o.stG.visible=false;
  // Dash: สายฟ้าหนาหุ้มตัว + เงาติดตา + ร่องสายฟ้าแตกกิ่งที่จางเร็ว
  if(p.ds){const pv=o.dPrev||[p.x,p.y];
    for(let j=0;j<2;j++){const a1=rnd(0,6.283),q=shellPt(p.x,p.y,pz+0.3,20,a1,rnd(-0.3,0.3)),q2=shellPt(p.x,p.y,pz+2,20,a1+rnd(2,4),rnd(-0.3,0.3));tbolt(q[0],q[1],q[2],q2[0],q2[1],q2[2],0.06,0,0.13);}
    if(Math.hypot(p.x-pv[0],p.y-pv[1])>4)tbolt(pv[0],pv[1],pz+1+rnd(-0.4,0.4),p.x,p.y,pz+1+rnd(-0.4,0.4),0.22,0,0.16,2);
    FX.flashSprite(p.x,p.y,pz+1.1,'#ffd23a',1.9,1.3,0.16,1.4);
    LREQ.push({x:tx(p.x),y:pz+1,z:tz(p.y),col:'#ffd23a',int:3,dist:9});}
  o.dPrev=[p.x,p.y];
  // ร่างเทพสายฟ้า (รอบปรับ 2026-10-19: กรงเล็บเข้มจากไฟล์ Blender + สายฟ้าวิ่งตามใบมีดตลอด • ตาแบบเดกุ: ตาสว่าง + สายฟ้าลากเป็นหางออกด้านข้าง/หลัง • ลดแสงเรือง)
  if(god){
    if(!o.godG){o.godG=new THREE.Sprite(glowMat('#ffb800',0.22));o.godG.material.userData.keep=true;o.godG.position.y=1.2;o.g.add(o.godG);}
    o.godG.visible=true;o.godG.scale.set(1.3+0.1*Math.sin(now/90),2.1+0.15*Math.sin(now/70),1);
    // ตัวละครยังเป็นตัวเดิม (ไม่เปลี่ยนสี/ไม่ถอดผ้าคลุม) — มีแค่สายฟ้าวิ่งรอบ/ทั่วร่าง
    for(let j=0;j<2;j++){const A=GODPTS[(Math.random()*GODPTS.length)|0],B=GODPTS[(Math.random()*GODPTS.length)|0];if(A===B)continue;const wA=A[1]<1.4?2.4:1.5,wB=B[1]<1.4?2.4:1.5,a=bWorld(o,A[0]*wA,A[1],A[2]*wA+0.05),b=bWorld(o,B[0]*wB,B[1],B[2]*wB+0.05);tbolt(a.x,a.y,a.h,b.x,b.y,b.h,0.05,0,0.07).gk=0.5;}
    if(o.godUp>0){o.godUp-=dt;o.armR.rotation.x=-3.05;o.armR.rotation.z=-0.1;}
    // ดวงตาแบบเดกุ: แกนตาขาวเหลืองเล็กคม + หางสายฟ้าลากจากหางตาออกไปด้านข้าง-หลัง (ตามตำแหน่งย้อนหลังของตา ยิ่งขยับยิ่งยาว) + สายฟ้าแลบสั้นจากตา
    if(!o.godEyes){o.godEyes=[-1,1].map(sd=>{const e=new THREE.Sprite(glowMat('#fff2a0',1.6));e.material.userData.keep=true;e.scale.setScalar(0.11);e.position.set(sd*0.085,1.865,0.24);o.b.add(e);
        const c=new THREE.Mesh(new THREE.SphereGeometry(0.03,8,6),new THREE.MeshBasicMaterial({color:'#fffbe0'}));c.scale.set(1.5,0.8,0.6);e.userData.core=c;c.position.set(sd*0.085,1.865,0.245);o.b.add(c);return e;});o.eyeH=[[],[]];}
    o.godEyes.forEach(e=>{e.visible=e.userData.core.visible=true;e.scale.setScalar(0.1+0.03*Math.random());});
    [-1,1].forEach((sd,i)=>{const e=bWorld(o,sd*0.085,1.865,0.24),H=o.eyeH[i];_tw.set(tx(e.x),e.h+GY(e.x,e.y),tz(e.y));H.unshift(_tw.clone());if(H.length>9)H.length=9;
      // หางตา: เริ่มที่ตา แล้วโค้งออกข้างและไปด้านหลัง (ต่อให้ยืนนิ่งก็ยังเห็น) — หนา ทึบ แสงเรืองน้อย
      const side=_tt.set(sd,0,0).applyQuaternion(o.g.quaternion).clone(),back=_tv.set(0,0,-1).applyQuaternion(o.g.quaternion).clone(),P=[];
      for(let k=0;k<H.length;k++){const u=k/8,q=H[k].clone().addScaledVector(side,0.07+u*0.38+0.03*Math.sin(now/45+k)).addScaledVector(back,u*0.55);q.y+=u*0.12+0.025*Math.sin(now/30+k*1.7);P.push(q);}
      if(P.length>=3)tboltP(P,0.035,0.085,0.035).gk=0.35;
      // แลบซิกแซกจากตาออกด้านข้าง (ยาวขึ้น ชัดขึ้น)
      if(Math.random()<0.7){const e2=bWorld(o,sd*rnd(0.7,1.15),1.865+rnd(-0.06,0.2),rnd(-0.35,0.05));tbolt(e.x,e.y,e.h,e2.x,e2.y,e2.h,0.05,0,0.075,Math.random()<0.3?1:0).gk=0.35;}});
    // สายฟ้าด้านหลังชี้ขึ้นเฉียง 45°
    if(Math.random()<0.5){const bk=bWorld(o,0,1.55,-0.28);for(const [sx,sy,sz] of [[-0.7,2.35,-0.95],[0.7,2.35,-0.95],[0,2.6,-1.05]]){const e=bWorld(o,sx+rnd(-0.08,0.08),sy+rnd(-0.08,0.08),sz);tbolt(bk.x,bk.y,bk.h,e.x,e.y,e.h,0.05,0,0.1,Math.random()<0.3?1:0).gk=0.6;}}
    // หางสายฟ้า: ตามตำแหน่งย้อนหลัง พริ้ว/สั่น
    {_tw.set(0,0.95,-0.3);o.b.localToWorld(_tw);const H=o.tailH||(o.tailH=[]);H.unshift(_tw.clone());if(H.length>14)H.length=14;
      if(H.length>=4){const P=H.map((v,i)=>v.clone().add(_tv.set(Math.sin(now/70+i*0.9)*0.06*i,Math.sin(now/90+i)*0.05*i-0.03*i,Math.cos(now/80+i*0.7)*0.06*i)));
        // หางยื่นออกไปด้านหลังเสมอแม้ยืนนิ่ง
        const back=_tt.set(0,0,-1).applyQuaternion(o.g.quaternion);for(let i=0;i<P.length;i++)P[i].addScaledVector(back,0.09*i);
        tboltP(P,0.04,0.2,0.05).gk=0.6;}}
    // กรงเล็บ: สนับมือ + ใบมีดโค้ง 3 เล่มสีเข้ม คมเหลือง (ไฟล์ mesh_storm_claw) — ไฟล์ยังไม่มา = กรงเล็บกรวยจากโค้ดชั่วคราว
    if(o.claws&&o.claws.fb&&MODELS.ready.get('mesh_storm_claw')){o.claws.forEach(c=>{c.parent.remove(c);disposeTree(c);});o.claws=null;}
    if(!o.claws){const file=!!MODELS.ready.get('mesh_storm_claw');if(!file&&!MODELS.fail.has('mesh_storm_claw'))loadModel('mesh_storm_claw');
      o.claws=[o.armR,o.armL].map((A,ai)=>{const g=new THREE.Group();g.position.set(0,-0.66,0.02);
        if(file){const m=modelInst('mesh_storm_claw');m.traverse(q=>{if(!q.isMesh)return;q.castShadow=true;q.receiveShadow=false;const nm=(q.material&&q.material.name)||'';
            q.material=nm.includes('edge')?STCLAW.edge:nm.includes('metal')?STCLAW.metal:STCLAW.dark;});
          m.scale.setScalar(0.95);g.add(m);}
        else{const bm=new THREE.MeshBasicMaterial({color:'#2a2418'}),cm=new THREE.MeshBasicMaterial({color:'#ffc400'});
          for(let i=0;i<3;i++){const bl=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.85,4),bm);bl.position.set((i-1)*0.09,-0.4,0.08);bl.rotation.set(Math.PI+0.45,0,(i-1)*0.42);bl.scale.z=0.35;g.add(bl);
            const cr=new THREE.Mesh(new THREE.ConeGeometry(0.02,0.7,4),cm);cr.position.copy(bl.position);cr.rotation.copy(bl.rotation);g.add(cr);}}
        A.add(g);return g;});o.claws.fb=!file;}
    o.claws.forEach(c=>{c.visible=true;});
    if(o.clSw)stormClawSwipe(o,dt);
    else{o.b.rotation.x+=0.14+Math.sin(now/280)*0.035;o.b.rotation.y=Math.sin(now/520)*0.16;o.b.position.y-=0.05;o.armR.rotation.z-=0.18+Math.sin(now/240)*0.05;o.armL.rotation.z+=0.18+Math.sin(now/260)*0.05;}   // ร่างเทพ: ยืนหลังค่อมแบบสัตว์ล่า โยกตัวไปมา กางกรงเล็บ
    if(o.wandG)o.wandG.visible=false;o.tip.visible=false;
    // สายฟ้าวิ่งไปตามใบมีดตลอดเวลา (โคน → กลาง → ปลาย) + ประกายกระโดดข้ามปลายใบมีด — บาง ทึบ แสงเรืองน้อย
    o.clawT=(o.clawT||0)-dt;
    if(o.clawT<=0){o.clawT=0.03;
      for(const c of o.claws){const B=STCLAW.blades,mir=1,cw=(q)=>{_tw.set(q[0]*mir*0.95,q[1]*0.95,q[2]*0.95);c.localToWorld(_tw);return _tw;};
        for(let j=0;j<2;j++){const b=B[(Math.random()*3)|0],P=b.map(q=>cw(q).clone());tboltP(P,0.05,0.035,0.02).gk=0.3;}
        if(Math.random()<0.35){const i1=(Math.random()*3)|0,i2=(i1+1+((Math.random()*2)|0))%3,q1=simOf(cw(B[i1][2])),q2=simOf(cw(B[i2][2]));tbolt(q1.x,q1.y,q1.h,q2.x,q2.y,q2.h,0.05,0,0.03).gk=0.3;}
        if(Math.random()<0.25){const q=simOf(cw(B[(Math.random()*3)|0][2]));tbolt(q.x,q.y,q.h,q.x+rnd(-12,12),q.y+rnd(-12,12),q.h-rnd(0.2,0.6),0.05,0,0.04).gk=0.3;}}}
    // ร่องรอยสายฟ้าตามทางเดิน
    const lp=o.gLast||[p.x,p.y];if(Math.hypot(p.x-lp[0],p.y-lp[1])>18){tbolt(lp[0],lp[1],pz+0.12,p.x,p.y,pz+0.12,0.35,0,0.1,1).gk=0.6;o.gLast=[p.x,p.y];}else if(!o.gLast)o.gLast=[p.x,p.y];
    for(let i=0;i<2;i++)PARTS.push({x:p.x+rnd(-14,14),y:p.y+rnd(-14,14),h:pz+rnd(0,2.4),vx:rnd(-15,15),vy:rnd(-15,15),vh:rnd(1,3),life:rnd(0.3,0.5),max:0.5,col:i?'#ffd000':'#ffffff',size:rnd(1.6,2.6),g:-1.5});
    LREQ.push({x:tx(p.x),y:pz+1.5,z:tz(p.y),col:'#ffd23a',int:2.2,dist:10});
  }else{if(o.godG)o.godG.visible=false;if(o.godEyes)o.godEyes.forEach(e=>{e.visible=false;e.userData.core.visible=false;});if(o.eyeH)o.eyeH=[[],[]];if(o.claws){o.claws.forEach(c=>c.visible=false);if(o.wandG&&!o.wandG.visible&&!p.fr)o.wandG.visible=true;o.tip.visible=true;}o.tailH=null;o.gLast=null;}
  // เส้นสายฟ้า: ชูไม้ขึ้น 0.3 วิ แล้วกดลง 0.2 วิ
  if(f&8){if(!o.slOn)o.slOn=now;const el=(now-o.slOn)/1000;o.armR.rotation.x=el<0.3?lerp(-0.4,-3.05,el/0.3):lerp(-3.05,-0.8,Math.min(1,(el-0.3)/0.2));o.armR.rotation.z=-0.1;
    o.tip.getWorldPosition(_pw);const q=simOf(_pw);for(let i=0;i<2;i++)PARTS.push({x:q.x+rnd(-5,5),y:q.y+rnd(-5,5),h:q.h,vx:rnd(-30,30),vy:rnd(-30,30),vh:rnd(-1,2),life:0.25,max:0.25,col:i?'#ffd000':'#ffffff',size:2.6,g:0});
    if(el<0.3&&Math.random()<0.5)tbolt(q.x+rnd(-6,6),q.y+rnd(-6,6),q.h+4,q.x,q.y,q.h,0.06,0,0.12);}
  else o.slOn=0;
  // Railgun: ยืนนิ่ง • เส้นนำทางเหลืองแกนขาวลอยกลางอากาศ — หัวนำวิ่งออกไปก่อน (0.25 วิ) แล้วเส้นค้างรอยิง • วงเวทหน้าไม้
  const R=M[6];
  if(f&16&&R){
    if(!o.rlOn)o.rlOn=now;const el=(now-o.rlOn)/1000,a=R[0],len=R[2],k=1-Math.max(0,R[1])/(R[3]||0.8),g=Math.min(1,el/0.25);
    o.tip.getWorldPosition(_pw);const q=simOf(_pw),ex=q.x+Math.cos(a)*len*g,ey=q.y+Math.sin(a)*len*g,P=[];
    for(let i=0;i<8;i++){const t=i/7;_tw.set(tx(lerp(q.x,ex,t)),q.h+GY(q.x,q.y),tz(lerp(q.y,ey,t)));P.push(_tw.clone());}
    tboltP(P,0.03,0.05+0.06*k,0.015);
    FX.flashSprite(ex,ey,q.h,'#fff7b0',0.9,0.6,0.05,2.2);
    if(!o.railC){o.railC=new THREE.Mesh(new THREE.RingGeometry(0.5,0.72,6),new THREE.MeshBasicMaterial({color:'#ffd000',transparent:true,opacity:0.9,depthWrite:false,side:THREE.DoubleSide}));scene.add(o.railC);(o.g.userData.extra||(o.g.userData.extra=[])).push(o.railC);}
    o.railC.visible=true;o.railC.position.set(tx(p.x+Math.cos(a)*40),pz+1.25+GY(p.x,p.y),tz(p.y+Math.sin(a)*40));o.railC.rotation.set(0,-a+Math.PI/2,now/120);o.railC.scale.setScalar(0.8+0.7*k);
    if(Math.random()<0.6){const c=simOf(o.railC.position),an=rnd(0,6.283);tbolt(c.x+Math.cos(an)*rnd(8,16),c.y+Math.sin(an)*rnd(8,16),c.h+rnd(-0.6,0.6),c.x,c.y,c.h,0.05,0,0.06);}
    o.armR.rotation.x=-1.55;o.armL.rotation.x=-1.4;o.armL.rotation.z=0.4;
  }else{o.rlOn=0;if(o.railC)o.railC.visible=false;}
  // ออร์บสายฟ้าคู่: ลูกบอลที่ก่อจากสายฟ้า แกนขาว สายฟ้าหนาพันรอบ สั่นตลอด
  const n=M[5]|0;
  if(n>0||o.sOrbs){
    if(!o.sOrbs){o.sOrbs=[0,1].map(()=>{const g=new THREE.Group(),a1=new THREE.Sprite(glowMat('#ffc400',0.8)),a2=new THREE.Sprite(glowMat('#fff7d0',1.6));a1.material.userData.keep=true;a2.material.userData.keep=true;a1.scale.setScalar(1.05);a2.scale.setScalar(0.42);g.add(a1,a2);o.g.add(g);return g;});}
    o.sOrbs.forEach((g,i)=>{g.visible=i<n;if(!g.visible)return;const sd=i?1:-1;g.position.set(sd*0.65+rnd(-0.04,0.04),1.95+Math.sin(now/260+i*2)*0.12+rnd(-0.04,0.04),-0.55+rnd(-0.04,0.04));
      g.getWorldPosition(_pw);const c=simOf(_pw);
      for(let j=0;j<3;j++){const a1=rnd(0,6.283),e1=rnd(-1,1),q=shellPt(c.x,c.y,c.h,10,a1,e1),q2=shellPt(c.x,c.y,c.h,10,a1+rnd(1.5,3),-e1);tbolt(q[0],q[1],q[2],q2[0],q2[1],q2[2],0.05,0,0.065);}});
  }
}
// UI Storm: ไอคอน Lightning stack ขนาดใหญ่ขึ้นอยู่ใต้เป้าเล็ง; Dash gauge แยกไปทางขวา
const STHUD={prev:0,fl:[0,0,0,0,0],flow:[],t:performance.now(),dprev:3,dfl:[0,0,0]};
function drawStormHud(x,y,M){
  const now=performance.now(),dt=Math.min(0.1,(now-STHUD.t)/1000);STHUD.t=now;
  const n=M[0]|0;if(n>STHUD.prev)for(let i=STHUD.prev;i<n&&i<5;i++){STHUD.fl[i]=0.35;STHUD.flow.push({i,t:0});}STHUD.prev=n;
  const bolt=(cx0,cy0,s)=>{cx.beginPath();cx.moveTo(cx0+4*s,cy0-12*s);cx.lineTo(cx0+0.5*s,cy0-4*s);cx.lineTo(cx0+5*s,cy0-5*s);cx.lineTo(cx0+0.2*s,cy0+1.5*s);cx.lineTo(cx0+2.5*s,cy0+0.5*s);cx.lineTo(cx0-4*s,cy0+12*s);cx.lineTo(cx0-2*s,cy0+4*s);cx.lineTo(cx0-6*s,cy0+5*s);cx.lineTo(cx0-1.2*s,cy0-2.5*s);cx.lineTo(cx0-4.5*s,cy0-1.8*s);cx.lineTo(cx0+1*s,cy0-10*s);cx.closePath();};
  const boltGlint=(cx0,cy0,s)=>{cx.beginPath();cx.moveTo(cx0+1.4*s,cy0-9*s);cx.lineTo(cx0-1.2*s,cy0-3*s);cx.lineTo(cx0+1.3*s,cy0-3.5*s);cx.lineTo(cx0-1.8*s,cy0+3*s);};
  const y0=y+67,gap=22;
  cx.save();
  // ประกายวิ่งตามแนวแถวไปเติมไอคอนที่เพิ่งได้
  for(let j=STHUD.flow.length-1;j>=0;j--){const f=STHUD.flow[j];f.t+=dt;const k=clamp(f.t/0.22,0,1),sx=x+(f.i===0?-2.85:(f.i-3))*gap,ex=x+(f.i-2)*gap,px=lerp(sx,ex,k),py=y0-Math.sin(k*Math.PI)*3;
    cx.shadowColor='#fff27a';cx.shadowBlur=8;cx.strokeStyle='rgba(255,213,46,0.95)';cx.lineWidth=1.5;cx.lineCap='round';cx.beginPath();cx.moveTo(sx,y0);cx.lineTo((sx+px)*0.5,y0-3);cx.lineTo(px,py);cx.stroke();
    cx.fillStyle='#ffffff';cx.beginPath();cx.moveTo(px,py-2.8);cx.lineTo(px+2.2,py);cx.lineTo(px,py+2.8);cx.lineTo(px-2.2,py);cx.closePath();cx.fill();cx.shadowBlur=0;
    if(k>0.9){cx.strokeStyle='rgba(255,244,170,0.9)';cx.lineWidth=1;for(let a=0;a<4;a++){const an=a*Math.PI/2;cx.beginPath();cx.moveTo(ex+Math.cos(an)*3,y0+Math.sin(an)*3);cx.lineTo(ex+Math.cos(an)*6,y0+Math.sin(an)*6);cx.stroke();}}
    if(k>=1)STHUD.flow.splice(j,1);}
  for(let i=0;i<5;i++){
    const on=i<n,fl=STHUD.fl[i]=Math.max(0,STHUD.fl[i]-dt),s=1+fl*0.65;
    let bx=x+(i-2)*gap,by=y0;
    if(on){bx+=rnd(-0.65,0.65);by+=rnd(-0.65,0.65);}
    bolt(bx,by,1.18*s);
    if(on){cx.shadowColor='#ffbd16';cx.shadowBlur=11+fl*30;const grad=cx.createLinearGradient(bx,by-14*s,bx,by+14*s);grad.addColorStop(0,'#fff5cf');grad.addColorStop(0.25,'#ffd52e');grad.addColorStop(0.68,'#ffad08');grad.addColorStop(1,'#ffe36a');cx.fillStyle=grad;cx.fill();cx.lineWidth=1.25;cx.strokeStyle='#c46d08';cx.stroke();cx.shadowBlur=0;
      // เส้นไฮไลต์ขาวคม ๆ ตามแนวสายฟ้า อิงภาพอ้างอิง
      boltGlint(bx,by,1.18*s);cx.lineCap='round';cx.lineJoin='round';cx.lineWidth=1.1*s;cx.strokeStyle='rgba(255,249,225,0.95)';cx.stroke();
      if(Math.random()<0.42){const a=rnd(0,6.283);cx.strokeStyle='rgba(255,250,200,0.98)';cx.lineWidth=1.2;cx.beginPath();cx.moveTo(bx,by);cx.lineTo(bx+Math.cos(a)*10+rnd(-1,1),by+Math.sin(a)*10);cx.lineTo(bx+Math.cos(a)*16,by+Math.sin(a)*16+rnd(-1,1));cx.stroke();}}
    else{cx.fillStyle='rgba(68,65,58,0.85)';cx.fill();cx.lineWidth=1;cx.strokeStyle='rgba(22,20,18,0.9)';cx.stroke();}
  }
  // ยิงครั้งถัดไป = สายฟ้าสามเหลี่ยม
  if(M[1]){const tx0=x-3*gap-8,ty0=y0;cx.beginPath();cx.moveTo(tx0-5,ty0-6);cx.lineTo(tx0+6,ty0);cx.lineTo(tx0-5,ty0+6);cx.closePath();cx.shadowColor='#fff27a';cx.shadowBlur=8;cx.fillStyle='#fff27a';cx.fill();cx.shadowBlur=0;}
  // ชาร์จ Dash แบบ Tracer: แถบโค้ง 3 ช่องแยกออกไปทางขวา ไม่ซ้อนกับแถว Lightning stack
  // ใช้ Dash แล้วหายจากบนลงล่าง (ชาร์จที่ i สูงอยู่บน) • ฟื้นจากล่างขึ้นบน
  const dc=M[2]||0,full=Math.floor(dc+1e-6);if(full>STHUD.dprev)for(let i=STHUD.dprev;i<full&&i<3;i++)STHUD.dfl[i]=0.3;STHUD.dprev=full;
  const hx=x+62,hy=y,R=42,seg=0.5,gp=0.09,a0=-(seg*3+gp*2)/2;
  const zig=(s0,len,amp,rr0)=>{const n=Math.max(3,Math.round(len/0.045));const P=[];cx.beginPath();for(let j=0;j<=n;j++){const an=s0+len*j/n,rr=(rr0||R)+(j&&j<n?rnd(-amp,amp):0);const px=hx+Math.cos(an)*rr,py=hy+Math.sin(an)*rr;P.push([px,py,an]);j?cx.lineTo(px,py):cx.moveTo(px,py);}return P;};
  cx.lineCap='round';cx.lineJoin='round';
  for(let i=0;i<3;i++){const pos=2-i,s0=a0+pos*(seg+gp),k=clamp(dc-i,0,1),fl=STHUD.dfl[i]=Math.max(0,STHUD.dfl[i]-dt);
    cx.beginPath();cx.arc(hx,hy,R,s0,s0+seg);cx.lineWidth=9;cx.strokeStyle='rgba(0,0,0,0.5)';cx.stroke();
    cx.beginPath();cx.arc(hx,hy,R,s0,s0+seg);cx.lineWidth=5.5;cx.strokeStyle='rgba(58,40,24,0.85)';cx.stroke();
    if(k>0){const on=k>=1,st=on?s0:s0+seg*(1-k),len=seg*k;   // กำลังฟื้น = เติมจากปลายล่างขึ้น
      if(on){cx.shadowColor='#fff27a';cx.shadowBlur=12+fl*26;}
      const P=zig(st,len,on?3.6:1.8);cx.lineWidth=(on?4.6:3)+fl*5;cx.strokeStyle=on?(fl>0?'#ffffff':'#ffd400'):'rgba(255,212,0,0.55)';cx.stroke();
      if(on){zig(st,len,3.2);cx.lineWidth=2.4;cx.strokeStyle='#ffe24a';cx.stroke();zig(st,len,1.6);cx.lineWidth=1.4;cx.strokeStyle='rgba(255,255,235,0.95)';cx.stroke();}
      cx.shadowBlur=0;
      if(on){// กิ่งสายฟ้าแตกออกจากแถบ + ประกาย
        for(let j=0;j<2;j++)if(Math.random()<0.45){const q=P[(Math.random()*P.length)|0],o=q[2]+rnd(-0.9,0.9)+(Math.random()<0.5?0:Math.PI);cx.strokeStyle='rgba(255,236,120,0.95)';cx.lineWidth=1.4;cx.beginPath();cx.moveTo(q[0],q[1]);cx.lineTo(q[0]+Math.cos(o)*6+rnd(-2,2),q[1]+Math.sin(o)*6+rnd(-2,2));cx.lineTo(q[0]+Math.cos(o)*11+rnd(-2,2),q[1]+Math.sin(o)*11+rnd(-2,2));cx.stroke();}
        if(Math.random()<0.3){const q=P[(Math.random()*P.length)|0];cx.fillStyle='#ffffff';cx.beginPath();cx.arc(q[0]+rnd(-3,3),q[1]+rnd(-3,3),1.3,0,6.283);cx.fill();}}}}
  cx.restore();
}
