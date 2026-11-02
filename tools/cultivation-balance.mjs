import {writeFileSync,readFileSync} from 'node:fs';
import {simulate} from '../tests/cultivation-simulation.mjs';
import {CULTIVATION} from '../src/cultivation-rules.ts';
function batch(policy,start,n){const rows=Array.from({length:n},(_,i)=>simulate(start+i,policy)),sum=k=>rows.reduce((s,r)=>s+Number(r[k]),0),cost=sum('spent'),ret=sum('points')+sum('bonuses');return {policy,seedStart:start,n,cost,return:ret,rtp:ret/cost,clearRate:sum('clear')/n,bonusRate:sum('bonus')/n,avgCost:cost/n,avgJars:sum('jars')/n,avgLevel:sum('level')/n,paidTargetSlots:sum('capacity'),hitTargetSlots:sum('hits'),unusedTargetSlots:sum('unusedSlots'),utilization:sum('hits')/sum('capacity'),avgXpDropped:sum('xpDropped')/n,avgXpCollected:sum('xpCollected')/n,avgSeconds:sum('time')/n,avgPeak:sum('peak')/n,distinctBuilds:new Set(rows.map(r=>r.build.join(','))).size,rows};}
// The current coefficient was fitted with 512 normal-policy seeds (10001..10512).
// --fit repeats that calibration; the default only verifies the configured rules.
let calibration;try{const previous=JSON.parse(readFileSync('cultivation-balance-report.json','utf8').replace(/^\uFEFF/,''));if(previous.config?.bountyBase===CULTIVATION.bountyBase&&previous.config?.bountyRate===CULTIVATION.bountyRate)calibration=previous.calibration;}catch{}
if(process.argv.includes('--fit')){
 const normal=batch('normal',10001,512),low=batch('beginner',30001,128),sum=(rows,k)=>rows.reduce((n,r)=>n+r[k],0);
 const kn=sum(normal.rows,'kills'),un=sum(normal.rows,'units'),qn=10*(CULTIVATION.targetRtp*normal.cost-sum(normal.rows,'bonuses'));
 const kl=sum(low.rows,'kills'),ul=sum(low.rows,'units'),ql=10*(CULTIVATION.targetRtp*low.cost-sum(low.rows,'bonuses')),det=kn*ul-kl*un;
 const base=(qn*ul-ql*un)/det,rate=(kn*ql-kl*qn)/det;if(!Number.isFinite(base)||base<0||!Number.isFinite(rate)||rate<=0)throw Error('Cannot fit nonnegative shared payout table');
 CULTIVATION.bountyBase=Number(base.toPrecision(12));CULTIVATION.bountyRate=Number(rate.toPrecision(12));
 calibration={normal:{seedStart:10001,n:512,cost:normal.cost,kills:kn,hpUnits:un},lowMovement:{seedStart:30001,n:128,cost:low.cost,kills:kl,hpUnits:ul},target:CULTIVATION.targetRtp,method:'shared static base kill points + maximum HP coefficient; two reference policies fitted simultaneously, full cast costs including unused slots'};
 const path='src/cultivation-rules.ts';writeFileSync(path,readFileSync(path,'utf8').replace(/bountyBase:[.\d]+/,`bountyBase:${CULTIVATION.bountyBase}`).replace(/bountyRate:[.\d]+/,`bountyRate:${CULTIVATION.bountyRate}`));console.log('Fitted payouts',JSON.stringify({base:CULTIVATION.bountyBase,rate:CULTIVATION.bountyRate}));
}
const train=batch('normal',10001,64);console.log('Train',train.rtp);const holdout=batch('normal',20001,512);console.log('Holdout',holdout.rtp);const beginner=batch('beginner',50001,64),expert=batch('expert',40001,16),idle=batch('idle',70001,32);
const compact=({rows,...summary})=>({...summary,sampleRows:rows.slice(0,8)});
const report={calibration,billing:'full per-cast target capacity; no discount for unused targets; no-target casts are not fired',generated:'2026-11-02',rulesVersion:'fixed-full-cast-110pct-damage140-healthbar-v4',config:CULTIVATION,definition:'(kill points value + clear gold + bonus gold) / consumed mana gold equivalent; unused purchased mana excluded; point tails retained',normalPolicy:'collect nearby experience pearls while exploring, avoid nearby enemies and boss warnings, collect two of every three jars, choose from actual random upgrades; manually refill paused shop',expertPolicy:'16-direction enemy/projectile lookahead every 0.12s, focus bosses, collect jars',dt:1/60,train:compact(train),holdout:compact(holdout),beginner:compact(beginner),expert:compact(expert),idle:compact(idle)};
writeFileSync('cultivation-balance-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify([train,holdout,beginner,expert,idle].map(({rows,...r})=>r),null,2));
