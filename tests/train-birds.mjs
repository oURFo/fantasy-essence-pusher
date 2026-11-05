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


// Only resolved shots that hit nothing contribute their actual paid coin tier.
const emptyShot=(g,bet)=>{g.setBet(bet);g.aim(10,150);assert.ok(g.shoot());for(let i=0;i<40;i++)g.step();};
const spawnCandidate=g=>{g.birds=[];g.random=()=>.5;g.nextBird=g.time;g.step();return g.birds[0].kind;};
{
 const g=game();for(let i=0;i<33;i++)emptyShot(g,3);assert.equal(spawnCandidate(g),'freeze','99 missed coins cannot spawn rage');g.nextBird=Infinity;
 emptyShot(g,1);assert.equal(spawnCandidate(g),'rage','100 missed coins unlock chance for rage');assert.equal(spawnCandidate(g),'freeze','rage appearance consumes eligibility even before being hit');
 g.nextBird=Infinity;for(let i=0;i<33;i++)emptyShot(g,3);assert.equal(spawnCandidate(g),'freeze');g.nextBird=Infinity;emptyShot(g,1);assert.equal(spawnCandidate(g),'rage','must earn another 100 after appearance');
}
{
 const g=game();g.targets=[];g.spawn(500,0);g.random=()=>.999999;for(let i=0;i<100;i++){const t=g.targets.find(t=>t.live);g.aim(t.x,t.bottom-t.h/2);assert.ok(g.shoot());for(let j=0;j<40;j++)g.step();}assert.equal(spawnCandidate(g),'freeze','hits without breaking are not empty shots');
}
{
 const g=game();g.activateBuff('rapid');g.birds=[{id:1,kind:'rage',x:500,y:295,speed:105}];g.aim(500,295);g.setAuto(true);g.shoot();for(let i=0;i<60;i++)g.step();assert.equal(g.auto,false);assert.equal(g.rageReady,true,'same-frame auto step must not consume the new golden shot');assert.ok(g.shots.every(s=>!s.rage));const paid=g.spent;for(let i=0;i<60;i++)g.step();assert.equal(g.spent,paid);assert.equal(g.rageReady,true);g.aim(500,500);assert.ok(g.shoot());assert.equal(g.rageReady,false);assert.ok(g.shots.at(-1).rage);
}
console.log('Rage eligibility passed: resolved empty shots by actual coins, 99/100 boundary, reset on appearance, hits excluded and auto interrupted without spending golden shot.');
