import assert from 'node:assert/strict';
import {readRgba} from './png-rgba.mjs';
import {atlasComponents} from '../src/avatar-rendering.ts';
for(const [name,rows] of Object.entries({head:[3],base:[5,5,5],arcade:[5,5,5],denim:[5,5,5],rose:[5,5,5],'hair-back':[3,3,3],'hair-front':[3,3]})){
 const a=readRgba('public/assets/lobby/rig-v2/'+name+'.png');const parts=atlasComponents(a.rgba,a.width,a.height,rows);assert.equal(parts.length,rows.reduce((a,b)=>a+b));assert.equal(a.rgba[3],0,'transparent background');for(const p of parts)assert.ok(p.right>p.left&&p.bottom>p.top);
}
const a=readRgba('public/assets/lobby/rig-v2/expressions.png');for(let row=0;row<2;row++)for(let col=0;col<4;col++){let count=0;for(let y=Math.floor(row*a.height/2);y<(row+1)*a.height/2;y++)for(let x=Math.floor(col*a.width/4);x<(col+1)*a.width/4;x++)if(a.rgba[(y*a.width+x)*4+3]>96)count++;assert.ok(count>100,'all eight expression groups populated');}
console.log('Shared head, 60 suit parts, 15 hair layers and eight expressions verified.');
