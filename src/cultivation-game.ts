import {PlayerWallet,type WalletStorage} from './wallet.ts';
import {CULTIVATION as C,CULT_KEY,enemyStats,skillStats,castCost,killPointsMilli,xpRequired,SKILLS,SKILL_NAMES,isSkill,emptySkills,spawnRate,enemyKind,type Skill,type Upgrade} from './cultivation-rules.ts';
export type CultPhase='ready'|'playing'|'upgrade'|'shop'|'paused'|'bonus-intro'|'bonus'|'dead'|'victory';
export interface CultEnemy {id:number;x:number;y:number;hp:number;maxHp:number;kind:number;speed:number;damage:number;radius:number;attackAt:number;waveAt:number;boss:'mini'|'final'|'dragon'|null;hitAt:number;slowUntil?:number;poison?:number;poisonUntil?:number;}
export interface CultXpOrb {id:number;x:number;y:number;value:number;cell:string;attracting:boolean;pullTime:number;}
export interface CultJar {x:number;y:number;hp:number;expires:number;corner:number;}
export interface CultEffect {kind:Skill|'hit'|'heal'|'pearl'|'level'|'win'|'damage'|'boss-arrive'|'boss-kill'|'xp'|'learn';x:number;y:number;toX:number;toY:number;at:number;value:number;}
export interface CultBolt {x:number;y:number;vx:number;vy:number;expires:number;damage:number;}
export interface CultHazard {x:number;y:number;at:number;radius:number;damage:number;}
export class Cultivation {
 readonly wallet:PlayerWallet;private storage?:WalletStorage;private random:()=>number;
 private writer=globalThis.crypto?.randomUUID?.()??`cult-${Date.now()}-${Math.random()}`;private claimed=false;sessionConflict=false;
 mana=0;pointsMilli=0;storageFailed=false;disposed=false;phase:CultPhase='ready';resumePhase:'playing'|'bonus'|'ready'='ready';
 time=0;bonusTime=0;clock=0;player={x:512,y:450,hp:120,maxHp:120,direction:'down' as 'down'|'right'|'up'|'left',moving:false};
 level=1;xp=0;skills:Record<Skill,number>=emptySkills();upgrades={power:0,vitality:0,guard:0,regen:0,boots:0};choices:Upgrade[]=[];
 xpOrbs:CultXpOrb[]=[];xpDropped=0;xpCollected=0;private xpSerial=0;private xpFxAt=0;private xpCells=new Map<string,CultXpOrb>();
 enemies:CultEnemy[]=[];jar:CultJar|null=null;effects:CultEffect[]=[];hazards:CultHazard[]=[];bolts:CultBolt[]=[];buffs:Record<string,number>={};dragons=0;jarsBroken=0;kills=0;
 spentMana=0;roundPointsMilli=0;roundGold=0;normalCleared=false;bonusCleared=false;bountyUnits=0;casts=0;hits=0;potentialHits=0;message='御劍入世，問道萬妖。先購買法力，再開始試煉。';
 bossNotice='';bossNoticeUntil=0;bossAward:{title:string;points:number;until:number}|null=null;peakEnemies=0;private announced=new Set<number>();
 private shopPhase:CultPhase='ready';private serial=0;private spawnAt=0;private jarAt=35;private bossIndex=0;private hitAt=-10;private skillAt:Record<Skill,number>=emptySkills();private dx=0;private dy=0;
 constructor(wallet:PlayerWallet,storage?:WalletStorage,random=Math.random){this.wallet=wallet;this.storage=storage;this.storageFailed=!storage;this.random=random;try{const d=JSON.parse(storage?.getItem(CULT_KEY)??'null');if(d?.version===1){if(Number.isSafeInteger(d.mana)&&d.mana>=0&&d.mana<=C.manaCap)this.mana=d.mana;if(Number.isSafeInteger(d.pointsMilli)&&d.pointsMilli>=0)this.pointsMilli=d.pointsMilli;}}catch{this.storageFailed=true;}}
 private claim(){
  if(this.claimed)return this.checkOwner();
  if(this.storage&&!this.storageFailed)try{const d=JSON.parse(this.storage.getItem(CULT_KEY)??'null');if(d?.version===1){if(Number.isSafeInteger(d.mana)&&d.mana>=0&&d.mana<=C.manaCap)this.mana=d.mana;if(Number.isSafeInteger(d.pointsMilli)&&d.pointsMilli>=0)this.pointsMilli=d.pointsMilli;}}catch{this.storageFailed=true;}
  this.claimed=true;this.persist();return true;
 }
 private checkOwner(){if(!this.storage||this.storageFailed||!this.claimed)return true;try{const d=JSON.parse(this.storage.getItem(CULT_KEY)??'null');if(d?.writer&&d.writer!==this.writer){this.sessionConflict=true;this.phase='paused';this.move(0,0);this.message='此機台已在另一分頁開始操作。請返回大廳重新進入，以載入最新法力與積分。';return false;}}catch{this.storageFailed=true;}return !this.sessionConflict;}
 get gold(){return this.wallet.gold;}get points(){return this.pointsMilli/1000;}get inputLocked(){return this.disposed;}get active(){return this.phase==='playing'||this.phase==='bonus';}
 get buffsNow(){return Object.keys(this.buffs).filter(k=>this.buffs[k]>this.clock);}get minute(){return Math.min(16,(this.time+this.bonusTime)/60);}get speed(){return 180+this.upgrades.boots*18;}
 purchaseQuote(request:number){if(!Number.isFinite(request)||request<=0)return 0;return Math.max(0,Math.min(Math.floor(request),Math.floor((C.manaCap-this.mana)/C.manaPerGold),this.gold));}
 buy(request:number){if(this.disposed||!['ready','shop','victory','paused'].includes(this.phase)||!Number.isFinite(request)||request<=0)return 0;if(!this.claim())return 0;const cost=this.purchaseQuote(request);if(!cost||!this.wallet.spend(cost))return 0;this.mana+=cost*C.manaPerGold;this.persist();this.message=`補充 ${cost*10} 法力，花費 ${cost} 金幣；剩餘法力離場保留。`;return cost;}
 openShop(){if(this.disposed||(this.phase==='upgrade'||this.phase==='dead'))return false;if(this.phase==='shop')return true;this.shopPhase=this.phase;this.phase='shop';this.move(0,0);return true;}
 closeShop(){if(this.phase!=='shop')return;this.phase=this.shopPhase;}
 pause(){if(this.active){this.resumePhase=this.phase as 'playing'|'bonus';this.phase='paused';this.move(0,0);}else if(this.phase==='paused')this.phase=this.resumePhase;}
 start(){if(this.disposed||!['ready','dead','victory'].includes(this.phase))return false;const restarting=this.phase==='dead';if(!this.claim()||(!restarting&&this.mana<2))return false;
  this.time=0;this.bonusTime=0;this.announced.clear();this.bossNotice='';this.bossAward=null;this.peakEnemies=0;this.finalKilled=false;this.level=1;this.xp=0;this.xpOrbs=[];this.xpCells.clear();this.xpSerial=0;this.xpFxAt=0;this.xpDropped=0;this.xpCollected=0;this.skills=emptySkills();this.upgrades={power:0,vitality:0,guard:0,regen:0,boots:0};this.choices=[];this.enemies=[];this.jar=null;this.effects=[];this.hazards=[];this.bolts=[];this.buffs={};this.dragons=0;this.jarsBroken=0;this.kills=0;this.spentMana=0;this.roundPointsMilli=0;this.roundGold=0;this.normalCleared=false;this.bonusCleared=false;this.bountyUnits=0;this.casts=0;this.hits=0;this.potentialHits=0;this.spawnAt=0;this.jarAt=35;this.bossIndex=0;this.skillAt=emptySkills();this.hitAt=-10;this.player={x:512,y:450,hp:120,maxHp:120,direction:'down',moving:false};if(this.mana<2){this.phase='ready';this.openShop();this.message='新試煉已重新開始，請先準備法力。';return true;}this.phase='upgrade';this.resumePhase='playing';this.makeChoices();this.message='選擇本命術法，每局最多三種。';return true;
 }
 move(dx:number,dy:number){if(!Number.isFinite(dx)||!Number.isFinite(dy))return;const len=Math.max(1,Math.hypot(dx,dy));this.dx=dx/len;this.dy=dy/len;this.player.moving=Boolean(dx||dy);}
 drop(){return this.start();}
 private persist(){if(!this.claimed||this.sessionConflict)return;try{this.storage?.setItem(CULT_KEY,JSON.stringify({version:1,mana:this.mana,pointsMilli:this.pointsMilli,writer:this.writer}));}catch{this.storageFailed=true;}}
 redeem(){const gold=Math.floor(this.pointsMilli/10000);if(!gold||this.disposed||!this.claim())return 0;this.pointsMilli-=gold*10000;this.persist();if(!this.wallet.credit(gold)){this.pointsMilli+=gold*10000;this.persist();return 0;}this.roundGold+=gold;return gold;}
 private earn(pointsMilli:number){this.pointsMilli+=pointsMilli;this.roundPointsMilli+=pointsMilli;this.persist();this.redeem();}
 private effect(kind:CultEffect['kind'],x:number,y:number,value=0,toX=x,toY=y){this.effects.push({kind,x,y,value,toX,toY,at:this.clock});if(this.effects.length>100)this.effects.shift();}
 private enemy(kind:number,boss:CultEnemy['boss']=null){const stats=enemyStats(this.minute,kind);let x=512,y=120;
  const angle=this.random()*Math.PI*2,radius=boss?590:650+this.random()*120;x=this.player.x+Math.cos(angle)*radius;y=this.player.y+Math.sin(angle)*radius;
  const hp=boss==='dragon'?12000:boss==='final'?stats.hp*.5:stats.hp;
  const e:CultEnemy={id:++this.serial,x,y,hp,maxHp:hp,kind,...{speed:stats.speed,damage:stats.damage,radius:stats.radius},attackAt:this.clock+1,waveAt:this.clock+4,boss,hitAt:-10};this.enemies.push(e);return e;
 }
 private spawnJar(){const corner=Math.floor(this.random()*4),positions=[[-340,-300],[340,-300],[-340,300],[340,300]].map(([x,y])=>[this.player.x+x,this.player.y+y]),p=positions[corner];this.jar={x:p[0],y:p[1],hp:1,corner,expires:this.time+10};this.message='靈酒現世！角落酒罈將在 10 秒後消失。';}
 private breakJar(){const j=this.jar;if(!j)return;this.jar=null;this.jarsBroken++;
  if(this.dragons<5&&this.random()<C.dragonChance){this.dragons++;this.effect('pearl',j.x,j.y,this.dragons);this.message=this.dragons===5?'五龍珠集齊！通關後將開啟龍王劫。':`獲得龍珠 ${this.dragons} / 5！`;}else{const names=['fury','haste','guard','renew','conserve'],namesZh=['赤焰增傷','御風急速','金剛護體','靈泉回春','節氣省魔'],i=Math.floor(this.random()*names.length);this.buffs[names[i]]=this.clock+25;this.effect('heal',j.x,j.y);this.message=`靈酒加持：${namesZh[i]}，持續 25 秒。`;}
 }
 private chooseTargets(skill:Skill){const s=skillStats(skill,this.skills[skill],this.level,this.minute,this.upgrades.power,this.buffsNow);
  const distance=(e:{x:number;y:number})=>Math.hypot(e.x-this.player.x,e.y-this.player.y);
  let candidates:(CultEnemy|CultJar)[]=[...this.enemies.filter(e=>e.hp>0),...(this.jar?[this.jar]:[])].filter(e=>distance(e)<=s.range&&(e!==this.jar||distance(e)<=140)).sort((a,b)=>a===this.jar?-1:b===this.jar?1:distance(a)-distance(b));
  if(!candidates.length)return {s,targets:[] as (CultEnemy|CultJar)[]};
  if(skill==='sword')candidates.sort((a,b)=>Number('boss' in b&&!!b.boss)-Number('boss' in a&&!!a.boss)||distance(a)-distance(b));
  if(skill==='spear')candidates.sort((a,b)=>Number('boss' in b&&!!b.boss)-Number('boss' in a&&!!a.boss)||b.hp-a.hp);
  const first=candidates[0],targets:(CultEnemy|CultJar)[]=[];
  const forward={x:this.player.direction==='left'?-1:this.player.direction==='right'?1:0,y:this.player.direction==='up'?-1:this.player.direction==='down'?1:0};
  const ax=first.x-this.player.x,ay=first.y-this.player.y,len=Math.hypot(ax,ay)||1;
  for(const e of candidates){if(targets.length>=s.cap)break;const dx=e.x-this.player.x,dy=e.y-this.player.y;
   let include=true;
   if(skill==='fire'||skill==='void')include=Math.hypot(e.x-first.x,e.y-first.y)<=s.radius;
   if(skill==='thunder'&&targets.length){const anchor=targets.at(-1)!;include=Math.hypot(e.x-anchor.x,e.y-anchor.y)<=s.radius;}
   if(skill==='needle'||skill==='dragon')include=(dx*ax+dy*ay)/len>=0&&Math.abs(dx*ay-dy*ax)/len<=s.radius;
   if(skill==='crescent'||skill==='phoenix')include=(dx*forward.x+dy*forward.y)/(Math.hypot(dx,dy)||1)>(skill==='crescent'?.45:.05);
   if(include)targets.push(e);
  }
  return {s,targets};
 }
 private cast(skill:Skill){const {s,targets}=this.chooseTargets(skill);if(!targets.length){this.skillAt[skill]=this.clock+.12;return;}
  const cost=castCost(s,this.buffsNow.includes('conserve'));if(this.mana<cost){this.skillAt[skill]=this.clock+.15;return;}
  this.mana-=cost;this.spentMana+=cost;this.casts++;this.hits+=targets.length;this.potentialHits+=s.cap;this.persist();this.skillAt[skill]=this.clock+s.cooldown;
  let from={x:this.player.x,y:this.player.y};const anchor=targets[0];for(const e of targets){this.effect(skill,from.x,from.y,0,e.x,e.y);const dot=skill==='needle'&&'kind' in e?s.damage*.6:0;e.hp-=(s.damage-dot)*(('kind' in e&&e.kind===7)? .7:1);
   if('kind' in e){if(dot){e.poison=(e.poison??0)+dot;e.poisonUntil=this.clock+2;}if(skill==='ice')e.slowUntil=this.clock+2;
    if(skill==='bell'||skill==='void'){const cx=skill==='void'?anchor.x:this.player.x,cy=skill==='void'?anchor.y:this.player.y,dx=e.x-cx,dy=e.y-cy,d=Math.hypot(dx,dy)||1,force=skill==='bell'?45:-35;e.x+=dx/d*force;e.y+=dy/d*force;}
    e.hitAt=this.clock;
   }this.effect('damage',e.x,e.y,Math.round(s.damage));if(skill==='thunder')from=e;
  }
  if(this.jar&&this.jar.hp<=0)this.breakJar();
 }
 private dropXp(x:number,y:number,value:number){const cell=`${Math.floor(x/32)},${Math.floor(y/32)}`,existing=this.xpCells.get(cell);this.xpDropped+=value;
  if(existing&&!existing.attracting){const sum=existing.value+value;existing.x=(existing.x*existing.value+x*value)/sum;existing.y=(existing.y*existing.value+y*value)/sum;existing.value=sum;}
  else{const orb:CultXpOrb={id:++this.xpSerial,x,y,value,cell,attracting:false,pullTime:0};this.xpOrbs.push(orb);this.xpCells.set(cell,orb);}
 }
 private collectXp(dt:number){let gained=0;
  for(const orb of this.xpOrbs){const dx=this.player.x-orb.x,dy=this.player.y-orb.y,d=Math.hypot(dx,dy);
   if(!orb.attracting&&d<=110){orb.attracting=true;if(this.xpCells.get(orb.cell)===orb)this.xpCells.delete(orb.cell);}
   if(!orb.attracting)continue;orb.pullTime+=dt;const travel=(320+Math.min(700,orb.pullTime*900))*dt;
   if(d<=18+travel){gained+=orb.value;orb.value=0;}else{orb.x+=dx/d*travel;orb.y+=dy/d*travel;}
  }
  if(gained){this.xp+=gained;this.xpCollected+=gained;this.xpOrbs=this.xpOrbs.filter(o=>o.value>0);if(this.clock>=this.xpFxAt){this.effect('xp',this.player.x,this.player.y,gained);this.xpFxAt=this.clock+.12;}}
 }
 private advanceLevel(){while(this.level<30&&this.xp>=xpRequired(this.level)){this.xp-=xpRequired(this.level);this.level++;this.player.maxHp+=6;this.player.hp=Math.min(this.player.maxHp,this.player.hp+6);this.makeChoices();this.phase='upgrade';this.resumePhase=this.time>=C.duration?'bonus':'playing';this.move(0,0);this.effect('level',this.player.x,this.player.y,this.level);return;}}
 private makeChoices(){const owned=SKILLS.filter(s=>this.skills[s]>0),pool:Upgrade[]=[];
  for(const s of SKILLS)if(this.skills[s]<5&&(this.skills[s]>0||owned.length<3))pool.push(s);
  if(this.level>1){for(const u of ['power','vitality','guard','regen','boots'] as const)if(this.upgrades[u]<({power:5,vitality:4,guard:3,regen:3,boots:4}[u]))pool.push(u);if(this.player.hp<this.player.maxHp*.9)pool.push('heal');}
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  this.choices=pool.slice(0,3);
  if(this.level>1&&owned.length<3&&!this.choices.some(u=>isSkill(u)&&!this.skills[u])){const next=pool.find(u=>isSkill(u)&&!this.skills[u]);if(next)this.choices[0]=next;}
 }
 choose(upgrade:Upgrade){if(this.disposed||this.phase!=='upgrade'||!this.choices.includes(upgrade))return false;
  if(isSkill(upgrade)){if(!this.skills[upgrade]&&SKILLS.filter(s=>this.skills[s]>0).length>=3)return false;this.skills[upgrade]++;this.effect('learn',this.player.x,this.player.y,this.skills[upgrade]);}
  else if(upgrade==='heal'){this.player.hp=this.player.maxHp;this.effect('heal',this.player.x,this.player.y);}else{this.upgrades[upgrade]++;if(upgrade==='vitality'){this.player.maxHp+=25;this.player.hp+=25;}}
  if(this.level===1&&isSkill(upgrade))this.message=`${SKILL_NAMES[upgrade]}已習得！持續移動、斬妖突破，每局最多三種術法。`;this.choices=[];this.phase=this.resumePhase;this.advanceLevel();return true;
 }
 beginBonus(){if(this.phase!=='bonus-intro'||this.disposed)return false;this.enemies=[];this.hazards=[];this.bolts=[];this.jar=null;this.bonusTime=0;this.player.hp=this.player.maxHp;this.phase='bonus';this.enemy(5,'dragon');this.announceBoss('五龍珠共鳴 · 金龍王降臨',false);this.message=`龍王劫開始！120 秒內擊敗龍王，另得 ${C.bonusGold} 金幣。`;return true;}
 private announceBoss(text:string,warning=true){this.bossNotice=text;this.bossNoticeUntil=this.clock+(warning?5:3);if(!warning)this.effect('boss-arrive',this.player.x,this.player.y);}
 private clear(){if(this.normalCleared)return;this.normalCleared=true;this.wallet.credit(C.clearGold);this.roundGold+=C.clearGold;this.effect('win',512,450,C.clearGold);this.jar=null;this.enemies=[];this.hazards=[];this.bolts=[];this.move(0,0);this.phase=this.dragons>=5?'bonus-intro':'victory';this.message=this.dragons>=5?'試煉通關！獲得 80 金幣，五龍珠開啟龍王劫。':'十五分鐘試煉通關！另外獲得 80 金幣。';this.persist();}
 private die(message='道途未竟。等級與技能重置，法力、積分及已得金幣保留。'){this.phase='dead';this.move(0,0);this.message=message;this.persist();}
 step(dt=1/60){if(this.disposed||!Number.isFinite(dt)||dt<=0||!this.checkOwner())return;dt=Math.max(0,Math.min(.1,dt));if(this.active&&this.mana===0){this.message='法力耗盡，戰鬥已暫停。請確認補充法力。';this.openShop();return;}this.clock+=(this.active||this.phase==='victory'||this.phase==='dead')?dt:0;this.effects=this.effects.filter(e=>this.clock-e.at<1.3);if(!this.active)return;
  const bonus=this.phase==='bonus';if(bonus)this.bonusTime+=dt;else this.time=Math.min(C.duration,this.time+dt);
  const p=this.player;p.moving=Boolean(this.dx||this.dy);p.x+=this.dx*this.speed*dt;p.y+=this.dy*this.speed*dt;if(p.moving)p.direction=Math.abs(this.dx)>Math.abs(this.dy)?this.dx<0?'left':'right':this.dy<0?'up':'down';
  p.hp=Math.min(p.maxHp,p.hp+(this.upgrades.regen*.25+(this.buffsNow.includes('renew')?p.maxHp*.008:0))*dt);
  if(!bonus&&this.bossIndex<3&&this.time>=[270,570,840][this.bossIndex]-5&&!this.announced.has(this.bossIndex)){this.announced.add(this.bossIndex);this.announceBoss(this.bossIndex===2?'天魔即將降臨 · 準備迎戰':'妖將逼近 · 五秒後降臨');}
  if(!bonus&&this.bossIndex<3&&this.time>=[270,570,840][this.bossIndex]){this.enemy(this.bossIndex===2?5:4,this.bossIndex===2?'final':'mini');this.bossIndex++;this.announceBoss(this.bossIndex===3?'最終天魔降臨':'鎮境妖將降臨',false);this.message=this.bossIndex===3?'天魔降臨！15:00 前擊敗牠才能通關。':'妖將降臨！注意地面的蓄力範圍。';}
  if(!bonus&&this.time>=this.jarAt&&this.time<880){this.spawnJar();this.jarAt+=40;}if(this.jar&&this.time>=this.jar.expires)this.jar=null;
  if(this.clock>=this.spawnAt){this.spawnAt=this.clock+1/(bonus?12:spawnRate(this.minute));if(this.enemies.length<C.enemyCap){const kind=enemyKind(this.minute,this.random());this.enemy(kind);}}
  this.peakEnemies=Math.max(this.peakEnemies,this.enemies.length);
  for(const e of this.enemies){if(e.hp<=0)continue;if(Math.hypot(e.x-p.x,e.y-p.y)>1250){const angle=this.random()*Math.PI*2;e.x=p.x+Math.cos(angle)*850;e.y=p.y+Math.sin(angle)*850;}if((e.poison??0)>0){const amount=Math.min(e.poison!,e.poison!*dt/Math.max(dt,(e.poisonUntil??this.clock)-this.clock));e.poison!-=amount;e.hp-=amount;if(e.hp<=0)continue;}const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);if(d>e.radius+10){const speed=e.speed*((e.slowUntil??0)>this.clock?.45:1)*(e.boss&&d>400?2.7:1);const dash=e.kind===11&&(this.clock+e.id*.37)%6<.5?2.8:1,sway=e.kind===10?Math.sin(this.clock*2+e.id)*.5:0;e.x+=(dx/d-dy/d*sway)*speed*dash*dt;e.y+=(dy/d+dx/d*sway)*speed*dash*dt;}if(!e.boss&&(e.kind===2||e.kind===8)&&this.clock>=e.waveAt&&d<340&&this.bolts.length<46){e.waveAt=this.clock+(e.kind===8?5.5:5);const speed=160+this.minute*2;this.bolts.push({x:e.x,y:e.y,vx:dx/(d||1)*speed,vy:dy/(d||1)*speed,expires:this.clock+3,damage:e.damage*.7});if(e.kind===8){const angle=Math.atan2(dy,dx);for(const offset of [-.23,.23])this.bolts.push({x:e.x,y:e.y,vx:Math.cos(angle+offset)*speed,vy:Math.sin(angle+offset)*speed,expires:this.clock+3,damage:e.damage*.55});}}if(e.kind===9&&this.clock>=e.waveAt&&d<240){e.waveAt=this.clock+6;this.hazards.push({x:p.x,y:p.y,at:this.clock+.8,radius:60,damage:e.damage*.7});}if(e.boss&&this.clock>=e.waveAt){e.waveAt=this.clock+(e.boss==='dragon'?3.2:4.5);this.hazards.push({x:p.x,y:p.y,at:this.clock+1.1,radius:e.boss==='dragon'?135:105,damage:e.damage*.8});}
   if(d<e.radius+15&&this.clock-e.attackAt>=0&&this.clock-this.hitAt>=Math.max(.28,.55-this.minute*.018)){e.attackAt=this.clock+1;this.hurt(e.damage);}
  }
  for(const b of this.bolts){const sx=b.vx*dt,sy=b.vy*dt,t=Math.max(0,Math.min(1,((p.x-b.x)*sx+(p.y-b.y)*sy)/(sx*sx+sy*sy||1)));if(Math.hypot(p.x-b.x-sx*t,p.y-b.y-sy*t)<22){if(this.clock-this.hitAt>.25)this.hurt(b.damage);b.expires=-1;}b.x+=sx;b.y+=sy;}
  this.bolts=this.bolts.filter(b=>b.expires>this.clock);
  for(const h of this.hazards)if(this.clock>=h.at&&this.clock-h.at<dt+.00001&&Math.hypot(p.x-h.x,p.y-h.y)<h.radius)this.hurt(h.damage);
  this.hazards=this.hazards.filter(h=>this.clock<h.at+.3);if(p.hp<=0){this.die();return;}
  for(const s of SKILLS)if(this.active&&this.skills[s]>0&&this.clock>=this.skillAt[s])this.cast(s);
  let dragonDead=false;for(const e of this.enemies)if(e.hp<=0){this.kills++;this.dropXp(e.x,e.y,e.boss?18:e.kind===3?3:1);this.bountyUnits+=e.maxHp;this.earn(killPointsMilli(e.maxHp));if(e.boss==='final')this.finalKilled=true;if(e.boss==='dragon')dragonDead=true;this.effect('hit',e.x,e.y,Math.round(killPointsMilli(e.maxHp)/100)/10);if(e.boss){const points=killPointsMilli(e.maxHp)/1000;this.bossAward={title:e.boss==='dragon'?'金龍王':e.boss==='final'?'最終天魔':'鎮境妖將',points,until:this.clock+4};this.effect('boss-kill',e.x,e.y,points);this.message=`擊破${this.bossAward.title}！獲得 ${points.toFixed(3)} 積分（${(points/10).toFixed(3)} 金幣等值）。`;}}
  this.enemies=this.enemies.filter(e=>e.hp>0);
  this.collectXp(dt);
  if(dragonDead){this.bonusCleared=true;this.wallet.credit(C.bonusGold);this.roundGold+=C.bonusGold;this.phase='victory';this.move(0,0);this.effect('win',512,450,C.bonusGold);this.message=`龍王劫破！追加獎金 ${C.bonusGold} 金幣入帳！`;this.persist();return;}
  if(bonus&&this.bonusTime>=C.bonusDuration){this.die('龍王劫時間結束；正常通關獎金、法力與積分保留。');return;}
  if(!bonus&&this.time>=C.duration){if(this.finalKilled)this.clear();else this.die('未能在十五分鐘內擊敗天魔；法力與已得積分保留。');return;}
  this.advanceLevel();
  if(this.active&&this.mana<100){const owned=SKILLS.filter(s=>this.skills[s]>0),attacks=owned.map(s=>this.chooseTargets(s));const required=attacks.filter(a=>a.targets.length).map(a=>castCost(a.s,this.buffsNow.includes('conserve')));const minimum=Math.min(...owned.map(s=>castCost(skillStats(s,this.skills[s],this.level,this.minute,this.upgrades.power,this.buffsNow),this.buffsNow.includes('conserve'))));if(this.mana<minimum||(required.length>0&&required.every(c=>c>this.mana))){this.message='法力不足，戰鬥已暫停。請確認是否補充法力。';this.openShop();}}
 }
 private finalKilled=false;
 private hurt(damage:number){const reduction=Math.min(.6,this.upgrades.guard*.08+(this.buffsNow.includes('guard')?.35:0));this.player.hp-=damage*(1-reduction);this.hitAt=this.clock;this.effect('hit',this.player.x,this.player.y,-Math.round(damage*(1-reduction)));}
 dispose(){if(this.disposed)return;if(this.claimed&&this.checkOwner()){this.redeem();this.persist();}this.disposed=true;this.xpOrbs=[];this.xpCells.clear();this.move(0,0);this.enemies=[];this.jar=null;this.hazards=[];this.bolts=[];}
}
