import {MACHINES,type MachineId} from './machines.ts';
import {LobbyWorld,HALL,paymentLabel} from './lobby-world.ts';
import type {WalletStorage} from './wallet.ts';
import {drawCabinetSprite} from './lobby-sprites.ts';
import {prepareRigArtwork,drawRigAvatar,RIG_ASSETS,type RigArtwork} from './avatar-rendering.ts';
import {WardrobeProfile} from './wardrobe.ts';
import {initWardrobe} from './wardrobe-ui.ts';
import './lobby.css';

const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
export function initLobby(storage:WalletStorage|undefined,enter:(id:MachineId)=>void,blocked:()=>boolean){
 const world=new LobbyWorld(storage),canvas=$<HTMLCanvasElement>('lobby-canvas'),ctx=canvas.getContext('2d')!;
 const picker=$<HTMLDialogElement>('avatar-picker'),play=$<HTMLButtonElement>('lobby-play'),select=$<HTMLSelectElement>('lobby-machine-select');
 let active=false,loaded=false,camera=0,viewWidth=1080,scale=1,selected:MachineId=world.layout.placements[0].id,previousNearby='',error=false;
 const keys=new Set<string>(),images:HTMLImageElement[]=[];
 let artwork:RigArtwork|undefined;

 const wardrobeProfile=new WardrobeProfile(storage),wardrobe=initWardrobe(world,wardrobeProfile,()=>canvas.focus({preventScroll:true}));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const p of world.layout.placements){const m=MACHINES.find(m=>m.id===p.id)!,o=document.createElement('option');o.value=m.id;o.textContent=`${m.name} · ${paymentLabel(m.id)}`;select.append(o);}
 async function load(){
  error=false;$('hall-loading').hidden=false;$('hall-loading-text').textContent='正在點亮遊樂場…';$('hall-retry').hidden=true;
  try{const loadedImages=await Promise.all(['hall','cabinets','headwear',...RIG_ASSETS.map(name=>'rig-v2/'+name)].map(name=>new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=new URL(`./assets/lobby/${name}.png`,document.baseURI).href;})));images.splice(0,images.length,...loadedImages);artwork=prepareRigArtwork(images.slice(3),images[2]);loaded=true;$('hall-loading').hidden=true;}catch(errorDetail){error=true;console.error(errorDetail);$('hall-loading-text').textContent='遊樂場素材尚未載入，請重試。';$('hall-retry').hidden=false;}
 }
 void load();$('hall-retry').addEventListener('click',()=>{if(error)void load();});
 function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;scale=r.height/HALL.height;viewWidth=r.width/scale;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);}
 const observer=new ResizeObserver(resize);observer.observe(canvas);
 function pill(x:number,y:number,w:number,h:number,color:string){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(h/2,14));ctx.fill();}
 function draw(time:number,dt:number){
  if(!active||document.hidden)return;
  const locked=blocked()||picker.open||!loaded;
  if(!locked)world.step(dt,(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0),(keys.has('ArrowDown')||keys.has('s')?1:0)-(keys.has('ArrowUp')||keys.has('w')?1:0));
  const desired=Math.max(0,Math.min(Math.max(0,world.layout.width-viewWidth),world.x-viewWidth*.45));camera+= (desired-camera)*(reduced?1:Math.min(1,dt*9));
  if(!loaded)return;
  wardrobe.draw(artwork!,time,reduced);
  ctx.setTransform(canvas.width/viewWidth,0,0,canvas.height/HALL.height,0,0);ctx.clearRect(0,0,viewWidth,HALL.height);ctx.save();ctx.translate(-camera,0);
  // Alternating reflection shares identical edge pixels: every future section joins cleanly.
  for(let s=Math.max(0,Math.floor(camera/HALL.sectionWidth));s<Math.min(world.layout.sections,Math.ceil((camera+viewWidth)/HALL.sectionWidth));s++){ctx.save();ctx.translate(s*HALL.sectionWidth,0);if(s%2){ctx.translate(HALL.sectionWidth,0);ctx.scale(-1,1);}ctx.drawImage(images[0],0,0,HALL.sectionWidth,HALL.height);ctx.restore();}
  for(const p of world.layout.placements){
   if(p.x<camera-180||p.x>camera+viewWidth+180)continue;
   const near=world.nearby?.id===p.id,m=MACHINES.find(m=>m.id===p.id)!;
   ctx.fillStyle=near?'#ffb64f55':p.section===world.layout.sections-1?'#f8a9c044':'#64cecb44';ctx.beginPath();ctx.ellipse(p.x,466,132,28,0,0,Math.PI*2);ctx.fill();
   ctx.save();ctx.shadowColor=near?'#fff8a8':'#73482644';ctx.shadowBlur=near?20:8;drawCabinetSprite(ctx,images[1],p.art,p.x,465,250,332);ctx.restore();
   pill(p.x-132,83,264,36,near?'#fff5cf':'#ffffffef');ctx.fillStyle='#3b4163';ctx.font='700 19px "Microsoft JhengHei",sans-serif';ctx.textAlign='center';ctx.fillText(m.name,p.x,107);
   if(near){pill(p.x+50,475,100,28,'#ec5d87');ctx.fillStyle='white';ctx.font='700 13px sans-serif';ctx.fillText('開始冒險',p.x+100,494);}
   if(!reduced){const glow=(Math.sin(time*.002+p.art)+1)*.5;ctx.globalAlpha=.25+glow*.4;ctx.fillStyle='#fff1a0';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(p.x-70+i*70,449,3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
  }
  if(world.target){ctx.strokeStyle='#eb6b90';ctx.lineWidth=3;ctx.setLineDash([5,6]);ctx.beginPath();ctx.ellipse(world.target.x,world.target.y,20,7,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  if(world.appearance){
   ctx.fillStyle='#76523c30';ctx.beginPath();ctx.ellipse(world.x,world.y-4,31,10,0,0,Math.PI*2);ctx.fill();
   drawRigAvatar(ctx,artwork!,wardrobeProfile.look(world.appearance.body),world.direction,world.walking,world.walkDistance,world.x,world.y,reduced);
   const labelY=world.y-(wardrobeProfile.look(world.appearance.body).accessory==='none'?160:188);pill(world.x-24,labelY,48,22,'#ffffffed');ctx.fillStyle='#505b7b';ctx.font='700 12px sans-serif';ctx.textAlign='center';ctx.fillText('你',world.x,labelY+16);
  }
  ctx.restore();
  const nearby=world.nearby,key=nearby?.id??'';
  if(key!==previousNearby){previousNearby=key;if(nearby){selected=nearby.id;select.value=selected;}updateCard();}
  if(!locked)play.disabled=!nearby;
  $('hall-position').style.setProperty('--progress',`${Math.min(100,world.x/world.layout.width*100)}%`);
 }
 function updateCard(){const nearby=world.nearby,m=MACHINES.find(m=>m.id===(nearby?.id??selected))!;$('hall-machine-name').textContent=m.name;$('hall-machine-price').textContent=paymentLabel(m.id);$('hall-machine-hint').textContent=nearby?'已到機台前 · 按開始遊玩或 E 鍵':`點選機台，或按「走到這台」前往`;play.disabled=!nearby;}
 function approach(id:MachineId){if(blocked()||picker.open||!world.appearance)return;selected=id;select.value=id;world.approach(id);canvas.focus({preventScroll:true});updateCard();}
 function launch(){if(active&&!blocked()&&!picker.open&&loaded&&world.nearby){world.stop();keys.clear();enter(world.nearby.id);}}
 play.addEventListener('click',launch);
 $('hall-go').addEventListener('click',()=>approach(select.value as MachineId));select.addEventListener('change',()=>{selected=select.value as MachineId;updateCard();});
 for(const [id,direction] of [['hall-prev',-1],['hall-next',1]] as const)$(id).addEventListener('click',()=>{const i=world.layout.placements.findIndex(p=>p.id===selected),next=world.layout.placements[Math.max(0,Math.min(world.layout.placements.length-1,i+direction))];approach(next.id);});
 canvas.addEventListener('pointerdown',event=>{
  if(blocked()||picker.open||!loaded||!world.appearance)return;const r=canvas.getBoundingClientRect(),x=(event.clientX-r.left)/scale+camera,y=(event.clientY-r.top)/scale;
  canvas.focus({preventScroll:true});const p=world.layout.placements.find(p=>Math.abs(p.x-x)<140&&y>=125&&y<515);if(p)approach(p.id);else world.moveTo(x,y);
 });
 function release(){keys.clear();world.stop();}
 window.addEventListener('keydown',event=>{
  if(!active||blocked()||picker.open||!loaded||event.ctrlKey||event.metaKey||event.altKey)return;
  const el=event.target as HTMLElement;if(el?.isContentEditable||['INPUT','TEXTAREA','SELECT','BUTTON'].includes(el?.tagName))return;
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d'].includes(key)){event.preventDefault();keys.add(key);}else if(key==='e'&&!event.repeat){event.preventDefault();launch();}
 });
 window.addEventListener('keyup',event=>{keys.delete(event.key.length===1?event.key.toLowerCase():event.key);if(!keys.size)world.save();});window.addEventListener('blur',release);window.addEventListener('pagehide',release);document.addEventListener('visibilitychange',release);
 $('change-avatar').addEventListener('click',()=>{if(!active||blocked())return;release();openPicker();});
 function openPicker(){wardrobe.open();}
 updateCard();
 return {world,draw,setActive(value:boolean){active=value;release();if(value){resize();camera=Math.max(0,Math.min(world.layout.width-viewWidth,world.x-viewWidth*.45));updateCard();if(!world.appearance)openPicker();}else if(picker.open)picker.close();},focus(){canvas.focus({preventScroll:true});}};
}
