import assert from 'node:assert/strict';
import {bindFruitPlunger} from '../src/fruit-input.ts';
import {FruitPinball} from '../src/fruit-game.ts';
import {PlayerWallet} from '../src/wallet.ts';
class Target{events=new Map();captured=new Set();addEventListener(type,fn){this.events.set(type,fn);}hasPointerCapture(id){return this.captured.has(id);}setPointerCapture(id){this.captured.add(id);}releasePointerCapture(id){this.captured.delete(id);}send(type,args={}){let prevented=false;this.events.get(type)?.({pointerId:1,pointerType:'touch',button:0,clientY:400,preventDefault(){prevented=true;},stopPropagation(){},...args});return prevented;}}
const grip=new Target(),win=new Target(),canvas={height:1700,getBoundingClientRect:()=>({height:510})};
globalThis.document={getElementById:id=>id==='game'?canvas:grip};globalThis.window=win;
let g;const input=bindFruitPlunger(()=>g,()=>false,()=>{});
function fresh(){g=new FruitPinball(new PlayerWallet(),undefined,()=>.5);g.start();for(let i=0;i<15;i++)g.step();}
fresh();assert.equal(grip.send('pointerdown'),true);assert.ok(grip.hasPointerCapture(1));grip.send('pointermove',{clientY:414});assert.ok(Math.abs(g.pullPower-.5)<1e-10);grip.send('pointerup',{clientY:414});assert.equal(g.launched,1);assert.ok(Math.abs(g.lastPower-.5)<1e-10);assert.equal(grip.hasPointerCapture(1),false);
fresh();grip.send('pointerdown');grip.send('pointerdown',{pointerId:2,clientY:800});grip.send('pointerup',{pointerId:2,clientY:850});assert.equal(g.launched,0);grip.send('pointermove',{clientY:450});grip.send('pointercancel');assert.equal(g.launched,0);assert.equal(g.pullPower,0);
fresh();grip.send('pointerdown');win.send('blur');grip.send('pointerup',{clientY:450});assert.equal(g.launched,0);input.cancel();
console.log('Mobile touch plunger passed: narrow canvas scaling, pointer capture, release launch, second-finger rejection and cancel/blur.');
