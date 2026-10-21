import {NightMarket} from './ring-game.ts';
export function bindRingInput(getGame:()=>NightMarket|null,blocked:()=>boolean,changed:()=>void){
 const surface=document.getElementById('ring-throw-zone')!,canvas=document.getElementById('game') as HTMLCanvasElement;
 let pointer:number|null=null,startY=0,travel=80;
 const game=()=>blocked()?null:getGame();
 const position=(x:number)=>{const rect=canvas.getBoundingClientRect();return Math.max(-3.4,Math.min(3.4,((x-rect.left)/rect.width*1024-512)/(108/(1-.035*2.15))));};
 function cancel(){getGame()?.cancelPull();const id=pointer;pointer=null;if(id!==null&&surface.hasPointerCapture(id))surface.releasePointerCapture(id);}
 surface.addEventListener('pointerdown',e=>{const g=game();if(pointer!==null||!g?.canThrow||(e.pointerType!=='touch'&&e.button!==0))return;e.preventDefault();pointer=e.pointerId;startY=e.clientY;travel=Math.max(50,160*canvas.getBoundingClientRect().height/1536);g.dragging=true;g.aimX=position(e.clientX);surface.setPointerCapture(e.pointerId);changed();});
 surface.addEventListener('pointermove',e=>{const g=game();if(pointer!==e.pointerId||!g)return;e.preventDefault();g.aimX=position(e.clientX);g.pull=Math.max(0,Math.min(1,(e.clientY-startY)/travel));changed();});
 surface.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;e.preventDefault();const g=game(),power=Math.max(0,Math.min(1,(e.clientY-startY)/travel)),x=position(e.clientX);cancel();g?.throw(x,power);changed();});
 surface.addEventListener('pointercancel',()=>{cancel();changed();});surface.addEventListener('lostpointercapture',()=>{if(pointer!==null)cancel();});surface.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('blur',cancel);
 surface.addEventListener('keydown',e=>{const g=game();if(!g?.canThrow)return;if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','Enter','Escape'].includes(e.code))e.preventDefault();if(e.code==='ArrowLeft')g.aimX=Math.max(-3.4,g.aimX-.16);if(e.code==='ArrowRight')g.aimX=Math.min(3.4,g.aimX+.16);if(e.code==='ArrowDown')g.pull=Math.min(1,g.pull+(e.shiftKey ? .001 : .01));if(e.code==='ArrowUp')g.pull=Math.max(0,g.pull-(e.shiftKey ? .001 : .01));if((e.code==='Space'||e.code==='Enter')&&!e.repeat)g.throw(g.aimX,g.pull);if(e.code==='Escape')cancel();changed();});
 return{cancel};
}
