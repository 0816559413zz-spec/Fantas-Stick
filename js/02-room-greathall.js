// =====================================================================
//  Room piece: Great Hall (zone 2, core 2 inside) — rule guides/MAP-ROOMS.md • user 2026-11-20 "big castle rooms, high enough to fly"
//  Rect cells x38..63, y35..49 (117 x 67.5 m incl. shell). Interior 111 x 63 m, roof ceiling 21 m.
//  Inside: north gallery 6 m (stairs both ends, railing with 2 drop gaps), 2 rows of big pillars, 4 banquet tables (low cover), carpet.
//  Doors: W x2 (guard rooms / defender spawn 2), E x1 (to zone 3), N x1 + the breakable wall gap (central court).
//  All positions LOCAL px (u right/east, v down/south) from the rect corner — move rect = move the room.
// =====================================================================
fcsRoomAdd({id:'greathall',name:'ห้องโถงใหญ่ (Great Hall)',rect:[38,35,63,49],
  doors:[{side:'W',at:585,w:160,kind:'door'},{side:'W',at:945,w:160,kind:'door'},{side:'E',at:810,w:200,kind:'door'},
         {side:'N',at:1845,w:180,kind:'door'},{side:'N',at:1305,w:630,kind:'bw'}],
  S:{T:45,H:24,ceil:21,door:8.5,gal:6,galV:225,galU0:405,galU1:1935},
  gen(K){const S=this.S,W=K.w,H=K.h,T=S.T,t2=T/2,L=S.door;
    roomWall(K,t2,0,t2,H,T,S.H,[[505,665,L],[865,1025,L]]);                 // west
    roomWall(K,W-t2,0,W-t2,H,T,S.H,[[710,910,L]]);                          // east
    roomWall(K,0,t2,W,t2,T,S.H,[[1755,1935,L],[990,1620,6]]);               // north (bw gap: Map Editor breakable wall, lintel above it)
    roomWall(K,0,H-t2,W,H-t2,T,S.H);                                        // south (map edge)
    roomCeil(K,T,T,W-T,H-T,S.ceil);
    for(const [u,v] of [[0,0],[W,0],[0,H],[W,H]])roomCol(K,u,v,80,40,null,'tower');                 // corner towers (r 4 m)
    // north gallery + stairs (one floor: ramps 18 m at both ends)
    const G=S.gal,gv=S.galV,a=S.galU0,b=S.galU1,e0=T,e1=W-T,rl=a-e0;
    roomFloor(K,e0,T,e1,gv,(u)=>u<a?G*(u-e0)/rl:u>b?G*(e1-u)/(e1-b):G,'gallery');
    roomCeil(K,a,T,b,gv,G-0.6,G-1);                                          // under the gallery deck
    for(let u=e0+7;u<e1;u+=14){const t=u<a?G*(u-e0)/rl:u>b?G*(e1-u)/(e1-b):-1;if(t>0.3)roomCol(K,u,gv-7,8,t,null,'rampside');}   // ramp fronts solid
    // railing: 3 m breakable stone balustrade segments (gaps at 700-790 / 1420-1510 = drop spots)
    for(const [p,q] of [[a,700],[790,1420],[1510,b]]){const n=Math.max(1,Math.round((q-p)/60));for(let i=0;i<n;i++){const L=(q-p)/n;roomProp(K,'rail',p+L*(i+0.5),gv-8,{L:L-4,z0:G});}}
    for(const u of [560,900,1250,1600,1900])roomCol(K,u,gv-22,16,G,null,'post');
    // big pillars (floor to roof): breakable = chips only, never fall
    for(const v of [450,1080])for(const u of [450,810,1530,1890])roomProp(K,'pillar',u,v);
    roomProp(K,'pillar',1170,450);
    for(let u=1100;u<=1240;u+=20)roomCol(K,u,1282,14,2.5,null,'hearth');   // fireplace hearth
    this.decor(K,G);
  },
  // furniture / decor (all breakable BRK props, see RPK in js/02-fcs-rooms.js) — a hall that was lived in
  decor(K,G){const P=(k,u,v,o)=>roomProp(K,k,u,v,o),W=K.w;
    // banquet: 4 long tables + benches + chairs at the ends
    for(const v of [630,900])for(const [u0,u1] of [[480,750],[1530,1800]]){P('table',(u0+u1)/2,v,{L:u1-u0});
      for(const s of [-1,1])P('bench',(u0+u1)/2,v+s*36,{L:u1-u0-20});for(const e of [u0-26,u1+26])P('chair',e,v,{a:e<u0?0:Math.PI});}
    // high table + throne at the east end (north of the east door)
    P('hightable',2130,420,{L:300,a:Math.PI/2});P('throne',2215,420,{a:Math.PI});for(const v of [300,360,480,540])P('chair',2185,v,{a:Math.PI});
    P('candle',2150,250);P('candle',2150,590);P('rack',2270,560,{a:Math.PI});
    // fireplace wood + kegs by the south wall, sacks / crates near the west doors
    P('woodpile',1290,1265);P('woodpile',1050,1268);P('keg',1340,1230);P('keg',990,1235);
    for(const [u,v] of [[90,470],[120,700],[95,760],[90,1060],[130,1230]])P('sack',u,v,{seed:u+v});
    P('crate',110,1160);P('crate2',160,1210);P('barrel',95,410);
    // under the gallery (ground): barrels, crates, racks, sacks
    for(const [u,v] of [[470,95],[505,145],[545,92]])P('barrel',u,v);P('crate',650,95);P('crate2',700,100);P('crate',665,160);
    P('rack',800,62,{a:Math.PI/2});P('rack',900,62,{a:Math.PI/2});P('sack',955,110);P('sack',935,165);
    P('barrels',1690,110);P('crate',1730,180);
    // gallery top (6 m): library — shelves on the north wall, desks, chairs, candles, crates of books
    for(let u=470;u<1920;u+=150){if(u>1700&&u<1960)continue;P('shelf',u,62,{a:Math.PI/2,z0:G});}
    for(const u of [620,1100,1400,1800]){P('desk',u,150,{z0:G});P('chair',u,180,{a:-Math.PI/2,z0:G});}
    for(const u of [520,1250,1880])P('candle',u,130,{z0:G});P('crate',980,110,{z0:G});P('keg',1560,120,{z0:G});
    // along the south wall: armour stands, benches, barrels, a cart
    for(const u of [300,700,1640,2040])P('armor',u,1265,{a:-Math.PI/2});P('bench',500,1270,{L:220});P('bench',1850,1270,{L:220});
    P('barrel',2200,1240);P('barrel',2240,1200);P('crate',2150,1150);P('cart',420,1150,{a:0.3});
    // cover clusters on the open floor + candelabras along the pillar rows
    for(const [u,v] of [[260,330],[300,360]])P('crate',u,v);P('barrel',330,300);
    P('crate2',1990,1000);P('barrel',2030,1040);P('crate',700,1180);P('barrel',740,1215);P('crate',1640,1170);P('keg',1600,1200);
    for(const u of [630,990,1350,1710])for(const v of [450,1080])if(!(u===990&&v===1080))P('candle',u,v+(v<700?40:-40));
    // west wall between the doors: weapon racks
    P('rack',62,765,{a:0});P('armor',70,700,{a:0});P('armor',70,830,{a:0});
  },
  view(K,V){const S=this.S,W=K.w,H=K.h,T=S.T,D=this.data,g0=K.g0,s3=1/20,X=u=>tx(K.X(u)),Z=v=>tz(K.Y(v));
    const B=(L,u,v,y,su,sy,sv)=>V.box(L,X(u),y,Z(v),su*s3,sy,sv*s3);
    // shell walls with door gaps + lintels, buttresses outside, tall windows
    for(const w of D.walls){const along=w.v1===w.v2,s0=Math.min(along?w.u1:w.v1,along?w.u2:w.v2),s1=Math.max(along?w.u1:w.v1,along?w.u2:w.v2);
      const cuts=[[s0,s0]].concat(w.gaps.map(q=>[q[0],q[1]]).sort((p,q)=>p[0]-q[0])).concat([[s1,s1]]);
      const seg=(p,q,y0,y1)=>{if(q-p<1)return;const m=(p+q)/2;if(along)B('stone',m,w.v1,g0+(y0+y1)/2,q-p,y1-y0,w.th);else B('stone',w.u1,m,g0+(y0+y1)/2,w.th,y1-y0,q-p);};
      for(let i=0;i<cuts.length-1;i++)seg(cuts[i][1],cuts[i+1][0],-1,w.h);
      for(const q of w.gaps){seg(q[0],q[1],q[2]==null?w.h:q[2],w.h);const m=(q[0]+q[1])/2,len=q[1]-q[0]+40;   // lintel stones
        if(along)B('dark',m,w.v1,g0+(q[2]||6)+0.3,len,0.6,w.th+16);else B('dark',w.u1,m,g0+(q[2]||6)+0.3,w.th+16,0.6,len);}
      // string courses + windows on the inner face
      if(along)B('dark',(s0+s1)/2,w.v1,g0+S.gal+1.6,s1-s0,0.4,w.th+10);else B('dark',w.u1,(s0+s1)/2,g0+S.gal+1.6,w.th+10,0.4,s1-s0);
      const inner=along?(w.v1<H/2?1:-1):(w.u1<W/2?1:-1);
      for(let a=s0+180;a<s1-120;a+=270){if(w.gaps.some(q=>a>q[0]-90&&a<q[1]+90))continue;
        const off=inner*(w.th/2+1);if(along){B('lit',a,w.v1+off,g0+13.5,70,7,4);B('dark',a,w.v1+off*2,g0+17.3,90,0.7,8);B('dark',a,w.v1-inner*(w.th/2+6),g0+8,60,16,12);}   // window + hood + outer buttress
        else{B('lit',w.u1+off,a,g0+13.5,4,7,70);B('dark',w.u1+off*2,a,g0+17.3,8,0.7,90);B('dark',w.u1-inner*(w.th/2+6),a,g0+8,12,16,60);}}}
    // gallery deck, stairs (stepped), railing, posts
    {const G=S.gal,gv=S.galV,a=S.galU0,b=S.galU1,e0=T,e1=W-T;
     B('stone',(a+b)/2,(T+gv)/2,g0+G-0.3,b-a,0.6,gv-T);B('dark',(a+b)/2,gv,g0+G-0.75,b-a,0.5,14);
     const n=Math.ceil(G/0.35);for(const [p,q,up] of [[e0,a,1],[b,e1,-1]])for(let i=0;i<n;i++){const t=(i+1)/n,hh=G*t,u0=up>0?p+(q-p)*i/n:q-(q-p)*(i+1)/n,u1=u0+(q-p)/n;B('stone',(u0+u1)/2,(T+gv)/2,g0+(hh-1)/2,u1-u0+1,hh+1,gv-T);}
     for(const c of D.cols)if(c.tag==='post')V.box('dark',X(c.u),g0+G/2,Z(c.v),1.4,G,1.4);}
    // pillars: octagonal shaft + base + capital, arches between pillar pairs along the rows
    // pillars / tables / rail / furniture = breakable props (js/28-fcs-props.js) • torch on each pillar
    for(const q of D.props)if(q.kind==='pillar')V.light(X(q.u),g0+4.2,Z(q.v)+(q.v<700?1:-1)*1.75);
    for(const v of [450,1080])V.box('dark',X(1170),g0+S.ceil-0.6,Z(v),(1890-450)*s3+3,1.2,1.6);   // beams along the pillar rows
    // tables + benches + carpet
    // fireplace on the south wall (hearth = low collision in gen)
    B('dark',1170,1290,g0+3,200,6,40);B('slit',1170,1272,g0+1.4,120,2.4,6);B('dark',1170,1262,g0+2.9,170,0.5,40);B('stone',1170,1290,g0+9.5,120,7,26);
    for(const u of [1130,1170,1210])V.light(X(u),g0+0.8,Z(1262));
    // tapestries + shields on the south / west walls, hanging banners from the trusses
    for(const u of [500,900,1450,1850])V.cloth(X(u),g0+11,Z(H-T-4),2.6,6,0,u%2?'#7a1418':'#23407a');
    for(let u=T+90;u<W-T;u+=270)V.cloth(X(u),g0+S.ceil-1.5,Z(765),1.8,5,Math.PI/2,'#7a1418');
    for(const u of [200,1450,1700,2100])for(const k of [0,1])V.shield(X(u+k*60),g0+7.5,Z(H-T-6),0);
    V.box('carpet',X(W/2),g0+0.04,Z(765),(W-2*T-60)*s3,0.04,4);
    // roof: trusses + gabled roof over the whole rect (ridge east-west)
    for(const c of D.cols)if(c.tag==='tower'){const x=X(c.u),z=Z(c.v);V.cyl('stone',x,g0+15,z,4,4.3,32,12);V.cyl('dark',x,g0+31.2,z,4.5,4.1,1.2,12);V.cone('roof',x,g0+38,z,4.9,13,12);
      for(const a of [0,1.57,3.14,4.71])V.box('slit',x+Math.cos(a)*4.05,g0+20,z+Math.sin(a)*4.05,0.25,1.6,0.25);}
    const rh=19,cx=X(W/2),cz=Z(H/2),RW=W*s3+2,RD=H*s3+2;
    for(let u=T+90;u<W-T;u+=270){V.box('wood',X(u),g0+S.ceil+0.4,cz,0.7,0.8,RD-3);V.box('wood',X(u),g0+S.ceil+rh*0.45,cz,0.5,rh*0.9,0.5);}
    V.roof(cx,g0+S.H,cz,RW,RD,rh);
    // chandeliers
    for(const u of [630,1350,2010])for(const v of [765])V.chandelier(X(u),g0+S.ceil-6,Z(v));
  }
});
