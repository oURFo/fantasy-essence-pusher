import {FateOrbit} from './fate-game.ts';
import {FATE_LEVELS} from './fate-rules.ts';
export function initFateUI(getGame:()=>FateOrbit|null,blocked:()=>boolean,changed:()=>void){
 const $=(id:string)=>document.getElementById(id)!;let audio:AudioContext|undefined,enabled=true,lastEvent=-1,lastNotice=0,currentGame:FateOrbit|null=null;
 function unlock(){if(!enabled)return;try{audio??=new AudioContext();void audio.resume();}catch{}}
 function sound(kind:string){if(kind==='idle')return;if(!enabled||!audio||audio.state!=='running')return;const frequencies=kind==='portal'?[392,523,659,784]:kind==='transfer'?[659,880,1047]:kind==='jackpot'?[523,659,784,1047,1319]:kind==='result'?[523,659]:[220];frequencies.forEach((freq,i)=>{const oscillator=audio!.createOscillator(),gain=audio!.createGain(),start=audio!.currentTime+i*.1;oscillator.type='sine';oscillator.frequency.value=freq;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.045,start+.015);gain.gain.exponentialRampToValueAtTime(.0001,start+.22);oscillator.connect(gain);gain.connect(audio!.destination);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};oscillator.start(start);oscillator.stop(start+.24);});}
 for(const id of ['fate-fire','fate-cannon-fire'])$(id).addEventListener('click',()=>{if(!blocked()){unlock();getGame()?.shoot();changed();}});
 for(const [id,delta] of [['fate-left',-3],['fate-right',3]] as const)$(id).addEventListener('click',()=>{const g=getGame();if(g&&!blocked()&&!g.inputLocked){g.angle=Math.max(-55,Math.min(55,g.angle+delta));changed();}});
 $('fate-auto').addEventListener('click',()=>{if(!blocked()){unlock();getGame()?.toggleAutoFire();changed();}});
 $('fate-redeem').addEventListener('click',()=>{if(!blocked()){getGame()?.redeem();changed();}});
 $('fate-sound').addEventListener('click',()=>{enabled=!enabled;if(enabled)unlock();$('fate-sound').textContent=`音效：${enabled?'開':'關'}`;$('fate-sound').setAttribute('aria-pressed',String(enabled));});
 $('fate-return-board').addEventListener('click',()=>document.getElementById('game')!.scrollIntoView({behavior:'smooth',block:'center'}));
 for(const [i,c] of FATE_LEVELS.entries()){const p=document.createElement('p');p.textContent=`第 ${i+1} 層：1 紅 ${c.holes-1} 白 · 白洞 ${c.min}～${c.max} 積分`;$('fate-paytable').append(p);}
 return{unlock,update(g:FateOrbit){if(g!==currentGame){currentGame=g;lastEvent=-1;lastNotice=0;}
  $('fate-auto').textContent=`自動發射：${g.autoFire?'開':'關'}`;$('fate-auto').setAttribute('aria-pressed',String(g.autoFire));($('fate-auto') as HTMLButtonElement).disabled=blocked()||g.inputLocked||(!g.autoFire&&g.gold<3);
  $('fate-points').textContent=g.points.toLocaleString();$('fate-exchange').textContent=String(g.exchangeGold);$('fate-tail').textContent=`兌換後保留 ${g.points%10} 積分`;($('fate-redeem') as HTMLButtonElement).disabled=blocked()||g.exchangeGold===0;
  for(const id of ['fate-fire','fate-cannon-fire'])($(id) as HTMLButtonElement).disabled=blocked()||!g.canShoot;($('fate-left') as HTMLButtonElement).disabled=blocked()||g.inputLocked;($('fate-right') as HTMLButtonElement).disabled=blocked()||g.inputLocked;
  ($('fate-aim-zone') as HTMLButtonElement).disabled=blocked()||g.inputLocked;$('fate-fire').textContent=g.gold<3?'金幣不足':'發射 · 3 金幣';$('fate-message').textContent=g.grandNotice?'天命大獎！9,999 積分！':g.message;$('fate-phase').textContent=`場上 ${g.runs.length} 顆 · `+(g.phase==='disc'?`第 ${g.level+1} 層 · 保底 ${g.minimum} 積分`:g.phase==='portal'?'命運之門開啟':g.phase==='transfer'?'紅洞晉級，轉入下一層':g.phase==='drain'?'星珠入洞中':g.phase==='result'?'本球結算完成':g.phase==='shooting'?'障礙區運作中':'四層星盤待機');$('fate-return-board').hidden=g.runs.length===0;
  const notices=g.notices.filter(n=>n.id>lastNotice);if(notices.length){lastNotice=Math.max(...notices.map(n=>n.id));sound(notices.some(n=>n.award===9999)?'jackpot':'result');lastEvent=g.eventId;}else if(g.eventId!==lastEvent){lastEvent=g.eventId;sound(g.eventKind);}

 }};
}
