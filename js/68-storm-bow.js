// Lightning bow (replaces Railgun, user 2026-11-10): crystalline lightning bow in the left hand, 1.8 s draw, near-instant arrow.
const SB_FULL=1.8;
let _sbShard=null;
function sbShard(){if(_sbShard)return _sbShard;const s=new THREE.Shape();s.moveTo(0,-.05);s.bezierCurveTo(.22,-.17,.68,-.13,1,.02);s.bezierCurveTo(.74,.08,.34,.13,0,.05);s.closePath();_sbShard=new THREE.ShapeGeometry(s,10);_sbShard.userData.keep=true;return _sbShard;}
function sbMat(c,k,o=1){const m=new THREE.MeshBasicMaterial({color:hdr(c,k),transparent:true,opacity:o,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});return m;}
function sbJag(a,b,n,amp,V3){const P=[],d=b.clone().sub(a);for(let i=0;i<n;i++){const u=i/(n-1),e=Math.sin(Math.PI*u)*amp;P.push(a.clone().addScaledVector(d,u).add(V3((Math.random()-.5)*e,(Math.random()-.5)*e,(Math.random()-.5)*e)));}return P;}
function sbMake(o){
  const F=natFx(),{V3,Tube,ADD}=F,g=new THREE.Group();g.position.set(0,-.62,.02);o.armR.add(g);
  const yel=sbMat('#ffd93a',.82),wht=sbMat('#ffe98a',.92),cy=sbMat('#38dcff',.9),core=sbMat('#fff2a8',1),shards=[];
  for(const s of [-1,1])for(let i=0;i<9;i++){const t=i/8,L=lerp(.42,.95,Math.sin(t*2.6+.2)),b=new THREE.Group(),m=new THREE.Mesh(sbShard(),i%3===1?cy:i%2?yel:wht);m.frustumCulled=false;m.scale.set(1,lerp(1.3,2.3,t),1);b.add(m);b.rotation.y=Math.PI/2;b.position.set(0,.02+.42*t*t,s*(.08+1.02*t));b.rotation.x=s*lerp(1.25,.3,t);b.scale.setScalar(L);g.add(b);shards.push(b);}
  const spine=new THREE.Mesh(new THREE.CylinderGeometry(.018,.03,2.2,6),core);spine.rotation.x=Math.PI/2;spine.frustumCulled=false;g.add(spine);
  const sMat=new THREE.LineBasicMaterial({color:'#fff4b8',transparent:true,opacity:.95}),sGeo=new THREE.BufferGeometry().setFromPoints([V3(0,.44,1.1),V3(0,.44,0),V3(0,.44,-1.1)]),string=new THREE.Line(sGeo,sMat);string.frustumCulled=false;g.add(string);
  const arrow=new THREE.Group();g.add(arrow);const arrowMat=sbMat('#b58c3a',.5,.8);const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.018,.03,1.5,6),arrowMat);shaft.position.y=-.75;shaft.frustumCulled=false;arrow.add(shaft);
  const head=new THREE.Shape();head.moveTo(0,-.62);head.lineTo(.26,.08);head.lineTo(.07,-.02);head.lineTo(-.07,-.02);head.lineTo(-.26,.08);head.closePath();const hg=new THREE.ShapeGeometry(head),h1=new THREE.Mesh(hg,arrowMat);h1.position.y=-1.5;h1.frustumCulled=false;arrow.add(h1);const h2=h1.clone();h2.rotation.y=Math.PI/2;arrow.add(h2);
  const arcMat=ADD('#ffffff',{vertexColors:true}),arcs=Array.from({length:10},()=>{const m=Tube(10,4,arcMat,g);m.castShadow=false;m.visible=false;return m;});
  const hide=o.tip.parent.children.filter(c=>c!==o.tip&&c!==g),bodyMat=ADD('#ffffff',{vertexColors:true}),body=Array.from({length:7},()=>{const m=Tube(10,4,bodyMat,o.g);m.castShadow=false;return m;});g.scale.setScalar(.001);
  return {g,shards,string,sGeo,arrow,arrowMat,arcs,body,hide,mats:[yel,wht,cy,core],T:0,V3,age:0};
}
function stormBowView(o,p,dt,now){
  const M=p.sm,R=M&&(M[3]&16)&&p.al&&!p.dn?M[6]:null;
  if(!R){if(o.sb){o.sb.g.visible=false;o.sb.age=0;o.sb.g.scale.setScalar(.001);for(const h of o.sb.hide)h.visible=true;for(const b of o.sb.body)b.visible=false;}return;}
  if(!o.sb)o.sb=sbMake(o);
  const B=o.sb,V3=B.V3;B.g.visible=true;
  const left=Math.max(0,R[1]),max=R[3]||SB_FULL,k=clamp(1-left/max,0,1),full=k>=.999,ap=R[4]||0;
  B.age+=dt;const intro=natEase(natPhase(B.age,0,.42)),armIn=natEase(natPhase(B.age,.36,.62)),yawT=-.72*armIn,draw=natEase(k);for(const h of B.hide)h.visible=intro<.5;for(const b of B.body)b.visible=true;B.g.scale.setScalar(Math.max(.001,natOut(natPhase(B.age,.1,.5))));
  // summon: the wand arm swings out to the side while lightning wraps it into a bow, then comes up to aim; left hand draws the string
  o.b.rotation.y+=yawT;o.b.rotation.x+=-ap*.22*armIn;
  o.armR.rotation.set(lerp(lerp(-.2,-.5,intro),-1.57-ap*.85,armIn),lerp(0,.9*.72,armIn),lerp(lerp(.1,-1.5,intro),-.02,armIn));
  o.armL.rotation.set(lerp(o.armL.rotation.x,-1.45-ap*.85+.2*draw,armIn),lerp(0,.4+.55*draw,armIn),lerp(o.armL.rotation.z,lerp(-.2,.55,draw),armIn));
  const nock=.44+.95*draw;B.arrow.position.y=nock;B.arrow.scale.setScalar(full?1.28:lerp(.86,1.06,k));
  {const a=B.sGeo.attributes.position;a.setY(1,nock);a.needsUpdate=true;}
  const pulse=full?1+.08*Math.sin(now*.03):.82;B.arrowMat.color.set(full?'#fff0a0':'#b58c3a').multiplyScalar(full?1.25:lerp(.35,.7,k));B.arrowMat.opacity=full?1:lerp(.55,.85,k);for(const m of B.mats)m.opacity=clamp(pulse*.9,.2,1);
  B.T-=dt;if(B.T<=0){B.T=.045;const tot=full?10:3;{const cY=new THREE.Color('#ffd23a'),cC=new THREE.Color('#58e4ff');B.body.forEach((a,i)=>{const b=i/7*6.283+now*.004,r=.5+Math.random()*.22,h=.3+Math.random()*1.45,A=V3(Math.cos(b)*r,h,Math.sin(b)*r),E=V3(Math.cos(b+.7)*(r+.1),h+(Math.random()-.5)*.8,Math.sin(b+.7)*(r+.1)),Q=sbJag(A,E,10,.16,V3),col=i%3?cY:cC;a.set(Q,()=>.013,(u,c)=>c.copy(col).multiplyScalar(.75));});}B.arcs.forEach((a,i)=>{a.visible=i<tot;if(!a.visible)return;let A,E;
      if(i%2===0||!full){const s=i%4?1:-1,t=Math.random();A=V3(0,.05+.42*t*t,s*(.08+1.02*t));E=A.clone().add(V3((Math.random()-.5)*.5,.1+Math.random()*.5,s*(Math.random()*.5)));}
      else{const u=Math.random()*.8;A=V3(0,nock-1.45*u,0);E=V3((Math.random()-.5)*.14,nock-1.45*(u+.2),(Math.random()-.5)*.14);}
      const col=i%3===0?'#fff0a0':'#7df2ff',P=sbJag(A,E,10,.2,V3),c0=new THREE.Color(col);a.set(P,()=>full?.024:.014,(u,c)=>c.copy(c0).multiplyScalar(full?.75:.5));});}
}
function stormBowFx(ev){
  const F=natFx(),{V3,Tube,ADD,sparks,ring,T}=F,o=ev.id!=null?PM3.get(ev.id):null,mine=ev.id===NET.myId,end=natWorld(ev.x2,ev.y2,ev.h2),st=o?o.armR.localToWorld(V3(0,-1.3,0)):natWorld(ev.x,ev.y,ev.h);
  if(o)o.sb&&(o.sb.T=0);
  snd('boom',{x:ev.x,y:ev.y,vol:1});snd('zap',{x:ev.x2,y:ev.y2,vol:1});
  if(mine){shake(24);hitStop(.05);}else shake(6);
  const mat=ADD('#ffffff',{vertexColors:true}),core=Tube(24,6,mat),arcs=[Tube(20,4,mat),Tube(20,4,mat),Tube(20,4,mat)],all=[core,...arcs];all.forEach(m=>{m.castShadow=false;});
  const c1=new T.Color('#fff6c0'),c2=new T.Color('#ffd84a'),cy=new T.Color('#7df2ff');sparks(st,18,6,'#fff6c0','#7df2ff',{dir:end.clone().sub(st).normalize().multiplyScalar(6),life:.5,size:1.5});
  const L=.17;F.clip(L,t=>{const f=1-t/L,P=[];for(let i=0;i<24;i++)P.push(st.clone().lerp(end,i/23));core.set(P,u=>(.17*(1-u*.35))*f+.015,(u,c)=>c.copy(c1).lerp(c2,u).multiplyScalar(1.15*f));arcs.forEach((a,j)=>{const Q=sbJag(st,end,20,1.1,V3);a.set(Q,()=>.035*f+.008,(u,c)=>c.copy(j===1?c2:cy).multiplyScalar(1.05*f));});},()=>{all.forEach(m=>F.drop(m));mat.dispose();});
  if(!ev.hit)return;
  impactFrame(.7,ev.x2,ev.y2,ev.h2,.09,ev.id);
  later(.04,()=>{const G2=natFx(),{V3:V,Tube:Tb,ADD:Ad,sparks:sp,T:TH}=G2,top=end.clone().add(V((Math.random()-.5)*3,34,(Math.random()-.5)*3)),m2=Ad('#ffffff',{vertexColors:true}),bolts=[Tb(24,6,m2),Tb(20,4,m2),Tb(20,4,m2)],y1=new TH.Color('#fff4b0'),c3=new TH.Color('#7df2ff'),P0=sbJag(top,end,24,3.2,V);bolts.forEach(b=>b.castShadow=false);G2.O.y=end.y;natShock(end,'#ffe56a',8,.42,.55);natShock(end,'#7df2ff',4,.3,.5);sp(end,34,6.5,'#fff6c0','#7df2ff',{dir:V(0,2.4,0),life:.75,size:1.5});snd('zap',{x:ev.x2,y:ev.y2,vol:1});
    const Ls=.34;G2.clip(Ls,t=>{const f=1-t/Ls;bolts[0].set(P0,u=>.24*f+.02,(u,c)=>c.copy(y1).multiplyScalar(1.1*f));for(let i=1;i<3;i++)bolts[i].set(sbJag(top,end,20,5,V),()=>.05*f+.01,(u,c)=>c.copy(c3).multiplyScalar(f));},()=>{bolts.forEach(b=>G2.drop(b));m2.dispose();});});
}

// Thunder staff (replaces Speed Siphon, user 2026-11-10): lightning extends the wand; basic attack becomes a wide slash wave.
function sbStaffAxis(o){const P=o.tip.parent,v=o.tip.position.clone();if(v.lengthSq()<1e-6)v.set(0,1,0);return {P,dir:v.normalize()};}
function sbStaffMake(o){
  const F=natFx(),{V3,Tube,ADD}=F,{P,dir}=sbStaffAxis(o),g=new THREE.Group();g.position.copy(o.tip.position).multiplyScalar(.62);g.quaternion.setFromUnitVectors(V3(0,1,0),dir);P.add(g);
  {const ws=P.getWorldScale(V3());g.scale.setScalar(1/(ws.x||1));}
  const inner=new THREE.Group();g.add(inner);
  const gold=sbMat('#ffcf3a',.85),pale=sbMat('#ffe998',.95),white=sbMat('#fffbe8',1.05),cyan=sbMat('#46dcff',.9);
  const add=(geo,m,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>{const q=new THREE.Mesh(geo,m);q.position.set(x,y,z);q.rotation.set(rx,ry,rz);q.scale.set(sx,sy,sz);q.frustumCulled=false;inner.add(q);return q;};
  const L=.95,arcMat0=ADD('#ffffff',{vertexColors:true}),bolt=[Tube(16,5,arcMat0,inner),Tube(16,4,arcMat0,inner),Tube(16,4,arcMat0,inner)];bolt.forEach(b=>b.castShadow=false);
  add(new THREE.CylinderGeometry(.03,.05,L,8),gold,0,L/2,0);for(const y of [.24,.56,.82])add(new THREE.TorusGeometry(.058,.014,6,14),pale,0,y,0,Math.PI/2);
  add(new THREE.ConeGeometry(.17,.34,6),pale,0,L+.06,0,Math.PI);   // collar
  for(const s of [-1,1]){add(new THREE.BoxGeometry(.09,.42,.08),pale,s*.2,L+.26,0,0,0,s*-.42);add(new THREE.BoxGeometry(.07,.72,.08),gold,s*.3,L+.82,0,0,0,s*.3);add(new THREE.ConeGeometry(.08,.46,5),pale,s*.17,L+1.3,0,0,0,s*-.46);add(new THREE.BoxGeometry(.05,.34,.05),cyan,s*.42,L+.08,0,0,0,s*-.8);add(new THREE.ConeGeometry(.05,.24,5),gold,s*.45,L+.32,0,0,0,s*-.7);}
  const gem=add(new THREE.OctahedronGeometry(.3,0),white,0,L+.86,0,0,.4,0,.82,2.6,.82);add(new THREE.OctahedronGeometry(.18,0),cyan,0,L+.86,0,0,0,0,.42,3,.42);
  add(new THREE.OctahedronGeometry(.07,0),pale,0,-.0,0,0,0,0,1,1.4,1);
  const arcMat=ADD('#ffffff',{vertexColors:true}),arcs=Array.from({length:7},()=>{const m=Tube(10,4,arcMat,inner);m.castShadow=false;return m;});
  const bodyMat=ADD('#ffffff',{vertexColors:true}),body=Array.from({length:6},()=>{const m=Tube(10,4,bodyMat,o.g);m.castShadow=false;return m;});
  const hide=P.children.filter(c=>c!==g&&c!==o.tip);
  return {g,inner,gem,arcs,bolt,body,hide,mats:[gold,pale,white,cyan],k:0,T:0,L};
}
function stormStaffView(o,p,dt,now){
  const M=p.sm,left=M&&p.al&&!p.dn?(M[8]||0):0;
  if(left>0&&!o.sbS)o.sbS=sbStaffMake(o);
  const S=o.sbS;
  if(S){S.k+=((left>0?1:0)-S.k)*Math.min(1,dt*(left>0?22:13));S.g.visible=S.k>.015;S.inner.scale.set(.66,.66*Math.max(.01,S.k),.66);S.gem.rotation.y=now*.002;for(const h of S.hide)h.visible=S.k<.5;for(const b of S.body)b.visible=left>0;
    if(S.g.visible){S.T-=dt;if(S.T<=0){S.T=.05;const y0=natV(0,0,0),yT=natV(0,S.L,0),cW=new THREE.Color('#fff4b4'),cG=new THREE.Color('#ffc92e'),cC=new THREE.Color('#52e4ff');S.bolt.forEach((b,i)=>{const P=sbJag(y0,yT,16,i?.26:.16,natV);b.set(P,u=>(i?.014:.022)*(1-.45*u),(u,c)=>c.copy(i===1?cC:i?cG:cW).multiplyScalar(i?.7:.85));});if(left>0)S.body.forEach((a,i)=>{const b=i/6*6.283+now*.004,r=.5+Math.random()*.2,h=.35+Math.random()*1.3,A=natV(Math.cos(b)*r,h,Math.sin(b)*r),E=natV(Math.cos(b+.7)*(r+.1),h+(Math.random()-.5)*.7,Math.sin(b+.7)*(r+.1)),P=sbJag(A,E,10,.16,natV),col=i%3?cC:cG;a.set(P,()=>.013,(u,c)=>c.copy(col).multiplyScalar(.8));});S.arcs.forEach((a,i)=>{const t=Math.random()*.9,A=natV((Math.random()-.5)*.05,S.L*t,(Math.random()-.5)*.05),E=A.clone().add(natV((Math.random()-.5)*.34,.15+Math.random()*.32,(Math.random()-.5)*.34)),P=sbJag(A,E,10,.15,natV),col=new THREE.Color(i%3?'#6be8ff':'#fff0a0');a.set(P,()=>.012,(u,c)=>c.copy(col).multiplyScalar(.75*S.k));});}}}
  const W=o.stSw;if(W){W.t+=dt;const T=.62,u=W.t/T;if(u>=1)o.stSw=null;else{const s=W.s,e=natEase,ph=natPhase,coil=e(ph(u,0,.2)),hit=e(ph(u,.2,.42)),fol=e(ph(u,.42,1)),w=e(ph(u,0,.08))*(1-e(ph(u,.72,1)));   // wind up across the body, whip through with the whole torso, settle
    const twist=s*(lerp(lerp(0,1.45,coil),-1.75,hit)*(1-fol*.92)),arm=s*(lerp(lerp(.3,1.6,coil),-1.5,hit)*(1-fol*.8)),R=o.armR.rotation,L=o.armL.rotation;
    o.b.rotation.y+=twist*w;o.b.rotation.z+=s*lerp(lerp(0,-.2,coil),.34,hit)*(1-fol)*w;o.b.rotation.x+=lerp(lerp(0,-.16,coil),.42,hit)*(1-fol)*w;o.b.position.y-=(.1*coil+.22*hit)*(1-fol)*w;
    R.x=lerp(R.x,lerp(lerp(-1.1,-2.15,coil),-1.25,hit),w);R.y=arm*w;R.z=lerp(R.z,lerp(.5,-.55,hit),w);L.x=lerp(L.x,lerp(lerp(.2,-1.15,coil),.85,hit),w);L.y=-arm*.5*w;L.z=lerp(L.z,lerp(.25,-.55,hit),w);o.faW=Math.max(o.faW||0,w*(1-hit*.75));
    o.legs[0].rotation.x+=lerp(lerp(0,.42,coil),-.72,hit)*(1-fol)*w;o.legs[1].rotation.x+=lerp(lerp(0,-.42,coil),.62,hit)*(1-fol)*w;}}
}
function stormStaffCast(ev){const F=natFx(),{V3,Tube,ADD,sparks,T}=F,o=ev.id!=null?PM3.get(ev.id):null,tip=()=>o?o.tip.getWorldPosition(V3()):natWorld(ev.x,ev.y,ev.h),m=ADD('#ffffff',{vertexColors:true}),b=[Tube(24,6,m),Tube(20,4,m),Tube(20,4,m)],y=new T.Color('#fff4b0'),c=new T.Color('#57e6ff'),top=tip().add(V3(F.rnd(-2,2),30,F.rnd(-2,2)));b.forEach(q=>q.castShadow=false);snd('zap',{x:ev.x,y:ev.y,vol:1});if(ev.id===NET.myId)shake(14);
  const base=o?o.g.position.clone():natWorld(ev.x,ev.y,ev.h-1.2);F.O.y=base.y;natShock(base,'#ffe56a',6,.42,.55);natShock(base,'#52e4ff',3.5,.3,.5);sparks(tip(),30,5.5,'#fff3b0','#46dcff',{dir:V3(0,1.2,0),life:.6,size:1.5});sparks(base.clone().add(V3(0,.2,0)),24,4,'#fff3b0','#46dcff',{dir:V3(0,2.4,0),life:.7,size:1.4});
  const L=.3;F.clip(L,t=>{const f=1-t/L,E=tip();b[0].set(sbJag(top,E,24,2.6,V3),()=>.2*f+.02,(u,q)=>q.copy(y).multiplyScalar(1.05*f));for(let i=1;i<3;i++)b[i].set(sbJag(top,E,20,4.2,V3),()=>.05*f+.01,(u,q)=>q.copy(c).multiplyScalar(f));},()=>{b.forEach(q=>F.drop(q));m.dispose();});}
function stormStaffSwing(ev){const o=ev.id!=null?PM3.get(ev.id):null;if(o)o.stSw={t:0,s:ev.n||1};snd('whoosh',{x:ev.x,y:ev.y,vol:.75});snd('zap',{x:ev.x,y:ev.y,vol:.4});if(ev.id===NET.myId)shake(3.5);}
// The wave: one soft crescent like the reference, deep yellow, with a few thin cyan shock lines crawling over it.
let _sbWaveG=null;
function sbWaveGeo(){if(_sbWaveG)return _sbWaveG;const U=48,V=18,R=2.7,D=2.1,p=[],uv=[],ix=[];for(let j=0;j<=V;j++){const v=j/V;for(let i=0;i<=U;i++){const u=i/U*2-1,a=u*.98,r=R-D*v*(1-.4*u*u);p.push(Math.sin(a)*r,.16*Math.sin(u*2.4)*(1-v),Math.cos(a)*r-R);uv.push(u,v);}}for(let j=0;j<V;j++)for(let i=0;i<U;i++){const a=j*(U+1)+i,b=a+U+1;ix.push(a,b,a+1,a+1,b,b+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.userData.keep=true;_sbWaveG=g;return g;}
const SB_WAVE_F=`uniform float t,fade;varying vec2 q;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fb(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+7.;a*=.5;}return s;}
void main(){float u=q.x,v=q.y,end=pow(max(0.,1.-u*u*u*u),1.4);float flow=fb(vec2(u*3.+t*.5,v*5.-t*3.2));float wisp=smoothstep(.5,.72,fb(vec2(u*6.5-t*.7,v*13.-t*4.6)+flow*1.7));float body=pow(max(0.,1.-v),1.3)*smoothstep(.16,.58,flow+(1.-v)*.46);float rim=exp(-v*v*220.)*end;float halo=exp(-v*11.)*end;
vec3 c=mix(vec3(.72,.34,.01),vec3(1.,.72,.05),wisp);c=mix(c,vec3(1.,.93,.42),pow(wisp,3.)*.85);c=mix(c,vec3(.95,.5,.02),clamp(halo*.7,0.,1.));c=mix(c,vec3(1.,.86,.28),clamp(rim,0.,1.));
float a=clamp((body*1.05+wisp*body*.7+halo*.55+rim)*end,0.,1.)*fade;gl_FragColor=vec4(c,a);}`;
function stormWaveMake(o,j){const F=natFx(),{Tube}=F,u={t:{value:Math.random()*40},fade:{value:1}},m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,uniforms:u,vertexShader:'varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:SB_WAVE_F}),w=new THREE.Mesh(sbWaveGeo(),m);w.frustumCulled=false;w.rotation.z=(j.id%2?1:-1)*.24;o.g.add(w);
  const mat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),mk=(n,k)=>{const q=Tube(n,k,mat,w);q.castShadow=false;return q;},lines=Array.from({length:9},()=>mk(11,3)),self=Array.from({length:7},()=>mk(12,4));
  o.swv={w,u,mat,lines,self,age:0,T:0,last:performance.now()};}
function stormWaveTick(o,X,Y,Z){const S=o.swv,now=performance.now(),dt=Math.min(.05,(now-S.last)/1000)||.016,F=natFx(),{V3}=F,R=2.7;S.last=now;S.age+=dt;S.u.t.value+=dt;const L=SIPH.v.range/SIPH.v.spd,f=natEase(natPhase(S.age,0,.05))*(1-natEase(natPhase(S.age,L*.72,L)));S.u.fade.value=f;S.mat.opacity=f;S.w.scale.setScalar(lerp(.6,1,natOut(natPhase(S.age,0,.14))));
  S.T-=dt;if(S.T<=0){S.T=.035;const C=new THREE.Color('#58e4ff'),Y=new THREE.Color('#ffe45a'),W=new THREE.Color('#fff6c0');
    S.u.fade.value=f*(.78+Math.random()*.22);S.w.position.set((Math.random()-.5)*.05,(Math.random()-.5)*.05,0);   // the wave itself flickers with shock
    S.lines.forEach((q,n)=>{const a0=-1.02+Math.random()*1.7,out=n%3===0?-.45-Math.random()*.55:.12+Math.random()*.55,P=[];for(let i=0;i<11;i++){const t=i/10,a=a0+t*(.28+Math.random()*.02)+.0,e=Math.sin(Math.PI*t),r=R+out*e+(n%3?0:-.3),j=e*.22;P.push(V3(Math.sin(a)*r+(Math.random()-.5)*j,(Math.random()-.5)*j*2.2+e*(n%2?.3:-.3),Math.cos(a)*r-R+(Math.random()-.5)*j));}q.set(P,t=>.016*Math.sin(Math.PI*t)+.004,(u,c)=>c.copy(C));});   // cyan arcs crawl around and off the edges
    S.self.forEach((q,n)=>{const a0=-.9+Math.random()*1.5,d0=Math.random()*1.4,P=[];for(let i=0;i<12;i++){const t=i/11,a=a0+t*(.2+Math.random()*.25)*(n%2?1:-1),e=Math.sin(Math.PI*t),r=R-d0-t*.5+(Math.random()-.5)*.1,j=e*.2;P.push(V3(Math.sin(a)*r+(Math.random()-.5)*j,(Math.random()-.5)*j*1.5,Math.cos(a)*r-R+(Math.random()-.5)*j));}const col=n%2?Y:W;q.set(P,t=>.026*Math.sin(Math.PI*t)+.005,(u,c)=>c.copy(col));});   // yellow-white shock running over the wave
    if(Math.random()<.7){const a=(Math.random()*2-1)*.9;const p=F.V3(X,Y,Z).add(o.g.localToWorld(F.V3(Math.sin(a)*R,0,Math.cos(a)*R-R)).sub(o.g.position));F.sparks(p,1,1,Math.random()<.2?'#6fe6ff':'#ffd23a','#c97d10',{life:.5,size:1.15,g:.15});}}}
