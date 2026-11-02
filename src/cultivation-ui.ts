import {Cultivation} from './cultivation-game.ts';
import {CULTIVATION as C,REALMS,SKILL_NAMES,UPGRADE_NAMES,skillStats,manaCost,type Skill,type Upgrade} from './cultivation-rules.ts';
import {bindCultivationMovement} from './cultivation-input.ts';
import './cultivation.css';
const $=(id:string)=>document.getElementById(id)!;
const BUFF_NAMES:Record<string,string>={fury:'赤焰增傷',haste:'御風急速',guard:'金剛護體',renew:'靈泉回春',conserve:'節氣省魔'};
export function upgradeDescription(g:Cultivation,u:Upgrade){if(u==='sword'||u==='fire'||u==='thunder'){const s=skillStats(u,g.skills[u]+1,g.level,g.minute,g.upgrades.power,g.buffsNow);return `Lv.${g.skills[u]+1} · 傷害 ${Math.round(s.damage)} · 最多 ${s.cap} 目標 · ${manaCost(s.damage,1)}～${manaCost(s.damage,s.cap)} 法力／次`;}return {power:'傷害提升12%，施法法力隨傷害提高',vitality:'生命上限＋35，同時恢復35生命',guard:'承受傷害降低10%，最多四重',regen:'每秒自然恢復0.45生命，最多三重',boots:'移動速度＋18，更容易收集酒罈與閃避',heal:'立即恢復全部生命；不補充法力'}[u];}
export function initCultivationUI(get:()=>Cultivation|null,blocked:()=>boolean,refresh:()=>void){
 const shopBalance=document.createElement('p');shopBalance.id='cult-shop-balance';$('cult-description').after(shopBalance);
 let signature='',sound=true,audio:AudioContext|undefined,lastLevel=1,lastPhase='',lastKills=0;
 function unlock(){try{if(sound&&typeof AudioContext!=='undefined'){audio??=new AudioContext();void audio.resume();}}catch{}}
 function tone(f:number,d=.15){if(!sound||!audio)return;try{const o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.value=f;v.gain.setValueAtTime(.04,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(v).connect(audio.destination);o.start();o.stop(audio.currentTime+d);}catch{}}
 const act=(id:string,f:(g:Cultivation)=>void)=>$(id).addEventListener('click',()=>{const g=get();if(!g||blocked())return;unlock();f(g);refresh();});
 act('cult-shop-hud',g=>{cancel();g.openShop();});act('cult-pause-hud',g=>{cancel();g.pause();});
 act('cult-primary',g=>{cancel();if(['ready','dead','victory'].includes(g.phase)){g.start();tone(660);}else if(g.phase==='shop')g.closeShop();else if(g.phase==='paused')g.pause();else if(g.phase==='bonus-intro'){g.beginBonus();tone(110,.5);}});
 act('cult-secondary',g=>{cancel();g.openShop();});
 $('cult-sound').addEventListener('click',()=>{sound=!sound;if(sound)unlock();$('cult-sound').textContent=`音效：${sound?'開':'關'}`;$('cult-sound').setAttribute('aria-pressed',String(sound));});
 const pad=$('cult-joystick'),movement=bindCultivationMovement(pad,get,blocked,unlock);
 function cancel(){movement.cancel();}
 window.addEventListener('keydown',e=>{const g=get();if(!g||blocked()||e.ctrlKey||e.altKey||e.metaKey||e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;const k=e.key.toLowerCase();if((k==='p'||k==='escape')&&!e.repeat){if(g.phase==='shop')g.closeShop();else g.pause();cancel();refresh();}});
 function update(g:Cultivation){
  const locked=blocked()||g.sessionConflict;shopBalance.hidden=g.phase!=='shop';shopBalance.textContent=`共用金幣 ${g.gold.toLocaleString()} · 目前 ${g.mana.toLocaleString()} 法力`;if(g.kills<lastKills)lastKills=0;$('cult-realm').textContent=`${REALMS[Math.min(5,Math.floor((g.level-1)/5))]} · Lv.${g.level}`;
  const inBonus=g.normalCleared&&g.dragons>=5;const remaining=inBonus?Math.max(0,120-g.bonusTime):g.time;const secs=Math.floor(remaining);$('cult-time').textContent=g.phase==='bonus-intro'?'龍王劫待命':inBonus?`龍王劫 ${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`:`${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')} / 15:00`;
  $('cult-hp').textContent=`${Math.max(0,Math.ceil(g.player.hp))} / ${g.player.maxHp}`;const hp=$('cult-hp-meter') as HTMLMeterElement;hp.max=g.player.maxHp;hp.low=g.player.maxHp*.25;hp.high=g.player.maxHp*.6;hp.optimum=g.player.maxHp;hp.value=Math.max(0,g.player.hp);($('cult-mana-meter') as HTMLMeterElement).value=g.mana;$('cult-mana').textContent=`${g.mana.toLocaleString()} / 2,000`;
  $('cult-xp').textContent=g.level>=30?'境界已滿 · Lv.30':`修為 ${g.xp} · 擊殺 ${g.kills}`;$('cult-pearl').textContent=`龍珠 ${'●'.repeat(g.dragons)}${'○'.repeat(5-g.dragons)}`;
  $('cult-message').textContent=g.message;$('cult-gold').textContent=g.gold.toLocaleString();$('cult-earned').textContent=`${(g.roundPointsMilli/1000).toFixed(1)} 分`;$('cult-round').textContent=`本局消耗 ${(g.spentMana/10).toFixed(1)} 金幣等值法力 · 已入帳 ${g.roundGold} 金幣 · 餘分 ${g.points.toFixed(3)}`;
  $('cult-buffs').textContent=g.buffsNow.length?g.buffsNow.map(b=>`${BUFF_NAMES[b]} ${Math.ceil(g.buffs[b]-g.clock)}s`).join(' · '):'御劍斬妖，酒罈藏有靈酒與龍珠。';
  $('cult-storage').textContent=g.storageFailed?'瀏覽器目前無法保存，剩餘法力及積分僅本次有效。':'剩餘法力與積分尾數保存在目前瀏覽器，離場不會清除。';
  $('cult-skills').innerHTML=(['sword','fire','thunder'] as Skill[]).map(skill=>{const rank=g.skills[skill];if(!rank)return `<p class="cult-skill">${SKILL_NAMES[skill]} <small>尚未領悟</small></p>`;const s=skillStats(skill,rank,g.level,g.minute,g.upgrades.power,g.buffsNow),discount=g.buffsNow.includes('conserve');return `<p class="cult-skill"><b>${SKILL_NAMES[skill]} Lv.${rank}</b><small>傷害 ${Math.round(s.damage)} · ${s.cooldown.toFixed(2)}秒／次<br>最多${s.cap}目標 · ${manaCost(s.damage,1,discount)}～${manaCost(s.damage,s.cap,discount)}法力／次</small></p>`;}).join('');
  $('cult-jar-notice').textContent=g.jar?`${['左上','右上','左下','右下'][g.jar.corner]}靈酒罈 · ${Math.ceil(g.jar.expires-g.time)}秒 · 靠近擊破`:'';
  const overlay=$('cult-overlay');overlay.dataset.phase=g.phase;overlay.hidden=g.active;$('cult-shop-hud').dataset.low=String(g.mana<20);pad.hidden=!g.active;($('cult-shop-hud') as HTMLButtonElement).disabled=locked||g.phase==='upgrade';($('cult-pause-hud') as HTMLButtonElement).disabled=locked||!['playing','bonus','paused'].includes(g.phase);
  const sig=[g.phase,g.level,g.sessionConflict,...g.choices].join(':');
  if(signature!==sig){signature=sig;const titles:Record<string,string>={ready:'一劍入世，萬妖成劫',upgrade:'突破境界 · 三選一',shop:'靈石換法力',paused:'凝神休息',dead:'道途未竟',victory:g.bonusCleared?'龍王劫破！':'試煉通關！','bonus-intro':'五龍珠齊 · 龍王現世'};$('cult-title').textContent=titles[g.phase]??'';
   $('cult-description').textContent=g.sessionConflict?g.message:g.phase==='ready'?'十五分鐘修仙生存。移動走位、自動施法，先準備法力。':g.phase==='upgrade'?'選擇一項強化；傷害和命中目標增加時，施法成本也會提高。':g.phase==='shop'?'1金幣＝10法力，上限2,000；只扣實際購買額，沒有自動扣款。':g.phase==='paused'?'戰鬥與倒數已暫停。':g.phase==='bonus-intro'?`正常通關${C.clearGold}金幣已入帳！擊敗追加龍王再得${C.bonusGold}金幣，失敗不收回原獎金。`:['dead','victory'].includes(g.phase)?`${g.message}\n擊殺 ${g.kills} · 消耗 ${(g.spentMana/10).toFixed(1)} 金幣等值法力\n本局入帳 ${g.roundGold} 金幣 · 剩餘 ${g.mana} 法力保留`:g.message;
   const choices=$('cult-choices');choices.replaceChildren();if(g.phase==='upgrade')for(const u of g.choices){const b=document.createElement('button');b.type='button';b.innerHTML=`<b>${UPGRADE_NAMES[u]}</b><small>${upgradeDescription(g,u)}</small>`;b.onclick=()=>{if(blocked())return;cancel();g.choose(u);tone(880);refresh();};choices.append(b);}
   const shop=$('cult-buy-options');shop.replaceChildren();if(g.phase==='shop')for(const amount of [10,50,100,200]){const b=document.createElement('button');b.type='button';b.dataset.amount=String(amount);b.onclick=()=>{if(blocked())return;g.buy(amount);tone(520);refresh();};shop.append(b);}
   const primary=$('cult-primary') as HTMLButtonElement;primary.hidden=g.phase==='upgrade';primary.textContent=g.phase==='shop'?'返回試煉':g.phase==='paused'?'繼續修煉':g.phase==='bonus-intro'?'迎戰龍王':g.phase==='ready'?'開始試煉':'重新修煉';$('cult-secondary').hidden=['shop','upgrade'].includes(g.phase);
  }
  for(const b of Array.from($('cult-buy-options').querySelectorAll<HTMLButtonElement>('button'))){const cost=g.purchaseQuote(Number(b.dataset.amount));b.textContent=`${Number(b.dataset.amount)===200?'補至上限':b.dataset.amount+'金幣方案'} · ${cost}金幣／${cost*10}法力`;b.disabled=locked||!cost;}
  ($('cult-primary') as HTMLButtonElement).disabled=locked||(['ready','dead','victory'].includes(g.phase)&&g.mana<2);for(const b of Array.from($('cult-choices').querySelectorAll<HTMLButtonElement>('button')))b.disabled=locked;
  if(lastLevel<g.level)tone(720,.3);if(lastPhase!==g.phase&&g.phase==='victory'){tone(880,.6);setTimeout(()=>tone(1100,.5),180);}if(g.kills>lastKills+4){tone(340,.045);lastKills=g.kills;}lastLevel=g.level;lastPhase=g.phase;
 }
 return {update,cancel};
}
