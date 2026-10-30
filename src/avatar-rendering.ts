import {AVATAR_RIG as R,rigMotion,figurePlacement,neckAnchor} from './avatar-rig.ts';
import type {AvatarDirection} from './avatar-motion.ts';
import type {WardrobeLook} from './wardrobe.ts';
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

export const RIG_ASSETS=['base','arcade','denim','rose','hair','accessories','expressions','walk-base','walk-arcade','walk-denim','walk-rose'] as const;
type Sprite=HTMLCanvasElement;
export interface RigArtwork {parts:Record<string,Sprite[]>;hair:Map<string,Sprite[]>;}
function extract(image:HTMLImageElement,rows:number[],groups=false):Sprite[]{
 const source=document.createElement('canvas');source.width=image.width;source.height=image.height;const ctx=source.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0);
 const data=ctx.getImageData(0,0,image.width,image.height);
 const bounds=groups?Array.from({length:8},(_,i)=>{const col=i%4,row=Math.floor(i/4),cw=image.width/4,ch=image.height/2;let left=image.width,top=image.height,right=0,bottom=0;for(let y=Math.floor(row*ch);y<(row+1)*ch;y++)for(let x=Math.floor(col*cw);x<(col+1)*cw;x++)if(data.data[(y*image.width+x)*4+3]>96){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}return {left,top,right,bottom};}):atlasComponents(data.data,image.width,image.height,rows);
 return bounds.map(b=>{const c=document.createElement('canvas');c.width=b.right-b.left+4;c.height=b.bottom-b.top+4;const out=c.getContext('2d')!;out.drawImage(image,b.left-2,b.top-2,c.width,c.height,0,0,c.width,c.height);if('indices' in b){const mask=new Uint8Array(c.width*c.height);for(const p of b.indices as Int32Array){const x=p%image.width-b.left+2,y=Math.floor(p/image.width)-b.top+2;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<c.width&&ny>=0&&ny<c.height)mask[ny*c.width+nx]=1;}}const d=out.getImageData(0,0,c.width,c.height);for(let i=0;i<mask.length;i++)if(!mask[i])d.data[i*4+3]=0;out.putImageData(d,0,0);}return c;});
}
/** Register each complete figure with ONE uniform scale. Never stretch separate limbs. */
function registerFigure(source:Sprite):Sprite{
 const c=document.createElement('canvas');c.width=R.frameWidth*3;c.height=R.height*3;
 const p=figurePlacement(source.width,source.height);
 c.getContext('2d')!.drawImage(source,p.x*3,p.y*3,p.width*3,p.height*3);return c;
}
function registerWalk(source:Sprite):Sprite{
 const ctx=source.getContext('2d',{willReadFrequently:true})!,anchor=neckAnchor(ctx.getImageData(0,0,source.width,source.height).data,source.width,source.height);
 // One uniform transform for the ENTIRE clothed body; no separated limbs or duplicated shoes.
 const scale=-R.headBottom/(source.height-anchor.y),c=document.createElement('canvas');c.width=R.frameWidth*3;c.height=R.height*3;
 c.getContext('2d')!.drawImage(source,(R.frameWidth/2-anchor.x*scale)*3,(R.height+R.headBottom-anchor.y*scale)*3,source.width*scale*3,source.height*scale*3);return c;
}
export function prepareRigArtwork(images:HTMLImageElement[]):RigArtwork{
 const parts:Record<string,Sprite[]>={};RIG_ASSETS.forEach((name,i)=>{
  const walk=name.startsWith('walk-');
  parts[name]=extract(images[i],walk?[4,4,4]:name==='hair'?[3,3,3]:name==='accessories'?[4,4,4]:[3],name==='expressions');
  if(['base','arcade','denim','rose'].includes(name))parts[name]=parts[name].map(registerFigure);
  if(walk)parts[name]=parts[name].map(registerWalk);
 });return {parts,hair:new Map()};
}
function hairParts(art:RigArtwork,layer:string,color:string){const key=layer+color;if(art.hair.has(key))return art.hair.get(key)!;const result=art.parts[layer].map(src=>{if(color==='brown')return src;const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const ctx=c.getContext('2d')!;ctx.drawImage(src,0,0);const d=ctx.getImageData(0,0,c.width,c.height),target=color==='honey'?[196,150,83]:[163,169,183];for(let p=0;p<d.data.length;p+=4){const l=(d.data[p]*.3+d.data[p+1]*.59+d.data[p+2]*.11)/90;for(let k=0;k<3;k++)d.data[p+k]=Math.min(255,target[k]*l);}ctx.putImageData(d,0,0);return c;});art.hair.set(key,result);return result;}
/** Same complete master head in every suit/preset; only the outfit below the neck changes. */
export function drawRigAvatar(ctx:CanvasRenderingContext2D,art:RigArtwork,look:WardrobeLook,direction:AvatarDirection,walking:boolean,distance:number,x:number,y:number,reduced=false,bare=false){
 const m=rigMotion(direction,walking,distance,reduced),v=m.view,side=v===1,suit=bare?'base':look.suit;
 const figure=m.active?art.parts['walk-'+suit][v*4+m.frame]:art.parts[suit][v];
 const full=(sprite:Sprite)=>ctx.drawImage(sprite,-R.frameWidth/2,-R.height,R.frameWidth,R.height);
 const clip=(x:number,y:number,w:number,h:number,paint:()=>void)=>{ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();paint();ctx.restore();};
 ctx.save();ctx.translate(x,y-m.bob);ctx.scale(m.flip?-1:1,1);
 // Current suits are symmetric; mirror their complete opposite half-step, never individual limbs.
 ctx.save();if(m.active&&!side&&m.frame>=2)ctx.scale(-1,1);
 clip(-R.frameWidth/2,R.headBottom,R.frameWidth,-R.headBottom,()=>full(figure));ctx.restore();
 clip(-R.frameWidth/2,-R.height,R.frameWidth,R.height+R.headBottom,()=>full(art.parts.base[v]));
 if(!bare){
  if(v!==2){const f=side?R.face.side:R.face.front,index=['smile','laugh','wink','surprise'].indexOf(look.expression);ctx.drawImage(art.parts.expressions[(side?4:0)+index],f.x,f.y,f.w,f.h);}
  const hairIndex=['short','bob','ponytail'].indexOf(look.hairStyle),hair=hairParts(art,'hair',look.hairColor)[v*3+hairIndex],h=R.hair[look.hairStyle][v];
  ctx.save();
  // Caps fit the skull, not the outer hairstyle; only hair below the fixed band survives.
  if(look.accessory==='cap'){ctx.beginPath();ctx.rect(-60,-116,120,100);ctx.clip();}
  ctx.drawImage(hair,h.x,h.y,h.w,h.h);ctx.restore();
  if(look.accessory!=='none'){const a=R.mounts[look.accessory][v],index=['star','cap','cat','crown'].indexOf(look.accessory);ctx.drawImage(art.parts.accessories[v*4+index],a.x,a.y,a.w,a.h);}
 }
 ctx.restore();
}
