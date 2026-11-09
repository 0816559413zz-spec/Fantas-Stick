// Thorn whip. The old offline preview URL still works with other kits.
const NATURE_BA_TEST=new URLSearchParams(location.search).get('natureba')==='1';
const NATURE_WHIP={damage:7,range:280,halfArc:Math.PI/3,cooldown:1,follow:.28,window:.48,impact:.24,duration:.78};
function natureWhipEnabled(id){
  return NATURE_BA_TEST&&NET.isHost&&!NET.online&&G?.mode==='train'&&id===NET.myId;
}
function natureWhipHit(p,swing){
  const hit=[];
  const wasBasic=p.baHit;
  p.baHit=1;
  try{
    for(const target of foesOf(p.team)){
      const dx=target.x-p.x,dy=target.y-p.y,distance=Math.hypot(dx,dy);
      if(distance>NATURE_WHIP.range+1e-7||Math.abs(cH(target)-(p.z+1.1))>2.8)continue;
      if(distance>1e-7&&Math.abs(angDiff(Math.atan2(dy,dx),swing.angle))>NATURE_WHIP.halfArc+1e-7)continue;
      if(natureTrace(p,target,p.z+1.1,cH(target),p.team))continue;
      if(aoeHit(p,target,NATURE_WHIP.damage)){
        hit.push(target);
        emit({k:'efx',z:'nature_whip_hit',x:target.x,y:target.y,h:cH(target)});
      }
    }
  }finally{p.baHit=wasBasic;}
  if(hit.length&&p.pathIdx===NATUREP){
    hit.sort((a,b)=>natureDist(p,a)-natureDist(p,b));
    p.natureFocus=hit[0];
    natureSendSpore(p,hit[0]);
  }
}
function natureWhipBasic(p,inp,canSwing){
  const swing=p.natureWhip;
  const pressed=!!inp.fire&&!p.natureFire;
  p.natureFire=!!inp.fire;
  if(!canSwing){
    if(swing)swing.cancelled=true;
    return;
  }
  const age=swing?G.time-swing.start:Infinity;
  if(swing&&!swing.hit&&!swing.cancelled&&age+1e-8>=NATURE_WHIP.impact){
    swing.hit=true;
    natureWhipHit(p,swing);
  }
  const combo=swing&&!swing.second&&!swing.cancelled&&age<=NATURE_WHIP.window;
  if(combo&&pressed)swing.queued=true;
  const second=combo&&age+1e-8>=NATURE_WHIP.follow&&(inp.fire||swing.queued);
  if(!second&&(!inp.fire||p.cd.basic>1e-8||age+1e-8<NATURE_WHIP.cooldown))return;
  p.natureWhip={start:G.time,side:swing?-swing.side:1,angle:p.ang,hit:false,cancelled:false,second:!!second};
  p.cd.basic=p.cdMax.basic=NATURE_WHIP.cooldown;
}

const NW_RINGS=27,NW_SIDES=7;
const nwPhase=(t,start,end)=>clamp((t-start)/(end-start),0,1);
const nwEase=x=>x*x*(3-2*x);
function nwSwingAngle(t,side){
  const brake=side<0?.31:.29;
  const q=nwPhase(t,.04,brake);
  const sweep=lerp(1.55,-1.30,q*q*q*(q*(q*6-15)+10));
  return side*(sweep+.54*nwEase(nwPhase(t,brake-.02,brake+.24))-.06*Math.sin(Math.PI*nwPhase(t,brake,brake+.10)));
}
function natureWhipPose(o,swing){
  const t=swing.age;
  const weight=nwEase(nwPhase(t,0,.07))*(1-nwEase(nwPhase(t,.52,NATURE_WHIP.duration)));
  const angle=nwSwingAngle(t,swing.side);
  o.armR.rotation.x=lerp(o.armR.rotation.x,-1.25+.25*Math.sin(Math.min(1,t/.46)*Math.PI),weight);
  o.armR.rotation.y=angle*.55*weight;
  o.armR.rotation.z=lerp(o.armR.rotation.z,0,weight);
  o.b.rotation.y=angle*.28*weight;
}
function natureWhipVisualMake(o){
  const geo=new THREE.BufferGeometry();
  const positions=new THREE.BufferAttribute(new Float32Array(NW_RINGS*NW_SIDES*3),3);
  const indices=[];
  for(let i=0;i<NW_RINGS-1;i++)for(let j=0;j<NW_SIDES;j++){
    const a=i*NW_SIDES+j,b=i*NW_SIDES+(j+1)%NW_SIDES;
    indices.push(a,b,a+NW_SIDES,b,b+NW_SIDES,a+NW_SIDES);
  }
  geo.setAttribute('position',positions);geo.setIndex(indices);
  const vine=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({
    color:'#335d20',emissive:'#63a13d',emissiveIntensity:.46,roughness:.87,side:THREE.DoubleSide
  }));
  vine.frustumCulled=false;
  const thorns=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,5),
    new THREE.MeshStandardMaterial({color:'#486227',emissive:'#355221',emissiveIntensity:.3}),NW_RINGS-2);
  thorns.frustumCulled=false;
  vine.add(thorns);o.g.add(vine);
  return {vine,positions,thorns,points:Array.from({length:NW_RINGS},()=>new THREE.Vector3()),
    tangent:new THREE.Vector3(),normal:new THREE.Vector3(),binormal:new THREE.Vector3(),
    spike:new THREE.Object3D(),up:new THREE.Vector3(0,1,0),
    worldA:new THREE.Vector3(),worldB:new THREE.Vector3(),swing:null,trail:null,lastSample:-Infinity};
}
function natureWhipView(o,swing){
  let v=o.natureWhipView;
  if(!swing){
    if(v){v.vine.visible=false;trailStop(v.trail);v.trail=null;}
    return;
  }
  if(!v)v=o.natureWhipView=natureWhipVisualMake(o);
  if(v.swing!==swing.start){
    trailStop(v.trail);v.trail=null;v.swing=swing.start;v.lastSample=-Infinity;v.leafBeat=-1;
  }
  const t=swing.age,s=swing.side,brake=s<0?.31:.29;
  v.vine.visible=t>0;
  if(t<=0)return;
  const grow=(1-(1-nwPhase(t,0,.06))**2)*(.34+.66*nwEase(nwPhase(t,.08,.23)))
    *(1-nwEase(nwPhase(t,.61,NATURE_WHIP.duration)));
  const curl=1-nwEase(nwPhase(t,.06,.29));
  const yaw=Math.PI/2-swing.angle-o.g.rotation.y;
  const {points,positions,tangent,normal,binormal,spike,up,thorns}=v;
  o.tip.getWorldPosition(points[0]);o.g.worldToLocal(points[0]);
  const length=NATURE_WHIP.range*S3*grow/(NW_RINGS-1);
  for(let i=1;i<NW_RINGS;i++){
    const u=i/(NW_RINGS-1),delay=.17*u;
    const bendAge=t-brake-delay+.035;
    const snap=Math.sin(Math.PI*nwPhase(bendAge,0,.17));
    const release=Math.sin(Math.PI*nwPhase(bendAge,.17,.35));
    const bend=(snap*(.18+.58*u)-release*(.12+.26*u))*nwEase(nwPhase(u,0,.24));
    const angle=yaw+nwSwingAngle(Math.max(0,t-delay),s)*1.08+s*(curl*4*u*u-bend);
    const pitch=-.06-.22*u*u+.06*Math.sin(u*9-t*20)*(1-u)
      +curl*.35*Math.sin(u*Math.PI)*Math.sin(u*5.5+t*3)+u*(.21*snap-.14*release);
    const horizontal=Math.cos(pitch)*length;
    const prev=points[i-1];
    points[i].set(prev.x+Math.sin(angle)*horizontal,
      Math.max(.10,prev.y+Math.sin(pitch)*length),prev.z+Math.cos(angle)*horizontal);
  }
  for(let i=0;i<NW_RINGS;i++){
    const p=points[i],u=i/(NW_RINGS-1),radius=(.083*(1-u)+.017)*(.55+.45*grow);
    tangent.subVectors(points[Math.min(i+1,NW_RINGS-1)],points[Math.max(0,i-1)]).normalize();
    normal.crossVectors(up,tangent).normalize();
    binormal.crossVectors(tangent,normal);
    for(let j=0;j<NW_SIDES;j++){
      const angle=j*Math.PI*2/NW_SIDES,a=Math.cos(angle)*radius,b=Math.sin(angle)*radius;
      positions.setXYZ(i*NW_SIDES+j,p.x+a*normal.x+b*binormal.x,p.y+a*normal.y+b*binormal.y,p.z+a*normal.z+b*binormal.z);
    }
    if(i===0||i===NW_RINGS-1)continue;
    const angle=i*2.39996;
    normal.multiplyScalar(Math.cos(angle)).addScaledVector(binormal,Math.sin(angle));
    spike.position.copy(p).addScaledVector(normal,radius*1.35);
    spike.quaternion.setFromUnitVectors(up,normal.addScaledVector(tangent,-.45).normalize());
    spike.scale.setScalar((.10-.05*u)*(.5+.5*grow));
    spike.updateMatrix();thorns.setMatrixAt(i-1,spike.matrix);
  }
  positions.needsUpdate=true;v.vine.geometry.computeVertexNormals();thorns.instanceMatrix.needsUpdate=true;
  if(t>=.15&&t<.43&&t-v.lastSample>=.012){
    if(!v.trail)v.trail=trailNew({col:'#afff72',col2:'#3fb24c',k:.8,life:.17,sweep:true});
    v.lastSample=t;
    o.g.localToWorld(v.worldA.copy(points[NW_RINGS-5]));o.g.localToWorld(v.worldB.copy(points[NW_RINGS-1]));
    const a=v.worldA,b=v.worldB;
    trailPoint(v.trail,a.x,a.y,a.z,b.x,b.y,b.z,.72);
    const beat=Math.floor((t-.15)/.085);
    if(beat<=2&&beat!==v.leafBeat){
      v.leafBeat=beat;
      const x=b.x/S3+MW/2,y=b.z/S3+MH/2;
      burst(x,y,'#bce778',5,62,.35,2.1,{h:b.y-GY(x,y),c2:'#528f3b',g:1.8,sh:4,vr:6});
      if(beat===0)snd('whoosh',{x,y,vol:.43});
    }
  }else if(t>=.43&&v.trail){trailStop(v.trail);v.trail=null;}
}
