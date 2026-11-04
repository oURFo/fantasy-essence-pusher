import assert from 'node:assert/strict';
import {ArcadeSession} from '../src/arcade-session.ts';
import {WonderTrain} from '../src/train-game.ts';
import {PlayerWallet} from '../src/wallet.ts';
import {TRAIN,TRAIN_ITEMS,TRAIN_COMBOS,TRAIN_MISSIONS,trainChance,trainSeed} from '../src/train-rules.ts';
import {trainFrames} from '../src/train-rendering.ts';
import {readRgba} from './png-rgba.mjs';
import {simulateTrain} from './train-simulation.mjs';
import {readFileSync} from 'node:fs';
function setup(){const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},wallet=new PlayerWallet(storage),g=new WonderTrain(wallet,storage,trainSeed(71));g.targets=[];g.nextStack=Infinity;return {g,wallet,storage};}
function classic(g){g.spawn(512,0);g.targets.slice(-3).forEach((t,i)=>t.points=[10,15,10][i]);}
assert.ok(TRAIN_COMBOS.length>=15);assert.ok(TRAIN_MISSIONS.length>=20);assert.equal(new Set(TRAIN_COMBOS.map(c=>c.name)).size,18);
for(const m of TRAIN_MISSIONS)assert.ok(m.reward<=TRAIN_ITEMS[m.type].points*m.count*.1);
{
 const {g,wallet,storage}=setup();classic(g);const [bottom,middle,top]=g.targets;assert.equal(g.total(top),10);assert.equal(g.total(middle),25);assert.equal(g.total(bottom),35);
 let rolls=0;g.random=()=>{rolls++;return .4;};const money=wallet.gold;assert.equal(g.impact(middle,1),false,'25-point total probability, not just 15-point middle');assert.equal(rolls,1);assert.equal(g.broken,0);
 g.random=()=>0;assert.ok(g.impact(middle,1));assert.equal(g.pending,25);assert.equal(g.points,0);assert.equal(wallet.gold,money,'display precedes wallet credit');assert.equal(g.impact(top,5),false,'removed upper item cannot pay twice');assert.equal(g.total(bottom),10);
 for(let i=0;i<77;i++)g.step();assert.equal(g.points,0);for(let i=0;i<3;i++)g.step();assert.equal(g.points,25);assert.equal(wallet.gold,money+2);assert.equal(g.tail,5);g.dispose();g.dispose();assert.equal(wallet.gold,money+2);assert.equal(new WonderTrain(wallet,storage).tail,5);
}
{
 const {g,wallet}=setup();classic(g);g.random=()=>0;g.impact(g.targets[0],1);g.dispose();assert.equal(g.points,35);assert.equal(wallet.gold,1003);assert.equal(g.tail,5);assert.equal(g.tasks.length,0);assert.equal(g.shoot(),false);
}
{
 const {g,wallet}=setup();g.setBet(5);g.setBet(7);assert.equal(g.bet,5);assert.ok(g.shoot());const paidShot=g.shots[0];assert.equal(g.shoot(),false);assert.equal(wallet.gold,995);g.setBet(1);g.step(.1);g.step(.1);g.step(.1);g.step(.1);g.step(.1);assert.ok(g.shoot());assert.equal(paidShot.bet,5,'flying shot keeps its paid tier');g.setAuto(true);wallet.setBalance(0);g.step();assert.equal(g.auto,false);
}
{
 const {g,wallet}=setup();g.tasks=[{template:0,progress:4},{template:2,progress:0},{template:4,progress:0}];g.spawn(400,0);g.random=()=>0;g.impact(g.targets[2],1);assert.equal(g.missions,1);assert.equal(g.pending,150);assert.equal(g.points,0);g.dispose();assert.equal(g.points,150);assert.equal(wallet.gold,1015);
}
{
 const {g}=setup();classic(g);g.random=()=>0;g.shoot();for(let i=0;i<20;i++)g.step();assert.equal(g.hits,1,'one physical marble validates only its first target');assert.equal(g.broken,3);assert.equal(g.pending,35);assert.equal(g.points,0);
}
for(const name of ['items','launcher']){const p=readRgba(`public/assets/wonder-train/${name}.png`),frames=trainFrames(p.rgba,p.width,p.height,name);assert.equal(frames.length,name==='items'?16:2);for(const f of frames)assert.ok(f.indices.length>1000);}
assert.ok(trainChance(25,5)>trainChance(25,1));assert.equal(trainChance(0,1),0);
const report=JSON.parse(readFileSync('train-balance-report.json','utf8'));assert.deepEqual(report.config,TRAIN);assert.ok(Math.abs(report.rtp-.95)<.025);assert.equal(report.reference.reduce((n,r)=>n+r.shots,0),500000);
for(const row of report.reference.slice(0,2))assert.deepEqual(simulateTrain(row.seed,row.bet,row.shots),row);
console.log('Wonder Train passed: support-chain totals, independent probability, no double credit, delayed/exit settlement, tail persistence, 1-5 billing/cooldown, tasks, selected-layer flight, 18 combos/24 tasks, complete AI frames and RTP report.');

{
 const {wallet,storage}=setup(),session=new ArcadeSession(wallet,undefined,storage);assert.ok(session.enter('wonder-train'));const g=session.game;g.targets=[];classic(g);g.random=()=>0;g.impact(g.targets[0],1);g.setAuto(true);session.requestLeave();const time=g.time;session.step();assert.equal(g.time,time);assert.equal(wallet.gold,1000);assert.ok(session.confirmLeave());assert.equal(wallet.gold,1003);assert.equal(session.game,null);assert.ok(session.enter('wonder-train'));assert.equal(session.game.points,0);assert.equal(session.game.tail,5);assert.ok(session.game.tasks.every(t=>t.progress===0));assert.equal(session.game.auto,false);session.requestLeave();session.confirmLeave();assert.equal(wallet.gold,1003);
}
assert.ok(report.misses.hits<report.misses.shots);assert.equal(report.misses.spent,report.misses.shots*report.misses.bet);

{
 const {g}=setup();g.spawn(500,1);const t=g.targets.at(-1);t.points=100;g.random=()=>.9999;assert.equal(g.impact(t,1),false);assert.equal(t.credit,2.5);assert.equal(g.effective(t),97.5);assert.equal(t.points,100);assert.equal(g.impact(t,5),false);assert.equal(t.credit,15);assert.equal(g.effective(t),85);const id=t.id,stack=t.stack;for(let i=0;i<1800;i++)g.step();const returned=g.targets.find(o=>o.id===id);assert.ok(returned);assert.equal(returned.stack,stack);assert.ok(returned.lap>=1);assert.equal(returned.credit,15);assert.equal(returned.points,100);assert.equal(g.effective(returned),85);g.random=()=>0;const before=g.pending;g.impact(returned,1);assert.equal(g.pending-before,100,'credit never reduces awarded face value');
}
{
 const {g}=setup();g.spawn(512,0);const [bottom,middle,top]=g.targets;g.random=()=>0;g.aim(middle.x,middle.bottom-middle.h/2);assert.ok(g.shoot());g.aim(bottom.x,bottom.bottom-bottom.h/2);for(let i=0;i<30;i++)g.step();assert.equal(bottom.live,true,'lower layer must not intercept a shot aimed at middle');assert.equal(middle.live,false);assert.equal(top.live,false);assert.equal(g.pending,250);assert.equal(g.broken,2);
}
{
 const {g}=setup();g.spawn(512,0);const [bottom,middle,top]=g.targets;g.random=()=>.9999;g.impact(top,1);g.impact(middle,2);assert.equal(top.credit,2.5);assert.equal(middle.credit,5);assert.equal(g.effective(bottom),350-7.5);assert.equal(g.total(bottom),350);
}
console.log('Train v2 passed: persistent per-item failed-shot credit across loops, unmodified awards, carried credit sum and direct middle-layer targeting.');
