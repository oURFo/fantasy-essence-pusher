import {PlayerWallet,type WalletStorage} from './wallet.ts';
import {TRAIN,TRAIN_ITEMS,TRAIN_COMBOS,TRAIN_MISSIONS,TRAIN_KEY,trainChance} from './train-rules.ts';
export interface TrainTarget {id:number;stack:number;type:number;points:number;x:number;bottom:number;w:number;h:number;live:boolean;flash:number;}
export interface TrainShot {x:number;y:number;vx:number;vy:number;bet:number;age:number;}
export interface TrainFalling {target:TrainTarget;at:number;direct:boolean;vx:number;spin:number;}
export interface TrainAward {id:number;points:number;at:number;kind:'hit'|'mission';x:number;y:number;paid:boolean;}
export interface TrainTask {template:number;progress:number;}
export class WonderTrain {
 time=0;bet=1;angle=-Math.PI/2;auto=false;disposed=false;lastShot=-10;nextStack=0;
 targets:TrainTarget[]=[];shots:TrainShot[]=[];falling:TrainFalling[]=[];awards:TrainAward[]=[];tasks:TrainTask[]=[];
 points=0;tail=0;goldWon=0;spent=0;fired=0;hits=0;broken=0;missions=0;message='指向想射擊的物件，按發射；打掉底座可獲得上方連帶積分。';
 private serial=0;private stackSerial=0;private awardSerial=0;private storage?:WalletStorage;
 readonly wallet:PlayerWallet;random:()=>number;
 constructor(wallet:PlayerWallet,storage?:WalletStorage,random=Math.random){this.wallet=wallet;this.storage=storage;this.random=random;try{const p=JSON.parse(storage?.getItem(TRAIN_KEY)??'null');if(Number.isInteger(p?.tail)&&p.tail>=0&&p.tail<10)this.tail=p.tail;}catch{}for(let i=0;i<3;i++)this.tasks.push(this.newTask());for(let i=0;i<5;i++)this.spawn(70+i*205);this.nextStack=4.8;}
 get gold(){return this.wallet.gold;}
 get pending(){return this.awards.filter(a=>!a.paid).reduce((s,a)=>s+a.points,0);}
 setBet(n:number){if(!this.disposed&&Number.isInteger(n)&&n>=1&&n<=5)this.bet=n;}
 aim(x:number,y:number){if(!Number.isFinite(x)||!Number.isFinite(y))return;this.angle=Math.max(-Math.PI+.12,Math.min(-.12,Math.atan2(Math.min(y,760)-825,x-512)));}
 setAuto(value:boolean){this.auto=!this.disposed&&this.gold>=this.bet&&value;}
 drop(){return this.shoot();}
 setAutoDrop(value:boolean){this.setAuto(value);}
 get autoDrop(){return this.auto;}
 shoot(){if(this.disposed||this.time-this.lastShot+1e-9<TRAIN.shotInterval)return false;if(!this.wallet.spend(this.bet)){this.auto=false;this.message='金幣不足，連射已停止。';return false;}this.lastShot=this.time;this.fired++;this.spent+=this.bet;this.shots.push({x:512,y:825,vx:Math.cos(this.angle)*TRAIN.speed,vy:Math.sin(this.angle)*TRAIN.speed,bet:this.bet,age:0});return true;}
 spawn(x=-100,index=Math.floor(this.random()*TRAIN_COMBOS.length)){
  const combo=TRAIN_COMBOS[index],stack=++this.stackSerial;let bottom=620;
  for(let i=0;i<combo.items.length;i++){const type=combo.items[i],item=TRAIN_ITEMS[type],points='values'in combo?combo.values[i]:item.points;this.targets.push({id:++this.serial,stack,type,points,x,bottom,w:item.w,h:item.h,live:true,flash:-10});bottom-=item.h-3;}
 }
 carried(t:TrainTarget){return this.targets.filter(o=>o.live&&o.stack===t.stack&&o.bottom<=t.bottom);}
 total(t:TrainTarget){return this.carried(t).reduce((n,o)=>n+o.points,0);}
 private newTask():TrainTask {const types=this.tasks.map(t=>TRAIN_MISSIONS[t.template].type),pool=TRAIN_MISSIONS.filter(m=>!types.includes(m.type));const m=pool[Math.min(pool.length-1,Math.floor(this.random()*pool.length))];return {template:m.id,progress:0};}
 private award(points:number,x:number,y:number,kind:'hit'|'mission'){this.awards.push({id:++this.awardSerial,points,x,y,kind,at:this.time,paid:false});}
 private progress(type:number,x:number,y:number){const task=this.tasks.find(t=>TRAIN_MISSIONS[t.template].type===type);if(!task)return;const m=TRAIN_MISSIONS[task.template];task.progress++;if(task.progress>=m.count){this.missions++;this.award(m.reward,x,y-70,'mission');this.message=`任務完成！${m.label}，獲得${m.reward}積分。`;const index=this.tasks.indexOf(task);this.tasks.splice(index,1);this.tasks.splice(index,0,this.newTask());}}
 impact(target:TrainTarget,bet:number){if(!target.live)return false;this.hits++;target.flash=this.time;const carried=this.carried(target),total=carried.reduce((n,t)=>n+t.points,0);if(this.random()>=trainChance(total,bet)){this.message=`命中${TRAIN_ITEMS[target.type].name}，這次沒有破壞。`;return false;}
  // Remove the whole chain before awards/progress; another marble cannot claim it twice.
  const missionsBefore=this.missions;for(const t of carried)t.live=false;
  for(const t of carried){this.falling.push({target:{...t},at:this.time,direct:t.id===target.id,vx:(this.random()-.5)*180,spin:(this.random()-.5)*5});this.progress(t.type,t.x,t.bottom-t.h/2);}
  this.broken+=carried.length;this.award(total,target.x,target.bottom-target.h/2,'hit');this.message=`${carried.length>1?`${carried.length}件連帶倒落！`:'破壞成功！'}＋${total}積分${this.missions>missionsBefore?' · 任務完成！':''}`;return true;
 }
 private pay(a:TrainAward){if(a.paid)return;a.paid=true;this.points+=a.points;const total=this.tail+a.points,coins=Math.floor(total/10);this.tail=total%10;if(coins){this.wallet.credit(coins);this.goldWon+=coins;}try{this.storage?.setItem(TRAIN_KEY,JSON.stringify({version:1,tail:this.tail}));}catch{}}
 step(dt=1/60){if(this.disposed||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);this.time+=dt;
  for(const t of this.targets)if(t.live)t.x+=TRAIN.scroll*dt;
  this.targets=this.targets.filter(t=>t.live&&t.x<1140);if(this.time>=this.nextStack){this.spawn();this.nextStack=this.time+4.8;}
  for(const b of this.shots){const ox=b.x,oy=b.y;b.vy+=TRAIN.gravity*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.age+=dt;let first:TrainTarget|undefined,at=Infinity;
   for(const t of this.targets){if(!t.live)continue;const left=t.x-t.w*.43-6,right=t.x+t.w*.43+6,top=t.bottom-t.h+4,bottom=t.bottom-2;const dx=b.x-ox-TRAIN.scroll*dt,dy=b.y-oy;let lo=0,hi=1;for(const [p,d,min,max] of [[ox,dx,left-TRAIN.scroll*dt,right-TRAIN.scroll*dt],[oy,dy,top,bottom]]){if(Math.abs(d)<1e-9){if(p<min||p>max){hi=-1;break;}}else{const a=(min-p)/d,c=(max-p)/d;lo=Math.max(lo,Math.min(a,c));hi=Math.min(hi,Math.max(a,c));}}if(lo<=hi&&lo>=0&&lo<at){first=t;at=lo;}}
   if(first){this.impact(first,b.bet);b.age=99;}
  }
  this.shots=this.shots.filter(b=>b.age<2&&b.x>-40&&b.x<1064&&b.y>-40&&b.y<930);
  for(const a of this.awards)if(!a.paid&&this.time-a.at>=1.3)this.pay(a);
  this.awards=this.awards.filter(a=>this.time-a.at<1.65);this.falling=this.falling.filter(f=>this.time-f.at<1.4);
  if(this.auto&&this.gold<this.bet){this.auto=false;this.message='金幣不足，連射已停止。';}if(this.auto)this.shoot();
 }
 settle(){for(const a of this.awards)this.pay(a);}
 dispose(){if(this.disposed)return;this.auto=false;this.settle();this.disposed=true;this.shots=[];this.targets=[];this.tasks=[];this.falling=[];}
}
