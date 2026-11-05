import assert from 'node:assert/strict';
import {WonderTrain} from '../src/train-game.ts';
import {PlayerWallet} from '../src/wallet.ts';
import {trainSeed} from '../src/train-rules.ts';
const game=()=>{const wallet=new PlayerWallet();wallet.setBalance(10000);const g=new WonderTrain(wallet,undefined,trainSeed(15));g.nextBird=Infinity;return g;};
{
 const g=game();g.activateBuff('rapid');assert.equal(g.shotInterval,.2);g.setAuto(true);for(let i=0;i<60;i++)g.step();assert.equal(g.fired,5);assert.equal(g.spent,5);g.time=15;assert.equal(g.shotInterval,.5);
}
{
 const g=game();const t=g.targets[1],before=t.x;g.activateBuff('freeze');for(let i=0;i<300;i++)g.step();assert.equal(t.x,before);assert.equal(g.worldTime,0);assert.ok(g.time>4.9);g.time=10;g.step();assert.ok(t.x>before);
}
{
 const g=game();g.targets=[];g.spawn(500,0);g.random=()=>.999999;const t=g.targets[0];g.activateBuff('rage');g.aim(t.x,t.bottom-t.h/2);assert.ok(g.shoot());assert.equal(g.rageReady,false);assert.ok(g.shots[0].rage);assert.equal(g.shoot(),false);for(let i=0;i<150;i++)g.step();assert.equal(g.broken,3);assert.ok(g.points>0);assert.equal(g.wallet.gold,10020);
}
for(const kind of ['rapid','rage','freeze']){
 const g=game();g.birds=[{id:1,kind,x:500,y:295,speed:105}];g.aim(500,295);g.shoot();for(let i=0;i<45;i++)g.step();assert.equal(g.birds.length,0);assert.equal(g.buffEvent.kind,kind);assert.equal(g.broken,0);assert.equal(g.spent,1);
}
{
 const g=game();g.nextBird=0;g.step();assert.equal(g.birds.length,1);assert.ok(g.nextBird>=24&&g.nextBird<=47);g.dispose();assert.equal(g.birds.length,0);assert.equal(g.shoot(),false);
}
console.log('Train birds passed: moving target hits, paid 5/s rapid fire, 15s expiry, 10s world-only freeze, next-shot guaranteed chain destruction and disposal.');

