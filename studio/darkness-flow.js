// Studio-only: Darkness Flow state look (user 2026-11-20, designs/darkness.md "ภาพตอนอยู่ใน Flow")
// - right arm (scythe side) wrapped in solid black aura
// - scythe spine flame flows faster (args.flameSpeed in darkness-scythe.js); same flame copied onto the arm
// - 3 shadow orbs with tails orbiting the body
// - HUD on a camera plane: timer ring around the crosshair, 3 orb dots, dark screen edge with a few rising flames
// Timeline (dur 6.5): 0.6 enter Flow -> ring drains -> 3.4 refresh (another marked kill) -> 5.6 Flow ends
const ST_DARK_FLOW={enter:.6,refresh:3.4,end:5.6,len:6};

function stDarkFlowArmPath(actor,out){   // shoulder -> elbow -> wrist -> fingertip (world)
  const B=actor.flowBones||(actor.flowBones=['upper_arm_R','forearm_R','hand_R'].map(n=>actor.g.getObjectByName(n)));
  if(B.some(b=>!b)){   // fallback: code arm
    const a=actor.armR;a.updateWorldMatrix(true,false);
    for(let i=0;i<4;i++)out[i].set(0,-0.22*i,0).applyMatrix4(a.matrixWorld);
    return out;
  }
  B.forEach((b,i)=>b.getWorldPosition(out[i]));
  out[3].copy(out[2]).add(new THREE.Vector3().subVectors(out[2],out[1]).normalize().multiplyScalar(0.13));
  return out;
}

function stDarkFlowArm(root){   // solid ink sleeve + ink strands spiralling along it
  const N=24,R=10,pos=new Float32Array(N*R*3),idx=[];
  for(let i=0;i<N-1;i++)for(let j=0;j<R;j++){const a=i*R+j,b=i*R+(j+1)%R,c=a+R,d=b+R;idx.push(a,c,b,b,c,d);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setIndex(idx);
  const mat=new THREE.MeshBasicMaterial({color:0x050508,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const sleeve=new THREE.Mesh(geo,mat);sleeve.name='Flow arm aura';sleeve.frustumCulled=false;sleeve.renderOrder=7;root.add(sleeve);
  const S=5,P=40,spos=new Float32Array(S*P*2*3),scol=new Float32Array(S*P*2*4),sidx=[];
  for(let s=0;s<S;s++)for(let i=0;i<P-1;i++){const a=(s*P+i)*2;sidx.push(a,a+1,a+2,a+1,a+3,a+2);}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(spos,3));sg.setAttribute('color',new THREE.BufferAttribute(scol,4));sg.setIndex(sidx);
  const sm=new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const strands=new THREE.Mesh(sg,sm);strands.name='Flow arm ink strands';strands.frustumCulled=false;strands.renderOrder=8;root.add(strands);
  const curve=new THREE.CatmullRomCurve3([0,1,2,3].map(()=>new THREE.Vector3())),pt=new THREE.Vector3(),tg=new THREE.Vector3(),nA=new THREE.Vector3(),nB=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  const frame=u=>{curve.getPointAt(u,pt);curve.getTangentAt(u,tg);nA.crossVectors(tg,Math.abs(tg.y)>.9?nB.set(1,0,0):up).normalize();nB.crossVectors(tg,nA).normalize();};
  return {curve,update(path,t,k){
    curve.points.forEach((p,i)=>p.copy(path[i]));curve.updateArcLengths();
    for(let i=0;i<N;i++){const u=i/(N-1);frame(u);
      const r=(0.105+0.025*Math.sin(u*Math.PI))*(1+0.06*Math.sin(t*7+u*11))*(u>.92?1-(u-.92)/.08*.5:1);
      for(let j=0;j<R;j++){const a=j/R*Math.PI*2,q=(i*R+j)*3;
        pos[q]=pt.x+(nA.x*Math.cos(a)+nB.x*Math.sin(a))*r;pos[q+1]=pt.y+(nA.y*Math.cos(a)+nB.y*Math.sin(a))*r;pos[q+2]=pt.z+(nA.z*Math.cos(a)+nB.z*Math.sin(a))*r;}}
    geo.attributes.position.needsUpdate=true;mat.opacity=.96*k;sleeve.visible=k>.01;
    for(let s=0;s<S;s++)for(let i=0;i<P;i++){const u=i/(P-1),flow=(u*1.6-t*1.3+s*.37)%1,ang=u*9+t*(2+s*.3)+s*1.26;frame(Math.min(1,u));
      const r=.13+.035*Math.sin(t*4+s+u*7),w=.012+.016*Math.sin(Math.PI*u);
      const cx=pt.x+(nA.x*Math.cos(ang)+nB.x*Math.sin(ang))*r,cy=pt.y+(nA.y*Math.cos(ang)+nB.y*Math.sin(ang))*r,cz=pt.z+(nA.z*Math.cos(ang)+nB.z*Math.sin(ang))*r;
      const q=(s*P+i)*2*3,c=(s*P+i)*2*4;
      spos[q]=cx;spos[q+1]=cy-w;spos[q+2]=cz;spos[q+3]=cx;spos[q+4]=cy+w;spos[q+5]=cz;
      const al=k*Math.sin(Math.PI*u)*(flow<.55?1:.25),g=.02;   // black strands only (user: no white)
      for(const o of [c,c+4]){scol[o]=scol[o+1]=g;scol[o+2]=g*1.15;scol[o+3]=al;}}
    sg.attributes.position.needsUpdate=true;sg.attributes.color.needsUpdate=true;strands.visible=k>.01;
  }};
}

function stDarkFlowFlames(root){   // the scythe "spine flame" (darkness-scythe.js sheet loop), same tongues/gaps, run along the top of the arm
  const SHC=40,SR=8,pos=new Float32Array(SHC*SR*3),col=new Float32Array(SHC*SR*4),idx=[];
  for(let i=0;i<SHC-1;i++)for(let j=0;j<SR-1;j++){const a=i*SR+j,b=(i+1)*SR+j;idx.push(a,b,a+1,b,b+1,a+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,4));geo.setIndex(idx);
  const mesh=new THREE.Mesh(geo,stScyInk());mesh.name='Flow arm spine flame';mesh.frustumCulled=false;mesh.renderOrder=9;root.add(mesh);
  const at=new THREE.Vector3(),tg=new THREE.Vector3(),SC=1.42*2.1;
  return (curve,FT,k)=>{mesh.visible=k>.01;if(!mesh.visible)return;
    for(let i=0;i<SHC;i++){
      const tt=0.03+0.9*i/(SHC-1);curve.getPointAt(Math.min(1,.04+.92*tt),at);curve.getTangentAt(Math.min(1,.04+.92*tt),tg);
      const n1=Math.sin(tt*38-FT*5.5)*0.5+Math.sin(tt*71+FT*3.7)*0.3+Math.sin(tt*17-FT*2.1)*0.2;
      const H=(0.07+0.09*Math.max(0,n1+0.35))*(1-0.3*tt)*SC*k;
      const cyc=(FT*0.9+Math.sin(tt*13.7)*3.1)%1,gap=Math.sin(tt*9.3+Math.floor(FT*0.9+Math.sin(tt*13.7)*3.1)*2.7)>0.35;
      for(let j=0;j<SR;j++){
        const v=j/(SR-1),lean=0.025*SC*v*v*Math.sin(FT*4+tt*20),h=H*v*(gap?(1+cyc*1.6):1);
        const q=(i*SR+j)*3,c=(i*SR+j)*4;
        pos[q]=at.x+tg.x*lean;pos[q+1]=at.y+.1+h;pos[q+2]=at.z+tg.z*lean;
        let al=Math.pow(1-v,0.6);
        if(gap){const g0=cyc*0.9,g1=g0+0.22;if(v>g0&&v<g1)al=0;else if(v<g0)al*=Math.min(1,cyc*3);}
        col[c+3]=al*k;
      }
    }
    geo.attributes.position.needsUpdate=geo.attributes.color.needsUpdate=true;};
}

function stDarkFlowOrbs(root){   // 3 shadow balls, each with ONE small ribbon tail styled like the BA blade trail
  // (black, darkest on the outer edge, fading inward and toward the end, ragged tip) — user 2026-11-20
  const core=new THREE.MeshBasicMaterial({color:0x07070a,transparent:true,toneMapped:false});
  const orbs=[0,1,2].map(i=>{const m=stDarkOrbCore(core);m.name='Flow orb '+i;root.add(m);return m;});
  const HH=26,HK=5,per=HH*HK,pos=new Float32Array(3*per*3),col=new Float32Array(3*per*4),idx=[];
  for(let o=0;o<3;o++)for(let j=0;j<HH-1;j++)for(let k=0;k<HK-1;k++){const a=o*per+j*HK+k,b=a+HK;idx.push(a,b,a+1,b,b+1,a+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,4));geo.setIndex(idx);
  const uv=new Float32Array(3*per*2);for(let o=0;o<3;o++)for(let j=0;j<HH;j++)for(let n=0;n<HK;n++){const i=o*per+j*HK+n;uv[i*2]=j/(HH-1);uv[i*2+1]=n/(HK-1);}geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  const am=(()=>{const c=document.createElement('canvas');c.width=64;c.height=16;const g=c.getContext('2d'),d=g.createImageData(64,16);   // alpha: fades toward the tip, darkest on the top edge, ragged end (BA trail look)
    for(let x=0;x<64;x++)for(let y=0;y<16;y++){const u=x/63,v=1-y/15,rag=u>.55&&Math.sin(v*19+u*31)>.35?.25:1,a=Math.min(1,1.5*Math.pow(1-u,1.1)*(.4+.6*v))*rag*(u<.04?u/.04:1),q=(y*64+x)*4;d.data[q]=d.data[q+1]=d.data[q+2]=Math.round(255*a);d.data[q+3]=255;}
    g.putImageData(d,0,0);return new THREE.CanvasTexture(c);})();
  // custom alpha blend keeps the target alpha (soft black otherwise lets the white page show through)
  const tails=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x000000,alphaMap:am,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    blending:THREE.CustomBlending,blendSrc:THREE.SrcAlphaFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.ZeroFactor,blendDstAlpha:THREE.OneFactor}));tails.name='Flow orb tails';tails.frustumCulled=false;tails.renderOrder=8;root.add(tails);
  const where=(o,t,c,out)=>{const a=t*2.4+o*Math.PI*2/3;return out.set(c.x+Math.cos(a)*.9,c.y+.14*Math.sin(t*2.6+o*2),c.z+Math.sin(a)*.9);};
  const p=new THREE.Vector3(),HEAD=.13,LAG=.5;
  return (centre,t,k)=>{const on=k>.02;tails.visible=on;core.opacity=Math.min(1,k*1.3);tails.material.opacity=Math.min(1,k*1.3);
    for(let o=0;o<3;o++){
      orbs[o].visible=on;where(o,t,centre,orbs[o].position);orbs[o].scale.setScalar(HEAD*Math.min(1,k*1.4));
      for(let j=0;j<HH;j++){const s=j/(HH-1);where(o,t-s*LAG,centre,p);
        const half=HEAD*.95*Math.pow(1-s,.85)*Math.min(1,k*1.4),rag=.12*Math.sin(s*23-t*9+o*3)*s;   // tapers to the tip
        for(let n=0;n<HK;n++){const v=n/(HK-1),i=o*per+j*HK+n,q=i*3,c=i*4;
          pos[q]=p.x;pos[q+1]=p.y+(v*2-1)*half;pos[q+2]=p.z;
          const edge=.35+.65*v;   // top edge darkest, like the blade-side edge of the BA trail
          col[c]=col[c+1]=col[c+2]=0;col[c+3]=Math.min(1,k*1.3)*edge*Math.pow(1-s,1.1)*(1-Math.max(0,rag*3))*(s<.04?s/.04:1);}}}
    geo.attributes.position.needsUpdate=geo.attributes.color.needsUpdate=true;};
}

function stDarkFlowHud(){   // screen-space HUD drawn on a canvas plane parked in front of the camera
  const W=1024,cv=document.createElement('canvas'),ctx=cv.getContext('2d'),tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),mat);plane.name='Flow HUD';plane.frustumCulled=false;plane.renderOrder=999;cam.add(plane);
  if(!cam.parent)scene.add(cam);
  const rnd=i=>{const x=Math.sin(i*91.7+17.3)*43758.5453;return x-Math.floor(x);};
  const dots=Array.from({length:34},(_,i)=>({edge:i%3,p:rnd(i),d:.005+rnd(i+20)*.06,life:2+2.4*rnd(i+40),off:rnd(i+60),r:4+(rnd(i+80)<.2?10*rnd(i+90):5*rnd(i+100)),a:.25+.75*rnd(i+120)}));   // black dots drifting in from left/right/bottom
  return {plane,draw(t,flow,timeLeft,flash){
    const H=Math.round(W/cam.aspect);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
    const d=.5,vh=2*Math.tan(cam.fov*Math.PI/360)*d;plane.position.set(0,0,-d);plane.scale.set(vh*cam.aspect,vh,1);
    ctx.clearRect(0,0,W,H);plane.visible=flow>.01;if(!plane.visible){tex.needsUpdate=true;return;}
    // dark screen edge
    const g=ctx.createRadialGradient(W/2,H/2,H*.38,W/2,H/2,W*.62);g.addColorStop(0,'rgba(4,4,8,0)');g.addColorStop(.62,'rgba(4,4,8,.5)');g.addColorStop(1,'rgba(2,2,5,.92)');   // user: border a bit darker
    ctx.globalAlpha=flow;ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // black dots: from the left/right edges they rise, from the bottom they float up; mixed size/opacity, big ones stay modest
    ctx.fillStyle='#030305';
    for(const e of dots){const u=((t/e.life)+e.off)%1;let x,y;
      if(e.edge===2){x=W*(.08+.84*e.p)+Math.sin(t*1.3+e.off*9)*8;y=H*(1-e.d)-u*H*.22;}
      else{x=e.edge?W*(1-e.d):W*e.d;x+=Math.sin(t*1.1+e.off*7)*6;y=H*(1.02-u*1.04);}
      ctx.globalAlpha=flow*e.a*Math.min(1,u*5)*Math.pow(1-u,.9);ctx.beginPath();ctx.arc(x,y,e.r*(1-.35*u),0,Math.PI*2);ctx.fill();}
    // timer ring around the crosshair + 3 orb dots
    const cx=W/2,cy=H/2,r=38,k=clamp(timeLeft,0,1);
    ctx.globalAlpha=flow*.55;ctx.lineWidth=7;ctx.strokeStyle='#0a0a10';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=flow;ctx.lineCap='round';ctx.lineWidth=6;ctx.strokeStyle='#08080c';ctx.beginPath();ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*k);ctx.stroke();
    ctx.lineWidth=1.6;ctx.strokeStyle=`rgba(235,236,245,${.75+.25*flash})`;ctx.beginPath();ctx.arc(cx,cy,r+3.2,-Math.PI/2,-Math.PI/2+Math.PI*2*k);ctx.stroke();
    if(flash>0){ctx.globalAlpha=flow*flash;ctx.lineWidth=3;ctx.strokeStyle='#ffffff';ctx.beginPath();ctx.arc(cx,cy,r+6+14*(1-flash),0,Math.PI*2);ctx.stroke();}
    ctx.globalAlpha=flow;for(let i=0;i<3;i++){const x=cx+(i-1)*15,y=cy+r+16;ctx.fillStyle='#07070b';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(230,232,240,.8)';ctx.lineWidth=1.2;ctx.stroke();}
    ctx.globalAlpha=1;tex.needsUpdate=true;
  },dispose(){plane.removeFromParent();plane.geometry.dispose();mat.dispose();tex.dispose();}};
}

FXCODE.studio_darkness_flow=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  anchor.inner.visible=false;
  const root=new THREE.Group();root.name='Darkness Flow preview';anchor.obj.add(root);
  anchor.geo=new THREE.BufferGeometry();
  const look={...getLook(NET.myId),ws:-1,wn:0};
  const caster=stDarkShiftStudent(root,look,'Flow caster',lookTint(look));
  const scyArgs={wrap:'C',scale:1.42,flameSpeed:1};
  const scythe=stCreateScythePreview(root,scyArgs,anchor.geo);
  const arm=stDarkFlowArm(root),flames=stDarkFlowFlames(root),orbs=stDarkFlowOrbs(root),hud=stDarkFlowHud();
  const path=[0,1,2,3].map(()=>new THREE.Vector3()),chest=new THREE.Vector3();
  const F=ST_DARK_FLOW,ease=stDarkEase;let armPh=0,armLast=null;
  const tick=()=>{
    const t=instance.t;
    const flow=ease(F.enter,F.enter+.35,t)*(1-ease(F.end,F.end+.4,t));
    const left=t<F.refresh?1-(t-F.enter)/F.len:1-(t-F.refresh)/F.len;   // ring drains; refresh fills it again
    const flash=Math.max(1-Math.abs(t-F.enter-.2)/.25,1-Math.abs(t-F.refresh-.12)/.25,0);
    // idle breathing pose, right arm slightly raised so the aura reads
    stDarkPose(caster,{back:-.04+.02*Math.sin(t*1.8),roll:0,drop:.02*Math.sin(t*1.8),arms:.08,step:0});
    caster.armR.rotation.set(-.55-.1*flow+.04*Math.sin(t*2.1),0,-.75);
    caster.b.updateWorldMatrix(true,true);if(caster.rig)rigSync(caster,0);
    scyArgs.flameSpeed=1+1.8*flow;scythe.update(t);   // drive with studio time (onBeforeRender alone does not tick in sheets)
    stDarkFlowArmPath(caster,path);root.updateWorldMatrix(true,false);for(const v of path)root.worldToLocal(v);   // bones are world-space, meshes live in root
    arm.update(path,t,flow);armPh+=armLast==null?t:clamp(t-armLast,0,.1)*(1+1.8*flow);armLast=t;flames(arm.curve,armPh,flow);
    caster.b.getWorldPosition(chest);root.worldToLocal(chest);chest.y+=1.25;orbs(chest,t,flow);
    hud.draw(t,flow,clamp(left,0,1),flash);
  };
  arm.curve.points.forEach(p=>p.set(0,1,0));
  instance.updateDarknessFlow=tick;tick();
  anchor.geo.addEventListener('dispose',()=>{instance.updateDarknessFlow=null;hud.dispose();disposeTree(root);root.clear();root.removeFromParent();});
};
