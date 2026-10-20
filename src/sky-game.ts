import {CoinPusher} from './physics.ts';
import {CONFIG} from './config.ts';
import {PlayerWallet} from './wallet.ts';
import {SKY_PEGS,SkyRules} from './sky-rules.ts';
import {SKY_FRONT} from './sky-geometry.ts';
export class SkyWings extends CoinPusher {
 readonly sky:SkyRules;
 constructor(wallet?:PlayerWallet,random:()=>number=Math.random,physicsRandom:()=>number=Math.random){
  super(physicsRandom,physicsRandom,wallet,{pegs:SKY_PEGS,dragon:false,rewardHalfWidth:SKY_FRONT.rewardHalfWidth,rewardCollectionY:-4});
  this.sky=new SkyRules(random);
 }
 override get inputLocked(){return this.sky.locked;}
 override reset(){super.reset();this.sky?.reset();}
 override drop(){if(this.sky?.locked)return false;return super.drop();}
 override setAutoDrop(enabled:boolean){if(this.sky.locked)return this.autoDrop;return super.setAutoDrop(enabled);}
 protected override onPrizeLane(lane:number){if((this.sky.config.lanes as readonly number[]).includes(lane))this.sky.trigger();}
 protected override updateRewards(){} // This machine has a wheel, never a SLOT.
 override step(){
  const payout=this.sky.update(CONFIG.fixedStep,{pendingPayout:this.pendingBonuses.length,upperBeads:this.coins.filter(c=>!c.entered).length});
  for(let i=0;i<payout;i++)this.pendingBonuses.push({kind:'green',due:this.time});
  // Input remains locked during settlement; the pusher, beads and prize outlets
  // keep running to clear the old tier before its ten-second changeover.
  super.step();
 }
 override dispose(){this.sky.reset();super.dispose();}
}
