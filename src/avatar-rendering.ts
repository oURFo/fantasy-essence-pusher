import {avatarPose,type AvatarDirection} from './avatar-motion.ts';
import type {AvatarBody} from './lobby-world.ts';
import {WARDROBE_ITEMS,lookKey,type WardrobeLook} from './wardrobe.ts';

export interface SpriteSilhouette {left:number;top:number;right:number;bottom:number;anchorX:number;pixels:Uint8Array;area:number;}
/** Keep the character's connected silhouette, excluding detached atlas debris. */
export function spriteSilhouette(rgba:Uint8ClampedArray,width:number,height:number):SpriteSilhouette{
 const seen=new Uint8Array(width*height),queue=new Int32Array(width*height);
 let largest:number[]=[];
 for(let start=0;start<seen.length;start++){
  if(seen[start]||rgba[start*4+3]<96)continue;
  let read=0,write=1;queue[0]=start;seen[start]=1;
  while(read<write){const p=queue[read++],x=p%width,y=Math.floor(p/width);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,n=ny*width+nx;if(nx<0||nx>=width||ny<0||ny>=height||seen[n]||rgba[n*4+3]<96)continue;seen[n]=1;queue[write++]=n;}
  }
  if(write>largest.length)largest=Array.from(queue.subarray(0,write));
 }
 if(largest.length<width*height*.025)throw new Error('Avatar frame is empty');
 let left=width,top=height,right=0,bottom=0;
 const pixels=new Uint8Array(width*height);
 for(const p of largest){const x=p%width,y=Math.floor(p/width);left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);
  // Preserve the original anti-aliased edge around the connected opaque body.
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<width&&ny>=0&&ny<height)pixels[ny*width+nx]=1;}
 }
 let headSum=0,headCount=0;const headBottom=top+(bottom-top)*.32;
 for(const p of largest){if(Math.floor(p/width)<headBottom){headSum+=p%width;headCount++;}}
 return {left:Math.max(0,left-2),top:Math.max(0,top-2),right:Math.min(width,right+2),bottom:Math.min(height,bottom+2),anchorX:headSum/headCount,pixels,area:largest.length};
}

interface AvatarFrame {canvas:HTMLCanvasElement;anchorX:number;footY:number;scale:number;regions:Uint8Array;}
export interface PreparedAvatar {frames:AvatarFrame[];}
// Locate whole silhouettes before assigning poses. AI artwork does not guarantee
// evenly spaced rows, so a fixed grid can clip shoes or import the next pose.
export function atlasComponents(rgba:Uint8ClampedArray,width:number,height:number,rowCounts:readonly number[]){
 const seen=new Uint8Array(width*height),queue=new Int32Array(width*height),parts:{left:number;top:number;right:number;bottom:number;indices:Int32Array}[]=[];
 for(let start=0;start<seen.length;start++){
  if(seen[start]||rgba[start*4+3]<96)continue;
  let read=0,write=1,left=width,top=height,right=0,bottom=0;queue[0]=start;seen[start]=1;
  while(read<write){const p=queue[read++],x=p%width,y=Math.floor(p/width);left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,n=ny*width+nx;if(nx<0||nx>=width||ny<0||ny>=height||seen[n]||rgba[n*4+3]<96)continue;seen[n]=1;queue[write++]=n;}
  }
  if(write>width*height*.002)parts.push({left,top,right,bottom,indices:queue.slice(0,write)});
 }
 const expected=rowCounts.reduce((n,v)=>n+v,0);if(parts.length!==expected)throw new Error(`Expected ${expected} complete sprites, received ${parts.length}`);
 const vertical=parts.sort((a,b)=>a.top-b.top),ordered:typeof parts=[];
 let start=0;for(const count of rowCounts){ordered.push(...vertical.slice(start,start+count).sort((a,b)=>a.left-b.left));start+=count;}
 return ordered;
}
export function avatarComponents(rgba:Uint8ClampedArray,width:number,height:number){return atlasComponents(rgba,width,height,[6,6,6,3]);}
export function prepareAvatar(image:HTMLImageElement,body:AvatarBody):PreparedAvatar{
 const source=document.createElement('canvas');source.width=image.width;source.height=image.height;
 const sourceCtx=source.getContext('2d',{willReadFrequently:true})!;sourceCtx.drawImage(image,0,0);
 const all=sourceCtx.getImageData(0,0,image.width,image.height),parts=avatarComponents(all.data,image.width,image.height);
 const frames=parts.map((part,index)=>{
  const x=Math.max(0,part.left-2),y=Math.max(0,part.top-2),w=Math.min(image.width,part.right+2)-x,h=Math.min(image.height,part.bottom+2)-y;
  const data=sourceCtx.getImageData(x,y,w,h),shape=spriteSilhouette(data.data,w,h);
  for(let p=0;p<shape.pixels.length;p++)if(!shape.pixels[p])data.data[p*4+3]=0;
  const regions=new Uint8Array(w*h);
  for(let p=0;p<regions.length;p++){if(data.data[p*4+3]<20)continue;const [hue,sat,light]=rgbHsl(data.data[p*4],data.data[p*4+1],data.data[p*4+2]),ny=(Math.floor(p/w)-shape.top)/(shape.bottom-shape.top),nx=(p%w-shape.anchorX)/(shape.bottom-shape.top),view=index<18?Math.floor(index/6):index-18;
   regions[p]=garmentRegion(body,view,hue,sat,light,ny,nx);
  }
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d')!.putImageData(data,0,0);
  return {canvas,anchorX:shape.anchorX,footY:shape.bottom-2,scale:136/(shape.bottom-shape.top-4),regions};
 });
 return {frames};
}
export function garmentRegion(body:AvatarBody,view:number,hue:number,sat:number,light:number,ny:number,nx:number){
 if(ny<.35&&light<.58&&hue<55&&sat>.1&&(ny<.22||view===2||Math.abs(nx)>.12))return 1;
 if(ny>.4&&ny<.74&&sat>.3&&(body==='male'?hue>145&&hue<205:hue<12||hue>345))return 2;
 if(body==='male'?ny>.62&&hue>195&&hue<265&&sat>.12&&light<.6:ny>.6&&ny<.79&&hue>25&&hue<65&&sat<.45&&light>.6)return 3;
 if(ny>.82&&sat<.22&&light>.4)return 4;
 return 0;
}
function rgbHsl(r:number,g:number,b:number){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,l=(max+min)/2;let h=0;if(delta){if(max===r)h=((g-b)/delta+6)%6;else if(max===g)h=(b-r)/delta+2;else h=(r-g)/delta+4;}return [h*60,delta===0?0:delta/(1-Math.abs(2*l-1)),l];}
function hslRgb(h:number,s:number,l:number){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h/60%2-1)),m=l-c/2,rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return rgb.map(v=>Math.round((v+m)*255));}
const outfitCache=new Map<string,PreparedAvatar>();
/** Palette layers preserve the AI garment texture and every pose's silhouette. */
export function dressAvatar(base:PreparedAvatar,body:AvatarBody,look:WardrobeLook):PreparedAvatar{
 const key=lookKey(body,{...look,head:'none'}),hit=outfitCache.get(key);if(hit){outfitCache.delete(key);outfitCache.set(key,hit);return hit;}
 const slots=['hair','top','bottom','shoes'] as const,defaults=['brown','classic','classic','ivory'];
 const targets=slots.map((slot,i)=>{if(look[slot]===defaults[i])return null;const color=WARDROBE_ITEMS[slot].find(item=>item.id===look[slot])!.color;return rgbHsl(parseInt(color.slice(1,3),16),parseInt(color.slice(3,5),16),parseInt(color.slice(5,7),16));});
 if(targets.every(v=>!v))return base;
 const originalLight=[.29,body==='male'?.43:.59,body==='male'?.27:.85,.88];
 const frames=base.frames.map(frame=>{const canvas=document.createElement('canvas');canvas.width=frame.canvas.width;canvas.height=frame.canvas.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(frame.canvas,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height);
  for(let p=0;p<frame.regions.length;p++){const region=frame.regions[p]-1,target=targets[region];if(!target)continue;const [,sat,light]=rgbHsl(data.data[p*4],data.data[p*4+1],data.data[p*4+2]),l=Math.max(.05,Math.min(.96,light*target[2]/originalLight[region])),rgb=hslRgb(target[0],target[1]*(.8+.2*sat),l);data.data[p*4]=rgb[0];data.data[p*4+1]=rgb[1];data.data[p*4+2]=rgb[2];}
  ctx.putImageData(data,0,0);return {...frame,canvas};});
 const result={frames};outfitCache.set(key,result);while(outfitCache.size>6)outfitCache.delete(outfitCache.keys().next().value!);return result;
}
export function drawAvatar(ctx:CanvasRenderingContext2D,avatar:PreparedAvatar,direction:AvatarDirection,walking:boolean,distance:number,x:number,y:number,reducedMotion=false){
 const pose=avatarPose(direction,walking,distance,reducedMotion),frame=avatar.frames[pose.row*6+pose.column];
 ctx.save();ctx.translate(x,y);ctx.scale((pose.flip?-1:1)*frame.scale,frame.scale);
 ctx.drawImage(frame.canvas,-frame.anchorX,-frame.footY);ctx.restore();
}
export interface HeadwearArtwork {frames:HTMLCanvasElement[];}
export function prepareHeadwear(image:HTMLImageElement):HeadwearArtwork{
 const source=document.createElement('canvas');source.width=image.width;source.height=image.height;const ctx=source.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0);
 const all=ctx.getImageData(0,0,image.width,image.height),parts=atlasComponents(all.data,image.width,image.height,[4,4,4]);
 const frames=parts.map(part=>{const x=Math.max(0,part.left-2),y=Math.max(0,part.top-2),w=Math.min(image.width,part.right+2)-x,h=Math.min(image.height,part.bottom+2)-y,data=ctx.getImageData(x,y,w,h),shape=spriteSilhouette(data.data,w,h);
  for(let p=0;p<shape.pixels.length;p++)if(!shape.pixels[p])data.data[p*4+3]=0;
  const full=document.createElement('canvas');full.width=w;full.height=h;full.getContext('2d')!.putImageData(data,0,0);
  const canvas=document.createElement('canvas');canvas.width=shape.right-shape.left;canvas.height=shape.bottom-shape.top;canvas.getContext('2d')!.drawImage(full,shape.left,shape.top,canvas.width,canvas.height,0,0,canvas.width,canvas.height);return canvas;
 });return {frames};
}
export function drawDressedAvatar(ctx:CanvasRenderingContext2D,base:PreparedAvatar,body:AvatarBody,look:WardrobeLook,gear:HeadwearArtwork,direction:AvatarDirection,walking:boolean,distance:number,x:number,y:number,reducedMotion=false){
 const drawBody=()=>drawAvatar(ctx,dressAvatar(base,body,look),direction,walking,distance,x,y,reducedMotion);
 if(look.head==='none'){drawBody();return;}
 const pose=avatarPose(direction,walking,distance,reducedMotion),view=direction==='up'?2:direction==='left'||direction==='right'?1:0,index=['star','cap','cat','crown'].indexOf(look.head),image=gear.frames[view*4+index];
 let width=look.head==='star'?25:look.head==='crown'?48:65,height=image.height/image.width*width;
 if(height>60){width*=60/height;height=60;}
 const bottom=look.head==='star'?-100:look.head==='crown'?-125:look.head==='cat'?(view===1?-90:-98):-106,offset=look.head==='star'?(view===2?15:-15):view===1?8:0;
 if(look.head!=='cat')drawBody();
 ctx.save();ctx.translate(x,y);if(pose.flip)ctx.scale(-1,1);ctx.drawImage(image,offset-width/2,bottom-height,width,height);ctx.restore();
 if(look.head==='cat')drawBody();
}
