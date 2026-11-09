import {GuanyinGrace} from '../src/guanyin-game.ts';
import {PlayerWallet} from '../src/wallet.ts';
import {GUANYIN,GUANYIN_OUTS,guanyinSeed} from '../src/guanyin-rules.ts';
export function simulateGuanyin(seed,shots=5000,power=8){const wallet=new PlayerWallet();wallet.setBalance(1e8);const g=new GuanyinGrace(wallet,guanyinSeed(seed));g.setPower(power);g.setAutoDrop(true);let frames=0;while((g.paidShots<shots||g.balls.length||g.pendingBalls||g.pourRemaining||g.slotQueue||g.slotPhase!=='idle')&&frames<shots*150+60000){if(g.paidShots>=shots)g.firing=false;g.step();frames++;}return {seed,power,shots:g.paidShots,cost:g.paidShots*3,points:g.totalPoints,rtp:g.totalPoints/10/(g.paidShots*3),scored:g.scored,outs:g.outs,slotEntries:g.slotEntries,gifts:g.emittedGift,bottleBalls:g.emittedBottle,bottleRemaining:g.bottle,ledger:g.ledger,seconds:g.time,unfinished:g.balls.length+g.pendingBalls+g.pourRemaining+g.slotQueue};}

if(process.argv[1]?.endsWith('guanyin-balance.mjs')){
 const {readFileSync,writeFileSync}=await import('node:fs');
 const setRadius=r=>{GUANYIN.outRadius=r;for(const p of GUANYIN_OUTS)p.r=r;};
 const pooled=rows=>rows.reduce((s,r)=>s+r.points,0)/rows.reduce((s,r)=>s+r.cost*10,0);
 if(process.argv.includes('--fit')){let lo=25,hi=49;for(let i=0;i<7;i++){const r=(lo+hi)/2;setRadius(r);const rows=[3,8,13].map(p=>simulateGuanyin(7100+p,1500,p)),rtp=pooled(rows);console.log('Fit',r,rtp);if(rtp>.92)lo=r;else hi=r;}const radius=Number(((lo+hi)/2).toFixed(4));setRadius(radius);writeFileSync('src/guanyin-rules.ts',readFileSync('src/guanyin-rules.ts','utf8').replace(/outRadius:[\d.]+/,`outRadius:${radius}`));}
 const rows=Array.from({length:15},(_,i)=>simulateGuanyin(9200+i,3000,i+1));
 const report={date:'2026-11-09',config:GUANYIN,definition:'Full physical simulation, 15 fixed power settings, 3000 paid balls per setting, 3 coins each. Includes all free-ball reentries, bottle growth and refill, willow shutter movement/collision, queued slots and complete drain. Independent seeds from fit. No outcome rerouting.',rows,rtp:pooled(rows),target:.92,notes:'Pooled reference for uniform power selection. Individual settings and short sessions vary. Bottle leftovers at exit have no cash value; unplayed state resets.'};writeFileSync('guanyin-balance-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({radius:GUANYIN.outRadius,rtp:report.rtp,rows:rows.map(r=>({power:r.power,rtp:r.rtp,unfinished:r.unfinished}))},null,2));
}
