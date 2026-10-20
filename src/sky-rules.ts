export type SkyTier=0|1|2;
export type SkyDrainState={pendingPayout?:number;upperBeads?:number};
export const SKY_TIERS=[
 {name:'浮島初翼',duration:0,lanes:[2,4],color:'#b6e9ae',rewards:[2,0,4,16,8,0,10,20],weights:[3500,150,2500,600,1700,150,1000,400]},
 {name:'蒼穹展翼',duration:300,lanes:[2,3,4],color:'#75e3ff',rewards:[5,0,10,50,20,0,36,100],weights:[3500,75,2700,600,1800,75,1000,250]},
 {name:'天域聖翼',duration:100,lanes:[3],color:'#ffda79',rewards:[50,200,70,300,100,200,1000,300],weights:[4000,400,2800,250,1800,400,100,250]},
] as const;
export const SKY_PEGS:{x:number;y:number;radius:number}[]=[];
// Fixed staggered round pins cross the wheel's glass face as well as its sides.
// They share the physical board: the rotating artwork never moves the pins.
// Lower cascade: broad centre splitter -> offset pair -> reward-lane guards.
for(const [y,xs] of [
 [9,[-2.9,-1.74,-.58,.58,1.74,2.9]],
 [8.05,[-2.32,-1.16,0,1.16,2.32]],
 [7.1,[-2.9,-1.74,-.58,.58,1.74,2.9]],
 [6.15,[-2.32,-1.16,0,1.16,2.32]],
 [5.2,[-2.9,-1.74,1.74,2.9]],
 [5.05,[0]],
 [4.2,[-2.32,-.6,.6,2.32]],
 [3.5,[-2.9,-1.05,0,1.05,2.9]],
] as [number,number[]][]){
 for(const x of xs)SKY_PEGS.push({x,y,radius:y===5.05?.24:.105});
}
export function selectSkyPrize(tier:SkyTier,unit:number){
 let ticket=Math.min(.999999999,Math.max(0,unit))*10000;
 const weights=SKY_TIERS[tier].weights;
 for(let i=0;i<8;i++){ticket-=weights[i];if(ticket<0)return i;}
 return 7;
}
export class SkyRules {
 tier:SkyTier=0;
 phase:'idle'|'spinning'|'result'|'upgrading'|'descending'='idle';
 clock=0;elapsed=0;remaining=0;queue=0;spins=0;awarded=0;
 spinTier:SkyTier=0;prizeIndex=0;lastAmount=0;resultAt=-1000;angle=0;startAngle=0;targetAngle=0;
 expired=false;
 transition:'upgrade'|'base'|null=null;
 private random:()=>number;
 constructor(random:()=>number=Math.random){this.random=random;}
 get config(){return SKY_TIERS[this.tier];}
 get settling(){return this.phase==='upgrading'||this.phase==='descending';}
 get locked(){return this.transition!==null||this.settling;}
 trigger(){this.queue++;}
 reset(){Object.assign(this,{tier:0,phase:'idle',clock:0,elapsed:0,remaining:0,queue:0,spins:0,awarded:0,spinTier:0,prizeIndex:0,lastAmount:0,resultAt:-1000,angle:0,startAngle:0,targetAngle:0,expired:false,transition:null});}
 private settle(){this.phase=this.transition==='upgrade'?'upgrading':'descending';this.elapsed=0;}
 update(dt:number,drain:SkyDrainState={}){
  this.clock+=dt;
  const busy=(drain.pendingPayout??0)>0||(drain.upperBeads??0)>0;
  if(this.settling){
   // A late upper bead can still earn a spin. Finish it in the old tier and
   // restart the full quiet period instead of carrying it into the new tier.
   if(busy||this.queue>0){this.transition??=this.phase==='upgrading'?'upgrade':'base';this.phase='idle';this.elapsed=0;return 0;}
   this.elapsed+=dt;
   if(this.elapsed+1e-9>=10){
    this.tier=this.phase==='upgrading'?(this.tier+1) as SkyTier:0;
    this.remaining=this.config.duration;this.expired=false;this.transition=null;this.phase='idle';this.elapsed=0;
   }
   return 0;
  }
  if(this.tier>0&&!this.transition){this.remaining=Math.max(0,this.remaining-dt);if(this.remaining<1e-8){this.remaining=0;this.expired=true;this.transition='base';}}
  if(this.phase==='idle'){
   if(this.queue>0){
    this.queue--;this.spins++;this.spinTier=this.tier;this.prizeIndex=selectSkyPrize(this.tier,this.random());this.elapsed=0;this.phase='spinning';
    this.startAngle=this.angle;const end=-this.prizeIndex*Math.PI/4;
    this.targetAngle=this.angle+Math.PI*12+((end-this.angle)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
   }else if(this.transition&&!busy)this.settle();
   return 0;
  }
  this.elapsed+=dt;
  if(this.phase==='spinning'){
   const progress=Math.min(1,this.elapsed/3.2),ease=progress**3*(10-15*progress+6*progress**2);this.angle=this.startAngle+(this.targetAngle-this.startAngle)*ease;
   if(this.elapsed+1e-9>=3.2){
    this.angle=this.targetAngle%(Math.PI*2);let amount=SKY_TIERS[this.spinTier].rewards[this.prizeIndex] as number;
    this.resultAt=this.clock;this.elapsed=0;
    if(amount===0&&!this.transition){this.transition='upgrade';this.phase='idle';this.lastAmount=0;if(this.queue===0&&!busy)this.settle();return 0;}
    if(amount===0)amount=SKY_TIERS[this.spinTier].rewards[0];
    this.lastAmount=amount;this.awarded+=amount;this.phase='result';return amount;
   }
  }else if(this.phase==='result'&&this.elapsed+1e-9>=(this.lastAmount===1000?4.5:this.lastAmount>=100?2.4:1.4)){
   this.phase='idle';this.elapsed=0;
  }
  return 0;
 }
 get message(){
  if(this.phase==='upgrading')return `檯面升級中 · 機台運作 ${Math.max(0,Math.ceil(10-this.elapsed))} 秒`;
  if(this.phase==='descending')return `恢復基本檯面中 · 機台運作 ${Math.max(0,Math.ceil(10-this.elapsed))} 秒`;
  const prefix=this.transition?(this.transition==='upgrade'?'升階前結算 · ':'返航前結算 · '):'';
  if(this.phase==='spinning')return `${prefix}輪盤轉動中`;
  if(this.phase==='result')return prefix+(SKY_TIERS[this.spinTier].rewards[this.prizeIndex]===0?`翅膀轉為 ${this.lastAmount} 精華`:this.lastAmount===1000?'天域賜福！獲得 1,000 精華':`羽翼祝福 · 獲得 ${this.lastAmount} 精華`);
  if(this.transition)return `${prefix}等待輪盤、派珠與上方落珠完成`;
  return `${this.config.name} · 穿越翼徽格，轉動命運之輪`;
 }
}
