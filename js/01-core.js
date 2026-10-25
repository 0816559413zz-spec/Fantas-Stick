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
Object.defineProperty(THREE.Material.prototype,'forceSinglePass',{configurable:true,
  get(){return this._fsp||this.blending===THREE.AdditiveBlending;},set(v){this._fsp=v;}});
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
