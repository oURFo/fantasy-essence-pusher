import assert from 'node:assert/strict';
import {readRgba} from './png-rgba.mjs';import {avatarComponents,atlasComponents} from '../src/avatar-rendering.ts';
for(const body of ['male','female']){
 const {rgba,width,height}=readRgba(new URL(`../public/assets/lobby/avatar-${body}-walk.png`,import.meta.url)),parts=avatarComponents(rgba,width,height);
 assert.equal(parts.length,21);
 for(const p of parts){assert.ok(p.left>0&&p.top>0&&p.right<width&&p.bottom<height,'every complete pose has padding');assert.ok(p.bottom-p.top>200);assert.ok(p.indices.length>10000);}
 for(const [start,count] of [[0,6],[6,6],[12,6],[18,3]]){const row=parts.slice(start,start+count);for(let i=1;i<row.length;i++)assert.ok(row[i-1].right<row[i].left,'adjacent poses must have clean transparent separation');}
}
const gear=readRgba(new URL('../public/assets/lobby/headwear.png',import.meta.url));
const gearParts=atlasComponents(gear.rgba,gear.width,gear.height,[4,4,4]);assert.equal(gearParts.length,12);for(const p of gearParts){assert.ok(p.indices.length>4000);assert.ok(p.left>0&&p.top>0&&p.right<gear.width&&p.bottom<gear.height,'all headwear has complete silhouettes');}
console.log('Actual AI artwork passed: 42 complete avatar poses, clear silhouette separation and 12 padded headwear views.');
