// ภาพผังเมืองจากด้านบน (SVG) จากข้อมูลจริงใน js/02-city.js → designs/maps/city-greybox.svg
// ใช้: node tools/city-map.js
const fs=require('fs'),path=require('path'),R=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),hashStr=s=>{let h=7;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))|0;return Math.abs(h);};
const src=['js/02-data.js','js/02-citytest.js','js/02-city.js'].map(R).join('\n')+'\n;({MAPS,CITY_PLAN,CITY_ZN,CITY_PLAZA,PROPS0:MAPS.city.props()})';
const {MAPS,CITY_ZN,CITY_PLAZA,PROPS0}=(0,eval)(`(function(clamp,hashStr){${src.replace(/;\(\{MAPS[^]*$/,'')}\nreturn {MAPS,CITY_ZN,CITY_PLAZA,PROPS0:MAPS.city.props()};})`)(clamp,hashStr);
const M=MAPS.city,S=0.1,W=M.W*S,col={office:'#8a94a8',glass:'#5a86b8',shop:'#c8b48a',brick:'#9a5a46',station:'#b8a888',metal:'#7a8088',garage:'#8a8a8e',concrete:'#9a9a9a',stand:'#6a6e78',kiosk:'#e0dccf',train:'#c0c8d0',cont:'#b0603a',car:'#d04040'};
const zc={park:'#3f6e32',field:'#3f6e32',plaza:'#9a96a0',build:'#6a5a44',parking:'#3a3d44'};
let o=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="960" height="960" font-family="Kanit,sans-serif"><rect width="${W}" height="${W}" fill="#2c2f36"/>`;
for(const z of M.zones){o+=`<rect x="${z.x*S}" y="${z.y*S}" width="${z.w*S}" height="${z.d*S}" fill="#6f727a"/><rect x="${z.x*S+6}" y="${z.y*S+6}" width="${z.w*S-12}" height="${z.d*S-12}" fill="${zc[z.k]||'#55585f'}"/>`;
  if(z.water)o+=`<rect x="${z.water.x*S}" y="${z.water.y*S}" width="${z.water.w*S}" height="${z.water.d*S}" fill="#1c3a5a"/>`;}
o+=`<circle cx="${W/2}" cy="${W/2}" r="${CITY_PLAZA*S}" fill="#9a96a0" stroke="#77757e" stroke-width="2"/>`;
for(const D of M.deck)o+=`<rect x="${D.x*S}" y="${D.y*S}" width="${D.w*S}" height="${D.d*S}" fill="#6e6e74" opacity=".75"/>`;
for(const b of M.boxes)o+=`<rect x="${b.x*S}" y="${b.y*S}" width="${b.w*S}" height="${b.d*S}" fill="${col[b.m]||'#999'}" stroke="${b.hl?'#ff3030':'#222'}" stroke-width="${b.hl?3:0.5}"/>`;
for(const h of M.obs.filter(o=>o.k==='house'))o+=`<rect x="${(h.x-h.w/2)*S}" y="${(h.y-h.d/2)*S}" width="${h.w*S}" height="${h.d*S}" fill="#d8c8a0" stroke="#5a3a2a" transform="rotate(${-(h.ry||0)*57.3} ${h.x*S} ${h.y*S})"/>`;
for(const p of M.obs.filter(o=>o.k==='cpill'))o+=`<circle cx="${p.x*S}" cy="${p.y*S}" r="${p.r*S}" fill="#c0c0c4"/>`;
for(const p of PROPS0)o+=`<circle cx="${p.x*S}" cy="${p.y*S}" r="${p.r*S*1.4}" fill="${p.k[1]==='t'||p.k==='ppine'?'#2f8a3a':'#a07a46'}"/>`;
for(const z of M.zones)o+=`<text x="${(z.x+z.w/2)*S}" y="${(z.y+90)*S+14}" text-anchor="middle" font-size="22" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">${CITY_ZN[z.k]}</text>`;
o+=`<text x="${W/2}" y="${W/2+8}" text-anchor="middle" font-size="20" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">★ จุดเกิดกลาง</text>`;
o+=`<text x="10" y="${W-12}" font-size="16" fill="#ddd">480 × 480 ม. • 1 ช่องถนน = 120 ม. • กรอบแดง = ตึกไฮไลต์ถล่มทั้งตึก (ขั้น 7)</text></svg>`;
fs.mkdirSync(path.join(__dirname,'..','designs/maps'),{recursive:true});fs.writeFileSync(path.join(__dirname,'..','designs/maps/city-greybox.svg'),o);
console.log('designs/maps/city-greybox.svg',M.boxes.length,'boxes',M.obs.length,'obs',PROPS0.length,'props');
