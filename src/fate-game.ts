import {PlayerWallet} from './wallet.ts';
import {FATE_COST,FATE_JACKPOT,FATE_LANES,FATE_LEVELS,POINTS_PER_GOLD,fateAward} from './fate-rules.ts';
import {launchFateBall,stepFateBall,enterFateDisc,stepFateDisc,type ShotBall,type DiscBall} from './fate-physics.ts';
export class FateOrbit{
 time=0;phase:'idle'|'shooting'|'portal'|'disc'|'transfer'|'drain'|'result'='idle';phaseAt=0;angle=0;dragging=false;
 ball:ShotBall|null=null;disc:DiscBall|null=null;level=0;points=0;totalPoints=0;redeemed=0;shots=0;fortuneEntries=0;jackpots=0;
 plateAngles=Array(4).fill(0);results:(number|null)[]=Array(4).fill(null);lastAward=0;lastLane:number|null=null;message='調整炮口角度，射向命運之門。';private disposed=false;
 readonly wallet:PlayerWallet;private random:()=>number;
 constructor(wallet:PlayerWallet,random:()=>number=Math.random){this.wallet=wallet;this.random=random;}
 get gold(){return this.wallet.gold;}get inputLocked(){return this.phase!=='idle'&&this.phase!=='result';}
 get canShoot(){return !this.disposed&&!this.inputLocked&&this.gold>=FATE_COST&&this.time-this.phaseAt>=.35;}
 get exchangeGold(){return Math.floor(this.points/POINTS_PER_GOLD);}
 get minimum(){return this.phase==='disc'||this.phase==='transfer'||this.phase==='drain'?FATE_LEVELS[this.level].min:51;}
 cancelAim(){this.dragging=false;}
 shoot(){if(!this.canShoot||!this.wallet.spend(FATE_COST))return false;this.phase='shooting';this.phaseAt=this.time;this.ball=launchFateBall(this.angle);this.lastAward=0;this.lastLane=null;this.results.fill(null);this.shots++;this.message='星珠滾動中，穿越星軌障礙。';this.cancelAim();return true;}
 redeem(){if(this.disposed)return 0;const amount=this.exchangeGold;if(!amount||!this.wallet.credit(amount))return 0;this.points-=amount*POINTS_PER_GOLD;this.redeemed+=amount;this.message=`兌換 ${amount} 金幣，保留 ${this.points} 積分。`;return amount;}
 private award(amount:number){this.points+=amount;this.totalPoints+=amount;this.lastAward=amount;this.phase='result';this.phaseAt=this.time;this.disc=null;this.message=amount?`${amount===FATE_JACKPOT?'天命大獎！':'獲得'} ${amount.toLocaleString()} 積分${amount===FATE_JACKPOT?'！':''}`:'OUT · 本球未獲得積分。';if(amount===FATE_JACKPOT)this.jackpots++;}
 private beginDisc(){this.disc=enterFateDisc(this.level,this.random(),this.plateAngles[this.level]);this.phase='disc';this.phaseAt=this.time;this.message=`${FATE_LEVELS[this.level].name}啟動 · 保底 ${this.minimum} 積分`;}
 step(){if(this.disposed)return;this.time+=1/60;
  if(this.phase==='shooting'&&this.ball){const b=this.ball;b.trail.unshift({x:b.x,y:b.y});b.trail.length=Math.min(b.trail.length,7);stepFateBall(b,this.time*.5);if(b.done){this.lastLane=b.lane;this.ball=null;const lane=b.lane===null?0:FATE_LANES[b.lane];if(lane==='fate'){this.fortuneEntries++;this.phase='portal';this.phaseAt=this.time;this.level=0;this.message='命運之門開啟！保底 51 積分，啟動星盤。';}else this.award(lane);}}
  else if(this.phase==='portal'&&this.time-this.phaseAt>=1.15)this.beginDisc();
  else if(this.phase==='transfer'&&this.time-this.phaseAt>=1.4){this.level++;this.beginDisc();}
  else if(this.phase==='disc'&&this.disc){const d=this.disc;d.trail.unshift({x:d.x,y:d.y});d.trail.length=Math.min(d.trail.length,12);for(let i=0;i<2;i++)stepFateDisc(d);this.plateAngles[this.level]=d.plateAngle;if(d.done){this.results[this.level]=d.hole;this.phase='drain';this.phaseAt=this.time;this.message=d.hole===0?'紅洞！星珠正在落入晉級通道。':'星珠落入白洞，結算本層獎勵。';}}
  else if(this.phase==='drain'&&this.time-this.phaseAt>=.9){if(this.disc?.hole===0){if(this.level===3)this.award(FATE_JACKPOT);else{this.phase='transfer';this.phaseAt=this.time;this.message=`紅洞晉級！下一層保底 ${FATE_LEVELS[this.level+1].min} 積分`;}}else this.award(fateAward(this.level,this.random()));}
 }
 dispose(){if(this.disposed)return;this.redeem();this.disposed=true;this.points=0;this.ball=null;this.disc=null;this.phase='idle';this.cancelAim();}
}
