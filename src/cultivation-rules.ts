export const CULTIVATION={duration:900,bonusDuration:120,width:1024,height:900,manaCap:2000,manaPerGold:10,pointsPerGold:10,clearGold:80,bonusGold:100,bountyRate:.02050577479,enemyCap:110,dragonChance:.35} as const;
export const CULT_KEY='fantasy-arcade.cultivation.v1';
export type Skill='sword'|'fire'|'thunder';
export const SKILL_NAMES:Record<Skill,string>={sword:'御劍訣',fire:'離火符',thunder:'九霄雷'};
export const REALMS=['煉氣','築基','金丹','元嬰','化神','渡劫'];
export const UPGRADE_NAMES={sword:'御劍訣強化',fire:'離火符強化',thunder:'九霄雷強化',power:'劍意精進',vitality:'鍛體',guard:'金鐘護體',regen:'生生不息',boots:'御風步',heal:'回春滿血'} as const;
export type Upgrade=keyof typeof UPGRADE_NAMES;
export function enemyStats(minute:number,kind:number){
 const m=Math.max(0,Math.min(14,Math.floor(minute))),hp=30*Math.pow(1.16,m)*[1,.8,1.5,3,14,45][kind];
 return {hp,speed:[58,90,48,38,48,42][kind]+m*1.5,damage:(7+m*1.3)*[1,.8,1.3,1.7,2.2,3][kind],radius:[15,16,18,25,35,45][kind]};
}
export function skillStats(skill:Skill,rank:number,level:number,minute:number,power:number,buffs:readonly string[]=[]){
 const growth=(1+.065*(level-1))*(1+.025*Math.min(15,minute))*Math.pow(1.12,power),i=['sword','fire','thunder'].indexOf(skill);
 return {damage:[22,16,35][i]*(1+.1*(rank-1))*growth*(buffs.includes('fury')?1.35:1),cap:skill==='sword'?2+Math.floor(rank/2):skill==='fire'?3+rank:1+rank,range:[300,260,390][i],radius:skill==='fire'?125:skill==='thunder'?155:0,cooldown:([.95,1.8,2.8][i]-.025*(rank-1))*(buffs.includes('haste')?.75:1)};
}
/** One cast, one hit per distinct target. Damage, actual target count and discounts are billed upfront. */
export function manaCost(damage:number,targets:number,discount=false){return targets<=0?0:Math.max(1,Math.ceil((1+Math.pow(damage*targets/60,.85))*(discount?.75:1)));}
export function xpRequired(level:number){return 8+level*3;}
export function seeded(seed:number){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),s|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
