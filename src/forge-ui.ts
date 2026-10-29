import {ThunderForge} from './forge-game.ts';
import {FORGE_ENERGY_RANGES,FORGE_ENERGY_PAYTABLES,FORGE_COST,FORGE_TIERS,FORGE_EVENTS,forgeTheory} from './forge-rules.ts';
export function initForgeUI(get:()=>ThunderForge|null,blocked:()=>boolean,update:()=>void){
 const el=(id:string)=>document.getElementById(id)!;let audio:AudioContext|undefined,lastResult:ThunderForge['result']=null,lastCue=-1,impactPlayed=false;
 function tone(freq:number,duration:number,type:OscillatorType='sine',gain=.05){const g=get();if(!g?.sound||!audio)return;const o=audio.createOscillator(),v=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(25,freq*.45),audio.currentTime+duration);v.gain.setValueAtTime(gain,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(v).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}
 function unlock(){audio??=new AudioContext();void audio.resume();}
 for(const id of ['forge-play','forge-cabinet-play'])el(id).addEventListener('click',()=>{if(blocked())return;unlock();get()?.drop();update();});
 el('forge-auto').addEventListener('click',()=>{if(blocked())return;unlock();const g=get();g?.setAutoDrop(!g.autoDrop);update();});
 el('forge-sound').addEventListener('click',()=>{unlock();const g=get();if(g)g.sound=!g.sound;update();});
 const rows=FORGE_ENERGY_PAYTABLES.map((table,i)=>`<h3>${i} 格雷電</h3><div class="forge-odds">${table.map(p=>`<div><span>${p.payout} 金幣</span><span>${p.weight/100}%</span></div>`).join('')}</div>`).join('');
 el('forge-ladder').innerHTML=FORGE_ENERGY_RANGES.map(([lo,hi],i)=>`<div id="forge-level-${i}">${i} 格雷電<b>${i===10?'自動鍛造固定1500':`鍛造 ${lo}～${hi} 金幣`}</b></div>`).join('');
 el('forge-paytable').innerHTML=`<h3>每次投入事件</h3><div class="forge-odds">${FORGE_EVENTS.map(e=>`<div><span>${e.kind==='slag'?'礦渣':e.kind==='energy'?'能量＋1':e.kind==='forge'?'觸發鍛造':`${e.payout} 金幣`}</span><span>${e.weight/100}%</span></div>`).join('')}</div>${rows}<p>長期理論 RTP ${(forgeTheory().rtp*100).toFixed(5)}%。包含能量累積與全部鍛造獎勵；不是單次或短期回報保證。</p>`;
 const grip=el('forge-plunger');let pointer:number|null=null,startY=0;
 const cancel=()=>{pointer=null;get()?.cancelPull();};
 grip.addEventListener('pointerdown',event=>{const e=event as PointerEvent;if(blocked()||pointer!==null||e.isPrimary===false||e.button!==0)return;const g=get();if(!g?.beginPull())return;e.preventDefault();unlock();pointer=e.pointerId;startY=e.clientY;grip.setPointerCapture(pointer);update();});
 grip.addEventListener('pointermove',event=>{const e=event as PointerEvent;if(e.pointerId!==pointer)return;if(blocked()){cancel();update();return;}get()?.movePull((e.clientY-startY)/100);update();});
 grip.addEventListener('pointerup',event=>{const e=event as PointerEvent;if(e.pointerId!==pointer)return;pointer=null;if(blocked())get()?.cancelPull();else get()?.releasePull();update();});
 for(const name of ['pointercancel','lostpointercapture'])grip.addEventListener(name,event=>{if((event as PointerEvent).pointerId===pointer){cancel();update();}});
 grip.addEventListener('keydown',event=>{const e=event as KeyboardEvent;if(blocked())return;const g=get();if(!g)return;if(e.key==='Escape'){cancel();update();return;}if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();g.setPower(g.power+(e.key==='ArrowDown'?.05:-.05));update();}if((e.key===' '||e.key==='Enter')&&!e.repeat&&!g.pulling){e.preventDefault();unlock();g.beginPull();g.movePull(g.power);update();}});
 grip.addEventListener('keyup',event=>{const e=event as KeyboardEvent;if(e.key===' '||e.key==='Enter'){e.preventDefault();if(blocked())cancel();else get()?.releasePull();update();}});
 el('forge-power').addEventListener('input',()=>{get()?.setPower(Number((el('forge-power') as HTMLInputElement).value)/100);update();});
 window.addEventListener('blur',()=>{cancel();update();});
 return {cancel,update(g:ThunderForge){const locked=blocked()||g.inputLocked;const r=g.result;
  for(const id of ['forge-play','forge-cabinet-play']){(el(id) as HTMLButtonElement).disabled=locked||g.gold<FORGE_COST;el(id).textContent=g.phase==='forging'?'雷鎚鍛造中…':g.phase==='returning'?'力道不足 · 未扣款':g.phase==='feed'?(g.impactElapsed<0?'鋼珠彈跳中…':'入洞結算中…'):'發射鋼珠 · 5 金幣';}
  el('forge-cabinet-play').hidden=true;
  grip.hidden=g.phase==='forging';(grip as HTMLButtonElement).disabled=locked||g.gold<FORGE_COST;
  grip.style.setProperty('--pull',String(g.pulling?g.pull:0));grip.setAttribute('aria-label',`向下拉把手蓄力，放開發射；目前力道 ${Math.round((g.pulling?g.pull:g.power)*100)}%，每球5金幣`);
  (el('forge-power') as HTMLInputElement).value=String(Math.round(g.power*100));el('forge-power-label').textContent=`發射力道 ${Math.round((g.pulling?g.pull:g.power)*100)}%`;
  (el('forge-auto') as HTMLButtonElement).disabled=blocked()||(!g.autoDrop&&g.gold<FORGE_COST);el('forge-auto').textContent=g.autoDrop?'停止自動投入':'開啟自動投入';el('forge-auto').setAttribute('aria-pressed',String(g.autoDrop));
  const shown=g.displayEnergy;
  for(let i=0;i<11;i++)el(`forge-level-${i}`).setAttribute('data-current',String(i===shown));
  el('forge-energy').textContent=`${shown} / 10`;el('forge-tier').textContent=FORGE_TIERS[shown>=10?3:shown>=6?2:shown>=3?1:0];
  const hiddenPayout=r&&(g.phase==='feed'||g.phase==='forging')&&((r.kind==='forge'||r.full)?g.popupElapsed<g.revealAt:g.impactElapsed<0)?r.payout:0;
  el('gold-balance').textContent=(g.gold-hiddenPayout).toLocaleString('en-US');
  el('forge-message').textContent=g.message;el('forge-session').textContent=`本次投入 ${g.spent} · 獲得 ${g.won-hiddenPayout} 金幣`;
  el('forge-last').textContent=g.phase==='feed'&&g.impactElapsed<0?'看鋼珠落入哪個洞口 · 金幣／雷電／鍛造':(r?.kind==='forge'||r?.full)?`本次鍛造：${FORGE_TIERS[r.tier]} · ${g.phase!=='idle'&&g.popupElapsed<g.revealAt?'等待出爐':`${r.payout} 金幣`}`:'雷電口逐格充能 · 中央鍛造口啟動彈出舞台';
  el('forge-storage').textContent=g.storageFailed?'瀏覽器無法保存進度，目前僅本次遊玩有效。':'能量與等級保存在目前瀏覽器，離場保留。';el('forge-sound').textContent=`音效：${g.sound?'開':'關'}`;el('forge-sound').setAttribute('aria-pressed',String(g.sound));
  if(r&&lastResult!==r){lastResult=r;lastCue=-1;impactPlayed=false;if(g.phase!=='idle')tone(220,.13);}
  if(r&&(g.phase==='feed'||g.phase==='forging')&&g.impactElapsed>=0&&!impactPlayed){impactPlayed=true;const n=r.energyAfter;if(r.kind==='energy'){tone(360+n*60,.25+n*.035,'sine',.035+n*.005);if(n>=4)tone(95+n*8,.6+n*.06,'triangle',.03);if(n>=7)tone(800+n*50,1,'sine',.03);}else tone(r.kind==='slag'?100:620,.3);}
  if(g.phase==='forging'){const cue=[1.35,1.95,2.55,g.revealAt].filter(t=>g.popupElapsed>=t).length;if(cue>lastCue){lastCue=cue;if(cue>0)tone(cue===4?880:85,cue===4?.7:.35,cue===4?'sine':'triangle',.06+r!.tier*.025);}}
 }};
}
