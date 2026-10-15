/* Speech requests are captured so entry behavior is deterministic without an audio device. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const save={points:42,visited:['z0'],settings:{vol:.6,captions:true}};for(const g of [0,1,2,3,4,5,6,7,9])save['intro'+g]=true;
  localStorage.setItem('roaring-society-v1',JSON.stringify(save));window.__spoken=[];
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},resume(){},speak(u){window.__spoken.push({text:u.text,volume:u.volume})}}});
 });
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:8765')+'/#play-now');await page.waitForFunction(()=>window.Game?.booted);
 const result=await page.evaluate(()=>{
  Engine.touch=true;Game.begin();Engine.paused=true;
  const welcome=__spoken.slice();Engine.advance(.02);const afterFirstFrame=__spoken.length;
  const destinations=[[28.5,54.5,0],[29.5,35.2,9],[15.5,49.5,1],[9.5,35.5,2],[7.5,14.5,3],[24.5,9.5,4],[44.5,9.5,5],[49.5,24.5,6],[49.5,44.5,7]];
  const teleports=destinations.map(([x,y,g])=>{__spoken.length=0;Engine.teleport(x,y);Engine.advance(.02);return {g,count:__spoken.length,correct:__spoken[0]?.text.includes(Game.INTRO[g])}});
  const before=RS.S.points;__spoken.length=0;Engine.teleport(49.5,44.5);const sameRoom={count:__spoken.length,points:RS.S.points-before};
  let crossing=null;
  for(let g=1;g<=7&&!crossing;g++){const [ox,oy]=World.ORIGIN[g];for(let ly=6;ly<=15&&!crossing;ly+=.5){const ax=ox+9.4,bx=ox+10.6,y=oy+ly;if(World.roomAt(g,ax,y)!==World.roomAt(g,bx,y)&&Phys.clearSegment(ax,y,bx+.5,y,Phys.R))crossing={g,ax,bx,y}}}
  if(!crossing)throw Error('No clear room boundary found for walking test');
  Engine.teleport(crossing.ax,crossing.y,0);__spoken.length=0;Engine.keys.w=true;for(let i=0;i<12;i++)Engine.advance(.05);Engine.keys.w=false;
  const walking={count:__spoken.length,text:__spoken[0]?.text,room:DATA.G[crossing.g].rooms[Engine.zoneRoom]};
  Engine.notifyZone();Engine.notifyZone();walking.afterRepeatedChecks=__spoken.length;
  __spoken.length=0;Engine.player.a=Math.PI;Engine.keys.w=true;for(let i=0;i<16;i++)Engine.advance(.05);Engine.keys.w=false;const returning=__spoken.length;
  __spoken.length=0;RS.S.settings.vol=0;Engine.teleport(28.5,54.5);const muted={count:__spoken.length,captions:!document.querySelector('#captions').hidden,text:document.querySelector('#captions').textContent};
  RS.S.settings.vol=.6;__spoken.length=0;Engine.teleport(28.5,54.5);const unmuted=__spoken.length;
  return {welcome,afterFirstFrame,teleports,sameRoom,walking,returning,muted,unmuted};
 });
 assert.equal(result.welcome.length,1);assert.match(result.welcome[0].text,/Welcome to The Roaring Society/);assert.equal(result.afterFirstFrame,1);
 for(const t of result.teleports){assert.equal(t.count,1);assert.ok(t.correct)}assert.equal(result.sameRoom.count,1);assert.equal(result.sameRoom.points,0);
 assert.equal(result.walking.count,1);assert.ok(result.walking.text.includes(result.walking.room));assert.equal(result.walking.afterRepeatedChecks,1);assert.equal(result.returning,1);
 assert.equal(result.muted.count,0);assert.ok(result.muted.captions);assert.match(result.muted.text,/Welcome/);assert.equal(result.unmuted,1);assert.deepEqual(errors,[]);
 console.log(JSON.stringify(result,null,2));console.log('Room-entry narration checks passed.');await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
