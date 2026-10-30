// Minimal read-only PNG decoder for validating our RGBA8 AI texture assets.
import {readFileSync} from 'node:fs';import {inflateSync} from 'node:zlib';
export function readRgba(path){
 const bytes=readFileSync(path),chunks=[];let width=0,height=0;
 if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Not PNG');
 for(let offset=8;offset<bytes.length;){const n=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8),data=bytes.subarray(offset+8,offset+8+n);if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);if(data[8]!==8||data[9]!==6||data[12]!==0)throw Error('Expected non-interlaced RGBA8');}if(type==='IDAT')chunks.push(data);offset+=n+12;}
 const raw=inflateSync(Buffer.concat(chunks)),stride=width*4,rgba=new Uint8ClampedArray(width*height*4);
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];for(let x=0;x<stride;x++){const at=y*stride+x,a=x>=4?rgba[at-4]:0,b=y?rgba[at-stride]:0,c=y&&x>=4?rgba[at-stride-4]:0,value=raw[y*(stride+1)+x+1];rgba[at]=(value+(filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):(()=>{throw Error('Unknown filter');})()))&255;}}
 return {rgba,width,height};
}
