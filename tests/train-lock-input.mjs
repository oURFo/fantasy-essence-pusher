import assert from 'node:assert/strict';
import {bindTrainLockInput} from '../src/train-lock-input.ts';
import {WonderTrain} from '../src/train-game.ts';
import {PlayerWallet} from '../src/wallet.ts';
import {trainSeed} from '../src/train-rules.ts';
globalThis.window=new EventTarget();
class Canvas extends EventTarget{style={setProperty(){}};captured=false;getBoundingClientRect(){return {left:0,top:0,width:1024,height:900};}setPointerCapture(){this.captured=true;}hasPointerCapture(){return this.captured;}releasePointerCapture(){this.captured=false;this.dispatchEvent(new Event('lostpointercapture'));}}
const setup=()=>{const g=new WonderTrain(new PlayerWallet(),undefined,trainSeed(9));g.targets=[];g.spawn(500,0);g.nextBird=Infinity;const c=new Canvas();bindTrainLockInput(c,()=>g,()=>{});return {g,c,t:g.targets[1]};};
const event=(c,type,x,y,pointerType='mouse')=>{const e=new Event(type,{cancelable:true});Object.assign(e,{clientX:x,clientY:y,pointerId:1,isPrimary:true,button:0,pointerType});c.dispatchEvent(e);return e;};
for(const pointerType of ['mouse','touch'])for(const follow of [false,true]){
 const {g,c,t}=setup();const y=t.bottom-t.h/2;event(c,'pointerdown',t.x,y,pointerType);for(let i=0;i<65;i++){g.step();if(follow)event(c,'pointermove',t.x,y,pointerType);}assert.equal(g.lockId,t.id,`${pointerType}: following=${follow}`);event(c,'pointerup',follow?t.x:500,y,pointerType);assert.equal(g.lockId,t.id);assert.equal(g.fired,0);assert.equal(g.gold,1000);assert.equal(g.lockHold,null);
 event(c,'pointerdown',10,150,pointerType);event(c,'pointerup',10,150,pointerType);assert.equal(g.lockId,null);assert.equal(g.fired,1);assert.equal(g.gold,999);
}
{
 const {g,c,t}=setup(),y=t.bottom-t.h/2;event(c,'pointerdown',t.x,y,'touch');const menu=event(c,'contextmenu',t.x,y,'touch');assert.equal(menu.defaultPrevented,true);event(c,'pointercancel',t.x,y,'touch');for(let i=0;i<65;i++)g.step();assert.equal(g.lockId,null);assert.equal(g.fired,0);
}
{
 const {g,c,t}=setup();event(c,'pointerdown',t.x,t.bottom-t.h/2);window.dispatchEvent(new Event('blur'));for(let i=0;i<65;i++)g.step();assert.equal(g.lockId,null);
}
console.log('Train pointer lock passed: mouse/touch stationary and following moving target beyond 12px, release without firing, tap to unlock/fire, native menu prevention and cancel/blur.');
