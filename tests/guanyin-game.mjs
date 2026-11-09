import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GuanyinGrace} from '../src/guanyin-game.ts';
import {GUANYIN,GUANYIN_PINS,GUANYIN_OUTS,GUANYIN_SYMBOLS,guanyinOutcome,guanyinReels,guanyinSeed} from '../src/guanyin-rules.ts';
import {guanyinBall,stepGuanyinBall} from '../src/guanyin-physics.ts';
import {PlayerWallet} from '../src/wallet.ts';
import {ArcadeSession} from '../src/arcade-session.ts';
const make=(unit=.9)=>{const w=new PlayerWallet();w.setBalance(10000);return new GuanyinGrace(w,()=>unit);};
const step=(g,n)=>{for(let i=0;i<n;i++)g.step();};
const spin=(g,unit)=>{g.random=()=>unit;g.slotQueue++;step(g,100);};
{
 const g=make();assert.equal(g.bottle,50);assert.ok(g.shoot());assert.equal(g.gold,9997);assert.equal(g.shoot(),false);step(g,30);assert.ok(g.shoot());assert.equal(g.gold,9994);g.wallet.setBalance(2);step(g,30);assert.equal(g.shoot(),false);assert.equal(g.gold,2);g.setPower(99);assert.equal(g.power,15);
}
{
 const g=make();for(let i=0;i<20;i++){assert.ok(g.shoot());step(g,31);}assert.equal(g.paidShots,20);assert.equal(g.bottle,51);assert.equal(g.ledger.refills,1);assert.equal(g.paidRefillProgress,0);
 const count=g.paidShots;g.pendingBalls=20;step(g,200);assert.equal(g.paidShots,count);assert.equal(g.bottle,51,'free balls do not refill bottle');
}
for(const [unit,index,balls] of [[.09,2,10],[.15,3,5],[.25,4,3],[.4,5,2]]){const g=make();spin(g,unit);assert.equal(g.outcome,index);assert.deepEqual(g.reels,[index,index,index]);assert.equal(g.pendingBalls+g.emittedGift,balls);assert.equal(g.paidShots,0);assert.equal(g.gold,10000);}
{
 const g=make();spin(g,.9);assert.equal(g.outcome,-1);assert.notEqual(new Set(g.reels).size,1);assert.equal(g.pendingBalls,0);assert.equal(g.bottle,50);
}
{
 const g=make();spin(g,.02);assert.equal(g.outcome,1);step(g,30);assert.ok(g.gate>.99);assert.ok(g.gateRemaining>9);const first=g.gateUntil;g.slotPhase='idle';spin(g,.02);assert.ok(g.gateUntil>first);step(g,650);assert.equal(g.gateRemaining,0);assert.equal(g.gate,0);
}
{
 const g=make();g.bottle=81;spin(g,.001);assert.equal(g.outcome,0);assert.equal(g.pourTotal,81);assert.ok(g.pouring);g.paidRefillProgress=19;assert.ok(g.shoot());assert.equal(g.ledger.refills,1);for(let i=0;i<2000&&g.pouring;i++)g.step();assert.equal(g.emittedBottle,81);assert.equal(g.bottle,51);assert.equal(g.pourRemaining,0);assert.equal(g.ledger.jackpots,1);
}
{
 const g=make();for(const result of ['score','out','slot']){const b=guanyinBall(1,8,.5);b.done=true;b.result=result;g.balls=[b];g.step();}assert.equal(g.points,40);assert.equal(g.scored,1);assert.equal(g.outs,1);assert.equal(g.slotEntries,1);const before=g.totalPoints;step(g,2);assert.equal(g.totalPoints,before);assert.equal(g.redeem(),4);assert.equal(g.gold,10004);g.points=49;g.dispose();g.dispose();assert.equal(g.gold,10008);assert.equal(g.points,0);assert.equal(g.shoot(),false);
}
for(let i=0;i<GUANYIN_PINS.length;i++){const a=GUANYIN_PINS[i];assert.ok(a.x-154>=a.r+16);assert.ok(870-a.x>=a.r+16);for(const b of GUANYIN_PINS.slice(i+1))assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>a.r+b.r+16+4,'no narrow peg trap');}
for(const port of GUANYIN_OUTS){const open=guanyinBall(1,8,.5);Object.assign(open,{x:port.x,y:1118,vx:0,vy:200,rail:1});for(let i=0;i<60&&!open.done;i++)stepGuanyinBall(open,0);assert.equal(open.result,'out');const shut=guanyinBall(1,8,.5);Object.assign(shut,{x:port.x,y:1070,vx:60,vy:80,rail:1});for(let i=0;i<1000&&!shut.done;i++)stepGuanyinBall(shut,1);assert.notEqual(shut.result,'out','closed plate physically blocks OUT');assert.equal(shut.done,true,'shutter cannot leave a ball stuck');}
{
 const session=new ArcadeSession(new PlayerWallet());assert.ok(session.enter('guanyin-grace'));assert.ok(session.game instanceof GuanyinGrace);session.game.points=40;session.requestLeave();assert.ok(session.confirmLeave());assert.equal(session.wallet.gold,1004);assert.ok(session.enter('guanyin-grace'));assert.equal(session.game.bottle,50);assert.equal(session.game.points,0);
}
const report=JSON.parse(readFileSync('guanyin-balance-report.json','utf8'));assert.deepEqual(report.config,GUANYIN);assert.ok(Math.abs(report.rtp-.92)<.015);assert.equal(report.rows.reduce((s,r)=>s+r.shots,0),45000);assert.ok(report.rows.every(r=>r.unfinished===0));assert.ok(report.rows.some(r=>r.ledger.jackpots>0));assert.ok(report.rows.some(r=>r.ledger.willows>0));
console.log('Guanyin passed: 3-coin billing, 20-paid refill, bottle accumulation/pouring/refill isolation, six outcomes/losing reels, gate movement/refresh/physical blocking, 40-point scoring, repeat payout prevention, pin clearance, leave/reset and 45,000-shot RTP report.');

{
 const {readRgba}=await import('./png-rgba.mjs');const bytes=readFileSync('public/assets/guanyin/cabinet.png');assert.ok(bytes.readUInt32BE(16)>=1024&&bytes.readUInt32BE(20)>=1536);for(const name of ['sprites','guanyin']){const im=readRgba(`public/assets/guanyin/${name}.png`);assert.ok(im.width>=1024&&im.height>=1024);if(name!=='cabinet')assert.ok(im.rgba.some((v,i)=>i%4===3&&v===0),'transparent art asset');}
 const {simulateGuanyin}=await import('../tools/guanyin-balance.mjs');assert.deepEqual(simulateGuanyin(report.rows[0].seed,report.rows[0].shots,report.rows[0].power),report.rows[0],'report reproduces current physical gameplay');
}
