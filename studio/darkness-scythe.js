// Studio-only: Darkness floating scythe + dark-matter ink (ผู้ใช้ 2026-11-18, ref designs/darkness_ref/scythe_void_ref.png)
// เคียวลอยหมุนควงเบา ๆ ข้างตัว • ชั้นบนของใบดำสนิท (unlit) • เส้นหมึกดำไหลตามใบจากโคนไปปลายแล้วม้วนหลุดออกจากสัน + หยดเล็ก ๆ
// • เส้นหมึกพันด้าม 3 จุด • ค่อนข้างเยอะจนกลบทรงได้บ้าง • fx: assets/fx/darkness/scythe_idle.fx.json
const ST_SCY_LINES='assets/vfx/dark_scythe.lines.json';
let stScyLines=null;
if(typeof loadModel==='function')loadModel('dark_scythe');   // โหลดล่วงหน้า (contact sheet ถ่ายทันที)
fetch(ST_SCY_LINES).then(r=>r.ok?r.json():null).then(j=>{stScyLines=j;}).catch(()=>{});

function stScyInk(){   // วัสดุหมึก: ดำสนิทไม่รับแสง โปร่งตามจุดยอด
  return new THREE.MeshBasicMaterial({color:0x000000,transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexColors:true,toneMapped:false});
}

FXCODE.studio_darkness_scythe=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  anchor.inner.visible=false;
  const root=new THREE.Group();root.name='Darkness scythe preview';
  anchor.obj.add(root);
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{disposeTree(root);root.clear();root.removeFromParent();});
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
  const sheet=new THREE.Mesh(sGeo,stScyInk());sheet.frustumCulled=false;sheet.renderOrder=8;scy.add(sheet);
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
  const BA=args.mode==='ba',CYC=args.cycle||2.0,idlePos=pivot.position.clone(),S0=S;
  const HK=22,HH=30,tailGeo=new THREE.BufferGeometry(),tpos=new Float32Array(HK*HH*3),tcol=new Float32Array(HK*HH*4),tidx=[];
  for(let j=0;j<HH-1;j++)for(let k=0;k<HK-1;k++){const a=j*HK+k,b=(j+1)*HK+k;tidx.push(a,b,a+1,b,b+1,a+1);}
  tailGeo.setAttribute('position',new THREE.BufferAttribute(tpos,3));tailGeo.setAttribute('color',new THREE.BufferAttribute(tcol,4));tailGeo.setIndex(tidx);
  const tail=new THREE.Mesh(tailGeo,stScyInk());tail.frustumCulled=false;tail.renderOrder=7;if(BA)root.add(tail);
  // ขอบบนของหาง = แถบเปลว (ผู้ใช้: "ด้านบนของหางมีเปลว ด้านล่างเป็นหางปกติ")
  const fr2=new THREE.BufferGeometry(),f2pos=new Float32Array(HK*HH*3),f2col=new Float32Array(HK*HH*4);fr2.setAttribute('position',new THREE.BufferAttribute(f2pos,3));fr2.setAttribute('color',new THREE.BufferAttribute(f2col,4));fr2.setIndex(tidx);
  const fringe=new THREE.Mesh(fr2,stScyInk());fringe.frustumCulled=false;fringe.renderOrder=7;if(BA)root.add(fringe);
  // ถ่านดำหลุดจากปลายหาง
  const EMB=BA?28:0,embTex=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(0,0,0,1)');r.addColorStop(0.6,'rgba(0,0,0,0.8)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,32,32);return new THREE.CanvasTexture(c);})();
  const embers=[...Array(EMB)].map(()=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:embTex,color:0x000000,transparent:true,depthWrite:false,toneMapped:false}));sp.renderOrder=8;root.add(sp);return sp;});
  // หางด้าม (ผู้ใช้ 2026-11-19): ชั้นจางกว่า ต่อติดกับหางใบ ตามทางที่ด้ามผ่านจริง
  const SK=10,shGeo=new THREE.BufferGeometry(),shpos=new Float32Array(SK*HH*3),shcol=new Float32Array(SK*HH*4),shidx=[];
  for(let j=0;j<HH-1;j++)for(let k=0;k<SK-1;k++){const a=j*SK+k,b=(j+1)*SK+k;shidx.push(a,b,a+1,b,b+1,a+1);}
  shGeo.setAttribute('position',new THREE.BufferAttribute(shpos,3));shGeo.setAttribute('color',new THREE.BufferAttribute(shcol,4));shGeo.setIndex(shidx);
  const shMat=stScyInk();shMat.color.set(0xffffff);const shTail=new THREE.Mesh(shGeo,shMat);shTail.frustumCulled=false;shTail.renderOrder=6;if(BA)root.add(shTail);   // ด้าม = เทาเข้มใกล้ใบ → เทาอ่อนทางปลายล่าง (ผู้ใช้ 2026-11-19) — เดิมคอมเมนต์ทับโค้ด ทำให้หางด้ามไม่เคยถูกใส่ในฉาก
  // เปลวที่ปลายหาง (ผู้ใช้ 2026-11-19): ลิ้นไฟหยักแบบเดียวกับเปลวปลายล่างของเคียว งอกจากปลายหางที่ยังเห็นอยู่
  const TF=BA?12:0,TFP=10,tfGeo=new THREE.BufferGeometry(),tfpos=new Float32Array(Math.max(1,TF)*TFP*2*3),tfcol=new Float32Array(Math.max(1,TF)*TFP*2*4),tfidx=[];
  for(let q=0;q<TF;q++)for(let i=0;i<TFP-1;i++){const a=(q*TFP+i)*2;tfidx.push(a,a+1,a+2,a+1,a+3,a+2);}
  tfGeo.setAttribute('position',new THREE.BufferAttribute(tfpos,3));tfGeo.setAttribute('color',new THREE.BufferAttribute(tfcol,4));tfGeo.setIndex(tfidx);
  const tailFlames=new THREE.Mesh(tfGeo,stScyInk());tailFlames.frustumCulled=false;tailFlames.renderOrder=9;if(BA)root.add(tailFlames);
  const hist=[];const _p=new THREE.Vector3(),MB=new THREE.Matrix4(),vX=new THREE.Vector3(),vY=new THREE.Vector3(),vZ=new THREE.Vector3(),QB=new THREE.Quaternion(),Qi=new THREE.Quaternion();
  const ez=(a,b,t)=>{t=Math.min(1,Math.max(0,(t-a)/(b-a)));return t*t*(3-2*t);};
  const baPose=T=>{   // รอบ 4 (ผู้ใช้): วงฟันโค้งตามระยะ (รัศมีคงที่ตอนกวาด) • ซ้าย/ขวาสลับ • ก่อนฟัน: ดึงเข้าตัว ควง 1 รอบ → พุ่งออกไปถึงระยะ → ค้างสะสมแรง → กวาด
    const kc=Math.floor(T/CYC),dir=kc%2?-1:1,t=T-kc*CYC;
    const P1=0.22,P2=0.2,H=0.1,S=0.26,F=0.2,R=0.45;   // ดึงเข้า+ควง • พุ่งออก • ค้าง • กวาด • ส่งตามแรง • กลับ
    const eIn=x=>x*x*x,eOut=x=>1-Math.pow(1-x,3),A=1.05;   // ผู้ใช้ 2026-11-19: วงโค้งกลมด้านหน้า ไม่ถึง 180° (เดิม 1.8 = กวาดเกือบครบวง)
    let ang,w,tw,out,spin=0,shake=0;
    if(t<P1){const u=ez(0,P1,t);ang=-0.2+0.9*u;w=u;tw=0.25*u;out=0.0;spin=Math.PI*2*u;}                      // ดึงเข้าใกล้ตัว + ควงตัวเอง
    else if(t<P1+P2){const u=eOut((t-P1)/P2);ang=0.7+(A-0.7)*u;w=1;tw=0.25+0.35*u;out=u;}                    // พุ่งออกไปถึงระยะ ไปจุดเริ่มฟัน
    else if(t<P1+P2+H){ang=A;w=1;tw=0.6;out=1;shake=Math.sin(t*90)*0.04;}                                     // ค้างสะสมแรง สั่นนิด ๆ
    else if(t<P1+P2+H+S){const u=eIn((t-P1-P2-H)/S);ang=A-2*A*u;w=1;tw=0.6-1.35*u;out=1;}                    // กวาดเร่งขึ้น รัศมีคงที่ = วงโค้งตามระยะ
    else if(t<P1+P2+H+S+F){const u=eOut((t-P1-P2-H-S)/F);ang=-A-0.2*u;w=1;tw=-0.75-0.1*u;out=1-0.15*u;}       // ส่งตามแรงแล้วช้าลง
    else{const u=ez(P1+P2+H+S+F,P1+P2+H+S+F+R,t);ang=-A-0.2;w=1-u;tw=-0.85*(1-u);out=0.85*(1-u);}            // กลับข้างตัว
    // act = กำลังฟัน (ผู้ใช้ 2026-11-19: หางขึ้นเฉพาะตอนเหวี่ยงฟัน/ทำท่า ไม่ตามตลอด)
    const tS=P1+P2+H,act=t<tS?0:t<tS+S?Math.min(1,(t-tS)/0.04):t<tS+S+F?1-0.35*(t-tS-S)/F:Math.max(0,0.65*(1-(t-tS-S-F)/0.12));
    ang*=dir;tw*=dir;
    const f=new THREE.Vector3(0,0,1),r=new THREE.Vector3(-1,0,0);   // anchor: +z หน้า, −x ขวา
    const rad=new THREE.Vector3().copy(f).multiplyScalar(Math.cos(ang)).addScaledVector(r,Math.sin(ang)).normalize();
    const mot=new THREE.Vector3().copy(f).multiplyScalar(-Math.sin(ang)).addScaledVector(r,Math.cos(ang)).multiplyScalar(-dir).normalize();   // ทิศกวาด (สลับตามรอบ)
    // ผู้ใช้ 2026-11-19: เคียวหันไปข้างหน้าตลอด = ด้ามชี้ออกจากตัวตามแนวรัศมี ปลายใบนำทางกวาด → ด้ามกวาดเป็นผืนกว้าง หางด้ามเห็นชัด (เดิมด้ามนอนตามทางกวาด หางเลยเป็นเส้นบาง)
    vY.copy(rad);vY.y=0.2;vY.normalize();
    vX.copy(mot);vX.y=0;vX.normalize();
    vZ.crossVectors(vX,vY).normalize();vX.crossVectors(vY,vZ).normalize();
    MB.makeBasis(vX,vY,vZ);QB.setFromRotationMatrix(MB);
    if(spin){Qi.setFromAxisAngle(vY,spin);QB.premultiply(Qi);}
    const head=new THREE.Vector3(0,1.25+shake,0).addScaledVector(rad,0.55+(args.reach??7.6)*out);
    const pos=head.clone().addScaledVector(vY,-2.0*S0);
    return {w,QB,pos,tw,act};
  };
  const update=()=>{
    if(!voidFixed&&holder.children.length){fixVoid();voidFixed=true;}
    // รอบ 9: หยดหมึกตามสัน = ส่วนหนึ่งของ "เปลวหยักติดสัน" ในแบบ B → เปิดไว้
    const T=clock();
    // ลอย + หมุนควงข้างตัว (หมุนรอบแกนด้ามช้า ๆ + โยกเบา ๆ)
    pivot.rotation.set(0.12*Math.sin(T*1.3),T*0.9,0.18+0.06*Math.sin(T*0.8));
    pivot.position.y=(args.lift??0.05)+0.08*Math.sin(T*1.7);
    {const k=Math.floor(T/3.1),u=(T-k*3.1)/0.7;if(!BA&&u<1&&k%2===0){pivot.rotation.y+=Math.PI*2*u*u*(3-2*u);}}   // บางครั้งหมุนควงตัวเอง 1 รอบ
    if(BA){const P=baPose(T);if(P.w>0.001){Qi.setFromEuler(pivot.rotation);pivot.quaternion.copy(Qi).slerp(P.QB,P.w);pivot.position.lerp(P.pos,P.w);}
      const me=typeof PM3!=='undefined'&&PM3.get(NET.myId);if(me&&me.b){me.b.userData.scyY??=me.b.rotation.y;me.b.rotation.y=me.b.userData.scyY+P.tw;}   // ตัวบิดตามแรงเหวี่ยง

      // หาง (รอบ 2): คำนวณจากท่าฟันย้อนเวลา (ไม่พึ่งเฟรมที่วาด → ผืนต่อเนื่อง ไม่เป็นริ้ว) • โคนผืนทึบเรียบ ปลายหางแตกเป็นเปลว
      if(stScyLines){const Mt=new THREE.Matrix4(),Sv=new THREE.Vector3(S,S,S);
        const [tipX,tipY]=bladePt(1,0.45),[ttx,tty]=tan(1),acts=[];
        for(let j=0;j<HH;j++){const Pj=baPose(T-j*0.014),age=j/(HH-1);Mt.compose(Pj.pos,Pj.QB,Sv);acts[j]=Pj.act;
          // หางด้าม: จากปลายล่างของด้ามขึ้นไปต่อกับโคนหางใบ
          {const [rx,ry]=bladePt(0.05,0.45);for(let k=0;k<SK;k++){const u=k/(SK-1);_p.set(rx*u,0.02+(ry-0.02)*u,0).applyMatrix4(Mt);const i3=j*SK+k;shpos[i3*3]=_p.x;shpos[i3*3+1]=_p.y;shpos[i3*3+2]=_p.z;
            const gy=0.30-0.18*u;shcol[i3*4]=shcol[i3*4+1]=shcol[i3*4+2]=gy;shcol[i3*4+3]=Math.min(1,Math.pow(1-age,1.2)*1.5)*Pj.act*Math.min(1,u/0.1+0.5);   /* ยาวและจางพร้อมหางใบ (ผู้ใช้ 2026-11-19) */}}   // เทาเข้มที่ปลายล่าง → เกือบดำใกล้ใบ ทึบพอเห็นชัด แต่ไม่ดำสนิทเท่าใบ
          for(let k=0;k<HK;k++){const tk=0.05+1.07*k/(HK-1);let x,y;if(tk<=1)[x,y]=bladePt(tk,0.45);else{const e=(tk-1)*1.15;x=tipX+ttx*e;y=tipY+tty*e;}_p.set(x,y,0).applyMatrix4(Mt);   // ปลายใบ: หางยื่นเลยปลายจริงไปอีกนิด
            const i2=j*HK+k,nz=Math.sin(k*1.7+T*9)*0.5+Math.sin(k*4.1-j*1.3+T*13)*0.5;
            tpos[i2*3]=_p.x;tpos[i2*3+1]=_p.y+(age>0.5?0.08*(age-0.5)*nz:0);tpos[i2*3+2]=_p.z;
            const body=Math.pow(1-age,1.2),flame=age<0.45?1:Math.max(0,Math.min(1,(nz+1.1-age*1.8)*2));   // ปลายหางขาดเป็นลิ้นไฟ (สุ่มตามคลื่น ไม่เป็นริ้ว)
            tcol[i2*4+3]=Math.min(1,body*1.5*(tk>0.85?1.35:1))*flame*Pj.act*(tk<0.15?tk/0.15:1)*(tk>1?Math.max(0.35,1-(tk-1)*4):1);   // เฉพาะตอนฟัน • แนวปลายใบเข้มกว่า
            // แถบเปลวบนขอบหาง: จากแนวสันใบ ยกขึ้นเป็นลิ้นไฟหยัก
            {const [sx,sy]=bladePt(tk,0.0);_p.set(sx,sy,0).applyMatrix4(Mt);const hj=(0.12+0.22*Math.max(0,nz+0.3))*(0.5+0.5*(1-age))+(age>0.55?(age-0.55)*1.1*(0.5+0.5*Math.sin(k*2.3+T*14)):0);   // ปลายหางเปลวสูงขึ้น ลุกเป็นลิ้น
              f2pos[i2*3]=_p.x;f2pos[i2*3+1]=_p.y+hj*(j%2?1:0.25);f2pos[i2*3+2]=_p.z;   // แถวสลับสูง-ต่ำ = ลิ้นไฟ
              f2col[i2*4+3]=tcol[i2*4+3]*0.95;}}}
        tailGeo.attributes.position.needsUpdate=true;tailGeo.attributes.color.needsUpdate=true;fr2.attributes.position.needsUpdate=true;fr2.attributes.color.needsUpdate=true;
        shGeo.attributes.position.needsUpdate=true;shGeo.attributes.color.needsUpdate=true;
        // เปลวปลายหาง: แถวเก่าสุดที่ยังฟันอยู่ = ปลายหาง • ลิ้นไฟลุกขึ้นแบบเปลวปลายล่างของเคียว
        {let je=-1;for(let j=HH-1;j>=0;j--)if(acts[j]>0.25){je=j;break;}const aE=je<0?0:acts[je];
          for(let q=0;q<TF;q++){const k=Math.min(HK-1,Math.round((q+0.5)/TF*(HK-1))),i2=Math.max(0,je)*HK+k,bx=tpos[i2*3],by=tpos[i2*3+1],bz=tpos[i2*3+2];
            const flick=0.6+0.4*Math.sin(T*(7+q%4)+q*1.9)*Math.sin(T*3.3+q),Hf=(0.3+0.25*Math.abs(Math.sin(q*2.9)))*flick*S*0.6;
            for(let i=0;i<TFP;i++){const u=i/(TFP-1),sw=Math.sin(T*6+q*1.3+u*3)*0.05*u*u,w=0.06*S*0.5*Math.pow(1-u,1.2)*(1+0.3*Math.sin(u*9+T*8+q));
              const a=(q*TFP+i)*2*3,c=(q*TFP+i)*2*4;tfpos[a]=bx-w+sw;tfpos[a+1]=by+Hf*u;tfpos[a+2]=bz;tfpos[a+3]=bx+w+sw;tfpos[a+4]=by+Hf*u;tfpos[a+5]=bz;
              tfcol[c+3]=tfcol[c+7]=je<0?0:Math.min(1,(1-u)*2.2)*Math.min(1,aE*1.5)*(k>HK*0.75?1:0.8);}}
          if(TF){tfGeo.attributes.position.needsUpdate=true;tfGeo.attributes.color.needsUpdate=true;}}
        for(let e=0;e<EMB;e++){const sp=embers[e],ph=(T*1.4+rnd(e+80))%1,j=Math.min(HH-1,Math.floor(HH*(0.55+0.4*rnd(e+81)))),k=Math.floor(rnd(e+82)*HK),i2=j*HK+k;
          const al=f2col[i2*4+3];sp.position.set(f2pos[i2*3]+Math.sin(T*3+e)*0.15*ph,f2pos[i2*3+1]+0.2+ph*1.1,f2pos[i2*3+2]+Math.cos(T*2+e)*0.15*ph);
          const sz=(0.12+0.12*rnd(e+83))*(1-ph*0.6);sp.scale.set(sz,sz*1.5,1);sp.material.opacity=Math.min(1,al*2)*Math.sin(ph*Math.PI);}}}
    if(!stScyLines)return;
    // ---------- หมึกไหลตามใบแล้วม้วนหลุด ----------
    for(let s=0;s<N;s++){
      const d=strands[s],life=1.6/d.sp,age=((T*d.sp*0.62+d.ph)%1);   // 0..1 วงจรชีวิตของเส้น
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
      const n1=Math.sin(tt*38-T*5.5)*0.5+Math.sin(tt*71+T*3.7)*0.3+Math.sin(tt*17-T*2.1)*0.2;   // ลิ้นไฟหยักวิ่งไปตามใบ
      const H=(0.07+0.09*Math.max(0,n1+0.35))*(1-0.45*tt);
      const cyc=(T*0.9+Math.sin(tt*13.7)*3.1)%1,gap=Math.sin(tt*9.3+Math.floor(T*0.9+Math.sin(tt*13.7)*3.1)*2.7)>0.35;   // บางช่วงมีลิ้นหลุด
      for(let j=0;j<SR;j++){
        const v=j/(SR-1),lean=0.025*v*v*Math.sin(T*4+tt*20);
        const h=H*v*(gap?(1+cyc*1.6):1);
        const k=(i*SR+j)*3,c=(i*SR+j)*4;
        spos[k]=sx+nx*h-tx*0.03*v+(-ny)*lean;spos[k+1]=sy+ny*h+tx*lean;spos[k+2]=0;
        let al=Math.pow(1-v,0.6);
        if(gap){const g0=cyc*0.9,g1=g0+0.22;if(v>g0&&v<g1)al=0;else if(v<g0)al*=Math.min(1,cyc*3);}   // ช่องว่างไต่ขึ้น = ลิ้นหลุด • โคนค่อย ๆ ลุกกลับ
        scol[c+3]=al;
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
      const fly=ph*0.5;v.set(x-ty*fly*0.9+tx*fly*0.3,y+tx*fly*0.9-fly*fly*0.8,(rnd(k+42)-0.5)*0.3*ph);
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
  ink.onBeforeRender=update;
  update();
};
