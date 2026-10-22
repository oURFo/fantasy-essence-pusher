import {FateOrbit} from './fate-game.ts';
import {FATE_BOARD} from './fate-rules.ts';
export function bindFateInput(getGame:()=>FateOrbit|null,blocked:()=>boolean,changed:()=>void,unlock:()=>void){
 const zone=document.getElementById('fate-aim-zone')!,canvas=document.getElementById('game') as HTMLCanvasElement;let pointer:number|null=null;
 const game=()=>blocked()?null:getGame();
 function aim(clientX:number){const rect=canvas.getBoundingClientRect();return Math.max(-FATE_BOARD.maxAngle,Math.min(FATE_BOARD.maxAngle,((clientX-rect.left)/rect.width-.5)*140));}
 function cancel(){getGame()?.cancelAim();const id=pointer;pointer=null;if(id!==null&&zone.hasPointerCapture(id))zone.releasePointerCapture(id);}
 zone.addEventListener('pointerdown',e=>{const g=game();if(pointer!==null||!g?.canShoot||(e.pointerType!=='touch'&&e.button!==0))return;e.preventDefault();unlock();pointer=e.pointerId;zone.setPointerCapture(e.pointerId);g.dragging=true;g.angle=aim(e.clientX);changed();});
 zone.addEventListener('pointermove',e=>{const g=game();if(pointer!==e.pointerId||!g)return;e.preventDefault();g.angle=aim(e.clientX);changed();});
 zone.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;e.preventDefault();const g=game();cancel();if(g){g.angle=aim(e.clientX);g.shoot();}changed();});
 zone.addEventListener('pointercancel',()=>{cancel();changed();});zone.addEventListener('lostpointercapture',()=>{if(pointer!==null)cancel();});zone.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('blur',cancel);
 zone.addEventListener('keydown',e=>{const g=game();if(!g)return;if(['ArrowLeft','ArrowRight','Enter','Space','Escape'].includes(e.code)){e.preventDefault();e.stopPropagation();}if(!g.inputLocked){if(e.code==='ArrowLeft')g.angle=Math.max(-55,g.angle-2);if(e.code==='ArrowRight')g.angle=Math.min(55,g.angle+2);if((e.code==='Enter'||e.code==='Space')&&!e.repeat){unlock();g.shoot();}}if(e.code==='Escape')cancel();changed();});
 return{cancel};
}
