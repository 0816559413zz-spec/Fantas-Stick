await HL.solo({kit:'0'});
const G=WD.G,me=HL.me();
const d=HL.dummy(110,0);d.spd=0;d.ax=d.x;d.ay=d.y;
HL.cam('side',{dist:7,h:1.6,fwd:3,look:[0,1.2,3]});
HL.aim(me.ang);HL.step(20);
const imgs={};let n=0;
const grab=()=>{imgs['f'+String(n++).padStart(3,'0')]=HL.snap(640).toDataURL('image/jpeg',0.85);};
for(let i=0;i<150;i++){
  const t=i/60;
  d.spd=0;d.x=d.ax;d.y=d.ay;
  WD.INPUT.fire=(t>0.3&&t<2.0)||t>2.3?true:false;
  HL.aim(me.ang);
  HL.step(1);
  if(i%3===0)grab();
}
WD.INPUT.fire=false;
return {images:imgs};
