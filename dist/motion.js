export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const mix3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

// These surface coordinates also drive the drawn foam, keeping the spout and
// the lesson illustration together when playing or seeking in either direction.
export const cloverPetals = [
  {x: -.31, z: .06, angle: -Math.PI / 2, start: .35, end: .49},
  {x: .31, z: .06, angle: Math.PI / 2, start: .53, end: .67},
  {x: 0, z: -.31, angle: 0, start: .71, end: .85}
];
export function swanWingPoint(t) {
  return {x: -.22 + Math.sin(t * Math.PI * 16) * lerp(.18, .035, t) * smooth(0, .035, t) * (1 - smooth(.95, 1, t)), z: lerp(.38, -.43, t)};
}
export function swanNeckPoint(t) {
  const s = 1 - t;
  return {x: s*s*s*.14 + 3*s*s*t*.65 + 3*s*t*t*.65 + t*t*t*.32,
    z: s*s*s*.41 + 3*s*s*t*.39 - 3*s*t*t*.48 - t*t*t*.41};
}
function between(a, b, p, start, end) {
  const t = smooth(start, end, p);
  return Object.fromEntries(Object.keys(a).map(key => [key, lerp(a[key], b[key], t)]));
}
function detailedPour(pattern, p) {
  const low = (x, z, flow = .031) => ({x, z, height: .12, flow, pause: 0});
  if (pattern === 'nested-heart') {
    const outer = low(0, -.13), inner = low(0, -.22);
    if (p < .35) return between({x:0,z:0,height:.8,flow:.014,pause:0}, outer, p, .3, .35);
    if (p < .55) return {...outer, flow: .031 * (1 - smooth(.53,.55,p))};
    if (p < .59) return {...between(outer,inner,p,.55,.59), height:.12+.18*Math.sin(Math.PI*clamp((p-.55)/.04))**2,flow:0,pause:1};
    if (p < .8) return {...inner,flow:.028*smooth(.59,.605,p)};
    return {x:0,z:lerp(-.22,.65,smooth(.812,.925,p)),height:lerp(.12,.4,smooth(.8,.818,p)),flow:lerp(.028,.011,smooth(.8,.813,p))*(1-smooth(.925,.93,p)),pause:0};
  }
  if (pattern === 'swan') {
    const wingStart = low(-.22,.38);
    if (p < .35) return between({x:0,z:0,height:.8,flow:.014,pause:0},wingStart,p,.3,.35);
    if (p < .64) return {...low(0,0),...swanWingPoint(clamp((p-.35)/.29))};
    if (p < .71) return between(low(-.22,-.43),{x:.14,z:.41,height:.25,flow:.010,pause:0},p,.64,.71);
    if (p < .73) return between({x:.14,z:.41,height:.25,flow:.010,pause:0},low(.14,.41,.022),p,.71,.73);
    if (p < .84) return {...low(0,0,lerp(.022,.015,smooth(.73,.84,p))),...swanNeckPoint(smooth(.73,.84,p))};
    if (p < .89) return low(.32,-.41,lerp(.015,.025,smooth(.84,.86,p)));
    return between(low(.32,-.41,.025),{x:.10,z:-.41,height:.4,flow:0,pause:0},p,.89,.93);
  }
  if (pattern === 'clover') {
    const initial = low(cloverPetals[0].x,cloverPetals[0].z,0);
    if (p < .35) return between({x:0,z:0,height:.8,flow:.014,pause:0},initial,p,.3,.35);
    for (let i=0;i<cloverPetals.length;i++) {
      const leaf=cloverPetals[i],cutStart=leaf.end-.038;
      const pool=low(leaf.x,leaf.z,.026);
      const tip={x:leaf.x-Math.sin(leaf.angle)*.30,z:leaf.z+Math.cos(leaf.angle)*.30,height:.34,flow:0,pause:0};
      if(p<leaf.end) {
        if(p<cutStart)return {...pool,flow:.026*smooth(leaf.start,leaf.start+.012,p)};
        return between(pool,tip,p,cutStart,leaf.end);
      }
      const next=cloverPetals[i+1];
      if(next&&p<next.start) {
        const t=smooth(leaf.end,next.start,p);
        return {...between(tip,low(next.x,next.z,0),p,leaf.end,next.start),height:lerp(.34,.12,t)+.22*Math.sin(Math.PI*t),flow:0,pause:1};
      }
    }
    if(p<.875)return between({x:0,z:-.01,height:.34,flow:0,pause:0},low(0,.07,0),p,.85,.875);
    return {x:.13*smooth(.875,.93,p),z:lerp(.07,.62,smooth(.875,.93,p)),height:lerp(.12,.4,smooth(.91,.93,p)),flow:.014*smooth(.875,.885,p)*(1-smooth(.91,.93,p)),pause:0};
  }
}

export function insideRadius(y) {
  let lo = 0, hi = 1;
  for (let k = 0; k < 13; k++) {
    const t = (lo + hi) / 2, s = 1 - t;
    const py = s * s * s * 1.1 + 3 * s * s * t * .7 + 3 * s * t * t * .27 + t * t * t * .18;
    if (py > y) lo = t; else hi = t;
  }
  const t = (lo + hi) / 2, s = 1 - t;
  return s * s * s * .978 + 3 * s * s * t * .9 + 3 * s * t * t * .65 + t * t * t * .5 - .003;
}

export function cupPose(p) {
  const level = .78 + smooth(.075, .34, p) * .19 + smooth(.34, .925, p) * .225;
  const tilt = -.18 * (1 - smooth(.14, .75, p));
  const y = .14 + Math.abs(tilt) * .16;
  const height = level - y;
  return {level, tilt, y, centerZ: height * Math.tan(tilt), radius: insideRadius(height / Math.cos(tilt))};
}

export function pourPose(pattern, p) {
  if (p >= .3 && ['swan','nested-heart','clover'].includes(pattern)) {
    return {...detailedPour(pattern,p),draw:clamp((p-.35)/.44),cut:smooth(.812,.925,p)};
  }
  const draw = clamp((p - .35) / .44), cut = smooth(.812, .925, p);
  const lower = smooth(.3, .36, p);
  let x = 0, z = 0, flow = 0, height = .8, pause = 0;
  if (p < .3) {
    const t = clamp((p - .075) / .225), envelope = Math.sin(Math.PI * t) ** 2;
    x = Math.sin(t * Math.PI * 4) * .12 * envelope;
    z = Math.cos(t * Math.PI * 4) * .12 * envelope;
    flow = .014 * smooth(.075, .087, p);
  } else if (p < .8) {
    height = lerp(.8, .12, lower);
    flow = lerp(.014, .033, smooth(.32, .4, p));
    if (pattern === 'heart') z = -.2;
    if (pattern === 'tulip') {
      const cycle = draw * 4, layer = Math.min(3, Math.floor(cycle)), f = cycle - layer;
      // Reposition during the closed-flow interval, with no jump between layers.
      const advance = layer < 3 ? smooth(.78, 1, f) : 0;
      z = .24 - (layer + advance) * .2 - .025 * Math.sin(Math.PI * Math.min(f / .78, 1)) ** 2;
      const pulse = smooth(0, .10, f) * (1 - smooth(.71, .84, f));
      pause = smooth(.72, .86, f) * (1 - smooth(.94, 1, f));
      flow *= lerp(1, pulse, smooth(.3, .35, p));
    }
    if (pattern === 'rosetta') {
      z = lerp(.43, -.55, draw);
      x = Math.sin(draw * Math.PI * 18) * lerp(.20, .045, draw) * smooth(0, .035, draw) * (1 - smooth(.94, 1, draw));
    }
    x *= lower; z *= lower;
  } else {
    height = lerp(.12, .40, smooth(.8, .832, p));
    const start = pattern === 'heart' ? -.2 : pattern === 'tulip' ? -.36 : -.55;
    z = lerp(start, .64, cut);
    flow = lerp(pattern === 'tulip' ? 0 : .033, .011, smooth(.8, .81, p)) * (1 - smooth(.925, .93, p));
  }
  return {x, z, height, flow, pause, draw, cut};
}

export const SPOUT = [0, .962, .627];
export const PARK = [-1.8, .987, -.20];

export function pitcherPose(pattern, p) {
  const cup = cupPose(p), pour = pourPose(pattern, p);
  const target = [pour.x * cup.radius, cup.level, pour.z * cup.radius + cup.centerZ];
  const position = [target[0], cup.level + pour.height, target[2]];
  let angle = lerp(.96, 1.43, smooth(.3, .36, p));
  angle += .035 * smooth(.44, .79, p);
  angle -= .018 * pour.pause;
  angle = lerp(angle, 1.12, smooth(.8, .832, p));
  if (['swan','nested-heart','clover'].includes(pattern) && p >= .3) {
    angle = lerp(1.47,.96,smooth(.12,.8,pour.height));
  }

  if (p < .075) {
    const hover = [0, 2.16, cup.centerZ];
    if (p < .027) {
      const t = smooth(0, .027, p);
      return {position: mix3(PARK, [PARK[0], 2.16, PARK[2]], t), angle: lerp(0, .40, t), target, flow: 0};
    }
    if (p < .054) {
      const t = smooth(.027, .054, p);
      return {position: mix3([PARK[0], 2.16, PARK[2]], hover, t), angle: .40, target, flow: 0};
    }
    const t = smooth(.054, .075, p);
    return {position: mix3(hover, position, t), angle: lerp(.40, .96, t), target, flow: 0};
  }
  if (p >= .93) {
    const finish = pitcherPose(pattern, .93 - Number.EPSILON);
    if (p < .952) {
      const t = smooth(.93, .952, p);
      return {position: mix3(finish.position, [finish.position[0], 2.16, finish.position[2]], t), angle: lerp(finish.angle, .40, t), target, flow: 0};
    }
    if (p < .979) {
      const t = smooth(.952, .979, p);
      return {position: mix3([finish.position[0], 2.16, finish.position[2]], [PARK[0], 2.16, PARK[2]], t), angle: .40, target, flow: 0};
    }
    const t = smooth(.979, 1, p);
    return {position: mix3([PARK[0], 2.16, PARK[2]], PARK, t), angle: lerp(.40, 0, t), target, flow: 0};
  }
  return {position, angle, target, flow: pour.flow};
}
