// Lightning bow (replaces Railgun, user 2026-11-10): crystalline lightning bow in the left hand, 1.8 s draw, near-instant arrow.
const SB_FULL=1.8;
let _sbShard=null;
function sbShard(){if(_sbShard)return _sbShard;const s=new THREE.Shape();s.moveTo(0,-.05);s.bezierCurveTo(.22,-.17,.68,-.13,1,.02);s.bezierCurveTo(.74,.08,.34,.13,0,.05);s.closePath();_sbShard=new THREE.ShapeGeometry(s,10);_sbShard.userData.keep=true;return _sbShard;}
function sbMat(c,k,o=1){const m=new THREE.MeshBasicMaterial({color:hdr(c,k),transparent:true,opacity:o,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});return m;}
function sbJag(a,b,n,amp,V3){const P=[],d=b.clone().sub(a);for(let i=0;i<n;i++){const u=i/(n-1),e=Math.sin(Math.PI*u)*amp;P.push(a.clone().addScaledVector(d,u).add(V3((Math.random()-.5)*e,(Math.random()-.5)*e,(Math.random()-.5)*e)));}return P;}
function sbMake(o){
  const F=natFx(),{V3,Tube,ADD}=F,g=new THREE.Group();g.position.set(0,-.62,.02);o.armL.add(g);
  const yel=sbMat('#ffd93a',.82),wht=sbMat('#ffe98a',.92),cy=sbMat('#38dcff',.9),core=sbMat('#fff2a8',1),shards=[];
  for(const s of [-1,1])for(let i=0;i<9;i++){const t=i/8,L=lerp(.42,.95,Math.sin(t*2.6+.2)),b=new THREE.Group(),m=new THREE.Mesh(sbShard(),i%3===1?cy:i%2?yel:wht);m.frustumCulled=false;m.scale.set(1,lerp(1.3,2.3,t),1);b.add(m);b.rotation.y=Math.PI/2;b.position.set(0,.02+.42*t*t,s*(.08+1.02*t));b.rotation.x=s*lerp(1.25,.3,t);b.scale.setScalar(L);g.add(b);shards.push(b);}
  const spine=new THREE.Mesh(new THREE.CylinderGeometry(.018,.03,2.2,6),core);spine.rotation.x=Math.PI/2;spine.frustumCulled=false;g.add(spine);
  const sMat=new THREE.LineBasicMaterial({color:'#fff4b8',transparent:true,opacity:.95}),sGeo=new THREE.BufferGeometry().setFromPoints([V3(0,.44,1.1),V3(0,.44,0),V3(0,.44,-1.1)]),string=new THREE.Line(sGeo,sMat);string.frustumCulled=false;g.add(string);
  const arrow=new THREE.Group();g.add(arrow);const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.018,.03,1.5,6),core);shaft.position.y=-.75;shaft.frustumCulled=false;arrow.add(shaft);
  const head=new THREE.Shape();head.moveTo(0,-.62);head.lineTo(.26,.08);head.lineTo(.07,-.02);head.lineTo(-.07,-.02);head.lineTo(-.26,.08);head.closePath();const hg=new THREE.ShapeGeometry(head),h1=new THREE.Mesh(hg,wht);h1.position.y=-1.5;h1.frustumCulled=false;arrow.add(h1);const h2=h1.clone();h2.rotation.y=Math.PI/2;arrow.add(h2);
  const arcMat=ADD('#ffffff',{vertexColors:true}),arcs=Array.from({length:10},()=>{const m=Tube(10,4,arcMat,g);m.castShadow=false;m.visible=false;return m;});
  return {g,shards,string,sGeo,arrow,arcs,mats:[yel,wht,cy,core],T:0,V3};
}
function stormBowView(o,p,dt,now){
  const M=p.sm,R=M&&(M[3]&16)&&p.al&&!p.dn?M[6]:null;
  if(!R){if(o.sb)o.sb.g.visible=false;return;}
  if(!o.sb)o.sb=sbMake(o);
  const B=o.sb,V3=B.V3;B.g.visible=true;
  const left=Math.max(0,R[1]),max=R[3]||SB_FULL,k=clamp(1-left/max,0,1),full=k>=.999,ap=R[4]||0;
  // arms and body: bow arm out along the aim, right hand pulls the string back
  const yawT=.72,draw=natEase(k);o.b.rotation.y+=yawT;o.b.rotation.x+=-ap*.22;
  o.armL.rotation.set(-1.57-ap*.85,-yawT*.9,.02);o.armR.rotation.set(-1.45-ap*.85+.2*draw,-yawT*.55-.55*draw,lerp(.2,-.55,draw));
  const nock=.44+.95*draw;B.arrow.position.y=nock;B.arrow.scale.setScalar(full?1.28:lerp(.86,1.06,k));
  {const a=B.sGeo.attributes.position;a.setY(1,nock);a.needsUpdate=true;}
  const pulse=full?1+.08*Math.sin(now*.03):.82;for(const m of B.mats)m.opacity=clamp(pulse*.9,.2,1);
  B.T-=dt;if(B.T<=0){B.T=.045;const tot=full?10:Math.round(3+k*3);B.arcs.forEach((a,i)=>{a.visible=i<tot;if(!a.visible)return;let A,E;
      if(i%2===0){const s=i%4?1:-1,t=Math.random();A=V3(0,.05+.42*t*t,s*(.08+1.02*t));E=A.clone().add(V3((Math.random()-.5)*.5,.1+Math.random()*.5,s*(Math.random()*.5)));}
      else{const u=Math.random()*.8;A=V3(0,nock-1.45*u,0);E=V3((Math.random()-.5)*.14,nock-1.45*(u+.2),(Math.random()-.5)*.14);}
      const col=i%3===0?'#fff0a0':'#7df2ff',P=sbJag(A,E,10,.2,V3),c0=new THREE.Color(col);a.set(P,()=>full?.024:.014,(u,c)=>c.copy(c0).multiplyScalar(full?.75:.5));});}
}
function stormBowFx(ev){
  const F=natFx(),{V3,Tube,ADD,sparks,ring,T}=F,o=ev.id!=null?PM3.get(ev.id):null,mine=ev.id===NET.myId,end=natWorld(ev.x2,ev.y2,ev.h2),st=o?o.armL.localToWorld(V3(0,-1.3,0)):natWorld(ev.x,ev.y,ev.h);
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
