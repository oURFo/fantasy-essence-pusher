import assert from 'node:assert/strict';
import {avatarPose,WALK_STRIDE} from '../src/avatar-motion.ts';
import {AVATAR_RIG,rigMotion,rigMount} from '../src/avatar-rig.ts';
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
assert.equal(AVATAR_RIG.id,'shared-v2');
assert.deepEqual(rigMotion('right',true,54),rigMotion('right',true,54));
for(const direction of ['down','right','up','left']){assert.equal(rigMotion(direction,false,200).bob,0);assert.equal(rigMotion(direction,true,200,true).active,false);assert.ok(rigMount('cap',direction).w>0);}
assert.equal(rigMotion('left',true,54).flip,true);
assert.equal(rigMotion('up',true,54).view,2);
assert.notEqual(rigMotion('right',true,20).legs[0].thigh,rigMotion('right',true,20).legs[1].thigh);
console.log('Shared rig: four directions, distance-paced articulated gait, reduced motion and common mounts passed.');
