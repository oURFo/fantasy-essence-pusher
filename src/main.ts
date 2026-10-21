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
import './style.css';

const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
let storage:WalletStorage|undefined;
try{storage=window.localStorage;}catch{/* Browser storage can be disabled. */}
const wallet=new PlayerWallet(storage),session=new ArcadeSession(wallet);
let lastUI=0;
let accumulator=0,previous=0,entering=false,readyPromise:Promise<void>|undefined;
const dialog=$<HTMLDialogElement>('leave-dialog');
function resetClock(){accumulator=0;previous=0;}
function syncWallet(){
 const balance=wallet.gold.toLocaleString('en-US');
 $('gold-balance').textContent=balance;$('lobby-gold').textContent=balance;
}
function updateUI(){
 syncWallet();const game=session.game;if(!game)return;
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
 if(!readyPromise)readyPromise=Promise.all([RAPIER.init(),loadArtwork()]).then(()=>{}).catch(error=>{readyPromise=undefined;throw error;});
 await readyPromise;if(id==='sky-wings')await loadSkyArtwork();
}
function renderGame(){const game=session.game;if(game instanceof SkyWings)renderSky(game);else if(game)render(game);}
async function enterMachine(id:MachineId){
 if(entering||session.game)return;entering=true;
 const button=$<HTMLButtonElement>(id==='sky-wings'?'enter-sky':'enter-machine');
 const label=button.textContent;document.querySelectorAll<HTMLButtonElement>('[data-machine]').forEach(b=>b.disabled=true);button.textContent='正在準備機台…';$('lobby-error').textContent='';
 try{
  await ensureReady(id);if(!session.enter(id))return;
  $('lobby-screen').hidden=true;$('machine-screen').hidden=false;$('lobby-wallet').hidden=true;$('machine-nav').hidden=false;
  const machine=MACHINES.find(m=>m.id===id)!;const sky=id==='sky-wings';
  $('page-title').textContent=machine.name;$('page-subtitle').textContent=machine.description;document.title=`${machine.name} · 推珠冒險`;
  document.querySelectorAll<HTMLElement>('.vault-only').forEach(el=>el.hidden=sky);document.querySelectorAll<HTMLElement>('.sky-only').forEach(el=>el.hidden=!sky);
  $('front-rule').textContent='中央 1/2 計入獎勵，左右各 1/4 系統回收';
  $('leave-pending').textContent=sky?'尚未完成的輪盤、升階進度、待轉次數與未派出的精華獎勵也會清除。':'尚未完成的 SLOT、待轉次數與未派出的精華獎勵也會清除。';
  $<HTMLDetailsElement>('adventure-details').open=false;
  $('loading').style.display='none';resetClock();updateUI();renderGame();
  history.pushState({view:'machine',id},'',`#machine/${id}`);window.scrollTo({top:0,behavior:'auto'});$('back-to-lobby').focus({preventScroll:true});
 }catch(error){$('lobby-error').textContent='機台載入失敗，請稍後重試。';console.error(error);}
 finally{entering=false;document.querySelectorAll<HTMLButtonElement>('[data-machine]').forEach(b=>b.disabled=false);button.textContent=label;}
}
function requestLeave(){
 if(session.leaveRequested||!session.requestLeave())return;
 resetClock();dialog.showModal();$('keep-playing').focus();updateUI();
}
function cancelLeave(){session.cancelLeave();dialog.close();resetClock();updateUI();$('back-to-lobby').focus({preventScroll:true});}
function confirmLeave(){
 if(!session.confirmLeave())return;
 dialog.close();showLobby();history.replaceState({view:'lobby'},'','#lobby');window.scrollTo({top:0,behavior:'auto'});$('enter-machine').focus({preventScroll:true});
}
function drop(){if(session.game&&!document.hidden&&!session.leaveRequested){session.game.drop();updateUI();}}
function frame(ms:number){
 if(!previous)previous=ms;const delta=Math.min((ms-previous)/1000,.1);previous=ms;
 if(session.game&&!document.hidden&&!session.leaveRequested){
  accumulator+=delta;while(accumulator>=CONFIG.fixedStep){session.step();accumulator-=CONFIG.fixedStep;}
  renderGame();if(ms-lastUI>=100){updateUI();lastUI=ms;}
 }
 requestAnimationFrame(frame);
}
$('drop').addEventListener('click',drop);
$('auto-drop').addEventListener('click',()=>{if(session.game&&!document.hidden&&!session.leaveRequested){session.game.setAutoDrop(!session.game.autoDrop);updateUI();}});
document.querySelectorAll<HTMLButtonElement>('[data-machine]').forEach(button=>button.addEventListener('click',()=>{void enterMachine(button.dataset.machine as MachineId);}));
$('back-to-lobby').addEventListener('click',requestLeave);
$('keep-playing').addEventListener('click',cancelLeave);$('confirm-leave').addEventListener('click',confirmLeave);
dialog.addEventListener('cancel',event=>{event.preventDefault();cancelLeave();});
window.addEventListener('keydown',event=>{
 if(event.code==='Space'&&session.game&&!session.leaveRequested&&!(event.target instanceof HTMLInputElement)&&!(event.target instanceof HTMLButtonElement)&&!(event.target instanceof HTMLElement&&event.target.tagName==='SUMMARY')){
  event.preventDefault();if(!event.repeat)drop();
 }
});
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
