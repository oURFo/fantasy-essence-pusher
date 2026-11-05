import {WonderTrain} from '../src/train-game.ts';
import {TRAIN,trainSeed} from '../src/train-rules.ts';
import {PlayerWallet} from '../src/wallet.ts';
export function simulateTrain(seed,bet,shots=3000,policy='base'){
 const wallet=new PlayerWallet();wallet.setBalance(1e8);const g=new WonderTrain(wallet,undefined,trainSeed(seed));g.setBet(bet);g.nextBird=Infinity;const aiming=trainSeed(seed^0x4517);let steps=0;
 while(g.fired<shots&&steps<shots*900){
  if(g.time-g.lastShot>=.5){let candidates=g.targets.filter(t=>t.live&&t.x>100&&t.x<870&&(policy==='casual'||policy==='misses'||g.total(t)>=bet*10));
   if(policy==='base'||policy==='casual'||policy==='misses')candidates=candidates.filter(t=>!g.targets.some(o=>o.live&&o.stack===t.stack&&o.bottom>t.bottom));
   if(policy==='top')candidates=candidates.filter(t=>!g.targets.some(o=>o.live&&o.stack===t.stack&&o.bottom<t.bottom));
   candidates.sort((a,b)=>Math.abs(a.x-512)-Math.abs(b.x-512));const t=candidates[0];if(t){g.aim(t.x,t.bottom-t.h/2);if(policy==='casual')g.aim(t.x+(aiming()-.5)*12,t.bottom-t.h/2);if(policy==='misses'&&aiming()<.15)g.aim(10,150);g.shoot();}
  }
  g.step();steps++;
 }
 for(let i=0;i<220;i++)g.step();const row={seed,bet,policy,shots:g.fired,hits:g.hits,hitRate:g.hits/g.fired,spent:g.spent,points:g.points,rtp:g.points/10/g.spent,broken:g.broken,missions:g.missions,seconds:g.time};g.dispose();return row;
}
