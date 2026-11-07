// =====================================================================
//  โลก 3D (Three.js + Bloom) — 1 หน่วย 3D = 20 พิกเซลของระบบเกม
// =====================================================================
const S3=1/20,tx=x=>(x-MW/2)*S3,tz=y=>(y-MH/2)*S3;
// ความสูงพื้นจริงในโลก 3D (แผนที่จากไฟล์มีเนิน) — ความสูงจากเกม (z/h) + GY(x,y) = ตำแหน่ง y ในฉาก • TW = แบบพิกัด 3D
// ความสูงพื้นที่ใช้วาดภาพ (หน่วย 3D): แมพไฟล์ = ผิวดิน • แมพเมือง = บล็อก (ทางเท้า/ลาน) ยกสูงจากถนน 0.14 ม. — ไม่งั้นกรอบสกิล/เอฟเฟกต์บนพื้นจมใต้ทางเท้า (ผู้ใช้ 2026-10-29)
const CITY_KERB=0.14;
function cityKerb(x,y){const Z=MAPID==='city'&&MAPS.city&&MAPS.city.zones;if(!Z)return 0;for(const z of Z)if(x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.d)return CITY_KERB;return 0;}
const GY=(x,y)=>TERR?terrT(x,y):cityKerb(x,y),TW=(X,Z)=>TERR?terrT(X*20+MW/2,Z*20+MH/2):cityKerb(X*20+MW/2,Z*20+MH/2);
const hdr=(c,k)=>new THREE.Color(c).multiplyScalar(k);
// antialias ปิดไว้: ภาพผ่าน EffectComposer (render target) อยู่แล้ว MSAA ของ canvas จึงไม่ช่วยอะไร แค่กินแรง
const gl=new THREE.WebGLRenderer({canvas:document.getElementById('gl'),antialias:false,powerPreference:'high-performance'});
// ตรวจ error ของ shader ทุกตัวที่ compile = บังคับ CPU รอการ์ดจอ compile เสร็จ (getProgramInfoLog ~3% ของเฟรมตอนสู้กัน) → ปิด ยกเว้น ?debug
gl.debug.checkShaderErrors=/[?&]debug/.test(location.search);
gl.setPixelRatio(Math.min(1,window.devicePixelRatio||1));
gl.useLegacyLights=true;
gl.shadowMap.enabled=true;gl.shadowMap.type=THREE.PCFSoftShadowMap; // ขอบเงานุ่ม (เงาตามผู้เล่น shadowFollow ทำให้คมพอจะนุ่มได้)
gl.shadowMap.autoUpdate=false; // อัปเดตเงาเองใน render() (โหมดอัตโนมัติ = ทุก 2 เฟรม)
gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.1;
// ===== เงานุ่มแบบ PCSS (contact-hardening): ใกล้จุดสัมผัสคม ไกลจากวัตถุที่บังยิ่งนุ่ม — แทน PCF_SOFT ที่ขอบเงาคมเท่ากันหมด =====
// เปิดด้วยค่า shadow.radius ของแสงหลักเท่านั้น: radius >= 10 → PCSS โดย K = radius-10 (shadowFollow ตั้งให้ ตามขนาดกล้องเงา) • radius อื่น (1 = ค่าเดิมของ three) = วิธีเดิมทุกอย่าง
// ค่าใช้จ่าย: ค้นหาตัวบัง 12 จุด + กรอง 16 จุดต่อพิกเซลที่อยู่ในกล้องเงา (เฉพาะกราฟิกสูง) • ต้องแก้ chunk ก่อน shader ใดถูก compile • ปิดด้วย ?nopcss
const PCSS={on:!/[?&]nopcss\b/.test(location.search),size:0.02};
THREE.ShaderChunk.shadowmap_pars_fragment=THREE.ShaderChunk.shadowmap_pars_fragment
  .replace('float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {',
`float wdPcss( sampler2D sm, vec2 sz, vec3 sc, float K ) {
	float zR = sc.z;
	float ng = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
	float ang = 6.2831853 * ng;
	vec2 ts = 1.0 / sz;
	float sr = clamp( K * 0.02, 0.0015, 0.008 );
	float bs = 0.0; float bn = 0.0;
	for ( int i = 0; i < 12; i ++ ) {
		float r = sqrt( ( float( i ) + 0.5 ) / 12.0 ); float a = ang + float( i ) * 2.39996323;
		float d = unpackRGBAToDepth( texture2D( sm, sc.xy + vec2( cos( a ), sin( a ) ) * r * sr ) );
		if ( d < zR ) { bs += d; bn += 1.0; }
	}
	if ( bn < 0.5 ) return 1.0;
	float pen = clamp( ( zR - bs / bn ) * K, 1.2 * ts.x, 0.012 );
	float lit = 0.0;
	for ( int i = 0; i < 16; i ++ ) {
		float r = sqrt( ( float( i ) + 0.5 ) / 16.0 ); float a = ang * 1.7 + float( i ) * 2.39996323;
		lit += step( zR, unpackRGBAToDepth( texture2D( sm, sc.xy + vec2( cos( a ), sin( a ) ) * r * pen ) ) );
	}
	return lit / 16.0;
}
float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {`)
  .replace('#elif defined( SHADOWMAP_TYPE_PCF_SOFT )','#elif defined( SHADOWMAP_TYPE_PCF_SOFT )\n\t\t\tif ( shadowRadius >= 9.99 ) {\n\t\t\t\tshadow = wdPcss( shadowMap, shadowMapSize, shadowCoord.xyz, shadowRadius - 10.0 );\n\t\t\t} else {')
  .replace('#elif defined( SHADOWMAP_TYPE_VSM )','\t\t\t}\n\t\t#elif defined( SHADOWMAP_TYPE_VSM )');
const scene=new THREE.Scene();
scene.fog=new THREE.Fog('#151a33',50,170);
const cam=new THREE.PerspectiveCamera(62,1,0.25,700);   // near 0.1 → 0.25: ความละเอียดความลึกดีขึ้น ~2.5 เท่า (ผิวที่ห่างกันน้อย เช่น พื้นในบล็อก/ทางเท้า ไม่กระพริบไกล ๆ)
const composer=new EffectComposer(gl);
// ===== ท่อภาพ (post-processing): ฉาก → ชั้นเอฟเฟกต์นุ่ม (FXPass) → แสงฟุ้ง → โทนสี/เอฟเฟกต์ทั้งจอ (GradePass) → จอ =====
// ความลึกของฉากเก็บเป็นภาพ (depthTexture) ให้อนุภาค/หมอก/หางแสงอ่านได้ → จางลงนุ่ม ๆ ตรงที่แตะพื้น/กำแพง (soft particles)
for(const rt of [composer.renderTarget1,composer.renderTarget2]){rt.depthTexture=new THREE.DepthTexture(rt.width,rt.height);rt.depthTexture.type=THREE.UnsignedIntType;}
const rpass=new RenderPass(scene,cam);composer.addPass(rpass);
// ฉากแยกของเอฟเฟกต์โปร่งใส (อนุภาค หมอก หางแสง) — วาดหลังฉากหลัก
const fxScene=new THREE.Scene();
// ค่ากลางของ soft particles (shader ของอนุภาคอ่านจากที่นี่) • on=0 → วาดแบบเดิม (ทดสอบความลึกปกติ ไม่นุ่ม)
const SOFTU={uDepth:{value:null},uRes:{value:new THREE.Vector2(1,1)},uNear:{value:0.1},uFar:{value:700},uSoftOn:{value:1}};
const SOFT_GLSL='uniform sampler2D uDepth;uniform vec2 uRes;uniform float uNear;uniform float uFar;uniform float uSoftOn;varying float vVZ;'+
  'float softK(float range){if(uSoftOn<0.5)return 1.0;float d=texture2D(uDepth,gl_FragCoord.xy/uRes).x;float sz=(uNear*uFar)/(uFar-d*(uFar-uNear));float k=(sz-vVZ)/range;if(k<0.0)discard;return clamp(k,0.0,1.0);}';
const FXMATS=new Set();   // วัสดุในชั้นเอฟเฟกต์ — สลับ depthTest ตามโหมดนุ่ม/ไม่นุ่ม
function fxMat(m){m.uniforms=Object.assign(m.uniforms||{},SOFTU);m.depthTest=!SOFTU.uSoftOn.value;FXMATS.add(m);m.userData.keep=true;return m;}
// ใส่ soft particles ให้ ShaderMaterial ที่มี "vec4 mv=modelViewMatrix*..." ใน vertex shader (อนุภาค) — range = ระยะจางเป็นหน่วย 3D
function softify(m,range){
  m.vertexShader='varying float vVZ;'+m.vertexShader.replace('vec4 mv=modelViewMatrix*vec4(position,1.0);','vec4 mv=modelViewMatrix*vec4(position,1.0);vVZ=-mv.z;').replace('vec4 mv=modelViewMatrix*vec4(pP,1.0);','vec4 mv=modelViewMatrix*vec4(pP,1.0);vVZ=-mv.z;');
  const f=m.fragmentShader,i=f.lastIndexOf('}');m.fragmentShader=SOFT_GLSL+f.slice(0,i)+'gl_FragColor*=softK('+range.toFixed(2)+');}';
  return fxMat(m);}
// ภาพฉากหลัก (ก่อนวาดชั้นเอฟเฟกต์) ให้ shader อากาศร้อนบิดเบี้ยว (heat haze, js/42) อ่าน — มีค่าเฉพาะตอนเปิด soft
const HAZE_U={uScene:{value:null}};
// เงาตามซอกมุม (SSAO) — คำนวณจากภาพความลึกอย่างเดียว (ไม่ต้องวาดฉากซ้ำ) ที่ครึ่งความละเอียด ลงแผ่น aoRT
// แล้วตอนก๊อปภาพฉากใน FXPass เบลอ 4×4 (ไม่เบลอข้ามขอบวัตถุ) คูณเข้าภาพ → อนุภาค/เอฟเฟกต์ที่วาดทีหลังไม่โดนทำให้มืด
// uAO = ความเข้ม (0 = ปิด) • uR = รัศมีที่มองหาซอก (หน่วย 3D) • uFade = ระยะที่เริ่มจาง/หายหมด (ไกลกว่านั้นหมอกบังอยู่แล้ว)
const AOU={uAO:{value:0},uR:{value:1.4},uFade:{value:new THREE.Vector2(35,70)},uTan:{value:new THREE.Vector2(1,1)},tAO:{value:null},uAORes:{value:new THREE.Vector2(1,1)},
  uRim:{value:0},uRimCol:{value:new THREE.Color()},uHaze:{value:0},uHazeCol:{value:new THREE.Color()},uHazeD:{value:new THREE.Vector3(0,0.06,22)},uCamY:{value:new THREE.Vector4()},
  uRay:{value:0},uSunUV:{value:new THREE.Vector2(0.5,0.5)},uSunVis:{value:0},uRayCol:{value:new THREE.Color()}};   // ลำแสง (god rays): js/74-look.js
// ภาพสวยขึ้น (ทำในขั้นก๊อปภาพของ FXPass เลย แทบไม่กินแรงเพิ่ม • ทำงานเมื่อเปิด soft = ไม่ใช่โหมดประหยัด):
//  rim = ไฟขอบ: ขอบวัตถุใกล้ ๆ ที่ข้างหลังไกลกว่ามาก (เช่นตัวละครบนพื้น) สว่างขึ้นเหมือนโดนแสงจันทร์/แดดจากด้านหลัง → ตัวละครเด่น (สีตามแสงหลัก) • rimZ = ไกลสุดที่มีไฟขอบ
//  haze = หมอกบาง ๆ ตามระยะ (ของไกลจางเข้าหาสีหมอกของแผนที่ → ฉากมีมิติ) • hazeK = ความหนา (เทียบกับ fog.far ของแผนที่) • aa = ลบขอบหยัก (FXAA)
const GFX={rim:0.17,rimZ:22,haze:0.55,hazeK:1.4,hazeH:0.06,aa:true};   // haze/hazeK/hazeH ถูกทับด้วยพรีเซ็ต Look (js/74)
const AO_ON={strength:2.2};
const AO_HEAD='uniform sampler2D tD;uniform vec2 uRes;uniform float uNear;uniform float uFar;uniform float uAO;uniform float uR;uniform vec2 uFade;uniform vec2 uTan;varying vec2 vUv;'+
  'float lz(vec2 uv){float d=texture2D(tD,uv).x;return (uNear*uFar)/(uFar-d*(uFar-uNear));}'+
  'vec3 vp(vec2 uv){float z=lz(uv);return vec3((uv*2.0-1.0)*uTan*z,-z);}';
// ขั้น 1: ค่า AO (1 = สว่าง, 0 = มืด) • มุมสุ่มตามตาราง 4×4 พิกเซล → เบลอ 4×4 แล้วเรียบพอดี
const AO_CALC=AO_HEAD+'void main(){float ao=1.0;'+
  'if(texture2D(tD,vUv).x<0.99999){vec3 P=vp(vUv);float z=-P.z;'+
    'if(z<uFade.y){vec2 px=1.0/uRes;'+
      'vec3 pr=vp(vUv+vec2(px.x,0.0))-P,pl=P-vp(vUv-vec2(px.x,0.0)),pu=vp(vUv+vec2(0.0,px.y))-P,pd=P-vp(vUv-vec2(0.0,px.y));'+
      'vec3 N=normalize(cross(abs(pr.z)<abs(pl.z)?pr:pl,abs(pu.z)<abs(pd.z)?pu:pd));'+
      'vec2 rad=min(vec2(uR)/(2.0*uTan*z),vec2(0.15));'+
      'vec2 q=mod(floor(gl_FragCoord.xy),4.0);float ang=6.2832*(q.x*4.0+q.y+0.5)/16.0;float j=fract((q.x+q.y*4.0)*0.618);'+
      'float occ=0.0;'+
      'for(int i=0;i<12;i++){float f=(float(i)+j)/12.0;float a=ang+float(i)*2.39996;'+
        'vec3 v=vp(vUv+vec2(cos(a),sin(a))*rad*sqrt(f))-P;float L=length(v);'+
        'occ+=max(0.0,dot(N,v)/(L+1e-4)-0.2)*(1.0-smoothstep(uR*0.5,uR*1.5,L));}'+
      'ao=clamp(1.0-uAO*occ/12.0,0.0,1.0);ao=mix(ao,1.0,smoothstep(uFade.x,uFade.y,z));}}'+
  'gl_FragColor=vec4(ao,ao,ao,1.0);}';
// ขั้น 2: ก๊อปภาพฉาก × AO ที่เบลอแล้ว (ถ่วงน้ำหนักตามความลึกใกล้เคียง กันเงาเลอะข้ามขอบ)
const AO_COPY=AO_HEAD+'uniform sampler2D t;uniform sampler2D tAO;uniform vec2 uAORes;uniform float uRim;uniform vec3 uRimCol;uniform float uHaze;uniform vec3 uHazeCol;uniform vec3 uHazeD;uniform vec4 uCamY;uniform float uRay;uniform vec2 uSunUV;uniform float uSunVis;uniform vec3 uRayCol;'+
  'void main(){vec4 c=texture2D(t,vUv);'+
  'if(texture2D(tD,vUv).x<0.99999){float z=lz(vUv);'+   // ท้องฟ้าไม่ต้องทำ
  'if(uAO>0.001){float s=0.0,w=0.0;vec2 px=1.0/uAORes;'+
    'for(int x=0;x<4;x++)for(int y=0;y<4;y++){vec2 uv=vUv+(vec2(float(x),float(y))-1.5)*px;'+
      'float k=1.0/(1.0+abs(lz(uv)-z)*8.0/z);s+=texture2D(tAO,uv).r*k;w+=k;}'+
    'c.rgb*=s/max(w,1e-4);}'+
  // ไฟขอบ: มองหาพิกเซลข้างบน/ข้าง ๆ (5 ทิศ × 2 ระยะ) ที่ลึกกว่าเรามาก → เราอยู่ที่ขอบ (ทิศบนแรงสุด = แสงจากด้านหลังบน)
  'if(uRim>0.001&&z<uHazeD.z){vec2 px=1.0/uRes;float r=0.0;'+
    'for(int i=0;i<5;i++){float a=float(i)*0.7854;vec2 o=vec2(cos(a),sin(a));float wt=0.45+0.55*o.y;'+
      'for(int j=1;j<3;j++){float d=lz(vUv+o*px*1.6*float(j))-z;r=max(r,wt*(j==1?1.0:0.55)*smoothstep(0.12*z+0.25,0.4*z+0.8,d));}}'+
    'c.rgb+=uRimCol*r*smoothstep(1.5,4.5,z)*(1.0-smoothstep(uHazeD.z*0.55,uHazeD.z,z));}'+
  // หมอกตามระยะ (จางเข้าหาสีหมอกแผนที่) • ที่ต่ำหนากว่าที่สูงนิดหน่อย
  'if(uHaze>0.001){vec3 P=vec3((vUv*2.0-1.0)*uTan*z,-z);float wy=dot(uCamY.xyz,P)+uCamY.w;'+
    'float f=(1.0-exp(-length(P)*uHazeD.x))*(0.65+0.35*exp(-max(wy,0.0)*uHazeD.y));c.rgb=mix(c.rgb,uHazeCol,f*uHaze);}}'+
  // ลำแสง (god rays): เดินจากพิกเซลนี้ไปหาดวงจันทร์/อาทิตย์บนจอ 10 ก้าว นับก้าวที่เห็นท้องฟ้า → ผ่านช่องใบไม้/ช่องกำแพงยิ่งเห็นเป็นลำ
  'if(uRay>0.001&&uSunVis>0.001){vec2 d=uSunUV-vUv;float L=length(d);float fall=pow(max(0.0,1.0-L/1.25),2.5);'+
    'if(fall>0.002){float ng=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(0.06711056,0.00583715))));vec2 st=d*0.6/10.0;float acc=0.0;'+
      'for(int i=0;i<10;i++){vec2 uv=vUv+st*(float(i)+ng);vec2 b=step(vec2(0.0),uv)*step(uv,vec2(1.0));acc+=step(0.99999,texture2D(tD,uv).x)*b.x*b.y;}'+
      'float sky=step(0.99999,texture2D(tD,vUv).x);c.rgb+=uRayCol*(uRay*uSunVis*fall*acc*0.1*mix(1.0,0.3,sky));}}'+
  'c.a=1.0;gl_FragColor=c;}';
// ===== TAA (ลบขอบหยักแบบสะสมหลายเฟรม) — กราฟิกสูงเท่านั้น • ปิดด้วย ?notaa =====
// ขั้นตอน: taaBegin (js/37) สั่นกล้อง (Halton 8 ค่า ต่ำกว่าพิกเซล) ก่อนวาดฉาก → ใน FXPass ผสมภาพฉากกับประวัติ (ย้อนตำแหน่งด้วยการขยับของกล้อง + ความลึก) แล้วเลิกสั่นก่อนวาดเอฟเฟกต์ (อนุภาค/เอฟเฟกต์ไม่สั่น)
// กันภาพเงา (ghost): ตรึงประวัติให้อยู่ในช่วงสีของพิกเซลรอบข้าง 3×3 + เทียบความลึกประวัติ (เก็บใน alpha) → วัตถุที่ขยับ/พื้นที่เพิ่งเปิดเห็น = ใช้ภาพใหม่
const TAA={on:!/[?&]notaa\b/.test(location.search),alpha:0.1,sharp:0.25,jit:false,applied:false,n:0,valid:0,i:0,rt:[null,null],w:0,h:0,quad:null,cur:new THREE.Matrix4(),prev:new THREE.Matrix4(),inv:new THREE.Matrix4()};
const TAA_FRAG='uniform sampler2D tCur;uniform sampler2D tHist;uniform sampler2D tD;uniform mat4 uInvVP;uniform mat4 uPrevVP;uniform vec2 uPx;uniform float uAlpha;uniform float uSharp;uniform float uValid;uniform float uNear;uniform float uFar;varying vec2 vUv;'+
  'void main(){vec3 c=texture2D(tCur,vUv).rgb;float dp=texture2D(tD,vUv).x;'+
  'float z=dp>=0.99999?uFar:(uNear*uFar)/(uFar-dp*(uFar-uNear));'+
  'vec3 mn=c,mx=c,sm=c;'+
  'for(int i=0;i<8;i++){float a=float(i)*0.7853982;vec2 o=vec2(cos(a),sin(a));o=o/max(abs(o.x),abs(o.y));vec3 n=texture2D(tCur,vUv+o*uPx).rgb;mn=min(mn,n);mx=max(mx,n);sm+=n;}'+
  'vec4 w=uInvVP*vec4(vUv*2.0-1.0,dp*2.0-1.0,1.0);w/=w.w;vec4 pc=uPrevVP*w;vec2 pu=pc.xy/pc.w*0.5+0.5;'+
  'vec4 h=texture2D(tHist,pu);'+
  'float ok=uValid*step(0.0,pu.x)*step(pu.x,1.0)*step(0.0,pu.y)*step(pu.y,1.0)*step(0.0,pc.w);'+
  'float rej=dp>=0.99999?0.0:step(0.05*pc.w+0.25,abs(h.a-pc.w));'+   // ความลึกประวัติไม่ตรง = วัตถุขยับ/เพิ่งเปิดเห็น
  'vec3 hc=clamp(h.rgb,mn,mx);'+
  'float ld=abs(dot(hc-c,vec3(0.299,0.587,0.114)))/(dot(c,vec3(0.299,0.587,0.114))+0.25);'+
  'float a=max(max(uAlpha,1.0-ok),max(rej,smoothstep(0.25,1.0,ld)*0.4));'+
  'vec3 o=mix(hc,c,min(a,1.0));'+
  'o+=(c-sm/9.0)*uSharp;'+   // ชดเชยความนุ่มของการสะสม
  'gl_FragColor=vec4(max(o,0.0),z);}';   // alpha = ความลึกตามแนวสายตา ไว้ให้เฟรมถัดไป
const _taaH=(i,b)=>{let f=1,r=0;while(i>0){f/=b;r+=f*(i%b);i=Math.floor(i/b);}return r;};
function taaWanted(){return TAA.on&&QUAL.mode==='high'&&screen==='game'&&rpass.scene===scene&&SOFTU.uSoftOn.value>0.5;}
function taaBegin(){
  TAA.jit=false;
  if(!taaWanted()){TAA.valid=0;return;}
  const W=composer.renderTarget1.width,H=composer.renderTarget1.height;
  cam.updateMatrixWorld();cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  TAA.cur.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);   // ไม่สั่น (ใช้ย้อนตำแหน่ง)
  const k=(TAA.n++%8)+1;cam.setViewOffset(W,H,_taaH(k,2)-0.5,_taaH(k,3)-0.5,W,H);TAA.jit=true;
}
function taaEnd(){if(cam.view&&cam.view.enabled)cam.clearViewOffset();}
function taaFinish(){taaEnd();TAA.jit=false;}
// ผสมภาพฉากกับประวัติ → คืนเท็กซ์เจอร์ผลลัพธ์ (หรือ null = ไม่ใช้ TAA เฟรมนี้)
function taaResolve(r,read){
  if(!TAA.jit)return null;
  const w=read.width,h=read.height;
  if(!TAA.quad)TAA.quad=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:{tCur:{value:null},tHist:{value:null},tD:{value:null},uInvVP:{value:TAA.inv},uPrevVP:{value:TAA.prev},uPx:{value:new THREE.Vector2()},uAlpha:{value:0.1},uSharp:{value:0.25},uValid:{value:0},uNear:{value:0.1},uFar:{value:700}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:TAA_FRAG,depthTest:false,depthWrite:false}));
  if(TAA.w!==w||TAA.h!==h){for(const t of TAA.rt)if(t)t.dispose();TAA.rt=[0,1].map(()=>new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,depthBuffer:false}));TAA.w=w;TAA.h=h;TAA.valid=0;}
  const U=TAA.quad.material.uniforms;TAA.inv.copy(TAA.cur).invert();
  U.tCur.value=read.texture;U.tD.value=read.depthTexture;U.tHist.value=TAA.rt[1-TAA.i].texture;U.uPx.value.set(1/w,1/h);U.uAlpha.value=TAA.alpha;U.uSharp.value=TAA.sharp;U.uValid.value=TAA.valid;U.uNear.value=cam.near;U.uFar.value=cam.far;
  r.setRenderTarget(TAA.rt[TAA.i]);TAA.quad.render(r);
  TAA.prev.copy(TAA.cur);TAA.valid=1;TAA.applied=true;const out=TAA.rt[TAA.i].texture;TAA.i=1-TAA.i;return out;}
const AO_RT=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false});
class FXPass extends Pass{
  constructor(){super();this.needsSwap=true;
    const vs='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
    this.ao=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:Object.assign({tD:{value:null}},SOFTU,AOU),vertexShader:vs,fragmentShader:AO_CALC,depthTest:false,depthWrite:false}));
    this.cp=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:Object.assign({t:{value:null},tD:{value:null}},SOFTU,AOU),vertexShader:vs,fragmentShader:AO_COPY,depthTest:false,depthWrite:false}));}
  setSize(w,h){AO_RT.setSize(Math.max(1,w>>1),Math.max(1,h>>1));AOU.uAORes.value.set(AO_RT.width,AO_RT.height);}
  render(r,write,read){const ac=r.autoClear;r.autoClear=false;
    if(!SOFTU.uSoftOn.value){this.needsSwap=false;r.setRenderTarget(read);r.render(fxScene,cam);r.autoClear=ac;return;}
    // นุ่ม: ก๊อปภาพฉากไปอีกแผ่น แล้ววาดเอฟเฟกต์ทับโดยอ่านความลึกจากแผ่นเดิม (อ่าน+เขียนแผ่นเดียวกันไม่ได้)
    this.needsSwap=true;SOFTU.uDepth.value=read.depthTexture;SOFTU.uRes.value.set(read.width,read.height);SOFTU.uNear.value=cam.near;SOFTU.uFar.value=cam.far;
    const th=Math.tan(cam.fov*Math.PI/360);AOU.uTan.value.set(th*cam.aspect,th);
    this.ao.material.uniforms.tD.value=this.cp.material.uniforms.tD.value=read.depthTexture;
    if(AOU.uAO.value>0.001){r.setRenderTarget(AO_RT);this.ao.render(r);AOU.tAO.value=AO_RT.texture;}
    const F=rpass.scene.fog,e=cam.matrixWorld.elements;AOU.uCamY.value.set(e[1],e[5],e[9],e[13]);
    AOU.uHaze.value=F&&F.isFog?GFX.haze:0;if(F){AOU.uHazeCol.value.copy(F.color);AOU.uHazeD.value.x=GFX.hazeK/Math.max(F.far||1,1);}
    AOU.uHazeD.value.y=GFX.hazeH;if(typeof lookRaysFrame==='function')lookRaysFrame();if(typeof ambFrame==='function')ambFrame();   // ฝุ่น/หมอกลอย (js/75)
    AOU.uRim.value=GFX.rim;AOU.uRimCol.value.copy(moonL.color).multiplyScalar(GFX.rim);AOU.uHazeD.value.z=GFX.rimZ;
    const ta=taaResolve(r,read),src=ta||read.texture;   // TAA: ภาพฉากที่ผสมประวัติแล้ว (กราฟิกสูง)
    this.cp.material.uniforms.t.value=src;HAZE_U.uScene.value=src;r.setRenderTarget(write);this.cp.render(r);taaEnd();r.render(fxScene,cam);r.autoClear=ac;}
}
const fxPass=new FXPass();composer.addPass(fxPass);
const bloom=new UnrealBloomPass(new THREE.Vector2(512,512),0.72,0.5,0.86);
// เรนเดอร์แสงฟุ้งที่ครึ่งความละเอียด (ดูแทบไม่ต่าง แต่เร็วขึ้นมาก)
{const bs=bloom.setSize.bind(bloom);bloom.setSize=(w,h)=>bs(Math.max(1,Math.round(w/2)),Math.max(1,Math.round(h/2)));}
composer.addPass(bloom);
// โทนสีทั้งจอ + เอฟเฟกต์ทั้งจอ: แฟลชสี, เบลอพุ่งเข้าหาจุด (radial blur ตอนอัลติ), สีเหลื่อม (chromatic) ตอนกระแทก, ขอบจอมืด/แดงตอนโดนตี
const GRADEU={tDiffuse:{value:null},uFlash:{value:new THREE.Color(0,0,0)},uRad:{value:0},uCtr:{value:new THREE.Vector2(0.5,0.5)},uChr:{value:0},uVig:{value:0.28},uHurt:{value:0},uSat:{value:1.1},uOn:{value:1},uCon:{value:1},uLo:{value:new THREE.Vector3(1,1,1)},uHi:{value:new THREE.Vector3(1,1,1)}};
class GradePass extends Pass{
  constructor(){super();this.needsSwap=true;
    this.q=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:GRADEU,depthTest:false,depthWrite:false,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader:'uniform sampler2D tDiffuse;uniform vec3 uFlash;uniform float uRad;uniform vec2 uCtr;uniform float uChr;uniform float uVig;uniform float uHurt;uniform float uSat;uniform float uCon;uniform vec3 uLo;uniform vec3 uHi;varying vec2 vUv;'+
        'void main(){vec2 uv=vUv;vec3 c;'+
        'if(uRad>0.001){vec2 d=uv-uCtr;c=vec3(0.0);for(int i=0;i<10;i++){float t=float(i)/9.0;c+=texture2D(tDiffuse,uCtr+d*(1.0-uRad*0.16*t)).rgb;}c/=10.0;}else c=texture2D(tDiffuse,uv).rgb;'+
        'if(uChr>0.001){vec2 o=(uv-0.5)*uChr*0.006;c.r=mix(c.r,texture2D(tDiffuse,uv+o).r,0.85);c.b=mix(c.b,texture2D(tDiffuse,uv-o).b,0.85);}'+
        'float l=dot(c,vec3(0.2126,0.7152,0.0722));c=max(mix(vec3(l),c,uSat),0.0);'+
        'c=mix(c*vec3(0.9,0.95,1.12),c,smoothstep(0.0,0.35,l));'+   // เงาอมฟ้าเล็กน้อย
        'c=pow(max(c,vec3(0.0))/0.18,vec3(uCon))*0.18;c*=mix(uLo,uHi,smoothstep(0.03,0.8,dot(c,vec3(0.2126,0.7152,0.0722))));'+   // คอนทราสต์รอบเทา 18% + ย้อมสีเงา/ไฮไลต์ (Look js/74)
        'vec2 q=(uv-0.5)*vec2(1.0,0.82);float v=smoothstep(0.78,0.22,length(q));c*=mix(1.0-uVig,1.0,v);'+
        'c=mix(c,c*0.35+vec3(0.9,0.05,0.05)*0.6,uHurt*(1.0-v));'+
        'c+=uFlash;gl_FragColor=vec4(c,1.0);}'}));}
  render(r,write,read){GRADEU.tDiffuse.value=read.texture;r.setRenderTarget(this.renderToScreen?null:write);this.q.render(r);}
}
const gradePass=new GradePass();composer.addPass(gradePass);
composer.addPass(new OutputPass());
// ลบขอบหยัก (FXAA) — ทำหลังแปลงสีจอแล้ว (ภาพ sRGB) ตรงที่สีต่างกันมากเท่านั้น • ปิดในโหมดประหยัด / GFX.aa=false
class AAPass extends Pass{
  constructor(){super();this.needsSwap=true;
    this.q=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:{t:{value:null},uPx:{value:new THREE.Vector2(1,1)},uOff:{value:0}},depthTest:false,depthWrite:false,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader:'uniform sampler2D t;uniform vec2 uPx;uniform float uOff;varying vec2 vUv;vec3 L=vec3(0.299,0.587,0.114);float lu(vec2 o){return dot(texture2D(t,vUv+o*uPx).rgb,L);}'+
        'void main(){vec4 cm=texture2D(t,vUv);if(uOff>0.5){gl_FragColor=vec4(cm.rgb,1.0);return;}float nw=lu(vec2(-1.0,-1.0)),ne=lu(vec2(1.0,-1.0)),sw=lu(vec2(-1.0,1.0)),se=lu(vec2(1.0,1.0)),m=dot(cm.rgb,L);'+
        'float lo=min(m,min(min(nw,ne),min(sw,se))),hi=max(m,max(max(nw,ne),max(sw,se)));'+
        'if(hi-lo<max(0.04,hi*0.125)){gl_FragColor=vec4(cm.rgb,1.0);return;}'+
        'vec2 d=vec2(-((nw+ne)-(sw+se)),(nw+sw)-(ne+se));float rd=max((nw+ne+sw+se)*0.03125,0.0078125);'+
        'd=clamp(d/(min(abs(d.x),abs(d.y))+rd),-8.0,8.0)*uPx;'+
        'vec3 a=0.5*(texture2D(t,vUv-d/6.0).rgb+texture2D(t,vUv+d/6.0).rgb),b=a*0.5+0.25*(texture2D(t,vUv-d*0.5).rgb+texture2D(t,vUv+d*0.5).rgb);'+
        'float lb=dot(b,L);gl_FragColor=vec4((lb<lo||lb>hi)?a:b,1.0);}'}));}
  render(r,write,read){const u=this.q.material.uniforms;u.uOff.value=TAA.applied?1:0;TAA.applied=false;   // TAA ลบขอบแล้ว → พาสนี้แค่ส่งภาพต่อ (ยังต้องวาดลงจอเพราะเป็นพาสสุดท้าย)
    u.t.value=read.texture;u.uPx.value.set(1/read.width,1/read.height);r.setRenderTarget(this.renderToScreen?null:write);this.q.render(r);}
}
const aaPass=new AAPass();composer.addPass(aaPass);fxPass.gfx=GFX;

// ---------- คุณภาพกราฟิก: auto = ปรับความละเอียดเองตาม FPS / high = สวยสุด / low = เครื่องช้า ----------
const QUAL={mode:['auto','high','low'].includes(store('wd_gfx'))?store('wd_gfx'):'auto',scale:1,acc:0,n:0,good:0,frame:0,lvl:0,cpu:0,cacc:0,cs:0,clA:0};
const QUAL_NAME={auto:'อัตโนมัติ',high:'สูง',low:'ประหยัด'};
function qualPR(){
  const dpr=window.devicePixelRatio||1;
  if(QUAL.mode==='high')return Math.min(1.5,dpr);
  if(QUAL.mode==='low')return Math.min(1,dpr)*0.7;
  return Math.min(1,dpr)*QUAL.scale;
}
function applyQuality(){
  const pr=qualPR();gl.setPixelRatio(pr);composer.setPixelRatio(pr);
  // เปิด/ปิดเงา = คอมไพล์ shader ใหม่ทุกตัว (ค้าง ~2 วิ) → ปิดจริงเฉพาะโหมดประหยัด • อัตโนมัติขั้น 2 แค่อัปเดตเงาห่างขึ้น (renderGame js/37)
  const sh=QUAL.mode!=='low';
  if(gl.shadowMap.enabled!==sh){
    gl.shadowMap.enabled=sh;
    for(const sc of [scene,typeof stage!=='undefined'?stage:null])if(sc)sc.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>m.needsUpdate=true);});
  }
  bloom.enabled=QUAL.mode!=='low'&&!(QUAL.mode==='auto'&&QUAL.lvl>=1);
  gradePass.enabled=QUAL.mode!=='low';
  aaPass.enabled=GFX.aa&&QUAL.mode!=='low'&&!(QUAL.mode==='auto'&&QUAL.lvl>=2);
  // soft particles: ปิดเมื่อกราฟิกประหยัด หรืออัตโนมัติลดถึงขั้นปิดเงา (ประหยัดการก๊อปภาพเต็มจอ 1 ครั้ง)
  const soft=QUAL.mode!=='low'&&!(QUAL.mode==='auto'&&QUAL.lvl>=2)?1:0;
  if(SOFTU.uSoftOn.value!==soft){SOFTU.uSoftOn.value=soft;for(const m of FXMATS)m.depthTest=!soft;}
  // เงาตามซอกมุม: สูง = เปิด / อัตโนมัติ = เปิดจนกว่าเครื่องเริ่มช้า (lvl≥1) / ประหยัด = ปิด (ทำงานเฉพาะตอน soft เปิด)
  AOU.uAO.value=soft&&(QUAL.mode==='high'||QUAL.lvl<1)?AO_ON.strength:0;
  if(typeof lookRays==='function')lookRays();   // ลำแสง: เปิดตามกราฟิกเหมือน AO
  if(typeof resize==='function'&&SW)resize();
}
// ปรับความละเอียดอัตโนมัติ: เฟรมช้า (<~40fps) ลดลงทีละขั้น / ลื่นต่อเนื่องค่อยเพิ่มกลับ
function qualTick(dt){
  if(QUAL.mode!=='auto'||(screen!=='game'&&screen!=='menu'&&screen!=='lobby')||dt>0.2)return;   // เมนู/ล็อบบี้ก็ลดเองได้ เครื่องอ่อนจะได้ไม่แลคตั้งแต่หน้าแรก
  QUAL.acc+=dt;QUAL.n++;QUAL.cacc+=QUAL.cpu;
  if(QUAL.acc<2)return;
  const avg=QUAL.acc/QUAL.n*1000,cpu=QUAL.cacc/QUAL.n;QUAL.acc=0;QUAL.n=0;QUAL.cacc=0;
  // คอขวดอยู่ที่ CPU (เวลา JS ของเฟรม ≥ 75% ของเวลาเฟรม) → ลดความละเอียดไม่ช่วย ได้แค่ภาพเบลอ: ข้ามไปลดงาน CPU (lvl) แทน และคืนความคมให้ทีละขั้น
  const cpuBound=cpu>avg*0.75;QUAL.cpuBound=cpuBound;
  if(avg>24&&cpuBound){QUAL.good=0;if(QUAL.lvl>=2&&QUAL.cs<2){QUAL.cs++;return;}if(QUAL.lvl<2)QUAL.lvl++;else if(QUAL.scale<1)QUAL.scale=Math.min(1,+(QUAL.scale+0.15).toFixed(2));else return;applyQuality();return;}
  if(QUAL.cs>0&&avg<18){if(++QUAL.good>=8){QUAL.good=0;QUAL.cs--;}return;}   // คืนช้า ๆ (16 วิ) กันแกว่ง • 18 = จอ 60 Hz วัดได้ ~16.7 ไม่มีทางต่ำกว่า 16
  // ช้าเพราะการ์ดจอ: ลดความละเอียดก่อน → ปิดแสงฟุ้ง (lvl1) → เงาอัปเดตห่างขึ้น (lvl2) / ลื่นต่อเนื่อง: ค่อยๆ คืนกลับทีละขั้น
  // ลำดับใหม่ (2026-11-06): ปิดแสงฟุ้งก่อน → ลดความชัดถึง 0.7 → เงาห่าง/ปิด AO (lvl2) → ค่อยลดถึง 0.55 / 0.45 (เดิมลดความชัดก่อน ภาพเบลอทั้งที่ยังมีเอฟเฟกต์ให้ตัด)
  if(avg>24){QUAL.good=0;if(QUAL.lvl<1)QUAL.lvl=1;else if(QUAL.scale>0.75)QUAL.scale=Math.max(0.7,+(QUAL.scale-0.15).toFixed(2));else if(QUAL.lvl<2)QUAL.lvl++;else if(QUAL.scale>0.6)QUAL.scale=0.55;else if(QUAL.scale>0.45)QUAL.scale=0.45;applyQuality();}
  else if(avg<16){if(++QUAL.good>=4){QUAL.good=0;if(QUAL.scale<0.7&&QUAL.lvl>0)QUAL.lvl--;else if(QUAL.scale<1)QUAL.scale=Math.min(1,+(QUAL.scale+0.1).toFixed(2));else if(QUAL.lvl>0)QUAL.lvl--;else return;applyQuality();}}
  else QUAL.good=0;
}

// ---------- ประหยัด CPU สำหรับเครื่องอ่อน (ผู้ใช้ 2026-11-06 "เครื่องผู้เล่นแย่กว่านี้จะเล่นยังไง") ----------
// คอขวดเครื่องอ่อนคือ CPU (สั่งวาด ~600 ครั้ง/เฟรม บนคอร์เดียว) ไม่ใช่ความละเอียด: ลดกราฟิกอย่างเดียวไม่ช่วย
// ขั้น 1–2: ซ่อนของชิ้นเล็กไกลตา • เงาอัปเดตห่างขึ้น (js/37) • อนุภาคน้อยลง (vfxQual js/19) • ผ้าคลุมคำนวณไม่ทุกเฟรม (js/37)
// ประหยัด = ขั้น 2 เสมอ • อัตโนมัติ = เพิ่มเองเมื่อ CPU ไม่ไหวหลังลดระดับภาพครบ (qualTick) • สูง = ปิด
const qualCS=()=>QUAL.mode==='low'?2:QUAL.mode==='auto'?QUAL.cs:0;
const CULL={list:null,key:'',t:0,on:false};
function cullTick(dt){
  const cs=qualCS();if(CULL.key!==builtKey){CULL.key=builtKey;CULL.list=null;CULL.on=false;}
  if(!cs){if(CULL.on){CULL.on=false;for(const c of CULL.list)if(!c.on){c.on=true;c.m.layers.set(0);}}return;}
  if((CULL.t-=dt)>0||!world)return;CULL.t=0.25;
  if(!CULL.list){CULL.list=[];world.updateMatrixWorld(true);const sp=new THREE.Sphere();
    world.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.layers.mask!==1||!o.geometry)return;
      const g=o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();if(!g.boundingSphere)return;
      sp.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);if(sp.radius<=12)CULL.list.push({m:o,x:sp.center.x,y:sp.center.y,z:sp.center.z,r:sp.radius,on:true});});}
  CULL.on=true;const K=cs>=2?14:24,B=cs>=2?25:40,P=cam.position;
  for(const c of CULL.list){const dx=c.x-P.x,dy=c.y-P.y,dz=c.z-P.z,R=B+c.r*K,show=dx*dx+dy*dy+dz*dz<R*R;if(show!==c.on){c.on=show;c.m.layers.set(show?0:29);}}
}
function texCanvas(w,h,draw,srgb=true){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t;}
const glowTex=texCanvas(64,64,(g,w)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(0.22,'rgba(255,255,255,0.65)');r.addColorStop(0.5,'rgba(255,255,255,0.18)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,w);},false);
const stoneTex=texCanvas(256,256,(g)=>{
  g.fillStyle='#4a4554';g.fillRect(0,0,256,256);
  for(let y=0;y<256;y+=32)for(let x=-(y/32%2)*32;x<256;x+=64){const v=Math.random()*22;g.fillStyle=`rgb(${92+v},${86+v},${100+v})`;g.fillRect(x+2,y+2,60,28);}
  for(let i=0;i<500;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*0.12})`;g.fillRect(Math.random()*256,Math.random()*256,3,3);}
});
stoneTex.wrapS=stoneTex.wrapT=THREE.RepeatWrapping;
const runeTex=texCanvas(256,256,(g)=>{
  g.translate(128,128);g.strokeStyle='#fff';g.lineWidth=5;
  for(const r of [120,100,58]){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();}
  g.lineWidth=3;g.beginPath();for(let i=0;i<=6;i++){const a=i/6*Math.PI*2;i?g.lineTo(Math.cos(a)*100,Math.sin(a)*100):g.moveTo(100,0);}g.stroke();
  g.beginPath();for(let i=0;i<=3;i++){const a=i/3*Math.PI*2-Math.PI/2;i?g.lineTo(Math.cos(a)*100,Math.sin(a)*100):g.moveTo(0,-100);}g.stroke();
  g.font='bold 18px serif';g.fillStyle='#fff';g.textAlign='center';
  const R='ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊ';for(let i=0;i<16;i++){g.save();g.rotate(i/16*Math.PI*2);g.fillText(R[i],0,-104);g.restore();}
},false);
const glowMats={};
function glowMat(col,k=1.6){const key=col+k;if(!glowMats[key])glowMats[key]=new THREE.SpriteMaterial({map:glowTex,color:hdr(col,k),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true});return glowMats[key];}
// ใช้วัสดุหินซ้ำ (ค่าเดียวกัน = วัสดุเดียวกัน) เพื่อให้รวมชิ้นส่วนฉากเป็นก้อนเดียวได้
const STONEM={};
function stoneMat(rx,ry,tint){const k=rx+'|'+ry+'|'+(tint||'');if(STONEM[k])return STONEM[k];const t=stoneTex.clone();t.needsUpdate=true;t.repeat.set(rx,ry);return STONEM[k]=new THREE.MeshStandardMaterial({map:t,color:tint||'#ffffff',roughness:0.95});}
function shadowAll(o){o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});}

// ท้องฟ้า: กลางคืน (ปราสาท/ป่า) หรือ พระอาทิตย์ตก (สนามควิดดิช)
const SKY={};
(function(){
  const grad=(stops)=>texCanvas(4,256,(g)=>{const r=g.createLinearGradient(0,0,0,256);stops.forEach(([p,c])=>r.addColorStop(p,c));g.fillStyle=r;g.fillRect(0,0,4,256);});
  SKY.night=grad([[0,'#03050f'],[0.45,'#141a3a'],[0.52,'#3a2f55'],[0.6,'#151a33'],[1,'#08090f']]);
  SKY.sunset=grad([[0,'#16234f'],[0.3,'#4a3f86'],[0.44,'#c06a8a'],[0.5,'#ff9a5a'],[0.53,'#ffd08a'],[0.6,'#6a4a5a'],[1,'#2a2030']]);
  SKY.mesh=new THREE.Mesh(new THREE.SphereGeometry(600,32,16),new THREE.MeshBasicMaterial({map:SKY.night,side:THREE.BackSide,fog:false,depthWrite:false}));
  scene.add(SKY.mesh);
  const n=1500,pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,e=Math.random()*1.3+0.12;pos[i*3]=Math.cos(a)*Math.cos(e)*550;pos[i*3+1]=Math.sin(e)*550;pos[i*3+2]=Math.sin(a)*Math.cos(e)*550;}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  SKY.stars=new THREE.Points(sg,new THREE.PointsMaterial({color:'#dfe6ff',size:1.6,sizeAttenuation:false,fog:false}));scene.add(SKY.stars);
  SKY.moon=new THREE.Group();
  const mg=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:'#c8d4ff',fog:false,depthWrite:false}));mg.scale.set(110,110,1);SKY.moon.add(mg);
  const mc=new THREE.Mesh(new THREE.CircleGeometry(14,32),new THREE.MeshBasicMaterial({color:hdr('#f4f6ff',1.6),fog:false}));SKY.moon.add(mc);
  SKY.moon.position.set(-190,180,-310);mc.lookAt(190,-180,310);scene.add(SKY.moon);
  SKY.sun=new THREE.Group();
  const sg2=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:hdr('#ffb070',1.2),fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));sg2.scale.set(220,220,1);SKY.sun.add(sg2);
  const sc=new THREE.Mesh(new THREE.CircleGeometry(22,40),new THREE.MeshBasicMaterial({color:hdr('#fff0c0',2.2),fog:false}));SKY.sun.add(sc);
  SKY.sun.position.set(300,45,-420);sc.lookAt(-300,-45,420);SKY.sun.visible=false;scene.add(SKY.sun);
})();
const hemi=new THREE.HemisphereLight('#8fa6ff','#2a1f1a',0.55);scene.add(hemi);
scene.add(new THREE.AmbientLight('#404060',0.3));
const moonL=new THREE.DirectionalLight('#c4d2ff',1.0);
moonL.position.set(-55,95,-70);moonL.castShadow=true;moonL.shadow.bias=-0.0004;moonL.shadow.normalBias=0.03;
scene.add(moonL);scene.add(moonL.target);
// ทิศจากพื้นไปหาแสงหลัก (setSky ตั้ง) — shadowFollow ใช้วางแสงตามผู้เล่น
const LDIR=new THREE.Vector3(-55,95,-70).normalize();
function setSky(mode){
  const day=mode==='sunset';
  SKY.mesh.material.map=day?SKY.sunset:SKY.night;SKY.mesh.material.needsUpdate=true;
  SKY.stars.visible=!day;SKY.moon.visible=!day;SKY.sun.visible=day;
  if(day){moonL.color.set('#ffbe8a');moonL.position.set(80,45,-110);gl.toneMappingExposure=1.05;}
  else{moonL.color.set('#c4d2ff');moonL.position.set(-55,95,-70);gl.toneMappingExposure=1.1;}
  LDIR.copy(moonL.position).normalize();
  SKY.day=day;if(typeof lookApply==='function')lookApply(day);   // แสงรอบตัวจากท้องฟ้า (js/74-look.js)
}
// ---------- เงาตามผู้เล่น ----------
// กล้องเงาครอบแค่พื้นที่รอบ ๆ ที่กล้องมอง (ไม่ใช่ทั้งแผนที่) → เงาคมขึ้นหลายเท่า โดยภาพเงาขนาดเท่าเดิม
// r = ครึ่งความกว้างพื้นที่เงา (หน่วย 3D, ไม่เกินขนาดแผนที่) • ahead = ดันจุดกลางไปข้างหน้ากล้อง (สัดส่วนของ r)
// ขยับเป็นขั้นเท่าพิกเซลเงาพอดี กันขอบเงาสั่นยิบ ๆ ตอนเดิน/หันกล้อง • on=false → กลับไปแบบคลุมทั้งแผนที่ (ตั้งใน buildWorld)
const SHD={on:true,r:36,rHigh:48,ahead:0.5};
const _shF=new THREE.Vector3(),_shR=new THREE.Vector3(),_shU=new THREE.Vector3(),_shC=new THREE.Vector3(),_shY=new THREE.Vector3(0,1,0);
function shadowFollow(){
  if(!gl.shadowMap.enabled)return;
  const c=moonL.shadow.camera,ext=Math.max(MW,MH)*S3/2+12;
  if(!SHD.on){   // แบบเดิม: คลุมทั้งแผนที่ แสงมองไปที่กลางแผนที่
    if(c.right!==ext){Object.assign(c,{left:-ext,right:ext,top:ext,bottom:-ext,near:1,far:400});c.updateProjectionMatrix();}
    moonL.target.position.set(0,0,0);moonL.position.copy(LDIR).multiplyScalar(133);moonL.target.updateMatrixWorld();shadowSoft(c);return;}
  const r=Math.min(ext,QUAL.mode==='high'?SHD.rHigh:SHD.r);
  if(c.right!==r){Object.assign(c,{left:-r,right:r,top:r,bottom:-r,near:1,far:420});c.updateProjectionMatrix();}
  _shF.set(0,0,-1).applyQuaternion(cam.quaternion);_shF.y=0;if(_shF.lengthSq()<1e-6)_shF.set(0,0,-1);_shF.normalize();
  const x=cam.position.x+_shF.x*r*SHD.ahead,z=cam.position.z+_shF.z*r*SHD.ahead;
  _shC.set(x,TW(x,z),z);
  // ปัดจุดกลางให้ตรงตารางพิกเซลเงา (แกนขวา/บนของกล้องเงา)
  _shF.copy(LDIR).negate();_shR.crossVectors(_shF,_shY).normalize();_shU.crossVectors(_shR,_shF);
  const tex=2*r/moonL.shadow.mapSize.x,a=_shC.dot(_shR),b=_shC.dot(_shU);
  _shC.addScaledVector(_shR,Math.round(a/tex)*tex-a).addScaledVector(_shU,Math.round(b/tex)*tex-b);
  moonL.target.position.copy(_shC);moonL.position.copy(_shC).addScaledVector(LDIR,200);
  moonL.target.updateMatrixWorld();
  shadowSoft(c);
}
// เงานุ่ม PCSS: เปิดเฉพาะกราฟิกสูง (radius = 10 + K, K = ขนาดแสง × ช่วงลึกกล้องเงา / ความกว้างกล้องเงา) • ปิด = 1 (วิธีเดิม)
function shadowSoft(c){c=c||moonL.shadow.camera;moonL.shadow.radius=PCSS.on&&QUAL.mode==='high'?10+PCSS.size*(c.far-c.near)/Math.max(1,c.right-c.left):1;}
// ไฟชั่วคราวสำหรับคาถา (pool คงที่ ไม่ต้อง compile shader ใหม่)
const LPOOL=[];
for(let i=0;i<6;i++){const L=new THREE.PointLight('#ffffff',0,12,2);L.position.set(0,-100,0);scene.add(L);LPOOL.push(L);}
