import {WALK_STRIDE,type AvatarDirection} from './avatar-motion.ts';
/** One complete 136px master silhouette. Clothes never redefine its head or limb proportions. */
export const AVATAR_RIG={
 id:'shared-v3',height:136,frameWidth:128,headBottom:-80,
 face:{front:{x:-19,y:-111,w:38,h:24},side:{x:16,y:-111,w:16,h:23}},
 hair:{
  short:[{x:-33,y:-140,w:66,h:54},{x:-31,y:-140,w:60,h:60},{x:-33,y:-140,w:66,h:57}],
  bob:[{x:-33,y:-140,w:66,h:61},{x:-32,y:-139,w:61,h:61},{x:-33,y:-139,w:66,h:59}],
  ponytail:[{x:-41,y:-146,w:76,h:68},{x:-42,y:-145,w:72,h:67},{x:-33,y:-142,w:66,h:69}],
 },
 mounts:{
  cap:[{x:-32,y:-140,w:64,h:34},{x:-31,y:-140,w:74,h:34},{x:-32,y:-140,w:64,h:34}],
  crown:[{x:-21,y:-150,w:42,h:25},{x:-14,y:-149,w:29,h:25},{x:-21,y:-150,w:42,h:25}],
  cat:[{x:-34,y:-150,w:68,h:51},{x:-12,y:-150,w:17,h:51},{x:-34,y:-150,w:68,h:51}],
  star:[{x:-29,y:-120,w:22,h:13},{x:-19,y:-121,w:18,h:15},{x:12,y:-120,w:22,h:13}],
 },
} as const;
export function rigMotion(direction:AvatarDirection,walking:boolean,distance:number,reduced=false){
 const phase=walking&&!reduced?Math.max(0,distance)/WALK_STRIDE*Math.PI*2:0,active=walking&&!reduced;
 return {view:direction==='up'?2:direction==='left'||direction==='right'?1:0,flip:direction==='left',phase,active,frame:Math.floor(phase/(Math.PI*2)*4)%4,bob:active?Math.abs(Math.sin(phase))*.5:0};
}
/** Narrowest connected row between skull and shoulders: one neck anchor for a complete pose. */
export function neckAnchor(rgba:Uint8ClampedArray,width:number,height:number){
 let best={width:Infinity,x:width/2,y:Math.round(height*.44)};
 for(let y=Math.floor(height*.34);y<height*.58;y++){
  let left=width,right=-1;for(let x=0;x<width;x++)if(rgba[(y*width+x)*4+3]>=96){left=Math.min(left,x);right=Math.max(right,x);}
  const span=right-left+1;if(span>width*.08&&span<best.width)best={width:span,x:(left+right)/2,y};
 }
 if(!Number.isFinite(best.width))throw new Error('Character has no neck anchor');return best;
}
export function rigMount(accessory:keyof typeof AVATAR_RIG.mounts,direction:AvatarDirection){return AVATAR_RIG.mounts[accessory][direction==='up'?2:direction==='left'||direction==='right'?1:0];}

export function figurePlacement(width:number,height:number){
 if(width<=0||height<=0)throw new Error('Empty character silhouette');
 const scale=AVATAR_RIG.height/height;return {x:(AVATAR_RIG.frameWidth-width*scale)/2,y:0,width:width*scale,height:AVATAR_RIG.height,scale};
}
