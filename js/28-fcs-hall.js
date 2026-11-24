// =====================================================================
//  Indoor light zones (Map Builder 'Indoor Light Zone' → MAPS[id].lz; fcs maps without zones = Great Hall rect)
//  user 2026-11-22: hall like ref 2, then 'let me mark which rooms go dark'
//  1) camera inside the hall rect → cooler/darker ambient + IBL + split-tone grade (set just before the render,
//     put back right after, so BFA / forest blends never see it)
//  2) hall windows: 'lit' boxes (fcsDecoKit V.box → HALL.win) get a plain pale glass pane; glass wall panels
//     (PNL mat 'glass', Map Builder) are used as they are. Only windows the map's sun (LDIR) shines into get
//     light shafts along the real sun direction, with dust and a soft light patch where the beam lands.
//     User 2026-11-22: one plain glass colour (no stained glass), light only from the sun side.
//     Panes = 1 mesh, shafts = 1, floor patches = 1, dust = 1 points.
// =====================================================================
var HALL={win:[],tex:null,rect:[38,35,63,49],   // rect = Great Hall cells (fallback zone on fcs maps)
  BW:3.5,   // BW = max beam width (m): wide windows split into beams
  C:{hemi:new THREE.Color('#97a8cc'),gnd:new THREE.Color('#2e2822'),fog:new THREE.Color('#465161')},sv:null,k:0,tk:0,
  M:{hi:0.12,mi:0.6,ex:0.02,fn:6,ff:150,lo:new THREE.Vector3(0.8,0.92,1.15),hi2:new THREE.Vector3(1.06,1,0.9),con:0.14,vig:0.14,env:0.7}};   // inside: hemi / sun / exposure cut (0-1), fog near/far (m)
function hallWinRec(x,y,z,sx,sy,sz){if(sy>=5&&Math.min(sx,sz)<=0.6)HALL.win.push([x,y,z,sx,sy,sz]);}
// indoor zones (world m): Map Builder 'Indoor Light Zone' objects (MAPS[id].lz, px) • fcs maps without any → the Great Hall cells (HALL.rect)
function hallZones(id){const L=MAPS[id]&&MAPS[id].lz;
  if(L&&L.length)return L.map(q=>({x0:tx(q.x0),x1:tx(q.x1),z0:tz(q.y0),z1:tz(q.y1),top:GY((q.x0+q.x1)/2,(q.y0+q.y1)/2)+q.top,k:clamp(q.k,0,1)}));
  if(!/^fcs/.test(id))return[];const r=HALL.rect,C=FCS_C;return[{x0:tx(r[0]*C),x1:tx((r[2]+1)*C),z0:tz(r[1]*C),z1:tz((r[3]+1)*C),top:22,k:1}];}
// ---- textures: pane = plain pale glass in a pointed arch (stone corners) • patch = soft-edged light
function hallTex(){if(HALL.tex)return HALL.tex;
  const w=128,h=256,cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');
  const arch=m=>{g.beginPath();g.moveTo(m,h-m);g.lineTo(m,92);g.quadraticCurveTo(m+2,34+m,w/2,m);g.quadraticCurveTo(w-m-2,34+m,w-m,92);g.lineTo(w-m,h-m);g.closePath();};
  g.fillStyle='#6e6555';g.fillRect(0,0,w,h);const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#d8ecf4');gr.addColorStop(1,'#a8c8d8');
  arch(7);g.fillStyle=gr;g.fill();g.strokeStyle='#3a332c';g.lineWidth=6;g.stroke();
  const pane=new THREE.CanvasTexture(cv);pane.colorSpace=THREE.SRGBColorSpace;pane.anisotropy=4;pane.userData.keep=true;
  const c2=document.createElement('canvas');c2.width=c2.height=64;const g2=c2.getContext('2d');g2.fillStyle='#000';g2.fillRect(0,0,64,64);g2.filter='blur(5px)';g2.fillStyle='#fff';g2.fillRect(9,9,46,46);
  const flr=new THREE.CanvasTexture(c2);flr.userData.keep=true;
  return HALL.tex={pane,flr};}
// ---- windows in the hall: {c centre, n inward normal, t along (viewer's right), w, h, fy floor, pane}
function hallWindows(Z){const zAt=(x,z)=>Z.find(R=>x>R.x0-2&&x<R.x1+2&&z>R.z0-2&&z<R.z1+2),out=[];let cx=0,cz=0;const inR=(x,z)=>{const R=zAt(x,z);if(R){cx=(R.x0+R.x1)/2;cz=(R.z0+R.z1)/2;}return !!R;};
  for(const [x,y,z,sx,sy,sz] of HALL.win){if(!inR(x,z))continue;const ax=sx<sz,n=ax?[cx>x?1:-1,0,0]:[0,0,cz>z?1:-1],th=ax?sx:sz;
    out.push({c:[x+n[0]*(th/2+0.12),y,z+n[2]*(th/2+0.12)],n,t:[n[2],0,-n[0]],w:ax?sz:sx,h:sy,fy:y-13.5,pane:1});}   // 'lit' windows sit 13.5 m above the floor
  if(typeof PNL!=='undefined')for(const p of PNL){if(p.mat!=='glass'||Math.abs(p.tl||0)>0.05)continue;const x=tx(p.x),z=tz(p.y);if(!inR(x,z))continue;
    let n=[-p.s,0,p.c];if(n[0]*(cx-x)+n[2]*(cz-z)<0)n=n.map(q=>-q);out.push({c:[x,p.zb+p.H/2,z],n,t:[n[2],0,-n[0]],w:p.hl*2*S3,h:p.H,fy:p.zb-((p.d&&p.d.z0)||0),pane:0});}
  return out;}
// ---- build (called once per world build, after the room view / file deco filled HALL.win)
function hallBuild(id){const Z=hallZones(id),list=Z.length?hallWindows(Z):[];HALL.win=[];if(!Z.length)return;
  const T=hallTex(),pp=[],pu=[],sp=[],su=[],sn=[],fp=[],fu=[],dA=[],dD=[],dO=[],dR=[],low=!gq('detail');
  const quad=(P,U,a,b,c,d,ua,ub,uc,ud)=>{P.push(...a,...b,...c,...a,...c,...d);U.push(...ua,...ub,...uc,...ua,...uc,...ud);};
  const v3=(a,b,s)=>[a[0]+b[0]*s,a[1]+b[1]*s,a[2]+b[2]*s],UP=[0,1,0];
  // light travels along -LDIR (the map's sun / moon); keep it at least ~12° downward
  let D=[-LDIR.x,Math.min(-LDIR.y,-0.2),-LDIR.z];{const l=Math.hypot(...D);D=D.map(q=>q/l);}
  let nb=0;
  for(const W of list){const {c,n,t,w,h,fy}=W;
    if(W.pane){const a=v3(v3(c,t,-w/2),UP,-h/2),b=v3(v3(c,t,w/2),UP,-h/2),cc=v3(v3(c,t,w/2),UP,h/2),d=v3(v3(c,t,-w/2),UP,h/2);quad(pp,pu,a,b,cc,d,[0,0],[1,0],[1,1],[0,1]);}
    if(D[0]*n[0]+D[2]*n[2]<0.12)continue;   // sun on the other side: no beam through this window
    const k=Math.max(1,Math.round(w/HALL.BW)),bw=w/k,gap=k>1?bw*0.4:0;
    for(let j=0;j<k;j++){const bc=v3(c,t,-w/2+bw*(j+0.5)),ww=bw-gap,L=(c[1]+h/2-fy)/-D[1]+1;nb++;
      // two crossed sheets: window width swept along D (at mid height) + window height swept along D (at mid width)
      for(const [e,s] of [[t,ww/2],[UP,h/2]]){const N=[D[1]*e[2]-D[2]*e[1],D[2]*e[0]-D[0]*e[2],D[0]*e[1]-D[1]*e[0]],nl=Math.hypot(...N)||1,A1=v3(bc,D,L);
        quad(sp,su,v3(bc,e,-s),v3(bc,e,s),v3(A1,e,s),v3(A1,e,-s),[-1,0],[1,0],[1,1],[-1,1]);for(let q=0;q<6;q++)sn.push(N[0]/nl,N[1]/nl,N[2]/nl,fy);}
      // floor patch = the beam's window rectangle projected along D onto the floor
      const pr=p=>{const q=v3(p,D,(p[1]-fy)/-D[1]);q[1]=fy+0.1;return q;};
      quad(fp,fu,pr(v3(v3(bc,t,-ww/2),UP,-h/2)),pr(v3(v3(bc,t,ww/2),UP,-h/2)),pr(v3(v3(bc,t,ww/2),UP,h/2)),pr(v3(v3(bc,t,-ww/2),UP,h/2)),[0,0],[1,0],[1,1],[0,1]);
      // dust motes inside the beam
      if(!low){const L2=(c[1]-fy)/-D[1];for(let q=0;q<Math.round(10*ww);q++){dA.push(...bc);dD.push(D[0]*L2,D[1]*L2,D[2]*L2);
        const r1=(Math.random()-0.5)*ww*0.9,r2=(Math.random()-0.5)*h*0.9;dO.push(t[0]*r1,r2,t[2]*r1);dR.push(Math.random(),Math.random());}}}
  }
  const geo=(P,U,extra)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));if(extra)for(const k in extra)g.setAttribute(k,extra[k]);g.computeBoundingSphere();return g;};
  const uT={value:0},uI={value:1},sc=new THREE.Color(1,1,1).lerp(moonL.color,0.45),add=[];
  if(pp.length)add.push(new THREE.Mesh(geo(pp,pu),new THREE.MeshBasicMaterial({map:T.pane,color:new THREE.Color(1.35,1.38,1.42),side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4})));
  if(sp.length){
    // shafts: additive sheets, soft sides, fade along the beam / at the floor / edge-on / near the camera  (aN.w = floor y)
    add.push(new THREE.Mesh(geo(sp,su,{aN:new THREE.Float32BufferAttribute(sn,4)}),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
      uniforms:{uT,uI,uC:{value:sc}},
      vertexShader:'attribute vec4 aN;varying vec2 vU;varying vec3 vW,vN;varying float vF;void main(){vU=uv;vN=aN.xyz;vF=aN.w;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
      fragmentShader:'uniform float uT,uI;uniform vec3 uC;varying vec2 vU;varying vec3 vW,vN;varying float vF;void main(){vec3 V=cameraPosition-vW;float dd=length(V);V/=dd;'+
        'float e=1.-vU.x*vU.x;e=e*e*e;float a=e*mix(1.,.5,vU.y)*smoothstep(0.,.08,vU.y)*smoothstep(vF-.1,vF+1.,vW.y);'+
        'a*=smoothstep(.04,.45,abs(dot(normalize(vN),V)))*smoothstep(3.,14.,dd)*(1.-smoothstep(80.,150.,dd));'+
        'a*=.8+.2*sin(vW.x*1.3+vW.y*1.9+uT*.5)*sin(vW.z*1.1-uT*.35);gl_FragColor=vec4(uC*a*.16*uI,1.);}'})));
    add.push(new THREE.Mesh(geo(fp,fu),new THREE.MeshBasicMaterial({map:T.flr,color:sc.clone().multiplyScalar(0.5),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})));}
  for(const m of add){m.frustumCulled=false;m.renderOrder=m.material.transparent?5:0;addW(m);}
  if(dA.length){const g=new THREE.BufferGeometry(),f=(a,n)=>new THREE.Float32BufferAttribute(a,n);g.setAttribute('position',f(dA,3));g.setAttribute('aD',f(dD,3));g.setAttribute('aO',f(dO,3));g.setAttribute('aR',f(dR,2));
    const dust=new THREE.Points(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT,uI,uS:{value:46*gl.getPixelRatio()}},
      vertexShader:'attribute vec3 aD,aO;attribute vec2 aR;uniform float uT,uS;varying float vA;void main(){float s=fract(aR.x+uT*.004*(.5+aR.y));'+
        'vec3 p=position+aO+aD*s+vec3(sin(uT*.3+aR.y*20.)*.25,sin(uT*.23+aR.x*17.)*.2,cos(uT*.27+aR.y*13.)*.25);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;'+
        'gl_PointSize=uS*(.5+aR.y)/-mv.z;vA=(1.-s*.6)*smoothstep(0.,.08,s)*smoothstep(.97,.85,s)*(.55+.45*sin(uT*1.3+aR.x*40.))*smoothstep(1.,4.,-mv.z);}',
      fragmentShader:'uniform float uI;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(1.,.9,.72)*vA*uI*.9*smoothstep(.5,0.,d),1.);}'}));
    dust.frustumCulled=false;dust.renderOrder=6;addW(dust);}
  world.userData.hall={Z,uT,uI,n:list.length,beams:nb};
}
// dimmer/cooler copy of the current Look env (js/74) — level 1..4
function hallEnv(lv){if(typeof LOOK==='undefined'||LOOK.off||!LOOK.cur||!scene.environment)return null;const P=LOOK.P[LOOK.cur],f=lv/4,M=HALL.M,n='_hall'+lv,L=(a,b)=>a+(b-a)*f;
  LOOK.P[n]=Object.assign({},P,{env:P.env*(1-M.env*f),tr:L(P.tr,0.8),tg:L(P.tg,0.9),tb:L(P.tb,1.12)});return lookEnvFor(n).texture;}
// ---- mood: blend by how far the camera is inside the hall rect (3 m soft edge)
function hallPre(dt){const H=world&&world.userData.hall;HALL.sv=null;if(!H||screen!=='game')return;
  H.uT.value=performance.now()/1000;const p=cam.position;let tk=0;
  for(const R of H.Z){const m=Math.min(p.x-R.x0,R.x1-p.x,p.z-R.z0,R.z1-p.z,R.top-p.y);tk=Math.max(tk,clamp((m+1)/4,0,1)*R.k);}   // deepest zone wins
  HALL.tk=tk;HALL.k+=(HALL.tk-HALL.k)*Math.min(1,(dt||0.016)*3);const s=HALL.k*HALL.k*(3-2*HALL.k);if(s<0.003)return;
  const F=scene.fog,C=HALL.C;HALL.sv={hc:hemi.color.clone(),hg:hemi.groundColor.clone(),hi:hemi.intensity,mi:moonL.intensity,ex:gl.toneMappingExposure,fc:F&&F.color.clone(),fn:F&&F.near,ff:F&&F.far,lo:GRADEU.uLo.value.clone(),hi2:GRADEU.uHi.value.clone(),con:GRADEU.uCon.value,vig:GRADEU.uVig.value};
  hemi.color.lerp(C.hemi,s);hemi.groundColor.lerp(C.gnd,s);const M=HALL.M;hemi.intensity*=1-M.hi*s;moonL.intensity*=1-M.mi*s;gl.toneMappingExposure*=1-M.ex*s;
  GRADEU.uLo.value.lerp(M.lo,s);GRADEU.uHi.value.lerp(M.hi2,s);GRADEU.uCon.value*=1+M.con*s;GRADEU.uVig.value+=M.vig*s;   // cool shadows, warm highlights
  const lv=Math.round(s*4),E=lv&&hallEnv(lv);if(E){HALL.sv.env=scene.environment;scene.environment=E;}   // IBL is the main fill light: dimmer + cooler inside (4 steps, no recompile)
  if(F){F.color.lerp(C.fog,s);F.near+=(M.fn-F.near)*s;F.far+=(M.ff-F.far)*s;}}
function hallPost(){const S=HALL.sv;if(!S)return;HALL.sv=null;hemi.color.copy(S.hc);hemi.groundColor.copy(S.hg);hemi.intensity=S.hi;moonL.intensity=S.mi;gl.toneMappingExposure=S.ex;GRADEU.uLo.value.copy(S.lo);GRADEU.uHi.value.copy(S.hi2);GRADEU.uCon.value=S.con;GRADEU.uVig.value=S.vig;if(S.env!==undefined)scene.environment=S.env;
  const F=scene.fog;if(F&&S.fc){F.color.copy(S.fc);F.near=S.fn;F.far=S.ff;}}
