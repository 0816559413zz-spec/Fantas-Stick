// Real GLTF A/B: same look, animation time, geometry and lighting; compare pixels,
// draw calls and unique skeletons. No wall-clock FPS claims.
// node tools/headless.js --game --js tools/check-student-batching.js --timeout 180 --quiet
HL.freeze();
const T=WD.THREE,gl=WD.gl,r=await WD.loadModel('char_student');
if(!r)throw new Error('student model unavailable');
const sc=new T.Scene();sc.background=new T.Color('#182430');
sc.add(new T.HemisphereLight('#dceaff','#394234',2));
const light=new T.DirectionalLight('#ffffff',3);light.position.set(3,5,2);sc.add(light);
const cam=new T.PerspectiveCamera(36,1,.1,40),size=384;
const rt=new T.WebGLRenderTarget(size,size),a=new Uint8Array(size*size*4),b=new Uint8Array(a.length);
const oldRT=gl.getRenderTarget(),oldAuto=gl.info.autoReset;gl.info.autoReset=false;
const rows=[],cells=[];
const stats=root=>{const skeletons=new Set();let meshes=0,tris=0;root.traverse(m=>{if(m.isMesh){meshes++;tris+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;}if(m.isSkinnedMesh)skeletons.add(m.skeleton);});return {meshes,tris,skeletons:skeletons.size};};
function draw(root,out){sc.add(root);gl.setRenderTarget(rt);gl.info.reset();gl.render(sc,cam);const calls=gl.info.render.calls;gl.readRenderTargetPixels(rt,0,0,size,size,out);sc.remove(root);return calls;}
function shot(bytes){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),im=x.createImageData(size,size);for(let y=0;y<size;y++)im.data.set(bytes.subarray((size-y-1)*size*4,(size-y)*size*4),y*size*4);x.putImageData(im,0,0);return c;}
try{
  for(const [look,colors] of [['gold',['#fbe3cf','#f0b92a','#4a2e16']],['blue',['#8b5a3c','#3faee8','#66ddcc']]]){
    const ref=WD.MODELS.lib.SU.clone(r.scene),opt=WD.MODELS.lib.SU.clone(r.scene);
    for(const root of [ref,opt])root.traverse(m=>{const variant=/^(hair|tie|wand)_(\d+)$/.exec(m.name);if(variant)m.visible=+variant[2]===0;if(!m.isMesh)return;m.material=m.material.clone();m.material.userData={};const i=['tint_skin','tint_house2','tint_eyes'].indexOf(m.material.name);if(i>=0)m.material.color.set(colors[i]);else if(m.material.name==='tint_cloak')m.material.color.set('#24232b');else if(m.material.name==='tint_hair')m.material.color.set('#34281e');else if(m.material.name==='tint_house')m.material.color.set(look==='gold'?'#a71b26':'#143778');});
    WD.batchStudent(opt);
    const before=stats(ref),after=stats(opt);
    if(before.tris!==after.tris||after.skeletons!==1||before.meshes-after.meshes!==2)throw new Error('incorrect batching '+JSON.stringify({before,after}));
    const mixers=[new T.AnimationMixer(ref),new T.AnimationMixer(opt)];
    for(const clip of r.animations){
      mixers.forEach(m=>{m.stopAllAction();m.clipAction(clip).play();m.setTime(clip.duration*.37);});
      for(const angle of [0,2.2]){
        cam.position.set(Math.sin(angle)*4,1.5,Math.cos(angle)*4);cam.lookAt(0,1,0);
        const callsBefore=draw(ref,a),callsAfter=draw(opt,b);let sum=0,bad=0,max=0;
        for(let i=0;i<a.length;i+=4){let d=0;for(let c=0;c<3;c++){const e=Math.abs(a[i+c]-b[i+c]);sum+=e;max=Math.max(max,e);d=Math.max(d,e);}if(d>3)bad++;}
        const mean=sum/(size*size*3),badRatio=bad/(size*size);
        rows.push({look,clip:clip.name,angle,callsBefore,callsAfter,mean,badRatio,max});
        if(mean>.1||badRatio>.001||callsBefore-callsAfter!==2)throw new Error('visual/draw-call regression '+JSON.stringify(rows[rows.length-1]));
        if(look==='gold'&&angle===0&&cells.length<8)cells.push({c:shot(b),label:clip.name});
      }
    }
  }
}finally{gl.setRenderTarget(oldRT);gl.info.autoReset=oldAuto;rt.dispose();}
if(HL.errs.length)throw new Error(JSON.stringify(HL.errs));
return {pass:true,samples:rows.length,worstMean:Math.max(...rows.map(r=>r.mean)),worstBadRatio:Math.max(...rows.map(r=>r.badRatio)),drawCallsSavedPerBody:2,skeletonsBefore:7,skeletonsAfter:1,images:{student_batch_poses:HL.sheet(cells,4,'Batched model: original animations')}};
