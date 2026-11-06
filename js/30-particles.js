// ---------- อนุภาค 2 ชั้น: แสงเรือง (additive) + ควัน (normal) ----------
const PMAX=5000;
// อนุภาคสมจริง (VFX.md §1.6, 2026-10-19): page = (อายุ 0→1, seed) ต่อเม็ด → ใช้กัดกร่อนขอบ (erosion) / สุ่มลายไม่ซ้ำ
// D) ชั้นเรือง: ผสมแบบ premultiplied (บวกแสง + บังข้างหลังนิดหน่อย PGLOW_OCC) — ซ้อนกันหลายเม็ดแล้วอิ่มเป็นสีของมันเอง ไม่ขาวโพลน
// E) ควัน: ก้อนควันลาย noise ไหล ขอบแหว่ง ด้านบนสว่าง/ล่างมืด สีคูณแสงของฉาก (PLIT ตามแสงท้องฟ้า hemi)
const PGLOW_OCC=0.4,PLIT={value:new THREE.Color(1,1,1)};
// ===== อนุภาคบน GPU (ผู้ใช้ 2026-11-06 เลือกย้าย • ?gpup = เปิด) =====
// ตอนเกิดเขียนค่าตั้งต้นลงช่องในบัฟเฟอร์ครั้งเดียว แล้ว vertex shader คำนวณตำแหน่ง/สี/ขนาดจากอายุเอง CPU ไม่ต้องเดินทุกเม็ดทุกเฟรม
// PARTS.push(...) ทั้ง 177 จุดเหมือนเดิม • fragment shader เหมือนเดิม • ความสูงพื้นอ่านครั้งเดียวตอนเกิด • ลมหมุน = ประมาณจากจุดปัจจุบัน
const PGPU=/[?&]gpup\b/.test(location.search),PGPU_F=28,PG_U={uMapS:{value:new THREE.Vector3(1,0,0)},uCur:{value:new THREE.Vector4()}};
const PGPU_HEAD='attribute float aG;attribute vec4 aV;attribute vec4 aA;attribute vec4 aB;attribute vec4 aC;attribute vec4 aD;attribute vec4 aE;uniform float time;uniform vec4 uCur;uniform vec3 uMapS;uniform float scale;vec3 pP,pV;float pK,pH,pS,pT;'+
  'bool pSim(){float t=time-aA.z;pT=t;pK=(aA.w-t)/aB.x;if(pK<=0.0||t<0.0)return false;'+
  'float d=aV.w,dr=exp(-d*t);vec2 xz=position.xz+aV.xz*(1.0-dr)/d;'+
  'pH=max(0.03,position.y+aV.y*t-0.5*aA.x*t*t);pS=aB.z*exp(aA.y*t);'+
  'if(aB.w>0.0){float m=aB.x,A=aB.w*(0.3*t+0.7*((m-aA.w)*t+0.5*t*t)/m);vec2 g=xz/uMapS.x+uMapS.yz;float gx=g.x+aB.y*97.0,Tm=time-t*0.5,q=uCur.x,a=q*gx+0.6*Tm,b=1.2*q*g.y-0.45*Tm,c=2.3*q*g.y+0.8*Tm+1.7,e=1.9*q*gx-0.3*Tm;'+
    'xz+=vec2(-sin(a)*sin(b)*1.2+0.5*cos(c)*cos(e)*2.3,-(cos(a)*cos(b)-0.5*sin(c)*sin(e)*1.9))*A*uMapS.x;}'+
  'pP=vec3(xz.x,pH+aG,xz.y);pV=vec3(aV.x*dr,aV.y-aA.x*t,aV.z*dr);return true;}';
const PGPU_DEAD='gl_Position=vec4(2.0,2.0,2.0,1.0);gl_PointSize=0.0;vC=vec4(0.0);';
const PGPU_MV='vec4 mv=modelViewMatrix*vec4(pP,1.0);vC.a*=smoothstep(1.2,5.0,-mv.z);';
function pgpuGeo(geo,S){const a=new Float32Array(PMAX*PGPU_F),ib=new THREE.InterleavedBuffer(a,PGPU_F);ib.setUsage(THREE.DynamicDrawUsage);
  const add=(n,k,o)=>geo.setAttribute(n,new THREE.InterleavedBufferAttribute(ib,k,o));
  add('position',3,0);add('aG',1,3);add('aV',4,4);add('aA',4,8);add('aB',4,12);add('aC',4,16);add('aD',4,20);add('aE',4,24);
  S.a=a;S.ib=ib;S.head=PMAX;S.top=PMAX;S.low=PMAX;S.die=0;S.rg=[];geo.setDrawRange(0,0);}
function makePointSys(additive){
  const geo=new THREE.BufferGeometry();
  const pos=PGPU?null:new Float32Array(PMAX*3),col=PGPU?null:new Float32Array(PMAX*4),size=PGPU?null:new Float32Array(PMAX),age=PGPU?null:new Float32Array(PMAX*2);
  if(!PGPU){geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('pcol',new THREE.BufferAttribute(col,4));
  geo.setAttribute('psize',new THREE.BufferAttribute(size,1));
  geo.setAttribute('page',new THREE.BufferAttribute(age,2));}
  // ชั้นแสงเรือง: รูปทรงต่ออนุภาค pshp = (รูป, มุม) • 0 กลมเรือง 1 ดาวประกาย 4 แฉก 2 เส้นยืดตามทิศพุ่ง (pvel) 3 วงแหวน 4 เกล็ดผลึก 6 เหลี่ยม
  let shp=null,vel=null;
  if(additive&&!PGPU){shp=new Float32Array(PMAX*2);vel=new Float32Array(PMAX*3);geo.setAttribute('pshp',new THREE.BufferAttribute(shp,2));geo.setAttribute('pvel',new THREE.BufferAttribute(vel,3));}
  const mat=new THREE.ShaderMaterial({
    uniforms:{map:{value:glowTex},scale:{value:600},nz:{value:NOISETEX},time:PTIME,lit:PLIT,...PG_U},
    vertexShader:PGPU?(additive
      ?'varying vec4 vC;varying vec2 vS;varying vec2 vA;'+PGPU_HEAD+'void main(){vS=vec2(0.0);vA=vec2(1.0,0.0);if(!pSim()){'+PGPU_DEAD+'return;}float k=pK,t1=1.0-k;vec3 c=aC.rgb;'+
        'if(aD.w>0.5)c=mix(c,aD.rgb,t1);else if(aE.x<0.5){float w=t1<0.15?0.55*(1.0-t1/0.15):0.0,dk=t1>0.65?1.0-0.3*(t1-0.65)/0.35:1.0;c=(c+(1.0-c)*w)*dk;}'+
        'vC=vec4(c*1.25,aC.a>0.0?min(1.0,t1*aC.a)*k:k);vS=vec2(aE.x,aE.y+aE.z*pT);vA=vec2(t1,aB.y);'+PGPU_MV+'gl_PointSize=pS*0.12*scale/-mv.z;gl_Position=projectionMatrix*mv;'+
        'if(aE.x>1.5&&aE.x<2.5){vec4 p2=projectionMatrix*modelViewMatrix*vec4(pP+pV*0.05,1.0);vec2 d=p2.xy/p2.w-gl_Position.xy/gl_Position.w;d.x*=projectionMatrix[1][1]/projectionMatrix[0][0];vS.y=atan(d.y,d.x);}}'
      :'varying vec4 vC;varying vec2 vA;'+PGPU_HEAD+'void main(){vA=vec2(1.0,0.0);if(!pSim()){'+PGPU_DEAD+'return;}float k=pK,t1=1.0-k;vec3 c=aC.rgb;if(aD.w>0.5)c=mix(c,aD.rgb,t1);'+
        'vC=vec4(c,min(1.0,k*1.5)*min(1.0,pH/(pS*0.05+0.01)));vA=vec2(t1,aB.y);'+PGPU_MV+'gl_PointSize=pS*0.12*scale/-mv.z;gl_Position=projectionMatrix*mv;}'):additive
      ?'attribute vec4 pcol;attribute float psize;attribute vec2 pshp;attribute vec3 pvel;attribute vec2 page;uniform float scale;varying vec4 vC;varying vec2 vS;varying vec2 vA;void main(){vC=pcol;vS=pshp;vA=page;vec4 mv=modelViewMatrix*vec4(position,1.0);vC.a*=smoothstep(1.2,5.0,-mv.z);gl_PointSize=psize*scale/-mv.z;gl_Position=projectionMatrix*mv;'+
        'if(pshp.x>1.5&&pshp.x<2.5){vec4 p2=projectionMatrix*modelViewMatrix*vec4(position+pvel*0.05,1.0);vec2 d=p2.xy/p2.w-gl_Position.xy/gl_Position.w;d.x*=projectionMatrix[1][1]/projectionMatrix[0][0];vS.y=atan(d.y,d.x);}}'
      :'attribute vec4 pcol;attribute float psize;attribute vec2 page;uniform float scale;varying vec4 vC;varying vec2 vA;void main(){vC=pcol;vA=page;vec4 mv=modelViewMatrix*vec4(position,1.0);vC.a*=smoothstep(1.2,5.0,-mv.z);gl_PointSize=psize*scale/-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:additive?'uniform sampler2D map;uniform sampler2D nz;varying vec4 vC;varying vec2 vS;varying vec2 vA;void main(){float a;int s=int(vS.x+0.5);'+
        // กลมเรือง: ขอบเป็น noise และกัดกร่อนตามอายุ (หายแบบแหว่ง ไม่ใช่จางทั้งเม็ด)
        'if(s==0){a=texture2D(map,gl_PointCoord).a;float n=texture2D(nz,gl_PointCoord*0.45+vA.y*vec2(7.31,3.17)).r;a*=smoothstep(vA.x*0.65-0.3,vA.x*0.65+0.05,n*a+0.1);}else{vec2 c=gl_PointCoord*2.0-1.0;c.y=-c.y;float cs=cos(vS.y),sn=sin(vS.y);vec2 r=vec2(cs*c.x+sn*c.y,-sn*c.x+cs*c.y);float d=length(r);'+
        'if(s==1){vec2 q=abs(r);a=max(0.0,1.0-q.x*7.0)*(1.0-q.y)+max(0.0,1.0-q.y*7.0)*(1.0-q.x)+(1.0-smoothstep(0.0,0.3,d));}'+
        'else if(s==2){a=max(0.0,1.0-abs(r.y)*6.0)*(1.0-smoothstep(0.55,1.0,abs(r.x)))*(1.15-0.3*r.x);}'+
        'else if(s==3){a=smoothstep(0.55,0.78,d)*(1.0-smoothstep(0.82,1.0,d))*1.4;}'+
        'else{vec2 q=abs(r);float h=max(q.x*0.866+q.y*0.5,q.y);a=(1.0-smoothstep(0.62,0.72,h))*(0.45+0.55*smoothstep(0.35,0.7,h))+max(0.0,1.0-abs(r.x)*12.0)*(1.0-smoothstep(0.6,0.7,h))*0.6;}'+
        'a=clamp(a,0.0,1.6);}float o=min(1.0,a)*vC.a;gl_FragColor=vec4(vC.rgb*a*vC.a*o,o*'+PGLOW_OCC.toFixed(2)+');}'
      // ควัน: 2 ชั้น noise (ก้อนใหญ่ + ริ้วเล็ก) ไหลช้า ๆ ตาม seed • ขอบแหว่ง • กัดกร่อนตามอายุ • แสงบนสว่าง/ล่างมืด
      :'uniform sampler2D nz;uniform float time;uniform vec3 lit;varying vec4 vC;varying vec2 vA;void main(){vec2 c=gl_PointCoord*2.0-1.0;float r=length(c);'+
        'float n=texture2D(nz,c*0.3+vec2(vA.y*5.7,vA.y*2.3-time*0.04)).r,n2=texture2D(nz,c*0.75+vec2(vA.y*3.1+time*0.03,vA.y*8.9)).r;'+
        'float d=(1.0-smoothstep(0.2,1.0,r+(n-0.5)*0.7))*(0.5+0.75*n2);if(d<=0.0)discard;'+
        'float a=d*smoothstep(vA.x*0.75-0.05,vA.x*0.75+0.3,d);'+
        'float sh=0.62+0.42*clamp(0.5-c.y*0.55,0.0,1.0)+(n2-0.5)*0.3;'+
        'gl_FragColor=vec4(vC.rgb*lit*sh,min(1.0,a*1.1)*vC.a*0.72);}',
    depthWrite:false,transparent:true,
    ...(additive?{blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor}:{blending:THREE.NormalBlending})
  });
  softify(mat,additive?0.35:0.8);
  const pts=new THREE.Points(geo,mat);pts.frustumCulled=false;pts.renderOrder=additive?3:2;fxScene.add(pts);
  const S={geo,pos,col,size,shp,vel,age,n:0};if(PGPU)pgpuGeo(geo,S);return S;
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
{const F=PSYS[2],pts=fxScene.children[fxScene.children.length-1];pts.renderOrder=4;
  if(!PGPU){F.vari=new Float32Array(PMAX);F.geo.setAttribute('pvar',new THREE.BufferAttribute(F.vari,1));}
  pts.material=new THREE.ShaderMaterial({
  uniforms:{map:{value:FLAME_STYLE===2?FLAMETEX_V2:FLAMETEX_V1},scale:{value:600},time:PTIME,nz:{value:NOISETEX},...PG_U,uFL:{value:['#fff6dc','#ffd56a','#ff9a2a','#f2561a','#a8240c','#3a1208','#1a0a06'].map(c=>new THREE.Color(c))},uFT:{value:[0,0.12,0.3,0.5,0.72,0.9,1]}},
  vertexShader:PGPU?'varying vec4 vC;varying float vV;uniform vec3 uFL[7];uniform float uFT[7];'+PGPU_HEAD+'void main(){vV=0.0;if(!pSim()){'+PGPU_DEAD+'return;}float k=pK,t=1.0-k;vec3 L=uFL[6];for(int i=0;i<6;i++){if(t<=uFT[i+1]){L=mix(uFL[i],uFL[i+1],(t-uFT[i])/(uFT[i+1]-uFT[i]));break;}}'+
    'vC=vec4(L*aC.rgb,min(1.0,t*16.0)*min(1.0,k*2.2)*(1.0-0.5*clamp((t-0.4)/0.5,0.0,1.0)));vV=floor(8.0*(1.0-clamp((t-0.22)/0.45,0.0,1.0))+0.5)+aB.y;'+PGPU_MV+'gl_PointSize=pS*0.12*(0.55+0.45*min(1.0,t*5.0))*(1.0-0.3*t*t)*scale/-mv.z;gl_Position=projectionMatrix*mv;}':'attribute vec4 pcol;attribute float psize;attribute float pvar;uniform float scale;varying vec4 vC;varying float vV;void main(){vC=pcol;vV=pvar;vec4 mv=modelViewMatrix*vec4(position,1.0);vC.a*=smoothstep(1.2,5.0,-mv.z);gl_PointSize=psize*scale/-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:FLAME_STYLE===3
    // ก้อนไฟ: ขอบเป็น noise ไหลขึ้น + แกนสว่าง • vV = seed (เศษ) + ระดับบวกแสง (จำนวนเต็ม 0-8) — ไฟใหม่บวกแสง ไฟเก่าทึบ (บังฉากหลัง)
    ?'uniform float time;uniform sampler2D nz;varying vec4 vC;varying float vV;'+
      'void main(){vec2 c=gl_PointCoord*2.0-1.0;float sd=fract(vV),ad=floor(vV)/8.0;float n=texture2D(nz,c*0.28+vec2(sd*7.31,sd*3.17+time*0.33)).r;'+
      'float r=length(vec2(c.x,c.y*0.9-0.06));float m=1.0-smoothstep(0.32,1.0,r+(n-0.5)*0.6);if(m<=0.0)discard;float core=1.0-smoothstep(0.0,0.62,r+(n-0.5)*0.35);'+
      'float a=m*vC.a;vec3 col=vC.rgb*(0.72+0.5*core);gl_FragColor=vec4(col*a,a*(1.0-ad*0.85));}'
    :FLAME_STYLE===2
    ?'uniform sampler2D map;varying vec4 vC;varying float vV;void main(){vec2 c=vec2(mod(vV,2.0),floor(vV/2.0));vec4 t=texture2D(map,vec2((c.x+gl_PointCoord.x)*0.5,1.0-(c.y+gl_PointCoord.y)*0.5));gl_FragColor=vec4(t.rgb*vC.rgb,t.a*vC.a);}'
    :'uniform sampler2D map;varying vec4 vC;varying float vV;void main(){vec4 t=texture2D(map,vec2(gl_PointCoord.x,gl_PointCoord.y));gl_FragColor=vec4(t.rgb*vC.rgb*1.05,t.a*vC.a);}',
  depthWrite:false,transparent:true,...(FLAME_STYLE===3?{blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor}:{blending:THREE.NormalBlending})});softify(pts.material,0.5);F.mat=pts.material;}
// สีไฟตามอายุ (ตาราง 64 ช่อง สีเชิงเส้น): ใหม่ = เหลืองขาว → เหลืองทอง → ส้ม → แดงส้ม → แดงเข้ม → ถ่านดำ
const FLAMELUT=(()=>{const st=[[0,'#fff6dc'],[0.12,'#ffd56a'],[0.3,'#ff9a2a'],[0.5,'#f2561a'],[0.72,'#a8240c'],[0.9,'#3a1208'],[1,'#1a0a06']].map(([t,c])=>[t,new THREE.Color(c)]),L=[];
  for(let i=0;i<64;i++){const t=i/63;let k=0;while(k<st.length-2&&st[k+1][0]<t)k++;const [t0,c0]=st[k],[t1,c1]=st[k+1],u=Math.min(1,Math.max(0,(t-t0)/(t1-t0)));L.push(c0.clone().lerp(c1,u));}return L;})();
// เปลวไฟ 1 ดวง (fl:true) — col = สีย้อม ('#ffffff' = สีเปลวตามภาพ) • o.fb:'-' = ไม่ใช้ภาพ flipbook (เปลวกลมแบบเดิม เช่น Ring of Embers ที่ผู้เล่นอนุมัติแล้ว)
const FLAMECOL=['#fff0b0','#ffd27a','#ffb347','#ff8a2a','#ff6a1a','#ff5a14'];
function flame(x,y,h,o){o=o||{};
  if(FLAME_STYLE===3){PARTS.push({x,y,h:h+0.1,vx:o.vx||0,vy:o.vy||0,vh:o.vh===undefined?rnd(2,4):o.vh,life:o.life||0.45,max:o.life||0.45,col:o.col||'#ffffff',size:(o.size||6)*0.78,g:o.g===undefined?-1.5:o.g,drag:o.drag===undefined?2:o.drag,grow:o.grow===undefined?0.5:o.grow,fl:true,sd:Math.random()*0.99,fb:o.fb});return;}
  if(FLAME_STYLE===0){PARTS.push({x,y,h:h+0.15,vx:o.vx||0,vy:o.vy||0,vh:o.vh===undefined?rnd(2,4):o.vh,life:o.life||0.45,max:o.life||0.45,col:(o.col&&o.col!=='#ffffff'&&o.col[1]!=='f'?o.col:FLAMECOL[(Math.random()*FLAMECOL.length)|0]),size:(o.size||6)*0.6,g:o.g===undefined?-1.5:o.g,drag:o.drag===undefined?2:o.drag,grow:o.grow===undefined?0.6:o.grow});return;}
  PARTS.push({x,y,h,vx:o.vx||0,vy:o.vy||0,vh:o.vh===undefined?rnd(2,4):o.vh,life:o.life||0.45,max:o.life||0.45,col:o.col||'#ffffff',size:o.size||6,g:o.g===undefined?-1.5:o.g,drag:o.drag===undefined?2:o.drag,grow:o.grow===undefined?(FLAME_STYLE===2?0:0.4):o.grow,fl:true,v:(Math.random()*4)|0});}
// A) flipbook ต่ออนุภาค (VFX.md §1.6 ข้อ A / §5.1): แต่ละเม็ดเล่นภาพตารางเฟรมจาก Blender ตามอายุของมัน
//    manifest "ptex": {"smoke":{"file":"vfx/tex_smoke.png","v":1,"cols":8,"rows":8}, "fire":{"file":"vfx/tex_fire.png","v":1,"cols":8,"rows":8,"add":true}}
//    โหลดเสร็จแล้ว: ควันทุกเม็ด → แผ่น smoke, เปลวไฟ (fl) → แผ่น fire อัตโนมัติ • อนุภาคใส่ fb:'ชื่อแผ่น' เลือกเองได้ • ยังไม่มี/โหลดไม่เสร็จ = แบบโค้ดเดิม
//    "cards":true = โหลดเป็นภาพเฉย ๆ (PFB[k].tex) ไม่สร้างระบบอนุภาค
//    ตัวเลือก: add (ไฟ: บวกแสงแบบ premultiplied) • occ (add: บังฉากหลังเท่าไร 0..1 ค่าเริ่ม 0.6 — ไฟจริงใช้ต่ำ ไม่งั้นปลายเปลวแดงทับฟ้าสว่างจะเป็นควันเทา) • span (เล่นแผ่นกี่รอบตลอดอายุ ค่าเริ่ม 1) • rand (1 = สุ่มเฟรมเริ่มต่อเม็ด) • rot (สุ่มมุมเอียง ±rad/2: ค่าเริ่ม ควัน 0.6 ไฟ 0 = ตั้งตรง) • spin (หมุนเพิ่มตลอดอายุ rad) • size (ตัวคูณขนาด)
const PFB={};
function ptexUse(name,tex,e){
  e=Object.assign({cols:8,rows:8,span:1,rand:0,rot:e&&e.add?0:0.6,spin:0,size:1},e||{});
  const geo=new THREE.BufferGeometry(),pos=PGPU?null:new Float32Array(PMAX*3),col=PGPU?null:new Float32Array(PMAX*4),size=PGPU?null:new Float32Array(PMAX),age=PGPU?null:new Float32Array(PMAX*2);
  if(!PGPU){geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('pcol',new THREE.BufferAttribute(col,4));geo.setAttribute('psize',new THREE.BufferAttribute(size,1));geo.setAttribute('page',new THREE.BufferAttribute(age,2));}
  const mat=new THREE.ShaderMaterial({
    uniforms:{map:{value:tex},grid:{value:new THREE.Vector2(e.cols,e.rows)},cell:{value:new THREE.Vector2(tex.image.width/e.cols,tex.image.height/e.rows)},fp:{value:new THREE.Vector4(e.span,e.rand?1:0,e.rot,e.spin)},scale:{value:600},lit:PLIT,time:PTIME,...PG_U},
    vertexShader:PGPU?'varying vec4 vC;varying vec2 vA;varying float vPs;'+PGPU_HEAD+'void main(){vA=vec2(1.0,0.0);vPs=1.0;if(!pSim()){'+PGPU_DEAD+'return;}float k=pK,t1=1.0-k;vec3 c=aC.rgb;if(aD.w>0.5)c=mix(c,aD.rgb,t1);float fl=aE.w;'+
      'vC=vec4(c,min(1.0,t1*6.0)*min(1.0,k*2.0)*(mod(fl,2.0)>0.5?min(1.0,pH/(pS*0.05+0.01)):1.0));vA=vec2(t1,aB.y);'+PGPU_MV+'gl_PointSize=pS*0.12*'+(+e.size).toFixed(4)+'*(fl>1.5?1.6:1.0)*scale/-mv.z;vPs=gl_PointSize;gl_Position=projectionMatrix*mv;}':'attribute vec4 pcol;attribute float psize;attribute vec2 page;uniform float scale;varying vec4 vC;varying vec2 vA;varying float vPs;void main(){vC=pcol;vA=page;vec4 mv=modelViewMatrix*vec4(position,1.0);vC.a*=smoothstep(1.2,5.0,-mv.z);gl_PointSize=psize*scale/-mv.z;vPs=gl_PointSize;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform sampler2D map;uniform vec2 grid,cell;uniform vec4 fp;uniform vec3 lit;varying vec4 vC;varying vec2 vA;varying float vPs;void main(){'+
      'float LOD=clamp(log2(cell.x/max(vPs,1.0)),0.0,3.0);'+   // mip สูงจะปนเฟรมข้าง ๆ (ลายจุด) → จำกัด LOD เอง
      
      'vec2 c=gl_PointCoord-0.5;float an=(vA.y-0.5)*fp.z+vA.x*fp.w,cs=cos(an),sn=sin(an);vec2 uv=vec2(cs*c.x-sn*c.y,sn*c.x+cs*c.y)+0.5;'+
      'if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0)discard;'+
      'float N=grid.x*grid.y,f=vA.x*fp.x*N*0.999+fp.y*floor(vA.y*N),f0=mod(floor(f),N),f1=mod(f0+1.0,N),u=fract(f);'+
      'vec2 c0=vec2(mod(f0,grid.x),floor(f0/grid.x)),c1=vec2(mod(f1,grid.x),floor(f1/grid.x));'+
      'vec4 t=mix(textureLod(map,vec2((c0.x+uv.x)/grid.x,1.0-(c0.y+uv.y)/grid.y),LOD),textureLod(map,vec2((c1.x+uv.x)/grid.x,1.0-(c1.y+uv.y)/grid.y),LOD),u);'+
      'float a=t.a*smoothstep(vA.x*0.6-0.1,vA.x*0.6+0.2,t.a)*vC.a;if(a<=0.002)discard;'+
      (e.add?'gl_FragColor=vec4(t.rgb*vC.rgb*a,a*'+(e.occ===undefined?0.6:e.occ).toFixed(2)+');}':'gl_FragColor=vec4(t.rgb*vC.rgb*lit,a);}'),
    depthWrite:false,transparent:true,
    ...(e.add?{blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor}:{blending:THREE.NormalBlending})});
  softify(mat,e.add?0.5:0.8);
  if(PFB[name]&&PFB[name].pts){fxScene.remove(PFB[name].pts);PFB[name].geo.dispose();}
  const pts=new THREE.Points(geo,mat);pts.frustumCulled=false;pts.renderOrder=e.add?4:2;fxScene.add(pts);
  if(screen==='game')try{warmCompile([fxScene]);}catch(er){}   // ภาพโหลดเสร็จกลางเกม: compile ล่วงหน้าแบบไม่บล็อก (ไม่ต้องรอเม็ดแรกโผล่แล้วค้าง)
  const R={geo,pos,col,size,age,pts,e,fb:true,n:0};if(PGPU)pgpuGeo(geo,R);return PFB[name]=R;
}
function ptexLoad(){modelManifest().then(m=>{const P=m.ptex||{};for(const k in P){if(PFB[k])continue;PFB[k]={loading:true};const e=P[k];
  new THREE.TextureLoader().load('assets/'+e.file+'?v='+(e.v||m.v||0),t=>{t.colorSpace=THREE.SRGBColorSpace;t.userData.keep=true;if(e.cards){PFB[k]={tex:t,e,cards:true};return;}ptexUse(k,t,e);},undefined,()=>{PFB[k]={fail:true};});}});}
const colCache={};
function col3(c){return colCache[c]||(colCache[c]=new THREE.Color(c));}
// C) ลมหมุนวน (curl noise): สนามความเร็วไม่มีจุดดูด/จุดพ่น ทำให้ควัน/ไฟ/ประกายลอย ม้วนไปด้วยกันเป็นเกลียว แทนการพุ่งตรง
//    ψ = sin(ax)cos(by) + ½sin(cy)cos(dx) (ไหลตามเวลา) • ความเร็ว = (∂ψ/∂y, −∂ψ/∂x) • ไม่ใช้กับเศษที่ตกตามแรงโน้มถ่วง (ประกายกระเด็น) หรือ nc:true
const CURL={q:0.03,smoke:42,fl:24,glow:16};
const CURL_V=[0,0];   // scratch: ใช้ซ้ำในลูปแทนสร้างอาร์เรย์ใหม่ทุกอนุภาค
function curlAt(x,y,T,out){const q=CURL.q,A=q*x+0.6*T,B=1.2*q*y-0.45*T,C=2.3*q*y+0.8*T+1.7,D=1.9*q*x-0.3*T,sC=Math.sin(C);
  out[0]=-Math.sin(A)*Math.sin(B)*1.2+0.5*Math.cos(C)*Math.cos(D)*2.3;out[1]=-(Math.cos(A)*Math.cos(B)-0.5*sC*Math.sin(D)*1.9);return out;}
// เขียนอนุภาคใหม่ลงช่อง: ไล่จากท้ายบัฟเฟอร์ลงต้น (ใหม่สุดวาดก่อน เหมือนลำดับแบบเดิมที่เดินจากท้าย PARTS)
function pgpuSpawn(p,T){
  if(p.h===undefined){p.h=1.2;p.vh=rnd(-1,3.5);}if(p.g===undefined)p.g=4;if(p.sd===undefined)p.sd=Math.random()*0.99;
  p.t0=T;if(!(p.life>0))return;
  const fbn=p.fb||(p.smoke?'smoke':p.fl?'fire':null),F=fbn&&PFB[fbn],S=F&&F.fb?F:PSYS[p.fl?2:p.smoke?1:0];
  if(--S.head<0){if(S.top>0)S.rg.push(0,S.top);S.head=PMAX-1;S.top=PMAX;S.low=0;}if(S.head<S.low)S.low=S.head;
  const a=S.a,j=S.head*PGPU_F,c=col3(p.col),m=p.max||p.life,x=p.x,y=p.y,cu=!p.nc&&(p.smoke||p.fl||p.g<=0.5)?(p.smoke?CURL.smoke:p.fl?CURL.fl:CURL.glow):0;
  a[j]=tx(x);a[j+1]=p.h;a[j+2]=tz(y);a[j+3]=GY(x,y);
  a[j+4]=(p.vx||0)*S3;a[j+5]=p.vh||0;a[j+6]=(p.vy||0)*S3;a[j+7]=p.drag||3;
  a[j+8]=p.g;a[j+9]=p.grow||0;a[j+10]=T;a[j+11]=p.life;
  a[j+12]=m;a[j+13]=p.sd;a[j+14]=p.size;a[j+15]=cu;
  a[j+16]=c.r;a[j+17]=c.g;a[j+18]=c.b;a[j+19]=p.fin||0;
  if(p.c2){const d=col3(p.c2);a[j+20]=d.r;a[j+21]=d.g;a[j+22]=d.b;a[j+23]=1;}else a[j+23]=0;
  a[j+24]=p.sh||0;a[j+25]=p.rot||0;a[j+26]=p.vr||0;a[j+27]=(p.smoke?1:0)+(p.fl?2:0);
  const e=T+p.life;if(e>S.die)S.die=e;}
let _pgF=0;
function updateParticlesG(dt){
  PTIME.value+=dt;
  if(typeof hemi!=='undefined'){const h=hemi.color,k=Math.min(1.15,Math.max(0.55,hemi.intensity*1.25));PLIT.value.setRGB((0.65+0.35*h.r)*k,(0.65+0.35*h.g)*k,(0.65+0.35*h.b)*k);}
  const T=PTIME.value,ALL=[...PSYS,...Object.values(PFB)];PG_U.uMapS.value.set(S3,MW/2,MH/2);PG_U.uCur.value.x=CURL.q;
  const cap=Math.min(PMAX*1.6,VFXB.cap);if(PARTS.length>cap)PARTS.splice(0,PARTS.length-cap);
  if(!PARTS.length)for(const S of ALL)if(S.a)S.die=0;   // เคลียร์จากข้างนอก (PARTS.length=0: จบเกม/สตูดิโอกรอเวลา)
  let i=PARTS.length;while(i>0&&PARTS[i-1].t0===undefined)i--;
  for(;i<PARTS.length;i++)pgpuSpawn(PARTS[i],T);
  // PARTS เหลือไว้นับจำนวน/เพดาน: ทิ้งเม็ดหมดอายุทุก 6 เฟรม (GPU ซ่อนเองตามอายุอยู่แล้ว)
  if(++_pgF%6===0){let w=0;for(let k=0;k<PARTS.length;k++){const p=PARTS[k];if(T-p.t0<p.life)PARTS[w++]=p;}PARTS.length=w;}
  for(const S of ALL){if(!S.a)continue;
    if(S.head<S.top)S.rg.push(S.head,S.top-S.head);S.top=S.head;
    if(S.rg.length){for(let k=0;k<S.rg.length;k+=2)S.ib.addUpdateRange(S.rg[k]*PGPU_F,S.rg[k+1]*PGPU_F);S.ib.needsUpdate=true;S.rg.length=0;}
    if(T>=S.die){if(S.low<PMAX){S.head=S.top=S.low=PMAX;S.geo.setDrawRange(0,0);}}else S.geo.setDrawRange(S.low,PMAX-S.low);}
}
function updateParticles(dt){
  if(PGPU)return updateParticlesG(dt);
  PSYS[0].n=PSYS[1].n=PSYS[2].n=0;for(const k in PFB)PFB[k].n=0;PTIME.value+=dt;
  if(typeof hemi!=='undefined'){const h=hemi.color,k=Math.min(1.15,Math.max(0.55,hemi.intensity*1.25));PLIT.value.setRGB((0.65+0.35*h.r)*k,(0.65+0.35*h.g)*k,(0.65+0.35*h.b)*k);}
  const T=PTIME.value,cf=(PTIME.fr=(PTIME.fr|0)+1)&1;   // cf: ม้วนควัน (curl) คำนวณสลับเฟรมละครึ่ง (ก้าว ×2) — ประหยัด sin/cos ครึ่งหนึ่งตอนอนุภาคเป็นพัน
  const cap=Math.min(PMAX*1.6,VFXB.cap);if(PARTS.length>cap)PARTS.splice(0,PARTS.length-cap);   // เพดานตามระดับกราฟิก (ตัดอันเก่าสุดก่อน)
  let dead=0;   // อนุภาคหมดอายุ: นับไว้แล้วบีบอาร์เรย์ทีเดียวท้ายลูป (splice ทีละตัว = ช้ามากตอนมีหลายพันตัว)
  for(let i=PARTS.length-1;i>=0;i--){
    const p=PARTS[i];p.life-=dt;
    if(p.life<=0){dead++;continue;}
    if(p.h===undefined){p.h=1.2;p.vh=rnd(-1,3.5);}
    if(p.g===undefined)p.g=4;
    const dr=Math.exp(-(p.drag||3)*dt);
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.h=Math.max(0.03,p.h+p.vh*dt);p.vh-=p.g*dt;p.vx*=dr;p.vy*=dr;
    if(p.grow)p.size*=1+p.grow*dt;
    if(p.sd===undefined)p.sd=Math.random()*0.99;
    const k=p.life/p.max;
    if(!p.nc&&(i&1)===cf&&(p.smoke||p.fl||p.g<=0.5)){const A=(p.smoke?CURL.smoke:p.fl?CURL.fl:CURL.glow)*(0.3+0.7*(1-k))*dt*2,v=curlAt(p.x+p.sd*97,p.y,T,CURL_V);p.x+=v[0]*A;p.y+=v[1]*A;}
    const fbn=p.fb||(p.smoke?'smoke':p.fl?'fire':null),F=fbn&&PFB[fbn],S=F&&F.fb?F:PSYS[p.fl?2:p.smoke?1:0];if(S.n>=PMAX)continue;
    if(p._c===undefined||p._cs!==p.col){p._cs=p.col;p._c=col3(p.col);}const c=p._c,j=S.n;   // จำสีไว้ที่ตัวอนุภาค (ไม่ต้องค้นตารางสีด้วยข้อความทุกเฟรม)
    if(S.age){S.age[j*2]=1-k;S.age[j*2+1]=p.sd;}
    S.pos[j*3]=tx(p.x);S.pos[j*3+1]=p.h+GY(p.x,p.y);S.pos[j*3+2]=tz(p.y);
    if(S.fb){let r=c.r,g=c.g,bb=c.b;if(p.c2){const c2=col3(p.c2),u=1-k;r+=(c2.r-r)*u;g+=(c2.g-g)*u;bb+=(c2.b-bb)*u;}   // สีจากภาพ × สีย้อม (ขาว = สีตามภาพ)
      S.col[j*4]=r;S.col[j*4+1]=g;S.col[j*4+2]=bb;S.col[j*4+3]=Math.min(1,(1-k)*6)*Math.min(1,k*2)*(p.smoke?Math.min(1,p.h/(p.size*0.05+0.01)):1);
      S.size[j]=p.size*0.12*S.e.size*(p.fl?1.6:1);S.n++;continue;}
    if(p.fl&&FLAME_STYLE===3){const t=1-k,L=FLAMELUT[Math.min(63,(t*63)|0)];S.col[j*4]=L.r*c.r;S.col[j*4+1]=L.g*c.g;S.col[j*4+2]=L.b*c.b;S.col[j*4+3]=Math.min(1,t*16)*Math.min(1,k*2.2)*(1-0.5*Math.min(1,Math.max(0,(t-0.4)/0.5)));
      S.vari[j]=Math.round(8*(1-Math.min(1,Math.max(0,(t-0.22)/0.45))))+p.sd;}
    else if(p.fl){const u=FLAME_STYLE===2?1-k:0;S.col[j*4]=c.r;S.col[j*4+1]=c.g*(1-0.45*u);S.col[j*4+2]=c.b*(1-0.75*u);S.col[j*4+3]=Math.min(1,(1-k)*7)*Math.min(1,k*1.8);S.vari[j]=p.v|0;}
    else if(p.smoke){let r=c.r,g=c.g,bb=c.b;if(p.c2){const c2=col3(p.c2),u=1-k;r+=(c2.r-r)*u;g+=(c2.g-g)*u;bb+=(c2.b-bb)*u;}S.col[j*4]=r;S.col[j*4+1]=g;S.col[j*4+2]=bb;S.col[j*4+3]=Math.min(1,k*1.5)*Math.min(1,p.h/(p.size*0.05+0.01));}   // ควันจางลงตอนแตะพื้น (soft particle แบบถูก: ไม่เห็นรอยตัดกับพื้น)
    else{const b=1.25;let r=c.r,g=c.g,bb=c.b;if(p.c2){const c2=col3(p.c2),u=1-k;r+=(c2.r-r)*u;g+=(c2.g-g)*u;bb+=(c2.b-bb)*u;}   // c2 = สีตอนท้ายอายุ (ไล่สี)
      else if(!p.sh){const t=1-k,w=t<0.15?0.55*(1-t/0.15):0,dk=t>0.65?1-0.3*(t-0.65)/0.35:1;r=(r+(1-r)*w)*dk;g=(g+(1-g)*w)*dk;bb=(bb+(1-bb)*w)*dk;}   // B) ไม่มี c2: เกิดร้อนขาว → สีหลัก → เข้มลงก่อนหาย (VFX.md §1.3)
      S.col[j*4]=r*b;S.col[j*4+1]=g*b;S.col[j*4+2]=bb*b;S.col[j*4+3]=p.fin?Math.min(1,(1-k)*p.fin)*k:k;
      if(p.sh){if(p.vr)p.rot=(p.rot||0)+p.vr*dt;S.shp[j*2]=p.sh;S.shp[j*2+1]=p.rot||0;if(p.sh===2){S.vel[j*3]=p.vx*S3;S.vel[j*3+1]=p.vh;S.vel[j*3+2]=p.vy*S3;}}else S.shp[j*2]=0;}
    S.size[j]=p.size*0.12*(p.fl&&FLAME_STYLE===2?0.45+0.55*k:p.fl&&FLAME_STYLE===3?(0.55+0.45*Math.min(1,(1-k)*5))*(1-0.3*(1-k)*(1-k)):1);S.n++;
  }
  if(dead){let w=0;for(let i=0;i<PARTS.length;i++){const p=PARTS[i];if(p.life>0)PARTS[w++]=p;}PARTS.length=w;}
  // ส่งขึ้นการ์ดจอเฉพาะช่วงที่ใช้จริง (0..n) — เดิมส่งทั้งบัฟเฟอร์ 5,000 ช่องทุกระบบทุกเฟรม แม้ไม่มีอนุภาคเลย (หลาย MB/เฟรม)
  for(const S of [...PSYS,...Object.values(PFB)]){if(!S.geo)continue;S.geo.setDrawRange(0,S.n);if(!S.n)continue;
    const a=S.geo.attributes;for(const k in a){const A=a[k];A.clearUpdateRanges();A.addUpdateRange(0,S.n*A.itemSize);A.needsUpdate=true;}}
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
// รูปทรง (ring/ringv/arc/dome/warn/warnr/rune/decal) วาดรวมเป็น InstancedMesh ก้อนเดียวต่อแบบ (ผู้ใช้ 2026-11-05: "สู้นัวๆ เฟรมดรอป", OPTIMIZE §I)
//   เดิมสร้าง Mesh + วัสดุใหม่ทุกชิ้น → ตอนสู้นัวมีวงแหวน/รอยไหม้ค้างพร้อมกันหลายร้อยชิ้น = หลายร้อย draw call
//   additive: สี×ความทึบ ให้ผลเท่ากับ opacity เดิม (src×alpha + dst) → พับความทึบเข้าสีของแต่ละชิ้น ภาพเหมือนเดิม
//   decal (blending ปกติ): ความทึบต่อชิ้นเป็น attribute iOp คูณ alpha
//   ลำดับวาด: เดิมเรียงตามระยะทีละชิ้น → ตอนนี้ decal วาดก่อนของโปร่งใสอื่น (renderOrder -1), ของเรืองแสงวาดหลัง (3) — ต่างจากเดิมได้เฉพาะตอนซ้อนกับของโปร่งใสแบบปกติ
//   flashSprite ยังเป็น Sprite ทีละชิ้น (o.m)
const SHB={},_sbM=new THREE.Matrix4(),_sbQ=new THREE.Quaternion(),_sbE=new THREE.Euler(),_sbS=new THREE.Vector3(),_sbC=new THREE.Color();
const SHB_GEO={ring:ringGeo,ringv:ringVGeo,arc:arcGeo,dome:domeGeo,full:fullGeo,warn:discGeo,warnr:ringGeo,rune:discGeo,decal:discGeo};
let _sbDecalMat=null;
function shbMat(key){
  if(key==='decal'){   // รอยไหม้: blending ปกติ → ความทึบต่อชิ้นต้องเป็น alpha จริง (attribute iOp) ไม่ใช่พับเข้าสี
    if(_sbDecalMat)return _sbDecalMat;
    const mat=new THREE.MeshBasicMaterial({map:decalTex,color:'#ffffff',transparent:true,depthWrite:false});
    mat.onBeforeCompile=sh=>{sh.vertexShader='attribute float iOp;\nvarying float vOp;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvOp=iOp;');
      sh.fragmentShader='varying float vOp;\n'+sh.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\ndiffuseColor.a*=vOp;');};
    mat.customProgramCacheKey=()=>'shbDecal';return _sbDecalMat=mat;}
  return key==='rune'?new THREE.MeshBasicMaterial({map:runeTex,color:'#ffffff',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})
    :new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
}
// สร้าง/ขยายก้อน (ขยายก่อนเริ่มเขียนของเฟรมนั้นเสมอ — ดู updateShapes)
function shbMake(key,cap){
  const old=SHB[key],decal=key==='decal';
  const geo=decal?SHB_GEO[key].clone():SHB_GEO[key];
  const m=new THREE.InstancedMesh(geo,old?old.m.material:shbMat(key),cap);m.count=0;m.frustumCulled=false;m.visible=false;
  m.renderOrder=decal?-1:3;   // รอยบนพื้นวาดก่อนของโปร่งใสอื่น • ของเรืองแสงวาดหลัง
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  if(decal){const A=new THREE.InstancedBufferAttribute(new Float32Array(cap),1);A.setUsage(THREE.DynamicDrawUsage);geo.setAttribute('iOp',A);m.userData.op=A;}
  else{m.setColorAt(0,_sbC.setRGB(1,1,1));m.instanceColor.setUsage(THREE.DynamicDrawUsage);}
  if(old){scene.remove(old.m);if(decal)old.m.geometry.dispose();old.m.dispose();}
  scene.add(m);return SHB[key]={m,cap,n:0};
}
for(const k in SHB_GEO)shbMake(k,64);   // สร้างไว้ตั้งแต่ต้น → warm-up ของห้องรอ compile เชดเดอร์ให้ (ไม่สะดุดตอนวงแรก)
function spawnShape(s){
  const fixed=s.k==='decal'||s.k==='rune'||s.k==='warn'||s.k==='warnr';
  const o={life:s.life,max:s.life,s0:s.s0!==undefined?s.s0:(fixed?s.s1:0.1),s1:s.s1,op:s.op!==undefined?s.op:0.9,delay:s.delay||0,spin:s.k==='rune',warn:s.k==='warn'||s.k==='warnr'};
  if(s.k==='decal')o.op=s.op||0.5;
  else o.col=hdr(s.col,1.8);
  const y=(s.h!==undefined?s.h:(s.k==='decal'?0.025:0.06))+GY(s.x,s.y);
  o.b=s.k==='dome'&&s.full?'full':s.k;o.pos=new THREE.Vector3(tx(s.x),o.warn?0.07:y,tz(s.y));o.ry=s.k==='arc'?-s.a:0;
  if(s.k==='ringv'){const d=new THREE.Object3D();d.position.copy(o.pos);d.lookAt(cam.position);o.q=d.quaternion.clone();}
  SHAPES.push(o);
}
function updateShapes(dt){
  while(SHAPES_Q.length)spawnShape(SHAPES_Q.shift());
  for(const k in SHB)SHB[k].n=0;
  for(const o of SHAPES)if(o.b)SHB[o.b].n++;   // นับก่อน → ขยายก้อนที่ไม่พอ (ห้ามขยายกลางลูปเขียน ข้อมูลที่เขียนแล้วจะหาย)
  for(const k in SHB){const B=SHB[k];if(B.n>B.cap){let c=B.cap;while(c<B.n)c*=2;shbMake(k,c);}SHB[k].n=0;}
  for(let i=SHAPES.length-1;i>=0;i--){
    const o=SHAPES[i];
    if(o.delay>0){o.delay-=dt;if(o.delay<=0&&o.m)o.m.visible=true;continue;}
    o.life-=dt;
    if(o.life<=0){if(o.m){scene.remove(o.m);o.m.material.dispose();}SHAPES.splice(i,1);continue;}
    const t=1-o.life/o.max,e=1-Math.pow(1-t,3),s=o.s0+(o.s1-o.s0)*e;
    let op=o.op*Math.min(1,o.life/o.max*1.4);
    if(o.spin)o.ry=(o.ry||0)+dt*1.5;
    if(o.warn)op=0.1+0.4*t+0.1*Math.sin(o.life*30);
    if(o.m){o.m.scale.set(s,s,s);o.m.material.opacity=op;continue;}   // flashSprite
    const B=SHB[o.b];if(!B.m.parent)scene.add(B.m);
    if(o.q)_sbQ.copy(o.q);else _sbQ.setFromEuler(_sbE.set(0,o.ry,0));
    _sbM.compose(o.pos,_sbQ,_sbS.set(s,s,s));B.m.setMatrixAt(B.n,_sbM);
    if(B.m.userData.op)B.m.userData.op.array[B.n]=op;else B.m.setColorAt(B.n,_sbC.copy(o.col).multiplyScalar(Math.max(0,op)));
    B.n++;
  }
  for(const k in SHB){const B=SHB[k],m=B.m;m.count=B.n;m.visible=B.n>0;if(!B.n)continue;
    m.instanceMatrix.clearUpdateRanges();m.instanceMatrix.addUpdateRange(0,B.n*16);m.instanceMatrix.needsUpdate=true;
    const C=m.instanceColor||m.userData.op,w=m.instanceColor?3:1;C.clearUpdateRanges();C.addUpdateRange(0,B.n*w);C.needsUpdate=true;}
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
