import test from 'node:test';
import assert from 'node:assert/strict';
import {cupPose,pitcherPose,SPOUT} from '../dist/motion.js';
import {cupProfile,pitcherGeometry} from '../dist/vessel-geometry.js';

const profile=cupProfile().getPoints(120);
const geometry=pitcherGeometry(),vertices=geometry.attributes.position;
// Conservative radial envelope includes the ceramic lip and a clearance margin.
const step=.001,outer=[],inner=[];
for(let j=0;j<=1150;j++){
  const y=j*step,xs=[];
  for(let i=0;i<profile.length-1;i++){
    const a=profile[i],b=profile[i+1];
    if((a.y<=y&&b.y>y)||(b.y<=y&&a.y>y))xs.push(a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y));
  }
  outer[j]=xs.length?Math.max(...xs):0;inner[j]=xs.length?Math.min(...xs):0;
  if(Math.abs(y-1.097)<.020){outer[j]=Math.max(outer[j],1.026);inner[j]=inner[j]?Math.min(inner[j],.986):.986;}
}
const samples=[];
// Sampling across profile and azimuth covers the front belly, base and spout.
for(let i=0;i<vertices.count;i+=3)samples.push([vertices.getX(i)-SPOUT[0],vertices.getY(i)-SPOUT[1],vertices.getZ(i)-SPOUT[2]]);

for(const pattern of ['heart','tulip','rosetta']){
  test(`${pattern}: pitcher clears the ceramic and coffee throughout the animation`,()=>{
    for(let frame=0;frame<=1600;frame++){
      const p=frame/1600,cup=cupPose(p),pose=pitcherPose(pattern,p),cs=Math.cos(pose.angle),sn=Math.sin(pose.angle),cc=Math.cos(cup.tilt),sc=Math.sin(cup.tilt);
      for(const [x,y,z]of samples){
        const wx=x+pose.position[0],wy=y*cs-z*sn+pose.position[1],wz=y*sn+z*cs+pose.position[2];
        const cy=(wy-cup.y)*cc+wz*sc,cz=-(wy-cup.y)*sc+wz*cc;
        const idx=Math.round(cy/step),r=Math.hypot(wx,cz);
        if(idx>=0&&idx<outer.length&&outer[idx]&&r>inner[idx]-.012&&r<outer[idx]+.012){
          assert.fail(`${pattern} intersects ceramic at p=${p.toFixed(5)}, point=${[wx,wy,wz].map(n=>n.toFixed(3))}, cup-local=[${r.toFixed(3)},${cy.toFixed(3)}], angle=${pose.angle.toFixed(3)}`);
        }
        if(wy<cup.level-.008&&Math.hypot(wx,wz-cup.centerZ)<cup.radius-.025){assert.fail(`${pattern} enters coffee at p=${p.toFixed(5)}`);}
      }
    }
  });
  test(`${pattern}: continuous pose and stream at stage boundaries`,()=>{
    const boundaries=[0,.027,.054,.075,.087,.3,.32,.35,.36,.4,.44,.79,.8,.81,.812,.832,.925,.93,.952,.979,1];
    for(let i=0;i<=4;i++)boundaries.push(.35+.44*i/4);
    for(const p of boundaries){
      const a=pitcherPose(pattern,Math.max(0,p-1e-7)),b=pitcherPose(pattern,Math.min(1,p+1e-7));
      assert.ok(Math.hypot(...a.position.map((x,i)=>x-b.position[i]))<.0002,`${pattern} position jumps at ${p}`);
      assert.ok(Math.abs(a.angle-b.angle)<.0002,`${pattern} angle jumps at ${p}`);
      assert.ok(Math.abs(a.flow-b.flow)<.00002,`${pattern} flow jumps at ${p}`);
    }
  });
}
