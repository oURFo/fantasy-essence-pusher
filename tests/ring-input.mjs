import assert from 'node:assert/strict';
import {bindRingInput} from '../src/ring-input.ts';
import {NightMarket} from '../src/ring-game.ts';
import {PlayerWallet} from '../src/wallet.ts';
class Target{events=new Map();capture=new Set();addEventListener(t,f){this.events.set(t,f);}hasPointerCapture(id){return this.capture.has(id);}setPointerCapture(id){this.capture.add(id);}releasePointerCapture(id){this.capture.delete(id);}send(t,data={}){let prevented=false;this.events.get(t)?.({pointerId:1,pointerType:'touch',button:0,clientX:270,clientY:400,preventDefault(){prevented=true;},...data});return prevented;}}
const surface=new Target(),win=new Target(),canvas={getBoundingClientRect:()=>({left:100,width:340,height:510})};globalThis.document={getElementById:id=>id==='game'?canvas:surface};globalThis.window=win;
const g=new NightMarket(new PlayerWallet(),()=>.5);g.buy(0);let blocked=false;const input=bindRingInput(()=>g,()=>blocked,()=>{});
assert.equal(surface.send('pointerdown'),true);assert.equal(g.dragging,true);surface.send('pointermove',{clientX:280,clientY:425});assert.ok(g.aimX>0);assert.ok(g.pull>.4&&g.pull<.6);surface.send('pointerdown',{pointerId:2,clientY:800});surface.send('pointerup',{pointerId:2});assert.equal(g.thrown,0);surface.send('pointerup',{clientX:280,clientY:425});assert.equal(g.thrown,1);assert.equal(g.rings,19);assert.equal(g.dragging,false);assert.equal(surface.capture.size,0);
for(let i=0;i<500;i++)g.step();surface.send('pointerdown');surface.send('pointermove',{clientY:440});surface.send('pointercancel');assert.equal(g.thrown,1);assert.equal(g.pull,0);
surface.send('pointerdown');blocked=true;surface.send('pointerup',{clientY:440});assert.equal(g.thrown,1);blocked=false;input.cancel();surface.send('pointerdown');win.send('blur');surface.send('pointerup',{clientY:440});assert.equal(g.thrown,1);
console.log('Ring touch input passed: mobile scaling, lateral aim, pull/release, multi-touch, cancel, blocked modal and blur.');
