import assert from 'node:assert/strict';
import {Cultivation} from '../src/cultivation-game.ts';import {PlayerWallet} from '../src/wallet.ts';
import {seeded,emptySkills,SKILLS,xpRequired,skillStats,castCost} from '../src/cultivation-rules.ts';import {cultAuraLayout} from '../src/cultivation-rendering.ts';
function setup(){const w=new PlayerWallet(),g=new Cultivation(w,undefined,seeded(42));g.buy(200);g.start();g.choose(g.choices[0]);g.skills={...emptySkills(),sword:1};g.spawnAt=Infinity;g.jarAt=Infinity;g.bossIndex=3;return g;}
function dead(g,id,x,y=g.player.y,boss=null){return {id,x,y,hp:0,maxHp:30,kind:0,speed:0,damage:0,radius:15,attackAt:Infinity,waveAt:Infinity,boss,hitAt:-10};}
{
 const g=setup();g.enemies=[dead(g,1,g.player.x+300)];g.step(.01);assert.equal(g.kills,1);assert.equal(g.xp,0,'distant kill awards no automatic experience');assert.equal(g.xpDropped,1);assert.equal(g.xpOrbs.length,1);assert.ok(g.roundPointsMilli>0,'currency points remain immediate');
 const orb=g.xpOrbs[0],origin=orb.x;g.player.x=origin-100;g.step(.05);assert.ok(orb.attracting);assert.ok(orb.x<origin);assert.equal(g.xp,0,'experience credited on arrival, not magnet trigger');g.pause();const stopped=JSON.stringify(g.xpOrbs);g.step(.1);assert.equal(JSON.stringify(g.xpOrbs),stopped);g.pause();for(let i=0;i<20;i++)g.step(.05);assert.equal(g.xp,1);assert.equal(g.xpCollected,1);assert.equal(g.xpOrbs.length,0);g.step(.1);assert.equal(g.xp,1,'pickup is not repeated');
}
{
 const g=setup();g.xp=xpRequired(1)-1;g.enemies=Array.from({length:12},(_,i)=>dead(g,i,1024+i%2,512));g.step(.01);assert.equal(g.level,1);assert.equal(g.xpOrbs.length,1,'nearby drops merge');assert.equal(g.xpOrbs[0].value,12);assert.equal(g.xpDropped,12);
 const p={x:g.xpOrbs[0].x,y:g.xpOrbs[0].y};g.player.x=5000;g.step(.1);assert.equal(g.xpOrbs[0].x,p.x,'ground loot never teleports with distant pursuers');g.player.x=p.x;g.player.y=p.y;g.step(.01);assert.equal(g.level,2);assert.equal(g.phase,'upgrade');assert.equal(g.xpCollected,12);assert.equal(g.xp,11);assert.equal(g.xpOrbs.length,0);
}
{
 const g=setup();g.enemies=[dead(g,1,g.player.x+300,g.player.y,'mini')];g.step(.01);assert.equal(g.xpOrbs[0].value,18);const orb=g.xpOrbs[0];g.player.x=orb.x-110.1;g.step(.01);assert.equal(orb.attracting,false);g.player.x=orb.x-109.9;g.step(.01);assert.equal(orb.attracting,true);g.player.hp=0;g.step(.01);assert.equal(g.phase,'dead');g.start();assert.equal(g.xpOrbs.length,0);assert.equal(g.xpDropped,0);assert.equal(g.xpCollected,0);
 g.choose(g.choices[0]);g.dropXp(0,0,3);g.dispose();assert.equal(g.xpOrbs.length,0);
}
{
 const skills=emptySkills();assert.equal(cultAuraLayout(skills,10).length,0);for(const skill of SKILLS){const one={...emptySkills(),[skill]:1},five={...emptySkills(),[skill]:5},low=cultAuraLayout(one,1),high=cultAuraLayout(five,1);assert.equal(low.length,1);assert.equal(high.length,3);assert.ok(high[0].size>low[0].size&&high[0].alpha>low[0].alpha);assert.ok(Math.hypot(high[0].x,high[0].y+43)>Math.hypot(low[0].x,low[0].y+43));assert.deepEqual(cultAuraLayout(one,1,true),cultAuraLayout(one,100,true));}
 const build={...emptySkills(),sword:5,ice:5,dragon:5};assert.equal(cultAuraLayout(build,3).length,9);assert.equal(build.sword,5);
}
console.log('Cultivation XP passed: ground drops, delayed magnet pickup, exact merged values, pause, level threshold, boss XP, reset and 11 rank-scaled cosmetic auras.');
{
 const g=setup();g.skills={...emptySkills(),sword:5};g.enemies=Array.from({length:2},(_,i)=>({...dead(g,i,g.player.x+40+i*8),hp:10000,maxHp:10000}));const before=g.mana;g.cast('sword');const spec=skillStats('sword',5,g.level,g.minute,0);assert.equal(g.hits,2);assert.equal(g.potentialHits,spec.cap);assert.equal(before-g.mana,castCost(spec),'under-filled cast pays full capacity price');
 g.phase='dead';g.mana=0;assert.equal(g.openShop(),false);assert.equal(g.buy(10),0);assert.equal(g.start(),true,'death can always restart even with empty mana');assert.equal(g.phase,'shop');assert.equal(g.level,1);assert.equal(g.xpOrbs.length,0);g.buy(10);g.closeShop();assert.equal(g.phase,'ready');
}
