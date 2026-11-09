export const GUANYIN={cost:3,pointsPerGold:10,score:40,gravity:680,shotInterval:.5,refillEvery:20,initialBottle:50,gateSeconds:10,gateMoveSeconds:.45,slotSeconds:1.5,resultSeconds:.65,bonusInterval:.15,maxActive:150,outRadius:34.8,rtp:.92} as const;
export const GUANYIN_SYMBOLS=[{name:'淨瓶',balls:0,color:'#9ff9e6'},{name:'楊柳枝',balls:0,color:'#b2f8a5'},{name:'蓮花',balls:10,color:'#ffbbdf'},{name:'數珠',balls:5,color:'#ffd89a'},{name:'寶珠',balls:3,color:'#8cdefa'},{name:'經卷',balls:2,color:'#fff2cd'}] as const;
// Outcome weights are calibrated together with physical OUT/slot entry rates.
export const GUANYIN_WEIGHTS=[.007,.07,.04,.08,.12,.2] as const;
export const GUANYIN_SCORE={x:512,y:1267,r:24,gap:20};
export function guanyinBowlY(x:number){return 1266-104*((x-512)/358)**2;}
export const GUANYIN_LAUNCH={x:122,y:1280,bendX:222,bendY:420,radius:100,vertical:860,length:860+Math.PI*50};
export function guanyinRailPoint(distance:number){if(distance<=860)return {x:122,y:1280-distance,tx:0,ty:-1};const a=Math.PI+Math.min(Math.PI/2,(distance-860)/100);return {x:222+100*Math.cos(a),y:420+100*Math.sin(a),tx:-Math.sin(a),ty:Math.cos(a)};}
export const GUANYIN_SLOT={x:512,y:845,r:20};
export const GUANYIN_OUTS=[220,366,512,658,804].map(x=>({x,y:1135,r:GUANYIN.outRadius}));
export const GUANYIN_PINS:{x:number;y:number;r:number}[]=[];
for(let row=0;row<12;row++)for(let col=0;col<11;col++){const x=177+col*65+(row%2?30:0),y=440+row*57;if(x<184||x>840||Math.hypot(x-GUANYIN_SLOT.x,y-GUANYIN_SLOT.y)<55)continue;GUANYIN_PINS.push({x,y,r:7});}
const guards=[{x:481,y:800,r:8},{x:543,y:800,r:8},{x:512,y:764,r:8}];for(let i=GUANYIN_PINS.length-1;i>=0;i--)if(guards.some(g=>Math.hypot(g.x-GUANYIN_PINS[i].x,g.y-GUANYIN_PINS[i].y)<42))GUANYIN_PINS.splice(i,1);
// Keep head/face of the central Guanyin artwork unobstructed.
for(let i=GUANYIN_PINS.length-1;i>=0;i--)if(GUANYIN_PINS[i].x>470&&GUANYIN_PINS[i].x<555&&GUANYIN_PINS[i].y<500)GUANYIN_PINS.splice(i,1);
GUANYIN_PINS.push({x:481,y:800,r:8},{x:543,y:800,r:8},{x:512,y:764,r:8});
export function guanyinOutcome(unit:number){let at=0;for(let i=0;i<GUANYIN_WEIGHTS.length;i++){at+=GUANYIN_WEIGHTS[i];if(unit<at)return i;}return -1;}
export function guanyinReels(outcome:number,unit:number):number[]{if(outcome>=0)return [outcome,outcome,outcome];const a=Math.min(5,Math.floor(unit*6));return [a,(a+1)%6,(a+3)%6];}
export function guanyinSeed(seed:number){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
