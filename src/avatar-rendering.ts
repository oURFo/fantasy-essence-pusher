import {AVATAR_RIG as R,rigMotion} from './avatar-rig.ts';
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

export const RIG_ASSETS=['head','base','arcade','denim','rose','hair-back','hair-front','expressions'] as const;
type Sprite=HTMLCanvasElement;
export interface RigArtwork {parts:Record<string,Sprite[]>;hair:Map<string,Sprite[]>;}
function extract(image:HTMLImageElement,rows:number[],groups=false):Sprite[]{
 const source=document.createElement('canvas');source.width=image.width;source.height=image.height;const ctx=source.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0);
 const data=ctx.getImageData(0,0,image.width,image.height);
 const bounds=groups?Array.from({length:8},(_,i)=>{const col=i%4,row=Math.floor(i/4),cw=image.width/4,ch=image.height/2;let left=image.width,top=image.height,right=0,bottom=0;for(let y=Math.floor(row*ch);y<(row+1)*ch;y++)for(let x=Math.floor(col*cw);x<(col+1)*cw;x++)if(data.data[(y*image.width+x)*4+3]>96){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}return {left,top,right,bottom};}):atlasComponents(data.data,image.width,image.height,rows);
 return bounds.map(b=>{const c=document.createElement('canvas');c.width=b.right-b.left+4;c.height=b.bottom-b.top+4;const out=c.getContext('2d')!;out.drawImage(image,b.left-2,b.top-2,c.width,c.height,0,0,c.width,c.height);if('indices' in b){const mask=new Uint8Array(c.width*c.height);for(const p of b.indices as Int32Array){const x=p%image.width-b.left+2,y=Math.floor(p/image.width)-b.top+2;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<c.width&&ny>=0&&ny<c.height)mask[ny*c.width+nx]=1;}}const d=out.getImageData(0,0,c.width,c.height);for(let i=0;i<mask.length;i++)if(!mask[i])d.data[i*4+3]=0;out.putImageData(d,0,0);}return c;});
}
export function prepareRigArtwork(images:HTMLImageElement[],accessories:HTMLImageElement):RigArtwork{
 const parts:Record<string,Sprite[]>={};RIG_ASSETS.forEach((name,i)=>parts[name]=extract(images[i],name==='head'?[3]:name==='hair-back'?[3,3,3]:name==='hair-front'?[3,3]:[5,5,5],name==='expressions'));
 parts.accessory=extract(accessories,[4,4,4]);
 // The three suit atlases draw the rear trouser pair as one component. Select one leg.
 for(const name of ['arcade','denim','rose']){const src=parts[name][12],c=document.createElement('canvas');c.width=Math.floor(src.width*.48);c.height=src.height;c.getContext('2d')!.drawImage(src,0,0);parts[name][12]=c;}
 return {parts,hair:new Map()};
}
function hairParts(art:RigArtwork,layer:string,color:string){const key=layer+color;if(art.hair.has(key))return art.hair.get(key)!;const result=art.parts[layer].map(src=>{if(color==='brown')return src;const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const ctx=c.getContext('2d')!;ctx.drawImage(src,0,0);const d=ctx.getImageData(0,0,c.width,c.height),target=color==='honey'?[196,150,83]:[163,169,183];for(let p=0;p<d.data.length;p+=4){const l=(d.data[p]*.3+d.data[p+1]*.59+d.data[p+2]*.11)/90;for(let k=0;k<3;k++)d.data[p+k]=Math.min(255,target[k]*l);}ctx.putImageData(d,0,0);return c;});art.hair.set(key,result);return result;}
export function drawRigAvatar(ctx:CanvasRenderingContext2D,art:RigArtwork,look:WardrobeLook,direction:AvatarDirection,walking:boolean,distance:number,x:number,y:number,reduced=false){
 const m=rigMotion(direction,walking,distance,reduced),v=m.view,side=v===1,parts=art.parts[look.suit],draw=(s:Sprite,x:number,y:number,w:number,h:number)=>ctx.drawImage(s,x,y,w,h);
 ctx.save();ctx.translate(x,y-m.bob);ctx.scale(m.flip?-1:1,1);
 const leg=(i:number)=>{const a=m.legs[i];ctx.save();ctx.translate(side?(i===0?-3:3):(i===0?-R.hip.x:R.hip.x),R.hip.y-(side?0:a.lift));ctx.rotate(side?a.thigh:a.thigh*.15);draw(parts[v*5+2],-5.5,-2,11,24);ctx.translate(0,21);ctx.rotate(side?a.knee:0);draw(parts[v*5+3],-5,-2,10,21);ctx.translate(0,18);draw(parts[v*5+4],side?-5:-7.5,-2,15,9);ctx.restore();};
 const arm=(i:number)=>{ctx.save();ctx.translate(side?(i===0?-3:3):(i===0?-14:14),-76);ctx.rotate(m.arms[i]*(side?1:.3));if(i===0&&!side)ctx.scale(-1,1);draw(parts[v*5+1],-5.5,-3,11,33);ctx.restore();};
 leg(0);arm(0);draw(parts[v*5],R.torso.x,R.torso.y,R.torso.w,R.torso.h);leg(1);arm(1);
 const hairIndex=['short','bob','ponytail'].indexOf(look.hairStyle),head=v===0?R.head.front:v===1?R.head.side:R.head.back;
 const rear=hairParts(art,'hair-back',look.hairColor)[v*3+hairIndex];
 const hairRect=look.hairStyle==='ponytail'?(side?{x:-45,y:-145,w:77,h:75}:{x:-32,y:-144,w:64,h:69}):{x:-31,y:-141,w:62,h:61};
 if(v!==2)draw(rear,hairRect.x,hairRect.y,hairRect.w,hairRect.h);
 draw(art.parts.head[v],head.x,head.y,head.w,head.h);
 if(v===2)draw(rear,hairRect.x,hairRect.y,hairRect.w,hairRect.h);
 else {const f=side?R.face.side:R.face.front;draw(art.parts.expressions[(side?4:0)+['smile','laugh','wink','surprise'].indexOf(look.expression)],f.x,f.y,f.w,f.h);const front=hairParts(art,'hair-front',look.hairColor)[v*3+hairIndex];ctx.save();if(look.accessory==='cap'){ctx.beginPath();ctx.rect(-60,-115,120,80);ctx.clip();}draw(front,side?-27:-30,-141,side?57:60,side?43:34);ctx.restore();}
 if(look.accessory!=='none'){const mount=R.mounts[look.accessory][v],index=['star','cap','cat','crown'].indexOf(look.accessory);draw(art.parts.accessory[v*4+index],mount.x,mount.y,mount.w,mount.h);}
 ctx.restore();
}
