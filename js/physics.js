/* Player physics: a vertical capsule-ish box against axis-aligned solids, with gravity, jumping, step-up and head clearance. */
(function(){
'use strict';
const W=window.World;
const Phys=window.Phys={R:.26,HT:1.8,EYE:1.62,STEP:.38,G:21,JUMP:6.7};
const {R,HT,STEP}=Phys;
/* floor height and whether a body of radius r / height h fits at (x,y) with feet at z */
function probe(x,y,z,r,h){
 r=r||R;h=h||HT;
 let fl=0;const x0=x-r,x1=x+r,y0=y-r,y1=y+r;
 const cxa=Math.floor(x0),cxb=Math.floor(x1),cya=Math.floor(y0),cyb=Math.floor(y1);
 const cand=[];
 for(let cx=cxa;cx<=cxb;cx++)for(let cy=cya;cy<=cyb;cy++){const a=W.solidsAt(cx,cy);for(let i=0;i<a.length;i++){const s=a[i];if(s.dead||s.t<=s.b+1e-6&&s.kind==='void')continue;
  if(s.x1<=x0||s.x0>=x1||s.y1<=y0||s.y0>=y1)continue;cand.push(s);if(s.t<=z+STEP+1e-3&&s.t>fl)fl=s.t}}
 const zb=Math.max(fl,z);let ok=true;
 for(let i=0;i<cand.length;i++){const s=cand[i];if(s.t>zb+1e-3&&s.b<zb+h-1e-3){ok=false;break}}
 return {ok,fl};
}
Phys.probe=probe;
/* is the point inside any solid? (for line of sight) */
Phys.inSolid=function(x,y,z,kinds){
 const a=W.solidsAt(Math.floor(x),Math.floor(y));
 for(let i=0;i<a.length;i++){const s=a[i];if(s.dead)continue;if(kinds&&!kinds[s.kind])continue;if(x>=s.x0&&x<=s.x1&&y>=s.y0&&y<=s.y1&&z>=s.b&&z<=s.t)return true}
 return false};
const LOSK={wall:1,slab:1,column:1,stair:1,tree:1,stage:0};
Phys.los=function(ax,ay,az,bx,by,bz){
 const dx=bx-ax,dy=by-ay,dz=bz-az,L=Math.hypot(dx,dy,dz),n=Math.ceil(L/.12);
 for(let i=1;i<n;i++){const t=i/n;if(Phys.inSolid(ax+dx*t,ay+dy*t,az+dz*t,LOSK))return false}
 return true};
/* NPC / generic ground check */
Phys.walkable=function(x,y,r){const p=probe(x,y,0,r||.22,1.7);return p.ok&&p.fl<.08};
/* advance player state P by dt given wish vector (vx,vy in m/s) */
Phys.step=function(P,vx,vy,dt,jump){
 // horizontal, axis separated, with sub-steps to avoid tunnelling
 const dist=Math.hypot(vx,vy)*dt;const n=Math.max(1,Math.ceil(dist/.15));
 for(let k=0;k<n;k++){
  const dx=vx*dt/n,dy=vy*dt/n;
  let r=probe(P.x+dx,P.y,P.z);if(r.ok){P.x+=dx;if(r.fl>P.z){P.stepOff+=P.z-r.fl;P.z=r.fl;if(P.vz<0)P.vz=0}}
  r=probe(P.x,P.y+dy,P.z);if(r.ok){P.y+=dy;if(r.fl>P.z){P.stepOff+=P.z-r.fl;P.z=r.fl;if(P.vz<0)P.vz=0}}
 }
 // vertical
 const f0=probe(P.x,P.y,P.z).fl;
 P.grounded=P.z<=f0+.03&&P.vz<=0;
 if(jump&&P.grounded){P.vz=Phys.JUMP;P.grounded=false}
 P.vz-=Phys.G*dt;if(P.vz<-30)P.vz=-30;
 let nz=P.z+P.vz*dt;
 if(P.vz>0){
  // head bump
  const x0=P.x-R,x1=P.x+R,y0=P.y-R,y1=P.y+R;
  for(let cx=Math.floor(x0);cx<=Math.floor(x1);cx++)for(let cy=Math.floor(y0);cy<=Math.floor(y1);cy++){const a=W.solidsAt(cx,cy);for(const s of a){if(s.dead||s.x1<=x0||s.x0>=x1||s.y1<=y0||s.y0>=y1)continue;if(s.b>=P.z+HT-.05&&s.b<nz+HT&&s.t>nz){nz=s.b-HT;P.vz=0}}}
 }else{
  const r=probe(P.x,P.y,nz);if(nz<=r.fl){nz=r.fl;P.vz=0;P.grounded=true}
 }
 P.z=nz;
};
})();
