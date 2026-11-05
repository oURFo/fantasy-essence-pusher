import type {WonderTrain} from './train-game.ts';
// Capture target identity once: following a moving target must not cancel a hold.
export function bindTrainLockInput(canvas:HTMLCanvasElement,can:()=>WonderTrain|null,refresh:()=>void){
 let press:{pointer:number;x:number;y:number;game:WonderTrain;at:number;moved:boolean;target:boolean}|null=null;
 const coords=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*1024,y:(e.clientY-r.top)/r.height*900};};
 const cancel=()=>{press?.game.cancelLockHold();press=null;};
 canvas.addEventListener('pointerdown',e=>{const g=can();if(!e.isPrimary||e.button!==0||!g||press)return;e.preventDefault();const p=coords(e);press={pointer:e.pointerId,x:e.clientX,y:e.clientY,game:g,at:g.time,moved:false,target:g.beginLock(p.x,p.y)};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{const g=can();if(!g)return;if(press&&e.pointerId===press.pointer){if(!press.target&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>12)press.moved=true;}else if(e.pointerType==='mouse'&&g.lockId===null){const p=coords(e);g.aim(p.x,p.y);}});
 canvas.addEventListener('pointerup',e=>{if(!press||e.pointerId!==press.pointer)return;const current=press,g=can(),completed=current.game.lockHold?.complete;cancel();if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(g===current.game&&!current.moved&&!completed&&g!.time-current.at<.5){const p=coords(e);g!.clearLock();g!.aim(p.x,p.y);g!.shoot();}refresh();});
 canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);
 const onContextMenu=(e:Event)=>{if(press)e.preventDefault();};canvas.addEventListener('contextmenu',onContextMenu);
 // Mobile long-press menus/selection must not steal pointer capture.
 canvas.style.userSelect='none';canvas.style.setProperty('-webkit-touch-callout','none');
 window.addEventListener('blur',cancel);
 return {cancel};
}
