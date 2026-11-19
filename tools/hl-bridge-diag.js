await HL.solo({mode:'train',kit:'0'});
dispatchEvent(new KeyboardEvent('keydown',{code:'F2',key:'F2',bubbles:true}));HL.step(10);
const b=[...document.querySelectorAll('[data-d="mode"]')].find(x=>x.dataset.v==='siege');
if(!b)return {err:'nobtn',btns:[...document.querySelectorAll('[data-d]')].length,on:WD.dev.on};
b.click();HL.step(5);
const G=WD.G;
return {ph:G.ph,map:G.map,sg:!!G.sg,me:HL.info(),wd:Object.keys(WD).filter(k=>/BSK|damageEnv|FCS|sgF|MAPS/i.test(k))};
