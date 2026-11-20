// =====================================================================
//  FCS castle dressing (user 2026-11-20: keep the FCS layout, make it look like a real warm-stone castle + more detail)
//  Visual only — collision stays the Map Editor wall grid (js/02-fcs.js). Called from buildFcs (js/28-fcs-build.js).
//  - fcsCastleMat: world-space ashlar stone (walls = coursed blocks, floors = flagstones), grime at the foot, moss patches
//  - wall cells (type 1): body + cap course + plinth + parapet/merlons + pilasters + arrow slits / lit windows on exposed faces
//  - square towers on wall ends / corners (outline convex corners, clustered), some with tiled roofs + corner turrets
//  - banners (sway) + torches (flicker) on faces • outer curtain wall + keep outside the map edges (silhouette)
// =====================================================================
const FCSC={uT:{value:0},torch:[],mat:{},n:{},pl:2};   // pl = hall chandelier PointLight intensity
function fcsCastleMat(k,col,o={}){
  if(FCSC.mat[k])return FCSC.mat[k];
  const m=new THREE.MeshStandardMaterial({color:col,roughness:o.r||0.93});
  const f=v=>(+v).toFixed(3),ROW=f(o.row||0.55),BLK=f(o.blk||1.15),FR=f(o.fr||1.2),FC=f(o.fc||0.9),MO=f(o.moss==null?0.55:o.moss);
  m.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCW;varying vec3 vCN;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 cw=vec4(transformed,1.);vec3 cn=objectNormal;\n#ifdef USE_INSTANCING\ncw=instanceMatrix*cw;cn=mat3(instanceMatrix)*cn;\n#endif\ncw=modelMatrix*cw;vCW=cw.xyz;vCN=normalize(mat3(modelMatrix)*cn);');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vCW;varying vec3 vCN;'+
      'float caH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}'+
      'float caN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(caH(i),caH(i+vec2(1.,0.)),f.x),mix(caH(i+vec2(0.,1.)),caH(i+vec2(1.,1.)),f.x),f.y);}'+
      'vec3 caAsh(vec2 p,float rh,float bw){float r=floor(p.y/rh);float x=p.x+caH(vec2(r,7.))*bw;float w=bw*(0.75+0.5*caH(vec2(r,3.)));float b=floor(x/w);'+
      'vec2 q=vec2(fract(x/w)*w,fract(p.y/rh)*rh);float e=min(min(q.x,w-q.x),min(q.y,rh-q.y));return vec3(e,caH(vec2(b,r)),caH(vec2(r,b+9.)));}')
      .replace('#include <map_fragment>','#include <map_fragment>\n'+
      'vec3 n=normalize(vCN);vec2 p;float rh='+ROW+',bw='+BLK+';bool top=abs(n.y)>0.6;'+
      'if(top){p=vCW.xz;rh='+FC+';bw='+FR+';}else if(abs(n.x)>abs(n.z))p=vec2(vCW.z,vCW.y);else p=vec2(vCW.x,vCW.y);'+
      'p+=vec2(caN(p*0.8),caN(p*0.8+4.))*0.05;vec3 a=caAsh(p,rh,bw);float nz=caN(vCW.xz*1.3+vCW.y*2.1)*0.6+caN(p*7.)*0.4;'+
      'float st=smoothstep(0.012,0.045+0.03*nz,a.x);vec3 c=diffuseColor.rgb*(0.8+0.32*a.y)*(0.84+0.3*nz);'+
      'c=mix(c,c*vec3(1.1,0.98,0.84),a.z*0.7);c*=1.-0.18*smoothstep(0.55,0.95,caN(p*1.7+3.));c=mix(c*0.45,c,st);'+
      'float yl=vCW.y;float gr=top?1.:1.-0.4*(1.-smoothstep(0.,1.9,yl));'+
      'float mo=smoothstep(0.6,0.82,caN(vCW.xz*0.33+vCW.y*0.45+vec2(n.x,n.z)*3.))*'+MO+'*(top?0.6:(1.-smoothstep(0.3,3.2,yl)));'+
      'c=mix(c,vec3(0.24,0.31,0.15)*(0.8+0.4*nz),mo);c*=gr;diffuseColor.rgb=c;');};
  m.customProgramCacheKey=()=>'fcsCastle'+k;
  return FCSC.mat[k]=m;
}
function fcsBannerTex(){
  const c=document.createElement('canvas');c.width=64;c.height=160;const x=c.getContext('2d');
  x.fillStyle='#7a1418';x.fillRect(0,0,64,160);x.fillStyle='#5a0e12';for(let i=0;i<64;i+=8)x.fillRect(i,0,3,160);
  x.fillStyle='#d9a641';x.fillRect(0,0,64,10);x.fillRect(0,0,5,150);x.fillRect(59,0,5,150);
  x.beginPath();x.moveTo(0,140);x.lineTo(32,160);x.lineTo(64,140);x.lineTo(64,150);x.lineTo(32,170);x.lineTo(0,150);x.fill();
  // emblem: tower + crown dots
  x.fillRect(22,52,20,40);for(const a of [20,30,40])x.fillRect(a,44,6,9);x.fillStyle='#7a1418';x.fillRect(29,74,6,18);
  x.fillStyle='#d9a641';for(const a of [24,32,40])x.fillRect(a,30,4,6);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function fcsGlowTex(){if(FCSC.gt)return FCSC.gt;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,36,0,32,36,30);
  g.addColorStop(0,'rgba(255,240,200,1)');g.addColorStop(.3,'rgba(255,150,50,.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);t.userData.keep=true;return FCSC.gt=t;}
function fcsCastle(){
  const D=FCS_DATA,C=FCS_C,w=D.w,h=D.h,c3=C*S3,WH=FCS_WH[1],R=mulberry(424242);
  const at=(x,y)=>x<0||y<0||x>=w||y>=h?-1:fcsCut(x,y)?0:parseInt(D.W[y*w+x],36)||0,isW=(x,y)=>at(x,y)===1;
  const bwCell=new Set();for(const [t,x,y,ow,oh] of D.objs)if(t==='bw'||t==='gt')for(let j=y;j<y+oh;j++)for(let i=x;i<x+ow;i++)bwCell.add(i+','+j);
  const G={stone:[],dark:[],roof:[],slit:[],lit:[],wood:[],iron:[]},bx=new THREE.BoxGeometry(1,1,1);
  const B=(L,x,y,z,sx,sy,sz)=>{const g=bx.clone();g.scale(sx,sy,sz);g.translate(x,y,z);L.push(g);};
  const GYc=(x,y)=>GY((x+0.5)*C,(y+0.5)*C);
  // ---------- towers: convex outline corners -> owning cells -> clusters -> square bbox (>= 2 cells where the wall allows)
  const cand=new Map();
  for(let y=1;y<h;y++)for(let x=1;x<w;x++){const q=[isW(x-1,y-1),isW(x,y-1),isW(x-1,y),isW(x,y)];if(q.filter(Boolean).length!==1)continue;
    const k=q.indexOf(true),cx=x-1+(k%2),cy=y-1+(k>>1);cand.set(cx+','+cy,[cx,cy]);}
  const left=[...cand.values()],towers=[],cover=new Set();
  while(left.length){const cl=[left.pop()];for(let i=0;i<cl.length;i++)for(let j=left.length-1;j>=0;j--)if(Math.abs(left[j][0]-cl[i][0])<=1&&Math.abs(left[j][1]-cl[i][1])<=1)cl.push(...left.splice(j,1));
    let x0=Math.min(...cl.map(q=>q[0])),x1=Math.max(...cl.map(q=>q[0])),y0=Math.min(...cl.map(q=>q[1])),y1=Math.max(...cl.map(q=>q[1]));
    const colW=(x)=>{for(let y=y0;y<=y1;y++)if(!isW(x,y))return false;return true;},rowW=(y)=>{for(let x=x0;x<=x1;x++)if(!isW(x,y))return false;return true;};
    if(x1===x0){if(colW(x0+1))x1++;else if(colW(x0-1))x0--;}
    if(y1===y0){if(rowW(y0+1))y1++;else if(rowW(y0-1))y0--;}
    if(x1-x0>2||y1-y0>2)continue;
    if(towers.some(t=>x0<=t.x1+1&&x1>=t.x0-1&&y0<=t.y1+1&&y1>=t.y0-1))continue;
    towers.push({x0,x1,y0,y1});for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)cover.add(x+','+y);}
  // ---------- wall bodies (full height, as the collision) + exposed face dressing
  const faces=[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(!isW(x,y))continue;const b=GYc(x,y),X=tx((x+0.5)*C),Z=tz((y+0.5)*C);
    B(G.stone,X,b+WH/2-0.5,Z,c3,WH+1,c3);
    if(cover.has(x+','+y))continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const v=at(x+dx,y+dy);if(v===1)continue;
      faces.push({x,y,dx,dy,b,X:X+dx*c3/2,Z:Z+dy*c3/2,out:v<0,bw:bwCell.has((x+dx)+','+(y+dy))});}}
  for(const f of faces){const {dx,dy,b,X,Z}=f,ax=dy!==0,L=c3,P=(o,a)=>[X+dx*o+(ax?a:0),Z+dy*o+(ax?0:a)],S=(len,dep)=>ax?[len,dep]:[dep,len];
    const box=(Lst,o,a,y,len,hh,dep)=>{const [px,pz]=P(o,a),[sx,sz]=S(len,dep);B(Lst,px,y,pz,sx,hh,sz);};
    box(G.dark,0.1,0,b+WH+0.14,L+0.02,0.3,0.55);                                    // cap course
    box(G.stone,-0.3,0,b+WH+0.5,L,0.45,0.6);                                         // parapet wall
    for(const a of [-1.12,1.12])box(G.stone,-0.3,a,b+WH+1.15,1.2,0.95,0.62);         // merlons
    if(f.out)continue;
    box(G.dark,0.1,0,b+0.3,L+0.02,0.75,0.4);                                         // plinth
    const r=R(),k=(f.x+f.y)%3;
    if(k===0)box(G.stone,0.15,0,b+WH/2-0.1,0.75,WH-0.6,0.36);                       // pilaster
    else if(f.bw)continue;
    else if(r<0.07){box(G.lit,0.03,0,b+3.6,0.75,1.25,0.08);box(G.dark,0.08,0,b+4.3,0.95,0.18,0.14);box(G.dark,0.08,0,b+2.95,0.95,0.14,0.2);}   // lit window
    else if(r<0.55)box(G.slit,0.03,(R()-0.5)*1.4,b+3.4,0.18,1.35,0.06);             // arrow slit
    else if(r<0.62)FCSC.n.banner=(FCSC.n.banner||[]).concat([[X+dx*0.14,Z+dy*0.14,b,dx,dy]]);
    else if(r<0.7)FCSC.n.torch=(FCSC.n.torch||[]).concat([[X+dx*0.1,Z+dy*0.1,b,dx,dy]]);
  }
  // ---------- towers
  for(const t of towers){const x0=tx(t.x0*C)-0.35,x1=tx((t.x1+1)*C)+0.35,z0=tz(t.y0*C)-0.35,z1=tz((t.y1+1)*C)+0.35,cx=(x0+x1)/2,cz=(z0+z1)/2,sx=x1-x0,sz=z1-z0;
    const b=Math.min(GYc(t.x0,t.y0),GYc(t.x1,t.y1)),big=sx>8&&sz>8,TH=big?10.5+R()*1.5:9.2+R()*0.8;
    B(G.stone,cx,b+TH/2-0.5,cz,sx,TH+1,sz);B(G.dark,cx,b+0.45,cz,sx+0.5,0.9,sz+0.5);B(G.dark,cx,b+TH*0.55,cz,sx+0.18,0.22,sz+0.18);
    B(G.dark,cx,b+TH+0.2,cz,sx+0.6,0.4,sz+0.6);                                       // corbel ring
    const top=b+TH+0.4;
    for(const [ex,ez,len,alongX] of [[cx,z0-0.3,sx+0.6,1],[cx,z1+0.3,sx+0.6,1],[x0-0.3,cz,sz+0.6,0],[x1+0.3,cz,sz+0.6,0]]){
      const n=Math.max(2,Math.round(len/1.35));B(G.stone,ex,top+0.25,ez,alongX?len:0.6,0.5,alongX?0.6:len);
      for(let i=0;i<n;i+=2){const a=-len/2+(i+0.5)*len/n;B(G.stone,ex+(alongX?a:0),top+0.95,ez+(alongX?0:a),alongX?len/n:0.6,0.9,alongX?0.6:len/n);}
      for(const hh of [4.2,TH-2.4]){const sl=alongX?[ex,ez+(ez<cz?-0.03:0.03)]:[ex+(ex<cx?-0.03:0.03),ez];B(G.slit,sl[0],b+hh,sl[1],alongX?0.2:0.06,1.3,alongX?0.06:0.2);}}
    if(big||R()<0.35){const rr=Math.hypot(sx,sz)/2*0.82,rh=rr*1.25,g=new THREE.ConeGeometry(rr,rh,4,1,true);g.rotateY(Math.PI/4);g.scale(sx/Math.hypot(sx,sz)*1.414,1,sz/Math.hypot(sx,sz)*1.414);g.translate(cx,top+0.1+rh/2,cz);G.roof.push(g);
      const p=new THREE.CylinderGeometry(0.06,0.06,2.4,5);p.translate(cx,top+rh+1.1,cz);G.wood.push(p);FCSC.n.flag=(FCSC.n.flag||[]).concat([[cx,top+rh+1.6,cz]]);}
    if(big)for(const [qx,qz] of [[x0,z0],[x1,z0],[x0,z1],[x1,z1]]){const g=new THREE.CylinderGeometry(0.85,0.55,2.6,8);g.translate(qx,top+0.6,qz);G.stone.push(g);
      const r2=new THREE.ConeGeometry(1.05,1.8,8);r2.translate(qx,top+2.8,qz);G.roof.push(r2);}}
  // ---------- outer curtain wall + keep outside the map (north / south / east edges, from the castle front x=28 cells)
  {const X0=tx(28*C),X1=tx(w*C),Z0=tz(0),Z1=tz(h*C),OH=12.5,T=5,b=-2;
   const seg=(xa,za,xb,zb)=>{const lx=Math.abs(xb-xa),lz=Math.abs(zb-za),cx=(xa+xb)/2,cz=(za+zb)/2,along=lx>lz,L=Math.max(lx,lz);
     B(G.stone,cx,b+(OH-b)/2,cz,along?L:T,OH-b,along?T:L);B(G.dark,cx,OH+0.15,cz,along?L:T+0.6,0.3,along?T+0.6:L);
     const n=Math.round(L/1.3);for(const s of [-1,1]){const ox=along?0:s*(T/2-0.3),oz=along?s*(T/2-0.3):0;
       for(let i=0;i<n;i+=2){const a=-L/2+(i+0.5)*L/n;B(G.stone,cx+ox+(along?a:0),OH+0.8,cz+oz+(along?0:a),along?L/n:0.6,1.0,along?0.6:L/n);}}};
   seg(X0,Z0-T/2,X1+T,Z0-T/2);seg(X0,Z1+T/2,X1+T,Z1+T/2);seg(X1+T/2,Z0-T,X1+T/2,Z1+T);
   const tw=(x,z,s,hh,roof)=>{B(G.stone,x,b+(hh-b)/2,z,s,hh-b,s);B(G.dark,x,hh+0.2,z,s+0.7,0.4,s+0.7);
     if(roof){const g=new THREE.ConeGeometry(s*0.72,s*1.1,4,1,true);g.rotateY(Math.PI/4);g.translate(x,hh+0.4+s*0.55,z);G.roof.push(g);}
     else for(let i=0;i<4;i++){const a=i*Math.PI/2;for(let j=-1;j<=1;j+=2)B(G.stone,x+Math.cos(a)*s/2+Math.sin(a)*j*s/4,hh+0.9,z+Math.sin(a)*s/2-Math.cos(a)*j*s/4,1.2,1.0,1.2);}};
   for(let x=X0;x<=X1+1;x+=42){tw(x,Z0-T/2,7.5,17,R()<0.5);tw(x,Z1+T/2,7.5,17,R()<0.5);}
   tw(X1+T/2,Z0-T/2,9,19,true);tw(X1+T/2,Z1+T/2,9,19,true);for(let z=Z0+42;z<Z1-10;z+=42)tw(X1+T/2,z,7.5,17,false);
   // keep (behind the east wall)
   const KX=X1+40,KZ=(Z0+Z1)/2,KW=40,KD=48,KH=27;
   B(G.stone,KX,b+(KH-b)/2,KZ,KW,KH-b,KD);B(G.dark,KX,KH+0.25,KZ,KW+1,0.5,KD+1);
   for(const [qx,qz] of [[-1,-1],[1,-1],[-1,1],[1,1]])tw(KX+qx*KW/2,KZ+qz*KD/2,10,34,true);
   const g=new THREE.ConeGeometry(KW*0.62,15,4,1,true);g.rotateY(Math.PI/4);g.scale(1,1,KD/KW);g.translate(KX,KH+0.5+7.5,KZ);G.roof.push(g);
   for(let i=0;i<5;i++)for(let j=0;j<3;j++)B(G.lit,KX-KW/2-0.05,9+j*6,KZ-KD/2+6+i*(KD-12)/4,0.1,2.2,1.1);
   FCSC.n.flag=(FCSC.n.flag||[]).concat([[KX,KH+16,KZ]]);
   const p=new THREE.CylinderGeometry(0.12,0.12,5,5);p.translate(KX,KH+15.4,KZ);G.wood.push(p);}
  // ---------- raised terraces (js/02-fcs.js 'tc'): stone block + cap, stair ramp (stepped), parapet with merlons on the 'par' sides
  for(const q of MAPS.fcs.fcs.props)if(q[0]==='tc'){const [,X0p,Y0p,X1p,Y1p,H,side,a0,a1,Lp,par]=q,x0=tx(X0p),x1=tx(X1p),z0=tz(Y0p),z1=tz(Y1p),cx=(x0+x1)/2,cz=(z0+z1)/2,sx=x1-x0,sz=z1-z0,b=GY((X0p+X1p)/2,(Y0p+Y1p)/2);
    B(G.stone,cx,b+(H-1)/2,cz,sx,H+1,sz);B(G.dark,cx,b+H-0.12,cz,sx+0.3,0.3,sz+0.3);B(G.dark,cx,b+0.35,cz,sx+0.4,0.7,sz+0.4);
    for(const [s0,ex,ez,len,alongX] of [['N',cx,z0+0.3,sx,1],['S',cx,z1-0.3,sx,1],['W',x0+0.3,cz,sz,0],['E',x1-0.3,cz,sz,0]]){if(!par.includes(s0))continue;
      B(G.stone,ex,b+H+0.3,ez,alongX?len:0.6,0.6,alongX?0.6:len);const n=Math.max(2,Math.round(len/1.3));
      for(let i=0;i<n;i+=2){const a=-len/2+(i+0.5)*len/n;B(G.stone,ex+(alongX?a:0),b+H+0.85,ez+(alongX?0:a),alongX?len/n:0.62,0.6,alongX?0.62:len/n);}}
    // stair ramp: steps of 0.35 m
    const L=Lp*S3,A0=(side==='N'||side==='S')?tx(a0):tz(a0),A1=(side==='N'||side==='S')?tx(a1):tz(a1),W=A1-A0,AM=(A0+A1)/2,n=Math.ceil(H/0.35);
    for(let i=0;i<n;i++){const hh=H*(1-i/n),d0=L*i/n,d1=L*(i+1)/n,dm=(d0+d1)/2,dl=d1-d0+0.02;
      const p=side==='S'?[AM,z1+dm,W,dl]:side==='N'?[AM,z0-dm,W,dl]:side==='E'?[x1+dm,AM,dl,W]:[x0-dm,AM,dl,W];
      B(G.stone,p[0],b+(hh-1)/2,p[1],side==='N'||side==='S'?p[2]:p[2],hh+1,side==='N'||side==='S'?p[3]:p[3]);}
    for(const o of [-1,1]){const e=o<0?A0:A1;   // low side walls along the ramp
      for(let i=0;i<n;i++){const hh=H*(1-i/n)+0.5,d=L*(i+0.5)/n,p=side==='S'?[e,z1+d]:side==='N'?[e,z0-d]:side==='E'?[x1+d,e]:[x0-d,e],v=side==='N'||side==='S';
        B(G.dark,p[0]-(v?o*0.2:0),b+(hh-1)/2,p[1]-(v?0:o*0.2),v?0.4:L/n+0.02,hh+1,v?L/n+0.02:0.4);}}
    // torches at the stair foot
    const f=side==='S'?[[A0,z1+L],[A1,z1+L]]:side==='N'?[[A0,z0-L],[A1,z0-L]]:side==='E'?[[x1+L,A0],[x1+L,A1]]:[[x0-L,A0],[x0-L,A1]];
    for(const [px,pz] of f){B(G.dark,px,b+1.1,pz,0.35,2.2,0.35);(FCSC.n.post=FCSC.n.post||[]).push([px,pz,b+2.45]);}}
  // ---------- merge + add
  const mats={stone:fcsCastleMat('s','#c2b298'),dark:fcsCastleMat('d','#8f8270',{row:0.32,blk:0.9,moss:0.3}),
    roof:new THREE.MeshStandardMaterial({color:'#8c4a32',roughness:0.8,flatShading:true,side:THREE.DoubleSide}),
    slit:new THREE.MeshBasicMaterial({color:'#17120e'}),lit:new THREE.MeshStandardMaterial({color:'#2a1a0a',emissive:'#ffb15a',emissiveIntensity:1.6}),
    wood:new THREE.MeshStandardMaterial({color:'#4a3524',roughness:0.9}),iron:new THREE.MeshStandardMaterial({color:'#2b2a2a',roughness:0.6,metalness:0.6})};
  const meshes=[];
  for(const k in G){if(!G[k].length)continue;const geo=mergeGeometries(G[k].map(g=>g.index?g.toNonIndexed():g),false);G[k].forEach(g=>g.dispose());if(!geo)continue;
    const m=new THREE.Mesh(geo,mats[k]);m.castShadow=k!=='slit'&&k!=='lit';m.receiveShadow=true;addW(m);meshes.push(m);}
  bx.dispose();
  // ---------- banners (red = defenders' castle) + torches + flags
  const bt=fcsBannerTex(),bm=new THREE.MeshStandardMaterial({map:bt,side:THREE.DoubleSide,roughness:0.85});
  bm.onBeforeCompile=sh=>{sh.uniforms.uT=FCSC.uT;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;')
    .replace('#include <begin_vertex>','#include <begin_vertex>\nfloat dn=1.-uv.y;transformed.z+=sin(uT*1.6+uv.x*1.5+position.y*0.37)*0.16*dn*dn;');};
  bm.customProgramCacheKey=()=>'fcsBanner';
  const bg=new THREE.PlaneGeometry(1.5,3.8,2,8);bg.translate(0,-1.9,0);
  for(const [x,z,b,dx,dy] of FCSC.n.banner||[]){const m=new THREE.Mesh(bg,bm);m.position.set(x+dx*0.06,b+WH-0.15,z+dy*0.06);m.rotation.y=Math.atan2(dx,dy);m.castShadow=true;addW(m);
    const rod=new THREE.Mesh(sGeo(THREE.CylinderGeometry,0.05,0.05,1.8,5),mats.iron);rod.rotation.z=Math.PI/2;rod.rotation.y=Math.atan2(dx,dy)+Math.PI/2;rod.position.set(x+dx*0.1,b+WH-0.1,z+dy*0.1);addW(rod);}
  const fg=new THREE.PlaneGeometry(2.2,1.3,6,2);fg.translate(1.1,0,0);
  const fm=new THREE.MeshStandardMaterial({color:'#9a1c20',side:THREE.DoubleSide,roughness:0.8});
  fm.onBeforeCompile=sh=>{sh.uniforms.uT=FCSC.uT;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;')
    .replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z+=sin(uT*3.+uv.x*5.)*0.4*uv.x;');};
  fm.customProgramCacheKey=()=>'fcsFlag';
  for(const [x,y,z] of FCSC.n.flag||[]){const m=new THREE.Mesh(fg,fm);m.position.set(x,y,z);m.rotation.y=-0.6;addW(m);}
  const gt=fcsGlowTex();FCSC.torch=[];
  for(const [x,z,b,dx,dy] of FCSC.n.torch||[]){const s=new THREE.Mesh(sGeo(THREE.CylinderGeometry,0.07,0.05,0.6,6),mats.wood);s.position.set(x+dx*0.25,b+2.55,z+dy*0.25);s.rotation.x=dy*0.5;s.rotation.z=-dx*0.5;addW(s);
    const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,color:'#ffb060',blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
    fl.position.set(x+dx*0.42,b+3.0,z+dy*0.42);fl.scale.set(1.3,1.6,1);fl.userData.ph=R()*9;addW(fl);FCSC.torch.push(fl);}
  for(const [x,z,y] of FCSC.n.post||[]){const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,color:'#ffb060',blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
    fl.position.set(x,y,z);fl.scale.set(1.3,1.6,1);fl.userData.ph=R()*9;addW(fl);FCSC.torch.push(fl);}
  FCSC.n={};
  return {towers:towers.length,faces:faces.length,meshes:meshes.length};
}
function fcsCastleTick(){const t=performance.now()/1000;FCSC.uT.value=t;
  for(const f of FCSC.torch){const k=0.85+0.12*Math.sin(t*13+f.userData.ph)+0.08*Math.sin(t*23.7+f.userData.ph*2);f.scale.set(1.25*k,1.6*k,1);}}
// ---------- room pieces: look (js/02-room-*.js view(K,V)) — V = shared builder, merged per material
function fcsRoomsView(){
  const G={},add=(k,g)=>(G[k]=G[k]||[]).push(g),bx=new THREE.BoxGeometry(1,1,1),lights=[],sprites=[],cloths=[];
  const V={
    box:(k,x,y,z,sx,sy,sz)=>{const g=bx.clone();g.scale(sx,sy,sz);g.translate(x,y,z);add(k,g);},
    cyl:(k,x,y,z,rt,rb,h,seg)=>{const g=new THREE.CylinderGeometry(rt,rb,h,seg||8);g.translate(x,y,z);add(k,g);},
    roof:(cx,y,cz,w,d,h)=>{const s=new THREE.Shape();s.moveTo(-d/2-0.6,0);s.lineTo(0,h);s.lineTo(d/2+0.6,0);s.lineTo(d/2+0.6,-0.6);s.lineTo(0,h-0.75);s.lineTo(-d/2-0.6,-0.6);s.lineTo(-d/2-0.6,0);
      const g=new THREE.ExtrudeGeometry(s,{depth:w+1.2,bevelEnabled:false});g.translate(0,0,-(w+1.2)/2);g.rotateY(Math.PI/2);g.translate(cx,y,cz);add('roof',g);
      const gs=new THREE.Shape();gs.moveTo(-d/2,0);gs.lineTo(0,h-0.4);gs.lineTo(d/2,0);gs.lineTo(-d/2,0);   // stone gable ends
      for(const e of [-1,1]){const gg=new THREE.ExtrudeGeometry(gs,{depth:1.2,bevelEnabled:false});gg.translate(0,0,-0.6);gg.rotateY(Math.PI/2);gg.translate(cx+e*(w/2-0.6),y,cz);add('stone',gg);}},
    cone:(k,x,y,z,r,h,seg)=>{const g=new THREE.ConeGeometry(r,h,seg||8);g.translate(x,y,z);add(k,g);},
    light:(x,y,z)=>{sprites.push([x,y,z]);},
    cloth:(x,y,z,w,h,a,col)=>cloths.push([x,y,z,w,h,a,col]),
    shield:(x,y,z,a)=>{const g=new THREE.CylinderGeometry(0.75,0.75,0.12,14);g.rotateX(Math.PI/2);g.rotateY(a);g.translate(x,y,z);add('carpet',g);const b=new THREE.SphereGeometry(0.2,8,6);b.translate(x,y,z);add('iron',b);},
    chandelier:(x,y,z)=>{const r=new THREE.TorusGeometry(2.2,0.12,6,24);r.rotateX(Math.PI/2);r.translate(x,y,z);add('iron',r);
      const ch=new THREE.CylinderGeometry(0.05,0.05,6,4);ch.translate(x,y+3,z);add('iron',ch);
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2;sprites.push([x+Math.cos(a)*2.2,y+0.35,z+Math.sin(a)*2.2,0.8]);}lights.push([x,y-0.5,z]);}
  };
  for(const r of FCS_ROOMS)if(r.view&&r.K)try{r.view(r.K,V);}catch(e){console.error('room view',r.id,e);}
  const mats={stone:fcsCastleMat('s','#c2b298'),dark:fcsCastleMat('d','#8f8270',{row:0.32,blk:0.9,moss:0.3}),
    roof:new THREE.MeshStandardMaterial({color:'#5d6470',roughness:0.75,flatShading:true,side:THREE.DoubleSide}),
    lit:new THREE.MeshStandardMaterial({color:'#2a1a0a',emissive:'#ffc77a',emissiveIntensity:0.55}),
    wood:new THREE.MeshStandardMaterial({color:'#5a3f28',roughness:0.85}),iron:new THREE.MeshStandardMaterial({color:'#2b2a2a',roughness:0.5,metalness:0.7}),
    carpet:new THREE.MeshStandardMaterial({color:'#7a1a20',roughness:1}),slit:new THREE.MeshBasicMaterial({color:'#17120e'})};
  for(const k in G){const geo=mergeGeometries(G[k].map(g=>g.index?g.toNonIndexed():g),false);G[k].forEach(g=>g.dispose());if(!geo)continue;
    const m=new THREE.Mesh(geo,mats[k]||mats.stone);m.castShadow=k!=='lit'&&k!=='carpet';m.receiveShadow=true;addW(m);}
  bx.dispose();
  const gt=fcsGlowTex();
  for(const [x,y,z,s] of sprites){const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,color:'#ffb060',blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
    fl.position.set(x,y,z);fl.scale.set(1.3*(s||1),1.6*(s||1),1);fl.userData.ph=Math.random()*9;addW(fl);FCSC.torch.push(fl);}
  const cm={};for(const [x,y,z,w,h,a,col] of cloths){const m=cm[col]||(cm[col]=new THREE.MeshStandardMaterial({color:col,side:THREE.DoubleSide,roughness:0.9}));
    const g=new THREE.PlaneGeometry(w,h,1,4);g.translate(0,-h/2,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setZ(i,Math.sin(y*1.3)*0.08);}
    const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.rotation.y=a;o.castShadow=true;addW(o);
    const gb=new THREE.Mesh(sGeo(THREE.BoxGeometry,w+0.2,0.12,0.12),new THREE.MeshStandardMaterial({color:'#c9a24a',metalness:0.6,roughness:0.4}));gb.position.set(x,y,z);gb.rotation.y=a;addW(gb);}
  for(const [x,y,z] of lights){const L=new THREE.PointLight('#ffb36a',FCSC.pl,46,1.4);L.position.set(x,y,z);addW(L);}
}
