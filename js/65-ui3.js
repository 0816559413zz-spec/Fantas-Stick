// =====================================================================
//  UI รอบ 3 (ผู้ใช้ 2026-10-23 — สเปก designs/ui-menu.md "รอบ 3") • สไตล์เดียวกับเมนูใหม่ (css/hub.css --h-*) • CSS ใน css/ui3.css
//  uiGalaxy(host)  พื้นกาแล็กซี + ประกาย (canvas วาดเฉพาะตอนเปิดอยู่) — ใช้กับเมนูหยุดเกม / สรุปหลังเกม / ตารางคะแนน
//  uiShow(el) / uiHide(el,done)  เปิด = คลาส .in (CSS เล่นเข้า) • ปิด = .out เล่นย้อน แล้วค่อยซ่อน (กฎผู้ใช้: ปุ่มกลับ = แอนิเมชันย้อน)
// =====================================================================
const UIG=new Set();
function uiGalaxy(host,opt){
  const c=document.createElement('canvas');c.className='uiGal';host.prepend(c);
  const o=Object.assign({stars:150,glints:7,neb:['rgba(120,90,255,.20)','rgba(60,150,255,.14)','rgba(200,90,220,.10)']},opt||{});
  const G={c,g:c.getContext('2d'),o,w:0,h:0,S:[],L:[],t:0,on:false,seed:Math.random()*100};
  const fit=()=>{const r=host.getBoundingClientRect(),w=Math.max(2,Math.round(r.width)),h=Math.max(2,Math.round(r.height));if(w===G.w&&h===G.h)return;
    G.w=c.width=w;G.h=c.height=h;G.S=[];for(let i=0;i<o.stars;i++)G.S.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()<0.1?1.4:0.4+Math.random()*0.7,p:Math.random()*7,s:0.5+Math.random()*2});};
  G.fit=fit;UIG.add(G);return G;
}
function uiGalaxyOn(G,on){G.on=on;if(on){G.fit();uiGalDraw(G,0);uiGalLoop();}}   // วาดเฟรมแรกทันที (ไม่ต้องรอ rAF)
let uiGalRaf=0,uiGalT=0;
function uiGalLoop(){if(uiGalRaf)return;uiGalT=performance.now();const f=now=>{const dt=Math.min(0.05,(now-uiGalT)/1000);uiGalT=now;let any=false;
    for(const G of UIG)if(G.on){any=true;uiGalDraw(G,dt);}uiGalRaf=any?requestAnimationFrame(f):0;};uiGalRaf=requestAnimationFrame(f);}
function uiGalDraw(G,dt){
  G.fit();const g=G.g,w=G.w,h=G.h,t=(G.t+=dt);
  const bg=g.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#070a1d');bg.addColorStop(0.55,'#0b0d2a');bg.addColorStop(1,'#140b2b');g.fillStyle=bg;g.fillRect(0,0,w,h);
  // เนบิวลา 3 ก้อนลอยช้า ๆ
  G.o.neb.forEach((col,i)=>{const x=w*(0.25+0.5*((i*0.37+0.5+0.08*Math.sin(t*0.07+i*2))%1)),y=h*(0.3+0.4*((i*0.61+0.3+0.06*Math.cos(t*0.05+i))%1)),r=Math.max(w,h)*(0.45+0.1*i);
    const rg=g.createRadialGradient(x,y,0,x,y,r);rg.addColorStop(0,col);rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(0,0,w,h);});
  // ดาวพื้นหลัง กะพริบ
  for(const s of G.S){const a=0.35+0.65*Math.max(0,Math.sin(t*s.s+s.p));g.fillStyle='rgba(225,230,255,'+(a*0.8).toFixed(3)+')';g.beginPath();g.arc(s.x,s.y,s.r,0,7);g.fill();}
  // ประกายแฉก 4 ทิศ เกิด-ดับเป็นช่วง ๆ
  if(G.L.length<G.o.glints&&Math.random()<dt*3)G.L.push({x:Math.random()*w,y:Math.random()*h,t:0,T:1.2+Math.random()*1.4,k:6+Math.random()*10,c:Math.random()<0.5?'200,190,255':'170,225,255'});
  g.globalCompositeOperation='lighter';
  G.L=G.L.filter(L=>{L.t+=dt;const u=L.t/L.T;if(u>=1)return false;const a=Math.sin(u*Math.PI),k=L.k*(0.6+0.4*a);
    const rg=g.createRadialGradient(L.x,L.y,0,L.x,L.y,k*1.6);rg.addColorStop(0,'rgba('+L.c+','+(0.5*a).toFixed(3)+')');rg.addColorStop(1,'rgba('+L.c+',0)');g.fillStyle=rg;g.fillRect(L.x-k*2,L.y-k*2,k*4,k*4);
    g.strokeStyle='rgba(255,255,255,'+(0.85*a).toFixed(3)+')';g.lineWidth=1;g.beginPath();g.moveTo(L.x-k,L.y);g.lineTo(L.x+k,L.y);g.moveTo(L.x,L.y-k);g.lineTo(L.x,L.y+k);g.stroke();return true;});
  g.globalCompositeOperation='source-over';
}
// เปิด/ปิดแบบมีแอนิเมชัน (ปิด = .out เล่นย้อน แล้วค่อย .hidden)
function uiShow(el){clearTimeout(el._u3t);el.classList.remove('hidden','out');void el.offsetWidth;el.classList.add('in');if(el._gal)uiGalaxyOn(el._gal,true);}
function uiHide(el,done,ms){if(el.classList.contains('hidden')){if(done)done();return;}el.classList.remove('in');el.classList.add('out');clearTimeout(el._u3t);
  el._u3t=setTimeout(()=>{el.classList.add('hidden');el.classList.remove('out');if(el._gal)uiGalaxyOn(el._gal,false);if(done)done();},ms||300);}

// ---------- เมนูหยุดเกม ----------
{const el=$('#pause');el._gal=uiGalaxy(el.querySelector('.u3Box'));}
if(typeof WD!=='undefined')Object.assign(WD,{uiGalaxy,uiShow,uiHide,showPause,hidePause});
