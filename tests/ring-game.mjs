import assert from 'node:assert/strict';
import {NightMarket} from '../src/ring-game.ts';
import {PlayerWallet} from '../src/wallet.ts';
import {ArcadeSession} from '../src/arcade-session.ts';
import {RING_PACKS,RING_PRIZES,HOOP,RING_PLATFORMS} from '../src/ring-rules.ts';
import {launchRing,stepRing} from '../src/ring-physics.ts';
assert.deepEqual(RING_PACKS.map(p=>[p.cost,p.rings]),[[100,30],[300,100],[500,200]]);
assert.equal(RING_PRIZES.length,48);assert.ok(RING_PRIZES.every(p=>p.radius<HOOP.inner));
const run=r=>{for(let i=0;i<800&&!r.done;i++)stepRing(r);assert.equal(r.done,true);return r;};
const powers=[];for(let row=0;row<6;row++){const p=RING_PRIZES[row*8];let power;for(let i=0;i<=10000;i++){if(run(launchRing(p.x,i/10000,.5)).hit===p.id){power=i/10000;break;}}assert.notEqual(power,undefined,`row ${row+1} must be reachable`);powers.push(power);}
for(const p of RING_PRIZES)assert.equal(run(launchRing(p.x,powers[p.row],.5)).hit,p.id,'all 48 targets are reachable through live physics');
assert.equal(run(launchRing(0,0,.5)).hit,null,'a floor miss never grants a prize');
const grazing=run(launchRing(RING_PRIZES[0].x+HOOP.inner,powers[0],.5));assert.equal(grazing.hit,null);assert.ok(grazing.bounces>0,'grazing the outside must collide');
for(const unit of [0,.25,.5,.75,1]){const r=launchRing(0,.8,unit);assert.ok(Math.abs(r.wind)<=2*Math.PI/180+1e-10);assert.equal(Math.sign(r.wind),Math.sign(unit-.5));}
const wallet=new PlayerWallet(),g=new NightMarket(wallet,()=>.5);assert.equal(g.throw(0,.5),false);assert.equal(g.buy(99),false);assert.equal(g.buy(0),true);assert.equal(wallet.gold,900);assert.equal(g.rings,30);assert.equal(g.buy(1),true);assert.equal(g.rings,130);assert.equal(wallet.gold,600);assert.equal(g.buy(2),true);assert.equal(g.rings,330);assert.equal(wallet.gold,100);assert.equal(g.buy(2),false);assert.equal(g.rings,330);
function win(id){for(let i=0;i<80;i++)g.step();assert.equal(g.throw(RING_PRIZES[id].x,powers[RING_PRIZES[id].row]),true);assert.equal(g.throw(0,.5),false);for(let i=0;i<500&&g.active;i++)g.step();assert.equal(g.lastHit,id);}
win(0);assert.equal(g.inventory[0],1);assert.equal(wallet.gold,100,'capture goes into bag, never directly credits coins');const once=g.bagCount;for(let i=0;i<200;i++)g.step();assert.equal(g.bagCount,once);win(0);assert.equal(g.inventory[0],2,'same prize can be captured repeatedly');win(4);assert.equal(g.inventory[0],3,'same prize variant on another bottle merges into one bag stack');assert.equal(g.inventory[4],0);win(8);assert.equal(g.bagValue,25);assert.equal(g.sell(0),15);assert.equal(wallet.gold,115);assert.equal(g.inventory[0],0);assert.equal(g.sell(0),0);assert.equal(g.sell(8.5),0);assert.equal(g.sell(),10);assert.equal(g.bagCount,0);assert.equal(wallet.gold,125);
const session=new ArcadeSession(wallet);session.enter('night-market');const sg=session.game;sg.buy(0);sg.inventory[40]=2;const value=sg.bagValue;session.requestLeave();const time=sg.time;session.step();assert.equal(sg.time,time);session.cancelLeave();assert.equal(sg.bagValue,value);session.requestLeave();const before=wallet.gold;session.confirmLeave();assert.equal(wallet.gold,before+value,'leave sells bag exactly once');sg.dispose();assert.equal(wallet.gold,before+value);assert.equal(sg.rings,0);session.enter('night-market');assert.equal(session.game.bagCount,0);assert.equal(session.game.rings,0);
console.log(JSON.stringify({passed:'ring packs, all 48 physical targets, wind, grazing collision, single capture, duplicate prizes, sell, leave settlement and fresh entry',powers},null,2));

assert.equal(RING_PLATFORMS.length,6);assert.ok(RING_PRIZES.every(p=>p.base===RING_PLATFORMS[p.row].height));
const low=launchRing(0,.3,.5);Object.assign(low,{x:0,z:RING_PLATFORMS[0].front-HOOP.outer-.01,y:.1,vy:0,vz:3});stepRing(low);assert.ok(low.vz<0,'rings below a stand top bounce against its front edge');
console.log('Raised stand validation passed: six aligned support heights and solid front edges.');

for(const multiplier of [1.2,1.31]){const p=RING_PRIZES[0],r=launchRing(p.x,0,.5);Object.assign(r,{x:p.x+(HOOP.inner-p.radius)*multiplier,z:p.z,y:p.base+p.height+.001,vx:0,vz:0,vy:-1});run(r);assert.equal(r.hit===p.id,multiplier<1.3,'hit clearance must expand by exactly 1.3, without granting outside hits');}
console.log('Ring clearance passed: 1.2x old error accepted; 1.31x rejected.');
