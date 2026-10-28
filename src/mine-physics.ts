import {clampLeftPower,physicalLaunchPower} from './pachinko-launch.ts';
import {MINE,MINE_PINS,MINE_PORTS,MINE_RIGHT_ROOF,MINE_TRAIN,mineBowl} from './mine-rules.ts';
export type MineBall={id:number;x:number;y:number;vx:number;vy:number;age:number;rail:number;right:boolean;power:number;variation:number;done:boolean;result:'score'|'slot'|'out'|null;reward:boolean};
export function mineLaunch(id:number,power:number,right:boolean,unit=.5):MineBall{return{id,x:right?912:140,y:1250,vx:0,vy:0,age:0,rail:0,right,power:clampLeftPower(power),variation:Math.max(0,Math.min(1,unit))-.5,done:false,result:null,reward:false};}
export function mineRewardBall(id:number,x:number,unit:number):MineBall{return{id,x,y:290,vx:(unit-.5)*140,vy:55,age:0,rail:1,right:false,power:5,variation:unit-.5,done:false,result:null,reward:true};}
function contact(b:MineBall,x:number,y:number,r:number){const dx=b.x-x,dy=b.y-y,d=Math.hypot(dx,dy),min=MINE.ballRadius+r;if(d>=min)return;const nx=d?dx/d:.3,ny=d?dy/d:-1;b.x=x+nx*(min+.02);b.y=y+ny*(min+.02);const v=b.vx*nx+b.vy*ny;if(v<0){b.vx-=1.42*v*nx;b.vy-=1.42*v*ny;}if(Math.abs(nx)<.03&&ny<0)b.vx+=(x%2?1:-1)*12;}
export function stepMineBall(b:MineBall,trainX=0,dt=1/120){if(b.done)return;b.age+=dt;
 if(b.rail<1){b.rail=Math.min(1,b.rail+dt/1.05);const t=b.rail;
 if(b.right){if(t<.8){b.x=912;b.y=1250-950*t/.8;}else{const q=(t-.8)/.2;b.x=912+(855+b.variation*12-912)*q;b.y=300-30*q-10*Math.sin(q*Math.PI);}}else if(t<.55){b.x=132-18*Math.sin(t/.55*Math.PI);b.y=1250-980*(t/.55);}else{const q=(t-.55)/.45,end=165+physicalLaunchPower(b.power)*53+b.variation*12;b.x=132+(end-132)*q;b.y=270-35*Math.sin(q*Math.PI);}
 if(b.rail===1){b.vx=(b.right?-15:35+physicalLaunchPower(b.power)*7)*(1+b.variation*.16);b.vy=70*(1+b.variation*.1);}return;
 }
 const oldY=b.y;b.vy+=MINE.gravity*dt;b.vx*=Math.exp(-.14*dt);b.x+=b.vx*dt;b.y+=b.vy*dt;
 if(b.x<138){b.x=138;b.vx=Math.abs(b.vx)*.45;}if(b.x>886){b.x=886;b.vx=-Math.abs(b.vx)*.45;}
 if(b.x>MINE_RIGHT_ROOF.left&&b.x<MINE_RIGHT_ROOF.right&&b.y<MINE_RIGHT_ROOF.y+MINE.ballRadius&&oldY>=MINE_RIGHT_ROOF.y){b.y=MINE_RIGHT_ROOF.y+MINE.ballRadius;b.vy=Math.abs(b.vy)*.25;}
 // Pocket capture uses an actual swept segment to prevent fast balls tunnelling through a mouth.
 for(const p of MINE_PORTS){if(p.kind==='out')continue;const radius=p.kind==='score'?20:24,dy=b.y-oldY,t=dy?Math.max(0,Math.min(1,(p.y-oldY)/dy)):0,px=b.x-b.vx*dt*(1-t),py=oldY+dy*t;if(Math.hypot(px-p.x,py-p.y)<radius){b.done=true;b.result=p.kind;return;}}
 for(const p of MINE_PINS){if(trainX<420&&p.x>MINE_TRAIN.left+trainX&&p.x<MINE_TRAIN.right+trainX&&p.y>MINE_TRAIN.top&&p.y<MINE_TRAIN.bottom)continue;contact(b,p.x,p.y,p.r);}
 if(trainX<420&&b.x>MINE_TRAIN.left+trainX&&b.x<MINE_TRAIN.right+trainX&&b.y>MINE_TRAIN.top&&b.y<MINE_TRAIN.bottom){if(oldY<=814){b.y=802;b.vy=-Math.abs(b.vy)*.25;b.vx=-220;}else{b.x=MINE_TRAIN.left-10+trainX;b.vx=-90;}}
 // Right-side inclined return rail leads into the blue pocket only after passing the train.
 if(b.x>664&&b.x<890){const railY=1114-.58*(b.x-640);if(b.y>railY-9&&oldY<railY+20){b.y=railY-9;b.vx-=160*dt;b.vy=Math.min(0,b.vy)*.1;}}
 const floor=mineBowl(b.x);if(b.y>floor){b.y=floor;const slope=-.0021*(b.x-500);b.vx+=slope*240*dt;b.vy=-Math.abs(b.vy)*.12;}
 if((Math.abs(b.x-500)<25&&b.y>1160)||b.age>22){b.done=true;b.result='out';}
}
export function mineBallContacts(balls:MineBall[]){for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){const a=balls[i],b=balls[j];if(a.done||b.done||a.rail<1||b.rail<1)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=18)continue;const nx=d?dx/d:1,ny=d?dy/d:0,over=(18-d)/2+.01;a.x-=nx*over;a.y-=ny*over;b.x+=nx*over;b.y+=ny*over;const v=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(v<0){a.vx+=v*.6*nx;a.vy+=v*.6*ny;b.vx-=v*.6*nx;b.vy-=v*.6*ny;}}}
