import type {FateOrbit} from './fate-game.ts';
export function fateRewardPresentation(g:Pick<FateOrbit,'time'|'notices'>){
 const grand=g.notices.filter(n=>n.award===9999&&g.time-n.time>=0&&g.time-n.time<8).at(-1);
 const rewards=g.notices.filter(n=>n.lane===4&&n.award>0&&g.time-n.time>=0&&g.time-n.time<3.5).slice(-3);
 return {grand,rewards};
}
export function drawFateRewards(c:CanvasRenderingContext2D,g:FateOrbit,w:number,h:number,reduced:boolean){
 const {grand,rewards}=fateRewardPresentation(g);if(!grand&&!rewards.length)return;
 c.save();c.scale(w/1024,h/1536);
 const text=(s:string,y:number,size:number,color='#fff0bd')=>{c.font=`700 ${size}px "Microsoft JhengHei",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(s,512,y);};
 if(grand){
  const age=g.time-grand.time,fade=Math.min(1,(8-age)/.7);c.globalAlpha=fade;
  const glow=c.createRadialGradient(512,680,20,512,680,1100);glow.addColorStop(0,'#eebd5355');glow.addColorStop(.6,'#332056bb');glow.addColorStop(1,'#060b20dd');c.fillStyle=glow;c.fillRect(0,0,1024,1536);
  if(!reduced){
   c.save();c.translate(512,680);c.rotate(age*.12);for(let i=0;i<18;i++){c.rotate(Math.PI/9);c.fillStyle=i%2?'#ffdc7722':'#fff0b50c';c.beginPath();c.moveTo(0,0);c.lineTo(-70,-1500);c.lineTo(70,-1500);c.fill();}c.restore();
   for(let i=0;i<96;i++){const t=(age+(i%12)*.21)%3.2,a=i*2.39996,x=512+Math.cos(a)*t*230,y=660+Math.sin(a)*t*230+t*t*70;c.save();c.globalAlpha=fade*(1-t/3.2);c.translate(x,y);c.rotate(a+t*2);c.fillStyle=['#ffe08c','#99ebff','#e7b7ff'][i%3];c.fillRect(-4,-8,8,16);c.restore();}
   for(let i=0;i<3;i++){const r=((age+i*.38)%1.8)*650;c.strokeStyle='#ffe7a066';c.lineWidth=4;c.beginPath();c.arc(512,680,r,0,Math.PI*2);c.stroke();}
  }
  c.strokeStyle='#f8d37a';c.lineWidth=12;c.strokeRect(22,22,980,1492);
  c.fillStyle='#11152bea';c.beginPath();c.roundRect(100,505,824,365,32);c.fill();c.strokeStyle='#f5d386';c.lineWidth=3;c.stroke();
  text('四 紅 連 通 · 天 命 大 獎',565,39);c.shadowColor='#ffc85b';c.shadowBlur=reduced?0:35;text('9,999',685,136);c.shadowBlur=0;text('積分已入帳',800,36,'#e6f5ff');
 }else for(const [i,n] of rewards.entries()){
  const age=g.time-n.time,alpha=Math.min(1,(3.5-age)/.4,reduced?1:age/.15);c.globalAlpha=alpha;
  const y=630+i*174-(reduced?0:Math.max(0,.2-age)*90);
  c.fillStyle='#0b2034ed';c.strokeStyle='#d9bd78';c.lineWidth=3;c.shadowColor='#8ce3ed';c.shadowBlur=reduced?0:18;c.beginPath();c.roundRect(172,y,680,150,22);c.fill();c.stroke();c.shadowBlur=0;
  text(`第 ${(n.level??0)+1} 層 · 星盤獎勵`,y+40,28,'#b9e7ee');text(`＋${n.award.toLocaleString()} 積分`,y+100,48);
 }
 c.restore();
}
