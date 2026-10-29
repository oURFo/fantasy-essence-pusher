import {ThunderForge} from './forge-game.ts';
import {forgeHammerAngle,FORGE_HITS} from './forge-hammer.ts';
import {FORGE_ENERGY_RANGES,FORGE_TIERS,forgeCounter,forgeTier} from './forge-rules.ts';
import {forgeReturnPosition,FORGE_RAIL,FORGE_PINS,FORGE_PORTS,forgeBallPosition,prepareForgePaths} from './forge-physics.ts';
const background=new Image(),board=new Image(),boardSheet=new Image(),sheet=new Image(),fxSheet=new Image(),sprites:HTMLCanvasElement[]=[],boardSprites:HTMLCanvasElement[]=[],effects:HTMLCanvasElement[]=[];let ready:Promise<void>|undefined;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
export function loadForgeArtwork(){return ready??=Promise.all([['cabinet',background],['sprites',sheet],['vfx',fxSheet],['pinball-board',board],['pinball-sprites',boardSheet]].map(async([name,img])=>{const image=img as HTMLImageElement;image.src=new URL(`./assets/thunder-forge/${name}.png`,document.baseURI).href;await image.decode();})).then(()=>{
 sprites.length=0;effects.length=0;
 for(let i=0;i<6;i++){const w=Math.floor(sheet.width/3),h=Math.floor(sheet.height/2),tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;const c=tmp.getContext('2d')!;c.drawImage(sheet,(i%3)*w,Math.floor(i/3)*h,w,h,0,0,w,h);const d=c.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>35){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}if(x1<0)throw Error('Empty forge sprite');const out=document.createElement('canvas');out.width=x1-x0+1;out.height=y1-y0+1;out.getContext('2d')!.drawImage(tmp,x0,y0,out.width,out.height,0,0,out.width,out.height);sprites.push(out);}
 for(let i=0;i<4;i++){const out=document.createElement('canvas');out.width=384;out.height=384;out.getContext('2d')!.drawImage(fxSheet,(i%2)*fxSheet.width/2,Math.floor(i/2)*fxSheet.height/2,fxSheet.width/2,fxSheet.height/2,0,0,384,384);effects.push(out);}
 // Precompute the silver material once, rather than filtering per frame.
 const silver=document.createElement('canvas');silver.width=sprites[3].width;silver.height=sprites[3].height;const sc=silver.getContext('2d')!;sc.filter='grayscale(1) brightness(1.4)';sc.drawImage(sprites[3],0,0);sprites.push(silver);
 boardSprites.length=0;for(let i=0;i<6;i++){const w=boardSheet.width/3,h=boardSheet.height/2,tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;const ctx=tmp.getContext('2d')!;ctx.drawImage(boardSheet,(i%3)*w,Math.floor(i/3)*h,w,h,0,0,w,h);const d=ctx.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>50){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}const out=document.createElement('canvas');out.width=x1-x0+1;out.height=y1-y0+1;out.getContext('2d')!.drawImage(tmp,x0,y0,out.width,out.height,0,0,out.width,out.height);boardSprites.push(out);}prepareForgePaths();
}).catch(e=>{ready=undefined;throw e;});}
function effect(c:CanvasRenderingContext2D,i:number,x:number,y:number,w:number,alpha:number,rotation=0){if(!effects[i]||alpha<=0)return;c.save();c.translate(x,y);c.rotate(rotation);c.globalAlpha=clamp(alpha);c.globalCompositeOperation=i===1?'source-over':'screen';c.drawImage(effects[i],-w/2,-w/2,w,w);c.restore();}
function sprite(c:CanvasRenderingContext2D,i:number,x:number,y:number,w:number,rotation=0,alpha=1){const s=sprites[i];if(!s)return;c.save();c.translate(x,y);c.rotate(rotation);c.globalAlpha=alpha;c.drawImage(s,-w/2,-w*s.height/s.width/2,w,w*s.height/s.width);c.restore();}
function text(c:CanvasRenderingContext2D,s:string,x:number,y:number,size=26,color='#fff0cb'){c.font=`700 ${size}px "Microsoft JhengHei",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#08090d';c.lineWidth=6;c.strokeStyle='#08090dcc';c.strokeText(s,x,y);c.fillStyle=color;c.fillText(s,x,y);}
const palettes=['#ff9d50','#b5e3ff','#ffd36a','#7eeaff'];
function texture(smoke=false){const a=document.createElement('canvas');a.width=a.height=96;const c=a.getContext('2d')!,g=c.createRadialGradient(48,48,0,48,48,48);g.addColorStop(0,smoke?'#bdc4cb66':'#fff8dbff');g.addColorStop(.2,smoke?'#89939b44':'#ffc55cdd');g.addColorStop(.55,smoke?'#5b626533':'#ff622b66');g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(0,0,96,96);return a;}
const fire=texture(),smoke=texture(true);
const clamp=(v:number)=>Math.max(0,Math.min(1,v));const ease=(v:number)=>1-(1-clamp(v))**3;
function halo(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,alpha:number){c.save();c.globalCompositeOperation='screen';c.globalAlpha=alpha;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
function embers(c:CanvasRenderingContext2D,t:number,count:number,power=1){c.save();c.globalCompositeOperation='screen';for(let i=0;i<count;i++){const life=(t*(.27+(i%7)*.024)+i*.618)%1,x=512+Math.sin(i*9.2)*310+Math.sin(life*4+i)*50,y=1040-life*(450+power*180),w=3+(i%4);c.globalAlpha=Math.sin(life*Math.PI)*.65;c.drawImage(fire,x-w*2,y-w*3,w*4,w*6);}c.restore();}
function burst(c:CanvasRenderingContext2D,age:number,power:number){if(age<0||age>1.1)return;c.save();c.globalCompositeOperation='screen';for(let i=0;i<85*power;i++){const a=i*2.39996,speed=130+(i*71)%560,x=512+Math.cos(a)*speed*age,y=900+Math.sin(a)*speed*age+age*age*350;const fade=(1-age/1.1);c.globalAlpha=fade*.9;c.drawImage(fire,x-7,y-7,14+(i%4)*3,14+(i%4)*3);c.strokeStyle=i%3?'#ffb244':'#e5faff';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x-Math.cos(a)*15,y-Math.sin(a)*15);c.stroke();}c.restore();}
function awardCounter(c:CanvasRenderingContext2D,g:ThunderForge){const r=g.result!,t=g.popupElapsed,ready=r.full||t>=g.revealAt,digits=forgeCounter(r.tier,r.payout,r.full?99:t),width=76,gap=10,total=digits.length*(width+gap)-gap,start=512-total/2;
 text(c,r.full?'滿雷電 · 固定最高獎':ready?'本 次 獲 得':'獎 金 抽 選 中',512,1012,29,ready?'#ffe5a1':'#c4ecff');
 digits.forEach((d,i)=>{const x=start+i*(width+gap);c.save();c.fillStyle='#080f19';c.strokeStyle=d.settled?'#efd097':'#719cb8';c.lineWidth=3;c.beginPath();c.roundRect(x,1040,width,108,10);c.fill();c.stroke();c.beginPath();c.rect(x+3,1043,width-6,102);c.clip();if(!reduced.matches||ready){if(d.settled)text(c,String(d.digit),x+width/2,1094,76,'#ffe4a1');else for(let j=-1;j<=1;j++)text(c,String((d.digit+j+10)%10),x+width/2,1094+(j-d.offset)*106,76,'#bde9ff');}else text(c,'?',x+width/2,1094,70,'#bde9ff');c.restore();});
 text(c,'金 幣',512,1191,32);if(ready)text(c,`${FORGE_TIERS[r.tier]}鍛造完成`,512,1244,27,'#ffe3a4');
}
function drawPopupScene(c:CanvasRenderingContext2D,g:ThunderForge){const r=g.result!,t=g.popupElapsed,forging=true,tier=r.tier,color=palettes[tier],motion=!reduced.matches;
 c.drawImage(background,0,0,1024,1536);
 // Real artwork establishes the furnace depth; all mechanisms are separate alpha sprites.
 halo(c,512,746,310,color,.12+tier*.045);
 if(motion){embers(c,g.time,32+tier*7);for(let i=0;i<8;i++){const life=(g.time*.17+i*.127)%1;c.save();c.globalAlpha=(1-life)*.24;c.drawImage(smoke,370+Math.sin(i*3+life*4)*150,930-life*490,100+life*180,110+life*200);c.restore();}}
 if(tier===3)effect(c,2,512,740,640,motion?.22+.06*Math.sin(g.time*1.5):.2,motion?g.time*.08:0);
 const open=forging?ease((t-2.7)/.65):0,doorSize=480;
 // Two solid door leaves retract, revealing the furnace interior underneath.
 if(sprites[1]){const s=sprites[1],h=doorSize*s.height/s.width;c.save();c.globalAlpha=1-open*.9;for(let side=0;side<2;side++){c.drawImage(s,side*s.width/2,0,s.width/2,s.height,512-doorSize/2+side*doorSize+(side?1:-1)*open*125-(side?doorSize/2:0),740-h/2,doorSize/2*(1-open*.65),h);}c.restore();}
 // Molten ore travels along a curved chute into the central forge.
 if(g.phase==='feed'&&t<.9){const p=ease(t/.9),x=170+342*p,y=1010-450*Math.sin(p*Math.PI/2);sprite(c,r!.kind==='energy'?2:3,x,y,92*(1-.45*p),motion?p*3:0,1-clamp((p-.9)*10));if(r!.kind==='energy')halo(c,x,y,85,'#78dfff',.45);}
 if(g.phase==='feed'&&r!.kind==='energy'&&t>.65&&motion){const p=clamp((t-.65)/.55);effect(c,2,512,740,180+p*420,Math.sin(p*Math.PI)*.55,p*.3);}
 if(forging){const pulses=FORGE_HITS,drop=Math.max(...pulses.map(hit=>Math.max(0,1-Math.abs(t-hit)/.08)));for(const hit of pulses){if(motion)burst(c,t-hit,tier===3?1.5:1);}
  if(motion)for(const hit of pulses){const age=t-hit;if(age>=0&&age<.65){const p=age/.65;effect(c,0,512,890,130+ease(p)*(180+tier*120),(1-p)*(.3+tier*.17));effect(c,1,512,840-p*100,180+p*(140+tier*65),(1-p)*(.12+tier*.08));if(tier===3)effect(c,2,512,820,650+ease(p)*180,(1-p)*.7,age*.5);}}
  const retired=ease((t-2.8)/.35),hammer=sprites[0],width=420,height=width*hammer.height/hammer.width,pivotY=900-(height-14);if(t<3.15){c.save();c.globalAlpha=1-retired;c.translate(512,pivotY);c.rotate(forgeHammerAngle(t));c.drawImage(hammer,-width/2,-14,width,height);c.restore();}
  if(t<2.8){sprite(c,2,512,934,80);halo(c,512,923,150,color,.2+drop*.6);}
  if(t>=2.85){const p=ease((t-2.85)/.65),hero=tier===3?5:tier===2?4:tier===1?6:3,heroY=920-p*160;
   halo(c,512,heroY,330,color,.5);if(motion){c.save();c.globalCompositeOperation='screen';c.globalAlpha=.13;for(let i=0;i<18;i++){const a=i*Math.PI/9+g.time*.18;c.fillStyle=i%2?color:'#ffe4a3';c.beginPath();c.moveTo(512,heroY);c.lineTo(512+Math.cos(a)*600,heroY+Math.sin(a)*600);c.lineTo(512+Math.cos(a+.05)*600,heroY+Math.sin(a+.05)*600);c.fill();}c.restore();}
   if(tier>=2)effect(c,tier===3?2:3,512,heroY,590,p*.55,motion?(t-3)*.12:0);
   if(motion&&t<3.7)effect(c,3,512,930,300+p*350,(1-clamp((t-2.85)/.85))*.75);
   sprite(c,hero,512,heroY,180+p*150,motion?Math.sin((t-3)*2)*.035:0,p);
   awardCounter(c,g);
  }
 }else{sprite(c,0,512,420,270);if(r?.kind==='coin'&&g.phase==='feed'&&t>.35){halo(c,512,1050,180,'#ffd660',.5);sprite(c,3,512,1010-Math.sin(clamp((t-.35)/.85)*Math.PI)*50,130);text(c,`＋${r.payout} 金幣`,512,1140,44);}}
 text(c,`${FORGE_TIERS[tier]} · 神器鍛造`,512,137,55);text(c,'T H U N D E R   F O R G E',512,193,21,'#d6b774');
 text(c,t<2.85?'抬槌 · 鍛打 · 熔煉':t<g.revealAt?'數字逐位停下 · 揭曉獎金':'鍛造成果已結算',512,1370,34,color);
 text(c,t<g.revealAt?'品質越高，神器獎表越高':'返回彈珠盤，重新收集雷電',512,1420,23);
 if(motion&&tier===3){for(let side=0;side<2;side++){halo(c,side?906:117,520,85,'#73dfff',.18);}}
}

function prop(c:CanvasRenderingContext2D,i:number,x:number,y:number,w:number,h?:number){const s=boardSprites[i];if(s)c.drawImage(s,x-w/2,y-(h??w*s.height/s.width)/2,w,h??w*s.height/s.width);}
function arc(c:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,time:number,power:number){c.save();c.globalCompositeOperation='screen';c.shadowColor='#61cfff';c.shadowBlur=14;c.strokeStyle='#83dfff';c.lineWidth=power;c.beginPath();c.moveTo(x1,y1);for(let i=1;i<=12;i++){const p=i/12,offset=Math.sin(i*19+time*17)*Math.sin(p*Math.PI)*(10+power*3);c.lineTo(x1+(x2-x1)*p+offset,y1+(y2-y1)*p-offset*.6);}c.stroke();c.shadowBlur=0;c.strokeStyle='#f1ffff';c.lineWidth=Math.max(1,power*.3);c.stroke();c.restore();}
function chargeScene(c:CanvasRenderingContext2D,g:ThunderForge){const r=g.result;if(!r||r.kind!=='energy'||g.phase==='idle')return;const age=g.impactElapsed;if(age<0)return;const n=r.energyAfter,motion=!reduced.matches,power=n<=3?1:n<=6?2:n<=8?3:n===9?4:5,duration=g.chargeDuration,p=clamp(age/duration),envelope=Math.sin(p*Math.PI),portX=FORGE_PORTS[g.path?.port??3],nodeX=161+(Math.max(1,n)-1)*78;
 // A visible charge travels from the hit pocket to the newly filled socket.
 const travel=ease((age-.08)/.65),orbX=portX+(nodeX-portX)*travel,orbY=1080+155*travel-75*Math.sin(travel*Math.PI);
 halo(c,orbX,orbY,40+power*13,'#83e5ff',.7*(1-p));sprite(c,2,orbX,orbY,25+power*10,0,1-p);
 effect(c,2,nodeX,1235,75+power*35,envelope*(.35+power*.07),motion?age*.2:0);
 if(power>=2){for(const side of [0,1]){const x=side?906:118;if(motion)arc(c,x,500,nodeX,1235,age+side,power);halo(c,x,500,80+power*17,'#8ce8ff',envelope*.5);}}
 if(power>=3){effect(c,2,512,740,430+power*80,envelope*(power===5?.42:.22),motion?-age*.18:0);for(let i=0;i<n;i++){const x=161+i*78;halo(c,x,1235,45+power*8,'#b3f3ff',envelope*.5);if(motion&&i<n-1)arc(c,x,1235,x+78,1235,age+i,power*.6);}}
 if(power>=4&&motion){for(let i=0;i<24+power*6;i++){const a=i*2.39996-age*1.8,rad=(1-ease(p))*(180+i%6*45)+45;c.save();c.globalCompositeOperation='screen';c.globalAlpha=envelope*.8;c.drawImage(fire,nodeX+Math.cos(a)*rad-10,1235+Math.sin(a)*rad*.5-10,20,20);c.restore();}}
 if(power>=4){const release=clamp((age-.75)/.95),wave=Math.sin(release*Math.PI);effect(c,2,512,770,650+ease(release)*470,wave*(power===5?.78:.54),motion?-age*.3:0);if(power===5&&motion)effect(c,3,512,1120,450+ease(release)*330,wave*.5);}
 const labels=n<=3?'雷電收集':n<=6?'雷能集聚':n<=8?'高壓共鳴':n===9?'即將滿載':'雷 神 覺 醒';
 if(power===1){text(c,`雷電 ${n} / 10`,512,1190,29,'#b9f3ff');}else{text(c,labels,512,615,power>=4?58:42,'#b9f3ff');text(c,r.energyBefore===10?'雷神級已就緒':`第 ${n} 格雷電點亮`,512,675,32);if(forgeTier(n)>r.tier)text(c,`${FORGE_TIERS[forgeTier(n)]}品質解放`,512,740,43,palettes[forgeTier(n)]);}
}
export function renderForge(g:ThunderForge){const canvas=document.getElementById('game') as HTMLCanvasElement,c=canvas.getContext('2d')!,r=g.result,motion=!reduced.matches,energy=g.displayEnergy,tier=forgeTier(energy),age=g.impactElapsed,active=g.phase==='feed'||g.phase==='forging',charge=g.phase==='feed'&&r?.kind==='energy'&&age>=0;
 c.clearRect(0,0,1024,1536);c.save();
 const strength=charge?Math.max(0,r!.energyAfter-3)*.85*Math.sin(clamp(age/g.chargeDuration)*Math.PI):g.phase==='forging'?g.result!.tier*1.5:0;
 if(motion&&strength>0)c.translate(Math.sin(g.time*48)*strength,Math.cos(g.time*57)*strength*.6);
 c.drawImage(board,0,0,1024,1536);
 // Visible launch channel uses the exact same straight and circular geometry
 // as the constrained rail simulation. The shortened exit shares the rail simulation tangent.
 c.save();c.lineCap='butt';c.lineJoin='round';c.beginPath();c.moveTo(FORGE_RAIL.x,FORGE_RAIL.bottom);c.lineTo(FORGE_RAIL.x,FORGE_RAIL.curveY);c.arc(FORGE_RAIL.cx,FORGE_RAIL.cy,FORGE_RAIL.radius,0,-FORGE_RAIL.angle,true);c.strokeStyle='#cfad6c';c.lineWidth=44;c.stroke();c.strokeStyle='#101a25';c.lineWidth=36;c.stroke();c.strokeStyle='#6c8494';c.lineWidth=2;c.stroke();c.restore();text(c,'出軌',FORGE_RAIL.exitX-40,FORGE_RAIL.exitY-34,20,'#d9e3e8');
 // The visible ladder names actual prize ranges, not a promised fixed return.
 const range=FORGE_ENERGY_RANGES[energy],nextRange=FORGE_ENERGY_RANGES[Math.min(10,energy+1)];
 for(let i=0;i<2;i++){const x=i?530:230,v=i?nextRange:range;c.save();c.fillStyle=i?'#101823ed':'#15384bf2';c.strokeStyle=i?'#9b805a':'#9ee8ff';c.lineWidth=3;c.beginPath();c.roundRect(x,1320,264,110,10);c.fill();c.stroke();text(c,i?`下一格：${Math.min(10,energy+1)}雷電`:`目前：${energy}雷電`,x+132,1347,24,'#d4f1ff');text(c,`${v[0]}～${v[1]} 金幣`,x+132,1386,25,'#ffe4a3');text(c,i&&energy>=9?'滿格自動鍛造':'進鍛造口領獎',x+132,1412,18);c.restore();}
 // Tier aura lives at the perimeter and leaves the ball field readable.
 if(energy>=6){halo(c,100,650,130,palettes[tier],.18);halo(c,920,650,130,palettes[tier],.18);}if(energy>=9)effect(c,2,512,760,750,.09,motion?g.time*.035:0);
 for(const pin of FORGE_PINS)prop(c,1,pin.x,pin.y,29,29);
 const labels=['回收','金幣','雷電','鍛造','雷電','金幣','回收'];
 FORGE_PORTS.forEach((x,i)=>{const target=i===3?4:i===2||i===4?2:i===1||i===5?3:5;prop(c,target,x,1080,i===3?110:93,112);text(c,labels[i],x,1163,25,i===2||i===4?'#a0eaff':i===3?'#ffd08c':'#e6ddc9');if(active&&age>=0&&g.path?.port===i){halo(c,x,1070,85,palettes[r!.tier],.5);text(c,r!.kind==='coin'?`＋${r!.payout}`:r!.kind==='energy'?'＋雷電':r!.kind==='forge'?'啟動！':'回收',x,1008,30,r!.kind==='slag'?'#c0c3c9':'#fff0b2');}});
 if(active&&g.path&&age<.18){const b=forgeBallPosition(g.path,Math.min(g.elapsed,g.arrival)),scale=age<0?1:1-clamp(age/.18);c.save();c.fillStyle='#0009';c.beginPath();c.ellipse(b.x+5,b.y+9,16*scale,9*scale,0,0,Math.PI*2);c.fill();c.shadowColor='#000b';c.shadowBlur=5;prop(c,0,b.x,b.y,34*scale);c.restore();}
 // Empty and occupied physical sockets make every collected charge visible.
 for(let i=0;i<10;i++){const x=161+i*78;c.save();c.fillStyle='#0a1521';c.strokeStyle=i<energy?'#64cfff':'#53616e';c.lineWidth=i<energy?3:2;c.beginPath();c.roundRect(x-30,1205,60,65,9);c.fill();c.stroke();if(i<energy){halo(c,x,1235,45,'#60cfff',.3);sprite(c,2,x,1235,47);}text(c,String(i+1),x,1293,18,i<energy?'#d9f7ff':'#9eabb5');c.restore();}
 text(c,'雷 神 鍛 造',512,133,62);text(c,'追逐雷電 · 一珠啟動神器',512,190,24,'#cecbbe');
 if(g.phase==='returning'){const b=forgeReturnPosition(g.power,g.elapsed);prop(c,0,b.x,b.y,34);text(c,'力道不足 · 鋼珠回落 · 未扣款',512,680,35,'#e5c897');}
 if(active&&age>=0&&r?.kind==='coin'){const travel=ease(age/.85);for(let i=0;i<5;i++){const p=clamp(travel-i*.07),x=FORGE_PORTS[g.path!.port]+(904-FORGE_PORTS[g.path!.port])*p,y=1060-860*p-Math.sin(p*Math.PI)*100;halo(c,x,y,22,'#ffd265',(1-p)*.7);text(c,'◈',x,y,28,'#ffd477');}text(c,`金幣口 ＋${r.payout} 金幣`,512,640,48,'#ffe5a8');}
 if(charge)chargeScene(c,g);c.restore();
 // Forging exists only as a floating, tier-scaled stage after the central pocket.
 if(g.phase==='forging'){const t=g.popupElapsed,end=g.forgeDuration,enter=reduced.matches?1:ease(t/.35),leave=reduced.matches?1:1-ease((t-(end-.35))/.35),scale=(.73+r!.tier*.065)*(.88+.12*enter)*leave;
  c.save();c.fillStyle=`rgba(1,5,12,${.78*enter*leave})`;c.fillRect(0,0,1024,1536);c.translate(512,780);c.scale(Math.max(.01,scale),Math.max(.01,scale));c.translate(-512,-768);c.shadowColor=palettes[r!.tier];c.shadowBlur=28;c.fillStyle='#101118';c.strokeStyle=palettes[r!.tier];c.lineWidth=7;c.beginPath();c.roundRect(-5,-5,1034,1546,28);c.fill();c.stroke();c.shadowBlur=0;c.save();c.beginPath();c.roundRect(0,0,1024,1536,24);c.clip();drawPopupScene(c,g);c.restore();c.restore();
 }
}
