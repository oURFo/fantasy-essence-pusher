import {FruitPinball} from './fruit-game.ts';
import {FRUIT_CELLS,FRUIT_RECIPES,FRUIT_BALLS} from './fruit-rules.ts';
import {FRUIT_PINS,FIELD} from './fruit-physics.ts';
import {FRUIT_TARGETS} from './fruit-board.ts';
const sources=['fruit-banquet/cabinet.png','fruit-banquet/fruits.png','sprites.png','green-bead.png','prize-gates.png','fruit-banquet/hardware-cutout.png'];
const images=sources.map(()=>new Image());let ready:Promise<void>|undefined;
let background:HTMLCanvasElement,pearl:HTMLCanvasElement,pin:HTMLCanvasElement,body:HTMLCanvasElement,knob:HTMLCanvasElement,pocket:HTMLCanvasElement;
const icons:HTMLCanvasElement[][]=[];const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
function bitmap(w:number,h:number,paint:(c:CanvasRenderingContext2D)=>void){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;paint(canvas.getContext('2d')!);return canvas;}
export function loadFruitArtwork(){
 if(!ready){images.forEach((img,i)=>img.src=new URL(`./assets/${sources[i]}`,document.baseURI).href);ready=Promise.all(images.map(img=>img.decode())).then(()=>{
  background=bitmap(1024,1700,c=>c.drawImage(images[0],0,0,1024,1700));
  pearl=bitmap(40,40,c=>{c.filter='saturate(0) brightness(1.8)';c.drawImage(images[3],0,0,40,40);});
  body=bitmap(64,240,c=>c.drawImage(images[5],164,15,216,992,0,0,64,240));
  knob=bitmap(48,188,c=>c.drawImage(images[5],653,102,195,765,0,0,48,188));
  pocket=bitmap(320,150,c=>c.drawImage(images[5],1020,286,492,443,0,0,320,150));
  const a=images[2].naturalWidth/1280;pin=bitmap(30,30,c=>c.drawImage(images[2],770*a,230*a,330*a,330*a,0,0,30,30));
  for(let fruit=0;fruit<36;fruit++){icons[fruit]=[0,1].map(lit=>bitmap(80,80,c=>{c.filter=lit?'none':'grayscale(.4) brightness(.55)';const sw=images[1].naturalWidth/6,sh=images[1].naturalHeight/6;c.drawImage(images[1],fruit%6*sw,Math.floor(fruit/6)*sh,sw,sh,0,0,80,80);}));}
 }).catch(e=>{ready=undefined;throw e;});}return ready;
}
function label(c:CanvasRenderingContext2D,text:string,x:number,y:number,size=22,color='#f8e6b0',align:CanvasTextAlign='center'){c.font=`600 ${size}px "Segoe UI","Microsoft JhengHei",sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(text,x,y);}
function plate(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,lit=false){c.fillStyle=lit?'#28563fef':'#171021e8';c.strokeStyle=lit?'#ffdc80':'#ab805a88';c.lineWidth=lit?2.5:1;c.beginPath();c.roundRect(x,y,w,h,9);c.fill();c.stroke();}
function fruit(c:CanvasRenderingContext2D,id:number,x:number,y:number,size:number,lit:boolean){c.drawImage(icons[id][lit?1:0],x-size/2,y-size/2,size,size);}
export function renderFruit(game:FruitPinball){
 const canvas=document.getElementById('game') as HTMLCanvasElement;if(canvas.width!==1024||canvas.height!==1700){canvas.width=1024;canvas.height=1700;}const c=canvas.getContext('2d')!;
 c.drawImage(background,0,0);label(c,'水 果 星 宴',512,197,43);label(c,'FRUIT CELESTIAL BANQUET',512,232,15,'#dac49b');
 label(c,`十五道星宴配方 · 完成 ${game.completed.length} / 15 · 依完成組合數發獎`,512,285,21);
 for(const r of FRUIT_RECIPES){const x=105+r.id%3*274,y=316+Math.floor(r.id/3)*73,done=r.slots.every(s=>game.mask&(1<<s)),age=game.time-game.recipeTimes[r.id];
  plate(c,x,y,266,66,done);label(c,String(r.id+1).padStart(2,'0'),x+16,y+12,11,'#b79884');
  for(let j=0;j<3;j++){const age=game.time-game.hitTimes[r.slots[j]],pulse=!reduced.matches&&age>=0&&age<.7?1+.2*Math.sin(age/.7*Math.PI):1;fruit(c,r.fruits[j],x+39+j*58,y+34,43*pulse,Boolean(game.mask&(1<<r.slots[j])));if(j<2)label(c,'+',x+68+j*58,y+34,16,'#9b887d');}
  label(c,done?'✓ 完成':`${r.slots.filter(s=>game.mask&(1<<s)).length} / 3`,x+220,y+34,18,done?'#fff0b6':'#c6af9d');
  if(age>=0&&age<1.1&&!reduced.matches){c.save();c.globalAlpha=Math.max(0,1-age/1.1);c.strokeStyle='#ffe39a';c.lineWidth=4;c.strokeRect(x-3,y-3,272,72);c.restore();}
 }
 label(c,game.phase==='playing'?`彈珠 ${game.landed} / ${FRUIT_BALLS} 已落定`:'16 顆彈珠 · 每局 20 金幣',512,716,23,'#f3dfad');
 for(const peg of FRUIT_PINS)c.drawImage(pin,peg.x-11,peg.y-11,22,22);
 // Fruits are printed directly above the corresponding physical pocket.
 for(const target of FRUIT_TARGETS){const cell=FRUIT_CELLS[target.id],lit=Boolean(game.mask&(1<<cell.id)),age=game.time-game.hitTimes[cell.id],w=target.right-target.left;
  c.drawImage(pocket,target.x-(w+12)/2,target.y-18,w+12,38);
  if(age>=0&&age<1){c.save();c.globalAlpha=(1-age)*.5;c.strokeStyle='#ffe7a2';c.lineWidth=3;c.beginPath();c.ellipse(target.x,target.y,w/2+9,25,0,0,Math.PI*2);c.stroke();c.restore();}
  const size=cell.fruits.length===3?40:44,spacing=cell.fruits.length===3?42:48;
  if(lit){c.fillStyle='#81dba333';c.strokeStyle='#c7edb3';c.lineWidth=1.5;c.beginPath();c.ellipse(target.x,target.y-48,cell.fruits.length*spacing/2+6,27,0,0,Math.PI*2);c.fill();c.stroke();}
  for(let j=0;j<cell.fruits.length;j++)fruit(c,cell.fruits[j],target.x+(j-(cell.fruits.length-1)/2)*spacing,target.y-48,size,true);
  label(c,`${lit?'✓ ':''}${String(cell.id+1).padStart(2,'0')}${game.gifts.includes(cell.id)?' · 贈':''}`,target.x,target.y+34,14,lit?'#ffe38d':'#dbc7a4');
 }
 // The shooter lane and curved guide use the existing AI-painted gold rail.
 const gates=images[4],gs=gates.naturalWidth/2048;
 for(const x of [908,962])c.drawImage(gates,879*gs,160*gs,30*gs,365*gs,x-3,770,6,650);
 for(let i=0;i<14;i++){const a=-i/13*Math.PI/2;c.save();c.translate(FIELD.arcX+Math.cos(a)*58,FIELD.arcY+Math.sin(a)*58);c.rotate(a);c.drawImage(gates,879*gs,160*gs,30*gs,365*gs,-3,-5,6,10);c.restore();}
 for(const ball of game.balls){
  if(!reduced.matches)for(let i=1;i<ball.trail.length;i++){const t=ball.trail[i];c.save();c.globalAlpha=.18*(1-i/6);c.drawImage(pearl,t.x-11,t.y-11,22,22);c.restore();}
  c.drawImage(pearl,ball.x-12,ball.y-12,24,24);
 }
 for(const landing of game.landings){const age=(game.time-landing.time)/.35,size=22*(1-age);c.save();c.globalAlpha=1-age;c.drawImage(pearl,landing.x-size/2,landing.y-7+age*17,size,size);c.restore();}
 if(game.canLaunch)c.drawImage(pearl,FIELD.launcherX-12,FIELD.launcherY-12,24,24);
 c.drawImage(body,903,1430,64,200);c.drawImage(knob,914,1481+game.pullPower*60,43,154);
 label(c,`${Math.round(game.pullPower*100)}%`,935,1380,19,'#ffe2a1');label(c,'拉把',935,1352,18);label(c,'↓ 拉下',935,1674,16);
 const fresh=game.time-game.flashAt;
 if(fresh>=0&&fresh<1&&!reduced.matches){c.save();c.globalAlpha=(1-fresh)*(.22+.18*Math.sin(fresh*30));c.strokeStyle='#ffe59c';c.lineWidth=14;c.strokeRect(50,50,924,1600);c.restore();}
 const announcement=game.phase==='idle'?'點擊「開始星宴」，展開十六顆彈珠的旅程':game.lastSlot<0?'使用右下拉把，逐顆發射彈珠':game.duplicate?`第 ${game.lastSlot+1} 格重複命中 · 水果進度不變`:`第 ${game.lastSlot+1} 格點亮 · 對應配方已更新`;
 label(c,announcement,512,1612,21);label(c,'力道影響實際落點 · 三個不同水果格完成配方',512,1648,15,'#c2ab91');
 if(game.gifts.length&&game.time-game.startedAt<2.2){plate(c,180,845,664,100,true);label(c,'精 靈 贈 禮',512,874,29,'#ffe2f0');label(c,`開局贈送 ${game.gifts.length} 格：${game.gifts.map(i=>String(i+1).padStart(2,'0')).join(' · ')}`,512,919,23);}
 if(game.phase==='result'){
  const t=game.time-game.resultAt,large=game.payout>=40;
  if(large&&t<7&&!reduced.matches)for(let i=0;i<64;i++){const a=i*2.399,life=(t+i*.09)%3.8,x=512+Math.cos(a)*life*180,y=900+Math.sin(a)*life*140+life*life*28;c.save();c.globalAlpha=Math.max(0,1-life/3.8);c.fillStyle=['#ffd979','#ff93be','#aff0cf'][i%3];c.translate(x,y);c.rotate(a+t);c.fillRect(-5,-3,10,6);c.restore();}
  c.fillStyle='#100b19bc';c.fillRect(120,744,784,498);plate(c,150,770,724,440,game.payout>0);
  label(c,game.payout>=1000?'星 宴 大 滿 貫':large?'璀 璨 星 宴 大 獎':game.payout?'星 宴 配 方 完 成':'本 次 星 宴 結 束',512,827,36);
  label(c,`完成 ${game.completed.length} 組合 · 對應本局獎項`,512,883,25,'#d5c4a6');
  const count=reduced.matches?game.payout:Math.round(game.payout*Math.min(1,t/1.5));label(c,`+ ${count} 金幣`,512,964,65,large?'#fff0a2':'#d6f4dc');
  label(c,game.payout?`總賠率 ${(game.payout/20).toFixed(2)}× · 獎勵已加入共用金幣`:'未達 3 道配方，本局不發放獎勵',512,1030,23);
  label(c,game.progress.streak>=3?'下局開場將觸發精靈贈格':`連續未觸發賠率：${game.progress.streak} 場`,512,1090,23,'#e9b6d0');
  label(c,'按「再開一局」繼續 · 每局 20 金幣',512,1155,22,'#f7dfb2');
 }
}
