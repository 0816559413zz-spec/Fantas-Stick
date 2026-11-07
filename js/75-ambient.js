// =====================================================================
//  Ambient 🌫️ — ฝุ่นลอย (dust motes) + หมอกลอยต่ำ (mist) ที่ใช้ได้ทุกแมพ ปรับตามพรีเซ็ต Look (js/74-look.js)
//  • ไม่ผูกกับแมพ: ล้อมรอบกล้อง (กล่องวนซ้ำตามกล้อง) ใช้พื้นใต้กล้อง (TW) เป็นระดับหมอก, ทิศ/แรงลมจาก AIR (js/50), สีหมอก = scene.fog.color, สีฝุ่น = สีแสงหลัก (moonL)
//  • GPU ล้วน: 2 ดรอว์ (ฝุ่น + หมอก) instanced quad วนตำแหน่งใน vertex shader (ไม่มีงาน CPU ต่อใบ) อยู่ใน fxScene → นุ่มตามความลึกเหมือนอนุภาคอื่น (softify/SOFT_GLSL)
//  • ราคา: ฝุ่น = จุดเล็ก (แทบฟรี) • หมอก = ไม่กี่สิบการ์ดโปร่งใสใหญ่ (กินฟิลเรต) → ลดตามกราฟิก: สูง ทั้งหมด / อัตโนมัติ ลดเมื่อเครื่องช้า / ประหยัด ปิด
//  ฟิลด์ในพรีเซ็ต: dust (ปริมาณ 0–1 ของสูงสุด 700 จุด, 0 = ปิด) dustS (ขนาด ×) dustK (ความสว่าง) mist (ปริมาณ 0–1 ของสูงสุด 48 การ์ด) mistA (ความทึบ) mistS (ขนาด ×) mistH (ความสูงชั้นหมอก) mistL (ผสมสีแสงหลักกี่ส่วน) mistK (ความสว่าง) flow (ความเร็วลอยตามลม ×)
//  ปิดทั้งหมด: ?noambient หรือ ?nolook
// =====================================================================
const AMBX={dust:null,mist:null,N:{dust:700,mist:48},off:/[?&](noambient|nolook)\b/.test(location.search),col:new THREE.Color(),drift:new THREE.Vector2()};
const AMBX_V='attribute vec4 aSeed;uniform vec3 uCam;uniform float uT;uniform vec3 uBox;uniform vec2 uDrift;uniform float uGY;uniform vec2 uSize;uniform float uKind;uniform float uA;uniform float uNear;'+
  'varying vec2 vUv;varying float vA;'+   // vVZ มากับ SOFT_GLSL
  'void main(){'+
    'vec3 b=aSeed.xyz*uBox;'+
    'vec3 sw=vec3(sin(uT*0.31+aSeed.w*40.0),sin(uT*0.23+aSeed.x*30.0)*0.5,cos(uT*0.27+aSeed.y*35.0))*mix(0.5,2.2,uKind);'+
    'vec2 q=b.xz+uDrift*uT+sw.xz;'+
    'vec2 rel=mod(q-uCam.xz+uBox.xz*0.5,uBox.xz)-uBox.xz*0.5;'+   // วนรอบกล้อง
    'vec3 wp=vec3(uCam.x+rel.x,uGY+b.y+sw.y*0.3,uCam.z+rel.y);'+
    'float s=mix(uSize.x,uSize.y,fract(aSeed.w*7.13));'+
    'float edge=1.0-smoothstep(0.62,1.0,max(abs(rel.x)/(uBox.x*0.5),abs(rel.y)/(uBox.z*0.5)));'+
    'float d=length(wp-uCam);float nf=smoothstep(uNear*0.4,uNear,d);'+
    'float tw=uKind>0.5?1.0:0.55+0.45*sin(uT*(1.5+aSeed.x*2.0)+aSeed.z*50.0);'+
    'vA=uA*edge*nf*tw;'+
    'vec4 mv=viewMatrix*vec4(wp,1.0);mv.xy+=position.xy*s;vVZ=-mv.z;vUv=position.xy;gl_Position=projectionMatrix*mv;}';
const AMBX_F='uniform vec3 uCol;uniform float uKind;uniform float uSoft;varying vec2 vUv;varying float vA;'+
  'void main(){float d=length(vUv);if(d>1.0)discard;float a=uKind>0.5?exp(-d*d*2.8):pow(1.0-d,2.0);'+
  'a*=vA*softK(uSoft);if(a<0.002)discard;gl_FragColor=vec4(uCol,a);}';
function ambMesh(kind){
  const n=AMBX.N[kind?'mist':'dust'],g=new THREE.InstancedBufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));g.setIndex([0,1,2,0,2,3]);
  const S=new Float32Array(n*4);   // ตำแหน่งเริ่มต้นกระจายสม่ำเสมอ (R3) + เลขสุ่ม
  for(let i=0;i<n;i++){S[i*4]=(0.5+i*0.8191725134)%1;S[i*4+1]=(0.5+i*0.6710436067)%1;S[i*4+2]=(0.5+i*0.5497004779)%1;const h=Math.sin(i*78.233+kind*5.1)*43758.5453;S[i*4+3]=h-Math.floor(h);}
  g.setAttribute('aSeed',new THREE.InstancedBufferAttribute(S,4));g.instanceCount=0;g.boundingSphere=new THREE.Sphere(new THREE.Vector3(),1e6);
  const m=fxMat(new THREE.ShaderMaterial({uniforms:{uCam:{value:new THREE.Vector3()},uT:{value:0},uBox:{value:new THREE.Vector3(kind?90:26,kind?2:9,kind?90:26)},uDrift:{value:new THREE.Vector2()},uGY:{value:0},
      uSize:{value:new THREE.Vector2(0.012,0.03)},uKind:{value:kind},uA:{value:0.5},uNear:{value:kind?7:1.5},uCol:{value:new THREE.Color()},uSoft:{value:kind?2.5:0.4}},
    vertexShader:'varying float vVZ;'+AMBX_V,
    fragmentShader:SOFT_GLSL+AMBX_F,transparent:true,depthWrite:false,blending:kind?THREE.NormalBlending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=kind?-2:-1;mesh.visible=false;mesh.userData.keep=true;fxScene.add(mesh);return mesh;}
// ปริมาณตามกราฟิก (เหมือน SSAO/ลำแสง): สูง = เต็ม • อัตโนมัติ lvl0 = 0.6 / lvl1 = ฝุ่น 0.3 ไม่มีหมอก / lvl≥2 ปิด • ประหยัด = ปิด
function ambQual(){if(QUAL.mode==='low')return [0,0];if(QUAL.mode==='high')return [1,1];return QUAL.lvl>=2?[0,0]:QUAL.lvl>=1?[0.3,0]:[0.6,0.6];}
function ambFrame(){   // เรียกจาก FXPass.render ทุกเฟรม (js/27)
  const P=typeof LOOK!=='undefined'&&LOOK&&LOOK.cur?LOOK.P[LOOK.cur]:null,on=P&&!AMBX.off&&!LOOK.off&&screen==='game'&&!!world;
  if(!AMBX.dust){if(!on)return;AMBX.dust=ambMesh(0);AMBX.mist=ambMesh(1);}
  if(!on){AMBX.dust.visible=AMBX.mist.visible=false;return;}
  const [qd,qm]=ambQual(),nd=Math.round(AMBX.N.dust*Math.max(0,Math.min(1,P.dust))*qd),nm=Math.round(AMBX.N.mist*Math.max(0,Math.min(1,P.mist))*qm);
  const t=performance.now()/1000,gy=TW(cam.position.x,cam.position.z);
  AMBX.drift.set(AIR.dir.x,AIR.dir.y).multiplyScalar((0.25+AIR.str*1.4)*P.flow);
  for(const [mesh,kind] of [[AMBX.dust,0],[AMBX.mist,1]]){const U=mesh.material.uniforms;U.uCam.value.copy(cam.position);U.uT.value=t;U.uGY.value=gy;U.uDrift.value.copy(AMBX.drift);}
  {const m=AMBX.dust,U=m.material.uniforms;m.geometry.instanceCount=Math.min(AMBX.N.dust,nd);m.visible=m.geometry.instanceCount>0&&P.dust>0.001;
    U.uSize.value.set(0.012*P.dustS,0.03*P.dustS);U.uA.value=0.8;AMBX.col.copy(moonL.color).multiplyScalar(P.dustK);U.uCol.value.copy(AMBX.col);U.uBox.value.y=9;}
  {const m=AMBX.mist,U=m.material.uniforms,F=scene.fog;m.geometry.instanceCount=Math.min(AMBX.N.mist,nm);m.visible=m.geometry.instanceCount>0&&P.mist>0.001&&!!F;
    U.uSize.value.set(5*P.mistS,10*P.mistS);U.uA.value=P.mistA;if(F)U.uCol.value.copy(F.color).lerp(moonL.color,P.mistL).multiplyScalar(P.mistK);U.uBox.value.y=P.mistH;}   // สีหมอก = สีหมอกแมพ ผสมสีแสงหลัก (กลางคืนหมอกสว่างอมน้ำเงิน ไม่ดำกลืนฉาก)
}
