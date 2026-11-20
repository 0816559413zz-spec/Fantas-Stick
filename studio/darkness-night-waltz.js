// Studio-only study of the torn ribbons in Night Waltz concept B.
const ST_NIGHT_WALTZ='darkness/night_waltz_preview';
const ST_WALTZ_AREA=7.9,ST_WALTZ_HIT=.56;

function stNightWaltzArea(root,instance){
  const material=new THREE.ShaderMaterial({
    uniforms:{age:{value:0},impact:{value:instance.impact??ST_WALTZ_HIT}},
    transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`varying vec2 field;void main(){field=uv*2.-1.;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float age,impact;varying vec2 field;
      void main(){
        float r=length(field),a=atan(field.y,field.x);
        float start=impact-.22;
        float front=smoothstep(start,impact,age);
        float spread=smoothstep(start,start+.07,age)*(1.-smoothstep(impact+.08,impact+.76,age));
        float swept=1.-smoothstep(front-.072,front+.012,r);
        float edge=1.-smoothstep(.954,1.,r);
        float flow=r*33.+sin(a*3.+r*4.)*.88-age*7.5;
        float stroke=1.-smoothstep(.045,.19,abs(fract(flow)-.47));
        stroke*=smoothstep(-.18,.78,sin(a*9.+r*7.-age*4.5))*smoothstep(.12,.36,r);
        float burst=(1.-smoothstep(.025,.115,abs(r-front)))*smoothstep(start+.045,start+.15,age)*(1.-smoothstep(impact,impact+.16,age));
        float cut=.40+.60*smoothstep(-.8,.36,sin(a*9.-r*14.)+.42*sin(a*19.));
        float alpha=edge*(spread*swept*(.19+.25*stroke)+.57*burst*cut);
        vec3 shade=mix(vec3(.003,.004,.008),vec3(.11,.098,.14),clamp(.45*stroke+.33*burst,0.,1.));
        gl_FragColor=vec4(shade,alpha);
        #include <colorspace_fragment>
      }`
  });
  const area=new THREE.Mesh(new THREE.CircleGeometry(ST_WALTZ_AREA,96),material);
  area.name='Night Waltz attack area';
  area.rotation.x=-Math.PI/2;area.position.y=.045;area.renderOrder=1;
  area.onBeforeRender=()=>{material.uniforms.age.value=instance.t;};
  root.add(area);
}

function stNightWaltzPose(caster,t){
  const ease=stDarkEase,hitAge=t-ST_WALTZ_HIT;
  const charge=ease(.10,.38,t)*(1-ease(.38,.54,t));
  const release=ease(-.05,.075,hitAge)*(1-ease(.12,.44,hitAge));
  stDarkPose(caster,{back:.19*charge-.16*release,roll:0,drop:.14*charge,arms:.27*charge+.66*release,step:0});
}

FXCODE.studio_night_waltz=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  const root=new THREE.Group();
  root.name='Night Waltz preview';
  anchor.obj.add(root);
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{
    instance.updateNightWaltz=null;
    disposeTree(root);
    root.removeFromParent();
  });

  const look=getLook(NET.myId);
  const actor=(id,appearance,x,z)=>{
    const student=makeStudent(appearance,id);
    student.g.name=id;student.g.position.set(x,0,z);
    student.g.rotation.y=Math.atan2(-x,-z);
    root.add(student.g);useFileModel(student,'char_student',lookTint(appearance),appearance);
    return student;
  };
  const caster=actor('Night Waltz caster',look,0,0);
  const targets=[[-4.8,1.6],[3.5,-3.2],[2.5,6.1],[-8.6,-4.2]].map(([x,z],i)=>{
    const student=actor('Night Waltz target '+(i+1),{...look,h:i%4,hs:i+1,cl:i%4},x,z);
    const distance=Math.hypot(x,z),marked=i===1;
    const mark=marked?stDarkTargetMark(student.g):null;
    const cutRoot=new THREE.Group();cutRoot.position.set(x,1.15,z);root.add(cutRoot);
    const span=marked?1.1:.70,points=[[-span,-.36,0],[.10,.25,.03],[span,.32,0]];
    const outer=stDarkCut(cutRoot,points,marked?.15:.10,0x111015);
    const core=stDarkCut(cutRoot,points,marked?.038:.019,marked?0xd1cbd8:0x857c8d,13);
    return {student,x,z,distance,marked,mark,cutRoot,outer,core};
  });
  stNightWaltzArea(root,instance);
  nightWaltzBorder(root,instance,true);
  instance.updateNightWaltz=()=>{
    const t=instance.t,ease=stDarkEase,hitAge=t-ST_WALTZ_HIT;
    stNightWaltzPose(caster,t);
    for(const {student,x,z,distance,marked,mark,cutRoot,outer,core} of targets){
      const reacts=distance<=ST_WALTZ_AREA;
      const impact=reacts?ease(0,.065,hitAge)*(1-ease(.12,.46,hitAge)):0;
      const push=impact*(marked?.64:.26)/distance;
      student.g.position.set(x+x*push,0,z+z*push);
      stDarkPose(student,{back:-(marked?.64:.36)*impact,roll:.22*impact,drop:impact*.11,arms:impact*.68,step:impact*.32});
      mark?.(t,Infinity);
      cutRoot.visible=reacts&&hitAge>0&&hitAge<.26;
      if(cutRoot.visible){cutRoot.lookAt(cam.position);outer(hitAge,.26);core(hitAge,.18);}
    }
  };
};
