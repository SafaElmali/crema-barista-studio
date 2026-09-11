import {clamp, smooth, lerp, pourPose, cloverPetals, swanNeckPoint} from './motion.js';
export {clamp, smooth, lerp} from './motion.js';

// The surface is a teaching illustration parameterized by the same pour clock
// as the pitcher. Scrubbing can reconstruct any frame without simulation drift.
const base = document.createElement('canvas');
base.width = base.height = 1024;
const bc = base.getContext('2d');
const milkLayer = document.createElement('canvas');milkLayer.width=milkLayer.height=1024;
const milkCtx = milkLayer.getContext('2d');
const grainLayer = document.createElement('canvas');grainLayer.width=grainLayer.height=1024;
const gc = grainLayer.getContext('2d');
const pixels = bc.createImageData(1024, 1024);
let seed = 271828;
const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
for (let y = 0; y < 1024; y++) for (let x = 0; x < 1024; x++) {
  const u = (x - 512) / 512, v = (y - 512) / 512, r = Math.hypot(u, v), a = Math.atan2(v, u);
  const swirl = Math.sin(r * 47 + a * 2 + Math.sin(a * 5 + r * 13) * 1.7);
  const wisps = Math.sin(r * 130 + a * 6 + Math.sin(a * 8 + r * 19) * 2);
  const cloud = Math.sin(u * 9 + Math.sin(v * 5)) * Math.sin(v * 11 + u * 4);
  const grain = (rand() - .5) * 9;
  const edge = Math.exp(-Math.pow((r - .955) / .035, 2)) * 25;
  const n = swirl * 3.4 + wisps * 1.2 + cloud * 5 + grain + edge;
  const i = (y * 1024 + x) * 4;
  pixels.data[i] = 133 + n; pixels.data[i + 1] = 68 + n * .77; pixels.data[i + 2] = 30 + n * .48; pixels.data[i + 3] = 255;
}
bc.putImageData(pixels, 0, 0);
const gi=gc.createImageData(1024,1024);
for(let i=0;i<gi.data.length;i+=4){const n=rand();gi.data[i]=212+n*40;gi.data[i+1]=193+n*44;gi.data[i+2]=159+n*57;gi.data[i+3]=40+rand()*45;}
gc.putImageData(gi,0,0);
for(let i=0;i<2400;i++){const x=rand()*1024,y=rand()*1024,r=.2+rand()*.55;gc.beginPath();gc.arc(x,y,r,0,Math.PI*2);gc.strokeStyle='rgba(151,119,65,.12)';gc.lineWidth=.4;gc.stroke();}
for (let i = 0; i < 1650; i++) {
  const a = rand() * Math.PI * 2, r = (.88 + rand() * .113) * 512;
  const x = 512 + Math.sin(a) * r, y = 512 + Math.cos(a) * r, size = .3 + rand() * 2;
  bc.beginPath(); bc.arc(x, y, size, 0, Math.PI * 2);
  bc.fillStyle = `rgba(240,199,138,${.1 + rand() * .23})`; bc.fill();
  if (size > 1.2) { bc.strokeStyle = '#53351635'; bc.lineWidth = .55; bc.stroke(); }
}

function heart(ctx, x, y, size, morph = 1) {
  ctx.beginPath();
  // Morph a milk pool into the heart as the thin finishing stream pulls through.
  for (let i = 0; i <= 180; i++) {
    const t = i / 180 * Math.PI * 2;
    const hx = Math.pow(Math.sin(t), 3);
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
    const px = x + lerp(Math.sin(t) * .9, hx, morph) * size;
    const py = y + lerp(-Math.cos(t) * .78, hy, morph) * size;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}
function petal(ctx, x, y, w, h, curl = .65) {
  ctx.beginPath();ctx.moveTo(x - w, y - h * .25);
  ctx.bezierCurveTo(x - w * 1.17, y + h * .72, x - w * .36, y + h, x, y + h * .92);
  ctx.bezierCurveTo(x + w * .36, y + h, x + w * 1.17, y + h * .72, x + w, y - h * .25);
  ctx.bezierCurveTo(x + w * .57, y + h * curl, x + w * .34, y + h * .05, x, y + h * .13);
  ctx.bezierCurveTo(x - w * .34, y + h * .05, x - w * .57, y + h * curl, x - w, y - h * .25);
  ctx.closePath();ctx.fill();
}
export function drawArt(ctx, size, pattern, p, finished = false) {
  const progress = finished ? 1 : p;
  ctx.clearRect(0, 0, size, size); ctx.drawImage(base, 0, 0, size, size);
  const output=ctx;
  ctx=milkCtx;ctx.clearRect(0,0,1024,1024);
  ctx.save();ctx.translate(size / 2, size / 2);ctx.scale(size / 2, size / 2);
  const blend = smooth(.08, .31, progress);
  ctx.fillStyle = `rgba(211,154,91,${blend * .07})`;ctx.fillRect(-1,-1,2,2);
  const cream = ctx.createLinearGradient(-.35,-.7,.45,.7);
  cream.addColorStop(0,'#fff9e8');cream.addColorStop(.45,'#f6edd5');cream.addColorStop(1,'#ecdcbb');
  ctx.fillStyle = cream;ctx.shadowColor='#fff6d5';ctx.shadowBlur=size*.0011;
  const morph = smooth(.812,.925,progress);
  if (pattern === 'heart') {
    const grow = smooth(.345,.78,progress);
    if(grow>0) {
      const s=Math.sqrt(grow)*.61,y=lerp(-.18,-.02,grow);
      ctx.save();ctx.globalAlpha=.25;heart(ctx,0,y,s*1.07,morph);ctx.restore();
      ctx.save();ctx.fillStyle='#b57d44';heart(ctx,0,y,s*1.035,morph);ctx.restore();
      heart(ctx,0,y,s,morph);
      if(grow>.6){
        ctx.save();ctx.strokeStyle='#cfa86e';ctx.globalAlpha=.33;ctx.lineWidth=.004;
        for(let k=0;k<4;k++){ctx.beginPath();ctx.ellipse(0,y-.06,s*(.94-k*.025),s*(.72-k*.024),0,.19,Math.PI-.19);ctx.stroke();}
        ctx.restore();
      }
    }
  } else if(pattern === 'tulip') {
    const phase = clamp((progress-.35)/.44)*4;
    for(let i=0;i<4;i++) {
      const growth=smooth(0,.8,phase-i); if(growth<=0)continue;
      const pushed=smooth(.85,1.6,phase-i);
      const z=.24-i*.20;
      if(i===3)heart(ctx,0,z,.20*Math.sqrt(growth),Math.max(pushed,morph));
      else{
        ctx.save();ctx.globalAlpha=1-pushed;heart(ctx,0,z,.34*Math.sqrt(growth),0);ctx.restore();
        ctx.save();ctx.globalAlpha=pushed;
        const w=(.60-i*.105)*Math.sqrt(growth);
        petal(ctx,0,z,w,.25,lerp(.3,.64,pushed));
        ctx.save();ctx.globalAlpha*=.5;ctx.strokeStyle='#c99b58';ctx.lineWidth=.008;
        ctx.beginPath();ctx.ellipse(0,z+.045,w*.85,.15,0,.15,Math.PI-.15);ctx.stroke();ctx.restore();
        ctx.restore();
      }
    }
  } else if(pattern === 'nested-heart') {
    const outer=smooth(.35,.53,progress),inner=smooth(.59,.79,progress);
    const cut=smooth(.812,.925,progress),cy=lerp(-.13,.025,inner);
    if(outer>0){
      ctx.save();ctx.fillStyle='#bc864b';heart(ctx,0,cy,.625*Math.sqrt(outer),cut);ctx.restore();
      heart(ctx,0,cy,.61*Math.sqrt(outer),cut);
    }
    if(inner>0){
      const s=.33*Math.sqrt(inner);
      ctx.save();ctx.fillStyle='#a96834';heart(ctx,0,-.09,s*1.13,cut);ctx.restore();
      ctx.save();ctx.fillStyle='#d6ad73';heart(ctx,0,-.09,s*1.055,cut);ctx.restore();
      heart(ctx,0,-.09,s,cut);
    }
  } else if(pattern === 'clover') {
    for(const leaf of cloverPetals){
      const growth=smooth(leaf.start,leaf.end-.038,progress);
      if(growth<=0)continue;
      const cut=smooth(leaf.end-.038,leaf.end,progress);
      ctx.save();ctx.translate(leaf.x,leaf.z);ctx.rotate(leaf.angle);
      const s=.28*Math.sqrt(growth);
      ctx.save();ctx.fillStyle='#c28d50';heart(ctx,0,0,s*1.045,cut);ctx.restore();
      heart(ctx,0,0,s,cut);ctx.restore();
    }
    const stem=smooth(.875,.93,progress);
    if(stem>0){
      ctx.strokeStyle=cream;ctx.lineWidth=.025;ctx.lineCap='round';ctx.beginPath();
      ctx.moveTo(0,.07);ctx.lineTo(.13*stem,lerp(.07,.62,stem));ctx.stroke();
    }
  } else if(pattern === 'swan') {
    const phase=clamp((progress-.35)/.29)*8;
    const body=smooth(.35,.425,progress);
    if(body>0){ctx.beginPath();ctx.ellipse(-.16,.35,.31*Math.sqrt(body),.135*Math.sqrt(body),-.12,0,Math.PI*2);ctx.fill();}
    for(let i=0;i<8;i++){
      const growth=smooth(0,.88,phase-i);if(growth<=0)continue;
      const z=.38-i*.101,spread=[.30,.38,.39,.36,.31,.25,.17,.085][i]*Math.sqrt(growth);
      for(const side of [-1,1]){
        const w=spread*(side<0?1:.67);
        ctx.beginPath();ctx.moveTo(-.22,z+.035);
        ctx.bezierCurveTo(-.22+side*w*.6,z+.10,-.22+side*w*1.08,z+.01,-.22+side*w,z-.10);
        ctx.bezierCurveTo(-.22+side*w*.8,z-.025,-.22+side*w*.35,z-.015,-.22,z);
        ctx.closePath();ctx.fill();
      }
    }
    const carve=smooth(.64,.71,progress);
    if(carve>0){
      ctx.strokeStyle=cream;ctx.lineCap='round';ctx.lineWidth=.024;ctx.beginPath();
      ctx.moveTo(-.22,-.43);ctx.lineTo(lerp(-.22,.14,carve),lerp(-.43,.41,carve));ctx.stroke();
    }
    const neck=smooth(.73,.84,progress);
    if(neck>0){
      ctx.strokeStyle=cream;ctx.lineCap='round';
      // Taper the neck as the pitcher travels faster toward the head.
      for(let i=0;i<90;i++){
        const t0=i/90,t1=Math.min((i+1)/90,neck);if(t0>=neck)break;
        const a=swanNeckPoint(t0),b=swanNeckPoint(t1);
        ctx.lineWidth=lerp(.092,.048,t0);ctx.beginPath();ctx.moveTo(a.x,a.z);ctx.lineTo(b.x,b.z);ctx.stroke();
      }
    }
    const head=smooth(.84,.889,progress);
    if(head>0){ctx.save();ctx.translate(.32,-.41);ctx.rotate(Math.PI/2);heart(ctx,0,0,.12*Math.sqrt(head),smooth(.89,.93,progress));ctx.restore();}
    const beak=smooth(.89,.93,progress);
    if(beak>0){ctx.strokeStyle=cream;ctx.lineWidth=.012;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(.32,-.41);ctx.lineTo(lerp(.32,.1,beak),-.41);ctx.stroke();}
  } else if(pattern === 'rosetta') {
    const phase=clamp((progress-.35)/.44)*9;
    for(let i=0;i<9;i++){
      const growth=smooth(0,.85,phase-i);if(growth<=0)continue;
      const z=.43-i*.109,w=[.46,.56,.58,.55,.49,.40,.30,.20,.105][i]*Math.sqrt(growth);
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(0,z+.045);
        ctx.bezierCurveTo(side*w*.45,z+.08,side*w*1.03,z+.03,side*w,z-.10);
        ctx.bezierCurveTo(side*w*.82,z-.01,side*w*.43,z+.002,0,z);
        ctx.closePath();ctx.fill();
      }
    }
    const crown=smooth(8.6,9,phase);if(crown>0)heart(ctx,0,-.53,.13*crown,1);
  }
  if(morph>0 && ['tulip','rosetta'].includes(pattern)){
    ctx.lineWidth=.020;ctx.lineCap='round';ctx.strokeStyle='#fbf1d8';ctx.beginPath();
    ctx.moveTo(0,-.51);ctx.lineTo(0,lerp(-.51,.62,morph));ctx.stroke();
  }
  const pose=pourPose(pattern,progress);
  if(pose.flow && progress<.35){
    for(let i=0;i<3;i++){
      const r=((progress*8+i*.23)% .7);
      ctx.beginPath();ctx.ellipse(pose.x,pose.z,r,r*.96,0,0,Math.PI*2);
      ctx.lineWidth=.004;ctx.strokeStyle=`rgba(235,195,133,${(1-r/.7)*.22})`;ctx.stroke();
    }
  }
  ctx.restore();
  ctx.save();ctx.globalCompositeOperation='source-atop';ctx.drawImage(grainLayer,0,0,size,size);ctx.restore();
  output.drawImage(milkLayer,0,0,size,size,0,0,size,size);
}
export function thumbnail(pattern) { const c=document.createElement('canvas');c.width=c.height=192;drawArt(c.getContext('2d'),192,pattern,1,true);return c.toDataURL(); }
