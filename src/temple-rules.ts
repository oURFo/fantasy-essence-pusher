export const TEMPLE={cost:1,cooldown:.5,radius:9,gravity:440,pointsPerGold:10,score:10,bonusSeconds:100,transitionSeconds:4,slotSeconds:2.4,resultSeconds:1.2} as const;
export type TempleDate={month:number;day:number;kind:'miss'|'small'|'medium'|'bonus';balls:number};
// Mutually exclusive outcomes, then a calendar date consistent with the outcome.
export function templeCalendar(unit:number,dateUnit:number):TempleDate{
 const n=Math.max(0,Math.min(.999999999,unit));
 if(n<.025)return{month:2,day:2,kind:'bonus',balls:0};
 if(n<.055)return{month:8,day:15,kind:'medium',balls:50};
 if(n<.255){const m=1+Math.floor(Math.max(0,Math.min(.999999999,dateUnit))*11);return{month:m>=8?m+1:m,day:15,kind:'small',balls:10};}
 const dates=[];for(let month=1;month<=12;month++)for(let day=1;day<=30;day++)if(day!==15&&!(month===2&&day===2))dates.push({month,day});
 return{...dates[Math.floor(Math.max(0,Math.min(.999999999,dateUnit))*dates.length)],kind:'miss',balls:0};
}
export const TEMPLE_MONTHS=['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
export function templeDay(day:number){const digits=['一','二','三','四','五','六','七','八','九'];return day<10?'初'+digits[day-1]:day===10?'初十':day<20?'十'+digits[day-11]:day===20?'二十':day<30?'廿'+digits[day-21]:'三十';}
export const TEMPLE_BASE_PORTS=[{x:512,y:740,kind:'slot',points:0},{x:290,y:955,kind:'score',points:10},{x:735,y:955,kind:'score',points:10}] as const;
export const TEMPLE_GOLD_PORTS=[{x:220,y:1090,kind:'score',points:10},{x:365,y:1090,kind:'score',points:20},{x:512,y:1090,kind:'score',points:200},{x:659,y:1090,kind:'score',points:50},{x:804,y:1090,kind:'score',points:100}] as const;
export type TemplePin={x:number;y:number;r:number};
export function templePins(bonus=false){const ports=bonus?TEMPLE_GOLD_PORTS:TEMPLE_BASE_PORTS,pins:TemplePin[]=[];
 const add=(x:number,y:number,r=6)=>{if(x-r<160||x+r>864||y>1180||y<415||(!bonus&&x>298&&x<728&&y>420&&y<608))return;if(ports.some(p=>Math.hypot(x-p.x,y-p.y)<36))return;if(pins.every(p=>Math.hypot(p.x-x,p.y-y)-p.r-r>=24))pins.push({x,y,r});};
 // Staggered incense guards leave clear passages while diverting central approaches.
 if(!bonus)for(const [x,y] of [[483,650],[530,667],[476,700],[548,707],[512,613]])add(x,y,7);
 for(let row=0;row<17;row++)for(let col=0;col<13;col++)add(175+col*56+(row%2?28:0),330+row*50);
 return pins;}
export const TEMPLE_BASE_PINS=templePins(),TEMPLE_GOLD_PINS=templePins(true);
