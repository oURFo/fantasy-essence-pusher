import {PlayerWallet} from './wallet.ts';
import {MINE,MINE_SLOT,MINE_SLOT_TIMING,mineSlotDraw} from './mine-rules.ts';
import {mineLaunch,mineRewardBall,stepMineBall,mineBallContacts,type MineBall} from './mine-physics.ts';
export class GoldMine{
 time=0;points=0;totalPoints=0;shots=0;scored=0;recycled=0;slotEntries=0;paidBalls=0;balls:MineBall[]=[];power=5;right=false;firing=false;lastShot=-Infinity;pendingBalls=0;lastReward=-Infinity;slotQueue=0;slotPhase:'idle'|'spin'|'result'='idle';slotAt=0;slotIndex=-1;lastSlotAward=0;slotWins=0;train:'parked'|'departing'|'gold'|'returning'='parked';trainAt=0;scoreFlash=-Infinity;winAt=-Infinity;message='左打尋礦 · 綠口得分可喚醒列車';disposed=false;private nextId=0;private result=-1;
 readonly wallet:PlayerWallet;private random:()=>number;
 constructor(wallet:PlayerWallet,random:()=>number=Math.random){this.wallet=wallet;this.random=random;}
 get spinResult(){return this.result;}
 get gold(){return this.wallet.gold;}get inputLocked(){return this.disposed;}get exchangeGold(){return Math.floor(this.points/10);}
 get goldRemaining(){return this.train==='gold'?Math.max(0,MINE.goldSeconds-(this.time-this.trainAt)):0;}
 get trainX(){return this.train==='parked'?0:this.train==='departing'?Math.min(1,(this.time-this.trainAt)/MINE.departSeconds)*480:this.train==='returning'?(1-Math.min(1,(this.time-this.trainAt)/MINE.returnSeconds))*480:480;}
 get cartX(){return 512+Math.sin(this.time*.65)*310;}
 setDial(value:number){if(this.disposed)return;const v=Math.max(0,Math.min(11,Math.round(value)));this.firing=v>0;this.right=v===11;if(v>0&&v<11)this.power=v;}
 shoot(){if(this.disposed||this.time-this.lastShot<MINE.cooldown-1e-9||!this.wallet.spend(MINE.cost))return false;this.lastShot=this.time;this.shots++;this.balls.push(mineLaunch(++this.nextId,this.power,this.right,this.random()));return true;}
 redeem(){if(this.disposed)return 0;const n=this.exchangeGold;if(n&&this.wallet.credit(n)){this.points-=n*10;return n;}return 0;}
 private receive(b:MineBall){if(b.result==='score'){this.scored++;this.points+=MINE.greenPoints;this.totalPoints+=MINE.greenPoints;this.scoreFlash=this.time;this.message=`得分口 ＋${MINE.greenPoints} 積分`;if(this.train==='parked'&&this.random()<MINE.trainChance){this.train='departing';this.trainAt=this.time;this.message='列車發車！金礦時間即將開啟！';}}else if(b.result==='slot'){this.slotEntries++;this.slotQueue++;this.message='藍口入球 · SLOT ＋1';}else this.recycled++;}
 step(){if(this.disposed)return;this.time+=1/60;
 if(this.train==='departing'&&this.time-this.trainAt>=MINE.departSeconds){this.train='gold';this.trainAt=this.time;this.message='金礦時間！請切換右打！';}else if(this.train==='gold'&&this.goldRemaining<=0){this.train='returning';this.trainAt=this.time;this.message='列車回站 · 請恢復左打';}else if(this.train==='returning'&&this.time-this.trainAt>=MINE.returnSeconds){this.train='parked';this.trainAt=this.time;}
 if(this.firing){if(this.gold<MINE.cost){this.firing=false;this.message='金幣不足 · 發射已停止';}else this.shoot();}
 if(this.pendingBalls>0&&this.time-this.lastReward>=.5-1e-9){this.pendingBalls--;this.paidBalls++;this.lastReward=this.time;this.balls.push(mineRewardBall(++this.nextId,this.cartX,this.random()));}
 if(this.slotPhase==='idle'&&this.slotQueue){this.slotQueue--;this.result=mineSlotDraw(this.random());this.slotPhase='spin';this.slotAt=this.time;}else if(this.slotPhase==='spin'&&this.time-this.slotAt>=MINE_SLOT_TIMING.spin){this.slotIndex=this.result;this.lastSlotAward=this.result<0?0:MINE_SLOT[this.result].balls;this.slotPhase='result';this.slotAt=this.time;if(this.lastSlotAward){this.pendingBalls+=this.lastSlotAward;this.winAt=this.time;this.slotWins++;this.message=`${MINE_SLOT[this.result].name}！獲得 ${this.lastSlotAward} 顆鋼珠`;}else this.message='礦脈尚未甦醒 · 再接再厲';}else if(this.slotPhase==='result'&&this.time-this.slotAt>=MINE_SLOT_TIMING.result)this.slotPhase='idle';
 for(let i=0;i<2;i++){mineBallContacts(this.balls);for(const b of this.balls)stepMineBall(b,this.trainX);}
 for(const b of this.balls)if(b.done)this.receive(b);this.balls=this.balls.filter(b=>!b.done);
 }
 dispose(){if(this.disposed)return;this.redeem();this.disposed=true;this.firing=false;this.points=0;this.balls=[];this.pendingBalls=0;this.slotQueue=0;}
}
