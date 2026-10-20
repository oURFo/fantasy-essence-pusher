import assert from 'node:assert/strict';import R from '@dimforge/rapier3d-compat';
import {SKY_FRONT,skyProject,skyExitEdges} from '../src/sky-geometry.ts';import {SkyWings} from '../src/sky-game.ts';
const edges=skyExitEdges(),width=edges[3]-edges[0];
for(let i=0;i<3;i++)assert.ok(Math.abs(edges[i+1]-edges[i]-width/3)<1e-8,'three visible zones must have equal width');
assert.ok(Math.abs(edges[1]-skyProject(-SKY_FRONT.rewardHalfWidth,0,SKY_FRONT.edgeZ).x)<1e-8);
assert.ok(Math.abs(edges[2]-skyProject(SKY_FRONT.rewardHalfWidth,0,SKY_FRONT.edgeZ).x)<1e-8);
assert.equal(skyProject(SKY_FRONT.rewardHalfWidth,0,8).x,edges[2],'falling beads must not gain lateral perspective beyond the edge');
await R.init();
for(const [fraction,reward] of [[.1,false],[1/3-.002,false],[1/3+.002,true],[.5,true],[2/3-.002,true],[2/3+.002,false],[.9,false]]){
 const pixel=edges[0]+width*fraction,x=(fraction*2-1)*SKY_FRONT.halfWidth;
 assert.equal(pixel>edges[1]&&pixel<edges[2],reward);
 const g=new SkyWings(undefined,()=>0,()=>.5),coin=g.coins[0];coin.body.setTranslation({x,y:-4.1,z:7.2},true);g.step();
 assert.equal(coin.exitZone,reward?'reward':'recycle','visible zone must match physical result');assert.equal(g.gold,1000+(reward?1:0));g.dispose();
}
console.log('Front layout passed: equal thirds, aligned reward dividers, stable fall projection, physical rewards match visible zones.');
