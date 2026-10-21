import {FruitPinball} from './fruit-game.ts';
// A native, transparent hit area tracks the AI-painted handle on the canvas.
// Pointer capture + touch-action:none preserve drags outside the handle area.
export function bindFruitPlunger(getGame:()=>FruitPinball|null,blocked:()=>boolean,changed:()=>void){
 const canvas=document.getElementById('game') as HTMLCanvasElement,grip=document.getElementById('fruit-plunger-grip') as HTMLButtonElement;
 const range=document.getElementById('fruit-power') as HTMLInputElement,fire=document.getElementById('fruit-fire') as HTMLButtonElement;
 let pointer:number|null=null,startY=0;
 const game=()=>blocked()?null:getGame();
 function cancel(){const g=getGame();g?.cancelPull();if(pointer!==null&&grip.hasPointerCapture(pointer))grip.releasePointerCapture(pointer);pointer=null;}
 function startKeyboard(){const g=game();if(g?.beginKeyboardPull())changed();}
 function releaseKeyboard(){const g=game();if(g?.releaseKeyboardPull())changed();else if(blocked())cancel();}
 grip.addEventListener('pointerdown',e=>{const g=game();if(e.button!==0||!g?.canLaunch)return;e.preventDefault();cancel();pointer=e.pointerId;startY=e.clientY;grip.setPointerCapture(e.pointerId);changed();});
 grip.addEventListener('pointermove',e=>{const g=game();if(pointer!==e.pointerId||!g)return;e.preventDefault();const pixels=canvas.getBoundingClientRect().height/canvas.height;g.pullPower=Math.min(1,Math.max(0,(e.clientY-startY)/(110*pixels)));changed();});
 grip.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;e.preventDefault();const g=game(),power=g?.pullPower??0;pointer=null;if(grip.hasPointerCapture(e.pointerId))grip.releasePointerCapture(e.pointerId);g?.launch(power);changed();});
 grip.addEventListener('pointercancel',()=>{cancel();changed();});grip.addEventListener('lostpointercapture',()=>{if(pointer!==null){cancel();changed();}});
 for(const key of ['keydown','keyup'] as const)grip.addEventListener(key,e=>{if(e.code!=='Space'&&e.code!=='Enter')return;e.preventDefault();e.stopPropagation();if(key==='keydown'){if(!e.repeat)startKeyboard();}else releaseKeyboard();});
 grip.addEventListener('click',e=>{if(e.detail===0){const g=game();if(!g?.keyboardPull){g?.launch(g.pullPower);changed();}}});
 range.addEventListener('input',()=>{const g=game();if(g?.canLaunch){g.pullPower=Math.max(0,Math.min(1,Number(range.value)/100));changed();}});
 fire.addEventListener('click',()=>{const g=game();if(g?.launch(Number(range.value)/100))changed();});
 window.addEventListener('keydown',e=>{if(e.code==='Escape'){cancel();changed();}});
 window.addEventListener('blur',()=>{cancel();changed();});
 return{cancel,startKeyboard,releaseKeyboard};
}
