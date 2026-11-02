import assert from 'node:assert/strict';
import {Cultivation} from '../src/cultivation-game.ts';import {PlayerWallet} from '../src/wallet.ts';
import {SKILLS,emptySkills,skillStats,manaCost,seeded,enemyStats,enemyKind,stageAt,CULTIVATION as C} from '../src/cultivation-rules.ts';
function game(seed=42){const w=new PlayerWallet();w.setBalance(100000);const g=new Cultivation(w,undefined,seeded(seed));g.buy(200);g.start();g.choose(g.choices[0]);g.spawnAt=Infinity;g.jarAt=Infinity;g.bossIndex=3;return g;}
function enemy(id,x,y){return{id,x,y,hp:100000,maxHp:100000,kind:0,speed:0,damage:1,radius:15,attackAt:Infinity,waveAt:Infinity,boss:null,hitAt:-10};}
assert.ok(SKILLS.length>=10);
for(const skill of SKILLS){const g=game();g.skills=emptySkills();g.skills[skill]=5;g.player.direction='right';g.enemies=Array.from({length:20},(_,i)=>enemy(i,g.player.x+50+i*4,g.player.y+((i%3)-1)*8));const spec=skillStats(skill,5,1,0,0),before=g.mana;g.cast(skill);assert.ok(g.hits>0&&g.hits<=spec.cap,skill);assert.equal(before-g.mana,manaCost(spec.damage,g.hits));assert.equal(new Set(g.effects.filter(e=>e.kind===skill).map(e=>`${e.toX},${e.toY}`)).size,g.hits);if(skill==='ice')assert.ok(g.enemies.some(e=>e.slowUntil>g.clock));if(skill==='needle')assert.ok(g.enemies.some(e=>e.poison>0));}
{
 const g=game();g.skills=emptySkills();g.skills.sword=1;g.skills.ice=1;g.skills.bell=1;for(let i=0;i<20;i++){g.level=10;g.makeChoices();assert.ok(g.choices.every(u=>!SKILLS.includes(u)||g.skills[u]>0));}g.phase='upgrade';g.choices=['dragon'];assert.equal(g.choose('dragon'),false,'fourth skill rejected by engine');
 assert.equal(skillStats('sword',5,30,0,5).damage,skillStats('sword',5,30,14,5).damage,'no free time-based damage');assert.ok(enemyStats(14,0).hp/enemyStats(8,0).hp>3);
}
{
 const g=game();g.player.x=-100000;g.player.y=100000;g.move(-1,1);g.step(.1);assert.ok(g.player.x< -100000&&g.player.y>100000);g.spawnJar();assert.ok(Math.hypot(g.jar.x-g.player.x,g.jar.y-g.player.y)<500);g.enemies=[enemy(1,g.player.x-4000,g.player.y)];g.step(.1);assert.ok(Math.hypot(g.enemies[0].x-g.player.x,g.enemies[0].y-g.player.y)<900,'distant pursuing monster reconnects without resetting HP');
}
{
 const g=game();g.bossIndex=0;g.time=264.99;g.step(.02);assert.match(g.bossNotice,/五秒/);g.time=269.99;g.step(.02);assert.ok(g.effects.some(e=>e.kind==='boss-arrive'));const boss=g.enemies.find(e=>e.boss);boss.hp=0;const points=Math.round(boss.maxHp*C.bountyRate*1000)/1000;g.step(.01);assert.equal(g.bossAward.points,points);assert.ok(g.effects.some(e=>e.kind==='boss-kill'));assert.match(g.message,/積分/);
}
{
 const g=game(),gold=g.gold;g.mana=0;const t=g.time,hp=g.player.hp;g.step(.1);assert.equal(g.phase,'shop');g.step(.1);assert.equal(g.time,t);assert.equal(g.player.hp,hp);assert.equal(g.gold,gold,'automatic modal never purchases');g.buy(10);g.closeShop();assert.equal(g.phase,'playing');
}
assert.ok(new Set(Array.from({length:100},(_,i)=>enemyKind(14,i/100))).size>=7);assert.notEqual(stageAt(0).name,stageAt(800).name);
console.log('Cultivation v2 passed: 11 distinct skills/costs/statuses, three slots, infinite movement, reconnecting pursuers, staged enemies, boss warning/kill ledger and automatic non-spending mana pause.');
{
 const g=game(77);g.time=600;g.level=30;g.skills={...emptySkills(),sword:5,fire:5,ice:5};g.upgrades={power:5,vitality:4,guard:3,regen:3,boots:4};g.player.hp=g.player.maxHp=394;g.spawnAt=0;
 for(let i=0;i<18000&&g.phase!=='dead';i++){if(g.phase==='shop'){g.buy(200);g.closeShop();}g.step(1/60);}
 assert.equal(g.phase,'dead','fully upgraded late-game build cannot AFK indefinitely');assert.ok(g.peakEnemies>30,'crowd pressure must accumulate');console.log(`Late AFK stress: died at ${g.time.toFixed(1)}s; peak ${g.peakEnemies} enemies.`);
}
{
 const seen=new Set();for(let seed=1;seed<=60;seed++){const w=new PlayerWallet(),g=new Cultivation(w,undefined,seeded(seed));g.buy(10);g.start();assert.equal(new Set(g.choices).size,3);g.choices.forEach(u=>seen.add(u));}assert.equal(seen.size,11,'all eleven starter spells can be offered');
}
