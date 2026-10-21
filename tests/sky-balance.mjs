import assert from 'node:assert/strict';import R from '@dimforge/rapier3d-compat';
import {SkyWings} from '../src/sky-game.ts';import {SKY_PEGS} from '../src/sky-rules.ts';import {prizeSlotIndex} from '../src/config.ts';
await R.init();
const current=SKY_PEGS.map(p=>({...p}));
const random=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const use=pegs=>SKY_PEGS.splice(0,SKY_PEGS.length,...pegs);
function uniform(pegs){use(pegs);const counts=Array(7).fill(0);for(const seed of [75231,19377,91823]){const jitter=random(seed);for(let i=0;i<700;i++){const g=new SkyWings(undefined,()=>0,random(seed+i));for(const c of g.coins)g.world.removeRigidBody(c.body);g.coins=[];g.dropX=-3.15+(i+jitter())/700*6.3;g.drop();const c=g.coins.at(-1);let crossed=false;for(let f=0;f<1200;f++){g.step();if(c.slotChecked){counts[prizeSlotIndex(c.body.translation().x)]++;crossed=true;break;}}assert.ok(crossed,'single bead must cross');g.dispose();}}assert.ok(counts.every(c=>c>0));return counts;}
class Probe extends SkyWings{counts=Array(7).fill(0);onPrizeLane(lane){this.counts[lane]++;super.onPrizeLane(lane);}}
function continuous(pegs){use(pegs);const totals=Array(7).fill(0);for(const [run,seed] of [17493,83217,39127,67391,98123,31729,42831,76129,57213,92417,61237,28791].entries()){const g=new Probe(undefined,()=>0,random(seed));g.time=run*1.2;for(let f=0;f<7200;f++){if(f%30===0)assert.equal(g.drop(),true,'max-rate player release must remain available');g.step();}for(let f=0;f<900;f++)g.step();assert.equal(g.dropped,240);assert.equal(g.counts.reduce((a,b)=>a+b,0),240,'every released bead must pass a lane under continuous play');g.counts.forEach((c,i)=>totals[i]+=c);g.dispose();}return totals;}
function rates(counts){const n=counts.reduce((a,b)=>a+b,0);return[(counts[2]+counts[4])/n,(counts[2]+counts[3]+counts[4])/n,counts[3]/n];}
const single=uniform(current),flow=continuous(current),n=flow.reduce((a,b)=>a+b,0);
console.log(JSON.stringify({mode:'uniform-single',n:2100,counts:single}));
console.log(JSON.stringify({mode:'2-per-second-with-bed-and-base-payouts',n,counts:flow,centralRates:[2,3,4].map(i=>flow[i]/n),targets:[.03,.01,.03]}));
// Finite physical samples vary. These are absolute percentage-point tolerances,
// never runtime rejection gates. Manual timing can change the observed rates.
for(const [i,target,tolerance] of [[2,.03,.0075],[3,.01,.004],[4,.03,.0075]])assert.ok(Math.abs(flow[i]/n-target)<=tolerance,`lane ${i+1}: ${flow[i]}/${n} outside physical calibration tolerance`);
assert.equal(n,2880);
