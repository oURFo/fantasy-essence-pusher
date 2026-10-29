export const FORGE_COST=5;
export const FORGE_REVEAL_AT=[3.6,3.95,4.5,5.4] as const;
export const FORGE_DIGITS=[2,2,3,4] as const;
export function forgeCounter(tier:number,payout:number,time:number){const count=FORGE_DIGITS[tier],value=String(payout).padStart(count,'0'),reveal=FORGE_REVEAL_AT[tier];return Array.from({length:count},(_,i)=>{const stop=reveal-(count-1-i)*.22,settled=time>=stop,roll=time*(23+i*3)+i*7;return {digit:settled?Number(value[i]):Math.floor(roll)%10,offset:settled?0:roll%1,settled};});}
export const FORGE_KEY='fantasy-arcade.thunder-forge.v1';
export const FORGE_TIERS=['銅級','銀級','金級','雷神級'] as const;
export const FORGE_EVENTS=[{kind:'slag',weight:5708,payout:0},{kind:'coin',weight:1000,payout:5},{kind:'coin',weight:400,payout:10},{kind:'coin',weight:100,payout:25},{kind:'energy',weight:1792,payout:0},{kind:'forge',weight:1000,payout:0}] as const;
export function forgeTier(energy:number){return energy>=10?3:energy>=6?2:energy>=3?1:0;}
export function weighted<T extends {weight:number}>(items:readonly T[],value:number):T{if(!Number.isFinite(value)||value<0||value>=1)throw new RangeError('Random must be in [0,1)');let total=0;for(const item of items){total+=item.weight;if(value<total/10000)return item;}return items[items.length-1];}
// Rejection sampling gives exactly uniform 10,000 buckets; VFX never consume this RNG.
export function forgeRandom(){const a=new Uint32Array(1);do{crypto.getRandomValues(a);}while(a[0]>=4294960000);return (a[0]%10000)/10000;}
export function forgeTheory(){const f=.1,e=.1792,q=e/(e+f),full=q**10,means=FORGE_ENERGY_PAYTABLES.map(t=>t.reduce((s,p)=>s+p.payout*p.weight/10000,0)),levels=Array.from({length:10},(_,i)=>(1-q)*q**i),shots=(1-full)/f,prize=levels.reduce((s,p,i)=>s+p*means[i],0)+full*1500;return {levels,full,means,shots,rtp:(1.15+prize/shots)/FORGE_COST};}
export const FORGE_ENERGY_RANGES=[[5,9],[10,14],[15,19],[20,24],[25,29],[30,39],[40,59],[60,89],[90,149],[150,249],[1500,1500]] as const;
export const FORGE_ENERGY_PAYTABLES=FORGE_ENERGY_RANGES.map(([lo,hi])=>lo===hi?[{payout:lo,weight:10000}]:[{payout:lo,weight:6000},{payout:Math.floor((lo+hi)/2),weight:3000},{payout:hi,weight:1000}]);
