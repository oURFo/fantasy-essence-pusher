import {PlayerWallet} from './wallet.ts';
import {RING_PACKS,RING_PRIZES} from './ring-rules.ts';
import {launchRing,stepRing,type TossRing} from './ring-physics.ts';
export class NightMarket{
 time=0;rings=0;thrown=0;won=0;sold=0;aimX=0;pull=0;dragging=false;active:TossRing|null=null;
 inventory=Array(48).fill(0);lastHit=-1;hitAt=-1000;message='選購圈圈，帶一袋戰利品回家。';private disposed=false;
 readonly wallet:PlayerWallet;private random:()=>number;
 constructor(wallet:PlayerWallet,random:()=>number=Math.random){this.wallet=wallet;this.random=random;}
 get gold(){return this.wallet.gold;}get inputLocked(){return Boolean(this.active)||this.time-this.hitAt<1.1;}
 get canThrow(){return !this.disposed&&this.rings>0&&!this.inputLocked;}
 get bagCount(){return this.inventory.reduce((a,b)=>a+b,0);}
 get bagValue(){return this.inventory.reduce((a,n,i)=>a+n*RING_PRIZES[i].price,0);}
 buy(index:number){const pack=RING_PACKS[index];if(this.disposed||!pack||!this.wallet.spend(pack.cost))return false;this.rings+=pack.rings;this.message=`補充 ${pack.rings} 個圈圈，往下拉後放開投擲。`;return true;}
 cancelPull(){this.pull=0;this.dragging=false;}
 throw(x:number,power:number){if(!this.canThrow||!Number.isFinite(x)||!Number.isFinite(power))return false;this.aimX=Math.max(-3.4,Math.min(3.4,x));this.active=launchRing(this.aimX,power,this.random());this.rings--;this.thrown++;this.cancelPull();this.message='圈圈飛行中…';return true;}
 sell(id?:number){if(this.disposed||id!==undefined&&(!Number.isInteger(id)||!RING_PRIZES[id]))return 0;const value=id===undefined?this.bagValue:this.inventory[id]*RING_PRIZES[id].price;if(!value||!this.wallet.credit(value))return 0;if(id===undefined)this.inventory.fill(0);else this.inventory[id]=0;this.sold+=value;this.message=`戰利品售出，獲得 ${value} 金幣。`;return value;}
 step(){if(this.disposed)return;this.time+=1/60;if(!this.active)return;for(let i=0;i<2;i++)stepRing(this.active);if(!this.active.done)return;const id=this.active.hit;if(id!==null){const p=RING_PRIZES[id];this.inventory[p.row*8+p.variant]++;this.won++;this.lastHit=id;this.hitAt=this.time;this.message=`套中 ${RING_PRIZES[id].name}！已收入背包，售價 ${RING_PRIZES[id].price} 金幣。`;}else this.message=this.rings?'差一點！調整出手位置與拉動幅度再試。':'圈圈用完了，可加購或出售背包戰利品。';this.active=null;}
 dispose(){if(this.disposed)return;this.sell();this.disposed=true;this.active=null;this.rings=0;this.inventory.fill(0);this.cancelPull();}
}
