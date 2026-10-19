// =====================================================================
//  VFX Studio — ตัววาดภาพเอฟเฟกต์ (แท็บ 🎞 ภาพ): shader บน GPU ของเกม + จำลองของไหลจริง (CPU) → ภาพตารางเฟรม (flipbook)
//  txRender(d) → canvas (cols×rows เฟรม, px ต่อเฟรม; เฟรม 0 มุมซ้ายบน เรียงซ้าย→ขวา บน→ล่าง เหมือนที่เกมอ่าน)
//  ค่า/ช่วง/ค่าเริ่มของทุกตัววาด: assets/fx/schema.json → tx.gens • ตัววาดคืน vec2(ความร้อน 0-1 → สีจากจาน ramp, ความทึบ)
//  loop ต่อกันไม่มีรอย: noise เป็นคาบ (periodic Perlin) และเวลาเป็นแกนที่ 3 ที่วนครบคาบพอดี • sim: เฟดช่วงท้ายเข้าช่วงต้น
// =====================================================================
const TX_NOISE=`
vec3 m289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 m289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 perm(vec4 x){return m289(((x*34.0)+10.0)*x);}
vec4 tis(vec4 r){return 1.79284291400159-0.85373472095314*r;}
vec3 fde(vec3 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}
float pn(vec3 P,vec3 rep){
  vec3 Pi0=mod(floor(P),rep),Pi1=mod(Pi0+vec3(1.0),rep);Pi0=m289(Pi0);Pi1=m289(Pi1);
  vec3 Pf0=fract(P),Pf1=Pf0-vec3(1.0);
  vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x),iy=vec4(Pi0.yy,Pi1.yy),iz0=Pi0.zzzz,iz1=Pi1.zzzz;
  vec4 ixy=perm(perm(ix)+iy),ixy0=perm(ixy+iz0),ixy1=perm(ixy+iz1);
  vec4 gx0=ixy0*(1.0/7.0),gy0=fract(floor(gx0)*(1.0/7.0))-0.5;gx0=fract(gx0);vec4 gz0=vec4(0.5)-abs(gx0)-abs(gy0),sz0=step(gz0,vec4(0.0));gx0-=sz0*(step(0.0,gx0)-0.5);gy0-=sz0*(step(0.0,gy0)-0.5);
  vec4 gx1=ixy1*(1.0/7.0),gy1=fract(floor(gx1)*(1.0/7.0))-0.5;gx1=fract(gx1);vec4 gz1=vec4(0.5)-abs(gx1)-abs(gy1),sz1=step(gz1,vec4(0.0));gx1-=sz1*(step(0.0,gx1)-0.5);gy1-=sz1*(step(0.0,gy1)-0.5);
  vec3 g000=vec3(gx0.x,gy0.x,gz0.x),g100=vec3(gx0.y,gy0.y,gz0.y),g010=vec3(gx0.z,gy0.z,gz0.z),g110=vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001=vec3(gx1.x,gy1.x,gz1.x),g101=vec3(gx1.y,gy1.y,gz1.y),g011=vec3(gx1.z,gy1.z,gz1.z),g111=vec3(gx1.w,gy1.w,gz1.w);
  vec4 n0=tis(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));g000*=n0.x;g010*=n0.y;g100*=n0.z;g110*=n0.w;
  vec4 n1=tis(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));g001*=n1.x;g011*=n1.y;g101*=n1.z;g111*=n1.w;
  float a=dot(g000,Pf0),b=dot(g100,vec3(Pf1.x,Pf0.yz)),c=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)),d=dot(g110,vec3(Pf1.xy,Pf0.z));
  float e=dot(g001,vec3(Pf0.xy,Pf1.z)),f=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z)),g=dot(g011,vec3(Pf0.x,Pf1.yz)),h=dot(g111,Pf1);
  vec3 F=fde(Pf0);vec4 nz=mix(vec4(a,b,c,d),vec4(e,f,g,h),F.z);vec2 nyz=mix(nz.xy,nz.zw,F.y);return 2.2*mix(nyz.x,nyz.y,F.x);}
float fbm(vec3 p,vec3 rep,float oct){float s=0.0,a=0.5,n=0.0;for(int i=0;i<7;i++){if(float(i)>=oct)break;s+=a*pn(p,rep);n+=a;p*=2.0;rep*=2.0;a*=0.5;}return s/max(n,1e-4);}
float h11(float n){return fract(sin(n*12.9898+78.233)*43758.5453);}
float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);return length(pa-ba*h);}
`;
// ตัววาดแต่ละแบบ: vec2 gen(vec2 uv, float t) — uv 0..1 (0,0 = ซ้ายล่างของเฟรม) • t = เวลา 0..1 (loop: วนกลับ 0 ต่อกันพอดี / life: ตลอดอายุเม็ด)
const TX_GLSL={
fire:`vec2 gen(vec2 uv,float t){
  float S=max(1.0,floor(u_scale+0.5)),sp=max(1.0,floor(u_speed+0.5));vec3 rep=vec3(S,S,2.0);
  vec3 q=vec3(uv.x*S,uv.y*S-t*S*sp,t*2.0)+uSeedV;
  float w=fbm(q+vec3(3.7,1.1,0.0),rep,3.0);
  float n=clamp(fbm(q+vec3(w*u_turb*1.6,w*u_turb*0.6,0.0),rep,u_detail)*0.75+0.5,0.0,1.0);
  float y=uv.y/max(0.1,u_height),x=abs(uv.x-0.5)*2.0/max(0.05,u_width);
  float wid=mix(1.0,0.06,pow(clamp(y,0.0,1.0),0.75))+(n-0.5)*u_turb*0.9;
  float body=1.0-smoothstep(0.35,1.0,x/max(0.02,wid));
  float top=1.0-smoothstep(0.3,1.0,y+(n-0.5)*u_turb*0.8);
  float base=smoothstep(0.0,0.07,uv.y)*(1.0-smoothstep(0.93,1.0,uv.y))*smoothstep(0.0,0.04,uv.x)*(1.0-smoothstep(0.96,1.0,uv.x));
  float f=pow(clamp(body*top*base*(0.5+0.95*n),0.0,1.0),u_sharp);
  return vec2(clamp(f*0.95,0.0,1.0),smoothstep(0.02,0.35,f));}`,
smoke:`float smD(vec2 c,float t){float g=mix(0.55+0.3*(1.0-u_grow),1.0,pow(t,0.5));vec2 cc=c/g;float r=length(cc)*2.0;
  vec3 p=vec3(cc*u_scale,t*u_turb*0.7)+uSeedV,rr=vec3(289.0);float b=0.0,a=0.5,nn=0.0;
  for(int i=0;i<6;i++){if(float(i)>=u_detail)break;float n=pn(p,rr);b+=a*mix(n*0.5+0.3,abs(n),0.55);nn+=a;p*=2.02;rr*=2.0;a*=0.55;}
  return (1.0-r*r)*1.25+(b/nn-0.28)*2.0-0.15;}
vec2 gen(vec2 uv,float t){
  vec2 c=uv-0.5;float d=smD(c,t),dl=smD(c+vec2(-0.025,0.035),t);   // ตัวอย่างไปทางแสง (ซ้ายบน) → ก้อนควันมีเงา
  float a=smoothstep(0.0,mix(0.9,0.25,u_soft),d)*u_dens*(1.0-smoothstep(0.4,1.0,t))*(0.5+0.5*smoothstep(0.0,0.12,t))*(1.0-smoothstep(0.9,1.0,length(c)*2.0));
  float lit=clamp(0.62+(d-dl)*2.0*u_dark,0.0,1.0);
  return vec2(lit*(0.75+0.25*clamp(d,0.0,1.0)),clamp(a,0.0,1.0));}`,
explosion:`float exD(vec2 c,float t){float g=mix(0.18,1.0,1.0-pow(1.0-t,1.0+2.0*u_grow));vec2 cc=c/g;float r=length(cc)*2.0;
  vec3 p=vec3(cc*u_scale,t*1.2)+uSeedV,rr=vec3(289.0);float b=0.0,a=0.5,nn=0.0;
  for(int i=0;i<6;i++){if(float(i)>=u_detail)break;b+=a*abs(pn(p,rr));nn+=a;p*=2.02;rr*=2.0;a*=0.5;}
  return (1.0-r*r)*1.2+(b/nn-0.28)*2.4*u_rough-0.1;}
vec2 gen(vec2 uv,float t){
  vec2 c=uv-0.5;float d=exD(c,t),dl=exD(c+vec2(-0.02,0.03),t),lit=clamp(0.5+(d-dl)*2.5,0.0,1.0);
  float heat=clamp((d*0.8+0.25)*(1.1-t*u_cool*1.3)*u_heat,0.0,1.0)*mix(0.7,1.1,lit);
  float a=smoothstep(0.0,0.35,d)*(1.0-smoothstep(0.6,1.0,t))*(1.0-smoothstep(0.92,1.0,length(c)*2.0));
  return vec2(clamp(heat,0.0,1.0),clamp(a,0.0,1.0));}`,
electric:`vec2 gen(vec2 uv,float t){
  float acc=0.0,gw=0.0;vec3 rep=vec3(289.0,289.0,3.0);
  for(int i=0;i<6;i++){float fi=float(i);if(fi>=u_arcs)break;
    vec3 q=vec3(uv.x*3.0*u_jag,fi*13.7,t*3.0)+uSeedV;
    float off=fbm(q,rep,5.0)+fbm(q*vec3(4.0,1.0,1.0)+vec3(0.0,5.0,0.0),rep*vec3(4.0,1.0,1.0),3.0)*0.3*u_jag;
    float d=abs(uv.y-(0.5+off*0.6*pow(sin(3.14159*uv.x),0.6)*u_amp));
    float fl=0.55+0.45*sin(6.28318*(t*2.0+fi*0.37));
    acc+=fl*(1.0-smoothstep(u_width*0.4,u_width,d));gw+=fl*exp(-d/(u_width*5.0))*u_glow;}
  return vec2(clamp(acc+gw*0.3,0.0,1.0),clamp(acc+gw*0.7,0.0,1.0));}`,
vortex:`vec2 gen(vec2 uv,float t){
  vec2 c=uv-0.5;float r=length(c)*2.0,a=atan(c.y,c.x),ar=max(1.0,floor(u_arms+0.5)),sp=max(1.0,floor(u_speed+0.5));
  float n=clamp(fbm(vec3(c*u_scale,t*2.0)+uSeedV,vec3(289.0,289.0,2.0),4.0)*0.75+0.5,0.0,1.0);
  float band=pow(clamp(sin(a*ar+r*u_twist*6.28318-t*6.28318*sp+(n-0.5)*u_noise*4.0)*0.5+0.5,0.0,1.0),u_sharp);
  float ring=smoothstep(u_inner,u_inner+0.12,r)*(1.0-smoothstep(u_outer-0.25,u_outer,r));
  float f=band*ring*(0.55+0.7*n),core=(1.0-smoothstep(0.0,u_inner+0.08,r))*u_core;
  return vec2(clamp(f*(1.25-r*0.6)+core,0.0,1.0),clamp(f+core,0.0,1.0));}`,
shock:`vec2 gen(vec2 uv,float t){
  vec2 c=uv-0.5;float r=length(c)*2.0,R=mix(u_start,u_end,1.0-pow(1.0-t,2.5)),w=u_width*(1.0-0.6*t)+0.004;
  float n=clamp(fbm(vec3(c*u_scale,t*1.5)+uSeedV,vec3(289.0),4.0)*0.75+0.5,0.0,1.0),d=r-R;
  float ring=exp(-d*d/(w*w))*mix(1.0,n*1.7,u_noise);
  float fill=pow(clamp(r/max(R,0.01),0.0,1.0),3.0)*step(r,R)*u_fill*(0.6+0.6*n);
  return vec2(clamp(ring*1.1+fill*0.4,0.0,1.0),clamp((ring+fill)*pow(1.0-t,1.2)*(1.0-smoothstep(0.94,1.0,r)),0.0,1.0));}`,
burst:`vec2 gen(vec2 uv,float t){
  vec2 c=uv-0.5;float r=length(c)*2.0,a=atan(c.y,c.x)/6.28318+0.5,n=max(3.0,floor(u_rays+0.5)),id=floor(a*n),fa=fract(a*n),s=uSeedV.x;
  float h1=h11(id+s),h2=h11(id*1.7+3.0+s),ang=abs(fa-(0.5+(h1-0.5)*0.6))/n*6.28318*max(r,0.02);
  float r1=mix(0.1,0.98,1.0-pow(1.0-t,2.0))*(0.65+0.35*h2),r0=max(0.0,r1-u_len*(0.5+0.5*h2));
  float along=smoothstep(r0,r0+0.06,r)*(1.0-smoothstep(r1-0.03,r1,r));
  float wid=(0.006+u_width*0.07)*(1.0-t*0.6)*(0.6+0.8*h1)*(0.3+0.7*smoothstep(r0,r1,r));
  float st=along*(1.0-smoothstep(wid*0.4,wid,ang)),core=exp(-r*r/(0.01+0.08*(1.0-t)))*(1.0-t)*u_core;
  return vec2(clamp(st*0.9+core,0.0,1.0),clamp(st*(1.0-smoothstep(0.6,1.0,t))+core,0.0,1.0));}`,
slash:`vec2 gen(vec2 uv,float t){
  float R=u_radius;vec2 c=uv-vec2(0.5,0.5-R*0.7);float r=length(c),a=atan(c.x,c.y),s=a/(u_arc*0.0174533)+0.5;
  float sw=clamp(t*2.2,0.0,1.0)*1.12,pf=pow(max(0.0,sin(3.14159*clamp(s,0.0,1.0))),0.7),w=u_width*pf+0.002;
  float g=clamp((r-(R-w))/max(w,0.001),0.0,1.0);
  float band=smoothstep(R-w-0.006,R-w+0.006,r)*(1.0-smoothstep(R-0.004,R+0.006,r))*step(0.0,s)*step(s,1.0);
  float n=clamp(fbm(vec3(s*u_scale,g*1.5,0.0)+uSeedV,vec3(289.0),3.0)*0.75+0.5,0.0,1.0);
  float vis=(1.0-smoothstep(sw-0.12,sw,s))*(1.0-smoothstep(0.55,1.0,t));
  return vec2(clamp(pow(g,1.3)*(0.6+0.5*n),0.0,1.0),clamp(band*vis*mix(1.0,0.35+n*1.2,u_streak)*(0.35+0.65*g),0.0,1.0));}`,
flare:`vec2 gen(vec2 uv,float t){
  vec2 c=uv-0.5;float r=length(c)*2.0,a=atan(c.y,c.x),n=max(2.0,floor(u_rays+0.5)),tw=1.0+u_twinkle*0.35*sin(6.28318*t+a*3.0);
  float ray=pow(abs(cos(a*n*0.5)),u_thin)*(1.0-smoothstep(0.0,u_len*tw,r));
  float ray2=pow(abs(cos(a*n*0.5+1.5708)),u_thin*1.6)*(1.0-smoothstep(0.0,u_len*0.5*(2.0-tw),r))*u_rays2;
  float glow=exp(-r*r/(u_glow*u_glow+1e-4))*0.7,core=exp(-r*r/(u_core*u_core+1e-5));
  return vec2(clamp(core+ray*0.55+ray2*0.4+glow*0.35,0.0,1.0),clamp((ray+ray2+glow+core)*(1.0-smoothstep(0.9,1.0,r)),0.0,1.0));}`,
glow:`vec2 gen(vec2 uv,float t){
  float r=length(uv-0.5)*2.0,g=pow(clamp(1.0-r/max(u_radius,0.01),0.0,1.0),u_power),core=exp(-r*r/(u_core*u_core+1e-5));
  return vec2(clamp(g*0.7+core,0.0,1.0),clamp(g+core,0.0,1.0));}`,
ring:`vec2 gen(vec2 uv,float t){
  vec2 c=uv-0.5;float r=length(c)*2.0,R=u_radius*0.95,d=r-R;
  float n=clamp(fbm(vec3(c*u_scale,t*2.0)+uSeedV,vec3(289.0,289.0,2.0),4.0)*0.75+0.5,0.0,1.0);
  float ring=exp(-d*d/(u_width*u_width))*mix(1.0,smoothstep(0.35,0.7,n)*1.4,u_noise),fill=smoothstep(0.0,R,r)*step(r,R)*u_fill;
  return vec2(clamp(ring,0.0,1.0),clamp((ring+fill*0.6)*(1.0-smoothstep(0.92,1.0,r)),0.0,1.0));}`,
circle:`float Ri(float i){return i<0.5?0.95:i<1.5?0.8:i<2.5?0.6:i<3.5?0.32:0.16;}
vec2 gen(vec2 uv,float t){
  vec2 c=(uv-0.5)*2.0;float r=length(c),a=atan(c.y,c.x)-t*6.28318*floor(u_spin+0.5);vec2 p=r*vec2(cos(a),sin(a));
  float w=u_width,L=0.0,nr=max(1.0,floor(u_rings+0.5));
  for(int i=0;i<5;i++){float fi=float(i);if(fi>=nr)break;L=max(L,1.0-smoothstep(w*0.5,w*1.5,abs(r-Ri(fi))));}
  float np=floor(u_points+0.5);
  if(np>=3.0){float Rs=nr>2.5?0.6:0.8,k=np>=5.0?2.0:1.0;
    for(int i=0;i<12;i++){float fi=float(i);if(fi>=np)break;float a0=fi/np*6.28318+1.5708,a1=(fi+k)/np*6.28318+1.5708;
      L=max(L,1.0-smoothstep(w*0.5,w*1.5,seg(p,Rs*vec2(cos(a0),sin(a0)),Rs*vec2(cos(a1),sin(a1)))));}}
  float nu=floor(u_runes+0.5);
  if(nu>0.0&&nr>1.5){float aa=(a/6.28318+0.5)*nu,id=floor(aa),cw=6.28318*max(r,0.1)/nu,X=(fract(aa)-0.5)*cw,Y=r-0.875,s=uSeedV.x;
    if(abs(Y)<0.05){float h1=h11(id+s),h2=h11(id*3.1+s),h3=h11(id*7.7+s),sw=w*1.1,g=0.0;
      if(h1>0.3)g=max(g,(1.0-smoothstep(sw*0.5,sw,abs(X-(h2-0.5)*cw*0.3)))*step(abs(Y),0.035));
      if(h2>0.45)g=max(g,(1.0-smoothstep(sw*0.5,sw,abs(Y-(h3-0.5)*0.05)))*step(abs(X),cw*0.3));
      if(h3>0.55)g=max(g,(1.0-smoothstep(sw*0.5,sw,abs(X-Y*0.9)))*step(abs(Y),0.035));
      L=max(L,g);}}
  float glow=exp(-abs(r-0.6)*8.0)*0.06+exp(-abs(r-0.95)*14.0)*0.08;
  return vec2(clamp(L,0.0,1.0),clamp((L+glow)*(1.0-smoothstep(0.97,1.0,r)),0.0,1.0));}`,
noise:`float wor(vec2 p,float S){vec2 i=floor(p),f=fract(p);float d=1.0;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y)),cid=mod(i+o,S);vec2 pt=vec2(h21(cid+uSeedV.xy),h21(cid*1.7+uSeedV.yx+3.0));d=min(d,length(o+pt-f));}return d;}
vec2 gen(vec2 uv,float t){
  float S=max(1.0,floor(u_scale+0.5)),v;vec3 rep=vec3(S,S,289.0),q=vec3(uv*S,uSeedV.z);
  if(u_mode<0.5)v=clamp(fbm(q,rep,u_detail)*0.75+0.5,0.0,1.0);
  else if(u_mode<1.5){float s=0.0,a=0.5,n=0.0;vec3 p=q,rr=rep;for(int i=0;i<7;i++){if(float(i)>=u_detail)break;s+=a*(1.0-abs(pn(p,rr)));n+=a;p*=2.0;rr*=2.0;a*=0.5;}v=pow(s/n,2.0);}
  else v=clamp(wor(uv*S,S)*1.1,0.0,1.0);
  v=clamp((v-0.5)*u_contrast+0.5,0.0,1.0);return vec2(v,v);}`
};
// ---------- ค่า ----------
function txSpec(){return FXR.schema&&FXR.schema.tx;}
function txOpts(d){const X=txSpec(),G=X.gens[d.gen]||X.gens.fire,F=X.file,o={};for(const k in F)o[k]=F[k].def;Object.assign(o,{kind:G.kind,cols:G.grid,rows:G.grid,ramp:G.ramp,add:G.add},d);
  o.p={};for(const k in G.fields)o.p[k]=G.fields[k].def;Object.assign(o.p,d.p||{});return o;}
function txStops(r){const X=txSpec();const s=typeof r==='string'?X.ramps[r]||X.ramps.white:Array.isArray(r)&&r.length>1?r:X.ramps.white;return s.slice().sort((a,b)=>a[0]-b[0]);}
// จานสี → ตาราง 256 สี (ผสมในค่าสี sRGB ตรง ๆ เหมือนที่เห็นในภาพ)
function txLUT(r){const s=txStops(r),out=new Uint8Array(256*4);
  for(let i=0;i<256;i++){const x=i/255;let j=0;while(j<s.length-2&&x>s[j+1][0])j++;const a=s[j],b=s[Math.min(s.length-1,j+1)],f=b[0]>a[0]?Math.min(1,Math.max(0,(x-a[0])/(b[0]-a[0]))):0;
    const A=txHex(a[1]),B=txHex(b[1]);out[i*4]=Math.round(A[0]+(B[0]-A[0])*f);out[i*4+1]=Math.round(A[1]+(B[1]-A[1])*f);out[i*4+2]=Math.round(A[2]+(B[2]-A[2])*f);out[i*4+3]=255;}
  return out;}
function txHex(h){const n=parseInt(String(h).slice(1),16)||0;return [(n>>16)&255,(n>>8)&255,n&255];}
function txSeedV(seed){const R=mkRng(seed||1);return new THREE.Vector3(R()*40+3,R()*40+3,R()*40+3);}
// ---------- GPU ----------
let TXG=null;
function txGpu(){if(TXG)return TXG;const sc=new THREE.Scene(),cm=new THREE.OrthographicCamera(-1,1,1,-1,0,1),mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),null);mesh.frustumCulled=false;sc.add(mesh);
  const ramp=new THREE.DataTexture(new Uint8Array(256*4),256,1,THREE.RGBAFormat);ramp.magFilter=ramp.minFilter=THREE.LinearFilter;ramp.wrapS=ramp.wrapT=THREE.ClampToEdgeWrapping;
  return TXG={sc,cm,mesh,mats:new Map(),ramp};}
function txMat(gen){const G=txGpu();let m=G.mats.get(gen);if(m)return m;const F=txSpec().gens[gen].fields,U={uT:{value:0},uSeedV:{value:new THREE.Vector3()},uRamp:{value:G.ramp}};
  for(const k in F)U['u_'+k]={value:F[k].def};
  m=new THREE.ShaderMaterial({uniforms:U,depthTest:false,depthWrite:false,toneMapped:false,blending:THREE.NoBlending,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
    fragmentShader:'precision highp float;varying vec2 vUv;uniform float uT;uniform vec3 uSeedV;uniform sampler2D uRamp;'+Object.keys(F).map(k=>'uniform float u_'+k+';').join('')+TX_NOISE+TX_GLSL[gen]+
      '\nvoid main(){vec2 r=gen(vUv,uT);float h=clamp(r.x,0.0,1.0),a=clamp(r.y,0.0,1.0);gl_FragColor=vec4(texture2D(uRamp,vec2(h*0.996+0.002,0.5)).rgb,a);}'});
  G.mats.set(gen,m);return m;}
function txTimes(o){const N=o.cols*o.rows,life=o.kind==='life';return Array.from({length:N},(_,f)=>N===1?(life?0.5:0):life?f/(N-1):f/N);}
function txGpuRender(o){const G=txGpu(),px=o.px,W=px*o.cols,H=px*o.rows,m=txMat(o.gen);
  G.ramp.image.data.set(txLUT(o.ramp));G.ramp.needsUpdate=true;m.uniforms.uSeedV.value.copy(txSeedV(o.seed));for(const k in o.p)if(m.uniforms['u_'+k])m.uniforms['u_'+k].value=+o.p[k];
  G.mesh.material=m;const rt=new THREE.WebGLRenderTarget(W,H,{depthBuffer:false,type:THREE.UnsignedByteType});rt.scissorTest=true;
  const prev=gl.getRenderTarget(),cc=gl.getClearColor(new THREE.Color()),ca=gl.getClearAlpha();
  try{gl.setClearColor(0x000000,0);txTimes(o).forEach((t,f)=>{const cx=f%o.cols,cy=Math.floor(f/o.cols);m.uniforms.uT.value=t;rt.viewport.set(cx*px,(o.rows-1-cy)*px,px,px);rt.scissor.copy(rt.viewport);gl.setRenderTarget(rt);gl.clear();gl.render(G.sc,G.cm);});
    const buf=new Uint8Array(W*H*4);gl.readRenderTargetPixels(rt,0,0,W,H,buf);
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d'),img=x.createImageData(W,H);
    for(let y=0;y<H;y++)img.data.set(buf.subarray((H-1-y)*W*4,(H-y)*W*4),y*W*4);x.putImageData(img,0,0);cv._rgba=img.data;return cv;}
  finally{gl.setRenderTarget(prev);gl.setClearColor(cc,ca);rt.dispose();}}
// ---------- จำลองของไหลจริง (stable fluids: ลอยตัว + ม้วนตัว + ดับ) ----------
function txSim(o){const P=o.p,fire=(P.mode|0)===0,N=Math.max(32,Math.min(96,Math.round(o.px*0.6))),W=N,H=N,S=(W+2)*(H+2),IX=(i,j)=>i+(W+2)*j,R=mkRng(o.seed||1),sd=(o.seed|0)*13;
  const F=()=>new Float32Array(S);let u=F(),v=F(),u0=F(),v0=F(),d=F(),d0=F(),T=F(),T0=F();const p=F(),dv=F(),cu=F(),dt=0.1,h=1/N;
  const bnd=(b,x)=>{for(let i=1;i<=W;i++){x[IX(i,0)]=b===2?-x[IX(i,1)]:x[IX(i,1)];x[IX(i,H+1)]=x[IX(i,H)];}for(let j=1;j<=H;j++){x[IX(0,j)]=b===1?-x[IX(1,j)]:x[IX(1,j)];x[IX(W+1,j)]=b===1?-x[IX(W,j)]:x[IX(W,j)];}};
  const adv=(b,D,D0)=>{const k=dt*N;for(let j=1;j<=H;j++)for(let i=1;i<=W;i++){let x=i-k*u[IX(i,j)],y=j-k*v[IX(i,j)];x=Math.max(0.5,Math.min(W+0.5,x));y=Math.max(0.5,Math.min(H+0.5,y));const i0=x|0,j0=y|0,s1=x-i0,t1=y-j0;
    D[IX(i,j)]=(1-s1)*((1-t1)*D0[IX(i0,j0)]+t1*D0[IX(i0,j0+1)])+s1*((1-t1)*D0[IX(i0+1,j0)]+t1*D0[IX(i0+1,j0+1)]);}bnd(b,D);};
  const proj=()=>{for(let j=1;j<=H;j++)for(let i=1;i<=W;i++){dv[IX(i,j)]=-0.5*h*(u[IX(i+1,j)]-u[IX(i-1,j)]+v[IX(i,j+1)]-v[IX(i,j-1)]);p[IX(i,j)]=0;}bnd(0,dv);bnd(0,p);
    for(let k=0;k<20;k++){for(let j=1;j<=H;j++)for(let i=1;i<=W;i++)p[IX(i,j)]=(dv[IX(i,j)]+p[IX(i-1,j)]+p[IX(i+1,j)]+p[IX(i,j-1)]+p[IX(i,j+1)])/4;bnd(0,p);}
    for(let j=1;j<=H;j++)for(let i=1;i<=W;i++){u[IX(i,j)]-=0.5*(p[IX(i+1,j)]-p[IX(i-1,j)])/h;v[IX(i,j)]-=0.5*(p[IX(i,j+1)]-p[IX(i,j-1)])/h;}bnd(1,u);bnd(2,v);};
  let step=0;const ew=Math.max(2,P.emit*0.34*W),cx=(W+1)/2,cy=Math.max(4,N*0.12);
  const emit=on=>{if(!on)return;const tt=step*0.08;   // ต้นไฟ = ก้อนกลมใกล้พื้น สั่นไหวด้วย noise
    for(let j=Math.floor(cy-ew-1);j<=Math.ceil(cy+ew+1);j++)for(let i=Math.floor(cx-ew-1);i<=Math.ceil(cx+ew+1);i++){if(i<1||i>W||j<1||j>H)continue;const e=1-Math.hypot(i-cx,(j-cy)*1.4)/ew;if(e<=0)continue;
      const k=Math.pow(e,0.7)*(1-P.flick*0.8*(0.5+0.5*mkNoise(i*0.2,j*0.2+tt,tt*0.5,sd)));
      if(fire){T[IX(i,j)]=Math.max(T[IX(i,j)],k);d[IX(i,j)]=Math.max(d[IX(i,j)],k*0.35);}else{d[IX(i,j)]=Math.max(d[IX(i,j)],k);T[IX(i,j)]=Math.max(T[IX(i,j)],k*0.45);}
      v[IX(i,j)]+=0.5*k*dt;}};
  const sim=on=>{emit(on);
    const tn=step*0.04;for(let j=1;j<=H;j++)for(let i=1;i<=W;i++){const q=IX(i,j),tb=0.9*(T[q]+d[q]*0.5);   // ลอยตัว + ลมข้าง + ลมปั่นเล็ก ๆ (ให้เปลวพลิ้ว)
      v[q]+=dt*(P.buoy*0.75*T[q]-(fire?0.05:0.12)*d[q]+tb*mkNoise(i*0.13,j*0.13,tn,sd+5));u[q]+=dt*(P.wind*0.25*T[q]+tb*mkNoise(i*0.13+50,j*0.13,tn,sd+9));}
    if(P.vort>0){for(let j=1;j<=H;j++)for(let i=1;i<=W;i++)cu[IX(i,j)]=0.5*((v[IX(i+1,j)]-v[IX(i-1,j)])-(u[IX(i,j+1)]-u[IX(i,j-1)]))/h;
      for(let j=2;j<H;j++)for(let i=2;i<W;i++){const q=IX(i,j);let nx=Math.abs(cu[IX(i+1,j)])-Math.abs(cu[IX(i-1,j)]),ny=Math.abs(cu[IX(i,j+1)])-Math.abs(cu[IX(i,j-1)]);const l=Math.hypot(nx,ny)+1e-5;nx/=l;ny/=l;
        const e=P.vort*0.6*h*dt;u[q]+=e*ny*cu[q];v[q]-=e*nx*cu[q];}}
    proj();u0.set(u);v0.set(v);adv(1,u,u0);adv(2,v,v0);proj();d0.set(d);T0.set(T);adv(0,d,d0);adv(0,T,T0);
    // ความร้อนแผ่ออกข้าง ๆ เล็กน้อย (เปลวอ้วนขึ้น ไม่เป็นเส้นตรง)
    if(fire){T0.set(T);for(let j=1;j<=H;j++)for(let i=1;i<=W;i++){const q=IX(i,j);T[q]=T0[q]*0.8+(T0[q-1]+T0[q+1]+T0[q-W-2]+T0[q+W+2])*0.05;}}
    const ck=1-P.cool*(fire?0.11:0.04),dk=fire?1-0.02*(0.4+P.cool):0.996;for(let q=0;q<S;q++){T[q]*=ck;d[q]*=dk;}step++;};
  // เก็บเฟรม: ความร้อน + ความทึบ ขนาด px×px
  const px=o.px,shot=()=>{const Hh=new Float32Array(px*px),A=new Float32Array(px*px);
    const smp=(a,gx,gy)=>{gx=Math.max(0.5,Math.min(W+0.5,gx));gy=Math.max(0.5,Math.min(H+0.5,gy));const i0=Math.floor(gx),j0=Math.floor(gy),fx=gx-i0,fy=gy-j0;
      return (1-fx)*((1-fy)*a[IX(i0,j0)]+fy*a[IX(i0,j0+1)])+fx*((1-fy)*a[IX(i0+1,j0)]+fy*a[IX(i0+1,j0+1)]);};
    for(let y=0;y<px;y++)for(let x=0;x<px;x++){const gx=0.5+(x+0.5)/px*W,gy=0.5+(1-(y+0.5)/px)*H;
      // ขอบภาพจางลง (ไม่ให้เห็นเส้นตัดของกล่องจำลอง)
      const ex=Math.min(1,Math.min(x,px-1-x)/(px*0.06))*Math.min(1,y/(px*0.08)),tv=smp(T,gx,gy),dd=smp(d,gx,gy),q=y*px+x;
      if(fire){Hh[q]=Math.min(1,tv*1.5);A[q]=Math.min(1,(tv*2.2+dd*0.45)*ex);}
      else{const sh=dd-smp(d,gx,gy+1.5);Hh[q]=Math.min(1,Math.max(0,0.5+sh*1.8+tv*0.3));A[q]=Math.min(1,dd*1.35*ex);}}   // ควัน: แสงจากบน (หนาแน่นกว่าด้านบน = เงา)
    return {H:Hh,A};};
  const NF=o.cols*o.rows,spf=Math.max(1,P.steps|0),fr=[];
  if(o.kind==='life'){const total=NF*spf;for(let s=0;s<total+spf;s++){sim(s<Math.max(4,total*0.18));if(s%spf===spf-1&&fr.length<NF)fr.push(shot());}}
  else{for(let s=0;s<70;s++)sim(true);const B=NF>1?Math.max(2,Math.round(NF/4)):0;for(let f=0;f<NF+B;f++){for(let s=0;s<spf;s++)sim(true);fr.push(shot());}
    for(let f=0;f<B;f++){const k=f/B,a=fr[f],b=fr[NF+f];for(let q=0;q<a.H.length;q++){a.H[q]=a.H[q]*k+b.H[q]*(1-k);a.A[q]=a.A[q]*k+b.A[q]*(1-k);}}fr.length=NF;}
  const lut=txLUT(o.ramp),cv=document.createElement('canvas');cv.width=px*o.cols;cv.height=px*o.rows;const x=cv.getContext('2d');
  const img=x.createImageData(cv.width,cv.height),D=img.data,Wd=cv.width;
  fr.forEach((F,f)=>{const ox=(f%o.cols)*px,oy=Math.floor(f/o.cols)*px;for(let y=0;y<px;y++)for(let xx=0;xx<px;xx++){const q=y*px+xx,k=Math.round(Math.min(1,Math.max(0,F.H[q]))*255)*4,o4=((oy+y)*Wd+ox+xx)*4;
    D[o4]=lut[k];D[o4+1]=lut[k+1];D[o4+2]=lut[k+2];D[o4+3]=Math.round(Math.min(1,Math.max(0,F.A[q]))*255);}});
  x.putImageData(img,0,0);cv._rgba=D;return cv;}
// d (.tex.json) → canvas ภาพตารางเฟรม
function txRender(d){const o=txOpts(d);if(!TX_GLSL[o.gen]&&o.gen!=='sim')o.gen='fire';return o.gen==='sim'?txSim(o):txGpuRender(o);}
// ---------- เขียน .png เอง (สีไม่เพี้ยนตรงที่โปร่งใส — canvas.toBlob จะคูณ/หารด้วยความทึบจนสีขอบจางเพี้ยน) ----------
const TXCRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function txCrc(bufs){let c=0xffffffff;for(const b of bufs)for(let i=0;i<b.length;i++)c=TXCRC[(c^b[i])&255]^(c>>>8);return (c^0xffffffff)>>>0;}
async function txPng(cv){const px=cv._rgba;if(!px||typeof CompressionStream==='undefined')return new Promise(r=>cv.toBlob(r,'image/png'));
  const W=cv.width,H=cv.height,S=W*4,raw=new Uint8Array((S+1)*H),cand=[new Uint8Array(S),new Uint8Array(S),new Uint8Array(S)];
  for(let y=0;y<H;y++){const o=y*S,up=y>0;let best=0,bs=Infinity;   // เลือกตัวกรองต่อแถว (Sub / Up / Paeth) ที่ผลรวมน้อยสุด → บีบอัดได้ดี
    [1,2,4].forEach((f,fi)=>{const out=cand[fi];let sum=0;for(let i=0;i<S;i++){const a=i>=4?px[o+i-4]:0,b=up?px[o-S+i]:0,c=(i>=4&&up)?px[o-S+i-4]:0;let p;
        if(f===1)p=a;else if(f===2)p=b;else{const pa=Math.abs(b-c),pb=Math.abs(a-c),pc=Math.abs(a+b-2*c);p=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
        const v=(px[o+i]-p)&255;out[i]=v;sum+=v<128?v:256-v;}if(sum<bs){bs=sum;best=fi;}});
    raw[y*(S+1)]=[1,2,4][best];raw.set(cand[best],y*(S+1)+1);}
  const z=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
  const chunk=(type,data)=>{const len=new Uint8Array(4),crc=new Uint8Array(4),t=new TextEncoder().encode(type);new DataView(len.buffer).setUint32(0,data.length);new DataView(crc.buffer).setUint32(0,txCrc([t,data]));return [len,t,data,crc];};
  const ih=new Uint8Array(13),dv=new DataView(ih.buffer);dv.setUint32(0,W);dv.setUint32(4,H);ih[8]=8;ih[9]=6;
  return new Blob([new Uint8Array([137,80,78,71,13,10,26,10]),...chunk('IHDR',ih),...chunk('IDAT',z),...chunk('IEND',new Uint8Array(0))],{type:'image/png'});}
