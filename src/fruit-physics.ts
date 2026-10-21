export const FIELD={left:105,right:885,gravity:1450,ballRadius:9,launcherX:935,launcherY:1410,arcX:885,arcY:770,arcRadius:50} as const;
export const FRUIT_PINS:{x:number;y:number}[]=[];
for(const [row,y] of [810,990,1160,1340].entries())for(let col=0;col<11;col++){const x=135+col*68+(row%2?25:0);if(x<865)FRUIT_PINS.push({x,y});}
export const TARGET_ROWS=[1460] as const;
export type Crossing={row:number;x:number};
export type FruitMarble={x:number;y:number;vx:number;vy:number;power:number;age:number;mode:'lane'|'arc'|'field';angle:number;launchSpeed:number;seed:number;passed:number;trail:{x:number;y:number}[]};
export function launchMarble(power:number,seed:number):FruitMarble{
 power=Math.max(0,Math.min(1,power));const speed=Math.sqrt((1518+650*power)**2-290000);
 return{x:FIELD.launcherX,y:FIELD.launcherY,vx:0,vy:-speed,power,age:0,mode:'lane',angle:0,launchSpeed:speed,seed:seed>>>0,passed:0,trail:[]};
}
export function stepMarble(ball:FruitMarble,dt=1/120):Crossing|undefined{
 ball.age+=dt;
 if(ball.mode==='lane'){ball.vy+=FIELD.gravity*dt;ball.y+=ball.vy*dt;if(ball.y<=FIELD.arcY){ball.y=FIELD.arcY;ball.mode='arc';}return;}
 if(ball.mode==='arc'){
  const speed=Math.sqrt(Math.max(10000,ball.launchSpeed**2-2*FIELD.gravity*(FIELD.launcherY-ball.y)));
  ball.angle=Math.max(-Math.PI/2,ball.angle-speed/FIELD.arcRadius*dt);ball.x=FIELD.arcX+Math.cos(ball.angle)*FIELD.arcRadius;ball.y=FIELD.arcY+Math.sin(ball.angle)*FIELD.arcRadius;
  if(ball.angle<=-Math.PI/2){ball.mode='field';ball.vx=-speed;ball.vy=0;}return;
 }
 const oldY=ball.y;ball.vy+=FIELD.gravity*dt;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
 const min=FIELD.left+9,max=FIELD.right-9;
 if(ball.x<min){ball.x=min+(min-ball.x);ball.vx=Math.abs(ball.vx)*.82;}if(ball.x>max){ball.x=max-(ball.x-max);ball.vx=-Math.abs(ball.vx)*.82;}
 for(const pin of FRUIT_PINS){const dy=ball.y-pin.y;if(Math.abs(dy)>19)continue;const dx=ball.x-pin.x;if(Math.abs(dx)>19)continue;const d=Math.hypot(dx,dy);if(d<18.5){const nx=d?dx/d:1,ny=d?dy/d:0;ball.x=pin.x+nx*18.5;ball.y=pin.y+ny*18.5;const impact=ball.vx*nx+ball.vy*ny;if(impact<0){ball.vx-=1.55*impact*nx;ball.vy-=1.55*impact*ny;}ball.seed=(Math.imul(ball.seed,1664525)+1013904223)>>>0;ball.vx+=(ball.seed/4294967296-.5)*30;}}
 for(let row=0;row<TARGET_ROWS.length;row++)if(oldY<TARGET_ROWS[row]&&ball.y>=TARGET_ROWS[row]&&ball.vy>0){ball.passed|=1<<row;return{row,x:ball.x};}
}
