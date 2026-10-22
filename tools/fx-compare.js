// ภาพเทียบเอฟเฟกต์หลายแบบในรูปเดียว (เช่น แบบ A/B/C ของท่าเดียวกัน) → designs/vfx-variants/<ชื่อ>.jpg
// ต้องรัน python tools/serve.py ก่อน • ใช้: node tools/fx-compare.js <ไฟล์ออก> <fx1> <fx2> ... [--sheet 0.08,0.22,0.45,0.75 (4 ช่อง = แถวเดียว)] [--cam side] [--at front] [--map test]
//   เช่น node tools/fx-compare.js fire-kindle var-fire/kindle_a var-fire/kindle_b var-fire/kindle_c --at self
// ทำ contact sheet ของแต่ละไฟล์ด้วยสตูดิโอ (headless) แล้วต่อเป็นแถว ๆ พร้อมป้าย desc ของไฟล์ • พิมพ์ค่าวัด (ขาว/บังตัว/อนุภาค) ของแต่ละแบบ
const {execFileSync}=require('child_process'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const a=process.argv.slice(2),opt={sheet:'0.08,0.22,0.45,0.75',cam:'side',at:'front',map:'test'},names=[];
for(let i=0;i<a.length;i++){if(a[i].startsWith('--')){opt[a[i].slice(2)]=a[++i];}else names.push(a[i]);}
const out=names.shift();if(!out||!names.length){console.log('ใช้: node tools/fx-compare.js <ไฟล์ออก> <fx1> <fx2> ...');process.exit(1);}
const shots=[],metrics={};
for(const n of names){const sh='cmp_'+n.replace(/[^\w]/g,'_');
  const url=`studio.html?fx=${n}&sheet=${opt.sheet}&cam=${opt.cam}&at=${opt.at}&map=${opt.map}&save=${sh}`;
  try{const r=execFileSync(process.execPath,[path.join(__dirname,'headless.js'),'--url',url,'--wait-shot',sh,'--w','1600','--h','900','--quiet','--timeout','120'],{encoding:'utf8'});
    const m=/metrics (.*)/.exec(r);metrics[n]=m?JSON.parse(m[1]):null;shots.push(sh);
    const pe=/page errors: (\d+)|--- page errors \((\d+)\)/.exec(r);if(pe&&(+(pe[1]||pe[2])>0))console.log('⚠ '+n+': page errors\n'+r.split('--- page errors')[1]);
  }catch(e){console.log('✗ '+n+': '+(e.stdout||e.message).slice(-400));}}
const desc=names.map(n=>{try{return JSON.parse(fs.readFileSync(path.join(ROOT,'assets','fx',n+'.fx.json'),'utf8')).desc||'';}catch(e){return '';}});
const js=`const L=${JSON.stringify(shots)},D=${JSON.stringify(desc)},N=${JSON.stringify(names)};
const im=await Promise.all(L.map(s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='/shots/'+s+'.jpg?'+Math.random();})));
const W=1400,rows=im.filter(Boolean),hs=rows.map(i=>Math.round(i.height*W/i.width)),lab=30;
const c=document.createElement('canvas');c.width=W;c.height=hs.reduce((s,h)=>s+h+lab,0);const x=c.getContext('2d');x.fillStyle='#0b1020';x.fillRect(0,0,c.width,c.height);
let y=0;im.forEach((i,k)=>{if(!i)return;x.fillStyle='#1c2440';x.fillRect(0,y,W,lab);x.fillStyle='#ffd86b';x.font='bold 17px Kanit, sans-serif';x.fillText(N[k],8,y+21);x.fillStyle='#e8ecff';x.font='15px Kanit, sans-serif';x.fillText((D[k]||'').slice(0,120),260,y+21);
  y+=lab;const h=Math.round(i.height*W/i.width);x.drawImage(i,0,y,W,h);y+=h;});
return {images:{['cmpout_'+${JSON.stringify(out.replace(/[^\w-]/g,'_'))}]:c.toDataURL('image/jpeg',0.8)}};`;
const tmp=path.join(require('os').tmpdir(),'fxcmp_'+process.pid+'.js');fs.writeFileSync(tmp,js);
try{execFileSync(process.execPath,[path.join(__dirname,'headless.js'),'--url','manual/index.html','--js',tmp,'--w','800','--h','600','--quiet','--timeout','60'],{encoding:'utf8'});}finally{fs.unlinkSync(tmp);}
const src=path.join(ROOT,'shots','cmpout_'+out.replace(/[^\w-]/g,'_')+'.jpg'),dd=path.join(ROOT,'designs','vfx-variants');fs.mkdirSync(dd,{recursive:true});
const dst=path.join(dd,out+'.jpg');fs.copyFileSync(src,dst);
console.log('✓ '+path.relative(ROOT,dst).replace(/\\/g,'/')+' ('+Math.round(fs.statSync(dst).size/1024)+' KB)');
for(const n of names){const m=metrics[n];if(m)console.log('  '+n+': ขาวสูงสุด '+m.peakWhite+'% • บังตัว '+m.peakBlock+'% • อนุภาคสูงสุด '+Math.max(...m.res.map(r=>r.parts))+' • ms '+Math.max(...m.res.map(r=>r.ms)).toFixed(1));}
