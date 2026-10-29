import {PlayerWallet,type WalletStorage} from './wallet.ts';
import {FORGE_ENERGY_PAYTABLES,FORGE_REVEAL_AT,FORGE_COST,FORGE_KEY,FORGE_EVENTS,FORGE_TIERS,forgeTier,forgeRandom,weighted} from './forge-rules.ts';
import {forgeCanLaunch,forgeReturnDuration,forgePath,type ForgePath} from './forge-physics.ts';
export interface ForgeResult {id:number;kind:'slag'|'coin'|'energy'|'forge';payout:number;energyBefore:number;energyAfter:number;tier:number;full?:boolean;}
export class ThunderForge {
 time=0;energy=0;autoDrop=false;disposed=false;phase:'idle'|'feed'|'forging'|'returning'='idle';phaseAt=0;result:ForgeResult|null=null;rounds=0;won=0;spent=0;sound=true;storageFailed=false;path:ForgePath|null=null;power=.65;pulling=false;pull=0;
 readonly wallet:PlayerWallet;private storage?:WalletStorage;private random:()=>number;private serial=0;
 constructor(wallet:PlayerWallet,random=forgeRandom,storage?:WalletStorage){this.wallet=wallet;this.random=random;this.storage=storage;try{const d=JSON.parse(storage?.getItem(FORGE_KEY)??'null');if(d?.version===1&&Number.isInteger(d.energy)&&d.energy>=0&&d.energy<=10){this.energy=d.energy;if(d.stake===FORGE_COST&&d.last&&['slag','coin','energy','forge'].includes(d.last.kind)&&Number.isSafeInteger(d.last.payout)&&d.last.payout>=0)this.result=d.last;}}catch{this.storageFailed=true;}}
 get gold(){return this.wallet.gold;}get tier(){return forgeTier(this.energy);}get inputLocked(){return this.disposed||this.phase!=='idle';}get elapsed(){return this.time-this.phaseAt;}
 get arrival(){return (this.path?.launch??.65)+(this.path?.duration??0);}get impactElapsed(){return this.elapsed-this.arrival;}get popupElapsed(){return this.impactElapsed-(this.result?.full?this.chargeDuration:.55);}
 get revealAt(){return this.result?.full?2.85:FORGE_REVEAL_AT[this.result?.tier??0];}
 get forgeDuration(){return [5.2,5.8,6.8,8.2][this.result?.tier??0];}
 get chargeDuration(){const n=this.result?.energyAfter??0;return n<=3?1.05:n<=6?1.65:n<=8?2.2:n===9?2.7:3.3;}
 get duration(){if(this.phase==='returning')return forgeReturnDuration(this.power);return this.arrival+((this.result?.kind==='forge'||this.result?.full)?(this.result.full?this.chargeDuration:.55)+this.forgeDuration:this.result?.kind==='energy'?this.chargeDuration:1.15);}
 get displayEnergy(){if(this.phase==='idle'||this.phase==='returning'||!this.result)return this.energy;if(this.impactElapsed<.3)return this.result.energyBefore;if(this.result.full&&this.phase==='forging'&&this.popupElapsed<this.revealAt)return 10;if(this.result.kind==='forge'&&this.popupElapsed<this.revealAt)return this.result.energyBefore;return this.energy;}
 get message(){if(this.phase==='returning')return '力道不足，鋼珠回落 · 未扣款，請拉深把手';if(!this.result)return '發射鋼珠 · 雷電口充能，鍛造口開獎';const r=this.result;if(this.phase!=='idle'&&this.impactElapsed<0)return '鋼珠彈跳中 · 追蹤金幣、雷電與中央鍛造口';if(this.phase==='forging')return this.popupElapsed<this.revealAt?`${FORGE_TIERS[r.tier]}鍛造啟動 · 神器即將出爐`:`${FORGE_TIERS[r.tier]}神器出爐 · 獲得 ${r.payout} 金幣`;if(r.kind==='forge')return FORGE_TIERS[r.tier]+'鍛造完成 · 獲得 '+r.payout+' 金幣';if(r.kind==='energy')return r.energyBefore===10?'雷神級滿能量 · 等待鋼珠進入鍛造口':`${forgeTier(r.energyAfter)>r.tier?'品質升級！':''}雷電口命中 · 第 ${r.energyAfter} 格充能 · ${FORGE_TIERS[forgeTier(r.energyAfter)]}`;return r.payout?`金幣口命中 · 獲得 ${r.payout} 金幣`:'鋼珠進入回收槽 · 已收集雷電保留';}
 drop(){if(this.energy===10){this.resumeFull();return false;}if(this.inputLocked||this.gold<FORGE_COST)return false;if(!forgeCanLaunch(this.power)){this.autoDrop=false;this.path=null;this.phase='returning';this.phaseAt=this.time;return true;}
  // Determine the full result before touching money, including injected RNG failures.
  const event=weighted(FORGE_EVENTS,this.random()),before=this.energy,full=event.kind==='energy'&&before>=9,tier=full?3:forgeTier(before),payout=full?1500:event.kind==='forge'?weighted(FORGE_ENERGY_PAYTABLES[before],this.random()).payout:event.payout;
  const id=this.serial+1,side=id%2,port=event.kind==='forge'?3:event.kind==='energy'?(side?2:4):event.kind==='coin'?(side?1:5):(side?0:6),path=forgePath(port,id*7,this.power);
  if(!Number.isSafeInteger(this.gold-FORGE_COST+payout)||!this.wallet.spend(FORGE_COST))return false;
  this.energy=(event.kind==='forge'||full)?0:event.kind==='energy'?Math.min(10,before+1):before;
  if(payout)this.wallet.credit(payout);this.path=path;this.result={id:++this.serial,kind:event.kind,payout,energyBefore:before,energyAfter:full?10:this.energy,tier,full};this.rounds++;this.spent+=FORGE_COST;this.won+=payout;this.phaseAt=this.time;this.phase='feed';this.persist();return true;
 }
 setPower(value:number){if(Number.isFinite(value))this.power=Math.max(.01,Math.min(1,Math.round(value*100)/100));}
 beginPull(){if(this.inputLocked||this.gold<FORGE_COST)return false;this.autoDrop=false;this.pulling=true;this.pull=0;return true;}
 movePull(value:number){if(this.pulling)this.pull=Math.max(0,Math.min(1,value));}
 cancelPull(){this.pulling=false;this.pull=0;}
 releasePull(){if(!this.pulling)return false;const power=this.pull;this.cancelPull();if(power<.01)return false;this.setPower(power);return this.drop();}
 setAutoDrop(on:boolean){this.autoDrop=on&&!this.disposed&&this.gold>=FORGE_COST;if(this.autoDrop&&this.phase==='idle')this.drop();}
 private resumeFull(){if(this.energy!==10||this.phase!=='idle'||!this.wallet.credit(1500))return;this.energy=0;this.result={id:++this.serial,kind:'energy',payout:1500,energyBefore:9,energyAfter:10,tier:3,full:true};this.path=null;this.phase='forging';this.phaseAt=this.time-this.arrival-this.chargeDuration;this.won+=1500;this.persist();}
 step(){if(this.disposed)return;this.resumeFull();this.time+=1/60;if(this.phase==='feed'&&(this.result?.kind==='forge'||this.result?.full)&&this.popupElapsed>=0)this.phase='forging';if(this.phase!=='idle'&&this.elapsed+1e-9>=this.duration)this.phase='idle';if(this.autoDrop&&this.phase==='idle'){if(this.gold<FORGE_COST)this.autoDrop=false;else this.drop();}}
 private persist(){try{this.storage?.setItem(FORGE_KEY,JSON.stringify({version:1,stake:FORGE_COST,energy:this.energy,last:this.result}));}catch{this.storageFailed=true;}}
 dispose(){this.cancelPull();this.autoDrop=false;this.disposed=true;this.persist();}
}
