/* Engine, part 1: scene construction (Three.js). Pixel art lives in the textures, the screen is rendered at full resolution. */
(function(){
'use strict';
const RS=window.RS,D=RS.D,W=window.World,A=window.Atlas,Pr=window.Props;
const E=window.Engine={};const S=E._={};
const N=W.N;
E.N=N;E.ORIGIN=W.ORIGIN;E.map=W.map;E.floorId=W.floorId;E.blockAt=W.blockAt;E.roomAt=W.roomAt;E.signs=W.signs;E.secretDoor=W.secretDoor;
const sprites=E.sprites=[],npcs=E.npcs=[];E.artCells={};E.stationSprites={};E.itemSprites={};
const ITEM_ICON=E.ITEM_ICON={weevil:'🪲',ledger:'📒',ticket:'🎫',timecard:'⏱️',directory:'📑',dossier:'📁',handbill:'📃',warrant:'📜',aclucard:'🪪',scopes:'📘',trunklabel:'🏷️',quotacard:'📇',unioncard:'💳',leaflet:'📄',strikeposter:'🚩',manifesto:'📰',typeblock:'🔤',sketch:'✏️',brief:'📑',plate:'🗜️',password:'🔑',flask:'🍵',payoff:'📒',label:'🏷️',repeal:'🔖',stack1:'🗂️',stack2:'📼',stack3:'🪪'};
const STATION_ICON={directory:'📍',passport:'🛂',migration:'🗺️',hearing:'📂',source3:'📰',quota:'📊',board:'📌',courtroom:'⚖️',policy:'🏛️',bib:'📚',radio:'📻',terminal:'💻',microfilm:'🎞️',eval:'🔍',pedestals:'🏛️',atrium:'📝',curator:'🎖️',fountain:'⛲',cafe:'☕',paper:'📰',newsstand:'🗞️',bandstand:'🎺',telescope:'🔭',nickelodeon:'🎬',raid:'🚨',vaultcredits:'📜'};

/* ---------- small canvas helpers ---------- */
function nearest(t){t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t}
const emojiCache={};
function emojiTex(e){if(emojiCache[e])return emojiCache[e];
 const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=false;
 x.font='22px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(e,16,17);
 const id=x.getImageData(0,0,32,32);for(let i=0;i<id.data.length;i+=4)id.data[i+3]=id.data[i+3]>110?255:0;x.putImageData(id,0,0);
 return emojiCache[e]=nearest(new THREE.CanvasTexture(c))}
function icon(e,size){const m=new THREE.SpriteMaterial({map:emojiTex(e),transparent:true,alphaTest:.3,depthWrite:true});const s=new THREE.Sprite(m);s.scale.set(size||.55,size||.55,1);return s}

/* ---------- artwork paintings ---------- */
const AW=64,AH=47;
const art=S.art=[];
function paintArt(i){
 const a=D.A[i],o=art[i];const x=o.ctx;
 x.imageSmoothingEnabled=true;x.fillStyle='#e9dcc0';x.fillRect(0,0,AW,AH);
 if(o.img){const im=o.img,ar=im.width/im.height,w=AW,h=AH;let sx=0,sy=0,sw=im.width,sh=im.height;if(ar>w/h){sw=im.height*w/h;sx=(im.width-sw)/2}else{sh=im.width*h/w;sy=(im.height-sh)/2}x.drawImage(im,sx,sy,sw,sh,0,0,w,h)}
 else{x.fillStyle='#cdbb94';x.fillRect(0,0,AW,AH);x.fillStyle='#9b8b6a';x.fillRect(22,12,20,16);x.fillStyle='#e9dcc0';x.fillRect(24,14,16,12);x.fillStyle='#9b8b6a';for(let k=0;k<4;k++)x.fillRect(26,16+k*3,12,1);
  x.fillStyle='#6b5a3a';x.font='bold 7px monospace';x.textAlign='center';x.fillText((a.type||'').toUpperCase().slice(0,12),32,40)}
 if(RS.S.seen.includes(a.id)){x.fillStyle='#2ecc71';x.fillRect(AW-11,AH-11,10,10);x.fillStyle='#fff';x.fillRect(AW-8,AH-6,1,2);x.fillRect(AW-7,AH-5,1,2);x.fillRect(AW-6,AH-7,1,3);x.fillRect(AW-5,AH-8,1,2)}
 o.tex.needsUpdate=true;
}
const thumbReq={};
E.loadGallery=function(g){
 if(thumbReq[g])return;thumbReq[g]=1;
 D.A.forEach((a,i)=>{if(a.g!==g||!a.f||!a.f[0]||!art[i])return;
  const im=new Image();im.crossOrigin='anonymous';im.onload=()=>{art[i].img=im;paintArt(i)};im.src=RS.fileUrl(a.f[0],220)});
};
E.refreshSeen=()=>{art.forEach((o,i)=>{if(o)paintArt(i)})};

/* ---------- sign textures ---------- */
function signTex(text,g,opts){
 const c=document.createElement('canvas');c.width=64;c.height=40;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
 const acc=D.G[g].accent;x.fillStyle='#1b140c';x.fillRect(0,0,64,40);x.fillStyle=acc;x.fillRect(2,2,60,36);x.fillStyle='#1b140c';x.fillRect(4,4,56,32);
 x.fillStyle='#f3e4bf';x.font='bold 7px monospace';x.textAlign='center';
 const words=text.split(' ');const lines=[];let cur='';words.forEach(w=>{if((cur+' '+w).trim().length>11){lines.push(cur);cur=w}else cur=(cur+' '+w).trim()});lines.push(cur);
 const n=Math.min(lines.length,3);const by=(opts&&opts.legend)?15:21;lines.slice(0,3).forEach((l,i)=>x.fillText(l.slice(0,12),32,by-(n-1)*4+i*9));
 if(opts&&opts.legend){x.fillStyle={gold:'#d4af37',silver:'#c3c9cf',green:'#2f8f58'}[opts.legend];x.fillRect(24,32,16,3)}
 return nearest(new THREE.CanvasTexture(c));
}

/* ---------- build ---------- */
E.build=function(){
 const scene=S.scene,mat=S.mat;
 W.layout();Pr.place();W.mesh();
 // chunk meshes
 const CH=W._chunks();
 Object.keys(CH).forEach(k=>{const ch=CH[k];if(!ch.n)return;const m=new THREE.Mesh(W.buildGeometry(ch),mat);m.matrixAutoUpdate=false;scene.add(m)});
 // paintings
 Object.values(W.artSpots).forEach(sp=>{
  const i=sp.i;const c=document.createElement('canvas');c.width=AW;c.height=AH;const ctx=c.getContext('2d',{willReadFrequently:true});
  const tex=nearest(new THREE.CanvasTexture(c));art[i]={canvas:c,ctx,tex,img:null};
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(sp.w,sp.h),new THREE.MeshBasicMaterial({map:tex,color:new THREE.Color(sp.light*.98,sp.light*.98,sp.light*.98)}));
  const off=.03;mesh.position.set(sp.x+sp.nx*off,sp.z,sp.y+sp.ny*off);
  mesh.rotation.y=sp.nx===1?Math.PI/2:sp.nx===-1?-Math.PI/2:sp.ny===1?0:Math.PI;scene.add(mesh);paintArt(i);
  E.artCells[i]=sp.cell;
 });
 // signs
 W.signs.forEach((sg,k)=>{const d=W.DIRV[sg.dir];const x=sg.x+.5+(sg.dir==='E'?.5:sg.dir==='W'?-.5:0),y=sg.y+.5+(sg.dir==='S'?.5:sg.dir==='N'?-.5:0);
  const tex=signTex(sg.text,sg.g,sg.opts);
  sg.px=x;sg.py=y;sg.pz=1.9;sg.pw=1.3;sg.ph=.82;sg.nx=d[0];sg.ny=d[1];
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.82),new THREE.MeshBasicMaterial({map:tex,color:0xf0f0f0}));
  m.position.set(x+d[0]*.03,1.9,y+d[1]*.03);m.rotation.y=d[0]===1?Math.PI/2:d[0]===-1?-Math.PI/2:d[1]===1?0:Math.PI;scene.add(m);
 });
 // hanging staircase signs
 (W.hang||[]).forEach(h=>{const tex=signTex(h.text,h.g);const m=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.81),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));m.position.set(h.x,h.z,h.y);m.rotation.y=-Math.PI/2;scene.add(m)});
 // front banner
 {const c=document.createElement('canvas');c.width=128;c.height=20;const x=c.getContext('2d');x.fillStyle='#1b140c';x.fillRect(0,0,128,20);x.fillStyle='#d4af37';x.fillRect(1,1,126,18);x.fillStyle='#1b140c';x.fillRect(3,3,122,14);x.fillStyle='#f3d98a';x.font='bold 10px monospace';x.textAlign='center';x.fillText('THE ROARING SOCIETY',64,14);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(5.6,.88),new THREE.MeshBasicMaterial({map:nearest(new THREE.CanvasTexture(c))}));m.position.set(30,4.55,60.05);scene.add(m);}
 // door leaves
 S.doors=[];const leafGeo=W.boxGeo(.98,3.3,.08,'door',.95);
 W.doorways.forEach(d=>{
  const mk=(hx,hy,thC,thO)=>{const g=new THREE.Group();g.position.set(hx,0,hy);const m=new THREE.Mesh(leafGeo,S.mat);m.position.set(.5,1.65,0);g.add(m);scene.add(g);return {g,c:thC,o:thO,t:0}};
  let la,lb;
  if(d.along==='y'){la=mk(d.cx,d.cy-1,Math.PI/2,0);lb=mk(d.cx,d.cy+1,-Math.PI/2,0)}
  else{la=mk(d.cx-1,d.cy,0,Math.PI/2);lb=mk(d.cx+1,d.cy,Math.PI,Math.PI/2)}
  [la,lb].forEach(l=>{l.g.rotation.y=-l.c});
  S.doors.push({cx:d.cx,cy:d.cy,a:la,b:lb,open:0,front:d.cx===30&&d.cy===59.5});
 });
 // secret doors
 S.secret={};
 const panelGeo=W.boxGeo(.08,3.0,.94,'secret',.9);
 for(const g in W.secretDoor){const d=W.secretDoor[g];
  const grp=new THREE.Group();grp.position.set(d.x+.5,0,d.y+.03);const m=new THREE.Mesh(panelGeo,S.mat);m.position.set(0,1.5,.47);grp.add(m);scene.add(grp);
  const solid=W.addSolid({x0:d.x,x1:d.x+1,y0:d.y,y1:d.y+1,b:0,t:3.0,kind:'wall'});
  S.secret[g]={grp,solid,p:0,open:false};
 }
 // entities
 buildEntities();
 Object.keys(RS.S.secretOpen).forEach(g=>{if(RS.S.secretOpen[g])E.openSecret(+g,true)});
};
function addSprite(o){const s=Object.assign({solid:false,visible:true,r:.3,pick:.9,z:0},o);sprites.push(s);return s}
function buildEntities(){
 const scene=S.scene,NPC=window.NPC;
 // stations
 W.stations.forEach(st=>{
  const s=addSprite({id:st.id,kind:'station',gal:st.g,x:st.x,y:st.y,label:st.label,pick:st.pick,reach:st.reach,zc:Math.min(st.iconZ-.9,1.7)});
  const em=st.id.startsWith('tp')?'✨':STATION_ICON[st.id]||'📍';
  s.mesh=icon(em,.6);s.mesh.position.set(st.x,st.iconZ,st.y);s.base=st.iconZ;scene.add(s.mesh);E.stationSprites[st.id]=s});
 // hidden-room extras
 const ex=W.extras;
 [['raid',ex.raid,'Back office: Raid! mini-game',5],['vaultcredits',ex.vault,'Credits & behind-the-scenes notes',7]].forEach(([id,p,label,g])=>{
  const s=addSprite({id,kind:'station',gal:g,x:p.x,y:p.y,label,pick:.7,zc:1.1,visible:!!RS.S.secretOpen[g]});s.mesh=icon(STATION_ICON[id],.5);s.base=1.3;s.mesh.position.set(p.x,1.3,p.y);scene.add(s.mesh);E.stationSprites[id]=s});
 // items
 for(let g=1;g<=6;g++){(D.ITEMS[g]||[]).forEach(it=>{const p=W.itemSpots[it[0]];if(!p)return;
  const s=addSprite({id:'item:'+it[0],kind:'item',gal:g,key:it[0],x:p.x,y:p.y,label:it[1]+' (replica)',pick:.45,zc:p.z,visible:!!RS.S.secretOpen[g]&&!RS.S.items.includes(it[0])});
  s.mesh=icon(ITEM_ICON[it[0]]||'📦',.42);s.base=p.z;s.mesh.position.set(p.x,p.z,p.y);scene.add(s.mesh);E.itemSprites[it[0]]=s})}
 // seats
 W.seats.forEach((st,i)=>{addSprite({id:'seat'+i,kind:'seat',x:st.x,y:st.y,z:st.z,seat:st,label:st.label,pick:.5,zc:st.z+.25,mesh:null})});
 // docents and the clerk
 W.docentSpots.forEach(d=>{
  const m=NPC.make(NPC.PALS[d.g%NPC.PALS.length],{hat:'#b08d57',gold:true,seed:d.g*5+1});scene.add(m);m.position.set(d.x,0,d.y);
  const s=addSprite({id:'docent'+d.g,kind:'docent',gal:d.g,x:d.x,y:d.y,label:d.label,solid:true,r:.3,pick:.55,zc:1.0,talk:0,model:m,face:Math.PI/2});
  W.addSolid({x0:d.x-.3,x1:d.x+.3,y0:d.y-.3,y1:d.y+.3,b:0,t:1.8,kind:'npc'});
 });
 {const c=ex.clerk;const m=NPC.make(NPC.PALS[4],{hat:'#222',seed:77});scene.add(m);m.position.set(c.x,0,c.y);
  addSprite({id:'bartender',kind:'npc-talk',gal:5,x:c.x,y:c.y,label:'Cigar-shop clerk',solid:true,pick:.55,zc:1.0,model:m,face:Math.PI/2});
  W.addSolid({x0:c.x-.3,x1:c.x+.3,y0:c.y-.3,y1:c.y+.3,b:0,t:1.8,kind:'npc'})}
 // wandering visitors
 let seed=42;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const mkVisitor=(g,n)=>{for(let i=0;i<n;i++){
  const pal=NPC.PALS[(rnd()*NPC.PALS.length)|0];const m=NPC.make(pal,{hat:rnd()<.5?'#222':null,seed:(rnd()*1e6)|0});scene.add(m);
  let x,y,tries=0;const o=W.ORIGIN[g];
  do{x=o[0]+3+rnd()*14;y=o[1]+3+rnd()*14;tries++}while(!window.Phys.walkable(x,y,.3)&&tries<80);
  const s=addSprite({id:'visitor'+npcs.length,kind:'visitor',gal:g,x,y,label:'Visitor',model:m,speed:.7+rnd()*.5,state:'wait',t:rnd()*3,tx:x,ty:y,heading:rnd()*6.28});
  npcs.push(s)}};
 for(let g=0;g<=7;g++)mkVisitor(g,g===0||g===6?1:2);
 mkVisitor(9,6);
}
E.openSecret=function(g,silent){
 const o=S.secret&&S.secret[g];if(!o)return;
 if(!o.open){o.open=true;o.solid.dead=true;if(silent)o.p=1}
 W.map[W.secretDoor[g].y*N+W.secretDoor[g].x]=0;RS.S.secretOpen[g]=true;
 (D.ITEMS[g]||[]).forEach(it=>{const s=E.itemSprites[it[0]];if(s&&!RS.S.items.includes(it[0]))s.visible=true});
 if(g===7&&E.stationSprites.vaultcredits)E.stationSprites.vaultcredits.visible=true;
 if(g===5&&E.stationSprites.raid)E.stationSprites.raid.visible=true;
 if(!silent){RS.S.secret[g]=true;RS.save();RS.emit('secret',g)}
};
E.hideItem=key=>{const s=E.itemSprites[key];if(s)s.visible=false};
RS.on('artwork.viewed',()=>{if(S.scene)E.refreshSeen()});
})();
