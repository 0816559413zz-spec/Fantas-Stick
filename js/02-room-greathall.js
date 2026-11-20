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
    for(let u=a;u<=b;u+=16){if((u>700&&u<790)||(u>1420&&u<1510))continue;roomCol(K,u,gv-8,9,G+1.1,G-0.3,'rail');}             // railing (floating)
    for(const u of [560,900,1250,1600,1900])roomCol(K,u,gv-22,16,G,null,'post');
    // big pillars (floor to roof)
    for(const v of [450,1080])for(const u of [450,810,1530,1890])roomCol(K,u,v,26,S.H,null,'pillar');
    roomCol(K,1170,450,26,S.H,null,'pillar');
    // banquet tables (low cover, stand on top)
    for(const v of [630,900])for(const [u0,u1] of [[480,750],[1530,1800]]){for(let u=u0;u<=u1;u+=18){K.obs.push({x:K.X(u),y:K.Y(v),r:20,k:'fcm',hgt:1.0,st:1,s:0});}K.data.boxes.push({u0,u1,v,tag:'table'});}
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
     for(const c of D.cols){if(c.tag==='rail')V.box('wood',X(c.u),g0+G+0.5,Z(c.v),0.25,1.0,0.25);
       else if(c.tag==='post'){V.box('dark',X(c.u),g0+G/2,Z(c.v),1.4,G,1.4);}}
     for(const [p,q] of [[a,700],[790,1420],[1510,b]])B('wood',(p+q)/2,gv-8,g0+G+1.05,q-p,0.18,8);}
    // pillars: octagonal shaft + base + capital, arches between pillar pairs along the rows
    for(const c of D.cols)if(c.tag==='pillar'){const x=X(c.u),z=Z(c.v),r=c.r*s3;V.cyl('stone',x,g0+S.ceil/2,z,r*0.92,r,S.ceil,8);V.box('dark',x,g0+0.5,z,r*2.6,1,r*2.6);V.box('dark',x,g0+S.ceil-1.2,z,r*2.5,1.2,r*2.5);
      V.light(x,g0+4.2,z+(c.v<700?1:-1)*(r+0.45));}
    for(const v of [450,1080])V.box('dark',X(1170),g0+S.ceil-0.6,Z(v),(1890-450)*s3+3,1.2,1.6);   // beams along the pillar rows
    // tables + benches + carpet
    for(const t of D.boxes)if(t.tag==='table'){B('wood',(t.u0+t.u1)/2,t.v,g0+0.9,t.u1-t.u0+30,0.2,46);for(const s of [-1,1]){B('wood',(t.u0+t.u1)/2,t.v+s*36,g0+0.45,t.u1-t.u0+20,0.12,14);}
      for(const u of [t.u0,t.u1])for(const s of [-1,1])B('wood',u,t.v+s*16,g0+0.4,8,0.8,8);}
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
