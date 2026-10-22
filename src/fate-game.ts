import {PlayerWallet} from './wallet.ts';
import {FATE_COST,FATE_JACKPOT,FATE_LANES,FATE_LEVELS,POINTS_PER_GOLD,DISC,fateAward} from './fate-rules.ts';
import {launchFateBall,stepFateBall,enterFateDisc,stepFateDisc,resolveShotContacts,resolveDiscContacts,type ShotBall,type DiscBall} from './fate-physics.ts';
export type FatePhase='shooting'|'portal'|'disc'|'transfer'|'drain'|'result';
export type FateRun={id:number;phase:FatePhase;phaseAt:number;ball:ShotBall|null;disc:DiscBall|null;level:number;results:(number|null)[];lastLane:number|null;award:number};
export class FateOrbit{
 time=0;autoFire=false;angle=0;dragging=false;points=0;totalPoints=0;redeemed=0;shots=0;fortuneEntries=0;jackpots=0;
 runs:FateRun[]=[];plateAngles=Array(4).fill(0);lastAward=0;lastLane:number|null=null;rewardAt=-Infinity;lastShot=-Infinity;
 notices:{id:number;award:number;time:number}[]=[];
 message='調整大砲角度，按下發射。';eventId=0;eventKind='idle';private disposed=false;private settlements=0;private lastRun:FateRun|null=null;
 readonly wallet:PlayerWallet;private random:()=>number;
 constructor(wallet:PlayerWallet,random:()=>number=Math.random){this.wallet=wallet;this.random=random;}
 get gold(){return this.wallet.gold;}get inputLocked(){return this.disposed;}
 get canShoot(){return !this.disposed&&this.gold>=FATE_COST&&this.time-this.lastShot>=1-1e-9;}
 get exchangeGold(){return Math.floor(this.points/POINTS_PER_GOLD);}
 get grandNotice(){return this.notices.filter(n=>n.award===FATE_JACKPOT).at(-1);}
 get latestShot(){return this.runs.at(-1)??null;}
 get focus(){const occupied=this.runs.filter(r=>r.phase==='disc'||r.phase==='drain');if(occupied.length)return occupied.reduce((a,b)=>b.level>a.level?b:a);const transit=this.runs.filter(r=>r.phase==='portal'||r.phase==='transfer');if(transit.length)return transit.reduce((a,b)=>b.level>a.level?b:a);return this.runs[0]??this.lastRun;}
 get phase(){return this.focus?.phase??'idle';}get phaseAt(){return this.focus?.phaseAt??0;}
 get level(){return this.focus?.level??0;}get ball(){return this.focus?.ball??null;}get disc(){return this.focus?.disc??null;}
 get results(){return this.focus?.results??[null,null,null,null];}get minimum(){return FATE_LEVELS[this.level].min;}
 cancelAim(){this.dragging=false;}
 private event(kind:string,message:string){this.eventId++;this.eventKind=kind;this.message=message;}
 shoot(){if(!this.canShoot||!this.wallet.spend(FATE_COST))return false;this.lastShot=this.time;this.shots++;this.runs.push({id:this.shots,phase:'shooting',phaseAt:this.time,ball:launchFateBall(this.angle,.8+this.random()*.4,this.random()*4-2),disc:null,level:0,results:Array(4).fill(null),lastLane:null,award:0});this.event('shooting','星珠滾動中 · 每秒最多發射 1 顆');this.cancelAim();return true;}
 toggleAutoFire(){if(this.disposed)return;this.autoFire=!this.autoFire;if(this.autoFire){if(this.gold<FATE_COST){this.autoFire=false;this.message='金幣不足，自動發射已停止。';}else this.shoot();}}
 redeem(){if(this.disposed)return 0;const amount=this.exchangeGold;if(!amount||!this.wallet.credit(amount))return 0;this.points-=amount*POINTS_PER_GOLD;this.redeemed+=amount;this.message='兌換 '+amount+' 金幣，保留 '+this.points+' 積分。';return amount;}
 private award(r:FateRun,amount:number){if(r.phase==='result')return;this.points+=amount;this.totalPoints+=amount;this.lastAward=amount;this.lastLane=r.lastLane;this.rewardAt=this.time;this.notices.push({id:++this.settlements,award:amount,time:this.time});r.award=amount;r.phase='result';r.phaseAt=this.time;r.disc=null;this.lastRun=r;this.event(amount===FATE_JACKPOT?'jackpot':'result',amount?(amount===FATE_JACKPOT?'天命大獎！':'獲得')+' '+amount.toLocaleString()+' 積分':'OUT · 本球未獲得積分。');if(amount===FATE_JACKPOT)this.jackpots++;}
 private beginDisc(r:FateRun){r.disc=enterFateDisc(r.level,this.random(),this.plateAngles[r.level]);r.phase='disc';r.phaseAt=this.time;this.event('disc','第 '+(r.level+1)+' 層啟動 · 保底 '+FATE_LEVELS[r.level].min+' 積分');}
 step(){if(this.disposed)return;this.time+=1/60;
  if(this.autoFire){if(this.gold<FATE_COST){this.autoFire=false;this.message='金幣不足，自動發射已停止。';}else if(this.canShoot)this.shoot();}
  for(const r of this.runs){if(r.phase==='portal'&&this.time-r.phaseAt>=1.15)this.beginDisc(r);else if(r.phase==='transfer'&&this.time-r.phaseAt>=1.4){r.level++;this.beginDisc(r);}else if(r.phase==='drain'&&this.time-r.phaseAt>=.9){if(r.disc?.hole===0){if(r.level===3)this.award(r,FATE_JACKPOT);else{r.phase='transfer';r.phaseAt=this.time;this.event('transfer','紅洞晉級！下一層保底 '+FATE_LEVELS[r.level+1].min+' 積分');}}else this.award(r,fateAward(r.level,this.random()));}}
  const shots=this.runs.filter(r=>r.phase==='shooting');for(const r of shots){r.ball!.trail.unshift({x:r.ball!.x,y:r.ball!.y});r.ball!.trail.length=Math.min(r.ball!.trail.length,7);}
  for(let i=0;i<2;i++){resolveShotContacts(shots.map(r=>r.ball!).filter(b=>!b.done));for(const r of shots)stepFateBall(r.ball!,this.time+(i-1)/120);}
  for(const r of shots){const b=r.ball!;if(!b.done)continue;r.lastLane=b.lane;this.lastLane=b.lane;r.ball=null;const lane=b.lane===null?0:FATE_LANES[b.lane];if(lane==='fate'){this.fortuneEntries++;r.phase='portal';r.phaseAt=this.time;this.event('portal','命運之門開啟！保底 51 積分');}else this.award(r,lane);}
  for(let level=0;level<4;level++){const active=this.runs.filter(r=>r.phase==='disc'&&r.level===level);if(!active.length)continue;for(const r of active){const b=r.disc!;b.trail.unshift({x:b.x,y:b.y});b.trail.length=Math.min(b.trail.length,12);}
   for(let i=0;i<2;i++){const angle=this.plateAngles[level];resolveDiscContacts(active.map(r=>r.disc!).filter(b=>!b.done));for(const r of active){if(r.disc!.done)continue;r.disc!.plateAngle=angle;stepFateDisc(r.disc!);}this.plateAngles[level]=angle+DISC.motorSpeed/120;}
   for(const r of active)if(r.disc!.done){r.results[level]=r.disc!.hole;r.phase='drain';r.phaseAt=this.time;this.event('drain',r.disc!.hole===0?'紅洞！星珠入洞中。':'星珠落入白洞，結算本層獎勵。');}
  }
  this.runs=this.runs.filter(r=>r.phase!=='result');this.notices=this.notices.filter(n=>this.time-n.time<8);
 }
 dispose(){if(this.disposed)return;this.redeem();this.disposed=true;this.autoFire=false;this.points=0;this.runs=[];this.notices=[];this.lastRun=null;this.cancelAim();}
}
