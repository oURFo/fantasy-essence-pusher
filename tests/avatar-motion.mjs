import assert from 'node:assert/strict';
import {avatarPose,WALK_STRIDE} from '../src/avatar-motion.ts';
import {avatarComponents,spriteSilhouette} from '../src/avatar-rendering.ts';
import {LobbyWorld,HALL} from '../src/lobby-world.ts';
const w=new LobbyWorld();w.choose('male');
w.step(1/60,1,0);assert.equal(w.direction,'right');assert.equal(w.walkDistance,HALL.speed/60);assert.equal(avatarPose(w.direction,true,w.walkDistance).row,1);
w.step(1/60,-1,0);assert.equal(w.direction,'left');assert.ok(avatarPose(w.direction,true,w.walkDistance).flip);
w.step(1/60,0,-1);assert.equal(w.direction,'up');assert.equal(avatarPose(w.direction,true,w.walkDistance).row,2);
w.step(1/60,0,1);assert.equal(w.direction,'down');assert.equal(avatarPose(w.direction,true,w.walkDistance).row,0);
for(let i=0;i<6;i++)assert.equal(avatarPose('right',true,WALK_STRIDE*(i+.1)/6).column,i);
assert.equal(avatarPose('right',true,WALK_STRIDE).column,0);
for(const d of ['down','up','left','right']){assert.equal(avatarPose(d,false,200).row,3);assert.equal(avatarPose(d,true,200,true).row,3);}
const a=new LobbyWorld(),b=new LobbyWorld();a.choose('male');b.choose('male');for(let i=0;i<60;i++)a.step(1/60,1,0);for(let i=0;i<30;i++)b.step(1/30,1,0);assert.ok(Math.abs(a.walkDistance-b.walkDistance)<1e-8,'equal travel gives equal gait at different frame rates');
w.moveTo(65,HALL.aisleTop);for(let i=0;i<500;i++)w.step(1/60);const distance=w.walkDistance;for(let i=0;i<100;i++)w.step(1/60,-1,-1);assert.equal(w.walkDistance,distance,'no gait advancement against bounds');assert.equal(w.walking,false);
w.approach('sky-wings');for(let i=0;i<500;i++)w.step(1/60);assert.equal(w.direction,'up');assert.equal(w.walking,false);assert.equal(w.nearby.id,'sky-wings');assert.equal(w.y,HALL.aisleTop);
const W=30,H=30,pixels=new Uint8ClampedArray(W*H*4);function box(x,y,w,h,alpha=255){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)pixels[(j*W+i)*4+3]=alpha;}
box(10,5,8,20);box(1,1,2,2);box(28,28,1,1,50);const silhouette=spriteSilhouette(pixels,W,H);assert.equal(silhouette.area,160);assert.equal(silhouette.pixels[W+1],0,'detached atlas fragments are discarded');assert.equal(silhouette.anchorX,13.5);assert.equal(silhouette.bottom-2,25);
const aw=120,ah=120,atlas=new Uint8ClampedArray(aw*ah*4);for(let row=0;row<4;row++)for(let col=0;col<(row===3?3:6);col++){const x=col*20+6,y=row*29+3+(col%2);for(let j=y;j<y+23;j++)for(let i=x;i<x+9;i++)atlas[(j*aw+i)*4+3]=255;}
const parts=avatarComponents(atlas,aw,ah);assert.equal(parts.length,21);assert.ok(parts[0].left<parts[1].left);assert.ok(parts[6].top>parts[0].top);assert.ok(parts[18].top>parts[12].top);assert.throws(()=>avatarComponents(new Uint8ClampedArray(400),10,10));
console.log('Avatar motion passed: four directions, six distance-paced poses, idle/reduced motion, FPS independence, collision stops, machine-facing arrival and complete alpha silhouettes.');
