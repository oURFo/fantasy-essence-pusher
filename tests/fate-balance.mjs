import assert from 'node:assert/strict';
import {FATE_LEVELS,FATE_LANES,FATE_COST,FATE_JACKPOT,fateDiscExpectation} from '../src/fate-rules.ts';
import {enterFateDisc,stepFateDisc,launchFateBall,stepFateBall} from '../src/fate-physics.ts';
const samples=20000,discs=[];
for(let level=0;level<4;level++){
 const cfg=FATE_LEVELS[level],counts=Array(cfg.holes).fill(0);let maxSeconds=0,totalSeconds=0;
 for(let n=0;n<samples;n++){const b=enterFateDisc(level,(n+.5)/samples,(n*.61803398875%1)*Math.PI*2);for(let i=0;i<6000&&!b.done;i++)stepFateDisc(b);assert.equal(b.done,true,'physical disc must drain without a forced result');counts[b.hole]++;maxSeconds=Math.max(maxSeconds,b.time);totalSeconds+=b.time;}
 const rates=counts.map(n=>n/samples);assert.ok(rates.every(p=>Math.abs(p-1/cfg.holes)<.012),'equal holes should remain close to geometric reference under initial-speed variation');
 discs.push({level:level+1,holes:cfg.holes,counts,rates,redRate:rates[0],referenceRedRate:1/cfg.holes,meanSeconds:totalSeconds/samples,maxSeconds});
}
const counts=Array(9).fill(0);let expired=0,totalSeconds=0;
for(let n=0;n<samples;n++){const start=(n*.61803398875%1)*20,b=launchFateBall(-55+110*(n+.5)/samples);for(let i=0;i<4000&&!b.done;i++)stepFateBall(b,start+i/120);assert.equal(b.done,true);if(b.lane===null)expired++;else counts[b.lane]++;totalSeconds+=b.age;}
assert.ok(counts.every(n=>n>0),'all score, OUT and fate pockets must be physically reachable');
const discExpected=fateDiscExpectation(discs.map(d=>d.redRate)),fateRate=counts[4]/samples,directExpected=counts.reduce((sum,n,i)=>sum+(typeof FATE_LANES[i]==='number'?FATE_LANES[i]*n/samples:0),0),expectedPoints=directExpected+fateRate*discExpected,grandProbability=fateRate*discs.reduce((p,d)=>p*d.redRate,1);
console.log(JSON.stringify({model:'Reference only: uniform player angles and distributed obstacle/plate phases; equal-hole physical outcomes, no weighted acceptance. Real player strategy and conversion tails affect returns.',samples,discs,board:{counts,rates:counts.map(n=>n/samples),expired,meanSeconds:totalSeconds/samples},economy:{shotCostGold:FATE_COST,pointsPerGold:10,jackpotPoints:FATE_JACKPOT,nominalDiscExpectedPoints:fateDiscExpectation(),measuredDiscExpectedPoints:discExpected,fateRate,directExpectedPoints:directExpected,totalExpectedPoints:expectedPoints,referenceRtp:expectedPoints/(FATE_COST*10),jackpotPerShot:grandProbability}},null,2));
