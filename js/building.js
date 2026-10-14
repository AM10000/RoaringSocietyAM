/* Building: carves the ring museum from the 60x60 plan, adds mezzanines, secret chambers, doorways, then meshes it. */
(function(){
'use strict';
const W=window.World,A=window.Atlas,H=W.H,N=W.N,B=W.B,ORIGIN=W.ORIGIN,BLOCK=W.BLOCK;
const {map,floorId,ctype,slab,lintel,chamber,stairc}=W;
const ix=(x,y)=>y*N+x,inb=W.inb;
const lintelB=new Float32Array(N*N);W.lintelB=lintelB;
const extAdj=new Uint8Array(N*N);W.extAdj=extAdj;

/* ---------------- layout ---------------- */
function carve(x,y,top){const i=ix(x,y);ctype[i]=0;map[i]=0;lintel[i]=1;lintelB[i]=H.door}
function doorway(cx,cy,along,thick){W.doorways.push({cx,cy,along,thick})}
W.layout=function(){
 for(const k in BLOCK){const g=BLOCK[k];const [bx,by]=k.split(',').map(Number);const ox=bx*B,oy=by*B;
  for(let y=0;y<B;y++)for(let x=0;x<B;x++){const i=ix(ox+x,oy+y);floorId[i]=g;
   const edge=x===0||y===0||x===B-1||y===B-1;if(g!==9&&edge){ctype[i]=1;map[i]=g+1}}}
 // doors between ring-adjacent blocks (2 wide through the double wall)
 const ringPairs=[[[1,2],[0,2]],[[0,2],[0,1]],[[0,1],[0,0]],[[0,0],[1,0]],[[1,0],[2,0]],[[2,0],[2,1]],[[2,1],[2,2]],[[2,2],[1,2]]];
 ringPairs.forEach(([a,b])=>{
  if(a[0]!==b[0]){const xl=Math.min(a[0],b[0])*B+B-1,oy=a[1]*B;for(const dy of [9,10]){carve(xl,oy+dy);carve(xl+1,oy+dy)}doorway(xl+1,oy+10,'y',2)}
  else{const yt=Math.min(a[1],b[1])*B+B-1,ox=a[0]*B;for(const dx of [9,10]){carve(ox+dx,yt);carve(ox+dx,yt+1)}doorway(ox+10,yt+1,'x',2)}});
 // courtyard doors (single wall) and the front door
 [[29,40],[30,40]].forEach(p=>carve(...p));doorway(30,40.5,'x',1);
 [[29,19],[30,19]].forEach(p=>carve(...p));doorway(30,19.5,'x',1);
 [[19,29],[19,30]].forEach(p=>carve(...p));doorway(19.5,30,'y',1);
 [[40,29],[40,30]].forEach(p=>carve(...p));doorway(40.5,30,'y',1);
 [[29,59],[30,59]].forEach(p=>carve(...p));doorway(30,59.5,'x',1);W.frontDoor={x:30,y:59.5};
 // exterior adjacency (for parapets)
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=ix(x,y);if(!ctype[i])continue;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!inb(nx,ny)||(floorId[ix(nx,ny)]===9&&!ctype[ix(nx,ny)])){extAdj[i]=1}}}
 // balcony slabs, stair openings, secret chambers
 for(let g=0;g<=7;g++){const [ox,oy]=ORIGIN[g];
  const inCh=(lx,ly)=>g>=1&&lx<=5&&ly<=5;   // the NW corner mass (chamber + its walls)
  for(let ly=1;ly<=18;ly++)for(let lx=1;lx<=18;lx++){
   const band=lx<=3||lx>=16||ly<=3||ly>=16;if(!band)continue;
   if((lx>=17&&ly>=11)||(lx===16&&ly>=11&&ly<=15)){if(lx>=17)stairc[ix(ox+lx,oy+ly)]=1;continue}
   if(inCh(lx,ly))continue;
   slab[ix(ox+lx,oy+ly)]=1}
  if(g>=1){ // secret chamber: a 4x4 room inside a full-height masonry corner. Its walls are ordinary hall walls; only a flush panel (2 m door) gives it away.
   for(let ly=1;ly<=4;ly++)for(let lx=1;lx<=4;lx++)chamber[ix(ox+lx,oy+ly)]=1;
   for(let k=1;k<=5;k++){for(const [x,y] of [[5,k],[k,5]]){const i=ix(ox+x,oy+y);ctype[i]=2;map[i]=g+1}}
   const di=ix(ox+5,oy+3);ctype[di]=0;map[di]=90;lintel[di]=1;lintelB[di]=H.sdoor;
   W.secretDoor[g]={x:ox+5,y:oy+3,g};
  }
 }
 // collision for the shell
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=ix(x,y);
  if(ctype[i])W.addSolid({x0:x,x1:x+1,y0:y,y1:y+1,b:0,t:topOf(i),kind:'wall'});
  else{
   if(lintel[i])W.addSolid({x0:x,x1:x+1,y0:y,y1:y+1,b:lintelB[i],t:extAdj[i]?H.par:H.roofT,kind:'wall'});
   else if(chamber[i])W.addSolid({x0:x,x1:x+1,y0:y,y1:y+1,b:H.chamB,t:H.roofT,kind:'wall'});
   else if(slab[i])W.addSolid({x0:x,x1:x+1,y0:y,y1:y+1,b:H.slabB,t:H.slabT,kind:'slab'});
  }}
};
/* wall cell top height */
const topOf=i=>extAdj[i]?H.par:H.roofT;
W.topOf=topOf;
/* vertical solid intervals of a cell */
function ivs(x,y){
 if(!inb(x,y))return [];const i=ix(x,y);
 if(ctype[i]>0)return [[0,topOf(i)]];
 if(lintel[i])return [[lintelB[i],extAdj[i]?H.par:H.roofT]];
 const g=floorId[i];if(g===9||g===255)return [];
 if(chamber[i])return [[H.chamB,H.roofT]];
 const out=[];if(slab[i])out.push([H.slabB,H.slabT]);out.push([H.roofB,H.roofT]);return out;
}
function subtract(seg,list){let segs=[seg];for(const [a,b] of list){const nx=[];for(const [s0,s1] of segs){if(b<=s0||a>=s1){nx.push([s0,s1]);continue}if(a>s0)nx.push([s0,a]);if(b<s1)nx.push([b,s1])}segs=nx}return segs.filter(s=>s[1]-s[0]>1e-4)}

/* ---------------- tile choice for wall faces ---------------- */
function interiorTile(g,a,b){
 const lvl=a>=H.slabT-.01?1:0,base=lvl?H.slabT:0,top=lvl?H.roofB:H.slabB;
 const r=Math.floor(a-base+1e-6),rb=base+r;const topRow=b>=top-1e-4&&top-b<1e-4+0;
 const isTop=b>=top-1e-4;
 let name,f0,f1,vt=false;
 if(isTop){name='corn_'+g;vt=true;f0=1-(b-a);f1=1}
 else if(r===0){name='wains_'+g;f0=a-rb;f1=b-rb}
 else{name='wall_'+g;f0=a-rb;f1=b-rb}
 return {name,f0:Math.max(0,f0),f1:Math.min(1,f1)};
}
function exteriorTile(a,b,along,hasWin){
 const r=Math.floor(a+1e-6);const full=(b-a)>=.999;
 const win=hasWin&&((along%3+3)%3===1)&&full;
 let name='brick';
 if(r===0)name='plinth';
 else if(r===4)name='stone';
 else if(r>=10)name='cornice_ext';
 else if(win&&r===2)name='win_bot';else if(win&&r===3)name='win_top';else if(win&&r===7)name='win_bot';else if(win&&r===8)name='win_top';
 else if(((along*7+r*3)&7)===0)name='brick2';
 return {name,f0:a-r,f1:b-r};
}

/* ---------------- meshing ---------------- */
const DIRS=[['E',1,0],['W',-1,0],['S',0,1],['N',0,-1]];
function chunkId(x,y){const g=floorId[ix(x,y)];return g===255?'out':g}
function wallFace(chId,dir,x,y,z0,z1,tile,light){ // face of cell (x,y) in direction dir, vertical span z0..z1
 const ch=W.chunk(chId);const lu=1,lv=z1-z0;
 const o=dir==='E'?[x+1,z0,y+1]:dir==='W'?[x,z0,y]:dir==='S'?[x,z0,y+1]:[x+1,z0,y];
 const du=dir==='E'?[0,0,-1]:dir==='W'?[0,0,1]:dir==='S'?[1,0,0]:[-1,0,0];
 W.quad(ch,o,du,[0,1,0],1,lv,tile.name,light,tile.f0,tile.f1,0,1,.9);
}
W.mesh=function(){
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const i=ix(x,y);const A0=ivs(x,y);const g=floorId[i];const chId=g===255?'out':(g===9?9:g);
  const isOpen=!ctype[i];
  // vertical faces
  if(A0.length)for(const [dn,dx,dy] of DIRS){
   const nx=x+dx,ny=y+dy;const Bv=ivs(nx,ny);const ni=inb(nx,ny)?ix(nx,ny):-1;
   const sp=ni<0?255:floorId[ni];const outdoor=sp===9||sp===255;const bchamber=ni>=0&&chamber[ni];
   for(const iv of A0){
    for(const [s0,s1] of subtract(iv,Bv)){
     // split by whole metres so tiles align
     let a=s0;while(a<s1-1e-4){let b=Math.min(s1,Math.floor(a+1e-6)+1);
      // keep slab/level boundaries from straddling
      for(const cut of [H.slabB,H.slabT,H.roofB]){if(a<cut-1e-4&&b>cut+1e-4)b=cut}
      let tile;
      const wallLike=ctype[i]>0||lintel[i];
      if(!wallLike)tile={name:'slab_edge',f0:0,f1:Math.min(1,b-a)};
      else if(ctype[i]===2&&!bchamber)tile=interiorTile(sp,a,b);
      else if(bchamber)tile={name:'chamber_wall',f0:0,f1:Math.min(1,b-a)};
      else if(outdoor)tile=exteriorTile(a,b,dx!==0?y:x,!lintel[i]);
      else tile=interiorTile(sp,a,b);
      const light=W.lightAt(nx+.5,ny+.5,(a+b)/2);
      wallFace(ni<0?'out':(outdoor?(g===255?'out':chId):sp),dn,x,y,a,b,tile,outdoor?1:light);
      a=b}
    }}
  }
  // horizontal faces
  const ch=W.chunk(chId);
  if(isOpen){
   const sp=g;
   if(sp<=7||chamber[i]||sp===9){ /* floor */
    const t=W.floorTile(x,y);if(t)W.quad(ch,[x,0,y],[0,0,1],[1,0,0],1,1,t,W.lightAt(x+.5,y+.5,0));
   }
   if(lintel[i]){W.quad(ch,[x,lintelB[i],y],[1,0,0],[0,0,1],1,1,'beam',.8)}
   if(sp<=7&&!lintel[i]){
    const [ox,oy]=ORIGIN[sp];const lx=x-ox,ly=y-oy;
    if(chamber[i]){W.quad(ch,[x,H.chamB,y],[1,0,0],[0,0,1],1,1,'chamber_ceil',.7)}
    else{
     if(slab[i]){W.quad(ch,[x,H.slabB,y],[1,0,0],[0,0,1],1,1,'coffer',.8);W.quad(ch,[x,H.slabT,y],[0,0,1],[1,0,0],1,1,((x+y)&1)?'parq_a':'parq_b',.98)}
     const sky=lx>=5&&lx<=14&&ly>=5&&ly<=14;
     W.quad(ch,[x,H.roofB,y],[1,0,0],[0,0,1],1,1,sky?'skylight':'coffer',sky?1.12:.9);
    }
   }else if(sp<=7&&lintel[i]){/* doorway: lintel handled above */}
  }
  // top faces of walls that stand above surroundings
  if(ctype[i]){const t=topOf(i);if(t!==H.roofT)W.quad(ch,[x,t,y],[0,0,1],[1,0,0],1,1,ctype[i]===2?'roof':'roof_cap',1)}
 }
};
/* floor tile selection */
W.floorHook=null;
W.floorTile=function(x,y){
 if(W.floorHook){const t=W.floorHook(x,y);if(t)return t}
 const i=ix(x,y);const g=floorId[i];
 if(chamber[i])return 'plank_floor';
 if(g===9){
  const cx=x+.5-30,cy=y+.5-30;const d=Math.hypot(cx,cy);
  if(d<7.5)return ((x+y)&1)?'plaza':'plaza2';
  if(Math.abs(cx)<2.2||Math.abs(cy)<2.2)return 'cobble';
  const h=(x*73856093^y*19349663)>>>0;
  return (h%11===0)?'flower':(h&1)?'grass':'grass2';
 }
 const [ox,oy]=ORIGIN[g];const lx=x-ox,ly=y-oy;
 if(lx>=6&&lx<=13&&ly>=6&&ly<=13)return 'rug_'+g;
 if(g===0)return ((x+y)&1)?'marble_a':'marble_b';
 if(g===7)return 'vault_floor';
 if(g===6)return ((x+y)&1)?'parq_dark':'parq_b';
 return ((x+y)&1)?'parq_a':'parq_b';
};
})();
