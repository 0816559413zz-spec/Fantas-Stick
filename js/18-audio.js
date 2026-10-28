// =====================================================================
//  เสียง: สังเคราะห์ทั้งหมดด้วย WebAudio (ไม่ต้องใช้ไฟล์) + reverb + เสียงรอบทิศ + เพลงประกอบ
// =====================================================================
let AC=null,MASTER=null,SFXBUS=null,REVERB=null,NB=null,WIND=null;
const sfxLast={};
function ac(){
  if(!AC){
    try{
      AC=new (window.AudioContext||window.webkitAudioContext)();
      const comp=AC.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;comp.connect(AC.destination);
      MASTER=AC.createGain();MASTER.gain.value=SET.master/100;MASTER.connect(comp);
      SFXBUS=AC.createGain();SFXBUS.gain.value=SET.sfx/100;SFXBUS.connect(MASTER);
      // reverb แบบห้องโถงหิน (impulse สร้างจาก noise ที่ค่อยๆ เบาลง)
      const len=AC.sampleRate*2.4,ir=AC.createBuffer(2,len,AC.sampleRate);
      for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2);}
      REVERB=AC.createConvolver();REVERB.buffer=ir;
      const wet=AC.createGain();wet.gain.value=0.32;REVERB.connect(wet);wet.connect(MASTER);
      NB=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);
      const nd=NB.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
      loadSfx();myDecodeReady();
    }catch(e){AC=null;}
  }
  if(AC&&AC.state==='suspended')AC.resume();
  return AC;
}
// ปลายทางของเสียง 1 ครั้ง: ปรับระดับตามระยะ + แพนซ้ายขวาตามทิศเทียบกับกล้อง
function outNode(o){
  const g=AC.createGain();let vol=o.vol!==undefined?o.vol:1;
  let node=g;
  if(o.x!==undefined){
    const me=myPos();
    if(me){
      const d=Math.hypot(o.x-me.x,o.y-me.y);vol*=1/(1+d/450);
      if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=clamp(Math.sin(Math.atan2(o.y-me.y,o.x-me.x)-yaw)*Math.min(1,d/200),-0.9,0.9);g.connect(p);node=p;}
    }
  }
  g.gain.value=vol;
  node.connect(SFXBUS);
  if(o.rev!==0){const s=AC.createGain();s.gain.value=o.rev||0.5;node.connect(s);s.connect(REVERB);}
  return g;
}
function tone(dst,f0,f1,dur,type,vol,t0,att){
  const t=AC.currentTime+(t0||0),o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+(att||0.005));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(dst);o.start(t);o.stop(t+dur+0.05);
}
function noiz(dst,dur,vol,ft,f0,f1,q,t0,att){
  const t=AC.currentTime+(t0||0),s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();
  s.buffer=NB;s.loop=true;f.type=ft||'lowpass';f.Q.value=q||1;
  f.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+(att||0.005));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f);f.connect(g);g.connect(dst);s.start(t,Math.random());s.stop(t+dur+0.05);
}
function snd(n,o){
  if(!AC||AC.state!=='running')return;
  o=o||{};
  const now=performance.now();if(sfxLast[n]&&now-sfxLast[n]<40)return;sfxLast[n]=now;
  try{
    const d=outNode(o);
    if(playBuf(n,d)&&!SFXSYN.has(n))return;
    switch(n){
      case 'cast_bolt':tone(d,1300,2100,0.12,'sine',0.18);tone(d,2600,3400,0.08,'triangle',0.06,0.02);noiz(d,0.08,0.08,'bandpass',6000,9000,3);break;
      case 'cast_fire':noiz(d,0.45,0.35,'lowpass',300,2200,1.5,0,0.04);tone(d,140,60,0.4,'sawtooth',0.12);break;
      case 'cast_stun':tone(d,1800,300,0.18,'square',0.08);noiz(d,0.2,0.2,'bandpass',3000,1200,4);tone(d,90,90,0.15,'sawtooth',0.06);break;
      case 'cast_pull':{const t=AC.currentTime,o2=AC.createOscillator(),l=AC.createOscillator(),lg=AC.createGain(),g=AC.createGain();
        o2.frequency.setValueAtTime(500,t);o2.frequency.exponentialRampToValueAtTime(160,t+0.35);l.frequency.value=22;lg.gain.value=60;l.connect(lg);lg.connect(o2.frequency);
        g.gain.setValueAtTime(0.2,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.38);o2.connect(g);g.connect(d);o2.start(t);l.start(t);o2.stop(t+0.4);l.stop(t+0.4);break;}
      case 'cast_ebolt':tone(d,320,140,0.3,'triangle',0.14);noiz(d,0.25,0.08,'bandpass',900,400,2);break;
      case 'cast_web':noiz(d,0.18,0.25,'bandpass',2500,700,3);tone(d,600,250,0.12,'square',0.04);break;
      case 'crackle':noiz(d,rnd(0.012,0.045),rnd(0.05,0.13),'bandpass',rnd(1800,5200),0,rnd(2,6));if(Math.random()<0.25)noiz(d,0.07,0.06,'lowpass',700,200,1,0.01);break;   // ไฟปะทุ (สนามรบ ขั้น 5 — สร้างจากโค้ด)
      case 'rubble':for(let i=0;i<9;i++)noiz(d,rnd(0.03,0.09),rnd(0.04,0.12),'bandpass',rnd(900,3200),0,rnd(1.5,4),i*rnd(0.03,0.09));noiz(d,0.5,0.12,'lowpass',260,90,1,0,0.03);break;   // เศษหล่นกราวรูด
      case 'hit':tone(d,170,60,0.14,'sine',0.35);noiz(d,0.08,0.18,'lowpass',2500,600,1);break;
      case 'hurt':tone(d,220,80,0.25,'sawtooth',0.16);noiz(d,0.15,0.25,'lowpass',1800,300,1);tone(d,60,40,0.2,'sine',0.4);break;
      case 'zap':noiz(d,0.25,0.25,'highpass',3000,6000,2);tone(d,2400,800,0.15,'square',0.05);break;
      case 'boom':noiz(d,1.0,0.7,'lowpass',2000,90,1,0,0.01);tone(d,90,28,0.8,'sine',0.7);noiz(d,0.25,0.25,'highpass',4000,2000,1);break;
      case 'slam':noiz(d,0.8,0.6,'lowpass',700,60,1);tone(d,70,25,0.7,'sine',0.8);break;
      case 'parry':[1320,1980,2640,3300].forEach((f,i)=>tone(d,f,f,1.4-i*0.2,'sine',0.16/(i+1)));noiz(d,0.12,0.15,'highpass',6000,9000,1);break;
      case 'block':tone(d,820,780,0.18,'triangle',0.16);tone(d,1230,1200,0.14,'triangle',0.08);noiz(d,0.06,0.12,'bandpass',4000,4000,2);break;
      case 'break':noiz(d,0.45,0.3,'highpass',2500,5000,1);for(let i=0;i<5;i++)tone(d,rnd(2000,4500),rnd(1500,4000),0.3,'sine',0.05,i*0.03);break;
      case 'die':tone(d,420,70,0.6,'sawtooth',0.12);noiz(d,0.5,0.2,'lowpass',1500,200,1);break;
      case 'spiderdie':noiz(d,0.4,0.3,'bandpass',1800,500,2);tone(d,300,90,0.3,'square',0.06);break;
      case 'pixiedie':tone(d,2400,600,0.3,'sine',0.12);tone(d,3000,900,0.25,'triangle',0.05,0.04);break;
      case 'push':noiz(d,0.4,0.4,'bandpass',350,2800,1.2,0,0.03);tone(d,110,60,0.3,'sine',0.25);break;
      case 'nova':[220,277,330,440,554].forEach((f,i)=>tone(d,f,f*1.01,1.8,'sine',0.09,i*0.02,0.15));noiz(d,1.2,0.5,'lowpass',3000,100,1,0.05);tone(d,60,30,1.2,'sine',0.6);noiz(d,1.5,0.1,'highpass',6000,10000,1,0.1,0.3);break;
      case 'revive':[523,659,784,1047].forEach((f,i)=>tone(d,f,f,0.5,'sine',0.14,i*0.08));break;
      case 'buff':[659,880,1175].forEach((f,i)=>tone(d,f,f,0.6,'triangle',0.12,i*0.07));break;
      case 'dash':noiz(d,0.25,0.3,'bandpass',800,3000,1.5);break;
      case 'whoosh':noiz(d,0.7,0.4,'bandpass',300,2400,1.4,0,0.15);[392,523,659].forEach((f,i)=>tone(d,f,f*2,0.5,'sine',0.06,i*0.05));break;
      case 'dismount':noiz(d,0.4,0.25,'bandpass',2000,400,1.4);break;
      case 'thud':tone(d,95,40,0.3,'sine',0.5);noiz(d,0.2,0.3,'lowpass',600,100,1);break;
      case 'hiss':{const t=AC.currentTime;noiz(d,0.55,0.18,'highpass',4500,3000,1,0,0.05);for(let i=0;i<5;i++)noiz(d,0.05,0.12,'bandpass',2500,2500,3,i*0.07);break;}
      case 'bite':noiz(d,0.1,0.35,'bandpass',1500,600,2);tone(d,220,120,0.08,'square',0.08);break;
      case 'splat':noiz(d,0.25,0.3,'lowpass',1200,300,2);tone(d,300,120,0.15,'sine',0.15);break;
      case 'pixie':tone(d,2200,3200,0.07,'sine',0.12);tone(d,2600,3600,0.07,'sine',0.1,0.09);tone(d,2000,3000,0.06,'sine',0.08,0.17);break;
      case 'portal':tone(d,180,90,0.7,'sine',0.15,0,0.2);noiz(d,0.7,0.15,'bandpass',600,200,3,0,0.2);break;
      case 'tick':tone(d,880,880,0.1,'sine',0.2);tone(d,1760,1760,0.06,'sine',0.05);break;
      case 'go':[523,659,784,1047].forEach(f=>tone(d,f,f,0.6,'triangle',0.1));noiz(d,0.3,0.1,'highpass',5000,9000,1);break;
      case 'fanfare':[392,523,659,784].forEach((f,i)=>{tone(d,f,f,0.45,'sawtooth',0.05,i*0.12);tone(d,f*2,f*2,0.45,'sine',0.04,i*0.12);});break;
      case 'end':[523,440,392,262].forEach((f,i)=>tone(d,f,f,0.7,'triangle',0.1,i*0.2));break;
      case 'goal':[523,659,784,1047,1319].forEach((f,i)=>{tone(d,f,f,0.5,'square',0.05,i*0.07);tone(d,f*2,f*2,0.4,'sine',0.05,i*0.07);});noiz(d,0.6,0.15,'highpass',4000,9000,1,0.3);break;
      case 'catch':tone(d,300,180,0.1,'sine',0.25);noiz(d,0.06,0.15,'lowpass',1500,400,1);break;
      case 'throw':noiz(d,0.3,0.25,'bandpass',600,2500,1.5);break;
      case 'snitch':[1568,2093,2637].forEach((f,i)=>tone(d,f,f*1.05,0.4,'sine',0.08,i*0.06));break;
      case 'ring':tone(d,880,1320,0.2,'sine',0.15);tone(d,1320,1760,0.25,'triangle',0.06,0.05);break;
      case 'pickup':[784,1047,1319].forEach((f,i)=>tone(d,f,f,0.25,'triangle',0.1,i*0.05));break;
      case 'alarm':for(let i=0;i<3;i++){tone(d,880,660,0.25,'square',0.08,i*0.3);}break;
      case 'kill':noiz(d,0.15,0.4,'bandpass',900,300,2);tone(d,160,50,0.4,'sawtooth',0.12);break;
      case 'eject':tone(d,600,80,1.2,'sine',0.15);noiz(d,1.2,0.12,'lowpass',2000,100,1);break;
      case 'task':[659,880].forEach((f,i)=>tone(d,f,f,0.3,'sine',0.14,i*0.1));break;
      case 'roar':noiz(d,1.4,0.6,'lowpass',500,120,2,0,0.1);tone(d,110,55,1.3,'sawtooth',0.25,0,0.1);tone(d,165,70,1.2,'sawtooth',0.12,0.05,0.1);break;
      case 'breath':noiz(d,1.6,0.5,'lowpass',2500,600,1,0,0.1);tone(d,80,60,1.5,'sawtooth',0.1,0,0.1);break;
      case 'imp':tone(d,220,110,1.2,'sawtooth',0.12);tone(d,233,116,1.2,'sawtooth',0.1);break;
      case 'crew':[523,659,784].forEach((f,i)=>tone(d,f,f,0.6,'sine',0.12,i*0.1));break;
    }
  }catch(e){}
}
function sfx(n){snd(n);}

// ---------- ไฟล์เสียงจริง (โฟลเดอร์ audio/) — เริ่มโหลดเมื่อ ac() ถูกเรียกครั้งแรก (ปกติตั้งแต่เปิดหน้า; AudioContext จะเล่นได้หลังคลิกแรก) ถ้าโหลดไม่ได้จะใช้เสียงสังเคราะห์ด้านบนแทน ----------
// จำนวนไฟล์ต่อชื่อเสียง (ไฟล์ชื่อ audio/sfx/<ชื่อ>_<เลข>.ogg สุ่มเล่น 1 ไฟล์)
const SFXN={cast_bolt:3,cast_fire:2,cast_stun:2,cast_pull:1,hit:3,hurt:3,zap:2,boom:3,slam:2,parry:2,block:2,break:2,die:4,spiderdie:3,push:1,nova:1,revive:1,buff:1,dash:3,whoosh:2,throw:1,dismount:1,thud:2,bite:2,splat:3,portal:1,tick:1,go:1,goal:1,pickup:2,kill:1,eject:1,task:1,roar:2,breath:1,imp:1,ui_click:1,ui_hover:1,step:6};
const SFXV={cast_bolt:0.32,cast_fire:0.5,cast_stun:0.4,hit:0.55,hurt:0.45,zap:0.4,boom:0.85,slam:0.8,parry:0.6,block:0.5,die:0.55,spiderdie:0.5,dash:0.5,whoosh:0.45,step:0.5,ui_click:0.45,ui_hover:0.25,tick:0.6,goal:0.7,roar:0.9,breath:0.7,imp:0.8,kill:0.6,nova:0.8};
const SFXR={cast_bolt:[0.9,1.15],hit:[0.85,1.15],step:[0.85,1.1],ui_click:[1,1],ui_hover:[1,1],tick:[1,1],go:[1,1],roar:[0.9,1],imp:[1,1]};
const SFXSYN=new Set(['nova','kill','breath','goal','roar']); // เล่นเสียงสังเคราะห์ซ้อนด้วยให้หนักแน่นขึ้น
const BUF={},AUD={loading:false};
function loadBuf(url){return fetch(url).then(r=>{if(!r.ok)throw new Error(r.status);return r.arrayBuffer();}).then(a=>new Promise((res,rej)=>AC.decodeAudioData(a,res,rej)));}
function loadSfx(){
  if(AUD.loading||!AC)return;AUD.loading=true;
  for(const [n,c] of Object.entries(SFXN))for(let i=1;i<=c;i++)loadBuf(`audio/sfx/${n}_${i}.ogg`).then(b=>{(BUF[n]=BUF[n]||[]).push(b);}).catch(()=>{});
  loadBuf('audio/amb/wind.ogg').then(b=>{AMB.windBuf=b;}).catch(()=>{});
}
function playBuf(n,d){
  const L=BUF[n];if(!L||!L.length)return false;
  const s=AC.createBufferSource(),g=AC.createGain(),r=SFXR[n]||[0.94,1.06];
  s.buffer=L[Math.floor(Math.random()*L.length)];s.playbackRate.value=rnd(r[0],r[1]);
  g.gain.value=SFXV[n]!==undefined?SFXV[n]:0.7;s.connect(g);g.connect(d);s.start();
  return true;
}
// เสียงบรรยากาศวนลูปตามแผนที่ (ปราสาท = จิ้งหรีดกลางคืน / ป่า = ป่าลึก)
const AMB={windBuf:null,cur:null,layer:null,bufs:{},failed:{}};
function ambTick(){
  const k=screen==='game'?(MAPID==='forest'||MAPID==='hogsmeade'||MAPID==='meadow'||MAPID==='lake'?'forest':MAPID==='castle'||MAPID==='ruins'?'castle':null):null;
  if(k&&!AMB.bufs[k]&&!AMB.failed[k]){AMB.bufs[k]='loading';loadBuf(`audio/amb/${k}.ogg`).then(b=>{AMB.bufs[k]=b;}).catch(()=>{AMB.failed[k]=1;delete AMB.bufs[k];});}
  const want=k&&AMB.bufs[k]&&AMB.bufs[k]!=='loading'?k:null;
  if(want===AMB.cur)return;
  if(AMB.layer){const L=AMB.layer,t=AC.currentTime;L.g.gain.setTargetAtTime(0,t,0.6);L.s.stop(t+3);AMB.layer=null;}
  AMB.cur=want;
  if(want){const s=AC.createBufferSource(),g=AC.createGain();s.buffer=AMB.bufs[want];s.loop=true;g.gain.value=0;g.gain.setTargetAtTime(want==='forest'?0.35:0.22,AC.currentTime,1);s.connect(g);g.connect(SFXBUS);s.start();AMB.layer={s,g};}
}
// เพลงประกอบจากไฟล์: เมนู / ปราสาท / ป่า / สนาม / บอส / โหมดโวลเดอมอร์ + เพลงสั้นตอนชนะ-แพ้
// เพลงเล่นแบบสตรีม (<audio>) ไม่ถอดทั้งเพลงไว้ในแรม — เพลงละ 4 นาทีถ้า decode จะกินแรมเกือบ 100 MB
const MUSF={cur:null,els:{},failed:{}};
const MUSF_VOL=0.5,STINGERS=new Set(['victory','defeat']);
function musicEl(k){
  let m=MUSF.els[k];if(m)return m;
  const el=new Audio();el.preload='auto';el.loop=!STINGERS.has(k);
  el.addEventListener('error',()=>{MUSF.failed[k]=1;});
  el.src=`audio/music/${k}.ogg`;
  const g=AC.createGain();g.gain.value=0;AC.createMediaElementSource(el).connect(g);g.connect(MUSIC.bus);
  return MUSF.els[k]={el,g};
}
function fadeMusic(m,to,sec){
  const t=AC.currentTime;m.g.gain.cancelScheduledValues(t);m.g.gain.setValueAtTime(m.g.gain.value,t);m.g.gain.linearRampToValueAtTime(to,t+sec);
  clearTimeout(m.stopT);if(to===0)m.stopT=setTimeout(()=>m.el.pause(),sec*1000+100);
}
function stopFileMusic(sec){const m=MUSF.els[MUSF.cur];if(m)fadeMusic(m,0,sec);MUSF.cur=null;}
function isWin(r){
  if(r.mode==='train')return true;
  if(r.mode==='coop')return r.wave>=5;
  if(r.mode==='imp'){const impWon=r.title.startsWith('🐍');return ROLE?((ROLE.role==='imp')===impWon):!impWon;}
  const me=VIEW.cur&&VIEW.cur.P.find(p=>p.id===NET.myId);
  if(me&&r.title.includes(me.n))return true;
  return !!(me&&MODES[r.mode]&&MODES[r.mode].team&&r.title.includes(TEAMN[me.tm]));
}
function wantTrack(){
  const v=VIEW.cur;
  if(screen!=='game'||!v)return 'menu';
  if(v.ph==='over')return v.res&&isWin(v.res)?'victory':'defeat';
  if(v.mode==='imp')return 'imp';
  if(v.mode==='race'||v.mode==='quid')return 'pitch';
  if(v.E&&v.E.some(e=>EDEF[e.t]&&EDEF[e.t].boss))return 'boss';
  return MAPID==='forest'||MAPID==='hogsmeade'||MAPID==='lake'?'forest':MAPID==='pitch'||MAPID==='meadow'||MAPID==='ruins'?'pitch':'castle';
}
// คืนค่า true ถ้าเพลงจากไฟล์ (หรือ "เพลงของฉัน") ดูแลอยู่ → ไม่ต้องเล่นเพลงสังเคราะห์
function fileMusicTick(){
  if(MY.list.length){
    stopFileMusic(1.5);
    if(!MY.playing)myPlay();
    return true;
  }
  const key=wantTrack();
  if(MUSF.failed[key]){stopFileMusic(1.5);return false;}
  if(key===MUSF.cur)return true;
  stopFileMusic(1.5);
  const m=musicEl(key);
  if(STINGERS.has(key)||key==='boss')m.el.currentTime=0;
  m.el.play().then(()=>fadeMusic(m,MUSF_VOL,STINGERS.has(key)?0.3:2)).catch(()=>{if(MUSF.cur===key)MUSF.cur=null;});
  MUSF.cur=key;
  return true;
}

// ---------- "เพลงของฉัน": เลือกไฟล์เพลงจากเครื่องตัวเอง เล่นแค่ในเครื่องนี้ (ไม่อัปโหลดไปไหน) เก็บไว้ใน IndexedDB ----------
const MY={list:[],i:0,el:null,g:null,url:null,playing:false};
function myDB(){return new Promise((res,rej)=>{const r=indexedDB.open('wd_music',1);r.onupgradeneeded=()=>r.result.createObjectStore('songs',{autoIncrement:true});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function mySave(files){
  try{const db=await myDB(),tx=db.transaction('songs','readwrite'),st=tx.objectStore('songs');st.clear();for(const f of files)st.add({name:f.name,blob:f});await new Promise(r=>{tx.oncomplete=r;tx.onerror=r;});}catch(e){}
}
async function myLoad(){
  try{const db=await myDB(),req=db.transaction('songs').objectStore('songs').getAll();
    const all=await new Promise(r=>{req.onsuccess=()=>r(req.result||[]);req.onerror=()=>r([]);});
    MY.list=all.map(x=>({name:x.name,blob:x.blob}));}catch(e){}
  myInfo();
}
function myDecodeReady(){if(MY.list.length&&MUSIC.on)setTimeout(()=>{if(!MY.playing)musicTick();},300);}
function myPlay(){
  if(!AC||!MY.list.length||!MUSIC.bus)return;
  if(!MY.el){
    MY.el=new Audio();MY.el.addEventListener('ended',()=>{MY.i++;myPlay();});
    const node=AC.createMediaElementSource(MY.el);MY.g=AC.createGain();MY.g.gain.value=0.9;node.connect(MY.g);MY.g.connect(MUSIC.bus);
  }
  const s=MY.list[MY.i%MY.list.length];
  if(MY.url)URL.revokeObjectURL(MY.url);
  MY.url=URL.createObjectURL(s.blob);MY.el.src=MY.url;MY.playing=true;
  if(MUSIC.on)MY.el.play().catch(()=>{MY.playing=false;});
  toast('🎵 '+s.name.replace(/\.[^.]+$/,''));
}
function myNext(){if(MY.list.length){MY.i++;myPlay();}}
function myClear(){MY.list=[];MY.playing=false;if(MY.el)MY.el.pause();mySave([]);myInfo();toast('ล้างเพลงของฉันแล้ว กลับไปใช้เพลงของเกม');}
function myInfo(){
  const b=document.getElementById('myMusicInfo'),c=document.getElementById('btnMyClear');if(!b)return;
  b.textContent=MY.list.length?`${MY.list.length} เพลง • กด N ในเกมเพื่อเปลี่ยนเพลง`:'เลือกไฟล์เพลงในเครื่อง (เล่นแค่ในเครื่องคุณ)';
  if(c)c.classList.toggle('hidden',!MY.list.length);
}
// เสียงลมตอนบินไม้กวาด (ต่อเนื่อง ดังตามความเร็ว)
function windUpdate(speed,flying){
  if(!AC||AC.state!=='running')return;
  if(WIND&&WIND.noise&&AMB.windBuf){WIND.s.stop();WIND=null;}
  if(!WIND){
    const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain(),file=!!AMB.windBuf;
    s.buffer=AMB.windBuf||NB;s.loop=true;f.type=file?'lowpass':'bandpass';f.Q.value=0.8;f.frequency.value=500;g.gain.value=0;
    s.connect(f);f.connect(g);g.connect(SFXBUS);s.start();WIND={s,f,g,noise:!file};
  }
  const target=flying?Math.min(WIND.noise?0.25:0.6,(WIND.noise?0.04:0.1)+speed*(WIND.noise?0.008:0.02)):0,t=AC.currentTime;
  WIND.g.gain.setTargetAtTime(target,t,0.15);
  WIND.f.frequency.setTargetAtTime(WIND.noise?300+speed*40:900+speed*120,t,0.2);
  if(!WIND.noise)WIND.s.playbackRate.setTargetAtTime(0.85+Math.min(0.4,speed*0.012),t,0.3);
}

// ---------- เพลงประกอบ (สร้างสดตามแผนที่) ----------
const MUSIC={on:store('wd_music')!=='0',bus:null,nextT:0,step:0};
const THEMES={
  castle:{root:146.83,prog:[[0,3,7],[-4,0,3],[-2,2,5],[-5,-1,2]],scale:[0,2,3,5,7,8,10],cut:900,bell:0.55},
  forest:{root:110,prog:[[0,3,7],[1,4,8],[0,3,7],[-2,1,5]],scale:[0,1,3,5,7,8],cut:600,bell:0.35},
  pitch:{root:130.81,prog:[[0,4,7],[5,9,12],[-3,0,4],[7,11,14]],scale:[0,2,4,7,9],cut:1500,bell:0.7}
};
function padNote(f,t,dur,cut){
  const g=AC.createGain(),fl=AC.createBiquadFilter();
  fl.type='lowpass';fl.frequency.setValueAtTime(cut*0.6,t);fl.frequency.linearRampToValueAtTime(cut,t+dur*0.5);fl.frequency.linearRampToValueAtTime(cut*0.6,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.03,t+1.2);g.gain.setValueAtTime(0.03,t+dur-1);g.gain.linearRampToValueAtTime(0.0001,t+dur+0.6);
  for(const det of [-6,6]){const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=det;o.connect(fl);o.start(t);o.stop(t+dur+0.7);}
  fl.connect(g);g.connect(MUSIC.bus);
}
function musicTick(){
  if(!AC||AC.state!=='running')return;
  if(!MUSIC.bus){MUSIC.bus=AC.createGain();MUSIC.bus.gain.value=MUSIC.on?0.8*SET.music/100:0;MUSIC.bus.connect(MASTER);const s=AC.createGain();s.gain.value=0.6;MUSIC.bus.connect(s);s.connect(REVERB);}
  ambTick();
  if(!MUSIC.on)return;
  if(fileMusicTick())return;
  const now=AC.currentTime;
  if(now<MUSIC.nextT-0.3)return;
  const th=THEMES[MAPID]||THEMES.castle,t0=Math.max(now+0.05,MUSIC.nextT),dur=4;
  const ch=th.prog[MUSIC.step%th.prog.length];MUSIC.step++;
  for(const iv of ch)padNote(th.root*Math.pow(2,iv/12),t0,dur,th.cut);
  padNote(th.root/2*Math.pow(2,ch[0]/12),t0,dur,th.cut*0.5);
  for(let i=0;i<4;i++)if(Math.random()<th.bell){
    const s=th.scale[Math.floor(Math.random()*th.scale.length)],f=th.root*4*Math.pow(2,s/12),t=t0+i+rnd(0,0.4);
    const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.035,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+1.8);
    o.connect(g);g.connect(MUSIC.bus);o.start(t);o.stop(t+1.9);
  }
  // จังหวะกลองเบาๆ ตอนกำลังสู้
  const v=VIEW.cur;
  if(screen==='game'&&v&&v.ph==='play')for(let i=0;i<8;i++){
    const t=t0+i*0.5,o=AC.createOscillator(),g=AC.createGain();
    o.frequency.setValueAtTime(i%4===0?95:70,t);o.frequency.exponentialRampToValueAtTime(35,t+0.18);
    g.gain.setValueAtTime(i%4===0?0.22:0.1,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.2);
    o.connect(g);g.connect(MUSIC.bus);o.start(t);o.stop(t+0.25);
  }
  MUSIC.nextT=t0+dur;
}
setInterval(musicTick,400);
function toggleMusic(){
  MUSIC.on=!MUSIC.on;store('wd_music',MUSIC.on?'1':'0');
  if(MUSIC.bus)MUSIC.bus.gain.setTargetAtTime(MUSIC.on?0.8*SET.music/100:0,AC.currentTime,0.3);
  if(MUSIC.on&&AC)MUSIC.nextT=AC.currentTime;
  if(MY.el){if(MUSIC.on&&MY.playing)MY.el.play().catch(()=>{});else MY.el.pause();}
  toast(MUSIC.on?'🎵 เปิดเพลงประกอบ':'🔇 ปิดเพลงประกอบ');
  const b=document.getElementById('btnMusic');if(b)b.textContent=MUSIC.on?'เพลง: เปิด':'เพลง: ปิด';
}
