// GIF: fire player attacks the Castle Strike bridge (basic fire visuals + damageEnv hits on the wall)
await HL.solo({mode:'train',kit:'0'});
dispatchEvent(new KeyboardEvent('keydown',{code:'F2',key:'F2',bubbles:true}));HL.step(10);
[...document.querySelectorAll('[data-d="mode"]')].find(x=>x.dataset.v==='siege').click();HL.step(5);
dispatchEvent(new KeyboardEvent('keydown',{code:'F2',key:'F2',bubbles:true}));
const G=WD.G;G.sg.prep=0;for(let i=0;i<300&&G.ph!=='play';i++)HL.step(1);
const me=HL.me(),PX=800,PY=1238.6;me.x=PX;me.y=PY;me.ang=0;me.z=0;HL.aim(0,0.1);HL.step(30);
const wx=PX/20-315,wz=PY/20-112.5;
WD.camHook=cam=>{cam.position.set(wx-6,2.6,wz-5.5);cam.lookAt(wx+5,2.4,wz+1.2);};
HL.step(10);
const imgs={};let n=0;const hits=[[0.9,0],[1.3,-26],[1.7,30],[2.1,-8],[2.5,48],[2.9,-40],[3.3,16]];
for(let i=0;i<270;i++){
  const t=i/60;me.x=PX;me.y=PY;
  WD.INPUT.fire=t>0.3&&t<5.2;
  for(const h of hits)if(i===Math.round(h[0]*60))WD.damageEnv(880,PY+h[1],60,40,me.id,'fireblast',2.5);
  HL.step(1);
  if(i%3===0)imgs['f'+String(n++).padStart(3,'0')]=HL.snap(640).toDataURL('image/jpeg',0.85);
}
WD.INPUT.fire=false;
return {images:imgs,bsk:String(WD.bskSnap&&WD.bskSnap()||'').length};
