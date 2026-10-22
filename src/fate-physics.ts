import {FATE_BOARD as B,FATE_PINS,DISC,FATE_LEVELS,discHolePosition,fateLane} from './fate-rules.ts';
export type ShotBall={x:number;y:number;vx:number;vy:number;age:number;done:boolean;lane:number|null;trail:{x:number;y:number}[]};
export type FateObstacle={x:number;y:number;half:number;radius:number;angle:number;vx:number;vy:number;omega:number;kind:'rotor'|'mover'};
export function fateObstacles(time:number):FateObstacle[]{
 const omega=.28*1.5,radius=1.05*1.3,pegs:FateObstacle[]=[];
 for(let i=0;i<9;i++){const a=time*omega-Math.PI/3+i*Math.PI/12,dx=Math.cos(a)*radius,dy=Math.sin(a)*radius;pegs.push({kind:'rotor',x:dx,y:5.45+dy,half:0,radius:.10,angle:a,vx:-dy*omega,vy:dx*omega,omega:0});}
 return [...pegs,{kind:'mover',x:Math.sin(time*.35)*2.25,y:7.55,half:.42,radius:.17,angle:0,vx:Math.cos(time*.35)*.7875,vy:0,omega:0}];
}
export function launchFateBall(angle:number):ShotBall{const a=Math.max(-B.maxAngle,Math.min(B.maxAngle,angle))*Math.PI/180;return{x:0,y:.65,vx:Math.sin(a)*B.speed,vy:Math.cos(a)*B.speed,age:0,done:false,lane:null,trail:[]};}
function collide(ball:ShotBall,x:number,y:number,radius:number,vx=0,vy=0){
 const dx=ball.x-x,dy=ball.y-y,d=Math.hypot(dx,dy),min=radius+B.ballRadius;if(d>=min)return;
 const nx=d?dx/d:1,ny=d?dy/d:0;ball.x=x+nx*(min+.0001);ball.y=y+ny*(min+.0001);const impact=(ball.vx-vx)*nx+(ball.vy-vy)*ny;
 // Cushioned contact: a small rebound, then slope gravity carries the ball toward the upper pockets.
 if(impact<0){ball.vx-=1.10*impact*nx;ball.vy-=1.10*impact*ny;}
 if(Math.abs(nx)<.025&&ny<0&&ball.vy>=-.02)ball.vx+=(x>=0?-1:1)*.018;

}
export function stepFateBall(ball:ShotBall,time:number,dt=1/120){
 if(ball.done)return;const oldY=ball.y;ball.age+=dt;ball.vy+=B.slopeGravity*dt;const friction=Math.exp(-.016*dt);ball.vx*=friction;ball.vy*=friction;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
 if(ball.x<B.left+B.ballRadius){ball.x=B.left+B.ballRadius;ball.vx=Math.max(0,ball.vx);}if(ball.x>B.right-B.ballRadius){ball.x=B.right-B.ballRadius;ball.vx=Math.min(0,ball.vx);}
 for(const pin of FATE_PINS)collide(ball,pin.x,pin.y,pin.radius);
 for(const o of fateObstacles(time)){const ux=Math.cos(o.angle),uy=Math.sin(o.angle),along=Math.max(-o.half,Math.min(o.half,(ball.x-o.x)*ux+(ball.y-o.y)*uy)),px=o.x+ux*along,py=o.y+uy*along;collide(ball,px,py,o.radius,o.vx-o.omega*(py-o.y),o.vy+o.omega*(px-o.x));}
 if(ball.y>9.35)for(let i=1;i<9;i++)collide(ball,B.left+i*.8,Math.max(9.4,Math.min(10.5,ball.y)),.035);
 if(oldY<B.gateY&&ball.y>=B.gateY&&ball.vy>0){ball.done=true;ball.lane=fateLane(ball.x);return;}
 if(ball.y>B.top-B.ballRadius){ball.y=B.top-B.ballRadius;ball.vy=Math.min(0,ball.vy);}
 if(ball.y<.2){ball.y=.2;ball.vy=Math.max(0,ball.vy);}if(ball.age>25){ball.done=true;ball.lane=null;}
}
export type DiscBall={level:number;radius:number;radialSpeed:number;angle:number;tangentSpeed:number;plateAngle:number;time:number;hole:number|null;done:boolean;x:number;y:number;trail:{x:number;y:number}[]};
export function enterFateDisc(level:number,unit:number,plateAngle=0):DiscBall{
 const speed=DISC.minSpeed+(DISC.maxSpeed-DISC.minSpeed)*Math.max(0,Math.min(1,unit));return{level,radius:DISC.startRadius,radialSpeed:0,angle:-Math.PI/2,tangentSpeed:speed,plateAngle,time:0,hole:null,done:false,x:0,y:-DISC.startRadius,trail:[]};
}
export function stepFateDisc(ball:DiscBall,dt=1/120){
 if(ball.done)return;const oldX=ball.x,oldY=ball.y,oldRadius=ball.radius,oldPlate=ball.plateAngle;ball.time+=dt;ball.plateAngle+=DISC.motorSpeed*dt;
 // A shallow annular bowl guides the ball toward the equally spaced drain holes.
 // Rolling resistance dissipates entry speed; there is no random result selection.
 ball.radialSpeed+=(-.22*(ball.radius-DISC.trackRadius)-.95*ball.radialSpeed)*dt;ball.radius+=ball.radialSpeed*dt;
 // Maintain a slow angular roll while the bowl guides the ball inward.
 ball.tangentSpeed*=ball.radius/oldRadius;
 ball.tangentSpeed+=(-.008*ball.tangentSpeed+.003*(DISC.motorSpeed*ball.radius-ball.tangentSpeed))*dt;
 ball.angle+=ball.tangentSpeed/ball.radius*dt;ball.x=ball.radius*Math.cos(ball.angle);ball.y=ball.radius*Math.sin(ball.angle);
 const count=FATE_LEVELS[ball.level].holes,clearance=DISC.holeRadius-DISC.ballRadius;let earliest=2,index=-1;
 for(let i=0;i<count;i++){const from=discHolePosition(count,i,oldPlate),to=discHolePosition(count,i,ball.plateAngle),dx=oldX-from.x,dy=oldY-from.y,vx=ball.x-to.x-dx,vy=ball.y-to.y-dy,a=vx*vx+vy*vy,b=2*(dx*vx+dy*vy),c=dx*dx+dy*dy-clearance*clearance,discriminant=b*b-4*a*c;const hit=c<=0?0:a>0&&discriminant>=0?(-b-Math.sqrt(discriminant))/(2*a):2;if(hit>=0&&hit<=1&&hit<earliest){earliest=hit;index=i;}}
 if(index>=0){ball.x=oldX+(ball.x-oldX)*earliest;ball.y=oldY+(ball.y-oldY)*earliest;ball.hole=index;ball.done=true;}
}
