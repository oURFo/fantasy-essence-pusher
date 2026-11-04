import assert from 'node:assert/strict';
import {MACHINES} from '../src/machines.ts';
import {FULLSCREEN_CONTROLS,fullscreenSize} from '../src/fullscreen-rules.ts';
assert.deepEqual(Object.keys(FULLSCREEN_CONTROLS).sort(),MACHINES.map(m=>m.id).sort(),'every machine has a fullscreen control definition');
for(const [w,h]of [[1024,1536],[1024,1700],[1024,1200],[1024,900],[620,980]])for(const [vw,vh]of [[390,844],[844,390],[1280,800],[1920,1080]]){const size=fullscreenSize(w,h,vw,vh,110);assert.ok(size.width<=vw-16+.00001);assert.ok(size.height<=vh-126+.00001);assert.ok(Math.abs(size.width/size.height-w/h)<1e-9,'preserve image and input geometry aspect ratio');assert.ok(size.width>0&&size.height>0);}
assert.ok(FULLSCREEN_CONTROLS['wonder-train'].includes('train-fire'));assert.ok(FULLSCREEN_CONTROLS['night-market'].includes('ring-buy-0'));assert.ok(FULLSCREEN_CONTROLS['gold-mine'].includes('mine-dial'));assert.ok(FULLSCREEN_CONTROLS['fruit-banquet'].includes('drop'));
console.log('Fullscreen passed: all ten machines covered, essential gameplay controls mapped, portrait/landscape and secondary-board fit without stretching or cropping.');
