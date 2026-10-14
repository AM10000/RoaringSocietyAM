/* Landing page: renders data-driven sections and lazy-loads the game */
(function(){
'use strict';
const RS=window.RS,D=RS.D,el=RS.el,$=RS.$;
// WWI cards
const wwi=$('#wwi');D.WWI.forEach((w,i)=>wwi.append(el('li',{class:'card'},[el('span',{class:'num pix'},[String(i+1)]),el('h3',{},[w[0]]),el('p',{},[w[1]])])));
// Guiding questions
D.GQ[0].prevented.forEach(t=>$('#gq-prev').append(el('li',{html:t})));D.GQ[0].promoted.forEach(t=>$('#gq-prom').append(el('li',{html:t})));$('#gq2').textContent=D.GQ[1].body;
// Bibliography
D.BIB.forEach(b=>$(b.kind==='primary'?'#bib-pri':'#bib-sec').append(el('li',{html:b.mla})));
// wings table
const wings=$('#wings');
[[0,'South','Grand hall, ticket desk, Visitor Directory kiosk, tutorial'],[1,'Southwest','Hall of Departures with the Migration Map'],[2,'West','Red Scare Hall and Civil-Liberties Hearing Room'],[3,'Northwest','Source Analysis Hall, quota rooms, labor room, Trial Room'],[4,'North','Supreme Court Courtroom'],[5,'Northeast','Temperance Hall, Policy Council Chamber, The Blind Pig speakeasy'],[6,'East','Reading Room, Radio Room, Evidence Journal terminal, Microfilm Room'],[7,'Southeast','Hall of Evidence, Guiding Questions Atrium, Curator’s Vault']].forEach(r=>{
 const g=D.G[r[0]];wings.append(el('tr',{},[el('th',{scope:'row'},[g.n+(r[0]>0&&r[0]<6?': '+g.t:r[0]===6?'':'')]),el('td',{},[r[1]]),el('td',{},[r[2]]),el('td',{},[el('span',{class:'dot',style:'background:'+g.accent}),' '+g.accent])]))});
// artwork cards
function card(a){
 const b=el('button',{class:'acard '+a.frame,onclick:()=>RS.openArtwork(a.id),'aria-label':'Open artwork: '+RS.strip(a.title)});
 const fig=el('div',{class:'afig'});
 if(a.f&&a.f[0]){const im=new Image();im.loading='lazy';im.decoding='async';im.alt='';im.width=360;im.height=240;im.src=RS.fileUrl(a.f[0],400);im.onerror=()=>{im.remove();fig.classList.add('ph');fig.textContent=a.type}; fig.append(im)}
 else{fig.classList.add('ph');fig.textContent=({chart:'📊 chart',document:'📜 document',evidence:'📋 evidence',diagram:'🔀 diagram',newspaper:'📰 clipping',article:'📖 article',cartoon:'🗜 cartoon',photo:'📷 photo',poster:'📜 poster',ad:'📜 ad',map:'🗺 map',portrait:'👤 portrait'})[a.type]||a.type}
 b.append(fig,el('span',{class:'ai pix'},[a.id.toUpperCase().replace('-','‑')]),el('strong',{html:a.title}),el('span',{class:'am'},[a.kind==='primary'?'Primary':'Secondary',' · ',a.date]));
 return b;
}
RS.$$('.art-grid').forEach(g=>{const n=+g.dataset.gal;D.A.filter(a=>a.g===n).forEach(a=>g.append(card(a)));});
// hero collage
const hero=$('#hero-art');
['Prohibition agents destroying barrels of alcohol (United States, prohibition era).jpg','W. J. Bryan at Scopes Trial, 1925 photo by United News Pictures.jpg','Seattle General Strike 1919 Participants Leaving Shipyard.jpg','A. Mitchell Palmer cph.3a02984.jpg'].forEach((f,i)=>{const im=new Image();im.alt='';im.decoding='async';im.fetchPriority=i<2?'high':'low';im.src=RS.fileUrl(f,360);im.onerror=()=>im.remove();hero.append(im)});
// nav toggle
const nt=$('.nav-toggle'),nav=$('#nav');nt.addEventListener('click',()=>{const o=nav.classList.toggle('open');nt.setAttribute('aria-expanded',o)});
nav.addEventListener('click',e=>{if(e.target.tagName==='A')nav.classList.remove('open')});
// lazy-load game scripts
let loading=null;
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.body.append(s)})}
function loadGame(){if(loading)return loading;
 loading=loadScript('js/engine.js').then(()=>loadScript('js/sims.js')).then(()=>loadScript('js/game.js'));
 return loading}
RS.$$('[data-play]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;const t=b.textContent;b.textContent='Loading…';try{await loadGame();window.Game.start()}catch(e){console.error(e);alert('Could not start the game: '+e.message)}b.disabled=false;b.textContent=t}));
// preload game scripts when idle (does not block page)
(window.requestIdleCallback?window.requestIdleCallback(()=>{loadGame().catch(()=>{})},{timeout:5000}):setTimeout(()=>{loadGame().catch(()=>{})},4000));
if(location.hash==='#play-now')setTimeout(()=>RS.$('[data-play]').click(),300);
})();
