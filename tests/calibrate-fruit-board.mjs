import fs from 'node:fs';import {launchMarble,stepMarble,FIELD,TARGET_ROWS} from '../src/fruit-physics.ts';import {FRUIT_CELLS} from '../src/fruit-rules.ts';
let seed=98237;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const n=200000,paths=[];for(let i=0;i<n;i++){const b=launchMarble((i+random())/n,random()*4294967296),cross=[];for(let step=0;step<2400;step++){const p=stepMarble(b);if(p)cross.push(p);if(b.passed===15)break;}if(b.passed!==15)throw Error('stuck '+i);paths.push(cross);}
let survivors=paths.map((path,id)=>({id,path}));const targets=[];
for(let row=0;row<3;row++){
 const capture=new Set(),ranked=survivors.map(p=>({id:p.id,x:p.path.find(e=>e.row===row).x})).sort((a,b)=>a.x-b.x);for(let col=0;col<4;col++){
  const id=row*4+col,lo=FIELD.left+col*195,hi=lo+195,need=Math.round(n*FRUIT_CELLS[id].weight/10000);
  const candidates=ranked.slice(Math.floor(ranked.length*col/4),Math.floor(ranked.length*(col+1)/4));
  console.log({row,col,available:candidates.length,need});if(candidates.length<need)throw Error('insufficient column mass');
  const start=Math.floor((candidates.length-need)/2),selected=candidates.slice(start,start+need),left=selected[0].x-.00001,right=selected.at(-1).x+.00001;for(const p of selected)capture.add(p.id);targets.push({id,row,y:TARGET_ROWS[row],left,right,x:(left+right)/2});
 }survivors=survivors.filter(p=>!capture.has(p.id));
}
// Refine real apertures against the complete chronological crossing history,
// including balls bouncing back above a pocket row and descending again.
function upperHit(path){for(const e of path){if(e.row===3)break;for(let i=e.row*4;i<e.row*4+4;i++){const t=targets[i];if(e.x>=t.left&&e.x<t.right)return t.id;}}return -1;}
for(let epoch=0;epoch<25;epoch++){
 const counts=Array(12).fill(0);for(const path of paths){const id=upperHit(path);if(id>=0)counts[id]++;}
 const errors=counts.map((count,i)=>Math.abs(count/n-FRUIT_CELLS[i].weight/10000));console.log({epoch,maxError:Math.max(...errors)});if(Math.max(...errors)<.00004)break;
 for(let i=0;i<12;i++){const t=targets[i],desired=n*FRUIT_CELLS[i].weight/10000,half=(t.right-t.left)/2*Math.pow(desired/Math.max(1,counts[i]),.8);t.left=t.x-half;t.right=t.x+half;}
}
const bottom=paths.filter(p=>upperHit(p)<0).map(path=>({x:path.find(e=>e.row===3).x})).sort((a,b)=>a.x-b.x);let offset=0,left=FIELD.left;
for(let col=0;col<4;col++){const id=12+col,need=Math.round(n*FRUIT_CELLS[id].weight/10000),right=col===3?FIELD.right:(bottom[offset+need-1].x+bottom[offset+need].x)/2;targets.push({id,row:3,y:TARGET_ROWS[3],left,right,x:(left+right)/2});left=right;offset+=need;}
console.log(targets);fs.writeFileSync('src/fruit-board.ts','// Fixed physical pocket apertures calibrated with 200,000 uniform-force shots.\n// Geometry only: gameplay never draws or rejects a target by weight.\nexport const FRUIT_TARGETS='+JSON.stringify(targets)+';\nexport function fruitTarget(row:number,x:number){return FRUIT_TARGETS.find(t=>t.row===row&&x>=t.left&&(x<t.right||(row===3&&t.id===15&&x<=t.right)));}\n');
