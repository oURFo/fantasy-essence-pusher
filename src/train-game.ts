import {PlayerWallet,type WalletStorage} from './wallet.ts';
import {TRAIN,TRAIN_ITEMS,TRAIN_COMBOS,TRAIN_MISSIONS,TRAIN_KEY,trainChance,randomTrainCombo} from './train-rules.ts';
export interface TrainTarget {id:number;stack:number;type:number;points:number;x:number;bottom:number;w:number;h:number;live:boolean;flash:number;credit:number;lap:number;}
export interface TrainShot {x:number;y:number;vx:number;vy:number;bet:number;age:number;duration:number;goalX:number;goalY:number;targetId:number|null;lap:number;birdId?:number;rage?:boolean;}
export interface TrainFalling {target:TrainTarget;at:number;direct:boolean;vx:number;spin:number;}
export interface TrainAward {id:number;points:number;at:number;kind:'hit'|'mission';x:number;y:number;paid:boolean;}
export interface TrainTask {template:number;progress:number;}
export type TrainBuff='rapid'|'rage'|'freeze';
export const TRAIN_BUFFS={rapid:{name:'高速連射',color:'#40dfff'},rage:{name:'狂暴射擊',color:'#ffce55'},freeze:{name:'時間暫停',color:'#a5efff'}};
export class WonderTrain {
 birds:{id:number;kind:TrainBuff;x:number;y:number;speed:number}[]=[];
 impacts:{x:number;y:number;at:number;success:boolean;rage:boolean}[]=[];
 rapidUntil=0;freezeUntil=0;rageReady=false;worldTime=0;nextBird=18;
 buffEvent:{kind:TrainBuff;at:number}|null=null;private birdSerial=0;private missedGold=0;
 get shotInterval(){return this.time<this.rapidUntil?.2:TRAIN.shotInterval;}
 activateBuff(kind:TrainBuff){if(kind==='rapid')this.rapidUntil=this.time+15;else if(kind==='freeze')this.freezeUntil=this.time+10;else {this.rageReady=true;this.auto=false;}this.buffEvent={kind,at:this.time};this.message=`${TRAIN_BUFFS[kind].name}！${kind==='rage'?'已切換手動射擊，下一發巨大金彈命中必毀':kind==='rapid'?'15秒內每秒5發':'展示物件停止移動10秒'}`;}
 birdAt(x:number,y:number){return this.birds.find(b=>Math.hypot(b.x-x,b.y-y)<48)??null;}

 lockId:number|null=null;lockMode=false;lockHold:{id:number;at:number;complete:boolean}|null=null;
 get lockedTarget(){return this.targets.find(t=>t.id===this.lockId&&t.live)??null;}
 clearLock(){this.lockId=null;this.lockMode=false;this.lockHold=null;}
 beginLock(x:number,y:number){const t=this.targetAt(x,y);if(!t)return false;this.lockHold={id:t.id,at:this.time,complete:false};return true;}
 cancelLockHold(){this.lockHold=null;}
 private updateLock(){
  const visible=(t:TrainTarget|undefined|null)=>!!t&&t.live&&t.x+t.w/2>=0&&t.x-t.w/2<=1024;
  if(this.lockId!==null&&!visible(this.lockedTarget))this.clearLock();
  if(this.lockHold&&!this.lockHold.complete){const t=this.targets.find(t=>t.id===this.lockHold!.id);if(!visible(t))this.cancelLockHold();else if(this.time-this.lockHold.at>=1){this.lockId=t!.id;this.lockMode=false;this.lockHold.complete=true;this.message='目標已鎖定，開啟連射可持續追蹤。';}}
  const target=this.lockedTarget;if(target)this.aim(target.x,target.bottom-target.h/2);
 }
 time=0;bet=1;angle=-Math.PI/2;auto=false;disposed=false;lastShot=-10;nextStack=0;
 targets:TrainTarget[]=[];shots:TrainShot[]=[];falling:TrainFalling[]=[];awards:TrainAward[]=[];tasks:TrainTask[]=[];
 points=0;tail=0;goldWon=0;spent=0;fired=0;hits=0;broken=0;missions=0;message='點擊場景直接朝該方向發射；打掉底座可獲得上方連帶積分。';
 aimPoint={x:512,y:582};private lanes:{stack:number;x:number}[]=[];
 private serial=0;private stackSerial=0;private awardSerial=0;private storage?:WalletStorage;
 readonly wallet:PlayerWallet;random:()=>number;
 constructor(wallet:PlayerWallet,storage?:WalletStorage,random=Math.random){this.wallet=wallet;this.storage=storage;this.random=random;try{const p=JSON.parse(storage?.getItem(TRAIN_KEY)??'null');if(Number.isInteger(p?.tail)&&p.tail>=0&&p.tail<10)this.tail=p.tail;}catch{}for(let i=0;i<3;i++)this.tasks.push(this.newTask());for(let i=0;i<6;i++)this.spawn(-135+i*205);}
 get gold(){return this.wallet.gold;}
 get pending(){return this.awards.filter(a=>!a.paid).reduce((s,a)=>s+a.points,0);}
 setBet(n:number){if(!this.disposed&&Number.isInteger(n)&&n>=1&&n<=TRAIN.maxBet)this.bet=n;}
 targetAt(x:number,y:number){return this.targets.filter(t=>t.live&&Math.abs(t.x-x)<=t.w/2&&y>=t.bottom-t.h&&y<=t.bottom).sort((a,b)=>Math.abs(a.bottom-a.h/2-y)-Math.abs(b.bottom-b.h/2-y))[0]??null;}
 aim(x:number,y:number){if(!Number.isFinite(x)||!Number.isFinite(y))return;this.aimPoint={x:Math.max(0,Math.min(1024,x)),y:Math.max(110,Math.min(720,y))};this.angle=Math.atan2(this.aimPoint.y-825,this.aimPoint.x-512);}
 setDirection(angle:number){if(!Number.isFinite(angle))return;const a=Math.max(-Math.PI+.12,Math.min(-.12,angle));this.aim(512+Math.cos(a)*500,825+Math.sin(a)*500);}
 setAuto(value:boolean){this.auto=!this.disposed&&this.gold>=this.bet&&value;}
 drop(){return this.shoot();}
 setAutoDrop(value:boolean){this.setAuto(value);}
 get autoDrop(){return this.auto;}
 shoot(){if(this.disposed||this.time-this.lastShot+1e-9<this.shotInterval)return false;if(!this.wallet.spend(this.bet)){this.auto=false;this.message='金幣不足，連射已停止。';return false;}this.lastShot=this.time;this.fired++;this.spent+=this.bet;
  const locked=this.lockedTarget,bird=locked?null:this.birdAt(this.aimPoint.x,this.aimPoint.y),t=locked??(bird?null:this.targetAt(this.aimPoint.x,this.aimPoint.y)),scroll=this.time<this.freezeUntil?0:TRAIN.scroll;let duration=Math.hypot(this.aimPoint.x-512,this.aimPoint.y-825)/TRAIN.speed;for(let i=0;i<3;i++)duration=Math.hypot(this.aimPoint.x+(bird?bird.speed*duration:t?scroll*duration:0)-512,this.aimPoint.y-825)/TRAIN.speed;
  const goalX=this.aimPoint.x+(bird?bird.speed*duration:t?scroll*duration:0),goalY=this.aimPoint.y;duration=Math.max(.12,duration);this.shots.push({x:512,y:825,vx:(goalX-512)/duration,vy:(goalY-825)/duration,bet:this.bet,age:0,duration,goalX,goalY,targetId:t?.id??null,lap:t?.lap??0,birdId:bird?.id,rage:this.rageReady});this.rageReady=false;return true;
 }
 spawn(x=-100,index?:number){
  const combo=index===undefined?randomTrainCombo(this.random):TRAIN_COMBOS[index],stack=++this.stackSerial;this.lanes.push({stack,x});let bottom=620;
  for(let i=0;i<combo.items.length;i++){const type=combo.items[i],item=TRAIN_ITEMS[type],points='values'in combo?(combo.values as readonly number[])[i]:item.points;this.targets.push({id:++this.serial,stack,type,points,x,bottom,w:item.w,h:item.h,live:true,flash:-10,credit:0,lap:0});bottom-=item.h-3;}
 }
 carried(t:TrainTarget){return this.targets.filter(o=>o.live&&o.stack===t.stack&&o.bottom<=t.bottom);}
 total(t:TrainTarget){return this.carried(t).reduce((n,o)=>n+o.points,0);}
 effective(t:TrainTarget){return Math.max(1,this.carried(t).reduce((n,o)=>n+o.points-o.credit,0));}
 private newTask():TrainTask {const types=this.tasks.map(t=>TRAIN_MISSIONS[t.template].type),pool=TRAIN_MISSIONS.filter(m=>!types.includes(m.type));const m=pool[Math.min(pool.length-1,Math.floor(this.random()*pool.length))];return {template:m.id,progress:0};}
 private award(points:number,x:number,y:number,kind:'hit'|'mission'){this.awards.push({id:++this.awardSerial,points,x,y,kind,at:this.time,paid:false});}
 private progress(type:number,x:number,y:number){const task=this.tasks.find(t=>TRAIN_MISSIONS[t.template].type===type);if(!task)return;const m=TRAIN_MISSIONS[task.template];task.progress++;if(task.progress>=m.count){this.missions++;this.award(m.reward,x,y-70,'mission');this.message=`任務完成！${m.label}，獲得${m.reward}積分。`;const index=this.tasks.indexOf(task);this.tasks.splice(index,1);this.tasks.splice(index,0,this.newTask());}}
 impact(target:TrainTarget,bet:number,guaranteed=false){if(!target.live)return false;this.hits++;target.flash=this.time;const carried=this.carried(target),total=carried.reduce((n,t)=>n+t.points,0);const success=guaranteed||this.random()<trainChance(this.effective(target),bet);this.impacts.push({x:target.x,y:target.bottom-target.h/2,at:this.time,success,rage:guaranteed});if(!success){target.credit+=bet*TRAIN.pointsPerGold*TRAIN.failedCreditRate;this.message=`命中${TRAIN_ITEMS[target.type].name}，這次沒有破壞。`;return false;}
  // Remove the whole chain before awards/progress; another marble cannot claim it twice.
  const missionsBefore=this.missions;for(const t of carried)t.live=false;
  for(const t of carried){this.falling.push({target:{...t},at:this.time,direct:t.id===target.id,vx:(this.random()-.5)*180,spin:(this.random()-.5)*5});this.progress(t.type,t.x,t.bottom-t.h/2);}
  if(carried.some(t=>t.id===this.lockId))this.clearLock();this.broken+=carried.length;this.award(total,target.x,target.bottom-target.h/2,'hit');this.message=`${carried.length>1?`${carried.length}件連帶倒落！`:'破壞成功！'}＋${total}積分${this.missions>missionsBefore?' · 任務完成！':''}`;return true;
 }
 private pay(a:TrainAward){if(a.paid)return;a.paid=true;this.points+=a.points;const total=this.tail+a.points,coins=Math.floor(total/10);this.tail=total%10;if(coins){this.wallet.credit(coins);this.goldWon+=coins;}try{this.storage?.setItem(TRAIN_KEY,JSON.stringify({version:1,tail:this.tail}));}catch{}}
 step(dt=1/60){if(this.disposed||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);this.time+=dt;
  if(this.time>=this.freezeUntil)this.worldTime+=dt;
  if(this.time>=this.nextBird){const pool:TrainBuff[]=this.missedGold>=100?['rapid','rage','freeze']:['rapid','freeze'];const kind=pool[Math.min(pool.length-1,Math.floor(this.random()*pool.length))],right=this.random()<.5;if(kind==='rage')this.missedGold=0;this.birds.push({id:++this.birdSerial,kind,x:right?-60:1084,y:260+this.random()*95,speed:right?105:-105});this.nextBird=this.time+24+this.random()*22;}
  for(const bird of this.birds)bird.x+=bird.speed*dt;this.birds=this.birds.filter(b=>b.x>-100&&b.x<1124);
  this.impacts=this.impacts.filter(i=>this.time-i.at<.65);

  // Six physical display groups form a loop. Remaining items keep their identity and credit.
  this.targets=this.targets.filter(t=>t.live);
  for(const lane of [...this.lanes]){lane.x+=(this.time<this.freezeUntil?0:TRAIN.scroll)*dt;const remaining=this.targets.filter(t=>t.stack===lane.stack);if(lane.x>=1140){lane.x-=TRAIN.loopWidth;if(!remaining.length&&this.time>=this.nextStack){this.spawn(lane.x);this.lanes.splice(this.lanes.indexOf(lane),1);continue;}for(const t of remaining)t.lap++;}for(const t of remaining)t.x=lane.x;}
  this.updateLock();
  for(const b of this.shots){b.age+=dt;const f=Math.min(1,b.age/b.duration);b.x=512+(b.goalX-512)*f;b.y=825+(b.goalY-825)*f-Math.sin(f*Math.PI)*TRAIN.arcHeight;
   if(f>=1){const bird=this.birds.find(o=>o.id===b.birdId);if(bird){this.birds=this.birds.filter(o=>o!==bird);this.impacts.push({x:bird.x,y:bird.y,at:this.time,success:true,rage:!!b.rage});this.activateBuff(bird.kind);}const t=b.birdId!==undefined?null:b.targetId===null?this.targetAt(b.goalX,b.goalY):this.targets.find(t=>t.id===b.targetId&&t.live&&t.lap===b.lap);const hit=!!t&&Math.abs(t.x-b.goalX)<=t.w/2+2&&b.goalY>=t.bottom-t.h&&b.goalY<=t.bottom;if(hit)this.impact(t!,b.bet,!!b.rage);if(!bird&&!hit)this.missedGold+=b.bet;b.age=99;}
  }
  this.shots=this.shots.filter(b=>b.age<2);
  for(const a of this.awards)if(!a.paid&&this.time-a.at>=1.3)this.pay(a);
  this.awards=this.awards.filter(a=>this.time-a.at<1.65);this.falling=this.falling.filter(f=>this.time-f.at<1.4);
  if(this.auto&&this.gold<this.bet){this.auto=false;this.message='金幣不足，連射已停止。';}if(this.auto&&!this.lockHold)this.shoot();
 }
 settle(){for(const a of this.awards)this.pay(a);}
 dispose(){if(this.disposed)return;this.auto=false;this.clearLock();this.settle();this.disposed=true;this.shots=[];this.birds=[];this.impacts=[];this.rageReady=false;this.targets=[];this.tasks=[];this.falling=[];}
}
