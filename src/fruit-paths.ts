export const FRUIT_LEFT=80,FRUIT_RIGHT=944,FRUIT_GATE_Y=1204;
export const FRUIT_PINS:{x:number;y:number}[]=[];
for(let row=0;row<6;row++)for(let col=0;col<13;col++){
 const x=112+col*64+(row%2?32:0);if(x<930)FRUIT_PINS.push({x,y:790+row*64});
}
export type FruitPoint={x:number;y:number};
export type FruitPath={points:FruitPoint[];slot:number};
let cached:FruitPath[][]|undefined;
// Weighted goals select from real, pre-simulated round-pin trajectories. No
// live physics world or per-ball solver is needed during the visual playback.
export function fruitPaths(){
 if(cached)return cached;
 const paths:FruitPath[][]=Array.from({length:16},()=>[]);let seed=39471;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let attempt=0;attempt<6000&&paths.some(p=>p.length<3);attempt++){
  let x=90+random()*844,y=729,vx=(random()-.5)*240,vy=40;const points:FruitPoint[]=[];
  for(let tick=0;tick<720;tick++){
   vy+=1450/120;x+=vx/120;y+=vy/120;
   if(x<89){x=89;vx=Math.abs(vx)*.85;}if(x>935){x=935;vx=-Math.abs(vx)*.85;}
   for(const pin of FRUIT_PINS){if(Math.abs(y-pin.y)>19||Math.abs(x-pin.x)>19)continue;const dx=x-pin.x,dy=y-pin.y,d=Math.hypot(dx,dy);if(d<18.5){const nx=d?dx/d:1,ny=d?dy/d:0;x=pin.x+nx*18.5;y=pin.y+ny*18.5;const impact=vx*nx+vy*ny;if(impact<0){vx-=1.65*impact*nx;vy-=1.65*impact*ny;}vx+=dx>=0?2:-2;}}
   if(tick%2===0)points.push({x,y});
   if(y>=FRUIT_GATE_Y){const slot=Math.max(0,Math.min(15,Math.floor((x-FRUIT_LEFT)/54)));points.push({x,y:FRUIT_GATE_Y});if(paths[slot].length<3)paths[slot].push({points,slot});break;}
  }
 }
 if(paths.some(p=>p.length<3))throw new Error('Unreachable fruit goal');
 cached=paths;return paths;
}
