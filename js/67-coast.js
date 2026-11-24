// =====================================================================
//  Sea-cliff backdrop (user 2026-11-22, ref photo: ruined castle on a grassy headland, ~40 m sheer cliffs, overcast sea)
//  Cliff Side Castle sits on a headland: sea on N / E / S, mainland fields to the west (behind the attackers' spawn),
//  two far cliff headlands, sea stacks, moving waves + foam rolling onto the rocks, overcast sky + fog.
//  BACKDROP[id].coast = settings (js/67-backdrop calls bdCoast) • BACKDROP[id].look = sky/fog/light (backdropLook, every map build, cached too)
//  Land = signed distance field (m, world coords, origin = map centre, -z = north): headland rect ∪ mainland (x < west coast) ∪ far headlands ∪ stacks
//  Mesh = one ring grid around the play area (fine near the cliffs, coarse far out) → land (Lambert, vertex colours) + sea (shader, same grid)
//  No collision / shadows / network. Debug: WD.coast
// =====================================================================
const COAST={sea:-40,   // sea level (m) under the map ground
  fogC:'#c4cbce',fogN:240,fogF:760,   // scene fog (land, castle)
  seaN:330,seaF:680};   // sea fades into the horizon colour (camera far = 700)
// near-edge detail bands (bdNearKit below; phi/pmid = same bands for painted wind trees, card trees cost more) • ?nobdlod = old flat backdrop (A/B + perf compare) • tint = m of grass next to the edge that takes the map ground colour (js/50 grassBake)
const BD_LOD={on:!/[?&]nobdlod\b/.test(location.search),hi:[55,115],mid:[140,230],phi:[40,95],pmid:[110,175],rock:[5,70],grass:36,live:[160,420],tint:18};
(function(){
  const cs={coast:{seed:5,
      jag:7,        // headland edge wobble (m)
      gap:20,       // grass between the outer border and the cliff edge (m, + wobble)
      main:66,      // mainland coast line, m east of the map's west edge (the forest end stands on the mainland, no water gap)
      heads:[{z:-1,off:330,L:440,dz:-70,r:58},{z:1,off:400,L:340,dz:60,r:64}],   // far headlands from the mainland coast (z side, distance from the map, length east, bend, half width)
      stacks:14},
    look:{sky:1,fog:[COAST.fogC,COAST.fogN,COAST.fogF],hemi:['#dfe6ea','#4c5a44',0.95],sun:['#eef1f2',0.95]},
    day:{fog:['#bfdcf4',320,1100],hemi:['#cfe6ff','#56703e',0.95],sun:['#fff4dc',1.5]}};   // bd.look 'day' = clear blue sky (map sky) + sun, fog = sky horizon colour
  BACKDROP.fcs=cs;BACKDROP['fcs-file']=cs;
})();
// ---------- 2D value noise (deterministic) ----------
function cvN(x,z,s){const xi=Math.floor(x),zi=Math.floor(z),fx=x-xi,fz=z-zi,h=(a,b)=>bdHash(a*57.13+b*131.7,s),u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
  const a=h(xi,zi),b=h(xi+1,zi),c=h(xi,zi+1),d=h(xi+1,zi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function cvF(x,z,s,o){let v=0,a=0.5,t=0;for(let i=0;i<(o||4);i++){v+=a*cvN(x,z,s+i*13);t+=a;x*=2.03;z*=2.03;a*=0.5;}return v/t;}
// ---------- overcast sky dome (shader: thick cloud deck on a flat layer, horizon = fog colour; no texture → no pole pinch / rings) ----------
var COAST_SKY=null;   // var: buildWorld runs before this file is evaluated
function coastSky(){
  if(COAST_SKY)return COAST_SKY;
  const C=c=>new THREE.Color(c),U={uT:{value:0},uFog:{value:C(COAST.fogC)},uZ:{value:C('#5f6c76')},uM:{value:C('#8d989f')},uLi:{value:C('#cfd5d8')},uDk:{value:C('#59636b')}};
  const m=new THREE.Mesh(new THREE.SphereGeometry(590,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:U,
    vertexShader:'varying vec3 vD;void main(){vec4 w=modelMatrix*vec4(position,1.0);vD=w.xyz-cameraPosition;gl_Position=projectionMatrix*viewMatrix*w;gl_Position.z=gl_Position.w;}',
    fragmentShader:`uniform float uT;uniform vec3 uFog,uZ,uM,uLi,uDk;varying vec3 vD;
      float h2(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
      float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
      float fbm(vec2 p){float s=0.0,a=0.5;mat2 r=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<6;i++){s+=a*n2(p);p=r*p;a*=0.5;}return s;}
      void main(){vec3 d=normalize(vD);float h=d.y;
        vec3 c=mix(uFog,uM,smoothstep(0.0,0.35,h));c=mix(c,uZ,smoothstep(0.35,1.0,h));
        if(h>0.0){vec2 uv=d.xz/(h+0.1)*0.6,w=vec2(uT*0.005,uT*0.002);
          float n=fbm(uv+w),sh=smoothstep(0.42,0.8,fbm(uv*0.55+w*0.6+11.0)),n3=fbm(uv*2.4-w*1.6+5.0);
          vec3 cl=mix(uLi,uDk,sh*0.8);cl=mix(cl,uLi,smoothstep(0.55,0.85,n3)*0.3*(1.0-sh));   // heavy dark masses + lighter torn edges
          c=mix(c,cl,smoothstep(0.16,0.5,n)*smoothstep(0.0,0.3,h)*0.95);}
        c=mix(c,uFog,1.0-smoothstep(-0.03,0.16,h));   // horizon melts into the fog (= sea/land far colour)
        gl_FragColor=vec4(c,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`}));
  // Fill only the pixels left open by opaque scenery.
  m.name='coastSky';m.frustumCulled=false;m.renderOrder=100;
  m.onBeforeRender=()=>{m.position.copy(cam.position);U.uT.value=performance.now()/1000;if(scene.fog)U.uFog.value.copy(scene.fog.color);};
  COAST_SKY=m;return m;
}
// how far the backdrop reaches from the map centre (m): Map Builder bd.E past the edge • camera far / sea fade / look fog follow it (default 700 m camera)
function bdReach(id){const fm=MAPS[id]&&MAPS[id].fm,b=fm&&fm.bd&&fm.bd.on&&fm.bd.hg?fm.bd:null;return b?Math.max(MW,MH)*S3/2+(+b.E||600):0;}
function bdFar(id){const R=bdReach(id);return Math.min(6000,Math.max(700,R+150));}
// map look (sky / fog / light) — every buildWorld (cached maps too), after setSky
function backdropLook(id){const vf=bdFar(id);if(cam.far!==vf){cam.far=vf;cam.updateProjectionMatrix();}const fm=MAPS[id]&&MAPS[id].fm,fb=fm&&fm.bd&&fm.bd.on?fm.bd:null,B=BACKDROP&&BACKDROP[id],L=fb?(fb.look==='overcast'?BACKDROP.fcs.look:fb.look==='day'?BACKDROP.fcs.day:null):B&&B.look;if(typeof FF!=='undefined'){FF.ovc=0;FF.base=null;FF.on=false;}
  if(COAST_SKY)COAST_SKY.visible=false;SKY.mesh.visible=true;if(typeof paintOn==='function'&&paintOn(id))return;   // Painterly on: keep its day sky/fog/light (js/77)
  if(!L)return;   // forest fog blend re-captures its base from this look
  if(L.sky&&typeof FF!=='undefined'&&FF.sky&&FF.sky.parent===world){const U=FF.sky.material.uniforms;FF.ovc=1;   // castle map's own cloud sky → overcast blue-grey everywhere
    U.uK.value=1;FF.sky.visible=false;}   // its cloud sky is replaced by the coast sky dome (FF.ovc still hides the sun)
  if(L.sky){const k=coastSky();if(k.parent!==scene)scene.add(k);k.visible=true;SKY.mesh.visible=false;SKY.sun.visible=false;SKY.moon.visible=false;SKY.stars.visible=false;}
  if(L.fog){const s=Math.max(1,vf/700);scene.fog.color.set(L.fog[0]);scene.fog.near=L.fog[1]*s;scene.fog.far=L.fog[2]*s;}   // far reach → look fog stretched with the camera
  if(L.fog&&typeof BFA!=='undefined'){const F=scene.fog;BFA.key=builtKey;BFA.base={c:F.color.clone(),near:F.near,far:F.far,exp:gl.toneMappingExposure,bg:scene.background&&scene.background.isColor?scene.background.clone():null};}   // js/44 battlefield air rewrites the fog every frame from its snapshot → snapshot this look
  if(L.hemi){hemi.color.set(L.hemi[0]);hemi.groundColor.set(L.hemi[1]);hemi.intensity=L.hemi[2];}
  if(L.sun){moonL.color.set(L.sun[0]);moonL.intensity=L.sun[1];}
}
// ---------- land shape ----------
function coastShape(B,hx0,hz0,sk){
  const C=B.coast,sd=C.seed,mg=sk+C.gap,xw=-hx0+(C.main||0);   // xw = mainland coast line (x): inside the map's west end, so that end stands on the mainland
  const rect=(x,z,bx,bz,r)=>{const qx=Math.abs(x)-bx+r,qz=Math.abs(z)-bz+r;return Math.hypot(Math.max(qx,0),Math.max(qz,0))+Math.min(Math.max(qx,qz),0)-r;};
  const smin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*0.25;};
  const seg=(x,z,ax,az,bx,bz)=>{const vx=bx-ax,vz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/(vx*vx+vz*vz)));return [Math.hypot(x-ax-vx*t,z-az-vz*t),t];};
  const heads=C.heads.map(H=>{const zc=H.z*(hz0+mg+H.off);return {ax:xw-60,az:zc,bx:xw+H.L,bz:zc+H.dz,r:H.r};});
  // sea stacks: just off the headland cliffs (N / E / S) + a few off the far headlands
  const stacks=[];
  for(let i=0;i<C.stacks;i++){const u=bdHash(i,sd+40),side=i%3,o=14+bdHash(i,sd+41)*38,r=3+bdHash(i,sd+42)*8,h=8+bdHash(i,sd+43)*30;let x,z;
    if(side===1){x=hx0+mg+o;z=(u*2-1)*(hz0+mg);}else{x=-hx0*0.6+u*(hx0*1.6+mg);z=(side?1:-1)*(hz0+mg+o);}
    stacks.push({x,z,r,h});}
  for(const H of heads)for(let i=0;i<3;i++){const t=0.75+i*0.12;stacks.push({x:H.ax+(H.bx-H.ax)*t+40+i*25,z:H.az+(H.bz-H.az)*t+(i-1)*30,r:6+i*3,h:14+i*6});}
  const land=(x,z)=>{   // signed distance to the cliff edge (m): < 0 = land
    const u=(Math.atan2(z,x)/(Math.PI*2)+1)%1,j=(bdFbm(u,sd,18)-0.5)*2*C.jag+(bdFbm(u,sd+3,70)-0.5)*5;
    let d=rect(x,z,hx0+mg,hz0+mg,26)-j;
    d=smin(d,x-xw-(cvF(z*0.006,3.1,sd+5)-0.5)*70,40);
    for(const H of heads){const [q,t]=seg(x,z,H.ax,H.az,H.bx,H.bz);d=Math.min(d,q-H.r*(1-0.45*t*t)-(cvF(x*0.02,z*0.02,sd+7)-0.5)*22);}
    return d;};
  const stack=(x,z)=>{let best=1e9,h=0;for(const s of stacks){const d=Math.hypot(x-s.x,z-s.z)-s.r-(cvN(x*0.25,z*0.25,sd+9)-0.5)*3;if(d<best){best=d;h=s.h;}}return [best,h];};
  // grass top height: ~0 at the map, rolling hills further out (fields to the west, higher far headlands)
  const top=(x,z)=>{const ox=Math.max(0,Math.abs(x)-hx0-mg-40),oz=Math.max(0,Math.abs(z)-hz0-mg-40),far=Math.hypot(ox,oz),k=Math.min(1,far/420);
    return -0.1+k*k*(6+26*cvF(x*0.004,z*0.004,sd+11))+(cvN(x*0.05,z*0.05,sd+12)-0.5)*0.8*Math.min(1,far/30);};
  return {land,stack,top,inside:(x,z)=>Math.abs(x)<hx0+sk-1.5&&Math.abs(z)<hz0+sk-1.5};
}
// height of the backdrop surface at (x,z) • also returns the sea distance (m, > 0 = water)
function coastH(S,x,z,out){
  const SEA=COAST.sea,dl=S.land(x,z),[ds,sh]=S.stack(x,z),jit=(cvF(x*0.09,z*0.09,77,3)-0.5)*7,d=dl+jit,t=S.top(x,z);
  let y;
  if(S.inside(x,z))y=-3;   // under the real map ground
  else if(d<-3)y=t;
  else if(d<9){const s=(d+3)/12,b=Math.pow(s,0.85),st=b+0.045*Math.sin(b*Math.PI*9+cvN(x*0.07,z*0.07,31)*4);   // sheer face with strata steps, rounded grass lip
    y=t+(SEA-4-t)*Math.min(1,Math.max(0,st))-(s<0.12?0:0);}
  else if(d<24)y=SEA-4-(d-9)*0.35+Math.pow(cvF(x*0.11,z*0.11,51,3),2.2)*9;   // boulder apron at the foot (some break the surface → foam)
  else y=SEA-10-Math.min(30,(d-24)*0.08);
  if(ds<9){const k=ds<0?1:1-ds/9,yh=SEA+sh*(ds<-2?1:0.6+0.4*k)+(cvN(x*0.3,z*0.3,61)-0.5)*3;y=Math.max(y,ds<0?yh:SEA-6+(yh-SEA+6)*k*k);}   // stacks
  if(out){out.sd=Math.min(d,ds);out.d=d;out.t=t;}
  return y;
}
// ---------- height sources: one interface for the code coast (BACKDROP.fcs) and Map Builder backdrops (data.bd) ----------
// src.h(x,z,o) → height (world m) and o.sd (m to the shore, > 0 = water), o.d (land distance for the turf lip), o.w (cliff relief 0..1), o.si (painted surface, 0 = auto)
// src.sea = sea level or null • src.trees(low) → [x,z,y,scale,…]
function coastSrcProc(B,hx0,hz0,sk,low){
  const S=coastShape(B,hx0,hz0,sk),SEA=COAST.sea;
  return {sea:SEA,S,h(x,z,o){const y=coastH(S,x,z,o);o.w=Math.min(1,Math.max(0,(o.t-y-0.6)/5))*Math.min(1,Math.max(0,(y-SEA+3)/5));o.si=0;return y;},
    trees(){return coastTreePts(S,hx0,hz0,low);}};
}
// Map Builder backdrop grid (mapbuild/backdrop.js — same blend / stack / tree rules)
const BD_SURF=['#000000','#4f7034','#3a542c','#7d8650','#6a645c','#c8b88a','#6e5a40','#e8edf0'];   // = BSURF in mapbuild/backdrop.js
function bdB64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
function bdRle(s,n){const b=bdB64(s),u=new Uint8Array(n);let p=0;for(let i=0;i+1<b.length&&p<n;i+=2){u.fill(b[i+1],p,Math.min(n,p+b[i]));p+=b[i];}return u;}
function bdHsh(a,b){let h=Math.imul(a|0,374761393)^Math.imul(b|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
function bdGridSrc(J,hx0,hz0,low){
  const nx=J.nx,ny=J.ny,n=nx*ny,c=J.c,hb=bdB64(J.hg),h16=new Int16Array(hb.buffer,0,hb.length>>1),hg=new Float32Array(n);for(let i=0;i<n&&i<h16.length;i++)hg[i]=h16[i]/10;
  const sf=bdRle(J.sf,n),tr=bdRle(J.tr,n),sea=J.sea==null?null:+J.sea,X0=J.x0-hx0,Z0=J.z0-hz0;   // grid origin in world m
  const st=(J.st||[]).map(q=>({x:q.x-hx0,z:q.z-hz0,r:+q.r,h:+q.h}));
  // signed shore distance per cell (m, > 0 = water): two-pass chamfer from each side
  const sd=new Float32Array(n);
  if(sea!=null){const W=new Uint8Array(n);for(let k=0;k<n;k++)W[k]=hg[k]<sea?1:0;
    const dist=want=>{const D=new Float32Array(n);for(let k=0;k<n;k++)D[k]=W[k]===want?1e6:0;const a=c,b=c*1.4142;
      for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*nx+i;let v=D[k];if(!v)continue;if(i>0)v=Math.min(v,D[k-1]+a);if(j>0){v=Math.min(v,D[k-nx]+a);if(i>0)v=Math.min(v,D[k-nx-1]+b);if(i<nx-1)v=Math.min(v,D[k-nx+1]+b);}D[k]=v;}
      for(let j=ny-1;j>=0;j--)for(let i=nx-1;i>=0;i--){const k=j*nx+i;let v=D[k];if(!v)continue;if(i<nx-1)v=Math.min(v,D[k+1]+a);if(j<ny-1){v=Math.min(v,D[k+nx]+a);if(i<nx-1)v=Math.min(v,D[k+nx+1]+b);if(i>0)v=Math.min(v,D[k+nx-1]+b);}D[k]=v;}
      return D;};
    const dw=dist(1),dl=dist(0);for(let k=0;k<n;k++)sd[k]=W[k]?Math.min(dw[k],5e3)-c*0.5:-(Math.min(dl[k],5e3)-c*0.5);}
  else sd.fill(-1e3);
  const bil=(A,x,z)=>{const fx=Math.min(nx-1.001,Math.max(0,(x-X0)/c)),fz=Math.min(ny-1.001,Math.max(0,(z-Z0)/c)),i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*nx+i;return (A[k]*(1-u)+A[k+1]*u)*(1-v)+(A[k+nx]*(1-u)+A[k+nx+1]*u)*v;};
  const edge=(x,z)=>GY(Math.min(MW,Math.max(0,x/S3+MW/2)),Math.min(MH,Math.max(0,z/S3+MH/2)));   // map ground at the nearest edge point (m)
  const raw=(x,z)=>{let y=bil(hg,x,z);const e=Math.max(Math.abs(x)-hx0,Math.abs(z)-hz0);if(e<12){const t=Math.min(1,Math.max(0,e/12)),q=t*t*(3-2*t);y=edge(x,z)*(1-q)+y*q;}return y;};
  const stk=(x,z,y,o)=>{let ds=1e9;for(const s of st){const d=Math.hypot(x-s.x,z-s.z)-s.r-(cvN(x*0.25,z*0.25,9)-0.5)*3;if(d<ds)ds=d;if(d<6){const base=sea!=null?sea:y,k=d<0?1:1-d/6,yh=base+s.h*(d<-2?1:0.6+0.4*k)+(cvN(x*0.3,z*0.3,61)-0.5)*3;y=Math.max(y,d<0?yh:base-6+(yh-base+6)*k*k);}}if(o)o.ds=ds;return y;};
  const src={sea,
    hq(x,z){return stk(x,z,raw(x,z),null);},   // height only (grass bake)
    h(x,z,o){const e=Math.max(Math.abs(x)-hx0,Math.abs(z)-hz0);
      if(e<-1.5){o.sd=-50;o.d=-50;o.w=0;o.si=0;return edge(x,z)-3;}   // under the real map ground
      let y=raw(x,z);const sl=Math.max(Math.abs(raw(x+c*0.5,z)-raw(x-c*0.5,z)),Math.abs(raw(x,z+c*0.5)-raw(x,z-c*0.5)))/c;
      y=stk(x,z,y,o);o.sd=Math.min(bil(sd,x,z),o.ds);o.d=-1e3;
      o.w=Math.min(1,Math.max(0,(sl-0.8)/0.8))*(sea!=null?Math.min(1,Math.max(0,(y-sea+3)/5)):1);
      o.si=sf[Math.min(ny-1,Math.max(0,Math.round((z-Z0)/c)))*nx+Math.min(nx-1,Math.max(0,Math.round((x-X0)/c)))];return y;},
    trees(){const P=[],cap=low?1200:4500,o={},yAt=(x,z)=>src.h(x,z,o),sl=sea!=null?sea:-1e9,nt=Math.min(32,Math.max(2,Math.round(2*(c/5)*(c/5))));   // tries per cell: same trees per m² on a coarse grid
      for(let j=0;j<ny&&P.length<cap*4;j++)for(let i=0;i<nx;i++){const k=j*nx+i,t=tr[k];if(!t)continue;
        for(let q=0;q<nt;q++){const id=nt===2?k*2+q:k*64+q;if(bdHsh(id,991)>=t/255*0.8)continue;
          const x=X0+(i+bdHsh(id,992)-0.5)*c,z=Z0+(j+bdHsh(id,994)-0.5)*c;if(Math.max(Math.abs(x)-hx0,Math.abs(z)-hz0)<8)continue;
          const y=yAt(x,z);if(y<sl+0.8)continue;if(Math.max(Math.abs(yAt(x+2,z)-yAt(x-2,z)),Math.abs(yAt(x,z+2)-yAt(x,z-2)))/4>1.1)continue;
          P.push(x,z,y,0.9+bdHsh(id,993)*0.9);if(P.length>=cap*4)break;}}
      return P;}};
  return src;
}
// ring grid around the play area: t = along a rounded rect perimeter, r = outward along its normal
function coastGrid(hx0,hz0,sk,low,reach){
  const bx=hx0+sk-2,bz=hz0+sk-2,rc=22,hd=BD_LOD.on&&!low,sp=low?7:hd?3:4.5,ca=low?16:hd?32:24,pts=[];
  const side=(ax,az,bx2,bz2,nx,nz)=>{const L=Math.hypot(bx2-ax,bz2-az),n=Math.max(2,Math.round(L/sp));for(let i=0;i<n;i++){const t=i/n;pts.push([ax+(bx2-ax)*t,az+(bz2-az)*t,nx,nz]);}};
  const arc=(cx,cz,a0)=>{for(let i=0;i<ca;i++){const a=a0+i/ca*Math.PI/2,c=Math.cos(a),s=Math.sin(a);pts.push([cx+c*rc,cz+s*rc,c,s]);}};
  // clockwise in screen (x right, z down): north edge (-z) west→east, NE corner, east edge, SE, south east→west, SW, west, NW
  side(-bx+rc,-bz,bx-rc,-bz,0,-1);arc(bx-rc,-bz+rc,-Math.PI/2);side(bx,-bz+rc,bx,bz-rc,1,0);arc(bx-rc,bz-rc,0);
  side(bx-rc,bz,-bx+rc,bz,0,1);arc(-bx+rc,bz-rc,Math.PI/2);side(-bx,bz-rc,-bx,-bz+rc,-1,0);arc(-bx+rc,-bz+rc,Math.PI);
  const rs=[];let r=0;const rEnd=Math.max(1300,(reach||0)+120);while(r<rEnd){rs.push(r);r+=r<62?(low?2.8:1.6):r<110?(low?5:3.5):Math.min(80,3.5*Math.pow(1.12,(r-110)/6));}   // finer rows over the cliff face and its base
  return {pts,rs};
}
function bdCoast(id,B){
  const hx0=MW/2*S3,hz0=MH/2*S3,fm=MAPS[id]&&MAPS[id].fm,low=!gq('detail'),sk=B.grid?0:fm&&fm.skirt>0?+fm.skirt:0;
  const src=B.grid?bdGridSrc(B.grid,hx0,hz0,low):coastSrcProc(B,hx0,hz0,sk,low),SEA=src.sea!=null?src.sea:-1e4,S=src.S;
  const {pts,rs}=coastGrid(hx0,hz0,sk,low,B.grid?+B.grid.E||600:0),NT=pts.length,NR=rs.length,N=NT*NR;
  const pos=new Float32Array(N*3),sea=new Float32Array(N*3),sdA=new Float32Array(N),ofA=new Float32Array(N),dA=new Float32Array(N),siA=new Uint8Array(N),o={};
  for(let i=0;i<NT;i++){const [px,pz,nx,nz]=pts[i];for(let j=0;j<NR;j++){const k=i*NR+j,x=px+nx*rs[j],z=pz+nz*rs[j],y=src.h(x,z,o);
    // cliff face relief: vertical buttresses + crevices (noise along the coast, slow in height → no folds), pushed along the outward normal
    const w=o.w,u=x+z,
      off=w?((cvF(u*0.045,y*0.012,201,3)-0.5)*7+(cvN(u*0.23,y*0.05,202)-0.5)*2.2)*w:0;
    pos[k*3]=x+nx*off;pos[k*3+1]=y;pos[k*3+2]=z+nz*off;sea[k*3]=x;sea[k*3+1]=SEA;sea[k*3+2]=z;sdA[k]=o.sd;ofA[k]=off;dA[k]=o.d;siA[k]=o.si;}}
  const idx=[];for(let i=0;i<NT;i++){const i2=(i+1)%NT;for(let j=0;j<NR-1;j++){const a=i*NR+j,b=i2*NR+j;idx.push(a,b,a+1,a+1,b,b+1);}}
  const g=new THREE.Group();g.name='backdrop';
  // land
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(pos,3));lg.setIndex(idx);lg.computeVertexNormals();
  const nrm=lg.attributes.normal,col=new Float32Array(N*3),c=new THREE.Color(),Q=h=>new THREE.Color(h),
    G1=Q('#4b6b33'),G2=Q('#5f8040'),G3=Q('#3a542c'),FD=Q('#7d8650'),FB=Q('#6e6e4a'),DT=Q('#8f8a78'),
    R1=Q('#4d4943'),R2=Q('#7a736b'),R3=Q('#35332f'),MO=Q('#4f663a'),WET=Q('#262524'),SA=Q('#b9a97c'),SN=Q('#e4e9ec'),PS=BD_SURF.map(Q),
    XC=B.grid?(BD_LOD.on?1e9:-1e9):-189,hd=BD_LOD.on&&!low,tv=[];   // XC = castle side starts (forest end west of it) — code coast only (Map Builder maps: edge grass takes the map ground colour instead, bdTint) • tv = edge grass vertices
  for(let k=0;k<N;k++){const x=pos[k*3],y=pos[k*3+1],z=pos[k*3+2],ny=nrm.getY(k),n=cvN(x*0.08,z*0.08,91),n2=cvN(x*0.013,z*0.013,92),of=ofA[k];
    if(siA[k]){c.copy(PS[siA[k]]||PS[1]).multiplyScalar(0.9+0.2*n);if(ny<0.6&&siA[k]!==4)c.lerp(R2,0.35);if(y<SEA+2.5)c.lerp(WET,0.6);}   // painted in Map Builder
    else if(ny>0.8&&y>SEA+6){c.copy(G1).lerp(G2,n2*0.8).lerp(G3,n*0.35);   // grass
      const e=Math.max(Math.abs(x)-hx0,Math.abs(z)-hz0);   // m outside the map edge
      if(e>40){const f=cvN(x*0.011+n*0.25,z*0.017,94);if(f>0.62)c.lerp(FD,Math.min(1,(f-0.62)*6)*0.7);else if(f<0.3)c.lerp(G3,Math.min(1,(0.3-f)*5)*0.6);   // field patchwork
        if(cvN(x*0.006,z*0.006,95)>0.7)c.lerp(FB,0.35);}
      if(e<9&&x>XC)c.lerp(DT,(1-Math.max(0,e)/9)*0.55);   // worn ground next to the castle's stone yard
      if(dA[k]>-6&&dA[k]<-2.5)c.lerp(G3,0.35);
      if(hd&&e<BD_LOD.tint)tv.push(k);
      if(y>110)c.lerp(SN,Math.min(1,(y-110)/25));}   // snow up high
    else if(ny>0.8&&y>SEA-3){c.copy(SA).multiplyScalar(0.92+0.16*n);if(y<SEA+0.6)c.lerp(WET,0.35);}   // beach / shallows
    else{const band=0.5+0.5*Math.sin(y*0.9+n*2.5),st=cvN((x+z)*0.6,y*0.04,96);
      c.copy(R1).lerp(R2,band*0.5+st*0.25).lerp(R3,cvN(x*0.03,z*0.03+y*0.05,93)*0.45);
      c.multiplyScalar(Math.min(1.18,Math.max(0.55,1+of*0.09)));   // recessed = shaded, buttresses lit
      if(ny>0.45&&y>SEA+4)c.lerp(MO,(ny-0.45)*1.6*(0.5+n*0.5));   // moss on ledges
      if(y<SEA+2.5)c.lerp(WET,0.7);}   // wet rock at the waterline
    col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;}
  lg.setAttribute('color',new THREE.BufferAttribute(col,3));
  const lmat=!hd?new THREE.MeshLambertMaterial({vertexColors:true}):grLive(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95,metalness:0}),BD_LOD.live);
  if(hd&&typeof surfApply==='function')surfApply(lmat,true);   // play-area ground detail (js/50 grLive + js/76 surface) — both fade out with camera distance
  const lm=new THREE.Mesh(lg,lmat);lm.name='coastLand';g.add(lm);
  // sea (same grid, flat at sea level, sd = distance to the shore for foam / shallow colour)
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sea,3));sg.setAttribute('sd',new THREE.BufferAttribute(sdA,1));sg.setIndex(idx);
  const U={uT:{value:0},uDeep:{value:new THREE.Color('#174652')},uShal:{value:new THREE.Color('#3a9490')},uSky:{value:new THREE.Color('#c6cdd0')},uFoam:{value:new THREE.Color('#eef2f1')},
    uFogC:{value:new THREE.Color(COAST.fogC)},uFogN:{value:COAST.seaN*Math.max(1,bdFar(id)/700)},uFogF:{value:COAST.seaF*Math.max(1,bdFar(id)/700)},uL:{value:new THREE.Vector3()}};
  const sm=new THREE.ShaderMaterial({uniforms:U,fog:false,
    vertexShader:`attribute float sd;uniform float uT;varying vec3 vW;varying float vS;
      void main(){vec3 p=position;float k=smoothstep(2.0,30.0,sd);
        p.y+=k*(0.45*sin(dot(p.xz,vec2(0.071,0.052))+uT*0.9)+0.28*sin(dot(p.xz,vec2(-0.043,0.097))+uT*1.3));
        vec4 w=modelMatrix*vec4(p,1.0);vW=w.xyz;vS=sd;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform float uT;uniform vec3 uDeep,uShal,uSky,uFoam,uFogC,uL;uniform float uFogN,uFogF;varying vec3 vW;varying float vS;
      float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+1.0),f.x),f.y);}
      vec2 wv(vec2 p,vec2 d,float f,float sp,float a){float ph=dot(p,d)*f+uT*sp;return d*(a*f*cos(ph));}
      void main(){vec2 p=vW.xz;
        vec2 g=wv(p,normalize(vec2(0.8,0.6)),0.21,1.3,0.32)+wv(p,normalize(vec2(-0.5,0.9)),0.34,1.7,0.18)+wv(p,normalize(vec2(0.95,-0.3)),0.57,2.3,0.09)+wv(p,normalize(vec2(-0.7,-0.7)),0.9,2.9,0.05);
        g+=(vec2(vn(p*0.35+uT*0.15),vn(p*0.35-uT*0.12+7.0))-0.5)*0.12;
        vec3 N=normalize(vec3(-g.x,1.0,-g.y)),V=normalize(cameraPosition-vW);
        float fr=pow(1.0-max(dot(N,V),0.0),4.0);
        float sh=1.0-smoothstep(4.0,55.0,vS);
        vec3 c=mix(uDeep,uShal,sh*0.85);
        c*=0.9+0.2*vn(p*0.05+uT*0.02);
        c=mix(c,uSky,0.06+0.38*fr);
        c+=pow(max(dot(reflect(-uL,N),V),0.0),60.0)*0.08;
        // foam: churn on the rocks + swells rolling in toward the shore + scattered whitecaps
        float n1=vn(p*0.45+vec2(uT*0.3,-uT*0.2)),n2=vn(p*1.3-uT*0.4);
        float shore=1.0-smoothstep(0.0,2.5+4.0*n1,vS);
        float roll=smoothstep(0.62,0.96,sin(vS*0.42+uT*1.7+n1*5.0))*(1.0-smoothstep(3.0,26.0,vS))*smoothstep(0.25,0.7,n2);
        float lace=smoothstep(0.55,0.9,n2*n1*1.8)*(1.0-smoothstep(2.0,14.0,vS));
        float caps=smoothstep(0.86,0.97,vn(p*0.06+vec2(uT*0.04,uT*0.03)))*smoothstep(0.5,0.8,n2)*0.6;
        float f=clamp(max(max(shore,roll*0.85),max(lace*0.6,caps)),0.0,1.0);
        c=mix(c,uFoam,f);
        float d=distance(cameraPosition,vW);c=mix(c,uFogC,smoothstep(uFogN,uFogF,d));
        gl_FragColor=vec4(c,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const so=new THREE.Mesh(sg,sm);so.name='coastSea';so.frustumCulled=false;so.visible=src.sea!=null;
  so.onBeforeRender=()=>{U.uT.value=performance.now()/1000;if(scene.fog)U.uFogC.value.copy(scene.fog.color);U.uL.value.copy(LDIR);};
  g.add(so);
  const TP=src.trees();let tr=coastTreeMesh(TP,low);if(tr)g.add(tr);
  for(const q of g.children){q.castShadow=q.receiveShadow=false;}
  if(hd)bdNearKit(g,TP,src,hx0,hz0,(far,round)=>{if(tr){g.remove(tr);tr.children[0]&&tr.children[0].geometry.dispose();}tr=coastTreeMesh(far,low,round);if(tr)g.add(tr);},typeof world!=='undefined'?world:null);
  if(typeof world!=="undefined"&&world){const ho={},W=world;W.userData.bdH=src.hq||((x,z)=>src.h(x,z,ho));world.userData.bdM=hd?BD_LOD.grass:0;
    world.userData.bdTint=hd&&tv.length?(smp,arr)=>{const T=BD_LOD.tint,out=arr||[];   // smp(x,z) → map edge ground colour (linear rgb) or null • arr = saved result (grass cache hit)
      if(!arr)for(const k of tv){const x=pos[k*3],z=pos[k*3+2],e=Math.max(0,Math.max(Math.abs(x)-hx0,Math.abs(z)-hz0)),c0=smp(x,z);if(!c0)continue;const t=Math.min(1,e/T),w=1-t*t*(3-2*t);out.push(k,c0[0],c0[1],c0[2],w);}
      for(let i=0;i<out.length;i+=5){const k=out[i],w=out[i+4];for(let a=0;a<3;a++)col[k*3+a]+=(out[i+1+a]-col[k*3+a])*w;}
      lg.attributes.color.needsUpdate=true;W.userData.bdTinted=1;return out;}:null;}   // grass bake carries on past the edge (js/50 grassBake)
  if(window.WD)WD.coast={g,S,src,H:(x,z)=>src.h(x,z,{}),N,LOD:BD_LOD};
  return g;
}
// Pine clumps on the mainland and far headlands extend the forest beyond the play area.
function coastTreePts(S,hx0,hz0,low){
  const R=mulberry(9051),sp=low?13:7,cap=low?900:3200,P=[],X0=-hx0-640,X1=hx0+260;
  for(let x=X0;x<X1;x+=sp)for(let z=-hz0-620;z<hz0+620;z+=sp){if(P.length>=cap*2)break;
    const px=x+(R()-0.5)*sp,pz=z+(R()-0.5)*sp,e=Math.max(Math.abs(px)-hx0,Math.abs(pz)-hz0);if(e<22||e>640)continue;
    let k=cvF(px*0.007,pz*0.007,301,3);if(px<-hx0&&Math.abs(pz)<hz0+80)k+=0.25*(1-Math.min(1,(-hx0-px)/220));   // forest continues west of the map
    if(k<0.55||R()>(k-0.5)*2.2)continue;if(S.land(px,pz)>-9)continue;P.push(px,pz);}
  const n=Math.min(cap,P.length/2),Q=[];for(let i=0;i<n;i++){const x=P[i*2],z=P[i*2+1];Q.push(x,z,S.top(x,z)-0.3,0.9+R()*0.9);}return Q;
}
function coastTreeMesh(P,low,round){   // round = broadleaf blobs (maps whose forest is the painted wind trees)
  if(!P.length)return null;
  const R=mulberry(9052),tiles=new Map(),group=new THREE.Group();
  group.name='coastTrees';
  const M=(y,sx)=>new THREE.Matrix4().makeTranslation(0,y,0).multiply(new THREE.Matrix4().makeScale(sx||1,1,sx||1));
  const sides=low?4:5;
  const geo=round?ffMerge([[new THREE.CylinderGeometry(0.22,0.34,4.4,4),'#4a3a2a',M(2.2)],
    [new THREE.IcosahedronGeometry(2.9,0),'#2c6a30',M(6.4,1.15),'#4f9238'],
    [new THREE.IcosahedronGeometry(2.2,0),'#3a7d34',M(8.6),'#6aaa40'],
    [new THREE.IcosahedronGeometry(1.7,0),'#2a6430',M(6.2,1.5),'#4a8a36']])
   :ffMerge([[new THREE.CylinderGeometry(0.2,0.32,2.4,4),'#4a3828',M(1.2)],
    [new THREE.ConeGeometry(2.5,5.4,sides),'#1c2f1d',M(4.2),'#2c4829'],
    [new THREE.ConeGeometry(1.8,5.4,sides),'#243c25',M(6.8),'#3d5f35']]);
  const mat=new THREE.MeshLambertMaterial({vertexColors:true});
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),sc=new THREE.Vector3(),cl=new THREE.Color(),Y=new THREE.Vector3(0,1,0);
  for(let i=0;i<P.length;i+=4){
    const key=Math.floor(P[i]/180)+','+Math.floor(P[i+1]/180);
    if(!tiles.has(key))tiles.set(key,[]);
    tiles.get(key).push(i);
  }
  for(const indices of tiles.values()){
    const mesh=new THREE.InstancedMesh(geo,mat,indices.length);
    mesh.name='coastTrees';
    for(let j=0;j<indices.length;j++){
      const i=indices[j],s=P[i+3];
      q.setFromAxisAngle(Y,R()*6.28);
      sc.set(s*(0.85+R()*0.3),s*(0.9+R()*0.4),s);
      v.set(P[i],P[i+2]-0.3,P[i+1]);
      mesh.setMatrixAt(j,m.compose(v,q,sc));
      mesh.setColorAt(j,cl.setScalar(0.8+R()*0.35));
    }
    mesh.computeBoundingSphere();
    group.add(mesh);
  }
  return group;
}
// ---------- near-edge detail bands (user 2026-11-23: backdrop next to the play area as detailed as the play area, then less and less with distance) ----------
// e = m outside the map edge • trees: e < hi → gorge kit pines (same models as the castle forest), < mid → light pines (pine_la/lb), beyond → instanced cones
// band changes are a per-tree random chance (smoothstep) → no visible line, nothing swaps while playing (no popping)
// ground: stones / shrubs / ferns thin out over rock[] • grass blades: grassBake carries on BD_LOD.grass m past the edge (js/50) • land shading: grLive fades over live[] (camera m)
// tree style follows the map: forest of painted wind trees (Map Builder kit ptree/*, js/77) → same trees + bushes past the edge, round far blobs
function bdNearKit(g,P,src,hx0,hz0,swap,W){
  if(typeof gltfLoader!=='function'||typeof ffParts!=='function')return;
  Promise.all([gltfLoader().then(L=>L.loadAsync('assets/mapkit/gorge.glb?v=9')),(W&&W.userData.ptReady)||0]).then(([gltf,ptN])=>{
    if(!g.parent)return;   // map already dropped
    const PK=ptN>=12&&typeof paintKit==='function'?paintKit():null;
    const E=(x,z)=>Math.max(Math.abs(x)-hx0,Math.abs(z)-hz0),ss=(a,t)=>{t=Math.min(1,Math.max(0,(t-a[0])/(a[1]-a[0])));return t*t*(3-2*t);};
    const o={},sea=src.sea!=null?src.sea+1:-1e9,items={},far=[],put=(id,x,y,z,s,lean)=>{(items[id]=items[id]||[]).push([x,y,z,s,lean]);};
    const ground=(x,z)=>{const y=src.h(x,z,o);return y<sea||o.w>0.15||E(x,z)<2?null:y;};   // dry, not cliff, outside the map
    const HOF={pine_a:20.5,pine_b:26.3,pine_c:15.6,pine_d:31.1,pine_la:24.3,pine_lb:19.5},HI=['pine_a','pine_b','pine_c','pine_d'];
    for(let i=0;i<P.length;i+=4){const x=P[i],z=P[i+1],y=P[i+2],s=P[i+3],e=E(x,z),r=bdHsh(i,7001),h=10.5*s;
      if(PK){const sc=0.95+(s-0.9)*0.75;if(r<1-ss(BD_LOD.phi,e)){put('pt'+((bdHsh(i,7002)*4)|0),x,y,z,sc,1);if(bdHsh(i,7004)<0.45){const a=bdHsh(i,7010)*6.283,d=3+bdHsh(i,7011)*4,fx=x+Math.cos(a)*d,fz=z+Math.sin(a)*d,fy=ground(fx,fz);if(fy!=null)put('pb'+(bdHsh(i,7012)<0.5?0:1),fx,fy,fz,0.9+bdHsh(i,7013)*0.9,0);}}
        else if(r<1-ss(BD_LOD.pmid,e))put('pf'+(bdHsh(i,7003)<0.5?0:1),x,y,z,sc,1);else far.push(x,z,y,s);continue;}
      if(r<1-ss(BD_LOD.hi,e)){const id=HI[(bdHsh(i,7002)*HI.length)|0];put(id,x,y,z,h/HOF[id],1);
        if(bdHsh(i,7004)<0.5){const a=bdHsh(i,7010)*6.283,d=2.5+bdHsh(i,7011)*3.5,fx=x+Math.cos(a)*d,fz=z+Math.sin(a)*d,fy=ground(fx,fz);if(fy!=null)put(bdHsh(i,7012)<0.5?'fern_a':'fern_b',fx,fy,fz,0.9+bdHsh(i,7013)*0.8,0);}}
      else if(r<1-ss(BD_LOD.mid,e)){const id=bdHsh(i,7003)<0.5?'pine_la':'pine_lb';put(id,x,y,z,h*0.95/HOF[id],1);}
      else far.push(x,z,y,s);}
    const R=mulberry(7101),K0=BD_LOD.rock,ax=hx0+K0[1],az=hz0+K0[1];
    for(let n=0;n<4200;n++){const x=(R()*2-1)*ax,z=(R()*2-1)*az,e=E(x,z),q=R(),s=R();if(e<K0[0]||e>K0[1]||R()>1-ss([K0[0]+5,K0[1]],e))continue;
      const y=ground(x,z);if(y==null)continue;
      if(q<(PK?0.55:0.72))put(['stone_a','stone_b','stone_c'][(s*3)|0],x,y,z,0.7+R()*1.8,0);else if(PK)put('pb'+(s<0.5?0:1),x,y,z,0.8+R()*1.0,0);else if(q<0.86)put(s<0.5?'shrub_a':'shrub_b',x,y,z,0.8+R()*0.8,0);else put(s<0.5?'fern_a':'fern_b',x,y,z,0.8+R()*0.9,0);}
    const q=new THREE.Quaternion(),eu=new THREE.Euler(),sv=new THREE.Vector3(),pv=new THREE.Vector3(),tm=new THREE.Matrix4(),fin=new THREE.Matrix4(),kit=new THREE.Group();kit.name='bdKit';
    let tris=0;
    for(const id in items){const pg=PK&&/^p[tfb]\d$/.test(id)?PK[{t:'tree',f:'far',b:'bush'}[id[1]]][+id[2]]:null;
      if(pg){const L2=items[id],im=new THREE.InstancedMesh(pg,PK.mat,L2.length);L2.forEach(([x,y,z,s,lean],i)=>{eu.set(lean?(bdHsh(i,7031)-0.5)*0.07:0,bdHsh(i,7032)*6.283,lean?(bdHsh(i,7033)-0.5)*0.07:0);q.setFromEuler(eu);sv.setScalar(s);pv.set(x,y-0.1,z);im.setMatrixAt(i,fin.compose(pv,q,sv));});
        im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();im.castShadow=im.receiveShadow=false;im.name='bdKit_'+id;kit.add(im);tris+=(pg.index?pg.index.count:pg.attributes.position.count)/3*L2.length;continue;}
      const K=ffParts(gltf.scene,'g_'+id);if(!K)continue;const L2=items[id];tm.makeTranslation(K.off.x,K.off.y,K.off.z);
      const mats=L2.map(([x,y,z,s,lean],i)=>{eu.set(lean?(bdHsh(i,7031)-0.5)*0.07:0,bdHsh(i,7032)*6.283,lean?(bdHsh(i,7033)-0.5)*0.07:0);q.setFromEuler(eu);sv.setScalar(s);pv.set(x,y-0.05,z);return new THREE.Matrix4().compose(pv,q,sv);});
      for(const p of K.parts){const im=new THREE.InstancedMesh(p.g,p.m,L2.length);mats.forEach((M,i)=>{fin.multiplyMatrices(M,tm).multiply(p.rel);im.setMatrixAt(i,fin);});
        im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();im.castShadow=im.receiveShadow=false;im.name='bdKit_'+id;kit.add(im);
        tris+=(p.g.index?p.g.index.count:p.g.attributes.position.count)/3*L2.length;}}
    g.add(kit);swap(far,!!PK);
    if(window.WD&&WD.coast&&WD.coast.g===g)WD.coast.kit={n:Object.fromEntries(Object.entries(items).map(([k,v])=>[k,v.length])),far:far.length/4,draws:kit.children.length,tris:tris|0};
  }).catch(e=>console.warn('backdrop kit',e));
}
