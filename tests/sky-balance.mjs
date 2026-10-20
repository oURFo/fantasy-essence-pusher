import assert from 'node:assert/strict';import R from '@dimforge/rapier3d-compat';
import {SkyWings} from '../src/sky-game.ts';import {SKY_PEGS} from '../src/sky-rules.ts';import {prizeSlotIndex} from '../src/config.ts';
await R.init();
const current=SKY_PEGS.map(p=>({...p}));
const previous=[];for(const [y,xs] of [[9,[-2.9,-1.74,-.58,.58,1.74,2.9]],[8.05,[-2.32,-1.16,0,1.16,2.32]],[7.1,[-2.9,-1.74,-.58,.58,1.74,2.9]],[6.15,[-2.32,-1.16,0,1.16,2.32]],[5.2,[-2.9,-1.74,-.58,.58,1.74,2.9]],[4.25,[-2.32,-1.16,0,1.16,2.32]],[3.4,[-2.9,-1.5,0,1.5,2.9]]])for(const x of xs)previous.push({x,y,radius:.105});
const random=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const use=pegs=>SKY_PEGS.splice(0,SKY_PEGS.length,...pegs);
function uniform(pegs){use(pegs);const counts=Array(7).fill(0);for(const seed of [75231,19377,91823]){const jitter=random(seed);for(let i=0;i<700;i++){const g=new SkyWings(undefined,()=>0,random(seed+i));for(const c of g.coins)g.world.removeRigidBody(c.body);g.coins=[];g.dropX=-3.15+(i+jitter())/700*6.3;g.drop();const c=g.coins.at(-1);let crossed=false;for(let f=0;f<1200;f++){g.step();if(c.slotChecked){counts[prizeSlotIndex(c.body.translation().x)]++;crossed=true;break;}}assert.ok(crossed,'single bead must cross');g.dispose();}}assert.ok(counts.every(c=>c>0));return counts;}
class Probe extends SkyWings{counts=Array(7).fill(0);onPrizeLane(lane){this.counts[lane]++;super.onPrizeLane(lane);}}
function continuous(pegs){use(pegs);const totals=Array(7).fill(0);for(const [run,seed] of [75231,19377,91823].entries()){const g=new Probe(undefined,()=>0,random(seed));g.time=run*1.2;for(let f=0;f<7200;f++){if(f%30===0)assert.equal(g.drop(),true,'max-rate player release must remain available');g.step();}for(let f=0;f<900;f++)g.step();assert.equal(g.dropped,240);assert.equal(g.counts.reduce((a,b)=>a+b,0),240,'every released bead must pass a lane under continuous play');g.counts.forEach((c,i)=>totals[i]+=c);g.dispose();}return totals;}
function rates(counts){const n=counts.reduce((a,b)=>a+b,0);return[(counts[2]+counts[4])/n,(counts[2]+counts[3]+counts[4])/n,counts[3]/n];}
try{
 const oldSingle=uniform(previous),newSingle=uniform(current);console.log(JSON.stringify({mode:'jittered-single',n:2100,oldCounts:oldSingle,newCounts:newSingle,oldRates:rates(oldSingle),newRates:rates(newSingle)}));
 for(let i=0;i<3;i++)assert.ok(rates(newSingle)[i]<=rates(oldSingle)[i]*.7,'single-bead reward rates must decrease by at least 30% at every tier');
 const oldFlow=continuous(previous),newFlow=continuous(current);console.log(JSON.stringify({mode:'continuous-2-per-second-with-bed-and-base-payouts',n:720,oldCounts:oldFlow,newCounts:newFlow,oldRates:rates(oldFlow),newRates:rates(newFlow)}));
 for(let i=0;i<3;i++)assert.ok(rates(newFlow)[i]<rates(oldFlow)[i],'continuous-flow reward lanes must be harder to hit at every tier');
}finally{use(current);}
