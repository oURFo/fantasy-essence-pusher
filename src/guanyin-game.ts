import {PlayerWallet} from './wallet.ts';
import {GUANYIN,GUANYIN_SYMBOLS,guanyinOutcome,guanyinReels} from './guanyin-rules.ts';
import {guanyinBall,stepGuanyinBall,guanyinContacts,type GuanyinBall} from './guanyin-physics.ts';
export class GuanyinGrace{
 readonly wallet:PlayerWallet;time=0;points=0;totalPoints=0;paidShots=0;scored=0;outs=0;slotEntries=0;balls:GuanyinBall[]=[];power=8;firing=false;lastShot=-Infinity;disposed=false;
 bottle=GUANYIN.initialBottle as number;paidRefillProgress=0;private refillDuringPour=0;pourRemaining=0;pourTotal=0;pourAt=-Infinity;lastBonus=-Infinity;pendingBalls=0;emittedGift=0;emittedBottle=0;
 gateUntil=0;gate=0;slotQueue=0;slotPhase:'idle'|'spin'|'result'='idle';slotAt=0;outcome=-1;reels=[1,3,5];private result=-1;private resultReels=[0,1,2];private serial=0;
 winAt=-Infinity;scoreAt=-Infinity;message='觀音淨願 · 鋼珠入蓮，祈願淨瓶賜福';ledger={spins:0,jackpots:0,willows:0,refills:0,paidScore:0,freeScore:0,results:[0,0,0,0,0,0,0]};
 private random:()=>number;constructor(wallet:PlayerWallet,random:()=>number=Math.random){this.wallet=wallet;this.random=random;}
 get spinReels(){return this.resultReels;}get autoDrop(){return this.firing;}get gold(){return this.wallet.gold;}get exchangeGold(){return Math.floor(this.points/10);}get inputLocked(){return this.disposed||this.balls.length>=GUANYIN.maxActive;}get gateRemaining(){return Math.max(0,this.gateUntil-this.time);}get pouring(){return this.pourRemaining>0;}
 setPower(n:number){if(Number.isFinite(n))this.power=Math.max(1,Math.min(15,Math.round(n)));}
 setAutoDrop(on:boolean){this.firing=on&&!this.disposed&&this.gold>=3;}
 shoot(){if(this.inputLocked||this.time-this.lastShot+1e-9<GUANYIN.shotInterval||!this.wallet.spend(GUANYIN.cost))return false;this.lastShot=this.time;this.paidShots++;this.paidRefillProgress++;if(this.paidRefillProgress>=GUANYIN.refillEvery){this.paidRefillProgress-=GUANYIN.refillEvery;this.ledger.refills++;if(this.pouring)this.refillDuringPour++;else this.bottle++;}this.balls.push(guanyinBall(++this.serial,this.power,this.random()));return true;}
 redeem(){if(this.disposed)return 0;const n=this.exchangeGold;if(n&&this.wallet.credit(n)){this.points-=n*10;return n;}return 0;}
 private receive(b:GuanyinBall){if(b.result==='slot'){this.slotEntries++;this.slotQueue++;}else if(b.result==='score'){this.scored++;this.points+=GUANYIN.score;this.totalPoints+=GUANYIN.score;this.ledger[b.source==='paid'?'paidScore':'freeScore']+=GUANYIN.score;this.scoreAt=this.time;}else this.outs++;}
 private resolve(){this.outcome=this.result;this.reels=this.resultReels;this.ledger.results[this.outcome+1]++;if(this.outcome<0){this.message='蓮心祈願 · 再續好運';return;}this.winAt=this.time;
 if(this.outcome===0){this.pourRemaining=this.bottle;this.pourTotal=this.bottle;this.pourAt=this.time;this.ledger.jackpots++;this.message=`淨瓶賜福！傾倒 ${this.pourTotal} 顆鋼珠`;}
 else if(this.outcome===1){this.gateUntil=this.time+GUANYIN.gateSeconds;this.ledger.willows++;this.message='楊柳護佑！五個 OUT 擋板關閉10秒';}
 else {this.pendingBalls+=GUANYIN_SYMBOLS[this.outcome].balls;this.message=`${GUANYIN_SYMBOLS[this.outcome].name}賜福！贈送 ${GUANYIN_SYMBOLS[this.outcome].balls} 顆鋼珠`;}}
 step(){if(this.disposed)return;this.time+=1/60;const target=this.time<this.gateUntil?1:0;this.gate+=Math.sign(target-this.gate)*Math.min(Math.abs(target-this.gate),1/60/GUANYIN.gateMoveSeconds);
 if(this.firing){if(this.gold<GUANYIN.cost){this.firing=false;this.message='金幣不足，發射停止';}else this.shoot();}
 if(this.balls.length<GUANYIN.maxActive&&this.time-this.lastBonus+1e-9>=GUANYIN.bonusInterval&&(this.pouring||this.pendingBalls)){const source=this.pouring?'bottle':'gift';this.lastBonus=this.time;if(source==='bottle'){this.pourRemaining--;this.bottle--;this.emittedBottle++;if(!this.pourRemaining){this.bottle=GUANYIN.initialBottle+this.refillDuringPour;this.refillDuringPour=0;}}else {this.pendingBalls--;this.emittedGift++;}this.balls.push(guanyinBall(++this.serial,8,this.random(),source));}
 if(this.slotPhase==='idle'&&this.slotQueue&&!this.pouring){this.slotQueue--;this.ledger.spins++;this.result=guanyinOutcome(this.random());this.resultReels=guanyinReels(this.result,this.random());this.slotPhase='spin';this.slotAt=this.time;}
 else if(this.slotPhase==='spin'&&this.time-this.slotAt>=GUANYIN.slotSeconds){this.resolve();this.slotPhase='result';this.slotAt=this.time;}
 else if(this.slotPhase==='result'&&this.time-this.slotAt>=GUANYIN.resultSeconds)this.slotPhase='idle';
 for(let n=0;n<2;n++){guanyinContacts(this.balls);for(const b of this.balls)stepGuanyinBall(b,this.gate);}for(const b of this.balls)if(b.done)this.receive(b);this.balls=this.balls.filter(b=>!b.done);
 }
 dispose(){if(this.disposed)return;this.redeem();this.disposed=true;this.firing=false;this.balls=[];this.slotQueue=0;this.pendingBalls=0;this.pourRemaining=0;this.points=0;}
}
