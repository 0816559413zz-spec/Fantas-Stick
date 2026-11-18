// Broad, tapered ribbons follow the ring. Only the tears interrupt the flowing silhouette.
function nightWaltzStrip(radius,angle,span,height,lean,speed,index,preview,strength=1){
  const profiles=[
    [.03,.14,.29,.40,.79,.70,.64,.59,.94,.40,.18,.02],
    [.02,.15,.31,.69,.91,.75,.62,.48,.58,.28,.11,.02],
    [.02,.08,.16,.34,.51,.49,.81,.92,.53,.32,.19,.03]
  ];
  const top=profiles[index%profiles.length],bottom=[.03,.06,.13,.14,.23,.15,.20,.12,.20,.14,.08,.02];
  const positions=[],uv=[],triangles=[];
  for(let i=0;i<top.length;i++){
    const u=i/(top.length-1),k=index%4===1?top.length-1-i:i;
    for(const [v,profile] of [[0,bottom],[1,top]]){
      const lift=profile[k],a=(u-.5)*span+.20*lean*lift;
      const r=radius+lean*lift+.12*Math.sin(u*6+index);
      positions.push(Math.cos(a)*r,.08+height*lift,Math.sin(a)*r);
      uv.push(u,v);
    }
    if(i){const j=i*2;triangles.push(j-2,j,j-1,j-1,j,j+1);}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(triangles);
  const material=new THREE.ShaderMaterial({
    uniforms:{age:{value:0},angle:{value:angle},seed:{value:index+1},speed:{value:speed},preview:{value:preview?1:0},strength:{value:strength}},
    side:THREE.DoubleSide,transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`uniform float age,angle,seed,speed,preview,strength;varying vec2 ribbon;
      varying float opacity,tear;
      void main(){
        float t=age-mod(seed,5.)*.025;
        float rise=smoothstep(.05,.36,t);
        tear=smoothstep(.82+preview*.06,1.53+preview*.22,t);
        opacity=rise*(1.-tear)*strength;
        float a=angle+speed*t,cs=cos(a),sn=sin(a);
        vec3 p=position;
        p.y*=.08+.92*rise+.18*tear;
        p.xz*=.94+.06*rise+.055*tear;
        p.xz=mat2(cs,sn,-sn,cs)*p.xz;
        ribbon=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }`,
    fragmentShader:`uniform float seed,age,speed,preview;varying vec2 ribbon;varying float opacity,tear;
      void main(){
        float u=ribbon.x,v=ribbon.y;
        if(opacity<.008)discard;
        if(u>.24&&u<.63&&abs(v-(.72-u*.86))<.034)discard;
        float piece=floor(u*26.+v*3.);
        float grain=fract(sin(piece*71.23+seed*31.72)*43758.55);
        float along=speed>0.?u:1.-u;
        float intact=mix(grain+.30*(1.-v),.72*along+.25*grain+.09*(1.-v),preview);
        if(intact<tear*1.15)discard;
        float fold=smoothstep(.45,.63,v*.82-u*.46+.08*sin(u*9.+seed));
        vec3 ink=mix(vec3(.002,.002,.004),vec3(.047,.045,.056),fold*.58+v*.19);
        if(preview>0.){
          // Broad charcoal bands with a bright thread at each leading edge.
          float lanes=v*6.2-u*2.8+.21*sin(u*12.+seed);
          float lane=floor(lanes),crossing=abs(fract(lanes)-.49);
          float aa=max(fwidth(lanes)*.60,.018);
          float band=1.-smoothstep(.18,.18+aa,crossing);
          float thread=1.-smoothstep(.031,.031+aa,abs(fract(lanes)-.34));
          float flow=u-sign(speed)*age*.52;
          float traveling=sin(flow*19.+lane*1.73+seed)*.5+.5;
          float mask=smoothstep(.07,.17,v)*(1.-smoothstep(.86,.99,v));
          mask*=smoothstep(.05,.18,u)*(1.-smoothstep(.82,.98,u));
          ink=mix(ink,vec3(.142,.131,.153),band*(.52+.36*traveling)*mask);
          ink=mix(ink,vec3(.31,.28,.34),thread*(.37+.52*traveling)*mask);
        }
        float seam=1.-smoothstep(.006,.025,abs(v-(.24+.48*u+.021*sin(u*19.-age*13.))));
        float glint=1.-smoothstep(.03,.26,abs(u-fract(age*1.65+seed*.29)));
        seam*=smoothstep(.12,.27,u)*(1.-smoothstep(.70,.85,u))*(.10+.23*glint);
        gl_FragColor=vec4(mix(ink,vec3(.49,.46,.53),seam),opacity);
        #include <colorspace_fragment>
      }`
  });
  const mesh=new THREE.Mesh(geometry,material);
  // The vertex shader sweeps the strip around the fixed cast position.
  mesh.frustumCulled=false;
  return mesh;
}

function nightWaltzBorder(parent,instance,preview=false){
  const root=new THREE.Group();root.name='Night Waltz cast edge';parent.add(root);
  const bands=[
    [7.8,.30,1.14,3.5,-.68], [8.0,1.94,.83,2.25,.45],
    [7.7,3.24,1.14,2.85,-.83], [8.16,4.79,1.19,3.75,.67], [7.9,5.82,.60,1.48,-.26]
  ];
  bands.forEach((band,i)=>root.add(nightWaltzStrip(...band,1.63,i,preview)));
  for(let i=0;i<12;i++){
    const outer=i%2===0;
    const angle=.24+i*.5236+(i%3)*.085;
    root.add(nightWaltzStrip(outer?8.32:7.32,angle,.32+(i%4)*.12,.44+(i%5)*.14,outer?.38:-.31,outer?1.92:-1.44,i+bands.length,preview,preview?.82:1));
  }
  if(preview)bands.forEach(([radius,angle,span,height,lean],i)=>{
    root.add(nightWaltzStrip(radius-.32,angle-span*.38,span*.82,height*.25,lean*.55,1.63,17+i,true,.66));
  });
  for(const strip of root.children)strip.onBeforeRender=()=>{strip.material.uniforms.age.value=instance.t;};
  return root;
}

FXCODE.darkness_night_waltz=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  const root=nightWaltzBorder(anchor.obj,instance);
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{disposeTree(root);root.removeFromParent();});
};
