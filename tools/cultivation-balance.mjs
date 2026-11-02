import {writeFileSync} from 'node:fs';
import {simulate} from '../tests/cultivation-simulation.mjs';
import {CULTIVATION} from '../src/cultivation-rules.ts';
function batch(policy,start,n){const rows=Array.from({length:n},(_,i)=>simulate(start+i,policy)),sum=k=>rows.reduce((s,r)=>s+Number(r[k]),0),cost=sum('spent'),ret=sum('points')+sum('bonuses'),values=rows.map(r=>(r.points+r.bonuses)/r.spent),mean=values.reduce((a,b)=>a+b,0)/n;return {policy,seedStart:start,n,cost,return:ret,rtp:ret/cost,clearRate:sum('clear')/n,bonusRate:sum('bonus')/n,avgCost:cost/n,avgJars:sum('jars')/n,avgLevel:sum('level')/n,ratioMean:mean,ratioSE:Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/(n-1)/n),rows};}
const train=batch('normal',10001,1024),holdout=batch('normal',20001,1024),beginner=batch('beginner',30001,256),expert=batch('expert',40001,256);
const compact=({rows,...summary})=>({...summary,sampleRows:rows.slice(0,8)});
const report={generated:'2026-11-02',config:CULTIVATION,definition:'(kill points value + clear gold + bonus gold) / consumed mana gold equivalent; unused purchased mana excluded; points tails retained',normalPolicy:'orbit, evade close enemies and announced boss circles, collect two of every three jars, deterministic priority from the actual random upgrade choices; refill manually while paused',dt:1/60,train:compact(train),holdout:compact(holdout),beginner:compact(beginner),expert:compact(expert)};
writeFileSync('cultivation-balance-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify([train,holdout,beginner,expert].map(({rows,...r})=>r),null,2));
