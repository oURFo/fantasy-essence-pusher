import assert from 'node:assert/strict';
import {bindCultivationMovement} from '../src/cultivation-input.ts';
class Pad extends EventTarget{style={setProperty(){}};captures=[];setPointerCapture(id){this.captures.push(id);}}
const pad=new Pad(),host=new EventTarget(),doc=new EventTarget(),calls=[];let blocked=false;const g={active:true,move:(x,y)=>calls.push([x,y])};const input=bindCultivationMovement(pad,()=>g,()=>blocked,()=>{},host,doc);
const emit=(target,type,props={})=>{const e=new Event(type,{cancelable:true});for(const[k,v]of Object.entries(props))Object.defineProperty(e,k,{value:v});target.dispatchEvent(e);return e;};
emit(pad,'pointerdown',{pointerId:1,button:0,isPrimary:true,clientX:20,clientY:30,pointerType:'touch'});assert.deepEqual(pad.captures,[1]);
emit(pad,'pointermove',{pointerId:1,clientX:100,clientY:100});assert.ok(Math.hypot(...calls.at(-1))<=1.000001);assert.ok(calls.at(-1)[0]>0&&calls.at(-1)[1]>0);
emit(pad,'pointerdown',{pointerId:2,button:0,isPrimary:false,clientX:0,clientY:0});assert.deepEqual(pad.captures,[1],'second touch cannot replace active capture');
emit(pad,'pointercancel',{pointerId:1});assert.deepEqual(calls.at(-1),[0,0]);
emit(host,'keydown',{key:'ArrowLeft'});assert.deepEqual(calls.at(-1),[-1,0]);emit(host,'keyup',{key:'ArrowLeft'});assert.deepEqual(calls.at(-1),[0,0]);
emit(host,'keydown',{key:'W'});emit(host,'keydown',{key:'d'});assert.ok(Math.abs(calls.at(-1)[0]-1/Math.sqrt(2))<1e-9&&Math.abs(calls.at(-1)[1]+1/Math.sqrt(2))<1e-9);emit(host,'blur');assert.deepEqual(calls.at(-1),[0,0]);
blocked=true;const n=calls.length;emit(pad,'pointerdown',{pointerId:3,button:0,isPrimary:true,clientX:0,clientY:0});emit(host,'keydown',{key:'d'});assert.equal(calls.length,n);blocked=false;
emit(pad,'pointerdown',{pointerId:4,button:0,isPrimary:true,clientX:0,clientY:0});emit(pad,'pointermove',{pointerId:4,clientX:14,clientY:0});assert.deepEqual(calls.at(-1),[.5,0]);emit(doc,'visibilitychange');assert.deepEqual(calls.at(-1),[0,0]);input.cancel();
console.log('Cultivation input passed: real touch pointer capture, bounded vectors, release/cancel, secondary touch rejection, keyboard, blur and hidden-tab cancellation.');
