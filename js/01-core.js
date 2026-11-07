// ---------- แกนกลาง: import Three.js + ฟังก์ชันพื้นฐาน ($ rnd clamp lerp store toast) ----------
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {Pass,FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// วัสดุโปร่งใส 2 ด้าน: three วาด 2 รอบ (ด้านหลัง → ด้านหน้า) และเช็ค shader ใหม่ทั้ง 2 รอบทุกเฟรม (~170 ครั้ง/เฟรมตอนสู้)
// แสงแบบบวก (Additive) ผลลัพธ์ไม่ขึ้นกับลำดับ → วาดรอบเดียวได้ ภาพเหมือนเดิมทุกพิกเซล • ต้องอยู่ก่อนสร้างวัสดุใด ๆ
// แผ่นแบน (Plane/Circle/Ring/Shape) ก็เหมือนกัน: มองจากมุมไหนก็เห็นแค่ด้านเดียว → วาดรอบเดียวได้พิกเซลเท่าเดิม (ผู้ใช้ 2026-11-07 "ไฟต์นัวๆกระตุก":
// วงอัลติสายฟ้าแบบสีปกติทำให้ three คิด shader ใหม่ ~400 ครั้ง/เฟรม) • จำต่อวัสดุ: เห็นกับรูปไม่แบนครั้งเดียว = กลับไปวาด 2 รอบตลอด • ?twopass = ปิด
const FLAT_GEO=new Set(['PlaneGeometry','CircleGeometry','RingGeometry','ShapeGeometry']),FLAT_ON=!/[?&]twopass\b/.test(location.search);
function flatMark(m,g){if(!FLAT_ON||!m||m._flat===-1||!g||m.side!==THREE.DoubleSide||!m.transparent)return;m._flat=FLAT_GEO.has(g.type)?1:-1;}
Object.defineProperty(THREE.Material.prototype,'forceSinglePass',{configurable:true,
  get(){return this._fsp||this.blending===THREE.AdditiveBlending||this._flat===1;},set(v){this._fsp=v;}});
THREE.Material.prototype.onBeforeRender=function(r,s,c,g){if(this._flat!==-1)flatMark(this,g);};
// ชิ้นเล็กหลายชิ้นที่ใช้ geometry + วัสดุเดียวกัน (หนามน้ำแข็ง, อักษรวงสายฟ้า) → วาดรวมเป็น InstancedMesh ก้อนเดียว (ผู้ใช้ 2026-11-07 "ไฟต์นัวๆกระตุก": ฉากมี ~1,500 draw ตอนอัลติ)
// instz(meshes,host) คืนตัวแทน (Object3D) ตำแหน่งเดิม ลูกเดิม → โค้ดเดิมขยับ/ซ่อนตัวแทนได้เหมือนเดิม • instzTick() ก่อน render ลอกตำแหน่งลงก้อนรวม • ?noinstz = ปิด
// ใช้ได้กับวัสดุ three มาตรฐานเท่านั้น (ShaderMaterial ที่เขียน vertex เองไม่รู้จัก instanceMatrix)
const INSTZ={on:!/[?&]noinstz\b/.test(location.search),live:new Set(),all:new Set(),n:0,_m:new THREE.Matrix4(),_t:new THREE.Matrix4(),_z:new THREE.Matrix4().makeScale(0,0,0)};
function instz(meshes,host){if(!INSTZ.on||!meshes||meshes.length<3)return meshes;const m0=meshes[0];host=host||m0.parent;if(!host||m0.material.isShaderMaterial||Array.isArray(m0.material))return meshes;
  const im=new THREE.InstancedMesh(m0.geometry,m0.material,meshes.length);im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);im.frustumCulled=false;im.renderOrder=m0.renderOrder;im.castShadow=m0.castShadow;im.receiveShadow=m0.receiveShadow;im.name='instz';
  const prox=meshes.map(m=>{const o=new THREE.Object3D(),par=m.parent;o.name=m.name;o.rotation.order=m.rotation.order;o.position.copy(m.position);o.quaternion.copy(m.quaternion);o.scale.copy(m.scale);o.visible=m.visible;o.userData=m.userData;
    for(const c of [...m.children])o.add(c);if(par){par.children[par.children.indexOf(m)]=o;o.parent=par;m.parent=null;}return o;});
  im.userData.instz={prox,host};im.onBeforeRender=function(){INSTZ.live.add(this);INSTZ.all.add(this);};host.add(im);instzSync(im);return prox;}
function instzSync(im){const P=im.userData.instz,h=P.host;h.updateWorldMatrix(true,false);const inv=INSTZ._m.copy(h.matrixWorld).invert(),a=im.instanceMatrix.array;
  for(let i=0;i<P.prox.length;i++){const p=P.prox[i];let vis=true;for(let q=p;q&&q!==h;q=q.parent)if(!q.visible){vis=false;break;}
    if(!vis){INSTZ._z.toArray(a,i*16);continue;}p.updateWorldMatrix(p.parent!==h,false);INSTZ._t.multiplyMatrices(inv,p.matrixWorld).toArray(a,i*16);}
  im.instanceMatrix.needsUpdate=true;}
function instzTick(){for(const im of INSTZ.live)if(im.parent)instzSync(im);INSTZ.live.clear();
  if(++INSTZ.n%120===0)for(const im of INSTZ.all){let r=im;while(r.parent)r=r.parent;if(!r.isScene){INSTZ.all.delete(im);im.dispose();}}}   // ถูกลบออกจากฉาก → คืนบัฟเฟอร์ GPU   // three เรียกตรงนี้ก่อนตัดสินวาด 1/2 รอบ (ไม่มีวัสดุไหนในเกม override)
{const cp=THREE.Material.prototype.copy;THREE.Material.prototype.copy=function(s){const r=cp.call(this,s);this._fsp=s._fsp;return r;};}
// =====================================================================
//  พื้นฐาน
// =====================================================================
const $=s=>document.querySelector(s);
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const dist2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
function lerpAng(a,b,t){let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+d*t;}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){return null;}}
let toastT=0;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2600);}
