import { createTeams, COUNTRIES, teamById, overall, teamRating, playerValue, teamMarketValue, wage, activePlayers, badgeSVG } from './data.js';
import { createCareer, advance, nextFixture, nextSeason, buyPlayer, sellPlayer, renewPlayer, upgrade, promoteYouth, transferPrice, changeClub, unlockAchievements } from './career.js';
import { listSlots, loadSlot, saveSlot, deleteSlot, exportSave, importSave, getSettings, setSettings } from './storage.js';
import { submitOffer, advanceDay, signOffer, counterOffer } from './negotiations.js';
import { MatchSimulation, matchSeed, STATE_LABELS } from './match.js';
import { Renderer } from './render.js';
import { Audio } from './audio.js';
import { escape as e, money, clone, download, uid } from './utils.js';
import * as UI from './ui.js';

const root=document.getElementById('app'),modalRoot=document.getElementById('modal-root');
let world=null,view='landing',slot=1,slots=[],saveStatus='Guardado',pendingMatch=null,game=null,renderer=null,frameId=0,matchContext=null,busy=false,saveInFlight=false,lastCheckpoint=0;
let setup={country:'es',division:1,teamId:'es-2',manager:'Biel',difficulty:'club',slot:1,mode:'career',opponent:'es-1'};
const previewTeams=createTeams(42).teams;
let filters={page:0,sort:'rating',recommended:false},competition=null,compTab='table',calendarAll=false,calendarEvent=null,settings=getSettings(),modalStack=[],lastFocus=null,saveTimer=null,searchTimer=null;
const audio=new Audio(settings);

function toast(text,error=false){const n=document.createElement('div');n.className=`toast ${error?'error':''}`;n.textContent=text;document.getElementById('toasts').append(n);setTimeout(()=>n.remove(),error?9000:4000);}
function status(text){saveStatus=text;const el=document.getElementById('save-state');if(el)el.textContent=text;}
function render(){
  if(view==='match')return;
  let content='';
  if(view==='landing'&&!world){root.innerHTML=UI.landing(slots);return;}
  if(world) {
    if(view==='landing')view='home';
    if(view==='home'){
      content=UI.dashboard(world,!!pendingMatch);
      if(!pendingMatch&&!world.seasonComplete&&(world.weekDay??0)<6)content=content.replace('SIMULAR PARTIDO',`SIMULAR SEMANA · DÍA ${(world.weekDay??0)+1}/7`);
    }
    if(view==='squad')content=UI.squad(world);
    if(view==='market')content=UI.market(world,filters);
    if(view==='competitions')content=UI.competitionView(world,competition,compTab);
    if(view==='calendar')content=UI.calendar(world,calendarAll,calendarEvent);
    if(view==='club')content=UI.clubView(world);
    if(view==='honours')content=UI.honours(world);
  }
  if(view==='saves')content=UI.savesView(slots,world,slot);
  if(view==='settings')content=UI.settingsView(settings,world);
  root.innerHTML=world?UI.shell(world,view,content,saveStatus,slot):UI.bareShell(content);
  if(world){
    const top=root.querySelector('.topbar-right');
    const unread=(world.offers??[]).some(o=>o.unread);
    top?.insertAdjacentHTML('afterbegin',UI.button(`${UI.icon('mail')}${unread?'<i class="mail-dot"></i>':''}`,'inbox','icon-button mail-button','aria-label="Bandeja de fichajes" title="Bandeja de fichajes"'));
  }
}
function navigate(next){if(game)return;view=next;if(!world&&!['landing','saves','settings'].includes(view))view='landing';render();window.scrollTo({top:0});}

function renderModal(){
  const m=modalStack.at(-1);if(!m){modalRoot.innerHTML='';document.body.classList.remove('modal-open');lastFocus?.focus?.();return;}
  document.body.classList.add('modal-open');modalRoot.innerHTML=`<div class="modal-overlay" data-backdrop="1"><section class="modal ${m.wide?'wide':''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div class="eyebrow" id="modal-title">${e(m.title)}</div>${m.closable!==false?UI.button('×','close-modal','close-btn','aria-label="Cerrar"'):''}</header><div class="modal-body">${m.content}</div></section></div>`;
  requestAnimationFrame(()=>modalRoot.querySelector('button, input, select')?.focus({preventScroll:true}));
}
function modal(title,content,options={}){if(!modalStack.length)lastFocus=document.activeElement;modalStack.push({title,content,...options});renderModal();}
function closeModal(all=false){if(modalStack.at(-1)?.closable===false&&!all)return;if(all)modalStack=[];else modalStack.pop();renderModal();}
function confirm(title,text,label,action){modal(title,`<h2>${e(title)}</h2><p class="confirm-copy">${text}</p><div class="modal-actions">${UI.button('Cancelar','close-modal','btn secondary')}${UI.button(label,action,'btn primary')}</div>`);}
async function refreshSlots(){slots=await listSlots();}
function checkpoint(){if(game&&!matchContext?.friendly){pendingMatch=game.state==='FullTime'?null:{fixtureId:game.fixtureId,snapshot:game.serialize()};}}
async function save({notify=false,target=slot}={}) {
  if(!world)return;
  checkpoint();status('Guardando…');saveInFlight=true;
  try{const result=await saveSlot(target,world,pendingMatch);slot=target;status('✓ Guardado en este PC');await refreshSlots();if(result.backend==='localStorage-single')toast('Guardado actualizado. No hay espacio para una copia anterior: exporta una copia.',true);else if(notify)toast(`Carrera guardada en la ranura ${slot}.`);}
  catch(error){status('⚠ No se ha guardado');toast(error.message,true);throw error;}
  finally{saveInFlight=false;}
}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{save().catch(()=>{});},450);}
async function load(id,backup=false){
  if(busy)return;
  const payload=await loadSlot(id,{backup});if(!payload){toast('Esta ranura está vacía.');return;}
  stopMatch();world=payload.world;pendingMatch=payload.match;slot=id;view='home';competition=null;calendarEvent=null;status(payload.recovered?'Copia anterior recuperada':'✓ Guardado en este PC');closeModal(true);if(payload.economyMigrated)await save();render();if(payload.recovered)toast('Se ha recuperado la copia anterior de la carrera.');if(payload.economyMigrated)toast('Presupuestos actualizados a la nueva economía del mercado.');if(pendingMatch)toast('Hay una simulación en curso. Pulsa Reanudar simulación para continuar.');
}
function findPlayer(id,w=world){const team=w?.teams.find(t=>t.roster.some(p=>p.id===id));return {p:team?.roster.find(p=>p.id===id)??w?.freeAgents.find(p=>p.id===id),team};}
function showPlayer(id){const w=matchContext?.friendly?matchContext.world:world;const {p,team}=findPlayer(id,w);if(p){let html=UI.playerCard(w,p,team);if(game)html=html.replace(/<div class="modal-actions">[\s\S]*?<\/div><\/div>$/,'</div>');modal('INFORME DEL JUGADOR',html,{wide:true});}}
function updateSetupModal(){const top=modalStack.at(-1);if(top?.title==='NUEVO PROYECTO'){top.content=UI.setupView(previewTeams,slots,setup);renderModal();}}
function newProject(id=null){if(id)setup.slot=Number(id);else setup.slot=slots.find(s=>!s.exists)?.id??1;modal('NUEVO PROYECTO',UI.setupView(previewTeams,slots,setup),{wide:true});}
async function startCareer(force=false){
  if(busy)return;
  if(setup.mode==='friendly') {
    if(setup.teamId===setup.opponent)throw new Error('Elige dos clubes diferentes.');
    const exhibition=createCareer({teamId:setup.teamId,manager:setup.manager,difficulty:setup.difficulty,seed:Date.now()});
    const f={id:`friendly-${Date.now()}`,home:setup.teamId,away:setup.opponent,competition:'friendly',score:null,stage:'friendly'};closeModal(true);beginMatch(exhibition,f,true);return;
  }
  const occupied=slots.find(s=>s.id===Number(setup.slot))?.exists;
  if(occupied&&!force){confirm('Esta ranura ya tiene una carrera',`La nueva carrera se guardará en la ranura ${setup.slot}. La carrera actual de esa ranura quedará como copia anterior hasta el siguiente guardado. Exporta antes cualquier carrera que quieras conservar.`, 'Crear y reemplazar','start-career-confirmed');return;}
  busy=true;
  try{
    world=createCareer({teamId:setup.teamId,manager:setup.manager,difficulty:setup.difficulty,seed:Date.now(),mode:setup.mode});slot=Number(setup.slot);pendingMatch=null;competition=null;compTab='table';view='home';closeModal(true);render();await save();toast('Tu historia empieza aquí. Prepara la plantilla y abre la retransmisión.');
  }finally{busy=false;}
}

function matchHTML(w,f,friendly){
  const h=teamById(w,f.home),a=teamById(w,f.away),comp=w.competitions.find(c=>c.id===f.competition);
  return `<div class="match-app"><header class="match-topbar">${UI.logo()}<div><span class="eyebrow">${e(comp?.name??'AMISTOSO DE EXHIBICIÓN')}</span><small>SIMULACIÓN ANIMADA · ${UI.seasonLabel(w)}</small></div><div class="match-top-actions">${UI.button('Pausar','pause','btn compact secondary','id="pause-button"')}${UI.button('⛶ Pantalla completa','fullscreen','btn compact secondary')}${UI.button(friendly?'Salir':'Guardar y salir','exit-match','btn compact')}</div></header><div class="match-scoreboard"><div class="score-team">${badgeSVG(h,43)}<span>${e(h.name)}<small id="home-tactic">${h.formation}</small></span></div><div class="score-center"><div><b id="home-score">0</b><span>–</span><b id="away-score">0</b></div><span id="match-clock">00:00</span></div><div class="score-team away"><span>${e(a.name)}<small id="away-tactic">${a.formation}</small></span>${badgeSVG(a,43)}</div></div><div class="match-layout"><section class="broadcast"><div class="broadcast-label"><span class="live-dot"></span> SEÑAL DEL ESTADIO <span id="match-state">SAQUE DE CENTRO</span></div><div class="canvas-wrap"><canvas id="match-canvas" aria-label="Retransmisión automática del partido de fútbol"></canvas><div class="match-overlay" id="match-overlay"></div></div><div class="broadcast-controls"><div class="speed-control"><span>VELOCIDAD</span>${[1,2,4,8].map(v=>UI.button(`${v}×`,`speed-${v}`,`speed-btn ${v===1?'active':''}`)).join('')}</div><span class="broadcast-hint">TÚ DIRIGES. EL FÚTBOL SUCEDE.</span>${UI.button('Guía de retransmisión','match-help','text-btn')}</div></section><aside class="match-sidebar"><div class="match-analysis"><div class="eyebrow">LA LECTURA DEL PARTIDO</div><h2>Desde el banquillo</h2><p id="live-comment">Los equipos saltan al césped. Todo está listo.</p><div class="live-stat"><b id="home-shots">0</b><span>TIROS</span><b id="away-shots">0</b></div><div class="live-stat"><b id="home-possession">50%</b><span>POSESIÓN</span><b id="away-possession">50%</b></div><div class="possession-bar"><i id="possession-bar" style="width:50%"></i></div><div id="penalty-live"></div></div><div class="match-feed"><div class="eyebrow">EL PARTIDO, MINUTO A MINUTO</div><div id="live-feed"><p class="muted">La historia está por escribirse.</p></div></div><div class="match-coaching"><span>45' / LA PIZARRA</span><p>Podrás ajustar la formación y cambiar titulares en el descanso. Tus decisiones influyen en la segunda parte.</p></div></aside></div><footer class="match-footer"><span><kbd>Espacio</kbd> Pausa <kbd>1–4</kbd> Velocidad <kbd>F</kbd> Pantalla completa</span><span>${friendly?'AMISTOSO · NO MODIFICA TU CARRERA':'AUTOGUARDADO DURANTE EL PARTIDO'}</span></footer></div>`;
}
function beginMatch(w,f,friendly=false){
  if(game||busy)return;closeModal(true);clearTimeout(saveTimer);
  const snapshot=!friendly&&pendingMatch?.fixtureId===f.id?pendingMatch.snapshot:null;
  view='match';matchContext={world:w,fixture:f,friendly,previous:world?'home':'landing'};root.innerHTML=matchHTML(w,f,friendly);
  game=new MatchSimulation({home:teamById(w,f.home),away:teamById(w,f.away),fixtureId:f.id,userSide:f.home===w.userTeam?0:1,knockout:f.stage==='knockout',difficulty:w.difficulty,duration:settings.duration,seed:matchSeed(w,f.id),snapshot,onEvent:ev=>{
    audio.play(ev.type);if(ev.type==='goal')renderer?.goalParticles(ev.side);if(ev.type==='halftime')openHalfTime();
  },onEnd:result=>finishMatch(result)});
  renderer=new Renderer(document.getElementById('match-canvas'),settings);lastCheckpoint=performance.now();audio.unlock().then(()=>{audio.stopMusic();audio.startCrowd();});
  let last=performance.now(),lastHUD=0;
  const frame=now=>{
    if(!game||view!=='match')return;
    const dt=Math.min(.05,(now-last)/1000);last=now;
    game.update(dt);if(!game||view!=='match')return;renderer.draw(game,dt);
    if(now-lastHUD>120){updateHUD();lastHUD=now;}
    if(!friendly&&now-lastCheckpoint>10000&&!saveInFlight){lastCheckpoint=now;save().catch(()=>{});}
    frameId=requestAnimationFrame(frame);
  };
  frameId=requestAnimationFrame(frame);updateHUD();
  if(snapshot?.state==='HalfTime')openHalfTime();
  if(snapshot?.state==='FullTime')queueMicrotask(()=>game&&finishMatch(game.result()));
}
function updateHUD(){
  if(!game)return;
  const set=(id,text)=>{const el=document.getElementById(id);if(el&&el.textContent!==String(text))el.textContent=text;};
  const minute=game.half===1?Math.floor(game.clock/60):45+Math.floor(Math.max(0,game.clock-2700)/60);
  const matchEvents=[...(game.firstHalf?.events??[]),...(game.secondHalf?.events??[])].filter(ev=>ev.minute<=minute&&['goal','save','wide','post'].includes(ev.type));
  const shots=[matchEvents.filter(ev=>ev.side===0).length,matchEvents.filter(ev=>ev.side===1).length];
  set('home-score',game.score[0]);set('away-score',game.score[1]);set('match-clock',`${String(Math.floor(game.clock/60)).padStart(2,'0')}:${String(Math.floor(game.clock%60)).padStart(2,'0')}`);set('match-state',STATE_LABELS[game.state]?.toUpperCase());set('home-shots',shots[0]);set('away-shots',shots[1]);
  const part=game.half===1?game.firstHalf:game.secondHalf;const possession=Math.round(50+((part?.stats.possession[0]??50)-50)*Math.min(1,((game.clock-(game.half-1)*2700)/1000)));
  set('home-possession',`${possession}%`);set('away-possession',`${100-possession}%`);document.getElementById('possession-bar').style.width=`${possession}%`;
  set('pause-button',game.paused?'Continuar':'Pausar');
  const event=game.visibleEvents[0];if(event)set('live-comment',`${event.minute}' · ${event.name}. ${event.type==='goal'?`${event.finishLabel??'Gran definición'} y el balón termina en la red.`:({save:'El portero evita el gol.',post:'¡La madera rechaza el disparo!',wide:'La ocasión se pierde por poco.',yellow:'El árbitro muestra la amarilla.',red:'Expulsión. El equipo se queda con uno menos.',injury:'El jugador necesita atención médica.'})[event.type]??''}`);
  const feed=document.getElementById('live-feed'),key=game.visibleEvents.length;
  if(feed.dataset.count!==String(key)){feed.dataset.count=key;feed.innerHTML=game.visibleEvents.slice(0,10).map(ev=>`<div class="feed-event ${ev.type}"><b>${ev.minute}'</b><span>${({goal:'⚽',yellow:'▰',red:'▰',save:'◎',post:'◈',wide:'↗',injury:'✚'})[ev.type]??'·'}</span><div><strong>${e(ev.name)}</strong><small>${ev.type==='goal'?e(ev.finishLabel??'GOL'):({yellow:'AMARILLA',red:'ROJA',save:'PARADA',post:'AL PALO',wide:'FUERA',injury:'LESIÓN'})[ev.type]}</small></div></div>`).join('')||'<p class="muted">La historia está por escribirse.</p>';}
  if(game.state==='Shootout')set('penalty-live',`PENALTIS · ${game.penaltyVisible.join(' – ')}`);
  document.querySelectorAll('.speed-btn').forEach(el=>el.classList.toggle('active',Number(el.dataset.action.split('-')[1])===game.speed));
  const overlay=document.getElementById('match-overlay');
  const overlayKey=busy?'busy':game.state==='HalfTime'?'half':game.paused?'paused':'';
  if(overlay.dataset.state!==overlayKey){overlay.dataset.state=overlayKey;overlay.innerHTML=overlayKey==='paused'?`<div><div class="eyebrow">EL PARTIDO TE ESPERA</div><h2>Simulación en pausa</h2><p>El autoguardado conserva el minuto y las jugadas pendientes.</p>${UI.button('Continuar retransmisión →','pause','btn primary')}</div>`:overlayKey==='half'?`<div><div class="eyebrow">45:00 / DESCANSO</div><h2>Tu momento de decidir.</h2>${UI.button('Abrir la pizarra','halftime','btn primary')}</div>`:overlayKey==='busy'?'<div><h2>Registrando la jornada…</h2><p>Resultados, estadísticas y guardado.</p></div>':'';}
}
function pause(force=false){if(!game||busy)return;if(game.state==='HalfTime'){openHalfTime();return;}game.paused=force||!game.paused;updateHUD();if(game.paused){checkpoint();scheduleSave();}else audio.unlock();}
function halfTimeWorld(){const w=clone(matchContext.world);const bad=game.firstHalf?.players??{};const t=teamById(w,w.userTeam);t.matchLimit=11-t.roster.filter(p=>bad[p.id]?.red).length;for(const p of t.roster){if(bad[p.id]?.red)p.ban=1;if(bad[p.id]?.injury)p.injury=1;}return w;}
function openHalfTime(){if(!game||game.state!=='HalfTime'||busy)return;closeModal(true);const w=halfTimeWorld();modal('DESCANSO · PREPARA LA SEGUNDA PARTE',`<div class="halftime-heading"><div><h2>${game.score.join(' – ')}</h2><p>Elige los once que seguirán. Arrastra suplentes a la camiseta del jugador que quieras cambiar.</p></div>${UI.button('Volver al campo →','second-half','btn primary large')}</div>${UI.squad(w,true)}`,{wide:true});checkpoint();if(!matchContext.friendly)scheduleSave();}
function stopMatch(){cancelAnimationFrame(frameId);frameId=0;renderer?.destroy();renderer=null;game=null;audio.stopCrowd();if(settings.music)audio.startMusic();matchContext=null;}
async function finishMatch(result){
  if(!game||busy)return;busy=true;const context=matchContext;const f=context.fixture;game.paused=true;updateHUD();
  try{
    if(context.friendly){Object.assign(f,result);stopMatch();view=world?'home':'landing';render();modal('FINAL DEL AMISTOSO',UI.report(context.world,f),{wide:true});}
    else{
      const completed=advance(world,result);pendingMatch=null;
      // A completed simulation is committed exactly once before the next match opens.
      try{await save();}catch(error){toast('La jornada se ha completado, pero no se ha podido guardar. Exporta una copia.',true);}
      stopMatch();view='home';render();modal('EL PARTIDO HA TERMINADO',UI.report(world,completed)+`<div class="modal-actions">${UI.button('Volver al banquillo →','close-modal','btn primary')}</div>`,{wide:true});
    }
  }catch(error){toast(`No se pudo completar la jornada: ${error.message}`,true);}
  finally{busy=false;if(game)updateHUD();}
}
async function exitMatch(){
  if(!game||busy)return;
  if(matchContext.friendly){stopMatch();closeModal(true);view=world?'home':'landing';render();return;}
  game.paused=true;await save({notify:true});stopMatch();closeModal(true);view='home';render();
}
async function runMatchday(){
  if(!world||busy)return;const own=nextFixture(world);if(own){beginMatch(world,own);return;}
  busy=true;modal('LOS DEMÁS ESTADIOS',`<div class="matchday-animation"><div class="rolling-ball">⚽</div><h2 id="matchday-title">Los equipos saltan al césped…</h2><p>Una nueva jornada se disputa en todo el continente.</p><div class="loading-line"></div></div>`,{closable:false});
  try{
    await new Promise(r=>setTimeout(r,900));document.getElementById('matchday-title').textContent='El balón ya está en juego…';await new Promise(r=>setTimeout(r,900));document.getElementById('matchday-title').textContent='Llegan los resultados de la jornada…';await new Promise(r=>setTimeout(r,800));
    const eventId=world.events[world.eventIndex].id;advance(world);await save();closeModal(true);view='home';render();const games=world.fixtures.filter(f=>f.eventId===eventId&&!f.bye);modal('RESULTADOS DE LA JORNADA',`<h2>El fútbol no se detiene.</h2><p class="muted">Tu equipo descansó en esta jornada. Los demás estadios ya tienen resultado.</p><div class="matchday-results">${games.slice(0,24).map(f=>UI.fixtureRow(world,f)).join('')}</div>${games.length>24?`<p class="hint">${games.length} partidos completados. Puedes consultar todos en el calendario.</p>`:''}<div class="modal-actions">${UI.button('Volver al banquillo →','close-modal','btn primary')}</div>`,{wide:true});
  }finally{if(modalStack.at(-1)?.title==='LOS DEMÁS ESTADIOS')closeModal(true);busy=false;}
}

function chooseLineup(id){
  const w=matchContext?.friendly?matchContext.world:world;const team=teamById(w,w.userTeam);const p=team.roster.find(p=>p.id===id);if(!p)return;
  const current=game?.state==='HalfTime'?activePlayers(teamById(halfTimeWorld(),team.id)):activePlayers(team);
  modal('CAMBIO EN LA ALINEACIÓN',`<h2>${e(p.name)} entra en el once.</h2><p class="muted">Elige a quién sustituye. ${p.position==='POR'?'Debe ocupar el puesto de portero.':'Puede cambiarse por cualquier jugador de campo.'}</p><div class="lineup-options">${current.filter(q=>p.position==='POR'?q.position==='POR':q.position!=='POR').map(q=>UI.button(`${UI.rating(overall(q))}<span>${e(q.name)}<small>${q.position} · Físico ${Math.round(q.fitness)}%</small></span><b>⇄</b>`,`swap-${id}|${q.id}`,'lineup-option')).join('')}</div>`);
}
function applySwap(input){
  if(pendingMatch&&!game)throw new Error('Reanuda la simulación guardada antes de cambiar la alineación.');
  const [inId,outId]=input.split('|');const w=matchContext?.friendly?matchContext.world:world,t=teamById(w,w.userTeam);const incoming=t.roster.find(p=>p.id===inId);if(!incoming||incoming.injury||incoming.ban)throw new Error('El jugador no está disponible.');
  const active=game?.state==='HalfTime'?activePlayers(teamById(halfTimeWorld(),t.id)):activePlayers(t);const outgoing=active.find(p=>p.id===outId);if(!outgoing||active.some(p=>p.id===inId))return;
  if((incoming.position==='POR')!==(outgoing.position==='POR'))throw new Error('El portero solo puede cambiarse por otro portero.');
  t.lineup=active.map(p=>p.id===outId?inId:p.id);closeModal(true);
  if(game?.state==='HalfTime')openHalfTime();else render();if(world)scheduleSave();
}
function offer(id,type='transfer',suggested=null){
  const {p,team}=findPlayer(id);if(!p)return;
  const own=teamById(world,world.userTeam),marketValue=playerValue(p,team??own),fee=transferPrice(p,team,own),asking=type==='loan'?Math.max(10000,Math.round(fee*.12/10000)*10000):fee;
  const recommendations=world.teams.filter(t=>t.id!==own.id).flatMap(t=>t.roster.map(q=>({p:q,team:t}))).filter(x=>x.p.id!==id&&!x.p.loan&&x.p.position===p.position&&transferPrice(x.p,x.team,own)<=own.budget).sort((a,b)=>Math.abs(transferPrice(a.p,a.team,own)-fee)-Math.abs(transferPrice(b.p,b.team,own)-fee)).slice(0,3);
  modal('NEGOCIACIÓN',`<h2>${e(p.name)} · ${type==='loan'?'CESIÓN':'TRASPASO'}</h2><p>Valor de mercado estimado: <b>${money(marketValue)}</b> · ${type==='loan'?'Prima de cesión sugerida':'Oferta inicial sugerida'}: <b>${money(asking)}</b> · Presupuesto: <b>${money(own.budget)}</b></p><label class="offer-input">TU OFERTA EN EUROS<input id="offer-amount" type="number" min="0" max="${own.budget}" step="10000" value="${suggested??asking}"></label><div class="modal-actions">${UI.button('ENVIAR OFERTA',`send-${type}-${id}`,'btn primary')}${team&&type==='transfer'?UI.button('PEDIR CESIÓN',`loan-${id}`,'btn secondary'):''}</div><h3>RECOMENDADOS PARA TU PRESUPUESTO</h3><div class="club-offers">${recommendations.map(x=>UI.button(`${UI.rating(overall(x.p))}<span>${e(x.p.name)}<small>${e(x.team.short)} · valor ${money(playerValue(x.p,x.team))} · oferta ${money(transferPrice(x.p,x.team,own))}</small></span> ↗`,`offer-${x.p.id}`,'club-offer')).join('')||'<p>No hay alternativas asequibles para esta posición.</p>'}</div>`,{wide:true});
}
function inbox(){
  const offers=world.offers??[];for(const o of offers)o.unread=false;
  closeModal(true);render();
  modal('BANDEJA DE FICHAJES',offers.length?offers.map(o=>`<article class="mail-card"><div><b>${e(o.name)} · ${o.type==='loan'?'CESIÓN':'TRASPASO'}</b><p>${({pending:'Esperando respuesta',accepted:'¡Oferta aceptada! Firma para cerrar la operación.',rejected:'Oferta rechazada. Puedes volver a negociar.',signed:'Operación completada',replaced:'Sustituida por una nueva oferta',unavailable:'El club o jugador ya no está disponible'})[o.status]} · ${money(o.fee)}</p></div><div>${o.status==='accepted'?UI.button('FIRMAR',`sign-offer-${o.id}`,'btn primary compact'):o.status==='rejected'?UI.button(`CONTRAOFERTAR · ${money(o.counter)}`,`counter-${o.id}`,'btn secondary compact'):''}</div></article>`).join(''):'<p>No tienes mensajes de fichajes.</p>',{wide:true});
  scheduleSave();
}
async function simulateWeek(){
  if(busy)return;busy=true;
  modal('AVANZANDO LA SEMANA',`<div class="matchday-animation"><div class="rolling-ball">⚽</div><h2 id="week-title">Preparando la semana…</h2><p>El calendario avanza hasta el partido o una respuesta importante.</p><div class="loading-line"></div></div>`,{closable:false});
  try{
    while((world.weekDay??0)<6){
      await new Promise(resolve=>setTimeout(resolve,280));
      advanceDay(world);
      const label=document.getElementById('week-title');if(label)label.textContent=`DÍA ${world.weekDay+1} / 7`;
      if((world.offers??[]).some(o=>o.unread))break;
    }
    await save();closeModal(true);render();
    toast((world.offers??[]).some(o=>o.unread)?'Tienes una respuesta en el buzón.':'¡Día de partido!');
  }finally{if(modalStack.at(-1)?.title==='AVANZANDO LA SEMANA')closeModal(true);busy=false;}
}
async function quickSimulate(){
  if(!world||busy)return;
  if(pendingMatch)throw new Error('Reanuda el partido guardado antes de simular otro resultado.');
  busy=true;const eventId=world.events[world.eventIndex]?.id;
  try {
    while((world.weekDay??0)<6){advanceDay(world);if((world.offers??[]).some(o=>o.unread))break;}
    if((world.offers??[]).some(o=>o.unread)){
      await save();render();inbox();toast('La semana se detuvo para que leas la respuesta del club.');return;
    }
    const ownFixture=nextFixture(world),completed=advance(world);
    await save();view='home';render();
    if(ownFixture&&completed)modal('SIMULACIÓN RÁPIDA',UI.report(world,completed)+`<div class="quick-result-ribbon">Resultado calculado con las medias, tácticas, forma y atributos de los jugadores.</div><div class="modal-actions">${UI.button('VOLVER AL BANQUILLO','close-modal','btn primary')}</div>`,{wide:true});
    else {
      const games=world.fixtures.filter(f=>f.eventId===eventId&&!f.bye);
      modal('SEMANA SIMULADA',`<div class="signing-show"><div class="season-star">⚽</div><h2>JORNADA COMPLETADA</h2><p>Tu equipo descansaba; el resto de la competición ya tiene resultados.</p><div class="matchday-results">${games.slice(0,20).map(f=>UI.fixtureRow(world,f)).join('')}</div>${UI.button('CONTINUAR','close-modal','btn primary')}</div>`,{wide:true});
    }
  } finally {busy=false;}
}
function helpContent(){return `<h2>El fútbol se dirige desde el banquillo.</h2><div class="guide-list"><article><b>01</b><div><h3>Construye tu equipo</h3><p>Plantilla de 25 jugadores: once titulares y catorce reservas. Arrastra un suplente a una camiseta en la pizarra para cambiar la alineación. Forma, condición y atributos afectan al rendimiento.</p></div></article><article><b>02</b><div><h3>Elige cómo vivir el partido</h3><p>Disfruta la retransmisión animada con pases, presión, disparos y celebraciones, o usa Simulación rápida para resolver el encuentro según las medias y la forma de los equipos. En la retransmisión puedes ajustar velocidad, pausar y hacer cambios al descanso.</p></div></article><article><b>03</b><div><h3>Piensa en varias temporadas</h3><p>Negocia fichajes, cesiones y renovaciones desde el buzón. Las ofertas esperan respuesta; las aceptadas necesitan firma. El potencial es un techo, no una promesa de crecimiento. Los jóvenes necesitan tiempo, minutos e instalaciones.</p></div></article><article><b>04</b><div><h3>Compite en Europa</h3><p>Siete países con tres divisiones, copas y supercopas. Las tres copas europeas tienen grupos y eliminatorias. Los dos últimos de cada división descienden y los dos primeros de la división inferior ascienden.</p></div></article><article><b>05</b><div><h3>Cuida tu carrera</h3><p>El juego guarda durante el partido y al terminar las jornadas. Hay tres ranuras con copia anterior y archivos exportables para conservar o trasladar tu progreso.</p></div></article></div><p class="hint">Super Soccer tiene diseño, código, arte y audio propios. Los clubes y sus plantillas son ficticios; algunas estrellas tienen alias y rasgos visuales estilizados inspirados en futbolistas conocidos. No es una base de datos oficial ni reproduce todas las funciones de otro juego.</p>`;}
function showOffers(){
  const eligible=world.teams.filter(t=>t.id!==world.userTeam).sort((a,b)=>teamRating(b)-teamRating(a));
  modal('TU SIGUIENTE DESTINO',`<h2>El banquillo puede cambiar. La historia sigue.</h2><p class="muted">Reputación ${world.reputation}/100. Los clubes exigen una reputación proporcional a su nivel. Cambiar de club conserva tu historial.</p><div class="club-offers">${eligible.map(t=>UI.button(`${badgeSVG(t,32)}<span>${e(t.name)}<small>${COUNTRIES.find(c=>c.id===t.country).name} · Media ${teamRating(t)}</small></span>${teamRating(t)>65+world.reputation*.3?'<small>No disponible</small>':'<b>Firmar →</b>'}`,`change-club-${t.id}`,'club-offer',teamRating(t)>65+world.reputation*.3?'disabled':'')).join('')}</div>`,{wide:true});
}

async function action(a){
  audio.unlock();audio.play('click');
  if(pendingMatch&&!game&&/^(buy-|sell-|renew-|upgrade-|invest-|youth$|lineup-|swap-|sign-offer-)/.test(a))throw new Error('Hay una simulación en curso. Termínala antes de modificar la plantilla o el club.');
  if(a==='close-modal'){closeModal();return;}
  if(a.startsWith('nav-')){navigate(a.slice(4));return;}
  if(a==='help'||a==='match-help'){if(game&&game.state!=='HalfTime')game.paused=true;modal('GUÍA DE SUPER SOCCER',helpContent(),{wide:true});return;}
  if(a==='new'||/^new-\d$/.test(a)){newProject(a.split('-')[1]);return;}
  if(a==='start-career'||a==='start-career-confirmed'){await startCareer(a.endsWith('confirmed'));return;}
  if(a.startsWith('setup-mode-')){setup.mode=a.slice(11);updateSetupModal();return;}
  if(a.startsWith('setup-team-')){setup.teamId=a.slice(11);if(setup.opponent===setup.teamId)setup.opponent=previewTeams.find(t=>t.id!==setup.teamId).id;updateSetupModal();return;}
  if(a==='quick-sim'){await quickSimulate();return;}
  if(a==='watch'||a==='matchday'){
    if(!world)return;
    if(!pendingMatch&&(world.weekDay??0)<6){await simulateWeek();return;}
    const f=nextFixture(world);if(f)beginMatch(world,f);else await runMatchday();return;
  }
  if(a==='matchday'){await runMatchday();return;}
  if(a==='save'){await save({notify:true});if(view==='saves')render();return;}
  if(a==='export'){checkpoint();download(`Super-Soccer-${world.season}-ranura-${slot}.json`,exportSave(world,pendingMatch));toast('Copia de la carrera exportada.');return;}
  if(a==='import'){document.getElementById('import-file').click();return;}
  if(a.startsWith('load-')&&!a.startsWith('load-confirm-')){if(world){confirm('Cargar otra carrera','Se abrirá la carrera de esta ranura. Tu carrera actual se guardará antes del cambio.','Guardar y cargar',`load-confirm-${a.slice(5)}`);}else await load(Number(a.slice(5)));return;}
  if(a.startsWith('load-confirm-')){await save();await load(Number(a.slice(13)));return;}
  if(a.startsWith('backup-')){confirm('Restaurar copia anterior',`Se abrirá la versión anterior de la ranura ${a.slice(7)}. Podrás exportarla o guardarla como carrera activa.`,'Restaurar copia',`restore-${a.slice(7)}`);return;}
  if(a.startsWith('restore-')){if(world&&slot!==Number(a.slice(8)))await save();await load(Number(a.slice(8)),true);return;}
  if(a.startsWith('delete-')){confirm('Eliminar esta ranura',`Se eliminarán la carrera y su copia anterior de la ranura ${a.slice(7)}. Exporta una copia si quieres conservarla.`,'Eliminar carrera',`erase-${a.slice(7)}`);return;}
  if(a.startsWith('erase-')){const id=Number(a.slice(6));await deleteSlot(id);if(world&&slot===id){world=null;pendingMatch=null;}await refreshSlots();closeModal(true);view='saves';render();toast('Ranura eliminada.');return;}
  if(a.startsWith('save-as-')){const id=Number(a.slice(8));confirm('Guardar en otra ranura',`La carrera actual se guardará en la ranura ${id}. Si está ocupada, su contenido pasará a la copia anterior.`,'Guardar aquí',`store-${id}`);return;}
  if(a.startsWith('store-')){await save({target:Number(a.slice(6)),notify:true});closeModal(true);render();return;}
  if(a.startsWith('import-to-')){const id=Number(a.slice(10));world=imported.world;pendingMatch=imported.match;slot=id;view='home';closeModal(true);await save();render();imported=null;toast('Carrera importada y guardada.');return;}
  if(a.startsWith('player-')){showPlayer(a.slice(7));return;}
  if(a.startsWith('team-')){const t=teamById(world,a.slice(5));modal('INFORME DEL CLUB',`<div class="team-profile">${badgeSVG(t,80)}<h2>${e(t.name)}</h2><p>${e(COUNTRIES.find(c=>c.id===t.country).name)} · División ${t.division}</p><p>Valor de plantilla estimado: <b>${money(teamMarketValue(t))}</b> · Presupuesto: <b>${money(t.budget)}</b></p>${UI.miniPitch(t)}<div class="team-roster-list">${t.roster.map(p=>UI.button(`${UI.rating(overall(p))}<span>${e(p.name)}<small>${p.position} · ${p.age} años · Potencial ${p.potential} · ${money(playerValue(p,t))}</small></span>`,`player-${p.id}`,'lineup-option')).join('')}</div></div>`,{wide:true});return;}
  if(a.startsWith('lineup-')){chooseLineup(a.slice(7));return;}
  if(a.startsWith('swap-')){applySwap(a.slice(5));return;}
  if(a.startsWith('offer-')){offer(a.slice(6));return;}
  if(a==='inbox'){inbox();return;}
  if(a.startsWith('loan-')){offer(a.slice(5),'loan');return;}
  if(a.startsWith('send-transfer-')||a.startsWith('send-loan-')){
    const loan=a.startsWith('send-loan-'),id=a.slice(loan?10:14),fee=Number(document.getElementById('offer-amount')?.value);
    submitOffer(world,id,fee,loan?'loan':'transfer');closeModal(true);await save();render();toast('Oferta enviada. La respuesta llegará en dos días.');return;
  }
  if(a.startsWith('counter-')){const o=counterOffer(world,a.slice(8));offer(o.playerId,o.type,o.counter);return;}
  if(a.startsWith('sign-offer-')){
    const p=signOffer(world,a.slice(11));closeModal(true);await save();render();
    modal('¡FICHAJE CONFIRMADO!',`<div class="signing-show">${UI.portrait(p,teamById(world,world.userTeam))}<h2>¡BIENVENIDO, ${e(p.name)}!</h2><p>Ya forma parte de tu plantilla.</p>${UI.button('CONTINUAR','close-modal','btn primary')}</div>`);return;
  }
  if(a.startsWith('buy-')){offer(a.slice(4));return;}
  if(a.startsWith('sell-')&&!a.startsWith('sell-confirm-')){const {p,team}=findPlayer(a.slice(5));confirm(`Vender a ${p.name}`,`La mejor oferta de venta es ${money(Math.round(playerValue(p,team)*.82/10000)*10000)}. El jugador saldrá de tu plantilla y un club con presupuesto cubrirá el traspaso.`,'Aceptar oferta',`sell-confirm-${p.id}`);return;}
  if(a.startsWith('sell-confirm-')){const fee=sellPlayer(world,a.slice(13));closeModal(true);scheduleSave();render();toast(`Venta completada por ${money(fee)}.`);return;}
  if(a.startsWith('renew-')&&!a.startsWith('renew-confirm-')){const {p}=findPlayer(a.slice(6));confirm(`Renovar a ${p.name}`,`La prima de renovación cuesta ${money(wage(p)*12)}. Su contrato se ampliará dos temporadas, hasta un máximo de cinco.`,'Renovar contrato',`renew-confirm-${p.id}`);return;}
  if(a.startsWith('renew-confirm-')){renewPlayer(world,a.slice(14));closeModal(true);scheduleSave();render();toast('Contrato renovado.');return;}
  if(a.startsWith('upgrade-')){const kind=a.slice(8),t=teamById(world,world.userTeam);confirm('Mejorar instalaciones',`La inversión cuesta ${money(t[kind]**2*1000000)} y aumenta un nivel la instalación.`,'Invertir',`invest-${kind}`);return;}
  if(a.startsWith('invest-')){upgrade(world,a.slice(7));closeModal(true);scheduleSave();render();toast('Instalación mejorada.');return;}
  if(a==='youth'){const p=promoteYouth(world);unlockAchievements(world);scheduleSave();render();showPlayer(p.id);return;}
  if(a==='market-prev'||a==='market-next'){filters.page+=a.endsWith('next')?1:-1;render();return;}
  if(a.startsWith('comp-tab-')){compTab=a.slice(9);render();return;}
  if(a==='calendar-own'||a==='calendar-all'){calendarAll=a.endsWith('all');render();return;}
  if(a.startsWith('report-')){const f=world.fixtures.find(f=>f.id===a.slice(7));if(f?.score)modal('RESUMEN DEL PARTIDO',UI.report(world,f),{wide:true});return;}
  if(a==='next-season'){confirm('Comenzar una nueva temporada','Se resolverán ascensos, descensos, retiradas y contratos expirados. Las estadísticas de temporada se reiniciarán; tu historial y palmarés se conservan.','Abrir la nueva temporada','roll-season');return;}
  if(a==='roll-season'){nextSeason(world);pendingMatch=null;competition=null;calendarEvent=null;closeModal(true);await save();view='home';render();modal('NUEVA TEMPORADA',`<div class="signing-show"><div class="season-star">★</div><h2>¡TEMPORADA ${UI.seasonLabel(world)}!</h2><p>Un nuevo camino hacia la gloria.</p>${UI.button('EMPEZAR','close-modal','btn primary')}</div>`);return;}
  if(a==='offers'){showOffers();return;}
  if(a.startsWith('change-club-')){const id=a.slice(12),t=teamById(world,id);confirm(`Dirigir a ${t.name}`,`Te incorporarás a ${e(t.name)} para preparar la próxima temporada. Tu historial personal se conserva.`,'Firmar contrato',`sign-club-${id}`);return;}
  if(a.startsWith('sign-club-')){changeClub(world,a.slice(10));closeModal(true);scheduleSave();render();return;}
  if(a==='test-audio'){await audio.unlock();audio.play('goal');return;}
  if(a==='pause'){pause();return;}
  if(a.startsWith('speed-')){game?.setSpeed(Number(a.slice(6)));updateHUD();return;}
  if(a==='halftime'){openHalfTime();return;}
  if(a==='second-half'){const w=matchContext.world,t=teamById(w,w.userTeam);game.continueSecondHalf(t);closeModal(true);checkpoint();if(!matchContext.friendly)scheduleSave();updateHUD();return;}
  if(a==='exit-match'){await exitMatch();return;}
  if(a==='fullscreen'){try{if(document.fullscreenElement)await document.exitFullscreen();else await (document.querySelector('.match-app')??document.documentElement).requestFullscreen();}catch(error){toast('Este navegador no permite la pantalla completa.');}return;}
  if(a==='activate-update'){if(world)await save();registration?.waiting?.postMessage({type:'ACTIVATE'});return;}
}

document.addEventListener('click',ev=>{
  const button=ev.target.closest('[data-action]');if(button&&!button.disabled){ev.preventDefault();action(button.dataset.action).catch(error=>toast(error.message,true));}
  else if(ev.target.dataset.backdrop&&modalStack.at(-1)?.closable!==false)closeModal();
});
document.addEventListener('dragstart',ev=>{
  const player=ev.target.closest('[data-drag-player]');if(!player||!ev.dataTransfer)return;
  ev.dataTransfer.setData('text/plain',player.dataset.dragPlayer);ev.dataTransfer.effectAllowed='move';player.classList.add('dragging');
});
document.addEventListener('dragend',ev=>ev.target.closest('[data-drag-player]')?.classList.remove('dragging'));
document.addEventListener('dragover',ev=>{
  const target=ev.target.closest('[data-drop-player]');if(!target)return;
  ev.preventDefault();if(ev.dataTransfer)ev.dataTransfer.dropEffect='move';target.classList.add('drop-target');
});
document.addEventListener('dragleave',ev=>ev.target.closest('[data-drop-player]')?.classList.remove('drop-target'));
document.addEventListener('drop',ev=>{
  const target=ev.target.closest('[data-drop-player]'),incoming=ev.dataTransfer?.getData('text/plain');
  if(!target||!incoming)return;ev.preventDefault();target.classList.remove('drop-target');
  try{applySwap(`${incoming}|${target.dataset.dropPlayer}`);}catch(error){toast(error.message,true);}
});
document.addEventListener('change',ev=>{
  const el=ev.target;
  try{
    if(el.dataset.setup){const key=el.dataset.setup;setup[key]=key==='slot'||key==='division'?Number(el.value):el.value;if(key==='country'||key==='division'){setup.teamId=previewTeams.find(t=>t.country===setup.country&&t.division===Number(setup.division)).id;}updateSetupModal();}
    if(el.dataset.filter){filters[el.dataset.filter]=el.type==='checkbox'?el.checked:el.value;filters.page=0;render();}
    if(el.dataset.preference){const key=el.dataset.preference;settings[key]=el.type==='checkbox'?el.checked:['duration','volume'].includes(key)?Number(el.value):el.value;setSettings(settings);audio.configure(settings);}
    if(el.dataset.change){
      const key=el.dataset.change;
      if(pendingMatch&&!game&&!['competition','calendar-event'].includes(key)){render();throw new Error('Termina la simulación en curso antes de cambiar la preparación.');}
      if(key==='competition'){competition=el.value;compTab='table';render();}
      else if(key==='calendar-event'){calendarEvent=el.value;render();}
      else {const w=matchContext?.friendly?matchContext.world:world;const t=teamById(w,w.userTeam);if(key==='formation'||key==='tactic'){t[key]=el.value;if(game?.state==='HalfTime')game.setHalfTimeTeam(t);}else if(key==='training')w.trainingFocus=el.value;else if(key==='difficulty')w.difficulty=el.value;if(game?.state==='HalfTime')openHalfTime();else render();if(world)scheduleSave();}
    }
  }catch(error){toast(error.message,true);}
});
document.addEventListener('input',ev=>{
  const el=ev.target;
  if(el.dataset.setup==='manager')setup.manager=el.value;
  if(el.dataset.filter==='q') {filters.q=el.value;filters.page=0;const caret=el.selectionStart;clearTimeout(searchTimer);searchTimer=setTimeout(()=>{render();const n=root.querySelector('[data-filter="q"]');n?.focus({preventScroll:true});n?.setSelectionRange(caret,caret);},180);}
});
document.addEventListener('keydown',ev=>{
  if(ev.key==='Tab'&&modalStack.length){const focusables=[...modalRoot.querySelectorAll('button:not([disabled]),input,select,a')];if(!focusables.length)return;const first=focusables[0],last=focusables.at(-1);if(ev.shiftKey&&document.activeElement===first){last.focus();ev.preventDefault();}else if(!ev.shiftKey&&document.activeElement===last){first.focus();ev.preventDefault();}}
  if(ev.code==='Escape'&&modalStack.length){closeModal();ev.preventDefault();return;}
  if(!game||/INPUT|SELECT|TEXTAREA/.test(ev.target.tagName)||modalStack.length)return;
  if(ev.repeat)return;
  if(ev.code==='Space'||ev.code==='Escape'){ev.preventDefault();pause();}
  if(/^Digit[1-4]$/.test(ev.code)){game.setSpeed([1,2,4,8][Number(ev.code.slice(-1))-1]);updateHUD();}
  if(ev.code==='KeyF')action('fullscreen');
});
let imported=null;
document.getElementById('import-file').addEventListener('change',async ev=>{
  const file=ev.target.files[0];ev.target.value='';if(!file)return;
  try{if(file.size>24*1024*1024)throw new Error('El archivo supera 24 MB.');imported=importSave(await file.text());const t=teamById(imported.world,imported.world.userTeam);modal('IMPORTAR CARRERA',`<h2>${e(t.name)}</h2><p>${e(imported.world.manager)} · Temporada ${UI.seasonLabel(imported.world)}. Elige dónde guardar esta carrera. Una ranura ocupada conservará su guardado actual como copia anterior.</p><div class="import-slots">${slots.map(s=>UI.button(`RANURA ${s.id}<strong>${s.exists?e(s.club??'Ocupada'):'Libre'}</strong>`,`import-to-${s.id}`,'import-slot')).join('')}</div>`,{wide:true});}
  catch(error){toast(error.message,true);}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game&&!busy){game.paused=true;checkpoint();if(!matchContext?.friendly)save().catch(()=>{});updateHUD();}});
window.addEventListener('pagehide',()=>{if(world&&!busy){checkpoint();saveSlot(slot,world,pendingMatch).catch(()=>{});}});

let registration=null;
async function offlineSetup(){
  if(!('serviceWorker'in navigator)||!/^https?:/.test(location.protocol))return;
  try{
    registration=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
    const offer=()=>toast('Hay una nueva versión. Cierra y vuelve a abrir el juego después de guardar para actualizarlo.');
    if(registration.waiting)offer();registration.addEventListener('updatefound',()=>{const installing=registration.installing;installing?.addEventListener('statechange',()=>{if(installing.state==='installed'&&navigator.serviceWorker.controller)offer();});});
  }catch(error){console.info('Modo offline: el caché no se ha podido activar en este origen. El lanzador local sigue disponible.');}
}
render();
refreshSlots().then(render).catch(error=>toast(`No se pudieron leer los guardados: ${error.message}`,true));
offlineSetup();
