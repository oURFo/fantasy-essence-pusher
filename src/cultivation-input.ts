import type {Cultivation} from './cultivation-game.ts';
/** Pointer capture, touch scrolling exclusion and keyboard movement share one bounded vector. */
export function bindCultivationMovement(pad:HTMLElement,get:()=>Cultivation|null,blocked:()=>boolean,unlock=()=>{},host:EventTarget=window,visibility:EventTarget=document){
 let pointer:number|null=null,centerX=0,centerY=0;const keys=new Set<string>();
 function cancel(){pointer=null;keys.clear();get()?.move(0,0);pad.style.setProperty('--jx','0px');pad.style.setProperty('--jy','0px');}
 pad.addEventListener('pointerdown',event=>{const e=event as PointerEvent;if(blocked()||pointer!==null||!get()?.active||e.button!==0||e.isPrimary===false)return;e.preventDefault();unlock();pointer=e.pointerId;centerX=e.clientX;centerY=e.clientY;pad.setPointerCapture(pointer);});
 pad.addEventListener('pointermove',event=>{const e=event as PointerEvent;if(e.pointerId!==pointer)return;if(blocked()||!get()?.active){cancel();return;}e.preventDefault();const dx=(e.clientX-centerX)/28,dy=(e.clientY-centerY)/28,len=Math.max(1,Math.hypot(dx,dy));get()?.move(dx/len,dy/len);pad.style.setProperty('--jx',`${dx/len*23}px`);pad.style.setProperty('--jy',`${dy/len*23}px`);});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(name,e=>{if((e as PointerEvent).pointerId===pointer)cancel();});
 function keyMove(){const x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),y=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0),len=Math.max(1,Math.hypot(x,y));get()?.move(x/len,y/len);}
 host.addEventListener('keydown',event=>{const e=event as KeyboardEvent,g=get();if(!g?.active||blocked()||e.ctrlKey||e.altKey||e.metaKey||['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();keys.add(k);keyMove();}});
 host.addEventListener('keyup',event=>{const e=event as KeyboardEvent;if(keys.delete(e.key.toLowerCase())){e.preventDefault();keyMove();}});
 host.addEventListener('blur',cancel);visibility.addEventListener('visibilitychange',cancel);return {cancel};
}
