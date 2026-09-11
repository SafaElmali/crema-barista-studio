import * as T from './vendor/three.module.js';
import {clamp} from './motion.js';

// Shared mesh factories let clearance checks use the same surfaces as the scene.
export function cupProfile() {
  const path = new T.Path();
  path.moveTo(0,0);path.lineTo(.44,0);path.quadraticCurveTo(.55,0,.59,.10);
  path.bezierCurveTo(.68,.23,.92,.52,1.006,.94);path.quadraticCurveTo(1.045,1.075,1.022,1.105);
  path.quadraticCurveTo(1.002,1.139,.978,1.10);path.bezierCurveTo(.9,.7,.65,.27,.50,.18);
  path.quadraticCurveTo(.46,.14,.40,.14);path.lineTo(0,.14);
  return path;
}

export function pitcherGeometry() {
  const path = new T.Path();path.moveTo(0,.02);path.lineTo(.345,.02);path.quadraticCurveTo(.397,.02,.398,.065);
  path.lineTo(.433,.94);path.quadraticCurveTo(.437,.975,.425,.976);path.lineTo(.412,.95);path.lineTo(.375,.075);path.lineTo(0,.075);
  const geometry = new T.LatheGeometry(path.getPoints(60),160), pos = geometry.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),a=Math.atan2(x,z);
    const narrow=Math.exp(-Math.pow(a/.34,2)),top=Math.pow(clamp((y-.48)/.49),2.3);
    pos.setZ(i,z+narrow*top*.205);pos.setY(i,y-narrow*top*.008);
  }
  geometry.computeVertexNormals();return geometry;
}
