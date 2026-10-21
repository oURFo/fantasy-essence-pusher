import {FIELD,TARGET_ROWS} from './fruit-physics.ts';
// Sixteen equal-width pockets across the bottom. Rates are observational targets only.
const width=(FIELD.right-FIELD.left)/16;
export const FRUIT_TARGETS=Array.from({length:16},(_,id)=>({id,row:0,y:TARGET_ROWS[0],left:FIELD.left+id*width,right:FIELD.left+(id+1)*width,x:FIELD.left+(id+.5)*width}));
export function fruitTarget(row:number,x:number){return FRUIT_TARGETS.find(t=>t.row===row&&x>=t.left&&(x<t.right||(t.id===15&&x<=t.right)));}
