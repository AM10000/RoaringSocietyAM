/* Blocky pixel people (Minecraft-style): models, walking animation and simple wandering AI. */
(function(){
'use strict';
const W=window.World,Phys=window.Phys;
const NPC=window.NPC={};
const PALS=[['#7a4a2b','#c98f6b','#3b3b4f'],['#2e2e2e','#e0b48a','#6b3b3b'],['#4a3a2a','#8d5d3b','#2f4a3a'],['#1f2f4a','#f0c9a0','#7a6a2a'],['#5a2a3a','#a56a45','#2a2a2a'],['#3a3a3a','#f2d2b0','#9b4a3a']];
NPC.PALS=PALS;
const texCache={};
function px(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;fn(x);const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t}
function noise(x,w,h,col,amt,seed){let s=seed;const r=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};x.fillStyle=col;x.fillRect(0,0,w,h);for(let i=0;i<w*h*.5;i++){x.fillStyle=`rgba(0,0,0,${r()*amt})`;x.fillRect(r()*w|0,r()*h|0,1,1)}}
function mats(pal,hatCol,seed,gold){
 const key=pal.join()+hatCol+gold;if(texCache[key])return texCache[key];
 const [coat,skin,pants]=pal;
 const M=t=>new THREE.MeshLambertMaterial({map:t});
 const face=px(8,8,x=>{x.fillStyle=skin;x.fillRect(0,0,8,8);x.fillStyle=hatCol||'#3a2a1a';x.fillRect(0,0,8,2);x.fillStyle='#fff';x.fillRect(1,4,2,1);x.fillRect(5,4,2,1);x.fillStyle='#222';x.fillRect(2,4,1,1);x.fillRect(5,4,1,1);x.fillStyle='#8c5a4a';x.fillRect(3,6,2,1)});
 const side=px(8,8,x=>{x.fillStyle=skin;x.fillRect(0,0,8,8);x.fillStyle=hatCol||'#3a2a1a';x.fillRect(0,0,8,3)});
 const back=px(8,8,x=>{x.fillStyle=hatCol||'#3a2a1a';x.fillRect(0,0,8,8)});
 const top=px(8,8,x=>{x.fillStyle=hatCol||'#3a2a1a';x.fillRect(0,0,8,8)});
 const skinT=px(4,4,x=>noise(x,4,4,skin,.15,seed+1));
 const coatT=px(8,8,x=>{noise(x,8,8,coat,.2,seed+2);if(gold){x.fillStyle='#d4af37';for(let i=0;i<8;i++)x.fillRect(i,i,1,1)}});
 const pantT=px(8,8,x=>noise(x,8,8,pants,.2,seed+3));
 const shoe=px(4,4,x=>{x.fillStyle='#17110c';x.fillRect(0,0,4,4)});
 const out={head:[M(face),M(back),M(top),M(skinT),M(side),M(side)],hat:M(top),coat:M(coatT),pants:M(pantT),skin:M(skinT),shoe:M(shoe)};
 // head face order for BoxGeometry: +x,-x,+y,-y,+z,-z ; front is +x
 out.head=[M(face),M(back),M(top),M(skinT),M(side),M(side)];
 texCache[key]=out;return out;
}
function part(w,h,d,mat,pivotTop){const g=new THREE.BoxGeometry(w,h,d);if(pivotTop)g.translate(0,-h/2,0);return new THREE.Mesh(g,mat)}
/* build a person; front faces local +X */
NPC.make=function(pal,opts){
 opts=opts||{};const m=mats(pal,opts.hat||null,opts.seed||1,opts.gold);
 const root=new THREE.Group();const body=new THREE.Group();root.add(body);
 const legL=part(.2,.72,.2,m.pants,true),legR=part(.2,.72,.2,m.pants,true);legL.position.set(0,.72,-.12);legR.position.set(0,.72,.12);
 const shoeL=part(.26,.1,.22,m.shoe),shoeR=part(.26,.1,.22,m.shoe);shoeL.position.set(.03,-.67,0);shoeR.position.set(.03,-.67,0);legL.add(shoeL);legR.add(shoeR);
 const torso=part(.26,.7,.5,m.coat);torso.position.set(0,1.07,0);
 const armL=part(.16,.64,.16,m.coat,true),armR=part(.16,.64,.16,m.coat,true);armL.position.set(0,1.4,-.33);armR.position.set(0,1.4,.33);
 const handL=part(.14,.12,.14,m.skin),handR=part(.14,.12,.14,m.skin);handL.position.y=-.6;handR.position.y=-.6;armL.add(handL);armR.add(handR);
 const head=part(.44,.44,.44,m.head);head.position.set(0,1.64,0);
 const hat=part(.5,.07,.5,m.hat);hat.position.set(0,1.88,0);const crown=part(.4,.14,.4,m.hat);crown.position.set(0,1.97,0);
 body.add(legL,legR,torso,armL,armR,head);if(opts.hat!==null){body.add(hat,crown)}
 root.userData={legL,legR,armL,armR,head,body};
 return root;
};
NPC.animate=function(root,t,moving,lookY){
 const u=root.userData;const s=moving?Math.sin(t*8)*.7:0;
 u.legL.rotation.z=s;u.legR.rotation.z=-s;u.armL.rotation.z=-s*.8;u.armR.rotation.z=s*.8;
 if(!moving){u.armL.rotation.z=.04;u.armR.rotation.z=-.04}
 u.body.position.y=moving?Math.abs(Math.sin(t*8))*.03:0;
 if(lookY!==undefined)u.head.rotation.y=lookY;
};
})();
