import assert from 'node:assert/strict';
import {WardrobeProfile,WARDROBE_KEY,LEGACY_WARDROBE_KEY,defaultLook,lookKey,safeLook,EFFECTS_ENABLED} from '../src/wardrobe.ts';
const data=new Map([['wallet','1234']]);const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
data.set(LEGACY_WARDROBE_KEY,JSON.stringify({version:1,male:{hair:'silver',head:'cap',top:'sky'},female:{hair:'honey',head:'crown',top:'berry'}}));
const p=new WardrobeProfile(storage);assert.equal(p.look('male').accessory,'cap');assert.equal(p.look('male').suit,'denim');assert.equal(p.look('female').suit,'rose');assert.equal(p.look('female').hairColor,'honey');
const same=defaultLook();assert.equal(lookKey('male',same),lookKey('female',same),'preset cannot change rig or render cache');p.commit({male:same,female:same});assert.deepEqual(new WardrobeProfile(storage).look('male'),new WardrobeProfile(storage).look('female'));assert.equal(JSON.parse(data.get(WARDROBE_KEY)).rig,'shared-v2');assert.equal(data.get('wallet'),'1234');assert.ok(data.has(LEGACY_WARDROBE_KEY));
assert.equal(EFFECTS_ENABLED,false);assert.equal(safeLook({effect:'sparkle',suit:'invalid'}).effect,'none');const copy=p.look('male');copy.suit='rose';assert.equal(p.look('male').suit,'arcade');
console.log('Wardrobe v2 migration, shared appearance, validation, isolated drafts and reserved effects passed.');
