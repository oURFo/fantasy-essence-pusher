import type {Coin} from './physics.ts';
// Snapshot once per bead: sort comparisons must never cross the WASM boundary.
export function skyDrawOrder(coins:readonly Coin[]){
 return coins.map(coin=>{
  const p=coin.body.translation();
  const depth=coin.entered&&p.y<0&&p.z>6.65?10000+p.z*44-p.y*48:coin.entered?p.z*44+p.y*25:-p.y*48;
  return{coin,p,depth};
 }).sort((a,b)=>a.depth-b.depth);
}
