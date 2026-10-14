/* Pixel-art first-person engine: raycaster, ring museum world, sprites, NPCs */
(function(){
'use strict';
const RS=window.RS,D=RS.D;
const N=60,B=20; // map size, block size
const TEX=64;
const pack=(r,g,b,a)=>((a===undefined?255:a)<<24)|(b<<16)|(g<<8)|r;
const hex=h=>{h=h.replace('#','');return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)]};
const mix=(c,k)=>c.map(v=>Math.max(0,Math.min(255,Math.round(v*k))));
const E=window.Engine={};

/* ---- block layout ---- */
const BLOCK={'1,2':0,'0,2':1,'0,1':2,'0,0':3,'1,0':4,'2,0':5,'2,1':6,'2,2':7,'1,1':9};
const ORIGIN={};Object.keys(BLOCK).forEach(k=>{const [bx,by]=k.split(',').map(Number);ORIGIN[BLOCK[k]]=[bx*B,by*B]});
const ENTRY_SIDE={1:'R',2:'B',3:'B',4:'L',5:'L',6:'T',7:'T'}; // side of block where the entry door sits
const QSEQ={R:['SE','SW','NW','NE'],B:['SW','NW','NE','SE'],L:['NW','NE','SE','SW'],T:['NE','SE','SW','NW']};
E.ORIGIN=ORIGIN;E.N=N;
const quad=(lx,ly)=>(ly<10?(lx<10?'NW':'NE'):(lx<10?'SW':'SE'));
const roomOf=(g,lx,ly)=>{const seq=QSEQ[ENTRY_SIDE[g]||'B'];const i=seq.indexOf(quad(lx,ly));return i<0?0:i};
E.roomAt=(g,wx,wy)=>{const o=ORIGIN[g];return roomOf(g,wx-o[0],wy-o[1])};

/* ---- textures ---- */
const mk=()=>{const c=document.createElement('canvas');c.width=c.height=TEX;c.getContext('2d',{willReadFrequently:true});return c};
const toU32=c=>new Uint32Array(c.getContext('2d').getImageData(0,0,TEX,TEX).data.buffer.slice(0));
function rng(seed){let s=seed;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function wallCanvas(g){
 const c=mk(),x=c.getContext('2d');const acc=hex(D.G[g].accent);const r=rng(g*77+5);
 const base=mix(acc,0.42),dark=mix(acc,0.28),light=mix(acc,0.6);
 x.fillStyle=`rgb(${base})`;x.fillRect(0,0,64,64);
 if(g===6){ // library: bookshelves
  x.fillStyle=`rgb(${dark})`;x.fillRect(0,0,64,64);
  for(let row=0;row<4;row++){const y=4+row*15;x.fillStyle='#3a2410';x.fillRect(0,y+11,64,3);let px=1;while(px<62){const w=2+(r()*3|0);x.fillStyle=`hsl(${r()*360|0},40%,${30+r()*20|0}%)`;x.fillRect(px,y+(r()*3|0),w,11);px+=w+((r()<.2)?1:0)}}
 }else if(g===0){ // marble
  x.fillStyle='#c9bb9f';x.fillRect(0,0,64,64);for(let i=0;i<60;i++){x.fillStyle=`rgba(120,100,70,${r()*.25})`;x.fillRect(r()*64|0,r()*64|0,1+(r()*8|0),1)}
  x.fillStyle='#8c7650';x.fillRect(0,0,64,3);x.fillRect(0,61,64,3);x.fillStyle='#a58d60';x.fillRect(0,44,64,2);
 }else{
  // wallpaper stripes
  for(let i=0;i<64;i+=8){x.fillStyle=`rgb(${(i/8)%2?light.map(v=>v*.82|0):base})`;x.fillRect(i,0,4,40)}
  x.fillStyle=`rgb(${dark})`;x.fillRect(0,40,64,24); // wainscot
  for(let i=0;i<64;i+=16){x.fillStyle=`rgb(${mix(acc,.22)})`;x.fillRect(i+2,44,12,16);x.fillStyle=`rgb(${mix(acc,.34)})`;x.fillRect(i+3,45,10,14)}
  x.fillStyle='#d4af37';x.fillRect(0,38,64,2);x.fillRect(0,0,64,2);x.fillStyle='#8c6d23';x.fillRect(0,40,64,1);
 }
 return c;
}
const wallTex=[],wallBase=[];
function paintFrame(x,art,seen,img){
 const col=art.frame==='gold'?'#d4af37':art.frame==='silver'?'#c3c9cf':'#2f8f58';
 x.fillStyle='#000';x.fillRect(9,13,46,38);
 x.fillStyle=col;x.fillRect(10,14,44,36);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(10,48,44,2);x.fillRect(52,14,2,36);
 x.fillStyle='#e9dcc0';x.fillRect(14,18,36,28);
 if(img){x.imageSmoothingEnabled=false;
  const t=document.createElement('canvas');t.width=18;t.height=14;const tc=t.getContext('2d');tc.imageSmoothingEnabled=true;
  const ar=img.width/img.height,w=18,h=14;let sx=0,sy=0,sw=img.width,sh=img.height;if(ar>w/h){sw=img.height*w/h;sx=(img.width-sw)/2}else{sh=img.width*h/w;sy=(img.height-sh)/2}
  tc.drawImage(img,sx,sy,sw,sh,0,0,w,h);
  // posterize to a 2x-upscaled pixel look
  const id=tc.getImageData(0,0,w,h);for(let i=0;i<id.data.length;i+=4){for(let k=0;k<3;k++)id.data[i+k]=Math.round(id.data[i+k]/48)*48}tc.putImageData(id,0,0);
  x.drawImage(t,0,0,w,h,14,18,36,28);
 }else{ // placeholder glyph
  x.fillStyle='#9b8b6a';x.fillRect(20,24,24,16);x.fillStyle='#e9dcc0';x.fillRect(22,26,20,12);x.fillStyle='#9b8b6a';for(let i=0;i<4;i++)x.fillRect(24,28+i*3,16,1);
 }
 if(seen){x.fillStyle='#2ecc71';x.fillRect(44,40,8,8);x.fillStyle='#fff';x.fillRect(46,44,1,2);x.fillRect(47,45,1,1);x.fillRect(48,43,1,2);x.fillRect(49,42,1,1)}
 // plaque
 x.fillStyle=col;x.fillRect(26,53,12,3);
}
const artTex=[]; // per artwork canvases + u32
function artTexture(i,img){
 const art=D.A[i];const b=wallBase[art.g];const c=mk();const x=c.getContext('2d');x.drawImage(b,0,0);
 paintFrame(x,art,RS.S.seen.includes(art.id),img);
 artTex[i]={c,img,u:toU32(c)};
}
function refreshArt(i){artTexture(i,artTex[i]&&artTex[i].img)}
const thumbReq={};
E.loadGallery=function(g){
 if(thumbReq[g])return;thumbReq[g]=1;
 D.A.forEach((a,i)=>{if(a.g!==g||!a.f||!a.f[0])return;
  const im=new Image();im.crossOrigin='anonymous';im.onload=()=>{artTexture(i,im)};im.src=RS.fileUrl(a.f[0],96)});
};
function signCanvas(text,g){
 const c=mk(),x=c.getContext('2d');x.drawImage(wallBase[g],0,0);
 const acc=D.G[g].accent;x.fillStyle='#1b140c';x.fillRect(6,12,52,40);x.fillStyle=acc;x.fillRect(8,14,48,36);x.fillStyle='#1b140c';x.fillRect(10,16,44,32);
 x.fillStyle='#f3e4bf';x.font='bold 9px monospace';x.textAlign='center';
 const words=text.split(' ');const lines=[];let cur='';words.forEach(w=>{if((cur+' '+w).trim().length>9){lines.push(cur);cur=w}else cur=(cur+' '+w).trim()});lines.push(cur);
 lines.slice(0,4).forEach((l,i)=>x.fillText(l.slice(0,10),32,27+i*9));
 return c;
}
function secretCanvas(g){
 const c=mk(),x=c.getContext('2d');x.drawImage(wallBase[g],0,0);
 x.fillStyle='#2a1c0d';x.fillRect(14,10,36,50);x.fillStyle='#4b331a';x.fillRect(16,12,32,46);
 x.fillStyle='#d4af37';x.fillRect(29,28,6,8);x.fillStyle='#000';x.fillRect(31,30,2,3);
 return c;
}
let wallU32=[],secretU32=[],signList=[],signU32=[];

/* ---- world ---- */
const map=new Int16Array(N*N), floorId=new Uint8Array(N*N).fill(255), cellRoom=new Int8Array(N*N).fill(-1);
E.map=map;E.floorId=floorId;
const sprites=[];E.sprites=sprites;
const npcs=[];E.npcs=npcs;
const artCells={}; // artIndex -> [x,y]
E.artCells=artCells;
const secretDoor={}; // gal -> {x,y}
E.secretDoor=secretDoor;
const doors=[];

function setWall(x,y,v){map[y*N+x]=v}
function carve(x,y){map[y*N+x]=0}
function buildWorld(){
 // block interiors & perimeters
 for(const k in BLOCK){const g=BLOCK[k];const [bx,by]=k.split(',').map(Number);const ox=bx*B,oy=by*B;
  for(let y=0;y<B;y++)for(let x=0;x<B;x++){const wx=ox+x,wy=oy+y;floorId[wy*N+wx]=g;
   const edge=x===0||y===0||x===B-1||y===B-1;if(g!==9&&edge)setWall(wx,wy,g+1);}
 }
 // doors between ring-adjacent blocks (2 wide through double wall)
 const ringPairs=[[[1,2],[0,2]],[[0,2],[0,1]],[[0,1],[0,0]],[[0,0],[1,0]],[[1,0],[2,0]],[[2,0],[2,1]],[[2,1],[2,2]],[[2,2],[1,2]]];
 ringPairs.forEach(([a,b])=>{
  if(a[0]!==b[0]){ // horizontal neighbours: vertical wall
   const xl=Math.min(a[0],b[0])*B+B-1;const oy=a[1]*B;for(const dy of [9,10]){carve(xl,oy+dy);carve(xl+1,oy+dy)}
  }else{const yt=Math.min(a[1],b[1])*B+B-1;const ox=a[0]*B;for(const dx of [9,10]){carve(ox+dx,yt);carve(ox+dx,yt+1)}}
 });
 // edge blocks to courtyard (single wall)
 [[29,40],[30,40],[29,19],[30,19]].forEach(([x,y])=>carve(x,y));
 [[19,29],[19,30],[40,29],[40,30]].forEach(([x,y])=>carve(x,y));
 // pillars (decor) in gallery blocks
 for(let g=0;g<=7;g++){const [ox,oy]=ORIGIN[g];[[6,13],[13,6],[13,13]].forEach(([px,py])=>{if(g===6||g===7||true){setWall(ox+px,oy+py,g+1)}})}
 // hidden rooms (local x2..7, y2..6) in galleries 1..7 (not 0)
 for(let g=1;g<=7;g++){const [ox,oy]=ORIGIN[g];
  for(let y=2;y<=6;y++)for(let x=2;x<=7;x++){const edge=x===2||x===7||y===2||y===6;if(edge)setWall(ox+x,oy+y,g+1);else{carve(ox+x,oy+y);floorId[(oy+y)*N+ox+x]=g}}
  setWall(ox+7,oy+4,90);secretDoor[g]={x:ox+7,y:oy+4,g};
 }
 placeArt();
 placeSigns();
}
function perimCandidates(g){
 const [ox,oy]=ORIGIN[g];const out=[];
 const courtSide=({4:'B',2:'R',6:'L',0:'T'})[g]; // wall facing courtyard
 const isDoor=(x,y)=>{ // near any carved gap on perimeter
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=N||yy>=N)continue;const v=map[yy*N+xx];if(v===0&&floorId[yy*N+xx]!==255){const gi=floorId[yy*N+xx];const ex=xx>=ox&&xx<ox+B&&yy>=oy&&yy<oy+B;if(!ex)continue;const lx=xx-ox,ly=yy-oy;if(lx===0||ly===0||lx===B-1||ly===B-1)return true;}}return false};
 const push=(lx,ly,side)=>{if(side===courtSide)return;const x=ox+lx,y=oy+ly;if(isDoor(x,y))return;out.push({x,y,lx,ly,side})};
 for(let lx=2;lx<=B-3;lx++)push(lx,0,'T');
 for(let ly=2;ly<=B-3;ly++)push(B-1,ly,'R');
 for(let lx=B-3;lx>=2;lx--)push(lx,B-1,'B');
 for(let ly=B-3;ly>=2;ly--)push(0,ly,'L');
 return out;
}
function placeArt(){
 for(let g=1;g<=5;g++){
  const cands=perimCandidates(g);const arts=D.A.map((a,i)=>[a,i]).filter(p=>p[0].g===g);
  const [ox,oy]=ORIGIN[g];
  const byRoom=[[],[],[],[]];cands.forEach(c=>{byRoom[roomOf(g,c.lx,c.ly)].push(c)});
  const aRoom=[[],[],[],[]];arts.forEach(p=>aRoom[p[0].room].push(p));
  for(let r=0;r<4;r++){const L=byRoom[r],k=aRoom[r].length;if(!k)continue;
   // order candidates clockwise already; pick evenly spaced
   const used=new Set();
   aRoom[r].forEach((p,i)=>{let idx=Math.min(L.length-1,Math.floor((i+0.5)*L.length/k));while(used.has(idx)&&idx<L.length-1)idx++;while(used.has(idx)&&idx>0)idx--;used.add(idx);const c=L[idx];if(!c)return;
    setWall(c.x,c.y,100+p[1]);artCells[p[1]]=[c.x,c.y]});
  }
 }
}
function placeSigns(){
 // gallery name sign on interior side next to entry door; plus frame legend in entrance hall
 const add=(x,y,text,g,opts)=>{signList.push({x,y,text,g,opts:opts||{}});setWall(x,y,200+signList.length-1)};
 const legend=[['Gold frame = primary source','gold'],['Silver frame = secondary source','silver'],['Green plaque = evidence panel','green']];
 const [ox,oy]=ORIGIN[0];
 legend.forEach((l,i)=>add(ox+4+i*2,oy+B-1,l[0],0,{legend:l[1]}));
 add(ox+B-1,oy+4,'Press T to teleport',0,{tele:1});
 add(ox+12,oy+B-1,'Welcome to The Roaring Society',0,{});
 const ent={1:[19,12],2:[3,19],3:[3,19],4:[0,3],5:[0,3],6:[3,0],7:[3,0]};
 for(let g=1;g<=7;g++){const [ox,oy]=ORIGIN[g];const e=ent[g];add(ox+e[0]===ox?ox:ox+e[0],oy+e[1],D.G[g].t,g,{gal:g});}
}
E.signs=signList;

/* ---- sprite art ---- */
function spriteCanvas(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=false;fn(x,w,h);return c}
const u32=c=>new Uint32Array(c.getContext('2d').getImageData(0,0,c.width,c.height).data.buffer.slice(0));
function emojiSprite(emoji,base){return spriteCanvas(32,40,(x,w,h)=>{
 if(base){x.fillStyle='#2a1c0d';x.fillRect(6,26,20,14);x.fillStyle=base;x.fillRect(7,27,18,3);x.fillStyle='#3d2a14';x.fillRect(8,30,16,10)}
 x.font='20px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(emoji,16,base?14:22);
 // crush to pixel look
 const id=x.getImageData(0,0,w,h);for(let i=0;i<id.data.length;i+=4){id.data[i+3]=id.data[i+3]>110?255:0}x.putImageData(id,0,0);})}
const PALS=[['#7a4a2b','#c98f6b','#3b3b4f'],['#2e2e2e','#e0b48a','#6b3b3b'],['#4a3a2a','#8d5d3b','#2f4a3a'],['#1f2f4a','#f0c9a0','#7a6a2a'],['#5a2a3a','#a56a45','#2a2a2a'],['#3a3a3a','#f2d2b0','#9b4a3a']];
function personSprite(pal,frame,hat){const [coat,skin,pants]=pal;return spriteCanvas(24,40,(x)=>{
 const s=frame?1:0;
 x.fillStyle=pants;x.fillRect(8,28,3,10-s);x.fillRect(13,28,3,10-(1-s)); // legs
 x.fillStyle='#111';x.fillRect(7,37-s,4,2);x.fillRect(13,37-(1-s),4,2);
 x.fillStyle=coat;x.fillRect(6,14,12,15);x.fillRect(4,15,3,11);x.fillRect(17,15,3,11);
 x.fillStyle=skin;x.fillRect(9,5,6,8);x.fillRect(4,25,3,3);x.fillRect(17,25,3,3);
 x.fillStyle=hat||'#222';x.fillRect(8,3,8,3);if(hat)x.fillRect(6,5,12,1);
 x.fillStyle='#000';x.fillRect(10,8,1,1);x.fillRect(13,8,1,1);
});}
function sprite(o){const s=Object.assign({x:0,y:0,scale:1,vOff:0,solid:false,r:0.3,visible:true,w:32,h:40},o);
 if(o.canvas){s.w=o.canvas.width;s.h=o.canvas.height;s.u=u32(o.canvas)}
 sprites.push(s);return s;}
E.addSprite=sprite;

/* ---- world content (stations, items, npcs) ---- */
const wp=(g,lx,ly)=>[ORIGIN[g][0]+lx+0.5,ORIGIN[g][1]+ly+0.5];
const STATIONS=[
 // [id,g,lx,ly,emoji,label,solid]
 ['directory',0,10,8,'📍','Visitor Directory',1],
 ['passport',0,5,13,'🛂','Museum store & Visitor Passport',1],
 ['tp0',0,15,13,'✨','Teleport pedestal',1],
 ['migration',1,10,10,'🗺️','Migration Map table',1],
 ['tp1',1,15,16,'✨','Teleport pedestal',1],
 ['hearing',2,10,10,'📂','Review desk: Civil-Liberties Hearing',1],
 ['tp2',2,16,15,'✨','Teleport pedestal',1],
 ['source3',3,8,11,'📰','Source Analysis stations',1],
 ['quota',3,12,16,'📊','Quota Calculator',1],
 ['board',3,15,10,'📌','Attitudes & Policy Board',1],
 ['tp3',3,16,15,'✨','Teleport pedestal',1],
 ['courtroom',4,10,10,'⚖️','Take the bench: Supreme Court Simulation',1],
 ['tp4',4,16,16,'✨','Teleport pedestal',1],
 ['policy',5,10,10,'🏛️','Policy Council table',1],
 ['tp5',5,16,16,'✨','Teleport pedestal',1],
 ['bib',6,15,4,'📚','Bibliography Wall',1],
 ['radio',6,15,14,'📻','Radio',1],
 ['terminal',6,5,14,'💻','Evidence Journal terminal',1],
 ['microfilm',6,10,16,'🎞️','Microfilm reader',1],
 ['eval',6,10,10,'🔍','Source Evaluation Desk',1],
 ['tp6',6,16,9,'✨','Teleport pedestal',1],
 ['pedestals',7,10,10,'🏛️','Hall of Evidence pedestals',1],
 ['atrium',7,15,5,'📝','Guiding Questions argument table',1],
 ['curator',7,15,15,'🎖️','Curator’s Office desk',1],
 ['tp7',7,5,15,'✨','Teleport pedestal',1],
 // courtyard coordinates are in world space via g=9
 ['fountain',9,10,10,'⛲','Fountain',1],
 ['cafe',9,5,5,'☕','Cafe table',1],
 ['paper',9,6,4,'📰','Morning newspaper',0],
 ['newsstand',9,14,5,'🗞️','Newsstand',1],
 ['bandstand',9,14,14,'🎺','Bandstand',1],
 ['telescope',9,4,15,'🔭','Telescope',1],
 ['nickelodeon',9,10,4,'🎬','Nickelodeon',1],
 ['bench1',9,6,10,'🪑','Bench',1],
 ['bench2',9,14,10,'🪑','Bench',1]
];
E.STATIONS=STATIONS;
const stationSprites={};E.stationSprites=stationSprites;
function placeStations(){
 STATIONS.forEach(s=>{const [id,g,lx,ly,em,label,solid]=s;const [x,y]=wp(g,lx,ly);
  const sp=sprite({id,kind:'station',x,y,label,solid:!!solid,r:0.45,canvas:emojiSprite(em,id==='paper'?null:'#d4af37'),scale:id==='paper'?0.25:0.62});
  if(id==='paper'){sp.vOff=0.42}
  stationSprites[id]=sp;});
}
/* collectibles inside secret rooms */
const ITEM_ICON={weevil:'🪲',ledger:'📒',ticket:'🎫',timecard:'⏱️',directory:'📑',dossier:'📁',handbill:'📃',warrant:'📜',aclucard:'🪪',scopes:'📘',trunklabel:'🏷️',quotacard:'📇',unioncard:'💳',leaflet:'📄',strikeposter:'🚩',manifesto:'📰',typeblock:'🔤',sketch:'✏️',brief:'📑',plate:'🗜️',password:'🔑',flask:'🍵',payoff:'📒',label:'🏷️',repeal:'🔖',stack1:'🗂️',stack2:'📼',stack3:'🪪'};
E.ITEM_ICON=ITEM_ICON;
const itemSprites={};E.itemSprites=itemSprites;
function placeItems(){
 for(let g=1;g<=6;g++){const list=D.ITEMS[g];list.forEach((it,i)=>{const [x,y]=wp(g,3+(i%4),(i<4?3:5));
   const pos=[[3.5,3.5],[4.5,3.5],[5.5,3.5],[6.5,3.5],[4.5,5.5]][i]||[4.5,4.5];
   const sp=sprite({id:'item:'+it[0],kind:'item',gal:g,key:it[0],x:ORIGIN[g][0]+pos[0],y:ORIGIN[g][1]+pos[1],label:it[1]+' (replica)',scale:0.32,vOff:0.22,r:0.2,canvas:emojiSprite(ITEM_ICON[it[0]]||'📦'),visible:!!RS.S.secretOpen[g]&&!RS.S.items.includes(it[0])});
   itemSprites[it[0]]=sp})}
 const rp=sprite({id:'raid',kind:'station',x:ORIGIN[5][0]+3.5,y:ORIGIN[5][1]+5.5,label:'Back office: Raid! mini-game',scale:0.5,r:.25,canvas:emojiSprite('\ud83d\udea8','#d4af37'),visible:!!RS.S.secretOpen[5]});stationSprites.raid=rp;
 // vault (synthesis) credits plaque
 const sp=sprite({id:'vaultcredits',kind:'station',x:ORIGIN[7][0]+4.5,y:ORIGIN[7][1]+4.5,label:'Credits & behind-the-scenes notes',scale:0.4,r:.3,canvas:emojiSprite('📜','#d4af37'),visible:!!RS.S.secretOpen[7]});
 stationSprites.vaultcredits=sp;
}
/* docents and visitors */
const DOCENT_POS={0:[16,15],1:[16,11],2:[12,16],3:[12,16],4:[4,12],5:[4,12],6:[12,3],7:[12,3]};
function placeNpcs(){
 for(let g=0;g<=7;g++){const [x,y]=wp(g,...DOCENT_POS[g]);
  sprite({id:'docent'+g,kind:'docent',gal:g,x,y,label:g===0?'Ticket-desk attendant':'Docent',scale:0.64,solid:true,r:.3,canvas:personSprite(PALS[g%PALS.length],0,'#b08d57'),talk:0});}
 // staff
 const bt=wp(5,14,6);sprite({id:'bartender',kind:'npc-talk',gal:5,x:bt[0],y:bt[1],label:'Cigar-shop clerk',scale:0.64,solid:true,r:.3,canvas:personSprite(PALS[4],1,'#222')});
 // wandering visitors
 const rnd=rng(42);
 function visitor(g,n){for(let i=0;i<n;i++){const pal=PALS[(rnd()*PALS.length)|0];const frames=[personSprite(pal,0,rnd()<.5?'#222':null),personSprite(pal,1,rnd()<.5?'#222':null)];
   let [x,y]=wp(g,6+(rnd()*8|0),9+(rnd()*6|0));
   for(let k=0;k<60&&map[(y|0)*N+(x|0)]!==0;k++)[x,y]=wp(g,2+(rnd()*16|0),2+(rnd()*16|0));
   const s=sprite({id:'visitor'+npcs.length,kind:'visitor',gal:g,x,y,label:'Visitor',scale:0.62,canvas:frames[0],frames:frames.map(f=>u32(f)),speed:.6+rnd()*.4,state:'wait',t:rnd()*3,tx:x,ty:y,solid:false});
   npcs.push(s)}}
 for(let g=0;g<=7;g++)visitor(g,g===0||g===6?1:2);
 visitor(9,6);
}
E.build=function(){
 for(let g=0;g<=7;g++){const c=wallCanvas(g);wallBase[g]=c;wallTex[g+1]=toU32(c)}
 buildWorld();
 D.A.forEach((a,i)=>artTexture(i,null));
 secretU32=[];for(let g=1;g<=7;g++)secretU32[g]=toU32(secretCanvas(g-1<0?0:g));
 signU32=signList.map(s=>toU32(signCanvas(s.text,s.g)));
 placeStations();placeItems();placeNpcs();
 // restore opened secrets
 Object.keys(RS.S.secretOpen).forEach(g=>{if(RS.S.secretOpen[g])E.openSecret(+g,true)});
};
E.openSecret=function(g,silent){const d=secretDoor[g];if(!d)return;map[d.y*N+d.x]=0;RS.S.secretOpen[g]=true;
 D.ITEMS[g]&&D.ITEMS[g].forEach(it=>{const s=itemSprites[it[0]];if(s&&!RS.S.items.includes(it[0]))s.visible=true});
 if(g===7&&stationSprites.vaultcredits)stationSprites.vaultcredits.visible=true;
 if(g===5&&stationSprites.raid)stationSprites.raid.visible=true;
 if(!silent){RS.S.secret[g]=true;RS.save();RS.emit('secret',g)}};
E.hideItem=key=>{const s=itemSprites[key];if(s)s.visible=false};
E.refreshSeen=()=>{D.A.forEach((a,i)=>{if(artTex[i])refreshArt(i)})};

/* ---- player ---- */
const P=E.player={x:30.5,y:56.5,a:-Math.PI/2,speed:2.6};
const keys={};E.keys=keys;
let W=480,H=270,canvas,ctx,img,buf32,zbuf;
E.paused=true;E.target=null;
const FOV=0.66,WH=1.55;
function cellAt(x,y){x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=N||y>=N)return 1;return map[y*N+x]}
function blocked(x,y,r){
 const rr=r||0.22;
 if(cellAt(x-rr,y-rr)||cellAt(x+rr,y-rr)||cellAt(x-rr,y+rr)||cellAt(x+rr,y+rr))return true;
 for(const s of sprites){if(!s.solid||!s.visible)continue;const dx=x-s.x,dy=y-s.y;const rad=(s.r||.3)+rr;if(dx*dx+dy*dy<rad*rad)return true}
 return false;
}
E.blocked=blocked;
E.teleport=function(x,y,a){P.x=x;P.y=y;if(a!==undefined)P.a=a;};
E.blockAt=(wx,wy)=>{for(const k in BLOCK){const [bx,by]=k.split(',').map(Number);if(wx>=bx*B&&wx<bx*B+B&&wy>=by*B&&wy<by*B+B)return BLOCK[k]}return 9};

const shadeTab=new Uint8Array(256);
function shade(c,k){ // k 0..256 scale
 const r=((c&255)*k)>>8,g=(((c>>8)&255)*k)>>8,b=(((c>>16)&255)*k)>>8;return 0xff000000|(b<<16)|(g<<8)|r;
}
// floor palettes per floorId
const FL=[];
function floorPalette(){
 for(let g=0;g<=7;g++){const acc=hex(D.G[g].accent);FL[g]={a:pack(...mix(acc,g===0?.9:.55)),b:pack(...mix(acc,g===0?.7:.42)),c:pack(...mix(acc,.18))};}
 FL[0]={a:pack(190,175,140),b:pack(150,135,105),c:pack(60,50,40)};
 FL[9]={a:pack(96,140,70),b:pack(80,120,60),c:pack(200,180,140),p:pack(160,95,70),q:pack(130,75,55)};
}
function skyColor(y){const t=y/(H/2);return pack(Math.round(120+60*t),Math.round(170+40*t),Math.round(230+20*t))}

E.init=function(cv){
 canvas=cv;E.canvas=cv;
 E.resize();
 floorPalette();
 E.build();
 const st=RS.S.pos;if(st){P.x=st.x;P.y=st.y;P.a=st.a}
 // input
 window.addEventListener('keydown',e=>{if(RS.isModal()||E.paused)return;const k=e.key.toLowerCase();keys[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault()});
 window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
 window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
 document.addEventListener('mousemove',e=>{if(document.pointerLockElement===cv&&!E.paused&&!RS.isModal()){P.a+=e.movementX*0.0022*RS.S.settings.sens;}});
 cv.addEventListener('click',()=>{if(E.paused||RS.isModal())return;if(document.pointerLockElement!==cv&&!E.touch){try{cv.requestPointerLock()}catch(e){}}else if(E.target)E.interact()});
};
E.resize=function(){
 const q=RS.S.settings.quality||1;W=q===0?320:480;H=q===0?180:270;
 canvas.width=W;canvas.height=H;ctx=canvas.getContext('2d',{alpha:false});img=ctx.createImageData(W,H);buf32=new Uint32Array(img.data.buffer);zbuf=new Float32Array(W);
};
E.interact=function(){if(E.target&&E.onInteract)E.onInteract(E.target)};

function update(dt){
 let mv=0,st=0,rot=0;
 if(keys['w']||keys['arrowup'])mv+=1;if(keys['s']||keys['arrowdown'])mv-=1;
 if(keys['a'])st-=1;if(keys['d'])st+=1;
 if(keys['arrowleft'])rot-=1;if(keys['arrowright'])rot+=1;
 if(E.joy){mv+=-E.joy.y;st+=E.joy.x}
 if(E.lookDelta){P.a+=E.lookDelta;E.lookDelta=0}
 P.a+=rot*2.2*dt*RS.S.settings.sens;
 const sp=P.speed*(keys['shift']?1.7:1)*dt;
 const dx=Math.cos(P.a),dy=Math.sin(P.a);
 let vx=(dx*mv-dy*st),vy=(dy*mv+dx*st);const l=Math.hypot(vx,vy);if(l>1){vx/=l;vy/=l}
 const nx=P.x+vx*sp,ny=P.y+vy*sp;
 if(!blocked(nx,P.y))P.x=nx;if(!blocked(P.x,ny))P.y=ny;
 E.moving=l>.05;
 // npcs
 npcs.forEach(n=>updateNpc(n,dt));
 // zone
 const gx=Math.floor(P.x),gy=Math.floor(P.y);
 const g=E.blockAt(gx,gy);
 if(g!==E.zoneG||(g!==9&&g!==0&&E.zoneRoom!==roomOf(g,gx-ORIGIN[g][0],gy-ORIGIN[g][1]))){
  E.zoneG=g;E.zoneRoom=(g===9||g===0)?0:roomOf(g,gx-ORIGIN[g][0],gy-ORIGIN[g][1]);
  RS.emit('zone',{g,room:E.zoneRoom});
 }
 // target
 pickTarget();
}
function updateNpc(n,dt){
 n.t-=dt;
 if(n.state==='wait'){if(n.t<=0){
   const g=n.gal;const a=Math.random();let tx,ty;
   if(g!==9&&a<.6){const cells=Object.keys(artCells).filter(i=>D.A[i].g===g);if(cells.length){const c=artCells[cells[(Math.random()*cells.length)|0]];const o=ORIGIN[g];tx=c[0]+.5;ty=c[1]+.5;const lx=c[0]-o[0],ly=c[1]-o[1];if(ly===0)ty+=1.2;else if(ly===B-1)ty-=1.2;else if(lx===0)tx+=1.2;else tx-=1.2;n.admire=true}}
   if(tx===undefined){const o=ORIGIN[g];tx=o[0]+3+Math.random()*(B-6);ty=o[1]+3+Math.random()*(B-6);n.admire=false}
   n.tx=tx;n.ty=ty;n.state='walk';n.t=14}}
 else if(n.state==='walk'){
  const dx=n.tx-n.x,dy=n.ty-n.y,d=Math.hypot(dx,dy);
  if(d<.2||n.t<=0){n.state='look';n.t=n.admire?6+Math.random()*9:2+Math.random()*3;n.remark=Math.random()<.4}
  else{const sx=n.x+dx/d*n.speed*dt,sy=n.y+dy/d*n.speed*dt;
   const pd=Math.hypot(P.x-sx,P.y-sy);
   if(pd<.6){n.t-=dt*2;return}
   if(!cellAt(sx,n.y)&&!blockedSolid(sx,n.y))n.x=sx;else{n.state='wait';n.t=.3}
   if(!cellAt(n.x,sy)&&!blockedSolid(n.x,sy))n.y=sy;else{n.state='wait';n.t=.3}
   n.walk=(n.walk||0)+dt*6;n.u=n.frames[(n.walk|0)%2];}
 }
 else if(n.state==='look'){n.u=n.frames[0];if(n.t<=0){n.state='wait';n.t=.2+Math.random()*2}}
}
function blockedSolid(x,y){for(const s of sprites){if(!s.solid)continue;const dx=x-s.x,dy=y-s.y;if(dx*dx+dy*dy<(s.r+.15)*(s.r+.15))return true}return false}

function castRay(rx,ry,dx,dy,maxd){ // returns {dist,cell,side,cx,cy} DDA
 let mx=Math.floor(rx),my=Math.floor(ry);
 const ddx=Math.abs(1/(dx||1e-9)),ddy=Math.abs(1/(dy||1e-9));
 let sx,sy,sdx,sdy;
 if(dx<0){sx=-1;sdx=(rx-mx)*ddx}else{sx=1;sdx=(mx+1-rx)*ddx}
 if(dy<0){sy=-1;sdy=(ry-my)*ddy}else{sy=1;sdy=(my+1-ry)*ddy}
 let side=0,hit=0,d=0;
 for(let i=0;i<64;i++){
  if(sdx<sdy){sdx+=ddx;mx+=sx;side=0}else{sdy+=ddy;my+=sy;side=1}
  if(mx<0||my<0||mx>=N||my>=N){hit=1;break}
  hit=map[my*N+mx];if(hit)break;
 }
 d=side===0?(sdx-ddx):(sdy-ddy);
 return {dist:d,cell:hit,side,mx,my};
}
function pickTarget(){
 const dx=Math.cos(P.a),dy=Math.sin(P.a);
 let best=null,bd=2.6;
 const r=castRay(P.x,P.y,dx,dy,8);
 if(r.cell>=90&&r.dist<2.4){best={type:'wall',cell:r.cell,x:r.mx,y:r.my,dist:r.dist};bd=r.dist}
 for(const s of sprites){if(!s.visible||!s.kind||s.kind==='visitor')continue;
  const ex=s.x-P.x,ey=s.y-P.y,d=Math.hypot(ex,ey);if(d>2.6||d>=bd)continue;
  const ang=Math.atan2(ey,ex)-P.a;const da=Math.atan2(Math.sin(ang),Math.cos(ang));
  const tol=Math.atan2(.45,d);
  if(Math.abs(da)<Math.max(tol,.12)&&d<r.dist){best={type:'sprite',s,dist:d};bd=d}}
 E.target=best;
}

/* ---- rendering ---- */
function render(){
 const dirX=Math.cos(P.a),dirY=Math.sin(P.a),plX=-dirY*FOV,plY=dirX*FOV;
 const bob=(RS.S.settings.bob&&!RS.S.settings.reducedMotion&&E.moving)?Math.sin(performance.now()/110)*2:0;
 const horizon=(H>>1)+bob|0;
 // floor / ceiling
 const rx0=dirX-plX,ry0=dirY-plY,rx1=dirX+plX,ry1=dirY+plY;
 for(let y=0;y<H;y++){
  const p=y-horizon;const isFloor=p>0;const ap=isFloor?p:-p;if(ap===0){continue}
  const rowDist=0.5*WH*H/ap;
  const stX=rowDist*(rx1-rx0)/W,stY=rowDist*(ry1-ry0)/W;
  let fx=P.x+rowDist*rx0,fy=P.y+rowDist*ry0;
  const k=Math.max(40,Math.min(256,(256*(1-rowDist/14))|0));
  const row=y*W;
  for(let x=0;x<W;x++){
   const cx=fx|0,cy=fy|0;const inb=cx>=0&&cy>=0&&cx<N&&cy<N;const fid=inb?floorId[cy*N+cx]:255;
   let c;
   if(isFloor){
    if(fid===9){const lx=fx-cx,ly=fy-cy;const onPath=Math.abs(fx-30)<2.2||Math.abs(fy-30)<2.2;
     if(onPath){c=(((lx*4)|0)+((ly*8)|0))&1?FL[9].p:FL[9].q}else c=((cx+cy)&1)?FL[9].a:FL[9].b;}
    else if(fid===255){c=0xff111111}
    else{const lx=fx-cx,ly=fy-cy;const f=FL[fid];c=((cx+cy)&1)?f.a:f.b;if(lx<.025||ly<.025)c=f.c;}
   }else{
    if(fid===9||fid===255){c=skyColor(y)}else{const lx=fx-cx,ly=fy-cy;c=((cx+cy)&1)?pack(96,78,58):pack(90,72,53);}
   }
   buf32[row+x]=(fid===9&&!isFloor)?c:shade(c,k);
   fx+=stX;fy+=stY;
  }
 }
 // walls
 for(let x=0;x<W;x++){
  const camX=2*x/W-1;const rdx=dirX+plX*camX,rdy=dirY+plY*camX;
  const r=castRay(P.x,P.y,rdx,rdy,64);
  const perp=Math.max(0.05,r.dist);zbuf[x]=perp;
  const lineH=(H*WH/perp)|0;let y0=horizon-(lineH>>1),y1=horizon+(lineH>>1);
  let wx=r.side===0?P.y+r.dist*rdy:P.x+r.dist*rdx;wx-=Math.floor(wx);
  let tx=(wx*TEX)|0;if((r.side===0&&rdx>0)||(r.side===1&&rdy<0))tx=TEX-1-tx;
  const cell=r.cell;let tex;
  if(cell>=200)tex=signU32[cell-200]||wallTex[1];
  else if(cell>=100)tex=(artTex[cell-100]||{}).u||wallTex[1];
  else if(cell===90){const g=E.blockAt(r.mx,r.my);tex=secretU32[g]||wallTex[1]}
  else tex=wallTex[cell]||wallTex[1];
  const k=Math.max(50,Math.min(256,(256*(1-perp/15))|0))*(r.side?0.82:1)|0;
  const ys=Math.max(0,y0),ye=Math.min(H-1,y1);const step=TEX/lineH;let tp=(ys-y0)*step;
  for(let y=ys;y<=ye;y++){const ty=tp|0;tp+=step;buf32[y*W+x]=shade(tex[(ty&63)*TEX+tx],k)}
 }
 // sprites
 const list=[];
 for(const s of sprites){if(!s.visible)continue;const ex=s.x-P.x,ey=s.y-P.y;const d2=ex*ex+ey*ey;if(d2>400)continue;list.push([d2,s])}
 list.sort((a,b)=>b[0]-a[0]);
 const inv=1/(plX*dirY-dirX*plY);
 for(const [d2,s] of list){
  const ex=s.x-P.x,ey=s.y-P.y;
  const tX=inv*(dirY*ex-dirX*ey),tY=inv*(-plY*ex+plX*ey);
  if(tY<=0.15)continue;
  const sxm=((W/2)*(1+tX/tY))|0;
  const sh=Math.abs((H/tY)|0)*s.scale*(s.h/40);const sw=sh*(s.w/s.h);
  const vm=(s.vOff*H/tY)|0;
  const ysTop=horizon-(sh>>1)+((1-s.scale)*(H/tY)*0.5|0)-vm+((s.scale<1&&!s.vOff)?0:0);
  const ys0=(horizon+((WH*0.5*H/tY)|0)-sh|0)-vm;  // feet on floor
  const xs0=(sxm-sw/2)|0,xs1=(sxm+sw/2)|0;
  const k=Math.max(60,Math.min(256,(256*(1-tY/15))|0));
  const u=s.u&&s.kind==='visitor'&&s.frames?(s.u2||s.frames[0]):s.u;
  const tex=s.kind==='visitor'&&s.u?s.u:s.u;
  for(let x=Math.max(0,xs0);x<Math.min(W,xs1);x++){
   if(tY>=zbuf[x])continue;
   const txs=(((x-xs0)*s.w)/(xs1-xs0))|0;
   for(let y=Math.max(0,ys0);y<Math.min(H,ys0+sh|0);y++){
    const tys=(((y-ys0)*s.h)/sh)|0;const c=(s.u)[tys*s.w+txs];
    if((c>>>24)>0)buf32[y*W+x]=shade(c,k);
   }
  }
 }
 ctx.putImageData(img,0,0);
}
let last=0,running=false;
function loop(t){
 if(!running)return;
 const dt=Math.min(0.05,(t-last)/1000);last=t;
 if(!E.paused){update(dt)}
 render();
 requestAnimationFrame(loop);
}
E.start=function(){if(running)return;running=true;last=performance.now();requestAnimationFrame(loop)};
E.stop=function(){running=false};
E.savePos=()=>{RS.S.pos={x:P.x,y:P.y,a:P.a};RS.save()};
RS.on('artwork.viewed',()=>{if(E.canvas)E.refreshSeen()});
})();
