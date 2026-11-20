const ST_DARKNESS_QUICK_DASH='darkness/quick_dash_preview';
const ST_DARKNESS_HOLD_DASH='darkness/hold_dash_preview';

function stDarkShiftStudent(root,look,name,tint){
  const actor=makeStudent(look,name);
  actor.g.name=name;
  root.add(actor.g);
  useFileModel(actor,'char_student',tint,look);
  actor.wandG.visible=false;
  actor.tip.visible=false;
  return actor;
}

function stDarkBodyTint(target,softFade=false){
  const strength={value:0};
  const coverage={value:1};
  let prepared=false;
  return (amount,bodyCoverage=1)=>{
    strength.value=amount;coverage.value=bodyCoverage;
    if(prepared||!target.fileModel)return;
    const copies=new Map();
    const darken=source=>{
      if(copies.has(source))return copies.get(source);
      const material=source.clone();
      delete material.userData.keep;
      if(softFade)material.transparent=true;
      material.customProgramCacheKey=()=>source.customProgramCacheKey()+'|dark-body-tint';
      material.onBeforeCompile=(shader,renderer)=>{
        source.onBeforeCompile.call(material,shader,renderer);
        shader.uniforms.darkBodyTint=strength;shader.uniforms.darkBodyCoverage=coverage;
        shader.fragmentShader='uniform float darkBodyTint,darkBodyCoverage;\n'+shader.fragmentShader.replace(
          '#include <opaque_fragment>',
          `#include <opaque_fragment>
          vec3 shadowBody=vec3(.009,.006,.014)+gl_FragColor.rgb*.048;
          gl_FragColor.rgb=mix(gl_FragColor.rgb,shadowBody,darkBodyTint);
          gl_FragColor.a*=darkBodyCoverage;`);
      };
      copies.set(source,material);
      return material;
    };
    target.fileModel.traverse(mesh=>{
      if(!mesh.isMesh||!mesh.material)return;
      mesh.material=Array.isArray(mesh.material)?mesh.material.map(darken):darken(mesh.material);
    });
    prepared=true;
  };
}

function stDarkMatter(root,name,bursts,origin,opacity=1){
  const colors=[0x0c0c13,0x22212d,0x393747,0x666172];
  const tones=colors.map(color=>new THREE.Color(color));
  const pieces=bursts.flatMap(({at,span=0,count,spread,lift,height,back=0})=>
    Array.from({length:count},(_,i)=>{
      const angle=i*2.39996,seed=(i*.618034)%1,chip=i%3!==0;
      return {at:at+span*(i+.5)/count,angle,chip,height:height+(seed-.5)*.36,
        life:(chip?.22:.34)+seed*.20,size:(chip?.025:.055)+seed*.055,
        x:Math.cos(angle)*spread*(.34+seed*.66),z:Math.sin(angle)*spread*(.34+seed*.66)-back,
        y:lift*(.34+((i*.313)%1)*.66),tone:i%11===0?3:i%4===0?2:i%4===1?1:0};
    }));
  const material=new THREE.MeshBasicMaterial({toneMapped:false,opacity,transparent:opacity<1,depthWrite:opacity===1});
  const mesh=new THREE.InstancedMesh(new THREE.OctahedronGeometry(1,0),material,pieces.length);
  mesh.setColorAt(0,tones[0]);
  mesh.name=name;mesh.frustumCulled=false;mesh.count=0;
  root.add(mesh);
  const point=new THREE.Vector3(),piece=new THREE.Object3D();
  return t=>{
    let count=0;
    for(const p of pieces){
      const age=t-p.at;
      if(age<0||age>=p.life)continue;
      const progress=age/p.life,drift=1-Math.pow(1-progress,2.2);
      const fade=(.35+.65*stDarkEase(0,.065,progress))*(1-stDarkEase(.37,1,progress));
      origin(p.at,point);
      piece.position.set(point.x+p.x*drift,Math.max(.08,p.height+p.y*drift-.48*progress*progress),
        point.z+p.z*drift);
      piece.rotation.set(p.angle+age*11,age*7,p.angle*.54-age*8);
      piece.scale.set(p.chip?.57:1,p.chip?1.7:.68,p.chip?.64:1).multiplyScalar(p.size*fade);
      piece.updateMatrix();
      mesh.setMatrixAt(count,piece.matrix);mesh.setColorAt(count,tones[p.tone]);count++;
    }
    mesh.count=count;mesh.instanceMatrix.needsUpdate=true;
    mesh.instanceColor.needsUpdate=true;
  };
}

function stDarkShiftShroud(root){
  const material=new THREE.ShaderMaterial({
    uniforms:{time:{value:0},cover:{value:0},strength:{value:0}},
    transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`uniform float time;varying vec3 inkPoint;
      void main(){
        inkPoint=position;
        float turn=atan(position.z,position.x);
        float ripple=sin(turn*7.0-position.y*13.0+time*15.0)*.038;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position+normal*ripple,1.0);
      }`,
    fragmentShader:`uniform float time,cover,strength;varying vec3 inkPoint;
      void main(){
        float angle=atan(inkPoint.z,inkPoint.x),height=inkPoint.y*.37+.5;
        float flow=angle*2.7-height*34.0+time*10.0;
        float edge=height+.13*sin(angle*3.0+time*10.0)+.08*sin(flow);
        float mask=1.0-smoothstep(cover-.17,cover,edge);
        float streak=pow(max(0.0,sin(flow+.38*sin(angle*5.0))),5.0);
        float seam=smoothstep(cover-.30,cover-.17,edge)*mask;
        vec3 ink=mix(vec3(.003,.003,.007),vec3(.061,.055,.082),streak*(.43+.55*seam));
        gl_FragColor=vec4(ink,mask*strength);
        #include <colorspace_fragment>
      }`
  });
  const shell=new THREE.Mesh(new THREE.CapsuleGeometry(.67,1.14,8,40),material);
  shell.name='Shift Dash shadow shroud';shell.renderOrder=9;
  root.add(shell);
  return (t,place,yaw,cover,strength,size,lean=0)=>{
    shell.visible=strength>.02;
    if(!shell.visible)return;
    shell.position.copy(place);shell.position.y=lerp(.98,1.19,size);
    shell.rotation.set(lean,yaw,0,'YXZ');
    shell.scale.set(lerp(.78,1.24,size),lerp(.47,1.04,size),lerp(.78,1.24,size));
    material.uniforms.time.value=t;
    material.uniforms.cover.value=cover;
    material.uniforms.strength.value=strength;
  };
}

function stDarkShiftCloakTrails(root){
  const bands=2,steps=29;
  const positions=new Float32Array(bands*steps*6),shades=new Float32Array(bands*steps*2),indices=[];
  for(let band=0;band<bands;band++){
    for(let i=0;i<steps-1;i++){
      const a=(band*steps+i)*2;
      indices.push(a,a+1,a+2,a+1,a+3,a+2);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('shade',new THREE.BufferAttribute(shades,1).setUsage(THREE.DynamicDrawUsage));
  geometry.setIndex(indices);
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    vertexShader:`attribute float shade;varying float ink;
      void main(){ink=shade;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying float ink;
      void main(){
        gl_FragColor=vec4(mix(vec3(.058,.050,.074),vec3(.005,.005,.010),ink),ink);
        #include <colorspace_fragment>
      }`
  });
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name='Long Dash cloak trails';mesh.renderOrder=10;mesh.frustumCulled=false;
  root.add(mesh);
  return (t,place,yaw,gather,flow,strength)=>{
    mesh.visible=strength>.02;
    if(!mesh.visible)return;
    mesh.position.copy(place);mesh.rotation.y=yaw;
    for(let band=0;band<bands;band++){
      const direction=band===0?1:-1;
      for(let i=0;i<steps;i++){
        const u=i/(steps-1),a=(band*steps+i)*2;
        const turn=-.55+band*Math.PI+t*11.2+gather*2.16-u*3.85;
        const radius=lerp(.91+.15*u,.40+.29*u,gather);
        const x=lerp(Math.sin(turn)*radius,direction*.34*(1-.65*u),flow);
        const orbitY=1.12+direction*.29+direction*.39*(u-.43)+.13*Math.cos(turn);
        const y=lerp(lerp(orbitY,1.05+direction*.14+.16*u,gather),
          1.07+direction*.11+.18*Math.sin(u*3+t*8)*u,flow);
        const z=lerp(Math.cos(turn)*radius,.16-(band===0?2.37:1.71)*u,flow);
        const taper=Math.sin(Math.PI*u)**.71;
        const half=(band===0?.123:.083)*taper*(1-.27*flow);
        const ink=strength*taper*(band===0?.96:.66);
        geometry.attributes.position.setXYZ(a,x+Math.sin(turn)*half*.38,y+half,z+Math.cos(turn)*half*.38);
        geometry.attributes.position.setXYZ(a+1,x-Math.sin(turn)*half*.38,y-half,z-Math.cos(turn)*half*.38);
        geometry.attributes.shade.setX(a,ink);
        geometry.attributes.shade.setX(a+1,.59*ink);
      }
    }
    geometry.attributes.position.needsUpdate=true;
    geometry.attributes.shade.needsUpdate=true;
  };
}

function stDarkChargedBlade(blade){
  // Draw a sleeve from the authored outline, leaving the original blade face visible.
  const rows=41,columns=4,positions=new Float32Array(2*rows*columns*3);
  const colors=new Float32Array(2*rows*columns*4),indices=[];
  for(let side=0;side<2;side++)for(let i=0;i<rows-1;i++)for(let j=0;j<columns-1;j++){
    const a=(side*rows+i)*columns+j,b=a+columns;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,4));
  geometry.setIndex(indices);
  const material=stScyInk();material.color.setHex(0xffffff);
  const shell=new THREE.Mesh(geometry,material);
  shell.name='Quick Dash second blade outline';shell.frustumCulled=false;shell.renderOrder=10;blade.add(shell);
  const widths=[-.30,.15,.76,1.08],alphas=[.32,.97,.90,0];
  return (t,strength,flash)=>{
    shell.visible=!!stScyLines&&strength>.01;
    if(!shell.visible)return;
    for(let side=0;side<2;side++)for(let i=0;i<rows;i++){
      const u=i/(rows-1),line=side?stScyLines.edge:stScyLines.spine;
      const [x,y]=line[i],a=line[Math.max(0,i-1)],b=line[Math.min(rows-1,i+1)];
      const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
      const sign=side?-1:1,tip=1-stDarkEase(.77,1,u);
      const flow=.55*Math.sin(u*27-t*16)+.30*Math.sin(u*62-t*25);
      const width=(.072+.105*strength+.035*flow)*stDarkEase(0,.12,u)*tip;
      const seam=.08+.12*flash+.06*stDarkEase(.28,.78,flow);
      for(let j=0;j<columns;j++){
        const index=(side*rows+i)*columns+j,p=index*3,c=index*4,d=widths[j]*width;
        positions[p]=x-sign*dy*d/length;
        positions[p+1]=y+sign*dx*d/length;
        positions[p+2]=j===0?.036:.013;
        const tint=j===2?seam:.008+(j===1?.024*flash:0);
        colors[c]=tint*.84;colors[c+1]=tint*.77;colors[c+2]=tint;
        colors[c+3]=alphas[j]*strength*stDarkEase(0,.095,u)*Math.sqrt(tip);
      }
    }
    geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;
  };
}

function stDarkChargeScythe(root,blade,launch,impact,spendAt){
  const count=144,burstCount=36,traces=3;
  const sparks=new THREE.InstancedMesh(new THREE.OctahedronGeometry(1,0),
    new THREE.MeshBasicMaterial({transparent:true,opacity:.97,depthWrite:false,toneMapped:false}),count*traces+burstCount);
  const shades=[0x09090c,0x181720,0x34313b,0x76717e].map(color=>new THREE.Color(color));
  sparks.setColorAt(0,shades[0]);
  sparks.name='Quick Dash scythe infusion';sparks.frustumCulled=false;sparks.count=0;sparks.renderOrder=9;
  root.add(sparks);
  const particles=Array.from({length:count},(_,i)=>{
    const seed=i*.618034%1,lane=i%3;
    return {seed,lane,born:launch-.014+i/count*.282,hit:impact-.025+seed*.025,
      angle:lane*2.094+i/count*3.80+(seed-.5)*.46,seat:.09+((i*.75488)%1)*.89};
  });
  const focus=new THREE.Group();
  root.add(focus);
  const outline=stDarkChargedBlade(blade);
  const starShape=new THREE.Shape();
  starShape.moveTo(0,1);
  starShape.quadraticCurveTo(.10,.13,.83,0);
  starShape.quadraticCurveTo(.10,-.13,0,-1);
  starShape.quadraticCurveTo(-.10,-.13,-.83,0);
  starShape.quadraticCurveTo(-.10,.13,0,1);
  starShape.closePath();
  const star=new THREE.Mesh(new THREE.ShapeGeometry(starShape),new THREE.MeshBasicMaterial({
    color:new THREE.Color(2.8,2.8,2.8),side:THREE.DoubleSide,transparent:true,depthWrite:false,toneMapped:false
  }));
  star.name='Quick Dash blade wink';star.renderOrder=13;focus.add(star);
  const halo=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({
    uniforms:{intensity:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,
    vertexShader:`varying vec2 v; void main(){v=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform float intensity; varying vec2 v; void main(){
      float r=length(v);float glow=exp(-9.0*r*r)*(1.0-smoothstep(.60,1.0,r));
      gl_FragColor=vec4(vec3(1.15,1.15,1.18),glow*intensity);
    }`
  }));
  halo.renderOrder=12;focus.add(halo);
  const sweepPoints=new THREE.BufferAttribute(new Float32Array(12*3),3);
  const sweepGeometry=new THREE.BufferGeometry();sweepGeometry.setAttribute('position',sweepPoints);
  const sweep=new THREE.Line(sweepGeometry,new THREE.LineBasicMaterial({
    color:new THREE.Color(1.55,1.55,1.62),transparent:true,depthWrite:false,toneMapped:false
  }));
  sweep.frustumCulled=false;sweep.renderOrder=12;root.add(sweep);
  const point=new THREE.Vector3(),trail=new THREE.Vector3(),flow=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  const viewPoint=new THREE.Vector3(),rootInverse=new THREE.Matrix4();
  const transform=new THREE.Matrix4(),piece=new THREE.Object3D();
  const lanes=Array.from({length:3},(_,lane)=>({lane,seed:.65,angle:lane*Math.PI*2/3,seat:.20+lane*.27}));
  const strokeSteps=22,strokePositions=new Float32Array(lanes.length*strokeSteps*6);
  const strokeColors=new Float32Array(lanes.length*strokeSteps*8),strokeIndices=[];
  for(let lane=0;lane<lanes.length;lane++)for(let i=0;i<strokeSteps-1;i++){
    const a=2*(lane*strokeSteps+i);
    strokeIndices.push(a,a+1,a+2,a+1,a+3,a+2);
  }
  const strokeGeometry=new THREE.BufferGeometry();
  strokeGeometry.setAttribute('position',new THREE.BufferAttribute(strokePositions,3));
  strokeGeometry.setAttribute('color',new THREE.BufferAttribute(strokeColors,4));
  strokeGeometry.setIndex(strokeIndices);
  const strokes=new THREE.Mesh(strokeGeometry,stScyInk());
  strokes.name='Quick Dash spiral streams';strokes.frustumCulled=false;strokes.renderOrder=8;root.add(strokes);
  const contact=(u,z=0)=>{
    const edge=stScyLines.edge,index=u*(edge.length-1),i=Math.floor(index),mix=index-i;
    const [x,y]=edge[i],next=edge[Math.min(i+1,edge.length-1)];
    return point.set(lerp(x,next[0],mix),lerp(y,next[1],mix),z).applyMatrix4(transform);
  };
  const orbit=(p,u,out)=>{
    const line=stScyLines.edge,[x,y]=line[Math.round(p.seat*(line.length-1))];
    const settle=u*u,r=(1-u**2.35)*(.88+p.seed*.26+p.lane*.15),a=p.angle+u*(6.9+p.lane*.45);
    const cross=Math.sin(a)*r;
    const height=lerp(1.14,y,settle)-r*(.18+.25*Math.abs(Math.sin(a)));
    return out.set(lerp(.48,x,settle)+Math.cos(a)*r*1.14,height,
      cross*(.45-p.lane*.38)+r*(p.seed-.5)*.22).applyMatrix4(transform);
  };
  return t=>{
    const age=t-impact,flash=stDarkEase(0,.019,age)*(1-stDarkEase(.052,.178,age));
    const charge=stDarkEase(impact,impact+.035,t);
    const afterglow=1-.22*stDarkEase(.075,.31,age);
    outline(t,charge*afterglow*(1-stDarkEase(spendAt,spendAt+.09,t)),flash);
    star.visible=false;sweep.visible=false;halo.visible=false;strokes.visible=false;
    let active=0;
    if(stScyLines&&t>=launch&&age<.35){
      blade.updateWorldMatrix(true,false);
      rootInverse.copy(root.matrixWorld).invert();
      transform.multiplyMatrices(rootInverse,blade.matrixWorld);
      focus.position.copy(contact(.71));
      cam.getWorldPosition(viewPoint).applyMatrix4(rootInverse);
      focus.position.addScaledVector(viewPoint.sub(focus.position).normalize(),.09);
      focus.quaternion.setFromUnitVectors(flow.set(0,0,1),viewPoint);
      const glint=stDarkEase(0,.065,age);
      sweep.visible=glint>0&&glint<1;
      if(sweep.visible){
        const head=.13+.84*glint;
        for(let i=0;i<sweepPoints.count;i++){
          contact(Math.max(.07,head-.23*(1-i/(sweepPoints.count-1))));
          point.addScaledVector(viewPoint,.058);
          sweepPoints.setXYZ(i,point.x,point.y,point.z);
        }
        sweepPoints.needsUpdate=true;sweep.material.opacity=.63*Math.sin(Math.PI*glint);
      }
      star.visible=flash>.01;
      star.material.opacity=flash;
      star.rotation.z=-.42+.62*stDarkEase(0,.120,age);
      const size=(.17+.41*stDarkEase(0,.029,age))*(1-.29*stDarkEase(.046,.15,age));
      star.scale.set(size,size*(1-.22*stDarkEase(.055,.16,age)),1);
      halo.visible=star.visible;halo.scale.setScalar(.50+.49*stDarkEase(0,.10,age));
      halo.material.uniforms.intensity.value=flash*.43;
      const drawing=stDarkEase(launch+.025,launch+.12,t)*(1-stDarkEase(impact-.026,impact+.008,t));
      strokes.visible=drawing>.01;
      if(strokes.visible){
        const head=clamp((t-launch)/(impact-launch),0,1);
        for(const lane of lanes)for(let i=0;i<strokeSteps;i++){
          const u=i/(strokeSteps-1),progress=clamp(head-(1-u)*(.27+lane.lane*.02),0,1);
          orbit(lane,progress,point);
          const taper=Math.sin(Math.PI*u),width=(.013+.037*taper)*(1-progress*.52);
          const index=lane.lane*strokeSteps+i,a=index*6,c=index*8;
          strokePositions.set([point.x,point.y-width,point.z,point.x,point.y+width,point.z],a);
          strokeColors[c+3]=drawing*taper*.92;strokeColors[c+7]=drawing*taper*.32;
        }
        strokeGeometry.attributes.position.needsUpdate=true;strokeGeometry.attributes.color.needsUpdate=true;
      }
      for(let i=0;i<particles.length;i++){
        const p=particles[i],{born,seed,hit}=p;
        const u=(t-born)/(hit-born);
        if(u<0||u>=1)continue;
        // As the particles gather, leave individual flecks at the blade.
        const gather=stDarkEase(.52,.82,u);
        for(let k=0;k<traces;k++){
          const step=u-k*.048;
          if(step<0)continue;
          orbit(p,step,piece.position);
          orbit(p,Math.min(1,step+.025),trail);
          piece.quaternion.setFromUnitVectors(up,flow.copy(trail).sub(piece.position).normalize());
          const width=(.023+seed*.034)*stDarkEase(0,.17,step)*(1-stDarkEase(.92,1,step))*
            (1-.28*k)*(1-gather*(k?1:.72));
          piece.scale.set(width,width*(k?2.7:lerp(3.6,1.1,gather)),width*.53);
          piece.updateMatrix();sparks.setMatrixAt(active,piece.matrix);
          sparks.setColorAt(active++,shades[gather>.35?0:k?1+k%2:i%11===0?3:i%2]);
        }
      }
      for(let i=0;i<burstCount;i++){
        const seed=i*.618034%1,angle=i*2.39996,life=.16+seed*.16,elapsed=age-(i%4)*.011;
        if(elapsed<0||elapsed>=life)continue;
        const u=elapsed/life,drift=1-(1-u)**2;
        piece.position.copy(contact(.13+seed*.79));
        piece.position.x+=Math.cos(angle)*drift*(.23+.31*seed);
        piece.position.y+=drift*(.48+.48*seed);
        piece.position.z+=Math.sin(angle)*drift*.45-.22*drift;
        piece.rotation.set(angle+elapsed*8,angle*.3,Math.sin(angle)*.86);
        const width=(.025+.047*seed)*(1-u)**1.1;
        piece.scale.set(width,width*(2.5-u),width*.56);
        piece.updateMatrix();sparks.setMatrixAt(active,piece.matrix);
        sparks.setColorAt(active++,shades[i%7===0?3:i%3]);
      }
    }
    sparks.count=active;sparks.instanceMatrix.needsUpdate=true;sparks.instanceColor.needsUpdate=true;
  };
}

function stDarkQuickDash(root,caster,look,live){
  const ease=stDarkEase,launch=.22,arrival=.54,impact=.66,range=4;
  const slashStart=live?Infinity:1.02,spendAt=live?Infinity:1.36;
  const slashRoot=new THREE.Group();root.add(slashRoot);
  const scythe=stCreateScythePreview(slashRoot,{wrap:'C',mode:'ba',manual:true,followUp:true,reach:8.1});
  scythe.pivot.name='Quick Dash scythe';
  const distanceAt=t=>range*ease(launch,arrival,t);
  const pointAt=(distance,out)=>live?live.pointAt(distance/range,out):out.set(0,0,clamp(distance,0,range));
  const nearTail=stDarkWake(root,distanceAt,(d,out)=>out.set(-.27+.29*d/range,0,d-.22),
    d=>-.24-.46*d/range,launch,arrival,.67,.56);
  const farTail=stDarkWake(root,distanceAt,(d,out)=>out.set(.34-.51*d/range,0,d-.38),
    d=>-.68+.13*Math.sin(d/range*Math.PI),launch+.024,arrival,.38,.50);
  const matter=stDarkMatter(root,'Quick Dash dark matter',[
    {at:launch,span:.035,count:30,spread:.92,lift:.58,height:.23,back:.61},
    {at:launch+.04,span:.24,count:29,spread:.48,lift:.36,height:.72,back:.78},
    {at:arrival-.02,span:.04,count:11,spread:.66,lift:.29,height:.22,back:.21}
  ],(t,out)=>pointAt(distanceAt(t),out),.71);
  const echoes=[.272,.343,.419].map((stamp,i)=>({
    stamp,actor:stDarkShiftStudent(root,look,'Shift Dash afterimage '+(i+1)),
    ink:new THREE.MeshBasicMaterial({color:0x14131a,toneMapped:false,transparent:true,depthWrite:false,opacity:0}),
    ready:false
  }));
  const infuse=stDarkChargeScythe(root,scythe.blade,launch,impact,spendAt);
  const launchInk=new THREE.Group();
  launchInk.position.y=.055;launchInk.rotation.x=-Math.PI/2;root.add(launchInk);
  const pushOff=stDarkPressure(launchInk);
  for(const echo of echoes)echo.actor.ring.visible=false;

  function poseScythe(pivot,t){
    const lag=distanceAt(t)-distanceAt(t-.065);
    const carry=ease(launch,arrival,t)*(1-ease(arrival,impact+.12,t));
    const empowered=ease(impact-.012,impact+.038,t);
    const snap=empowered*(1-ease(impact+.05,impact+.18,t));
    const gather=ease(arrival,impact-.025,t)*(1-ease(impact-.015,impact+.025,t));
    pivot.position.set(-1.45+.38*carry-.23*snap+.07*gather,
      .09+.052*Math.sin(t*4)+.16*snap-.045*gather,distanceAt(t)-.76*lag+.19*snap-.055*gather);
    pivot.rotation.set(.36*lag,.10*Math.sin(t*6)-.17*empowered+.14*carry,-.13-.39*lag+.25*snap-.075*gather);
    pivot.scale.setScalar(1+.10*empowered+.06*snap);
  }
  const sample=new THREE.Object3D(),bladePoint=new THREE.Vector3();
  const bladeAt=(t,out)=>{
    poseScythe(sample,t);sample.updateMatrix();
    const edge=stScyLines?.edge,point=edge?.[Math.floor(edge.length*.65)];
    return out.set(point?.[0]??.66,(point?.[1]??1.90)-.24,0).multiplyScalar(scythe.blade.scale.x).applyMatrix4(sample.matrix);
  };
  const embers=stDarkWakeShards(root,t=>t,bladeAt,t=>bladeAt(t,bladePoint).y-1.08,launch+.025,arrival+.025);

  function pose(actor,t){
    const lean=ease(.15,launch,t)*(1-ease(arrival-.02,arrival+.19,t));
    const load=ease(.08,.17,t)*(1-ease(.17,launch+.025,t));
    const catchStep=ease(arrival-.035,arrival+.03,t)*(1-ease(arrival+.04,arrival+.20,t));
    const stride=Math.cos(clamp((t-launch)/(arrival-launch),0,1)*Math.PI*1.38);
    if(actor!==caster||!live)pointAt(distanceAt(t),actor.g.position).y+=.11*lean-.045*catchStep;
    stDarkPose(actor,{back:.52*lean-.13*load-.16*catchStep,roll:-.13*lean+.14*catchStep,
      drop:.10*lean+.13*load+.13*catchStep,arms:.23*lean+.28*catchStep,step:.78*lean*stride});
    actor.armR.rotation.x+=.50*lean*stride;
    actor.armL.rotation.x-=.57*lean*stride;
    if(actor.rig)rigSync(actor,0);
  }

  return t=>{
    pose(caster,t);
    pointAt(distanceAt(t),slashRoot.position);
    poseScythe(scythe.pivot,t);
    scythe.pivot.position.z-=distanceAt(t);
    const age=t-impact;
    const buff=1-ease(spendAt,spendAt+.09,t);
    const charge=ease(0,.028,age)*(.35+.77*(1-ease(.09,.34,age)))*buff;
    scythe.pivot.scale.setScalar(lerp(1,scythe.pivot.scale.x,buff));
    const slashClock=live?0:2+t-slashStart;
    scythe.update(t,charge,0,slashClock);
    if(t>=slashStart){
      const swing=slashRoot.userData.baState(slashClock);
      caster.b.rotation.y=swing.tw*ease(slashStart,slashStart+.12,t)*(1-ease(1.55,1.83,t));
      if(caster.rig)rigSync(caster,0);
    }
    slashRoot.visible=!live?.spent;
    pushOff(.32+.77*ease(launch,launch+.17,t),.54*ease(launch-.012,launch+.025,t)*(1-ease(launch+.037,launch+.19,t)),t*9);
    nearTail(t);farTail(t);matter(t);embers(t);infuse(t);
    for(const echo of echoes){
      if(!echo.ready&&echo.actor.fileModel){
        echo.actor.fileModel.traverse(mesh=>{
          if(!mesh.isMesh)return;
          mesh.material=echo.ink;
          mesh.castShadow=false;
          mesh.receiveShadow=false;
        });
        echo.ready=true;
      }
      const age=t-echo.stamp;
      const opacity=.78*ease(.012,.043,age)*(1-ease(.067,.23,age));
      echo.actor.g.visible=echo.ready&&opacity>.02;
      echo.ink.opacity=opacity;
      if(echo.actor.g.visible)pose(echo.actor,echo.stamp);
    }
  };
}

function stDarkHoldDash(root,caster,live){
  const ease=stDarkEase,begin=.16,launch=begin+.50,covered=launch+.032,formed=launch+.105,arrival=formed+2;
  const rollStart=launch-.13,acceleration=.18,braking=.34;
  const route=[[0,0],[.06,3.6],[2.65,6.9],[2.1,10],[-1.65,13.3]]
    .map(([x,z])=>new THREE.Vector3(x,0,z));
  // This curve demonstrates steering for the Studio camera.
  const path=new THREE.CatmullRomCurve3(route),length=path.getLength();
  const pointAt=(distance,out)=>live?live.pointAt(clamp(distance/length,0,1),out):path.getPointAt(clamp(distance/length,0,1),out);
  // Keep acceleration independent of the time spent in ball form.
  const duration=arrival-rollStart,travelTime=duration-(acceleration+braking)*.5;
  const speed=length/travelTime;
  const distanceAt=t=>{
    const elapsed=clamp(t-rollStart,0,duration),remaining=duration-elapsed;
    if(elapsed<acceleration)return speed*elapsed*elapsed/(2*acceleration);
    if(remaining<braking)return length-speed*remaining*remaining/(2*braking);
    return speed*(elapsed-acceleration*.5);
  };
  const wake=stDarkWake(root,distanceAt,pointAt,()=>0,launch,arrival,.64);
  const wakeShards=stDarkWakeShards(root,distanceAt,pointAt,()=>0,launch,arrival);
  const ball=stDarkOrbCore();
  ball.name='Shift Dash shadow ball';root.add(ball);
  const weave=stDarkOrbWeave(root,pointAt,()=>0);
  const shroud=stDarkShiftShroud(root);
  const cloakTrails=stDarkShiftCloakTrails(root);
  const scythe=stCreateScythePreview(root,{wrap:'C',manual:true,scale:1.43});
  const bladePivot=scythe.pivot;bladePivot.name='Shift Dash scythe';
  const bodyTint=live?.bodyTint??stDarkBodyTint(caster,true);
  const splash=stDarkMatter(root,'Long Dash dark splash',[
    {at:arrival-.01,span:.07,count:52,spread:1.68,lift:1.02,height:.62},
    {at:arrival+.025,span:.08,count:23,spread:1.03,lift:1.57,height:1.00},
    {at:arrival+.15,span:.065,count:27,spread:1.48,lift:.41,height:.23}
  ],(_t,out)=>out.copy(route.at(-1)));
  const scytheMatter=stDarkMatter(root,'Hold Dash scythe embers',[
    {at:covered-.088,span:.075,count:19,spread:.62,lift:.42,height:1.12,back:.30},
    {at:arrival+.135,span:.12,count:23,spread:.79,lift:.66,height:1.30}
  ],(t,out)=>pointAt(distanceAt(t),out),.84);
  const entry=new THREE.Group(),exit=new THREE.Group();
  entry.position.y=exit.position.y=.06;entry.rotation.x=exit.rotation.x=-Math.PI/2;
  exit.position.add(route.at(-1));root.add(entry,exit);
  const inkIn=stDarkPressure(entry),inkOut=stDarkPressure(exit);
  const splinters=new THREE.Group();
  splinters.name='Long Dash splash ribbons';splinters.position.copy(route.at(-1));root.add(splinters);
  const ribbons=Array.from({length:6},(_,i)=>{
    const jet=new THREE.Group(),angle=i*2.39996,tip=.67+(i%3)*.20;
    jet.rotation.y=angle;jet.position.y=.58+(i%2)*.27;splinters.add(jet);
    const core=stDarkCut(jet,[[.15,-.04],[.46,tip*.08],[1.35,tip]],.12,0x15121e,10);
    const rim=stDarkCut(jet,[[.18,.02],[.54,tip*.18],[1.51,tip*.91]],.032,0x4a435b,11);
    return age=>{
      const elapsed=age-.023-i*.007,flare=ease(0,.13,elapsed);
      jet.scale.set(.5+.75*flare,.47+.54*flare,1);
      jet.rotation.y=angle+flare*.23;
      core(elapsed,.24+(i%3)*.026,.40);
      rim(elapsed-.012,.18+(i%3)*.018,.37);
    };
  });
  const at=new THREE.Vector3(),ahead=new THREE.Vector3(),behind=new THREE.Vector3(),scytheOffset=new THREE.Vector3();
  const up=new THREE.Vector3(0,1,0);
  return t=>{
    const distance=distanceAt(t),age=t-arrival;
    const charge=ease(begin,launch,t);
    const morph=ease(rollStart+.035,formed,t);
    const unveil=ease(covered,formed,t);
    const form=morph*(1-ease(0,.065,age));
    pointAt(distance,at);pointAt(distance+.1,ahead);pointAt(distance-.1,behind);ahead.sub(behind);
    const yaw=Math.atan2(ahead.x,ahead.z);
    const brace=charge*(1-unveil)*(age<0?1:0);
    const push=ease(rollStart,covered,t)*(1-unveil);
    const spring=ease(.03,.081,age)*(1-ease(.106,.224,age));
    const plant=ease(.129,.238,age)*(1-ease(.25,.52,age));
    if(!live){caster.g.position.copy(at);caster.g.rotation.y=yaw;caster.g.position.y=.36*spring;caster.g.visible=t<formed||age>=.045;}
    else caster.b.visible=t<formed||age>=.045;
    const dark=ease(begin+.23,launch-.033,t)*(1-ease(.05,.18,age));
    const bodyCoverage=age<0?1-ease(launch-.021,formed,t):1;
    bodyTint(dark,bodyCoverage);
    caster.ring.material.opacity=.7*(1-ease(rollStart-.04,covered,t)+ease(.06,.20,age));
    stDarkPose(caster,{back:.25*brace+.31*push-.24*spring+.46*plant,roll:.08*brace+.20*spring-.16*plant,
      drop:.06*brace+.20*plant,arms:.54*brace+.76*spring+.42*plant,step:.18*brace+.34*push+.68*spring+.37*plant});
    if(spring||plant){
      caster.armR.rotation.z-=.48*spring+.17*plant;
      caster.armL.rotation.z+=.80*spring+.18*plant;
      if(caster.rig)rigSync(caster,0);
    }

    const core=ease(.14,.96,form),travel=ease(rollStart,rollStart+acceleration,t)*(1-ease(arrival-.11,arrival,t));
    ball.visible=core>.02;
    ball.position.copy(at).addScaledVector(ahead.normalize(),.10*travel);
    ball.position.y=at.y+1.07+.065*Math.sin(t*16)*(1-travel);
    ball.rotation.y=yaw;
    ball.scale.set((.52-.07*travel)*core,.57*core,(.51+.15*travel)*core);
    const threads=.82*ease(covered,formed+.21,t)*(1-ease(-.02,.15,age));
    weave(t,at,distance,threads,morph,0,0,0);
    const cloakFlow=ease(launch-.007,formed+.060,t);
    const orbitAlpha=ease(begin+.13,begin+.23,t)*(1-ease(formed+.075,formed+.34,t));
    cloakTrails(t,at,yaw,morph,cloakFlow,.83*orbitAlpha);
    if(age<0)shroud(t,at,yaw,0,0,1);
    else {
      const peel=ease(.049,.18,age);
      shroud(t,at,yaw,lerp(1.38,-.1,peel),.92*ease(-.025,.035,age)*(1-peel),ease(0,.053,age));
    }

    const fuse=ease(begin+.25,covered,t),returning=ease(.093,.74,age);
    const spiral=age<0?fuse*Math.PI*.90:(1-returning)*Math.PI*.76;
    bladePivot.visible=t<covered||returning>.03;
    const orbit=age<0?1-.87*fuse:.18+.82*returning;
    scytheOffset.set(-1.24*Math.cos(spiral)*orbit,.18+.049*Math.sin(t*4)+.63*(age<0?fuse:1-returning),
      -.97*Math.sin(spiral)*orbit).applyAxisAngle(up,yaw);
    bladePivot.position.copy(at).add(scytheOffset);
    bladePivot.rotation.set(-.15*brace+.65*spiral,yaw+.21*Math.sin(t*6)-spiral,-.16-.43*brace+.40*plant);
    bladePivot.scale.setScalar(age<0?1-.97*fuse:returning);
    if(bladePivot.visible)scythe.update(t,.35*(age<0?fuse:1-returning),.28*orbit);

    inkIn(1.40-.76*charge,.28*charge*(1-ease(launch,formed,t)),t*4);
    inkOut(.37+1.37*ease(.04,.31,age),.83*ease(.035,.098,age)*(1-ease(.11,.32,age)),t*6);
    for(const ribbon of ribbons)ribbon(age);
    wake(t);wakeShards(t);splash(t);scytheMatter(t);
  };
}

FXCODE.studio_darkness_shift=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  if(args.hold&&!MODELS.ready.has('dark_scythe'))return;
  const root=new THREE.Group();root.name='Darkness Shift preview';anchor.obj.add(root);
  const look={...getLook(NET.myId),ws:-1,wn:0};
  const caster=stDarkShiftStudent(root,look,'Shift Dash caster',lookTint(look));
  const update=args.hold?stDarkHoldDash(root,caster):stDarkQuickDash(root,caster,look);
  instance.updateDarknessShift=()=>update(instance.t);
  if(args.hold)instance.darknessShiftFocus=out=>{
    out.copy(caster.g.position);
    out.y=1.1;
    return root.localToWorld(out);
  };
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{
    instance.updateDarknessShift=null;instance.darknessShiftFocus=null;disposeTree(root);root.removeFromParent();
  });
  instance.updateDarknessShift();
};
