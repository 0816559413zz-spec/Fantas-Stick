// Studio-only flight study. Inject with tools/headless.js --js; no gameplay binding.
await STUDIO.load('water/dragon_hover');STUDIO.pause();STUDIO.at('self');
const F=STUDIO.state.fx;F.dur=10;F.layers=F.layers.filter(l=>l.id==='dragon');
Object.assign(F.layers[0],{shape:'sphere',pos:[0,0,0],life:10,loop:false});
F.layers.push({id:'water_material',t:'mesh',shape:'sphere',mat:'toonwater',att:'feet',pos:[0,-200,0],scale:.001,life:10,fade:0,col:'#8fe5ff',col2:'#238bdd',rim:.6,scroll:2,zw:true});
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
skin.needsUpdate=true;
const headGeo=new T.BufferGeometry();headGeo.setAttribute('position',new T.Float32BufferAttribute(headP,3));headGeo.setAttribute('normal',new T.Float32BufferAttribute(headN,3));headGeo.setAttribute('uv',new T.Float32BufferAttribute(headUV,2));
const group=new T.Group();layer.obj.add(group);layer.inner.visible=false;
const head=new T.Mesh(headGeo,skin);head.renderOrder=3;group.add(head);
const rings=260,sides=28,bodyGeo=new T.BufferGeometry(),bodyP=new Float32Array((rings+1)*(sides+1)*3),bodyUV=[],indices=[];
for(let i=0;i<=rings;i++)for(let j=0;j<=sides;j++){
 bodyUV.push(j/sides,1-.86*i/rings);
 if(i<rings&&j<sides){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,a+1,b+1,b);}
}
bodyGeo.setAttribute('position',new T.BufferAttribute(bodyP,3));bodyGeo.setAttribute('uv',new T.Float32BufferAttribute(bodyUV,2));bodyGeo.setIndex(indices);
const body=new T.Mesh(bodyGeo,skin);body.renderOrder=3;body.frustumCulled=false;group.add(body);
const finGeo=new T.ConeGeometry(.105,.55,8),fins=Array.from({length:20},()=>{const m=new T.Mesh(finGeo,skin);m.renderOrder=3;group.add(m);return m;});
const eyes=[-1,1].map(sign=>{const m=new T.Mesh(new T.SphereGeometry(.075,10,8),new T.MeshBasicMaterial({color:'#ff4242'}));
 const p=new T.Vector3(sign*.528,.092,.429);m.position.set(p.dot(oldRight),p.dot(oldUp),p.dot(oldForward));head.add(m);return m;});
const flight=new T.CatmullRomCurve3([
 [-3.8,-38,.1],[-3.8,-28,.1],[-3.8,-18,.1],[-3.8,-8,.1],[-3.8,-1.8,.1],[-4,2.5,.2],[-5,7,-1],
 [0,12,-5],[5,10,-1],[3,6,5],[-3,8,4],[-5,11,-2],[2,8,-4],[4,5,1],[2,5.5,-2],[-.5,3.7,-1.5],[-1.8,3.9,-.2],[-1.8,4.1,1.8]
].map(p=>new T.Vector3(...p)),false,'centripetal');
flight.arcLengthDivisions=3200;flight.updateArcLengths();const totalLength=flight.getLength(),bodyLength=28,intro=1.95;
const up=new T.Vector3(0,1,0),zAxis=new T.Vector3(0,0,1),yAxis=new T.Vector3(0,1,0);
function smooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
let startAt=0,startD=Infinity;const startPoint=new T.Vector3(-3.8,-3.5,.1);
for(let i=0;i<=2400;i++){const d=flight.getPointAt(i/2400).distanceToSquared(startPoint);if(d<startD){startAt=i/2400;startD=d;}}
function progress(t){const travel=Math.max(0,t-.12),fast=1.45,slow=.38,area=fast+slow*.5;if(travel<=fast)return travel/area;const q=Math.min(1,(travel-fast)/slow);return(fast+slow*(q-2.5*q**4+3*q**5-q**6))/area;}
let lastTime=-1,lastHeadT=null,headRight=null,maxBend=0;
function shape(t){
 const advance=startAt+(1-startAt)*progress(t),wait=Math.max(0,t-intro),relax=smooth(wait/1.35),ds=bodyLength/rings;
 const centers=new Array(rings+1),tangents=new Array(rings+1),rights=new Array(rings+1),ups=new Array(rings+1);
 const headT=flight.getTangentAt(advance).normalize();centers[rings]=flight.getPointAt(advance);
 if(wait>0){centers[rings].x+=.16*Math.sin(wait*2)*smooth(wait/.45);centers[rings].y+=.13*Math.sin(wait*2.6)*smooth(wait/.45);}
 tangents[rings]=headT.clone();let previous=headT.clone();
 const endT=flight.getTangentAt(1),flat=endT.clone();flat.y=0;flat.normalize();const side=new T.Vector3().crossVectors(up,flat).normalize();
 // Blend directions, then integrate constant-length segments from the head.
 // Position interpolation used by the old study could collapse the neck near rest.
 for(let i=rings-1;i>=0;i--){
  const distance=(rings-i)*ds,a=Math.max(0,advance-distance/totalLength),history=flight.getTangentAt(a).normalize(),ramp=smooth(distance/5);
  const yaw=.68*Math.sin(distance*.29-t*2.6)*ramp,pitch=Math.atan2(endT.y,Math.hypot(endT.x,endT.z))+.23*Math.sin(distance*.35-t*3)*ramp;
  const desired=flat.clone().multiplyScalar(Math.cos(yaw)*Math.cos(pitch)).addScaledVector(side,Math.sin(yaw)*Math.cos(pitch));desired.y=Math.sin(pitch);desired.normalize();
  const turn=new T.Quaternion().setFromUnitVectors(history,desired),neck=smooth(distance/1.4),limit=ds/2.6;
  const candidate=history.clone().applyQuaternion(new T.Quaternion().slerp(turn,relax)).normalize();
  const bendToHead=new T.Quaternion().setFromUnitVectors(candidate,headT);candidate.applyQuaternion(new T.Quaternion().slerp(bendToHead,1-neck));
  const bend=previous.angleTo(candidate),q=new T.Quaternion().setFromUnitVectors(previous,candidate);
  const safe=previous.clone().applyQuaternion(new T.Quaternion().slerp(q,bend>limit?limit/bend:1)).normalize();
  maxBend=Math.max(maxBend,previous.angleTo(safe));tangents[i]=safe;centers[i]=centers[i+1].clone().addScaledVector(safe,-ds);previous=safe;
 }
 // Stabilize the head in time, then transport its frame BACK along the body.
 // Tail changes can no longer flip or roll the head at the end of the intro.
 const dt=lastTime<0||t<lastTime?1/30:Math.max(0,t-lastTime);
 if(!headRight||t<lastTime){headRight=new T.Vector3().crossVectors(up,headT);if(headRight.lengthSq()<.001)headRight.set(1,0,0);headRight.normalize();}
 else if(lastHeadT)headRight.applyQuaternion(new T.Quaternion().setFromUnitVectors(lastHeadT,headT));
 headRight.addScaledVector(headT,-headRight.dot(headT)).normalize();
 const upright=new T.Vector3().crossVectors(up,headT);
 if(upright.lengthSq()>.08){upright.normalize();const roll=Math.atan2(new T.Vector3().crossVectors(headRight,upright).dot(headT),headRight.dot(upright));headRight.applyAxisAngle(headT,Math.max(-dt*2,Math.min(dt*2,roll*(1-Math.exp(-dt*5)))));}
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
 fins.forEach((m,j)=>{const i=Math.round((.16+j*.037)*rings),r=.6;
  const dir=ups[i].clone().multiplyScalar(.85).addScaledVector(tangents[i],-.52).normalize();
  m.position.copy(centers[i]).addScaledVector(ups[i],r).addScaledVector(dir,.22);m.quaternion.setFromUnitVectors(yAxis,dir);m.scale.setScalar(.5+.5*i/rings);
 });
 group.visible=true;skin.uniforms.time.value=t;
}
// The gate sits at the caster's right, in the same frame as the dragon.
const gate=new T.Group();gate.position.set(-3.8,.18,.1);layer.obj.add(gate);
const gateTex=await new T.TextureLoader().loadAsync('assets/fx/tex/water_magic_circle.png');gateTex.colorSpace=T.SRGBColorSpace;
const runeMat=new T.ShaderMaterial({uniforms:{gateMap:{value:gateTex},fade:{value:1}},transparent:true,depthWrite:false,depthTest:false,side:T.DoubleSide,
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform sampler2D gateMap;uniform float fade;varying vec2 vUv;void main(){vec3 s=texture2D(gateMap,vUv).rgb;float ink=max(s.r,max(s.g,s.b));if(ink<.06)discard;vec3 c=mix(vec3(.03,.27,.62),vec3(.65,.94,1.),pow(ink,4.));gl_FragColor=vec4(c,ink*fade);}' });
const rune=new T.Mesh(new T.PlaneGeometry(5.8,5.8),runeMat);rune.rotation.x=-Math.PI/2;rune.position.y=.025;rune.renderOrder=1;gate.add(rune);
const shadowMat=new T.MeshBasicMaterial({color:'#092957',transparent:true,opacity:.35,depthWrite:false,depthTest:false,side:T.DoubleSide});
const shadow=new T.Mesh(new T.CircleGeometry(2.85,96),shadowMat);shadow.rotation.x=-Math.PI/2;shadow.position.y=-.015;shadow.renderOrder=0;gate.add(shadow);
const ringMat=new T.MeshBasicMaterial({color:'#8fecff',transparent:true,opacity:.9,depthWrite:false});
const ring=new T.Mesh(new T.TorusGeometry(2.85,.035,8,128),ringMat);ring.rotation.x=Math.PI/2;ring.position.y=.025;ring.renderOrder=5;gate.add(ring);
// Physical rune strokes remain readable when the floor foreshortens the texture.
const glyphMat=new T.MeshBasicMaterial({color:'#168ce0',transparent:true,opacity:1,depthWrite:false,depthTest:false});
function glyphLine(a,b){const d=b.clone().sub(a),m=new T.Mesh(new T.CylinderGeometry(.045,.045,d.length(),6),glyphMat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());m.renderOrder=2;gate.add(m);}
for(let half=0;half<2;half++)for(let i=0;i<3;i++){
 const a=(i/3+half/6)*Math.PI*2,b=((i+1)/3+half/6)*Math.PI*2;
 glyphLine(new T.Vector3(Math.cos(a)*2,.06,Math.sin(a)*2),new T.Vector3(Math.cos(b)*2,.06,Math.sin(b)*2));
}
for(let i=0;i<18;i++){const a=i/18*Math.PI*2;glyphLine(new T.Vector3(Math.cos(a)*2.45,.06,Math.sin(a)*2.45),new T.Vector3(Math.cos(a+.035)*2.68,.06,Math.sin(a+.035)*2.68));}
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
 const grow=smooth(t/.22),fade=1-smooth((t-1.25)/.65);gate.scale.setScalar(.05+grow*.95);rune.rotation.z=t*.7;gate.visible=fade>.001;
 runeMat.uniforms.fade.value=fade;glyphMat.opacity=fade;shadowMat.opacity=.38*grow*fade;ringMat.opacity=.9*fade;
 const impact=Math.max(0,t-.2),splash=smooth(impact/.1)*(1-smooth((impact-.2)/.6));crown.scale.set(1+impact*.3,.05+splash*1.2,1+impact*.3);crown.visible=splash>.001;
 water.uniforms.time.value=t;
 pulse.visible=t>.2&&t<1.1;pulse.scale.setScalar(1.8+impact*4);pulse.material.opacity=Math.max(0,1-impact/.9);
 for(let i=0;i<110;i++){
  const a=i*2.399963,birth=.18+(i%7)*.025,age=t-birth,speed=3+(i%11)*.35,vertical=5.5+(i%9)*.65;
  const y=.15+vertical*age-6.5*age*age,active=age>0&&age<1&&y>0;
  transform.position.set(-3.8+Math.cos(a)*(.6+speed*Math.max(0,age)),active?y:-100,.1+Math.sin(a)*(.6+speed*Math.max(0,age)));
  const size=.045+(i%5)*.017;transform.scale.set(active?size:0,active?size*(1.4+Math.max(0,1-age)*1.4):0,active?size:0);transform.rotation.z=a;transform.updateMatrix();drops.setMatrixAt(i,transform.matrix);
 }drops.instanceMatrix.needsUpdate=true;
}
WD.gl.setSize(840,680,false);WD.composer.setSize(840,680);WD.cam.aspect=840/680;WD.cam.updateProjectionMatrix();
layer.obj.updateMatrixWorld(true);
const cameraPosition=layer.obj.localToWorld(new T.Vector3(25,13,7)),cameraTarget=layer.obj.localToWorld(new T.Vector3(-1,5,-8));
WD.camHook=c=>{c.position.copy(cameraPosition);c.lookAt(cameraTarget);};
shape(0);gateAt(.3);if(WD.gl.compileAsync)await WD.gl.compileAsync(WD.scene,WD.cam);
const output=document.createElement('canvas');output.width=840;output.height=680;const ctx=output.getContext('2d'),images={};
for(let i=0;i<132;i++){
 const time=i/30;shape(time);gateAt(time);
 const caster=WD.PM3.get('me');if(time<.7){caster.caN='orbs';caster.caT=Math.min(.59,time*.9);caster.cpT=0;}
 WD.render(0,performance.now());ctx.drawImage(WD.gl.domElement,0,0);
 ctx.fillStyle='rgba(0,12,30,.82)';ctx.fillRect(12,12,816,37);ctx.fillStyle='#eaffff';ctx.font='18px Tahoma';
 ctx.fillText(time<.65?'เรียกมังกรจากวงเวทด้านขวา · น้ำสาด':time<intro?'พุ่งขึ้นสูง · เลื้อยโฉบลงมาข้างตัว':'ลอยเหนือไหล่ขวา · ลำตัวและหางพลิ้วต่อ',24,37);
 images['dragon_gateflight_'+String(i).padStart(3,'0')]=output.toDataURL('image/png');
 if(i%6===5)await new Promise(r=>setTimeout(r,0));
}
return{images,frames:132,fps:30,headTriangles:headP.length/9,bodyLength,maxBendDegrees:maxBend*180/Math.PI,gateRight:3.8,standbyHead:[-1.8,4.1,1.8]};
