// ภาพประกอบหน้าคู่มือ (รูปขวาของแต่ละหัวข้อ) จากในเกมจริง ไม่มี UI → assets/ui/guide/<หัวข้อ>.jpg (1600×900)
// ต้องเปิด python tools/serve.py ก่อน • ใช้ headless.js + hl-game.js (ภาพ canvas อย่างเดียว = ไม่มี HUD)
//   node tools/guide-shots.js [หัวข้อ...] --try   → ถ่ายหลายจังหวะต่อหัวข้อ ลง shots/guide-<หัวข้อ>.jpg (รูปรวมไว้เลือก)
//   node tools/guide-shots.js [หัวข้อ...]         → ถ่ายจังหวะที่เลือกไว้ (pick ด้านล่าง) ลง assets/ui/guide/
const {execFileSync}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const ROOT=path.join(__dirname,'..'),OUT=path.join(ROOT,'assets','ui','guide');
// ฉากต่อหัวข้อ: setup = โค้ดในหน้า (เริ่มเกม/วางของ/ตั้งกล้อง) • act(f) = ทำทุกเฟรม • at = เฟรมที่ถ่ายตอน --try • pick = เฟรมที่ใช้จริง
const T={
  welcome:{setup:`await SOLO('ffa','ruins','0',[['2',0]]);TARGET(380);HL.cam('side',{dist:9,h:1.6,look:[0,1.3,4.5]});`,act:`const me=HL.me(),b=WD.G.players.bot1;[me,b].forEach(p=>{p.cd={q:0,e:0,r:0,f:0,basic:0,dodge:0};p.hp=p.maxHp;});if(f%60===0)WD.castSlot(me,1);if(f%60===20)WD.castSlot(b,0);HL.input({fire:f%20<10?1:0});`,at:[40,70,100,130,160,190],pick:160},
  controls:{setup:`await SOLO('ffa','ruins','2',[['1',0]]);TARGET(300);HL.cam('back',{dist:5.4,h:1.1,look:[0,1.4,6]});`,act:`HL.input({u:f<100?1:0,fire:f%24<16?1:0});if(f===80)WD.castSlot(HL.me(),0);`,at:[40,70,90,110,140,170],pick:70},
  shield:{setup:`await SOLO('ffa','ruins','0',[['2',1]]);TARGET(260);HL.cam('q34',{dist:6.5,h:1.5,look:[0,1.1,2.2]});`,act:`HL.input({sh:1});const b=WD.G.players.bot1;if(b&&f%20===0){b.cd.basic=0;}`,at:[60,120,180,240,300,360],pick:120},
  pyro:{setup:`await SOLO('ffa','castle','0',[['1',0]]);TARGET(260);HL.cam('q34',{dist:8,h:1.8,look:[0,1.2,3.5]});`,act:`CASTS(f);`,at:[25,75,125,175,225,265],pick:125},
  frost:{setup:`await SOLO('ffa','castle','1',[['0',0]]);TARGET(260);HL.cam('q34',{dist:8,h:1.8,look:[0,1.2,3.5]});`,act:`CASTS(f);`,at:[25,75,125,175,225,265],pick:125},
  storm:{setup:`await SOLO('ffa','forest','2',[['0',0]]);TARGET(260);HL.cam('q34',{dist:8,h:1.8,look:[0,1.2,3.5]});`,act:`CASTS(f);`,at:[25,75,125,175,225,265],pick:265},
  earth:{setup:`await SOLO('ffa','ruins','6.37.38.39.41',[['0',0]]);TARGET(260);HL.cam('q34',{dist:8,h:1.8,look:[0,1.2,3.5]});`,act:`CASTS(f);`,at:[25,75,125,175,225,265],pick:175},
  modes:{setup:`await SOLO('coop','forest','0',[['1',0],['2',0]]);for(let i=0;i<1200&&!(WD.G.en&&WD.G.en.length>5);i++)HL.step(1);HL.cam('q34',{dist:11,h:4,look:[0,1,4]});`,act:`Object.values(WD.G.players).forEach(p=>{p.hp=p.maxHp;});if(f===60)WD.castSlot(HL.me(),0);`,at:[30,60,90,120,150,180],pick:120},
  credits:{setup:`HUBSTUDY=true;`,act:``,at:[30],pick:30},
  friends:{setup:`HUBROOM=true;`,act:``,at:[30],pick:30},
};
const PRE=`for(let i=0;i<300&&!window.WD;i++)await HL.sleep(100);
document.getElementById('intro')&&document.getElementById('intro').classList.add('gone');await HL.sleep(1200);
{const ok=document.getElementById('crOk');if(ok&&!document.getElementById('creator').classList.contains('hidden'))ok.click();}await HL.sleep(500);
const BOTS=async n=>{const kits=['1','2','6.37.38.39.41','0'];for(let i=1;i<=n;i++){WD.addPlayer('bot'+i,'Bot'+i);}WD.broadcastLobby();
  const P=Object.values(WD.G.players);P.forEach((p,i)=>{if(p.id!==WD.NET.myId){WD.setKit(p,kits[i%kits.length]);p.bot=true;}});};
const ALLCAST=()=>Object.values(WD.G.players).forEach(p=>{p.cd={q:0,e:0,r:0,f:0,basic:0,dodge:0};p.hp=p.maxHp;p.alive=true;WD.castSlot(p,Math.floor(Math.random()*4));});
const CASTS=f=>{const p=HL.me();p.cd={q:0,e:0,r:0,f:0,basic:0,dodge:0};p.hp=p.maxHp;if(f%50===0&&f<200){const b=WD.G.players.bot1;if(b){p.ang=Math.atan2(b.y-p.y,b.x-p.x);WD.setYaw&&0;}WD.castSlot(p,f/50);}if(f===200){p.ult=100;WD.castUlt(p);}};
let HUBROOM=false,HUBSTUDY=false;
// เริ่มแมตช์คนเดียว + บอท (เพิ่มในล็อบบี้ก่อนเริ่ม) • B = [[ชุดคาถา, AI?]...] • ข้ามนับถอยหลัง
const SOLO=async(mode,map,kit,B)=>{try{localStorage.setItem('wd_kit2',kit);}catch(e){}
  document.getElementById('btnSolo').click();for(let i=0;i<40&&WD.screen!=='lobby';i++)await HL.sleep(100);
  const G=WD.G;G.mode=mode;G.mapPick=map;(B||[]).forEach((b,i)=>WD.addPlayer('bot'+(i+1),'Bot'+(i+1)));WD.broadcastLobby();
  WD.setKit(G.players[WD.NET.myId],kit);(B||[]).forEach((b,i)=>{const p=G.players['bot'+(i+1)];WD.setKit(p,b[0]);p.bot=!!b[1];});
  WD.hostStart();for(let i=0;i<80&&WD.screen!=='game';i++)await HL.sleep(100);
  await HL.sleep(2500);HL.freeze();for(let i=0;i<500&&WD.G.ph!=='play';i++)HL.step(1);HL.step(60);await HL.sleep(1500);HL.step(20);};
// บอทตัวแรกยืนตรงหน้าเรา d px • SPREAD = บอททุกตัวล้อมรอบเรา
const TARGET=d=>{const me=HL.me(),b=WD.G.players.bot1;if(!b)return;const a=me.ang||0;b.x=me.x+Math.cos(a)*d;b.y=me.y+Math.sin(a)*d;b.ang=a+Math.PI;HL.step(2);};
const SPREAD=r=>{const me=HL.me();Object.values(WD.G.players).filter(p=>p!==me).forEach((p,i,A)=>{const a=(me.ang||0)+(i-(A.length-1)/2)*0.7;p.x=me.x+Math.cos(a)*r;p.y=me.y+Math.sin(a)*r;p.ang=a+Math.PI;});HL.step(2);};
`;
const A=process.argv.slice(2),TRY=A.includes('--try'),names=A.filter(a=>!a.startsWith('--'));
fs.mkdirSync(OUT,{recursive:true});
for(const [k,S] of Object.entries(T)){
  if(names.length&&!names.includes(k))continue;
  const frames=TRY?S.at:[S.pick],js=path.join(os.tmpdir(),'guide-'+k+'.js');
  fs.writeFileSync(js,PRE+S.setup+`
const W=1600,cells=[];
if(HUBSTUDY){   // ฉากเมนูแรก (โต๊ะ + คทา)
  for(let i=0;i<80&&!WD.HUB.me;i++)await HL.sleep(150);await HL.sleep(1500);HL.freeze();
  let now=performance.now();for(let i=0;i<120;i++){now+=16.7;WD.render(1/60,now);}
  const c=document.createElement('canvas');c.width=W;c.height=900;c.getContext('2d').drawImage(WD.gl.domElement,0,0,W,900);cells.push(c);
}else if(HUBROOM){   // ห้องรอเริ่ม (ฉากแท่นเวท) + เพื่อน 3 คน
  WD.HUB&&0;document.querySelector('.hCard[data-mode="ffa"]');
  for(let i=0;i<80&&!WD.HUB.me;i++)await HL.sleep(150);
  document.getElementById('btnSolo').click();for(let i=0;i<40&&WD.screen!=='lobby';i++)await HL.sleep(100);
  for(let i=1;i<=3;i++)WD.addPlayer('bot'+i,'Bot'+i);WD.broadcastLobby();await HL.sleep(2500);HL.freeze();
  let now=performance.now();for(let i=0;i<180;i++){now+=16.7;WD.render(1/60,now);}
  const c=document.createElement('canvas');c.width=W;c.height=900;c.getContext('2d').drawImage(WD.gl.domElement,0,0,W,900);cells.push(c);
}else{
  let f=0;const want=${JSON.stringify(frames)};
  for(;f<=want[want.length-1];f++){${S.act}HL.step(1);if(want.includes(f)){const c=HL.snap(W);cells.push(c);}}
}
const out={};
if(${TRY}){out['guide-${k}']=HL.sheet(cells.map((c,i)=>({c:(()=>{const s=document.createElement('canvas');s.width=640;s.height=360;s.getContext('2d').drawImage(c,0,0,640,360);return s;})(),label:'f'+want_[i]})),3);}
else out['guide_${k}']=cells[0].toDataURL('image/jpeg',0.86);
return {images:out,errs:HL.errs};`.replace('want_',TRY?JSON.stringify(frames):'[0]'));
  try{execFileSync('node',[path.join(__dirname,'headless.js'),'--game','--js',js,'--w','1600','--h','900','--timeout','300','--quiet'],{stdio:'inherit'});}catch(e){console.log('✗',k);continue;}
  if(!TRY){const src=path.join(ROOT,'shots','guide_'+k+'.jpg');if(fs.existsSync(src)){fs.copyFileSync(src,path.join(OUT,k+'.jpg'));console.log('✓ assets/ui/guide/'+k+'.jpg');}}
}
