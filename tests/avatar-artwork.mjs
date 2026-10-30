import assert from 'node:assert/strict';
import {readRgba} from './png-rgba.mjs';
import {neckAnchor} from '../src/avatar-rig.ts';
import {atlasComponents} from '../src/avatar-rendering.ts';
const skullWidths={};
for(const [name,rows] of Object.entries({base:[3],arcade:[3],denim:[3],rose:[3],hair:[3,3,3],accessories:[4,4,4]})){
 const a=readRgba('public/assets/lobby/rig-v3/'+name+'.png');const parts=atlasComponents(a.rgba,a.width,a.height,rows);assert.equal(parts.length,rows.reduce((a,b)=>a+b));assert.equal(a.rgba[3],0,'transparent background');for(const p of parts)assert.ok(p.right>p.left&&p.bottom>p.top);
 if(rows.length===1){skullWidths[name]=parts.map(p=>{let min=Infinity,max=-Infinity;for(const i of p.indices){const y=Math.floor(i/a.width);if(y>p.top+(p.bottom-p.top)*.4)continue;const r=a.rgba[i*4],g=a.rgba[i*4+1],b=a.rgba[i*4+2];if(r>180&&g>120&&b>75&&r>g*1.08&&g>b*1.06){min=Math.min(min,i%a.width);max=Math.max(max,i%a.width);}}return (max-min)/(p.bottom-p.top);});}
}
for(const name of ['arcade','denim','rose'])for(let v=0;v<3;v++)assert.ok(Math.abs(skullWidths[name][v]-skullWidths.base[v])<.025,'outfits preserve master skull/body scale');
const a=readRgba('public/assets/lobby/rig-v2/expressions.png');for(let row=0;row<2;row++)for(let col=0;col<4;col++){let count=0;for(let y=Math.floor(row*a.height/2);y<(row+1)*a.height/2;y++)for(let x=Math.floor(col*a.width/4);x<(col+1)*a.width/4;x++)if(a.rgba[(y*a.width+x)*4+3]>96)count++;assert.ok(count>100,'all eight expression groups populated');}
console.log('Twelve complete figures, matching master skull scale, nine wigs, twelve accessories and eight expressions verified.');

for(const name of ['base','arcade','denim','rose']){
 const a=readRgba('public/assets/lobby/rig-v3/walk-'+name+'.png'),parts=atlasComponents(a.rgba,a.width,a.height,[4,4,4]);assert.equal(parts.length,12);
 for(const p of parts){const w=p.right-p.left,h=p.bottom-p.top,rgba=new Uint8ClampedArray(w*h*4);for(const i of p.indices)rgba[((Math.floor(i/a.width)-p.top)*w+i%a.width-p.left)*4+3]=255;const n=neckAnchor(rgba,w,h);assert.ok(n.y/h>.34&&n.y/h<.58,'each whole pose has a neck anchor');}
 const footSpan=p=>{let left=Infinity,right=-Infinity;for(const i of p.indices)if(Math.floor(i/a.width)>p.top+(p.bottom-p.top)*.82){left=Math.min(left,i%a.width);right=Math.max(right,i%a.width);}return right-left;};
 assert.ok(footSpan(parts[4])>footSpan(parts[5])*1.2,'side contact and passing must have genuinely different silhouettes');
}
console.log('48 complete walk poses verified: neck registration and alternating open/passing silhouettes.');
