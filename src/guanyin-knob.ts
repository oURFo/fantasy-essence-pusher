/** A captured vertical drag works with mouse, pen and touch without page scrolling. */
export function bindGuanyinKnob(button:HTMLButtonElement,read:()=>number,write:(value:number)=>void){
 let pointer:number|null=null,startY=0,startValue=0;
 const cancel=()=>{if(pointer!==null&&button.hasPointerCapture(pointer))button.releasePointerCapture(pointer);pointer=null;};
 button.addEventListener('pointerdown',e=>{if(button.disabled||e.button!==0||pointer!==null)return;e.preventDefault();pointer=e.pointerId;startY=e.clientY;startValue=read();button.setPointerCapture(pointer);});
 button.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;e.preventDefault();const height=button.getBoundingClientRect().height||100;write(Math.max(0,Math.min(15,startValue+Math.round((startY-e.clientY)/height*15))));});
 button.addEventListener('pointerup',e=>{if(e.pointerId===pointer)cancel();});
 button.addEventListener('pointercancel',e=>{if(e.pointerId===pointer){cancel();write(0);}});
 button.addEventListener('lostpointercapture',()=>{pointer=null;});
 button.addEventListener('keydown',e=>{const delta=e.key==='ArrowUp'||e.key==='ArrowRight'?1:e.key==='ArrowDown'||e.key==='ArrowLeft'?-1:0;if(delta||e.key==='Home'||e.key==='End'||e.key===' '||e.key==='Enter'){e.preventDefault();write(e.key==='Home'?0:e.key==='End'?15:e.key===' '||e.key==='Enter'?(read()?0:8):Math.max(0,Math.min(15,read()+delta)));}});
 return cancel;
}
