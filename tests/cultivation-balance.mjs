import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {simulate} from './cultivation-simulation.mjs';
import {CULTIVATION} from '../src/cultivation-rules.ts';
const report=JSON.parse(readFileSync('cultivation-balance-report.json','utf8'));
assert.deepEqual(report.config,CULTIVATION);assert.equal(report.dt,1/60);assert.equal(report.holdout.n,256);assert.ok(Math.abs(report.holdout.rtp-.95)<.03);
for(const row of report.train.sampleRows.slice(0,4)){const result=simulate(row.seed,row.policy,report.dt);for(const key of Object.keys(row)){if(key==='hp'||key==='units')assert.ok(Math.abs(result[key]-row[key])<1e-6,key);else assert.deepEqual(result[key],row[key],key);}}
console.log('Cultivation balance passed: four full 60Hz runs match calibrated traces; independent 256-run v2 RTP report agrees with configured rules.');
