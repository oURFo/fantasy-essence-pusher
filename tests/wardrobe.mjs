import assert from 'node:assert/strict';
import {WardrobeProfile,WARDROBE_KEY,LEGACY_WARDROBE_KEY,defaultLook,lookKey,safeLook,EFFECTS_ENABLED} from '../src/wardrobe.ts';
const data=new Map([['wallet','1234']]);const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
data.set(LEGACY_WARDROBE_KEY,JSON.stringify({version:1,male:{hair:'silver',head:'cap',top:'sky'},female:{hair:'honey',head:'crown',top:'berry'}}));
const p=new WardrobeProfile(storage);assert.equal(p.look('male').accessory,'cap');assert.equal(p.look('male').suit,'denim');assert.equal(p.look('female').suit,'rose');assert.equal(p.look('female').hairColor,'honey');
const same=defaultLook();assert.equal(lookKey('male',same),lookKey('female',same),'preset cannot change rig or render cache');p.commit({male:same,female:same});assert.deepEqual(new WardrobeProfile(storage).look('male'),new WardrobeProfile(storage).look('female'));assert.equal(JSON.parse(data.get(WARDROBE_KEY)).rig,'shared-v3');assert.equal(data.get('wallet'),'1234');assert.ok(data.has(LEGACY_WARDROBE_KEY));
assert.equal(EFFECTS_ENABLED,false);assert.equal(safeLook({effect:'sparkle',suit:'invalid'}).effect,'none');const copy=p.look('male');copy.suit='rose';assert.equal(p.look('male').suit,'arcade');
console.log('Wardrobe v2 migration, shared appearance, validation, isolated drafts and reserved effects passed.');

// Exercise the real drawing function without a browser: complete sprites and the master head only.
const {drawRigAvatar}=await import('../src/avatar-rendering.ts');
const parts=Object.fromEntries([['base',3],['arcade',3],['denim',3],['rose',3],['hair',9],['accessories',12],['expressions',8],['walk-base',12],['walk-arcade',12],['walk-denim',12],['walk-rose',12]].map(([name,n])=>[name,Array.from({length:n},(_,i)=>({name:name+i}))]));
const art={parts,hair:new Map()},calls=[];const ctx=Object.fromEntries(['save','restore','translate','scale','beginPath','rect','clip','drawImage'].map(name=>[name,(...args)=>calls.push([name,...args])]));
for(const direction of ['down','right','up','left'])for(const walking of [false,true]){
 calls.length=0;drawRigAvatar(ctx,art,defaultLook('male'),direction,walking,35,0,0,false,true);const a=JSON.stringify(calls);
 calls.length=0;drawRigAvatar(ctx,art,defaultLook('female'),direction,walking,35,0,0,false,true);assert.equal(JSON.stringify(calls),a,'bare preview identical across presets');
}
for(const suit of ['base','arcade','denim','rose'])for(const direction of ['down','right','up','left'])for(const walking of [false,true]){
 calls.length=0;drawRigAvatar(ctx,art,{...defaultLook(),suit},direction,walking,35,0,0);
 const complete=calls.filter(c=>c[0]==='drawImage'&&c[2]===-64&&c[3]===-136);assert.equal(complete.length,2,'one full body and one shared head, no split limbs');
 assert.equal(complete.at(-1)[1],parts.base[direction==='up'?2:direction==='down'?0:1]);
}
console.log('Actual renderer: identical bare presets, complete bodies, same master head in every suit and direction.');
