import {PlayerWallet,type WalletStorage} from './wallet.ts';
import {FRUIT_COST,FRUIT_BALLS,cellFor,completedRecipes,fruitPayout,giftCells} from './fruit-rules.ts';
import {fruitPaths,type FruitPath} from './fruit-paths.ts';
export class FruitProgress{
 streak=0;private storage?:WalletStorage;
 constructor(storage?:WalletStorage){this.storage=storage;try{const n=JSON.parse(storage?.getItem('fantasy-arcade.fruit-streak.v1')??'0');if(Number.isSafeInteger(n)&&n>=0)this.streak=n;}catch{}}
 finish(payout:number){this.streak=payout>0?0:Math.min(9999,this.streak+1);try{this.storage?.setItem('fantasy-arcade.fruit-streak.v1',JSON.stringify(this.streak));}catch{}}
}
export type FruitBall={path:FruitPath;age:number;index:number};
export class FruitPinball{
 time=0;startedAt=0;phase:'idle'|'playing'|'result'='idle';mask=0;launched=0;landed=0;rounds=0;payout=0;resultAt=-1000;nextLaunch=0;balls:FruitBall[]=[];
 gifts:number[]=[];hitTimes=Array(16).fill(-1000);recipeTimes=Array(15).fill(-1000);lastSlot=-1;duplicate=false;flashAt=-1000;
 private disposed=false;
 readonly wallet:PlayerWallet;readonly progress:FruitProgress;private random:()=>number;
 constructor(wallet:PlayerWallet,progress=new FruitProgress(),random:()=>number=Math.random){this.wallet=wallet;this.progress=progress;this.random=random;fruitPaths();}
 get gold(){return this.wallet.gold;}
 get inputLocked(){return this.phase==='playing';}
 get completed(){return completedRecipes(this.mask);}
 start(){
  if(this.disposed||this.phase==='playing'||!this.wallet.spend(FRUIT_COST))return false;
  this.phase='playing';this.flashAt=-1000;this.startedAt=this.time;this.mask=0;this.launched=0;this.landed=0;this.payout=0;this.balls=[];this.gifts=[];this.lastSlot=-1;this.duplicate=false;this.hitTimes.fill(-1000);this.recipeTimes.fill(-1000);this.nextLaunch=this.time+.65;this.rounds++;
  if(this.progress.streak>=3){this.gifts=giftCells(this.random);for(const slot of this.gifts)this.activate(slot);this.nextLaunch=this.time+2;}
  return true;
 }
 activate(slot:number){
  if(this.phase!=='playing'||slot<0||slot>15||!Number.isInteger(slot))return false;
  this.lastSlot=slot;this.duplicate=Boolean(this.mask&(1<<slot));if(this.duplicate)return false;
  this.hitTimes[slot]=this.time;
  const before=new Set(this.completed.map(r=>r.id));this.mask|=1<<slot;
  for(const recipe of this.completed)if(!before.has(recipe.id)){this.recipeTimes[recipe.id]=this.time;this.flashAt=this.time;}
  return true;
 }
 step(){
  this.time+=1/60;if(this.phase!=='playing')return;
  if(this.launched<FRUIT_BALLS&&this.time>=this.nextLaunch){
   const slot=cellFor(this.random()),pool=fruitPaths()[slot],path=pool[Math.min(pool.length-1,Math.floor(Math.max(0,this.random())*pool.length))];
   this.balls.push({path,age:0,index:this.launched++});this.nextLaunch+=.5;
  }
  this.balls=this.balls.filter(ball=>{ball.age+=1/60;if(ball.age*60>=ball.path.points.length-1){this.activate(ball.path.slot);this.landed++;return false;}return true;});
  if(this.launched===FRUIT_BALLS&&this.landed===FRUIT_BALLS){this.payout=fruitPayout(this.mask);if(this.payout)this.wallet.credit(this.payout);this.progress.finish(this.payout);this.phase='result';this.resultAt=this.time;}
 }
 dispose(){this.disposed=true;this.balls=[];this.mask=0;this.phase='idle';}
}
