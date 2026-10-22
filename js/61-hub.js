// =====================================================================
//  เมนูใหม่ — ฉาก 3D (ผู้ใช้ 2026-10-22 • สเปกเต็ม designs/ui-menu.md • หน้าจอ/ปุ่มอยู่ js/62)
//  ฉาก HUBS = ห้องทำงานนักเวทมืด (น้ำเงินเข้ม-ม่วง): โต๊ะกลม + ผ้าม่วงสี่เหลี่ยมวางเฉียง ขอบ/มุมทอง • ไม้กายสิทธิ์ประกายบนโต๊ะ • ของจุกจิกนักเวท
//  ฉาก HUBL = ล็อบบี้รอเริ่ม: แท่นวงเวท ทุกคนในห้องยืนโชว์ด้านขวา ท่าต่างกัน ที่ยืนต่างกัน
//  HUB.st: menu (ยืนข้างโต๊ะ) → go (หยิบไม้ หัน เดินมาหน้ากล้อง) → modes (โพสแขนกาง + ลูกแก้วเวท) → room (ล็อบบี้)
//  ตัวละคร = โมเดลไฟล์ char_student จัดท่าเองทั้งตัว: hbAim หมุนกระดูกให้ชี้ทิศที่ต้องการ ทับท่า idle (หายใจ) จากไฟล์
//  ⚠ ตำแหน่ง/สี/ท่า/จังหวะทั้งหมด Claude ออกแบบเอง (ผู้ใช้ให้ออกแบบ) — เรนเดอร์จาก renderStage (js/32) ผ่าน hubRender()
// =====================================================================
const HUBS=new THREE.Scene(),HUBL=new THREE.Scene();
HUBS.background=new THREE.Color('#05070f');HUBS.fog=new THREE.Fog('#070a1a',7,24);
HUBL.background=new THREE.Color('#04060d');HUBL.fog=new THREE.Fog('#060818',10,30);
const HUB={on:true,built:false,st:'menu',t:0,me:null,chars:new Map(),fx:{},cam:{p:new THREE.Vector3(),l:new THREE.Vector3(),init:false},
  orb:null,wandT:null,ps:null,psL:null,fade:0,pick:false,goT:0,roomIn:0};
// จุดสำคัญในห้อง (หน่วย 3D) • TB = กลางโต๊ะ • C0 = ที่ยืนข้างโต๊ะ • P1 = ที่ยืนโพสหน้ากล้อง
const HB={TB:new THREE.Vector3(1.6,0,-0.4),TOP:0.925,C0:new THREE.Vector3(2.4,0,-1.35),P1:new THREE.Vector3(2.85,0,1.85),WAND:new THREE.Vector3(2.1,0.94,-0.75),GRIP:new THREE.Vector3(2.18,0.98,-0.92)};
HB.PATH=[new THREE.Vector3(3.2,0,-0.35),HB.P1];
const _hq=new THREE.Quaternion(),_hq2=new THREE.Quaternion(),_hq3=new THREE.Quaternion(),_hv=new THREE.Vector3(),_hv2=new THREE.Vector3(),_hv3=new THREE.Vector3(),_hY=new THREE.Vector3(0,1,0);
const hEase=u=>u<0?0:u>1?1:u<0.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const hSm=(a,b,u)=>{u=clamp((u-a)/(b-a),0,1);return u*u*(3-2*u);};

// ---------- อนุภาคเรืองแสงของเมนู (ขนาด/สี/ความจางต่อเม็ด) ----------
function hubPS(scene,n){
  const g=new THREE.BufferGeometry(),P=new Float32Array(n*3),C=new Float32Array(n*3),S=new Float32Array(n),A=new Float32Array(n);
  g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('color',new THREE.BufferAttribute(C,3));
  g.setAttribute('size',new THREE.BufferAttribute(S,1));g.setAttribute('alpha',new THREE.BufferAttribute(A,1));
  const m=new THREE.ShaderMaterial({uniforms:{uS:{value:600}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:'attribute float size;attribute float alpha;attribute vec3 color;varying vec3 vC;varying float vA;uniform float uS;void main(){vC=color;vA=alpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*uS/max(.05,-mv.z);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5)*2.;float a=max(0.,1.-d);a=a*a*(.4+.6*a);gl_FragColor=vec4(vC*a*vA,a*vA);}'});
  const pts=new THREE.Points(g,m);pts.frustumCulled=false;scene.add(pts);
  const L=[];
  return {pts,L,n,
    add(o){if(L.length>=n)L.shift();o.max=o.life;L.push(o);return o;},
    tick(dt){
      for(let i=L.length-1;i>=0;i--){const p=L[i];p.life-=dt;if(p.life<=0){L.splice(i,1);continue;}
        const dr=Math.exp(-(p.dr||0)*dt);p.vx*=dr;p.vy*=dr;p.vz*=dr;p.vy+=(p.gy||0)*dt;
        if(p.sw){p.ph=(p.ph||0)+dt*p.sw;p.x+=Math.cos(p.ph)*p.swr*dt;p.z+=Math.sin(p.ph)*p.swr*dt;}
        p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;}
      const k=Math.min(L.length,n);
      for(let i=0;i<n;i++){
        if(i>=k){A[i]=0;continue;}
        const p=L[i],u=1-p.life/p.max,f=Math.min(1,u*(p.fi||6))*Math.min(1,p.life/p.max*(p.fo||2.2));
        P[i*3]=p.x;P[i*3+1]=p.y;P[i*3+2]=p.z;C[i*3]=p.c.r;C[i*3+1]=p.c.g;C[i*3+2]=p.c.b;
        S[i]=p.s*(p.tw?0.6+0.4*Math.sin(p.life*p.tw):1)*(p.gr?1+u*p.gr:1);A[i]=f*(p.a||1);}
      g.attributes.position.needsUpdate=g.attributes.color.needsUpdate=g.attributes.size.needsUpdate=g.attributes.alpha.needsUpdate=true;
      m.uniforms.uS.value=gl.domElement.height*0.5/Math.tan(cam.fov*Math.PI/360);
    }};
}
const hCol=(c,k)=>new THREE.Color(c).multiplyScalar(k||1);
const H_SPARK=['#ffffff','#cfe6ff','#b9a6ff','#8fd8ff'].map(c=>hCol(c,1.8));

// ---------- ผิว/ลาย (วาดด้วย canvas) ----------
function hubTexCloth(){
  return texCanvas(1024,1024,(g,W)=>{
    const r=g.createRadialGradient(512,512,40,512,512,720);r.addColorStop(0,'#4a2178');r.addColorStop(0.55,'#321457');r.addColorStop(1,'#1c0a33');g.fillStyle=r;g.fillRect(0,0,W,W);
    for(let i=0;i<9000;i++){g.fillStyle=`rgba(${Math.random()<0.5?'255,220,255':'0,0,0'},${Math.random()*0.05})`;g.fillRect(Math.random()*W,Math.random()*W,2,2);}
    const gold='#e0bd6e',G2='rgba(224,189,110,';
    g.strokeStyle=gold;g.lineWidth=7;g.strokeRect(38,38,W-76,W-76);
    g.lineWidth=2;g.strokeRect(62,62,W-124,W-124);
    g.strokeStyle=G2+'0.55)';g.lineWidth=1.2;g.strokeRect(74,74,W-148,W-148);
    // ลายมุมทอง (ม้วนเถา + เพชร)
    const corner=(x,y,sx,sy)=>{g.save();g.translate(x,y);g.scale(sx,sy);g.strokeStyle=gold;g.fillStyle=gold;g.lineWidth=3;
      g.beginPath();g.arc(0,0,92,0,Math.PI/2);g.stroke();g.lineWidth=1.6;g.beginPath();g.arc(0,0,112,0.08,Math.PI/2-0.08);g.stroke();
      for(const a of [0.25,0.785,1.32]){g.save();g.rotate(a);g.beginPath();g.moveTo(96,0);g.quadraticCurveTo(128,-14,150,4);g.quadraticCurveTo(136,18,118,10);g.stroke();g.restore();}
      g.beginPath();g.moveTo(0,-22);g.lineTo(18,0);g.lineTo(0,22);g.lineTo(-18,0);g.closePath();g.fill();
      g.lineWidth=2;g.beginPath();g.moveTo(26,26);g.lineTo(60,60);g.stroke();g.beginPath();g.arc(66,66,7,0,7);g.fill();g.restore();};
    corner(62,62,1,1);corner(W-62,62,-1,1);corner(62,W-62,1,-1);corner(W-62,W-62,-1,-1);
    // ตรากลางจางๆ
    g.save();g.translate(512,512);g.strokeStyle=G2+'0.32)';g.lineWidth=2;
    for(const rr of [250,232,140]){g.beginPath();g.arc(0,0,rr,0,7);g.stroke();}
    g.beginPath();for(let i=0;i<=8;i++){const a=i/8*Math.PI*2-Math.PI/2,rr=i%2?120:232;i?g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):g.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
    g.stroke();g.beginPath();for(let i=0;i<=8;i++){const a=i/8*Math.PI*2-Math.PI/2+Math.PI/8,rr=i%2?120:232;i?g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):g.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}g.stroke();
    g.font='22px serif';g.fillStyle=G2+'0.38)';g.textAlign='center';const R='ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
    for(let i=0;i<24;i++){g.save();g.rotate(i/24*Math.PI*2);g.fillText(R[i],0,-238);g.restore();}
    g.restore();
  });
}
function hubTexFloor(){
  const t=texCanvas(512,512,(g,W)=>{g.fillStyle='#17131f';g.fillRect(0,0,W,W);
    for(let y=0;y<W;y+=64){const off=(y/64%2)*120;for(let x=-off;x<W;x+=240){const v=Math.random()*14;g.fillStyle=`rgb(${30+v},${24+v},${38+v})`;g.fillRect(x+1,y+1,238,62);
      for(let k=0;k<14;k++){g.strokeStyle=`rgba(0,0,0,${0.08+Math.random()*0.1})`;g.beginPath();const yy=y+4+Math.random()*56;g.moveTo(x,yy);g.bezierCurveTo(x+80,yy+3,x+160,yy-3,x+240,yy+1);g.stroke();}}}
  });t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(6,6);return t;
}
function hubTexWindow(){
  return texCanvas(256,512,(g,W,H)=>{const r=g.createLinearGradient(0,0,0,H);r.addColorStop(0,'#cfe0ff');r.addColorStop(0.45,'#6f86e0');r.addColorStop(1,'#1d2560');g.fillStyle=r;g.fillRect(0,0,W,H);
    for(let i=0;i<60;i++){g.fillStyle=`rgba(255,255,255,${Math.random()*0.8})`;g.fillRect(Math.random()*W,Math.random()*H*0.6,1.5,1.5);}
    g.fillStyle='rgba(240,246,255,.95)';g.beginPath();g.arc(W*0.66,H*0.2,22,0,7);g.fill();
    g.fillStyle='#0c0f22';g.fillRect(W/2-5,0,10,H);for(const y of [0.33,0.62,0.86])g.fillRect(0,H*y-4,W,8);
  });
}
function hubTexPage(){
  return texCanvas(256,256,(g,W)=>{g.fillStyle='#d8c9a6';g.fillRect(0,0,W,W);for(let i=0;i<2000;i++){g.fillStyle=`rgba(90,60,30,${Math.random()*0.05})`;g.fillRect(Math.random()*W,Math.random()*W,2,2);}
    g.strokeStyle='rgba(60,40,30,.35)';g.lineWidth=1;for(let y=40;y<W-20;y+=14){g.beginPath();g.moveTo(24,y);g.lineTo(W-24-Math.random()*40,y);g.stroke();}
    g.strokeStyle='rgba(80,40,120,.6)';g.lineWidth=2;g.beginPath();g.arc(W/2,W*0.36,40,0,7);g.stroke();
  });
}
function hubTexCard(){
  return texCanvas(128,200,(g,W,H)=>{g.fillStyle='#24113f';g.fillRect(0,0,W,H);g.strokeStyle='#d9b45a';g.lineWidth=4;g.strokeRect(6,6,W-12,H-12);g.lineWidth=1.5;g.strokeRect(13,13,W-26,H-26);
    g.fillStyle='#d9b45a';g.save();g.translate(W/2,H/2);g.beginPath();for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=i%2?8:28;g.lineTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();g.fill();g.restore();
  });
}
const hubStarTex=texCanvas(64,64,(g,W)=>{const c=W/2;const r=g.createRadialGradient(c,c,0,c,c,c);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(0.15,'rgba(255,255,255,.5)');r.addColorStop(0.4,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,W,W);
  g.fillStyle='#fff';for(const [a,b] of [[1,0.06],[0.06,1]]){const s=g.createRadialGradient(c,c,0,c,c,c);s.addColorStop(0,'rgba(255,255,255,1)');s.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=s;g.beginPath();g.ellipse(c,c,c*a,c*b,0,0,7);g.fill();}},false);
function hubStar(col,k){return new THREE.Sprite(new THREE.SpriteMaterial({map:hubStarTex,color:hCol(col,k||2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));}
const hubShaftTex=texCanvas(64,256,(g,W,H)=>{const r=g.createLinearGradient(0,0,0,H);r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,W,H);
  const s=g.createLinearGradient(0,0,W,0);s.addColorStop(0,'rgba(0,0,0,1)');s.addColorStop(0.5,'rgba(0,0,0,0)');s.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=s;g.fillRect(0,0,W,H);},false);

// ---------- ของบนโต๊ะ ----------
function hubLathe(pts,mat,seg){return new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x,y])=>new THREE.Vector2(x,y)),seg||24),mat);}
// ผ้าคลุมโต๊ะ: สี่เหลี่ยมวางเฉียงบนโต๊ะกลม → ส่วนที่เลยขอบโต๊ะห้อยลง (มุมห้อยต่ำสุด) มีจีบเล็กน้อย
function hubCloth(R,size,yaw){
  const geo=new THREE.PlaneGeometry(size,size,56,56);geo.rotateX(-Math.PI/2);
  const p=geo.attributes.position,c=Math.cos(yaw),s=Math.sin(yaw);
  for(let i=0;i<p.count;i++){
    const x0=p.getX(i),z0=p.getZ(i),x=x0*c-z0*s,z=x0*s+z0*c,r=Math.hypot(x,z),th=Math.atan2(z,x);
    let y=0,nr=r;
    if(r>R){const o=r-R;const e=Math.min(1,o/0.07);nr=R+o*(0.12+0.1*(1-e))+0.012*e+Math.sin(th*11)*0.012*o;y=-o*0.97*e-o*0.25*(1-e)+Math.sin(th*7+o*6)*0.02*o;}
    p.setXYZ(i,Math.cos(th)*nr,y+0.004,Math.sin(th)*nr);
  }
  geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,new THREE.MeshPhysicalMaterial({map:hubTexCloth(),roughness:0.82,sheen:1,sheenRoughness:0.45,sheenColor:new THREE.Color('#b993ff'),side:THREE.DoubleSide}));
  m.castShadow=true;m.receiveShadow=true;
  // พู่ทองที่มุม
  const corners=[];for(const [a,b] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const x0=a*size/2,z0=b*size/2;const x=x0*c-z0*s,z=x0*s+z0*c,r=Math.hypot(x,z),th=Math.atan2(z,x),o=r-R;corners.push(new THREE.Vector3(Math.cos(th)*(R+o*0.12+0.012),-o*0.97,Math.sin(th)*(R+o*0.12+0.012)));}
  return {m,corners};
}
function hubBuildStudy(){
  const S=HUBS,F=HUB.fx;
  // แสง: จันทร์จากหน้าต่าง (ฟ้า) + คีย์ม่วงอ่อนจากบน + เทียน (ส้มนิดเดียว) + ลูกแก้ว (ม่วง-ฟ้า)
  // ห้องมืด: แสงหลัก = แสงจันทร์ลอดหน้าต่างด้านหลัง (เงาทอดยาวมาทางกล้อง) • ที่เหลือแค่แสงเรืองจากของบนโต๊ะ
  S.add(new THREE.HemisphereLight('#5a6cc4','#0a0710',0.1));S.add(new THREE.AmbientLight('#141833',0.12));
  const moon=new THREE.SpotLight('#9ab8ff',2.3,30,0.42,0.55,1);moon.position.set(-2.2,5.6,-6.8);moon.target.position.set(2.2,0,0.6);
  moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);moon.shadow.bias=-0.0004;moon.shadow.camera.near=2;moon.shadow.camera.far=26;S.add(moon,moon.target);F.moon=moon;
  const moon2=new THREE.SpotLight('#7f9cff',1.0,22,0.35,0.6,1);moon2.position.set(5.2,4.2,-6.5);moon2.target.position.set(2.8,0.8,0.5);S.add(moon2,moon2.target);
  const key=new THREE.SpotLight('#b9a8ff',0.32,18,0.5,0.9,1);key.position.set(0.6,7.5,4.2);key.target.position.copy(HB.TB);S.add(key,key.target);F.key=key;
  F.candleL=new THREE.PointLight('#ffb070',0.5,3.2,2);F.candleL.position.set(HB.TB.x-0.6,HB.TOP+0.45,HB.TB.z-0.5);S.add(F.candleL);
  F.fill=new THREE.PointLight('#b8b0ff',0.22,5,2);F.fill.position.set(HB.P1.x-0.4,2.1,HB.P1.z+1.6);S.add(F.fill);
  F.ballL=new THREE.PointLight('#9a7dff',0.8,3.6,2);F.ballL.position.set(HB.TB.x-0.45,HB.TOP+0.35,HB.TB.z-0.3);S.add(F.ballL);
  // พื้น ผนัง หน้าต่างโค้ง ม่าน ชั้นหนังสือ
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({map:hubTexFloor(),roughness:0.5,metalness:0.08,color:'#5d6288'}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;S.add(floor);
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(40,14),stoneMat(12,4,'#1f2340'));wall.position.set(0,7,-4.6);wall.receiveShadow=true;S.add(wall);
  const wallL=new THREE.Mesh(new THREE.PlaneGeometry(30,14),stoneMat(9,4,'#262a46'));wallL.position.set(-6.5,7,6);wallL.rotation.y=Math.PI/2;S.add(wallL);
  const arch=(w,h)=>{const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h-w/2);s.absarc(0,h-w/2,w/2,Math.PI,0,true);s.lineTo(w/2,0);s.lineTo(-w/2,0);return new THREE.ShapeGeometry(s,28);};
  const wtex=hubTexWindow();
  for(const [x,w,h,k] of [[-1.2,2.6,5.4,0.95],[4.9,1.6,3.8,0.6]]){
    const g=arch(w,h),uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(p.getX(i)+w/2)/w,p.getY(i)/h);
    const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:wtex,color:hdr('#ffffff',k),fog:false}));m.position.set(x,1.4,-4.55);S.add(m);
    const fr=new THREE.Mesh(arch(w+0.5,h+0.25),new THREE.MeshStandardMaterial({color:'#1a1a2c',roughness:0.9}));fr.position.set(x,1.28,-4.57);S.add(fr);
    const sill=new THREE.Mesh(new THREE.BoxGeometry(w+0.7,0.12,0.35),new THREE.MeshStandardMaterial({color:'#22243a',roughness:0.9}));sill.position.set(x,1.28,-4.42);S.add(sill);
    // ลำแสงจันทร์เฉียงลงพื้น
    for(let i=0;i<3;i++){const sh=new THREE.Mesh(new THREE.PlaneGeometry(w*0.55,9),new THREE.MeshBasicMaterial({map:hubShaftTex,color:hdr('#9fb8ff',0.15*k),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:false}));
      sh.position.set(x+0.35+(i-1)*w*0.28,3.3,-1.2);sh.rotation.set(-0.72,0.18*(i-1),0.25);S.add(sh);(F.shafts=F.shafts||[]).push(sh);}
  }
  {const pt=texCanvas(256,512,(g,W,H)=>{const r=g.createLinearGradient(0,0,0,H);r.addColorStop(0,'rgba(255,255,255,.95)');r.addColorStop(1,'rgba(255,255,255,.05)');g.fillStyle=r;g.fillRect(0,0,W,H);
      g.globalCompositeOperation='destination-out';g.fillStyle='#000';g.fillRect(W/2-7,0,14,H);for(const y of [0.3,0.6,0.85])g.fillRect(0,H*y-6,W,12);
      g.filter='blur(6px)';g.globalCompositeOperation='destination-in';const e=g.createLinearGradient(0,0,W,0);e.addColorStop(0,'rgba(0,0,0,0)');e.addColorStop(0.12,'#000');e.addColorStop(0.88,'#000');e.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=e;g.fillRect(0,0,W,H);},false);
    for(const [x,w,len,k,sk] of [[-1.2,2.4,7.5,0.42,0.42],[4.9,1.5,5.5,0.28,-0.35]]){const geo=new THREE.PlaneGeometry(w,len,1,8),pp=geo.attributes.position;for(let i=0;i<pp.count;i++){const v=(pp.getY(i)+len/2)/len;pp.setX(i,pp.getX(i)*(1+v*0.9)+v*len*sk*0.35);}
      const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:pt,color:hdr('#8fb0ff',k),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));m.rotation.x=-Math.PI/2;m.position.set(x,0.006,-4.4+len/2);S.add(m);}}
  const curtM=new THREE.MeshStandardMaterial({color:'#2a1544',roughness:0.85,side:THREE.DoubleSide});
  for(const sx of [-1,1]){const g=new THREE.PlaneGeometry(1.3,8,30,1),p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*14)*0.09);g.computeVertexNormals();
    const c=new THREE.Mesh(g,curtM);c.position.set(-1.2+sx*1.95,4.4,-4.35);S.add(c);}
  {const shelf=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:'#24180f',roughness:0.8});
    const add=(w,h,d,x,y,z,m)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m||wood);b.position.set(x,y,z);shelf.add(b);return b;};
    add(2.6,4.6,0.5,0,2.3,0);const cols=['#2a3a7a','#6a2a3a','#2a5a4a','#7a6a3a','#3a2a5a','#8a8070'];
    for(let r=0;r<5;r++){add(2.5,0.06,0.48,0,0.35+r*0.85,0.03,new THREE.MeshStandardMaterial({color:'#2e2014',roughness:0.8}));let x=-1.15;while(x<1.1){const w=0.06+Math.random()*0.07,h=0.45+Math.random()*0.3;add(w,h,0.34,x+w/2,0.38+r*0.85+h/2,0.08,new THREE.MeshStandardMaterial({color:cols[(Math.random()*cols.length)|0],roughness:0.8}));x+=w+0.012;}}
    shelf.position.set(8.2,0,-4.15);S.add(shelf);
    const sh2=shelf.clone();sh2.position.set(-5.9,0,-1.5);sh2.rotation.y=Math.PI/2;S.add(sh2);}
  // โต๊ะกลม (ขาเดียว) + ผ้า
  const T=new THREE.Group();T.position.copy(HB.TB);S.add(T);F.table=T;
  const wood=new THREE.MeshStandardMaterial({color:'#2b1b12',roughness:0.55,metalness:0.05});
  const top=new THREE.Mesh(new THREE.CylinderGeometry(0.95,0.95,0.06,48),wood);top.position.y=HB.TOP-0.035;top.castShadow=top.receiveShadow=true;T.add(top);
  const leg=hubLathe([[0,0],[0.42,0.02],[0.3,0.08],[0.12,0.16],[0.1,0.4],[0.16,0.5],[0.09,0.6],[0.08,0.82],[0.22,0.88],[0,0.89]],wood,20);leg.castShadow=true;T.add(leg);
  const {m:cl,corners}=hubCloth(0.95,2.32,0.42);cl.position.y=HB.TOP;T.add(cl);
  const goldM=new THREE.MeshStandardMaterial({color:'#e0bd6e',metalness:0.85,roughness:0.32,emissive:'#3a2a08'});
  for(const c of corners){const ts=new THREE.Group();ts.position.set(c.x,HB.TOP+c.y,c.z);
    const k=new THREE.Mesh(new THREE.SphereGeometry(0.025,10,8),goldM);ts.add(k);const f=new THREE.Mesh(new THREE.ConeGeometry(0.03,0.11,10,1,true),goldM);f.position.y=-0.07;f.rotation.x=Math.PI;ts.add(f);T.add(ts);}
  const y0=HB.TOP;
  // ลูกแก้วพยากรณ์บนฐานทอง (เรืองม่วง-ฟ้า หมุนวน)
  {const g=new THREE.Group();g.position.set(-0.42,y0,-0.26);T.add(g);
    const base=hubLathe([[0,0],[0.12,0],[0.13,0.02],[0.07,0.05],[0.05,0.09],[0.1,0.12],[0,0.12]],goldM,24);g.add(base);
    F.ballU={uT:{value:0}};
    const ball=new THREE.Mesh(new THREE.SphereGeometry(0.15,40,28),new THREE.ShaderMaterial({uniforms:F.ballU,transparent:true,depthWrite:false,
      vertexShader:'varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;vP=position;gl_Position=projectionMatrix*mv;}',
      fragmentShader:'uniform float uT;varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){float f=pow(1.-max(dot(normalize(vN),normalize(vV)),0.),2.);vec3 q=vP*20.;float s=sin(q.x+uT*1.3+sin(q.y*.7+uT))*sin(q.y*.9-uT*1.1)*sin(q.z*1.1+uT*.8);float sw=smoothstep(.15,.95,s*.5+.5);vec3 c=mix(vec3(.2,.08,.55),vec3(.5,.9,1.2),sw)*(.3+1.1*sw)+vec3(.75,.65,1.)*f*1.5;gl_FragColor=vec4(c,.45+f*.5);}'}));
    ball.position.y=0.27;g.add(ball);const gl2=new THREE.Sprite(glowMat('#9a7dff',1.1));gl2.scale.set(0.9,0.9,1);gl2.position.y=0.27;g.add(gl2);F.ball=g;}
  // หนังสือเปิดอยู่ (หน้ามีรูนเรือง) + กองหนังสือ
  {const g=new THREE.Group();g.position.set(0.02,y0,0.42);g.rotation.y=-0.25;T.add(g);
    const cov=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.02,0.42),new THREE.MeshStandardMaterial({color:'#3a1414',roughness:0.7}));cov.position.y=0.01;g.add(cov);
    const pm=new THREE.MeshStandardMaterial({map:hubTexPage(),roughness:0.9});
    for(const s of [-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(0.29,0.025,0.39),pm);p.position.set(s*0.15,0.035,0);p.rotation.z=-s*0.09;g.add(p);}
    F.bookGlow=new THREE.Sprite(glowMat('#a995ff',0.6));F.bookGlow.scale.set(0.6,0.35,1);F.bookGlow.position.y=0.08;g.add(F.bookGlow);F.book=g;}
  {const g=new THREE.Group();g.position.set(-0.55,y0,0.4);g.rotation.y=0.5;T.add(g);let y=0;
    for(const [c,w,h] of [['#1f2f6a',0.36,0.07],['#5a1d2e',0.32,0.06],['#1d4a3a',0.3,0.055]]){const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w*0.72),new THREE.MeshStandardMaterial({color:c,roughness:0.75}));b.position.y=y+h/2;b.rotation.y=(Math.random()-0.5)*0.4;b.castShadow=true;g.add(b);
      const band=new THREE.Mesh(new THREE.BoxGeometry(w+0.004,h*0.25,w*0.72+0.004),goldM);band.position.copy(b.position);band.rotation.copy(b.rotation);g.add(band);y+=h;}}
  // ขวดยา 3 ขวด (แก้วใส + น้ำยาเรือง + จุก)
  F.potions=[];
  for(const [x,z,c,sc] of [[0.2,-0.8,'#b77dff',1],[0.38,-0.7,'#6fe0ff',0.8],[0.04,-0.9,'#ff7ab8',0.9]]){const g=new THREE.Group();g.position.set(x,y0,z);g.scale.setScalar(sc);T.add(g);
    const glass=hubLathe([[0,0],[0.07,0],[0.09,0.04],[0.09,0.1],[0.05,0.15],[0.025,0.17],[0.025,0.24],[0.032,0.25],[0,0.25]],new THREE.MeshPhysicalMaterial({color:'#cfd8ff',roughness:0.08,transmission:0,transparent:true,opacity:0.28,depthWrite:false}),24);g.add(glass);
    const liq=hubLathe([[0,0.005],[0.064,0.005],[0.082,0.04],[0.082,0.09],[0,0.09]],new THREE.MeshBasicMaterial({color:hdr(c,1.25),transparent:true,opacity:0.85}),20);g.add(liq);
    const cork=new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.022,0.04,10),new THREE.MeshStandardMaterial({color:'#7a5a3a',roughness:0.9}));cork.position.y=0.265;g.add(cork);
    const gs=new THREE.Sprite(glowMat(c,0.55));gs.scale.set(0.38,0.38,1);gs.position.y=0.06;g.add(gs);F.potions.push({g,gs,c});}
  // เทียน 3 เล่ม (เปลวไฟสั่น)
  F.flames=[];
  for(const [x,z,h] of [[-0.62,-0.5,0.22],[-0.48,-0.66,0.15],[-0.74,-0.34,0.11]]){const w=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.028,h,12),new THREE.MeshStandardMaterial({color:'#e9e1cf',roughness:0.6,emissive:'#2a2010'}));w.position.set(x,y0+h/2,z);w.castShadow=true;T.add(w);
    const f=new THREE.Sprite(glowMat('#ffb54a',2.4));f.scale.set(0.08,0.14,1);f.position.set(x,y0+h+0.06,z);T.add(f);const f2=new THREE.Sprite(glowMat('#ff8a3a',0.6));f2.scale.set(0.35,0.35,1);f2.position.copy(f.position);T.add(f2);F.flames.push({f,f2,ph:Math.random()*9});}
  // นาฬิกาทราย
  {const g=new THREE.Group();g.position.set(-0.78,y0,-0.02);T.add(g);const gm=new THREE.MeshPhysicalMaterial({color:'#dfe6ff',roughness:0.05,transparent:true,opacity:0.3,depthWrite:false});
    g.add(hubLathe([[0.005,0.03],[0.06,0.05],[0.065,0.09],[0.01,0.15],[0.065,0.21],[0.06,0.25],[0.005,0.27]],gm,20));
    const sand=hubLathe([[0,0.04],[0.05,0.06],[0.03,0.1],[0,0.11]],new THREE.MeshStandardMaterial({color:'#d8b878',roughness:1}),16);g.add(sand);
    for(const y of [0.015,0.285]){const d=new THREE.Mesh(new THREE.CylinderGeometry(0.085,0.085,0.03,16),goldM);d.position.y=y;g.add(d);}
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2,r=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.27,6),goldM);r.position.set(Math.cos(a)*0.075,0.15,Math.sin(a)*0.075);g.add(r);}}
  // วงแหวนดาราศาสตร์ (หมุนช้าๆ)
  {const g=new THREE.Group();g.position.set(-0.12,y0,-0.62);T.add(g);
    g.add(hubLathe([[0,0],[0.1,0],[0.04,0.03],[0.02,0.22],[0,0.22]],goldM,16));
    const rings=new THREE.Group();rings.position.y=0.38;g.add(rings);F.armil=[];
    for(const [r,ax] of [[0.16,0],[0.145,1],[0.13,2]]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,0.006,6,64),goldM);t.rotation.set(ax===0?Math.PI/2:0.4*ax,ax*0.7,0);const h=new THREE.Group();h.add(t);rings.add(h);F.armil.push(h);}
    const core=new THREE.Mesh(new THREE.SphereGeometry(0.035,16,12),new THREE.MeshBasicMaterial({color:hdr('#8fd8ff',1.6)}));rings.add(core);const cs=new THREE.Sprite(glowMat('#8fd8ff',0.8));cs.scale.set(0.3,0.3,1);rings.add(cs);}
  // ไพ่ทาโรต์วางกระจาย + ขนนกกับขวดหมึก
  {const ct=hubTexCard(),cm=new THREE.MeshStandardMaterial({map:ct,roughness:0.6});
    for(let i=0;i<4;i++){const c=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.003,0.16),cm);c.position.set(0.56+i*0.04,y0+0.004+i*0.002,0.5-i*0.03);c.rotation.y=-0.6+i*0.28;T.add(c);}
    const ink=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.045,0.06,14),new THREE.MeshPhysicalMaterial({color:'#101830',roughness:0.1}));ink.position.set(0.3,y0+0.03,0.68);T.add(ink);
    const qg=new THREE.SphereGeometry(0.5,10,6);qg.scale(0.035,0.18,0.006);const q=new THREE.Mesh(qg,new THREE.MeshStandardMaterial({color:'#efe9dc',roughness:0.8}));q.position.set(0.36,y0+0.13,0.7);q.rotation.set(0.25,0.4,-0.75);T.add(q);}
  // ไม้กายสิทธิ์บนโต๊ะ (ใส่ทีหลังเมื่อโมเดลตัวละครพร้อม — ใช้ไม้แบบเดียวกับที่เลือกไว้) + ประกาย
  F.wandPivot=new THREE.Group();S.add(F.wandPivot);
  F.wandTip=new THREE.Object3D();F.wandPivot.add(F.wandTip);
  F.wandGlow=new THREE.Sprite(glowMat('#cfe6ff',1.4));F.wandGlow.scale.set(0.22,0.22,1);F.wandTip.add(F.wandGlow);
  F.wandStar=hubStar('#e6f0ff',2.4);F.wandStar.scale.set(0.3,0.3,1);F.wandTip.add(F.wandStar);
  // ฝุ่นละอองลอยในแสงจันทร์
  HUB.ps=hubPS(S,700);
  {const n=160,pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=rnd(-3,6.5);pos[i*3+1]=rnd(0.2,5.5);pos[i*3+2]=rnd(-4.2,3.5);}
    const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    F.dust=new THREE.Points(dg,new THREE.PointsMaterial({map:glowTex,color:hdr('#aebfff',1.2),size:0.05,transparent:true,opacity:0.55,depthWrite:false,blending:THREE.AdditiveBlending}));S.add(F.dust);}
}
// ---------- ล็อบบี้รอเริ่ม: แท่นวงเวท + ม่าน + หน้าต่างโค้ง + ลำแสงลงแต่ละที่ยืน ----------
function hubBuildLobby(){
  const S=HUBL,F=HUB.fx;
  S.add(new THREE.HemisphereLight('#7f8fe6','#120e1a',0.38));S.add(new THREE.AmbientLight('#1d2142',0.4));
  const key=new THREE.SpotLight('#d8ccff',1.7,30,0.62,0.7,1);key.position.set(-1.5,9,7);key.target.position.set(0.6,0,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-0.0006;S.add(key,key.target);
  const rim=new THREE.DirectionalLight('#78a8ff',0.85);rim.position.set(4,6,-9);S.add(rim);
  const rim2=new THREE.DirectionalLight('#b48cff',0.5);rim2.position.set(-6,4,-6);S.add(rim2);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({map:hubTexFloor(),roughness:0.5,color:'#6a70a0'}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;S.add(floor);
  const marble=texCanvas(512,512,(g,W)=>{g.fillStyle='#1a1d33';g.fillRect(0,0,W,W);for(let i=0;i<40;i++){g.strokeStyle=`rgba(170,160,230,${0.04+Math.random()*0.08})`;g.lineWidth=0.5+Math.random()*1.5;g.beginPath();let x=Math.random()*W,y=Math.random()*W;g.moveTo(x,y);for(let k=0;k<8;k++){x+=(Math.random()-0.5)*90;y+=(Math.random()-0.5)*90;g.lineTo(x,y);}g.stroke();}});
  const dais=new THREE.Mesh(new THREE.CylinderGeometry(4.7,4.9,0.2,72),new THREE.MeshStandardMaterial({map:marble,roughness:0.35,metalness:0.1}));dais.position.y=0.1;dais.receiveShadow=true;S.add(dais);
  const goldM=new THREE.MeshStandardMaterial({color:'#e0bd6e',metalness:0.85,roughness:0.32,emissive:'#3a2a08'});
  for(const r of [4.72,4.4]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,r>4.5?0.035:0.015,6,140),goldM);t.rotation.x=Math.PI/2;t.position.y=0.205;S.add(t);}
  F.lRune=new THREE.Mesh(new THREE.CircleGeometry(4.3,72),new THREE.MeshBasicMaterial({map:runeTex,color:hdr('#a995ff',1.1),transparent:true,opacity:0.3,depthWrite:false,blending:THREE.AdditiveBlending}));
  F.lRune.rotation.x=-Math.PI/2;F.lRune.position.y=0.212;S.add(F.lRune);
  // เสา + ม่านม่วงขอบทองเป็นวงโค้งด้านหลัง + หน้าต่างโค้งแสงจันทร์
  const curtM=new THREE.MeshStandardMaterial({color:'#331a52',roughness:0.85,side:THREE.DoubleSide});
  const wtex=hubTexWindow();
  for(let i=0;i<7;i++){const a=-Math.PI/2+(i-3)*0.36,x=Math.cos(a)*8.5,z=Math.sin(a)*8.5;
    const col=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.38,11,14),stoneMat(1,4,'#3a3d5e'));col.position.set(x,5.5,z);S.add(col);
    if(i<6){const a2=a+0.18,x2=Math.cos(a2)*8.9,z2=Math.sin(a2)*8.9;
      if(i===1||i===4){const w=new THREE.Mesh(new THREE.PlaneGeometry(1.7,5.5),new THREE.MeshBasicMaterial({map:wtex,color:hdr('#ffffff',0.55),fog:false}));w.position.set(x2*1.05,4.2,z2*1.05);w.lookAt(0,4.2,0);S.add(w);}
      else{const g=new THREE.PlaneGeometry(2.6,9,26,1),p=g.attributes.position;for(let k=0;k<p.count;k++)p.setZ(k,Math.sin(p.getX(k)*11)*0.12);g.computeVertexNormals();
        const c=new THREE.Mesh(g,curtM);c.position.set(x2,4.6,z2);c.lookAt(0,4.6,0);S.add(c);
        const tr=new THREE.Mesh(new THREE.PlaneGeometry(2.6,0.06),goldM);tr.position.set(x2*0.995,0.35,z2*0.995);tr.lookAt(0,0.35,0);S.add(tr);}}}
  // ลำแสงลงที่ยืน (6 จุด) + วงเรืองบนพื้น
  F.spots=[];
  const coneT=texCanvas(8,128,(g,W,H)=>{const r=g.createLinearGradient(0,0,0,H);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(0.25,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,.05)');g.fillStyle=r;g.fillRect(0,0,W,H);},false);
  for(let i=0;i<6;i++){const g=new THREE.Group();S.add(g);
    const cone=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.85,6,32,1,true),new THREE.MeshBasicMaterial({map:coneT,color:hdr('#b9a6ff',0.16),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false}));cone.position.y=3.2;g.add(cone);
    const ring=new THREE.Mesh(new THREE.RingGeometry(0.62,0.66,64),new THREE.MeshBasicMaterial({color:hdr('#b9a6ff',1.4),transparent:true,opacity:0.6,depthWrite:false,blending:THREE.AdditiveBlending}));ring.rotation.x=-Math.PI/2;ring.position.y=0.215;g.add(ring);
    const disc=new THREE.Mesh(new THREE.CircleGeometry(0.85,48),new THREE.MeshBasicMaterial({map:glowTex,color:hdr('#8a7dff',0.35),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));disc.rotation.x=-Math.PI/2;disc.position.y=0.214;g.add(disc);
    F.spots.push({g,cone,ring,disc});}
  HUB.psL=hubPS(S,500);
  {const n=200,pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=rnd(-7,7);pos[i*3+1]=rnd(0.3,7);pos[i*3+2]=rnd(-7,4);}
    const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    F.dustL=new THREE.Points(dg,new THREE.PointsMaterial({map:glowTex,color:hdr('#c0b4ff',1.2),size:0.06,transparent:true,opacity:0.5,depthWrite:false,blending:THREE.AdditiveBlending}));S.add(F.dustL);}
}

// ---------- ตัวละคร (โมเดลไฟล์ + จัดท่าเอง) ----------
// ทิศในกรอบตัวละคร: x = ซ้ายของตัวละคร • y = ขึ้น • z = ด้านหน้า • tw = บิดมือรอบแขน • ch = [ก้ม(+)/เงย(-), บิดตัว(+ซ้าย), เอียง]
const HPOSE={
  lean:{uaL:[0.32,-0.88,0.36],faL:[0.12,-0.62,0.78],hL:[0.05,-0.75,0.66],uaR:[-0.3,-0.9,0.3],faR:[-0.1,-0.6,0.8],hR:[-0.05,-0.8,0.6],ch:[0.2,0,0],hd:[0.42,0]},
  reach:{uaL:[0.25,-0.95,0.15],faL:[0.12,-0.9,0.4],hL:[0.1,-0.95,0.3],uaR:null,faR:null,hR:null,ch:[0.24,0.1,0],hd:[0.5,0],ik:'R'},
  lift:{uaL:[0.25,-0.95,0.15],faL:[0.15,-0.85,0.5],hL:[0.1,-0.9,0.4],uaR:[-0.22,-0.85,0.48],faR:[0.15,0.55,0.82],hR:[0.1,0.92,0.38],ch:[0.02,0,0],hd:[0,0]},
  spread:{uaL:[0.6,-0.22,0.77],faL:[0.34,0.16,0.92],hL:[0.08,0.32,0.95],twL:1.2,uaR:[-0.94,-0.28,0.18],faR:[-0.9,0.08,0.42],hR:[-0.62,0.62,0.48],ch:[-0.07,0.14,0],hd:'cam',orb:'L'},
  hero:{uaL:[0.45,-0.88,0.15],faL:[-0.25,-0.5,0.83],hL:[-0.4,-0.6,0.7],uaR:[-0.35,0.9,0.25],faR:[-0.15,0.97,0.18],hR:[-0.05,1,0.1],ch:[-0.12,0,0.06],hd:'cam',ry:-0.15},
  duel:{uaL:[0.75,0.15,-0.6],faL:[0.6,0.78,-0.15],hL:[0.4,0.9,0.1],uaR:[-0.3,0.02,0.95],faR:[-0.18,0.08,0.98],hR:[-0.12,0.12,0.99],ch:[0.06,-0.5,0],hd:'cam',ry:0.55},
  orb2:{uaL:[0.4,-0.62,0.66],faL:[-0.35,0.12,0.93],hL:[-0.45,0.35,0.82],twL:1.3,uaR:[-0.4,-0.62,0.66],faR:[0.35,0.12,0.93],hR:[0.45,0.35,0.82],twR:-1.3,ch:[0.05,0,0],hd:[0.25,0],orb:'M'},
  rest:{uaL:[0.78,-0.6,-0.12],faL:[-0.55,-0.62,0.55],hL:[-0.5,-0.7,0.5],uaR:[-0.38,-0.78,0.5],faR:[-0.1,0.95,0.3],hR:[0.1,0.45,-0.88],ch:[0,0.18,0.07],hd:'cam',ry:-0.35},
  cast:{uaL:[0.35,0.12,0.93],faL:[0.2,0.3,0.93],hL:[0.1,0.7,0.7],twL:1.5,uaR:[-0.62,-0.72,0.3],faR:[-0.5,-0.15,0.85],hR:[-0.4,0.55,0.73],ch:[0.04,0.3,0],hd:'cam',ry:-0.4,orb:'L'}
};
const HPK=['uaL','faL','hL','uaR','faR','hR'],HBN={uaL:'upper_arm_L',faL:'forearm_L',hL:'hand_L',uaR:'upper_arm_R',faR:'forearm_R',hR:'hand_R'};
const LOBBY_POSES=['spread','hero','duel','orb2','rest','cast'];
function hubMakeChar(lk){
  const r=MODELS.ready.get('char_student');if(!r)return null;
  const inst=modelInst('char_student');if(!inst)return null;
  const L=parseLook(lk);tintModel(inst,lookTint(L));fileVariants(inst,L);
  inst.traverse(m=>{if(m.isMesh){m.castShadow=true;m.frustumCulled=false;}});
  const g=new THREE.Group();g.add(inst);
  const B={};inst.traverse(o=>{if(o.isBone)B[o.name]=o;});
  let wand=null;inst.traverse(o=>{if(/^wand_\d+$/.test(o.name)&&o.visible)wand=o;});
  const c={g,inst,B,wand,lk,A:r.animations.length?makeAnimator(inst,r.animations):null,
    pw:0,pwT:0,cur:{},pose:null,ry:0,ryT:0,head:new THREE.Vector2(),orbMode:null,orbK:0,tip:new THREE.Object3D(),t0:Math.random()*10,walkSp:0};
  for(const k of HPK)c.cur[k]=new THREE.Vector3(0,-1,0);c.ch=new THREE.Vector3();
  // ปลายไม้ = ปลายกล่องไม้ที่ไกลจากมือที่สุด (ท่ายืนตรง) → เก็บเป็นจุดในกรอบมือขวา
  if(wand&&B.hand_R){inst.updateMatrixWorld(true);const bx=new THREE.Box3().setFromObject(wand),ce=bx.getCenter(new THREE.Vector3()),hp=B.hand_R.getWorldPosition(new THREE.Vector3());
    const tip=hp.clone().add(ce.clone().sub(hp).multiplyScalar(2));c.tip.position.copy(B.hand_R.worldToLocal(tip));B.hand_R.add(c.tip);
    c.wandBind={m:wand.matrixWorld.clone(),c:ce,tip};}
  c.tipGlow=new THREE.Sprite(glowMat('#cfe6ff',1.3));c.tipGlow.scale.set(0.16,0.16,1);c.tip.add(c.tipGlow);
  if(c.A)animPlay(c.A,'idle');
  return c;
}
function hubSetPose(c,name,ry){c.pose=name?HPOSE[name]:null;c.poseN=name||'';c.pwT=name?1:0;if(ry!==undefined)c.ryT=ry;}
// หมุนกระดูก b ให้แกน +Y (แนวกระดูก) ชี้ทิศ dw (โลก) — w = น้ำหนัก
function hbAim(b,dw,w){
  const bw=b.getWorldQuaternion(_hq),cur=_hv.copy(_hY).applyQuaternion(bw);
  const tg=_hq2.setFromUnitVectors(cur,dw).multiply(bw);
  const loc=b.parent.getWorldQuaternion(_hq3).invert().multiply(tg);
  b.quaternion.slerp(loc,w);b.updateMatrixWorld(true);
}
function hbRot(b,axW,ang){
  if(Math.abs(ang)<1e-4)return;
  const bw=b.getWorldQuaternion(_hq),tg=_hq2.setFromAxisAngle(axW,ang).multiply(bw);
  b.quaternion.copy(b.parent.getWorldQuaternion(_hq3).invert().multiply(tg));b.updateMatrixWorld(true);
}
const _hcq=new THREE.Quaternion(),_hax=new THREE.Vector3(),_hd=new THREE.Vector3(),_ht=new THREE.Vector3();
function hubCharTick(c,dt,now,camP){
  const t=now/1000+c.t0;
  // หัน (มุมนุ่ม) + เดิน
  let d=c.ryT-c.ry;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;c.ry+=d*(1-Math.exp(-(c.turnK||6)*dt));c.g.rotation.y=c.ry;
  if(c.A){if(c.walkSp>0.05)animPlay(c.A,'walk',{speed:c.walkSp/2.1,fade:0.25});else animPlay(c.A,'idle',{fade:0.35});c.A.mixer.update(dt);}
  c.g.updateMatrixWorld(true);
  const k=1-Math.exp(-(c.pk||5)*dt);c.pw+=(c.pwT-c.pw)*k;
  const P=c.pose,B=c.B;if(!B.upper_arm_L)return;
  c.g.getWorldQuaternion(_hcq);
  const toW=(v,o)=>o.set(v[0],v[1],v[2]).normalize().applyQuaternion(_hcq);
  // หายใจ + เล่นลูกแก้ว
  const br=Math.sin(t*1.7),sw=Math.sin(t*0.9);
  if(P){
    for(const key of HPK){
      let v=P[key];
      if(!v&&P.ik===key.slice(-1)&&c.ikP){   // เอื้อมมือไปหาจุด (หยิบไม้)
        const sh=B['upper_arm_'+P.ik].getWorldPosition(_ht);_hd.copy(c.ikP).sub(sh).normalize();
        const inv=_hcq.clone().invert();const l=_hd.clone().applyQuaternion(inv);v=[l.x,l.y-0.12*(key[0]==='u'?1:0),l.z];
      }
      if(!v)continue;
      _hv2.set(v[0],v[1],v[2]).normalize();
      if(P.orb&&key===(P.orb==='L'?'hL':'')){_hv2.y+=Math.sin(t*1.3)*0.08;_hv2.x+=sw*0.05;}
      if(key[0]==='u'){_hv2.y+=br*0.018;}
      if(key==='hR'||key==='faR')_hv2.x+=Math.sin(t*0.7)*0.03;
      c.cur[key].lerp(_hv2.normalize(),1-Math.exp(-7*dt)).normalize();
    }
  }
  const w=c.pw;
  if(w>0.002&&P){
    // อก: ก้ม/เงย + บิด + เอียง (หายใจซ้อน)
    const ch=P.ch||[0,0,0];c.ch.lerp(_ht.set(ch[0],ch[1],ch[2]),1-Math.exp(-6*dt));
    if(B.chest){const right=_hax.set(1,0,0).applyQuaternion(_hcq);hbRot(B.chest,right,(c.ch.x+br*0.02)*w);hbRot(B.chest,_hY,c.ch.y*w);hbRot(B.chest,_hd.set(0,0,1).applyQuaternion(_hcq),c.ch.z*w);}
    for(const key of HPK){const b=B[HBN[key]];if(!b)continue;if(!P[key]&&!(P.ik&&P.ik===key.slice(-1)))continue;hbAim(b,toW([c.cur[key].x,c.cur[key].y,c.cur[key].z],_hv3),w);}
    const twL=(P.twL||0)+Math.sin(t*1.1)*0.06,twR=P.twR||0;
    if(B.hand_L&&twL){const ax=_hv3.copy(_hY).applyQuaternion(B.hand_L.getWorldQuaternion(_hq));hbRot(B.hand_L,ax,twL*w);}
    if(B.hand_R&&twR){const ax=_hv3.copy(_hY).applyQuaternion(B.hand_R.getWorldQuaternion(_hq));hbRot(B.hand_R,ax,twR*w);}
  }
  // หัว: มองกล้อง (จำกัดมุม) หรือ ก้ม/หันตามท่า
  if(B.head&&B.neck){
    let yaw=0,pit=0;
    const hd=P&&P.hd;
    if(hd==='cam'&&camP){const hp=B.head.getWorldPosition(_ht);_hd.copy(camP).sub(hp).applyQuaternion(_hcq.clone().invert());yaw=clamp(Math.atan2(_hd.x,_hd.z),-0.7,0.7);pit=clamp(-Math.atan2(_hd.y,Math.hypot(_hd.x,_hd.z)),-0.45,0.45);}
    else if(Array.isArray(hd)){pit=hd[0];yaw=hd[1];}
    if(c.lookAt){const hp=B.head.getWorldPosition(_ht);_hd.copy(c.lookAt).sub(hp).applyQuaternion(_hcq.clone().invert());yaw=clamp(Math.atan2(_hd.x,_hd.z),-0.8,0.8);pit=clamp(-Math.atan2(_hd.y,Math.hypot(_hd.x,_hd.z)),-0.6,0.6);}
    c.head.x+=(pit-c.head.x)*(1-Math.exp(-5*dt));c.head.y+=(yaw-c.head.y)*(1-Math.exp(-5*dt));
    const right=_hax.set(1,0,0).applyQuaternion(_hcq);
    hbRot(B.neck,_hY,c.head.y*0.45);hbRot(B.head,_hY,c.head.y*0.55);hbRot(B.head,right,c.head.x+Math.sin(t*0.8)*0.02);
  }
  c.tipGlow.scale.setScalar(0.14+0.05*Math.sin(t*6)+(c.wandOn===false?-1:0)*0);
  c.tipGlow.visible=c.wandOn!==false;
}

// ---------- ลูกแก้วเวท (เล่นในมือ) ----------
function hubMakeOrb(scene){
  const g=new THREE.Group();scene.add(g);
  const U={uT:{value:0}};
  const core=new THREE.Mesh(new THREE.SphereGeometry(0.075,32,24),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:'varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;vP=position;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float uT;varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){float f=pow(1.-max(dot(normalize(vN),normalize(vV)),0.),1.6);vec3 q=vP*40.;float s=sin(q.x+uT*2.)*sin(q.y*1.2-uT*1.7)*sin(q.z+uT*1.3);vec3 c=mix(vec3(.5,.4,1.25),vec3(.5,1.1,1.4),s*.5+.5)*(.45+.5*f)+vec3(1.)*pow(1.-f,6.)*.5;gl_FragColor=vec4(c,1.);}'}));
  g.add(core);
  const halo=new THREE.Sprite(glowMat('#a995ff',0.85));halo.scale.set(0.5,0.5,1);g.add(halo);
  const halo2=new THREE.Sprite(glowMat('#8fd8ff',0.4));halo2.scale.set(1.0,1.0,1);g.add(halo2);
  const rings=[];for(const [r,c] of [[0.13,'#cfc4ff'],[0.17,'#8fd8ff']]){const m=new THREE.Mesh(new THREE.TorusGeometry(r,0.0035,6,96),new THREE.MeshBasicMaterial({color:hdr(c,1.6),transparent:true,opacity:0.8,depthWrite:false,blending:THREE.AdditiveBlending}));g.add(m);rings.push(m);}
  const L=new THREE.PointLight('#a99cff',0,3.2,2);g.add(L);
  const motes=[];for(let i=0;i<3;i++){const s=hubStar(i?'#cfe6ff':'#e2d8ff',2);s.scale.set(0.09,0.09,1);g.add(s);motes.push(s);}
  return {g,U,core,halo,halo2,rings,motes,L,k:0,kT:0,pos:new THREE.Vector3()};
}
function hubOrbTick(o,c,dt,now,ps){
  if(!o)return;
  o.k+=(o.kT-o.k)*(1-Math.exp(-5*dt));
  o.g.visible=o.k>0.01;if(!o.g.visible||!c)return;
  const t=now/1000,P=c.pose,B=c.B;
  if(P&&P.orb==='M'&&B.hand_L&&B.hand_R){B.hand_L.getWorldPosition(_ht);B.hand_R.getWorldPosition(_hd);_ht.add(_hd).multiplyScalar(0.5);_ht.y+=0.1;}
  else if(B.hand_L){B.hand_L.getWorldPosition(_ht);const up=_hd.set(0,0.17,0.05).applyQuaternion(c.g.getWorldQuaternion(_hq));_ht.add(up);}
  _ht.x+=Math.sin(t*1.6)*0.025;_ht.y+=Math.sin(t*2.1)*0.03;_ht.z+=Math.cos(t*1.3)*0.02;
  if(!o.init){o.pos.copy(_ht);o.init=true;}else o.pos.lerp(_ht,1-Math.exp(-14*dt));
  o.g.position.copy(o.pos);o.g.scale.setScalar(o.k*(1+0.05*Math.sin(t*3)));
  o.U.uT.value=t;o.L.intensity=o.k*(1.3+0.25*Math.sin(t*2.3));
  o.rings[0].rotation.set(t*0.9,t*1.3,0);o.rings[1].rotation.set(-t*0.7,0.5,t*1.1);
  o.motes.forEach((m,i)=>{const a=t*(1.4+i*0.5)+i*2.1;m.position.set(Math.cos(a)*0.2,Math.sin(a*1.3)*0.08,Math.sin(a)*0.2);m.material.opacity=0.6+0.4*Math.sin(t*5+i);});
  if(ps&&Math.random()<dt*42){const a=Math.random()*6.28,r=0.08+Math.random()*0.08;
    ps.add({x:o.pos.x+Math.cos(a)*r,y:o.pos.y+(Math.random()-0.5)*0.1,z:o.pos.z+Math.sin(a)*r,vx:Math.cos(a)*0.05,vy:0.1+Math.random()*0.15,vz:Math.sin(a)*0.05,life:0.8+Math.random()*0.8,s:0.035+Math.random()*0.03,c:H_SPARK[(Math.random()*4)|0],dr:1.5,sw:3,swr:0.08,a:0.9});}
}
function hubBurst(ps,p,n,col,sp){for(let i=0;i<n;i++){const a=Math.random()*6.28,b=Math.random()*3.14-1.57,s=(sp||1)*(0.4+Math.random()*1.4);
  ps.add({x:p.x,y:p.y,z:p.z,vx:Math.cos(a)*Math.cos(b)*s,vy:Math.sin(b)*s+0.3,vz:Math.sin(a)*Math.cos(b)*s,life:0.5+Math.random()*0.7,s:0.03+Math.random()*0.05,c:col?hCol(col,1.8):H_SPARK[(Math.random()*4)|0],dr:3,gy:-0.4,fi:20});}}

// ---------- สร้างฉาก (ครั้งแรกที่เปิดเมนู) ----------
function hubBuild(){
  if(HUB.built)return;HUB.built=true;
  hubBuildStudy();hubBuildLobby();
  HUB.orb=hubMakeOrb(HUBS);
  loadModel('char_student');
}
// ไม้บนโต๊ะ = โคลนไม้ที่ตัวละครเลือก วางนอนบนผ้า ปลายชี้ไปทางตัวละคร
function hubPlaceWand(c){
  const F=HUB.fx;if(!c.wand||!c.wandBind)return;
  if(F.wandMesh){F.wandPivot.remove(F.wandMesh);F.wandMesh=null;}
  const w=c.wand.clone(true);w.matrixAutoUpdate=false;w.matrix.copy(c.wandBind.m);w.visible=true;
  const inner=new THREE.Group();inner.add(w);inner.position.copy(c.wandBind.c).negate();
  const holder=new THREE.Group();holder.add(inner);holder.rotation.z=Math.PI/2;   // แนวไม้ (แกน y) → นอนตามแกน x
  F.wandPivot.add(holder);F.wandMesh=holder;
  F.wandPivot.position.copy(HB.WAND);F.wandPivot.rotation.set(0,-2.04,0);
  // ปลายไม้: จุดปลายในกรอบ inner → ผ่าน holder
  F.wandTip.position.copy(c.wandBind.tip).sub(c.wandBind.c).applyEuler(holder.rotation);
  holder.traverse(m=>{if(m.isMesh)m.castShadow=true;});
}
function hubMenuChar(){
  const lk=lookStr(myLook);
  if(HUB.me&&HUB.me.lk!==lk){HUBS.remove(HUB.me.g);disposeTree(HUB.me.g);HUB.me=null;}
  if(!HUB.me){const c=hubMakeChar(lk);if(!c)return null;HUB.me=c;HUBS.add(c.g);hubResetMenu(true);}
  return HUB.me;
}
// กลับสู่ท่าเริ่ม: ยืนข้างโต๊ะ ก้มมองโต๊ะ ไม้วางบนโต๊ะ
function hubResetMenu(snap){
  const c=HUB.me;HUB.st='menu';HUB.t=0;HUB.pick=false;HUB.arrived=false;HUB.wi=0;if(HUB.orb){HUB.orb.kT=0;HUB.orb.k=0;}
  if(!c)return;
  c.g.position.copy(HB.C0);const a=Math.atan2(HB.TB.x-HB.C0.x,HB.TB.z-HB.C0.z)+0.12;c.ry=c.ryT=a;c.walkSp=0;
  hubSetPose(c,'lean');if(snap)c.pw=1;c.lookAt=null;
  if(c.wand)c.wand.visible=false;c.wandOn=false;hubPlaceWand(c);HUB.fx.wandPivot.visible=true;
  HUB.cam.init=false;
}

// ---------- กล้อง ----------
// วางกล้องให้จุด f อยู่ที่ตำแหน่งจอ nx (−1 ซ้าย … 1 ขวา) โดยมองตรงไปทิศ yaw/pitch ที่กำหนด
const _hf0=new THREE.Vector3(),_hf1=new THREE.Vector3(),_hf2=new THREE.Vector3(),_hf3=new THREE.Vector3();
function hubFrame(out,f0,dist,yaw,pitch,nx,ny,fov){
  const th=Math.tan(fov*Math.PI/360),asp=cam.aspect,f=_hf0.copy(f0);
  const fw=_hf1.set(Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).normalize();
  const rt=_hf2.set(Math.cos(yaw),0,Math.sin(yaw)),up=_hf3.crossVectors(rt,fw).normalize();
  // จุด f อยู่ที่ (nx,ny) บนจอ → ตำแหน่งกล้อง = f − fw·dist − rt·(nx·dist·th·asp) − up·(ny·dist·th)
  out.p.copy(f).addScaledVector(fw,-dist).addScaledVector(rt,-nx*dist*th*asp).addScaledVector(up,-ny*dist*th);
  out.l.copy(out.p).addScaledVector(fw,dist);
  return out;
}
const _hcA={p:new THREE.Vector3(),l:new THREE.Vector3()},_hcB={p:new THREE.Vector3(),l:new THREE.Vector3()};
function hubCamMenu(o){const n=cam.aspect<1.45?0.3:0.38;return hubFrame(o,_ht.set(HB.TB.x+0.4,1.05,HB.TB.z-0.45),4.7,0.46,0.07,n,0.02,44);}
function hubCamPose(o){return hubFrame(o,_ht.set(HB.P1.x,0.98,HB.P1.z+0.1),3.05,0,0.22,0,0,48);}
// ล็อบบี้: ให้แถวตัวละคร (x −2.1…3.75 ม.) อยู่เต็มพื้นที่ขวาของแผงห้องพอดีทุกขนาดจอ (จอแคบ = ถอยกล้อง) — ตรวจ 1891×942 / 1366×768 / 1024×768
function hubCamRoom(o){const th=Math.tan(17*Math.PI/180),R=typeof hubRoomRect==='function'?hubRoomRect():null,nx0=R?Math.min(0.2,(R.l+R.w)/Math.max(1,innerWidth)*2-1):-0.1;
  return hubFrame(o,_ht.set(0.83,1.1,-0.2),Math.max(10.5,6.6/((1-nx0)*th*cam.aspect)),-0.1,0.09,(nx0+1)/2,0.06,34);}

// ---------- ลำดับตอนกด "เล่น" ----------
function hubGo(){
  if(HUB.st!=='menu'||!HUB.me)return false;
  HUB.st='go';HUB.t=0;HUB.pick=false;snd('ui_click');return true;
}
function hubBack(){   // จากหน้าการ์ดโหมดกลับเมนูแรก
  hubFadeDo(()=>{hubResetMenu(true);if(typeof hubUiState==='function')hubUiState('menu');});
}
function hubFadeDo(fn,hold){const el=$('#hFade');if(!el){fn();return;}el.classList.add('on');setTimeout(()=>{try{fn();}finally{setTimeout(()=>el.classList.remove('on'),hold||120);}},380);}
function hubSeq(c,dt,now){
  const F=HUB.fx;HUB.t+=dt;const t=HUB.t;
  if(HUB.st==='go'){
    if(t<0.55){c.ikP=c.ikP||new THREE.Vector3();c.ikP.copy(HB.GRIP);if(c.poseN!=='reach'){hubSetPose(c,'reach');c.pk=7;}c.lookAt=HB.WAND;}
    if(t>=0.55&&!HUB.pick){HUB.pick=true;F.wandPivot.visible=false;if(c.wand)c.wand.visible=true;c.wandOn=true;snd('pickup',{vol:0.7});
      hubBurst(HUB.ps,F.wandTip.getWorldPosition(new THREE.Vector3()),40);hubSetPose(c,'lift');c.pk=6;}
    if(t>0.75)c.lookAt=null;
    if(t>0.85&&t<1.2){c.ryT=Math.atan2(HB.PATH[0].x-c.g.position.x,HB.PATH[0].z-c.g.position.z);c.turnK=5;}
    if(t>=1.15){
      let wp=HB.PATH[HUB.wi|0];let to=_ht.copy(wp).sub(c.g.position);to.y=0;
      if((HUB.wi|0)<HB.PATH.length-1&&to.length()<0.35){HUB.wi=(HUB.wi|0)+1;wp=HB.PATH[HUB.wi];to=_ht.copy(wp).sub(c.g.position);to.y=0;}
      const dl=to.length(),last=(HUB.wi|0)===HB.PATH.length-1;
      if((dl>0.04||!last)&&!HUB.arrived){const sp=Math.min(1.85,last?dl*3.2:9,(t-1.15)*4+0.3);c.walkSp=sp;c.g.position.addScaledVector(to.normalize(),Math.min(dl,sp*dt));c.ryT=Math.atan2(to.x,to.z);if(c.pwT>0){c.pwT=0;c.pk=8;}}
      else if(!HUB.arrived){HUB.arrived=true;HUB.arrT=t;c.walkSp=0;c.ryT=0;c.turnK=4;}
    }
    if(HUB.arrived&&t-HUB.arrT>0.15&&c.poseN!=='spread'){hubSetPose(c,'spread',0);c.pk=3.2;}
    if(HUB.arrived&&t-HUB.arrT>0.55&&HUB.orb.kT===0){HUB.orb.kT=1;HUB.orb.init=false;snd('buff',{vol:0.5});
      c.B.hand_L&&hubBurst(HUB.ps,c.B.hand_L.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,0.15,0)),50,'#b9a6ff',0.8);}
    if(HUB.arrived&&t-HUB.arrT>1.0){HUB.st='modes';HUB.arrived=false;if(typeof hubUiState==='function')hubUiState('modes');}
  }
}
// ข้ามไปท่าโพสทันที (กลับจากห้อง / เปิดเว็บใหม่หลังออกห้อง)
function hubSnapModes(){
  const c=HUB.me;if(!c)return false;
  c.g.position.copy(HB.P1);c.ry=c.ryT=0;c.walkSp=0;hubSetPose(c,'spread',0);c.pw=1;c.lookAt=null;
  for(const k of HPK)if(HPOSE.spread[k])c.cur[k].set(...HPOSE.spread[k]).normalize();
  if(c.wand)c.wand.visible=true;c.wandOn=true;HUB.fx.wandPivot.visible=false;HUB.pick=true;
  HUB.orb.kT=1;HUB.orb.k=1;HUB.orb.init=false;HUB.st='modes';HUB.cam.init=false;return true;
}

// ---------- ล็อบบี้: ใครยืนตรงไหน ท่าอะไร ----------
// ที่ยืนทั้งหมดอยู่ครึ่งขวาของจอ (แผงห้องบังครึ่งซ้าย ~x < −2) • แถวหน้า/หลังสลับกันไม่ให้บังกัน (ตรวจ 2026-10-23 ที่ 1891×942: เดิมทีมฟ้า 2 คนไปอยู่หลังแผง)
const HL_SPOTS=[[0.85,1.25],[-1.15,0.45],[2.85,0.4],[-0.15,-1.15],[1.85,-1.15],[3.55,-1.45]];
const HL_TEAM=[[[-0.85,1.1],[-1.6,-0.4],[0.35,-1.35]],[[2.25,1.1],[3.25,-0.35],[1.55,-1.4]]];
function hubLobbyLayout(L){
  const out=[],team=MODES[L.mode]&&MODES[L.mode].team,P=L.players.slice();
  const me=P.findIndex(p=>p.id===NET.myId);if(me>0)P.unshift(P.splice(me,1)[0]);
  if(team){const n=[0,0];for(const p of P){const tm=p.tm|0,s=HL_TEAM[tm][Math.min(2,n[tm]++)];out.push({p,x:s[0],z:s[1],tm});}}
  else P.forEach((p,i)=>{const s=HL_SPOTS[Math.min(i,5)];out.push({p,x:s[0],z:s[1],tm:-1});});
  return out;
}
function hubLobbyTick(dt,now){
  const L=LOBBY;if(!L)return [];
  const lay=hubLobbyLayout(L),want=new Set(),F=HUB.fx;
  lay.forEach((s,i)=>{
    const id=s.p.id,lk=s.p.lk||lookStr(getLook(id));let c=HUB.chars.get(id);
    if(c&&c.lk!==lk){HUBL.remove(c.g);disposeTree(c.g);HUB.chars.delete(id);c=null;}
    if(!c){c=hubMakeChar(lk);if(!c)return;HUB.chars.set(id,c);HUBL.add(c.g);c.g.position.set(s.x,0.2,s.z);c.inT=0;
      let pn='spread';if(id!==NET.myId){const used=new Set([...HUB.chars.values()].map(q=>q.poseN0));const h=hashStr(id);for(let k=0;k<5;k++){pn=LOBBY_POSES[1+((h+k)%5)];if(!used.has(pn))break;}}c.poseN0=pn;c.ry=c.ryT=(HPOSE[pn].ry||0)-s.x*0.06;hubSetPose(c,pn);c.pw=1;for(const k of HPK)if(HPOSE[pn][k])c.cur[k].set(...HPOSE[pn][k]).normalize();
      if(c.wand)c.wand.visible=true;c.wandOn=true;}
    want.add(id);
    c.g.position.x+=(s.x-c.g.position.x)*(1-Math.exp(-6*dt));c.g.position.z+=(s.z-c.g.position.z)*(1-Math.exp(-6*dt));c.g.position.y=0.2;
    c.ryT=(HPOSE[c.poseN0].ry||0)-s.x*0.06;
    c.inT=Math.min(1,(c.inT||0)+dt*1.6);c.g.scale.setScalar(0.94+0.06*hEase(c.inT));
    const sp=F.spots[i];if(sp){sp.g.visible=true;sp.g.position.set(c.g.position.x,0,c.g.position.z);const col=s.tm>=0?TEAMC[s.tm]:id===NET.myId?'#c9b8ff':'#8fa8ff';
      sp.ring.material.color.copy(hdr(col,1.5));sp.disc.material.color.copy(hdr(col,0.35));sp.cone.material.color.copy(hdr(col,0.12+0.03*Math.sin(now/600+i)));}
    s.c=c;
  });
  for(let i=lay.length;i<6;i++)if(F.spots[i])F.spots[i].g.visible=false;
  for(const [id,c] of HUB.chars)if(!want.has(id)){HUBL.remove(c.g);disposeTree(c.g);if(c.orb){HUBL.remove(c.orb.g);}HUB.chars.delete(id);}
  const camP=cam.position;
  for(const s of lay)if(s.c){const c=s.c;hubCharTick(c,dt,now,camP);
    if(c.pose&&c.pose.orb){if(!c.orb){c.orb=hubMakeOrb(HUBL);c.orb.kT=1;}hubOrbTick(c.orb,c,dt,now,HUB.psL);}}
  return lay;
}

// ป้ายชื่อเหนือหัว (บาง เรียบ)
function hubLabels(lay){
  const spk=speakingIds();cx.textAlign='center';cx.textBaseline='middle';
  for(const s of lay){if(!s.c||!s.c.B.head)continue;const hp=s.c.B.head.getWorldPosition(_ht);hp.y+=0.55;
    const v=_hd.copy(hp).project(cam);if(v.z>1||v.x<-1.1||v.x>1.1)continue;
    const x=(v.x+1)/2*SW,y=(1-v.y)/2*SH,p=s.p,me=p.id===NET.myId,host=p.id===LOBBY.host;
    cx.font='300 14px Kanit,sans-serif';const w=cx.measureText(p.n).width;
    cx.fillStyle=me?'#f1ecff':'rgba(232,236,255,.88)';cx.shadowColor='rgba(0,0,0,.8)';cx.shadowBlur=6;cx.fillText(p.n,x,y);cx.shadowBlur=0;
    const lc=s.tm>=0?TEAMC[s.tm]:me?'#b9a6ff':'rgba(190,178,255,.5)';cx.strokeStyle=lc;cx.lineWidth=1;cx.beginPath();cx.moveTo(x-w/2-6,y+11);cx.lineTo(x+w/2+6,y+11);cx.stroke();
    const tag=(host?'HOST':'')+(me?(host?' · ':'')+'YOU':'')+(spk.has(p.id)?'  ♪':'');
    if(tag){cx.font='500 9px Cinzel,serif';cx.fillStyle=me?'#b9a6ff':'rgba(200,200,230,.7)';cx.fillText(tag.split('').join(String.fromCharCode(8202)),x,y-13);}
  }
  cx.textBaseline='alphabetic';
}

// ---------- เรนเดอร์ (เรียกจาก renderStage — คืน true = วาดแล้ว) ----------
function hubRender(dt,now){
  const room=screen==='lobby'&&LOBBY&&LOBBY.ph==='lobby';
  if(!HUB.on||crOpen||!(screen==='menu'||room)){if(HUB.fovSet){cam.fov=SET.fov;cam.updateProjectionMatrix();HUB.fovSet=false;}document.body.classList.remove('hubOn');return false;}
  try{hubBuild();}catch(e){console.error('hub',e);HUB.on=false;return false;}
  document.body.classList.add('hubOn');
  dt=Math.min(dt,0.05);const t=now/1000,F=HUB.fx;
  const mx=((mouseX||SW/2)/Math.max(1,SW)-0.5),my=((mouseY||SH/2)/Math.max(1,SH)-0.5);
  let sc=HUBS,lay=null,want;
  if(room){
    sc=HUBL;lay=hubLobbyTick(dt,now);want=hubCamRoom(_hcB);
    F.lRune.rotation.z=t/20;F.lRune.material.opacity=0.24+0.08*Math.sin(t*0.8);F.dustL.rotation.y=t/60;
    if(Math.random()<dt*14)HUB.psL.add({x:rnd(-4,5),y:0.25,z:rnd(-3,2.5),vx:0,vy:0.25+Math.random()*0.3,vz:0,life:3+Math.random()*2,s:0.03+Math.random()*0.03,c:H_SPARK[(Math.random()*4)|0],sw:1.5,swr:0.1,a:0.7,fi:3});
    HUB.psL.tick(dt);
  }else{
    const c=hubMenuChar();
    if(c){hubSeq(c,dt,now);hubCharTick(c,dt,now,cam.position);}
    hubOrbTick(HUB.orb,c,dt,now,HUB.ps);
    // กล้อง: เมนู → (เดิน) → โพส
    if(HUB.st==='menu')want=hubCamMenu(_hcB);
    else if(HUB.st==='go'){const u=hEase(hSm(0.75,3.2,HUB.t));hubCamMenu(_hcA);hubCamPose(_hcB);_hcB.p.lerpVectors(_hcA.p,_hcB.p,u);_hcB.l.lerpVectors(_hcA.l,_hcB.l,u);HUB.fovT=lerp(44,48,u);want=_hcB;}
    else want=hubCamPose(_hcB);
    // ฉาก: ลูกแก้ว เทียน วงแหวน ประกายไม้ ฝุ่น ลำแสง
    F.ballU.uT.value=t;F.ballL.intensity=0.7+0.18*Math.sin(t*1.7)+0.08*Math.sin(t*5.3);
    F.flames.forEach(f=>{const k=0.85+0.15*Math.sin(t*13+f.ph)+0.08*Math.sin(t*31+f.ph*2);f.f.scale.set(0.075*k,0.14*(0.9+0.2*Math.sin(t*9+f.ph)),1);f.f2.material.opacity=0.8*k;});
    F.candleL.intensity=0.48+0.07*Math.sin(t*13)+0.04*Math.sin(t*29);
    F.armil.forEach((h,i)=>h.rotation.y=t*(0.25+i*0.18)*(i%2?-1:1));
    F.potions.forEach((p,i)=>p.gs.material.opacity=0.75+0.25*Math.sin(t*1.3+i*2));
    F.bookGlow.material.opacity=0.6+0.25*Math.sin(t*1.1);
    F.dust.rotation.y=Math.sin(t/30)*0.15;F.dust.position.y=Math.sin(t/7)*0.08;
    if(F.wandPivot.visible){const tp=F.wandTip.getWorldPosition(_hv3);
      F.wandStar.material.rotation=t*0.6;const tw=0.24+0.1*Math.sin(t*7)+0.06*Math.sin(t*17);F.wandStar.scale.set(tw,tw,1);F.wandGlow.scale.setScalar(0.18+0.04*Math.sin(t*5));
      if(Math.random()<dt*34)HUB.ps.add({x:tp.x+(Math.random()-0.5)*0.03,y:tp.y,z:tp.z+(Math.random()-0.5)*0.03,vx:(Math.random()-0.5)*0.12,vy:0.12+Math.random()*0.28,vz:(Math.random()-0.5)*0.12,life:0.9+Math.random()*1.4,s:0.02+Math.random()*0.035,c:H_SPARK[(Math.random()*4)|0],dr:0.8,sw:4,swr:0.06,tw:18,fi:10});
      if(Math.random()<dt*1.4)hubBurst(HUB.ps,tp,6,null,0.35);}
    // ประกายปลายไม้ในมือ
    if(c&&c.wandOn&&Math.random()<dt*(HUB.st==='modes'?16:8)){const tp=c.tip.getWorldPosition(_hv3);HUB.ps.add({x:tp.x,y:tp.y,z:tp.z,vx:(Math.random()-0.5)*0.15,vy:0.05+Math.random()*0.2,vz:(Math.random()-0.5)*0.15,life:0.6+Math.random()*0.8,s:0.025+Math.random()*0.03,c:H_SPARK[(Math.random()*4)|0],dr:1.2,tw:20,fi:10});}
    if(Math.random()<dt*5)HUB.ps.add({x:rnd(0,4),y:rnd(0.3,2.6),z:rnd(-2,2.5),vx:0,vy:0.04,vz:0,life:4+Math.random()*3,s:0.02+Math.random()*0.02,c:H_SPARK[(Math.random()*4)|0],sw:0.6,swr:0.05,tw:3,a:0.6,fi:2,fo:2});
    HUB.ps.tick(dt);
  }
  // กล้องนุ่ม + เอียงตามเมาส์นิดๆ
  const fv=room?36:HUB.st==='menu'?44:HUB.st==='go'?(HUB.fovT||44):48;
  if(Math.abs(cam.fov-fv)>0.01){cam.fov=fv;cam.updateProjectionMatrix();}HUB.fovSet=true;
  if(!HUB.cam.init||HUB.camScene!==sc){HUB.cam.p.copy(want.p);HUB.cam.l.copy(want.l);HUB.cam.init=true;HUB.camScene=sc;}
  const kk=1-Math.exp(-(HUB.st==='go'?10:4)*dt);HUB.cam.p.lerp(want.p,kk);HUB.cam.l.lerp(want.l,kk);
  const par=HUB.st==='modes'?0.12:0.2;
  cam.position.copy(HUB.cam.p).add(_hv.set(mx*par,-my*par*0.5+Math.sin(t*0.5)*0.03,0));
  cam.lookAt(_hv2.copy(HUB.cam.l).add(_hv.set(mx*par*0.3,-my*par*0.2,0)));
  rpass.scene=sc;gl.shadowMap.needsUpdate=true;composer.render();rpass.scene=scene;
  if(lay)hubLabels(lay);
  return true;
}
if(typeof WD!=='undefined')Object.assign(WD,{HUB,HUBS,HUBL,HPOSE,hubGo,hubSnapModes,hubResetMenu});
