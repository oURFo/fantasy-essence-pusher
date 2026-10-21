import assert from 'node:assert/strict';import {LobbyGMCode} from '../src/gm-controls.ts';import {PlayerWallet} from '../src/wallet.ts';
const code=new LobbyGMCode(),wallet=new PlayerWallet();let time=0;
function key(k,allowed=true,repeat=false,modified=false){if(code.key(k,time+=100,allowed,repeat,modified))wallet.credit(1000);}
key('9');key('9');key('5');assert.equal(wallet.gold,2000);key('9');key('9');key('5');assert.equal(wallet.gold,3000);
key('9');key('9',true,true);key('5');assert.equal(wallet.gold,3000,'holding 9 is not two presses');
code.reset();key('9');key('9',false);key('5');assert.equal(wallet.gold,3000,'machine or editable-field input resets sequence');
key('9');key('9');time+=2100;key('5');assert.equal(wallet.gold,3000,'stale partial codes expire');
key('9');key('9');key('5',true,false,true);assert.equal(wallet.gold,3000,'modified shortcuts do not trigger');
key('9');key('9');key('x');key('5');assert.equal(wallet.gold,3000);
key('9');key('9');key('9');key('5');assert.equal(wallet.gold,4000,'overlapping prefix works once');
console.log('GM code passed: 995 grants 1000, repeat grants, lobby/editable isolation, timeout, autorepeat and modifier guards.');
