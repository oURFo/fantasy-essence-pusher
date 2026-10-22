import assert from 'node:assert/strict';
import {FATE_BOARD,FATE_PINS} from '../src/fate-rules.ts';
import {launchFateBall,stepFateBall} from '../src/fate-physics.ts';
function shot(angle,start){const b=launchFateBall(angle);for(let i=0;i<4000&&!b.done;i++)stepFateBall(b,start+i/120);assert.ok(b.done);return b;}
assert.equal(FATE_BOARD.slopeGravity,3.6);assert.equal(FATE_BOARD.speed,4.6);
assert.ok(FATE_PINS.some(p=>p.x===0&&p.y<3),'straight launcher line meets a physical splitter');
const accelerating=launchFateBall(0);Object.assign(accelerating,{x:3.25,y:.7,vx:0,vy:0});for(let i=0;i<60;i++)stepFateBall(accelerating,i/120);assert.ok(accelerating.vy>1.7,'slope acceleration must be clearly stronger after slowing down');
const angles=[];for(let angle=-55;angle<=55;angle+=5){const counts=Array(9).fill(0);let expired=0;for(let n=0;n<300;n++){const b=shot(angle,n/300*120);if(b.lane===null)expired++;else counts[b.lane]++;}angles.push({angle,samples:300,counts,fateRate:counts[4]/300,expired});}
const counts=Array(9).fill(0);let expired=0;
for(let n=0;n<3000;n++){const b=shot(0,n/3000*120);if(b.lane===null)expired++;else counts[b.lane]++;}
const straightRate=counts[4]/3000,best=angles.reduce((a,b)=>a.fateRate>b.fateRate?a:b);
assert.ok(straightRate<=.05,'straight shots must not provide an easy fate route');
assert.ok(best.fateRate<.25,'one fixed angle must not bypass the physical obstacles');
assert.ok(best.fateRate>0,'fate remains physically reachable');
assert.notEqual(shot(0,0).lane,4,'first straight shot must meet the redesigned obstacles');
console.log(JSON.stringify({model:'Deterministic physical outcomes across 120 seconds of obstacle phases; no weighted acceptance.',straight:{samples:3000,counts,fateRate:straightRate,expired},bestFixedAngle:best,angles},null,2));
