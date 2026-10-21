import RAPIER from '@dimforge/rapier3d-compat';
import {CONFIG} from './config.ts';
import {loadArtwork,render} from './rendering.ts';
import {SLOT_REWARDS} from './slot.ts';
import {marqueeMessage} from './celebration.ts';
import {PlayerWallet,type WalletStorage} from './wallet.ts';
import {ArcadeSession} from './arcade-session.ts';
import {MACHINES,type MachineId} from './machines.ts';
import {SkyWings} from './sky-game.ts';
import {SKY_TIERS} from './sky-rules.ts';
import {loadSkyArtwork,renderSky} from './sky-rendering.ts';
import {FruitPinball,FruitProgress} from './fruit-game.ts';
import {bindFruitPlunger} from './fruit-input.ts';
import {loadFruitArtwork,renderFruit} from './fruit-rendering.ts';
import {FRUIT_CELLS,FRUIT_RECIPES,FRUIT_NAMES,FRUIT_COST,FRUIT_BALLS,FRUIT_PAYOUTS} from './fruit-rules.ts';
import {NightMarket} from './ring-game.ts';
import {loadRingArtwork,renderRing} from './ring-rendering.ts';
import {bindRingInput} from './ring-input.ts';
import {initRingUI} from './ring-ui.ts';
import './style.css';

const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
let storage:WalletStorage|undefined;
try{storage=window.localStorage;}catch{/* Browser storage can be disabled. */}
const wallet=new PlayerWallet(storage),session=new ArcadeSession(wallet,new FruitProgress(storage));
let lastUI=0;
let accumulator=0,previous=0,entering=false,readyPromise:Promise<void>|undefined;
const dialog=$<HTMLDialogElement>('leave-dialog');
const plunger=bindFruitPlunger(()=>session.game instanceof FruitPinball?session.game:null,()=>document.hidden||session.leaveRequested,updateUI);
const ringInput=bindRingInput(()=>session.game instanceof NightMarket?session.game:null,()=>document.hidden||session.leaveRequested,updateUI);
const ringUI=initRingUI(()=>session.game instanceof NightMarket?session.game:null,()=>document.hidden||session.leaveRequested,updateUI);
function resetClock(){ringInput.cancel();accumulator=0;previous=0;plunger.cancel();}
function syncWallet(){
 const balance=wallet.gold.toLocaleString('en-US');
 $('gold-balance').textContent=balance;$('lobby-gold').textContent=balance;
}
function updateUI(){
 syncWallet();const game=session.game;if(!game)return;
 if(game instanceof NightMarket){ringUI.update(game);$('machine-announcement').textContent=game.message;return;}
 if(game instanceof FruitPinball){
  $<HTMLButtonElement>('drop').disabled=session.leaveRequested||game.inputLocked||(game.freeRounds===0&&game.gold<FRUIT_COST);
  $('drop').textContent=game.phase==='playing'?'本局進行中 · 使用右下拉把':game.phase==='result'?(game.freeRounds?'免費再玩一局 · 0 金幣':'再開一局 · 20 金幣'):'開始星宴 · 20 金幣';
  $<HTMLButtonElement>('fruit-plunger-grip').disabled=session.leaveRequested||!game.canLaunch;
  $('auto-drop').hidden=true;$('slot-status').hidden=true;$('status').hidden=true;
  $('fruit-balls').textContent=`${game.landed} / ${FRUIT_BALLS}`;$('fruit-completed').textContent=`${game.completed.length} / 15`;
  $('fruit-round-status').textContent=game.phase==='result'?`本局 ${game.completed.length} 道配方，獲得 ${game.payout} 金幣（${(game.payout/20).toFixed(2)}×）`:game.phase==='playing'?`已發射 ${game.launched} / 16 顆 · ${game.completed.length>=3?'已達發獎門檻':'完成 3 道配方開始發獎'}`:'每局 20 金幣，使用右下拉把逐顆發射 16 顆彈珠。';
  $('fruit-streak').textContent=`${game.freeRounds?'同格集滿 6 顆！已獲贈免費一局 · ':game.playingFree?'本局為免費遊戲 · ':''}連續未發獎 ${game.progress.streak} 場${game.progress.streak>=3?' · 下局贈送 1～5 格水果':''}`;
  $('auto-status').textContent=game.freeRounds===0&&game.gold<FRUIT_COST&&game.phase!=='playing'?'金幣不足 20，暫時無法開局':game.phase==='playing'?`剩餘 ${16-game.launched} 顆待發射 · ${game.canLaunch?'拉下右下角拉把，放開發射':'等待發射軌道清空'} · 不額外扣款`:'按開始或空白鍵開局 · 開局後使用右下拉把發射';
  $('machine-announcement').textContent=$('fruit-round-status').textContent;
  for(let n=3;n<=15;n++)$(`fruit-payout-${n}`).dataset.current=String(game.completed.length===n);
  for(const recipe of FRUIT_RECIPES){const element=$(`fruit-recipe-${recipe.id}`);const lit=recipe.slots.map(i=>Boolean(game.mask&(1<<i)));element.dataset.complete=String(lit.every(Boolean));element.textContent=`${recipe.fruits.map((f,i)=>`${lit[i]?'●':'○'}${FRUIT_NAMES[f]}`).join(' + ')} = ${lit.every(Boolean)?'已完成':`已點亮 ${lit.filter(Boolean).length}/3`}`;}
  return;
 }
 $('dropped').textContent=String(game.dropped);$('won').textContent=String(game.won);$('recycled').textContent=String(game.recycled);
 $<HTMLButtonElement>('drop').disabled=session.leaveRequested||game.inputLocked||game.gold<CONFIG.essenceCost||game.time-game.lastDrop+1e-9<CONFIG.dropCooldown||game.coins.length>=CONFIG.maxCoins;
 const auto=$<HTMLButtonElement>('auto-drop');auto.disabled=session.leaveRequested||game.inputLocked||game.gold<CONFIG.essenceCost;
 auto.setAttribute('aria-pressed',String(game.autoDrop));auto.textContent=game.autoDrop?'停止自動投入':'開啟自動投入';
 $('auto-status').textContent=game.gold<CONFIG.essenceCost?'金幣不足，已停止投入；精華入箱可回補金幣':game.autoDrop?'自動投入中 · 每秒最多 2 顆 · 每顆 1 金幣':'1 金幣投入 1 精華 · 精華入箱返還 1 金幣';
 if(game instanceof SkyWings){
  const r=game.sky;$('machine-announcement').textContent=r.message;
  $('slot-status').textContent=`${r.message}${r.queue?` · 待轉 ${r.queue} 次`:''}${game.pendingBonuses.length?` · 待派 ${game.pendingBonuses.length} 精華`:''}`;
  $('sky-stage').textContent=r.config.name;$('sky-timer').textContent=r.locked?r.message:r.tier===0?'不限時':`剩餘 ${Math.ceil(r.remaining)} 秒`;
  $('sky-stage-panel').dataset.tier=String(r.tier);
  if(r.locked)$('auto-status').textContent='停止玩家投入與扣款 · 機台持續運作 · 結算後倒數 10 秒';
 }else{
 const message=marqueeMessage(game.slot);if($('machine-announcement').textContent!==message)$('machine-announcement').textContent=message;
 $('slot-status').textContent=game.slot.remaining>0?`SLOT 派珠中 · 尚餘 ${game.slot.remaining} 顆${game.slot.queue>0?` · 待轉 ${game.slot.queue} 次`:''}`:game.slot.phase==='spinning'?`SLOT 旋轉中${game.slot.queue>0?` · 待轉 ${game.slot.queue} 次`:''}`:'龍珠落入中央寶箱可啟動 SLOT';
 }
 $('status').textContent=`運作中 · ${game.coins.length} 顆精華 · ${game.coins.length>=CONFIG.maxCoins?'珠床已滿，請等待回收':'點擊或空白鍵投幣'}`;
}
function showLobby(){
 $('lobby-screen').hidden=false;$('machine-screen').hidden=true;$('lobby-wallet').hidden=false;$('machine-nav').hidden=true;
 $('page-title').textContent='冒險大廳';$('page-subtitle').textContent='選擇一台機台，展開你的下一段冒險。';document.title='冒險大廳 · 秘境金庫';syncWallet();resetClock();
}
async function ensureReady(id:MachineId){
 if(id==='night-market'){await loadRingArtwork();return;}
 if(id==='fruit-banquet'){await loadFruitArtwork();return;}
 if(!readyPromise)readyPromise=Promise.all([RAPIER.init(),loadArtwork()]).then(()=>{}).catch(error=>{readyPromise=undefined;throw error;});
 await readyPromise;if(id==='sky-wings')await loadSkyArtwork();
}
function renderGame(){const game=session.game;if(game instanceof NightMarket)renderRing(game);else if(game instanceof FruitPinball)renderFruit(game);else if(game instanceof SkyWings)renderSky(game);else if(game)render(game);}
async function enterMachine(id:MachineId){
 if(entering||session.game)return;entering=true;
 const button=$<HTMLButtonElement>(id==='night-market'?'enter-ring':id==='fruit-banquet'?'enter-fruit':id==='sky-wings'?'enter-sky':'enter-machine');
 const label=button.textContent;document.querySelectorAll<HTMLButtonElement>('[data-machine]').forEach(b=>b.disabled=true);button.textContent='正在準備機台…';$('lobby-error').textContent='';
 try{
  await ensureReady(id);if(!session.enter(id))return;
  $('lobby-screen').hidden=true;$('machine-screen').hidden=false;$('lobby-wallet').hidden=true;$('machine-nav').hidden=false;
  const machine=MACHINES.find(m=>m.id===id)!;const sky=id==='sky-wings',fruit=id==='fruit-banquet',ring=id==='night-market';
  $('page-title').textContent=machine.name;$('page-subtitle').textContent=machine.description;document.title=`${machine.name} · 冒險遊藝場`;
  const canvas=$<HTMLCanvasElement>('game');canvas.width=1024;canvas.height=fruit?1700:1536;canvas.setAttribute('aria-label',ring?'夜市套圈圈，六排各八件獎品與底部投擲圈圈':fruit?'水果星宴彈珠台，十五道水果配方及十六個水果格':'奇幻推幣機遊戲');
  $('machine-screen').dataset.machine=id;
  $('ring-throw-zone').hidden=!ring;$('ring-panel').hidden=!ring;document.querySelector<HTMLElement>('.play-controls')!.hidden=ring;
  $('fruit-plunger-grip').hidden=!fruit;$('fruit-panel').hidden=!fruit;$('adventure-details').hidden=fruit||ring;$('auto-drop').hidden=fruit;$('slot-status').hidden=fruit;$('status').hidden=fruit;
  if(!fruit)$('drop').innerHTML='投入精華 · 1 金幣 <kbd>SPACE</kbd>';
  document.querySelectorAll<HTMLElement>('.vault-only').forEach(el=>el.hidden=sky||fruit||ring);document.querySelectorAll<HTMLElement>('.sky-only').forEach(el=>el.hidden=!sky);
  $('front-rule').textContent='中央 1/2 計入獎勵，左右各 1/4 系統回收';
  $('leave-pending').textContent=fruit?'本局彈珠、已點亮水果與未結算獎勵將清除，已支付的 20 金幣不退還。連敗紀錄保留，離場不累加連敗。':sky?'尚未完成的輪盤、升階進度、待轉次數與未派出的精華獎勵也會清除。':'尚未完成的 SLOT、待轉次數與未派出的精華獎勵也會清除。';
  $<HTMLDetailsElement>('adventure-details').open=false;
  $('loading').style.display='none';resetClock();updateUI();renderGame();
  history.pushState({view:'machine',id},'',`#machine/${id}`);window.scrollTo({top:0,behavior:'auto'});$('back-to-lobby').focus({preventScroll:true});
 }catch(error){$('lobby-error').textContent='機台載入失敗，請稍後重試。';console.error(error);}
 finally{entering=false;document.querySelectorAll<HTMLButtonElement>('[data-machine]').forEach(b=>b.disabled=false);button.textContent=label;}
}
function requestLeave(){
 if(session.leaveRequested||!session.requestLeave())return;
 resetClock();if(session.game instanceof NightMarket){const g=session.game;$('leave-pending').textContent=`背包 ${g.bagCount} 件戰利品將自動售出 ${g.bagValue} 金幣；剩餘 ${g.rings} 個圈圈將清除，不退費。${g.active?'飛行中的圈圈會取消。':''}`;}dialog.showModal();$('keep-playing').focus();updateUI();
}
function cancelLeave(){session.cancelLeave();dialog.close();resetClock();updateUI();$('back-to-lobby').focus({preventScroll:true});}
function confirmLeave(){
 if(!session.confirmLeave())return;
 dialog.close();showLobby();history.replaceState({view:'lobby'},'','#lobby');window.scrollTo({top:0,behavior:'auto'});$('enter-machine').focus({preventScroll:true});
}
function drop(){if(session.game&&!document.hidden&&!session.leaveRequested){if(session.game instanceof FruitPinball)session.game.start();else if(!(session.game instanceof NightMarket))session.game.drop();updateUI();}}
function frame(ms:number){
 if(!previous)previous=ms;const delta=Math.min((ms-previous)/1000,.1);previous=ms;
 if(session.game&&!document.hidden&&!session.leaveRequested){
  accumulator+=delta;while(accumulator>=CONFIG.fixedStep){session.step();accumulator-=CONFIG.fixedStep;}
  renderGame();if(ms-lastUI>=100){updateUI();lastUI=ms;}
 }
 requestAnimationFrame(frame);
}
$('drop').addEventListener('click',drop);
$('auto-drop').addEventListener('click',()=>{if(session.game&&!document.hidden&&!session.leaveRequested){if(!(session.game instanceof FruitPinball)&&!(session.game instanceof NightMarket))session.game.setAutoDrop(!session.game.autoDrop);updateUI();}});
document.querySelectorAll<HTMLButtonElement>('[data-machine]').forEach(button=>button.addEventListener('click',()=>{void enterMachine(button.dataset.machine as MachineId);}));
$('back-to-lobby').addEventListener('click',requestLeave);
$('keep-playing').addEventListener('click',cancelLeave);$('confirm-leave').addEventListener('click',confirmLeave);
dialog.addEventListener('cancel',event=>{event.preventDefault();cancelLeave();});
window.addEventListener('keydown',event=>{
 if(event.code==='Space'&&session.game&&!session.leaveRequested&&!(event.target instanceof HTMLInputElement)&&!(event.target instanceof HTMLButtonElement)&&!(event.target instanceof HTMLElement&&event.target.tagName==='SUMMARY')){
  event.preventDefault();if(!event.repeat){if(session.game instanceof FruitPinball&&session.game.phase==='playing')plunger.startKeyboard();else drop();}
 }
});
window.addEventListener('keyup',event=>{if(event.code==='Space'&&session.game instanceof FruitPinball&&session.game.keyboardPull){event.preventDefault();plunger.releaseKeyboard();}});
document.addEventListener('visibilitychange',resetClock);
window.addEventListener('popstate',()=>{
 if(session.game){
  // Restore a machine history entry while the user decides; never discard the
  // active board merely because the browser Back button was pressed.
  history.pushState({view:'machine',id:session.machineId},'',`#machine/${session.machineId}`);requestLeave();
 }else{history.replaceState({view:'lobby'},'','#lobby');showLobby();}
});
for(let i=0;i<SLOT_REWARDS.length;i++){
 const prize=SLOT_REWARDS[i],row=document.createElement('div');row.className='pay-row';
 const icon=document.createElement('span');icon.className='pay-icon';icon.style.backgroundPosition=`${i%3*50}% ${Math.floor(i/3)*50}%`;
 const text=document.createElement('span');text.textContent=`${prize.symbol} ×3`;
 const amount=document.createElement('b');amount.textContent=`${prize.amount} 顆`;
 const chance=document.createElement('small');chance.textContent=`${prize.weight/10}%`;row.append(icon,text,amount,chance);$('slot-paytable').append(row);
}
const machine=MACHINES[0];$('machine-card-name').textContent=machine.name;$('machine-card-description').textContent=machine.description;$<HTMLImageElement>('machine-preview').src=new URL(`./assets/${machine.image}`,document.baseURI).href;
for(let tier=0;tier<3;tier++){
 const c=SKY_TIERS[tier],section=document.createElement('section'),heading=document.createElement('h3');heading.textContent=c.name;section.append(heading);
 const grouped=new Map<number,number>();for(let i=0;i<8;i++)grouped.set(c.rewards[i],(grouped.get(c.rewards[i])??0)+c.weights[i]);
 for(const [amount,weight] of [...grouped].sort((a,b)=>a[0]-b[0])){const row=document.createElement('p');row.textContent=`${amount===0?'翅膀升階':`${amount} 精華`} · ${weight/100}%`;section.append(row);}
 $('sky-paytable').append(section);
}
history.replaceState({view:'lobby'},'','#lobby');showLobby();requestAnimationFrame(frame);

for(const recipe of FRUIT_RECIPES){const row=document.createElement('li');row.id=`fruit-recipe-${recipe.id}`;$('fruit-recipes').append(row);}
for(const cell of FRUIT_CELLS){const p=document.createElement('p');p.textContent=`第 ${String(cell.id+1).padStart(2,'0')} 格 · ${cell.fruits.map(f=>FRUIT_NAMES[f]).join('、')} · 參考 ${(cell.weight/100).toFixed(2)}%`;$('fruit-odds').append(p);}

for(let n=3;n<=15;n++){const p=document.createElement('p');p.id=`fruit-payout-${n}`;p.textContent=`${n} 組合：${FRUIT_PAYOUTS[n].toLocaleString()} 金幣（${FRUIT_PAYOUTS[n]/FRUIT_COST}×）`;$('fruit-payout-table').append(p);}
