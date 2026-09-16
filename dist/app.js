import {createScene} from './scene.js?v=night-school-3';
import {thumbnail,clamp} from './art.js';

import {lessons} from './lessons.js';
export {lessons};

const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const state={pattern:'heart',time:0,playing:false,preview:true,speed:1,ready:false};
const defaultBounds=[0,.3,.44,.8,1];let scene,previous=performance.now(),renderedStep=-1,renderedInstruction='';
const fmt=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
for(const [key,lesson]of Object.entries(lessons)){
  const b=document.createElement('button');b.className='pattern-card';b.dataset.pattern=key;b.setAttribute('aria-pressed','false');
  b.innerHTML=`<img src="${thumbnail(key)}" alt="" width="64" height="64"/><span><span class="pattern-name">${lesson.short}</span><span class="pattern-level">${lesson.level}</span></span><span class="pattern-check" aria-hidden="true"></span>`;
  b.addEventListener('click',()=>selectPattern(key));$('#patterns').append(b);
}
function selectPattern(key){
  if(!lessons[key])throw new Error(`Choose one of: ${Object.keys(lessons).join(', ')}.`);
  state.pattern=key;state.time=0;state.playing=false;state.preview=true;renderedStep=-1;
  const lesson=lessons[key],bounds=lesson.bounds||defaultBounds;
  $$('.pattern-card').forEach(b=>{const on=b.dataset.pattern===key;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  $('#scene-name').textContent=lesson.name;$('#lesson-title').textContent=key==='nested-heart'?'The nested heart':lesson.name;
  $('#lesson-description').textContent=lesson.description;$('#lesson-number').textContent=`LESSON ${lesson.number}`;
  $('#difficulty').textContent=lesson.level;$('#duration').textContent=`${lesson.duration}s guided pour`;$('#coach-tip').textContent=lesson.tip;
  $('#timeline').max=lesson.duration;
  $('.timeline-labels').innerHTML=(lesson.labels||['BASE','GET CLOSE','SHAPE','FINISH']).map(label=>`<span>${label}</span>`).join('');
  $('#steps').innerHTML=lesson.steps.map((s,i)=>`<button class="step" data-step="${i}" aria-label="Step ${i+1}: ${s.title}"><span class="step-index">${String(i+1).padStart(2,'0')}</span><span class="step-title">${s.title}</span></button>`).join('');
  $$('.step').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.step);seek((bounds[i]+bounds[i+1])*.5*lesson.duration,true);}));
  history.replaceState(null,'',`#lesson-${key}`);
  updateUI();
}
function seek(time,pause=false){state.time=clamp(time,0,lessons[state.pattern].duration);state.preview=false;if(pause)state.playing=false;updateUI();}
function play(){if(!state.ready)return;if(state.time>=lessons[state.pattern].duration)state.time=0;state.preview=false;state.playing=!state.playing;updateUI();}
function updateUI(){
  const l=lessons[state.pattern],p=state.time/l.duration,bounds=l.bounds||defaultBounds;
  let index=0;for(let i=0;i<l.steps.length;i++)if(p>=bounds[i])index=i;
  if(index!==renderedStep){$$('.step').forEach((el,i)=>{el.classList.toggle('active',i===index);el.setAttribute('aria-current',i===index?'step':'false');});renderedStep=index;}
  const buttonLabel=state.playing?'Pause tutorial':state.preview?'Start tutorial':state.time>=l.duration?'Pour it again':'Resume tutorial';
  $('#play span').textContent=buttonLabel;
  $('#play svg').innerHTML=state.playing?'<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>':'<path d="m9 5 10 7-10 7Z"/>';
  $('#play').setAttribute('aria-label',buttonLabel);
  $('#time-display').innerHTML=`${fmt(state.time)} <span>/ ${fmt(l.duration)}</span>`;
  $('#timeline').value=state.time;$('#timeline').style.setProperty('--progress',`${p*100}%`);
  $('#timeline').setAttribute('aria-valuetext',`${fmt(state.time)} of ${fmt(l.duration)}. ${l.steps[index].title}`);
  const complete=state.time>=l.duration,instructionKey=`${state.pattern}:${index}:${state.preview}:${complete}`;
  // Update the live region only when the instruction changes.
  if(instructionKey!==renderedInstruction){
    $('#callout-kicker').textContent=complete?'POUR COMPLETE':`${String(index+1).padStart(2,'0')} / ${l.steps[index].title.toUpperCase()}`;
    $('#callout-text').textContent=complete?'Your turn at the counter.':l.steps[index].cue;
    $('#step-detail').textContent=complete?'Take it one pour at a time. Replay a step to practice the movement, then give it a try with your next coffee.':l.steps[index].text;
    $('#step-facts').innerHTML=complete?'<span>Pour complete</span>':`<span>↕ ${l.steps[index].height}</span><span>◌ ${l.steps[index].flow}</span>`;
    renderedInstruction=instructionKey;
  }
}
$('#play').addEventListener('click',play);
$('#replay').addEventListener('click',()=>{if(!state.ready)return;state.time=0;state.preview=false;state.playing=true;updateUI();});
$('#timeline').addEventListener('input',e=>seek(Number(e.target.value),true));
$('#speed').addEventListener('change',e=>{state.speed=Number(e.target.value);});
function setView(view){scene?.setCamera(view);$$('[data-camera]').forEach(b=>{const on=b.dataset.camera===view;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});}
$$('[data-camera]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.camera)));
$('#reset-view').addEventListener('click',()=>setView('studio'));
$('#scene').addEventListener('pointerdown',()=>{$$('[data-camera]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});});
$('#scene').addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();play();}if(e.key==='ArrowRight'){e.preventDefault();seek(state.time+1,true);}if(e.key==='ArrowLeft'){e.preventDefault();seek(state.time-1,true);}});
const dialog=$('#basics');let resumeAfterDialog=false;
$('#open-basics').addEventListener('click',()=>{resumeAfterDialog=state.playing;state.playing=false;updateUI();dialog.showModal();});
$('#close-basics').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{if(resumeAfterDialog)state.playing=true;updateUI();});
document.addEventListener('visibilitychange',()=>{previous=performance.now();});
document.addEventListener('studio-context-lost',()=>{state.playing=false;state.ready=false;$('#play').disabled=true;$('#loading').hidden=false;$('#loading').innerHTML='<span>The 3D view was interrupted.</span><button onclick="location.reload()">Reload studio</button>';updateUI();});
function selectLinkedLesson(){
  const key=location.hash.replace(/^#lesson-/, '');
  selectPattern(Object.hasOwn(lessons,key)?key:'heart');
}
window.addEventListener('hashchange',selectLinkedLesson);
selectLinkedLesson();
try{
  scene=await createScene($('#scene'));state.ready=true;$('#play').disabled=false;$('#loading').hidden=true;
  function frame(now){const dt=Math.min((now-previous)/1000,.06);previous=now;if(!document.hidden){if(state.playing){state.time=Math.min(lessons[state.pattern].duration,state.time+dt*state.speed);if(state.time>=lessons[state.pattern].duration)state.playing=false;updateUI();}scene.update(state.pattern,state.time/lessons[state.pattern].duration,state.preview,dt);}requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
}catch(error){$('#loading').innerHTML='<span>Your browser couldn’t start the 3D view.</span><span>Enable WebGL, or try another browser.</span>';console.error(error);}
// Public tools mirror the controls and work only if the browser supports WebMCP.
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const register=tool=>{try{Promise.resolve(document.modelContext.registerTool({...tool,annotations:{readOnlyHint:false,untrustedContentHint:false}},{signal:lifecycle.signal})).catch(()=>{});}catch{/* The visible controls remain available. */}};
  register({name:'select_latte_art',description:'Select a latte art lesson in the Crema studio: heart, tulip, rosetta, nested-heart or clover.',inputSchema:{type:'object',properties:{pattern:{type:'string',enum:Object.keys(lessons)}},required:['pattern'],additionalProperties:false},execute:async({pattern})=>{selectPattern(pattern);return{pattern,duration:lessons[pattern].duration};}});
  register({name:'control_latte_tutorial',description:'Play, pause or seek the currently selected latte art tutorial.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['play','pause','seek']},seconds:{type:'number'}},required:['action'],additionalProperties:false},execute:async({action,seconds})=>{if(!['play','pause','seek'].includes(action))throw new Error('Choose play, pause or seek.');if(action==='seek'){if(!Number.isFinite(seconds))throw new Error('Seek requires a finite seconds value.');seek(seconds,true);}else if(action==='pause'){state.playing=false;updateUI();}else if(action==='play'){if(!state.ready)throw new Error('The 3D view is not ready.');if(!state.playing)play();}return{pattern:state.pattern,seconds:state.time,playing:state.playing,ready:state.ready};}});
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
