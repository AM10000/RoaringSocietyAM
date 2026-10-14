/* Props, part 1: everything that makes the shell read as a building:
   artwork hangings, signs, grand stairs, railings, columns, door frames, chandeliers, benches and chairs. */
(function(){
'use strict';
const W=window.World,D=window.DATA,H=W.H,N=W.N,B=W.B,ORIGIN=W.ORIGIN;
const ix=(x,y)=>y*N+x;
const P=window.Props={};
W.seats=[];W.signs=[];W.artSpots={};
const wp=(g,lx,ly)=>[ORIGIN[g][0]+lx,ORIGIN[g][1]+ly];
P.wp=wp;
const DIRANG={E:0,S:Math.PI/2,W:Math.PI,N:-Math.PI/2};
const OPP={E:'W',W:'E',N:'S',S:'N'};
P.OPP=OPP;P.DIRANG=DIRANG;

/* ------------------------------------------------ seating */
function seat(x,y,z,facing,label){W.seats.push({x,y,z,a:DIRANG[facing],label:label||'Sit down'})}
/* bench: centre (cx,cy); sitter faces `facing`; long side perpendicular to facing */
P.bench=function(ch,cx,cy,facing,len,opts){
 len=len||1.8;const dep=.5;const alongX=(facing==='N'||facing==='S');
 const w=alongX?len:dep,d=alongX?dep:len;
 const x0=cx-w/2,x1=cx+w/2,y0=cy-d/2,y1=cy+d/2;
 const wood=(opts&&opts.tile)||'wood_light';
 W.box(ch,x0,y0,.4,x1,y1,.5,{top:wood,side:wood,bot:'wood_dark'},{solid:false});
 // legs
 const lg=.09;const legs=alongX?[[x0+.08,y0+.06],[x1-.08-lg,y0+.06],[x0+.08,y1-.06-lg],[x1-.08-lg,y1-.06-lg]]:[[x0+.06,y0+.08],[x1-.06-lg,y0+.08],[x0+.06,y1-.08-lg],[x1-.06-lg,y1-.08-lg]];
 legs.forEach(l=>W.box(ch,l[0],l[1],0,l[0]+lg,l[1]+lg,.4,'wood_dark',{solid:false}));
 // back rest on the side opposite facing
 if(!(opts&&opts.noBack)){const bk=.07;let b0x=x0,b1x=x1,b0y=y0,b1y=y1;
  if(facing==='N'){b0y=y1-bk}else if(facing==='S'){b1y=y0+bk}else if(facing==='E'){b1x=x0+bk}else{b0x=x1-bk}
  W.box(ch,b0x,b0y,.5,b1x,b1y,1.0,{all:wood,top:wood},{solid:false});}
 W.addSolid({x0,x1,y0,y1,b:0,t:.5,kind:'seat'});
 // seats every ~0.9 m
 const n=Math.max(1,Math.floor(len/.9));
 for(let k=0;k<n;k++){const off=(k+.5)*len/n-len/2;seat(alongX?cx+off:cx,alongX?cy:cy+off,.5,facing,'Sit on the bench')}
};
P.chair=function(ch,cx,cy,facing,tile){
 tile=tile||'wood_dark';const s=.46;const x0=cx-s/2,x1=cx+s/2,y0=cy-s/2,y1=cy+s/2;
 W.box(ch,x0,y0,.42,x1,y1,.5,{top:'cloth_red',side:tile,bot:tile},{solid:false});
 [[x0,y0],[x1-.06,y0],[x0,y1-.06],[x1-.06,y1-.06]].forEach(l=>W.box(ch,l[0],l[1],0,l[0]+.06,l[1]+.06,.42,tile,{solid:false}));
 const bk=.06;let b0x=x0,b1x=x1,b0y=y0,b1y=y1;
 if(facing==='N'){b0y=y1-bk}else if(facing==='S'){b1y=y0+bk}else if(facing==='E'){b1x=x0+bk}else{b0x=x1-bk}
 W.box(ch,b0x,b0y,.5,b1x,b1y,1.0,{all:tile},{solid:false});
 W.addSolid({x0,x1,y0,y1,b:0,t:.5,kind:'seat'});
 seat(cx,cy,.5,facing,'Sit on the chair');
};
P.table=function(ch,x0,y0,x1,y1,h,tile,top){
 h=h||.76;tile=tile||'wood';const t=.07;
 W.box(ch,x0,y0,h-t,x1,y1,h,{top:top||tile,side:tile,bot:'wood_dark'},{solid:false});
 const lg=.1;[[x0+.05,y0+.05],[x1-.05-lg,y0+.05],[x0+.05,y1-.05-lg],[x1-.05-lg,y1-.05-lg]].forEach(l=>W.box(ch,l[0],l[1],0,l[0]+lg,l[1]+lg,h-t,'wood_dark',{solid:false}));
 W.addSolid({x0:x0+.04,x1:x1-.04,y0:y0+.04,y1:y1-.04,b:0,t:h,kind:'table'});
};
P.rug=function(ch,x0,y0,x1,y1,z){W.box(ch,x0,y0,0,x1,y1,.02,{top:'rugfringe',side:'rugfringe'},{solid:false,light:.9})};

/* ------------------------------------------------ columns, chandeliers, door frames */
P.columns=function(g){
 const [ox,oy]=ORIGIN[g];
 [[10,4],[16,4],[4,10],[4,16],[10,16],[16,10]].forEach(([lx,ly])=>{
  const x=ox+lx,y=oy+ly,r=.36;
  W.box(g,x-r,y-r,0,x+r,y+r,H.slabB,{top:'column',side:'column'},{solid:true,kind:'column',noTop:true});
  W.box(g,x-.5,y-.5,0,x+.5,y+.5,.35,{top:'marble_white',side:'marble_white'},{solid:false});
  W.box(g,x-.5,y-.5,H.slabB-.35,x+.5,y+.5,H.slabB,{top:'marble_white',side:'marble_white',bot:'marble_white'},{solid:false});
 });
};
P.chandeliers=function(g){
 const [ox,oy]=ORIGIN[g];
 [[8,8],[12,8],[8,12],[12,12]].forEach(([lx,ly])=>{const x=ox+lx+.5,y=oy+ly+.5;
  W.box(g,x-.03,y-.03,8.5,x+.03,y+.03,H.roofB,'iron',{solid:false,light:.9});
  W.box(g,x-.35,y-.35,7.9,x+.35,y+.35,8.2,{all:'brass',bot:'lamp'},{solid:false,light:1});
  W.box(g,x-.15,y-.15,8.2,x+.15,y+.15,8.5,'brass',{solid:false,light:1});
  [[-.45,0],[.45,0],[0,-.45],[0,.45]].forEach(([a,b])=>W.box(g,x+a-.07,y+b-.07,7.95,x+a+.07,y+b+.07,8.2,'lamp',{solid:false,light:1.2}));
 });
 // lanterns under the balcony
 [[2,10],[10,2],[17,10],[10,17]].forEach(([lx,ly])=>{const x=ox+lx+.5,y=oy+ly+.5;W.box(g,x-.12,y-.12,4.1,x+.12,y+.12,4.4,'lamp',{solid:false,light:1.15});W.box(g,x-.015,y-.015,4.4,x+.015,y+.015,H.slabB,'iron',{solid:false})});
};
P.doorFrames=function(){
 W.doorways.forEach(d=>{
  const ch=W.blockAt(Math.floor(d.cx),Math.floor(d.cy));const chId=ch;const t=d.thick+.14,hw=1;
  if(d.along==='y'){ // wall plane is x = cx, opening runs along y
   [[d.cy-hw-.14,d.cy-hw],[d.cy+hw,d.cy+hw+.14]].forEach(([a,b])=>W.box(chId,d.cx-t/2,a,0,d.cx+t/2,b,H.door,{all:'doorframe',top:'doorframe'},{solid:false,light:.9}));
   W.box(chId,d.cx-t/2,d.cy-hw-.14,H.door-.16,d.cx+t/2,d.cy+hw+.14,H.door,{all:'doorframe'},{solid:false,light:.9});
  }else{
   [[d.cx-hw-.14,d.cx-hw],[d.cx+hw,d.cx+hw+.14]].forEach(([a,b])=>W.box(chId,a,d.cy-t/2,0,b,d.cy+t/2,H.door,{all:'doorframe',top:'doorframe'},{solid:false,light:.9}));
   W.box(chId,d.cx-hw-.14,d.cy-t/2,H.door-.16,d.cx+hw+.14,d.cy+t/2,H.door,{all:'doorframe'},{solid:false,light:.9});
  }
 });
};

/* ------------------------------------------------ stairs and railings */
const STEPS=20,RISE=.25,RUN=.4;
P.stairs=function(g){
 const [ox,oy]=ORIGIN[g];
 for(let k=1;k<=STEPS;k++){
  const y0=oy+11+RUN*(k-1),y1=oy+11+RUN*k,top=RISE*k;
  W.box(g,ox+17,y0,0,ox+19,y1,top,{top:'stair_top',side:'stair_riser',n:'stair_riser',s:'stair_riser'},{solid:true,kind:'stair',light:.95});
  // west-side rail, steps 3..17
  if(k>=3&&k<=17){W.box(g,ox+16.94,y0,top,ox+17.06,y1,top+.95,{all:'rail',top:'rail'},{solid:true,kind:'rail',light:.95});W.box(g,ox+16.9,y0,top+.95,ox+17.1,y1,top+1.05,'wood_dark',{solid:false,light:.95})}
 }
 // handrail post at the foot
 W.box(g,ox+16.9,oy+10.9,0,ox+17.1,oy+11.1,1.1,'wood_dark',{solid:false});
 // runner on the treads
 // sign: "Upstairs" plaque
};
P.rails=function(g){
 const [ox,oy]=ORIGIN[g];
 for(let ly=1;ly<=18;ly++)for(let lx=1;lx<=18;lx++){
  const x=ox+lx,y=oy+ly,i=ix(x,y);if(!W.slab[i])continue;
  for(const [d,dx,dy] of [['E',1,0],['W',-1,0],['S',0,1],['N',0,-1]]){
   const nx=x+dx,ny=y+dy;const ni=ix(nx,ny);
   if(W.ctype[ni]||W.slab[ni])continue;
   if(lx===16&&ly===18&&d==='E')continue; // stair exit
   const zt=H.slabT;const th=.1;
   let x0,x1,y0,y1;
   if(d==='E'){x0=x+1-th;x1=x+1;y0=y;y1=y+1}else if(d==='W'){x0=x;x1=x+th;y0=y;y1=y+1}else if(d==='S'){x0=x;x1=x+1;y0=y+1-th;y1=y+1}else{x0=x;x1=x+1;y0=y;y1=y+th}
   // top rail, base rail, balusters
   W.box(g,x0-(d==='E'||d==='W'?.02:0),y0-(d==='N'||d==='S'?.02:0),zt+.95,x1+(d==='E'||d==='W'?.02:0),y1+(d==='N'||d==='S'?.02:0),zt+1.05,'wood_dark',{solid:false,light:1});
   W.box(g,x0,y0,zt,x1,y1,zt+.12,'wood_dark',{solid:false,light:1});
   const bal=(d==='E'||d==='W')?[[0.12],[.37],[.62],[.87]].map(a=>[x0,y+a[0]-.03,x1,y+a[0]+.03]):[[0.12],[.37],[.62],[.87]].map(a=>[x+a[0]-.03,y0,x+a[0]+.03,y1]);
   bal.forEach(b=>W.box(g,b[0],b[1],zt+.12,b[2],b[3],zt+.95,'baluster',{solid:false,light:1}));
   W.addSolid({x0,x1,y0,y1,b:zt,t:zt+1.1,kind:'rail'});
  }
 }
};

/* ------------------------------------------------ art, signs */
function perimeter(g){
 const [ox,oy]=ORIGIN[g];const out=[];
 const courtSide=({4:'B',2:'R',6:'L',0:'T'})[g];
 const nearDoor=(x,y)=>{for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=N||yy>=N)continue;if(W.lintel[ix(xx,yy)]&&!W.ctype[ix(xx,yy)]&&W.floorId[ix(xx,yy)]===g)return true}return false};
 const push=(lx,ly,side,dir)=>{if(side===courtSide)return;const x=ox+lx,y=oy+ly;if(nearDoor(x,y))return;if(W.map[ix(x,y)]>=200)return;out.push({x,y,lx,ly,side,dir,room:W.roomOf(g,lx,ly)})};
 for(let lx=2;lx<=B-3;lx++)push(lx,0,'T','S');
 for(let ly=2;ly<=B-3;ly++)push(B-1,ly,'R','W');
 for(let lx=B-3;lx>=2;lx--)push(lx,B-1,'B','N');
 for(let ly=B-3;ly>=2;ly--)push(0,ly,'L','E');
 return out;
}
const ENT={1:[19,7],2:[3,19],3:[3,19],4:[0,14],5:[0,14],6:[14,0],7:[14,0]};
P.signs=function(){
 const add=(g,lx,ly,text,opts,dir)=>{const [ox,oy]=ORIGIN[g];const x=ox+lx,y=oy+ly;W.signs.push({x,y,text,g,opts:opts||{},dir});W.map[ix(x,y)]=200+W.signs.length-1};
 const legend=[['Gold frame = primary source','gold'],['Silver frame = secondary source','silver'],['Green plaque = evidence panel','green']];
 legend.forEach((l,i)=>add(0,3+i*2,B-1,l[0],{legend:l[1]},'N'));
 add(0,B-1,4,'Press T to teleport',{tele:1},'W');
 add(0,12,B-1,'Welcome to The Roaring Society',{},'N');
 const dirOf=(lx,ly)=>ly===0?'S':ly===B-1?'N':lx===0?'E':'W';
 for(let g=1;g<=7;g++){const e=ENT[g];add(g,e[0],e[1],D.G[g].t,{gal:g},dirOf(e[0],e[1]))}
 // "Upstairs" signs at the foot of every staircase (wall behind stairs is the east wall; put on the column beside)
};
const FR={gold:'gold',silver:'silver',green:'greenframe'};
P.art=function(){
 const placed={};
 for(let g=1;g<=5;g++){
  const arts=D.A.map((a,i)=>[a,i]).filter(p=>p[0].g===g);
  const all=perimeter(g);const used=new Set();const usedL=[];
  const [ox,oy]=ORIGIN[g];
  const ok0=c=>{ // ground level
   if(c.dir==='S'&&c.lx<=5)return false;            // behind the secret chamber (north wall)
   if(c.dir==='E'&&c.ly<=5)return false;            // behind the secret chamber (west wall)
   if(c.dir==='W'&&c.ly>=11)return false;           // stair against east wall
   if(c.dir==='N'&&c.lx>=16)return false;
   return true};
  const ok1=c=>{if(c.dir==='W'&&c.ly>=11)return false;if(c.dir==='N'&&c.lx>=17)return false;return true};
  for(let r=0;r<4;r++){
   const mine=arts.filter(p=>p[0].room===r);if(!mine.length)continue;
   const ground=mine.filter(p=>p[0].frame==='gold'),upper=mine.filter(p=>p[0].frame!=='gold');
   const lvls=[[ground,0,ok0],[upper,1,ok1]];
   lvls.forEach(([list,lvl,ok])=>{
    if(!list.length)return;
    const cands=all.filter(c=>c.room===r&&ok(c)&&!used.has(c.x+','+c.y));
    list.forEach((p,k)=>{
     const conflict=c=>used.has(c.x+','+c.y)||usedL.some(u=>u.lvl===lvl&&u.dir===c.dir&&Math.abs(u.x-c.x)+Math.abs(u.y-c.y)<2);
     const start=Math.min(cands.length-1,Math.floor((k+.5)*cands.length/list.length));
     let c=null;for(let d=0;d<cands.length&&!c;d++){for(const j of [start+d,start-d]){const cc=cands[j];if(cc&&!conflict(cc)){c=cc;break}}}
     if(!c){const fb=all.filter(cc=>ok(cc)&&!conflict(cc));c=fb[Math.floor(fb.length/2)]}
     if(!c)return;used.add(c.x+','+c.y);usedL.push({x:c.x,y:c.y,dir:c.dir,lvl});
     const i=p[1];W.map[ix(c.x,c.y)]=100+i;
     W.artSpots[i]={i,cell:[c.x,c.y],dir:c.dir,level:lvl,g};
     placed[i]=true;
    });
   });
  }
 }
 // geometry
 Object.values(W.artSpots).forEach(s=>{
  const [cx,cy]=s.cell,d=W.DIRV[s.dir];const a=D.A[s.i];
  // wall surface point and outward normal
  const px=cx+.5+(s.dir==='E'?.5:s.dir==='W'?-.5:0),py=cy+.5+(s.dir==='S'?.5:s.dir==='N'?-.5:0);
  const zc=s.level*5+2.05;const pw=1.5,ph=1.1;
  s.x=px;s.y=py;s.z=zc;s.w=pw;s.h=ph;s.nx=d[0];s.ny=d[1];s.light=W.lightAt(cx+.5+d[0],cy+.5+d[1],zc);
  const ft=FR[a.frame]||'gold';const g=s.g;
  // frame boxes (thin, mounted on the wall)
  const e=.08,dep=.09;const along=(d[0]!==0)?'y':'x';
  const bx=(u0,u1,v0,v1)=>{ // u along the wall, v up
   let x0,x1,y0,y1;
   if(along==='x'){x0=px+u0;x1=px+u1;y0=Math.min(py,py+d[1]*dep);y1=Math.max(py,py+d[1]*dep)}
   else{y0=py+u0;y1=py+u1;x0=Math.min(px,px+d[0]*dep);x1=Math.max(px,px+d[0]*dep)}
   W.box(g,x0,y0,zc+v0,x1,y1,zc+v1,{all:ft,top:ft,bot:ft},{solid:false,light:s.light})};
  const hw=pw/2+e,hh=ph/2+e;
  bx(-hw,hw,-hh,-hh+e);bx(-hw,hw,hh-e,hh);bx(-hw,-hw+e,-hh,hh);bx(hw-e,hw,-hh,hh);
  // backing board slightly behind painting
  // plaque
  bx(-.28,.28,-hh-.26,-hh-.1);
  // picture light
  bx(-.3,.3,hh+.08,hh+.14);
 });
};
})();
