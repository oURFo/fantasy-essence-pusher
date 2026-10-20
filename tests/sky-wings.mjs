import assert from 'node:assert/strict';
import R from '@dimforge/rapier3d-compat';
import {SkyRules,SKY_TIERS,selectSkyPrize} from '../src/sky-rules.ts';
import {SkyWings} from '../src/sky-game.ts';
import {PlayerWallet} from '../src/wallet.ts';
import {ArcadeSession} from '../src/arcade-session.ts';
const tick=(r,seconds)=>{let payout=0;for(let i=0;i<Math.round(seconds*60);i++)payout+=r.update(1/60);return payout;};
for(let tier=0;tier<3;tier++){
 const c=SKY_TIERS[tier];assert.equal(c.weights.reduce((a,b)=>a+b,0),10000);
 const counts=Array(8).fill(0);for(let i=0;i<10000;i++)counts[selectSkyPrize(tier,(i+.5)/10000)]++;
 assert.deepEqual(counts,[...c.weights]);assert.equal(selectSkyPrize(tier,1),7);
 for(let i=0,start=0;i<8;start+=c.weights[i++]){
  const r=new SkyRules(()=>(start+c.weights[i]/2)/10000);r.tier=tier;r.remaining=c.duration;r.trigger();
  const payout=tick(r,3.3),expected=c.rewards[i];assert.equal(r.prizeIndex,i);
  assert.equal(payout,expected);assert.equal(r.phase,expected===0?'upgrading':'result');
  const normalized=((r.angle+i*Math.PI/4)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);assert.ok(normalized<1e-7||2*Math.PI-normalized<1e-7,'pointer must align to selected sector');
 }
}
assert.equal(SKY_TIERS[0].weights[1]+SKY_TIERS[0].weights[5],300);assert.equal(SKY_TIERS[1].weights[1]+SKY_TIERS[1].weights[5],150);
let r=new SkyRules(()=>.355);r.trigger();tick(r,3.22);assert.equal(r.phase,'upgrading');tick(r,9.95);assert.equal(r.tier,0);tick(r,.05);assert.equal(r.tier,1);assert.equal(r.remaining,300);
tick(r,299.98);assert.equal(r.tier,1);tick(r,.04);assert.equal(r.phase,'descending');tick(r,2);assert.equal(r.tier,0);assert.equal(r.remaining,0);
r=new SkyRules(()=>.353);r.tier=1;r.remaining=300;r.trigger();tick(r,3.22);assert.equal(r.phase,'upgrading');tick(r,10);assert.equal(r.tier,2);assert.equal(r.remaining,100);tick(r,100);tick(r,2.02);assert.equal(r.tier,0);
r=new SkyRules(()=>.353);r.tier=1;r.remaining=1;r.trigger();r.trigger();assert.equal(tick(r,3.3),5,'expired wing pays fallback');assert.equal(r.phase,'result');assert.equal(r.queue,1);tick(r,3.5);assert.equal(r.tier,0);assert.equal(r.spinTier,0);assert.equal(r.phase,'spinning');
await R.init();
const wallet=new PlayerWallet();let g=new SkyWings(wallet,()=>.355);g.setAutoDrop(true);g.sky.trigger();for(let i=0;i<195;i++)g.step();assert.equal(g.sky.phase,'upgrading');
const frozen={time:g.time,gold:g.gold,count:g.coins.length};for(let i=0;i<590;i++)g.step();assert.equal(g.time,frozen.time);assert.equal(g.gold,frozen.gold);assert.equal(g.coins.length,frozen.count);assert.equal(g.drop(),false);for(let i=0;i<15;i++)g.step();assert.equal(g.sky.tier,1);assert.equal(g.autoDrop,true);assert.ok(g.time>frozen.time);g.dispose();
for(let tier=0;tier<3;tier++)for(let lane=0;lane<7;lane++){
 g=new SkyWings(new PlayerWallet(),()=>0);g.sky.tier=tier;g.sky.remaining=SKY_TIERS[tier].duration;g.drop();const c=g.coins.at(-1);c.body.setTranslation({x:-3.65+(lane+.5)*7.3/7,y:2,z:.25},true);g.step();
 assert.equal(g.sky.queue,SKY_TIERS[tier].lanes.includes(lane)?1:0);assert.equal(c.slotChecked,true);g.step();assert.ok(g.sky.spins+g.sky.queue<=1);assert.equal(g.slot.spins,0);g.dispose();
}
g=new SkyWings(new PlayerWallet(),()=>.97);g.sky.tier=2;g.sky.remaining=100;g.sky.trigger();for(let i=0;i<200;i++)g.step();assert.equal(g.sky.lastAmount,1000);assert.equal(g.bonusSpawned+g.pendingBonuses.length,1000);
// Clear active bodies to isolate long payout accounting from physical bed capacity.
for(let i=0;i<90*60;i++){for(const c of g.coins)g.world.removeRigidBody(c.body);g.coins=[];g.step();}assert.equal(g.bonusSpawned,1000);assert.equal(g.pendingBonuses.length,0);g.dispose();
for(const [x,reward] of [[0,true],[1,true],[1.5,false],[-1.5,false]]){
 g=new SkyWings();const c=g.coins[0];c.body.setTranslation({x,y:-4.2,z:7.1},true);g.step();assert.equal(c.exitZone,reward?'reward':'recycle');assert.equal(g.gold,1000+(reward?1:0));g.dispose();
}
const session=new ArcadeSession(new PlayerWallet());session.enter('sky-wings');assert.ok(session.game instanceof SkyWings);session.game.drop();const balance=session.wallet.gold;session.game.sky.phase='upgrading';session.game.sky.elapsed=5;session.requestLeave();for(let i=0;i<100;i++)session.step();assert.equal(session.game.sky.elapsed,5);session.cancelLeave();session.step();assert.ok(session.game.sky.elapsed>5);session.requestLeave();session.confirmLeave();session.enter('essence-vault');assert.equal(session.game.gold,balance);assert.equal(session.game.slot.spins,0);session.requestLeave();session.confirmLeave();session.enter('sky-wings');assert.equal(session.game.sky.tier,0);assert.equal(session.game.sky.queue,0);session.requestLeave();session.confirmLeave();
console.log('Sky Wings passed: exact weights, eight sectors, upgrades 10s, timers 300/100s, expiry, frozen spending, lane triggers, 1000 payout, thirds, shared-wallet lifecycle.');
