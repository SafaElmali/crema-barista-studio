export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const mix3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

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
