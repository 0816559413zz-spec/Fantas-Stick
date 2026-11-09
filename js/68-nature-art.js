// Shared by live Nature plants and the approved preview scenes.
function naturePlantArt({T,M,STD,add,mesh,glow,GLOWG,GLOWT,GLOWP,leafGeo,V3,ease,phase,lerp,clamp,cheeky=false}){
function Turret(wall=false){const g=new T.Group();add(g);const base=new T.Group();g.add(base);
  // รากเกาะพื้นผิวโดยตรง ทั้งพื้นและผนัง ไม่สร้างก้อนดิน
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2,r=new T.Vector3(Math.cos(a),0,Math.sin(a));
    const c=new T.CatmullRomCurve3([V3(0,.06,0),r.clone().multiplyScalar(.18).add(V3(0,.04,0)),r.clone().multiplyScalar(.43).add(V3(0,.015,0))]);mesh(new T.TubeGeometry(c,8,.025,5,false),M.stem,base);}
  // ใบโคนทรงยาวปลายเรียว โค้งขึ้นเล็กน้อยและมีเส้นกลางใบ แทนแผ่นเหลี่ยมรูปดาว
  const lp=[],li=[];for(let i=0;i<=16;i++){const u=i/16,w=.20*Math.sin(Math.PI*u)**.9,y=.025+.11*Math.sin(Math.PI*u),z=.72*u;lp.push(-w,y,z,0,y+.035*Math.sin(Math.PI*u),z,w,y,z);if(i<16){const a=i*3,b=a+3;li.push(a,b,a+1,a+1,b,b+1,a+1,b+1,a+2,a+2,b+1,b+2);}}
  const leafBaseGeo=new T.BufferGeometry();leafBaseGeo.setAttribute('position',new T.Float32BufferAttribute(lp,3));leafBaseGeo.setIndex(li);leafBaseGeo.computeVertexNormals();
  for(let i=0;i<5;i++){const group=new T.Group();group.rotation.y=i/5*Math.PI*2;group.scale.setScalar(i%2?.82:1);base.add(group);mesh(leafBaseGeo,i%2?M.leafD:M.leaf,group);
    const mid=new T.CatmullRomCurve3([V3(0,.03,0),V3(0,.16,.34),V3(0,.04,.69)]);mesh(new T.TubeGeometry(mid,8,.008,5),M.stem,group);}
  const wallRoots=new T.Group();g.add(wallRoots);wallRoots.visible=wall;base.visible=!wall;
  const wallLeaves=base.clone();wallLeaves.visible=wall;wallLeaves.rotation.z=-Math.PI/2;wallLeaves.position.x=.025;g.add(wallLeaves);
  if(wall)for(let i=0;i<7;i++){const a=i/7*Math.PI*2,dy=Math.sin(a),dz=Math.cos(a),c=new T.CatmullRomCurve3([V3(.018,0,0),V3(.018,dy*.22,dz*.22),V3(.018,dy*.48,dz*.48)]);mesh(new T.TubeGeometry(c,8,.025,5,false),M.stem,wallRoots);}
  const stemC=new T.CatmullRomCurve3([V3(0,0,0),V3(0,.35,-.05),V3(0,.7,.02),V3(0,.95,0)]);
  const body=new T.Group();g.add(body);body.rotation.z=wall?-.45:0;   // ผู้ใช้ 2026-11-04: เฉียงหัวออกจากกำแพงมากขึ้น (เดิม -.23)
  const stem=mesh(new T.TubeGeometry(stemC,16,.085,9),M.stem,body);stem.position.x=wall?.12:0;
  // ใบลำต้น: โคนใบติดผิวลำต้นพอดี (pivot ที่ผิว แล้วเลื่อนใบออกครึ่งความยาว) — ผู้ใช้ 2026-11-04: เดิมใบลอยข้างลำต้นเหมือนก้านที่สอง
  for(let i=0;i<2;i++){const s=i?1:-1,y=.30+i*.27,c=stemC.getPoint(y/.95),pv=new T.Group();pv.position.set(c.x+s*.07,c.y,c.z);pv.rotation.z=s*.55;stem.add(pv);
    const l=mesh(leafGeo,i?M.leaf:M.leafD,pv);l.scale.set(.5,.7,.6);l.position.x=s*.25;}
  // เถาพัน 2 เส้นแนบลำต้นตามเส้นโค้ง stemC (ผู้ใช้ 2026-11-04: เดิมเป็นเกลียวตรง ลอยออกจากลำต้น)
  for(let j=0;j<2;j++){const points=[];for(let i=0;i<=24;i++){const u=i/24,a=u*Math.PI*2+j*Math.PI;const c=stemC.getPoint(u*.93);points.push(V3(c.x+Math.cos(a)*.092,c.y,c.z+Math.sin(a)*.092));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.012,5),M.leafD,stem);}
  const head=new T.Group();head.position.set(wall?.12:0,.95,0);body.add(head);
  // ฝักทรงหยดน้ำ (lathe) หัวชี้ไปข้างหน้า (+z)
  const prof=[];for(let i=0;i<=14;i++){const u=i/14;prof.push(new T.Vector2(Math.sin(Math.PI*Math.pow(u,.8))*.26*(1-.55*u)+.0001,u*.72-.25));}
  const podG=new T.LatheGeometry(prof,16);podG.rotateX(Math.PI/2);const pod=mesh(podG,M.pod,head);
  for(let i=0;i<4;i++){const s=mesh(new T.TorusGeometry(.2-.03*i,.012,5,18),M.podDark,head);s.position.z=-.12+i*.12;s.scale.setScalar(1-i*.12);}
  const noz=mesh(new T.CylinderGeometry(.07,.1,.14,10,1,true),M.podDark,head);noz.rotation.x=Math.PI/2;noz.position.z=.5;
  const tipG=glow(GLOWG,.45,head);tipG.position.z=.56;
  // ปีกใบ: กางสองข้างหัวแบบเดิม แต่โคนติดผิวข้างฝักพอดี ไม่ทับหัว (ผู้ใช้ 2026-11-04)
  const wings=[];for(const s of [-1,1]){const w=new T.Group();w.rotation.order='YXZ';w.position.set(s*.19,.04,-.05);head.add(w);const l=mesh(leafGeo,M.leaf,w);l.scale.set(.9,1.1,.9);l.position.x=s*.43;wings.push({w,s});}
  const buffLeaves=new T.Group();head.add(buffLeaves);for(let i=0;i<3;i++){const l=mesh(leafGeo,M.leaf,buffLeaves);l.position.set((i-1)*.10,.19,-.04);l.scale.set(.35,.45,.35);l.rotation.set(.5,0,(i-1)*.65);}
  buffLeaves.visible=false;
  const leafShape=new T.Shape();leafShape.moveTo(-.5,0);leafShape.lineTo(0,.2);leafShape.lineTo(.5,0);leafShape.lineTo(0,-.2);leafShape.closePath();
  const wingGeo=new T.ExtrudeGeometry(leafShape,{depth:.018,bevelEnabled:true,bevelThickness:.008,bevelSize:.012,bevelSegments:2,steps:1});wingGeo.computeVertexNormals();
  const eyeMat=new T.MeshBasicMaterial({color:'#203817'}),eyeParts=[];for(const side of [-1,1]){const eye=mesh(new T.SphereGeometry(.052,12,10),eyeMat,head);eye.position.set(side*.105,.15,.19);eye.scale.set(1,.7,.16);eye.rotation.y=side*.4;const smileCurve=new T.QuadraticBezierCurve3(V3(-.04,0,0),V3(0,.045,0),V3(.04,0,0));const smile=mesh(new T.TubeGeometry(smileCurve,12,.008,6),eyeMat,head);smile.position.copy(eye.position);smile.rotation.y=side*.4;const brow=mesh(new T.CapsuleGeometry(.009,.045,3,6),eyeMat,head);brow.position.set(side*.105,.205,.192);brow.rotation.z=Math.PI/2+side*.35;eyeParts.push({eye,smile,brow,side});}
  const buffWings=new T.Group(),buffWingParts=[];head.add(buffWings);for(const side of [-1,1])for(let i=0;i<3;i++){const l=mesh(wingGeo,i===1?M.leafD:M.leaf,buffWings);l.position.set(side*(.35+i*.13),.04+i*.16,-.06+i*.07);l.scale.set(1.05-i*.12,.9,1);l.rotation.z=side*(.25+i*.4);buffWingParts.push({l,side,i});}
  for(let i=0;i<4;i++){const spike=mesh(new T.ConeGeometry(.055,.22-i*.025,6),M.podDark,buffLeaves);spike.position.set(0,.17,-.22+i*.12);spike.rotation.x=-.25;}
  buffWings.visible=false;
  g.scale.setScalar(1.45);
  return {g,body,head,pod,nozzle:noz,tipG,wings,stem,eyeParts,wallRoots,wallLeaves,grow(k){const rise=ease(phase(k,0,.8)),open=ease(phase(k,.25,1)),root=ease(phase(k,0,.5));g.visible=k>0;stem.scale.y=Math.max(.001,rise);head.position.y=.95*rise;head.scale.setScalar(Math.max(.001,open*1.3));base.scale.setScalar(Math.max(.001,root));wallRoots.scale.setScalar(Math.max(.001,root));wallLeaves.scale.setScalar(Math.max(.001,root));},
    pose(t,aimYaw,recoil,wall,buffed=false,jolt=0){const b=typeof buffed==='number'?clamp(buffed,0,1):buffed?1:0;head.rotation.set(-.1+Math.sin(t*2)*.04+jolt*.16,aimYaw,jolt*.12);pod.scale.set(1+recoil*.25,1+recoil*.25,1-recoil*.3);head.position.z=-recoil*.08;eyeParts.forEach(({eye,smile,brow,side})=>{eye.visible=b>=.5;smile.visible=b<.5;brow.visible=b>=.5;eye.rotation.z=side*(cheeky?.12:.72);eye.scale.set(.98,cheeky?.48:.56,.16);brow.rotation.z=Math.PI/2+side*(cheeky?.12:.38);brow.position.y=cheeky?.194:.205;});buffLeaves.visible=b>.001;buffWings.visible=b>.001;const pop=Math.max(.001,b*(1+Math.max(0,jolt)*.18));buffLeaves.scale.setScalar(pop);buffWings.scale.setScalar(pop);wings.forEach(({w})=>{w.visible=b<.999;w.scale.setScalar(Math.max(.001,1-b));});
      wings.forEach(({w,s},i)=>{w.rotation.set(.2+Math.sin(t*6+i)*.12,s*.5,s*((buffed?.8:.5)+Math.sin(t*5+i*2)*.15));});buffWingParts.forEach(({l,side,i})=>{l.rotation.y=side*(.65+.18*Math.sin(t*14-i*.35));});tipG.scale.setScalar(.45+recoil*.6);}};}
const auraTextures=new Map();
function auraTex(kind,patterned=false){const key=kind+':'+patterned,cached=auraTextures.get(key);if(cached)return cached;
  const N=1024,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),C=N/2;
  if(kind==='base'){const g=x.createRadialGradient(C,C,0,C,C,C),heal=patterned==='heal',buff=patterned==='buff';g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.5,heal?'rgba(218,86,152,.12)':'rgba(70,200,100,.12)');g.addColorStop(.88,heal?'rgba(226,94,164,.36)':'rgba(50,185,85,.38)');g.addColorStop(.965,heal?'rgba(206,71,138,.6)':'rgba(40,160,70,.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,N,N);
    const tracks=patterned?[
      [.921,4,'rgba(66,152,86,.85)',false],
      [.946,16,buff?'rgba(126,250,85,.28)':'rgba(230,105,176,.25)',true],
      [.946,11,buff?'#307339':'#963d74',true],
      [.946,7,buff?'#8dfd66':'#f77db9',true],
      [.946,2.4,buff?'#d7ffb1':'#ffc3df',true]
    ]:[
      [.955,12,'rgba(30,130,55,.95)',false],
      [.955,5,'rgb(200,255,170)',false],
      [.925,4,'rgba(40,150,60,.85)',false]
    ];
    x.lineCap='round';
    for(const [r,width,color,scallop] of tracks){
      x.strokeStyle=color;x.lineWidth=width;x.beginPath();
      for(let i=0;i<=360;i++){
        const t=i/360*Math.PI*2,a=(t-.20)*8;
        const bend=scallop?.025*Math.cos(a)+.006*Math.cos(a*2):.008*Math.sin(t*24);
        const rr=(r+bend)*C,px=C+Math.cos(t)*rr,py=C+Math.sin(t)*rr;
        if(i===0)x.moveTo(px,py);else x.lineTo(px,py);
      }
      x.closePath();x.stroke();
    }
    const leaf=(t,r,L,W,col)=>{x.save();x.translate(C+Math.cos(t)*r*C,C+Math.sin(t)*r*C);x.rotate(t);x.fillStyle=col;x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(L*.5,-W,L,0);x.quadraticCurveTo(L*.5,W,0,0);x.fill();x.restore();};
    if(patterned){
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4+.20;
        for(let j=1;j<=4;j++){
          const t=a+j*Math.PI/20;
          leaf(t+.023,.941,-36,9,'#a3e47b');
          leaf(t-.027,.919,-27,7,'#5db465');
        }
      }
    }else{
      for(let i=0;i<28;i++){const t=i/28*Math.PI*2;leaf(t+.06,.935,-46,13,'rgba(150,255,120,.85)');leaf(t-.06,.935,-40,11,'rgba(90,210,90,.8)');}
      for(let i=0;i<8;i++){const t=i/8*Math.PI*2+.2;for(let k=-2;k<=2;k++)leaf(t+k*.05,.9,-60+Math.abs(k)*10,16,`rgba(255,${150+Math.abs(k)*25},210,.9)`);x.fillStyle='rgba(255,220,90,1)';x.beginPath();x.arc(C+Math.cos(t)*.9*C,C+Math.sin(t)*.9*C,7,0,7);x.fill();}
    }
  }else{x.strokeStyle='rgba(40,150,60,.85)';x.lineWidth=5;x.setLineDash([26,14]);x.beginPath();x.arc(C,C,.62*C,0,7);x.stroke();x.setLineDash([]);x.lineWidth=2;x.beginPath();x.arc(C,C,.66*C,0,7);x.stroke();
    for(let i=0;i<16;i++){const t=i/16*Math.PI*2;x.save();x.translate(C+Math.cos(t)*.64*C,C+Math.sin(t)*.64*C);x.rotate(t+Math.PI/2);x.strokeStyle='rgba(40,150,60,.9)';x.lineWidth=4;x.beginPath();x.moveTo(-10,0);x.quadraticCurveTo(0,-16,10,0);x.quadraticCurveTo(0,16,-10,0);x.stroke();x.restore();}
    for(let i=0;i<40;i++){const t=Math.random()*7,r=(.3+Math.random()*.6)*C;x.fillStyle='rgba(255,240,150,.8)';x.beginPath();x.arc(C+Math.cos(t)*r,C+Math.sin(t)*r,2+Math.random()*3,0,7);x.fill();}}
  const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.userData.keep=true;auraTextures.set(key,tx);return tx;}
function LotusAura(R,patterned=false){const g=new T.Group();add(g);const mk=(tex,r,y)=>{const m=new T.Mesh(new T.PlaneGeometry(r*2,r*2),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=y;g.add(m);return m;};
  const base=mk(auraTex('base',patterned),R,.03),inner=mk(auraTex('inner'),R,.04);
  const wall=new T.Mesh(new T.CylinderGeometry(R*.97,R*.97,.7,64,1,true),new T.MeshBasicMaterial({map:glowWallTex(),transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,color:!patterned||patterned==='buff'?'#8cff8a':'#f89ec9'}));wall.position.y=.35;g.add(wall);
  return {g,set(k,t,alpha=1){g.visible=alpha>0;g.scale.setScalar(Math.max(.001,k));base.rotation.z=t*.05;inner.rotation.z=-t*.15;base.material.opacity=alpha;inner.material.opacity=(.7+.3*Math.sin(t*2))*alpha;wall.material.opacity=(.35+.15*Math.sin(t*3))*k*alpha;}};}
function glowWallTex(){const cached=auraTextures.get('wall');if(cached)return cached;
  const c=document.createElement('canvas');c.width=4;c.height=64;const x=c.getContext('2d'),g=x.createLinearGradient(0,64,0,0);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,4,64);
  const tx=new T.CanvasTexture(c);tx.userData.keep=true;auraTextures.set('wall',tx);return tx;}
const M_BUB=new T.MeshPhysicalMaterial({color:'#9dffc0',emissive:'#1f8a4a',emissiveIntensity:.35,roughness:.05,transmission:0,transparent:true,opacity:.14,side:T.DoubleSide,depthWrite:false});
const M_BUBRIM=new T.MeshBasicMaterial({color:'#7dffa8',transparent:true,opacity:.22,blending:T.AdditiveBlending,depthWrite:false,side:T.BackSide});
const M_DRIP=STD('#7dffb0',{roughness:.15,emissive:'#20c060',emissiveIntensity:.8,transparent:true,opacity:.85});
const M_POOL=new T.MeshBasicMaterial({color:'#4dff90',transparent:true,opacity:.35,blending:T.AdditiveBlending,depthWrite:false});
for(const m of [M_BUB,M_BUBRIM,M_DRIP,M_POOL])m.userData.keep=true;
function lotusPetalVeins(base,buffMix={value:0}){
  const material=base.clone();
  material.customProgramCacheKey=()=>'nature-lotus-petal-veins';
  material.onBeforeCompile=shader=>{
    shader.uniforms.lotusBuffMix=buffMix;
    shader.vertexShader='varying vec2 vLotusPetal;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvLotusPetal=position.xy;');
    shader.fragmentShader='uniform float lotusBuffMix;\nvarying vec2 vLotusPetal;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`$&
      float petalY=clamp(vLotusPetal.y/1.15,0.0,1.0);
      float petalSpan=sqrt(max(0.01,4.0*petalY*(1.0-petalY)));
      float petalX=abs(vLotusPetal.x/(0.225*petalSpan)-0.045*sin(petalY*8.0));
      float tipFade=1.0-smoothstep(0.79,0.98,petalY);
      float spine=(1.0-smoothstep(0.023,0.068,petalX))
        *smoothstep(0.07,0.17,petalY)*tipFade;
      float sweep=0.19*petalX+0.055*petalX*petalX;
      float ribGap=min(abs(petalY-0.22-sweep),
        min(abs(petalY-0.39-sweep),abs(petalY-0.56-sweep)));
      float ribs=(1.0-smoothstep(0.005,0.022,ribGap))
        *(1.0-smoothstep(0.61,0.94,petalX))*tipFade;
      diffuseColor.rgb=mix(diffuseColor.rgb*vec3(1.0,0.86+0.22*petalY,0.97),
        mix(vec3(0.40,0.044,0.15),vec3(0.09,0.42,0.025),lotusBuffMix),max(spine*0.70,ribs*0.57));
    `);
  };
  return material;
}
function Lotus(scale=1,patterned=false,buffMix){const g=new T.Group();add(g);const H=4.2;   // ผู้ใช้: ลำต้นยาวขึ้นอีกหน่อย (เดิม 3.3)
  // ลำต้นโค้งนิด ๆ + ใบใหญ่ที่โคน + เถาพันแนบลำต้น (สไตล์เดียวกับต้นยิง)
  const stemC=new T.CatmullRomCurve3([V3(0,0,0),V3(.18,1.3,0),V3(-.12,2.7,.05),V3(0,H,0)]);
  const stem=mesh(new T.TubeGeometry(stemC,24,.16,10),M.stem,g);
  const tr=mesh(new T.CylinderGeometry(.16,.42,.7,12),M.stem,g);tr.position.y=.3;
  // รากใหญ่แผ่บนพื้น 7 เส้น (ผู้ใช้: root bigger)
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2+.2,L=1.75+(i%3)*.42,c=new T.CatmullRomCurve3([V3(0,.45,0),V3(Math.cos(a)*.4,.18,Math.sin(a)*.4),V3(Math.cos(a+.2)*L*.7,.06,Math.sin(a+.2)*L*.7),V3(Math.cos(a+.3)*L,.02,Math.sin(a+.3)*L)]);
    const rt=new T.TubeGeometry(c,16,.11,7);mesh(rt,M.stem,g);}
  const leaves=[];for(let i=0;i<5;i++){const pv=new T.Group();pv.rotation.order='YXZ';pv.rotation.y=i/5*Math.PI*2+.3;pv.position.y=.08;g.add(pv);
    const l=mesh(leafGeo,i%2?M.leaf:M.leafD,pv);l.scale.set(2,1.4,1);l.position.x=1.0;l.rotation.x=-Math.PI/2;leaves.push(pv);}
  for(let i=0;i<3;i++){const u=.3+i*.2,c=stemC.getPoint(u),pv=new T.Group(),s=i%2?1:-1;pv.position.copy(c);pv.rotation.set(0,i*2.1,s*.6);g.add(pv);const l=mesh(leafGeo,M.leaf,pv);l.scale.set(.6,.6,.6);l.position.x=s*.3;}
  for(let j=0;j<2;j++){const pts=[];for(let i=0;i<=30;i++){const u=i/30,a=u*Math.PI*5+j*Math.PI,c=stemC.getPoint(u*.95);pts.push(V3(c.x+Math.cos(a)*.17,c.y,c.z+Math.sin(a)*.17));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,.025,5),M.leafD,g);}
  // ดอกบัวบนยอด: กลีบชมพู 3 ชั้น + แกนเหลืองเรือง
  const bloom=new T.Group();bloom.position.y=H;bloom.scale.setScalar(1.35);g.add(bloom);
  const cup=mesh(new T.SphereGeometry(.38,16,10,0,Math.PI*2,Math.PI/2,Math.PI/2),M.stem,bloom);cup.scale.y=.5;
  const petG=new T.SphereGeometry(.5,12,10);petG.translate(0,.5,0);petG.scale(.45,1.15,.13);
  const outerPetal=patterned?lotusPetalVeins(M.petal,buffMix):M.petal;
  const innerPetal=patterned?lotusPetalVeins(M.petalIn,buffMix):M.petalIn;
  const petals=[];for(let r=0;r<3;r++){const n=[10,8,6][r];for(let i=0;i<n;i++){const piv=new T.Group();piv.rotation.order='YXZ';piv.rotation.y=i/n*Math.PI*2+r*.3;bloom.add(piv);
    const m=mesh(petG,r===2?innerPetal:outerPetal,piv);m.scale.setScalar([1.15,.95,.75][r]);petals.push({piv,r,open:[1.2,.8,.42][r]});}}
  const core=mesh(new T.SphereGeometry(.2,16,10),M.core,bloom);core.position.y=.18;core.scale.y=.7;
  const cg=glow(GLOWT,1.2,bloom);cg.position.y=.3;
  // ฟองแก้วเรืองแสงครอบดอก
  const bub=new T.Group();bub.position.y=H+1.05;g.add(bub);
  const ball=mesh(new T.SphereGeometry(1.7,32,20),M_BUB,bub),rim=mesh(new T.SphereGeometry(1.74,32,20),M_BUBRIM,bub);
  ball.visible=false;rim.visible=false;
  const bg=glow(GLOWG,3.0,bub);bg.material.opacity=.10;
  const haloMat=new T.MeshBasicMaterial({color:'#baffbe',transparent:true,opacity:.16,blending:T.AdditiveBlending,depthWrite:false});const halos=[];for(let i=0;i<2;i++){const h=mesh(new T.TorusGeometry(1.15+i*.17,.009,6,96),haloMat,bub);h.rotation.set(1.15+i*.24,.3+i*.7,0);halos.push(h);}
  const auraWisps=[];for(let i=0;i<18;i++){const w=glow(i%4===0?GLOWP:GLOWG,.32+(i%3)*.12,bub);w.material.opacity=.14+(i%3)*.035;auraWisps.push(w);}
  // หยดน้ำไหลลงตามลำต้น + แอ่งเรืองแสงที่โคน
  const drips=[];for(let i=0;i<6;i++){const d=mesh(new T.SphereGeometry(.07,8,6),M_DRIP,g);d.scale.y=1.6;drips.push({d,o:i/6});}
  const pool=mesh(new T.CircleGeometry(1.4,32),M_POOL,g);pool.rotation.x=-Math.PI/2;pool.position.y=.03;
  const pool2=mesh(new T.RingGeometry(1.1,1.5,32),M_POOL,g);pool2.rotation.x=-Math.PI/2;pool2.position.y=.035;
  g.scale.setScalar(.001);
  return {g,bloom,petals,outerPetal,innerPetal,core,cg,stem,set(grow,open,t){g.scale.setScalar(Math.max(.001,scale*grow));
      petals.forEach(({piv,r,open:o},i)=>{piv.rotation.x=lerp(.12,o,open)+Math.sin(t*1.4+i)*.03*open;});cg.scale.setScalar((.8+Math.sin(t*3)*.15)*open*1.8+.01);
      bloom.rotation.z=Math.sin(t*.9)*.04*open;
      const bk=ease(phase(open,.4,1));bub.scale.setScalar(Math.max(.001,bk*(1+Math.sin(t*2.2)*.025)));bub.visible=bk>.01;
      halos.forEach((h,i)=>{h.rotation.z=t*(i?-.25:.2);});
      auraWisps.forEach((w,i)=>{const a=i*2.4+t*(i%2?-.45:.5),y=((i*.37+t*.22)%2.4)-1.2,r=.68+.48*Math.sin(i*4.1+t*.7)**2;w.position.set(Math.cos(a)*r,y,Math.sin(a)*r);});
      for(const {d,o} of drips){const k=(t*.45+o)%1,c=stemC.getPoint(1-k*.97);d.position.set(c.x+.17,c.y,c.z);d.visible=bk>.5;}
      const pk=ease(phase(open,.6,1));pool.scale.setScalar(Math.max(.001,pk));pool2.scale.setScalar(Math.max(.001,pk*(1+.08*Math.sin(t*3))));}};}
  return {Turret,Lotus,LotusAura};
}
window.WD.naturePlantArt=naturePlantArt;
