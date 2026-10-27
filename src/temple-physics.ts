import {TEMPLE,TEMPLE_BASE_PINS,TEMPLE_GOLD_PINS,TEMPLE_BASE_PORTS,TEMPLE_GOLD_PORTS} from './temple-rules.ts';
export type TempleBall={id:number;x:number;y:number;vx:number;vy:number;age:number;rail:number;power:number;variation:number;done:boolean;result:'slot'|'score'|'out'|null;points:number;gold:boolean;reward:boolean;rest:number};
export function templeBall(id:number,power:number,unit:number,gold=false,reward=false,x=827):TempleBall{return{id,x:reward?x:126,y:reward?(gold?590:440):1260,vx:reward?(gold?(unit-.5)*100:-(130+unit*210)):0,vy:reward?50:0,age:0,rail:reward?1:0,power,variation:unit-.5,done:false,result:null,points:0,gold,reward,rest:0};}
function hit(b:TempleBall,x:number,y:number,r:number){const dx=b.x-x,dy=b.y-y,d=Math.hypot(dx,dy),min=9+r;if(d>=min)return;const nx=d?dx/d:1,ny=d?dy/d:0;b.x=x+nx*(min+.04);b.y=y+ny*(min+.04);const v=b.vx*nx+b.vy*ny;if(v<0){b.vx-=v*nx*1.35;b.vy-=v*ny*1.35;}if(ny<-.98&&Math.abs(b.vx)<15)b.vx+=(b.id%2?1:-1)*20;}
export function stepTempleBall(b:TempleBall,dt=1/120){if(b.done)return;b.age+=dt;
 if(b.rail<1){b.rail=Math.min(1,b.rail+dt/1.05);const t=b.rail;if(t<.55){b.x=126;b.y=1260-990*t/.55;}else{const q=(t-.55)/.45;b.x=126+(165+b.power*57+b.variation*20-126)*q;b.y=270-35*Math.sin(q*Math.PI);}if(b.rail===1){b.vx=35+b.power*7;b.vy=70;}return;}
 const ox=b.x,oy=b.y;b.vy+=TEMPLE.gravity*dt;b.vx*=Math.exp(-.15*dt);b.x+=b.vx*dt;b.y+=b.vy*dt;
 if(b.x<150){b.x=150;b.vx=Math.abs(b.vx)*.35;}if(b.x>874){b.x=874;b.vx=-Math.abs(b.vx)*.35;}
 const dx=b.x-ox,dy=b.y-oy;
 for(const p of b.gold?TEMPLE_GOLD_PORTS:TEMPLE_BASE_PORTS){const t=Math.max(0,Math.min(1,((p.x-ox)*dx+(p.y-oy)*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(ox+dx*t-p.x,oy+dy*t-p.y)<(p.kind==='slot'?16:20)){b.done=true;b.result=p.kind;b.points=p.points;return;}}
 for(const p of b.gold?TEMPLE_GOLD_PINS:TEMPLE_BASE_PINS)hit(b,p.x,p.y,p.r);
 b.rest=Math.hypot(b.x-ox,b.y-oy)<.12?b.rest+dt:0;if(b.rest>.35){b.vx+=(b.id%2?1:-1)*24;b.rest=0;}
 if(b.y>1240){b.done=true;b.result='out';}
}
export function templeBallContacts(balls:TempleBall[]){const grid=new Map<string,TempleBall[]>();for(const b of balls){if(b.done||b.rail<1)continue;const gx=Math.floor(b.x/24),gy=Math.floor(b.y/24);for(let x=gx-1;x<=gx+1;x++)for(let y=gy-1;y<=gy+1;y++)for(const a of grid.get(x+','+y)??[]){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=18)continue;const nx=d?dx/d:1,ny=d?dy/d:0,o=(18-d)/2+.02;b.x+=nx*o;b.y+=ny*o;a.x-=nx*o;a.y-=ny*o;const v=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(v<0){a.vx+=v*.55*nx;a.vy+=v*.55*ny;b.vx-=v*.55*nx;b.vy-=v*.55*ny;}}const key=gx+','+gy;const cell=grid.get(key)??[];cell.push(b);grid.set(key,cell);}}
