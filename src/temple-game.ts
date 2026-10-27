import {PlayerWallet} from './wallet.ts';
import {TEMPLE,templeCalendar,type TempleDate} from './temple-rules.ts';
import {templeBall,stepTempleBall,templeBallContacts,type TempleBall} from './temple-physics.ts';
export class TempleFortune{
 readonly wallet:PlayerWallet;private random:()=>number;
 time=0;points=0;totalPoints=0;shots=0;scored=0;recycled=0;slotEntries=0;balls:TempleBall[]=[];power=5;firing=false;lastShot=-Infinity;pendingBalls=0;lastReward=-Infinity;lastCloud=-Infinity;cloudBalls=0;slotQueue=0;slotPhase:'idle'|'spin'|'result'='idle';slotAt=0;date:TempleDate={month:1,day:3,kind:'miss',balls:0};
 phase:'base'|'drain-up'|'opening'|'bonus'|'drain-down'|'closing'='base';phaseAt=0;winAt=-Infinity;scoreAt=-Infinity;lastScore=0;message='福德正神 · 左打祈福，天公爐入珠翻曆';disposed=false;private nextId=0;private outcome:TempleDate=this.date;
 constructor(wallet:PlayerWallet,random:()=>number=Math.random){this.wallet=wallet;this.random=random;}
 get spinDate(){return this.outcome;}
 get gold(){return this.wallet.gold;}get exchangeGold(){return Math.floor(this.points/10);}get bonus(){return this.phase==='bonus'||this.phase==='drain-down'||this.phase==='closing';}get inputLocked(){return this.disposed||!(this.phase==='base'||this.phase==='bonus');}get remaining(){return this.phase==='bonus'?Math.max(0,100-(this.time-this.phaseAt)):0;}get cloudX(){return 512+Math.sin(this.time*.7)*290;}
 get doorOpen(){return this.phase==='opening'?Math.min(1,(this.time-this.phaseAt)/4):this.phase==='closing'?Math.max(0,1-(this.time-this.phaseAt)/4):this.bonus?1:0;}
 setDial(value:number){if(this.disposed)return;const n=Math.max(0,Math.min(10,Math.round(value)));this.firing=n>0;if(n)this.power=n;}
 shoot(){if(this.inputLocked||this.time-this.lastShot<.5-1e-9||!this.wallet.spend(1))return false;this.lastShot=this.time;this.shots++;this.balls.push(templeBall(++this.nextId,this.power,this.random(),this.bonus));return true;}
 redeem(){if(this.disposed)return 0;const n=this.exchangeGold;if(n&&this.wallet.credit(n)){this.points-=n*10;return n;}return 0;}
 private receive(b:TempleBall){if(b.result==='slot'){this.slotEntries++;this.slotQueue++;}else if(b.result==='score'){this.scored++;this.points+=b.points;this.totalPoints+=b.points;this.scoreAt=this.time;this.lastScore=b.points;}else this.recycled++;}
 private resolve(){this.date=this.outcome;this.winAt=this.time;
 if(this.date.kind==='bonus'&&this.phase==='base'){this.phase='drain-up';this.phaseAt=this.time;this.message='二月初二！福德正神聖誕 · 原盤結算後開廟';}
 else if(this.date.kind==='bonus'){this.pendingBalls+=50;this.message='福運接連到！開廟已排定，追加 50 珠';}
 else if(this.date.balls){this.pendingBalls+=this.date.balls;this.message=this.date.kind==='medium'?'八月十五！中秋賜福 ＋50 珠':this.date.day===1?'初一納福！＋10 珠':'十五祈福！＋10 珠';}
 else this.message='香火綿延 · 再祈好運';}
 step(){if(this.disposed)return;this.time+=1/60;
 if(this.phase==='bonus'&&this.remaining<=1e-8){this.phase='drain-down';this.phaseAt=this.time;this.message='賜福時間結束 · 金珠結算後關廟';}
 if(this.firing&&!this.inputLocked){if(!this.gold){this.firing=false;this.message='金幣不足，發射已停止';}else this.shoot();}
 if(this.pendingBalls&&this.time-this.lastReward>=.5-1e-9){this.pendingBalls--;this.lastReward=this.time;this.balls.push(templeBall(++this.nextId,5,this.random(),false,true));}
 if(this.phase==='bonus'&&this.cloudBalls<100&&this.time-this.lastCloud>=1-1e-9){this.lastCloud=this.time;this.cloudBalls++;this.balls.push(templeBall(++this.nextId,5,this.random(),true,true,this.cloudX));}
 if(this.slotPhase==='idle'&&this.slotQueue){this.slotQueue--;this.outcome=templeCalendar(this.random(),this.random());this.slotPhase='spin';this.slotAt=this.time;}
 else if(this.slotPhase==='spin'&&this.time-this.slotAt>=TEMPLE.slotSeconds){this.resolve();this.slotPhase='result';this.slotAt=this.time;}
 else if(this.slotPhase==='result'&&this.time-this.slotAt>=TEMPLE.resultSeconds)this.slotPhase='idle';
 for(let i=0;i<2;i++){templeBallContacts(this.balls);for(const b of this.balls)stepTempleBall(b);}
 for(const b of this.balls)if(b.done)this.receive(b);this.balls=this.balls.filter(b=>!b.done);
 if((this.phase==='drain-up'||this.phase==='drain-down')&&!this.balls.length&&!this.pendingBalls&&!this.slotQueue&&this.slotPhase==='idle'){this.phase=this.phase==='drain-up'?'opening':'closing';this.phaseAt=this.time;this.message=this.phase==='opening'?'廟門開啟 · 土地公駕到':'福澤留心 · 廟門緩緩闔上';}
 else if(this.phase==='opening'&&this.time-this.phaseAt>=4){this.phase='bonus';this.phaseAt=this.time;this.cloudBalls=0;this.lastCloud=this.time-1;this.message='土地公賜福！免費金珠與玩家左打同時進行';}
 else if(this.phase==='closing'&&this.time-this.phaseAt>=4){this.phase='base';this.phaseAt=this.time;this.message='福德正神 · 左打祈福';}
 }
 dispose(){if(this.disposed)return;this.redeem();this.disposed=true;this.firing=false;this.balls=[];this.slotQueue=0;this.pendingBalls=0;this.points=0;}
}
