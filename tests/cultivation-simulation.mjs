import {Cultivation} from '../src/cultivation-game.ts';
import {PlayerWallet} from '../src/wallet.ts';
import {seeded,CULTIVATION as C,isSkill,SKILLS} from '../src/cultivation-rules.ts';
export function simulate(seed,policy='normal',dt=1/60){
 const w=new PlayerWallet();w.setBalance(1000000);const g=new Cultivation(w,undefined,seeded(seed));g.buy(200);g.start();let ticks=0,steerAt=0,steer={x:1,y:0};
 while(!['victory','dead'].includes(g.phase)&&ticks++<Math.ceil(1200/dt)+100){
  if(g.phase==='upgrade'){
   const p=g.player.hp/g.player.maxHp;const priority=g.choices.map(u=>({u,score:u==='heal'?(p<.35?100:0):u==='regen'?(p<.8?85:50):isSkill(u)?(g.skills[u]>0?75:68):u==='power'?55:u==='guard'?45:u==='vitality'?40:30})).sort((a,b)=>b.score-a.score);g.choose(priority[0].u);continue;
  }
  if(g.phase==='bonus-intro'){g.beginBonus();continue;}
  if(g.phase==='shop'){g.buy(200);g.closeShop();continue;}
  if(g.mana<100){g.openShop();g.buy(200);g.closeShop();}
  let tx=g.player.x+Math.cos(g.time*.006)*600,ty=g.player.y+Math.sin(g.time*.006)*600;
  const collect=policy==='expert'||policy==='normal'&&(g.jar&&Math.floor((g.jar.expires-45)/40)%3!==0);
  const loot=g.xpOrbs.filter(o=>!o.attracting&&Math.hypot(o.x-g.player.x,o.y-g.player.y)<650).sort((a,b)=>(Math.hypot(a.x-g.player.x,a.y-g.player.y)/Math.sqrt(a.value))-(Math.hypot(b.x-g.player.x,b.y-g.player.y)/Math.sqrt(b.value)))[0];if(policy!=='idle'&&policy!=='beginner'&&loot){tx=loot.x;ty=loot.y;}
  if(g.jar&&collect){tx=g.jar.x;ty=g.jar.y;}
  const boss=g.enemies.find(e=>e.boss);if(policy==='expert'&&boss&&(!g.jar||boss.boss==='final'||boss.boss==='dragon')){const d=Math.hypot(boss.x-g.player.x,boss.y-g.player.y);const a=Math.atan2(g.player.y-boss.y,g.player.x-boss.x)+.5;tx=boss.x+Math.cos(a)*230;ty=boss.y+Math.sin(a)*230;if(d>550){tx=boss.x;ty=boss.y;}}
  let dx=tx-g.player.x,dy=ty-g.player.y,dist=Math.hypot(dx,dy);if(dist>12){dx/=dist;dy/=dist;}else{dx=0;dy=0;}
  if(policy==='idle'){dx=0;dy=0;}else if(policy==='beginner'){dx=Math.cos(g.time*.01)*.25;dy=Math.sin(g.time*.01)*.25;}
  else {
   for(const h of g.hazards){if(h.at-g.clock<.9&&Math.hypot(g.player.x-h.x,g.player.y-h.y)<h.radius+35){let ax=g.player.x-h.x,ay=g.player.y-h.y;if(Math.hypot(ax,ay)<5){ax=512-g.player.x;ay=450-g.player.y;}const d=Math.hypot(ax,ay)||1;dx+=ax/d*3;dy+=ay/d*3;}}
   for(const e of g.enemies){const x=g.player.x-e.x,y=g.player.y-e.y,d=Math.hypot(x,y);if(d<e.radius+65){dx+=x/(d||1)*(e.radius+65-d)/30;dy+=y/(d||1)*(e.radius+65-d)/30;}}
  }
  if(policy==='expert'&&g.clock>=steerAt){
   const length=Math.hypot(dx,dy)||1,gx=dx/length,gy=dy/length;let best=-Infinity,bx=gx,by=gy;
   for(let i=0;i<16;i++){const a=i*Math.PI/8,cx=Math.cos(a),cy=Math.sin(a),px=g.player.x+cx*g.speed*.7,py=g.player.y+cy*g.speed*.7;let score=(cx*gx+cy*gy)*8;
    for(const e of g.enemies){const d=Math.hypot(e.x-g.player.x,e.y-g.player.y);if(d>400)continue;const ex=e.x+(g.player.x-e.x)/(d||1)*e.speed*.7,ey=e.y+(g.player.y-e.y)/(d||1)*e.speed*.7,near=Math.hypot(px-ex,py-ey)-e.radius;score-=near<35?500+(35-near)*5:100/(near+1);}
    for(const h of g.hazards)if(h.at-g.clock<1&&Math.hypot(px-h.x,py-h.y)<h.radius+15)score-=900;
    for(const b of g.bolts){if(Math.hypot(b.x-g.player.x,b.y-g.player.y)>600)continue;const rx=b.x-g.player.x,ry=b.y-g.player.y,vx=b.vx-cx*g.speed,vy=b.vy-cy*g.speed,t=Math.max(0,Math.min(.8,-(rx*vx+ry*vy)/(vx*vx+vy*vy||1)));if(Math.hypot(rx+vx*t,ry+vy*t)<32)score-=700;}
    if(score>best){best=score;bx=cx;by=cy;}
   }steer={x:bx,y:by};steerAt=g.clock+.12;
  }
  if(policy==='expert'){dx=steer.x;dy=steer.y;}
  g.move(dx,dy);g.step(dt);
 }
 return {seed,policy,phase:g.phase,time:g.time,bonusTime:g.bonusTime,spent:g.spentMana/10,points:g.roundPointsMilli/10000,units:g.bountyUnits,bonuses:(g.normalCleared?C.clearGold:0)+(g.bonusCleared?C.bonusGold:0),clear:g.normalCleared,bonus:g.bonusCleared,jars:g.jarsBroken,dragons:g.dragons,kills:g.kills,level:g.level,hp:g.player.hp,peak:g.peakEnemies,build:SKILLS.filter(s=>g.skills[s]>0),capacity:g.potentialHits,hits:g.hits,unusedSlots:g.potentialHits-g.hits,xpDropped:g.xpDropped,xpCollected:g.xpCollected,xpLeft:g.xpOrbs.reduce((n,o)=>n+o.value,0)};
}
if(process.argv[1]?.endsWith('cultivation-simulation.mjs')){const n=Number(process.argv[2]||12),rows=Array.from({length:n},(_,i)=>simulate(i+1));const sum=k=>rows.reduce((n,r)=>n+Number(r[k]),0);console.log(JSON.stringify({rows,aggregate:{cost:sum('spent'),units:sum('units'),bonus:sum('bonuses'),rtp:(sum('points')+sum('bonuses'))/sum('spent'),neededRate:(.95*sum('spent')-sum('bonuses'))/sum('units')*10}},null,2));}
