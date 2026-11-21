// Studio-only: Darkness floating scythe + dark-matter ink (ผู้ใช้ 2026-11-18, ref designs/darkness_ref/scythe_void_ref.png)
// เคียวลอยหมุนควงเบา ๆ ข้างตัว • ชั้นบนของใบดำสนิท (unlit) • เส้นหมึกดำไหลตามใบจากโคนไปปลายแล้วม้วนหลุดออกจากสัน + หยดเล็ก ๆ
// • เส้นหมึกพันด้าม 3 จุด • ค่อนข้างเยอะจนกลบทรงได้บ้าง • fx: assets/fx/darkness/scythe_idle.fx.json
const ST_SCY_LINES='assets/vfx/dark_scythe.lines.json';
let stScyLines=null;
let stScyLinesLoad;
function loadScytheLines(){
  return stScyLinesLoad??=fetch(ST_SCY_LINES).then(r=>r.ok?r.json():null).then(j=>{stScyLines=j;}).catch(()=>{});
}

const ST_DARK_LIVE_BA={start:2,rate:1.48,wind:.27,sweep:.18,idleAfter:2,returnTime:.84};
function stDarkReturnRotation(out,from,reference,target,turn,offset,correction){
  offset.copy(reference).invert().premultiply(target);
  correction.identity().slerp(offset,turn);
  return out.copy(from).slerp(reference,turn).premultiply(correction);
}

function stScyInk(){   // วัสดุหมึก: ดำสนิทไม่รับแสง โปร่งตามจุดยอด
  return new THREE.MeshBasicMaterial({color:0x000000,transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,vertexColors:true,toneMapped:false});
}

function stScySlashMaterial(phase,color=0xffffff){
  const material=stScyInk();
  material.color.setHex(color);
  material.onBeforeCompile=shader=>{
    shader.uniforms.slashPhase=phase;
    shader.vertexShader='varying vec2 slashUV;\n'+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nslashUV=uv;');
    shader.fragmentShader=`uniform float slashPhase;varying vec2 slashUV;
      float slashGrain(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      `+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float across=slashUV.x,along=1.-slashUV.y;
      float edge=smoothstep(.49,.68,across)*(1.-smoothstep(.93,1.,across));
      float warped=across+.036*sin(along*34.-slashPhase*5.)+.018*sin(along*71.+slashPhase*6.);
      float tooth=smoothstep(.24,.88,sin(warped*92.+along*8.-slashPhase*2.));
      float brush=slashGrain(floor(vec2((along-slashPhase*.14)*104.,warped*35.)));
      float creases=tooth*(.28+.72*smoothstep(.16,.75,brush));
      float fibers=smoothstep(.37,.89,sin(warped*51.+along*13.-slashPhase*3.6));
      float breaks=smoothstep(-.36,.72,sin(along*62.+across*32.-slashPhase*4.8));
      diffuseColor.rgb*=1.-edge*(.32+.37*brush)*(1.-creases);
      diffuseColor.rgb+=vec3(.053,.036,.071)*edge*(.65*creases+.74*fibers*breaks);
      `);
  };
  return material;
}
function stScySpineProfile(t,time,out){
  const seed=time*.9+Math.sin(t*13.7)*3.1;
  out.height=.07+.09*Math.max(0,
    Math.sin(t*38-time*5.5)*.5+Math.sin(t*71+time*3.7)*.3+Math.sin(t*17-time*2.1)*.2+.35);
  out.cycle=seed%1;
  out.gap=Math.sin(t*9.3+Math.floor(seed)*2.7)>.35;
  return out;
}
function stScySpineOpacity(v,profile){
  let alpha=(1-v)**.6;
  if(profile.gap){
    const start=profile.cycle*.9;
    if(v>start&&v<start+.22)return 0;
    if(v<start)alpha*=Math.min(1,profile.cycle*3);
  }
  return alpha;
}

function stScytheHitCut(root,base,ghost=false){const g=new THREE.Group();g.name='Scythe BA hit slash';g.position.copy(base);g.scale.setScalar(ghost?0.6:0.8);root.add(g);   // ชัดเท่ากันทั้งคู่ ต่างแค่ขนาด
    const sides=[-1,1].map(dir=>{const sub=new THREE.Group();g.add(sub);
      const P=ghost?[[-0.55*dir,1.45,0.25],[0.0,0.1,0.3],[0.6*dir,-1.35,0.22]]:[[1.8*dir,0.55,0.23],[0.1*dir,0.05,0.28],[-1.85*dir,-0.4,0.21]];
      return {sub,outer:stDarkCut(sub,P,0.26,0x101019,ghost?13:11),white:stDarkCut(sub,P,0.17,0xf7f8fc,ghost?14:12)};});
    const cameraFacing=new THREE.Vector3(),life=.30;g.traverse(o=>{if(o.material){o.material.depthTest=false;}});   // รอยฟันลอยออกมาหน้าตัวเป้า ไม่จมเข้าตัว (ผู้ใช้ 2026-11-19)
    return (age,from)=>{g.visible=age>=0&&age<life;if(!g.visible)return;
      cameraFacing.copy(cam.position);root.worldToLocal(cameraFacing);cameraFacing.sub(base);cameraFacing.y=0;cameraFacing.normalize();g.position.copy(base).addScaledVector(cameraFacing,0.55+1.1*age);g.lookAt(cam.position);
      for(const sd of sides){const on=(from>0)===(sides.indexOf(sd)===1);sd.sub.visible=on;if(!on)continue;sd.outer(age,life,0.45);sd.white(age,life,0.45);}};}

function stChargedSlashFlakes(root,bladePt,poseAt,scale,start,duration,rnd){
  const count=72,rows=7,stride=rows*2;
  const geometry=new THREE.BufferGeometry(),indices=[];
  const positions=new THREE.BufferAttribute(new Float32Array(count*stride*3),3);
  const colors=new THREE.BufferAttribute(new Float32Array(count*stride*4),4);
  for(let i=0;i<count;i++)for(let j=0;j<rows-1;j++){
    const a=i*stride+j*2;
    indices.push(a,a+1,a+2,a+1,a+3,a+2);
  }
  geometry.setIndex(indices);
  geometry.setAttribute('position',positions);geometry.setAttribute('color',colors);
  const material=stScyInk();material.color.setHex(0xffffff);
  const flakes=new THREE.Mesh(geometry,material);
  flakes.name='Quick Dash charged slash flakes';flakes.frustumCulled=false;flakes.renderOrder=11;
  flakes.visible=false;root.add(flakes);
  const seeds=Array.from({length:count},(_,i)=>{
    const k=800+i*8;
    return {born:start+duration*(.17+.83*(i+.5)/count),blade:.44+.54*rnd(k),life:.19+.24*rnd(k+1),
      width:.07+.15*rnd(k+2),height:.25+.68*rnd(k+3),lift:.32+1.18*rnd(k+4),
      speed:.65+2.3*rnd(k+5),lean:(rnd(k+6)-.5)*1.5,phase:rnd(k+7)*Math.PI*2};
  });
  const center=new THREE.Vector3();
  return time=>{
    let active=0;
    for(const p of seeds){
      const age=time-p.born;
      if(age<0||age>=p.life)continue;
      const state=poseAt(p.born),[x,y]=bladePt(p.blade,.54),u=age/p.life;
      center.set(x*scale,y*scale,0).applyQuaternion(state.QB).add(state.pos);
      const r=Math.hypot(center.x,center.z)||1,nx=center.x/r,nz=center.z/r;
      const drift=1-Math.pow(1-u,1.65),move=p.speed*drift;
      const alpha=Math.min(1,u*12)*Math.pow(1-u,.72),height=p.height*(1-.62*u);
      for(let j=0;j<rows;j++){
        const s=j/(rows-1),wave=Math.sin(p.phase+5*s+u*4),tip=Math.sin(Math.PI*s);
        const width=p.width*Math.pow(tip,.78)*(1-.63*u);
        const curl=height*s*s*(.48+.22*wave);
        const px=center.x+nx*(move-curl)+nz*p.lean*drift;
        const py=center.y+p.lift*drift+height*s-.65*u*u;
        const pz=center.z+nz*(move-curl)-nx*p.lean*drift;
        const a=active*stride+j*2,tone=.025+.09*tip;
        positions.setXYZ(a,px+nz*width,py,pz-nx*width);
        positions.setXYZ(a+1,px-nz*width,py+.035*tip,pz+nx*width);
        colors.setXYZW(a,.019,.012,.038,alpha*tip);
        colors.setXYZW(a+1,tone*1.16,tone*.78,tone*1.83,alpha*tip);
      }
      active++;
    }
    flakes.visible=active>0;
    geometry.setDrawRange(0,active*(rows-1)*6);
    positions.needsUpdate=true;colors.needsUpdate=true;
  };
}

FXCODE.studio_darkness_scythe=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  anchor.inner.visible=false;
  const root=new THREE.Group();root.name='Darkness scythe preview';
  anchor.obj.add(root);
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{disposeTree(root);root.clear();root.removeFromParent();});
  stCreateScythePreview(root,args,anchor.geo);
};

function stCreateScythePreview(root,args,lifetime){
  loadScytheLines();
  const S=args.scale||1.6;          // ผู้ใช้: ใหญ่ขึ้นอีก → เคียวสูง ~3.5 ม. (~1.8 เท่าตัวละคร)
  const pivot=new THREE.Group();pivot.position.set(-(args.side??1.5),args.lift??0.05,args.fwd??-0.3);root.add(pivot);   // anchor (วัดในสตูดิโอ): +z = หน้า, −x = ขวามือตัวละคร
  const scy=new THREE.Group();scy.scale.setScalar(S);pivot.add(scy);
  const holder=modelOr('dark_scythe',null);scy.add(holder);
  // ชั้นบนของใบ: บังคับเป็นดำไม่รับแสง (เผื่อ loader ไม่แปลง unlit)
  const fixVoid=()=>holder.traverse(o=>{if(!o.isMesh)return;const nm=(o.name||'')+' '+(o.parent?.name||'');if([].concat(o.material).some(m=>m&&m.name==='sc_void')||/shaft|collar/.test(nm)){o.material=new THREE.MeshBasicMaterial({color:0x000000,toneMapped:false});}});   // ใบชั้นบน + ด้าม/คอ = ดำสนิทไม่รับแสง
  let voidFixed=false;

  // ---------- เส้นหมึก (ribbon หน้ากว้างหันหาแนวตั้งฉากใบ) ----------
  const N=args.strands||96,P=16;                      // จำนวนเส้น • จุดต่อเส้น
  const inkGeo=new THREE.BufferGeometry();
  const pos=new Float32Array(N*P*2*3),col=new Float32Array(N*P*2*4),idx=[];
  for(let s=0;s<N;s++)for(let i=0;i<P-1;i++){const a=(s*P+i)*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  inkGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));inkGeo.setAttribute('color',new THREE.BufferAttribute(col,4));inkGeo.setIndex(idx);
  const WS0=()=>args.wrap||'A';
  const ink=new THREE.Mesh(inkGeo,stScyInk());ink.frustumCulled=false;ink.renderOrder=8;scy.add(ink);
  const SHOW_BLADE=true;   // รอบ 7: ใบมีดใช้เอฟเฟกต์เดียวกับแบบ B ทุกอย่าง (ผู้ใช้: "ทำไปแล้ว เอาอันเดิมกลับมา")   // รอบ 6: C ไม่ใช้หมึกเส้นมั่ว ๆ เลย → เปลวดำพุ่งจากสันแทน (ผู้ใช้เลือก)   // รอบ 4 (ผู้ใช้ชี้รูป): เอา "ขอบหมึกหยัก ๆ ที่ติดสันใบ" กลับมา — แบบ C บีบให้แนบสัน ไม่ปลิวเป็นแผ่นใหญ่   // C: ไม่ใช้แผ่นหมึกแบน (ผู้ใช้: "เหลี่ยม ๆ ลอย ๆ กาก") → ใช้ออร่าควันดำลอยขึ้นจากใบแทน   // ผู้ใช้ 2026-11-18: เอาเส้นฟุ้งบนใบออก (แบบ C) 
  // หยดหมึก
  const DROPS=48,dropGeo=new THREE.SphereGeometry(0.05,8,6),dropM=new THREE.MeshBasicMaterial({color:0x000000,toneMapped:false,transparent:true});
  const drops=new THREE.InstancedMesh(dropGeo,dropM,DROPS);drops.frustumCulled=false;scy.add(drops);
  if(!SHOW_BLADE){ink.material.opacity=0;ink.material.colorWrite=false;}
   // ผู้ใช้: ไม่เอา "สี่เหลี่ยมเยอะ ๆ ที่ออกมาจากไหนไม่รู้" (หยดหมึก)
  // เปลวดำพุ่งจากสันใบ (แบบ C, ผู้ใช้เลือก 2026-11-18): ลิ้นเปลวแหลมงอกจากสันตลอดแนว สะบัดเหมือนไฟ ปลายหลุดเป็นเศษเล็กลอยขึ้น
  const FN=WS0()==='C'?(args.shaftInk?1:12):0,FP=10,   /* C ไม่มีหมึกด้าม → 9 ลิ้นเปลวที่ปลายล่าง */fGeo=new THREE.BufferGeometry(),fpos=new Float32Array(Math.max(1,FN)*FP*2*3),fcol=new Float32Array(Math.max(1,FN)*FP*2*4),fidx=[];
  for(let s=0;s<FN;s++)for(let i=0;i<FP-1;i++){const a=(s*FP+i)*2;fidx.push(a,a+1,a+2,a+1,a+3,a+2);}
  fGeo.setAttribute('position',new THREE.BufferAttribute(fpos,3));fGeo.setAttribute('color',new THREE.BufferAttribute(fcol,4));fGeo.setIndex(fidx);
  const flames=new THREE.Mesh(fGeo,stScyInk());flames.frustumCulled=false;flames.renderOrder=9;scy.add(flames);
  // แผ่นเปลวต่อเนื่องงอกจากสัน (แบบ C รอบ 10, ผู้ใช้: "ออกมาจากสันเลย ไม่ดูแยกกัน ลุกไหม้เป็นผืนเดียว หลุดแล้วโคนแหว่งแป๊บแล้วลุกต่อ")
  const SHC=WS0()==='C'?64:0,SR=8,sGeo=new THREE.BufferGeometry(),spos=new Float32Array(Math.max(1,SHC)*SR*3),scol=new Float32Array(Math.max(1,SHC)*SR*4),sidx=[];
  for(let i=0;i<SHC-1;i++)for(let j=0;j<SR-1;j++){const a=i*SR+j,b=(i+1)*SR+j;sidx.push(a,b,a+1,b,b+1,a+1);}
  sGeo.setAttribute('position',new THREE.BufferAttribute(spos,3));sGeo.setAttribute('color',new THREE.BufferAttribute(scol,4));sGeo.setIndex(sidx);
  const sheet=new THREE.Mesh(sGeo,stScyInk());sheet.name='Scythe spine flame';sheet.visible=SHC>0;sheet.frustumCulled=false;sheet.renderOrder=8;scy.add(sheet);
  // ออร่าควันดำลอยขึ้นจากตัวใบ (แบบ C) — สไปรต์กลมนุ่ม สีดำ โปร่งตามอายุ
  const AURA=0,auraTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
    r.addColorStop(0,'rgba(0,0,0,1)');r.addColorStop(0.45,'rgba(0,0,0,0.75)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
  const aura=[...Array(AURA)].map((_,k)=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:auraTex,color:0x000000,transparent:true,depthWrite:false,toneMapped:false}));sp.renderOrder=9;scy.add(sp);return sp;});
  // พันด้าม: A = 3 จุด ribbon เกลียวแน่น • B = เส้นหมึกยาวพันหลวม ๆ ทั้งด้าม มีห่วง/ปลายสะบัดแบบเปลวไฟ (ผู้ใช้ส่ง ref 2026-11-18)
  const WS=args.wrap||'A';
  const WR=WS==='C'?(args.shaftInk?1:0):3,   /* รอบ 14: ผู้ใช้เอาหมึกด้ามออก (เปิดคืนด้วย args.shaftInk) */WP=WS==='C'?110:WS==='B'?70:26,wrapGeo=new THREE.BufferGeometry(),wpos=new Float32Array(WR*WP*2*3),wcol=new Float32Array(WR*WP*2*4),widx=[];
  for(let s=0;s<WR;s++)for(let i=0;i<WP-1;i++){const a=(s*WP+i)*2;widx.push(a,a+1,a+2,a+1,a+3,a+2);}
  wrapGeo.setAttribute('position',new THREE.BufferAttribute(wpos,3));wrapGeo.setAttribute('color',new THREE.BufferAttribute(wcol,4));wrapGeo.setIndex(widx);
  const wrap=new THREE.Mesh(wrapGeo,stScyInk());wrap.frustumCulled=false;wrap.renderOrder=8;scy.add(wrap);

  const rnd=k=>{const x=Math.sin(k*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const strands=[...Array(N)].map((_,s)=>({ph:rnd(s+1),sp:0.55+rnd(s+7)*0.5,k:args.wrap==='C'?rnd(s+3)*0.06:0.02+rnd(s+3)*0.55,side:rnd(s+5)<0.5?1:-1,curl:(rnd(s+9)-0.5)*2,w:0.07+rnd(s+11)*0.12,peel:0.3+rnd(s+13)*0.55}));
  const lineAt=(arr,t)=>{const n=arr.length-1,f=Math.min(n-1e-6,Math.max(0,t*n)),i=f|0,u=f-i;return [arr[i][0]+(arr[i+1][0]-arr[i][0])*u,arr[i][1]+(arr[i+1][1]-arr[i][1])*u];};
  const bladePt=(t,k)=>{const L=stScyLines,a=lineAt(L.spine,t),b=lineAt(L.edge,t);return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];};
  const tan=t=>{const a=lineAt(stScyLines.spine,Math.max(0,t-0.02)),b=lineAt(stScyLines.spine,Math.min(1,t+0.02)),dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;return [dx/l,dy/l];};
  const v=new THREE.Vector3(),M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),SC=new THREE.Vector3();
  const t0=performance.now();
  const clock=()=>((typeof stVnow!=='undefined'?stVnow:performance.now())-(typeof stVnow!=='undefined'?(root.userData.v0??(root.userData.v0=stVnow)):t0))/1000;

  // ---------- ท่าฟัน BA (args.mode='ba', ผู้ใช้ 2026-11-19): เงื้อ 0.2 วิ → กวาดแนวนอน ขวา→ซ้าย 120° → กลับข้างตัว • เปลวบนใบยืดเป็นหางตามทางที่ใบผ่าน ----------
  const BA=args.mode==='ba',standaloneBA=BA&&!args.followUp&&!args.liveBA,CYC=args.cycle||2.0,idlePos=pivot.position.clone(),S0=S;
  const hasBATrail=BA||!!args.trailPose,trailRoot=args.trailRoot??root;
  const hasBASpin=BA||!!args.spinPose;
  const HK=22,HH=30,tailGeo=new THREE.BufferGeometry(),tpos=new Float32Array(HK*HH*3),tcol=new Float32Array(HK*HH*4),tidx=[];
  for(let j=0;j<HH-1;j++)for(let k=0;k<HK-1;k++){const a=j*HK+k,b=(j+1)*HK+k;tidx.push(a,b,a+1,b,b+1,a+1);}
  tailGeo.setAttribute('position',new THREE.BufferAttribute(tpos,3));tailGeo.setAttribute('color',new THREE.BufferAttribute(tcol,4));tailGeo.setIndex(tidx);
  const slashPhase={value:0},spineProfile={height:0,cycle:0,gap:false};
  if(args.liveBA){
    const bladeUV=new THREE.BufferAttribute(new Float32Array(HK*HH*2),2);
    for(let j=0;j<HH;j++)for(let k=0;k<HK;k++)bladeUV.setXY(j*HK+k,k/(HK-1),1-j/(HH-1));
    tailGeo.setAttribute('uv',bladeUV);
  }
  const tail=new THREE.Mesh(tailGeo,args.liveBA?stScySlashMaterial(slashPhase,0x000000):stScyInk());
  tail.name='Scythe BA blade trail';tail.frustumCulled=false;tail.renderOrder=7;if(hasBATrail)trailRoot.add(tail);
  const faceRibbon=args.liveBA?new THREE.Mesh(new THREE.PlaneGeometry(1,1,4,HH-1),stScySlashMaterial(slashPhase)):null;
  let ribbonPos,ribbonColor;
  if(faceRibbon){
    faceRibbon.name='Scythe BA layered slash';
    faceRibbon.renderOrder=8;faceRibbon.frustumCulled=false;faceRibbon.visible=false;
    ribbonPos=faceRibbon.geometry.attributes.position;
    ribbonColor=new THREE.BufferAttribute(new Float32Array(HH*5*4),4).setUsage(THREE.DynamicDrawUsage);
    faceRibbon.geometry.setAttribute('color',ribbonColor);
    trailRoot.add(faceRibbon);
  }
  // ขอบบนของหาง = แถบเปลว (ผู้ใช้: "ด้านบนของหางมีเปลว ด้านล่างเป็นหางปกติ")
  const fr2=new THREE.BufferGeometry(),f2pos=new Float32Array(HK*HH*3),f2col=new Float32Array(HK*HH*4);fr2.setAttribute('position',new THREE.BufferAttribute(f2pos,3));fr2.setAttribute('color',new THREE.BufferAttribute(f2col,4));fr2.setIndex(tidx);
  const fringe=new THREE.Mesh(fr2,stScyInk());fringe.frustumCulled=false;fringe.renderOrder=7;if(hasBATrail)trailRoot.add(fringe);
  // ถ่านดำหลุดจากปลายหาง
  const EMB=hasBATrail?(args.liveBA?18:28):0,embTex=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(0,0,0,1)');r.addColorStop(0.6,'rgba(0,0,0,0.8)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,32,32);return new THREE.CanvasTexture(c);})();
  const embers=[...Array(EMB)].map(()=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:embTex,color:0x000000,transparent:true,depthWrite:false,toneMapped:false}));sp.renderOrder=8;trailRoot.add(sp);return sp;});
  const FLECKS=18;
  const tipFlecks=args.liveBA&&hasBATrail?new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1,0),
    new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false}),FLECKS):null;
  const fleckPose=tipFlecks?new THREE.Object3D():null;
  if(tipFlecks){
    tipFlecks.name='Scythe BA tip ink flecks';
    tipFlecks.visible=false;
    tipFlecks.renderOrder=10;
    tipFlecks.frustumCulled=false;
    tipFlecks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const ink=new THREE.Color(),palette=[0x100e17,0x2e253e,0x524166];
    for(let i=0;i<FLECKS;i++)tipFlecks.setColorAt(i,ink.setHex(palette[i%palette.length]));
    trailRoot.add(tipFlecks);
  }
  // หางด้าม (ผู้ใช้ 2026-11-19): ชั้นจางกว่า ต่อติดกับหางใบ ตามทางที่ด้ามผ่านจริง
  const SK=10,shGeo=new THREE.BufferGeometry(),shpos=new Float32Array(SK*HH*3),shcol=new Float32Array(SK*HH*4),shidx=[];
  for(let j=0;j<HH-1;j++)for(let k=0;k<SK-1;k++){const a=j*SK+k,b=(j+1)*SK+k;shidx.push(a,b,a+1,b,b+1,a+1);}
  shGeo.setAttribute('position',new THREE.BufferAttribute(shpos,3));shGeo.setAttribute('color',new THREE.BufferAttribute(shcol,4));shGeo.setIndex(shidx);
  const shMat=stScyInk();shMat.color.set(0xffffff);const shTail=new THREE.Mesh(shGeo,shMat);shTail.name='Scythe shaft trail';shTail.frustumCulled=false;shTail.renderOrder=6;if(hasBATrail)trailRoot.add(shTail);
  // เปลวที่ปลายหาง (ผู้ใช้ 2026-11-19): ลิ้นไฟหยักแบบเดียวกับเปลวปลายล่างของเคียว งอกจากปลายหางที่ยังเห็นอยู่
  const TF=hasBATrail?12:0,TFP=10,tfGeo=new THREE.BufferGeometry(),tfpos=new Float32Array(Math.max(1,TF)*TFP*2*3),tfcol=new Float32Array(Math.max(1,TF)*TFP*2*4),tfidx=[];
  for(let q=0;q<TF;q++)for(let i=0;i<TFP-1;i++){const a=(q*TFP+i)*2;tfidx.push(a,a+1,a+2,a+1,a+3,a+2);}
  tfGeo.setAttribute('position',new THREE.BufferAttribute(tfpos,3));tfGeo.setAttribute('color',new THREE.BufferAttribute(tfcol,4));tfGeo.setIndex(tfidx);
  const tailFlames=new THREE.Mesh(tfGeo,stScyInk());tailFlames.frustumCulled=false;tailFlames.renderOrder=9;if(hasBATrail)trailRoot.add(tailFlames);
  // แผ่นเปลวแบบสันใบที่ปลายหาง (ผู้ใช้ 2026-11-19: "เปลวแบบสันเคียว ที่ปลายหางด้วย")
  const TER=8,teGeo=new THREE.BufferGeometry(),tepos=new Float32Array(HK*TER*3),tecol=new Float32Array(HK*TER*4),teidx=[];
  for(let i=0;i<HK-1;i++)for(let j=0;j<TER-1;j++){const a=i*TER+j,b=(i+1)*TER+j;teidx.push(a,b,a+1,b,b+1,a+1);}
  teGeo.setAttribute('position',new THREE.BufferAttribute(tepos,3));teGeo.setAttribute('color',new THREE.BufferAttribute(tecol,4));teGeo.setIndex(teidx);
  const tailSheet=new THREE.Mesh(teGeo,stScyInk());tailSheet.name='Scythe BA tip spine flame';tailSheet.frustumCulled=false;tailSheet.renderOrder=9;if(hasBATrail)trailRoot.add(tailSheet);
  // ละอองหมึกตอนควง (ผู้ใช้ 2026-11-19: ควงแบบโล่แต่มีละอองสาดออกมามากกว่า)
  const SPL=BA?36:0,splash=[...Array(SPL)].map(()=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:embTex,color:0x000000,transparent:true,depthWrite:false,toneMapped:false}));sp.renderOrder=9;root.add(sp);return sp;});
  // ตอนควงหลังฟัน (ผู้ใช้ 2026-11-19): ใช้ VFX ควงแบบท่าโล่ (จานหมึก + แผ่นเปลวรอบขอบ) + เส้นเปลวดำ 3 เส้นคนละทิศ ควงตามเคียวแล้วหาย
  const spinG=new THREE.Group();spinG.name='Scythe BA spin';spinG.rotation.x=-Math.PI/2;spinG.visible=false;if(hasBASpin)root.add(spinG);
  const SPR=1.75*S,spinInk=hasBASpin&&typeof stDarkShieldInk==='function'?stDarkShieldInk(spinG,SPR):null,spinFl=hasBASpin&&typeof stDarkShieldFlames==='function'?stDarkShieldFlames(spinG,SPR):null;
  const LSEG=48,spinLines=[0,1,2].map(n=>{const g=new THREE.BufferGeometry(),p=new Float32Array(LSEG*2*3),c=new Float32Array(LSEG*2*4),ix=[];for(let i=0;i<LSEG-1;i++){const a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2);}
    g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,4));g.setIndex(ix);
    const m=new THREE.Mesh(g,stScyInk());m.frustumCulled=false;m.renderOrder=12;const holder=new THREE.Group();holder.add(m);if(hasBASpin)root.add(holder);
    holder.userData={p,c,g,tilt:[[0.35,0,0.1],[-0.3,0.9,-0.25],[0.15,2.1,0.4]][n],dir:n===1?-1:1,ph:n*2.1};return holder;});
  const hist=[];const _p=new THREE.Vector3(),MB=new THREE.Matrix4(),vX=new THREE.Vector3(),vY=new THREE.Vector3(),vZ=new THREE.Vector3(),QB=new THREE.Quaternion(),Qi=new THREE.Quaternion();
  const ez=(a,b,t)=>{t=Math.min(1,Math.max(0,(t-a)/(b-a)));return t*t*(3-2*t);};
  // ---------- ท่า BA รอบ 10 (ผู้ใช้ 2026-11-19) ----------
  // ว่าง = เคียวตั้งแนวตั้ง ลอยวนรอบตัวช้า ๆ • ฟันแรกเริ่มจากฝั่งที่เคียวอยู่ (อยู่ข้างหลัง = ไปข้างใดข้างหนึ่งก่อน)
  // แต่ละครั้ง: เงื้อ 0.2 → กวาด 120° ด้านหน้า → ค้าง 0.3 → ควง 0.3 (ละอองหมึกสาด) พร้อมเลื่อนไปจุดเตรียม → ฟันต่อจากฝั่งที่จบ (สลับซ้าย-ขวา)
  // ไม่ได้ฟันเกิน 2 วิ = กลับแนวตั้งแล้ววนต่อ • พรีวิววนลูป: ว่าง 2 วิ → ฟัน 3 ครั้งห่าง 1.2 วิ → รอ 2 วิ → กลับท่าว่าง
  const LOOP=8,SW0=ST_DARK_LIVE_BA.start,GAP=1.2,NSW=3,WU=ST_DARK_LIVE_BA.wind,SWP=ST_DARK_LIVE_BA.sweep,HOLD=args.followUp?.48:.15,
    SPIN=0.3,A=args.followUp?1.26:1.05,BK=0.6,RI=1.7,ORB=0.45,REACH=args.reach??7.6;
  const splashLife=.5,liveSplashSpread=.51;
  const hoverOffset=new THREE.Vector3();
  const hoverSpeed=new THREE.Vector3();
  const bladeTarget=new THREE.Vector3(),bladeSample=new THREE.Vector3();
  const wrapA=x=>{x=(x+Math.PI)%(Math.PI*2);if(x<0)x+=Math.PI*2;return x-Math.PI;};
  const orbA=T=>wrapA(-1.2+ORB*T);   // มุมรอบตัวตอนว่าง (0 = หน้า, + = ขวา)
  const radOf=g=>new THREE.Vector3(-Math.sin(g),0,Math.cos(g));   // anchor: +z หน้า, −x ขวา
  const pose=(g,rad,vert,dirSweep,spinA,cock)=>{   // ทิศทางเคียวที่มุม g • vert: 1 = แนวตั้ง 0 = แนวนอน
    const R=radOf(g),tg=new THREE.Vector3(Math.cos(g),0,Math.sin(g)).multiplyScalar(-1);   // ทิศเพิ่มมุม (ไปทางขวา)
    const mot=tg.clone().multiplyScalar(dirSweep);
    const yH=R.clone();yH.y=0.2;yH.normalize();const xH=mot.clone();   // แนวนอน: ด้ามชี้ออกจากตัว ปลายใบนำทางกวาด
    const yV=new THREE.Vector3(0,1,0),xV=tg.clone();                    // แนวตั้ง: ด้ามตั้ง ใบหันตามทางวน
    vY.copy(yH).lerp(yV,vert).normalize();vX.copy(xH).lerp(xV,vert).normalize();
    vZ.crossVectors(vX,vY).normalize();vX.crossVectors(vY,vZ).normalize();
    MB.makeBasis(vX,vY,vZ);const q=new THREE.Quaternion().setFromRotationMatrix(MB);
    if(cock){const up=new THREE.Vector3(0,1,0),side=new THREE.Vector3().crossVectors(up,vY).dot(mot);q.premultiply(new THREE.Quaternion().setFromAxisAngle(up,cock*0.55*(side>0?-1:1)));}   // ง้าง (ผู้ใช้ 2026-11-19): หัวเคียวเบี่ยงถอยไปหลังทางแนวนอนเท่านั้น ไม่เงยขึ้น หมุนรอบแกนตั้งที่โคนด้าม
    const self=vert*Math.sin(0)+0;   // แนวตั้งควงตัวเองช้า ๆ ใส่ทีหลังตาม T
    const pos=new THREE.Vector3(0,1.25+(0.05+2.0*S0-1.25)*vert,0).addScaledVector(R,rad);   // จุดหัวเคียว • แนวตั้ง = โคนด้ามอยู่ระดับพื้นเหมือนท่าว่างเดิม
    pos.addScaledVector(vY,-2.0*S0);
    let spinCenter;
    if(spinA){spinCenter=pos.clone().addScaledVector(vY,1.1*S0);const Qs=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),spinA);q.premultiply(Qs);pos.sub(spinCenter).applyQuaternion(Qs).add(spinCenter);}
    return {q,pos,spinCenter};
  };
  const baState=T=>{   // สถานะล้วนจากเวลา (หางคำนวณย้อนหลังได้)
    const kc=Math.floor(T/LOOP),t=T-kc*LOOP,g0=orbA(kc*LOOP+SW0),side0=args.liveBA?(args.baSide??-1):Math.sin(g0)>=0?1:-1;
    const liveAge=(t-SW0)/ST_DARK_LIVE_BA.rate,idle=ST_DARK_LIVE_BA.idleAfter;
    const arc=args.arc??A;
    let g=orbA(T),rad=RI,vert=1,dirSweep=1,spinA=0,act=0,tw=0,spinIdx=-1,spinU=0,cock=0;
    let settle=0,hoverAge=0,bladeAlign=0,outR=0;
    if(t>=SW0){
      const last=args.followUp||args.liveBA?0:NSW-1;
      const k=Math.min(last,Math.floor((t-SW0)/GAP)),u=t-SW0-k*GAP,from=side0*(k%2?-1:1),to=-from;   // ฟันที่ k เริ่มจาก from กวาดไป to
      outR=args.range??(.55+REACH);
      const S0p=WU+SWP+HOLD,STL=args.liveBA?.68:SPIN+0.14,spinRadius=args.liveBA?Math.min(outR,3.0):outR,spinTurn=x=>-from*Math.PI*2*(args.liveBA?ez(0,1,x):4*(1-Math.pow(1-Math.min(1,x),3)));   // ควง 4 รอบ เร็วแล้วค่อย ๆ ช้าลงจนหยุดตรงทิศพร้อมฟัน (จบที่รอบเต็ม = ไม่กระตุก)
      if(args.liveBA)hoverAge=Math.max(0,(Math.min(u,idle*ST_DARK_LIVE_BA.rate)-S0p-STL+.18)/ST_DARK_LIVE_BA.rate);
      const followThrough=args.liveBA?0:.18;
      if(args.liveBA)bladeAlign=ez(.08,WU,u)*(1-ez(S0p,S0p+.12,u));
      if(u<WU){const e=ez(0,WU,u);const pg=args.liveBA?from*arc:k===0?g0:from*(arc+BK);const pr=k===0?RI:outR;const pv=k===0?1:0;
        g=pg+wrapA(from*(arc+(k?BK:0))-pg)*e+(k===0?0:from*0.12*Math.sin(Math.PI*e));rad=pr+(outR-pr)*e;vert=pv*(1-e);dirSweep=-from;tw=0.25*from*e;cock=1.05*Math.sin(Math.PI/2*e);}   // เงื้อไปจุดเริ่มฝั่ง from (ครั้งแรกจากท่าวน)
      else if(u<WU+SWP){const e=Math.pow((u-WU)/SWP,2.2),st=from*(arc+(k?BK:0));g=st+(to*arc-st)*e;cock=1.05*(1-ez(0,0.35,(u-WU)/SWP));rad=outR;vert=0;dirSweep=-from;act=Math.min(1,(u-WU)/0.04);tw=from*(0.25-0.85*e);}
      else if(u<WU+SWP+HOLD){const e=ez(0,0.12,u-WU-SWP);g=to*(arc+followThrough*e);rad=outR;vert=0;dirSweep=-from;act=Math.max(0,1-(u-WU-SWP)/0.12)*0.8;tw=-from*0.6;}   // ค้าง 0.3 วิ (ส่งตามแรงนิดเดียว)
      else if(u<S0p+STL){const x=(u-S0p)/STL,e=ez(0,SPIN,u-S0p);g=to*(arc+lerp(followThrough,BK,e));rad=lerp(outR,spinRadius,ez(0,1,x));vert=0;dirSweep=args.liveBA?-from:from;spinA=spinTurn(x);const fxTime=args.liveBA?STL:SPIN;if(u<S0p+fxTime){spinIdx=k;spinU=(u-S0p)/fxTime;}tw=-from*0.6*(1-e);}
      else{g=to*(arc+BK);rad=spinRadius;vert=0;dirSweep=args.liveBA?-from:from;
        if(k===last&&!args.liveBA){
          const returnAt=args.followUp?S0p+STL:WU+SWP+2;
          settle=ez(returnAt,returnAt+.76,u);
        }}
    }
    const p=pose(g,rad,vert,dirSweep,spinA,cock);
    if(bladeAlign>0&&stScyLines){
      const [x,y]=bladePt(1,.45);
      bladeSample.set(x*S0,y*S0,0).applyQuaternion(p.q).add(p.pos);
      bladeTarget.set(-Math.sin(g)*outR,args.cutHeight??bladeSample.y,Math.cos(g)*outR);
      bladeTarget.sub(bladeSample).multiplyScalar(bladeAlign);
      p.pos.add(bladeTarget);
      p.spinCenter?.add(bladeTarget);
    }
    if(hoverAge>0){
      const weight=ez(0,.28,hoverAge),slow=Math.exp(-2.4*hoverAge);
      hoverOffset.set(.26*hoverAge*weight,.36*(1-slow)*weight,.28*(1-slow)*weight);
      p.pos.add(hoverOffset);
      p.spinCenter?.add(hoverOffset);
      // At the handoff the ramp is complete, so this is the exact hover tangent.
      hoverSpeed.set(.26,.36*2.4*slow,.28*2.4*slow);
    }
    if(settle>0){
      const idle=pose(orbA(T),RI,1,1,0,0);
      const center=idle.pos.clone().add(new THREE.Vector3(0,1.1*S0,0));
      const yaw=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),T*.9);
      idle.pos.sub(center).applyQuaternion(yaw).add(center);
      idle.q.premultiply(yaw);
      p.pos.lerp(idle.pos,settle);
      p.pos.y+=.48*Math.sin(Math.PI*settle)**2;
      p.q.slerp(idle.q,settle);
    }
    if(vert>0.01){const sp=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),T*0.9*vert);   // แนวตั้ง: ควงตัวเองเบา ๆ
      const c=p.pos.clone().addScaledVector(new THREE.Vector3(0,1,0),1.1*S0*vert);p.q.premultiply(sp);p.pos.sub(c).applyQuaternion(sp).add(c);}
    const returnTime=ST_DARK_LIVE_BA.returnTime;
    const flight=args.liveBA?clamp((liveAge-idle)/returnTime,0,1):0;
    const returnBlend=flight*flight*(3-2*flight);
    const w=args.liveBA?ez(SW0,SW0+.13,t)*(1-returnBlend):args.followUp?ez(SW0,SW0+.13,t):1;
    if(flight>0&&flight<1){
      // The return starts with the incoming velocity and reaches idle with zero relative velocity.
      p.pos.addScaledVector(hoverSpeed,returnTime*flight*(1-flight)/(1+2*flight));
    }
    return {w,QB:p.q,pos:p.pos,tw,act,spinIdx,spinU,spinCenter:args.liveBA?p.spinCenter:null,inkStrength:args.liveBA?.47:1,spinAngle:args.liveBA?spinA:null,kc,g};
  };
  const baPose=T=>baState(T);
  const chargedFlakes=args.followUp?stChargedSlashFlakes(root,bladePt,baPose,S,SW0+WU,SWP,rnd):null;
  root.userData.baState=baState;   // ดีบัก/ทดสอบ
  // ---------- ท่าผู้ร่าย (ผู้ใช้ 2026-11-19) ----------
  // ง้าง: แขนขวาถือคทายืดออกกว้างไปฝั่งที่เคียวอยู่ ลำตัวบิดนิดเดียว → ค้างสั้น ๆ → สะบัดคทาเร็วก่อน ลำตัวบิดตามหน่อย
  // เคียวกวาดตามหลังมือ ~0.07 วิ • ควง = ข้อมือวนวงเล็กตามเคียว • ปลายคทาดำ มีหางสั้นตอนสะบัด
  const FL0=0.2,FLD=0.1;   // เริ่มสะบัด (หลังเริ่มง้าง) • เวลาสะบัด
  const handState=(T,liveSide=args.baSide??-1,entry)=>{   // gh = มุมแขน (0 หน้า, + ขวา) • el = เงยแขน • by = บิดตัว • fl = แรงสะบัด (หาง)
    const kc=Math.floor(T/LOOP),t=T-kc*LOOP,g0=orbA(kc*LOOP+SW0),side0=args.liveBA?liveSide:Math.sin(g0)>=0?1:-1;
    const IG=0.35,IE=-1.2;let gh=IG,el=IE,by=0,bd=0,tw=0,fl=0;
    const lim=x=>Math.max(-1.3,x);   // แขนขวาข้ามไปฝั่งซ้ายได้ไม่สุด
    if(t>=SW0){
      const k=args.liveBA?0:Math.min(NSW-1,Math.floor((t-SW0)/GAP)),u=t-SW0-k*GAP,from=side0*(k%2?-1:1),to=-from;
      const R1=[1.3,0,0.3,0,0],L1=[0.05,0.5,-0.3,args.bend??1.65,args.twist??-1.57];   // ปลายสะบัด: ขวา = แขนกางกว้าง • ซ้าย = ศอกยื่นไปหน้า ท่อนแขนล่างพับไปทางซ้าย (คทาอยู่มือขวาตลอด)
      const hold=to>0?R1:L1,back=from>0?[1.65,0.12,0.1,0,0]:[0.02,0.6,-0.22,1.7,-1.57];
      const prev=k===0?(entry?[entry.gh,entry.el,entry.by,entry.bd,entry.tw]:[IG,IE,0,0,0]):(from>0?R1:L1);
      const loaded=back.slice();
      loaded[0]+=from*.2;
      if(from<0)loaded[3]+=.15;
      const mix=(a,b,e)=>a.map((v,i)=>v+(b[i]-v)*e);
      let P;
      if(u<FL0){P=mix(prev,back,ez(0,0.14,u));const pl=ez(0.08,FL0,u);P[0]+=from*0.2*pl;if(from<0)P[3]+=0.15*pl;}   // ช่วงหน่วง: ถอยไปหลังอีกนิดเหมือนเคียวง้าง                                  // ง้างแขนกว้าง แล้วค้าง (หน่วงก่อนสะบัด)
      else if(u<FL0+FLD){const x=(u-FL0)/FLD,e=x*x*(3-2*x);P=mix(loaded,hold,e);fl=1;}   // สะบัดเร็ว
      else{P=hold.slice();fl=Math.max(0,1-(u-FL0-FLD)/0.12);}   // ค้างนิ่งตอนเคียวควง (ผู้ใช้: ไม่ต้องสั่น)
      if(k===NSW-1){const bk=t-(SW0+(NSW-1)*GAP+WU+SWP)-2.0;if(bk>0)P=mix(P,[IG,IE,0,0,0],ez(0,0.5,bk));}   // กลับท่ายืนพร้อมเคียว
      [gh,el,by,bd,tw]=P;
    }
    return {gh:lim(gh),el,by,bd,tw,fl};
  };
  let caster=null;const tipBall=new THREE.Mesh(new THREE.SphereGeometry(0.045,10,8),new THREE.MeshBasicMaterial({color:0x000000,toneMapped:false}));
  if(standaloneBA&&typeof stDarkShiftStudent==='function'){
    const look={...getLook(NET.myId),wn:0};caster=stDarkShiftStudent(root,look,'Darkness BA caster',lookTint(look));
    caster.wandG.visible=true;caster.tip.visible=false;tipBall.position.set(0,-1.1,0);caster.armR.add(tipBall);
  }
  // ออร่าดำรอบปลายคทา (ผู้ใช้ 2026-11-19): หมอกดำนุ่มเต้นช้า ๆ 3 ชั้น + เกล็ดหมึกเล็กวนรอบ 5 จุด
  const tAura=[0,1,2].map(i=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:embTex,color:i===1?0x1a1324:0x000000,transparent:true,depthWrite:false,toneMapped:false}));sp.renderOrder=9;tipBall.add(sp);return sp;});
  const tMotes=[...Array(5)].map(()=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:embTex,color:0x000000,transparent:true,depthWrite:false,toneMapped:false}));sp.renderOrder=9;tipBall.add(sp);return sp;});
  const updAura=T=>{tAura.forEach((sp,i)=>{const p=0.5+0.5*Math.sin(T*(2.1+i*0.9)+i*2);const sz=(0.22+0.1*i)*(0.85+0.3*p);sp.scale.set(sz,sz,1);sp.material.opacity=[0.75,0.45,0.28][i]*(0.75+0.25*p);});
    tMotes.forEach((sp,i)=>{const a=T*(2.4+i*0.3)+i*1.26,r=0.11+0.04*Math.sin(T*3+i);sp.position.set(Math.cos(a)*r,Math.sin(a*1.3)*0.06+((T*0.6+i*0.2)%1)*0.12-0.04,Math.sin(a)*r);const z=0.045*(1-((T*0.6+i*0.2)%1)*0.6);sp.scale.set(z,z,1);sp.material.opacity=0.85;});};
  const _d=new THREE.Vector3(),_qb=new THREE.Quaternion(),_dn=new THREE.Vector3(0,-1,0),_tp=new THREE.Vector3();
  const handTurn=new THREE.Quaternion(),bodyInverse=new THREE.Quaternion();
  function orientHand(H,bodyRotation,out){
    _d.set(-Math.sin(H.gh)*Math.cos(H.el),Math.sin(H.el),Math.cos(H.gh)*Math.cos(H.el));
    _d.applyQuaternion(bodyInverse.copy(bodyRotation).invert());
    out.setFromUnitVectors(_dn,_d);
    if(H.tw)out.premultiply(_qb.setFromAxisAngle(_d,H.tw));
    return out;
  }
  const poseCaster=T=>{const H=handState(T);
    caster.b.rotation.set(0,-H.by,0);
    orientHand(H,caster.b.quaternion,caster.armR.quaternion);
    caster.armL.rotation.set(0,0,0.18);for(const L of caster.legs)L.rotation.x=0;
    if(caster.rig){for(const l of caster.rig)l.w=1;rigSync(caster,0);
      if(!caster.fa){const bn=caster.g.getObjectByName('forearm_R'),hd=caster.g.getObjectByName('hand_R');if(bn&&hd){caster.fa={bn,rest:bn.quaternion.clone()};caster.g.updateWorldMatrix(true,true);hd.attach(tipBall);}}   // ปลายคทาติดมือโมเดล (ตามศอกที่งอ)
      if(caster.fa)caster.fa.bn.quaternion.copy(caster.fa.rest).multiply(_qb.setFromAxisAngle(new THREE.Vector3(1,0,0),-H.bd));}
    return H;};
  let liveModel,forearm,priorForearm;
  const beforeBend=new THREE.Quaternion(),afterBend=new THREE.Quaternion();
  const limbWeights=[];
  function liveBodyPose(T,side){
    const u=T-SW0,cut=WU+SWP;
    const easeIn=ez(0,.14,u);
    const settle=1-ez(ST_DARK_LIVE_BA.idleAfter,ST_DARK_LIVE_BA.idleAfter+ST_DARK_LIVE_BA.returnTime,u/ST_DARK_LIVE_BA.rate);
    return {side,weight:easeIn*settle,
      load:(.8*ez(0,.15,u)+.2*ez(.065,.22,u))*(1-ez(.205,cut-.055,u)),
      drive:ez(.202,cut-.013,u)*settle,carry:ez(.285,cut+.062,u)*settle,
      brace:ez(.30,cut+.025,u)*(1-.72*ez(cut+.07,cut+.41,u))*settle};
  }
  function liveHandPose(actor,T,previous){
    if(priorForearm&&forearm.quaternion.equals(afterBend))forearm.quaternion.copy(beforeBend);
    priorForearm=false;
    const u=T-SW0,handoff=previous?1-ez(.045,WU*.82,u):0;
    const current=liveBodyPose(T,args.baSide??-1);
    const old=handoff>0?liveBodyPose(previous.clock,previous.side):null;
    const mixPose=key=>lerp(current[key],old?.[key]??0,handoff);
    const weight=current.weight+(1-current.weight)*(old?.weight??0)*handoff;
    if(weight<=0||!actor.armR)return;
    const side=current.side,load=mixPose('load'),drive=mixPose('drive'),carry=mixPose('carry'),brace=mixPose('brace');
    actor.b.rotation.y+=lerp(side*(-.83*current.load+.62*current.drive+.29*current.carry),
      old?old.side*(-.83*old.load+.62*old.drive+.29*old.carry):0,handoff);
    actor.b.rotation.x+=.13*load+.24*brace;
    const twist=lerp(side*(.16*current.load-.22*current.carry),old?old.side*(.16*old.load-.22*old.carry):0,handoff);
    actor.b.rotation.z+=twist;
    const planted=clamp(1-(actor.vsp||0)/9,0,1);
    actor.b.position.x+=twist*.80*planted;
    actor.b.position.y-=(.12*load+.12*brace)*planted;
    actor.b.position.z+=(-.08*load+.16*drive)*planted;
    actor.armL.rotation.x-=.50*load+.96*drive-.28*carry;
    actor.armL.rotation.z+=.28*load+.50*carry;
    for(let i=0;i<2;i++){
      const step=P=>(i===(P.side>0?0:1)?.26*P.load+.29*P.carry:-.13*P.load-.35*P.brace);
      actor.legs[i].rotation.x+=lerp(step(current),old?step(old):0,handoff)*planted;
      actor.legs[i].rotation.z+=(i===0?-1:1)*.10*weight*planted;
    }
    const H=handState(T,side,old?handState(previous.clock,previous.side):null);
    actor.armR.quaternion.slerp(orientHand(H,actor.b.quaternion,handTurn),weight);
    if(!actor.rig)return;
    // This runs after locomotion sync. Apply transient offsets without changing its blend state.
    for(const [i,limb] of actor.rig.entries()){
      limbWeights[i]=limb.w;
      if(!limb.al)limb.w=1;
    }
    rigSync(actor,0);
    for(const [i,limb] of actor.rig.entries())limb.w=limbWeights[i];
    if(liveModel!==actor.fileModel){
      liveModel=actor.fileModel;
      forearm=liveModel?.getObjectByName('forearm_R');
    }
    if(forearm){
      beforeBend.copy(forearm.quaternion);
      forearm.rotateX(-H.bd*weight);
      afterBend.copy(forearm.quaternion);
      priorForearm=true;
    }
  }
  const tipAt=(T,out)=>{poseCaster(T);
    out.set(0,0,0);tipBall.updateWorldMatrix(true,false);tipBall.getWorldPosition(out);return root.worldToLocal(out);};
  // หางปลายคทา: ริบบอนดำบางสั้น ๆ เฉพาะตอนสะบัด
  const TH=14,ttGeo=new THREE.BufferGeometry(),ttP=new Float32Array(TH*2*3),ttC=new Float32Array(TH*2*4),ttI=[];
  for(let i=0;i<TH-1;i++){const a=i*2;ttI.push(a,a+1,a+2,a+1,a+3,a+2);}
  ttGeo.setAttribute('position',new THREE.BufferAttribute(ttP,3));ttGeo.setAttribute('color',new THREE.BufferAttribute(ttC,4));ttGeo.setIndex(ttI);
  const tipTail=new THREE.Mesh(ttGeo,stScyInk());tipTail.frustumCulled=false;tipTail.renderOrder=8;if(caster)root.add(tipTail);
  const updCaster=T=>{if(!caster)return;
    {const me=typeof PM3!=='undefined'&&PM3.get(NET.myId);if(lifetime&&me&&me.g.visible){me.g.visible=false;lifetime.addEventListener('dispose',()=>{me.g.visible=true;});}}   // ซ่อนตัวผู้เล่นจริง (ใช้ตัวผู้ร่ายของพรีวิวแทน)
    for(let i=0;i<TH;i++){const tt=T-i*0.014,a=i/(TH-1);tipAt(tt,_tp);const H=handState(tt),w=0.07*(1-a)+0.01;
      ttP[i*6]=_tp.x;ttP[i*6+1]=_tp.y-w;ttP[i*6+2]=_tp.z;ttP[i*6+3]=_tp.x;ttP[i*6+4]=_tp.y+w;ttP[i*6+5]=_tp.z;
      const al=Math.pow(1-a,1.3)*H.fl;ttC[i*8+3]=al;ttC[i*8+7]=al;}
    ttGeo.attributes.position.needsUpdate=true;ttGeo.attributes.color.needsUpdate=true;
    poseCaster(T);updAura(T);};
  // ---------- เป้าโดนฟัน (ผู้ใช้ 2026-11-19) ----------
  // ทุก BA ที่โดน = รอยฟันดำบนตัวเป้า ~0.3 วิ • เป้ามีตรา = เคียวเงาโปร่ง 40% โผล่ข้างเป้า (หลังเป้า ไม่โดนคนอื่น) ฟันสวนเป็นกากบาท แล้วสลายเป็นหมอกดำ
  //   เคียวเงามีรอยฟันของตัวเอง (จางกว่า) • เป้าสะดุ้งทุกครั้งที่โดน
  const LEAD=0.2,GIN=0.3,GHE=0.55,GCH=0.104,GOUT=0.2,GSC=S,GRAD=2*S,GBK=Math.sqrt(4*S*S-0.36),GDN=0.6,GOP=0.7;   // ด้ามล่างสุดลอยเหนือหัวเป้า (สูง 2.3 ม.) หลังเป้า แล้วสับลงมา   // เคียวเงา (ผู้ใช้ 2026-11-19 รอบ 2): โผล่หลังเป้า 0.3 วิหลังโดน ค่อย ๆ โน้มหัวไปหลังเตรียมฟันระหว่าง fade in → ฟันลงเร็ว 0.08 วิ → ฟันเลยไปแล้วชะลอตามแรงเฉื่อยพร้อมจางหาย 0.16 วิ
  const targets=!standaloneBA||typeof stDarkTargetMark!=='function'?[]:[{ang:0,dist:REACH,marked:true},{ang:-0.62,dist:REACH-0.4,marked:false}].map((d,i)=>{
    const look={...getLook(NET.myId),h:(i+1)%4,cl:(i+1)%4,hs:i+3,wn:0};const a=makeStudent(look,'darkness-ba-target-'+i);root.add(a.g);
    const R=radOf(d.ang);a.g.position.set(R.x*d.dist,0,R.z*d.dist);a.g.rotation.y=Math.atan2(-R.x,-R.z);useFileModel(a,'char_student',lookTint(look),look);
    if(d.marked)a.updMark=stDarkTargetMark(a.g);return {...d,a};});
  const hitCache=new Map();
  const hitsOf=kc=>{if(hitCache.has(kc))return hitCache.get(kc);const out=[];   // [{T, target i, from}] ต่อรอบลูป: หาเวลาที่ปลายใบผ่านมุมเป้า
    for(let k=0;k<NSW;k++){const t0=kc*LOOP+SW0+k*GAP+WU,from=Math.sign(baState(t0+0.001).g)||1;
      targets.forEach((tg,i)=>{const aim=tg.ang+from*LEAD;let prev=null;
        for(let t=t0;t<=t0+SWP;t+=0.002){const v=baState(t).g-aim;if(prev!==null&&Math.sign(v)!==Math.sign(prev)){out.push({T:t,i,from});break;}prev=v;}});}
    hitCache.set(kc,out);return out;};
  const lastHit=(T,i)=>{let best=null;for(const kc of [Math.floor(T/LOOP),Math.floor(T/LOOP)-1])for(const h of hitsOf(kc))if(h.i===i&&h.T<=T&&(!best||h.T>best.T))best=h;return best;};
  // รอยฟันบนตัวเป้า: ชั้นดำนอก + เส้นขาวบางตามคม (สไตล์เดียวกับท่าพุ่ง) หันหากล้อง
  targets.forEach(tg=>{const p=tg.a.g.position.clone();p.y=1.15;tg.cut=stScytheHitCut(root,p);if(tg.marked)tg.gcut=stScytheHitCut(root,p,true);});
  // เคียวเงา: สำเนาโมเดลเคียว ดำโปร่ง 70% ขนาดเท่าเคียวจริง + เปลว/หมึกชุดเดียวกับเคียวจริง (ใช้ geometry ร่วมกัน)
  const ghostRot=new THREE.Group(),ghostScy=new THREE.Group();ghostScy.scale.setScalar(GSC);ghostRot.add(ghostScy);ghostRot.visible=false;if(targets.length)root.add(ghostRot);
  const ghostMat=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:GOP,depthWrite:true,toneMapped:false});let ghostBuilt=false;
  const ghostInk=stScyInk();ghostInk.opacity=GOP;
  const _gx=new THREE.Vector3(),_gy=new THREE.Vector3(),_gz=new THREE.Vector3(),_gm=new THREE.Matrix4(),_gp=new THREE.Vector3();
  const ghostAt=(tg,phi,roll,yaw=0)=>{   // เคียวเงาอยู่หลังเป้า หมุนในระนาบตั้งที่ชี้หาผู้ร่าย • phi 0 = ตั้งตรง, + = โน้มหัวไปหลัง, − = ฟันลงมาทางผู้ร่าย • roll = เอียงข้าง (ตรง/เฉียง)
    const fw=radOf(tg.ang+yaw),up=new THREE.Vector3(0,1,0),ey=new THREE.Vector3().crossVectors(up,fw);
    _gm.makeBasis(fw,ey,up);ghostRot.quaternion.setFromRotationMatrix(_gm);ghostRot.rotateX(roll);
    ghostRot.position.copy(tg.a.g.position).addScaledVector(fw,GBK);ghostRot.position.y=1.2+GDN;   // จุดหมุนหลังเป้า ห่างจากอกเป้าพอดีรัศมีหัวเคียว
    const R=new THREE.Vector3(Math.sin(phi),0,Math.cos(phi)),X=new THREE.Vector3(-Math.cos(phi),0,Math.sin(phi));   // ใบนำทางฟัน (phi ลดลง)
    _gz.crossVectors(X,R).normalize();_gx.crossVectors(R,_gz).normalize();_gm.makeBasis(_gx,R,_gz);ghostScy.quaternion.setFromRotationMatrix(_gm);
    ghostScy.position.copy(R).multiplyScalar(GRAD-2*GSC);};
  const GPM=Math.atan2(-GBK,-GDN),GPB=0.3;   // ง้างไปหลังนิดเดียวแล้วฟาดลง   // GPM = มุมที่ใบผ่านอกเป้า • GPB = โน้มหลังสุดก่อนฟัน
  const ghostPhi=age=>{if(age<GHE){const e=ez(GIN,GHE,age);return 0.1+(GPB-0.1)*e;}   // ระหว่าง fade in ค่อย ๆ โน้มหัวไปหลัง
    if(age<GHE+GCH){const x=(age-GHE)/GCH;return GPB+(GPM-GPB)*x*x;}                   // ฟันลงเร่งความเร็ว
    const x=Math.min(1,(age-GHE-GCH)/GOUT);return GPM-0.45*(1-(1-x)*(1-x));};          // ฟันเลยไปแล้วชะลอ (แรงเฉื่อย)
  // หางเคียวเงา: แผ่นดำตามทางใบ (เฉพาะตอนฟัน → จางพร้อมตัว)
  const GTH=16,GTK=10,gtGeo=new THREE.BufferGeometry(),gtP=new Float32Array(GTH*GTK*3),gtC=new Float32Array(GTH*GTK*4),gtI=[];
  for(let i=0;i<GTH-1;i++)for(let k=0;k<GTK-1;k++){const a=i*GTK+k,b=(i+1)*GTK+k;gtI.push(a,b,a+1,b,b+1,a+1);}
  gtGeo.setAttribute('position',new THREE.BufferAttribute(gtP,3));gtGeo.setAttribute('color',new THREE.BufferAttribute(gtC,4));gtGeo.setIndex(gtI);
  const gTail=new THREE.Mesh(gtGeo,stScyInk());gTail.frustumCulled=false;gTail.renderOrder=7;gTail.visible=false;if(targets.length)root.add(gTail);
  const _gM=new THREE.Matrix4();
  const updGhostTail=(tg,age,roll,op,yaw)=>{if(!stScyLines){gTail.visible=false;return;}gTail.visible=true;
    for(let i=0;i<GTH;i++){const a=age-i*0.012;ghostAt(tg,ghostPhi(Math.max(GIN,a)),roll,yaw);ghostRot.updateMatrix();ghostScy.updateMatrix();_gM.multiplyMatrices(ghostRot.matrix,ghostScy.matrix);
      const live=a>=GHE?1:0,al=live*Math.pow(1-i/(GTH-1),1.3)*op;
      for(let k=0;k<GTK;k++){const tk=0.05+1.05*k/(GTK-1),[bx,by]=bladePt(Math.min(1,tk),0.35);_gp.set(bx,by+(tk>1?(tk-1)*0.6:0),0).applyMatrix4(_gM);const o=(i*GTK+k);
        gtP[o*3]=_gp.x;gtP[o*3+1]=_gp.y;gtP[o*3+2]=_gp.z;gtC[o*4+3]=al*Math.min(1,k/2)*(k===GTK-1?0.5:1);}}
    gtGeo.attributes.position.needsUpdate=true;gtGeo.attributes.color.needsUpdate=true;ghostAt(tg,ghostPhi(age),roll,yaw);};
  const updHits=T=>{gTail.visible=false;
    if(!ghostBuilt&&holder.children.length){ghostScy.add(holder.clone(true));ghostScy.traverse(o=>{if(o.isMesh){o.material=ghostMat;o.renderOrder=10;}});
      for(const m of [ink,flames,sheet,wrap]){const g=new THREE.Mesh(m.geometry,ghostInk);g.frustumCulled=false;g.renderOrder=m.renderOrder+3;ghostScy.add(g);}   // เปลว/หมึกบนเคียวเงา = ชุดเดียวกับเคียวจริง
      {const d=new THREE.InstancedMesh(drops.geometry,drops.material,drops.count);d.instanceMatrix=drops.instanceMatrix;d.frustumCulled=false;ghostScy.add(d);}
      ghostBuilt=true;}
    ghostRot.visible=false;
    targets.forEach((tg,i)=>{if(tg.updMark)tg.updMark(5,1e9);
      const h=lastHit(T,i),age=h?T-h.T:99;
      tg.cut(age,h?h.from:1);tg.a.b.rotation.x=-0.22*Math.exp(-age*9)*Math.min(1,age*40);   // สะดุ้ง
      if(!tg.marked)return;
      const vi=Math.round(h?h.T*100:0)%3,roll=[0,0.3,-0.3][vi],yaw=[0,0.75,-0.75][vi],PM=GPM,PB=GPB;   // PM = มุมที่ใบผ่านอกเป้า • PB = โน้มหลังสุดก่อนฟัน
      tg.gcut(age-(GHE+GCH),h?(roll<0?-1:1):1);   // รอยของเคียวเงา (แนวตั้ง/เฉียงตามการเอียง)
      if(!h||age<GIN||age>GHE+GCH+GOUT)return;
      const phi=ghostPhi(age);
      ghostAt(tg,phi,roll,yaw);ghostRot.visible=ghostBuilt;
      ghostMat.opacity=GOP*ez(GIN,GIN+0.1,age)*(1-ez(GHE+GCH,GHE+GCH+GOUT,age));ghostInk.opacity=ghostMat.opacity;updGhostTail(tg,age,roll,ghostMat.opacity/GOP,yaw);});
  };
  let trailSections;
  let baFxVisible=args.liveBA,baIdleTurn;
  const trailStep=.014,cutEnd=SW0+WU+SWP,trailHoldAt=cutEnd+.025;
  const groundCueAt=SW0+WU+SWP*.40**(1/2.2);
  const trailFadeAt=trailHoldAt+.30*ST_DARK_LIVE_BA.rate;
  const trailEnd=cutEnd+.12+(HH-1)*trailStep;
  const trailSamples=Array.from({length:HH},()=>({pos:new THREE.Vector3(),QB:new THREE.Quaternion(),act:0,shaft:true}));
  const groundTip=new THREE.Vector3();
  function groundBlade(space,pos,q,contact){
    const [x,y]=bladePt(1,.45);
    groundTip.set(x*S,y*S,0).applyQuaternion(q).add(pos);
    args.groundBA(space,groundTip,pos,contact);
  }
  let flPh=0,flLast=null;   // spine-flame phase: args.flameSpeed scales flow speed without jumps (Flow state)
  const update=(time,charge=0,drag=0,swingTime=time)=>{
    if(!voidFixed&&holder.children.length){fixVoid();voidFixed=true;}
    // รอบ 9: หยดหมึกตามสัน = ส่วนหนึ่งของ "เปลวหยักติดสัน" ในแบบ B → เปิดไว้
    const T=time??clock();
    flPh+=flLast==null?T:clamp(T-flLast,0,0.1)*(args.flameSpeed||1);flLast=T;
    const FT=flPh;
    slashPhase.value=FT;
    // ลอย + หมุนควงข้างตัว (หมุนรอบแกนด้ามช้า ๆ + โยกเบา ๆ)
    if(!args.manual){
      pivot.rotation.set(0.12*Math.sin(T*1.3),T*0.9,0.18+0.06*Math.sin(T*0.8));
      pivot.position.y=(args.lift??0.05)+0.08*Math.sin(T*1.7);
      const k=Math.floor(T/3.1),u=(T-k*3.1)/0.7;
      if(!BA&&u<1&&k%2===0)pivot.rotation.y+=Math.PI*2*u*u*(3-2*u);
    }
    if(standaloneBA){updCaster(T);updHits(T);}
    const swing=swingTime??T;
    const baActive=BA&&!(args.liveBA&&args.trailPose)&&(!(args.followUp||args.liveBA)||swing>=SW0);
    if(faceRibbon)faceRibbon.visible=false;
    if(baActive){const P=baPose(swing);if(P.w>0){Qi.setFromEuler(pivot.rotation);
      const returnAge=(swing-SW0)/ST_DARK_LIVE_BA.rate-ST_DARK_LIVE_BA.idleAfter;
      if(args.liveBA&&returnAge>=0){
        const idleTurn=baIdleTurn??={rest:new THREE.Quaternion(),offset:new THREE.Quaternion(),correction:new THREE.Quaternion()};
        if(!idleTurn.active){idleTurn.rest.copy(Qi);idleTurn.active=true;}
        const turn=ez(.15,ST_DARK_LIVE_BA.returnTime,returnAge);
        stDarkReturnRotation(pivot.quaternion,P.QB,idleTurn.rest,Qi,turn,idleTurn.offset,idleTurn.correction);
      }else{
        if(baIdleTurn)baIdleTurn.active=false;
        pivot.quaternion.copy(Qi).slerp(P.QB,P.w);
      }
      pivot.position.lerp(P.pos,P.w);}
      if(args.groundBA&&stScyLines&&swing>=SW0+WU&&swing<cutEnd+HOLD)groundBlade(root,pivot.position,pivot.quaternion,swing>=groundCueAt);
      const me=standaloneBA&&typeof PM3!=='undefined'&&PM3.get(NET.myId);if(me&&me.b){me.b.userData.scyY??=me.b.rotation.y;me.b.rotation.y=me.b.userData.scyY+P.tw;}   // ตัวบิดตามแรงเหวี่ยง

    }
    // Preserve the full slash briefly, then fade its trail without slowing the weapon.
    const trailTime=args.liveBA&&baActive?Math.min(swing,trailHoldAt)+.60*Math.max(0,swing-trailFadeAt):swing;
    const baEffects=baActive&&(!args.liveBA||trailTime<trailEnd||swing<cutEnd+HOLD+liveSplashSpread+splashLife);
    const showTrail=baEffects||!!args.trailPose;
    if(args.liveBA&&baFxVisible&&!showTrail){
      tail.visible=fringe.visible=shTail.visible=tailFlames.visible=tailSheet.visible=spinG.visible=false;
      if(tipFlecks)tipFlecks.visible=false;
      for(const fx of spinLines)fx.visible=false;
      for(const fx of splash)fx.visible=false;
      for(const fx of embers)fx.visible=false;
    }
    baFxVisible=showTrail;
    if(showTrail){
      // หาง (รอบ 2): คำนวณจากท่าฟันย้อนเวลา (ไม่พึ่งเฟรมที่วาด → ผืนต่อเนื่อง ไม่เป็นริ้ว) • โคนผืนทึบเรียบ ปลายหางแตกเป็นเปลว
      if(stScyLines){const trailWidth=args.trailWidth??1,Mt=new THREE.Matrix4(),Sv=new THREE.Vector3(S*trailWidth,S*trailWidth,S);
        const [midX,midY]=bladePt(.50,.45),trailCenter=new THREE.Vector3(midX,midY,0).multiplyScalar(S*(1-trailWidth));
        chargedFlakes?.(swing);
        const [tipX,tipY]=bladePt(1,0.45),[ttx,tty]=tan(1),acts=[];
        const sections=trailSections??=Array.from({length:HK},(_,k)=>{
          const tk=.05+1.07*k/(HK-1),e=(tk-1)*1.15;
          return {tk,edge:tk<=1?bladePt(tk,.45):[tipX+ttx*e,tipY+tty*e],spine:bladePt(tk,0)};
        });
        const sampleTrail=args.trailPose??baPose;
        let trailActive=false;
        for(let j=0;j<HH;j++){
          const sample=sampleTrail(trailTime-j*trailStep);
          const saved=trailSamples[j];
          saved.pos.copy(sample.pos);saved.QB.copy(sample.QB);
          saved.act=sample.act;saved.shaft=sample.shaft;
          if(saved.act>0&&args.groundBA&&baActive)groundBlade(trailRoot,saved.pos,saved.QB,false);
          if(sample.act>0)trailActive=true;
        }
        tail.visible=fringe.visible=tailFlames.visible=tailSheet.visible=trailActive;
        const shaftFade=args.liveBA&&baActive?.46*(1-ez(cutEnd+.08*ST_DARK_LIVE_BA.rate,cutEnd+.40*ST_DARK_LIVE_BA.rate,swing)):1;
        shTail.visible=trailActive&&shaftFade>0;
        if(faceRibbon&&baActive&&trailActive){
          faceRibbon.visible=true;
          const cut=bladePt(.74,.58);
          for(let j=0;j<HH;j++){
            const Pj=trailSamples[j],age=j/(HH-1),weight=Pj.act*(1-age)**.70;
            const point=_p.set(cut[0],cut[1],0).multiplyScalar(S).applyQuaternion(Pj.QB).add(Pj.pos);
            const pulse=Math.sin(T*19-j*.56);
            const taper=(.31+.33*Math.sin(Math.PI*Math.min(1,age*1.65)))*(.6+.4*weight)*(1+.045*pulse);
            for(let k=0;k<5;k++){
              const u=k/4,index=j*5+k,shade=k===3?.155+.018*pulse:k===2?.059+.017*pulse:.009;
              ribbonPos.setXYZ(index,point.x,point.y+taper*(2*u-1),point.z);
              ribbonColor.setXYZW(index,shade*.85,shade*.80,shade,weight*(k===0||k===4?0:k===3?.83:1));
            }
          }
          ribbonPos.needsUpdate=true;ribbonColor.needsUpdate=true;
        }
        let tipRow=-1,tipStrength=0;
        if(trailActive){
        for(let j=0;j<HH;j++){const Pj=trailSamples[j],age=j/(HH-1);Mt.compose(Pj.pos,Pj.QB,Sv);acts[j]=Pj.act;
          if(trailWidth!==1)Mt.setPosition(_p.copy(trailCenter).applyQuaternion(Pj.QB).add(Pj.pos));
          // หางด้าม: จากปลายล่างของด้ามขึ้นไปต่อกับโคนหางใบ
          if(shTail.visible){const [rx,ry]=bladePt(0.05,0.45);for(let k=0;k<SK;k++){const u=k/(SK-1);_p.set(rx*u,0.02+(ry-0.02)*u,0).applyMatrix4(Mt);const i3=j*SK+k;shpos[i3*3]=_p.x;shpos[i3*3+1]=_p.y;shpos[i3*3+2]=_p.z;
            const gy=0.30-0.18*u;shcol[i3*4]=shcol[i3*4+1]=shcol[i3*4+2]=gy;shcol[i3*4+3]=shaftFade*Math.min(1,Math.pow(1-age,1.2)*1.5)*Pj.act*Math.min(1,u/0.1+0.5)*(Pj.shaft===false?0:1);}}   // เทาเข้มที่ปลายล่าง → เกือบดำใกล้ใบ ทึบพอเห็นชัด แต่ไม่ดำสนิทเท่าใบ
          for(let k=0;k<HK;k++){const {tk,edge:[x,y]}=sections[k];_p.set(x,y,0).applyMatrix4(Mt);   // ปลายใบ: หางยื่นเลยปลายจริงไปอีกนิด
            const i2=j*HK+k,nz=Math.sin(k*1.7+T*9)*0.5+Math.sin(k*4.1-j*1.3+T*13)*0.5;
            tpos[i2*3]=_p.x;tpos[i2*3+1]=_p.y+(age>0.5?0.08*(age-0.5)*nz:0);tpos[i2*3+2]=_p.z;
            const body=Math.pow(1-age,args.liveBA?.82:1.2),flame=age<0.45?1:Math.max(0,Math.min(1,(nz+1.1-age*1.8)*2));   // ปลายหางขาดเป็นลิ้นไฟ (สุ่มตามคลื่น ไม่เป็นริ้ว)
            tcol[i2*4+3]=Math.min(1,body*(args.liveBA?1.95:1.5)*(tk>0.85?1.35:1))*flame*Pj.act*(tk<0.15?tk/0.15:1)*(tk>1?Math.max(0.35,1-(tk-1)*4):1);   // เฉพาะตอนฟัน • แนวปลายใบเข้มกว่า
            // แถบเปลวบนขอบหาง: จากแนวสันใบ ยกขึ้นเป็นลิ้นไฟหยัก
            {const [sx,sy]=sections[k].spine;_p.set(sx,sy,0).applyMatrix4(Mt);const hj=(0.12+0.22*Math.max(0,nz+0.3))*(0.5+0.5*(1-age))+(age>0.55?(age-0.55)*1.1*(0.5+0.5*Math.sin(k*2.3+T*14)):0);   // ปลายหางเปลวสูงขึ้น ลุกเป็นลิ้น
              f2pos[i2*3]=_p.x;f2pos[i2*3+1]=_p.y+hj*(j%2?1:0.25);f2pos[i2*3+2]=_p.z;   // แถวสลับสูง-ต่ำ = ลิ้นไฟ
              f2col[i2*4+3]=tcol[i2*4+3]*0.95;}}}
        tailGeo.attributes.position.needsUpdate=true;tailGeo.attributes.color.needsUpdate=true;fr2.attributes.position.needsUpdate=true;fr2.attributes.color.needsUpdate=true;
        if(shTail.visible){shGeo.attributes.position.needsUpdate=true;shGeo.attributes.color.needsUpdate=true;}
        // เปลวปลายหาง: แถวเก่าสุดที่ยังฟันอยู่ = ปลายหาง • ลิ้นไฟลุกขึ้นแบบเปลวปลายล่างของเคียว
        {let je=-1;for(let j=HH-1;j>=0;j--)if(acts[j]>0.25){je=j;break;}let rowA=0;if(je>=0)for(let k=0;k<HK;k++)rowA=Math.max(rowA,tcol[(je*HK+k)*4+3]);const aE=je<0?0:acts[je]*Math.min(1,rowA*1.6);   // จางตามหาง (บั๊ก: เปลวปลายหางค้างตามมาหลังหางจางหมด)
          if(args.liveBA&&baActive){tipRow=je;tipStrength=aE;}
          for(let q=0;q<TF;q++){const k=Math.min(HK-1,Math.round((q+0.5)/TF*(HK-1))),i2=Math.max(0,je)*HK+k,bx=tpos[i2*3],by=tpos[i2*3+1],bz=tpos[i2*3+2];
            const flick=0.6+0.4*Math.sin(T*(7+q%4)+q*1.9)*Math.sin(T*3.3+q),Hf=(0.3+0.25*Math.abs(Math.sin(q*2.9)))*flick*S*0.6;
            for(let i=0;i<TFP;i++){const u=i/(TFP-1),sw=Math.sin(T*6+q*1.3+u*3)*0.05*u*u,w=0.06*S*0.5*Math.pow(1-u,1.2)*(1+0.3*Math.sin(u*9+T*8+q));
              const a=(q*TFP+i)*2*3,c=(q*TFP+i)*2*4;tfpos[a]=bx-w+sw;tfpos[a+1]=by+Hf*u;tfpos[a+2]=bz;tfpos[a+3]=bx+w+sw;tfpos[a+4]=by+Hf*u;tfpos[a+5]=bz;
              tfcol[c+3]=tfcol[c+7]=je<0?0:Math.min(1,(1-u)*2.2)*Math.min(1,aE*1.5)*(k>HK*0.75?1:0.8);}}
          if(TF){tfGeo.attributes.position.needsUpdate=true;tfGeo.attributes.color.needsUpdate=true;}
          // แผ่นเปลวแบบสันใบ ลุกจากขอบปลายหางไปทางท้าย (สูตรเดียวกับแผ่นเปลวบนสัน: ลิ้นหยักวิ่ง + ลิ้นหลุดเป็นช่วง)
          for(let i=0;i<HK;i++){const tt=i/(HK-1),j0=Math.max(1,je),a3=(j0*HK+i)*3,b3=((j0-1)*HK+i)*3;
            let dx=tpos[a3]-tpos[b3],dy=tpos[a3+1]-tpos[b3+1],dz=tpos[a3+2]-tpos[b3+2];const dl=Math.hypot(dx,dy,dz)||1;dx/=dl;dy/=dl;dz/=dl;
            const bladeTip=args.liveBA&&baActive;
            const profile=stScySpineProfile(tt,bladeTip?FT:T,spineProfile),{cycle:cyc,gap}=profile;
            const outer=bladeTip?ez(.55,.91,tt):Math.min(1,tt/.08);
            const H=profile.height*S*(bladeTip?lerp(2.6,4.2,outer):2.6);
            for(let j=0;j<TER;j++){const v=j/(TER-1),h=H*v*(gap?(1+cyc*1.6):1),lean=0.05*v*v*Math.sin(T*4+tt*20),k3=(i*TER+j)*3,c4=(i*TER+j)*4;
              tepos[k3]=tpos[a3]+dx*h;tepos[k3+1]=tpos[a3+1]+dy*h+lean+0.06*v;tepos[k3+2]=tpos[a3+2]+dz*h;
              tecol[c4+3]=je<0?0:stScySpineOpacity(v,profile)*Math.min(1,aE*(bladeTip?2.2:1.5))*outer;}}
          teGeo.attributes.position.needsUpdate=true;teGeo.attributes.color.needsUpdate=true;}
        }
        // จานควง + เปลวรอบขอบ + เส้นเปลว 3 เส้น (เฉพาะช่วงควง)
        if(hasBASpin){const Ps=args.spinPose?args.spinPose(swing):baPose(swing),on=!!Ps&&Ps.spinIdx>=0,k=on?Math.sin(Math.PI*Math.min(1,Ps.spinU)):0;
          if(on){
            const yA=new THREE.Vector3(0,1,0).applyQuaternion(Ps.QB);
            if(Ps.spinCenter)spinG.position.copy(Ps.spinCenter);
            else spinG.position.copy(Ps.pos).addScaledVector(yA,1.1*S);
            if(Ps.inkOffset)spinG.position.add(Ps.inkOffset);
            if(Ps.inkPlane)spinG.quaternion.copy(Ps.inkPlane);
          }
          spinG.visible=on;if(on){spinInk&&spinInk(Ps.spinAngle??T*28,k*(Ps.inkStrength??1));spinFl&&spinFl(T*6,k);}else{spinInk&&spinInk(0,0);spinFl&&spinFl(0,0);}
          for(const L of spinLines){const U=L.userData;L.visible=on;if(!on)continue;L.position.copy(spinG.position);L.rotation.set(U.tilt[0],U.tilt[1]+(Ps.spinAngle??U.dir*T*22),U.tilt[2]);
            if(Ps.spinPlane)L.quaternion.premultiply(Ps.spinPlane);
            const appear=Math.min(1,Math.max(0,(Ps.spinU-U.ph*0.08)/0.25)),gone=1-Math.max(0,(Ps.spinU-0.55-U.ph*0.05)/0.35),al=Math.max(0,Math.min(appear,gone));
            for(let i=0;i<LSEG;i++){const u=i/(LSEG-1),a=u*Math.PI*1.25,rr=SPR*(1.02+0.05*U.ph),sp=Math.abs(((u*16-T*7+U.ph)%1+1)%1*2-1),fl=0.12*S*(0.25+1.1*Math.pow(1-sp,3));   // ยอดเปลวแหลม (ผู้ใช้ 2026-11-19: ไม่เอาโค้งมน)
              U.p[i*6]=Math.cos(a)*rr;U.p[i*6+1]=0;U.p[i*6+2]=Math.sin(a)*rr;U.p[i*6+3]=Math.cos(a)*(rr+fl);U.p[i*6+4]=0.02;U.p[i*6+5]=Math.sin(a)*(rr+fl);
              const w=Math.min(1,Math.sin(Math.PI*u)*1.4)*al*0.75;U.c[i*8+3]=w;U.c[i*8+7]=w*0.9;}
            U.g.attributes.position.needsUpdate=true;U.g.attributes.color.needsUpdate=true;}}
        // ละอองตอนควง: เกิดที่ปลายใบตอนควง แล้วพุ่งออกจากตัวพร้อมตก
        {const kc=Math.floor(swing/LOOP);for(let i=0;i<SPL;i++){const sp=splash[i],kk=args.liveBA?0:i%NSW,b0=kc*LOOP+SW0+kk*GAP+WU+SWP+HOLD+(args.liveBA?liveSplashSpread*i/SPL:SPIN*((i/NSW|0)/(SPL/NSW))),age=swing-b0,life=splashLife;
          sp.visible=age>=0&&age<=life;
          if(!sp.visible){sp.material.opacity=0;continue;}
          const Pb=baPose(b0),Mb=new THREE.Matrix4().compose(Pb.pos,Pb.QB,new THREE.Vector3(S,S,S)),[bx,by]=bladePt(0.7+0.3*rnd(i+300),0.3);_p.set(bx,by,0).applyMatrix4(Mb);
          const ox=_p.x,oz=_p.z,ol=Math.hypot(ox,oz)||1,vh=3.5+2.5*rnd(i+301);
          sp.position.set(_p.x+ox/ol*vh*age+(rnd(i+302)-0.5)*age*2,_p.y+(1.2+rnd(i+303))*age-4.5*age*age,_p.z+oz/ol*vh*age);
          const sz=(0.2+0.18*rnd(i+304))*S*(1-age/life*0.5);sp.scale.set(sz,sz*1.3,1);sp.material.opacity=0.9*(1-age/life);}}
        if(tipFlecks){
          tipFlecks.visible=tipRow>=0&&tipStrength>.012;
          if(tipFlecks.visible){
            for(let e=0;e<FLECKS;e++){
              const row=Math.max(0,tipRow-Math.round(rnd(e+82)*10));
              const k=Math.round((HK-1)*(.78+.22*rnd(e+83))),a=(row*HK+k)*3;
              const inner=(row*HK+Math.floor((HK-1)*.58))*3;
              const phase=(FT*(1.55+rnd(e+91)*.5)+rnd(e+84))%1;
              const dx=tpos[a]-tpos[inner],dz=tpos[a+2]-tpos[inner+2],length=Math.hypot(dx,dz)||1;
              const outward=phase*(.85+1.35*rnd(e+85))/length,spread=phase*(rnd(e+87)-.5)*1.1/length;
              const rise=phase*(1.65+1.4*rnd(e+86))-.53*phase*phase;
              fleckPose.position.set(tpos[a]+dx*outward-dz*spread,tpos[a+1]+rise,tpos[a+2]+dz*outward+dx*spread);
              const size=(.063+.089*rnd(e+88))*Math.pow(Math.sin(phase*Math.PI),.55);
              fleckPose.scale.set(size,size*(1.5+rnd(e+89)),size*.62);
              fleckPose.rotation.set(e+phase*4,phase*5,e*.8-phase*3);
              fleckPose.updateMatrix();
              tipFlecks.setMatrixAt(e,fleckPose.matrix);
            }
            tipFlecks.material.opacity=Math.min(.94,tipStrength*2.6);
            tipFlecks.instanceMatrix.needsUpdate=true;
          }
        }
        for(let e=0;e<EMB;e++){const sp=embers[e],ph=(T*1.4+rnd(e+80))%1;
          const j=Math.min(HH-1,Math.floor(HH*(0.55+0.4*rnd(e+81)))),k=Math.floor(rnd(e+82)*HK),i2=j*HK+k;
          const al=f2col[i2*4+3];sp.visible=trailActive&&al>0;if(!sp.visible){sp.material.opacity=0;continue;}sp.position.set(f2pos[i2*3]+Math.sin(T*3+e)*0.15*ph,f2pos[i2*3+1]+0.2+ph*1.1,f2pos[i2*3+2]+Math.cos(T*2+e)*0.15*ph);
          const sz=(0.12+0.12*rnd(e+83))*(1-ph*0.6);sp.scale.set(sz,sz*1.5,1);sp.material.opacity=Math.min(1,al*2)*Math.sin(ph*Math.PI);}}}
    if(!stScyLines)return;
    // ---------- หมึกไหลตามใบแล้วม้วนหลุด ----------
    for(let s=0;s<N;s++){
      const d=strands[s],life=1.6/d.sp,age=((FT*d.sp*0.62+d.ph)%1);   // FT = flame phase (faster in Flow)   // 0..1 วงจรชีวิตของเส้น
      const head=age*1.15;                                           // หัวเส้นเดินจากโคน → เลยปลาย
      for(let i=0;i<P;i++){
        const u=i/(P-1),tt=head-u*0.32;                              // หางตามหลังหัว
        const tc=Math.min(1,Math.max(0,tt));
        let [x,y]=bladePt(tc,d.k*(1-0.6*tc));
        const [tx,ty]=tan(tc);
        const peel=Math.max(0,tt-d.peel*0.6)/0.5;                    // ช่วงท้ายของเส้นม้วนหลุดออกจากสัน (ขึ้นด้านนอกใบ)
        const HUG=false,CUT=args.wrap==='C',CAP=false;   // รอบ 9 (ผู้ใช้เลือกในรูปวง): เก็บ "1 เปลวหยักติดสัน" ของแบบ B • ตัด "2 พลูมพุ่งขวาบน" = ช่วงที่ม้วนหลุดออกจากสัน   // รอบ 8: C = เปลวบนใบแบบ B ทุกอย่าง แต่ห้ามลอยสูงเกินตัวใบ (ไม่เอาออร่าด้านบน)   // รอบ 5: ใช้หมึกชุดเดิม (แบบ B) ทุกอย่าง แค่ตัดช่วงที่ปลิวออกไปไกลทิ้ง
        const offRaw=HUG?Math.min(0.09,peel*0.12)*(0.6+0.4*Math.sin(T*6+s+u*5)):peel*peel*(0.45+0.35*d.curl);   // C: เปลวสั้นแนบสัน สะบัดเบา ๆ
        const off=CAP?0.13*Math.tanh(offRaw/0.13):offRaw;   // C: ยอดเปลวสูงได้ไม่เกิน ~0.13 จากสัน
        x+=-ty*off+tx*peel*0.08;y+=tx*off;
        const curl=Math.sin(u*6+T*4+d.ph*6)*0.05*(0.3+peel);
        const z=CAP?d.side*(0.03+Math.min(peel,0.6)*0.12+curl):HUG?d.side*(0.01+0.02*Math.abs(curl)*10):d.side*(0.03+peel*0.28+curl*2);
        const w=d.w*(1-u)*(0.4+0.6*Math.sin(Math.min(1,age*3)*Math.PI/2))*(1-Math.max(0,age-0.82)/0.18);
        const a=(s*P+i)*2*3,c=(s*P+i)*2*4;
        pos[a]=x+ty*w;pos[a+1]=y-tx*w;pos[a+2]=z;pos[a+3]=x-ty*w;pos[a+4]=y+tx*w;pos[a+5]=z;
        const al=(1-u*0.7)*(tt<0?0:1)*Math.min(1,(1-age)*4)*(CUT?Math.max(0,1-Math.max(0,peel-0.12)/0.1):1);   // C: ส่วนที่ม้วนหลุดไกล (แผ่นลอย) จางหาย
        col[c+3]=al;col[c+7]=al;
      }
    }
    inkGeo.attributes.position.needsUpdate=true;inkGeo.attributes.color.needsUpdate=true;
    // ---------- แผ่นเปลวจากสัน: ยอดเป็นลิ้นไฟหยัก วิ่งตามใบ • มี "ลิ้นหลุด" เป็นช่วง ๆ (ช่องว่างวิ่งขึ้น แล้วโคนลุกใหม่) ----------
    for(let i=0;i<SHC;i++){
      const tt=0.03+0.9*i/(SHC-1),[sx,sy]=bladePt(tt,0.0),[tx,ty]=tan(tt),nx=-ty,ny=tx;
      const profile=stScySpineProfile(tt,FT,spineProfile),{cycle:cyc,gap}=profile;
      const H=profile.height*(1-0.45*tt)*(1+1.65*charge);
      for(let j=0;j<SR;j++){
        const v=j/(SR-1),lean=0.025*v*v*Math.sin(FT*4+tt*20);
        const h=H*v*(gap?(1+cyc*1.6):1);
        const k=(i*SR+j)*3,c=(i*SR+j)*4;
        spos[k]=sx+nx*h-tx*0.03*v+(-ny)*lean;spos[k+1]=sy+ny*h+tx*lean;spos[k+2]=-h*v*drag;
        scol[c+3]=stScySpineOpacity(v,profile);
      }
    }
    if(SHC){sGeo.attributes.position.needsUpdate=true;sGeo.attributes.color.needsUpdate=true;}
    // ---------- เปลวดำจากสัน ----------
    for(let f=0;f<0;f++){   // (ปิด: เปลวสันแบบรอบ 6 ไม่ใช้แล้ว — flames ใช้กับปลายหมึกด้ามแทน)
      const tt=0.04+0.86*f/(FN-1)+0.01*Math.sin(f*7.3),[sx,sy]=bladePt(tt,0.0),[tx,ty]=tan(tt);
      let nx=-ty,ny=tx;const L0=Math.hypot(nx*0.55,ny*0.55+0.45)||1;const dx=nx*0.55/L0,dy=(ny*0.55+0.45)/L0;   // ชี้ออกจากสัน + เอียงขึ้นฟ้า
      const flick=0.6+0.4*Math.sin(T*(7+f%5)+f*1.9)*Math.sin(T*3.1+f),H=(0.13+0.17*Math.abs(Math.sin(f*2.17)))*(1-0.35*tt)*flick,W0=(0.03+0.025*Math.abs(Math.sin(f*3.3)))*(1-0.3*tt);
      for(let i=0;i<FP;i++){
        const u=i/(FP-1),sw=Math.sin(T*6+f*1.3+u*3)*0.05*u*u+Math.sin(T*2+f)*0.02*u;
        const cx=sx+dx*H*u+(-dy)*sw-tx*0.04*u*u,cy=sy+dy*H*u+dx*sw;
        const w=W0*Math.pow(1-u,1.3)*(1+0.3*Math.sin(u*9+T*8+f));
        const a=(f*FP+i)*2*3,c=(f*FP+i)*2*4;
        fpos[a]=cx-dy*w;fpos[a+1]=cy+dx*w;fpos[a+2]=0;fpos[a+3]=cx+dy*w;fpos[a+4]=cy-dx*w;fpos[a+5]=0;
        fcol[c+3]=fcol[c+7]=Math.min(1,(1-u)*2.2);
      }
    }
    if(FN){fGeo.attributes.position.needsUpdate=true;fGeo.attributes.color.needsUpdate=true;}
    // ---------- ออร่าควันดำลอยขึ้นจากใบ ----------
    for(let k=0;k<AURA;k++){
      const sp=aura[k],life=1.4+rnd(k+60)*0.9,ph=((T/life)+rnd(k+61))%1,tt=0.05+rnd(k+62)*0.85,kk=rnd(k+63)*0.55;
      const [x,y]=bladePt(tt,0.0);   // เศษหลุดจากปลายเปลว (ออกจากสันจริง ๆ)
      const rise=0.12+ph*(0.45+rnd(k+64)*0.35);
      sp.position.set(x+0.06*Math.sin(T*1.3+k)*ph-ph*0.08,y+rise,(rnd(k+65)-0.5)*0.12+0.05*Math.sin(T+k)*ph);
      const sz=(0.035+rnd(k+66)*0.04)*(1-ph*0.6);sp.scale.set(sz,sz*1.6,1);
      sp.material.opacity=Math.sin(ph*Math.PI)*0.85;
    }
    // ---------- หยดหมึกหลุดจากสัน ----------
    for(let k=0;k<DROPS;k++){
      const ph=(T*0.7+rnd(k+40))%1,tt=0.15+rnd(k+41)*0.8,[x,y]=bladePt(tt,0.02),[tx,ty]=tan(tt);
      const fly=ph*0.5*(1+charge*.62);v.set(x-ty*fly*0.9+tx*fly*0.3,y+tx*fly*0.9-fly*fly*0.8,(rnd(k+42)-0.5)*0.3*ph-drag*fly);
      const sc=(1-ph)*(0.6+rnd(k+43));SC.set(sc,sc*(1.4+ph),sc);M4.compose(v,Q,SC);drops.setMatrixAt(k,M4);
    }
    drops.instanceMatrix.needsUpdate=true;
    // ---------- พันด้าม 3 จุด ----------
    const [z0,z1]=stScyLines.shaft;
    if(WS==='C'){   // รอบ 11 (ผู้ใช้): หมึก 3 ช่วงเว้นระยะ • พลิ้วในตัวเอง ไม่หมุน • หนา-บางแบบพู่กัน (ref scythe_ink_ref.png) • ปลายบนสะบัดเป็นเปลวดำ texture เดียวกับใบ
      for(let s=0;s<WR;s++){
        const zb=z0-0.25,zt=z1+0.05;   // รอบ 12 (ref scythe_ink_ref.png): เส้นเดียวจากปลายล่างขึ้นถึงใต้หัว • ห่วงใหญ่ซ้าย-ขวาตัดผ่านด้าม (ล่างกว้าง บนแคบ) • บนสุดม้วนก้นหอย
        let ex=0,ey=0,ez=0,etx=0,ety=1,etz=0;
        for(let i=0;i<WP;i++){
          const u=i/(WP-1),a=0;
          let yy=zb+(zt-zb)*u+0.02*Math.sin(T*1.3+u*6);
          // รอบ 13 (ผู้ใช้: "ขยับในตัวเอง ไม่ใช่แค่หมุน"): คลื่นวิ่งไปตามเส้น • ห่วงยืด-หดเปลี่ยนรูปทีละห่วง • ก้นหอยม้วนเข้า-คลาย
          const amp=(0.26*(1-u)+0.07)*(0.8+0.25*Math.sin(T*1.3-u*4));                       // ห่วงพอง-ยุบไม่พร้อมกัน (ไล่จากล่างขึ้นบน)
          const ph=u*Math.PI*3.2+0.5+0.45*Math.sin(T*0.9-u*2.5);                              // ห่วงเลื่อนตำแหน่ง/บิดรูปไปมา
          let x=amp*Math.sin(ph)+0.035*Math.sin(u*14-T*3.2)*(0.4+u)+0.012*Math.sin(T*2.1+u*11),zf=0.05*Math.cos(ph)+0.03*Math.sin(u*9-T*2.4);   // คลื่นเล็กวิ่งขึ้นตามเส้น
          yy+=0.03*Math.sin(u*10-T*2.6);
          if(u>0.86){const k=(u-0.86)/0.14,sa=k*(7+2.5*Math.sin(T*1.1)),sr=0.07*(1-k*0.8);x=x*(1-k)+Math.sin(sa)*sr;yy=yy+(Math.cos(sa)-1)*sr*0.6;}   // ก้นหอยม้วนเข้า-คลาย
          const tip=Math.min(1,u/0.12,(1-u)/0.05),thick=0.3+0.85*Math.pow(Math.abs(Math.sin(u*Math.PI*2.2+s-T*1.6)),0.7);   // หนา-บางไหลขึ้นตามเส้น
          const w=0.016*thick*tip;   // บางลง
          const b=(s*WP+i)*2*3,c=(s*WP+i)*2*4;
          wpos[b]=x-Math.sin(a)*w*0.4;wpos[b+1]=yy-w;wpos[b+2]=zf+Math.cos(a)*w*0.4;wpos[b+3]=x+Math.sin(a)*w*0.4;wpos[b+4]=yy+w;wpos[b+5]=zf-Math.cos(a)*w*0.4;
          wcol[c+3]=wcol[c+7]=1;
          if(i===Math.round(WP*0.12)){ex=x;ey=yy;ez=zf;}   // เปลวดำสะบัดจากช่วงล่าง (ใน ref มีเปลวเล็กตรงห่วงล่าง)
        }
        // เปลวดำที่ปลายบนของเส้น (ลิ้นไฟหยักแบบเดียวกับใบ สะบัดขึ้น)
        if(s<FN)for(let i=0;i<FP;i++){
          const u=i/(FP-1),flick=0.65+0.35*Math.sin(T*(6+s)+s*1.9)*Math.sin(T*2.7+s),H=(0.12+0.05*s)*flick;
          const sw=Math.sin(T*6+s*1.3+u*3)*0.035*u*u+Math.sin(T*2+s)*0.015*u;
          const cx=ex+0.05*u+sw,cy=ey+H*u,cz=ez;
          const w=0.03*Math.pow(1-u,1.2)*(1+0.3*Math.sin(u*9+T*8+s));
          const a=(s*FP+i)*2*3,c=(s*FP+i)*2*4;
          fpos[a]=cx-w;fpos[a+1]=cy;fpos[a+2]=cz;fpos[a+3]=cx+w;fpos[a+4]=cy;fpos[a+5]=cz;
          fcol[c+3]=fcol[c+7]=Math.min(1,(1-u)*2.2);
        }
      }
      // รอบ 15 (ผู้ใช้): เปลวดำที่ปลายล่าง — ลิ้นไฟหยักงอกจากการ์ดเพชร/หนามล่าง ลุกขึ้นแบบเดียวกับเปลวบนใบ (สะบัด ยาว-สั้นไม่พร้อมกัน บางลิ้นหลุดแล้วลุกใหม่)
      if(!args.shaftInk)for(let f=0;f<FN;f++){
        const ang=f/FN*Math.PI*2+0.3*Math.sin(f*2.3),r0=0.03+0.04*Math.abs(Math.sin(f*1.7)),y0=0.02+0.4*((f*0.37)%1);
        const cyc=(T*1.1+f*0.31)%1,lift=cyc>0.75?(cyc-0.75)*0.8:0;   // ช่วงท้ายของรอบ ลิ้นหลุดลอยขึ้น
        const flick=0.6+0.4*Math.sin(T*(7+f%4)+f*1.9)*Math.sin(T*3.3+f),H=(0.26+0.22*Math.abs(Math.sin(f*2.9)))*flick;
        for(let i=0;i<FP;i++){
          const u=i/(FP-1),sw=Math.sin(T*6+f*1.3+u*3)*0.03*u*u;
          const lean=(0.16+0.06*Math.sin(T*1.3+f))*u*u;   // ผู้ใช้อนุมัติ: เปลวเผาขึ้นเอียงไปทางเดียวกับใบ (+x)
          const rr=r0*(1-0.5*u),cx=Math.cos(ang)*rr+sw*Math.cos(ang+1.6)+lean,cz=Math.sin(ang)*rr+sw*Math.sin(ang+1.6),cy=y0+lift+H*u*(1-0.15*u);
          const w=0.045*Math.pow(1-u,1.2)*(1+0.3*Math.sin(u*9+T*8+f));
          const a=(f*FP+i)*2*3,c=(f*FP+i)*2*4;
          fpos[a]=cx-Math.sin(ang)*w;fpos[a+1]=cy;fpos[a+2]=cz+Math.cos(ang)*w;fpos[a+3]=cx+Math.sin(ang)*w;fpos[a+4]=cy;fpos[a+5]=cz-Math.cos(ang)*w;
          fcol[c+3]=fcol[c+7]=Math.min(1,(1-u)*2.2)*(lift>0?Math.max(0,1-lift*4):1);
        }
      }
      if(FN){fGeo.attributes.position.needsUpdate=true;fGeo.attributes.color.needsUpdate=true;}
    }
    else if(WS==='C_old')for(let s=0;s<WR;s++){   // แบบ C (ref 35.png): 2 เส้นหมึกเรียบ หนา-บางแบบพู่กัน ห่วงใหญ่ออกนอกด้ามแล้ววกกลับ • บนสุดม้วนเป็นวงก้นหอย • ปลายสะบัดเหมือนเปลว
      const zt=(stScyLines.top||2.2)-0.15,zb=z0-0.35;
      for(let i=0;i<WP;i++){
        const u=i/(WP-1),zz=zb+(zt-zb)*u+0.03*Math.sin(T*1.8+u*6+s*3),flow=0.04*Math.sin(T*0.5+s);   // ห่วงเลื่อนขึ้นช้า ๆ (รอบ 3: นิ่งขึ้น)
        const bulge=Math.pow(Math.max(0,Math.sin((u-flow)*Math.PI*(s?2.0:2.6)+s*1.3+0.35*Math.sin(T*0.7+s))),1.6);   // ห่วงใหญ่ 2–3 ห่วง เลื่อนขึ้นไปตามเวลา
        let a=u*(s?1.4:1.9)*Math.PI*2+s*Math.PI+0.12*Math.sin(T*0.7+u*3+s);   // รอบ 6: ไม่หมุนไปมา — พลิ้วในตัวเองเบา ๆ   // หมุนรอบด้ามช้า ๆ + พลิ้วเบา ๆ
        let rr=0.035+0.34*bulge*(0.85+0.15*Math.sin(T*1.1+s*2))+0.015*Math.sin(T*1.7+u*9);   // ห่วงหายใจเข้าออกช้า ๆ
        let x=Math.cos(a)*rr,zf=Math.sin(a)*rr,yy=zz;
        if(u>0.9){const k=(u-0.9)/0.1,sa=a+k*7,sr=0.11*(1-k*0.85);x=Math.cos(sa)*sr;zf=Math.sin(sa)*sr;yy=zt+0.08*k;}   // ก้นหอยบนสุด
        const tip=Math.min(1,u/0.07,(1-u)/0.03),thick=(0.25+0.9*Math.pow(Math.abs(Math.sin(u*Math.PI*5+s*0.9+T*0.8)),0.7));   // หนา-บางเป็นจังหวะแบบพู่กัน
        const w=0.04*thick*tip;
        const b=(s*WP+i)*2*3,c=(s*WP+i)*2*4;
        wpos[b]=x-Math.sin(a)*w*0.4;wpos[b+1]=yy-w;wpos[b+2]=zf+Math.cos(a)*w*0.4;wpos[b+3]=x+Math.sin(a)*w*0.4;wpos[b+4]=yy+w;wpos[b+5]=zf-Math.cos(a)*w*0.4;
        wcol[c+3]=wcol[c+7]=1;
      }
    }
    else if(WS==='B')for(let s=0;s<WR;s++){   // เส้นยาวพันหลวมทั้งด้าม
      const zt=stScyLines.top||2.2;
      for(let i=0;i<WP;i++){
        const u=i/(WP-1),zz=z0-0.25+(zt-z0+0.35)*u+0.03*Math.sin(T*2+s);
        const a=u*(3.2+s*0.7)*Math.PI*2+T*(0.7+0.25*s)+s*2.1;
        const loop=Math.max(0,Math.sin(u*Math.PI*(2.5+s)+T*0.6+s));
        const rr=0.06+0.26*loop*loop+0.06*Math.sin(u*11+T*1.3+s);
        const x=Math.cos(a)*rr,zf=Math.sin(a)*rr;
        const tip=Math.min(1,u/0.06,(1-u)/0.12);
        const w=0.032*(0.4+0.8*Math.abs(Math.sin(u*7+s)))*tip;
        const b=(s*WP+i)*2*3,c=(s*WP+i)*2*4;
        wpos[b]=x+Math.sin(a)*w;wpos[b+1]=zz-w*0.6;wpos[b+2]=zf-Math.cos(a)*w;wpos[b+3]=x-Math.sin(a)*w;wpos[b+4]=zz+w*0.6;wpos[b+5]=zf+Math.cos(a)*w;
        wcol[c+3]=wcol[c+7]=Math.min(1,tip*1.5);
      }
    }
    else for(let s=0;s<WR;s++){
      const zc=z0+(z1-z0)*(0.25+0.3*s)+0.05*Math.sin(T+s),R=0.045,turns=2.3;
      for(let i=0;i<WP;i++){
        const u=i/(WP-1),a=u*turns*Math.PI*2+T*(1.5+0.4*s)+s*2,zz=zc+(u-0.5)*0.28;
        const loose=Math.max(0,u-0.75)/0.25,rr=R+loose*0.1*(1+Math.sin(T*3+s));
        const x=Math.cos(a)*rr,zf=Math.sin(a)*rr,w=0.012*(1-loose*0.8)*(u<0.1?u/0.1:1);
        const b=(s*WP+i)*2*3,c=(s*WP+i)*2*4;
        wpos[b]=x;wpos[b+1]=zz-w;wpos[b+2]=zf;wpos[b+3]=x;wpos[b+4]=zz+w;wpos[b+5]=zf;
        wcol[c+3]=wcol[c+7]=1-loose*0.6;
      }
    }
    wrapGeo.attributes.position.needsUpdate=true;wrapGeo.attributes.color.needsUpdate=true;
  };
  // อัปเดตทุกเฟรมผ่าน onBeforeRender (ไม่ต้องแก้ studio.js)
  if(!args.manual){
    ink.onBeforeRender=()=>update();
    update();
  }
  return {pivot,blade:scy,model:holder,update,liveHandPose};
}
