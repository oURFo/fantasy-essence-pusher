import assert from 'node:assert/strict';import fs from 'node:fs';
import {TEMPLE,TEMPLE_GOLD_PORTS,templeCalendarPaytable} from '../src/temple-rules.ts';
const d=JSON.parse(fs.readFileSync(new URL('./temple-balance-results.json',import.meta.url),'utf8'));
assert.deepEqual(d.calendar,templeCalendarPaytable(),'changed slot odds require a new full RTP run');
assert.deepEqual(d.rules,{cost:TEMPLE.cost,basePocket:TEMPLE.score,bonusSeconds:TEMPLE.bonusSeconds,bonusPoints:TEMPLE_GOLD_PORTS.map(p=>p.points)});
assert.equal(d.shots,480000);assert.equal(d.samples.length,32);assert.equal(new Set(d.samples.map(r=>r.seed)).size,32);
let shots=0,points=0;for(const r of d.samples){const l=r.ledger;assert.equal(r.shots,l.base.paidBalls+l.bonus.paidBalls);assert.equal(r.points,l.base.paidPoints+l.base.freePoints+l.bonus.paidPoints+l.bonus.freePoints);assert.equal(l.bonus.freeBalls,l.bonusRuns*100);assert.equal(r.rtp,r.points/(10*r.shots));shots+=r.shots;points+=r.points;}
assert.equal(shots,d.shots);assert.equal(points,d.points);assert.equal(d.referenceRtp,points/(10*shots));
assert.ok(Math.abs(d.referenceRtp-.92)<.01,'independent sample should remain close to the 92% target');assert.ok(d.runLevel95Interval[0]<.92&&d.runLevel95Interval[1]>.92);
assert.ok(Math.abs(d.stages.base.contributionToTotal+d.stages.bonus.contributionToTotal-d.referenceRtp)<1e-12);
console.log('Temple 92% fixture passed: live rules match, 480,000 independent paid balls, both-stage cost/return accounting and target acceptance.');
