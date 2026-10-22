import assert from 'node:assert/strict';
import {FateOrbit} from '../src/fate-game.ts';
import {FATE_COST,FATE_JACKPOT,FATE_LANES,FATE_LEVELS,FATE_BOARD,FATE_PINS,DISC,discHolePosition,fateAward} from '../src/fate-rules.ts';
import {enterFateDisc,stepFateDisc,launchFateBall,stepFateBall,fateObstacles} from '../src/fate-physics.ts';
import {PlayerWallet} from '../src/wallet.ts';
import {ArcadeSession} from '../src/arcade-session.ts';
const ticks=(g,n)=>{for(let i=0;i<n;i++)g.step();};
const resolve=d=>{for(let i=0;i<4000&&!d.done;i++)stepFateDisc(d);assert.equal(d.done,true);return d;};
assert.equal(FATE_COST,3);assert.equal(FATE_JACKPOT,9999);assert.deepEqual(FATE_LANES,[0,10,20,40,'fate',40,20,10,0]);
assert.ok(FATE_BOARD.speed<10&&FATE_BOARD.ballRadius>=.18,'use a visible, slower rolling ball');
assert.ok(DISC.trackRadius<.3,'drain holes belong near the centre');
for(const unit of [0,.5,1]){
 const d=enterFateDisc(0,unit);let radius=d.radius;
 for(let i=0;i<4000&&!d.done;i++){stepFateDisc(d);assert.ok(d.radius<=radius+1e-9,'spiral must approach the centre');assert.ok(d.tangentSpeed/d.radius<4.8,'ball must remain slow enough to follow');radius=d.radius;}
 assert.ok(d.done&&d.time>8&&d.time<18,'allow several suspenseful turns, then drain naturally');
 assert.ok(d.angle+Math.PI/2>Math.PI*2*4,'ball makes at least four full turns before entering a hole');
}
const speeds=[];
const arc=fateObstacles(0).filter(o=>o.kind==='rotor');
assert.equal(arc.length,9);assert.ok(arc.every(o=>o.half===0),'rotor consists only of individual round pegs');
assert.ok(Math.abs(arc.at(-1).angle-arc[0].angle-Math.PI*2/3)<1e-9,'rotor spans one third of a circle');
assert.ok(arc.every(o=>Math.abs(Math.hypot(o.x,o.y-5.45)-1.05*1.3)<1e-9));
assert.ok(FATE_PINS.length>=24,'increase the fixed pin field');
assert.ok(FATE_PINS.every(p=>Math.hypot(p.x,p.y-5.45)>1.75),'fixed pins must clear the rotor sweep');
assert.ok(Math.abs(fateObstacles(1)[0].angle-arc[0].angle-.28*1.5)<1e-9,'rotor speed is 1.5 times the previous version');
const recovering=launchFateBall(0);Object.assign(recovering,{x:3.2,y:.7,vx:0,vy:-.15});for(let i=0;i<30;i++)stepFateBall(recovering,i/120);assert.ok(recovering.vy>0&&!recovering.done,'slope gravity recovers a brief downward rebound');
const floor=launchFateBall(0);Object.assign(floor,{x:0,y:.1,vx:0,vy:-.1});stepFateBall(floor,0);assert.equal(floor.done,false,'lower edge is a soft wall, not an OUT trigger');assert.ok(floor.vy>=0);
const wall=launchFateBall(0);Object.assign(wall,{x:3.5,y:1,vx:4,vy:0});stepFateBall(wall,0);assert.equal(wall.vx,0,'wall absorbs normal motion instead of bouncing');
const pin=launchFateBall(0);Object.assign(pin,{x:FATE_PINS[0].x-.2,y:FATE_PINS[0].y,vx:4,vy:0});stepFateBall(pin,0,0);assert.ok(pin.vx<0&&Math.abs(pin.vx)<.5,'pin produces only a small cushioned rebound');
const ceiling=launchFateBall(0);Object.assign(ceiling,{x:0,y:10.6,vx:0,vy:3});stepFateBall(ceiling,0);assert.equal(ceiling.done,false,'ceiling contact must not award or trigger OUT');assert.equal(ceiling.vy,0);
const ascending=launchFateBall(0);Object.assign(ascending,{x:0,y:9.99,vx:0,vy:3});stepFateBall(ascending,0);assert.equal(ascending.done,true,'upper pockets receive the ball rolling with slope gravity');
for(let level=0;level<4;level++){
 const cfg=FATE_LEVELS[level];assert.equal(cfg.holes,level+3);assert.ok(cfg.min>40);if(level)assert.ok(cfg.min>FATE_LEVELS[level-1].max);
 assert.equal(fateAward(level,0),cfg.min);assert.equal(fateAward(level,1),cfg.max);
 for(let i=0;i<cfg.holes;i++){const h=discHolePosition(cfg.holes,i,0);assert.ok(Math.abs(Math.hypot(h.x,h.y)-DISC.trackRadius)<1e-10);}
 const byHole=new Map();for(let n=0;n<2000&&byHole.size<cfg.holes;n++){const unit=(n+.5)/2000,d=resolve(enterFateDisc(level,unit));if(!byHole.has(d.hole))byHole.set(d.hole,unit);}
 assert.equal(byHole.size,cfg.holes,'each equal-sized hole must be physically reachable');speeds.push({red:byHole.get(0),white:byHole.get(1)});
 const a=resolve(enterFateDisc(level,.4321,.7)),b=resolve(enterFateDisc(level,.4321,.7));assert.deepEqual(a,b,'fixed physical state must resolve identically, without random hole acceptance');
}
function game(random=()=>.5){const g=new FateOrbit(new PlayerWallet(),random);ticks(g,30);return g;}
function gate(g,lane){assert.equal(g.shoot(),true);Object.assign(g.ball,{x:-3.2+lane*.8,y:9.99,vx:0,vy:3});ticks(g,2);}
for(let lane=0;lane<9;lane++){
 const g=game(),before=g.gold;gate(g,lane);assert.equal(g.gold,before-3);if(lane===4){assert.equal(g.phase,'portal');assert.equal(g.points,0);}else{assert.equal(g.phase,'result');assert.equal(g.points,FATE_LANES[lane]);}
}
for(let exit=0;exit<4;exit++){
 const queue=[];for(let level=0;level<=exit;level++)queue.push(level===exit?speeds[level].white:speeds[level].red);queue.push(.5);
 const g=game(()=>queue.shift()??.5);gate(g,4);assert.equal(g.shoot(),false);for(let i=0;i<5000&&g.phase!=='result';i++)g.step();assert.equal(g.phase,'result');assert.ok(g.lastAward>=FATE_LEVELS[exit].min&&g.lastAward<=FATE_LEVELS[exit].max);assert.equal(g.level,exit);assert.equal(g.gold,997,'disc progression never charges extra');const points=g.points;ticks(g,300);assert.equal(g.points,points,'points settle once');
}
const queue=speeds.map(s=>s.red),jackpot=game(()=>queue.shift()??.5);gate(jackpot,4);for(let i=0;i<5000&&jackpot.phase!=='result';i++)jackpot.step();assert.equal(jackpot.lastAward,9999);assert.equal(jackpot.jackpots,1);assert.equal(jackpot.points,9999);assert.equal(jackpot.redeem(),999);assert.equal(jackpot.points,9);assert.equal(jackpot.redeem(),0);assert.equal(jackpot.gold,1996);
const idle=game();ticks(idle,300);assert.deepEqual(idle.plateAngles,[0,0,0,0],'idle discs stay motionless');idle.wallet.setBalance(2);assert.equal(idle.shoot(),false);assert.equal(idle.gold,2);idle.points=29;assert.equal(idle.redeem(),2);assert.equal(idle.points,9);assert.equal(idle.canShoot,true,'redeeming saved points can restore playability');
const wallet=new PlayerWallet(),session=new ArcadeSession(wallet);assert.equal(session.enter('fate-orbit'),true);const g=session.game;ticks(g,30);gate(g,4);g.points=29;session.requestLeave();const time=g.time;ticks(session,30);assert.equal(g.time,time);session.cancelLeave();assert.equal(g.points,29);session.requestLeave();session.confirmLeave();assert.equal(wallet.gold,999,'leave redeems two whole coins after a three-coin shot');g.dispose();assert.equal(wallet.gold,999);session.enter('fate-orbit');assert.equal(session.game.points,0);assert.deepEqual(session.game.plateAngles,[0,0,0,0]);
const moving=fateObstacles(0),later=fateObstacles(1);assert.notEqual(moving[0].angle,later[0].angle);assert.notEqual(moving.at(-1).x,later.at(-1).x);
const board=launchFateBall(0);for(let i=0;i<4000&&!board.done;i++)stepFateBall(board,i/120);assert.equal(board.done,true);assert.ok(Number.isFinite(board.x)&&Number.isFinite(board.y));
console.log(JSON.stringify({passed:'3-coin shots, nine physical gates, equal disc holes, all four white exits, 9999 jackpot, one-time settlement, 10:1 exchange with tail, idle discs, leave and shared wallet',speeds},null,2));
