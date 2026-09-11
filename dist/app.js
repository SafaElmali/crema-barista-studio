import {createScene} from './scene.js';
import {thumbnail,clamp} from './art.js';

export const lessons={
  heart:{name:'The heart',short:'Heart',level:'Beginner',duration:26,number:'01',description:'The first pour to fall in love with. Learn the foundation of every great pattern.',tip:'Keep your pitcher still while the white circle grows. Save the forward movement for the finish.',steps:[
    {title:'Build your canvas',text:'Tilt the cup toward the pitcher. Pour a fine stream into the center from about 7 cm up, until the cup is roughly half full.',height:'~7 cm above',flow:'Gentle flow',cue:'Start high. Pour gently.'},
    {title:'Get close to the surface',text:'Lower the spout to just above the coffee. Let a little more milk flow until a white circle appears.',height:'Under 1 cm',flow:'Increase flow',cue:'Get low. Let the white appear.'},
    {title:'Let the heart grow',text:'Stay in one spot. Allow the white pool to spread and gently level the cup as it fills.',height:'Under 1 cm',flow:'Steady flow',cue:'Stay still. Let the circle grow.'},
    {title:'Lift, then draw through',text:'Lift the spout and thin the stream. Move forward through the middle to pull the circle into a pointed heart, then stop.',height:'Lift the spout',flow:'Thin stream',cue:'Lift. Thin the stream. Draw through.'}]},
  tulip:{name:'The tulip',short:'Tulip',level:'Intermediate',duration:32,number:'02',description:'A flower, built one petal at a time. Learn to pause, push, and stack your pours.',tip:'Stop the flow between layers. Those small pauses keep your petals distinct.',steps:[
    {title:'Build your canvas',text:'Start with the same high, fine stream as the heart. Blend the milk into the espresso before drawing.',height:'~7 cm above',flow:'Gentle flow',cue:'Build an even coffee-colored base.'},
    {title:'Pour the first petal',text:'Bring the spout close. Form a small white pool, then stop the flow.',height:'Under 1 cm',flow:'Pour, then pause',cue:'Make one pool. Stop the flow.'},
    {title:'Push and stack',text:'Move back slightly and pour again, nudging the earlier layer forward. Pause and repeat to build the flower.',height:'Stay close',flow:'Short pulses',cue:'Push. Pause. Add another petal.'},
    {title:'Connect the petals',text:'Lift the pitcher. Draw a narrow stream through the center of all the layers and stop at the far end.',height:'Lift the spout',flow:'Thin stream',cue:'One fine line brings it together.'}]},
  rosetta:{name:'The rosetta',short:'Rosetta',level:'Advanced',duration:34,number:'03',description:'Find the rhythm in your wrist. A delicate fern made with one flowing movement.',tip:'Rock gently from side to side. A wide, hurried shake creates a zigzag instead of soft leaves.',steps:[
    {title:'Build your canvas',text:'Pour high to blend the base. Tilt the cup toward the pitcher so the spout can reach the surface.',height:'~7 cm above',flow:'Gentle flow',cue:'Give your leaves an even canvas.'},
    {title:'Set the base of the fern',text:'Lower the spout and increase the flow. Begin a small, gentle side-to-side rocking motion.',height:'Under 1 cm',flow:'Increase flow',cue:'Get low. Start a gentle rock.'},
    {title:'Rock and move back',text:'Keep rocking while slowly retreating toward your side of the cup. Narrow the movement as the leaves get smaller.',height:'Stay close',flow:'Continuous flow',cue:'Keep the rhythm. Retreat slowly.'},
    {title:'Draw the stem',text:'Stop rocking. Lift and reduce the stream, then travel straight through the leaves to form the stem.',height:'Lift the spout',flow:'Thin stream',cue:'Stop the rock. Draw a straight stem.'}]}
};
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const state={pattern:'heart',time:0,playing:false,preview:true,speed:1,ready:false};
const bounds=[0,.3,.44,.8,1];let scene,previous=performance.now(),renderedStep=-1;
const fmt=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
for(const [key,lesson]of Object.entries(lessons)){
  const b=document.createElement('button');b.className='pattern-card';b.dataset.pattern=key;b.setAttribute('aria-pressed','false');
  b.innerHTML=`<img src="${thumbnail(key)}" alt="${lesson.short} latte art pattern"/><span><span class="pattern-name">${lesson.short}</span><span class="pattern-level">${lesson.level}</span></span><span class="pattern-check" aria-hidden="true"></span>`;
  b.addEventListener('click',()=>selectPattern(key));$('#patterns').append(b);
}
function selectPattern(key){
  if(!lessons[key])throw new Error('Choose heart, tulip or rosetta.');
  state.pattern=key;state.time=0;state.playing=false;state.preview=true;renderedStep=-1;
  const lesson=lessons[key];
  $$('.pattern-card').forEach(b=>{const on=b.dataset.pattern===key;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  $('#scene-name').textContent=lesson.name;$('#lesson-title').textContent=lesson.name;
  $('#lesson-description').textContent=lesson.description;$('#lesson-number').textContent=`LESSON ${lesson.number}`;
  $('#difficulty').textContent=lesson.level;$('#duration').textContent=`${lesson.duration}s guided pour`;$('#coach-tip').textContent=lesson.tip;
  $('#timeline').max=lesson.duration;
  $('#steps').innerHTML=lesson.steps.map((s,i)=>`<button class="step" data-step="${i}" aria-label="Step ${i+1}: ${s.title}"><span class="step-index">${i+1}</span><span><span class="step-title">${s.title}</span><span class="step-description">${s.text}</span><span class="step-facts"><span>↕ ${s.height}</span><span>◌ ${s.flow}</span></span></span></button>`).join('');
  $$('.step').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.step);seek((bounds[i]+bounds[i+1])*.5*lesson.duration,true);}));
  updateUI();
}
function seek(time,pause=false){state.time=clamp(time,0,lessons[state.pattern].duration);state.preview=false;if(pause)state.playing=false;updateUI();}
function play(){if(!state.ready)return;if(state.time>=lessons[state.pattern].duration)state.time=0;state.preview=false;state.playing=!state.playing;updateUI();}
function updateUI(){
  const l=lessons[state.pattern],p=state.time/l.duration;
  let index=0;for(let i=0;i<4;i++)if(p>=bounds[i])index=i;
  if(index!==renderedStep){$$('.step').forEach((el,i)=>{el.classList.toggle('active',i===index);el.setAttribute('aria-current',i===index?'step':'false');});renderedStep=index;}
  const buttonLabel=state.playing?'Pause tutorial':state.preview?'Start tutorial':state.time>=l.duration?'Pour it again':'Resume tutorial';
  $('#play span').textContent=buttonLabel;
  $('#play svg').innerHTML=state.playing?'<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>':'<path d="m9 5 10 7-10 7Z"/>';
  $('#play').setAttribute('aria-label',buttonLabel);
  $('#time-display').innerHTML=`${fmt(state.time)} <span>/ ${fmt(l.duration)}</span>`;
  $('#timeline').value=state.time;$('#timeline').style.setProperty('--progress',`${p*100}%`);
  $('#timeline').setAttribute('aria-valuetext',`${fmt(state.time)} of ${fmt(l.duration)}. ${l.steps[index].title}`);
  $('#pour-callout').hidden=state.preview;
  $('#callout-kicker').textContent=state.time>=l.duration?'POUR COMPLETE':`${String(index+1).padStart(2,'0')} / ${l.steps[index].title.toUpperCase()}`;
  $('#callout-text').textContent=state.time>=l.duration?'Your turn. Take it one pour at a time.':l.steps[index].cue;
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
selectPattern('heart');
try{
  scene=await createScene($('#scene'));state.ready=true;$('#play').disabled=false;$('#loading').hidden=true;
  function frame(now){const dt=Math.min((now-previous)/1000,.06);previous=now;if(!document.hidden){if(state.playing){state.time=Math.min(lessons[state.pattern].duration,state.time+dt*state.speed);if(state.time>=lessons[state.pattern].duration)state.playing=false;updateUI();}scene.update(state.pattern,state.time/lessons[state.pattern].duration,state.preview,dt);}requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
}catch(error){$('#loading').innerHTML='<span>Your browser couldn’t start the 3D view.</span><span>Enable WebGL, or try another browser.</span>';console.error(error);}
// Public tools mirror the controls and work only if the browser supports WebMCP.
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const register=tool=>{try{Promise.resolve(document.modelContext.registerTool({...tool,annotations:{readOnlyHint:false,untrustedContentHint:false}},{signal:lifecycle.signal})).catch(()=>{});}catch{/* The visible controls remain available. */}};
  register({name:'select_latte_art',description:'Select a heart, tulip or rosetta lesson in the Crema studio.',inputSchema:{type:'object',properties:{pattern:{type:'string',enum:['heart','tulip','rosetta']}},required:['pattern'],additionalProperties:false},execute:async({pattern})=>{selectPattern(pattern);return{pattern,duration:lessons[pattern].duration};}});
  register({name:'control_latte_tutorial',description:'Play, pause or seek the currently selected latte art tutorial.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['play','pause','seek']},seconds:{type:'number'}},required:['action'],additionalProperties:false},execute:async({action,seconds})=>{if(!['play','pause','seek'].includes(action))throw new Error('Choose play, pause or seek.');if(action==='seek'){if(!Number.isFinite(seconds))throw new Error('Seek requires a finite seconds value.');seek(seconds,true);}else if(action==='pause'){state.playing=false;updateUI();}else if(action==='play'){if(!state.ready)throw new Error('The 3D view is not ready.');if(!state.playing)play();}return{pattern:state.pattern,seconds:state.time,playing:state.playing,ready:state.ready};}});
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
