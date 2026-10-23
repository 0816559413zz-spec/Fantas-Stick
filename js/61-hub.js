// =====================================================================
//  เมนูใหม่ — ฉาก 3D (ผู้ใช้ 2026-10-22 • สเปกเต็ม designs/ui-menu.md • หน้าจอ/ปุ่มอยู่ js/62)
//  ฉาก HUBS = ห้องทำงานนักเวทมืด (น้ำเงินเข้ม-ม่วง): โต๊ะสี่เหลี่ยมใหญ่เต็มจอ + ผ้าม่วงวางเฉียง ขอบ/มุมทอง • ไม้กายสิทธิ์ประกายบนโต๊ะ • ของจุกจิก + เฟอร์นิเจอร์นักเวท
//    แสงจันทร์ดวงเดียวจากหน้าต่างผนังขวา (ผู้ใช้ 2026-10-23)
//  ฉาก HUBL = ล็อบบี้รอเริ่ม: แท่นวงเวท ทุกคนในห้องยืนโชว์ด้านขวา ท่าต่างกัน ที่ยืนต่างกัน
//  HUB.st: menu (โต๊ะเต็มจอ ไม่มีตัวละคร) → go (มือเอื้อมหยิบไม้ → หมุนตัว ผ้าคลุมบังจอ → ท่าโพส กล้องต่ำแพนขึ้น) → modes (การ์ดโหมด)
//    → back (เล่นย้อนทั้งหมดกลับเมนู) • room (ล็อบบี้) — ลำดับเป็นฟังก์ชันของเวลา: hubSeqAt(c,t) + hubCamSeq(o,t)
//  ตัวละคร = โมเดลไฟล์ char_student จัดท่าเองทั้งตัว: hbAim หมุนกระดูกให้ชี้ทิศที่ต้องการ ทับท่า idle (หายใจ) จากไฟล์
//  ⚠ ตำแหน่ง/สี/ท่า/จังหวะทั้งหมด Claude ออกแบบเอง (ผู้ใช้ให้ออกแบบ) — เรนเดอร์จาก renderStage (js/32) ผ่าน hubRender()
// =====================================================================
const HUBS=new THREE.Scene(),HUBL=new THREE.Scene();
HUBS.background=new THREE.Color('#05070f');HUBS.fog=new THREE.Fog('#070a1a',7,24);
HUBL.background=new THREE.Color('#04060d');HUBL.fog=new THREE.Fog('#060818',10,30);
const HUB={on:true,built:false,st:'menu',t:0,me:null,chars:new Map(),fx:{},cam:{p:new THREE.Vector3(),l:new THREE.Vector3(),init:false},
  orb:null,wandT:null,ps:null,psL:null,fade:0,pick:false,goT:0,roomIn:0};
// จุดสำคัญในห้อง (หน่วย 3D) • TB = กลางโต๊ะ (สี่เหลี่ยม TW×TD) • C0 = ที่ยืนหยิบไม้ (ขวาโต๊ะ นอกจอเมนู) • P1 = ที่ยืนโพสหน้าโต๊ะ (หันหากล้อง)
//   WAND = ไม้บนโต๊ะ • GRIP = จุดจับด้าม (คำนวณใน hubPlaceWand)
const HB={TB:new THREE.Vector3(0.4,0,-0.6),TOP:0.925,TW:3.0,TD:1.4,C0:new THREE.Vector3(2.5,0,-0.42),P1:new THREE.Vector3(0.5,0,0.95),WAND:new THREE.Vector3(1.7,0.931,-0.4),GRIP:new THREE.Vector3()};
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
// ผ้าคลุมโต๊ะสี่เหลี่ยม: ผ้าสี่เหลี่ยม size วางเฉียง yaw ที่ (ox,oz) บนโต๊ะ hw×hd → ส่วนที่เลยขอบโต๊ะห้อยลง (มุมห้อยต่ำสุด) มีจีบเล็กน้อย
function hubCloth(hw,hd,size,yaw,ox,oz){
  const geo=new THREE.PlaneGeometry(size,size,64,64);geo.rotateX(-Math.PI/2);
  const p=geo.attributes.position,c=Math.cos(yaw),s=Math.sin(yaw);
  const drape=(x,z,out)=>{const dx=Math.max(0,Math.abs(x)-hw),dz=Math.max(0,Math.abs(z)-hd),o=Math.hypot(dx,dz);
    if(o<=0)return out.set(x,0.004,z);
    const nx=Math.sign(x)*dx/o,nz=Math.sign(z)*dz/o,ex=x-nx*o,ez=z-nz*o,e=Math.min(1,o/0.07),th=Math.atan2(z,x);
    const r=o*(0.1+0.1*(1-e))+0.012*e+Math.sin((ex+ez)*22)*0.012*o;
    return out.set(ex+nx*r,-o*0.97*e-o*0.25*(1-e)+Math.sin(th*7+o*6)*0.02*o+0.004,ez+nz*r);};
  const v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){const x0=p.getX(i),z0=p.getZ(i);drape(ox+x0*c-z0*s,oz+x0*s+z0*c,v);p.setXYZ(i,v.x,v.y,v.z);}
  geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,new THREE.MeshPhysicalMaterial({map:hubTexCloth(),color:'#8a7cae',roughness:0.85,sheen:0.6,sheenRoughness:0.5,sheenColor:new THREE.Color('#9a7ad8'),side:THREE.DoubleSide}));
  m.castShadow=true;m.receiveShadow=true;
  const corners=[];for(const [a,b] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const x0=a*size/2,z0=b*size/2;corners.push(drape(ox+x0*c-z0*s,oz+x0*s+z0*c,new THREE.Vector3()));}
  return {m,corners};
}
function hubTexRug(){
  return texCanvas(512,320,(g,W,H)=>{g.fillStyle='#2a0f1c';g.fillRect(0,0,W,H);
    for(let i=0;i<5000;i++){g.fillStyle=`rgba(${Math.random()<0.5?'255,200,190':'0,0,0'},${Math.random()*0.06})`;g.fillRect(Math.random()*W,Math.random()*H,2,2);}
    g.strokeStyle='#b88a4a';g.lineWidth=5;g.strokeRect(14,14,W-28,H-28);g.strokeStyle='#1b2a55';g.lineWidth=14;g.strokeRect(32,32,W-64,H-64);
    g.strokeStyle='rgba(184,138,74,.7)';g.lineWidth=2;g.strokeRect(46,46,W-92,H-92);
    g.save();g.translate(W/2,H/2);g.strokeStyle='rgba(184,138,74,.55)';g.lineWidth=2;
    for(const k of [1,0.7,0.4]){g.beginPath();g.moveTo(-150*k,0);g.lineTo(0,-90*k);g.lineTo(150*k,0);g.lineTo(0,90*k);g.closePath();g.stroke();}g.restore();
    g.fillStyle='rgba(184,138,74,.6)';for(let x=24;x<W-20;x+=16){g.fillRect(x,4,2,8);g.fillRect(x,H-12,2,8);}
  });
}
function hubTexGlobe(){
  return texCanvas(512,256,(g,W,H)=>{g.fillStyle='#16244a';g.fillRect(0,0,W,H);g.fillStyle='#8a6a34';
    for(let i=0;i<14;i++){const x=Math.random()*W,y=H*0.2+Math.random()*H*0.6,r=12+Math.random()*34;g.beginPath();for(let k=0;k<=12;k++){const a=k/12*6.28,rr=r*(0.6+Math.random()*0.5);g.lineTo(x+Math.cos(a)*rr*1.4,y+Math.sin(a)*rr);}g.fill();}
    g.strokeStyle='rgba(226,194,122,.35)';g.lineWidth=1;for(let x=0;x<W;x+=W/12){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}for(let y=H/6;y<H;y+=H/6){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
  });
}
function hubTexMap(){
  return texCanvas(256,192,(g,W,H)=>{g.fillStyle='#cdb98f';g.fillRect(0,0,W,H);for(let i=0;i<1500;i++){g.fillStyle=`rgba(90,60,30,${Math.random()*0.07})`;g.fillRect(Math.random()*W,Math.random()*H,2,2);}
    g.strokeStyle='rgba(70,45,25,.65)';g.lineWidth=1.5;g.beginPath();g.moveTo(20,120);g.bezierCurveTo(60,60,110,150,150,90);g.bezierCurveTo(180,50,220,80,236,40);g.stroke();
    g.setLineDash([4,4]);g.strokeStyle='rgba(140,30,40,.7)';g.beginPath();g.moveTo(40,40);g.quadraticCurveTo(120,100,200,150);g.stroke();g.setLineDash([]);
    g.strokeStyle='rgba(70,45,25,.5)';g.beginPath();g.arc(200,150,9,0,7);g.stroke();g.beginPath();g.arc(40,40,6,0,7);g.stroke();
    g.save();g.translate(52,150);g.strokeStyle='rgba(70,45,25,.6)';for(let i=0;i<4;i++){g.rotate(Math.PI/4);g.beginPath();g.moveTo(0,-18);g.lineTo(0,18);g.stroke();}g.restore();
  });
}
function hubTexStars(){
  return texCanvas(256,256,(g,W)=>{g.fillStyle='#0d1430';g.fillRect(0,0,W,W);g.strokeStyle='rgba(226,194,122,.5)';g.lineWidth=1.5;g.beginPath();g.arc(W/2,W/2,112,0,7);g.stroke();g.beginPath();g.arc(W/2,W/2,100,0,7);g.stroke();
    const st=[];for(let i=0;i<26;i++){const a=Math.random()*6.28,r=Math.random()*92;st.push([W/2+Math.cos(a)*r,W/2+Math.sin(a)*r]);}
    g.strokeStyle='rgba(200,215,255,.35)';g.lineWidth=1;g.beginPath();for(let i=0;i<st.length-1;i+=2){g.moveTo(...st[i]);g.lineTo(...st[i+1]);}g.stroke();
    g.fillStyle='#e8eeff';for(const [x,y] of st){g.beginPath();g.arc(x,y,1.2+Math.random()*1.6,0,7);g.fill();}
  });
}
// ผ้าคลุมตัวละครที่สะบัดผ่านกล้อง (ตอนหยิบไม้แล้วหันตัว) — ผ้า 3D ใช้วัสดุผ้าคลุมจริงของตัวเรา (tint_cloak ด้านนอก + tint_house ซับใน)
//   วาดเป็นชั้นแยกหลัง composer (ฉาก/กล้อง/ไฟของตัวเอง) → ไม่โดน AO/AA ของฉากหลัก (เดิมแผ่น 3D ในฉากมีเส้นขอบ AO ทะลุ, แบบ DOM ดูแตกเป็นภาพ)
//   ขอบนำม้วนกลับเป็นทรงกระบอก (เห็นซับใน) • จีบผ้าแนวตั้งพลิ้วตามเวลา • เลื่อนต่อเนื่องไม่หยุด (บังเต็มจอช่วง hold0–hold1)
const HWP={NS:300,NV:26,D:1,W:6,CURL:0.55,TAIL:0.4,R:0.2};   // W = ความกว้างผ้า (เท่าของครึ่งจอ) • CURL/TAIL = ช่วงขอบนำ/ขอบท้ายที่ม้วน • R = รัศมีม้วน (เท่าครึ่งจอ)
function hubWipeMake(){
  const S=new THREE.Scene(),cam2=new THREE.PerspectiveCamera(44,1,0.05,10);
  S.add(new THREE.HemisphereLight('#7f92d8','#0a0716',0.22));   // ไฟเฉียงจากขวา (แสงจันทร์ฝั่งหน้าต่าง) → สันจีบสว่าง ร่องมืด
  const l1=new THREE.DirectionalLight('#c8d6ff',2.6);l1.position.set(2.6,0.7,0.45);S.add(l1);
  const l2=new THREE.DirectionalLight('#9a74ff',0.7);l2.position.set(-2,-0.3,0.4);S.add(l2);
  const geo=new THREE.PlaneGeometry(1,1,HWP.NS,HWP.NV);
  const out=new THREE.Mesh(geo,new THREE.MeshStandardMaterial()),inn=new THREE.Mesh(geo,new THREE.MeshStandardMaterial());
  out.frustumCulled=inn.frustumCulled=false;S.add(out,inn);
  return {S,cam:cam2,geo,out,inn,lk:null};
}
// เอาวัสดุผ้าคลุมของตัวละครเรามาใช้ (โคลน: ด้านนอก = หน้าผ้า, ซับใน = หลังผ้า)
function hubWipeLook(W,c){
  if(!c||W.lk===c.lk)return;W.lk=c.lk;
  let mo=null,mi=null;c.inst.traverse(m=>{if(!m.isMesh)return;const n=(m.material&&m.material.name||'').toLowerCase();if(n==='tint_cloak')mo=m.material;else if(n==='tint_house')mi=m.material;});
  for(const [mesh,src,side,fb] of [[W.out,mo,THREE.FrontSide,'#141a30'],[W.inn,mi,THREE.BackSide,'#6a1624']]){
    const old=mesh.material,mt=src?src.clone():new THREE.MeshStandardMaterial({color:fb,roughness:0.9});
    mt.side=side;mt.transparent=false;mt.opacity=1;mt.fog=false;mesh.material=mt;old.dispose();}
}
// p = ความคืบหน้า 0…1 (wipe0…wipe1) • ขยับจุดผ้าทั้งแผ่นตามเวลา แล้ววาดทับจอ
function hubWipeDraw(W,p,t){
  const cam2=W.cam;cam2.fov=cam.fov;cam2.aspect=cam.aspect;cam2.updateProjectionMatrix();
  const hh=Math.tan(cam2.fov*Math.PI/360)*HWP.D,hw=hh*cam2.aspect,L0=HWP.CURL*hw,L1=HWP.TAIL*hw,St=HWP.W*hw+L0+L1,R=HWP.R*hw;
  const e=p*p*p*(p*(p*6-15)+10);   // smootherstep: เร่งเข้า-ผ่อนออก ไม่มีจังหวะหยุด
  const x0=hw*1.1-L0+R,x1=-hw*1.1-St+L1-R,xL=x0+(x1-x0)*e;   // ขอบนำเริ่มนอกจอขวา → จบเมื่อขอบท้ายพ้นจอซ้าย
  const P=W.geo.attributes.position,NS=HWP.NS,NV=HWP.NV,H=hh*3.2,tilt=0.07-0.09*(e-0.5),D=HWP.D;
  for(let j=0;j<=NV;j++){const v=j/NV,y0=(0.5-v)*H,fan=1+0.3*v;
    const r=R*(1+0.35*Math.sin(v*5.5+t*7)+0.15*Math.sin(v*13-t*11)),r2=R*0.8*(1+0.3*Math.sin(v*4-t*6));   // ขอบพลิ้วตามความสูง
    for(let i=0;i<=NS;i++){const s=i/NS*St,q=s/hw;let x,z;
      // จีบผ้า: สันคม ร่องกว้าง (กางออกไปทางชายผ้า) + โป่งลมช้า ๆ
      const sn=Math.sin(q*5.2/fan+Math.sin(v*2.2+t*1.7)*0.7),pl=Math.pow(sn*sn+0.03,0.32)*0.11*hw+Math.sin(q*1.6-t*2.3)*0.1*hw;
      if(s<L0){const ph=(L0-s)/r;x=xL+L0-r*Math.sin(ph);z=-D+pl*(s/L0)-r*(1-Math.cos(ph));}
      else if(s>St-L1){const ph=(s-St+L1)/r2;x=xL+St-L1+r2*Math.sin(ph);z=-D+pl*((St-s)/L1)-r2*(1-Math.cos(ph));}
      else{x=xL+s;z=-D+pl;}
      P.setXYZ(j*(NS+1)+i,x,y0+Math.sin(q*0.5+t*2)*0.02*hh-x*tilt,z+0.08*hw*Math.sin(v*Math.PI));}}
  P.needsUpdate=true;W.geo.computeVertexNormals();
  const ac=gl.autoClear;gl.autoClear=false;gl.setRenderTarget(null);gl.clearDepth();gl.render(W.S,cam2);gl.autoClear=ac;
}
function hubBuildStudy(){
  const S=HUBS,F=HUB.fx,TB=HB.TB,y0=HB.TOP,hw=HB.TW/2,hd=HB.TD/2;
  // แสง (ผู้ใช้ 2026-10-23: "แสงกระทบเยอะไป เล่นแสงมุมเดียวจากด้านข้าง"): แสงจันทร์จากหน้าต่างผนังขวาดวงเดียว (มีเงา) อีกฝั่งปล่อยมืด
  //   ที่เหลือเป็นแสงเล็กระยะสั้นจากของบนโต๊ะ (เทียน ลูกแก้ว) • ไม่มีแสงเติมจากหน้า/บน
  S.add(new THREE.HemisphereLight('#4a5ab0','#06050c',0.08));S.add(new THREE.AmbientLight('#121630',0.07));
  const moon=new THREE.SpotLight('#a9c0ff',2.3,20,0.5,0.7,1);moon.position.set(5.9,3.7,0.1);moon.target.position.set(0.7,0.8,-0.1);
  moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);moon.shadow.bias=-0.0004;moon.shadow.camera.near=1.5;moon.shadow.camera.far=16;S.add(moon,moon.target);F.moon=moon;
  F.candleL=new THREE.PointLight('#ffb070',0.32,1.6,2);F.candleL.position.set(TB.x-0.75,y0+0.4,TB.z-0.45);S.add(F.candleL);
  F.ballL=new THREE.PointLight('#9a7dff',0.6,1.9,2);F.ballL.position.set(TB.x+0.3,y0+0.32,TB.z-0.35);S.add(F.ballL);
  // พื้น ผนังหลัง/ซ้าย/ขวา
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({map:hubTexFloor(),roughness:0.5,metalness:0.08,color:'#5d6288'}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;S.add(floor);
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(40,14),stoneMat(12,4,'#1f2340'));wall.position.set(0,7,-4.6);wall.receiveShadow=true;S.add(wall);
  const wallL=new THREE.Mesh(new THREE.PlaneGeometry(30,14),stoneMat(9,4,'#262a46'));wallL.position.set(-6.5,7,6);wallL.rotation.y=Math.PI/2;S.add(wallL);
  const wallR=new THREE.Mesh(new THREE.PlaneGeometry(30,14),stoneMat(9,4,'#262a46'));wallR.position.set(6.4,7,6);wallR.rotation.y=-Math.PI/2;wallR.receiveShadow=true;S.add(wallR);
  const arch=(w,h)=>{const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h-w/2);s.absarc(0,h-w/2,w/2,Math.PI,0,true);s.lineTo(w/2,0);s.lineTo(-w/2,0);return new THREE.ShapeGeometry(s,28);};
  const wtex=hubTexWindow(),frM=new THREE.MeshStandardMaterial({color:'#1a1a2c',roughness:0.9}),silM=new THREE.MeshStandardMaterial({color:'#22243a',roughness:0.9});
  const win=(w,h,k,par)=>{const g=arch(w,h),uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(p.getX(i)+w/2)/w,p.getY(i)/h);
    const G=new THREE.Group();const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:wtex,color:hdr('#ffffff',k),fog:false}));G.add(m);
    const fr=new THREE.Mesh(arch(w+0.5,h+0.25),frM);fr.position.set(0,-0.12,-0.02);G.add(fr);
    const sill=new THREE.Mesh(new THREE.BoxGeometry(w+0.7,0.12,0.35),silM);sill.position.set(0,-0.12,0.13);G.add(sill);par.add(G);return G;};
  // หน้าต่างใหญ่ผนังขวา = ที่มาของแสงจันทร์ดวงเดียว • หน้าต่างผนังหลังมืดลง (แค่ให้เห็นรูปทรงห้อง ไม่มีลำแสง)
  {const W=win(2.4,5.0,1.0,S);W.position.set(6.35,1.3,0.2);W.rotation.y=-Math.PI/2;}
  {const W=win(1.6,3.6,0.32,S);W.position.set(-0.6,1.5,-4.55);}
  for(let i=0;i<3;i++){const sh=new THREE.Mesh(new THREE.PlaneGeometry(1.3,8),new THREE.MeshBasicMaterial({map:hubShaftTex,color:hdr('#9fb8ff',0.075),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:false}));
    sh.position.set(3.6,2.6,0.2+(i-1)*0.7);sh.rotation.set(0.1*(i-1),Math.PI/2,0.95);S.add(sh);(F.shafts=F.shafts||[]).push(sh);}
  {const pt=texCanvas(256,512,(g,W,H)=>{const r=g.createLinearGradient(0,0,0,H);r.addColorStop(0,'rgba(255,255,255,.95)');r.addColorStop(1,'rgba(255,255,255,.05)');g.fillStyle=r;g.fillRect(0,0,W,H);
      g.globalCompositeOperation='destination-out';g.fillStyle='#000';g.fillRect(W/2-7,0,14,H);for(const y of [0.3,0.6,0.85])g.fillRect(0,H*y-6,W,12);
      g.filter='blur(6px)';g.globalCompositeOperation='destination-in';const e=g.createLinearGradient(0,0,W,0);e.addColorStop(0,'rgba(0,0,0,0)');e.addColorStop(0.12,'#000');e.addColorStop(0.88,'#000');e.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=e;g.fillRect(0,0,W,H);},false);
    const len=6,geo=new THREE.PlaneGeometry(2.2,len,1,8),pp=geo.attributes.position;for(let i=0;i<pp.count;i++){const v=(pp.getY(i)+len/2)/len;pp.setX(i,pp.getX(i)*(1+v*0.7)+v*len*0.12);}
    const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:pt,color:hdr('#8fb0ff',0.3),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));m.rotation.set(-Math.PI/2,0,-Math.PI/2);m.position.set(6.3-len/2,0.006,0.2);S.add(m);}
  const curtM=new THREE.MeshStandardMaterial({color:'#2a1544',roughness:0.85,side:THREE.DoubleSide});
  for(const sx of [-1,1]){const g=new THREE.PlaneGeometry(1.2,8,30,1),p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*14)*0.09);g.computeVertexNormals();
    const c=new THREE.Mesh(g,curtM);c.position.set(6.2,4.4,0.2+sx*1.85);c.rotation.y=-Math.PI/2;S.add(c);}
  // ---------- เฟอร์นิเจอร์ห้องนักเวท (ผู้ใช้ 2026-10-23: เก้าอี้ ชั้นหนังสือ ต้นไม้ ฯลฯ) ----------
  const wood=new THREE.MeshStandardMaterial({color:'#2b1b12',roughness:0.55,metalness:0.05}),wood2=new THREE.MeshStandardMaterial({color:'#24180f',roughness:0.8});
  const goldM=new THREE.MeshStandardMaterial({color:'#e0bd6e',metalness:0.85,roughness:0.32,emissive:'#3a2a08'}),ironM=new THREE.MeshStandardMaterial({color:'#1c1e26',metalness:0.6,roughness:0.45});
  const box=(par,w,h,d,x,y,z,m)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m||wood2);b.position.set(x,y,z);b.castShadow=b.receiveShadow=true;par.add(b);return b;};
  const grp=(x,y,z,ry)=>{const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry||0;S.add(g);return g;};
  // ชั้นหนังสือ 2 ตู้ (ผนังหลัง) + 1 ตู้ผนังซ้าย
  {const shelf=new THREE.Group(),cols=['#2a3a7a','#6a2a3a','#2a5a4a','#7a6a3a','#3a2a5a','#8a8070'];
    box(shelf,2.4,4.2,0.5,0,2.1,0);
    for(let r=0;r<5;r++){box(shelf,2.3,0.06,0.48,0,0.35+r*0.8,0.03,new THREE.MeshStandardMaterial({color:'#2e2014',roughness:0.8}));let x=-1.05;
      while(x<1.0){if(Math.random()<0.08){x+=0.12;continue;}const w=0.06+Math.random()*0.07,h=0.42+Math.random()*0.28,lean=Math.random()<0.1?0.25:0;const b=box(shelf,w,h,0.34,x+w/2,0.38+r*0.8+h/2,0.08,new THREE.MeshStandardMaterial({color:cols[(Math.random()*cols.length)|0],roughness:0.8}));b.rotation.z=lean;x+=w+0.012+lean*0.1;}}
    shelf.position.set(-2.7,0,-4.3);S.add(shelf);
    const s2=shelf.clone();s2.position.set(3.4,0,-4.3);S.add(s2);
    const s3=shelf.clone();s3.position.set(-6.2,0,-1.6);s3.rotation.y=Math.PI/2;S.add(s3);}
  // เก้าอี้พนักสูงหลังโต๊ะ (หันหาโต๊ะ) • เบาะม่วง
  {const g=grp(TB.x-1.05,0,TB.z-1.05,0.45),cush=new THREE.MeshStandardMaterial({color:'#3a1a5c',roughness:0.85});
    box(g,0.62,0.07,0.56,0,0.52,0,wood);box(g,0.56,0.06,0.5,0,0.58,0,cush);
    for(const [x,z] of [[-0.27,-0.24],[0.27,-0.24],[-0.27,0.24],[0.27,0.24]])box(g,0.06,0.52,0.06,x,0.26,z,wood);
    for(const x of [-0.28,0.28])box(g,0.07,1.75,0.07,x,0.88,-0.26,wood);
    box(g,0.5,1.0,0.04,0,1.12,-0.27,cush);box(g,0.68,0.1,0.09,0,1.72,-0.26,wood);
    for(const x of [-0.28,0.28]){const f=new THREE.Mesh(new THREE.SphereGeometry(0.05,12,8),goldM);f.position.set(x,1.8,-0.26);g.add(f);}}
  // ต้นไม้ในกระถาง (ใบเรืองฟ้านิดๆ ที่ปลายกิ่ง)
  {const g=grp(3.6,0,-3.4),pot=hubLathe([[0,0],[0.26,0],[0.3,0.06],[0.34,0.42],[0.38,0.46],[0.36,0.5],[0,0.5]],new THREE.MeshStandardMaterial({color:'#4a2a22',roughness:0.85}),24);pot.castShadow=true;g.add(pot);
    const soil=new THREE.Mesh(new THREE.CircleGeometry(0.33,20),new THREE.MeshStandardMaterial({color:'#1a120c'}));soil.rotation.x=-Math.PI/2;soil.position.y=0.48;g.add(soil);
    const barkM=new THREE.MeshStandardMaterial({color:'#3a2a1e',roughness:0.9}),leafM=new THREE.MeshStandardMaterial({color:'#1d3a2e',roughness:0.8,emissive:'#06221a'});
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0.45,0),new THREE.Vector3(0.08,1.0,0.02),new THREE.Vector3(-0.06,1.5,-0.03),new THREE.Vector3(0.05,1.95,0)]);
    const tr=new THREE.Mesh(new THREE.TubeGeometry(curve,20,0.05,8),barkM);tr.castShadow=true;g.add(tr);F.leaves=[];
    for(let i=0;i<9;i++){const a=i/9*6.28,r=0.25+Math.random()*0.25,y=1.45+Math.random()*0.75;const l=new THREE.Mesh(new THREE.IcosahedronGeometry(0.2+Math.random()*0.12,1),leafM);l.position.set(Math.cos(a)*r,y,Math.sin(a)*r);l.scale.y=0.75;l.castShadow=true;g.add(l);
      if(i%2===0){const s=new THREE.Sprite(glowMat('#7fffd8',0.5));s.scale.set(0.12,0.12,1);s.position.copy(l.position).multiplyScalar(1.12);g.add(s);F.leaves.push(s);}}}
  // หม้อปรุงยา (ขาเหล็ก 3 ขา น้ำยาเขียวเรืองจางๆ ไม่มีแสงส่องออก)
  {const g=grp(-1.95,0,-2.55),pot=hubLathe([[0,0.12],[0.22,0.13],[0.36,0.25],[0.42,0.45],[0.38,0.66],[0.32,0.72],[0.36,0.75],[0.3,0.75]],ironM,28);pot.castShadow=true;g.add(pot);
    for(let i=0;i<3;i++){const a=i/3*6.28;box(g,0.04,0.2,0.04,Math.cos(a)*0.24,0.1,Math.sin(a)*0.24,ironM);}
    const liq=new THREE.Mesh(new THREE.CircleGeometry(0.31,24),new THREE.MeshBasicMaterial({color:hdr('#4fd88a',0.55)}));liq.rotation.x=-Math.PI/2;liq.position.y=0.68;g.add(liq);
    const gs=new THREE.Sprite(glowMat('#5dff9a',0.35));gs.scale.set(0.9,0.5,1);gs.position.y=0.78;g.add(gs);F.cauldron={g,gs,top:new THREE.Vector3(-1.95,0.7,-2.55)};}
  // กล้องดูดาว (ข้างหน้าต่างขวา) + ลูกโลก + หีบ + พรม + แผนที่ดาวบนผนัง + ชั้นขวดยาบนผนัง
  {const g=grp(4.6,0,-1.2,-0.6);for(let i=0;i<3;i++){const a=i/3*6.28,l=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,1.35,6),wood);l.position.set(Math.cos(a)*0.22,0.62,Math.sin(a)*0.22);l.rotation.set(Math.sin(a)*0.33,0,-Math.cos(a)*0.33);l.castShadow=true;g.add(l);}
    const tube=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.1,1.2,16),goldM);tube.position.set(0.15,1.45,0);tube.rotation.z=-1.05;tube.castShadow=true;g.add(tube);
    const lens=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.06,16),ironM);lens.position.set(0.66,1.75,0);lens.rotation.z=-1.05;g.add(lens);}
  {const g=grp(-1.25,0,-1.95,0.4),st=hubLathe([[0,0],[0.22,0],[0.06,0.06],[0.04,0.7],[0.08,0.74],[0,0.74]],wood,16);g.add(st);
    const gl=new THREE.Mesh(new THREE.SphereGeometry(0.24,28,18),new THREE.MeshStandardMaterial({map:hubTexGlobe(),roughness:0.5,metalness:0.1}));gl.position.y=1.0;gl.rotation.z=0.4;gl.castShadow=true;g.add(gl);F.globe=gl;
    const mer=new THREE.Mesh(new THREE.TorusGeometry(0.27,0.01,6,48),goldM);mer.position.y=1.0;mer.rotation.z=0.4;g.add(mer);}
  {const g=grp(-3.0,0,-0.7,0.35),chM=new THREE.MeshStandardMaterial({color:'#3a2416',roughness:0.75});box(g,0.95,0.48,0.55,0,0.24,0,chM);
    const lid=new THREE.Mesh(new THREE.CylinderGeometry(0.275,0.275,0.95,16,1,false,0,Math.PI),chM);lid.rotation.set(0,0,Math.PI/2);lid.position.y=0.48;lid.castShadow=true;g.add(lid);
    for(const x of [-0.3,0.3]){box(g,0.05,0.5,0.57,x,0.25,0,goldM);const b=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.05,16,1,false,0,Math.PI),goldM);b.rotation.set(0,0,Math.PI/2);b.position.set(x,0.48,0);g.add(b);}}
  {const rug=new THREE.Mesh(new THREE.PlaneGeometry(4.6,2.9),new THREE.MeshStandardMaterial({map:hubTexRug(),roughness:0.95}));rug.rotation.x=-Math.PI/2;rug.position.set(TB.x,0.004,TB.z+0.25);rug.receiveShadow=true;S.add(rug);}
  {const m=new THREE.Mesh(new THREE.CircleGeometry(0.65,40),new THREE.MeshStandardMaterial({map:hubTexStars(),roughness:0.9}));m.position.set(1.1,2.85,-4.57);S.add(m);
    const r=new THREE.Mesh(new THREE.TorusGeometry(0.67,0.025,6,48),goldM);r.position.copy(m.position);S.add(r);}
  {const g=grp(-0.6,0,-4.45);box(g,1.5,0.05,0.26,0,0.95,0.06,wood);for(const x of [-0.6,0.6])box(g,0.04,0.2,0.2,x,0.86,0.05,wood);
    const cc=['#b77dff','#6fe0ff','#ff7ab8','#9dffb0','#ffd27a'];for(let i=0;i<6;i++){const x=-0.6+i*0.24,h=0.14+Math.random()*0.12;
      const b=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.055,h,10),new THREE.MeshStandardMaterial({color:cc[i%5],roughness:0.2,emissive:cc[i%5],emissiveIntensity:0.12,transparent:true,opacity:0.8}));b.position.set(x,0.975+h/2,0.06);g.add(b);}
    g.position.y=1.4;}
  // ---------- โต๊ะสี่เหลี่ยมผืนผ้าใหญ่ (ผู้ใช้ 2026-10-23: โต๊ะใหญ่เต็มจอฉากแรก) + ผ้าม่วงขอบทองวางเฉียง ----------
  const T=new THREE.Group();T.position.copy(TB);S.add(T);F.table=T;
  {const top=box(T,HB.TW,0.07,HB.TD,0,y0-0.035,0,wood);top.castShadow=top.receiveShadow=true;
    box(T,HB.TW+0.05,0.03,HB.TD+0.05,0,y0-0.085,0,wood);
    box(T,HB.TW-0.24,0.13,0.04,0,y0-0.16,hd-0.1,wood);box(T,HB.TW-0.24,0.13,0.04,0,y0-0.16,-hd+0.1,wood);box(T,0.04,0.13,HB.TD-0.24,hw-0.1,y0-0.16,0,wood);box(T,0.04,0.13,HB.TD-0.24,-hw+0.1,y0-0.16,0,wood);
    const legPts=[[0,0],[0.06,0],[0.065,0.04],[0.045,0.08],[0.04,0.3],[0.062,0.38],[0.072,0.45],[0.05,0.52],[0.036,0.66],[0.05,0.72],[0.058,0.82],[0,y0-0.1]];
    for(const [sx,sz] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const l=hubLathe(legPts,wood,16);l.position.set(sx*(hw-0.12),0,sz*(hd-0.12));l.castShadow=true;T.add(l);}}
  const {m:cl,corners}=hubCloth(hw,hd,1.6,0.42,0.12,0.02);cl.position.y=y0;T.add(cl);
  for(const c of corners){if(c.y>-0.02)continue;const ts=new THREE.Group();ts.position.set(c.x,y0+c.y,c.z);
    const k=new THREE.Mesh(new THREE.SphereGeometry(0.025,10,8),goldM);ts.add(k);const f=new THREE.Mesh(new THREE.ConeGeometry(0.03,0.11,10,1,true),goldM);f.position.y=-0.07;f.rotation.x=Math.PI;ts.add(f);T.add(ts);}
  // ลูกแก้วพยากรณ์บนฐานทอง (เรืองม่วง-ฟ้า หมุนวน)
  {const g=new THREE.Group();g.position.set(-0.1,y0,-0.35);T.add(g);
    const base=hubLathe([[0,0],[0.12,0],[0.13,0.02],[0.07,0.05],[0.05,0.09],[0.1,0.12],[0,0.12]],goldM,24);g.add(base);
    F.ballU={uT:{value:0}};
    const ball=new THREE.Mesh(new THREE.SphereGeometry(0.15,40,28),new THREE.ShaderMaterial({uniforms:F.ballU,transparent:true,depthWrite:false,
      vertexShader:'varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;vP=position;gl_Position=projectionMatrix*mv;}',
      fragmentShader:'uniform float uT;varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){float f=pow(1.-max(dot(normalize(vN),normalize(vV)),0.),2.);vec3 q=vP*20.;float s=sin(q.x+uT*1.3+sin(q.y*.7+uT))*sin(q.y*.9-uT*1.1)*sin(q.z*1.1+uT*.8);float sw=smoothstep(.15,.95,s*.5+.5);vec3 c=mix(vec3(.2,.08,.55),vec3(.5,.9,1.2),sw)*(.3+1.1*sw)+vec3(.75,.65,1.)*f*1.5;gl_FragColor=vec4(c,.45+f*.5);}'}));
    ball.position.y=0.27;g.add(ball);const gl2=new THREE.Sprite(glowMat('#9a7dff',0.9));gl2.scale.set(0.8,0.8,1);gl2.position.y=0.27;g.add(gl2);F.ball=g;}
  F.ballL.position.set(TB.x-0.1,y0+0.32,TB.z-0.35);
  // หนังสือเปิดอยู่ (หน้ามีรูนเรือง) + กองหนังสือ + ม้วนกระดาษ
  {const g=new THREE.Group();g.position.set(-0.55,y0,0.18);g.rotation.y=-0.22;T.add(g);
    const cov=new THREE.Mesh(new THREE.BoxGeometry(0.66,0.02,0.45),new THREE.MeshStandardMaterial({color:'#3a1414',roughness:0.7}));cov.position.y=0.01;cov.castShadow=true;g.add(cov);
    const pm=new THREE.MeshStandardMaterial({map:hubTexPage(),roughness:0.9});
    for(const s of [-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(0.31,0.025,0.42),pm);p.position.set(s*0.16,0.035,0);p.rotation.z=-s*0.09;g.add(p);}
    F.bookGlow=new THREE.Sprite(glowMat('#a995ff',0.55));F.bookGlow.scale.set(0.6,0.35,1);F.bookGlow.position.y=0.08;g.add(F.bookGlow);F.book=g;}
  {const g=new THREE.Group();g.position.set(-1.2,y0,-0.3);g.rotation.y=0.5;T.add(g);let y=0;
    for(const [c,w,h] of [['#1f2f6a',0.38,0.07],['#5a1d2e',0.34,0.06],['#1d4a3a',0.32,0.055],['#3a2a5a',0.28,0.05]]){const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w*0.72),new THREE.MeshStandardMaterial({color:c,roughness:0.75}));b.position.y=y+h/2;b.rotation.y=(Math.random()-0.5)*0.4;b.castShadow=true;g.add(b);
      const band=new THREE.Mesh(new THREE.BoxGeometry(w+0.004,h*0.25,w*0.72+0.004),goldM);band.position.copy(b.position);band.rotation.copy(b.rotation);g.add(band);y+=h;}}
  {const pM=new THREE.MeshStandardMaterial({color:'#d8c9a6',roughness:0.9});
    for(const [x,z,ry,l] of [[-1.05,0.35,0.3,0.42],[-0.98,0.45,0.15,0.34]]){const s=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,l,12),pM);s.rotation.set(0,ry,Math.PI/2);s.position.set(x,y0+0.035,z);s.castShadow=true;T.add(s);
      for(const e of [-1,1]){const k=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.03,8),wood);k.position.set(x+Math.cos(ry)*e*(l/2+0.015),y0+0.035,z-Math.sin(ry)*e*(l/2+0.015));k.rotation.set(0,ry,Math.PI/2);T.add(k);}}}
  // แผนที่กระดาษ + แว่นขยาย
  {const m=new THREE.Mesh(new THREE.PlaneGeometry(0.46,0.34,8,1),new THREE.MeshStandardMaterial({map:hubTexMap(),roughness:0.9,side:THREE.DoubleSide}));const p=m.geometry.attributes.position;
    for(let i=0;i<p.count;i++){const u=p.getX(i)/0.23;p.setZ(i,Math.max(0,Math.abs(u)-0.7)*0.06);}m.geometry.computeVertexNormals();
    m.rotation.set(-Math.PI/2,0,0.35);m.position.set(0.32,y0+0.009,0.3);m.receiveShadow=true;T.add(m);
    const g=new THREE.Group();g.position.set(0.5,y0+0.012,0.18);g.rotation.y=0.9;T.add(g);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.06,0.008,8,32),goldM);ring.rotation.x=Math.PI/2;g.add(ring);
    const lens=new THREE.Mesh(new THREE.CircleGeometry(0.058,24),new THREE.MeshPhysicalMaterial({color:'#dfe8ff',roughness:0.05,transparent:true,opacity:0.25}));lens.rotation.x=-Math.PI/2;g.add(lens);
    const h=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.014,0.13,8),wood);h.rotation.z=Math.PI/2;h.position.x=0.13;g.add(h);}
  // ขวดยา 3 ขวด (แก้วใส + น้ำยาเรือง + จุก)
  F.potions=[];
  for(const [x,z,c,sc] of [[1.05,-0.42,'#b77dff',1],[1.24,-0.28,'#6fe0ff',0.8],[0.88,-0.55,'#ff7ab8',0.9]]){const g=new THREE.Group();g.position.set(x,y0,z);g.scale.setScalar(sc);T.add(g);
    const glass=hubLathe([[0,0],[0.07,0],[0.09,0.04],[0.09,0.1],[0.05,0.15],[0.025,0.17],[0.025,0.24],[0.032,0.25],[0,0.25]],new THREE.MeshPhysicalMaterial({color:'#cfd8ff',roughness:0.08,transmission:0,transparent:true,opacity:0.28,depthWrite:false}),24);g.add(glass);
    const liq=hubLathe([[0,0.005],[0.064,0.005],[0.082,0.04],[0.082,0.09],[0,0.09]],new THREE.MeshBasicMaterial({color:hdr(c,1.1),transparent:true,opacity:0.85}),20);g.add(liq);
    const cork=new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.022,0.04,10),new THREE.MeshStandardMaterial({color:'#7a5a3a',roughness:0.9}));cork.position.y=0.265;g.add(cork);
    const gs=new THREE.Sprite(glowMat(c,0.4));gs.scale.set(0.32,0.32,1);gs.position.y=0.06;g.add(gs);F.potions.push({g,gs,c});}
  // ผลึกม่วงกลุ่มเล็ก
  {const g=new THREE.Group();g.position.set(0.72,y0,-0.12);T.add(g);const cm=new THREE.MeshStandardMaterial({color:'#8a6ad8',roughness:0.15,metalness:0.1,emissive:'#2a1660',transparent:true,opacity:0.9});
    for(let i=0;i<6;i++){const h=0.08+Math.random()*0.14,c=new THREE.Mesh(new THREE.ConeGeometry(0.025+Math.random()*0.015,h,6),cm);const a=i/6*6.28;c.position.set(Math.cos(a)*0.04*(i?1:0),h/2,Math.sin(a)*0.04*(i?1:0));c.rotation.set(Math.sin(a)*0.35*(i?1:0),0,-Math.cos(a)*0.35*(i?1:0));c.castShadow=true;g.add(c);}}
  // เทียน 3 เล่ม (เปลวไฟสั่น)
  F.flames=[];
  for(const [x,z,h] of [[-0.78,-0.48,0.22],[-0.64,-0.6,0.15],[-0.9,-0.36,0.11]]){const w=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.028,h,12),new THREE.MeshStandardMaterial({color:'#e9e1cf',roughness:0.6,emissive:'#2a2010'}));w.position.set(x,y0+h/2,z);w.castShadow=true;T.add(w);
    const f=new THREE.Sprite(glowMat('#ffb54a',2.2));f.scale.set(0.08,0.14,1);f.position.set(x,y0+h+0.06,z);T.add(f);const f2=new THREE.Sprite(glowMat('#ff8a3a',0.45));f2.scale.set(0.3,0.3,1);f2.position.copy(f.position);T.add(f2);F.flames.push({f,f2,ph:Math.random()*9});}
  // นาฬิกาทราย
  {const g=new THREE.Group();g.position.set(-0.42,y0,-0.42);T.add(g);const gm=new THREE.MeshPhysicalMaterial({color:'#dfe6ff',roughness:0.05,transparent:true,opacity:0.3,depthWrite:false});
    g.add(hubLathe([[0.005,0.03],[0.06,0.05],[0.065,0.09],[0.01,0.15],[0.065,0.21],[0.06,0.25],[0.005,0.27]],gm,20));
    const sand=hubLathe([[0,0.04],[0.05,0.06],[0.03,0.1],[0,0.11]],new THREE.MeshStandardMaterial({color:'#d8b878',roughness:1}),16);g.add(sand);
    for(const y of [0.015,0.285]){const d=new THREE.Mesh(new THREE.CylinderGeometry(0.085,0.085,0.03,16),goldM);d.position.y=y;g.add(d);}
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2,r=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.27,6),goldM);r.position.set(Math.cos(a)*0.075,0.15,Math.sin(a)*0.075);g.add(r);}}
  // วงแหวนดาราศาสตร์ (หมุนช้าๆ)
  {const g=new THREE.Group();g.position.set(0.45,y0,-0.5);T.add(g);
    g.add(hubLathe([[0,0],[0.1,0],[0.04,0.03],[0.02,0.22],[0,0.22]],goldM,16));
    const rings=new THREE.Group();rings.position.y=0.38;g.add(rings);F.armil=[];
    for(const [r,ax] of [[0.16,0],[0.145,1],[0.13,2]]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,0.006,6,64),goldM);t.rotation.set(ax===0?Math.PI/2:0.4*ax,ax*0.7,0);const h=new THREE.Group();h.add(t);rings.add(h);F.armil.push(h);}
    const core=new THREE.Mesh(new THREE.SphereGeometry(0.035,16,12),new THREE.MeshBasicMaterial({color:hdr('#8fd8ff',1.4)}));rings.add(core);const cs=new THREE.Sprite(glowMat('#8fd8ff',0.6));cs.scale.set(0.26,0.26,1);rings.add(cs);}
  // ไพ่ทาโรต์วางกระจาย + ขนนกกับขวดหมึก
  {const ct=hubTexCard(),cm=new THREE.MeshStandardMaterial({map:ct,roughness:0.6});
    for(let i=0;i<4;i++){const c=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.003,0.16),cm);c.position.set(0.02+i*0.045,y0+0.008+i*0.003,0.5-i*0.03);c.rotation.y=-0.6+i*0.28;T.add(c);}
    const ink=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.045,0.06,14),new THREE.MeshPhysicalMaterial({color:'#101830',roughness:0.1}));ink.position.set(-0.12,y0+0.03,0.5);T.add(ink);
    const qg=new THREE.SphereGeometry(0.5,10,6);qg.scale(0.035,0.18,0.006);const q=new THREE.Mesh(qg,new THREE.MeshStandardMaterial({color:'#efe9dc',roughness:0.8}));q.position.set(-0.06,y0+0.13,0.52);q.rotation.set(0.25,0.4,-0.75);T.add(q);}
  // ไม้กายสิทธิ์บนโต๊ะ (ใส่ทีหลังเมื่อโมเดลตัวละครพร้อม — ใช้ไม้แบบเดียวกับที่เลือกไว้) + ประกาย
  F.wandPivot=new THREE.Group();S.add(F.wandPivot);
  F.wandTip=new THREE.Object3D();F.wandPivot.add(F.wandTip);
  F.wandGlow=new THREE.Sprite(glowMat('#cfe6ff',1.3));F.wandGlow.scale.set(0.22,0.22,1);F.wandTip.add(F.wandGlow);
  F.wandStar=hubStar('#e6f0ff',2.4);F.wandStar.scale.set(0.3,0.3,1);F.wandTip.add(F.wandStar);
  // แสงปลายไม้ไม่ทดสอบความลึก: สไปรต์หันหากล้องตัดกับผิวโต๊ะเป็นเส้นตรง ดูเหมือนปลายไม้จมโต๊ะ (ผู้ใช้ 2026-10-23) • โคลนเพราะ glowMat ใช้ร่วมกัน
  F.wandGlow.material=F.wandGlow.material.clone();for(const sp of [F.wandGlow,F.wandStar]){sp.material.depthTest=false;sp.renderOrder=5;}
  F.wipe=hubWipeMake();   // ผ้าคลุมสะบัดผ่านกล้อง (วาดหลัง composer ใน hubRender)
  // ฝุ่นละอองลอยในแสงจันทร์
  HUB.ps=hubPS(S,700);
  {const n=160,pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=rnd(-2,6);pos[i*3+1]=rnd(0.2,4.5);pos[i*3+2]=rnd(-3.5,3);}
    const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    F.dust=new THREE.Points(dg,new THREE.PointsMaterial({map:glowTex,color:hdr('#aebfff',1.1),size:0.045,transparent:true,opacity:0.5,depthWrite:false,blending:THREE.AdditiveBlending}));S.add(F.dust);}
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
  // เมนู (ผู้ใช้ 2026-10-23): มือซ้ายยื่นมาหากล้อง หงายมือ ลูกแก้วลอยเหนือฝ่ามือ • มือขวายกไม้ขึ้นข้างตัว
  present:{uaL:[0.78,-0.12,0.6],faL:[0.62,0.38,0.68],hL:[0.42,0.62,0.66],twL:1.4,uaR:[-0.8,0.22,0.32],faR:[-0.42,0.86,0.22],hR:[-0.22,0.97,0.06],ch:[0.12,-0.16,0.03],hd:'cam',orb:'L'},
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
  // กระดูกที่ท่า idle ไม่ขยับ (ค่าคงที่) — AnimationMixer ไม่เขียนค่าซ้ำถ้าค่าไม่เปลี่ยน → การหมุนทับของเรา (hbRot) สะสมทุกเฟรม = หัวหมุนเรื่อยๆ
  //   (บั๊ก 'หัวหมุนตลอด' ผู้ใช้ 2026-10-23: คอค่าคงที่ใน idle) → รีเซ็ตกระดูกพวกนี้เองทุกเฟรมหลัง mixer.update
  {const clip=r.animations.find(a=>/idle/i.test(a.name));c.fixQ=[];
    for(const n of ['spine','chest','neck','head','upper_arm_L','forearm_L','hand_L','upper_arm_R','forearm_R','hand_R','cloak_B','cloak_L','cloak_R']){const b=B[n];if(!b)continue;
      const tr=clip&&clip.tracks.find(t=>t.name===n+'.quaternion');let still=!tr;
      if(tr){still=true;const v=tr.values;for(let i=4;i<v.length;i++)if(Math.abs(v[i]-v[i%4])>1e-6){still=false;break;}}
      if(still)c.fixQ.push([b,tr?new THREE.Quaternion().fromArray(tr.values,0):b.quaternion.clone()]);}}
  // ปลายไม้ = ปลายกล่องไม้ที่ไกลจากมือที่สุด (ท่ายืนตรง) → เก็บเป็นจุดในกรอบมือขวา
  // แกนไม้จริงจากจุดยอดของโมเดล (แกนที่ยาวสุด) → ปลาย = ปลายข้างที่ไกลจากมือ (เดิมใช้ "สะท้อนมือผ่านจุดกลาง" ไม้วางบนโต๊ะเลยเอียงลอย)
  if(wand&&B.hand_R){inst.updateMatrixWorld(true);const hp=B.hand_R.getWorldPosition(new THREE.Vector3()),P=[];
    wand.traverse(m=>{if(m.isMesh&&m.geometry){const p=m.geometry.attributes.position,st=Math.max(1,p.count>>8);for(let i=0;i<p.count;i+=st)P.push(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld));}});
    const mu=P.reduce((a,v)=>a.add(v),new THREE.Vector3()).multiplyScalar(1/Math.max(1,P.length)),ax=new THREE.Vector3(0.3,1,0.2).normalize(),tmp=new THREE.Vector3();
    for(let k=0;k<12;k++){tmp.set(0,0,0);for(const v of P){const d=_hv.copy(v).sub(mu);tmp.addScaledVector(d,d.dot(ax));}if(tmp.lengthSq()>1e-12)ax.copy(tmp).normalize();}
    let lo=Infinity,hi=-Infinity;for(const v of P){const t=_hv.copy(v).sub(mu).dot(ax);lo=Math.min(lo,t);hi=Math.max(hi,t);}
    const e0=mu.clone().addScaledVector(ax,lo),e1=mu.clone().addScaledVector(ax,hi),ce=e0.clone().add(e1).multiplyScalar(0.5),tip=e0.distanceTo(hp)>e1.distanceTo(hp)?e0:e1;
    c.tip.position.copy(B.hand_R.worldToLocal(tip.clone()));B.hand_R.add(c.tip);
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
  let d=c.ryT-c.ry;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;const r0=c.ry;c.ry+=d*(1-Math.exp(-(c.turnK||6)*dt));c.g.rotation.y=c.ry;c.spin=(c.spin||0)+((c.ry-r0)/Math.max(dt,1e-3)-(c.spin||0))*(1-Math.exp(-10*dt));
  if(c.A){if(c.walkSp>0.05)animPlay(c.A,'walk',{speed:c.walkSp/2.1,fade:0.25});else animPlay(c.A,'idle',{fade:0.35});c.A.mixer.update(dt);}
  for(const [b,q] of c.fixQ)b.quaternion.copy(q);
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
    if(B.chest){const right=_hax.set(1,0,0).applyQuaternion(_hcq);if(c.lean>0.001&&B.spine)hbRot(B.spine,right,c.lean*0.28);hbRot(B.chest,right,(c.ch.x+br*0.02+(c.lean||0)*0.22)*w);hbRot(B.chest,_hY,c.ch.y*w);hbRot(B.chest,_hd.set(0,0,1).applyQuaternion(_hcq),c.ch.z*w);}
    for(const key of HPK){const b=B[HBN[key]];if(!b)continue;if(!P[key]&&!(P.ik&&P.ik===key.slice(-1)))continue;hbAim(b,toW([c.cur[key].x,c.cur[key].y,c.cur[key].z],_hv3),w);}
    const twL=(P.twL||0)+Math.sin(t*1.1)*0.06,twR=P.twR||0;
    if(B.hand_L&&twL){const ax=_hv3.copy(_hY).applyQuaternion(B.hand_L.getWorldQuaternion(_hq));hbRot(B.hand_L,ax,twL*w);}
    if(B.hand_R&&twR){const ax=_hv3.copy(_hY).applyQuaternion(B.hand_R.getWorldQuaternion(_hq));hbRot(B.hand_R,ax,twR*w);}
  }
  // หัว: มองกล้อง (จำกัดมุม) หรือ ก้ม/หันตามท่า
  if(B.head&&B.neck){
    let yaw=0,pit=0;
    const hd=P&&P.hd;
    if(hd==='cam'&&camP){const hp=B.head.getWorldPosition(_ht);_hd.copy(camP).sub(hp).applyQuaternion(_hcq.clone().invert());yaw=clamp(Math.atan2(_hd.x,_hd.z),-0.55,0.55);pit=clamp(-Math.atan2(_hd.y,Math.hypot(_hd.x,_hd.z)),-0.35,0.35);}
    else if(Array.isArray(hd)){pit=hd[0];yaw=hd[1];}
    if(c.lookAt){const hp=B.head.getWorldPosition(_ht);_hd.copy(c.lookAt).sub(hp).applyQuaternion(_hcq.clone().invert());yaw=clamp(Math.atan2(_hd.x,_hd.z),-0.8,0.8);pit=clamp(-Math.atan2(_hd.y,Math.hypot(_hd.x,_hd.z)),-0.6,0.6);}
    const hk=1-Math.exp(-(c.lookAt?4:2.6)*dt);c.head.x+=(pit-c.head.x)*hk;c.head.y+=(yaw-c.head.y)*hk;   // หัวตามช้าๆ นุ่มๆ (ผู้ใช้ 2026-10-23: เดิมหัวหมุนไปมาตลอด)
    const right=_hax.set(1,0,0).applyQuaternion(_hcq);
    hbRot(B.neck,_hY,c.head.y*0.45);hbRot(B.head,_hY,c.head.y*0.55);hbRot(B.head,right,c.head.x+Math.sin(t*0.8)*0.012);
  }
  // ผ้าคลุมสะบัดออกตามความเร็วหมุนตัว (ตอนหยิบไม้แล้วหันกลับ)
  {const fl=Math.min(0.9,Math.abs(c.spin||0)*0.16);
    if(fl>0.01){const right=_hax.set(1,0,0).applyQuaternion(_hcq),fwd=_hd.set(0,0,1).applyQuaternion(_hcq);
      if(B.cloak_B)hbRot(B.cloak_B,right,fl);if(B.cloak_L)hbRot(B.cloak_L,fwd,fl*0.6);if(B.cloak_R)hbRot(B.cloak_R,fwd,-fl*0.6);}}
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
  else if(B.hand_L){B.hand_L.getWorldPosition(_ht);const up=_hd.set(0,0.2,0.17).applyQuaternion(c.g.getWorldQuaternion(_hq));_ht.add(up);}
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
// ไม้บนโต๊ะ = โคลนไม้ที่ตัวละครเลือก วางนอนบนผ้า ด้ามหันหาที่ยืนหยิบ (C0) ปลายชี้เข้ากลางโต๊ะ → HB.GRIP = จุดจับ (ใช้เอื้อมมือ)
function hubPlaceWand(c){
  const F=HUB.fx;if(!c.wand||!c.wandBind)return;
  if(F.wandMesh){F.wandPivot.remove(F.wandMesh);F.wandMesh=null;}
  const w=c.wand.clone(true);w.matrixAutoUpdate=false;w.matrix.copy(c.wandBind.m);w.visible=true;
  const inner=new THREE.Group();inner.add(w);inner.position.copy(c.wandBind.c).negate();
  // แนวไม้จริง (ศูนย์กลาง → ปลาย ตอนท่ายืน) หมุนให้นอนตามแกน x — ปลายไม้อยู่ที่ (ยาว,0,0)
  const ax=c.wandBind.tip.clone().sub(c.wandBind.c),len=ax.length();ax.normalize();
  const holder=new THREE.Group();holder.add(inner);holder.quaternion.setFromUnitVectors(ax,new THREE.Vector3(1,0,0));
  const tilt=new THREE.Group();tilt.add(holder);F.wandPivot.add(tilt);F.wandMesh=tilt;
  // วางให้นอนแตะผิวจริง: จุดต่ำสุดฝั่งด้าม + ฝั่งปลาย แตะพื้นทั้งคู่ (เอียงตาม) แล้วยกจุดต่ำสุดขึ้นมาที่ผิว (เดิมแกนกลางอยู่ที่ผิว ครึ่งล่างของไม้หนา/งอจมโต๊ะ)
  F.wandPivot.position.set(0,0,0);F.wandPivot.rotation.set(0,0,0);
  const low=()=>{F.wandPivot.updateMatrixWorld(true);const A=[null,null];let mn=Infinity;
    tilt.traverse(m=>{if(!m.isMesh||!m.geometry)return;const p=m.geometry.attributes.position;
      for(let i=0;i<p.count;i++){const v=_hv.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld),k=v.x<0?0:1;mn=Math.min(mn,v.y);if(!A[k]||v.y<A[k].y)A[k]={x:v.x,y:v.y};}});return {A,mn};};
  const {A}=low();if(A[0]&&A[1])tilt.rotation.z=-Math.atan2(A[1].y-A[0].y,A[1].x-A[0].x);
  tilt.position.y=-low().mn;tilt.updateMatrix();
  F.wandTip.position.set(len,0,0).applyMatrix4(tilt.matrix);
  // หมุนรอบแกนตั้งให้ปลายชี้ออกจากคนหยิบ (มุม atan2 ของเวกเตอร์ปลาย + rotation.y = มุมใหม่)
  const want=Math.atan2(HB.WAND.x-HB.C0.x,HB.WAND.z-HB.C0.z),a0=Math.atan2(F.wandTip.position.x,F.wandTip.position.z);
  F.wandPivot.position.copy(HB.WAND);F.wandPivot.rotation.set(0,want-a0,0);F.wandPivot.updateMatrixWorld(true);
  const tp=F.wandTip.getWorldPosition(new THREE.Vector3());HB.GRIP.copy(HB.WAND).multiplyScalar(1.7).addScaledVector(tp,-0.7);HB.GRIP.y=HB.WAND.y+0.04;
  holder.traverse(m=>{if(m.isMesh)m.castShadow=true;});
}
function hubMenuChar(){
  const lk=lookStr(myLook);
  if(HUB.me&&HUB.me.lk!==lk){HUBS.remove(HUB.me.g);disposeTree(HUB.me.g);HUB.me=null;}
  if(!HUB.me){const c=hubMakeChar(lk);if(!c)return null;HUB.me=c;HUBS.add(c.g);
    const st=HUB.st;hubResetMenu(true);if(st==='modes')hubSnapModes();}
  return HUB.me;
}
// เมนูแรก: ไม่มีตัวละครในจอ (ผู้ใช้ 2026-10-23 "โฟกัสโต๊ะ ยังไม่มีใครหยิบไม้") — ไม้วางบนโต๊ะ ตัวละครซ่อนอยู่ที่ยืนหยิบ (ขวา นอกจอ)
function hubResetMenu(snap){
  const c=HUB.me;HUB.st='menu';HUB.t=0;HUB.pick=null;HUB.pre=null;if(HUB.orb){HUB.orb.kT=0;HUB.orb.k=0;}
  if(!c)return;
  hubPlaceWand(c);hubSeqAt(c,0);c.ry=c.ryT;if(snap)c.pw=1;c.walkSp=0;
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
const _hcA={p:new THREE.Vector3(),l:new THREE.Vector3()},_hcB={p:new THREE.Vector3(),l:new THREE.Vector3()},_hcC={p:new THREE.Vector3(),l:new THREE.Vector3()};
const hCamMix=(o,a,b,u)=>{o.p.lerpVectors(a.p,b.p,u);o.l.lerpVectors(a.l,b.l,u);return o;};
// จอแคบ (เช่น 1024×768) = ถอยกล้องให้เห็นเท่าเดิมตามแนวนอน
const hAspK=()=>Math.max(1,Math.pow(1.78/Math.max(0.5,cam.aspect),0.8));
// เมนู: โต๊ะเต็มจอ มองเฉียงลงจากหน้าโต๊ะ (ไม้อยู่ขวากลาง • ฝั่งซ้ายมืดไว้ให้ตัวหนังสือ)
function hubCamMenu(o){return hubFrame(o,_ht.set(HB.TB.x+0.5,HB.TOP,HB.TB.z+0.05),2.2*hAspK(),0.1,0.56,0.2,-0.12,44);}
// เอื้อมหยิบ: ดันกล้องเข้าหาไม้นิดหนึ่ง • ยกไม้: เงยตามไม้ขึ้นไปเห็นไหล่/หลังตัวละคร
function hubCamPick(o){return hubFrame(o,_ht.set(2.05,1.2,-0.45),3.0*hAspK(),0.45,0.2,0.1,0.02,42);}
function hubCamLift(o){return hubFrame(o,_ht.set(HB.C0.x-0.1,1.55,HB.C0.z),2.5*hAspK(),0.32,0.08,0,0,44);}
// โพส (ผู้ใช้ 2026-10-23): กล้องต่ำราว 2/5 ของตัว แพนขึ้น — มือที่ยื่นมาหากล้องดูใหญ่ ตัวอยู่ไกลกว่า เต็มจอกว่าเดิม
//   เริ่ม = มองมือ/ลูกแก้วใกล้ๆ ระดับสะโพก → จบ = เงยเห็นทั้งท่อนบน (ตัวอยู่กลาง การ์ดโหมดอยู่ล่าง)
function hubCamPoseA(o){const k=hAspK(),P=HB.P1;o.p.set(P.x+0.12,0.92,P.z+1.55*k);o.l.set(P.x+0.2,1.2,P.z+0.35);return o;}
function hubCamPose(o){const k=hAspK(),P=HB.P1;o.p.set(P.x+0.1,1.02,P.z+2.15*k);o.l.set(P.x+0.02,1.68,P.z-0.2);return o;}
// ล็อบบี้: ให้แถวตัวละคร (x −2.1…3.75 ม.) อยู่เต็มพื้นที่ขวาของแผงห้องพอดีทุกขนาดจอ (จอแคบ = ถอยกล้อง) — ตรวจ 1891×942 / 1366×768 / 1024×768
function hubCamRoom(o){const th=Math.tan(17*Math.PI/180),R=typeof hubRoomRect==='function'?hubRoomRect():null,nx0=R?Math.min(0.2,(R.l+R.w)/Math.max(1,innerWidth)*2-1):-0.1;
  return hubFrame(o,_ht.set(0.83,1.1,-0.2),Math.max(10.5,6.6/((1-nx0)*th*cam.aspect)),-0.1,0.09,(nx0+1)/2,0.06,34);}

// ---------- ลำดับตอนกด "เล่น" (ผู้ใช้ 2026-10-23) ----------
// ไม่มีเดินเข้าเฟรม: มือเอื้อมเข้ามาหยิบไม้ → ยกขึ้น → หมุนตัว ผ้าคลุมสะบัดบังจอ → (ตัดฉากใต้ผ้าคลุม) → ท่าโพสหน้าโต๊ะ กล้องต่ำแพนขึ้น
// ทุกอย่างเป็นฟังก์ชันของเวลา t → กด "กลับ" = เล่น t ย้อนหลัง (ผ้าคลุมปัดกลับ → วางไม้คืนโต๊ะ → มือถอยออก)
const HSQ={reach:0.1,grab:0.8,turn:1.12,wipe0:1.3,hold0:1.56,snap:1.66,hold1:1.76,wipe1:2.06,orb:2.0,ui:2.7,end:3.2};
const hPickRy=()=>Math.atan2(HB.WAND.x-HB.C0.x,HB.WAND.z-HB.C0.z);
function hubGo(){
  if(HUB.st!=='menu'||!HUB.me)return false;
  HUB.st='go';HUB.t=0;snd('ui_click');return true;
}
function hubBack(){   // จากหน้าการ์ดโหมดกลับเมนูแรก = เล่นย้อน
  if(!HUB.me){hubResetMenu(true);if(typeof hubUiState==='function')hubUiState('menu');return;}
  HUB.st='back';HUB.t=Math.min(HUB.t||HSQ.end,HSQ.end);
}
function hubFadeDo(fn,hold){const el=$('#hFade');if(!el){fn();return;}el.classList.add('on');setTimeout(()=>{try{fn();}finally{setTimeout(()=>el.classList.remove('on'),hold||120);}},380);}
// ตั้งสถานะทั้งหมดตามเวลา t (เดินหน้า/ถอยหลังได้)
function hubSeqAt(c,t){
  const F=HUB.fx,pre=t<HSQ.snap;
  if(pre!==HUB.pre){HUB.pre=pre;   // ข้ามจุดตัดใต้ผ้าคลุม = วาร์ปตัว/ท่า/กล้องทันที
    if(pre){c.g.position.copy(HB.C0);hubSetPose(c,'lift');c.pk=6;c.ry=c.ryT=hPickRy()+(0-hPickRy())*0.6;}
    else{c.g.position.copy(HB.P1);hubSetPose(c,'present',0);c.ry=0;c.pk=4;c.pw=1;for(const k of HPK)if(HPOSE.present[k])c.cur[k].set(...HPOSE.present[k]).normalize();c.ch.set(...HPOSE.present.ch);c.head.set(0,0);}
    c.lookAt=null;HUB.cam.init=false;}
  c.g.visible=t>0.03;
  const held=t>=HSQ.grab;
  if(held!==HUB.pick){const first=HUB.pick!==null;HUB.pick=held;F.wandPivot.visible=!held;if(c.wand)c.wand.visible=held;c.wandOn=held;
    if(first){snd(held?'pickup':'ui_click',{vol:0.6});hubBurst(HUB.ps,F.wandTip.getWorldPosition(new THREE.Vector3()),held?40:18);}}
  if(pre){
    if(t<HSQ.grab){c.ikP=c.ikP||new THREE.Vector3();c.ikP.copy(HB.GRIP);if(c.poseN!=='reach'){hubSetPose(c,'reach');c.pk=7;}c.lookAt=HB.WAND;c.ryT=hPickRy();c.turnK=6;
      c.lean=hSm(HSQ.reach,HSQ.grab*0.8,t);}   // โน้มตัวเข้าหาโต๊ะ
    else{if(c.poseN!=='lift'){hubSetPose(c,'lift');c.pk=6;}c.lookAt=t<HSQ.turn?c.tip.getWorldPosition(c.lookV||(c.lookV=new THREE.Vector3())):null;c.lean=1-hSm(HSQ.grab,HSQ.turn,t);
      c.ryT=hPickRy()+(0-hPickRy())*hEase(hSm(HSQ.turn,HSQ.snap+0.1,t));c.turnK=9;}
    if(HUB.orb)HUB.orb.kT=0;
    c.g.position.copy(HB.C0).addScaledVector(_hv2.set(Math.sin(hPickRy()),0,Math.cos(hPickRy())),0.14*(c.lean||0));
  }else{
    if(c.poseN!=='present'){hubSetPose(c,'present',0);c.pk=4;}c.ryT=0;c.lean=0;c.lookAt=null;
    if(HUB.orb){const on=t>=HSQ.orb;if(on&&HUB.orb.kT===0){HUB.orb.init=false;if(c.B.hand_L)hubBurst(HUB.ps,c.B.hand_L.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,0.15,0)),40,'#b9a6ff',0.7);}HUB.orb.kT=on?1:0;}
  }
}
// กล้องตามเวลา t
function hubCamSeq(o,t){
  if(t<HSQ.grab)return hCamMix(o,hubCamMenu(_hcA),hubCamPick(_hcC),hEase(hSm(0,HSQ.grab,t)));
  if(t<HSQ.snap)return hCamMix(o,hubCamPick(_hcA),hubCamLift(_hcC),hEase(hSm(HSQ.grab,HSQ.snap,t)));
  return hCamMix(o,hubCamPoseA(_hcA),hubCamPose(_hcC),hEase(hSm(HSQ.snap+0.05,HSQ.end-0.1,t)));
}
// ผ้าคลุมผ่านจอ: ความคืบหน้า 0…1 ระหว่าง wipe0…wipe1 (นอกช่วง = ไม่วาด) • ถอยหลัง (กลับเมนู) = t ลดลง ผ้าผ่านย้อนทางเอง
const hWipeP=t=>(t-HSQ.wipe0)/(HSQ.wipe1-HSQ.wipe0);
function hubSeq(c,dt,now){
  if(HUB.st==='go'){HUB.t=Math.min(HSQ.end,HUB.t+dt);hubSeqAt(c,HUB.t);
    if(HUB.t>=HSQ.ui){HUB.st='modes';if(typeof hubUiState==='function')hubUiState('modes');}}
  else if(HUB.st==='back'){HUB.t=Math.max(0,HUB.t-dt*1.15);hubSeqAt(c,HUB.t);
    if(HUB.t<=0){hubResetMenu(false);if(typeof hubUiState==='function')hubUiState('menu');}}
  else if(HUB.st==='modes')hubSeqAt(c,HSQ.end);
}
// ข้ามไปท่าโพสทันที (กลับจากห้อง / เปิดเว็บใหม่หลังออกห้อง)
function hubSnapModes(){
  const c=HUB.me;if(!c){HUB.st='modes';return false;}
  HUB.pre=null;HUB.pick=null;HUB.t=HSQ.end;hubSeqAt(c,HSQ.end);c.ry=0;
  if(HUB.orb){HUB.orb.kT=1;HUB.orb.k=1;HUB.orb.init=false;}HUB.st='modes';HUB.cam.init=false;return true;
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
  const camP=HUB.cam.p;
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

// ---------- หน้าโปรไฟล์ (UI ใน js/65 PRF, ผู้ใช้ 2026-10-23 รอบ 3) ----------
// ฉากแยก HUBP: ตัวเราฝั่งขวาของจอ บนพื้นหลังที่เลือก (ภาพแผ่นใหญ่ด้านหลัง) + ท่าโพส + เอฟเฟกต์รอบตัว • ลากเมาส์ = หมุนตัว (PRF3.spin)
const HUBP=new THREE.Scene();
const PRF3={built:false,c:null,lk:'',bg:'',bgM:null,bgP:null,bgAsp:1.6,ps:null,orb:null,ring:null,pose:'present',au:null,spin:0,cam:new THREE.Vector3()};
function hubProfBuild(){
  if(PRF3.built)return;PRF3.built=true;const S=HUBP;
  S.add(new THREE.HemisphereLight('#8fa2e0','#100c20',0.55));
  const k=new THREE.DirectionalLight('#e6ecff',1.35);k.position.set(2.5,4,3.5);S.add(k);
  const rim=new THREE.DirectionalLight('#b39dff',2.6);rim.position.set(-3,2.5,-3);S.add(rim);
  const fill=new THREE.PointLight('#8fd8ff',1.2,8,2);fill.position.set(-1.6,1.2,2);S.add(fill);
  PRF3.bgM=new THREE.MeshBasicMaterial({color:'#6f7696',fog:false,depthWrite:false});   // พื้นหลังหรี่ลงให้ตัวละครเด่น
  PRF3.bgP=new THREE.Mesh(new THREE.PlaneGeometry(1,1),PRF3.bgM);PRF3.bgP.renderOrder=-1;S.add(PRF3.bgP);
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.55,0.585,72),new THREE.MeshBasicMaterial({color:hdr('#b9a6ff',1.4),transparent:true,opacity:0.6,depthWrite:false,blending:THREE.AdditiveBlending}));
  ring.rotation.x=-Math.PI/2;ring.position.y=0.012;S.add(ring);PRF3.ring=ring;
  const disc=new THREE.Mesh(new THREE.CircleGeometry(1.2,48),new THREE.MeshBasicMaterial({map:glowTex,color:hdr('#6a5cff',0.5),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  disc.rotation.x=-Math.PI/2;disc.position.y=0.006;S.add(disc);
  PRF3.ps=hubPS(S,700);PRF3.orb=hubMakeOrb(S);
}
// o = {lk ลุคตัวละคร, bg url รูปพื้นหลัง, pose ชื่อท่าใน HPOSE, au สีเอฟเฟกต์รอบตัว | null}
function hubProfSet(o){
  hubProfBuild();
  if(o.bg&&o.bg!==PRF3.bg){PRF3.bg=o.bg;new THREE.TextureLoader().load(o.bg,t=>{if(PRF3.bg!==o.bg){t.dispose();return;}t.colorSpace=THREE.SRGBColorSpace;const old=PRF3.bgM.map;PRF3.bgM.map=t;PRF3.bgM.needsUpdate=true;PRF3.bgAsp=t.image.width/t.image.height;if(old)old.dispose();});}
  if(PRF3.c&&PRF3.lk!==o.lk){HUBP.remove(PRF3.c.g);disposeTree(PRF3.c.g);PRF3.c=null;}
  PRF3.lk=o.lk;PRF3.pose=HPOSE[o.pose]?o.pose:'present';PRF3.au=o.au||null;
}
function hubProfTick(dt,now){
  if(!PRF3.c&&PRF3.lk){const c=hubMakeChar(PRF3.lk);if(c){PRF3.c=c;HUBP.add(c.g);if(c.wand)c.wand.visible=true;c.wandOn=true;c.ry=c.ryT=0;}}
  const c=PRF3.c,t=now/1000,ry0=(HPOSE[PRF3.pose].ry||0)*0.5;
  if(c){if(c.poseN!==PRF3.pose)hubSetPose(c,PRF3.pose);c.ryT=ry0+PRF3.spin;hubCharTick(c,dt,now,PRF3.cam);
    PRF3.orb.kT=c.pose&&c.pose.orb?1:0;hubOrbTick(PRF3.orb,c,dt,now,PRF3.ps);}
  if(PRF3.au&&Math.random()<dt*46){const a=Math.random()*6.28,r=0.42+Math.random()*0.3;   // เอฟเฟกต์รอบตัว: ละอองหมุนเป็นเกลียวขึ้น
    PRF3.ps.add({x:Math.cos(a)*r,y:0.05+Math.random()*0.4,z:Math.sin(a)*r,vx:-Math.sin(a)*0.3,vy:0.35+Math.random()*0.45,vz:Math.cos(a)*0.3,life:1.5+Math.random()*1.3,s:0.03+Math.random()*0.045,c:hCol(PRF3.au,1.7),sw:2,swr:0.2,a:0.85,fi:3});}
  PRF3.ps.tick(dt);PRF3.ring.material.opacity=0.45+0.15*Math.sin(t*1.5);
  const R=typeof prfStageX==='function'?prfStageX():0.14,want=hubFrame(_hcB,_ht.set(0,0.98,0),6.8,0,0.04,R,-0.04,34);   // ตัวละครอยู่กลางช่องว่างระหว่างแผงซ้าย-ขวา (js/65 prfStageX)
  // พื้นหลัง: แผ่นตั้งฉากกับแนวมอง ห่าง 12 หน่วย ขยายให้คลุมเต็มจอ (แบบ cover)
  const fw=_hd.copy(want.l).sub(want.p).normalize(),D=12,h=2*D*Math.tan(17*Math.PI/180)*1.12,w=h*cam.aspect,sw=Math.max(w,h*PRF3.bgAsp);
  PRF3.bgP.position.copy(want.p).addScaledVector(fw,D);PRF3.bgP.scale.set(sw,sw/PRF3.bgAsp,1);PRF3.bgP.lookAt(want.p);
  return want;
}

// ---------- เรนเดอร์ (เรียกจาก renderStage — คืน true = วาดแล้ว) ----------
function hubRender(dt,now){
  const room=screen==='lobby'&&LOBBY&&LOBBY.ph==='lobby';
  if(!HUB.on||crOpen||!(screen==='menu'||room)){if(HUB.fovSet){cam.fov=SET.fov;cam.updateProjectionMatrix();HUB.fovSet=false;}document.body.classList.remove('hubOn');return false;}
  try{hubBuild();}catch(e){console.error('hub',e);HUB.on=false;return false;}
  document.body.classList.add('hubOn');
  dt=Math.min(dt,0.05);const t=now/1000,F=HUB.fx;
  const mx=((mouseX||SW/2)/Math.max(1,SW)-0.5),my=((mouseY||SH/2)/Math.max(1,SH)-0.5);
  let sc=HUBS,lay=null,want,tt=0,fvO=0;
  if(room){
    sc=HUBL;lay=hubLobbyTick(dt,now);want=hubCamRoom(_hcB);
    F.lRune.rotation.z=t/20;F.lRune.material.opacity=0.24+0.08*Math.sin(t*0.8);F.dustL.rotation.y=t/60;
    if(Math.random()<dt*14)HUB.psL.add({x:rnd(-4,5),y:0.25,z:rnd(-3,2.5),vx:0,vy:0.25+Math.random()*0.3,vz:0,life:3+Math.random()*2,s:0.03+Math.random()*0.03,c:H_SPARK[(Math.random()*4)|0],sw:1.5,swr:0.1,a:0.7,fi:3});
    HUB.psL.tick(dt);
  }else if(HUB.profOn){sc=HUBP;want=hubProfTick(dt,now);fvO=34;}   // หน้าโปรไฟล์ (js/65)
  else{
    const c=hubMenuChar();
    if(c){hubSeq(c,dt,now);hubCharTick(c,dt,now,HUB.cam.p);}
    hubOrbTick(HUB.orb,c,dt,now,HUB.ps);
    // กล้อง: เมนู → (หยิบ/หัน/ตัดใต้ผ้าคลุม) → โพส • ย้อนได้ (back)
    tt=HUB.st==='menu'?0:HUB.st==='modes'?HSQ.end:HUB.t;
    want=hubCamSeq(_hcB,tt);HUB.fovT=tt<HSQ.snap?lerp(44,46,hSm(HSQ.grab,HSQ.snap,tt)):50;
    // ฉาก: ลูกแก้ว เทียน วงแหวน ประกายไม้ ฝุ่น ลำแสง
    F.ballU.uT.value=t;F.ballL.intensity=0.55+0.14*Math.sin(t*1.7)+0.06*Math.sin(t*5.3);
    F.flames.forEach(f=>{const k=0.85+0.15*Math.sin(t*13+f.ph)+0.08*Math.sin(t*31+f.ph*2);f.f.scale.set(0.075*k,0.14*(0.9+0.2*Math.sin(t*9+f.ph)),1);f.f2.material.opacity=0.8*k;});
    F.candleL.intensity=0.3+0.05*Math.sin(t*13)+0.03*Math.sin(t*29);
    F.leaves.forEach((l,i)=>l.material.opacity=0.55+0.35*Math.sin(t*0.9+i*1.7));F.globe.rotation.y=t*0.05;
    if(Math.random()<dt*2.5){const p=F.cauldron.top;HUB.ps.add({x:p.x+rnd(-0.2,0.2),y:p.y,z:p.z+rnd(-0.2,0.2),vx:0,vy:0.18+Math.random()*0.15,vz:0,life:1.2+Math.random(),s:0.03+Math.random()*0.03,c:hCol('#7dffb0',1.3),sw:2,swr:0.05,a:0.5,fi:4});}
    F.armil.forEach((h,i)=>h.rotation.y=t*(0.25+i*0.18)*(i%2?-1:1));
    F.potions.forEach((p,i)=>p.gs.material.opacity=0.75+0.25*Math.sin(t*1.3+i*2));
    F.bookGlow.material.opacity=0.6+0.25*Math.sin(t*1.1);
    F.dust.rotation.y=Math.sin(t/30)*0.15;F.dust.position.y=Math.sin(t/7)*0.08;
    if(F.wandPivot.visible){const tp=F.wandTip.getWorldPosition(_hv3);
      F.wandStar.material.rotation=t*0.6;const tw=0.24+0.1*Math.sin(t*7)+0.06*Math.sin(t*17);F.wandStar.scale.set(tw,tw,1);F.wandGlow.scale.setScalar(0.18+0.04*Math.sin(t*5));
      if(Math.random()<dt*34)HUB.ps.add({x:tp.x+(Math.random()-0.5)*0.03,y:tp.y,z:tp.z+(Math.random()-0.5)*0.03,vx:(Math.random()-0.5)*0.12,vy:0.12+Math.random()*0.28,vz:(Math.random()-0.5)*0.12,life:0.9+Math.random()*1.4,s:0.02+Math.random()*0.035,c:H_SPARK[(Math.random()*4)|0],dr:0.8,sw:4,swr:0.06,tw:18,fi:10});
      if(Math.random()<dt*1.4)hubBurst(HUB.ps,tp,6,null,0.35);}
    // ประกายปลายไม้ในมือ
    if(c&&c.wandOn){c.tipStar=c.tipStar||(()=>{const s=hubStar('#e6f0ff',2.2);s.scale.set(0.2,0.2,1);c.tip.add(s);return s;})();const tw=0.17+0.06*Math.sin(t*6.3)+0.04*Math.sin(t*15);c.tipStar.scale.set(tw,tw,1);c.tipStar.material.rotation=t*0.5;}
    if(c&&c.wandOn&&tt>=HSQ.snap&&Math.random()<dt*3){const tp=c.tip.getWorldPosition(_hv3);HUB.ps.add({x:tp.x,y:tp.y,z:tp.z,vx:(Math.random()-0.5)*0.06,vy:0.08+Math.random()*0.1,vz:(Math.random()-0.5)*0.06,life:1.4+Math.random(),s:0.03+Math.random()*0.03,c:H_SPARK[(Math.random()*4)|0],sw:3,swr:0.07,a:0.7,fi:5,fo:1.5});}
    if(c&&c.wandOn&&Math.random()<dt*(HUB.st==='modes'?10:8)){const tp=c.tip.getWorldPosition(_hv3);HUB.ps.add({x:tp.x,y:tp.y,z:tp.z,vx:(Math.random()-0.5)*0.15,vy:0.05+Math.random()*0.2,vz:(Math.random()-0.5)*0.15,life:0.6+Math.random()*0.8,s:0.025+Math.random()*0.03,c:H_SPARK[(Math.random()*4)|0],dr:1.2,tw:20,fi:10});}
    if(Math.random()<dt*5)HUB.ps.add({x:rnd(0,4),y:rnd(0.3,2.6),z:rnd(-2,2.5),vx:0,vy:0.04,vz:0,life:4+Math.random()*3,s:0.02+Math.random()*0.02,c:H_SPARK[(Math.random()*4)|0],sw:0.6,swr:0.05,tw:3,a:0.6,fi:2,fo:2});
    HUB.ps.tick(dt);
  }
  // กล้องนุ่ม + เอียงตามเมาส์นิดๆ
  const seqOn=!room&&(HUB.st==='go'||HUB.st==='back');
  const fv=fvO||(room?36:(HUB.fovT||44));
  if(Math.abs(cam.fov-fv)>0.01){cam.fov=fv;cam.updateProjectionMatrix();}HUB.fovSet=true;
  if(!HUB.cam.init||HUB.camScene!==sc){HUB.cam.p.copy(want.p);HUB.cam.l.copy(want.l);HUB.cam.init=true;HUB.camScene=sc;}
  const kk=1-Math.exp(-(seqOn?12:4)*dt);HUB.cam.p.lerp(want.p,kk);HUB.cam.l.lerp(want.l,kk);
  const par=seqOn?0.04:HUB.profOn?0.05:HUB.st==='modes'?0.1:0.16;
  cam.position.copy(HUB.cam.p).add(_hv.set(mx*par,-my*par*0.5+Math.sin(t*0.5)*0.03,0));
  cam.lookAt(_hv2.copy(HUB.cam.l).add(_hv.set(mx*par*0.3,-my*par*0.2,0)));
  if(HUB.profOn)PRF3.cam.copy(cam.position);
  rpass.scene=sc;gl.shadowMap.needsUpdate=true;composer.render();rpass.scene=scene;
  // ผ้าคลุมสะบัดผ่านหน้ากล้อง (ตัดฉากใต้ผ้า) — ชั้นแยกทับภาพที่ post แล้ว
  {const wp=room?-1:hWipeP(tt);if(F.wipe&&wp>0&&wp<1){hubWipeLook(F.wipe,HUB.me);hubWipeDraw(F.wipe,wp,t);}}
  if(lay)hubLabels(lay);
  return true;
}
if(typeof WD!=='undefined')Object.assign(WD,{HUB,HUBS,HUBL,HUBP,PRF3,HPOSE,hubGo,hubSnapModes,hubResetMenu,hubProfSet});
