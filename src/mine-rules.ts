export const MINE={cost:1,cooldown:.5,pointsPerGold:10,greenPoints:14,trainChance:.005,goldSeconds:100,departSeconds:3,returnSeconds:3,ballRadius:9,gravity:440} as const;
export const MINE_PORTS=[{x:260,y:530,kind:'score'},{x:755,y:510,kind:'score'},{x:410,y:850,kind:'score'},{x:640,y:1100,kind:'slot'},{x:500,y:1180,kind:'out'}] as const;
export const MINE_SLOT=[{name:'煤礦',balls:5,weight:100,sprite:4},{name:'銅礦',balls:10,weight:60,sprite:5},{name:'銀礦',balls:20,weight:20,sprite:6},{name:'金礦',balls:30,weight:10,sprite:7},{name:'紅寶石',balls:50,weight:4,sprite:7},{name:'鑽石',balls:100,weight:1,sprite:6},{name:'黃金礦車',balls:200,weight:1,sprite:1}] as const;
export const MINE_SLOT_TOTAL=1000;
export function mineSlotDraw(unit:number){let n=Math.min(.999999999,Math.max(0,unit))*MINE_SLOT_TOTAL;for(let i=0;i<MINE_SLOT.length;i++){n-=MINE_SLOT[i].weight;if(n<0)return i;}return -1;}
export const MINE_PINS:{x:number;y:number;r:number}[]=[];
for(let row=0;row<15;row++){const y=340+row*53;for(let col=0;col<13;col++){const x=155+col*56+(row%2?28:0);if(x>870||(x>805&&y>380))continue;if(MINE_PORTS.some(p=>Math.hypot(x-p.x,y-p.y)<49))continue;if(y>1000&&x>590&&x<695)continue;if(x>645&&Math.abs(y-(1114-.58*(x-640)))<42)continue;if(x>580&&y>775&&y<900)continue;MINE_PINS.push({x,y,r:6});}}
// Gentle offset guards avoid exact vertical rests while leaving an open ball-width entrance.
for(const p of MINE_PORTS.filter(p=>p.kind==='score'))for(const [dx,dy] of [[-37,-24],[39,-17],[-28,32],[30,34]])MINE_PINS.push({x:p.x+dx,y:p.y+dy,r:6});
export function mineBowl(x:number){return 1195-.00105*(x-500)**2;}

export const MINE_RIGHT_ROOF={left:822,right:938,y:245} as const;

// Staggered guard pins shed approaches from the left while leaving the right rail exit open.
MINE_PINS.push({x:590,y:1040,r:7},{x:610,y:1064,r:7},{x:614,y:1090,r:7},{x:638,y:1055,r:7});
export const MINE_SLOT_TIMING={spin:1.6,result:.8,firstStop:.5,stopGap:.35,scroll:1000} as const;
