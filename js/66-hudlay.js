// ---------- HUD layout (HUD Editor, user 2026-11-24) ----------
// Positions/scale/opacity/visibility of HUD blocks from assets/hud/layout.json (edited in hudedit.html).
// Offsets x/y are in "HUD px" (multiplied by the HUD scale hs, like the CSS --hs) so they follow screen size.
// DOM blocks get CSS vars on #h4 (css/hud4.css); canvas blocks wrap their drawing in hlBegin/hlEnd.
const HUDL_DEF={
  left:{n:'ซ้ายล่าง: รูป/แผนที่ย่อ + เลือด',dom:'.h4L',v:'L'},
  right:{n:'ขวาล่าง: ไพ่สกิล + ปุ่มเล็ก',dom:'.h4R',v:'R'},
  ult:{n:'กลางล่าง: ไพ่อัลติ',dom:'.h4UX',v:'U'},
  top:{n:'แถบบน: คะแนน/เวลา (+ แกนปราสาท)'},
  feed:{n:'Kill feed (ขวาบน)'}};
const HUDL={it:{},ver:1,file:null,demo:false,box:{}};   // demo = HUD Editor open (fake feed + record boxes)
const HL0={x:0,y:0,s:1,o:1,hide:0};
function hlGet(id){return HUDL.it[id]||HL0;}
const hudHs=()=>Math.max(0.62,Math.min(1.15,SH/900,SW/1400));
// replace the whole layout (from file or editor) • unknown keys dropped, defaults omitted
function hlSet(j){const it={};const src=(j&&j.items)||{};
  for(const id of Object.keys(HUDL_DEF)){const a=src[id];if(!a)continue;const L={x:+a.x||0,y:+a.y||0,s:clamp(+a.s||1,0.3,3),o:clamp(a.o===undefined?1:+a.o,0,1),hide:a.hide?1:0};
    if(L.x||L.y||L.s!==1||L.o!==1||L.hide)it[id]=L;}
  HUDL.it=it;HUDL.ver++;}
function hlJson(){return JSON.stringify({_about:'HUD layout — edit in hudedit.html (HUD Editor). x/y = offset in HUD px (scaled with screen), s = scale, o = opacity, hide = 1 hides the block.',v:1,items:HUDL.it},null,1);}
// DOM blocks: CSS vars on #h4 (re-applied after every h4Build because it resets H4.cache)
function hlApplyDom(){if(!H4.el)return;h4Set('hl',HUDL.ver,()=>{const st=H4.el.style;
  for(const id in HUDL_DEF){const D=HUDL_DEF[id];if(!D.v)continue;const L=hlGet(id);
    st.setProperty('--'+D.v+'x',L.x);st.setProperty('--'+D.v+'y',L.y);st.setProperty('--'+D.v+'s',L.s);st.setProperty('--'+D.v+'o',L.hide?0:L.o);H4.el.classList.toggle('hl'+D.v,!!L.hide);}});}
// canvas blocks: anchor (ax,ay) = the point the block scales around • false = hidden (skip drawing, no hlEnd)
function hlBegin(id,ax,ay){const L=hlGet(id);if(L.hide)return false;cx.save();if(L.o<1)cx.globalAlpha*=L.o;
  if(L.x||L.y||L.s!==1){const k=hudHs();cx.translate(ax+L.x*k,ay+L.y*k);cx.scale(L.s,L.s);cx.translate(-ax,-ay);}return true;}
function hlEnd(){cx.restore();}
// editor only: remember a canvas block's on-screen box (untransformed x,y,w,h around anchor ax,ay)
function hlBox(id,ax,ay,x,y,w,h){if(!HUDL.demo)return;const L=hlGet(id),k=hudHs(),s=L.s,X=ax+L.x*k+(x-ax)*s,Y=ay+L.y*k+(y-ay)*s;HUDL.box[id]=[X,Y,w*s,h*s];}
const HL_DEMO_FEED=['Bot1 ⚡ → Bot2','คุณ 🔥 → Bot3','Bot2 ❄ → Bot1'];   // fake kill feed while the HUD Editor is open
fetch('assets/hud/layout.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{if(j){hlSet(j);HUDL.file=hlJson();}}).catch(()=>{});
// editor bridge (hudedit.html): live preview + highlight a block
if(window.WD)Object.assign(window.WD,{HUDL,HUDL_DEF,hlSet,hlJson,hlGet,hudHs,hlMapBox:()=>h4MapBox(),
  hudLib:()=>({H4E,icoURL,hasIco,PBASIC:PBASIC.map(b=>b&&b.n)})});   // design mode asset library (element colours, icon URLs, basic attack names)
