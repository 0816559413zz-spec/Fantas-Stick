// Lite FFT ocean for the decorative coast sea (js/67-coast). Graphics option 'water': 0 Low = old sine sea,
// 1 High = 3 cascades 128², 2 Cinematic = 4 cascades 256² + sun glitter.
// Ported (trimmed) from Ultra-Water by Humpalumps (MIT): Tessendorf spectrum (JONSWAP + swell), Stockham IFFT on the
// GPU, slope + slope² with mips (far roughness), Jacobian crest foam. Dropped: planar reflection, underwater,
// buoyancy/physics, shore breakers, caustics (the sea is far backdrop). Sim runs only on frames after a sea was drawn.
const OCEAN={L:[260,46,8.5,2.3],LOOP:300,sim:null,lv:-1,mats:new Set(),seen:-9,frame:0,t:0,last:0,
  P:{wind:8,windDir:20,fetch:120,spread:0.85,windSwell:0.25,gamma:3.3,fade:0.04,capFade:0.08,scale:1,swellScale:0.7,swellWind:7,swellDir:-15,swellFetch:900,swellSwell:1,chop:0.85,foamRec:0.7}};
if(window.WD)window.WD.OCEAN=OCEAN;
const OC_COMMON=n=>`precision highp float;precision highp int;
#define N ${n}
#define PI 3.14159265359
#define G 9.81
#define ST 7.4e-5
vec2 cmul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
float omega(float k){return sqrt(G*k+ST*k*k*k);}
`;
const OC_VERT=`in vec3 position;void main(){gl_Position=vec4(position.xy,0.0,1.0);}`;
const OC_INIT=`uniform vec4 uSpecA[2];uniform vec4 uSpecB[2];uniform vec4 uLength;uniform vec4 uCut;uniform float uCapFade;uniform int uNC;out vec4 outColor;
uvec2 pcg2d(uvec2 v){v=v*1664525u+1013904223u;v.x+=v.y*1664525u;v.y+=v.x*1664525u;v^=v>>16u;v.x+=v.y*1664525u;v.y+=v.x*1664525u;v^=v>>16u;return v;}
vec2 gauss(ivec2 id,int c){uvec2 h=pcg2d(uvec2(id)+uvec2(uint(c)*7919u,uint(c)*104729u)+1337u);float u1=(float(h.x)+1.0)/4294967296.0,u2=float(h.y)/4294967296.0;float r=sqrt(-2.0*log(u1));return r*vec2(cos(2.0*PI*u2),sin(2.0*PI*u2));}
float jonswap(float w,vec4 a,vec4 b){float wp=b.y,sg=w<=wp?0.07:0.09,r=exp(-(w-wp)*(w-wp)/(2.0*sg*sg*wp*wp)),iw=1.0/w,q=wp*iw;return a.x*b.x*G*G*iw*iw*iw*iw*iw*exp(-1.25*q*q*q*q)*pow(b.z,r);}
float normalisation(float s){float s2=s*s,s3=s2*s,s4=s3*s;if(s<5.0)return -0.000564*s4+0.00776*s3-0.044*s2+0.192*s+0.163;return -4.80e-08*s4+1.07e-05*s3-9.53e-04*s2+5.90e-02*s+3.93e-01;}
float directional(float th,float w,vec4 a,vec4 b){float x=w/b.y,s=x>1.0?9.77*pow(x,-2.5):6.97*pow(x,5.0);s+=16.0*tanh(min(x,20.0))*a.w*a.w;float t=th-a.y;return mix(2.0/PI*cos(t)*cos(t),normalisation(s)*pow(abs(cos(0.5*t)),2.0*s),a.z);}
vec2 h0(ivec2 id,int c){float L=uLength[c],dk=2.0*PI/L;vec2 k=vec2(id-N/2)*dk;float kl=length(k);
  float lo=c==0?1e-4:uCut[c-1],hi=c==uNC-1?1e4:uCut[c];if(kl<lo||kl>hi)return vec2(0.0);
  float w=omega(kl),dwdk=(G+3.0*ST*kl*kl)/(2.0*w),th=atan(k.y,k.x),S=0.0;
  for(int i=0;i<2;i++){if(uSpecA[i].x<=0.0)continue;float fd=c==3?uCapFade:uSpecB[i].w;S+=jonswap(w,uSpecA[i],uSpecB[i])*directional(th,w,uSpecA[i],uSpecB[i])*exp(-fd*fd*kl*kl);}
  return gauss(id,c)*sqrt(2.0*S*dwdk/kl*dk*dk);}
void main(){ivec2 p=ivec2(gl_FragCoord.xy);int c=p.y/N;ivec2 id=ivec2(p.x,p.y-c*N);vec2 a=h0(id,c),b=h0((N-id)%N,c);outColor=vec4(a,b.x,-b.y);}`;
const OC_EVOLVE=`uniform highp sampler2D uH0;uniform vec4 uLength;uniform float uTime;layout(location=0) out vec4 out0;layout(location=1) out vec4 out1;
vec2 pack2(vec2 a,vec2 b){return vec2(a.x-b.y,a.y+b.x);}
void main(){ivec2 p=ivec2(gl_FragCoord.xy);int c=p.y/N;vec2 k=vec2(ivec2(p.x,p.y-c*N)-N/2)*(2.0*PI/uLength[c]);float kl=length(k),ik=kl>1e-6?1.0/kl:0.0;
  const float W0=2.0*PI/300.0;float ph=2.0*PI*fract(floor(omega(kl)/W0)*(uTime/300.0));vec2 e=vec2(cos(ph),sin(ph));
  vec4 h=texelFetch(uH0,p,0);vec2 hh=cmul(h.xy,e)+cmul(h.zw,vec2(e.x,-e.y)),ih=vec2(-hh.y,hh.x);
  vec2 dx=ih*k.x*ik,dz=ih*k.y*ik,dxdx=-hh*k.x*k.x*ik,dzdz=-hh*k.y*k.y*ik,dxdz=-hh*k.x*k.y*ik,dydx=ih*k.x,dydz=ih*k.y;
  out0=vec4(pack2(dx,dz),pack2(hh,dxdz));out1=vec4(pack2(dydx,dydz),pack2(dxdx,dzdz));}`;
const OC_FFT=`uniform highp sampler2D uIn0;uniform highp sampler2D uIn1;uniform int uSub;uniform int uVertical;layout(location=0) out vec4 out0;layout(location=1) out vec4 out1;
void main(){ivec2 p=ivec2(gl_FragCoord.xy);int i=uVertical==1?p.y%N:p.x,hs=uSub>>1,e=(i/uSub)*hs+(i&(hs-1));ivec2 pe,po;
  if(uVertical==1){int base=p.y-i;pe=ivec2(p.x,base+e);po=ivec2(p.x,base+e+N/2);}else{pe=ivec2(e,p.y);po=ivec2(e+N/2,p.y);}
  float a=2.0*PI*float(i&(uSub-1))/float(uSub);vec2 tw=vec2(cos(a),sin(a));
  vec4 e0=texelFetch(uIn0,pe,0),o0=texelFetch(uIn0,po,0),e1=texelFetch(uIn1,pe,0),o1=texelFetch(uIn1,po,0);
  out0=vec4(e0.xy+cmul(tw,o0.xy),e0.zw+cmul(tw,o0.zw));out1=vec4(e1.xy+cmul(tw,o1.xy),e1.zw+cmul(tw,o1.zw));}`;
const OC_ASM=`uniform highp sampler2D uIn0;uniform highp sampler2D uIn1;uniform sampler2D uPrev;uniform int uCascade;uniform float uLambda;uniform float uDt;uniform float uFoamRecovery;
layout(location=0) out vec4 outDisp;layout(location=1) out vec4 outSlope;
void main(){ivec2 id=ivec2(gl_FragCoord.xy),p=id+ivec2(0,uCascade*N);float s=((id.x+id.y)&1)==0?1.0:-1.0;
  vec4 a=texelFetch(uIn0,p,0)*s,b=texelFetch(uIn1,p,0)*s;float dxx=uLambda*b.z,dzz=uLambda*b.w,dxz=uLambda*a.w,jac=(1.0+dxx)*(1.0+dzz)-dxz*dxz;
  vec2 sl=b.xy/max(vec2(1.0+dxx,1.0+dzz),vec2(0.2));float prev=texelFetch(uPrev,id,0).w,turb=min(jac,prev+uDt*uFoamRecovery/max(jac,0.5));
  outDisp=vec4(uLambda*a.x,a.z,uLambda*a.y,turb);outSlope=vec4(sl,sl*sl);}`;
function ocJon(ws,fk){const f=fk*1000;return {a:0.076*Math.pow(9.81*f/(ws*ws),-0.22),w:22*Math.pow(ws*f/(9.81*9.81),-0.33)};}
function ocMat(n,frag,U){return new THREE.RawShaderMaterial({glslVersion:THREE.GLSL3,vertexShader:OC_VERT,fragmentShader:OC_COMMON(n)+frag,uniforms:U,depthTest:false,depthWrite:false});}
function oceanSim(lv){const n=lv>=2?256:128,NC=lv>=2?4:3,LOG=Math.log2(n),H=n*NC,L=OCEAN.L;
  const nf={type:THREE.FloatType,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:false,generateMipmaps:false};
  const h0=new THREE.WebGLRenderTarget(n,H,nf),hf=Object.assign({},nf,{type:THREE.HalfFloatType});
  const ping=new THREE.WebGLMultipleRenderTargets(n,H,2,hf),pong=new THREE.WebGLMultipleRenderTargets(n,H,2,hf);
  const of={type:THREE.HalfFloatType,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,wrapS:THREE.RepeatWrapping,wrapT:THREE.RepeatWrapping,generateMipmaps:true,depthBuffer:false,anisotropy:Math.min(8,gl.capabilities.getMaxAnisotropy())};
  const out=[];for(let c=0;c<NC;c++)out.push([0,1].map(()=>{const r=new THREE.WebGLMultipleRenderTargets(n,n,2,of);for(const t of r.texture)Object.assign(t,{wrapS:THREE.RepeatWrapping,wrapT:THREE.RepeatWrapping,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:true,anisotropy:of.anisotropy});return r;}));
  const len=new THREE.Vector4(L[0],L[1],L[2],L[3]);
  const init=ocMat(n,OC_INIT,{uSpecA:{value:[new THREE.Vector4(),new THREE.Vector4()]},uSpecB:{value:[new THREE.Vector4(),new THREE.Vector4()]},uLength:{value:len},
    uCut:{value:new THREE.Vector4(...L.slice(1).map(l=>2*Math.PI/l*6),0)},uCapFade:{value:OCEAN.P.capFade},uNC:{value:NC}});
  const evo=ocMat(n,OC_EVOLVE,{uH0:{value:h0.texture},uLength:{value:len},uTime:{value:0}});
  const fft=ocMat(n,OC_FFT,{uIn0:{value:null},uIn1:{value:null},uSub:{value:2},uVertical:{value:0}});
  const asm=ocMat(n,OC_ASM,{uIn0:{value:null},uIn1:{value:null},uPrev:{value:null},uCascade:{value:0},uLambda:{value:1},uDt:{value:0},uFoamRecovery:{value:0.7}});
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),init);quad.frustumCulled=false;const qs=new THREE.Scene();qs.add(quad);const qc=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const S={lv,n,NC,LOG,h0,ping,pong,out,init,evo,fft,asm,quad,qs,qc,par:0,dirty:true,disp:out.map(p=>p[0].texture[0]),slope:out.map(p=>p[0].texture[1])};
  S.run=(m,rt)=>{quad.material=m;gl.setRenderTarget(rt);gl.render(qs,qc);};
  return S;}
function oceanSpectrum(S){const p=OCEAN.P,u=S.init.uniforms,w=ocJon(p.wind,p.fetch),s=ocJon(p.swellWind,p.swellFetch),r=THREE.MathUtils.degToRad;
  u.uSpecA.value[0].set(p.scale,r(p.windDir),p.spread,p.windSwell);u.uSpecB.value[0].set(w.a,w.w,p.gamma,p.fade);
  u.uSpecA.value[1].set(p.swellScale*p.scale,r(p.swellDir),1,p.swellSwell);u.uSpecB.value[1].set(s.a,s.w,p.gamma,p.fade);
  S.run(S.init,S.h0);for(const pr of S.out)for(const rt of pr){gl.setRenderTarget(rt);gl.setClearColor(0x000000,1);gl.clear(true,false,false);}S.dirty=false;}
function oceanStep(S,dt){if(S.dirty)oceanSpectrum(S);OCEAN.t=(OCEAN.t+dt)%OCEAN.LOOP;S.evo.uniforms.uTime.value=OCEAN.t;S.run(S.evo,S.ping);
  let a=S.ping,b=S.pong;const fu=S.fft.uniforms;
  for(let d=0;d<2;d++){fu.uVertical.value=d;for(let s=1;s<=S.LOG;s++){fu.uSub.value=1<<s;fu.uIn0.value=a.texture[0];fu.uIn1.value=a.texture[1];S.run(S.fft,b);const t=a;a=b;b=t;}}
  const au=S.asm.uniforms;au.uIn0.value=a.texture[0];au.uIn1.value=a.texture[1];au.uLambda.value=OCEAN.P.chop;au.uDt.value=dt;au.uFoamRecovery.value=OCEAN.P.foamRec;
  const nx=S.par^1;for(let c=0;c<S.NC;c++){au.uCascade.value=c;au.uPrev.value=S.out[c][S.par].texture[0];S.run(S.asm,S.out[c][nx]);S.disp[c]=S.out[c][nx].texture[0];S.slope[c]=S.out[c][nx].texture[1];}
  S.par=nx;}
function oceanFree(){const S=OCEAN.sim;if(!S)return;S.h0.dispose();S.ping.dispose();S.pong.dispose();for(const p of S.out)for(const r of p)r.dispose();for(const m of [S.init,S.evo,S.fft,S.asm])m.dispose();S.quad.geometry.dispose();OCEAN.sim=null;}
// shared uniforms for every coast sea material (textures swap each step: ping-pong)
const OCU={uD0:{value:null},uD1:{value:null},uD2:{value:null},uS0:{value:null},uS1:{value:null},uS2:{value:null},uS3:{value:null},uLen:{value:new THREE.Vector4(...OCEAN.L)},uOT:{value:0},uSunC:{value:new THREE.Color(1,1,1)}};
// run before the frame when a sea was drawn in the last 30 frames (sea out of view / no coast map = no cost)
function oceanTick(){OCEAN.frame++;const lv=gq('water');
  if(lv!==OCEAN.lv){OCEAN.lv=lv;for(const m of OCEAN.mats){m.defines.OCN=lv;m.needsUpdate=true;}if(OCEAN.sim&&OCEAN.sim.lv!==lv)oceanFree();}
  if(!lv||OCEAN.frame-OCEAN.seen>30)return;
  const now=performance.now()/1000,dt=OCEAN.last?Math.min(0.1,Math.max(0,now-OCEAN.last)):1/60;OCEAN.last=now;
  oceanRun(lv,dt);}
// one sim step with the renderer state kept (also called at map build = compiles the 4 sim shaders on the loading screen)
function oceanRun(lv,dt){if(!OCEAN.sim)OCEAN.sim=oceanSim(lv);const S=OCEAN.sim;
  const rt=gl.getRenderTarget(),ac=gl.autoClear,sa=gl.shadowMap.autoUpdate,sn=gl.shadowMap.needsUpdate,cc=gl.getClearColor(new THREE.Color()),ca=gl.getClearAlpha(),xr=gl.xr.enabled;
  gl.autoClear=false;gl.shadowMap.autoUpdate=false;gl.shadowMap.needsUpdate=false;gl.xr.enabled=false;
  try{oceanStep(S,dt);}finally{gl.setRenderTarget(rt);gl.autoClear=ac;gl.shadowMap.autoUpdate=sa;gl.shadowMap.needsUpdate=sn;gl.setClearColor(cc,ca);gl.xr.enabled=xr;}
  OCU.uD0.value=S.disp[0];OCU.uD1.value=S.disp[1];OCU.uD2.value=S.disp[2];OCU.uS0.value=S.slope[0];OCU.uS1.value=S.slope[1];OCU.uS2.value=S.slope[2];OCU.uS3.value=S.slope[3]||S.slope[2];
  OCU.uOT.value=OCEAN.t;OCU.uSunC.value.copy(moonL.color).multiplyScalar(Math.max(0.6,moonL.intensity));}
function oceanWarm(){const lv=gq('water');if(!lv||OCEAN.sim&&OCEAN.sim.lv===lv)return;if(OCEAN.sim)oceanFree();try{oceanRun(lv,1/60);}catch(e){console.warn('ocean warm',e);}}
{const _cr=composer.render.bind(composer);composer.render=function(d){try{oceanTick();}catch(e){if(!OCEAN.err){OCEAN.err=e;console.warn('ocean',e);}}return _cr(d);};}
// GLSL for the coast sea material (#if OCN>0). Vertex: big cascades move the surface far from shore. Fragment: slopes of all
// cascades (mips = far roughness), GGX sun, sky Fresnel, crest foam from the Jacobian, crest glow.
const OC_GLSL_V=`uniform sampler2D uD0,uD1;uniform vec4 uLen;varying float vOH;
vec3 ocDisp(vec2 p,float d){float l=clamp(log2(d*0.004+1.0)+1.0,1.0,6.0);vec3 a=textureLod(uD0,p/uLen.x,l).xyz,b=textureLod(uD1,p/uLen.y,l+1.0).xyz*(1.0-smoothstep(120.0,420.0,d));return a+b;}`;
const OC_GLSL_F=`uniform sampler2D uD0,uD1,uD2,uS0,uS1,uS2,uS3;uniform vec4 uLen;uniform float uOT;uniform vec3 uSunC;varying float vOH;
float ocH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 ocShade(vec2 p,float sd,vec3 V,float dist,vec3 L,vec3 deep,vec3 shal,vec3 sky,vec3 fogc,vec3 foamC,out float foamOut,out vec3 Nout){
  float k=smoothstep(2.0,30.0,sd),kc=mix(0.45,1.0,smoothstep(0.0,14.0,sd));
  vec4 s0=texture(uS0,p/uLen.x)*k,s1=texture(uS1,p/uLen.y)*kc,s2=texture(uS2,p/uLen.z)*kc,s3=vec4(0.0);
  #if OCN>1
  s3=texture(uS3,p/uLen.w)*kc;
  #endif
  s0.zw*=k;s1.zw*=kc;s2.zw*=kc;s3.zw*=kc;
  float sl=smoothstep(0.3,0.7,fract(sin(dot(floor(p*0.004),vec2(12.9,78.2)))*437.5)*0.5+0.5*sin(p.x*0.0031+p.y*0.0023+uOT*0.02));   // slicks break the far tiling
  float m2=mix(0.7,1.0,sl);s2.xy*=m2;s2.zw*=m2*m2;s3.xy*=m2;s3.zw*=m2*m2;
  vec2 slope=s0.xy+s1.xy+s2.xy+s3.xy,var=max(s0.zw-s0.xy*s0.xy,0.0)+max(s1.zw-s1.xy*s1.xy,0.0)+max(s2.zw-s2.xy*s2.xy,0.0)+max(s3.zw-s3.xy*s3.xy,0.0);
  vec3 Nn=normalize(vec3(-slope.x,1.0,-slope.y));Nout=Nn;
  vec3 dnx=dFdx(Nn),dny=dFdy(Nn);float a2=0.0009+0.004*(1.0-m2)+var.x+var.y+min(0.25*(dot(dnx,dnx)+dot(dny,dny)),0.18),al=sqrt(a2);
  float NoV=max(dot(Nn,V),1e-4),NoL=dot(Nn,L);
  float F90=max(1.0-0.7*sqrt(al),0.02),F=0.02+(F90-0.02)*pow(1.0-NoV,5.0);
  vec3 R=reflect(-V,Nn);R.y=abs(R.y);vec3 refl=mix(fogc,sky,smoothstep(0.0,0.35,R.y))*mix(1.0,0.8,smoothstep(0.0,1.0,R.y));
  float sh=1.0-smoothstep(4.0,55.0,sd);vec3 body=mix(deep,shal,sh*0.85);
  float hh=max(vOH,0.0),k1=0.9*hh*pow(clamp(dot(L,-V),0.0,1.0),4.0)*pow(0.5-0.5*NoL,3.0)+0.25*pow(NoV,2.0);
  body+=shal*(k1*0.18+0.03*max(NoL,0.0))*uSunC;
  vec3 col=mix(body,refl,F);
  float aS=max(al,0.02),aS2=aS*aS;vec3 H=normalize(L+V);float NoH=max(dot(Nn,H),0.0),nl=max(NoL,0.0),dd=NoH*NoH*(aS2-1.0)+1.0,D=aS2/(PI*dd*dd);
  float vis=0.5/(nl*sqrt(NoV*NoV*(1.0-aS2)+aS2)+NoV*sqrt(nl*nl*(1.0-aS2)+aS2)+1e-5),Fs=0.02+0.98*pow(1.0-max(dot(V,H),0.0),5.0);
  float spec=PI*D*vis*Fs*nl;
  #if OCN>1
  {vec2 fw=fwidth(p);float sz=exp2(floor(log2(max(max(fw.x,fw.y),1e-3))+1.0));vec2 c=floor(p/sz);float tt=uOT*3.0+ocH(c)*64.0,it=floor(tt);
   float g=mix(step(0.93,ocH(c*1.31+it*3.7)),step(0.93,ocH(c*1.31+(it+1.0)*3.7)),smoothstep(0.0,1.0,tt-it));
   spec*=mix(1.0,g*9.0+0.4,0.8*smoothstep(4.0,40.0,dist)*smoothstep(0.02,0.4,spec));}   // glitter: sparse facets catch the sun
  #endif
  col+=uSunC*min(spec,40.0)*0.55;
  float t0=texture(uD0,p/uLen.x).w,t1=texture(uD1,p/uLen.y).w,t2=texture(uD2,p/uLen.z).w,jac=mix(1.0,t0,k)+mix(1.0,t1,kc)+mix(1.0,t2,kc)-2.0;
  float fo=clamp((0.4-jac)*2.0,0.0,1.0);
  if(fo>0.0){float pat=0.6*fract(sin(dot(floor(p*3.0),vec2(12.9,78.2)))*437.5)+0.4*(0.5+0.5*sin(p.x*1.7+uOT)*sin(p.y*1.9-uOT*0.7));fo=smoothstep(1.05-fo,1.3-fo,pat+0.25)*sqrt(fo);}
  foamOut=fo;return col;}`;
