import assert from 'node:assert/strict';
import {FateOrbit} from '../src/fate-game.ts';
import {PlayerWallet} from '../src/wallet.ts';
import {initFateUI} from '../src/fate-ui.ts';
class Element{events=new Map();textContent='';disabled=false;hidden=false;addEventListener(name,fn){this.events.set(name,fn);}append(){}setAttribute(){}scrollIntoView(){}click(){this.events.get('click')?.();}}
const nodes=new Map();globalThis.document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);},createElement:()=>new Element()};
let g=new FateOrbit(new PlayerWallet()),blocked=false;const ui=initFateUI(()=>g,()=>blocked,()=>{}),fire=()=>nodes.get('fate-fire').click();ui.update(g);assert.equal(nodes.get('fate-fire').disabled,false);fire();ui.update(g);assert.equal(g.gold,997);assert.equal(nodes.get('fate-fire').disabled,true);assert.equal(nodes.get('fate-cannon-fire').disabled,true);fire();nodes.get('fate-cannon-fire').click();assert.equal(g.gold,997);
nodes.get('fate-right').click();assert.equal(g.angle,3,'aim buttons remain usable while balls are active');for(let i=0;i<59;i++)g.step();ui.update(g);assert.equal(nodes.get('fate-fire').disabled,true);g.step();ui.update(g);assert.equal(nodes.get('fate-fire').disabled,false);fire();assert.equal(g.gold,994);assert.equal(g.shots,2);
blocked=true;for(let i=0;i<60;i++)g.step();fire();assert.equal(g.shots,2);ui.update(g);assert.equal(nodes.get('fate-aim-zone').disabled,true);blocked=false;
g.notices.push({id:1,award:9999,time:g.time});ui.update(g);assert.match(nodes.get('fate-message').textContent,/9,999/);g=new FateOrbit(new PlayerWallet());ui.update(g);assert.equal(nodes.get('fate-fire').disabled,false);assert.match(nodes.get('fate-message').textContent,/調整/);
console.log('UI passed: explicit fire button, one-second cooldown, no double charge, aim during active balls, modal block and jackpot notification.');

nodes.get('fate-auto').click();ui.update(g);assert.equal(g.autoFire,true);assert.match(nodes.get('fate-auto').textContent,/開/);assert.equal(g.shots,1);blocked=true;nodes.get('fate-auto').click();assert.equal(g.autoFire,true);ui.update(g);assert.equal(nodes.get('fate-auto').disabled,true);blocked=false;nodes.get('fate-auto').click();ui.update(g);assert.equal(g.autoFire,false);assert.match(nodes.get('fate-auto').textContent,/關/);
console.log('UI passed: auto-fire toggle and blocked modal.');
