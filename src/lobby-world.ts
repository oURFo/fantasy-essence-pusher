import {MACHINES,type MachineId} from './machines.ts';
import type {WalletStorage} from './wallet.ts';
import type {AvatarDirection} from './avatar-motion.ts';

export type AvatarBody='male'|'female';
export interface AvatarAppearance {body:AvatarBody;outfit:'arcade';}
export const LOBBY_PROFILE_KEY='fantasy-arcade.visitor.v1';
export const HALL={height:720,sectionWidth:1080,slots:3,aisleTop:520,aisleBottom:674,speed:180} as const;
// Stable atlas cells; adding a cabinet never changes the existing artwork mapping.
export const CABINET_ART:Record<MachineId,number>={'essence-vault':0,'sky-wings':1,'fruit-banquet':2,'night-market':3,'fate-orbit':4,'gold-mine':5,'temple-fortune':6,'thunder-forge':7};
export function paymentKind(id:MachineId){return id==='fruit-banquet'||id==='night-market'?'ticket':'continuous';}
export function paymentLabel(id:MachineId){return id==='fruit-banquet'?'20 金幣 / 局 · 16 顆彈珠':id==='night-market'?'100 金幣起 / 圈圈套票':`${MACHINES.find(m=>m.id===id)!.entryCost} 金幣 / 次`;}
export function buildHall(machines:readonly {id:MachineId}[]=MACHINES){
 const ordered=['continuous','ticket'].flatMap(kind=>machines.filter(m=>paymentKind(m.id)===kind));
 // Payment modes start on separate modules. Fill existing modules before extending right.
 let index=0,lastKind='',section=0,slot=0;
 const placements=ordered.map(m=>{const kind=paymentKind(m.id);if(index&&kind!==lastKind){section++;slot=0;}else if(slot===HALL.slots){section++;slot=0;}const result={id:m.id,x:section*HALL.sectionWidth+180+slot*360,section,art:CABINET_ART[m.id]};slot++;index++;lastKind=kind;return result;});
 return {placements,width:(section+1)*HALL.sectionWidth,sections:section+1};
}
export class LobbyWorld {
 readonly layout=buildHall();appearance:AvatarAppearance|null=null;
 x=180;y=588;target:{x:number;y:number}|null=null;walking=false;facing=1;walkTime=0;walkDistance=0;direction:AvatarDirection='down';
 private arrivalDirection:AvatarDirection|undefined;
 private storage?:WalletStorage;
 constructor(storage?:WalletStorage){this.storage=storage;try{const p=JSON.parse(storage?.getItem(LOBBY_PROFILE_KEY)??'null');if(p?.version===1&&(p.body==='male'||p.body==='female')){this.appearance={body:p.body,outfit:'arcade'};if(Number.isFinite(p.x)&&Number.isFinite(p.y)){this.x=this.clampX(p.x);this.y=this.clampY(p.y);}}}catch{/* Optional local persistence. */}}
 private clampX(x:number){return Math.max(65,Math.min(this.layout.width-65,x));}
 private clampY(y:number){return Math.max(HALL.aisleTop,Math.min(HALL.aisleBottom,y));}
 choose(body:AvatarBody){this.appearance={body,outfit:'arcade'};this.save();}
 moveTo(x:number,y:number){if(!this.appearance||!Number.isFinite(x)||!Number.isFinite(y))return;this.target={x:this.clampX(x),y:this.clampY(y)};this.arrivalDirection=undefined;}
 approach(id:MachineId){const p=this.layout.placements.find(p=>p.id===id);if(p){this.moveTo(p.x,HALL.aisleTop);this.arrivalDirection='up';}}
 step(dt:number,dx=0,dy=0){
  this.walking=false;if(!this.appearance)return;dt=Math.max(0,Math.min(dt,.05));
  if(dx||dy){this.target=null;this.arrivalDirection=undefined;const length=Math.hypot(dx,dy);this.move(dx/length*HALL.speed*dt,dy/length*HALL.speed*dt);}
  else if(this.target){const dx=this.target.x-this.x,dy=this.target.y-this.y,d=Math.hypot(dx,dy),distance=Math.min(d,HALL.speed*dt);if(d<=1){this.move(dx,dy);this.walking=false;this.target=null;if(this.arrivalDirection)this.direction=this.arrivalDirection;this.arrivalDirection=undefined;this.save();}else this.move(dx/d*distance,dy/d*distance);}
  if(this.walking)this.walkTime+=dt;
 }
 private move(dx:number,dy:number){const x=this.clampX(this.x+dx),y=this.clampY(this.y+dy),mx=x-this.x,my=y-this.y;this.walking=Math.hypot(mx,my)>.01;if(this.walking){this.walkDistance+=Math.hypot(mx,my);this.direction=Math.abs(mx)>Math.abs(my)?mx<0?'left':'right':my<0?'up':'down';if(mx)this.facing=mx<0?-1:1;}this.x=x;this.y=y;}
 get nearby(){return this.layout.placements.find(p=>Math.abs(p.x-this.x)<125&&this.y<=565)??null;}
 stop(){this.target=null;this.arrivalDirection=undefined;this.walking=false;this.save();}
 save(){if(!this.appearance)return;try{this.storage?.setItem(LOBBY_PROFILE_KEY,JSON.stringify({version:1,...this.appearance,x:this.x,y:this.y}));}catch{/* Play remains available with blocked storage. */}}
}
