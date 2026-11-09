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
function natureWhipView(o,swing){   // exact preview whip: natFx().Whip (tools/nature-preview.js SKS.whip)
  let v=o.natureWhipView;
  if(!swing){if(v&&v.idle<25){v.idle++;v.w.upd(o,-1,{t0:0,dir:1});}return;}
  const F=natFx();
  if(!v){const w=F.Whip(NATURE_WHIP.range*S3,true);v=o.natureWhipView={w,vine:w.tube,start:null,sw:null,idle:0};}
  v.idle=0;
  if(v.start!==swing.start){v.start=swing.start;v.sw={t0:0,dir:swing.side,shed:0};}
  const sw=v.sw,q=simOf(o.g.position);F.O.y=GY(q.x,q.y);
  const r=v.w.upd(o,Math.max(.0001,swing.age),sw);
  if(r){
    const burst=[[.42,3],[.49,3],[.56,3]][sw.shed];
    if(burst&&r.st>=burst[0]&&sw.lastTip){
      const fling=r.tip.clone().sub(sw.lastTip).normalize().multiplyScalar(2.4);fling.y+=.75;
      F.leaves(r.tip.clone().lerp(r.pts[F.WHIP_N-3],sw.shed===0?.65:.2),burst[1],1.9,{dir:fling,life:.72,size:1.45});sw.shed++;
    }
    sw.lastTip=r.tip;
  }
}
