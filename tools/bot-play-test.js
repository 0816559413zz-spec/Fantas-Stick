// ทดสอบบอทห้องฝึกทีละสาย (headless):  node tools/headless.js --game --js tools/bot-play-test.js --timeout 300 --quiet
//   ตัวเลือกผ่าน window.__bp = {paths:[0,1,...], secs:25, lv:2, n:1, mode:'still'|'strafe'}
// ผล: ต่อสาย = จำนวนครั้งที่กดสกิลแต่ละท่า / ดาเมจต่อวิ ที่ลงเป้า / ยกโล่กี่ครั้ง / error — เอาไว้เทียบก่อน-หลังแก้สมองบอท (js/15-bot.js)
const o=Object.assign({paths:[0,1,2,6,7,8],secs:25,lv:2,n:1,mode:'strafe'},window.__bp||{});
await HL.solo({mode:'train'});
const G=WD.G,me=HL.me(),out=[],dt=1/60;
const ZX=6400,ZY=3200;
for(const path of o.paths){
  WD.bot();
  me.maxHp=me.hp=1e7;me.team=1;me.alive=true;
  me.x=ZX-480;me.y=ZY;
  for(let i=0;i<o.n;i++)WD.bot(path,o.lv,1);
  const bs=WD.bots();if(!bs.length){out.push({path,err:'no bot'});continue;}
  bs.forEach((B,i)=>{B.x=ZX+i*40;B.y=ZY+(i-0.5)*120;B.ai.home={x:ZX,y:ZY};});
  const cnt=bs.map(()=>({})),prev=bs.map(()=>({})),sh=bs.map(()=>0),pSh=bs.map(()=>false);let dmg=0,T=0;const e0=HL.errs.length;
  const K=['q','e','r','f'];
  for(let f=0;f<o.secs*60;f++){
    me.x=ZX-480+(o.mode==='strafe'?Math.sin(T*0.9)*150:0);me.y=ZY+(o.mode==='strafe'?Math.cos(T*0.7)*120:0);
    if(me.hp<me.maxHp-1){dmg+=me.maxHp-me.hp;}me.hp=me.maxHp;
    WD.hostStep(dt);T+=dt;
    bs.forEach((B,i)=>{
      K.forEach((k,j)=>{const cd=B.cd[k];if(prev[i][k]!==undefined&&cd>prev[i][k]+0.3){const id=B.kitIds[j];cnt[i][id]=(cnt[i][id]||0)+1;}prev[i][k]=cd;});
      if(prev[i].x!==undefined&&B.ult<prev[i].x-50)cnt[i].ULT=(cnt[i].ULT||0)+1;prev[i].x=B.ult;B.ult=Math.min(100,B.ult+0.25*dt*60/6);
      if(B.shieldOn&&!pSh[i])sh[i]++;pSh[i]=B.shieldOn;
    });
  }
  out.push({path,kit:bs.map(B=>B.kitIds.join('/')),casts:cnt,dmgPerSec:Math.round(dmg/o.secs),shields:sh,errs:HL.errs.slice(e0).slice(0,3)});
}
return out;
