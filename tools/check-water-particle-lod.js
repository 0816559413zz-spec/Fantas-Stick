// Real generated water blob + real particle update: small particles use the
// light mesh; close-ups keep original detail. Compare to forced full detail.
// node tools/headless.js --game --js tools/check-water-particle-lod.js --timeout 120 --quiet
await HL.solo({kit:'8'});
for(let i=0;i<100&&!WD.fx.R.schema;i++)await HL.sleep(25);
const d=await (await fetch('assets/fx/mesh/water_blob.mesh.json')).json();WD.mk.meshSet('water_blob',d);
WD.fx.clear();const P=WD.mk.particles,T=WD.THREE,gl=WD.gl,G=P.group('water_blob','ice','#12d6ff','#2d63ff');
if(!G.low)throw new Error('particle LOD unavailable');
const step=WD.tx(1)-WD.tx(0),x=-WD.tx(0)/step,y=-WD.tz(0)/step;
const particle={x,y,h:1,vx:0,vy:0,vh:0,g:0,drag:0,life:2,age:.2,s:.05,r0:0,bounce:0,spin:0,ax:1,ay:0,az:0,rx:.3,ry:.7,rz:.1};
G.list.push(particle);
const sc=new T.Scene();sc.background=new T.Color('#182430');sc.add(G.mesh,G.low,new T.HemisphereLight('#dceaff','#394234',2));
const light=new T.DirectionalLight('#ffffff',3);light.position.set(3,5,2);sc.add(light);
const rt=new T.WebGLRenderTarget(384,384),a=new Uint8Array(384*384*4),b=new Uint8Array(a.length),m=new T.Matrix4();
const oldRT=gl.getRenderTarget(),pos=WD.cam.position.clone(),quat=WD.cam.quaternion.clone(),rows=[],cells=[];
function draw(out){gl.setRenderTarget(rt);gl.render(sc,WD.cam);gl.readRenderTargetPixels(rt,0,0,384,384,out);}
function image(bytes){const c=document.createElement('canvas');c.width=c.height=384;const ctx=c.getContext('2d'),im=ctx.createImageData(384,384);for(let y=0;y<384;y++)im.data.set(bytes.subarray((383-y)*384*4,(384-y)*384*4),y*384*4);ctx.putImageData(im,0,0);return c;}
try{
  for(const distance of [8,4,1,.3]){
    WD.cam.position.set(0,1,distance);WD.cam.lookAt(0,1,0);P.update(0);
    const low=G.low.count,high=G.mesh.count;if(low+high!==1)throw new Error('particle lost or duplicated');
    draw(a);
    if(low){G.low.getMatrixAt(0,m);G.mesh.setMatrixAt(0,m);G.mesh.instanceMatrix.needsUpdate=true;G.low.count=0;G.mesh.count=1;}
    draw(b);let sum=0,max=0,changed=0;
    for(let i=0;i<a.length;i+=4){let delta=0;for(let c=0;c<3;c++){const v=Math.abs(a[i+c]-b[i+c]);sum+=v;max=Math.max(max,v);delta=Math.max(delta,v);}if(delta>3)changed++;}
    rows.push({distance,low,high,mean:sum/(384*384*3),max,changed});
    if(distance>=4&&!low||distance<=1&&!high)throw new Error('incorrect LOD selection '+JSON.stringify(rows));
    if(high&&max!==0)throw new Error('close-up appearance changed');
    if(low&&(sum/(384*384*3)>.01||changed>20))throw new Error('small-particle visual error too large');
    if(distance===4||distance===.3){cells.push({c:image(b),label:'full detail, distance '+distance},{c:image(a),label:'automatic, distance '+distance});}
  }
  G.list.push({...particle,s:.5});WD.cam.position.set(0,1,4);WD.cam.lookAt(0,1,0);P.update(0);
  if(G.mesh.count!==1||G.low.count!==1)throw new Error('mixed sizes lost or duplicated particles');
  P.update(3);if(G.mesh.count||G.low.count||G.list.length)throw new Error('expired low-detail particles remain');
  G.list.push({...particle});P.update(0);P.clear();if(G.mesh.count||G.low.count||G.list.length)throw new Error('particles survive clear');
}finally{gl.setRenderTarget(oldRT);WD.cam.position.copy(pos);WD.cam.quaternion.copy(quat);rt.dispose();}
if(HL.errs.length)throw new Error(JSON.stringify(HL.errs));
return {pass:true,originalTris:G.mesh.geometry.index.count/3,smallParticleTris:G.low.geometry.index.count/3,rows,images:{water_particle_lod:HL.sheet(cells,2,'Water particle LOD: same size, colour and material')}};
