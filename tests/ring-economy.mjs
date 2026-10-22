import assert from 'node:assert/strict';
import {RING_PACKS,RING_PRIZES} from '../src/ring-rules.ts';
import {launchRing,stepRing} from '../src/ring-physics.ts';
let seed=42861;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const run=(x,power,wind)=>{const r=launchRing(x,power,wind);for(let i=0;i<800&&!r.done;i++)stepRing(r);return r.hit;};
const n=30000,hits=Array(6).fill(0);let value=0;for(let i=0;i<n;i++){const id=run((random()-.5)*6.8,random(),random());if(id!==null){hits[RING_PRIZES[id].row]++;value+=RING_PRIZES[id].price;}}
const aimed=[];for(let row=0;row<6;row++){const p=RING_PRIZES[row*8+3];let bestPower=0,bestHits=-1;for(let i=0;i<=10000;i++){const power=i/10000;if(run(p.x,power,.5)!==p.id)continue;let hits=0;for(let j=0;j<41;j++)if(run(p.x,power,(j+.5)/41)===p.id)hits++;if(hits>bestHits){bestHits=hits;bestPower=power;}}let hits=0;const samples=5000;for(let i=0;i<samples;i++)if(run(p.x,bestPower,(i+.5)/samples)===p.id)hits++;aimed.push({row:row+1,pull:bestPower,hitRate:hits/samples,valuePerRing:hits/samples*p.price});}
const cheapest=Math.min(...RING_PACKS.map(p=>p.cost/p.rings));assert.equal(cheapest,500/200);
assert.ok(value>0,'simulation must produce genuine physical hits');
console.log(JSON.stringify({model:'Uniform random position/pull with actual collision and +/-2 degree wind. Observational only; skill changes returns. No weighted payout draw.',throws:n,cheapestCostPerRing:cheapest,rowHits:hits,aimed,valuePerRing:value/n,rtpByPack:RING_PACKS.map(p=>({cost:p.cost,rings:p.rings,rtp:value/n/(p.cost/p.rings)}))},null,2));
