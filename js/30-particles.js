// ---------- อนุภาค 2 ชั้น: แสงเรือง (additive) + ควัน (normal) ----------
const PMAX=5000;
function makePointSys(additive){
  const geo=new THREE.BufferGeometry();
  const pos=new Float32Array(PMAX*3),col=new Float32Array(PMAX*4),size=new Float32Array(PMAX);
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('pcol',new THREE.BufferAttribute(col,4));
  geo.setAttribute('psize',new THREE.BufferAttribute(size,1));
  const mat=new THREE.ShaderMaterial({
    uniforms:{map:{value:glowTex},scale:{value:600}},
    vertexShader:'attribute vec4 pcol;attribute float psize;uniform float scale;varying vec4 vC;void main(){vC=pcol;vec4 mv=modelViewMatrix*vec4(position,1.0);vC.a*=smoothstep(1.2,5.0,-mv.z);gl_PointSize=psize*scale/-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:additive?'uniform sampler2D map;varying vec4 vC;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(vC.rgb*t.a*vC.a,t.a*vC.a);}'
      :'uniform sampler2D map;varying vec4 vC;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(vC.rgb,t.a*vC.a*0.8);}',
    blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,depthWrite:false,transparent:true
  });
  const pts=new THREE.Points(geo,mat);pts.frustumCulled=false;pts.renderOrder=additive?3:2;scene.add(pts);
  return {geo,pos,col,size,n:0};
}
// เปลวไฟรูปหยดน้ำ (ฐานเหลืองขาว → ส้ม → ปลายแดงจาง) ใช้กับอนุภาค fl:true — ผสมสีปกติ เห็นชัดแม้พื้นสว่าง
// ===== เปลวไฟ: FLAME_STYLE 0 = อนุภาคกลมเรืองแสง (ไม่ใช้รูปเปลว) • 2 = แบบใหม่ (ลิ้นไฟ 4 แบบ คมปลาย มีแกนสว่าง ไม่กลับหัว หดเล็กและเปลี่ยนสีเหลือง→ส้ม→แดงตามอายุ)
//       FLAME_STYLE 1 = แบบแรก (เปลวหยดน้ำเบลอ) — ผู้ใช้ขอเก็บไว้เผื่อเปลี่ยนกลับ: แก้เลขบรรทัดนี้เป็น 1 =====
const FLAME_STYLE=3;   // 3 = ก้อนไฟกลมขอบไหว เปลี่ยนสีตามอายุ เหลืองขาว→ส้ม→แดงเข้ม (2026-10-19 รอบอัปเกรดไฟ) • 0 = อนุภาคกลมเรืองแสงแบบเดิม • 1 = เปลวหยดน้ำ • 2 = ลิ้นไฟ
const PTIME={value:0};
// ภาพ noise ต่อกันไร้รอยต่อ 128×128 (fbm 4 ชั้น, ตาราง 4 ช่องต่อภาพ) — ใช้แทนการคำนวณ noise สดใน shader ไฟ (เร็วกว่ามาก)
const NOISETEX=(()=>{const N=128,d=new Uint8Array(N*N*4);let sd=1337;const rr=()=>((sd=(sd*16807)%2147483647)/2147483647);
  const oct=[];for(let o=0;o<4;o++){const L=4<<o,g=[];for(let i=0;i<L*L;i++)g.push(rr());oct.push({L,g});}
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){let v=0,a=0.5,t=0;for(const {L,g} of oct){const fx=x/N*L,fy=y/N*L,ix=Math.floor(fx),iy=Math.floor(fy),ux=fx-ix,uy=fy-iy,sx=ux*ux*(3-2*ux),sy=uy*uy*(3-2*uy);
      const G=(i,j)=>g[((j+L)%L)*L+((i+L)%L)],a0=G(ix,iy)+(G(ix+1,iy)-G(ix,iy))*sx,a1=G(ix,iy+1)+(G(ix+1,iy+1)-G(ix,iy+1))*sx;v+=a*(a0+(a1-a0)*sy);t+=a;a*=0.5;}
    v/=t;v=Math.min(1,Math.max(0,(v-0.5)*1.9+0.5));const k=(y*N+x)*4;d[k]=d[k+1]=d[k+2]=Math.round(v*255);d[k+3]=255;}
  const T=new THREE.DataTexture(d,N,N,THREE.RGBAFormat);T.wrapS=T.wrapT=THREE.RepeatWrapping;T.magFilter=THREE.LinearFilter;T.minFilter=THREE.LinearMipmapLinearFilter;T.generateMipmaps=true;T.needsUpdate=true;T.userData.keep=true;return T;})();
const FLAMETEX_V1=texCanvas(64,64,(g)=>{
  const drop=(w,h,col,bl)=>{g.save();g.filter='blur('+bl+'px)';g.beginPath();g.moveTo(32,58);g.bezierCurveTo(32+w,56-h*0.25,32+w*0.45,58-h*0.72,32,58-h);g.bezierCurveTo(32-w*0.45,58-h*0.72,32-w,56-h*0.25,32,58);g.fillStyle=col;g.fill();g.restore();};
  drop(20,54,'rgba(210,30,6,0.9)',3);drop(15,42,'rgba(255,90,10,0.97)',2.5);drop(10,28,'rgba(255,170,30,1)',2);drop(5,14,'rgba(255,240,190,1)',1.5);
},false);
// แบบใหม่: แผ่นภาพ 2x2 ช่อง แต่ละช่องเป็นลิ้นไฟคนละทรง (ลิ้นหลัก + ลิ้นเล็กข้าง ๆ เอนต่างกัน) ไล่สีจากฐานเหลืองขาว → ส้ม → ปลายแดงจาง
const FLAMETEX_V2=texCanvas(128,128,(g)=>{
  const tongue=(ox,oy,cx,base,w,h,lean,a)=>{const x0=ox+cx,y0=oy+base,tipx=x0+lean,tipy=y0-h;
    const gr=g.createLinearGradient(0,y0,0,tipy);gr.addColorStop(0,`rgba(255,238,170,${a})`);gr.addColorStop(0.16,`rgba(255,185,50,${a})`);gr.addColorStop(0.42,`rgba(255,105,15,${a*0.95})`);gr.addColorStop(0.75,`rgba(215,40,8,${a*0.7})`);gr.addColorStop(1,'rgba(160,20,5,0)');
    g.beginPath();g.moveTo(x0-w,y0-2);g.bezierCurveTo(x0-w*1.05,y0-h*0.45,tipx-w*0.25,y0-h*0.7,tipx,tipy);g.bezierCurveTo(tipx+w*0.2,y0-h*0.62,x0+w*1.05,y0-h*0.4,x0+w,y0-2);g.quadraticCurveTo(x0,y0+4,x0-w,y0-2);
    g.save();g.shadowColor='rgba(255,120,30,0.8)';g.shadowBlur=5;g.fillStyle=gr;g.fill();g.restore();};
  const cell=[[0,0],[64,0],[0,64],[64,64]],sh=[[[32,58,11,50,-4,1],[22,58,6,26,-6,0.8],[42,58,6,30,5,0.8]],[[32,58,12,54,5,1],[20,58,5,22,-3,0.75]],[[30,58,10,44,-8,1],[42,58,7,34,6,0.85],[24,58,5,20,-4,0.7]],[[32,58,13,56,2,1],[44,58,5,24,7,0.7]]];
  cell.forEach(([ox,oy],i)=>{for(const t of sh[i])tongue(ox,oy,...t);
    // แกนสว่างที่ฐาน
    const rg=g.createRadialGradient(ox+32,oy+52,0,ox+32,oy+52,8);rg.addColorStop(0,'rgba(255,250,220,0.85)');rg.addColorStop(1,'rgba(255,220,120,0)');g.fillStyle=rg;g.fillRect(ox+20,oy+40,24,22);});
},false);
const PSYS=[makePointSys(true),makePointSys(false),makePointSys(false)];
{const F=PSYS[2],pts=scene.children[scene.children.length-1];pts.renderOrder=4;
  F.vari=new Float32Array(PMAX);F.geo.setAttribute('pvar',new THREE.BufferAttribute(F.vari,1));
  pts.material=new THREE.ShaderMaterial({
  uniforms:{map:{value:FLAME_STYLE===2?FLAMETEX_V2:FLAMETEX_V1},scale:{value:600},time:PTIME,nz:{value:NOISETEX}},
  vertexShader:'attribute vec4 pcol;attribute float psize;attribute float pvar;uniform float scale;varying vec4 vC;varying float vV;void main(){vC=pcol;vV=pvar;vec4 mv=modelViewMatrix*vec4(position,1.0);vC.a*=smoothstep(1.2,5.0,-mv.z);gl_PointSize=psize*scale/-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:FLAME_STYLE===3
    // ก้อนไฟ: ขอบเป็น noise ไหลขึ้น + แกนสว่าง • vV = seed (เศษ) + ระดับบวกแสง (จำนวนเต็ม 0-8) — ไฟใหม่บวกแสง ไฟเก่าทึบ (บังฉากหลัง)
    ?'uniform float time;uniform sampler2D nz;varying vec4 vC;varying float vV;'+
      'void main(){vec2 c=gl_PointCoord*2.0-1.0;float sd=fract(vV),ad=floor(vV)/8.0;float n=texture2D(nz,c*0.28+vec2(sd*7.31,sd*3.17+time*0.33)).r;'+
      'float r=length(vec2(c.x,c.y*0.9-0.06));float m=1.0-smoothstep(0.32,1.0,r+(n-0.5)*0.6);if(m<=0.0)discard;float core=1.0-smoothstep(0.0,0.62,r+(n-0.5)*0.35);'+
      'float a=m*vC.a;vec3 col=vC.rgb*(0.72+0.5*core);gl_FragColor=vec4(col*a,a*(1.0-ad*0.85));}'
    :FLAME_STYLE===2
    ?'uniform sampler2D map;varying vec4 vC;varying float vV;void main(){vec2 c=vec2(mod(vV,2.0),floor(vV/2.0));vec4 t=texture2D(map,vec2((c.x+gl_PointCoord.x)*0.5,1.0-(c.y+gl_PointCoord.y)*0.5));gl_FragColor=vec4(t.rgb*vC.rgb,t.a*vC.a);}'
    :'uniform sampler2D map;varying vec4 vC;varying float vV;void main(){vec4 t=texture2D(map,vec2(gl_PointCoord.x,gl_PointCoord.y));gl_FragColor=vec4(t.rgb*vC.rgb*1.05,t.a*vC.a);}',
  depthWrite:false,transparent:true,...(FLAME_STYLE===3?{blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor}:{blending:THREE.NormalBlending})});F.mat=pts.material;}
// สีไฟตามอายุ (ตาราง 64 ช่อง สีเชิงเส้น): ใหม่ = เหลืองขาว → เหลืองทอง → ส้ม → แดงส้ม → แดงเข้ม → ถ่านดำ
const FLAMELUT=(()=>{const st=[[0,'#fff6dc'],[0.12,'#ffd56a'],[0.3,'#ff9a2a'],[0.5,'#f2561a'],[0.72,'#a8240c'],[0.9,'#3a1208'],[1,'#1a0a06']].map(([t,c])=>[t,new THREE.Color(c)]),L=[];
  for(let i=0;i<64;i++){const t=i/63;let k=0;while(k<st.length-2&&st[k+1][0]<t)k++;const [t0,c0]=st[k],[t1,c1]=st[k+1],u=Math.min(1,Math.max(0,(t-t0)/(t1-t0)));L.push(c0.clone().lerp(c1,u));}return L;})();
// เปลวไฟ 1 ดวง (fl:true) — col = สีย้อม ('#ffffff' = สีเปลวตามภาพ)
const FLAMECOL=['#fff0b0','#ffd27a','#ffb347','#ff8a2a','#ff6a1a','#ff5a14'];
function flame(x,y,h,o){o=o||{};
  if(FLAME_STYLE===3){PARTS.push({x,y,h:h+0.1,vx:o.vx||0,vy:o.vy||0,vh:o.vh===undefined?rnd(2,4):o.vh,life:o.life||0.45,max:o.life||0.45,col:o.col||'#ffffff',size:(o.size||6)*0.78,g:o.g===undefined?-1.5:o.g,drag:o.drag===undefined?2:o.drag,grow:o.grow===undefined?0.5:o.grow,fl:true,sd:Math.random()*0.99});return;}
  if(FLAME_STYLE===0){PARTS.push({x,y,h:h+0.15,vx:o.vx||0,vy:o.vy||0,vh:o.vh===undefined?rnd(2,4):o.vh,life:o.life||0.45,max:o.life||0.45,col:(o.col&&o.col!=='#ffffff'&&o.col[1]!=='f'?o.col:FLAMECOL[(Math.random()*FLAMECOL.length)|0]),size:(o.size||6)*0.6,g:o.g===undefined?-1.5:o.g,drag:o.drag===undefined?2:o.drag,grow:o.grow===undefined?0.6:o.grow});return;}
  PARTS.push({x,y,h,vx:o.vx||0,vy:o.vy||0,vh:o.vh===undefined?rnd(2,4):o.vh,life:o.life||0.45,max:o.life||0.45,col:o.col||'#ffffff',size:o.size||6,g:o.g===undefined?-1.5:o.g,drag:o.drag===undefined?2:o.drag,grow:o.grow===undefined?(FLAME_STYLE===2?0:0.4):o.grow,fl:true,v:(Math.random()*4)|0});}
const colCache={};
function col3(c){return colCache[c]||(colCache[c]=new THREE.Color(c));}
function updateParticles(dt){
  PSYS[0].n=PSYS[1].n=PSYS[2].n=0;PTIME.value+=dt;
  if(PARTS.length>PMAX*1.6)PARTS.splice(0,PARTS.length-PMAX*1.6);
  for(let i=PARTS.length-1;i>=0;i--){
    const p=PARTS[i];p.life-=dt;
    if(p.life<=0){PARTS.splice(i,1);continue;}
    if(p.h===undefined){p.h=1.2;p.vh=rnd(-1,3.5);}
    if(p.g===undefined)p.g=4;
    const dr=Math.exp(-(p.drag||3)*dt);
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.h=Math.max(0.03,p.h+p.vh*dt);p.vh-=p.g*dt;p.vx*=dr;p.vy*=dr;
    if(p.grow)p.size*=1+p.grow*dt;
    const S=PSYS[p.fl?2:p.smoke?1:0];if(S.n>=PMAX)continue;
    const k=p.life/p.max,c=col3(p.col),j=S.n;
    S.pos[j*3]=tx(p.x);S.pos[j*3+1]=p.h+GY(p.x,p.y);S.pos[j*3+2]=tz(p.y);
    if(p.fl&&FLAME_STYLE===3){const t=1-k,L=FLAMELUT[Math.min(63,(t*63)|0)];S.col[j*4]=L.r*c.r;S.col[j*4+1]=L.g*c.g;S.col[j*4+2]=L.b*c.b;S.col[j*4+3]=Math.min(1,t*16)*Math.min(1,k*2.2)*(1-0.5*Math.min(1,Math.max(0,(t-0.4)/0.5)));
      S.vari[j]=Math.round(8*(1-Math.min(1,Math.max(0,(t-0.22)/0.45))))+p.sd;}
    else if(p.fl){const u=FLAME_STYLE===2?1-k:0;S.col[j*4]=c.r;S.col[j*4+1]=c.g*(1-0.45*u);S.col[j*4+2]=c.b*(1-0.75*u);S.col[j*4+3]=Math.min(1,(1-k)*7)*Math.min(1,k*1.8);S.vari[j]=p.v|0;}
    else if(p.smoke){S.col[j*4]=c.r;S.col[j*4+1]=c.g;S.col[j*4+2]=c.b;S.col[j*4+3]=Math.min(1,k*1.5);}
    else{const b=1.25;S.col[j*4]=c.r*b;S.col[j*4+1]=c.g*b;S.col[j*4+2]=c.b*b;S.col[j*4+3]=k;}
    S.size[j]=p.size*0.12*(p.fl&&FLAME_STYLE===2?0.45+0.55*k:p.fl&&FLAME_STYLE===3?(0.55+0.45*Math.min(1,(1-k)*5))*(1-0.3*(1-k)*(1-k)):1);S.n++;
  }
  for(const S of PSYS){S.geo.setDrawRange(0,S.n);const a=S.geo.attributes;a.position.needsUpdate=a.pcol.needsUpdate=a.psize.needsUpdate=true;if(a.pvar)a.pvar.needsUpdate=true;}
}

// ---------- เอฟเฟกต์รูปทรง: แฟลช / วงแหวน / โดม / รอยไหม้ / สายฟ้า / แสงชั่วคราว ----------
const SHAPES_Q=[],SHAPES=[],FLASHL=[],LINES=[];
let LREQ=[];
const ringGeo=new THREE.RingGeometry(0.88,1,64);ringGeo.rotateX(-Math.PI/2);
const ringVGeo=new THREE.RingGeometry(0.8,1,48);
const arcGeo=new THREE.RingGeometry(0.85,1,32,1,-0.8,1.6);arcGeo.rotateX(-Math.PI/2);
const domeGeo=new THREE.SphereGeometry(1,32,16,0,Math.PI*2,0,Math.PI/2);
const fullGeo=new THREE.SphereGeometry(1,24,16);
const discGeo=new THREE.CircleGeometry(1,40);discGeo.rotateX(-Math.PI/2);
const decalTex=texCanvas(128,128,(g)=>{const r=g.createRadialGradient(64,64,10,64,64,64);r.addColorStop(0,'rgba(0,0,0,1)');r.addColorStop(0.6,'rgba(10,6,4,0.7)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,128,128);},false);
const FX={
  flashSprite(x,y,h,col,s0,s1,life,k){
    const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:hdr(col,k||2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
    m.position.set(tx(x),h+GY(x,y),tz(y));m.scale.setScalar(s0);scene.add(m);
    SHAPES.push({m,life,max:life,s0,s1,op:1,sprite:true});
  },
  flashLight(x,y,h,col,int,dist,life){FLASHL.push({x:tx(x),y:h,z:tz(y),col,int,dist,life,max:life});},
  bolt(x1,y1,h1,x2,y2,h2,life,col){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(10*3),3));
    const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color:hdr(col||'#bff4ff',col?1.2:3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    scene.add(line);
    LINES.push({line,a:new THREE.Vector3(tx(x1),h1+GY(x1,y1),tz(y1)),b:new THREE.Vector3(tx(x2),h2+GY(x2,y2),tz(y2)),life,max:life});
  }
};
function jag(geo,a,b,amp){
  const p=geo.attributes.position.array,n=p.length/3;
  for(let i=0;i<n;i++){
    const t=i/(n-1),o=(i===0||i===n-1)?0:amp;
    p[i*3]=a.x+(b.x-a.x)*t+rnd(-o,o);p[i*3+1]=a.y+(b.y-a.y)*t+rnd(-o,o);p[i*3+2]=a.z+(b.z-a.z)*t+rnd(-o,o);
  }
  geo.attributes.position.needsUpdate=true;
}
function spawnShape(s){
  const add=THREE.AdditiveBlending;
  let geo,mat,rotY=0;
  const col=hdr(s.col,s.k==='decal'?1:1.8);
  switch(s.k){
    case 'ring':geo=ringGeo;break;
    case 'ringv':geo=ringVGeo;break;
    case 'arc':geo=arcGeo;rotY=-s.a;break;
    case 'dome':geo=s.full?fullGeo:domeGeo;break;
    case 'decal':geo=discGeo;break;
    case 'rune':geo=discGeo;break;
    case 'warn':geo=discGeo;break;
    case 'warnr':geo=ringGeo;break;
  }
  if(s.k==='decal')mat=new THREE.MeshBasicMaterial({map:decalTex,color:'#ffffff',transparent:true,depthWrite:false,opacity:s.op||0.5});
  else if(s.k==='rune')mat=new THREE.MeshBasicMaterial({map:runeTex,color:col,transparent:true,depthWrite:false,blending:add});
  else mat=new THREE.MeshBasicMaterial({color:col,transparent:true,depthWrite:false,blending:add,side:THREE.DoubleSide});
  const m=new THREE.Mesh(geo,mat);
  m.position.set(tx(s.x),(s.h!==undefined?s.h:(s.k==='decal'?0.025:0.06))+GY(s.x,s.y),tz(s.y));
  m.rotation.y=rotY;
  if(s.k==='ringv'){const me=VIEW.cur&&myPos();m.lookAt(cam.position);}
  m.visible=!s.delay;
  scene.add(m);
  const fixed=s.k==='decal'||s.k==='rune'||s.k==='warn'||s.k==='warnr';
  if(s.k==='warn'||s.k==='warnr')m.position.y=0.07;
  SHAPES.push({m,life:s.life,max:s.life,s0:s.s0!==undefined?s.s0:(fixed?s.s1:0.1),s1:s.s1,op:s.op!==undefined?s.op:0.9,delay:s.delay||0,spin:s.k==='rune',warn:s.k==='warn'||s.k==='warnr'});
}
function updateShapes(dt){
  while(SHAPES_Q.length)spawnShape(SHAPES_Q.shift());
  for(let i=SHAPES.length-1;i>=0;i--){
    const o=SHAPES[i];
    if(o.delay>0){o.delay-=dt;if(o.delay<=0)o.m.visible=true;continue;}
    o.life-=dt;
    if(o.life<=0){scene.remove(o.m);o.m.material.dispose();SHAPES.splice(i,1);continue;}
    const t=1-o.life/o.max,e=1-Math.pow(1-t,3),s=o.s0+(o.s1-o.s0)*e;
    o.m.scale.set(s,s,s);
    o.m.material.opacity=o.op*Math.min(1,o.life/o.max*1.4);
    if(o.spin)o.m.rotation.y+=dt*1.5;
    if(o.warn)o.m.material.opacity=0.1+0.4*t+0.1*Math.sin(o.life*30);
  }
  for(let i=LINES.length-1;i>=0;i--){
    const L=LINES[i];L.life-=dt;
    if(L.life<=0){scene.remove(L.line);L.line.geometry.dispose();L.line.material.dispose();LINES.splice(i,1);continue;}
    jag(L.line.geometry,L.a,L.b,0.3);L.line.material.opacity=L.life/L.max;
  }
}
const _cp=new THREE.Vector3();
function updateLights(dt){
  for(let i=FLASHL.length-1;i>=0;i--){
    const f=FLASHL[i];f.life-=dt;
    if(f.life<=0){FLASHL.splice(i,1);continue;}
    LREQ.push({x:f.x,y:f.y,z:f.z,col:f.col,int:f.int*(f.life/f.max),dist:f.dist});
  }
  _cp.copy(cam.position);
  LREQ.sort((a,b)=>((a.x-_cp.x)**2+(a.z-_cp.z)**2)/(a.int+0.1)-((b.x-_cp.x)**2+(b.z-_cp.z)**2)/(b.int+0.1));
  for(let i=0;i<LPOOL.length;i++){
    const L=LPOOL[i],r=LREQ[i];
    if(r){L.position.set(r.x,r.y+(r.abs?0:TW(r.x,r.z)),r.z);L.color.set(r.col);L.intensity=r.int;L.distance=r.dist;}
    else L.intensity=0;
  }
  LREQ=[];
}
