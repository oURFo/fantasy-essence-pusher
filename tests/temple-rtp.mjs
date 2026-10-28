import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {TempleFortune} from '../src/temple-game.ts';
import {PlayerWallet} from '../src/wallet.ts';
import {TEMPLE,TEMPLE_GOLD_PORTS,TEMPLE_SLOT_ODDS,templeCalendarPaytable} from '../src/temple-rules.ts';
const empty=()=>({paidBalls:0,freeBalls:0,paidPoints:0,freePoints:0});
function simulate(job){
 // Candidate overrides are isolated to manual QA workers; the browser uses the configured production odds.
 if(job.bonus!==null)TEMPLE_SLOT_ODDS.bonus=job.bonus;
 let state=job.seed;const rng=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
 const wallet=new PlayerWallet();wallet.setBalance(10000000);const g=new TempleFortune(wallet,rng);g.setDial(7);
 let frame=0;for(;frame<job.shots*60*4+600*60;frame++){
  if(g.shots>=job.shots)g.setDial(0);
  else if(job.policy==='free-bonus')g.setDial(g.bonus?0:g.power);
  if((frame+1)%300===0)g.power=job.power??1+Math.floor(rng()*15);
  if(job.power!==null)g.power=job.power;
  g.step();
  if(g.shots>=job.shots&&!g.balls.length&&!g.pendingBalls&&!g.slotQueue&&g.slotPhase==='idle'&&g.phase==='base')break;
 }
 assert.equal(g.shots,job.shots);assert.equal(g.phase,'base');assert.equal(g.balls.length+g.pendingBalls+g.slotQueue,0);assert.equal(g.slotPhase,'idle');
 const l=g.ledger;assert.equal(l.base.paidBalls+l.bonus.paidBalls,g.shots);
 assert.equal(l.base.paidPoints+l.base.freePoints+l.bonus.paidPoints+l.bonus.freePoints,g.totalPoints);
 assert.equal(l.bonus.freeBalls,l.bonusRuns*100);assert.equal(l.slotSpins,g.slotEntries);
 return{seed:job.seed,power:job.power??'varied',shots:g.shots,points:g.totalPoints,rtp:g.totalPoints/(10*g.shots),seconds:g.time,ledger:l};
}
function aggregate(rows,config){
 const ledger={base:empty(),bonus:empty(),slotSpins:0,bonusAwards:0,bonusRuns:0,duplicateBonusAwards:0};
 for(const r of rows){for(const stage of ['base','bonus'])for(const key of Object.keys(empty()))ledger[stage][key]+=r.ledger[stage][key];for(const key of ['slotSpins','bonusAwards','bonusRuns','duplicateBonusAwards'])ledger[key]+=r.ledger[key];}
 const shots=rows.reduce((s,r)=>s+r.shots,0),points=rows.reduce((s,r)=>s+r.points,0),rtp=points/(10*shots),mean=rows.reduce((s,r)=>s+r.rtp,0)/rows.length;
 const sd=rows.length>1?Math.sqrt(rows.reduce((s,r)=>s+(r.rtp-mean)**2,0)/(rows.length-1)):null;
 const t=rows.length>=30?2.045:rows.length>=16?2.131:rows.length>=8?2.365:3.182;
 const margin=sd===null?null:t*sd/Math.sqrt(rows.length);
 const stages=Object.fromEntries(['base','bonus'].map(stage=>{const l=ledger[stage],gold=(l.paidPoints+l.freePoints)/10;return[stage,{...l,paidGold:l.paidBalls,returnedGold:gold,stageRtp:l.paidBalls?gold/l.paidBalls:null,contributionToTotal:gold/shots}];}));
 return{...config,shots,points,referenceRtp:rtp,runLevel95Interval:margin===null?null:[mean-margin,mean+margin],stages,ledger,samples:rows};
}
if(!isMainThread){parentPort.postMessage(simulate(workerData));}
else{
 const args=process.argv.slice(2),arg=(key,defaultValue)=>{const i=args.indexOf('--'+key);return i<0?defaultValue:args[i+1];};
 const bonus=Number(arg('bonus',TEMPLE_SLOT_ODDS.bonus)),runs=Number(arg('runs',32)),shots=Number(arg('shots',15000)),workers=Math.min(Number(arg('workers',6)),os.availableParallelism(),runs),seedBase=Number(arg('seed',123456789)),policy=arg('policy','continuous'),power=arg('power',null);
 assert.ok(Number.isInteger(runs)&&runs>0&&Number.isInteger(shots)&&shots>0&&Number.isInteger(workers)&&workers>0);
 assert.ok(Number.isFinite(bonus)&&bonus>=0&&bonus<=1-TEMPLE_SLOT_ODDS.first-TEMPLE_SLOT_ODDS.fifteenth-TEMPLE_SLOT_ODDS.medium);
 if(power==='all')assert.equal(runs%15,0);else if(power!==null)assert.ok(Number.isInteger(Number(power))&&Number(power)>=1&&Number(power)<=15);
 TEMPLE_SLOT_ODDS.bonus=bonus;
 const config={rules:{cost:TEMPLE.cost,basePocket:TEMPLE.score,bonusSeconds:TEMPLE.bonusSeconds,bonusPoints:TEMPLE_GOLD_PORTS.map(p=>p.points)},targetRtp:.92,leftPowerSteps:15,basePocketPoints:20,model:'Full concurrent physics: all paid balls in both stages, all calendar reward chains, duplicate bonus conversion and 100 free cloud balls per complete bonus. Drain every ball/queue and return to base before measuring. Ratio of total returned gold to total paid gold; not an average of stage RTPs.',bonusChance:bonus,calendar:templeCalendarPaytable(),policy,power:power==='all'?'fixed 1–15, stratified':power===null?'uniform 1–15, change every five seconds':Number(power),runs,shotsPerRun:shots,seedBase};
 const jobs=Array.from({length:runs},(_,i)=>({shots,bonus,policy,power:power==='all'?1+i%15:power===null?null:Number(power),seed:(seedBase+Math.imul(i,2654435761))>>>0}));
 const rows=[];let cursor=0;const wallStart=Date.now();
 async function next(){while(cursor<jobs.length){const index=cursor++,job=jobs[index];const result=await new Promise((resolve,reject)=>{const worker=new Worker(new URL(import.meta.url),{workerData:job});worker.once('message',resolve);worker.once('error',reject);worker.once('exit',code=>{if(code)reject(new Error('worker exit '+code));});});rows[index]=result;console.log(JSON.stringify({completed:rows.filter(Boolean).length,runs,seed:job.seed,rtp:result.rtp}));}}
 await Promise.all(Array.from({length:workers},next));
 const report=aggregate(rows,config);report.elapsedSeconds=(Date.now()-wallStart)/1000;if(power==='all')report.strategies=Object.fromEntries(Array.from({length:15},(_,i)=>{const results=rows.filter(r=>r.power===i+1);return[i+1,aggregate(results,{power:i+1})];}));const out=arg('output','tests/temple-balance-results.json');fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:out,rtp:report.referenceRtp,interval:report.runLevel95Interval,stages:report.stages,bonusRuns:report.ledger.bonusRuns}));
}
