// Studio-only free-flight redesign: no prescribed rest position or S pose.
await STUDIO.load('water/dragon_hover');STUDIO.pause();STUDIO.at('self');
const F=STUDIO.state.fx;F.dur=16;F.layers=F.layers.filter(l=>l.id==='dragon');
Object.assign(F.layers[0],{shape:'sphere',pos:[0,0,0],life:16,loop:false});
F.layers.push({id:'water_material',t:'mesh',shape:'sphere',mat:'toonwater',att:'feet',pos:[0,-200,0],scale:.001,life:16,fade:0,col:'#8fe5ff',col2:'#238bdd',rim:.6,scroll:2,zw:true});
STUDIO.seek(.3);
const layer=STUDIO.state.I.L.find(s=>s.d.id==='dragon');
STUDIO.state.I.o.aim=false;
const T=WD.THREE;
// Read this uncompressed, single-mesh GLB directly. The preview does not need
// the optional network-loaded glTF decoder modules used by the game loader.
async function readWaterGeometry(url){
const response=await fetch(url);if(!response.ok)throw new Error('Missing water mesh: '+url);
const binary=await response.arrayBuffer(),dv=new DataView(binary),jsonLength=dv.getUint32(12,true);
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
return rawGeo;
}
let skin=layer.mats[0];
skin=skin.clone();skin.uniforms.uGroundY={value:WD.PM3.get('me').g.position.y+.025};
skin.depthWrite=true;
skin.vertexShader=skin.vertexShader.replace('void main(){','varying float vFlightY;varying vec3 vWaterP; void main(){vWaterP=position;vFlightY=(modelMatrix*vec4(position,1.0)).y;');
skin.fragmentShader=skin.fragmentShader.replace('void main(){','varying float vFlightY; uniform float uGroundY; void main(){if(vFlightY<uGroundY)discard;');
skin.uniforms.uFoamTime={value:0};skin.uniforms.uFoamStrength={value:1};skin.uniforms.uHead={value:0};skin.uniforms.uRim.value=.13;
skin.fragmentShader='varying vec3 vWaterP;uniform float uFoamTime,uFoamStrength,uHead;\n'+skin.fragmentShader;
skin.fragmentShader=skin.fragmentShader.replace('gl_FragColor=vec4(c*a',
 // Retain the original whole-body blue→cyan→pale gradient. Flow is a detail layer.
 'float ang=vUv.x*6.283185,flow=vUv.y*4.3+uFoamTime*1.25+.24*sin(ang*2.+vUv.y*12.)+.09*sin(ang*5.-vUv.y*19.);'+
 'float foamPhase=fract(flow);'+
 'float colourWave=.5+.5*sin(ang*3.+vUv.y*16.-uFoamTime*.8);'+
 'float light=.75+.25*max(0.,dot(normalize(vN),normalize(vec3(.3,.85,.45))));c*=light;'+
 'float along=clamp((1.-vUv.y)/.86,0.,1.),pale=smoothstep(.60,.94,min(c.r,min(c.g,c.b)));'+
 'c=mix(c,vec3(.04,.44,.69),pale*.52);c=mix(c,vec3(.025,.29,.46),smoothstep(.72,1.,along)*.74);'+
 'c=mix(c,vec3(.03,.65,.77),smoothstep(.6,.92,colourWave)*.13*(1.-uHead));'+
 'float foamNoise=texture2D(uNz,vec2(vUv.x*4.,vUv.y*17.-uFoamTime*.7)).r;'+
 'float foamBand=(1.-smoothstep(.025,.073,abs(foamPhase-.5)))*smoothstep(.21,.51,foamNoise);'+
 'float curl=.5+.5*sin(ang*4.+vUv.y*31.+sin(flow*6.283185)*1.4);'+
 'float feather=(1.-smoothstep(.014,.042,abs(fract(flow+.12+.075*curl)-.5)))*smoothstep(.48,.8,curl)*.7;'+
 'float row=floor(vUv.y*19.),sx=fract(vUv.x*7.+mod(row,2.)*.5)-.5,sy=fract(vUv.y*19.);'+
 'float scaleArc=(1.-smoothstep(.015,.045,abs(sy-(.27+1.4*sx*sx))))*(1.-smoothstep(.35,.48,abs(sx)))*smoothstep(.25,.65,foamNoise);'+
 'c=mix(c,vec3(.35,.80,.91),scaleArc*.35);'+
 'float headFoam=(1.-smoothstep(.06,.15,abs(sin(vWaterP.z*4.-uFoamTime*5.+vWaterP.x*3.))))*.3;'+
 'c=mix(c,vec3(.90,1.,1.),max(max(foamBand,feather)*uFoamStrength,headFoam*uHead));gl_FragColor=vec4(c*a');
skin.needsUpdate=true;
skin.uniforms.uFoamStrength.value=.75;
const faceSkin=skin.clone();faceSkin.uniforms.uFoamStrength.value=.18;faceSkin.uniforms.uHead.value=1;
const group=new T.Group();layer.obj.add(group);layer.inner.visible=false;
const head=new T.Group();head.scale.setScalar(2.25);group.add(head);
// New closed, tapered face. The entire head remains one rigid flight frame.
const faceTime={value:0},groundY=skin.uniforms.uGroundY;
function faceMaterial(base,glow,useColour=false){return new T.ShaderMaterial({
 uniforms:{uBase:{value:new T.Color(base)},uGlow:{value:new T.Color(glow)},uUseColour:{value:useColour?1:0},uTime:faceTime,uGroundY:groundY,uNoise:skin.uniforms.uNz},side:T.DoubleSide,depthWrite:true,
 vertexShader:'attribute vec3 color;varying vec3 vC,vN,vV,vP;varying float vY;void main(){vC=color;vP=position;vY=(modelMatrix*vec4(position,1.)).y;vec4 p=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
 fragmentShader:'uniform sampler2D uNoise;uniform vec3 uBase,uGlow;uniform float uUseColour,uTime,uGroundY;varying vec3 vC,vN,vV,vP;varying float vY;void main(){if(vY<uGroundY)discard;vec3 n=normalize(vN);float l=.50+.50*max(0.,dot(n,normalize(vec3(.3,.85,.45))));float rim=pow(1.-abs(dot(n,normalize(vV))),3.);vec3 c=mix(uBase,vC,uUseColour)*l;float noise=texture2D(uNoise,vec2(vP.z*.6-uTime*.07,vP.y*.9+vP.x*.8)).r;float phase=vP.z*5.8+vP.y*13.+.8*sin(vP.x*7.+vP.z*2.4);float line=(1.-smoothstep(.025,.12,abs(sin(phase))))*smoothstep(.28,.65,noise);float ink=smoothstep(.50,.76,noise)*(.5+.5*sin(phase*.45));c=mix(c,vec3(.025,.15,.35),ink*.25);c=mix(c,vec3(.24,.70,.82),line*.55);c=mix(c,vec3(.68,.95,.96),line*smoothstep(.58,.8,noise)*.62);c+=uGlow*rim*.22;gl_FragColor=vec4(c,1.);}'
 });}
const faceBlue=faceMaterial('#176ba8','#3cdaed',true),hornBlue=faceMaterial('#126193','#66ebff'),ridgeCyan=faceMaterial('#62d9e8','#b2ffff');
// The reference has a low, flowing skull, not a round cheek or a straight lance.
const profile=[[-.95,.03,.29,.29],[-.70,.06,.36,.31],[-.45,.09,.47,.34],[-.05,.08,.55,.36],[.35,.07,.51,.32],[.65,.015,.43,.27],[.87,-.07,.34,.205],[1.10,-.17,.25,.135],[1.34,-.23,.17,.09],[1.52,-.245,.075,.055],[1.58,-.235,.010,.015]];
function headProfile(z,k){
 let j=0;while(j<profile.length-2&&profile[j+1][0]<z)j++;
 const t=(z-profile[j][0])/(profile[j+1][0]-profile[j][0]),a=profile[Math.max(0,j-1)][k],b=profile[j][k],c=profile[j+1][k],d=profile[Math.min(profile.length-1,j+2)][k];
 return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
}
const faceGeo=new T.BufferGeometry(),fp=[],fc=[],fi=[],faceRings=88,faceSides=32;
const navy=new T.Color('#163d75'),aqua=new T.Color('#147e9f'),belly=new T.Color('#48bbc8'),flowHi=new T.Color('#9be9e9'),neckBlend=new T.Color('#4fb9d6');
for(let i=0;i<=faceRings;i++){
 const z=-.95+2.53*i/faceRings,cy=headProfile(z,1),rx=Math.max(.010,headProfile(z,2)),ry=Math.max(.012,headProfile(z,3));
 for(let j=0;j<=faceSides;j++){
  const a=j/faceSides*Math.PI*2,x=Math.cos(a)*rx,y=cy+Math.sin(a)*ry;fp.push(x,y,z);
  const top=.5+.5*Math.sin(a),colour=top>.5?aqua.clone().lerp(navy,(top-.5)*2):belly.clone().lerp(aqua,top*2);
  const side=Math.sin(a),bend=.09*Math.sin(z*3.2),streak=Math.exp(-Math.pow((side-.18-bend)/.045,2))*.55+Math.exp(-Math.pow((side-.65-bend*.5)/.035,2))*.30;
  colour.lerp(flowHi,streak);colour.lerp(belly,.2*(1-smooth((z+.45)/.55)));colour.lerp(neckBlend,.85*(1-smooth((z+.95)/.85)));fc.push(colour.r,colour.g,colour.b);
  if(i<faceRings&&j<faceSides){const n=i*(faceSides+1)+j;fi.push(n,n+1,n+faceSides+1,n+1,n+faceSides+2,n+faceSides+1);}
 }
}
faceGeo.setAttribute('position',new T.Float32BufferAttribute(fp,3));faceGeo.setAttribute('color',new T.Float32BufferAttribute(fc,3));faceGeo.setIndex(fi);faceGeo.computeVertexNormals();head.add(new T.Mesh(faceGeo,faceBlue));
function headStroke(points,r0,r1,mat){const m=taperedLimb(points,r0,r1,mat);head.add(m);return m;}
function eyePatch(sign,outline,offset,material){
 // Subdivide the white inlay onto the curved cheek. A flat fan sinks into the
 // skull and splits the eye into disconnected triangles.
 const contour=outline.map(([z,y])=>new T.Vector2(z,y)),triangles=T.ShapeUtils.triangulateShape(contour,[]),positions=[],segments=10;
 const onSurface=(z,y)=>{const ry=headProfile(z,3),q=(y-headProfile(z,1))/ry;return[sign*(headProfile(z,2)*Math.sqrt(Math.max(.1,1-q*q))+offset),y,z];};
 for(const ids of triangles){
  const [a,b,c]=ids.map(i=>contour[i]),point=(i,j)=>{const u=i/segments,v=j/segments;return onSurface(a.x*(1-u-v)+b.x*u+c.x*v,a.y*(1-u-v)+b.y*u+c.y*v);};
  for(let i=0;i<segments;i++)for(let j=0;j<segments-i;j++){
   positions.push(...point(i,j),...point(i+1,j),...point(i,j+1));
   if(i+j<segments-1)positions.push(...point(i+1,j),...point(i+1,j+1),...point(i,j+1));
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();const m=new T.Mesh(g,material);head.add(m);
}
// Curved water lamellae merge at the bridge, then split into thin swept tips.
function waterCrest(points,width){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),p=[],col=[],idx=[],segments=42;
 for(let i=0;i<=segments;i++){
  const u=i/segments,center=curve.getPointAt(u),tangent=curve.getTangentAt(u),across=new T.Vector3(0,tangent.z,-tangent.y).normalize();
  const w=width*Math.pow(1-u,.7)*(.7+.3*Math.sin(u*Math.PI)),thick=.014*Math.pow(1-u,.65);
  for(let face=0;face<2;face++)for(let j=0;j<3;j++){
   const v=j-1,point=center.clone().addScaledVector(across,w*v);point.x+=(face?1:-1)*thick;p.push(point.x,point.y,point.z);
   const colour=navy.clone().lerp(aqua,.30+.36*u);colour.lerp(flowHi,Math.abs(v)*(.28+.30*u));col.push(colour.r,colour.g,colour.b);
  }
  if(i<segments){const a=i*6,b=a+6;for(const [s,flip] of [[0,false],[3,true]])for(let j=0;j<2;j++){const q=a+s+j,r=b+s+j;if(flip)idx.push(q,r,q+1,q+1,r,r+1);else idx.push(q,q+1,r,q+1,r+1,r);}idx.push(a,b,a+3,a+3,b,b+3,a+2,a+5,b+2,a+5,b+5,b+2);}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('color',new T.Float32BufferAttribute(col,3));geo.setIndex(idx);geo.computeVertexNormals();head.add(new T.Mesh(geo,faceBlue));
}
headStroke([[0,-.15,1.48],[0,.08,1.04],[0,.38,.36],[0,.47,-.3]],.010,.025,ridgeCyan);
for(const s of [-1,1]){
 headStroke([[s*.065,-.25,1.52],[s*.18,-.285,1.29],[s*.29,-.25,.94],[s*.41,-.23,.53]],.006,.010,faceMaterial('#164063','#1b7092'));
 headStroke([[s*.15,-.10,1.30],[s*.33,.12,.92],[s*.43,.31,.54],[s*.47,.40,.02]],.010,.024,ridgeCyan);
 waterCrest([[s*.15,.24,.73],[s*.22,.50,.14],[s*.30,1.02,-.62],[s*.43,1.73,-1.26]],.085);
 waterCrest([[s*.24,.47,.18],[s*.28,.86,-.08],[s*.27,1.28,-.03],[s*.20,1.51,.22]],.065);
 waterCrest([[s*.46,-.05,.28],[s*.62,-.14,-.20],[s*.58,-.44,-.63],[s*.40,-.72,-.91]],.060);
 headStroke([[s*.41,-.23,.51],[s*.56,-.40,.05],[s*.53,-.55,-.43],[s*.41,-.53,-.74]],.016,.001,ridgeCyan);
 // A side-set white slash: no pupil, iris or separate black socket.
 const eyeOutline=[[1.025,-.074],[1.006,-.027],[.965,.025],[.897,.104],[.854,.128],[.878,.066],[.934,-.003],[.987,-.062]]
  .map(([z,y])=>[.94+(z-.94)*1.15-.085,.02+(y-.02)*1.15+.04]);
 eyePatch(s,eyeOutline,.018,new T.MeshBasicMaterial({color:'#ffffff',side:T.DoubleSide}));
}
const rings=300,sides=28,bodyGeo=new T.BufferGeometry(),bodyP=new Float32Array((rings+1)*(sides+1)*3),bodyUV=[],indices=[];
for(let i=0;i<=rings;i++)for(let j=0;j<=sides;j++){
 bodyUV.push(j/sides,1-.86*i/rings);
 if(i<rings&&j<sides){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,a+1,b+1,b);}
}
bodyGeo.setAttribute('position',new T.BufferAttribute(bodyP,3));bodyGeo.setAttribute('uv',new T.Float32BufferAttribute(bodyUV,2));bodyGeo.setIndex(indices);
const body=new T.Mesh(bodyGeo,skin);body.renderOrder=3;body.frustumCulled=false;group.add(body);
// Swept, thin water fins: a rooted sail silhouette rather than little cones.
const finShape=new T.Shape();finShape.moveTo(-.42,0);finShape.quadraticCurveTo(-.15,.48,.72,1.18);finShape.quadraticCurveTo(.36,.43,.74,.03);finShape.lineTo(-.42,0);
const finGeo=new T.ExtrudeGeometry(finShape,{depth:.07,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:1,steps:1,curveSegments:10});
finGeo.translate(0,0,-.035);finGeo.rotateY(Math.PI/2);
const finPos=finGeo.attributes.position,finUV=finGeo.attributes.uv;
for(let i=0;i<finPos.count;i++)finUV.setXY(i,.38+finPos.getZ(i)*.16,.68-finPos.getY(i)*.41);
const finSkin=skin.clone();finSkin.uniforms.uFoamStrength.value=.32;finSkin.uniforms.uRim.value=.22;
const fins=Array.from({length:38},()=>{const m=new T.Mesh(finGeo,finSkin);m.renderOrder=3;group.add(m);return m;});
// One small pair of forelimbs; their frame follows the same backbone as the fins.
const limbSkin=skin.clone();limbSkin.uniforms.uFoamStrength.value=.18;limbSkin.uniforms.uC1.value.set('#72d6ff');
const clawSkin=faceSkin.clone();clawSkin.uniforms.uC1.value.set('#dcfbff');
function taperedLimb(points,r0,r1,material){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),g=new T.TubeGeometry(curve,24,1,8,false),p=g.attributes.position,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++){
  const u=Math.floor(i/9)/24,center=curve.getPointAt(u),radius=r0+(r1-r0)*smooth(u),v=new T.Vector3().fromBufferAttribute(p,i).sub(center).multiplyScalar(radius).add(center);
  p.setXYZ(i,v.x,v.y,v.z);uv.setY(i,.30+u*.05);
 }g.computeVertexNormals();const m=new T.Mesh(g,material);m.renderOrder=3;return m;
}
const arms=[-1,1].map(sign=>{
 const root=new T.Group(),pose=new T.Group();root.add(pose);group.add(root);
 pose.add(taperedLimb([[sign*.72,-.12,0],[sign*1.18,-.58,-.22],[sign*1.32,-.86,-.12],[sign*1.18,-1.4,.30]],.23,.13,limbSkin));
 const palm=new T.Mesh(new T.SphereGeometry(1,12,8),limbSkin);palm.position.set(sign*1.18,-1.45,.36);palm.scale.set(.24,.16,.28);pose.add(palm);
 for(let j=-1;j<=1;j++){
  const x=sign*1.18+j*.17,z=.45+(.10-Math.abs(j)*.1);
  pose.add(taperedLimb([[x,-1.43,z],[x+j*.10,-1.65,z+.25],[x+j*.15,-1.90,z+.34]],.075,.025,limbSkin));
  pose.add(taperedLimb([[x+j*.15,-1.88,z+.34],[x+j*.17,-1.98,z+.30],[x+j*.18,-2.03,z+.14]],.045,.002,clawSkin));
 }return{root,pose,sign};
});
const bodyLength=40,intro=3.1,settleWindow=2,tipHz=3.4,bodyBulk=1.2;
function bodyRadius(u){return bodyBulk*(.035+.64*Math.min(1,u*2.5)**.65)*(1-.10*smooth((u-.72)/.28));}
// A still study isolates the actual preview head so its silhouette is reviewable.
if(new URLSearchParams(location.search).has('headstudy')){
 const scene=new T.Scene();scene.background=new T.Color('#193448');
 const model=head.clone(true);model.position.set(0,2,0);model.quaternion.identity();scene.add(model);
 const camera=new T.PerspectiveCamera(36,840/600,.1,100);camera.position.set(7.7,4.0,2.5);camera.lookAt(0,3.05,-.1);
 WD.gl.setSize(840,600,false);WD.composer.setSize(840,600);
 const pass=WD.composer.passes.find(p=>p.scene&&p.camera);if(!pass)throw new Error('Missing Studio render pass');pass.scene=scene;pass.camera=camera;
 if(WD.gl.compileAsync)await WD.gl.compileAsync(scene,camera);WD.composer.render(0);
 const canvas=document.createElement('canvas');canvas.width=840;canvas.height=600;const ctx=canvas.getContext('2d');ctx.drawImage(WD.gl.domElement,0,0);
 ctx.fillStyle='rgba(0,12,30,.8)';ctx.fillRect(14,14,812,38);ctx.fillStyle='#e4f9ff';ctx.font='18px Tahoma';ctx.fillText('ลดเขาให้โปร่ง · ตาใหญ่ขึ้นนิด และเลื่อนขึ้นไปทางขวา',26,39);
 return{images:{dragon_face_r4_study:canvas.toDataURL('image/jpeg',.97)},preview:'head only',bodyLength,upperCrests:4,eyeScale:1.15};
}
// Faster travel comes from a longer spiral, not from shortening the shot.
// Quarter-turn Hermite cubics share both position and tangent at every join.
const flight=new T.CurvePath();
const quarters=7,step=-Math.PI/2,dr=(5.3-3.8)/quarters,dy=12/quarters;
function spiralKnot(i){const a=Math.PI+step*i,r=3.8+dr*i;return{p:new T.Vector3(Math.cos(a)*r,1.2+dy*i,.1+Math.sin(a)*r),d:new T.Vector3(dr*Math.cos(a)-r*Math.sin(a)*step,dy,dr*Math.sin(a)+r*Math.cos(a)*step)};}
const first=spiralKnot(0),entry=new T.Vector3(-3.8,-2,.1);
flight.add(new T.LineCurve3(new T.Vector3(-3.8,-50,.1),entry));
flight.add(new T.CubicBezierCurve3(entry,entry.clone().add(new T.Vector3(0,1.4,0)),first.p.clone().addScaledVector(first.d,-1/3),first.p));
for(let i=0;i<quarters;i++){const a=spiralKnot(i),b=spiralKnot(i+1);flight.add(new T.CubicBezierCurve3(a.p,a.p.clone().addScaledVector(a.d,1/3),b.p.clone().addScaledVector(b.d,-1/3),b.p));}
const crest=spiralKnot(quarters);
// A broad bank follows the spiral's outgoing tangent, then levels into a lazy
// cruising arc. Neither the endpoint nor its facing comes from a standby pose.
const bank=new T.Vector3(-9.5,7.4,-.5),corner=new T.Vector3(-4.8,6.5,2.5),cruiseEntry=new T.Vector3(-2.4,6.5,4.9);
flight.add(new T.CubicBezierCurve3(crest.p,crest.p.clone().addScaledVector(crest.d,1/3),new T.Vector3(-9,10,-4.5),bank));
flight.add(new T.CubicBezierCurve3(bank,new T.Vector3(-10,4.8,3.5),new T.Vector3(-6.8,6.5,2.5),corner));
const quarterHandle=2.4*.55228475;
flight.add(new T.CubicBezierCurve3(corner,corner.clone().add(new T.Vector3(quarterHandle,0,0)),cruiseEntry.clone().add(new T.Vector3(0,0,-quarterHandle)),cruiseEntry));
const leadLength=flight.getLength();
// Finish the banking turn before slow cruising. Local +Z is the caster's aim.
flight.add(new T.LineCurve3(cruiseEntry,cruiseEntry.clone().add(new T.Vector3(0,0,25))));
flight.arcLengthDivisions=3200;flight.updateArcLengths();const totalLength=flight.getLength();
const up=new T.Vector3(0,1,0),zAxis=new T.Vector3(0,0,1),yAxis=new T.Vector3(0,1,0);
function smooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
let startAt=0,startD=Infinity;const startPoint=new T.Vector3(-3.8,-3.5,.1);
for(let i=0;i<=2400;i++){const d=flight.getPointAt(i/2400).distanceToSquared(startPoint);if(d<startD){startAt=i/2400;startD=d;}}
const startDistance=startAt*totalLength,distanceToCruise=leadLength-startDistance,hoverSpeed=.65,fastDuration=1.1,brakeDuration=1.65,startRamp=.12;
const fastSpeed=(distanceToCruise-hoverSpeed*brakeDuration*.5)/(fastDuration-startRamp*.5+brakeDuration*.5);
function progress(t){
 const travel=Math.max(0,t-.35);let distance;
 if(travel<startRamp){const q=travel/startRamp;distance=fastSpeed*startRamp*(q**3-.5*q**4);}
 else if(travel<=fastDuration)distance=fastSpeed*(travel-startRamp*.5);
 else if(travel<fastDuration+brakeDuration){const q=(travel-fastDuration)/brakeDuration,A=q-2.5*q**4+3*q**5-q**6;distance=fastSpeed*(fastDuration-startRamp*.5)+brakeDuration*(fastSpeed*A+hoverSpeed*(q-A));}
 else distance=distanceToCruise+hoverSpeed*(travel-fastDuration-brakeDuration);
 return Math.min(1,(startDistance+distance)/totalLength);
}
let lastTime=-1,lastHeadT=null,headRight=null,maxBend=0,bodyState=null,filteredAdvance=null,previousHeadQ=null,maxArrivalHeadStep=0,lastHeadP=null,measuredFastSpeed=0,measuredCruiseSpeed=0,maxGateCrossRadius=0,minFacingDot=1;
function shape(t){
 const dt=lastTime<0||t<lastTime?1/30:Math.max(0,t-lastTime);
 const advance=progress(t),wait=Math.max(0,t-intro),ds=bodyLength/rings;
 const centers=new Array(rings+1),tangents=new Array(rings+1),rights=new Array(rings+1),ups=new Array(rings+1);
 // Filter one path parameter, not position and heading independently.
 // This keeps the face tangent to its own motion even while braking.
 if(filteredAdvance===null||t<lastTime)filteredAdvance=advance;
 else filteredAdvance+=(advance-filteredAdvance)*(1-Math.exp(-dt*18));
 const rawT=flight.getTangentAt(filteredAdvance).normalize(),rawP=flight.getPointAt(filteredAdvance);
 if(lastHeadP&&dt>0){const speed=rawP.distanceTo(lastHeadP)/dt;if(t<1.5)measuredFastSpeed=Math.max(measuredFastSpeed,speed);if(t>intro+1)measuredCruiseSpeed=Math.max(measuredCruiseSpeed,speed);}lastHeadP=rawP.clone();
 const headT=rawT.clone();centers[rings]=rawP.clone();
 tangents[rings]=headT.clone();let previous=headT.clone();
 // Follow the actual travelled path. There is no rest-shape morph at all.
 for(let i=rings-1;i>=0;i--){
  const distance=(rings-i)*ds,a=Math.max(0,advance-distance/totalLength),history=flight.getTangentAt(a).normalize(),ramp=smooth(distance/4);
  const neck=smooth(distance/1.8),tip=smooth((distance-(bodyLength-5))/5),limit=ds/(1.45-.85*tip),candidate=history.clone();
  candidate.applyAxisAngle(up,.035*Math.sin(distance*.3-t*2.4)*ramp);
  if(bodyState&&dt>0){const old=bodyState.tangents[i],change=new T.Quaternion().setFromUnitVectors(old,candidate);candidate.copy(old).applyQuaternion(new T.Quaternion().slerp(change,1-Math.exp(-dt*(12-5*distance/bodyLength+65*tip)))).normalize();}
  // A fast travelling flick is localized to the last five metres; it does not
  // feed back into the head or prescribe any tail position.
  const phase=t*Math.PI*2*tipHz-(bodyLength-distance)*1.15,emerged=smooth((flight.getPointAt(a).y-.8)/1.4);
  candidate.applyAxisAngle(up,.95*Math.sin(phase)*tip**1.5*emerged);
  const tailSide=new T.Vector3().crossVectors(up,candidate);if(tailSide.lengthSq()>.001)candidate.applyAxisAngle(tailSide.normalize(),.5*Math.sin(phase+.8)*tip**1.5*emerged);
  const bendToHead=new T.Quaternion().setFromUnitVectors(candidate,headT);candidate.applyQuaternion(new T.Quaternion().slerp(bendToHead,1-neck));
  const bend=previous.angleTo(candidate),q=new T.Quaternion().setFromUnitVectors(previous,candidate);
  const safe=previous.clone().applyQuaternion(new T.Quaternion().slerp(q,bend>limit?limit/bend:1)).normalize();
  maxBend=Math.max(maxBend,previous.angleTo(safe));tangents[i]=safe;centers[i]=centers[i+1].clone().addScaledVector(safe,-ds);previous=safe;
 }
 // Near the ground every section follows its exact travelled path through the
 // gate. Unlock the free swimming deformation only above the portal throat.
 for(let i=0;i<rings;i++){
  const a=Math.max(0,filteredAdvance-(rings-i)*ds/totalLength),historyPoint=flight.getPointAt(a),free=centers[i];
  const unlock=smooth((Math.min(historyPoint.y,free.y)-.4)/2.2);centers[i]=historyPoint.lerp(free,unlock);
 }
 for(let i=0;i<rings;i++){
  const lo=centers[Math.max(0,i-1)],hi=centers[i+1];tangents[i]=hi.clone().sub(lo).normalize();
  const a=centers[i],b=centers[i+1];if((a.y-.18)*(b.y-.18)<=0&&Math.abs(b.y-a.y)>1e-6){const p=a.clone().lerp(b,(.18-a.y)/(b.y-a.y));maxGateCrossRadius=Math.max(maxGateCrossRadius,Math.hypot(p.x+3.8,p.z-.1));}
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
  const u=i/rings,r=bodyRadius(u);
  for(let j=0;j<=sides;j++){
   const angle=j/sides*Math.PI*2,p=centers[i].clone().addScaledVector(right,Math.cos(angle)*r).addScaledVector(vertical,Math.sin(angle)*r);
   const k=(i*(sides+1)+j)*3;bodyP[k]=p.x;bodyP[k+1]=p.y;bodyP[k+2]=p.z;
  }
 }
 bodyGeo.attributes.position.needsUpdate=true;bodyGeo.computeVertexNormals();
 const last=rings;head.position.copy(centers[last]).addScaledVector(tangents[last],-.95);head.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(rights[last],ups[last],tangents[last]));
 if(t>intro+1){const dragonForward=new T.Vector3(0,0,1).applyQuaternion(head.getWorldQuaternion(new T.Quaternion())),casterForward=new T.Vector3(0,0,1).applyQuaternion(WD.PM3.get('me').g.getWorldQuaternion(new T.Quaternion()));minFacingDot=Math.min(minFacingDot,dragonForward.dot(casterForward));}
 if(previousHeadQ&&t>=intro&&t<intro+1)maxArrivalHeadStep=Math.max(maxArrivalHeadStep,previousHeadQ.angleTo(head.quaternion));previousHeadQ=head.quaternion.clone();
 fins.forEach((m,j)=>{const i=Math.round((.10+j*.84/(fins.length-1))*rings),u=i/rings,r=bodyRadius(u),scale=(.24+.94*smooth(u/.70))*(.88+.12*Math.sin(j*1.7));
  m.position.copy(centers[i]).addScaledVector(ups[i],r*.90);m.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(rights[i],ups[i],tangents[i]));m.scale.set(scale*.82,scale,scale);
 });
 const armIndex=Math.round(.84*rings);
 arms.forEach(({root,pose,sign})=>{root.position.copy(centers[armIndex]);root.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(rights[armIndex],ups[armIndex],tangents[armIndex]));pose.rotation.z=sign*(.10+.05*Math.sin(t*2.1));pose.rotation.x=.06*Math.sin(t*1.8);});
 group.visible=true;faceTime.value=t;for(const material of [skin,faceSkin,finSkin,limbSkin,clawSkin]){material.uniforms.time.value=t;material.uniforms.uFoamTime.value=t;}
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
// Reuse the user's authored Blender splash, including its uneven crest and tip drops.
// Separate bursts expand, fall and fade instead of holding a ring of tall spikes.
const splashGeometry=await readWaterGeometry('assets/vfx/water_crown.glb');
const lowWaveGeometry=await readWaterGeometry('assets/vfx/water_ringwave_low.glb');
const splashBursts=[.22,.70,1.20].map((birth,j)=>{
 const material=water.clone();material.uniforms.uC1.value.set('#75f3ff');material.uniforms.uC2.value.set('#20b7e4');material.uniforms.uRim.value=.48;
 const mesh=new T.Mesh(splashGeometry,material);mesh.rotation.y=j*1.37;mesh.position.y=.025;mesh.renderOrder=3;gate.add(mesh);
 const wave=new T.Mesh(lowWaveGeometry,material);wave.position.y=.01;wave.rotation.y=j*2.1;wave.renderOrder=3;gate.add(wave);
 return{birth,mesh,wave,material};
});
const pulse=new T.Mesh(new T.TorusGeometry(1,.07,8,96),ringMat.clone());pulse.rotation.x=Math.PI/2;pulse.position.y=.05;gate.add(pulse);
const outerRing=new T.Mesh(new T.TorusGeometry(3.12,.035,6,128),new T.MeshBasicMaterial({color:'#209be9',transparent:true,opacity:.65,depthWrite:false}));outerRing.rotation.x=Math.PI/2;outerRing.position.y=.08;gate.add(outerRing);
const dropletMat=new T.MeshBasicMaterial({color:'#bcefff'}),drops=new T.InstancedMesh(new T.SphereGeometry(1,7,5),dropletMat,180);layer.obj.add(drops);
drops.frustumCulled=false;
const transform=new T.Object3D();
function gateAt(t){
 const grow=smooth(t/.45),fade=1-smooth((t-5.3)/1);gate.scale.setScalar(.05+grow*1.65);rune.rotation.y=t*.3;gate.visible=fade>.001;
 glyphMat.opacity=fade;glyphHi.opacity=.8*fade;shadowMat.opacity=.38*grow*fade;ringMat.opacity=.9*fade;
 const impact=Math.max(0,t-.22);
 water.uniforms.time.value=t;
 outerRing.material.opacity=.65*fade;outerRing.scale.setScalar(1+.035*Math.sin(t*4));
 splashBursts.forEach(({birth,mesh,wave,material},j)=>{
  const age=t-birth,u=Math.max(0,Math.min(1,age/1.05)),lift=smooth(u/.22)*(1-smooth((u-.28)/.72));
  mesh.visible=wave.visible=age>0&&u<1;
  const r=1.65+1.45*smooth(u);mesh.scale.set(r,(j?1.1:1.45)*lift+.015,r);
  wave.scale.set(1.4+u*2.0,.4*(1-u)+.08,1.4+u*2.0);
  material.uniforms.time.value=t;material.uniforms.uOp.value=(1-smooth((u-.5)/.5))*fade;
 });
 pulse.visible=t>.22&&t<1.7;pulse.scale.setScalar(1.4+impact*2.4);pulse.material.opacity=Math.max(0,1-impact/1.5);
 for(let i=0;i<drops.count;i++){
  const batch=Math.floor(i/60),a=i*2.399963,birth=splashBursts[batch].birth+(i%7)*.018,age=t-birth;
  const speed=2.4+(i%11)*.25,vertical=3.4+(i%9)*.36,y=.18+vertical*age-6.5*age*age,active=age>0&&age<1.15&&y>0;
  const r=2.15+speed*Math.max(0,age);transform.position.set(-3.8+Math.cos(a)*r,active?y:-100,.1+Math.sin(a)*r);
  const size=.045+(i%5)*.017;transform.scale.set(active?size:0,active?size*(1.4+Math.max(0,1-age)*1.4):0,active?size:0);transform.rotation.z=a;transform.updateMatrix();drops.setColorAt(i,new T.Color(i%3?'#bcefff':'#34ccf3'));drops.setMatrixAt(i,transform.matrix);
 }drops.instanceMatrix.needsUpdate=true;
}
// Water detaches from the moving body, inheriting a little of its momentum.
const sprayMaterial=new T.MeshBasicMaterial({color:'#d7f9ff'}),spray=new T.InstancedMesh(new T.SphereGeometry(1,7,5),sprayMaterial,600);
spray.frustumCulled=false;layer.obj.add(spray);
const curlCurve=new T.CatmullRomCurve3(Array.from({length:12},(_,i)=>{const a=i/11*Math.PI*1.4;return new T.Vector3(Math.cos(a)*.14,Math.sin(a)*.14,0);}));
const foamMaterial=new T.MeshBasicMaterial({color:'#f1ffff',transparent:true,opacity:.88,depthWrite:false});
const foam=new T.InstancedMesh(new T.TubeGeometry(curlCurve,16,.023,5,false),foamMaterial,130);foam.frustumCulled=false;layer.obj.add(foam);
const particles=[],foamParticles=[];let emitClock=0,seed=0,lastSprayTime=0,oldCenters=null;
const rand=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
function bodySprayAt(t){
 const dt=Math.max(0,Math.min(.05,t-lastSprayTime)),state=bodyState;if(!state)return;
 emitClock+=dt*(t<intro?200:t<intro+settleWindow?170:130);
 while(emitClock>=1){emitClock--;const id=++seed,i=Math.round((.15+rand(id)*.76)*rings),p=state.centers[i];if(p.y<.3)continue;
  const side=rand(id+3)>.5?1:-1,normal=state.rights[i].clone().multiplyScalar(side*.8).addScaledVector(state.ups[i],.5).normalize();
  const v=normal.clone().multiplyScalar(.7+rand(id+2)*2.1);if(oldCenters&&dt>0)v.addScaledVector(p.clone().sub(oldCenters[i]).divideScalar(dt),.045);
  v.y+=.5+rand(id+5)*1.5;
  const particle={p:p.clone().addScaledVector(normal,bodyRadius(i/rings)*1.02),v,age:0,life:.5+rand(id+8)*.5,size:.04+rand(id+4)*.09,spin:rand(id+7)*6};
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
for(let j=0;j<6;j++){
 const g=new T.BufferGeometry(),p=new Float32Array((waveSegments+1)*6),idx=[];
 for(let i=0;i<waveSegments;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
 g.setAttribute('position',new T.BufferAttribute(p,3));g.setIndex(idx);
 const m=new T.Mesh(g,new T.MeshBasicMaterial({color:['#d9fbff','#30dce9','#67bbff'][j%3],transparent:true,opacity:.6,depthWrite:false,side:T.DoubleSide}));m.frustumCulled=false;m.renderOrder=4;layer.obj.add(m);waveSheets.push(m);
}
function wavesAt(t){
 const s=bodyState;if(!s)return;
 for(let j=0;j<waveSheets.length;j++){
  const m=waveSheets[j],u=(t*.36+j/waveSheets.length)%1,center=s.centers[Math.round(u*rings)],arr=m.geometry.attributes.position.array;
  m.visible=center.y>.3;m.material.opacity=.35*smooth(u/.08)*smooth((1-u)/.1);
  for(let i=0;i<=waveSegments;i++){
   const k=i/waveSegments,v=Math.max(0,Math.min(1,u+(k-.5)*.085)),n=Math.round(v*rings),angle=j*2.39996+t*1.5+(k-.5)*Math.PI*1.4;
   const radial=s.rights[n].clone().multiplyScalar(Math.cos(angle)).addScaledVector(s.ups[n],Math.sin(angle));
   const radius=bodyRadius(v)+.20+.22*Math.sin(k*Math.PI)+.07*Math.sin(k*12-t*5),width=.11*Math.sin(Math.PI*k)**.7;
   for(let side=0;side<2;side++){const p=s.centers[n].clone().addScaledVector(radial,radius+(side?1:-1)*width),a=i*6+side*3;arr[a]=p.x;arr[a+1]=p.y;arr[a+2]=p.z;}
  }m.geometry.attributes.position.needsUpdate=true;
 }
}
// Three detached, thick water currents wrap the moving spine at different scales.
// All points are sampled in the dragon's transported frame, never a fixed pose.
const currentConfigs=[
 {start:.18,end:.83,turns:1.35,radius:2.4,width:.48,thickness:.11,phase:.6},
 {start:.72,end:.95,turns:.78,radius:1.8,width:.32,thickness:.085,phase:2.8},
 {start:.025,end:.30,turns:.95,radius:1.45,width:.30,thickness:.075,phase:4.5},
 {start:.34,end:.62,turns:1.05,radius:1.9,width:.36,thickness:.09,phase:1.7},
 {start:.55,end:.90,turns:1.15,radius:2.9,width:.26,thickness:.07,phase:3.9}
];
const currentMaterial=new T.ShaderMaterial({
 uniforms:{uTime:faceTime,uNoise:skin.uniforms.uNz,uGroundY:groundY},transparent:true,depthWrite:true,side:T.DoubleSide,
 vertexShader:'varying vec2 vUv;varying vec3 vN,vV;varying float vY;void main(){vUv=uv;vY=(modelMatrix*vec4(position,1.)).y;vec4 p=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
 fragmentShader:'uniform sampler2D uNoise;uniform float uTime,uGroundY;varying vec2 vUv;varying vec3 vN,vV;varying float vY;void main(){if(vY<uGroundY)discard;float noise=texture2D(uNoise,vec2(vUv.x*9.-uTime*.65,vUv.y*1.5+uTime*.1)).r;float flow=.5+.5*sin(vUv.x*43.-uTime*6.+noise*3.);vec3 c=mix(vec3(.025,.25,.54),vec3(.055,.68,.80),flow*.65+noise*.25);float l=.6+.4*max(0.,dot(normalize(vN),normalize(vec3(.3,.85,.45))));c*=l;float lip=pow(abs(cos(vUv.y*6.283185)),6.);float cap=smoothstep(.42,.62,noise+.15*sin(vUv.x*31.-uTime*4.));float foam=lip*smoothstep(.23,.6,noise)+cap*.95+(1.-smoothstep(.035,.11,abs(sin(vUv.x*57.-uTime*7.+noise*4.))))*smoothstep(.56,.85,noise)*.72;c=mix(c,vec3(.82,.95,.99),clamp(foam,0.,1.));gl_FragColor=vec4(c,.96);}'
});
const currentSegments=144,currentSides=8,currentMeshes=currentConfigs.map(()=>{
 const geometry=new T.BufferGeometry(),positions=new Float32Array((currentSegments+1)*(currentSides+1)*3),uv=[],indices=[];
 for(let i=0;i<=currentSegments;i++)for(let j=0;j<=currentSides;j++){
  uv.push(i/currentSegments,j/currentSides);if(i<currentSegments&&j<currentSides){const a=i*(currentSides+1)+j,b=a+currentSides+1;indices.push(a,a+1,b,a+1,b+1,b);}
 }
 geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
 const mesh=new T.Mesh(geometry,currentMaterial);mesh.frustumCulled=false;mesh.renderOrder=4;layer.obj.add(mesh);return mesh;
});
function currentPoint(config,t,k){
 const u=config.start+(config.end-config.start)*k,x=u*rings,i=Math.min(rings-1,Math.floor(x)),f=x-i;
 const center=bodyState.centers[i].clone().lerp(bodyState.centers[i+1],f),right=bodyState.rights[i].clone().lerp(bodyState.rights[i+1],f).normalize(),vertical=bodyState.ups[i].clone().lerp(bodyState.ups[i+1],f).normalize();
 const mask=smooth((center.y-1.3)/1.1)*smooth((t-.65)/.6),angle=config.phase+k*config.turns*Math.PI*2+t*.75;
 const radial=right.multiplyScalar(Math.cos(angle)).addScaledVector(vertical,Math.sin(angle)).normalize(),radius=config.radius*(.9+.12*Math.sin(k*Math.PI)+.06*Math.sin(k*9-t*2));
 return{point:center.addScaledVector(radial,radius*mask),radial,mask};
}
const currentSpray=new T.InstancedMesh(new T.SphereGeometry(1,7,5),new T.MeshBasicMaterial({color:'#c8e9f1'}),360);currentSpray.frustumCulled=false;layer.obj.add(currentSpray);
const currentParticles=[];let lastCurrentTime=0,currentEmit=0,currentSeed=0;
function currentsAt(t){
 if(!bodyState)return;const dt=Math.max(0,Math.min(.05,t-lastCurrentTime));lastCurrentTime=t;
 for(let c=0;c<currentConfigs.length;c++){
  const config=currentConfigs[c],mesh=currentMeshes[c],arr=mesh.geometry.attributes.position.array;
  for(let i=0;i<=currentSegments;i++){
   const k=i/currentSegments,sample=currentPoint(config,t,k),lo=currentPoint(config,t,Math.max(0,k-.003)).point,hi=currentPoint(config,t,Math.min(1,k+.003)).point;
   const tangent=hi.sub(lo).normalize(),across=new T.Vector3().crossVectors(sample.radial,tangent).normalize();
   if(across.lengthSq()<.1)across.copy(bodyState.ups[Math.round((config.start+(config.end-config.start)*k)*rings)]);
   const normal=new T.Vector3().crossVectors(tangent,across).normalize(),envelope=Math.pow(Math.max(0,Math.sin(k*Math.PI)),.45)*sample.mask;
   const width=config.width*envelope*(.9+.22*Math.sin(k*41-t*5)),thick=config.thickness*envelope;
   const crestHeight=.22*envelope*Math.pow(.5+.5*Math.sin(k*85-t*5+.8*Math.sin(k*21)),7);
   for(let j=0;j<=currentSides;j++){
    const a=j/currentSides*Math.PI*2,p=sample.point.clone().addScaledVector(across,Math.cos(a)*width).addScaledVector(normal,Math.sin(a)*thick+Math.pow(Math.max(0,Math.sin(a)),5)*crestHeight),index=(i*(currentSides+1)+j)*3;
    arr[index]=p.x;arr[index+1]=p.y;arr[index+2]=p.z;
   }
  }mesh.geometry.attributes.position.needsUpdate=true;mesh.geometry.computeVertexNormals();
 }
 currentEmit+=dt*260*smooth((t-.8)/.5);
 while(currentEmit>=1){
  currentEmit--;const id=++currentSeed,config=currentConfigs[id%currentConfigs.length],k=.05+rand(id+17)*.90,sample=currentPoint(config,t,k);if(sample.mask<.7)continue;
  const tangent=currentPoint(config,t,Math.min(1,k+.01)).point.sub(sample.point).normalize(),velocity=tangent.multiplyScalar(1.6+rand(id+4)*1.8).addScaledVector(sample.radial,.5+rand(id)*1.2);velocity.y+=.7+rand(id+7)*1.3;
  currentParticles.push({p:sample.point.clone(),v:velocity,age:0,life:.45+rand(id+13)*.45,size:.075+rand(id+6)*.12,foam:id%3!==0});
 }
 for(let i=currentParticles.length-1;i>=0;i--){const p=currentParticles[i];p.age+=dt;p.v.y-=dt*5;p.p.addScaledVector(p.v,dt);if(p.age>p.life||p.p.y<.03)currentParticles.splice(i,1);}
 for(let i=0;i<currentSpray.count;i++){
  const p=currentParticles[i];if(p){const a=Math.sin(Math.PI*p.age/p.life)**.35;transform.position.copy(p.p);transform.rotation.set(t+i,i*1.7,t*.7);transform.scale.set(p.size*(p.foam?1.8:1)*a,p.size*(p.foam?.55:1.8)*a,p.size*a);}
  else{transform.position.set(0,-100,0);transform.scale.setScalar(0);}transform.updateMatrix();currentSpray.setMatrixAt(i,transform.matrix);
 }currentSpray.instanceMatrix.needsUpdate=true;
}
const faceView=new URLSearchParams(location.search).has('headview'),poseView=faceView||new URLSearchParams(location.search).has('poseview');
WD.gl.setSize(840,680,false);WD.composer.setSize(840,680);WD.cam.aspect=840/680;WD.cam.updateProjectionMatrix();
layer.obj.updateMatrixWorld(true);
const cameraPosition=layer.obj.localToWorld(new T.Vector3(...(faceView?[4.8,9,12]:poseView?[10,9,14]:[11,13,24]))),cameraTarget=layer.obj.localToWorld(new T.Vector3(...(faceView?[-2.4,6.8,8.5]:poseView?[-3,7,3]:[-4,6,.5])));
WD.camHook=c=>{c.position.copy(cameraPosition);c.lookAt(cameraTarget);};
shape(0);gateAt(.3);if(WD.gl.compileAsync)await WD.gl.compileAsync(WD.scene,WD.cam);
const output=document.createElement('canvas');output.width=poseView?840:640;output.height=poseView?680:520;const ctx=output.getContext('2d'),images={};
for(let i=0;i<270;i++){
 const time=i/30;shape(time);gateAt(time);bodySprayAt(time);wavesAt(time);currentsAt(time);
 const caster=WD.PM3.get('me');if(time<1.1){caster.caN='orbs';caster.caT=Math.min(.59,time*.55);caster.cpT=0;}
 WD.render(0,performance.now());if(poseView)ctx.drawImage(WD.gl.domElement,0,0);else ctx.drawImage(WD.gl.domElement,100,60,640,520,0,0,640,520);
 ctx.fillStyle='rgba(0,12,30,.82)';ctx.fillRect(12,12,output.width-24,37);ctx.fillStyle='#eaffff';ctx.font=poseView?'18px Tahoma':'16px Tahoma';
 ctx.fillText(faceView?'ผิวริ้วน้ำชัดขึ้น · หัวที่เลือกประกอบกับลำตัว':time<1.9?'มังกรน้ำ · โผล่จากวงเวทพร้อมน้ำสาด':'กระแสน้ำโอบรอบตัว · ขอบโฟมและละอองแตกกระเซ็น',24,37);
 if(!poseView)images['dragon_waterwrap_'+String(i).padStart(3,'0')]=output.toDataURL('image/jpeg',.94);
 else if(i===225)images[faceView?'dragon_waterwrap_close':'dragon_waterwrap_still']=output.toDataURL('image/jpeg',.97);
 if(i%6===5)await new Promise(r=>setTimeout(r,0));
}
return{images,frames:270,fps:30,bodyLength,bodyBulk,dorsalFinCount:fins.length,forelimbs:arms.length,intro,splashAsset:'assets/vfx/water_crown.glb',waveAsset:'assets/vfx/water_ringwave_low.glb',majorWaterCurrents:currentMeshes.length,outerWaveSheets:waveSheets.length,airPathLength:distanceToCruise,fastSpeed,measuredFastSpeed,hoverSpeed,measuredCruiseSpeed,tipHz,maxGateCrossRadius,gateRadius:2.85*1.7,minFacingDot,maxBendDegrees:maxBend*180/Math.PI,maxArrivalHeadStepDegrees:maxArrivalHeadStep*180/Math.PI};
