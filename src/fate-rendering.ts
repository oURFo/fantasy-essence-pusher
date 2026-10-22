import {FateOrbit} from './fate-game.ts';
import {FATE_LANES,FATE_LEVELS,FATE_PINS,DISC,discHolePosition} from './fate-rules.ts';
import {fateObstacles} from './fate-physics.ts';
const sources=['cabinet','sprites'],images=sources.map(()=>new Image()),sprites:HTMLCanvasElement[]=[];let ready:Promise<void>|undefined;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
export function loadFateArtwork(){if(!ready){images.forEach((im,i)=>im.src=new URL(`./assets/fate-orbit/${sources[i]}.png`,document.baseURI).href);ready=Promise.all(images.map(im=>im.decode())).then(()=>{
 const regions=[[0,0,570,560],[600,0,450,560],[1060,0,476,560],[0,560,570,464],[600,560,400,464],[1000,560,536,464]];
 for(const [x,y,w,h] of regions){const ratio=images[1].naturalWidth/1536,c=document.createElement('canvas');c.width=w*ratio;c.height=h*ratio;const ctx=c.getContext('2d')!;ctx.drawImage(images[1],x*ratio,y*ratio,w*ratio,h*ratio,0,0,c.width,c.height);const pixels=ctx.getImageData(0,0,c.width,c.height).data;let l=c.width,r=0,t=c.height,b=0;for(let yy=0;yy<c.height;yy++)for(let xx=0;xx<c.width;xx++)if(pixels[(yy*c.width+xx)*4+3]>96){l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,yy);b=Math.max(b,yy);}const crop=document.createElement('canvas');crop.width=r-l+1;crop.height=b-t+1;crop.getContext('2d')!.drawImage(c,l,t,crop.width,crop.height,0,0,crop.width,crop.height);sprites.push(crop);}
 }).catch(e=>{ready=undefined;throw e;});}return ready;}
function label(c:CanvasRenderingContext2D,s:string,x:number,y:number,size=22,color='#f4e4b9'){c.font=`600 ${size}px "Microsoft JhengHei",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(s,x,y);}
function art(c:CanvasRenderingContext2D,id:number,x:number,y:number,w:number,h=w){c.drawImage(sprites[id],x-w/2,y-h/2,w,h);}
function rollingBall(c:CanvasRenderingContext2D,x:number,y:number,size:number,angle:number){c.save();c.fillStyle='#0008';c.beginPath();c.ellipse(x+size*.12,y+size*.33,size*.42,size*.17,0,0,Math.PI*2);c.fill();c.translate(x,y);c.rotate(angle);art(c,3,0,0,size);c.restore();}
function discScene(c:CanvasRenderingContext2D,g:FateOrbit,level:number,r:number){
 const active=(g.phase==='disc'||g.phase==='drain')&&g.level===level,angle=g.plateAngles[level],config=FATE_LEVELS[level];
 c.save();c.rotate(angle);if(active){c.shadowColor=config.color;c.shadowBlur=22;}art(c,0,0,0,r*2);c.restore();
 for(let i=0;i<config.holes;i++){const p=discHolePosition(config.holes,i,angle);art(c,i===0?1:2,p.x*r,p.y*r,DISC.holeRadius*r*2.4);}
 if(active&&g.disc){const b=g.disc,fall=g.phase==='drain'?Math.max(0,1-(g.time-g.phaseAt)/.9):1;rollingBall(c,b.x*r,b.y*r,Math.max(18,DISC.ballRadius*r*2)*fall,b.angle*3);}
}
const project=(x:number,y:number)=>({x:512+x*106,y:1260-y*84});
function beam(c:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,width=3){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
export const FATE_DISC_VIEW=[{x:310,y:145,r:112},{x:310,y:345,r:138},{x:310,y:565,r:165},{x:310,y:810,r:190}];
export function renderFate(g:FateOrbit){
 const canvas=document.getElementById('game') as HTMLCanvasElement,c=canvas.getContext('2d')!;c.drawImage(images[0],0,0,1024,1536);
 label(c,'命 運 星 軌',512,163,52);label(c,'ORBIT OF FATE',512,209,18,'#b9d6dc');label(c,`本機積分 ${g.points.toLocaleString()}　·　可兌換 ${g.exchangeGold} 金幣`,512,282,23);
 for(let i=1;i<9;i++){const p=project(-3.6+i*.8,9.925);c.save();c.translate(p.x,p.y);c.rotate(Math.PI/2);art(c,5,0,0,96,7);c.restore();}
 for(let i=0;i<9;i++){const x=512+(-3.2+i*.8)*106,selected=g.lastLane===i,red=FATE_LANES[i]==='fate';c.save();if(selected){c.shadowColor=red?'#ffde7e':'#8ce5df';c.shadowBlur=25;}art(c,red?1:2,x,420,76,65);c.restore();label(c,red?'命運':FATE_LANES[i]===0?'OUT':`${FATE_LANES[i]}分`,x,361,23,red?'#ffde8d':'#dcf2ed');}
 for(const pin of FATE_PINS){const p=project(pin.x,pin.y);art(c,4,p.x,p.y,28,25);}
 for(const o of fateObstacles(g.time*.5)){const p=project(o.x,o.y);c.save();c.translate(p.x,p.y);if(o.kind==='rotor')art(c,4,0,0,o.radius*212,o.radius*168);else{c.rotate(-o.angle);art(c,5,0,0,(o.half*2+o.radius*2)*106,o.radius*168);}c.restore();}
 if(g.ball){if(!reduced.matches)for(let i=1;i<g.ball.trail.length;i++){const p=project(g.ball.trail[i].x,g.ball.trail[i].y);c.save();c.globalAlpha=.25*(1-i/8);art(c,3,p.x,p.y,24);c.restore();}const p=project(g.ball.x,g.ball.y);rollingBall(c,p.x,p.y,38,g.time*2.5);}
 if(!g.inputLocked){const a=g.angle*Math.PI/180,start=project(0,.65),end=project(Math.sin(a)*2,.65+Math.cos(a)*2);c.save();c.setLineDash([10,12]);beam(c,start.x,start.y,end.x,end.y,'#b6e9e5aa',3);c.restore();rollingBall(c,start.x,start.y,38,0);}
 const base=project(0,.2);c.save();c.translate(base.x,base.y);c.rotate(-Math.PI/2-g.angle*Math.PI/180);art(c,5,35,0,115,34);c.restore();
 label(c,g.message.length>31?g.message.slice(0,31)+'…':g.message,512,1437,23);label(c,'每球 3 金幣 · 10 積分兌換 1 金幣',512,1474,18,'#c8c4aa');
 if(g.phase==='portal'){const t=Math.min(1,(g.time-g.phaseAt)/1.15),p=project(0,10);c.save();c.shadowColor='#ffd86c';c.shadowBlur=40;c.strokeStyle=`rgba(255,219,121,${1-t})`;c.lineWidth=12;c.beginPath();c.arc(p.x,p.y,50+t*145,0,Math.PI*2);c.stroke();const y=p.y-t*240;art(c,3,p.x,y,32+Math.sin(t*Math.PI)*15);label(c,'命 運 之 門 開 啟',512,590,38,'#ffe8a4');label(c,'保底 51 積分 · 挑戰 9,999 積分',512,644,24,'#fff1c9');c.restore();}
 if(g.phase==='result'&&g.time-g.phaseAt<1.5&&!reduced.matches){const age=(g.time-g.phaseAt)/1.5;c.save();c.globalAlpha=(1-age)*.5;c.strokeStyle=g.lastAward===9999?'#ffdc75':'#99e3de';c.lineWidth=14;c.strokeRect(25,25,974,1486);c.restore();}
 if((g.phase==='disc'||g.phase==='drain')&&g.disc){c.fillStyle='#081b29ed';c.fillRect(105,492,814,790);label(c,`第 ${g.level+1} 層 · ${FATE_LEVELS[g.level].name}`,512,555,35);c.save();c.translate(512,850);c.scale(1,.78);discScene(c,g,g.level,340);c.restore();label(c,g.phase==='drain'?'星珠落入洞口…':g.disc.radius>.4?'星珠緩緩繞行，逐漸靠近圓心':'接近洞口！紅洞晉級 · 白洞得分',512,1170,27,'#ffe2a0');label(c,`本層保底 ${g.minimum} 積分`,512,1220,24);}
 renderFateDiscs(g);
}
function renderFateDiscs(g:FateOrbit){
 const canvas=document.getElementById('fate-disc-canvas') as HTMLCanvasElement,c=canvas.getContext('2d')!;c.clearRect(0,0,620,980);const bg=c.createLinearGradient(0,0,620,980);bg.addColorStop(0,'#102c38');bg.addColorStop(1,'#100f21');c.fillStyle=bg;c.fillRect(0,0,620,980);
 for(let level=3;level>=0;level--){const v=FATE_DISC_VIEW[level],config=FATE_LEVELS[level],active=g.phase==='disc'&&g.level===level,angle=g.plateAngles[level];
  c.save();c.translate(v.x,v.y);c.scale(1,.61);discScene(c,g,level,v.r);
  c.restore();label(c,`${level+1}F`,63,v.y-12,24,config.color);label(c,`${config.holes} 洞`,63,v.y+18,17,'#c0c9d2');label(c,`${config.min}～`,552,v.y-12,18,config.color);label(c,`${config.max}分`,552,v.y+15,18,config.color);label(c,config.name,v.x,v.y-v.r*.61-22,19,config.color);
  if(g.results[level]!==null){label(c,g.results[level]===0?'紅洞晉級':'本層獲獎',v.x,v.y+v.r*.61+19,20,g.results[level]===0?'#ffcf82':'#e4f5ef');}
 }
 if(g.phase==='portal'||g.phase==='transfer'){const from=g.phase==='portal'?{x:310,y:25}:FATE_DISC_VIEW[g.level],to=FATE_DISC_VIEW[g.phase==='portal'?0:g.level+1],duration=g.phase==='portal'?1.15:1.4,t=Math.min(1,(g.time-g.phaseAt)/duration);c.save();c.shadowColor='#ffd575';c.shadowBlur=20;beam(c,from.x,from.y,to.x,to.y,'#ffda82',5);art(c,3,from.x+(to.x-from.x)*t,from.y+(to.y-from.y)*t,20);c.restore();}
 if(g.phase==='result'&&g.lastAward){const age=g.time-g.phaseAt;c.fillStyle='#09131fe8';c.fillRect(75,392,470,156);label(c,g.lastAward===9999?'天 命 大 獎':g.lastLane===4?'星 盤 獎 勵':'射 擊 得 分',310,428,28,'#ffdc91');label(c,`+ ${g.lastAward.toLocaleString()} 積分`,310,492,39,'#fff0b9');if(g.lastAward===9999&&age<7&&!reduced.matches){for(let i=0;i<64;i++){const life=(age+i*.071)%3.7,a=i*2.399,x=310+Math.cos(a)*life*110,y=440+Math.sin(a)*life*90+life*life*35;c.save();c.globalAlpha=1-life/3.7;c.fillStyle=['#ffd978','#8bd9f5','#c7acff'][i%3];c.fillRect(x,y,5,8);c.restore();}}}
 label(c,'紅洞晉級 · 白洞得分 · 四紅連通 9,999 分',310,952,20,'#ead5ad');
}
