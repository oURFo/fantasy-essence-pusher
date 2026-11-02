import assert from 'node:assert/strict';
import {Cultivation} from '../src/cultivation-game.ts';
import {PlayerWallet} from '../src/wallet.ts';
import {CULTIVATION as C,CULT_KEY,skillStats,manaCost,enemyStats,seeded} from '../src/cultivation-rules.ts';
function setup(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},w=new PlayerWallet(storage),g=new Cultivation(w,storage,seeded(42));return {data,storage,w,g};}
function quiet(g){g.spawnAt=Infinity;g.jarAt=Infinity;g.bossIndex=3;}
function enemy(id,x,y,hp=10000){return {id,x,y,hp,maxHp:hp,kind:0,speed:0,damage:10,radius:15,attackAt:Infinity,waveAt:Infinity,boss:null,hitAt:-10};}
{
 const {g,w,storage}=setup();assert.equal(g.buy(100),100);assert.equal(w.gold,900);assert.equal(g.mana,1000);assert.equal(g.buy(200),100);assert.equal(w.gold,800);assert.equal(g.buy(10),0);g.mana=1997;assert.equal(g.buy(10),0,'do not charge a coin for less than ten mana');g.mana=1987;assert.equal(g.buy(10),1);assert.equal(g.mana,1997);assert.equal(g.buy(Infinity),0);assert.equal(g.purchaseQuote(NaN),0);
 g.persist();assert.equal(new Cultivation(w,storage).mana,1997);g.earn(10001);assert.equal(g.pointsMilli,1);assert.equal(new Cultivation(w,storage).pointsMilli,1);
 assert.ok(g.start());assert.equal(g.buy(10),0,'no direct purchases while combat runs');quiet(g);const m=g.mana;g.step(.05);assert.equal(g.mana,m,'no target no mana cost');
 g.openShop();const t=g.time,h=g.player.hp;g.step(.1);assert.equal(g.time,t);assert.equal(g.player.hp,h);g.closeShop();assert.equal(g.phase,'playing');g.pause();g.openShop();g.closeShop();assert.equal(g.phase,'paused','shop preserves paused run');g.pause();assert.equal(g.phase,'playing');
 g.phase='upgrade';g.choices=['heal','regen','power'];g.player.hp=1;g.step(.1);assert.equal(g.time,t);assert.equal(g.choose('sword'),false);assert.ok(g.choose('heal'));assert.equal(g.player.hp,g.player.maxHp);assert.equal(g.mana,m,'healing does not create mana');
}
{
 const {g}=setup();g.buy(200);g.start();quiet(g);g.skills={sword:5,fire:5,thunder:5};g.enemies=Array.from({length:12},(_,i)=>enemy(i,g.player.x+30+i*3,g.player.y));const before=g.mana;g.step(.01);
 const stats=['sword','fire','thunder'].map(s=>skillStats(s,5,g.level,g.minute,g.upgrades.power));assert.equal(g.hits,stats.reduce((n,s)=>n+s.cap,0),'unique per-cast targets obey caps');assert.equal(before-g.mana,stats.reduce((n,s)=>n+manaCost(s.damage,s.cap),0));
 assert.ok(manaCost(stats[0].damage,1)<manaCost(stats[0].damage,4),'bill actual target count, not maximum capacity');
}
{
 const {g,w,storage}=setup();g.buy(100);g.start();quiet(g);g.random=()=>0;g.jar={x:g.player.x+20,y:g.player.y,hp:1,expires:10,corner:0};g.step(.01);assert.equal(g.dragons,1);assert.equal(g.jar,null);assert.equal(g.jarsBroken,1);assert.equal(g.pointsMilli,0,'jar itself has no kill payout');
 g.skillAt.sword=Infinity;g.jar={x:85,y:95,hp:1,expires:g.time+.02,corner:0};g.step(.03);assert.equal(g.jar,null,'exact ten-second-style expiry uses active time');
 g.earn(7000);const mana=g.mana,points=g.pointsMilli;g.player.hp=1;g.enemies=[{...enemy(1,g.player.x,g.player.y),attackAt:-1}];g.step(.01);assert.equal(g.phase,'dead');assert.equal(g.mana,mana);assert.equal(g.pointsMilli,points);assert.ok(g.start());assert.equal(g.dragons,0);assert.equal(g.level,1);assert.equal(g.upgrades.regen,0);g.dispose();const r=new Cultivation(w,storage);assert.equal(r.phase,'ready');assert.equal(r.mana,mana);assert.equal(r.pointsMilli,points);
}
{
 const {g,w}=setup();g.buy(200);g.start();quiet(g);g.time=899.99;g.finalKilled=true;g.dragons=5;const before=w.gold;g.step(.02);assert.equal(g.phase,'bonus-intro');assert.equal(w.gold,before+C.clearGold);assert.ok(g.normalCleared);g.openShop();g.closeShop();assert.equal(g.phase,'bonus-intro');assert.ok(g.beginBonus());assert.equal(g.enemies.filter(e=>e.boss==='dragon').length,1);g.enemies[0].hp=0;g.step(.01);assert.equal(g.phase,'victory');assert.ok(g.bonusCleared);const gold=w.gold;g.step(.1);assert.equal(w.gold,gold,'terminal reward not repeatable');g.start();assert.equal(g.finalKilled,false,'new run cannot inherit a clear');
}
{
 const {g,w}=setup();g.buy(100);g.start();quiet(g);g.time=899.99;g.finalKilled=true;g.dragons=5;g.step(.02);g.beginBonus();const before=w.gold;g.bonusTime=119.99;g.step(.02);assert.equal(g.phase,'dead');assert.equal(w.gold,before,'bonus timeout does not revoke normal reward');
}
{
 const {g,storage,w}=setup();g.buy(10);g.start();quiet(g);g.move(1,1);for(let i=0;i<400;i++)g.step(.1);assert.ok(g.player.x<=C.width-30&&g.player.y<=C.height-32);const t=g.time;g.step(NaN);assert.equal(g.time,t);g.mana=1;g.enemies=[enemy(1,g.player.x+30,g.player.y)];const hp=g.enemies[0].hp;g.step(.1);assert.equal(g.enemies[0].hp,hp);assert.equal(g.mana,1,'insufficient mana never goes negative');
 storage.setItem(CULT_KEY,JSON.stringify({version:1,mana:900000,pointsMilli:-1}));const bad=new Cultivation(w,storage);assert.equal(bad.mana,0);assert.equal(bad.pointsMilli,0);
}
assert.ok(enemyStats(14,0).hp>enemyStats(0,0).hp);assert.ok(enemyStats(14,0).damage>enemyStats(0,0).damage);assert.equal(manaCost(100,0),0);assert.ok(manaCost(150,3)>=manaCost(50,3));
console.log('Cultivation passed: exact billing/caps, pause, shop capacity, persistent mana/tails, death reset, jars, upgrades, final/bonus reward idempotence and bounded movement.');
{
 const {g,w,storage,data}=setup();g.buy(100);g.start();quiet(g);
 const observer=new Cultivation(w,storage);g.step(.01);assert.equal(g.sessionConflict,false,'read-only entry must not steal ownership');
 assert.ok(observer.start());quiet(observer);g.step(.01);assert.equal(g.sessionConflict,true);assert.equal(g.phase,'paused');
 observer.mana-=10;observer.persist();const saved=data.get(CULT_KEY);g.dispose();assert.equal(data.get(CULT_KEY),saved,'stale page must not overwrite new stock');
 observer.step(.01);assert.equal(observer.sessionConflict,false);
}
console.log('Cultivation multi-tab ownership passed.');
