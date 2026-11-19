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
  const bands=6,steps=25;
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
      const side=band%2?1:-1,lane=(band>>1)/2;
      for(let i=0;i<steps;i++){
        const u=i/(steps-1),a=(band*steps+i)*2;
        const curl=(u*3.5+t*8+lane*1.3)*side;
        const x=side*(.38+.25*lane)*(1-.57*flow*u)+Math.sin(curl)*(.13+.29*gather)*u;
        const y=lerp(1.64-.91*u-.22*lane,1.06+Math.cos(curl)*.37*u,flow);
        const z=lerp(-.13-.71*u,.22-2.53*u,flow)-.17*lane;
        const taper=Math.pow(Math.sin(Math.PI*u),.66);
        const half=(.09+.11*(1-lane))*taper*(1-.40*flow)*(1+.21*Math.sin(curl*2));
        const ink=strength*taper*(.78-.15*lane);
        geometry.attributes.position.setXYZ(a,x+half*.48*side,y+half,z);
        geometry.attributes.position.setXYZ(a+1,x-half*.48*side,y-half,z);
        geometry.attributes.shade.setX(a,ink);
        geometry.attributes.shade.setX(a+1,.59*ink);
      }
    }
    geometry.attributes.position.needsUpdate=true;
    geometry.attributes.shade.needsUpdate=true;
  };
}

function stDarkShiftBladeFlame(scythe){
  // Follow the same exported spine as the scythe's idle and BA previews.
  const rows=41,steps=6,geometry=new THREE.BufferGeometry();
  const positions=new Float32Array(rows*steps*3),colors=new Float32Array(rows*steps*4),indices=[];
  for(let i=0;i<rows-1;i++)for(let j=0;j<steps-1;j++){
    const a=i*steps+j,b=a+steps;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,4));
  geometry.setIndex(indices);
  const flame=new THREE.Mesh(geometry,stScyInk());
  flame.name='Shift scythe spine flame';flame.frustumCulled=false;flame.renderOrder=8;
  scythe.add(flame);
  return (t,burn,drag,opacity=1)=>{
    const spine=stScyLines?.spine,edge=stScyLines?.edge;
    flame.visible=!!spine&&opacity>.01;
    if(!flame.visible)return;
    for(let i=0;i<rows;i++){
      const u=i/(rows-1),[x,y]=spine[i],cut=edge[i];
      const flicker=Math.max(0,.49*Math.sin(u*33-t*17)+.30*Math.sin(u*59+t*9)+.26);
      const taper=Math.sin(Math.PI*u)**.55;
      const height=(.042+flicker*(.12+.19*burn))*taper;
      const dx=x-cut[0],dy=y-cut[1],width=Math.hypot(dx,dy)||1;
      for(let j=0;j<steps;j++){
        const v=j/(steps-1),rise=height*v,bend=rise*v;
        const index=i*steps+j,a=index*3;
        positions[a]=x+rise*dx/width+bend*(.56+.44*Math.sin(u*17-t*12));
        positions[a+1]=y+rise*dy/width;
        positions[a+2]=.008+bend*(.35*Math.sin(u*13-t*10)-2.1*drag);
        colors[index*4+3]=opacity*(1-v)**.56;
      }
    }
    geometry.attributes.position.needsUpdate=true;
    geometry.attributes.color.needsUpdate=true;
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
      const sign=side?-1:1,tip=stDarkEase(.80,1,u);
      const flow=.55*Math.sin(u*27-t*16)+.30*Math.sin(u*62-t*25);
      const width=(.072+.105*strength+.055*tip+.035*flow)*stDarkEase(0,.12,u);
      const seam=.08+.12*flash+.06*stDarkEase(.28,.78,flow);
      for(let j=0;j<columns;j++){
        const index=(side*rows+i)*columns+j,p=index*3,c=index*4,d=widths[j]*width;
        positions[p]=x+(-sign*dy+dx*tip*.85)*d/length;
        positions[p+1]=y+(sign*dx+dy*tip*.85)*d/length;
        positions[p+2]=j===0?.036:.013+.045*tip;
        const tint=j===2?seam:.008+(j===1?.024*flash:0);
        colors[c]=tint*.84;colors[c+1]=tint*.77;colors[c+2]=tint;
        colors[c+3]=alphas[j]*strength*stDarkEase(0,.095,u);
      }
    }
    geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;
  };
}

function stDarkChargeScythe(root,blade,launch,impact){
  const count=144,burstCount=36,traces=3;
  const sparks=new THREE.InstancedMesh(new THREE.OctahedronGeometry(1,0),
    new THREE.MeshBasicMaterial({transparent:true,opacity:.97,depthWrite:false,toneMapped:false}),count*traces+burstCount);
  const shades=[0x09090c,0x181720,0x34313b,0x76717e].map(color=>new THREE.Color(color));
  sparks.setColorAt(0,shades[0]);
  sparks.name='Quick Dash scythe infusion';sparks.frustumCulled=false;sparks.count=0;sparks.renderOrder=9;
  root.add(sparks);
  const particles=Array.from({length:count},(_,i)=>{
    const seed=i*.618034%1,lane=i%3;
    return {seed,lane,born:launch-.014+i/count*.282,hit:impact-.077+seed*.079,
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
    return out.set(lerp(.48,x,settle)+Math.cos(a)*r*1.14,lerp(1.99,y,settle)+cross*(.63+p.lane*.12),
      cross*(.45-p.lane*.38)+r*(p.seed-.5)*.22).applyMatrix4(transform);
  };
  return t=>{
    const age=t-impact,flash=stDarkEase(0,.019,age)*(1-stDarkEase(.052,.178,age));
    const charge=stDarkEase(launch+.06,impact+.027,t),afterglow=1-.22*stDarkEase(.075,.31,age);
    outline(t,charge*afterglow,flash);
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
      const glint=stDarkEase(-.077,.03,age);
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
      const drawing=stDarkEase(launch+.025,launch+.12,t)*(1-stDarkEase(impact-.055,impact,t));
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
        for(let k=0;k<traces;k++){
          const step=u-k*.048;
          if(step<0)continue;
          orbit(p,step,piece.position);
          orbit(p,Math.min(1,step+.025),trail);
          piece.quaternion.setFromUnitVectors(up,flow.copy(trail).sub(piece.position).normalize());
          const width=(.023+seed*.034)*stDarkEase(0,.17,step)*(1-stDarkEase(.92,1,step))*(1-.28*k);
          piece.scale.set(width,width*(k?2.7:3.6),width*.53);
          piece.updateMatrix();sparks.setMatrixAt(active,piece.matrix);
          sparks.setColorAt(active++,shades[k?1+k%2:i%11===0?3:i%2]);
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

function stDarkQuickDash(root,caster,look){
  const ease=stDarkEase,launch=.22,arrival=.54,impact=.66,range=4;
  const scythe=stCreateScythePreview(root,{wrap:'C',manual:true});
  scythe.pivot.name='Quick Dash scythe';
  const distanceAt=t=>range*ease(launch,arrival,t);
  const pointAt=(distance,out)=>out.set(0,0,clamp(distance,0,range));
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
  const infuse=stDarkChargeScythe(root,scythe.blade,launch,impact);
  const launchInk=new THREE.Group();
  launchInk.position.y=.055;launchInk.rotation.x=-Math.PI/2;root.add(launchInk);
  const pushOff=stDarkPressure(launchInk);
  for(const echo of echoes)echo.actor.ring.visible=false;

  function poseScythe(pivot,t){
    const lag=distanceAt(t)-distanceAt(t-.065);
    const carry=ease(launch,arrival,t)*(1-ease(arrival,impact+.12,t));
    const empowered=ease(impact-.018,impact+.047,t);
    const snap=empowered*(1-ease(impact+.05,impact+.18,t));
    pivot.position.set(-1.45+.38*carry-.23*snap,.09+.052*Math.sin(t*4)+.16*snap,distanceAt(t)-.76*lag+.19*snap);
    pivot.rotation.set(.36*lag,.10*Math.sin(t*6)-.17*empowered+.14*carry,-.13-.39*lag+.25*snap);
    pivot.scale.setScalar(1+.10*empowered+.06*snap);
    return lag;
  }
  const sample=new THREE.Object3D(),bladePoint=new THREE.Vector3();
  const bladeAt=(t,out)=>{
    poseScythe(sample,t);sample.updateMatrix();
    const spine=stScyLines?.spine,point=spine?.[Math.floor(spine.length*.65)];
    return out.set(point?.[0]??.66,point?.[1]??1.90,0).multiplyScalar(scythe.blade.scale.x).applyMatrix4(sample.matrix);
  };
  const embers=stDarkWakeShards(root,t=>t,bladeAt,t=>bladeAt(t,bladePoint).y-1.08,launch+.025,arrival+.025);

  function pose(actor,t){
    const lean=ease(.15,launch,t)*(1-ease(arrival-.02,arrival+.19,t));
    const load=ease(.08,.17,t)*(1-ease(.17,launch+.025,t));
    const catchStep=ease(arrival-.035,arrival+.03,t)*(1-ease(arrival+.04,arrival+.20,t));
    const stride=Math.cos(clamp((t-launch)/(arrival-launch),0,1)*Math.PI*1.38);
    actor.g.position.set(0,.11*lean-.045*catchStep,distanceAt(t));
    stDarkPose(actor,{back:.52*lean-.13*load-.16*catchStep,roll:-.13*lean+.14*catchStep,
      drop:.10*lean+.13*load+.13*catchStep,arms:.23*lean+.28*catchStep,step:.78*lean*stride});
    actor.armR.rotation.x+=.50*lean*stride;
    actor.armL.rotation.x-=.57*lean*stride;
    if(actor.rig)rigSync(actor,0);
  }

  return t=>{
    pose(caster,t);
    const lag=poseScythe(scythe.pivot,t);
    const charge=.35*ease(launch,impact,t)+.77*ease(impact-.10,impact+.028,t)*(1-ease(impact+.09,impact+.34,t));
    scythe.update(t,charge,lag*2.1);
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

function stDarkHoldDash(root,caster,scythe){
  const ease=stDarkEase,begin=.16,launch=begin+.50,covered=launch+.045,formed=launch+.14,arrival=formed+2;
  const rollStart=launch-.13,acceleration=.22,braking=.34;
  const route=[[0,0],[.06,3.6],[2.65,6.9],[2.1,10],[-1.65,13.3]]
    .map(([x,z])=>new THREE.Vector3(x,0,z));
  // This curve demonstrates steering for the Studio camera.
  const path=new THREE.CatmullRomCurve3(route),length=path.getLength();
  const pointAt=(distance,out)=>path.getPointAt(clamp(distance/length,0,1),out);
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
  const flame=stDarkShiftBladeFlame(scythe);
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
    const charge=ease(begin,launch,t),seal=ease(begin+.14,covered,t);
    const morph=ease(rollStart+.035,formed,t);
    const unveil=ease(covered,formed,t);
    const form=morph*(1-ease(0,.065,age));
    pointAt(distance,at);pointAt(distance+.1,ahead);pointAt(distance-.1,behind);ahead.sub(behind);
    const yaw=Math.atan2(ahead.x,ahead.z);
    const brace=t<covered?charge:0;
    const push=ease(rollStart,covered,t)*(1-unveil);
    const spring=ease(.03,.081,age)*(1-ease(.106,.224,age));
    const plant=ease(.129,.238,age)*(1-ease(.25,.52,age));
    caster.g.position.copy(at);caster.g.rotation.y=yaw;
    caster.g.position.y=.36*spring;
    caster.g.visible=t<covered||age>=.045;
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
    ball.position.y=1.07+.065*Math.sin(t*16)*(1-travel);
    ball.rotation.y=yaw;
    ball.scale.set((.52-.07*travel)*core,.57*core,(.51+.15*travel)*core);
    const threads=lerp(.46,.96,charge)*ease(begin,begin+.24,t)*(1-ease(-.02,.15,age));
    const coil=.62*seal*(1-morph);
    weave(t,at,distance,threads,morph,0,0,coil);
    const cloakFlow=ease(rollStart-.055,formed+.16,t);
    cloakTrails(t,at,yaw,charge,cloakFlow,ease(begin+.07,begin+.25,t)*(1-ease(formed+.03,formed+.37,t)));
    if(age<0)shroud(t,at,yaw,lerp(-.12,1.38,seal),
      ease(begin+.14,begin+.27,t)*(1-unveil),1-.70*unveil,.39*push);
    else {
      const peel=ease(.049,.18,age);
      shroud(t,at,yaw,lerp(1.38,-.1,peel),.92*ease(-.025,.035,age)*(1-peel),ease(0,.053,age));
    }

    const fuse=ease(begin+.25,covered,t),returning=ease(.093,.38,age);
    const spiral=age<0?fuse*Math.PI*.90:(1-returning)*Math.PI*.76;
    scythe.visible=t<covered||returning>.03;
    const orbit=age<0?1-.87*fuse:.18+.82*returning;
    scytheOffset.set(-1.24*Math.cos(spiral)*orbit,.18+.049*Math.sin(t*4)+.63*(age<0?fuse:1-returning),
      -.97*Math.sin(spiral)*orbit).applyAxisAngle(up,yaw);
    scythe.position.copy(at).add(scytheOffset);
    scythe.rotation.set(-.15*brace+.65*spiral,yaw+.21*Math.sin(t*6)-spiral,-.16-.43*brace+.40*plant);
    scythe.scale.setScalar(1.43*(age<0?1-.97*fuse:returning));
    flame(t,.22+1.1*(age<0?fuse:1-returning),.28*orbit,age<0?1:stDarkEase(.02,.50,returning));

    inkIn(1.77-1.04*charge,.59*charge*(1-ease(launch,formed,t)),t*4);
    inkOut(.37+1.37*ease(.04,.31,age),.83*ease(.035,.098,age)*(1-ease(.11,.32,age)),t*6);
    for(const ribbon of ribbons)ribbon(age);
    wake(t);wakeShards(t);splash(t);scytheMatter(t);
  };
}

FXCODE.studio_darkness_shift=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  const scythe=args.hold?modelInst('dark_scythe'):null;
  if(args.hold&&!scythe)return;
  const root=new THREE.Group();root.name='Darkness Shift preview';anchor.obj.add(root);
  const look={...getLook(NET.myId),ws:-1,wn:0};
  const caster=stDarkShiftStudent(root,look,'Shift Dash caster',lookTint(look));
  if(scythe){scythe.name='Shift Dash scythe';root.add(scythe);}
  const update=args.hold?stDarkHoldDash(root,caster,scythe):stDarkQuickDash(root,caster,look);
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
