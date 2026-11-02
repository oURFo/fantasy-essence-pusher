import assert from 'node:assert/strict';
import {readRgba} from './png-rgba.mjs';
import {cultivationFrames} from '../src/cultivation-rendering.ts';
for(const [name,count] of [['hero',3],['enemies',6],['props',4],['spells',3],['cabinet',1]]){
 const {rgba,width,height}=readRgba(`public/assets/cultivation/${name}.png`),frames=cultivationFrames(rgba,width,height,name);
 assert.equal(frames.length,count,name);
 for(const f of frames){assert.ok(f.right>f.left&&f.bottom>f.top);assert.ok(f.left>0&&f.top>0&&f.right<width-1&&f.bottom<height-1,`${name} clipped at image boundary`);assert.ok(f.indices.length>1000);}
}
console.log('Cultivation artwork passed: complete isolated hero views, six enemies, four props, three spells and cabinet.');
