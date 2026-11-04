import type {WonderTrain} from './train-game.ts';
import {TRAIN_MISSIONS} from './train-rules.ts';
import './train.css';
export function initTrainUI(get:()=>WonderTrain|null,blocked:()=>boolean,refresh:()=>void){
 const panel=document.createElement('section');panel.id='train-panel';panel.hidden=true;panel.innerHTML=`<div class="train-top"><span>THE WONDER EXPRESS</span><h2>奇趣列車</h2><p id="train-message" role="status"></p></div><div class="train-numbers"><div>共用金幣<strong id="train-gold"></strong></div><div>已入帳積分<strong id="train-points"></strong></div></div><p id="train-pending"></p><fieldset class="train-bets"><legend>每發金幣</legend>${[1,2,3,4,5].map(n=>`<button type="button" data-train-bet="${n}" aria-pressed="${n===1}">${n}</button>`).join('')}</fieldset><label class="train-direction">發射方向<input id="train-angle" type="range" min="-75" max="75" value="0" step="1" aria-label="發射方向"></label><div class="train-actions"><button id="train-fire" type="button">發射 · 1 金幣</button><button id="train-auto" type="button" aria-pressed="false">開啟連射</button></div><p class="train-hint">點擊／點按場景直接發射 · 滑鼠移動瞄準 · 連射每秒2顆</p><h3>旅途任務 <small>離場重置</small></h3><div id="train-tasks"></div><details><summary>玩法與配獎</summary><p>物件由左往右移動。每次命中依本體與上方連帶總分抽選破壞；未破壞時，將該球投入積分的1/4累積為機率折減，獎勵原分不變；物件繞回左側仍保留紀錄。點選哪個物件就鎖定該層，彈珠以有深度的飛行抵達，不會被較低層物件攔截。成功後顯示得分並飛入計數器，約1.3秒後入帳。10積分自動換1金幣，尾數保留；離場結清已命中的待入帳獎勵，任務與未命中彈珠重置。</p><p>長期返還目標95%，包含任務與射空成本；實際結果受下注、射擊方向、物件選擇及任務完成度影響。機率按當次下注與總分計算，最高98%。高下注射低分物件會受到上限影響。</p></details>`;
 document.querySelector('#machine-screen aside')!.prepend(panel);
 const controls=document.createElement('div');controls.className='train-mobile-actions';controls.hidden=true;controls.id='train-mobile-actions';controls.innerHTML='<label>每發<select id="train-mobile-bet" aria-label="手機每發金幣"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label><button id="train-mobile-fire" type="button">發射</button><button id="train-mobile-auto" type="button" aria-pressed="false">連射：關</button>';document.getElementById('game')!.closest('.machine')!.after(controls);
 const el=(id:string)=>document.getElementById(id)!;let active=false;
 const can=()=>{const g=get();return g&&!blocked()&&!g.disposed?g:null;};
 const shoot=()=>{can()?.shoot();refresh();},auto=()=>{const g=can();if(g)g.setAuto(!g.auto);refresh();};
 for(const id of ['train-fire','train-mobile-fire'])el(id).addEventListener('click',shoot);
 for(const id of ['train-auto','train-mobile-auto'])el(id).addEventListener('click',auto);
 panel.querySelectorAll<HTMLButtonElement>('[data-train-bet]').forEach(b=>b.onclick=()=>{can()?.setBet(Number(b.dataset.trainBet));refresh();});
 el('train-mobile-bet').addEventListener('change',()=>{can()?.setBet(Number((el('train-mobile-bet') as HTMLSelectElement).value));refresh();});
 el('train-angle').addEventListener('input',()=>{const g=can();if(g)g.setDirection(-Math.PI/2+Number((el('train-angle') as HTMLInputElement).value)*Math.PI/180);});
 const canvas=el('game') as HTMLCanvasElement;
 const point=(e:PointerEvent)=>{const g=can();if(!g)return;const r=canvas.getBoundingClientRect();g.aim((e.clientX-r.left)/r.width*1024,(e.clientY-r.top)/r.height*900);};
 canvas.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0||!can())return;e.preventDefault();point(e);shoot();canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)point(e);});
 window.addEventListener('pagehide',()=>{get()?.settle();});
 return {cancel(){const g=get();if(g)g.setAuto(false);},show(value:boolean){active=value;panel.hidden=!value;controls.hidden=!value;},update(g:WonderTrain){if(!active)return;panel.dataset.celebrating=String(g.awards.some(a=>a.kind==='mission'&&g.time-a.at<1.3));el('train-gold').textContent=g.gold.toLocaleString();el('train-points').textContent=String(g.points);el('train-message').textContent=g.message;el('train-pending').textContent=`待入帳 ${g.pending}分 · 尾數 ${g.tail}/10 · 本次花費 ${g.spent} 金幣`;
  for(const id of ['train-fire','train-mobile-fire']){const b=el(id) as HTMLButtonElement;b.textContent=`發射 · ${g.bet} 金幣`;b.disabled=blocked()||g.gold<g.bet;}
  for(const id of ['train-auto','train-mobile-auto']){const b=el(id) as HTMLButtonElement;b.textContent=g.auto?'停止連射':'開啟連射';b.setAttribute('aria-pressed',String(g.auto));b.disabled=blocked()||g.gold<g.bet;}
  panel.querySelectorAll<HTMLButtonElement>('[data-train-bet]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.trainBet)===g.bet)));
  (el('train-mobile-bet') as HTMLSelectElement).value=String(g.bet);
  (el('train-angle') as HTMLInputElement).value=String(Math.round((g.angle+Math.PI/2)*180/Math.PI));
  el('train-tasks').innerHTML=g.tasks.map(t=>{const m=TRAIN_MISSIONS[t.template];return `<div class="train-task"><b>${m.label}</b><span>＋${m.reward}分</span><progress max="${m.count}" value="${t.progress}"></progress><small>${t.progress}/${m.count}</small></div>`;}).join('');
 }};
}
