import * as T from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RGBELoader } from './vendor/RGBELoader.js';
import { drawArt } from './art.js';
import { clamp, smooth, lerp, insideRadius, cupPose, pitcherPose, SPOUT } from './motion.js';
import { cupProfile, pitcherGeometry } from './vessel-geometry.js';

export async function createScene(canvas) {
  const renderer = new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.82;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.VSMShadowMap;
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(40,1,.1,60);
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;controls.dampingFactor=.085;controls.enablePan=false;
  controls.minDistance=4.6;controls.maxDistance=10;controls.minPolarAngle=.03;controls.maxPolarAngle=1.40;
  controls.target.set(-.22,1.2,0);controls.enableZoom=true;
  const pmrem=new T.PMREMGenerator(renderer);
  try{const hdr=await new RGBELoader().loadAsync('./assets/studio.hdr');const env=pmrem.fromEquirectangular(hdr);scene.environment=env.texture;hdr.dispose();}catch{scene.add(new T.HemisphereLight(0xffffff,0x758167,2));}
  pmrem.dispose();scene.environmentIntensity=.48;scene.environmentRotation.y=1.2;
  const key=new T.DirectionalLight('#ffe5c1',3.2);key.position.set(-3,7,4);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:20});
  key.shadow.bias=-.00015;key.shadow.normalBias=.02;key.shadow.radius=6;key.shadow.blurSamples=12;scene.add(key);
  const fill=new T.DirectionalLight('#dae6ff',.4);fill.position.set(4,4,-3);scene.add(fill);
  scene.add(new T.HemisphereLight('#f9e8cc','#32271f',.25));
  const bounce=new T.DirectionalLight('#ffe1b7',.4);bounce.position.set(0,1,6);scene.add(bounce);
  const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.3}));floor.rotation.x=-Math.PI/2;floor.position.y=.012;floor.receiveShadow=true;scene.add(floor);
  // Contact shadows use a radial density texture, independent of camera angle.
  const sc=document.createElement('canvas');sc.width=sc.height=256;const sx=sc.getContext('2d');
  const grad=sx.createRadialGradient(128,128,5,128,128,128);grad.addColorStop(0,'rgba(55,48,25,.24)');grad.addColorStop(.45,'rgba(55,48,25,.14)');grad.addColorStop(1,'rgba(55,48,25,0)');sx.fillStyle=grad;sx.fillRect(0,0,256,256);
  const shadow=new T.Mesh(new T.PlaneGeometry(4.4,4.4),new T.MeshBasicMaterial({map:new T.CanvasTexture(sc),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(.05,.016,.1);scene.add(shadow);
  const micro=document.createElement('canvas');micro.width=micro.height=256;const mc=micro.getContext('2d');const mi=mc.createImageData(256,256);let seed=7;
  for(let i=0;i<mi.data.length;i+=4){seed=(seed*16807)%2147483647;const v=125+(seed%40);mi.data[i]=mi.data[i+1]=mi.data[i+2]=v;mi.data[i+3]=255;}mc.putImageData(mi,0,0);
  const bump=new T.CanvasTexture(micro);bump.wrapS=bump.wrapT=T.RepeatWrapping;bump.repeat.set(4,3);
  const ceramic=new T.MeshPhysicalMaterial({color:'#ded0b5',roughness:.22,metalness:0,clearcoat:.65,clearcoatRoughness:.15,bumpMap:bump,bumpScale:.011});
  const innerCeramic=new T.MeshPhysicalMaterial({color:'#fffcf0',roughness:.16,clearcoat:.65,clearcoatRoughness:.13});
  const steel=new T.MeshPhysicalMaterial({color:'#d6d8d4',metalness:1,roughness:.24,clearcoat:.45,clearcoatRoughness:.24});
  const polished=new T.MeshPhysicalMaterial({color:'#e1e3df',metalness:1,roughness:.13});
  const model=new T.Group();scene.add(model);
  function mesh(g,m,parent=model){const o=new T.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function lathe(path,mat,parent=model){return mesh(new T.LatheGeometry(path.getPoints(72),160),mat,parent);}
  function tube(points,radius,mat,parent=model){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(x=>new T.Vector3(...x))),80,radius,16,false),mat,parent);}
  const saucerP=new T.Path();saucerP.moveTo(0,.055);saucerP.lineTo(.58,.055);saucerP.bezierCurveTo(.9,.055,1.21,.10,1.43,.19);saucerP.quadraticCurveTo(1.51,.23,1.49,.26);saucerP.quadraticCurveTo(1.47,.285,1.43,.268);saucerP.bezierCurveTo(1.08,.14,.86,.15,.62,.13);saucerP.lineTo(0,.13);lathe(saucerP,ceramic);
  const foot=mesh(new T.TorusGeometry(.65,.023,16,128),innerCeramic);foot.rotation.x=Math.PI/2;foot.position.y=.15;
  const cup=new T.Group();cup.position.y=.14;model.add(cup);
  lathe(cupProfile(),ceramic,cup);
  const lip=mesh(new T.TorusGeometry(1.006,.017,24,180),innerCeramic,cup);lip.position.y=1.097;lip.rotation.x=Math.PI/2;
  const handle=tube([[.87,.9,0],[1.2,.94,0],[1.47,.74,0],[1.47,.50,0],[1.27,.31,0],[.7,.28,0]],.086,ceramic,cup);
  handle.scale.z=.86;
  // The liquid remains horizontal as the cup is gently tilted toward the spout.
  const liquidCanvas=document.createElement('canvas');liquidCanvas.width=liquidCanvas.height=1024;
  const ctx=liquidCanvas.getContext('2d');const liquidTexture=new T.CanvasTexture(liquidCanvas);liquidTexture.colorSpace=T.SRGBColorSpace;liquidTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const liquidMat=new T.MeshPhysicalMaterial({map:liquidTexture,roughness:.31,clearcoat:.35,clearcoatRoughness:.32,metalness:0,bumpMap:bump,bumpScale:.0015});
  const liquid=mesh(new T.CircleGeometry(1,160),liquidMat);liquid.rotation.x=-Math.PI/2;liquid.receiveShadow=false;

  const surfacePositions=liquid.geometry.attributes.position;
  const meniscus=mesh(new T.TorusGeometry(1,.011,12,160),new T.MeshPhysicalMaterial({color:'#9d602f',roughness:.32,clearcoat:.4}));meniscus.rotation.x=-Math.PI/2;
  const pitcherRoot=new T.Group();model.add(pitcherRoot);const jug=new T.Group();pitcherRoot.add(jug);
  const spout=new T.Vector3(...SPOUT);jug.position.copy(spout).multiplyScalar(-1);
  // A double-walled, closed profile with a formed spout and rounded steel lip.
  mesh(pitcherGeometry(),steel,jug);
  const rimPoints=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;const aa=Math.atan2(Math.sin(a),Math.cos(a));const narrow=Math.exp(-Math.pow(aa/.34,2));rimPoints.push(new T.Vector3(Math.sin(a)*.427,.97-narrow*.008,Math.cos(a)*.427+narrow*.20));}
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(rimPoints),160,.008,8,false),polished,jug);
  // A flat bent-metal handle with a rectangular cross-section.
  const hs=new T.Shape();hs.moveTo(-.427,.83);hs.bezierCurveTo(-.83,.85,-.94,.76,-.89,.58);hs.lineTo(-.70,.25);hs.quadraticCurveTo(-.62,.16,-.39,.23);hs.lineTo(-.392,.29);hs.quadraticCurveTo(-.57,.23,-.63,.30);hs.lineTo(-.81,.60);hs.quadraticCurveTo(-.91,.82,-.426,.76);hs.closePath();
  const hg=new T.ExtrudeGeometry(hs,{depth:.078,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.009,bevelThickness:.008});
  const jhandle=mesh(hg,steel,jug);jhandle.rotation.y=-Math.PI/2;jhandle.position.x=.04;
  const milkGeometry=new T.BufferGeometry();const milkVertices=new Float32Array(132*9);milkGeometry.setAttribute('position',new T.BufferAttribute(milkVertices,3));
  const jugMilk=mesh(milkGeometry,new T.MeshPhysicalMaterial({color:'#f4e9d1',roughness:.3,clearcoat:.25,side:T.DoubleSide}),jug);jugMilk.castShadow=false;
  function updateJugMilk(angle,height){
    const slope=Math.tan(angle),points=[];
    for(let i=0;i<128;i++){const a=i/128*Math.PI*2;const r=(.375+.043*(height-.075))/(1-.043*slope*Math.cos(a));const z=Math.cos(a)*r;points.push(new T.Vector3(Math.sin(a)*r,height+z*slope,z));}
    let polygon=points;
    for(const [bound,sign]of [[.949,1],[.078,-1]]){
      const next=[];
      for(let i=0;i<polygon.length;i++){
        const a=polygon[i],b=polygon[(i+1)%polygon.length],insideA=sign*(a.y-bound)<=0,insideB=sign*(b.y-bound)<=0;
        if(insideA)next.push(a);
        if(insideA!==insideB)next.push(a.clone().lerp(b,(bound-a.y)/(b.y-a.y)));
      }
      polygon=next;
    }
    if(polygon.length<3){jugMilk.visible=false;return;}jugMilk.visible=true;
    const center=new T.Vector3();polygon.forEach(p=>center.add(p));center.divideScalar(polygon.length);
    let offset=0;for(let i=0;i<polygon.length;i++){for(const p of [center,polygon[i],polygon[(i+1)%polygon.length]]){milkVertices[offset++]=p.x;milkVertices[offset++]=p.y;milkVertices[offset++]=p.z;}}
    milkGeometry.setDrawRange(0,offset/3);milkGeometry.attributes.position.needsUpdate=true;milkGeometry.computeVertexNormals();milkGeometry.computeBoundingSphere();
  }
  const stream=mesh(new T.CylinderGeometry(1,1,1,20,30,true),new T.MeshPhysicalMaterial({color:'#fff5df',roughness:.24,clearcoat:.3}));stream.visible=false;stream.castShadow=false;
  const filmVertices=[],filmIndices=[];
  for(let i=0;i<=12;i++){const t=i/12,w=lerp(.032,.011,t);filmVertices.push(-w,lerp(.949,SPOUT[1],t),lerp(.41,SPOUT[2],t),w,lerp(.949,SPOUT[1],t),lerp(.41,SPOUT[2],t));if(i<12){const n=i*2;filmIndices.push(n,n+1,n+2,n+1,n+3,n+2);}}
  const filmGeometry=new T.BufferGeometry();filmGeometry.setAttribute('position',new T.Float32BufferAttribute(filmVertices,3));filmGeometry.setIndex(filmIndices);filmGeometry.computeVertexNormals();
  const milkFilm=mesh(filmGeometry,new T.MeshPhysicalMaterial({color:'#fff5df',roughness:.24,side:T.DoubleSide}),jug);milkFilm.castShadow=false;
  const impact=mesh(new T.SphereGeometry(1,32,16),new T.MeshPhysicalMaterial({color:'#f8ebcd',roughness:.28}));impact.visible=false;impact.castShadow=false;
  const up=new T.Vector3(0,1,0),a=new T.Vector3(),b=new T.Vector3(),dir=new T.Vector3();
  const targetCamera=new T.Vector3();let cameraMoving=false,cameraView='studio';
  const views={studio:[1.45,4.25,4.85],top:[0,7.1,.01],close:[.4,4.3,4.6]};
  function setCamera(view,instant=false){cameraView=view;targetCamera.set(...views[view]);if(view==='studio' && canvas.clientWidth<450)targetCamera.multiplyScalar(1.04);if(instant){camera.position.copy(targetCamera);controls.target.set(-.22,1.2,0);controls.update();}else cameraMoving=true;}
  controls.addEventListener('start',()=>{cameraMoving=false;});
  setCamera('studio',true);
  let needsRender=true,lastSceneProgress=-1,lastScenePattern='';
  // Preserve horizontal room for the parked pitcher on narrow screens.
  const observer=new ResizeObserver(()=>{const {width,height}=canvas.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(40)/2)*Math.max(1,1.28/camera.aspect)));camera.updateProjectionMatrix();needsRender=true;});observer.observe(canvas);
  let lastArt=-1,lastPattern='';
  function update(pattern,p,preview,dt){
    const progress=preview?1:p;
    if(lastSceneProgress===progress&&lastScenePattern===pattern&&!cameraMoving){const moved=controls.update();if(moved||needsRender){renderer.render(scene,camera);needsRender=false;}return;}
    lastSceneProgress=progress;lastScenePattern=pattern;
    const {level,tilt,y:cupY,centerZ,radius}=cupPose(progress);
    const pose=pitcherPose(pattern,progress);
    cup.rotation.x=tilt;cup.position.y=cupY;
    const heightFromCup=level-cupY;
    liquid.position.set(0,level,centerZ);
    for(let i=1;i<surfacePositions.count;i++){const angle=(i-1)/160*Math.PI*2,cs=Math.cos(angle),sn=-Math.sin(angle);let r=radius;for(let n=0;n<4;n++)r=insideRadius(heightFromCup/Math.cos(tilt)+r*sn*Math.tan(tilt));surfacePositions.setXY(i,r*cs,-r*sn/Math.cos(tilt));}
    surfacePositions.needsUpdate=true;
    meniscus.visible=Math.abs(tilt)<.005;meniscus.position.copy(liquid.position);meniscus.scale.set(radius,radius,1);
    pitcherRoot.position.set(...pose.position);
    pitcherRoot.rotation.set(pose.angle,0,0);
    const active=pose.flow>.0001;
    // Keep the interior milk continuous even when a tulip pulse stops.
    const milkHeight=Math.min(lerp(.73,.35,smooth(.075,.93,progress)),.964-.43*Math.tan(pose.angle));
    updateJugMilk(pose.angle,milkHeight);
    milkFilm.visible=active;milkFilm.scale.x=clamp(pose.flow/.033,.3,1);
    stream.visible=active;impact.visible=active&&progress>.33;
    if(stream.visible){a.copy(pitcherRoot.position);b.set(...pose.target);b.y+=.002;dir.subVectors(a,b);stream.position.copy(a).add(b).multiplyScalar(.5);stream.scale.set(pose.flow,dir.length(),pose.flow);stream.quaternion.setFromUnitVectors(up,dir.normalize());impact.position.copy(b);impact.scale.set(pose.flow*1.4,.008,pose.flow*1.4);}
    if(lastPattern!==pattern||Math.abs(lastArt-progress)>.0013){drawArt(ctx,1024,pattern,progress,preview);liquidTexture.needsUpdate=true;lastArt=progress;lastPattern=pattern;}
    if(cameraMoving){const k=1-Math.exp(-dt*5);camera.position.lerp(targetCamera,k);controls.target.lerp(new T.Vector3(-.22,cameraView==='top'?.5:1.2,0),k);if(camera.position.distanceTo(targetCamera)<.01)cameraMoving=false;}
    controls.update();renderer.render(scene,camera);needsRender=false;
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();document.dispatchEvent(new CustomEvent('studio-context-lost'));});
  return{update,setCamera,renderer,scene,camera};
}
