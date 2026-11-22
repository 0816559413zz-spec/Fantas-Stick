// =====================================================================
//  Great Hall mood (fcs + fcs-file) — user 2026-11-22 "make the hall look like ref 2" (items 1+2)
//  1) camera inside the hall rect → cooler/darker ambient + blue-grey fog + lower exposure (set just before
//     the render, put back right after, so BFA / forest blends never see it)
//  2) stained-glass pointed panes over the hall's 'lit' windows, slanted additive light shafts with dust,
//     coloured light patches on the floor. Windows come from fcsDecoKit V.box('lit',…) (code room view and
//     Map Builder deco) → HALL.win. All shafts = 1 mesh, panes = 1, floor patches = 1, dust = 1 points.
// =====================================================================
var HALL={win:[],tex:null,rect:[38,35,63,49],TH:0.84,   // TH = shaft slope (rad below horizontal)
  C:{hemi:new THREE.Color('#97a8cc'),gnd:new THREE.Color('#2e2822'),fog:new THREE.Color('#465161')},sv:null,k:0,tk:0,
  M:{hi:0.12,mi:0.6,ex:0.02,fn:6,ff:150,lo:new THREE.Vector3(0.8,0.92,1.15),hi2:new THREE.Vector3(1.06,1,0.9),con:0.14,vig:0.14,env:0.7}};   // inside: hemi / sun / exposure cut (0-1), fog near/far (m)
function hallWinRec(x,y,z,sx,sy,sz){if(sy>=5&&Math.min(sx,sz)<=0.6)HALL.win.push([x,y,z,sx,sy,sz]);}
// world-space hall rect (m) from its cells
function hallRect(){const r=HALL.rect,C=FCS_C;return{x0:tx(r[0]*C),x1:tx((r[2]+1)*C),z0:tz(r[1]*C),z1:tz((r[3]+1)*C)};}
// ---- textures: 4 glass designs side by side (pane = opaque with stone corners, floor = blurred glow, black corners)
function hallTex(){if(HALL.tex)return HALL.tex;
  const w=128,h=256,P=[['#1d3c94','#3f7fd0','#a82636','#e3a63a','#efe4c8','#2f8a6a'],['#6e1c2a','#b83440','#2a4ca8','#e6b444','#f2e6c8','#4a8fd0'],
    ['#1f5a3c','#38946a','#2a4ca8','#e0a83a','#eef2d8','#b03a3a'],['#3c2a80','#7050c0','#d2a438','#3478c8','#f2e0cc','#b0304a']];
  const mk=stone=>{const cv=document.createElement('canvas');cv.width=w*4;cv.height=h;const g=cv.getContext('2d');let sd=11;const rn=()=>((sd=(sd*16807)%2147483647)/2147483647);
    const arch=(o,m)=>{g.beginPath();g.moveTo(o+m,h-m);g.lineTo(o+m,92);g.quadraticCurveTo(o+m+2,34+m,o+w/2,m);g.quadraticCurveTo(o+w-m-2,34+m,o+w-m,92);g.lineTo(o+w-m,h-m);g.closePath();};
    const lead=stone?'#120d0a':'#000';g.fillStyle=stone?'#6e6555':'#000';g.fillRect(0,0,w*4,h);
    for(let i=0;i<4;i++){const o=i*w,c=P[i],mx=o+w/2,my=78;g.save();arch(o,7);g.clip();
      // diamond quarries, mostly the main colour with light variation
      const dx=14,dy=18;for(let y=-dy;y<h+dy;y+=dy/2)for(let x=-dx;x<w+dx;x+=dx){const ox=((y/(dy/2))&1)*dx/2,q=rn();
        g.fillStyle=q<0.5?c[0]:q<0.72?c[1]:q<0.82?c[5]:q<0.9?c[3]:q<0.96?c[2]:c[4];g.globalAlpha=0.82+rn()*0.18;
        g.beginPath();g.moveTo(o+x+ox,y-dy/2);g.lineTo(o+x+ox+dx/2,y);g.lineTo(o+x+ox,y+dy/2);g.lineTo(o+x+ox-dx/2,y);g.closePath();g.fill();
        g.globalAlpha=1;g.strokeStyle=lead;g.lineWidth=1.3;g.stroke();}
      // border band of small squares
      g.lineWidth=1.2;for(let y=96;y<h;y+=10)for(const bx of [o+7,o+w-17]){g.fillStyle=((y/10)&1)?c[3]:c[2];g.fillRect(bx,y,10,10);g.strokeRect(bx,y,10,10);}
      // rose medallion
      g.fillStyle=c[3];g.beginPath();g.arc(mx,my,30,0,6.283);g.fill();g.strokeStyle=lead;g.lineWidth=2.5;g.stroke();
      for(let k=0;k<8;k++){const a=k*0.785+0.39;g.fillStyle=k&1?c[2]:c[1];g.beginPath();g.ellipse(mx+Math.cos(a)*17,my+Math.sin(a)*17,10,6,a,0,6.283);g.fill();g.lineWidth=1.5;g.stroke();}
      g.fillStyle=c[4];g.beginPath();g.arc(mx,my,8,0,6.283);g.fill();g.stroke();
      // figure with halo in the lower lancet
      g.fillStyle=c[4];g.beginPath();g.arc(mx,140,11,0,6.283);g.fill();g.stroke();g.fillStyle=c[3];g.beginPath();g.arc(mx,140,6,0,6.283);g.fill();
      g.fillStyle=c[2];g.beginPath();g.moveTo(mx-8,152);g.lineTo(mx+8,152);g.lineTo(mx+15,226);g.lineTo(mx-15,226);g.closePath();g.fill();g.stroke();
      g.fillStyle=c[5];g.beginPath();g.moveTo(mx,156);g.lineTo(mx+5,224);g.lineTo(mx-5,224);g.closePath();g.fill();g.stroke();
      // stone tracery: mullion + transom
      g.strokeStyle=stone?'#2a241e':'#000';g.lineWidth=4;g.beginPath();g.moveTo(mx,112);g.lineTo(mx,128);g.moveTo(o,232);g.lineTo(o+w,232);g.moveTo(o,112);g.lineTo(o+w,112);g.stroke();
      g.restore();g.strokeStyle=stone?'#241e18':'#000';g.lineWidth=6;arch(o,7);g.stroke();}
    return cv;};
  const pane=new THREE.CanvasTexture(mk(true));pane.colorSpace=THREE.SRGBColorSpace;pane.anisotropy=4;pane.userData.keep=true;
  const src=mk(false),c2=document.createElement('canvas');c2.width=src.width;c2.height=src.height;const g2=c2.getContext('2d');g2.filter='blur(6px) brightness(1.7) saturate(1.3)';g2.drawImage(src,0,0);
  const flr=new THREE.CanvasTexture(c2);flr.colorSpace=THREE.SRGBColorSpace;flr.userData.keep=true;
  return HALL.tex={pane,flr};}
// ---- build (called once per world build, after the room view / file deco filled HALL.win)
function hallBuild(){const W=HALL.win;HALL.win=[];const R=hallRect(),cx=(R.x0+R.x1)/2,cz=(R.z0+R.z1)/2;
  const list=W.filter(([x,,z])=>x>R.x0-2&&x<R.x1+2&&z>R.z0-2&&z<R.z1+2);if(!list.length)return;
  const T=hallTex(),pp=[],pu=[],sp=[],su=[],sn=[],fp=[],fu=[],dA=[],dD=[],dO=[],dR=[],low=QUAL.mode==='low';
  const quad=(P,U,a,b,c,d,ua,ub,uc,ud)=>{P.push(...a,...b,...c,...a,...c,...d);U.push(...ua,...ub,...uc,...ua,...uc,...ud);};
  const v3=(a,b,s)=>[a[0]+b[0]*s,a[1]+b[1]*s,a[2]+b[2]*s];
  list.forEach(([x,y,z,sx,sy,sz],i)=>{
    const ax=sx<sz,n=ax?[cx>x?1:-1,0,0]:[0,0,cz>z?1:-1],ww=ax?sz:sx,hh=sy,th=ax?sx:sz;
    const c=[x+n[0]*(th/2+0.12),y,z+n[2]*(th/2+0.12)],v=i%4,u0=v/4,u1=(v+1)/4;
    // pane (u along t, facing n)
    const tt=[n[2],0,-n[0]];   // viewer's right when facing the window from inside
    const a=v3(v3(c,tt,-ww/2),[0,1,0],-hh/2),b=v3(v3(c,tt,ww/2),[0,1,0],-hh/2),cc=v3(v3(c,tt,ww/2),[0,1,0],hh/2),d=v3(v3(c,tt,-ww/2),[0,1,0],hh/2);
    quad(pp,pu,a,b,cc,d,[u0,0],[u1,0],[u1,1],[u0,1]);
    // shaft: from the pane down-inward, slight sideways lean
    const cs=Math.cos(HALL.TH),sn0=Math.sin(HALL.TH);let D=[n[0]*cs+tt[0]*0.3,-sn0,n[2]*cs+tt[2]*0.3];
    const dl=Math.hypot(...D);D=D.map(q=>q/dl);const fy=y-13.5,Lf=(y-fy)/-D[1];   // windows sit 13.5 m above the hall floor
    const b2=[D[1]*tt[2]-D[2]*tt[1],D[2]*tt[0]-D[0]*tt[2],D[0]*tt[1]-D[1]*tt[0]],bl=Math.hypot(...b2),bb=b2.map(q=>q/bl);
    const hb=hh*Math.abs(cs)*0.9;   // window height seen across the beam
    for(let k=0;k<3;k++){const an=k*Math.PI/3,e=[tt[0]*Math.cos(an)*ww/2+bb[0]*Math.sin(an)*hb/2,tt[1]*Math.cos(an)*ww/2+bb[1]*Math.sin(an)*hb/2,tt[2]*Math.cos(an)*ww/2+bb[2]*Math.sin(an)*hb/2];
      const e1=e.map(q=>q*1.35),A0=c,A1=v3(c,D,Lf),N=[D[1]*e[2]-D[2]*e[1],D[2]*e[0]-D[0]*e[2],D[0]*e[1]-D[1]*e[0]],nl=Math.hypot(...N)||1;
      quad(sp,su,v3(A0,e,-1),v3(A0,e,1),v3(A1,e1,1),v3(A1,e1,-1),[-1,0],[1,0],[1,1],[-1,1]);for(let j=0;j<6;j++)sn.push(N[0]/nl,N[1]/nl,N[2]/nl);}
    // floor patch where the beam lands (top of the window lands farther)
    const H=[D[0],0,D[2]],hl=Math.hypot(...H),hd=H.map(q=>q/hl),F=v3(c,D,Lf),fl=hh*cs/sn0,fw=ww*1.3;F[1]=fy+0.1;
    const fa=v3(v3(F,tt,-fw/2),hd,-fl/2),fb=v3(v3(F,tt,fw/2),hd,-fl/2),fc=v3(v3(F,tt,fw/2),hd,fl/2),fd=v3(v3(F,tt,-fw/2),hd,fl/2);
    quad(fp,fu,fa,fb,fc,fd,[u0,0],[u1,0],[u1,1],[u0,1]);
    // dust motes inside the beam
    if(!low)for(let k=0;k<46;k++){const q=Math.random()*6.283,r=Math.sqrt(Math.random())*0.9;dA.push(...c);dD.push(D[0]*Lf,D[1]*Lf,D[2]*Lf);
      dO.push(tt[0]*Math.cos(q)*r*ww/2+bb[0]*Math.sin(q)*r*hb/2,tt[1]*Math.cos(q)*r*ww/2+bb[1]*Math.sin(q)*r*hb/2,tt[2]*Math.cos(q)*r*ww/2+bb[2]*Math.sin(q)*r*hb/2);dR.push(Math.random(),Math.random());}
  });
  const geo=(P,U,extra)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));if(extra)for(const k in extra)g.setAttribute(k,extra[k]);g.computeBoundingSphere();return g;};
  const uT={value:0},uI={value:1};
  // panes: unlit, >1 so bloom picks the bright glass
  const pane=new THREE.Mesh(geo(pp,pu),new THREE.MeshBasicMaterial({map:T.pane,color:new THREE.Color(2.3,2.3,2.4),side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));
  // shafts: additive crossed quads, soft sides, fade along the beam / edge-on / near the camera
  const shaft=new THREE.Mesh(geo(sp,su,{aN:new THREE.Float32BufferAttribute(sn,3)}),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    uniforms:{uT,uI,uC:{value:new THREE.Color('#ffe6bd')}},
    vertexShader:'attribute vec3 aN;varying vec2 vU;varying vec3 vW,vN;void main(){vU=uv;vN=aN;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:'uniform float uT,uI;uniform vec3 uC;varying vec2 vU;varying vec3 vW,vN;void main(){vec3 V=cameraPosition-vW;float dd=length(V);V/=dd;'+
      'float e=1.-vU.x*vU.x;e*=e;float a=e*mix(1.,.45,vU.y)*smoothstep(1.,.86,vU.y)*smoothstep(0.,.05,vU.y);'+
      'a*=smoothstep(.04,.45,abs(dot(normalize(vN),V)))*smoothstep(1.5,7.,dd)*(1.-smoothstep(70.,140.,dd));'+
      'a*=.8+.2*sin(vW.x*1.3+vW.y*1.9+uT*.5)*sin(vW.z*1.1-uT*.35);gl_FragColor=vec4(uC*a*.42*uI,1.);}'}));
  // floor patches: blurred glass colours, additive on the floor
  const flr=new THREE.Mesh(geo(fp,fu),new THREE.MeshBasicMaterial({map:T.flr,color:new THREE.Color(1.6,1.5,1.4),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  for(const m of [pane,shaft,flr]){m.frustumCulled=false;m.renderOrder=m===pane?0:5;addW(m);}
  let dust=null;
  if(dA.length){const g=new THREE.BufferGeometry(),f=(a,n)=>new THREE.Float32BufferAttribute(a,n);g.setAttribute('position',f(dA,3));g.setAttribute('aD',f(dD,3));g.setAttribute('aO',f(dO,3));g.setAttribute('aR',f(dR,2));
    dust=new THREE.Points(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT,uI,uS:{value:46*gl.getPixelRatio()}},
      vertexShader:'attribute vec3 aD,aO;attribute vec2 aR;uniform float uT,uS;varying float vA;void main(){float s=fract(aR.x+uT*.004*(.5+aR.y));'+
        'vec3 p=position+aD*s+aO*(1.+.35*s)+vec3(sin(uT*.3+aR.y*20.)*.25,sin(uT*.23+aR.x*17.)*.2,cos(uT*.27+aR.y*13.)*.25);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;'+
        'gl_PointSize=uS*(.5+aR.y)/-mv.z;vA=(1.-s*.6)*smoothstep(0.,.08,s)*smoothstep(.97,.85,s)*(.55+.45*sin(uT*1.3+aR.x*40.))*smoothstep(1.,4.,-mv.z);}',
      fragmentShader:'uniform float uI;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(1.,.9,.72)*vA*uI*.9*smoothstep(.5,0.,d),1.);}'}));
    dust.frustumCulled=false;dust.renderOrder=6;addW(dust);}
  world.userData.hall={R,uT,uI,n:list.length};
}
// dimmer/cooler copy of the current Look env (js/74) — level 1..4
function hallEnv(lv){if(typeof LOOK==='undefined'||LOOK.off||!LOOK.cur||!scene.environment)return null;const P=LOOK.P[LOOK.cur],f=lv/4,M=HALL.M,n='_hall'+lv,L=(a,b)=>a+(b-a)*f;
  LOOK.P[n]=Object.assign({},P,{env:P.env*(1-M.env*f),tr:L(P.tr,0.8),tg:L(P.tg,0.9),tb:L(P.tb,1.12)});return lookEnvFor(n).texture;}
// ---- mood: blend by how far the camera is inside the hall rect (3 m soft edge)
function hallPre(dt){const H=world&&world.userData.hall;HALL.sv=null;if(!H||screen!=='game')return;
  H.uT.value=performance.now()/1000;const R=H.R,p=cam.position,m=Math.min(p.x-R.x0,R.x1-p.x,p.z-R.z0,R.z1-p.z,22-p.y);
  HALL.tk=clamp((m+1)/4,0,1);HALL.k+=(HALL.tk-HALL.k)*Math.min(1,(dt||0.016)*3);const s=HALL.k*HALL.k*(3-2*HALL.k);if(s<0.003)return;
  const F=scene.fog,C=HALL.C;HALL.sv={hc:hemi.color.clone(),hg:hemi.groundColor.clone(),hi:hemi.intensity,mi:moonL.intensity,ex:gl.toneMappingExposure,fc:F&&F.color.clone(),fn:F&&F.near,ff:F&&F.far,lo:GRADEU.uLo.value.clone(),hi2:GRADEU.uHi.value.clone(),con:GRADEU.uCon.value,vig:GRADEU.uVig.value};
  hemi.color.lerp(C.hemi,s);hemi.groundColor.lerp(C.gnd,s);const M=HALL.M;hemi.intensity*=1-M.hi*s;moonL.intensity*=1-M.mi*s;gl.toneMappingExposure*=1-M.ex*s;
  GRADEU.uLo.value.lerp(M.lo,s);GRADEU.uHi.value.lerp(M.hi2,s);GRADEU.uCon.value*=1+M.con*s;GRADEU.uVig.value+=M.vig*s;   // cool shadows, warm highlights
  const lv=Math.round(s*4),E=lv&&hallEnv(lv);if(E){HALL.sv.env=scene.environment;scene.environment=E;}   // IBL is the main fill light: dimmer + cooler inside (4 steps, no recompile)
  if(F){F.color.lerp(C.fog,s);F.near+=(M.fn-F.near)*s;F.far+=(M.ff-F.far)*s;}}
function hallPost(){const S=HALL.sv;if(!S)return;HALL.sv=null;hemi.color.copy(S.hc);hemi.groundColor.copy(S.hg);hemi.intensity=S.hi;moonL.intensity=S.mi;gl.toneMappingExposure=S.ex;GRADEU.uLo.value.copy(S.lo);GRADEU.uHi.value.copy(S.hi2);GRADEU.uCon.value=S.con;GRADEU.uVig.value=S.vig;if(S.env!==undefined)scene.environment=S.env;
  const F=scene.fog;if(F&&S.fc){F.color.copy(S.fc);F.near=S.fn;F.far=S.ff;}}
