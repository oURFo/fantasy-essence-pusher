import assert from 'node:assert/strict';
import {WonderTrain} from '../src/train-game.ts';
import {PlayerWallet} from '../src/wallet.ts';
import {trainSeed} from '../src/train-rules.ts';
const make=()=>{const w=new PlayerWallet();w.setBalance(10000);const g=new WonderTrain(w,undefined,trainSeed(3));g.nextBird=Infinity;g.targets=[];g.spawn(500,0);return g;};
{
 const g=make(),t=g.targets[1];g.setAuto(true);assert.ok(g.beginLock(t.x,t.bottom-t.h/2));for(let i=0;i<30;i++)g.step();assert.equal(g.lockId,null);assert.equal(g.fired,0);for(let i=0;i<31;i++)g.step();assert.equal(g.lockId,t.id);assert.equal(g.fired,0,'no shots during long press');g.cancelLockHold();g.random=()=>.999999;for(let i=0;i<10;i++)g.step();assert.ok(g.fired>0);assert.ok(g.shots.every(s=>s.targetId===t.id));assert.equal(g.aimPoint.x,t.x);const id=t.id;g.freezeUntil=g.time+10;const x=t.x;for(let i=0;i<30;i++)g.step();assert.equal(g.aimPoint.x,x);assert.equal(g.lockId,id);g.clearLock();assert.equal(g.lockId,null);
}
{
 const g=make(),t=g.targets[0];g.beginLock(t.x,t.bottom-t.h/2);for(let i=0;i<10;i++)g.step();g.cancelLockHold();for(let i=0;i<70;i++)g.step();assert.equal(g.lockId,null,'cancelled short hold cannot lock');assert.equal(g.beginLock(10,120),false);
}
{
 const g=make(),t=g.targets[0];g.beginLock(t.x,t.bottom-t.h/2);for(let i=0;i<61;i++)g.step();g.cancelLockHold();for(let i=0;i<1100;i++)g.step();assert.equal(g.lockId,null,'lock expires on leaving viewport before wrap');
}
{
 const g=make(),t=g.targets[1];g.beginLock(t.x,t.bottom-t.h/2);for(let i=0;i<61;i++)g.step();g.cancelLockHold();assert.equal(g.lockId,t.id);g.impact(g.targets[0],1,true);assert.equal(g.lockId,null,'destroying support and locked upper item clears tracking');g.dispose();assert.equal(g.lockHold,null);
}
console.log('Train lock passed: 1s hold, no premature spending, tracking selected layer, freeze, cancel, destruction and offscreen release.');
{
 const g=make(),t=g.targets[1];g.beginLock(t.x,t.bottom-t.h/2);for(let i=0;i<61;i++)g.step();g.cancelLockHold();g.birds=[{id:1,kind:'freeze',x:t.x,y:t.bottom-t.h/2,speed:105}];g.shoot();assert.equal(g.shots[0].targetId,t.id,'flying bird cannot steal a locked shot');assert.equal(g.shots[0].birdId,undefined);
}
