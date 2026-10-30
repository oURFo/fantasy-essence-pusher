import assert from 'node:assert/strict';
import {WALK_STRIDE} from '../src/avatar-motion.ts';
import {AVATAR_RIG,rigMotion,rigMount,figurePlacement,neckAnchor} from '../src/avatar-rig.ts';
import {LobbyWorld,HALL} from '../src/lobby-world.ts';
const w=new LobbyWorld();w.choose('male');
w.step(1/60,1,0);assert.equal(w.direction,'right');assert.equal(w.walkDistance,HALL.speed/60);assert.equal(rigMotion(w.direction,true,w.walkDistance).view,1);
w.step(1/60,-1,0);assert.equal(w.direction,'left');assert.ok(rigMotion(w.direction,true,w.walkDistance).flip);
w.step(1/60,0,-1);assert.equal(w.direction,'up');assert.equal(rigMotion(w.direction,true,w.walkDistance).view,2);
w.step(1/60,0,1);assert.equal(w.direction,'down');assert.equal(rigMotion(w.direction,true,w.walkDistance).view,0);
assert.equal(rigMotion('right',true,WALK_STRIDE).frame,0);
for(const d of ['down','up','left','right']){assert.equal(rigMotion(d,false,200).active,false);assert.equal(rigMotion(d,true,200,true).active,false);}
const a=new LobbyWorld(),b=new LobbyWorld();a.choose('male');b.choose('male');for(let i=0;i<60;i++)a.step(1/60,1,0);for(let i=0;i<30;i++)b.step(1/30,1,0);assert.ok(Math.abs(a.walkDistance-b.walkDistance)<1e-8,'equal travel gives equal gait at different frame rates');
w.moveTo(65,HALL.aisleTop);for(let i=0;i<500;i++)w.step(1/60);const distance=w.walkDistance;for(let i=0;i<100;i++)w.step(1/60,-1,-1);assert.equal(w.walkDistance,distance,'no gait advancement against bounds');assert.equal(w.walking,false);
w.approach('sky-wings');for(let i=0;i<500;i++)w.step(1/60);assert.equal(w.direction,'up');assert.equal(w.walking,false);assert.equal(w.nearby.id,'sky-wings');assert.equal(w.y,HALL.aisleTop);
assert.equal(AVATAR_RIG.id,'shared-v3');
assert.deepEqual(rigMotion('right',true,54),rigMotion('right',true,54));
for(const direction of ['down','right','up','left']){assert.equal(rigMotion(direction,false,200).bob,0);assert.equal(rigMotion(direction,true,200,true).active,false);assert.ok(rigMount('cap',direction).w>0);}
assert.equal(rigMotion('left',true,54).flip,true);
assert.equal(rigMotion('up',true,54).view,2);
for(let i=0;i<4;i++)assert.equal(rigMotion('right',true,WALK_STRIDE*(i+.1)/4).frame,i);
assert.throws(()=>neckAnchor(new Uint8ClampedArray(400),10,10));
console.log('Shared rig: four directions, distance-paced complete poses, reduced motion and common mounts passed.');

for(const [w,h] of [[432,826],[451,832],[339,826]]){const p=figurePlacement(w,h);assert.equal(p.height,136);assert.ok(Math.abs(p.width/w-p.height/h)<1e-9,'whole-figure uniform scale');assert.equal(p.x+p.width/2,AVATAR_RIG.frameWidth/2);}
assert.throws(()=>figurePlacement(0,10));
