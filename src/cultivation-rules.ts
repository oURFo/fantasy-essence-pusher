export const CULTIVATION={duration:900,bonusDuration:120,width:1024,height:900,manaCap:2000,manaPerGold:10,pointsPerGold:10,clearGold:80,bonusGold:100,bountyRate:0.0331777803855,enemyCap:600,dragonChance:.35} as const;
export const CULT_KEY='fantasy-arcade.cultivation.v1';
export const SKILLS=['sword','fire','thunder','ice','crescent','needle','bell','phoenix','void','dragon','spear'] as const;
export type Skill=typeof SKILLS[number];
export const SKILL_NAMES:Record<Skill,string>={sword:'御劍訣',fire:'離火符',thunder:'九霄雷',ice:'寒蓮陣',crescent:'月輪斬',needle:'碧毒針',bell:'鎮妖鐘',phoenix:'鳳焰羽',void:'歸墟印',dragon:'青龍破',spear:'誅魔槍'};
export const SKILL_INFO:Record<Skill,string>={sword:'多目標飛劍，均衡輸出',fire:'鎖定敵群爆破，範圍攻擊',thunder:'逐敵連鎖，清理分散敵群',ice:'近身寒蓮，緩速兩秒',crescent:'朝行進方向扇形斬擊',needle:'直線穿透，部分傷害兩秒內持續生效',bell:'近身震波，擊退圍攻敵人',phoenix:'前方寬幅火浪，適合開路',void:'群體牽引，聚攏敵人',dragon:'遠距寬幅貫穿，重傷敵群',spear:'優先鎖定BOSS／高血量目標，單體高傷'};
export const REALMS=['煉氣','築基','金丹','元嬰','化神','渡劫'];
export const UPGRADE_NAMES={...SKILL_NAMES,power:'劍意精進',vitality:'鍛體',guard:'金鐘護體',regen:'生生不息',boots:'御風步',heal:'回春滿血'} as const;
export type Upgrade=keyof typeof UPGRADE_NAMES;
export function isSkill(u:string):u is Skill{return (SKILLS as readonly string[]).includes(u);}
export function emptySkills(){return Object.fromEntries(SKILLS.map(s=>[s,0])) as Record<Skill,number>;}
export function spawnRate(minute:number){return 2+minute*.24+minute*minute*.025;}
export function enemyStats(minute:number,kind:number){
 const m=Math.max(0,Math.min(16,minute)),hp=30*Math.pow(1.14,m)*(1+Math.pow(Math.max(0,m-8),2)*.035)*[1,.8,1.5,3,14,45,.55,5,1.5,1.4,1.6,2.6][kind];
 return {hp,speed:[64,96,55,44,64,65,145,48,58,82,84,92][kind]+m*2,damage:(7+m*2.2)*[1,.8,1.3,1.7,2.2,3,.7,2.5,1.1,1.2,1.3,1.6][kind],radius:[15,16,18,25,35,45,12,29,18,18,19,24][kind]};
}
export function skillStats(skill:Skill,rank:number,level:number,_minute:number,power:number,buffs:readonly string[]=[]){
 const growth=(1+.035*(level-1))*Math.pow(1.09,power),i=SKILLS.indexOf(skill);
 const damage=[34,32,48,36,44,38,36,44,36,64,140][i]*(1+.14*(rank-1))*growth*(buffs.includes('fury')?1.35:1);
 return {damage,cap:[2+Math.floor(rank/2),3+rank,1+rank,5+rank,4+rank,3+rank,7+rank,7+rank,5+rank,4+rank,rank>=4?2:1][i],range:[320,280,400,175,350,440,165,370,310,480,500][i],radius:[0,115,155,175,90,30,165,140,150,65,0][i],cooldown:([.95,1.8,2.8,2.2,1.45,1.65,2.8,2.5,3,3.5,2.6][i]-.035*(rank-1))*(buffs.includes('haste')?.75:1)};
}
export function manaCost(damage:number,targets:number,discount=false){return targets<=0?0:Math.max(1,Math.ceil((1+Math.pow(damage*targets/60,.85))*(discount?.75:1)));}
export function xpRequired(level:number){return 8+level*3;}
export function seeded(seed:number){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),s|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}

export const ENEMY_NAMES=['玉靈','狐妖','殭屍','石靈','妖將','龍王','飛蝠','鐵甲牛魔','符咒術士','蠱毒蠍','燈魂','赤鱗蛇妖'];
export const STAGES=[{at:0,name:'竹林妖息',tint:'#608c72'},{at:180,name:'荒塚夜行',tint:'#6a668e'},{at:360,name:'蠱澤毒潮',tint:'#6b9460'},{at:540,name:'炎獄圍獵',tint:'#a16551'},{at:720,name:'萬妖天劫',tint:'#94577c'}];
export function stageAt(seconds:number){return STAGES.filter(s=>s.at<=seconds).at(-1)!;}
export function enemyKind(minute:number,r:number){const pools=minute<3?[0,0,0,1,1,2,6]:minute<6?[0,0,1,1,2,6,6,7,8]:minute<9?[0,1,1,2,3,6,6,7,8,9,10]:minute<12?[0,1,1,2,3,3,6,6,7,8,9,10,11]:[0,1,2,3,3,6,6,7,8,9,10,11,11];return pools[Math.min(pools.length-1,Math.floor(r*pools.length))];}
