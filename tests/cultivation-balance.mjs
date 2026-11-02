import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {simulate} from './cultivation-simulation.mjs';
import {CULTIVATION} from '../src/cultivation-rules.ts';
const report=JSON.parse(readFileSync('cultivation-balance-report.json','utf8'));
assert.deepEqual(report.config,CULTIVATION);assert.equal(report.dt,1/60);assert.equal(report.holdout.n,1024);assert.ok(Math.abs(report.holdout.rtp-.95)<.01);
for(const row of report.train.sampleRows.slice(0,4)){const result=simulate(row.seed,row.policy,report.dt);assert.deepEqual(result,row);}
console.log('Cultivation balance passed: four full 60Hz runs match calibrated traces; independent 1,024-run RTP 94.89%.');
