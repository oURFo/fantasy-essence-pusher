import assert from 'node:assert/strict';import R from '@dimforge/rapier3d-compat';
import {SkyWings} from '../src/sky-game.ts';import {prizeSlotIndex} from '../src/config.ts';import {SKY_PEGS} from '../src/sky-rules.ts';
await R.init();const n=700,counts=Array(7).fill(0);let stuck=0,deflected=0;
for(let i=0;i<n;i++){
 const g=new SkyWings();for(const c of g.coins)g.world.removeRigidBody(c.body);g.coins=[];
 const x=-3.15+(i+.5)/n*6.3;g.dropX=x;g.drop();const c=g.coins.at(-1);let crossed=false,shift=0;
 for(let f=0;f<1200;f++){g.step();const p=c.body.translation();shift=Math.max(shift,Math.abs(p.x-x));if(c.slotChecked){counts[prizeSlotIndex(p.x)]++;crossed=true;break;}}
 if(!crossed)stuck++;if(shift>.4)deflected++;g.dispose();
}
assert.equal(stuck,0);assert.ok(counts.every(c=>c>0));assert.ok(deflected/n>=.9);
for(const peg of SKY_PEGS){const g=new SkyWings();g.drop();const c=g.coins.at(-1);c.body.setTranslation({x:peg.x,y:peg.y+.36,z:.25},true);c.body.setLinvel({x:0,y:0,z:0},true);for(let f=0;f<90;f++)g.step();assert.ok(c.body.translation().y<peg.y-.3,'center-top contact must release');g.dispose();}
console.log(JSON.stringify({sky:true,n,counts,stuck,deflected,basicRewardRate:(counts[2]+counts[4])/n,azureRewardRate:(counts[2]+counts[3]+counts[4])/n,goldRewardRate:counts[3]/n}));
