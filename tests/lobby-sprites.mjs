import assert from 'node:assert/strict';
import {cabinetFrame,drawCabinetSprite} from '../src/lobby-sprites.ts';
// Actual artwork extents: last opaque row above / first opaque row below.
const extents=[[499,509],[495,510],[494,498],[496,499]];
for(let col=0;col<4;col++){
 const upper=cabinetFrame(col,1536,1024),lower=cabinetFrame(col+4,1536,1024),[last,first]=extents[col];
 assert.ok(upper.y+upper.h>last,'upper cabinet feet remain visible');
 assert.ok(upper.y+upper.h<=first,'next cabinet must not bleed below upper cabinet');
 assert.ok(lower.y>last&&lower.y<=first,'lower cabinet keeps its full crown without upper feet');
 assert.equal(lower.y+lower.h,1024);assert.equal(upper.x,col*384);assert.equal(lower.x,col*384);
 const calls=[],image={width:1536,height:1024};
 drawCabinetSprite({drawImage(...args){calls.push(args);}},image,col+4,180,465,250,332);
 const args=calls[0],scale=332/512;
 // The same opaque foot pixel stays at its previous world position despite
 // including the extra crown above the former 512px row boundary.
 const footY=990;
 assert.equal(args[6]+(footY-lower.y)*scale,465-332+(footY-512)*scale);
 assert.ok(args[6]<465-332,'restored lower-row crown extends above the old crop');
 const small=cabinetFrame(col,768,512);assert.equal(small.h,upper.h/2);
}
assert.throws(()=>cabinetFrame(-1,1536,1024));assert.throws(()=>cabinetFrame(8,1536,1024));
console.log('Cabinet atlas passed: all eight complete silhouettes, no cross-row bleed, stable scale and foot placement.');
