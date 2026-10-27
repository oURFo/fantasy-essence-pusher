import {GoldMine} from './mine-game.ts';
import {MINE,MINE_PORTS,MINE_PINS,MINE_SLOT,MINE_SLOT_TIMING,MINE_RIGHT_ROOF,MINE_TRAIN,mineBowl} from './mine-rules.ts';
const background=new Image(),sheet=new Image(),sprites:HTMLCanvasElement[]=[];let ready:Promise<void>|undefined;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
export function loadMineArtwork(){return ready??=Promise.all([['cabinet',background],['sprites',sheet]].map(async([name,img])=>{const image=img as HTMLImageElement;image.src=new URL(`./assets/gold-mine/${name}.png`,document.baseURI).href;await image.decode();})).then(()=>{for(const [x,y,w,h] of [[0,160,490,300],[495,155,340,310],[860,175,275,300],[1160,145,365,340],[15,560,370,370],[400,560,370,370],[785,545,355,390],[1160,565,365,365]]){const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d')!.drawImage(sheet,x,y,w,h,0,0,w,h);sprites.push(c);}}).catch(e=>{ready=undefined;throw e;});}
function text(c:CanvasRenderingContext2D,s:string,x:number,y:number,size=24,color='#ffe3a1'){c.fillStyle=color;c.font=`700 ${size}px "Microsoft JhengHei",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(s,x,y);}
function art(c:CanvasRenderingContext2D,id:number,x:number,y:number,w:number,h=w){c.drawImage(sprites[id],x-w/2,y-h/2,w,h);}
function panel(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){c.fillStyle='#071b20f5';c.strokeStyle='#d5ac51';c.lineWidth=4;c.beginPath();c.roundRect(x,y,w,h,20);c.fill();c.stroke();}
function symbol(c:CanvasRenderingContext2D,index:number,x:number,y:number,w:number){const item=MINE_SLOT[index];c.save();if(index===4)c.filter='hue-rotate(305deg) saturate(2)';if(index===5)c.filter='hue-rotate(155deg) saturate(1.6)';art(c,item.sprite,x,y,w);c.restore();}
let cachedBoard:HTMLCanvasElement|undefined,cachedPins:HTMLCanvasElement|undefined;
function minePins(){if(!cachedPins){cachedPins=document.createElement('canvas');cachedPins.width=1024;cachedPins.height=1536;const c=cachedPins.getContext('2d')!;for(const p of MINE_PINS)art(c,2,p.x,p.y,14,14);}return cachedPins;}
function mineBase(){if(!cachedBoard){cachedBoard=document.createElement('canvas');cachedBoard.width=1024;cachedBoard.height=1536;const c=cachedBoard.getContext('2d')!;c.drawImage(background,0,0,1024,1536);
 text(c,'金 礦 傳 說',512,172,50,'#3b2708');text(c,'GOLD MINE LEGEND',512,214,18,'#63460d');
 // Physical bowl and launch rail stay legible above the painted cabinet.
 c.strokeStyle='#d1b273';c.lineWidth=8;c.beginPath();for(let x=138;x<=886;x+=4){if(x===138)c.moveTo(x,mineBowl(x));else c.lineTo(x,mineBowl(x));}c.stroke();
 c.strokeStyle='#e5b55a';c.lineWidth=7;c.beginPath();c.moveTo(665,1100);c.lineTo(886,971);c.stroke();
 c.strokeStyle='#b6c5c866';c.lineWidth=5;c.beginPath();c.moveTo(125,1260);c.lineTo(125,300);c.quadraticCurveTo(125,230,260,235);c.bezierCurveTo(440,210,700,210,855,270);c.stroke();

 c.strokeStyle='#bed5dc';c.lineWidth=5;for(const x of [900,924]){c.beginPath();c.moveTo(x,1260);c.lineTo(x,300);c.quadraticCurveTo(x,270,855,270);c.stroke();}c.strokeStyle='#d8ad57';c.lineWidth=14;c.beginPath();c.moveTo(MINE_RIGHT_ROOF.left,MINE_RIGHT_ROOF.y);c.lineTo(MINE_RIGHT_ROOF.right,MINE_RIGHT_ROOF.y);c.stroke();for(const x of [MINE_RIGHT_ROOF.left,MINE_RIGHT_ROOF.right])art(c,2,x,MINE_RIGHT_ROOF.y,19);art(c,3,912,1250,43);
 for(const p of MINE_PORTS){const color=p.kind==='score'?'#4aff9c':p.kind==='slot'?'#3fd8ff':'#ff5656';c.save();c.shadowColor=color;c.shadowBlur=12;art(c,3,p.x,p.y,64);c.strokeStyle=color;c.lineWidth=4;c.beginPath();c.arc(p.x,p.y,24,0,Math.PI*2);c.stroke();c.restore();text(c,p.kind==='score'?`＋${MINE.greenPoints}`:p.kind==='slot'?'SLOT':'OUT',p.x,p.y+47,19,color);}
}
return cachedBoard;}
export function renderMine(g:GoldMine){const canvas=document.getElementById('game') as HTMLCanvasElement,c=canvas.getContext('2d')!;const bonus=g.train==='gold'||g.train==='departing',winAge=g.time-g.winAt,grand=g.lastSlotAward>=100&&winAge<6;
 c.drawImage(mineBase(),0,0);
 // Slot is embedded in the backboard: pins and balls are drawn above it, with no slot collider.
 panel(c,322,605,380,167);const spinning=g.slotPhase==='spin',elapsed=g.time-g.slotAt;
 for(let i=0;i<3;i++){const stop=elapsed>MINE_SLOT_TIMING.firstStop+i*MINE_SLOT_TIMING.stopGap,index=spinning?(stop?(g.spinResult>=0?g.spinResult:(i*2+1)%7):Math.floor(g.time*22+i*2)%7):g.slotIndex>=0?g.slotIndex:(i*2+1)%7;c.save();c.beginPath();c.rect(334+i*120,620,112,115);c.clip();if(spinning&&!stop){for(let j=-1;j<=1;j++)symbol(c,(index+j+7)%7,390+i*120,677+j*108+(g.time*MINE_SLOT_TIMING.scroll%108),87);}else symbol(c,index,390+i*120,679,92);c.restore();}
 if(spinning&&elapsed>MINE_SLOT_TIMING.firstStop+MINE_SLOT_TIMING.stopGap&&g.spinResult>=0){c.save();c.shadowColor='#ff9b38';c.shadowBlur=reduced.matches?0:25;text(c,'激 熱 · REACH',512,575,32,'#ffe078');c.restore();}
 text(c,spinning?'礦脈探測中…':g.slotPhase==='result'?(g.lastSlotAward?`大當り ＋${g.lastSlotAward} 珠`:'再挑戰！'):'三圖相同 · 採礦車派珠',512,751,19);
 c.drawImage(minePins(),0,0);
 // Train artwork and collider move together, exposing the right-shot route.
 c.save();c.beginPath();c.rect(120,270,780,960);c.clip();if(g.time-g.scoreFlash<.4){c.shadowColor='#fff5a5';c.shadowBlur=32;}// Stretch only the AI coal-wagon section; keep the locomotive at its original scale.
 const splitX=170,scale=305/sprites[0].width,frontX=752-152.5+splitX*scale;
 c.drawImage(sprites[0],20,0,splitX-20,300,MINE_TRAIN.left-4+g.trainX,796,frontX-(MINE_TRAIN.left-4),95);
 c.drawImage(sprites[0],splitX,0,sprites[0].width-splitX,300,frontX+g.trainX,796,(sprites[0].width-splitX)*scale,95);c.restore();
 if(g.train==='departing'||g.train==='returning'){for(let i=0;i<16;i++){const age=(g.time*1.3+i*.13)%2,x=825+g.trainX-age*65,y=790-age*100;c.save();c.globalAlpha=(1-age/2)*.4;c.fillStyle='#e4e2cf';c.beginPath();c.ellipse(x,y,10+age*24,8+age*18,0,0,Math.PI*2);c.fill();c.restore();}}
 const cartAge=g.time-g.lastReward,cartGlow=reduced.matches?(g.pendingBalls>0||cartAge<.5?1:0):Math.max(0,1-cartAge/.24);
 c.save();if(cartGlow>0){c.shadowColor='#ffe47b';c.shadowBlur=14+24*cartGlow;c.filter=`brightness(${1+cartGlow*.75})`;}
 art(c,1,g.cartX,278,108,75);c.restore();
 for(const b of g.balls)art(c,2,b.x,b.y,20,20);
 panel(c,225,1250,575,64);text(c,`${g.points.toLocaleString()} 積分 · ${g.exchangeGold} 金幣可兌換`,512,1282,28,'#fff8dc');
 panel(c,252,1322,412,102);
 text(c,g.firing?(g.right?'右打發射中':'左打 '+g.power+' 段'):'旋轉下方旋鈕開始',458,1355,28,'#fff8dc');
 text(c,'停止 ← 左打 1～10 → 右打',458,1395,23,'#ffe49b');
 const dialAngle=(g.firing?(g.right?11:g.power):0)/11*Math.PI*1.5-Math.PI*.75;c.save();c.translate(790,1370);c.rotate(dialAngle);c.strokeStyle='#f7edb0';c.lineWidth=8;c.beginPath();c.moveTo(0,-58);c.lineTo(0,-87);c.stroke();c.restore();
 if(bonus||grand){
  const pulse=reduced.matches?.7:.55+.25*Math.sin(g.time*3);c.save();c.globalAlpha=pulse;c.shadowColor='#ffce38';c.shadowBlur=reduced.matches?0:38;c.strokeStyle='#ffe17b';c.lineWidth=18;c.strokeRect(18,18,988,1500);c.restore();
  if(!reduced.matches)for(let i=0;i<42;i++){const a=i*2.399,t=(g.time*.5+i*.19)%1;c.save();c.globalAlpha=(1-t)*.65;c.fillStyle=i%2?'#ffde5d':'#fff7ce';c.beginPath();c.arc(512+Math.cos(a)*t*700,740+Math.sin(a)*t*1000,2+3*t,0,Math.PI*2);c.fill();c.restore();}
 }
 if(bonus){c.save();c.globalCompositeOperation='screen';const aura=c.createRadialGradient(512,720,270,512,720,900);aura.addColorStop(0,'#ffcc0000');aura.addColorStop(1,'#ffc53666');c.fillStyle=aura;c.fillRect(0,0,1024,1536);for(let i=0;i<40;i++){const side=i%2,x=side?990:34,y=50+Math.floor(i/2)*74;c.shadowColor=['#ffdf68','#91ffe0','#ff9e62'][i%3];c.shadowBlur=20;c.fillStyle=['#ffdf68','#91ffe0','#ff9e62'][(i+(reduced.matches?0:Math.floor(g.time*2)))%3];c.beginPath();c.arc(x,y,7,0,Math.PI*2);c.fill();}c.restore();}
 if(g.train==='gold'){panel(c,250,343,524,108);text(c,'金 礦 時 間 · 右 打 →',512,378,32);text(c,`剩餘 ${Math.ceil(g.goldRemaining)} 秒`,512,423,24);}
 if(g.train==='departing'){panel(c,185,925,654,126);text(c,'列 車 發 車！',512,966,43);text(c,'金礦之門開啟 · 準備右打',512,1018,26);}
 if(winAge<3.5){const big=g.lastSlotAward>=100;panel(c,205,925,614,145);text(c,big?'超・大 當 り':'礦 脈 發 現！',512,970,big?42:32);text(c,`＋${g.lastSlotAward} 顆鋼珠`,512,1030,43);}
 if((grand||bonus)&&!reduced.matches){c.save();c.globalCompositeOperation='screen';for(let i=0;i<16;i++){c.save();c.translate(512,740);c.rotate(g.time*.1+i*Math.PI/8);c.fillStyle='#ffd64515';c.beginPath();c.moveTo(0,0);c.lineTo(-60,-1400);c.lineTo(60,-1400);c.fill();c.restore();}c.restore();}
}
