import assert from 'node:assert/strict';
import {TempleFortune} from '../src/temple-game.ts';import {PlayerWallet} from '../src/wallet.ts';
const wallet=new PlayerWallet(),g=new TempleFortune(wallet,()=>.5),start=wallet.gold;
function scoreLast(x,y){const b=g.balls.at(-1);b.rail=1;b.x=x;b.y=y-1;b.vx=0;b.vy=5;g.step();}
assert.ok(g.shoot());scoreLast(290,955);assert.equal(g.ledger.base.paidBalls,1);assert.equal(g.ledger.base.paidPoints,20);
g.pendingBalls=1;g.step();scoreLast(735,955);assert.equal(g.ledger.base.freeBalls,1);assert.equal(g.ledger.base.freePoints,20);
g.phase='bonus';g.phaseAt=g.time;g.cloudBalls=100;g.time+=.5;assert.ok(g.shoot());scoreLast(512,1090);assert.equal(g.ledger.bonus.paidBalls,1);assert.equal(g.ledger.bonus.paidPoints,200);
g.cloudBalls=0;g.lastCloud=g.time-1;g.step();scoreLast(220,1090);assert.equal(g.ledger.bonus.freeBalls,1);assert.equal(g.ledger.bonus.freePoints,10);
assert.equal(wallet.gold,start-2,'only paid balls count as spending');assert.equal(g.totalPoints,250);assert.equal(g.redeem(),25);assert.equal(wallet.gold,start-2+25);
assert.equal(g.ledger.base.paidPoints+g.ledger.base.freePoints+g.ledger.bonus.paidPoints+g.ledger.bonus.freePoints,g.totalPoints);
const cost=g.ledger.base.paidBalls+g.ledger.bonus.paidBalls;assert.equal(g.totalPoints/10/cost,12.5,'both stage costs are in the RTP denominator');
console.log('Temple RTP ledger passed: base paid/free, bonus paid/cloud, wallet costs, award conversion and full two-stage denominator.');
