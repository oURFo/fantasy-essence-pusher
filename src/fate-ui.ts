import {FateOrbit} from './fate-game.ts';
import {FATE_LEVELS} from './fate-rules.ts';
export function initFateUI(getGame:()=>FateOrbit|null,blocked:()=>boolean,changed:()=>void){
 const $=(id:string)=>document.getElementById(id)!;let audio:AudioContext|undefined,enabled=true,lastPhase='',lastPhaseAt=-1;
 function unlock(){if(!enabled)return;try{audio??=new AudioContext();void audio.resume();}catch{}}
 function sound(kind:string){if(!enabled||!audio||audio.state!=='running')return;const frequencies=kind==='portal'?[392,523,659,784]:kind==='transfer'?[659,880,1047]:kind==='jackpot'?[523,659,784,1047,1319]:kind==='result'?[523,659]:[220];frequencies.forEach((freq,i)=>{const oscillator=audio!.createOscillator(),gain=audio!.createGain(),start=audio!.currentTime+i*.1;oscillator.type='sine';oscillator.frequency.value=freq;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.045,start+.015);gain.gain.exponentialRampToValueAtTime(.0001,start+.22);oscillator.connect(gain);gain.connect(audio!.destination);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};oscillator.start(start);oscillator.stop(start+.24);});}
 $('fate-fire').addEventListener('click',()=>{if(!blocked()){unlock();getGame()?.shoot();changed();}});
 for(const [id,delta] of [['fate-left',-3],['fate-right',3]] as const)$(id).addEventListener('click',()=>{const g=getGame();if(g&&!blocked()&&!g.inputLocked){g.angle=Math.max(-55,Math.min(55,g.angle+delta));changed();}});
 $('fate-redeem').addEventListener('click',()=>{if(!blocked()){getGame()?.redeem();changed();}});
 $('fate-sound').addEventListener('click',()=>{enabled=!enabled;if(enabled)unlock();$('fate-sound').textContent=`音效：${enabled?'開':'關'}`;$('fate-sound').setAttribute('aria-pressed',String(enabled));});
 $('fate-return-board').addEventListener('click',()=>document.getElementById('game')!.scrollIntoView({behavior:'smooth',block:'center'}));
 for(const [i,c] of FATE_LEVELS.entries()){const p=document.createElement('p');p.textContent=`第 ${i+1} 層：1 紅 ${c.holes-1} 白 · 白洞 ${c.min}～${c.max} 積分`;$('fate-paytable').append(p);}
 return{unlock,update(g:FateOrbit){
  $('fate-points').textContent=g.points.toLocaleString();$('fate-exchange').textContent=String(g.exchangeGold);$('fate-tail').textContent=`兌換後保留 ${g.points%10} 積分`;($('fate-redeem') as HTMLButtonElement).disabled=blocked()||g.exchangeGold===0;
  ($('fate-fire') as HTMLButtonElement).disabled=blocked()||!g.canShoot;($('fate-left') as HTMLButtonElement).disabled=blocked()||g.inputLocked;($('fate-right') as HTMLButtonElement).disabled=blocked()||g.inputLocked;
  ($('fate-aim-zone') as HTMLButtonElement).disabled=blocked()||!g.canShoot;$('fate-fire').textContent=g.inputLocked?'本球進行中':'射出星珠 · 3 金幣';$('fate-message').textContent=g.message;$('fate-phase').textContent=g.phase==='disc'?`第 ${g.level+1} 層 · 保底 ${g.minimum} 積分`:g.phase==='portal'?'命運之門開啟':g.phase==='transfer'?'紅洞晉級，轉入下一層':g.phase==='result'?'本球結算完成':'四層星盤待機';$('fate-return-board').hidden=g.inputLocked||g.phase==='idle';
  if(g.phase!==lastPhase||g.phaseAt!==lastPhaseAt){lastPhase=g.phase;lastPhaseAt=g.phaseAt;sound(g.lastAward===9999&&g.phase==='result'?'jackpot':g.phase);if(g.phase==='portal'&&window.matchMedia('(max-width:760px)').matches)$('fate-disc-canvas').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});}
 }};
}
