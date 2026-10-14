/* People: smooth low-poly 1920s figures (tapered coats, skirts, round heads, period hats), walking animation and AI hooks.
   Front of every figure faces local +X. API: NPC.make(pal,{hat,gold,seed}), NPC.animate(root,t,moving,lookY) */
(function(){
'use strict';
const NPC=window.NPC={};
const PALS=[['#7a4a2b','#c98f6b','#3b3b4f'],['#2e2e2e','#e0b48a','#6b3b3b'],['#4a3a2a','#8d5d3b','#2f4a3a'],['#1f2f4a','#f0c9a0','#7a6a2a'],['#5a2a3a','#a56a45','#2a2a2a'],['#3a3a3a','#f2d2b0','#9b4a3a']];
NPC.PALS=PALS;
const HAIR=['#2a1a10','#4a2e18','#171717','#6b4a2a','#8a6a3a','#b8b0a0'];
const matC={};
const M=c=>matC[c]||(matC[c]=new THREE.MeshLambertMaterial({color:c}));
const geoC={};
const G=(k,f)=>geoC[k]||(geoC[k]=f());
function mesh(geo,col,x,y,z,sx,sy,sz){const m=new THREE.Mesh(geo,M(col));m.position.set(x||0,y||0,z||0);if(sx!==undefined)m.scale.set(sx,sy===undefined?sx:sy,sz===undefined?sx:sz);return m}
const cyl=(rt,rb,h,seg)=>G('c'+rt+','+rb+','+h+','+seg,()=>new THREE.CylinderGeometry(rt,rb,h,seg||10));
const sph=(r,w,h)=>G('s'+r+','+w+','+h,()=>new THREE.SphereGeometry(r,w||10,h||8));
const bx=(w,h,d)=>G('b'+w+','+h+','+d,()=>new THREE.BoxGeometry(w,h,d));
const shade=(hex,f)=>{const c=new THREE.Color(hex);c.multiplyScalar(f);return '#'+c.getHexString()};
const lighten=(hex,f)=>{const c=new THREE.Color(hex);c.lerp(new THREE.Color('#ffffff'),f);return '#'+c.getHexString()};
function rnd(seed){let s=(seed*2654435761)>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}

NPC.make=function(pal,opts){
 opts=opts||{};const r=rnd((opts.seed||1)+7);const [coat,skin,pants]=pal;
 const gold=!!opts.gold,clerk=opts.role==='clerk';
 const female=!gold&&!clerk&&(((opts.seed||1)%2)===0);
 const hairC=HAIR[(r()*HAIR.length)|0];
 const root=new THREE.Group();const body=new THREE.Group();root.add(body);
 const h=.94+r()*.12;root.scale.set(1,h,1);
 const skinD=shade(skin,.85);
 /* legs: pivot at the hip, swing about Z (forward = +X) */
 const mkLeg=(z)=>{const g=new THREE.Group();g.position.set(0,.8,z);
  const legCol=female?lighten(skin,.1):pants;
  g.add(mesh(cyl(.075,.055,.72,8),legCol,0,-.36,0));
  g.add(mesh(bx(.27,.09,.13),female?'#241812':'#1a120c',.05,-.75,0));
  if(female)g.add(mesh(cyl(.08,.07,.18,8),skinD,0,-.1,0,1,1,1));
  return g};
 const legL=mkLeg(-.09),legR=mkLeg(.09);
 /* torso */
 const torsoCol=female?coat:coat;
 const torso=new THREE.Group();torso.position.set(0,1.1,0);
 const chest=mesh(cyl(.17,.145,.58,10),torsoCol,0,.0,0,.72,1,1.3);torso.add(chest);
 torso.add(mesh(sph(.17,10,6),torsoCol,0,.27,0,.72,.45,1.3));
 if(female||gold||clerk){ // skirt / long coat skirt / apron
  const len=gold?.72:female?.5:.45;const top=gold?.12:female?.2:.3;
  torso.add(mesh(cyl(.145,gold?.3:female?.27:.2,len,12),gold?shade(coat,.9):female?lighten(coat,.05):'#e8e2d2',0,-.28-len/2+.1,0,.8,1,1.15));
 }
 if(!female&&!gold&&!clerk){ // suit: shirt front + tie + jacket hem
  torso.add(mesh(bx(.02,.3,.1),'#ece6d6',.115,.1,0));torso.add(mesh(bx(.022,.24,.035),opts.tie||['#8c2f39','#2f4a6b','#1f5a3a','#6b4a1a'][(r()*4)|0],.125,.07,0));
  torso.add(mesh(cyl(.162,.168,.1,10),shade(coat,.92),0,-.24,0,.72,1,1.3));
 }
 if(gold){torso.add(mesh(bx(.02,.62,.05),'#d4af37',.115,0,-.09,1,1,1));for(let k=0;k<4;k++)torso.add(mesh(sph(.018,6,4),'#d4af37',.122,.18-k*.12,.05));torso.add(mesh(bx(.03,.08,.14),'#d4af37',.12,.2,.13))}
 if(clerk){torso.add(mesh(bx(.02,.46,.3),'#efe9d6',.125,-.1,0));torso.add(mesh(bx(.06,.03,.5),'#6b4a2a',0,.28,0,1,1,1))}
 /* neck + head */
 torso.add(mesh(cyl(.045,.05,.1,8),skin,0,.35,0));
 const head=new THREE.Group();head.position.set(0,.5,0);
 head.add(mesh(sph(.115,12,10),skin,0,0,0,.95,1.12,.92));
 head.add(mesh(sph(.022,6,5),skinD,.115,-.01,0)); // nose
 head.add(mesh(sph(.017,6,5),'#15110d',.1,.02,-.04),mesh(sph(.017,6,5),'#15110d',.1,.02,.04));
 head.add(mesh(bx(.01,.012,.07),'#7a3a30',.105,-.06,0)); // mouth
 if(opts.mustache||(!female&&r()<.3))head.add(mesh(bx(.02,.018,.08),shade(hairC,.9),.108,-.035,0));
 // hair
 if(female){head.add(mesh(sph(.125,10,8),hairC,-.02,.015,0,.98,1.08,1.04));head.add(mesh(bx(.1,.12,.27),hairC,-.07,-.08,0)); // bob
 }else head.add(mesh(sph(.12,10,8),hairC,-.025,.035,0,.95,.98,.98));
 // hats
 const hatC=opts.hat;
 if(gold){ // station cap
  head.add(mesh(cyl(.125,.13,.075,12),'#1f2f4a',0,.1,0,1,1,1.0));head.add(mesh(bx(.1,.015,.2),'#15110d',.13,.065,0));head.add(mesh(bx(.012,.03,.06),'#d4af37',.125,.105,0));
 }else if(clerk){ // bowler
  head.add(mesh(sph(.125,10,8),hatC||'#222',0,.07,0,1,.8,1));head.add(mesh(cyl(.17,.17,.012,14),hatC||'#222',0,.065,0));
 }else if(hatC){
  if(female){head.add(mesh(sph(.14,12,8),hatC,-.005,.045,0,1,.95,1.02));head.add(mesh(cyl(.145,.15,.02,12),shade(hatC,.8),0,.0,0));head.add(mesh(sph(.025,6,5),lighten(hatC,.5),.0,.04,.14)); // cloche + brooch
  }else if(r()<.4){head.add(mesh(sph(.12,10,6),hatC,0,.07,0,1.05,.5,1.05));head.add(mesh(bx(.1,.012,.19),shade(hatC,.8),.12,.04,0)); // flat cap
  }else{head.add(mesh(cyl(.2,.205,.014,16),hatC,0,.06,0));head.add(mesh(cyl(.108,.125,.12,12),hatC,0,.12,0));head.add(mesh(cyl(.11,.126,.028,12),shade(hatC,.55),0,.08,0));head.add(mesh(cyl(.07,.1,.015,12),shade(hatC,.8),0,.18,0)); // fedora
  }
 }
 torso.add(head);
 /* arms pivot at the shoulder */
 const mkArm=(z)=>{const g=new THREE.Group();g.position.set(0,1.37,z*1.0);
  g.add(mesh(cyl(.052,.042,.58,8),coat,0,-.29,0));g.add(mesh(sph(.058,8,6),coat,0,0,0));
  g.add(mesh(sph(.048,8,6),skin,0,-.62,0));if(clerk)g.add(mesh(bx(.09,.025,.09),'#6b4a2a',0,-.2,0));return g};
 const armL=mkArm(-.235),armR=mkArm(.235);
 // handbag / newspaper accents
 if(female&&r()<.6){armR.add(mesh(bx(.1,.12,.05),'#4a2a1a',.04,-.62,.04))}
 else if(!female&&!gold&&!clerk&&r()<.3){armL.add(mesh(bx(.16,.02,.12),'#e8e0c8',.06,-.6,0))}
 body.add(legL,legR,torso,armL,armR);
 root.userData={legL,legR,armL,armR,head,body,torso};
 return root;
};
NPC.animate=function(root,t,moving,lookY){
 const u=root.userData;const s=moving?Math.sin(t*7)*.55:0;
 u.legL.rotation.z=s;u.legR.rotation.z=-s;u.armL.rotation.z=-s*.8;u.armR.rotation.z=s*.8;
 if(!moving){u.armL.rotation.z=.05;u.armR.rotation.z=-.05}
 u.body.position.y=moving?Math.abs(Math.sin(t*7))*.03:Math.sin(t*1.3)*.004;
 u.torso.rotation.x=moving?Math.sin(t*7)*.02:0;
 if(lookY!==undefined)u.head.rotation.y=lookY;
};
})();
