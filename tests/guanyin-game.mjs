import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GuanyinGrace} from '../src/guanyin-game.ts';
import {GUANYIN,GUANYIN_PINS,GUANYIN_OUTS,GUANYIN_SCORE,guanyinBowlY,GUANYIN_LAUNCH,guanyinRailPoint,GUANYIN_SYMBOLS,guanyinOutcome,guanyinReels,guanyinSeed} from '../src/guanyin-rules.ts';
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

// Continuous rail motion and force-based free flight; no power-dependent teleport.
{
 const exits=[];for(const power of [1,8,15]){const b=guanyinBall(100+power,power,.5);let previous={x:b.x,y:b.y},steps=0;while(b.rail<1&&steps++<600){stepGuanyinBall(b,0);assert.ok(Math.hypot(b.x-previous.x,b.y-previous.y)<15,'rail motion remains continuous');previous={x:b.x,y:b.y};}assert.equal(b.rail,1);const exit=guanyinRailPoint(GUANYIN_LAUNCH.length);assert.ok(Math.hypot(b.x-exit.x,b.y-exit.y)<1e-8);assert.ok(b.vx>0);assert.ok(Math.abs(b.vy)<1e-6);const vx=b.vx,vy=b.vy,x=b.x,y=b.y;stepGuanyinBall(b,0);assert.ok(b.x>x);assert.ok(b.y>y);assert.ok(b.vy>vy);assert.ok(b.vx<=vx);exits.push(vx);}assert.ok(exits[0]<exits[1]&&exits[1]<exits[2],'power changes launch velocity, never rail exit position');
}
for(const x of [160,260,390,630,760,864]){
 const b=guanyinBall(500+x,8,.5);Object.assign(b,{x,y:guanyinBowlY(x)-12,vx:0,vy:60,rail:1});let arrived=false;for(let i=0;i<2400&&!b.done;i++){stepGuanyinBall(b,0);if(b.done&&b.result==='score'){arrived=true;assert.ok(Math.hypot(b.x-GUANYIN_SCORE.x,b.y-GUANYIN_SCORE.y)<GUANYIN_SCORE.r+12,'only the center inlet pays');}}assert.ok(arrived,'both curved sides must deliver to the central inlet');
}
console.log('Guanyin v2 passed: continuous energy-driven launch, fixed tangent exit, ballistic force integration and one central scoring inlet fed by curved bowl.');
{
 const b=guanyinBall(900,8,.5);Object.assign(b,{x:210,y:1220,vx:0,vy:50,rail:1});stepGuanyinBall(b,0);assert.equal(b.done,false,'crossing the old flat bottom line outside center does not award');assert.equal(b.result,null);
 const a=guanyinBall(901,8,.5);while(a.rail<1)stepGuanyinBall(a,0);const copy={...a,power:15};stepGuanyinBall(a,0);stepGuanyinBall(copy,0);assert.equal(a.x,copy.x);assert.equal(a.y,copy.y,'free flight is driven only by current velocity and force');
 const {readRgba}=await import('./png-rgba.mjs');const im=readRgba('public/assets/guanyin/ports-v2.png');for(let row=0;row<2;row++)for(let col=0;col<2;col++){let n=0;for(let y=Math.floor(row*im.height/2);y<Math.floor((row+1)*im.height/2);y++)for(let x=Math.floor(col*im.width/2);x<Math.floor((col+1)*im.width/2);x++)if(im.rgba[(y*im.width+x)*4+3]>70)n++;assert.ok(n>1000,'each sculpted port/trough cell has artwork');}
}
