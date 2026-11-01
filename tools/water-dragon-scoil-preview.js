// Studio-only S-coil study, user reference designs/water_ref/dragon_standby_s.png.
await STUDIO.load('water/dragon_hover');STUDIO.pause();STUDIO.at('self');
const F=STUDIO.state.fx;F.dur=16;F.layers=F.layers.filter(l=>l.id==='dragon');
Object.assign(F.layers[0],{shape:'sphere',pos:[0,0,0],life:16,loop:false});
F.layers.push({id:'water_material',t:'mesh',shape:'sphere',mat:'toonwater',att:'feet',pos:[0,-200,0],scale:.001,life:16,fade:0,col:'#8fe5ff',col2:'#238bdd',rim:.6,scroll:2,zw:true});
STUDIO.seek(.3);
const layer=STUDIO.state.I.L.find(s=>s.d.id==='dragon');
STUDIO.state.I.o.aim=false;
const T=WD.THREE,base=new T.Vector3(0,6.5,1.5);
// Read this uncompressed, single-mesh GLB directly. The preview does not need
// the optional network-loaded glTF decoder modules used by the game loader.
const binary=await(await fetch('assets/vfx/water_dragon.glb')).arrayBuffer(),dv=new DataView(binary),jsonLength=dv.getUint32(12,true);
const gltf=JSON.parse(new TextDecoder().decode(new Uint8Array(binary,20,jsonLength))),binStart=20+jsonLength+8;
function attribute(index){
 const a=gltf.accessors[index],v=gltf.bufferViews[a.bufferView],count={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];
 const formats={5126:[4,'getFloat32'],5125:[4,'getUint32'],5123:[2,'getUint16'],5121:[1,'getUint8']},[bytes,method]=formats[a.componentType];
 const offset=binStart+(v.byteOffset||0)+(a.byteOffset||0),stride=v.byteStride||bytes*count,data=[];
 for(let i=0;i<a.count;i++)for(let k=0;k<count;k++)data.push(dv[method](offset+i*stride+k*bytes,true));return{data,count};
}
const prim=gltf.meshes[0].primitives[0],rawGeo=new T.BufferGeometry();
for(const [semantic,name] of [['POSITION','position'],['NORMAL','normal'],['TEXCOORD_0','uv']]){const a=attribute(prim.attributes[semantic]);rawGeo.setAttribute(name,new T.Float32BufferAttribute(a.data,a.count));}
if(prim.indices!==undefined)rawGeo.setIndex(attribute(prim.indices).data);
const sourceMesh=new T.Mesh(rawGeo);
const oldForward=new T.Vector3(0,-.4,1).normalize(),oldRight=new T.Vector3(1,0,0),oldUp=new T.Vector3().crossVectors(oldForward,oldRight).normalize();
layer.inner.updateMatrixWorld(true);
const headP=[],headN=[],headUV=[];let skin;
// Keep the sculpted face, jaw, mane and horns rigid together. Body is rebuilt as a
// continuous tube so the neck never jumps between nearest points on the old S pose.
sourceMesh.traverse(m=>{
 if(!m.isMesh)return;skin=skin||layer.mats[0];
 const g=m.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,idx=g.index;
 const local=new T.Matrix4();
 const normal=new T.Matrix3().getNormalMatrix(local);
 for(let j=0;j<(idx?idx.count:p.count);j+=3){
  const ids=[0,1,2].map(k=>idx?idx.getX(j+k):j+k);
  if(!ids.every(k=>Math.abs(uv.getY(k)-.14)<.002))continue;
  const verts=ids.map(k=>new T.Vector3().fromBufferAttribute(p,k).applyMatrix4(local));
  const center=verts.reduce((a,b)=>a.add(b),new T.Vector3()).multiplyScalar(1/3);
  if(center.y<4.7||center.z< -1.65)continue;
  ids.forEach((k,i)=>{
   const v=verts[i].sub(base),nn=new T.Vector3().fromBufferAttribute(n,k).applyNormalMatrix(normal);
   headP.push(v.dot(oldRight),v.dot(oldUp),v.dot(oldForward));
   headN.push(nn.dot(oldRight),nn.dot(oldUp),nn.dot(oldForward));headUV.push(uv.getX(k),uv.getY(k));
  });
 }
});
if(headP.length<300)throw new Error('Dragon head extraction failed');
skin=skin.clone();skin.uniforms.uGroundY={value:WD.PM3.get('me').g.position.y+.025};
skin.vertexShader=skin.vertexShader.replace('void main(){','varying float vFlightY; void main(){vFlightY=(modelMatrix*vec4(position,1.0)).y;');
skin.fragmentShader=skin.fragmentShader.replace('void main(){','varying float vFlightY; uniform float uGroundY; void main(){if(vFlightY<uGroundY)discard;');
skin.uniforms.uFoamTime={value:0};skin.uniforms.uFoamStrength={value:1};
skin.fragmentShader='uniform float uFoamTime;uniform float uFoamStrength;\n'+skin.fragmentShader;
skin.fragmentShader=skin.fragmentShader.replace('gl_FragColor=vec4(c*a',
 'float foamPhase=fract(vUv.y*5.7+uFoamTime*1.7+.20*sin(vUv.x*18.84956+vUv.y*11.)+.11*sin(vUv.x*43.9823-vUv.y*19.));'+
 'float foamNoise=texture2D(uNz,vec2(vUv.x*4.,vUv.y*15.-uFoamTime*.6)).r;'+
 'float foamBand=(1.-smoothstep(.045,.105,abs(foamPhase-.5)))*smoothstep(.2,.57,foamNoise)*uFoamStrength;'+
 'c=mix(c,vec3(.95,1.,1.),foamBand*.96);gl_FragColor=vec4(c*a');
skin.needsUpdate=true;
const faceSkin=skin.clone();faceSkin.uniforms.uFoamStrength.value=.18;
const headGeo=new T.BufferGeometry();headGeo.setAttribute('position',new T.Float32BufferAttribute(headP,3));headGeo.setAttribute('normal',new T.Float32BufferAttribute(headN,3));headGeo.setAttribute('uv',new T.Float32BufferAttribute(headUV,2));
const group=new T.Group();layer.obj.add(group);layer.inner.visible=false;
const head=new T.Mesh(headGeo,faceSkin);head.renderOrder=3;group.add(head);
const rings=300,sides=28,bodyGeo=new T.BufferGeometry(),bodyP=new Float32Array((rings+1)*(sides+1)*3),bodyUV=[],indices=[];
for(let i=0;i<=rings;i++)for(let j=0;j<=sides;j++){
 bodyUV.push(j/sides,1-.86*i/rings);
 if(i<rings&&j<sides){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,a+1,b+1,b);}
}
bodyGeo.setAttribute('position',new T.BufferAttribute(bodyP,3));bodyGeo.setAttribute('uv',new T.Float32BufferAttribute(bodyUV,2));bodyGeo.setIndex(indices);
const body=new T.Mesh(bodyGeo,skin);body.renderOrder=3;body.frustumCulled=false;group.add(body);
const finGeo=new T.ConeGeometry(.105,.55,8),fins=Array.from({length:20},()=>{const m=new T.Mesh(finGeo,faceSkin);m.renderOrder=3;group.add(m);return m;});
const eyes=[-1,1].map(sign=>{const m=new T.Mesh(new T.SphereGeometry(.075,10,8),new T.MeshBasicMaterial({color:'#ff4242'}));
 const p=new T.Vector3(sign*.528,.092,.429);m.position.set(p.dot(oldRight),p.dot(oldUp),p.dot(oldForward));head.add(m);return m;});
const bodyLength=32,intro=3.1,coilTime=4.45;
const standbyCP=[[-3,1.8,-2.5],[-5.5,1.4,-2.8],[-6.6,2.5,-3],[-5.7,3.8,-2.5],[-3,4.3,-1.7],[-1.2,5.7,-1.2],[-2.2,6.8,-1.4],[-4.6,6.7,-2.3],[-6.7,7,-3],[-7.2,8.7,-3],[-5.7,10.1,-2],[-3.6,10,-1.1],[-2.1,9.4,-.3],[-1.8,8.2,1.4]].map(p=>new T.Vector3(...p));
let standby=new T.CatmullRomCurve3(standbyCP,false,'centripetal');standby.arcLengthDivisions=2400;standby.updateArcLengths();
const standbyHead=standbyCP.at(-1).clone(),poseScale=bodyLength/standby.getLength();
standby=new T.CatmullRomCurve3(standbyCP.map(p=>p.clone().sub(standbyHead).multiplyScalar(poseScale).add(standbyHead)),false,'centripetal');standby.arcLengthDivisions=2400;standby.updateArcLengths();
// Faster travel comes from a longer spiral, not from shortening the shot.
// Quarter-turn Hermite cubics share both position and tangent at every join.
const flight=new T.CurvePath(),arrivalDirection=standby.getTangentAt(1).normalize();
const quarters=7,step=-Math.PI/2,dr=(5.3-3.8)/quarters,dy=12/quarters;
function spiralKnot(i){const a=Math.PI+step*i,r=3.8+dr*i;return{p:new T.Vector3(Math.cos(a)*r,1.2+dy*i,.1+Math.sin(a)*r),d:new T.Vector3(dr*Math.cos(a)-r*Math.sin(a)*step,dy,dr*Math.sin(a)+r*Math.cos(a)*step)};}
const first=spiralKnot(0),entry=new T.Vector3(-3.8,-2,.1);
flight.add(new T.LineCurve3(new T.Vector3(-3.8,-42,.1),entry));
flight.add(new T.CubicBezierCurve3(entry,entry.clone().add(new T.Vector3(0,1.4,0)),first.p.clone().addScaledVector(first.d,-1/3),first.p));
for(let i=0;i<quarters;i++){const a=spiralKnot(i),b=spiralKnot(i+1);flight.add(new T.CubicBezierCurve3(a.p,a.p.clone().addScaledVector(a.d,1/3),b.p.clone().addScaledVector(b.d,-1/3),b.p));}
const crest=spiralKnot(quarters);
flight.add(new T.CubicBezierCurve3(crest.p,crest.p.clone().addScaledVector(crest.d,1/3),standbyHead.clone().addScaledVector(arrivalDirection,-3.4),standbyHead.clone()));
flight.arcLengthDivisions=3200;flight.updateArcLengths();const totalLength=flight.getLength();
const up=new T.Vector3(0,1,0),zAxis=new T.Vector3(0,0,1),yAxis=new T.Vector3(0,1,0);
function smooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
let startAt=0,startD=Infinity;const startPoint=new T.Vector3(-3.8,-3.5,.1);
for(let i=0;i<=2400;i++){const d=flight.getPointAt(i/2400).distanceToSquared(startPoint);if(d<startD){startAt=i/2400;startD=d;}}
function progress(t){const travel=Math.max(0,t-.35),fast=2,slow=.75,area=fast+slow*.5;if(travel<=fast)return travel/area;const q=Math.min(1,(travel-fast)/slow);return(fast+slow*(q-2.5*q**4+3*q**5-q**6))/area;}
let lastTime=-1,lastHeadT=null,headRight=null,maxBend=0,bodyState=null,filteredAdvance=null,previousHeadQ=null,maxArrivalHeadStep=0;
function shape(t){
 const dt=lastTime<0||t<lastTime?1/30:Math.max(0,t-lastTime);
 const advance=startAt+(1-startAt)*progress(t),wait=Math.max(0,t-intro),ds=bodyLength/rings;
 const centers=new Array(rings+1),tangents=new Array(rings+1),rights=new Array(rings+1),ups=new Array(rings+1);
 // Filter one path parameter, not position and heading independently.
 // This keeps the face tangent to its own motion even while braking.
 if(filteredAdvance===null||t<lastTime)filteredAdvance=advance;
 else filteredAdvance+=(advance-filteredAdvance)*(1-Math.exp(-dt*18));
 const rawT=flight.getTangentAt(filteredAdvance).normalize(),rawP=flight.getPointAt(filteredAdvance);
 if(wait>0){rawP.x+=.16*Math.sin(wait*2)*smooth(wait/.45);rawP.y+=.13*Math.sin(wait*2.6)*smooth(wait/.45);}
 const headT=rawT.clone();centers[rings]=rawP.clone();
 tangents[rings]=headT.clone();let previous=headT.clone();
 // Blend directions, then integrate constant-length segments from the head.
 // Position interpolation used by the old study could collapse the neck near rest.
 for(let i=rings-1;i>=0;i--){
  const distance=(rings-i)*ds,a=Math.max(0,advance-distance/totalLength),history=flight.getTangentAt(a).normalize(),ramp=smooth(distance/4);
  const desired=standby.getTangentAt(i/rings).normalize();
  desired.applyAxisAngle(up,.055*Math.sin(distance*.39-t*1.8)*ramp);
  const lateral=new T.Vector3().crossVectors(up,desired).normalize();
  desired.applyAxisAngle(lateral,.04*Math.sin(distance*.46-t*2)*ramp).normalize();
  // The head arrives first. Coiling propagates down the body later, rather than
  // forcing the whole silhouette into its rest pose at the arrival instant.
  const relax=smooth((wait-.65-(distance/bodyLength)*1.2)/2.6);
  const turn=new T.Quaternion().setFromUnitVectors(history,desired),neck=smooth(distance/1.8),limit=ds/1.45;
  const candidate=history.clone().applyQuaternion(new T.Quaternion().slerp(turn,relax)).normalize();
  if(bodyState&&dt>0){const old=bodyState.tangents[i],change=new T.Quaternion().setFromUnitVectors(old,candidate);candidate.copy(old).applyQuaternion(new T.Quaternion().slerp(change,1-Math.exp(-dt*(12-5*distance/bodyLength)))).normalize();}
  const bendToHead=new T.Quaternion().setFromUnitVectors(candidate,headT);candidate.applyQuaternion(new T.Quaternion().slerp(bendToHead,1-neck));
  const bend=previous.angleTo(candidate),q=new T.Quaternion().setFromUnitVectors(previous,candidate);
  const safe=previous.clone().applyQuaternion(new T.Quaternion().slerp(q,bend>limit?limit/bend:1)).normalize();
  maxBend=Math.max(maxBend,previous.angleTo(safe));tangents[i]=safe;centers[i]=centers[i+1].clone().addScaledVector(safe,-ds);previous=safe;
 }
 // Stabilize the head in time, then transport its frame BACK along the body.
 // Tail changes can no longer flip or roll the head at the end of the intro.
 if(!headRight||t<lastTime){headRight=new T.Vector3().crossVectors(up,headT);if(headRight.lengthSq()<.001)headRight.set(1,0,0);headRight.normalize();}
 else if(lastHeadT)headRight.applyQuaternion(new T.Quaternion().setFromUnitVectors(lastHeadT,headT));
 headRight.addScaledVector(headT,-headRight.dot(headT)).normalize();
 const upright=new T.Vector3().crossVectors(up,headT);
 if(upright.lengthSq()>.001)headRight.copy(upright.normalize());
 let right=headRight.clone();
 for(let i=rings;i>=0;i--){if(i<rings)right.applyQuaternion(new T.Quaternion().setFromUnitVectors(tangents[i+1],tangents[i])).normalize();right.addScaledVector(tangents[i],-right.dot(tangents[i])).normalize();rights[i]=right.clone();ups[i]=new T.Vector3().crossVectors(tangents[i],right).normalize();}
 lastTime=t;lastHeadT=headT.clone();
 for(let i=0;i<=rings;i++){
  const right=rights[i],vertical=ups[i];
  const u=i/rings,r=(.035+.64*Math.min(1,u*2.5)**.65)*(1-.22*smooth((u-.72)/.28));
  for(let j=0;j<=sides;j++){
   const angle=j/sides*Math.PI*2,p=centers[i].clone().addScaledVector(right,Math.cos(angle)*r).addScaledVector(vertical,Math.sin(angle)*r);
   const k=(i*(sides+1)+j)*3;bodyP[k]=p.x;bodyP[k+1]=p.y;bodyP[k+2]=p.z;
  }
 }
 bodyGeo.attributes.position.needsUpdate=true;bodyGeo.computeVertexNormals();
 const last=rings;head.position.copy(centers[last]);head.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(rights[last],ups[last],tangents[last]));
 if(previousHeadQ&&t>=intro&&t<intro+1)maxArrivalHeadStep=Math.max(maxArrivalHeadStep,previousHeadQ.angleTo(head.quaternion));previousHeadQ=head.quaternion.clone();
 fins.forEach((m,j)=>{const i=Math.round((.16+j*.037)*rings),u=i/rings,r=(.035+.64*Math.min(1,u*2.5)**.65)*(1-.22*smooth((u-.72)/.28)),scale=.5+.5*u;
  const dir=ups[i].clone().multiplyScalar(.85).addScaledVector(tangents[i],-.52).normalize();
  m.position.copy(centers[i]).addScaledVector(ups[i],r*.92).addScaledVector(dir,.275*scale);m.quaternion.setFromUnitVectors(yAxis,dir);m.scale.setScalar(scale);
 });
 group.visible=true;skin.uniforms.time.value=t;skin.uniforms.uFoamTime.value=t;faceSkin.uniforms.time.value=t;faceSkin.uniforms.uFoamTime.value=t;
 bodyState={centers,tangents,rights,ups};
}
// The gate sits at the caster's right, in the same frame as the dragon.
const gate=new T.Group();gate.position.set(-3.8,.18,.1);layer.obj.add(gate);
// Original water-current sigil. No borrowed star texture or polygonal star.
const rune=new T.Group();gate.add(rune);
const shadowMat=new T.MeshBasicMaterial({color:'#092957',transparent:true,opacity:.35,depthWrite:false,depthTest:false,side:T.DoubleSide});
const shadow=new T.Mesh(new T.CircleGeometry(2.85,96),shadowMat);shadow.rotation.x=-Math.PI/2;shadow.position.y=-.015;shadow.renderOrder=0;gate.add(shadow);
const ringMat=new T.MeshBasicMaterial({color:'#8fecff',transparent:true,opacity:.9,depthWrite:false});
const ring=new T.Mesh(new T.TorusGeometry(2.85,.035,8,128),ringMat);ring.rotation.x=Math.PI/2;ring.position.y=.025;ring.renderOrder=5;gate.add(ring);
const glyphMat=new T.MeshBasicMaterial({color:'#168ce0',transparent:true,opacity:1,depthWrite:false,depthTest:false});
const glyphHi=new T.MeshBasicMaterial({color:'#a2f0ff',transparent:true,opacity:.8,depthWrite:false,depthTest:false});
function glyphPath(points,width=.035,material=glyphMat){const curve=new T.CatmullRomCurve3(points,false,'centripetal'),m=new T.Mesh(new T.TubeGeometry(curve,Math.max(32,points.length*2),width,6,false),material);m.renderOrder=2;rune.add(m);}
glyphPath(Array.from({length:100},(_,i)=>{const u=i/99,r=1.8*(1-u)+.12,a=-.8+u*Math.PI*3.3;return new T.Vector3(Math.cos(a)*r,.065,Math.sin(a)*r);}),.045);
for(const [start,end,r] of [[.2,1.9,2.18],[2.2,3.5,2.12],[3.9,5.9,2.18]])glyphPath(Array.from({length:30},(_,i)=>{const a=start+(end-start)*i/29;return new T.Vector3(Math.cos(a)*r,.07,Math.sin(a)*r);}),.025,glyphHi);
for(const a of [.1,1.25,2.55,3.8,5.2]){
 const radial=new T.Vector3(Math.cos(a),0,Math.sin(a)),tangent=new T.Vector3(-Math.sin(a),0,Math.cos(a));
 for(let k=0;k<2;k++)glyphPath(Array.from({length:20},(_,i)=>{const u=i/19;return radial.clone().multiplyScalar(2.43+k*.14+.09*Math.sin(u*Math.PI*2)).addScaledVector(tangent,(u-.5)*.55).add(new T.Vector3(0,.07,0));}),.028);
}
const water=STUDIO.state.I.L.find(s=>s.d.id==='water_material').mats[0].clone();
const crownGeo=new T.BufferGeometry(),cp=[],ci=[];
for(let i=0;i<=120;i++){const a=i/120*Math.PI*2,h=.6+1.5*Math.pow(.5+.5*Math.sin(a*9+.7*Math.sin(a*3)),3);
 cp.push(Math.cos(a)*1.3,0,Math.sin(a)*1.3,Math.cos(a)*1.9,h,Math.sin(a)*1.9);
 if(i<120){const k=i*2;ci.push(k,k+1,k+2,k+1,k+3,k+2);}}
crownGeo.setAttribute('position',new T.Float32BufferAttribute(cp,3));crownGeo.setAttribute('uv',new T.Float32BufferAttribute(Array.from({length:242},(_,i)=>[Math.floor(i/2)/120,i%2]).flat(),2));crownGeo.setIndex(ci);crownGeo.computeVertexNormals();
const crown=new T.Mesh(crownGeo,water);crown.position.y=.02;crown.renderOrder=3;gate.add(crown);
const pulse=new T.Mesh(new T.TorusGeometry(1,.07,8,96),ringMat.clone());pulse.rotation.x=Math.PI/2;pulse.position.y=.05;gate.add(pulse);
const dropletMat=new T.MeshBasicMaterial({color:'#bcefff'}),drops=new T.InstancedMesh(new T.SphereGeometry(1,7,5),dropletMat,110);layer.obj.add(drops);
drops.frustumCulled=false;
const transform=new T.Object3D();
function gateAt(t){
 const grow=smooth(t/.45),fade=1-smooth((t-5.3)/1);gate.scale.setScalar(.05+grow*.95);rune.rotation.y=t*.3;gate.visible=fade>.001;
 glyphMat.opacity=fade;glyphHi.opacity=.8*fade;shadowMat.opacity=.38*grow*fade;ringMat.opacity=.9*fade;
 const impact=Math.max(0,t-.5),splash=smooth(impact/.18)*(1-smooth((impact-.45)/.9));crown.scale.set(1+impact*.2,.05+splash*1.2,1+impact*.2);crown.visible=splash>.001;
 water.uniforms.time.value=t;
 pulse.visible=t>.5&&t<1.9;pulse.scale.setScalar(1.8+impact*3);pulse.material.opacity=Math.max(0,1-impact/1.4);
 for(let i=0;i<110;i++){
  const a=i*2.399963,birth=.48+(i%7)*.045,age=t-birth,speed=3+(i%11)*.35,vertical=5.5+(i%9)*.65;
  const y=.15+vertical*age-6.5*age*age,active=age>0&&age<1&&y>0;
  transform.position.set(-3.8+Math.cos(a)*(.6+speed*Math.max(0,age)),active?y:-100,.1+Math.sin(a)*(.6+speed*Math.max(0,age)));
  const size=.045+(i%5)*.017;transform.scale.set(active?size:0,active?size*(1.4+Math.max(0,1-age)*1.4):0,active?size:0);transform.rotation.z=a;transform.updateMatrix();drops.setMatrixAt(i,transform.matrix);
 }drops.instanceMatrix.needsUpdate=true;
}
// Water detaches from the moving body, inheriting a little of its momentum.
const sprayMaterial=new T.MeshBasicMaterial({color:'#d7f9ff'}),spray=new T.InstancedMesh(new T.SphereGeometry(1,7,5),sprayMaterial,320);
spray.frustumCulled=false;layer.obj.add(spray);
const curlCurve=new T.CatmullRomCurve3(Array.from({length:12},(_,i)=>{const a=i/11*Math.PI*1.4;return new T.Vector3(Math.cos(a)*.14,Math.sin(a)*.14,0);}));
const foamMaterial=new T.MeshBasicMaterial({color:'#f1ffff',transparent:true,opacity:.88,depthWrite:false});
const foam=new T.InstancedMesh(new T.TubeGeometry(curlCurve,16,.023,5,false),foamMaterial,70);foam.frustumCulled=false;layer.obj.add(foam);
const particles=[],foamParticles=[];let emitClock=0,seed=0,lastSprayTime=0,oldCenters=null;
const rand=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
function bodySprayAt(t){
 const dt=Math.max(0,Math.min(.05,t-lastSprayTime)),state=bodyState;if(!state)return;
 emitClock+=dt*(t<intro?140:t<intro+coilTime?100:65);
 while(emitClock>=1){emitClock--;const id=++seed,i=Math.round((.15+rand(id)*.76)*rings),p=state.centers[i];if(p.y<.3)continue;
  const side=rand(id+3)>.5?1:-1,normal=state.rights[i].clone().multiplyScalar(side*.8).addScaledVector(state.ups[i],.5).normalize();
  const v=normal.clone().multiplyScalar(.7+rand(id+2)*2.1);if(oldCenters&&dt>0)v.addScaledVector(p.clone().sub(oldCenters[i]).divideScalar(dt),.045);
  v.y+=.5+rand(id+5)*1.5;
  const particle={p:p.clone().addScaledVector(normal,.5),v,age:0,life:.5+rand(id+8)*.5,size:.04+rand(id+4)*.09,spin:rand(id+7)*6};
  if(id%5===0){particle.size=.8+rand(id+9)*.7;foamParticles.push(particle);}else particles.push(particle);
 }
 for(const pool of [particles,foamParticles])for(let i=pool.length-1;i>=0;i--){const p=pool[i];p.age+=dt;p.v.y-=dt*(pool===particles?6:2);p.p.addScaledVector(p.v,dt);if(p.age>p.life||p.p.y<.02)pool.splice(i,1);}
 for(const [mesh,pool] of [[spray,particles],[foam,foamParticles]]){
  for(let i=0;i<mesh.count;i++){const p=pool[i];if(p){const envelope=Math.sin(Math.PI*Math.min(1,p.age/p.life))**.4;transform.position.copy(p.p);transform.rotation.set(p.spin+t,p.spin*.5+t*.8,p.spin);
   if(mesh===spray)transform.scale.set(p.size*envelope,p.size*(1.4+Math.min(2,p.v.length()*.2))*envelope,p.size*envelope);else transform.scale.setScalar(p.size*envelope);
  }else{transform.position.set(0,-100,0);transform.scale.setScalar(0);}transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);}
  mesh.instanceMatrix.needsUpdate=true;
 }
 oldCenters=state.centers.map(p=>p.clone());lastSprayTime=t;
}
// Short tapered wave sheets travel around and along the body. They are open
// crests, not rigid rings, so their ends curl and peel away from the silhouette.
const waveSegments=24,waveSheets=[];
for(let j=0;j<8;j++){
 const g=new T.BufferGeometry(),p=new Float32Array((waveSegments+1)*6),idx=[];
 for(let i=0;i<waveSegments;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
 g.setAttribute('position',new T.BufferAttribute(p,3));g.setIndex(idx);
 const m=new T.Mesh(g,new T.MeshBasicMaterial({color:j%3?'#d9fbff':'#64d5ff',transparent:true,opacity:.65,depthWrite:false,side:T.DoubleSide}));m.frustumCulled=false;m.renderOrder=4;layer.obj.add(m);waveSheets.push(m);
}
function wavesAt(t){
 const s=bodyState;if(!s)return;
 for(let j=0;j<waveSheets.length;j++){
  const m=waveSheets[j],u=(t*.36+j/8)%1,center=s.centers[Math.round(u*rings)],arr=m.geometry.attributes.position.array;
  m.visible=center.y>.3;m.material.opacity=.62*smooth(u/.08)*smooth((1-u)/.1);
  for(let i=0;i<=waveSegments;i++){
   const k=i/waveSegments,v=Math.max(0,Math.min(1,u+(k-.5)*.085)),n=Math.round(v*rings),angle=j*2.39996+t*1.5+(k-.5)*Math.PI*1.4;
   const radial=s.rights[n].clone().multiplyScalar(Math.cos(angle)).addScaledVector(s.ups[n],Math.sin(angle));
   const radius=.87+.22*Math.sin(k*Math.PI)+.07*Math.sin(k*12-t*5),width=.11*Math.sin(Math.PI*k)**.7;
   for(let side=0;side<2;side++){const p=s.centers[n].clone().addScaledVector(radial,radius+(side?1:-1)*width),a=i*6+side*3;arr[a]=p.x;arr[a+1]=p.y;arr[a+2]=p.z;}
  }m.geometry.attributes.position.needsUpdate=true;
 }
}
const poseView=new URLSearchParams(location.search).has('poseview');
WD.gl.setSize(840,680,false);WD.composer.setSize(840,680);WD.cam.aspect=840/680;WD.cam.updateProjectionMatrix();
layer.obj.updateMatrixWorld(true);
const cameraPosition=layer.obj.localToWorld(new T.Vector3(...(poseView?[1,9,19]:[12,12,22]))),cameraTarget=layer.obj.localToWorld(new T.Vector3(...(poseView?[-3.5,5.3,-.8]:[-3,5,-1.5])));
WD.camHook=c=>{c.position.copy(cameraPosition);c.lookAt(cameraTarget);};
shape(0);gateAt(.3);if(WD.gl.compileAsync)await WD.gl.compileAsync(WD.scene,WD.cam);
const output=document.createElement('canvas');output.width=poseView?840:580;output.height=poseView?680:500;const ctx=output.getContext('2d'),images={};
for(let i=0;i<270;i++){
 const time=i/30;shape(time);gateAt(time);bodySprayAt(time);wavesAt(time);
 const caster=WD.PM3.get('me');if(time<1.1){caster.caN='orbs';caster.caT=Math.min(.59,time*.55);caster.cpT=0;}
 WD.render(0,performance.now());if(poseView)ctx.drawImage(WD.gl.domElement,0,0);else ctx.drawImage(WD.gl.domElement,160,80,580,500,0,0,580,500);
 ctx.fillStyle='rgba(0,12,30,.82)';ctx.fillRect(12,12,output.width-24,37);ctx.fillStyle='#eaffff';ctx.font=poseView?'18px Tahoma':'16px Tahoma';
 ctx.fillText(time<.9?'พุ่งขึ้นจากวงเวทกระแสน้ำ':time<intro?'บินวนไต่ขึ้นเร็ว แล้วโฉบเข้าจุดรอ':time<intro+coilTime?'หัวลอยรอ · ลำตัวและหางค่อยตามมา':'ริ้วคลื่นน้ำไหลขึ้นและโอบรอบลำตัว',24,37);
 if(!poseView)images['dragon_spiral_'+String(i).padStart(3,'0')]=output.toDataURL('image/jpeg',.94);
 else if(i===225)images.dragon_scoil_standby=output.toDataURL('image/jpeg',.97);
 if(i%6===5)await new Promise(r=>setTimeout(r,0));
}
return{images,frames:270,fps:30,headTriangles:headP.length/9,bodyLength,intro,coilTime,airPathLength:totalLength*(1-startAt),spiralTurns:quarters/4,maxBendDegrees:maxBend*180/Math.PI,maxArrivalHeadStepDegrees:maxArrivalHeadStep*180/Math.PI,standbyLength:standby.getLength(),standbyHead:standbyHead.toArray()};
