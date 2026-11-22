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
(function(){
  const cs={coast:{seed:5,
      jag:10,       // headland edge wobble (m)
      gap:14,       // grass between the outer border and the cliff edge (m, + wobble)
      heads:[{z:-1,off:330,L:440,dz:-70,r:58},{z:1,off:400,L:340,dz:60,r:64}],   // far headlands from the mainland coast (z side, distance from the map, length east, bend, half width)
      stacks:14},
    look:{sky:1,fog:[COAST.fogC,COAST.fogN,COAST.fogF],hemi:['#dfe6ea','#4c5a44',0.95],sun:['#eef1f2',0.95]}};
  BACKDROP.fcs=cs;BACKDROP['fcs-file']=cs;
})();
// ---------- 2D value noise (deterministic) ----------
function cvN(x,z,s){const xi=Math.floor(x),zi=Math.floor(z),fx=x-xi,fz=z-zi,h=(a,b)=>bdHash(a*57.13+b*131.7,s),u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
  const a=h(xi,zi),b=h(xi+1,zi),c=h(xi,zi+1),d=h(xi+1,zi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function cvF(x,z,s,o){let v=0,a=0.5,t=0;for(let i=0;i<(o||4);i++){v+=a*cvN(x,z,s+i*13);t+=a;x*=2.03;z*=2.03;a*=0.5;}return v/t;}
// ---------- overcast sky texture (gradient + soft cloud masses, wraps horizontally) ----------
let COAST_SKY=null;
function coastSkyTex(){
  if(COAST_SKY)return COAST_SKY;
  COAST_SKY=texCanvas(1024,512,(g,w,h)=>{
    const r=g.createLinearGradient(0,0,0,h);[[0,'#76828c'],[0.3,'#9ba6ae'],[0.47,'#c3cacd'],[0.5,'#cdd3d4'],[0.54,'#b9c1c3'],[1,'#8e999c']].forEach(([p,c])=>r.addColorStop(p,c));
    g.fillStyle=r;g.fillRect(0,0,w,h);
    for(let i=0;i<220;i++){const x=bdHash(i,71)*w,y=h*(0.06+0.42*Math.pow(bdHash(i,72),0.8)),rx=40+bdHash(i,73)*170,ry=rx*(0.22+bdHash(i,74)*0.18),lt=bdHash(i,75)<0.55;
      for(const ox of [-w,0,w]){const gr=g.createRadialGradient(x+ox,y,0,x+ox,y,rx);gr.addColorStop(0,lt?'rgba(222,227,229,0.20)':'rgba(96,106,114,0.18)');gr.addColorStop(1,'rgba(0,0,0,0)');
        g.save();g.translate(x+ox,y);g.scale(1,ry/rx);g.translate(-(x+ox),-y);g.fillStyle=gr;g.beginPath();g.arc(x+ox,y,rx,0,Math.PI*2);g.fill();g.restore();}}
  });
  return COAST_SKY;
}
// map look (sky / fog / light) — every buildWorld (cached maps too), after setSky
function backdropLook(id){const B=BACKDROP&&BACKDROP[id],L=B&&B.look;if(typeof FF!=='undefined'){FF.ovc=0;FF.base=null;FF.on=false;}if(!L)return;   // forest fog blend re-captures its base from this look
  if(L.sky&&typeof FF!=='undefined'&&FF.sky&&FF.sky.parent===world){const U=FF.sky.material.uniforms;FF.ovc=1;   // castle map's own cloud sky → overcast blue-grey everywhere
    U.uZb.value.set('#717f89');U.uMb.value.set('#a2adb3');U.uHb.value.set('#cbd2d4');U.uSb.value.set('#f4f6f6');U.uK.value=1;}
  if(L.sky){SKY.mesh.material.map=coastSkyTex();SKY.mesh.material.color.set('#ffffff');SKY.mesh.material.needsUpdate=true;SKY.sun.visible=false;SKY.moon.visible=false;SKY.stars.visible=false;}
  if(L.fog){scene.fog.color.set(L.fog[0]);scene.fog.near=L.fog[1];scene.fog.far=L.fog[2];}
  if(L.fog&&typeof BFA!=='undefined'){const F=scene.fog;BFA.key=builtKey;BFA.base={c:F.color.clone(),near:F.near,far:F.far,exp:gl.toneMappingExposure,bg:scene.background&&scene.background.isColor?scene.background.clone():null};}   // js/44 battlefield air rewrites the fog every frame from its snapshot → snapshot this look
  if(L.hemi){hemi.color.set(L.hemi[0]);hemi.groundColor.set(L.hemi[1]);hemi.intensity=L.hemi[2];}
  if(L.sun){moonL.color.set(L.sun[0]);moonL.intensity=L.sun[1];}
}
// ---------- land shape ----------
function coastShape(B,hx0,hz0,sk){
  const C=B.coast,sd=C.seed,mg=sk+C.gap,xw=-hx0-sk-6;   // xw = mainland west coast line (x)
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
    return -0.35+k*k*(6+26*cvF(x*0.004,z*0.004,sd+11))+(cvN(x*0.05,z*0.05,sd+12)-0.5)*0.8*Math.min(1,far/30);};
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
  if(out){out.sd=Math.min(d,ds);}
  return y;
}
// ring grid around the play area: t = along a rounded rect perimeter, r = outward along its normal
function coastGrid(hx0,hz0,sk,low){
  const bx=hx0+sk-2,bz=hz0+sk-2,rc=22,sp=low?6:3.4,ca=low?20:36,pts=[];
  const side=(ax,az,bx2,bz2,nx,nz)=>{const L=Math.hypot(bx2-ax,bz2-az),n=Math.max(2,Math.round(L/sp));for(let i=0;i<n;i++){const t=i/n;pts.push([ax+(bx2-ax)*t,az+(bz2-az)*t,nx,nz]);}};
  const arc=(cx,cz,a0)=>{for(let i=0;i<ca;i++){const a=a0+i/ca*Math.PI/2,c=Math.cos(a),s=Math.sin(a);pts.push([cx+c*rc,cz+s*rc,c,s]);}};
  // clockwise in screen (x right, z down): north edge (-z) west→east, NE corner, east edge, SE, south east→west, SW, west, NW
  side(-bx+rc,-bz,bx-rc,-bz,0,-1);arc(bx-rc,-bz+rc,-Math.PI/2);side(bx,-bz+rc,bx,bz-rc,1,0);arc(bx-rc,bz-rc,0);
  side(bx-rc,bz,-bx+rc,bz,0,1);arc(-bx+rc,bz-rc,Math.PI/2);side(-bx,bz-rc,-bx,-bz+rc,-1,0);arc(-bx+rc,-bz+rc,Math.PI);
  const rs=[];let r=0,st=low?4:2.6;while(r<1300){rs.push(r);r+=st;if(r>110)st=Math.min(70,st*1.11);}
  return {pts,rs};
}
function bdCoast(id,B){
  const hx0=MW/2*S3,hz0=MH/2*S3,fm=MAPS[id]&&MAPS[id].fm,sk=fm&&fm.skirt>0?+fm.skirt:0,low=QUAL.mode==='low',SEA=COAST.sea;
  const S=coastShape(B,hx0,hz0,sk),{pts,rs}=coastGrid(hx0,hz0,sk,low),NT=pts.length,NR=rs.length,N=NT*NR;
  const pos=new Float32Array(N*3),sea=new Float32Array(N*3),sdA=new Float32Array(N),o={};
  for(let i=0;i<NT;i++){const [px,pz,nx,nz]=pts[i];for(let j=0;j<NR;j++){const k=i*NR+j,x=px+nx*rs[j],z=pz+nz*rs[j],y=coastH(S,x,z,o);
    pos[k*3]=x;pos[k*3+1]=y;pos[k*3+2]=z;sea[k*3]=x;sea[k*3+1]=SEA;sea[k*3+2]=z;sdA[k]=o.sd;}}
  const idx=[];for(let i=0;i<NT;i++){const i2=(i+1)%NT;for(let j=0;j<NR-1;j++){const a=i*NR+j,b=i2*NR+j;idx.push(a,b,a+1,a+1,b,b+1);}}
  const g=new THREE.Group();g.name='backdrop';
  // land
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(pos,3));lg.setIndex(idx);lg.computeVertexNormals();
  const nrm=lg.attributes.normal,col=new Float32Array(N*3),c=new THREE.Color(),G1=new THREE.Color('#5e8a3c'),G2=new THREE.Color('#7da24c'),G3=new THREE.Color('#4a7035'),
    R1=new THREE.Color('#4f4b45'),R2=new THREE.Color('#77706a'),R3=new THREE.Color('#3b3a36'),MO=new THREE.Color('#556b3c'),WET=new THREE.Color('#2a2928');
  for(let k=0;k<N;k++){const x=pos[k*3],y=pos[k*3+1],z=pos[k*3+2],ny=nrm.getY(k),n=cvN(x*0.08,z*0.08,91),n2=cvN(x*0.013,z*0.013,92);
    if(ny>0.82&&y>SEA+6){c.copy(G1).lerp(G2,n2*0.8).lerp(G3,n*0.35);}   // grass
    else{const band=0.5+0.5*Math.sin(y*0.9+n*2.5);c.copy(R1).lerp(R2,band*0.55).lerp(R3,cvN(x*0.03,z*0.03+y*0.05,93)*0.5);
      if(ny>0.45&&y>SEA+4)c.lerp(MO,(ny-0.45)*1.6*(0.5+n*0.5));   // moss on ledges
      if(y<SEA+2.5)c.lerp(WET,0.7);}   // wet rock at the waterline
    col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;}
  lg.setAttribute('color',new THREE.BufferAttribute(col,3));
  const lm=new THREE.Mesh(lg,new THREE.MeshLambertMaterial({vertexColors:true}));lm.name='coastLand';g.add(lm);
  // sea (same grid, flat at sea level, sd = distance to the shore for foam / shallow colour)
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sea,3));sg.setAttribute('sd',new THREE.BufferAttribute(sdA,1));sg.setIndex(idx);
  const U={uT:{value:0},uDeep:{value:new THREE.Color('#174652')},uShal:{value:new THREE.Color('#3a9490')},uSky:{value:new THREE.Color('#c6cdd0')},uFoam:{value:new THREE.Color('#eef2f1')},
    uFogC:{value:new THREE.Color(COAST.fogC)},uFogN:{value:COAST.seaN},uFogF:{value:COAST.seaF},uL:{value:new THREE.Vector3()}};
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
  const so=new THREE.Mesh(sg,sm);so.name='coastSea';so.frustumCulled=false;
  so.onBeforeRender=()=>{U.uT.value=performance.now()/1000;if(scene.fog)U.uFogC.value.copy(scene.fog.color);U.uL.value.copy(LDIR);};
  g.add(so);
  for(const q of g.children){q.castShadow=q.receiveShadow=false;}
  if(window.WD)WD.coast={g,S,H:(x,z)=>coastH(S,x,z,{}),N};
  return g;
}
