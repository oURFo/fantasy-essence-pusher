import {SkyWings} from './sky-game.ts';
import {SKY_PEGS,SKY_TIERS} from './sky-rules.ts';
import {OUTLETS,SPLITTER} from './config.ts';
import {SKY_FRONT,skyProject as project,skyExitEdges} from './sky-geometry.ts';
const names=['sky-wings/base.png','sky-wings/azure.png','sky-wings/gold.png','sky-wings/wheel.png','sprites.png','green-bead.png','platform.png','side-pipe.png','triangle-splitter.png','prize-gates.png','sky-wings/wings-v2.png','sky-wings/collection-bay-v2.png'];
const art=names.map(()=>new Image());
let ready:Promise<void>|undefined;
export function loadSkyArtwork(){
 if(!ready){art.forEach((img,i)=>img.src=new URL(`./assets/${names[i]}`,document.baseURI).href);ready=Promise.all(art.map(img=>img.decode())).then(()=>{}).catch(e=>{ready=undefined;throw e;});}
 return ready;
}
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const tau=Math.PI*2;
function text(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,size=22,color='#fff5db'){
 ctx.font=`600 ${size}px "Microsoft JhengHei",sans-serif`;ctx.textAlign='center';ctx.fillStyle=color;ctx.shadowColor='#10282e';ctx.shadowBlur=5;ctx.fillText(value,x,y);ctx.shadowBlur=0;
}
function panel(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){ctx.fillStyle='#092734dc';ctx.beginPath();ctx.roundRect(x,y,w,h,14);ctx.fill();}
function wings(ctx:CanvasRenderingContext2D,tier:number,x:number,y:number,w:number){
 const img=art[10],bounds=[[0,300],[295,335],[630,394]][tier],scale=img.naturalHeight/1024;
 ctx.drawImage(img,0,bounds[0]*scale,img.naturalWidth,bounds[1]*scale,x-w/2,y,w,w*bounds[1]/1536);
}
export function renderSky(game:SkyWings){
 const canvas=document.getElementById('game') as HTMLCanvasElement,ctx=canvas.getContext('2d')!;
 const r=game.sky,tier=r.tier,accent=r.config.color;
 ctx.clearRect(0,0,1024,1536);ctx.drawImage(art[tier],0,0,1024,1536);
 if(r.settling){
  const progress=Math.min(1,r.elapsed/10),next=r.phase==='upgrading'?tier+1:0;
  ctx.save();ctx.globalAlpha=progress;ctx.drawImage(art[next],0,0,1024,1536);ctx.restore();
 }
 const edges=skyExitEdges();
 const drawBay=(theme:number,alpha=1)=>{
  ctx.save();ctx.globalAlpha=alpha;
  ctx.filter=theme===1?'saturate(.15) brightness(1.15)':theme===2?'sepia(.9) saturate(1.5)':'';
  ctx.drawImage(art[11],edges[0],SKY_FRONT.panelTop,edges[3]-edges[0],SKY_FRONT.panelHeight);ctx.restore();
 };
 drawBay(tier);if(r.settling)drawBay(r.phase==='upgrading'?tier+1:0,Math.min(1,r.elapsed/10));
 // The wheel is inset into the backboard; physical beads and pins remain in front.
 const wx=512,wy=520,rad=112;
 ctx.save();ctx.translate(wx,wy);ctx.rotate(r.angle);ctx.filter=tier===1?'saturate(.4) brightness(1.25)':tier===2?'sepia(.8) saturate(1.7)':'';
 ctx.save();ctx.rotate(-Math.PI/8);ctx.drawImage(art[3],-rad,-rad,rad*2,rad*2);ctx.restore();ctx.restore();
 const atlas=art[4],as=atlas.naturalWidth/1280;
 for(const peg of SKY_PEGS){const p=project(peg.x,peg.y,.25),size=22*peg.radius/.105;ctx.drawImage(atlas,770*as,230*as,330*as,330*as,p.x-size/2,p.y-size/2,size,size);}
 // Treat reward labels as a legible display overlay, above the small pin heads.
 ctx.save();ctx.translate(wx,wy);ctx.rotate(r.angle);
 const rewards=SKY_TIERS[r.phase==='spinning'||r.phase==='result'?r.spinTier:tier].rewards;
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4-Math.PI/2;ctx.save();ctx.translate(Math.cos(a)*82,Math.sin(a)*82);ctx.rotate(-r.angle);
  if(rewards[i]===0)wings(ctx,Math.min(2,tier+1),0,-6,43);
  else {
   const label=String(rewards[i]);
   // Keep each value upright while its sector travels around the wheel.
   // An opaque outline separates the larger digits from both enamel colors.
   ctx.font=`900 ${label.length===4?28:34}px "Segoe UI","Microsoft JhengHei",sans-serif`;
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=6;
   ctx.strokeStyle='#092a2c';ctx.fillStyle='#fff9da';ctx.shadowColor='#001419';ctx.shadowBlur=3;
   ctx.strokeText(label,0,0,64);ctx.fillText(label,0,0,64);
  }
  ctx.restore();
 }
 ctx.restore();text(ctx,'▼',wx,wy-rad+9,29,'#fff0a3');
 const drop=project(game.dropX,10.1,0);ctx.drawImage(atlas,20*as,710*as,520*as,400*as,drop.x-42,drop.y-32,84,64);
 const gs=art[9].naturalWidth/2048,gateLeft=project(-3.65,2.45,.25).x,gw=7.3*87/7;
 for(let i=0;i<=7;i++)ctx.drawImage(art[9],879*gs,160*gs,30*gs,365*gs,gateLeft+i*gw-5,662,10,77);
 for(let i=0;i<7;i++){
  const lit=game.time-game.slotLights[i]<.7,active=(r.config.lanes as readonly number[]).includes(i);
  const x=gateLeft+(i+.5)*gw;
  if(active){ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=lit?30:10;text(ctx,'✦',x,728,lit?36:28,accent);ctx.restore();}
 }
 const frontY=project(0,.7,game.pushZ).y,ps=art[6].naturalWidth/2048;
 ctx.save();ctx.beginPath();ctx.moveTo(180,788);ctx.lineTo(844,788);ctx.lineTo(970,1100);ctx.lineTo(54,1100);ctx.closePath();ctx.clip();
 ctx.filter=tier===1?'saturate(.15) brightness(1.7)':tier===2?'sepia(.5) brightness(1.4)':'saturate(.5) brightness(1.4)';
 ctx.drawImage(art[6],28*ps,166*ps,1990*ps,264*ps,48,766,928,frontY-766);
 ctx.drawImage(art[6],28*ps,430*ps,1990*ps,140*ps,48,frontY,928,30);ctx.restore();
 for(const [outlet,left,last] of [[OUTLETS.leftPipe,true,game.lastLeftEject],[OUTLETS.pipe,false,game.lastRightEject]] as const){
  const p=project(outlet.x,outlet.y,outlet.z);ctx.save();ctx.translate(p.x,p.y);if(left)ctx.scale(-1,1);
  ctx.filter='brightness(1.4) saturate(.5)';if(game.time-last<.18){ctx.shadowColor=accent;ctx.shadowBlur=24;}ctx.drawImage(art[7],-62,-31,124,62);ctx.restore();
 }
 const depth=(c:typeof game.coins[number])=>{
  const p=c.body.translation();
  // Front-edge falls belong in front of the bed, even as their world Y drops.
  if(c.entered&&p.y<0&&p.z>6.65)return 10000+p.z*44-p.y*48;
  return c.entered?p.z*44+p.y*25:-p.y*48;
 };
 let drawn=false;const drawSplitter=()=>{const p=project(SPLITTER.x,SPLITTER.height/2,SPLITTER.z);ctx.drawImage(art[8],p.x-35,p.y-33,70,66);drawn=true;};
 for(const coin of [...game.coins].sort((a,b)=>depth(a)-depth(b))){
  if(!drawn&&depth(coin)>=SPLITTER.z*44+SPLITTER.height*12.5)drawSplitter();
  const p=coin.body.translation(),s=project(p.x,p.y,p.z),size=coin.entered?42+Math.max(0,p.z)*1.8:44;
  ctx.save();ctx.beginPath();ctx.rect(54,230,916,1220);ctx.clip();
  if(coin.entered&&p.y>=0&&p.y<1.2){ctx.fillStyle='#09231e44';ctx.beginPath();ctx.ellipse(s.x,s.y+size*.38,size*.38,size*.13,0,0,tau);ctx.fill();}
  ctx.filter=tier===1?'hue-rotate(65deg) saturate(1.35) brightness(1.15)':tier===2?'sepia(1) saturate(3) hue-rotate(5deg) brightness(1.25)':'saturate(.8) brightness(1.15)';const sz=size/.84;ctx.drawImage(art[5],s.x-sz/2,s.y-sz/2,sz,sz);ctx.restore();
 }
 if(!drawn)drawSplitter();
 // The fascia is already in the background. Repainting its rectangular crop
 // here used to cut off beads at the lip and hide the visible fall below it.
 if(game.time-game.lastRewardTime<1.3){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=1-(game.time-game.lastRewardTime)/1.3;const halo=ctx.createRadialGradient(512,SKY_FRONT.jewelY,5,512,SKY_FRONT.jewelY,100);halo.addColorStop(0,accent);halo.addColorStop(1,'transparent');ctx.fillStyle=halo;ctx.fillRect(412,SKY_FRONT.jewelY-100,200,200);ctx.restore();}
 panel(ctx,205,216,614,74);text(ctx,'空 之 翼',512,245,23,accent);text(ctx,r.message,512,275,20);
 if(r.phase==='result'){
  const t=r.clock-r.resultAt,large=r.lastAmount>=100,jackpot=r.lastAmount===1000,duration=jackpot?4.5:large?2.4:1.4;
  ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=reducedMotion.matches?0:large?40:15;ctx.strokeStyle=accent;ctx.globalAlpha=Math.max(0,1-t/duration)*(reducedMotion.matches?.3:1);ctx.lineWidth=large?12:5;ctx.strokeRect(22,22,980,1492);ctx.restore();
  if(large){
   ctx.save();ctx.globalAlpha=Math.min(1,t*3)*Math.min(1,(duration-t)*2);ctx.shadowColor=accent;ctx.shadowBlur=reducedMotion.matches?0:35;
   const w=jackpot?780:610;wings(ctx,tier,512,302,w);ctx.restore();
   if(!reducedMotion.matches)for(let i=0;i<(jackpot?36:14);i++){
    const a=i*2.399,x=512+Math.cos(a)*(65+t*90),y=550+Math.sin(a)*(50+t*110)-t*50;
    ctx.save();ctx.translate(x,y);ctx.rotate(a+t);ctx.globalAlpha=Math.max(0,1-t/duration);ctx.fillStyle=accent;ctx.beginPath();ctx.ellipse(0,0,jackpot?12:8,3,0,0,tau);ctx.fill();ctx.restore();
   }
  }
  if(large){panel(ctx,210,815,604,88);text(ctx,r.lastAmount===1000?'天 域 賜 福':`獲得 ${r.lastAmount} 精華`,512,870,38,accent);}
  if(jackpot){panel(ctx,310,910,404,70);text(ctx,'1,000 精華',512,958,40,'#fff1b6');}
 }
 if(r.settling){
  const up=r.phase==='upgrading',duration=10,t=r.elapsed/duration;
  ctx.save();ctx.fillStyle='#dff9ff';ctx.globalAlpha=reducedMotion.matches?.08:.12+Math.sin(t*Math.PI)*.2;ctx.fillRect(0,0,1024,1536);ctx.restore();
  // AI-painted wing crown expands while drifting cloud lights travel downward.
  ctx.save();ctx.globalAlpha=.95;const w=reducedMotion.matches?680:680+Math.sin(t*Math.PI)*190;wings(ctx,up?Math.min(2,tier+1):0,512,reducedMotion.matches?365:365-t*55,w);ctx.restore();
  if(!reducedMotion.matches)for(let i=0;i<18;i++){const x=70+(i*151)%890,y=((r.clock*220+i*97)%1300)+150;ctx.save();ctx.globalAlpha=.25;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x,y,20+(i%3)*10,5,0,0,tau);ctx.fill();ctx.restore();}
  panel(ctx,180,610,664,150);text(ctx,up?'振翅，飛向更高的天空':'收翼返航',512,655,30,accent);text(ctx,r.message,512,709,33);
 }
}
