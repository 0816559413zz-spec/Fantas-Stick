// =====================================================================
//  FCS room props — look + destruction (user 2026-11-20). Gameplay side: RPK / roomProp in js/02-fcs-rooms.js (BRK groups).
//  All props of all rooms = ONE merged mesh (vertex colours). Per-vertex pd = (BRK index, rnd):
//    rnd 0..1  furniture part: st 3 = gone (shatters into loose debris, no collision)
//    rnd 1.5   pillar core / base / capital: never hidden
//    rnd -1    rubble mound (rail): only shown at st 3
//    pillar blocks (mode 1): hidden when rnd < 0.13 * st  (chips fall off, pillar stays)
//  Stage per prop in a 128x32 DataTexture (r = st, g = mode). Debris = InstancedMesh boxes that fly, land and stay (no collision).
//  Wall hits (event 'rwh', js/02-fcs-rooms.js roomWallEnv): crack / scorch decal on the wall face + fx via assets/fx/bind.json.
// =====================================================================
const FRP={mesh:null,tex:null,map:null,st:null,lights:[],deb:null,dn:0,dl:[],marks:null,mn:0,t:0,cols:{}};
const FRP_PV='attribute vec2 pd;uniform sampler2D uSt;varying float vSt;';
const FRP_PB='vec4 sd=texture2D(uSt,vec2((mod(pd.x,128.)+.5)/128.,(floor(pd.x/128.)+.5)/32.));float stc=floor(sd.r*255.+.5),md=floor(sd.g*255.+.5);vSt=stc;'+
  'bool hide=false;if(pd.y<0.){hide=stc<2.5;vSt=0.;}else if(pd.y>1.2){}else if(md>0.5){hide=pd.y<0.13*stc;}else hide=stc>2.5;'+
  'if(hide)transformed=vec3(0.,-500.,0.);';
function frpMat(){
  const tex=new THREE.DataTexture(new Uint8Array(128*32*4),128,32,THREE.RGBAFormat);tex.needsUpdate=true;
  const inj=sh=>{sh.uniforms.uSt={value:tex};sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+FRP_PV).replace('#include <begin_vertex>','#include <begin_vertex>\n'+FRP_PB);};
  const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.85});
  m.onBeforeCompile=sh=>{inj(sh);sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vSt;')
    .replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=1.-0.13*min(vSt,2.);');};
  m.customProgramCacheKey=()=>'frpProps';
  const d=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});d.onBeforeCompile=inj;d.customProgramCacheKey=()=>'frpPropsD';
  return [m,d,tex];
}
// ---- part builders: local metres, x along the prop, z across, y up. push(geo, colour, rnd)
function frpBuild(q,R){
  const out=[],c=new THREE.Color(),B=(x,y,z,sx,sy,sz,col,rn)=>{const g=new THREE.BoxGeometry(sx,sy,sz);g.translate(x,y,z);out.push([g,col,rn==null?R():rn]);},
    Cy=(x,y,z,r0,r1,h,col,seg,rn,rot)=>{const g=new THREE.CylinderGeometry(r0,r1,h,seg||8);if(rot==='z')g.rotateZ(Math.PI/2);else if(rot==='x')g.rotateX(Math.PI/2);g.translate(x,y,z);out.push([g,col,rn==null?R():rn]);},
    Sp=(x,y,z,sx,sy,sz,col)=>{const g=new THREE.IcosahedronGeometry(0.5,1);g.scale(sx,sy,sz);g.translate(x,y,z);out.push([g,col,R()]);};
  const W='#6b4a2e',WD='#4f3420',WL='#8a6440',IR='#3a3836',GD='#c9a24a',L=(q.L||0)/20;
  const items=(len,y,w)=>{for(let x=-len/2+0.5;x<len/2-0.3;x+=0.75+R()*0.5){const k=R(),z=(R()-0.5)*w;
    if(k<0.35)Cy(x,y+0.02,z,0.2,0.2,0.04,'#d8d2c4',12);else if(k<0.55)Cy(x,y+0.12,z,0.06,0.04,0.24,GD,6);else if(k<0.7)Cy(x,y+0.15,z,0.04,0.04,0.3,'#efe6cf',6);
    else if(k<0.85)B(x,y+0.08,z,0.32,0.16,0.18,'#a8743c');else Sp(x,y+0.1,z,0.35,0.22,0.35,'#7f9a3a');}};
  switch(q.kind){
    case 'table':case 'hightable':{const hi=q.kind==='hightable',y=hi?1.0:0.92;B(0,y,0,L+1.4,0.12,hi?1.9:1.7,W);
      if(hi){B(0,y+0.07,0,L+1.5,0.04,2.0,'#7a1a20');B(0,y-0.3,0.98,L+1.5,0.6,0.03,'#7a1a20');}
      for(const x of [-L/2-0.4,L/2+0.4])for(const z of [-0.6,0.6])B(x,y/2,z,0.16,y,0.16,WD);B(0,0.3,0,L+0.4,0.1,0.12,WD);
      items(L+1.2,y+0.06,1.2);break;}
    case 'bench':B(0,0.45,0,L+1.0,0.08,0.4,WL);for(const x of [-L/2-0.3,L/2+0.3,0])B(x,0.22,0,0.1,0.44,0.34,WD);break;
    case 'chair':B(0,0.48,0,0.5,0.07,0.5,WL);B(-0.22,0.82,0,0.06,0.62,0.5,WL);for(const x of [-0.2,0.2])for(const z of [-0.2,0.2])B(x,0.23,z,0.06,0.46,0.06,WD);break;
    case 'throne':B(0,0.55,0,1.0,0.14,1.0,WD);B(0.02,0.66,0,0.9,0.1,0.9,'#7a1a20');B(-0.45,1.4,0,0.14,1.7,1.0,WD);B(-0.4,1.3,0,0.06,1.2,0.8,'#7a1a20');
      for(const z of [-0.5,0.5])B(0,0.8,z,0.9,0.12,0.12,WD);for(const z of [-0.35,0,0.35])Sp(-0.45,2.35,z,0.18,0.18,0.18,GD);for(const x of [-0.4,0.4])for(const z of [-0.4,0.4])B(x,0.27,z,0.12,0.54,0.12,WD);break;
    case 'crate':B(0,0.55,0,1.1,1.1,1.1,WL);for(const [x,z] of [[-0.53,-0.53],[0.53,-0.53],[-0.53,0.53],[0.53,0.53]])B(x,0.55,z,0.1,1.12,0.1,WD);B(0,1.08,0,1.14,0.08,1.14,WD);B(0,0.03,0,1.14,0.06,1.14,WD);break;
    case 'crate2':B(0,0.55,0,1.1,1.1,1.1,WL);B(0,1.08,0,1.14,0.08,1.14,WD);B(0.05,1.65,0.05,1.0,1.0,1.0,'#7a5634');B(0.05,2.17,0.05,1.04,0.07,1.04,WD);for(const z of [-0.53,0.53])B(0,0.55,z,1.12,0.12,0.04,WD);break;
    case 'barrel':case 'barrels':{const ps=q.kind==='barrels'?[[-0.5,-0.3],[0.5,-0.3],[0,0.5]]:[[0,0]];
      for(const [x,z] of ps){Cy(x,0.62,z,0.42,0.42,1.2,'#7b5332',10);Cy(x,0.62,z,0.48,0.48,0.5,'#86603a',10);for(const y of [0.18,1.06])Cy(x,y,z,0.45,0.45,0.07,IR,10);Cy(x,1.23,z,0.4,0.4,0.03,'#5a3e26',10);}break;}
    case 'keg':Cy(0,0.36,0,0.3,0.3,0.7,'#7b5332',10,null,'z');for(const x of [-0.25,0.25])Cy(x,0.36,0,0.33,0.33,0.06,IR,10,null,'z');B(0,0.04,0,0.6,0.08,0.5,WD);break;
    case 'sack':Sp(0,0.28,0,0.75,0.55,0.6,'#b9a27a');Sp(0.35,0.22,0.3,0.6,0.45,0.5,'#a8916a');Sp(0.1,0.18,0,0.12,0.1,0.12,'#8a7350');break;
    case 'rack':B(0,1.0,0,1.8,0.1,0.2,WD);B(0,0.1,0,1.8,0.12,0.4,WD);for(const x of [-0.85,0.85])B(x,1.0,0,0.1,2.0,0.2,WD);
      for(let i=0;i<5;i++){const x=-0.65+i*0.33;Cy(x,1.1,0.12,0.025,0.025,2.1,WL,5);Sp(x,2.18,0.12,0.08,0.22,0.06,'#c8ccd0');}break;
    case 'armor':B(0,0.05,0,0.6,0.1,0.6,WD);Cy(0,0.6,0,0.04,0.04,1.1,WD,5);B(0,1.4,0,0.55,0.65,0.32,'#8e9298');B(0,1.05,0,0.5,0.25,0.3,'#6e7278');
      Sp(0,1.92,0,0.32,0.36,0.32,'#9aa0a6');B(0,1.92,0.15,0.2,0.05,0.04,'#222');for(const s of [-1,1])Sp(s*0.36,1.65,0,0.2,0.2,0.2,'#8e9298');
      B(0.05,1.3,0.27,0.5,0.7,0.06,'#7a1418');B(0.05,1.3,0.31,0.12,0.12,0.04,GD);break;
    case 'shelf':B(0,1.5,0,2.4,3.0,0.08,WD);for(const x of [-1.18,1.18])B(x,1.5,0.25,0.08,3.0,0.5,WD);for(let i=0;i<5;i++)B(0,0.1+i*0.72,0.25,2.3,0.06,0.5,WL);
      for(let s=0;s<4;s++)for(let x=-1.05;x<1.05;){const w=0.06+R()*0.07;if(R()<0.85)B(x+w/2,0.13+s*0.72+0.2+R()*0.06,0.22,w,0.36+R()*0.16,0.32,['#6e2a1e','#2a4a6e','#3c5a2a','#7a6230','#4a2a5a'][(R()*5)|0]);x+=w+0.01;}break;
    case 'desk':B(0,0.86,0,1.4,0.08,0.75,WL);for(const x of [-0.62,0.62])for(const z of [-0.3,0.3])B(x,0.42,z,0.08,0.84,0.08,WD);
      B(0.2,0.94,0,0.5,0.08,0.36,'#e8dcc0');B(-0.3,0.95,0.1,0.32,0.1,0.24,'#6e2a1e');Cy(-0.5,1.05,-0.2,0.04,0.04,0.25,'#efe6cf',6);break;
    case 'candle':Cy(0,0.05,0,0.3,0.36,0.1,IR,8);Cy(0,1.0,0,0.04,0.05,1.9,IR,6);B(0,1.95,0,0.9,0.05,0.05,IR);for(const x of [-0.45,0,0.45])Cy(x,2.1,0,0.045,0.045,0.24,'#efe6cf',6);break;
    case 'woodpile':for(let i=0;i<9;i++){const r=i<4?0:i<7?1:2,x=(i<4?i:i<7?i-4:i-7)*0.32-0.45+r*0.16;Cy(x,0.15+r*0.27,0,0.13,0.13,1.2,i%2?'#7b5332':'#6a4628',7,null,'x');}break;
    case 'cart':B(0,0.85,0,2.4,0.12,1.3,WL);for(const z of [-0.65,0.65])B(0,1.15,z,2.4,0.5,0.06,WL);B(1.2,1.15,0,0.06,0.5,1.3,WL);
      for(const z of [-0.75,0.75])Cy(-0.2,0.6,z,0.6,0.6,0.1,WD,12,null,'x');for(const z of [-0.4,0.4])B(1.9,0.75,z,1.4,0.08,0.08,WD);
      B(-0.3,1.3,0,1.2,0.4,0.9,'#b9a27a');Sp(0.4,1.3,0,0.6,0.5,0.7,'#a8916a');break;
    case 'rail':{const l=L;B(0,0.12,0,l,0.24,0.42,'#a89a84');B(0,1.04,0,l+0.04,0.14,0.4,'#b4a690');for(let x=-l/2+0.18;x<l/2-0.1;x+=0.36)Cy(x,0.58,0,0.07,0.1,0.72,'#b9ab95',6);
      for(let i=0;i<5;i++){const x=(R()-0.5)*l*0.9;const g=new THREE.DodecahedronGeometry(0.3+R()*0.25,0);g.scale(1.4,0.55,1.1);g.translate(x,0.12,(R()-0.5)*0.4);out.push([g,'#9a8c78',-1]);}
      const g=new THREE.BoxGeometry(l*0.95,0.22,0.7);g.translate(0,0.08,0);out.push([g,'#8f826f',-1]);break;}
    case 'pillar':{const H=21,r=1.3,n=8,ring=1.05;Cy(0,H/2,0,r*0.62,r*0.62,H,'#9d8f7a',8,1.5);
      B(0,0.5,0,r*2.6,1,r*2.6,'#8f8270',1.5);B(0,H-0.6,0,r*2.5,1.2,r*2.5,'#8f8270',1.5);
      for(let k=0;k*ring<H-1.4;k++){const y=1+k*ring+ring/2,off=(k%2)*0.5;
        for(let i=0;i<n;i++){const a=(i+off)/n*Math.PI*2,g=new THREE.BoxGeometry(2*r*Math.tan(Math.PI/n)*0.98,ring*0.96,r*0.42);g.translate(0,0,r*0.79);g.rotateY(-a);g.translate(0,y,0);
          const t=0.88+R()*0.22;c.set('#c2b298').multiplyScalar(t);out.push([g,'#'+c.getHexString(),R()]);}}break;}
  }
  return out;
}
function fcsPropsBuild(){
  FRP.mesh=null;FRP.lights=[];FRP.map=[];FRP.st=new Int8Array(0);FRP.dn=0;FRP.dl=[];FRP.mn=0;
  const geos=[],col=new THREE.Color(),rot=new THREE.Matrix4(),tr=new THREE.Matrix4();let maxB=0;
  for(const r of FCS_ROOMS){const D=r.data,K=r.K;if(!D||!K)continue;
    for(const q of D.props){const R=mulberry(9001+q.b*131+(q.seed|0)),parts=frpBuild(q,R),g0=GY(K.X(q.u),K.Y(q.v))+(q.z0||0);
      rot.makeRotationY(-(q.a||0));tr.makeTranslation(tx(K.X(q.u)),g0,tz(K.Y(q.v)));const M=tr.clone().multiply(rot);
      for(const [g,cs,rn] of parts){const gg=(g.index?g.toNonIndexed():g);gg.applyMatrix4(M);for(const k of Object.keys(gg.attributes))if(k!=='position'&&k!=='normal')gg.deleteAttribute(k);
        const n=gg.attributes.position.count,ca=new Float32Array(n*3),pd=new Float32Array(n*2);col.set(cs);
        for(let i=0;i<n;i++){ca[i*3]=col.r;ca[i*3+1]=col.g;ca[i*3+2]=col.b;pd[i*2]=q.b;pd[i*2+1]=rn;}
        gg.setAttribute('color',new THREE.BufferAttribute(ca,3));gg.setAttribute('pd',new THREE.BufferAttribute(pd,2));geos.push(gg);if(g!==gg)g.dispose();}
      if(q.kind==='candle')for(const x of [-0.45,0,0.45]){const p=new THREE.Vector3(x,2.32,0).applyMatrix4(M);FRP.lights.push([p,q.b]);}
      FRP.map[q.b]={q,K,kind:q.kind,x:K.X(q.u),y:K.Y(q.v),z0:q.z0||0};maxB=Math.max(maxB,q.b);}}
  if(!geos.length)return;
  const geo=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());
  const [m,d,tex]=frpMat(),mesh=new THREE.Mesh(geo,m);mesh.customDepthMaterial=d;mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;addW(mesh);
  FRP.mesh=mesh;FRP.tex=tex;FRP.st=new Int8Array(maxB+1).fill(-1);
  for(const i in FRP.map)if(FRP.map[i].kind==='pillar')tex.image.data[i*4+1]=1;tex.needsUpdate=true;
  // candle flames (hidden when the candelabra breaks)
  const gt=fcsGlowTex();FRP.fl=[];
  for(const [p,b] of FRP.lights){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,color:'#ffb060',blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
    s.position.copy(p);s.scale.set(0.45,0.6,1);s.userData.ph=Math.random()*9;addW(s);FCSC.torch.push(s);FRP.fl.push([s,b]);}
  // debris pool (shared by all rooms): unit boxes, per-instance colour
  const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:0.9}),2400);im.count=0;im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;
  im.setColorAt(0,col.set('#fff'));addW(im);FRP.deb=im;
}
// per frame: BRK stage -> texture; flames
function fcsPropsView(dt){
  if(!FRP.mesh||!FRP.mesh.parent)return;const T=FRP.tex.image.data;let ch=false;
  for(const i in FRP.map){const g=BRK[i];if(!g)continue;const st=g.st|0;if(st===FRP.st[i])continue;
    if(FRP.st[i]>=0&&st>FRP.st[i]&&!FRP.seen?.[i+':'+st])frpDebris(+i,st,null);   // stage reached without an event (snapshot) -> still drop debris
    FRP.st[i]=st;T[i*4]=st;ch=true;}
  if(ch){FRP.tex.needsUpdate=true;gl.shadowMap.needsUpdate=true;for(const [s,b] of FRP.fl)s.visible=FRP.st[b]<3;}
  frpDebrisTick(dt);
}
// brk event (from js/26-fx-events.js): debris for room props
function fcsRoomBrkFx(ev){const P=FRP.map&&FRP.map[ev.i];if(!P)return;(FRP.seen=FRP.seen||{})[ev.i+':'+ev.st]=1;frpDebris(ev.i,ev.st,ev);}
const FRP_DEB={table:[16,'#6b4a2e'],hightable:[18,'#6b4a2e'],bench:[7,'#8a6440'],chair:[6,'#8a6440'],throne:[10,'#4f3420'],crate:[12,'#8a6440'],crate2:[18,'#8a6440'],
  barrel:[11,'#7b5332'],barrels:[22,'#7b5332'],keg:[6,'#7b5332'],sack:[6,'#b9a27a'],rack:[9,'#4f3420'],armor:[9,'#8e9298'],shelf:[20,'#4f3420'],desk:[8,'#8a6440'],
  candle:[5,'#3a3836'],woodpile:[9,'#6a4628'],cart:[16,'#8a6440'],rail:[12,'#b4a690'],pillar:[9,'#c2b298']};
function frpDebris(i,st,ev){
  const P=FRP.map[i];if(!P||!FRP.deb)return;const D=FRP_DEB[P.kind]||[8,'#888'],pil=P.kind==='pillar';if(!pil&&st<3)return;
  const n=pil?D[0]:D[0],R=Math.random,gx=tx(P.x),gz=tz(P.y),g0=GY(P.x,P.y)+P.z0,L=(P.q.L||0)/20,ca=Math.cos(P.q.a||0),sa=Math.sin(P.q.a||0);
  let ox=0,oz=0;if(ev&&ev.ox!=null){ox=P.x-ev.ox;oz=P.y-ev.oy;const l=Math.hypot(ox,oz)||1;ox/=l;oz/=l;}
  const col=new THREE.Color(D[1]),c2=new THREE.Color();
  for(let k=0;k<n;k++){const t=(R()-0.5)*(L+0.8),a=R()*6.283,rr=pil?1.4:0.3*R();
    const p=new THREE.Vector3(gx+ca*t+Math.cos(a)*rr,g0+(pil?1+R()*(st*6):0.3+R()*1.0),gz+sa*t+Math.sin(a)*rr);
    const sp=pil?2.5:4.5,v=new THREE.Vector3(Math.cos(a)*sp*R()+ox*3,2+R()*4,Math.sin(a)*sp*R()+oz*3);
    const s=pil?[0.35+R()*0.5,0.25+R()*0.35,0.3+R()*0.4]:[0.12+R()*0.5,0.05+R()*0.12,0.08+R()*0.2];
    const j=FRP.dn<2400?FRP.dn++:(FRP.dh=((FRP.dh|0)+1)%2400);FRP.deb.count=FRP.dn;
    FRP.deb.setColorAt(j,c2.copy(col).multiplyScalar(0.75+R()*0.4));FRP.deb.instanceColor.needsUpdate=true;
    const o=FRP.dl.find(q=>q.j===j);if(o)FRP.dl.splice(FRP.dl.indexOf(o),1);
    FRP.dl.push({j,p,v,s,r:new THREE.Euler(R()*3,R()*3,R()*3),w:new THREE.Vector3(R()*8-4,R()*8-4,R()*8-4),rest:false});frpSet(FRP.dl[FRP.dl.length-1]);}
}
const _frM=new THREE.Matrix4(),_frQ=new THREE.Quaternion(),_frS=new THREE.Vector3();
function frpSet(d){_frQ.setFromEuler(d.r);FRP.deb.setMatrixAt(d.j,_frM.compose(d.p,_frQ,_frS.set(...d.s)));FRP.deb.instanceMatrix.needsUpdate=true;}
function frpDebrisTick(dt){
  if(!FRP.dl.length)return;dt=Math.min(dt||0.016,0.05);
  for(let i=FRP.dl.length-1;i>=0;i--){const d=FRP.dl[i];if(d.rest){FRP.dl.splice(i,1);continue;}
    d.v.y-=18*dt;d.p.addScaledVector(d.v,dt);d.r.x+=d.w.x*dt;d.r.y+=d.w.y*dt;d.r.z+=d.w.z*dt;
    const sx=d.p.x/S3+MW/2,sy=d.p.z/S3+MH/2,b=GY(sx,sy),z=d.p.y-b,fl=b+groundH(sx,sy,Math.max(0,z))+d.s[1]/2;
    if(d.p.y<=fl&&d.v.y<0){d.p.y=fl;if(Math.abs(d.v.y)<2.2){d.rest=true;d.r.x=Math.round(d.r.x/1.5708)*1.5708+(Math.random()-0.5)*0.2;d.r.z=Math.round(d.r.z/1.5708)*1.5708+(Math.random()-0.5)*0.2;}
      else{d.v.y*=-0.3;d.v.x*=0.55;d.v.z*=0.55;d.w.multiplyScalar(0.5);}}
    frpSet(d);}
}
// ---- wall hit marks (event 'rwh'): decal quads on the wall face, ring buffer, stay for the match
function frpMarkTex(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,4,64,64,60);g.addColorStop(0,'rgba(20,14,10,.9)');g.addColorStop(.45,'rgba(30,22,16,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);
  x.strokeStyle='rgba(12,9,6,.85)';x.lineWidth=2;for(let i=0;i<9;i++){let px=64,py=64,a=i/9*6.283+Math.random()*0.5;x.beginPath();x.moveTo(px,py);for(let k=0;k<5;k++){a+=(Math.random()-0.5)*0.9;px+=Math.cos(a)*(8+Math.random()*7);py+=Math.sin(a)*(8+Math.random()*7);x.lineTo(px,py);}x.stroke();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function fcsWallHit(ev){
  if(!FRP.marks){const m=new THREE.MeshLambertMaterial({map:frpMarkTex(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
    const im=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),m,160);im.count=0;im.frustumCulled=false;im.renderOrder=1;addW(im);FRP.marks=im;}
  const M=FRP.marks,j=FRP.mn%160;FRP.mn++;M.count=Math.min(160,FRP.mn);
  const s=1.2+Math.min(3,(ev.r||40)/30)*(0.7+Math.random()*0.5),q=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.atan2(ev.nx||0,ev.ny||0),Math.random()*6.283,'YXZ'));
  M.setMatrixAt(j,_frM.compose(new THREE.Vector3(tx(ev.x)+(ev.nx||0)*0.03,GY(ev.x,ev.y)+(ev.h||1.5),tz(ev.y)+(ev.ny||0)*0.03),q,_frS.set(s,s,1)));M.instanceMatrix.needsUpdate=true;
  // a few chips fly off the face (same pool as prop debris)
  if(FRP.deb){const R=Math.random,c2=new THREE.Color();for(let k=0;k<5;k++){const j2=FRP.dn<2400?FRP.dn++:(FRP.dh=((FRP.dh|0)+1)%2400);FRP.deb.count=FRP.dn;
    FRP.deb.setColorAt(j2,c2.set('#b4a690').multiplyScalar(0.7+R()*0.4));FRP.deb.instanceColor.needsUpdate=true;
    const d={j:j2,p:new THREE.Vector3(tx(ev.x)+(ev.nx||0)*0.2,GY(ev.x,ev.y)+(ev.h||1.5),tz(ev.y)+(ev.ny||0)*0.2),v:new THREE.Vector3((ev.nx||0)*(2+R()*4)+(R()-0.5)*2,1+R()*3,(ev.ny||0)*(2+R()*4)+(R()-0.5)*2),
      s:[0.1+R()*0.25,0.06+R()*0.12,0.1+R()*0.2],r:new THREE.Euler(R()*3,R()*3,R()*3),w:new THREE.Vector3(R()*8-4,R()*8-4,R()*8-4),rest:false};
    const o=FRP.dl.findIndex(q=>q.j===j2);if(o>=0)FRP.dl.splice(o,1);FRP.dl.push(d);frpSet(d);}}
}
