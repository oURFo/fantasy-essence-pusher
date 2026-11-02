import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {simulate} from './cultivation-simulation.mjs';
import {CULTIVATION} from '../src/cultivation-rules.ts';
const report=JSON.parse(readFileSync('cultivation-balance-report.json','utf8'));
assert.deepEqual(report.config,CULTIVATION);assert.equal(report.dt,1/60);assert.equal(report.holdout.n,512);assert.ok(Math.abs(report.holdout.rtp-CULTIVATION.targetRtp)<.03);
for(const row of report.train.sampleRows.slice(0,4)){const result=simulate(row.seed,row.policy,report.dt);assert.equal(result.xpDropped,result.xpCollected+result.xpLeft);for(const key of Object.keys(row)){if(key==='hp'||key==='units')assert.ok(Math.abs(result[key]-row[key])<1e-6,key);else assert.deepEqual(result[key],row[key],key);}}
console.log('Cultivation balance passed: four full 60Hz runs match calibrated traces; independent 512-run XP pickup RTP report agrees with configured rules.');

assert.ok(report.beginner.rtp>1,'low-movement reference must also improve beyond 100%');for(const name of ['train','holdout','beginner','expert','idle']){const r=report[name];assert.equal(r.paidTargetSlots-r.hitTargetSlots,r.unusedTargetSlots);assert.ok(r.avgXpCollected<=r.avgXpDropped);}
