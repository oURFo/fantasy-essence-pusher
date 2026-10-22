import assert from 'node:assert/strict';
import R from '@dimforge/rapier3d-compat';
import {SkyWings} from '../src/sky-game.ts';
import {CoinPusher} from '../src/physics.ts';
import {PlayerWallet} from '../src/wallet.ts';
await R.init();
for(const tier of [0,1,2]){
 const wallet=new PlayerWallet(),g=new SkyWings(wallet);g.sky.tier=tier;g.sky.remaining=100;
 const start=wallet.gold;assert.equal(g.drop(),true);assert.equal(wallet.gold,start-1,'every tier still costs one coin per essence');
 const bead=g.coins.find(c=>c.entered&&c.kind==='green');bead.body.setTranslation({x:0,y:-4.2,z:7.1},true);g.step();
 assert.equal(wallet.gold,start-1+tier+1);assert.equal(g.earnedGold,tier+1);assert.equal(g.won,1);
 const balance=wallet.gold;for(let i=0;i<10;i++)g.step();assert.equal(wallet.gold,balance,'reward must settle once');
 const recycled=g.coins.find(c=>c.entered&&c.kind==='green');recycled.body.setTranslation({x:2.8,y:-6.4,z:7.1},true);g.step();assert.equal(wallet.gold,balance,'side recycling never pays, including upgraded tiers');g.dispose();
}
const base=new CoinPusher(),bead=base.coins[0];bead.body.setTranslation({x:0,y:-2.2,z:7.1},true);base.step();assert.equal(base.gold,1001,'first machine retains one-coin return');base.dispose();
console.log('Sky returns passed: tiers pay 1/2/3 per essence, every input costs 1, recycling pays 0, reward once and first machine unchanged.');
