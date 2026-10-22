export const FATE_COST=3,POINTS_PER_GOLD=10,FATE_JACKPOT=9999;
export const FATE_LANES=[0,10,20,40,'fate',40,20,10,0] as const;
export const FATE_LEVELS=[
 {name:'初啟星盤',holes:3,min:51,max:89,color:'#84dfce'},
 {name:'銀河星盤',holes:4,min:101,max:179,color:'#7dc8ff'},
 {name:'曙光星盤',holes:5,min:251,max:449,color:'#d4a5ff'},
 {name:'天命星盤',holes:6,min:601,max:999,color:'#ffd47d'},
] as const;
export const FATE_BOARD={left:-3.6,right:3.6,top:10.7,gateY:10,ballRadius:.18,maxAngle:55,speed:4.6,slopeGravity:3.6} as const;
export const FATE_CANNON={pivotY:-1.35,length:2,width:2,height:2.67} as const;
export const FATE_PINS:{x:number;y:number;radius:number}[]=[];
for(const [y,xs] of [
 [1.9,[-2.9,-1.75,-.6,.55,1.7,2.85]],
 [2.75,[-2.3,-1.15,0,1.3,2.6]],
 [3.6,[-2.85,-1.65,-.45,.85,2.05,3.0]],
 [4.7,[-2.9,-2.05,2.1,3.0]],
 [6.15,[-3.0,-2.05,2.0,2.95]],
 [7.4,[-2.85,-1.65,-.4,.9,2.1,3.05]],
 [8.6,[-2.5,-1.4,1.5,2.65]],
] as [number,number[]][])for(const x of xs)if(Math.hypot(x,y-5.45)>1.75)FATE_PINS.push({x,y,radius:.10});
// A diagonal crown intercepts the central approach, leaving genuine side routes into fate.
for(const [x,y] of [[-.3,8.5],[.15,8.9]])FATE_PINS.push({x,y,radius:.12});
export const DISC={trackRadius:.27,startRadius:.90,holeRadius:.085,ballRadius:.045,motorSpeed:.10,minSpeed:2.8,maxSpeed:4.2} as const;
export function fateLane(x:number){return Math.max(0,Math.min(8,Math.floor((x-FATE_BOARD.left)/.8)));}
export function fateAward(level:number,unit:number){const c=FATE_LEVELS[level];return c.min+Math.floor(Math.max(0,Math.min(1-Number.EPSILON,unit))*(c.max-c.min+1));}
export function discHolePosition(count:number,index:number,angle:number){const a=-Math.PI/2+index*Math.PI*2/count+angle;return{x:DISC.trackRadius*Math.cos(a),y:DISC.trackRadius*Math.sin(a)};}
export function fateDiscExpectation(probabilities=FATE_LEVELS.map(c=>1/c.holes)){
 let reach=1,expected=0;for(let level=0;level<4;level++){const c=FATE_LEVELS[level],p=probabilities[level];expected+=reach*(1-p)*(c.min+c.max)/2;reach*=p;}return expected+reach*FATE_JACKPOT;
}
