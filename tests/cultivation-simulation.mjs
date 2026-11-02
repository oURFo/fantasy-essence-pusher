import {Cultivation} from '../src/cultivation-game.ts';
import {PlayerWallet} from '../src/wallet.ts';
import {seeded,CULTIVATION as C} from '../src/cultivation-rules.ts';
export function simulate(seed,policy='normal',dt=1/60){
 const w=new PlayerWallet();w.setBalance(1000000);const g=new Cultivation(w,undefined,seeded(seed));g.buy(200);g.start();let ticks=0;
 while(!['victory','dead'].includes(g.phase)&&ticks++<Math.ceil(1200/dt)+100){
  if(g.phase==='upgrade'){
   const p=g.player.hp/g.player.maxHp;const priority=g.choices.map(u=>({u,score:u==='heal'?(p<.35?100:0):u==='regen'?(p<.8?85:50):u==='fire'?(g.skills.fire===0?95:65):u==='thunder'?(g.skills.thunder===0?90:60):u==='sword'?70:u==='power'?55:u==='guard'?45:u==='vitality'?40:30})).sort((a,b)=>b.score-a.score);g.choose(priority[0].u);continue;
  }
  if(g.phase==='bonus-intro'){g.beginBonus();continue;}
  if(g.mana<100){g.openShop();g.buy(200);g.closeShop();}
  let tx=512+Math.cos(g.time*.017)*260,ty=450+Math.sin(g.time*.017)*230;
  const collect=policy==='expert'||policy==='normal'&&(g.jar&&Math.floor((g.jar.expires-45)/40)%3!==0);
  if(g.jar&&collect){tx=g.jar.x;ty=g.jar.y;}
  let dx=tx-g.player.x,dy=ty-g.player.y,dist=Math.hypot(dx,dy);if(dist>12){dx/=dist;dy/=dist;}else{dx=0;dy=0;}
  if(policy==='beginner'){dx=Math.cos(g.time*.01)*.25;dy=Math.sin(g.time*.01)*.25;}
  else {
   for(const h of g.hazards){if(h.at-g.clock<.9&&Math.hypot(g.player.x-h.x,g.player.y-h.y)<h.radius+35){let ax=g.player.x-h.x,ay=g.player.y-h.y;if(Math.hypot(ax,ay)<5){ax=512-g.player.x;ay=450-g.player.y;}const d=Math.hypot(ax,ay)||1;dx+=ax/d*3;dy+=ay/d*3;}}
   for(const e of g.enemies){const x=g.player.x-e.x,y=g.player.y-e.y,d=Math.hypot(x,y);if(d<e.radius+65){dx+=x/(d||1)*(e.radius+65-d)/30;dy+=y/(d||1)*(e.radius+65-d)/30;}}
  }
  g.move(dx,dy);g.step(dt);
 }
 return {seed,policy,phase:g.phase,time:g.time,bonusTime:g.bonusTime,spent:g.spentMana/10,points:g.roundPointsMilli/10000,units:g.bountyUnits,bonuses:(g.normalCleared?C.clearGold:0)+(g.bonusCleared?C.bonusGold:0),clear:g.normalCleared,bonus:g.bonusCleared,jars:g.jarsBroken,dragons:g.dragons,kills:g.kills,level:g.level,hp:g.player.hp};
}
if(process.argv[1]?.endsWith('cultivation-simulation.mjs')){const n=Number(process.argv[2]||12),rows=Array.from({length:n},(_,i)=>simulate(i+1));const sum=k=>rows.reduce((n,r)=>n+Number(r[k]),0);console.log(JSON.stringify({rows,aggregate:{cost:sum('spent'),units:sum('units'),bonus:sum('bonuses'),rtp:(sum('points')+sum('bonuses'))/sum('spent'),neededRate:(.95*sum('spent')-sum('bonuses'))/sum('units')*10}},null,2));}
