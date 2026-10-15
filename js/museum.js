/* Presentation only. Keep the historical data, floor plan and interactions intact. */
(function(){
'use strict';
const A=window.Atlas,T=128,old=A.canvas,cv=document.createElement('canvas');
cv.width=cv.height=T*A.COLS;const x=cv.getContext('2d');
x.imageSmoothingEnabled=true;x.drawImage(old,0,0,cv.width,cv.height);
let seed=1920;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
function tile(name,paint){const id=A.idx[name];if(id===undefined)return;x.save();x.translate(id%A.COLS*T,Math.floor(id/A.COLS)*T);x.beginPath();x.rect(0,0,T,T);x.clip();paint();x.restore()}
function grain(amount){for(let i=0;i<3000;i++){x.fillStyle=random()>.5?'rgba(255,255,255,'+amount+')':'rgba(0,0,0,'+amount+')';x.fillRect(random()*T,random()*T,1,1)}}
function stone(base){x.fillStyle=base;x.fillRect(0,0,T,T);grain(.035);for(let i=0;i<7;i++){x.beginPath();let y=random()*T;x.moveTo(0,y);for(let k=0;k<=T;k+=4){y+=Math.sin(k*.08+i)*1.2+(random()-.5)*2;x.lineTo(k,y)}x.strokeStyle='rgba(94,83,67,.12)';x.lineWidth=i%3===0?1.5:.5;x.stroke()}x.strokeStyle='rgba(83,71,53,.22)';x.lineWidth=1;x.strokeRect(.5,.5,T-1,T-1)}
['marble_a','marble_white','tile_white'].forEach(n=>tile(n,()=>stone('#e4dfd1')));
tile('marble_b',()=>stone('#b8b2a5'));
['plaza','plaza2','stone','plinth','sandstone'].forEach(n=>tile(n,()=>stone('#c8bdab')));
['parq_a','parq_b','parq_dark','plank_floor','wood','wood_dark','wood_light','wood_v'].forEach(n=>tile(n,()=>{
 const dark=n.includes('dark'),vertical=n==='wood_v';x.fillStyle=dark?'#493526':'#866044';x.fillRect(0,0,T,T);if(vertical){x.translate(T,0);x.rotate(Math.PI/2)}
 for(let p=0;p<4;p++){const y=p*32;x.fillStyle=p%2?'rgba(0,0,0,.08)':'rgba(255,210,156,.06)';x.fillRect(0,y,T,32);for(let j=0;j<22;j++){x.beginPath();x.moveTo(0,y+j*1.45);x.bezierCurveTo(40,y+j*1.45-2,80,y+j*1.45+2,T,y+j*1.45);x.strokeStyle='rgba(32,18,9,'+(.035+random()*.08)+')';x.lineWidth=.5;x.stroke()}x.fillStyle='#39271d';x.fillRect(0,y,T,.8);x.fillRect((p%2)*64,y,1,32)}grain(.04);
}));
for(let g=0;g<=7;g++){
 if(g!==6&&g!==7)tile('wall_'+g,()=>{x.fillStyle=g===0?'#ded3bd':'#'+new THREE.Color(DATA.G[g].accent).lerp(new THREE.Color('#b8ab90'),.68).getHexString();x.fillRect(0,0,T,T);grain(.025);for(let k=0;k<T;k+=16){x.fillStyle='rgba(255,255,255,.035)';x.fillRect(k,0,1,T)}});
 tile('rug_'+g,()=>{x.fillStyle=g===0?'#642f34':'#'+new THREE.Color(DATA.G[g].accent).multiplyScalar(.48).getHexString();x.fillRect(0,0,T,T);grain(.09);x.strokeStyle='#ac8b59';x.lineWidth=1;for(const inset of [3,8])x.strokeRect(inset,inset,T-inset*2,T-inset*2);x.beginPath();x.moveTo(64,45);x.lineTo(83,64);x.lineTo(64,83);x.lineTo(45,64);x.closePath();x.stroke()});
}
A.canvas=cv;A.TS=T;
// Water updates must address the enlarged atlas rather than the old 16px canvas.
const animate=A.animate;
A.animate=function(dt){if(!animate(dt))return false;const id=A.idx.water,px=id%A.COLS,py=Math.floor(id/A.COLS);x.drawImage(old,px*16,py*16,16,16,px*T,py*T,T,T);if(A.texture)A.texture.needsUpdate=true;return true};
// Replace the original square interior columns at the same footprints.
Props.columns=function(g){};
const build=Engine.build;
Engine.build=function(){build();const scene=Engine._.scene;
 const brass=new THREE.MeshStandardMaterial({color:0xb39559,metalness:.72,roughness:.3});
 const limestone=new THREE.MeshStandardMaterial({color:0xe3d6bd,roughness:.72});
 const decorations=[];
 const bulb=new THREE.MeshStandardMaterial({color:0xffe4ad,emissive:0xffce85,emissiveIntensity:.65,roughness:.35});
 function add(geo,mat,px,py,pz){const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);scene.add(m);decorations.push(m);return m}
 const foliage=new THREE.MeshStandardMaterial({color:0x405f39,roughness:.9,side:THREE.DoubleSide});
 for(const [px,pz] of Props.visualPlants||[]){
  add(new THREE.CylinderGeometry(.24,.17,.43,24),brass,px,.215,pz);
  const leaves=foliage;
  for(let k=0;k<12;k++){const a=k*Math.PI*2/12;const stem=add(new THREE.CylinderGeometry(.009,.014,.85,6),leaves,px+Math.cos(a)*.1,.78,pz+Math.sin(a)*.1);stem.rotation.z=Math.cos(a)*.35;stem.rotation.x=Math.sin(a)*.35;
   const leaf=add(new THREE.SphereGeometry(1,12,8),leaves,px+Math.cos(a)*.25,1+random()*.3,pz+Math.sin(a)*.25);leaf.scale.set(.08,.34,.025);leaf.rotation.z=-Math.cos(a)*.8;leaf.rotation.x=Math.sin(a)*.8;
  }
 }
 for(let g=0;g<=7;g++){const [ox,oy]=World.ORIGIN[g];
  // Slender structural columns sit under the existing mezzanine edge.
  for(const [lx,ly] of [[10,4],[16,4],[4,10],[4,16],[10,16],[16,10]]){
   const px=ox+lx,pz=oy+ly;

   add(new THREE.CylinderGeometry(.19,.24,4.45,24),limestone,px,2.45,pz);
   for(const h of [.15,4.6])add(new THREE.CylinderGeometry(.33,.33,.25,24),limestone,px,h,pz);
   add(new THREE.CylinderGeometry(.26,.26,.07,24),brass,px,.32,pz);
   World.addSolid({x0:px-.36,x1:px+.36,y0:pz-.36,y1:pz+.36,b:0,t:4.75,kind:'column'});
  }
  const px=ox+10,pz=oy+10;
  add(new THREE.CylinderGeometry(.025,.025,1.6,12),brass,px,8.9,pz);
  const ring=add(new THREE.TorusGeometry(1.2,.035,8,48),brass,px,8.1,pz);ring.rotation.x=Math.PI/2;
  for(let k=0;k<8;k++){const a=k*Math.PI/4,xx=px+Math.cos(a)*1.2,zz=pz+Math.sin(a)*1.2;
   add(new THREE.CylinderGeometry(.11,.17,.28,16),bulb,xx,8.25,zz);
   add(new THREE.CylinderGeometry(.025,.025,.35,8),brass,xx,8,zz);
  }
  const light=new THREE.PointLight(0xffdcaa,.5,17,2);light.position.set(px,7.7,pz);scene.add(light);
 }
 // Batch stationary details by material to keep gallery draw calls low.
 const batches=new Map();
 decorations.forEach(m=>{m.updateMatrix();const geo=(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone());geo.applyMatrix4(m.matrix);let b=batches.get(m.material);if(!b){b={position:[],normal:[],uv:[]};batches.set(m.material,b)}for(const key of ['position','normal','uv']){const a=geo.getAttribute(key);if(a)for(const v of a.array)b[key].push(v)}scene.remove(m);geo.dispose()});
 batches.forEach((b,material)=>{const geo=new THREE.BufferGeometry();for(const key of ['position','normal','uv'])geo.setAttribute(key,new THREE.Float32BufferAttribute(b[key],key==='uv'?2:3));geo.computeBoundingSphere();scene.add(new THREE.Mesh(geo,material))});
};
})();
