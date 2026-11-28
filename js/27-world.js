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
// Shared lighting extras for every Standard/Physical program (guides/PRELOAD-STANDARD.md step 2), set before anything compiles:
// one recipe on every map, no per-material patch. PTG.x = painterly cel strength (0 = smooth, js/77 sets it per map),
// PTG.y = sky/ambient/env dim for indoor areas (0 = none; zones come later). Plain object, not a Vector4: three's cloneUniforms
// copies it by reference, so every material reads the live value. Custom shaders without the uniform read 0 = unchanged.
const PTG={x:0,y:0,z:0,w:0};
{const C=THREE.ShaderChunk,re=/float dotNL = saturate\( dot\( (geometryNormal|geometry\.normal), directLight\.direction \) \);(\s*)vec3 irradiance = dotNL \* directLight\.color;/;
  const lp=C.lights_physical_pars_fragment.replace(re,(m,n,ws)=>'float dotNL = dot( '+n+', directLight.direction );dotNL=mix(saturate(dotNL),smoothstep(0.0,0.07,dotNL)*0.6+smoothstep(0.5,0.57,dotNL)*0.4,uPtG.x);'+ws+'vec3 irradiance = dotNL * directLight.color;');
  if(lp===C.lights_physical_pars_fragment)console.warn('PTG: cel hook not found in lights_physical_pars_fragment');
  C.lights_physical_pars_fragment='uniform vec4 uPtG;\n'+lp;
  C.lights_fragment_end='#if defined( STANDARD )\n{float ptSky=1.0-uPtG.y;\n#if defined( RE_IndirectDiffuse )\nirradiance*=ptSky;iblIrradiance*=ptSky;\n#endif\n#if defined( RE_IndirectSpecular )\nradiance*=ptSky;\n#endif\n}\n#endif\n'+C.lights_fragment_end;
  for(const k of ['standard','physical'])THREE.ShaderLib[k].uniforms.uPtG={value:PTG};}
// antialias ปิดไว้: ภาพผ่าน EffectComposer (render target) อยู่แล้ว MSAA ของ canvas จึงไม่ช่วยอะไร แค่กินแรง
const gl=new THREE.WebGLRenderer({canvas:document.getElementById('gl'),antialias:false,powerPreference:'high-performance'});
// ShaderMaterial.dispose() = no-op (PRELOAD-STANDARD step 4, 2026-11-23). three gives each ShaderMaterial source an id in its shader
//   cache and drops the id when the last material with that source is disposed; the next effect with the same source gets a NEW id
//   = new program key = a fresh compile mid-fight, although the identical program is still pinned (pinPrograms js/37). Every code
//   VFX disposes its materials when it ends, so every cast after the first recompiled. Keeping the ids costs a few strings; the
//   programs are pinned anyway. Textures in uniforms are still disposed by disposeMaterial (js/29).
THREE.ShaderMaterial.prototype.dispose=function(){};
// ตรวจ error ของ shader ทุกตัวที่ compile = บังคับ CPU รอการ์ดจอ compile เสร็จ (getProgramInfoLog ~3% ของเฟรมตอนสู้กัน) → ปิด ยกเว้น ?debug
gl.debug.checkShaderErrors=/[?&]debug\b/.test(location.search);
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
	// Advance the same golden-angle spiral without per-tap trigonometry.
	const mat2 spiral = mat2( -0.737368878, 0.675490296, -0.675490296, -0.737368878 );
	vec2 dir = vec2( cos( ang ), sin( ang ) );
	for ( int i = 0; i < 12; i ++ ) {
		float r = sqrt( ( float( i ) + 0.5 ) / 12.0 );
		float d = unpackRGBAToDepth( texture2D( sm, sc.xy + dir * r * sr ) );
		dir = spiral * dir;
		if ( d < zR ) { bs += d; bn += 1.0; }
	}
	if ( bn < 0.5 ) return 1.0;
	float pen = clamp( ( zR - bs / bn ) * K, 1.2 * ts.x, 0.012 );
	float lit = 0.0;
	dir = vec2( cos( ang * 1.7 ), sin( ang * 1.7 ) );
	for ( int i = 0; i < 16; i ++ ) {
		float r = sqrt( ( float( i ) + 0.5 ) / 16.0 );
		lit += step( zR, unpackRGBAToDepth( texture2D( sm, sc.xy + dir * r * pen ) ) );
		dir = spiral * dir;
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
const GFX={sat:1.1,rim:0.17,rimZ:22,haze:0.55,hazeK:1.4,hazeH:0.06,aa:true};   // haze/hazeK/hazeH ถูกทับด้วยพรีเซ็ต Look (js/74)
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
// ===== Wet ground + reflections (rain, js/76-weather.js) — pixels whose depth normal points up get darker + reflect the scene
// uRefl (Settings > Graphics > Reflections): 0 off • 1 fake = vertical smear toward the lights above (cheap) • 2 SSR = ray march in this frame
// • 3 Planar = mirror render tMir (js/76 wxPre) for pixels near the plane uMirY, SSR elsewhere • puddles + rain ripples from world-space noise
const WETU={uWet:{value:0},uRefl:{value:0},uWT:{value:0},uWetD:{value:90},uCamX:{value:new THREE.Vector4()},uCamZ:{value:new THREE.Vector4()},uProj:{value:new THREE.Matrix4()},
  uSkyC:{value:new THREE.Color()},tMir:{value:null},uMirVP:{value:new THREE.Matrix4()},uMirY:{value:0},uMirOn:{value:0}};
const WET_GLSL='uniform float uWet;uniform float uRefl;uniform float uWT;uniform float uWetD;uniform vec4 uCamX;uniform vec4 uCamZ;uniform mat4 uProj;uniform vec3 uSkyC;uniform sampler2D tMir;uniform mat4 uMirVP;uniform float uMirY;uniform float uMirOn;'+
  'float wh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}'+
  'float wn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(wh(i),wh(i+vec2(1.0,0.0)),f.x),mix(wh(i+vec2(0.0,1.0)),wh(i+vec2(1.0,1.0)),f.x),f.y);}'+
  // rain ripples: one ring per cell (2 sizes), random phase/offset → xz slope of the ring wave
  'vec2 wrip(vec2 p,float tm){vec2 g=vec2(0.0);for(int l=0;l<2;l++){vec2 q=p*(l==0?1.4:2.3)+float(l)*7.3;vec2 i=floor(q),f=fract(q)-0.5;float h=wh(i);'+
    'vec2 d=f-(vec2(wh(i+3.1),wh(i+5.7))-0.5)*0.5;float r=length(d);float a=fract(tm*(0.9+h*0.6)+h);float rr=a*0.45;'+
    'g+=d/max(r,1e-3)*(1.0-a)*exp(-pow((r-rr)*18.0,2.0))*cos((r-rr)*40.0);}return g*0.5;}'+
  'vec2 wpr(vec3 q){vec4 c=uProj*vec4(q,1.0);return c.xy/c.w*0.5+0.5;}';
const WET_MAIN='if(uWet>0.001&&z<uWetD){vec2 px=1.0/uRes;vec3 P=vec3((vUv*2.0-1.0)*uTan*z,-z);'+
  'vec3 pr=vp(vUv+vec2(px.x,0.0))-P,pl=P-vp(vUv-vec2(px.x,0.0)),pu=vp(vUv+vec2(0.0,px.y))-P,pd=P-vp(vUv-vec2(0.0,px.y));'+
  'vec3 N=normalize(cross(abs(pr.z)<abs(pl.z)?pr:pl,abs(pu.z)<abs(pd.z)?pu:pd));'+
  'float hz=smoothstep(0.8,0.94,dot(N,uCamY.xyz))*uWet*(1.0-smoothstep(uWetD*0.55,uWetD,z));'+
  'if(hz>0.001){vec2 wp=vec2(dot(uCamX.xyz,P)+uCamX.w,dot(uCamZ.xyz,P)+uCamZ.w);'+
    'float pud=smoothstep(0.48,0.66,wn(wp*0.17)*0.65+wn(wp*0.6+3.0)*0.35);'+   // puddles (mirror-like) vs damp ground
    'vec2 rg=wrip(wp,uWT)*(0.35+0.65*pud)+(vec2(wn(wp*3.0),wn(wp*3.0+9.0))-0.5)*0.16*(1.0-pud);'+
    'vec3 Nv=normalize(uCamY.xyz+uCamX.xyz*rg.x+uCamZ.xyz*rg.y);'+
    'c.rgb*=1.0-hz*(0.3+0.25*pud);'+   // wet = darker
    'if(uRefl>0.5){vec3 V=normalize(P);float fr=pow(1.0-max(dot(-V,Nv),0.0),5.0);float amt=hz*mix(0.28,1.0,pud)*(0.1+0.75*fr);vec3 rc=vec3(0.0);float ok=0.0;'+
      'if(uRefl<1.5){vec3 mx=vec3(0.0),av=vec3(0.0);for(int i=1;i<=7;i++){float f=float(i)/7.0;vec3 s=texture2D(t,clamp(vUv+vec2(rg.x*0.03,f*f*0.32),0.0,1.0)).rgb*(1.0-f*0.55);mx=max(mx,s);av+=s;}rc=mix(av/7.0,mx,0.55);ok=1.0;}'+
      'else{'+
        'if(uRefl>2.5&&uMirOn>0.5){float wy=dot(uCamY.xyz,P)+uCamY.w;if(abs(wy-uMirY)<0.4){vec4 mc=uMirVP*vec4(wp.x,uMirY,wp.y,1.0);rc=texture2D(tMir,mc.xy/mc.w*0.5+0.5+rg*0.03).rgb;ok=1.0;}}'+
        'if(ok<0.5){vec3 R=reflect(V,Nv);float st=0.06+z*0.012;vec3 q=P+R*st*wh(gl_FragCoord.xy+fract(uWT));'+
          'for(int i=0;i<36;i++){q+=R*st;st*=1.1;vec2 su=wpr(q);if(su.x<0.0||su.x>1.0||su.y<0.0||su.y>1.0||q.z>-0.3)break;'+
            'float dz=-q.z-lz(su);if(dz>0.0&&dz<max(0.6,st*3.0)){vec3 a=q-R*st,b=q;for(int k=0;k<5;k++){vec3 m=(a+b)*0.5;if(-m.z-lz(wpr(m))>0.0)b=m;else a=m;}'+
              'vec2 hu=wpr(b);vec2 e=smoothstep(vec2(0.0),vec2(0.07),hu)*smoothstep(vec2(1.0),vec2(0.93),hu);rc=texture2D(t,hu).rgb;ok=e.x*e.y;break;}}'+
          'rc=mix(uSkyC,rc,ok);ok=1.0;}}'+
      'c.rgb+=rc*amt*ok;}}}';
const AO_COPY=AO_HEAD+WET_GLSL+'uniform sampler2D t;uniform sampler2D tAO;uniform vec2 uAORes;uniform float uRim;uniform vec3 uRimCol;uniform float uHaze;uniform vec3 uHazeCol;uniform vec3 uHazeD;uniform vec4 uCamY;uniform float uRay;uniform vec2 uSunUV;uniform float uSunVis;uniform vec3 uRayCol;'+
  'void main(){vec4 c=texture2D(t,vUv);'+
  'if(texture2D(tD,vUv).x<0.99999){float z=lz(vUv);'+   // ท้องฟ้าไม่ต้องทำ
  'if(uAO>0.001){float s=0.0,w=0.0;vec2 px=1.0/uAORes;'+
    'for(int x=0;x<4;x++)for(int y=0;y<4;y++){vec2 uv=vUv+(vec2(float(x),float(y))-1.5)*px;'+
      'float k=1.0/(1.0+abs(lz(uv)-z)*8.0/z);s+=texture2D(tAO,uv).r*k;w+=k;}'+
    'c.rgb*=s/max(w,1e-4);}'+
  WET_MAIN+
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
  '{float q=c.r+c.g+c.b;if(!(q>=0.0&&q<1e4))c.rgb=vec3(0.0);}c.a=1.0;gl_FragColor=c;}';
// ===== TAA (ลบขอบหยักแบบสะสมหลายเฟรม) — กราฟิกสูงเท่านั้น • ปิดด้วย ?notaa =====
// ขั้นตอน: taaBegin (js/37) สั่นกล้อง (Halton 8 ค่า ต่ำกว่าพิกเซล) ก่อนวาดฉาก → ใน FXPass ผสมภาพฉากกับประวัติ (ย้อนตำแหน่งด้วยการขยับของกล้อง + ความลึก) แล้วเลิกสั่นก่อนวาดเอฟเฟกต์ (อนุภาค/เอฟเฟกต์ไม่สั่น)
// กันภาพเงา (ghost): ตรึงประวัติให้อยู่ในช่วงสีของพิกเซลรอบข้าง 3×3 + เทียบความลึกประวัติ (เก็บใน alpha) → วัตถุที่ขยับ/พื้นที่เพิ่งเปิดเห็น = ใช้ภาพใหม่
const TAA={on:!/[?&]notaa\b/.test(location.search),alpha:0.1,sharp:0.25,jit:false,applied:false,n:0,valid:0,i:0,rt:[null,null],w:0,h:0,quad:null,cur:new THREE.Matrix4(),prev:new THREE.Matrix4(),inv:new THREE.Matrix4()};
const TAA_FRAG='vec3 gd(vec3 v){float q=v.r+v.g+v.b;return (q>=0.0&&q<1e4)?v:vec3(0.0);}uniform sampler2D tCur;uniform sampler2D tHist;uniform sampler2D tD;uniform mat4 uInvVP;uniform mat4 uPrevVP;uniform vec2 uPx;uniform float uAlpha;uniform float uSharp;uniform float uValid;uniform float uNear;uniform float uFar;varying vec2 vUv;'+
  'void main(){vec3 c=gd(texture2D(tCur,vUv).rgb);float dp=texture2D(tD,vUv).x;'+
  'float z=dp>=0.99999?uFar:(uNear*uFar)/(uFar-dp*(uFar-uNear));'+
  'vec3 mn=c,mx=c,sm=c;'+
  'for(int i=0;i<8;i++){float a=float(i)*0.7853982;vec2 o=vec2(cos(a),sin(a));o=o/max(abs(o.x),abs(o.y));vec3 n=gd(texture2D(tCur,vUv+o*uPx).rgb);mn=min(mn,n);mx=max(mx,n);sm+=n;}'+
  'vec4 w=uInvVP*vec4(vUv*2.0-1.0,dp*2.0-1.0,1.0);w/=w.w;vec4 pc=uPrevVP*w;vec2 pu=pc.xy/pc.w*0.5+0.5;'+
  'vec4 h=texture2D(tHist,pu);h.rgb=gd(h.rgb);'+
  'float ok=uValid*step(0.0,pu.x)*step(pu.x,1.0)*step(0.0,pu.y)*step(pu.y,1.0)*step(0.0,pc.w);'+
  'float rej=dp>=0.99999?0.0:step(0.05*pc.w+0.25,abs(h.a-pc.w));'+   // ความลึกประวัติไม่ตรง = วัตถุขยับ/เพิ่งเปิดเห็น
  'vec3 hc=clamp(h.rgb,mn,mx);'+
  'float ld=abs(dot(hc-c,vec3(0.299,0.587,0.114)))/(dot(c,vec3(0.299,0.587,0.114))+0.25);'+
  'float a=max(max(uAlpha,1.0-ok),max(rej,smoothstep(0.25,1.0,ld)*0.4));'+
  'vec3 o=mix(hc,c,min(a,1.0));'+
  'o+=(c-sm/9.0)*uSharp;'+   // ชดเชยความนุ่มของการสะสม
  'gl_FragColor=vec4(max(o,0.0),z);}';   // alpha = ความลึกตามแนวสายตา ไว้ให้เฟรมถัดไป
const _taaH=(i,b)=>{let f=1,r=0;while(i>0){f/=b;r+=f*(i%b);i=Math.floor(i/b);}return r;};
function taaWanted(){return TAA.on&&gq('aa')===2&&screen==='game'&&rpass.scene===scene&&SOFTU.uSoftOn.value>0.5;}
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
function taaQuad(){if(!TAA.quad)TAA.quad=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:{tCur:{value:null},tHist:{value:null},tD:{value:null},uInvVP:{value:TAA.inv},uPrevVP:{value:TAA.prev},uPx:{value:new THREE.Vector2()},uAlpha:{value:0.1},uSharp:{value:0.25},uValid:{value:0},uNear:{value:0.1},uFar:{value:700}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:TAA_FRAG,depthTest:false,depthWrite:false}));return TAA.quad;}
// link the TAA program before the match (lobby, js/51): it was the first-countdown-frame stall (~115 ms getProgramParameter)
function taaWarm(){if(!TAA.on||TAA.warm)return;TAA.warm=1;const rt=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,depthBuffer:false}),prev=gl.getRenderTarget();
  try{gl.setRenderTarget(rt);taaQuad().render(gl);}catch(e){console.warn('taa warm',e);}finally{gl.setRenderTarget(prev);rt.dispose();}}
function taaResolve(r,read){
  if(!TAA.jit)return null;
  const w=read.width,h=read.height;
  taaQuad();
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
    this.cp=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:Object.assign({t:{value:null},tD:{value:null}},SOFTU,AOU,WETU),vertexShader:vs,fragmentShader:AO_COPY,depthTest:false,depthWrite:false}));}
  setSize(w,h){AO_RT.setSize(Math.max(1,w>>1),Math.max(1,h>>1));AOU.uAORes.value.set(AO_RT.width,AO_RT.height);}
  render(r,write,read){const ac=r.autoClear;r.autoClear=false;
    if(typeof ffMistFrame==='function')ffMistFrame();   // หมอกป่า fcs (js/28): โชว์เฉพาะตอนอยู่แมพนั้น
    const kw=PAINT.pass&&PAINT.pass.enabled&&PAINT.fxAfter;   // painterly filter (js/77) on the scene only, particles drawn after it (else it smooths sparks away)
    if(!SOFTU.uSoftOn.value){if(kw){this.needsSwap=true;paintKuw(r,read.texture,write,read.width,read.height);r.setRenderTarget(write);}else{this.needsSwap=false;r.setRenderTarget(read);}r.render(fxScene,cam);r.autoClear=ac;return;}
    // นุ่ม: ก๊อปภาพฉากไปอีกแผ่น แล้ววาดเอฟเฟกต์ทับโดยอ่านความลึกจากแผ่นเดิม (อ่าน+เขียนแผ่นเดียวกันไม่ได้)
    this.needsSwap=true;SOFTU.uDepth.value=read.depthTexture;SOFTU.uRes.value.set(read.width,read.height);SOFTU.uNear.value=cam.near;SOFTU.uFar.value=cam.far;
    const th=Math.tan(cam.fov*Math.PI/360);AOU.uTan.value.set(th*cam.aspect,th);
    this.ao.material.uniforms.tD.value=this.cp.material.uniforms.tD.value=read.depthTexture;
    if(AOU.uAO.value>0.001){r.setRenderTarget(AO_RT);this.ao.render(r);AOU.tAO.value=AO_RT.texture;}
    const F=rpass.scene.fog,e=cam.matrixWorld.elements;AOU.uCamY.value.set(e[1],e[5],e[9],e[13]);WETU.uCamX.value.set(e[0],e[4],e[8],e[12]);WETU.uCamZ.value.set(e[2],e[6],e[10],e[14]);WETU.uProj.value.copy(cam.projectionMatrix);
    AOU.uHaze.value=F&&F.isFog?GFX.haze:0;if(F){AOU.uHazeCol.value.copy(F.color);AOU.uHazeD.value.x=GFX.hazeK/Math.max(F.far||1,1);}
    AOU.uHazeD.value.y=GFX.hazeH;if(typeof lookRaysFrame==='function')lookRaysFrame();if(typeof ambFrame==='function')ambFrame();   // ฝุ่น/หมอกลอย (js/75)
    AOU.uRim.value=GFX.rim;AOU.uRimCol.value.copy(moonL.color).multiplyScalar(GFX.rim);AOU.uHazeD.value.z=GFX.rimZ;
    const ta=taaResolve(r,read),src=ta||read.texture;   // TAA: ภาพฉากที่ผสมประวัติแล้ว (กราฟิกสูง)
    this.cp.material.uniforms.t.value=src;HAZE_U.uScene.value=src;
    if(kw){const t=paintRT(read.width,read.height);r.setRenderTarget(t);this.cp.render(r);paintKuw(r,t.texture,write,read.width,read.height);}else{r.setRenderTarget(write);this.cp.render(r);}
    r.setRenderTarget(write);taaEnd();if(typeof blobPre==='function')blobPre();r.render(fxScene,cam);if(typeof blobFire==='function')blobFire(r,write);r.autoClear=ac;}   // blob = ไฟก้อนหลอมรวม (js/77)
}
const fxPass=new FXPass();composer.addPass(fxPass);
const bloom=new UnrealBloomPass(new THREE.Vector2(512,512),0.72,0.5,0.86);
// เรนเดอร์แสงฟุ้งที่ครึ่งความละเอียด (ดูแทบไม่ต่าง แต่เร็วขึ้นมาก)
{const bs=bloom.setSize.bind(bloom);bloom.setSize=(w,h)=>bs(Math.max(1,Math.round(w/2)),Math.max(1,Math.round(h/2)));}
// พิกเซลเสีย (NaN/inf) จุดเดียวจะถูก blur กระจายจนจอดำ/ขาวทั้งจอ → ตัดทิ้งก่อนเข้า bloom
bloom.materialHighPassFilter.fragmentShader=bloom.materialHighPassFilter.fragmentShader.replace('vec4 texel = texture2D( tDiffuse, vUv );','vec4 texel = texture2D( tDiffuse, vUv );float nq=texel.r+texel.g+texel.b+texel.a;if(!(nq>=0.0&&nq<1e4))texel=vec4(0.0);');
composer.addPass(bloom);
// โทนสีทั้งจอ + เอฟเฟกต์ทั้งจอ: แฟลชสี, เบลอพุ่งเข้าหาจุด (radial blur ตอนอัลติ), สีเหลื่อม (chromatic) ตอนกระแทก, ขอบจอมืด/แดงตอนโดนตี
const GRADEU={tDiffuse:{value:null},uFlash:{value:new THREE.Color(0,0,0)},uImp:{value:0},uImpM:{value:0},uRad:{value:0},uCtr:{value:new THREE.Vector2(0.5,0.5)},uChr:{value:0},uVig:{value:0.28},uHurt:{value:0},uSat:{value:1.1},uOn:{value:1},uCon:{value:1},uLo:{value:new THREE.Vector3(1,1,1)},uHi:{value:new THREE.Vector3(1,1,1)}};
class GradePass extends Pass{
  constructor(){super();this.needsSwap=true;
    this.q=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:GRADEU,depthTest:false,depthWrite:false,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader:'uniform sampler2D tDiffuse;uniform vec3 uFlash;uniform float uImp;uniform float uImpM;uniform float uRad;uniform vec2 uCtr;uniform float uChr;uniform float uVig;uniform float uHurt;uniform float uSat;uniform float uCon;uniform vec3 uLo;uniform vec3 uHi;varying vec2 vUv;'+
        'void main(){vec2 uv=vUv;vec3 c;'+
        'if(uRad>0.001){vec2 d=uv-uCtr;c=vec3(0.0);for(int i=0;i<10;i++){float t=float(i)/9.0;c+=texture2D(tDiffuse,uCtr+d*(1.0-uRad*0.16*t)).rgb;}c/=10.0;}else c=texture2D(tDiffuse,uv).rgb;'+
        'if(uChr>0.001){vec2 o=(uv-0.5)*uChr*0.006;c.r=mix(c.r,texture2D(tDiffuse,uv+o).r,0.85);c.b=mix(c.b,texture2D(tDiffuse,uv-o).b,0.85);}'+
        'float l=dot(c,vec3(0.2126,0.7152,0.0722));c=max(mix(vec3(l),c,uSat),0.0);'+
        'c=mix(c*vec3(0.9,0.95,1.12),c,smoothstep(0.0,0.35,l));'+   // เงาอมฟ้าเล็กน้อย
        'c=pow(max(c,vec3(0.0))/0.18,vec3(uCon))*0.18;c*=mix(uLo,uHi,smoothstep(0.03,0.8,dot(c,vec3(0.2126,0.7152,0.0722))));'+   // คอนทราสต์รอบเทา 18% + ย้อมสีเงา/ไฮไลต์ (Look js/74)
        // Impact frame (อนิเมะ): ภาพกลับขาว-ดำคอนทราสต์สูง (ของมืด = ขาว) + เส้นพุ่งออกจากจุดสนใจ uCtr — js/44 impactFrame
        'if(uImp>0.001){float li=dot(c,vec3(0.2126,0.7152,0.0722));vec2 dd=(uv-uCtr)*vec2(1.7,1.0);float rr=length(dd),an=atan(dd.y,dd.x);'+
          'float ray=smoothstep(0.62,0.92,fract(sin(floor(an*26.0)*127.1)*43758.5453))*smoothstep(0.22,0.6,rr);'+
          'float ink=1.0-smoothstep(0.26,0.5,li);vec3 ic=mix(vec3(0.0,0.02,0.015),vec3(0.9,1.0,0.92),max(ink,ray*0.95));if(uImpM>0.5)ic=mix(vec3(0.97),vec3(0.0),max(ink,ray*0.8));c=mix(c,ic,uImp);}'+
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
// Graphics settings (user 2026-11-24, guides/GRAPHICS-SETTINGS-PLAN.md): presets Low / Medium / High (default) / Ultra / Cinematic
// + Custom = any option changed. Every feature reads gq('key') = level index. dyn = old "auto": qualTick lowers things on slow frames.
const GQ_OPT=[   // [key, group, label, level names]
  ['res','จอภาพ','ความละเอียด',['Low','Medium','High','Ultra']],
  ['dyn','จอภาพ','ลดเองเมื่อเฟรมตก',['ปิด','เปิด']],
  ['shadow','แสงและเงา','เงา',['ปิด','Low','Medium','High','Ultra']],
  ['pcss','แสงและเงา','เงานุ่ม',['ปิด','เปิด']],
  ['shdist','แสงและเงา','ระยะเงา (ไกล = เงาเบลอขึ้น)',['ใกล้','ปกติ','ไกล','ไกลมาก']],
  ['ao','แสงและเงา','เงาซอกมุม + ลำแสง',['ปิด','เปิด']],
  ['bloom','ภาพรวม','แสงฟุ้ง (Bloom)',['ปิด','เปิด']],
  ['grade','ภาพรวม','ปรับสีภาพ',['ปิด','เปิด']],
  ['aa','ภาพรวม','ลบขอบหยัก',['ปิด','เร็ว','TAA']],
  ['paint','ภาพรวม','ฟิลเตอร์ภาพวาด',['ปิด','เร็ว','เต็ม']],
  ['softp','ภาพรวม','อนุภาคขอบนุ่ม',['ปิด','เปิด']],
  ['grass','โลก','หญ้า',['ปิด','Low','Medium','High','Cinematic']],
  ['grdist','โลก','ระยะหญ้า',['ใกล้','ปกติ','ไกล','ไกลมาก']],
  ['surf','โลก','ผิววัสดุละเอียด',['ปิด','เปิด']],
  ['amb','โลก','ฝุ่น/หมอกบรรยากาศ',['ปิด','Low','Medium','High']],
  ['refl','โลก','เงาสะท้อนพื้นเปียก (ฝน)',['ปิด','หลอก (เร็ว)','SSR','Planar']],
  ['water','โลก','น้ำทะเล',['Low','High','Cinematic']],
  ['detail','โลก','ฉากไกล (โหลดแมพถัดไป)',['Low','High']],
  ['dist','โลก','ระยะของชิ้นเล็ก',['ใกล้','กลาง','ไกล']],
  ['particles','เอฟเฟกต์','อนุภาค',['Low','Medium','High','Cinematic']],
  ['debris','เอฟเฟกต์','เศษซาก/รอยบนพื้น',['Low','Medium','High','Cinematic']],
  ['flash','เอฟเฟกต์','แสงวาบเต็มจอ',['ปิด','เปิด']],
];
const GQ_PRE={
  low:      {refl:0,water:0,shdist:1,grdist:1,res:0,dyn:0,shadow:0,pcss:0,ao:0,bloom:0,grade:0,aa:0,paint:0,softp:0,grass:0,surf:0,amb:0,detail:0,dist:0,particles:0,debris:0,flash:0},
  medium:   {refl:1,water:0,shdist:1,grdist:1,res:1,dyn:0,shadow:2,pcss:0,ao:1,bloom:1,grade:1,aa:1,paint:1,softp:1,grass:2,surf:1,amb:2,detail:1,dist:2,particles:1,debris:1,flash:1},
  high:     {refl:2,water:1,shdist:1,grdist:1,res:2,dyn:0,shadow:3,pcss:1,ao:1,bloom:1,grade:1,aa:2,paint:2,softp:1,grass:3,surf:1,amb:3,detail:1,dist:2,particles:2,debris:2,flash:1},
  ultra:    {refl:2,water:1,shdist:2,grdist:2,res:3,dyn:0,shadow:4,pcss:1,ao:1,bloom:1,grade:1,aa:2,paint:2,softp:1,grass:3,surf:1,amb:3,detail:1,dist:2,particles:2,debris:2,flash:1},
  cinematic:{refl:3,water:2,shdist:2,grdist:2,res:3,dyn:0,shadow:4,pcss:1,ao:1,bloom:1,grade:1,aa:2,paint:2,softp:1,grass:4,surf:1,amb:3,detail:1,dist:2,particles:3,debris:3,flash:1},
};
const GQ_NAME={low:'Low',medium:'Medium',high:'High',ultra:'Ultra',cinematic:'Cinematic',custom:'Custom'};
const GQ=(()=>{let o=null;try{o=JSON.parse(store('wd_gfx2')||'null');}catch(e){}
  if(!o||!o.v){const old=store('wd_gfx');o={p:old==='low'?'low':'high'};o.v=Object.assign({},GQ_PRE[o.p]);}   // old saves: low stays low, auto/high → High (user: High = default)
  o.v=Object.assign({},GQ_PRE[o.p]||GQ_PRE.high,o.v);if(o.p!=='custom'&&!GQ_PRE[o.p])o.p='high';return o;})();
function gq(k){return GQ.v[k]|0;}
function gqSave(){store('wd_gfx2',JSON.stringify(GQ));}
function gqPreset(p){if(!GQ_PRE[p])return;GQ.p=p;GQ.v=Object.assign({},GQ_PRE[p]);gqSync();}
function gqSet(k,v){GQ.v[k]=v;GQ.p=Object.keys(GQ_PRE).find(p=>GQ_OPT.every(([q])=>GQ_PRE[p][q]===GQ.v[q]))||'custom';gqSync();}
// QUAL.mode is kept for old code / test scripts: 'low' | 'auto' (dyn on) | 'high'. A script that sets QUAL.mode itself and calls
// applyQuality() picks the matching preset (high → High, low → Low, auto → Medium + dyn).
function gqMode(){return GQ.p==='low'?'low':gq('dyn')?'auto':'high';}
function gqSync(){QUAL.mode=QUAL._m=gqMode();QUAL.scale=1;QUAL.lvl=0;QUAL.cs=0;}
const QUAL={mode:'high',_m:'high',scale:1,acc:0,n:0,good:0,frame:0,lvl:0,cpu:0,cacc:0,cs:0,clA:0};
gqSync();
const QUAL_NAME={auto:'อัตโนมัติ',high:'สูง',low:'ประหยัด'};
const qDyn=n=>gq('dyn')&&QUAL.lvl>=n;   // dyn mode stepped down to lvl ≥ n
function qualPR(){
  const dpr=window.devicePixelRatio||1,r=gq('res');
  const b=r===0?Math.min(1,dpr)*0.7:r===1?Math.min(1,dpr):r===2?Math.min(1.5,dpr):Math.min(2,dpr*1.5);
  return gq('dyn')?b*QUAL.scale:b;
}
function gqShadowSize(id){const s=gq('shadow');return s>=4?4096:s===3&&id!=='castle'&&id!=='greathall'?3072:2048;}
function applyQuality(){
  if(QUAL.mode!==QUAL._m){const m=QUAL.mode,lv=QUAL.lvl,sc=QUAL.scale;gqPreset(m==='low'?'low':m==='auto'?'medium':'high');if(m==='auto'){GQ.v.dyn=1;GQ.p='custom';gqSync();QUAL.lvl=lv;QUAL.scale=sc;}}   // set from outside (old scripts)
  try{SMOKE_K=gq('particles')>=3?1:0.4;}catch(e){}   // Cinematic: smoke as before the 2026-11-18 cut
  try{BF_LIFE=gq('debris')>=3?25:5;}catch(e){}        // Cinematic: ground marks / debris linger (before 2026-11-11 they stayed all match) • try: later files (TDZ at boot)
  try{const ms=gqShadowSize(MAPID);if(moonL.shadow.mapSize.x!==ms){moonL.shadow.mapSize.set(ms,ms);if(moonL.shadow.map){moonL.shadow.map.dispose();moonL.shadow.map=null;}}shadowSoft();}catch(e){}
  const pr=qualPR();gl.setPixelRatio(pr);composer.setPixelRatio(pr);
  // เปิด/ปิดเงา = คอมไพล์ shader ใหม่ทุกตัว (ค้าง ~2 วิ) → ปิดจริงเฉพาะโหมดประหยัด • อัตโนมัติขั้น 2 แค่อัปเดตเงาห่างขึ้น (renderGame js/37)
  const sh=gq('shadow')>0;
  if(gl.shadowMap.enabled!==sh){
    gl.shadowMap.enabled=sh;
    for(const sc of [scene,typeof stage!=='undefined'?stage:null])if(sc)sc.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>m.needsUpdate=true);});
  }
  bloom.enabled=!!gq('bloom')&&!qDyn(1);
  gradePass.enabled=!!gq('grade');
  aaPass.enabled=GFX.aa&&gq('aa')>0&&!qDyn(2);
  // soft particles: ปิดเมื่อกราฟิกประหยัด หรืออัตโนมัติลดถึงขั้นปิดเงา (ประหยัดการก๊อปภาพเต็มจอ 1 ครั้ง)
  const soft=gq('softp')&&!qDyn(2)?1:0;
  if(SOFTU.uSoftOn.value!==soft){SOFTU.uSoftOn.value=soft;for(const m of FXMATS)m.depthTest=!soft;}
  // เงาตามซอกมุม: สูง = เปิด / อัตโนมัติ = เปิดจนกว่าเครื่องเริ่มช้า (lvl≥1) / ประหยัด = ปิด (ทำงานเฉพาะตอน soft เปิด)
  AOU.uAO.value=soft&&gq('ao')&&!qDyn(1)?AO_ON.strength:0;
  if(typeof lookRays==='function')lookRays();   // ลำแสง: เปิดตามกราฟิกเหมือน AO
  if(typeof kuwOn==='function'&&PAINT&&PAINT.pass)PAINT.pass.enabled=kuwOn();   // painterly filter (js/77): off on low / auto lvl>=1
  if(typeof surfQuality==='function')surfQuality();   // ผิววัสดุ (js/76): สูง/อัตโนมัติต้น = เปิด
  if(typeof resize==='function'&&SW)resize();
}
// ปรับความละเอียดอัตโนมัติ: เฟรมช้า (<~40fps) ลดลงทีละขั้น / ลื่นต่อเนื่องค่อยเพิ่มกลับ
function qualTick(dt){
  if(!gq('dyn')||(screen!=='game'&&screen!=='menu'&&screen!=='lobby')||dt>0.2)return;   // เมนู/ล็อบบี้ก็ลดเองได้ เครื่องอ่อนจะได้ไม่แลคตั้งแต่หน้าแรก
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
const qualCS=()=>Math.max(2-gq('dist'),gq('dyn')?QUAL.cs:0);   // CPU savers: small far props hidden + cloth every n frames
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
// ---- clear midday sky (user refs 2026-11-24: anime key-art noon) — baked ONCE into a 2048x1024 equirect texture on the GPU ----
// sky: deep blue zenith → pale horizon, brighter around/under the sun, deeper on the far side, hazy far hills, faint cirrus
// cumulus: side-view clouds in (azimuth, elevation) space = smooth-union puffs + 3D-noise cauliflower edges + flat bases,
//   lit by the real sun direction: crisp lit/shade split, lavender shade, darker base, silver rim when backlit
// SKYC.k = sky brightness in game (white clouds vs the bloom threshold: Look 'clear' bloomT 1.25) • tune: SKYC.* then WD.skyBake() (re-bakes + refreshes the Look light) • cost: one draw at load (~ms), then a plain texture
const SKYC={seed:20261124,groups:32,loose:14,k:0.95,sun:[74,100,-64],zen:'#1748a8',mid:'#3c80d8',hor:'#bfdcf4',horS:'#e6f2fb',halo:'#eef7ff',ground:'#9fbcd0',
  hill:'#9dc2e2',hill2:'#86b0d6',lit:'#ffffff',shade:'#bcc7e6',base:'#a6b2db',rim:'#ffffff',cirrus:0.22};
function skyBakeClear(){
  const C=SKYC,NC=64;let sd=C.seed;const R=()=>(sd=(sd*1664525+1013904223)>>>0)/4294967296,D=Math.PI/180;
  // clouds live on a flat layer (base altitude ~1, units = cloud-base heights) and are seen in perspective:
  // groups of clouds (clusters) + a few loose ones; far clouds = small, low, piled into banks on the horizon; near = big, high
  const P=[],add=(x,z,A,w,h)=>{const r=Math.hypot(x,z);if(r<1.6)return;const e=Math.atan2(A,r);if(e<0.6*D||Math.atan2(w,r)<0.7*D)return;   // skip dots
    P.push({r,v:new THREE.Vector4(((Math.atan2(z,-x)/(2*Math.PI))+1)%1,e,Math.atan2(w,r),Math.atan2(A+h,r)-e)});};
  for(let g=0;g<C.groups;g++){const th=R()*Math.PI*2,r0=g<C.groups*0.75?2.3+11*Math.pow(R(),1.1):12+22*R(),A=0.85+R()*0.35,m=2+Math.floor(R()*(r0<5?3:6)),sp=0.8+r0*0.1,big=R()<0.45;
    for(let k=0;k<m;k++){const w=(big?0.55+R()*0.7:0.35+R()*0.5)*(k?0.85:1.2),h=w*(0.4+R()*0.55)*(k?1:1.25);
      const l=(R()-0.5)*2.4*sp,rr=r0+(R()-0.5)*0.35*sp;add(Math.cos(th)*rr-Math.sin(th)*l,Math.sin(th)*rr+Math.cos(th)*l,A+(R()-0.5)*0.06,w,h);}}   // spread sideways, little in depth (same elevation band)
  for(let i=0;i<C.loose;i++){const th=R()*Math.PI*2,r=2+30*Math.pow(R(),1.1),w=0.2+R()*0.45;add(Math.cos(th)*r,Math.sin(th)*r,0.9+R()*0.3,w,w*(0.22+R()*0.25));}   // loose = wide flat scraps
  P.sort((a,b)=>a.r-b.r);   // near first: the shader takes the first cloud covering a pixel = correct overlap
  const cl=P.slice(0,NC).map(o=>o.v);   // x = u (0..1), y = base elevation, z = half width, w = height (radians)
  while(cl.length<NC)cl.push(new THREE.Vector4(0,0,0,0));
  const col=k=>new THREE.Color(C[k]),U={uC:{value:cl},uSun:{value:new THREE.Vector3(...C.sun).normalize()},uCir:{value:C.cirrus}};
  for(const k of ['zen','mid','hor','horS','halo','ground','hill','hill2','lit','shade','base','rim'])U['c_'+k]={value:col(k)};
  const mat=new THREE.ShaderMaterial({uniforms:U,depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`#define NC ${NC}
uniform vec4 uC[NC];uniform vec3 uSun;uniform float uCir;
uniform vec3 c_zen,c_mid,c_hor,c_horS,c_halo,c_ground,c_hill,c_hill2,c_lit,c_shade,c_base,c_rim;varying vec2 vUv;
float h11(float n){return fract(sin(n)*43758.5453);}
float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float n=dot(i,vec3(1.,57.,113.));
  return mix(mix(mix(h11(n),h11(n+1.),f.x),mix(h11(n+57.),h11(n+58.),f.x),f.y),mix(mix(h11(n+113.),h11(n+114.),f.x),mix(h11(n+170.),h11(n+171.),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n3(p);p=p*2.07+vec3(1.7,9.2,3.1);a*=.5;}return s;}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
vec3 dirOf(vec2 q){float ph=q.x*6.2831853,e=q.y;return vec3(-cos(ph)*cos(e),sin(e),sin(ph)*cos(e));}
// one cloud: signed distance (radians), Y = height above its base • c = (u, base elev, half width, height), ci = seed
float cloudSdf(vec2 q,vec3 d,vec4 c,float ci,out float Y){
  float du=q.x-c.x;du-=floor(du+.5);float X=du*6.2831853*cos(q.y);Y=q.y-c.y;
  if(abs(X)>c.z*1.5+c.w||Y<-.02||Y>c.w*2.2)return 1.;
  // per-cloud character: ty < .45 = flat broken fragment, else heaped cumulus with 0-3 off-centre towers; pk = where the bulk sits
  float s=1.,ty=h11(ci+77.),pk=h11(ci+91.),fl=ty<.45?.55:1.;
  for(int k=0;k<15;k++){float fk=float(k),a=h11(ci+fk),b=h11(ci+fk+17.),r2=h11(ci+fk+33.);vec2 ct;float r;
    if(k<10){float t=fk/9.,env=pow(max(0.,1.-abs(t-(.25+.5*pk))*1.6),.7);   // lopsided envelope, random puff sizes (not a symmetric dome)
      ct.x=(t-.5)*1.8*c.z+(a-.5)*.3*c.z;r=c.w*fl*(.18+.62*env*(.45+.8*b));ct.y=r*(.25+.5*r2);}
    else{if(ty<.45||h11(ci+fk+51.)>(ty-.45)*1.6)continue;ct.x=((pk-.5)*.8+(a-.5)*.7)*c.z;r=c.w*(.22+.3*b);ct.y=c.w*(.45+.6*r2);}
    s=smin(s,length(vec2(X,Y)-ct)-r,c.w*.2);}
  float f=1./max(c.w*12.,.12);vec3 o=vec3(ci*.13,ci*.07,0.);
  s=max(s,-Y-(fbm(d*9.*f+o+3.)-.5)*c.w*.18);   // base: mostly flat, a little ragged
  if(s<c.w*.45){float up=smoothstep(0.,c.w*.35,Y);
    s+=(fbm(d*5.*f+o+7.)-.42)*c.w*(ty<.45?.75:.45);   // big break-up: irregular outline, fragments tear apart
    s+=(fbm(d*16.*f+o)-.5)*c.w*.36*(.3+.7*up)+(fbm(d*45.*f+o)-.5)*c.w*.07*up;}   // cauliflower lumps
  return s;}
// first cloud (list is near→far) from index 'from' that covers this pixel → idx (-1 = none)
float frontCloud(vec2 q,vec3 d,int from,out int idx,out float vert,out float hh){idx=-1;vert=0.;hh=.1;
  for(int i=0;i<NC;i++){if(i<from)continue;vec4 c=uC[i];if(c.w<=0.)continue;float Y,s=cloudSdf(q,d,c,float(i)*31.7,Y);
    if(s<.0016){idx=i;vert=Y;hh=c.w;return s;}}
  return 1.;}
vec4 uCi(int idx){for(int i=0;i<NC;i++)if(i==idx)return uC[i];return vec4(0.);}
// shade the front cloud from 'from' → rgb + alpha in a, idx out
vec3 shadeCloud(vec2 q,vec3 d,float e,int from,out float a,out int idx){float vert,hh;a=0.;float s=frontCloud(q,d,from,idx,vert,hh);if(idx<0)return vec3(0.);
  vec4 c=uCi(idx);float ci=float(idx)*31.7,ep=max(.003,hh*.04),Y2;
  float sx=cloudSdf(q+vec2(ep/(6.2831853*cos(e)),0.),dirOf(q+vec2(ep/(6.2831853*cos(e)),0.)),c,ci,Y2),sy=cloudSdf(q+vec2(0.,ep),dirOf(q+vec2(0.,ep)),c,ci,Y2);
  vec2 n=normalize(vec2(sx-s,sy-s)+1e-7);   // outward normal (sdf grows outward)
  float ph=q.x*6.2831853;vec3 tE=vec3(sin(ph),0.,cos(ph)),tN=vec3(cos(ph)*sin(e),cos(e),-sin(ph)*sin(e));
  vec2 L=vec2(dot(uSun,tE),dot(uSun,tN));L=length(L)>1e-3?normalize(L):vec2(0.,1.);
  float front=-dot(d,uSun),v01=clamp(vert/hh,0.,1.);
  float shv=dot(n,L)*.5+v01*.62-.3+front*.25;float lit=smoothstep(-.14,.42,shv);   // soft lit→shade blend (fluffy)
  vec3 cc=mix(c_shade,c_lit,lit);
  float depth=clamp(-s/(hh*.3),0.,1.);cc=mix(cc,cc*.94,depth*(1.-lit));
  cc=mix(c_base,cc,smoothstep(0.,hh*.4,vert));
  float edge=(1.-smoothstep(0.,hh*.05,-s))*smoothstep(hh*.05,hh*.3,vert);   // rim on sides/top, not the flat basecc=mix(cc,c_rim,edge*(max(0.,dot(d,uSun))*.7+.12));
  cc=mix(cc,c_hor,(1.-smoothstep(0.,.18,e))*.45);
  cc=mix(cc,c_lit,.28*(1.-depth));   // thin parts scatter light = brighter, softer look
  a=1.-smoothstep(-max(.0016,hh*.07),.0016,s);return cc;}   // soft feathered edge
void main(){
  vec2 q=vec2(vUv.x,(vUv.y-.5)*3.1415927);vec3 d=dirOf(q);float e=q.y;
  vec3 dh=normalize(vec3(d.x,0.,d.z)+1e-5),sh=normalize(vec3(uSun.x,0.,uSun.z));float az=dot(dh,sh)*.5+.5,t=clamp(e/1.5707963,0.,1.);
  vec3 sky=mix(mix(c_hor,c_horS,az*az),c_mid,smoothstep(0.,.2,t));sky=mix(sky,c_zen*mix(.9,1.05,az),smoothstep(.14,.8,t));
  float sd=max(dot(d,uSun),0.);sky=mix(sky,c_halo,pow(sd,6.)*.45+pow(sd,48.)*.35);
  if(e<0.)sky=mix(mix(c_hor,c_horS,az*.6),c_ground,smoothstep(0.,.25,-e));
  float ci=smoothstep(.56,.82,fbm(vec3(d.x*2.5,d.y*14.,d.z*2.5)+fbm(d*6.)*.8))*smoothstep(.25,.6,e)*uCir;sky=mix(sky,c_lit,ci);
  float hn=fbm(dh*5.),hn2=fbm(dh*11.+7.);
  if(e>-.02){float h1=(.4+2.8*hn*hn)*.01745,h2=(.1+1.6*hn2)*.01745;
    if(e<h1)sky=mix(sky,c_hill,.85);if(e<h2)sky=mix(sky,c_hill2,.9);}
  vec3 col=sky;
  if(e>0.){float a1,a2;int i1,i2;vec3 c1=shadeCloud(q,d,e,0,a1,i1);
    if(i1>=0){vec3 under=sky;if(a1<.999){vec3 c2=shadeCloud(q,d,e,i1+1,a2,i2);if(i2>=0)under=mix(sky,c2,a2);}col=mix(under,c1,a1);}}   // edge blends into the cloud behind, not the sky
  gl_FragColor=vec4(col,1.);}`});
  const rt=new THREE.WebGLRenderTarget(2048,1024,{generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,colorSpace:THREE.SRGBColorSpace,depthBuffer:false});
  rt.texture.wrapS=THREE.RepeatWrapping;
  const sc=new THREE.Scene(),cm=new THREE.OrthographicCamera(-1,1,1,-1,0,1),geo=new THREE.PlaneGeometry(2,2),m=new THREE.Mesh(geo,mat);m.frustumCulled=false;sc.add(m);
  const prev=gl.getRenderTarget(),tm=gl.toneMapping;gl.toneMapping=THREE.NoToneMapping;gl.setRenderTarget(rt);gl.render(sc,cm);gl.setRenderTarget(prev);gl.toneMapping=tm;
  geo.dispose();mat.dispose();
  rt.texture.userData.rt=rt;return rt.texture;
}
// debug: re-bake after changing SKYC (frees the old texture, updates the sky mesh + Look light)
function skyBake(o){Object.assign(SKYC,o||{});const old=SKY.clear;SKY.clear=skyBakeClear();
  if(SKY.mesh.material.map===old){SKY.mesh.material.map=SKY.clear;SKY.mesh.material.needsUpdate=true;}
  if(old&&old.userData.rt)old.userData.rt.dispose();
  if(typeof LOOK!=='undefined'&&LOOK){for(const k of Object.keys(LOOK.env))if(k.startsWith('clear|')){LOOK.env[k].dispose();delete LOOK.env[k];}lookRefresh();}
  return SKY.clear;}
const SKY={};
(function(){
  const grad=(stops)=>texCanvas(4,256,(g)=>{const r=g.createLinearGradient(0,0,0,256);stops.forEach(([p,c])=>r.addColorStop(p,c));g.fillStyle=r;g.fillRect(0,0,4,256);});
  SKY.night=grad([[0,'#03050f'],[0.45,'#141a3a'],[0.52,'#3a2f55'],[0.6,'#151a33'],[1,'#08090f']]);
  SKY.sunset=grad([[0,'#16234f'],[0.3,'#4a3f86'],[0.44,'#c06a8a'],[0.5,'#ff9a5a'],[0.53,'#ffd08a'],[0.6,'#6a4a5a'],[1,'#2a2030']]);
  SKY.noon=grad([[0,'#6fb6d4'],[0.3,'#a4dcd0'],[0.44,'#d6f0c8'],[0.5,'#f2f8cc'],[0.54,'#a8d49a'],[0.62,'#5f9a5c'],[1,'#2f5a3a']]);   // กลางวันในป่า (ลุคภาพวาด js/77): ฟ้าอมเขียว ขอบฟ้าสว่างนวล
  SKY.clear=skyBakeClear();   // clear midday sky, baked once on the GPU (skyBakeClear above)
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
  const sg2=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:hdr('#ffb070',0.48),opacity:0.47,transparent:true,fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));sg2.scale.set(125,125,1);SKY.sun.add(sg2);
  const sc=new THREE.Mesh(new THREE.CircleGeometry(18,40),new THREE.MeshBasicMaterial({color:hdr('#ffd48e',0.91),fog:false}));SKY.sun.add(sc);
  SKY.sun.position.set(300,45,-420);sc.lookAt(-300,-45,420);SKY.sun.visible=false;scene.add(SKY.sun);SKY.sunG=sg2;SKY.sunC=sc;
  // clear-sky sun (always faces the camera): white core + soft glow + faint rays (canvas texture); old disc/glow stay for sunset
  const sunTex=texCanvas(512,512,(g,W)=>{const c=W/2;let sd=7;const R=()=>(sd=(sd*1664525+1013904223)>>>0)/4294967296;
    g.globalCompositeOperation='lighter';
    for(let i=0;i<9;i++){const a=i/9*Math.PI*2+R()*0.4,L=c*(0.5+R()*0.45),w=0.035+R()*0.04,f=g.createRadialGradient(c,c,0,c,c,L);   // soft wide rays fading out
      f.addColorStop(0,'rgba(255,250,235,'+(0.07+R()*0.05)+')');f.addColorStop(1,'rgba(255,250,235,0)');g.fillStyle=f;
      g.beginPath();g.moveTo(c,c);g.lineTo(c+Math.cos(a-w)*L,c+Math.sin(a-w)*L);g.lineTo(c+Math.cos(a+w)*L,c+Math.sin(a+w)*L);g.closePath();g.fill();}
    const q=g.createRadialGradient(c,c,0,c,c,c);[[0,'rgba(255,255,255,1)'],[0.065,'rgba(255,255,252,1)'],[0.09,'rgba(255,250,235,0.85)'],[0.2,'rgba(255,244,220,0.38)'],[0.45,'rgba(255,240,220,0.1)'],[1,'rgba(255,240,220,0)']].forEach(([p,k])=>q.addColorStop(p,k));
    g.fillStyle=q;g.fillRect(0,0,W,W);});
  SKY.sunS=new THREE.Sprite(new THREE.SpriteMaterial({map:sunTex,color:hdr('#fffaf0',2.2),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false}));
  SKY.sunS.scale.set(250,250,1);SKY.sunS.visible=false;SKY.sun.add(SKY.sunS);
})();
const hemi=new THREE.HemisphereLight('#8fa6ff','#2a1f1a',0.55);scene.add(hemi);
scene.add(new THREE.AmbientLight('#404060',0.3));
const moonL=new THREE.DirectionalLight('#c4d2ff',1.0);
moonL.position.set(-55,95,-70);moonL.castShadow=true;moonL.shadow.bias=-0.0004;moonL.shadow.normalBias=0.03;
scene.add(moonL);scene.add(moonL.target);
// ทิศจากพื้นไปหาแสงหลัก (setSky ตั้ง) — shadowFollow ใช้วางแสงตามผู้เล่น
const LDIR=new THREE.Vector3(-55,95,-70).normalize();
function setSky(mode){
  const clear=mode==='clear',noon=mode==='day'||clear,day=noon||mode==='sunset';   // 'day' = painterly forest noon (js/77) • 'clear' = clear blue midday (file maps sky:'day')
  SKY.mode=mode;
  SKY.mesh.material.map=clear?SKY.clear:noon?SKY.noon:day?SKY.sunset:SKY.night;SKY.mesh.material.color.setScalar(clear?SKYC.k:1);SKY.mesh.material.needsUpdate=true;   // white = original sky image (overcast maps tint later in js/28)
  SKY.stars.visible=!day;SKY.moon.visible=!day;SKY.sun.visible=day;
  moonL.intensity=day?0.82:1;
  SKY.sunS.visible=clear;SKY.sunG.visible=SKY.sunC.visible=!clear;
  SKY.sunG.material.color.copy(hdr(clear?'#fff4d8':'#ffb070',0.48));SKY.sunC.material.color.copy(hdr(clear?'#fffbea':'#ffd48e',clear?1.4:0.91));   // white noon sun vs orange sunset sun
  if(noon){moonL.color.set('#fff0bc');moonL.position.set(74,100,-64);gl.toneMappingExposure=1.0;SKYB.sun.copy(moonL.position).normalize().multiplyScalar(520);}
  else if(day){moonL.color.set('#ffbe8a');moonL.position.set(80,45,-110);gl.toneMappingExposure=1.05;SKYB.sun.set(300,45,-420);}
  else{moonL.color.set('#c4d2ff');moonL.position.set(-55,95,-70);gl.toneMappingExposure=1.1;}
  LDIR.copy(moonL.position).normalize();
  SKY.day=day;if(typeof lookApply==='function')lookApply(day);   // แสงรอบตัวจากท้องฟ้า (js/74-look.js)
}
// ท้องฟ้าตามกล้อง (ผู้ใช้ 2026-11-08 "มองฟ้าไกล ๆ มีโดมมืด ทุกแมพ"): ทรงกลมฟ้ารัศมี 600 เคยอยู่กลางแมพ แต่กล้องมองได้ไกลสุด 700
// → ยืนห่างกลางแมพเกิน 100 หน่วยแล้วหันออก ฟ้าฝั่งไกลเลยระยะกล้อง โดนตัดเป็นวงมืด • ย้ายฟ้า/ดาว/ดวงจันทร์/พระอาทิตย์ตามกล้องทุกเฟรม (ไกลจากกล้องคงที่)
const SKYB={moon:SKY.moon.position.clone(),sun:SKY.sun.position.clone()};
function skyFollow(){const p=cam.position;SKY.mesh.position.copy(p);SKY.stars.position.copy(p);SKY.moon.position.copy(SKYB.moon).add(p);SKY.sun.position.copy(SKYB.sun).add(p);}
// ---------- เงาตามผู้เล่น ----------
// กล้องเงาครอบแค่พื้นที่รอบ ๆ ที่กล้องมอง (ไม่ใช่ทั้งแผนที่) → เงาคมขึ้นหลายเท่า โดยภาพเงาขนาดเท่าเดิม
// r = ครึ่งความกว้างพื้นที่เงา (หน่วย 3D, ไม่เกินขนาดแผนที่) • ahead = ดันจุดกลางไปข้างหน้ากล้อง (สัดส่วนของ r)
// ขยับเป็นขั้นเท่าพิกเซลเงาพอดี กันขอบเงาสั่นยิบ ๆ ตอนเดิน/หันกล้อง • on=false → กลับไปแบบคลุมทั้งแผนที่ (ตั้งใน buildWorld)
const SHD={on:true,r:36,rHigh:48,ahead:0.5,distK:[0.75,1,1.4,1.9]};   // distK = option shdist (same map size: farther = softer)
const _shF=new THREE.Vector3(),_shR=new THREE.Vector3(),_shU=new THREE.Vector3(),_shC=new THREE.Vector3(),_shY=new THREE.Vector3(0,1,0);
// เงา: three ใช้ MeshDepthMaterial ตัวเดียวกับทุกชิ้นที่ทอดเงา → สลับ instanced / skinned / ธรรมดา = คำนวณ shader ใหม่ (getParameters) ทุกครั้งที่สลับ
// (~17 ครั้งต่อเฟรมตอนสู้ 6v6, OPTIMIZE §R) → InstancedMesh / SkinnedMesh ใช้ depth material ของชนิดตัวเอง ภาพเงาเท่าเดิม • ข้ามชิ้นที่ต้องตัดขอบด้วย alpha (three ทำสำเนาให้เอง)
// เรียกจาก frame() (js/37) ทุก 30 เฟรม — ชิ้นใหม่ระหว่างนั้นแค่ช้าเท่าเดิมไม่กี่เฟรม
const SHD_DM={};
function shadowDepthSplit(){if(!gl.shadowMap.enabled)return;
  scene.traverse(o=>{if(!o.castShadow||o.customDepthMaterial||!(o.isInstancedMesh||o.isSkinnedMesh))return;const m=o.material;
    if(!m||Array.isArray(m)||m.alphaTest>0||m.alphaMap||m.displacementMap||m.clipShadows)return;
    const k=(o.isInstancedMesh?'i':'')+(o.isSkinnedMesh?'s':'')+(o.instanceColor?'c':'');
    o.customDepthMaterial=SHD_DM[k]||(SHD_DM[k]=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}));});}
function shadowFollow(){
  if(!gl.shadowMap.enabled)return;
  const c=moonL.shadow.camera,ext=Math.max(MW,MH)*S3/2+12;
  if(!SHD.on){   // แบบเดิม: คลุมทั้งแผนที่ แสงมองไปที่กลางแผนที่
    if(c.right!==ext){Object.assign(c,{left:-ext,right:ext,top:ext,bottom:-ext,near:1,far:400});c.updateProjectionMatrix();}
    moonL.target.position.set(0,0,0);moonL.position.copy(LDIR).multiplyScalar(133);moonL.target.updateMatrixWorld();shadowSoft(c);return;}
  const r=Math.min(ext,(gq('shadow')>=3?SHD.rHigh:SHD.r)*SHD.distK[gq('shdist')]);
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
function shadowSoft(c){c=c||moonL.shadow.camera;moonL.shadow.radius=PCSS.on&&gq('pcss')?10+PCSS.size*(c.far-c.near)/Math.max(1,c.right-c.left):1;}
// ไฟชั่วคราวสำหรับคาถา (pool คงที่ ไม่ต้อง compile shader ใหม่)
const LPOOL=[];
for(let i=0;i<6;i++){const L=new THREE.PointLight('#ffffff',0,12,2);L.position.set(0,-100,0);scene.add(L);LPOOL.push(L);}
// Map light slots (guides/PRELOAD-STANDARD.md §4): every map has the same MLS_N real point lights, so the shader recipe never
// depends on the map. Maps place light points with mlsPoint() (an Object3D marker added to the world like a light, with
// intensity/color/distance/decay); each frame the slots go to the points nearest the camera, fading in/out by rank (mlsTick,
// from updateLights js/30). Points in worlds that are not in the scene (cached maps) are skipped. Never cast shadows.
const MLS_N=8,MLS={L:[],pts:new Set(),fade:3};
for(let i=0;i<MLS_N;i++){const L=new THREE.PointLight('#ffffff',0,1,2);L.position.set(0,-100,0);scene.add(L);MLS.L.push(L);}
function mlsPoint(col,int,dist,decay){const o=new THREE.Object3D();o.name='map light';o.isMapLight=true;
  o.color=new THREE.Color(col);o.intensity=int;o.distance=dist;o.decay=decay===undefined?2:decay;o.mlsW=0;MLS.pts.add(o);return o;}
const _mlsP=new THREE.Vector3();
function mlsInScene(o){for(let q=o,k=0;q&&k<12;q=q.parent,k++)if(q===scene)return true;return false;}
function mlsTick(dt){
  const C=[];for(const o of MLS.pts){if(!o.parent){continue;}if(!mlsInScene(o)){o.mlsW=0;continue;}o.getWorldPosition(_mlsP);
    const d=_mlsP.distanceToSquared(cam.position);o.mlsD=d;o.mlsX=_mlsP.x;o.mlsY=_mlsP.y;o.mlsZ=_mlsP.z;C.push(o);}
  C.sort((a,b)=>a.mlsD-b.mlsD);
  const k=Math.min(1,dt*MLS.fade);for(let i=0;i<C.length;i++){const o=C[i];o.mlsW+=((i<MLS_N?1:0)-o.mlsW)*k;}
  const U=C.filter(o=>o.mlsW>0.01).sort((a,b)=>b.mlsW-a.mlsW||a.mlsD-b.mlsD);
  for(let i=0;i<MLS_N;i++){const L=MLS.L[i],o=U[i];
    if(o){L.position.set(o.mlsX,o.mlsY,o.mlsZ);L.color.copy(o.color);L.intensity=o.intensity*o.mlsW;L.distance=o.distance;L.decay=o.decay;}
    else L.intensity=0;}}
