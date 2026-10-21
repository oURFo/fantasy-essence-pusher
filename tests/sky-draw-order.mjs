import assert from 'node:assert/strict';
import {skyDrawOrder} from '../src/sky-draw-order.ts';
let reads=0;
const coins=Array.from({length:600},(_,i)=>{const p={x:i%12,y:i%9===0?-2:(i%13)/10,z:i%8};return{entered:i%3!==0,body:{translation(){reads++;return{...p};}}};});
const input=[...coins],result=skyDrawOrder(coins);
assert.equal(reads,600,'exactly one physics position read per bead, independent of sort comparisons');
assert.deepEqual(coins,input,'rendering must not reorder simulation bodies');
assert.equal(new Set(result.map(x=>x.coin)).size,600);
for(let i=1;i<result.length;i++)assert.ok(result[i-1].depth<=result[i].depth);
for(const item of result){const {p,coin}=item;const expected=coin.entered&&p.y<0&&p.z>6.65?10000+p.z*44-p.y*48:coin.entered?p.z*44+p.y*25:-p.y*48;assert.equal(item.depth,expected);}
assert.ok(result.filter(x=>x.coin.entered&&x.p.y<0&&x.p.z>6.65).every(x=>x.depth>10000),'front falls remain in foreground');
console.log('Draw order passed: 600 beads, 600 position reads, unchanged depth rules and simulation order.');
