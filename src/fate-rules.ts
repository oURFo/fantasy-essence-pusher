export const FATE_COST=3,POINTS_PER_GOLD=10,FATE_JACKPOT=9999;
export const FATE_LANES=[0,10,20,40,'fate',40,20,10,0] as const;
export const FATE_LEVELS=[
 {name:'初啟星盤',holes:3,min:51,max:89,color:'#84dfce'},
 {name:'銀河星盤',holes:4,min:101,max:179,color:'#7dc8ff'},
 {name:'曙光星盤',holes:5,min:251,max:449,color:'#d4a5ff'},
 {name:'天命星盤',holes:6,min:601,max:999,color:'#ffd47d'},
] as const;
export const FATE_BOARD={left:-3.6,right:3.6,top:10.7,gateY:10,ballRadius:.125,maxAngle:55,speed:20.5} as const;
export const FATE_PINS:{x:number;y:number;radius:number}[]=[];
for(const [row,y] of [2.5,3.8,5.25,6.7,8.35].entries())for(let col=0;col<6;col++){const x=-2.85+col*1.12+(row%2?.28:0);if(Math.abs(x)<3.3&&!(row===2&&Math.abs(x)<1))FATE_PINS.push({x:row===4&&Math.abs(x)<.7?Math.sign(x)*.8:x,y,radius:.125});}
export const DISC={trackRadius:.64,startRadius:.94,holeRadius:.105,ballRadius:.038,motorSpeed:.34,minSpeed:4,maxSpeed:24} as const;
export function fateLane(x:number){return Math.max(0,Math.min(8,Math.floor((x-FATE_BOARD.left)/.8)));}
export function fateAward(level:number,unit:number){const c=FATE_LEVELS[level];return c.min+Math.floor(Math.max(0,Math.min(1-Number.EPSILON,unit))*(c.max-c.min+1));}
export function discHolePosition(count:number,index:number,angle:number){const a=-Math.PI/2+index*Math.PI*2/count+angle;return{x:DISC.trackRadius*Math.cos(a),y:DISC.trackRadius*Math.sin(a)};}
export function fateDiscExpectation(probabilities=FATE_LEVELS.map(c=>1/c.holes)){
 let reach=1,expected=0;for(let level=0;level<4;level++){const c=FATE_LEVELS[level],p=probabilities[level];expected+=reach*(1-p)*(c.min+c.max)/2;reach*=p;}return expected+reach*FATE_JACKPOT;
}
