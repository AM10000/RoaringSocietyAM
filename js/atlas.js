/* Texture atlas: every tile is a 16x16 pixel-art texture painted by code (Minecraft-style).
   The 3D world samples this with nearest-neighbour filtering, so pixels stay crisp at any screen size. */
(function(){
'use strict';
const TS=16,COLS=16;
const cv=document.createElement('canvas');cv.width=cv.height=TS*COLS;
const cx=cv.getContext('2d',{willReadFrequently:true});
const IDX={};let next=0;
const A=window.Atlas={canvas:cv,TS,COLS,idx:IDX};
function rng(seed){let s=(seed>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const hex=h=>{if(Array.isArray(h))return h;h=h.replace('#','');return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)]};
const mul=(c,k)=>hex(c).map(v=>Math.max(0,Math.min(255,Math.round(v*k))));
const mix=(a,b,t)=>{a=hex(a);b=hex(b);return a.map((v,i)=>Math.round(v+(b[i]-v)*t))};
const GOLD='#d4af37';

function Tile(seed){this.d=new Uint8ClampedArray(TS*TS*4);this.r=rng(seed||1);for(let i=3;i<this.d.length;i+=4)this.d[i]=255}
Tile.prototype={
 px(x,y,c,a){x|=0;y|=0;if(x<0||y<0||x>=TS||y>=TS)return this;c=hex(c);const i=(y*TS+x)*4;this.d[i]=c[0];this.d[i+1]=c[1];this.d[i+2]=c[2];this.d[i+3]=a===undefined?255:a;return this},
 get(x,y){const i=(y*TS+x)*4;return [this.d[i],this.d[i+1],this.d[i+2]]},
 rect(x,y,w,h,c){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.px(x+i,y+j,c);return this},
 fill(c){return this.rect(0,0,TS,TS,c)},
 hl(y,x0,x1,c){return this.rect(x0,y,x1-x0+1,1,c)},
 vl(x,y0,y1,c){return this.rect(x,y0,1,y1-y0+1,c)},
 noise(a,keep){for(let i=0;i<TS*TS;i++){if(this.d[i*4+3]===0)continue;const k=1+(this.r()-.5)*a;for(let j=0;j<3;j++)this.d[i*4+j]=Math.max(0,Math.min(255,this.d[i*4+j]*k))}return this},
 clear(){this.d.fill(0);return this},
 shadeRect(x,y,w,h,k){for(let j=0;j<h;j++)for(let i=0;i<w;i++){const X=x+i,Y=y+j;if(X<0||Y<0||X>=TS||Y>=TS)continue;const p=(Y*TS+X)*4;for(let q=0;q<3;q++)this.d[p+q]=Math.max(0,Math.min(255,this.d[p+q]*k))}return this}
};
function def(name,seed,fn){
 const t=new Tile(seed);fn(t);const id=next++;IDX[name]=id;
 const img=new ImageData(t.d,TS,TS);cx.putImageData(img,(id%COLS)*TS,((id/COLS)|0)*TS);return id;
}
A.def=def;
A.has=n=>n in IDX;
A.id=n=>{if(!(n in IDX)){if(window.console)console.warn('missing tile',n);return 0}return IDX[n]};
/* uv rectangle of a tile: returns [u0,v0,u1,v1] with a hair of inset so nearest sampling never bleeds */
const E=0.03/(TS*COLS);
A.uv=n=>{const id=A.id(n),c=id%COLS,r=(id/COLS)|0;return [c/COLS+E,1-(r+1)/COLS+E,(c+1)/COLS-E,1-r/COLS-E]};

/* ---------------------------------------------------------------- shared painters */
function brickPattern(t,base,mort,seed,w,hh){
 const r=rng(seed);t.fill(mort);
 for(let c=0;c<4;c++){const y0=c*4,off=(c%2)*4;
  for(let k=-1;k<3;k++){const x0=off+k*8;const v=.86+r()*.28;const col=mul(base,v);
   t.rect(x0,y0,7,3,col);t.hl(y0,Math.max(0,x0),Math.min(15,x0+6),mul(col,1.12));t.hl(y0+2,Math.max(0,x0),Math.min(15,x0+6),mul(col,.88))}}
}
function blocks(t,base,mort,seed,rows){
 const r=rng(seed);t.fill(mort);const h=16/rows;
 for(let j=0;j<rows;j++){const y0=(j*h)|0;const off=j%2?5:0;for(let k=-1;k<2;k++){const x0=off+k*11;const col=mul(base,.92+r()*.16);
   t.rect(Math.max(0,x0),y0,Math.min(15,x0+9)-Math.max(0,x0)+1,Math.max(1,h-1)|0,col);t.hl(y0,Math.max(0,x0),Math.min(15,x0+9),mul(col,1.1))}}
}
function woodPlanks(t,base,seed,vertical){
 const r=rng(seed);
 for(let i=0;i<4;i++){const col=mul(base,.88+r()*.24);
  if(vertical){t.rect(i*4,0,4,16,col);t.vl(i*4+3,0,15,mul(col,.7));for(let k=0;k<5;k++)t.px(i*4+((r()*3)|0),(r()*16)|0,mul(col,.85))}
  else{t.rect(0,i*4,16,4,col);t.hl(i*4+3,0,15,mul(col,.7));for(let k=0;k<5;k++)t.px((r()*16)|0,i*4+((r()*3)|0),mul(col,.85))}}
}
function parquet(t,base,seed,flip){
 const r=rng(seed);
 for(let b=0;b<4;b++){const col=mul(base,.88+r()*.22);const x0=(b%2)*8,y0=((b/2)|0)*8;const horiz=((b+(flip?1:0))%2)===0;
  for(let s=0;s<4;s++){const c2=mul(col,.94+((s%2)*0.1));if(horiz){t.rect(x0,y0+s*2,8,2,c2);t.hl(y0+s*2+1,x0,x0+7,mul(c2,.78))}else{t.rect(x0+s*2,y0,2,8,c2);t.vl(x0+s*2+1,y0,y0+7,mul(c2,.78))}}}
}
function marble(t,a,b,seed,vein){
 const r=rng(seed);t.fill(a);t.noise(.07);
 for(let i=0;i<3;i++){let x=r()*16,y=r()*16;const dx=(r()-.5)*1.6,dy=(r()-.5)*1.6;for(let k=0;k<9;k++){t.px(x,y,mix(a,vein,.45));x+=dx+(r()-.5);y+=dy+(r()-.5)}}
 t.vl(0,0,15,mul(a,.9));t.hl(0,0,15,mul(a,.9));
}
const acc=g=>hex(window.DATA.G[g].accent);

/* ---------------------------------------------------------------- tiles */
function build(){
 const G=window.DATA.G;
 /* exterior */
 def('brick',11,t=>brickPattern(t,'#9b4a35','#cdbfa5',11));
 def('brick2',12,t=>brickPattern(t,'#8f4431','#c3b499',12));
 def('plinth',13,t=>{blocks(t,'#8d8a80','#6e6b62',13,2);t.noise(.1)});
 def('stone',14,t=>{blocks(t,'#a6a398','#85826f',14,4);t.noise(.12)});
 const win=(top)=>t=>{brickPattern(t,'#9b4a35','#cdbfa5',top?15:16);
  t.rect(2,top?3:0,12,top?13:12,'#cfc6ae');t.rect(3,top?4:0,10,top?12:11,'#2e5578');
  for(let i=0;i<10;i++){const yy=(top?4:0)+i;if(yy>15||yy<0)continue;for(let j=0;j<10;j++){const f=(i+j)%7===0?'#6aa3d1':((i*3+j)%11===0?'#4a7fae':null);if(f)t.px(3+j,yy,f)}}
  t.vl(7,top?4:0,top?15:11,'#cfc6ae');t.vl(8,top?4:0,top?15:11,'#b4ab92');
  if(top){t.hl(3,2,13,'#e6dec8');t.hl(2,1,14,'#cfc6ae');t.hl(1,0,15,'#b4ab92')}else{t.rect(1,12,14,2,'#e6dec8');t.hl(14,1,14,'#9d957e')}
  if(!top)t.hl(6,3,12,'#cfc6ae')};
 def('win_top',17,win(true));def('win_bot',18,win(false));
 def('cornice_ext',19,t=>{t.fill('#bdb6a0');t.rect(0,0,16,4,'#d8d1ba');t.hl(4,0,15,'#8e8872');t.hl(5,0,15,'#6f6a58');for(let x=1;x<16;x+=3)t.rect(x,6,2,4,'#a39c85');t.hl(11,0,15,'#8e8872');t.rect(0,12,16,4,'#cfc8b1');t.hl(15,0,15,'#aaa38c');t.noise(.06)});
 def('parapet',20,t=>{t.fill('#bdb6a0');t.rect(0,0,16,3,'#d8d1ba');t.hl(3,0,15,'#8e8872');t.noise(.06)});
 def('roof',21,t=>{t.fill('#6f6c68');t.noise(.3);for(let i=0;i<24;i++)t.px(t.r()*16,t.r()*16,'#8f8b86')});
 def('roof_cap',22,t=>{t.fill('#c9c2a9');t.noise(.08);t.rect(0,0,16,1,'#a39c85')});
 def('pilaster',23,t=>{t.fill('#d6cfb8');for(let x=2;x<14;x+=3){t.vl(x,0,15,'#b9b29b');t.vl(x+1,0,15,'#e5dfca')}t.noise(.05)});
 /* interior themes per gallery */
 for(let g=0;g<=7;g++){
  const a=acc(g);
  if(g===0){ // entrance: marble hall
   def('wall_0',100,t=>{t.fill('#d9cdb2');t.noise(.06);for(let x=0;x<16;x+=8){t.vl(x,0,15,'#c3b595')}t.hl(0,0,15,'#cbbd9f');for(let i=0;i<4;i++)t.px(t.r()*16,t.r()*16,'#bfb08c')});
   def('wains_0',101,t=>{marble(t,'#bda885','#6d5a3a',101,'#7a6642');t.rect(1,1,14,14,mix('#bda885','#8c7650',.25));t.rect(2,2,12,12,'#c9b693');t.hl(1,1,14,'#e0d2b0');t.vl(1,1,14,'#e0d2b0');t.hl(14,1,14,'#6d5a3a');t.vl(14,1,14,'#6d5a3a')});
   def('corn_0',102,t=>{t.fill('#d9cdb2');t.noise(.05);t.rect(0,0,16,3,'#f0e6c8');t.hl(3,0,15,'#a58d60');t.rect(0,4,16,2,'#8c7650');for(let x=1;x<16;x+=3)t.rect(x,7,2,3,'#c3b595');t.hl(10,0,15,'#a58d60')});
  }else if(g===6){ // library
   def('wall_6',106,t=>{ // bookshelf
    t.fill('#2c1a0c');const r=rng(61);
    for(let row=0;row<2;row++){const y0=row*8;t.rect(0,y0+7,16,1,'#6b4423');let x=0;while(x<16){const w=1+((r()*2)|0)+1;const hh=5+((r()*3)|0);const c=['#8b2c2c','#2c4a6b','#2f5a3a','#6b4a2c','#7a6a2c','#4a2c5a','#a0602c'][(r()*7)|0];t.rect(x,y0+7-hh,w,hh,c);t.vl(x,y0+7-hh,y0+6,mul(c,1.2));x+=w}}
    t.vl(0,0,15,'#6b4423');t.vl(15,0,15,'#6b4423')});
   def('wains_6',107,t=>{woodPlanks(t,'#5a3a1c',107,true);t.rect(0,0,16,2,'#7a5128');t.hl(2,0,15,'#3a2410')});
   def('corn_6',108,t=>{t.fill('#3a2410');t.rect(0,0,16,3,'#8c6128');t.hl(3,0,15,'#5a3a1c');for(let x=1;x<16;x+=3)t.rect(x,5,2,3,'#5a3a1c');t.noise(.08)});
  }else if(g===7){ // vault / curator
   def('wall_7',117,t=>{woodPlanks(t,'#5b3a24',117,true);t.noise(.06);for(const x of [3,11])for(const y of [4,12])t.px(x,y,GOLD);t.hl(8,0,15,'#3a2414')});
   def('wains_7',118,t=>{t.fill('#3a2414');t.rect(1,1,14,14,'#4a2f1b');t.rect(2,2,12,12,'#573823');t.hl(1,1,14,GOLD);t.hl(14,1,14,GOLD);t.vl(1,1,14,GOLD);t.vl(14,1,14,GOLD)});
   def('corn_7',119,t=>{t.fill('#5b3a24');t.rect(0,0,16,3,GOLD);t.hl(3,0,15,'#8c6d23');t.rect(0,4,16,2,'#3a2414');for(let x=1;x<16;x+=3)t.rect(x,7,2,3,'#8c6d23');t.noise(.06)});
  }else{
   const base=mul(a,.5),light=mul(a,.62),dark=mul(a,.3);
   def('wall_'+g,100+g,t=>{ // striped wallpaper with small motif
    t.fill(base);for(let x=0;x<16;x+=8){t.rect(x,0,4,16,light);}
    for(let y=2;y<16;y+=8)for(let x=2;x<16;x+=8){t.px(x,y,mul(a,.85));t.px(x-1,y+1,mul(a,.85));t.px(x+1,y+1,mul(a,.85));t.px(x,y+2,mul(a,.85))}
    t.noise(.06)});
   def('wains_'+g,110+g,t=>{t.fill(dark);t.rect(1,1,14,14,mul(a,.24));t.rect(2,2,12,12,mul(a,.36));t.hl(1,1,14,mul(a,.6));t.vl(1,1,14,mul(a,.6));t.hl(14,1,14,mul(a,.16));t.vl(14,1,14,mul(a,.16));t.noise(.05)});
   def('corn_'+g,120+g,t=>{t.fill(base);for(let x=0;x<16;x+=8)t.rect(x,0,4,16,light);t.rect(0,0,16,3,GOLD);t.hl(3,0,15,'#8c6d23');t.rect(0,4,16,2,dark);for(let x=1;x<16;x+=4)t.rect(x,6,2,2,'#8c6d23');t.noise(.05)});
  }
  def('rug_'+g,130+g,t=>{ // carpet with border and diamond
   const c0=g===0?'#7a2a2a':mul(a,.55),c1=g===0?'#c9a24a':mul(a,.85);t.fill(c0);t.noise(.08);
   t.rect(0,0,16,2,c1);t.rect(0,14,16,2,c1);t.rect(0,0,2,16,c1);t.rect(14,0,2,16,c1);t.rect(2,2,12,1,mul(c0,.7));
   for(let i=0;i<5;i++){t.hl(8-i,8-i-0,8+i,mul(c1,.9));t.hl(8+i-1,8-i,8+i,mul(c1,.9))}});
 }
 /* floors */
 def('parq_a',40,t=>parquet(t,'#9b6a3a',40,false));
 def('parq_b',41,t=>parquet(t,'#8a5c30',41,true));
 def('parq_dark',42,t=>parquet(t,'#5e3b1f',42,false));
 def('marble_a',43,t=>marble(t,'#e4dcc7','#9a8f72',43,'#8c8266'));
 def('marble_b',44,t=>marble(t,'#4a4a52','#8c8c94',44,'#9a9aa2'));
 def('plank_floor',45,t=>woodPlanks(t,'#7a5230',45,false));
 def('vault_floor',46,t=>{marble(t,'#2b2b33','#6a6a72',46,'#7a7a82');t.rect(0,0,16,1,GOLD)});
 /* ceilings */
 def('ceil',50,t=>{t.fill('#ddd2b8');t.noise(.06);t.hl(0,0,15,'#c3b79b');t.vl(0,0,15,'#c3b79b')});
 def('coffer',51,t=>{t.fill('#bba98a');t.rect(2,2,12,12,'#d8ccb0');t.rect(4,4,8,8,'#c9bb9c');t.hl(2,2,13,'#efe5cb');t.vl(2,2,13,'#efe5cb');t.noise(.05)});
 def('beam',52,t=>{woodPlanks(t,'#4a2f18',52,false);t.hl(0,0,15,'#2e1c0e');t.hl(15,0,15,'#2e1c0e')});
 def('skylight',53,t=>{t.fill('#bfe0f5');t.noise(.04);t.rect(0,0,16,1,'#6b6b6b');t.rect(0,15,16,1,'#6b6b6b');t.vl(0,0,15,'#6b6b6b');t.vl(15,0,15,'#6b6b6b');t.vl(8,0,15,'#8a8a8a');t.hl(8,0,15,'#8a8a8a');for(let i=0;i<5;i++)t.px(3+i*2,2+i,'#ffffff')});
 def('slab_edge',54,t=>{t.fill('#cfc4a8');t.rect(0,0,16,2,'#e6dcc2');t.hl(2,0,15,'#a39878');t.rect(0,12,16,4,'#b3a888');t.hl(12,0,15,'#8e8468');t.noise(.05)});
 def('chamber_ceil',55,t=>{woodPlanks(t,'#4a301a',55,false)});
 /* outdoors */
 def('grass',60,t=>{t.fill('#5d9a3c');t.noise(.2);for(let i=0;i<14;i++)t.px(t.r()*16,t.r()*16,'#76b34a');for(let i=0;i<8;i++)t.px(t.r()*16,t.r()*16,'#477a2c')});
 def('grass2',61,t=>{t.fill('#559236');t.noise(.22);for(let i=0;i<10;i++)t.px(t.r()*16,t.r()*16,'#6aa842');for(let i=0;i<4;i++)t.px(t.r()*16,t.r()*16,'#e8d84a')});
 def('cobble',62,t=>{t.fill('#6f6a60');const r=rng(62);for(let y=0;y<4;y++)for(let x=0;x<4;x++){const c=mul('#9a9488',.85+r()*.3);t.rect(x*4+(y%2)*1,y*4,3,3,c);t.px(x*4+(y%2),y*4,mul(c,1.2))}});
 def('plaza',63,t=>{blocks(t,'#c2b79a','#a29676',63,2);t.noise(.08)});
 def('plaza2',64,t=>{blocks(t,'#b6ab8e','#968a6a',64,2);t.noise(.1)});
 def('path',65,t=>{t.fill('#c8b384');t.noise(.15);for(let i=0;i<14;i++)t.px(t.r()*16,t.r()*16,'#a8945f')});
 def('dirt',66,t=>{t.fill('#6b4a2c');t.noise(.2);for(let i=0;i<8;i++)t.px(t.r()*16,t.r()*16,'#8a6238')});
 def('flower',67,t=>{t.fill('#5d9a3c');t.noise(.18);const c=['#d94a4a','#f0d24a','#e8e8f4','#c25ad9'];for(let i=0;i<9;i++){const x=(t.r()*14|0)+1,y=(t.r()*14|0)+1;t.px(x,y,c[i%4]);t.px(x+1,y,mul(c[i%4],.8))}});
 for(let f=0;f<4;f++){}
 def('water',68,t=>{waterFrame(t,0)});
 def('fount',69,t=>{blocks(t,'#cfc8b4','#a59d86',69,4);t.noise(.07)});
 def('fount_rim',70,t=>{t.fill('#dcd5c0');t.noise(.06);t.rect(0,0,16,2,'#efe8d4');t.hl(2,0,15,'#9a937e');t.rect(0,14,16,2,'#b0a98f')});
 def('sandstone',71,t=>{t.fill('#d2bf94');t.noise(.1);for(let y=3;y<16;y+=5)t.hl(y,0,15,'#b9a577')});
 /* furniture & props */
 def('wood',72,t=>woodPlanks(t,'#8b5a2b',72,false));
 def('wood_dark',73,t=>woodPlanks(t,'#5a371a',73,false));
 def('wood_light',74,t=>woodPlanks(t,'#b88a52',74,false));
 def('wood_v',75,t=>woodPlanks(t,'#7a4c24',75,true));
 def('leather',76,t=>{t.fill('#7a2a22');t.noise(.14);for(let x=0;x<16;x+=5)t.vl(x,0,15,'#5f1d17');for(let y=0;y<16;y+=5)t.hl(y,0,15,'#5f1d17')});
 def('cloth_green',77,t=>{t.fill('#2f6a45');t.noise(.14)});
 def('cloth_red',78,t=>{t.fill('#9b2335');t.noise(.14);for(let y=0;y<16;y+=2)t.hl(y,0,15,'#86202f')});
 def('cloth_blue',79,t=>{t.fill('#2c4a7a');t.noise(.14)});
 def('felt',80,t=>{t.fill('#2a6b46');t.noise(.18)});
 def('brass',81,t=>{t.fill('#c9a23a');t.noise(.1);t.rect(0,0,16,2,'#e6c75a');t.rect(0,14,16,2,'#8c6d23')});
 def('iron',82,t=>{t.fill('#33343a');t.noise(.14);t.hl(0,0,15,'#55565e')});
 def('steel',83,t=>{t.fill('#9aa0a8');t.noise(.12);t.hl(0,0,15,'#c8ced6')});
 def('glass',84,t=>{t.fill('#8fc4e6');t.noise(.05);t.hl(0,0,15,'#d8eefb');t.vl(0,0,15,'#d8eefb');for(let i=0;i<4;i++)t.px(3+i*2,3+i*2,'#ffffff')});
 def('paper',85,t=>{t.fill('#efe6cf');t.noise(.05);for(let y=3;y<14;y+=3)t.hl(y,2,13,'#8d8571')});
 def('lamp',86,t=>{t.fill('#ffe8a0');t.rect(2,2,12,12,'#fff6d0');t.rect(5,5,6,6,'#ffffff')});
 def('screen',87,t=>{t.fill('#1b2a22');t.rect(1,1,14,14,'#274a38');for(let y=3;y<14;y+=3)t.hl(y,3,3+((t.r()*9)|0)+3,'#6fe39a')});
 def('maptable',88,t=>{t.fill('#d8c9a0');t.noise(.06);t.rect(1,1,14,14,'#c4b283');t.rect(3,3,5,4,'#6f9a62');t.rect(9,5,4,6,'#6f9a62');t.rect(4,9,5,3,'#6f9a62');t.hl(8,2,14,'#4a78a8')});
 def('news',89,t=>{t.fill('#e4dcc4');t.noise(.04);t.rect(2,2,12,3,'#2b2b2b');for(let y=7;y<15;y+=2){t.hl(y,2,7,'#555');t.hl(y,9,13,'#555')}});
 def('awn_a',90,t=>{for(let x=0;x<16;x+=4){t.rect(x,0,2,16,'#b02a2a');t.rect(x+2,0,2,16,'#f0ead6')}t.noise(.05)});
 def('awn_b',91,t=>{for(let x=0;x<16;x+=4){t.rect(x,0,2,16,'#2a5a8a');t.rect(x+2,0,2,16,'#f0ead6')}t.noise(.05)});
 def('leaves',92,t=>{t.fill('#3f7d2c');t.noise(.3);for(let i=0;i<30;i++)t.px(t.r()*16,t.r()*16,'#56a03a');for(let i=0;i<20;i++)t.px(t.r()*16,t.r()*16,'#2a5a1c')});
 def('leaves2',93,t=>{t.fill('#4f8a2c');t.noise(.3);for(let i=0;i<24;i++)t.px(t.r()*16,t.r()*16,'#8cc64a');for(let i=0;i<20;i++)t.px(t.r()*16,t.r()*16,'#3a6a1e')});
 def('log',94,t=>{for(let x=0;x<16;x++){const k=.85+((x*7)%5)/20;t.vl(x,0,15,mul('#6a4425',k))}for(let i=0;i<10;i++)t.px(t.r()*16,t.r()*16,'#4a2e16')});
 def('hedge',95,t=>{t.fill('#2f6a24');t.noise(.34);for(let i=0;i<30;i++)t.px(t.r()*16,t.r()*16,'#468a30')});
 def('gold',96,t=>{t.fill(GOLD);t.rect(0,0,16,2,'#f0d676');t.rect(0,14,16,2,'#8c6d23');t.rect(0,0,2,16,'#e3c25a');t.rect(14,0,2,16,'#9c7c28');t.noise(.08)});
 def('silver',97,t=>{t.fill('#c3c9cf');t.rect(0,0,16,2,'#eef2f6');t.rect(0,14,16,2,'#7d858c');t.rect(0,0,2,16,'#dde2e7');t.rect(14,0,2,16,'#8a9299');t.noise(.08)});
 def('greenframe',98,t=>{t.fill('#2f8f58');t.rect(0,0,16,2,'#52c383');t.rect(0,14,16,2,'#1c5a37');t.rect(0,0,2,16,'#43ad70');t.rect(14,0,2,16,'#206a40');t.noise(.08)});
 def('canvas',99,t=>{t.fill('#e9dcc0');t.noise(.05)});
 /* doors, stairs, rails */
 def('door',150,t=>{t.fill('#5a3418');t.rect(2,1,5,6,'#6e4222');t.rect(9,1,5,6,'#6e4222');t.rect(2,9,5,6,'#6e4222');t.rect(9,9,5,6,'#6e4222');t.hl(1,2,13,'#8a5a32');t.hl(8,0,15,'#3e230f');t.px(7,8,GOLD);t.px(8,8,GOLD);t.noise(.06)});
 def('door_front',151,t=>{t.fill('#3e2512');t.rect(1,1,14,14,'#4e2f17');t.rect(2,2,12,7,'#7fb3d9');t.vl(8,2,8,'#3e2512');t.hl(5,2,13,'#3e2512');for(let i=0;i<4;i++)t.px(3+i*2,3+i,'#d8eefb');t.rect(2,10,12,5,'#5e3a1d');t.px(7,11,GOLD);t.px(8,11,GOLD);t.noise(.04)});
 def('doorframe',152,t=>{woodPlanks(t,'#4a2c14',152,true);t.vl(0,0,15,'#2e1a0a')});
 def('stair_top',153,t=>{t.fill('#bdb4a0');t.noise(.12);t.hl(0,0,15,'#e0d8c4');t.hl(15,0,15,'#8e8672')});
 def('stair_riser',154,t=>{t.fill('#a39a85');t.noise(.12);t.hl(0,0,15,'#c9c0aa');t.hl(15,0,15,'#6f6856')});
 def('runner',155,t=>{t.fill('#8c1f2e');t.noise(.1);t.vl(1,0,15,GOLD);t.vl(14,0,15,GOLD);t.rect(4,6,8,4,'#a8283a');t.px(8,8,GOLD)});
 def('rail',156,t=>{t.fill('#3e2512');t.rect(0,0,16,5,'#6e4222');t.hl(0,0,15,'#8a5a32');t.noise(.06)});
 def('baluster',157,t=>{t.fill('#4a2c14');t.vl(0,0,15,'#6e4222');t.noise(.06)});
 def('secret',158,t=>{t.fill('#5a3418');t.rect(1,1,14,14,'#6b4222');t.rect(2,2,12,12,'#7a4c28');t.rect(6,6,4,4,GOLD);t.rect(7,7,2,2,'#2a1c0d');t.hl(2,2,13,'#946034');t.noise(.05)});
 def('chamber_wall',159,t=>{woodPlanks(t,'#4f3219',159,true);t.noise(.08)});
 def('sign_board',160,t=>{t.fill('#1b140c');t.rect(1,1,14,14,'#2c2014');t.rect(2,2,12,12,'#1b140c');t.noise(.05)});
 def('marble_white',161,t=>marble(t,'#ece6d6','#a8a08a',161,'#9a927c'));
 def('column',162,t=>{t.fill('#e4dcc7');for(let x=1;x<16;x+=3){t.vl(x,0,15,'#c9bfa3');t.vl(x+1,0,15,'#f2ecd9')}t.noise(.04)});
 def('chandelier',163,t=>{t.fill('#2a2418');t.rect(5,5,6,6,'#ffe8a0');t.px(8,8,'#ffffff')});
 def('rugfringe',164,t=>{t.fill('#8a1f2e');t.noise(.1)});
 def('shelf_side',165,t=>{woodPlanks(t,'#5a371a',165,true)});
 def('book_row',166,t=>{t.fill('#2c1a0c');const r=rng(166);let x=0;while(x<16){const w=1+((r()*2)|0)+1;const hh=9+((r()*5)|0);const c=['#8b2c2c','#2c4a6b','#2f5a3a','#6b4a2c','#7a6a2c','#4a2c5a','#a0602c'][(r()*7)|0];t.rect(x,15-hh,w,hh,c);t.vl(x,15-hh,15,mul(c,1.2));x+=w}t.hl(15,0,15,'#6b4423')});
 def('chalk',167,t=>{t.fill('#2b3a33');t.noise(.08);t.hl(4,2,10,'#cfd8d2');t.hl(8,2,13,'#cfd8d2');t.hl(11,2,8,'#cfd8d2')});
 def('stone_dark',168,t=>{blocks(t,'#6a675e','#4a483f',168,4);t.noise(.12)});
 def('tile_white',169,t=>{t.fill('#e9e6dc');t.hl(0,0,15,'#b5b2a6');t.vl(0,0,15,'#b5b2a6');t.noise(.04)});
 def('cloud',170,t=>{t.fill('#ffffff');t.noise(.04)});
}
/* water animation: four frames cycling through the same tile */
function waterFrame(t,f){
 t.fill('#2f6fb0');
 const r=rng(68+f*7);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){const w=Math.sin((x+f*2)*0.9)+Math.cos((y-f*2)*0.8)+Math.sin((x+y+f*3)*0.5);if(w>1.2)t.px(x,y,'#6fb1e6');else if(w<-1.3)t.px(x,y,'#245a94')}
 for(let i=0;i<5;i++)t.px(r()*16,r()*16,'#d4ecfb');
}
let wf=0,wtime=0;
A.animate=function(dt){wtime+=dt;if(wtime<0.28)return false;wtime=0;wf=(wf+1)%4;
 const t=new Tile(68);waterFrame(t,wf);const id=IDX.water;cx.putImageData(new ImageData(t.d,TS,TS),(id%COLS)*TS,((id/COLS)|0)*TS);
 if(A.texture)A.texture.needsUpdate=true;return true};
build();
A.count=next;
})();
