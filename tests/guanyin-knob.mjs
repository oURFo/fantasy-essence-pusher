import assert from 'node:assert/strict';
import {bindGuanyinKnob} from '../src/guanyin-knob.ts';
class Knob extends EventTarget{disabled=false;captured=false;getBoundingClientRect(){return {height:100};}setPointerCapture(){this.captured=true;}hasPointerCapture(){return this.captured;}releasePointerCapture(){this.captured=false;this.dispatchEvent(new Event('lostpointercapture'));}}
function send(b,type,props){const e=new Event(type,{cancelable:true});Object.assign(e,{button:0,pointerId:1,clientY:100,...props});b.dispatchEvent(e);return e;}
for(const pointerType of ['mouse','touch','pen']){
 const b=new Knob();let value=0;const cancel=bindGuanyinKnob(b,()=>value,v=>value=v);
 assert.ok(send(b,'pointerdown',{pointerType}).defaultPrevented);assert.ok(b.captured);
 send(b,'pointermove',{clientY:60,pointerType});assert.equal(value,6);
 send(b,'pointermove',{clientY:-100,pointerType});assert.equal(value,15);
 send(b,'pointermove',{pointerId:2,clientY:1000});assert.equal(value,15);
 send(b,'pointerup',{});assert.equal(b.captured,false);assert.equal(value,15);
 send(b,'pointerdown',{});send(b,'pointercancel',{});assert.equal(value,0);
 send(b,'keydown',{key:'End'});assert.equal(value,15);send(b,'keydown',{key:'Home'});assert.equal(value,0);
 send(b,'keydown',{key:'Enter'});assert.equal(value,8);send(b,'keydown',{key:' '});assert.equal(value,0);
 b.disabled=true;send(b,'pointerdown',{});assert.equal(b.captured,false);
 b.disabled=false;send(b,'pointerdown',{});cancel();assert.equal(b.captured,false);
}
console.log('Guanyin knob passed: captured mouse/touch/pen drag, limits, foreign pointer, cancellation, disabled input and keyboard.');
